import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeAll, afterAll, vi, beforeEach } from 'vitest';
import { server } from './mocks/server';
import { setAccessToken } from '@/lib/api';

// Suppress React act() warnings from Radix UI components
// These warnings occur due to Radix UI's internal async state management
// and don't indicate actual test issues
const originalConsoleError = console.error;
console.error = (...args: unknown[]) => {
  const message = args[0];
  if (
    typeof message === 'string' &&
    (message.includes('was not wrapped in act(...)') ||
      message.includes(
        'inside an `act` scope, but the `act` call was not awaited',
      ))
  ) {
    return;
  }
  originalConsoleError(...args);
};

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    prefetch: vi.fn(),
  }),
  useParams: () => ({}),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '',
}));

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Disable CSS animations/transitions to prevent React act() warnings
// from Radix UI components (Select, Dialog, etc.)
const style = document.createElement('style');
style.innerHTML = `
  *, *::before, *::after {
    animation-duration: 0s !important;
    animation-delay: 0s !important;
    transition-duration: 0s !important;
    transition-delay: 0s !important;
  }
`;
document.head.appendChild(style);

// Mock window.matchMedia for Radix UI components
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver for Radix UI components
// Must use a regular function (not arrow) because vi.fn() calls it with `new`
global.ResizeObserver = vi.fn().mockImplementation(function () {
  this.observe = vi.fn();
  this.unobserve = vi.fn();
  this.disconnect = vi.fn();
}) as unknown as typeof ResizeObserver;

// Setup MSW
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

beforeEach(() => {
  // Use fake timers with shouldAdvanceTime for async operations
  vi.useFakeTimers({ shouldAdvanceTime: true });
});

afterEach(() => {
  // Run pending timers before cleanup to avoid act() warnings
  vi.runOnlyPendingTimers();
  vi.useRealTimers();
  cleanup();
  server.resetHandlers();
  vi.clearAllMocks();
  localStorageMock.getItem.mockReset();
  localStorageMock.setItem.mockReset();
  localStorageMock.removeItem.mockReset();
  // Clear the module-level access token between tests
  setAccessToken(null);
  // Clear the refresh token cookie between tests
  document.cookie = 'refresh_token=; path=/; max-age=0; SameSite=Strict';
});

afterAll(() => server.close());
