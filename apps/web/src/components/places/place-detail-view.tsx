'use client';

import { useState, useEffect } from 'react';
import {
  Star, MapPin, Clock, Phone, Globe, Navigation, Heart, X, ChevronLeft, ChevronRight,
  Share2, ExternalLink, Sparkles, Gem, Camera, Users, DollarSign, Wifi, Car, Utensils,
} from 'lucide-react';
import { cn, formatDistance } from '@/lib/utils';
import { toast } from 'sonner';

const CAT_CONFIG: Record<string, { icon: string; color: string; bg: string }> = {
  restaurant: { icon: '🍜', color: 'text-orange-600', bg: 'bg-orange-50' },
  food: { icon: '🍜', color: 'text-orange-600', bg: 'bg-orange-50' },
  cafe: { icon: '☕', color: 'text-amber-600', bg: 'bg-amber-50' },
  tourist_attraction: { icon: '🏛️', color: 'text-amber-700', bg: 'bg-amber-50' },
  museum: { icon: '🏛️', color: 'text-amber-700', bg: 'bg-amber-50' },
  shopping_mall: { icon: '🛍️', color: 'text-pink-600', bg: 'bg-pink-50' },
  park: { icon: '🌿', color: 'text-emerald-600', bg: 'bg-emerald-50' },
  lodging: { icon: '🏨', color: 'text-blue-600', bg: 'bg-blue-50' },
  hotel: { icon: '🏨', color: 'text-blue-600', bg: 'bg-blue-50' },
  night_club: { icon: '🌙', color: 'text-purple-600', bg: 'bg-purple-50' },
  bar: { icon: '🍸', color: 'text-purple-600', bg: 'bg-purple-50' },
};

interface PlaceDetailViewProps {
  place: any;
  onClose: () => void;
  onDirections?: () => void;
  isFavorited?: boolean;
  onToggleFav?: () => void;
  variant?: 'fullpage' | 'overlay' | 'sheet';
}

