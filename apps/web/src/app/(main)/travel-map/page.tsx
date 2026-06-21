// @ts-nocheck
'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useGpsTracker } from '@/hooks/use-gps-tracker';
import { MapContainer } from '@/components/map/map-container';
import { MapPin, Navigation, Play, Pause, Trash2, Route, Footprints } from 'lucide-react';

export default function TravelMapPage() {
  const { points, isTracking, totalDistanceKm, startTracking, stopTracking, clearBreadcrumbs } = useGpsTracker(true);
  const [viewMode, setViewMode] = useState<'trail' | 'stats'>('trail');

  const lastPoint = points[points.length - 1];
  const todayPoints = points.filter(p => new Date(p.timestamp).toDateString() === new Date().toDateString());
  const todayKm = todayPoints.reduce((s, p, i) => i === 0 ? 0 : s + haversineKm(todayPoints[i - 1].lat, todayPoints[i - 1].lng, p.lat, p.lng), 0);

  // Generate Google Maps polyline path
  const path = points.map(p => ({ lat: p.lat, lng: p.lng }));

  return (
    <div className="min-h-screen bg-[#FFFDF7]">
      {/* Header */}
      <div className="px-5 pt-14 pb-2 flex items-center justify-between">
        <div>
          <Link href="/profile" className="text-[#C4956A] text-[13px] font-semibold mb-1 block">← Back</Link>
          <h1 className="text-[28px] font-extrabold text-[#3C2415] flex items-center gap-2">🗺️ Travel Map</h1>
          <p className="text-[13px] text-[#8B7355] mt-1">{points.length} points · {totalDistanceKm.toFixed(1)} km tracked</p>
        </div>
        <div className="flex gap-2">
          {isTracking ? (
            <button onClick={stopTracking} className="w-11 h-11 rounded-full bg-red-500 text-white flex items-center justify-center shadow-md"><Pause className="h-5 w-5" /></button>
          ) : (
            <button onClick={startTracking} className="w-11 h-11 rounded-full bg-[#C4956A] text-white flex items-center justify-center shadow-md"><Play className="h-5 w-5" /></button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="px-5 mb-2 flex gap-2">
        {[{ v: 'trail', l: '🗺️ Trail' }, { v: 'stats', l: '📊 Stats' }].map(t => (
          <button key={t.v} onClick={() => setViewMode(t.v as any)} className={`px-4 py-2 rounded-full text-[13px] font-bold transition-all ${viewMode === t.v ? 'bg-[#C4956A] text-white' : 'bg-white text-[#8B7355] border border-[#E8D5C4]'}`}>{t.l}</button>
        ))}
      </div>

      {/* Map with breadcrumbs */}
      {viewMode === 'trail' && (
        <div className="px-5">
          <div className="rounded-2xl overflow-hidden shadow-sm border border-[#E8D5C4] h-[50vh] bg-[#F5EDE3]">
            {lastPoint ? (
              <MapContainer center={lastPoint} zoom={14} className="w-full h-full">
                {/* Polyline would be rendered by Google Maps API with the path */}
              </MapContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[#8B7355]">
                <div className="text-center">
                  <MapPin className="h-12 w-12 mx-auto text-[#D4C4B0] mb-3" />
                  <p className="font-bold">No GPS data yet</p>
                  <p className="text-sm mt-1">Press ▶️ to start tracking your journey</p>
                </div>
              </div>
            )}
          </div>

          {/* Tracking status */}
          <div className="mt-3 flex items-center justify-between bg-white rounded-2xl p-4 shadow-sm border border-[#E8D5C4]/50">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${isTracking ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
              <div>
                <p className="text-[14px] font-bold text-[#3C2415]">{isTracking ? 'Tracking Active' : 'Paused'}</p>
                <p className="text-[11px] text-[#8B7355]">{points.length} breadcrumbs · Every 30m</p>
              </div>
            </div>
            {points.length > 0 && (
              <button onClick={() => { if (confirm('Clear all GPS breadcrumbs?')) clearBreadcrumbs(); }}
                className="p-2 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="h-4 w-4 text-red-400" /></button>
            )}
          </div>

          {/* Recent breadcrumbs */}
          {points.length > 0 && (
            <div className="mt-3 bg-white rounded-2xl p-4 shadow-sm border border-[#E8D5C4]/50">
              <p className="text-[11px] font-bold text-[#8B7355] uppercase mb-2">📍 Recent Breadcrumbs</p>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {points.slice(-20).reverse().map((p, i) => (
                  <div key={i} className="flex items-center gap-2 text-[11px] text-[#8B7355]">
                    <span className="w-2 h-2 rounded-full bg-[#C4956A] flex-shrink-0" />
                    <span>{p.lat.toFixed(5)}, {p.lng.toFixed(5)}</span>
                    <span className="ml-auto text-[#A08970]">{new Date(p.timestamp).toLocaleTimeString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Stats */}
      {viewMode === 'stats' && (
        <div className="px-5 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            {[
              { l: 'Total Distance', v: `${totalDistanceKm.toFixed(1)} km`, e: '🛣️' },
              { l: 'Today', v: `${todayKm.toFixed(1)} km`, e: '📅' },
              { l: 'Breadcrumbs', v: points.length, e: '📍' },
              { l: 'Accuracy', v: lastPoint ? `${lastPoint.accuracy.toFixed(0)}m` : '—', e: '🎯' },
            ].map(s => (
              <div key={s.l} className="bg-white rounded-2xl p-4 shadow-sm border border-[#E8D5C4]/50 text-center">
                <span className="text-2xl">{s.e}</span>
                <p className="text-[20px] font-extrabold text-[#3C2415] mt-1">{s.v}</p>
                <p className="text-[10px] text-[#8B7355]">{s.l}</p>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#E8D5C4]/50">
            <p className="text-[11px] font-bold text-[#8B7355] uppercase mb-3">💡 Polarsteps Tip</p>
            <p className="text-[13px] text-[#6B4D3A] leading-relaxed">
              Keep GPS tracking on during your trips. Your route will automatically appear on this map.
              Share your travel trail with friends and build your travel passport.
            </p>
          </div>
        </div>
      )}

      <div className="h-24" />
    </div>
  );
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
