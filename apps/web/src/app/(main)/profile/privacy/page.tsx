// @ts-nocheck
'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Shield, Eye, Lock, Globe, Heart, Map, Camera, BookOpen, Search } from 'lucide-react';

export default function PrivacyCenter() {
  const [settings, setSettings] = useState<any>(null);
  const [saving, setSaving] = useState('');
  const PRIVACY_KEY = 'privacy_settings';

  useEffect(() => {
    // Load from localStorage (no backend API)
    try {
      const saved = JSON.parse(localStorage.getItem(PRIVACY_KEY) || '{}');
      setSettings({
        profileVisibility: 'public',
        allowSearch: true,
        showRecommendations: true,
        leaderboard: false,
        showMap: true,
        showStats: true,
        showDNA: true,
        albumPrivacy: 'followers',
        journalPrivacy: 'followers',
        showPartner: true,
        showCoupleMemories: true,
        showCoupleTrips: true,
        showCoupleWallet: true,
        ...saved,
      });
    } catch { setSettings({}); }
  }, []);

  const save = (key: string, value: any) => {
    setSaving(key);
    const updated = { ...(settings || {}), [key]: value } as any;
    setSettings(updated);
    localStorage.setItem(PRIVACY_KEY, JSON.stringify(updated));
    setTimeout(() => setSaving(''), 500);
  };

  if (!settings) return <div className="min-h-screen flex items-center justify-center"><div className="w-10 h-10 rounded-full border-2 border-gray-200 border-t-gray-500 animate-spin" /></div>;

  const Toggle = ({ label, desc, value, onChange }: any) => (
    <div className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
      <div className="flex-1 mr-4"><p className="text-[13px] font-semibold text-gray-800">{label}</p><p className="text-[10px] text-gray-400">{desc}</p></div>
      <button onClick={() => onChange(!value)} className={`w-12 h-7 rounded-full transition-colors relative ${value ? 'bg-emerald-500' : 'bg-gray-300'}`}>
        <div className={`w-5 h-5 rounded-full bg-white shadow absolute top-1 transition-transform ${value ? 'translate-x-6' : 'translate-x-1'}`} />
      </button>
    </div>
  );

  const SelectVisibility = ({ value, onChange }: any) => (
    <div className="space-y-1.5">
      {[{ v: 'public', l: '🌍 Public', d: 'Anyone can see' }, { v: 'followers', l: '👥 Followers', d: 'Only followers' }, { v: 'couple', l: '💑 Couple', d: 'Only partner' }, { v: 'private', l: '🔒 Private', d: 'Only you' }].map(o => (
        <button key={o.v} onClick={() => onChange(o.v)} className={`w-full text-left p-3 rounded-xl flex items-center gap-3 ${value === o.v ? 'bg-amber-50 border border-amber-200' : 'bg-gray-50'}`}>
          <span className="text-lg">{o.l.split(' ')[0]}</span><div><p className="text-[12px] font-bold">{o.l.split(' ').slice(1).join(' ')}</p><p className="text-[9px] text-gray-400">{o.d}</p></div>{value === o.v && <span className="ml-auto text-amber-500">✓</span>}
        </button>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FFFDF7]">
      <div className="px-5 pt-14 pb-4"><Link href="/profile" className="text-[#C4956A] text-[13px] font-semibold mb-2 block">← Back</Link><h1 className="text-[28px] font-extrabold text-[#3C2415]">🔒 Privacy Center</h1><p className="text-[13px] text-[#8B7355] mt-1">Control your visibility and data</p></div>

      <div className="px-5 pb-24 space-y-4">
        {/* Profile Visibility */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#E8D5C4]/50 p-5">
          <p className="text-[11px] font-bold text-[#8B7355] uppercase tracking-wider mb-3"><Eye className="h-3.5 w-3.5 inline mr-1" />Profile Visibility</p>
          <SelectVisibility value={settings.profileVisibility || 'public'} onChange={(v: string) => save('profileVisibility', v)} />
        </div>

        {/* Discoverability */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#E8D5C4]/50 p-5">
          <p className="text-[11px] font-bold text-[#8B7355] uppercase tracking-wider mb-3"><Search className="h-3.5 w-3.5 inline mr-1" />Discoverability</p>
          <Toggle label="Allow search by username" desc="People can find you by searching your name" value={settings.allowSearch !== false} onChange={(v: boolean) => save('allowSearch', v)} />
          <Toggle label="Appear in recommendations" desc="Show your profile to similar travelers" value={settings.showRecommendations !== false} onChange={(v: boolean) => save('showRecommendations', v)} />
          <Toggle label="Travel leaderboard" desc="Appear on public travel rankings" value={settings.leaderboard !== false} onChange={(v: boolean) => save('leaderboard', v)} />
        </div>

        {/* Travel Data */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#E8D5C4]/50 p-5">
          <p className="text-[11px] font-bold text-[#8B7355] uppercase tracking-wider mb-3"><Map className="h-3.5 w-3.5 inline mr-1" />Travel Data</p>
          <Toggle label="Show Travel Map" desc="Display visited cities" value={settings.showMap !== false} onChange={(v: boolean) => save('showMap', v)} />
          <Toggle label="Show Travel Statistics" desc="Display your stats" value={settings.showStats !== false} onChange={(v: boolean) => save('showStats', v)} />
          <Toggle label="Show Travel DNA" desc="Display your explorer profile" value={settings.showDNA !== false} onChange={(v: boolean) => save('showDNA', v)} />
        </div>

        {/* Albums & Journals */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#E8D5C4]/50 p-5">
          <p className="text-[11px] font-bold text-[#8B7355] uppercase tracking-wider mb-3"><Camera className="h-3.5 w-3.5 inline mr-1" />Albums & Journals</p>
          <p className="text-[12px] font-semibold text-[#3C2415] mb-1.5">Default Album Privacy</p>
          <SelectVisibility value={settings.albumPrivacy || 'followers'} onChange={(v: string) => save('albumPrivacy', v)} />
          <div className="my-3" />
          <p className="text-[12px] font-semibold text-[#3C2415] mb-1.5">Default Journal Privacy</p>
          <SelectVisibility value={settings.journalPrivacy || 'followers'} onChange={(v: string) => save('journalPrivacy', v)} />
        </div>

        {/* Couple */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#E8D5C4]/50 p-5">
          <p className="text-[11px] font-bold text-[#8B7355] uppercase tracking-wider mb-3"><Heart className="h-3.5 w-3.5 inline mr-1" />Couple Visibility</p>
          <Toggle label="Show Partner" desc="Display your linked partner" value={settings.showPartner !== false} onChange={(v: boolean) => save('showPartner', v)} />
          <Toggle label="Shared Memories" desc="Display couple memories" value={settings.showCoupleMemories !== false} onChange={(v: boolean) => save('showCoupleMemories', v)} />
          <Toggle label="Couple Trips" desc="Display shared trips" value={settings.showCoupleTrips !== false} onChange={(v: boolean) => save('showCoupleTrips', v)} />
          <Toggle label="Wallet Progress" desc="Show shared savings" value={settings.showCoupleWallet !== false} onChange={(v: boolean) => save('showCoupleWallet', v)} />
        </div>

        {/* Data & Account */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#E8D5C4]/50 p-5">
          <p className="text-[11px] font-bold text-[#8B7355] uppercase tracking-wider mb-3"><Shield className="h-3.5 w-3.5 inline mr-1" />Data & Account</p>
          <button onClick={() => {
            const data: any = {};
            ['saved_trips','favorites','profile_photos','profile_reviews','profile_albums','wishlist','wallet_goals','couple_data','privacy_settings'].forEach(k => { try { data[k] = JSON.parse(localStorage.getItem(k) || 'null'); } catch {} });
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a'); a.href = url; a.download = 'exploremy-data.json'; a.click();
            URL.revokeObjectURL(url);
          }} className="w-full text-left p-3 rounded-xl bg-blue-50 hover:bg-blue-100 transition-colors flex items-center gap-3">
            <span className="text-lg">📥</span><div><p className="text-[12px] font-bold text-blue-700">Export My Data</p><p className="text-[9px] text-blue-400">Download all your travel data as JSON</p></div>
          </button>
          <button onClick={() => {
            if (confirm('⚠️ This will permanently clear ALL local data. Continue?')) {
              localStorage.clear(); window.location.href = '/';
            }
          }} className="w-full text-left p-3 rounded-xl bg-red-50 hover:bg-red-100 transition-colors flex items-center gap-3 mt-2">
            <span className="text-lg">🗑️</span><div><p className="text-[12px] font-bold text-red-600">Clear All Data</p><p className="text-[9px] text-red-400">Permanently clear all local data</p></div>
          </button>
        </div>
      </div>
    </div>
  );
}
