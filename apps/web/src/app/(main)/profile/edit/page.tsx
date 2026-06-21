'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Camera, Check, Loader2, AlertCircle, User, MapPin, FileText, Shield, AtSign } from 'lucide-react';
import { useAuth } from '@/stores/auth-store';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/** Convert relative upload paths to absolute URLs */
function imgUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${API}${url.startsWith('/') ? '' : '/'}${url}`;
}

export default function EditProfilePage() {
  const router = useRouter();
  const { user, refreshSession } = useAuth();
  const avatarRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [city, setCity] = useState('');
  const [email, setEmail] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState<'avatar' | 'cover' | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const uid = localStorage.getItem('userId') || '';
    fetch(`${API}/api/v1/auth/me?userId=${uid}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then(r => r.json()).then(d => {
        const u = d.data || d;
        setName(u.displayName || ''); setBio(u.bio || ''); setCity(u.location || '');
        setEmail(u.email || ''); setAvatarUrl(u.avatarUrl || null); setCoverUrl(u.coverUrl || null);
        setLoading(false);
      }).catch(() => setLoading(false));
  }, []);

  const uploadMedia = useCallback(async (file: File, type: 'avatar' | 'cover') => {
    const token = localStorage.getItem('accessToken');
    const uid = localStorage.getItem('userId') || '';
    if (!file) return;
    setUploading(type); setError('');
    const fd = new FormData(); fd.append('file', file); fd.append('userId', uid);
    const headers: any = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    try {
      const res = await fetch(`${API}/api/v1/auth/me/${type}?userId=${uid}`, { method: 'POST', headers, body: fd });
      if (!res.ok) throw new Error('Upload failed');
      await refreshSession();
      const meRes = await fetch(`${API}/api/v1/auth/me?userId=${uid}`, { headers });
      const meData = await meRes.json();
      const u = meData.data || meData;
      if (type === 'avatar') { setAvatarUrl(u.avatarUrl); setAvatarPreview(null); }
      else { setCoverUrl(u.coverUrl); setCoverPreview(null); }
      setError('');
    } catch { setError(`Failed to upload ${type}. Try again.`); }
    setUploading(null);
  }, [refreshSession]);

  const handleAvatarPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setAvatarPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
    uploadMedia(file, 'avatar');
    e.target.value = '';
  };

  const handleCoverPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setCoverPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
    uploadMedia(file, 'cover');
    e.target.value = '';
  };

  const handleSave = async () => {
    if (!name.trim()) { setError('Display name is required'); return; }
    const token = localStorage.getItem('accessToken');
    const uid = localStorage.getItem('userId') || '';
    setSaving(true); setError('');
    try {
      const headers: any = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`${API}/api/v1/auth/me?userId=${uid}`, {
        method: 'PATCH', headers,
        body: JSON.stringify({ userId: uid, displayName: name.trim(), bio: bio.trim(), location: city.trim() }),
      });
      if (res.ok) { await refreshSession(); setSaved(true); setTimeout(() => router.push('/profile'), 1200); }
      else { const d = await res.json(); setError(d.message || 'Could not save changes'); }
    } catch { setError('Network error. Try again.'); }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F9F5] p-5 space-y-4">
        <div className="h-10 w-40 bg-[#EDF3EA] rounded-xl animate-pulse" />
        <div className="h-44 bg-[#EDF3EA] rounded-[28px] animate-pulse" />
        <div className="h-24 w-24 bg-[#EDF3EA] rounded-full mx-auto animate-pulse" />
        <div className="h-14 bg-[#EDF3EA] rounded-xl animate-pulse" />
        <div className="h-32 bg-[#EDF3EA] rounded-xl animate-pulse" />
      </div>
    );
  }

  const displayAvatar = avatarPreview || imgUrl(avatarUrl);
  const displayCover = coverPreview || imgUrl(coverUrl);
  const avatarChar = name?.[0]?.toUpperCase() || user?.displayName?.[0]?.toUpperCase() || 'E';

  return (
    <div className="min-h-screen bg-[#F7F9F5]">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-[#F7F9F5]/90 backdrop-blur-xl border-b border-[#E8EDE4]">
        <div className="flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-2">
            <Link href="/profile" className="w-10 h-10 rounded-full bg-white border border-[#E8EDE4] flex items-center justify-center hover:bg-[#F7F9F5] transition-colors">
              <ArrowLeft className="h-5 w-5 text-[#171717]" />
            </Link>
            <h1 className="text-[17px] font-semibold text-[#171717]">Edit Profile</h1>
          </div>
          <button onClick={handleSave} disabled={saving || saved}
            className={`h-10 px-5 rounded-[14px] text-[14px] font-semibold flex items-center gap-2 transition-all ${
              saved ? 'bg-[#3BA55C] text-white' : 'bg-[#171717] text-white hover:bg-[#315B43]'
            } disabled:opacity-50`}>
            {saved ? <><Check className="h-4 w-4" /> Saved</> : saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving</> : 'Save'}
          </button>
        </div>
      </div>

      <div className="max-w-lg mx-auto">
        {/* Cover Photo */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="px-5 pt-5">
          <label className="text-[12px] font-bold text-[#9E9E9E] uppercase tracking-wider mb-2 block">Cover Photo</label>
          <div className="relative h-44 rounded-[28px] overflow-hidden cursor-pointer group bg-[#EDF3EA]" onClick={() => coverRef.current?.click()}>
            {displayCover ? (
              <img src={displayCover} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-[#234530] via-[#315B43] to-[#5E876A]" />
            )}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 flex items-center justify-center transition-all">
              {uploading === 'cover' ? (
                <Loader2 className="h-8 w-8 text-white animate-spin" />
              ) : (
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 bg-black/50 backdrop-blur-sm rounded-[16px] px-5 py-2.5">
                  <Camera className="h-5 w-5 text-white" />
                  <span className="text-white text-[14px] font-semibold">{displayCover ? 'Change Cover' : 'Add Cover Photo'}</span>
                </div>
              )}
            </div>
          </div>
          <p className="text-[12px] text-[#9E9E9E] mt-1.5">Recommended 1200×480px · JPEG, PNG, WebP · Max 10 MB</p>
          <input ref={coverRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleCoverPick} />
        </motion.div>

        {/* Avatar */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="px-5 pt-6 flex flex-col items-center">
          <div className="relative w-[100px] h-[100px] rounded-full cursor-pointer group" onClick={() => avatarRef.current?.click()}>
            <div className="w-full h-full rounded-full bg-[#315B43] flex items-center justify-center text-white text-[40px] font-bold ring-[4px] ring-white shadow-lg overflow-hidden">
              {displayAvatar ? <img src={displayAvatar} alt="" className="w-full h-full object-cover" /> : avatarChar}
            </div>
            <div className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/20 flex items-center justify-center transition-all">
              {uploading === 'avatar' ? (
                <Loader2 className="h-7 w-7 text-white animate-spin" />
              ) : (
                <Camera className="h-7 w-7 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              )}
            </div>
          </div>
          <p className="text-[13px] font-medium text-[#6F6F6F] mt-2">Tap to change profile photo</p>
          <p className="text-[12px] text-[#9E9E9E]">JPEG or PNG · Max 5 MB</p>
          <input ref={avatarRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleAvatarPick} />
        </motion.div>

        {/* Form Fields */}
        <div className="px-5 pt-6 space-y-5">
          {/* Display Name */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <label htmlFor="name" className="flex items-center gap-2 text-[12px] font-bold text-[#9E9E9E] uppercase tracking-wider mb-2">
              <User className="h-3.5 w-3.5" /> Display Name
            </label>
            <input id="name" type="text" value={name} onChange={e => setName(e.target.value)}
              placeholder="Your display name" maxLength={50} autoComplete="name"
              className="w-full h-14 px-4 bg-white text-[#171717] font-semibold text-[16px] placeholder:text-[#B0B0B0] border border-[#E8EDE4] rounded-[16px] outline-none focus:border-[#315B43] focus:ring-4 focus:ring-[#E8F2EB] transition-all" />
            <p className="text-[12px] text-[#9E9E9E] mt-1.5 text-right">{name.length}/50</p>
          </motion.div>

          {/* Email (read-only) */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.13 }}>
            <label htmlFor="email" className="flex items-center gap-2 text-[12px] font-bold text-[#9E9E9E] uppercase tracking-wider mb-2">
              <AtSign className="h-3.5 w-3.5" /> Email
            </label>
            <input id="email" type="email" value={email} disabled
              className="w-full h-14 px-4 bg-[#F7F9F5] text-[#9E9E9E] font-semibold text-[16px] border border-[#E8EDE4] rounded-[16px] outline-none cursor-not-allowed" />
            <p className="text-[12px] text-[#9E9E9E] mt-1.5 flex items-center gap-1"><Shield className="h-3 w-3" /> Email cannot be changed</p>
          </motion.div>

          {/* Bio */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}>
            <label htmlFor="bio" className="flex items-center gap-2 text-[12px] font-bold text-[#9E9E9E] uppercase tracking-wider mb-2">
              <FileText className="h-3.5 w-3.5" /> Bio
            </label>
            <textarea id="bio" value={bio} onChange={e => setBio(e.target.value)}
              placeholder="Tell travelers about yourself. What do you love about exploring Malaysia? Share your favorite destinations, food spots, or travel style..."
              maxLength={200} rows={4}
              className="w-full min-h-[120px] p-4 bg-white text-[#171717] font-medium text-[16px] placeholder:text-[#B0B0B0] border border-[#E8EDE4] rounded-[16px] outline-none focus:border-[#315B43] focus:ring-4 focus:ring-[#E8F2EB] resize-none transition-all leading-relaxed" />
            <p className="text-[12px] text-[#9E9E9E] mt-1.5 text-right">{bio.length}/200</p>
          </motion.div>

          {/* Home City */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.19 }}>
            <label htmlFor="city" className="flex items-center gap-2 text-[12px] font-bold text-[#9E9E9E] uppercase tracking-wider mb-2">
              <MapPin className="h-3.5 w-3.5" /> Home City
            </label>
            <input id="city" type="text" value={city} onChange={e => setCity(e.target.value)}
              placeholder="Kuala Lumpur, Malaysia" maxLength={100} autoComplete="address-level2"
              className="w-full h-14 px-4 bg-white text-[#171717] font-semibold text-[16px] placeholder:text-[#B0B0B0] border border-[#E8EDE4] rounded-[16px] outline-none focus:border-[#315B43] focus:ring-4 focus:ring-[#E8F2EB] transition-all" />
            <p className="text-[12px] text-[#9E9E9E] mt-1.5 text-right">{city.length}/100</p>
          </motion.div>

          {/* Error */}
          {error && (
            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-2.5 p-4 rounded-2xl bg-[#FEF5F5] text-[#E85D5D] text-[14px] font-medium">
              <AlertCircle className="h-4 w-4 flex-shrink-0" /> {error}
            </motion.div>
          )}

          {/* Save Button */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }} className="pt-2 pb-8">
            <button onClick={handleSave} disabled={saving || saved || !name.trim()}
              className={`w-full h-[52px] rounded-[18px] font-bold text-[16px] flex items-center justify-center gap-2 transition-all ${
                saved ? 'bg-[#3BA55C] text-white' : 'bg-[#315B43] text-white hover:bg-[#234530]'
              } disabled:opacity-50`}>
              {saved ? <><Check className="h-5 w-5" /> Profile Updated — Redirecting...</> : saving ? <><Loader2 className="h-5 w-5 animate-spin" /> Saving Changes...</> : 'Save Changes'}
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
