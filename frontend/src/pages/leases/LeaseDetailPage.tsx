import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  FileText,
  Calendar,
  DollarSign,
  User,
  ArrowLeft,
  ChevronRight,
  AlertCircle,
  Ban,
  RefreshCw,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { useLease, useTerminateLease, useRenewLease } from '@/features/lease/lease.hooks';
import { useCurrentUser } from '@/features/auth/auth.hooks';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { LeaseStatus } from '@/types';

export const LeaseDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { data: user } = useCurrentUser();
  const { data: lease, isLoading, refetch } = useLease(id);

  const terminateMutation = useTerminateLease();
  const renewMutation = useRenewLease();

  // Terminate Modal State
  const [isTerminateOpen, setIsTerminateOpen] = useState(false);
  const [moveOutDate, setMoveOutDate] = useState(new Date().toISOString().split('T')[0]);
  const [terminateNotes, setTerminateNotes] = useState('');
  const [terminateError, setTerminateError] = useState<string | null>(null);

  // Renew Modal State
  const [isRenewOpen, setIsRenewOpen] = useState(false);
  const [renewStartDate, setRenewStartDate] = useState('');
  const [renewEndDate, setRenewEndDate] = useState('');
  const [renewRent, setRenewRent] = useState<number>(0);
  const [renewTerms, setRenewTerms] = useState('');
  const [renewError, setRenewError] = useState<string | null>(null);

  const canManage =
    user?.role === 'SUPER_ADMIN' || user?.role === 'PROPERTY_ADMIN' || user?.role === 'MANAGER';

  const handleOpenRenew = () => {
    if (!lease) return;
    const currentEnd = new Date(lease.endDate);
    const nextStart = new Date(currentEnd.getTime() + 24 * 60 * 60 * 1000);
    const nextEnd = new Date(nextStart.getTime() + 365 * 24 * 60 * 60 * 1000);

    setRenewStartDate(nextStart.toISOString().split('T')[0]);
    setRenewEndDate(nextEnd.toISOString().split('T')[0]);
    setRenewRent(Number(lease.monthlyRent));
    setRenewTerms(`Renewal of lease ${lease.id}`);
    setRenewError(null);
    setIsRenewOpen(true);
  };

  const handleTerminateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setTerminateError(null);

    try {
      await terminateMutation.mutateAsync({
        id,
        data: {
          moveOutDate,
          terms: terminateNotes,
        },
      });
      setIsTerminateOpen(false);
      refetch();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setTerminateError(error.response?.data?.message || 'Failed to terminate lease');
    }
  };

  const handleRenewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setRenewError(null);

    try {
      await renewMutation.mutateAsync({
        id,
        data: {
          startDate: renewStartDate,
          endDate: renewEndDate,
          monthlyRent: Number(renewRent),
          terms: renewTerms,
        },
      });
      setIsRenewOpen(false);
      refetch();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setRenewError(error.response?.data?.message || 'Failed to renew lease');
    }
  };

  const getStatusBadge = (status: LeaseStatus) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <Badge variant="success" className="gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Active
          </Badge>
        );
      case 'DRAFT':
        return (
          <Badge variant="neutral" className="gap-1">
            <Clock className="w-3.5 h-3.5" /> Draft
          </Badge>
        );
      case 'EXPIRED':
        return (
          <Badge variant="warning" className="gap-1">
            <Clock className="w-3.5 h-3.5" /> Expired
          </Badge>
        );
      case 'TERMINATED':
        return (
          <Badge variant="danger" className="gap-1">
            <Ban className="w-3.5 h-3.5" /> Terminated
          </Badge>
        );
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="py-24 text-center text-slate-500">
        <FileText className="w-8 h-8 animate-bounce mx-auto text-indigo-600 mb-2" />
        <p>Loading lease contract details...</p>
      </div>
    );
  }

  if (!lease) {
    return (
      <div className="py-16 text-center">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-2" />
        <h2 className="text-lg font-bold text-slate-800">Lease Not Found</h2>
        <Link to="/leases" className="inline-block mt-4">
          <Button variant="outline" size="sm">
            Back to Leases
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Navigation Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Link to="/leases" className="flex items-center gap-1 hover:text-indigo-600">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Leases
        </Link>
        <ChevronRight className="w-3 h-3 text-slate-400" />
        <span className="font-semibold text-slate-700">Lease #{lease.id.slice(0, 8)}</span>
      </div>

      {/* Header Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900">
                  Lease for Unit {lease.unit?.unitNumber}
                </h1>
                {getStatusBadge(lease.status)}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {lease.unit?.floor?.building?.property?.name} • {lease.unit?.floor?.building?.name}
              </p>
            </div>
          </div>
        </div>

        {canManage && lease.status === 'ACTIVE' && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenRenew}
              className="flex items-center gap-1.5"
            >
              <RefreshCw className="w-4 h-4" /> Renew Lease
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                setTerminateError(null);
                setIsTerminateOpen(true);
              }}
              className="flex items-center gap-1.5"
            >
              <Ban className="w-4 h-4" /> Terminate Lease
            </Button>
          </div>
        )}
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Tenant Information Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <User className="w-4 h-4 text-indigo-600" /> Tenant Information
          </h2>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Full Name</span>
              <span className="font-semibold text-slate-800">
                {lease.tenant?.user.firstName} {lease.tenant?.user.lastName}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Email Address</span>
              <span className="font-semibold text-slate-800">{lease.tenant?.user.email}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Phone</span>
              <span className="font-semibold text-slate-800">{lease.tenant?.user.phone || '—'}</span>
            </div>
            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <Link
                to={`/tenants/${lease.tenantProfileId}`}
                className="text-xs font-semibold text-indigo-600 hover:underline"
              >
                View Tenant Profile →
              </Link>
            </div>
          </div>
        </div>

        {/* Financial Terms Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-600" /> Financial Details
          </h2>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Monthly Rent</span>
              <span className="font-bold text-slate-900 text-sm">
                ${Number(lease.monthlyRent).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Security Deposit</span>
              <span className="font-semibold text-slate-800">
                ${Number(lease.securityDeposit).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Unit Status</span>
              <span className="font-semibold text-slate-800">{lease.unit?.status}</span>
            </div>
          </div>
        </div>

        {/* Term & Dates Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-600" /> Term & Dates
          </h2>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Contract Start</span>
              <span className="font-semibold text-slate-800">
                {new Date(lease.startDate).toLocaleDateString()}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Contract End</span>
              <span className="font-semibold text-slate-800">
                {new Date(lease.endDate).toLocaleDateString()}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Move-In Date</span>
              <span>{lease.moveInDate ? new Date(lease.moveInDate).toLocaleDateString() : '—'}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Move-Out Date</span>
              <span>{lease.moveOutDate ? new Date(lease.moveOutDate).toLocaleDateString() : '—'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Terms and Conditions */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-3">
        <h2 className="text-sm font-bold text-slate-900">Contract Terms & Notes</h2>
        <div className="bg-slate-50 rounded-lg p-4 text-xs text-slate-700 whitespace-pre-line border border-slate-100 font-mono">
          {lease.terms || 'Standard residential tenancy agreement. No specific riders recorded.'}
        </div>
      </div>

      {/* Terminate Modal */}
      <Modal
        isOpen={isTerminateOpen}
        onClose={() => setIsTerminateOpen(false)}
        title="Terminate Lease Agreement"
        description="Terminating the lease will immediately set move-out date and return unit to Vacant."
        maxWidth="sm"
      >
        <form onSubmit={handleTerminateSubmit} className="space-y-4">
          {terminateError && (
            <div className="rounded-lg bg-rose-50 p-2.5 text-xs text-rose-700 border border-rose-200">
              {terminateError}
            </div>
          )}

          <Input
            label="Move-Out Date"
            type="date"
            required
            value={moveOutDate}
            onChange={(e) => setMoveOutDate(e.target.value)}
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">Termination Notes</label>
            <textarea
              className="w-full rounded-lg border border-slate-300 p-2 text-xs focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
              rows={3}
              value={terminateNotes}
              onChange={(e) => setTerminateNotes(e.target.value)}
              placeholder="e.g. Mutual early termination agreement, keys returned."
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsTerminateOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="danger"
              size="sm"
              isLoading={terminateMutation.isPending}
            >
              Confirm Termination
            </Button>
          </div>
        </form>
      </Modal>

      {/* Renew Modal */}
      <Modal
        isOpen={isRenewOpen}
        onClose={() => setIsRenewOpen(false)}
        title="Renew Lease Agreement"
        description="Creates a consecutive active lease extension."
        maxWidth="sm"
      >
        <form onSubmit={handleRenewSubmit} className="space-y-4">
          {renewError && (
            <div className="rounded-lg bg-rose-50 p-2.5 text-xs text-rose-700 border border-rose-200">
              {renewError}
            </div>
          )}

          <Input
            label="Renewal Start Date"
            type="date"
            required
            value={renewStartDate}
            onChange={(e) => setRenewStartDate(e.target.value)}
          />

          <Input
            label="Renewal End Date"
            type="date"
            required
            value={renewEndDate}
            onChange={(e) => setRenewEndDate(e.target.value)}
          />

          <Input
            label="New Monthly Rent ($)"
            type="number"
            required
            value={renewRent}
            onChange={(e) => setRenewRent(parseFloat(e.target.value))}
          />

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsRenewOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={renewMutation.isPending}>
              Create Renewal Contract
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
