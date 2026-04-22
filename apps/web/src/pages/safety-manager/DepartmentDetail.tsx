import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowLeft, Users } from 'lucide-react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';

const RISK_VARIANT: Record<string, any> = {
  low: 'risk_low', medium: 'risk_medium', high: 'risk_high', critical: 'risk_critical',
};

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

export default function DepartmentDetail() {
  const { id } = useParams<{ id: string }>();

  const { data: dept, isLoading } = useQuery({
    queryKey: ['risk', 'dept', id],
    queryFn: () => api.get(`/risk/departments/${id}`).then((r) => r.data.data),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => <div key={i} className="h-32 bg-gray-100 rounded-2xl animate-pulse" />)}
      </div>
    );
  }

  if (!dept) return <div className="text-gray-500">Department not found</div>;

  const riskDistData = [
    { name: 'Low', value: dept.riskDistribution.low, color: '#22c55e' },
    { name: 'Medium', value: dept.riskDistribution.medium, color: '#f59e0b' },
    { name: 'High', value: dept.riskDistribution.high, color: '#f97316' },
    { name: 'Critical', value: dept.riskDistribution.critical, color: '#ef4444' },
  ].filter((d) => d.value > 0);

  return (
    <div className="space-y-5 max-w-4xl">
      <Link to="/safety/departments" className="flex items-center gap-1 text-sm text-brand-600 font-medium hover:text-brand-700">
        <ArrowLeft className="w-4 h-4" /> Back to departments
      </Link>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center shrink-0">
              <Users className="w-7 h-7 text-blue-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-xl font-bold text-gray-900">{dept.name}</h2>
                <Badge variant={RISK_VARIANT[dept.deptRiskLevel]}>{dept.deptRiskLevel} risk</Badge>
              </div>
              <p className="text-gray-500 text-sm mt-0.5">{dept.workerCount} workers</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-3xl font-bold" style={{ color: riskColor(dept.deptScore) }}>{dept.deptScore}</p>
              <p className="text-xs text-gray-400">risk score</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Risk distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Worker Risk Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {riskDistData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={riskDistData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="value">
                    {riskDistData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                  <Legend iconType="circle" iconSize={8} formatter={(v) => <span className="text-xs">{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-48 flex items-center justify-center text-gray-400 text-sm">No data yet</div>
            )}
          </CardContent>
        </Card>

        {/* Top body regions */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Top Body Regions</CardTitle>
          </CardHeader>
          <CardContent>
            {dept.topRegions?.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={dept.topRegions.map((r: any, i: number) => ({ ...r, label: BODY_LABELS[r.region] ?? r.region }))} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10, fill: '#9ca3af' }} />
                  <YAxis type="category" dataKey="label" tick={{ fontSize: 11, fill: '#6b7280' }} width={80} />
                  <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {dept.topRegions.map((_: any, i: number) => <Cell key={i} fill={REGION_COLORS[i]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-48 flex items-center justify-center text-gray-400 text-sm">No check-in data</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Program compliance */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Program Compliance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Progress value={dept.avgCompliance} className="h-3" />
            </div>
            <span className="text-2xl font-bold text-gray-900 shrink-0">{dept.avgCompliance}%</span>
          </div>
          <p className="text-xs text-gray-400 mt-2">Average session completion rate across active programs</p>
        </CardContent>
      </Card>

      {/* Worker risk list */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Workers by Risk Score</CardTitle>
        </CardHeader>
        <CardContent>
          {dept.workers?.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">No workers in this department</p>
          ) : (
            <div className="space-y-2">
              {dept.workers?.map((w: any, i: number) => (
                <div key={w.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                  <span className="w-5 h-5 bg-gray-200 text-gray-600 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                  <p className="text-sm font-medium text-gray-700 flex-1">{w.firstName[0]}. {w.lastName}</p>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${w.riskScore}%`, background: riskColor(w.riskScore) }} />
                    </div>
                    <span className="text-sm font-semibold text-gray-700 w-6 text-right">{w.riskScore}</span>
                    <Badge variant={RISK_VARIANT[riskLevel(w.riskScore)]} className="text-[10px]">{riskLevel(w.riskScore)}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
