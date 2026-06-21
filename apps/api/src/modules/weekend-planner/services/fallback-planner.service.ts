import { Injectable } from '@nestjs/common';
import { WeekendPlanInput, AIWeekendPlanOutput } from '../interfaces/weekend-plan.interface';
import {
  MEAL_COST_MATRIX, getMealCost,
  HOTEL_COST_MATRIX, getHotelCost,
  getTicketPrice,
} from '../constants';

// =============================================================================
// MALAYSIAN CITY DATABASE — Hardcoded places for guaranteed plan generation
// =============================================================================

interface CityPlace {
  name: string;
  category: string;       // BREAKFAST | LUNCH | DINNER | TOURIST_ATTRACTION | etc.
  emoji: string;
  desc: string;
  cost: number;           // MYR per person
  isHiddenGem: boolean;
  isPhotoSpot: boolean;
  isIndoor: boolean;
  timeOfDay: string;       // morning | afternoon | evening | night
  entryFee?: number;
  isHalal?: boolean;
  isVegetarian?: boolean;
}

const CITY_DB: Record<string, CityPlace[]> = {
  'penang': [
    // Breakfast
    { name: 'Toh Soon Cafe', category: 'BREAKFAST', emoji: '🍜', desc: 'Charcoal-toasted bread with kaya and half-boiled eggs since 1959', cost: 8, isHiddenGem: false, isPhotoSpot: false, isIndoor: true, timeOfDay: 'morning', isHalal: false },
    { name: 'Transfer Road Roti Canai', category: 'BREAKFAST', emoji: '🫓', desc: 'Legendary roti canai since the 1950s — widely considered the gold standard in Penang. The perfectly flaky, crisp-on-the-outside, soft-on-the-inside roti is served with rich, aromatic dhal curry and fiery sambal. Locals line up before sunrise for this iconic breakfast.', cost: 6, isHiddenGem: true, isPhotoSpot: false, isIndoor: false, timeOfDay: 'morning', isHalal: true },
    { name: 'Tai Tong Restaurant', category: 'BREAKFAST', emoji: '🥟', desc: 'Classic dim sum pushcart experience in Georgetown', cost: 15, isHiddenGem: false, isPhotoSpot: false, isIndoor: true, timeOfDay: 'morning', isHalal: false },
    // Lunch
    { name: 'Nasi Kandar Line Clear', category: 'LUNCH', emoji: '🍛', desc: 'Legendary 24-hour nasi kandar since 1930', cost: 14, isHiddenGem: false, isPhotoSpot: false, isIndoor: true, timeOfDay: 'afternoon', isHalal: true },
    { name: 'Air Itam Laksa', category: 'LUNCH', emoji: '🍜', desc: 'Famous asam laksa near Kek Lok Si temple', cost: 7, isHiddenGem: false, isPhotoSpot: false, isIndoor: false, timeOfDay: 'afternoon', isHalal: true },
    { name: 'Sister Yao Char Kway Teow', category: 'LUNCH', emoji: '🍝', desc: 'Wok-hei packed char kway teow by two sisters', cost: 8, isHiddenGem: true, isPhotoSpot: false, isIndoor: false, timeOfDay: 'afternoon', isHalal: false },
    // Dinner
    { name: 'Gurney Drive Hawker Centre', category: 'DINNER', emoji: '🍜', desc: 'Seaside hawker centre with over 50 stalls', cost: 25, isHiddenGem: false, isPhotoSpot: true, isIndoor: false, timeOfDay: 'evening', isHalal: true },
    { name: 'Chulia Street Night Hawkers', category: 'DINNER', emoji: '🍢', desc: 'Wanton mee, curry mee, lok-lok in heritage quarter', cost: 20, isHiddenGem: false, isPhotoSpot: false, isIndoor: false, timeOfDay: 'night', isHalal: false },
    { name: 'Kebaya Dining Room', category: 'DINNER', emoji: '🍽️', desc: 'Fine Peranakan dining in Seven Terraces hotel', cost: 80, isHiddenGem: true, isPhotoSpot: true, isIndoor: true, timeOfDay: 'evening', isHalal: false },
    { name: 'Nasi Kandar Beratur', category: 'DINNER', emoji: '🍛', desc: 'Queue forms before it opens — legendary late-night nasi kandar', cost: 12, isHiddenGem: true, isPhotoSpot: false, isIndoor: true, timeOfDay: 'night', isHalal: true },
    // Cafe
    { name: 'Lunabar Coffee', category: 'CAFE_STOP', emoji: '☕', desc: 'Specialty coffee in a heritage shophouse with courtyard', cost: 15, isHiddenGem: true, isPhotoSpot: true, isIndoor: true, timeOfDay: 'afternoon', isHalal: false },
    { name: 'China House', category: 'CAFE_STOP', emoji: '🍰', desc: 'Three heritage shophouses joined, 30+ cakes daily', cost: 22, isHiddenGem: false, isPhotoSpot: true, isIndoor: true, timeOfDay: 'afternoon', isHalal: false },
    { name: 'Kopi Loewak by W surprise', category: 'CAFE_STOP', emoji: '☕', desc: 'Instagram-worthy coffee bar with exotic beans', cost: 18, isHiddenGem: false, isPhotoSpot: true, isIndoor: true, timeOfDay: 'afternoon', isHalal: true },
    // Attractions
    { name: 'Kek Lok Si Temple', category: 'TOURIST_ATTRACTION', emoji: '🏛️', desc: 'Southeast Asia\'s largest Buddhist temple complex', cost: 0, isHiddenGem: false, isPhotoSpot: true, isIndoor: false, timeOfDay: 'morning', entryFee: 8, isHalal: true },
    { name: 'Penang Hill Funicular', category: 'TOURIST_ATTRACTION', emoji: '🏔️', desc: 'Cool mountain air with 360° views of the island and mainland', cost: 0, isHiddenGem: false, isPhotoSpot: true, isIndoor: false, timeOfDay: 'afternoon', entryFee: 30, isHalal: true },
    { name: 'Chew Jetty', category: 'HIDDEN_GEM', emoji: '🏘️', desc: 'Historic waterfront settlements on stilts with local life', cost: 0, isHiddenGem: true, isPhotoSpot: true, isIndoor: false, timeOfDay: 'morning', isHalal: true },
    { name: 'Pinang Peranakan Mansion', category: 'TOURIST_ATTRACTION', emoji: '🏛️', desc: 'Straits Chinese heritage museum in a restored mansion', cost: 0, isHiddenGem: false, isPhotoSpot: true, isIndoor: true, timeOfDay: 'afternoon', entryFee: 20, isHalal: true },
    { name: 'Hin Bus Depot', category: 'HIDDEN_GEM', emoji: '🎨', desc: 'Contemporary art space in a repurposed bus depot', cost: 0, isHiddenGem: true, isPhotoSpot: true, isIndoor: true, timeOfDay: 'afternoon', isHalal: true },
    { name: 'Batu Ferringhi Beach', category: 'NATURE', emoji: '🏖️', desc: 'Sandy shores with water sports and sunset views', cost: 0, isHiddenGem: false, isPhotoSpot: true, isIndoor: false, timeOfDay: 'afternoon', isHalal: true },
    { name: 'Penang National Park', category: 'NATURE', emoji: '🥾', desc: 'Coastal hike to secluded Monkey Beach and lighthouse', cost: 0, isHiddenGem: true, isPhotoSpot: true, isIndoor: false, timeOfDay: 'morning', isHalal: true },
    { name: 'Penang Street Art', category: 'PHOTO_SPOT', emoji: '🎨', desc: 'Ernest Zacharevic murals scattered across Georgetown', cost: 0, isHiddenGem: false, isPhotoSpot: true, isIndoor: false, timeOfDay: 'morning', isHalal: true },
    // Night
    { name: 'Magazine 63 Rooftop Bar', category: 'NIGHT_ACTIVITY', emoji: '🍸', desc: 'Speakeasy cocktail bar above a kopitiam', cost: 35, isHiddenGem: true, isPhotoSpot: true, isIndoor: false, timeOfDay: 'night', isHalal: false },
    { name: 'Batu Ferringhi Night Market', category: 'NIGHT_ACTIVITY', emoji: '🛍️', desc: 'Beachside pasar malam with souvenirs and street food', cost: 15, isHiddenGem: false, isPhotoSpot: false, isIndoor: false, timeOfDay: 'night', isHalal: true },
  ],
  'kl': [
    { name: 'Nasi Lemak Tanglin', category: 'BREAKFAST', emoji: '🍛', desc: 'Legendary nasi lemak since 1948 at Lake Gardens', cost: 8, isHiddenGem: true, isPhotoSpot: false, isIndoor: false, timeOfDay: 'morning', isHalal: true },
    { name: 'VCR Coffee & Cafe', category: 'BREAKFAST', emoji: '☕', desc: 'Specialty coffee in a restored Pudu heritage building', cost: 28, isHiddenGem: false, isPhotoSpot: true, isIndoor: true, timeOfDay: 'morning', isHalal: false },
    { name: 'Petronas Twin Towers', category: 'TOURIST_ATTRACTION', emoji: '🏙️', desc: 'Iconic 452m twin towers with skybridge and observation deck', cost: 0, isHiddenGem: false, isPhotoSpot: true, isIndoor: true, timeOfDay: 'morning', entryFee: 80, isHalal: true },
    { name: 'Jalan Alor Food Street', category: 'DINNER', emoji: '🍜', desc: 'KL\'s most famous food street, open-air dining', cost: 25, isHiddenGem: false, isPhotoSpot: true, isIndoor: false, timeOfDay: 'evening', isHalal: true },
    { name: 'Batu Caves', category: 'TOURIST_ATTRACTION', emoji: '🛕', desc: '272 rainbow steps to limestone cave Hindu temple', cost: 0, isHiddenGem: false, isPhotoSpot: true, isIndoor: false, timeOfDay: 'morning', isHalal: true },
    { name: 'Lot 10 Hutong Food Court', category: 'LUNCH', emoji: '🍜', desc: 'Curated heritage hawker stalls in a basement food court', cost: 15, isHiddenGem: false, isPhotoSpot: false, isIndoor: true, timeOfDay: 'afternoon', isHalal: false },
    { name: 'Islamic Arts Museum', category: 'TOURIST_ATTRACTION', emoji: '🏛️', desc: 'World-class Islamic art collection with stunning domes', cost: 0, isHiddenGem: false, isPhotoSpot: true, isIndoor: true, timeOfDay: 'afternoon', entryFee: 14, isHalal: true },
    { name: 'Perdana Botanical Gardens', category: 'NATURE', emoji: '🌳', desc: '91-hectare tranquil gardens with deer park and lake', cost: 0, isHiddenGem: false, isPhotoSpot: true, isIndoor: false, timeOfDay: 'afternoon', isHalal: true },
    { name: 'Heli Lounge Bar', category: 'NIGHT_ACTIVITY', emoji: '🍸', desc: 'Rooftop bar on an active helipad with 360° skyline', cost: 40, isHiddenGem: true, isPhotoSpot: true, isIndoor: false, timeOfDay: 'night', isHalal: false },
    { name: 'Kwai Chai Hong', category: 'PHOTO_SPOT', emoji: '🎨', desc: 'Instagram-famous hidden alley with nostalgic murals', cost: 0, isHiddenGem: true, isPhotoSpot: true, isIndoor: false, timeOfDay: 'afternoon', isHalal: true },
    { name: 'Kampung Baru', category: 'DINNER', emoji: '🍛', desc: 'Traditional Malay village in the city center, amazing street food', cost: 20, isHiddenGem: true, isPhotoSpot: false, isIndoor: false, timeOfDay: 'evening', isHalal: true },
    { name: 'Thean Hou Temple', category: 'TOURIST_ATTRACTION', emoji: '🛕', desc: '6-tier Chinese temple with panoramic KL views', cost: 0, isHiddenGem: false, isPhotoSpot: true, isIndoor: false, timeOfDay: 'afternoon', isHalal: true },
    { name: 'Pavilion KL', category: 'SHOPPING', emoji: '🛍️', desc: '700+ stores from luxury to high street in Bukit Bintang', cost: 0, isHiddenGem: false, isPhotoSpot: false, isIndoor: true, timeOfDay: 'afternoon', isHalal: true },
    { name: 'Central Market', category: 'HIDDEN_GEM', emoji: '🏛️', desc: 'Art deco heritage market with local crafts and art', cost: 0, isHiddenGem: true, isPhotoSpot: true, isIndoor: true, timeOfDay: 'afternoon', isHalal: true },
    { name: 'TREC KL', category: 'NIGHT_ACTIVITY', emoji: '🎵', desc: 'KL\'s largest entertainment hub with clubs and bars', cost: 50, isHiddenGem: false, isPhotoSpot: false, isIndoor: true, timeOfDay: 'night', isHalal: false },
  ],
  'melaka': [
    { name: 'The Daily Fix Cafe', category: 'BREAKFAST', emoji: '🥞', desc: 'Heritage cafe famous for pandan pancakes and gula melaka coffee', cost: 20, isHiddenGem: false, isPhotoSpot: true, isIndoor: true, timeOfDay: 'morning', isHalal: false },
    { name: 'Nancy Kitchen', category: 'LUNCH', emoji: '🍛', desc: 'Authentic Peranakan Nyonya cuisine in a heritage shophouse', cost: 25, isHiddenGem: false, isPhotoSpot: false, isIndoor: true, timeOfDay: 'afternoon', isHalal: false },
    { name: 'Jonker Street Night Market', category: 'NIGHT_ACTIVITY', emoji: '🛍️', desc: 'Vibrant weekend night market with antiques, crafts, and street food', cost: 15, isHiddenGem: false, isPhotoSpot: true, isIndoor: false, timeOfDay: 'night', isHalal: true },
    { name: 'A Famosa & St Paul Hill', category: 'TOURIST_ATTRACTION', emoji: '🏰', desc: '16th-century Portuguese fortress ruins with city views', cost: 0, isHiddenGem: false, isPhotoSpot: true, isIndoor: false, timeOfDay: 'morning', entryFee: 10, isHalal: true },
    { name: 'Melaka River Cruise', category: 'TOURIST_ATTRACTION', emoji: '🚤', desc: 'Scenic boat ride along the historic Melaka River', cost: 0, isHiddenGem: false, isPhotoSpot: true, isIndoor: false, timeOfDay: 'afternoon', entryFee: 20, isHalal: true },
    { name: 'Christ Church Dutch Square', category: 'PHOTO_SPOT', emoji: '⛪', desc: 'Iconic salmon-red Dutch colonial buildings and clock tower', cost: 0, isHiddenGem: false, isPhotoSpot: true, isIndoor: false, timeOfDay: 'morning', isHalal: true },
    { name: 'Banana Leaf Restaurant', category: 'LUNCH', emoji: '🍌', desc: 'Authentic South Indian banana leaf rice in Little India', cost: 12, isHiddenGem: true, isPhotoSpot: false, isIndoor: true, timeOfDay: 'afternoon', isHalal: true, isVegetarian: true },
    { name: 'Encore Melaka Theatre', category: 'NIGHT_ACTIVITY', emoji: '🎭', desc: 'Immersive 360° rotating theatre experience', cost: 0, isHiddenGem: false, isPhotoSpot: true, isIndoor: true, timeOfDay: 'evening', entryFee: 80, isHalal: true },
    { name: 'Baba Nyonya Heritage Museum', category: 'TOURIST_ATTRACTION', emoji: '🏛️', desc: 'Beautifully preserved Peranakan home museum', cost: 0, isHiddenGem: false, isPhotoSpot: true, isIndoor: true, timeOfDay: 'afternoon', entryFee: 16, isHalal: true },
    { name: 'Calanthe Art Cafe', category: 'CAFE_STOP', emoji: '☕', desc: '13 states of Malaysia coffee + laksa in art-filled space', cost: 18, isHiddenGem: true, isPhotoSpot: true, isIndoor: true, timeOfDay: 'afternoon', isHalal: true },
  ],
  'langkawi': [
    { name: 'Langkawi Sky Bridge', category: 'TOURIST_ATTRACTION', emoji: '🌉', desc: 'Curved pedestrian bridge 700m above sea level', cost: 0, isHiddenGem: false, isPhotoSpot: true, isIndoor: false, timeOfDay: 'morning', entryFee: 6, isHalal: true },
    { name: 'Kilim Geoforest Park', category: 'NATURE', emoji: '🦅', desc: 'Mangrove tour with eagles, limestone formations, and bat caves', cost: 0, isHiddenGem: false, isPhotoSpot: true, isIndoor: false, timeOfDay: 'morning', entryFee: 80, isHalal: true },
    { name: 'Pantai Cenang', category: 'NATURE', emoji: '🏖️', desc: 'Popular beach strip with bars, water sports, and sunset views', cost: 0, isHiddenGem: false, isPhotoSpot: true, isIndoor: false, timeOfDay: 'afternoon', isHalal: true },
    { name: 'Langkawi Cable Car', category: 'TOURIST_ATTRACTION', emoji: '🚡', desc: 'One of the steepest cable car rides in the world', cost: 0, isHiddenGem: false, isPhotoSpot: true, isIndoor: false, timeOfDay: 'morning', entryFee: 55, isHalal: true },
    { name: 'Tanjung Rhu Beach', category: 'NATURE', emoji: '🏝️', desc: 'Secluded beach with crystal-clear waters and sandbar', cost: 0, isHiddenGem: true, isPhotoSpot: true, isIndoor: false, timeOfDay: 'afternoon', isHalal: true },
    { name: 'Night Market Langkawi', category: 'DINNER', emoji: '🍜', desc: 'Rotating night market with fresh seafood and local specialties', cost: 20, isHiddenGem: false, isPhotoSpot: false, isIndoor: false, timeOfDay: 'evening', isHalal: true },
    { name: 'Dataran Lang Eagle Square', category: 'PHOTO_SPOT', emoji: '🦅', desc: 'Iconic 12-meter eagle statue at the waterfront', cost: 0, isHiddenGem: false, isPhotoSpot: true, isIndoor: false, timeOfDay: 'afternoon', isHalal: true },
    { name: 'Seven Wells Waterfall', category: 'NATURE', emoji: '🏞️', desc: 'Natural rock pools in the jungle — a refreshing dip', cost: 0, isHiddenGem: true, isPhotoSpot: true, isIndoor: false, timeOfDay: 'morning', isHalal: true },
  ],
};

