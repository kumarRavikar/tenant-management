import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { InvoicesPage } from '@/pages/invoices/InvoicesPage';

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

vi.mock('@/features/invoice/invoice.api', () => ({
  invoiceApi: {
    getInvoices: vi.fn().mockResolvedValue({
      invoices: [
        {
          id: 'inv-101',
          leaseId: 'lease-101',
          invoiceNumber: 'INV-202603-0001',
          billingMonth: '2026-03',
          dueDate: '2026-03-05T00:00:00.000Z',
          rentAmount: 2000,
          maintenanceAmount: 150,
          lateFee: 0,
          discount: 50,
          totalAmount: 2100,
          paidAmount: 1000,
          status: 'PARTIALLY_PAID',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      meta: {
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      },
    }),
    createInvoice: vi.fn(),
  },
}));

vi.mock('@/features/payment/payment.api', () => ({
  paymentApi: {
    recordPayment: vi.fn(),
    getReceipt: vi.fn(),
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

describe('InvoicesPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders invoices list and billing summary cards', async () => {
    renderWithProviders(<InvoicesPage />);

    expect(screen.getByRole('heading', { name: /rent & invoices/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /generate invoice/i })).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('INV-202603-0001')).toBeInTheDocument();
      expect(screen.getByText(/2026-03/)).toBeInTheDocument();
      expect(screen.getAllByText(/\$2,100\.00/).length).toBeGreaterThan(0);
      expect(screen.getByText(/Paid: \$1,000\.00/i)).toBeInTheDocument();
      expect(screen.getByText(/Due: \$1,100\.00/i)).toBeInTheDocument();
      expect(screen.getAllByText(/Partial/i).length).toBeGreaterThan(0);
    });
  });

  it('opens generate invoice modal when clicking button', async () => {
    renderWithProviders(<InvoicesPage />);

    const generateBtn = screen.getByRole('button', { name: /generate invoice/i });
    fireEvent.click(generateBtn);

    expect(screen.getByRole('heading', { name: /generate rent invoice/i })).toBeInTheDocument();
    expect(screen.getByText(/Calculated Total/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create invoice/i })).toBeInTheDocument();
  });

  it('opens record payment modal when clicking Pay button', async () => {
    renderWithProviders(<InvoicesPage />);

    await waitFor(() => {
      expect(screen.getByText('INV-202603-0001')).toBeInTheDocument();
    });

    const payBtn = screen.getByRole('button', { name: /pay/i });
    fireEvent.click(payBtn);

    expect(screen.getByRole('heading', { name: /record payment/i })).toBeInTheDocument();
    expect(screen.getByText(/Make a payment towards invoice INV-202603-0001/i)).toBeInTheDocument();
  });
});
