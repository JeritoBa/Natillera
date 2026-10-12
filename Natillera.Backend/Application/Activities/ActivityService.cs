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
    public async Task<IReadOnlyCollection<ActivityListItem>> GetListAsync(CancellationToken cancellationToken)
    {
        var activities = await activityRepository.GetListAsync(cancellationToken);
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

    public async Task<ActivityDetailResponse?> GetDetailAsync(Guid id, CancellationToken cancellationToken)
    {
        var activity = await activityRepository.GetDetailAsync(id, cancellationToken);
        return activity is null ? null : ToDetail(activity);
    }

    public async Task<ActivityAssignmentResponse?> GetAssignmentAsync(Guid activityId, Guid assignmentId, CancellationToken cancellationToken)
    {
        var activity = await GetDetailAsync(activityId, cancellationToken);
        return activity?.Assignments.FirstOrDefault(assignment => assignment.Id == assignmentId);
    }

    public async Task<ActivityDetailResponse> CreateActivityAsync(ActivityRequest request, Guid performedByUserId, CancellationToken cancellationToken)
    {
        var transaction = new Transaction(
            request.Quantity * request.UnitCost,
            TransactionDirection.Expense,
            TransactionType.Activity,
            ActivityDescription(request.Name));
        var activity = new Activity(request.Name, request.Description, request.Quantity, request.UnitCost,
            request.UnitSalePrice, ToUtcDate(request.StartDate), transaction.Id);

        await unitOfWork.ExecuteInTransactionAsync(async ct =>
        {
            CashGuard.EnsureAvailable(await transactionRepository.GetAvailableMoneyAsync(ct), activity.TotalCost()); // FIN-13
            await transactionRepository.AddAsync(transaction, ct);
            await activityRepository.AddAsync(activity, ct);
            await logRepository.AddAsync(
                new Log(performedByUserId, LogEntityType.Activity, activity.Id, LogAction.Create, null, activity.TotalCost()),
                ct);
        }, cancellationToken);

        return ToDetail(activity);
    }

    public async Task<ActivityDetailResponse> UpdateActivityAsync(Guid activityId, ActivityRequest request, Guid performedByUserId, CancellationToken cancellationToken)
    {
        var activity = await GetActivityForUpdateAsync(activityId, cancellationToken);

        await unitOfWork.ExecuteInTransactionAsync(async ct =>
        {
            var available = await transactionRepository.GetAvailableMoneyAsync(ct);
            var oldAmount = activity.TotalCost();
            activity.UpdateDetails(request.Name, request.Description, request.Quantity, request.UnitCost,
                request.UnitSalePrice, ToUtcDate(request.StartDate));
            CashGuard.EnsureAvailable(available, activity.TotalCost() - oldAmount); // FIN-13
            activity.Transaction.Update(activity.TotalCost(), TransactionDirection.Expense, TransactionType.Activity,
                ActivityDescription(activity.Name));
            activity.RefreshStatus();
            await logRepository.AddAsync(
                new Log(performedByUserId, LogEntityType.Activity, activity.Id, LogAction.Update, oldAmount, activity.TotalCost()),
                ct);
        }, cancellationToken);

        return ToDetail(activity);
    }

    public async Task CancelActivityAsync(Guid activityId, Guid performedByUserId, CancellationToken cancellationToken)
    {
        var activity = await GetActivityForUpdateAsync(activityId, cancellationToken);

        await unitOfWork.ExecuteInTransactionAsync(async ct =>
        {
            var oldAmount = activity.TotalCost();
            activity.Cancel();
            activity.Transaction.Cancel();
            await logRepository.AddAsync(
                new Log(performedByUserId, LogEntityType.Activity, activity.Id, LogAction.Delete, oldAmount, null),
                ct);
        }, cancellationToken);
    }

    public async Task<ActivityAssignmentResponse> CreateAssignmentAsync(Guid activityId, ActivityAssignmentRequest request, Guid performedByUserId, CancellationToken cancellationToken)
    {
        var activity = await GetActivityForUpdateAsync(activityId, cancellationToken);
        var member = await GetActiveMemberAsync(request.UserId, cancellationToken);
        ActivityAssignment? assignment = null;

        await unitOfWork.ExecuteInTransactionAsync(async ct =>
        {
            assignment = activity.AddAssignment(request.QuantityAssigned, member.Id);
            await activityRepository.AddAssignmentAsync(assignment, ct);
            activity.RefreshStatus();
            await logRepository.AddAsync(
                new Log(performedByUserId, LogEntityType.ActivityAssignment, assignment.Id, LogAction.Create, null,
                    SaleAmount(activity, assignment)),
                ct);
        }, cancellationToken);

        return ToAssignment(assignment!, MemberName(member), activity.UnitSalePrice);
    }

    public async Task<ActivityAssignmentResponse> UpdateAssignmentAsync(Guid activityId, Guid assignmentId, ActivityAssignmentUpdateRequest request, Guid performedByUserId, CancellationToken cancellationToken)
    {
        var status = GetAssignmentStatus(request);
        var activity = await GetActivityForUpdateAsync(activityId, cancellationToken);
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
                    SaleDescription(activity.Name, MemberName(assignment.User)));
                await transactionRepository.AddAsync(transaction, ct);
                assignment.MarkAsPaid(transaction.Id);
            }

            activity.RefreshStatus();
            await logRepository.AddAsync(
                new Log(performedByUserId, LogEntityType.ActivityAssignment, assignment.Id, LogAction.Update, oldAmount,
                    SaleAmount(activity, assignment)),
                ct);
        }, cancellationToken);

        return ToAssignment(assignment, MemberName(assignment.User), activity.UnitSalePrice);
    }

    public async Task CancelAssignmentAsync(Guid activityId, Guid assignmentId, Guid performedByUserId, CancellationToken cancellationToken)
    {
        var activity = await GetActivityForUpdateAsync(activityId, cancellationToken);
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
                new Log(performedByUserId, LogEntityType.ActivityAssignment, assignment.Id, LogAction.Delete, oldAmount, null),
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

    private async Task<Activity> GetActivityForUpdateAsync(Guid activityId, CancellationToken cancellationToken) =>
        await activityRepository.GetForUpdateAsync(activityId, cancellationToken)
            ?? throw new DomainException("Activity not found.");

    private static ActivityAssignment FindAssignment(Activity activity, Guid assignmentId) =>
        activity.Assignments.FirstOrDefault(assignment => assignment.Id == assignmentId)
            ?? throw new DomainException("Activity assignment not found.");

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
                .ToArray());

    private static ActivityAssignmentResponse ToAssignment(ActivityAssignment assignment, string memberName, decimal unitSalePrice) =>
        new(assignment.Id, assignment.ActivityId, assignment.UserId, memberName, assignment.QuantityAssigned,
            assignment.QuantityAssigned * unitSalePrice, assignment.Status, assignment.AssignedAt, assignment.PaidAt,
            assignment.TransactionId);
}
