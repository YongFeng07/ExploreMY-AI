import { Controller, Get, Post, Param, Headers } from '@nestjs/common';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  getForUser(@Headers('x-user-id') userId?: string) {
    return this.notificationsService.getForUser(userId || 'demo');
  }

  @Post(':id/read')
  markAsRead(@Param('id') id: string, @Headers('x-user-id') userId?: string) {
    return this.notificationsService.markAsRead(userId || 'demo', id);
  }

  @Get('unread-count')
  getUnreadCount(@Headers('x-user-id') userId?: string) {
    return this.notificationsService.getUnreadCount(userId || 'demo');
  }
}
