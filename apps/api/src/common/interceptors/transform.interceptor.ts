import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { Response } from 'express';

export interface TransformResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  TransformResponse<T> | null
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<TransformResponse<T> | null> {
    const req = context.switchToHttp().getRequest<{ headers: Record<string, string> }>();
    const res = context.switchToHttp().getResponse<Response>();

    // EventSource always sends Accept: text/event-stream — pass through untouched
    if (req.headers['accept'] === 'text/event-stream') {
      return next.handle() as Observable<any>;
    }

    return next.handle().pipe(
      mergeMap((data) => {
        // Route already sent its own response (redirect, raw send) — emit null so
        // lastValueFrom() doesn't throw EmptyError; NestJS ignores the value for @Res() routes.
        if (res.headersSent) return of(null);

        return of({
          success: true,
          data: data?.data !== undefined ? data.data : data,
          message: data?.message,
        } as TransformResponse<T>);
      }),
    );
  }
}
