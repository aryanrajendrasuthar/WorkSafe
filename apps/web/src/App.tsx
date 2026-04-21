import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { queryClient } from './lib/queryClient';
import { ProtectedRoute } from './router/ProtectedRoute';
import { AppLayout } from './components/layout/AppLayout';
import { useAuthStore } from './store/auth.store';

// Public pages
import Landing from './pages/Landing';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import InviteAccept from './pages/auth/InviteAccept';

// Worker pages
import WorkerDashboard from './pages/worker/Dashboard';
import Onboarding from './pages/worker/Onboarding';

// Therapist pages
import TherapistDashboard from './pages/therapist/Dashboard';

// Safety Manager pages
import SafetyDashboard from './pages/safety-manager/Dashboard';

// HR Admin pages
import HRDashboard from './pages/hr-admin/Dashboard';

// Company Admin pages
import CompanyAdminDashboard from './pages/company-admin/Dashboard';

function RootRedirect() {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated || !user) return <Landing />;

  if (!user.isOnboarded && user.role === 'WORKER') return <Navigate to="/onboarding" replace />;

  switch (user.role) {
    case 'WORKER': return <Navigate to="/worker/dashboard" replace />;
    case 'THERAPIST': return <Navigate to="/therapist/dashboard" replace />;
    case 'SAFETY_MANAGER': return <Navigate to="/safety/dashboard" replace />;
    case 'HR_ADMIN': return <Navigate to="/hr/dashboard" replace />;
    case 'COMPANY_ADMIN': return <Navigate to="/admin/dashboard" replace />;
    default: return <Landing />;
  }
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/" element={<RootRedirect />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/invite/:token" element={<InviteAccept />} />

          {/* Onboarding (requires auth, before main layout) */}
          <Route
            path="/onboarding"
            element={
              <ProtectedRoute allowedRoles={['WORKER']}>
                <Onboarding />
              </ProtectedRoute>
            }
          />

          {/* Worker routes */}
          <Route
            path="/worker"
            element={
              <ProtectedRoute allowedRoles={['WORKER']}>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="dashboard" element={<WorkerDashboard />} />
            <Route path="checkin" element={<div className="p-8 text-center text-gray-500">Check-in — Coming in Sprint 2</div>} />
            <Route path="programs" element={<div className="p-8 text-center text-gray-500">Programs — Coming in Sprint 2</div>} />
            <Route path="history" element={<div className="p-8 text-center text-gray-500">History — Coming in Sprint 2</div>} />
            <Route path="notifications" element={<div className="p-8 text-center text-gray-500">Notifications — Coming in Sprint 2</div>} />
          </Route>

          {/* Therapist routes */}
          <Route
            path="/therapist"
            element={
              <ProtectedRoute allowedRoles={['THERAPIST']}>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="dashboard" element={<TherapistDashboard />} />
            <Route path="workers" element={<div className="p-8 text-center text-gray-500">Workers — Coming in Sprint 3</div>} />
            <Route path="programs" element={<div className="p-8 text-center text-gray-500">Programs — Coming in Sprint 3</div>} />
            <Route path="escalations" element={<div className="p-8 text-center text-gray-500">Escalations — Coming in Sprint 3</div>} />
            <Route path="incidents" element={<div className="p-8 text-center text-gray-500">Incidents — Coming in Sprint 3</div>} />
            <Route path="notifications" element={<div className="p-8 text-center text-gray-500">Notifications — Coming in Sprint 3</div>} />
          </Route>

          {/* Safety Manager routes */}
          <Route
            path="/safety"
            element={
              <ProtectedRoute allowedRoles={['SAFETY_MANAGER', 'COMPANY_ADMIN']}>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="dashboard" element={<SafetyDashboard />} />
            <Route path="risk" element={<div className="p-8 text-center text-gray-500">Risk Intelligence — Coming in Sprint 4</div>} />
            <Route path="departments" element={<div className="p-8 text-center text-gray-500">Departments — Coming in Sprint 4</div>} />
            <Route path="incidents" element={<div className="p-8 text-center text-gray-500">Incidents — Coming in Sprint 5</div>} />
            <Route path="reports" element={<div className="p-8 text-center text-gray-500">OSHA Reports — Coming in Sprint 5</div>} />
            <Route path="alerts" element={<div className="p-8 text-center text-gray-500">Alerts — Coming in Sprint 4</div>} />
          </Route>

          {/* HR Admin routes */}
          <Route
            path="/hr"
            element={
              <ProtectedRoute allowedRoles={['HR_ADMIN', 'COMPANY_ADMIN']}>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="dashboard" element={<HRDashboard />} />
            <Route path="employees" element={<div className="p-8 text-center text-gray-500">Employees — Coming in Sprint 5</div>} />
            <Route path="departments" element={<div className="p-8 text-center text-gray-500">Departments — Coming in Sprint 5</div>} />
            <Route path="invites" element={<div className="p-8 text-center text-gray-500">Invites — Coming in Sprint 5</div>} />
          </Route>

          {/* Company Admin routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['COMPANY_ADMIN']}>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="dashboard" element={<CompanyAdminDashboard />} />
            <Route path="users" element={<div className="p-8 text-center text-gray-500">Users — Coming in Sprint 5</div>} />
            <Route path="departments" element={<div className="p-8 text-center text-gray-500">Departments — Coming in Sprint 5</div>} />
            <Route path="billing" element={<div className="p-8 text-center text-gray-500">Billing — Coming in Sprint 5</div>} />
            <Route path="settings" element={<div className="p-8 text-center text-gray-500">Settings — Coming in Sprint 5</div>} />
            <Route path="audit" element={<div className="p-8 text-center text-gray-500">Audit Log — Coming in Sprint 5</div>} />
            <Route path="overview" element={<SafetyDashboard />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster position="top-right" richColors />
      </BrowserRouter>
    </QueryClientProvider>
  );
}
