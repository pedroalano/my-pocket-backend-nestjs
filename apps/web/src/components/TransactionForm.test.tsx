import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { renderWithProviders, setupUser } from '@/test/test-utils';
import { TransactionForm } from './TransactionForm';
import { ApiException } from '@/lib/api';

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

import { toast } from 'sonner';

const mockRouterPush = vi.fn();
vi.mock('next/navigation', async () => {
  return {
    useRouter: () => ({
      push: mockRouterPush,
      replace: vi.fn(),
      back: vi.fn(),
    }),
    useParams: () => ({}),
  };
});

// Mock categoriesApi - use inline data to avoid hoisting issues
vi.mock('@/lib/categories', () => ({
  categoriesApi: {
    getAll: vi.fn().mockResolvedValue([
      {
        id: 'cat-1',
        name: 'Salary',
        type: 'INCOME',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
      {
        id: 'cat-2',
        name: 'Groceries',
        type: 'EXPENSE',
        createdAt: '2024-01-02T00:00:00.000Z',
        updatedAt: '2024-01-02T00:00:00.000Z',
      },
    ]),
  },
}));

describe('TransactionForm', () => {
  const mockOnSubmit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockOnSubmit.mockResolvedValue({});
  });

  it('should render form with title and submit label', async () => {
    renderWithProviders(
      <TransactionForm
        title="Create Transaction"
        submitLabel="Create"
        onSubmit={mockOnSubmit}
      />,
    );

    expect(screen.getByText('Create Transaction')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });

  it('should render all form fields', async () => {
    renderWithProviders(
      <TransactionForm
        title="Create Transaction"
        submitLabel="Create"
        onSubmit={mockOnSubmit}
      />,
    );

    expect(screen.getByLabelText('Amount')).toBeInTheDocument();
    expect(screen.getByLabelText('Date')).toBeInTheDocument();
    expect(screen.getByLabelText('Description (optional)')).toBeInTheDocument();
  });

  it('should load categories in dropdown', async () => {
    const user = setupUser();

    renderWithProviders(
      <TransactionForm
        title="Create Transaction"
        submitLabel="Create"
        onSubmit={mockOnSubmit}
      />,
    );

    // Wait for categories to load
    await waitFor(() => {
      expect(
        screen.queryByText('Loading categories...'),
      ).not.toBeInTheDocument();
    });

    // Open category dropdown
    const categoryTrigger = screen.getByLabelText('Category');
    await user.click(categoryTrigger);

    await waitFor(() => {
      expect(screen.getAllByText('Salary').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Groceries').length).toBeGreaterThan(0);
    });
  });

  it('should render form with initial data', async () => {
    renderWithProviders(
      <TransactionForm
        title="Edit Transaction"
        submitLabel="Save"
        initialData={{
          amount: 150,
          categoryId: 'cat-2',
          date: '2026-03-05',
          description: 'Test description',
        }}
        onSubmit={mockOnSubmit}
      />,
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue('150')).toBeInTheDocument();
      expect(screen.getByDisplayValue('2026-03-05')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Test description')).toBeInTheDocument();
    });
  });

  it('should have required attribute on amount and date inputs', () => {
    renderWithProviders(
      <TransactionForm
        title="Create Transaction"
        submitLabel="Create"
        onSubmit={mockOnSubmit}
      />,
    );

    expect(screen.getByLabelText('Amount')).toHaveAttribute('required');
    expect(screen.getByLabelText('Date')).toHaveAttribute('required');
  });

  it('should show error toast when category is not selected', async () => {
    renderWithProviders(
      <TransactionForm
        title="Create Transaction"
        submitLabel="Create"
        initialData={{
          amount: 100,
          categoryId: '',
          date: '2026-03-05',
        }}
        onSubmit={mockOnSubmit}
      />,
    );

    fireEvent.submit(document.querySelector('form')!);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Category is required');
    });
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('should submit form with valid data from initialData', async () => {
    renderWithProviders(
      <TransactionForm
        title="Create Transaction"
        submitLabel="Create"
        initialData={{
          amount: 100,
          categoryId: 'cat-2',
          date: '2026-03-05',
          description: 'Test transaction',
        }}
        onSubmit={mockOnSubmit}
      />,
    );

    fireEvent.submit(document.querySelector('form')!);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        amount: 100,
        categoryId: 'cat-2',
        date: '2026-03-05T00:00:00.000Z',
        description: 'Test transaction',
      });
    });

    expect(toast.success).toHaveBeenCalledWith(
      'Transaction updated successfully',
    );
    expect(mockRouterPush).toHaveBeenCalledWith('/transactions');
  });

  it('should show success message for update', async () => {
    renderWithProviders(
      <TransactionForm
        title="Edit Transaction"
        submitLabel="Save"
        initialData={{
          amount: 100,
          categoryId: 'cat-2',
          date: '2026-03-05',
        }}
        onSubmit={mockOnSubmit}
      />,
    );

    fireEvent.submit(document.querySelector('form')!);

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        'Transaction updated successfully',
      );
    });
  });

  it('should handle API exception', async () => {
    mockOnSubmit.mockRejectedValue(
      new ApiException(400, 'Invalid transaction data'),
    );

    renderWithProviders(
      <TransactionForm
        title="Create Transaction"
        submitLabel="Create"
        initialData={{
          amount: 100,
          categoryId: 'cat-2',
          date: '2026-03-05',
        }}
        onSubmit={mockOnSubmit}
      />,
    );

    fireEvent.submit(document.querySelector('form')!);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Invalid transaction data');
    });
  });

  it('should handle generic error', async () => {
    mockOnSubmit.mockRejectedValue(new Error('Network error'));

    renderWithProviders(
      <TransactionForm
        title="Create Transaction"
        submitLabel="Create"
        initialData={{
          amount: 100,
          categoryId: 'cat-2',
          date: '2026-03-05',
        }}
        onSubmit={mockOnSubmit}
      />,
    );

    fireEvent.submit(document.querySelector('form')!);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('An unexpected error occurred');
    });
  });

  it('should disable inputs during loading', async () => {
    // Make the submit never resolve to keep loading state
    mockOnSubmit.mockImplementation(() => new Promise(() => {}));

    renderWithProviders(
      <TransactionForm
        title="Create Transaction"
        submitLabel="Create"
        initialData={{
          amount: 100,
          categoryId: 'cat-2',
          date: '2026-03-05',
        }}
        onSubmit={mockOnSubmit}
      />,
    );

    fireEvent.submit(document.querySelector('form')!);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Saving...' })).toBeDisabled();
    });

    expect(screen.getByLabelText('Amount')).toBeDisabled();
    expect(screen.getByLabelText('Date')).toBeDisabled();
    expect(screen.getByLabelText('Description (optional)')).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
  });

  it('should navigate to transactions on cancel', async () => {
    const user = setupUser();

    renderWithProviders(
      <TransactionForm
        title="Create Transaction"
        submitLabel="Create"
        onSubmit={mockOnSubmit}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(mockRouterPush).toHaveBeenCalledWith('/transactions');
  });

  it('should validate amount is positive', async () => {
    renderWithProviders(
      <TransactionForm
        title="Create Transaction"
        submitLabel="Create"
        initialData={{
          amount: -100,
          categoryId: 'cat-2',
          date: '2026-03-05',
        }}
        onSubmit={mockOnSubmit}
      />,
    );

    fireEvent.submit(document.querySelector('form')!);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Amount must be greater than 0');
    });
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('should submit without description', async () => {
    renderWithProviders(
      <TransactionForm
        title="Create Transaction"
        submitLabel="Create"
        initialData={{
          amount: 100,
          categoryId: 'cat-1',
          date: '2026-03-05',
        }}
        onSubmit={mockOnSubmit}
      />,
    );

    fireEvent.submit(document.querySelector('form')!);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        amount: 100,
        categoryId: 'cat-1',
        date: '2026-03-05T00:00:00.000Z',
        description: undefined,
      });
    });
  });
});
