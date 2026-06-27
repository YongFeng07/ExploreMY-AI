// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Trophy, Star, MapPin, Camera, BookOpen, Heart, Wallet, Check } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || '';

const CATEGORY_META: Record<string, { icon: any; label: string; color: string; bg: string }> = {
  trips:     { icon: MapPin, label: 'Trips', color: '#C4956A', bg: '#FDF0E0' },
  cities:    { icon: Star, label: 'Cities', color: '#B8860B', bg: '#FDF6ED' },
  photos:    { icon: Camera, label: 'Photos', color: '#3B82F6', bg: '#EFF6FF' },
  journals:  { icon: BookOpen, label: 'Journals', color: '#8B6F9E', bg: '#F4F0F8' },
  favorites: { icon: Heart, label: 'Favorites', color: '#D4736A', bg: '#FDF0EF' },
  reviews:   { icon: Star, label: 'Reviews', color: '#D4A53F', bg: '#FDF8EE' },
  couple:    { icon: Heart, label: 'Couple', color: '#D4637A', bg: '#FDF0F4' },
  wallet:    { icon: Wallet, label: 'Savings', color: '#C4956A', bg: '#FDF0E0' },
  albums:    { icon: Camera, label: 'Albums', color: '#3B82F6', bg: '#EFF6FF' },
  wishlist:  { icon: Star, label: 'Wishlist', color: '#B8860B', bg: '#FDF6ED' },
};

