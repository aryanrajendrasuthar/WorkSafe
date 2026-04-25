import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Lock } from 'lucide-react';
import { api } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface Achievement {
  type: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt: string | null;
}

export default function AchievementsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['achievements'],
    queryFn: () => api.get('/achievements').then((r) => r.data.data),
  });

  const achievements: Achievement[] = data?.achievements ?? [];
  const unlockedCount: number = data?.unlockedCount ?? 0;
  const total = achievements.length;

  return (
    <div className="space-y-5">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Milestones</h1>
        <p className="text-gray-500 text-sm">
          {isLoading ? '—' : `${unlockedCount} of ${total} unlocked`}
        </p>
      </motion.div>

      {/* Progress bar */}
      {!isLoading && total > 0 && (
        <div className="space-y-1">
          <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-brand-500 to-green-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${(unlockedCount / total) * 100}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
          <p className="text-xs text-right text-gray-400">
            {Math.round((unlockedCount / total) * 100)}% complete
          </p>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="h-36 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {achievements.map((a, i) => (
            <motion.div
              key={a.type}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <Card
                className={cn(
                  'transition-all h-full',
                  a.unlocked
                    ? 'border-brand-200 dark:border-brand-800 shadow-sm'
                    : 'opacity-50 grayscale',
                )}
              >
                <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                  <div
                    className={cn(
                      'w-12 h-12 rounded-full flex items-center justify-center text-2xl',
                      a.unlocked
                        ? 'bg-brand-50 dark:bg-brand-900/30'
                        : 'bg-gray-100 dark:bg-gray-800',
                    )}
                  >
                    {a.unlocked ? a.icon : <Lock className="w-5 h-5 text-gray-400" />}
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-gray-900 dark:text-gray-100 leading-tight">
                      {a.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5 leading-snug">{a.description}</p>
                  </div>
                  {a.unlocked && a.unlockedAt && (
                    <p className="text-xs text-brand-500 font-medium">
                      {new Date(a.unlockedAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
