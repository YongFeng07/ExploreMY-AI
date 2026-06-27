// @ts-nocheck
'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Star, MapPin, Trash2, X, Navigation, ExternalLink } from 'lucide-react';
type FavItem = { id: string; placeName: string; city: string; category: string; rating: number; photo: string; savedAt: string };

function loadFavs(): FavItem[] { try { return JSON.parse(localStorage.getItem('favorites') || '[]'); } catch { return []; } }
function saveFavs(items: FavItem[]) { localStorage.setItem('favorites', JSON.stringify(items)); }

export default function FavoritesPage() {
  const [items, setItems] = useState<FavItem[]>(loadFavs);
  const [loading, setLoading] = useState(false);
  const [detailItem, setDetailItem] = useState<FavItem | null>(null);

  const remove = (id: string) => {
    const updated = items.filter(i => i.id !== id);
    saveFavs(updated); setItems(updated);
    if (detailItem?.id === id) setDetailItem(null);
  };

  const openMaps = (name: string, city: string) => {
    window.open(`https://www.google.com/maps/search/${encodeURIComponent(name + ' ' + city)}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-[#FFFDF7]">
      <div className="px-5 pt-14 pb-4">
        <Link href="/profile" className="text-[#C4956A] text-[13px] font-semibold mb-2 block">← Back</Link>
        <h1 className="text-[28px] font-extrabold text-[#3C2415]">❤️ Favorites</h1>
        <p className="text-[13px] text-[#8B7355] mt-1">{items.length} saved places</p>
      </div>

      <div className="px-5 pb-24 space-y-2">
        {loading && <div className="text-center py-16"><div className="w-10 h-10 rounded-full border-2 border-[#C4956A]/20 border-t-[#C4956A] animate-spin mx-auto" /></div>}
        {!loading && items.length === 0 && (
          <div className="text-center py-16">
            <span className="text-5xl block mb-4">❤️</span>
            <p className="text-[#3C2415] font-extrabold text-lg">No favorites yet</p>
            <p className="text-[#8B7355] text-sm mt-1">Tap the heart on places in Explore to save them here</p>
            <Link href="/explore" className="inline-block mt-4 px-6 py-2.5 bg-[#C4956A] text-white rounded-xl font-bold text-sm">Explore Places</Link>
          </div>
        )}
        {items.map((item, i) => (
          <div key={i} onClick={() => setDetailItem(item)}
            className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-[#E8D5C4]/70 shadow-sm group cursor-pointer hover:border-amber-200 hover:shadow-md transition-all active:scale-[0.98]">
            {item.photo ? <img src={item.photo || ''} className="w-14 h-14 rounded-xl object-cover flex-shrink-0" alt="" /> :
              <div className="w-14 h-14 rounded-xl bg-[#FDF0E0] flex items-center justify-center text-xl flex-shrink-0">📍</div>}
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-extrabold text-[#3C2415] truncate">{item.placeName}</p>
              <p className="text-[11px] text-[#8B7355] flex items-center gap-1 mt-0.5">
                <MapPin className="h-3 w-3" />{item.city || 'Unknown'} · <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> {item.rating || '—'}
              </p>
            </div>
            <button onClick={(e) => { e.stopPropagation(); remove(item.id); }}
              className="opacity-0 group-hover:opacity-100 p-2 hover:bg-red-50 rounded-lg transition-all flex-shrink-0"><Trash2 className="h-4 w-4 text-red-400" /></button>
          </div>
        ))}
      </div>

      {/* Detail Sheet */}
      {detailItem && (
        <div className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm flex items-end" onClick={() => setDetailItem(null)}>
          <div className="w-full max-h-[85vh] bg-white rounded-t-[28px] shadow-2xl overflow-y-auto animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex justify-center pt-3 pb-2"><div className="w-10 h-1 rounded-full bg-gray-300" /></div>
            <button onClick={() => setDetailItem(null)} className="absolute right-4 top-4 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"><X className="h-4 w-4" /></button>
            <div className="h-48 mx-4 rounded-2xl overflow-hidden bg-[#FDF0E0] mt-2">
              {detailItem.photo ? <img src={detailItem.photo} className="w-full h-full object-cover" alt="" /> :
                <div className="w-full h-full flex items-center justify-center text-6xl">📍</div>}
            </div>
            <div className="p-5 space-y-3">
              <div>
                <h2 className="text-[24px] font-extrabold text-[#3C2415]">{detailItem.placeName}</h2>
                <p className="text-[14px] text-[#8B7355] flex items-center gap-1 mt-1">
                  <MapPin className="h-3.5 w-3.5" />{detailItem.city || 'Unknown'} · <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> {detailItem.rating || '—'}
                </p>
                {detailItem.category && <span className="inline-block mt-2 text-[11px] font-bold bg-[#FDF0E0] text-[#C4956A] px-3 py-1 rounded-full">{detailItem.category}</span>}
              </div>
              <div className="flex gap-2">
                <button onClick={() => openMaps(detailItem.placeName, detailItem.city)}
                  className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-[#C4956A] py-3 text-sm font-extrabold text-white shadow-lg hover:bg-[#B8860B] transition-all">
                  <Navigation className="h-4 w-4" />View on Maps</button>
                <button onClick={() => { remove(detailItem.id); }}
                  className="px-4 py-3 rounded-2xl border border-red-200 bg-red-50 text-red-500 text-sm font-extrabold hover:bg-red-100 transition-all"><Trash2 className="h-4 w-4" /></button>
              </div>
              <button onClick={() => setDetailItem(null)} className="w-full py-3 rounded-xl bg-gray-100 text-[#3C2415] text-sm font-bold">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
