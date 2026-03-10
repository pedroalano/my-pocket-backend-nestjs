import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/mocks/server';
import { mockTransactions } from '@/test/mocks/handlers';
import {
  renderWithAuthenticatedProviders,
  setupUser,
  selectOption,
} from '@/test/test-utils';
import TransactionsPage from './page';

const API_URL = 'http://localhost:3001';

// Mock next/navigation
const mockRouterPush = vi.fn();
vi.mock('next/navigation', async () => ({
  useRouter: () => ({
    push: mockRouterPush,
    replace: vi.fn(),
    back: vi.fn(),
  }),
}));

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('TransactionsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set up authenticated state
  });

  it('renders loading skeleton initially', () => {
    renderWithAuthenticatedProviders(<TransactionsPage />);
    // The skeleton should be visible while loading
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('renders transaction list from API', async () => {
    renderWithAuthenticatedProviders(<TransactionsPage />);

    await waitFor(() => {
      // Transaction amounts should be displayed
      expect(screen.getByText('$150.00')).toBeInTheDocument();
    });

    expect(screen.getByText('$3,000.00')).toBeInTheDocument();
    expect(screen.getByText('Income')).toBeInTheDocument();
    expect(screen.getByText('Expense')).toBeInTheDocument();
  });

  it('displays category names for transactions', async () => {
    renderWithAuthenticatedProviders(<TransactionsPage />);

    await waitFor(() => {
      // Category names should be resolved from categoryId
      expect(screen.getByText('Groceries')).toBeInTheDocument();
    });

    expect(screen.getByText('Salary')).toBeInTheDocument();
  });

  it('displays transaction descriptions', async () => {
    renderWithAuthenticatedProviders(<TransactionsPage />);

    await waitFor(() => {
      expect(screen.getByText('Grocery shopping')).toBeInTheDocument();
    });

    expect(screen.getByText('Monthly salary')).toBeInTheDocument();
  });

  it('shows empty state when no transactions exist', async () => {
    server.use(
      http.get(`${API_URL}/transactions`, () => {
        return HttpResponse.json([]);
      }),
    );

    renderWithAuthenticatedProviders(<TransactionsPage />);

    await waitFor(() => {
      expect(
        screen.getByText(
          'No transactions yet. Create your first transaction to get started.',
        ),
      ).toBeInTheDocument();
    });
  });

  it('shows "no matches" message when filters yield no results', async () => {
    const user = setupUser();
    renderWithAuthenticatedProviders(<TransactionsPage />);

    await waitFor(() => {
      expect(screen.getByText('$150.00')).toBeInTheDocument();
    });

    // Filter by date range that has no transactions
    const startDateInput = screen.getByLabelText('Start Date');
    await user.clear(startDateInput);
    await user.type(startDateInput, '2025-01-01');

    const endDateInput = screen.getByLabelText('End Date');
    await user.clear(endDateInput);
    await user.type(endDateInput, '2025-01-31');

    expect(
      screen.getByText('No transactions match your filters.'),
    ).toBeInTheDocument();
  });

  it('filters transactions by type', async () => {
    const user = setupUser();
    renderWithAuthenticatedProviders(<TransactionsPage />);

    await waitFor(() => {
      expect(screen.getByText('$150.00')).toBeInTheDocument();
    });

    // Filter by INCOME
    await selectOption(user, screen.getByTestId('type-filter'), 'Income');

    // Only INCOME transaction should be visible
    expect(screen.getByText('$3,000.00')).toBeInTheDocument();
    expect(screen.queryByText('$150.00')).not.toBeInTheDocument();
  });

  it('filters transactions by category', async () => {
    const user = setupUser();
    renderWithAuthenticatedProviders(<TransactionsPage />);

    await waitFor(() => {
      expect(screen.getByText('$150.00')).toBeInTheDocument();
    });

    // Filter by Salary category
    await selectOption(user, screen.getByTestId('category-filter'), 'Salary');

    // Only transaction with Salary category should be visible
    expect(screen.getByText('$3,000.00')).toBeInTheDocument();
    expect(screen.queryByText('$150.00')).not.toBeInTheDocument();
  });

  it('filters transactions by date range', async () => {
    const user = setupUser();

    // Add transactions with different dates
    server.use(
      http.get(`${API_URL}/transactions`, () => {
        return HttpResponse.json([
          ...mockTransactions,
          {
            id: 'transaction-3',
            amount: '200.00',
            type: 'EXPENSE',
            categoryId: 'cat-2',
            date: '2026-02-15T10:00:00.000Z',
            description: 'February expense',
            userId: 'test-user-id',
            createdAt: '2026-02-15T10:00:00.000Z',
            updatedAt: '2026-02-15T10:00:00.000Z',
          },
        ]);
      }),
    );

    renderWithAuthenticatedProviders(<TransactionsPage />);

    await waitFor(() => {
      expect(screen.getByText('$150.00')).toBeInTheDocument();
    });

    // Filter by date range for March only
    const startDateInput = screen.getByLabelText('Start Date');
    await user.clear(startDateInput);
    await user.type(startDateInput, '2026-03-01');

    const endDateInput = screen.getByLabelText('End Date');
    await user.clear(endDateInput);
    await user.type(endDateInput, '2026-03-31');

    // Only March transactions should be visible
    expect(screen.getByText('$150.00')).toBeInTheDocument();
    expect(screen.getByText('$3,000.00')).toBeInTheDocument();
    expect(screen.queryByText('$200.00')).not.toBeInTheDocument();
  });

  it('has New Transaction button that links to create page', async () => {
    renderWithAuthenticatedProviders(<TransactionsPage />);

    await waitFor(() => {
      expect(screen.getByText('$150.00')).toBeInTheDocument();
    });

    const newButton = screen.getByRole('link', { name: 'New Transaction' });
    expect(newButton).toHaveAttribute('href', '/transactions/new');
  });

  it('has Edit buttons that link to edit pages', async () => {
    renderWithAuthenticatedProviders(<TransactionsPage />);

    await waitFor(() => {
      expect(screen.getByText('$150.00')).toBeInTheDocument();
    });

    const editButtons = screen.getAllByRole('link', { name: 'Edit' });
    expect(editButtons).toHaveLength(2);
    expect(editButtons[0]).toHaveAttribute(
      'href',
      '/transactions/transaction-1/edit',
    );
    expect(editButtons[1]).toHaveAttribute(
      'href',
      '/transactions/transaction-2/edit',
    );
  });

  it('opens delete confirmation dialog when Delete is clicked', async () => {
    const user = setupUser();
    renderWithAuthenticatedProviders(<TransactionsPage />);

    await waitFor(() => {
      expect(screen.getByText('$150.00')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByRole('button', { name: 'Delete' });
    await user.click(deleteButtons[0]);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Delete Transaction')).toBeInTheDocument();
    expect(
      screen.getByText(/Are you sure you want to delete this transaction/),
    ).toBeInTheDocument();
  });

  it('closes delete dialog when Cancel is clicked', async () => {
    const user = setupUser();
    renderWithAuthenticatedProviders(<TransactionsPage />);

    await waitFor(() => {
      expect(screen.getByText('$150.00')).toBeInTheDocument();
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

  it('deletes transaction when confirmed and removes from list', async () => {
    const user = setupUser();
    const { toast } = await import('sonner');
    renderWithAuthenticatedProviders(<TransactionsPage />);

    await waitFor(() => {
      expect(screen.getByText('$150.00')).toBeInTheDocument();
    });

    // Open dialog
    const deleteButtons = screen.getAllByRole('button', { name: 'Delete' });
    await user.click(deleteButtons[0]);

    // Confirm delete
    const dialogDeleteButton = screen.getByRole('button', { name: 'Delete' });
    await user.click(dialogDeleteButton);

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        'Transaction deleted successfully',
      );
    });

    // Transaction should be removed from the list
    await waitFor(() => {
      expect(screen.queryByText('$150.00')).not.toBeInTheDocument();
    });
    expect(screen.getByText('$3,000.00')).toBeInTheDocument();
  });

  it('handles 401 error by logging out and redirecting', async () => {
    server.use(
      http.get(`${API_URL}/transactions`, () => {
        return HttpResponse.json(
          { message: 'Unauthorized', statusCode: 401 },
          { status: 401 },
        );
      }),
    );

    renderWithAuthenticatedProviders(<TransactionsPage />);

    await waitFor(() => {
      expect(mockRouterPush).toHaveBeenCalledWith('/login');
    });
  });

  it('shows error toast when API returns error', async () => {
    const { toast } = await import('sonner');
    server.use(
      http.get(`${API_URL}/transactions`, () => {
        return HttpResponse.json(
          { message: 'Server error', statusCode: 500 },
          { status: 500 },
        );
      }),
    );

    renderWithAuthenticatedProviders(<TransactionsPage />);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Server error');
    });
  });

  it('shows generic error toast on network failure', async () => {
    const { toast } = await import('sonner');
    server.use(
      http.get(`${API_URL}/transactions`, () => {
        return HttpResponse.error();
      }),
    );

    renderWithAuthenticatedProviders(<TransactionsPage />);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to load transactions');
    });
  });

  it('shows error toast when delete fails', async () => {
    const user = setupUser();
    const { toast } = await import('sonner');

    server.use(
      http.delete(`${API_URL}/transactions/:id`, () => {
        return HttpResponse.json(
          {
            message: 'Cannot delete transaction',
            statusCode: 400,
          },
          { status: 400 },
        );
      }),
    );

    renderWithAuthenticatedProviders(<TransactionsPage />);

    await waitFor(() => {
      expect(screen.getByText('$150.00')).toBeInTheDocument();
    });

    // Open dialog and confirm delete
    const deleteButtons = screen.getAllByRole('button', { name: 'Delete' });
    await user.click(deleteButtons[0]);
    await user.click(screen.getByRole('button', { name: 'Delete' }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Cannot delete transaction');
    });

    // Transaction should still be in the list
    expect(screen.getByText('$150.00')).toBeInTheDocument();
  });

  it('combines multiple filters', async () => {
    const user = setupUser();

    // Add more transactions for better filter testing
    server.use(
      http.get(`${API_URL}/transactions`, () => {
        return HttpResponse.json([
          ...mockTransactions,
          {
            id: 'transaction-3',
            amount: '1500.00',
            type: 'INCOME',
            categoryId: 'cat-1',
            date: '2026-04-15T10:00:00.000Z',
            description: 'April income',
            userId: 'test-user-id',
            createdAt: '2026-04-15T10:00:00.000Z',
            updatedAt: '2026-04-15T10:00:00.000Z',
          },
          {
            id: 'transaction-4',
            amount: '800.00',
            type: 'EXPENSE',
            categoryId: 'cat-2',
            date: '2026-04-20T10:00:00.000Z',
            description: 'April expense',
            userId: 'test-user-id',
            createdAt: '2026-04-20T10:00:00.000Z',
            updatedAt: '2026-04-20T10:00:00.000Z',
          },
        ]);
      }),
    );

    renderWithAuthenticatedProviders(<TransactionsPage />);

    await waitFor(() => {
      expect(screen.getByText('$150.00')).toBeInTheDocument();
    });

    // Filter by date range (April)
    const startDateInput = screen.getByLabelText('Start Date');
    await user.clear(startDateInput);
    await user.type(startDateInput, '2026-04-01');

    const endDateInput = screen.getByLabelText('End Date');
    await user.clear(endDateInput);
    await user.type(endDateInput, '2026-04-30');

    // Filter by INCOME type
    await selectOption(user, screen.getByTestId('type-filter'), 'Income');

    // Only April INCOME transaction should be visible
    expect(screen.getByText('$1,500.00')).toBeInTheDocument();
    expect(screen.queryByText('$150.00')).not.toBeInTheDocument();
    expect(screen.queryByText('$3,000.00')).not.toBeInTheDocument();
    expect(screen.queryByText('$800.00')).not.toBeInTheDocument();
  });

  it('displays date in formatted format', async () => {
    renderWithAuthenticatedProviders(<TransactionsPage />);

    await waitFor(() => {
      expect(screen.getByText('$150.00')).toBeInTheDocument();
    });

    // Date should be formatted (e.g., Mar 1, 2026)
    expect(screen.getByText('Mar 1, 2026')).toBeInTheDocument();
    expect(screen.getByText('Mar 5, 2026')).toBeInTheDocument();
  });

  it('clears filters when clear button is clicked', async () => {
    const user = setupUser();
    renderWithAuthenticatedProviders(<TransactionsPage />);

    await waitFor(() => {
      expect(screen.getByText('$150.00')).toBeInTheDocument();
    });

    // Apply filter
    await selectOption(user, screen.getByTestId('type-filter'), 'Income');

    // Only INCOME visible
    expect(screen.queryByText('$150.00')).not.toBeInTheDocument();
    expect(screen.getByText('$3,000.00')).toBeInTheDocument();

    // Click clear filters
    await user.click(screen.getByRole('button', { name: 'Clear Filters' }));

    // All transactions should be visible again
    await waitFor(() => {
      expect(screen.getByText('$150.00')).toBeInTheDocument();
    });
    expect(screen.getByText('$3,000.00')).toBeInTheDocument();
  });
});
