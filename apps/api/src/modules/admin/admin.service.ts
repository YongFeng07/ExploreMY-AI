import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

const DB_PATH = path.join(process.cwd(), 'exploremy-data.json');

function loadNotifications(): any[] {
  try {
    if (fs.existsSync(DB_PATH)) {
      const data = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
      return data.notifications || [];
    }
  } catch {}
  return [
    { id: 'n1', title: 'Welcome to ExploreMY!', message: 'Start planning your first trip today.', type: 'system', createdAt: '2026-06-01', targetEmail: 'all' },
  ];
}

function saveNotifications(notifications: any[]) {
  try {
    const existing = fs.existsSync(DB_PATH) ? JSON.parse(fs.readFileSync(DB_PATH, 'utf-8')) : {};
    existing.notifications = notifications;
    fs.writeFileSync(DB_PATH, JSON.stringify(existing, null, 2));
  } catch {}
}

let notifications = loadNotifications();

function getUsers(): any[] {
  return (global as any).__authUsers || [];
}

@Injectable()
export class AdminService {
  isAdminByRole(role: string): boolean {
    return role === 'ADMIN';
  }

  isAdmin(email: string): boolean {
    return email === 'yongfeng3318@gmail.com';
  }

  getNotifications(userId?: string, userEmail?: string) {
    // Filter notifications for the user
    if (!userId && !userEmail) return notifications;
    return notifications.filter(n => {
      if (!n.targetEmail || n.targetEmail === 'all') return true;
      // Check if this notification is for this specific user
      const users = getUsers();
      const user = users.find((u: any) => u.id === userId || u.email === userEmail);
      if (!user) return n.targetEmail === 'all';
      return n.targetEmail === 'all' || n.targetEmail === user.email || n.targetEmail === user.id;
    });
  }

  addNotification(data: { title: string; message: string; type: string; targetEmail: string }) {
    const n = {
      id: `n${Date.now()}`,
      title: data.title,
      message: data.message,
      type: data.type || 'system',
      targetEmail: data.targetEmail || 'all',
      createdAt: new Date().toISOString(),
    };
    notifications.unshift(n);
    saveNotifications(notifications);
    return n;
  }

  deleteNotification(id: string) {
    const idx = notifications.findIndex(n => n.id === id);
    if (idx >= 0) notifications.splice(idx, 1);
    saveNotifications(notifications);
    return { removed: idx >= 0 };
  }

  searchUsers(query: string) {
    const users = getUsers();
    if (!query) return users.slice(0, 20);
    const q = query.toLowerCase();
    return users.filter((u: any) =>
      u.displayName?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q)
    ).slice(0, 20);
  }

  getAllUsers() {
    return getUsers().slice(0, 50);
  }
}
