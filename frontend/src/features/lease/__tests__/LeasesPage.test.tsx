import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LeasesPage } from '@/pages/leases/LeasesPage';

vi.mock('@/features/auth/auth.hooks', () => ({
  useCurrentUser: () => ({
    data: {
      id: 'admin-1',
      firstName: 'Admin',
      lastName: 'User',
      role: 'SUPER_ADMIN',
    },
  }),
}));

vi.mock('@/features/lease/lease.api', () => ({
  leaseApi: {
    getLeases: vi.fn().mockResolvedValue({
      leases: [
        {
          id: 'lease-101',
          unitId: 'unit-1',
          tenantProfileId: 'tenant-1',
          startDate: '2026-01-01',
          endDate: '2026-12-31',
          monthlyRent: 2200,
          securityDeposit: 2200,
          status: 'ACTIVE',
          unit: {
            id: 'unit-1',
            unitNumber: '4B',
            floor: {
              id: 'floor-1',
              floorNumber: 4,
              building: {
                id: 'bldg-1',
                name: 'East Tower',
                property: {
                  id: 'prop-1',
                  name: 'Horizon Heights',
                },
              },
            },
          },
          tenant: {
            id: 'tenant-1',
            onboardingStatus: 'VERIFIED',
            user: {
              id: 'u-tenant',
              firstName: 'John',
              lastName: 'Smith',
              email: 'john.smith@example.com',
            },
          },
        },
      ],
      meta: {
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      },
    }),
    createLease: vi.fn(),
  },
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

describe('LeasesPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders leases list with unit and tenant details', async () => {
    renderWithProviders(<LeasesPage />);

    expect(screen.getByRole('heading', { name: /lease management/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create lease/i })).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/Unit 4B/i)).toBeInTheDocument();
      expect(screen.getByText(/john\.smith@example\.com/i)).toBeInTheDocument();
      expect(screen.getAllByText(/Active/i).length).toBeGreaterThan(0);
    });
  });

  it('opens create lease modal when clicking create lease button', async () => {
    renderWithProviders(<LeasesPage />);

    const createBtn = screen.getByRole('button', { name: /create lease/i });
    fireEvent.click(createBtn);

    expect(screen.getByRole('heading', { name: /create new lease/i })).toBeInTheDocument();
    expect(screen.getByText(/Initial Status/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create lease contract/i })).toBeInTheDocument();
  });
});
