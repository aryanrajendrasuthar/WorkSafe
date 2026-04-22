import { useQuery, useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Bell, CheckCircle, AlertTriangle, Activity, Dumbbell, TrendingUp, Trash2, Shield } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { api } from '@/lib/api';
import { queryClient } from '@/lib/queryClient';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const TYPE_ICON: Record<string, { icon: any; bg: string; color: string }> = {
  CHECKIN_REMINDER:     { icon: Activity,      bg: 'bg-brand-50',  color: 'text-brand-600' },
  EXERCISE_REMINDER:    { icon: Dumbbell,       bg: 'bg-purple-50', color: 'text-purple-600' },
  PAIN_ESCALATION:      { icon: AlertTriangle,  bg: 'bg-orange-50', color: 'text-orange-600' },
  PROGRAM_ASSIGNED:     { icon: Dumbbell,       bg: 'bg-blue-50',   color: 'text-blue-600' },
  INCIDENT_UPDATE:      { icon: Shield,         bg: 'bg-red-50',    color: 'text-red-600' },
  RTW_MILESTONE:        { icon: CheckCircle,    bg: 'bg-green-50',  color: 'text-green-600' },
  RISK_THRESHOLD_BREACH:{ icon: TrendingUp,     bg: 'bg-red-50',    color: 'text-red-600' },
  STREAK_MILESTONE:     { icon: CheckCircle,    bg: 'bg-green-50',  color: 'text-green-600' },
  SYSTEM:               { icon: Bell,           bg: 'bg-gray-50',   color: 'text-gray-600' },
};

function getIconConfig(type: string) {
  return TYPE_ICON[type] ?? TYPE_ICON.SYSTEM;
}

export default function WorkerNotifications() {
  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.get('/notifications?limit=50').then((r) => r.data.data),
  });

  const markRead = useMutation({
    mutationFn: (id: string) => api.patch(`/notifications/${id}/read`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAllRead = useMutation({
    mutationFn: () => api.patch('/notifications/read-all'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const deleteNotif = useMutation({
    mutationFn: (id: string) => api.delete(`/notifications/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const notifications = data?.notifications ?? [];
  const unreadCount = data?.unreadCount ?? 0;

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-500 text-sm">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}` : 'All caught up!'}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={() => markAllRead.mutate()} loading={markAllRead.isPending}>
            Mark all as read
          </Button>
        )}
      </motion.div>

      {notifications.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Bell className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-500 font-medium">No notifications yet</p>
          <p className="text-gray-400 text-sm mt-1">You'll see alerts, reminders, and updates here.</p>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notif: any, i: number) => {
            const { icon: Icon, bg, color } = getIconConfig(notif.type);
            return (
              <motion.div key={notif.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}>
                <Card
                  className={`transition-all ${notif.isRead ? 'opacity-60' : 'border-brand-100 shadow-sm'}`}
                  onClick={() => !notif.isRead && markRead.mutate(notif.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex gap-3">
                      <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
                        <Icon className={`w-5 h-5 ${color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-sm font-semibold ${notif.isRead ? 'text-gray-600' : 'text-gray-900'}`}>
                            {notif.title}
                          </p>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-xs text-gray-400">
                              {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                            </span>
                            {!notif.isRead && <span className="w-2 h-2 rounded-full bg-brand-500" />}
                            <button
                              onClick={(e) => { e.stopPropagation(); deleteNotif.mutate(notif.id); }}
                              className="text-gray-300 hover:text-red-400 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <p className="text-sm text-gray-500 mt-0.5">{notif.message}</p>
                      </div>
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
