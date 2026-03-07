# My Pocket - Personal Finance Management

A full-stack personal finance application built as a monorepo with **NestJS** backend, **Next.js** frontend, and shared packages.

---

## 🏗️ Monorepo Structure

This project uses **Turborepo** with npm workspaces for efficient builds and development.

```
my-pocket/
├── apps/
│   ├── api/           # NestJS backend API
│   └── web/           # Next.js frontend
├── packages/
│   └── shared/        # Shared types and utilities
├── prisma/            # Database schema and migrations
├── docker/            # Dockerfiles for each app
├── turbo.json         # Turborepo configuration
└── package.json       # Root workspace configuration
```

---

## 🚀 Tech Stack

### Backend (apps/api)

- **Framework:** NestJS
- **Language:** TypeScript
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Authentication:** JWT + Passport
- **Validation:** class-validator & class-transformer
- **Testing:** Jest

### Frontend (apps/web)

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS 4
- **UI Components:** shadcn/ui, Radix UI
- **Icons:** Lucide React
- **Notifications:** Sonner
- **Charts:** Recharts
- **Theme:** next-themes (Light / Dark / System)
- **Bundler:** Turbopack
- **Testing:** Vitest + Testing Library + MSW

### Shared (packages/shared)

- Shared TypeScript types
- API response interfaces
- Common utilities

---

## 📋 Prerequisites

- **Node.js** 22+ (uses `packageManager: npm@10.9.2`)
- **PostgreSQL** 16+
- **Docker** (recommended for local development)

---

## ⚙️ Environment Setup

Create a `.env` file in the root directory:

```env
# Runtime
NODE_ENV=development
PORT=3001

# Database Connection (PostgreSQL)
DATABASE_URL="postgresql://user:password@localhost:5432/my_pocket_db?schema=public"

# JWT Authentication (secret must be >= 32 chars)
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_EXPIRATION=3600
```

For the frontend, create `apps/web/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Environment Files Reference

| File                  | Purpose                                       |
| --------------------- | --------------------------------------------- |
| `.env`                | Main environment (copied from `.env.example`) |
| `.env.example`        | Template with all required variables          |
| `.env.test`           | Test database configuration (port 5433)       |
| `apps/web/.env.local` | Frontend API URL configuration                |

---

## 🚀 Getting Started

### 1. Install Dependencies

```bash
# Install all workspace dependencies
npm install
```

### 2. Setup Database

```bash
# Start PostgreSQL with Docker
docker-compose up -d postgres

# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate:dev

# (Optional) Seed the database
npm run db:seed
```

### 3. Development

```bash
# Start all apps in development mode
npm run dev

# Or start individually
npm run dev:api    # Backend only (port 3001)
npm run dev:web    # Frontend only (port 3000)
```

### 4. Build

```bash
# Build all apps
npm run build

# Build specific app
npm run build --filter=@my-pocket/api
npm run build --filter=@my-pocket/web
```

---

## 🧪 Testing

```bash
# Run all tests
npm run test

# Run tests with coverage
npm run test:cov

# Run e2e tests (backend)
npm run test:e2e --filter=@my-pocket/api
```

---

## 🐳 Docker

### Development (with hot-reload)

```bash
# Start all services with hot-reload
npm run docker:dev

# Build and start (after Dockerfile changes)
npm run docker:dev:build

# Stop all services
npm run docker:dev:down
```

### Production

```bash
# Start production containers
npm run docker:prod

# Build and start production containers
npm run docker:prod:build

