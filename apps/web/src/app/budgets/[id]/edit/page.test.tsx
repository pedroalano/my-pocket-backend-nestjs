import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/mocks/server';
import { mockBudgets } from '@/test/mocks/handlers';
import { renderWithAuthenticatedProviders } from '@/test/test-utils';
import EditBudgetPage from './page';

const API_URL = 'http://localhost:3001';

// Mock next/navigation
const mockRouterPush = vi.fn();
vi.mock('next/navigation', async () => ({
  useRouter: () => ({
    push: mockRouterPush,
    replace: vi.fn(),
    back: vi.fn(),
  }),
  useParams: () => ({
    id: 'budget-1',
  }),
}));

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('EditBudgetPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set up authenticated state
  });

  it('shows loading state initially', async () => {
    renderWithAuthenticatedProviders(<EditBudgetPage />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders Edit Budget page with form pre-filled', async () => {
    renderWithAuthenticatedProviders(<EditBudgetPage />);

    await waitFor(() => {
      expect(screen.getByText('Edit Budget')).toBeInTheDocument();
    });

    // Check form is pre-filled with budget data (from mock budget-1)
    const amountInput = screen.getByLabelText('Amount');
    expect(amountInput).toHaveValue(500);

    // Check submit button shows correct label
    expect(
      screen.getByRole('button', { name: 'Save Changes' }),
    ).toBeInTheDocument();
  });

  it('renders within AuthLayout', async () => {
    renderWithAuthenticatedProviders(<EditBudgetPage />);

    await waitFor(() => {
      expect(screen.getByText('Edit Budget')).toBeInTheDocument();
    });

    // Check that AuthLayout navigation is present
    expect(screen.getByRole('link', { name: 'My Pocket' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'User menu' })).toBeInTheDocument();
  });

  it('handles 404 error and redirects to budgets list', async () => {
    const { toast } = await import('sonner');

    server.use(
      http.get(`${API_URL}/budgets/:id`, () => {
        return HttpResponse.json(
          { message: 'Budget not found', statusCode: 404 },
          { status: 404 },
        );
      }),
    );

    renderWithAuthenticatedProviders(<EditBudgetPage />);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Budget not found');
    });

    expect(mockRouterPush).toHaveBeenCalledWith('/budgets');
  });

  it('handles 401 error and redirects to login', async () => {
    server.use(
      http.get(`${API_URL}/budgets/:id`, () => {
        return HttpResponse.json(
          { message: 'Unauthorized', statusCode: 401 },
          { status: 401 },
        );
      }),
    );

    renderWithAuthenticatedProviders(<EditBudgetPage />);

    await waitFor(() => {
      expect(mockRouterPush).toHaveBeenCalledWith('/login');
    });
  });

  it('handles generic API error', async () => {
    const { toast } = await import('sonner');

    server.use(
      http.get(`${API_URL}/budgets/:id`, () => {
        return HttpResponse.json(
          { message: 'Server error', statusCode: 500 },
          { status: 500 },
        );
      }),
    );

    renderWithAuthenticatedProviders(<EditBudgetPage />);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Server error');
    });
  });
});
