import { api } from '@/lib/api';
import type {
  MonthlySummary,
  BudgetVsActual,
  CategoryBreakdown,
  TopExpense,
} from '@/types';

export const dashboardApi = {
  getMonthlySummary: (month: number, year: number) =>
    api.get<MonthlySummary>(
      `/dashboard/monthly-summary?month=${month}&year=${year}`,
    ),

  getBudgetVsActual: (month: number, year: number) =>
    api.get<BudgetVsActual[]>(
      `/dashboard/budget-vs-actual?month=${month}&year=${year}`,
    ),

  getCategoryBreakdown: (month: number, year: number) =>
    api.get<CategoryBreakdown[]>(
      `/dashboard/category-breakdown?month=${month}&year=${year}`,
    ),

  getTopExpenses: (month: number, year: number, limit = 5) =>
    api.get<TopExpense[]>(
      `/dashboard/top-expenses?month=${month}&year=${year}&limit=${limit}`,
    ),
};
