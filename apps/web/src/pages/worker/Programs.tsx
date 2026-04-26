import { useCallback, useEffect, useRef, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play, CheckCircle, SkipForward, Clock, Trophy, Target,
  Pause, RotateCcw, AlertCircle, ChevronRight, Flame,
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { queryClient } from '@/lib/queryClient';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

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

interface ExerciseLog {
  exerciseId: string;
  exerciseName: string;
  setsCompleted: number;
  repsCompleted?: number;
  durationSec?: number;
  painDuring: boolean;
  skipped: boolean;
  sortOrder: number;
}

const GOAL_LABELS: Record<string, string> = {
  PREVENTION: 'Prevention', RECOVERY: 'Recovery', STRENGTHENING: 'Strength',
  FLEXIBILITY: 'Flexibility', CONDITIONING: 'Conditioning',
};

// ─── Program card ─────────────────────────────────────────────────────────────

function ProgramCard({ wp, onStart }: { wp: WorkerProgram; onStart: () => void }) {
  const exCount = wp.program.programExercises.length;
  const totalMin = Math.ceil(
    wp.program.programExercises.reduce(
      (s, pe) => s + (pe.durationSec ?? pe.exercise.durationSec) * (pe.sets || 1),
      0,
    ) / 60,
  );

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={onStart}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-bold text-gray-900 dark:text-gray-100">{wp.program.name}</h3>
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
            <span className="font-medium text-gray-700 dark:text-gray-300">{wp.completionRate}%</span>
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

// ─── Countdown timer hook ──────────────────────────────────────────────────────

function useCountdown(initialSeconds: number, onComplete: () => void) {
  const [timeLeft, setTimeLeft] = useState(initialSeconds);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const start = useCallback(() => setRunning(true), []);
  const pause = useCallback(() => setRunning(false), []);
  const reset = useCallback((secs?: number) => {
    setRunning(false);
    setTimeLeft(secs ?? initialSeconds);
  }, [initialSeconds]);

  useEffect(() => {
    if (!running) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(intervalRef.current!);
          setRunning(false);
          onCompleteRef.current();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current!);
  }, [running]);

  return { timeLeft, running, start, pause, reset };
}

// ─── Session runner ────────────────────────────────────────────────────────────

type Phase = 'exercise' | 'rest' | 'done' | 'feedback';

function SessionRunner({ wp, onClose }: { wp: WorkerProgram; onClose: () => void }) {
  const exercises = wp.program.programExercises;
  const [exIdx, setExIdx] = useState(0);
  const [setNum, setSetNum] = useState(1);
  const [phase, setPhase] = useState<Phase>('exercise');
  const [logs, setLogs] = useState<ExerciseLog[]>([]);
  const [painFlag, setPainFlag] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Feedback state
  const [recoveryFeel, setRecoveryFeel] = useState<'better' | 'same' | 'harder' | null>(null);
  const [perceivedDiff, setPerceivedDiff] = useState(0);
  const [workReadiness, setWorkReadiness] = useState(0);
  const [feedbackNotes, setFeedbackNotes] = useState('');
  const [feedbackPain, setFeedbackPain] = useState(false);

  const current = exercises[exIdx];
  const totalSets = current?.sets ?? 1;
  const holdSec = current?.durationSec ?? current?.exercise.durationSec ?? 0;
  const restSec = current?.restSec ?? 60;
  const isTimed = holdSec > 0 && !current?.reps;

  const goToNextSet = useCallback(() => {
    if (setNum < totalSets) {
      setSetNum((s) => s + 1);
      setPainFlag(false);
      setPhase('exercise');
    } else {
      setPhase('rest');
    }
  }, [setNum, totalSets]);

  const exerciseTimer = useCountdown(holdSec || 30, goToNextSet);
  const restTimer = useCountdown(restSec, () => {
    advanceExercise(false);
  });

  const recordLog = useCallback(
    (skipped: boolean) => {
      if (!current) return;
      setLogs((prev) => {
        const existing = prev.findIndex((l) => l.sortOrder === exIdx);
        const entry: ExerciseLog = {
          exerciseId: current.exercise.id,
          exerciseName: current.exercise.name,
          setsCompleted: skipped ? 0 : setNum,
          repsCompleted: current.reps ?? undefined,
          durationSec: isTimed ? holdSec : undefined,
          painDuring: painFlag,
          skipped,
          sortOrder: exIdx,
        };
        if (existing >= 0) {
          const next = [...prev];
          next[existing] = entry;
          return next;
        }
        return [...prev, entry];
      });
    },
    [current, exIdx, setNum, isTimed, holdSec, painFlag],
  );

  const advanceExercise = useCallback(
    (skipped: boolean) => {
      recordLog(skipped);
      const next = exIdx + 1;
      if (next < exercises.length) {
        setExIdx(next);
        setSetNum(1);
        setPainFlag(false);
        setPhase('exercise');
        exerciseTimer.reset(
          exercises[next].durationSec ?? exercises[next].exercise.durationSec ?? 30,
        );
        restTimer.reset(exercises[next].restSec ?? 60);
      } else {
        setPhase('done');
      }
    },
    [exIdx, exercises, recordLog, exerciseTimer, restTimer],
  );

  const logMutation = useMutation({
    mutationFn: (data: any) => api.post(`/programs/${wp.id}/sessions`, data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['programs', 'my'] });
      const id = res.data?.data?.id ?? res.data?.id;
      setSessionId(id);
      setPhase('feedback');
    },
    onError: () => toast.error('Failed to log session'),
  });

  const feedbackMutation = useMutation({
    mutationFn: (data: any) =>
      api.post(`/programs/${wp.id}/sessions/${sessionId}/feedback`, data),
    onSuccess: () => onClose(),
    onError: () => {
      // Feedback is optional — close anyway on error
      onClose();
    },
  });

  const finishSession = () => {
    recordLog(false);
    const finalLogs = [...logs];
    const completedCount = finalLogs.filter((l) => !l.skipped).length;
    logMutation.mutate({
      exercisesCompleted: completedCount,
      exercisesTotal: exercises.length,
      durationMin: Math.ceil(
        exercises.reduce((s, pe) => s + (pe.durationSec ?? pe.exercise.durationSec), 0) / 60,
      ),
      exerciseLogs: finalLogs,
    });
  };

  const submitFeedback = () => {
    if (!recoveryFeel || !perceivedDiff || !workReadiness) {
      toast.error('Please complete all feedback fields');
      return;
    }
    feedbackMutation.mutate({
      recoveryFeel,
      perceivedDiff,
      workReadiness,
      painDuring: feedbackPain,
      notes: feedbackNotes || undefined,
    });
  };

  // ── Feedback screen ──────────────────────────────────────────────────────────
  if (phase === 'feedback') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6 max-w-lg mx-auto"
      >
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
            <Trophy className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Session Complete!</h2>
          <p className="text-sm text-gray-500">How are you feeling? This helps calibrate your program.</p>
        </div>

        {/* Recovery feel */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">How do you feel after this session?</p>
          <div className="grid grid-cols-3 gap-2">
            {(['better', 'same', 'harder'] as const).map((feel) => (
              <button
                key={feel}
                onClick={() => setRecoveryFeel(feel)}
                className={cn(
                  'py-3 rounded-xl border-2 text-sm font-medium transition-all',
                  recoveryFeel === feel
                    ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300'
                    : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300',
                )}
              >
                {feel === 'better' ? '😊 Better' : feel === 'same' ? '😐 Same' : '😓 Harder'}
              </button>
            ))}
          </div>
        </div>

        {/* Perceived difficulty */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Perceived difficulty <span className="text-brand-600 font-bold">{perceivedDiff > 0 ? perceivedDiff : '—'}</span>/5
          </p>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                onClick={() => setPerceivedDiff(n)}
                className={cn(
                  'flex-1 h-10 rounded-lg border-2 text-sm font-bold transition-all',
                  perceivedDiff >= n
                    ? 'border-brand-500 bg-brand-500 text-white'
                    : 'border-gray-200 dark:border-gray-700 text-gray-400 hover:border-gray-300',
                )}
              >
                {n}
              </button>
            ))}
          </div>
          <div className="flex justify-between text-xs text-gray-400 px-1">
            <span>Easy</span><span>Very hard</span>
          </div>
        </div>

        {/* Work readiness */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Work readiness right now <span className="text-brand-600 font-bold">{workReadiness > 0 ? workReadiness : '—'}</span>/5
          </p>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                onClick={() => setWorkReadiness(n)}
                className={cn(
                  'flex-1 h-10 rounded-lg border-2 text-sm font-bold transition-all',
                  workReadiness >= n
                    ? 'border-green-500 bg-green-500 text-white'
                    : 'border-gray-200 dark:border-gray-700 text-gray-400 hover:border-gray-300',
                )}
              >
                {n}
              </button>
            ))}
          </div>
          <div className="flex justify-between text-xs text-gray-400 px-1">
            <span>Not ready</span><span>Fully ready</span>
          </div>
        </div>

        {/* Pain during session */}
        <label className="flex items-center gap-3 cursor-pointer">
          <div
            onClick={() => setFeedbackPain((p) => !p)}
            className={cn(
              'w-5 h-5 rounded border-2 flex items-center justify-center transition-all shrink-0',
              feedbackPain
                ? 'border-red-500 bg-red-500'
                : 'border-gray-300 dark:border-gray-600',
            )}
          >
            {feedbackPain && <CheckCircle className="w-3 h-3 text-white" />}
          </div>
          <span className="text-sm text-gray-600 dark:text-gray-400">I experienced pain during exercises</span>
        </label>

        {/* Notes */}
        <textarea
          value={feedbackNotes}
          onChange={(e) => setFeedbackNotes(e.target.value)}
          placeholder="Any notes for your clinician? (optional)"
          rows={2}
          className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 resize-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
        />

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Skip feedback
          </Button>
          <Button
            className="flex-1"
            onClick={submitFeedback}
            loading={feedbackMutation.isPending}
          >
            Submit & Finish
          </Button>
        </div>
      </motion.div>
    );
  }

  // ── Rest timer screen ────────────────────────────────────────────────────────
  if (phase === 'rest') {
    const isLastExercise = exIdx === exercises.length - 1;
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="space-y-6 max-w-lg mx-auto text-center"
      >
        <div className="flex items-center justify-between">
          <button onClick={onClose} className="text-sm text-brand-600 font-medium hover:text-brand-700">← Exit</button>
          <span className="text-sm text-gray-500">
            {exIdx + 1} / {exercises.length}
          </span>
        </div>

        <div className="py-4 space-y-4">
          <p className="text-gray-500 font-medium text-sm uppercase tracking-wider">Rest period</p>
          <div
            className="w-32 h-32 rounded-full border-4 border-brand-200 dark:border-brand-800 flex items-center justify-center mx-auto"
            style={{
              background: `conic-gradient(var(--brand-500, #4f46e5) ${(1 - restTimer.timeLeft / restSec) * 360}deg, transparent 0deg)`,
            }}
          >
            <div className="w-24 h-24 rounded-full bg-white dark:bg-gray-900 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-gray-900 dark:text-gray-100">{restTimer.timeLeft}</span>
              <span className="text-xs text-gray-400">sec</span>
            </div>
          </div>

          {!restTimer.running && (
            <Button onClick={restTimer.start} className="gap-2">
              <Play className="w-4 h-4" /> Start rest timer
            </Button>
          )}

          {!isLastExercise && (
            <div className="text-sm text-gray-500 space-y-1">
              <p className="font-medium text-gray-700 dark:text-gray-300">Up next</p>
              <p>{exercises[exIdx + 1]?.exercise.name}</p>
            </div>
          )}
        </div>

        <Button
          variant="outline"
          className="w-full gap-2"
          onClick={() => advanceExercise(false)}
        >
          Skip rest <ChevronRight className="w-4 h-4" />
        </Button>
      </motion.div>
    );
  }

  // ── Done screen (before feedback) ───────────────────────────────────────────
  if (phase === 'done') {
    return (
      <div className="text-center py-12 space-y-5 max-w-lg mx-auto">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto"
        >
          <Flame className="w-12 h-12 text-green-600" />
        </motion.div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">All exercises done!</h2>
          <p className="text-gray-500 mt-1">
            {logs.filter((l) => !l.skipped).length} of {exercises.length} completed
          </p>
        </div>
        <Button onClick={finishSession} loading={logMutation.isPending} className="w-full">
          Save session & continue
        </Button>
      </div>
    );
  }

  // ── Exercise screen ──────────────────────────────────────────────────────────
  const progress = Math.round((exIdx / exercises.length) * 100);

  return (
    <div className="space-y-4 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={onClose} className="text-sm text-brand-600 font-medium hover:text-brand-700">
          ← Exit session
        </button>
        <span className="text-sm text-gray-500">
          {exIdx + 1} / {exercises.length}
        </span>
      </div>

      {/* Progress bar */}
      <div className="space-y-1">
        <Progress value={progress} className="h-1.5" />
        <div className="flex justify-between text-xs text-gray-400">
          <span>Set {setNum} of {totalSets}</span>
          <span>{exIdx} done</span>
        </div>
      </div>

      {/* Exercise card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${exIdx}-${setNum}`}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.2 }}
        >
          <Card>
            <CardContent className="p-5 space-y-4">
              {/* Exercise visual — draining timer or rep counter */}
              {isTimed ? (
                <div className="relative w-full overflow-hidden rounded-2xl bg-gradient-to-br from-brand-700 via-brand-600 to-indigo-700 p-6 text-center select-none">
                  {/* Draining white overlay — shrinks left as time elapses */}
                  <div
                    className="absolute inset-0 bg-white/[0.08] transition-transform duration-1000 ease-linear"
                    style={{ transformOrigin: 'left', transform: `scaleX(${holdSec > 0 ? exerciseTimer.timeLeft / holdSec : 0})` }}
                  />
                  <div className="relative z-10 space-y-1">
                    <p className="text-brand-200 text-[10px] font-bold uppercase tracking-[0.2em]">
                      {exerciseTimer.running ? 'Hold position' : exerciseTimer.timeLeft === 0 ? 'Complete!' : 'Ready to start'}
                    </p>
                    <motion.p
                      key={exerciseTimer.timeLeft}
                      initial={{ scale: 1.2, opacity: 0.6 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.2 }}
                      className="text-7xl font-black text-white tabular-nums leading-none"
                    >
                      {exerciseTimer.timeLeft}
                    </motion.p>
                    <p className="text-brand-300/70 text-xs">sec</p>
                    {/* Tick-mark progress */}
                    <div className="flex gap-0.5 mt-3 px-2">
                      {Array.from({ length: Math.min(holdSec, 30) }).map((_, i) => {
                        const totalTicks = Math.min(holdSec, 30);
                        const remainingTicks = Math.round((exerciseTimer.timeLeft / holdSec) * totalTicks);
                        return (
                          <div
                            key={i}
                            className={cn('flex-1 h-1.5 rounded-full transition-colors duration-700', i < remainingTicks ? 'bg-white/80' : 'bg-white/15')}
                          />
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="relative w-full rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 p-6 text-center select-none">
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-1">Reps to complete</p>
                  <p className="text-7xl font-black text-white tabular-nums leading-none">{current.reps}</p>
                  {current.reps && current.reps <= 24 && (
                    <div className="flex justify-center gap-1.5 mt-3 flex-wrap max-w-[200px] mx-auto">
                      {Array.from({ length: current.reps }).map((_, i) => (
                        <div key={i} className="w-2.5 h-2.5 rounded-full bg-brand-400/60 border border-brand-300/30" />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Name + set badge */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    {current.exercise.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5 line-clamp-2">
                    {current.exercise.description}
                  </p>
                </div>
                <Badge variant="outline" className="shrink-0">
                  Set {setNum}/{totalSets}
                </Badge>
              </div>

              {/* Metrics row */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 text-center">
                  <div className="text-xl font-bold text-gray-900 dark:text-gray-100">{totalSets}</div>
                  <div className="text-xs text-gray-500">sets</div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 text-center">
                  <div className="text-xl font-bold text-gray-900 dark:text-gray-100">{restSec}s</div>
                  <div className="text-xs text-gray-500">rest after</div>
                </div>
              </div>

              {/* Timer controls for timed exercises */}
              {isTimed && (
                <div className="flex gap-2">
                  {!exerciseTimer.running ? (
                    <Button size="sm" className="flex-1 gap-1.5" onClick={exerciseTimer.start}>
                      <Play className="w-4 h-4" /> Start timer
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" className="flex-1 gap-1.5" onClick={exerciseTimer.pause}>
                      <Pause className="w-4 h-4" /> Pause
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => exerciseTimer.reset()}>
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                </div>
              )}

              {/* Instructions */}
              {current.exercise.instructions.length > 0 && (
                <div className="space-y-1.5">
                  {current.exercise.instructions.slice(0, 3).map((step, i) => (
                    <div key={i} className="flex gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <span className="w-5 h-5 bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                        {i + 1}
                      </span>
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              )}

              {current.notes && (
                <p className="text-xs text-gray-400 italic border-t pt-2">{current.notes}</p>
              )}

              {/* Pain during exercise toggle */}
              <label className="flex items-center gap-2 cursor-pointer">
                <button
                  onClick={() => setPainFlag((p) => !p)}
                  className={cn(
                    'w-5 h-5 rounded border-2 flex items-center justify-center transition-all shrink-0',
                    painFlag ? 'border-red-400 bg-red-400' : 'border-gray-300 dark:border-gray-600',
                  )}
                >
                  {painFlag && <AlertCircle className="w-3 h-3 text-white" />}
                </button>
                <span className="text-xs text-gray-500">Pain during this exercise</span>
              </label>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>

      {/* Action buttons */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          className="flex-1 gap-1.5"
          onClick={() => advanceExercise(true)}
        >
          <SkipForward className="w-4 h-4" /> Skip
        </Button>
        {exIdx === exercises.length - 1 && setNum === totalSets ? (
          <Button className="flex-1 gap-1.5" onClick={() => { recordLog(false); setPhase('done'); }}>
            <CheckCircle className="w-4 h-4" /> Finish
          </Button>
        ) : (
          <Button className="flex-1 gap-1.5" onClick={goToNextSet}>
            <CheckCircle className="w-4 h-4" />
            {setNum < totalSets ? `Done — Set ${setNum + 1}` : 'Done — Next exercise'}
          </Button>
        )}
      </div>
    </div>
  );
}

// ─── Programs page ─────────────────────────────────────────────────────────────

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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">My Programs</h1>
        <p className="text-gray-500 text-sm">Your assigned occupational health programs</p>
      </motion.div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-48 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : programs.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-gray-400">
            <Target className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p className="font-medium">No programs assigned yet</p>
            <p className="text-sm mt-1">Your clinician will assign programs based on your check-in data.</p>
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
