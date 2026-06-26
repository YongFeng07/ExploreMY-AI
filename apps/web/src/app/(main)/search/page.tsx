// @ts-nocheck
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search, X, Clock, TrendingUp, Star, MapPin, Loader2, Sparkles,
  Building2, Coffee, Utensils, ShoppingBag, Landmark, Hotel, Navigation,
  Heart, ChevronRight, ArrowLeft, Flame, Gem,
} from 'lucide-react';
import { TopBar } from '@/components/layout/top-bar';
import { useDebounce } from '@/hooks/use-debounce';
import { useMapStore } from '@/stores/map-store';
import { cn, formatDistance } from '@/lib/utils';
import { toast } from 'sonner';
import { PlaceDetailView } from '@/components/places/place-detail-view';
import { ImageViewer } from '@/components/shared/image-viewer';

const API = '/api';
const SEARCH_LIMIT = 40;

interface PlaceResult {
  id: string; slug: string; name: string; category: string;
  rating: number; reviewCount: number; distance?: number;
  priceLevel: number | null; photos: string[]; address: string;
  city: string; isOpen: boolean; isHiddenGem: boolean; isTrending: boolean;
  lat: number; lng: number; openingHours: string;
}

const QUICK_CATS = [
  { icon: Utensils, label: 'Restaurants', query: 'best restaurant food', color: 'bg-orange-50 text-orange-600' },
  { icon: Coffee, label: 'Cafes', query: 'cafe coffee brunch', color: 'bg-amber-50 text-amber-700' },
  { icon: ShoppingBag, label: 'Shopping', query: 'shopping mall plaza', color: 'bg-pink-50 text-pink-600' },
  { icon: Landmark, label: 'Attractions', query: 'tourist attraction landmark', color: 'bg-blue-50 text-blue-600' },
  { icon: Hotel, label: 'Hotels', query: 'hotel resort stay', color: 'bg-cyan-50 text-cyan-600' },
  { icon: Building2, label: 'Nightlife', query: 'bar nightlife pub', color: 'bg-purple-50 text-purple-600' },
];

const TRENDING = ['Halal dim sum KL', 'Best nasi lemak', 'Rooftop bar', 'Hiking trails', 'Night market', 'Seafood dinner', 'Weekend brunch', 'Laksa Penang', 'Cafe with wifi', 'Ramen KL'];

