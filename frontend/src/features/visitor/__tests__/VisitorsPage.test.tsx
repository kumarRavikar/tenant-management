import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { VisitorsPage } from '@/pages/visitors/VisitorsPage';

vi.mock('@/features/visitor/api', () => ({
  visitorApi: {
    list: vi.fn().mockResolvedValue({
      visitors: [
        {
          id: 'visitor-101',
          propertyId: 'prop-1',
          unitId: 'unit-1',
          visitorName: 'Michael Scott',
          phone: '+1 555-0144',
          purpose: 'Consultation',
          visitDate: new Date().toISOString(),
          status: 'PRE_APPROVED',
          gatePassCode: 'PASS-SC0TT1',
          isDelivery: false,
          property: { id: 'prop-1', name: 'Scranton Business Park' },
          unit: { id: 'unit-1', unitNumber: 'Suite 200' },
          createdAt: new Date().toISOString(),
        },
      ],
      meta: {
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      },
    }),
    create: vi.fn(),
    checkIn: vi.fn(),
    checkOut: vi.fn(),
  },
}));

vi.mock('@/features/auth/auth.hooks', () => ({
  useCurrentUser: vi.fn().mockReturnValue({
    data: {
      id: 'admin-1',
      email: 'admin@tpms.local',
      role: 'SUPER_ADMIN',
      firstName: 'Dwight',
      lastName: 'Schrute',
    },
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

describe('VisitorsPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders visitor registry table with gate pass code and visitor information', async () => {
    renderWithProviders(<VisitorsPage />);

    expect(screen.getByRole('heading', { name: /visitor & gate pass management/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /pre-approve visitor/i })).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Michael Scott')).toBeInTheDocument();
      expect(screen.getByText('+1 555-0144')).toBeInTheDocument();
      expect(screen.getByText('PASS-SC0TT1')).toBeInTheDocument();
      expect(screen.getByText('Scranton Business Park')).toBeInTheDocument();
      expect(screen.getAllByText(/Pre-Approved/i).length).toBeGreaterThan(0);
      expect(screen.getByRole('button', { name: /check in/i })).toBeInTheDocument();
    });
  });

  it('opens pre-approve modal when clicking button', async () => {
    renderWithProviders(<VisitorsPage />);

    const preApproveBtn = screen.getByRole('button', { name: /pre-approve visitor/i });
    fireEvent.click(preApproveBtn);

    expect(screen.getByText(/Property ID \*/i)).toBeInTheDocument();
    expect(screen.getByText(/Visitor Name \*/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /confirm pre-approval/i })).toBeInTheDocument();
  });
});
