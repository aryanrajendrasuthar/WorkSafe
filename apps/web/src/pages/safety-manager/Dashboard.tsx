import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  TrendingDown, AlertTriangle, Users, FileBarChart, ArrowRight,
  Activity, Building2, Shield, TrendingUp,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';

const RISK_COLORS = { low: '#22c55e', medium: '#f59e0b', high: '#f97316', critical: '#ef4444' };
const BODY_LABELS: Record<string, string> = {
  LOWER_BACK: 'Lower Back', UPPER_BACK: 'Upper Back', LEFT_SHOULDER: 'L. Shoulder',
  RIGHT_SHOULDER: 'R. Shoulder', HEAD_NECK: 'Neck', LEFT_WRIST_HAND: 'L. Wrist',
  RIGHT_WRIST_HAND: 'R. Wrist', LEFT_KNEE: 'L. Knee', RIGHT_KNEE: 'R. Knee',
  LEFT_ELBOW: 'L. Elbow', RIGHT_ELBOW: 'R. Elbow', LEFT_HIP: 'L. Hip', RIGHT_HIP: 'R. Hip',
  LEFT_ANKLE_FOOT: 'L. Ankle', RIGHT_ANKLE_FOOT: 'R. Ankle', CHEST: 'Chest', ABDOMEN: 'Abdomen',
};

const REGION_COLORS = ['#f97316', '#8b5cf6', '#06b6d4', '#22c55e', '#f59e0b'];

function riskColor(score: number) {
  if (score < 25) return '#22c55e';
  if (score < 50) return '#f59e0b';
  if (score < 75) return '#f97316';
  return '#ef4444';
}

function riskLevel(score: number) {
  if (score < 25) return 'low';
  if (score < 50) return 'medium';
  if (score < 75) return 'high';
  return 'critical';
}

const RISK_VARIANT: Record<string, any> = {
  low: 'risk_low', medium: 'risk_medium', high: 'risk_high', critical: 'risk_critical',
};

