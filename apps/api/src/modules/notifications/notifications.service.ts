import { Injectable } from '@nestjs/common';

export interface NotificationItem {
  id: string;
  type: 'SYSTEM' | 'FOLLOW' | 'LIKE' | 'COMMENT' | 'TRIP_INVITE' | 'ACHIEVEMENT' | 'PROMOTION' | 'REMINDER' | 'TRAVEL_ALERT';
  title: string;
  body: string;
  isRead: boolean;
  actionUrl?: string;
  fromUserId?: string;
  createdAt: string;
}

@Injectable()
export class NotificationsService {
  private notifications = new Map<string, NotificationItem[]>();

  private ensureUserNotifications(userId: string): void {
    if (!this.notifications.has(userId)) {
      this.notifications.set(userId, [
        {
          id: `welcome-${userId}`,
          type: 'SYSTEM',
          title: 'Welcome to ExploreMY! 🌟',
          body: 'Start discovering Malaysia. Plan your first trip or explore nearby hidden gems.',
          isRead: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: `onboarding-${userId}`,
          type: 'REMINDER',
          title: 'Complete Your Profile',
          body: 'Add a profile photo and set your travel preferences for better recommendations.',
          isRead: false,
          actionUrl: '/profile/edit',
          createdAt: new Date().toISOString(),
        },
      ]);
    }
  }

  getForUser(userId: string, page: number = 0, limit: number = 20) {
    this.ensureUserNotifications(userId);
    const userNotifs = this.notifications.get(userId)!;
    const sorted = [...userNotifs].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    const paged = sorted.slice(page * limit, (page + 1) * limit);
    return {
      data: paged,
      meta: {
        total: userNotifs.length,
        unread: userNotifs.filter((n) => !n.isRead).length,
        page,
        limit,
      },
    };
  }

  markAsRead(userId: string, notificationId: string) {
    const userNotifs = this.notifications.get(userId) || [];
    const notif = userNotifs.find((n) => n.id === notificationId);
    if (notif) notif.isRead = true;
    return { data: { acknowledged: !!notif } };
  }

  markAllAsRead(userId: string) {
    const userNotifs = this.notifications.get(userId) || [];
    userNotifs.forEach((n) => (n.isRead = true));
    return { data: { acknowledged: true, count: userNotifs.length } };
  }

  getUnreadCount(userId: string) {
    const userNotifs = this.notifications.get(userId) || [];
    return { data: { count: userNotifs.filter((n) => !n.isRead).length } };
  }

  /**
   * Send a real notification to a user.
   * In production, this would also push via WebSocket/FCM.
   */
  send(userId: string, data: {
    type: NotificationItem['type'];
    title: string;
    body: string;
    actionUrl?: string;
    fromUserId?: string;
  }): NotificationItem {
    this.ensureUserNotifications(userId);
    const notif: NotificationItem = {
      id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type: data.type,
      title: data.title,
      body: data.body,
      actionUrl: data.actionUrl,
      fromUserId: data.fromUserId,
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    this.notifications.get(userId)!.unshift(notif);
    return notif;
  }
}
