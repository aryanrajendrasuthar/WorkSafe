import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, ChevronRight, ChevronLeft, Flame } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { queryClient } from '@/lib/queryClient';
import { BodyMap, REGION_LABELS } from '@/components/BodyMap';
import type { BodyRegion, BodyAreaSelection } from '@/components/BodyMap';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type PainSeverity = 'NONE' | 'MILD' | 'MODERATE' | 'SEVERE';

const SEVERITY_OPTIONS: { value: PainSeverity; label: string; color: string }[] = [
  { value: 'NONE', label: 'None', color: 'bg-gray-100 text-gray-600 border-gray-200' },
  { value: 'MILD', label: 'Mild', color: 'bg-green-50 text-green-700 border-green-200' },
  { value: 'MODERATE', label: 'Moderate', color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  { value: 'SEVERE', label: 'Severe', color: 'bg-red-50 text-red-700 border-red-200' },
];

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
};

export default function Checkin() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [selections, setSelections] = useState<BodyAreaSelection[]>([]);
  const [areaDetails, setAreaDetails] = useState<Record<BodyRegion, { severity: PainSeverity; taskCorrelation: string }>>({} as any);
  const [overallStatus, setOverallStatus] = useState<PainSeverity>('NONE');
  const [note, setNote] = useState('');

  const { data: todayCheckin } = useQuery({
    queryKey: ['checkin', 'today'],
    queryFn: () => api.get('/checkins/today').then((r) => r.data.data),
  });

  const checkinMutation = useMutation({
    mutationFn: (payload: any) => api.post('/checkins', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['worker', 'stats'] });
      queryClient.invalidateQueries({ queryKey: ['checkin'] });
      goTo(3);
    },
    onError: () => toast.error('Failed to submit check-in'),
  });

  const goTo = (next: number) => {
    setDirection(next > step ? 1 : -1);
    setStep(next);
  };

  const toggleRegion = (region: BodyRegion) => {
    setSelections((prev) => {
      const existing = prev.find((s) => s.region === region);
      if (existing) return prev.filter((s) => s.region !== region);
      return [...prev, { region, intensity: 5 }];
    });
  };

  const setIntensity = (region: BodyRegion, intensity: number) => {
    setSelections((prev) => prev.map((s) => (s.region === region ? { ...s, intensity } : s)));
  };

  const setDetail = (region: BodyRegion, key: 'severity' | 'taskCorrelation', value: string) => {
    setAreaDetails((prev) => ({ ...prev, [region]: { ...prev[region], [key]: value } }));
  };

  const handleSubmit = () => {
    const bodyAreas = selections.map((s) => ({
      bodyPart: s.region,
      intensity: s.intensity,
      severity: areaDetails[s.region]?.severity ?? 'MILD',
      taskCorrelation: areaDetails[s.region]?.taskCorrelation,
    }));
    checkinMutation.mutate({ overallStatus, bodyAreas, note: note || undefined });
  };

  if (todayCheckin && step !== 3) {
    return (
      <div className="max-w-md mx-auto py-12 text-center space-y-4">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Already checked in today!</h2>
        <p className="text-gray-500">You submitted your check-in for today. Come back tomorrow.</p>
        <Button onClick={() => navigate('/worker/dashboard')}>Back to Dashboard</Button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Daily Check-in</h1>
        <p className="text-gray-500 text-sm mt-1">Takes about 60 seconds</p>
      </div>

      {/* Progress dots */}
      {step < 3 && (
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className={cn('h-1.5 flex-1 rounded-full transition-colors', i <= step ? 'bg-brand-500' : 'bg-gray-200')} />
          ))}
        </div>
      )}

      {/* Steps */}
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={step}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          {/* Step 0 — Body Map */}
          {step === 0 && (
            <div className="space-y-4">
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm font-medium text-gray-700 mb-4 text-center">
                    Tap any area where you feel pain or discomfort today
                  </p>
                  <BodyMap selections={selections} onToggle={toggleRegion} size="lg" />
                </CardContent>
              </Card>
              <Button
                className="w-full"
                onClick={() => goTo(1)}
              >
                {selections.length === 0 ? 'No pain today →' : `Continue with ${selections.length} area${selections.length > 1 ? 's' : ''} →`}
              </Button>
            </div>
          )}

          {/* Step 1 — Intensity & Details */}
          {step === 1 && (
            <div className="space-y-4">
              {selections.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center text-gray-500">
                    <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-2" />
                    <p className="font-medium text-gray-700">No pain areas selected</p>
                    <p className="text-sm">Great! Skip ahead to confirm.</p>
                  </CardContent>
                </Card>
              ) : (
                selections.map((sel) => (
                  <Card key={sel.region}>
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-gray-900">{REGION_LABELS[sel.region]}</span>
                        <span className={cn('text-sm font-bold px-2 py-0.5 rounded-full', {
                          'bg-green-100 text-green-700': sel.intensity <= 3,
                          'bg-yellow-100 text-yellow-700': sel.intensity <= 6 && sel.intensity > 3,
                          'bg-red-100 text-red-700': sel.intensity > 6,
                        })}>
                          {sel.intensity}/10
                        </span>
                      </div>

                      {/* Intensity slider */}
                      <div>
                        <div className="flex justify-between text-xs text-gray-400 mb-1">
                          <span>Mild</span><span>Moderate</span><span>Severe</span>
                        </div>
                        <input
                          type="range"
                          min={1}
                          max={10}
                          value={sel.intensity}
                          onChange={(e) => setIntensity(sel.region, parseInt(e.target.value))}
                          className="w-full accent-brand-500"
                        />
                      </div>

                      {/* Severity */}
                      <div className="flex gap-2 flex-wrap">
                        {SEVERITY_OPTIONS.filter((s) => s.value !== 'NONE').map((opt) => (
                          <button
                            key={opt.value}
                            onClick={() => setDetail(sel.region, 'severity', opt.value)}
                            className={cn(
                              'text-xs px-3 py-1 rounded-full border transition-all',
                              areaDetails[sel.region]?.severity === opt.value
                                ? opt.color + ' font-semibold shadow-sm'
                                : 'border-gray-200 text-gray-500 hover:border-gray-300',
                            )}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>

                      {/* Task correlation */}
                      <input
                        type="text"
                        placeholder="Related task? (e.g. lifting, typing)"
                        value={areaDetails[sel.region]?.taskCorrelation ?? ''}
                        onChange={(e) => setDetail(sel.region, 'taskCorrelation', e.target.value)}
                        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-300"
                      />
                    </CardContent>
                  </Card>
                ))
              )}
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => goTo(0)}>
                  <ChevronLeft className="w-4 h-4 mr-1" /> Back
                </Button>
                <Button className="flex-1" onClick={() => goTo(2)}>
                  Continue <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 2 — Overall Status + Note */}
          {step === 2 && (
            <div className="space-y-5">
              <Card>
                <CardContent className="p-5 space-y-4">
                  <div>
                    <p className="font-semibold text-gray-800 mb-3">How are you feeling overall today?</p>
                    <div className="grid grid-cols-2 gap-2">
                      {SEVERITY_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => setOverallStatus(opt.value)}
                          className={cn(
                            'p-3 rounded-xl border-2 text-sm font-medium transition-all text-left',
                            overallStatus === opt.value
                              ? opt.color + ' border-current shadow-sm scale-[1.02]'
                              : 'border-gray-200 text-gray-600 hover:border-gray-300',
                          )}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="font-semibold text-gray-800 mb-2">Anything to add? <span className="text-gray-400 font-normal">(optional)</span></p>
                    <textarea
                      rows={3}
                      placeholder="Any notes about your day, workload, stress level..."
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-brand-300"
                    />
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => goTo(1)}>
                  <ChevronLeft className="w-4 h-4 mr-1" /> Back
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleSubmit}
                  loading={checkinMutation.isPending}
                >
                  Submit Check-in ✓
                </Button>
              </div>
            </div>
          )}

          {/* Step 3 — Completion */}
          {step === 3 && (
            <div className="text-center space-y-5 py-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto"
              >
                <CheckCircle className="w-12 h-12 text-green-600" />
              </motion.div>

              <div>
                <h2 className="text-2xl font-bold text-gray-900">Check-in complete!</h2>
                <p className="text-gray-500 mt-1">Great job staying on top of your health.</p>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex items-center justify-center gap-2 bg-orange-50 border border-orange-200 rounded-2xl px-6 py-4"
              >
                <Flame className="w-6 h-6 text-orange-500" />
                <span className="text-orange-700 font-semibold">Streak updated!</span>
              </motion.div>

              <Button className="w-full" onClick={() => navigate('/worker/dashboard')}>
                Back to Dashboard
              </Button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
