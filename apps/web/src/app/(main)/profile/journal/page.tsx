// @ts-nocheck
'use client';
import { useState, useRef } from 'react';
import Link from 'next/link';
import { X, MoveRight, MapPin, Plus, Upload, Loader2, Camera, Edit3, Trash2, Check } from 'lucide-react';

const JOURNAL_KEY = 'profile_journals';
function loadJ(): any[] { try { return JSON.parse(localStorage.getItem(JOURNAL_KEY) || '[]'); } catch { return []; } }
function saveJ(items: any[]) { localStorage.setItem(JOURNAL_KEY, JSON.stringify(items)); }

export default function JournalPage() {
  const [items, setItems] = useState<any[]>(loadJ);
  const [show, setShow] = useState(false);
  const [detailItem, setDetailItem] = useState<any>(null);
  const [editItem, setEditItem] = useState<any>(null);
  const [f, setF] = useState({ title: '', place: '', content: '', mood: '😊', date: '', photos: [] as string[] });
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const moods = ['😊', '😍', '🏖️', '🍜', '😅', '🤩', '🥰', '😎', '🌅', '✈️'];

  const uploadPhoto = () => {
    const file = fileRef.current?.files?.[0]; if (!file) return;
    setUploading(true); setError('');
    const r = new FileReader();
    r.onload = () => { setF({ ...f, photos: [...f.photos, r.result as string] }); setUploading(false); };
    r.readAsDataURL(file);
  };

  const resetForm = () => setF({ title: '', place: '', content: '', mood: '😊', date: '', photos: [] });

  const submit = () => {
    if (!f.title.trim() || !f.content.trim()) { setError('Title and content are required'); return; }
    setPublishing(true); setError('');
    const entry = { ...f, id: editItem?.id || 'j_' + Date.now(), date: f.date || new Date().toISOString().split('T')[0], createdAt: new Date().toISOString() };
    const all = loadJ();
    const updated = editItem ? all.map((i: any) => i.id === editItem.id ? entry : i) : [entry, ...all];
    saveJ(updated); setItems(updated);
    resetForm(); setShow(false); setEditItem(null);
    setPublishing(false);
  };

  const remove = (id: string) => {
    const updated = items.filter((i: any) => i.id !== id);
    saveJ(updated); setItems(updated);
    setDetailItem(null);
  };

  const edit = (item: any) => { setEditItem(item); setF(item); setShow(true); };

  return (
    <div className="min-h-screen bg-[#FFFDF7]">
      <div className="px-5 pt-14 pb-4 flex justify-between items-center">
        <Link href="/profile" className="text-[#C4956A] text-[13px] font-semibold">← Back</Link>
        <button onClick={() => { resetForm(); setEditItem(null); setShow(true); }} className="px-4 py-2 rounded-xl bg-[#C4956A] text-white text-[12px] font-bold flex items-center gap-1"><Plus className="h-4 w-4" /> New Entry</button>
      </div>
      <div className="px-5 pb-24">
        <h1 className="text-[28px] font-extrabold text-[#3C2415] mb-1">📝 Travel Journal</h1>
        <p className="text-[13px] text-[#8B7355] mb-4">{items.length} entries</p>

        {items.length === 0 && (
          <div className="text-center py-16">
            <span className="text-5xl block mb-4">📝</span>
            <p className="text-[#3C2415] font-extrabold text-lg">No journal entries yet</p>
            <p className="text-[#8B7355] text-sm mt-1">Document your travel memories</p>
            <button onClick={() => { resetForm(); setEditItem(null); setShow(true); }} className="inline-block mt-4 px-6 py-2.5 bg-[#C4956A] text-white rounded-xl font-bold text-sm">Write Your First Entry</button>
          </div>
        )}

        <div className="space-y-3">
          {items.map((item: any) => (
            <div key={item.id} className="bg-white rounded-2xl border border-[#E8D5C4]/70 shadow-sm p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setDetailItem(item)}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{item.mood || '😊'}</span>
                  <div>
                    <p className="text-[14px] font-extrabold text-[#3C2415]">{item.title}</p>
                    {item.place && <p className="text-[11px] text-[#8B7355] flex items-center gap-1"><MapPin className="h-3 w-3" />{item.place}</p>}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={(e) => { e.stopPropagation(); edit(item); }} className="p-2 hover:bg-gray-100 rounded-lg"><Edit3 className="h-4 w-4 text-gray-400" /></button>
                  <button onClick={(e) => { e.stopPropagation(); remove(item.id); }} className="p-2 hover:bg-red-50 rounded-lg"><Trash2 className="h-4 w-4 text-red-400" /></button>
                </div>
              </div>
              <p className="text-[12px] text-[#6B7280] line-clamp-2">{item.content}</p>
              {item.photos?.length > 0 && <div className="flex gap-1 mt-2">{item.photos.slice(0,4).map((p: string, i: number) => <img key={i} src={p} className="w-14 h-14 rounded-lg object-cover" alt="" />)}</div>}
              <p className="text-[10px] text-gray-400 mt-2">{item.date}</p>
            </div>
          ))}
        </div>
      </div>

      {/* New/Edit Form Modal */}
      {show && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/50 backdrop-blur-sm" onClick={() => setShow(false)}>
          <div className="w-full max-h-[90vh] bg-white rounded-t-[24px] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white pt-3 pb-2 flex justify-center z-10"><div className="w-10 h-1 rounded-full bg-gray-300"/></div>
            <div className="p-5 space-y-4 pb-8">
              <h2 className="text-[20px] font-extrabold text-[#3C2415]">{editItem ? 'Edit Entry' : 'New Journal Entry'}</h2>
              <div><label className="text-[11px] font-bold text-[#8B7355] uppercase mb-1 block">Title</label><input value={f.title} onChange={e => setF({...f, title: e.target.value})} placeholder="Entry title" className="w-full rounded-xl border-2 border-[#E8D5C4] p-3 text-[15px] font-bold" /></div>
              <div><label className="text-[11px] font-bold text-[#8B7355] uppercase mb-1 block">Place</label><input value={f.place} onChange={e => setF({...f, place: e.target.value})} placeholder="Where was this?" className="w-full rounded-xl border-2 border-[#E8D5C4] p-3 text-[15px]" /></div>
              <div><label className="text-[11px] font-bold text-[#8B7355] uppercase mb-1 block">Content</label><textarea value={f.content} onChange={e => setF({...f, content: e.target.value})} placeholder="Write about your experience..." rows={5} className="w-full rounded-xl border-2 border-[#E8D5C4] p-3 text-[15px]" /></div>
              <div>
                <label className="text-[11px] font-bold text-[#8B7355] uppercase mb-1 block">Mood</label>
                <div className="flex gap-2 flex-wrap">{moods.map(m => <button key={m} onClick={() => setF({...f, mood: m})} className={`text-2xl p-2 rounded-xl ${f.mood === m ? 'bg-amber-100 ring-2 ring-amber-300' : 'bg-gray-50'}`}>{m}</button>)}</div>
              </div>
              <div>
                <label className="text-[11px] font-bold text-[#8B7355] uppercase mb-1 block">Date</label>
                <input type="date" value={f.date} onChange={e => setF({...f, date: e.target.value})} className="w-full rounded-xl border-2 border-[#E8D5C4] p-3 text-[15px]" />
              </div>
              <div>
                <label className="text-[11px] font-bold text-[#8B7355] uppercase mb-1 block">Photos</label>
                <div className="flex gap-1 mb-2 flex-wrap">{f.photos.map((p, i) => <img key={i} src={p} className="w-16 h-16 rounded-lg object-cover" alt="" />)}</div>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={uploadPhoto} />
                <button onClick={() => fileRef.current?.click()} disabled={uploading} className="px-4 py-2 rounded-xl bg-gray-100 text-[12px] font-bold flex items-center gap-1">
                  {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />} Add Photo
                </button>
              </div>
              {error && <p className="text-red-500 text-[12px] bg-red-50 rounded-lg p-2">{error}</p>}
              <button onClick={submit} disabled={publishing} className="w-full py-3.5 rounded-xl bg-[#C4956A] text-white font-extrabold flex items-center justify-center gap-2">
                {publishing ? <Loader2 className="h-4 w-4 animate-spin" /> : editItem ? <Check className="h-4 w-4" /> : null}
                {editItem ? 'Save Changes' : 'Publish Entry'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {detailItem && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/50 backdrop-blur-sm" onClick={() => setDetailItem(null)}>
          <div className="w-full max-h-[85vh] bg-white rounded-t-[24px] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white pt-3 pb-2 flex justify-center"><div className="w-10 h-1 rounded-full bg-gray-300"/></div>
            <div className="p-5 pb-8">
              <div className="flex items-center gap-2 mb-2"><span className="text-3xl">{detailItem.mood}</span><h2 className="text-[22px] font-extrabold text-[#3C2415]">{detailItem.title}</h2></div>
              {detailItem.place && <p className="text-[13px] text-[#8B7355] flex items-center gap-1 mb-3"><MapPin className="h-3.5 w-3.5" />{detailItem.place}</p>}
              {detailItem.photos?.length > 0 && <div className="flex gap-2 overflow-x-auto mb-4">{detailItem.photos.map((p: string, i: number) => <img key={i} src={p} className="h-40 rounded-xl object-cover" alt="" />)}</div>}
              <p className="text-[14px] text-[#6B7280] leading-relaxed whitespace-pre-wrap">{detailItem.content}</p>
              <p className="text-[11px] text-gray-400 mt-4">{detailItem.date}</p>
              <button onClick={() => setDetailItem(null)} className="w-full mt-4 py-3 rounded-xl bg-gray-100 text-gray-600 text-sm font-bold">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
