import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { setupUser, selectOption } from '@/test/test-utils';
import { CategoryForm } from './CategoryForm';
import { CategoryType } from '@/types';
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

describe('CategoryForm', () => {
  const mockOnSubmit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockOnSubmit.mockResolvedValue({});
  });

  it('should render form with title and submit label', () => {
    render(
      <CategoryForm
        title="Create Category"
        submitLabel="Create"
        onSubmit={mockOnSubmit}
      />,
    );

    expect(screen.getByText('Create Category')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });

  it('should render form with initial data', () => {
    render(
      <CategoryForm
        title="Edit Category"
        submitLabel="Save"
        initialData={{ name: 'Test Category', type: CategoryType.INCOME }}
        onSubmit={mockOnSubmit}
      />,
    );

    expect(screen.getByDisplayValue('Test Category')).toBeInTheDocument();
  });

  it('should have required attribute on name input', () => {
    render(
      <CategoryForm
        title="Create Category"
        submitLabel="Create"
        onSubmit={mockOnSubmit}
      />,
    );

    // Verify the name input has the required attribute for HTML5 validation
    expect(screen.getByLabelText('Name')).toHaveAttribute('required');
  });

  it('should show error toast when type is not selected', async () => {
    const user = setupUser();

    render(
      <CategoryForm
        title="Create Category"
        submitLabel="Create"
        onSubmit={mockOnSubmit}
      />,
    );

    // Fill name but not type
    await user.type(screen.getByLabelText('Name'), 'Test Category');
    await user.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Type is required');
    });
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('should submit form with valid data', async () => {
    const user = setupUser();

    render(
      <CategoryForm
        title="Create Category"
        submitLabel="Create"
        onSubmit={mockOnSubmit}
      />,
    );

    await user.type(screen.getByLabelText('Name'), 'Groceries');

    // Use selectOption helper to properly handle Radix UI Select async behavior
    await selectOption(user, screen.getByRole('combobox'), 'Expense');

    await user.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        name: 'Groceries',
        type: CategoryType.EXPENSE,
      });
    });

    expect(toast.success).toHaveBeenCalledWith('Category created successfully');
    expect(mockRouterPush).toHaveBeenCalledWith('/categories');
  });

  it('should show success message for update', async () => {
    const user = setupUser();

    render(
      <CategoryForm
        title="Edit Category"
        submitLabel="Save"
        initialData={{ name: 'Salary', type: CategoryType.INCOME }}
        onSubmit={mockOnSubmit}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        'Category updated successfully',
      );
    });
  });

  it('should handle API exception', async () => {
    const user = setupUser();
    mockOnSubmit.mockRejectedValue(
      new ApiException(409, 'Category already exists'),
    );

    render(
      <CategoryForm
        title="Create Category"
        submitLabel="Create"
        initialData={{ name: 'Test', type: CategoryType.INCOME }}
        onSubmit={mockOnSubmit}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Category already exists');
    });
  });

  it('should handle generic error', async () => {
    const user = setupUser();
    mockOnSubmit.mockRejectedValue(new Error('Network error'));

    render(
      <CategoryForm
        title="Create Category"
        submitLabel="Create"
        initialData={{ name: 'Test', type: CategoryType.INCOME }}
        onSubmit={mockOnSubmit}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('An unexpected error occurred');
    });
  });

  it('should disable inputs during loading', async () => {
    const user = setupUser();
    // Make the submit never resolve to keep loading state
    mockOnSubmit.mockImplementation(() => new Promise(() => {}));

    render(
      <CategoryForm
        title="Create Category"
        submitLabel="Create"
        initialData={{ name: 'Test', type: CategoryType.INCOME }}
        onSubmit={mockOnSubmit}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Saving...' })).toBeDisabled();
    });

    expect(screen.getByLabelText('Name')).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
  });

  it('should navigate to categories on cancel', async () => {
    const user = setupUser();

    render(
      <CategoryForm
        title="Create Category"
        submitLabel="Create"
        onSubmit={mockOnSubmit}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(mockRouterPush).toHaveBeenCalledWith('/categories');
  });

  it('should trim whitespace from name', async () => {
    const user = setupUser();

    render(
      <CategoryForm
        title="Create Category"
        submitLabel="Create"
        initialData={{ name: '  Test  ', type: CategoryType.INCOME }}
        onSubmit={mockOnSubmit}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        name: 'Test',
        type: CategoryType.INCOME,
      });
    });
  });
});
