
# Natillera Planning

## 0. Problem

A natillera is managed by a person, who manages the transactions registry inside a raw iPhone note and a money generic management application.

This current manual administration has caused inconsistencies in the natillera balance, and it implies too much effort and wasted time to the manager.

The manager needs an application where the management is designed to the natillera, where he can register transactions and watch the balance, protected by the integrity and the consistency of the system.

## 1. Project goal

I'm making this project for solve the actual problems of the natillera manager. This project is for the manager and, in the short-term planed, for the members who belong to the natillera. The main value of the application is the consistency and integrity of the money transactions

## 2. User Stories (user-centric decision)

### Shared
- As an admin/member, I want to login into the system so that I can have access of the information.

### Admin
- As an admin, I want to manage a new member so that I can keep track of the income received from each customer
- As an admin, I want to manage a new monthly payment so that I can create a register of his money
- As an admin, I want to manage a new loan so that I can track the money loaned
- As an admin, I want to manage a new performance so that I can track the performances of the loaned money
- As an admin, I want to manage a new activity so that I can track the registry of them
- As an admin, I want to manage a new activity  income so that I can track the incomes of the members.
- As an admin, I want to see the members who are in debt so that I can be aware of them.
- As an admin, I want to view the audit history of a financial operation so that I can trace who created or modified it.

### Members
- As a member, I want to be remembered of my pending payments so that I can take them in account.
- As a member, I want to see the actual natillera balance so that I can have full transparency with the transactions
- As a member, I want to see all the transactions of the natillera  so that I can have full transparency
- As a member, I want to request a loan by the platform so that I can receive the money instantly
- As a member, I want to see the top of sellers in the natillera so that I can motivate myself to sell more
- As a member, I want to see my saved money together to my performances so that I can be aware of it.
- As a member, I want to pay from the application so that I can do it fastly

## 3. Data Models
- User
- Transaction
- MonthlyPayment
- Loan
- Performance
- LoanPayment
- Activity
- ActivitySale
- ActivityAssignment
- Log

How does those relationships looks like?
R/: Drawed in a paper. Pending to pass it to the computer as ER diagram

The most important is the consistency.

## 4. MVP

### Shared
- As an admin/member, I want to login into the system so that I can have access of the information.

### Admin
- As an admin, I want to manage a new member so that I can keep track of the income received from each customer
- As an admin, I want to manage a new monthly payment so that I can create a register of his money
- As an admin, I want to see the members who are in debt so that I can be aware of them.
- As an admin, I want to view the audit history of a financial operation so that I can trace who created or modified it.

### Member
- As a member, I want to see the actual natillera balance so that I can have full transparency with the transactions
- As a member, I want to see all the transactions of the natillera  so that I can have full transparency
- As a member, I want to see my saved money together to my performances so that I can be aware of it.
- As a member, I want to be remembered of my pending payments so that I can take them in account.

### 5. Wireframe

Done in paper

### 6. Project Future

I expect, as a max, one hundred of active users in my application. Therefore, a monolite may be good option for the development of this application. For the backend development, I am choosing between clean architecture (by its business logic complexity) or modular architecture mixed with clean architecture.

### 7. Components

By the moment very simple: Front <--> Backend <--> DB

In the future have present: S3 Storage, RabbitMQ or Kafka Event Bus, PgVector.

In the future too: Discover testing, availability and observability tools.

### 8. Stack

Backend -> C# with ASP.NET, EF Core, Identity for security
Frontend -> React.js
DB -> PostgreSQL / SQLServer (ask)
Versions Management -> Git
Project Setup -> Docker & Docker Compose

Will be deployed in Vercel with free hosting.

### 9. Business Logic
- A loan cannot be marked as finished if there's any loan amount or performance pending
- The interest is simple, generated monthly by the loan remaining amount
- A user cannot have more than one monthly payment per month & year
- An activity cannot be finished if there's any activity assignment pending
- Every business entity must have a transaction