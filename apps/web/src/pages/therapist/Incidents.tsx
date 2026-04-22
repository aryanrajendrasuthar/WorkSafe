import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Plus, AlertTriangle, ChevronDown, FileText, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { queryClient } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const BODY_PARTS = [
  'HEAD_NECK', 'LEFT_SHOULDER', 'RIGHT_SHOULDER', 'UPPER_BACK', 'LOWER_BACK',
  'LEFT_ELBOW', 'RIGHT_ELBOW', 'LEFT_WRIST_HAND', 'RIGHT_WRIST_HAND', 'CHEST',
  'ABDOMEN', 'LEFT_HIP', 'RIGHT_HIP', 'LEFT_KNEE', 'RIGHT_KNEE',
  'LEFT_ANKLE_FOOT', 'RIGHT_ANKLE_FOOT',
];

const SEVERITIES = ['MINOR', 'MODERATE', 'SERIOUS', 'CRITICAL'];
const STATUSES = ['OPEN', 'UNDER_REVIEW', 'RTW_IN_PROGRESS', 'RESOLVED', 'CLOSED'];

const SEVERITY_VARIANT: Record<string, string> = {
  MINOR: 'success', MODERATE: 'warning', SERIOUS: 'danger', CRITICAL: 'danger',
};

const STATUS_COLORS: Record<string, string> = {
  OPEN: 'bg-red-100 text-red-700',
  UNDER_REVIEW: 'bg-orange-100 text-orange-700',
  RTW_IN_PROGRESS: 'bg-blue-100 text-blue-700',
  RESOLVED: 'bg-green-100 text-green-700',
  CLOSED: 'bg-gray-100 text-gray-600',
};

