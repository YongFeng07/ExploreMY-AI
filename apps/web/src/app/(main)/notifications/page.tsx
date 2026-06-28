// @ts-nocheck
'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Bell, Heart, UserPlus, Star, MapPin } from 'lucide-react';

export default function NotificationsPage() {
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : '';

  const load = () => {
    setLoading(true);
    try {
      // Generate notifications from localStorage activity
      const items: any[] = [];
      const trips = JSON.parse(localStorage.getItem('saved_trips') || '[]');
      const favs = JSON.parse(localStorage.getItem('favorites') || '[]');
      const reviews = JSON.parse(localStorage.getItem('profile_reviews') || '[]');
      const photos = JSON.parse(localStorage.getItem('profile_photos') || '[]');
      // Deterministic IDs — same across page loads for mark-read persistence
      trips.slice(-3).forEach((t: any, i: number) => { items.push({ id: 'trip_'+ (t.id||t.savedAt||'t'+i), type:'trip', message:'🧳 Trip saved: '+(t.title||t.destination||'Your trip'), body:'You saved a trip to '+(t.destination||'a destination'), createdAt: t.savedAt||new Date().toISOString(), isRead: false }); });
      favs.slice(-2).forEach((f: any, i: number) => { items.push({ id: 'fav_'+ (f.id||f.placeName||f.name||'f'+i), type:'like', message:'❤️ Added to favorites: '+(f.placeName||f.name||'A place'), createdAt: f.savedAt||new Date().toISOString(), isRead: true }); });
      if (reviews.length > 0) { items.push({ id: 'rev_count', type:'review', message:'⭐ You have written '+reviews.length+' review'+(reviews.length>1?'s':''), body:'Share your travel experiences', createdAt: new Date().toISOString(), isRead: false }); }
      if (photos.length > 0) { items.push({ id: 'photo_count', type:'photo', message:'📸 You have '+photos.length+' photo'+(photos.length>1?'s':'')+' in your gallery', body:'Your travel memories are growing', createdAt: new Date().toISOString(), isRead: false }); }
      // Read status from localStorage
      const readIds = JSON.parse(localStorage.getItem('notif_read') || '[]');
      items.forEach(n => { if (readIds.includes(n.id)) n.isRead = true; });
      items.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setList(items);
    } catch {}
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const markRead = (id: string) => {
    setList(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    try { const readIds = JSON.parse(localStorage.getItem('notif_read') || '[]'); readIds.push(id); localStorage.setItem('notif_read', JSON.stringify(readIds)); } catch {}
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
