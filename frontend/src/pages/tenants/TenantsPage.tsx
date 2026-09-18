import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Eye, Mail, Phone, Briefcase, CheckCircle, Clock, XCircle } from 'lucide-react';
import { useTenants } from '@/features/tenant/tenant.hooks';
import { TenantProfile } from '@/features/tenant/tenant.types';
import { Table, Column } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Pagination } from '@/components/ui/Pagination';
import { TenantOnboardingStatus } from '@/types';

export const TenantsPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data, isLoading } = useTenants({
    page,
    limit,
    search: search || undefined,
    onboardingStatus: (statusFilter as TenantOnboardingStatus) || undefined,
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'VERIFIED':
        return (
          <Badge variant="success" className="gap-1">
            <CheckCircle className="w-3 h-3" /> Verified
          </Badge>
        );
      case 'REJECTED':
        return (
          <Badge variant="danger" className="gap-1">
            <XCircle className="w-3 h-3" /> Rejected
          </Badge>
        );
      default:
        return (
          <Badge variant="warning" className="gap-1">
            <Clock className="w-3 h-3" /> Pending Review
          </Badge>
        );
    }
  };

  const columns: Column<TenantProfile>[] = [
    {
      header: 'Tenant Name',
      render: (tenant) => (
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs">
            {tenant.user.firstName?.[0]}
            {tenant.user.lastName?.[0]}
          </div>
          <div>
            <Link
              to={`/tenants/${tenant.id}`}
              className="font-semibold text-slate-900 hover:text-indigo-600"
            >
              {tenant.user.firstName} {tenant.user.lastName}
            </Link>
            <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
              <span className="flex items-center gap-1">
                <Mail className="w-3 h-3 text-slate-400" />
                {tenant.user.email}
              </span>
              {tenant.user.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="w-3 h-3 text-slate-400" />
                  {tenant.user.phone}
                </span>
              )}
            </div>
          </div>
        </div>
      ),
    },
    {
      header: 'Employment / Income',
      render: (tenant) => (
        <div className="text-xs text-slate-600">
          <div className="flex items-center gap-1 font-medium text-slate-800">
            <Briefcase className="w-3 h-3 text-slate-400" />
            {tenant.employerName || 'Not specified'}
          </div>
          <div className="text-slate-500">
            {tenant.employmentStatus || 'Unspecified'}
            {tenant.annualIncome ? ` • $${Number(tenant.annualIncome).toLocaleString()}/yr` : ''}
          </div>
        </div>
      ),
    },
    {
      header: 'Onboarding Status',
      render: (tenant) => getStatusBadge(tenant.onboardingStatus),
    },
    {
      header: 'Active Leases',
      render: (tenant) => (
        <span className="text-xs font-semibold text-slate-700">
          {tenant.leases?.length ?? 0} Leases
        </span>
      ),
    },
    {
      header: 'Actions',
      className: 'text-right',
      render: (tenant) => (
        <div className="flex items-center justify-end gap-2">
          <Link to={`/tenants/${tenant.id}`}>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="View Profile">
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
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Tenants Directory</h1>
          <p className="text-sm text-slate-500 mt-1">
            Review onboarding verification, background information, and lease contracts.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px] max-w-sm">
          <Input
            placeholder="Search by tenant name or email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>

        <div className="w-44">
          <Select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            options={[
              { label: 'All Onboarding', value: '' },
              { label: 'Pending Review', value: 'PENDING' },
              { label: 'Verified', value: 'VERIFIED' },
              { label: 'Rejected', value: 'REJECTED' },
            ]}
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200">
        <Table
          columns={columns}
          data={data?.tenants || []}
          isLoading={isLoading}
          emptyMessage="No tenants found."
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
    </div>
  );
};
