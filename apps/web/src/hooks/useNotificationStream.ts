import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth.store';

interface NotificationPayload {
  id: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  createdAt: string;
}

// In dev Vite proxies /api but buffers SSE — connect directly to the API port.
// In production VITE_API_URL is the full deployed URL.
const SSE_BASE = import.meta.env.DEV
  ? 'http://localhost:3001'
  : (import.meta.env.VITE_API_URL ?? '');

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

      const handleEvent = (e: MessageEvent) => {
        try {
          const raw = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
          // NestJS wraps the payload in { data: ... } when TransformInterceptor is bypassed
          const payload: NotificationPayload = raw?.id ? raw : raw?.data ?? raw;
          if (!payload?.title) return;
          showToast(payload);
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
        } catch {
          // ignore parse errors
        }
      };

      // NestJS @Sse() can emit as 'message' or as a named event type
      es.onmessage = handleEvent;
      es.addEventListener('notification', handleEvent);

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

function showToast(event: NotificationPayload) {
  const icon = (event.data?.icon as string) ?? getDefaultIcon(event.type);

  if (event.type === 'ACHIEVEMENT_UNLOCKED') {
    toast.success(event.title, { description: event.message, icon, duration: 6000 });
  } else if (event.type === 'ALERT' || event.type === 'INCIDENT_REPORTED') {
    toast.error(event.title, { description: event.message, duration: 8000 });
  } else if (event.type === 'ESCALATION') {
    toast.warning(event.title, { description: event.message, duration: 7000 });
  } else {
    toast.info(event.title, { description: event.message, duration: 5000 });
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
