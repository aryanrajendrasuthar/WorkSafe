import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PrismaService } from '../../prisma/prisma.service';

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

const RESOURCE_MAP: Record<string, string> = {
  incidents: 'INCIDENT',
  programs: 'PROGRAM',
  workers: 'WORKER',
  users: 'USER',
  departments: 'DEPARTMENT',
  checkins: 'CHECKIN',
  risk: 'RISK_ALERT',
};

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  constructor(private prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const method = req.method as string;

    if (!MUTATING_METHODS.has(method)) return next.handle();

    const user = req.user as { id?: string; organizationId?: string } | undefined;
    if (!user?.id || !user?.organizationId) return next.handle();

    const urlParts = req.url.split('/').filter(Boolean);
    const resourceType = RESOURCE_MAP[urlParts[0]] ?? urlParts[0]?.toUpperCase() ?? 'UNKNOWN';
    const action = `${method}:${req.url.split('?')[0]}`;

    return next.handle().pipe(
      tap(() => {
        this.prisma.auditLog
          .create({
            data: {
              userId: user.id!,
              organizationId: user.organizationId!,
              action,
              resourceType,
              ipAddress: req.ip ?? null,
              userAgent: req.headers?.['user-agent'] ?? null,
            },
          })
          .catch(() => {
            // audit log failure must never crash the main request
          });
      }),
    );
  }
}
