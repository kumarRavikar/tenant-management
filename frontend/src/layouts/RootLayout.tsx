import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import {
  Building2,
  User,
  LogOut,
  LayoutDashboard,
  Activity,
  DoorOpen,
  Users,
  UserCheck,
  FileText,
  Receipt,
  CreditCard,
  Wrench,
  BarChart3,
  Bell,
  CheckCheck,
} from 'lucide-react';
import { useCurrentUser, useLogout } from '@/features/auth/auth.hooks';
import {
  useNotifications,
  useMarkNotificationAsRead,
  useMarkAllNotificationsAsRead,
  NOTIFICATIONS_QUERY_KEY,
} from '@/features/notification/hooks';
import { connectSocket, disconnectSocket } from '@/services/socket';
import { useQueryClient } from '@tanstack/react-query';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

export const RootLayout: React.FC = () => {
  const { data: user } = useCurrentUser();
  const logoutMutation = useLogout();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [isNotifOpen, setIsNotifOpen] = useState(false);
 
  const { data: notifData } = useNotifications(undefined, { enabled: !!user });
  const markAsReadMutation = useMarkNotificationAsRead();
  const markAllAsReadMutation = useMarkAllNotificationsAsRead();

  // Real-time WebSocket connection and listener setup
  useEffect(() => {
    if (!user) return;

    const socket = connectSocket();

    const handleNotification = () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
    };

    const handleTicketEvent = () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    };

    socket.on('notification', handleNotification);
    socket.on('ticket:created', handleTicketEvent);
    socket.on('ticket:status-changed', handleTicketEvent);
    socket.on('ticket:assigned', handleTicketEvent);
    socket.on('ticket:comment-added', handleTicketEvent);

    return () => {
      socket.off('notification', handleNotification);
      socket.off('ticket:created', handleTicketEvent);
      socket.off('ticket:status-changed', handleTicketEvent);
      socket.off('ticket:assigned', handleTicketEvent);
      socket.off('ticket:comment-added', handleTicketEvent);
    };
  }, [user, queryClient]);

  const handleLogout = async () => {
    disconnectSocket();
    await logoutMutation.mutateAsync();
    navigate('/login');
  };

  const unreadCount = notifData?.unreadCount || 0;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Header / Navbar */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2.5 font-bold text-slate-900 text-lg hover:opacity-90">
              <div className="h-9 w-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm">
                <Building2 className="h-5 w-5" />
              </div>
              <span className="hidden sm:inline">Tenant & Property Management</span>
              <span className="sm:hidden">TPMS</span>
            </Link>

            <nav className="hidden md:flex items-center gap-3 text-sm font-medium">
              <Link
                to="/"
                className="flex items-center gap-1.5 text-slate-600 hover:text-indigo-600 transition-colors"
              >
                <Activity className="w-4 h-4" />
                Health
              </Link>
              {user && (
                <>
                  <Link
                    to="/dashboard"
                    className="flex items-center gap-1.5 text-slate-600 hover:text-indigo-600 transition-colors"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    Dashboard
                  </Link>
                  <Link
                    to="/properties"
                    className="flex items-center gap-1.5 text-slate-600 hover:text-indigo-600 transition-colors"
                  >
                    <Building2 className="w-4 h-4" />
                    Properties
                  </Link>
                  <Link
                    to="/units"
                    className="flex items-center gap-1.5 text-slate-600 hover:text-indigo-600 transition-colors"
                  >
                    <DoorOpen className="w-4 h-4" />
                    Units
                  </Link>
                  {(user.role === 'SUPER_ADMIN' ||
                    user.role === 'PROPERTY_ADMIN' ||
                    user.role === 'MANAGER') && (
                    <>
                      <Link
                        to="/owners"
                        className="flex items-center gap-1.5 text-slate-600 hover:text-indigo-600 transition-colors"
                      >
                        <UserCheck className="w-4 h-4" />
                        Owners
                      </Link>
                      <Link
                        to="/tenants"
                        className="flex items-center gap-1.5 text-slate-600 hover:text-indigo-600 transition-colors"
                      >
                        <Users className="w-4 h-4" />
                        Tenants
                      </Link>
                    </>
                  )}
                  <Link
                    to="/leases"
                    className="flex items-center gap-1.5 text-slate-600 hover:text-indigo-600 transition-colors"
                  >
                    <FileText className="w-4 h-4" />
                    Leases
                  </Link>
                  <Link
                    to="/invoices"
                    className="flex items-center gap-1.5 text-slate-600 hover:text-indigo-600 transition-colors"
                  >
                    <Receipt className="w-4 h-4" />
                    Invoices
                  </Link>
                  <Link
                    to="/payments"
                    className="flex items-center gap-1.5 text-slate-600 hover:text-indigo-600 transition-colors"
                  >
                    <CreditCard className="w-4 h-4" />
                    Payments
                  </Link>
                  <Link
                    to="/maintenance"
                    className="flex items-center gap-1.5 text-slate-600 hover:text-indigo-600 transition-colors"
                  >
                    <Wrench className="w-4 h-4" />
                    Maintenance
                  </Link>
                  <Link
                    to="/visitors"
                    className="flex items-center gap-1.5 text-slate-600 hover:text-indigo-600 transition-colors"
                  >
                    <UserCheck className="w-4 h-4" />
                    Visitors
                  </Link>
                  {user.role !== 'TENANT' && (
                    <Link
                      to="/reports"
                      className="flex items-center gap-1.5 text-slate-600 hover:text-indigo-600 transition-colors"
                    >
                      <BarChart3 className="w-4 h-4" />
                      Reports
                    </Link>
                  )}
                </>
              )}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                {/* Notification Bell with Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setIsNotifOpen(!isNotifOpen)}
                    className="relative p-2 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
                    title="Notifications"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Notification Dropdown Popover */}
                  {isNotifOpen && (
                    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 py-3 z-50 animate-in fade-in">
                      <div className="px-4 pb-2 border-b border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-900">Notifications</span>
                          {unreadCount > 0 && (
                            <Badge variant="danger" className="text-[10px] py-0 px-1.5">
                              {unreadCount} unread
                            </Badge>
                          )}
                        </div>
                        {unreadCount > 0 && (
                          <button
                            onClick={() => markAllAsReadMutation.mutate()}
                            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
                          >
                            <CheckCheck className="w-3.5 h-3.5" />
                            Mark all read
                          </button>
                        )}
                      </div>

                      <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
                        {notifData?.notifications && notifData.notifications.length > 0 ? (
                          notifData.notifications.slice(0, 8).map((n) => (
                            <div
                              key={n.id}
                              onClick={() => {
                                if (!n.isRead) markAsReadMutation.mutate(n.id);
                              }}
                              className={`p-3.5 hover:bg-slate-50 transition-colors cursor-pointer text-left ${
                                !n.isRead ? 'bg-indigo-50/40' : ''
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <span className={`text-xs font-semibold ${!n.isRead ? 'text-indigo-950' : 'text-slate-800'}`}>
                                  {n.title}
                                </span>
                                <span className="text-[10px] text-slate-400 whitespace-nowrap">
                                  {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                                {n.message}
                              </p>
                            </div>
                          ))
                        ) : (
                          <div className="p-6 text-center text-xs text-slate-400">
                            No notifications yet.
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-xs font-semibold text-slate-900">
                    {user.firstName} {user.lastName}
                  </span>
                  <Badge variant="neutral" className="text-[10px] py-0 px-2 mt-0.5">
                    {user.role}
                  </Badge>
                </div>
                <Link to="/dashboard">
                  <div className="h-8 w-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                    {user.firstName?.[0]}
                  </div>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="text-slate-600 hover:text-rose-600"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login">
                  <Button variant="ghost" size="sm" className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    Sign In
                  </Button>
                </Link>
                <Link to="/register">
                  <Button variant="primary" size="sm">
                    Register
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
        <p>© {new Date().getFullYear()} Tenant & Property Management System. All rights reserved.</p>
      </footer>
    </div>
  );
};
