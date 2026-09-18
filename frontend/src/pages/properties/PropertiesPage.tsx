import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Building2, MapPin, Eye, Trash2, Edit } from 'lucide-react';
import { useProperties, useCreateProperty, useDeleteProperty, useUpdateProperty } from '@/features/property/property.hooks';
import { Property, CreatePropertyInput, UpdatePropertyInput } from '@/features/property/property.types';
import { useCurrentUser } from '@/features/auth/auth.hooks';
import { Table, Column } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Pagination } from '@/components/ui/Pagination';

export const PropertiesPage: React.FC = () => {
  const { data: user } = useCurrentUser();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data, isLoading, refetch } = useProperties({
    page,
    limit,
    search: search || undefined,
  });

  const createMutation = useCreateProperty();
  const updateMutation = useUpdateProperty();
  const deleteMutation = useDeleteProperty();

  // Create/Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [formData, setFormData] = useState<CreatePropertyInput>({
    name: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'USA',
    description: '',
  });
  const [formError, setFormError] = useState<string | null>(null);

  // Delete Confirmation State
  const [deleteTarget, setDeleteTarget] = useState<Property | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const canManage = user?.role === 'SUPER_ADMIN' || user?.role === 'PROPERTY_ADMIN';
  const canDelete = user?.role === 'SUPER_ADMIN';

  const handleOpenCreate = () => {
    setEditingProperty(null);
    setFormData({
      name: '',
      address: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'USA',
      description: '',
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (prop: Property) => {
    setEditingProperty(prop);
    setFormData({
      name: prop.name,
      address: prop.address,
      city: prop.city,
      state: prop.state || '',
      postalCode: prop.postalCode || '',
      country: prop.country || 'USA',
      description: prop.description || '',
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    try {
      if (editingProperty) {
        await updateMutation.mutateAsync({
          id: editingProperty.id,
          data: formData as UpdatePropertyInput,
        });
      } else {
        await createMutation.mutateAsync(formData);
      }
      setIsModalOpen(false);
      refetch();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setFormError(error.response?.data?.message || 'Failed to save property');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteError(null);

    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
      refetch();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setDeleteError(error.response?.data?.message || 'Failed to delete property');
    }
  };

  const columns: Column<Property>[] = [
    {
      header: 'Property Name',
      render: (prop) => (
        <div>
          <div className="font-semibold text-slate-900 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-indigo-600" />
            <Link to={`/properties/${prop.id}`} className="hover:text-indigo-600 hover:underline">
              {prop.name}
            </Link>
          </div>
          {prop.description && (
            <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{prop.description}</p>
          )}
        </div>
      ),
    },
    {
      header: 'Address',
      render: (prop) => (
        <div className="flex items-center gap-1.5 text-slate-600 text-xs">
          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>
            {prop.address}, {prop.city} {prop.state ? `, ${prop.state}` : ''} {prop.postalCode || ''}
          </span>
        </div>
      ),
    },
    {
      header: 'Buildings',
      render: (prop) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
          {prop._count?.buildings ?? 0} buildings
        </span>
      ),
    },
    {
      header: 'Actions',
      className: 'text-right',
      render: (prop) => (
        <div className="flex items-center justify-end gap-1.5">
          <Link to={`/properties/${prop.id}`}>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="View details">
              <Eye className="w-4 h-4 text-slate-600" />
            </Button>
          </Link>
          {canManage && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => handleOpenEdit(prop)}
              title="Edit property"
            >
              <Edit className="w-4 h-4 text-indigo-600" />
            </Button>
          )}
          {canDelete && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 hover:bg-rose-50 hover:text-rose-600"
              onClick={() => {
                setDeleteTarget(prop);
                setDeleteError(null);
              }}
              title="Delete property"
            >
              <Trash2 className="w-4 h-4 text-rose-500" />
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
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Properties</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage real estate properties, buildings, floors, and individual units.
          </p>
        </div>
        {canManage && (
          <Button onClick={handleOpenCreate} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Property
          </Button>
        )}
      </div>

      {/* Filter / Search Bar */}
      <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex-1 max-w-md">
          <Input
            placeholder="Search properties by name or city..."
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
          data={data?.properties || []}
          isLoading={isLoading}
          emptyMessage="No properties found. Click 'Add Property' to create one."
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

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProperty ? 'Edit Property' : 'Create New Property'}
        description="Enter property location and details below."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="rounded-lg bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
              {formError}
            </div>
          )}

          <Input
            label="Property Name"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g. Grand Horizon Heights"
          />

          <Input
            label="Street Address"
            required
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            placeholder="e.g. 100 Sunset Boulevard"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="City"
              required
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              placeholder="e.g. Los Angeles"
            />
            <Input
              label="State / Province"
              value={formData.state || ''}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              placeholder="e.g. CA"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Postal Code"
              value={formData.postalCode || ''}
              onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
              placeholder="e.g. 90001"
            />
            <Input
              label="Country"
              value={formData.country || 'USA'}
              onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              placeholder="e.g. USA"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">Description</label>
            <textarea
              className="w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              rows={3}
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Optional notes or description about the property..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={createMutation.isPending || updateMutation.isPending}
            >
              {editingProperty ? 'Save Changes' : 'Create Property'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Confirm Property Deletion"
        description={`Are you sure you want to delete ${deleteTarget?.name}?`}
        maxWidth="sm"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600">
            This action cannot be undone. Properties containing active leases cannot be deleted.
          </p>

          {deleteError && (
            <div className="rounded-lg bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
              {deleteError}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleDelete}
              isLoading={deleteMutation.isPending}
            >
              Delete Property
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

