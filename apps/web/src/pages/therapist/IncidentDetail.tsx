import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, CheckCircle, Clock, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { queryClient } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const SEVERITY_VARIANT: Record<string, any> = {
  MINOR: 'success', MODERATE: 'warning', SERIOUS: 'danger', CRITICAL: 'danger',
};

const STATUS_COLORS: Record<string, string> = {
  OPEN: 'bg-red-100 text-red-700',
  UNDER_REVIEW: 'bg-orange-100 text-orange-700',
  RTW_IN_PROGRESS: 'bg-blue-100 text-blue-700',
  RESOLVED: 'bg-green-100 text-green-700',
  CLOSED: 'bg-gray-100 text-gray-600',
};

const MILESTONE_TYPES = ['LIGHT_DUTY', 'MODIFIED_DUTY', 'FULL_DUTY'];

const MILESTONE_LABELS: Record<string, string> = {
  LIGHT_DUTY: 'Light Duty', MODIFIED_DUTY: 'Modified Duty', FULL_DUTY: 'Full Duty',
};

const MILESTONE_ICONS: Record<string, string> = {
  LIGHT_DUTY: '🟡', MODIFIED_DUTY: '🔵', FULL_DUTY: '🟢',
};

function AddMilestoneModal({ incidentId, onClose }: { incidentId: string; onClose: () => void }) {
  const [milestoneType, setMilestoneType] = useState('LIGHT_DUTY');
  const [targetDate, setTargetDate] = useState('');
  const [notes, setNotes] = useState('');

  const mutation = useMutation({
    mutationFn: () => api.post(`/incidents/${incidentId}/milestones`, { milestoneType, targetDate: targetDate || undefined, notes: notes || undefined }),
    onSuccess: () => {
      toast.success('Milestone added');
      queryClient.invalidateQueries({ queryKey: ['incident', incidentId] });
      onClose();
    },
    onError: () => toast.error('Failed to add milestone'),
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl w-full max-w-sm p-5 space-y-4">
        <h3 className="font-bold text-gray-900">Add RTW Milestone</h3>
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">Milestone Type</label>
            <select value={milestoneType} onChange={(e) => setMilestoneType(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300">
              {MILESTONE_TYPES.map((t) => <option key={t} value={t}>{MILESTONE_LABELS[t]}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">Target Date</label>
            <input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">Notes</label>
            <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-300" />
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button className="flex-1" onClick={() => mutation.mutate()} loading={mutation.isPending}>Add Milestone</Button>
        </div>
      </motion.div>
    </div>
  );
}

export default function IncidentDetail() {
  const { id } = useParams<{ id: string }>();
  const [showAddMilestone, setShowAddMilestone] = useState(false);

  const { data: incident, isLoading } = useQuery({
    queryKey: ['incident', id],
    queryFn: () => api.get(`/incidents/${id}`).then((r) => r.data.data),
    enabled: !!id,
  });

  const updateStatusMutation = useMutation({
    mutationFn: (status: string) => api.patch(`/incidents/${id}/status`, { status }),
    onSuccess: () => {
      toast.success('Status updated');
      queryClient.invalidateQueries({ queryKey: ['incident', id] });
    },
    onError: () => toast.error('Failed'),
  });

  const clearMutation = useMutation({
    mutationFn: (milestoneId: string) => api.patch(`/incidents/milestones/${milestoneId}/clear`),
    onSuccess: () => {
      toast.success('Milestone cleared');
      queryClient.invalidateQueries({ queryKey: ['incident', id] });
    },
    onError: () => toast.error('Failed'),
  });

  if (isLoading) {
    return <div className="space-y-4">{[1, 2, 3].map((i) => <div key={i} className="h-32 bg-gray-100 rounded-2xl animate-pulse" />)}</div>;
  }

  if (!incident) return <div className="text-gray-500">Incident not found</div>;

  const milestones = incident.rtwMilestones ?? [];
  const clearedCount = milestones.filter((m: any) => m.status === 'CLEARED').length;

  return (
    <div className="space-y-5 max-w-3xl">
      <AnimatePresence>
        {showAddMilestone && id && <AddMilestoneModal incidentId={id} onClose={() => setShowAddMilestone(false)} />}
      </AnimatePresence>

      <Link to="/therapist/incidents" className="flex items-center gap-1 text-sm text-brand-600 font-medium hover:text-brand-700">
        <ArrowLeft className="w-4 h-4" /> Back to incidents
      </Link>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h2 className="text-xl font-bold text-gray-900">{incident.worker.firstName} {incident.worker.lastName}</h2>
                  <Badge variant={SEVERITY_VARIANT[incident.severity]}>{incident.severity}</Badge>
                  {incident.isOshaRecordable && <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">OSHA Recordable</span>}
                </div>
                <p className="text-gray-500 text-sm">{incident.injuryType} · {incident.bodyPart.replace(/_/g, ' ')}</p>
                <p className="text-gray-400 text-xs mt-1">
                  Incident: {new Date(incident.incidentDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                  {' · '}Reported by {incident.reportedBy.firstName} {incident.reportedBy.lastName}
                </p>
              </div>
              <span className={`text-sm px-3 py-1.5 rounded-xl font-medium ${STATUS_COLORS[incident.status]}`}>
                {incident.status.replace(/_/g, ' ')}
              </span>
            </div>

            {(incident.taskAtTime || incident.description) && (
              <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
                {incident.taskAtTime && <p className="text-sm text-gray-600"><span className="font-medium">Task: </span>{incident.taskAtTime}</p>}
                {incident.description && <p className="text-sm text-gray-600"><span className="font-medium">Description: </span>{incident.description}</p>}
              </div>
            )}

            {/* Status update */}
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-400 mb-2 font-medium">Update Status</p>
              <div className="flex flex-wrap gap-1.5">
                {['OPEN', 'UNDER_REVIEW', 'RTW_IN_PROGRESS', 'RESOLVED', 'CLOSED'].map((s) => (
                  <button
                    key={s}
                    onClick={() => updateStatusMutation.mutate(s)}
                    className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all font-medium ${incident.status === s ? STATUS_COLORS[s] + ' border-transparent' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
                  >
                    {s.replace(/_/g, ' ')}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* RTW Timeline */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Return-to-Work Timeline</CardTitle>
            <div className="flex items-center gap-3">
              {milestones.length > 0 && (
                <span className="text-xs text-gray-500">{clearedCount} / {milestones.length} cleared</span>
              )}
              <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={() => setShowAddMilestone(true)}>
                <Plus className="w-3 h-3" /> Add Milestone
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {milestones.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Clock className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No RTW milestones yet. Add the first milestone to begin tracking return-to-work progress.</p>
            </div>
          ) : (
            <div className="relative">
              {/* Vertical connector line */}
              <div className="absolute left-5 top-6 bottom-6 w-0.5 bg-gray-100" />
              <div className="space-y-4">
                {milestones.map((m: any, i: number) => (
                  <motion.div key={m.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="relative flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 z-10 text-lg ${m.status === 'CLEARED' ? 'bg-green-100' : m.status === 'IN_PROGRESS' ? 'bg-blue-100' : 'bg-gray-100'}`}>
                      {m.status === 'CLEARED' ? '✅' : MILESTONE_ICONS[m.milestoneType]}
                    </div>
                    <div className="flex-1 pt-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-sm text-gray-900">{MILESTONE_LABELS[m.milestoneType]}</p>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${m.status === 'CLEARED' ? 'bg-green-100 text-green-700' : m.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                          {m.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-400 mt-0.5 flex-wrap">
                        {m.targetDate && <span>Target: {new Date(m.targetDate).toLocaleDateString()}</span>}
                        {m.clearedAt && <span className="text-green-600">Cleared: {new Date(m.clearedAt).toLocaleDateString()}</span>}
                      </div>
                      {m.notes && <p className="text-xs text-gray-500 mt-1">{m.notes}</p>}
                    </div>
                    {m.status !== 'CLEARED' && (
                      <Button size="sm" variant="outline" className="shrink-0 text-xs h-7 text-green-700 border-green-200 hover:bg-green-50 mt-0.5" onClick={() => clearMutation.mutate(m.id)} loading={clearMutation.isPending}>
                        <CheckCircle className="w-3 h-3 mr-1" /> Clear
                      </Button>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
