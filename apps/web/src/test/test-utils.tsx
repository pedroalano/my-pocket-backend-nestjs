import { ReactNode } from 'react';
import { render, RenderOptions, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, expect } from 'vitest';
import { AuthProvider } from '@/contexts/AuthContext';

interface WrapperProps {
  children: ReactNode;
}

function AllProviders({ children }: WrapperProps) {
  return <AuthProvider>{children}</AuthProvider>;
}

export function renderWithProviders(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) {
  return render(ui, { wrapper: AllProviders, ...options });
}

/**
 * Creates a userEvent instance configured to work with fake timers.
 * Use this instead of userEvent.setup() to avoid React act() warnings.
 */
export function setupUser() {
  return userEvent.setup({
    advanceTimers: vi.advanceTimersByTime,
  });
}

/**
 * Helper to select an option from a Radix UI Select component.
 * Handles the async behavior properly to avoid React act() warnings
 * by waiting for all pending state updates to complete.
 *
 * @param user - The userEvent instance from setupUser() or userEvent.setup()
 * @param trigger - The combobox trigger element
 * @param optionName - The accessible name of the option to select
 */
export async function selectOption(
  user: ReturnType<typeof userEvent.setup>,
  trigger: HTMLElement,
  optionName: string | RegExp,
): Promise<void> {
  await user.click(trigger);

  // Wait for the listbox to appear
  await waitFor(() => {
    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });

  const option = screen.getByRole('option', { name: optionName });
  await user.click(option);

  // Wait for the dropdown to close completely
  await waitFor(() => {
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });
}

export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
