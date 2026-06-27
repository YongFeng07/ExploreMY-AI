// @ts-nocheck
'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Heart, Sparkles, MapPin, Calendar, ChevronRight, ArrowLeft, Plus, X, Clock, Star, Navigation, CheckCircle2, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function CoupleDatesPage() {
  const router = useRouter();
  const [dates, setDates] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'planned' | 'history'>('planned');
  const [detail, setDetail] = useState<any>(null);
  const [dayIdx, setDayIdx] = useState(0);

  const load = () => {
    setLoading(true);
    try {
      const all: any[] = JSON.parse(localStorage.getItem('saved_trips') || '[]');
      const coupleTrips = all.filter((t: any) =>
        t.groupType === 'COUPLE' || t.walletType === 'COUPLE' || t.type === 'date' ||
        t.fullPlan?.groupType === 'COUPLE' || t.fullPlan?.walletType === 'COUPLE'
      );
      setDates(coupleTrips.filter((t: any) => !t.completed));
      setHistory(coupleTrips.filter((t: any) => t.completed));
    } catch {}
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const markComplete = (d: any) => {
    const all = JSON.parse(localStorage.getItem('saved_trips') || '[]');
    const updated = all.map((t: any) => t.id === d.id || t.savedAt === d.savedAt ? { ...t, completed: !t.completed, completedAt: !t.completed ? new Date().toISOString() : null } : t);
    localStorage.setItem('saved_trips', JSON.stringify(updated));
    load();
    toast.success(d.completed ? 'Moved back to planned' : '✅ Marked as complete!');
  };

  const openTrip = (d: any) => setDetail(d);

  const allDates = [...dates, ...history];
  const totalCost = allDates.reduce((s: number, d: any) => s + (d.totalCost || 0), 0);
  const dateTypes = new Set(allDates.map((d: any) => d.fullPlan?.dateType || d.type).filter(Boolean));

  const displayDates = tab === 'planned' ? dates : history;

  /* ── DATE DETAIL SHEET ── */
  if (detail) {
    const fp = detail.fullPlan || detail.planData?.fullPlan || detail;
    let days = fp.planDays || fp.days || [];
    if (days.length === 0 && fp.activities?.length > 0) {
      days = [{ dayNumber: 1, theme: fp.dateType || 'Date', stops: fp.activities, date: detail.startDate || detail.date || '' }];
    }
    if (days.length === 0 && detail.planStops) {
      const grouped: any = {};
      (detail.planStops || []).forEach((s: any) => { const d = s.day || 1; if (!grouped[d]) grouped[d] = []; grouped[d].push(s); });
      days = Object.entries(grouped).map(([d, st]: any) => ({ dayNumber: parseInt(d), theme: `Day ${d}`, stops: st }));
    }
    const day = days[dayIdx] || days[0];
    const dest = fp.destination || fp.city || detail.destination || '';
    const totalStops = days.reduce((s: number, d: any) => s + (d.stops?.length || 0), 0);
    const photoUrl = day?.stops?.[0]?.photoUrl || fp.photoUrl;

    return (
      <div className="fixed inset-0 z-[9998] bg-[#FAFAF8] overflow-y-auto">
        <div className="bg-gradient-to-br from-pink-500 via-rose-500 to-pink-600 px-5 pt-14 pb-6 text-white">
          <button onClick={() => setDetail(null)} className="text-white/70 text-[13px] font-semibold mb-3 flex items-center gap-1"><ArrowLeft className="h-3.5 w-3.5" /> Back</button>
          <h1 className="text-[24px] font-extrabold leading-[1.15]">{detail.title}</h1>
          <div className="flex items-center gap-3 text-[13px] text-white/70 mt-1.5">
            {dest && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{dest}</span>}
            <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{detail.startDate || detail.date || new Date(detail.savedAt).toLocaleDateString()}</span>
          </div>
          <div className="flex gap-2 mt-3 flex-wrap">
            <span className="bg-white/20 rounded-full px-3.5 py-1.5 text-xs font-extrabold">RM {Math.round(detail.totalCost || fp.totalCost || 0)}</span>
            <span className="bg-white/20 rounded-full px-3.5 py-1.5 text-xs font-semibold">{totalStops} stops</span>
            {detail.completed && <span className="bg-green-400/30 rounded-full px-3.5 py-1.5 text-xs font-bold">✅ Done</span>}
          </div>
        </div>

        {days.length > 1 && (
          <div className="sticky top-0 z-10 bg-[#FAFAF8]/90 backdrop-blur-xl border-b border-[#E5E7EB] px-5 py-2 flex gap-2 overflow-x-auto">
            {days.map((d: any, i: number) => (
              <button key={i} onClick={() => setDayIdx(i)}
                className={cn('flex-shrink-0 rounded-full px-4 py-2 text-[12px] font-bold transition-all',
                  dayIdx === i ? 'bg-pink-500 text-white shadow-md' : 'bg-white text-[#5C4A3A] border border-[#E5E7EB]')}>
                Day {d.dayNumber || i + 1}
              </button>
            ))}
          </div>
        )}

        <div className="px-5 pt-4 pb-24">
          {day ? (
            <div>
              <h3 className="text-[16px] font-extrabold text-[#1A1A1A] mb-4">{day.theme || 'Date Plan'}</h3>
              <div className="relative">
                <div className="absolute left-[18px] top-2 bottom-2 w-0.5 bg-[#E5E7EB]" />
                {day.stops?.map((s: any, idx: number) => (
                  <div key={idx} className="relative flex gap-4 mb-4">
                    <div className={cn('relative z-10 w-9 h-9 rounded-full flex items-center justify-center text-white text-[11px] font-extrabold shadow-md flex-shrink-0',
                      s.isHiddenGem ? 'bg-purple-500 ring-4 ring-purple-100' : 'bg-pink-500 ring-4 ring-pink-100')}>
                      {idx + 1}
                    </div>
                    <div className="flex-1 bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden">
                      {s.photoUrl ? <div className="h-44 overflow-hidden"><img src={s.photoUrl} className="w-full h-full object-cover" alt="" /></div>
                        : <div className="h-24 bg-gradient-to-br from-pink-50 to-rose-50 flex items-center justify-center text-4xl">{s.emoji || '💕'}</div>}
                      <div className="p-3">
                        <h4 className="text-[14px] font-extrabold text-[#0E0E0E]">{s.placeName || s.name || s.title}</h4>
                        <p className="text-[11px] text-[#6B7280] line-clamp-2 mb-1">{s.description}</p>
                        <div className="flex items-center gap-2 text-[10px] text-[#9CA3AF]">
                          <span><Clock className="h-3 w-3 inline" /> {s.time || '?'}</span>
                          <span>{s.duration || '?'}</span>
                          <span className="font-bold text-pink-500">RM {s.estimatedSpend || s.cost || 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : <div className="text-center py-10"><p className="text-[#8B7355]">No itinerary details</p></div>}

          {/* Cost Breakdown */}
          {detail.budgetBreakdown && (
            <div className="mt-6 bg-white rounded-2xl p-4 shadow-sm border border-[#E5E7EB]">
              <p className="text-[10px] font-bold text-[#8B7355] uppercase tracking-wider mb-3">💰 Cost Breakdown</p>
              <div className="space-y-2">
                {detail.budgetBreakdown.food && <div className="flex justify-between text-[12px]"><span>🍜 Food</span><span className="font-bold">RM {Math.round(detail.budgetBreakdown.food.estimatedCost || detail.budgetBreakdown.food || 0)}</span></div>}
                {detail.budgetBreakdown.transport && <div className="flex justify-between text-[12px]"><span>🚕 Transport</span><span className="font-bold">RM {Math.round(detail.budgetBreakdown.transport.estimatedCost || detail.budgetBreakdown.transport || 0)}</span></div>}
                {detail.budgetBreakdown.activities && <div className="flex justify-between text-[12px]"><span>🎫 Activities</span><span className="font-bold">RM {Math.round(detail.budgetBreakdown.activities.estimatedCost || detail.budgetBreakdown.activities || 0)}</span></div>}
                <hr className="border-[#E5E7EB]" />
                <div className="flex justify-between text-[14px]"><span className="font-extrabold">Total</span><span className="font-extrabold text-pink-500">RM {Math.round(detail.totalCost || 0)}</span></div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="mt-4 space-y-2">
            <a href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(dest)}`} target="_blank"
              className="block w-full py-3 rounded-xl bg-pink-500 text-white text-[13px] font-extrabold text-center"><Navigation className="h-4 w-4 inline mr-1" /> Navigate to {dest || 'Destination'}</a>
            <button onClick={() => { markComplete(detail); setDetail((p: any) => ({ ...p, completed: !p.completed })); }}
              className={cn('w-full py-3 rounded-xl text-[13px] font-extrabold',
                detail.completed ? 'bg-green-50 text-green-600' : 'bg-white border-2 border-green-200 text-green-600')}>
              {detail.completed ? <><CheckCircle2 className="h-4 w-4 inline mr-1" /> Completed ✓</> : <><Circle className="h-4 w-4 inline mr-1" /> Mark as Complete</>}
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── DATE LIST ── */
  return (
    <div className="min-h-screen bg-[#FFFDF7]">
      <div className="px-5 pt-14 pb-4">
        <Link href="/profile/couple" className="text-[#C4956A] text-[13px] font-semibold mb-3 block">← Couple Space</Link>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-[28px] font-extrabold text-[#3C2415]">💕 Our Dates</h1>
            <p className="text-[13px] text-[#8B7355] mt-1">{dates.length} planned · {history.length} completed</p>
          </div>
          <Link href="/date" className="w-11 h-11 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 text-white flex items-center justify-center shadow-md shadow-pink-200"><Plus className="h-5 w-5" /></Link>
        </div>

        {/* Stats Bar */}
        {allDates.length > 0 && (
          <div className="grid grid-cols-3 gap-2 mb-4">
            {[
              { v: allDates.length, l: 'Total Dates', e: '💕' },
              { v: `RM ${totalCost.toLocaleString()}`, l: 'Total Spent', e: '💰' },
              { v: dateTypes.size || allDates.length, l: 'Date Types', e: '🎯' },
            ].map(s => (
              <div key={s.l} className="bg-white rounded-xl p-3 shadow-sm border border-[#E8D5C4]/50 text-center">
                <span className="text-lg">{s.e}</span>
                <p className="text-[18px] font-extrabold text-[#3C2415]">{s.v}</p>
                <p className="text-[9px] text-[#8B7355] uppercase">{s.l}</p>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2 mb-4">
          {[{ v: 'planned' as const, l: `📋 Planned (${dates.length})` }, { v: 'history' as const, l: `✅ History (${history.length})` }].map(t => (
            <button key={t.v} onClick={() => setTab(t.v)}
              className={cn('px-5 py-2.5 rounded-full text-[13px] font-bold transition-all',
                tab === t.v ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md shadow-pink-200' : 'bg-white text-[#8B7355] border border-[#E8D5C4]')}>
              {t.l}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 pb-24 space-y-3">
        {loading && <div className="text-center py-10"><div className="w-10 h-10 rounded-full border-2 border-pink-200 border-t-pink-500 animate-spin mx-auto" /></div>}
        {!loading && displayDates.length === 0 && (
          <div className="text-center py-16">
            <span className="text-6xl block mb-4">{tab === 'planned' ? '💕' : '📖'}</span>
            <p className="text-[#3C2415] font-extrabold text-lg">{tab === 'planned' ? 'No planned dates' : 'No date history'}</p>
            <p className="text-[#8B7355] text-sm mt-1">{tab === 'planned' ? 'Plan your first date together!' : 'Complete a date to see it here'}</p>
            {tab === 'planned' && <Link href="/date" className="inline-block mt-4 px-6 py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-pink-200">💕 Plan a Date</Link>}
          </div>
        )}
        {displayDates.map((d: any) => {
          const fp = d.fullPlan || d.planData?.fullPlan || {};
          const photoUrl = fp.planDays?.[0]?.stops?.[0]?.photoUrl || d.planDays?.[0]?.stops?.[0]?.photoUrl;
          const isDate = d.type === 'date' || !!fp.city;
          return (
            <div key={d.id || d.savedAt} onClick={() => openTrip(d)}
              className="bg-white rounded-2xl shadow-sm border border-[#E8D5C4]/50 hover:shadow-md transition-all cursor-pointer overflow-hidden">
              {photoUrl && (
                <div className="h-36 overflow-hidden"><img src={photoUrl} className="w-full h-full object-cover" alt="" /></div>
              )}
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-2xl flex-shrink-0">{d.completed ? '✅' : isDate ? '💕' : '✈️'}</span>
                    <div className="min-w-0">
                      <p className="text-[14px] font-extrabold text-[#3C2415] truncate">{d.title}</p>
                      <p className="text-[10px] text-[#8B7355] flex items-center gap-1 flex-wrap">
                        <span><MapPin className="h-3 w-3 inline" />{d.destination || fp.city || 'Destination'}</span>
                        <span>·</span>
                        <span><Calendar className="h-3 w-3 inline" />{new Date(d.startDate || d.date || d.savedAt || 0).toLocaleDateString('en', { month: 'short', day: 'numeric' })}</span>
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-[#D4C4B0] flex-shrink-0 ml-2" />
                </div>
                <div className="flex gap-2 flex-wrap">
                  <span className="text-[10px] font-bold bg-[#FDF0E0] text-[#C4956A] rounded-full px-2.5 py-0.5">RM {Math.round(d.totalCost || 0).toLocaleString()}</span>
                  <span className="text-[10px] font-bold bg-[#F5EDE3] text-[#8B7355] rounded-full px-2.5 py-0.5">{d.days || 1}d</span>
                  {isDate && <span className="text-[10px] font-bold bg-pink-50 text-pink-500 rounded-full px-2.5 py-0.5">💕 Date</span>}
                  {!isDate && <span className="text-[10px] font-bold bg-blue-50 text-blue-500 rounded-full px-2.5 py-0.5">✈️ Trip</span>}
                </div>
                {!d.completed && (
                  <button onClick={e => { e.stopPropagation(); markComplete(d); }}
                    className="w-full mt-3 py-2 rounded-xl bg-emerald-50 text-emerald-600 text-[13px] font-bold hover:bg-emerald-100 transition-colors">
                    <CheckCircle2 className="h-3.5 w-3.5 inline mr-1" /> Mark Complete
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
