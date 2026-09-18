import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MaintenancePage } from '@/pages/maintenance/MaintenancePage';

vi.mock('@/features/maintenance/maintenance.api', () => ({
  maintenanceApi: {
    getTickets: vi.fn().mockResolvedValue({
      tickets: [
        {
          id: 'ticket-101',
          unitId: 'unit-1',
          createdById: 'user-tenant',
          title: 'Broken Radiator',
          description: 'Radiator is leaking hot water onto the bedroom floor.',
          priority: 'URGENT',
          status: 'OPEN',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          unit: {
            id: 'unit-1',
            unitNumber: '5A',
            floor: {
              floorNumber: 5,
              building: {
                id: 'bldg-1',
                name: 'Main Block',
                property: {
                  id: 'prop-1',
                  name: 'Grand Plaza',
                },
              },
            },
          },
          createdBy: {
            id: 'user-tenant',
            firstName: 'Sarah',
            lastName: 'Connor',
            role: 'TENANT',
          },
          assignedTo: null,
          _count: {
            comments: 2,
            attachments: 1,
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
    createTicket: vi.fn(),
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

describe('MaintenancePage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders maintenance tickets with status, priority and unit details', async () => {
    renderWithProviders(<MaintenancePage />);

    expect(screen.getByRole('heading', { name: /maintenance tickets/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /new request/i })).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Broken Radiator')).toBeInTheDocument();
      expect(screen.getByText(/Unit 5A/)).toBeInTheDocument();
      expect(screen.getByText(/Sarah Connor/)).toBeInTheDocument();
      expect(screen.getByText('URGENT')).toBeInTheDocument();
      expect(screen.getAllByText(/Open/i).length).toBeGreaterThan(0);
      expect(screen.getByText(/Unassigned/i)).toBeInTheDocument();
    });
  });

  it('opens create maintenance request modal when clicking new request button', async () => {
    renderWithProviders(<MaintenancePage />);

    const newBtn = screen.getByRole('button', { name: /new request/i });
    fireEvent.click(newBtn);

    expect(
      screen.getByRole('heading', { name: /create maintenance request/i })
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/issue title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /submit request/i })).toBeInTheDocument();
  });
});
