'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Bell, Heart, UserPlus, Star, MapPin } from 'lucide-react';

export default function NotificationsPage() {
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : '';

  const load = () => {
    if (!token) { setLoading(false); return; }
    fetch('http://localhost:3001/api/v1/auth/me/notifications', { headers: { 'Authorization': `Bearer ${token}` } })
      .then(r => r.json()).then(d => { setList(d.data || []); setLoading(false); }).catch(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const markRead = async (id: string) => {
    if (!token) return;
    await fetch(`http://localhost:3001/api/v1/auth/me/notifications/${id}/read`, { method: 'PATCH', headers: { 'Authorization': `Bearer ${token}` } });
    setList(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const markAllRead = () => {
    list.forEach(n => { if (!n.isRead) markRead(n.id); });
  };

  const timeAgo = (dateStr: string) => {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString('en-MY', { month: 'short', day: 'numeric' });
  };

  const unread = list.filter(n => !n.isRead).length;

  return (
    <div className="min-h-screen bg-[#FFFDF7]">
      <div className="px-5 pt-14 pb-4 flex items-center justify-between">
        <div>
          <Link href="/profile" className="text-[#C4956A] text-[13px] font-semibold mb-1 block">← Back</Link>
          <h1 className="text-[28px] font-extrabold text-[#3C2415] flex items-center gap-2">
            Notifications
            {unread > 0 && <span className="text-[13px] font-bold bg-red-500 text-white rounded-full px-2.5 py-0.5">{unread} new</span>}
          </h1>
        </div>
        {unread > 0 && (
          <button onClick={markAllRead} className="text-[13px] font-semibold text-[#C4956A]">Mark all read</button>
        )}
      </div>

      <div className="px-5 pb-24 space-y-1">
        {loading && <div className="text-center py-10"><div className="w-8 h-8 rounded-full border-2 border-[#C4956A]/20 border-t-[#C4956A] animate-spin mx-auto" /></div>}

        {!loading && list.length === 0 && (
          <div className="text-center py-16">
            <Bell className="h-12 w-12 mx-auto text-[#D4C4B0] mb-3" />
            <p className="text-[#3C2415] font-extrabold text-lg">No notifications yet</p>
            <p className="text-[#8B7355] text-sm mt-1">When someone follows you or likes your content, it'll appear here</p>
          </div>
        )}

        {list.map((n: any) => {
          const icon = n.type === 'follow' ? <UserPlus className="h-4 w-4 text-blue-500" /> :
                       n.type === 'like' ? <Heart className="h-4 w-4 text-red-400" fill="currentColor" /> :
                       <Bell className="h-4 w-4 text-[#C4956A]" />;
          return (
            <div key={n.id} onClick={() => markRead(n.id)}
              className={`flex items-start gap-3 p-4 rounded-2xl transition-all cursor-pointer ${
                n.isRead ? 'bg-white' : 'bg-[#FDF0E0]/50 border-l-3 border-l-[#C4956A]'
              }`}>
              <div className="w-10 h-10 rounded-full bg-[#F5EDE3] flex items-center justify-center flex-shrink-0">{icon}</div>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-semibold text-[#3C2415]">{n.message || n.body}</p>
                <p className="text-[12px] text-[#8B7355] mt-0.5">{timeAgo(n.createdAt || n.date)}</p>
              </div>
              {!n.isRead && <div className="w-2.5 h-2.5 rounded-full bg-[#C4956A] flex-shrink-0 mt-1.5" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
