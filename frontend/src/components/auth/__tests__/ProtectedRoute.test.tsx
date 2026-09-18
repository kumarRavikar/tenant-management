import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from '../ProtectedRoute';
import * as authHooks from '@/features/auth/auth.hooks';
import { UserRole } from '@/types';

vi.mock('@/features/auth/auth.hooks', () => ({
  useCurrentUser: vi.fn(),
}));

describe('ProtectedRoute Component', () => {
  it('shows loading indicator while verifying authentication', () => {
    vi.mocked(authHooks.useCurrentUser).mockReturnValue({
      data: undefined,
      isLoading: true,
    } as any);

    render(
      <MemoryRouter>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    expect(screen.getByText(/verifying authorization\.\.\./i)).toBeInTheDocument();
  });

  it('redirects to /login when user is unauthenticated', () => {
    vi.mocked(authHooks.useCurrentUser).mockReturnValue({
      data: null,
      isLoading: false,
    } as any);

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <div>Protected Content</div>
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<div>Login Screen</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Login Screen')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('renders children when user is authenticated and permitted', () => {
    vi.mocked(authHooks.useCurrentUser).mockReturnValue({
      data: {
        id: 'user-1',
        email: 'tenant@test.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'TENANT' as UserRole,
        isActive: true,
        createdAt: '',
        updatedAt: '',
      },
      isLoading: false,
    } as any);

    render(
      <MemoryRouter>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('displays Access Denied when user does not have allowed role', () => {
    vi.mocked(authHooks.useCurrentUser).mockReturnValue({
      data: {
        id: 'user-1',
        email: 'tenant@test.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'TENANT' as UserRole,
        isActive: true,
        createdAt: '',
        updatedAt: '',
      },
      isLoading: false,
    } as any);

    render(
      <MemoryRouter>
        <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
          <div>Admin Only Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    expect(screen.getByText(/access denied/i)).toBeInTheDocument();
    expect(screen.queryByText('Admin Only Content')).not.toBeInTheDocument();
  });
});

