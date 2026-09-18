import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { DoorOpen, Search, Edit, CheckCircle2, Home, Wrench, Clock } from 'lucide-react';
import { useUnits, useUpdateUnit } from '@/features/unit/unit.hooks';
import { Unit, UpdateUnitInput } from '@/features/unit/unit.types';
import { useCurrentUser } from '@/features/auth/auth.hooks';
import { Table, Column } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Pagination } from '@/components/ui/Pagination';
import { UnitStatus } from '@/types';

export const UnitsPage: React.FC = () => {
  const { data: user } = useCurrentUser();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [minBedrooms, setMinBedrooms] = useState<string>('');
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data, isLoading, refetch } = useUnits({
    page,
    limit,
    search: search || undefined,
    status: (statusFilter as UnitStatus) || undefined,
    minBedrooms: minBedrooms ? parseInt(minBedrooms, 10) : undefined,
  });

  const updateUnitMutation = useUpdateUnit();

  // Edit Unit Modal
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [editStatus, setEditStatus] = useState<UnitStatus>('VACANT');
  const [editRent, setEditRent] = useState<number>(0);
  const [editMaintenance, setEditMaintenance] = useState<number>(0);
  const [modalError, setModalError] = useState<string | null>(null);

  const canManage = user?.role === 'SUPER_ADMIN' || user?.role === 'PROPERTY_ADMIN' || user?.role === 'MANAGER';

  const handleOpenEdit = (unit: Unit) => {
    setEditingUnit(unit);
    setEditStatus(unit.status);
    setEditRent(Number(unit.baseRent));
    setEditMaintenance(Number(unit.maintenanceCharge));
    setModalError(null);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUnit) return;
    setModalError(null);

    try {
      const updateData: UpdateUnitInput = {
        status: editStatus,
        baseRent: editRent,
        maintenanceCharge: editMaintenance,
      };
      await updateUnitMutation.mutateAsync({
        id: editingUnit.id,
        data: updateData,
      });
      setEditingUnit(null);
      refetch();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setModalError(error.response?.data?.message || 'Failed to update unit');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'VACANT':
        return (
          <Badge variant="success" className="gap-1">
            <CheckCircle2 className="w-3 h-3" /> Vacant
          </Badge>
        );
      case 'OCCUPIED':
        return (
          <Badge variant="info" className="gap-1">
            <Home className="w-3 h-3" /> Occupied
          </Badge>
        );
      case 'UNDER_MAINTENANCE':
        return (
          <Badge variant="warning" className="gap-1">
            <Wrench className="w-3 h-3" /> Maintenance
          </Badge>
        );
      case 'RESERVED':
        return (
          <Badge variant="neutral" className="gap-1">
            <Clock className="w-3 h-3" /> Reserved
          </Badge>
        );
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  const columns: Column<Unit>[] = [
    {
      header: 'Unit',
      render: (unit) => (
        <div className="flex items-center gap-2 font-semibold text-slate-900">
          <DoorOpen className="w-4 h-4 text-indigo-600" />
          <span>Unit {unit.unitNumber}</span>
          {unit.unitType && (
            <span className="text-xs font-normal text-slate-500">({unit.unitType})</span>
          )}
        </div>
      ),
    },
    {
      header: 'Property & Location',
      render: (unit) => (
        <div className="text-xs">
          <div className="font-semibold text-slate-800">
            {unit.floor?.building?.property?.name || 'Property'}
          </div>
          <div className="text-slate-500">
            {unit.floor?.building?.name} • Floor {unit.floor?.floorNumber}
          </div>
        </div>
      ),
    },
    {
      header: 'Specs',
      render: (unit) => (
        <div className="text-xs text-slate-600">
          <span>{unit.bedrooms} Bed, {unit.bathrooms} Bath</span>
          {unit.area && <span className="text-slate-400"> • {unit.area} sq ft</span>}
        </div>
      ),
    },
    {
      header: 'Monthly Rent',
      render: (unit) => (
        <div>
          <span className="font-bold text-slate-900">${Number(unit.baseRent).toLocaleString()}</span>
          {Number(unit.maintenanceCharge) > 0 && (
            <span className="text-xs text-slate-400 ml-1">
              (+${Number(unit.maintenanceCharge)} fee)
            </span>
          )}
        </div>
      ),
    },
    {
      header: 'Status',
      render: (unit) => getStatusBadge(unit.status),
    },
    {
      header: 'Actions',
      className: 'text-right',
      render: (unit) => (
        <div className="flex items-center justify-end gap-2">
          <Link to={`/leases?unitId=${unit.id}`}>
            <Button variant="outline" size="sm" className="h-7 text-xs">
              Leases
            </Button>
          </Link>
          {canManage && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => handleOpenEdit(unit)}
              title="Edit Unit"
            >
              <Edit className="w-3.5 h-3.5 text-indigo-600" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Units Catalog</h1>
          <p className="text-sm text-slate-500 mt-1">
            Browse and filter apartment and office units across all managed properties.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px] max-w-sm">
          <Input
            placeholder="Search unit number..."
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
              { label: 'All Statuses', value: '' },
              { label: 'Vacant', value: 'VACANT' },
              { label: 'Occupied', value: 'OCCUPIED' },
              { label: 'Maintenance', value: 'UNDER_MAINTENANCE' },
              { label: 'Reserved', value: 'RESERVED' },
            ]}
          />
        </div>

        <div className="w-36">
          <Select
            value={minBedrooms}
            onChange={(e) => {
              setMinBedrooms(e.target.value);
              setPage(1);
            }}
            options={[
              { label: 'Any Bedrooms', value: '' },
              { label: '1+ Bedrooms', value: '1' },
              { label: '2+ Bedrooms', value: '2' },
              { label: '3+ Bedrooms', value: '3' },
            ]}
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200">
        <Table
          columns={columns}
          data={data?.units || []}
          isLoading={isLoading}
          emptyMessage="No units found matching criteria."
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

      {/* Edit Unit Modal */}
      <Modal
        isOpen={Boolean(editingUnit)}
        onClose={() => setEditingUnit(null)}
        title={`Edit Unit ${editingUnit?.unitNumber}`}
        description="Update unit status and rental pricing."
        maxWidth="sm"
      >
        <form onSubmit={handleSaveEdit} className="space-y-4">
          {modalError && (
            <div className="rounded-lg bg-rose-50 p-2.5 text-xs text-rose-700 border border-rose-200">
              {modalError}
            </div>
          )}

          <Select
            label="Occupancy Status"
            value={editStatus}
            onChange={(e) => setEditStatus(e.target.value as UnitStatus)}
            options={[
              { label: 'Vacant', value: 'VACANT' },
              { label: 'Occupied', value: 'OCCUPIED' },
              { label: 'Under Maintenance', value: 'UNDER_MAINTENANCE' },
              { label: 'Reserved', value: 'RESERVED' },
            ]}
          />

          <Input
            label="Base Monthly Rent ($)"
            type="number"
            required
            value={editRent}
            onChange={(e) => setEditRent(parseFloat(e.target.value))}
          />

          <Input
            label="Maintenance Charge ($)"
            type="number"
            value={editMaintenance}
            onChange={(e) => setEditMaintenance(parseFloat(e.target.value))}
          />

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setEditingUnit(null)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={updateUnitMutation.isPending}>
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
