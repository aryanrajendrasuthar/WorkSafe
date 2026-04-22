import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { FileBarChart, Printer } from 'lucide-react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const BODY_LABELS: Record<string, string> = {
  LOWER_BACK: 'Lower Back', UPPER_BACK: 'Upper Back', LEFT_SHOULDER: 'L. Shoulder',
  RIGHT_SHOULDER: 'R. Shoulder', HEAD_NECK: 'Neck', LEFT_WRIST_HAND: 'L. Wrist',
  RIGHT_WRIST_HAND: 'R. Wrist', LEFT_KNEE: 'L. Knee', RIGHT_KNEE: 'R. Knee',
  LEFT_ELBOW: 'L. Elbow', RIGHT_ELBOW: 'R. Elbow', LEFT_HIP: 'L. Hip', RIGHT_HIP: 'R. Hip',
  LEFT_ANKLE_FOOT: 'L. Ankle', RIGHT_ANKLE_FOOT: 'R. Ankle', CHEST: 'Chest', ABDOMEN: 'Abdomen',
};

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

export default function OshaReports() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);

  const { data: report, isLoading } = useQuery({
    queryKey: ['osha', year],
    queryFn: () => api.get(`/incidents/osha?year=${year}`).then((r) => r.data.data),
  });

  return (
    <div className="space-y-5 max-w-5xl">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">OSHA Reports</h1>
          <p className="text-gray-500 text-sm">OSHA 300 Recordable Incidents Log</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value))}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
          >
            {[currentYear, currentYear - 1, currentYear - 2].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <Button variant="outline" className="gap-2" onClick={() => window.print()}>
            <Printer className="w-4 h-4" /> Print
          </Button>
        </div>
      </motion.div>

      {/* Summary cards */}
      {report && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Recordable', value: report.totalRecordable, color: 'text-red-600', bg: 'bg-red-50' },
            { label: 'Serious / Critical', value: (report.bySeverity?.SERIOUS ?? 0) + (report.bySeverity?.CRITICAL ?? 0), color: 'text-orange-600', bg: 'bg-orange-50' },
            { label: 'Moderate', value: report.bySeverity?.MODERATE ?? 0, color: 'text-amber-600', bg: 'bg-amber-50' },
            { label: 'Minor', value: report.bySeverity?.MINOR ?? 0, color: 'text-green-600', bg: 'bg-green-50' },
          ].map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card>
                <CardContent className="p-5">
                  <div className={`w-10 h-10 ${stat.bg} rounded-xl flex items-center justify-center mb-3`}>
                    <FileBarChart className={`w-5 h-5 ${stat.color}`} />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                  <div className="text-sm text-gray-600 mt-0.5">{stat.label}</div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Body part breakdown */}
      {report?.byBodyPart && Object.keys(report.byBodyPart).length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Incidents by Body Part</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {Object.entries(report.byBodyPart as Record<string, number>)
                .sort((a, b) => b[1] - a[1])
                .map(([part, count]) => (
                  <div key={part} className="flex items-center gap-1.5 bg-gray-50 rounded-lg px-2.5 py-1.5">
                    <span className="text-sm font-medium text-gray-700">{BODY_LABELS[part] ?? part.replace(/_/g, ' ')}</span>
                    <span className="text-xs bg-gray-200 text-gray-600 rounded-full px-1.5 font-medium">{count}</span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* OSHA 300 Log Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">OSHA 300 Log — {year}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />)}</div>
          ) : !report?.incidents?.length ? (
            <div className="text-center py-10 text-gray-400">
              <FileBarChart className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p>No OSHA recordable incidents in {year}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    {['#', 'Worker', 'Date', 'Body Part', 'Injury Type', 'Severity', 'Status', 'Department'].map((h) => (
                      <th key={h} className="text-left py-2 px-3 text-xs font-semibold text-gray-500 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {report.incidents.map((inc: any, i: number) => (
                    <tr key={inc.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-3 text-gray-500 text-xs">{i + 1}</td>
                      <td className="py-3 px-3 font-medium text-gray-900 whitespace-nowrap">{inc.worker.firstName} {inc.worker.lastName}</td>
                      <td className="py-3 px-3 text-gray-500 whitespace-nowrap">{new Date(inc.incidentDate).toLocaleDateString()}</td>
                      <td className="py-3 px-3 text-gray-600 whitespace-nowrap">{BODY_LABELS[inc.bodyPart] ?? inc.bodyPart.replace(/_/g, ' ')}</td>
                      <td className="py-3 px-3 text-gray-600">{inc.injuryType}</td>
                      <td className="py-3 px-3">
                        <Badge variant={SEVERITY_VARIANT[inc.severity]} className="text-[10px]">{inc.severity}</Badge>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[inc.status]}`}>{inc.status.replace(/_/g, ' ')}</span>
                      </td>
                      <td className="py-3 px-3 text-gray-500">{inc.worker.department?.name ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