// Default tips database
const MALAYSIA_TIPS = [
  'Most hawker stalls are cash-only — carry RM 50-100 in small notes',
  'Grab is affordable (RM 5-15 per ride in city centers)',
  'Check opening hours — some famous spots close on Mondays',
  'Go early for popular eateries to beat the queues and the heat',
  'Bring an umbrella — afternoon thunderstorms are common',
  'Wear comfortable walking shoes for heritage area exploring',
  'Download offline Google Maps for areas with poor reception',
  'Try local drinks — teh tarik, cendol, nutmeg juice, calamansi lime',
  'Dress modestly when visiting religious sites (cover shoulders and knees)',
  'Use MRT/LRT for city travel in KL — cheap and avoids traffic jams',
  'Book popular attractions online to skip long weekend queues',
  'Street food is where you find Malaysia\'s best flavors at the best prices',
];

// ═══════════════════════════════════════════════════════════════════════════
// KOTA KINABALU, SABAH
// ═══════════════════════════════════════════════════════════════════════════
const KK_PLACES: CityPlace[] = [
  // Breakfast
  { name: 'Yee Fung Laksa', category: 'BREAKFAST', emoji: '🍜', desc: 'Iconic KK laksa — rich, spicy coconut broth with prawns and shredded chicken. A must-eat breakfast institution since 1980.', cost: 12, isHiddenGem: false, isPhotoSpot: false, isIndoor: true, timeOfDay: 'morning', isHalal: false },
  { name: 'Kedai Kopi Kinabalu', category: 'BREAKFAST', emoji: '☕', desc: 'Old-school kopitiam serving traditional Hainanese breakfast — kaya toast, half-boiled eggs, and strong local coffee.', cost: 8, isHiddenGem: true, isPhotoSpot: false, isIndoor: true, timeOfDay: 'morning', isHalal: true },
  { name: 'Fatt Kee Seafood', category: 'BREAKFAST', emoji: '🍲', desc: 'Morning fish noodle soup with fresh local catch — light, clean broth packed with umami.', cost: 10, isHiddenGem: true, isPhotoSpot: false, isIndoor: true, timeOfDay: 'morning', isHalal: false },
  // Lunch
  { name: 'Welcome Seafood Restaurant', category: 'LUNCH', emoji: '🦀', desc: 'KK\'s most famous seafood spot — fresh from the tank, choose your crab, prawns, and fish. Butter prawns and salted egg crab are legendary.', cost: 35, isHiddenGem: false, isPhotoSpot: true, isIndoor: false, timeOfDay: 'afternoon', isHalal: false },
  { name: 'Sinalau Bakas Kadazan', category: 'LUNCH', emoji: '🍖', desc: 'Authentic Kadazan smoked wild boar — a traditional Sabahan delicacy cooked over open fire. Served with rice and sambal.', cost: 15, isHiddenGem: true, isPhotoSpot: true, isIndoor: false, timeOfDay: 'afternoon', isHalal: false },
  { name: 'Nasi Lemak Anak Kota', category: 'LUNCH', emoji: '🍛', desc: 'Fragrant coconut rice with crispy fried chicken, sambal, and all the trimmings. Local favorite for authentic Sabahan nasi lemak.', cost: 10, isHiddenGem: true, isPhotoSpot: false, isIndoor: true, timeOfDay: 'afternoon', isHalal: true },
  { name: 'Kuo Man Restaurant', category: 'LUNCH', emoji: '🍝', desc: 'Famous for Sang Nyuk Mian (fresh pork noodle) — hand-tossed noodles in rich pork broth with tender slices. A KK specialty.', cost: 10, isHiddenGem: false, isPhotoSpot: false, isIndoor: true, timeOfDay: 'afternoon', isHalal: false },
  // Dinner
  { name: 'Supertanker Restaurant', category: 'DINNER', emoji: '🦞', desc: 'Floating seafood restaurant with panoramic sunset views. Fresh lobster, grouper, and mantis prawn cooked in 10+ styles.', cost: 45, isHiddenGem: false, isPhotoSpot: true, isIndoor: false, timeOfDay: 'evening', isHalal: false },
  { name: 'Todak Waterfront', category: 'DINNER', emoji: '🌅', desc: 'Waterfront hawker centre with grilled seafood, satay, and cold beers watching the South China Sea sunset.', cost: 25, isHiddenGem: false, isPhotoSpot: true, isIndoor: false, timeOfDay: 'evening', isHalal: true },
  { name: 'D\'Place Kinabalu', category: 'DINNER', emoji: '🍽️', desc: 'Traditional Kadazandusun cuisine — try hinava (raw fish salad), bambangan (wild mango), and tuhau (wild ginger). Cultural dining experience.', cost: 30, isHiddenGem: true, isPhotoSpot: true, isIndoor: true, timeOfDay: 'evening', isHalal: false },
  // Cafe
  { name: 'October Coffee House', category: 'CAFE_STOP', emoji: '☕', desc: 'Specialty coffee in a minimalist glass house. Pour-overs, espresso, and housemade cakes with mountain views.', cost: 18, isHiddenGem: true, isPhotoSpot: true, isIndoor: true, timeOfDay: 'afternoon', isHalal: true },
  { name: 'Woo! Cafe', category: 'CAFE_STOP', emoji: '🍰', desc: 'Instagram-famous cafe with garden seating, sourdough pizzas, and artisanal desserts. Great for afternoon tea.', cost: 22, isHiddenGem: false, isPhotoSpot: true, isIndoor: true, timeOfDay: 'afternoon', isHalal: false },
  { name: 'Nook Cafe', category: 'CAFE_STOP', emoji: '🥐', desc: 'Cozy neighbourhood cafe with excellent flat whites, croissants, and a quiet garden. Perfect for a slow morning.', cost: 15, isHiddenGem: true, isPhotoSpot: false, isIndoor: true, timeOfDay: 'morning', isHalal: true },
  // Attractions
  { name: 'Tunku Abdul Rahman Marine Park', category: 'NATURE', emoji: '🏝️', desc: 'Five pristine islands with crystal-clear waters. Snorkel with tropical fish, relax on white sand beaches. 15-min boat from KK jetty.', cost: 0, isHiddenGem: false, isPhotoSpot: true, isIndoor: false, timeOfDay: 'morning', entryFee: 30, isHalal: true },
  { name: 'Mount Kinabalu', category: 'NATURE', emoji: '🏔️', desc: 'UNESCO World Heritage site — Southeast Asia\'s highest peak at 4,095m. Day trips to Kinabalu Park for hiking trails and botanical gardens.', cost: 0, isHiddenGem: false, isPhotoSpot: true, isIndoor: false, timeOfDay: 'morning', entryFee: 15, isHalal: true },
  { name: 'Mari Mari Cultural Village', category: 'TOURIST_ATTRACTION', emoji: '🏘️', desc: 'Immersive cultural experience showcasing Sabah\'s 5 indigenous tribes. Traditional houses, blowpipe demos, fire-starting, and cultural performances.', cost: 0, isHiddenGem: false, isPhotoSpot: true, isIndoor: false, timeOfDay: 'afternoon', entryFee: 90, isHalal: true },
  { name: 'Signal Hill Observatory', category: 'PHOTO_SPOT', emoji: '🌆', desc: 'Best panoramic view of KK city skyline, the islands, and sunset over the South China Sea. Iconic photo spot.', cost: 0, isHiddenGem: false, isPhotoSpot: true, isIndoor: false, timeOfDay: 'evening', isHalal: true },
  { name: 'Puh Toh Tze Temple', category: 'TOURIST_ATTRACTION', emoji: '🏛️', desc: 'Stunning Chinese Buddhist temple with intricate carvings, giant Buddha statues, and panoramic hilltop views of KK.', cost: 0, isHiddenGem: true, isPhotoSpot: true, isIndoor: false, timeOfDay: 'morning', isHalal: true },
  { name: 'Kota Kinabalu City Mosque', category: 'PHOTO_SPOT', emoji: '🕌', desc: 'Floating mosque surrounded by a lagoon — stunning at sunset when the water reflects the golden domes. Sabah\'s most iconic photo spot.', cost: 0, isHiddenGem: false, isPhotoSpot: true, isIndoor: false, timeOfDay: 'evening', isHalal: true },
  { name: 'Gaya Street Sunday Market', category: 'HIDDEN_GEM', emoji: '🛍️', desc: 'Vibrant weekly market stretching 1km with antiques, crafts, orchids, local snacks, and live street music. Best Sunday morning activity.', cost: 0, isHiddenGem: true, isPhotoSpot: true, isIndoor: false, timeOfDay: 'morning', isHalal: true },
  { name: 'Tanjung Aru Beach', category: 'NATURE', emoji: '🌅', desc: 'KK\'s most beautiful sunset beach — golden sand, swaying casuarina trees, and fiery orange skies. Local families gather here every evening.', cost: 0, isHiddenGem: false, isPhotoSpot: true, isIndoor: false, timeOfDay: 'evening', isHalal: true },
  { name: 'Kokol Hill Elf', category: 'HIDDEN_GEM', emoji: '🏞️', desc: 'Hidden mountain viewpoint 40min from KK — swing over the clouds, Bali-style nests, and breathtaking views of the city and ocean below.', cost: 0, isHiddenGem: true, isPhotoSpot: true, isIndoor: false, timeOfDay: 'afternoon', entryFee: 10, isHalal: true },
  { name: 'Sabah Museum', category: 'TOURIST_ATTRACTION', emoji: '🏛️', desc: 'Comprehensive museum complex with heritage village, ethnobotanical garden, and exhibits on Sabah\'s indigenous cultures and history.', cost: 0, isHiddenGem: false, isPhotoSpot: false, isIndoor: true, timeOfDay: 'afternoon', entryFee: 15, isHalal: true },
  { name: 'Filipino Market', category: 'HIDDEN_GEM', emoji: '🛍️', desc: 'Bustling waterfront market for pearls, handicrafts, dried seafood, and local snacks. Bargain hard and explore the maze of stalls.', cost: 0, isHiddenGem: true, isPhotoSpot: true, isIndoor: false, timeOfDay: 'afternoon', isHalal: true },
  // Night
  { name: 'Sutera Harbour Marina', category: 'NIGHT_ACTIVITY', emoji: '🌙', desc: 'Upscale waterfront dining and nightlife precinct with live bands, cocktail bars, and marina views. KK\'s most sophisticated evening spot.', cost: 40, isHiddenGem: false, isPhotoSpot: true, isIndoor: false, timeOfDay: 'night', isHalal: false },
  { name: 'Waterfront Esplanade', category: 'NIGHT_ACTIVITY', emoji: '🎵', desc: 'Lively night market and food street along the waterfront. BBQ seafood, live music, and cold drinks under the stars.', cost: 20, isHiddenGem: false, isPhotoSpot: false, isIndoor: false, timeOfDay: 'night', isHalal: true },
];

