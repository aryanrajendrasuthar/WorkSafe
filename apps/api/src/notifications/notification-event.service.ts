import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Subject, Observable } from 'rxjs';

export interface NotificationEvent {
  id: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  createdAt: Date;
}

@Injectable()
export class NotificationEventService implements OnModuleDestroy {
  private readonly streams = new Map<string, Subject<NotificationEvent>>();

  getStream(userId: string): Observable<NotificationEvent> {
    if (!this.streams.has(userId)) {
      this.streams.set(userId, new Subject<NotificationEvent>());
    }
    return this.streams.get(userId)!.asObservable();
  }

  emit(userId: string, event: NotificationEvent) {
    const subject = this.streams.get(userId);
    if (subject && !subject.closed) {
      subject.next(event);
    }
  }

  onModuleDestroy() {
    this.streams.forEach((subject) => subject.complete());
    this.streams.clear();
  }
}
