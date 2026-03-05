import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/mocks/server';
import { mockToken } from '@/test/mocks/handlers';
import { renderWithProviders } from '@/test/test-utils';
import EditTransactionPage from './page';

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
    id: 'transaction-1',
  }),
}));

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('EditTransactionPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set up authenticated state
    vi.mocked(localStorage.getItem).mockReturnValue(mockToken);
  });

  it('shows loading state initially', async () => {
    renderWithProviders(<EditTransactionPage />);

    expect(screen.getByText('Loading transaction...')).toBeInTheDocument();
  });

  it('renders Edit Transaction page with form pre-filled', async () => {
    renderWithProviders(<EditTransactionPage />);

    await waitFor(() => {
      expect(screen.getByText('Edit Transaction')).toBeInTheDocument();
    });

    // Check form is pre-filled with transaction data (from mock transaction-1)
    const amountInput = screen.getByLabelText('Amount');
    expect(amountInput).toHaveValue(150);

    // Check submit button shows correct label
    expect(
      screen.getByRole('button', { name: 'Save Changes' }),
    ).toBeInTheDocument();
  });

  it('renders within AuthLayout', async () => {
    renderWithProviders(<EditTransactionPage />);

    await waitFor(() => {
      expect(screen.getByText('Edit Transaction')).toBeInTheDocument();
    });

    // Check that AuthLayout navigation is present
    expect(screen.getByRole('link', { name: 'My Pocket' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Logout' })).toBeInTheDocument();
  });

  it('handles 404 error and redirects to transactions list', async () => {
    const { toast } = await import('sonner');

    server.use(
      http.get(`${API_URL}/transactions/:id`, () => {
        return HttpResponse.json(
          { message: 'Transaction not found', statusCode: 404 },
          { status: 404 },
        );
      }),
    );

    renderWithProviders(<EditTransactionPage />);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Transaction not found');
    });

    expect(mockRouterPush).toHaveBeenCalledWith('/transactions');
  });

  it('handles 401 error and redirects to login', async () => {
    server.use(
      http.get(`${API_URL}/transactions/:id`, () => {
        return HttpResponse.json(
          { message: 'Unauthorized', statusCode: 401 },
          { status: 401 },
        );
      }),
    );

    renderWithProviders(<EditTransactionPage />);

    await waitFor(() => {
      expect(mockRouterPush).toHaveBeenCalledWith('/login');
    });
  });

  it('handles generic API error', async () => {
    const { toast } = await import('sonner');

    server.use(
      http.get(`${API_URL}/transactions/:id`, () => {
        return HttpResponse.json(
          { message: 'Server error', statusCode: 500 },
          { status: 500 },
        );
      }),
    );

    renderWithProviders(<EditTransactionPage />);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Server error');
    });
  });
});