function LogIncidentModal({ onClose }: { onClose: () => void }) {
  const [workerId, setWorkerId] = useState('');
  const [bodyPart, setBodyPart] = useState('LOWER_BACK');
  const [injuryType, setInjuryType] = useState('');
  const [severity, setSeverity] = useState('MODERATE');
  const [incidentDate, setIncidentDate] = useState(new Date().toISOString().split('T')[0]);
  const [taskAtTime, setTaskAtTime] = useState('');
  const [description, setDescription] = useState('');
  const [isOshaRecordable, setIsOshaRecordable] = useState(false);

  const { data: workers = [] } = useQuery({
    queryKey: ['therapist', 'workers'],
    queryFn: () => api.get('/therapist/workers').then((r) => r.data.data),
    staleTime: 60_000,
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/incidents', data),
    onSuccess: () => {
      toast.success('Incident logged');
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
      onClose();
    },
    onError: () => toast.error('Failed to log incident'),
  });

  const handleSubmit = () => {
    if (!workerId) { toast.error('Select a worker'); return; }
    if (!injuryType.trim()) { toast.error('Injury type is required'); return; }
    createMutation.mutate({ workerId, bodyPart, injuryType, severity, incidentDate, taskAtTime: taskAtTime || undefined, description: description || undefined, isOshaRecordable });
  };

  const inputCls = 'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300';

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        className="bg-white rounded-2xl w-full max-w-lg p-5 space-y-4 max-h-[90vh] overflow-y-auto"
      >
        <h3 className="font-bold text-gray-900 text-lg">Log Incident</h3>

        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">Worker *</label>
            <select value={workerId} onChange={(e) => setWorkerId(e.target.value)} className={inputCls}>
              <option value="">Select worker...</option>
              {workers.map((w: any) => (
                <option key={w.id} value={w.id}>{w.firstName} {w.lastName} — {w.department ?? 'No dept'}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Body Part *</label>
              <select value={bodyPart} onChange={(e) => setBodyPart(e.target.value)} className={inputCls}>
                {BODY_PARTS.map((p) => <option key={p} value={p}>{p.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Severity</label>
              <select value={severity} onChange={(e) => setSeverity(e.target.value)} className={inputCls}>
                {SEVERITIES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">Injury Type *</label>
            <input type="text" value={injuryType} onChange={(e) => setInjuryType(e.target.value)} placeholder="e.g. Strain, Sprain, Contusion" className={inputCls} />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">Incident Date *</label>
            <input type="date" value={incidentDate} onChange={(e) => setIncidentDate(e.target.value)} className={inputCls} />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">Task at Time of Injury</label>
            <input type="text" value={taskAtTime} onChange={(e) => setTaskAtTime(e.target.value)} placeholder="e.g. Lifting boxes, Operating machinery" className={inputCls} />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">Description</label>
            <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description of what happened..." className={`${inputCls} resize-none`} />
          </div>

          <label className="flex items-center gap-2.5 cursor-pointer">
            <input type="checkbox" checked={isOshaRecordable} onChange={(e) => setIsOshaRecordable(e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-brand-600" />
            <span className="text-sm text-gray-700">OSHA Recordable Incident</span>
          </label>
        </div>

        <div className="flex gap-3 pt-1">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button className="flex-1" onClick={handleSubmit} loading={createMutation.isPending}>Log Incident</Button>
        </div>
      </motion.div>
    </div>
  );
}

export default function TherapistIncidents() {
  const [showLog, setShowLog] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: incidents = [], isLoading } = useQuery({
    queryKey: ['incidents'],
    queryFn: () => api.get('/incidents').then((r) => r.data.data),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/incidents/${id}/status`, { status }),
    onSuccess: () => {
      toast.success('Status updated');
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
    },
    onError: () => toast.error('Failed to update status'),
  });

  const filtered = statusFilter ? incidents.filter((i: any) => i.status === statusFilter) : incidents;

  return (
    <div className="space-y-5 max-w-4xl">
      <AnimatePresence>
        {showLog && <LogIncidentModal onClose={() => setShowLog(false)} />}
      </AnimatePresence>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Incidents</h1>
          <p className="text-gray-500 text-sm">{incidents.length} total incidents logged</p>
        </div>
        <Button className="gap-1.5" onClick={() => setShowLog(true)}>
          <Plus className="w-4 h-4" /> Log Incident
        </Button>
      </motion.div>

      {/* Status filter */}
      <div className="flex gap-2 flex-wrap">
        {['', ...STATUSES].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 text-xs rounded-xl border transition-all font-medium ${statusFilter === s ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 text-gray-500 hover:border-gray-400'}`}
          >
            {s || 'All'}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-gray-400">
            <FileText className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p>No incidents found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((inc: any, i: number) => (
            <motion.div key={inc.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
              <Card>
                <CardContent className="p-0">
                  <button
                    onClick={() => setExpandedId(expandedId === inc.id ? null : inc.id)}
                    className="w-full text-left p-4 flex items-center gap-4"
                  >
                    <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center shrink-0">
                      <AlertTriangle className="w-5 h-5 text-orange-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-gray-900 text-sm">
                          {inc.worker.firstName} {inc.worker.lastName}
                        </p>
                        <Badge variant={SEVERITY_VARIANT[inc.severity] as any} className="text-[10px]">{inc.severity}</Badge>
                      <Link to={`/therapist/incidents/${inc.id}`} onClick={(e) => e.stopPropagation()} className="text-brand-500 hover:text-brand-600">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                        {inc.isOshaRecordable && (
                          <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-medium">OSHA</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {inc.injuryType} · {inc.bodyPart.replace(/_/g, ' ')} · {new Date(inc.incidentDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-[11px] px-2 py-1 rounded-lg font-medium ${STATUS_COLORS[inc.status]}`}>
                        {inc.status.replace(/_/g, ' ')}
                      </span>
                      <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${expandedId === inc.id ? 'rotate-180' : ''}`} />
                    </div>
                  </button>

                  <AnimatePresence>
                    {expandedId === inc.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 pt-0 border-t border-gray-100 space-y-3">
                          {inc.taskAtTime && (
                            <div>
                              <p className="text-xs text-gray-400 mb-0.5">Task at time</p>
                              <p className="text-sm text-gray-700">{inc.taskAtTime}</p>
                            </div>
                          )}
                          {inc.description && (
                            <div>
                              <p className="text-xs text-gray-400 mb-0.5">Description</p>
                              <p className="text-sm text-gray-700">{inc.description}</p>
                            </div>
                          )}
                          <div>
                            <p className="text-xs text-gray-400 mb-1.5">Update Status</p>
                            <div className="flex flex-wrap gap-1.5">
                              {STATUSES.map((s) => (
                                <button
                                  key={s}
                                  onClick={() => updateStatusMutation.mutate({ id: inc.id, status: s })}
                                  className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all font-medium ${inc.status === s ? STATUS_COLORS[s] + ' border-transparent' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
                                >
                                  {s.replace(/_/g, ' ')}
                                </button>
                              ))}
                            </div>
                          </div>
                          <p className="text-xs text-gray-400">
                            Reported by {inc.reportedBy.firstName} {inc.reportedBy.lastName}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
