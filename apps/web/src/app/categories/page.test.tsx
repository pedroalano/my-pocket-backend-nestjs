import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/mocks/server';
import { mockCategories } from '@/test/mocks/handlers';
import {
  renderWithAuthenticatedProviders,
  setupUser,
  selectOption,
} from '@/test/test-utils';
import CategoriesPage from './page';

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

describe('CategoriesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set up authenticated state
  });

  it('renders loading skeleton initially', () => {
    renderWithAuthenticatedProviders(<CategoriesPage />);
    // The skeleton should be visible while loading
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('renders category list from API', async () => {
    renderWithAuthenticatedProviders(<CategoriesPage />);

    await waitFor(() => {
      expect(screen.getByText('Salary')).toBeInTheDocument();
    });

    expect(screen.getByText('Groceries')).toBeInTheDocument();
    expect(screen.getByText('Income')).toBeInTheDocument();
    expect(screen.getByText('Expense')).toBeInTheDocument();
  });

  it('shows empty state when no categories exist', async () => {
    server.use(
      http.get(`${API_URL}/categories`, () => {
        return HttpResponse.json([]);
      }),
    );

    renderWithAuthenticatedProviders(<CategoriesPage />);

    await waitFor(() => {
      expect(
        screen.getByText(
          'No categories yet. Create your first category to get started.',
        ),
      ).toBeInTheDocument();
    });
  });

  it('shows "no matches" message when search yields no results', async () => {
    const user = setupUser();
    renderWithAuthenticatedProviders(<CategoriesPage />);

    await waitFor(() => {
      expect(screen.getByText('Salary')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Search categories...');
    await user.type(searchInput, 'nonexistent');

    expect(
      screen.getByText('No categories match your search.'),
    ).toBeInTheDocument();
  });

  it('filters categories by search query', async () => {
    const user = setupUser();
    renderWithAuthenticatedProviders(<CategoriesPage />);

    await waitFor(() => {
      expect(screen.getByText('Salary')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Search categories...');
    await user.type(searchInput, 'sal');

    expect(screen.getByText('Salary')).toBeInTheDocument();
    expect(screen.queryByText('Groceries')).not.toBeInTheDocument();
  });

  it('filters categories by type with dropdown', async () => {
    const user = setupUser();
    renderWithAuthenticatedProviders(<CategoriesPage />);

    await waitFor(() => {
      expect(screen.getByText('Salary')).toBeInTheDocument();
    });

    // Use selectOption helper to properly handle Radix UI Select async behavior
    await selectOption(user, screen.getByRole('combobox'), 'Income');

    expect(screen.getByText('Salary')).toBeInTheDocument();
    expect(screen.queryByText('Groceries')).not.toBeInTheDocument();
  });

  it('filters to show only expense categories', async () => {
    const user = setupUser();
    renderWithAuthenticatedProviders(<CategoriesPage />);

    await waitFor(() => {
      expect(screen.getByText('Groceries')).toBeInTheDocument();
    });

    // Use selectOption helper to properly handle Radix UI Select async behavior
    await selectOption(user, screen.getByRole('combobox'), 'Expense');

    expect(screen.getByText('Groceries')).toBeInTheDocument();
    expect(screen.queryByText('Salary')).not.toBeInTheDocument();
  });

  it('has New Category button that links to create page', async () => {
    renderWithAuthenticatedProviders(<CategoriesPage />);

    await waitFor(() => {
      expect(screen.getByText('Salary')).toBeInTheDocument();
    });

    const newButton = screen.getByRole('link', { name: 'New Category' });
    expect(newButton).toHaveAttribute('href', '/categories/new');
  });

  it('has Edit buttons that link to edit pages', async () => {
    renderWithAuthenticatedProviders(<CategoriesPage />);

    await waitFor(() => {
      expect(screen.getByText('Salary')).toBeInTheDocument();
    });

    const editButtons = screen.getAllByRole('link', { name: 'Edit' });
    expect(editButtons).toHaveLength(2);
    expect(editButtons[0]).toHaveAttribute('href', '/categories/cat-1/edit');
    expect(editButtons[1]).toHaveAttribute('href', '/categories/cat-2/edit');
  });

  it('opens delete confirmation dialog when Delete is clicked', async () => {
    const user = setupUser();
    renderWithAuthenticatedProviders(<CategoriesPage />);

    await waitFor(() => {
      expect(screen.getByText('Salary')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByRole('button', { name: 'Delete' });
    await user.click(deleteButtons[0]);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Delete Category')).toBeInTheDocument();
    expect(
      screen.getByText(/Are you sure you want to delete "Salary"/),
    ).toBeInTheDocument();
  });

  it('closes delete dialog when Cancel is clicked', async () => {
    const user = setupUser();
    renderWithAuthenticatedProviders(<CategoriesPage />);

    await waitFor(() => {
      expect(screen.getByText('Salary')).toBeInTheDocument();
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

  it('deletes category when confirmed and removes from list', async () => {
    const user = setupUser();
    const { toast } = await import('sonner');
    renderWithAuthenticatedProviders(<CategoriesPage />);

    await waitFor(() => {
      expect(screen.getByText('Salary')).toBeInTheDocument();
    });

    // Open dialog
    const deleteButtons = screen.getAllByRole('button', { name: 'Delete' });
    await user.click(deleteButtons[0]);

    // Confirm delete
    const dialogDeleteButton = screen.getByRole('button', { name: 'Delete' });
    await user.click(dialogDeleteButton);

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        'Category deleted successfully',
      );
    });

    // Category should be removed from the list
    await waitFor(() => {
      expect(screen.queryByText('Salary')).not.toBeInTheDocument();
    });
    expect(screen.getByText('Groceries')).toBeInTheDocument();
  });

  it('handles 401 error by logging out and redirecting', async () => {
    server.use(
      http.get(`${API_URL}/categories`, () => {
        return HttpResponse.json(
          { message: 'Unauthorized', statusCode: 401 },
          { status: 401 },
        );
      }),
    );

    renderWithAuthenticatedProviders(<CategoriesPage />);

    await waitFor(() => {
      expect(mockRouterPush).toHaveBeenCalledWith('/login');
    });
  });

  it('shows error toast when API returns error', async () => {
    const { toast } = await import('sonner');
    server.use(
      http.get(`${API_URL}/categories`, () => {
        return HttpResponse.json(
          { message: 'Server error', statusCode: 500 },
          { status: 500 },
        );
      }),
    );

    renderWithAuthenticatedProviders(<CategoriesPage />);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Server error');
    });
  });

  it('shows generic error toast on network failure', async () => {
    const { toast } = await import('sonner');
    server.use(
      http.get(`${API_URL}/categories`, () => {
        return HttpResponse.error();
      }),
    );

    renderWithAuthenticatedProviders(<CategoriesPage />);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to load categories');
    });
  });

  it('shows error toast when delete fails', async () => {
    const user = setupUser();
    const { toast } = await import('sonner');

    server.use(
      http.delete(`${API_URL}/categories/:id`, () => {
        return HttpResponse.json(
          {
            message: 'Cannot delete category with transactions',
            statusCode: 400,
          },
          { status: 400 },
        );
      }),
    );

    renderWithAuthenticatedProviders(<CategoriesPage />);

    await waitFor(() => {
      expect(screen.getByText('Salary')).toBeInTheDocument();
    });

    // Open dialog and confirm delete
    const deleteButtons = screen.getAllByRole('button', { name: 'Delete' });
    await user.click(deleteButtons[0]);
    await user.click(screen.getByRole('button', { name: 'Delete' }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'Cannot delete category with transactions',
      );
    });

    // Category should still be in the list
    expect(screen.getByText('Salary')).toBeInTheDocument();
  });

  it('combines search and type filter', async () => {
    const user = setupUser();

    // Add more categories for better filter testing
    server.use(
      http.get(`${API_URL}/categories`, () => {
        return HttpResponse.json([
          ...mockCategories,
          {
            id: 'cat-3',
            name: 'Savings Interest',
            type: 'INCOME',
            createdAt: '2024-01-03T00:00:00.000Z',
            updatedAt: '2024-01-03T00:00:00.000Z',
          },
        ]);
      }),
    );

    renderWithAuthenticatedProviders(<CategoriesPage />);

    await waitFor(() => {
      expect(screen.getByText('Salary')).toBeInTheDocument();
    });

    // Search for 'sal'
    const searchInput = screen.getByPlaceholderText('Search categories...');
    await user.type(searchInput, 'sal');

    // Use selectOption helper to properly handle Radix UI Select async behavior
    await selectOption(user, screen.getByRole('combobox'), 'Income');

    // Only "Salary" should match (not Groceries - wrong type, not Savings Interest - doesn't match 'sal')
    expect(screen.getByText('Salary')).toBeInTheDocument();
    expect(screen.queryByText('Groceries')).not.toBeInTheDocument();
  });
});
