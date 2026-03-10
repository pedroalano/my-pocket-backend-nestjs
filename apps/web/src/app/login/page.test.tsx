import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/mocks/server';
import { renderWithProviders, userEvent } from '@/test/test-utils';
import LoginPage from './page';

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

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders email and password inputs', () => {
    renderWithProviders(<LoginPage />);

    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument();
  });

  it('renders the correct placeholders', () => {
    renderWithProviders(<LoginPage />);

    expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
  });

  it('renders link to sign up page', () => {
    renderWithProviders(<LoginPage />);

    const signUpLink = screen.getByRole('link', { name: 'Sign up' });
    expect(signUpLink).toHaveAttribute('href', '/register');
  });

  it('successful login shows success toast and redirects to dashboard', async () => {
    const user = userEvent.setup();
    const { toast } = await import('sonner');

    renderWithProviders(<LoginPage />);

    await user.type(screen.getByLabelText('Email'), 'test@example.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Login successful!');
    });

    expect(mockRouterPush).toHaveBeenCalledWith('/dashboard');
  });

  it('shows error toast with API message on invalid credentials', async () => {
    const user = userEvent.setup();
    const { toast } = await import('sonner');

    renderWithProviders(<LoginPage />);

    await user.type(screen.getByLabelText('Email'), 'wrong@example.com');
    await user.type(screen.getByLabelText('Password'), 'wrongpassword');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Invalid credentials');
    });

    expect(mockRouterPush).not.toHaveBeenCalled();
  });

  it('shows generic error toast on network failure', async () => {
    const user = userEvent.setup();
    const { toast } = await import('sonner');

    server.use(
      http.post(`${API_URL}/auths/login`, () => {
        return HttpResponse.error();
      }),
    );

    renderWithProviders(<LoginPage />);

    await user.type(screen.getByLabelText('Email'), 'test@example.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('An unexpected error occurred');
    });
  });

  it('shows loading state while submitting', async () => {
    const user = userEvent.setup();

    // Make login take a long time
    server.use(
      http.post(`${API_URL}/auths/login`, async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        return HttpResponse.json({ access_token: 'token' });
      }),
    );

    renderWithProviders(<LoginPage />);

    await user.type(screen.getByLabelText('Email'), 'test@example.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    // Button should show loading text
    expect(
      screen.getByRole('button', { name: 'Signing in...' }),
    ).toBeInTheDocument();

    // Inputs should be disabled
    expect(screen.getByLabelText('Email')).toBeDisabled();
    expect(screen.getByLabelText('Password')).toBeDisabled();
  });

  it('inputs have required attribute', () => {
    renderWithProviders(<LoginPage />);

    expect(screen.getByLabelText('Email')).toBeRequired();
    expect(screen.getByLabelText('Password')).toBeRequired();
  });

  it('email input has email type for validation', () => {
    renderWithProviders(<LoginPage />);

    expect(screen.getByLabelText('Email')).toHaveAttribute('type', 'email');
  });

  it('password input has password type', () => {
    renderWithProviders(<LoginPage />);

    expect(screen.getByLabelText('Password')).toHaveAttribute(
      'type',
      'password',
    );
  });

  it('toggles password visibility when eye icon is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />);

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

  it('displays welcome message', () => {
    renderWithProviders(<LoginPage />);

    expect(screen.getByText('Welcome back')).toBeInTheDocument();
    expect(
      screen.getByText('Enter your credentials to access your account'),
    ).toBeInTheDocument();
  });

  it('stores refresh token in cookie on successful login', async () => {
    const user = userEvent.setup();

    renderWithProviders(<LoginPage />);

    await user.type(screen.getByLabelText('Email'), 'test@example.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() => {
      expect(document.cookie).toContain('refresh_token=');
    });
  });

  it('handles email with special format error', async () => {
    const user = userEvent.setup();
    const { toast } = await import('sonner');

    server.use(
      http.post(`${API_URL}/auths/login`, () => {
        return HttpResponse.json(
          { message: 'Invalid email format', statusCode: 400 },
          { status: 400 },
        );
      }),
    );

    renderWithProviders(<LoginPage />);

    await user.type(screen.getByLabelText('Email'), 'test@example.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Invalid email format');
    });
  });
});
