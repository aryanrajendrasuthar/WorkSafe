import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Plus, Dumbbell, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const GOAL_COLORS: Record<string, string> = {
  PREVENTION: 'bg-blue-100 text-blue-700',
  RECOVERY: 'bg-orange-100 text-orange-700',
  STRENGTHENING: 'bg-purple-100 text-purple-700',
  FLEXIBILITY: 'bg-green-100 text-green-700',
  CONDITIONING: 'bg-teal-100 text-teal-700',
};

export default function TherapistPrograms() {
  const { data: programs = [], isLoading } = useQuery({
    queryKey: ['programs', 'org'],
    queryFn: () => api.get('/programs/org').then((r) => r.data.data),
  });

  return (
    <div className="space-y-5 max-w-3xl">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Programs</h1>
          <p className="text-gray-500 text-sm">{programs.length} programs in your organization</p>
        </div>
        <Link to="/therapist/programs/new">
          <Button className="gap-1.5">
            <Plus className="w-4 h-4" /> New Program
          </Button>
        </Link>
      </motion.div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : programs.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-gray-400">
            <Dumbbell className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="font-medium text-gray-500 mb-1">No programs yet</p>
            <p className="text-sm">Create your first program to assign to workers.</p>
            <Link to="/therapist/programs/new" className="mt-4 inline-block">
              <Button size="sm" className="gap-1.5">
                <Plus className="w-3.5 h-3.5" /> Create Program
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {programs.map((p: any, i: number) => (
            <motion.div key={p.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center shrink-0">
                    <Dumbbell className="w-5 h-5 text-purple-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-gray-900 text-sm">{p.name}</p>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${GOAL_COLORS[p.goal] ?? 'bg-gray-100 text-gray-600'}`}>
                        {p.goal}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {p.programExercises?.length ?? 0} exercises · {p.durationWeeks}w · {p.jobCategory?.replace(/_/g, ' ')}
                    </p>
                    {p.description && (
                      <p className="text-xs text-gray-400 mt-0.5 truncate">{p.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right hidden sm:block">
                      <p className="text-xs text-gray-400">{p._count?.workerPrograms ?? 0} assigned</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
