import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Shield, Search } from 'lucide-react';
import { useState } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';

const METHOD_COLORS: Record<string, string> = {
  'POST': 'bg-blue-100 text-blue-700',
  'PATCH': 'bg-amber-100 text-amber-700',
  'PUT': 'bg-purple-100 text-purple-700',
  'DELETE': 'bg-red-100 text-red-700',
};

const ROLE_LABELS: Record<string, string> = {
  WORKER: 'Worker', THERAPIST: 'Therapist', SAFETY_MANAGER: 'Safety Mgr',
  HR_ADMIN: 'HR Admin', COMPANY_ADMIN: 'Admin',
};

export default function AuditLogPage() {
  const [search, setSearch] = useState('');

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: () => api.get('/hr/audit-logs?limit=200').then((r) => r.data.data),
    staleTime: 30_000,
  });

  const filtered = search
    ? logs.filter((l: any) => {
        const text = `${l.user?.firstName} ${l.user?.lastName} ${l.action} ${l.resourceType}`.toLowerCase();
        return text.includes(search.toLowerCase());
      })
    : logs;

  return (
    <div className="space-y-5 max-w-4xl">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-gray-900">Audit Log</h1>
        <p className="text-gray-500 text-sm">All mutating API actions in your organization</p>
      </motion.div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search by user, action, resource..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-300"
        />
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-2">{[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-10 bg-gray-100 rounded-lg animate-pulse" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-gray-400">
              <Shield className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p>No audit log entries</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    {['Time', 'User', 'Role', 'Method', 'Action', 'Resource', 'IP'].map((h) => (
                      <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-gray-500 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((log: any, i: number) => {
                    const method = log.action?.split(':')?.[0] ?? 'POST';
                    const path = log.action?.split(':')?.[1] ?? log.action;
                    return (
                      <motion.tr key={log.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: Math.min(i * 0.01, 0.3) }} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <td className="py-2.5 px-4 text-gray-400 text-xs whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="py-2.5 px-4 font-medium text-gray-900 whitespace-nowrap">
                          {log.user ? `${log.user.firstName} ${log.user.lastName}` : '—'}
                        </td>
                        <td className="py-2.5 px-4 text-gray-500 text-xs whitespace-nowrap">
                          {ROLE_LABELS[log.user?.role] ?? log.user?.role ?? '—'}
                        </td>
                        <td className="py-2.5 px-4">
                          <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${METHOD_COLORS[method] ?? 'bg-gray-100 text-gray-600'}`}>{method}</span>
                        </td>
                        <td className="py-2.5 px-4 text-gray-600 font-mono text-xs max-w-48 truncate" title={path}>{path}</td>
                        <td className="py-2.5 px-4 text-gray-500 text-xs">{log.resourceType}</td>
                        <td className="py-2.5 px-4 text-gray-400 text-xs">{log.ipAddress ?? '—'}</td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
