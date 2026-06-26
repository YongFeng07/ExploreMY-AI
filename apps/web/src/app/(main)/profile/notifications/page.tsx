// @ts-nocheck
'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function NotificationsPage() {
  const [notifs, setNotifs] = useState<any[]>([]);
  useEffect(() => {
    fetch('/api/admin/notifications')
      .then(r => r.json()).then(d => setNotifs(d.data || []));
  }, []);
  return (
    <div className="min-h-dvh bg-white">
      <div className="px-5 pt-14 pb-6">
        <Link href="/profile" className="text-amber-600 text-[13px] font-semibold mb-3 block">← Back</Link>
        <h1 className="text-[28px] font-extrabold text-gray-800">🔔 Notifications</h1>
        <p className="text-[13px] text-gray-400 mt-1">{notifs.length} messages</p>
      </div>
      <div className="px-5 pb-24 space-y-2">
        {notifs.length === 0 && (
          <div className="text-center py-20"><span className="text-5xl block mb-4">🔔</span><p className="text-gray-800 font-extrabold">No notifications</p></div>
        )}
        {notifs.map((n: any, i: number) => (
          <div key={i} className={`p-4 rounded-xl ${n.read === false ? 'bg-amber-50 border border-amber-100' : 'bg-white border border-gray-100'}`}>
            <div className="flex items-start gap-3">
              <span className="text-2xl">{n.type === 'system' ? '🔔' : n.type === 'feature' ? '✨' : n.type === 'alert' ? '⚠️' : '📢'}</span>
              <div className="flex-1"><p className="text-[13px] font-extrabold text-gray-800">{n.title}</p><p className="text-[11px] text-gray-500">{n.message}</p><p className="text-[9px] text-gray-300 mt-1">{n.createdAt?.split('T')[0]}</p></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
