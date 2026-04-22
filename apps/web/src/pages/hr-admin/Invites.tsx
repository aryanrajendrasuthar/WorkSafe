import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Mail, Trash2, Plus, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { queryClient } from '@/lib/queryClient';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const ROLES = ['WORKER', 'THERAPIST', 'SAFETY_MANAGER', 'HR_ADMIN'];
const ROLE_COLORS: Record<string, string> = {
  WORKER: 'bg-blue-100 text-blue-700',
  THERAPIST: 'bg-purple-100 text-purple-700',
  SAFETY_MANAGER: 'bg-orange-100 text-orange-700',
  HR_ADMIN: 'bg-green-100 text-green-700',
};

export default function HRInvites() {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('WORKER');

  const { data: invites = [], isLoading } = useQuery({
    queryKey: ['hr', 'invites'],
    queryFn: () => api.get('/hr/invites').then((r) => r.data.data),
  });

  const createMutation = useMutation({
    mutationFn: () => api.post('/auth/invite/create', { email, role }),
    onSuccess: () => {
      toast.success(`Invite sent to ${email}`);
      setEmail('');
      queryClient.invalidateQueries({ queryKey: ['hr', 'invites'] });
    },
    onError: () => toast.error('Failed to create invite'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/hr/invites/${id}`),
    onSuccess: () => { toast.success('Invite revoked'); queryClient.invalidateQueries({ queryKey: ['hr', 'invites'] }); },
    onError: () => toast.error('Failed'),
  });

  const pendingInvites = invites.filter((i: any) => !i.usedAt && new Date(i.expiresAt) > new Date());
  const usedInvites = invites.filter((i: any) => i.usedAt);
  const expiredInvites = invites.filter((i: any) => !i.usedAt && new Date(i.expiresAt) <= new Date());

  return (
    <div className="space-y-5 max-w-2xl">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-gray-900">Invites</h1>
        <p className="text-gray-500 text-sm">{pendingInvites.length} pending · {usedInvites.length} accepted</p>
      </motion.div>

      {/* Create invite form */}
      <Card>
        <CardContent className="p-5">
          <p className="font-semibold text-gray-900 text-sm mb-3">Send New Invite</p>
          <div className="flex gap-2 flex-wrap">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="colleague@company.com"
              className="flex-1 min-w-48 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
            />
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
            >
              {ROLES.map((r) => <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>)}
            </select>
            <Button className="gap-1.5" onClick={() => createMutation.mutate()} loading={createMutation.isPending} disabled={!email.includes('@')}>
              <Plus className="w-4 h-4" /> Send Invite
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Invite list */}
      {isLoading ? (
        <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-14 bg-gray-100 rounded-2xl animate-pulse" />)}</div>
      ) : invites.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-gray-400"><Mail className="w-8 h-8 mx-auto mb-2 opacity-40" /><p>No invites yet</p></CardContent></Card>
      ) : (
        <div className="space-y-2">
          {invites.map((inv: any, i: number) => {
            const isExpired = !inv.usedAt && new Date(inv.expiresAt) <= new Date();
            const isUsed = !!inv.usedAt;
            return (
              <motion.div key={inv.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}>
                <Card className={isExpired || isUsed ? 'opacity-60' : ''}>
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="w-9 h-9 bg-gray-50 rounded-xl flex items-center justify-center shrink-0">
                      <Mail className="w-4 h-4 text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-gray-900 text-sm">{inv.email}</p>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${ROLE_COLORS[inv.role] ?? 'bg-gray-100 text-gray-600'}`}>{inv.role.replace(/_/g, ' ')}</span>
                        {isUsed && <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Accepted</span>}
                        {isExpired && <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">Expired</span>}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {isUsed ? `Accepted ${new Date(inv.usedAt).toLocaleDateString()}` : `Expires ${new Date(inv.expiresAt).toLocaleDateString()}`}
                      </p>
                    </div>
                    {!isUsed && (
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/invite/${inv.token}`); toast.success('Link copied'); }}
                          className="text-gray-400 hover:text-gray-600 p-1 transition-colors"
                          title="Copy invite link"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button onClick={() => deleteMutation.mutate(inv.id)} className="text-gray-400 hover:text-red-500 p-1 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
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
