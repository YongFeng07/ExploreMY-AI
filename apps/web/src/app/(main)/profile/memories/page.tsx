'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { MapPin, Camera, BookOpen, Navigation, X } from 'lucide-react';

const API = 'http://localhost:3001';
function imgUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${API}${url.startsWith('/') ? '' : '/'}${url}`;
}

export default function MemoriesPage() {
  const [photos, setPhotos] = useState<any[]>([]);
  const [journals, setJournals] = useState<any[]>([]);
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewPhoto, setViewPhoto] = useState<string | null>(null);
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : '';
  const uid = typeof window !== 'undefined' ? localStorage.getItem('userId') || '' : '';

  useEffect(() => {
    const h: any = {};
    if (token) h['Authorization'] = `Bearer ${token}`;
    Promise.all([
      fetch(`${API}/api/v1/auth/me/photos?userId=${uid}`, { headers: h }).then(r => r.json()).catch(() => ({ data: [] })),
      fetch(`${API}/api/v1/auth/me/journals?userId=${uid}`, { headers: h }).then(r => r.json()).catch(() => ({ data: [] })),
      fetch(`${API}/api/v1/auth/me/travel-history?userId=${uid}`, { headers: h }).then(r => r.json()).catch(() => ({ data: [] })),
    ]).then(([p, j, t]) => {
      setPhotos(p.data || []);
      setJournals(j.data || []);
      setTrips(t.data || []);
      setLoading(false);
    });
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-[#FFFDF7] flex items-center justify-center">
      <div className="w-10 h-10 rounded-full border-2 border-[#C4956A]/20 border-t-[#C4956A] animate-spin" />
    </div>
  );

  const allMemories = [
    ...photos.map((p: any) => ({ type: 'photo', ...p, sortDate: p.date || '' })),
    ...journals.map((j: any) => ({ type: 'journal', ...j, sortDate: j.date || '' })),
    ...trips.map((t: any) => ({ type: 'trip', ...t, sortDate: t.date || t.completedAt?.split('T')[0] || '' })),
  ].sort((a: any, b: any) => new Date(b.sortDate || 0).getTime() - new Date(a.sortDate || 0).getTime());

  return (
    <div className="min-h-screen bg-[#FFFDF7]">
      <div className="px-5 pt-14 pb-4">
        <Link href="/profile" className="text-[#C4956A] text-[13px] font-semibold mb-2 block">← Back</Link>
        <h1 className="text-[28px] font-extrabold text-[#3C2415]">📖 Travel Scrapbook</h1>
        <p className="text-[13px] text-[#8B7355] mt-1">
          {allMemories.length} memories · {photos.length} 📸 · {journals.length} 📝 · {trips.length} ✈️
        </p>
      </div>

      <div className="px-5 pb-24 space-y-4">
        {allMemories.length === 0 && (
          <div className="text-center py-16">
            <span className="text-5xl block mb-4">📖</span>
            <p className="text-[#3C2415] font-extrabold text-lg">No memories yet</p>
            <p className="text-[#8B7355] text-sm mt-1">Add trips, journals, and photos to build your scrapbook</p>
            <Link href="/weekend-planner" className="inline-block mt-4 px-6 py-2.5 bg-[#C4956A] text-white rounded-xl font-bold text-sm">Start Planning</Link>
          </div>
        )}

        {allMemories.map((m: any, i: number) => (
          <div key={i} className="bg-white rounded-2xl border border-[#E8D5C4]/70 shadow-sm overflow-hidden hover:shadow-md transition-all">
            {/* Type badge */}
            <div className="flex items-center gap-2 px-4 pt-4">
              <span className={`text-[10px] font-bold uppercase tracking-wider rounded-full px-2.5 py-0.5 ${
                m.type === 'photo' ? 'bg-blue-50 text-blue-600' : m.type === 'journal' ? 'bg-purple-50 text-purple-600' : 'bg-amber-50 text-amber-600'
              }`}>
                {m.type === 'photo' ? '📸 Photo' : m.type === 'journal' ? '📝 Journal' : '✈️ Trip'}
              </span>
              <span className="ml-auto text-[11px] text-[#A08970]">{m.sortDate || m.date}</span>
            </div>

            {/* Photo content */}
            {m.type === 'photo' && m.url && (
              <div className="px-4 pt-3">
                <img src={imgUrl(m.url)!} className="w-full h-56 object-cover rounded-xl cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => setViewPhoto(imgUrl(m.url))} alt=""
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                <div className="flex items-center gap-2 mt-2 pb-3">
                  {m.place && <span className="text-[12px] text-[#8B7355] flex items-center gap-1"><MapPin className="h-3 w-3" />{m.place}</span>}
                  {m.caption && <p className="text-[13px] text-[#6B4D3A] font-medium">{m.caption}</p>}
                </div>
              </div>
            )}

            {/* Journal content */}
            {m.type === 'journal' && (
              <div className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-2xl">{m.mood || '😊'}</span>
                  <h3 className="text-[16px] font-extrabold text-[#3C2415]">{m.title}</h3>
                </div>
                <p className="text-[12px] text-[#8B7355] flex items-center gap-1">
                  {m.place && <><MapPin className="h-3 w-3" />{m.place} · </>}{m.date}
                </p>
                <p className="text-[14px] text-[#6B4D3A] mt-2 leading-relaxed line-clamp-4">{m.content}</p>
              </div>
            )}

            {/* Trip content */}
            {m.type === 'trip' && (
              <div className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-2xl">{m.emoji || '✈️'}</span>
                  <h3 className="text-[16px] font-extrabold text-[#3C2415]">{m.title}</h3>
                </div>
                <p className="text-[12px] text-[#8B7355] flex items-center gap-1">
                  <MapPin className="h-3 w-3" />{m.city || 'Unknown'}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Full-screen photo viewer */}
      {viewPhoto && (
        <div className="fixed inset-0 z-[9999] bg-black flex items-center justify-center" onClick={() => setViewPhoto(null)}>
          <button onClick={() => setViewPhoto(null)} className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-white z-20"><X className="h-5 w-5" /></button>
          <img src={viewPhoto} className="max-w-full max-h-[90vh] object-contain" alt="" onClick={e => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}
