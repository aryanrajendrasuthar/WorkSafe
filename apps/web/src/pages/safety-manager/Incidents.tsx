import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { AlertTriangle, FileText, ArrowRight, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const STATUS_COLORS: Record<string, string> = {
  OPEN: 'bg-red-100 text-red-700',
  UNDER_REVIEW: 'bg-orange-100 text-orange-700',
  RTW_IN_PROGRESS: 'bg-blue-100 text-blue-700',
  RESOLVED: 'bg-green-100 text-green-700',
  CLOSED: 'bg-gray-100 text-gray-600',
};

const SEVERITY_COLORS: Record<string, string> = {
  MINOR: 'bg-yellow-100 text-yellow-700',
  MODERATE: 'bg-orange-100 text-orange-700',
  SERIOUS: 'bg-red-100 text-red-700',
  CRITICAL: 'bg-red-200 text-red-800',
};

const BODY_LABELS: Record<string, string> = {
  LOWER_BACK: 'Lower Back', UPPER_BACK: 'Upper Back', LEFT_SHOULDER: 'L. Shoulder',
  RIGHT_SHOULDER: 'R. Shoulder', HEAD_NECK: 'Neck', LEFT_WRIST_HAND: 'L. Wrist',
  RIGHT_WRIST_HAND: 'R. Wrist', LEFT_ELBOW: 'L. Elbow', RIGHT_ELBOW: 'R. Elbow',
  CHEST: 'Chest', ABDOMEN: 'Abdomen', LEFT_HIP: 'L. Hip', RIGHT_HIP: 'R. Hip',
  LEFT_KNEE: 'L. Knee', RIGHT_KNEE: 'R. Knee', LEFT_ANKLE_FOOT: 'L. Ankle', RIGHT_ANKLE_FOOT: 'R. Ankle',
};

export default function SafetyIncidents() {
  const [statusFilter, setStatusFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');

  const { data: incidents = [], isLoading } = useQuery({
    queryKey: ['incidents'],
    queryFn: () => api.get('/incidents').then((r) => r.data.data),
  });

  const filtered = incidents.filter((inc: any) => {
    if (statusFilter && inc.status !== statusFilter) return false;
    if (severityFilter && inc.severity !== severityFilter) return false;
    return true;
  });

  const openCount = incidents.filter((i: any) => i.status === 'OPEN').length;
  const rtw = incidents.filter((i: any) => i.status === 'RTW_IN_PROGRESS').length;
  const resolved = incidents.filter((i: any) => i.status === 'RESOLVED' || i.status === 'CLOSED').length;
  const recordable = incidents.filter((i: any) => i.isOshaRecordable).length;

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-gray-900">Incidents Overview</h1>
        <p className="text-gray-500">All reported workplace incidents across your organization</p>
      </motion.div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Open', value: openCount, color: 'text-red-600', bg: 'bg-red-50' },
          { label: 'RTW In Progress', value: rtw, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Resolved', value: resolved, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'OSHA Recordable', value: recordable, color: 'text-orange-600', bg: 'bg-orange-50' },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-sm text-gray-500 mt-0.5">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <Filter className="w-4 h-4 text-gray-400" />
        <div className="flex gap-2 flex-wrap">
          {['', 'OPEN', 'UNDER_REVIEW', 'RTW_IN_PROGRESS', 'RESOLVED', 'CLOSED'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${statusFilter === s ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {s || 'All Statuses'}
            </button>
          ))}
        </div>
        <div className="flex gap-2 flex-wrap ml-auto">
          {['', 'MINOR', 'MODERATE', 'SERIOUS', 'CRITICAL'].map((s) => (
            <button
              key={s}
              onClick={() => setSeverityFilter(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${severityFilter === s ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {s || 'All Severities'}
            </button>
          ))}
        </div>
      </div>

      {/* Table / List */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="w-4 h-4" />
            {filtered.length} Incident{filtered.length !== 1 ? 's' : ''}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-gray-100 animate-pulse rounded-xl" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-10 text-center text-gray-400">
              <AlertTriangle className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="font-medium">No incidents found</p>
              {(statusFilter || severityFilter) && (
                <p className="text-sm mt-1">Try removing your filters.</p>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filtered.map((incident: any, i: number) => (
                <motion.div
                  key={incident.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-gray-900">
                        {incident.worker?.firstName} {incident.worker?.lastName}
                      </p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[incident.status] ?? 'bg-gray-100 text-gray-600'}`}>
                        {incident.status?.replace(/_/g, ' ')}
                      </span>
                      {incident.isOshaRecordable && (
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-purple-100 text-purple-700">OSHA</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      <span className="text-sm text-gray-500">
                        {BODY_LABELS[incident.bodyPart] ?? incident.bodyPart}
                      </span>
                      <span className="text-gray-300">·</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${SEVERITY_COLORS[incident.severity] ?? ''}`}>
                        {incident.severity}
                      </span>
                      <span className="text-gray-300">·</span>
                      <span className="text-xs text-gray-400">
                        {incident.incidentDate ? format(new Date(incident.incidentDate), 'MMM d, yyyy') : '—'}
                      </span>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <Link to={`/therapist/incidents/${incident.id}`}>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </Button>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="text-center">
        <Button variant="outline" asChild>
          <Link to="/safety/reports">View OSHA Reports</Link>
        </Button>
      </div>
    </div>
  );
}
