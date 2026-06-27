// @ts-nocheck
'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Heart, Link2, Unlink2, Sparkles, MapPin, Calendar, Wallet, Zap, X, Navigation, Camera, BookOpen, ChevronRight, Plus, Clock, Star, Trash2, CheckCircle2, Circle, CalendarDays } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ImageViewer } from '@/components/shared/image-viewer';
import { toast } from 'sonner';

const COUPLE_KEY = 'couple_data';
const WALLET_KEY = 'couple_wallet';
const JOURNALS_KEY = 'couple_journals';

function lc(): any { try { return JSON.parse(localStorage.getItem(COUPLE_KEY) || '{}'); } catch { return {}; } }
function sc(d: any) { localStorage.setItem(COUPLE_KEY, JSON.stringify(d)); }
function lw(): any[] { try { return JSON.parse(localStorage.getItem(WALLET_KEY) || '[]'); } catch { return []; } }
function sw(d: any[]) { localStorage.setItem(WALLET_KEY, JSON.stringify(d)); }
function lj(): any[] { try { return JSON.parse(localStorage.getItem(JOURNALS_KEY) || '[]'); } catch { return []; } }
function sj(d: any[]) { localStorage.setItem(JOURNALS_KEY, JSON.stringify(d)); }

const MY_CITIES = [
  'Kuala Lumpur','George Town, Penang','Johor Bahru','Melaka','Ipoh, Perak','Langkawi, Kedah','Cameron Highlands, Pahang',
  'Kota Kinabalu, Sabah','Kuching, Sarawak','Kuantan, Pahang','Kuala Terengganu','Putrajaya','Petaling Jaya, Selangor',
  'Shah Alam, Selangor','Seremban, N. Sembilan','Alor Setar, Kedah','Kota Bharu, Kelantan','Port Dickson',
  'Genting Highlands, Pahang',"Fraser's Hill, Pahang",'Miri, Sarawak','Sandakan, Sabah','Pulau Perhentian','Pulau Redang','Pulau Tioman','Sekinchan, Selangor','Taiping, Perak','Batu Pahat, Johor',
];

const GOAL_COLORS = [
  { k:'pink', bg:'from-pink-500 to-rose-500', l:'#EC4899' },
  { k:'amber', bg:'from-amber-500 to-orange-500', l:'#F59E0B' },
  { k:'blue', bg:'from-blue-500 to-indigo-500', l:'#3B82F6' },
  { k:'green', bg:'from-emerald-500 to-teal-500', l:'#10B981' },
  { k:'purple', bg:'from-purple-500 to-violet-500', l:'#8B5CF6' },
  { k:'coral', bg:'from-rose-400 to-pink-500', l:'#F43F5E' },
];

// ─── Compatibility Level ───
function getLevel(pct: number) {
  if (pct >= 85) return { n:'Power Couple 💫', color:'#8B5CF6', bg:'bg-purple-50', t:'text-purple-600' };
  if (pct >= 65) return { n:'Committed ❤️', color:'#EC4899', bg:'bg-pink-50', t:'text-pink-600' };
  if (pct >= 40) return { n:'Building 🏗️', color:'#F59E0B', bg:'bg-amber-50', t:'text-amber-600' };
  return { n:'New Couple 🌱', color:'#10B981', bg:'bg-emerald-50', t:'text-emerald-600' };
}

// ─── Animated Counter ───
function AnimatedCount({ value, duration = 800 }: { value: number; duration?: number }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let s = 0; const step = Math.ceil(value / (duration / 16));
    const t = setInterval(() => { s += step; if (s >= value) { setV(value); clearInterval(t); } else setV(s); }, 16);
    return () => clearInterval(t);
  }, [value, duration]);
  return <span>{v}</span>;
}

