# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
```bash
npm install                  # Install all workspace dependencies
npm run dev                  # Start all apps (API on :3001, web on :3000)
npm run dev:api              # Backend only
npm run dev:web              # Frontend only
npm run lint                 # Lint all apps
npm run format               # Prettier format
```

### Testing
```bash
npm run test                          # Run all tests via Turborepo
npm run test:cov                      # With coverage

# API unit tests (Jest, NODE_ENV=test)
cd apps/api && npm run test           # All unit tests
cd apps/api && npm run test:watch     # Watch mode
cd apps/api && npm test -- --testPathPattern=auths  # Single module

# API e2e tests
cd apps/api && npm run test:e2e       # Requires test DB running on port 5433

# Web tests (Vitest + Testing Library + MSW)
cd apps/web && npm run test           # Watch mode
cd apps/web && npm run test:run       # Single run
cd apps/web && npm run test:coverage  # With coverage
```

### Database
```bash
npm run db:generate          # Regenerate Prisma client after schema changes
npm run db:migrate:dev       # Run migrations (dev DB)
npm run db:migrate:test      # Run migrations against test DB (port 5433)
npm run db:studio            # Open Prisma Studio
npm run db:seed              # Seed database
```

### Docker
```bash
npm run docker:dev           # Start all services with hot-reload
npm run docker:dev:build     # Rebuild and start
npm run docker:dev:down      # Stop
```

## Architecture

### Monorepo Structure
This is a **Turborepo + npm workspaces** monorepo:
- `apps/api` — NestJS backend (`@my-pocket/api`)
- `apps/web` — Next.js 15 frontend (`@my-pocket/web`)
- `packages/shared` — shared TypeScript types/interfaces (`@my-pocket/shared`)
- `prisma/` — single Prisma schema at root, shared by all apps

### Backend (`apps/api`)

**NestJS modular architecture** under `src/modules/`:
- `auths` — registration, login, JWT strategy (`jwt.strategy.ts`), guard (`jwt-auth.guard.ts`)
- `categories`, `transactions`, `budgets`, `dashboard` — domain modules, each with controller/service/dto
- `health` — single `GET /health` endpoint for service availability checks
- `shared` — exports `PrismaService` (extends `PrismaClient`) and `formatDecimal` utility; imported as `SharedModule` globally
- `config` — env loading via `ConfigModule.forRoot`, Joi validation schema (`env.validation.ts`), typed config accessors
- `common/filters` — global `HttpExceptionFilter`

**Request flow:** Controller → `JwtAuthGuard` → Service → `PrismaService`

**JWT payload:** `{ userId, email }` — controllers extract `userId` from the request user object to enforce per-user data isolation in every query.

**Env file resolution** (in `app.module.ts`):
- `NODE_ENV=test` → `.env.test`
- `NODE_ENV=docker` → `.env.docker`
- default → `.env`

**`PrismaService`** has a safety guard: refuses to connect if `NODE_ENV=test` and the database URL doesn't look like a local/test database.

**Monetary amounts** are stored as `Decimal(10,2)` in Postgres. Always use the `formatDecimal` helper from `modules/shared` when returning amounts to clients (converts Prisma `Decimal` to a plain `number`).

**Swagger** is served at `/docs` (not `/api`).

**i18n:** `nestjs-i18n` with `AcceptLanguageResolver`. Translation JSON files in `src/i18n/en/` and `src/i18n/pt-BR/` (one file per module: `auth`, `categories`, `transactions`, `budgets`, `dashboard`, `validation`). All service error messages use `this.i18n.t('module.errors.key', { args, lang })`. `I18nValidationPipe` and `I18nValidationExceptionFilter` replace the default NestJS pipe in `main.ts`. In unit tests, mock `I18nService` as `{ t: jest.fn((key) => key) }`.

### Frontend (`apps/web`)

**Next.js 15 App Router** with colocated page tests (`page.test.tsx`).

**Auth:** `AuthContext` (`src/contexts/AuthContext.tsx`) stores the JWT in `localStorage`. User info is decoded client-side from the JWT payload.

**API layer:**
- `src/lib/api.ts` — `apiRequest` base function (fetch + Bearer token injection + `Accept-Language` header + error handling), exported as `api.get/post/put/delete`
- `src/lib/categories.ts`, `transactions.ts`, `budgets.ts`, `dashboard.ts` — domain-specific API helpers built on `api`
- `src/lib/formatters.ts` — locale-aware `formatCurrency` / `formatCurrencyFromString` / `formatDate` / `formatMonthYear`; pass the locale from `useLocale()` (next-intl)
- `ApiException` is thrown for non-2xx responses, carrying `statusCode` and message

