// @ts-nocheck
'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Camera, Upload, ArrowLeft, ChevronLeft, ChevronRight, Trash2, MapPin, Calendar, Loader2, X } from 'lucide-react';
import { getAuthHeaders } from '@/stores/auth-store';

const API = 'http://localhost:3001';

function imgUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${API}${url.startsWith('/') ? '' : '/'}${url}`;
}

export default function PhotosPage() {
  const [photos, setPhotos] = useState<any[]>([]);
  const [caption, setCaption] = useState('');
  const [place, setPlace] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const [viewIdx, setViewIdx] = useState<number>(-1);

  const load = () => {
    const uid = localStorage.getItem('userId') || '';
    fetch(`${API}/api/v1/auth/me/photos?userId=${uid}`, { headers: getAuthHeaders() })
      .then(r => r.json()).then(d => setPhotos(d.data || [])).catch(() => {});
  };
  useEffect(() => { load(); }, []);

  const upload = async (e?: React.ChangeEvent<HTMLInputElement>) => {
    const file = e?.target?.files?.[0] || fileRef.current?.files?.[0]; if (!file) return;
    const uid = localStorage.getItem('userId') || '';
    setUploading(true); setUploadMsg('');
    const fd = new FormData(); fd.append('file', file);
    fd.append('caption', caption); fd.append('place', place); fd.append('userId', uid);
    try {
      const r = await fetch(`${API}/api/v1/auth/me/photos/upload?userId=${uid}`, {
        method: 'POST', headers: getAuthHeaders(), body: fd,
      });
      const d = await r.json();
      if (d.data) {
        setUploadMsg('✅ Photo uploaded!');
        setTimeout(() => setUploadMsg(''), 2000);
        setCaption(''); setPlace('');
        if (fileRef.current) fileRef.current.value = '';
        load();
      } else {
        setUploadMsg('❌ ' + (d.error || d.message || 'Upload failed. Try logging in again.'));
      }
    } catch { setUploadMsg('❌ Network error - check your connection'); }
    setUploading(false);
  };

  const deletePhoto = async (id: string) => {
    await fetch(`${API}/api/v1/auth/me/photos/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
    setViewIdx(-1); load();
  };

  /* ── Full-screen Photo Viewer ── */
  if (viewIdx >= 0 && photos[viewIdx]) {
    const p = photos[viewIdx];
    const displayUrl = imgUrl(p.url);
    return (
      <div className="fixed inset-0 z-[9999] bg-black flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 safe-top">
          <button onClick={() => setViewIdx(-1)} className="text-white p-2"><X className="h-6 w-6" /></button>
          <span className="text-white text-[13px] font-bold">{viewIdx + 1} / {photos.length}</span>
          <div className="flex gap-1">
            <button onClick={() => setViewIdx(viewIdx - 1)} disabled={viewIdx === 0} className="text-white p-2 disabled:opacity-30"><ChevronLeft className="h-6 w-6" /></button>
            <button onClick={() => setViewIdx(viewIdx + 1)} disabled={viewIdx >= photos.length - 1} className="text-white p-2 disabled:opacity-30"><ChevronRight className="h-6 w-6" /></button>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center px-2">
          {displayUrl && <img src={displayUrl} className="max-w-full max-h-[70vh] object-contain rounded-lg" alt="" />}
        </div>
        <div className="bg-white/10 backdrop-blur-md mx-4 mb-8 rounded-2xl p-4 text-white">
          <p className="text-[14px] font-bold">{p.caption || 'No caption'}</p>
          <div className="flex items-center gap-3 mt-1 text-white/60 text-[12px]">
            {p.place && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{p.place}</span>}
            <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{p.date}</span>
          </div>
          <button onClick={() => deletePhoto(p.id)}
            className="mt-3 text-[12px] font-bold text-red-400 flex items-center gap-1"><Trash2 className="h-3.5 w-3.5" />Delete Photo</button>
        </div>
      </div>
    );
  }

  /* ── Main Gallery ── */
  return (
    <div className="min-h-screen bg-[#FFFDF7]">
      <div className="px-5 pt-14 pb-4">
        <Link href="/profile" className="text-[#C4956A] text-[13px] font-semibold mb-2 block">← Back</Link>
        <h1 className="text-[28px] font-extrabold text-[#3C2415]">📸 My Photos</h1>
        <p className="text-[13px] text-[#8B7355] mt-1">{photos.length} photos</p>
      </div>

      {/* Upload form */}
      <div className="px-5 pb-4">
        <div className="bg-white rounded-2xl p-3 shadow-sm border border-[#E8D5C4] space-y-2">
          <div className="flex gap-2">
            <input value={caption} onChange={e => setCaption(e.target.value)} placeholder="Caption (e.g. Sunset at Batu Ferringhi)"
              className="flex-1 rounded-xl border border-[#E8D5C4] px-3 py-2.5 text-[14px] font-bold text-[#3C2415] placeholder:text-[#A08970] outline-none focus:border-[#C4956A]" />
            <input value={place} onChange={e => setPlace(e.target.value)} placeholder="Place"
              className="w-28 rounded-xl border border-[#E8D5C4] px-3 py-2.5 text-[14px] text-[#3C2415] placeholder:text-[#A08970] outline-none focus:border-[#C4956A]" />
          </div>
          <label className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-[#C4956A] text-white text-[14px] font-bold cursor-pointer hover:bg-[#B8860B] transition-colors">
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {uploading ? 'Uploading...' : 'Select Photo to Upload'}
            <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={upload} />
          </label>
          {uploadMsg && <p className={`text-[13px] font-semibold ${uploadMsg.startsWith('✅') ? 'text-green-600' : 'text-red-500'}`}>{uploadMsg}</p>}
        </div>
      </div>

      {/* Photo Grid */}
      <div className="px-5 pb-24">
        {photos.length === 0 ? (
          <div className="text-center py-16">
            <Camera className="h-12 w-12 mx-auto text-[#D4C4B0] mb-3" />
            <p className="text-[#8B7355] text-[15px] font-medium">Upload your first travel photo</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-1.5">
            {photos.map((p: any, i: number) => (
              <div key={p.id} className="relative group cursor-pointer aspect-square overflow-hidden rounded-xl bg-[#F5EDE3]">
                <img src={imgUrl(p.url)!} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" alt=""
                  onClick={() => setViewIdx(i)}
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                {p.place && (
                  <div className="absolute bottom-2 left-2 bg-black/50 backdrop-blur text-white text-[10px] font-semibold rounded-full px-2 py-0.5 flex items-center gap-0.5">
                    <MapPin className="h-2.5 w-2.5" />{p.place}
                  </div>
                )}
                {/* Delete button */}
                <button onClick={(e) => { e.stopPropagation(); deletePhoto(p.id); }}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/40 backdrop-blur text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 rounded-xl transition-colors pointer-events-none" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
