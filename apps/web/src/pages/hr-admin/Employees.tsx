import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Search, UserX, UserCheck, Users, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { queryClient } from '@/lib/queryClient';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

const ROLE_COLORS: Record<string, string> = {
  WORKER: 'bg-blue-100 text-blue-700',
  THERAPIST: 'bg-purple-100 text-purple-700',
  SAFETY_MANAGER: 'bg-orange-100 text-orange-700',
  HR_ADMIN: 'bg-green-100 text-green-700',
  COMPANY_ADMIN: 'bg-gray-800 text-white',
};

export default function HREmployees() {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['hr', 'users'],
    queryFn: () => api.get('/hr/users').then((r) => r.data.data),
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/hr/users/${id}/deactivate`),
    onSuccess: () => { toast.success('User deactivated'); queryClient.invalidateQueries({ queryKey: ['hr', 'users'] }); },
    onError: () => toast.error('Failed'),
  });

  const reactivateMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/hr/users/${id}/reactivate`),
    onSuccess: () => { toast.success('User reactivated'); queryClient.invalidateQueries({ queryKey: ['hr', 'users'] }); },
    onError: () => toast.error('Failed'),
  });

  const filtered = users.filter((u: any) => {
    const name = `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase();
    const matchSearch = !search || name.includes(search.toLowerCase());
    const matchRole = !roleFilter || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const roles = ['WORKER', 'THERAPIST', 'SAFETY_MANAGER', 'HR_ADMIN', 'COMPANY_ADMIN'];

  return (
    <div className="space-y-5">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Employees</h1>
          <p className="text-gray-500 text-sm">{users.length} total users</p>
        </div>
        <Button className="gap-2" onClick={() => toast.info('Send invites via the Invites page')}>
          <Mail className="w-4 h-4" /> Invite User
        </Button>
      </motion.div>

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
          {['', ...roles].map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={cn('px-3 py-2 text-xs rounded-xl border transition-all font-medium', roleFilter === r ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 text-gray-500 hover:border-gray-400')}
            >
              {r || 'All'}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">{[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-16 bg-gray-100 rounded-2xl animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="py-16 text-center text-gray-400"><Users className="w-10 h-10 mx-auto mb-2 opacity-40" /><p>No users found</p></CardContent></Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((u: any, i: number) => (
            <motion.div key={u.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}>
              <Card className={!u.isActive ? 'opacity-50' : ''}>
                <CardContent className="p-4 flex items-center gap-3">
                  <Avatar className="w-9 h-9 shrink-0">
                    <AvatarFallback className="text-sm font-semibold bg-gray-100 text-gray-600">
                      {u.firstName[0]}{u.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-gray-900 text-sm">{u.firstName} {u.lastName}</p>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${ROLE_COLORS[u.role] ?? 'bg-gray-100 text-gray-600'}`}>{u.role.replace(/_/g, ' ')}</span>
                      {!u.isActive && <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Inactive</span>}
                      {!u.isOnboarded && u.role === 'WORKER' && <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Not onboarded</span>}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{u.email} · {u.department?.name ?? 'No dept'}</p>
                  </div>
                  <div className="shrink-0 flex items-center gap-2">
                    <p className="text-xs text-gray-400 hidden sm:block">
                      {u.lastLoginAt ? `Last login: ${new Date(u.lastLoginAt).toLocaleDateString()}` : 'Never logged in'}
                    </p>
                    {u.isActive ? (
                      <Button size="sm" variant="outline" className="text-xs h-7 text-red-600 border-red-200 hover:bg-red-50"
                        onClick={() => deactivateMutation.mutate(u.id)} loading={deactivateMutation.isPending}>
                        <UserX className="w-3 h-3 mr-1" /> Deactivate
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" className="text-xs h-7 text-green-600 border-green-200 hover:bg-green-50"
                        onClick={() => reactivateMutation.mutate(u.id)} loading={reactivateMutation.isPending}>
                        <UserCheck className="w-3 h-3 mr-1" /> Reactivate
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
