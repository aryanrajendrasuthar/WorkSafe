import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ShieldCheck, ChevronRight, ChevronLeft, CheckCircle2, Briefcase,
  AlertCircle, User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';

const STEPS = ['Welcome', 'Job Profile', 'Physical Demands', 'Pain Areas', 'Complete'];

const jobProfileSchema = z.object({
  jobTitle: z.string().min(2, 'Job title required'),
  jobCategory: z.string().min(1, 'Job category required'),
  physicalDemandLevel: z.string().min(1, 'Physical demand level required'),
  shiftType: z.string().min(1, 'Shift type required'),
  yearsInRole: z.coerce.number().min(0).max(50).optional(),
  hoursPerDay: z.coerce.number().min(1).max(24).optional(),
});

type JobProfileForm = z.infer<typeof jobProfileSchema>;

const BODY_PARTS = [
  { id: 'HEAD_NECK', label: 'Head & Neck', emoji: '🧠' },
  { id: 'LEFT_SHOULDER', label: 'Left Shoulder', emoji: '💪' },
  { id: 'RIGHT_SHOULDER', label: 'Right Shoulder', emoji: '💪' },
  { id: 'UPPER_BACK', label: 'Upper Back', emoji: '🔙' },
  { id: 'LOWER_BACK', label: 'Lower Back', emoji: '🔙' },
  { id: 'LEFT_WRIST_HAND', label: 'Left Wrist & Hand', emoji: '🤝' },
  { id: 'RIGHT_WRIST_HAND', label: 'Right Wrist & Hand', emoji: '🤝' },
  { id: 'LEFT_KNEE', label: 'Left Knee', emoji: '🦵' },
  { id: 'RIGHT_KNEE', label: 'Right Knee', emoji: '🦵' },
  { id: 'LEFT_ANKLE_FOOT', label: 'Left Ankle & Foot', emoji: '🦶' },
  { id: 'RIGHT_ANKLE_FOOT', label: 'Right Ankle & Foot', emoji: '🦶' },
];

const PRIMARY_RISKS = [
  'Repetitive lifting', 'Extended standing', 'Prolonged sitting', 'Awkward postures',
  'Vibration exposure', 'Forceful exertion', 'Contact stress', 'Extreme temperatures',
  'Prolonged computer use', 'Driving long distances',
];