// Add KK to CITY_DB
CITY_DB['kota kinabalu'] = KK_PLACES;
CITY_DB['kk'] = KK_PLACES;
CITY_DB['sabah'] = KK_PLACES;
CITY_DB['kota kinabalu, sabah'] = KK_PLACES;

@Injectable()
export class FallbackPlannerService {
  private readonly GOOGLE_KEY = process.env.GOOGLE_MAPS_API_KEY || 'AIzaSyCyohvWiwbAd2UbDpOW-9Os0_eIo8JQ_D8';

  /** Generate generic place names for any worldwide city — enrichment will find real Google Places */
  private generateGenericPlaces(dest: string): CityPlace[] {
    const short = dest.split(',')[0]!.trim();
    const places: CityPlace[] = [
      // Breakfast (10 variants for 8+ day trips)
      { name: `Best Breakfast in ${short}`, category: 'BREAKFAST', emoji: '🍜', desc: `Start your morning right at the most beloved breakfast spot in ${short}.`, cost: 15, isHiddenGem: false, isPhotoSpot: false, isIndoor: true, timeOfDay: 'morning', isHalal: true },
      { name: `Local Kopitiam ${short}`, category: 'BREAKFAST', emoji: '☕', desc: `Traditional kopitiam serving kaya toast and soft-boiled eggs. A true Malaysian breakfast experience.`, cost: 10, isHiddenGem: true, isPhotoSpot: false, isIndoor: true, timeOfDay: 'morning', isHalal: true },
      { name: `Roti Canai Corner ${short}`, category: 'BREAKFAST', emoji: '🫓', desc: `Crispy, flaky roti canai served with rich dhal and curry. A local institution beloved by generations.`, cost: 8, isHiddenGem: true, isPhotoSpot: false, isIndoor: false, timeOfDay: 'morning', isHalal: true },
      { name: `Dim Sum House ${short}`, category: 'BREAKFAST', emoji: '🥟', desc: `Steaming baskets of fresh dim sum in a bustling morning atmosphere.`, cost: 20, isHiddenGem: false, isPhotoSpot: false, isIndoor: true, timeOfDay: 'morning', isHalal: false },
      { name: `Nasi Lemak Stall ${short}`, category: 'BREAKFAST', emoji: '🍛', desc: `Fragrant coconut rice with sambal, crispy anchovies, and fried chicken — Malaysia's national breakfast.`, cost: 8, isHiddenGem: true, isPhotoSpot: false, isIndoor: false, timeOfDay: 'morning', isHalal: true },
      { name: `Roti Bakar ${short}`, category: 'BREAKFAST', emoji: '🍞', desc: `Charcoal-grilled toast with kaya and butter, paired with silky half-boiled kampung eggs. Pure nostalgia.`, cost: 7, isHiddenGem: true, isPhotoSpot: false, isIndoor: true, timeOfDay: 'morning', isHalal: true },
      { name: `Wan Tan Mee ${short}`, category: 'BREAKFAST', emoji: '🍝', desc: `Springy egg noodles tossed in dark soy sauce with char siu and wantons. The perfect morning fuel.`, cost: 9, isHiddenGem: true, isPhotoSpot: false, isIndoor: true, timeOfDay: 'morning', isHalal: false },
      { name: `Putu Piring Stall ${short}`, category: 'BREAKFAST', emoji: '🍚', desc: `Steamed rice flour cakes filled with gula melaka — a sweet, melt-in-your-mouth traditional breakfast treat.`, cost: 5, isHiddenGem: true, isPhotoSpot: true, isIndoor: false, timeOfDay: 'morning', isHalal: true },
      // Lunch (10 variants)
      { name: `Top Restaurant ${short}`, category: 'LUNCH', emoji: '🍛', desc: `The finest dining in ${short} — masterfully prepared local dishes using the freshest ingredients.`, cost: 25, isHiddenGem: false, isPhotoSpot: false, isIndoor: true, timeOfDay: 'afternoon', isHalal: true },
      { name: `Nasi Campur ${short}`, category: 'LUNCH', emoji: '🍚', desc: `Authentic Malay mixed rice with dozens of lauk to choose from.`, cost: 12, isHiddenGem: true, isPhotoSpot: false, isIndoor: true, timeOfDay: 'afternoon', isHalal: true },
      { name: `Banana Leaf Rice ${short}`, category: 'LUNCH', emoji: '🍌', desc: `South Indian banana leaf rice with generous portions and authentic flavors.`, cost: 15, isHiddenGem: true, isPhotoSpot: false, isIndoor: true, timeOfDay: 'afternoon', isHalal: true, isVegetarian: true },
      { name: `Seafood Restaurant ${short}`, category: 'LUNCH', emoji: '🦐', desc: `Fresh catch of the day prepared in local style — butter prawns, steamed fish, chili crab.`, cost: 35, isHiddenGem: false, isPhotoSpot: true, isIndoor: false, timeOfDay: 'afternoon', isHalal: true },
      { name: `Chicken Rice Shop ${short}`, category: 'LUNCH', emoji: '🍗', desc: `Perfectly poached chicken with fragrant rice, chili sauce, and clear broth. Simple perfection.`, cost: 12, isHiddenGem: true, isPhotoSpot: false, isIndoor: true, timeOfDay: 'afternoon', isHalal: true },
      { name: `Char Kway Teow ${short}`, category: 'LUNCH', emoji: '🍝', desc: `Wok-hei packed flat rice noodles stir-fried with prawns, cockles, and bean sprouts.`, cost: 10, isHiddenGem: true, isPhotoSpot: false, isIndoor: false, timeOfDay: 'afternoon', isHalal: false },
      { name: `Asam Laksa ${short}`, category: 'LUNCH', emoji: '🍜', desc: `Tangy, spicy fish-based noodle soup with fresh herbs — a flavor explosion in every spoonful.`, cost: 9, isHiddenGem: true, isPhotoSpot: false, isIndoor: false, timeOfDay: 'afternoon', isHalal: true },
      { name: `Curry Mee ${short}`, category: 'LUNCH', emoji: '🍲', desc: `Rich coconut curry broth with yellow noodles, tofu puffs, and fresh cockles — comfort in a bowl.`, cost: 10, isHiddenGem: true, isPhotoSpot: false, isIndoor: true, timeOfDay: 'afternoon', isHalal: false },
      // Dinner (10 variants)
      { name: `Fine Dining ${short}`, category: 'DINNER', emoji: '🍽️', desc: `An extraordinary culinary journey with innovative dishes and impeccable service.`, cost: 50, isHiddenGem: false, isPhotoSpot: true, isIndoor: true, timeOfDay: 'evening', isHalal: true },
      { name: `Night Market ${short}`, category: 'DINNER', emoji: '🌙', desc: `Vibrant pasar malam with dozens of food stalls — the best street food in town.`, cost: 20, isHiddenGem: true, isPhotoSpot: true, isIndoor: false, timeOfDay: 'evening', isHalal: true },
      { name: `Hawker Centre ${short}`, category: 'DINNER', emoji: '🍜', desc: `Bustling hawker centre where locals gather for affordable and delicious evening meals.`, cost: 15, isHiddenGem: false, isPhotoSpot: false, isIndoor: false, timeOfDay: 'evening', isHalal: true },
      { name: `BBQ & Grill ${short}`, category: 'DINNER', emoji: '🥩', desc: `Sizzling hot plates, marinated meats, and a lively atmosphere for dinner with friends.`, cost: 40, isHiddenGem: false, isPhotoSpot: false, isIndoor: true, timeOfDay: 'evening', isHalal: true },
      { name: `Satay Joint ${short}`, category: 'DINNER', emoji: '🍢', desc: `Charcoal-grilled meat skewers with peanut sauce, ketupat, and cucumber — the ultimate Malaysian dinner.`, cost: 18, isHiddenGem: true, isPhotoSpot: true, isIndoor: false, timeOfDay: 'evening', isHalal: true },
      { name: `Steamboat ${short}`, category: 'DINNER', emoji: '🫕', desc: `Communal hot pot with fresh seafood, thinly sliced meats, and vegetables in bubbling broth.`, cost: 35, isHiddenGem: false, isPhotoSpot: true, isIndoor: true, timeOfDay: 'evening', isHalal: true },
      { name: `Ikan Bakar ${short}`, category: 'DINNER', emoji: '🐟', desc: `Grilled fish marinated in aromatic spices, wrapped in banana leaf — smoky, juicy, unforgettable.`, cost: 25, isHiddenGem: true, isPhotoSpot: true, isIndoor: false, timeOfDay: 'evening', isHalal: true },
      { name: `Nasi Kandar ${short}`, category: 'DINNER', emoji: '🍛', desc: `Steamed rice drenched in mixed curries with fried chicken — a Penang legend now served right here.`, cost: 14, isHiddenGem: true, isPhotoSpot: false, isIndoor: true, timeOfDay: 'evening', isHalal: true },
      // Cafe (8 variants)
      { name: `Famous Cafe ${short}`, category: 'CAFE_STOP', emoji: '☕', desc: `The most Instagrammable cafe in town — specialty coffee and artisanal pastries.`, cost: 18, isHiddenGem: true, isPhotoSpot: true, isIndoor: true, timeOfDay: 'afternoon', isHalal: true },
      { name: `Artisan Bakery ${short}`, category: 'CAFE_STOP', emoji: '🥐', desc: `Freshly baked sourdough, croissants, and handcrafted desserts in a cozy setting.`, cost: 15, isHiddenGem: true, isPhotoSpot: true, isIndoor: true, timeOfDay: 'afternoon', isHalal: false },
      { name: `Tea House ${short}`, category: 'CAFE_STOP', emoji: '🍵', desc: `Traditional tea ceremony experience with local snacks in a serene garden setting.`, cost: 22, isHiddenGem: true, isPhotoSpot: true, isIndoor: true, timeOfDay: 'afternoon', isHalal: true },
      { name: `Rooftop Cafe ${short}`, category: 'CAFE_STOP', emoji: '🏙️', desc: `Coffee with a view — panoramic city views from this hidden rooftop gem.`, cost: 20, isHiddenGem: true, isPhotoSpot: true, isIndoor: false, timeOfDay: 'afternoon', isHalal: true },
      { name: `Cendol & Dessert ${short}`, category: 'CAFE_STOP', emoji: '🍧', desc: `Ice-cold cendol with gula melaka and coconut milk — the perfect afternoon cooldown.`, cost: 8, isHiddenGem: true, isPhotoSpot: true, isIndoor: false, timeOfDay: 'afternoon', isHalal: true },
      { name: `Specialty Pour-Over ${short}`, category: 'CAFE_STOP', emoji: '☕', desc: `Third-wave coffee bar with single-origin beans, precision brewing, and minimalist aesthetics.`, cost: 18, isHiddenGem: true, isPhotoSpot: true, isIndoor: true, timeOfDay: 'afternoon', isHalal: true },
      { name: `Matcha Bar ${short}`, category: 'CAFE_STOP', emoji: '🍵', desc: `Ceremonial-grade matcha, hojicha lattes, and Japanese-inspired sweets in a zen minimalist space.`, cost: 16, isHiddenGem: true, isPhotoSpot: true, isIndoor: true, timeOfDay: 'afternoon', isHalal: true },
      { name: `Ais Kacang Stall ${short}`, category: 'CAFE_STOP', emoji: '🍧', desc: `Mountain of shaved ice with red beans, sweet corn, grass jelly, and rose syrup — iconic Malaysian dessert.`, cost: 6, isHiddenGem: false, isPhotoSpot: true, isIndoor: false, timeOfDay: 'afternoon', isHalal: true },
      // Attractions (12 variants)
      { name: `Main Attraction ${short}`, category: 'TOURIST_ATTRACTION', emoji: '🏛️', desc: `The definitive must-see landmark of ${short} — rich in history and stunning architecture.`, cost: 0, isHiddenGem: false, isPhotoSpot: true, isIndoor: false, timeOfDay: 'morning', isHalal: true, entryFee: 20 },
      { name: `City Museum ${short}`, category: 'TOURIST_ATTRACTION', emoji: '🏛️', desc: `Explore the rich heritage and history of ${short} through fascinating exhibits.`, cost: 0, isHiddenGem: false, isPhotoSpot: true, isIndoor: true, timeOfDay: 'afternoon', isHalal: true, entryFee: 10 },
      { name: `Historic Temple ${short}`, category: 'TOURIST_ATTRACTION', emoji: '🛕', desc: `An architectural marvel — this centuries-old temple showcases intricate carvings and spiritual serenity.`, cost: 0, isHiddenGem: true, isPhotoSpot: true, isIndoor: false, timeOfDay: 'morning', isHalal: true },
      { name: `Art Gallery ${short}`, category: 'TOURIST_ATTRACTION', emoji: '🎨', desc: `Contemporary art space showcasing local and regional artists in a beautiful setting.`, cost: 0, isHiddenGem: true, isPhotoSpot: true, isIndoor: true, timeOfDay: 'afternoon', isHalal: true, entryFee: 8 },
      { name: `Waterfront Promenade ${short}`, category: 'TOURIST_ATTRACTION', emoji: '🌊', desc: `Scenic waterfront with walking paths, street performers, and gorgeous sunset views.`, cost: 0, isHiddenGem: false, isPhotoSpot: true, isIndoor: false, timeOfDay: 'afternoon', isHalal: true },
      { name: `Cultural Village ${short}`, category: 'TOURIST_ATTRACTION', emoji: '🏘️', desc: `Living museum showcasing traditional Malaysian architecture, crafts, and cultural performances.`, cost: 0, isHiddenGem: true, isPhotoSpot: true, isIndoor: false, timeOfDay: 'afternoon', isHalal: true, entryFee: 15 },
      { name: `Mosque ${short}`, category: 'TOURIST_ATTRACTION', emoji: '🕌', desc: `Magnificent mosque with stunning Islamic architecture, serene gardens, and a welcoming atmosphere.`, cost: 0, isHiddenGem: false, isPhotoSpot: true, isIndoor: true, timeOfDay: 'morning', isHalal: true },
      { name: `Clock Tower ${short}`, category: 'TOURIST_ATTRACTION', emoji: '🕐', desc: `Iconic century-old clock tower standing proudly at the heart of town — the perfect starting point for exploring.`, cost: 0, isHiddenGem: true, isPhotoSpot: true, isIndoor: false, timeOfDay: 'morning', isHalal: true },
      { name: `Local Market ${short}`, category: 'TOURIST_ATTRACTION', emoji: '🏪', desc: `Bustling wet market where locals shop for fresh produce, spices, and traditional goods since dawn.`, cost: 0, isHiddenGem: true, isPhotoSpot: true, isIndoor: true, timeOfDay: 'morning', isHalal: true },
      { name: `Heritage Trail ${short}`, category: 'TOURIST_ATTRACTION', emoji: '🚶', desc: `A self-guided walk through ${short}'s most historic streets, colonial buildings, and hidden laneways.`, cost: 0, isHiddenGem: true, isPhotoSpot: true, isIndoor: false, timeOfDay: 'morning', isHalal: true },
      // Nature (10 variants)
      { name: `Nature Park ${short}`, category: 'NATURE', emoji: '🌿', desc: `Stunning natural sanctuary with trails, diverse wildlife, and peaceful picnic spots.`, cost: 0, isHiddenGem: true, isPhotoSpot: true, isIndoor: false, timeOfDay: 'morning', isHalal: true, entryFee: 5 },
      { name: `Hilltop View ${short}`, category: 'NATURE', emoji: '⛰️', desc: `Panoramic hilltop views of the entire region — best visited at sunrise or sunset.`, cost: 0, isHiddenGem: true, isPhotoSpot: true, isIndoor: false, timeOfDay: 'morning', isHalal: true },
      { name: `Waterfall Trail ${short}`, category: 'NATURE', emoji: '💧', desc: `A refreshing jungle trek leading to a stunning waterfall with natural swimming pools.`, cost: 0, isHiddenGem: true, isPhotoSpot: true, isIndoor: false, timeOfDay: 'morning', isHalal: true },
      { name: `Beach ${short}`, category: 'NATURE', emoji: '🏖️', desc: `Golden sands, gentle waves, and swaying palm trees — paradise near ${short}.`, cost: 0, isHiddenGem: false, isPhotoSpot: true, isIndoor: false, timeOfDay: 'afternoon', isHalal: true },
      { name: `River Cruise ${short}`, category: 'NATURE', emoji: '🚤', desc: `Scenic boat ride along the river with wildlife spotting and historical commentary.`, cost: 0, isHiddenGem: true, isPhotoSpot: true, isIndoor: false, timeOfDay: 'afternoon', isHalal: true, entryFee: 25 },
      { name: `Botanical Garden ${short}`, category: 'NATURE', emoji: '🌺', desc: `Exquisite botanical gardens featuring rare orchids, medicinal plants, and serene walking paths.`, cost: 0, isHiddenGem: false, isPhotoSpot: true, isIndoor: false, timeOfDay: 'morning', isHalal: true, entryFee: 3 },
      { name: `Mangrove Forest ${short}`, category: 'NATURE', emoji: '🌳', desc: `Explore the mysterious mangrove ecosystem on elevated boardwalks — spot monitor lizards, kingfishers, and mudskippers.`, cost: 0, isHiddenGem: true, isPhotoSpot: true, isIndoor: false, timeOfDay: 'morning', isHalal: true, entryFee: 10 },
      { name: `Hot Springs ${short}`, category: 'NATURE', emoji: '♨️', desc: `Natural geothermal hot springs with therapeutic mineral waters — soak away your travel fatigue.`, cost: 0, isHiddenGem: true, isPhotoSpot: true, isIndoor: false, timeOfDay: 'afternoon', isHalal: true, entryFee: 5 },
      { name: `Sunset Viewpoint ${short}`, category: 'NATURE', emoji: '🌅', desc: `The most spectacular sunset spot in the area — fiery skies, dramatic silhouettes, pure magic.`, cost: 0, isHiddenGem: true, isPhotoSpot: true, isIndoor: false, timeOfDay: 'evening', isHalal: true },
      // Hidden gems (6 variants)
      { name: `Secret Garden ${short}`, category: 'HIDDEN_GEM', emoji: '🌿', desc: `A magical hidden garden tucked away from the main roads — a peaceful oasis of greenery.`, cost: 0, isHiddenGem: true, isPhotoSpot: true, isIndoor: false, timeOfDay: 'afternoon', isHalal: true },
      { name: `Vintage Shop ${short}`, category: 'HIDDEN_GEM', emoji: '🕰️', desc: `A treasure trove of antiques, vinyl records, and vintage collectibles from across Southeast Asia.`, cost: 10, isHiddenGem: true, isPhotoSpot: true, isIndoor: true, timeOfDay: 'afternoon', isHalal: true },
      { name: `Local Artisan ${short}`, category: 'HIDDEN_GEM', emoji: '🖼️', desc: `Workshop of a master craftsperson — watch traditional crafts being made and buy direct.`, cost: 15, isHiddenGem: true, isPhotoSpot: true, isIndoor: true, timeOfDay: 'afternoon', isHalal: true },
      { name: `Old Town Lane ${short}`, category: 'HIDDEN_GEM', emoji: '🏛️', desc: `Charming heritage street with pre-war shophouses, street art, and tucked-away cafes.`, cost: 0, isHiddenGem: true, isPhotoSpot: true, isIndoor: false, timeOfDay: 'morning', isHalal: true },
      { name: `Underground Speakeasy ${short}`, category: 'HIDDEN_GEM', emoji: '🚪', desc: `A hidden door behind a bookshelf leads to a secret world of craft cocktails and jazz.`, cost: 30, isHiddenGem: true, isPhotoSpot: true, isIndoor: true, timeOfDay: 'night', isHalal: false },
      { name: `Street Art Alley ${short}`, category: 'HIDDEN_GEM', emoji: '🎨', desc: `A colorful back alley transformed by local artists — every wall is a masterpiece waiting to be discovered.`, cost: 0, isHiddenGem: true, isPhotoSpot: true, isIndoor: false, timeOfDay: 'afternoon', isHalal: true },
      // Photo spots (6 variants)
      { name: `Instagram Wall ${short}`, category: 'PHOTO_SPOT', emoji: '📸', desc: `Vibrant street art and murals — the most photographed wall in ${short}.`, cost: 0, isHiddenGem: false, isPhotoSpot: true, isIndoor: false, timeOfDay: 'afternoon', isHalal: true },
      { name: `Skybridge ${short}`, category: 'PHOTO_SPOT', emoji: '🌉', desc: `Stunning architectural bridge offering unique angles for cityscape photography.`, cost: 0, isHiddenGem: true, isPhotoSpot: true, isIndoor: false, timeOfDay: 'afternoon', isHalal: true },
      { name: `Lookout Tower ${short}`, category: 'PHOTO_SPOT', emoji: '🔭', desc: `360-degree observation deck with breathtaking panoramic views — the ultimate photo opportunity.`, cost: 0, isHiddenGem: true, isPhotoSpot: true, isIndoor: false, timeOfDay: 'afternoon', isHalal: true, entryFee: 5 },
      { name: `Colorful Stairs ${short}`, category: 'PHOTO_SPOT', emoji: '🌈', desc: `A rainbow-painted staircase winding through the hillside — every step is more photogenic than the last.`, cost: 0, isHiddenGem: true, isPhotoSpot: true, isIndoor: false, timeOfDay: 'morning', isHalal: true },
      // Night (8 variants)
      { name: `Rooftop Bar ${short}`, category: 'NIGHT_ACTIVITY', emoji: '🍸', desc: `Sip cocktails with panoramic night views of ${short}'s glittering skyline.`, cost: 35, isHiddenGem: true, isPhotoSpot: true, isIndoor: false, timeOfDay: 'night', isHalal: false },
      { name: `Live Music ${short}`, category: 'NIGHT_ACTIVITY', emoji: '🎵', desc: `Intimate venue featuring local bands, acoustic sets, and an incredible atmosphere.`, cost: 25, isHiddenGem: true, isPhotoSpot: false, isIndoor: true, timeOfDay: 'night', isHalal: false },
      { name: `Night Food Street ${short}`, category: 'NIGHT_ACTIVITY', emoji: '🍢', desc: `Lively food street that comes alive after dark with sizzling woks and aromatic spices.`, cost: 18, isHiddenGem: false, isPhotoSpot: true, isIndoor: false, timeOfDay: 'night', isHalal: true },
      { name: `Karaoke ${short}`, category: 'NIGHT_ACTIVITY', emoji: '🎤', desc: `Private karaoke rooms with extensive song selection — a fun night out with friends.`, cost: 20, isHiddenGem: false, isPhotoSpot: false, isIndoor: true, timeOfDay: 'night', isHalal: true },
      { name: `Night Bazaar ${short}`, category: 'NIGHT_ACTIVITY', emoji: '🏮', desc: `Lantern-lit night bazaar with handicrafts, clothing, and local delicacies — shopping under the stars.`, cost: 15, isHiddenGem: true, isPhotoSpot: true, isIndoor: false, timeOfDay: 'night', isHalal: true },
      { name: `Cendol & Teh Tarik ${short}`, category: 'NIGHT_ACTIVITY', emoji: '🍵', desc: `Late-night mamak stall serving frothy teh tarik and sweet cendol — the perfect end to any Malaysian evening.`, cost: 8, isHiddenGem: true, isPhotoSpot: false, isIndoor: false, timeOfDay: 'night', isHalal: true },
    ];
    return places;
  }

