import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';

export default function GoogleCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const queryClient = useQueryClient();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const accessToken = searchParams.get('accessToken');
    const refreshToken = searchParams.get('refreshToken');

    if (!accessToken || !refreshToken) {
      navigate('/login?error=google_failed');
      return;
    }

    api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;

    api.get('/auth/me')
      .then((res) => {
        const user = res.data.data ?? res.data;
        queryClient.clear();
        setAuth(user, accessToken, refreshToken);

        if (!user.isOnboarded && user.role === 'WORKER') {
          navigate('/onboarding', { replace: true });
          return;
        }

        const dashboardMap: Record<string, string> = {
          WORKER: '/worker/dashboard',
          THERAPIST: '/therapist/dashboard',
          SAFETY_MANAGER: '/safety/dashboard',
          HR_ADMIN: '/hr/dashboard',
          COMPANY_ADMIN: '/admin/dashboard',
        };
        navigate(dashboardMap[user.role] ?? '/worker/dashboard', { replace: true });
      })
      .catch(() => {
        navigate('/login?error=google_failed');
      });
  }, [searchParams, navigate, setAuth]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-14 h-14 gradient-brand rounded-2xl flex items-center justify-center mx-auto animate-pulse">
          <ShieldCheck className="w-8 h-8 text-white" />
        </div>
        <p className="text-gray-600 font-medium">Signing you in with Google…</p>
      </div>
    </div>
  );
}
