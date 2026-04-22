import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Users, AlertTriangle, Dumbbell, Activity, ArrowRight, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

const RISK_VARIANT: Record<string, any> = {
  low: 'risk_low', medium: 'risk_medium', high: 'risk_high', critical: 'risk_critical',
};

function TrendIcon({ trend }: { trend: string }) {
  if (trend === 'up') return <TrendingUp className="w-3.5 h-3.5 text-red-500" />;
  if (trend === 'down') return <TrendingDown className="w-3.5 h-3.5 text-green-500" />;
  return <Minus className="w-3.5 h-3.5 text-gray-400" />;
}

export default function TherapistDashboard() {
  const user = useAuthStore((s) => s.user);

  const { data: workers = [] } = useQuery({
    queryKey: ['therapist', 'workers'],
    queryFn: () => api.get('/therapist/workers').then((r) => r.data.data),
  });

  const { data: escalations = [] } = useQuery({
    queryKey: ['therapist', 'escalations'],
    queryFn: () => api.get('/therapist/escalations').then((r) => r.data.data),
  });

  const totalWorkers = workers.length;
  const highRisk = workers.filter((w: any) => w.riskLevel === 'high' || w.riskLevel === 'critical').length;
  const checkinRate = workers.length
    ? Math.round((workers.filter((w: any) => w.lastCheckinDate).length / workers.length) * 100)
    : 0;
  const activePrograms = workers.reduce((s: number, w: any) => s + (w.activePrograms?.length ?? 0), 0);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-gray-900">{greeting}, {user?.firstName}</h1>
        <p className="text-gray-500">Here's your patient overview for today.</p>
      </motion.div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Users, label: 'Active Workers', value: totalWorkers, sub: 'Under your care', color: 'text-blue-600', bg: 'bg-blue-50' },
          { icon: AlertTriangle, label: 'Escalations', value: escalations.length, sub: 'Pain trending up', color: 'text-orange-600', bg: 'bg-orange-50' },
          { icon: Dumbbell, label: 'Active Programs', value: activePrograms, sub: 'Across all workers', color: 'text-purple-600', bg: 'bg-purple-50' },
          { icon: Activity, label: 'Check-in Rate', value: `${checkinRate}%`, sub: 'Workers checked in', color: 'text-green-600', bg: 'bg-green-50' },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card>
              <CardContent className="p-5">
                <div className={`w-10 h-10 ${stat.bg} rounded-xl flex items-center justify-center mb-3`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                <div className="text-sm text-gray-600 mt-0.5">{stat.label}</div>
                <div className="text-xs text-gray-400 mt-0.5">{stat.sub}</div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Escalations */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-500" />
                Pain Escalations
              </CardTitle>
              <Link to="/therapist/workers">
                <Button variant="ghost" size="sm" className="text-xs gap-1">View all <ArrowRight className="w-3 h-3" /></Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {escalations.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">No escalations — all workers stable</p>
            ) : (
              <div className="space-y-2">
                {escalations.slice(0, 4).map((e: any) => (
                  <Link key={e.workerId} to={`/therapist/workers/${e.workerId}`}>
                    <div className="flex items-center gap-3 p-3 rounded-xl border hover:bg-gray-50 transition-colors">
                      <Avatar className="w-8 h-8 shrink-0">
                        <AvatarFallback className="text-xs gradient-brand text-white">
                          {e.firstName[0]}{e.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{e.firstName} {e.lastName}</p>
                        <p className="text-xs text-gray-500">{e.department ?? 'No dept'} · avg {e.latestIntensity}/10</p>
                      </div>
                      <Badge variant="risk_high" className="shrink-0">+{e.delta} pts</Badge>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Worker risk list */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-500" />
                Worker Risk Overview
              </CardTitle>
              <Link to="/therapist/workers">
                <Button variant="ghost" size="sm" className="text-xs gap-1">All workers <ArrowRight className="w-3 h-3" /></Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {workers.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">No workers onboarded yet</p>
            ) : (
              <div className="space-y-2">
                {[...workers]
                  .sort((a: any, b: any) => b.riskScore - a.riskScore)
                  .slice(0, 5)
                  .map((w: any) => (
                    <Link key={w.id} to={`/therapist/workers/${w.id}`}>
                      <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                        <Avatar className="w-8 h-8 shrink-0">
                          <AvatarFallback className="text-xs bg-gray-100 text-gray-600">
                            {w.firstName[0]}{w.lastName[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">{w.firstName} {w.lastName}</p>
                          <p className="text-xs text-gray-500">{w.department ?? 'No dept'} · {w.jobTitle ?? 'No title'}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <TrendIcon trend={w.trend} />
                          <Badge variant={RISK_VARIANT[w.riskLevel]}>{w.riskLevel}</Badge>
                        </div>
                      </div>
                    </Link>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* High-risk workers highlight */}
      {highRisk > 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="border-red-200 bg-red-50/50">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="font-semibold text-red-900">{highRisk} worker{highRisk > 1 ? 's' : ''} at high or critical risk</p>
                  <p className="text-sm text-red-700">Consider reviewing their programs and check-in history</p>
                </div>
              </div>
              <Link to="/therapist/workers">
                <Button variant="outline" size="sm" className="border-red-300 text-red-700 hover:bg-red-100">Review</Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
