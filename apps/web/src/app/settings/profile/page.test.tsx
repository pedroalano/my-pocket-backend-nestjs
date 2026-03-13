import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/mocks/server';
import { mockUser } from '@/test/mocks/handlers';
import {
  renderWithAuthenticatedProviders,
  setupUser,
} from '@/test/test-utils';
import SettingsProfilePage from './page';

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

import { toast } from 'sonner';

describe('SettingsProfilePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads and populates profile fields', async () => {
    renderWithAuthenticatedProviders(<SettingsProfilePage />);

    await waitFor(() => {
      expect(
        (screen.getByLabelText('Name') as HTMLInputElement).value,
      ).toBe(mockUser.name);
    });

    expect(
      (screen.getByLabelText('Email') as HTMLInputElement).value,
    ).toBe(mockUser.email);
  });

  it('shows load error when API fails', async () => {
    server.use(
      http.get(`${API_URL}/users/me`, () => {
        return HttpResponse.json(
          { message: 'Internal server error', statusCode: 500 },
          { status: 500 },
        );
      }),
    );

    renderWithAuthenticatedProviders(<SettingsProfilePage />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load profile')).toBeInTheDocument();
    });
  });

  it('updates name successfully', async () => {
    const user = setupUser();
    renderWithAuthenticatedProviders(<SettingsProfilePage />);

    await waitFor(() => {
      expect(
        (screen.getByLabelText('Name') as HTMLInputElement).value,
      ).toBe(mockUser.name);
    });

    const nameInput = screen.getByLabelText('Name');
    await user.clear(nameInput);
    await user.type(nameInput, 'New Name');

    fireEvent.submit(nameInput.closest('form')!);

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Name updated successfully');
    });
  });

  it('updates email successfully', async () => {
    const user = setupUser();
    renderWithAuthenticatedProviders(<SettingsProfilePage />);

    await waitFor(() => {
      expect(
        (screen.getByLabelText('Email') as HTMLInputElement).value,
      ).toBe(mockUser.email);
    });

    const emailInput = screen.getByLabelText('Email');
    await user.clear(emailInput);
    await user.type(emailInput, 'new@example.com');

    fireEvent.submit(emailInput.closest('form')!);

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Email updated successfully');
    });
  });

  it('shows error on duplicate email (409)', async () => {
    const user = setupUser();
    renderWithAuthenticatedProviders(<SettingsProfilePage />);

    await waitFor(() => {
      expect(
        (screen.getByLabelText('Email') as HTMLInputElement).value,
      ).toBe(mockUser.email);
    });

    const emailInput = screen.getByLabelText('Email');
    await user.clear(emailInput);
    await user.type(emailInput, 'taken@example.com');

    fireEvent.submit(emailInput.closest('form')!);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Email already exists');
    });
  });

  it('shows password mismatch error when passwords do not match', async () => {
    const user = setupUser();
    renderWithAuthenticatedProviders(<SettingsProfilePage />);

    await waitFor(() => {
      expect(screen.getByLabelText('Current Password')).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText('Current Password'), 'OldPassword1');
    await user.type(screen.getByLabelText('New Password'), 'NewPassword1');
    await user.type(screen.getByLabelText('Confirm New Password'), 'Different1');

    fireEvent.submit(
      screen.getByLabelText('Current Password').closest('form')!,
    );

    await waitFor(() => {
      expect(
        screen.getByText('New passwords do not match'),
      ).toBeInTheDocument();
    });
  });

  it('changes password successfully and triggers logout', async () => {
    const user = setupUser();
    renderWithAuthenticatedProviders(<SettingsProfilePage />);

    await waitFor(() => {
      expect(screen.getByLabelText('Current Password')).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText('Current Password'), 'OldPassword1');
    await user.type(screen.getByLabelText('New Password'), 'NewPassword1');
    await user.type(screen.getByLabelText('Confirm New Password'), 'NewPassword1');

    fireEvent.submit(
      screen.getByLabelText('Current Password').closest('form')!,
    );

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        'Password updated. You will be logged out shortly.',
      );
    });
  });

  it('shows error toast when password change fails (wrong current password)', async () => {
    // Set a refresh token cookie so the 401 interceptor can retry the request
    // instead of silently redirecting to /login, which surfaces the actual error.
    document.cookie = 'refresh_token=mock-refresh-token-value; path=/';

    const user = setupUser();
    renderWithAuthenticatedProviders(<SettingsProfilePage />);

    await waitFor(() => {
      expect(screen.getByLabelText('Current Password')).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText('Current Password'), 'WrongPassword1');
    await user.type(screen.getByLabelText('New Password'), 'NewPassword1');
    await user.type(screen.getByLabelText('Confirm New Password'), 'NewPassword1');

    fireEvent.submit(
      screen.getByLabelText('Current Password').closest('form')!,
    );

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Current password is incorrect');
    });
  });

  it('shows delete account dialog and confirms deletion', async () => {
    const user = setupUser();
    renderWithAuthenticatedProviders(<SettingsProfilePage />);

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: 'Delete Account' }),
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Delete Account' }));

    await waitFor(() => {
      expect(screen.getByText('Are you absolutely sure?')).toBeInTheDocument();
    });

    await user.click(
      screen.getByRole('button', { name: 'Yes, delete my account' }),
    );

    await waitFor(() => {
      expect(mockRouterPush).toHaveBeenCalledWith('/');
    });
  });
});
