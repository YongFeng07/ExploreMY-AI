// @ts-nocheck
'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Camera, Check, Loader2, AlertCircle, User, MapPin, FileText, AtSign } from 'lucide-react';
import { useUser } from '@clerk/nextjs';

export default function EditProfilePage() {
  const router = useRouter();
  const { user: clerkUser } = useUser();
  const avatarRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(clerkUser?.fullName || clerkUser?.username || '');
  const [bio, setBio] = useState('');
  const [city, setCity] = useState('');
  const email = clerkUser?.primaryEmailAddress?.emailAddress || '';
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setCoverPreview(localStorage.getItem('profile_cover'));
  }, []);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(clerkUser?.imageUrl || null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState<'avatar' | 'cover' | null>(null);

  const handleAvatarPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    // Preview
    const r = new FileReader();
    r.onload = ev => setAvatarPreview(ev.target?.result as string);
    r.readAsDataURL(file);
    // Upload via Clerk
    setUploading('avatar'); setError('');
    try { await clerkUser?.setProfileImage({ file }); }
    catch { setError('Avatar upload failed'); }
    setUploading(null);
    e.target.value = '';
  };

  const handleCoverPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setUploading('cover'); setError('');
    const r = new FileReader();
    r.onload = ev => {
      const url = ev.target?.result as string;
      localStorage.setItem('profile_cover', url);
      setCoverPreview(url);
    };
    r.readAsDataURL(file);
    setUploading(null);
    e.target.value = '';
  };

  const handleSave = async () => {
    if (!name.trim()) { setError('Display name is required'); return; }
    setSaving(true); setError('');
    try {
      // Update Clerk profile
      if (clerkUser) {
        await clerkUser.update({ firstName: name.trim().split(' ')[0], lastName: name.trim().split(' ').slice(1).join(' ') || '' });
      }
      // Save bio + city to localStorage
      localStorage.setItem('profile_bio', bio);
      localStorage.setItem('profile_city', city);
      setSaved(true);
      setTimeout(() => router.push('/profile'), 800);
    } catch (e: any) {
      setError(e.message || 'Network error. Try again');
    }
    setSaving(false);
  };

  return (
    <div className="min-h-screen bg-[#F7F9F5]">
      {/* Header */}
      <div className="px-5 pt-14 pb-4 flex items-center gap-4">
        <Link href="/profile" className="text-[#315B43]"><ArrowLeft className="h-5 w-5" /></Link>
        <h1 className="text-[20px] font-extrabold text-[#171717]">Edit Profile</h1>
        <button onClick={handleSave} disabled={saving || !name.trim()}
          className="ml-auto px-5 py-2 rounded-full bg-[#315B43] text-white text-[13px] font-bold disabled:opacity-50 flex items-center gap-1.5">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <Check className="h-4 w-4" /> : null}
          {saved ? 'Saved!' : 'Save'}
        </button>
      </div>

      {error && (
        <div className="mx-5 mb-3 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-[13px] text-red-600">
          <AlertCircle className="h-4 w-4" />{error}
        </div>
      )}

      {/* COVER PHOTO */}
      <div className="relative h-48 mx-5 rounded-2xl overflow-hidden bg-gradient-to-br from-[#234530] via-[#315B43] to-[#5E876A] group">
        {coverPreview ? (
          <img src={coverPreview} className="w-full h-full object-cover" alt="" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/30 text-6xl">🏞️</div>
        )}
        <button onClick={() => coverRef.current?.click()}
          className="absolute bottom-3 right-3 w-10 h-10 rounded-full bg-black/40 backdrop-blur flex items-center justify-center text-white hover:bg-black/60 transition-all">
          {uploading === 'cover' ? <Loader2 className="h-5 w-5 animate-spin" /> : <Camera className="h-5 w-5" />}
        </button>
        <input ref={coverRef} type="file" accept="image/*" className="hidden" onChange={handleCoverPick} />
      </div>

      {/* AVATAR */}
      <div className="px-5 -mt-10 mb-6 flex justify-center">
        <div className="relative">
          {avatarPreview ? (
            <img src={avatarPreview} className="w-20 h-20 rounded-full ring-4 ring-[#F7F9F5] object-cover shadow-lg" alt="" />
          ) : (
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#315B43] to-[#5E876A] ring-4 ring-[#F7F9F5] flex items-center justify-center text-2xl font-extrabold text-white shadow-lg">
              {name?.[0]?.toUpperCase() || 'E'}
            </div>
          )}
          <button onClick={() => avatarRef.current?.click()}
            className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-[#315B43] flex items-center justify-center text-white shadow-md hover:bg-[#234530] transition-all">
            {uploading === 'avatar' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
          </button>
          <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarPick} />
        </div>
      </div>

      {/* FORM FIELDS */}
      <div className="px-5 space-y-3 pb-24">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <label className="text-[11px] font-bold text-[#315B43] uppercase tracking-wider mb-1.5 flex items-center gap-1"><User className="h-3 w-3" /> Display Name</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Your name"
            className="w-full text-[16px] font-bold text-[#171717] outline-none bg-transparent placeholder:text-gray-300" />
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <label className="text-[11px] font-bold text-[#315B43] uppercase tracking-wider mb-1.5 flex items-center gap-1"><AtSign className="h-3 w-3" /> Email</label>
          <p className="text-[16px] font-bold text-gray-400">{email || 'Loading...'}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <label className="text-[11px] font-bold text-[#315B43] uppercase tracking-wider mb-1.5 flex items-center gap-1"><MapPin className="h-3 w-3" /> City</label>
          <input value={city} onChange={e => { setCity(e.target.value); localStorage.setItem('profile_city', e.target.value); }} placeholder="Kuala Lumpur"
            className="w-full text-[16px] font-bold text-[#171717] outline-none bg-transparent placeholder:text-gray-300" />
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <label className="text-[11px] font-bold text-[#315B43] uppercase tracking-wider mb-1.5 flex items-center gap-1"><FileText className="h-3 w-3" /> Bio</label>
          <textarea value={bio} onChange={e => { setBio(e.target.value); localStorage.setItem('profile_bio', e.target.value); }} placeholder="Tell us about yourself..."
            className="w-full text-[15px] font-semibold text-[#171717] outline-none bg-transparent placeholder:text-gray-300 resize-none" rows={3} />
        </div>
      </div>
    </div>
  );
}
