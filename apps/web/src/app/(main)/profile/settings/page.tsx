'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Bell, Shield, HelpCircle, ChevronRight } from 'lucide-react';
import { useAuth } from '@/stores/auth-store';
import { toast } from 'sonner';

export default function SettingsPage() {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.displayName || '');
      setEmail(user.email || '');
    }
  }, [user]);

  const save = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;
    try {
      await fetch('http://localhost:3001/api/v1/auth/me', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ displayName: name }),
      });
      setSaved(true); toast.success('Profile updated!');
      setTimeout(() => setSaved(false), 2000);
    } catch {}
  };

  return (
    <div className="min-h-dvh bg-white">
      <div className="px-5 pt-14 pb-6"><Link href="/profile" className="text-amber-600 text-[13px] font-semibold mb-3 block">← Back</Link><h1 className="text-[28px] font-extrabold text-gray-800">⚙️ Settings</h1></div>
      <div className="px-5 pb-24 space-y-4">
        <div className="bg-gray-50 rounded-2xl p-5 space-y-4">
          <div><label className="text-[11px] font-bold text-gray-500 uppercase mb-1 block">Display Name</label><input value={name} onChange={e => setName(e.target.value)} className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-[15px] font-bold text-gray-900 outline-none focus:border-amber-300" /></div>
          <div><label className="text-[11px] font-bold text-gray-500 uppercase mb-1 block">Email</label><input value={email} disabled className="w-full rounded-xl border border-gray-200 bg-gray-100 px-4 py-3 text-[15px] font-bold text-gray-500 outline-none cursor-not-allowed" /><p className="text-[9px] text-gray-400 mt-1">Email cannot be changed</p></div>
          <button onClick={save} className="w-full py-3 rounded-xl bg-amber-500 text-white font-extrabold">{saved ? '✅ Saved!' : 'Save Changes'}</button>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {[
            { e: '✏️', l: 'Edit Profile', href: '/profile/edit' },
            { e: '🔔', l: 'Notifications', href: '/profile/notifications' },
            { e: '🔒', l: 'Privacy & Security', href: '/profile/privacy' },
            { e: '❓', l: 'Help Center', href: '/profile/help' },
          ].map((s, i) => (
            <Link key={i} href={s.href} className="flex items-center gap-3 px-5 py-4 hover:bg-gray-50 border-b border-gray-50 last:border-0"><span className="text-xl">{s.e}</span><span className="text-[14px] font-semibold text-gray-700 flex-1">{s.l}</span><ChevronRight className="h-4 w-4 text-gray-300" /></Link>
          ))}
        </div>
      </div>
    </div>
  );
}
