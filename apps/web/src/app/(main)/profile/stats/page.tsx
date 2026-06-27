// @ts-nocheck
'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, MapPin, Camera, BookOpen, TrendingUp, Award, Calendar, Globe, Navigation, Star, Clock, Zap, Target, ChevronRight, Compass } from 'lucide-react';

const API = '';

// Proper city-to-state mapping for Malaysia
const CITY_STATE_MAP: Record<string, string> = {
  'kuala lumpur': 'Kuala Lumpur', 'kl': 'Kuala Lumpur', 'klcc': 'Kuala Lumpur', 'bukit bintang': 'Kuala Lumpur',
  'johor bahru': 'Johor', 'johor': 'Johor', 'jb': 'Johor', 'iskandar puteri': 'Johor', 'batu pahat': 'Johor', 'muar': 'Johor', 'kluang': 'Johor',
  'penang': 'Penang', 'george town': 'Penang', 'butterworth': 'Penang', 'batu ferringhi': 'Penang', 'balik pulau': 'Penang',
  'melaka': 'Melaka', 'malacca': 'Melaka', 'jonker': 'Melaka',
  'ipoh': 'Perak', 'taiping': 'Perak', 'teluk intan': 'Perak', 'sitiawan': 'Perak', 'lumut': 'Perak', 'pangkor': 'Perak',
  'kota kinabalu': 'Sabah', 'kk': 'Sabah', 'sabah': 'Sabah', 'sandakan': 'Sabah', 'tawau': 'Sabah', 'semporna': 'Sabah', 'kudat': 'Sabah', 'lahad datu': 'Sabah', 'mount kinabalu': 'Sabah', 'kinabalu': 'Sabah',
  'kuching': 'Sarawak', 'sarawak': 'Sarawak', 'miri': 'Sarawak', 'sibu': 'Sarawak', 'bintulu': 'Sarawak', 'mulu': 'Sarawak', 'bako': 'Sarawak',
  'cameron highlands': 'Pahang', 'cameron': 'Pahang', 'genting highlands': 'Pahang', 'genting': 'Pahang', 'kuantan': 'Pahang', 'bukit tinggi': 'Pahang', 'fraser': 'Pahang', 'janda baik': 'Pahang', 'taman negara': 'Pahang',
  'langkawi': 'Kedah', 'kedah': 'Kedah', 'alor setar': 'Kedah', 'sungai petani': 'Kedah', 'kulim': 'Kedah',
  'kota bharu': 'Kelantan', 'kelantan': 'Kelantan',
  'kuala terengganu': 'Terengganu', 'terengganu': 'Terengganu', 'perhentian': 'Terengganu', 'redang': 'Terengganu', 'pulau perhentian': 'Terengganu', 'pulau redang': 'Terengganu',
  'seremban': 'Negeri Sembilan', 'port dickson': 'Negeri Sembilan',
  'perlis': 'Perlis',
  'labuan': 'Labuan',
  'putrajaya': 'Putrajaya',
  'shah alam': 'Selangor', 'selangor': 'Selangor', 'petaling jaya': 'Selangor', 'pj': 'Selangor', 'subang': 'Selangor', 'puchong': 'Selangor', 'kajang': 'Selangor', 'sekinchan': 'Selangor', 'kuala selangor': 'Selangor', 'kuala kubu': 'Selangor',
  'desaru': 'Johor', 'cherating': 'Pahang', 'tioman': 'Pahang', 'pulau tioman': 'Pahang', 'endau': 'Johor',
};

const MALAYSIA_STATES = ['Johor','Kedah','Kelantan','Melaka','Negeri Sembilan','Pahang','Penang','Perak','Perlis','Sabah','Sarawak','Selangor','Terengganu','Kuala Lumpur','Labuan','Putrajaya'];

function getStateForCity(city: string): string | null {
  const key = city.toLowerCase().trim();
  return CITY_STATE_MAP[key] || null;
}

