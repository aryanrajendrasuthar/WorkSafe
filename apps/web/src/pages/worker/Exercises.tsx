import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Search, Clock, Dumbbell, ChevronRight, Filter } from 'lucide-react';
import { api } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const DIFFICULTIES = ['', 'BEGINNER', 'INTERMEDIATE', 'ADVANCED'] as const;
const GOALS = ['', 'PREVENTION', 'RECOVERY', 'STRENGTHENING', 'FLEXIBILITY', 'CONDITIONING'] as const;
const BODY_PARTS = [
  '', 'LOWER_BACK', 'UPPER_BACK', 'HEAD_NECK',
  'LEFT_SHOULDER', 'RIGHT_SHOULDER', 'LEFT_WRIST_HAND', 'RIGHT_WRIST_HAND',
  'LEFT_KNEE', 'RIGHT_KNEE',
] as const;

const DIFFICULTY_COLORS: Record<string, string> = {
  BEGINNER: 'success',
  INTERMEDIATE: 'warning',
  ADVANCED: 'danger',
};

const GOAL_LABELS: Record<string, string> = {
  PREVENTION: 'Prevention', RECOVERY: 'Recovery', STRENGTHENING: 'Strength',
  FLEXIBILITY: 'Flexibility', CONDITIONING: 'Conditioning',
};

const BODY_LABELS: Record<string, string> = {
  LOWER_BACK: 'Lower Back', UPPER_BACK: 'Upper Back', HEAD_NECK: 'Neck',
  LEFT_SHOULDER: 'L. Shoulder', RIGHT_SHOULDER: 'R. Shoulder',
  LEFT_WRIST_HAND: 'L. Wrist', RIGHT_WRIST_HAND: 'R. Wrist',
  LEFT_KNEE: 'L. Knee', RIGHT_KNEE: 'R. Knee',
};

function formatDuration(sec: number) {
  if (sec < 60) return `${sec}s`;
  return `${Math.round(sec / 60)}m`;
}

interface Exercise {
  id: string;
  name: string;
  description: string;
  difficulty: string;
  durationSec: number;
  bodyRegions: string[];
  goals: string[];
  instructions: string[];
}

