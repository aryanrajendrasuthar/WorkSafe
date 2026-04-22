import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Home, ClipboardCheck, Dumbbell, Target, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';
import { AppSidebar, TopBar } from './AppSidebar';

const WORKER_BOTTOM_NAV = [
  { to: '/worker/dashboard', icon: Home, label: 'Home' },
  { to: '/worker/checkin', icon: ClipboardCheck, label: 'Check-in' },
  { to: '/worker/exercises', icon: Dumbbell, label: 'Exercises' },
  { to: '/worker/programs', icon: Target, label: 'Programs' },
  { to: '/worker/notifications', icon: Bell, label: 'Alerts' },
];

function WorkerBottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 lg:hidden">
      <div className="flex items-center justify-around px-2 py-1 safe-area-pb">
        {WORKER_BOTTOM_NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-colors min-w-0',
                isActive ? 'text-brand-600' : 'text-gray-400 hover:text-gray-600',
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon className={cn('w-5 h-5 transition-transform', isActive && 'scale-110')} />
                <span className="text-[10px] font-medium truncate">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

export function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const user = useAuthStore((s) => s.user);
  const isWorker = user?.role === 'WORKER';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <AppSidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed(!collapsed)}
        isMobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      <div className={cn('transition-all duration-300', collapsed ? 'lg:ml-16' : 'lg:ml-60')}>
        <TopBar onMobileMenuOpen={() => setMobileOpen(true)} collapsed={collapsed} />
        <main id="main-content" className="pt-16 min-h-screen">
          <div className={cn('p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto', isWorker && 'pb-24 lg:pb-8')}>
            <Outlet />
          </div>
        </main>
      </div>

      {isWorker && <WorkerBottomNav />}
    </div>
  );
}