export function PlaceDetailView({ place, onClose, isFavorited, onToggleFav }: PlaceDetailViewProps) {
  const [detail, setDetail] = useState<any>(null);
  const [photoIdx, setPhotoIdx] = useState(0);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [fullscreenPhoto, setFullscreenPhoto] = useState(false);

  const placeId = place.id || place.place_id || '';
  const placeName = place.name || place.placeName || 'Unknown Place';

  useEffect(() => {
    setDetail(null); setPhotoIdx(0);
    if (placeId) fetch(`/api/places/${placeId}`).then(r => r.json()).then(j => setDetail(j.data)).catch(() => {});
  }, [placeId]);

  const photos: string[] = detail?.photos?.length >= 5
    ? detail.photos.slice(0, 10)
    : [...(detail?.photos || []), ...(place.photos || []), ...(place.photoUrl ? [place.photoUrl] : []),
        ...Array.from({ length: 10 }, (_, i) => `https://source.unsplash.com/800x600/?${encodeURIComponent(placeName)}+${i}`)].slice(0, 10);

  const rating = detail?.rating || place.rating || 0;
  const reviewCount = detail?.userRatingsTotal || place.reviewCount || 0;
  const address = detail?.address || place.address || place.vicinity || '';
  const phone = detail?.phone || '';
  const website = detail?.website || '';
  const hours = detail?.hours || [];
  const openNow = detail?.openNow;
  const priceLevel = detail?.priceLevel ?? place.priceLevel;
  const reviews = detail?.reviews || [];
  const summary = detail?.summary || '';
  const distance = place.distance;
  const isGem = place.isHiddenGem || (rating >= 4.3 && reviewCount < 100);
  const lat = detail?.lat || place.lat;
  const lng = detail?.lng || place.lng;
  const primaryType = (detail?.types || place.types || [])[0] || '';
  const catStyle = CAT_CONFIG[primaryType] || { icon: '📍', color: 'text-gray-600', bg: 'bg-gray-50' };

  const priceStr = priceLevel != null ? Array(priceLevel + 1).fill('💰').join('') : '';
  const ratingPct = Math.round((rating / 5) * 100);

  const photo = photos[photoIdx];

  const handleCall = () => { if (phone) window.open(`tel:${phone}`); else toast.error('No phone number'); };
  const handleWebsite = () => { if (website) window.open(website, '_blank'); };
  const handleMaps = () => window.open(`https://maps.google.com/?q=${lat},${lng}`, '_blank');
  const handleShare = async () => {
    const url = `https://maps.google.com/?q=${lat},${lng}`;
    if (navigator.share) await navigator.share({ title: placeName, url });
    else { await navigator.clipboard.writeText(url); toast.success('Link copied!'); }
  };

  return (
    <>
      {/* Fullscreen photo viewer */}
      {fullscreenPhoto && (
        <div className="fixed inset-0 z-[9999] bg-black" onClick={() => setFullscreenPhoto(false)}>
          <button onClick={() => setFullscreenPhoto(false)} className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-white z-10 hover:bg-white/30">✕</button>
          <div className="absolute top-4 left-4 bg-black/40 backdrop-blur rounded-full px-3 py-1.5 text-white text-[12px] font-bold">{photoIdx + 1} / {photos.length}</div>
          <img src={photo} className="w-full h-full object-contain" alt={placeName} />
          {photos.length > 1 && (
            <>
              <button onClick={(e) => { e.stopPropagation(); setPhotoIdx(p => p > 0 ? p - 1 : photos.length - 1); }} className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-white hover:bg-white/30"><ChevronLeft className="h-6 w-6" /></button>
              <button onClick={(e) => { e.stopPropagation(); setPhotoIdx(p => p < photos.length - 1 ? p + 1 : 0); }} className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-white hover:bg-white/30"><ChevronRight className="h-6 w-6" /></button>
            </>
          )}
          <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-2">
            {photos.map((_, i) => (
              <button key={i} onClick={(e) => { e.stopPropagation(); setPhotoIdx(i); }}
                className={`rounded-full transition-all ${i === photoIdx ? 'bg-white w-3 h-3' : 'bg-white/40 w-2 h-2'}`} />
            ))}
          </div>
        </div>
      )}

      {/* Bottom sheet */}
      <div className="fixed inset-0 z-[9998] flex items-end bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
        <div className="w-full max-h-[93vh] bg-white rounded-t-[24px] overflow-hidden shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
          {/* Handle */}
          <div className="flex-shrink-0 pt-3 pb-2 flex justify-center bg-white rounded-t-[24px] sticky top-0 z-30">
            <div className="w-10 h-1 rounded-full bg-gray-300"/>
          </div>

          {/* Scrollable content */}
          <div className="overflow-y-auto">
            {/* Photo Gallery */}
            <div className="relative">
              {/* Main photo */}
              <div className="relative h-80 bg-gray-100 cursor-pointer" onClick={() => setFullscreenPhoto(true)}>
                {photos[photoIdx] ? (
                  <img src={photos[photoIdx]} className="w-full h-full object-cover" alt={placeName} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-6xl">{catStyle.icon}</div>
                )}
                <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/30 pointer-events-none" />
              </div>

              {/* Photo strip — 10 thumbnails */}
              <div className="flex gap-1 p-2 bg-white overflow-x-auto">
                {photos.map((p, i) => (
                  <button key={i} onClick={() => setPhotoIdx(i)}
                    className={`flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${i === photoIdx ? 'border-[#3B82F6] scale-105 shadow-md' : 'border-transparent opacity-70 hover:opacity-100'}`}>
                    <img src={p} className="w-full h-full object-cover" alt="" loading="lazy" />
                  </button>
                ))}
              </div>

              {/* Top bar */}
              <div className="absolute top-3 left-3 right-3 flex justify-between items-start">
                <button onClick={onClose} className="w-8 h-8 rounded-full bg-black/40 backdrop-blur flex items-center justify-center text-white">
                  <X className="h-4 w-4" />
                </button>
                <div className="flex gap-2">
                  <button onClick={(e) => { e.stopPropagation(); handleShare(); }} className="w-8 h-8 rounded-full bg-black/40 backdrop-blur flex items-center justify-center text-white">
                    <Share2 className="h-4 w-4" />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); onToggleFav?.(); }}
                    className={`w-8 h-8 rounded-full backdrop-blur flex items-center justify-center ${isFavorited ? 'bg-red-500 text-white' : 'bg-black/40 text-white'}`}>
                    <Heart className="h-4 w-4" fill={isFavorited ? 'white' : 'none'} />
                  </button>
                </div>
              </div>

              {/* Page indicator */}
              {photos.length > 1 && (
                <div className="absolute bottom-14 left-0 right-0 flex justify-center gap-1.5">
                  {photos.map((_, i) => (
                    <div key={i} className={`rounded-full transition-all ${i === photoIdx ? 'bg-white w-4 h-1.5' : 'bg-white/50 w-1.5 h-1.5'}`} />
                  ))}
                </div>
              )}
            </div>

            {/* Info Section */}
            <div className="px-5 pt-4 pb-8 space-y-4">
              {/* Title + Category */}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[11px] font-bold uppercase tracking-wider ${catStyle.bg} ${catStyle.color} rounded-full px-2.5 py-0.5`}>
                    {catStyle.icon} {primaryType.replace(/_/g, ' ')}
                  </span>
                  {isGem && (
                    <span className="text-[11px] font-bold bg-purple-100 text-purple-600 rounded-full px-2.5 py-0.5 flex items-center gap-1">
                      <Gem className="h-3 w-3" /> Hidden Gem
                    </span>
                  )}
                  {openNow !== undefined && (
                    <span className={`text-[11px] font-bold rounded-full px-2.5 py-0.5 ml-auto ${openNow ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-500'}`}>
                      {openNow ? '🟢 Open' : '🔴 Closed'}
                    </span>
                  )}
                </div>
                <h1 className="text-[24px] font-extrabold text-[#0E0E0E] leading-tight">{placeName}</h1>

                {/* Rating bar */}
                {rating > 0 && (
                  <div className="flex items-center gap-3 mt-2">
                    <div className="flex items-center gap-1">
                      <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                      <span className="text-[16px] font-extrabold text-[#0E0E0E]">{rating.toFixed(1)}</span>
                    </div>
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden max-w-[120px]">
                      <div className="h-full bg-amber-400 rounded-full" style={{ width: `${ratingPct}%` }} />
                    </div>
                    {reviewCount > 0 && <span className="text-[12px] text-gray-400">({reviewCount.toLocaleString()})</span>}
                    {priceStr && <span className="text-[12px] ml-auto">{priceStr}</span>}
                  </div>
                )}
              </div>

              {/* Editorial summary */}
              {summary && (
                <p className="text-[13px] text-gray-500 leading-relaxed italic border-l-2 border-amber-300 pl-3">{summary}</p>
              )}

              {/* Distance + Address */}
              <div className="flex items-start gap-3 bg-gray-50 rounded-2xl p-4">
                <div className={`w-10 h-10 rounded-xl ${catStyle.bg} flex items-center justify-center text-lg flex-shrink-0`}>{catStyle.icon}</div>
                <div className="flex-1 min-w-0">
                  {distance != null && <p className="text-[14px] font-extrabold text-[#0E0E0E]">{formatDistance(distance)} from you</p>}
                  <p className="text-[12px] text-gray-500 truncate">{address || 'Address unavailable'}</p>
                  <button onClick={handleMaps} className="text-[12px] font-bold text-[#3B82F6] mt-1 flex items-center gap-1">
                    <Navigation className="h-3 w-3" /> Open in Google Maps
                  </button>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-3 gap-2">
                <button onClick={handleMaps} className="flex flex-col items-center gap-1 py-3 rounded-2xl bg-[#0E0E0E] text-white">
                  <Navigation className="h-5 w-5" /><span className="text-[11px] font-bold">Directions</span>
                </button>
                {phone ? (
                  <button onClick={handleCall} className="flex flex-col items-center gap-1 py-3 rounded-2xl bg-green-500 text-white">
                    <Phone className="h-5 w-5" /><span className="text-[11px] font-bold">Call</span>
                  </button>
                ) : (
                  <button onClick={handleShare} className="flex flex-col items-center gap-1 py-3 rounded-2xl bg-gray-100 text-gray-700">
                    <Share2 className="h-5 w-5" /><span className="text-[11px] font-bold">Share</span>
                  </button>
                )}
                {website ? (
                  <button onClick={handleWebsite} className="flex flex-col items-center gap-1 py-3 rounded-2xl bg-blue-500 text-white">
                    <Globe className="h-5 w-5" /><span className="text-[11px] font-bold">Website</span>
                  </button>
                ) : (
                  <button onClick={() => onToggleFav?.()} className={`flex flex-col items-center gap-1 py-3 rounded-2xl ${isFavorited ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-700'}`}>
                    <Heart className="h-5 w-5" fill={isFavorited ? 'white' : 'none'} /><span className="text-[11px] font-bold">Save</span>
                  </button>
                )}
              </div>

              {/* Opening Hours */}
              {hours.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 p-4">
                  <h3 className="text-[12px] font-extrabold text-[#0E0E0E] flex items-center gap-2 mb-3">
                    <Clock className="h-4 w-4 text-gray-400" /> Opening Hours
                  </h3>
                  <div className="space-y-1.5">
                    {hours.map((h: string, i: number) => {
                      const [day, time] = h.split(': ');
                      const isToday = time?.toLowerCase().includes('open') || h.toLowerCase().includes('today');
                      return (
                        <div key={i} className={`flex justify-between text-[12px] py-1 px-2 rounded-lg ${isToday ? 'bg-green-50 font-bold' : ''}`}>
                          <span className="text-gray-500 w-24">{day}</span>
                          <span className={isToday ? 'text-green-700 font-extrabold' : 'text-gray-700 font-semibold'}>{time || h}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Reviews */}
              {reviews.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-[12px] font-extrabold text-[#0E0E0E]">Reviews ({reviews.length})</h3>
                    <button onClick={() => setShowAllReviews(!showAllReviews)} className="text-[11px] font-bold text-[#3B82F6]">
                      {showAllReviews ? 'Show less' : `See all`}
                    </button>
                  </div>
                  <div className="space-y-3">
                    {(showAllReviews ? reviews : reviews.slice(0, 3)).map((r: any, i: number) => (
                      <div key={i} className="pb-3 border-b border-gray-50 last:border-0 last:pb-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <img src={r.avatar || `https://ui-avatars.com/api/?name=${r.author || 'U'}&background=random&size=28`} className="w-7 h-7 rounded-full" alt="" />
                          <span className="text-[12px] font-extrabold text-[#0E0E0E]">{r.author || 'User'}</span>
                          <div className="flex gap-0.5 ml-1">
                            {Array.from({ length: 5 }, (_, j) => (
                              <Star key={j} className={`h-3 w-3 ${j < Math.round(r.rating || 0) ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`} />
                            ))}
                          </div>
                          <span className="text-[10px] text-gray-400 ml-auto">{r.time || ''}</span>
                        </div>
                        <p className="text-[12px] text-gray-600 leading-relaxed">{r.text?.substring(0, 250)}{r.text?.length > 250 ? '...' : ''}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Types */}
              {((detail?.types || place.types || [])).length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {(detail?.types || place.types || []).slice(0, 8).map((t: string) => (
                    <span key={t} className="text-[10px] font-medium bg-gray-100 text-gray-500 rounded-full px-3 py-1 capitalize">
                      {t.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
