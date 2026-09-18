import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PropertiesPage } from '@/pages/properties/PropertiesPage';

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

vi.mock('@/features/property/property.api', () => ({
  propertyApi: {
    getProperties: vi.fn().mockResolvedValue({
      properties: [
        {
          id: 'prop-1',
          name: 'Grand View Heights',
          address: '100 Sunset Blvd',
          city: 'Los Angeles',
          state: 'CA',
          postalCode: '90001',
          country: 'USA',
          description: 'Luxury highrise residences',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          _count: { buildings: 2 },
        },
      ],
      meta: {
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      },
    }),
    createProperty: vi.fn().mockResolvedValue({
      id: 'prop-2',
      name: 'Pacific Point',
      address: '200 Ocean Ave',
      city: 'Santa Monica',
    }),
    updateProperty: vi.fn(),
    deleteProperty: vi.fn(),
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

describe('PropertiesPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders property list page with table headers and rows', async () => {
    renderWithProviders(<PropertiesPage />);

    expect(screen.getByRole('heading', { name: /properties/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add property/i })).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Grand View Heights')).toBeInTheDocument();
      expect(screen.getByText(/100 Sunset Blvd/i)).toBeInTheDocument();
      expect(screen.getByText(/2 buildings/i)).toBeInTheDocument();
    });
  });

  it('opens create property modal on button click', async () => {
    renderWithProviders(<PropertiesPage />);

    const addBtn = screen.getByRole('button', { name: /add property/i });
    fireEvent.click(addBtn);

    expect(screen.getByRole('heading', { name: /create new property/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/e.g. Grand Horizon Heights/i)).toBeInTheDocument();
  });
});
