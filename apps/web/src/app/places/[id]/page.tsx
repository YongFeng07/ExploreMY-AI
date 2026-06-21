'use client';

import { useState, useEffect, use } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Star, MapPin, Clock, Phone, Globe, Heart, Navigation, ChevronRight, MessageSquare, Camera, Info, ArrowLeft, Check, Share2, Loader2, AlertTriangle, ExternalLink, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type TabType = 'info' | 'reviews' | 'photos';

interface PlaceData {
  id: string; slug: string; name: string; category: string; rating: number;
  reviewCount: number; priceLevel: number | null; photos: string[];
  address: string; city: string; lat: number; lng: number;
  openingHours: string; phone: string | null; website: string | null;
  description: string; amenities: string[];
  isOpen: boolean; isHiddenGem: boolean; isTrending: boolean;
  transportOptions?: Array<{ mode: string; icon: string; duration: number; distance: number; cost: string }>;
  reviews?: Array<{ id: string; userName: string; userInitial: string; rating: number; title: string | null; content: string; createdAt: string; tags: string[] }>;
  reviewSummary?: string; ratingDistribution?: Record<number, number>;
}

export default function PlaceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [place, setPlace] = useState<PlaceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('info');
  const [isSaved, setIsSaved] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true); setError(null);
    fetch(`/api/places/${id}`).then(r => r.json()).then(j => {
      if (!cancelled) { if (j.error) setError(j.error); else setPlace(j.data); }
    }).catch(() => { if (!cancelled) setError('Failed to load place'); })
    .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id]);

  const handleCall = () => { if (place?.phone) window.open(`tel:${place.phone}`); else toast.error('No phone number available'); };
  const handleNavigate = () => { if (place) window.open(`https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}`, '_blank'); };
  const handleSave = () => { setIsSaved(!isSaved); toast.success(isSaved ? 'Removed from favorites' : 'Saved to favorites!'); };
  const handleShare = async () => { if (navigator.share) { await navigator.share({ title: place?.name, url: window.location.href }); } else { await navigator.clipboard.writeText(window.location.href); toast.success('Link copied!'); } };

  // Loading
  if (loading) return (
    <div className="min-h-dvh bg-[#FFFDF7]">
      <div className="h-72 w-full skeleton sm:h-96" />
      <div className="px-4 py-6 space-y-4"><div className="h-8 w-2/3 skeleton rounded-xl"/><div className="h-4 w-full skeleton rounded-xl"/><div className="h-4 w-4/5 skeleton rounded-xl"/></div>
    </div>
  );

  // Error
  if (error || !place) return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-[#FFFDF7] px-4 gap-4">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50"><AlertTriangle className="h-8 w-8 text-red-400"/></div>
      <h1 className="text-xl font-extrabold text-[#3C2415]">Place Not Found</h1>
      <Button className="btn-cream rounded-xl" asChild><Link href="/explore">← Back to Map</Link></Button>
    </div>
  );

  return (
    <div className="min-h-dvh bg-[#FFFDF7] pb-28">
      {/* PHOTO HERO — fullscreen lightbox or hero */}
      {selectedPhoto ? (
        <div className="fixed inset-0 z-50 bg-black">
          <Image src={selectedPhoto} alt={place.name} fill className="object-contain" sizes="100vw" priority />
          <button onClick={() => setSelectedPhoto(null)} className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white text-xl backdrop-blur">✕</button>
          <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-2">
            {place.photos.map((p, i) => (<button key={i} onClick={() => setSelectedPhoto(p)} className={cn('h-2 rounded-full transition-all', p === selectedPhoto ? 'w-8 bg-white' : 'w-2 bg-white/40')} />))}
          </div>
        </div>
      ) : (
        <div className="relative h-72 w-full overflow-hidden sm:h-96">
          {place.photos[0] && <Image src={place.photos[0]!} alt={place.name} fill className="object-cover" priority sizes="100vw" />}
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/70" />
          {/* Top bar */}
          <div className="absolute left-4 right-4 top-4 flex items-center justify-between pt-safe">
            <Link href="/explore" className="flex h-9 w-9 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur"><ArrowLeft className="h-5 w-5" /></Link>
            <div className="flex gap-2">
              <button onClick={handleSave} className="flex h-9 w-9 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur"><Heart className={cn('h-5 w-5', isSaved && 'fill-red-400 text-red-400')} /></button>
              <button onClick={handleShare} className="flex h-9 w-9 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur"><Share2 className="h-5 w-5" /></button>
            </div>
          </div>
          {/* Photo count */}
          {place.photos.length > 1 && <button onClick={() => setSelectedPhoto(place.photos[0]!)} className="absolute bottom-4 right-4 z-10 rounded-lg bg-black/40 px-3 py-1 text-xs font-bold text-white backdrop-blur">📷 {place.photos.length} photos</button>}
          {/* Title overlay */}
          <div className="absolute bottom-4 left-4 right-16">
            <div className="flex flex-wrap gap-1.5">{place.isTrending && <Badge className="bg-amber-500 text-white text-[10px] border-0 font-bold">🔥 Trending</Badge>}{place.isHiddenGem && <Badge className="bg-emerald-500 text-white text-[10px] border-0 font-bold">💎 Hidden Gem</Badge>}</div>
            <h1 className="mt-1.5 text-2xl font-extrabold leading-tight text-white drop-shadow-lg">{place.name}</h1>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-white/90">
              <span className="flex items-center gap-1"><Star className="h-4 w-4 fill-amber-400 text-amber-400"/><span className="font-extrabold">{place.rating}</span><span className="text-white/70">({place.reviewCount.toLocaleString()})</span></span>
              {place.priceLevel != null && <span className="font-bold">{'$'.repeat(Math.max(1, Math.min(4, place.priceLevel)))}</span>}
              <span className={cn('font-bold', place.isOpen ? 'text-emerald-300' : 'text-red-300')}>{place.isOpen ? 'Open' : 'Closed'}</span>
            </div>
          </div>
        </div>
      )}

      {/* ACTION BAR */}
      <div className="relative z-10 -mt-5 mx-4">
        <div className="flex gap-2 rounded-2xl bg-white p-2 shadow-xl">
          <Button className="flex-1 gap-2 rounded-xl font-extrabold bg-[#C4956A] hover:bg-[#B8860B] text-white" size="sm" onClick={handleNavigate}><Navigation className="h-4 w-4"/>Directions</Button>
          {place.phone ? <Button variant="outline" size="sm" className="flex-1 gap-2 rounded-xl font-extrabold border-[#E8D5C4]" onClick={handleCall}><Phone className="h-4 w-4"/>Call</Button>
          : <Button variant="outline" size="sm" className="flex-1 gap-2 rounded-xl font-extrabold border-[#E8D5C4]" disabled><Phone className="h-4 w-4"/>No Phone</Button>}
          <Button variant={isSaved ? 'default' : 'outline'} size="sm" className={cn('gap-2 rounded-xl font-extrabold', isSaved ? 'bg-[#C4956A]' : 'border-[#E8D5C4]')} onClick={handleSave}><Heart className={cn('h-4 w-4', isSaved && 'fill-white')}/></Button>
        </div>
      </div>

      {/* QUICK CHIPS */}
      <div className="mt-4 flex gap-2 overflow-x-auto px-4 no-scrollbar">
        <Chip icon={MapPin} label={place.city} />
        <Chip icon={Clock} label={place.isOpen ? 'Open Now' : 'Closed'} active={place.isOpen} />
        {place.phone && <Chip icon={Phone} label="Call" onClick={handleCall} />}
        {place.website && <Chip icon={Globe} label="Website" href={place.website} />}
      </div>

      {/* TABS */}
      <div className="mt-6 border-b border-[#E8D5C4]">
        <nav className="flex px-4">
          {[{ id: 'info' as const, icon: Info, label: 'Info' }, { id: 'reviews' as const, icon: MessageSquare, label: `Reviews (${place.reviewCount})` }, { id: 'photos' as const, icon: Camera, label: `Photos (${place.photos.length})` }].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={cn('flex items-center gap-1.5 border-b-2 px-4 py-3 text-sm font-extrabold transition-all', activeTab === tab.id ? 'border-[#C4956A] text-[#C4956A]' : 'border-transparent text-[#A08970] hover:text-[#3C2415]')}>
              <tab.icon className="h-4 w-4" /><span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* TAB CONTENT */}
      <div className="px-4 py-5">
        {activeTab === 'info' && (
          <div className="space-y-6">
            {place.description && <section><h2 className="text-lg font-extrabold text-[#3C2415]">About</h2><p className="mt-2 text-sm leading-relaxed text-[#8B7355]">{place.description}</p></section>}
            <section><h2 className="text-lg font-extrabold text-[#3C2415]">Opening Hours</h2><div className="mt-2 rounded-2xl border border-[#E8D5C4] bg-white p-4"><p className="text-sm font-bold text-[#3C2415]">{place.openingHours}</p></div></section>
            {place.amenities && place.amenities.length > 0 && <section><h2 className="text-lg font-extrabold text-[#3C2415]">Amenities</h2><div className="mt-2 flex flex-wrap gap-2">{place.amenities.map((a: string) => <Badge key={a} className="bg-[#F5EDE3] text-[#5C3D2E] text-xs border-0 px-3 py-1 rounded-full">{a}</Badge>)}</div></section>}
            {place.transportOptions && <section><h2 className="text-lg font-extrabold text-[#3C2415]">Getting Here</h2><div className="mt-2 space-y-1.5">{place.transportOptions.map((t: { mode: string; icon: string; duration: number; distance: number; cost: string }, i: number) => (
              <div key={i} className="flex items-center gap-3 rounded-2xl border border-[#E8D5C4] bg-white p-3">
                <span className="text-xl">{t.icon}</span>
                <div className="flex-1"><p className="text-sm font-extrabold text-[#3C2415]">{t.mode}</p><p className="text-xs text-[#8B7355]">{Math.round(t.duration / 60)} min · {t.distance}m</p></div>
                <p className="text-sm font-extrabold text-[#C4956A]">{t.cost}</p>
              </div>
            ))}</div></section>}
            <section><h2 className="text-lg font-extrabold text-[#3C2415]">Address</h2><div className="mt-2 rounded-2xl border border-[#E8D5C4] bg-white p-4"><p className="text-sm font-bold text-[#3C2415]">{place.address}</p><p className="text-xs text-[#8B7355] mt-1">{place.city}</p></div></section>
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="space-y-4">
            {place.reviewSummary && <div className="rounded-2xl border border-[#C4956A]/20 bg-[#FDF0E0]/50 p-4"><div className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-[#C4956A]"/><h3 className="text-sm font-extrabold text-[#3C2415]">AI Review Summary</h3></div><p className="mt-1.5 text-sm text-[#8B7355]">{place.reviewSummary}</p></div>}
            {place.reviews && place.reviews.length > 0 ? place.reviews.map((r: { id: string; userName: string; userInitial: string; rating: number; title: string | null; content: string; createdAt: string; tags: string[] }) => (
              <div key={r.id} className="rounded-2xl border border-[#E8D5C4] bg-white p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#FDF0E0] text-sm font-extrabold text-[#C4956A]">{r.userInitial}</div>
                  <div className="min-w-0 flex-1"><p className="text-sm font-extrabold text-[#3C2415]">{r.userName}</p><p className="text-xs text-[#8B7355]">{r.createdAt}</p></div>
                  <div className="flex gap-0.5">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className={cn('h-3.5 w-3.5', i < r.rating ? 'fill-amber-400 text-amber-400' : 'text-[#D4C4B0]')} />)}</div>
                </div>
                {r.title && <p className="mt-2 text-sm font-extrabold text-[#3C2415]">{r.title}</p>}
                <p className="mt-1 text-sm text-[#8B7355] leading-relaxed">{r.content}</p>
                {r.tags && <div className="mt-2 flex flex-wrap gap-1.5">{r.tags.map((t: string) => <Badge key={t} className="bg-[#F5EDE3] text-[#8B7355] text-[10px] border-0 rounded-full">{t}</Badge>)}</div>}
              </div>
            )) : <p className="py-8 text-center text-sm text-[#8B7355]">No reviews yet. Be the first!</p>}
          </div>
        )}

        {activeTab === 'photos' && (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {place.photos.map((photo: string, i: number) => (
              <button key={i} onClick={() => setSelectedPhoto(photo)} className="group relative aspect-square overflow-hidden rounded-2xl">
                <Image src={photo} alt={`${place.name} ${i + 1}`} fill className="object-cover transition-transform duration-500 group-hover:scale-105" sizes="(max-width: 640px) 50vw, 33vw" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Chip({ icon: Icon, label, active, href, onClick }: { icon: React.ComponentType<{ className?: string }>; label: string; active?: boolean; href?: string; onClick?: () => void }) {
  const c = cn('flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-extrabold transition-colors',
    active === true && 'border-emerald-200 bg-emerald-50 text-emerald-700',
    active === false && 'border-red-200 bg-red-50 text-red-400',
    active === undefined && 'border-[#E8D5C4] bg-white text-[#3C2415] hover:bg-[#FDF0E0]');
  const content = <><Icon className="h-3.5 w-3.5"/><span>{label}</span></>;
  if (href) return <a href={href} target="_blank" rel="noopener noreferrer" className={c}>{content}</a>;
  if (onClick) return <button onClick={onClick} className={c}>{content}</button>;
  return <div className={c}>{content}</div>;
}
