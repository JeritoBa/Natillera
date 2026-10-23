using Natillera.Backend.Application.Audit;
using Natillera.Backend.Application.Common;
using Natillera.Backend.Application.Transactions;
using Natillera.Backend.Application.Users;
using Natillera.Backend.Domain.Entities;
using Natillera.Backend.Domain.Enums;
using Natillera.Backend.Domain.Exceptions;

namespace Natillera.Backend.Application.Activities;

public sealed class ActivityService(
    IUserRepository memberReader,
    IActivityRepository activityRepository,
    ITransactionRepository transactionRepository,
    ILogRepository logRepository,
    IUnitOfWork unitOfWork)
{
    public async Task<IReadOnlyCollection<ActivityListItem>> GetListAsync(SavingPeriod period, CancellationToken cancellationToken)
    {
        var activities = await activityRepository.GetListAsync(period.Id, cancellationToken);
        return activities
            .Select(activity => new ActivityListItem(
                activity.Id,
                activity.Name,
                activity.Description,
                activity.Quantity,
                activity.UnitCost,
                activity.UnitSalePrice,
                activity.Quantity * activity.UnitCost,
                activity.AssignedQuantity,
                activity.Quantity - activity.AssignedQuantity,
                activity.StartDate,
                activity.Status))
            .ToArray();
    }

    public async Task<ActivityDetailResponse?> GetDetailAsync(Guid id, SavingPeriod period, CancellationToken cancellationToken)
    {
        var activity = await activityRepository.GetDetailAsync(id, period.Id, cancellationToken);
        return activity is null ? null : ToDetail(activity);
    }

    public async Task<ActivityAssignmentResponse?> GetAssignmentAsync(Guid activityId, Guid assignmentId, SavingPeriod period, CancellationToken cancellationToken)
    {
        var activity = await GetDetailAsync(activityId, period, cancellationToken);
        return activity?.Assignments.FirstOrDefault(assignment => assignment.Id == assignmentId);
    }

    public async Task<IReadOnlyCollection<ExtraCostResponse>?> GetExtraCostsAsync(Guid activityId, SavingPeriod period, CancellationToken cancellationToken)
    {
        var activity = await GetDetailAsync(activityId, period, cancellationToken);
        return activity?.ExtraCosts;
    }

    public async Task<ExtraCostResponse?> GetExtraCostAsync(Guid activityId, Guid extraCostId, SavingPeriod period, CancellationToken cancellationToken)
    {
        var activity = await GetDetailAsync(activityId, period, cancellationToken);
        return activity?.ExtraCosts.FirstOrDefault(cost => cost.Id == extraCostId);
    }

    public async Task<ActivityDetailResponse> CreateActivityAsync(ActivityRequest request, Guid performedByUserId, SavingPeriod period, CancellationToken cancellationToken)
    {
        var transaction = new Transaction(
            request.Quantity * request.UnitCost,
            TransactionDirection.Expense,
            TransactionType.Activity,
            ActivityDescription(request.Name),
            period.Id);
        var activity = new Activity(request.Name, request.Description, request.Quantity, request.UnitCost,
            request.UnitSalePrice, ToUtcDate(request.StartDate), transaction.Id, period);

        await unitOfWork.ExecuteInTransactionAsync(async ct =>
        {
            CashGuard.EnsureAvailable(await transactionRepository.GetAvailableMoneyAsync(period.Id, ct), activity.TotalCost()); // FIN-13
            await transactionRepository.AddAsync(transaction, ct);
            await activityRepository.AddAsync(activity, ct);
            await logRepository.AddAsync(
                new Log(performedByUserId, LogEntityType.Activity, activity.Id, LogAction.Create, activity.SavingPeriodId, null, activity.TotalCost()),
                ct);
        }, cancellationToken);

        return ToDetail(activity);
    }

    public async Task<ActivityDetailResponse> UpdateActivityAsync(Guid activityId, ActivityRequest request, Guid performedByUserId, SavingPeriod period, CancellationToken cancellationToken)
    {
        var activity = await GetActivityForUpdateAsync(activityId, period, cancellationToken);

        await unitOfWork.ExecuteInTransactionAsync(async ct =>
        {
            var available = await transactionRepository.GetAvailableMoneyAsync(activity.SavingPeriodId, ct);
            var oldAmount = activity.TotalCost();
            activity.UpdateDetails(request.Name, request.Description, request.Quantity, request.UnitCost,
                request.UnitSalePrice, ToUtcDate(request.StartDate), period);
            CashGuard.EnsureAvailable(available, activity.TotalCost() - oldAmount); // FIN-13
            activity.Transaction.Update(activity.TotalCost(), TransactionDirection.Expense, TransactionType.Activity,
                ActivityDescription(activity.Name));
            activity.RefreshStatus();
            await logRepository.AddAsync(
                new Log(performedByUserId, LogEntityType.Activity, activity.Id, LogAction.Update, activity.SavingPeriodId, oldAmount, activity.TotalCost()),
                ct);
        }, cancellationToken);

        return ToDetail(activity);
    }

    public async Task CancelActivityAsync(Guid activityId, Guid performedByUserId, SavingPeriod period, CancellationToken cancellationToken)
    {
        var activity = await GetActivityForUpdateAsync(activityId, period, cancellationToken);

        await unitOfWork.ExecuteInTransactionAsync(async ct =>
        {
            var oldAmount = activity.TotalCost();
            activity.Cancel();
            activity.Transaction.Cancel();
            await logRepository.AddAsync(
                new Log(performedByUserId, LogEntityType.Activity, activity.Id, LogAction.Delete, activity.SavingPeriodId, oldAmount, null),
                ct);
        }, cancellationToken);
    }

    public async Task<ActivityAssignmentResponse> CreateAssignmentAsync(Guid activityId, ActivityAssignmentRequest request, Guid performedByUserId, SavingPeriod period, CancellationToken cancellationToken)
    {
        var activity = await GetActivityForUpdateAsync(activityId, period, cancellationToken);
        var member = await GetActiveMemberAsync(request.UserId, cancellationToken);
        ActivityAssignment? assignment = null;

        await unitOfWork.ExecuteInTransactionAsync(async ct =>
        {
            assignment = activity.AddAssignment(request.QuantityAssigned, member.Id);
            await activityRepository.AddAssignmentAsync(assignment, ct);
            activity.RefreshStatus();
            await logRepository.AddAsync(
                new Log(performedByUserId, LogEntityType.ActivityAssignment, assignment.Id, LogAction.Create, activity.SavingPeriodId, null,
                    SaleAmount(activity, assignment)),
                ct);
        }, cancellationToken);

        return ToAssignment(assignment!, MemberName(member), activity.UnitSalePrice);
    }

    public async Task<ActivityAssignmentResponse> UpdateAssignmentAsync(Guid activityId, Guid assignmentId, ActivityAssignmentUpdateRequest request, Guid performedByUserId, SavingPeriod period, CancellationToken cancellationToken)
    {
        var status = GetAssignmentStatus(request);
        var activity = await GetActivityForUpdateAsync(activityId, period, cancellationToken);
        var assignment = FindAssignment(activity, assignmentId);

        if (assignment.Status == AssignmentStatus.Paid && status == AssignmentStatus.Pending)
            throw new DomainException("Paid assignments cannot return to pending.");
        if (assignment.Status != AssignmentStatus.Pending)
            throw new DomainException("Only pending assignments can be modified.");

        await unitOfWork.ExecuteInTransactionAsync(async ct =>
        {
            var oldAmount = SaleAmount(activity, assignment);
            activity.UpdateAssignmentQuantity(assignment, request.QuantityAssigned);
            if (status == AssignmentStatus.Paid)
            {
                var transaction = new Transaction(
                    SaleAmount(activity, assignment),
                    TransactionDirection.Income,
                    TransactionType.ActivitySale,
                    SaleDescription(activity.Name, MemberName(assignment.User)),
                    activity.SavingPeriodId);
                await transactionRepository.AddAsync(transaction, ct);
                assignment.MarkAsPaid(transaction.Id);
            }

            activity.RefreshStatus();
            await logRepository.AddAsync(
                new Log(performedByUserId, LogEntityType.ActivityAssignment, assignment.Id, LogAction.Update, activity.SavingPeriodId, oldAmount,
                    SaleAmount(activity, assignment)),
                ct);
        }, cancellationToken);

        return ToAssignment(assignment, MemberName(assignment.User), activity.UnitSalePrice);
    }

    public async Task CancelAssignmentAsync(Guid activityId, Guid assignmentId, Guid performedByUserId, SavingPeriod period, CancellationToken cancellationToken)
    {
        var activity = await GetActivityForUpdateAsync(activityId, period, cancellationToken);
        var assignment = FindAssignment(activity, assignmentId);

        if (activity.Status == ActivityStatus.Cancelled)
            throw new DomainException("Cancelled activities cannot be modified.");

        await unitOfWork.ExecuteInTransactionAsync(async ct =>
        {
            var oldAmount = assignment.Transaction?.Amount ?? SaleAmount(activity, assignment);
            var wasPaid = assignment.Status == AssignmentStatus.Paid;
            assignment.Cancel();
            if (wasPaid)
                assignment.Transaction!.Cancel();

            activity.RefreshStatus();
            await logRepository.AddAsync(
                new Log(performedByUserId, LogEntityType.ActivityAssignment, assignment.Id, LogAction.Delete, activity.SavingPeriodId, oldAmount, null),
                ct);
        }, cancellationToken);
    }

    public async Task<ExtraCostResponse> CreateExtraCostAsync(Guid activityId, ExtraCostRequest request, Guid performedByUserId, SavingPeriod period, CancellationToken cancellationToken)
    {
        var status = GetExtraCostStatus(request);
        var activity = await GetActivityForUpdateAsync(activityId, period, cancellationToken);
        ExtraCost? cost = null;

        await unitOfWork.ExecuteInTransactionAsync(async ct =>
        {
            var paid = status == ExtraCostStatus.Paid;
            var available = paid ? await transactionRepository.GetAvailableMoneyAsync(activity.SavingPeriodId, ct) : 0m;
            var pool = paid ? await transactionRepository.GetSharedInterestPoolAsync(activity.SavingPeriodId, ct) : 0m;
            cost = activity.AddExtraCost(request.Description, request.Amount);
            if (paid)
            {
                CashGuard.EnsureAvailable(available, cost.Amount); // FIN-13
                InterestPool.EnsureCovers(pool, cost.Amount); // FIN-14
            }

            await activityRepository.AddExtraCostAsync(cost, ct);
            if (paid)
            {
                var transaction = NewExtraCostTransaction(activity, cost);
                await transactionRepository.AddAsync(transaction, ct);
                cost.MarkAsPaid(transaction.Id);
            }

            await logRepository.AddAsync(
                new Log(performedByUserId, LogEntityType.ExtraCost, cost.Id, LogAction.Create, activity.SavingPeriodId, null, cost.Amount),
                ct);
        }, cancellationToken);

        return ToExtraCost(cost!);
    }

    public async Task<ExtraCostResponse> UpdateExtraCostAsync(Guid activityId, Guid extraCostId, ExtraCostRequest request, Guid performedByUserId, SavingPeriod period, CancellationToken cancellationToken)
    {
        var status = GetExtraCostStatus(request);
        var activity = await GetActivityForUpdateAsync(activityId, period, cancellationToken);
        var cost = FindExtraCost(activity, extraCostId);

        if (cost.Status == ExtraCostStatus.Paid && status == ExtraCostStatus.Pending)
            throw new DomainException("Paid extra costs cannot return to pending.");

        await unitOfWork.ExecuteInTransactionAsync(async ct =>
        {
            var wasPaid = cost.Status == ExtraCostStatus.Paid;
            var needsGuards = wasPaid || status == ExtraCostStatus.Paid;
            var available = needsGuards ? await transactionRepository.GetAvailableMoneyAsync(activity.SavingPeriodId, ct) : 0m;
            var pool = needsGuards ? await transactionRepository.GetSharedInterestPoolAsync(activity.SavingPeriodId, ct) : 0m;
            var oldAmount = cost.Amount;
            activity.UpdateExtraCost(cost, request.Description, request.Amount);
            if (wasPaid)
            {
                // The pool and the available money already exclude the previous amount: only the increase is new.
                var increase = cost.Amount - oldAmount;
                CashGuard.EnsureAvailable(available, increase); // FIN-13
                InterestPool.EnsureCovers(pool, increase); // FIN-14
                cost.Transaction!.Update(cost.Amount, TransactionDirection.Expense, TransactionType.ExtraCost,
                    ExtraCostDescription(activity, cost));
            }
            else if (status == ExtraCostStatus.Paid)
            {
                CashGuard.EnsureAvailable(available, cost.Amount); // FIN-13
                InterestPool.EnsureCovers(pool, cost.Amount); // FIN-14
                var transaction = NewExtraCostTransaction(activity, cost);
                await transactionRepository.AddAsync(transaction, ct);
                cost.MarkAsPaid(transaction.Id);
            }

            await logRepository.AddAsync(
                new Log(performedByUserId, LogEntityType.ExtraCost, cost.Id, LogAction.Update, activity.SavingPeriodId, oldAmount, cost.Amount),
                ct);
        }, cancellationToken);

        return ToExtraCost(cost);
    }

    public async Task CancelExtraCostAsync(Guid activityId, Guid extraCostId, Guid performedByUserId, SavingPeriod period, CancellationToken cancellationToken)
    {
        var activity = await GetActivityForUpdateAsync(activityId, period, cancellationToken);
        var cost = FindExtraCost(activity, extraCostId);

        if (activity.Status == ActivityStatus.Cancelled)
            throw new DomainException("Cancelled activities cannot be modified.");

        await unitOfWork.ExecuteInTransactionAsync(async ct =>
        {
            var oldAmount = cost.Amount;
            var wasPaid = cost.Status == ExtraCostStatus.Paid;
            cost.Cancel(); // FIN-14: cancelling an extra cost only returns money to the pool, so it is never guarded.
            if (wasPaid)
                cost.Transaction!.Cancel();

            await logRepository.AddAsync(
                new Log(performedByUserId, LogEntityType.ExtraCost, cost.Id, LogAction.Delete, activity.SavingPeriodId, oldAmount, null),
                ct);
        }, cancellationToken);
    }

    private async Task<User> GetActiveMemberAsync(Guid memberId, CancellationToken cancellationToken)
    {
        var member = await memberReader.GetMemberByIdAsync(memberId, cancellationToken)
            ?? throw new DomainException("Member not found.");

        if (!member.IsActive)
            throw new DomainException("Only active members can be assigned to an activity.");

        return member;
    }

    private async Task<Activity> GetActivityForUpdateAsync(Guid activityId, SavingPeriod period, CancellationToken cancellationToken) =>
        await activityRepository.GetForUpdateAsync(activityId, period.Id, cancellationToken)
            ?? throw new DomainException("Activity not found.");

    private static ActivityAssignment FindAssignment(Activity activity, Guid assignmentId) =>
        activity.Assignments.FirstOrDefault(assignment => assignment.Id == assignmentId)
            ?? throw new DomainException("Activity assignment not found.");

    private static ExtraCost FindExtraCost(Activity activity, Guid extraCostId) =>
        activity.ExtraCosts.FirstOrDefault(cost => cost.Id == extraCostId)
            ?? throw new DomainException("Extra cost not found.");

    private static ExtraCostStatus GetExtraCostStatus(ExtraCostRequest request)
    {
        if (request.Status is not { } status || status == ExtraCostStatus.Cancelled || !Enum.IsDefined(status))
            throw new DomainException("Extra cost status must be Pending or Paid.");

        return status;
    }

    private static Transaction NewExtraCostTransaction(Activity activity, ExtraCost cost) =>
        new(cost.Amount, TransactionDirection.Expense, TransactionType.ExtraCost, ExtraCostDescription(activity, cost), activity.SavingPeriodId);

    private static string ExtraCostDescription(Activity activity, ExtraCost cost)
    {
        var description = $"Activity extra cost - {activity.Name} - {cost.Description}";
        return description.Length > 200 ? description[..200] : description;
    }

    private static AssignmentStatus GetAssignmentStatus(ActivityAssignmentUpdateRequest request)
    {
        if (request.Status is not { } status || status == AssignmentStatus.Cancelled || !Enum.IsDefined(status))
            throw new DomainException("Assignment status must be Pending or Paid.");

        return status;
    }

    private static decimal SaleAmount(Activity activity, ActivityAssignment assignment) =>
        assignment.QuantityAssigned * activity.UnitSalePrice;

    private static string ActivityDescription(string name) => $"Activity - {name.Trim()}";

    private static string SaleDescription(string activityName, string memberName)
    {
        var description = $"Activity sale - {activityName} - {memberName}";
        return description.Length > 200 ? description[..200] : description;
    }

    private static DateTime ToUtcDate(DateTime date) => DateTime.SpecifyKind(date.Date, DateTimeKind.Utc);

    private static string MemberName(User member) => member.FirstName + " " + member.LastName;

    private static ActivityDetailResponse ToDetail(Activity activity) =>
        new(
            activity.Id,
            activity.TransactionId,
            activity.Name,
            activity.Description,
            activity.Quantity,
            activity.UnitCost,
            activity.UnitSalePrice,
            activity.TotalCost(),
            activity.AssignedQuantity(),
            activity.AvailableQuantity(),
            activity.StartDate,
            activity.Status,
            activity.CreatedAt,
            activity.Assignments
                .OrderBy(assignment => assignment.AssignedAt)
                .Select(assignment => ToAssignment(assignment, MemberName(assignment.User), activity.UnitSalePrice))
                .ToArray(),
            activity.ExtraCosts
                .OrderBy(cost => cost.CreatedAt)
                .Select(ToExtraCost)
                .ToArray());

    private static ExtraCostResponse ToExtraCost(ExtraCost cost) =>
        new(cost.Id, cost.ActivityId, cost.Description, cost.Amount, cost.Status, cost.CreatedAt, cost.PaidAt, cost.TransactionId);

    private static ActivityAssignmentResponse ToAssignment(ActivityAssignment assignment, string memberName, decimal unitSalePrice) =>
        new(assignment.Id, assignment.ActivityId, assignment.UserId, memberName, assignment.QuantityAssigned,
            assignment.QuantityAssigned * unitSalePrice, assignment.Status, assignment.AssignedAt, assignment.PaidAt,
            assignment.TransactionId);
}
