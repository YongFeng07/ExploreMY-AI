import { Injectable } from '@nestjs/common';

export interface FavoriteItem {
  id: string; placeId: string; placeName: string; placeSlug: string;
  category: string; rating: number; photoUrl: string | null;
  notes: string | null; createdAt: string;
}

@Injectable()
export class FavoritesService {
  // In production: PostgreSQL via Prisma. Here: in-memory store.
  private favorites: Map<string, FavoriteItem[]> = new Map();

  getUserFavorites(userId: string): FavoriteItem[] {
    return this.favorites.get(userId) ?? [];
  }

  addFavorite(userId: string, item: Omit<FavoriteItem, 'id' | 'createdAt'>): FavoriteItem {
    const userFavs = this.favorites.get(userId) ?? [];
    const exists = userFavs.find((f) => f.placeId === item.placeId);
    if (exists) return exists;

    const fav: FavoriteItem = {
      ...item,
      id: `fav-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    userFavs.push(fav);
    this.favorites.set(userId, userFavs);
    return fav;
  }

  removeFavorite(userId: string, placeId: string): boolean {
    const userFavs = this.favorites.get(userId);
    if (!userFavs) return false;
    const idx = userFavs.findIndex((f) => f.placeId === placeId);
    if (idx === -1) return false;
    userFavs.splice(idx, 1);
    return true;
  }

  isFavorited(userId: string, placeId: string): boolean {
    return (this.favorites.get(userId) ?? []).some((f) => f.placeId === placeId);
  }

  getCount(userId: string): number {
    return (this.favorites.get(userId) ?? []).length;
  }
}
