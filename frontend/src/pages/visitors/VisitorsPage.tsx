import React, { useState } from 'react';
import { useVisitors, useCreateVisitor, useCheckInVisitor, useCheckOutVisitor } from '@/features/visitor/hooks';
import { Visitor, VisitorStatus } from '@/features/visitor/types';
import { useCurrentUser } from '@/features/auth/auth.hooks';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  UserCheck,
  UserPlus,
  LogIn,
  LogOut,
  Package,
  Search,
  Key,
  X,
  CheckCircle2,
} from 'lucide-react';

export const VisitorsPage: React.FC = () => {
  const { data: currentUser } = useCurrentUser();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<VisitorStatus | ''>('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createdPassModal, setCreatedPassModal] = useState<Visitor | null>(null);

  const { data: visitorData, isLoading, error } = useVisitors({
    search: search || undefined,
    status: (statusFilter as VisitorStatus) || undefined,
  });

  const createVisitorMutation = useCreateVisitor();
  const checkInMutation = useCheckInVisitor();
  const checkOutMutation = useCheckOutVisitor();

  // New Visitor Form State
  const [formData, setFormData] = useState({
    propertyId: '',
    unitId: '',
    visitorName: '',
    phone: '',
    purpose: '',
    visitDate: new Date().toISOString().split('T')[0],
    isDelivery: false,
    deliveryCompany: '',
    notes: '',
  });
  const [formError, setFormError] = useState<string | null>(null);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.propertyId || !formData.unitId || !formData.visitorName || !formData.phone || !formData.purpose) {
      setFormError('Please fill in all required fields.');
      return;
    }

    try {
      const newVisitor = await createVisitorMutation.mutateAsync({
        ...formData,
        visitDate: new Date(formData.visitDate).toISOString(),
      });
      setIsCreateModalOpen(false);
      setCreatedPassModal(newVisitor);
      setFormData({
        propertyId: '',
        unitId: '',
        visitorName: '',
        phone: '',
        purpose: '',
        visitDate: new Date().toISOString().split('T')[0],
        isDelivery: false,
        deliveryCompany: '',
        notes: '',
      });
    } catch (err: any) {
      setFormError(err.message || 'Failed to pre-approve visitor');
    }
  };

  const getStatusBadge = (status: VisitorStatus) => {
    switch (status) {
      case 'PRE_APPROVED':
        return <Badge variant="neutral">Pre-Approved</Badge>;
      case 'CHECKED_IN':
        return <Badge variant="success">Checked In</Badge>;
      case 'CHECKED_OUT':
        return <Badge variant="neutral">Checked Out</Badge>;
      case 'CANCELLED':
      case 'REJECTED':
        return <Badge variant="danger">{status}</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  const canManageGate =
    currentUser?.role === 'SUPER_ADMIN' ||
    currentUser?.role === 'PROPERTY_ADMIN' ||
    currentUser?.role === 'MANAGER';

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <UserCheck className="w-7 h-7 text-indigo-600" />
            Visitor & Gate Pass Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Pre-approve visitors, issue digital gate passes, and track entry/exit times in real time.
          </p>
        </div>

        <Button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 shadow-sm"
        >
          <UserPlus className="w-4 h-4" />
          Pre-Approve Visitor
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <Card>
        <CardContent className="p-4 flex flex-col sm:flex-row items-center gap-4">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by visitor name, phone, or gate pass code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as VisitorStatus | '')}
              aria-label="Filter visitors by status"
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Statuses</option>
              <option value="PRE_APPROVED">Pre-Approved</option>
              <option value="CHECKED_IN">Checked In</option>
              <option value="CHECKED_OUT">Checked Out</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Visitors List / Table */}
      <Card>
        <CardHeader className="pb-3 border-b border-slate-100">
          <CardTitle className="text-base font-semibold text-slate-800">
            Visitor Registry ({visitorData?.meta.total || 0})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-12 text-center text-sm text-slate-500">Loading visitors log...</div>
          ) : error ? (
            <div className="p-8 text-center text-sm text-rose-600">Failed to load visitors list</div>
          ) : visitorData?.visitors && visitorData.visitors.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3.5">Gate Pass</th>
                    <th className="px-6 py-3.5">Visitor</th>
                    <th className="px-6 py-3.5">Property / Unit</th>
                    <th className="px-6 py-3.5">Purpose & Type</th>
                    <th className="px-6 py-3.5">Date & Times</th>
                    <th className="px-6 py-3.5">Status</th>
                    {canManageGate && <th className="px-6 py-3.5 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {visitorData.visitors.map((v) => (
                    <tr key={v.id} className="hover:bg-slate-50/75 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-md w-fit">
                          <Key className="w-3.5 h-3.5 text-indigo-500" />
                          {v.gatePassCode}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900">{v.visitorName}</div>
                        <div className="text-xs text-slate-500">{v.phone}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-800">
                          {v.property?.name || 'Property'}
                        </div>
                        <div className="text-xs text-slate-500">
                          Unit: {v.unit?.unitNumber || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-slate-700">
                          {v.isDelivery ? (
                            <span className="flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-0.5 rounded text-xs font-medium">
                              <Package className="w-3 h-3 text-amber-600" />
                              Delivery {v.deliveryCompany && `(${v.deliveryCompany})`}
                            </span>
                          ) : (
                            <span>{v.purpose}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs">
                        <div className="text-slate-800 font-medium">
                          {new Date(v.visitDate).toLocaleDateString()}
                        </div>
                        {v.entryTime && (
                          <div className="text-emerald-600">
                            In: {new Date(v.entryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        )}
                        {v.exitTime && (
                          <div className="text-slate-500">
                            Out: {new Date(v.exitTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">{getStatusBadge(v.status)}</td>
                      {canManageGate && (
                        <td className="px-6 py-4 text-right">
                          {v.status === 'PRE_APPROVED' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => checkInMutation.mutate(v.id)}
                              isLoading={checkInMutation.isPending}
                              className="text-xs text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                            >
                              <LogIn className="w-3.5 h-3.5 mr-1" />
                              Check In
                            </Button>
                          )}
                          {v.status === 'CHECKED_IN' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => checkOutMutation.mutate(v.id)}
                              isLoading={checkOutMutation.isPending}
                              className="text-xs text-rose-700 border-rose-300 hover:bg-rose-50"
                            >
                              <LogOut className="w-3.5 h-3.5 mr-1" />
                              Check Out
                            </Button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center">
              <UserCheck className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-700">No visitors registered</p>
              <p className="text-xs text-slate-400 mt-1">Pre-approve a visitor to generate their gate pass.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pre-Approve Visitor Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-indigo-600" />
                Pre-Approve Visitor
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Property ID *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.propertyId}
                    onChange={(e) => setFormData({ ...formData, propertyId: e.target.value })}
                    placeholder="Enter Property UUID"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Unit ID *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.unitId}
                    onChange={(e) => setFormData({ ...formData, unitId: e.target.value })}
                    placeholder="Enter Unit UUID"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Visitor Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.visitorName}
                    onChange={(e) => setFormData({ ...formData, visitorName: e.target.value })}
                    placeholder="e.g. John Doe"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="e.g. +1 555-0199"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Purpose *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.purpose}
                    onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                    placeholder="e.g. Meeting / Family visit"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Visit Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.visitDate}
                    onChange={(e) => setFormData({ ...formData, visitDate: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isDelivery"
                  checked={formData.isDelivery}
                  onChange={(e) => setFormData({ ...formData, isDelivery: e.target.checked })}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="isDelivery" className="text-xs font-medium text-slate-700 select-none">
                  This is a courier / package delivery
                </label>
              </div>

              {formData.isDelivery && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Delivery Company
                  </label>
                  <input
                    type="text"
                    value={formData.deliveryCompany}
                    onChange={(e) => setFormData({ ...formData, deliveryCompany: e.target.value })}
                    placeholder="e.g. FedEx, Amazon, DHL"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Notes / Instructions
                </label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Optional gate instructions..."
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCreateModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  isLoading={createVisitorMutation.isPending}
                >
                  Confirm Pre-Approval
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Digital Gate Pass Modal Presentation */}
      {createdPassModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 text-center space-y-4">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <div>
              <h3 className="text-xl font-bold text-slate-900">Digital Gate Pass Issued</h3>
              <p className="text-xs text-slate-500 mt-1">
                Share this pass code with the visitor or security gate.
              </p>
            </div>

            <div className="p-4 bg-indigo-50 border-2 border-dashed border-indigo-300 rounded-2xl">
              <span className="text-xs uppercase tracking-widest text-indigo-600 font-bold">Access Pass Code</span>
              <div className="text-3xl font-extrabold font-mono tracking-wider text-indigo-950 mt-1">
                {createdPassModal.gatePassCode}
              </div>
            </div>

            <div className="text-left text-xs space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div className="flex justify-between">
                <span className="text-slate-400">Visitor:</span>
                <span className="font-semibold text-slate-800">{createdPassModal.visitorName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Valid Date:</span>
                <span className="font-semibold text-slate-800">
                  {new Date(createdPassModal.visitDate).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Purpose:</span>
                <span className="font-semibold text-slate-800">{createdPassModal.purpose}</span>
              </div>
            </div>

            <Button
              className="w-full"
              size="sm"
              onClick={() => setCreatedPassModal(null)}
            >
              Done
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
