import React, { useState } from 'react';
import { useCurrentUser, useSessions, useRevokeSession, useChangePassword, useLogout } from '@/features/auth/auth.hooks';
import { useDashboardStats } from '@/features/dashboard/hooks';
import { changePasswordFormSchema } from '@/features/auth/auth.schemas';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  UserCheck,
  ShieldCheck,
  Smartphone,
  Globe,
  Key,
  LogOut,
  Building,
  CheckCircle2,
  AlertCircle,
  Clock,
  TrendingUp,
} from 'lucide-react';
import { ZodError } from 'zod';

export const DashboardPage: React.FC = () => {
  const { data: user } = useCurrentUser();
  const { data: dashboardData, isLoading: dashboardLoading } = useDashboardStats();
  const { data: sessions, isLoading: sessionsLoading } = useSessions();
  const revokeSessionMutation = useRevokeSession();
  const changePasswordMutation = useChangePassword();
  const logoutMutation = useLogout();

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordGeneralError, setPasswordGeneralError] = useState<string | null>(null);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordErrors({});
    setPasswordSuccess(null);
    setPasswordGeneralError(null);

    try {
      const validated = changePasswordFormSchema.parse(passwordData);
      const message = await changePasswordMutation.mutateAsync({
        currentPassword: validated.currentPassword,
        newPassword: validated.newPassword,
      });
      setPasswordSuccess(message);
      setPasswordData({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
    } catch (err) {
      if (err instanceof ZodError) {
        const errors: Record<string, string> = {};
        err.errors.forEach((error) => {
          if (error.path[0]) {
            errors[error.path[0].toString()] = error.message;
          }
        });
        setPasswordErrors(errors);
      } else if (err instanceof Error) {
        setPasswordGeneralError(err.message);
      }
    }
  };

  const getRoleBadgeVariant = (role?: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'danger';
      case 'PROPERTY_ADMIN':
        return 'warning';
      case 'MANAGER':
        return 'neutral';
      default:
        return 'success';
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Welcome Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white text-xl font-bold shadow-md">
            {user?.firstName?.[0]}
            {user?.lastName?.[0]}
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                Welcome, {user?.firstName} {user?.lastName}
              </h1>
              <Badge variant={getRoleBadgeVariant(user?.role)}>{user?.role}</Badge>
            </div>
            <p className="text-sm text-slate-500 mt-0.5">{user?.email}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => logoutMutation.mutate()}
            isLoading={logoutMutation.isPending}
            className="flex items-center gap-1.5 text-rose-600 border-rose-200 hover:bg-rose-50"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
        </div>
      </div>

      {/* Dynamic Role-Based Statistics Banner */}
      <div className="space-y-3">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-indigo-600" />
          Platform Performance & Live Metrics ({dashboardData?.role || user?.role})
        </h2>

        {dashboardLoading ? (
          <div className="p-8 bg-white rounded-xl border border-slate-200 text-center text-xs text-slate-500">
            Aggregating database statistics...
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {dashboardData?.role === 'SUPER_ADMIN' && (
              <>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Properties</span>
                  <div className="text-xl font-extrabold text-slate-900 mt-1">
                    {(dashboardData.stats as any).totalProperties}
                  </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Units</span>
                  <div className="text-xl font-extrabold text-slate-900 mt-1">
                    {(dashboardData.stats as any).totalUnits}
                  </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Occupancy Rate</span>
                  <div className="text-xl font-extrabold text-emerald-600 mt-1">
                    {(dashboardData.stats as any).occupancyRate}%
                  </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Revenue</span>
                  <div className="text-xl font-extrabold text-slate-900 mt-1">
                    {`$${Number((dashboardData.stats as any).totalRevenue).toLocaleString('en-US')}`}
                  </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Open Tickets</span>
                  <div className="text-xl font-extrabold text-amber-600 mt-1">
                    {(dashboardData.stats as any).pendingMaintenance}
                  </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Overdue Rent</span>
                  <div className="text-xl font-extrabold text-rose-600 mt-1">
                    {`$${Number((dashboardData.stats as any).overdueRent).toLocaleString('en-US')}`}
                  </div>
                </div>
              </>
            )}

            {(dashboardData?.role === 'PROPERTY_ADMIN' || dashboardData?.role === 'MANAGER') && (
              <>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Assigned Properties</span>
                  <div className="text-xl font-extrabold text-slate-900 mt-1">
                    {(dashboardData.stats as any).assignedProperties}
                  </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Units & Occupancy</span>
                  <div className="text-xl font-extrabold text-emerald-600 mt-1">
                    {(dashboardData.stats as any).occupancyRate}%
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {(dashboardData.stats as any).occupiedUnits} / {(dashboardData.stats as any).totalUnits}
                  </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Rent Collection</span>
                  <div className="text-xl font-extrabold text-slate-900 mt-1">
                    {(dashboardData.stats as any).collectionRate}%
                  </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Collected</span>
                  <div className="text-xl font-extrabold text-slate-900 mt-1">
                    ${Number((dashboardData.stats as any).totalRentCollected).toLocaleString('en-US')}
                  </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Open Tickets</span>
                  <div className="text-xl font-extrabold text-amber-600 mt-1">
                    {(dashboardData.stats as any).openTickets}
                  </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Visitors (7d)</span>
                  <div className="text-xl font-extrabold text-indigo-600 mt-1">
                    {(dashboardData.stats as any).recentVisitorsCount}
                  </div>
                </div>
              </>
            )}

            {dashboardData?.role === 'OWNER' && (
              <>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Owned Units</span>
                  <div className="text-xl font-extrabold text-slate-900 mt-1">
                    {(dashboardData.stats as any).ownedUnitsCount}
                  </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Occupancy Rate</span>
                  <div className="text-xl font-extrabold text-emerald-600 mt-1">
                    {(dashboardData.stats as any).occupancyRate}%
                  </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Rental Income</span>
                  <div className="text-xl font-extrabold text-slate-900 mt-1">
                    {`$${Number((dashboardData.stats as any).totalRentalIncome).toLocaleString('en-US')}`}
                  </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Pending Dues</span>
                  <div className="text-xl font-extrabold text-rose-600 mt-1">
                    {`$${Number((dashboardData.stats as any).pendingDues).toLocaleString('en-US')}`}
                  </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Maintenance</span>
                  <div className="text-xl font-extrabold text-amber-600 mt-1">
                    {(dashboardData.stats as any).activeMaintenanceTickets}
                  </div>
                </div>
              </>
            )}

            {dashboardData?.role === 'TENANT' && (
              <>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Active Lease</span>
                  <div className="text-sm font-bold text-slate-900 mt-1 truncate">
                    {(dashboardData.stats as any).activeLease?.unit?.unitNumber
                      ? `Unit ${(dashboardData.stats as any).activeLease.unit.unitNumber}`
                      : 'No Active Lease'}
                  </div>
                  <div className="text-[10px] text-emerald-600 font-semibold">
                    {(dashboardData.stats as any).activeLease ? `$${Number((dashboardData.stats as any).activeLease.monthlyRent).toLocaleString('en-US')}/mo` : '-'}
                  </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Upcoming Rent</span>
                  <div className="text-sm font-bold text-slate-900 mt-1">
                    {(dashboardData.stats as any).upcomingRentInvoice
                      ? `$${Number((dashboardData.stats as any).upcomingRentInvoice.totalAmount).toLocaleString('en-US')}`
                      : 'No pending dues'}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {(dashboardData.stats as any).upcomingRentInvoice?.status || 'All clear'}
                  </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Paid</span>
                  <div className="text-xl font-extrabold text-emerald-600 mt-1">
                    {`$${Number((dashboardData.stats as any).totalPaidAmount).toLocaleString('en-US')}`}
                  </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Open Tickets</span>
                  <div className="text-xl font-extrabold text-amber-600 mt-1">
                    {(dashboardData.stats as any).openTicketsCount}
                  </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Pre-Approved Visitors</span>
                  <div className="text-xl font-extrabold text-indigo-600 mt-1">
                    {(dashboardData.stats as any).preApprovedVisitorsCount}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Profile & Property Scope */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <UserCheck className="w-4 h-4 text-indigo-600" />
                Account Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <span className="text-xs text-slate-400 uppercase font-semibold">User ID</span>
                <p className="font-mono text-xs text-slate-700 break-all">{user?.id}</p>
              </div>
              <div>
                <span className="text-xs text-slate-400 uppercase font-semibold">Account Status</span>
                <p className="font-medium text-emerald-600 flex items-center gap-1 mt-0.5">
                  <CheckCircle2 className="w-4 h-4" /> Active
                </p>
              </div>
              <div>
                <span className="text-xs text-slate-400 uppercase font-semibold">Phone</span>
                <p className="text-slate-700">{user?.phone || 'Not provided'}</p>
              </div>
              <div>
                <span className="text-xs text-slate-400 uppercase font-semibold">Member Since</span>
                <p className="text-slate-700">
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Property Scoping Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Building className="w-4 h-4 text-indigo-600" />
                Assigned Properties
              </CardTitle>
              <CardDescription>Property scope enforcement</CardDescription>
            </CardHeader>
            <CardContent className="text-sm">
              {user?.role === 'SUPER_ADMIN' ? (
                <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-lg text-xs text-indigo-800">
                  <ShieldCheck className="w-4 h-4 text-indigo-600 inline mr-1" />
                  <strong>Global Scope:</strong> As a Super Admin, you have unrestricted access across all system properties.
                </div>
              ) : user?.assignedProperties && user.assignedProperties.length > 0 ? (
                <ul className="space-y-2">
                  {user.assignedProperties.map((p) => (
                    <li
                      key={p.propertyId}
                      className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 font-medium flex items-center gap-2"
                    >
                      <Building className="w-3.5 h-3.5 text-slate-500" />
                      {p.propertyName || p.propertyId}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-slate-500 italic">No assigned properties assigned yet.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column (2 cols): Sessions & Change Password */}
        <div className="md:col-span-2 space-y-6">
          {/* Active Sessions Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Smartphone className="w-4 h-4 text-indigo-600" />
                Active Sessions
              </CardTitle>
              <CardDescription>Manage active logins and authenticated devices</CardDescription>
            </CardHeader>
            <CardContent>
              {sessionsLoading ? (
                <p className="text-xs text-slate-500">Loading active sessions...</p>
              ) : sessions && sessions.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {sessions.map((sess) => (
                    <div
                      key={sess.id}
                      className="py-3 flex items-center justify-between gap-4 first:pt-0 last:pb-0"
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-slate-100 text-slate-600 mt-0.5">
                          <Globe className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-slate-800">
                              {sess.userAgent?.includes('Chrome')
                                ? 'Google Chrome'
                                : sess.userAgent?.includes('Firefox')
                                ? 'Mozilla Firefox'
                                : sess.userAgent || 'Web Browser'}
                            </span>
                            {sess.isCurrent && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                Current
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                            <span>IP: {sess.ipAddress || '127.0.0.1'}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(sess.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      {!sess.isCurrent && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => revokeSessionMutation.mutate(sess.id)}
                          isLoading={revokeSessionMutation.isPending}
                          className="text-xs text-rose-600 hover:bg-rose-50 border-rose-200"
                        >
                          Revoke
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500">No active sessions found.</p>
              )}
            </CardContent>
          </Card>

          {/* Change Password Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Key className="w-4 h-4 text-indigo-600" />
                Change Password
              </CardTitle>
              <CardDescription>Update your credentials. You will need to log in again after changing.</CardDescription>
            </CardHeader>
            <CardContent>
              {passwordGeneralError && (
                <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 flex items-start gap-2 text-rose-800 text-xs">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{passwordGeneralError}</span>
                </div>
              )}

              {passwordSuccess && (
                <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 flex items-start gap-2 text-emerald-800 text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{passwordSuccess}</span>
                </div>
              )}

              <form onSubmit={handlePasswordChange} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) =>
                      setPasswordData((prev) => ({ ...prev, currentPassword: e.target.value }))
                    }
                    placeholder="••••••••"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500"
                  />
                  {passwordErrors.currentPassword && (
                    <p className="text-xs text-rose-600 mt-1">{passwordErrors.currentPassword}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) =>
                        setPasswordData((prev) => ({ ...prev, newPassword: e.target.value }))
                      }
                      placeholder="••••••••"
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500"
                    />
                    {passwordErrors.newPassword && (
                      <p className="text-xs text-rose-600 mt-1">{passwordErrors.newPassword}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={passwordData.confirmNewPassword}
                      onChange={(e) =>
                        setPasswordData((prev) => ({ ...prev, confirmNewPassword: e.target.value }))
                      }
                      placeholder="••••••••"
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500"
                    />
                    {passwordErrors.confirmNewPassword && (
                      <p className="text-xs text-rose-600 mt-1">{passwordErrors.confirmNewPassword}</p>
                    )}
                  </div>
                </div>

                <Button
                  type="submit"
                  size="sm"
                  className="mt-2"
                  isLoading={changePasswordMutation.isPending}
                >
                  Update Password
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

