import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/mocks/server';
import { renderWithProviders, userEvent } from '@/test/test-utils';
import ForgotPasswordPage from './page';

const API_URL = 'http://localhost:3001';

const mockRouterPush = vi.fn();
vi.mock('next/navigation', async () => ({
  useRouter: () => ({
    push: mockRouterPush,
    replace: vi.fn(),
    back: vi.fn(),
  }),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('ForgotPasswordPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders email input and submit button', () => {
    renderWithProviders(<ForgotPasswordPage />);

    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Send Reset Link' })).toBeInTheDocument();
  });

  it('renders "Back to login" link pointing to /login', () => {
    renderWithProviders(<ForgotPasswordPage />);

    const backLink = screen.getByRole('link', { name: 'Back to login' });
    expect(backLink).toHaveAttribute('href', '/login');
  });

  it('shows loading state while request is in flight', async () => {
    const user = userEvent.setup();

    server.use(
      http.post(`${API_URL}/auths/forgot-password`, async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        return HttpResponse.json({ message: 'sent' });
      }),
    );

    renderWithProviders(<ForgotPasswordPage />);

    await user.type(screen.getByLabelText('Email'), 'test@example.com');
    await user.click(screen.getByRole('button', { name: 'Send Reset Link' }));

    expect(screen.getByRole('button', { name: 'Sending...' })).toBeDisabled();
  });

  it('shows success state after successful submit', async () => {
    const user = userEvent.setup();

    renderWithProviders(<ForgotPasswordPage />);

    await user.type(screen.getByLabelText('Email'), 'test@example.com');
    await user.click(screen.getByRole('button', { name: 'Send Reset Link' }));

    await waitFor(() => {
      expect(screen.getByText('Check your email')).toBeInTheDocument();
    });

    expect(
      screen.getByText(
        'If an account with that email exists, a password reset link has been sent.',
      ),
    ).toBeInTheDocument();
  });

  it('shows toast.error with API message on error', async () => {
    const user = userEvent.setup();
    const { toast } = await import('sonner');

    server.use(
      http.post(`${API_URL}/auths/forgot-password`, () => {
        return HttpResponse.json(
          { message: 'Too many requests', statusCode: 429 },
          { status: 429 },
        );
      }),
    );

    renderWithProviders(<ForgotPasswordPage />);

    await user.type(screen.getByLabelText('Email'), 'test@example.com');
    await user.click(screen.getByRole('button', { name: 'Send Reset Link' }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Too many requests');
    });
  });

  it('shows generic toast.error on network error', async () => {
    const user = userEvent.setup();
    const { toast } = await import('sonner');

    server.use(
      http.post(`${API_URL}/auths/forgot-password`, () => {
        return HttpResponse.error();
      }),
    );

    renderWithProviders(<ForgotPasswordPage />);

    await user.type(screen.getByLabelText('Email'), 'test@example.com');
    await user.click(screen.getByRole('button', { name: 'Send Reset Link' }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('An unexpected error occurred');
    });
  });

  it('email input has required attribute and type="email"', () => {
    renderWithProviders(<ForgotPasswordPage />);

    const emailInput = screen.getByLabelText('Email');
    expect(emailInput).toBeRequired();
    expect(emailInput).toHaveAttribute('type', 'email');
  });
});
