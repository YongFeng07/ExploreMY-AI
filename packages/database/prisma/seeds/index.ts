import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding ExploreMY database...\n');

  // ═════════════════════════════════════════════════════════════════════════════
  // USERS
  // ═════════════════════════════════════════════════════════════════════════════
  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: 'demo@exploremy.ai' },
      update: {},
      create: {
        email: 'demo@exploremy.ai',
        displayName: 'Demo Explorer',
        homeCity: 'Kuala Lumpur',
        preferredLanguage: 'en',
        role: 'USER',
        isVerified: true,
        profile: { create: { level: 5, xp: 420 } },
      },
    }),
    prisma.user.upsert({
      where: { email: 'admin@exploremy.ai' },
      update: {},
      create: {
        email: 'admin@exploremy.ai',
        displayName: 'Admin User',
        homeCity: 'Kuala Lumpur',
        preferredLanguage: 'en',
        role: 'ADMIN',
        isVerified: true,
        profile: { create: { level: 10, xp: 1000 } },
      },
    }),
    prisma.user.upsert({
      where: { email: 'traveler@exploremy.ai' },
      update: {},
      create: {
        email: 'traveler@exploremy.ai',
        displayName: 'World Traveler',
        homeCity: 'George Town',
        preferredLanguage: 'en',
        role: 'PREMIUM_USER',
        isVerified: true,
        profile: { create: { level: 8, xp: 850 } },
      },
    }),
  ]);
  console.log(`✅ ${users.length} users created`);

  // ═════════════════════════════════════════════════════════════════════════════
  // PLACES (Comprehensive Malaysia travel destinations)
  // ═════════════════════════════════════════════════════════════════════════════
  const placesData = [
    // Kuala Lumpur
    { name: 'Petronas Twin Towers', category: 'ATTRACTION', city: 'Kuala Lumpur', lat: 3.1579, lng: 101.7118, rating: 4.7, reviewCount: 52481, priceLevel: 3, isHiddenGem: false, isTrending: true },
    { name: 'Batu Caves', category: 'TEMPLE', city: 'Kuala Lumpur', lat: 3.2374, lng: 101.6839, rating: 4.5, reviewCount: 31892, priceLevel: 1, isHiddenGem: false, isTrending: false },
    { name: 'Jalan Alor Food Street', category: 'STREET_FOOD', city: 'Kuala Lumpur', lat: 3.1459, lng: 101.7085, rating: 4.3, reviewCount: 12750, priceLevel: 1, isHiddenGem: false, isTrending: true },
    { name: 'KLCC Park', category: 'PARK', city: 'Kuala Lumpur', lat: 3.1570, lng: 101.7130, rating: 4.5, reviewCount: 8934, priceLevel: 0, isHiddenGem: false, isTrending: false },
    { name: 'Central Market', category: 'MARKET', city: 'Kuala Lumpur', lat: 3.1456, lng: 101.6956, rating: 4.3, reviewCount: 15672, priceLevel: 1, isHiddenGem: true, isTrending: false },
    { name: 'Thean Hou Temple', category: 'TEMPLE', city: 'Kuala Lumpur', lat: 3.1219, lng: 101.6956, rating: 4.6, reviewCount: 6543, priceLevel: 0, isHiddenGem: true, isTrending: false },

    // Penang
    { name: 'Kek Lok Si Temple', category: 'TEMPLE', city: 'George Town', lat: 5.3990, lng: 100.2738, rating: 4.6, reviewCount: 21340, priceLevel: 1, isHiddenGem: false, isTrending: false },
    { name: 'Penang Hill', category: 'ATTRACTION', city: 'George Town', lat: 5.4244, lng: 100.2694, rating: 4.5, reviewCount: 15670, priceLevel: 2, isHiddenGem: false, isTrending: true },
    { name: 'Nasi Kandar Line Clear', category: 'RESTAURANT', city: 'George Town', lat: 5.4178, lng: 100.3312, rating: 4.1, reviewCount: 8923, priceLevel: 1, isHiddenGem: true, isTrending: false },
    { name: 'Chew Jetty', category: 'VIEWPOINT', city: 'George Town', lat: 5.4120, lng: 100.3393, rating: 4.2, reviewCount: 7654, priceLevel: 0, isHiddenGem: true, isTrending: false },
    { name: 'Penang Street Art', category: 'ATTRACTION', city: 'George Town', lat: 5.4149, lng: 100.3360, rating: 4.5, reviewCount: 18654, priceLevel: 0, isHiddenGem: false, isTrending: true },

    // Malacca
    { name: 'Jonker Street', category: 'NIGHT_MARKET', city: 'Malacca', lat: 2.1968, lng: 102.2458, rating: 4.4, reviewCount: 13450, priceLevel: 1, isHiddenGem: false, isTrending: false },
    { name: 'A Famosa', category: 'ATTRACTION', city: 'Malacca', lat: 2.1913, lng: 102.2504, rating: 4.3, reviewCount: 12430, priceLevel: 1, isHiddenGem: false, isTrending: false },

    // Langkawi
    { name: 'Langkawi Sky Bridge', category: 'ATTRACTION', city: 'Langkawi', lat: 6.3863, lng: 99.6615, rating: 4.5, reviewCount: 20134, priceLevel: 2, isHiddenGem: false, isTrending: true },
    { name: 'Pantai Cenang', category: 'BEACH', city: 'Langkawi', lat: 6.2948, lng: 99.7294, rating: 4.4, reviewCount: 15432, priceLevel: 1, isHiddenGem: false, isTrending: false },

    // Cameron Highlands
    { name: 'BOH Tea Plantation', category: 'VIEWPOINT', city: 'Cameron Highlands', lat: 4.5015, lng: 101.3993, rating: 4.5, reviewCount: 9876, priceLevel: 1, isHiddenGem: false, isTrending: false },
    { name: 'Mossy Forest', category: 'HIKING_TRAIL', city: 'Cameron Highlands', lat: 4.5244, lng: 101.3804, rating: 4.6, reviewCount: 5432, priceLevel: 1, isHiddenGem: true, isTrending: false },

    // Sabah
    { name: 'Mount Kinabalu', category: 'HIKING_TRAIL', city: 'Kota Kinabalu', lat: 6.0753, lng: 116.5587, rating: 4.8, reviewCount: 15678, priceLevel: 3, isHiddenGem: false, isTrending: true },
    { name: 'Sipadan Island', category: 'BEACH', city: 'Semporna', lat: 4.1137, lng: 118.6287, rating: 4.9, reviewCount: 8765, priceLevel: 3, isHiddenGem: false, isTrending: true },

    // Ipoh
    { name: 'Concubine Lane', category: 'ATTRACTION', city: 'Ipoh', lat: 4.5942, lng: 101.0831, rating: 4.2, reviewCount: 6543, priceLevel: 0, isHiddenGem: true, isTrending: false },
    { name: 'Lost World of Tambun', category: 'ENTERTAINMENT', city: 'Ipoh', lat: 4.6217, lng: 101.1553, rating: 4.3, reviewCount: 9876, priceLevel: 2, isHiddenGem: false, isTrending: false },
  ];

  for (const p of placesData) {
    const slug = p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    await prisma.place.upsert({
      where: { slug },
      update: { rating: p.rating, reviewCount: p.reviewCount, isTrending: p.isTrending },
      create: {
        name: p.name,
        slug,
        category: p.category as any,
        city: p.city,
        country: 'Malaysia',
        lat: p.lat,
        lng: p.lng,
        rating: p.rating,
        reviewCount: p.reviewCount,
        priceLevel: p.priceLevel,
        isHiddenGem: p.isHiddenGem,
        isTrending: p.isTrending,
        address: `${p.name}, ${p.city}, Malaysia`,
      },
    });
  }
  console.log(`✅ ${placesData.length} places created`);

  // ═════════════════════════════════════════════════════════════════════════════
  // ACHIEVEMENTS
  // ═════════════════════════════════════════════════════════════════════════════
  const achievements = [
    { code: 'first_trip', name: 'First Adventure', description: 'Plan your first trip', category: 'trip', xpReward: 50, tier: 1, criteria: { type: 'trips_planned', threshold: 1 } },
    { code: 'five_trips', name: 'Explorer', description: 'Plan 5 trips', category: 'trip', xpReward: 100, tier: 2, criteria: { type: 'trips_planned', threshold: 5 } },
    { code: 'ten_trips', name: 'Voyager', description: 'Plan 10 trips', category: 'trip', xpReward: 200, tier: 3, criteria: { type: 'trips_planned', threshold: 10 } },
    { code: 'first_review', name: 'Critic', description: 'Write your first review', category: 'social', xpReward: 25, tier: 1, criteria: { type: 'reviews_written', threshold: 1 } },
    { code: 'social_butterfly', name: 'Social Butterfly', description: 'Write 10 reviews', category: 'social', xpReward: 75, tier: 2, criteria: { type: 'reviews_written', threshold: 10 } },
    { code: 'foodie', name: 'Foodie', description: 'Visit 10 restaurants', category: 'food', xpReward: 50, tier: 1, criteria: { type: 'places_visited', threshold: 10, category: 'RESTAURANT' } },
    { code: 'foodie_master', name: 'Foodie Master', description: 'Visit 50 restaurants', category: 'food', xpReward: 200, tier: 3, criteria: { type: 'places_visited', threshold: 50, category: 'RESTAURANT' } },
    { code: 'gem_hunter', name: 'Gem Hunter', description: 'Find 5 hidden gems', category: 'exploration', xpReward: 50, tier: 1, criteria: { type: 'hidden_gems', threshold: 5 } },
    { code: 'gem_master', name: 'Gem Master', description: 'Find 20 hidden gems', category: 'exploration', xpReward: 150, tier: 3, criteria: { type: 'hidden_gems', threshold: 20 } },
    { code: 'photo_pro', name: 'Photographer', description: 'Upload 25 photos', category: 'photos', xpReward: 100, tier: 2, criteria: { type: 'photos_uploaded', threshold: 25 } },
    { code: 'couple_goals', name: 'Couple Goals', description: 'Complete a trip with your partner', category: 'social', xpReward: 100, tier: 2, criteria: { type: 'couple_trips', threshold: 1 } },
    { code: 'weekend_warrior', name: 'Weekend Warrior', description: 'Complete 5 weekend plans', category: 'trip', xpReward: 75, tier: 2, criteria: { type: 'weekend_plans', threshold: 5 } },
    { code: 'budget_master', name: 'Budget Master', description: 'Stay under budget on 3 trips', category: 'finance', xpReward: 50, tier: 1, criteria: { type: 'under_budget', threshold: 3 } },
    { code: 'city_hopper', name: 'City Hopper', description: 'Visit 10 cities', category: 'exploration', xpReward: 150, tier: 3, criteria: { type: 'cities_visited', threshold: 10 } },
    { code: 'early_bird', name: 'Early Bird', description: 'Join ExploreMY in the first month', category: 'special', xpReward: 200, tier: 2, criteria: { type: 'early_adopter' } },
  ];

  for (const a of achievements) {
    await prisma.achievement.upsert({
      where: { code: a.code },
      update: { xpReward: a.xpReward },
      create: a,
    });
  }
  console.log(`✅ ${achievements.length} achievements created`);

  // ═════════════════════════════════════════════════════════════════════════════
  // SAMPLE TRIPS
  // ═════════════════════════════════════════════════════════════════════════════
  const demoTrip = await prisma.trip.upsert({
    where: { id: 'trip-kl-weekend' },
    update: {},
    create: {
      id: 'trip-kl-weekend',
      title: 'KL Weekend Getaway',
      destination: 'Kuala Lumpur',
      destinationCity: 'Kuala Lumpur',
      userId: users[0].id,
      days: 2,
      budget: 500,
      currency: 'MYR',
      isPublic: true,
      isAIGenerated: true,
      tripDays: {
        create: [
          {
            day: 1,
            theme: 'City Explorer',
            stops: {
              create: [
                { stopNumber: 1, time: '08:00', placeName: 'Petronas Twin Towers', category: 'ATTRACTION', description: 'Start with an iconic landmark', cost: 80, transport: 'WALKING' },
                { stopNumber: 2, time: '12:00', placeName: 'Jalan Alor', category: 'FOOD', description: 'Lunch at the famous food street', cost: 25, transport: 'GRAB' },
                { stopNumber: 3, time: '14:00', placeName: 'Batu Caves', category: 'TEMPLE', description: 'Explore the limestone caves', cost: 0, transport: 'KTM' },
                { stopNumber: 4, time: '18:00', placeName: 'Central Market', category: 'SHOPPING', description: 'Evening shopping and dining', cost: 50, transport: 'KTM' },
              ],
            },
          },
          {
            day: 2,
            theme: 'Nature & Culture',
            stops: {
              create: [
                { stopNumber: 1, time: '09:00', placeName: 'KLCC Park', category: 'PARK', description: 'Morning walk in the park', cost: 0, transport: 'WALKING' },
                { stopNumber: 2, time: '11:00', placeName: 'Thean Hou Temple', category: 'TEMPLE', description: 'Beautiful Chinese temple', cost: 0, transport: 'GRAB' },
              ],
            },
          },
        ],
      },
    },
  });
  console.log('✅ Sample trip created');

  // ═════════════════════════════════════════════════════════════════════════════
  // SAMPLE REVIEWS
  // ═════════════════════════════════════════════════════════════════════════════
  const reviews = [
    { userId: users[0].id, placeSlug: 'petronas-twin-towers', rating: 5, title: 'Breathtaking!', content: 'An absolute must-visit in KL. The view from the skybridge is incredible.' },
    { userId: users[2].id, placeSlug: 'batu-caves', rating: 4, title: 'Colorful and spiritual', content: 'The rainbow stairs are photogenic. Watch out for the monkeys!' },
    { userId: users[0].id, placeSlug: 'jalan-alor-food-street', rating: 5, title: 'Food heaven!', content: 'Best street food in Malaysia. The grilled stingray is out of this world.' },
    { userId: users[2].id, placeSlug: 'langkawi-sky-bridge', rating: 5, title: 'Stunning views', content: 'The curved suspension bridge offers panoramic views of the Andaman Sea.' },
  ];

  for (const r of reviews) {
    await prisma.review.upsert({
      where: { id: `review-${r.placeSlug}-${r.userId}` },
      update: {},
      create: {
        id: `review-${r.placeSlug}-${r.userId}`,
        userId: r.userId,
        placeSlug: r.placeSlug,
        rating: r.rating,
        title: r.title,
        content: r.content,
        moderationStatus: 'APPROVED',
      },
    });
  }
  console.log(`✅ ${reviews.length} reviews created`);

  console.log('\n🎉 Seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