# Stop production containers
npm run docker:prod:down
```

**Services:**

| Service         | Description              | Port |
| --------------- | ------------------------ | ---- |
| `postgres`      | PostgreSQL database      | 5432 |
| `postgres-test` | PostgreSQL test database | 5433 |
| `api`           | NestJS backend           | 3001 |
| `web`           | Next.js frontend         | 3000 |

---

## 📦 Available Scripts

### Development

| Script             | Description                        |
| ------------------ | ---------------------------------- |
| `npm run dev`      | Start all apps in development mode |
| `npm run dev:api`  | Start backend only (port 3001)     |
| `npm run dev:web`  | Start frontend only (port 3000)    |
| `npm run build`    | Build all apps                     |
| `npm run lint`     | Lint all apps                      |
| `npm run format`   | Format code with Prettier          |
| `npm run test`     | Run all tests                      |
| `npm run test:cov` | Run tests with coverage            |
| `npm run clean`    | Clean build artifacts              |

### Database

| Script                      | Description                            |
| --------------------------- | -------------------------------------- |
| `npm run db:generate`       | Generate Prisma client                 |
| `npm run db:migrate:dev`    | Run migrations (development)           |
| `npm run db:migrate:test`   | Run migrations against test database   |
| `npm run db:migrate:deploy` | Run migrations (production)            |
| `npm run db:push`           | Push schema changes without migrations |
| `npm run db:studio`         | Open Prisma Studio                     |
| `npm run db:seed`           | Seed database with initial data        |

### Docker

| Script                      | Description                           |
| --------------------------- | ------------------------------------- |
| `npm run docker:dev`        | Start dev containers                  |
| `npm run docker:dev:build`  | Build and start dev containers        |
| `npm run docker:dev:down`   | Stop dev containers                   |
| `npm run docker:prod`       | Start production containers           |
| `npm run docker:prod:build` | Build and start production containers |
| `npm run docker:prod:down`  | Stop production containers            |

---

## 📖 API Documentation

Once the API is running, visit:

- **Swagger UI:** http://localhost:3001/docs

### API Endpoints Summary

| Endpoint                        | Method | Description                        |
| ------------------------------- | ------ | ---------------------------------- |
| `/auths/register`               | POST   | Register a new user                |
| `/auths/login`                  | POST   | Login and get JWT token            |
| `/categories`                   | GET    | List all categories                |
| `/categories/:id`               | GET    | Get category by ID                 |
| `/categories`                   | POST   | Create a new category              |
| `/categories/:id`               | PUT    | Update a category                  |
| `/categories/:id`               | DELETE | Delete a category                  |
| `/transactions`                 | GET    | List all transactions              |
| `/transactions/:id`             | GET    | Get transaction by ID              |
| `/transactions`                 | POST   | Create a new transaction           |
| `/transactions/:id`             | PUT    | Update a transaction               |
| `/transactions/:id`             | DELETE | Delete a transaction               |
| `/budgets`                      | GET    | List all budgets                   |
| `/budgets/:id`                  | GET    | Get budget by ID                   |
| `/budgets/:id/details`          | GET    | Get budget with spending details   |
| `/budgets/category/:categoryId` | GET    | Get budgets by category            |
| `/budgets`                      | POST   | Create a new budget                |
| `/budgets/:id`                  | PUT    | Update a budget                    |
| `/budgets/:id`                  | DELETE | Delete a budget                    |
| `/dashboard/monthly-summary`    | GET    | Get monthly income/expense summary |
| `/dashboard/budget-vs-actual`   | GET    | Compare budgets vs actual spending |
| `/dashboard/category-breakdown` | GET    | Get spending breakdown by category |
| `/dashboard/top-expenses`       | GET    | Get top expense transactions       |
| `/health`                       | GET    | Health check endpoint              |

---

## 📋 Features

### API
- ✅ User registration and authentication with JWT
- ✅ Protected routes with authentication guards
- ✅ Categories, Transactions, and Budgets management
- ✅ Budget analytics and spending tracking
- ✅ Dashboard with financial analytics
- ✅ Strict per-user data isolation
- ✅ Comprehensive validation using DTOs
- ✅ Global exception handling
- ✅ Interactive API documentation (Swagger/OpenAPI at `/docs`)

### Frontend
- ✅ Dashboard as post-login landing page with charts and monthly summary
- ✅ Dark / Light / System theme toggle (persisted via `localStorage`)
- ✅ Full CRUD for Categories, Transactions, and Budgets
- ✅ Budget spending tracking with utilization indicators
- ✅ Responsive design with shadcn/ui components
- ✅ Error boundary with recovery UI

---

## 🔧 Project Configuration

### Turborepo Tasks

Tasks are defined in `turbo.json`:

- `build` - Builds apps with dependency graph
- `dev` - Runs development servers (no cache)
- `lint` - Runs linting
- `test` - Runs tests

### TypeScript

- `tsconfig.base.json` - Shared compiler options
- Each app extends the base configuration

---

## 🔨 Troubleshooting

### New routes returning 404 in Docker

If you add a new route file (e.g., `apps/web/src/app/newpage/page.tsx`) and it returns 404:

1. **Clear Next.js cache:**

   ```bash
   cd apps/web && npm run clean
   ```

2. **Restart the web container:**

   ```bash
   docker compose -f docker-compose.dev.yml restart web
   ```

3. **Or rebuild from scratch:**
   ```bash
   docker compose -f docker-compose.dev.yml up web --build
   ```

---

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Run `npm run lint` and `npm run test`
4. Submit a pull request

---

## 📄 License

This project is for study and personal use.
