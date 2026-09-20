import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RootLayout } from '../RootLayout';
import * as authHooks from '@/features/auth/auth.hooks';
import * as notifHooks from '@/features/notification/hooks';

// Mock auth & notification hooks
vi.mock('@/features/auth/auth.hooks', () => ({
  useCurrentUser: vi.fn(),
  useLogout: vi.fn(() => ({ mutateAsync: vi.fn() })),
}));

vi.mock('@/features/notification/hooks', () => ({
  useNotifications: vi.fn(),
  useMarkNotificationAsRead: vi.fn(() => ({ mutate: vi.fn() })),
  useMarkAllNotificationsAsRead: vi.fn(() => ({ mutate: vi.fn() })),
  NOTIFICATIONS_QUERY_KEY: ['notifications'],
}));

vi.mock('@/services/socket', () => ({
  connectSocket: vi.fn(() => ({
    on: vi.fn(),
    off: vi.fn(),
  })),
  disconnectSocket: vi.fn(),
}));

const renderLayout = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/']}>
        <RootLayout />
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe('RootLayout Component - Mobile Responsive Navigation', () => {
  it('toggles mobile dropdown menu when hamburger button is clicked', () => {
    vi.mocked(authHooks.useCurrentUser).mockReturnValue({
      data: {
        id: 'user-1',
        email: 'manager@test.com',
        firstName: 'Alice',
        lastName: 'Smith',
        role: 'MANAGER',
        isActive: true,
        createdAt: '',
        updatedAt: '',
      },
      isLoading: false,
    } as any);

    vi.mocked(notifHooks.useNotifications).mockReturnValue({
      data: { notifications: [], unreadCount: 0, total: 0 },
      isLoading: false,
    } as any);

    renderLayout();

    // The hamburger toggle button exists with aria-label
    const menuButton = screen.getByRole('button', { name: /open navigation menu/i });
    expect(menuButton).toBeInTheDocument();

    // Initially, mobile dropdown panel is not in document
    expect(screen.queryByText(/management & operations/i)).not.toBeInTheDocument();

    // Click to open mobile dropdown menu
    fireEvent.click(menuButton);

    // Now the mobile dropdown items (Dashboard, Invoices, Properties, etc.) are visible
    expect(screen.getByText(/management & operations/i)).toBeInTheDocument();
    expect(screen.getByText(/leases & financials/i)).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /sign out/i }).length).toBeGreaterThanOrEqual(1);

    // Button label switches to close navigation menu
    const closeButton = screen.getByRole('button', { name: /close navigation menu/i });
    expect(closeButton).toBeInTheDocument();

    // Click to close
    fireEvent.click(closeButton);
    expect(screen.queryByText(/management & operations/i)).not.toBeInTheDocument();
  });

  it('renders unauthenticated mobile options (Sign In & Register) when not logged in', () => {
    vi.mocked(authHooks.useCurrentUser).mockReturnValue({
      data: null,
      isLoading: false,
    } as any);

    vi.mocked(notifHooks.useNotifications).mockReturnValue({
      data: null,
      isLoading: false,
    } as any);

    renderLayout();

    const menuButton = screen.getByRole('button', { name: /open navigation menu/i });
    fireEvent.click(menuButton);

    expect(screen.getByText(/sign in to manage properties, invoices, leases, and maintenance/i)).toBeInTheDocument();
  });
});
