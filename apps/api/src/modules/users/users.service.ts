import { Injectable } from '@nestjs/common';

@Injectable()
export class UsersService {
  private users = new Map<string, any>();

  getProfile(userId: string) {
    if (!this.users.has(userId)) {
      this.users.set(userId, { id: userId, displayName: 'Explorer', email: `${userId}@exploremy.ai`, role: 'USER', level: 1, xp: 0, createdAt: new Date().toISOString() });
    }
    return this.users.get(userId)!;
  }

  updateProfile(userId: string, data: Partial<{ displayName: string; bio: string; homeCity: string; travelStyle: string }>) {
    const profile = this.getProfile(userId);
    Object.assign(profile, data);
    return profile;
  }

  getStats(userId: string) {
    return { followersCount: 0, followingCount: 0, reviewsCount: 0, photosCount: 0, achievementsCount: 0, tripsCount: 0, favoritesCount: 0, hiddenGemsFound: 0, level: 1, xp: 0 };
  }
}
