import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Building2, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const RISK_VARIANT: Record<string, any> = {
  low: 'risk_low', medium: 'risk_medium', high: 'risk_high', critical: 'risk_critical',
};

function riskLevel(score: number) {
  if (score < 25) return 'low';
  if (score < 50) return 'medium';
  if (score < 75) return 'high';
  return 'critical';
}

function riskColor(score: number) {
  if (score < 25) return '#22c55e';
  if (score < 50) return '#f59e0b';
  if (score < 75) return '#f97316';
  return '#ef4444';
}

export default function SafetyDepartments() {
  const { data: summary, isLoading } = useQuery({
    queryKey: ['risk', 'summary'],
    queryFn: () => api.get('/risk/summary').then((r) => r.data.data),
    staleTime: 5 * 60 * 1000,
  });

  const depts = summary?.deptScores ?? [];

  return (
    <div className="space-y-5 max-w-3xl">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-gray-900">Departments</h1>
        <p className="text-gray-500 text-sm">{depts.length} departments · sorted by risk score</p>
      </motion.div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : depts.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-gray-400">
            <Building2 className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p>No departments found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {depts.map((dept: any, i: number) => {
            const level = riskLevel(dept.score);
            return (
              <motion.div key={dept.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <Link to={`/safety/departments/${dept.id}`}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                        <Building2 className="w-5 h-5 text-blue-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900">{dept.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden max-w-32">
                            <div className="h-full rounded-full" style={{ width: `${dept.score}%`, background: riskColor(dept.score) }} />
                          </div>
                          <span className="text-xs text-gray-500">{dept.workerCount} workers</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <p className="text-lg font-bold text-gray-900">{dept.score}</p>
                          <p className="text-[10px] text-gray-400">/ 100</p>
                        </div>
                        <Badge variant={RISK_VARIANT[level]}>{level}</Badge>
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
