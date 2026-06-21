'use client';

import { useState, useEffect } from 'react';
import {
  Star, MapPin, Clock, Phone, Globe, Navigation, Heart, X, ChevronLeft, ChevronRight,
  Share2, MessageCircle, Coffee, Utensils, ShoppingBag, Landmark, Hotel,
  ExternalLink, Sparkles, Flame, Gem, Camera, ImageIcon,
} from 'lucide-react';
import { cn, formatDistance } from '@/lib/utils';
import { toast } from 'sonner';

const API = 'http://127.0.0.1:3001/api/v1';

interface Place {
  id?: string; place_id?: string; slug?: string; name?: string; placeName?: string;
  category?: string; rating?: number; reviewCount?: number; distance?: number;
  priceLevel?: number | null; photos?: string[]; photoUrl?: string;
  address?: string; vicinity?: string; city?: string;
  isOpen?: boolean; isHiddenGem?: boolean; isTrending?: boolean;
  lat?: number; lng?: number; openingHours?: string;
}

interface PlaceDetailViewProps {
  place: Place;
  onClose: () => void;
  onDirections?: () => void;
  isFavorited?: boolean;
  onToggleFav?: () => void;
  variant?: 'fullpage' | 'overlay' | 'sheet';
}

const catIcon = (c: string) =>
  c === 'FOOD' ? '🍜' : c === 'CAFE' ? '☕' : c === 'SHOPPING_MALL' ? '🛍️' : c === 'HOTEL' ? '🏨' : c === 'NATURE' ? '🌿' : c === 'BEACH' ? '🏖️' : '📍';

/** Real Unsplash travel photos — stable curated IDs for Malaysian destinations */
const UNSPLASH_TRAVEL = [
  'photo-1596422846543-75c6fc197f07', // Malaysian temple architecture
  'photo-1555400038-63f5ba517a47', // Tropical island beach
  'photo-1505993598-4e0a6a6a6c4e', // KL skyline cityscape
  'photo-1537996194471-e657f9e339cd', // Street food market
  'photo-1518548419970-58e3b4079ab2', // Nature waterfall
  'photo-1548013146-72479768bada', // Heritage building
  'photo-1583417319070-4a69db38a482', // Night market lights
  'photo-1507525428034-b723cf961d3e', // Beautiful beach
  'photo-1544735716-392fe2489ffa', // Mountain viewpoint
  'photo-1566438480900-0609be27a4be', // Tea plantation
  'photo-1566073771259-6a8506099945', // Resort pool
  'photo-1571896349842-33c89424de2d', // Luxury hotel
];

function fallbackPhotos(count = 10): string[] {
  return UNSPLASH_TRAVEL.slice(0, count).map(id =>
    `https://images.unsplash.com/${id}?w=800&h=600&fit=crop&q=80`
  );
}

