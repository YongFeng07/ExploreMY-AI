'use client';

import { useState, useEffect } from 'react';
import { TopBar } from '@/components/layout/top-bar';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { PlaceDetailView } from '@/components/places/place-detail-view';
import {
  Sparkles, MapPin, DollarSign, Calendar, Heart, Loader2,
  RefreshCw, Bookmark, Share2, ChevronRight, Plus, Minus,
  Utensils, Landmark, TreePine, Camera, ShoppingBag, Coffee, Compass,
  Navigation, Star, Globe, Search, Clock, X,
} from 'lucide-react';

const API = 'http://127.0.0.1:3001/api/v1';

const REGIONS: { name: string; cities: { n: string; c: string }[] }[] = [
  { name: '🇲🇾 Malaysia', cities: [
    { n: 'Kuala Lumpur', c: '🇲🇾' }, { n: 'Penang', c: '🇲🇾' }, { n: 'Langkawi', c: '🇲🇾' },
    { n: 'Melaka', c: '🇲🇾' }, { n: 'Johor Bahru', c: '🇲🇾' }, { n: 'Kota Kinabalu', c: '🇲🇾' },
    { n: 'Kuching', c: '🇲🇾' }, { n: 'Ipoh', c: '🇲🇾' }, { n: 'Cameron Highlands', c: '🇲🇾' },
  ]},
  { name: '🌏 Asia Pacific', cities: [
    { n: 'Singapore', c: '🇸🇬' }, { n: 'Bangkok', c: '🇹🇭' }, { n: 'Bali', c: '🇮🇩' },
    { n: 'Tokyo', c: '🇯🇵' }, { n: 'Seoul', c: '🇰🇷' }, { n: 'Hong Kong', c: '🇭🇰' },
    { n: 'Taipei', c: '🇹🇼' }, { n: 'Ho Chi Minh', c: '🇻🇳' }, { n: 'Manila', c: '🇵🇭' },
  ]},
  { name: '🇪🇺 Europe', cities: [
    { n: 'London', c: '🇬🇧' }, { n: 'Paris', c: '🇫🇷' }, { n: 'Barcelona', c: '🇪🇸' },
    { n: 'Rome', c: '🇮🇹' }, { n: 'Amsterdam', c: '🇳🇱' }, { n: 'Prague', c: '🇨🇿' },
    { n: 'Istanbul', c: '🇹🇷' }, { n: 'Berlin', c: '🇩🇪' }, { n: 'Vienna', c: '🇦🇹' },
  ]},
  { name: '🇺🇸 Americas', cities: [
    { n: 'New York', c: '🇺🇸' }, { n: 'Los Angeles', c: '🇺🇸' }, { n: 'Miami', c: '🇺🇸' },
    { n: 'Toronto', c: '🇨🇦' }, { n: 'Mexico City', c: '🇲🇽' }, { n: 'São Paulo', c: '🇧🇷' },
  ]},
  { name: '🌍 Middle East & Others', cities: [
    { n: 'Dubai', c: '🇦🇪' }, { n: 'Sydney', c: '🇦🇺' }, { n: 'Cairo', c: '🇪🇬' },
    { n: 'Cape Town', c: '🇿🇦' }, { n: 'Marrakech', c: '🇲🇦' }, { n: 'Maldives', c: '🇲🇻' },
  ]},
];

const INTERESTS = [
  { i: 'food', l: 'Food', I: Utensils },
  { i: 'culture', l: 'Culture', I: Landmark },
  { i: 'nature', l: 'Nature', I: TreePine },
  { i: 'adventure', l: 'Adventure', I: Compass },
  { i: 'photo', l: 'Photo', I: Camera },
  { i: 'shopping', l: 'Shop', I: ShoppingBag },
  { i: 'cafe', l: 'Cafe', I: Coffee },
];

interface TripStop { time: string; placeName: string; placeId?: string; category: string; description: string; cost: number; currency: string; transport: string; rating?: number; photos?: string[]; }
interface TripDay { day: number; theme: string; stops: TripStop[]; dayTotalCost: number; }
interface TripPlan { title: string; destination: string; totalBudget: number; totalCost: number; currency: string; days: TripDay[]; tips: string[]; }

