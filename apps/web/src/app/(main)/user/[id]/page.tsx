// @ts-nocheck
'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, MapPin, Camera, BookOpen, Star, Clock, Heart, UserPlus, UserCheck, Navigation, ChevronRight, Award, Grid3X3, List } from 'lucide-react';


export default function UserProfilePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [viewPhoto, setViewPhoto] = useState<string | null>(null);
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : '';
  const myId = typeof window !== 'undefined' ? localStorage.getItem('userId') : '';

  useEffect(() => {
    if (!id) return;
    const h = token ? { Authorization: `Bearer ${token}` } : {};
    Promise.all([
      fetch(`${API}/api/auth/user/${id}/profile`, { headers: h }).then(r => r.json()).catch(() => ({ data: null })),
      fetch(`${API}/api/auth/user/${id}/followers`, { headers: h }).then(r => r.json()).catch(() => ({ data: [] })),
      fetch(`${API}/api/auth/user/${id}/following`, { headers: h }).then(r => r.json()).catch(() => ({ data: [] })),
    ]).then(([p, followers, following]) => {
      const data = p.data || {};
      setProfile({ ...data, followersList: followers.data || [], followingList: following.data || [] });
      setIsFollowing((followers.data || []).some((f: any) => f.id === myId));
      setLoading(false);
    });
  }, [id, myId]);

  const toggleFollow = async () => {
    if (!token || !id) return;
    await fetch(`${API}/api/auth/follow/${id}`, { method: isFollowing ? 'DELETE' : 'POST', headers: { Authorization: `Bearer ${token}` } });
    setIsFollowing(!isFollowing);
    setProfile((prev: any) => ({
      ...prev, followers: (prev?.followers || 0) + (isFollowing ? -1 : 1),
      followersList: isFollowing ? (prev?.followersList || []).filter((f: any) => f.id !== myId) : [...(prev?.followersList || []), { id: myId, displayName: 'You', level: 1 }],
    }));
  };

  // Don't show own profile - redirect
  useEffect(() => { if (myId && id === myId) router.replace('/profile'); }, [id, myId]);

  if (loading) return <div className="min-h-screen bg-[#FFFDF7] flex items-center justify-center"><div className="w-10 h-10 rounded-full border-2 border-[#C4956A]/20 border-t-[#C4956A] animate-spin" /></div>;
  if (!profile) return <div className="min-h-screen bg-[#FFFDF7] flex items-center justify-center"><div className="text-center"><p className="text-[#3C2415] font-extrabold text-lg">User not found</p><Link href="/search" className="text-[#C4956A] text-sm mt-2 block">← Back to Search</Link></div></div>;

  const displayName = profile.displayName || 'Explorer';
  const bio = profile.bio || '';
  const location = profile.location || '';
  const photos: any[] = profile.myPhotos || [];
  const trips: any[] = profile.travelHistory || [];
  const journals: any[] = profile.journals || [];
  const cities: string[] = profile.visitedCities || [];
  const dna: any[] = profile.dna || [];
  const badges: any[] = profile.badges || [];
  const coverUrl = profile.coverUrl;
  const avatarUrl = profile.avatarUrl;

  return (
    <div className="min-h-screen bg-[#FFFDF7]">
      {/* Cover Photo */}
      <div className="relative h-44 overflow-hidden bg-gradient-to-br from-[#234530] via-[#315B43] to-[#5E876A]">
        {coverUrl && <img src={coverUrl} className="w-full h-full object-cover" alt="" />}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        {/* Back + Follow */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
          <button onClick={() => router.back()} className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/30">
            <ArrowLeft className="h-5 w-5" /></button>
          {token && (
            <button onClick={toggleFollow} className={`px-5 py-2 rounded-full text-[13px] font-bold backdrop-blur-md transition-all ${isFollowing ? 'bg-white/20 text-white' : 'bg-white text-[#3C2415] shadow-lg'}`}>
              {isFollowing ? <><UserCheck className="h-4 w-4 inline mr-1" />Following</> : <><UserPlus className="h-4 w-4 inline mr-1" />Follow</>}
            </button>
          )}
        </div>
      </div>

      {/* Profile Header */}
      <div className="px-5 -mt-12 relative z-10">
        <div className="flex items-end gap-4 mb-3">
          <div className="w-[88px] h-[88px] rounded-full bg-gradient-to-br from-[#C4956A] to-[#D4A574] flex items-center justify-center text-white text-[32px] font-bold ring-[4px] ring-[#FFFDF7] shadow-lg flex-shrink-0 overflow-hidden">
            {avatarUrl ? <img src={avatarUrl} className="w-full h-full object-cover" alt="" /> : displayName[0]}
          </div>
          <div className="flex-1 pb-1 min-w-0">
            <h1 className="text-[22px] font-extrabold text-[#3C2415] truncate">{displayName}</h1>
            {bio && <p className="text-[13px] text-[#8B7355] mt-0.5 line-clamp-2">{bio}</p>}
            <div className="flex items-center gap-3 mt-1">
              {location && <span className="text-[12px] text-[#A08970] flex items-center gap-1"><MapPin className="h-3 w-3" />{location}</span>}
              <span className="text-[12px] text-[#A08970]">Lv.{profile.level || 1}</span>
              {profile.memberSince && <span className="text-[12px] text-[#A08970]">Since {new Date(profile.memberSince).getFullYear()}</span>}
            </div>
            {badges.filter((b: any) => b.unlocked).length > 0 && (
              <div className="flex gap-1 mt-1.5">{badges.filter((b: any) => b.unlocked).slice(0, 6).map((b: any) => (<span key={b.n} className="text-lg" title={b.n}>{b.e}</span>))}</div>
            )}
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-1 mb-4">
          {[
            { v: trips.length, l: 'Trips' }, { v: photos.length, l: 'Photos' }, { v: profile.followers || 0, l: 'Followers' }, { v: profile.following || 0, l: 'Following' },
          ].map(s => (
            <div key={s.l} className="text-center py-2"><p className="text-[18px] font-extrabold text-[#3C2415]">{s.v}</p><p className="text-[10px] text-[#8B7355] font-medium">{s.l}</p></div>
          ))}
        </div>
      </div>

      {/* DNA + Achievements Bar */}
      {dna.length > 0 && (
        <div className="px-5 mb-4">
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {dna.slice(0, 5).map((t: any) => (
              <div key={t.l} className="flex-shrink-0 flex items-center gap-1.5 bg-[#FDF0E0] rounded-full px-3 py-1.5">
                <span className="text-sm">{t.e}</span><span className="text-[11px] font-bold text-[#C4956A]">{t.v}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* View Mode Toggle */}
      <div className="px-5 mb-3 flex items-center justify-between">
        <p className="text-[11px] font-bold text-[#8B7355] uppercase tracking-wider">Content</p>
        <div className="flex gap-1 bg-[#F5EDE3] rounded-lg p-0.5">
          <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-md ${viewMode === 'grid' ? 'bg-white shadow-sm' : ''}`}><Grid3X3 className="h-4 w-4 text-[#3C2415]" /></button>
          <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-md ${viewMode === 'list' ? 'bg-white shadow-sm' : ''}`}><List className="h-4 w-4 text-[#3C2415]" /></button>
        </div>
      </div>

      {/* Content Area */}
      <div className="px-5 pb-24 space-y-4">
        {/* Photos Grid */}
        {photos.length > 0 && viewMode === 'grid' && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[12px] font-bold text-[#3C2415] flex items-center gap-1.5"><Camera className="h-3.5 w-3.5 text-[#C4956A]" />Photos · {photos.length}</p>
            </div>
            <div className="grid grid-cols-3 gap-1">
              {photos.map((p: any, i: number) => (
                <div key={i} onClick={() => setViewPhoto(p.url)} className="aspect-square rounded-lg overflow-hidden bg-[#F5EDE3] cursor-pointer hover:opacity-90 transition-opacity">
                  <img src={p.url} className="w-full h-full object-cover" alt="" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Photos List */}
        {photos.length > 0 && viewMode === 'list' && photos.map((p: any, i: number) => (
          <div key={i} onClick={() => setViewPhoto(p.url)} className="bg-white rounded-2xl p-3 shadow-sm border border-[#E8D5C4]/50 cursor-pointer hover:shadow-md flex gap-3">
            <div className="w-20 h-20 rounded-xl overflow-hidden bg-[#F5EDE3] flex-shrink-0">
              <img src={p.url} className="w-full h-full object-cover" alt="" /></div>
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-bold text-[#3C2415]">{p.caption || 'Photo'}</p>
              {p.place && <p className="text-[12px] text-[#8B7355] flex items-center gap-1 mt-1"><MapPin className="h-3 w-3" />{p.place}</p>}
              <p className="text-[10px] text-[#A08970] mt-1">{p.date}</p>
            </div>
          </div>
        ))}

        {/* Travel History */}
        {trips.length > 0 && (
          <div>
            <p className="text-[12px] font-bold text-[#3C2415] mb-2 flex items-center gap-1.5"><Star className="h-3.5 w-3.5 text-[#C4956A]" />Travels · {trips.length}</p>
            <div className="space-y-1.5">
              {trips.map((t: any, i: number) => (
                <div key={i} className="bg-white rounded-xl p-3 shadow-sm border border-[#E8D5C4]/50 flex items-center gap-3">
                  <span className="text-xl flex-shrink-0">{t.emoji || '✈️'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold text-[#3C2415] truncate">{t.title}</p>
                    <p className="text-[11px] text-[#8B7355]">{t.city} · {t.date}</p>
                  </div>
                  <button onClick={() => window.open(`https://www.google.com/maps/search/${encodeURIComponent((t.city || '') + ' travel')}`, '_blank')}
                    className="p-2 rounded-lg bg-[#FDF0E0] text-[#C4956A] flex-shrink-0"><Navigation className="h-4 w-4" /></button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Cities */}
        {cities.length > 0 && (
          <div>
            <p className="text-[12px] font-bold text-[#3C2415] mb-2 flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-[#C4956A]" />Cities · {cities.length}</p>
            <div className="flex flex-wrap gap-1.5">{cities.map((c: string) => (
              <span key={c} className="px-3 py-1.5 bg-[#FDF0E0] rounded-full text-[11px] font-semibold text-[#6B4D3A] flex items-center gap-1"><MapPin className="h-3 w-3" />{c}</span>))}</div>
          </div>
        )}

        {/* Journals */}
        {journals.length > 0 && (
          <div>
            <p className="text-[12px] font-bold text-[#3C2415] mb-2 flex items-center gap-1.5"><BookOpen className="h-3.5 w-3.5 text-[#C4956A]" />Journals · {journals.length}</p>
            {journals.map((j: any, i: number) => (
              <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-[#E8D5C4]/50 mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{j.mood || '📝'}</span>
                  <p className="text-[14px] font-bold text-[#3C2415]">{j.title}</p>
                </div>
                <p className="text-[11px] text-[#8B7355] mt-1">{j.place} · {j.date}</p>
                <p className="text-[13px] text-[#6B4D3A] mt-2 leading-relaxed line-clamp-3">{j.content}</p>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {photos.length === 0 && trips.length === 0 && journals.length === 0 && (
          <div className="text-center py-16">
            <Camera className="h-12 w-12 mx-auto text-[#D4C4B0] mb-3" />
            <p className="text-[#3C2415] font-extrabold text-lg">No public content yet</p>
            <p className="text-[#8B7355] text-sm mt-1">This explorer hasn't shared any adventures yet</p>
          </div>
        )}
      </div>

      {/* Full-screen photo viewer */}
      {viewPhoto && (
        <div className="fixed inset-0 z-[9999] bg-black flex items-center justify-center" onClick={() => setViewPhoto(null)}>
          <button onClick={() => setViewPhoto(null)} className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-white z-20">✕</button>
          <img src={viewPhoto} className="max-w-full max-h-[95vh] object-contain" alt="" onClick={e => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}
