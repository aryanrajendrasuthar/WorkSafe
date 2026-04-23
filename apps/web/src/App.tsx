import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { queryClient } from './lib/queryClient';
import { ProtectedRoute } from './router/ProtectedRoute';
import { AppLayout } from './components/layout/AppLayout';
import { useAuthStore } from './store/auth.store';

// Public pages (kept eager — tiny, always needed)
import Landing from './pages/Landing';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import InviteAccept from './pages/auth/InviteAccept';
import GoogleCallback from './pages/auth/GoogleCallback';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';

// Worker pages — lazy loaded
const WorkerDashboard = lazy(() => import('./pages/worker/Dashboard'));
const Onboarding = lazy(() => import('./pages/worker/Onboarding'));
const Checkin = lazy(() => import('./pages/worker/Checkin'));
const ExercisesPage = lazy(() => import('./pages/worker/Exercises'));
const ProgramsPage = lazy(() => import('./pages/worker/Programs'));
const WorkerHistory = lazy(() => import('./pages/worker/History'));
const WorkerNotifications = lazy(() => import('./pages/worker/Notifications'));

// Therapist pages — lazy loaded
const TherapistDashboard = lazy(() => import('./pages/therapist/Dashboard'));
const TherapistWorkers = lazy(() => import('./pages/therapist/Workers'));
const WorkerDetail = lazy(() => import('./pages/therapist/WorkerDetail'));
const TherapistPrograms = lazy(() => import('./pages/therapist/Programs'));
const ProgramBuilder = lazy(() => import('./pages/therapist/ProgramBuilder'));
const TherapistIncidents = lazy(() => import('./pages/therapist/Incidents'));
const IncidentDetail = lazy(() => import('./pages/therapist/IncidentDetail'));
const TherapistEscalations = lazy(() => import('./pages/therapist/Escalations'));
const TherapistNotifications = lazy(() => import('./pages/therapist/Notifications'));

// Safety Manager pages — lazy loaded
const SafetyDashboard = lazy(() => import('./pages/safety-manager/Dashboard'));
const SafetyDepartments = lazy(() => import('./pages/safety-manager/Departments'));
const DepartmentDetail = lazy(() => import('./pages/safety-manager/DepartmentDetail'));
const SafetyAlerts = lazy(() => import('./pages/safety-manager/Alerts'));
const SafetyIncidents = lazy(() => import('./pages/safety-manager/Incidents'));
const OshaReports = lazy(() => import('./pages/safety-manager/OshaReports'));

// HR Admin pages — lazy loaded
const HRDashboard = lazy(() => import('./pages/hr-admin/Dashboard'));
const HREmployees = lazy(() => import('./pages/hr-admin/Employees'));
const HRDepartments = lazy(() => import('./pages/hr-admin/DepartmentsPage'));
const HRInvites = lazy(() => import('./pages/hr-admin/Invites'));

