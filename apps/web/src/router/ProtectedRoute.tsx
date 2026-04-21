import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={getDashboardForRole(user.role)} replace />;
  }

  return <>{children}</>;
}

function getDashboardForRole(role: string) {
  switch (role) {
    case 'WORKER': return '/worker/dashboard';
    case 'THERAPIST': return '/therapist/dashboard';
    case 'SAFETY_MANAGER': return '/safety/dashboard';
    case 'HR_ADMIN': return '/hr/dashboard';
    case 'COMPANY_ADMIN': return '/admin/dashboard';
    default: return '/';
  }
}
