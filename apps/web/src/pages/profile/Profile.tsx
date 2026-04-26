import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { User, Mail, Shield, Building2, Briefcase, Camera, Save, KeyRound, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { getInitials } from '@/lib/utils';

const profileSchema = z.object({
  firstName: z.string().min(1, 'Required'),
  lastName: z.string().min(1, 'Required'),
  avatarUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Required'),
  newPassword: z.string().min(8, 'Minimum 8 characters'),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type ProfileForm = z.infer<typeof profileSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;

const ROLE_LABELS: Record<string, string> = {
  WORKER: 'Worker',
  THERAPIST: 'Therapist',
  SAFETY_MANAGER: 'Safety Manager',
  HR_ADMIN: 'HR Admin',
  COMPANY_ADMIN: 'Company Admin',
};

const ROLE_COLORS: Record<string, string> = {
  WORKER: 'bg-blue-100 text-blue-700',
  THERAPIST: 'bg-green-100 text-green-700',
  SAFETY_MANAGER: 'bg-orange-100 text-orange-700',
  HR_ADMIN: 'bg-purple-100 text-purple-700',
  COMPANY_ADMIN: 'bg-brand-100 text-brand-700',
};

export default function ProfilePage() {
  const { user, setUser } = useAuthStore();
  const queryClient = useQueryClient();
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ['users', 'me'],
    queryFn: () => api.get('/users/me').then((r) => r.data.data),
    initialData: user,
  });

  const { register: regProfile, handleSubmit: handleProfile, formState: { errors: profileErrors, isSubmitting: savingProfile } } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    values: { firstName: profile?.firstName ?? '', lastName: profile?.lastName ?? '', avatarUrl: profile?.avatarUrl ?? '' },
  });

  const { register: regPassword, handleSubmit: handlePassword, reset: resetPassword, formState: { errors: passwordErrors, isSubmitting: savingPassword } } = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
  });

  const updateMutation = useMutation({
    mutationFn: (data: ProfileForm) => api.patch('/users/me', { firstName: data.firstName, lastName: data.lastName, avatarUrl: data.avatarUrl || undefined }),
    onSuccess: (res) => {
      const updated = res.data.data ?? res.data;
      if (user) setUser({ ...user, firstName: updated.firstName, lastName: updated.lastName, avatarUrl: updated.avatarUrl });
      queryClient.invalidateQueries({ queryKey: ['users', 'me'] });
      toast.success('Profile updated');
    },
    onError: () => toast.error('Failed to update profile'),
  });

  const onSaveProfile = (data: ProfileForm) => updateMutation.mutate(data);

  const onChangePassword = async (data: PasswordForm) => {
    try {
      await api.post('/auth/change-password', { currentPassword: data.currentPassword, newPassword: data.newPassword });
      setPasswordSuccess(true);
      resetPassword();
      setTimeout(() => setPasswordSuccess(false), 4000);
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Failed to change password';
      toast.error(msg);
    }
  };

  const roleLabel = ROLE_LABELS[profile?.role ?? ''] ?? profile?.role ?? '';
  const roleColor = ROLE_COLORS[profile?.role ?? ''] ?? 'bg-gray-100 text-gray-700';
  const initials = user ? getInitials(user.firstName, user.lastName) : 'U';

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-10">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Profile</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Manage your personal information</p>
      </motion.div>

      {/* Avatar + role card */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-5">
              <div className="relative">
                <Avatar className="w-20 h-20">
                  <AvatarImage src={profile?.avatarUrl} />
                  <AvatarFallback className="gradient-brand text-white text-2xl font-bold">{initials}</AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-white dark:bg-gray-800 rounded-full border-2 border-gray-200 dark:border-gray-700 flex items-center justify-center">
                  <Camera className="w-3.5 h-3.5 text-gray-500" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                  {profile?.firstName} {profile?.lastName}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{profile?.email}</p>
                <div className="mt-2 flex items-center gap-2 flex-wrap">
                  <Badge className={`text-xs font-medium ${roleColor}`}>{roleLabel}</Badge>
                  {profile?.department?.name && (
                    <Badge variant="outline" className="text-xs">
                      <Building2 className="w-3 h-3 mr-1" />{profile.department.name}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Edit profile */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <User className="w-4 h-4 text-brand-600" /> Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleProfile(onSaveProfile)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="firstName">First name</Label>
                  <Input id="firstName" {...regProfile('firstName')} />
                  {profileErrors.firstName && <p className="text-xs text-red-500">{profileErrors.firstName.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="lastName">Last name</Label>
                  <Input id="lastName" {...regProfile('lastName')} />
                  {profileErrors.lastName && <p className="text-xs text-red-500">{profileErrors.lastName.message}</p>}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> Email</Label>
                <Input value={profile?.email ?? ''} disabled className="bg-gray-50 dark:bg-gray-800 text-gray-500" />
                <p className="text-xs text-gray-400">Email cannot be changed. Contact your admin if needed.</p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="avatarUrl" className="flex items-center gap-1.5"><Camera className="w-3.5 h-3.5" /> Avatar URL</Label>
                <Input id="avatarUrl" placeholder="https://example.com/photo.jpg" {...regProfile('avatarUrl')} />
                {profileErrors.avatarUrl && <p className="text-xs text-red-500">{profileErrors.avatarUrl.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5" /> Role</Label>
                <Input value={roleLabel} disabled className="bg-gray-50 dark:bg-gray-800 text-gray-500" />
              </div>

              {profile?.jobProfile && (
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5"><Briefcase className="w-3.5 h-3.5" /> Job title</Label>
                  <Input value={profile.jobProfile.title ?? ''} disabled className="bg-gray-50 dark:bg-gray-800 text-gray-500" />
                </div>
              )}

              <Button type="submit" disabled={savingProfile || updateMutation.isPending} className="w-full">
                <Save className="w-4 h-4 mr-2" />
                {savingProfile || updateMutation.isPending ? 'Saving…' : 'Save changes'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>

      {/* Change password */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-brand-600" /> Change Password
            </CardTitle>
          </CardHeader>
          <CardContent>
            {passwordSuccess && (
              <div className="mb-4 flex items-center gap-2 text-green-600 bg-green-50 dark:bg-green-900/20 rounded-lg px-3 py-2 text-sm font-medium">
                <CheckCircle2 className="w-4 h-4" /> Password changed successfully
              </div>
            )}
            <form onSubmit={handlePassword(onChangePassword)} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="currentPassword">Current password</Label>
                <div className="relative">
                  <Input id="currentPassword" type={showCurrent ? 'text' : 'password'} {...regPassword('currentPassword')} />
                  <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {passwordErrors.currentPassword && <p className="text-xs text-red-500">{passwordErrors.currentPassword.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="newPassword">New password</Label>
                <div className="relative">
                  <Input id="newPassword" type={showNew ? 'text' : 'password'} {...regPassword('newPassword')} />
                  <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {passwordErrors.newPassword && <p className="text-xs text-red-500">{passwordErrors.newPassword.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword">Confirm new password</Label>
                <div className="relative">
                  <Input id="confirmPassword" type={showConfirm ? 'text' : 'password'} {...regPassword('confirmPassword')} />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {passwordErrors.confirmPassword && <p className="text-xs text-red-500">{passwordErrors.confirmPassword.message}</p>}
              </div>

              <Button type="submit" variant="outline" disabled={savingPassword} className="w-full">
                {savingPassword ? 'Changing…' : 'Change password'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>

      {/* Account info */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="w-4 h-4 text-brand-600" /> Account Info
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Member since</dt>
                <dd className="font-medium text-gray-900 dark:text-white">
                  {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '—'}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Last login</dt>
                <dd className="font-medium text-gray-900 dark:text-white">
                  {profile?.lastLoginAt ? new Date(profile.lastLoginAt).toLocaleString() : '—'}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Account status</dt>
                <dd><Badge className="bg-green-100 text-green-700 text-xs">Active</Badge></dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
