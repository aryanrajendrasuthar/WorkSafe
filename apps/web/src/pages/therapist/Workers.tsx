import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Search, TrendingUp, TrendingDown, Minus, ChevronRight, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

const RISK_VARIANT: Record<string, any> = {
  low: 'risk_low', medium: 'risk_medium', high: 'risk_high', critical: 'risk_critical',
};

const RISK_ORDER: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };

export default function TherapistWorkers() {
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState('');

  const { data: workers = [], isLoading } = useQuery({
    queryKey: ['therapist', 'workers'],
    queryFn: () => api.get('/therapist/workers').then((r) => r.data.data),
  });

  const filtered = workers
    .filter((w: any) => {
      const name = `${w.firstName} ${w.lastName}`.toLowerCase();
      const matchSearch = !search || name.includes(search.toLowerCase()) || (w.department ?? '').toLowerCase().includes(search.toLowerCase());
      const matchRisk = !riskFilter || w.riskLevel === riskFilter;
      return matchSearch && matchRisk;
    })
    .sort((a: any, b: any) => RISK_ORDER[a.riskLevel] - RISK_ORDER[b.riskLevel]);

  return (
    <div className="space-y-5">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-gray-900">Workers</h1>
        <p className="text-gray-500 text-sm">{workers.length} workers under your care</p>
      </motion.div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search name or department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-300"
          />
        </div>
        <div className="flex gap-1.5">
          {['', 'critical', 'high', 'medium', 'low'].map((r) => (
            <button
              key={r}
              onClick={() => setRiskFilter(r)}
              className={cn(
                'px-3 py-2 text-xs rounded-xl border transition-all font-medium',
                riskFilter === r ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 text-gray-500 hover:border-gray-400',
              )}
            >
              {r || 'All'}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-gray-400">
            <Users className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p>No workers found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((w: any, i: number) => (
            <motion.div key={w.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
              <Link to={`/therapist/workers/${w.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4 flex items-center gap-4">
                    <Avatar className="w-10 h-10 shrink-0">
                      <AvatarFallback className={cn('font-semibold text-sm', {
                        'bg-red-100 text-red-700': w.riskLevel === 'critical',
                        'bg-orange-100 text-orange-700': w.riskLevel === 'high',
                        'bg-yellow-100 text-yellow-700': w.riskLevel === 'medium',
                        'bg-green-100 text-green-700': w.riskLevel === 'low',
                      })}>
                        {w.firstName[0]}{w.lastName[0]}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-gray-900">{w.firstName} {w.lastName}</p>
                        {w.trend === 'up' && <TrendingUp className="w-3.5 h-3.5 text-red-500" />}
                        {w.trend === 'down' && <TrendingDown className="w-3.5 h-3.5 text-green-500" />}
                        {w.trend === 'stable' && <Minus className="w-3.5 h-3.5 text-gray-400" />}
                        {w.predictedToEscalate && (
                          <span className="text-[9px] bg-red-100 text-red-700 border border-red-200 px-1.5 py-0.5 rounded-full font-semibold tracking-wide">
                            ⚡ ESCALATION RISK
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {w.department ?? 'No dept'} · {w.jobTitle ?? 'No title'} · {w.checkinCount} check-ins
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right hidden sm:block">
                        <p className="text-xs text-gray-400">
                          {w.lastCheckinDate ? new Date(w.lastCheckinDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Never'}
                        </p>
                        <p className="text-xs text-gray-500">{w.activePrograms?.length ?? 0} program{w.activePrograms?.length !== 1 ? 's' : ''}</p>
                      </div>
                      <Badge variant={RISK_VARIANT[w.riskLevel]}>{w.riskLevel}</Badge>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
