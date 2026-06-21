export interface PlaceResult {
  id: string;
  googlePlaceId?: string;
  slug: string;
  name: string;
  description?: string;
  category: string;
  subcategory?: string;
  address?: string;
  city?: string;
  state?: string;
  country: string;
  lat: number;
  lng: number;
  phone?: string;
  website?: string;
  priceLevel?: number;
  rating: number;
  reviewCount: number;
  photos: string[];
  openingHours?: string;
  isOpen: boolean;
  isHiddenGem: boolean;
  hiddenGemScore: number;
  isTrending: boolean;
  trendingScore: number;
  amenities?: string[];
  distance?: number;
  transportOptions?: TransportOption[];
}

export interface PlaceDetails extends PlaceResult {
  reviews: ReviewPreview[];
  googleUrl: string;
  types: string[];
  weekdayHours?: string[];
}

export interface TransportOption {
  mode: string;
  icon: string;
  duration: number;
  distance: number;
  cost: string;
}

export interface ReviewPreview {
  author: string;
  rating: number;
  text: string;
  time: string;
}
