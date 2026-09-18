import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Wrench,
  Plus,
  Eye,
  AlertCircle,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Building,
  User,
  Paperclip,
  MessageSquare,
} from 'lucide-react';
import { useMaintenanceTickets, useCreateTicket } from '@/features/maintenance/maintenance.hooks';
import {
  MaintenanceTicket,
  MaintenancePriority,
  MaintenanceStatus,
  CreateTicketInput,
} from '@/features/maintenance/maintenance.types';
import { Table, Column } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Pagination } from '@/components/ui/Pagination';

export const MaintenancePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const unitIdParam = searchParams.get('unitId');

  const [statusFilter, setStatusFilter] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data, isLoading, refetch } = useMaintenanceTickets({
    page,
    limit,
    unitId: unitIdParam || undefined,
    status: (statusFilter as MaintenanceStatus) || undefined,
    priority: (priorityFilter as MaintenancePriority) || undefined,
  });

  const createTicketMutation = useCreateTicket();

  // Create Ticket Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<CreateTicketInput>({
    unitId: unitIdParam || '',
    title: '',
    description: '',
    priority: 'MEDIUM',
  });
  const [formError, setFormError] = useState<string | null>(null);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    try {
      await createTicketMutation.mutateAsync(formData);
      setIsModalOpen(false);
      setFormData({
        unitId: unitIdParam || '',
        title: '',
        description: '',
        priority: 'MEDIUM',
      });
      refetch();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setFormError(error.response?.data?.message || 'Failed to submit maintenance request');
    }
  };

  const getPriorityBadge = (priority: MaintenancePriority) => {
    switch (priority) {
      case 'URGENT':
        return (
          <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
            <Flame className="w-3 h-3 text-rose-600" /> URGENT
          </span>
        );
      case 'HIGH':
        return (
          <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <AlertTriangle className="w-3 h-3 text-amber-600" /> HIGH
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
            MEDIUM
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
            LOW
          </span>
        );
    }
  };

  const getStatusBadge = (status: MaintenanceStatus) => {
    switch (status) {
      case 'OPEN':
        return (
          <Badge variant="danger" className="gap-1">
            <AlertCircle className="w-3 h-3" /> Open
          </Badge>
        );
      case 'ASSIGNED':
        return (
          <Badge variant="warning" className="gap-1">
            <Clock className="w-3 h-3" /> Assigned
          </Badge>
        );
      case 'IN_PROGRESS':
        return (
          <Badge variant="info" className="gap-1">
            <Wrench className="w-3 h-3" /> In Progress
          </Badge>
        );
      case 'RESOLVED':
      case 'CLOSED':
        return (
          <Badge variant="success" className="gap-1">
            <CheckCircle2 className="w-3 h-3" /> {status}
          </Badge>
        );
      default:
        return (
          <Badge variant="neutral" className="gap-1">
            {status}
          </Badge>
        );
    }
  };

  const tickets = data?.tickets || [];

  // Metrics
  const openCount = tickets.filter((t) => t.status === 'OPEN').length;
  const inProgressCount = tickets.filter(
    (t) => t.status === 'IN_PROGRESS' || t.status === 'ASSIGNED'
  ).length;
  const resolvedCount = tickets.filter(
    (t) => t.status === 'RESOLVED' || t.status === 'CLOSED'
  ).length;
  const urgentCount = tickets.filter((t) => t.priority === 'URGENT').length;

  const columns: Column<MaintenanceTicket>[] = [
    {
      header: 'Ticket & Unit',
      render: (row) => (
        <div>
          <div className="font-semibold text-slate-900">{row.title}</div>
          <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
            <Building className="w-3.5 h-3.5" />
            Unit {row.unit?.unitNumber || '—'}
            {row.unit?.floor?.building?.name && ` (${row.unit.floor.building.name})`}
          </div>
        </div>
      ),
    },
    {
      header: 'Priority',
      render: (row) => getPriorityBadge(row.priority),
    },
    {
      header: 'Status',
      render: (row) => getStatusBadge(row.status),
    },
    {
      header: 'Reported By',
      render: (row) => (
        <div className="text-xs text-slate-700 flex items-center gap-1.5">
          <User className="w-3.5 h-3.5 text-slate-400" />
          <span>
            {row.createdBy?.firstName} {row.createdBy?.lastName}
          </span>
        </div>
      ),
    },
    {
      header: 'Assigned To',
      render: (row) => (
        <div className="text-xs text-slate-700">
          {row.assignedTo ? (
            <span className="font-medium text-indigo-600">
              {row.assignedTo.firstName} {row.assignedTo.lastName}
            </span>
          ) : (
            <span className="text-slate-400 italic">Unassigned</span>
          )}
        </div>
      ),
    },
    {
      header: 'Activity',
      render: (row) => (
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <MessageSquare className="w-3.5 h-3.5" />
            {row._count?.comments ?? 0}
          </span>
          <span className="flex items-center gap-1">
            <Paperclip className="w-3.5 h-3.5" />
            {row._count?.attachments ?? 0}
          </span>
        </div>
      ),
    },
    {
      header: 'Actions',
      render: (row) => (
        <Link to={`/maintenance/${row.id}`}>
          <Button variant="outline" size="sm" className="h-8 px-2.5">
            <Eye className="w-3.5 h-3.5 mr-1" />
            View
          </Button>
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Maintenance Tickets
          </h1>
          <p className="text-sm text-slate-500">
            Submit service requests, assign technical staff, and monitor resolution timelines.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => {
            setFormError(null);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Request
        </Button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-lg">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Open Tickets</p>
            <p className="text-xl font-bold text-rose-600">{openCount}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <Wrench className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">In Progress</p>
            <p className="text-xl font-bold text-blue-600">{inProgressCount}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Resolved</p>
            <p className="text-xl font-bold text-emerald-600">{resolvedCount}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
            <Flame className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Urgent</p>
            <p className="text-xl font-bold text-amber-600">{urgentCount}</p>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 bg-white p-4 rounded-xl border border-slate-200">
        <div className="w-48">
          <Select
            label=""
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            options={[
              { label: 'All Statuses', value: '' },
              { label: 'Open', value: 'OPEN' },
              { label: 'Assigned', value: 'ASSIGNED' },
              { label: 'In Progress', value: 'IN_PROGRESS' },
              { label: 'On Hold', value: 'ON_HOLD' },
              { label: 'Resolved', value: 'RESOLVED' },
              { label: 'Closed', value: 'CLOSED' },
              { label: 'Cancelled', value: 'CANCELLED' },
            ]}
          />
        </div>

        <div className="w-48">
          <Select
            label=""
            value={priorityFilter}
            onChange={(e) => {
              setPriorityFilter(e.target.value);
              setPage(1);
            }}
            options={[
              { label: 'All Priorities', value: '' },
              { label: 'Urgent', value: 'URGENT' },
              { label: 'High', value: 'HIGH' },
              { label: 'Medium', value: 'MEDIUM' },
              { label: 'Low', value: 'LOW' },
            ]}
          />
        </div>

        {(statusFilter || priorityFilter) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setStatusFilter('');
              setPriorityFilter('');
              setPage(1);
            }}
          >
            Clear Filters
          </Button>
        )}
      </div>

      {/* Tickets Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <Table
          columns={columns}
          data={tickets}
          isLoading={isLoading}
          emptyMessage="No maintenance tickets found."
        />

        {data?.meta && data.meta.totalPages > 1 && (
          <div className="p-4 border-t border-slate-200">
            <Pagination
              currentPage={page}
              totalPages={data.meta.totalPages}
              totalItems={data.meta.total}
              limit={limit}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>

      {/* Create Ticket Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Maintenance Request"
        description="Submit a service request for a unit issue"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm">
              {formError}
            </div>
          )}

          <Input
            label="Unit ID"
            required
            value={formData.unitId}
            onChange={(e) => setFormData({ ...formData, unitId: e.target.value })}
            placeholder="e.g. 00000000-0000-0000-0000-000000000000"
          />

          <Input
            label="Issue Title"
            required
            placeholder="e.g. Water leak under kitchen sink"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          />

          <div>
            <label
              htmlFor="maintenance-description"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Description <span className="text-rose-500">*</span>
            </label>
            <textarea
              id="maintenance-description"
              required
              rows={4}
              placeholder="Describe the issue in detail..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <Select
            label="Priority Level"
            value={formData.priority || 'MEDIUM'}
            onChange={(e) =>
              setFormData({ ...formData, priority: e.target.value as MaintenancePriority })
            }
            options={[
              { label: 'Low - General Inquiry / Minor Issue', value: 'LOW' },
              { label: 'Medium - Standard Issue', value: 'MEDIUM' },
              { label: 'High - Disruptive Issue', value: 'HIGH' },
              { label: 'Urgent - Safety / Structural Hazard', value: 'URGENT' },
            ]}
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={createTicketMutation.isPending || !formData.title || !formData.description}
            >
              {createTicketMutation.isPending ? 'Submitting...' : 'Submit Request'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
