// @ts-nocheck
'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Trash2, X, Navigation, ExternalLink } from 'lucide-react';

const WISH_KEY = 'wishlist';
const EMOJIS = ['🗼', '🏝️', '🏔️', '🌍', '🏛️', '🎌', '🏖️', '🗽', '🇯🇵', '🇫🇷', '🇬🇧', '🇦🇺', '🇹🇭', '🇮🇩', '🇰🇷', '🇲🇾'];

function loadWish() { try { return JSON.parse(localStorage.getItem(WISH_KEY) || '[]'); } catch { return []; } }
function saveWish(items: any[]) { localStorage.setItem(WISH_KEY, JSON.stringify(items)); }

export default function WishlistPage() {
  const [items, setItems] = useState<any[]>(loadWish);
  const [show, setShow] = useState(false);
  const [detailItem, setDetailItem] = useState<any>(null);
  const [f, setF] = useState({ destination: '', emoji: '🏝️', estimatedCost: 0, priority: 'medium', notes: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const add = () => {
    if (!f.destination.trim()) { setError('Destination is required'); return; }
    setSaving(true); setError('');
    const item = { id: 'w_' + Date.now(), ...f, createdAt: new Date().toISOString() };
    const updated = [item, ...items];
    saveWish(updated); setItems(updated);
    setF({ destination: '', emoji: '🏝️', estimatedCost: 0, priority: 'medium', notes: '' }); setShow(false);
    setSaving(false);
  };

  const remove = (id: string) => {
    const updated = items.filter((i: any) => i.id !== id);
    saveWish(updated); setItems(updated);
    if (detailItem?.id === id) setDetailItem(null);
  };

  return (
    <div className="min-h-screen bg-[#FFFDF7]">
      <div className="px-5 pt-14 pb-4 flex justify-between items-center">
        <div>
          <Link href="/profile" className="text-[#C4956A] text-[13px] font-semibold mb-2 block">← Back</Link>
          <h1 className="text-[28px] font-extrabold text-[#3C2415]">🎯 Wishlist</h1>
          <p className="text-[13px] text-[#8B7355] mt-1">{items.length} dream destinations</p>
        </div>
        <button onClick={() => setShow(!show)}
          className="w-11 h-11 rounded-full bg-[#C4956A] text-white flex items-center justify-center shadow-md hover:bg-[#B8860B] transition-colors text-xl">
          {show ? '✕' : <Plus className="h-5 w-5" />}
        </button>
      </div>

      {show && (
        <div className="px-5 mb-4">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#E8D5C4] space-y-3">
            <h3 className="text-[14px] font-bold text-[#3C2415]">Add Dream Destination</h3>
            <input value={f.destination} onChange={e => setF({ ...f, destination: e.target.value })}
              placeholder="Destination (e.g. Tokyo, Japan)" className="w-full rounded-xl border border-[#E8D5C4] px-3 py-2.5 text-[15px] font-bold text-[#3C2415] placeholder:text-[#A08970] outline-none focus:border-[#C4956A]" />
            <div className="flex gap-2">
              <input type="number" value={f.estimatedCost || ''} onChange={e => setF({ ...f, estimatedCost: +e.target.value })}
                placeholder="Est. cost (MYR)" className="flex-1 rounded-xl border border-[#E8D5C4] px-3 py-2.5 text-[14px] text-[#3C2415] placeholder:text-[#A08970] outline-none focus:border-[#C4956A]" />
              <select value={f.priority} onChange={e => setF({ ...f, priority: e.target.value })}
                className="rounded-xl border border-[#E8D5C4] px-3 py-2 text-[13px] font-bold text-[#3C2415] bg-white outline-none focus:border-[#C4956A]">
                <option value="high">🔴 High Priority</option><option value="medium">🟡 Medium</option><option value="low">🟢 Low</option>
              </select>
            </div>
            <textarea value={f.notes} onChange={e => setF({ ...f, notes: e.target.value })}
              placeholder="Notes (why this place? what do you want to do there?)" rows={2}
              className="w-full rounded-xl border border-[#E8D5C4] px-3 py-2.5 text-[13px] text-[#3C2415] placeholder:text-[#A08970] outline-none focus:border-[#C4956A] resize-none" />
            <p className="text-[12px] font-bold text-[#8B7355]">Choose Emoji</p>
            <div className="flex gap-1.5 flex-wrap">{EMOJIS.map(e => (
              <button key={e} onClick={() => setF({ ...f, emoji: e })}
                className={`w-9 h-9 rounded-lg text-lg transition-all ${f.emoji === e ? 'bg-[#C4956A]/20 ring-2 ring-[#C4956A] scale-110' : 'bg-[#FDF0E0] hover:bg-[#F5EDE3]'}`}>{e}</button>))}</div>
            {error && <p className="text-[13px] text-red-500 bg-red-50 rounded-xl px-3 py-2">{error}</p>}
            <button onClick={add} disabled={saving}
              className="w-full py-2.5 rounded-xl bg-[#C4956A] text-white text-[14px] font-extrabold hover:bg-[#B8860B] transition-colors disabled:opacity-50">
              {saving ? 'Adding...' : 'Add to Wishlist'}
            </button>
          </div>
        </div>
      )}

      <div className="px-5 pb-24 space-y-2">
        {items.length === 0 && !show && (
          <div className="text-center py-16">
            <span className="text-5xl block mb-4">🎯</span>
            <p className="text-[#3C2415] font-extrabold text-lg">No wishlist yet</p>
            <p className="text-[#8B7355] text-sm mt-1">Add destinations you dream of visiting</p>
          </div>
        )}
        {items.map((item: any) => (
          <div key={item.id} onClick={() => setDetailItem(item)}
            className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-[#E8D5C4]/70 shadow-sm group cursor-pointer hover:shadow-md transition-all active:scale-[0.98]">
            <span className="text-3xl flex-shrink-0">{item.emoji || '🎯'}</span>
            <div className="flex-1 min-w-0">
              <p className="text-[15px] font-extrabold text-[#3C2415] truncate">{item.destination}</p>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <span className="text-[11px] font-bold text-[#8B7355]">~RM {(item.estimatedCost || 0).toLocaleString()}</span>
                <span className={`text-[10px] font-bold rounded-full px-2 py-0.5 ${item.priority === 'high' ? 'bg-red-50 text-red-500' : item.priority === 'medium' ? 'bg-amber-50 text-amber-500' : 'bg-emerald-50 text-emerald-500'}`}>
                  {item.priority === 'high' ? '🔴 High' : item.priority === 'medium' ? '🟡 Med' : '🟢 Low'}
                </span>
              </div>
              {item.notes && <p className="text-[11px] text-[#A08970] mt-0.5 line-clamp-1">{item.notes}</p>}
            </div>
            <button onClick={(e) => { e.stopPropagation(); remove(item.id); }}
              className="opacity-0 group-hover:opacity-100 p-2 hover:bg-red-50 rounded-lg transition-all flex-shrink-0"><Trash2 className="h-4 w-4 text-red-400" /></button>
          </div>
        ))}
      </div>

      {/* Detail Sheet */}
      {detailItem && (
        <div className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm flex items-end" onClick={() => setDetailItem(null)}>
          <div className="w-full max-h-[80vh] bg-white rounded-t-[28px] shadow-2xl overflow-y-auto animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex justify-center pt-3 pb-2"><div className="w-10 h-1 rounded-full bg-gray-300" /></div>
            <button onClick={() => setDetailItem(null)} className="absolute right-4 top-4 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"><X className="h-4 w-4" /></button>
            <div className="p-5 text-center">
              <span className="text-6xl block mb-3">{detailItem.emoji || '🎯'}</span>
              <h2 className="text-[26px] font-extrabold text-[#3C2415]">{detailItem.destination}</h2>
              <div className="flex items-center justify-center gap-3 mt-2 flex-wrap">
                <span className="text-[14px] font-bold text-[#C4956A]">~RM {(detailItem.estimatedCost || 0).toLocaleString()}</span>
                <span className={`text-[12px] font-bold rounded-full px-3 py-0.5 ${detailItem.priority === 'high' ? 'bg-red-50 text-red-500' : detailItem.priority === 'medium' ? 'bg-amber-50 text-amber-500' : 'bg-emerald-50 text-emerald-500'}`}>
                  {detailItem.priority === 'high' ? '🔴 High Priority' : detailItem.priority === 'medium' ? '🟡 Medium Priority' : '🟢 Low Priority'}
                </span>
              </div>
              {detailItem.notes && <p className="text-[14px] text-[#6B4D3A] mt-4 italic leading-relaxed">"{detailItem.notes}"</p>}
              <div className="flex gap-2 mt-5">
                <button onClick={() => window.open(`https://www.google.com/maps/search/${encodeURIComponent(detailItem.destination + ' travel attractions')}`, '_blank')}
                  className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-[#C4956A] py-3 text-sm font-extrabold text-white shadow-lg hover:bg-[#B8860B] transition-all">
                  <Navigation className="h-4 w-4" />Explore on Maps</button>
                <button onClick={() => window.open(`https://www.google.com/search?tbm=isch&q=${encodeURIComponent(detailItem.destination + ' travel photography')}`, '_blank')}
                  className="flex items-center justify-center gap-2 rounded-2xl border border-[#E8D5C4] bg-white px-4 py-3 text-sm font-extrabold text-[#3C2415] hover:bg-[#FDF0E0] transition-all">
                  <ExternalLink className="h-4 w-4" />Photos</button>
              </div>
              <button onClick={() => { remove(detailItem.id); }}
                className="w-full py-3 mt-3 rounded-xl bg-red-50 text-red-500 text-sm font-bold">Remove from Wishlist</button>
              <button onClick={() => setDetailItem(null)} className="w-full py-3 rounded-xl bg-gray-100 text-[#3C2415] text-sm font-bold mt-2">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
