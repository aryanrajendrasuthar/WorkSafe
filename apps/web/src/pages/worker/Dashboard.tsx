import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Flame, TrendingUp, Dumbbell, Activity, CheckCircle2,
  ArrowRight, Calendar, Award, Zap
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: 'easeOut' },
};

interface WorkerStats {
  checkinCount: number;
  currentStreak: number;
  activePrograms: Array<{
    id: string;
    program: { id: string; name: string; goal: string; durationWeeks: number };
    sessionLogs: Array<{ date: string }>;
  }>;
}

export default function WorkerDashboard() {
  const user = useAuthStore((s) => s.user);

  const { data: stats, isLoading: statsLoading } = useQuery<WorkerStats>({
    queryKey: ['worker-stats'],
    queryFn: async () => {
      const res = await api.get('/workers/stats');
      return res.data.data;
    },
  });

  const hasCheckedInToday = false; // Will be computed from check-in data in Sprint 2

  const timeOfDay = new Date().getHours();
  const greeting = timeOfDay < 12 ? 'Good morning' : timeOfDay < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div {...fadeUp}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              {greeting}, {user?.firstName}! 👋
            </h1>
            <p className="text-gray-500 mt-1">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>
          {!hasCheckedInToday && (
            <Link to="/worker/checkin">
              <Button variant="brand" size="lg" className="animate-pulse-glow">
                <Activity className="w-5 h-5" />
                Daily Check-in
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          )}
          {hasCheckedInToday && (
            <div className="flex items-center gap-2 text-green-600 font-medium">
              <CheckCircle2 className="w-5 h-5" />
              Checked in today!
            </div>
          )}
        </div>
      </motion.div>

      {/* Stats row */}
      <motion.div
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <StatCard
          icon={Flame}
          iconColor="text-orange-500"
          iconBg="bg-orange-50"
          label="Current Streak"
          value={statsLoading ? '—' : `${stats?.currentStreak ?? 0} days`}
          sub={stats?.currentStreak && stats.currentStreak >= 7 ? '🔥 On fire!' : 'Keep going!'}
        />
        <StatCard
          icon={Calendar}
          iconColor="text-blue-500"
          iconBg="bg-blue-50"
          label="Total Check-ins"
          value={statsLoading ? '—' : String(stats?.checkinCount ?? 0)}
          sub="All time"
        />
        <StatCard
          icon={Dumbbell}
          iconColor="text-purple-500"
          iconBg="bg-purple-50"
          label="Active Programs"
          value={statsLoading ? '—' : String(stats?.activePrograms?.length ?? 0)}
          sub="In progress"
        />
        <StatCard
          icon={Award}
          iconColor="text-amber-500"
          iconBg="bg-amber-50"
          label="Badges Earned"
          value="3"
          sub="2 pending"
        />
      </motion.div>

      {/* Main content grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Pain trend chart */}
        <motion.div
          className="lg:col-span-2"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Pain Trend (Last 30 Days)</CardTitle>
                <Badge variant="outline" className="text-xs">Per body area</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <PainTrendChart />
            </CardContent>
          </Card>
        </motion.div>

        {/* Streak calendar */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
        >
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Flame className="w-4 h-4 text-orange-500" />
                Check-in Streak
              </CardTitle>
            </CardHeader>
            <CardContent>
              <StreakCalendar streak={stats?.currentStreak ?? 0} />

              <div className="mt-4 space-y-2">
                {[
                  { label: '7-day streak', icon: '🔥', unlocked: (stats?.currentStreak ?? 0) >= 7 },
                  { label: '30-day streak', icon: '⚡', unlocked: (stats?.currentStreak ?? 0) >= 30 },
                  { label: '100-day streak', icon: '💎', unlocked: (stats?.currentStreak ?? 0) >= 100 },
                ].map((badge) => (
                  <div key={badge.label} className={`flex items-center gap-2 p-2 rounded-lg text-sm ${badge.unlocked ? 'bg-amber-50 border border-amber-100' : 'bg-gray-50 opacity-50'}`}>
                    <span>{badge.icon}</span>
                    <span className={badge.unlocked ? 'text-amber-700 font-medium' : 'text-gray-500'}>{badge.label}</span>
                    {badge.unlocked && <CheckCircle2 className="w-4 h-4 text-amber-500 ml-auto" />}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Active Programs */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Dumbbell className="w-4 h-4 text-purple-500" />
                Active Exercise Programs
              </CardTitle>
              <Link to="/worker/programs">
                <Button variant="ghost" size="sm" className="text-xs">
                  View all <ArrowRight className="w-3 h-3" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : stats?.activePrograms?.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Dumbbell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-sm">No programs assigned yet</p>
                <p className="text-xs mt-1">Your therapist will assign a program soon</p>
              </div>
            ) : (
              <div className="space-y-3">
                {stats?.activePrograms?.map((wp) => (
                  <ProgramCard key={wp.id} workerProgram={wp} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        className="grid sm:grid-cols-3 gap-4"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.35 }}
      >
        <Link to="/worker/checkin" className="block">
          <Card className="hover:shadow-md transition-shadow cursor-pointer group border-dashed">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
                <Activity className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <div className="font-semibold text-gray-900">Daily Check-in</div>
                <div className="text-xs text-gray-500">60 seconds · Updates your risk</div>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link to="/worker/programs" className="block">
          <Card className="hover:shadow-md transition-shadow cursor-pointer group border-dashed">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
                <Dumbbell className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <div className="font-semibold text-gray-900">Start Exercise</div>
                <div className="text-xs text-gray-500">Continue your program</div>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link to="/worker/history" className="block">
          <Card className="hover:shadow-md transition-shadow cursor-pointer group border-dashed">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <div className="font-semibold text-gray-900">View History</div>
                <div className="text-xs text-gray-500">Your pain trend data</div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </motion.div>
    </div>
  );
}

function StatCard({ icon: Icon, iconColor, iconBg, label, value, sub }: {
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className={`w-10 h-10 ${iconBg} rounded-xl flex items-center justify-center mb-3`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        <div className="text-sm text-gray-600 mt-0.5">{label}</div>
        <div className="text-xs text-gray-400 mt-0.5">{sub}</div>
      </CardContent>
    </Card>
  );
}

function ProgramCard({ workerProgram }: { workerProgram: { id: string; program: { name: string; goal: string; durationWeeks: number }; sessionLogs: Array<{ date: string }> } }) {
  const progress = Math.min(100, Math.round((workerProgram.sessionLogs.length / (workerProgram.program.durationWeeks * 5)) * 100));

  return (
    <div className="flex items-center gap-4 p-4 rounded-xl border hover:bg-gray-50 transition-colors">
      <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center shrink-0">
        <Dumbbell className="w-5 h-5 text-purple-600" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <span className="font-medium text-gray-900 text-sm truncate">{workerProgram.program.name}</span>
          <span className="text-xs text-gray-500 shrink-0">{progress}%</span>
        </div>
        <Progress value={progress} className="h-1.5" />
        <div className="flex items-center gap-3 mt-1.5">
          <Badge variant="outline" className="text-xs capitalize py-0">
            {workerProgram.program.goal.toLowerCase().replace('_', ' ')}
          </Badge>
          <span className="text-xs text-gray-400">{workerProgram.program.durationWeeks} weeks</span>
        </div>
      </div>
      <Link to={`/worker/programs/${workerProgram.id}`}>
        <Button variant="ghost" size="sm">
          <Zap className="w-4 h-4" />
        </Button>
      </Link>
    </div>
  );
}

function PainTrendChart() {
  const data = Array.from({ length: 30 }, (_, i) => ({
    day: `Day ${i + 1}`,
    lowerBack: Math.max(0, Math.min(10, 5 + Math.sin(i * 0.3) * 2 + (Math.random() - 0.5) * 1.5)),
    shoulders: Math.max(0, Math.min(10, 3 + Math.cos(i * 0.4) * 1.5 + (Math.random() - 0.5) * 1)),
    neck: Math.max(0, Math.min(10, 2 + Math.sin(i * 0.5) * 1 + (Math.random() - 0.5) * 0.8)),
  })).map((d) => ({
    ...d,
    lowerBack: parseFloat(d.lowerBack.toFixed(1)),
    shoulders: parseFloat(d.shoulders.toFixed(1)),
    neck: parseFloat(d.neck.toFixed(1)),
  }));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#9ca3af' }} tickFormatter={(v) => v.replace('Day ', '')} interval={4} />
        <YAxis domain={[0, 10]} tick={{ fontSize: 10, fill: '#9ca3af' }} />
        <Tooltip
          contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }}
          labelFormatter={(v) => `Day ${v.replace('Day ', '')}`}
        />
        <Line type="monotone" dataKey="lowerBack" stroke="#f97316" strokeWidth={2} dot={false} name="Lower Back" />
        <Line type="monotone" dataKey="shoulders" stroke="#8b5cf6" strokeWidth={2} dot={false} name="Shoulders" />
        <Line type="monotone" dataKey="neck" stroke="#06b6d4" strokeWidth={2} dot={false} name="Neck" />
      </LineChart>
    </ResponsiveContainer>
  );
}

function StreakCalendar({ streak }: { streak: number }) {
  const today = new Date();
  const days = Array.from({ length: 35 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (34 - i));
    const isInStreak = i >= 35 - streak && streak > 0;
    const isToday = i === 34;
    return { date: d, isInStreak, isToday };
  });

  return (
    <div className="grid grid-cols-7 gap-1">
      {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
        <div key={`${d}-${i}`} className="text-center text-xs font-medium text-gray-400 py-1">{d}</div>
      ))}
      {days.map((day, i) => (
        <div
          key={i}
          title={day.date.toLocaleDateString()}
          className={`
            aspect-square rounded-md flex items-center justify-center text-xs transition-colors
            ${day.isToday ? 'ring-2 ring-brand-500' : ''}
            ${day.isInStreak ? 'bg-orange-400 text-white' : 'bg-gray-100 text-gray-400'}
          `}
        >
          {day.date.getDate()}
        </div>
      ))}
    </div>
  );
}
