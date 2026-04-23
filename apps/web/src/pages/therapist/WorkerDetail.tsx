import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Dumbbell, Calendar,
  ChevronDown, ChevronUp, Plus, Target
} from 'lucide-react';
import { toast } from 'sonner';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { api } from '@/lib/api';
import { queryClient } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { BodyMap } from '@/components/BodyMap';

const BODY_COLORS: Record<string, string> = {
  LOWER_BACK: '#f97316', UPPER_BACK: '#8b5cf6', LEFT_SHOULDER: '#3b82f6',
  RIGHT_SHOULDER: '#06b6d4', HEAD_NECK: '#10b981', LEFT_WRIST_HAND: '#f59e0b',
  RIGHT_WRIST_HAND: '#ef4444', LEFT_KNEE: '#ec4899', RIGHT_KNEE: '#14b8a6',
};

const BODY_LABELS: Record<string, string> = {
  LOWER_BACK: 'Lower Back', UPPER_BACK: 'Upper Back', LEFT_SHOULDER: 'L. Shoulder',
  RIGHT_SHOULDER: 'R. Shoulder', HEAD_NECK: 'Neck', LEFT_WRIST_HAND: 'L. Wrist',
  RIGHT_WRIST_HAND: 'R. Wrist', LEFT_KNEE: 'L. Knee', RIGHT_KNEE: 'R. Knee',
};

const RISK_VARIANT: Record<string, any> = {
  low: 'risk_low', medium: 'risk_medium', high: 'risk_high', critical: 'risk_critical',
};

