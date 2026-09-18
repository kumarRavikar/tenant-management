import { createBrowserRouter } from 'react-router-dom';
import { RootLayout } from '@/layouts/RootLayout';
import { HomePage } from '@/pages/HomePage';
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from '@/pages/auth/ResetPasswordPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { PropertiesPage } from '@/pages/properties/PropertiesPage';
import { PropertyDetailPage } from '@/pages/properties/PropertyDetailPage';
import { UnitsPage } from '@/pages/units/UnitsPage';
import { OwnersPage } from '@/pages/owners/OwnersPage';
import { OwnerDetailPage } from '@/pages/owners/OwnerDetailPage';
import { TenantsPage } from '@/pages/tenants/TenantsPage';
import { TenantDetailPage } from '@/pages/tenants/TenantDetailPage';
import { LeasesPage } from '@/pages/leases/LeasesPage';
import { LeaseDetailPage } from '@/pages/leases/LeaseDetailPage';
import { InvoicesPage } from '@/pages/invoices/InvoicesPage';
import { InvoiceDetailPage } from '@/pages/invoices/InvoiceDetailPage';
import { PaymentsPage } from '@/pages/payments/PaymentsPage';
import { MaintenancePage } from '@/pages/maintenance/MaintenancePage';
import { MaintenanceDetailPage } from '@/pages/maintenance/MaintenanceDetailPage';
import { VisitorsPage } from '@/pages/visitors/VisitorsPage';
import { ReportsPage } from '@/pages/reports/ReportsPage';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { NotFoundPage } from '@/pages/NotFoundPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: 'login',
        element: <LoginPage />,
      },
      {
        path: 'register',
        element: <RegisterPage />,
      },
      {
        path: 'forgot-password',
        element: <ForgotPasswordPage />,
      },
      {
        path: 'reset-password',
        element: <ResetPasswordPage />,
      },
      {
        path: 'dashboard',
        element: (
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'properties',
        element: (
          <ProtectedRoute>
            <PropertiesPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'properties/:id',
        element: (
          <ProtectedRoute>
            <PropertyDetailPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'units',
        element: (
          <ProtectedRoute>
            <UnitsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'owners',
        element: (
          <ProtectedRoute>
            <OwnersPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'owners/:id',
        element: (
          <ProtectedRoute>
            <OwnerDetailPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'tenants',
        element: (
          <ProtectedRoute>
            <TenantsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'tenants/:id',
        element: (
          <ProtectedRoute>
            <TenantDetailPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'leases',
        element: (
          <ProtectedRoute>
            <LeasesPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'leases/:id',
        element: (
          <ProtectedRoute>
            <LeaseDetailPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'invoices',
        element: (
          <ProtectedRoute>
            <InvoicesPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'invoices/:id',
        element: (
          <ProtectedRoute>
            <InvoiceDetailPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'payments',
        element: (
          <ProtectedRoute>
            <PaymentsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'maintenance',
        element: (
          <ProtectedRoute>
            <MaintenancePage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'maintenance/:id',
        element: (
          <ProtectedRoute>
            <MaintenanceDetailPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'visitors',
        element: (
          <ProtectedRoute>
            <VisitorsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'reports',
        element: (
          <ProtectedRoute>
            <ReportsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
]);
