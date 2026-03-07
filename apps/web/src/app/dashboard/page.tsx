'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { dashboardApi } from '@/lib/dashboard';
import {
  MonthlySummary,
  BudgetVsActual,
  CategoryBreakdown,
  TopExpense,
} from '@/types';
import { AuthLayout } from '@/components/layouts/AuthLayout';
import { ApiException } from '@/lib/api';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const COLORS = [
  '#3b82f6',
  '#ef4444',
  '#10b981',
  '#f59e0b',
  '#8b5cf6',
  '#06b6d4',
];

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

function formatMonthYear(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function DashboardPage() {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [summary, setSummary] = useState<MonthlySummary | null>(null);
  const [budgetVsActual, setBudgetVsActual] = useState<BudgetVsActual[]>([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState<
    CategoryBreakdown[]
  >([]);
  const [topExpenses, setTopExpenses] = useState<TopExpense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [summaryError, setSummaryError] = useState(false);
  const { isAuthenticated, logout } = useAuth();
  const router = useRouter();

  const month = currentDate.getMonth() + 1;
  const year = currentDate.getFullYear();

  const goToPrev = () =>
    setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const goToNext = () =>
    setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));

  useEffect(() => {
    if (!isAuthenticated) return;

    setIsLoading(true);
    setSummaryError(false);

    const handle401 = () => {
      logout();
      router.push('/login');
    };

    const summaryPromise = dashboardApi
      .getMonthlySummary(month, year)
      .then((data) => setSummary(data))
      .catch((err) => {
        if (err instanceof ApiException && err.statusCode === 401) {
          handle401();
          throw err;
        }
        setSummaryError(true);
      });

    const budgetPromise = dashboardApi
      .getBudgetVsActual(month, year)
      .then((data) => setBudgetVsActual(data))
      .catch((err) => {
        if (err instanceof ApiException && err.statusCode === 401) {
          handle401();
          throw err;
        }
        setBudgetVsActual([]);
      });

    const breakdownPromise = dashboardApi
      .getCategoryBreakdown(month, year)
      .then((data) => setCategoryBreakdown(data))
      .catch((err) => {
        if (err instanceof ApiException && err.statusCode === 401) {
          handle401();
          throw err;
        }
        setCategoryBreakdown([]);
      });

    const topExpensesPromise = dashboardApi
      .getTopExpenses(month, year)
      .then((data) => setTopExpenses(data))
      .catch((err) => {
        if (err instanceof ApiException && err.statusCode === 401) {
          handle401();
          throw err;
        }
        setTopExpenses([]);
      });

    Promise.allSettled([
      summaryPromise,
      budgetPromise,
      breakdownPromise,
      topExpensesPromise,
    ]).finally(() => setIsLoading(false));
  }, [isAuthenticated, month, year, logout, router]);

  return (
    <AuthLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-foreground">Dashboard</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={goToPrev}
            aria-label="Previous month"
            className="p-1 rounded hover:bg-muted text-muted-foreground"
          >
            ←
          </button>
          <span className="text-sm font-medium text-foreground min-w-[120px] text-center">
            {formatMonthYear(currentDate)}
          </span>
          <button
            onClick={goToNext}
            aria-label="Next month"
            className="p-1 rounded hover:bg-muted text-muted-foreground"
          >
            →
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="bg-card rounded-lg shadow p-6 animate-pulse"
            >
              <div className="h-4 bg-muted rounded w-1/2 mb-3" />
              <div className="h-8 bg-muted rounded w-3/4" />
            </div>
          ))}
        </div>
      ) : summaryError ? (
        <div className="bg-card rounded-lg shadow p-6 mb-6 text-center text-muted-foreground">
          Failed to load monthly summary.
        </div>
      ) : summary ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-card rounded-lg shadow p-6">
            <p className="text-sm text-muted-foreground mb-1">Total Income</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {formatCurrency(summary.totalIncome)}
            </p>
          </div>
          <div className="bg-card rounded-lg shadow p-6">
            <p className="text-sm text-muted-foreground mb-1">Total Expenses</p>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
              {formatCurrency(summary.totalExpense)}
            </p>
          </div>
          <div className="bg-card rounded-lg shadow p-6">
            <p className="text-sm text-muted-foreground mb-1">Balance</p>
            <p
              className={`text-2xl font-bold ${summary.balance >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}`}
            >
              {formatCurrency(summary.balance)}
            </p>
          </div>
        </div>
      ) : null}

      {/* Charts Row */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {[0, 1].map((i) => (
            <div
              key={i}
              className="bg-card rounded-lg shadow p-6 animate-pulse"
            >
              <div className="h-4 bg-muted rounded w-1/3 mb-4" />
              <div className="h-48 bg-muted rounded" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Category Breakdown Pie Chart */}
          <div className="bg-card rounded-lg shadow p-6">
            <h3 className="text-base font-semibold text-foreground mb-4">
              Category Breakdown
            </h3>
            {categoryBreakdown.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-8">
                No category data for this period.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={categoryBreakdown}
                    dataKey="totalAmount"
                    nameKey={(entry: CategoryBreakdown) => entry.category.name}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, percentage }: { name: string; percentage: number }) =>
                      `${name} ${percentage.toFixed(1)}%`
                    }
                  >
                    {categoryBreakdown.map((_, index) => (
                      <Cell
                        key={index}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Legend
                    formatter={(value, entry) => {
                      const item = categoryBreakdown.find(
                        (c) => c.category.name === value,
                      );
                      return item ? item.category.name : value;
                    }}
                  />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Budget vs Actual Bar Chart */}
          <div className="bg-card rounded-lg shadow p-6">
            <h3 className="text-base font-semibold text-foreground mb-4">
              Budget vs Actual
            </h3>
            {budgetVsActual.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-8">
                No budget data for this period.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart
                  data={budgetVsActual.map((b) => ({
                    name: b.category.name,
                    Budget: b.budget,
                    Actual: b.actual,
                  }))}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend />
                  <Bar dataKey="Budget" fill="#3b82f6" />
                  <Bar dataKey="Actual" fill="#ef4444" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      )}

      {/* Top Expenses Table */}
      <div className="bg-card rounded-lg shadow">
        <div className="p-6 border-b">
          <h3 className="text-base font-semibold text-foreground">
            Top Expenses
          </h3>
        </div>
        {isLoading ? (
          <div className="p-6 animate-pulse">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="flex gap-4 mb-3">
                <div className="h-4 bg-muted rounded w-1/4" />
                <div className="h-4 bg-muted rounded w-1/4" />
                <div className="h-4 bg-muted rounded w-1/4" />
                <div className="h-4 bg-muted rounded w-1/4" />
              </div>
            ))}
          </div>
        ) : topExpenses.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            No expenses for this period.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-6 py-3 text-left font-medium text-muted-foreground">
                  Date
                </th>
                <th className="px-6 py-3 text-left font-medium text-muted-foreground">
                  Category
                </th>
                <th className="px-6 py-3 text-left font-medium text-muted-foreground">
                  Description
                </th>
                <th className="px-6 py-3 text-right font-medium text-muted-foreground">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {topExpenses.map((expense) => (
                <tr key={expense.id} className="border-b last:border-0">
                  <td className="px-6 py-4 text-muted-foreground">
                    {formatDate(expense.date)}
                  </td>
                  <td className="px-6 py-4 font-medium">
                    {expense.category.name}
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {expense.description ?? '—'}
                  </td>
                  <td className="px-6 py-4 text-right font-medium text-red-600 dark:text-red-400">
                    {formatCurrency(expense.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AuthLayout>
  );
}
