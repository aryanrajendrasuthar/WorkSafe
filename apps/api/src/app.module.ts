import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuditLogInterceptor } from './common/interceptors/audit-log.interceptor';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { WorkersModule } from './workers/workers.module';
import { CheckinsModule } from './checkins/checkins.module';
import { ExercisesModule } from './exercises/exercises.module';
import { ProgramsModule } from './programs/programs.module';
import { TherapistModule } from './therapist/therapist.module';
import { IncidentsModule } from './incidents/incidents.module';
import { RiskModule } from './risk/risk.module';
import { HrModule } from './hr/hr.module';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    PrismaModule,
    AuthModule,
    UsersModule,
    WorkersModule,
    CheckinsModule,
    ExercisesModule,
    ProgramsModule,
    TherapistModule,
    IncidentsModule,
    RiskModule,
    HrModule,
    NotificationsModule,
  ],
  providers: [{ provide: APP_INTERCEPTOR, useClass: AuditLogInterceptor }],
})
export class AppModule {}
