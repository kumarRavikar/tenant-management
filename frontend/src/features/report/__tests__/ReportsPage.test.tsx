import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReportsPage } from '@/pages/reports/ReportsPage';
import { reportApi } from '@/features/report/api';

vi.mock('@/features/report/hooks', () => ({
  useReport: vi.fn().mockReturnValue({
    data: {
      title: 'Occupancy Report',
      headers: ['Property', 'Building', 'Total Units', 'Occupied', 'Vacant', 'Maintenance', 'Occupancy %'],
      rows: [['Grand Plaza', 'Tower A', 50, 45, 5, 0, '90%']],
      summary: {
        totalProperties: 1,
        totalUnits: 50,
        totalOccupied: 45,
        overallOccupancyRate: '90%',
      },
    },
    isLoading: false,
  }),
}));

vi.mock('@/features/report/api', () => ({
  reportApi: {
    downloadExport: vi.fn().mockResolvedValue(undefined),
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

describe('ReportsPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders report navigation tabs, summary metrics, and table', async () => {
    renderWithProviders(<ReportsPage />);

    expect(screen.getByRole('heading', { name: /reporting & analytics/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /export csv/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /export pdf/i })).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Occupancy')).toBeInTheDocument();
      expect(screen.getByText('Rent Collection')).toBeInTheDocument();
      expect(screen.getByText('Grand Plaza')).toBeInTheDocument();
      expect(screen.getByText('Tower A')).toBeInTheDocument();
      expect(screen.getAllByText('90%').length).toBeGreaterThan(0);
    });
  });

  it('triggers CSV and PDF export when buttons are clicked', async () => {
    renderWithProviders(<ReportsPage />);

    const csvBtn = screen.getByRole('button', { name: /export csv/i });
    fireEvent.click(csvBtn);
    expect(reportApi.downloadExport).toHaveBeenCalledWith('occupancy', 'csv', expect.any(Object));

    const pdfBtn = screen.getByRole('button', { name: /export pdf/i });
    fireEvent.click(pdfBtn);
    expect(reportApi.downloadExport).toHaveBeenCalledWith('occupancy', 'pdf', expect.any(Object));
  });
});

