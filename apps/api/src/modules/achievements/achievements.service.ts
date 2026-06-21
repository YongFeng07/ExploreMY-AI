import { Injectable } from '@nestjs/common';

export interface Achievement {
  id: string;
  emoji: string;
  name: string;
  description: string;
  category: string;
  goal: number;
  xp: number;
}

const ALL_ACHIEVEMENTS: Achievement[] = [
  // ── Trips ──
  { id: 'first_trip', emoji: '🌍', name: 'First Adventure', description: 'Complete your first trip', category: 'trips', goal: 1, xp: 50 },
  { id: 'trip_3', emoji: '🧭', name: 'Explorer', description: 'Complete 3 trips', category: 'trips', goal: 3, xp: 100 },
  { id: 'trip_5', emoji: '🗺️', name: 'Voyager', description: 'Complete 5 trips', category: 'trips', goal: 5, xp: 200 },
  { id: 'trip_10', emoji: '✈️', name: 'Globe Trotter', description: 'Complete 10 trips', category: 'trips', goal: 10, xp: 500 },

  // ── Cities ──
  { id: 'city_1', emoji: '🏙️', name: 'City Slicker', description: 'Visit your first city', category: 'cities', goal: 1, xp: 25 },
  { id: 'city_3', emoji: '🌆', name: 'Urban Explorer', description: 'Visit 3 different cities', category: 'cities', goal: 3, xp: 75 },
  { id: 'city_5', emoji: '🏛️', name: 'State Hopper', description: 'Visit 5 different cities', category: 'cities', goal: 5, xp: 150 },
  { id: 'city_10', emoji: '🇲🇾', name: 'Malaysia Expert', description: 'Visit 10 different cities', category: 'cities', goal: 10, xp: 300 },

  // ── Photos ──
  { id: 'photo_1', emoji: '📸', name: 'Memory Maker', description: 'Upload your first photo', category: 'photos', goal: 1, xp: 25 },
  { id: 'photo_5', emoji: '📷', name: 'Photographer', description: 'Upload 5 photos', category: 'photos', goal: 5, xp: 75 },
  { id: 'photo_10', emoji: '🎞️', name: 'Photo Pro', description: 'Upload 10 photos', category: 'photos', goal: 10, xp: 150 },
  { id: 'photo_25', emoji: '🏆', name: 'Visual Storyteller', description: 'Upload 25 photos', category: 'photos', goal: 25, xp: 300 },

  // ── Journals ──
  { id: 'journal_1', emoji: '📝', name: 'Dear Diary', description: 'Write your first journal', category: 'journals', goal: 1, xp: 25 },
  { id: 'journal_3', emoji: '📖', name: 'Journalist', description: 'Write 3 journal entries', category: 'journals', goal: 3, xp: 75 },
  { id: 'journal_5', emoji: '✍️', name: 'Storyteller', description: 'Write 5 journal entries', category: 'journals', goal: 5, xp: 150 },
  { id: 'journal_10', emoji: '📚', name: 'Travel Author', description: 'Write 10 journal entries', category: 'journals', goal: 10, xp: 300 },

  // ── Favorites ──
  { id: 'fav_1', emoji: '❤️', name: 'First Love', description: 'Save your first favorite place', category: 'favorites', goal: 1, xp: 25 },
  { id: 'fav_5', emoji: '💛', name: 'Collector', description: 'Save 5 favorite places', category: 'favorites', goal: 5, xp: 75 },
  { id: 'fav_10', emoji: '💚', name: 'Curator', description: 'Save 10 favorite places', category: 'favorites', goal: 10, xp: 150 },

  // ── Reviews ──
  { id: 'review_1', emoji: '⭐', name: 'Critic', description: 'Write your first review', category: 'reviews', goal: 1, xp: 25 },
  { id: 'review_3', emoji: '🌟', name: 'Food Critic', description: 'Write 3 reviews', category: 'reviews', goal: 3, xp: 75 },
  { id: 'review_5', emoji: '💫', name: 'Top Reviewer', description: 'Write 5 reviews', category: 'reviews', goal: 5, xp: 150 },

  // ── Couple ──
  { id: 'couple_link', emoji: '💑', name: 'Better Together', description: 'Link with your partner', category: 'couple', goal: 1, xp: 100 },
  { id: 'couple_trip', emoji: '💕', name: 'Couple Getaway', description: 'Complete a trip with your partner', category: 'couple', goal: 1, xp: 200 },

  // ── Wallet / Savings ──
  { id: 'save_100', emoji: '🐷', name: 'Saver', description: 'Save RM 100 towards a trip', category: 'wallet', goal: 100, xp: 50 },
  { id: 'save_500', emoji: '💰', name: 'Goal Getter', description: 'Save RM 500 towards a trip', category: 'wallet', goal: 500, xp: 150 },
  { id: 'save_1000', emoji: '🏦', name: 'Dream Saver', description: 'Save RM 1,000 towards a trip', category: 'wallet', goal: 1000, xp: 300 },
  { id: 'save_done', emoji: '🎯', name: 'Goal Achieved', description: 'Fully fund a trip goal', category: 'wallet', goal: 1, xp: 500 },

  // ── Wishlist ──
  { id: 'wish_1', emoji: '🎯', name: 'Dreamer', description: 'Add to your wishlist', category: 'wishlist', goal: 1, xp: 10 },
  { id: 'wish_5', emoji: '🌟', name: 'Big Dreamer', description: 'Add 5 destinations to wishlist', category: 'wishlist', goal: 5, xp: 50 },

  // ── Albums ──
  { id: 'album_1', emoji: '📸', name: 'Album Creator', description: 'Create your first album', category: 'albums', goal: 1, xp: 25 },
  { id: 'album_3', emoji: '🖼️', name: 'Memory Keeper', description: 'Create 3 photo albums', category: 'albums', goal: 3, xp: 75 },
];

