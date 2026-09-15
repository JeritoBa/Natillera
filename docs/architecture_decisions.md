# Architecture Decisions

## Architecture

- By the expected users, a monolith was chose by simplicity and consistency now instead of distributed scalability and independent deployment. The benefits of a microservices architecture are unnecessary by this moment.

## Front-end

- The connection will be done with an REST Api because my system has a clear separation. REST is a good fit because the frontend will need to retrieve and manipulate resources. The trade-off is that REST will need more requests or return more data such as GraphQL, but this complexity isn't significant for the current scope

- I chose React Library because the website is an interactive application, where this technology may help with dynamic interfaces, reusable components, client-side state, etc... The mainly trade-off is that react isn't the simplest way to build a UI, but I accept the complexity by the benefits of a interactive SPA-style frontend.

## Backend

- C# with ASP.NET was chose by it's strong static typing, security, object-oriented, robustness and good performance for a business application. The trade-off is that C# is more verbose and complex than another languages, but I am prioritizing maintainability + type safety + structure + reliability

- Clean Architecture was chose by the importance of the business rules. The mainly trade-off identified was more architectural complexity now for less coupling and easier evolution later. Clean architecture reduces coupling, making changes to infrastructure and application components less likely to affect core business rules

## Database

- PostgreSQL was chose because our system is a transactional, relational application where data integrity and consistency are more important than schema flexibility. Also by open-source licensing.

- The indexes created where at the moment are:
	- User.email UNIQUE
	- MonthlyPayment(user_id, year, month) UNIQUE
	- LoanPayment.loan_id
	- Performance.loan_id
	- ActivityAssignment.activity_id
	- ActivityAssignment.user_id

Note: They were defined by the most necessary queries expected

---

### Questions to Solve

- Which components should have an application if it's a monolith?
- How define as a good way a MVP?
- How to make sure the deployment?
- How to manage future add-ons which broke the actual structure? (example: payments)
- Why choose C# instead of Node.js, Java or python?
- Should I add testing for mark an user story as finished?
- By the last project made with AI, what can I do better?
