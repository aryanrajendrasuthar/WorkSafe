import 'dotenv/config';
import { PrismaClient, Role, PhysicalDemandLevel, ShiftType, JobCategory, BodyPart, ProgramGoal, ExerciseDifficulty } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';

const adapter = new PrismaPg({ connectionString: process.env['DATABASE_URL'] as string });
const prisma = new PrismaClient({ adapter } as any);

async function main() {
  console.log('🌱 Seeding WorkSafe database...');

  // ─── Organization ──────────────────────────────────────────────────────────
  const org = await prisma.organization.upsert({
    where: { id: 'seed-org-001' },
    update: {},
    create: {
      id: 'seed-org-001',
      name: 'Acme Manufacturing Co.',
      industry: 'Manufacturing',
      subscriptionTier: 'GROWTH',
      maxWorkers: 500,
    },
  });

  // ─── Departments ───────────────────────────────────────────────────────────
  const deptWarehouse = await prisma.department.upsert({
    where: { id: 'dept-001' },
    update: {},
    create: { id: 'dept-001', organizationId: org.id, name: 'Warehouse & Logistics', location: 'Building A' },
  });
  const deptOffice = await prisma.department.upsert({
    where: { id: 'dept-002' },
    update: {},
    create: { id: 'dept-002', organizationId: org.id, name: 'Office & Admin', location: 'Building B' },
  });
  const deptAssembly = await prisma.department.upsert({
    where: { id: 'dept-003' },
    update: {},
    create: { id: 'dept-003', organizationId: org.id, name: 'Assembly Line', location: 'Building C' },
  });

  // ─── Seed passwords ────────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash('Password123!', 12);
  const adminPasswordHash = await bcrypt.hash('Aryan@53', 12);

  // ─── Users (one per role) ──────────────────────────────────────────────────
  const adminUser = await prisma.user.upsert({
    where: { email: 'aryanrajendrasuthar@gmail.com' },
    update: { passwordHash: adminPasswordHash },
    create: {
      email: 'aryanrajendrasuthar@gmail.com', firstName: 'Aryan', lastName: 'Suthar',
      passwordHash: adminPasswordHash, role: Role.COMPANY_ADMIN, organizationId: org.id, isOnboarded: true,
    },
  });
  const therapistUser = await prisma.user.upsert({
    where: { email: 'therapist@gmail.com' },
    update: { passwordHash },
    create: {
      email: 'therapist@gmail.com', firstName: 'Dr. Marcus', lastName: 'Johnson',
      passwordHash, role: Role.THERAPIST, organizationId: org.id, isOnboarded: true,
    },
  });
  const safetyUser = await prisma.user.upsert({
    where: { email: 'safety@gmail.com' },
    update: { passwordHash },
    create: {
      email: 'safety@gmail.com', firstName: 'Lisa', lastName: 'Rodriguez',
      passwordHash, role: Role.SAFETY_MANAGER, organizationId: org.id, isOnboarded: true,
    },
  });
  const hrUser = await prisma.user.upsert({
    where: { email: 'hr@demo.worksafe.com' },
    update: { passwordHash },
    create: {
      email: 'hr@demo.worksafe.com', firstName: 'Tom', lastName: 'Williams',
      passwordHash, role: Role.HR_ADMIN, organizationId: org.id, isOnboarded: true,
    },
  });
  const workerUser = await prisma.user.upsert({
    where: { email: 'worker@gmail.com' },
    update: { passwordHash },
    create: {
      email: 'worker@gmail.com', firstName: 'Alex', lastName: 'Thompson',
      passwordHash, role: Role.WORKER, organizationId: org.id, departmentId: deptWarehouse.id,
      isOnboarded: true,
    },
  });

  // ─── Job Profiles ──────────────────────────────────────────────────────────
  await prisma.jobProfile.upsert({
    where: { userId: workerUser.id },
    update: {},
    create: {
      userId: workerUser.id,
      title: 'Warehouse Associate',
      jobCategory: JobCategory.HEAVY_PHYSICAL,
      physicalDemandLevel: PhysicalDemandLevel.HEAVY,
      shiftType: ShiftType.DAY,
      primaryRisks: ['Repetitive lifting', 'Extended standing', 'Awkward postures'],
      yearsInRole: 3,
      hoursPerDay: 8,
    },
  });

  // ─── Exercise Library (30+ exercises) ─────────────────────────────────────
  const exercises = [
    // Lower Back
    { name: 'Cat-Cow Stretch', description: 'Mobilize your spine with gentle flexion and extension movements.', bodyRegions: [BodyPart.LOWER_BACK, BodyPart.UPPER_BACK], jobCategories: [JobCategory.HEAVY_PHYSICAL, JobCategory.DESK], goals: [ProgramGoal.FLEXIBILITY, ProgramGoal.PREVENTION], difficulty: ExerciseDifficulty.BEGINNER, durationSec: 60, instructions: ['Start on hands and knees', 'Arch back upward (Cat)', 'Dip back downward (Cow)', 'Repeat 10 times slowly'] },
    { name: 'Bird Dog', description: 'Strengthen core stabilizers to support your lower back.', bodyRegions: [BodyPart.LOWER_BACK], jobCategories: [JobCategory.HEAVY_PHYSICAL, JobCategory.DESK], goals: [ProgramGoal.STRENGTHENING, ProgramGoal.PREVENTION], difficulty: ExerciseDifficulty.BEGINNER, durationSec: 90, instructions: ['Start on hands and knees', 'Extend right arm and left leg simultaneously', 'Hold 5 seconds', 'Repeat on other side', '10 reps per side'] },
    { name: 'McKenzie Press-Up', description: 'Extension exercise to relieve lower back disc pressure.', bodyRegions: [BodyPart.LOWER_BACK], jobCategories: [JobCategory.HEAVY_PHYSICAL, JobCategory.MANUFACTURING], goals: [ProgramGoal.RECOVERY, ProgramGoal.FLEXIBILITY], difficulty: ExerciseDifficulty.BEGINNER, durationSec: 45, instructions: ['Lie face down', 'Place hands under shoulders', 'Slowly press up, keeping hips on floor', 'Hold 3 seconds', 'Lower back down', 'Repeat 10 times'] },
    { name: 'Dead Bug', description: 'Anti-extension core exercise for lower back stability.', bodyRegions: [BodyPart.LOWER_BACK], jobCategories: [JobCategory.DESK, JobCategory.HEAVY_PHYSICAL], goals: [ProgramGoal.STRENGTHENING], difficulty: ExerciseDifficulty.INTERMEDIATE, durationSec: 90, instructions: ['Lie on back, arms up, knees bent 90°', 'Lower opposite arm and leg toward floor', 'Return to start', 'Alternate sides', '8 reps per side'] },
    { name: 'Glute Bridge', description: 'Activate glutes to reduce lower back strain.', bodyRegions: [BodyPart.LOWER_BACK, BodyPart.LEFT_HIP, BodyPart.RIGHT_HIP], jobCategories: [JobCategory.HEAVY_PHYSICAL, JobCategory.DESK], goals: [ProgramGoal.STRENGTHENING, ProgramGoal.PREVENTION], difficulty: ExerciseDifficulty.BEGINNER, durationSec: 60, instructions: ['Lie on back, feet flat, knees bent', 'Push through heels to lift hips', 'Squeeze glutes at top', 'Hold 2 seconds', 'Lower slowly', '15 reps'] },
    // Neck & Shoulders
    { name: 'Chin Tucks', description: 'Restore normal neck alignment and relieve cervical strain.', bodyRegions: [BodyPart.HEAD_NECK], jobCategories: [JobCategory.DESK, JobCategory.DRIVING], goals: [ProgramGoal.PREVENTION, ProgramGoal.RECOVERY], difficulty: ExerciseDifficulty.BEGINNER, durationSec: 30, instructions: ['Sit or stand tall', 'Gently draw chin straight back', 'Hold 5 seconds', 'Release', 'Repeat 10 times'] },
    { name: 'Neck Side Bend Stretch', description: 'Stretch scalene and upper trapezius muscles.', bodyRegions: [BodyPart.HEAD_NECK, BodyPart.LEFT_SHOULDER, BodyPart.RIGHT_SHOULDER], jobCategories: [JobCategory.DESK, JobCategory.DRIVING, JobCategory.HEALTHCARE], goals: [ProgramGoal.FLEXIBILITY, ProgramGoal.PREVENTION], difficulty: ExerciseDifficulty.BEGINNER, durationSec: 60, instructions: ['Sit tall', 'Slowly tilt ear to shoulder', 'Hold 20-30 seconds', 'Repeat on other side', '2-3 reps each'] },
    { name: 'Shoulder Rolls', description: 'Release tension in upper trapezius and shoulder girdle.', bodyRegions: [BodyPart.LEFT_SHOULDER, BodyPart.RIGHT_SHOULDER, BodyPart.HEAD_NECK], jobCategories: [JobCategory.DESK, JobCategory.MANUFACTURING, JobCategory.RETAIL], goals: [ProgramGoal.FLEXIBILITY, ProgramGoal.PREVENTION], difficulty: ExerciseDifficulty.BEGINNER, durationSec: 30, instructions: ['Sit or stand comfortably', 'Roll shoulders forward 5 times', 'Roll shoulders backward 5 times', 'Relax and repeat'] },
    { name: 'Band Pull-Apart', description: 'Strengthen posterior shoulder stabilizers and improve posture.', bodyRegions: [BodyPart.LEFT_SHOULDER, BodyPart.RIGHT_SHOULDER, BodyPart.UPPER_BACK], jobCategories: [JobCategory.DESK, JobCategory.HEALTHCARE], goals: [ProgramGoal.STRENGTHENING, ProgramGoal.PREVENTION], difficulty: ExerciseDifficulty.INTERMEDIATE, durationSec: 60, instructions: ['Hold resistance band at shoulder width', 'Pull band apart to chest level', 'Squeeze shoulder blades', 'Slowly return', '15 reps'] },
    { name: 'Pendulum Swings', description: 'Gentle shoulder mobilization to reduce impingement risk.', bodyRegions: [BodyPart.LEFT_SHOULDER, BodyPart.RIGHT_SHOULDER], jobCategories: [JobCategory.HEAVY_PHYSICAL, JobCategory.CONSTRUCTION], goals: [ProgramGoal.RECOVERY, ProgramGoal.FLEXIBILITY], difficulty: ExerciseDifficulty.BEGINNER, durationSec: 60, instructions: ['Lean forward, arm hanging down', 'Let arm swing in small circles clockwise', '10 circles each direction', 'Repeat on other shoulder'] },
    // Wrists & Hands
    { name: 'Wrist Flexor Stretch', description: 'Stretch forearm flexors to prevent carpal tunnel syndrome.', bodyRegions: [BodyPart.LEFT_WRIST_HAND, BodyPart.RIGHT_WRIST_HAND], jobCategories: [JobCategory.DESK, JobCategory.MANUFACTURING, JobCategory.RETAIL], goals: [ProgramGoal.FLEXIBILITY, ProgramGoal.PREVENTION], difficulty: ExerciseDifficulty.BEGINNER, durationSec: 45, instructions: ['Extend arm forward, palm up', 'Gently pull fingers back', 'Hold 20-30 seconds', 'Repeat on other hand'] },
    { name: 'Wrist Extensor Stretch', description: 'Stretch forearm extensors to reduce typing strain.', bodyRegions: [BodyPart.LEFT_WRIST_HAND, BodyPart.RIGHT_WRIST_HAND, BodyPart.LEFT_ELBOW, BodyPart.RIGHT_ELBOW], jobCategories: [JobCategory.DESK, JobCategory.MANUFACTURING], goals: [ProgramGoal.FLEXIBILITY, ProgramGoal.PREVENTION], difficulty: ExerciseDifficulty.BEGINNER, durationSec: 45, instructions: ['Extend arm forward, palm down', 'Gently pull hand downward', 'Hold 20-30 seconds', 'Repeat on other hand'] },
    { name: 'Finger Tendon Glides', description: 'Improve tendon mobility and prevent trigger finger.', bodyRegions: [BodyPart.LEFT_WRIST_HAND, BodyPart.RIGHT_WRIST_HAND], jobCategories: [JobCategory.DESK, JobCategory.MANUFACTURING, JobCategory.RETAIL], goals: [ProgramGoal.FLEXIBILITY, ProgramGoal.PREVENTION], difficulty: ExerciseDifficulty.BEGINNER, durationSec: 60, instructions: ['Start with fingers straight', 'Curl into hook fist', 'Make full fist', 'Straighten', '10 reps each hand'] },
    // Knees
    { name: 'Terminal Knee Extension', description: 'Strengthen VMO to support knee tracking and reduce pain.', bodyRegions: [BodyPart.LEFT_KNEE, BodyPart.RIGHT_KNEE], jobCategories: [JobCategory.HEAVY_PHYSICAL, JobCategory.CONSTRUCTION, JobCategory.RETAIL], goals: [ProgramGoal.STRENGTHENING, ProgramGoal.RECOVERY], difficulty: ExerciseDifficulty.BEGINNER, durationSec: 60, instructions: ['Stand with band around back of knee', 'Slightly bend knee', 'Straighten against band resistance', 'Hold 2 seconds', '15 reps each leg'] },
    { name: 'Clamshell', description: 'Strengthen hip abductors to reduce knee valgus stress.', bodyRegions: [BodyPart.LEFT_KNEE, BodyPart.RIGHT_KNEE, BodyPart.LEFT_HIP, BodyPart.RIGHT_HIP], jobCategories: [JobCategory.HEAVY_PHYSICAL, JobCategory.HEALTHCARE, JobCategory.RETAIL], goals: [ProgramGoal.STRENGTHENING, ProgramGoal.PREVENTION], difficulty: ExerciseDifficulty.BEGINNER, durationSec: 60, instructions: ['Lie on side, hips at 45°, knees bent', 'Keep feet together', 'Lift top knee like clamshell', 'Hold 2 seconds', '15 reps per side'] },
    { name: 'Wall Sit', description: 'Build quad endurance for prolonged standing workers.', bodyRegions: [BodyPart.LEFT_KNEE, BodyPart.RIGHT_KNEE, BodyPart.LEFT_HIP, BodyPart.RIGHT_HIP], jobCategories: [JobCategory.RETAIL, JobCategory.MANUFACTURING, JobCategory.CONSTRUCTION], goals: [ProgramGoal.STRENGTHENING, ProgramGoal.CONDITIONING], difficulty: ExerciseDifficulty.INTERMEDIATE, durationSec: 45, instructions: ['Stand with back against wall', 'Slide down to 90° knee angle', 'Hold 30-45 seconds', 'Rest and repeat 3 times'] },
    // Hips
    { name: 'Hip Flexor Stretch (Kneeling)', description: 'Lengthen hip flexors shortened from prolonged sitting.', bodyRegions: [BodyPart.LEFT_HIP, BodyPart.RIGHT_HIP, BodyPart.LOWER_BACK], jobCategories: [JobCategory.DESK, JobCategory.DRIVING], goals: [ProgramGoal.FLEXIBILITY, ProgramGoal.PREVENTION], difficulty: ExerciseDifficulty.BEGINNER, durationSec: 60, instructions: ['Kneel on one knee', 'Front foot flat, shin vertical', 'Shift forward until hip stretch felt', 'Hold 30 seconds', 'Repeat other side'] },
    { name: 'Pigeon Pose', description: 'Deep stretch for piriformis and hip external rotators.', bodyRegions: [BodyPart.LEFT_HIP, BodyPart.RIGHT_HIP, BodyPart.LOWER_BACK], jobCategories: [JobCategory.DESK, JobCategory.DRIVING, JobCategory.HEAVY_PHYSICAL], goals: [ProgramGoal.FLEXIBILITY, ProgramGoal.RECOVERY], difficulty: ExerciseDifficulty.INTERMEDIATE, durationSec: 90, instructions: ['From all fours, bring one knee forward toward same-side wrist', 'Extend opposite leg behind', 'Fold forward gently', 'Hold 45-60 seconds each side'] },
    // Upper Back & Posture
    { name: 'Thoracic Extension Over Foam Roller', description: 'Restore thoracic mobility and counteract forward head posture.', bodyRegions: [BodyPart.UPPER_BACK, BodyPart.HEAD_NECK], jobCategories: [JobCategory.DESK, JobCategory.DRIVING, JobCategory.HEALTHCARE], goals: [ProgramGoal.FLEXIBILITY, ProgramGoal.PREVENTION], difficulty: ExerciseDifficulty.BEGINNER, durationSec: 90, instructions: ['Place foam roller horizontally under upper back', 'Support head with hands', 'Gently extend over roller', 'Move roller up/down thoracic spine', '5-10 extensions per level'] },
    { name: 'Wall Angel', description: 'Improve scapular mobility and thoracic posture.', bodyRegions: [BodyPart.UPPER_BACK, BodyPart.LEFT_SHOULDER, BodyPart.RIGHT_SHOULDER], jobCategories: [JobCategory.DESK, JobCategory.MANUFACTURING], goals: [ProgramGoal.FLEXIBILITY, ProgramGoal.PREVENTION], difficulty: ExerciseDifficulty.BEGINNER, durationSec: 60, instructions: ['Stand with back flat against wall', 'Arms at 90° against wall', 'Slowly raise arms overhead', 'Lower back to start', '10 reps slowly'] },
    { name: 'Prone I-Y-T Raises', description: 'Strengthen lower trapezius and scapular stabilizers.', bodyRegions: [BodyPart.UPPER_BACK, BodyPart.LEFT_SHOULDER, BodyPart.RIGHT_SHOULDER], jobCategories: [JobCategory.DESK, JobCategory.HEALTHCARE], goals: [ProgramGoal.STRENGTHENING], difficulty: ExerciseDifficulty.INTERMEDIATE, durationSec: 90, instructions: ['Lie face down on bench or floor', 'Raise arms in I shape, hold 2 sec', 'Move to Y shape, hold 2 sec', 'Move to T shape, hold 2 sec', '8 reps of each'] },
    // Ankles & Feet
    { name: 'Calf Raises', description: 'Strengthen calf complex for prolonged standing and walking.', bodyRegions: [BodyPart.LEFT_ANKLE_FOOT, BodyPart.RIGHT_ANKLE_FOOT], jobCategories: [JobCategory.RETAIL, JobCategory.MANUFACTURING, JobCategory.CONSTRUCTION], goals: [ProgramGoal.STRENGTHENING, ProgramGoal.PREVENTION], difficulty: ExerciseDifficulty.BEGINNER, durationSec: 60, instructions: ['Stand on edge of step with heels hanging', 'Rise up onto toes slowly', 'Lower heels below step level', 'Repeat 15-20 times'] },
    { name: 'Ankle Circles', description: 'Maintain ankle mobility for workers on their feet all day.', bodyRegions: [BodyPart.LEFT_ANKLE_FOOT, BodyPart.RIGHT_ANKLE_FOOT], jobCategories: [JobCategory.RETAIL, JobCategory.HEAVY_PHYSICAL, JobCategory.CONSTRUCTION], goals: [ProgramGoal.FLEXIBILITY, ProgramGoal.PREVENTION], difficulty: ExerciseDifficulty.BEGINNER, durationSec: 30, instructions: ['Sit or stand', 'Circle ankle clockwise 10 times', 'Circle counterclockwise 10 times', 'Repeat on other foot'] },
    // Full Body / Conditioning
    { name: 'Standing Hip Hinge', description: 'Teach proper lifting mechanics to prevent lumbar strain.', bodyRegions: [BodyPart.LOWER_BACK, BodyPart.LEFT_HIP, BodyPart.RIGHT_HIP], jobCategories: [JobCategory.HEAVY_PHYSICAL, JobCategory.MANUFACTURING, JobCategory.CONSTRUCTION], goals: [ProgramGoal.PREVENTION, ProgramGoal.STRENGTHENING], difficulty: ExerciseDifficulty.BEGINNER, durationSec: 60, instructions: ['Stand with feet hip-width apart', 'Push hips back, slight knee bend', 'Keep back flat, reach hands toward floor', 'Drive hips forward to stand', '15 reps'] },
    { name: 'Farmers Carry', description: 'Build grip, core, and full-body endurance for manual handlers.', bodyRegions: [BodyPart.LOWER_BACK, BodyPart.LEFT_WRIST_HAND, BodyPart.RIGHT_WRIST_HAND, BodyPart.LEFT_SHOULDER, BodyPart.RIGHT_SHOULDER], jobCategories: [JobCategory.HEAVY_PHYSICAL, JobCategory.MANUFACTURING, JobCategory.CONSTRUCTION], goals: [ProgramGoal.CONDITIONING, ProgramGoal.STRENGTHENING], difficulty: ExerciseDifficulty.INTERMEDIATE, durationSec: 45, instructions: ['Hold weights at sides', 'Walk 20-30 meters keeping tall posture', 'Brace core throughout', 'Rest and repeat 3-4 times'] },
    { name: 'Seated Spinal Twist', description: 'Mobility exercise for thoracic and lumbar rotation.', bodyRegions: [BodyPart.LOWER_BACK, BodyPart.UPPER_BACK], jobCategories: [JobCategory.DESK, JobCategory.DRIVING], goals: [ProgramGoal.FLEXIBILITY, ProgramGoal.PREVENTION], difficulty: ExerciseDifficulty.BEGINNER, durationSec: 60, instructions: ['Sit in chair or on floor', 'Cross arms over chest', 'Rotate torso left as far as comfortable', 'Hold 5 sec, return', '10 reps each direction'] },
    { name: 'Side-Lying Thoracic Rotation', description: 'Open-book stretch for thoracic spine mobility.', bodyRegions: [BodyPart.UPPER_BACK, BodyPart.CHEST], jobCategories: [JobCategory.DESK, JobCategory.HEALTHCARE, JobCategory.DRIVING], goals: [ProgramGoal.FLEXIBILITY, ProgramGoal.RECOVERY], difficulty: ExerciseDifficulty.BEGINNER, durationSec: 90, instructions: ['Lie on side, knees stacked at 90°', 'Place hands together in front', 'Open top arm toward ceiling', 'Let shoulder follow', 'Hold 3-5 sec', '10 reps per side'] },
    { name: 'Supine Hamstring Stretch', description: 'Lengthen hamstrings to reduce lumbar stress.', bodyRegions: [BodyPart.LOWER_BACK, BodyPart.LEFT_KNEE, BodyPart.RIGHT_KNEE], jobCategories: [JobCategory.HEAVY_PHYSICAL, JobCategory.DESK, JobCategory.DRIVING], goals: [ProgramGoal.FLEXIBILITY, ProgramGoal.PREVENTION], difficulty: ExerciseDifficulty.BEGINNER, durationSec: 60, instructions: ['Lie on back', 'Loop band or towel around one foot', 'Lift leg keeping knee straight', 'Hold 30 seconds', 'Repeat on other leg'] },
    { name: 'Standing Quad Stretch', description: 'Stretch quadriceps for workers with knee pain or prolonged standing.', bodyRegions: [BodyPart.LEFT_KNEE, BodyPart.RIGHT_KNEE, BodyPart.LEFT_HIP, BodyPart.RIGHT_HIP], jobCategories: [JobCategory.RETAIL, JobCategory.MANUFACTURING, JobCategory.CONSTRUCTION], goals: [ProgramGoal.FLEXIBILITY, ProgramGoal.PREVENTION], difficulty: ExerciseDifficulty.BEGINNER, durationSec: 45, instructions: ['Stand on one leg', 'Bend other knee, holding ankle behind', 'Keep knees together', 'Hold 30 seconds', 'Repeat on other side'] },
    { name: 'Chest Opener Stretch', description: 'Counter forward posture and open the chest and pec muscles.', bodyRegions: [BodyPart.CHEST, BodyPart.LEFT_SHOULDER, BodyPart.RIGHT_SHOULDER, BodyPart.UPPER_BACK], jobCategories: [JobCategory.DESK, JobCategory.DRIVING, JobCategory.MANUFACTURING], goals: [ProgramGoal.FLEXIBILITY, ProgramGoal.PREVENTION], difficulty: ExerciseDifficulty.BEGINNER, durationSec: 45, instructions: ['Stand in doorway', 'Place forearms on door frame at 90°', 'Step forward until stretch felt across chest', 'Hold 30 seconds', 'Repeat 3 times'] },
  ];

  for (const ex of exercises) {
    await prisma.exercise.upsert({
      where: { id: `ex-${ex.name.toLowerCase().replace(/\s+/g, '-')}` },
      update: {},
      create: {
        id: `ex-${ex.name.toLowerCase().replace(/\s+/g, '-')}`,
        name: ex.name,
        description: ex.description,
        bodyRegions: ex.bodyRegions,
        jobCategories: ex.jobCategories,
        goals: ex.goals,
        difficulty: ex.difficulty,
        durationSec: ex.durationSec,
        instructions: ex.instructions,
      },
    });
  }

  // ─── Starter Programs (templates) ─────────────────────────────────────────
  const lowerBackPrevProgram = await prisma.program.upsert({
    where: { id: 'prog-001' },
    update: {},
    create: {
      id: 'prog-001',
      name: 'Heavy Lifting — Lower Back Prevention',
      description: 'A 4-week program for workers in heavy physical roles to prevent lower back injuries through core strengthening and flexibility.',
      jobCategory: JobCategory.HEAVY_PHYSICAL,
      bodyRegions: [BodyPart.LOWER_BACK, BodyPart.LEFT_HIP, BodyPart.RIGHT_HIP],
      goal: ProgramGoal.PREVENTION,
      durationWeeks: 4,
      isTemplate: true,
      organizationId: null,
    },
  });

  const deskNeckProgram = await prisma.program.upsert({
    where: { id: 'prog-002' },
    update: {},
    create: {
      id: 'prog-002',
      name: 'Desk Worker — Neck & Upper Back Relief',
      description: 'Combat the effects of prolonged sitting with targeted stretches and strengthening for neck, shoulders, and upper back.',
      jobCategory: JobCategory.DESK,
      bodyRegions: [BodyPart.HEAD_NECK, BodyPart.UPPER_BACK, BodyPart.LEFT_SHOULDER, BodyPart.RIGHT_SHOULDER],
      goal: ProgramGoal.PREVENTION,
      durationWeeks: 4,
      isTemplate: true,
      organizationId: null,
    },
  });

  // Program exercises for lower back program
  const lbExercises = [
    { exerciseId: 'ex-cat-cow-stretch', order: 1, sets: 1, reps: 10, restSec: 30 },
    { exerciseId: 'ex-glute-bridge', order: 2, sets: 3, reps: 15, restSec: 60 },
    { exerciseId: 'ex-bird-dog', order: 3, sets: 3, reps: 10, restSec: 60 },
    { exerciseId: 'ex-standing-hip-hinge', order: 4, sets: 3, reps: 15, restSec: 60 },
    { exerciseId: 'ex-hip-flexor-stretch-(kneeling)', order: 5, sets: 2, durationSec: 30, restSec: 30 },
  ];

  for (const pe of lbExercises) {
    await prisma.programExercise.upsert({
      where: { programId_order: { programId: lowerBackPrevProgram.id, order: pe.order } },
      update: {},
      create: { programId: lowerBackPrevProgram.id, ...pe },
    });
  }

  // Program exercises for desk program
  const deskExercises = [
    { exerciseId: 'ex-chin-tucks', order: 1, sets: 1, reps: 10, restSec: 30 },
    { exerciseId: 'ex-neck-side-bend-stretch', order: 2, sets: 2, durationSec: 30, restSec: 30 },
    { exerciseId: 'ex-shoulder-rolls', order: 3, sets: 2, reps: 10, restSec: 30 },
    { exerciseId: 'ex-wall-angel', order: 4, sets: 3, reps: 10, restSec: 60 },
    { exerciseId: 'ex-chest-opener-stretch', order: 5, sets: 3, durationSec: 30, restSec: 30 },
  ];

  for (const pe of deskExercises) {
    await prisma.programExercise.upsert({
      where: { programId_order: { programId: deskNeckProgram.id, order: pe.order } },
      update: {},
      create: { programId: deskNeckProgram.id, ...pe },
    });
  }

  // Assign lower back program to demo worker
  await prisma.workerProgram.upsert({
    where: { id: 'wp-001' },
    update: {},
    create: {
      id: 'wp-001',
      userId: workerUser.id,
      programId: lowerBackPrevProgram.id,
      assignedById: therapistUser.id,
      status: 'ACTIVE',
    },
  });

  console.log('\n✅ Seed complete! Demo accounts:');
  console.log('  aryanrajendrasuthar@gmail.com / Aryan@53       (Company Admin)');
  console.log('  therapist@gmail.com           / Password123!  (Therapist)');
  console.log('  safety@gmail.com              / Password123!  (Safety Manager)');
  console.log('  hr@demo.worksafe.com          / Password123!  (HR Admin)');
  console.log('  worker@gmail.com              / Password123!  (Worker)');
  console.log(`\n  API: http://localhost:3001`);
  console.log(`  Swagger: http://localhost:3001/api/docs`);

  void adminUser; void therapistUser; void safetyUser; void hrUser; void deptOffice; void deptAssembly;
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