@Injectable()
export class AchievementsService {
  /**
   * Get achievements for a user with REAL progress calculated from user data.
   * No Math.random(). Every achievement is tied to actual user activity.
   */
  getForUser(user: any) {
    if (!user) return [];

    const stats = {
      trips: (user.travelHistory || []).length,
      cities: (user.visitedCities || []).length,
      photos: (user.myPhotos || []).length,
      journals: (user.journals || []).length,
      favorites: (user.favorites || []).length,
      reviews: (user.reviews || []).length,
      albums: (user.albums || []).length,
      wishlist: (user.wishlist || []).length,
      coupleLinked: !!user.couplePartnerId,
      coupleTrips: 0, // computed below if couple is linked
      walletSaved: 0,  // computed below from wallet data
      walletGoalsCompleted: 0,
    };

    // Compute couple trip count
    if (user.couplePartnerId) {
      const partner = (global as any).__authUsers?.find((u: any) => u.id === user.couplePartnerId);
      if (partner) {
        const coupleHistory = [
          ...(user.travelHistory || []),
          ...(partner.travelHistory || []),
        ];
        stats.coupleTrips = coupleHistory.filter(
          (t: any, i: number, arr: any[]) =>
            arr.findIndex((x: any) => x.city === t.city && x.date === t.date) === i
        ).length;
      }
    }

    // Compute wallet savings from global wallet data
    const walletGoals = (global as any).__walletGoals || [];
    const userGoals = walletGoals.filter((g: any) => g.userId === user.id);
    stats.walletSaved = userGoals.reduce((sum: number, g: any) => sum + (g.currentAmount || 0), 0);
    stats.walletGoalsCompleted = userGoals.filter(
      (g: any) => (g.currentAmount || 0) >= (g.targetAmount || 0)
    ).length;

    return ALL_ACHIEVEMENTS.map((a) => {
      const current = this.getStatValue(stats, a);
      const unlocked = current >= a.goal;
      const progress = Math.min(1, current / a.goal);

      return {
        id: a.id,
        emoji: a.emoji,
        name: a.name,
        description: a.description,
        category: a.category,
        goal: a.goal,
        current: Math.min(current, a.goal),
        progress,
        unlocked,
        xp: a.xp,
        criteria: `${a.description} (${Math.min(current, a.goal)}/${a.goal})`,
      };
    });
  }

  getAllAvailable() {
    return ALL_ACHIEVEMENTS;
  }

  /**
   * Get aggregate achievement stats for a user
   */
  getStats(user: any) {
    const achievements = this.getForUser(user);
    const unlocked = achievements.filter((a) => a.unlocked).length;
    const total = achievements.length;
    const totalXp = achievements.filter((a) => a.unlocked).reduce((s, a) => s + a.xp, 0);
    const byCategory: Record<string, { unlocked: number; total: number }> = {};

    for (const a of achievements) {
      if (!byCategory[a.category]) byCategory[a.category] = { unlocked: 0, total: 0 };
      byCategory[a.category].total++;
      if (a.unlocked) byCategory[a.category].unlocked++;
    }

    return {
      unlocked,
      total,
      totalXp,
      progress: total > 0 ? Math.round((unlocked / total) * 100) : 0,
      byCategory,
      achievements,
    };
  }

  private getStatValue(stats: any, achievement: Achievement): number {
    switch (achievement.category) {
      case 'trips':     return stats.trips;
      case 'cities':    return stats.cities;
      case 'photos':    return stats.photos;
      case 'journals':  return stats.journals;
      case 'favorites': return stats.favorites;
      case 'reviews':   return stats.reviews;
      case 'albums':    return stats.albums;
      case 'wishlist':  return stats.wishlist;
      case 'couple': {
        if (achievement.id === 'couple_link') return stats.coupleLinked ? 1 : 0;
        if (achievement.id === 'couple_trip') return stats.coupleTrips;
        return 0;
      }
      case 'wallet': {
        if (achievement.id === 'save_done') return stats.walletGoalsCompleted;
        return stats.walletSaved;
      }
      default: return 0;
    }
  }
}