export function PlaceDetailView({ place, onClose, onDirections, isFavorited, onToggleFav, variant = 'fullpage' }: PlaceDetailViewProps) {
  const [detailFull, setDetailFull] = useState<any>(null);
  const [photoIdx, setPhotoIdx] = useState(0);
  const [showAllReviews, setShowAllReviews] = useState(false);

  const placeId = place.id || place.place_id || '';
  const placeName = place.name || place.placeName || 'Unknown Place';

  useEffect(() => {
    setDetailFull(null); setPhotoIdx(0);
    if (placeId) {
      fetch(`${API}/places/details/${placeId}`).then(r => r.json()).then(j => setDetailFull(j.data)).catch(() => {});
    }
  }, [placeId]);

  // ── Build 10-photo gallery ──
  const apiPhotos: string[] = detailFull?.photos || place.photos || [];
  const singlePhoto = place.photoUrl || '';
  const allPhotos: string[] = apiPhotos.length >= 5
    ? apiPhotos.slice(0, 10)
    : [...apiPhotos, ...(singlePhoto ? [singlePhoto] : []), ...fallbackPhotos(10)].slice(0, 10);

  const showCarousel = allPhotos.length > 1;

  const handleCall = () => { if (detailFull?.phone) window.open(`tel:${detailFull.phone}`); else toast.error('No phone available'); };
  const handleWebsite = () => { if (detailFull?.website) window.open(detailFull.website, '_blank'); };
  const handleGoogleMaps = () => {
    const url = detailFull?.googleUrl || `https://maps.google.com/?q=${place.lat || detailFull?.lat},${place.lng || detailFull?.lng}`;
    window.open(url, '_blank');
  };
  const handleShare = async () => {
    const url = detailFull?.googleUrl || `https://maps.google.com/?q=${place.lat || 3.139},${place.lng || 101.6869}`;
    if (navigator.share) await navigator.share({ title: placeName, url });
    else { await navigator.clipboard.writeText(url); toast.success('Link copied!'); }
  };

  const rating = place.rating || detailFull?.rating || 0;
  const reviewCount = place.reviewCount || detailFull?.reviewCount || 0;
  const address = detailFull?.address || place.address || place.vicinity || '';
  const hours = detailFull?.openingHours || place.openingHours || '';
  const isOpen = place.isOpen ?? detailFull?.isOpen ?? true;
  const isGem = place.isHiddenGem || detailFull?.isHiddenGem || false;
  const isTrend = place.isTrending || detailFull?.isTrending || false;
  const priceLevel = place.priceLevel ?? detailFull?.priceLevel ?? null;
  const distance = place.distance ?? null;
  const reviews = detailFull?.reviews || [];

  const Wrapper = variant === 'overlay' ? 'div' : 'div';

  return (
    <div className={cn(
      variant === 'overlay' ? 'fixed inset-0 z-[9999] flex flex-col bg-black/60 backdrop-blur-sm animate-fade-in' :
      variant === 'sheet' ? '' :
      'min-h-dvh bg-[#FFFDF7]'
    )} onClick={variant === 'overlay' ? onClose : undefined}>
      <div className={cn('flex flex-col',
        variant === 'overlay' ? 'mt-auto max-h-[92vh] rounded-t-3xl bg-white shadow-2xl animate-slide-up overflow-y-auto' :
        variant === 'sheet' ? 'bg-white' :
        'flex-1'
      )} onClick={e => e.stopPropagation()}>

        {/* ═══════════════════════════════════════════════════════════════
            PHOTO GALLERY — 10 photos with carousel
            ═══════════════════════════════════════════════════════════════ */}
        <div className="relative h-72 w-full shrink-0 overflow-hidden bg-[#F5EDE3] sm:h-80">
          {allPhotos.length > 0 ? (
            <>
              <img src={allPhotos[photoIdx]} alt={placeName}
                className="h-full w-full object-cover transition-all duration-500"
                onError={e => {
                  // Try next photo on error
                  if (photoIdx < allPhotos.length - 1) setPhotoIdx(photoIdx + 1);
                }} />
              {showCarousel && (
                <>
                  <button onClick={() => setPhotoIdx(p => p === 0 ? allPhotos.length - 1 : p - 1)}
                    className="absolute left-3 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-[#3C2415] shadow-lg backdrop-blur hover:bg-white active:scale-90 transition-all">
                    <ChevronLeft className="h-5 w-5" /></button>
                  <button onClick={() => setPhotoIdx(p => p === allPhotos.length - 1 ? 0 : p + 1)}
                    className="absolute right-3 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-[#3C2415] shadow-lg backdrop-blur hover:bg-white active:scale-90 transition-all">
                    <ChevronRight className="h-5 w-5" /></button>
                  <div className="absolute right-4 top-4 z-20 rounded-full bg-black/40 px-3 py-1 text-xs font-bold text-white backdrop-blur">
                    <Camera className="h-3 w-3 inline mr-1" />{photoIdx + 1} / {allPhotos.length}
                  </div>
                  {/* Dot indicators */}
                  <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5 z-20">
                    {allPhotos.map((_: any, i: number) => (
                      <button key={i} onClick={() => setPhotoIdx(i)}
                        className={cn('h-1.5 rounded-full transition-all duration-300',
                          i === photoIdx ? 'w-6 bg-white' : 'w-1.5 bg-white/50 hover:bg-white/80')} />
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="flex h-full w-full items-center justify-center text-7xl">{catIcon(place.category || '')}</div>
          )}
          {/* Gradient overlay for readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-black/10 pointer-events-none" />

          {/* Close + Share buttons */}
          <button onClick={onClose}
            className="absolute left-4 top-4 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur hover:bg-black/40">
            <X className="h-5 w-5" /></button>
          <button onClick={handleShare}
            className="absolute right-4 top-4 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur hover:bg-black/40">
            <Share2 className="h-5 w-5" /></button>

          {/* Title overlay on photo */}
          <div className="absolute bottom-0 left-0 right-0 p-4 pointer-events-none">
            <div className="flex flex-wrap gap-1.5 mb-1.5">
              {isTrend && <span className="inline-flex items-center gap-1 rounded-full bg-amber-500 px-2.5 py-0.5 text-[10px] font-extrabold text-white shadow"><Flame className="h-2.5 w-2.5" />Trending</span>}
              {isGem && <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500 px-2.5 py-0.5 text-[10px] font-extrabold text-white shadow"><Gem className="h-2.5 w-2.5" />Hidden Gem</span>}
              <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-extrabold text-white shadow', isOpen ? 'bg-emerald-500' : 'bg-red-500')}>
                {isOpen ? '🟢 Open Now' : '🔴 Closed'}
              </span>
            </div>
            <h1 className="text-2xl font-extrabold leading-tight text-white drop-shadow-lg sm:text-3xl">{placeName}</h1>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-white/90">
              {rating > 0 && (
                <span className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  <span className="font-extrabold">{rating.toFixed(1)}</span>
                  {reviewCount > 0 && <span className="text-white/70">({reviewCount.toLocaleString()} reviews)</span>}
                </span>
              )}
              {distance && <><span className="text-white/40">·</span><span>{formatDistance(distance)}</span></>}
              {priceLevel != null && <><span className="text-white/40">·</span><span className="font-bold">{'💰'.repeat(Math.max(1, Math.min(4, priceLevel)))}</span></>}
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            PHOTO THUMBNAIL STRIP — quick access to all 10 photos
            ═══════════════════════════════════════════════════════════════ */}
        {allPhotos.length > 1 && (
          <div className="flex gap-1.5 px-4 py-2 overflow-x-auto no-scrollbar bg-white border-b border-[#E8D5C4]/50">
            {allPhotos.map((photo: string, i: number) => (
              <button key={i} onClick={() => setPhotoIdx(i)}
                className={cn(
                  'flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all',
                  i === photoIdx ? 'border-[#C4956A] ring-2 ring-[#C4956A]/20' : 'border-transparent opacity-60 hover:opacity-100'
                )}>
                <img src={photo} alt="" className="w-full h-full object-cover"
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              </button>
            ))}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            QUICK ACTIONS
            ═══════════════════════════════════════════════════════════════ */}
        <div className="flex gap-2 px-4 py-3">
          <button onClick={onDirections || handleGoogleMaps}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#C4956A] py-3 text-sm font-extrabold text-white shadow-lg shadow-[#C4956A]/25 hover:bg-[#B8860B] transition-all active:scale-95">
            <Navigation className="h-4 w-4" />Directions
          </button>
          {detailFull?.phone && (
            <button onClick={handleCall}
              className="flex items-center justify-center gap-2 rounded-2xl border border-[#E8D5C4] bg-white px-4 py-3 text-sm font-extrabold text-[#3C2415] shadow-sm hover:bg-[#FDF0E0] transition-all active:scale-95">
              <Phone className="h-4 w-4" />Call
            </button>
          )}
          {onToggleFav && (
            <button onClick={onToggleFav}
              className={cn('flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-extrabold shadow-sm transition-all active:scale-95',
                isFavorited ? 'border-red-200 bg-red-50 text-red-500' : 'border-[#E8D5C4] bg-white text-[#3C2415] hover:bg-[#FDF0E0]')}>
              <Heart className={cn('h-4 w-4', isFavorited && 'fill-red-400 text-red-400')} />
            </button>
          )}
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            INFORMATION CARDS
            ═══════════════════════════════════════════════════════════════ */}
        <div className="space-y-4 px-4 pb-8">
          {/* Address */}
          {address && <InfoCard icon={<MapPin className="h-5 w-5 text-[#C4956A]" />} title="Address" content={address} />}

          {/* Hours */}
          {hours && <InfoCard icon={<Clock className="h-5 w-5 text-[#C4956A]" />} title="Opening Hours" content={hours} />}

          {/* Quick Links */}
          {detailFull && (
            <div className="flex gap-2 flex-wrap">
              {detailFull.phone && <QuickLink icon={<Phone className="h-4 w-4" />} label="Call" onClick={handleCall} />}
              {detailFull.website && <QuickLink icon={<Globe className="h-4 w-4" />} label="Website" onClick={handleWebsite} />}
              <QuickLink icon={<ExternalLink className="h-4 w-4" />} label="Google Maps" onClick={handleGoogleMaps} />
              <QuickLink icon={<Share2 className="h-4 w-4" />} label="Share" onClick={handleShare} />
            </div>
          )}

          {/* Transport Options */}
          {distance != null && (
            <div>
              <h3 className="text-sm font-extrabold text-[#3C2415] mb-2">🚗 Getting There</h3>
              <div className="space-y-1.5">
                {[
                  { icon: '🚶', mode: 'Walking', time: Math.round(distance / 83), cost: 'Free', eco: '🟢' },
                  { icon: '🚕', mode: 'Grab', time: Math.round(distance / 400 + 3), cost: `RM ${Math.round(5 + (distance / 1000) * 1.5)}`, eco: '🟡' },
                  { icon: '🚗', mode: 'Driving', time: Math.round(distance / 500), cost: `~RM ${Math.round((distance / 1000) * 0.4)} fuel`, eco: '🟠' },
                ].map((t, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-xl border border-[#E8D5C4] bg-white p-3">
                    <span className="text-xl">{t.icon}</span>
                    <div className="flex-1"><p className="text-sm font-bold text-[#3C2415]">{t.mode}</p><p className="text-xs text-[#8B7355]">{t.time} min · {t.cost} · {t.eco}</p></div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Google Reviews */}
          {reviews.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-extrabold text-[#3C2415] flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-[#C4956A]" />Reviews
                </h3>
                {reviews.length > 3 && (
                  <button onClick={() => setShowAllReviews(!showAllReviews)}
                    className="text-xs font-bold text-[#C4956A]">{showAllReviews ? 'Show Less' : `See All ${reviews.length}`}</button>
                )}
              </div>
              <div className="space-y-2">
                {(showAllReviews ? reviews : reviews.slice(0, 3)).map((r: any, i: number) => (
                  <div key={i} className="rounded-xl border border-[#E8D5C4] bg-white p-3.5">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FDF0E0] text-xs font-extrabold text-[#C4956A]">{r.author?.[0] || '?'}</div>
                      <span className="text-sm font-extrabold text-[#3C2415]">{r.author}</span>
                      <span className="text-xs text-[#A08970]">{r.time}</span>
                      <div className="ml-auto flex gap-0.5">
                        {[...Array(5)].map((_, j) => <Star key={j} className={cn('h-3 w-3', j < (r.rating || 0) ? 'fill-amber-400 text-amber-400' : 'text-[#D4C4B0]')} />)}
                      </div>
                    </div>
                    <p className="text-sm text-[#8B7355] mt-2 leading-relaxed">{r.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Insight */}
          <div className="rounded-2xl border border-[#C4956A]/20 bg-gradient-to-r from-[#FFFDF7] to-[#FDF0E0] p-4">
            <div className="flex items-center gap-2 mb-1.5">
              <Sparkles className="h-4 w-4 text-[#C4956A]" /><span className="text-xs font-extrabold text-[#8B6914]">AI INSIGHT</span>
            </div>
            <p className="text-sm text-[#8B7355] leading-relaxed">
              {rating > 0 ? (
                <>Rated <strong className="text-[#3C2415]">{rating.toFixed(1)}</strong> by <strong className="text-[#3C2415]">{reviewCount.toLocaleString()}</strong> reviewers. </>
              ) : 'No ratings yet. '}
              {isOpen ? 'Currently open. ' : 'Currently closed. '}
              {isGem ? 'This is a hidden gem — less touristy, highly rated by locals. ' : ''}
              {isTrend ? 'Trending right now — popular with explorers. ' : ''}
              {detailFull?.phone ? `Contact: ${detailFull.phone}.` : ''}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Sub-components ── */

function InfoCard({ icon, title, content }: { icon: React.ReactNode; title: string; content: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FDF0E0]">{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-extrabold text-[#8B7355] uppercase tracking-wider mb-0.5">{title}</p>
        <p className="text-sm font-bold text-[#3C2415] leading-relaxed">{content}</p>
      </div>
    </div>
  );
}

function QuickLink({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#FDF0E0] py-2.5 text-xs font-extrabold text-[#8B6914] hover:bg-[#F5EDE3] transition-colors">
      {icon}{label}
    </button>
  );
}
