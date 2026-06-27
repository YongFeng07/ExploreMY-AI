// @ts-nocheck
'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MapPin, Calendar, Trash2, Sparkles, ArrowLeft, X, Navigation, CheckCircle, Circle, ChevronLeft, ChevronRight, Star, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function MyTripsPage() {
  const router = useRouter();
  const [trips, setTrips] = useState<any[]>(() => {
    try { return JSON.parse(localStorage.getItem('saved_trips') || '[]'); } catch { return []; }
  });
  const [sel, setSel] = useState<any>(null);
  const [selStop, setSelStop] = useState<any>(null);
  const [photoIdx, setPhotoIdx] = useState(0);
  const [nearbyPlaces, setNearbyPlaces] = useState<any[]>([]);
  const [stopDetail, setStopDetail] = useState<any>(null);
  const [tab, setTab] = useState<'active' | 'completed'>('active');
  const [detailTab, setDetailTab] = useState<string>('timeline');
  const [dayIdx, setDayIdx] = useState(0);

  const saveTrips = (t: any[]) => { localStorage.setItem('saved_trips', JSON.stringify(t)); setTrips(t); };

  const load = () => {
    try { setTrips(JSON.parse(localStorage.getItem('saved_trips') || '[]')); } catch { setTrips([]); }
  };
  useEffect(() => { load(); }, []);

  const toggleCompleted = (id: string, completed: boolean) => {
    const updated = trips.map(t => t.id === id || t.savedAt === id ? { ...t, completed, completedAt: completed ? new Date().toISOString() : null } : t);
    saveTrips(updated);
    if (sel?.id === id || sel?.savedAt === id) setSel((p: any) => ({ ...p, completed, completedAt: completed ? new Date().toISOString() : null }));
  };

  const remove = (id: string) => {
    const updated = trips.filter(t => t.id !== id && t.savedAt !== id);
    saveTrips(updated);
    setSel(null);
  };

  const activeTrips = trips.filter((t: any) => !t.completed);
  const completedTrips = trips.filter((t: any) => t.completed);
  const displayTrips = tab === 'active' ? activeTrips : completedTrips;

  // ═══════════════════════════════════════════════════════════════════
  // STOP DETAIL — Full AI Planner style
  // ═══════════════════════════════════════════════════════════════════
  if (selStop) {
    const sp = selStop;
    const plan = sel?.planData || sel || {};
    const spPhotos: string[] = [];
    if (sp.photoUrl) spPhotos.push(sp.photoUrl);
    if (sp.photos?.length) spPhotos.push(...sp.photos);
    if (spPhotos.length < 5) {
      for (let i = spPhotos.length; i < 10; i++) {
        spPhotos.push(`https://images.unsplash.com/photo-${1500000000 + i * 77777 + (sp.placeName?.length || 5) * 333}?w=800&h=600&fit=crop`);
      }
    }
    const photos = spPhotos.slice(0, 10);

    return (
      <div className="fixed inset-0 z-[9999] flex flex-col bg-[#FDF6ED]" onClick={() => setSelStop(null)}>
        <div className="relative h-72 shrink-0 overflow-hidden">
          {photos.length > 0 && (
            <>
              <img src={photos[photoIdx]} className="w-full h-full object-cover" alt="" />
              <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#FDF6ED] to-transparent pointer-events-none" />
              <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/30 to-transparent pointer-events-none" />
              {photos.length > 1 && (
                <>
                  <button onClick={e => { e.stopPropagation(); setPhotoIdx(p => (p - 1 + photos.length) % photos.length); }}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 backdrop-blur-md text-white flex items-center justify-center">
                    <ChevronLeft className="h-5 w-5" /></button>
                  <button onClick={e => { e.stopPropagation(); setPhotoIdx(p => (p + 1) % photos.length); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 backdrop-blur-md text-white flex items-center justify-center">
                    <ChevronRight className="h-5 w-5" /></button>
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                    {photos.map((_: any, j: number) => (
                      <button key={j} onClick={e => { e.stopPropagation(); setPhotoIdx(j); }}
                        className={cn('rounded-full transition-all', j === photoIdx ? 'bg-white w-5 h-1.5 shadow-lg' : 'bg-white/50 w-1.5 h-1.5')} />))}
                  </div>
                  <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-md text-white text-[10px] px-3 py-1.5 rounded-full font-bold shadow-lg">
                    {photoIdx + 1}/{photos.length}</div>
                </>
              )}
            </>
          )}
          <button onClick={e => { e.stopPropagation(); setSelStop(null); }}
            className="absolute left-4 top-4 w-9 h-9 rounded-full bg-black/30 backdrop-blur-md text-white flex items-center justify-center"><X className="h-5 w-5" /></button>
        </div>
        <div className="flex-1 overflow-y-auto" onClick={e => e.stopPropagation()}>
          <div className="px-5 pt-5 pb-8 space-y-4">
            <div className="flex gap-1.5">
              {sp.isHiddenGem && <span className="text-[10px] font-bold bg-purple-100 text-purple-600 rounded-full px-2.5 py-1">💎 Hidden Gem</span>}
              {sp.isPhotoSpot && <span className="text-[10px] font-bold bg-sky-100 text-sky-600 rounded-full px-2.5 py-1">📸 Photo Spot</span>}
              {sp.rating > 0 && <span className="text-[10px] font-bold bg-amber-100 text-amber-600 rounded-full px-2.5 py-1"><Star className="h-3 w-3 fill-amber-400 text-amber-400 inline" /> {sp.rating}</span>}
            </div>
            <h2 className="text-[24px] font-extrabold text-[#1A1A1A] leading-[1.15]">{sp.placeName}</h2>
            {sp.description && <p className="text-[15px] text-[#6B7280] leading-relaxed">{sp.description}</p>}
            <div className="rounded-2xl border border-[#7B5E3B]/20 bg-gradient-to-r from-[#FDF6ED] to-white p-4">
              <p className="text-[10px] font-bold text-[#7B5E3B] uppercase tracking-wider mb-1">🤖 AI Why Recommended</p>
              <p className="text-[13px] text-[#1A1A1A] leading-relaxed font-medium">{sp.aiReasoning || `${sp.placeName} is a ${sp.isHiddenGem ? 'hidden gem' : 'top pick'} in ${plan.destination || 'this area'}.`}</p>
              <div className="flex items-center gap-2 mt-2 pt-2 border-t border-[#7B5E3B]/10 flex-wrap"><span className="text-[10px] font-bold text-[#6B7280]">Based on: </span>{sp.category && <span className="text-[10px] font-bold text-[#7B5E3B] bg-[#FDF6ED] rounded-full px-2 py-0.5">🧬 {sp.category} DNA</span>}<span className="text-[10px] font-bold text-[#6B8E4E] bg-sky-50 rounded-full px-2 py-0.5">⭐ {(sp.rating ?? 0).toFixed(1)} · {sp.crowdLevel || 'medium'} crowd</span></div>
            </div>
            {/* Quality Score — matching AI Planner */}
            <div className="rounded-2xl border border-purple-200 bg-white p-4"><p className="text-[10px] font-bold text-purple-600 uppercase tracking-wider mb-2">{sp.isHiddenGem ? '💎 Hidden Gem Score' : '📍 Place Quality Score'}</p><div className="flex items-center gap-3"><div className="relative w-16 h-16 flex-shrink-0"><svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64"><circle cx="32" cy="32" r="28" fill="none" stroke="#F3F4F6" strokeWidth="5"/><circle cx="32" cy="32" r="28" fill="none" stroke={sp.isHiddenGem?'#7C3AED':'#7B5E3B'} strokeWidth="5" strokeLinecap="round" strokeDasharray={`${2*Math.PI*28}`} strokeDashoffset={`${2*Math.PI*28*(1-(sp.hiddenGemScore||(sp.isHiddenGem?0.75:0.5)))}`}/></svg><span className={`absolute inset-0 flex items-center justify-center text-sm font-extrabold ${sp.isHiddenGem?'text-purple-600':'text-[#7B5E3B]'}`}>{Math.round((sp.hiddenGemScore||(sp.isHiddenGem?0.75:0.5))*100)}</span></div><div className="flex-1 text-[11px] space-y-1">{[['Quality',sp.rating?Math.round((sp.rating/5)*100):70,sp.rating>=4.3?'High':'Good'],['Exposure',sp.isHiddenGem?85:40,sp.isHiddenGem?'Hidden':'Popular'],['Uniqueness',sp.isPhotoSpot?90:60,sp.isPhotoSpot?'Rare':'Common']].map(([label,pct,val]:any)=>(<div key={label} className="flex items-center gap-2"><span className="w-16 text-[#6B7280]">{label}</span><div className="flex-1 h-1 bg-[#F3F4F6] rounded-full overflow-hidden"><div className={`h-full rounded-full ${sp.isHiddenGem?'bg-purple-400':'bg-[#7B5E3B]/50'}`} style={{width:`${pct}%`}}/></div><span className="font-bold text-[#1A1A1A] w-14 text-right text-[10px]">{val}</span></div>))}</div></div></div>
            {/* 🧬 Travel DNA Match */}
            <div className="rounded-2xl border border-[#E5E7EB] bg-white p-4"><p className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider mb-2">🧬 Travel DNA Match</p><div className="flex items-center gap-3"><span className="text-3xl font-extrabold text-[#7B5E3B]">{Math.min(99,Math.round((sp.rating?sp.rating/5*85:60)+(sp.isPhotoSpot?10:0)+(sp.isHiddenGem?5:0)))}<span className="text-lg text-[#9CA3AF]">%</span></span><div className="flex-1 text-[11px] space-y-1">{[{dim:'FOODIE',e:'🍜',v:sp.category?.includes('FOOD')||sp.category?.includes('BREAKFAST')||sp.category?.includes('LUNCH')||sp.category?.includes('DINNER')?90:sp.rating>4?75:55},{dim:'PHOTOGRAPHY',e:'📸',v:sp.isPhotoSpot?90:sp.rating>4.3?70:45}].map(d=>(<div key={d.dim} className="flex items-center gap-2"><span className="text-lg">{d.e}</span><span className="text-[#6B7280] w-14">{d.dim==='FOODIE'?'Foodie':d.dim==='PHOTOGRAPHY'?'Photo':d.dim}</span><div className="flex-1 h-1.5 bg-[#F3F4F6] rounded-full overflow-hidden"><div className="h-full bg-[#7B5E3B] rounded-full" style={{width:`${d.v}%`}}/></div><span className="text-[10px] font-bold text-[#7B5E3B] w-8 text-right">{d.v}%</span></div>))}</div></div></div>
            {/* Time Range + Duration */}
            <div className="flex items-center gap-2 text-[15px] font-semibold text-[#1A1A1A]"><span>{sp.timeSlot||sp.time||'?'} – {sp.endTime||'?'}</span><span className="text-[#9CA3AF] text-[13px]">({sp.durationMinutes||'?'} min)</span></div>
            {/* 💰 Estimated Cost */}
            <div className="rounded-2xl border border-[#E5E7EB] bg-white p-4"><p className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider mb-3">💰 Estimated Cost</p><div className="flex items-center justify-between mb-3"><div><p className="text-[28px] font-extrabold text-[#1A1A1A]">RM {sp.estimatedCost||sp.estimatedSpend||0}</p><p className="text-[11px] text-[#6B7280]">× {plan.groupSize||2} people</p></div><div className="text-right"><p className="text-[16px] font-bold text-[#6B7280]">Per Person</p><p className="text-[20px] font-extrabold text-[#7B5E3B]">RM {Math.round((sp.estimatedCost||sp.estimatedSpend||0)/(plan.groupSize||2))}</p></div></div><div className="h-1.5 bg-[#F3F4F6] rounded-full overflow-hidden"><div className="h-full bg-[#7B5E3B] rounded-full" style={{width:`${Math.min(100,((sp.estimatedCost||sp.estimatedSpend||50)/200)*100)}%`}}/></div><p className="text-[10px] text-[#8B7355] mt-2">💰💰 Google price level · Based on visitor spending data</p></div>
            {/* Write a Review */}
            <div className="rounded-2xl border border-[#E5E7EB] bg-white p-4"><p className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider mb-3">✍️ Write a Review</p><div className="flex gap-1 mb-3">{[1,2,3,4,5].map(j=>(<button key={j} className="text-2xl text-[#D4C4B0] hover:text-amber-400 transition-colors">★</button>))}</div><input placeholder="Quick review title..." className="w-full rounded-xl border border-[#E5E7EB] px-3 py-2 text-[13px] font-bold text-[#1A1A1A] placeholder:text-[#9CA3AF] outline-none mb-2"/><textarea placeholder="Share your experience at this place..." rows={2} className="w-full rounded-xl border border-[#E5E7EB] px-3 py-2 text-[13px] text-[#1A1A1A] placeholder:text-[#9CA3AF] outline-none resize-none mb-2"/><button className="w-full py-2.5 rounded-xl bg-[#7B5E3B] text-white text-[13px] font-extrabold hover:bg-[#5C3D1E] transition-colors">Submit Review</button></div>
            {/* Estimated Cost — detailed like AI Planner */}
            <div className="rounded-2xl border border-[#E5E7EB] bg-white p-4"><p className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider mb-3">💰 Estimated Cost</p><div className="flex items-center justify-between mb-3"><div><p className="text-[28px] font-extrabold text-[#1A1A1A]">RM {sp.estimatedCost||sp.estimatedSpend||0}</p><p className="text-[11px] text-[#6B7280]">Total for 2 people</p></div><div className="text-right"><p className="text-[16px] font-bold text-[#6B7280]">Per Person</p><p className="text-[20px] font-extrabold text-[#7B5E3B]">RM {Math.round((sp.estimatedCost||sp.estimatedSpend||0)/2)}</p></div></div><div className="h-1.5 bg-[#F3F4F6] rounded-full overflow-hidden"><div className="h-full bg-[#7B5E3B] rounded-full" style={{width:`${Math.min(100,((sp.estimatedCost||sp.estimatedSpend||50)/200)*100)}%`}}/></div><p className="text-[10px] text-[#8B7355] mt-2">💲💲 Google price level · Based on visitor spending data</p></div>
            {/* Address */}
            {sp.address && <div className="rounded-2xl border border-[#E5E7EB] bg-white p-4"><p className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider mb-1">📍 Address</p><p className="text-[13px] text-[#1A1A1A] font-medium">{sp.address}</p></div>}
            {/* Opening Hours */}
            {sp.openingHours && <div className="rounded-2xl border border-[#E5E7EB] bg-white p-4"><p className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider mb-1">🕐 Opening Hours</p><p className="text-[12px] text-[#1A1A1A] whitespace-pre-line">{sp.openingHours}</p></div>}
            {/* Google Maps Button */}
            {/* Discover Nearby */}
            {nearbyPlaces.length > 0 && (<div className="rounded-2xl border border-[#E5E7EB] bg-white p-4"><p className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider mb-2">📍 Discover Nearby</p><p className="text-[12px] text-[#9CA3AF] mb-2">Other great spots near {sp.placeName?.split(' ').slice(0,2).join(' ')}</p><div className="space-y-2">{nearbyPlaces.map((np:any)=>(<div key={np.id} className="flex items-center gap-2 p-2 rounded-xl hover:bg-[#FDF6ED] transition-colors cursor-pointer" onClick={()=>window.open(`https://www.google.com/maps/search/${encodeURIComponent(np.name)}`,'_blank')}><div className="w-10 h-10 rounded-lg bg-[#EDE4D8] flex items-center justify-center text-lg flex-shrink-0 overflow-hidden">{np.photos?.[0]?<img src={np.photos[0]} className="w-10 h-10 object-cover" alt=""/>:'📍'}</div><div className="flex-1 min-w-0"><p className="text-[12px] font-bold text-[#0E0E0E] truncate">{np.name}</p><p className="text-[10px] text-[#8B7355]">{np.rating?`⭐ ${np.rating}`:''}{np.distance?` · ${(np.distance/1000).toFixed(1)}km`:''}</p></div><span className="text-[10px] font-bold text-[#7B5E3B]">→</span></div>))}</div></div>)}
            {/* Address */}
            {stopDetail?.address && (<div className="rounded-2xl border border-[#E5E7EB] bg-white p-4"><p className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider mb-1">📍 Address</p><p className="text-[13px] text-[#1A1A1A] font-medium">{stopDetail.address}</p></div>)}
            {/* Opening Hours */}
            {stopDetail?.openingHours && (<div className="rounded-2xl border border-[#E5E7EB] bg-white p-4"><p className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider mb-1">🕐 Opening Hours</p><pre className="text-[11px] text-[#1A1A1A] whitespace-pre-line font-sans">{stopDetail.openingHours}</pre></div>)}
            {/* Google Reviews */}
            {stopDetail?.reviews?.length > 0 && (<div className="rounded-2xl border border-[#E5E7EB] bg-white p-4"><p className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider mb-2">💬 Google Reviews</p>{stopDetail.reviews.slice(0,3).map((r:any,i:number)=>(<div key={i} className="py-2 border-b border-[#F3F4F6] last:border-0"><div className="flex items-center gap-2"><div className="w-6 h-6 rounded-full bg-[#FDF0E0] flex items-center justify-center text-[10px] font-bold text-[#C4956A]">{r.author?.[0]||'?'}</div><span className="text-[12px] font-bold">{r.author}</span><span className="text-[10px] text-[#9CA3AF] ml-auto">{r.time||r.relative_time}</span></div><div className="flex gap-0.5 mt-0.5">{[...Array(5)].map((_,j)=><Star key={j} className={cn('h-3 w-3',j<(r.rating||0)?'fill-amber-400 text-amber-400':'text-[#D4C4B0]')}/>)}</div><p className="text-[11px] text-[#6B7280] mt-1">{r.text||r.snippet}</p></div>))}<a href={`https://www.google.com/maps/search/${encodeURIComponent(sp.placeName)}`} target="_blank" className="text-[11px] font-bold text-[#7B5E3B] mt-2 block hover:underline">See all reviews on Google →</a></div>)}
            {/* Maps Button */}
            <button onClick={() => window.open(`https://www.google.com/maps/search/${encodeURIComponent(sp.placeName + ' ' + (plan.destination || ''))}`, '_blank')} className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#7B5E3B] py-3 text-sm font-extrabold text-white shadow-lg hover:bg-[#5C3D1E] transition-all"><Navigation className="h-4 w-4" />View on Maps · See Reviews</button>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════
  // TRIP DETAIL — AI Planner style
  // ═══════════════════════════════════════════════════════════════════
  if (sel) {
    const plan = sel.planData?.fullPlan || sel.planData || sel;
    // Support all save formats: planDays (plan), activities (date), days, planStops
    let days = plan.planDays || plan.days || [];
    // Date planner saves use `activities` — wrap into days
    if (days.length === 0 && plan.activities?.length > 0) {
      days = [{ dayNumber: 1, theme: plan.dateType || 'Date', stops: plan.activities, date: sel.startDate || '' }];
    }
    // Old format: planStops or activities without planDays wrapper
    if (days.length === 0 && (plan.planStops)) {
      const stops = plan.planStops || [];
      const grouped: any = {};
      stops.forEach((s: any) => { const d = s.day || s.dayNumber || 1; if (!grouped[d]) grouped[d] = []; grouped[d].push(s); });
      days = Object.entries(grouped).map(([d, st]: any) => ({ dayNumber: parseInt(d), theme: `Day ${d}`, stops: st }));
    }
    const day = days[dayIdx];
    const dest = plan.destination || plan.city || sel.destination || 'Unknown';
    const totalStops = days.reduce((s: number, d: any) => s + (d.stops?.length || 0), 0);

    return (
      <div className="min-h-screen bg-[#FAFAF8]">
        <div className="bg-gradient-to-br from-[#7B5E3B] via-[#D4B483] to-[#6B8E4E] px-5 pt-14 pb-6 text-white">
          <button onClick={() => { setSel(null); setDayIdx(0); }} className="text-white/70 text-[13px] font-semibold mb-3 flex items-center gap-1"><ArrowLeft className="h-3.5 w-3.5" /> Back</button>
          <h1 className="text-[24px] font-extrabold leading-[1.15]">{sel.title}</h1>
          <div className="flex items-center gap-3 text-[13px] text-white/70 mt-1.5">
            <span><MapPin className="h-3.5 w-3.5 inline mr-1" />{dest}</span>
            {sel.startDate && <span><Calendar className="h-3.5 w-3.5 inline mr-1" />{sel.startDate} – {sel.endDate}</span>}
          </div>
          <div className="flex gap-2 mt-3 flex-wrap">
            <span className="bg-white/20 rounded-full px-3.5 py-1.5 text-xs font-extrabold">RM {Math.round(sel.totalCost || plan.totalCost || 0)}</span>
            <span className="bg-white/20 rounded-full px-3.5 py-1.5 text-xs font-semibold">{totalStops} stops</span>
            <span className="bg-white/20 rounded-full px-3.5 py-1.5 text-xs font-semibold">{sel.days || 1} days</span>
            {sel.completed && <span className="bg-green-400/30 rounded-full px-3.5 py-1.5 text-xs font-bold">✅ Completed</span>}
          </div>
        </div>

        <div className="sticky top-0 z-30 bg-[#FAFAF8]/90 backdrop-blur-xl border-b border-[#E5E7EB]">
          <div className="flex px-5 py-2.5 gap-1">
            {[{ k: 'timeline', l: 'Timeline' }, { k: 'budget', l: 'Budget' }, { k: 'roadtrip', l: '🚗 Roadtrip' }].map(t => (
              <button key={t.k} onClick={() => setDetailTab(t.k)}
                className={cn('px-4 py-2 rounded-full text-[13px] font-semibold', detailTab === t.k ? 'bg-[#7B5E3B] text-white' : 'bg-white text-[#5C4A3A] border border-[#E5E7EB]')}>{t.l}</button>))}
          </div>
        </div>

        <div className="pb-32">
          {detailTab === 'timeline' && (
            <div className="px-5 pt-4 space-y-4">
              {days.length > 0 ? (
                <>
                  <div className="flex gap-2">
                    {days.map((d: any, i: number) => (
                      <button key={i} onClick={() => setDayIdx(i)}
                        className={cn('flex-1 rounded-xl border-2 py-3 text-center transition-all', dayIdx === i ? 'border-[#7B5E3B] bg-[#FDF6ED] text-[#7B5E3B]' : 'border-[#E5E7EB] bg-white text-[#1A1A1A]')}>
                        <div className="text-sm font-bold">Day {d.dayNumber || i + 1}</div></button>))}
                  </div>
                  {day && (
                    <div>
                      <h3 className="text-lg font-extrabold text-[#1A1A1A] mb-4">{day.theme || `Day ${day.dayNumber || dayIdx + 1}`}</h3>
                      {day.stops?.map((s: any, idx: number) => (
                        <div key={idx} className="cursor-pointer" onClick={() => { setSelStop(s); setPhotoIdx(0); }}>
                          <div className="flex gap-0">
                            <div className="flex flex-col items-center mr-4">
                              <div className={cn('w-3 h-3 rounded-full border-2 border-white shadow-sm', s.isHiddenGem ? 'bg-purple-400' : s.isPhotoSpot ? 'bg-sky-400' : 'bg-[#7B5E3B]')} />
                              {idx < (day.stops?.length ?? 0) - 1 && <div className="w-0.5 flex-1 bg-[#D4C4B0] mt-1.5 mb-1.5" />}
                            </div>
                            <div className="flex-1 mb-5 bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden hover:shadow-md">
                              {s.photoUrl ? <img src={s.photoUrl} className="w-full h-44 object-cover" alt="" /> : <div className="w-full h-28 bg-[#FDF6ED] flex items-center justify-center text-4xl">{s.emoji ?? '📍'}</div>}
                              <div className="p-4">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-[14px] font-bold text-[#1A1A1A]">{s.placeName}</span>
                                  <div className="flex gap-1">{s.isHiddenGem && <span className="text-[9px] font-bold bg-purple-100 text-purple-600 rounded-full px-2 py-0.5">💎</span>}</div>
                                </div>
                                {s.description && <p className="text-[13px] text-[#6B7280] leading-relaxed line-clamp-2 mb-2">{s.description}</p>}
                                <div className="flex items-center gap-2 text-[12px] text-[#9CA3AF]">
                                  <span className="flex items-center gap-1"><Clock className="h-3 w-3 text-[#7B5E3B]" />{s.timeSlot || s.time || '?'}</span>
                                  {s.rating > 0 && <span className="flex items-center gap-0.5 text-[#1A1A1A]"><Star className="h-3 w-3 fill-amber-400 text-amber-400" />{s.rating}</span>}
                                  <span className="ml-auto text-[14px] font-bold text-[#7B5E3B]">RM {Math.round(s.estimatedCost || s.estimatedSpend || 0)}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-10 bg-white rounded-2xl p-5 border border-[#E5E7EB]">
                  <p className="text-[#6B7280] font-bold">{dest} · {sel.days || 1} days · RM {(sel.totalCost || plan.totalCost || 0).toLocaleString()}</p>
                </div>
              )}
            </div>
          )}

          {detailTab === 'budget' && (
            <div className="px-5 pt-4 space-y-3">
              {(() => {
                const bb = plan.budgetBreakdown;
                const total = bb?.total || plan.totalCost || sel.totalCost || 500;
                const budget = plan.budget || total;
                const util = total / Math.max(budget, 1);
                const healthColor = util > 1 ? '#E85D5D' : util > 0.85 ? '#F5B942' : '#3BA55C';
                const healthEmoji = util > 1 ? '🔴' : util > 0.85 ? '🟡' : '🟢';
                const healthLabel = util > 1 ? 'Over Budget' : util > 0.85 ? 'Watch Budget' : 'Healthy Budget';
                const perPerson = Math.round(total / (plan.groupSize || 2));
                const feasibility = util > 1 ? 45 : util > 0.85 ? 72 : util > 0.65 ? 88 : 95;
                const alertMsg = util > 1 ? '🔴 Over budget — review spending' : util > 0.85 ? '⚠️ Almost at budget limit — avoid impulse spending' : util > 0.65 ? '💡 Budget is on track — keep going' : '✅ Well within budget — enjoy your trip!';
                return (<>
                  {/* AI Budget Engine */}
                  <div className="card-travel p-5 text-center">
                    <p className="text-[10px] font-bold text-[#8B7355] uppercase tracking-wider mb-1">AI Budget Engine</p>
                    <div className="relative w-24 h-24 mx-auto my-3">
                      <svg className="w-24 h-24 -rotate-90" viewBox="0 0 96 96"><circle cx="48" cy="48" r="42" fill="none" stroke="#EDE4D8" strokeWidth="8"/><circle cx="48" cy="48" r="42" fill="none" stroke={healthColor} strokeWidth="8" strokeLinecap="round" strokeDasharray={`${2*Math.PI*42}`} strokeDashoffset={`${2*Math.PI*42*(1-Math.min(util,1))}`}/></svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center"><span className="text-xl font-extrabold" style={{color:healthColor}}>RM {Math.round(total)}</span><span className="text-[10px] font-bold text-[#8B7355]">{healthEmoji} {healthLabel}</span></div>
                    </div>
                    <div className="flex justify-center gap-4 text-[11px]"><span className="text-[#8B7355]">Budget: <strong className="text-[#0E0E0E]">RM {budget}</strong></span><span className="text-[#8B7355]">Per person: <strong className="text-[#0E0E0E]">RM {perPerson}</strong></span></div>
                    <div className="mt-4 pt-3 border-t border-[#EDE4D8]"><div className="flex items-center justify-between mb-1"><span className="text-[10px] font-bold text-[#8B7355]">📊 Feasibility Score</span><span className="text-[11px] font-extrabold" style={{color:healthColor}}>{feasibility}/100</span></div><div className="h-1.5 bg-[#EDE4D8] rounded-full overflow-hidden"><div className="h-full rounded-full transition-all duration-700" style={{width:`${feasibility}%`,backgroundColor:healthColor}}/></div><p className="text-[10px] text-[#8B7355] mt-1 italic">{util>1?'⚠️ Over budget — tap for alternatives':util>0.85?'⚠️ Tight — consider saving on transport':'✅ Your budget is comfortable for this trip'}</p></div>
                  </div>
                  {/* Smart AI Allocation */}
                  <div className="card-travel p-4">
                    <p className="text-[10px] font-bold text-[#8B7355] uppercase tracking-wider mb-3">🧠 Smart AI Allocation</p>
                    <div className="space-y-2">
                      {[{k:'hotel',e:'🏨',l:'Hotel',d:bb?.hotel,ti:plan.days?.length>1?'1 night':'Not needed'},{k:'food',e:'🍜',l:'Food & Drink',d:bb?.food,ti:`${totalStops||plan.totalStops||0} meals`},{k:'transport',e:'🚕',l:'Transport',d:bb?.transport,ti:plan.transportMode||'DRIVING'},{k:'tickets',e:'🎫',l:'Activities',d:bb?.tickets,ti:'Entry fees'},{k:'emergencyBuffer',e:'🆘',l:'Emergency',d:bb?.emergencyBuffer,ti:'12.5% buffer'}].filter(c=>c.d?.estimatedCost>0).map((c,i)=>{const barPct=total>0?Math.min(100,(c.d.estimatedCost/total)*100):20;const colors=['#7B5E3B','#D4B483','#6B8E4E','#5B7FA5','#C4943A'];return(<div key={c.k} className="flex items-center gap-3"><span className="text-lg w-7">{c.e}</span><div className="flex-1"><div className="flex justify-between text-[11px] mb-0.5"><span className="font-bold text-[#0E0E0E]">{c.l}</span><span className="font-extrabold" style={{color:colors[i]}}>RM {Math.round(c.d.estimatedCost)}</span></div><div className="h-2 bg-[#EDE4D8] rounded-full overflow-hidden"><div className="h-full rounded-full transition-all duration-500" style={{width:`${barPct}%`,backgroundColor:colors[i]}}/></div><span className="text-[9px] text-[#8B7355]">{c.ti} · {c.d?.percentage||Math.round(barPct)}%</span></div></div>)})}
                    </div>
                  </div>
                  {/* Budget Alert */}
                  <div className="card-travel p-4"><p className="text-[10px] font-bold text-[#8B7355] uppercase tracking-wider mb-2">🔔 Budget Alerts</p><p className="text-[12px] text-[#6B7280]">{alertMsg}</p></div>
                  {/* Where to Stay */}
                  {bb?.hotel?.hotelOptions?.length > 0 && (<div className="card-travel p-4"><p className="text-[10px] font-bold text-[#8B7355] uppercase tracking-wider mb-3">🏨 Where to Stay</p><div className="space-y-2">{bb.hotel.hotelOptions.map((h:any,i:number)=>(<div key={i} className="flex gap-3 p-3 rounded-xl bg-[#FDF6ED] hover:bg-[#F5EFE6] cursor-pointer transition-colors"><div className="w-12 h-12 rounded-xl bg-[#7B5E3B]/10 flex items-center justify-center text-2xl flex-shrink-0 overflow-hidden">{h.photoUrl?<img src={h.photoUrl} className="w-full h-full object-cover" alt=""/>:'🏨'}</div><div className="flex-1 min-w-0"><div className="flex items-center justify-between"><h4 className="text-[13px] font-extrabold text-[#0E0E0E]">{h.name}</h4><span className="flex items-center gap-0.5 text-[11px] font-bold text-[#D4B483]">⭐ {h.rating}</span></div><p className="text-[11px] text-[#5C4A3A] mt-0.5 line-clamp-2">{h.description||h.desc}</p><div className="flex items-center gap-2 mt-1.5 flex-wrap">{(h.amenities||[]).slice(0,4).map((a:string)=>(<span key={a} className="text-[9px] bg-white rounded-full px-2 py-0.5 text-[#5C4A3A] font-medium">{a}</span>))}<span className="text-[12px] font-extrabold text-[#7B5E3B] ml-auto">RM {h.price}/night{h.roomsNeeded>1?` · ${h.roomsNeeded} rooms`:` · RM ${h.totalPrice||h.price} total`}</span></div></div></div>))}</div></div>)}
                </>);
              })()}
            </div>
          )}

          {detailTab === 'roadtrip' && (
            <div className="px-5 pt-4">
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#E5E7EB]">
                <p className="text-[10px] font-bold text-[#8B7355] uppercase mb-2">🚗 Roadtrip</p>
                <p className="text-[12px] text-[#6B7280]">
                  Distance: {plan.totalDistance ? `${plan.totalDistance > 5000 ? (plan.totalDistance/1000).toFixed(0) : plan.totalDistance} km` : 'N/A'} ·
                  Transport: {plan.transportMode || 'DRIVING'} ·
                  Days: {sel.days || plan.days?.length || 1}
                </p>
              </div>
            </div>
          )}

          <div className="fixed bottom-20 left-0 right-0 px-5 z-40">
            <div className="flex gap-2">
              <button onClick={() => toggleCompleted(sel.id, !sel.completed)}
                className={`flex-1 py-3.5 rounded-2xl text-sm font-extrabold ${sel.completed ? 'bg-green-100 text-green-700' : 'bg-[#7B5E3B] text-white'}`}>
                {sel.completed ? <><CheckCircle className="h-4 w-4 inline mr-1" fill="currentColor" /> Completed</> : <><Circle className="h-4 w-4 inline mr-1" /> Mark as Completed</>}</button>
              <Link href={`/weekend-planner?dest=${encodeURIComponent(sel.destination || '')}`}
                className="px-4 py-3.5 rounded-2xl bg-amber-100 text-amber-700 text-sm font-extrabold"><Sparkles className="h-4 w-4" /></Link>
              <button onClick={() => remove(sel.id)} className="px-4 py-3.5 rounded-2xl bg-red-50 text-red-500 text-sm font-bold"><Trash2 className="h-4 w-4" /></button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════
  // TRIP LIST
  // ═══════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <div className="px-5 pt-14 pb-4">
        <Link href="/profile" className="text-[#7B5E3B] text-[13px] font-semibold mb-2 block">← Back</Link>
        <h1 className="text-[28px] font-extrabold text-[#1A1A1A]">✈️ My Trips</h1>
        <p className="text-[13px] text-[#8B7355] mt-1">{trips.length} trips · {completedTrips.length} completed</p>
      </div>

      <div className="px-5 mb-4 flex gap-2">
        {[{ v: 'active', l: `Active (${activeTrips.length})` }, { v: 'completed', l: `Completed (${completedTrips.length})` }].map(t => (
          <button key={t.v} onClick={() => setTab(t.v as any)}
            className={cn('px-5 py-2.5 rounded-full text-[13px] font-bold', tab === t.v ? 'bg-[#7B5E3B] text-white shadow-md' : 'bg-white text-[#8B7355] border border-[#E5E7EB]')}>{t.l}</button>))}
      </div>

      <div className="px-5 pb-24 space-y-3">
        {displayTrips.length === 0 && (
          <div className="text-center py-16">
            <span className="text-5xl block mb-4">{tab === 'completed' ? '✅' : '✈️'}</span>
            <p className="text-[#1A1A1A] font-extrabold text-lg">{tab === 'completed' ? 'No completed trips' : 'No active trips'}</p>
          </div>)}
        {displayTrips.map((t: any) => (
          <div key={t.id} className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-4 hover:shadow-md transition-all group">
            <div onClick={() => {
              // Check both old API structure (planData.fullPlan) and new normalized structure (fullPlan)
              const fp = t.fullPlan || t.planData?.fullPlan;
              if (fp) {
                sessionStorage.setItem('savedPlan', JSON.stringify(fp));
                if (fp.city && fp.activities && !fp.destination) {
                  router.push('/date?view=saved');
                } else {
                  router.push('/weekend-planner?view=saved');
                }
              } else {
                setSel(t); setDayIdx(0); setDetailTab('timeline');
              }
            }} className="cursor-pointer">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-[15px] font-extrabold text-[#1A1A1A]">{t.title}</h3>
                    {t.completed && <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" fill="currentColor" />}
                  </div>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-[11px] text-[#8B7355]"><MapPin className="h-3 w-3 inline mr-0.5" />{t.destination}</span>
                    {t.startDate && <span className="text-[11px] text-[#8B7355]"><Calendar className="h-3 w-3 inline mr-0.5" />{t.startDate} – {t.endDate}</span>}
                    <span className="text-[11px] font-bold text-[#7B5E3B]">RM {(t.totalCost || 0).toLocaleString()}</span>
                  </div>
                  <p className="text-[10px] text-[#A69A8C] mt-1">
                    {t.days}d · {new Date(t.savedAt).toLocaleDateString('en-MY', { month: 'short', day: 'numeric' })}
                    {t.completed && ` · Done ${new Date(t.completedAt).toLocaleDateString('en-MY', { month: 'short', day: 'numeric' })}`}
                  </p>
                </div>
                <button onClick={e => { e.stopPropagation(); remove(t.id); }}
                  className="p-2 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all flex-shrink-0 ml-2"><Trash2 className="h-4 w-4 text-red-400" /></button>
              </div>
            </div>
            {!t.completed && (
              <button onClick={async (e) => { e.stopPropagation();
                await toggleCompleted(t.id, true);
              }} className="w-full mt-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 text-[12px] font-bold hover:bg-emerald-100 transition-colors">
                ✅ Mark as Completed
              </button>
            )}
          </div>))}
      </div>
    </div>
  );
}
