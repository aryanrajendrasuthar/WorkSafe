import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth.store';

interface NotificationEvent {
  id: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  createdAt: string;
}

const SSE_BASE = import.meta.env.VITE_API_URL || '/api';

export function useNotificationStream() {
  const token = useAuthStore((s) => s.accessToken);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const queryClient = useQueryClient();
  const esRef = useRef<EventSource | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !token) return;

    let active = true;

    const connect = () => {
      if (!active) return;

      const url = `${SSE_BASE}/notifications/stream?token=${encodeURIComponent(token)}`;
      const es = new EventSource(url);
      esRef.current = es;

      es.onmessage = (e) => {
        try {
          const event: NotificationEvent = JSON.parse(e.data);
          showToast(event);
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
        } catch {
          // ignore parse errors
        }
      };

      es.onerror = () => {
        es.close();
        esRef.current = null;
        if (active) {
          reconnectTimer.current = setTimeout(connect, 5000);
        }
      };
    };

    connect();

    return () => {
      active = false;
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      esRef.current?.close();
      esRef.current = null;
    };
  }, [token, isAuthenticated, queryClient]);
}

function showToast(event: NotificationEvent) {
  const icon = (event.data?.icon as string) ?? getDefaultIcon(event.type);
  const description = event.message;

  if (event.type === 'ACHIEVEMENT_UNLOCKED') {
    toast.success(event.title, { description, icon, duration: 6000 });
  } else if (event.type === 'ALERT' || event.type === 'INCIDENT_REPORTED') {
    toast.error(event.title, { description, duration: 8000 });
  } else {
    toast.info(event.title, { description, duration: 5000 });
  }
}

function getDefaultIcon(type: string): string {
  switch (type) {
    case 'ACHIEVEMENT_UNLOCKED': return '🏆';
    case 'SESSION_REMINDER': return '💪';
    case 'CHECKIN_REMINDER': return '📋';
    case 'PROGRAM_ASSIGNED': return '📝';
    case 'ESCALATION': return '⚠️';
    case 'INCIDENT_REPORTED': return '🚨';
    case 'RTW_UPDATE': return '✅';
    default: return '🔔';
  }
}
