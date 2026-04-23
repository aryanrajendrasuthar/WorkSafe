import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, GripVertical, Search, Save, ArrowLeft, Dumbbell } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { queryClient } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const JOB_CATEGORIES = ['DESK', 'LIGHT_PHYSICAL', 'HEAVY_PHYSICAL', 'DRIVING', 'HEALTHCARE', 'RETAIL', 'CONSTRUCTION', 'MANUFACTURING'];
const GOALS = ['PREVENTION', 'RECOVERY', 'STRENGTHENING', 'FLEXIBILITY', 'CONDITIONING'];
const GOAL_LABELS: Record<string, string> = {
  PREVENTION: 'Prevention', RECOVERY: 'Recovery', STRENGTHENING: 'Strength',
  FLEXIBILITY: 'Flexibility', CONDITIONING: 'Conditioning',
};

interface SelectedExercise {
  exerciseId: string;
  name: string;
  difficulty: string;
  durationSec: number;
  order: number;
  sets: number;
  reps: number | null;
  durationOverride: number | null;
  restSec: number;
  notes: string;
}

export default function ProgramBuilder() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [jobCategory, setJobCategory] = useState('DESK');
  const [goal, setGoal] = useState('PREVENTION');
  const [durationWeeks, setDurationWeeks] = useState(4);
  const [exercises, setExercises] = useState<SelectedExercise[]>([]);
  const [search, setSearch] = useState('');
  const [showExerciseSearch, setShowExerciseSearch] = useState(false);

  const { data: allExercises = [] } = useQuery({
    queryKey: ['exercises', search],
    queryFn: () => api.get(`/exercises${search ? `?search=${search}` : ''}`).then((r) => r.data.data),
    staleTime: 5 * 60 * 1000,
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/programs', data),
    onSuccess: () => {
      toast.success('Program created');
      queryClient.invalidateQueries({ queryKey: ['programs', 'org'] });
      navigate('/therapist/programs');
    },
    onError: () => toast.error('Failed to create program'),
  });

  const addExercise = (ex: any) => {
    if (exercises.find((e) => e.exerciseId === ex.id)) {
      toast.error('Already added');
      return;
    }
    setExercises((prev) => [
      ...prev,
      {
        exerciseId: ex.id,
        name: ex.name,
        difficulty: ex.difficulty,
        durationSec: ex.durationSec,
        order: prev.length + 1,
        sets: 3,
        reps: null,
        durationOverride: null,
        restSec: 60,
        notes: '',
      },
    ]);
    setShowExerciseSearch(false);
    setSearch('');
  };

  const removeExercise = (id: string) => {
    setExercises((prev) => prev.filter((e) => e.exerciseId !== id).map((e, i) => ({ ...e, order: i + 1 })));
  };

  const updateExercise = (id: string, key: keyof SelectedExercise, value: any) => {
    setExercises((prev) => prev.map((e) => (e.exerciseId === id ? { ...e, [key]: value } : e)));
  };

  const handleSubmit = () => {
    if (!name.trim()) { toast.error('Program name required'); return; }
    if (exercises.length === 0) { toast.error('Add at least one exercise'); return; }

    createMutation.mutate({
      name,
      description: description || undefined,
      jobCategory,
      goal,
      bodyRegions: [...new Set(exercises.flatMap(() => []))],
      durationWeeks,
      exercises: exercises.map((e) => ({
        exerciseId: e.exerciseId,
        order: e.order,
        sets: e.sets,
        reps: e.reps || undefined,
        durationSec: e.durationOverride || undefined,
        restSec: e.restSec,
        notes: e.notes || undefined,
      })),
    });
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/therapist/programs')} className="text-brand-600 hover:text-brand-700">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">New Program</h1>
      </div>

      {/* Program info */}
      <Card>
        <CardHeader><CardTitle className="text-base">Program Details</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">Program Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Lower Back Prevention Program"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">Description</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the program goals..."
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-300"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Job Category</label>
              <select value={jobCategory} onChange={(e) => setJobCategory(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300">
                {JOB_CATEGORIES.map((c) => <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Goal</label>
              <select value={goal} onChange={(e) => setGoal(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300">
                {GOALS.map((g) => <option key={g} value={g}>{GOAL_LABELS[g]}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Duration (weeks)</label>
              <input
                type="number"
                min={1}
                max={52}
                value={durationWeeks}
                onChange={(e) => setDurationWeeks(parseInt(e.target.value))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Exercises */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Exercises ({exercises.length})</CardTitle>
            <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setShowExerciseSearch(true)}>
              <Plus className="w-3.5 h-3.5" /> Add Exercise
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Exercise search overlay */}
          <AnimatePresence>
            {showExerciseSearch && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-4 p-3 bg-gray-50 rounded-xl border space-y-3"
              >
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    autoFocus
                    type="text"
                    placeholder="Search exercises..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-300"
                  />
                </div>
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {allExercises.slice(0, 10).map((ex: any) => (
                    <button
                      key={ex.id}
                      onClick={() => addExercise(ex)}
                      className="w-full text-left p-2.5 rounded-lg hover:bg-white border border-transparent hover:border-gray-200 transition-all flex items-center justify-between gap-2"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900">{ex.name}</p>
                        <p className="text-xs text-gray-400">{ex.difficulty} · {ex.durationSec}s</p>
                      </div>
                      <Plus className="w-4 h-4 text-brand-500 shrink-0" />
                    </button>
                  ))}
                </div>
                <Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => { setShowExerciseSearch(false); setSearch(''); }}>
                  Close
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          {exercises.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <Dumbbell className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No exercises added yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {exercises.map((ex, i) => (
                <motion.div
                  key={ex.exerciseId}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-3 border border-gray-200 rounded-xl"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <GripVertical className="w-4 h-4 text-gray-300 shrink-0 cursor-grab" />
                    <span className="w-6 h-6 bg-brand-100 text-brand-700 rounded-full text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                    <p className="font-semibold text-sm text-gray-900 flex-1">{ex.name}</p>
                    <Badge variant="outline" className="text-[10px]">{ex.difficulty}</Badge>
                    <button onClick={() => removeExercise(ex.exerciseId)} className="text-gray-400 hover:text-red-500 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { label: 'Sets', key: 'sets', type: 'number', value: ex.sets },
                      { label: 'Reps', key: 'reps', type: 'number', value: ex.reps ?? '' },
                      { label: 'Duration (s)', key: 'durationOverride', type: 'number', value: ex.durationOverride ?? '' },
                      { label: 'Rest (s)', key: 'restSec', type: 'number', value: ex.restSec },
                    ].map(({ label, key, type, value }) => (
                      <div key={key}>
                        <label className="text-[10px] text-gray-400 block mb-0.5">{label}</label>
                        <input
                          type={type}
                          value={value}
                          onChange={(e) => updateExercise(ex.exerciseId, key as any, e.target.value ? parseInt(e.target.value) : null)}
                          className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-brand-300"
                        />
                      </div>
                    ))}
                  </div>
                  <input
                    type="text"
                    placeholder="Notes for this exercise (optional)"
                    value={ex.notes}
                    onChange={(e) => updateExercise(ex.exerciseId, 'notes', e.target.value)}
                    className="mt-2 w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-brand-300"
                  />
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button variant="outline" className="flex-1" onClick={() => navigate('/therapist/programs')}>Cancel</Button>
        <Button className="flex-1 gap-2" onClick={handleSubmit} loading={createMutation.isPending}>
          <Save className="w-4 h-4" /> Save Program
        </Button>
      </div>
    </div>
  );
}
