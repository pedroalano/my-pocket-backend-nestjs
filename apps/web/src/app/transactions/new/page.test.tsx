import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithAuthenticatedProviders } from '@/test/test-utils';
import NewTransactionPage from './page';

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

describe('NewTransactionPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set up authenticated state
  });

  it('renders Create Transaction page with form', async () => {
    renderWithAuthenticatedProviders(<NewTransactionPage />);

    await waitFor(() => {
      expect(screen.getByText('Create Transaction')).toBeInTheDocument();
    });

    // Check form fields are present
    expect(screen.getByLabelText('Amount')).toBeInTheDocument();
    expect(screen.getByLabelText('Date')).toBeInTheDocument();
    expect(screen.getByLabelText('Description (optional)')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create' })).toBeInTheDocument();
  });

  it('renders within AuthLayout', async () => {
    renderWithAuthenticatedProviders(<NewTransactionPage />);

    await waitFor(() => {
      expect(screen.getByText('Create Transaction')).toBeInTheDocument();
    });

    // Check that AuthLayout navigation is present
    expect(screen.getByRole('link', { name: 'My Pocket' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'User menu' })).toBeInTheDocument();
  });
});