export default function TravelStatsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'states' | 'timeline'>('overview');

  useEffect(() => {
    // Aggregate stats from all localStorage sources
    const trips = JSON.parse(localStorage.getItem('saved_trips') || '[]');
    const photos = JSON.parse(localStorage.getItem('profile_photos') || '[]');
    const favs = JSON.parse(localStorage.getItem('favorites') || '[]');
    const reviews = JSON.parse(localStorage.getItem('profile_reviews') || '[]');
    const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
    const goals = JSON.parse(localStorage.getItem('wallet_goals') || '[]');
    const albums = JSON.parse(localStorage.getItem('profile_albums') || '[]');
    const totalSaved = goals.reduce((s: number, g: any) => s + (g.currentSavings || 0), 0);
    // Extract unique destinations
    const destinations = new Set<string>();
    trips.forEach((t: any) => { if (t.destination) destinations.add(t.destination.toLowerCase()); });
    favs.forEach((f: any) => { if (f.city) destinations.add(f.city.toLowerCase()); });

    setData({
      profile: { level: Math.floor((trips.length + photos.length + reviews.length) / 3) + 1, xp: trips.length * 100 + photos.length * 20 + reviews.length * 50 },
      achieve: { unlocked: [trips.length >= 1, photos.length >= 1, favs.length >= 1, reviews.length >= 1, albums.length >= 1, wishlist.length >= 1, goals.length >= 1].filter(Boolean).length, total: 7 },
      history: [...destinations].map(d => ({ city: d, state: d })),
      trips,
      stats: { totalTrips: trips.length, totalPhotos: photos.length, totalFavorites: favs.length, totalReviews: reviews.length, totalSaved, totalWishlist: wishlist.length, totalAlbums: albums.length, totalGoals: goals.length, citiesVisited: destinations.size },
    });
    setLoading(false);
  }, []);

  if (loading) return <div className="min-h-screen bg-[#FFFDF7] flex items-center justify-center"><div className="w-10 h-10 rounded-full border-2 border-[#C4956A]/20 border-t-[#C4956A] animate-spin" /></div>;

  const profile = data?.profile || {};
  const visitedCities: string[] = profile?.visitedCities || [];
  const dna = profile?.dna || [];
  const travelHistory = data?.history || [];
  const savedTrips = data?.trips || [];
  const achievements = data?.achieve;
  const totalPhotos = profile?.myPhotos?.length || 0;
  const totalJournals = profile?.journals?.length || 0;
  const totalTrips = travelHistory.length + savedTrips.length;

  // Proper state matching via city-state map
  const visitedStates = new Set<string>();
  visitedCities.forEach(city => {
    const state = getStateForCity(city);
    if (state) visitedStates.add(state);
  });
  const statesVisited = visitedStates.size;

  // Monthly breakdown
  const monthlyTrips: Record<string, number> = {};
  travelHistory.forEach((t: any) => { const m = t.date?.substring(0, 7); if (m) monthlyTrips[m] = (monthlyTrips[m] || 0) + 1; });
  const months = Object.keys(monthlyTrips).sort().slice(-12);
  const maxMonthly = Math.max(1, ...Object.values(monthlyTrips));

  // Yearly summary
  const yearsActive = travelHistory.length > 0
    ? new Set(travelHistory.map((t: any) => t.date?.substring(0, 4)).filter(Boolean)).size
    : 0;

  // Most visited city
  const cityCount: Record<string, number> = {};
  travelHistory.forEach((t: any) => { const c = t.city || t.destination || ''; if (c) cityCount[c] = (cityCount[c] || 0) + 1; });
  const topCities = Object.entries(cityCount).sort((a, b) => b[1] - a[1]).slice(0, 5);

  // Total days traveled
  const totalDays = savedTrips.reduce((s: number, t: any) => s + (t.days || 1), 0);

  // Season analysis
  const seasons = { dry: 0, wet: 0 };
  travelHistory.forEach((t: any) => {
    const m = parseInt(t.date?.substring(5, 7) || '0');
    if (m >= 3 && m <= 9) seasons.dry++; else if (m > 0) seasons.wet++;
  });

  const xp = profile?.xp || 0;
  const level = profile?.level || 1;
  const memberSince = profile?.memberSince;

  return (
    <div className="min-h-screen bg-[#FFFDF7]">
      {/* Header */}
      <div className="relative h-48 overflow-hidden bg-gradient-to-br from-[#1B4332] via-[#2D6A4F] to-[#40916C]">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><circle cx=%2220%22 cy=%2230%22 r=%2240%22 fill=%22rgba(255,255,255,0.03)%22/><circle cx=%2280%22 cy=%2270%22 r=%2250%22 fill=%22rgba(255,255,255,0.02)%22/></svg>')] opacity-50" />
        <div className="relative z-10 px-5 pt-14 pb-6 text-white">
          <Link href="/profile" className="text-white/70 text-[13px] font-semibold mb-3 flex items-center gap-1"><ArrowLeft className="h-3.5 w-3.5" /> Profile</Link>
          <h1 className="text-[28px] font-extrabold">📊 Travel Statistics</h1>
          <p className="text-white/60 text-[13px] mt-1">Level {level} · {xp} XP · {memberSince ? `Since ${new Date(memberSince).getFullYear()}` : 'Explorer'}</p>
        </div>
      </div>

      <div className="px-5 -mt-8 relative z-10 pb-24 space-y-4">
        {/* Tab Switcher */}
        <div className="flex bg-white rounded-2xl p-1.5 shadow-sm border border-[#E8D5C4]/50">
          {[
            { k: 'overview' as const, l: '📊 Overview' },
            { k: 'states' as const, l: '🗺️ States' },
            { k: 'timeline' as const, l: '🕰️ Timeline' },
          ].map(t => (
            <button key={t.k} onClick={() => setActiveTab(t.k)}
              className={`flex-1 py-2.5 text-[13px] font-bold rounded-xl transition-all ${activeTab === t.k ? 'bg-[#C4956A] text-white shadow-md' : 'text-[#8B7355] hover:bg-[#FDF6ED]'}`}>{t.l}</button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <>
            {/* Key Metrics — 4 big cards */}
            <div className="grid grid-cols-2 gap-2">
              {[
                { l: 'Trips', v: totalTrips, sub: `${totalDays} days`, e: '✈️', color: 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200' },
                { l: 'States', v: `${statesVisited}/${MALAYSIA_STATES.length}`, sub: `${Math.round((statesVisited / MALAYSIA_STATES.length) * 100)}% of Malaysia`, e: '🗺️', color: 'bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200' },
                { l: 'Cities', v: visitedCities.length, sub: topCities[0]?.[0] || '—', e: '🏙️', color: 'bg-gradient-to-br from-sky-50 to-blue-50 border-sky-200' },
                { l: 'Memories', v: totalPhotos + totalJournals, sub: `${totalPhotos} photos · ${totalJournals} journals`, e: '📸', color: 'bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200' },
              ].map((s, i) => (
                <motion.div key={s.l} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                  className={`${s.color} rounded-2xl p-4 text-center shadow-sm border`}>
                  <span className="text-2xl">{s.e}</span>
                  <p className="text-[28px] font-extrabold text-[#3C2415] mt-1 leading-none">{s.v}</p>
                  <p className="text-[10px] text-[#8B7355] font-medium mt-0.5 uppercase tracking-wider">{s.l}</p>
                  <p className="text-[10px] text-[#A08970] mt-0.5">{s.sub}</p>
                </motion.div>
              ))}
            </div>

            {/* Level Progress */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#E8D5C4]/50">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2"><Award className="h-4 w-4 text-[#D4A95F]" /><span className="text-[12px] font-bold text-[#8B7355] uppercase tracking-wider">Explorer Level {level}</span></div>
                <span className="text-[12px] font-bold text-[#C4956A]">{100 - (xp % 100)} XP to next level</span>
              </div>
              <div className="h-3 bg-[#F5EDE3] rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${xp % 100}%` }} transition={{ duration: 1, ease: 'easeOut' }}
                  className="h-full bg-gradient-to-r from-amber-400 via-[#C4956A] to-[#D4A574] rounded-full" />
              </div>
            </div>

            {/* Travel DNA — key traits */}
            {dna.length > 0 && (
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#E8D5C4]/50">
                <p className="text-[11px] font-bold text-[#8B7355] uppercase tracking-wider mb-3">🧬 Travel DNA</p>
                <div className="space-y-2">
                  {dna.slice(0, 6).map((trait: any) => (
                    <div key={trait.l} className="flex items-center gap-2">
                      <span className="text-lg w-7 text-center">{trait.e}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between mb-0.5">
                          <span className="text-[11px] font-semibold text-[#3C2415]">{trait.l}</span>
                          <span className="text-[10px] font-bold text-[#8B7355]">{trait.v}%</span>
                        </div>
                        <div className="h-1.5 bg-[#F5EDE3] rounded-full overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${trait.v}%` }} transition={{ duration: 0.6 }}
                            className="h-full rounded-full" style={{ background: trait.color || '#C4956A' }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Top Cities & Insights */}
            <div className="grid grid-cols-2 gap-2">
              {topCities.length > 0 && (
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#E8D5C4]/50">
                  <p className="text-[11px] font-bold text-[#8B7355] uppercase tracking-wider mb-3">🏆 Most Visited</p>
                  {topCities.map(([city, count], i) => (
                    <div key={city} className="flex items-center gap-2 py-1.5">
                      <span className="text-[11px] font-bold text-[#C4956A] w-4">{i + 1}</span>
                      <span className="flex-1 text-[12px] font-semibold text-[#3C2415] truncate">{city}</span>
                      <span className="text-[10px] font-bold text-[#8B7355]">{count}x</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#E8D5C4]/50">
                <p className="text-[11px] font-bold text-[#8B7355] uppercase tracking-wider mb-3">💡 Insights</p>
                <div className="space-y-2.5">
                  <div className="flex items-start gap-2">
                    <span className="text-sm mt-0.5">🌤️</span>
                    <div><p className="text-[11px] font-bold text-[#3C2415]">{seasons.dry > seasons.wet ? 'Dry season traveler' : 'All-weather explorer'}</p><p className="text-[10px] text-[#8B7355]">{seasons.dry} dry · {seasons.wet} wet season trips</p></div>
                  </div>
                  {yearsActive > 0 && (
                    <div className="flex items-start gap-2">
                      <span className="text-sm mt-0.5">📅</span>
                      <div><p className="text-[11px] font-bold text-[#3C2415]">{yearsActive} {yearsActive === 1 ? 'year' : 'years'} exploring</p><p className="text-[10px] text-[#8B7355]">Avg {totalTrips > 0 ? (totalTrips / Math.max(1, yearsActive)).toFixed(1) : '0'} trips/year</p></div>
                    </div>
                  )}
                  {statesVisited >= 3 && (
                    <div className="flex items-start gap-2">
                      <span className="text-sm mt-0.5">🎯</span>
                      <div><p className="text-[11px] font-bold text-[#3C2415]">{Math.round(statesVisited / MALAYSIA_STATES.length * 100)}% complete</p><p className="text-[10px] text-[#8B7355]">{MALAYSIA_STATES.length - statesVisited} states remaining</p></div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Monthly Activity Chart */}
            {months.length > 0 && (
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#E8D5C4]/50">
                <p className="text-[11px] font-bold text-[#8B7355] uppercase tracking-wider mb-4"><TrendingUp className="h-3.5 w-3.5 inline mr-1" />Monthly Activity</p>
                <div className="flex items-end gap-1 h-32">
                  {months.map(m => {
                    const count = monthlyTrips[m] || 0;
                    const h = Math.max(4, (count / maxMonthly) * 100);
                    return (
                      <div key={m} className="flex-1 flex flex-col items-center gap-1 group">
                        <span className="text-[9px] font-bold text-[#8B7355] opacity-0 group-hover:opacity-100 transition-opacity">{count}</span>
                        <motion.div initial={{ height: 0 }} animate={{ height: `${h}%` }} transition={{ duration: 0.6 }}
                          className="w-full bg-gradient-to-t from-[#C4956A] to-[#D4A574] rounded-t-md group-hover:from-[#B8860B] group-hover:to-[#C4956A] transition-colors" style={{ minHeight: 4 }} />
                        <span className="text-[8px] text-[#A08970]">{m.substring(5)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === 'states' && (
          <>
            {/* Malaysia States Progress — proper city-to-state mapping */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#E8D5C4]/50">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-[11px] font-bold text-[#8B7355] uppercase tracking-wider"><Globe className="h-3.5 w-3.5 inline mr-1" />Malaysia Passport</p>
                  <p className="text-[24px] font-extrabold text-[#3C2415] mt-1">{statesVisited}/{MALAYSIA_STATES.length} <span className="text-[14px] font-bold text-[#C4956A]">states</span></p>
                </div>
                <div className="text-right">
                  <div className="relative w-16 h-16">
                    <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                      <circle cx="32" cy="32" r="28" fill="none" stroke="#F5EDE3" strokeWidth="5" />
                      <motion.circle cx="32" cy="32" r="28" fill="none" stroke="#C4956A" strokeWidth="5" strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * 28}`}
                        initial={{ strokeDashoffset: 2 * Math.PI * 28 }}
                        animate={{ strokeDashoffset: `${2 * Math.PI * 28 * (1 - statesVisited / MALAYSIA_STATES.length)}` }}
                        transition={{ duration: 1.5, ease: 'easeOut' }} />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-[13px] font-extrabold text-[#C4956A]">{Math.round(statesVisited / MALAYSIA_STATES.length * 100)}%</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {MALAYSIA_STATES.map(state => {
                  const visited = visitedStates.has(state);
                  const statePlaces = visitedCities.filter(c => getStateForCity(c) === state);
                  return (
                    <div key={state} title={statePlaces.join(', ')}
                      className={`rounded-xl py-3 px-1 text-center text-[10px] font-bold transition-all cursor-default ${visited ? 'bg-gradient-to-br from-emerald-50 to-teal-50 text-emerald-700 shadow-sm border border-emerald-200' : 'bg-[#F5EDE3] text-[#A08970] opacity-40'}`}>
                      <span className="text-sm block mb-0.5">{visited ? '✅' : '⬜'}</span>
                      {state}
                      {visited && <span className="block text-[8px] text-emerald-500 mt-0.5">{statePlaces.length} place{statePlaces.length !== 1 ? 's' : ''}</span>}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* State detail — visited cities per state */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#E8D5C4]/50">
              <p className="text-[11px] font-bold text-[#8B7355] uppercase tracking-wider mb-3">📍 Cities Visited ({visitedCities.length})</p>
              <div className="flex flex-wrap gap-1.5">
                {visitedCities.length === 0 && <p className="text-[12px] text-[#A08970] py-4">No cities recorded yet. Start traveling!</p>}
                {visitedCities.map(city => {
                  const state = getStateForCity(city);
                  return (
                    <span key={city} className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-[#FDF6ED] border border-[#E8D5C4]/50 rounded-full text-[11px] font-semibold text-[#3C2415]">
                      <MapPin className="h-2.5 w-2.5 text-[#C4956A]" />{city}
                      {state && <span className="text-[9px] text-[#A08970] ml-0.5">· {state}</span>}
                    </span>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {activeTab === 'timeline' && (
          <div className="space-y-4">
            {/* Summary stats */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { l: 'Years Active', v: yearsActive || 0, e: '📅' },
                { l: 'Total Trips', v: totalTrips, e: '✈️' },
                { l: 'Saved Plans', v: savedTrips.length, e: '💾' },
              ].map(s => (
                <div key={s.l} className="bg-white rounded-2xl p-4 text-center shadow-sm border border-[#E8D5C4]/50">
                  <span className="text-xl">{s.e}</span>
                  <p className="text-[24px] font-extrabold text-[#3C2415]">{s.v}</p>
                  <p className="text-[10px] text-[#8B7355]">{s.l}</p>
                </div>
              ))}
            </div>

            {/* Travel History Timeline */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#E8D5C4]/50">
              <p className="text-[11px] font-bold text-[#8B7355] uppercase tracking-wider mb-4">🕰️ Travel History ({travelHistory.length})</p>
              {travelHistory.length === 0 ? (
                <div className="text-center py-8">
                  <Compass className="h-10 w-10 mx-auto text-[#D4C4B0] mb-2" />
                  <p className="text-[#8B7355] text-[13px]">No trips recorded yet</p>
                  <p className="text-[#A08970] text-[11px] mt-1">Complete a trip to see your timeline</p>
                </div>
              ) : (
                <div className="relative">
                  <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-[#F5EDE3]" />
                  {travelHistory.slice(0, 20).map((t: any, i: number) => (
                    <div key={t.id || i} className="relative flex gap-3 pb-4 last:pb-0">
                      <div className={`relative z-10 w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs ${i === 0 ? 'bg-[#C4956A] border-[#C4956A] text-white' : 'bg-white border-[#E8D5C4]'}`}>
                        {t.emoji || '✈️'}
                      </div>
                      <div className="flex-1 bg-[#FDF6ED] rounded-xl p-3 hover:bg-[#FDF0E0] transition-colors">
                        <div className="flex items-center justify-between">
                          <p className="text-[13px] font-extrabold text-[#3C2415]">{t.title}</p>
                          {t.date && <span className="text-[10px] text-[#A08970] flex-shrink-0 ml-2">{t.date}</span>}
                        </div>
                        <p className="text-[11px] text-[#8B7355] flex items-center gap-1 mt-0.5">
                          <MapPin className="h-2.5 w-2.5" />{t.city}
                          {getStateForCity(t.city) && <span className="text-[#C4956A]">· {getStateForCity(t.city)}</span>}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Saved Plans */}
            {savedTrips.length > 0 && (
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#E8D5C4]/50">
                <p className="text-[11px] font-bold text-[#8B7355] uppercase tracking-wider mb-3">💾 Saved Plans ({savedTrips.length})</p>
                <div className="space-y-2">
                  {savedTrips.slice(0, 10).map((t: any) => (
                    <div key={t.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-[#FDF6ED] transition-colors">
                      <span className="text-lg">{t.completed ? '✅' : '📋'}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-bold text-[#3C2415] truncate">{t.title}</p>
                        <p className="text-[10px] text-[#8B7355]">{t.destination} · {t.days || 1}d · RM {(t.totalCost || 0).toLocaleString()}</p>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${t.completed ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                        {t.completed ? 'Done' : 'Planned'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Achievements summary at the bottom of all tabs */}
        {achievements && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#E8D5C4]/50">
            <Link href="/profile/achievements" className="flex items-center justify-between mb-3 group">
              <p className="text-[11px] font-bold text-[#8B7355] uppercase tracking-wider"><Award className="h-3.5 w-3.5 inline mr-1" />Achievements</p>
              <ChevronRight className="h-4 w-4 text-[#D4C4B0] group-hover:text-[#C4956A] transition-colors" />
            </Link>
            <div className="flex items-center gap-4">
              <div className="relative w-16 h-16 flex-shrink-0">
                <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                  <circle cx="32" cy="32" r="28" fill="none" stroke="#F5EDE3" strokeWidth="5" />
                  <motion.circle cx="32" cy="32" r="28" fill="none" stroke="#C4956A" strokeWidth="5" strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 28}`}
                    initial={{ strokeDashoffset: 2 * Math.PI * 28 }}
                    animate={{ strokeDashoffset: `${2 * Math.PI * 28 * (1 - (achievements?.progress || 0) / 100)}` }}
                    transition={{ duration: 1.2, ease: 'easeOut' }} />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-[14px] font-extrabold text-[#C4956A]">{achievements?.progress || 0}%</span>
              </div>
              <div>
                <p className="text-[15px] font-extrabold text-[#3C2415]">{achievements?.unlocked || 0}/{achievements?.total || 32} Unlocked</p>
                <p className="text-[11px] text-[#8B7355]">{achievements?.totalXp || 0} XP earned</p>
                <div className="h-1.5 w-32 bg-[#F5EDE3] rounded-full overflow-hidden mt-1.5">
                  <div className="h-full bg-[#C4956A] rounded-full" style={{ width: `${achievements?.progress || 0}%` }} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