export default function AIPlannerPage() {
  const [dest, setDest] = useState('');
  const [budget, setBudget] = useState(300);
  const [duration, setDuration] = useState(2);
  const [interests, setInterests] = useState<string[]>(['food']);
  const [plan, setPlan] = useState<TripPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(1);
  const [showDest, setShowDest] = useState(false);
  const [detailStop, setDetailStop] = useState<any>(null);
  const [stopDetails, setStopDetails] = useState<any>(null);
  const [stopPhotoIdx, setStopPhotoIdx] = useState(0);

  // Fetch full place details when a stop is clicked
  useEffect(() => {
    if (detailStop?.placeId) {
      setStopDetails(null); setStopPhotoIdx(0);
      fetch(`${API}/places/details/${detailStop.placeId}`).then(r => r.json()).then(j => setStopDetails(j.data)).catch(() => {});
    }
  }, [detailStop?.placeId]);

  const generate = async (d?: string) => {
    const dest2 = d || dest;
    if (!dest2.trim()) { toast.error('Please select a destination'); return; }
    if (interests.length === 0) { toast.error('Select at least one interest'); return; }
    setLoading(true); setPlan(null);
    try {
      const r = await fetch(`${API}/ai/plan-trip`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ destination: dest2, budget, duration, interests }) });
      const j = await r.json();
      if (j.error) throw new Error(j.error);
      setPlan(j.data); setExpanded(1);
      toast.success('Your personalized plan is ready!');
    } catch { toast.error('Failed to generate. Please try again.'); }
    finally { setLoading(false); }
  };

  const selectDest = (n: string) => { setDest(n); setShowDest(false); };

  // Loading screen
  if (loading) {
    return (
      <div className="flex h-dvh flex-col items-center justify-center bg-[#FFFDF7] gap-8">
        <div className="relative">
          <div className="absolute inset-0 animate-ping rounded-full bg-[#C4956A]/20" />
          <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-white shadow-2xl">
            <Sparkles className="h-12 w-12 text-[#C4956A] animate-pulse" />
          </div>
        </div>
        <p className="text-2xl font-extrabold text-[#3C2415]">Crafting Your Trip</p>
        <p className="text-sm text-[#8B7355] -mt-4">Researching {dest} for your {duration}-day adventure</p>
        <div className="flex gap-2">
          {['Finding best spots', 'Planning routes', 'Calculating costs', 'Finalizing'].map((t, i) => (
            <span key={i} className="h-2.5 w-2.5 animate-bounce rounded-full bg-[#C4956A]" style={{ animationDelay: `${i * 150}ms` }} />
          ))}
        </div>
      </div>
    );
  }

  // Result view
  if (plan) {
    if (detailStop) {
      const stopPhotos = stopDetails?.photos?.length > 0 ? stopDetails.photos : (detailStop.photos || []);
      const stopPhone = stopDetails?.phone;
      const stopWebsite = stopDetails?.website;
      const stopReviews = stopDetails?.reviews || [];
      const stopAddress = stopDetails?.address || detailStop.description;

      return (
        <div className="min-h-dvh bg-[#FFFDF7]">
          <TopBar title={detailStop.placeName || 'Stop Detail'} showBack onBack={() => setDetailStop(null)} />
          <div className="pt-14">
            {/* Hero Photo Carousel */}
            <div className="relative h-80 w-full bg-[#F5EDE3] sm:h-96">
              {stopPhotos.length > 0 ? (
                <>
                  <img src={stopPhotos[stopPhotoIdx]} alt={detailStop.placeName} className="h-full w-full object-cover transition-all duration-500" />
                  {stopPhotos.length > 1 && (
                    <>
                      <button onClick={() => setStopPhotoIdx(p => p === 0 ? stopPhotos.length - 1 : p - 1)} className="absolute left-3 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-2xl font-bold shadow-lg hover:bg-white active:scale-90 transition-all">‹</button>
                      <button onClick={() => setStopPhotoIdx(p => p === stopPhotos.length - 1 ? 0 : p + 1)} className="absolute right-3 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-2xl font-bold shadow-lg hover:bg-white active:scale-90 transition-all">›</button>
                      <div className="absolute right-4 top-4 z-20 rounded-full bg-black/40 px-3 py-1 text-xs font-bold text-white backdrop-blur">{stopPhotoIdx + 1} / {stopPhotos.length}</div>
                      <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5 z-20">{stopPhotos.map((_: any, i: number) => <button key={i} onClick={() => setStopPhotoIdx(i)} className={cn('h-1.5 rounded-full transition-all duration-300', i === stopPhotoIdx ? 'w-6 bg-white' : 'w-1.5 bg-white/50 hover:bg-white/80')} />)}</div>
                    </>
                  )}
                </>
              ) : <div className="flex h-full w-full items-center justify-center text-7xl">📍</div>}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute bottom-5 left-5 right-5">
                <h2 className="text-2xl font-extrabold leading-tight text-white drop-shadow-lg sm:text-3xl">{detailStop.placeName}</h2>
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-white/90">
                  {detailStop.rating && <span className="flex items-center gap-1"><Star className="h-4 w-4 fill-amber-400 text-amber-400" /><span className="font-extrabold">{detailStop.rating.toFixed(1)}</span></span>}
                  <span>{detailStop.time}</span>
                  <span className="font-extrabold text-white">{detailStop.currency} {detailStop.cost}</span>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="px-4 py-6 space-y-5">
              {/* Price + Category */}
              <div className="flex items-center justify-between rounded-2xl border border-[#E8D5C4] bg-white p-4">
                <div>
                  <p className="text-xs font-extrabold text-[#8B7355] uppercase tracking-wider">Estimated Cost</p>
                  <p className="text-2xl font-extrabold text-[#C4956A] mt-0.5">{detailStop.currency} {detailStop.cost}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-extrabold text-[#8B7355] uppercase tracking-wider">Category</p>
                  <p className="text-sm font-extrabold text-[#3C2415] mt-0.5">{detailStop.category}</p>
                </div>
              </div>

              {/* Address */}
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FDF0E0]"><MapPin className="h-5 w-5 text-[#C4956A]" /></div>
                <div><p className="text-xs font-extrabold text-[#8B7355] uppercase tracking-wider">Address</p><p className="text-sm font-bold text-[#3C2415] mt-0.5">{stopAddress}</p></div>
              </div>

              {/* Transport */}
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FDF0E0]"><Navigation className="h-5 w-5 text-[#C4956A]" /></div>
                <div><p className="text-xs font-extrabold text-[#8B7355] uppercase tracking-wider">Getting There</p><p className="text-sm font-bold text-[#3C2415] mt-0.5">{detailStop.transport}</p></div>
              </div>

              {/* Quick Links */}
              <div className="flex gap-2">
                {stopPhone && <a href={`tel:${stopPhone}`} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#FDF0E0] py-3 text-xs font-extrabold text-[#8B6914] hover:bg-[#F5EDE3] transition-colors">📞 Call</a>}
                {stopWebsite && <a href={stopWebsite} target="_blank" rel="noopener noreferrer" className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#FDF0E0] py-3 text-xs font-extrabold text-[#8B6914] hover:bg-[#F5EDE3] transition-colors">🌐 Website</a>}
                {detailStop.placeId && <a href={`https://www.google.com/maps/place/?q=place_id:${detailStop.placeId}`} target="_blank" rel="noopener noreferrer" className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#FDF0E0] py-3 text-xs font-extrabold text-[#8B6914] hover:bg-[#F5EDE3] transition-colors">🗺️ Maps</a>}
              </div>

              {/* Google Reviews */}
              {stopReviews.length > 0 && (
                <div>
                  <p className="text-xs font-extrabold text-[#8B7355] uppercase tracking-wider mb-3">Google Reviews</p>
                  <div className="space-y-2">{stopReviews.slice(0, 5).map((r: any, i: number) => (
                    <div key={i} className="rounded-xl border border-[#E8D5C4] bg-white p-3.5">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FDF0E0] text-xs font-extrabold text-[#C4956A]">{r.author?.[0] || '?'}</div>
                        <span className="text-sm font-extrabold text-[#3C2415]">{r.author}</span>
                        <span className="text-xs text-[#A08970]">{r.time}</span>
                        <div className="ml-auto flex gap-0.5">{[...Array(5)].map((_, j) => <Star key={j} className={cn('h-3 w-3', j < r.rating ? 'fill-amber-400 text-amber-400' : 'text-[#D4C4B0]')} />)}</div>
                      </div>
                      <p className="text-sm text-[#8B7355] mt-2 leading-relaxed">{r.text}</p>
                    </div>
                  ))}</div>
                </div>
              )}

              {/* Google Maps Button */}
              {detailStop.placeId && (
                <a href={`https://www.google.com/maps/place/?q=place_id:${detailStop.placeId}`} target="_blank" rel="noopener noreferrer"
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#C4956A] py-3.5 text-sm font-extrabold text-white shadow-lg shadow-[#C4956A]/25 hover:bg-[#B8860B] transition-all active:scale-95">
                  <Navigation className="h-4 w-4" />Open in Google Maps
                </a>
              )}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-dvh bg-[#FFFDF7]">
        <TopBar title="Your Trip" showBack onBack={() => setPlan(null)} />
        <div className="px-4 pt-20 pb-28 space-y-5">
          <div className="rounded-3xl bg-gradient-to-br from-[#C4956A] via-[#D4A574] to-[#B8860B] p-6 text-white shadow-2xl shadow-[#C4956A]/30 animate-scale-in">
            <div className="flex items-center gap-2"><Sparkles className="h-5 w-5" /><p className="text-sm font-medium text-white/80">AI-Generated Itinerary</p></div>
            <h2 className="mt-1.5 text-2xl font-extrabold">{plan.title}</h2>
            <p className="text-white/70 text-sm">{plan.destination}</p>
            <div className="mt-4 grid grid-cols-3 gap-3">
              {[{ l: 'Est. Cost', v: `${plan.currency || 'RM'} ${plan.totalCost}` }, { l: 'Budget', v: `${plan.currency || 'RM'} ${plan.totalBudget}` }, { l: 'Stops', v: plan.days.reduce((s, d) => s + d.stops.length, 0) }].map(m => (
                <div key={m.l} className="rounded-2xl bg-white/15 backdrop-blur p-3 text-center"><p className="text-xl font-extrabold">{m.v}</p><p className="text-[10px] text-white/70">{m.l}</p></div>
              ))}
            </div>
            {plan.totalCost > plan.totalBudget ? <p className="mt-3 text-xs bg-amber-500/20 rounded-xl px-3 py-2">⚠️ Over budget by RM {plan.totalCost - plan.totalBudget}</p>
              : <p className="mt-3 text-xs bg-emerald-500/20 rounded-xl px-3 py-2">✅ Within your budget!</p>}
          </div>

          {plan.days.map(day => (
            <div key={day.day} className="overflow-hidden rounded-2xl border border-[#E8D5C4] bg-white shadow-sm animate-fade-in-up">
              <button onClick={() => setExpanded(expanded === day.day ? null : day.day)} className="flex w-full items-center gap-4 p-4 text-left hover:bg-[#FDF0E0]/30 transition-colors">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#FDF0E0] text-base font-extrabold text-[#C4956A]">{day.day}</div>
                <div className="min-w-0 flex-1"><p className="text-sm font-extrabold text-[#3C2415]">{day.theme}</p><p className="text-xs text-[#8B7355] mt-0.5">{day.stops.length} stops · RM {day.dayTotalCost}</p></div>
                <ChevronRight className={cn('h-5 w-5 text-[#D4C4B0] transition-transform', expanded === day.day && 'rotate-90')} />
              </button>
              {expanded === day.day && (
                <div className="border-t border-[#E8D5C4] px-4 py-4">
                  <div className="relative space-y-0 pl-6 before:absolute before:left-[7px] before:top-1 before:h-[calc(100%-12px)] before:w-0.5 before:bg-[#E8D5C4]">
                    {day.stops.map((s, i) => (
                      <button key={i} onClick={() => setDetailStop(s)} className="relative pb-4 last:pb-0 w-full text-left block group">
                        <div className={cn('absolute -left-[18px] top-1.5 flex h-4 w-4 items-center justify-center rounded-full ring-2 ring-white text-[10px]', i === 0 ? 'bg-[#C4956A] text-white' : i === day.stops.length - 1 ? 'bg-emerald-500 text-white' : 'bg-white text-[#C4956A] ring-[#E8D5C4]')}>{i === 0 ? '▶' : i === day.stops.length - 1 ? '●' : ''}</div>
                        <div className="rounded-xl border border-[#E8D5C4] bg-[#FFFDF7] hover:border-[#C4956A]/40 hover:shadow-md transition-all cursor-pointer overflow-hidden">
                          <div className="flex gap-3">
                            {s.photos?.[0] && <div className="h-[80px] w-[80px] shrink-0 overflow-hidden"><img src={s.photos[0]} alt={s.placeName} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" /></div>}
                            <div className="flex-1 p-3.5 min-w-0">
                              <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="text-xs font-bold text-[#8B7355]">{s.time} · {s.category}</p><p className="text-sm font-extrabold text-[#3C2415] mt-1">{s.placeName}</p><p className="text-xs text-[#8B7355] mt-0.5">{s.description}</p></div><span className="shrink-0 rounded-full bg-[#FDF0E0] px-2.5 py-1 text-xs font-extrabold text-[#8B6914]">{s.currency} {s.cost}</span></div>
                              <div className="flex items-center gap-2 mt-2">
                                <p className="text-[10px] text-[#A08970]">{s.transport}</p>
                                {s.rating && <p className="text-[10px] text-amber-500">⭐ {s.rating.toFixed(1)}</p>}
                                <ChevronRight className="h-3 w-3 text-[#D4C4B0] ml-auto" />
                              </div>
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}

          {plan.tips?.length > 0 && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4"><p className="text-sm font-extrabold text-amber-800">💡 Local Tips</p><ul className="mt-2 space-y-1.5">{plan.tips.map((t, i) => <li key={i} className="text-xs text-amber-700 flex gap-2"><span>•</span>{t}</li>)}</ul></div>
          )}
          <div className="flex gap-2 pb-4">
            <button onClick={() => setPlan(null)} className="flex-1 rounded-xl border border-[#E8D5C4] bg-white py-3 text-sm font-extrabold text-[#3C2415] hover:bg-[#FDF0E0]"><RefreshCw className="inline h-4 w-4 mr-1.5" />Modify</button>
            <button onClick={async () => {
              const token = localStorage.getItem('accessToken');
              if (!token || !plan) return;
              await fetch('http://localhost:3001/api/v1/auth/me/trips', {
                method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ title: plan.title, destination: plan.destination, days: plan.days?.length || 2, totalCost: plan.totalCost, startDate: new Date().toISOString().split('T')[0], endDate: new Date().toISOString().split('T')[0] }),
              });
              toast.success('Trip saved! View in My Trips');
            }} className="flex-1 rounded-xl border border-[#E8D5C4] bg-white py-3 text-sm font-extrabold text-[#3C2415] hover:bg-[#FDF0E0]"><Bookmark className="inline h-4 w-4 mr-1.5" />Save</button>
            <button onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success('Link copied!'); }} className="flex-1 rounded-xl border border-[#E8D5C4] bg-white py-3 text-sm font-extrabold text-[#3C2415] hover:bg-[#FDF0E0]"><Share2 className="inline h-4 w-4 mr-1.5" />Share</button>
          </div>
        </div>
      </div>
    );
  }

  // Input form
  return (
    <div className="min-h-dvh bg-[#FFFDF7]">
      <TopBar title="AI Trip Planner" showBack backHref="/explore" />
      <div className="px-4 pt-20 pb-28 space-y-6">
        <div className="text-center animate-fade-in-up">
          <div className="mx-auto mb-3 inline-flex items-center gap-2 rounded-full bg-[#FDF0E0] px-4 py-1.5">
            <Globe className="h-4 w-4 text-[#C4956A]" /><span className="text-sm font-extrabold text-[#8B6914]">Worldwide</span>
          </div>
          <h1 className="text-3xl font-extrabold text-[#3C2415]">Plan Your Trip</h1>
          <p className="mt-1 text-sm text-[#8B7355]">Select a destination anywhere in the world</p>
        </div>

        {/* Destination Selector — by Region */}
        <div>
          <p className="mb-3 text-[11px] font-extrabold text-[#8B7355] uppercase tracking-widest">Select Destination</p>
          {/* Search bar */}
          <div className="relative mb-4">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A08970]" />
            <input value={dest} onChange={e => setDest(e.target.value)} placeholder="Or type any city name..."
              className="w-full rounded-2xl border-2 border-[#E8D5C4] bg-white py-3.5 pl-11 pr-4 text-sm font-bold text-[#3C2415] outline-none placeholder:text-[#A08970] focus:border-[#C4956A] focus:ring-4 focus:ring-[#C4956A]/10 transition-all" />
          </div>
          {/* Region + City lists */}
          <div className="space-y-3">
            {REGIONS.map(region => (
              <div key={region.name} className="rounded-2xl border border-[#E8D5C4] bg-white p-3">
                <p className="text-xs font-extrabold text-[#8B7355] mb-2 px-1">{region.name}</p>
                <div className="flex flex-wrap gap-2">
                  {region.cities.map(city => (
                    <button key={city.n} onClick={() => { selectDest(city.n); setTimeout(() => generate(city.n), 100); }}
                      className={cn('flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-bold transition-all active:scale-95',
                        dest === city.n ? 'border-[#C4956A] bg-[#C4956A] text-white shadow' : 'border-[#E8D5C4] bg-[#FFFDF7] text-[#3C2415] hover:border-[#C4956A]/40 hover:bg-[#FDF0E0]')}>
                      {city.c} {city.n}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={e => { e.preventDefault(); generate(); }} className="space-y-5">
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-sm font-extrabold text-[#3C2415]"><DollarSign className="h-4 w-4 text-amber-500" />Budget (MYR)</label>
            <div className="flex gap-2 mb-2">
              {[{ l: 'Budget', v: 200 }, { l: 'Mid', v: 500 }, { l: 'Premium', v: 1500 }, { l: 'Luxury', v: 5000 }].map(p => (
                <button key={p.l} type="button" onClick={() => setBudget(p.v)}
                  className={cn('flex-1 rounded-xl border-2 py-2 text-xs font-extrabold transition-all active:scale-95',
                    budget === p.v ? 'border-[#C4956A] bg-[#FDF0E0] text-[#8B6914]' : 'border-[#E8D5C4] bg-white text-[#8B7355] hover:border-[#C4956A]/40')}>
                  {p.l}<br />RM{p.v}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 rounded-2xl border-2 border-[#E8D5C4] bg-white px-4 py-3">
              <span className="text-lg font-bold text-[#A08970]">RM</span>
              <input type="number" value={budget} onChange={e => setBudget(Number(e.target.value))} min={50} max={50000} step={50} className="w-full bg-transparent text-lg font-extrabold text-[#3C2415] outline-none" />
            </div>
          </div>
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-sm font-extrabold text-[#3C2415]"><Calendar className="h-4 w-4 text-emerald-500" />Duration</label>
            <div className="flex items-center gap-4 rounded-2xl border-2 border-[#E8D5C4] bg-white px-4 py-3">
              <button type="button" onClick={() => setDuration(Math.max(1, duration - 1))} className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-[#E8D5C4] bg-[#FDF0E0] text-[#3C2415] hover:bg-[#F5EDE3] active:scale-95 transition-all"><Minus className="h-5 w-5" /></button>
              <span className="flex-1 text-center text-xl font-extrabold text-[#3C2415]">{duration} {duration === 1 ? 'Day' : 'Days'}</span>
              <button type="button" onClick={() => setDuration(Math.min(14, duration + 1))} className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-[#E8D5C4] bg-[#FDF0E0] text-[#3C2415] hover:bg-[#F5EDE3] active:scale-95 transition-all"><Plus className="h-5 w-5" /></button>
            </div>
          </div>
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-sm font-extrabold text-[#3C2415]"><Heart className="h-4 w-4 text-pink-500" />Your Interests</label>
            <div className="flex flex-wrap gap-2">
              {INTERESTS.map(o => {
                const sel = interests.includes(o.i);
                return (
                  <button key={o.i} type="button" onClick={() => setInterests(p => sel ? p.filter(x => x !== o.i) : [...p, o.i])}
                    className={cn('flex items-center gap-1.5 rounded-full border-2 px-4 py-2.5 text-sm font-extrabold transition-all active:scale-95',
                      sel ? 'border-[#C4956A] bg-[#C4956A] text-white shadow-lg shadow-[#C4956A]/20' : 'border-[#E8D5C4] bg-white text-[#8B7355] hover:border-[#C4956A]/40 hover:bg-[#FDF0E0]')}>
                    <o.I className="h-4 w-4" />{o.l}
                  </button>
                );
              })}
            </div>
          </div>
          <button type="submit" className="w-full rounded-2xl bg-gradient-to-r from-[#C4956A] to-[#D4A574] py-4 text-base font-extrabold text-white shadow-xl shadow-[#C4956A]/25 hover:shadow-2xl hover:shadow-[#C4956A]/30 transition-all active:scale-[0.98]">
            <Sparkles className="inline h-5 w-5 mr-2" />Generate My Trip Plan
          </button>
        </form>
      </div>
    </div>
  );
}
