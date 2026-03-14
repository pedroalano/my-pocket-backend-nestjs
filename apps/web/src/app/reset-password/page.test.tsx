import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/mocks/server';
import { renderWithProviders, userEvent } from '@/test/test-utils';
import ResetPasswordPage from './page';

const API_URL = 'http://localhost:3001';

const mockRouterPush = vi.fn();
const mockSearchParams = { get: vi.fn() };

vi.mock('next/navigation', async () => ({
  useRouter: () => ({
    push: mockRouterPush,
    replace: vi.fn(),
    back: vi.fn(),
  }),
  useSearchParams: () => mockSearchParams,
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('ResetPasswordPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams.get.mockReturnValue(null);
  });

  it('shows error card when token is missing from URL', () => {
    mockSearchParams.get.mockReturnValue(null);
    renderWithProviders(<ResetPasswordPage />);

    expect(
      screen.getByText(
        'Invalid or missing reset token. Please request a new password reset.',
      ),
    ).toBeInTheDocument();
  });

  it('renders new and confirm password inputs when token is present', () => {
    mockSearchParams.get.mockReturnValue('valid-reset-token');
    renderWithProviders(<ResetPasswordPage />);

    expect(screen.getByLabelText('New Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reset Password' })).toBeInTheDocument();
  });

  it('shows error toast when passwords do not match', async () => {
    const user = userEvent.setup();
    const { toast } = await import('sonner');

    mockSearchParams.get.mockReturnValue('valid-reset-token');
    renderWithProviders(<ResetPasswordPage />);

    await user.type(screen.getByLabelText('New Password'), 'Password1');
    await user.type(screen.getByLabelText('Confirm Password'), 'Password2');
    await user.click(screen.getByRole('button', { name: 'Reset Password' }));

    expect(toast.error).toHaveBeenCalledWith('Passwords do not match');
    expect(mockRouterPush).not.toHaveBeenCalled();
  });

  it('shows loading state while request is in flight', async () => {
    const user = userEvent.setup();

    server.use(
      http.post(`${API_URL}/auths/reset-password`, async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        return HttpResponse.json({ message: 'Password has been reset successfully' });
      }),
    );

    mockSearchParams.get.mockReturnValue('valid-reset-token');
    renderWithProviders(<ResetPasswordPage />);

    await user.type(screen.getByLabelText('New Password'), 'Password1');
    await user.type(screen.getByLabelText('Confirm Password'), 'Password1');
    await user.click(screen.getByRole('button', { name: 'Reset Password' }));

    expect(screen.getByRole('button', { name: 'Resetting...' })).toBeDisabled();
  });

  it('calls toast.success and router.push on success', async () => {
    const user = userEvent.setup();
    const { toast } = await import('sonner');

    mockSearchParams.get.mockReturnValue('valid-reset-token');
    renderWithProviders(<ResetPasswordPage />);

    await user.type(screen.getByLabelText('New Password'), 'Password1');
    await user.type(screen.getByLabelText('Confirm Password'), 'Password1');
    await user.click(screen.getByRole('button', { name: 'Reset Password' }));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        'Password reset successfully! Redirecting to login...',
      );
    });

    expect(mockRouterPush).toHaveBeenCalledWith('/login');
  });

  it('shows toast.error with API message on invalid token', async () => {
    const user = userEvent.setup();
    const { toast } = await import('sonner');

    mockSearchParams.get.mockReturnValue('invalid-token');
    renderWithProviders(<ResetPasswordPage />);

    await user.type(screen.getByLabelText('New Password'), 'Password1');
    await user.type(screen.getByLabelText('Confirm Password'), 'Password1');
    await user.click(screen.getByRole('button', { name: 'Reset Password' }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'Invalid or expired password reset token',
      );
    });
  });

  it('shows generic toast.error on network error', async () => {
    const user = userEvent.setup();
    const { toast } = await import('sonner');

    server.use(
      http.post(`${API_URL}/auths/reset-password`, () => {
        return HttpResponse.error();
      }),
    );

    mockSearchParams.get.mockReturnValue('valid-reset-token');
    renderWithProviders(<ResetPasswordPage />);

    await user.type(screen.getByLabelText('New Password'), 'Password1');
    await user.type(screen.getByLabelText('Confirm Password'), 'Password1');
    await user.click(screen.getByRole('button', { name: 'Reset Password' }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('An unexpected error occurred');
    });
  });

  it('password toggle shows/hides new password', async () => {
    const user = userEvent.setup();

    mockSearchParams.get.mockReturnValue('valid-reset-token');
    renderWithProviders(<ResetPasswordPage />);

    const passwordInput = screen.getByLabelText('New Password');
    expect(passwordInput).toHaveAttribute('type', 'password');

    const [toggleButton] = screen.getAllByRole('button', { name: 'Show password' });
    await user.click(toggleButton);

    expect(passwordInput).toHaveAttribute('type', 'text');
    expect(screen.getByRole('button', { name: 'Hide password' })).toBeInTheDocument();
  });
});
