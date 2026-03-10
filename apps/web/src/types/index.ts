// Category types
export enum CategoryType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
}

export interface Category {
  id: string;
  name: string;
  type: CategoryType;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryDto {
  name: string;
  type: CategoryType;
}

export interface UpdateCategoryDto {
  name?: string;
  type?: CategoryType;
}

// Auth types
export interface User {
  id: string;
  email: string;
  name: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
}

// Budget types
export enum BudgetType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
}

export interface Budget {
  id: string;
  amount: string;
  categoryId: string;
  month: number;
  year: number;
  type: BudgetType;
  userId: string;
}

export interface CreateBudgetDto {
  amount: number;
  categoryId: string;
  month: number;
  year: number;
  type: BudgetType;
}

export interface UpdateBudgetDto {
  amount?: number;
  categoryId?: string;
  month?: number;
  year?: number;
  type?: BudgetType;
}

interface BudgetWithSpendingBase {
  id: string;
  amount: string;
  categoryId: string;
  month: number;
  year: number;
  remaining: string;
  utilizationPercentage: number;
}

export interface BudgetWithSpendingExpense extends BudgetWithSpendingBase {
  type: BudgetType.EXPENSE;
  spent: string;
}

export interface BudgetWithSpendingIncome extends BudgetWithSpendingBase {
  type: BudgetType.INCOME;
  earned: string;
}

export type BudgetWithSpending =
  | BudgetWithSpendingExpense
  | BudgetWithSpendingIncome;

export interface BudgetWithDetailsExpense extends BudgetWithSpendingExpense {
  category: Category | null;
  transactions: Transaction[];
}

export interface BudgetWithDetailsIncome extends BudgetWithSpendingIncome {
  category: Category | null;
  transactions: Transaction[];
}

export type BudgetWithDetails =
  | BudgetWithDetailsExpense
  | BudgetWithDetailsIncome;

// Transaction types
export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
}

export interface Transaction {
  id: string;
  amount: string;
  type: TransactionType;
  categoryId: string;
  date: string;
  description?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTransactionDto {
  amount: number;
  type: TransactionType;
  categoryId: string;
  date: string;
  description?: string;
}

export interface UpdateTransactionDto {
  amount?: number;
  type?: TransactionType;
  categoryId?: string;
  date?: string;
  description?: string;
}

// API Response types
export interface ApiError {
  message: string;
  statusCode: number;
}

// Dashboard types
export interface MonthlySummary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
}

export interface BudgetVsActual {
  categoryId: string;
  category: { id: string; name: string; type: CategoryType };
  budget: number;
  actual: number;
  difference: number;
  percentageUsed: number;
}

export interface CategoryBreakdown {
  categoryId: string;
  category: { id: string; name: string; type: CategoryType };
  totalAmount: number;
  percentage: number;
}

export interface TopExpense {
  id: string;
  description: string | null;
  date: string;
  amount: number;
  category: { id: string; name: string; type: CategoryType };
}
