import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  UserCheck,
  Mail,
  Phone,
  Building,
  CreditCard,
  Plus,
  ArrowLeft,
  ChevronRight,
  DoorOpen,
  AlertCircle,
} from 'lucide-react';
import { useOwner, useAssignUnitToOwner } from '@/features/owner/owner.hooks';
import { useCurrentUser } from '@/features/auth/auth.hooks';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';

export const OwnerDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { data: user } = useCurrentUser();
  const { data: owner, isLoading, refetch } = useOwner(id);

  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [unitId, setUnitId] = useState('');
  const [percentage, setPercentage] = useState<number>(100);
  const [assignError, setAssignError] = useState<string | null>(null);

  const assignUnitMutation = useAssignUnitToOwner();

  const canManage = user?.role === 'SUPER_ADMIN' || user?.role === 'PROPERTY_ADMIN';

  const handleAssignUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !unitId) return;
    setAssignError(null);

    try {
      await assignUnitMutation.mutateAsync({
        ownerId: id,
        data: {
          unitId,
          ownershipPercentage: Number(percentage),
        },
      });
      setIsAssignModalOpen(false);
      setUnitId('');
      refetch();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setAssignError(error.response?.data?.message || 'Failed to assign unit to owner');
    }
  };

  if (isLoading) {
    return (
      <div className="py-24 text-center text-slate-500">
        <UserCheck className="w-8 h-8 animate-bounce mx-auto text-indigo-600 mb-2" />
        <p>Loading owner profile...</p>
      </div>
    );
  }

  if (!owner) {
    return (
      <div className="py-16 text-center">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-2" />
        <h2 className="text-lg font-bold text-slate-800">Owner Not Found</h2>
        <Link to="/owners" className="inline-block mt-4">
          <Button variant="outline" size="sm">
            Back to Owners
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Navigation Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Link to="/owners" className="flex items-center gap-1 hover:text-indigo-600">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Owners
        </Link>
        <ChevronRight className="w-3 h-3 text-slate-400" />
        <span className="font-semibold text-slate-700">
          {owner.user.firstName} {owner.user.lastName}
        </span>
      </div>

      {/* Owner Header Info Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xl">
            {owner.user.firstName?.[0]}
            {owner.user.lastName?.[0]}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {owner.user.firstName} {owner.user.lastName}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-1">
              <span className="flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-slate-400" /> {owner.user.email}
              </span>
              {owner.user.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-slate-400" /> {owner.user.phone}
                </span>
              )}
            </div>
          </div>
        </div>

        {canManage && (
          <Button onClick={() => setIsAssignModalOpen(true)} size="sm" className="flex items-center gap-1.5">
            <Plus className="w-4 h-4" /> Assign Unit
          </Button>
        )}
      </div>

      {/* Financial & Emergency Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-indigo-600" /> Financial & Banking
          </h2>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Tax Identification Number</span>
              <span className="font-semibold text-slate-800">{owner.taxId || 'Not provided'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Bank Name</span>
              <span className="font-semibold text-slate-800">{owner.bankName || 'Not provided'}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Account Number</span>
              <span className="font-semibold text-slate-800">{owner.bankAccountNumber || '••••••••'}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Phone className="w-4 h-4 text-indigo-600" /> Contact & Notes
          </h2>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Emergency Contact</span>
              <span className="font-semibold text-slate-800">{owner.emergencyContact || 'None listed'}</span>
            </div>
            <div className="py-1">
              <span className="text-slate-500 block mb-1">Notes</span>
              <p className="text-slate-700 bg-slate-50 p-2 rounded-lg italic">
                {owner.notes || 'No notes added for this owner.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Owned Units Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Building className="w-5 h-5 text-indigo-600" /> Owned Property Units
        </h2>

        {(!owner.ownedUnits || owner.ownedUnits.length === 0) ? (
          <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center">
            <DoorOpen className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-700">No units assigned</p>
            <p className="text-xs text-slate-500 mt-0.5">
              This owner has not been assigned ownership of any units yet.
            </p>
            {canManage && (
              <Button
                size="sm"
                onClick={() => setIsAssignModalOpen(true)}
                className="mt-4 inline-flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Assign Unit
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {owner.ownedUnits.map((ou) => (
              <div
                key={ou.id}
                className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-base font-bold text-slate-900">
                        Unit {ou.unit.unitNumber}
                      </span>
                      <p className="text-xs text-slate-500">
                        {ou.unit.floor?.building?.property?.name || 'Property'} •{' '}
                        {ou.unit.floor?.building?.name}
                      </p>
                    </div>
                    <Badge variant={ou.unit.status === 'VACANT' ? 'success' : 'info'}>
                      {ou.unit.status}
                    </Badge>
                  </div>

                  <div className="mt-4 space-y-1.5 text-xs text-slate-600">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Ownership Share:</span>
                      <span className="font-semibold text-slate-800">{ou.ownershipPercentage}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Acquired Date:</span>
                      <span>{new Date(ou.acquiredDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Current Base Rent:</span>
                      <span className="font-semibold text-slate-800">
                        ${Number(ou.unit.baseRent).toLocaleString()}/mo
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
                  <Link
                    to={`/leases?unitId=${ou.unitId}`}
                    className="text-xs font-semibold text-indigo-600 hover:underline"
                  >
                    View Unit Leases →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Assign Unit Modal */}
      <Modal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        title="Assign Unit to Owner"
        description="Link a unit to this owner with an ownership percentage."
        maxWidth="sm"
      >
        <form onSubmit={handleAssignUnit} className="space-y-4">
          {assignError && (
            <div className="rounded-lg bg-rose-50 p-2.5 text-xs text-rose-700 border border-rose-200">
              {assignError}
            </div>
          )}

          <Input
            label="Unit ID (UUID)"
            required
            value={unitId}
            onChange={(e) => setUnitId(e.target.value)}
            placeholder="Paste Unit UUID"
          />

          <Input
            label="Ownership Percentage (%)"
            type="number"
            min="1"
            max="100"
            required
            value={percentage}
            onChange={(e) => setPercentage(parseFloat(e.target.value))}
          />

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsAssignModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={assignUnitMutation.isPending}>
              Assign Unit
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

