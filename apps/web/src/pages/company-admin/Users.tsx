import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Search, Lock, Users, UserX, UserCheck } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { queryClient } from '@/lib/queryClient';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

const PROTECTED_EMAIL = 'aryanrajendrasuthar@gmail.com';

const ROLES = ['WORKER', 'THERAPIST', 'SAFETY_MANAGER', 'HR_ADMIN', 'COMPANY_ADMIN'] as const;
type Role = typeof ROLES[number];

const ROLE_LABELS: Record<Role, string> = {
  WORKER: 'Worker',
  THERAPIST: 'Therapist',
  SAFETY_MANAGER: 'Safety Manager',
  HR_ADMIN: 'HR Admin',
  COMPANY_ADMIN: 'Company Admin',
};

const ROLE_COLORS: Record<string, string> = {
  WORKER: 'bg-blue-100 text-blue-700',
  THERAPIST: 'bg-purple-100 text-purple-700',
  SAFETY_MANAGER: 'bg-orange-100 text-orange-700',
  HR_ADMIN: 'bg-green-100 text-green-700',
  COMPANY_ADMIN: 'bg-gray-800 text-white',
};

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  isActive: boolean;
  isOnboarded: boolean;
  lastLoginAt: string | null;
  department: { id: string; name: string } | null;
  jobProfile: { title: string } | null;
}

export default function AdminUsers() {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [pendingRole, setPendingRole] = useState<Record<string, Role>>({});

  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ['admin', 'users'],
    queryFn: () => api.get('/hr/users').then((r) => r.data.data),
  });

  const roleChangeMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) =>
      api.patch(`/hr/users/${id}/role`, { role }),
    onSuccess: (_data, { id }) => {
      toast.success('Role updated successfully');
      setPendingRole((p) => { const n = { ...p }; delete n[id]; return n; });
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? 'Failed to update role';
      toast.error(msg);
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/hr/users/${id}/deactivate`),
    onSuccess: () => { toast.success('User deactivated'); queryClient.invalidateQueries({ queryKey: ['admin', 'users'] }); },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Failed'),
  });

  const reactivateMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/hr/users/${id}/reactivate`),
    onSuccess: () => { toast.success('User reactivated'); queryClient.invalidateQueries({ queryKey: ['admin', 'users'] }); },
    onError: () => toast.error('Failed'),
  });

  const filtered = users.filter((u) => {
    const name = `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase();
    return (!search || name.includes(search.toLowerCase())) && (!roleFilter || u.role === roleFilter);
  });

  const isProtected = (u: User) => u.email.toLowerCase() === PROTECTED_EMAIL;

  return (
    <div className="space-y-5">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Team Members</h1>
          <p className="text-gray-500 text-sm">{users.length} total · manage roles and access</p>
        </div>
      </motion.div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-300"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {(['', ...ROLES] as string[]).map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={cn('px-3 py-2 text-xs rounded-xl border transition-all font-medium',
                roleFilter === r ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 text-gray-500 hover:border-gray-400')}
            >
              {r ? ROLE_LABELS[r as Role] : 'All'}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-2">{[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="py-16 text-center text-gray-400"><Users className="w-10 h-10 mx-auto mb-2 opacity-40" /><p>No users found</p></CardContent></Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((u, i) => {
            const locked = isProtected(u);
            const selected = pendingRole[u.id] ?? u.role;
            const hasChange = selected !== u.role;

            return (
              <motion.div key={u.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}>
                <Card className={cn(!u.isActive && 'opacity-50', locked && 'ring-1 ring-brand-200')}>
                  <CardContent className="p-4 flex items-center gap-3 flex-wrap sm:flex-nowrap">
                    {/* Avatar */}
                    <Avatar className="w-9 h-9 shrink-0">
                      <AvatarFallback className="text-sm font-semibold bg-gray-100 text-gray-600">
                        {u.firstName[0]}{u.lastName[0]}
                      </AvatarFallback>
                    </Avatar>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-gray-900 text-sm">{u.firstName} {u.lastName}</p>
                        {locked && (
                          <span className="flex items-center gap-1 text-[10px] bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full border border-brand-200">
                            <Lock className="w-2.5 h-2.5" /> Primary Admin
                          </span>
                        )}
                        {!u.isActive && <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Inactive</span>}
                        {!u.isOnboarded && u.role === 'WORKER' && <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Not onboarded</span>}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {u.email}
                        {u.department && ` · ${u.department.name}`}
                        {u.jobProfile?.title && ` · ${u.jobProfile.title}`}
                      </p>
                    </div>

                    {/* Role selector */}
                    <div className="flex items-center gap-2 shrink-0">
                      {locked ? (
                        <span className={`text-xs px-2.5 py-1 rounded-lg font-medium ${ROLE_COLORS[u.role]}`}>
                          {ROLE_LABELS[u.role]}
                        </span>
                      ) : (
                        <div className="flex items-center gap-2">
                          <select
                            value={selected}
                            onChange={(e) => setPendingRole((p) => ({ ...p, [u.id]: e.target.value as Role }))}
                            className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-brand-300 cursor-pointer"
                          >
                            {ROLES.map((r) => (
                              <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                            ))}
                          </select>
                          {hasChange && (
                            <Button
                              size="sm"
                              variant="brand"
                              className="text-xs h-7"
                              loading={roleChangeMutation.isPending}
                              onClick={() => roleChangeMutation.mutate({ id: u.id, role: selected })}
                            >
                              Save
                            </Button>
                          )}
                        </div>
                      )}

                      {/* Activate / Deactivate */}
                      {!locked && (
                        u.isActive ? (
                          <Button size="sm" variant="outline" className="text-xs h-7 text-red-600 border-red-200 hover:bg-red-50"
                            onClick={() => deactivateMutation.mutate(u.id)} loading={deactivateMutation.isPending}>
                            <UserX className="w-3 h-3 mr-1" /> Deactivate
                          </Button>
                        ) : (
                          <Button size="sm" variant="outline" className="text-xs h-7 text-green-600 border-green-200 hover:bg-green-50"
                            onClick={() => reactivateMutation.mutate(u.id)} loading={reactivateMutation.isPending}>
                            <UserCheck className="w-3 h-3 mr-1" /> Reactivate
                          </Button>
                        )
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
