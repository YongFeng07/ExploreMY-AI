export interface UserProfile {
  id: string;
  clerkId: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  bio?: string;
  homeCity?: string;
  homeState?: string;
  preferredLanguage: string;
  travelStyle?: string;
  dietaryPreferences?: string[];
  accessibilityNeeds?: string[];
  role: 'USER' | 'VERIFIED_USER' | 'PREMIUM_USER' | 'MODERATOR' | 'ADMIN';
  createdAt: string;
}

export interface UserStats {
  followersCount: number;
  followingCount: number;
  reviewsCount: number;
  photosCount: number;
  achievementsCount: number;
  tripsCount: number;
  favoritesCount: number;
  hiddenGemsFound: number;
  level: number;
  xp: number;
}