export default function AchievementsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');

  useEffect(() => {
    // Build achievements from localStorage data
    const favs = JSON.parse(localStorage.getItem('favorites') || '[]').length;
    const trips = JSON.parse(localStorage.getItem('saved_trips') || '[]').length;
    const photos = JSON.parse(localStorage.getItem('profile_photos') || '[]').length;
    const reviews = JSON.parse(localStorage.getItem('profile_reviews') || '[]').length;
    const albums = JSON.parse(localStorage.getItem('profile_albums') || '[]').length;
    const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]').length;
    const wallet = JSON.parse(localStorage.getItem('wallet_goals') || '[]').length;
    const savedTrips = JSON.parse(localStorage.getItem('saved_trips') || '[]');
    const uniqueCities = new Set(savedTrips.map((t: any) => t.destination?.toLowerCase()).filter(Boolean));
    const cities = uniqueCities.size;
    setData({
      achievements: [
        { id: 'trips_1', title: 'First Trip Saved', description: 'Save your first trip plan', category: 'trips', unlocked: trips >= 1, progress: trips, target: 1 },
        { id: 'trips_5', title: 'Explorer', description: 'Save 5 trips', category: 'trips', unlocked: trips >= 5, progress: Math.min(trips, 5), target: 5 },
        { id: 'photos_1', title: 'First Photo', description: 'Upload your first photo', category: 'photos', unlocked: photos >= 1, progress: photos, target: 1 },
        { id: 'photos_10', title: 'Photographer', description: 'Upload 10 photos', category: 'photos', unlocked: photos >= 10, progress: Math.min(photos, 10), target: 10 },
        { id: 'favs_1', title: 'First Favorite', description: 'Save your first favorite place', category: 'favorites', unlocked: favs >= 1, progress: favs, target: 1 },
        { id: 'favs_5', title: 'Collector', description: 'Save 5 favorites', category: 'favorites', unlocked: favs >= 5, progress: Math.min(favs, 5), target: 5 },
        { id: 'review_1', title: 'First Review', description: 'Write your first review', category: 'reviews', unlocked: reviews >= 1, progress: reviews, target: 1 },
        { id: 'album_1', title: 'Memory Maker', description: 'Create an album', category: 'albums', unlocked: albums >= 1, progress: albums, target: 1 },
        { id: 'wish_1', title: 'Dreamer', description: 'Add to wishlist', category: 'wishlist', unlocked: wishlist >= 1, progress: wishlist, target: 1 },
        { id: 'save_1', title: 'Saver', description: 'Create a savings goal', category: 'wallet', unlocked: wallet >= 1, progress: wallet, target: 1 },
        { id: 'trips_10', title: 'Globetrotter', description: 'Save 10 trips', category: 'trips', unlocked: trips >= 10, progress: Math.min(trips, 10), target: 10 },
        { id: 'photos_25', title: 'Shutterbug', description: 'Upload 25 photos', category: 'photos', unlocked: photos >= 25, progress: Math.min(photos, 25), target: 25 },
        { id: 'favs_10', title: 'Curator', description: 'Save 10 favorites', category: 'favorites', unlocked: favs >= 10, progress: Math.min(favs, 10), target: 10 },
        { id: 'review_5', title: 'Critic', description: 'Write 5 reviews', category: 'reviews', unlocked: reviews >= 5, progress: Math.min(reviews, 5), target: 5 },
        { id: 'cities_3', title: 'City Hopper', description: 'Visit 3 different cities', category: 'cities', unlocked: cities >= 3, progress: Math.min(cities, 3), target: 3 },
        { id: 'cities_5', title: 'State Explorer', description: 'Visit 5 different cities', category: 'cities', unlocked: cities >= 5, progress: Math.min(cities, 5), target: 5 },
      ],
      total: 16, unlocked: [trips >= 1, photos >= 1, favs >= 1, reviews >= 1, albums >= 1, wishlist >= 1, wallet >= 1, trips >= 5, photos >= 10, favs >= 5, trips >= 10, photos >= 25, favs >= 10, reviews >= 5, cities >= 3, cities >= 5].filter(Boolean).length,
    });
    setLoading(false);
  }, []);

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFFDF7]">
        <div className="p-6 space-y-4">
          <div className="h-10 w-48 bg-[#F5EDE3] rounded-xl animate-pulse" />
          <div className="h-32 bg-[#F5EDE3] rounded-3xl animate-pulse" />
          <div className="h-16 bg-[#F5EDE3] rounded-2xl animate-pulse" />
          {[1,2,3,4,5].map(i => <div key={i} className="h-20 bg-[#F5EDE3] rounded-2xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  /* ── Error ── */
  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#FFFDF7] flex items-center justify-center px-6">
        <div className="text-center">
          <div className="w-20 h-20 rounded-[24px] bg-[#FDF0E0] flex items-center justify-center mx-auto mb-4 text-3xl">🏆</div>
          <h2 className="text-[20px] font-bold text-[#3C2415]">Couldn't load achievements</h2>
          <p className="text-[14px] text-[#8B7355] mt-2">{error || 'Try again later.'}</p>
        </div>
      </div>
    );
  }

  const unlocked = data?.unlocked ?? 0;
  const total = data?.total ?? 0;
  const totalXp = data?.totalXp ?? 0;
  const progress = data?.progress ?? 0;
  const byCategory = data?.byCategory ?? {};
  const achievements: any[] = data?.achievements ?? [];
  const filtered = activeCategory === 'all' ? achievements : achievements.filter((a: any) => a.category === activeCategory);
  const categories = ['all', ...Object.keys(byCategory || {})];

  return (
    <div className="min-h-screen bg-[#FFFDF7]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#FFFDF7]/90 backdrop-blur-xl border-b border-[#E8D5C4]/50 px-5 pt-3 pb-2">
        <div className="flex items-center gap-3">
          <Link href="/profile" className="w-10 h-10 rounded-full bg-white border border-[#E8D5C4] flex items-center justify-center">
            <ArrowLeft className="h-5 w-5 text-[#3C2415]" />
          </Link>
          <div>
            <h1 className="text-[20px] font-bold text-[#3C2415]">Achievements</h1>
            <p className="text-[12px] text-[#8B7355]">{unlocked}/{total} unlocked · {totalXp} XP</p>
          </div>
        </div>
      </div>

      <div className="px-5 pt-4 pb-4">
        {/* Overview Card */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[32px] p-6 shadow-sm text-center mb-5">
          {/* Progress Ring */}
          <div className="flex justify-center mb-3">
            <div className="relative w-[100px] h-[100px]">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" fill="none" stroke="#F5EDE3" strokeWidth="8" />
                <motion.circle cx="50" cy="50" r="42" fill="none" stroke="#C4956A" strokeWidth="8"
                  strokeLinecap="round" strokeDasharray={`${2 * Math.PI * 42}`}
                  initial={{ strokeDashoffset: 2 * Math.PI * 42 }}
                  animate={{ strokeDashoffset: (2 * Math.PI * 42) * (1 - progress / 100) }}
                  transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }} />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[24px] font-extrabold text-[#3C2415]">{progress}%</span>
              </div>
            </div>
          </div>
          <p className="text-[13px] text-[#8B7355] font-medium">Achievement Progress</p>
          {/* Level dots */}
          <div className="flex justify-center gap-1.5 mt-2">
            {[1, 2, 3, 4].map(level => (
              <div key={level} className={`w-2 h-2 rounded-full ${progress >= level * 25 ? 'bg-[#D4A574]' : 'bg-[#F5EDE3]'}`} />
            ))}
          </div>
          <p className="text-[13px] text-[#6B4D3A] mt-2 font-semibold">
            {progress >= 100 ? '🏆 All achievements unlocked! You\'re a true explorer!' :
             progress >= 75 ? '🔥 Almost there! Keep exploring!' :
             progress >= 50 ? '💪 Halfway to mastery!' :
             progress >= 25 ? '🌱 Great start! Many adventures ahead.' :
             '🚀 Begin your journey! Every explorer starts here.'}
          </p>
        </motion.div>

        {/* Category Pills */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-3">
          {categories.map(cat => {
            const meta = CATEGORY_META[cat];
            const label = cat === 'all' ? 'All' : meta?.label || cat;
            const catData = cat === 'all' ? null : byCategory?.[cat];
            return (
              <button key={cat} onClick={() => setActiveCategory(cat)}
                className={`flex-shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-semibold transition-all ${
                  activeCategory === cat
                    ? 'bg-[#C4956A] text-white shadow-md'
                    : 'bg-white text-[#8B7355] border border-[#E8D5C4] hover:border-[#C4956A]'
                }`}>
                {cat === 'all' ? '🏆' : meta?.icon ? <meta.icon className="h-3.5 w-3.5" /> : '⭐'}
                {' '}{label}
                {catData && (
                  <span className="text-[11px] ml-0.5 opacity-70">{catData.unlocked}/{catData.total}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Achievement List */}
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <span className="text-4xl block mb-3">🏆</span>
            <p className="text-[16px] font-bold text-[#3C2415]">No achievements here yet</p>
            <p className="text-[13px] text-[#8B7355] mt-1">Start exploring to unlock achievements in this category.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filtered.map((a: any, i: number) => {
              const meta = CATEGORY_META[a.category];
              const pct = Math.round((a.progress || 0) * 100);
              return (
                <motion.div key={a.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className={`bg-white rounded-2xl p-4 shadow-sm transition-all ${a.unlocked ? 'border border-[#D4A574]/30' : 'opacity-60'}`}>
                  <div className="flex items-center gap-3">
                    {/* Emoji icon */}
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                      style={{ background: a.unlocked ? meta?.bg || '#FDF0E0' : '#F5EDE3' }}>
                      {a.unlocked ? a.emoji : '🔒'}
                    </div>

                    {/* Info + Progress */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <h3 className="text-[15px] font-bold text-[#3C2415] truncate">{a.name}</h3>
                        <span className="text-[11px] font-bold text-[#D4A574] flex-shrink-0 ml-2">+{a.xp} XP</span>
                      </div>
                      <p className="text-[12px] text-[#8B7355] truncate">{a.criteria}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full bg-[#F5EDE3] overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.6, delay: 0.1 + i * 0.02 }}
                            className="h-full rounded-full"
                            style={{ background: a.unlocked ? meta?.color || '#C4956A' : '#D4C4B0' }} />
                        </div>
                        <span className="text-[11px] font-bold text-[#8B7355] w-8 text-right">{pct}%</span>
                      </div>
                    </div>

                    {/* Checkmark */}
                    {a.unlocked && (
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#5C9A6F] flex items-center justify-center">
                        <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      <div className="h-28" />
    </div>
  );
}
