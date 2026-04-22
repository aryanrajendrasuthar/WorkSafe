import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { TrendingUp, AlertTriangle, ArrowRight, Activity } from 'lucide-react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

function DeltaBadge({ delta }: { delta: number }) {
  const isUp = delta > 0;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${isUp ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
      <TrendingUp className={`w-3 h-3 ${isUp ? '' : 'rotate-180'}`} />
      {isUp ? '+' : ''}{delta.toFixed(1)}
    </span>
  );
}

export default function TherapistEscalations() {
  const { data: escalations = [], isLoading } = useQuery({
    queryKey: ['therapist', 'escalations'],
    queryFn: () => api.get('/therapist/escalations').then((r) => r.data.data),
  });

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-gray-900">Pain Escalations</h1>
        <p className="text-gray-500">Workers with rising pain intensity over the last 7 days</p>
      </motion.div>

      {/* Summary card */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Workers Escalating', value: escalations.length, icon: TrendingUp, color: 'text-red-600', bg: 'bg-red-50' },
          { label: 'Avg Pain Delta', value: escalations.length ? `+${(escalations.reduce((s: number, e: any) => s + e.delta, 0) / escalations.length).toFixed(1)}` : '—', icon: Activity, color: 'text-orange-600', bg: 'bg-orange-50' },
          { label: 'Needs Review', value: escalations.filter((e: any) => e.delta > 2).length, icon: AlertTriangle, color: 'text-yellow-600', bg: 'bg-yellow-50' },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardContent className="flex items-center gap-4 p-4">
                <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-xs text-gray-500">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Escalations list */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-red-500" />
            Workers Requiring Attention
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-gray-100 animate-pulse rounded-xl" />
              ))}
            </div>
          ) : escalations.length === 0 ? (
            <div className="p-10 text-center text-gray-400">
              <TrendingUp className="w-10 h-10 mx-auto mb-2 opacity-30 rotate-180" />
              <p className="font-medium">No escalations right now</p>
              <p className="text-sm mt-1">All workers have stable or improving pain levels.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {escalations
                .slice()
                .sort((a: any, b: any) => b.delta - a.delta)
                .map((worker: any, i: number) => (
                  <motion.div
                    key={worker.workerId}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors"
                  >
                    <Avatar className="w-10 h-10 shrink-0">
                      <AvatarFallback className="bg-red-100 text-red-700 font-semibold text-sm">
                        {worker.firstName?.[0]}{worker.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900">{worker.firstName} {worker.lastName}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-gray-500">{worker.department ?? 'No department'}</span>
                        <span className="text-gray-300">·</span>
                        <span className="text-xs text-gray-500">{worker.checkinCount} check-ins this week</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right hidden sm:block">
                        <p className="text-xs text-gray-500">Latest intensity</p>
                        <p className="font-bold text-gray-900">{worker.latestIntensity?.toFixed(1) ?? '—'}<span className="text-xs font-normal text-gray-400">/10</span></p>
                      </div>
                      <DeltaBadge delta={worker.delta} />
                      <Button variant="ghost" size="sm" asChild>
                        <Link to={`/therapist/workers/${worker.workerId}`}>
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                      </Button>
                    </div>
                  </motion.div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info box */}
      <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 text-sm text-amber-800">
        <p className="font-semibold mb-1">How escalation is detected</p>
        <p>Workers are flagged when their average pain intensity in the second half of the last 7 days is more than 0.5 points higher than the first half. A positive delta means pain is trending upward.</p>
      </div>
    </div>
  );
}