export default function CoupleDashboard() {
  const [hydrated, setHydrated] = useState(false);
  const [couple, setCouple] = useState<any>({});
  const [partner, setPartner] = useState<any>(null);
  const [anniv, setAnniv] = useState<any>(null);
  const [tab, setTab] = useState<'dashboard' | 'timeline' | 'gallery'>('dashboard');
  const [detailSheet, setDetailSheet] = useState<{ title: string; type: string; items: any[] } | null>(null);
  const [linkEmail, setLinkEmail] = useState('');
  const [msg, setMsg] = useState('');
  const [isNewCouple, setIsNewCouple] = useState(false);

  // ─── Data Loading (via useEffect to avoid SSR hydration mismatch) ───
  const [savedTrips, setSavedTrips] = useState<any[]>([]);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [gallery, setGallery] = useState<any[]>([]);
  const [walletGoals, setWalletGoals] = useState<any[]>([]);
  const [journals, setJournals] = useState<any[]>([]);

  useEffect(() => {
    const d = lc();
    setCouple(d);
    setPartner(d.partner || null);
    setAnniv(d.anniversary || null);
    setGallery(d.gallery || []);

    const allSaved = (() => { try { return JSON.parse(localStorage.getItem('saved_trips') || '[]'); } catch { return []; } })();
    const st = allSaved.filter((t: any) =>
      t.groupType === 'COUPLE' || t.walletType === 'COUPLE' || t.type === 'date' ||
      (t.fullPlan?.groupType === 'COUPLE') || (t.fullPlan?.walletType === 'COUPLE')
    );
    setSavedTrips(st);

    const wg = lw();
    setWalletGoals(wg);
    const jn = lj();
    setJournals(jn);

    const tl = [
      ...(d.timeline || []),
      ...st.map((t: any) => ({
        ...t, id: t.id || t.savedAt, title: t.title || 'Trip', date: t.savedAt || t.startDate,
        shared: true, type: t.type || 'trip', category: 'trip', emoji: t.type === 'date' ? '💕' : '✈️',
      })),
      ...wg.map((g: any) => ({
        ...g, id: g.id, title: `🎯 Goal: ${g.title}`, date: g.createdAt, shared: true,
        type: 'goal', category: 'goal', emoji: '💰',
      })),
    ].sort((a: any, b: any) => new Date(b.date || b.createdAt || 0).getTime() - new Date(a.date || a.createdAt || 0).getTime());
    setTimeline(tl);

    setHydrated(true);
  }, []);

  // ─── Compatibility Engine ───
  const uniqueCities = new Set(savedTrips.map((t: any) => t.destination?.toLowerCase()).filter(Boolean));
  const totalPhotos = (couple.gallery || []).length;
  const totalJournals = journals.length;
  const totalGoals = walletGoals.length;
  const completedGoals = walletGoals.filter((g: any) => (g.currentAmount || 0) >= (g.targetAmount || 0)).length;

  const compat = partner ? {
    overall: Math.min(96, 60 + (anniv?.years || 0) * 4 + savedTrips.length * 3 + totalPhotos + totalJournals),
    travelScore: Math.min(95, 55 + savedTrips.length * 5 + uniqueCities.size * 3),
    memoryScore: Math.min(95, 45 + totalPhotos * 2 + totalJournals * 3),
    goalScore: Math.min(95, 40 + completedGoals * 10 + totalGoals * 3),
    sharedCities: uniqueCities.size,
    totalCities: uniqueCities.size,
    userTrips: savedTrips.length,
    partnerTrips: 0,
    totalPhotos,
    totalJournals,
    totalGoals,
    completedGoals,
  } : null;

  const level = compat ? getLevel(compat.overall) : null;

  // ─── Partner Linking ───
  const linkPartner = () => {
    if (!linkEmail.trim()) { setMsg('Enter your partner email'); return; }
    const p = { email: linkEmail, name: linkEmail.split('@')[0], linkedAt: new Date().toISOString(), avatar: '' };
    setPartner(p);
    sc({ ...lc(), partner: p });
    setLinkEmail(''); setMsg(''); setIsNewCouple(true);
    toast.success('💑 Partner linked! Welcome to Couple Space');
    setTimeout(() => setIsNewCouple(false), 5000);
  };
  const unlinkPartner = () => {
    if (!confirm('Unlink your partner? This will clear shared data.')) return;
    setPartner(null); setAnniv(null);
    sc({ ...lc(), partner: null, anniversary: null });
    toast('Partner unlinked');
  };
  const setAnniversary = () => {
    const date = prompt('Anniversary date (YYYY-MM-DD):', anniv?.date || '');
    if (!date) return;
    const y = new Date().getFullYear() - new Date(date).getFullYear();
    const a = { date, years: y, days: y * 365, months: y * 12 };
    setAnniv(a);
    sc({ ...lc(), anniversary: a });
    toast.success('💍 Anniversary saved!');
  };

  // ─── Gallery ───
  const [galleryViewIdx, setGalleryViewIdx] = useState(0);
  const [galleryFullscreen, setGalleryFullscreen] = useState(false);
  const [viewImages, setViewImages] = useState<string[] | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoCaption, setPhotoCaption] = useState('');
  const [photoLocation, setPhotoLocation] = useState('');

  const uploadPhotos = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploadingPhoto(true);
    const newPhotos: any[] = [];
    let loaded = 0;
    files.forEach(file => {
      const r = new FileReader();
      r.onload = () => {
        newPhotos.push({
          id: 'g_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
          url: r.result, date: new Date().toISOString(),
          caption: photoCaption || '', location: photoLocation || '',
          liked: false,
        });
        loaded++;
        if (loaded === files.length) {
          const updated = [...newPhotos, ...gallery];
          setGallery(updated);
          sc({ ...lc(), gallery: updated });
          setUploadingPhoto(false);
          setPhotoCaption(''); setPhotoLocation('');
          toast.success(`📸 ${files.length} photo${files.length > 1 ? 's' : ''} uploaded!`);
        }
      };
      r.readAsDataURL(file);
    });
  };

  const toggleLikePhoto = (photoId: string) => {
    const updated = gallery.map(p => p.id === photoId ? { ...p, liked: !p.liked } : p);
    setGallery(updated); sc({ ...lc(), gallery: updated });
  };
  const deletePhoto = (photoId: string) => {
    const updated = gallery.filter(p => p.id !== photoId);
    setGallery(updated); sc({ ...lc(), gallery: updated });
    toast('Photo deleted');
  };

  // ─── Timeline Events ───
  const [newEvent, setNewEvent] = useState({ title: '', date: '', category: 'milestone', emoji: '💎' });
  const [showEventForm, setShowEventForm] = useState(false);
  const addTimelineEvent = () => {
    if (!newEvent.title) return;
    const event = { ...newEvent, id: 't_' + Date.now(), date: newEvent.date || new Date().toISOString().split('T')[0], shared: true };
    const updated = [event, ...timeline];
    setTimeline(updated);
    sc({ ...lc(), timeline: updated });
    setNewEvent({ title: '', date: '', category: 'milestone', emoji: '💎' });
    setShowEventForm(false);
    toast.success('✨ Event added to timeline!');
  };

  // ─── Timeline detail ───
  const [timelineDetail, setTimelineDetail] = useState<any>(null);
  const [timelineDayIdx, setTimelineDayIdx] = useState(0);

  // ─── Detail Sheet ───
  const openDetail = (title: string, type: string, items: any[]) => setDetailSheet({ title, type, items });

  // ─── Month Grouping ───
  const groupByMonth = (items: any[]) => {
    const groups: Record<string, any[]> = {};
    items.forEach(item => {
      const d = new Date(item.date || item.savedAt || item.createdAt || 0);
      if (isNaN(d.getTime())) return;
      const key = d.toLocaleDateString('en', { month: 'long', year: 'numeric' });
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    });
    return Object.entries(groups);
  };
  const timelineMonths = groupByMonth(timeline);

  const pName = partner?.displayName || partner?.name || 'Partner';

  // ─── NO PARTNER: Onboarding ───
  if (!partner) return (
    <div className="min-h-screen bg-[#FFFDF7]">
      <div className="px-5 pt-14 pb-6">
        <Link href="/profile" className="text-[#C4956A] text-[13px] font-semibold mb-3 block">← Back</Link>
        <h1 className="text-[28px] font-extrabold text-[#3C2415]">💑 Couple Space</h1>
        <p className="text-[13px] text-[#8B7355] mt-1">Plan, save & share memories together</p>
      </div>
      <div className="px-5 pb-24 space-y-4">
        {/* Benefits card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E8D5C4]">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-pink-100 to-rose-100 flex items-center justify-center mx-auto mb-4">
            <Heart className="h-10 w-10 text-pink-500" fill="currentColor" />
          </div>
          <h2 className="text-[20px] font-extrabold text-[#3C2415] text-center">Link Your Partner</h2>
          <p className="text-[12px] text-[#8B7355] mt-1 mb-6 text-center leading-relaxed">
            Share trips, save for goals together, collect memories, and build your couple timeline.
          </p>
          {/* Feature list */}
          <div className="space-y-2 mb-6">
            {[
              { e:'✈️', t:'Shared Trip Planning', d:'Plan weekend getaways & dates together' },
              { e:'💰', t:'Couple Wallet', d:'Save for dream trips with shared goals' },
              { e:'📸', t:'Memory Gallery', d:'Collect photos from every adventure' },
              { e:'📝', t:'Travel Journal', d:'Write about your shared experiences' },
              { e:'🏆', t:'Compatibility Score', d:'Watch your bond grow with every trip' },
            ].map(f => (
              <div key={f.t} className="flex items-start gap-3 p-3 bg-[#FDF8F5] rounded-xl">
                <span className="text-xl">{f.e}</span>
                <div><p className="text-[13px] font-bold text-[#3C2415]">{f.t}</p><p className="text-[11px] text-[#8B7355]">{f.d}</p></div>
              </div>
            ))}
          </div>
          {/* Email input */}
          <div className="bg-[#FDF8F5] rounded-xl p-4">
            <label className="text-[11px] font-bold text-[#8B7355] uppercase tracking-wider mb-2 block">Partner's Email</label>
            <input value={linkEmail} onChange={e => setLinkEmail(e.target.value)} placeholder="partner@email.com"
              className="w-full rounded-xl border-2 border-[#E8D5C4] bg-white py-3.5 px-4 text-[15px] font-semibold text-[#3C2415] placeholder:text-[#A08970] outline-none focus:border-[#C4956A] mb-3" />
            <button onClick={linkPartner} className="w-full py-3.5 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white font-extrabold flex items-center justify-center gap-2 shadow-lg shadow-pink-200">
              <Link2 className="h-4 w-4" /> Link Partner
            </button>
          </div>
          {msg && <p className="text-center text-[12px] mt-3 text-[#C4956A] font-medium">{msg}</p>}
        </div>
      </div>
    </div>
  );

  // ═══════════════════════════════════════════════════════════════════
  // MAIN DASHBOARD
  // ═══════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-[#FFFDF7]">
      {isNewCouple && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setIsNewCouple(false)}>
          <div className="text-center animate-bounce pointer-events-none">
            <span className="text-8xl block">💑</span>
            <p className="text-white text-2xl font-extrabold mt-4">You're Linked!</p>
            <p className="text-white/70 text-sm mt-1">Start building your couple story</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="px-5 pt-14 pb-4">
        <div className="flex items-center justify-between mb-3">
          <Link href="/profile" className="text-[#C4956A] text-[13px] font-semibold">← Back</Link>
          <div className="flex items-center gap-2">
            <button onClick={() => {
              const d = lc(); const st = allSavedTrips;
              setPartner(d.partner || null); setAnniv(d.anniversary || null);
              setGallery(d.gallery || []);
              const updated = [...(d.timeline || []), ...st.filter((t: any) => t.groupType === 'COUPLE' || t.walletType === 'COUPLE' || t.type === 'date').map((t: any) => ({ ...t, id: t.id || t.savedAt, title: t.title || 'Trip', date: t.savedAt || t.startDate, shared: true, type: t.type || 'trip', emoji: t.type === 'date' ? '💕' : '✈️' }))];
              setTimeline(updated);
            }} className="text-[11px] font-bold text-[#C4956A] bg-[#FDF0E0] rounded-full px-3 py-1">🔄 Refresh</button>
            <button onClick={setAnniversary} className="text-[11px] font-bold text-[#C4956A] bg-[#FDF0E0] rounded-full px-3 py-1">💍 {anniv ? `${anniv.years}y` : 'Anniv'}</button>
          </div>
        </div>

        {/* Partner Card */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#E8D5C4]/50 mb-4">
          <div className="flex items-center gap-4">
            <div className="flex -space-x-3">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center text-white text-xl font-extrabold ring-3 ring-white shadow-lg overflow-hidden">
                {partner?.avatarUrl ? <img src={partner.avatarUrl} className="w-full h-full object-cover" alt="" /> : (pName?.[0] || '?')}
              </div>
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-xl font-extrabold ring-3 ring-white shadow-lg overflow-hidden">
                Y
              </div>
            </div>
            <div className="flex-1">
              <h1 className="text-[20px] font-extrabold text-[#3C2415]">You & {pName}</h1>
              {anniv ? (
                <p className="text-[11px] text-[#8B7355]">
                  <Calendar className="h-3 w-3 inline mr-1" />
                  Together since {new Date(anniv.date).toLocaleDateString('en', { year:'numeric', month:'long', day:'numeric' })}
                  <span className="mx-1.5">·</span>
                  <span className="font-bold text-[#C4956A]">{anniv.years} year{anniv.years !== 1 ? 's' : ''}</span>
                </p>
              ) : (
                <button onClick={setAnniversary} className="text-[11px] text-[#C4956A] font-semibold mt-1">+ Set Anniversary</button>
              )}
            </div>
            <ChevronRight className="h-5 w-5 text-[#D4C4B0]" />
          </div>
          {/* Quick badges */}
          <div className="flex gap-2 mt-3">
            <span className="text-[9px] font-bold bg-green-50 text-green-600 rounded-full px-2.5 py-1">🟢 Linked</span>
            <span className="text-[9px] font-bold bg-[#FDF0E0] text-[#C4956A] rounded-full px-2.5 py-1">
              {partner.linkedAt ? `Since ${new Date(partner.linkedAt).toLocaleDateString('en', { month: 'short', year: 'numeric' })}` : 'Recently linked'}
            </span>
          </div>
        </div>

        {/* Compatibility Score Card — Animated Ring */}
        {compat && level && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#E8D5C4]/50 mb-4">
            <p className="text-[10px] font-bold text-[#8B7355] uppercase tracking-wider mb-4">
              <Zap className="h-3.5 w-3.5 inline mr-1 text-amber-500" />Compatibility Score
            </p>
            <div className="flex items-center gap-5">
              {/* Animated Ring */}
              <div className="relative w-[100px] h-[100px] flex-shrink-0">
                <svg className="w-[100px] h-[100px] -rotate-90" viewBox="0 0 64 64">
                  <circle cx="32" cy="32" r="28" fill="none" stroke="#F5EDE3" strokeWidth="5" />
                  <circle cx="32" cy="32" r="28" fill="none" stroke={level.color} strokeWidth="5" strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 28}`}
                    strokeDashoffset={`${2 * Math.PI * 28 * (1 - (compat.overall || 0) / 100)}`}
                    style={{ transition: 'stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1)' }} />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-[22px] font-extrabold" style={{ color: level.color }}><AnimatedCount value={compat.overall} /></span>
                  <span className="text-[8px] font-bold text-[#8B7355]">/100</span>
                </div>
              </div>
              {/* Level + Sub-stats */}
              <div className="flex-1 min-w-0">
                <div className={cn('rounded-full px-3 py-0.5 inline-block mb-3', level.bg)}>
                  <span className={cn('text-[10px] font-extrabold', level.t)}>{level.n}</span>
                </div>
                <div className="space-y-1.5">
                  {[
                    { l:'Travel Chemistry', v:compat.travelScore, c:'✈️' },
                    { l:'Memory Making', v:compat.memoryScore, c:'📸' },
                    { l:'Goal Progress', v:compat.goalScore, c:'🎯' },
                  ].map(d => (
                    <div key={d.l} className="flex items-center gap-2">
                      <span className="text-xs">{d.c}</span>
                      <span className="text-[10px] text-[#6B4D3A] min-w-[80px] truncate">{d.l}</span>
                      <div className="flex-1 h-1.5 bg-[#F5EDE3] rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700" style={{ width:`${d.v}%`, backgroundColor: level.color }} />
                      </div>
                      <span className="text-[9px] font-bold text-[#6B4D3A] w-8 text-right">{d.v}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex bg-[#F5EDE3] rounded-xl p-1 mb-4">
          {[{ v:'dashboard' as const, l:'🏠 Dashboard' }, { v:'timeline' as const, l:'🕰️ Timeline' }, { v:'gallery' as const, l:'📸 Gallery' }].map(t => (
            <button key={t.v} onClick={() => setTab(t.v)}
              className={cn('flex-1 py-2 text-[11px] font-bold rounded-lg transition-all',
                tab === t.v ? 'bg-white text-[#3C2415] shadow-sm' : 'text-[#8B7355] hover:text-[#3C2415]')}>{t.l}</button>
          ))}
        </div>
      </div>

      <div className="px-5 pb-24 space-y-4">
        {/* ═══ DASHBOARD TAB ═══ */}
        {tab === 'dashboard' && (
          <>
            {/* Stats Grid — 3x2 */}
            <div className="grid grid-cols-3 gap-2.5">
              {[
                { l:'Shared Cities', v:compat?.sharedCities||0, e:'🏙️', sub:`${savedTrips.length} trips`, type:'sharedCities', items: timeline.filter((t:any)=>t.shared) },
                { l:'Couple Trips', v:compat?.userTrips||0, e:'✈️', sub:`${anniv?.years ? anniv.years + 'y together' : 'This year'}`, type:'yourTrips', items:timeline },
                { l:'Memories', v:compat?.totalPhotos||0, e:'📸', sub:`${compat?.totalJournals||0} journals`, type:'photos', items:gallery },
                { l:'Wallet Goals', v:compat?.totalGoals||0, e:'💰', sub:`${compat?.completedGoals||0} completed`, type:'goals', items:walletGoals },
                { l:'Journals', v:compat?.totalJournals||0, e:'📝', sub:'Shared stories', type:'journals', items:journals },
                { l:"Partner's", v:compat?.partnerTrips||0, e:'🧳', sub:'Trips added', type:'partnerTrips', items:[] },
              ].map(s => (
                <div key={s.l} onClick={() => openDetail(s.l, s.type, s.items)}
                  className="bg-white rounded-2xl p-3.5 shadow-sm border border-[#E8D5C4]/50 text-center cursor-pointer hover:shadow-md hover:border-[#C4956A]/30 transition-all active:scale-[0.97] group">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#FDF0E0] to-[#FDF6ED] flex items-center justify-center mx-auto mb-1.5 group-hover:scale-110 transition-transform">
                    <span className="text-lg">{s.e}</span>
                  </div>
                  <p className="text-[22px] font-extrabold text-[#3C2415] leading-none"><AnimatedCount value={s.v} /></p>
                  <p className="text-[9px] font-bold text-[#8B7355] uppercase tracking-wide">{s.l}</p>
                  <p className="text-[8px] text-[#A08970] mt-0.5">{s.sub}</p>
                </div>
              ))}
            </div>

            {/* Quick Actions — Gradient Cards */}
            <div className="space-y-3">
              <Link href="/date" className="block bg-gradient-to-r from-pink-500 to-rose-600 rounded-2xl p-5 text-white shadow-lg shadow-pink-200 hover:shadow-xl transition-all active:scale-[0.99]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center"><Heart className="h-5 w-5" fill="currentColor" /></div>
                    <div><p className="text-[14px] font-extrabold">Plan a Date</p><p className="text-white/70 text-[11px]">AI-powered romantic date planner</p></div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-white/60" />
                </div>
              </Link>
              <Link href="/weekend-planner" className="block bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-5 text-white shadow-lg shadow-blue-200 hover:shadow-xl transition-all active:scale-[0.99]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center"><Sparkles className="h-5 w-5" /></div>
                    <div><p className="text-[14px] font-extrabold">Plan Weekend</p><p className="text-white/70 text-[11px]">Multi-day couple getaway itinerary</p></div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-white/60" />
                </div>
              </Link>
              <Link href="/profile/couple/wallet" className="block bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-5 text-white shadow-lg shadow-emerald-200 hover:shadow-xl transition-all active:scale-[0.99]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center"><Wallet className="h-5 w-5" /></div>
                    <div><p className="text-[14px] font-extrabold">Shared Wallet</p>
                      <p className="text-white/70 text-[11px]">{walletGoals.length > 0 ? `RM ${walletGoals.reduce((s:number,g:any)=>s+(g.currentAmount||0),0).toLocaleString()} saved · ${completedGoals}/${walletGoals.length} goals done` : 'Save for dream trips together'}</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-white/60" />
                </div>
              </Link>
              <Link href="/profile/couple/dates" className="block bg-gradient-to-r from-amber-500 to-orange-600 rounded-2xl p-5 text-white shadow-lg shadow-amber-200 hover:shadow-xl transition-all active:scale-[0.99]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center"><CalendarDays className="h-5 w-5" /></div>
                    <div><p className="text-[14px] font-extrabold">Date History</p><p className="text-white/70 text-[11px]">{savedTrips.filter((t:any)=>t.type==='date').length} dates planned · {savedTrips.filter((t:any)=>t.completed).length} done</p></div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-white/60" />
                </div>
              </Link>
            </div>

            <button onClick={unlinkPartner} className="w-full py-3 rounded-xl bg-red-50 text-red-500 text-[13px] font-bold flex items-center justify-center gap-2 hover:bg-red-100 transition-colors">
              <Unlink2 className="h-4 w-4" /> Unlink Partner
            </button>
          </>
        )}

        {/* ═══ TIMELINE TAB ═══ */}
        {tab === 'timeline' && (
          <div>
            {/* Add event */}
            <div className="mb-4">
              {!showEventForm ? (
                <button onClick={() => setShowEventForm(true)}
                  className="w-full py-3 rounded-xl border-2 border-dashed border-[#D4C4B0] text-[#C4956A] text-[13px] font-bold flex items-center justify-center gap-2 hover:bg-[#FDF6ED] transition-colors">
                  <Plus className="h-4 w-4" /> Add Memory / Milestone
                </button>
              ) : (
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#E8D5C4]/50">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[13px] font-extrabold text-[#3C2415]">✨ New Memory</p>
                    <button onClick={() => setShowEventForm(false)}><X className="h-4 w-4 text-[#8B7355]" /></button>
                  </div>
                  <div className="space-y-2">
                    <input value={newEvent.title} onChange={e => setNewEvent(p => ({ ...p, title: e.target.value }))}
                      placeholder="Title (e.g. First trip to Penang)" className="w-full rounded-xl border border-[#E8D5C4] px-3 py-2.5 text-[14px] font-semibold outline-none focus:border-[#C4956A]" />
                    <div className="flex gap-2">
                      <input type="date" value={newEvent.date} onChange={e => setNewEvent(p => ({ ...p, date: e.target.value }))}
                        className="flex-1 rounded-xl border border-[#E8D5C4] px-3 py-2.5 text-[13px] outline-none focus:border-[#C4956A]" />
                      <select value={newEvent.category} onChange={e => setNewEvent(p => ({ ...p, category: e.target.value }))}
                        className="rounded-xl border border-[#E8D5C4] px-3 py-2.5 text-[13px] outline-none focus:border-[#C4956A] bg-white">
                        <option value="milestone">💎 Milestone</option>
                        <option value="trip">✈️ Trip</option>
                        <option value="date">💕 Date</option>
                        <option value="other">📌 Other</option>
                      </select>
                    </div>
                    <button onClick={addTimelineEvent}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#C4956A] to-[#D4A95F] text-white text-[13px] font-extrabold">Add to Timeline</button>
                  </div>
                </div>
              )}
            </div>

            {/* Timeline by month */}
            {timeline.length === 0 ? (
              <div className="text-center py-16">
                <span className="text-6xl block mb-4">🕰️</span>
                <p className="text-[#3C2415] font-extrabold text-lg">No memories yet</p>
                <p className="text-[#8B7355] text-sm mt-1">Plan a date or weekend trip to start your timeline</p>
                <Link href="/date" className="inline-flex items-center gap-2 mt-4 px-6 py-2.5 bg-pink-500 text-white rounded-xl font-bold text-sm">💕 Plan a Date</Link>
              </div>
            ) : (
              <div className="relative">
                {timelineMonths.map(([month, items]) => (
                  <div key={month} className="mb-6">
                    <h3 className="text-[13px] font-extrabold text-[#3C2415] mb-3 sticky top-0 bg-[#FFFDF7] py-1 z-10 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#C4956A]"></span>{month}
                      <span className="text-[10px] text-[#8B7355] font-normal">· {items.length} memories</span>
                    </h3>
                    <div className="relative ml-3 pl-6 border-l-2 border-[#F5EDE3] space-y-4">
                      {items.map((t: any, i: number) => {
                        const isNew = new Date(t.date || t.savedAt || 0).getTime() > Date.now() - 7 * 86400000;
                        const photoUrl = t.planStops?.[0]?.photoUrl || t.planDays?.[0]?.stops?.[0]?.photoUrl || t.fullPlan?.days?.[0]?.stops?.[0]?.photoUrl;
                        return (
                          <div key={t.id || i} className="relative group cursor-pointer"
                            onClick={() => {
                              if (t.type === 'goal') return;
                              setTimelineDetail(t); setTimelineDayIdx(0);
                            }}>
                            {/* Dot */}
                            <div className={cn('absolute -left-[29px] w-4 h-4 rounded-full border-2 border-white shadow-sm z-10',
                              t.type === 'date' ? 'bg-pink-400' : t.type === 'goal' ? 'bg-amber-400' : t.type === 'milestone' ? 'bg-purple-400' : 'bg-[#C4956A]')} />
                            {/* Card */}
                            <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#E8D5C4]/50 hover:shadow-md hover:border-[#C4956A]/30 transition-all">
                              {photoUrl && (
                                <div className="relative h-40 -mx-4 -mt-4 mb-3 rounded-t-2xl overflow-hidden">
                                  <img src={photoUrl} className="w-full h-full object-cover" alt="" />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                                  {isNew && <span className="absolute top-3 left-3 bg-pink-500 text-white text-[9px] font-bold rounded-full px-2 py-0.5">NEW</span>}
                                </div>
                              )}
                              <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h4 className="text-[14px] font-extrabold text-[#3C2415]">{t.title}</h4>
                                    <span className={cn('text-[9px] font-bold rounded-full px-2 py-0.5',
                                      t.type==='date' ? 'bg-pink-100 text-pink-600' :
                                      t.type==='goal' ? 'bg-amber-100 text-amber-600' :
                                      t.type==='milestone' ? 'bg-purple-100 text-purple-600' :
                                      'bg-blue-100 text-blue-600')}>
                                      {t.type==='date' ? '💕 Date' : t.type==='goal' ? '💰 Goal' : t.type==='milestone' ? '💎 Milestone' : '✈️ Trip'}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-[#8B7355] mt-1 flex items-center gap-2 flex-wrap">
                                    {t.destination || t.city ? <span><MapPin className="h-3 w-3 inline" /> {t.destination || t.city}</span> : null}
                                    <span><Calendar className="h-3 w-3 inline" /> {new Date(t.date || t.savedAt || t.startDate || 0).toLocaleDateString('en', { month:'short', day:'numeric', year:'numeric' })}</span>
                                    {t.totalCost ? <span className="font-bold text-[#7B5E3B]">RM {Math.round(t.totalCost)}</span> : null}
                                    {t.days ? <span>{t.days} day{t.days > 1 ? 's' : ''}</span> : null}
                                  </p>
                                </div>
                                <ChevronRight className="h-4 w-4 text-[#D4C4B0] flex-shrink-0 ml-2" />
                              </div>
                              {t.type === 'goal' && (
                                <div className="mt-2">
                                  <div className="flex justify-between text-[10px] text-[#8B7355] mb-1"><span>RM {(t.currentAmount||0).toLocaleString()}</span><span>RM {(t.targetAmount||0).toLocaleString()}</span></div>
                                  <div className="h-2 bg-[#F5EDE3] rounded-full overflow-hidden">
                                    <div className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full" style={{ width:`${Math.min(100,((t.currentAmount||0)/(t.targetAmount||1))*100)}%` }} />
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══ GALLERY TAB ═══ */}
        {tab === 'gallery' && (
          <div>
            {/* Upload */}
            <div className="mb-4">
              <label className="block bg-white rounded-2xl p-4 shadow-sm border-2 border-dashed border-[#D4C4B0] cursor-pointer hover:border-[#C4956A] hover:bg-[#FDF6ED] transition-all text-center">
                <input type="file" accept="image/*" multiple onChange={uploadPhotos} className="hidden" />
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-full bg-[#FDF0E0] flex items-center justify-center">
                    <Camera className="h-6 w-6 text-[#C4956A]" />
                  </div>
                  <p className="text-[13px] font-bold text-[#3C2415]">Upload Photos</p>
                  <p className="text-[10px] text-[#8B7355]">Tap to select · Multiple OK</p>
                  {uploadingPhoto && <div className="w-6 h-6 rounded-full border-2 border-[#C4956A]/30 border-t-[#C4956A] animate-spin" />}
                </div>
              </label>
              {/* Caption + Location fields */}
              {(photoCaption || photoLocation) ? null : null}
            </div>

            {gallery.length === 0 ? (
              <div className="text-center py-16">
                <span className="text-6xl block mb-4">📸</span>
                <p className="text-[#3C2415] font-extrabold text-lg">No photos yet</p>
                <p className="text-[#8B7355] text-sm mt-1">Upload your first couple memory</p>
              </div>
            ) : (
              <div className="columns-2 gap-2 space-y-2">
                {gallery.map((p: any, i: number) => (
                  <div key={p.id} className="break-inside-avoid relative group rounded-xl overflow-hidden bg-[#F5EDE3] cursor-pointer"
                    style={{ animationDelay: `${i * 50}ms` }}
                    onClick={() => { setGalleryViewIdx(i); setGalleryFullscreen(true); }}>
                    <img src={p.url} className="w-full h-auto object-cover" alt=""
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-end p-2 opacity-0 group-hover:opacity-100">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <button onClick={e => { e.stopPropagation(); toggleLikePhoto(p.id); }}
                          className={cn('p-1.5 rounded-full backdrop-blur-md', p.liked ? 'bg-pink-500 text-white' : 'bg-white/80 text-[#8B7355]')}>
                          <Heart className="h-3 w-3" fill={p.liked ? 'currentColor' : 'none'} />
                        </button>
                        <button onClick={e => { e.stopPropagation(); deletePhoto(p.id); }}
                          className="p-1.5 rounded-full bg-white/80 backdrop-blur-md text-red-400"><Trash2 className="h-3 w-3" /></button>
                      </div>
                    </div>
                    {p.liked && <div className="absolute top-2 right-2"><Heart className="h-4 w-4 text-pink-500" fill="currentColor" /></div>}
                    {p.date && <div className="absolute top-2 left-2 bg-black/40 backdrop-blur-md text-white text-[9px] rounded-full px-2 py-0.5">{new Date(p.date).toLocaleDateString('en',{month:'short',day:'numeric'})}</div>}
                    {isNewCouple && <div className="absolute bottom-2 left-2 bg-pink-500 text-white text-[9px] font-bold rounded-full px-2 py-0.5">NEW</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          DETAIL SHEET — Stat drilldown
          ═══════════════════════════════════════════════════════════════════ */}
      {detailSheet && (
        <div className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm flex items-end" onClick={() => setDetailSheet(null)}>
          <div className="w-full max-h-[85vh] bg-white rounded-t-[28px] shadow-2xl overflow-y-auto animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex justify-center pt-3 pb-2"><div className="w-10 h-1 rounded-full bg-gray-300" /></div>
            <div className="flex items-center justify-between px-5 pb-2">
              <h2 className="text-[20px] font-extrabold text-[#3C2415]">{detailSheet.title}</h2>
              <button onClick={() => setDetailSheet(null)}><X className="h-5 w-5 text-[#3C2415]" /></button>
            </div>
            <div className="p-5 space-y-3">
              {/* Photos */}
              {(detailSheet.type === 'photos' || detailSheet.type === 'gallery') && (
                detailSheet.items.length === 0 ? (
                  <div className="text-center py-10"><Camera className="h-10 w-10 mx-auto text-[#D4C4B0] mb-2" /><p className="text-[#8B7355]">No photos yet</p></div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {detailSheet.items.map((p: any, i: number) => (
                      <div key={i} className="aspect-square rounded-xl overflow-hidden bg-[#F5EDE3] relative group cursor-pointer"
                        onClick={() => { setGalleryViewIdx(i); setGalleryFullscreen(true); setDetailSheet(null); }}>
                        <img src={p.url} className="w-full h-full object-cover" alt="" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all" />
                        {p.location && <div className="absolute bottom-2 left-2 bg-black/50 text-white text-[10px] rounded-full px-2 py-0.5"><MapPin className="h-2.5 w-2.5 inline" /> {p.location}</div>}
                        {p.date && <div className="absolute top-2 right-2 bg-black/40 text-white text-[9px] rounded-full px-2 py-0.5">{new Date(p.date).toLocaleDateString('en',{month:'short',day:'numeric'})}</div>}
                      </div>
                    ))}
                  </div>
                )
              )}

              {/* Journals */}
              {detailSheet.type === 'journals' && (
                detailSheet.items.length === 0 ? (
                  <div className="text-center py-10"><BookOpen className="h-10 w-10 mx-auto text-[#D4C4B0] mb-2" /><p className="text-[#8B7355]">No journals yet</p></div>
                ) : (
                  detailSheet.items.map((j: any, i: number) => (
                    <div key={i} className="bg-[#FDF0E0] rounded-2xl p-4">
                      <div className="flex items-center gap-2 mb-1"><span className="text-xl">{j.mood || '📝'}</span><h3 className="text-[15px] font-extrabold text-[#3C2415]">{j.title}</h3></div>
                      {j.place && <p className="text-[11px] text-[#8B7355] flex items-center gap-1"><MapPin className="h-3 w-3" />{j.place} · {j.date}</p>}
                      <p className="text-[13px] text-[#6B4D3A] mt-2 leading-relaxed line-clamp-4">{j.content}</p>
                    </div>
                  ))
                )
              )}

              {/* Goals */}
              {detailSheet.type === 'goals' && (
                detailSheet.items.length === 0 ? (
                  <div className="text-center py-10"><Wallet className="h-10 w-10 mx-auto text-[#D4C4B0] mb-2" /><p className="text-[#8B7355]">No goals yet</p><Link href="/profile/couple/wallet" className="inline-block mt-3 px-4 py-2 bg-pink-500 text-white rounded-xl text-sm font-bold">Create Goal</Link></div>
                ) : (
                  detailSheet.items.map((g: any, i: number) => {
                    const gpct = Math.round(((g.currentAmount||0)/(g.targetAmount||1))*100);
                    const color = GOAL_COLORS[i % GOAL_COLORS.length];
                    return (
                      <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-[#E8D5C4]/50">
                        <div className="flex items-center gap-3">
                          <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center text-white text-lg', `bg-gradient-to-br ${color.bg}`)}>💰</div>
                          <div className="flex-1">
                            <p className="text-[14px] font-extrabold text-[#3C2415]">{g.title}</p>
                            <p className="text-[11px] text-[#8B7355]">RM {(g.currentAmount||0).toLocaleString()} / RM {(g.targetAmount||0).toLocaleString()}</p>
                          </div>
                          <span className="text-[13px] font-extrabold" style={{color:color.l}}>{gpct}%</span>
                        </div>
                        <div className="h-2 bg-[#F5EDE3] rounded-full overflow-hidden mt-2">
                          <div className="h-full rounded-full transition-all" style={{width:`${gpct}%`, backgroundColor:color.l}} />
                        </div>
                      </div>
                    );
                  })
                )
              )}

              {/* Trips / Cities */}
              {(detailSheet.type === 'yourTrips' || detailSheet.type === 'partnerTrips' || detailSheet.type === 'sharedCities' || detailSheet.type === 'totalCities') && (
                (detailSheet.items.length === 0 && timeline.length === 0) ? (
                  <div className="text-center py-10"><MapPin className="h-10 w-10 mx-auto text-[#D4C4B0] mb-2" /><p className="text-[#8B7355]">No trips yet</p><Link href="/weekend-planner" className="inline-block mt-3 px-4 py-2 bg-blue-500 text-white rounded-xl text-sm font-bold">Plan a Trip</Link></div>
                ) : (
                  (detailSheet.items.length > 0 ? detailSheet.items : timeline.filter(t => t.type !== 'goal')).map((t: any, i: number) => (
                    <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-[#E8D5C4]/50 hover:shadow-md cursor-pointer"
                      onClick={() => { setDetailSheet(null);
                        if (t.type !== 'goal') { setTimelineDetail(t); setTimelineDayIdx(0); }
                      }}>
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{t.emoji || '✈️'}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-[14px] font-extrabold text-[#3C2415] truncate">{t.title}</p>
                          <p className="text-[11px] text-[#8B7355] flex items-center gap-1"><MapPin className="h-3 w-3" />{t.destination || t.city || 'Unknown'} · {new Date(t.date || t.savedAt || 0).toLocaleDateString('en',{month:'short',day:'numeric'})}</p>
                        </div>
                        <button onClick={e => { e.stopPropagation(); window.open(`https://www.google.com/maps/search/${encodeURIComponent((t.destination || t.city || '') + ' travel')}`, '_blank'); }}
                          className="p-2 rounded-lg bg-[#FDF0E0] text-[#C4956A] hover:bg-[#F5E0C0]"><Navigation className="h-4 w-4" /></button>
                      </div>
                    </div>
                  ))
                )
              )}

              <button onClick={() => setDetailSheet(null)} className="w-full py-3 rounded-xl bg-gray-100 text-[#3C2415] text-sm font-bold mt-2">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          TIMELINE DETAIL — Trip/Date itinerary viewer
          ═══════════════════════════════════════════════════════════════════ */}
      {timelineDetail && !detailSheet && (() => {
        const td = timelineDetail;
        const fp = td.fullPlan || td.planData?.fullPlan || td;
        let days = fp.planDays || fp.days || [];
        if (days.length === 0 && fp.activities?.length > 0) {
          days = [{ dayNumber:1, theme: fp.dateType || 'Date', stops: fp.activities, date: td.startDate || td.date || '' }];
        }
        if (days.length === 0 && td.planStops) {
          const grouped: any = {};
          (td.planStops || []).forEach((s: any) => { const d = s.day || 1; if (!grouped[d]) grouped[d] = []; grouped[d].push(s); });
          days = Object.entries(grouped).map(([d, st]: any) => ({ dayNumber: parseInt(d), theme: `Day ${d}`, stops: st }));
        }
        const day = days[timelineDayIdx] || days[0];
        const dest = fp.destination || fp.city || td.destination || '';
        const totalStops = days.reduce((s: number, d: any) => s + (d.stops?.length || 0), 0);

        return (
          <div className="fixed inset-0 z-[9998] bg-[#FAFAF8] overflow-y-auto">
            {/* Header */}
            <div className="bg-gradient-to-br from-[#7B5E3B] via-[#D4B483] to-[#6B8E4E] px-5 pt-14 pb-6 text-white">
              <button onClick={() => setTimelineDetail(null)} className="text-white/70 text-[13px] font-semibold mb-3 flex items-center gap-1">← Back</button>
              <h1 className="text-[24px] font-extrabold leading-[1.15]">{td.title}</h1>
              <div className="flex items-center gap-3 text-[13px] text-white/70 mt-1.5">
                {dest && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {dest}</span>}
                <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {new Date(td.startDate || td.date || td.savedAt || 0).toLocaleDateString('en',{month:'short',day:'numeric',year:'numeric'})}</span>
              </div>
              <div className="flex gap-2 mt-3 flex-wrap">
                <span className="bg-white/20 rounded-full px-3.5 py-1.5 text-xs font-extrabold">RM {Math.round(td.totalCost || fp.totalCost || 0)}</span>
                <span className="bg-white/20 rounded-full px-3.5 py-1.5 text-xs font-semibold">{totalStops} stops</span>
                <span className="bg-white/20 rounded-full px-3.5 py-1.5 text-xs font-semibold">{days.length} day{days.length > 1 ? 's' : ''}</span>
                {td.completed && <span className="bg-green-400/30 rounded-full px-3.5 py-1.5 text-xs font-bold">✅ Done</span>}
              </div>
            </div>

            {/* Day selector */}
            {days.length > 1 && (
              <div className="sticky top-0 z-10 bg-[#FAFAF8]/90 backdrop-blur-xl border-b border-[#E5E7EB] px-5 py-2 flex gap-2 overflow-x-auto">
                {days.map((d: any, i: number) => (
                  <button key={i} onClick={() => setTimelineDayIdx(i)}
                    className={cn('flex-shrink-0 rounded-full px-4 py-2 text-[12px] font-bold transition-all',
                      timelineDayIdx === i ? 'bg-[#7B5E3B] text-white shadow-md' : 'bg-white text-[#5C4A3A] border border-[#E5E7EB]')}>
                    Day {d.dayNumber || i + 1}
                  </button>
                ))}
              </div>
            )}

            <div className="px-5 pt-4 pb-24">
              {day ? (
                <div>
                  <h3 className="text-[16px] font-extrabold text-[#1A1A1A] mb-4">{day.theme || `Day ${day.dayNumber || 1}`}</h3>
                  <div className="relative">
                    <div className="absolute left-[18px] top-2 bottom-2 w-0.5 bg-[#E5E7EB]" />
                    {day.stops?.map((s: any, idx: number) => (
                      <div key={idx} className="relative flex gap-4 mb-4">
                        <div className={cn('relative z-10 w-9 h-9 rounded-full flex items-center justify-center text-white text-[11px] font-extrabold shadow-md flex-shrink-0',
                          s.isHiddenGem ? 'bg-purple-500 ring-4 ring-purple-100' : s.isPhotoSpot ? 'bg-sky-500 ring-4 ring-sky-100' : 'bg-[#7B5E3B] ring-4 ring-amber-50')}>
                          {idx + 1}
                        </div>
                        <div className="flex-1 bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden">
                          {s.photoUrl ? (
                            <div className="h-44 overflow-hidden"><img src={s.photoUrl} className="w-full h-full object-cover" alt="" /></div>
                          ) : <div className="h-24 bg-[#FDF6ED] flex items-center justify-center text-4xl">{s.emoji || '📍'}</div>}
                          <div className="p-3">
                            <div className="flex items-start justify-between mb-1">
                              <h4 className="text-[14px] font-extrabold text-[#0E0E0E]">{s.placeName}</h4>
                              <div className="flex gap-1">{s.isHiddenGem && <span className="text-[8px] bg-purple-100 text-purple-600 rounded-full px-1.5 py-0.5">💎</span>}</div>
                            </div>
                            <p className="text-[11px] text-[#6B7280] line-clamp-2 mb-1">{s.description}</p>
                            <div className="flex items-center gap-2 text-[10px] text-[#9CA3AF]">
                              <span><Clock className="h-3 w-3 inline" /> {s.time || '?'}</span>
                              <span>{s.duration || '?'}</span>
                              <span className="font-bold text-[#7B5E3B]">RM {s.estimatedSpend || 0}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-10"><p className="text-[#8B7355]">No itinerary details available</p></div>
              )}

              {/* Budget Summary */}
              {td.budgetBreakdown && (
                <div className="mt-6 bg-white rounded-2xl p-4 shadow-sm border border-[#E5E7EB]">
                  <p className="text-[10px] font-bold text-[#8B7355] uppercase tracking-wider mb-3">💰 Budget Summary</p>
                  <div className="space-y-2">
                    {td.budgetBreakdown.hotel && <div className="flex justify-between text-[12px]"><span>🏨 Hotel</span><span className="font-bold">RM {Math.round(td.budgetBreakdown.hotel.estimatedCost || td.budgetBreakdown.hotel || 0)}</span></div>}
                    {td.budgetBreakdown.food && <div className="flex justify-between text-[12px]"><span>🍜 Food</span><span className="font-bold">RM {Math.round(td.budgetBreakdown.food.estimatedCost || td.budgetBreakdown.food || 0)}</span></div>}
                    {td.budgetBreakdown.transport && <div className="flex justify-between text-[12px]"><span>🚕 Transport</span><span className="font-bold">RM {Math.round(td.budgetBreakdown.transport.estimatedCost || td.budgetBreakdown.transport || 0)}</span></div>}
                    <hr className="border-[#E5E7EB]" />
                    <div className="flex justify-between text-[14px]"><span className="font-extrabold">Total</span><span className="font-extrabold text-[#7B5E3B]">RM {Math.round(td.totalCost || fp.totalCost || 0)}</span></div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="mt-4 flex gap-2">
                <a href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(dest)}`} target="_blank"
                  className="flex-1 py-3 rounded-xl bg-[#7B5E3B] text-white text-[13px] font-extrabold text-center"><Navigation className="h-4 w-4 inline mr-1" /> Navigate</a>
                <button onClick={() => {
                  const updated = savedTrips.map((t: any) => t.id === td.id || t.savedAt === td.savedAt ? { ...t, completed: !t.completed, completedAt: !t.completed ? new Date().toISOString() : null } : t);
                  localStorage.setItem('saved_trips', JSON.stringify(updated));
                  setTimelineDetail((p: any) => ({ ...p, completed: !p.completed }));
                  toast.success(td.completed ? 'Marked as incomplete' : '✅ Marked as completed!');
                }} className={cn('flex-1 py-3 rounded-xl text-[13px] font-extrabold text-center',
                  td.completed ? 'bg-green-50 text-green-600' : 'bg-white border-2 border-green-200 text-green-600')}>
                  {td.completed ? <><CheckCircle2 className="h-4 w-4 inline mr-1" /> Completed</> : <><Circle className="h-4 w-4 inline mr-1" /> Mark Done</>}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ═══════════════════════════════════════════════════════════════════
          GALLERY FULLSCREEN VIEWER
          ═══════════════════════════════════════════════════════════════════ */}
      {galleryFullscreen && gallery.length > 0 && (
        <div className="fixed inset-0 z-[99999] bg-black flex flex-col">
          {/* Top bar */}
          <div className="flex items-center justify-between px-4 py-3 safe-top">
            <button onClick={() => setGalleryFullscreen(false)} className="text-white p-2 hover:bg-white/10 rounded-full"><X className="h-6 w-6" /></button>
            <span className="text-white text-[13px] font-bold">{galleryViewIdx + 1} / {gallery.length}</span>
            <div className="flex gap-1">
              <button onClick={() => toggleLikePhoto(gallery[galleryViewIdx]?.id)}
                className={cn('p-2 rounded-full', gallery[galleryViewIdx]?.liked ? 'text-pink-500' : 'text-white hover:bg-white/10')}>
                <Heart className="h-5 w-5" fill={gallery[galleryViewIdx]?.liked ? 'currentColor' : 'none'} />
              </button>
              <button onClick={() => { deletePhoto(gallery[galleryViewIdx]?.id); setGalleryFullscreen(false); }}
                className="p-2 rounded-full text-white hover:bg-white/10"><Trash2 className="h-5 w-5" /></button>
            </div>
          </div>
          {/* Image */}
          <div className="flex-1 flex items-center justify-center" onClick={e => e.stopPropagation()}>
            <img src={gallery[galleryViewIdx]?.url} className="max-w-full max-h-[75vh] object-contain" alt="" />
          </div>
          {/* Nav buttons */}
          {gallery.length > 1 && (
            <>
              <button onClick={() => setGalleryViewIdx(p => (p - 1 + gallery.length) % gallery.length)}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 backdrop-blur text-white flex items-center justify-center">←</button>
              <button onClick={() => setGalleryViewIdx(p => (p + 1) % gallery.length)}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 backdrop-blur text-white flex items-center justify-center">→</button>
              <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-2">
                {gallery.map((_: any, i: number) => (
                  <button key={i} onClick={() => setGalleryViewIdx(i)}
                    className={cn('rounded-full transition-all', i === galleryViewIdx ? 'bg-white w-6 h-2' : 'bg-white/40 w-2 h-2')} />
                ))}
              </div>
            </>
          )}
          {/* Info bar */}
          {gallery[galleryViewIdx] && (
            <div className="px-4 py-3 bg-black/80 backdrop-blur">
              {gallery[galleryViewIdx].caption && <p className="text-white text-[13px] font-medium">{gallery[galleryViewIdx].caption}</p>}
              <div className="flex items-center gap-3 text-[11px] text-white/60 mt-0.5">
                {gallery[galleryViewIdx].location && <span><MapPin className="h-3 w-3 inline" /> {gallery[galleryViewIdx].location}</span>}
                {gallery[galleryViewIdx].date && <span>{new Date(gallery[galleryViewIdx].date).toLocaleDateString('en', { month:'long', day:'numeric', year:'numeric' })}</span>}
              </div>
            </div>
          )}
        </div>
      )}

      {viewImages && <ImageViewer images={viewImages} onClose={() => setViewImages(null)} alt="Memory photo" />}
    </div>
  );
}
