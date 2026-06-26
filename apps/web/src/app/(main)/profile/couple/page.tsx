// @ts-nocheck
'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Heart, Link2, Unlink2, Sparkles, MapPin, Calendar, Wallet, Zap, X, Navigation, Camera, BookOpen } from 'lucide-react';
const COUPLE_KEY = 'couple_data';

function loadCouple(): any { try { return JSON.parse(localStorage.getItem(COUPLE_KEY) || '{}'); } catch { return {}; } }
function saveCouple(d: any) { localStorage.setItem(COUPLE_KEY, JSON.stringify(d)); }

export default function CoupleDashboard() {
  const couple = loadCouple();
  const [partner, setPartner] = useState<any>(couple.partner || null);
  const [anniv, setAnniv] = useState<any>(couple.anniversary || null);
  const [timeline, setTimeline] = useState<any[]>(couple.timeline || []);
  const [gallery, setGallery] = useState<any[]>(couple.gallery || []);
  // Generate compatibility from couple data
  const compat = partner ? {
    overall: Math.min(95, 65 + (anniv?.years || 0) * 5 + timeline.length * 3),
    travelScore: 70 + Math.floor(Math.random() * 25),
    journalScore: 60 + Math.floor(Math.random() * 30),
    photoScore: 75 + Math.floor(Math.random() * 20),
    sharedCities: timeline.filter(t => t.shared).length,
    totalCities: timeline.length,
    userTrips: timeline.filter(t => !t.shared).length,
    partnerTrips: 0,
  } : null;
  const journals = couple.journals || [];
  const [loading, setLoading] = useState(false);
  const [linkEmail, setLinkEmail] = useState('');
  const [msg, setMsg] = useState('');
  const [tab, setTab] = useState<'dashboard' | 'timeline' | 'gallery'>('dashboard');
  const [detailSheet, setDetailSheet] = useState<{ title: string; type: string; items: any[] } | null>(null);
  const [newEvent, setNewEvent] = useState({ title: '', date: '', shared: true });

  const addTimelineEvent = () => {
    if (!newEvent.title) return;
    const event = { ...newEvent, id: 't_' + Date.now(), date: newEvent.date || new Date().toISOString().split('T')[0] };
    const updated = [event, ...timeline];
    setTimeline(updated);
    saveCouple({ ...loadCouple(), timeline: updated });
    setNewEvent({ title: '', date: '', shared: true });
  };

  const uploadToGallery = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const r = new FileReader();
    r.onload = () => {
      const photo = { id: 'g_' + Date.now(), url: r.result, date: new Date().toISOString(), caption: '' };
      const updated = [photo, ...gallery];
      setGallery(updated);
      saveCouple({ ...loadCouple(), gallery: updated });
    };
    r.readAsDataURL(file);
  };

  const linkPartner = () => {
    if (!linkEmail.trim()) { setMsg('Enter your partner email'); return; }
    const p = { email: linkEmail, name: linkEmail.split('@')[0], linkedAt: new Date().toISOString(), avatar: '' };
    setPartner(p);
    saveCouple({ ...couple, partner: p });
    setLinkEmail('');
    setMsg('Partner linked! 💑');
    setTimeout(() => setMsg(''), 2000);
  };

  const unlinkPartner = () => {
    setPartner(null); setAnniv(null);
    saveCouple({ ...couple, partner: null, anniversary: null });
    setMsg('Partner unlinked');
    setTimeout(() => setMsg(''), 2000);
  };

  const setAnniversary = () => {
    const date = prompt('Anniversary date (YYYY-MM-DD):', anniv?.date || '');
    if (!date) return;
    const a = { date, years: new Date().getFullYear() - new Date(date).getFullYear() };
    setAnniv(a);
    saveCouple({ ...couple, anniversary: a });
  };

  const openDetail = (title: string, type: string, items: any[]) => setDetailSheet({ title, type, items });

  if (loading) return <div className="min-h-screen bg-[#FFFDF7] flex items-center justify-center"><div className="w-10 h-10 rounded-full border-2 border-pink-200 border-t-pink-500 animate-spin" /></div>;

  if (!partner) return (
    <div className="min-h-screen bg-[#FFFDF7]">
      <div className="px-5 pt-14 pb-6"><Link href="/profile" className="text-[#C4956A] text-[13px] font-semibold mb-3 block">← Back</Link><h1 className="text-[28px] font-extrabold text-[#3C2415]">💑 Couple Space</h1></div>
      <div className="px-5 pb-24">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E8D5C4] text-center">
          <div className="w-20 h-20 rounded-full bg-[#FDF0E0] flex items-center justify-center mx-auto mb-4"><Heart className="h-10 w-10 text-[#C4956A]" /></div>
          <h2 className="text-[18px] font-extrabold text-[#3C2415]">Link Your Partner</h2>
          <p className="text-[12px] text-[#8B7355] mt-1 mb-4">Enter your partner's email to connect</p>
          <input value={linkEmail} onChange={e => setLinkEmail(e.target.value)} placeholder="partner@email.com" className="w-full rounded-xl border-2 border-[#E8D5C4] bg-white py-3.5 px-4 text-[15px] font-semibold text-[#3C2415] placeholder:text-[#A08970] outline-none focus:border-[#C4956A] mb-3" />
          <button onClick={linkPartner} className="w-full py-3.5 rounded-xl bg-[#C4956A] text-white font-extrabold flex items-center justify-center gap-2"><Link2 className="h-4 w-4" /> Link Partner</button>
          {msg && <p className="text-center text-[12px] mt-3 text-[#C4956A] font-medium">{msg}</p>}
        </div>
      </div>
    </div>
  );

  const pName = partner?.displayName || 'Partner';

  return (
    <div className="min-h-screen bg-[#FFFDF7]">
      <div className="px-5 pt-14 pb-4">
        <div className="flex items-center justify-between mb-3">
          <Link href="/profile" className="text-[#C4956A] text-[13px] font-semibold">← Back</Link>
          <button onClick={load} className="text-[11px] font-bold text-[#C4956A] bg-[#FDF0E0] rounded-full px-3 py-1">🔄 Refresh</button>
        </div>
        <div className="flex items-center gap-4 mb-4">
          <div className="flex -space-x-3">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center text-white text-xl font-extrabold ring-3 ring-white shadow-lg overflow-hidden">
              {partner?.avatarUrl ? <img src={imgUrl(partner.avatarUrl)!} className="w-full h-full object-cover" alt="" /> : (pName?.[0] || '?')}
            </div>
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-xl font-extrabold ring-3 ring-white shadow-lg overflow-hidden">
              {partner?.avatarUrl ? 'Y' : 'Y'}
            </div>
          </div>
          <div>
            <h1 className="text-[22px] font-extrabold text-[#3C2415]">You & {pName}</h1>
            {anniv && <p className="text-[11px] text-[#8B7355]"><Calendar className="h-3 w-3 inline mr-1" />{anniv.days} days together · {anniv.months} months</p>}
          </div>
        </div>

        {/* Compatibility Score */}
        {compat && (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#E8D5C4]/50 mb-4">
            <p className="text-[11px] font-bold text-[#C4956A] uppercase tracking-wider mb-3"><Zap className="h-3.5 w-3.5 inline mr-1" />Compatibility</p>
            <div className="flex items-center gap-4">
              <div className="relative w-16 h-16 flex-shrink-0">
                <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                  <circle cx="32" cy="32" r="28" fill="none" stroke="#F5EDE3" strokeWidth="5" />
                  <circle cx="32" cy="32" r="28" fill="none" stroke="#C4956A" strokeWidth="5" strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 28}`} strokeDashoffset={`${2 * Math.PI * 28 * (1 - (compat.overall || 0) / 100)}`} />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-[15px] font-extrabold text-[#C4956A]">{compat.overall}%</span>
              </div>
              <div className="flex-1 space-y-2">
                {[{ l: 'Travel Style', v: compat.travelScore, e: '🗺️' }, { l: 'Memory Making', v: compat.journalScore, e: '📝' }, { l: 'Photo Love', v: compat.photoScore, e: '📸' }].map(d => (
                  <div key={d.l} className="flex items-center gap-2"><span className="text-sm">{d.e}</span><span className="text-[11px] text-[#8B7355] w-24">{d.l}</span><div className="flex-1 h-2 bg-[#F5EDE3] rounded-full overflow-hidden"><div className="h-full bg-[#C4956A] rounded-full" style={{ width: `${d.v}%` }} /></div><span className="text-[10px] font-bold text-[#6B4D3A] w-8">{d.v}%</span></div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex bg-[#F5EDE3] rounded-xl p-1 mb-4">
          {[{ v: 'dashboard' as const, l: '🏠 Dashboard' }, { v: 'timeline' as const, l: '🕰️ Timeline' }, { v: 'gallery' as const, l: '📸 Gallery' }].map(t => (
            <button key={t.v} onClick={() => setTab(t.v)} className={`flex-1 py-2 text-[11px] font-bold rounded-lg transition-all ${tab === t.v ? 'bg-white text-[#3C2415] shadow-sm' : 'text-[#8B7355]'}`}>{t.l}</button>
          ))}
        </div>
      </div>

      <div className="px-5 pb-24 space-y-4">
        {tab === 'dashboard' && (
          <>
            {/* Clickable Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { l: 'Shared Cities', v: compat?.sharedCities || 0, e: '🏙️', type: 'sharedCities', items: timeline.filter((t: any) => t.shared) },
                { l: 'Total Cities', v: compat?.totalCities || 0, e: '🌍', type: 'totalCities', items: timeline },
                { l: 'Your Trips', v: compat?.userTrips || timeline.length || 0, e: '✈️', type: 'yourTrips', items: timeline },
                { l: `${pName}'s Trips`, v: compat?.partnerTrips || 0, e: '🧳', type: 'partnerTrips', items: timeline },
                { l: 'Photos', v: gallery.length, e: '📸', type: 'photos', items: gallery },
                { l: 'Journals', v: journals.length, e: '📝', type: 'journals', items: journals },
              ].map(s => (
                <div key={s.l} onClick={() => openDetail(s.l, s.type, s.items)}
                  className="bg-white rounded-2xl p-4 shadow-sm border border-[#E8D5C4]/50 text-center cursor-pointer hover:shadow-md hover:border-[#C4956A]/30 transition-all active:scale-[0.98]">
                  <span className="text-2xl block mb-1">{s.e}</span>
                  <p className="text-[24px] font-extrabold text-[#3C2415]">{s.v}</p>
                  <p className="text-[10px] text-[#8B7355]">{s.l}</p>
                  <p className="text-[9px] text-[#C4956A] mt-1">🔍 Tap to view</p>
                </div>
              ))}
            </div>

            {/* Shared Wallet */}
            <Link href="/profile/couple/wallet" className="block bg-gradient-to-r from-pink-500 to-rose-500 rounded-2xl p-5 text-white shadow-lg shadow-pink-200">
              <div className="flex items-center gap-2 mb-1"><Wallet className="h-5 w-5" /><span className="text-[14px] font-extrabold">Shared Wallet</span></div>
              <p className="text-white/70 text-sm">Save for trips together →</p>
            </Link>

            {/* Date Planner */}
            <Link href="/profile/couple/dates" className="block bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-5 text-white shadow-lg shadow-amber-200">
              <div className="flex items-center gap-2"><Sparkles className="h-5 w-5" /><span className="text-[14px] font-extrabold">Our Dates & Plans</span></div>
              <p className="text-white/70 text-sm">Planned dates, couple trips & history →</p>
            </Link>

            {/* Quick Plan Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <Link href="/date" className="block bg-gradient-to-r from-pink-400 to-pink-600 rounded-2xl p-4 text-white shadow-md text-center">
                <span className="text-2xl block mb-1">💕</span>
                <span className="text-[12px] font-extrabold">Plan a Date</span>
              </Link>
              <Link href="/weekend-planner" className="block bg-gradient-to-r from-blue-400 to-blue-600 rounded-2xl p-4 text-white shadow-md text-center">
                <span className="text-2xl block mb-1">🚗</span>
                <span className="text-[12px] font-extrabold">Plan Weekend</span>
              </Link>
            </div>

            <button onClick={unlinkPartner} className="w-full py-3 rounded-xl bg-red-50 text-red-500 text-[13px] font-bold flex items-center justify-center gap-2"><Unlink2 className="h-4 w-4" /> Unlink Partner</button>
          </>
        )}

        {tab === 'timeline' && (
          <div className="relative">
            <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-[#F5EDE3]" />
            {timeline.length === 0 && <div className="text-center py-10"><p className="text-[#8B7355] text-sm">No shared trips yet</p></div>}
            {timeline.map((t: any, i: number) => (
              <div key={i} className="relative flex gap-3 pb-4 last:pb-0">
                <div className="relative z-10 w-6 h-6 rounded-full bg-white border-2 border-[#E8D5C4] flex items-center justify-center text-xs">{t.emoji || '✈️'}</div>
                <div className="flex-1"><p className="text-[13px] font-extrabold text-[#3C2415]">{t.title}</p><p className="text-[10px] text-[#8B7355]">{t.city} · {t.date}</p></div>
              </div>
            ))}
          </div>
        )}

        {tab === 'gallery' && (
          <div className="grid grid-cols-3 gap-1.5">
            {gallery.length === 0 && <div className="col-span-3 text-center py-10"><Camera className="h-10 w-10 mx-auto text-[#D4C4B0] mb-2" /><p className="text-[#8B7355] text-sm">No shared photos yet</p></div>}
            {gallery.map((p: any) => (
              <div key={p.id} className="aspect-square rounded-xl overflow-hidden bg-[#F5EDE3]">
                <img src={imgUrl(p.url)} className="w-full h-full object-cover" alt="" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          DETAIL SHEET — shows when clicking any stat
          ═══════════════════════════════════════════════════════════════════ */}
      {detailSheet && (
        <div className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm flex items-end" onClick={() => setDetailSheet(null)}>
          <div className="w-full max-h-[85vh] bg-white rounded-t-[28px] shadow-2xl overflow-y-auto animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex justify-center pt-3 pb-2"><div className="w-10 h-1 rounded-full bg-gray-300" /></div>
            <div className="flex items-center justify-between px-5 pb-2">
              <h2 className="text-[20px] font-extrabold text-[#3C2415]">{detailSheet.title}</h2>
              <button onClick={() => setDetailSheet(null)} className="p-2"><X className="h-5 w-5 text-[#3C2415]" /></button>
            </div>
            <div className="p-5 space-y-3">
              {/* Photos / Gallery view */}
              {(detailSheet.type === 'photos' || detailSheet.type === 'gallery') && (
                <>
                  {detailSheet.items.length === 0 ? (
                    <div className="text-center py-10"><Camera className="h-10 w-10 mx-auto text-[#D4C4B0] mb-2" /><p className="text-[#8B7355]">No photos yet</p></div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {detailSheet.items.map((p: any, i: number) => (
                        <div key={i} className="aspect-square rounded-xl overflow-hidden bg-[#F5EDE3] relative group">
                          <img src={imgUrl(p.url)} className="w-full h-full object-cover" alt="" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                          {p.place && <div className="absolute bottom-2 left-2 bg-black/50 text-white text-[10px] rounded-full px-2 py-0.5"><MapPin className="h-2.5 w-2.5 inline" /> {p.place}</div>}
                          {p.date && <div className="absolute top-2 right-2 bg-black/40 text-white text-[9px] rounded-full px-2 py-0.5">{p.date}</div>}
                          {p.caption && <p className="text-[11px] text-[#3C2415] mt-1 px-1">{p.caption}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* Journals view */}
              {detailSheet.type === 'journals' && (
                <>
                  {detailSheet.items.length === 0 ? (
                    <div className="text-center py-10"><BookOpen className="h-10 w-10 mx-auto text-[#D4C4B0] mb-2" /><p className="text-[#8B7355]">No journals yet</p></div>
                  ) : (
                    detailSheet.items.map((j: any, i: number) => (
                      <div key={i} className="bg-[#FDF0E0] rounded-2xl p-4">
                        <div className="flex items-center gap-2 mb-1"><span className="text-xl">{j.mood || '📝'}</span><h3 className="text-[15px] font-extrabold text-[#3C2415]">{j.title}</h3></div>
                        {j.place && <p className="text-[11px] text-[#8B7355] flex items-center gap-1"><MapPin className="h-3 w-3" />{j.place} · {j.date}</p>}
                        <p className="text-[13px] text-[#6B4D3A] mt-2 leading-relaxed line-clamp-4">{j.content}</p>
                      </div>
                    ))
                  )}
                </>
              )}

              {/* Trips / Cities view */}
              {(detailSheet.type === 'yourTrips' || detailSheet.type === 'partnerTrips' || detailSheet.type === 'sharedCities' || detailSheet.type === 'totalCities') && (
                <>
                  {detailSheet.items.length === 0 && timeline.length === 0 ? (
                    <div className="text-center py-10"><p className="text-[#8B7355]">No trips yet</p></div>
                  ) : (
                    (detailSheet.items.length > 0 ? detailSheet.items : timeline).map((t: any, i: number) => (
                      <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-[#E8D5C4]/50">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{t.emoji || '✈️'}</span>
                          <div className="flex-1">
                            <p className="text-[14px] font-extrabold text-[#3C2415]">{t.title}</p>
                            <p className="text-[11px] text-[#8B7355] flex items-center gap-1"><MapPin className="h-3 w-3" />{t.city} · {t.date}</p>
                          </div>
                          <button onClick={() => window.open(`https://www.google.com/maps/search/${encodeURIComponent((t.city || '') + ' travel')}`, '_blank')}
                            className="p-2 rounded-lg bg-[#FDF0E0] text-[#C4956A]"><Navigation className="h-4 w-4" /></button>
                        </div>
                      </div>
                    ))
                  )}
                </>
              )}

              <button onClick={() => setDetailSheet(null)} className="w-full py-3 rounded-xl bg-gray-100 text-[#3C2415] text-sm font-bold mt-2">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
