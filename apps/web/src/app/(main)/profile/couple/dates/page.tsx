// @ts-nocheck
'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Heart, Sparkles, MapPin, Calendar, ChevronRight, ArrowLeft, Plus } from 'lucide-react';

export default function CoupleDatesPage() {
  const router = useRouter();
  const [dates, setDates] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'planned' | 'history'>('planned');
  const token = typeof window !== 'undefined' ? '' : '';
  const uid = typeof window !== 'undefined' ? '' || '' : '';

  const load = async () => {
    setLoading(true);
    const headers: any = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    try {
      const r = await fetch(`/api/auth/me/trips?userId=${uid}`, { headers });
      const d = await r.json();
      const all = (d.data || []);
      // Filter: date plans (from /date) AND couple weekend plans
      const coupleTrips = all.filter((t: any) => {
        const pd = t.planData || {};
        const fp = pd.fullPlan;
        // Top-level groupType (set by save)
        if (pd.groupType === 'COUPLE' || pd.walletType === 'COUPLE') return true;
        // FullPlan groupType (from weekend planner)
        if (fp?.groupType === 'COUPLE' || fp?.walletType === 'COUPLE') return true;
        // Date planner: has city + activities (always couple)
        if (fp?.city && fp?.activities) return true;
        // Keywords fallback
        const title = (t.title || '').toLowerCase();
        if (title.includes('date') || title.includes('couple') || title.includes('romantic') || title.includes('💕')) return true;
        return false;
      });
      setDates(coupleTrips.filter((t: any) => !t.completed));
      setHistory(coupleTrips.filter((t: any) => t.completed));
    } catch {}
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const openTrip = (t: any) => {
    const fp = t.planData?.fullPlan;
    if (fp) {
      sessionStorage.setItem('savedPlan', JSON.stringify(fp));
      // Date planner: has city + activities
      if (fp.city && fp.activities && !fp.destination) {
        router.push('/date?view=saved');
      } else {
        router.push('/weekend-planner?view=saved');
      }
    }
  };

  const displayDates = tab === 'planned' ? dates : history;

  return (
    <div className="min-h-screen bg-[#FFFDF7]">
      <div className="px-5 pt-14 pb-4">
        <Link href="/profile/couple" className="text-[#C4956A] text-[13px] font-semibold mb-3 block">← Couple Space</Link>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-[28px] font-extrabold text-[#3C2415]">💕 Our Dates</h1>
            <p className="text-[13px] text-[#8B7355] mt-1">{dates.length} planned · {history.length} completed</p>
          </div>
          <Link href="/date" className="w-11 h-11 rounded-full bg-[#C4956A] text-white flex items-center justify-center shadow-md"><Plus className="h-5 w-5" /></Link>
        </div>

        <div className="flex gap-2 mb-4">
          {[{ v: 'planned' as const, l: `📋 Planned (${dates.length})` }, { v: 'history' as const, l: `✅ History (${history.length})` }].map(t => (
            <button key={t.v} onClick={() => setTab(t.v)} className={`px-5 py-2.5 rounded-full text-[13px] font-bold transition-all ${tab === t.v ? 'bg-[#C4956A] text-white shadow-md' : 'bg-white text-[#8B7355] border border-[#E8D5C4]'}`}>{t.l}</button>
          ))}
        </div>
      </div>

      <div className="px-5 pb-24 space-y-3">
        {loading && <div className="text-center py-10"><div className="w-10 h-10 rounded-full border-2 border-[#C4956A]/20 border-t-[#C4956A] animate-spin mx-auto" /></div>}
        {!loading && displayDates.length === 0 && (
          <div className="text-center py-16">
            <span className="text-5xl block mb-4">{tab === 'planned' ? '💕' : '📖'}</span>
            <p className="text-[#3C2415] font-extrabold text-lg">{tab === 'planned' ? 'No planned dates' : 'No date history'}</p>
            <p className="text-[#8B7355] text-sm mt-1">{tab === 'planned' ? 'Plan your first date together!' : 'Complete a date to see it here'}</p>
            {tab === 'planned' && <Link href="/date" className="inline-block mt-4 px-6 py-2.5 bg-[#C4956A] text-white rounded-xl font-bold text-sm">Plan a Date</Link>}
          </div>
        )}
        {displayDates.map((d: any) => (
          <div key={d.id} className="bg-white rounded-2xl p-5 shadow-sm border border-[#E8D5C4]/50 hover:shadow-md transition-all">
            <div onClick={() => openTrip(d)} className="cursor-pointer">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{d.completed ? '✅' : '💕'}</span>
                  <div>
                    <p className="text-[14px] font-extrabold text-[#3C2415]">{d.title}</p>
                    <p className="text-[10px] text-[#8B7355] flex items-center gap-1"><MapPin className="h-3 w-3" />{d.destination} · <Calendar className="h-3 w-3" />{d.savedAt?.split('T')[0] || 'Planned'}</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-[#D4C4B0]" />
              </div>
              <div className="flex gap-2 mt-2">
                <span className="text-[10px] font-bold bg-[#FDF0E0] text-[#C4956A] rounded-full px-2 py-0.5">RM {d.totalCost?.toLocaleString() || '?'}</span>
                <span className="text-[10px] font-bold bg-[#F5EDE3] text-[#8B7355] rounded-full px-2 py-0.5">{d.days || 1}d</span>
                {d.planData?.fullPlan?.city && <span className="text-[10px] font-bold bg-pink-50 text-pink-500 rounded-full px-2 py-0.5">💕 Date</span>}
              </div>
            </div>
            {!d.completed && (
              <button onClick={async (e) => { e.stopPropagation();
                await fetch(`/api/auth/me/trips/${d.id}/complete?userId=${uid}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ completed: true, userId: uid }) });
                load();
              }} className="w-full mt-3 py-2 rounded-xl bg-emerald-50 text-emerald-600 text-[13px] font-bold hover:bg-emerald-100 transition-colors">
                ✅ Mark as Completed
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
