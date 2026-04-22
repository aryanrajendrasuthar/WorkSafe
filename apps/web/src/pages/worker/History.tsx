import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Calendar, Activity, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckinHeatmap } from '@/components/CheckinHeatmap';

const BODY_LABELS: Record<string, string> = {
  LOWER_BACK: 'Lower Back', UPPER_BACK: 'Upper Back', LEFT_SHOULDER: 'L. Shoulder',
  RIGHT_SHOULDER: 'R. Shoulder', HEAD_NECK: 'Neck', LEFT_WRIST_HAND: 'L. Wrist',
  RIGHT_WRIST_HAND: 'R. Wrist', LEFT_ELBOW: 'L. Elbow', RIGHT_ELBOW: 'R. Elbow',
  CHEST: 'Chest', ABDOMEN: 'Abdomen', LEFT_HIP: 'L. Hip', RIGHT_HIP: 'R. Hip',
  LEFT_KNEE: 'L. Knee', RIGHT_KNEE: 'R. Knee', LEFT_ANKLE_FOOT: 'L. Ankle', RIGHT_ANKLE_FOOT: 'R. Ankle',
};

const STATUS_BADGE: Record<string, string> = {
  NONE: 'bg-green-100 text-green-700',
  MILD: 'bg-yellow-100 text-yellow-700',
  MODERATE: 'bg-orange-100 text-orange-700',
  SEVERE: 'bg-red-100 text-red-700',
};

function CheckinCard({ checkin }: { checkin: any }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className="overflow-hidden">
      <button
        className="w-full text-left"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center">
              <Activity className="w-5 h-5 text-brand-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">
                {format(new Date(checkin.date), 'EEEE, MMM d, yyyy')}
              </p>
              <p className="text-xs text-gray-500">
                {checkin.bodyAreas?.length ?? 0} area{checkin.bodyAreas?.length !== 1 ? 's' : ''} reported
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${STATUS_BADGE[checkin.overallStatus] ?? 'bg-gray-100 text-gray-600'}`}>
              {checkin.overallStatus}
            </span>
            {expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
          </div>
        </div>
      </button>

      {expanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="border-t border-gray-100 px-4 pb-4 pt-3 space-y-3">
            {checkin.bodyAreas?.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {checkin.bodyAreas.map((area: any) => (
                  <div key={area.bodyPart} className="bg-gray-50 rounded-lg p-2.5">
                    <p className="text-xs font-medium text-gray-700">{BODY_LABELS[area.bodyPart] ?? area.bodyPart}</p>
                    <p className="text-lg font-bold text-gray-900">{area.intensity}<span className="text-xs font-normal text-gray-400">/10</span></p>
                    <Badge variant="outline" className="text-[10px] mt-1">{area.severity}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No pain areas reported</p>
            )}
            {checkin.note && (
              <div className="bg-blue-50 rounded-lg p-3 text-sm text-blue-800">
                <span className="font-medium">Note: </span>{checkin.note}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </Card>
  );
}

export default function WorkerHistory() {
  const { data: history = [], isLoading } = useQuery({
    queryKey: ['checkin', 'history'],
    queryFn: () => api.get('/checkins/history?days=90').then((r) => r.data.data),
  });

  const checkins = history.filter((d: any) => d.overallStatus !== undefined);
  const heatmapData = history.map((d: any) => ({
    date: d.date,
    overallStatus: d.overallStatus ?? null,
  }));

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-gray-900">Check-in History</h1>
        <p className="text-gray-500">Your pain reports over the last 90 days</p>
      </motion.div>

      {/* Heatmap */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            90-Day Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-20 bg-gray-100 animate-pulse rounded-lg" />
          ) : (
            <CheckinHeatmap data={heatmapData} weeks={13} />
          )}
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Check-ins', value: checkins.length },
          { label: 'Pain-free Days', value: checkins.filter((c: any) => c.overallStatus === 'NONE').length },
          { label: 'Severe Days', value: checkins.filter((c: any) => c.overallStatus === 'SEVERE').length },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-gray-900">{s.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Check-in list */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Recent Check-ins</h2>
        {isLoading ? (
          [1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-100 animate-pulse rounded-xl" />
          ))
        ) : checkins.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-gray-400">
              <Activity className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p>No check-ins yet. Complete your first daily check-in!</p>
            </CardContent>
          </Card>
        ) : (
          checkins
            .slice()
            .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .map((checkin: any) => (
              <CheckinCard key={checkin.id ?? checkin.date} checkin={checkin} />
            ))
        )}
      </div>
    </div>
  );
}