function ExerciseCard({ exercise, onClick }: { exercise: Exercise; onClick: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} whileHover={{ y: -2 }}>
      <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={onClick}>
        <CardContent className="p-4">
          {/* Thumbnail placeholder */}
          <div className="w-full h-28 bg-gradient-to-br from-brand-50 to-brand-100 rounded-xl mb-3 flex items-center justify-center">
            <Dumbbell className="w-8 h-8 text-brand-400" />
          </div>

          <div className="space-y-2">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-gray-900 text-sm leading-tight">{exercise.name}</h3>
              <ChevronRight className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
            </div>

            <p className="text-xs text-gray-500 line-clamp-2">{exercise.description}</p>

            <div className="flex items-center gap-2 pt-1">
              <Badge variant={DIFFICULTY_COLORS[exercise.difficulty] as any} className="text-[10px] px-2">
                {exercise.difficulty.charAt(0) + exercise.difficulty.slice(1).toLowerCase()}
              </Badge>
              <span className="flex items-center gap-1 text-xs text-gray-400">
                <Clock className="w-3 h-3" /> {formatDuration(exercise.durationSec)}
              </span>
            </div>

            <div className="flex flex-wrap gap-1">
              {exercise.bodyRegions.slice(0, 2).map((r) => (
                <span key={r} className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                  {BODY_LABELS[r] ?? r.replace(/_/g, ' ')}
                </span>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function ExerciseDetail({ exercise, onClose }: { exercise: Exercise; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 40 }}
      className="space-y-5"
    >
      <button onClick={onClose} className="flex items-center gap-1 text-sm text-brand-600 font-medium hover:text-brand-700">
        ← Back to exercises
      </button>

      <div className="w-full h-48 bg-gradient-to-br from-brand-50 to-brand-100 rounded-2xl flex items-center justify-center">
        <Dumbbell className="w-16 h-16 text-brand-300" />
      </div>

      <div>
        <div className="flex items-center gap-2 mb-1">
          <Badge variant={DIFFICULTY_COLORS[exercise.difficulty] as any}>
            {exercise.difficulty.charAt(0) + exercise.difficulty.slice(1).toLowerCase()}
          </Badge>
          <span className="text-sm text-gray-500 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> {formatDuration(exercise.durationSec)}
          </span>
        </div>
        <h2 className="text-xl font-bold text-gray-900">{exercise.name}</h2>
        <p className="text-gray-600 mt-2 text-sm leading-relaxed">{exercise.description}</p>
      </div>

      <div>
        <h3 className="font-semibold text-gray-800 mb-2">Target Areas</h3>
        <div className="flex flex-wrap gap-2">
          {exercise.bodyRegions.map((r) => (
            <span key={r} className="bg-brand-50 text-brand-700 text-xs px-3 py-1 rounded-full">
              {BODY_LABELS[r] ?? r.replace(/_/g, ' ')}
            </span>
          ))}
        </div>
      </div>

      {exercise.instructions.length > 0 && (
        <div>
          <h3 className="font-semibold text-gray-800 mb-3">Instructions</h3>
          <ol className="space-y-3">
            {exercise.instructions.map((step, i) => (
              <li key={i} className="flex gap-3">
                <span className="w-6 h-6 bg-brand-100 text-brand-700 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <p className="text-sm text-gray-700 leading-relaxed">{step}</p>
              </li>
            ))}
          </ol>
        </div>
      )}

      {exercise.goals.length > 0 && (
        <div>
          <h3 className="font-semibold text-gray-800 mb-2">Goals</h3>
          <div className="flex flex-wrap gap-2">
            {exercise.goals.map((g) => (
              <span key={g} className="bg-green-50 text-green-700 text-xs px-3 py-1 rounded-full">
                {GOAL_LABELS[g] ?? g}
              </span>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

export default function ExercisesPage() {
  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [goal, setGoal] = useState('');
  const [bodyPart, setBodyPart] = useState('');
  const [selected, setSelected] = useState<Exercise | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const params = new URLSearchParams();
  if (search) params.set('search', search);
  if (difficulty) params.set('difficulty', difficulty);
  if (goal) params.set('goal', goal);
  if (bodyPart) params.set('bodyPart', bodyPart);

  const { data: exercises = [], isLoading } = useQuery({
    queryKey: ['exercises', search, difficulty, goal, bodyPart],
    queryFn: () => api.get(`/exercises?${params}`).then((r) => r.data.data),
    staleTime: 5 * 60 * 1000,
  });

  if (selected) {
    return <ExerciseDetail exercise={selected} onClose={() => setSelected(null)} />;
  }

  return (
    <div className="space-y-5">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-gray-900">Exercise Library</h1>
        <p className="text-gray-500 text-sm">{exercises.length} exercises available</p>
      </motion.div>

      {/* Search + Filter */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search exercises..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-300"
          />
        </div>
        <button
          onClick={() => setShowFilters((v) => !v)}
          className={cn('px-3 py-2.5 border rounded-xl transition-colors', showFilters ? 'bg-brand-50 border-brand-300 text-brand-700' : 'border-gray-200 text-gray-500 hover:border-gray-300')}
        >
          <Filter className="w-4 h-4" />
        </button>
      </div>

      {showFilters && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-300">
            <option value="">All Levels</option>
            {DIFFICULTIES.filter(Boolean).map((d) => <option key={d} value={d}>{d.charAt(0) + d.slice(1).toLowerCase()}</option>)}
          </select>
          <select value={goal} onChange={(e) => setGoal(e.target.value)} className="text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-300">
            <option value="">All Goals</option>
            {GOALS.filter(Boolean).map((g) => <option key={g} value={g}>{GOAL_LABELS[g]}</option>)}
          </select>
          <select value={bodyPart} onChange={(e) => setBodyPart(e.target.value)} className="text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-300">
            <option value="">All Body Parts</option>
            {BODY_PARTS.filter(Boolean).map((b) => <option key={b} value={b}>{BODY_LABELS[b]}</option>)}
          </select>
        </motion.div>
      )}

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-52 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : exercises.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Dumbbell className="w-10 h-10 mx-auto mb-2 opacity-40" />
          <p>No exercises found</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {exercises.map((ex: Exercise) => (
            <ExerciseCard key={ex.id} exercise={ex} onClick={() => setSelected(ex)} />
          ))}
        </div>
      )}
    </div>
  );
}
