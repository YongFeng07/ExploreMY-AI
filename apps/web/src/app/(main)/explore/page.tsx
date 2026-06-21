'use client';
import { useEffect, useState, useCallback } from 'react';
import { AdvancedMarker } from '@vis.gl/react-google-maps';
import { MapContainer } from '@/components/map/map-container';
import { PlaceDetailView } from '@/components/places/place-detail-view';
import { ImageViewer } from '@/components/shared/image-viewer';
import { Star, Navigation, LocateFixed, Loader2, MapPin, Heart, Sparkles, Crosshair, ChevronRight } from 'lucide-react';
import { formatDistance } from '@/lib/utils';

const API = 'http://localhost:3001/api/v1';
const RADIUS = 20000; // 20km radius for more coverage

const CATEGORIES = [
  { v: '', l: '🌏 All', icon: '🌏' },
  { v: 'FOOD', l: '🍜 Food', icon: '🍜' },
  { v: 'CAFE', l: '☕ Cafe', icon: '☕' },
  { v: 'TOURIST_ATTRACTION', l: '🏛️ Attractions', icon: '🏛️' },
  { v: 'SHOPPING_MALL', l: '🛍️ Shopping', icon: '🛍️' },
  { v: 'NATURE', l: '🌿 Nature', icon: '🌿' },
  { v: 'HOTEL', l: '🏨 Hotels', icon: '🏨' },
  { v: 'NIGHTLIFE', l: '🌙 Nightlife', icon: '🌙' },
];

