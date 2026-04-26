import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, Moon, Sun, BellOff, BellRing, Shield, Smartphone, Monitor, LogOut, Trash2, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { useThemeStore } from '@/store/theme.store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export default function SettingsPage() {
  const { user, logout } = useAuthStore();
  const { isDark, toggle: toggleTheme } = useThemeStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);
  const [pushSupported] = useState(() => 'serviceWorker' in navigator && 'PushManager' in window);

  useEffect(() => {
    if (!pushSupported) return;
    navigator.serviceWorker.ready.then((reg) =>
      reg.pushManager.getSubscription().then((sub) => setPushEnabled(!!sub)),
    );
  }, [pushSupported]);

  const handlePushToggle = async (enabled: boolean) => {
    if (!pushSupported) { toast.error('Push notifications not supported in this browser'); return; }
    setPushLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      if (enabled) {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') { toast.error('Notification permission denied'); return; }
        const res = await api.get<{ data: { publicKey: string } }>('/notifications/push/public-key');
        const vapidKey = res.data.data?.publicKey ?? (res.data as any).publicKey;
        const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(vapidKey) });
        const json = sub.toJSON();
        await api.post('/notifications/push/subscribe', { endpoint: sub.endpoint, keys: { p256dh: json.keys?.p256dh, auth: json.keys?.auth } });
        setPushEnabled(true);
        toast.success('Push notifications enabled');
      } else {
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          await api.delete('/notifications/push/subscribe', { data: { endpoint: sub.endpoint } });
          await sub.unsubscribe();
        }
        setPushEnabled(false);
        toast.success('Push notifications disabled');
      }
    } catch {
      toast.error('Failed to update push notification settings');
    } finally {
      setPushLoading(false);
    }
  };

  const handleLogout = async () => {
    try { await api.post('/auth/logout'); } catch { /* ignore */ }
    queryClient.clear();
    logout();
    navigate('/login');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-10">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Customize your WorkSafe experience</p>
      </motion.div>

      {/* Appearance */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              {isDark ? <Moon className="w-4 h-4 text-brand-600" /> : <Sun className="w-4 h-4 text-brand-600" />}
              Appearance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Dark mode</Label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Switch between light and dark theme</p>
              </div>
              <Switch checked={isDark} onCheckedChange={toggleTheme} />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                onClick={() => isDark && toggleTheme()}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${!isDark ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'}`}
              >
                <Monitor className="w-6 h-6 text-gray-700" />
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Light</span>
              </button>
              <button
                onClick={() => !isDark && toggleTheme()}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${isDark ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'}`}
              >
                <Moon className="w-6 h-6 text-gray-500 dark:text-gray-300" />
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Dark</span>
              </button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Notifications */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Bell className="w-4 h-4 text-brand-600" /> Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-brand-50 dark:bg-brand-900/30 rounded-lg flex items-center justify-center">
                  <BellRing className="w-4 h-4 text-brand-600" />
                </div>
                <div>
                  <Label className="text-sm font-medium">In-app notifications</Label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Toast alerts appear in real-time</p>
                </div>
              </div>
              <Switch checked disabled />
            </div>

            <div className="border-t dark:border-gray-800" />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${pushEnabled ? 'bg-green-50 dark:bg-green-900/20' : 'bg-gray-100 dark:bg-gray-800'}`}>
                  {pushEnabled ? <Smartphone className="w-4 h-4 text-green-600" /> : <BellOff className="w-4 h-4 text-gray-400" />}
                </div>
                <div>
                  <Label className="text-sm font-medium">Browser push notifications</Label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {pushSupported ? 'Get alerts even when the app is closed' : 'Not supported in this browser'}
                  </p>
                </div>
              </div>
              <Switch
                checked={pushEnabled}
                onCheckedChange={handlePushToggle}
                disabled={!pushSupported || pushLoading}
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Account */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="w-4 h-4 text-brand-600" /> Account
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="flex items-center justify-between py-2.5 px-1">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Email address</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
              </div>
            </div>

            <div className="border-t dark:border-gray-800" />

            <button
              onClick={() => navigate('/profile')}
              className="w-full flex items-center justify-between py-2.5 px-1 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <div className="text-left">
                <p className="text-sm font-medium text-gray-900 dark:text-white">Edit profile</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Update your name and avatar</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </button>

            <div className="border-t dark:border-gray-800" />

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 py-2.5 px-1 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-colors text-red-600 dark:text-red-400"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm font-medium">Sign out</span>
            </button>
          </CardContent>
        </Card>
      </motion.div>

      {/* Danger zone */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card className="border-red-100 dark:border-red-900/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-red-600">
              <Trash2 className="w-4 h-4" /> Danger Zone
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              To deactivate your account, contact your organization's admin. Account deletion removes all your health data permanently.
            </p>
            <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-900/20 w-full" disabled>
              Request account deletion
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
