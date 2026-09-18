import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Plus,
  Eye,
  Calendar,
  CheckCircle2,
  Clock,
  Ban,
  User,
  DoorOpen,
} from 'lucide-react';
import { useLeases, useCreateLease } from '@/features/lease/lease.hooks';
import { Lease, CreateLeaseInput } from '@/features/lease/lease.types';
import { useCurrentUser } from '@/features/auth/auth.hooks';
import { Table, Column } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Pagination } from '@/components/ui/Pagination';
import { LeaseStatus } from '@/types';

export const LeasesPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const unitIdParam = searchParams.get('unitId');

  const { data: user } = useCurrentUser();
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data, isLoading, refetch } = useLeases({
    page,
    limit,
    unitId: unitIdParam || undefined,
    status: (statusFilter as LeaseStatus) || undefined,
  });

  const createLeaseMutation = useCreateLease();

  // Create Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<CreateLeaseInput>({
    unitId: unitIdParam || '',
    tenantProfileId: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    monthlyRent: 2000,
    securityDeposit: 2000,
    status: 'ACTIVE' as LeaseStatus,
    terms: 'Standard residential lease agreement.',
  });
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (unitIdParam) {
      setFormData((prev) => ({ ...prev, unitId: unitIdParam }));
    }
  }, [unitIdParam]);

  const canCreate =
    user?.role === 'SUPER_ADMIN' || user?.role === 'PROPERTY_ADMIN' || user?.role === 'MANAGER';

  const handleOpenCreate = () => {
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    try {
      await createLeaseMutation.mutateAsync({
        ...formData,
        monthlyRent: Number(formData.monthlyRent),
        securityDeposit: Number(formData.securityDeposit),
      });
      setIsModalOpen(false);
      refetch();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setFormError(
        error.response?.data?.message || 'Failed to create lease. Check for overlapping dates.'
      );
    }
  };

  const getStatusBadge = (status: LeaseStatus) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <Badge variant="success" className="gap-1">
            <CheckCircle2 className="w-3 h-3" /> Active
          </Badge>
        );
      case 'DRAFT':
        return (
          <Badge variant="neutral" className="gap-1">
            <Clock className="w-3 h-3" /> Draft
          </Badge>
        );
      case 'EXPIRED':
        return (
          <Badge variant="warning" className="gap-1">
            <Clock className="w-3 h-3" /> Expired
          </Badge>
        );
      case 'TERMINATED':
        return (
          <Badge variant="danger" className="gap-1">
            <Ban className="w-3 h-3" /> Terminated
          </Badge>
        );
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  const columns: Column<Lease>[] = [
    {
      header: 'Unit & Property',
      render: (lease) => (
        <div>
          <div className="flex items-center gap-1.5 font-bold text-slate-900 text-sm">
            <DoorOpen className="w-4 h-4 text-indigo-600" />
            <span>Unit {lease.unit?.unitNumber}</span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {lease.unit?.floor?.building?.property?.name || 'Property'} •{' '}
            {lease.unit?.floor?.building?.name}
          </p>
        </div>
      ),
    },
    {
      header: 'Tenant',
      render: (lease) => (
        <div>
          <div className="font-semibold text-slate-800 text-xs flex items-center gap-1">
            <User className="w-3 h-3 text-slate-400" />
            {lease.tenant?.user.firstName} {lease.tenant?.user.lastName}
          </div>
          <span className="text-xs text-slate-400">{lease.tenant?.user.email}</span>
        </div>
      ),
    },
    {
      header: 'Term Duration',
      render: (lease) => (
        <div className="text-xs text-slate-600 flex items-center gap-1">
          <Calendar className="w-3 h-3 text-slate-400" />
          <span>
            {new Date(lease.startDate).toLocaleDateString()} -{' '}
            {new Date(lease.endDate).toLocaleDateString()}
          </span>
        </div>
      ),
    },
    {
      header: 'Rent / Deposit',
      render: (lease) => (
        <div className="text-xs">
          <div className="font-bold text-slate-900">
            ${Number(lease.monthlyRent).toLocaleString()}/mo
          </div>
          <span className="text-slate-400">Deposit: ${Number(lease.securityDeposit).toLocaleString()}</span>
        </div>
      ),
    },
    {
      header: 'Status',
      render: (lease) => getStatusBadge(lease.status),
    },
    {
      header: 'Actions',
      className: 'text-right',
      render: (lease) => (
        <div className="flex items-center justify-end gap-2">
          <Link to={`/leases/${lease.id}`}>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="View details">
              <Eye className="w-4 h-4 text-slate-600" />
            </Button>
          </Link>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Lease Management</h1>
          <p className="text-sm text-slate-500 mt-1">
            Track active tenancies, handle renewal schedules, termination, and prevent conflicting dates.
          </p>
        </div>
        {canCreate && (
          <Button onClick={handleOpenCreate} className="flex items-center gap-2">
            <Plus className="w-4 h-4" /> Create Lease
          </Button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-3">
        <div className="w-48">
          <Select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            options={[
              { label: 'All Statuses', value: '' },
              { label: 'Active', value: 'ACTIVE' },
              { label: 'Draft', value: 'DRAFT' },
              { label: 'Expired', value: 'EXPIRED' },
              { label: 'Terminated', value: 'TERMINATED' },
            ]}
          />
        </div>

        {unitIdParam && (
          <div className="flex items-center gap-2 bg-indigo-50 text-indigo-700 text-xs px-3 py-1.5 rounded-lg border border-indigo-200">
            <span>Filtered by Unit ID: {unitIdParam.slice(0, 8)}...</span>
            <Link to="/leases" className="font-bold ml-1 hover:underline">
              Clear
            </Link>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200">
        <Table
          columns={columns}
          data={data?.leases || []}
          isLoading={isLoading}
          emptyMessage="No leases found matching your filters."
        />
        {data?.meta && (
          <Pagination
            currentPage={data.meta.page}
            totalPages={data.meta.totalPages}
            totalItems={data.meta.total}
            limit={data.meta.limit}
            onPageChange={(p) => setPage(p)}
          />
        )}
      </div>

      {/* Create Lease Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Lease"
        description="Establish a rental contract for a tenant and unit. Overlapping active dates are strictly prevented."
        maxWidth="lg"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          {formError && (
            <div className="rounded-lg bg-rose-50 p-2.5 text-xs text-rose-700 border border-rose-200">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Unit ID (UUID)"
              required
              value={formData.unitId}
              onChange={(e) => setFormData({ ...formData, unitId: e.target.value })}
              placeholder="e.g. Unit UUID"
            />
            <Input
              label="Tenant Profile ID (UUID)"
              required
              value={formData.tenantProfileId}
              onChange={(e) => setFormData({ ...formData, tenantProfileId: e.target.value })}
              placeholder="e.g. Tenant Profile UUID"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Start Date"
              type="date"
              required
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            />
            <Input
              label="End Date"
              type="date"
              required
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Monthly Rent ($)"
              type="number"
              required
              value={formData.monthlyRent}
              onChange={(e) => setFormData({ ...formData, monthlyRent: parseFloat(e.target.value) })}
            />
            <Input
              label="Security Deposit ($)"
              type="number"
              required
              value={formData.securityDeposit}
              onChange={(e) =>
                setFormData({ ...formData, securityDeposit: parseFloat(e.target.value) })
              }
            />
            <Select
              label="Initial Status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as LeaseStatus })}
              options={[
                { label: 'Active', value: 'ACTIVE' },
                { label: 'Draft', value: 'DRAFT' },
              ]}
            />
          </div>

          <Input
            label="Move-In Date (Optional)"
            type="date"
            value={formData.moveInDate || ''}
            onChange={(e) => setFormData({ ...formData, moveInDate: e.target.value })}
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">Lease Terms & Conditions</label>
            <textarea
              className="w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              rows={3}
              value={formData.terms || ''}
              onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
              placeholder="Specify clauses, utilities policies, restrictions..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={createLeaseMutation.isPending}>
              Create Lease Contract
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
