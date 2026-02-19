# Personal Finance API

A secure backend API for personal finance management built with NestJS, featuring JWT authentication, Prisma ORM, and PostgreSQL.

---

## 🚀 Tech Stack

- **Framework:** NestJS
- **Language:** TypeScript
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Authentication:** JWT + Passport
- **Validation:** class-validator & class-transformer
- **Testing:** Jest
- **Security:** bcrypt password hashing

---

## 📦 Project Status

✅ **Core Features Implemented**

- ✅ User registration and authentication with JWT
- ✅ Protected routes with authentication guards
- ✅ PostgreSQL database with Prisma ORM
- ✅ Categories, Transactions, and Budgets management
- ✅ Budget analytics and spending tracking
- ✅ Comprehensive validation using DTOs
- ✅ Global exception handling
- ✅ 56+ unit tests with good coverage
- ❌ Refresh tokens (out of scope)
- ❌ Role-based authorization (future)

---

## ⚙️ Environment Setup

Create a `.env` file in the root directory:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/my_pocket_db"
JWT_SECRET="your-secret-key-here"
JWT_EXPIRATION=3600
```

---

## ▶️ Running the Project

```bash
# Install dependencies
npm install

# Run database migrations
npm run db:migrate:dev

# Seed database (optional)
npm run db:seed

# Start development server
npm run start:dev

# Run Prisma Studio (database GUI)
npm run db:studio
```

The server will start on port 3000.

---

## 🏗️ Architecture

The project follows **NestJS modular architecture** with clean separation of concerns:

- **Modular Design:** Each business domain (Auth, Categories, Transactions, Budgets) is isolated in its own module
- **Dependency Injection:** Services are injectable and shared across modules
- **Authentication Layer:**
  - JWT strategy with Passport integration
  - `JwtAuthGuard` for route protection
  - User context extraction from JWT tokens
- **Database Layer:**
  - Prisma ORM for type-safe database access
  - PostgreSQL for data persistence
  - Cascading deletes for data integrity
- **Module Dependencies:**
  - All resource modules (Categories, Transactions, Budgets) are protected with `JwtAuthGuard`
  - `BudgetModule` imports `CategoriesModule`
  - Each module exports its service for use by dependent modules
- **Global Features:**
  - Validation pipe with DTO transformation and whitelist enforcement
  - Custom exception filter for standardized error responses

---

## ✨ Features

### Authentication Module

- **User Registration:**
  - Email/password registration with validation
  - Bcrypt password hashing (10 salt rounds)
  - Automatic JWT token generation on signup
  - Email uniqueness validation
- **User Login:**
  - Credential validation with bcrypt comparison
  - JWT token generation on successful login
  - Generic error messages to prevent account enumeration
- **JWT Authentication:**
  - Bearer token validation
  - User context attached to requests
  - 401 responses for invalid/missing tokens

### Categories Module

- Full CRUD operations for category management
- Category types: INCOME, EXPENSE
- User-scoped categories (users can only access their own)
- Validated DTOs with required fields
- Unique constraint: name + type per user

### Transactions Module

- Complete transaction lifecycle management
- User-scoped transactions
- Automatic category validation
- Tracks amount, description, category, date, and type
- Integration with Categories module

### Budgets Module (Advanced)

- Full CRUD operations for budget management
- User-scoped budgets
- **Budget Analytics:**
  - Calculate spent amount from transactions
  - Calculate remaining budget
  - Track budget utilization percentage
- **Budget Details Endpoint:** Returns budget with category info, related transactions, and spending metrics
- **Category Budget Overview:** Get all budgets for a specific category
- **Validation:**
  - Month validation (1-12)
  - Duplicate prevention (same category/period per user)
  - Category existence validation

### Database Schema

- **User:** Authentication and ownership
- **Category:** User-owned expense/income categories
- **Transaction:** Financial transactions linked to categories and users
- **Budget:** Monthly budgets with analytics
- **Relationships:** Cascading deletes for data integrity

### Global Features

- DTOs with class-validator decorators
- Automatic payload transformation and validation
- Standardized error responses
- Health check endpoint for monitoring

---

## 🔌 API Endpoints

### Authentication (Public)

- `POST /auths/register` - Register a new user
- `POST /auths/login` - Login and receive JWT token

### Categories (Protected)

- `GET /categories` - Get all user categories
- `GET /categories/:id` - Get category by ID
- `POST /categories` - Create a new category
- `PUT /categories/:id` - Update a category
- `DELETE /categories/:id` - Delete a category

### Transactions (Protected)

- `GET /transactions` - Get all user transactions
- `GET /transactions/:id` - Get transaction by ID
- `POST /transactions` - Create a new transaction
- `PUT /transactions/:id` - Update a transaction
- `DELETE /transactions/:id` - Delete a transaction

### Budgets (Protected)

- `GET /budgets` - Get all user budgets
- `GET /budgets/:id` - Get budget by ID
- `GET /budgets/:id/details` - Get budget with full details (category, transactions, metrics)
- `GET /budgets/category/:categoryId` - Get all budgets for a category
- `POST /budgets` - Create a new budget
- `PUT /budgets/:id` - Update a budget
- `DELETE /budgets/:id` - Delete a budget

### Health (Public)

- `GET /health` - Health check endpoint

**Authentication:** Protected endpoints require a valid JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

---

## 🧪 Testing

The project includes **56+ unit tests** covering all services:

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
- AuthsService: Unit tests for registration and login
- E2E tests: Basic integration test

---

## 🎯 What's Next

- [ ] **Refresh tokens** for better security
- [ ] **Role-based authorization** (admin/user roles)
- [ ] **API documentation** (Swagger/OpenAPI)
- [ ] **Logging system** (Winston or similar)
- [ ] **Docker** containerization
- [ ] **CI/CD** pipeline
- [ ] **Rate limiting** and security headers
- [ ] **Email verification** for new users

---

## 📄 License

This project is for study and personal use.
