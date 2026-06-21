import { create } from 'zustand';
interface NotificationState { unreadCount: number; notifications: any[]; setUnreadCount: (c: number) => void; setNotifications: (n: any[]) => void; }
export const useNotificationStore = create<NotificationState>(set => ({ unreadCount: 0, notifications: [], setUnreadCount: c => set({ unreadCount: c }), setNotifications: n => set({ notifications: n }) }));
