import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Activity, Dumbbell, AlertTriangle, Users, ClipboardList,
  FileBarChart, Bell, Settings, ChevronLeft, ShieldCheck, LogOut,
  Building2, TrendingUp, UserCheck, X, Menu
} from 'lucide-react';
import { cn, getInitials } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
}

const navByRole: Record<string, NavItem[]> = {
  WORKER: [
    { label: 'Dashboard', href: '/worker/dashboard', icon: LayoutDashboard },
    { label: 'Daily Check-in', href: '/worker/checkin', icon: Activity },
    { label: 'My Programs', href: '/worker/programs', icon: Dumbbell },
    { label: 'History', href: '/worker/history', icon: TrendingUp },
    { label: 'Notifications', href: '/worker/notifications', icon: Bell },
  ],
  THERAPIST: [
    { label: 'Dashboard', href: '/therapist/dashboard', icon: LayoutDashboard },
    { label: 'Workers', href: '/therapist/workers', icon: Users },
    { label: 'Programs', href: '/therapist/programs', icon: Dumbbell },
    { label: 'Escalations', href: '/therapist/escalations', icon: AlertTriangle },
    { label: 'Incidents', href: '/therapist/incidents', icon: ClipboardList },
    { label: 'Notifications', href: '/therapist/notifications', icon: Bell },
  ],
  SAFETY_MANAGER: [
    { label: 'Dashboard', href: '/safety/dashboard', icon: LayoutDashboard },
    { label: 'Risk Intelligence', href: '/safety/risk', icon: TrendingUp },
    { label: 'Departments', href: '/safety/departments', icon: Building2 },
    { label: 'Incidents', href: '/safety/incidents', icon: ClipboardList },
    { label: 'OSHA Reports', href: '/safety/reports', icon: FileBarChart },
    { label: 'Alerts', href: '/safety/alerts', icon: AlertTriangle },
  ],
  HR_ADMIN: [
    { label: 'Dashboard', href: '/hr/dashboard', icon: LayoutDashboard },
    { label: 'Employee Roster', href: '/hr/employees', icon: Users },
    { label: 'Departments', href: '/hr/departments', icon: Building2 },
    { label: 'Invites', href: '/hr/invites', icon: UserCheck },
  ],
  COMPANY_ADMIN: [
    { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Overview', href: '/admin/overview', icon: TrendingUp },
    { label: 'Users', href: '/admin/users', icon: Users },
    { label: 'Departments', href: '/admin/departments', icon: Building2 },
    { label: 'Billing', href: '/admin/billing', icon: FileBarChart },
    { label: 'Settings', href: '/admin/settings', icon: Settings },
    { label: 'Audit Log', href: '/admin/audit', icon: ClipboardList },
  ],
};

interface AppSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  isMobileOpen: boolean;
  onMobileClose: () => void;
}

export function AppSidebar({ collapsed, onToggle, isMobileOpen, onMobileClose }: AppSidebarProps) {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = navByRole[user?.role || 'WORKER'] || [];

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // ignore
    }
    logout();
    navigate('/login');
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={cn(
        'flex items-center h-16 px-4 border-b',
        collapsed ? 'justify-center' : 'justify-between'
      )}>
        {!collapsed && (
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 gradient-brand rounded-lg flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-gray-900">WorkSafe</span>
          </Link>
        )}
        {collapsed && (
          <div className="w-8 h-8 gradient-brand rounded-lg flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
        )}
        <button
          onClick={onToggle}
          className="hidden lg:flex w-7 h-7 rounded-lg border bg-white hover:bg-gray-50 items-center justify-center text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ChevronLeft className={cn('w-4 h-4 transition-transform', collapsed && 'rotate-180')} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 scrollbar-thin">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href || location.pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              to={item.href}
              onClick={onMobileClose}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-brand-50 text-brand-700 border border-brand-100'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
                collapsed && 'justify-center px-2'
              )}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className={cn('shrink-0', isActive ? 'w-5 h-5 text-brand-600' : 'w-5 h-5')} />
              {!collapsed && (
                <span className="flex-1">{item.label}</span>
              )}
              {!collapsed && item.badge && item.badge > 0 && (
                <Badge variant="destructive" className="text-xs h-5 w-5 p-0 flex items-center justify-center rounded-full">
                  {item.badge}
                </Badge>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="border-t p-3">
        <div className={cn(
          'flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors',
          collapsed && 'justify-center'
        )}>
          <Avatar className="w-8 h-8 shrink-0">
            <AvatarImage src={user?.avatarUrl} />
            <AvatarFallback className="gradient-brand text-white text-xs">
              {user ? getInitials(user.firstName, user.lastName) : 'U'}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-gray-500 truncate capitalize">
                {user?.role?.replace('_', ' ').toLowerCase()}
              </p>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={handleLogout}
              className="text-gray-400 hover:text-red-500 transition-colors"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <motion.aside
        className={cn(
          'hidden lg:flex flex-col fixed left-0 top-0 h-full bg-white border-r z-40 transition-all duration-300',
          collapsed ? 'w-16' : 'w-60'
        )}
        animate={{ width: collapsed ? 64 : 240 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
      >
        {sidebarContent}
      </motion.aside>

      {/* Mobile overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            <motion.div
              className="lg:hidden fixed inset-0 bg-black/40 z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onMobileClose}
            />
            <motion.aside
              className="lg:hidden fixed left-0 top-0 h-full w-72 bg-white border-r z-50 flex flex-col"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            >
              <div className="absolute top-4 right-4">
                <Button variant="ghost" size="icon" onClick={onMobileClose}>
                  <X className="w-5 h-5" />
                </Button>
              </div>
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

export function TopBar({ onMobileMenuOpen, collapsed }: { onMobileMenuOpen: () => void; collapsed: boolean }) {
  const { user } = useAuthStore();

  return (
    <header className={cn(
      'fixed top-0 right-0 h-16 bg-white/80 backdrop-blur-md border-b z-30 flex items-center justify-between px-4 sm:px-6 transition-all duration-300',
      collapsed ? 'left-16' : 'left-0 lg:left-60'
    )}>
      <button
        className="lg:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-600"
        onClick={onMobileMenuOpen}
      >
        <Menu className="w-5 h-5" />
      </button>

      <div className="flex-1" />

      <div className="flex items-center gap-3">
        <button className="relative p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>
        <Avatar className="w-8 h-8 cursor-pointer">
          <AvatarImage src={user?.avatarUrl} />
          <AvatarFallback className="gradient-brand text-white text-xs">
            {user ? getInitials(user.firstName, user.lastName) : 'U'}
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
