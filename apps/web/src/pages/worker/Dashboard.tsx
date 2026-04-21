import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Flame, CheckCircle, Activity, Trophy, Plus, ChevronRight, Calendar, Target } from 'lucide-react';
import { Link } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckinHeatmap } from '@/components/CheckinHeatmap';

const BODY_COLORS: Record<string, string> = {
  LOWER_BACK: '#f97316', UPPER_BACK: '#8b5cf6', LEFT_SHOULDER: '#3b82f6',
  RIGHT_SHOULDER: '#06b6d4', HEAD_NECK: '#10b981', LEFT_WRIST_HAND: '#f59e0b',
  RIGHT_WRIST_HAND: '#ef4444',
};

const BODY_LABELS: Record<string, string> = {
  LOWER_BACK: 'Lower Back', UPPER_BACK: 'Upper Back', LEFT_SHOULDER: 'L. Shoulder',
  RIGHT_SHOULDER: 'R. Shoulder', HEAD_NECK: 'Neck', LEFT_WRIST_HAND: 'L. Wrist',
  RIGHT_WRIST_HAND: 'R. Wrist',
};

export default function WorkerDashboard() {
  const user = useAuthStore((s) => s.user);

  const { data: stats } = useQuery({
    queryKey: ['worker', 'stats'],
    queryFn: () => api.get('/workers/stats').then((r) => r.data.data),
  });

  const { data: todayCheckin } = useQuery({
    queryKey: ['checkin', 'today'],
    queryFn: () => api.get('/checkins/today').then((r) => r.data.data),
  });

  const { data: trendData = [] } = useQuery({
    queryKey: ['checkin', 'trend'],
    queryFn: () => api.get('/checkins/trend?days=30').then((r) => r.data.data),
  });

  const { data: historyData = [] } = useQuery({
    queryKey: ['checkin', 'history'],
    queryFn: () => api.get('/checkins/history?days=90').then((r) => r.data.data),
  });

  const { data: programs = [] } = useQuery({
    queryKey: ['programs', 'my'],
    queryFn: () => api.get('/programs/my').then((r) => r.data.data),
  });

  const streak = stats?.streak ?? 0;
  const totalCheckins = stats?.totalCheckins ?? 0;
  const activePrograms = programs.length;

  const trendKeys = trendData.length > 0
    ? Object.keys(trendData[0]).filter((k) => k !== 'date').slice(0, 4)
    : [];

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-gray-900">{greeting}, {user?.firstName} 👋</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          {todayCheckin ? 'Check-in done for today ✓' : "Don't forget your daily check-in"}
        </p>
      </motion.div>

      {/* Check-in CTA */}
      {!todayCheckin && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Link to="/worker/checkin">
            <div className="bg-gradient-to-r from-brand-500 to-brand-600 rounded-2xl p-5 text-white flex items-center justify-between shadow-lg shadow-brand-200">
              <div>
                <p className="font-bold text-lg">Daily Check-in</p>
                <p className="text-brand-100 text-sm">Takes 60 seconds · Keep your streak alive</p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Plus className="w-6 h-6" />
              </div>
            </div>
          </Link>
        </motion.div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { icon: Flame, label: 'Day Streak', value: streak, color: 'text-orange-500', bg: 'bg-orange-50' },
          { icon: CheckCircle, label: 'Total Check-ins', value: totalCheckins, color: 'text-green-600', bg: 'bg-green-50' },
          { icon: Target, label: 'Active Programs', value: activePrograms, color: 'text-brand-600', bg: 'bg-brand-50' },
          { icon: Trophy, label: 'Best Streak', value: stats?.bestStreak ?? streak, color: 'text-purple-600', bg: 'bg-purple-50' },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card>
              <CardContent className="p-4">
                <div className={`w-9 h-9 ${stat.bg} rounded-xl flex items-center justify-center mb-2`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                <div className="text-xs text-gray-500 mt-0.5">{stat.label}</div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Pain Trend Chart */}
      {trendData.length > 0 && trendKeys.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="w-4 h-4 text-brand-500" /> Pain Trend — Last 30 Days
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={trendData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9ca3af' }} tickFormatter={(v) => v.slice(5)} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} domain={[0, 10]} ticks={[0, 5, 10]} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }} formatter={(v: any, name: string) => [v, BODY_LABELS[name] ?? name]} />
                  {trendKeys.map((key) => (
                    <Line key={key} type="monotone" dataKey={key} stroke={BODY_COLORS[key] ?? '#6b7280'} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-3 mt-3">
                {trendKeys.map((key) => (
                  <span key={key} className="flex items-center gap-1.5 text-xs text-gray-500">
                    <span className="w-3 h-1.5 rounded-full inline-block" style={{ background: BODY_COLORS[key] ?? '#6b7280' }} />
                    {BODY_LABELS[key] ?? key}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Active Programs */}
      {programs.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Active Programs</CardTitle>
                <Link to="/worker/programs" className="text-xs text-brand-600 font-medium hover:text-brand-700">View all →</Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {programs.slice(0, 2).map((wp: any) => (
                <Link key={wp.id} to="/worker/programs">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                    <div className="w-9 h-9 bg-brand-100 rounded-xl flex items-center justify-center shrink-0">
                      <Target className="w-5 h-5 text-brand-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{wp.program.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Progress value={wp.completionRate} className="h-1.5 flex-1" />
                        <span className="text-xs text-gray-500 shrink-0">{wp.completionRate}%</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Check-in Heatmap */}
      {historyData.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="w-4 h-4 text-brand-500" /> Check-in History
              </CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <CheckinHeatmap data={historyData} weeks={18} />
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Quick actions */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
        <div className="grid grid-cols-2 gap-3">
          <Link to="/worker/exercises">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-9 h-9 bg-green-50 rounded-xl flex items-center justify-center">
                  <Activity className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Exercises</p>
                  <p className="text-xs text-gray-500">Browse library</p>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link to="/worker/programs">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-9 h-9 bg-purple-50 rounded-xl flex items-center justify-center">
                  <Target className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Programs</p>
                  <p className="text-xs text-gray-500">My sessions</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