  /** Fetch real places from Google for any worldwide destination */
  private async fetchWorldwidePlaces(dest: string, lat: number, lng: number): Promise<CityPlace[]> {
    try {
      // Geocode if coords missing
      if (!lat || !lng) {
        const geoUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(dest)}&key=${this.GOOGLE_KEY}`;
        const geoR = await (await fetch(geoUrl)).json();
        if (geoR.results?.[0]) {
          lat = geoR.results[0].geometry.location.lat;
          lng = geoR.results[0].geometry.location.lng;
        } else return [];
      }

      // Search for multiple place types
      const searches = [
        { type: 'restaurant', cat: 'LUNCH', emoji: '🍜', time: 'afternoon' },
        { type: 'cafe', cat: 'CAFE_STOP', emoji: '☕', time: 'afternoon' },
        { type: 'tourist+attraction', cat: 'TOURIST_ATTRACTION', emoji: '🏛️', time: 'morning' },
        { type: 'park', cat: 'NATURE', emoji: '🌿', time: 'afternoon' },
        { type: 'night+club|bar', cat: 'NIGHT_ACTIVITY', emoji: '🌙', time: 'night' },
        { type: 'shopping+mall', cat: 'SHOPPING', emoji: '🛍️', time: 'afternoon' },
      ];

      const results: CityPlace[] = [];
      const seen = new Set<string>();

      for (const s of searches) {
        const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${s.type}+in+${encodeURIComponent(dest)}&location=${lat},${lng}&radius=15000&key=${this.GOOGLE_KEY}`;
        try {
          const data = await (await fetch(url)).json();
          for (const r of (data.results || []).slice(0, 6)) {
            if (seen.has(r.name)) continue;
            seen.add(r.name);
            results.push({
              name: r.name,
              category: s.cat,
              emoji: s.emoji,
              desc: r.formatted_address || dest,
              cost: (r.price_level || 2) * 15,
              isHiddenGem: (r.user_ratings_total || 0) < 100 && (r.rating || 0) >= 4.3,
              isPhotoSpot: s.cat === 'TOURIST_ATTRACTION' || s.cat === 'NATURE',
              isIndoor: s.cat === 'SHOPPING' || s.cat === 'CAFE_STOP',
              timeOfDay: s.time,
              isHalal: true,
              isVegetarian: s.type === 'cafe',
            });
          }
        } catch {}
      }
      return results;
    } catch { return []; }
  }

  /**
   * Generate a complete weekend plan using the hardcoded Malaysian city database.
   * Falls back to Google Places API for worldwide destinations.
   * This is the 100% availability guarantee.
   */
  generate(input: WeekendPlanInput): AIWeekendPlanOutput {
    const cityKey = this.getCityKey(input.destination);
    const cityPool = CITY_DB[cityKey] ?? [];
    // Always add generic places for variety — especially important for multi-day trips
    const genericPool = this.generateGenericPlaces(input.destination);
    let pool = [...cityPool, ...genericPool];

    const dayCount = this.getDayCount(input);
    const days: AIWeekendPlanOutput['days'] = [];

    // Filter by dietary preferences
    if (input.specialPreferences?.includes('HALAL_FOOD')) {
      pool = pool.filter(p => p.isHalal !== false);
    }
    if (input.specialPreferences?.includes('VEGETARIAN')) {
      pool = pool.filter(p => p.isVegetarian === true);
    }

    // Determine style tier
    const styleTier = input.travelStyles.includes('LUXURY') ? 'luxury' :
                      input.travelStyles.includes('BUDGET') ? 'budget' : 'midRange';

    // Separate pool by type
    const breakfasts = pool.filter(p => p.category === 'BREAKFAST');
    const lunches = pool.filter(p => p.category === 'LUNCH');
    const dinners = pool.filter(p => p.category === 'DINNER');
    const cafes = pool.filter(p => p.category === 'CAFE_STOP');
    const attractions = pool.filter(p => ['TOURIST_ATTRACTION', 'HIDDEN_GEM', 'PHOTO_SPOT', 'NATURE', 'SHOPPING'].includes(p.category));
    const nights = pool.filter(p => p.category === 'NIGHT_ACTIVITY');

    const themes = [
      'Heritage & Culture Explorer',
      'Food Trail & Hidden Gems',
      'Nature & Scenic Views',
      'Local Life & Night Markets',
    ];

    // Style-based filtering: prioritize stops matching user's travel style
    const styleBoosts: Record<string, string[]> = {
      FOODIE: ['BREAKFAST','LUNCH','DINNER','CAFE_STOP'],
      ADVENTURE: ['HIDDEN_GEM','NATURE','TOURIST_ATTRACTION'],
      NATURE: ['NATURE','PHOTO_SPOT'],
      PHOTOGRAPHY: ['PHOTO_SPOT','TOURIST_ATTRACTION','HIDDEN_GEM'],
      NIGHTLIFE: ['NIGHT_ACTIVITY','DINNER'],
      LUXURY: ['DINNER','SHOPPING'],
      BUDGET: ['BREAKFAST','LUNCH','CAFE_STOP'],
    };
    const boostedCategories = new Set<string>();
    for (const style of input.travelStyles) {
      for (const cat of (styleBoosts[style] || [])) boostedCategories.add(cat);
    }
    // Sort pool: boosted categories first, then shuffled
    if (boostedCategories.size > 0) {
      const boosted = pool.filter(p => boostedCategories.has(p.category));
      const rest = pool.filter(p => !boostedCategories.has(p.category));
      const shuffleArr = <T>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);
      pool = [...shuffleArr(boosted), ...shuffleArr(rest)];
    }

    // Shuffle function
    const shuffle = <T>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);

    // Track places used across ALL days — no repeats
    const globalUsed = new Set<string>();

    for (let d = 0; d < dayCount; d++) {
      const dayStops: AIWeekendPlanOutput['days'][0]['stops'] = [];
      const dayUsed = new Set<string>();

      const pick = <T extends CityPlace>(arr: T[], exclude?: Set<string>): T | null => {
        // Pick places NOT used in any day — strict no-reuse
        let available = arr.filter(a => !globalUsed.has(a.name));
        if (available.length === 0) {
          // For long trips, CREATE synthetic unique places from the template
          const template = arr[0];
          if (!template) return null;
          const destShort = input.destination?.split(',')[0]?.trim() || 'Town';
          const syntheticName = `${template.name} (${destShort} #${d + 1})`;
          const synthetic: T = { ...template, name: syntheticName, desc: `Another great ${template.category?.toLowerCase() || 'spot'} in ${destShort}.` };
          globalUsed.add(syntheticName);
          return synthetic;
        }
        const picked = available[Math.floor(Math.random() * available.length)]!;
        globalUsed.add(picked.name); // Track globally
        return picked;
      };

      // 7:30 AM — Breakfast
      const bfast = pick(breakfasts, dayUsed);
      if (bfast) {
        dayUsed.add(bfast.name);
        dayStops.push(this.toAIStop(bfast, 1, '07:30', '08:30', 60, 'WALKING', 400, 5, 0));
      }

      // 9:00 AM — Morning attraction
      const morning = pick(attractions.filter(a => a.timeOfDay === 'morning'), dayUsed);
      if (morning) {
        dayUsed.add(morning.name);
        dayStops.push(this.toAIStop(morning, dayStops.length + 1, '09:00', '10:30', 90, 'GRAB', 3500, 15, 12));
      }

      // 11:00 AM — Cafe stop
      const cafe = pick(cafes, dayUsed);
      if (cafe) {
        dayUsed.add(cafe.name);
        dayStops.push(this.toAIStop(cafe, dayStops.length + 1, '11:00', '11:45', 45, 'WALKING', 600, 8, 0));
      }

      // 12:30 PM — Lunch
      const lunch = pick(lunches, dayUsed);
      if (lunch) {
        dayUsed.add(lunch.name);
        dayStops.push(this.toAIStop(lunch, dayStops.length + 1, '12:30', '13:30', 60, 'GRAB', 2800, 12, 10));
      }

      // 2:00 PM — Afternoon activity
      const afternoon = pick(attractions.filter(a => a.timeOfDay === 'afternoon'), dayUsed);
      if (afternoon) {
        dayUsed.add(afternoon.name);
        dayStops.push(this.toAIStop(afternoon, dayStops.length + 1, '14:00', '15:30', 90, 'WALKING', 800, 10, 0));
      } else {
        const fallback = pick(attractions, dayUsed);
        if (fallback) {
          dayUsed.add(fallback.name);
          dayStops.push(this.toAIStop(fallback, dayStops.length + 1, '14:00', '15:30', 90, 'GRAB', 3000, 12, 10));
        }
      }

      // 4:00 PM — Second cafe or photo spot
      const photo = pick([...attractions.filter(a => a.isPhotoSpot), ...cafes], dayUsed);
      if (photo) {
        dayUsed.add(photo.name);
        dayStops.push(this.toAIStop(photo, dayStops.length + 1, '16:00', '16:45', 45, 'WALKING', 500, 6, 0));
      }

      // 6:00 PM — Dinner
      const dinner = pick(dinners, dayUsed);
      if (dinner) {
        dayUsed.add(dinner.name);
        dayStops.push(this.toAIStop(dinner, dayStops.length + 1, '18:00', '19:15', 75, 'GRAB', 3500, 15, 12));
      }

      // 8:30 PM — Night activity
      const night = pick(nights.length > 0 ? nights : shuffle([...dinners, ...attractions.filter(a => a.timeOfDay === 'night')]), dayUsed);
      if (night && dayStops.length < 8) {
        dayUsed.add(night.name);
        dayStops.push(this.toAIStop(night, dayStops.length + 1, '20:30', '22:00', 90, 'WALKING', 600, 8, 0));
      }

      // Ensure at least 5 stops
      while (dayStops.length < 5) {
        const extra = pick(pool, dayUsed);
        if (!extra) break;
        dayUsed.add(extra.name);
        dayStops.push(this.toAIStop(extra, dayStops.length + 1, '15:00', '16:00', 60, 'GRAB', 2500, 10, 8));
      }

      // Add all day's stops to globalUsed so they don't appear in other days
      for (const s of dayStops) {
        globalUsed.add(s.placeName);
      }

      days.push({
        dayNumber: d + 1,
        theme: themes[d % themes.length]!,
        weatherNote: 'Partly cloudy, 28°C — dress light and bring water',
        stops: dayStops,
      });
    }

    // Build budget — scale to match user's budget (±RM 20)
    const city = input.destination;
    const rawFoodCost = days.reduce((sum, day) =>
      sum + day.stops.reduce((s, stop) => s + stop.estimatedSpend, 0), 0);
    const rawEntryFees = days.reduce((sum, day) =>
      sum + day.stops.reduce((s, stop) => s + stop.entryFee, 0), 0);
    const rawHotelCost = getHotelCost(city, input.groupType, styleTier) * Math.max(1, dayCount - 1);
    const rawTransportCost = dayCount * input.groupSize * 30;
    const totalDistanceEstimate = dayCount * 15;
    const rawFuelCost = input.transportMode === 'DRIVING' ? totalDistanceEstimate * 0.25 : 0;
    const rawTollCost = input.transportMode === 'DRIVING' ? 15 : 0;
    const rawParkingCost = input.transportMode === 'DRIVING' ? dayCount * 8 : 0;

    // Raw subtotal (without emergency buffer)
    const rawSubtotal = rawFoodCost + rawEntryFees + rawHotelCost + rawTransportCost + rawFuelCost + rawTollCost + rawParkingCost;

    // Target subtotal: budget minus emergency buffer (12.5%)
    const targetSubtotal = input.budget / 1.125;
    const scaleFactor = rawSubtotal > 0 ? targetSubtotal / rawSubtotal : 1;

    // Apply scaling
    const totalFoodCost = Math.round(rawFoodCost * scaleFactor * 100) / 100;
    const totalEntryFees = Math.round(rawEntryFees * scaleFactor * 100) / 100;
    const hotelCost = Math.round(rawHotelCost * scaleFactor * 100) / 100;
    const transportCost = Math.round(rawTransportCost * scaleFactor * 100) / 100;
    const fuelCost = Math.round(rawFuelCost * scaleFactor * 100) / 100;
    const tollCost = Math.round(rawTollCost * scaleFactor * 100) / 100;
    const parkingCost = Math.round(rawParkingCost * scaleFactor * 100) / 100;

    const subtotal = totalFoodCost + totalEntryFees + hotelCost + transportCost + fuelCost + tollCost + parkingCost;
    const emergencyPct = 12.5;
    const emergencyBuffer = Math.round(subtotal * (emergencyPct / 100) * 100) / 100;
    const grandTotal = Math.round((subtotal + emergencyBuffer) * 100) / 100;

    // Scale individual stop costs
    for (const day of days) {
      for (const stop of day.stops) {
        stop.estimatedSpend = Math.round(stop.estimatedSpend * scaleFactor * 100) / 100;
        stop.entryFee = Math.round((stop.entryFee || 0) * scaleFactor * 100) / 100;
      }
    }

    const totalStops = days.reduce((s, d) => s + d.stops.length, 0);

    return {
      title: `${dayCount}-Day ${input.destination} ${styleTier === 'luxury' ? 'Luxury' : styleTier === 'budget' ? 'Budget' : ''} Weekend`,
      days,
      budgetBreakdown: {
        hotel: { estimatedCost: hotelCost, suggestion: this.getHotelSuggestions(input.destination, styleTier, input.groupType)[0]?.name || 'Recommended', suggestionRating: 4.2, hotelOptions: this.getHotelSuggestions(input.destination, styleTier, input.groupType) },
        food: { estimatedCost: totalFoodCost, mealCount: totalStops },
        transport: { estimatedCost: transportCost, primaryMode: input.transportMode },
        tickets: { estimatedCost: totalEntryFees, attractions: [] },
        fuel: { estimatedCost: fuelCost, totalDistanceKm: totalDistanceEstimate },
        toll: { estimatedCost: tollCost, tollRoutes: [] },
        parking: { estimatedCost: parkingCost, parkingSpots: dayCount * 3 },
        emergencyBuffer: { estimatedCost: emergencyBuffer, percentage: emergencyPct },
        total: grandTotal,
      },
      tips: MALAYSIA_TIPS.sort(() => Math.random() - 0.5).slice(0, 4),
    };
  }

  // =============================================================================
  // HELPERS
  // =============================================================================

  private toAIStop(
    p: CityPlace,
    order: number,
    time: string,
    endTime: string,
    duration: number,
    transportMode: string,
    distance: number,
    transportCost: number,
    entryFee: number,
  ): AIWeekendPlanOutput['days'][0]['stops'][0] {
    return {
      order,
      time,
      endTime,
      durationMinutes: duration,
      placeId: `citydb-${p.name.toLowerCase().replace(/\s+/g, '-')}`,
      placeName: p.name,
      category: p.category as any,
      emoji: p.emoji,
      description: p.desc,
      estimatedSpend: p.cost,
      entryFee: p.entryFee ?? entryFee,
      isHiddenGem: p.isHiddenGem,
      isPhotoSpot: p.isPhotoSpot,
      isIndoor: p.isIndoor,
      crowdLevel: p.timeOfDay === 'night' ? 'low' : 'medium',
      aiReasoning: `Selected for your ${p.category.toLowerCase().replace('_', ' ')} — ${p.isHiddenGem ? 'a hidden gem locals love' : 'a highly rated spot'}`,
      transportFromPrev: {
        mode: transportMode as any,
        distanceMeters: distance,
        durationMinutes: Math.ceil(distance / 80),
        estimatedCost: transportCost,
      },
    };
  }

  /** Generate destination-specific hotels when city isn't in the hardcoded database */
  private generateCityHotels(dest: string): any[] {
    const short = dest.split(',')[0]!.trim();
    const hotelPhotos = ['1566073771','1571896342','1520250497','1564501049','1551882547'];
    return [
      {name:`${short} Grand Hotel`,price:280,rating:4.6,description:`The premier luxury hotel in ${short} — elegant rooms, exceptional service, and the best location in town for exploring.`,amenities:['Pool','Spa','Fine Dining','Gym','City View'],photoUrl:`https://images.unsplash.com/photo-${hotelPhotos[0]}?w=400&h=300&fit=crop&q=80`},
      {name:`${short} Boutique Stay`,price:180,rating:4.4,description:`Charming boutique hotel in the heart of ${short} with uniquely designed rooms and personalized local recommendations.`,amenities:['Free WiFi','Cafe','Garden','Local Art','Breakfast'],photoUrl:`https://images.unsplash.com/photo-${hotelPhotos[1]}?w=400&h=300&fit=crop&q=80`},
      {name:`${short} Budget Inn`,price:90,rating:4.1,description:`Clean, comfortable, and centrally located — the best value accommodation in ${short} for savvy travelers.`,amenities:['Free WiFi','24h Front Desk','AC','Hot Shower','Luggage Storage'],photoUrl:`https://images.unsplash.com/photo-${hotelPhotos[2]}?w=400&h=300&fit=crop&q=80`},
      {name:`${short} Resort & Spa`,price:350,rating:4.5,description:`Secluded resort just outside ${short} with lush gardens, a world-class spa, and breathtaking views.`,amenities:['Infinity Pool','Spa','Nature Trail','Fine Dining','Yoga'],photoUrl:`https://images.unsplash.com/photo-${hotelPhotos[3]}?w=400&h=300&fit=crop&q=80`},
      {name:`${short} Homestay`,price:70,rating:4.3,description:`Authentic local homestay experience with home-cooked meals, cultural activities, and genuine Malaysian hospitality.`,amenities:['Home Cooking','Cultural Tours','Garden','Free WiFi','Laundry'],photoUrl:`https://images.unsplash.com/photo-${hotelPhotos[4]}?w=400&h=300&fit=crop&q=80`},
    ];
  }

  private getHotelSuggestions(dest: string, tier: string, group: string): Array<{name:string;price:number;rating:number;description:string;amenities:string[];roomsNeeded:number;totalPrice:number}> {
    const city = this.getCityKey(dest);
    const paxPerRoom = 2; // standard double occupancy
    const groupSize = group === 'SOLO' ? 1 : group === 'COUPLE' ? 2 : group === 'FAMILY' ? 4 : 4;
    const roomsNeeded = Math.max(1, Math.ceil(groupSize / paxPerRoom));

    const hotels: Record<string, any[]> = {
      penang: [
        {name:'Eastern & Oriental Hotel',price:350,rating:4.7,description:'Grand colonial heritage hotel on the seafront — a Penang icon since 1885 with stunning ocean views, marble bathrooms, and legendary afternoon tea.',amenities:['Infinity Pool','Spa','Sea View','Fine Dining','Butler','Heritage Wing']},
        {name:'Shangri-La Rasa Sayang',price:420,rating:4.8,description:'5-star resort on Batu Ferringhi beach with sprawling tropical gardens, championship golf course, and world-renowned CHI Spa.',amenities:['Private Beach','Golf','Spa','3 Pools','Kids Club','6 Restaurants']},
        {name:'G Hotel Kelawai',price:280,rating:4.6,description:'Contemporary luxury hotel on Gurney Drive with stylish interiors, rooftop infinity pool, and panoramic sea views.',amenities:['Rooftop Pool','Gym','Bar','Sea View','Free Mini Bar']},
        {name:'Muntri Mews',price:200,rating:4.5,description:'Boutique heritage hotel in a restored 19th-century shophouse — each room uniquely designed with antique furnishings and local art.',amenities:['Free WiFi','Heritage','Cafe','Bicycle','Courtyard']},
        {name:'JEN Penang Georgetown',price:150,rating:4.3,description:'Modern hotel in the heart of Georgetown\'s UNESCO zone — walking distance to street art, cafes, and clan jetties.',amenities:['Pool','Gym','City View','Restaurant','Bar']},
        {name:'Cheong Fatt Tze Blue Mansion',price:320,rating:4.6,description:'UNESCO award-winning heritage boutique hotel in an iconic indigo courtyard mansion — featured in Crazy Rich Asians.',amenities:['Heritage','Guided Tour','Courtyard Pool','Fine Dining']},
        {name:'Macalister Mansion',price:260,rating:4.5,description:'Design-forward boutique hotel in a restored colonial mansion with art installations, French-inspired dining, and a serene pool.',amenities:['Art Gallery','Pool','Fine Dining','Bar','Garden']},
        {name:'The Prestige Hotel',price:230,rating:4.4,description:'Victorian-inspired design hotel with whimsical architecture, rooftop pool, and a secret garden in the lobby.',amenities:['Rooftop Pool','Gym','Restaurant','Garden Lobby']},
        {name:'Tido Hostel',price:50,rating:4.1,description:'Stylish budget hostel with pod-style beds, rooftop terrace, and social atmosphere — perfect for solo travelers.',amenities:['Free WiFi','Rooftop','Laundry','Common Area']},
        {name:'Hotel Penaga',price:180,rating:4.2,description:'Heritage hotel combining three restored shophouses with spacious suites, antique furniture, and a tranquil spa.',amenities:['Spa','Pool','Heritage','Restaurant','Bar']},
      ],
      kl: [
        {name:'Mandarin Oriental KL',price:500,rating:4.8,description:'5-star luxury at the foot of Petronas Towers with panoramic skyline views, award-winning restaurants, and an infinity pool overlooking KLCC Park.',amenities:['Infinity Pool','Spa','Petronas View','Fine Dining','Butler']},
        {name:'Four Seasons KL',price:650,rating:4.9,description:'Ultra-luxury hotel adjacent to Petronas Towers with world-class service, rooftop pool, and Michelin-starred dining.',amenities:['Rooftop Pool','Michelin Dining','Spa','Kids Club','Petronas View']},
        {name:'W Kuala Lumpur',price:450,rating:4.7,description:'Vibrant luxury hotel with bold design, stunning Petronas views, and KL\'s hottest rooftop bar and pool scene.',amenities:['Rooftop Pool','Rooftop Bar','Spa','Gym','Petronas View']},
        {name:'Traders Hotel KL',price:220,rating:4.4,description:'Famous for its rooftop pool with direct Twin Towers views — the ultimate KL skyline experience at an accessible price.',amenities:['Rooftop Pool','Twin Tower View','Bar','Gym','Restaurant']},
        {name:'Aloft KL Sentral',price:160,rating:4.2,description:'Trendy hotel connected to KL Sentral station — perfect for easy transport access across the city with live music at the W XYZ bar.',amenities:['Pool','Live Music Bar','Transit Access','Gym','24h Pantry']},
        {name:'The RuMa Hotel',price:380,rating:4.7,description:'Intimate luxury hotel inspired by Malaysian heritage with copper accents, a stunning pool, and personalized butler service.',amenities:['Pool','Butler','Spa','Fine Dining','Library Lounge']},
        {name:'EQ Kuala Lumpur',price:300,rating:4.6,description:'Iconic hotel at the former Equatorial site with KL\'s highest rooftop bar, infinity pool, and panoramic city views.',amenities:['Rooftop Bar','Infinity Pool','Spa','Gym','Sky Dining']},
        {name:'Banyan Tree KL',price:550,rating:4.8,description:'Sky-high luxury with rooms from the 53rd floor, each with private jacuzzi and breathtaking views over the city.',amenities:['Sky Pool','In-Room Jacuzzi','Spa','Fine Dining','Butler']},
        {name:'The Bed KLCC',price:60,rating:4.0,description:'Social hostel in the city center with capsule beds, co-working space, and a friendly community vibe near major attractions.',amenities:['Free WiFi','Co-Working','Cafe','Lockers','Common Area']},
        {name:'KLoe Hotel',price:120,rating:4.3,description:'Creative boutique hotel with artsy rooms, a gorgeous courtyard pool, and an in-house record store in the heart of the city.',amenities:['Courtyard Pool','Record Store','Cafe','Garden','Art Library']},
      ],
      melaka: [
        {name:'The Majestic Malacca',price:280,rating:4.6,description:'Restored 1920s mansion blending Straits Chinese elegance with modern luxury on the riverfront with exceptional Peranakan dining.',amenities:['Pool','Spa','River View','Heritage','Fine Dining']},
        {name:'Casa del Rio Melaka',price:250,rating:4.5,description:'Mediterranean-inspired riverside hotel with rooftop pool, stunning river views, and walking distance to Jonker Street.',amenities:['Rooftop Pool','River View','Restaurant','Bar','Spa']},
        {name:'Jonker Boutique Hotel',price:120,rating:4.3,description:'Charming heritage hotel steps from Jonker Street — beautifully restored with Peranakan details throughout.',amenities:['Free WiFi','Heritage','Near Jonker','Breakfast','Cafe']},
        {name:'DoubleTree by Hilton Melaka',price:200,rating:4.4,description:'Modern Hilton with spacious rooms, outdoor pool, and views of the Malacca Strait — great for families.',amenities:['Pool','Gym','Sea View','Kids Pool','Restaurant']},
        {name:'Liu Men Melaka',price:180,rating:4.5,description:'Art Deco heritage hotel with 30 uniquely designed rooms, a hidden courtyard, and fine dining near Jonker Street.',amenities:['Courtyard','Heritage','Fine Dining','Bar','Butler']},
        {name:'1825 Gallery Hotel',price:140,rating:4.2,description:'Art-themed boutique hotel housed in a former bank building with creative rooms and a gallery space.',amenities:['Art Gallery','Cafe','Free WiFi','City View']},
      ],
      langkawi: [
        {name:'The Datai Langkawi',price:800,rating:4.9,description:'Ultra-luxury rainforest resort on a private beach — consistently ranked among the world\'s best hotels with nature at its doorstep.',amenities:['Private Beach','Spa','Rainforest','Fine Dining','Golf','Nature Guide']},
        {name:'Four Seasons Langkawi',price:700,rating:4.8,description:'Stunning beachfront resort with Moroccan-inspired architecture, private pavilions, and a mile-long white sand beach.',amenities:['Private Beach','Spa','Water Sports','Kids Club','Tennis']},
        {name:'Tanjung Rhu Resort',price:350,rating:4.5,description:'Secluded beachfront resort on Langkawi\'s most beautiful beach with lush gardens, attentive service, and unforgettable sunsets.',amenities:['Beachfront','Pool','Spa','Water Sports','Sunset Bar']},
        {name:'Casa del Mar',price:250,rating:4.4,description:'Intimate Mediterranean-style beachfront boutique hotel on Pantai Cenang with personalized service and a home-away-from-home feel.',amenities:['Beachfront','Pool','Bar','Free WiFi','Library']},
        {name:'The Ritz-Carlton Langkawi',price:650,rating:4.8,description:'Luxury overwater villas and rainforest suites with personal butlers, spa sanctuary, and three stunning pools.',amenities:['Overwater Villas','Spa','3 Pools','Butler','Fine Dining']},
        {name:'Aloft Langkawi',price:140,rating:4.1,description:'Fun, modern hotel on Pantai Tengah with colorful design, pool bar, and live music — great value on the beach strip.',amenities:['Pool','Live Music','Bar','Gym','Beach Access']},
        {name:'Berjaya Langkawi Resort',price:280,rating:4.3,description:'Expansive rainforest resort with overwater chalets, private beach, and wildlife roaming freely through the grounds.',amenities:['Overwater Chalets','Private Beach','Spa','Restaurants','Nature']},
      ],
    };
    // Destination-specific hotels, or generate from destination name
    const cityHotels = hotels[city] || this.generateCityHotels(dest);
    const multiplier = tier === 'luxury' ? 1.2 : tier === 'budget' ? 0.6 : 0.85;
    return cityHotels.map(h => ({
      ...h,
      price: Math.round(h.price * multiplier),
      roomsNeeded,
      totalPrice: Math.round(h.price * multiplier * roomsNeeded),
    }));
  }

  private getCityKey(dest: string): string {
    const d = dest.toLowerCase().trim();
    if (d.includes('penang') || d.includes('george town')) return 'penang';
    if (d.includes('kl') || d.includes('kuala lumpur')) return 'kl';
    if (d.includes('melaka') || d.includes('malacca')) return 'melaka';
    if (d.includes('langkawi')) return 'langkawi';
    return d;
  }

  private getDayCount(input: any): number {
    // Use the dayCount if provided (1-8), otherwise fall back to planType
    if (input.dayCount && input.dayCount >= 1 && input.dayCount <= 8) return input.dayCount;
    switch (input.planType) {
      case 'ONE_DAY': return 1;
      case 'TWO_DAY': return 2;
      case 'THREE_DAY': return 3;
      case 'FULL_WEEKEND': return 2;
      default: return 2;
    }
  }
}