export default function Onboarding() {
  const navigate = useNavigate();
  const { user, setUser } = useAuthStore();
  const [step, setStep] = useState(0);
  const [selectedPainAreas, setSelectedPainAreas] = useState<string[]>([]);
  const [selectedRisks, setSelectedRisks] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<JobProfileForm>({
    resolver: zodResolver(jobProfileSchema),
    defaultValues: { yearsInRole: 1, hoursPerDay: 8 },
  });

  const togglePainArea = (id: string) => {
    setSelectedPainAreas((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleRisk = (risk: string) => {
    setSelectedRisks((prev) =>
      prev.includes(risk) ? prev.filter((x) => x !== risk) : [...prev, risk]
    );
  };

  const goToNext = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const goToPrev = () => setStep((s) => Math.max(s - 1, 0));

  const onSubmitForm = async (data: JobProfileForm) => {
    setIsSubmitting(true);
    setError('');
    try {
      await api.post('/workers/onboarding', {
        jobTitle: data.jobTitle,
        jobCategory: data.jobCategory,
        physicalDemandLevel: data.physicalDemandLevel,
        shiftType: data.shiftType,
        yearsInRole: data.yearsInRole,
        hoursPerDay: data.hoursPerDay,
        preExistingPainAreas: selectedPainAreas,
        primaryRisks: selectedRisks,
      });

      if (user) {
        setUser({ ...user, isOnboarded: true });
      }

      goToNext();
    } catch {
      setError('Failed to save your profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const slideVariants = {
    enter: (direction: number) => ({ x: direction > 0 ? 60 : -60, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (direction: number) => ({ x: direction > 0 ? -60 : 60, opacity: 0 }),
  };

  const [direction, setDirection] = useState(1);

  const nextStep = () => { setDirection(1); goToNext(); };
  const prevStep = () => { setDirection(-1); goToPrev(); };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center">
                <div className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all',
                  i < step ? 'gradient-brand text-white' :
                  i === step ? 'bg-white border-2 border-brand-500 text-brand-600' :
                  'bg-gray-100 text-gray-400'
                )}>
                  {i < step ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                </div>
                {i < STEPS.length - 1 && (
                  <div className={cn('flex-1 h-1 mx-2 rounded-full transition-all', i < step ? 'bg-brand-500' : 'bg-gray-200')}>
                    <div style={{ width: i < step ? '100%' : '0%' }} className="h-full gradient-brand rounded-full transition-all duration-500" />
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="text-center text-sm text-gray-500">
            Step {step + 1} of {STEPS.length} — <span className="font-medium text-gray-700">{STEPS[step]}</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border overflow-hidden">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="p-8"
            >
              {/* Step 0: Welcome */}
              {step === 0 && (
                <div className="text-center">
                  <div className="w-20 h-20 gradient-brand rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl">
                    <ShieldCheck className="w-10 h-10 text-white" />
                  </div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-3">
                    Welcome to WorkSafe, {user?.firstName}!
                  </h1>
                  <p className="text-gray-600 leading-relaxed mb-6 max-w-md mx-auto">
                    Let's set up your health profile in about 2 minutes. This helps us
                    personalize your exercise program and track your wellbeing.
                  </p>
                  <div className="grid grid-cols-3 gap-4 mb-8">
                    {[
                      { icon: '🗂️', title: 'Job Profile', desc: 'Your role & demands' },
                      { icon: '💪', title: 'Exercise Plan', desc: 'Tailored to your job' },
                      { icon: '📊', title: 'Risk Tracking', desc: 'Personal health trends' },
                    ].map((item) => (
                      <div key={item.title} className="p-4 bg-gray-50 rounded-xl text-center">
                        <div className="text-2xl mb-1">{item.icon}</div>
                        <div className="text-sm font-semibold text-gray-800">{item.title}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{item.desc}</div>
                      </div>
                    ))}
                  </div>
                  <Button variant="brand" size="lg" onClick={nextStep} className="min-w-48">
                    Let's get started
                    <ChevronRight className="w-5 h-5" />
                  </Button>
                </div>
              )}

              {/* Step 1: Job Profile */}
              {step === 1 && (
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                      <Briefcase className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Your Job Profile</h2>
                      <p className="text-sm text-gray-500">Help us understand your role</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <Label>Job Title</Label>
                      <Input placeholder="e.g. Warehouse Associate, Nurse, Software Engineer" {...register('jobTitle')} />
                      {errors.jobTitle && <p className="text-xs text-red-500">{errors.jobTitle.message}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label>Job Category</Label>
                        <Select onValueChange={(v) => setValue('jobCategory', v)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="DESK">Desk / Office</SelectItem>
                            <SelectItem value="LIGHT_PHYSICAL">Light Physical</SelectItem>
                            <SelectItem value="HEAVY_PHYSICAL">Heavy Physical</SelectItem>
                            <SelectItem value="DRIVING">Driving</SelectItem>
                            <SelectItem value="HEALTHCARE">Healthcare</SelectItem>
                            <SelectItem value="RETAIL">Retail</SelectItem>
                            <SelectItem value="CONSTRUCTION">Construction</SelectItem>
                            <SelectItem value="MANUFACTURING">Manufacturing</SelectItem>
                          </SelectContent>
                        </Select>
                        {errors.jobCategory && <p className="text-xs text-red-500">{errors.jobCategory.message}</p>}
                      </div>

                      <div className="space-y-1.5">
                        <Label>Shift Type</Label>
                        <Select onValueChange={(v) => setValue('shiftType', v)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select shift" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="DAY">Day shift</SelectItem>
                            <SelectItem value="EVENING">Evening shift</SelectItem>
                            <SelectItem value="NIGHT">Night shift</SelectItem>
                            <SelectItem value="ROTATING">Rotating</SelectItem>
                            <SelectItem value="FLEXIBLE">Flexible</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label>Years in this role</Label>
                        <Input type="number" min={0} max={50} placeholder="3" {...register('yearsInRole')} />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Hours per day</Label>
                        <Input type="number" min={1} max={24} placeholder="8" {...register('hoursPerDay')} />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between mt-8">
                    <Button variant="outline" onClick={prevStep}>
                      <ChevronLeft className="w-4 h-4" /> Back
                    </Button>
                    <Button variant="brand" onClick={nextStep}>
                      Continue <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 2: Physical Demands */}
              {step === 2 && (
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
                      <AlertCircle className="w-5 h-5 text-orange-500" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Physical Demands</h2>
                      <p className="text-sm text-gray-500">Select all that apply to your job</p>
                    </div>
                  </div>

                  <div className="space-y-4 mb-6">
                    <div className="space-y-1.5">
                      <Label>Overall Physical Demand Level</Label>
                      <Select onValueChange={(v) => setValue('physicalDemandLevel', v)}>
                        <SelectTrigger>
                          <SelectValue placeholder="How physically demanding is your job?" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="SEDENTARY">Sedentary (mostly sitting)</SelectItem>
                          <SelectItem value="LIGHT">Light (occasional walking/standing)</SelectItem>
                          <SelectItem value="MEDIUM">Medium (frequent standing/walking)</SelectItem>
                          <SelectItem value="HEAVY">Heavy (frequent lifting/physical work)</SelectItem>
                          <SelectItem value="VERY_HEAVY">Very Heavy (continuous strenuous work)</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.physicalDemandLevel && <p className="text-xs text-red-500">{errors.physicalDemandLevel.message}</p>}
                    </div>

                    <div>
                      <Label className="mb-3 block">Primary Risk Factors (select all that apply)</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {PRIMARY_RISKS.map((risk) => (
                          <button
                            key={risk}
                            type="button"
                            onClick={() => toggleRisk(risk)}
                            className={cn(
                              'px-3 py-2 rounded-lg text-sm text-left border transition-all',
                              selectedRisks.includes(risk)
                                ? 'border-brand-500 bg-brand-50 text-brand-700 font-medium'
                                : 'border-gray-200 hover:border-gray-300 text-gray-700'
                            )}
                          >
                            {selectedRisks.includes(risk) && <CheckCircle2 className="w-3.5 h-3.5 inline mr-1.5 text-brand-500" />}
                            {risk}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between mt-8">
                    <Button variant="outline" onClick={prevStep}>
                      <ChevronLeft className="w-4 h-4" /> Back
                    </Button>
                    <Button variant="brand" onClick={nextStep}>
                      Continue <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 3: Pre-existing Pain Areas */}
              {step === 3 && (
                <form onSubmit={handleSubmit(onSubmitForm)}>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
                      <User className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Any pre-existing pain?</h2>
                      <p className="text-sm text-gray-500">Optional — helps us personalize your program</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-6">
                    {BODY_PARTS.map((part) => (
                      <button
                        key={part.id}
                        type="button"
                        onClick={() => togglePainArea(part.id)}
                        className={cn(
                          'flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-left border transition-all',
                          selectedPainAreas.includes(part.id)
                            ? 'border-red-400 bg-red-50 text-red-700 font-medium'
                            : 'border-gray-200 hover:border-gray-300 text-gray-700'
                        )}
                      >
                        <span>{part.emoji}</span>
                        <span>{part.label}</span>
                      </button>
                    ))}
                  </div>

                  {selectedPainAreas.length > 0 && (
                    <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-sm text-amber-700 mb-4 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>
                        We'll notify your therapist about your pre-existing pain areas so they can
                        tailor your program accordingly.
                      </span>
                    </div>
                  )}

                  {error && (
                    <div className="p-3 bg-red-50 rounded-xl border border-red-200 text-sm text-red-700 mb-4 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      {error}
                    </div>
                  )}

                  <div className="flex justify-between">
                    <Button type="button" variant="outline" onClick={prevStep}>
                      <ChevronLeft className="w-4 h-4" /> Back
                    </Button>
                    <div className="flex gap-3">
                      {selectedPainAreas.length === 0 && (
                        <Button type="submit" variant="ghost" loading={isSubmitting}>
                          Skip
                        </Button>
                      )}
                      <Button type="submit" variant="brand" loading={isSubmitting}>
                        {selectedPainAreas.length > 0 ? 'Save & Continue' : 'Finish Setup'}
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Hidden inputs for react-hook-form */}
                  <input type="hidden" {...register('jobCategory')} value={watch('jobCategory')} />
                  <input type="hidden" {...register('physicalDemandLevel')} value={watch('physicalDemandLevel')} />
                  <input type="hidden" {...register('shiftType')} value={watch('shiftType')} />
                </form>
              )}

              {/* Step 4: Complete */}
              {step === 4 && (
                <div className="text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', damping: 12, stiffness: 200, delay: 0.1 }}
                    className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
                  >
                    <CheckCircle2 className="w-12 h-12 text-green-500" />
                  </motion.div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-3">You're all set! 🎉</h2>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    Your profile has been saved. We've assigned you a personalized exercise
                    program based on your job demands. Start your first check-in to begin
                    tracking your health.
                  </p>
                  <div className="grid grid-cols-2 gap-4 mb-8 max-w-sm mx-auto">
                    <div className="p-4 bg-blue-50 rounded-xl text-left">
                      <div className="text-2xl mb-1">💪</div>
                      <div className="text-sm font-semibold text-blue-800">Program Assigned</div>
                      <div className="text-xs text-blue-600 mt-0.5">Based on your job type</div>
                    </div>
                    <div className="p-4 bg-green-50 rounded-xl text-left">
                      <div className="text-2xl mb-1">📊</div>
                      <div className="text-sm font-semibold text-green-800">Tracking Active</div>
                      <div className="text-xs text-green-600 mt-0.5">Risk score set up</div>
                    </div>
                  </div>
                  <Button
                    variant="brand"
                    size="lg"
                    onClick={() => navigate('/worker/dashboard')}
                    className="min-w-48"
                  >
                    Go to Dashboard
                    <ChevronRight className="w-5 h-5" />
                  </Button>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
