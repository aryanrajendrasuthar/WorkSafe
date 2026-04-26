import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { ShieldCheck, Eye, EyeOff, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';

interface InviteDetails {
  email: string;
  role: string;
  organizationName: string;
}

const schema = z.object({
  firstName: z.string().min(2, 'Required'),
  lastName: z.string().min(2, 'Required'),
  password: z.string().min(8, 'Minimum 8 characters'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type FormData = z.infer<typeof schema>;

export default function InviteAccept() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const queryClient = useQueryClient();
  const [invite, setInvite] = useState<InviteDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [inviteError, setInviteError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (!token) return;
    api.get(`/auth/invite/${token}`)
      .then((res) => setInvite(res.data.data))
      .catch(() => setInviteError('This invite link is invalid or has expired.'))
      .finally(() => setLoading(false));
  }, [token]);

  const onSubmit = async (data: FormData) => {
    setSubmitError('');
    try {
      const res = await api.post('/auth/invite/accept', {
        token,
        firstName: data.firstName,
        lastName: data.lastName,
        password: data.password,
      });
      const { user, tokens } = res.data.data;
      queryClient.clear();
      setAuth(user, tokens.accessToken, tokens.refreshToken);

      const roleRoutes: Record<string, string> = {
        WORKER: '/onboarding',
        THERAPIST: '/therapist/dashboard',
        SAFETY_MANAGER: '/safety/dashboard',
        HR_ADMIN: '/hr/dashboard',
        COMPANY_ADMIN: '/admin/dashboard',
      };
      const dest = (!user.isOnboarded && user.role === 'WORKER')
        ? '/onboarding'
        : roleRoutes[user.role] ?? '/';
      navigate(dest);
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setSubmitError(message || 'Failed to accept invite.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
      </div>
    );
  }

  if (inviteError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Invalid Invite</h2>
          <p className="text-gray-600 mb-6">{inviteError}</p>
          <Link to="/login">
            <Button variant="outline">Go to sign in</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="bg-white rounded-2xl shadow-xl border p-8">
          <div className="text-center mb-8">
            <div className="w-12 h-12 gradient-brand rounded-2xl flex items-center justify-center mx-auto mb-4">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div className="inline-flex items-center gap-1.5 text-xs bg-green-50 text-green-700 border border-green-200 rounded-full px-3 py-1 mb-3">
              <CheckCircle2 className="w-3.5 h-3.5" />
              You're invited!
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              Join {invite?.organizationName}
            </h1>
            <p className="text-gray-600 mt-1 text-sm">
              You've been invited as <span className="font-semibold capitalize">{invite?.role?.replace('_', ' ').toLowerCase()}</span>
            </p>
            {invite?.email && (
              <p className="text-xs text-gray-500 mt-1">
                Signing up as <span className="font-medium">{invite.email}</span>
              </p>
            )}
          </div>

          {submitError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
              <AlertCircle className="w-4 h-4" />
              {submitError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="firstName">First name</Label>
                <Input id="firstName" placeholder="John" {...register('firstName')} />
                {errors.firstName && <p className="text-xs text-red-500">{errors.firstName.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lastName">Last name</Label>
                <Input id="lastName" placeholder="Doe" {...register('lastName')} />
                {errors.lastName && <p className="text-xs text-red-500">{errors.lastName.message}</p>}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Create password</Label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min. 8 characters"
                  {...register('password')}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label>Confirm password</Label>
              <Input type="password" placeholder="Repeat password" {...register('confirmPassword')} />
              {errors.confirmPassword && <p className="text-xs text-red-500">{errors.confirmPassword.message}</p>}
            </div>

            <Button type="submit" variant="brand" size="lg" className="w-full" loading={isSubmitting}>
              Accept invite & join WorkSafe
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
