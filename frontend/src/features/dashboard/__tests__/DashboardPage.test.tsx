import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DashboardPage } from '@/pages/DashboardPage';

vi.mock('@/features/auth/auth.hooks', () => ({
  useCurrentUser: vi.fn().mockReturnValue({
    data: {
      id: 'admin-1',
      email: 'admin@tpms.local',
      role: 'SUPER_ADMIN',
      firstName: 'Jim',
      lastName: 'Halpert',
    },
  }),
  useSessions: vi.fn().mockReturnValue({
    data: [],
    isLoading: false,
  }),
  useRevokeSession: vi.fn().mockReturnValue({ mutate: vi.fn(), isPending: false }),
  useChangePassword: vi.fn().mockReturnValue({ mutateAsync: vi.fn(), isPending: false }),
  useLogout: vi.fn().mockReturnValue({ mutate: vi.fn(), isPending: false }),
}));

vi.mock('@/features/dashboard/hooks', () => ({
  useDashboardStats: vi.fn().mockReturnValue({
    data: {
      role: 'SUPER_ADMIN',
      stats: {
        totalProperties: 12,
        totalUnits: 140,
        occupiedUnits: 125,
        occupancyRate: 89.3,
        totalRevenue: 285000,
        pendingMaintenance: 6,
        overdueRent: 4200,
      },
    },
    isLoading: false,
  }),
}));

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{component}</BrowserRouter>
    </QueryClientProvider>
  );
};

describe('DashboardPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders dynamic platform performance KPI cards and account overview', async () => {
    renderWithProviders(<DashboardPage />);

    expect(screen.getByText(/Platform Performance & Live Metrics/i)).toBeInTheDocument();
    expect(screen.getByText('Total Properties')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('Total Units')).toBeInTheDocument();
    expect(screen.getByText('140')).toBeInTheDocument();
    expect(screen.getByText(/89\.3/)).toBeInTheDocument();
    expect(screen.getByText(/285,000/)).toBeInTheDocument();
    expect(screen.getByText(/4,200/)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/Welcome, Jim Halpert/i)).toBeInTheDocument();
      expect(screen.getByText('Account Overview')).toBeInTheDocument();
    });
  });
});
