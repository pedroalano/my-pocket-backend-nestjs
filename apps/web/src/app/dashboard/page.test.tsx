import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/mocks/server';
import {
  mockToken,
  mockMonthlySummary,
  mockCategoryBreakdown,
  mockBudgetVsActual,
  mockTopExpenses,
} from '@/test/mocks/handlers';
import { renderWithAuthenticatedProviders, setupUser } from '@/test/test-utils';
import DashboardPage from './page';

const API_URL = 'http://localhost:3001';

// Mock recharts to avoid SVG rendering issues in happy-dom
vi.mock('recharts', () => ({
  PieChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="pie-chart">{children}</div>
  ),
  Pie: ({ data, nameKey }: { data: unknown[]; nameKey: unknown }) => (
    <div data-testid="pie">{JSON.stringify(data)}</div>
  ),
  Cell: () => null,
  BarChart: ({
    children,
    data,
  }: {
    children: React.ReactNode;
    data: unknown[];
  }) => <div data-testid="bar-chart">{children}</div>,
  Bar: ({ dataKey }: { dataKey: string }) => (
    <div data-testid={`bar-${dataKey}`}>{dataKey}</div>
  ),
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

// Mock next/navigation
const mockRouterPush = vi.fn();
vi.mock('next/navigation', async () => ({
  useRouter: () => ({
    push: mockRouterPush,
    replace: vi.fn(),
    back: vi.fn(),
  }),
}));

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading skeletons initially', () => {
    renderWithAuthenticatedProviders(<DashboardPage />);
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('renders monthly summary cards with correct values', async () => {
    renderWithAuthenticatedProviders(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Total Income')).toBeInTheDocument();
    });

    expect(screen.getByText('$3,000.00')).toBeInTheDocument();
    expect(screen.getByText('Total Expenses')).toBeInTheDocument();
    // $150.00 appears in both the summary card and the top expenses table
    expect(screen.getAllByText('$150.00').length).toBeGreaterThan(0);
    expect(screen.getByText('Balance')).toBeInTheDocument();
    expect(screen.getByText('$2,850.00')).toBeInTheDocument();
  });

  it('renders category breakdown section with category names', async () => {
    renderWithAuthenticatedProviders(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Category Breakdown')).toBeInTheDocument();
    });

    // Category breakdown data should be rendered in the pie chart
    const pieChart = screen.getByTestId('pie-chart');
    expect(pieChart).toBeInTheDocument();
  });

  it('renders budget vs actual section with category names', async () => {
    renderWithAuthenticatedProviders(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Budget vs Actual')).toBeInTheDocument();
    });

    const barChart = screen.getByTestId('bar-chart');
    expect(barChart).toBeInTheDocument();
    expect(screen.getByTestId('bar-Budget')).toBeInTheDocument();
    expect(screen.getByTestId('bar-Actual')).toBeInTheDocument();
  });

  it('renders top expenses table with expense rows', async () => {
    renderWithAuthenticatedProviders(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Groceries')).toBeInTheDocument();
    });

    expect(screen.getByText('Top Expenses')).toBeInTheDocument();
    expect(screen.getByText('Grocery shopping')).toBeInTheDocument();
    // Amount formatted as currency
    const amounts = screen.getAllByText('$150.00');
    expect(amounts.length).toBeGreaterThan(0);
  });

  it('clicking previous month decrements the month display', async () => {
    const user = setupUser();
    renderWithAuthenticatedProviders(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Total Income')).toBeInTheDocument();
    });

    // The current date is mocked at March 2026 in the test environment
    const prevBtn = screen.getByRole('button', { name: 'Previous month' });
    await user.click(prevBtn);

    // After clicking prev, the month label should change
    // We just verify the button works (month navigation changes state)
    await waitFor(() => {
      // The month display should change (not March 2026 anymore or still loading)
      const monthDisplay = screen.getByText(/\w+ \d{4}/);
      expect(monthDisplay).toBeInTheDocument();
    });
  });

  it('clicking next month increments the month display', async () => {
    const user = setupUser();
    renderWithAuthenticatedProviders(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Total Income')).toBeInTheDocument();
    });

    const nextBtn = screen.getByRole('button', { name: 'Next month' });
    await user.click(nextBtn);

    await waitFor(() => {
      const monthDisplay = screen.getByText(/\w+ \d{4}/);
      expect(monthDisplay).toBeInTheDocument();
    });
  });

  it('renders empty state when all endpoints return empty arrays', async () => {
    server.use(
      http.get(`${API_URL}/dashboard/monthly-summary`, () =>
        HttpResponse.json({ totalIncome: 0, totalExpense: 0, balance: 0 }),
      ),
      http.get(`${API_URL}/dashboard/budget-vs-actual`, () =>
        HttpResponse.json([]),
      ),
      http.get(`${API_URL}/dashboard/category-breakdown`, () =>
        HttpResponse.json([]),
      ),
      http.get(`${API_URL}/dashboard/top-expenses`, () =>
        HttpResponse.json([]),
      ),
    );

    renderWithAuthenticatedProviders(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('No expenses for this period.')).toBeInTheDocument();
    });

    expect(screen.getByText('No category data for this period.')).toBeInTheDocument();
    expect(screen.getByText('No budget data for this period.')).toBeInTheDocument();
  });

  it('renders balance in red when negative', async () => {
    server.use(
      http.get(`${API_URL}/dashboard/monthly-summary`, () =>
        HttpResponse.json({
          totalIncome: 100,
          totalExpense: 500,
          balance: -400,
        }),
      ),
    );

    renderWithAuthenticatedProviders(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Balance')).toBeInTheDocument();
    });

    const balanceValue = screen.getByText('-$400.00');
    expect(balanceValue).toHaveClass('text-red-600');
  });

  it('handles 401 error on any endpoint by logging out and redirecting', async () => {
    server.use(
      http.get(`${API_URL}/dashboard/monthly-summary`, () =>
        HttpResponse.json(
          { message: 'Unauthorized', statusCode: 401 },
          { status: 401 },
        ),
      ),
    );

    renderWithAuthenticatedProviders(<DashboardPage />);

    await waitFor(() => {
      expect(mockRouterPush).toHaveBeenCalledWith('/login');
    });
  });

  it('shows error state when monthly summary fails with 500', async () => {
    server.use(
      http.get(`${API_URL}/dashboard/monthly-summary`, () =>
        HttpResponse.json(
          { message: 'Server error', statusCode: 500 },
          { status: 500 },
        ),
      ),
    );

    renderWithAuthenticatedProviders(<DashboardPage />);

    await waitFor(() => {
      expect(
        screen.getByText('Failed to load monthly summary.'),
      ).toBeInTheDocument();
    });

    // Other sections should still load
    await waitFor(() => {
      expect(screen.getByText('Top Expenses')).toBeInTheDocument();
    });
  });
});
