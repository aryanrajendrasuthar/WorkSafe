import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export type BodyRegion =
  | 'HEAD_NECK' | 'LEFT_SHOULDER' | 'RIGHT_SHOULDER'
  | 'UPPER_BACK' | 'LOWER_BACK' | 'LEFT_ELBOW' | 'RIGHT_ELBOW'
  | 'LEFT_WRIST_HAND' | 'RIGHT_WRIST_HAND' | 'CHEST' | 'ABDOMEN'
  | 'LEFT_HIP' | 'RIGHT_HIP' | 'LEFT_KNEE' | 'RIGHT_KNEE'
  | 'LEFT_ANKLE_FOOT' | 'RIGHT_ANKLE_FOOT';

export interface BodyAreaSelection {
  region: BodyRegion;
  intensity: number; // 0–10
}

interface BodyMapProps {
  selections: BodyAreaSelection[];
  onToggle?: (region: BodyRegion) => void;
  readonly?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const REGION_LABELS: Record<BodyRegion, string> = {
  HEAD_NECK: 'Head & Neck',
  LEFT_SHOULDER: 'Left Shoulder',
  RIGHT_SHOULDER: 'Right Shoulder',
  UPPER_BACK: 'Upper Back',
  LOWER_BACK: 'Lower Back',
  LEFT_ELBOW: 'Left Elbow',
  RIGHT_ELBOW: 'Right Elbow',
  LEFT_WRIST_HAND: 'Left Wrist',
  RIGHT_WRIST_HAND: 'Right Wrist',
  CHEST: 'Chest',
  ABDOMEN: 'Abdomen',
  LEFT_HIP: 'Left Hip',
  RIGHT_HIP: 'Right Hip',
  LEFT_KNEE: 'Left Knee',
  RIGHT_KNEE: 'Right Knee',
  LEFT_ANKLE_FOOT: 'Left Ankle',
  RIGHT_ANKLE_FOOT: 'Right Ankle',
};

function intensityColor(intensity: number, selected: boolean): string {
  if (!selected || intensity === 0) return 'fill-slate-200 hover:fill-brand-100';
  if (intensity <= 2) return 'fill-green-200 hover:fill-green-300';
  if (intensity <= 4) return 'fill-yellow-200 hover:fill-yellow-300';
  if (intensity <= 6) return 'fill-orange-300 hover:fill-orange-400';
  if (intensity <= 8) return 'fill-red-400 hover:fill-red-500';
  return 'fill-red-600 hover:fill-red-700';
}

function intensityStroke(intensity: number, selected: boolean): string {
  if (!selected || intensity === 0) return 'stroke-slate-400';
  if (intensity <= 2) return 'stroke-green-400';
  if (intensity <= 4) return 'stroke-yellow-400';
  if (intensity <= 6) return 'stroke-orange-500';
  return 'stroke-red-600';
}

// Front body SVG regions
function FrontBody({ selections, onToggle, readonly }: Omit<BodyMapProps, 'size'>) {
  const getRegion = (r: BodyRegion) => selections.find((s) => s.region === r);

  const region = (r: BodyRegion, path: React.ReactNode) => {
    const sel = getRegion(r);
    const selected = !!sel;
    const intensity = sel?.intensity ?? 0;
    return (
      <g
        key={r}
        onClick={() => !readonly && onToggle?.(r)}
        className={cn('transition-colors duration-150', !readonly && 'cursor-pointer')}
        role={!readonly ? 'button' : undefined}
        aria-label={REGION_LABELS[r]}
      >
        <g className={cn(intensityColor(intensity, selected), intensityStroke(intensity, selected), 'stroke-[1.5]')}>
          {path}
        </g>
      </g>
    );
  };

  return (
    <svg viewBox="0 0 120 280" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      {/* Head */}
      {region('HEAD_NECK', <ellipse cx="60" cy="22" rx="16" ry="19" />)}
      {/* Neck */}
      {region('HEAD_NECK', <rect x="54" y="40" width="12" height="10" rx="3" />)}
      {/* Left Shoulder */}
      {region('LEFT_SHOULDER', <ellipse cx="31" cy="58" rx="13" ry="10" />)}
      {/* Right Shoulder */}
      {region('RIGHT_SHOULDER', <ellipse cx="89" cy="58" rx="13" ry="10" />)}
      {/* Chest */}
      {region('CHEST', <rect x="43" y="52" width="34" height="30" rx="4" />)}
      {/* Abdomen */}
      {region('ABDOMEN', <rect x="44" y="84" width="32" height="28" rx="4" />)}
      {/* Left Upper Arm / Elbow */}
      {region('LEFT_ELBOW', <rect x="16" y="68" width="13" height="28" rx="6" />)}
      {/* Right Upper Arm / Elbow */}
      {region('RIGHT_ELBOW', <rect x="91" y="68" width="13" height="28" rx="6" />)}
      {/* Left Wrist/Hand */}
      {region('LEFT_WRIST_HAND', <rect x="12" y="98" width="13" height="26" rx="5" />)}
      {/* Right Wrist/Hand */}
      {region('RIGHT_WRIST_HAND', <rect x="95" y="98" width="13" height="26" rx="5" />)}
      {/* Left Hip */}
      {region('LEFT_HIP', <rect x="43" y="114" width="16" height="22" rx="3" />)}
      {/* Right Hip */}
      {region('RIGHT_HIP', <rect x="61" y="114" width="16" height="22" rx="3" />)}
      {/* Left Knee */}
      {region('LEFT_KNEE', <rect x="43" y="158" width="16" height="22" rx="4" />)}
      {/* Right Knee */}
      {region('RIGHT_KNEE', <rect x="61" y="158" width="16" height="22" rx="4" />)}
      {/* Left Thigh */}
      <rect x="44" y="137" width="14" height="20" rx="3" className="fill-slate-100 stroke-slate-300 stroke-[1]" />
      {/* Right Thigh */}
      <rect x="62" y="137" width="14" height="20" rx="3" className="fill-slate-100 stroke-slate-300 stroke-[1]" />
      {/* Left Shin */}
      <rect x="44" y="182" width="14" height="28" rx="3" className="fill-slate-100 stroke-slate-300 stroke-[1]" />
      {/* Right Shin */}
      <rect x="62" y="182" width="14" height="28" rx="3" className="fill-slate-100 stroke-slate-300 stroke-[1]" />
      {/* Left Ankle/Foot */}
      {region('LEFT_ANKLE_FOOT', <rect x="41" y="212" width="18" height="14" rx="4" />)}
      {/* Right Ankle/Foot */}
      {region('RIGHT_ANKLE_FOOT', <rect x="61" y="212" width="18" height="14" rx="4" />)}
    </svg>
  );
}

// Back body SVG regions
function BackBody({ selections, onToggle, readonly }: Omit<BodyMapProps, 'size'>) {
  const getRegion = (r: BodyRegion) => selections.find((s) => s.region === r);

  const region = (r: BodyRegion, path: React.ReactNode) => {
    const sel = getRegion(r);
    const selected = !!sel;
    const intensity = sel?.intensity ?? 0;
    return (
      <g
        key={r}
        onClick={() => !readonly && onToggle?.(r)}
        className={cn('transition-colors duration-150', !readonly && 'cursor-pointer')}
        role={!readonly ? 'button' : undefined}
        aria-label={REGION_LABELS[r]}
      >
        <g className={cn(intensityColor(intensity, selected), intensityStroke(intensity, selected), 'stroke-[1.5]')}>
          {path}
        </g>
      </g>
    );
  };

  return (
    <svg viewBox="0 0 120 280" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      {/* Head back */}
      {region('HEAD_NECK', <ellipse cx="60" cy="22" rx="16" ry="19" />)}
      {/* Neck back */}
      {region('HEAD_NECK', <rect x="54" y="40" width="12" height="10" rx="3" />)}
      {/* Left Shoulder back */}
      {region('LEFT_SHOULDER', <ellipse cx="31" cy="58" rx="13" ry="10" />)}
      {/* Right Shoulder back */}
      {region('RIGHT_SHOULDER', <ellipse cx="89" cy="58" rx="13" ry="10" />)}
      {/* Upper Back */}
      {region('UPPER_BACK', <rect x="43" y="52" width="34" height="26" rx="4" />)}
      {/* Lower Back */}
      {region('LOWER_BACK', <rect x="44" y="80" width="32" height="32" rx="4" />)}
      {/* Left Elbow back */}
      {region('LEFT_ELBOW', <rect x="16" y="68" width="13" height="28" rx="6" />)}
      {/* Right Elbow back */}
      {region('RIGHT_ELBOW', <rect x="91" y="68" width="13" height="28" rx="6" />)}
      {/* Left Wrist/Hand back */}
      {region('LEFT_WRIST_HAND', <rect x="12" y="98" width="13" height="26" rx="5" />)}
      {/* Right Wrist/Hand back */}
      {region('RIGHT_WRIST_HAND', <rect x="95" y="98" width="13" height="26" rx="5" />)}
      {/* Left Hip back */}
      {region('LEFT_HIP', <rect x="43" y="114" width="16" height="22" rx="3" />)}
      {/* Right Hip back */}
      {region('RIGHT_HIP', <rect x="61" y="114" width="16" height="22" rx="3" />)}
      {/* Left Knee back */}
      {region('LEFT_KNEE', <rect x="43" y="158" width="16" height="22" rx="4" />)}
      {/* Right Knee back */}
      {region('RIGHT_KNEE', <rect x="61" y="158" width="16" height="22" rx="4" />)}
      {/* Thighs back */}
      <rect x="44" y="137" width="14" height="20" rx="3" className="fill-slate-100 stroke-slate-300 stroke-[1]" />
      <rect x="62" y="137" width="14" height="20" rx="3" className="fill-slate-100 stroke-slate-300 stroke-[1]" />
      {/* Calves */}
      <rect x="44" y="182" width="14" height="28" rx="3" className="fill-slate-100 stroke-slate-300 stroke-[1]" />
      <rect x="62" y="182" width="14" height="28" rx="3" className="fill-slate-100 stroke-slate-300 stroke-[1]" />
      {/* Left Ankle/Foot back */}
      {region('LEFT_ANKLE_FOOT', <rect x="41" y="212" width="18" height="14" rx="4" />)}
      {/* Right Ankle/Foot back */}
      {region('RIGHT_ANKLE_FOOT', <rect x="61" y="212" width="18" height="14" rx="4" />)}
    </svg>
  );
}

export function BodyMap({ selections, onToggle, readonly = false, size = 'md' }: BodyMapProps) {
  const [view, setView] = useState<'front' | 'back'>('front');

  const containerH = size === 'sm' ? 'h-48' : size === 'lg' ? 'h-80' : 'h-64';

  const selectedRegions = selections.filter((s) => s.intensity > 0);

  return (
    <div className="flex flex-col items-center gap-3">
      {/* View toggle */}
      {!readonly && (
        <div className="flex bg-gray-100 rounded-lg p-1 gap-1">
          {(['front', 'back'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={cn(
                'px-4 py-1.5 rounded-md text-sm font-medium transition-all',
                view === v ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700',
              )}
            >
              {v === 'front' ? 'Front' : 'Back'}
            </button>
          ))}
        </div>
      )}

      {/* SVG body */}
      <div className={cn('relative flex gap-4', readonly ? 'flex-row' : '')}>
        <div className={cn(containerH, 'relative', readonly ? 'w-24' : 'w-32')}>
          <AnimatePresence mode="wait">
            <motion.div
              key={readonly ? 'front' : view}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="w-full h-full"
            >
              {(readonly || view === 'front') ? (
                <FrontBody selections={selections} onToggle={onToggle} readonly={readonly} />
              ) : (
                <BackBody selections={selections} onToggle={onToggle} readonly={readonly} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
        {readonly && (
          <div className={cn(containerH, 'w-24')}>
            <BackBody selections={selections} onToggle={undefined} readonly={true} />
          </div>
        )}
      </div>

      {/* Legend */}
      {!readonly && (
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>None</span>
          {[2, 4, 6, 8, 10].map((v) => (
            <div key={v} className={cn('w-4 h-4 rounded', {
              'bg-green-200': v <= 2,
              'bg-yellow-200': v <= 4 && v > 2,
              'bg-orange-300': v <= 6 && v > 4,
              'bg-red-400': v <= 8 && v > 6,
              'bg-red-600': v > 8,
            })} />
          ))}
          <span>Severe</span>
        </div>
      )}

      {/* Selected regions summary */}
      {selectedRegions.length > 0 && (
        <div className="flex flex-wrap gap-1.5 justify-center max-w-xs">
          {selectedRegions.map((s) => (
            <span
              key={s.region}
              className={cn('text-xs px-2 py-0.5 rounded-full font-medium', {
                'bg-green-100 text-green-700': s.intensity <= 2,
                'bg-yellow-100 text-yellow-700': s.intensity <= 4 && s.intensity > 2,
                'bg-orange-100 text-orange-700': s.intensity <= 6 && s.intensity > 4,
                'bg-red-100 text-red-700': s.intensity > 6,
              })}
            >
              {REGION_LABELS[s.region]} · {s.intensity}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export { REGION_LABELS };
