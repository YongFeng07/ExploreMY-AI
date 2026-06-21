'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Bell, Shield, CreditCard, ChevronRight, Settings2 } from 'lucide-react';

export default function SettingsPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;
    fetch('http://localhost:3001/api/v1/auth/me', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => {
        const role = d.data?.role || d.role;
        const email = d.data?.email || d.email;
        setIsAdmin(role === 'ADMIN' || email === 'yongfeng3318@gmail.com');
      }).catch(() => {});
  }, []);

  const items = [
    { href: '/settings/notifications', icon: Bell, label: 'Notifications', desc: 'Push and email preferences' },
    { href: '/settings/privacy', icon: Shield, label: 'Privacy', desc: 'Location sharing, data controls' },
    { href: '/settings/subscription', icon: CreditCard, label: 'Subscription', desc: 'Free · Upgrade to PRO' },
    ...(isAdmin ? [{ href: '/admin', icon: Settings2, label: 'Admin Panel', desc: 'Manage users, notifications, system' }] : []),
  ];
  return (
    <div className="min-h-dvh bg-[#FAFAF8] px-5 pt-16 pb-24">
      <h1 className="text-2xl font-extrabold text-[#1A1A1A] mb-6">Settings</h1>
      <div className="space-y-3">
        {items.map(i => (
          <Link key={i.href} href={i.href} className="card-travel p-4 flex items-center gap-3 hover:border-[#E87722]/30 transition-colors">
            <i.icon className="h-5 w-5 text-[#E87722]" />
            <div className="flex-1"><p className="text-sm font-bold text-[#1A1A1A]">{i.label}</p><p className="text-xs text-[#9CA3AF]">{i.desc}</p></div>
            <ChevronRight className="h-4 w-4 text-[#9CA3AF]" />
          </Link>
        ))}
      </div>
    </div>
  );
}