**Testing stack:** Vitest + Testing Library + `msw` for HTTP mocking. MSW handlers live in `src/test/mocks/handlers.ts`; the server is set up in `src/test/setup.ts`. `renderWithProviders` in `src/test/test-utils.tsx` wraps the tree with `NextIntlClientProvider locale="en"` so all components can call `useTranslations`.

**Theme:** `ThemeProvider` (`src/contexts/ThemeProvider.tsx`) wraps the root layout and wires up `next-themes` with `attribute="class"`. The `ThemeToggle` component (`src/components/ThemeToggle.tsx`) renders a dropdown (Light / Dark / System) in the `AuthLayout` header. All page backgrounds and text use semantic Tailwind tokens (`bg-background`, `text-foreground`, `text-muted-foreground`, etc.) so they respond to the active theme.

**i18n:** `next-intl` with cookie-based locale (`NEXT_LOCALE`). Locale resolver at `src/i18n/request.ts`. Message files at `messages/en.json` and `messages/pt-BR.json`. Root layout is `async` and wraps with `NextIntlClientProvider`. The `LanguageToggle` component (`src/components/LanguageToggle.tsx`) in `AuthLayout` sets the cookie and calls `router.refresh()`. All pages/components use `useTranslations(namespace)` — never hardcode UI strings. Month labels come from the `months` namespace (1–12). The `Accept-Language` header is derived from the `NEXT_LOCALE` cookie in `src/lib/api.ts` so backend errors arrive in the active language.

**Error handling:** `ErrorBoundary` (`src/components/ErrorBoundary.tsx`) wraps the app in `layout.tsx`. It is implemented as a functional component (`ErrorBoundary`) that renders an inner class component (`ErrorBoundaryInner`) — this allows the outer wrapper to call `useTranslations` while the class component handles `componentDidCatch`.

**UI:** shadcn/ui components in `src/components/ui/` (auto-generated, don't hand-edit). Feature components (`CategoryForm`, `TransactionForm`, `BudgetForm`, `BudgetDetails`, `ThemeToggle`, `LanguageToggle`) live directly in `src/components/`. Charts use `recharts` (PieChart, BarChart) in the dashboard page.

**Post-login landing page:** `/dashboard` — authenticated users are redirected there from `/` and after login/registration.

### Shared Package (`packages/shared`)
Contains TypeScript interfaces (`ApiResponse`, `PaginatedResponse`, base entity types) and enums (`TransactionType`, `BudgetType`) used by both apps. Import as `@my-pocket/shared`.

### Database Schema
Four models in `prisma/schema.prisma`:
- `User` — owns all other entities
- `Category` — `(name, type, userId)` unique; type is `INCOME | EXPENSE`
- `Transaction` — linked to a category; amount stored as `Decimal(10,2)`
- `Budget` — `(categoryId, month, year, userId)` unique; tracks budget per category per month

All data access is scoped by `userId`. Cascade deletes are set on all foreign keys.

## Git Conventions

- Never add Claude as co-author in git commits
- Always create a new branch before starting any work
- Follow conventional commits format: `feat(scope)`, `fix(scope)`, `docs(scope)`, etc.
- Branch naming must match the commit type prefix: `feat/`, `fix/`, `docs/`, etc.

## General Conventions

- Never make assumptions — always ask when in doubt
- Never hand-edit files inside `src/components/ui/` (auto-generated by shadcn/ui)
- Always use `formatDecimal` when returning monetary amounts to clients
- Always scope data queries by `userId` to enforce per-user data isolation
- New backend modules must follow the pattern: controller / service / dto
- New frontend API calls must go through `src/lib/` helpers, never fetch directly in components
- Never hardcode UI strings — always use `useTranslations(namespace)` and add keys to both `messages/en.json` and `messages/pt-BR.json`
- Never hardcode backend error strings — always use `this.i18n.t('module.errors.key', { args, lang })` and add keys to both `src/i18n/en/*.json` and `src/i18n/pt-BR/*.json`

## Testing Conventions

- Always create tests for new features
- Always create regression tests for bug fixes, alterations, and any other changes when necessary
- API unit tests use Jest; web tests use Vitest + Testing Library + MSW
- MSW handlers for new endpoints must be added to `src/test/mocks/handlers.ts`
