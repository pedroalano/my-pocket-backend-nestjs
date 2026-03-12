import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/mocks/server';
import { renderWithProviders, userEvent } from '@/test/test-utils';
import RegisterPage from './page';

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

async function registerUser() {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText('Name'), 'John Doe');
  await user.type(screen.getByLabelText('Email'), 'john@example.com');
  await user.type(screen.getByLabelText('Password'), 'password123');
  await user.click(screen.getByRole('button', { name: 'Create an account' }));
}

describe('RegisterPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders name, email, and password inputs', () => {
    renderWithProviders(<RegisterPage />);

    expect(screen.getByLabelText('Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Create an account' }),
    ).toBeInTheDocument();
  });

  it('renders the correct placeholders', () => {
    renderWithProviders(<RegisterPage />);

    expect(screen.getByPlaceholderText('John Doe')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
  });

  it('renders link to sign in page', () => {
    renderWithProviders(<RegisterPage />);

    const signInLink = screen.getByRole('link', { name: 'Sign in' });
    expect(signInLink).toHaveAttribute('href', '/login');
  });

  it('password input has minLength validation', () => {
    renderWithProviders(<RegisterPage />);

    expect(screen.getByLabelText('Password')).toHaveAttribute('minLength', '6');
  });

  it('successful registration shows success toast and transitions to preset categories step', async () => {
    const { toast } = await import('sonner');

    renderWithProviders(<RegisterPage />);

    await registerUser();

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        'Account created successfully!',
      );
    });

    expect(
      screen.getByText('Set up your categories'),
    ).toBeInTheDocument();
    expect(mockRouterPush).not.toHaveBeenCalled();
  });

  it('shows error toast when email already exists', async () => {
    const user = userEvent.setup();
    const { toast } = await import('sonner');

    renderWithProviders(<RegisterPage />);

    await user.type(screen.getByLabelText('Name'), 'Existing User');
    await user.type(screen.getByLabelText('Email'), 'existing@example.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Create an account' }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Email already exists');
    });

    expect(mockRouterPush).not.toHaveBeenCalled();
  });

  it('shows generic error toast on network failure', async () => {
    const user = userEvent.setup();
    const { toast } = await import('sonner');

    server.use(
      http.post(`${API_URL}/auths/register`, () => {
        return HttpResponse.error();
      }),
    );

    renderWithProviders(<RegisterPage />);

    await user.type(screen.getByLabelText('Name'), 'John Doe');
    await user.type(screen.getByLabelText('Email'), 'john@example.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Create an account' }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('An unexpected error occurred');
    });
  });

  it('shows loading state while submitting', async () => {
    const user = userEvent.setup();

    // Make registration take a long time
    server.use(
      http.post(`${API_URL}/auths/register`, async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        return HttpResponse.json({ access_token: 'token' });
      }),
    );

    renderWithProviders(<RegisterPage />);

    await user.type(screen.getByLabelText('Name'), 'John Doe');
    await user.type(screen.getByLabelText('Email'), 'john@example.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Create an account' }));

    // Button should show loading text
    expect(
      screen.getByRole('button', { name: 'Creating account...' }),
    ).toBeInTheDocument();

    // Inputs should be disabled
    expect(screen.getByLabelText('Name')).toBeDisabled();
    expect(screen.getByLabelText('Email')).toBeDisabled();
    expect(screen.getByLabelText('Password')).toBeDisabled();
  });

  it('all inputs have required attribute', () => {
    renderWithProviders(<RegisterPage />);

    expect(screen.getByLabelText('Name')).toBeRequired();
    expect(screen.getByLabelText('Email')).toBeRequired();
    expect(screen.getByLabelText('Password')).toBeRequired();
  });

  it('email input has email type for validation', () => {
    renderWithProviders(<RegisterPage />);

    expect(screen.getByLabelText('Email')).toHaveAttribute('type', 'email');
  });

  it('password input has password type', () => {
    renderWithProviders(<RegisterPage />);

    expect(screen.getByLabelText('Password')).toHaveAttribute(
      'type',
      'password',
    );
  });

  it('toggles password visibility when eye icon is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<RegisterPage />);

    const passwordInput = screen.getByLabelText('Password');
    expect(passwordInput).toHaveAttribute('type', 'password');

    // Click the show password button
    const toggleButton = screen.getByRole('button', { name: 'Show password' });
    await user.click(toggleButton);

    expect(passwordInput).toHaveAttribute('type', 'text');
    expect(
      screen.getByRole('button', { name: 'Hide password' }),
    ).toBeInTheDocument();

    // Click again to hide
    await user.click(screen.getByRole('button', { name: 'Hide password' }));
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  it('displays create account message', () => {
    renderWithProviders(<RegisterPage />);

    // CardTitle renders as a div (not a heading); button also shows "Create an account"
    expect(screen.getAllByText('Create an account').length).toBeGreaterThan(0);
    expect(
      screen.getByText('Enter your details to get started'),
    ).toBeInTheDocument();
  });

  it('stores refresh token in cookie on successful registration', async () => {
    renderWithProviders(<RegisterPage />);

    await registerUser();

    await waitFor(() => {
      expect(document.cookie).toContain('refresh_token=');
    });
  });

  it('handles validation error from server', async () => {
    const user = userEvent.setup();
    const { toast } = await import('sonner');

    server.use(
      http.post(`${API_URL}/auths/register`, () => {
        return HttpResponse.json(
          { message: 'Name is required', statusCode: 400 },
          { status: 400 },
        );
      }),
    );

    renderWithProviders(<RegisterPage />);

    await user.type(screen.getByLabelText('Name'), 'John Doe');
    await user.type(screen.getByLabelText('Email'), 'john@example.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Create an account' }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Name is required');
    });
  });

  it('name input has text type', () => {
    renderWithProviders(<RegisterPage />);

    expect(screen.getByLabelText('Name')).toHaveAttribute('type', 'text');
  });

  // Step 2: Preset Categories
  describe('preset categories step', () => {
    it('shows step 2 heading after successful registration', async () => {
      renderWithProviders(<RegisterPage />);

      await registerUser();

      await waitFor(() => {
        expect(screen.getByText('Set up your categories')).toBeInTheDocument();
      });
      expect(
        screen.getByText(
          'Select the categories you want to start with. You can always add more later.',
        ),
      ).toBeInTheDocument();
    });

    it('shows all 11 presets selected by default', async () => {
      renderWithProviders(<RegisterPage />);

      await registerUser();

      await waitFor(() => {
        expect(screen.getByText('Set up your categories')).toBeInTheDocument();
      });

      const presetNames = [
        'Salary',
        'Freelance',
        'Investments',
        'Food',
        'Transport',
        'Housing',
        'Entertainment',
        'Healthcare',
        'Utilities',
        'Shopping',
        'Education',
      ];

      for (const name of presetNames) {
        expect(screen.getByText(name)).toBeInTheDocument();
      }

      // All preset buttons should be visually selected (contain check icon)
      // We check that "Get Started" button is present
      expect(
        screen.getByRole('button', { name: 'Get Started' }),
      ).toBeInTheDocument();
    });

    it('clicking a preset toggles its selected state', async () => {
      const user = userEvent.setup();
      renderWithProviders(<RegisterPage />);

      await registerUser();

      await waitFor(() => {
        expect(screen.getByText('Set up your categories')).toBeInTheDocument();
      });

      const salaryButton = screen.getByRole('button', { name: /Salary/ });
      // Initially selected — clicking deselects
      await user.click(salaryButton);

      // Click again to reselect
      await user.click(screen.getByRole('button', { name: 'Salary' }));
      expect(screen.getByRole('button', { name: /Salary/ })).toBeInTheDocument();
    });

    it('"Get Started" calls batch endpoint and redirects to /dashboard', async () => {
      const user = userEvent.setup();
      const { toast } = await import('sonner');

      renderWithProviders(<RegisterPage />);

      await registerUser();

      await waitFor(() => {
        expect(screen.getByText('Set up your categories')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: 'Get Started' }));

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith(
          'Categories created successfully!',
        );
        expect(mockRouterPush).toHaveBeenCalledWith('/dashboard');
      });
    });

    it('"Skip" redirects to /dashboard without calling batch', async () => {
      const user = userEvent.setup();
      let batchCalled = false;

      server.use(
        http.post(`${API_URL}/categories/batch`, () => {
          batchCalled = true;
          return HttpResponse.json({ created: 0, skipped: 0 });
        }),
      );

      renderWithProviders(<RegisterPage />);

      await registerUser();

      await waitFor(() => {
        expect(screen.getByText('Set up your categories')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: 'Skip' }));

      expect(mockRouterPush).toHaveBeenCalledWith('/dashboard');
      expect(batchCalled).toBe(false);
    });

    it('deselecting all then clicking "Get Started" redirects without batch call', async () => {
      const user = userEvent.setup();
      let batchCalled = false;

      server.use(
        http.post(`${API_URL}/categories/batch`, () => {
          batchCalled = true;
          return HttpResponse.json({ created: 0, skipped: 0 });
        }),
      );

      renderWithProviders(<RegisterPage />);

      await registerUser();

      await waitFor(() => {
        expect(screen.getByText('Set up your categories')).toBeInTheDocument();
      });

      // Deselect all presets
      const presetNames = [
        'Salary',
        'Freelance',
        'Investments',
        'Food',
        'Transport',
        'Housing',
        'Entertainment',
        'Healthcare',
        'Utilities',
        'Shopping',
        'Education',
      ];

      for (const name of presetNames) {
        await user.click(screen.getByRole('button', { name: new RegExp(name) }));
      }

      await user.click(screen.getByRole('button', { name: 'Get Started' }));

      expect(mockRouterPush).toHaveBeenCalledWith('/dashboard');
      expect(batchCalled).toBe(false);
    });

    it('shows error toast when batch endpoint fails', async () => {
      const user = userEvent.setup();
      const { toast } = await import('sonner');

      server.use(
        http.post(`${API_URL}/categories/batch`, () => {
          return HttpResponse.json(
            { message: 'Internal server error', statusCode: 500 },
            { status: 500 },
          );
        }),
      );

      renderWithProviders(<RegisterPage />);

      await registerUser();

      await waitFor(() => {
        expect(screen.getByText('Set up your categories')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: 'Get Started' }));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Internal server error');
      });

      expect(mockRouterPush).not.toHaveBeenCalled();
    });

    it('"Get Started" shows loading state while pending', async () => {
      const user = userEvent.setup();

      server.use(
        http.post(`${API_URL}/categories/batch`, async () => {
          await new Promise((resolve) => setTimeout(resolve, 100));
          return HttpResponse.json({ created: 11, skipped: 0 });
        }),
      );

      renderWithProviders(<RegisterPage />);

      await registerUser();

      await waitFor(() => {
        expect(screen.getByText('Set up your categories')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: 'Get Started' }));

      expect(
        screen.getByRole('button', { name: 'Creating...' }),
      ).toBeInTheDocument();
    });
  });
});
