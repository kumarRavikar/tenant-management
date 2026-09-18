import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Users,
  Mail,
  Phone,
  Briefcase,
  FileText,
  ArrowLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { useTenant, useUpdateTenant } from '@/features/tenant/tenant.hooks';
import { useCurrentUser } from '@/features/auth/auth.hooks';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { TenantOnboardingStatus } from '@/types';

export const TenantDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { data: user } = useCurrentUser();
  const { data: tenant, isLoading, refetch } = useTenant(id);

  const updateMutation = useUpdateTenant();
  const [statusUpdating, setStatusUpdating] = useState(false);

  const canManage =
    user?.role === 'SUPER_ADMIN' || user?.role === 'PROPERTY_ADMIN' || user?.role === 'MANAGER';

  const handleUpdateStatus = async (newStatus: TenantOnboardingStatus) => {
    if (!id) return;
    setStatusUpdating(true);
    try {
      await updateMutation.mutateAsync({
        id,
        data: { onboardingStatus: newStatus },
      });
      refetch();
    } finally {
      setStatusUpdating(false);
    }
  };

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

  if (isLoading) {
    return (
      <div className="py-24 text-center text-slate-500">
        <Users className="w-8 h-8 animate-bounce mx-auto text-indigo-600 mb-2" />
        <p>Loading tenant details...</p>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="py-16 text-center">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-2" />
        <h2 className="text-lg font-bold text-slate-800">Tenant Not Found</h2>
        <Link to="/tenants" className="inline-block mt-4">
          <Button variant="outline" size="sm">
            Back to Tenants
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Navigation Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Link to="/tenants" className="flex items-center gap-1 hover:text-indigo-600">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Tenants
        </Link>
        <ChevronRight className="w-3 h-3 text-slate-400" />
        <span className="font-semibold text-slate-700">
          {tenant.user.firstName} {tenant.user.lastName}
        </span>
      </div>

      {/* Tenant Header Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xl">
            {tenant.user.firstName?.[0]}
            {tenant.user.lastName?.[0]}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900">
                {tenant.user.firstName} {tenant.user.lastName}
              </h1>
              {getStatusBadge(tenant.onboardingStatus)}
            </div>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-1">
              <span className="flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-slate-400" /> {tenant.user.email}
              </span>
              {tenant.user.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-slate-400" /> {tenant.user.phone}
                </span>
              )}
            </div>
          </div>
        </div>

        {canManage && (
          <div className="flex items-center gap-2">
            {tenant.onboardingStatus !== 'VERIFIED' && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleUpdateStatus('VERIFIED')}
                isLoading={statusUpdating}
                className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700"
              >
                <CheckCircle className="w-4 h-4" /> Verify Tenant
              </Button>
            )}
            {tenant.onboardingStatus !== 'REJECTED' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleUpdateStatus('REJECTED')}
                isLoading={statusUpdating}
                className="text-rose-600 hover:bg-rose-50 flex items-center gap-1"
              >
                <XCircle className="w-4 h-4" /> Reject
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Info Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Employment & Income */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-indigo-600" /> Employment & Financial
          </h2>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Employment Status</span>
              <span className="font-semibold text-slate-800">{tenant.employmentStatus || 'Unspecified'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Employer Name</span>
              <span className="font-semibold text-slate-800">{tenant.employerName || 'Not provided'}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Annual Income</span>
              <span className="font-semibold text-slate-800">
                {tenant.annualIncome ? `$${Number(tenant.annualIncome).toLocaleString()}` : 'Not provided'}
              </span>
            </div>
          </div>
        </div>

        {/* Emergency Contact & Personal */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Phone className="w-4 h-4 text-indigo-600" /> Emergency Contact
          </h2>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Contact Name</span>
              <span className="font-semibold text-slate-800">
                {tenant.emergencyContactName || 'None listed'}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Contact Phone</span>
              <span className="font-semibold text-slate-800">
                {tenant.emergencyContactPhone || 'None listed'}
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Date of Birth</span>
              <span className="font-semibold text-slate-800">
                {tenant.dateOfBirth ? new Date(tenant.dateOfBirth).toLocaleDateString() : 'Not provided'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Leases History */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <FileText className="w-5 h-5 text-indigo-600" /> Lease Contracts
        </h2>

        {(!tenant.leases || tenant.leases.length === 0) ? (
          <div className="bg-white rounded-xl border border-dashed border-slate-300 p-8 text-center">
            <FileText className="w-7 h-7 text-slate-400 mx-auto mb-2" />
            <p className="text-xs font-medium text-slate-700">No leases found for this tenant</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tenant.leases.map((lease) => (
              <div
                key={lease.id}
                className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-sm font-bold text-slate-900">
                        Unit {lease.unit?.unitNumber}
                      </span>
                      <p className="text-xs text-slate-500">
                        {lease.unit?.floor?.building?.property?.name || 'Property'} •{' '}
                        {lease.unit?.floor?.building?.name}
                      </p>
                    </div>
                    <Badge variant={lease.status === 'ACTIVE' ? 'success' : 'neutral'}>
                      {lease.status}
                    </Badge>
                  </div>

                  <div className="mt-3 space-y-1 text-xs text-slate-600">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Duration:</span>
                      <span>
                        {new Date(lease.startDate).toLocaleDateString()} -{' '}
                        {new Date(lease.endDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Rent:</span>
                      <span className="font-semibold text-slate-800">
                        ${Number(lease.monthlyRent).toLocaleString()}/mo
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100 flex justify-end">
                  <Link
                    to={`/leases/${lease.id}`}
                    className="text-xs font-semibold text-indigo-600 hover:underline flex items-center gap-1"
                  >
                    View Lease <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
