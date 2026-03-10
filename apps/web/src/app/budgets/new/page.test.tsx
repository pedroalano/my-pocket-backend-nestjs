import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithAuthenticatedProviders } from '@/test/test-utils';
import NewBudgetPage from './page';

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

describe('NewBudgetPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set up authenticated state
  });

  it('renders Create Budget page with form', async () => {
    renderWithAuthenticatedProviders(<NewBudgetPage />);

    await waitFor(() => {
      expect(screen.getByText('Create Budget')).toBeInTheDocument();
    });

    // Check form fields are present
    expect(screen.getByLabelText('Amount')).toBeInTheDocument();
    expect(screen.getByLabelText('Category')).toBeInTheDocument();
    expect(screen.getByLabelText('Month')).toBeInTheDocument();
    expect(screen.getByLabelText('Year')).toBeInTheDocument();
    expect(screen.getByLabelText('Type')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create' })).toBeInTheDocument();
  });

  it('renders within AuthLayout', async () => {
    renderWithAuthenticatedProviders(<NewBudgetPage />);

    await waitFor(() => {
      expect(screen.getByText('Create Budget')).toBeInTheDocument();
    });

    // Check that AuthLayout navigation is present
    expect(screen.getByRole('link', { name: 'My Pocket' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Logout' })).toBeInTheDocument();
  });
});