export default function ExplorePage() {
  const [places, setPlaces] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [detailPlace, setDetailPlace] = useState<any>(null);
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [userLoc, setUserLoc] = useState<{lat:number;lng:number}|null>(null);
  const [gpsDenied, setGpsDenied] = useState(false);
  const [gpsAccuracy, setGpsAccuracy] = useState<number|null>(null);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [favNames, setFavNames] = useState<Set<string>>(new Set());
  const [fetchingLocation, setFetchingLocation] = useState(true);
  const [viewImages, setViewImages] = useState<string[] | null>(null);

  // Load favorites with real userId
  const uid = typeof window !== 'undefined' ? localStorage.getItem('userId') || '' : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') || '' : '';

  useEffect(() => {
    const h: any = {};
    if (token) h['Authorization'] = `Bearer ${token}`;
    fetch(`${API.replace('/api/v1','')}/api/v1/auth/me/favorites?userId=${uid}`, { headers: h })
      .then(r => r.json()).then(d => {
        setFavorites(d.data || []);
        setFavNames(new Set((d.data || []).map((f:any) => f.placeName)));
      }).catch(() => {});
  }, [uid]);

  const toggleFav = async (place: any) => {
    const name = place.name || place.placeName;
    const isFav = favNames.has(name);
    const h: any = { 'Content-Type': 'application/json' };
    if (token) h['Authorization'] = `Bearer ${token}`;

    if (isFav) {
      const fav = favorites.find(f => f.placeName === name);
      if (fav) {
        await fetch(`${API.replace('/api/v1','')}/api/v1/auth/me/favorites/${fav.id}?userId=${uid}`, { method: 'DELETE', headers: h });
        setFavorites(prev => prev.filter(f => f.id !== fav.id));
        setFavNames(prev => { const n = new Set(prev); n.delete(name); return n; });
      }
    } else {
      const r = await fetch(`${API.replace('/api/v1','')}/api/v1/auth/me/favorites?userId=${uid}`, {
        method: 'POST', headers: h,
        body: JSON.stringify({ userId: uid, placeName: name, city: place.city || '', category: place.category || '', rating: place.rating || 0, photo: place.photos?.[0] || '' }),
      });
      const d = await r.json();
      if (d.data) {
        setFavorites(prev => [d.data, ...prev]);
        setFavNames(prev => { const n = new Set(prev); n.add(name); return n; });
      }
    }
  };

  // Real GPS — high accuracy, watch for position changes
  useEffect(() => {
    if (!navigator.geolocation) { setGpsDenied(true); setFetchingLocation(false); setLoading(false); return; }

    const watchId = navigator.geolocation.watchPosition(
      pos => {
        setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGpsAccuracy(pos.coords.accuracy);
        setGpsDenied(false);
        setFetchingLocation(false);
      },
      err => {
        // GPS unavailable — immediately fallback to KL default so user always sees places
        console.log('GPS unavailable, using default KL location');
        setUserLoc({ lat: 3.139, lng: 101.6869 });
        setFetchingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 30000 }
    );

    // Also set a safety timeout — if still no location after 10s, force KL default
    const t = setTimeout(() => {
      if (!userLoc) {
        setUserLoc({ lat: 3.139, lng: 101.6869 });
        setFetchingLocation(false);
      }
    }, 10000);

    return () => { navigator.geolocation.clearWatch(watchId); clearTimeout(t); };
  }, []);

  // Fetch places when location is available
  useEffect(() => {
    if (!userLoc) return;
    setLoading(true);
    const params = new URLSearchParams({ lat: String(userLoc.lat), lng: String(userLoc.lng), radius: String(RADIUS) });
    if (category) params.set('category', category);
    fetch(`${API}/places/nearby?${params}`)
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then(d => setPlaces(d.data || []))
      .catch(err => { console.error('Places fetch failed:', err); setPlaces([]); })
      .finally(() => setLoading(false));
  }, [userLoc, category]);

  const openDetail = async (p: any) => {
    setSelected(p);
    const pid = p.id || p.place_id;
    if (pid && !pid.startsWith('fb') && !pid.startsWith('citydb') && !pid.startsWith('mem')) {
      try {
        const r = await fetch(`${API}/places/details/${pid}`);
        const d = await r.json();
        setDetailPlace(d.data || p);
      } catch { setDetailPlace(p); }
    } else {
      setDetailPlace(p);
    }
  };

  return (
    <div className="min-h-dvh bg-[#FAFAF8] flex flex-col relative">
      {/* MAP — 55% height for better visibility */}
      <div className="h-[55vh] relative">
        <MapContainer center={userLoc || undefined} zoom={14}>
          {userLoc && (
            <AdvancedMarker position={userLoc}>
              <div className="w-5 h-5 rounded-full bg-[#3B82F6] border-[3px] border-white shadow-lg ring-2 ring-[#3B82F6]/30 animate-pulse" />
            </AdvancedMarker>
          )}
          {places.map(p => (
            <AdvancedMarker key={p.id || p.place_id} position={{ lat: p.lat, lng: p.lng }} onClick={() => openDetail(p)}>
              <div className={`flex flex-col items-center cursor-pointer transition-transform ${selected?.id === p.id || selected?.place_id === p.place_id ? 'scale-125 z-10' : ''}`}>
                <div className={`px-2 py-1 rounded-full text-[10px] font-extrabold shadow-lg border border-white whitespace-nowrap ${
                  selected?.id === p.id || selected?.place_id === p.place_id ? 'bg-[#7B5E3B] text-white' : 'bg-white text-[#0E0E0E]'
                }`}>{p.name?.slice(0, 20)}</div>
                <div className={`w-3 h-3 rounded-full border-2 border-white shadow -mt-1 ${
                  selected?.id === p.id || selected?.place_id === p.place_id ? 'bg-[#7B5E3B]' : 'bg-[#C4956A]'
                }`} />
              </div>
            </AdvancedMarker>
          ))}
        </MapContainer>
        {/* Top badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
          <div className="bg-white/90 backdrop-blur rounded-full px-3 py-1.5 text-[11px] font-extrabold text-[#7B5E3B] shadow-md flex items-center gap-1.5">
            <Crosshair className="h-3.5 w-3.5 text-[#3B82F6]" />
            {gpsAccuracy ? `${Math.round(gpsAccuracy)}m accuracy` : 'Locating...'}
          </div>
          <div className="bg-white/90 backdrop-blur rounded-full px-3 py-1.5 text-[11px] font-extrabold text-[#7B5E3B] shadow-md">
            {places.length} places · {RADIUS/1000}km
          </div>
        </div>
        {/* User location button */}
        {userLoc && (
          <button onClick={() => {
            const mapEl = document.querySelector('.gm-style');
            if (mapEl) mapEl.scrollIntoView({ behavior: 'smooth' });
          }}
          className="absolute bottom-3 right-3 w-9 h-9 rounded-full bg-white shadow-lg flex items-center justify-center">
            <LocateFixed className="h-4 w-4 text-[#3B82F6]" />
          </button>
        )}
      </div>

      {/* CATEGORIES — horizontally scrollable */}
      <div className="bg-white border-b border-[#E8EDE4] px-3 py-2.5 flex gap-1.5 overflow-x-auto no-scrollbar">
        {CATEGORIES.map(c => (
          <button key={c.v} onClick={() => setCategory(c.v)}
            className={`rounded-full border px-4 py-2 text-[12px] font-bold whitespace-nowrap transition-all active:scale-95 ${
              category === c.v ? 'border-[#7B5E3B] bg-[#FDF6ED] text-[#7B5E3B] shadow-sm' : 'border-[#E8EDE4] bg-white text-[#5C4A3A] hover:border-[#D4C4B0]'
            }`}>{c.l}</button>
        ))}
      </div>

      {/* PLACE LIST */}
      <div className="flex-1 overflow-y-auto pb-20 bg-white">
        {fetchingLocation ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 border-[#E8EDE4] border-t-[#3B82F6] animate-spin" />
              <Crosshair className="absolute inset-0 m-auto h-5 w-5 text-[#3B82F6]" />
            </div>
            <p className="mt-4 text-[15px] font-semibold text-[#171717]">Finding your location</p>
            <p className="text-[13px] text-[#6F6F6F] mt-1">This may take a few seconds...</p>
          </div>
        ) : loading ? (
          <div className="text-center py-16">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-[#7B5E3B]" />
            <p className="text-[14px] text-[#6F6F6F] mt-3">Discovering places near you...</p>
          </div>
        ) : places.length === 0 ? (
          <div className="text-center py-16 px-5">
            <span className="text-5xl block mb-3">🔍</span>
            <p className="text-[#171717] font-extrabold text-lg">No places found nearby</p>
            <p className="text-[#6F6F6F] text-sm mt-1">Try expanding your search or changing categories</p>
          </div>
        ) : (
          <div>
            <div className="px-4 py-2 text-[11px] font-bold text-[#9E9E9E] uppercase tracking-wider bg-[#FAFAF8] border-b border-[#E8EDE4]">
              {places.length} places sorted by distance
            </div>
            {places.map((p, i) => (
              <div key={p.id || p.place_id || i} onClick={() => openDetail(p)}
                className={`flex gap-3 px-4 py-3.5 border-b border-[#E8EDE4]/50 cursor-pointer transition-colors active:bg-[#FDF6ED] ${
                  (selected?.id === p.id || selected?.place_id === p.place_id) ? 'bg-[#FDF6ED] border-l-[3px] border-l-[#7B5E3B]' : 'hover:bg-[#F9FAFB]'
                }`}>
                {/* Photo thumbnail */}
                <div className="w-[88px] h-[88px] rounded-xl overflow-hidden flex-shrink-0 bg-[#EDE4D8] relative">
                  {p.photos?.[0] ? (
                    <img src={p.photos[0]} className="w-full h-full object-cover cursor-pointer hover:opacity-90" alt={p.name} loading="lazy"
                      onClick={(e: any) => { e.stopPropagation(); setViewImages(p.photos); }} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl">
                      {CATEGORIES.find(c => c.v === p.category)?.icon || '📍'}
                    </div>
                  )}
                  {p.priceLevel != null && (
                    <div className="absolute top-1.5 left-1.5 bg-black/50 backdrop-blur-sm rounded-md px-1.5 py-0.5 text-[9px] font-bold text-white">
                      {'💰'.repeat(Math.min(p.priceLevel + 1, 4))}
                    </div>
                  )}
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-[14px] font-extrabold text-[#171717] leading-tight line-clamp-2">{p.name}</h3>
                    <button onClick={e => { e.stopPropagation(); toggleFav(p); }}
                      className={`flex-shrink-0 p-1 rounded-full transition-colors ${favNames.has(p.name || p.placeName) ? 'text-red-500' : 'text-[#D4C4B0] hover:text-red-300'}`}>
                      <Heart className="h-4 w-4" fill={favNames.has(p.name || p.placeName) ? 'currentColor' : 'none'} />
                    </button>
                  </div>
                  {(p.address || p.vicinity || p.city) && (
                    <p className="text-[12px] text-[#6F6F6F] mt-0.5 flex items-center gap-1 line-clamp-1">
                      <MapPin className="h-3 w-3 flex-shrink-0 text-[#9E9E9E]" />{p.address || p.vicinity || p.city}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-1.5 text-[12px] flex-wrap">
                    {p.rating > 0 && (
                      <span className="flex items-center gap-0.5 font-bold">
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> {p.rating.toFixed(1)}
                        {p.reviewCount > 0 && <span className="text-[#9E9E9E] font-normal">({p.reviewCount})</span>}
                      </span>
                    )}
                    {p.distance != null && <span className="text-[#6F6F6F] font-medium">{formatDistance(p.distance)}</span>}
                    <span className={`text-[11px] font-bold ${p.isOpen ? 'text-emerald-600' : 'text-red-400'}`}>
                      {p.isOpen ? '🟢 Open' : p.isOpen === false ? '🔴 Closed' : ''}
                    </span>
                  </div>
                  <div className="flex gap-1 mt-1.5 flex-wrap">
                    {p.isHiddenGem && <span className="text-[9px] bg-purple-100 text-purple-600 rounded-full px-2 py-0.5 font-bold">💎 Hidden Gem</span>}
                    {p.isTrending && <span className="text-[9px] bg-amber-100 text-amber-600 rounded-full px-2 py-0.5 font-bold">🔥 Trending</span>}
                    {p.category && <span className="text-[9px] bg-[#F5EDE3] text-[#7B5E3B] rounded-full px-2 py-0.5 font-medium">{p.category.replace(/_/g, ' ')}</span>}
                  </div>
                </div>
                {/* Navigate button */}
                <a href={`https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}`} target="_blank"
                  className="flex-shrink-0 self-center w-9 h-9 rounded-full bg-[#FDF6ED] flex items-center justify-center text-[#7B5E3B] hover:bg-[#7B5E3B] hover:text-white transition-colors ml-1"
                  onClick={e => e.stopPropagation()}>
                  <Navigation className="h-4 w-4" />
                </a>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* PLACE DETAIL OVERLAY */}
      {detailPlace && (
        <PlaceDetailView
          place={detailPlace}
          variant="overlay"
          onClose={() => { setDetailPlace(null); setSelected(null); }}
          isFavorited={favNames.has(detailPlace.name || detailPlace.placeName)}
          onToggleFav={() => toggleFav(detailPlace)}
        />
      )}

      {/* FULL-SCREEN IMAGE VIEWER */}
      {viewImages && viewImages.length > 0 && (
        <ImageViewer images={viewImages} onClose={() => setViewImages(null)} alt="Place photo" />
      )}
    </div>
  );
}
