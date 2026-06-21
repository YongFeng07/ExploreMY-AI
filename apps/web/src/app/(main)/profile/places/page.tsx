'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { MapPin, ExternalLink, Navigation, X } from 'lucide-react';

const CITY_EMOJIS:Record<string,string>={'Kuala Lumpur':'🏙️','Penang':'🍜','Melaka':'🏛️','Langkawi':'🏖️','Johor Bahru':'🌉','Ipoh':'☕','Cameron Highlands':'🍃','Kota Kinabalu':'🏔️','Kuching':'🐱','Kuantan':'🌊','Port Dickson':'🏝️','Genting Highlands':'🎢','Kuala Terengganu':'🌴','Alor Setar':'🕌','Kota Bharu':'🌾','Seremban':'🏛️','Putrajaya':'🕌','Petaling Jaya':'🌆','Shah Alam':'🕌','Miri':'🌊','Sandakan':'🦧','Pulau Perhentian':'🏝️','Pulau Redang':'🏖️','Pulau Tioman':'🏝️','Sekinchan':'🌾','Taiping':'🌿','Batu Pahat':'🏙️','Bukit Tinggi':'🏔️'};

export default function PlacesVisitedPage() {
  const [trips, setTrips] = useState<any[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [selCity, setSelCity] = useState<string | null>(null);
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : '';

  useEffect(() => {
    fetch('http://localhost:3001/api/v1/auth/me', { headers: { 'Authorization': `Bearer ${token}` } })
      .then(r => r.json()).then(d => { setCities(d.data?.visitedCities || []); });
    fetch('http://localhost:3001/api/v1/auth/me/travel-history', { headers: { 'Authorization': `Bearer ${token}` } })
      .then(r => r.json()).then(d => setTrips(d.data || []));
  }, []);

  const cityCounts: Record<string, number> = {};
  const cityTrips: Record<string, any[]> = {};
  trips.forEach((t: any) => {
    cityCounts[t.city] = (cityCounts[t.city] || 0) + 1;
    if (!cityTrips[t.city]) cityTrips[t.city] = [];
    cityTrips[t.city]!.push(t);
  });

  const openGoogleMaps = (city: string) => {
    window.open(`https://www.google.com/maps/search/${encodeURIComponent(city + ' Malaysia attractions')}`, '_blank');
  };

  return (
    <div className="min-h-dvh bg-white">
      <div className="px-5 pt-14 pb-6">
        <Link href="/profile" className="text-amber-600 text-[13px] font-semibold mb-3 block">← Back</Link>
        <h1 className="text-[28px] font-extrabold text-gray-800">📍 Places Visited</h1>
        <p className="text-[13px] text-gray-400 mt-1">{cities.length} cities · {trips.length} visits</p>
      </div>
      <div className="px-5 pb-24 space-y-2">
        {cities.length === 0 && (
          <div className="text-center py-20">
            <span className="text-5xl block mb-4">📍</span>
            <p className="text-gray-800 font-extrabold text-lg">No places visited yet</p>
            <p className="text-gray-400 text-sm mt-1">Add completed trips in your Travel Timeline</p>
          </div>
        )}
        {cities.map((c: string) => (
          <div key={c} onClick={() => setSelCity(c)}
            className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-100 shadow-sm cursor-pointer hover:border-amber-200 hover:shadow-md transition-all active:scale-[0.98]">
            <span className="text-3xl">{CITY_EMOJIS[c] || '📍'}</span>
            <div className="flex-1">
              <p className="text-[14px] font-extrabold text-gray-800">{c}</p>
              <p className="text-[10px] text-gray-400">{cityCounts[c] || 1} {cityCounts[c] === 1 ? 'visit' : 'visits'}</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold bg-emerald-50 text-emerald-600 rounded-full px-2 py-0.5">Visited</span>
            </div>
          </div>
        ))}
      </div>

      {/* City Detail Sheet */}
      {selCity && (
        <div className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm flex items-end" onClick={() => setSelCity(null)}>
          <div className="w-full max-h-[80vh] bg-white rounded-t-[28px] shadow-2xl overflow-y-auto animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex justify-center pt-3 pb-2"><div className="w-10 h-1 rounded-full bg-gray-300" /></div>
            <button onClick={() => setSelCity(null)} className="absolute right-4 top-4 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"><X className="h-4 w-4" /></button>

            <div className="p-5">
              <div className="text-center mb-4">
                <span className="text-6xl block mb-3">{CITY_EMOJIS[selCity] || '📍'}</span>
                <h2 className="text-[26px] font-extrabold text-gray-800">{selCity}</h2>
                <p className="text-[14px] text-gray-500 mt-1">{cityCounts[selCity] || 1} visits</p>
              </div>

              {/* Trip history for this city */}
              {selCity && (cityTrips[selCity]?.length ?? 0) > 0 && (
                <div className="mb-4 space-y-2">
                  <p className="text-[12px] font-bold text-gray-400 uppercase tracking-wider">Trip History</p>
                  {selCity && cityTrips[selCity]?.map((t: any, i: number) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl">
                      <span className="text-lg">{t.emoji || '✈️'}</span>
                      <div><p className="text-[13px] font-bold text-gray-800">{t.title}</p><p className="text-[11px] text-gray-400">{t.date}</p></div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <button onClick={() => openGoogleMaps(selCity)}
                  className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-[#C4956A] py-3 text-sm font-extrabold text-white shadow-lg hover:bg-[#B8860B] transition-all">
                  <Navigation className="h-4 w-4" />Explore on Maps
                </button>
                <button onClick={() => openGoogleMaps(selCity)}
                  className="flex items-center justify-center gap-2 rounded-2xl border border-[#E8D5C4] bg-white px-4 py-3 text-sm font-extrabold text-[#3C2415] shadow-sm hover:bg-[#FDF0E0] transition-all">
                  <ExternalLink className="h-4 w-4" />Photos
                </button>
              </div>

              <button onClick={() => setSelCity(null)} className="w-full py-3 mt-3 rounded-xl bg-gray-100 text-gray-600 text-sm font-bold">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