export default function SafetyManagerDashboard() {
  const user = useAuthStore((s) => s.user);

  const { data: summary, isLoading } = useQuery({
    queryKey: ['risk', 'summary'],
    queryFn: () => api.get('/risk/summary').then((r) => r.data.data),
    staleTime: 5 * 60 * 1000,
  });

  const { data: alerts = [] } = useQuery({
    queryKey: ['risk', 'alerts'],
    queryFn: () => api.get('/risk/alerts').then((r) => r.data.data),
    staleTime: 2 * 60 * 1000,
  });

  const activeAlerts = alerts.filter((a: any) => a.status === 'ACTIVE');

  const riskDistData = summary ? [
    { name: 'Low', value: summary.riskDistribution.low, color: '#22c55e' },
    { name: 'Medium', value: summary.riskDistribution.medium, color: '#f59e0b' },
    { name: 'High', value: summary.riskDistribution.high, color: '#f97316' },
    { name: 'Critical', value: summary.riskDistribution.critical, color: '#ef4444' },
  ].filter((d) => d.value > 0) : [];

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => <div key={i} className="h-32 bg-gray-100 rounded-2xl animate-pulse" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Risk Intelligence Dashboard</h1>
            <p className="text-gray-500 text-sm">Welcome, {user?.firstName} · Live data</p>
          </div>
          <div className="flex gap-2">
            <Link to="/safety/alerts">
              <Button variant="outline" className="gap-2">
                <AlertTriangle className="w-4 h-4" />
                Alerts {activeAlerts.length > 0 && <span className="bg-red-500 text-white text-[10px] rounded-full px-1.5">{activeAlerts.length}</span>}
              </Button>
            </Link>
            <Link to="/safety/reports">
              <Button variant="outline" className="gap-2">
                <FileBarChart className="w-4 h-4" /> OSHA Reports
              </Button>
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Active alert banner */}
      {activeAlerts.length > 0 && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-orange-200 bg-orange-50/60">
            <CardContent className="p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-orange-100 rounded-xl flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-4 h-4 text-orange-600" />
                </div>
                <div>
                  <p className="font-semibold text-orange-900 text-sm">{activeAlerts.length} active risk alert{activeAlerts.length > 1 ? 's' : ''}</p>
                  <p className="text-xs text-orange-700">{activeAlerts[0]?.title}</p>
                </div>
              </div>
              <Link to="/safety/alerts">
                <Button size="sm" variant="outline" className="border-orange-300 text-orange-700 hover:bg-orange-100 shrink-0">
                  Review
                </Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            icon: Shield,
            label: 'Org Risk Score',
            value: summary?.orgRiskScore ?? '—',
            sub: summary ? `${summary.orgRiskLevel} risk level` : '—',
            color: `text-${summary?.orgRiskScore < 40 ? 'green' : summary?.orgRiskScore < 65 ? 'amber' : 'orange'}-600`,
            bg: `bg-${summary?.orgRiskScore < 40 ? 'green' : summary?.orgRiskScore < 65 ? 'amber' : 'orange'}-50`,
            badge: summary?.orgRiskLevel,
          },
          {
            icon: AlertTriangle,
            label: 'Active Alerts',
            value: activeAlerts.length,
            sub: `${alerts.length} total alerts`,
            color: 'text-orange-600',
            bg: 'bg-orange-50',
            badge: null,
          },
          {
            icon: Activity,
            label: 'Check-in Rate',
            value: summary ? `${summary.checkinRate}%` : '—',
            sub: 'Last 7 days',
            color: 'text-blue-600',
            bg: 'bg-blue-50',
            badge: null,
          },
          {
            icon: Users,
            label: 'Active Workers',
            value: summary?.totalWorkers ?? '—',
            sub: `${summary?.activeIncidentsThisMonth ?? 0} open incidents`,
            color: 'text-purple-600',
            bg: 'bg-purple-50',
            badge: null,
          },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card>
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-10 h-10 ${stat.bg} rounded-xl flex items-center justify-center`}>
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                  {stat.badge && <Badge variant={RISK_VARIANT[stat.badge]}>{stat.badge}</Badge>}
                </div>
                <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                <div className="text-sm text-gray-600 mt-0.5">{stat.label}</div>
                <div className="text-xs text-gray-400 mt-0.5">{stat.sub}</div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Main charts row */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Risk trend */}
        <motion.div className="lg:col-span-2" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-brand-500" />
                  Org-wide Risk Score Trend
                </CardTitle>
                {summary?.riskTrend?.length > 1 && (() => {
                  const first = summary.riskTrend[0]?.score ?? 0;
                  const last = summary.riskTrend[summary.riskTrend.length - 1]?.score ?? 0;
                  const delta = last - first;
                  return delta <= 0
                    ? <Badge variant="success" className="text-xs">↓ Improving</Badge>
                    : <Badge variant="warning" className="text-xs">↑ Worsening</Badge>;
                })()}
              </div>
            </CardHeader>
            <CardContent>
              {summary?.riskTrend?.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={summary.riskTrend}>
                    <defs>
                      <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0e95e7" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#0e95e7" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="week" tick={{ fontSize: 10, fill: '#9ca3af' }} tickFormatter={(v) => v.slice(5)} interval="preserveStartEnd" />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#9ca3af' }} />
                    <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} formatter={(v: any) => [v, 'Risk Score']} />
                    <Area type="monotone" dataKey="score" stroke="#0e95e7" strokeWidth={2.5} fill="url(#riskGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
                  Not enough check-in data for trend
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Risk distribution donut */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Worker Risk Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              {riskDistData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={riskDistData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                      {riskDistData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                    <Legend iconType="circle" iconSize={8} formatter={(value) => <span className="text-xs">{value}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-48 flex items-center justify-center text-gray-400 text-sm">No worker data yet</div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Department risk */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-blue-500" />
                  Department Risk Scores
                </CardTitle>
                <Link to="/safety/departments">
                  <Button variant="ghost" size="sm" className="text-xs gap-1">
                    Details <ArrowRight className="w-3 h-3" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {summary?.deptScores?.length > 0 ? (
                <div className="space-y-3">
                  {summary.deptScores.map((dept: any) => (
                    <Link key={dept.id} to={`/safety/departments/${dept.id}`}>
                      <div className="hover:bg-gray-50 rounded-lg -mx-1 px-1 py-0.5 transition-colors">
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="font-medium text-gray-700">{dept.name}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">{dept.workerCount} workers</span>
                            <span className="font-semibold" style={{ color: riskColor(dept.score) }}>{dept.score}</span>
                          </div>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${dept.score}%`, background: riskColor(dept.score) }} />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 text-center py-6">No departments with workers yet</p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Top body regions */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Top Reported Body Regions</CardTitle>
            </CardHeader>
            <CardContent>
              {summary?.topRegions?.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={summary.topRegions.map((r: any, i: number) => ({ ...r, label: BODY_LABELS[r.region] ?? r.region, color: REGION_COLORS[i] }))} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 10, fill: '#9ca3af' }} />
                    <YAxis type="category" dataKey="label" tick={{ fontSize: 11, fill: '#6b7280' }} width={80} />
                    <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} formatter={(v: any) => [v, 'Reports']} />
                    <Bar dataKey="count" name="Reports" radius={[0, 4, 4, 0]}>
                      {summary.topRegions.map((_: any, i: number) => (
                        <Cell key={i} fill={REGION_COLORS[i]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-48 flex items-center justify-center text-gray-400 text-sm">No check-in data yet</div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* High-risk workers (anonymized — only if safety manager, not therapist) */}
      {summary?.topAtRiskWorkers?.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-red-500" /> Workers Requiring Attention
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {summary.topAtRiskWorkers.map((w: any, i: number) => (
                  <div key={w.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                    <span className="w-6 h-6 bg-gray-200 text-gray-600 rounded-full text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{w.firstName[0]}. {w.lastName}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-gray-700">{w.riskScore}</span>
                      <Badge variant={RISK_VARIANT[w.riskLevel]}>{w.riskLevel}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
