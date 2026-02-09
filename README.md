# Personal Finance API

This project is a backend API for a personal finance management application.

The goal is to provide a clean, scalable, and well-structured API to manage:

- Categories
- Transactions
- Budgets
- Users and authentication (future)

The project is built using **NestJS** and follows modular architecture and best practices.

---

## 🚀 Tech Stack

- Node.js
- NestJS
- TypeScript
- REST API
- class-validator & class-transformer (validation)
- Jest (testing framework)

---

## 📦 Project Status

✅ **Core Features Implemented**

⚠️ **Important Note:** Data is currently stored **in-memory** (arrays) and will reset when the server restarts. Database integration is pending.

This project has a solid foundation with:

- ✅ Three core business modules fully implemented
- ✅ 15+ REST API endpoints with complete CRUD operations
- ✅ Advanced budget analytics and spending tracking
- ✅ Comprehensive validation using DTOs
- ✅ Global exception handling
- ✅ 56 unit tests with good coverage
- ❌ Database integration (next priority)
- ❌ Authentication & authorization

---

## ▶️ Running the Project

```bash
npm install
npm run start:dev
```

The server will start in development mode on port 3000.

---

## 🏗️ Architecture

The project follows **NestJS modular architecture** with clean separation of concerns:

- **Modular Design:** Each business domain (Categories, Transactions, Budgets) is isolated in its own module
- **Dependency Injection:** Services are injectable and shared across modules
- **Module Dependencies:**
  - `BudgetModule` imports `CategoriesModule` and `TransactionsModule`
  - `TransactionsModule` imports `CategoriesModule`
  - Each module exports its service for use by dependent modules
- **Global Features:**
  - Validation pipe with DTO transformation and whitelist enforcement
  - Custom exception filter for standardized error responses

---

## ✨ Features

### Categories Module

- Full CRUD operations for category management
- Category types: income, expense, savings, etc.
- Validated DTOs with required fields

### Transactions Module

- Complete transaction lifecycle management
- Automatic category validation (prevents orphaned transactions)
- Tracks amount, description, category, date, and type
- Integration with Categories module

### Budgets Module (Advanced)

- Full CRUD operations for budget management
- **Budget Analytics:**
  - Calculate spent amount from transactions
  - Calculate remaining budget
  - Track budget utilization percentage
- **Budget Details Endpoint:** Returns budget with category info, related transactions, and spending metrics
- **Category Budget Overview:** Get all budgets for a specific category
- **Validation:**
  - Month validation (1-12)
  - Duplicate prevention (same category/type/period)
  - Category existence validation

### Global Features

- DTOs with class-validator decorators
- Automatic payload transformation and validation
- Standardized error responses
- Health check endpoint for monitoring

---

## 🔌 API Endpoints

### Categories

- `GET /categories` - Get all categories
- `GET /categories/:id` - Get category by ID
- `POST /categories` - Create a new category
- `PATCH /categories/:id` - Update a category
- `DELETE /categories/:id` - Delete a category

### Transactions

- `GET /transactions` - Get all transactions
- `GET /transactions/:id` - Get transaction by ID
- `POST /transactions` - Create a new transaction
- `PATCH /transactions/:id` - Update a transaction
- `DELETE /transactions/:id` - Delete a transaction

### Budgets

- `GET /budgets` - Get all budgets
- `GET /budgets/:id` - Get budget by ID
- `GET /budgets/:id/details` - Get budget with full details (category, transactions, metrics)
- `GET /budgets/category/:categoryId` - Get all budgets for a category
- `POST /budgets` - Create a new budget
- `PATCH /budgets/:id` - Update a budget
- `DELETE /budgets/:id` - Delete a budget

### Health

- `GET /health` - Health check endpoint

---

## 🧪 Testing

The project includes **56 unit tests** covering all services:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:cov
```

**Test Coverage:**

- CategoriesService: 6 tests
- TransactionsService: 19 tests
- BudgetService: 30 tests (includes complex analytics and validation)
- E2E tests: Basic integration test

---

## 🎯 What's Next

- [ ] **Database integration** (Prisma ORM recommended)
- [ ] **Authentication & authorization** (JWT + Passport)
- [ ] **User management** module
- [ ] **Environment configuration** module
- [ ] **API documentation** (Swagger/OpenAPI)
- [ ] **Logging system** (Winston or similar)
- [ ] **Docker** containerization
- [ ] **CI/CD** pipeline

---

## 📄 License

This project is for study and personal use.
