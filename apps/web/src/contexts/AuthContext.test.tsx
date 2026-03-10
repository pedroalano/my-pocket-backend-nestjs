import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from './AuthContext';
import { mockToken, mockRefreshToken, mockUser } from '@/test/mocks/handlers';

// Test component that uses the auth context
function TestComponent() {
  const { user, isAuthenticated, isLoading, login, logout, register } =
    useAuth();

  return (
    <div>
      <p data-testid="loading">{isLoading ? 'loading' : 'ready'}</p>
      <p data-testid="authenticated">{isAuthenticated ? 'yes' : 'no'}</p>
      <p data-testid="user">{user ? user.email : 'none'}</p>
      <button
        onClick={() =>
          login({ email: 'test@example.com', password: 'password123' })
        }
      >
        Login
      </button>
      <button
        onClick={() =>
          register({
            name: 'New User',
            email: 'new@example.com',
            password: 'password123',
          })
        }
      >
        Register
      </button>
      <button onClick={logout}>Logout</button>
    </div>
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    // Ensure no refresh token cookie is set before each test
    document.cookie = 'refresh_token=; path=/; max-age=0; SameSite=Strict';
  });

  afterEach(() => {
    document.cookie = 'refresh_token=; path=/; max-age=0; SameSite=Strict';
  });

  it('should provide initial unauthenticated state when no cookie', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('ready');
    });

    expect(screen.getByTestId('authenticated')).toHaveTextContent('no');
    expect(screen.getByTestId('user')).toHaveTextContent('none');
  });

  it('should restore session from valid refresh token cookie', async () => {
    document.cookie = `refresh_token=${mockRefreshToken}; path=/`;

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('yes');
    });

    expect(screen.getByTestId('user')).toHaveTextContent(mockUser.email);
    expect(screen.getByTestId('loading')).toHaveTextContent('ready');
  });

  it('should clear cookie and stay unauthenticated when refresh token is invalid', async () => {
    document.cookie = 'refresh_token=invalid-token-value; path=/';

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('ready');
    });

    expect(screen.getByTestId('authenticated')).toHaveTextContent('no');
    expect(document.cookie).not.toContain('invalid-token-value');
  });

  it('should login successfully and set refresh token cookie', async () => {
    const user = userEvent.setup();

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('ready');
    });

    await user.click(screen.getByText('Login'));

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('yes');
    });

    expect(document.cookie).toContain('refresh_token=');
    expect(screen.getByTestId('user')).toHaveTextContent(mockUser.email);
  });

  it('should register successfully and set refresh token cookie', async () => {
    const user = userEvent.setup();

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('ready');
    });

    await user.click(screen.getByText('Register'));

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('yes');
    });

    expect(document.cookie).toContain('refresh_token=');
  });

  it('should logout successfully and clear cookie', async () => {
    const user = userEvent.setup();
    document.cookie = `refresh_token=${mockRefreshToken}; path=/`;

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('yes');
    });

    await user.click(screen.getByText('Logout'));

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('no');
    });

    expect(screen.getByTestId('user')).toHaveTextContent('none');
    expect(document.cookie).not.toContain(mockRefreshToken);
  });

  it('should throw error when useAuth is used outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => render(<TestComponent />)).toThrow(
      'useAuth must be used within an AuthProvider',
    );

    consoleSpy.mockRestore();
  });
});
