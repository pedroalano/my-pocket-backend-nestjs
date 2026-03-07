import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setupUser } from '@/test/test-utils';
import { ThemeToggle } from './ThemeToggle';

const mockSetTheme = vi.fn();

vi.mock('next-themes', () => ({
  useTheme: () => ({
    setTheme: mockSetTheme,
    theme: 'system',
  }),
}));

describe('ThemeToggle', () => {
  beforeEach(() => {
    mockSetTheme.mockClear();
  });

  it('renders the toggle button', () => {
    render(<ThemeToggle />);
    expect(screen.getByRole('button', { name: /toggle theme/i })).toBeInTheDocument();
  });

  it('shows Light, Dark, and System options when opened', async () => {
    const user = setupUser();
    render(<ThemeToggle />);
    await user.click(screen.getByRole('button', { name: /toggle theme/i }));

    await waitFor(() => {
      expect(screen.getByText('Light')).toBeInTheDocument();
      expect(screen.getByText('Dark')).toBeInTheDocument();
      expect(screen.getByText('System')).toBeInTheDocument();
    });
  });

  it('calls setTheme("light") when Light is clicked', async () => {
    const user = setupUser();
    render(<ThemeToggle />);
    await user.click(screen.getByRole('button', { name: /toggle theme/i }));

    await waitFor(() => expect(screen.getByText('Light')).toBeInTheDocument());
    await user.click(screen.getByText('Light'));

    expect(mockSetTheme).toHaveBeenCalledWith('light');
  });

  it('calls setTheme("dark") when Dark is clicked', async () => {
    const user = setupUser();
    render(<ThemeToggle />);
    await user.click(screen.getByRole('button', { name: /toggle theme/i }));

    await waitFor(() => expect(screen.getByText('Dark')).toBeInTheDocument());
    await user.click(screen.getByText('Dark'));

    expect(mockSetTheme).toHaveBeenCalledWith('dark');
  });

  it('calls setTheme("system") when System is clicked', async () => {
    const user = setupUser();
    render(<ThemeToggle />);
    await user.click(screen.getByRole('button', { name: /toggle theme/i }));

    await waitFor(() => expect(screen.getByText('System')).toBeInTheDocument());
    await user.click(screen.getByText('System'));

    expect(mockSetTheme).toHaveBeenCalledWith('system');
  });
});
