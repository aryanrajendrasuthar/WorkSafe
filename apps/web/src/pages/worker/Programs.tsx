import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, CheckCircle, SkipForward, Clock, Trophy, Target } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { queryClient } from '@/lib/queryClient';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';

interface ProgramExercise {
  id: string;
  order: number;
  sets: number;
  reps: number | null;
  durationSec: number | null;
  restSec: number;
  notes: string | null;
  exercise: {
    id: string;
    name: string;
    description: string;
    difficulty: string;
    durationSec: number;
    instructions: string[];
  };
}

interface WorkerProgram {
  id: string;
  status: string;
  startDate: string;
  completionRate: number;
  totalSessions: number;
  program: {
    id: string;
    name: string;
    description: string;
    durationWeeks: number;
    goal: string;
    programExercises: ProgramExercise[];
  };
}

const GOAL_LABELS: Record<string, string> = {
  PREVENTION: 'Prevention', RECOVERY: 'Recovery', STRENGTHENING: 'Strength',
  FLEXIBILITY: 'Flexibility', CONDITIONING: 'Conditioning',
};

function ProgramCard({ wp, onStart }: { wp: WorkerProgram; onStart: () => void }) {
  const exCount = wp.program.programExercises.length;
  const totalMin = Math.ceil(
    wp.program.programExercises.reduce((s, pe) => s + (pe.durationSec ?? pe.exercise.durationSec) * (pe.sets || 1), 0) / 60,
  );

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={onStart}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-bold text-gray-900">{wp.program.name}</h3>
            <p className="text-sm text-gray-500 mt-0.5">{wp.program.description}</p>
          </div>
          <Badge variant="info" className="shrink-0 ml-2">
            {GOAL_LABELS[wp.program.goal] ?? wp.program.goal}
          </Badge>
        </div>

        <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
          <span className="flex items-center gap-1"><Target className="w-3.5 h-3.5" /> {exCount} exercises</span>
          <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> ~{totalMin} min</span>
          <span className="flex items-center gap-1"><Trophy className="w-3.5 h-3.5" /> {wp.totalSessions} sessions</span>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-xs text-gray-500">
            <span>Completion rate</span>
            <span className="font-medium text-gray-700">{wp.completionRate}%</span>
          </div>
          <Progress value={wp.completionRate} className="h-2" />
        </div>

        <div className="flex items-center justify-between mt-4">
          <span className="text-xs text-gray-400">
            Started {new Date(wp.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </span>
          <Button size="sm" className="gap-1.5">
            <Play className="w-3.5 h-3.5" /> Start Session
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function SessionRunner({ wp, onClose }: { wp: WorkerProgram; onClose: () => void }) {
  const exercises = wp.program.programExercises;
  const [currentIdx, setCurrentIdx] = useState(0);
  const [completed, setCompleted] = useState<Set<number>>(new Set());
  const [sessionDone, setSessionDone] = useState(false);

  const logMutation = useMutation({
    mutationFn: (data: any) => api.post(`/programs/${wp.id}/sessions`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programs', 'my'] });
      setSessionDone(true);
    },
    onError: () => toast.error('Failed to log session'),
  });

  const current = exercises[currentIdx];

  const markComplete = () => {
    setCompleted((prev) => new Set([...prev, currentIdx]));
    if (currentIdx < exercises.length - 1) {
      setCurrentIdx(currentIdx + 1);
    } else {
      // Log session
      logMutation.mutate({
        exercisesCompleted: completed.size + 1,
        exercisesTotal: exercises.length,
        durationMin: Math.ceil(exercises.reduce((s, pe) => s + (pe.durationSec ?? pe.exercise.durationSec), 0) / 60),
      });
    }
  };

  const skip = () => {
    if (currentIdx < exercises.length - 1) setCurrentIdx(currentIdx + 1);
  };

  if (sessionDone) {
    return (
      <div className="text-center py-12 space-y-5">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <Trophy className="w-12 h-12 text-green-600" />
        </motion.div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Session Complete!</h2>
          <p className="text-gray-500 mt-1">{completed.size} of {exercises.length} exercises done</p>
        </div>
        <Button onClick={onClose}>Back to Programs</Button>
      </div>
    );
  }

  const progress = Math.round((completed.size / exercises.length) * 100);

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <button onClick={onClose} className="text-sm text-brand-600 font-medium hover:text-brand-700">← Exit session</button>
        <span className="text-sm text-gray-500">{currentIdx + 1} / {exercises.length}</span>
      </div>

      <div className="space-y-1">
        <Progress value={progress} className="h-1.5" />
        <p className="text-xs text-gray-400 text-right">{completed.size} completed</p>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentIdx}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.2 }}
        >
          <Card>
            <CardContent className="p-5 space-y-4">
              {/* Exercise thumbnail */}
              <div className="w-full h-40 bg-gradient-to-br from-brand-50 to-brand-100 rounded-xl flex items-center justify-center">
                <motion.div
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                >
                  <Target className="w-14 h-14 text-brand-300" />
                </motion.div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-gray-900">{current.exercise.name}</h3>
                  {completed.has(currentIdx) && <CheckCircle className="w-5 h-5 text-green-500" />}
                </div>
                <p className="text-sm text-gray-600 mt-1">{current.exercise.description}</p>
              </div>

              <div className="flex gap-3">
                {current.sets > 0 && (
                  <div className="flex-1 bg-gray-50 rounded-xl p-3 text-center">
                    <div className="text-xl font-bold text-gray-900">{current.sets}</div>
                    <div className="text-xs text-gray-500">sets</div>
                  </div>
                )}
                {current.reps && (
                  <div className="flex-1 bg-gray-50 rounded-xl p-3 text-center">
                    <div className="text-xl font-bold text-gray-900">{current.reps}</div>
                    <div className="text-xs text-gray-500">reps</div>
                  </div>
                )}
                {current.durationSec && (
                  <div className="flex-1 bg-gray-50 rounded-xl p-3 text-center">
                    <div className="text-xl font-bold text-gray-900">{current.durationSec}s</div>
                    <div className="text-xs text-gray-500">hold</div>
                  </div>
                )}
                <div className="flex-1 bg-gray-50 rounded-xl p-3 text-center">
                  <div className="text-xl font-bold text-gray-900">{current.restSec}s</div>
                  <div className="text-xs text-gray-500">rest</div>
                </div>
              </div>

              {current.exercise.instructions.length > 0 && (
                <div className="space-y-2">
                  {current.exercise.instructions.slice(0, 3).map((step, i) => (
                    <div key={i} className="flex gap-2 text-sm text-gray-600">
                      <span className="w-5 h-5 bg-brand-100 text-brand-700 rounded-full flex items-center justify-center text-xs font-bold shrink-0">{i + 1}</span>
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              )}

              {current.notes && (
                <p className="text-xs text-gray-400 italic border-t pt-2">{current.notes}</p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>

      <div className="flex gap-3">
        <Button variant="outline" className="flex-1 gap-1.5" onClick={skip} disabled={currentIdx === exercises.length - 1}>
          <SkipForward className="w-4 h-4" /> Skip
        </Button>
        <Button className="flex-1 gap-1.5" onClick={markComplete} loading={logMutation.isPending}>
          <CheckCircle className="w-4 h-4" />
          {currentIdx === exercises.length - 1 ? 'Finish' : 'Done'}
        </Button>
      </div>
    </div>
  );
}

export default function ProgramsPage() {
  const [activeSession, setActiveSession] = useState<WorkerProgram | null>(null);

  const { data: programs = [], isLoading } = useQuery({
    queryKey: ['programs', 'my'],
    queryFn: () => api.get('/programs/my').then((r) => r.data.data),
  });

  if (activeSession) {
    return <SessionRunner wp={activeSession} onClose={() => setActiveSession(null)} />;
  }

  return (
    <div className="space-y-5">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-gray-900">My Programs</h1>
        <p className="text-gray-500 text-sm">Your assigned exercise programs</p>
      </motion.div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => <div key={i} className="h-48 bg-gray-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : programs.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-gray-400">
            <Target className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p className="font-medium">No programs assigned yet</p>
            <p className="text-sm mt-1">Your therapist will assign programs based on your check-in data.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {programs.map((wp: WorkerProgram) => (
            <motion.div key={wp.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <ProgramCard wp={wp} onStart={() => setActiveSession(wp)} />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
