'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { X, Navigation, ExternalLink, MapPin, Plus, Upload, Loader2, Camera, Edit3, Trash2, Check } from 'lucide-react';

const API = 'http://localhost:3001';

function imgUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${API}${url.startsWith('/') ? '' : '/'}${url}`;
}

export default function JournalPage() {
  const [items, setItems] = useState<any[]>([]);
  const [show, setShow] = useState(false);
  const [detailItem, setDetailItem] = useState<any>(null);
  const [editItem, setEditItem] = useState<any>(null);
  const [f, setF] = useState({ title: '', place: '', content: '', mood: '😊', date: '', photos: [] as string[] });
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const moods = ['😊', '😍', '🏖️', '🍜', '😅', '🤩', '🥰', '😎', '🌅', '✈️'];

  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : '';
  const uid = typeof window !== 'undefined' ? localStorage.getItem('userId') || '' : '';
  const authHeaders = (extra: any = {}) => ({ ...(token ? { Authorization: `Bearer ${token}` } : {}), ...extra });

  const load = () => {
    fetch(`${API}/api/v1/auth/me/journals?userId=${uid}`, { headers: authHeaders() })
      .then(r => r.json()).then(d => setItems(d.data || [])).catch(() => {});
  };
  useEffect(() => { load(); }, []);

  /* ── Upload photo ── */
  const uploadPhoto = async () => {
    const file = fileRef.current?.files?.[0]; if (!file) return;
    if (f.photos.length >= 6) { setError('Max 6 photos per entry'); return; }
    setUploading(true); setError('');
    const fd = new FormData(); fd.append('file', file); fd.append('userId', uid);
    try {
      const r = await fetch(`${API}/api/v1/auth/me/photos/upload?userId=${uid}`, { method: 'POST', headers: authHeaders(), body: fd });
      const d = await r.json();
      if (d.data?.url) { setF({ ...f, photos: [...f.photos, d.data.url] }); if (fileRef.current) fileRef.current.value = ''; }
      else setError(d.error || d.message || 'Upload failed. Try logging in again.');
    } catch { setError('Network error - check your connection'); }
    setUploading(false);
  };

  /* ── Publish / Update ── */
  const submit = async () => {
    if (!f.title.trim() || !f.content.trim()) { setError('Title and content are required'); return; }
    setPublishing(true); setError('');

    try {
      const body: any = {
        title: f.title.trim(), place: f.place.trim(), content: f.content.trim(),
        mood: f.mood, photos: f.photos,
        ...(f.date ? { date: f.date } : {}),
      };

      const res = editItem
        ? await fetch(`${API}/api/v1/auth/me/journals/${editItem.id}?userId=${uid}`, { method: 'PATCH', headers: authHeaders({ 'Content-Type': 'application/json' }), body: JSON.stringify({...body, userId: uid}) })
        : await fetch(`${API}/api/v1/auth/me/journals?userId=${uid}`, { method: 'POST', headers: authHeaders({ 'Content-Type': 'application/json' }), body: JSON.stringify({...body, userId: uid}) });

      if (res.ok) {
        resetForm(); setShow(false); setEditItem(null); load();
      } else {
        const d = await res.json();
        setError(d.message || 'Failed to publish');
      }
    } catch { setError('Network error. Try again.'); }
    setPublishing(false);
  };

  const resetForm = () => setF({ title: '', place: '', content: '', mood: '😊', date: '', photos: [] });

  const startEdit = (item: any) => {
    setEditItem(item);
    setF({ title: item.title || '', place: item.place || '', content: item.content || '', mood: item.mood || '😊', date: item.date || '', photos: item.photos || [] });
    setShow(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const remove = async (id: string) => {
    await fetch(`${API}/api/v1/auth/me/journals/${id}?userId=${uid}`, { method: 'DELETE', headers: authHeaders() });
    setDetailItem(null); load();
  };

  const openMaps = (place: string) => window.open(`https://www.google.com/maps/search/${encodeURIComponent(place + ' travel')}`, '_blank');

  /* ═══════════════════════════════════════════════════════════════════
      MAIN VIEW
      ═══════════════════════════════════════════════════════════════════ */
  return (
    <div className="min-h-screen bg-[#FFFDF7]">
      {/* Header */}
      <div className="px-5 pt-14 pb-4 flex justify-between items-center">
        <div>
          <Link href="/profile" className="text-[#C4956A] text-[13px] font-semibold mb-1 block">← Back</Link>
          <h1 className="text-[28px] font-extrabold text-[#3C2415]">📝 Travel Journal</h1>
          <p className="text-[13px] text-[#8B7355] mt-1">{items.length} entries</p>
        </div>
        <button onClick={() => { resetForm(); setEditItem(null); setShow(!show); }}
          className="w-11 h-11 rounded-full bg-[#C4956A] text-white flex items-center justify-center shadow-md hover:bg-[#B8860B] transition-colors text-xl">
          {show ? '✕' : <Plus className="h-5 w-5" />}
        </button>
      </div>

      {/* Entry Form */}
      {show && (
        <div className="px-5 mb-4">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#E8D5C4] space-y-3">
            <h3 className="text-[14px] font-bold text-[#3C2415]">{editItem ? '✏️ Edit Entry' : '📝 New Entry'}</h3>

            <input value={f.title} onChange={e => setF({ ...f, title: e.target.value })}
              placeholder="Entry title (e.g. Best Laksa in Penang)" className="w-full rounded-xl border border-[#E8D5C4] px-3 py-2.5 text-[15px] font-bold text-[#3C2415] placeholder:text-[#A08970] outline-none focus:border-[#C4956A]" />

            <div className="flex gap-2">
              <input value={f.place} onChange={e => setF({ ...f, place: e.target.value })}
                placeholder="Place (e.g. Penang)" className="flex-1 rounded-xl border border-[#E8D5C4] px-3 py-2.5 text-[14px] text-[#3C2415] placeholder:text-[#A08970] outline-none focus:border-[#C4956A]" />
              <input type="date" value={f.date} onChange={e => setF({ ...f, date: e.target.value })}
                className="w-[140px] rounded-xl border border-[#E8D5C4] px-3 py-2.5 text-[13px] text-[#3C2415] outline-none focus:border-[#C4956A]" />
            </div>

            <textarea value={f.content} onChange={e => setF({ ...f, content: e.target.value })}
              placeholder="Write your travel story... What happened? What did you eat? How did you feel?" rows={5}
              className="w-full rounded-xl border border-[#E8D5C4] px-3 py-2.5 text-[14px] text-[#3C2415] placeholder:text-[#A08970] outline-none focus:border-[#C4956A] resize-none leading-relaxed" />

            {/* Mood selector */}
            <div className="flex gap-1.5 flex-wrap">{moods.map(m => (
              <button key={m} onClick={() => setF({ ...f, mood: m })}
                className={`w-9 h-9 rounded-lg text-lg transition-all ${f.mood === m ? 'bg-[#C4956A]/20 ring-2 ring-[#C4956A] scale-110' : 'bg-[#FDF0E0] hover:bg-[#F5EDE3]'}`}>{m}</button>
            ))}</div>

            {/* Photo upload */}
            <div>
              <p className="text-[12px] font-bold text-[#8B7355] mb-2">Photos ({f.photos.length}/6)</p>
              <div className="flex gap-2 items-center mb-2">
                <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="flex-1 text-[12px]" />
                <button onClick={uploadPhoto} disabled={uploading}
                  className="px-4 py-2 rounded-lg bg-[#FDF0E0] text-[#C4956A] text-[12px] font-bold flex items-center gap-1 hover:bg-[#F5EDE3] transition-colors">
                  {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}Add
                </button>
              </div>
              {f.photos.length > 0 && (
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                  {f.photos.map((p: string, i: number) => (
                    <div key={i} className="relative flex-shrink-0">
                      <img src={imgUrl(p)!} className="w-16 h-16 rounded-xl object-cover" alt="" />
                      <button onClick={() => setF({ ...f, photos: f.photos.filter((_, j) => j !== i) })}
                        className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-400 text-white text-[10px] flex items-center justify-center">✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {error && <p className="text-[13px] text-red-500 bg-red-50 rounded-xl px-3 py-2">{error}</p>}

            <div className="flex gap-2">
              <button onClick={submit} disabled={publishing}
                className="flex-1 py-2.5 rounded-xl bg-[#C4956A] text-white text-[14px] font-extrabold hover:bg-[#B8860B] transition-colors flex items-center justify-center gap-2">
                {publishing ? <><Loader2 className="h-4 w-4 animate-spin" /> Publishing...</> : editItem ? <><Check className="h-4 w-4" /> Save Changes</> : 'Publish Entry'}
              </button>
              {editItem && (
                <button onClick={() => { resetForm(); setEditItem(null); setShow(false); }}
                  className="px-5 py-2.5 rounded-xl bg-gray-100 text-[#3C2415] text-[14px] font-bold">Cancel</button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Entries List */}
      <div className="px-5 pb-24 space-y-4">
        {items.length === 0 && !show && (
          <div className="text-center py-16">
            <span className="text-5xl block mb-4">📝</span>
            <p className="text-[#3C2415] font-extrabold text-lg">No journal entries yet</p>
            <p className="text-[#8B7355] text-sm mt-1">Document your travel memories with stories and photos</p>
          </div>
        )}

        {items.map((item: any) => (
          <div key={item.id} className="bg-white rounded-2xl border border-[#E8D5C4]/70 shadow-sm overflow-hidden group transition-all hover:shadow-md">
            {/* Photos row */}
            {item.photos?.length > 0 && (
              <div className="flex gap-1 p-2 pb-0 overflow-x-auto no-scrollbar">
                {item.photos.map((p: string, i: number) => (
                  <img key={i} src={imgUrl(p)!} className="w-20 h-20 rounded-xl object-cover flex-shrink-0" alt=""
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                ))}
              </div>
            )}

            {/* Content */}
            <div onClick={() => setDetailItem(item)}
              className="p-4 cursor-pointer active:scale-[0.99]">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-2xl flex-shrink-0">{item.mood || '😊'}</span>
                  <h2 className="text-[16px] font-extrabold text-[#3C2415] truncate">{item.title}</h2>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                  <button onClick={(e) => { e.stopPropagation(); startEdit(item); }}
                    className="p-1.5 hover:bg-amber-50 rounded-lg transition-all opacity-0 group-hover:opacity-100">
                    <Edit3 className="h-3.5 w-3.5 text-[#8B7355]" /></button>
                  <button onClick={(e) => { e.stopPropagation(); remove(item.id); }}
                    className="p-1.5 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100">
                    <Trash2 className="h-3.5 w-3.5 text-red-400" /></button>
                </div>
              </div>
              <p className="text-[11px] text-[#8B7355] mb-2 flex items-center gap-1">
                {item.place && <><MapPin className="h-3 w-3" />{item.place} · </>}{item.date}
              </p>
              <p className="text-[14px] text-[#6B4D3A] leading-relaxed line-clamp-3">{item.content}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Detail Sheet */}
      {detailItem && (
        <div className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm flex items-end" onClick={() => setDetailItem(null)}>
          <div className="w-full max-h-[85vh] bg-white rounded-t-[28px] shadow-2xl overflow-y-auto animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex justify-center pt-3 pb-2"><div className="w-10 h-1 rounded-full bg-gray-300" /></div>
            <div className="flex items-center justify-between px-5 pb-2">
              <button onClick={() => setDetailItem(null)} className="p-2"><X className="h-5 w-5 text-[#3C2415]" /></button>
              <div className="flex gap-2">
                <button onClick={() => { setDetailItem(null); startEdit(detailItem); }}
                  className="px-4 py-2 rounded-xl bg-[#FDF0E0] text-[#C4956A] text-[13px] font-bold flex items-center gap-1"><Edit3 className="h-3.5 w-3.5" />Edit</button>
                <button onClick={() => { remove(detailItem.id); }}
                  className="px-4 py-2 rounded-xl bg-red-50 text-red-500 text-[13px] font-bold flex items-center gap-1"><Trash2 className="h-3.5 w-3.5" />Delete</button>
              </div>
            </div>

            <div className="p-5 space-y-4">
              {/* Photos */}
              {detailItem.photos?.length > 0 && (
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                  {detailItem.photos.map((p: string, i: number) => (
                    <img key={i} src={imgUrl(p)!} className="w-32 h-32 rounded-2xl object-cover flex-shrink-0" alt=""
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  ))}
                </div>
              )}

              <div className="text-center">
                <span className="text-5xl block mb-2">{detailItem.mood || '📝'}</span>
                <h2 className="text-[24px] font-extrabold text-[#3C2415]">{detailItem.title}</h2>
                <p className="text-[13px] text-[#8B7355] mt-1 flex items-center justify-center gap-1">
                  {detailItem.place && <><MapPin className="h-3.5 w-3.5" />{detailItem.place} · </>}{detailItem.date}
                </p>
              </div>

              <div className="bg-[#FDF0E0] rounded-2xl p-4">
                <p className="text-[15px] text-[#6B4D3A] leading-relaxed whitespace-pre-wrap">{detailItem.content}</p>
              </div>

              {detailItem.place && (
                <div className="flex gap-2">
                  <button onClick={() => openMaps(detailItem.place)}
                    className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-[#C4956A] py-3 text-sm font-extrabold text-white shadow-lg hover:bg-[#B8860B] transition-all">
                    <Navigation className="h-4 w-4" />Explore on Maps</button>
                  <button onClick={() => window.open(`https://www.google.com/search?tbm=isch&q=${encodeURIComponent(detailItem.place + ' travel photography')}`, '_blank')}
                    className="flex items-center justify-center gap-2 rounded-2xl border border-[#E8D5C4] bg-white px-4 py-3 text-sm font-extrabold text-[#3C2415] hover:bg-[#FDF0E0] transition-all">
                    <ExternalLink className="h-4 w-4" />Photos</button>
                </div>
              )}

              <button onClick={() => setDetailItem(null)} className="w-full py-3 rounded-xl bg-gray-100 text-[#3C2415] text-sm font-bold">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
