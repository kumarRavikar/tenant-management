import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Eye, Building, Phone, Mail } from 'lucide-react';
import { useOwners } from '@/features/owner/owner.hooks';
import { OwnerProfile } from '@/features/owner/owner.types';
import { Table, Column } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Pagination } from '@/components/ui/Pagination';

export const OwnersPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data, isLoading } = useOwners({
    page,
    limit,
    search: search || undefined,
  });

  const columns: Column<OwnerProfile>[] = [
    {
      header: 'Owner Name',
      render: (owner) => (
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-xs">
            {owner.user.firstName?.[0]}
            {owner.user.lastName?.[0]}
          </div>
          <div>
            <Link
              to={`/owners/${owner.id}`}
              className="font-semibold text-slate-900 hover:text-indigo-600"
            >
              {owner.user.firstName} {owner.user.lastName}
            </Link>
            <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
              <span className="flex items-center gap-1">
                <Mail className="w-3 h-3 text-slate-400" />
                {owner.user.email}
              </span>
              {owner.user.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="w-3 h-3 text-slate-400" />
                  {owner.user.phone}
                </span>
              )}
            </div>
          </div>
        </div>
      ),
    },
    {
      header: 'Tax ID / Bank',
      render: (owner) => (
        <div className="text-xs text-slate-600">
          <div>{owner.taxId ? `Tax ID: ${owner.taxId}` : '—'}</div>
          {owner.bankName && <div className="text-slate-400">{owner.bankName}</div>}
        </div>
      ),
    },
    {
      header: 'Owned Units',
      render: (owner) => (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
          <Building className="w-3 h-3" />
          {owner.ownedUnits?.length ?? 0} units
        </span>
      ),
    },
    {
      header: 'Actions',
      className: 'text-right',
      render: (owner) => (
        <div className="flex items-center justify-end gap-2">
          <Link to={`/owners/${owner.id}`}>
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
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Property Owners</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage unit owners, ownership percentages, financial details, and assigned properties.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-4">
        <div className="flex-1 max-w-md">
          <Input
            placeholder="Search owners by name or email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200">
        <Table
          columns={columns}
          data={data?.owners || []}
          isLoading={isLoading}
          emptyMessage="No owners found."
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