// Company Admin pages — lazy loaded
const CompanyAdminDashboard = lazy(() => import('./pages/company-admin/Dashboard'));
const AdminUsers = lazy(() => import('./pages/company-admin/Users'));
const AuditLogPage = lazy(() => import('./pages/company-admin/AuditLog'));
const BillingPage = lazy(() => import('./pages/company-admin/Billing'));
const CompanySettings = lazy(() => import('./pages/company-admin/Settings'));

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[40vh]">
      <div className="space-y-3 w-full max-w-sm">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" style={{ animationDelay: `${i * 100}ms` }} />
        ))}
      </div>
    </div>
  );
}

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
        {/* Skip to content — accessibility */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:bg-brand-600 focus:text-white focus:px-4 focus:py-2 focus:rounded-lg focus:text-sm focus:font-medium"
        >
          Skip to content
        </a>

        <Routes>
          {/* Public */}
          <Route path="/" element={<RootRedirect />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/invite/:token" element={<InviteAccept />} />
          <Route path="/auth/google/callback" element={<GoogleCallback />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />

          {/* Onboarding */}
          <Route
            path="/onboarding"
            element={
              <ProtectedRoute allowedRoles={['WORKER']}>
                <Suspense fallback={<PageLoader />}>
                  <Onboarding />
                </Suspense>
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
            <Route path="dashboard" element={<Suspense fallback={<PageLoader />}><WorkerDashboard /></Suspense>} />
            <Route path="checkin" element={<Suspense fallback={<PageLoader />}><Checkin /></Suspense>} />
            <Route path="exercises" element={<Suspense fallback={<PageLoader />}><ExercisesPage /></Suspense>} />
            <Route path="programs" element={<Suspense fallback={<PageLoader />}><ProgramsPage /></Suspense>} />
            <Route path="history" element={<Suspense fallback={<PageLoader />}><WorkerHistory /></Suspense>} />
            <Route path="notifications" element={<Suspense fallback={<PageLoader />}><WorkerNotifications /></Suspense>} />
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
            <Route path="dashboard" element={<Suspense fallback={<PageLoader />}><TherapistDashboard /></Suspense>} />
            <Route path="workers" element={<Suspense fallback={<PageLoader />}><TherapistWorkers /></Suspense>} />
            <Route path="workers/:id" element={<Suspense fallback={<PageLoader />}><WorkerDetail /></Suspense>} />
            <Route path="programs" element={<Suspense fallback={<PageLoader />}><TherapistPrograms /></Suspense>} />
            <Route path="programs/new" element={<Suspense fallback={<PageLoader />}><ProgramBuilder /></Suspense>} />
            <Route path="incidents" element={<Suspense fallback={<PageLoader />}><TherapistIncidents /></Suspense>} />
            <Route path="incidents/:id" element={<Suspense fallback={<PageLoader />}><IncidentDetail /></Suspense>} />
            <Route path="escalations" element={<Suspense fallback={<PageLoader />}><TherapistEscalations /></Suspense>} />
            <Route path="notifications" element={<Suspense fallback={<PageLoader />}><TherapistNotifications /></Suspense>} />
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
            <Route path="dashboard" element={<Suspense fallback={<PageLoader />}><SafetyDashboard /></Suspense>} />
            <Route path="departments" element={<Suspense fallback={<PageLoader />}><SafetyDepartments /></Suspense>} />
            <Route path="departments/:id" element={<Suspense fallback={<PageLoader />}><DepartmentDetail /></Suspense>} />
            <Route path="risk" element={<Navigate to="/safety/dashboard" replace />} />
            <Route path="alerts" element={<Suspense fallback={<PageLoader />}><SafetyAlerts /></Suspense>} />
            <Route path="incidents" element={<Suspense fallback={<PageLoader />}><SafetyIncidents /></Suspense>} />
            <Route path="reports" element={<Suspense fallback={<PageLoader />}><OshaReports /></Suspense>} />
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
            <Route path="dashboard" element={<Suspense fallback={<PageLoader />}><HRDashboard /></Suspense>} />
            <Route path="employees" element={<Suspense fallback={<PageLoader />}><HREmployees /></Suspense>} />
            <Route path="departments" element={<Suspense fallback={<PageLoader />}><HRDepartments /></Suspense>} />
            <Route path="invites" element={<Suspense fallback={<PageLoader />}><HRInvites /></Suspense>} />
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
            <Route path="dashboard" element={<Suspense fallback={<PageLoader />}><CompanyAdminDashboard /></Suspense>} />
            <Route path="users" element={<Suspense fallback={<PageLoader />}><AdminUsers /></Suspense>} />
            <Route path="departments" element={<Suspense fallback={<PageLoader />}><HRDepartments /></Suspense>} />
            <Route path="billing" element={<Suspense fallback={<PageLoader />}><BillingPage /></Suspense>} />
            <Route path="settings" element={<Suspense fallback={<PageLoader />}><CompanySettings /></Suspense>} />
            <Route path="audit" element={<Suspense fallback={<PageLoader />}><AuditLogPage /></Suspense>} />
            <Route path="overview" element={<Navigate to="/safety/dashboard" replace />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster position="top-right" richColors />
      </BrowserRouter>
    </QueryClientProvider>
  );
}
