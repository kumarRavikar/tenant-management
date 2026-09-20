import React, { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Building2,
  User,
  LogOut,
  LayoutDashboard,
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
  Menu,
  X,
  ChevronRight,
  ChevronDown,
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
  const location = useLocation();
  const queryClient = useQueryClient();

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  const { data: notifData } = useNotifications(undefined, { enabled: !!user });
  const markAsReadMutation = useMarkNotificationAsRead();
  const markAllAsReadMutation = useMarkAllNotificationsAsRead();

  // Close menus on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsNotifOpen(false);
    setIsMoreOpen(false);
  }, [location.pathname]);

  // Close menus on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMobileMenuOpen(false);
        setIsNotifOpen(false);
        setIsMoreOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close "More" dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setIsMoreOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const isMoreActive =
    isActive('/owners') ||
    isActive('/tenants') ||
    isActive('/visitors') ||
    isActive('/reports');

  const isLandingPage = location.pathname === '/';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Header / Navbar */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-3 lg:gap-6 shrink-0">
            <Link to="/" className="flex items-center gap-2.5 font-bold text-slate-900 text-lg hover:opacity-90 shrink-0">
              <div className="h-9 w-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm shrink-0">
                <Building2 className="h-5 w-5" />
              </div>
              <span className="hidden 2xl:inline">Tenant & Property Management</span>
              <span className="hidden sm:inline 2xl:hidden font-bold">TPMS</span>
              <span className="sm:hidden font-bold">TPMS</span>
            </Link>

            {/* Desktop Navigation (visible on xl screens: >= 1280px) */}
            {user && (
              <nav className="hidden xl:flex items-center gap-0.5 text-xs 2xl:text-sm font-medium">
                <Link
                  to="/dashboard"
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-colors shrink-0 ${
                    isActive('/dashboard')
                      ? 'text-indigo-600 bg-indigo-50 font-semibold'
                      : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-50'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Dashboard</span>
                </Link>

                <Link
                  to="/properties"
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-colors shrink-0 ${
                    isActive('/properties')
                      ? 'text-indigo-600 bg-indigo-50 font-semibold'
                      : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-50'
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  <span>Properties</span>
                </Link>

                <Link
                  to="/units"
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-colors shrink-0 ${
                    isActive('/units')
                      ? 'text-indigo-600 bg-indigo-50 font-semibold'
                      : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-50'
                  }`}
                >
                  <DoorOpen className="w-4 h-4" />
                  <span>Units</span>
                </Link>

                <Link
                  to="/leases"
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-colors shrink-0 ${
                    isActive('/leases')
                      ? 'text-indigo-600 bg-indigo-50 font-semibold'
                      : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-50'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>Leases</span>
                </Link>

                <Link
                  to="/invoices"
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-colors shrink-0 ${
                    isActive('/invoices')
                      ? 'text-indigo-600 bg-indigo-50 font-semibold'
                      : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-50'
                  }`}
                >
                  <Receipt className="w-4 h-4" />
                  <span>Invoices</span>
                </Link>

                <Link
                  to="/payments"
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-colors shrink-0 ${
                    isActive('/payments')
                      ? 'text-indigo-600 bg-indigo-50 font-semibold'
                      : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-50'
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Payments</span>
                </Link>

                <Link
                  to="/maintenance"
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-colors shrink-0 ${
                    isActive('/maintenance')
                      ? 'text-indigo-600 bg-indigo-50 font-semibold'
                      : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-50'
                  }`}
                >
                  <Wrench className="w-4 h-4" />
                  <span>Maintenance</span>
                </Link>

                {/* "More" Dropdown for Secondary Management Pages */}
                <div className="relative shrink-0" ref={moreMenuRef}>
                  <button
                    onClick={() => setIsMoreOpen(!isMoreOpen)}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition-colors ${
                      isMoreActive
                        ? 'text-indigo-600 bg-indigo-50 font-semibold'
                        : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-50'
                    }`}
                    aria-expanded={isMoreOpen}
                    aria-haspopup="true"
                  >
                    <span>More</span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isMoreOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isMoreOpen && (
                    <div className="absolute left-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in">
                      {(user.role === 'SUPER_ADMIN' ||
                        user.role === 'PROPERTY_ADMIN' ||
                        user.role === 'MANAGER') && (
                        <>
                          <Link
                            to="/owners"
                            onClick={() => setIsMoreOpen(false)}
                            className={`flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium transition-colors ${
                              isActive('/owners')
                                ? 'text-indigo-600 bg-indigo-50 font-semibold'
                                : 'text-slate-700 hover:bg-slate-50 hover:text-indigo-600'
                            }`}
                          >
                            <UserCheck className="w-4 h-4 text-slate-500" />
                            <span>Owners</span>
                          </Link>

                          <Link
                            to="/tenants"
                            onClick={() => setIsMoreOpen(false)}
                            className={`flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium transition-colors ${
                              isActive('/tenants')
                                ? 'text-indigo-600 bg-indigo-50 font-semibold'
                                : 'text-slate-700 hover:bg-slate-50 hover:text-indigo-600'
                            }`}
                          >
                            <Users className="w-4 h-4 text-slate-500" />
                            <span>Tenants</span>
                          </Link>
                        </>
                      )}

                      <Link
                        to="/visitors"
                        onClick={() => setIsMoreOpen(false)}
                        className={`flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium transition-colors ${
                          isActive('/visitors')
                            ? 'text-indigo-600 bg-indigo-50 font-semibold'
                            : 'text-slate-700 hover:bg-slate-50 hover:text-indigo-600'
                        }`}
                      >
                        <UserCheck className="w-4 h-4 text-slate-500" />
                        <span>Visitors</span>
                      </Link>

                      {user.role !== 'TENANT' && (
                        <Link
                          to="/reports"
                          onClick={() => setIsMoreOpen(false)}
                          className={`flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium transition-colors ${
                            isActive('/reports')
                              ? 'text-indigo-600 bg-indigo-50 font-semibold'
                              : 'text-slate-700 hover:bg-slate-50 hover:text-indigo-600'
                          }`}
                        >
                          <BarChart3 className="w-4 h-4 text-slate-500" />
                          <span>Reports</span>
                        </Link>
                      )}
                    </div>
                  )}
                </div>
              </nav>
            )}
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {user ? (
              <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                {/* Notification Bell with Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setIsNotifOpen(!isNotifOpen)}
                    className="relative p-2 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
                    title="Notifications"
                    aria-label="Notifications"
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

                <div className="hidden md:flex flex-col items-end shrink-0">
                  <span className="text-xs font-semibold text-slate-900">
                    {user.firstName} {user.lastName}
                  </span>
                  <Badge variant="neutral" className="text-[10px] py-0 px-2 mt-0.5">
                    {user.role}
                  </Badge>
                </div>

                <Link to="/dashboard" title="View Profile" className="shrink-0">
                  <div className="h-8 w-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                    {user.firstName?.[0]}
                  </div>
                </Link>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="hidden sm:flex text-slate-600 hover:text-rose-600 shrink-0"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-2 shrink-0">
                <Link to="/signin">
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

            {/* Mobile Dropdown Hamburger Button (visible on < xl) */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="xl:hidden p-2 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6 text-slate-800" />
              ) : (
                <Menu className="w-6 h-6 text-slate-800" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu Container */}
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 top-16 bg-slate-900/30 backdrop-blur-xs z-30 xl:hidden animate-in fade-in"
              onClick={() => setIsMobileMenuOpen(false)}
              aria-hidden="true"
            />

            {/* Dropdown Menu Panel */}
            <div
              ref={mobileMenuRef}
              className="xl:hidden fixed top-16 left-0 right-0 max-h-[calc(100vh-4rem)] overflow-y-auto bg-white border-b border-slate-200 shadow-2xl z-40 animate-in slide-in-from-top-2 duration-200"
            >
              <div className="max-w-7xl mx-auto px-4 py-4 space-y-4">
                {/* User Card inside Mobile Dropdown if Authenticated */}
                {user ? (
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-10 w-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-sm shrink-0">
                        {user.firstName?.[0]}
                        {user.lastName?.[0]}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-slate-900 truncate">
                          {user.firstName} {user.lastName}
                        </div>
                        <div className="text-xs text-slate-500 truncate">{user.email}</div>
                      </div>
                    </div>
                    <Badge variant="neutral" className="text-[10px] py-0.5 px-2 shrink-0">
                      {user.role}
                    </Badge>
                  </div>
                ) : (
                  <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 flex flex-col gap-2.5">
                    <p className="text-xs text-slate-600 font-medium">
                      Sign in to manage properties, invoices, leases, and maintenance.
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <Link to="/signin" onClick={() => setIsMobileMenuOpen(false)}>
                        <Button variant="outline" size="sm" className="w-full justify-center">
                          <User className="w-4 h-4 mr-1.5" />
                          Sign In
                        </Button>
                      </Link>
                      <Link to="/register" onClick={() => setIsMobileMenuOpen(false)}>
                        <Button variant="primary" size="sm" className="w-full justify-center">
                          Register
                        </Button>
                      </Link>
                    </div>
                  </div>
                )}

                {/* Navigation Categories & Items */}
                <div className="space-y-1">
                  {user && (
                    <>
                      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 pt-2 pb-1">
                        Management & Operations
                      </div>
                      <Link
                        to="/dashboard"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                          isActive('/dashboard')
                            ? 'text-indigo-700 bg-indigo-50 font-semibold'
                            : 'text-slate-700 hover:text-indigo-600 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`p-1.5 rounded-lg ${
                              isActive('/dashboard') ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            <LayoutDashboard className="w-4 h-4" />
                          </div>
                          <span>Dashboard</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </Link>

                      <Link
                        to="/properties"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                          isActive('/properties')
                            ? 'text-indigo-700 bg-indigo-50 font-semibold'
                            : 'text-slate-700 hover:text-indigo-600 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`p-1.5 rounded-lg ${
                              isActive('/properties') ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            <Building2 className="w-4 h-4" />
                          </div>
                          <span>Properties</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </Link>

                      <Link
                        to="/units"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                          isActive('/units')
                            ? 'text-indigo-700 bg-indigo-50 font-semibold'
                            : 'text-slate-700 hover:text-indigo-600 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`p-1.5 rounded-lg ${
                              isActive('/units') ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            <DoorOpen className="w-4 h-4" />
                          </div>
                          <span>Units</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </Link>

                      {(user.role === 'SUPER_ADMIN' ||
                        user.role === 'PROPERTY_ADMIN' ||
                        user.role === 'MANAGER') && (
                        <>
                          <Link
                            to="/owners"
                            onClick={() => setIsMobileMenuOpen(false)}
                            className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                              isActive('/owners')
                                ? 'text-indigo-700 bg-indigo-50 font-semibold'
                                : 'text-slate-700 hover:text-indigo-600 hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`p-1.5 rounded-lg ${
                                  isActive('/owners') ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                  <UserCheck className="w-4 h-4" />
                                </div>
                                <span>Owners</span>
                              </div>
                              <ChevronRight className="w-4 h-4 text-slate-400" />
                            </Link>

                            <Link
                              to="/tenants"
                              onClick={() => setIsMobileMenuOpen(false)}
                              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                                isActive('/tenants')
                                  ? 'text-indigo-700 bg-indigo-50 font-semibold'
                                  : 'text-slate-700 hover:text-indigo-600 hover:bg-slate-50'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div
                                  className={`p-1.5 rounded-lg ${
                                    isActive('/tenants') ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'
                                  }`}
                                >
                                  <Users className="w-4 h-4" />
                                </div>
                                <span>Tenants</span>
                              </div>
                              <ChevronRight className="w-4 h-4 text-slate-400" />
                            </Link>
                          </>
                        )}

                      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 pt-3 pb-1">
                        Leases & Financials
                      </div>

                      <Link
                        to="/leases"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                          isActive('/leases')
                            ? 'text-indigo-700 bg-indigo-50 font-semibold'
                            : 'text-slate-700 hover:text-indigo-600 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`p-1.5 rounded-lg ${
                              isActive('/leases') ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            <FileText className="w-4 h-4" />
                          </div>
                          <span>Leases</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </Link>

                      <Link
                        to="/invoices"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                          isActive('/invoices')
                            ? 'text-indigo-700 bg-indigo-50 font-semibold'
                            : 'text-slate-700 hover:text-indigo-600 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`p-1.5 rounded-lg ${
                              isActive('/invoices') ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            <Receipt className="w-4 h-4" />
                          </div>
                          <span>Invoices</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </Link>

                      <Link
                        to="/payments"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                          isActive('/payments')
                            ? 'text-indigo-700 bg-indigo-50 font-semibold'
                            : 'text-slate-700 hover:text-indigo-600 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`p-1.5 rounded-lg ${
                              isActive('/payments') ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            <CreditCard className="w-4 h-4" />
                          </div>
                          <span>Payments</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </Link>

                      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 pt-3 pb-1">
                        Services & Reports
                      </div>

                      <Link
                        to="/maintenance"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                          isActive('/maintenance')
                            ? 'text-indigo-700 bg-indigo-50 font-semibold'
                            : 'text-slate-700 hover:text-indigo-600 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`p-1.5 rounded-lg ${
                              isActive('/maintenance') ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            <Wrench className="w-4 h-4" />
                          </div>
                          <span>Maintenance</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </Link>

                      <Link
                        to="/visitors"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                          isActive('/visitors')
                            ? 'text-indigo-700 bg-indigo-50 font-semibold'
                            : 'text-slate-700 hover:text-indigo-600 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`p-1.5 rounded-lg ${
                              isActive('/visitors') ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            <UserCheck className="w-4 h-4" />
                          </div>
                          <span>Visitors</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </Link>

                      {user.role !== 'TENANT' && (
                        <Link
                          to="/reports"
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                            isActive('/reports')
                              ? 'text-indigo-700 bg-indigo-50 font-semibold'
                              : 'text-slate-700 hover:text-indigo-600 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`p-1.5 rounded-lg ${
                                isActive('/reports') ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              <BarChart3 className="w-4 h-4" />
                            </div>
                            <span>Reports</span>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-400" />
                        </Link>
                      )}
                    </>
                  )}
                </div>

                {/* Mobile Sign Out Button */}
                {user && (
                  <div className="pt-2 border-t border-slate-100">
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        handleLogout();
                      }}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200/80 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </header>

      {/* Main Content */}
      <main className={isLandingPage ? 'flex-1 w-full' : 'flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8'}>
        <Outlet />
      </main>

      {/* Standard App Footer for Inner Pages (Landing page renders its own comprehensive footer) */}
      {!isLandingPage && (
        <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Tenant & Property Management System. All rights reserved.</p>
        </footer>
      )}
    </div>
  );
};