function AssignProgramModal({ workerId, onClose }: { workerId: string; onClose: () => void }) {
  const [selectedId, setSelectedId] = useState('');

  const { data: programs = [] } = useQuery({
    queryKey: ['programs', 'org'],
    queryFn: () => api.get('/programs/org').then((r) => r.data.data),
  });

  const assignMutation = useMutation({
    mutationFn: () => api.post(`/programs/${selectedId}/assign`, { workerId }),
    onSuccess: () => {
      toast.success('Program assigned');
      queryClient.invalidateQueries({ queryKey: ['therapist', 'worker', workerId] });
      onClose();
    },
    onError: () => toast.error('Failed to assign program'),
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl w-full max-w-md p-5 space-y-4"
      >
        <h3 className="font-bold text-gray-900">Assign Program</h3>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {programs.map((p: any) => (
            <button
              key={p.id}
              onClick={() => setSelectedId(p.id)}
              className={`w-full text-left p-3 rounded-xl border transition-all ${selectedId === p.id ? 'border-brand-500 bg-brand-50' : 'border-gray-200 hover:border-gray-300'}`}
            >
              <p className="font-medium text-sm text-gray-900">{p.name}</p>
              <p className="text-xs text-gray-500">{p.programExercises?.length ?? 0} exercises · {p.goal}</p>
            </button>
          ))}
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button className="flex-1" disabled={!selectedId} loading={assignMutation.isPending} onClick={() => assignMutation.mutate()}>
            Assign
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

export default function WorkerDetail() {
  const { id } = useParams<{ id: string }>();
  const [showAssign, setShowAssign] = useState(false);
  const [expandCheckins, setExpandCheckins] = useState(false);

  const { data: worker, isLoading } = useQuery({
    queryKey: ['therapist', 'worker', id],
    queryFn: () => api.get(`/therapist/workers/${id}`).then((r) => r.data.data),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => <div key={i} className="h-32 bg-gray-100 rounded-2xl animate-pulse" />)}
      </div>
    );
  }

  if (!worker) return <div className="text-gray-500">Worker not found</div>;

  const trendKeys = worker.painTrend?.length > 0
    ? Object.keys(worker.painTrend[0]).filter((k) => k !== 'date').slice(0, 5)
    : [];

  // Build body map heatmap from last 30 days
  const bodyMapSelections = trendKeys.map((key) => {
    const vals = worker.painTrend.map((d: any) => d[key]).filter(Boolean);
    const avg = vals.length ? vals.reduce((a: number, b: number) => a + b, 0) / vals.length : 0;
    return { region: key as any, intensity: Math.round(avg) };
  }).filter((s: any) => s.intensity > 0);

  return (
    <div className="space-y-5 max-w-4xl">
      {showAssign && id && <AssignProgramModal workerId={id} onClose={() => setShowAssign(false)} />}

      {/* Back */}
      <Link to="/therapist/workers" className="flex items-center gap-1 text-sm text-brand-600 font-medium hover:text-brand-700">
        <ArrowLeft className="w-4 h-4" /> Back to workers
      </Link>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <Avatar className="w-14 h-14 shrink-0">
              <AvatarFallback className="text-lg font-bold bg-brand-100 text-brand-700">
                {worker.firstName[0]}{worker.lastName[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold text-gray-900">{worker.firstName} {worker.lastName}</h2>
                <Badge variant={RISK_VARIANT[worker.riskLevel]}>{worker.riskLevel} risk · {worker.riskScore}</Badge>
              </div>
              <p className="text-gray-500 text-sm mt-0.5">
                {worker.department?.name ?? 'No dept'} · {worker.jobProfile?.title ?? 'No title'}
              </p>
              <p className="text-xs text-gray-400 mt-1">{worker.email}</p>
            </div>
            <Button size="sm" className="gap-1.5 shrink-0" onClick={() => setShowAssign(true)}>
              <Plus className="w-3.5 h-3.5" /> Assign Program
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Pain trend chart */}
        <div className="lg:col-span-2 space-y-5">
          {worker.painTrend?.length > 0 && trendKeys.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Pain Trend — Last 30 Days</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={worker.painTrend} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9ca3af' }} tickFormatter={(v) => v.slice(5)} interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} domain={[0, 10]} ticks={[0, 5, 10]} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v: any, name: string) => [v, BODY_LABELS[name] ?? name]} />
                    {trendKeys.map((key) => (
                      <Line key={key} type="monotone" dataKey={key} stroke={BODY_COLORS[key] ?? '#6b7280'} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap gap-3 mt-2">
                  {trendKeys.map((key) => (
                    <span key={key} className="flex items-center gap-1.5 text-xs text-gray-500">
                      <span className="w-3 h-1.5 rounded-full" style={{ background: BODY_COLORS[key] ?? '#6b7280' }} />
                      {BODY_LABELS[key] ?? key}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Programs */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Dumbbell className="w-4 h-4 text-purple-500" /> Active Programs
                </CardTitle>
                <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={() => setShowAssign(true)}>
                  <Plus className="w-3 h-3" /> Assign
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {worker.workerPrograms?.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">No active programs</p>
              ) : (
                <div className="space-y-3">
                  {worker.workerPrograms?.map((wp: any) => {
                    const completed = wp.sessionLogs?.reduce((s: number, l: any) => s + l.exercisesCompleted, 0) ?? 0;
                    const total = wp.sessionLogs?.reduce((s: number, l: any) => s + l.exercisesTotal, 0) ?? 0;
                    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
                    return (
                      <div key={wp.id} className="p-3 bg-gray-50 rounded-xl">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-semibold text-gray-900">{wp.program.name}</p>
                          <span className="text-xs text-gray-500">{wp.sessionLogs?.length ?? 0} sessions</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Progress value={rate} className="h-1.5 flex-1" />
                          <span className="text-xs text-gray-500 shrink-0">{rate}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Check-in log */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-brand-500" /> Check-in Log
                </CardTitle>
                <button onClick={() => setExpandCheckins((v) => !v)} className="text-xs text-gray-500 flex items-center gap-1">
                  {expandCheckins ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  {expandCheckins ? 'Show less' : 'Show all'}
                </button>
              </div>
            </CardHeader>
            <CardContent>
              {worker.checkIns?.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">No check-ins yet</p>
              ) : (
                <div className="space-y-2">
                  {(expandCheckins ? worker.checkIns : worker.checkIns?.slice(0, 5)).map((c: any) => (
                    <div key={c.id} className="flex items-center gap-3 py-2 border-b last:border-0">
                      <div className="text-xs text-gray-500 w-16 shrink-0">
                        {new Date(c.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </div>
                      <Badge variant={c.overallStatus === 'NONE' ? 'success' : c.overallStatus === 'MILD' ? 'warning' : 'danger'} className="text-[10px]">
                        {c.overallStatus}
                      </Badge>
                      <div className="flex gap-1 flex-wrap">
                        {c.bodyAreas?.slice(0, 3).map((a: any) => (
                          <span key={a.id} className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">
                            {BODY_LABELS[a.bodyPart] ?? a.bodyPart} {a.intensity}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Body map heatmap */}
        <div className="space-y-5">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">30-Day Pain Map</CardTitle>
            </CardHeader>
            <CardContent>
              <BodyMap selections={bodyMapSelections} readonly size="md" />
            </CardContent>
          </Card>

          {/* Job profile */}
          {worker.jobProfile && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Target className="w-4 h-4 text-gray-500" /> Job Profile
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Role</span><span className="font-medium">{worker.jobProfile.title}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Category</span><span className="font-medium">{worker.jobProfile.jobCategory}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Demand</span><span className="font-medium">{worker.jobProfile.physicalDemandLevel}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Shift</span><span className="font-medium">{worker.jobProfile.shiftType}</span></div>
                {worker.jobProfile.hoursPerDay && (
                  <div className="flex justify-between"><span className="text-gray-500">Hours/day</span><span className="font-medium">{worker.jobProfile.hoursPerDay}h</span></div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