export default function SearchPage() {
  const router = useRouter();
  const mapLoc = useMapStore(s => s.userLocation);
  const [myLat, setMyLat] = useState(3.147);
  const [myLng, setMyLng] = useState(101.708);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [detailPlace, setDetailPlace] = useState<PlaceResult | null>(null);
  const [detailFull, setDetailFull] = useState<any>(null);
  const [detailPhotoIdx, setDetailPhotoIdx] = useState(0);
  const [searchTab, setSearchTab] = useState<'places' | 'users'>('places');
  const [userResults, setUserResults] = useState<any[]>([]);
  const [userLoading, setUserLoading] = useState(false);
  const [following, setFollowing] = useState<Set<string>>(new Set());
  const [viewImages, setViewImages] = useState<string[] | null>(null);
  const debouncedQuery = useDebounce(query, 300);

  // Real GPS detection
  useEffect(() => {
    if (!navigator.geolocation) return;
    const watchId = navigator.geolocation.watchPosition(
      pos => { setMyLat(pos.coords.latitude); setMyLng(pos.coords.longitude); },
      () => {}, // use default KL if denied
      { enableHighAccuracy: true, timeout: 30000, maximumAge: 0 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  // Load following list
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;
    const uid = localStorage.getItem('userId') || '';
    fetch(`/api/auth/user/${uid}/following`, { headers: { 'Authorization': `Bearer ${token}` } })
      .then(r => r.json()).then(d => setFollowing(new Set((d.data || []).map((u: any) => u.id)))).catch(() => {});
  }, []);

  // Search users
  useEffect(() => {
    if (debouncedQuery.length < 2 || searchTab !== 'users') { setUserResults([]); return; }
    setUserLoading(true);
    const token = localStorage.getItem('accessToken');
    fetch(`/api/admin/users?q=${encodeURIComponent(debouncedQuery)}`, {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
    }).then(r => r.json()).then(d => {
      setUserResults((d.data || d.users || []).filter((u: any) => (u.displayName || u.email || '').toLowerCase().includes(debouncedQuery.toLowerCase())));
      setUserLoading(false);
    }).catch(() => setUserLoading(false));
  }, [debouncedQuery, searchTab]);

  const toggleFollow = async (targetId: string) => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;
    const isFollowing = following.has(targetId);
    await fetch(`/api/auth/follow/${targetId}`, {
      method: isFollowing ? 'DELETE' : 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    setFollowing(prev => {
      const next = new Set(prev);
      isFollowing ? next.delete(targetId) : next.add(targetId);
      return next;
    });
  };

  const storageKey = `recentSearches_${typeof window !== 'undefined' ? localStorage.getItem('userId') || 'anon' : 'anon'}`;

  useEffect(() => { try { setRecentSearches(JSON.parse(localStorage.getItem(storageKey) || '[]').slice(0, 8)); } catch {} }, []);

  const saveSearch = useCallback((q: string) => {
    const updated = [q, ...recentSearches.filter(s => s !== q)].slice(0, 8);
    setRecentSearches(updated);
    localStorage.setItem(storageKey, JSON.stringify(updated));
  }, [recentSearches, storageKey]);

  useEffect(() => {
    if (debouncedQuery.length < 2) { setResults([]); return; }
    setLoading(true);
    fetch(`${API}/places/search?q=${encodeURIComponent(debouncedQuery)}&lat=${myLat}&lng=${myLng}&limit=${SEARCH_LIMIT}`)
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then(j => { const data = j.data || []; setResults(data); if (data.length > 0) saveSearch(debouncedQuery); })
      .catch(() => setResults([]))
      .finally(() => setLoading(false));
  }, [debouncedQuery]);

  const handleSearch = (q: string) => { setQuery(q); saveSearch(q); };
  const handleClear = () => { setQuery(''); setResults([]); };
  const clearRecent = () => { setRecentSearches([]); localStorage.removeItem(storageKey); };

  const openDetail = (p: PlaceResult) => {
    setDetailPlace(p); setDetailFull(null); setDetailPhotoIdx(0);
    fetch(`${API}/places/${p.id}`).then(r => r.json()).then(j => setDetailFull(j.data)).catch(() => {});
  };

  const hasResults = query.length >= 2;
  const catIcon = (c: string) => c === 'FOOD' ? '🍜' : c === 'CAFE' ? '☕' : c === 'SHOPPING_MALL' ? '🛍️' : c === 'HOTEL' ? '🏨' : '📍';

  // Detail view
  if (detailPlace) return (
    <>
      <PlaceDetailView place={detailPlace} onClose={() => setDetailPlace(null)} variant="fullpage" />
      {viewImages && viewImages.length > 0 && (
        <ImageViewer images={viewImages} onClose={() => setViewImages(null)} alt="Place photo" />
      )}
    </>
  );

  return (
    <div className="min-h-dvh bg-gradient-to-b from-[#FFFDF7] to-[#FFFAF3]">
      <TopBar title="Search" showBack backHref="/explore" />
      <div className="px-4 pt-20 pb-28">
        {/* Search Bar */}
        <div className={cn('relative transition-all duration-300', focused && 'scale-[1.02]')}>
          <div className={cn('flex items-center gap-3 rounded-2xl border bg-white/90 px-4 py-3.5 shadow-sm transition-all', focused ? 'border-[#C4956A] ring-4 ring-[#C4956A]/10 shadow-lg' : 'border-[#E8D5C4]')}>
            <Search className={cn('h-5 w-5 shrink-0 transition-colors', focused ? 'text-[#C4956A]' : 'text-[#A08970]')} />
            <input value={query} onChange={e => setQuery(e.target.value)} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} placeholder="Search anything in Malaysia..." className="flex-1 bg-transparent text-sm font-bold text-[#3C2415] outline-none placeholder:text-[#A08970]" autoFocus />
            {query ? <button onClick={handleClear} className="shrink-0 rounded-full p-1.5 hover:bg-[#F5EDE3]"><X className="h-4 w-4 text-[#8B7355]" /></button> : null}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mt-4 mb-3">
          {[{ v: 'places', l: '📍 Places' }, { v: 'users', l: '👤 Users' }].map(t => (
            <button key={t.v} onClick={() => setSearchTab(t.v as any)}
              className={`px-4 py-2 rounded-full text-[13px] font-bold transition-all ${searchTab === t.v ? 'bg-[#C4956A] text-white shadow-md' : 'bg-white text-[#8B7355] border border-[#E8D5C4]'}`}>{t.l}</button>
          ))}
        </div>

        {/* USERS SEARCH */}
        {searchTab === 'users' && (
          <div>
            {userLoading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-4"><Loader2 className="h-8 w-8 animate-spin text-[#C4956A]" /><p className="text-sm font-bold text-[#8B7355]">Searching users...</p></div>
            ) : userResults.length > 0 ? (
              <div className="space-y-2 pb-8">
                {userResults.map((u: any) => (
                  <Link href={`/user/${u.id}`} key={u.id} className="flex items-center gap-3 p-3 bg-white rounded-2xl shadow-sm border border-[#E8D5C4]/50 hover:shadow-md transition-all active:scale-[0.99]">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#C4956A] to-[#D4A574] flex items-center justify-center text-white text-lg font-bold flex-shrink-0">{u.displayName?.[0] || '?'}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-extrabold text-[#3C2415] truncate">{u.displayName || u.email}</p>
                      <p className="text-[11px] text-[#8B7355]">Level {u.level || 1} Explorer</p>
                    </div>
                    <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFollow(u.id); }}
                      className={`px-4 py-2 rounded-full text-[12px] font-bold transition-all ${following.has(u.id) ? 'bg-[#F5EDE3] text-[#8B7355]' : 'bg-[#C4956A] text-white'}`}>
                      {following.has(u.id) ? 'Following' : 'Follow'}
                    </button>
                  </Link>
                ))}
              </div>
            ) : hasResults ? (
              <div className="text-center py-16"><p className="text-[#8B7355]">No users found for "{query}"</p></div>
            ) : null}
          </div>
        )}

        {/* PLACES SEARCH */}
        {searchTab === 'places' && (<div className="mt-2">
          {hasResults ? (
            <div>
              <div className="mb-4 flex items-center justify-between">
                <p className="text-[11px] font-extrabold text-[#8B7355] uppercase tracking-wider">{loading ? 'Searching...' : results.length > 0 ? `${results.length} results` : 'No results'}</p>
                {results.length > 0 && <Sparkles className="h-4 w-4 text-[#C4956A]" />}
              </div>
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4"><Loader2 className="h-8 w-8 animate-spin text-[#C4956A]" /><p className="text-sm font-bold text-[#8B7355]">Searching across Malaysia...</p></div>
              ) : results.length > 0 ? (
                <div className="space-y-3 pb-8">
                  {results.map((p) => (
                    <button key={p.id} onClick={() => openDetail(p)} className="flex w-full items-center gap-4 rounded-2xl bg-white p-4 text-left shadow-sm border border-[#E8D5C4]/50 transition-all hover:shadow-md hover:-translate-y-0.5">
                      <div className="relative h-[140px] w-[140px] shrink-0 overflow-hidden rounded-2xl bg-[#F5EDE3]">
                        {p.photos[0] ? <img src={p.photos[0]} alt={p.name} className="h-full w-full object-cover cursor-pointer hover:opacity-90" onClick={(e: any) => { e.stopPropagation(); setViewImages(p.photos); }} /> : <div className="flex h-full w-full items-center justify-center text-5xl">{catIcon(p.category)}</div>}
                      </div>
                      <div className="min-w-0 flex-1 py-2">
                        <h3 className="text-base font-extrabold text-[#3C2415] truncate">{p.name}</h3>
                        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm">
                          <span className="flex items-center gap-0.5 font-extrabold"><Star className="h-4 w-4 fill-amber-400 text-amber-400" />{p.rating.toFixed(1)}</span>
                          <span className="text-[#D4C4B0]">·</span>
                          <span className="text-[#8B7355] font-bold">{p.distance ? formatDistance(p.distance) : p.address.split(',').pop()?.trim()}</span>
                          {p.priceLevel != null && <><span className="text-[#D4C4B0]">·</span><span className="text-[#8B7355]">{'$'.repeat(Math.max(1, Math.min(4, p.priceLevel)))}</span></>}
                        </div>
                        <div className="mt-2 flex items-center gap-1.5 text-sm">
                          <span className={cn('font-extrabold', p.isOpen ? 'text-emerald-600' : 'text-red-400')}>{p.isOpen ? '🟢 Open' : '🔴 Closed'}</span>
                          <span className="text-[#A08970] truncate">{p.address}</span>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-[#D4C4B0] shrink-0 self-center" />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center py-16 text-center">
                  <Sparkles className="h-10 w-10 text-[#D4C4B0] mb-3" /><p className="text-base font-extrabold text-[#3C2415]">No results for "{query}"</p><p className="text-sm text-[#8B7355] mt-1">Try a different search term</p>
                  <div className="mt-4 flex gap-2">{QUICK_CATS.slice(0, 3).map(cat => (<button key={cat.label} onClick={() => handleSearch(cat.query)} className="rounded-xl border border-[#E8D5C4] px-4 py-2 text-xs font-bold text-[#3C2415] hover:bg-[#FDF0E0]">{cat.label}</button>))}</div>
                </div>
              )}
            </div>
          ) : (
            <>
              <div>
                <p className="mb-3 text-[11px] font-extrabold text-[#8B7355] uppercase tracking-wider">Browse Categories</p>
                <div className="grid grid-cols-3 gap-2.5">
                  {QUICK_CATS.map(cat => (
                    <button key={cat.label} onClick={() => handleSearch(cat.query)} className="flex flex-col items-center gap-2 rounded-2xl bg-white p-4 shadow-sm border border-[#E8D5C4]/50 transition-all hover:shadow-md hover:-translate-y-0.5">
                      <div className={cn('flex h-11 w-11 items-center justify-center rounded-xl text-xl', cat.color)}><cat.icon className="h-5 w-5" /></div>
                      <span className="text-xs font-extrabold text-[#3C2415]">{cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              {recentSearches.length > 0 && (
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-3"><p className="text-[11px] font-extrabold text-[#8B7355] uppercase tracking-wider">Recent</p><button onClick={clearRecent} className="text-[11px] font-bold text-[#C4956A]">Clear</button></div>
                  <div className="space-y-1">{recentSearches.map((s, i) => (
                    <button key={i} onClick={() => handleSearch(s)} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold text-[#3C2415] transition-colors hover:bg-[#FDF0E0]">
                      <Clock className="h-4 w-4 text-[#D4C4B0] shrink-0" />{s}
                    </button>
                  ))}</div>
                </div>
              )}
              <div className="mt-6 pb-24">
                <p className="mb-3 text-[11px] font-extrabold text-[#8B7355] uppercase tracking-wider">Trending in Malaysia</p>
                <div className="flex flex-wrap gap-2">
                  {TRENDING.map((s, i) => (
                    <button key={i} onClick={() => handleSearch(s)} className="flex items-center gap-1.5 rounded-full border border-[#E8D5C4] bg-white px-3.5 py-2 text-xs font-bold text-[#3C2415] transition-all hover:bg-[#FDF0E0] hover:border-[#C4956A]/30 hover:scale-105 active:scale-95">
                      <TrendingUp className="h-3 w-3 text-amber-400" />{s}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>)} {/* end places tab */}
      </div>
    </div>
  );
}
