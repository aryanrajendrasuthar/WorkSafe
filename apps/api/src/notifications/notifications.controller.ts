import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Param,
  Query,
  Body,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
  Sse,
  MessageEvent,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Observable, map } from 'rxjs';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { JwtSseGuard } from '../auth/guards/jwt-sse.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { NotificationsService } from './notifications.service';
import { NotificationEventService } from './notification-event.service';
import { PushService } from './push.service';

@ApiTags('Notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(
    private svc: NotificationsService,
    private events: NotificationEventService,
    private push: PushService,
  ) {}

  @Get('stream')
  @UseGuards(JwtSseGuard)
  @Sse()
  @ApiOperation({ summary: 'SSE stream for real-time notifications (pass ?token=<accessToken>)' })
  stream(@Req() req: Request & { user: { id: string } }): Observable<MessageEvent> {
    const userId = req.user.id;
    return this.events.getStream(userId).pipe(
      map((event) => ({ data: event } as MessageEvent)),
    );
  }

  @Get('push/public-key')
  @ApiOperation({ summary: 'Get VAPID public key for push subscriptions' })
  getPublicKey() {
    return { publicKey: this.push.getVapidPublicKey() };
  }

  @Post('push/subscribe')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Subscribe to browser push notifications' })
  subscribePush(
    @CurrentUser() user: { id: string },
    @Body() body: { endpoint: string; keys: { p256dh: string; auth: string } },
  ) {
    return this.push.subscribe(user.id, body.endpoint, body.keys.p256dh, body.keys.auth);
  }

  @Delete('push/subscribe')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Unsubscribe from browser push notifications' })
  unsubscribePush(
    @CurrentUser() user: { id: string },
    @Body() body: { endpoint: string },
  ) {
    return this.push.unsubscribe(user.id, body.endpoint);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get notifications for current user (paginated)' })
  getAll(
    @CurrentUser() user: any,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(30), ParseIntPipe) limit: number,
  ) {
    return this.svc.getForUser(user.id, page, limit);
  }

  @Get('unread')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get unread notification count' })
  getUnread(@CurrentUser() user: any) {
    return this.svc.getUnreadCount(user.id);
  }

  @Patch('read-all')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark all notifications as read' })
  markAllRead(@CurrentUser() user: any) {
    return this.svc.markAllRead(user.id);
  }

  @Patch(':id/read')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark a notification as read' })
  markRead(@Param('id') id: string, @CurrentUser() user: any) {
    return this.svc.markRead(id, user.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a notification' })
  deleteOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.svc.delete(id, user.id);
  }
}
