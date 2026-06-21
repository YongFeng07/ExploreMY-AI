// @ts-nocheck
'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Camera, Plus, Trash2, Upload, ArrowLeft, X, Image, Star, Loader2 } from 'lucide-react';
import { getAuthHeaders } from '@/stores/auth-store';

const API = 'http://localhost:3001';

function imgUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${API}${url.startsWith('/') ? '' : '/'}${url}`;
}

export default function AlbumsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [selAlbum, setSelAlbum] = useState<any>(null);
  const [show, setShow] = useState(false);
  const [f, setF] = useState({ title: '', place: '', coverPhoto: '' });
  const [uploading, setUploading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadMsg, setUploadMsg] = useState('');
  const [viewPhoto, setViewPhoto] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const photoFileRef = useRef<HTMLInputElement>(null);

  const uid = typeof window !== 'undefined' ? localStorage.getItem('userId') || '' : '';

  const load = () => {
    fetch(`${API}/api/v1/auth/me/albums?userId=${uid}`, { headers: getAuthHeaders() })
      .then(r => r.json()).then(d => { setItems(d.data || []); if (selAlbum) { const updated = (d.data || []).find((a: any) => a.id === selAlbum.id); if (updated) setSelAlbum(updated); } });
  };
  useEffect(() => { load(); }, []);

  /* ── Upload cover photo for new album ── */
  const uploadCover = async (e?: React.ChangeEvent<HTMLInputElement>) => {
    const file = e?.target?.files?.[0] || fileRef.current?.files?.[0]; if (!file) return;
    setUploading(true); setUploadMsg('');
    const fd = new FormData(); fd.append('file', file); fd.append('userId', uid);
    try {
      const r = await fetch(`${API}/api/v1/auth/me/photos/upload?userId=${uid}`, { method: 'POST', headers: getAuthHeaders(), body: fd });
      const d = await r.json();
      if (d.data?.url) { setF({ ...f, coverPhoto: d.data.url }); setUploadMsg('✅ Cover uploaded'); setTimeout(() => setUploadMsg(''), 2000); }
      else setUploadMsg('❌ ' + (d.error || d.message || 'Upload failed. Try logging in again.'));
    } catch { setUploadMsg('❌ Network error'); }
    setUploading(false);
  };

  /* ── Upload photo to existing album ── */
  const uploadPhotoToAlbum = async (e?: React.ChangeEvent<HTMLInputElement>) => {
    const file = e?.target?.files?.[0] || photoFileRef.current?.files?.[0];
    if (!file || !selAlbum) return;
    if ((selAlbum.photos?.length || 0) >= 10) { setUploadMsg('Maximum 10 photos per album'); return; }
    setUploadingPhoto(true); setUploadMsg('');
    const fd = new FormData(); fd.append('file', file); fd.append('userId', uid);
    try {
      const r = await fetch(`${API}/api/v1/auth/me/photos/upload?userId=${uid}`, { method: 'POST', headers: getAuthHeaders(), body: fd });
      const d = await r.json();
      if (d.data?.url) {
        await fetch(`${API}/api/v1/auth/me/albums/${selAlbum.id}/photos?userId=${uid}`, {
          method: 'POST', headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
          body: JSON.stringify({ photoUrl: d.data.url }),
        });
        setUploadMsg('✅ Photo added!');
        setTimeout(() => setUploadMsg(''), 2000);
        load();
        if (photoFileRef.current) photoFileRef.current.value = '';
      } else {
        setUploadMsg('❌ Upload failed: ' + (d.error || d.message || 'Unknown'));
      }
    } catch { setUploadMsg('❌ Network error. Try again.'); }
    setUploadingPhoto(false);
  };

  /* ── Create album ── */
  const add = async () => {
    if (!f.title) return;
    await fetch(`${API}/api/v1/auth/me/albums?userId=${uid}`, {
      method: 'POST', headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({...f, userId: uid}),
    });
    setF({ title: '', place: '', coverPhoto: '' }); setShow(false); load();
  };

  /* ── Delete album ── */
  const remove = async (id: string) => {
    await fetch(`${API}/api/v1/auth/me/albums/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
    if (selAlbum?.id === id) setSelAlbum(null);
    load();
  };

  /* ── Remove photo from album ── */
  const removePhoto = async (idx: number) => {
    if (!selAlbum) return;
    await fetch(`${API}/api/v1/auth/me/albums/${selAlbum.id}/photos/${idx}`, { method: 'DELETE', headers: getAuthHeaders() });
    load();
  };

  /* ── Set album cover ── */
  const setCover = async (url: string) => {
    if (!selAlbum) return;
    await fetch(`${API}/api/v1/auth/me/albums/${selAlbum.id}/cover`, {
      method: 'PATCH', headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ photoUrl: url }),
    });
    load();
  };

  /* ═══════════════════════════════════════════════════════════════════
      ALBUM DETAIL VIEW
      ═══════════════════════════════════════════════════════════════════ */
  if (selAlbum) {
    const photos: string[] = selAlbum.photos || [];
    const displayCover = imgUrl(selAlbum.coverPhoto) || (photos.length > 0 ? imgUrl(photos[0]) : null);

    return (
      <div className="min-h-screen bg-[#FFFDF7]">
        {/* Header */}
        <div className="relative h-56 overflow-hidden bg-gradient-to-br from-amber-500 to-orange-600">
          {displayCover && <img src={displayCover} className="absolute inset-0 w-full h-full object-cover opacity-40" alt="" />}
          <div className="relative z-10 px-5 pt-14 pb-6 text-white">
            <button onClick={() => setSelAlbum(null)} className="text-white/80 text-[13px] font-semibold mb-3 flex items-center gap-1"><ArrowLeft className="h-3.5 w-3.5" /> Back</button>
            <h1 className="text-[22px] font-extrabold">{selAlbum.title}</h1>
            <p className="text-white/70 text-[13px] mt-1">{selAlbum.place || 'No location'} · {selAlbum.date} · {photos.length}/10 photos</p>
          </div>
        </div>

        <div className="px-5 pt-4 pb-24 space-y-4">
          {/* Upload photo */}
          {photos.length < 10 && (
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#E8D5C4]/50">
              <p className="text-[12px] font-bold text-[#8B7355] uppercase mb-3">Add Photo ({photos.length}/10)</p>
              <label className="flex items-center justify-center gap-2 w-full py-4 rounded-xl bg-[#C4956A] text-white text-[14px] font-bold cursor-pointer hover:bg-[#B8860B] transition-colors">
                {uploadingPhoto ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {uploadingPhoto ? 'Uploading...' : 'Select Photo to Upload'}
                <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={uploadPhotoToAlbum} />
              </label>
              {uploadMsg && <p className={`text-[13px] font-semibold mt-2 ${uploadMsg.startsWith('✅') ? 'text-green-600' : 'text-red-500'}`}>{uploadMsg}</p>}
            </div>
          )}

          {/* Photo Grid */}
          {photos.length === 0 ? (
            <div className="text-center py-16">
              <span className="text-5xl block mb-4">📸</span>
              <p className="text-[#3C2415] font-extrabold text-lg">No photos yet</p>
              <p className="text-[#8B7355] text-sm mt-1">Upload up to 10 photos to this album</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {photos.map((p: string, i: number) => (
                <div key={i} className="relative group">
                  <img src={imgUrl(p)!} className="w-full aspect-square object-cover rounded-xl cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => setViewPhoto(imgUrl(p))} alt={`Photo ${i + 1}`}
                    onError={e => { (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" fill="%23F5EDE3"><text x="50%" y="50%" dy=".3em" text-anchor="middle" font-size="40">📷</text></svg>'; }} />
                  {/* Cover badge */}
                  {imgUrl(p) === imgUrl(selAlbum.coverPhoto) && (
                    <div className="absolute top-2 left-2 bg-amber-500 text-white text-[9px] font-bold rounded-full px-2 py-0.5 flex items-center gap-0.5"><Star className="h-2.5 w-2.5" fill="currentColor" /> Cover</div>
                  )}
                  {/* Actions */}
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {imgUrl(p) !== imgUrl(selAlbum.coverPhoto) && (
                      <button onClick={() => setCover(p)} className="p-1.5 bg-white/90 rounded-lg hover:bg-white" title="Set as cover"><Star className="h-3 w-3 text-amber-500" /></button>
                    )}
                    <button onClick={() => removePhoto(i)} className="p-1.5 bg-white/90 rounded-lg hover:bg-red-50" title="Remove"><Trash2 className="h-3 w-3 text-red-400" /></button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Delete Album */}
          <button onClick={() => { remove(selAlbum.id); setSelAlbum(null); }}
            className="w-full py-3.5 rounded-2xl bg-red-50 text-red-500 text-sm font-bold hover:bg-red-100 transition-colors">
            Delete Album
          </button>
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

  /* ═══════════════════════════════════════════════════════════════════
      ALBUM LIST
      ═══════════════════════════════════════════════════════════════════ */
  return (
    <div className="min-h-screen bg-[#FFFDF7]">
      <div className="px-5 pt-14 pb-4 flex justify-between items-center">
        <div>
          <Link href="/profile" className="text-[#C4956A] text-[13px] font-semibold mb-1 block">← Back</Link>
          <h1 className="text-[28px] font-extrabold text-[#3C2415]">🖼️ Photo Albums</h1>
          <p className="text-[13px] text-[#8B7355] mt-1">{items.length} albums</p>
        </div>
        <button onClick={() => setShow(!show)}
          className="w-11 h-11 rounded-full bg-[#C4956A] text-white flex items-center justify-center shadow-md hover:bg-[#B8860B] transition-colors text-xl">
          {show ? '✕' : <Plus className="h-5 w-5" />}
        </button>
      </div>

      {/* Create Form */}
      {show && (
        <div className="px-5 mb-4">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#E8D5C4] space-y-3">
            <input value={f.title} onChange={e => setF({ ...f, title: e.target.value })}
              placeholder="Album name (e.g. Penang 2026)" className="w-full rounded-xl border border-[#E8D5C4] px-3 py-2.5 text-[14px] font-bold text-[#3C2415] placeholder:text-[#A08970] outline-none focus:border-[#C4956A]" />
            <input value={f.place} onChange={e => setF({ ...f, place: e.target.value })}
              placeholder="Place (e.g. Penang)" className="w-full rounded-xl border border-[#E8D5C4] px-3 py-2.5 text-[13px] text-[#3C2415] placeholder:text-[#A08970] outline-none focus:border-[#C4956A]" />
            <label className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-[#FDF0E0] text-[#C4956A] text-[13px] font-bold cursor-pointer hover:bg-[#F5EDE3] transition-colors">
              {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
              {uploading ? 'Uploading...' : 'Select Cover Photo'}
              <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={uploadCover} />
            </label>
            {f.coverPhoto && <img src={imgUrl(f.coverPhoto)!} className="w-full h-32 object-cover rounded-xl" alt="" />}
            {uploadMsg && <p className={`text-[13px] font-semibold ${uploadMsg.startsWith('✅') ? 'text-green-600' : 'text-red-500'}`}>{uploadMsg}</p>}
            <button onClick={add} className="w-full py-2.5 rounded-xl bg-[#C4956A] text-white text-[13px] font-extrabold hover:bg-[#B8860B] transition-colors">Create Album</button>
          </div>
        </div>
      )}

      {/* Album Grid */}
      <div className="px-5 pb-24 grid grid-cols-2 gap-3">
        {items.length === 0 && !show && (
          <div className="col-span-2 text-center py-16">
            <span className="text-5xl block mb-4">🖼️</span>
            <p className="text-[#3C2415] font-extrabold text-lg">No albums yet</p>
            <p className="text-[#8B7355] text-sm mt-1">Create your first photo album</p>
          </div>
        )}
        {items.map((item: any) => (
          <div key={item.id} onClick={() => setSelAlbum(item)}
            className="bg-white rounded-2xl border border-[#E8D5C4]/70 shadow-sm overflow-hidden group cursor-pointer hover:shadow-md hover:border-amber-200 transition-all active:scale-[0.98]">
            <div className="relative h-36 bg-[#F5EDE3]">
              {item.coverPhoto ? (
                <img src={imgUrl(item.coverPhoto)!} className="w-full h-full object-cover" alt=""
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-3xl">🖼️</div>
              )}
              <div className="absolute bottom-2 right-2 bg-black/50 backdrop-blur text-white text-[9px] font-bold rounded-full px-2 py-0.5 flex items-center gap-0.5">
                <Camera className="h-3 w-3" />{item.count || 0}/10
              </div>
              <button onClick={e => { e.stopPropagation(); remove(item.id); }}
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1.5 bg-white/90 rounded-lg transition-all">
                <Trash2 className="h-3.5 w-3.5 text-red-400" />
              </button>
            </div>
            <div className="p-3">
              <p className="text-[12px] font-extrabold text-[#3C2415] truncate">{item.title}</p>
              <p className="text-[10px] text-[#8B7355]">{item.place || 'No location'} · {item.date}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
