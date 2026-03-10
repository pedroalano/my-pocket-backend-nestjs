import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/mocks/server';
import { mockBudgets } from '@/test/mocks/handlers';
import {
  renderWithAuthenticatedProviders,
  setupUser,
  selectOption,
} from '@/test/test-utils';
import BudgetsPage from './page';

const API_URL = 'http://localhost:3001';

// Mock next/navigation — return a stable router reference to avoid useCallback re-creation loops
const mockRouterPush = vi.fn();
const _mockBudgetsRouter = { push: mockRouterPush, replace: vi.fn(), back: vi.fn() };
vi.mock('next/navigation', async () => ({
  useRouter: () => _mockBudgetsRouter,
}));

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('BudgetsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set up authenticated state
  });

  it('renders loading skeleton initially', () => {
    renderWithAuthenticatedProviders(<BudgetsPage />);
    // The skeleton should be visible while loading
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('renders budget list from API', async () => {
    renderWithAuthenticatedProviders(<BudgetsPage />);

    await waitFor(() => {
      // Budget amounts should be displayed
      expect(screen.getByText('$500.00')).toBeInTheDocument();
    });

    expect(screen.getByText('$3,000.00')).toBeInTheDocument();
    expect(screen.getByText('Income')).toBeInTheDocument();
    expect(screen.getByText('Expense')).toBeInTheDocument();
  });

  it('displays category names for budgets', async () => {
    renderWithAuthenticatedProviders(<BudgetsPage />);

    await waitFor(() => {
      // Category names should be resolved from categoryId
      expect(screen.getByText('Groceries')).toBeInTheDocument();
    });

    expect(screen.getByText('Salary')).toBeInTheDocument();
  });

  it('shows empty state when no budgets exist', async () => {
    server.use(
      http.get(`${API_URL}/budgets`, () => {
        return HttpResponse.json([]);
      }),
    );

    renderWithAuthenticatedProviders(<BudgetsPage />);

    await waitFor(() => {
      expect(
        screen.getByText(
          'No budgets yet. Create your first budget to get started.',
        ),
      ).toBeInTheDocument();
    });
  });

  it('shows "no matches" message when filters yield no results', async () => {
    const user = setupUser();
    renderWithAuthenticatedProviders(<BudgetsPage />);

    await waitFor(() => {
      expect(screen.getByText('$500.00')).toBeInTheDocument();
    });

    // Filter by month that has no budget (December) - mock data has March only
    await selectOption(user, screen.getByTestId('month-filter'), 'December');

    expect(
      screen.getByText('No budgets match your filters.'),
    ).toBeInTheDocument();
  });

  it('filters budgets by type', async () => {
    const user = setupUser();
    renderWithAuthenticatedProviders(<BudgetsPage />);

    await waitFor(() => {
      expect(screen.getByText('$500.00')).toBeInTheDocument();
    });

    // Filter by INCOME
    await selectOption(user, screen.getByTestId('type-filter'), 'Income');

    // Only INCOME budget should be visible
    expect(screen.getByText('$3,000.00')).toBeInTheDocument();
    expect(screen.queryByText('$500.00')).not.toBeInTheDocument();
  });

  it('filters budgets by month', async () => {
    const user = setupUser();

    // Add more budgets with different months
    server.use(
      http.get(`${API_URL}/budgets`, () => {
        return HttpResponse.json([
          ...mockBudgets,
          {
            id: 'budget-3',
            amount: '200.00',
            categoryId: 'cat-2',
            month: 4,
            year: 2026,
            type: 'EXPENSE',
            userId: 'test-user-id',
          },
        ]);
      }),
    );

    renderWithAuthenticatedProviders(<BudgetsPage />);

    await waitFor(() => {
      expect(screen.getByText('$500.00')).toBeInTheDocument();
    });

    // Filter by month 4 (April)
    await selectOption(user, screen.getByTestId('month-filter'), 'April');

    // Only April budget should be visible
    expect(screen.getByText('$200.00')).toBeInTheDocument();
    expect(screen.queryByText('$500.00')).not.toBeInTheDocument();
    expect(screen.queryByText('$3,000.00')).not.toBeInTheDocument();
  });

  it('filters budgets by year', async () => {
    const user = setupUser();

    // Add budget with different year
    server.use(
      http.get(`${API_URL}/budgets`, () => {
        return HttpResponse.json([
          ...mockBudgets,
          {
            id: 'budget-3',
            amount: '750.00',
            categoryId: 'cat-1',
            month: 3,
            year: 2025,
            type: 'INCOME',
            userId: 'test-user-id',
          },
        ]);
      }),
    );

    renderWithAuthenticatedProviders(<BudgetsPage />);

    await waitFor(() => {
      expect(screen.getByText('$500.00')).toBeInTheDocument();
    });

    // Filter by 2025
    await selectOption(user, screen.getByTestId('year-filter'), '2025');

    // Only 2025 budget should be visible
    expect(screen.getByText('$750.00')).toBeInTheDocument();
    expect(screen.queryByText('$500.00')).not.toBeInTheDocument();
    expect(screen.queryByText('$3,000.00')).not.toBeInTheDocument();
  });

  it('has New Budget button that links to create page', async () => {
    renderWithAuthenticatedProviders(<BudgetsPage />);

    await waitFor(() => {
      expect(screen.getByText('$500.00')).toBeInTheDocument();
    });

    const newButton = screen.getByRole('link', { name: 'New Budget' });
    expect(newButton).toHaveAttribute('href', '/budgets/new');
  });

  it('has Edit buttons that link to edit pages', async () => {
    renderWithAuthenticatedProviders(<BudgetsPage />);

    await waitFor(() => {
      expect(screen.getByText('$500.00')).toBeInTheDocument();
    });

    const editButtons = screen.getAllByRole('link', { name: 'Edit' });
    expect(editButtons).toHaveLength(2);
    expect(editButtons[0]).toHaveAttribute('href', '/budgets/budget-1/edit');
    expect(editButtons[1]).toHaveAttribute('href', '/budgets/budget-2/edit');
  });

  it('opens delete confirmation dialog when Delete is clicked', async () => {
    const user = setupUser();
    renderWithAuthenticatedProviders(<BudgetsPage />);

    await waitFor(() => {
      expect(screen.getByText('$500.00')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByRole('button', { name: 'Delete' });
    await user.click(deleteButtons[0]);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Delete Budget')).toBeInTheDocument();
    expect(
      screen.getByText(/Are you sure you want to delete this budget/),
    ).toBeInTheDocument();
  });

  it('closes delete dialog when Cancel is clicked', async () => {
    const user = setupUser();
    renderWithAuthenticatedProviders(<BudgetsPage />);

    await waitFor(() => {
      expect(screen.getByText('$500.00')).toBeInTheDocument();
    });

    // Open dialog
    const deleteButtons = screen.getAllByRole('button', { name: 'Delete' });
    await user.click(deleteButtons[0]);

    expect(screen.getByRole('dialog')).toBeInTheDocument();

    // Click Cancel
    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('deletes budget when confirmed and removes from list', async () => {
    const user = setupUser();
    const { toast } = await import('sonner');
    renderWithAuthenticatedProviders(<BudgetsPage />);

    await waitFor(() => {
      expect(screen.getByText('$500.00')).toBeInTheDocument();
    });

    // Open dialog
    const deleteButtons = screen.getAllByRole('button', { name: 'Delete' });
    await user.click(deleteButtons[0]);

    // Confirm delete
    const dialogDeleteButton = screen.getByRole('button', { name: 'Delete' });
    await user.click(dialogDeleteButton);

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Budget deleted successfully');
    });

    // Budget should be removed from the list
    await waitFor(() => {
      expect(screen.queryByText('$500.00')).not.toBeInTheDocument();
    });
    expect(screen.getByText('$3,000.00')).toBeInTheDocument();
  });

  it('handles 401 error by logging out and redirecting', async () => {
    server.use(
      http.get(`${API_URL}/budgets`, () => {
        return HttpResponse.json(
          { message: 'Unauthorized', statusCode: 401 },
          { status: 401 },
        );
      }),
    );

    renderWithAuthenticatedProviders(<BudgetsPage />);

    await waitFor(() => {
      expect(mockRouterPush).toHaveBeenCalledWith('/login');
    });
  });

  it('shows error toast when API returns error', async () => {
    const { toast } = await import('sonner');
    server.use(
      http.get(`${API_URL}/budgets`, () => {
        return HttpResponse.json(
          { message: 'Server error', statusCode: 500 },
          { status: 500 },
        );
      }),
    );

    renderWithAuthenticatedProviders(<BudgetsPage />);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Server error');
    });
  });

  it('shows generic error toast on network failure', async () => {
    const { toast } = await import('sonner');
    server.use(
      http.get(`${API_URL}/budgets`, () => {
        return HttpResponse.error();
      }),
    );

    renderWithAuthenticatedProviders(<BudgetsPage />);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to load budgets');
    });
  });

  it('shows error toast when delete fails', async () => {
    const user = setupUser();
    const { toast } = await import('sonner');

    server.use(
      http.delete(`${API_URL}/budgets/:id`, () => {
        return HttpResponse.json(
          {
            message: 'Cannot delete budget',
            statusCode: 400,
          },
          { status: 400 },
        );
      }),
    );

    renderWithAuthenticatedProviders(<BudgetsPage />);

    await waitFor(() => {
      expect(screen.getByText('$500.00')).toBeInTheDocument();
    });

    // Open dialog and confirm delete
    const deleteButtons = screen.getAllByRole('button', { name: 'Delete' });
    await user.click(deleteButtons[0]);
    await user.click(screen.getByRole('button', { name: 'Delete' }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Cannot delete budget');
    });

    // Budget should still be in the list
    expect(screen.getByText('$500.00')).toBeInTheDocument();
  });

  it('combines multiple filters', async () => {
    const user = setupUser();

    // Add more budgets for better filter testing
    server.use(
      http.get(`${API_URL}/budgets`, () => {
        return HttpResponse.json([
          ...mockBudgets,
          {
            id: 'budget-3',
            amount: '1500.00',
            categoryId: 'cat-1',
            month: 4,
            year: 2026,
            type: 'INCOME',
            userId: 'test-user-id',
          },
          {
            id: 'budget-4',
            amount: '800.00',
            categoryId: 'cat-2',
            month: 4,
            year: 2026,
            type: 'EXPENSE',
            userId: 'test-user-id',
          },
        ]);
      }),
    );

    renderWithAuthenticatedProviders(<BudgetsPage />);

    await waitFor(() => {
      expect(screen.getByText('$500.00')).toBeInTheDocument();
    });

    // Filter by month 4 (April)
    await selectOption(user, screen.getByTestId('month-filter'), 'April');

    // Filter by INCOME type
    await selectOption(user, screen.getByTestId('type-filter'), 'Income');

    // Only April INCOME budget should be visible
    expect(screen.getByText('$1,500.00')).toBeInTheDocument();
    expect(screen.queryByText('$500.00')).not.toBeInTheDocument();
    expect(screen.queryByText('$3,000.00')).not.toBeInTheDocument();
    expect(screen.queryByText('$800.00')).not.toBeInTheDocument();
  });

  it('displays period as Month/Year format', async () => {
    renderWithAuthenticatedProviders(<BudgetsPage />);

    await waitFor(() => {
      expect(screen.getByText('$500.00')).toBeInTheDocument();
    });

    // Period should show month name and year
    const periodCells = screen.getAllByText('March 2026');
    expect(periodCells.length).toBeGreaterThan(0);
  });
});
