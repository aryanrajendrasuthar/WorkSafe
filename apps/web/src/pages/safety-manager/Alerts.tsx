import { useQuery, useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, CheckCircle, Bell, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { queryClient } from '@/lib/queryClient';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-red-100 text-red-700 border-red-200',
  ACKNOWLEDGED: 'bg-amber-100 text-amber-700 border-amber-200',
  RESOLVED: 'bg-green-100 text-green-700 border-green-200',
};

const TYPE_ICONS: Record<string, { icon: typeof AlertTriangle; bg: string; color: string }> = {
  ORG_RISK_HIGH: { icon: AlertTriangle, bg: 'bg-red-50', color: 'text-red-500' },
  DEPT_RISK_HIGH: { icon: AlertTriangle, bg: 'bg-orange-50', color: 'text-orange-500' },
  LOW_CHECKIN_COMPLIANCE: { icon: Bell, bg: 'bg-amber-50', color: 'text-amber-500' },
};

export default function SafetyAlerts() {
  const [statusFilter, setStatusFilter] = useState('');

  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ['risk', 'alerts'],
    queryFn: () => api.get('/risk/alerts').then((r) => r.data.data),
  });

  const checkMutation = useMutation({
    mutationFn: () => api.get('/risk/check-alerts'),
    onSuccess: (res) => {
      const count = res.data.data?.created ?? 0;
      toast.success(count > 0 ? `${count} new alert${count > 1 ? 's' : ''} created` : 'No new alerts');
      queryClient.invalidateQueries({ queryKey: ['risk', 'alerts'] });
      queryClient.invalidateQueries({ queryKey: ['risk', 'summary'] });
    },
    onError: () => toast.error('Check failed'),
  });

  const ackMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/risk/alerts/${id}/acknowledge`),
    onSuccess: () => {
      toast.success('Alert acknowledged');
      queryClient.invalidateQueries({ queryKey: ['risk', 'alerts'] });
    },
    onError: () => toast.error('Failed'),
  });

  const resolveMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/risk/alerts/${id}/resolve`),
    onSuccess: () => {
      toast.success('Alert resolved');
      queryClient.invalidateQueries({ queryKey: ['risk', 'alerts'] });
    },
    onError: () => toast.error('Failed'),
  });

  const filtered = statusFilter ? alerts.filter((a: any) => a.status === statusFilter) : alerts;

  const counts = {
    ACTIVE: alerts.filter((a: any) => a.status === 'ACTIVE').length,
    ACKNOWLEDGED: alerts.filter((a: any) => a.status === 'ACKNOWLEDGED').length,
    RESOLVED: alerts.filter((a: any) => a.status === 'RESOLVED').length,
  };

  return (
    <div className="space-y-5 max-w-3xl">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Risk Alerts</h1>
          <p className="text-gray-500 text-sm">{alerts.length} total alerts</p>
        </div>
        <Button variant="outline" className="gap-2" onClick={() => checkMutation.mutate()} loading={checkMutation.isPending}>
          <RefreshCw className="w-4 h-4" /> Run Check
        </Button>
      </motion.div>

      {/* Summary pills */}
      <div className="flex gap-3 flex-wrap">
        {([['', 'All', alerts.length], ['ACTIVE', 'Active', counts.ACTIVE], ['ACKNOWLEDGED', 'Acknowledged', counts.ACKNOWLEDGED], ['RESOLVED', 'Resolved', counts.RESOLVED]] as [string, string, number][]).map(([val, label, count]) => (
          <button
            key={val}
            onClick={() => setStatusFilter(val)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-medium transition-all flex items-center gap-1.5 ${statusFilter === val ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 text-gray-500 hover:border-gray-400'}`}
          >
            {label}
            <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${statusFilter === val ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'}`}>{count}</span>
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-gray-400">
            <CheckCircle className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p>{statusFilter ? `No ${statusFilter.toLowerCase()} alerts` : 'No alerts yet'}</p>
            {!statusFilter && (
              <p className="text-xs mt-1">Click "Run Check" to scan for threshold breaches</p>
            )}
          </CardContent>
        </Card>
      ) : (
        <AnimatePresence>
          <div className="space-y-2">
            {filtered.map((alert: any, i: number) => {
              const iconConfig = TYPE_ICONS[alert.type] ?? TYPE_ICONS.ORG_RISK_HIGH;
              const Icon = iconConfig.icon;
              return (
                <motion.div key={alert.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                  <Card className={`border ${alert.status === 'ACTIVE' ? 'border-red-100' : alert.status === 'ACKNOWLEDGED' ? 'border-amber-100' : 'border-gray-200'}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={`w-9 h-9 ${iconConfig.bg} rounded-xl flex items-center justify-center shrink-0 mt-0.5`}>
                          <Icon className={`w-4 h-4 ${iconConfig.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <p className="font-semibold text-gray-900 text-sm">{alert.title}</p>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${STATUS_COLORS[alert.status]}`}>
                              {alert.status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">{alert.message}</p>
                          {alert.currentValue != null && (
                            <p className="text-xs text-gray-400 mt-1">
                              Current: <span className="font-medium text-gray-600">{alert.currentValue}</span>
                              {alert.threshold != null && <> · Threshold: <span className="font-medium text-gray-600">{alert.threshold}</span></>}
                            </p>
                          )}
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(alert.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        <div className="flex flex-col gap-1.5 shrink-0">
                          {alert.status === 'ACTIVE' && (
                            <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => ackMutation.mutate(alert.id)} loading={ackMutation.isPending}>
                              Acknowledge
                            </Button>
                          )}
                          {(alert.status === 'ACTIVE' || alert.status === 'ACKNOWLEDGED') && (
                            <Button size="sm" variant="outline" className="text-xs h-7 text-green-700 border-green-200 hover:bg-green-50" onClick={() => resolveMutation.mutate(alert.id)} loading={resolveMutation.isPending}>
                              Resolve
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </AnimatePresence>
      )}
    </div>
  );
}
