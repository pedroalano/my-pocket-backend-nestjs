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
