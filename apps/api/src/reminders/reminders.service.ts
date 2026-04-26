import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Queue, Worker, Job } from 'bullmq';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

const CHECKIN_QUEUE = 'checkin-reminders';
const SESSION_QUEUE = 'session-reminders';

@Injectable()
export class RemindersService implements OnModuleInit {
  private readonly logger = new Logger(RemindersService.name);
  private checkinQueue: Queue;
  private sessionQueue: Queue;

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  onModuleInit() {
    const connection = { url: this.config.get<string>('REDIS_URL', 'redis://localhost:6379') };

    this.checkinQueue = new Queue(CHECKIN_QUEUE, { connection });
    this.sessionQueue = new Queue(SESSION_QUEUE, { connection });

    this.startWorkers(connection);
    this.scheduleJobs();
  }

  private startWorkers(connection: { url: string }) {
    new Worker(
      CHECKIN_QUEUE,
      async (_job: Job) => this.sendCheckinReminders(),
      { connection },
    );

    new Worker(
      SESSION_QUEUE,
      async (_job: Job) => this.sendSessionReminders(),
      { connection },
    );
  }

  private async scheduleJobs() {
    // Daily check-in reminder at 8 AM — repeating cron job
    const existing = await this.checkinQueue.getRepeatableJobs();
    if (!existing.find((j) => j.name === 'daily-checkin')) {
      await this.checkinQueue.add(
        'daily-checkin',
        {},
        { repeat: { pattern: '0 8 * * *' } },
      );
      this.logger.log('Scheduled daily check-in reminder job (8 AM)');
    }

    // Session reminder every 3 days
    const existingSession = await this.sessionQueue.getRepeatableJobs();
    if (!existingSession.find((j) => j.name === 'session-reminder')) {
      await this.sessionQueue.add(
        'session-reminder',
        {},
        { repeat: { pattern: '0 9 */3 * *' } },
      );
      this.logger.log('Scheduled session reminder job (every 3 days)');
    }
  }

  private async sendCheckinReminders() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Workers with active programs who haven't checked in today
    const workers = await this.prisma.user.findMany({
      where: {
        role: 'WORKER',
        isActive: true,
        workerPrograms: { some: { status: 'ACTIVE' } },
        checkIns: { none: { date: { gte: today } } },
      },
      select: { id: true },
    });

    this.logger.log(`Sending check-in reminders to ${workers.length} workers`);

    for (const w of workers) {
      await this.notifications.create({
        userId: w.id,
        type: 'CHECKIN_REMINDER',
        title: 'Daily check-in reminder',
        message: "Don't forget your daily check-in — it only takes 60 seconds!",
      }).catch(() => {});
    }
  }

  private async sendSessionReminders() {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    // Workers with active programs who haven't done a session in 3 days
    const workerPrograms = await this.prisma.workerProgram.findMany({
      where: {
        status: 'ACTIVE',
        OR: [
          { sessionLogs: { none: {} } },
          { sessionLogs: { every: { date: { lt: threeDaysAgo } } } },
        ],
      },
      select: { userId: true, program: { select: { name: true } } },
      distinct: ['userId'],
    });

    this.logger.log(`Sending session reminders to ${workerPrograms.length} workers`);

    for (const wp of workerPrograms) {
      await this.notifications.create({
        userId: wp.userId,
        type: 'EXERCISE_REMINDER',
        title: 'Time for your exercise session',
        message: `Your program "${wp.program.name}" is waiting — keep your streak going!`,
        metadata: { programName: wp.program.name },
      }).catch(() => {});
    }
  }

  // Manual trigger for testing
  async triggerCheckinReminders() {
    await this.checkinQueue.add('manual-checkin', {});
  }

  async triggerSessionReminders() {
    await this.sessionQueue.add('manual-session', {});
  }
}
