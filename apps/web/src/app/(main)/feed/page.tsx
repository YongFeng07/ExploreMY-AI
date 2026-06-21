// @ts-nocheck
'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Heart, MapPin, Camera, BookOpen, Star, Sparkles, Compass } from 'lucide-react';

const API = 'http://localhost:3001';
function imgUrl(url: string | null | undefined): string | null { if (!url) return null; if (url.startsWith('http')) return url; return `${API}${url.startsWith('/') ? '' : '/'}${url}`; }

const typeIcon: Record<string, any> = { photo: Camera, journal: BookOpen, review: Star, trip: Sparkles, achievement: Star, wishlist: Compass };
const typeLabel: Record<string, string> = { photo: 'shared a photo', journal: 'wrote a journal', review: 'left a review', trip: 'planned a trip', achievement: 'earned an achievement', wishlist: 'added to wishlist' };

export default function SocialFeedPage() {
  const [feed, setFeed] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : '';

  const load = () => {
    setLoading(true);
    fetch(`${API}/api/v1/auth/social/feed`).then(r => r.json()).then(d => { setFeed(d.data || []); setLoading(false); }).catch(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const toggleLike = async (id: string) => {
    if (!token) return;
    const r = await fetch(`${API}/api/v1/auth/social/feed/${id}/like`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } });
    const d = await r.json();
    if (d.data) setFeed(prev => prev.map(a => a.id === id ? { ...a, likes: [...a.likes, ...(d.data.liked ? ['user'] : [])] } : a));
  };

  const timeAgo = (d: string) => {
    const diff = Date.now() - new Date(d).getTime(); const m = Math.floor(diff / 60000);
    if (m < 1) return 'just now'; if (m < 60) return `${m}m ago`; const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`;
    return new Date(d).toLocaleDateString('en-MY', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <div className="px-5 pt-14 pb-4">
        <Link href="/explore" className="text-[#C4956A] text-[13px] font-semibold mb-1 block">← Explore</Link>
        <h1 className="text-[28px] font-extrabold text-[#1A1A1A] flex items-center gap-2">🌏 Explore Feed</h1>
        <p className="text-[13px] text-[#8B7355] mt-1">See what travelers are discovering</p>
      </div>

      <div className="px-5 pb-24 space-y-4">
        {loading && <div className="text-center py-10"><div className="w-8 h-8 rounded-full border-2 border-[#C4956A]/20 border-t-[#C4956A] animate-spin mx-auto" /></div>}
        {!loading && feed.length === 0 && (
          <div className="text-center py-16">
            <Compass className="h-12 w-12 mx-auto text-[#D4C4B0] mb-3" />
            <p className="text-[#3C2415] font-extrabold text-lg">No activity yet</p>
            <p className="text-[#8B7355] text-sm mt-1">Start exploring — your adventures will appear here!</p>
          </div>
        )}

        {feed.map((a: any) => {
          const Icon = typeIcon[a.type] || Camera;
          return (
            <div key={a.id} className="bg-white rounded-2xl shadow-sm border border-[#E5E7EB] overflow-hidden">
              {/* Header */}
              <div className="flex items-center gap-3 p-4 pb-2">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#C4956A] to-[#D4A574] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                  {a.userName?.[0] || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold text-[#1A1A1A]">
                    <span className="font-extrabold">{a.userName}</span>{' '}
                    <span className="text-[#8B7355] font-normal">{typeLabel[a.type] || 'posted'}</span>
                  </p>
                  <p className="text-[11px] text-[#A69A8C]">{timeAgo(a.createdAt)}</p>
                </div>
              </div>

              {/* Photo */}
              {a.photoUrl && (
                <div className="px-4 pb-2">
                  <img src={imgUrl(a.photoUrl)!} className="w-full h-56 object-cover rounded-xl" alt="" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                </div>
              )}

              {/* Content */}
              <div className="px-4 pb-3">
                <p className="text-[15px] text-[#3C2415] font-medium">{a.content}</p>
                {a.placeName && (
                  <p className="text-[12px] text-[#8B7355] flex items-center gap-1 mt-1">
                    <MapPin className="h-3 w-3" />{a.placeName}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-4 px-4 py-3 border-t border-[#F5EDE3]">
                <button onClick={() => toggleLike(a.id)}
                  className="flex items-center gap-1.5 text-[13px] font-semibold text-[#8B7355] hover:text-red-500 transition-colors">
                  <Heart className={`h-5 w-5 ${a.likes?.length > 0 ? 'fill-red-400 text-red-400' : ''}`} />
                  {a.likes?.length > 0 && <span>{a.likes.length}</span>}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
