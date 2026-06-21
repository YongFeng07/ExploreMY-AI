'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAuth } from '@/stores/auth-store';
import {
  Camera, Settings, MapPin, Compass, Heart, BookOpen,
  Wallet, Sparkles, LogIn, UserPlus, ChevronRight,
  Globe, Award, Edit3, Share2, Star, TrendingUp,
  Clock, BadgeCheck, Image, ScrollText,
} from 'lucide-react';
import { DarkModeToggle } from '@/components/shared/dark-mode-toggle';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/** Convert relative upload paths to absolute URLs */
function imgUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${API}${url.startsWith('/') ? '' : '/'}${url}`;
}

export default function ProfilePage() {
  const { user, isAuthenticated, logout } = useAuth();
  const [data, setData] = useState<any>(null);
  const [walletData, setWalletData] = useState<any>(null);
  const [achievements, setAchievements] = useState<any>(null);
  const [followers, setFollowers] = useState<any[]>([]);
  const [following, setFollowing] = useState<any[]>([]);
  const [showFollowSheet, setShowFollowSheet] = useState<{ title: string; list: any[] } | null>(null);
  const [viewImage, setViewImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const loadProfile = useCallback(async () => {
    const token = localStorage.getItem('accessToken');
    const uid = user?.id || localStorage.getItem('userId') || '';
    const headers: any = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    try {
      const [profileRes, walletRes, achieveRes, followersRes, followingRes] = await Promise.all([
        fetch(`${API}/api/v1/auth/me?userId=${uid}`, { headers }).then(r => r.json()),
        fetch(`${API}/api/v1/travel-wallet/goals/user/${uid}`, { headers }).then(r => r.json()).catch(() => ({ data: [] })),
        fetch(`${API}/api/v1/achievements?userId=${uid}`, { headers }).then(r => r.json()).catch(() => ({ data: null })),
        fetch(`${API}/api/v1/auth/user/${uid}/followers`, { headers }).then(r => r.json()).catch(() => ({ data: [] })),
        fetch(`${API}/api/v1/auth/user/${uid}/following`, { headers }).then(r => r.json()).catch(() => ({ data: [] })),
      ]);
      setData(profileRes.data || profileRes);
      setWalletData(walletRes.data || []);
      setAchievements(achieveRes.data);
      setFollowers(followersRes.data || []);
      setFollowing(followingRes.data || []);
    } catch { /* ok */ }
    setLoading(false);
  }, [isAuthenticated, user?.id]);

  // Reload profile data whenever the component mounts (e.g., returning from edit page)
  useEffect(() => { loadProfile(); }, [loadProfile]);
  // Also reload when the page becomes visible (e.g., navigating back from another tab)
  useEffect(() => {
    const onFocus = () => loadProfile();
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') loadProfile(); });
    return () => { window.removeEventListener('focus', onFocus); };
  }, [loadProfile]);

  const uploadFile = async (file: File, type: 'avatar' | 'cover') => {
    const token = localStorage.getItem('accessToken');
    const uid = localStorage.getItem('userId') || user?.id || '';
    if (!file) return;
    const fd = new FormData(); fd.append('file', file); fd.append('userId', uid || user?.id || '');
    const headers: any = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const r = await fetch(`${API}/api/v1/auth/me/${type}?userId=${uid}`, { method: 'POST', headers, body: fd });
    if (!r.ok) alert(`Failed to upload ${type}. Please try again.`);
    else loadProfile();
  };

  /* ── Unauthenticated ── */
  if (mounted && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#F7F9F5] flex items-center justify-center px-8">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-sm w-full">
          <div className="w-24 h-24 rounded-[28px] bg-gradient-to-br from-[#315B43] to-[#5E876A] flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Sparkles className="h-12 w-12 text-white" />
          </div>
          <h1 className="text-[32px] font-extrabold text-[#171717] tracking-tight">Your Travel Passport</h1>
          <p className="text-[15px] text-[#6F6F6F] mt-3 mb-10 leading-relaxed">Track every journey. Collect stamps. Build your identity as a Malaysia explorer.</p>
          <Link href="/login" className="flex items-center justify-center gap-2 w-full h-[52px] rounded-[20px] bg-[#315B43] text-white font-bold text-[16px] hover:bg-[#234530] transition-colors mb-3">
            <LogIn className="h-5 w-5" /> Sign In
          </Link>
          <Link href="/register" className="flex items-center justify-center gap-2 w-full h-[52px] rounded-[20px] bg-white text-[#171717] font-semibold text-[16px] border border-[#E8EDE4] hover:border-[#315B43] hover:text-[#315B43] hover:bg-[#E8F2EB] transition-colors">
            <UserPlus className="h-5 w-5" /> Create Free Account
          </Link>
        </motion.div>
      </div>
    );
  }

  /* ── Loading ── */
  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-[#F7F9F5]">
        <div className="h-52 bg-[#EDF3EA] animate-pulse" />
        <div className="px-5 -mt-12 space-y-4">
          <div className="w-24 h-24 rounded-full bg-[#EDF3EA] ring-4 ring-[#F7F9F5] animate-pulse mx-auto" />
          <div className="h-7 w-40 bg-[#EDF3EA] rounded-lg animate-pulse mx-auto" />
          <div className="h-4 w-60 bg-[#EDF3EA] rounded-lg animate-pulse mx-auto" />
          <div className="grid grid-cols-4 gap-3 mt-4">
            {[1,2,3,4].map(i => <div key={i} className="h-20 rounded-2xl bg-[#EDF3EA] animate-pulse" />)}
          </div>
        </div>
      </div>
    );
  }

  /* ── Data ── */
  const displayName = data?.displayName || user?.displayName || 'Explorer';
  const avatarChar = displayName?.[0]?.toUpperCase() || 'E';
  const bio = data?.bio || '';
  const location = data?.location || '';
  const level = data?.level || 1;
  const xp = data?.xp || 0;
  const memberSince = data?.memberSince;
  const stats = data?.stats || {};
  const visitedCities: string[] = data?.visitedCities || [];
  const dna: any[] = data?.dna || [];
  const badges: any[] = data?.badges || [];
  const isVerified = data?.isVerified || false;
  const totalSaved = walletData?.reduce((s: number, g: any) => s + (g.currentAmount || 0), 0) || 0;
  const activeGoals = walletData?.filter((g: any) => (g.currentAmount || 0) < g.targetAmount).length || 0;
  const completedGoals = walletData?.filter((g: any) => (g.currentAmount || 0) >= g.targetAmount).length || 0;
  const unlockedAchievements = achievements?.unlocked || 0;
  const totalAchievements = achievements?.total || 0;
  const xpPct = xp % 100;

  return (
    <div className="min-h-screen bg-[#F7F9F5]">
      {/* ═══════════════════════════════════════════════════════════════
          COVER PHOTO — Airbnb style
          ═══════════════════════════════════════════════════════════════ */}
      <div className="relative h-64 overflow-hidden bg-gradient-to-br from-[#234530] via-[#315B43] to-[#5E876A] cursor-pointer group" onClick={() => { if (imgUrl(data?.coverUrl)) setViewImage(imgUrl(data?.coverUrl)); }}>
        {imgUrl(data?.coverUrl) ? (
          <img src={imgUrl(data?.coverUrl)!} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="" />
        ) : null}
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
        {imgUrl(data?.coverUrl) && <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center"><span className="text-white text-[13px] font-bold opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 rounded-full px-4 py-2">🔍 View Cover</span></div>}

        {/* Top actions — frosted glass */}
        <div className="absolute top-4 right-4 flex gap-2">
          <button className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/30 transition-all">
            <Share2 className="h-[18px] w-[18px]" />
          </button>
          <Link href="/profile/edit" className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/30 transition-all">
            <Edit3 className="h-[18px] w-[18px]" />
          </Link>
          <Link href="/profile/settings" className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/30 transition-all">
            <Settings className="h-[18px] w-[18px]" />
          </Link>
          <DarkModeToggle />
        </div>

        {/* Change cover button */}
        <label className="absolute bottom-4 right-4 w-9 h-9 rounded-full bg-white/25 backdrop-blur-md flex items-center justify-center text-white cursor-pointer hover:bg-white/35 transition-all">
          <Camera className="h-4 w-4" />
          <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) uploadFile(f, 'cover'); }} />
        </label>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          PROFILE HEADER — Instagram + Airbnb
          ═══════════════════════════════════════════════════════════════ */}
      <div className="px-5 -mt-14 relative z-10">
        <div className="flex items-end gap-4">
          {/* Avatar — Instagram style, large, with level ring */}
          <div className="relative flex-shrink-0">
            <label className="relative cursor-pointer group block">
              <div className="w-[96px] h-[96px] rounded-full bg-[#315B43] flex items-center justify-center text-white text-[36px] font-bold ring-[4px] ring-[#F7F9F5] shadow-lg overflow-hidden">
                {imgUrl(data?.avatarUrl) ? (
                  <img src={imgUrl(data?.avatarUrl)!} className="w-full h-full object-cover cursor-pointer" alt="" onClick={(e) => { e.stopPropagation(); setViewImage(imgUrl(data?.avatarUrl)); }} />
                ) : avatarChar}
              </div>
              <div className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/15 flex items-center justify-center transition-all">
                <Camera className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) uploadFile(f, 'avatar'); }} />
            </label>
            {/* Level badge — Google Maps Local Guide style */}
            <div className="absolute -bottom-1.5 -right-1.5 w-[30px] h-[30px] rounded-full bg-[#D4A95F] text-white text-[11px] font-extrabold flex items-center justify-center ring-[3px] ring-[#F7F9F5] shadow-md">
              {level}
            </div>
          </div>

          {/* Identity */}
          <div className="flex-1 pb-2 min-w-0">
            <div className="flex items-center gap-1.5">
              <h1 className="text-[22px] font-extrabold text-[#171717] tracking-tight truncate">{displayName}</h1>
              {isVerified && <BadgeCheck className="h-5 w-5 text-[#3B7DD8] flex-shrink-0" fill="#DBEAFE" />}
            </div>
            {bio && <p className="text-[14px] text-[#6F6F6F] mt-0.5 leading-snug line-clamp-2">{bio}</p>}
            <div className="flex items-center gap-3 mt-1.5 text-[13px] text-[#9E9E9E]">
              {location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{location}</span>}
              {memberSince && <span className="flex items-center gap-1"><Clock className="h-3 w-3" />Joined {new Date(memberSince).getFullYear()}</span>}
            </div>
            {/* Badge showcase */}
            {badges.filter((b: any) => b.unlocked).length > 0 && (
              <div className="flex gap-1 mt-2">
                {badges.filter((b: any) => b.unlocked).slice(0, 5).map((b: any, i: number) => (
                  <span key={i} className="text-lg" title={b.n}>{b.e}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          STATS ROW — Instagram style
          ═══════════════════════════════════════════════════════════════ */}
      <div className="px-5 mt-5">
        <div className="grid grid-cols-4 gap-2">
          {[
            { icon: '🌍', label: 'Cities', value: stats.cities || 0 },
            { icon: '✈️', label: 'Trips', value: stats.trips || 0 },
            { icon: '👥', label: 'Followers', value: followers.length, clickable: true },
            { icon: '👤', label: 'Following', value: following.length, clickable: true },
          ].map((s: any, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              onClick={s.clickable ? () => {
                const list = s.label === 'Followers' ? followers : following;
                const title = s.label;
                setShowFollowSheet({ title, list });
              } : undefined}
              className={`bg-[#EDF3EA] rounded-2xl py-3.5 px-2 text-center ${s.clickable ? 'cursor-pointer hover:bg-[#D8E8D8] active:scale-95 transition-all' : ''}`}
            >
              <span className="text-lg block mb-0.5">{s.icon}</span>
              <p className="text-[20px] font-extrabold text-[#171717]">{s.value}</p>
              <p className="text-[11px] font-semibold text-[#9E9E9E] uppercase tracking-wide">{s.label} {s.clickable ? '›' : ''}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          XP PROGRESS — Google Maps Local Guide style
          ═══════════════════════════════════════════════════════════════ */}
      <div className="px-5 mt-3">
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-[#D4A95F]" />
              <span className="text-[13px] font-semibold text-[#171717]">Explorer XP</span>
            </div>
            <span className="text-[12px] font-medium text-[#9E9E9E]">Level {level} · {xp} XP</span>
          </div>
          <div className="h-2 rounded-full bg-[#EDF3EA] overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${xpPct}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="h-full rounded-full bg-gradient-to-r from-[#D4A95F] to-[#B8893A]"
            />
          </div>
          <p className="text-[12px] text-[#9E9E9E] mt-1.5">{100 - xpPct} XP to Level {level + 1}</p>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          WALLET + ACHIEVEMENTS — Grab + Google Maps cards
          ═══════════════════════════════════════════════════════════════ */}
      <div className="px-5 mt-3 space-y-2">
        {walletData?.length > 0 && (
          <Link href="/wallet" className="block bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#E8F2EB] flex items-center justify-center flex-shrink-0">
                <Wallet className="h-5 w-5 text-[#315B43]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-semibold text-[#171717]">Travel Wallet</p>
                <p className="text-[12px] text-[#9E9E9E]">RM {totalSaved.toLocaleString()} saved · {activeGoals} active · {completedGoals} completed</p>
              </div>
              <ChevronRight className="h-5 w-5 text-[#CCC] flex-shrink-0" />
            </div>
          </Link>
        )}

        {achievements && (
          <Link href="/profile/achievements" className="block bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#FBF4E5] flex items-center justify-center flex-shrink-0">
                <Award className="h-5 w-5 text-[#B8893A]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-semibold text-[#171717]">Achievements</p>
                <p className="text-[12px] text-[#9E9E9E]">{unlockedAchievements}/{totalAchievements} unlocked · {achievements?.totalXp || 0} XP earned</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="w-14 h-1.5 rounded-full bg-[#EDF3EA] overflow-hidden">
                  <div className="h-full rounded-full bg-[#D4A95F]" style={{ width: `${totalAchievements > 0 ? (unlockedAchievements / totalAchievements) * 100 : 0}%` }} />
                </div>
                <ChevronRight className="h-5 w-5 text-[#CCC]" />
              </div>
            </div>
          </Link>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          TRAVEL DNA — Polarsteps style
          ═══════════════════════════════════════════════════════════════ */}
      {dna.length > 0 && (
        <div className="px-5 mt-5">
          <div className="mb-3">
            <p className="text-[12px] font-bold text-[#9E9E9E] uppercase tracking-wider">Travel DNA</p>
            <h2 className="text-[20px] font-bold text-[#171717] mt-0.5">Your Explorer Profile</h2>
            <p className="text-[13px] text-[#9E9E9E] mt-1">Computed from your trips, saved places, reviews, and wishlist</p>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm space-y-4">
            {dna.map((trait: any, i: number) => {
              const level = trait.v >= 80 ? 'Master' : trait.v >= 55 ? 'Expert' : trait.v >= 30 ? 'Enthusiast' : 'Novice';
              const levelColor = trait.v >= 80 ? 'text-[#D4A95F]' : trait.v >= 55 ? 'text-[#315B43]' : trait.v >= 30 ? 'text-[#5E876A]' : 'text-[#9E9E9E]';
              return (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{trait.e}</span>
                      <span className="text-[14px] font-semibold text-[#171717]">{trait.l}</span>
                    </div>
                    <span className={`text-[12px] font-bold ${levelColor}`}>{level} · {trait.v}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-[#EDF3EA] overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${trait.v}%` }}
                      transition={{ duration: 0.8, delay: 0.1 + i * 0.08 }}
                      className="h-full rounded-full"
                      style={{ background: trait.color || '#315B43' }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          VISITED CITIES — Polarsteps Passport style
          ═══════════════════════════════════════════════════════════════ */}
      {visitedCities.length > 0 && (
        <div className="px-5 mt-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-[12px] font-bold text-[#9E9E9E] uppercase tracking-wider">Travel Passport</p>
              <h2 className="text-[20px] font-bold text-[#171717] mt-0.5">Visited Cities</h2>
            </div>
            <span className="text-[12px] font-semibold text-[#315B43] bg-[#E8F2EB] px-3 py-1 rounded-full">{visitedCities.length} cities</span>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex flex-wrap gap-1.5">
              {visitedCities.map((city: string, i: number) => (
                <span key={i} className="inline-flex items-center gap-1 px-3.5 py-2 bg-[#F7F9F5] border border-[#E8EDE4] rounded-full text-[13px] font-medium text-[#6F6F6F]">
                  <MapPin className="h-3 w-3 text-[#315B43]" /> {city}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          QUICK ACTIONS — Grab style grid
          ═══════════════════════════════════════════════════════════════ */}
      <div className="px-5 mt-5">
        <div className="mb-3">
          <p className="text-[12px] font-bold text-[#9E9E9E] uppercase tracking-wider">Your Space</p>
          <h2 className="text-[20px] font-bold text-[#171717] mt-0.5">Quick Actions</h2>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { href: '/profile/trips', icon: Compass, label: 'My Trips' },
            { href: '/profile/albums', icon: Image, label: 'Albums' },
            { href: '/profile/journal', icon: ScrollText, label: 'Journal' },
            { href: '/profile/photos', icon: Camera, label: 'Photos' },
            { href: '/profile/favorites', icon: Heart, label: 'Favorites' },
            { href: '/profile/reviews', icon: Star, label: 'Reviews' },
            { href: '/profile/wishlist', icon: Sparkles, label: 'Wishlist' },
            { href: '/profile/memories', icon: Globe, label: 'Memories' },
            { href: '/travel-map', icon: Compass, label: 'Travel Map' },
            { href: '/profile/couple', icon: Heart, label: 'Couple' },
          ].map((a, i) => (
            <motion.div key={a.href} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}>
              <Link href={a.href}
                className="flex flex-col items-center gap-2 py-4 px-2 bg-white rounded-2xl shadow-sm hover:shadow-md hover:bg-[#E8F2EB] transition-all text-center group">
                <div className="w-10 h-10 rounded-xl bg-[#F7F9F5] group-hover:bg-white flex items-center justify-center transition-colors">
                  <a.icon className="h-5 w-5 text-[#315B43]" />
                </div>
                <span className="text-[12px] font-semibold text-[#6F6F6F] group-hover:text-[#315B43] transition-colors">{a.label}</span>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          SETTINGS LINKS
          ═══════════════════════════════════════════════════════════════ */}
      <div className="px-5 mt-5">
        <div className="bg-white rounded-2xl shadow-sm divide-y divide-[#F0F3ED] overflow-hidden">
          {[
            { e: '🏆', l: 'Achievements', h: '/profile/achievements' },
            { e: '📊', l: 'Travel Statistics', h: '/profile/stats' },
            { e: '🔒', l: 'Privacy Center', h: '/profile/privacy' },
            { e: '🔔', l: 'Notifications', h: '/profile/notifications' },
            ...(data?.role === 'ADMIN' || data?.email === 'yongfeng3318@gmail.com' ? [{ e: '🛡️', l: 'Admin Panel', h: '/admin' }] : []),
            { e: '❓', l: 'Help & Support', h: '/profile/help' },
          ].map((m) => (
            <Link key={m.l} href={m.h}
              className="flex items-center gap-3 px-5 py-4 hover:bg-[#F7F9F5] transition-colors">
              <span className="text-lg">{m.e}</span>
              <span className="flex-1 text-[14px] font-semibold text-[#171717]">{m.l}</span>
              <ChevronRight className="h-4 w-4 text-[#CCC]" />
            </Link>
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          LOGOUT
          ═══════════════════════════════════════════════════════════════ */}
      <div className="px-5 mt-5 pb-8">
        <button onClick={logout}
          className="w-full py-3.5 rounded-2xl bg-red-50 text-red-500 text-[15px] font-bold hover:bg-red-100 transition-colors border border-red-100 flex items-center justify-center gap-2">
          🚪 Sign Out
        </button>
      </div>

      {/* Followers/Following Sheet */}
      {showFollowSheet && (
        <div className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm flex items-end" onClick={() => setShowFollowSheet(null)}>
          <div className="w-full max-h-[70vh] bg-white rounded-t-[28px] shadow-2xl overflow-y-auto animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex justify-center pt-3 pb-2"><div className="w-10 h-1 rounded-full bg-gray-300" /></div>
            <div className="flex items-center justify-between px-5 pb-3">
              <h2 className="text-[20px] font-extrabold text-[#3C2415]">{showFollowSheet.title} ({showFollowSheet.list.length})</h2>
              <button onClick={() => setShowFollowSheet(null)} className="p-2 text-[#8B7355]">✕</button>
            </div>
            <div className="px-5 pb-8 space-y-2">
              {showFollowSheet.list.length === 0 && <p className="text-center text-[#8B7355] py-8">No one yet</p>}
              {showFollowSheet.list.map((u: any) => (
                <Link href={`/user/${u.id}`} key={u.id} onClick={() => setShowFollowSheet(null)}
                  className="flex items-center gap-3 p-3 bg-[#FDF0E0]/30 rounded-2xl hover:bg-[#FDF0E0] transition-colors">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#C4956A] to-[#D4A574] flex items-center justify-center text-white font-bold text-lg">{u.displayName?.[0] || '?'}</div>
                  <div className="flex-1"><p className="text-[14px] font-extrabold text-[#3C2415]">{u.displayName || 'User'}</p><p className="text-[11px] text-[#8B7355]">Level {u.level || 1} Explorer</p></div>
                  <span className="text-[#C4956A] text-lg">›</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Full-screen Image Viewer */}
      {viewImage && (
        <div className="fixed inset-0 z-[9999] bg-black flex items-center justify-center" onClick={() => setViewImage(null)}>
          <button onClick={() => setViewImage(null)} className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-white z-20 hover:bg-white/30">✕</button>
          <img src={viewImage} className="max-w-full max-h-[95vh] object-contain" alt="" onClick={e => e.stopPropagation()} />
        </div>
      )}

      <div className="h-24" />
    </div>
  );
}
