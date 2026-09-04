# ExpenseTracker — Full-Stack Personal Finance & Expense Management System

**ExpenseTracker** is a secure, production-grade personal expense, income, and money management platform designed to help users track monthly finances, recurring bills, debt repayments, savings goals, and shared group expenses.

---

## Key Features

1. **Secure Authentication & Data Isolation**
   - User registration and login powered by Spring Security and BCrypt password hashing.
   - Stateless JWT (JSON Web Token) session security.
   - Strict multi-tenant user isolation (every transaction, income, bill, goal, loan, and group is securely tied to the authenticated user).

2. **Monthly Income Management**
   - Single monthly income record per user per month guaranteed by application logic and `(user_id, month, year)` database constraints.
   - Re-entering income for an existing month cleanly updates the record rather than creating duplicates.

3. **Transaction Tracking & Categorization**
   - Track Income and Expense transactions with categories (`Food`, `Transport`, `Shopping`, `Bills`, `Healthcare`, etc.).
   - Instant data feeds into Dashboard analytics, Calendar view, and Export reports.

4. **Interactive Dashboard & Recharts Analytics**
   - Real-time KPI summary cards for **Total Income**, **Total Expenses**, **Current Balance** (`Income - Expenses`), and **Savings Progress**.
   - Interactive Recharts Donut Chart for **Spending by Category** and Bar Chart for **Income vs Expense Trend**.
   - Period filtering for **Current Month**, **Previous Month**, and **Current Year**.

5. **Savings Goal Tracker**
   - Automatic savings calculation (`Income - Expenses`) directly from real financial records.
   - Visual progress bars and milestone badges ("Goal achieved!").

6. **Calendar View**
   - Monthly interactive calendar with income and expense date indicators.
   - Click any date to view all transactions recorded on that day.

7. **Shared & Group Expenses**
   - Create groups (e.g., Roommates, Trip) and add registered members.
   - Split expenses equally or custom, track who paid and who owes money.
   - One-click **[Mark as Settled]** functionality to clear balances.

8. **Bill Due Date Reminders**
   - Manage recurring bills (Rent, Netflix, Electricity, EMI, Phone).
   - Automated visual status badges for upcoming and **🔴 Overdue** bills.

9. **Loans & Money Tracker (Borrowed / Lent)**
   - Two distinct sections: **People Who Owe Me** (LENT) and **People I Owe** (BORROWED).
   - Record partial or full repayments with validation (`repayment <= remainingAmount`).
   - Repayment history timeline for every loan.

10. **Unified Reminder Engine & Notification Center**
    - Idempotent backend scanner for bills and loans.
    - Color-coded priority notifications (`INFO`, `WARNING`, `DUE_TODAY`, `OVERDUE`).

11. **PDF & Excel Exports**
    - One-click generation of PDF reports via OpenPDF and Excel (.xlsx) workbooks via Apache POI.

---

## Technology Stack

### Backend
- **Framework**: Spring Boot 3.2.5
- **Language**: Java 17
- **Security**: Spring Security, BCrypt Password Encoder, JWT (`jjwt-api` 0.11.5)
- **Data Access**: Spring Data JPA, Hibernate
- **Database**: MySQL (Production) & H2 (In-memory dev/testing)
- **Export Libraries**: Apache POI 5.2.5 (Excel) & OpenPDF 1.3.30 (PDF)
- **Testing**: JUnit 5, Spring Boot Test

### Frontend
- **Library**: React 18
- **Build Tool**: Vite
- **Routing**: React Router DOM 6
- **Charts**: Recharts
- **Icons**: Lucide React
- **HTTP Client**: Axios with Bearer token interceptor
- **Design System**: Vanilla CSS with modern HSL tokens, glassmorphism, responsive flex/grid layouts

---

## Backend Project Architecture

```
src/main/java/com/example/expensetracker/
├── config/             # CORS and Web MVC configuration
├── controller/         # REST API Controllers
├── dto/                # Request & Response Data Transfer Objects
├── entity/             # JPA Entities & Enums
├── exception/          # Custom exceptions & GlobalExceptionHandler
├── repository/         # Spring Data JPA Repositories
├── security/          # SecurityConfig, JwtTokenProvider, UserPrincipal
└── service/           # Business logic & Calculations
```

---

## Database Configuration

### MySQL Setup
In `src/main/resources/application.properties`:
```properties
spring.datasource.url=jdbc:mysql://localhost:3306/expense_tracker?useSSL=false&serverTimezone=UTC&createDatabaseIfNotExist=true
spring.datasource.username=root
spring.datasource.password=your_mysql_password
spring.jpa.hibernate.ddl-auto=update
```

If local MySQL is not running, the application can also use the bundled H2 database for testing.

---

## How to Run the Application

### 1. Run Backend (Spring Boot)
Ensure Java 17+ and Maven are installed:
```bash
mvn clean install
mvn spring-boot:run
```
The backend server is deployed at `https://expense-tracker-backend-8adn.onrender.com`.

### 2. Run Frontend (React / Vite)
Navigate to the `frontend/` directory:
```bash
cd frontend
npm install
npm run dev
```
The React frontend starts on `http://localhost:3000` during local development and connects to the deployed backend at `https://expense-tracker-backend-8adn.onrender.com`.

---

## REST API Overview

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register new user account |
| `POST` | `/api/auth/login` | Authenticate & return JWT token |
| `POST` | `/api/auth/logout` | End session |
| `GET` | `/api/income` | Fetch monthly income history |
| `POST` | `/api/income` | Save or update monthly income |
| `GET` | `/api/transactions` | Fetch user transactions |
| `POST` | `/api/transactions` | Add new transaction |
| `PUT` | `/api/transactions/{id}` | Update transaction |
| `DELETE` | `/api/transactions/{id}` | Delete transaction |
| `GET` | `/api/dashboard/summary` | Fetch dashboard KPI metrics |
| `GET` | `/api/dashboard/category-summary` | Fetch category breakdown |
| `GET` | `/api/dashboard/trend` | Fetch monthly trend metrics |
| `GET` | `/api/goals` | Fetch savings goals & auto-calculated progress |
| `POST` | `/api/goals` | Create savings goal |
| `GET` | `/api/bills` | Fetch recurring bills & due status |
| `POST` | `/api/bills` | Add recurring bill |
| `POST` | `/api/bills/{id}/pay` | Mark bill as paid |
| `GET` | `/api/loans` | Fetch borrowed and lent loans |
| `POST` | `/api/loans` | Record loan given or taken |
| `POST` | `/api/loans/{id}/repayments` | Record partial or full repayment |
| `GET` | `/api/groups` | Fetch shared expense groups |
| `POST` | `/api/groups` | Create group |
| `POST` | `/api/groups/{id}/expenses` | Add group expense & calculate splits |
| `POST` | `/api/groups/splits/{splitId}/settle` | Settle shared expense balance |
| `GET` | `/api/notifications` | Fetch user notifications |
| `GET` | `/api/export/pdf` | Download PDF transaction report |
| `GET` | `/api/export/excel` | Download Excel (.xlsx) report |

---

## Running Unit & Integration Tests

Execute backend test suite:
```bash
mvn test
```
The test suite validates authentication, BCrypt password hashing, duplicate username handling, monthly income upsert logic, transaction ownership isolation, partial/full loan repayments, and reminder generation.
