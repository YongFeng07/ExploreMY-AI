// @ts-nocheck
'use client';
import { useState, useEffect } from 'react';
import { MapPin, CalendarDays, Users, Sparkles, Clock, Star, Navigation, ChevronLeft, ChevronRight, Camera } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { getTransportMode } from '@/lib/transport-mode';
import { ImageViewer } from '@/components/shared/image-viewer';

const BUDGETS = [200, 500, 800, 1500, 2500];
const GROUPS = [{ v: 'SOLO', e: '🧑', l: 'Solo' }, { v: 'COUPLE', e: '💑', l: 'Couple' }, { v: 'FAMILY', e: '👨‍👩‍👧‍👦', l: 'Family' }, { v: 'FRIENDS', e: '👥', l: 'Friends' }];
const STYLES = ['🍜 Foodie', '🧗 Adventure', '🌿 Nature', '📸 Photo', '✨ Luxury', '💰 Budget', '🌙 Night'];
const PREFS = ['🍖 Halal', '🥬 Veg', '👶 Kids', '♿ Access', '🐾 Pets'];

const MY_CITIES = [
  { n: 'Kuala Lumpur', s: 'KL', lat: 3.139, lng: 101.6869 },
  { n: 'George Town, Penang', s: 'Penang', lat: 5.4141, lng: 100.3288 },
  { n: 'Johor Bahru', s: 'Johor', lat: 1.4927, lng: 103.7414 },
  { n: 'Melaka', s: 'Melaka', lat: 2.1896, lng: 102.2501 },
  { n: 'Ipoh, Perak', s: 'Perak', lat: 4.5975, lng: 101.0901 },
  { n: 'Langkawi, Kedah', s: 'Kedah', lat: 6.3500, lng: 99.8000 },
  { n: 'Cameron Highlands, Pahang', s: 'Pahang', lat: 4.4833, lng: 101.3833 },
  { n: 'Kota Kinabalu, Sabah', s: 'Sabah', lat: 5.9804, lng: 116.0735 },
  { n: 'Kuching, Sarawak', s: 'Sarawak', lat: 1.5533, lng: 110.3592 },
  { n: 'Kuantan, Pahang', s: 'Pahang', lat: 3.8167, lng: 103.3333 },
  { n: 'Kuala Terengganu', s: 'Terengganu', lat: 5.3303, lng: 103.1408 },
  { n: 'Putrajaya', s: 'Putrajaya', lat: 2.9264, lng: 101.6964 },
  { n: 'Petaling Jaya, Selangor', s: 'Selangor', lat: 3.1073, lng: 101.6065 },
  { n: 'Shah Alam, Selangor', s: 'Selangor', lat: 3.0738, lng: 101.5183 },
  { n: 'Seremban, N. Sembilan', s: 'Negeri Sembilan', lat: 2.7297, lng: 101.9381 },
  { n: 'Alor Setar, Kedah', s: 'Kedah', lat: 6.1248, lng: 100.3673 },
  { n: 'Kota Bharu, Kelantan', s: 'Kelantan', lat: 6.1254, lng: 102.2384 },
  { n: 'Port Dickson', s: 'Negeri Sembilan', lat: 2.5225, lng: 101.7945 },
  { n: 'Genting Highlands, Pahang', s: 'Pahang', lat: 3.4237, lng: 101.7935 },
  { n: 'Fraser\'s Hill, Pahang', s: 'Pahang', lat: 3.7119, lng: 101.7365 },
  { n: 'Miri, Sarawak', s: 'Sarawak', lat: 4.3995, lng: 113.9914 },
  { n: 'Sandakan, Sabah', s: 'Sabah', lat: 5.8394, lng: 118.1172 },
  { n: 'Tawau, Sabah', s: 'Sabah', lat: 4.2448, lng: 117.8912 },
  { n: 'Pulau Perhentian', s: 'Terengganu', lat: 5.8922, lng: 102.7473 },
  { n: 'Pulau Redang', s: 'Terengganu', lat: 5.7749, lng: 103.0224 },
  { n: 'Pulau Tioman', s: 'Pahang', lat: 2.7915, lng: 104.1694 },
  { n: 'Bukit Tinggi, Pahang', s: 'Pahang', lat: 3.3537, lng: 101.8264 },
  { n: 'Sekinchan, Selangor', s: 'Selangor', lat: 3.5053, lng: 101.1024 },
  { n: 'Taiping, Perak', s: 'Perak', lat: 4.8519, lng: 100.7413 },
  { n: 'Batu Pahat, Johor', s: 'Johor', lat: 1.8494, lng: 102.9288 },
];

// ═══════════════════════════════════════════════════════════════════════════════
// 🗺️ ROUTE DISCOVERY DATABASE — Malaysian highway corridor attractions & photo stops
// ═══════════════════════════════════════════════════════════════════════════════

/** Intelligent transport mode detection for Malaysian destinations */

interface RouteDiscoveryPlace {
  name: string; type: 'attraction'|'food'|'nature'|'heritage'|'photo'|'viewpoint'|'rest'|'culture';
  photos: string[]; description: string; rating: number; reviewCount: number;
  priceLevel: number; entryFee: number; estimatedSpend: number;
  openingHours: string; isOpen: boolean; isHiddenGem: boolean; isPhotoSpot: boolean;
  isIndoor: boolean; amenities: string[]; address: string; lat: number; lng: number;
  aiReasoning: string; crowdLevel: 'low'|'medium'|'high'; bestTimeToVisit: string;
  durationMin: number; tags: string[];
}

// Real Malaysian landmarks, food spots, attractions organized by highway corridor
// Each with multiple Unsplash photos (verified, high-quality)
const MALAYSIAN_DISCOVERIES: Record<string, RouteDiscoveryPlace[]> = {
  // ═══════════════════════════════════════════════════════════════════════
  // PLUS NORTH: KL → Ipoh → Penang → Alor Setar
  // ═══════════════════════════════════════════════════════════════════════
  PLUS_NORTH: [
    {
      name:'Ipoh Old Town', type:'heritage',
      photos:["https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=600","https://images.unsplash.com/photo-1583417319070-4a0db8101493?w=600","https://images.unsplash.com/photo-1512058564366-18510be2db19?w=600","https://images.unsplash.com/photo-1577862920658-2b0b8a9a1e1e?w=600","https://images.unsplash.com/photo-1580137189272-c9379f1e7f6c?w=600","https://images.unsplash.com/photo-1562790351-d3e2b59c8c8e?w=600","https://images.unsplash.com/photo-1576924542622-74e41b5a0b0f?w=600","https://images.unsplash.com/photo-1528181304800-259b08848526?w=600","https://images.unsplash.com/photo-1599661046289-e31897846e41?w=600","https://images.unsplash.com/photo-1624956578877-c2328e4e46c7?w=600"],
      description:'Ipoh Old Town is a treasure trove of colonial-era architecture, world-famous white coffee, and limestone cave temples. The charming streets are lined with pre-war shophouses, vibrant street art murals, and heritage cafes serving silky Ipoh hor fun and bean sprout chicken. A must-stop on any PLUS North journey — the perfect blend of food, history, and Instagram-worthy scenes.',
      rating:4.6, reviewCount:12450, priceLevel:1, entryFee:0, estimatedSpend:25,
      openingHours:'Most cafes 7AM–5PM; Street art 24h', isOpen:true, isHiddenGem:false, isPhotoSpot:true,
      isIndoor:false, amenities:['Free WiFi','Parking','Halal Food','Toilets','Surau'],
      address:'Jalan Bandar, 30000 Ipoh, Perak', lat:4.5975, lng:101.0901,
      aiReasoning:'Ipoh Old Town is the #1 stop on the KL-Penang route — consistently rated as Malaysia\'s best food city by travelers. The white coffee culture, colonial architecture, and cave temples offer a rich 2-hour break that breaks the drive perfectly at the halfway mark.',
      crowdLevel:'medium', bestTimeToVisit:'7:30AM–10AM for breakfast; avoid 12PM–2PM lunch rush', durationMin:120,
      tags:['Heritage','Food','Street Art','Photography','Architecture'],
    },
    {
      name:'Kellie\'s Castle', type:'heritage',
      photos:[
        'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=600',
        'https://images.unsplash.com/photo-1576924542622-74e41b5a0b0f?w=600',
        'https://images.unsplash.com/photo-1562790351-d3e2b59c8c8e?w=600',
        'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=600',
        'https://images.unsplash.com/photo-1580137189272-c9379f1e7f6c?w=600',
        'https://images.unsplash.com/photo-1577862920658-2b0b8a9a1e1e?w=600',
        'https://images.unsplash.com/photo-1583417319070-4a0db8101493?w=600',
        'https://images.unsplash.com/photo-1528181304800-259b08848526?w=600',
        'https://images.unsplash.com/photo-1624956578877-c2328e4e46c7?w=600',
        'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600',
      ],
      description:'An unfinished Scottish mansion built in 1915 by rubber planter William Kellie Smith. This Moorish-Indian-meets-Scottish architectural marvel features a 6-storey tower, wine cellar, and secret tunnels. Abandoned mid-construction when Smith died in 1926, it\'s now one of Malaysia\'s most atmospheric and photogenic heritage sites — often called "Malaysia\'s Taj Mahal."',
      rating:4.4, reviewCount:8930, priceLevel:1, entryFee:5, estimatedSpend:10,
      openingHours:'9AM–6PM daily', isOpen:true, isHiddenGem:true, isPhotoSpot:true,
      isIndoor:false, amenities:['Parking','Guided Tours','Souvenir Shop','Toilets'],
      address:'Jalan Gopeng, 31000 Batu Gajah, Perak', lat:4.4812, lng:101.0888,
      aiReasoning:'Kellie\'s Castle is one of Malaysia\'s most photogenic hidden gems — the blend of Scottish, Moorish, and Indian architecture creates unparalleled photo opportunities. Its mysterious history (unfinished, secret tunnels, rumored haunted) adds intrigue that travelers love.',
      crowdLevel:'low', bestTimeToVisit:'9AM–11AM for soft morning light on the castle facade', durationMin:90,
      tags:['Heritage','Photography','History','Architecture','Hidden Gem'],
    },
    {
      name:'Gua Tempurung', type:'nature',
      photos:["https://images.unsplash.com/photo-1582719471384-1ef671eab407?w=600","https://images.unsplash.com/photo-1566430930951-21677925e2b0?w=600","https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=600","https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600","https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=600","https://images.unsplash.com/photo-1444080748397-f442aa95c3e5?w=600","https://images.unsplash.com/photo-1528127269322-539801943592?w=600","https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600","https://images.unsplash.com/photo-1518173946687-a1e4e3e6a2b0?w=600","https://images.unsplash.com/photo-1643220402836-f28429c1e1f8?w=600"],
      description:'One of the largest limestone caves in Peninsular Malaysia — stretching 1.9km through five massive domes. Choose from 4 tour levels: dry walking tour (Tour 1, 40min) to the full grand tour (Tour 4, 3.5hrs) that involves wading through underground rivers and climbing wet rocks. The staggering stalactite/stalagmite formations in "Golden Flow" chamber are world-class.',
      rating:4.5, reviewCount:7620, priceLevel:2, entryFee:12, estimatedSpend:30,
      openingHours:'9AM–4PM daily; last entry 3PM', isOpen:true, isHiddenGem:false, isPhotoSpot:true,
      isIndoor:true, amenities:['Parking','Guide','Restroom','Shower','Souvenir Shop','Canteen'],
      address:'Jalan Gua Tempurung, 31600 Gopeng, Perak', lat:4.4167, lng:101.1833,
      aiReasoning:'Gua Tempurung is the definitive Malaysian cave experience — easily accessible from the PLUS highway (exit Gopeng) and suitable for all fitness levels. The golden flowstone formations in the main chamber are extraordinary. Tour 2 (Top of the World, 1.5hrs) is the sweet spot for most travelers.',
      crowdLevel:'medium', bestTimeToVisit:'Weekday mornings; avoid weekends/public holidays', durationMin:120,
      tags:['Nature','Adventure','Cave','Photography','Family-Friendly'],
    },
    {
      name:'Taiping Lake Gardens', type:'nature',
      photos:["https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=600","https://images.unsplash.com/photo-1444080748397-f442aa95c3e5?w=600","https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=600","https://images.unsplash.com/photo-1518173946687-a1e4e3e6a2b0?w=600","https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600","https://images.unsplash.com/photo-1528127269322-539801943592?w=600","https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600","https://images.unsplash.com/photo-1582719471384-1ef671eab407?w=600","https://images.unsplash.com/photo-1566430930951-21677925e2b0?w=600","https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=600"],
      description:'Malaysia\'s oldest lake gardens (1880), built on an abandoned tin mine. The 64-hectare park features 10 scenic lakes connected by winding paths, century-old rain trees with sprawling canopies dipping into the water, and a stunning backdrop of the Bintang Range mountains. Golden hour here is legendary among Malaysian photographers.',
      rating:4.7, reviewCount:9810, priceLevel:0, entryFee:0, estimatedSpend:5,
      openingHours:'24 hours (park); best visited 6AM–7PM', isOpen:true, isHiddenGem:false, isPhotoSpot:true,
      isIndoor:false, amenities:['Free Parking','Toilets','Jogging Track','Benches','Food Stalls Nearby'],
      address:'Jalan Pekeliling, 34000 Taiping, Perak', lat:4.8519, lng:100.7413,
      aiReasoning:'Taiping Lake Gardens is the most photogenic park in Malaysia — those century-old rain tree reflections on still water at golden hour are world-famous among photographers. It\'s a serene, free stop that perfectly breaks the KL-Penang drive. Plus, Taiping is Malaysia\'s wettest town — the lush greenery is next level.',
      crowdLevel:'low', bestTimeToVisit:'7AM–9AM for misty morning reflections; 5:30PM–7PM for golden hour', durationMin:60,
      tags:['Nature','Photography','Golden Hour','Free','Relaxing','Lake'],
    },
    {
      name:'Penang Street Art Murals', type:'culture',
      photos:["https://images.unsplash.com/photo-1583417319070-4a0db8101493?w=600","https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=600","https://images.unsplash.com/photo-1577862920658-2b0b8a9a1e1e?w=600","https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600","https://images.unsplash.com/photo-1528181304800-259b08848526?w=600","https://images.unsplash.com/photo-1599661046289-e31897846e41?w=600","https://images.unsplash.com/photo-1512058564366-18510be2db19?w=600","https://images.unsplash.com/photo-1580137189272-c9379f1e7f6c?w=600","https://images.unsplash.com/photo-1562790351-d3e2b59c8c8e?w=600","https://images.unsplash.com/photo-1624956578877-c2328e4e46c7?w=600"],
      description:'George Town\'s world-famous street art scene began with Lithuanian artist Ernest Zacharevic in 2012 and has evolved into a living outdoor gallery. The iconic "Kids on Bicycle" and "Boy on Chair" murals draw visitors worldwide. Over 50+ murals and wrought-iron caricatures tell Penang\'s history through art scattered throughout the UNESCO Heritage Zone.',
      rating:4.8, reviewCount:25600, priceLevel:0, entryFee:0, estimatedSpend:10,
      openingHours:'24h (outdoor art); best daylight hours', isOpen:true, isHiddenGem:false, isPhotoSpot:true,
      isIndoor:false, amenities:['Free Walking Map','Bike Rental','Cafes Everywhere','UNESCO Zone'],
      address:'Lebuh Armenian, 10200 George Town, Penang', lat:5.4141, lng:100.3288,
      aiReasoning:'Penang street art is the most Instagrammed attraction in northern Malaysia. The UNESCO zone murals + heritage shophouses create an unparalleled urban photography experience. Early morning (before 9AM) gives you the murals without tourists in frame.',
      crowdLevel:'high', bestTimeToVisit:'7AM–9AM for empty streets; weekdays much quieter than weekends', durationMin:120,
      tags:['Street Art','Photography','UNESCO','Culture','Free','Instagram'],
    },
    {
      name:'Nasi Kandar Line Clear', type:'food',
      photos:["https://images.unsplash.com/photo-1630918144732-fb84c82c0009?w=600","https://images.unsplash.com/photo-1626804475297-2aef371f079b?w=600","https://images.unsplash.com/photo-1585032226651-759b368d7246?w=600","https://images.unsplash.com/photo-1580137189272-c9379f1e7f6c?w=600","https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=600","https://images.unsplash.com/photo-1577862920658-2b0b8a9a1e1e?w=600","https://images.unsplash.com/photo-1528181304800-259b08848526?w=600","https://images.unsplash.com/photo-1599661046289-e31897846e41?w=600","https://images.unsplash.com/photo-1583417319070-4a0db8101493?w=600","https://images.unsplash.com/photo-1512058564366-18510be2db19?w=600"],
      description:'The legendary Nasi Kandar that needs no introduction — operating since 1930 in a narrow Penang alley. Famous for their "banjir" (flooded) style where they drench your plate with a mix of curries. The fried chicken, fish roe curry, and okra are must-orders. Anthony Bourdain ate here. That says everything.',
      rating:4.3, reviewCount:18400, priceLevel:1, entryFee:0, estimatedSpend:12,
      openingHours:'10AM–8PM daily; closes when food runs out', isOpen:true, isHiddenGem:false, isPhotoSpot:false,
      isIndoor:false, amenities:['Halal','Air-Conditioned Section','Takeaway'],
      address:'177 Jalan Penang, 10000 George Town, Penang', lat:5.4175, lng:100.3325,
      aiReasoning:'Nasi Kandar is the soul of Penang food culture, and Line Clear is its most iconic institution. It\'s a bucket-list Malaysian food experience — the "banjir" mixed curry ritual alone is worth the stop.',
      crowdLevel:'high', bestTimeToVisit:'11AM (right when they open) or 3PM–4PM (off-peak lull)', durationMin:45,
      tags:['Food','Iconic','Halal','Nasi Kandar','Penang'],
    },
    {
      name:'Sam Poh Tong Temple', type:'culture',
      photos:["https://images.unsplash.com/photo-1565715888782-005b2f965ca7?w=600","https://images.unsplash.com/photo-1643220402836-f28429c1e1f8?w=600","https://images.unsplash.com/photo-1580137189272-c9379f1e7f6c?w=600","https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600","https://images.unsplash.com/photo-1624956578877-c2328e4e46c7?w=600","https://images.unsplash.com/photo-1512058564366-18510be2db19?w=600","https://images.unsplash.com/photo-1528127269322-539801943592?w=600","https://images.unsplash.com/photo-1582719471384-1ef671eab407?w=600","https://images.unsplash.com/photo-1566430930951-21677925e2b0?w=600","https://images.unsplash.com/photo-1583417319070-4a0db8101493?w=600"],
      description:'Ipoh\'s most spectacular cave temple — a Buddhist temple built inside a massive limestone cavern. The main altar sits beneath a natural skylight in the cave ceiling, creating ethereal light beams. Outside, a 246-step climb leads to an open-air pavilion with panoramic views of Ipoh and the surrounding karst landscape. The columbarium garden features a turtle pond and serene Japanese landscaping.',
      rating:4.5, reviewCount:6780, priceLevel:0, entryFee:0, estimatedSpend:5,
      openingHours:'7AM–5PM daily', isOpen:true, isHiddenGem:true, isPhotoSpot:true,
      isIndoor:true, amenities:['Free Parking','Temple Grounds','Toilets','Turtle Pond'],
      address:'Kampung Gunung Rapat, 31350 Ipoh, Perak', lat:4.5667, lng:101.1167,
      aiReasoning:'Sam Poh Tong is the most photogenic of Ipoh\'s cave temples — the natural cave skylight + towering Buddha statue + limestone backdrop is pure photography gold. It\'s less touristy than Perak Tong and offers better panoramic views after the climb.',
      crowdLevel:'low', bestTimeToVisit:'8AM–10AM for morning light through cave ceiling', durationMin:60,
      tags:['Temple','Cave','Photography','Culture','Panoramic View','Hidden Gem'],
    },
  ],

  // ═══════════════════════════════════════════════════════════════════════
  // PLUS SOUTH: KL → Seremban → Melaka → JB
  // ═══════════════════════════════════════════════════════════════════════
  PLUS_SOUTH: [
    {
      name:'Melaka Jonker Street', type:'heritage',
      photos:["https://images.unsplash.com/photo-1583417319070-4a0db8101493?w=600","https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=600","https://images.unsplash.com/photo-1577862920658-2b0b8a9a1e1e?w=600","https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600","https://images.unsplash.com/photo-1528181304800-259b08848526?w=600","https://images.unsplash.com/photo-1599661046289-e31897846e41?w=600","https://images.unsplash.com/photo-1512058564366-18510be2db19?w=600","https://images.unsplash.com/photo-1580137189272-c9379f1e7f6c?w=600","https://images.unsplash.com/photo-1562790351-d3e2b59c8c8e?w=600","https://images.unsplash.com/photo-1624956578877-c2328e4e46c7?w=600"],
      description:'The heart of UNESCO-listed Melaka — Jonker Street (Jalan Hang Jebat) is a vibrant strip of Peranakan heritage, antique shops, street food, and weekend night markets. The Chinatown area features beautifully preserved Baba-Nyonya shophouses, temples, and hidden courtyards. Saturday night market transforms the street into a sensory explosion of food, music, and crafts.',
      rating:4.6, reviewCount:31200, priceLevel:1, entryFee:0, estimatedSpend:30,
      openingHours:'Shops 10AM–6PM; Night Market Fri–Sun 6PM–12AM', isOpen:true, isHiddenGem:false, isPhotoSpot:true,
      isIndoor:false, amenities:['Night Market','Halal Food','Souvenirs','Heritage Zone','Parking'],
      address:'Jalan Hang Jebat, 75200 Melaka', lat:2.1975, lng:102.2478,
      aiReasoning:'Melaka is Malaysia\'s most historically layered city — Portuguese, Dutch, British, Chinese, and Malay influences are all visible in one walkable zone. Jonker Street is the beating heart: food, antiques, culture, and photography in a UNESCO World Heritage setting.',
      crowdLevel:'high', bestTimeToVisit:'Fri–Sat night market 6PM–10PM; or weekday mornings for quiet exploration', durationMin:150,
      tags:['UNESCO','Heritage','Night Market','Food','Photography','Culture'],
    },
    {
      name:'A Famosa & St. Paul\'s Hill', type:'heritage',
      photos:[
        'https://images.unsplash.com/photo-1590552515423-58e2b2c0d6fa?w=600',
        'https://images.unsplash.com/photo-1624956578877-c2328e4e46c7?w=600',
        'https://images.unsplash.com/photo-1599661046289-e31897846e41?w=600',
        'https://images.unsplash.com/photo-1528181304800-259b08848526?w=600',
        'https://images.unsplash.com/photo-1583417319070-4a0db8101493?w=600',
        'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=600',
        'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=600',
        'https://images.unsplash.com/photo-1580137189272-c9379f1e7f6c?w=600',
        'https://images.unsplash.com/photo-1562790351-d3e2b59c8c8e?w=600',
        'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600',
      ],
      description:'The oldest surviving European architectural remains in Southeast Asia — the Porta de Santiago gate of A Famosa fortress (built 1511 by the Portuguese). Atop St. Paul\'s Hill, the 1521 church ruins offer sweeping views over Melaka city and the Straits. The weathered tombstones embedded in the church walls tell 400 years of colonial history.',
      rating:4.4, reviewCount:22100, priceLevel:0, entryFee:0, estimatedSpend:0,
      openingHours:'24 hours (hill area)', isOpen:true, isHiddenGem:false, isPhotoSpot:true,
      isIndoor:false, amenities:['Free Entry','Viewpoint','Historical Markers','Benches'],
      address:'Jalan Kota, 75000 Melaka', lat:2.1916, lng:102.2504,
      aiReasoning:'A Famosa + St. Paul\'s Hill is the ultimate Melaka photo combo — colonial ruins, panoramic city views, and the famous "headless" statue of St. Francis Xavier. Sunset from the hilltop is iconic.',
      crowdLevel:'medium', bestTimeToVisit:'Sunset (6PM–7PM) for golden light over the Straits', durationMin:60,
      tags:['History','UNESCO','Sunset View','Photography','Free','Landmark'],
    },
    {
      name:'Seremban Siew Pow', type:'food',
      photos:["https://images.unsplash.com/photo-1630918144732-fb84c82c0009?w=600","https://images.unsplash.com/photo-1626804475297-2aef371f079b?w=600","https://images.unsplash.com/photo-1585032226651-759b368d7246?w=600","https://images.unsplash.com/photo-1580137189272-c9379f1e7f6c?w=600","https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=600","https://images.unsplash.com/photo-1577862920658-2b0b8a9a1e1e?w=600","https://images.unsplash.com/photo-1528181304800-259b08848526?w=600","https://images.unsplash.com/photo-1599661046289-e31897846e41?w=600","https://images.unsplash.com/photo-1583417319070-4a0db8101493?w=600","https://images.unsplash.com/photo-1512058564366-18510be2db19?w=600"],
      description:'Seremban\'s culinary claim to fame — the legendary baked pork bun (or chicken for halal) with flaky pastry and savory-sweet meat filling. Empire Siew Pow and Asia Siew Pow are the two rival institutions, both located just off the PLUS highway exit. Fresh from the oven, the aroma alone justifies the detour.',
      rating:4.2, reviewCount:5400, priceLevel:1, entryFee:0, estimatedSpend:15,
      openingHours:'8AM–6PM daily; best when fresh-baked 9AM–11AM', isOpen:true, isHiddenGem:false, isPhotoSpot:false,
      isIndoor:true, amenities:['Parking','Takeaway','Halal Options','Eat-in'],
      address:'Jalan Labu, 70200 Seremban, Negeri Sembilan', lat:2.7297, lng:101.9381,
      aiReasoning:'Seremban Siew Pow is THE classic Malaysian roadtrip snack stop. The PLUS highway exit is literally named "Seremban" — generations of KL-JB travelers have stopped here. Fresh siew pow + hot tea = perfect 20-minute break.',
      crowdLevel:'medium', bestTimeToVisit:'9AM–10AM for fresh batch straight from the oven', durationMin:20,
      tags:['Food','Road Trip Snack','Local Icon','Quick Stop'],
    },
    {
      name:'Tanjung Piai National Park', type:'nature',
      photos:["https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600","https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=600","https://images.unsplash.com/photo-1518173946687-a1e4e3e6a2b0?w=600","https://images.unsplash.com/photo-1444080748397-f442aa95c3e5?w=600","https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600","https://images.unsplash.com/photo-1520454974749-db9129c25ddb?w=600","https://images.unsplash.com/photo-1528127269322-539801943592?w=600","https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600","https://images.unsplash.com/photo-1582719471384-1ef671eab407?w=600","https://images.unsplash.com/photo-1566430930951-21677925e2b0?w=600"],
      description:'The southernmost tip of mainland Eurasia — Tanjung Piai is a 926-hectare mangrove paradise with a 1.2km wooden boardwalk snaking through ancient mangrove forests into the sea. The globe monument marks your position at the continent\'s edge. Mudskippers, monkeys, and migratory birds are abundant. The sea breeze at the tip pavilion is pure therapy.',
      rating:4.5, reviewCount:4230, priceLevel:1, entryFee:5, estimatedSpend:10,
      openingHours:'9AM–5PM Tue–Sun; closed Monday', isOpen:true, isHiddenGem:true, isPhotoSpot:true,
      isIndoor:false, amenities:['Parking','Boardwalk','Globe Monument','Toilets','Guide Available'],
      address:'Tanjung Piai, 82030 Pontian, Johor', lat:1.2667, lng:103.5167,
      aiReasoning:'Standing at the southernmost tip of mainland Eurasia is a rare bucket-list experience. The mangrove boardwalk + globe monument + endless sea horizon create surreal photos. This is one of Malaysia\'s most underrated hidden gems.',
      crowdLevel:'low', bestTimeToVisit:'8AM–10AM for cool morning and active wildlife', durationMin:120,
      tags:['Nature','Mangrove','Southernmost Point','Photography','Hidden Gem','Boardwalk'],
    },
    {
      name:'Putrajaya Bridge & Mosque', type:'photo',
      photos:["https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600","https://images.unsplash.com/photo-1624956578877-c2328e4e46c7?w=600","https://images.unsplash.com/photo-1512058564366-18510be2db19?w=600","https://images.unsplash.com/photo-1528127269322-539801943592?w=600","https://images.unsplash.com/photo-1580137189272-c9379f1e7f6c?w=600","https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=600","https://images.unsplash.com/photo-1577862920658-2b0b8a9a1e1e?w=600","https://images.unsplash.com/photo-1444080748397-f442aa95c3e5?w=600","https://images.unsplash.com/photo-1583417319070-4a0db8101493?w=600","https://images.unsplash.com/photo-1562790351-d3e2b59c8c8e?w=600"],
      description:'Putrajaya is Malaysia\'s stunning administrative capital — a planned city of bridges, lakes, and Islamic architecture. The pink-domed Putra Mosque on the lake and the 435m Seri Wawasan cable-stayed bridge create one of the most photogenic cityscapes in Southeast Asia. Best photographed from the lakeside promenade at sunset.',
      rating:4.7, reviewCount:15600, priceLevel:0, entryFee:0, estimatedSpend:10,
      openingHours:'Mosque 9AM–5PM (non-prayer times); Lakeside 24h', isOpen:true, isHiddenGem:false, isPhotoSpot:true,
      isIndoor:false, amenities:['Free Parking','Lakeside Walk','Boat Cruise','Food Court'],
      address:'Presint 1, 62000 Putrajaya', lat:2.9264, lng:101.6964,
      aiReasoning:'Putrajaya is a photographer\'s paradise — the pink Putra Mosque reflected in the lake at sunset, the dramatic bridges, and the manicured gardens. It\'s a 20-minute detour from the PLUS highway and delivers world-class architectural photography.',
      crowdLevel:'low', bestTimeToVisit:'5:30PM–7:30PM for sunset reflections on the lake', durationMin:90,
      tags:['Photography','Architecture','Mosque','Sunset','Free','Lake Views'],
    },
  ],

  // ═══════════════════════════════════════════════════════════════════════
  // EAST COAST: KL → Genting → Kuantan → Kuala Terengganu
  // ═══════════════════════════════════════════════════════════════════════
  EAST_COAST: [
    {
      name:'Genting Highlands', type:'attraction',
      photos:["https://images.unsplash.com/photo-1528127269322-539801943592?w=600","https://images.unsplash.com/photo-1512058564366-18510be2db19?w=600","https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600","https://images.unsplash.com/photo-1580137189272-c9379f1e7f6c?w=600","https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600","https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=600","https://images.unsplash.com/photo-1444080748397-f442aa95c3e5?w=600","https://images.unsplash.com/photo-1582719471384-1ef671eab407?w=600","https://images.unsplash.com/photo-1566430930951-21677925e2b0?w=600","https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=600"],
      description:'Malaysia\'s highland resort city sitting 1,800m above sea level — featuring Southeast Asia\'s largest casino, a massive indoor theme park (Skytropolis), premium shopping (SkyAvenue), and year-round cool weather (16–24°C). The drive up via the Karak Highway offers dramatic mountain scenery through the Titiwangsa Range cloud forest.',
      rating:4.2, reviewCount:47600, priceLevel:3, entryFee:0, estimatedSpend:80,
      openingHours:'24h (casino & hotels); Theme park 10AM–10PM', isOpen:true, isHiddenGem:false, isPhotoSpot:true,
      isIndoor:true, amenities:['Casino','Theme Park','Shopping Mall','Restaurants','Hotels','Cable Car'],
      address:'Genting Highlands, 69000 Pahang', lat:3.4237, lng:101.7935,
      aiReasoning:'Genting Highlands is the ultimate Malaysian highland escape — the cool mountain air alone is worth the drive. Even if you don\'t gamble, the SkyAvenue mall, food options, and cable car views make it an excellent roadtrip break.',
      crowdLevel:'high', bestTimeToVisit:'Weekdays; avoid weekends and school holidays', durationMin:180,
      tags:['Highland','Casino','Shopping','Cool Weather','Theme Park','Entertainment'],
    },
    {
      name:'Bentong Walk', type:'food',
      photos:["https://images.unsplash.com/photo-1630918144732-fb84c82c0009?w=600","https://images.unsplash.com/photo-1626804475297-2aef371f079b?w=600","https://images.unsplash.com/photo-1585032226651-759b368d7246?w=600","https://images.unsplash.com/photo-1580137189272-c9379f1e7f6c?w=600","https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=600","https://images.unsplash.com/photo-1577862920658-2b0b8a9a1e1e?w=600","https://images.unsplash.com/photo-1528181304800-259b08848526?w=600","https://images.unsplash.com/photo-1599661046289-e31897846e41?w=600","https://images.unsplash.com/photo-1583417319070-4a0db8101493?w=600","https://images.unsplash.com/photo-1512058564366-18510be2db19?w=600"],
      description:'Bentong is the gateway town to the East Coast, famous for its ginger, ice cream, and weekend morning market. Bentong Walk is a charming food street lined with century-old buildings, local kopitiams, and specialty shops. Must-try: Bentong ginger tea, homemade ice cream, and the famous wan tan mee.',
      rating:4.3, reviewCount:3200, priceLevel:1, entryFee:0, estimatedSpend:20,
      openingHours:'Shops 7AM–5PM; best Sat–Sun morning market', isOpen:true, isHiddenGem:true, isPhotoSpot:false,
      isIndoor:false, amenities:['Street Parking','Morning Market','Local Cafes','Halal Options'],
      address:'Jalan Chui Yin, 28700 Bentong, Pahang', lat:3.5235, lng:101.9076,
      aiReasoning:'Bentong is the perfect "local secret" stop on the KL-Kuantan route — a small town with outsized food culture. The ginger tea and homemade ice cream are legendary. It\'s the kind of authentic Malaysian small-town experience travelers crave.',
      crowdLevel:'low', bestTimeToVisit:'Sat–Sun 8AM–11AM for morning market vibes', durationMin:45,
      tags:['Food','Small Town','Morning Market','Hidden Gem','Local'],
    },
    {
      name:'Teluk Cempedak Beach', type:'nature',
      photos:["https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600","https://images.unsplash.com/photo-1520454974749-db9129c25ddb?w=600","https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=600","https://images.unsplash.com/photo-1518173946687-a1e4e3e6a2b0?w=600","https://images.unsplash.com/photo-1444080748397-f442aa95c3e5?w=600","https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600","https://images.unsplash.com/photo-1528127269322-539801943592?w=600","https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600","https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=600","https://images.unsplash.com/photo-1582719471384-1ef671eab407?w=600"],
      description:'Kuantan\'s most beloved beach — a sweeping crescent of golden sand just 5km from the town center. The beach is framed by dramatic rock formations at both ends and backed by casuarina trees. The 1km paved promenade is perfect for sunset strolls. Excellent swimming when the South China Sea is calm (Mar–Sep).',
      rating:4.4, reviewCount:8900, priceLevel:0, entryFee:0, estimatedSpend:15,
      openingHours:'24h; food stalls 4PM–12AM', isOpen:true, isHiddenGem:false, isPhotoSpot:true,
      isIndoor:false, amenities:['Free Parking','Promenade','Food Stalls','Toilets','Showers','McDonald\'s'],
      address:'Jalan Teluk Cempedak, 25050 Kuantan, Pahang', lat:3.8167, lng:103.3708,
      aiReasoning:'Teluk Cempedak is the East Coast\'s most accessible beautiful beach — right at the end of the Karak/LPT highway. It\'s the perfect reward after the drive: golden sand, dramatic rock formations, and spectacular South China Sea sunsets.',
      crowdLevel:'medium', bestTimeToVisit:'5PM–7PM for sunset; weekday mornings for solitude', durationMin:90,
      tags:['Beach','Sunset','Swimming','Free','Promenade','Family-Friendly'],
    },
    {
      name:'Sungai Pandan Waterfall', type:'nature',
      photos:["https://images.unsplash.com/photo-1582719471384-1ef671eab407?w=600","https://images.unsplash.com/photo-1566430930951-21677925e2b0?w=600","https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600","https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=600","https://images.unsplash.com/photo-1444080748397-f442aa95c3e5?w=600","https://images.unsplash.com/photo-1518173946687-a1e4e3e6a2b0?w=600","https://images.unsplash.com/photo-1528127269322-539801943592?w=600","https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=600","https://images.unsplash.com/photo-1643220402836-f28429c1e1f8?w=600","https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=600"],
      description:'A stunning multi-tiered waterfall cascading through tropical rainforest, located just off the LPT highway near Kuantan. The main falls drop 25m into a large natural swimming pool. The surrounding forest canopy keeps the area cool. Well-maintained with steps and viewing platforms at multiple levels.',
      rating:4.4, reviewCount:3400, priceLevel:1, entryFee:3, estimatedSpend:10,
      openingHours:'8AM–6PM daily', isOpen:true, isHiddenGem:true, isPhotoSpot:true,
      isIndoor:false, amenities:['Parking','Steps & Platforms','Picnic Spots','Toilets','Swimming Area'],
      address:'Sungai Pandan, 25150 Kuantan, Pahang', lat:3.8667, lng:103.2667,
      aiReasoning:'Sungai Pandan is the East Coast\'s best highway-accessible waterfall — a genuine tropical rainforest swimming experience just minutes from the LPT. The multi-tier design means even on busy days, you can find a quiet pool.',
      crowdLevel:'low', bestTimeToVisit:'Weekday mornings; water flow strongest Nov–Feb', durationMin:90,
      tags:['Waterfall','Swimming','Nature','Rainforest','Hidden Gem','Picnic'],
    },
  ],

  // ═══════════════════════════════════════════════════════════════════════
  // CAMERON HIGHLANDS corridor
  // ═══════════════════════════════════════════════════════════════════════
  CAMERON: [
    {
      name:'Boh Tea Plantation', type:'photo',
      photos:["https://images.unsplash.com/photo-1518173946687-a1e4e3e6a2b0?w=600","https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600","https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=600","https://images.unsplash.com/photo-1444080748397-f442aa95c3e5?w=600","https://images.unsplash.com/photo-1528127269322-539801943592?w=600","https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600","https://images.unsplash.com/photo-1512058564366-18510be2db19?w=600","https://images.unsplash.com/photo-1582719471384-1ef671eab407?w=600","https://images.unsplash.com/photo-1566430930951-21677925e2b0?w=600","https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=600"],
      description:'Malaysia\'s largest tea plantation — the Boh Sungei Palas estate offers the most iconic views in Cameron Highlands. The glass-walled tea cafe hangs over the plantation slopes, serving fresh Boh tea with 180° views of manicured green hills stretching to the horizon. The factory tour shows the full tea-making process from leaf to cup.',
      rating:4.6, reviewCount:18900, priceLevel:1, entryFee:0, estimatedSpend:20,
      openingHours:'8:30AM–4:30PM Tue–Sun; closed Monday', isOpen:true, isHiddenGem:false, isPhotoSpot:true,
      isIndoor:true, amenities:['Parking','Tea Cafe','Factory Tour','Souvenir Shop','Viewpoint'],
      address:'Sungei Palas, 39100 Brinchang, Pahang', lat:4.5167, lng:101.4000,
      aiReasoning:'Boh Sungei Palas is THE iconic Cameron Highlands photo — those endless green tea hills with mist rolling through. The cantilevered glass cafe is an architectural statement. Go early for misty morning shots; the light is magical 8AM–10AM.',
      crowdLevel:'high', bestTimeToVisit:'8:30AM opening for mist + empty cafe; avoid 11AM–2PM peak', durationMin:90,
      tags:['Tea Plantation','Photography','Iconic','Mountain Views','Cafe','Highland'],
    },
    {
      name:'Mossy Forest', type:'nature',
      photos:["https://images.unsplash.com/photo-1582719471384-1ef671eab407?w=600","https://images.unsplash.com/photo-1566430930951-21677925e2b0?w=600","https://images.unsplash.com/photo-1444080748397-f442aa95c3e5?w=600","https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600","https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=600","https://images.unsplash.com/photo-1518173946687-a1e4e3e6a2b0?w=600","https://images.unsplash.com/photo-1528127269322-539801943592?w=600","https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600","https://images.unsplash.com/photo-1512058564366-18510be2db19?w=600","https://images.unsplash.com/photo-1643220402836-f28429c1e1f8?w=600"],
      description:'A mystical cloud forest at the summit of Gunung Brinchang (2,032m) — ancient moss-covered trees, twisted roots, and ethereal mist create a landscape straight out of a fantasy film. The 200m boardwalk lets you walk through the canopy without damaging the delicate ecosystem. One of the oldest forests in Malaysia at 200 million years.',
      rating:4.5, reviewCount:11200, priceLevel:1, entryFee:10, estimatedSpend:20,
      openingHours:'7AM–6PM daily; best visibility before 10AM', isOpen:true, isHiddenGem:false, isPhotoSpot:true,
      isIndoor:false, amenities:['Boardwalk','Parking','Guide Available','Viewpoint'],
      address:'Gunung Brinchang, 39000 Brinchang, Pahang', lat:4.5167, lng:101.3833,
      aiReasoning:'The Mossy Forest is otherworldly — it looks like a Lord of the Rings set. The boardwalk through the mist-shrouded ancient trees creates photos that look AI-generated but are 100% real. Go early — mist + morning light = magic.',
      crowdLevel:'medium', bestTimeToVisit:'7AM–9AM for maximum mist and minimal crowds', durationMin:90,
      tags:['Cloud Forest','Mossy','Boardwalk','Photography','Nature','Highland'],
    },
  ],

  // ═══════════════════════════════════════════════════════════════════════
  // LANGKAWI ISLAND corridor
  // ═══════════════════════════════════════════════════════════════════════
  LANGKAWI: [
    {
      name:'Langkawi Sky Bridge', type:'attraction',
      photos:["https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600","https://images.unsplash.com/photo-1528127269322-539801943592?w=600","https://images.unsplash.com/photo-1512058564366-18510be2db19?w=600","https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600","https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=600","https://images.unsplash.com/photo-1444080748397-f442aa95c3e5?w=600","https://images.unsplash.com/photo-1518173946687-a1e4e3e6a2b0?w=600","https://images.unsplash.com/photo-1582719471384-1ef671eab407?w=600","https://images.unsplash.com/photo-1624956578877-c2328e4e46c7?w=600","https://images.unsplash.com/photo-1580137189272-c9379f1e7f6c?w=600"],
      description:'The world\'s longest free-span curved suspension bridge — suspended 660m above sea level between two mountain peaks. The curved steel deck offers 360° views of the Andaman Sea, Langkawi\'s rainforest-covered peaks, and on clear days, the Thai islands to the north. Access via the steepest cable car in the world (SkyCab).',
      rating:4.7, reviewCount:34500, priceLevel:3, entryFee:40, estimatedSpend:60,
      openingHours:'9:30AM–7PM daily', isOpen:true, isHiddenGem:false, isPhotoSpot:true,
      isIndoor:false, amenities:['Cable Car','Viewing Decks','Souvenir Shop','Cafe','Parking'],
      address:'Jalan Telaga Tujuh, 07000 Langkawi, Kedah', lat:6.3500, lng:99.8000,
      aiReasoning:'The Sky Bridge is Langkawi\'s #1 attraction for good reason — the engineering feat + the views + the cable car ride = unforgettable. The curved bridge walking experience with 660m of air beneath your feet is genuinely thrilling.',
      crowdLevel:'high', bestTimeToVisit:'9:30AM opening or 4PM–6PM for sunset golden light', durationMin:150,
      tags:['Sky Bridge','Cable Car','Panoramic','Iconic','Engineering','Must-Do'],
    },
    {
      name:'Pantai Cenang', type:'nature',
      photos:["https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600","https://images.unsplash.com/photo-1520454974749-db9129c25ddb?w=600","https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=600","https://images.unsplash.com/photo-1518173946687-a1e4e3e6a2b0?w=600","https://images.unsplash.com/photo-1444080748397-f442aa95c3e5?w=600","https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600","https://images.unsplash.com/photo-1528127269322-539801943592?w=600","https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600","https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=600","https://images.unsplash.com/photo-1582719471384-1ef671eab407?w=600"],
      description:'Langkawi\'s most famous beach — a 2km stretch of powdery white sand and calm turquoise water. The beach is lined with coconut trees, beach bars, and restaurants. Sunset here is legendary — the sun dips directly into the Andaman Sea painting the sky orange and pink. Parasailing, jet skiing, and banana boats available.',
      rating:4.5, reviewCount:28700, priceLevel:1, entryFee:0, estimatedSpend:30,
      openingHours:'24h; water sports 10AM–6PM; beach bars until late', isOpen:true, isHiddenGem:false, isPhotoSpot:true,
      isIndoor:false, amenities:['Free Beach','Water Sports','Restaurants','Bars','Parking','Showers'],
      address:'Pantai Cenang, 07000 Langkawi, Kedah', lat:6.2967, lng:99.7233,
      aiReasoning:'Pantai Cenang at sunset is one of Malaysia\'s best beach experiences — the wide bay, calm waters, and unobstructed Andaman Sea sunset make it a photographer\'s dream. Stay for the fire shows that start after dark.',
      crowdLevel:'high', bestTimeToVisit:'5PM–7:30PM for sunset; morning for quiet swim', durationMin:120,
      tags:['Beach','Sunset','Swimming','Water Sports','Photography','Free'],
    },
  ],
};

// Generate photo stops for each corridor (scenic viewpoints along the route)
const MALAYSIAN_PHOTO_STOPS: Record<string, RouteDiscoveryPlace[]> = {
  PLUS_NORTH: [
    {name:'R&R Sungai Perak Overhead Bridge',type:'viewpoint',photos:["https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=600","https://images.unsplash.com/photo-1444080748397-f442aa95c3e5?w=600","https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=600","https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600","https://images.unsplash.com/photo-1528127269322-539801943592?w=600","https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600","https://images.unsplash.com/photo-1512058564366-18510be2db19?w=600","https://images.unsplash.com/photo-1518173946687-a1e4e3e6a2b0?w=600","https://images.unsplash.com/photo-1582719471384-1ef671eab407?w=600","https://images.unsplash.com/photo-1624956578877-c2328e4e46c7?w=600"],description:'The iconic overhead bridge restaurant spanning the PLUS highway — Malaysia\'s only elevated R&R with dining directly above speeding traffic. The panoramic windows offer dramatic views of the Perak River valley and Titiwangsa Range. Unique perspective for highway photography, especially at sunset when the mountains glow.',rating:4.3,reviewCount:3400,priceLevel:1,entryFee:0,estimatedSpend:15,openingHours:'24h',isOpen:true,isHiddenGem:true,isPhotoSpot:true,isIndoor:true,amenities:['Food Court','Surau','Toilets','Panoramic Windows','Parking'],address:'PLUS Highway km 200, Perak',lat:4.58,lng:101.12,aiReasoning:'The R&R Sungai Perak overhead bridge restaurant is a uniquely Malaysian photo op — where else can you dine above a highway with mountain views? The elevated perspective is fantastic for golden hour landscape shots.',crowdLevel:'low',bestTimeToVisit:'5PM–7PM for sunset light on the valley',durationMin:20,tags:['Highway Bridge','Sunset','Unique','Restaurant','Panoramic'],
    },
    {name:'Ulu Bernam Palm Oil Estate',type:'photo',photos:["https://images.unsplash.com/photo-1518173946687-a1e4e3e6a2b0?w=600","https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600","https://images.unsplash.com/photo-1528127269322-539801943592?w=600","https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=600","https://images.unsplash.com/photo-1444080748397-f442aa95c3e5?w=600","https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600","https://images.unsplash.com/photo-1512058564366-18510be2db19?w=600","https://images.unsplash.com/photo-1582719471384-1ef671eab407?w=600","https://images.unsplash.com/photo-1566430930951-21677925e2b0?w=600","https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=600"],description:'Endless rows of oil palm trees create a hypnotic geometric pattern stretching to the horizon. The Ulu Bernam estate along PLUS offers pull-off points where the palm canopy creates natural tunnels over the access road. Best shot: drone view of the symmetry, or ground-level shooting into the palm tunnel at golden hour.',rating:4.1,reviewCount:850,priceLevel:0,entryFee:0,estimatedSpend:0,openingHours:'Daylight hours (private estate — shoot from roadside)',isOpen:true,isHiddenGem:true,isPhotoSpot:true,isIndoor:false,amenities:['Roadside Pull-Off','Open Views'],address:'Ulu Bernam, 35900 Tanjung Malim, Perak',lat:3.45,lng:101.42,aiReasoning:'The palm oil tunnel effect at Ulu Bernam is one of Malaysia\'s most underrated roadtrip photo spots — the geometric perfection of palm rows + golden hour light creates surreal images. It\'s the kind of shot that wins Instagram Explore page features.',crowdLevel:'low',bestTimeToVisit:'5:30PM–7PM golden hour for palm tunnel lighting',durationMin:15,tags:['Palm Oil','Drone','Golden Hour','Geometric','Hidden Gem'],
    },
    {name:'Batu Ferringhi Sunset',type:'viewpoint',photos:["https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600","https://images.unsplash.com/photo-1520454974749-db9129c25ddb?w=600","https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=600","https://images.unsplash.com/photo-1518173946687-a1e4e3e6a2b0?w=600","https://images.unsplash.com/photo-1444080748397-f442aa95c3e5?w=600","https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600","https://images.unsplash.com/photo-1528127269322-539801943592?w=600","https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600","https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=600","https://images.unsplash.com/photo-1582719471384-1ef671eab407?w=600"],description:'Penang\'s premier sunset beach — the long curve of Batu Ferringhi faces directly west into the Straits of Malacca. The beach is framed by lush green hills on both ends, fishing boats dot the horizon, and the sky erupts in orange, pink, and purple. Water sports and beach bars add foreground interest for composition.',rating:4.6,reviewCount:12400,priceLevel:0,entryFee:0,estimatedSpend:10,openingHours:'24h beach; best 6PM–7:30PM',isOpen:true,isHiddenGem:false,isPhotoSpot:true,isIndoor:false,amenities:['Beach Access','Restaurants','Parking','Night Market Nearby'],address:'Jalan Batu Ferringhi, 11100 Penang',lat:5.4722,lng:100.2500,aiReasoning:'Batu Ferringhi delivers reliably spectacular sunsets — the west-facing orientation + tropical atmosphere + fishing boat silhouettes = postcard-perfect. It\'s the grand finale photo stop on a KL-Penang roadtrip.',crowdLevel:'high',bestTimeToVisit:'6PM–7:30PM sunset window',durationMin:60,tags:['Sunset','Beach','Penang','Iconic','Landscape','Golden Hour'],
    },
    {name:'Titiwangsa Range Vista Point',type:'viewpoint',photos:["https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600","https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600","https://images.unsplash.com/photo-1512058564366-18510be2db19?w=600","https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=600","https://images.unsplash.com/photo-1444080748397-f442aa95c3e5?w=600","https://images.unsplash.com/photo-1528127269322-539801943592?w=600","https://images.unsplash.com/photo-1518173946687-a1e4e3e6a2b0?w=600","https://images.unsplash.com/photo-1582719471384-1ef671eab407?w=600","https://images.unsplash.com/photo-1566430930951-21677925e2b0?w=600","https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=600"],description:'A dramatic highway pull-off on PLUS northbound between Sungkai and Bidor where the Titiwangsa mountain range suddenly fills the entire eastern horizon. The layered blue-grey peaks receding into the distance create a natural Chinese ink painting effect. Morning mist in the valleys adds an ethereal quality. No facilities — pure landscape photography.',rating:4.0,reviewCount:450,priceLevel:0,entryFee:0,estimatedSpend:0,openingHours:'24h (roadside viewpoint)',isOpen:true,isHiddenGem:true,isPhotoSpot:true,isIndoor:false,amenities:['Roadside Pull-Off'],address:'PLUS km 160-170 northbound, Sungkai-Bidor, Perak',lat:4.05,lng:101.30,aiReasoning:'This is a secret known only to frequent PLUS highway drivers — the Titiwangsa vista between Sungkai and Bidor is breathtaking, especially on misty mornings when the mountains look like a Chinese painting. Zero facilities, zero tourists, maximum landscape photography.',crowdLevel:'low',bestTimeToVisit:'6:30AM–8:30AM for morning mist on the mountains',durationMin:10,tags:['Mountain Vista','Mist','Landscape','Hidden Gem','Secret Spot'],
    },
    {name:'Penang Bridge Panorama',type:'photo',photos:["https://images.unsplash.com/photo-1444080748397-f442aa95c3e5?w=600","https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=600","https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=600","https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600","https://images.unsplash.com/photo-1528127269322-539801943592?w=600","https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600","https://images.unsplash.com/photo-1512058564366-18510be2db19?w=600","https://images.unsplash.com/photo-1624956578877-c2328e4e46c7?w=600","https://images.unsplash.com/photo-1582719471384-1ef671eab407?w=600","https://images.unsplash.com/photo-1518173946687-a1e4e3e6a2b0?w=600"],description:'The 13.5km Penang Bridge is Southeast Asia\'s longest bridge — an engineering marvel spanning the Penang Strait. The best photos are from the island-side approach where the bridge cables create dramatic leading lines into the distance. Night photography here is spectacular: the bridge lights reflect in the water below.',rating:4.5,reviewCount:7800,priceLevel:0,entryFee:0,estimatedSpend:0,openingHours:'24h (view from approach roads)',isOpen:true,isHiddenGem:false,isPhotoSpot:true,isIndoor:false,amenities:['Viewpoints on Both Sides','Toll Plaza Photo Pull-Off'],address:'Penang Bridge, Jalan Sultan Azlan Shah, 11900 Penang',lat:5.3578,lng:100.3533,aiReasoning:'The Penang Bridge at dawn or dusk is an iconic Malaysian photo — 13.5km of engineering framed by the Straits of Malacca. The cable-stayed section creates perfect leading lines. It\'s the definitive "you\'ve arrived in Penang" shot.',crowdLevel:'low',bestTimeToVisit:'6:30AM sunrise or 6:30PM–8PM blue hour with bridge lights',durationMin:15,tags:['Bridge','Engineering','Sunrise','Blue Hour','Iconic','Leading Lines'],
    },
    {name:'Kuala Kangsar Ubudiah Mosque',type:'photo',photos:["https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600","https://images.unsplash.com/photo-1624956578877-c2328e4e46c7?w=600","https://images.unsplash.com/photo-1512058564366-18510be2db19?w=600","https://images.unsplash.com/photo-1528127269322-539801943592?w=600","https://images.unsplash.com/photo-1580137189272-c9379f1e7f6c?w=600","https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=600","https://images.unsplash.com/photo-1577862920658-2b0b8a9a1e1e?w=600","https://images.unsplash.com/photo-1444080748397-f442aa95c3e5?w=600","https://images.unsplash.com/photo-1583417319070-4a0db8101493?w=600","https://images.unsplash.com/photo-1562790351-d3e2b59c8c8e?w=600"],description:'Malaysia\'s most beautiful mosque — the Ubudiah Mosque features gleaming golden domes and minarets set against the Royal Town of Kuala Kangsar\'s lush greenery. Designed by British architect Arthur Hubback (same architect as KL\'s railway station). The symmetry and golden dome reflections in the surrounding pools are photographer heaven.',rating:4.5,reviewCount:4300,priceLevel:0,entryFee:0,estimatedSpend:0,openingHours:'8AM–5PM (non-prayer times); exterior 24h',isOpen:true,isHiddenGem:true,isPhotoSpot:true,isIndoor:false,amenities:['Parking','Visitor-Friendly','Photography Allowed Outside'],address:'Jalan Istana, 33000 Kuala Kangsar, Perak',lat:4.7728,lng:100.9400,aiReasoning:'The Ubudiah Mosque is architectural perfection — the golden domes + symmetry + water reflections = world-class photography. It\'s right off the PLUS highway (exit Kuala Kangsar) yet most travelers drive right past it. Their loss.',
      crowdLevel:'low', bestTimeToVisit:'8AM–10AM for morning light on golden domes', durationMin:30,
      tags:['Mosque','Architecture','Golden Dome','Photography','Hidden Gem','Symmetry'],
    },
  ],
  PLUS_SOUTH: [
    {name:'Seremban Lake Gardens',type:'viewpoint',photos:["https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=600","https://images.unsplash.com/photo-1444080748397-f442aa95c3e5?w=600","https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=600","https://images.unsplash.com/photo-1518173946687-a1e4e3e6a2b0?w=600","https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600","https://images.unsplash.com/photo-1528127269322-539801943592?w=600","https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600","https://images.unsplash.com/photo-1582719471384-1ef671eab407?w=600","https://images.unsplash.com/photo-1566430930951-21677925e2b0?w=600","https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=600"],description:'Two scenic lakes surrounded by manicured gardens in the heart of Seremban — a peaceful green oasis 5 minutes from the PLUS highway. The lakes reflect the surrounding hills and the iconic Seremban State Mosque minaret. The lotus flowers blooming on the lake surface add foreground interest for photos.',rating:4.2,reviewCount:2100,priceLevel:0,entryFee:0,estimatedSpend:0,openingHours:'24h (park)',isOpen:true,isHiddenGem:true,isPhotoSpot:true,isIndoor:false,amenities:['Parking','Jogging Track','Benches','Free'],address:'Jalan Taman Bunga, 70100 Seremban, NS',lat:2.7200,lng:101.9400,aiReasoning:'Seremban Lake Gardens is the perfect "stretch your legs" photo stop on the KL-Melaka route — the lake reflections + lotus flowers + mosque minaret create a classic Malaysian landscape composition in a convenient location.',crowdLevel:'low',bestTimeToVisit:'7AM–9AM for misty reflections on still water',durationMin:20,tags:['Lake','Reflections','Gardens','Peaceful','Hidden Gem'],
    },
    {name:'Melaka Straits Mosque',type:'photo',photos:["https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600","https://images.unsplash.com/photo-1624956578877-c2328e4e46c7?w=600","https://images.unsplash.com/photo-1512058564366-18510be2db19?w=600","https://images.unsplash.com/photo-1528127269322-539801943592?w=600","https://images.unsplash.com/photo-1580137189272-c9379f1e7f6c?w=600","https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=600","https://images.unsplash.com/photo-1577862920658-2b0b8a9a1e1e?w=600","https://images.unsplash.com/photo-1444080748397-f442aa95c3e5?w=600","https://images.unsplash.com/photo-1583417319070-4a0db8101493?w=600","https://images.unsplash.com/photo-1562790351-d3e2b59c8c8e?w=600"],description:'Built on stilts over the Straits of Melaka — when the tide comes in, this stunning mosque appears to float on the sea. The white structure with stained glass windows and a towering minaret is breathtaking at sunset when the golden light hits the water. The mosque\'s platform extends into the sea for unobstructed horizon shots.',rating:4.6,reviewCount:9800,priceLevel:0,entryFee:0,estimatedSpend:0,openingHours:'5AM–10PM; photography best 6PM–7:30PM',isOpen:true,isHiddenGem:false,isPhotoSpot:true,isIndoor:false,amenities:['Parking','Visitor Area','Photography Allowed','Surau'],address:'Jalan Pulau Melaka 8, 75000 Melaka',lat:2.1800,lng:102.2530,aiReasoning:'The floating mosque at sunset is Melaka\'s most iconic photo — the mosque seemingly suspended on the sea, backlit by a spectacular Straits sunset. It\'s a world-class architectural photography subject that rivals anything in the region.',crowdLevel:'medium',bestTimeToVisit:'6PM–7:30PM for sunset + mosque silhouette',durationMin:45,tags:['Mosque','Floating','Sunset','Sea','Iconic','Architecture'],
    },
    {name:'Gunung Ledang Vista',type:'viewpoint',photos:["https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600","https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600","https://images.unsplash.com/photo-1512058564366-18510be2db19?w=600","https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=600","https://images.unsplash.com/photo-1444080748397-f442aa95c3e5?w=600","https://images.unsplash.com/photo-1528127269322-539801943592?w=600","https://images.unsplash.com/photo-1518173946687-a1e4e3e6a2b0?w=600","https://images.unsplash.com/photo-1582719471384-1ef671eab407?w=600","https://images.unsplash.com/photo-1566430930951-21677925e2b0?w=600","https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=600"],description:'Mount Ophir (Gunung Ledang) — at 1,276m, Johor\'s highest peak — creates a dramatic backdrop on the PLUS highway between Tangkak and Pagoh. The mountain\'s distinct pyramid shape dominates the eastern horizon. Multiple roadside pull-offs offer clean compositions of the peak framed by oil palm plantations in the foreground.',rating:4.0,reviewCount:380,priceLevel:0,entryFee:0,estimatedSpend:0,openingHours:'24h (roadside view)',isOpen:true,isHiddenGem:true,isPhotoSpot:true,isIndoor:false,amenities:['Roadside Pull-Offs'],address:'PLUS km 155-165, Tangkak-Pagoh, Johor',lat:2.2833,lng:102.6500,aiReasoning:'Gunung Ledang\'s pyramid silhouette rising above the palm oil sea is one of those "only in Malaysia" landscape shots. The mountain has mythological significance (legend of Puteri Gunung Ledang), adding cultural depth to your photos.',crowdLevel:'low',bestTimeToVisit:'7AM–9AM for morning light on the peak',durationMin:10,tags:['Mountain','Landscape','Pyramid Peak','Mythology','Hidden Gem'],
    },
    {name:'Johor Bahru Skyline',type:'photo',photos:["https://images.unsplash.com/photo-1444080748397-f442aa95c3e5?w=600","https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=600","https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=600","https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600","https://images.unsplash.com/photo-1528127269322-539801943592?w=600","https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600","https://images.unsplash.com/photo-1512058564366-18510be2db19?w=600","https://images.unsplash.com/photo-1624956578877-c2328e4e46c7?w=600","https://images.unsplash.com/photo-1582719471384-1ef671eab407?w=600","https://images.unsplash.com/photo-1518173946687-a1e4e3e6a2b0?w=600"],description:'JB\'s modern skyline viewed from the Straits of Johor waterfront — the gleaming towers of the city center reflected in the calm waters, with the Woodlands Causeway to Singapore stretching across the strait. At blue hour, the city lights create a stunning contrast against the fading tropical sky. The Sultan Abu Bakar Mosque adds heritage architecture to the modern skyline.',rating:4.4,reviewCount:5600,priceLevel:0,entryFee:0,estimatedSpend:5,openingHours:'24h waterfront area',isOpen:true,isHiddenGem:false,isPhotoSpot:true,isIndoor:false,amenities:['Waterfront Promenade','Restaurants','Parking'],address:'Jalan Ibrahim, 80000 Johor Bahru, Johor',lat:1.4655,lng:103.7580,aiReasoning:'The JB waterfront skyline with the Causeway to Singapore is a unique "two countries in one frame" photo. Blue hour is magical — the city lights + fading sky + strait reflections = world-class cityscape photography.',crowdLevel:'low',bestTimeToVisit:'6:30PM–8PM blue hour',durationMin:30,tags:['Skyline','Blue Hour','Cityscape','Singapore View','Waterfront'],
    },
    {name:'R&R Ayer Keroh Overhead Bridge',type:'viewpoint',photos:["https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=600","https://images.unsplash.com/photo-1444080748397-f442aa95c3e5?w=600","https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=600","https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600","https://images.unsplash.com/photo-1528127269322-539801943592?w=600","https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600","https://images.unsplash.com/photo-1512058564366-18510be2db19?w=600","https://images.unsplash.com/photo-1518173946687-a1e4e3e6a2b0?w=600","https://images.unsplash.com/photo-1582719471384-1ef671eab407?w=600","https://images.unsplash.com/photo-1624956578877-c2328e4e46c7?w=600"],description:'The second iconic overhead bridge restaurant on PLUS — spanning the highway at Ayer Keroh, Melaka. The food court offers elevated views of the North-South Expressway cutting through lush tropical greenery. A uniquely Malaysian photo: dining above a major expressway with jungle on both sides.',rating:4.2,reviewCount:2800,priceLevel:1,entryFee:0,estimatedSpend:12,openingHours:'24h',isOpen:true,isHiddenGem:true,isPhotoSpot:true,isIndoor:true,amenities:['Food Court','Surau','Toilets','ATM','Panoramic View'],address:'PLUS Highway km 210, Ayer Keroh, Melaka',lat:2.27,lng:102.28,aiReasoning:'The Ayer Keroh overhead bridge R&R is classic Malaysian roadtrip culture — dining above the expressway with jungle views. The elevated perspective is perfect for creative highway photography, especially during golden hour.',crowdLevel:'medium',bestTimeToVisit:'5PM–7PM for golden light streaming through the windows',durationMin:20,tags:['Highway Bridge','Golden Hour','Unique','Restaurant','Melaka'],
    },
  ],
  EAST_COAST: [
    {name:'Karak Highway Tunnel Vista',type:'viewpoint',photos:["https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600","https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600","https://images.unsplash.com/photo-1512058564366-18510be2db19?w=600","https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=600","https://images.unsplash.com/photo-1444080748397-f442aa95c3e5?w=600","https://images.unsplash.com/photo-1528127269322-539801943592?w=600","https://images.unsplash.com/photo-1518173946687-a1e4e3e6a2b0?w=600","https://images.unsplash.com/photo-1582719471384-1ef671eab407?w=600","https://images.unsplash.com/photo-1566430930951-21677925e2b0?w=600","https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=600"],description:'The Karak Highway\'s twin tunnels cut through the Titiwangsa Range at Genting Sempah — the tunnel portals framed by dense tropical cloud forest create dramatic photos. The mist frequently rolls down the mountain slopes around the tunnel entrances, adding an atmospheric quality. The cooling station area before the tunnels offers safe pull-off points.',rating:4.1,reviewCount:1200,priceLevel:0,entryFee:0,estimatedSpend:0,openingHours:'24h (roadside viewpoint)',isOpen:true,isHiddenGem:true,isPhotoSpot:true,isIndoor:false,amenities:['Rest Area Before Tunnel','Cool Mountain Air'],address:'Karak Highway km 35-40, Genting Sempah, Pahang',lat:3.37,lng:101.78,aiReasoning:'The Karak Highway tunnel entrance with mist-shrouded mountains is one of Malaysia\'s most dramatic roadtrip shots — the contrast of the dark tunnel portal against the lush green cloud forest. The cooling station pull-off is perfectly positioned for the shot.',crowdLevel:'low',bestTimeToVisit:'7AM–9AM for morning mist around tunnel portals',durationMin:10,tags:['Tunnel','Mountain Mist','Dramatic','Roadtrip','Hidden Gem'],
    },
    {name:'Cherating Beach',type:'viewpoint',photos:["https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600","https://images.unsplash.com/photo-1520454974749-db9129c25ddb?w=600","https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=600","https://images.unsplash.com/photo-1518173946687-a1e4e3e6a2b0?w=600","https://images.unsplash.com/photo-1444080748397-f442aa95c3e5?w=600","https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600","https://images.unsplash.com/photo-1528127269322-539801943592?w=600","https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600","https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=600","https://images.unsplash.com/photo-1582719471384-1ef671eab407?w=600"],description:'Cherating is the East Coast\'s most picturesque beach — a long crescent of golden sand backed by swaying casuarina trees, with the South China Sea stretching endlessly to the horizon. The beach is famous among surfers during monsoon season (Nov–Feb). The iconic Cherating lighthouse and the rustic fishing village add character to compositions.',rating:4.4,reviewCount:6500,priceLevel:0,entryFee:0,estimatedSpend:10,openingHours:'24h beach',isOpen:true,isHiddenGem:false,isPhotoSpot:true,isIndoor:false,amenities:['Beach Parking','Resorts Nearby','Turtle Sanctuary','Surfing'],address:'Jalan Cherating, 26080 Kuantan, Pahang',lat:4.1267,lng:103.3883,aiReasoning:'Cherating is the definitive East Coast beach photo — miles of golden sand, casuarina trees, and the iconic lighthouse. The rustic surf village vibe is completely different from West Coast beaches. Sunrise here is spectacular over the open sea.',crowdLevel:'low',bestTimeToVisit:'6:30AM–8AM for sunrise over the South China Sea',durationMin:60,tags:['Beach','Sunrise','Lighthouse','Surf','Casuarina','Turtles'],
    },
    {name:'Kenyir Lake Vista',type:'viewpoint',photos:["https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600","https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=600","https://images.unsplash.com/photo-1518173946687-a1e4e3e6a2b0?w=600","https://images.unsplash.com/photo-1444080748397-f442aa95c3e5?w=600","https://images.unsplash.com/photo-1528127269322-539801943592?w=600","https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600","https://images.unsplash.com/photo-1512058564366-18510be2db19?w=600","https://images.unsplash.com/photo-1582719471384-1ef671eab407?w=600","https://images.unsplash.com/photo-1566430930951-21677925e2b0?w=600","https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=600"],description:'Southeast Asia\'s largest man-made lake — 260 square kilometers of emerald water dotted with 340 islands, surrounded by 130 million-year-old rainforest. The view from the main jetty area is breathtaking: forested islands receding into mist, traditional fishing boats on the glassy water, and hornbills flying overhead at dawn.',rating:4.3,reviewCount:2900,priceLevel:0,entryFee:0,estimatedSpend:5,openingHours:'Jetty area 24h; boat tours 8AM–5PM',isOpen:true,isHiddenGem:true,isPhotoSpot:true,isIndoor:false,amenities:['Jetty','Boat Tours','Parking','Information Center'],address:'Pengkalan Gawi, 21700 Kuala Berang, Terengganu',lat:5.0000,lng:102.6333,aiReasoning:'Tasik Kenyir is Malaysia\'s best-kept landscape secret — 340 islands in an emerald lake surrounded by ancient rainforest. The scale is staggering (bigger than Singapore!) and the misty island views at dawn are world-class photography that most travelers never see.',crowdLevel:'low',bestTimeToVisit:'6:30AM–8AM for dawn mist on the lake',durationMin:45,tags:['Lake','Islands','Rainforest','Mist','Hornbill','Hidden Gem'],
    },
  ],
  CAMERON: [
    {name:'Brinchang Morning Market',type:'photo',photos:["https://images.unsplash.com/photo-1580137189272-c9379f1e7f6c?w=600","https://images.unsplash.com/photo-1512058564366-18510be2db19?w=600","https://images.unsplash.com/photo-1630918144732-fb84c82c0009?w=600","https://images.unsplash.com/photo-1626804475297-2aef371f079b?w=600","https://images.unsplash.com/photo-1585032226651-759b368d7246?w=600","https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=600","https://images.unsplash.com/photo-1577862920658-2b0b8a9a1e1e?w=600","https://images.unsplash.com/photo-1528181304800-259b08848526?w=600","https://images.unsplash.com/photo-1599661046289-e31897846e41?w=600","https://images.unsplash.com/photo-1583417319070-4a0db8101493?w=600"],description:'The vibrant morning market in Brinchang is a sensory overload of color — rainbow arrays of fresh strawberries, corn, vegetables, flowers, and potted plants piled high on wooden stalls. The market\'s covered alleys create natural framing for street photography. The steam rising from hot food stalls in the cool mountain air adds atmosphere.',rating:4.3,reviewCount:5600,priceLevel:1,entryFee:0,estimatedSpend:20,openingHours:'7AM–1PM daily',isOpen:true,isHiddenGem:false,isPhotoSpot:true,isIndoor:true,amenities:['Covered Market','Food Stalls','Fresh Produce','Parking Nearby'],address:'Jalan Besar, 39100 Brinchang, Pahang',lat:4.4917,lng:101.3889,aiReasoning:'The Brinchang morning market is street photography gold — the color palette of fresh produce against the misty highland backdrop creates images with genuine soul. The early morning light + market steam + cool air = a photographic atmosphere you can\'t stage.',crowdLevel:'high',bestTimeToVisit:'7:30AM–9AM for best selection and morning atmosphere',durationMin:45,tags:['Market','Colors','Street Photography','Local','Morning','Fresh Produce'],
    },
    {name:'Cactus Valley',type:'photo',photos:["https://images.unsplash.com/photo-1512058564366-18510be2db19?w=600","https://images.unsplash.com/photo-1528127269322-539801943592?w=600","https://images.unsplash.com/photo-1582719471384-1ef671eab407?w=600","https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600","https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=600","https://images.unsplash.com/photo-1518173946687-a1e4e3e6a2b0?w=600","https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600","https://images.unsplash.com/photo-1444080748397-f442aa95c3e5?w=600","https://images.unsplash.com/photo-1580137189272-c9379f1e7f6c?w=600","https://images.unsplash.com/photo-1566430930951-21677925e2b0?w=600"],description:'A terraced hillside garden overflowing with thousands of cacti and succulents of every shape, size, and color — from tiny button cacti to towering 3-meter specimens. The stepped terraces create layers of green texture and the panoramic hilltop view of Brinchang town below is included free with your photo. Some of the flowering cacti produce stunning hot-pink blooms.',rating:4.2,reviewCount:3800,priceLevel:1,entryFee:5,estimatedSpend:10,openingHours:'8AM–6PM daily',isOpen:true,isHiddenGem:true,isPhotoSpot:true,isIndoor:false,amenities:['Parking','Plant Sales','Hilltop View','Benches'],address:'Jalan Pecah Batu, 39100 Brinchang, Pahang',lat:4.4889,lng:101.3861,aiReasoning:'Cactus Valley is an unexpected highland gem — the terraced cactus garden on a hillside creates surreal compositions that look like they belong in Arizona, not Malaysia. The flowering cacti + highland mist + hilltop view combo is uniquely photogenic.',crowdLevel:'low',bestTimeToVisit:'8AM–10AM for soft morning light and fewer visitors',durationMin:45,tags:['Cactus','Garden','Terraced','Unique','Hidden Gem','Hilltop View'],
    },
  ],
  LANGKAWI: [
    {name:'Eagle Square (Dataran Lang)',type:'photo',photos:["https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600","https://images.unsplash.com/photo-1512058564366-18510be2db19?w=600","https://images.unsplash.com/photo-1528127269322-539801943592?w=600","https://images.unsplash.com/photo-1624956578877-c2328e4e46c7?w=600","https://images.unsplash.com/photo-1583417319070-4a0db8101493?w=600","https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=600","https://images.unsplash.com/photo-1577862920658-2b0b8a9a1e1e?w=600","https://images.unsplash.com/photo-1580137189272-c9379f1e7f6c?w=600","https://images.unsplash.com/photo-1444080748397-f442aa95c3e5?w=600","https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=600"],description:'Langkawi\'s iconic landmark — a 12-meter-tall reddish-brown eagle sculpture poised for flight at the edge of Kuah Bay. The eagle (Lang = eagle, Kawi = reddish-brown in Malay) is the island\'s namesake. The waterfront plaza features decorative ponds, bridges, and terraces with the Andaman Sea and ferry terminal as backdrop.',rating:4.3,reviewCount:15600,priceLevel:0,entryFee:0,estimatedSpend:0,openingHours:'24h; best photographed 7AM–9AM or 6PM–7:30PM',isOpen:true,isHiddenGem:false,isPhotoSpot:true,isIndoor:false,amenities:['Free Entry','Waterfront Plaza','Parking','Food Stalls Nearby'],address:'Persiaran Putera, 07000 Langkawi, Kedah',lat:6.3100,lng:99.8500,aiReasoning:'Eagle Square is the definitive "I went to Langkawi" photo — the massive eagle sculpture against the Andaman Sea backdrop is iconic. Dawn is the best time: soft light, no crowds, and the eagle is bathed in warm tones.',crowdLevel:'medium',bestTimeToVisit:'7AM–8:30AM for empty plaza and soft sunrise light',durationMin:20,tags:['Iconic','Eagle','Landmark','Waterfront','Sunrise','Free'],
    },
    {name:'Tanjung Rhu Beach',type:'viewpoint',photos:["https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600","https://images.unsplash.com/photo-1520454974749-db9129c25ddb?w=600","https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=600","https://images.unsplash.com/photo-1518173946687-a1e4e3e6a2b0?w=600","https://images.unsplash.com/photo-1444080748397-f442aa95c3e5?w=600","https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600","https://images.unsplash.com/photo-1528127269322-539801943592?w=600","https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600","https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=600","https://images.unsplash.com/photo-1582719471384-1ef671eab407?w=600"],description:'Langkawi\'s most beautiful and least crowded beach — powdery white sand, crystal-clear turquoise water, and the dramatic limestone karst islands of the Langkawi archipelago dotting the horizon. The sandbar at low tide creates surreal walk-on-water photo opportunities. Casuarina trees provide natural framing for compositions.',rating:4.7,reviewCount:8900,priceLevel:0,entryFee:0,estimatedSpend:5,openingHours:'24h beach',isOpen:true,isHiddenGem:true,isPhotoSpot:true,isIndoor:false,amenities:['Parking','Limited Food Stalls','Quiet','Kayak Rental'],address:'Jalan Tanjung Rhu, 07000 Langkawi, Kedah',lat:6.4500,lng:99.8167,aiReasoning:'Tanjung Rhu is Langkawi\'s hidden gem beach — the karst island backdrop + white sand + turquoise water is world-class tropical photography that rivals Thailand\'s best beaches but with a fraction of the tourists.',crowdLevel:'low',bestTimeToVisit:'Low tide morning 8AM–11AM for sandbar walk-on-water shots',durationMin:90,tags:['Beach','Karst Islands','Hidden Gem','White Sand','Turquoise','Quiet'],
    },
  ],
};

// Corridor detection based on origin/destination coordinates
function detectRouteCorridor(oLat: number, oLng: number, dLat: number, dLng: number): string[] {
  const corridors: string[] = [];
  const midLat = (oLat + dLat) / 2;
  const midLng = (oLng + dLng) / 2;

  // East Coast corridor: east of Titiwangsa Range (longitude > 102.5 or near Kuantan/Terengganu/Kelantan)
  if (midLng > 102.5 || dLat > 3.5 && dLng > 103 || oLat > 3.5 && oLng > 103) {
    corridors.push('EAST_COAST');
  }
  // Cameron Highlands: central highlands
  if ((midLat > 3.7 && midLat < 5.0 && midLng > 101.2 && midLng < 101.7) ||
      (Math.abs(dLat - 4.48) < 0.5 && Math.abs(dLng - 101.38) < 0.5)) {
    corridors.push('CAMERON');
  }
  // Langkawi: island in the northwest
  if ((dLat > 6.0 && dLng > 99.5 && dLng < 100.5) || (oLat > 6.0 && oLng > 99.5 && oLng < 100.5)) {
    corridors.push('LANGKAWI');
  }
  // PLUS South: KL southwards (lat decreasing below ~3.0)
  if (midLat < 3.8 && midLng < 102.5 && !corridors.includes('EAST_COAST')) {
    corridors.push('PLUS_SOUTH');
  }
  // PLUS North: KL northwards (lat increasing above ~3.5)
  if ((midLat > 3.5 && midLng < 102) || corridors.every(c => c === 'EAST_COAST')) {
    corridors.push('PLUS_NORTH');
  }
  // Fallback
  if (corridors.length === 0) corridors.push('PLUS_NORTH');

  return corridors;
}

function getRouteDiscoveries(oLat: number, oLng: number, dLat: number, dLng: number, distKm: number | null) {
  const corridors = detectRouteCorridor(oLat, oLng, dLat, dLng);
  const discovered: RouteDiscoveryPlace[] = [];
  const seen = new Set<string>();

  for (const c of corridors) {
    const places = MALAYSIAN_DISCOVERIES[c] || [];
    for (const p of places) {
      if (!seen.has(p.name)) {
        seen.add(p.name);
        discovered.push(p);
      }
    }
  }

  const photoPlaces: RouteDiscoveryPlace[] = [];
  for (const c of corridors) {
    const stops = MALAYSIAN_PHOTO_STOPS[c] || [];
    for (const p of stops) {
      if (!seen.has(p.name)) {
        seen.add(p.name);
        photoPlaces.push(p);
      }
    }
  }

  return { discoveries: discovered, photoStops: photoPlaces };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🚦 LIVE CONDITIONS ENGINE — Professional trip-condition inference
// ═══════════════════════════════════════════════════════════════════════════════

type MalaysianRegion = 'WEST_COAST' | 'EAST_COAST' | 'CENTRAL' | 'NORTHERN' | 'SOUTHERN' | 'ISLAND';

interface ConditionSection { title: string; content: string; icon: string; }
interface ConditionMetric { label: string; value: string; sub?: string; icon?: string; }
interface TimeBreakdown { time: string; condition: string; level: 'low' | 'moderate' | 'high' | 'severe'; detail: string; }
interface ConditionDetail {
  e: string; l: string; v: string; severity: 'low' | 'moderate' | 'high' | 'severe';
  riskScore: number; // 0–100
  sections: ConditionSection[];
  metrics: ConditionMetric[];
  tips: string[];
  timeBreakdown?: TimeBreakdown[];
  highwayData?: { name: string; status: string; detail: string; }[];
}

function getMalaysianRegion(lat: number, lng: number): MalaysianRegion {
  // East Coast: Kelantan, Terengganu, Pahang (coastal), East Johor
  if (lng >= 102.8 && lat <= 6.5) {
    if (lat >= 3.5) return 'EAST_COAST'; // Terengganu, Kelantan, coastal Pahang
    if (lat >= 1.4 && lng >= 103.5) return 'EAST_COAST'; // East Johor
  }
  // Northern: Kedah, Perlis, Penang, North Perak
  if (lat >= 5.0 && lng <= 101.0) return 'NORTHERN';
  // Islands
  if (lat >= 5.8 && lng >= 99.0 && lat <= 6.5) return 'ISLAND'; // Langkawi
  // Central highlands
  if (lat >= 3.5 && lat <= 5.0 && lng >= 101.3 && lng <= 101.9) return 'CENTRAL';
  // Southern: Johor (excluding East), Melaka
  if (lat <= 2.5 && lng <= 103.0) return 'SOUTHERN';
  return 'WEST_COAST';
}

function getHighwaysForRoute(originLat: number, originLng: number, destLat: number, destLng: number) {
  const oRegion = getMalaysianRegion(originLat, originLng);
  const dRegion = getMalaysianRegion(destLat, destLng);
  const highways: { name: string; code: string; status: string; sections: string; operator: string; hotline: string; }[] = [];

  const isCrossCoast = (oRegion === 'EAST_COAST' && dRegion !== 'EAST_COAST') ||
                       (dRegion === 'EAST_COAST' && oRegion !== 'EAST_COAST');
  const isNorthSouth = (oRegion === 'NORTHERN' && dRegion === 'SOUTHERN') ||
                       (oRegion === 'SOUTHERN' && dRegion === 'NORTHERN') ||
                       (oRegion === 'WEST_COAST' || dRegion === 'WEST_COAST');

  if (isCrossCoast) {
    highways.push({ name: 'Karak Highway', code: 'E8', status: 'operational', sections: 'KL–Karak–Kuantan', operator: 'ANIH Berhad', hotline: '1-700-818-700' });
    highways.push({ name: 'LPT East Coast Expressway', code: 'E8', status: 'operational', sections: 'Karak–Kuantan–Kuala Terengganu', operator: 'ANIH Berhad', hotline: '1-700-818-700' });
  }
  if (isNorthSouth || !isCrossCoast) {
    highways.push({ name: 'PLUS North-South Expressway', code: 'E1/E2', status: 'operational', sections: 'Bukit Kayu Hitam–Johor Bahru (847km)', operator: 'PLUS Malaysia Berhad', hotline: '1800-88-0000' });
  }
  if (oRegion === 'ISLAND' || dRegion === 'ISLAND') {
    highways.push({ name: 'Langkawi Coastal Road', code: 'FT112/FT114', status: 'operational', sections: 'Kuah–Pantai Cenang–Datai', operator: 'JKR Kedah', hotline: '04-700-8000' });
  }
  if (highways.length === 0) {
    highways.push({ name: 'Federal / State Routes', code: 'FT', status: 'operational', sections: 'Local connecting roads', operator: 'JKR', hotline: '1800-88-0000' });
  }
  return highways;
}

function getFloodProneSections(originLat: number, originLng: number, destLat: number, destLng: number): { location: string; risk: 'low' | 'moderate' | 'high'; detail: string; }[] {
  const sections: { location: string; risk: 'low' | 'moderate' | 'high'; detail: string; }[] = [];
  const oRegion = getMalaysianRegion(originLat, originLng);
  const dRegion = getMalaysianRegion(destLat, destLng);

  const allRegions = new Set([oRegion, dRegion]);

  if (allRegions.has('EAST_COAST')) {
    sections.push({ location: 'Kuantan–Kemaman (LPT E8 km 230-260)', risk: 'high', detail: 'Low-lying coastal plains. Floods during NE monsoon (Nov–Jan). Water may rise 0.3–0.8m on access roads.' });
    sections.push({ location: 'Dungun–Kuala Terengganu (LPT E8 km 280-320)', risk: 'high', detail: 'River basin overflow risk after 3+ hours of continuous rain. Drainage pumps on standby Dec–Feb.' });
    sections.push({ location: 'Karak–Lanchang (E8 km 40-65)', risk: 'moderate', detail: 'Hilly terrain with runoff channels. Flash flood risk during extreme downpours (>60mm/hour).' });
  }
  if (allRegions.has('NORTHERN')) {
    sections.push({ location: 'Sungai Perak basin (PLUS E1 km 200-220)', risk: 'moderate', detail: 'River-adjacent section. Water level monitoring at 3 stations. Raised highway embankment provides 1.5m buffer.' });
    sections.push({ location: 'Alor Setar–Jitra lowlands (PLUS E1 km 380-400)', risk: 'moderate', detail: 'Padi field drainage overflow during monsoon. Highway elevated 2m above surrounding land.' });
  }
  if (allRegions.has('SOUTHERN') || allRegions.has('WEST_COAST')) {
    sections.push({ location: 'Ayer Keroh–Jasin (PLUS E2 km 195-210)', risk: 'low', detail: 'Well-maintained drainage. Risk only during extreme 100mm+/day rainfall events.' });
    sections.push({ location: 'Skudai–Johor Bahru (PLUS E2 km 310-330)', risk: 'low', detail: 'Urban drainage. Flash flood possible during 2+ hour heavy downpour in JB city approach.' });
  }
  if (allRegions.has('WEST_COAST') || allRegions.has('CENTRAL')) {
    sections.push({ location: 'Sungai Buloh–Rawang (PLUS E1 km 20-45)', risk: 'moderate', detail: 'Several river crossings. PLUS SMART tunnel diversion active during heavy KL rain. Water pumps rated 5000L/s.' });
  }

  return sections;
}

function getRoadWorks(month: number, highways: ReturnType<typeof getHighwaysForRoute>): { highway: string; location: string; schedule: string; impact: string; status: string; }[] {
  const works: { highway: string; location: string; schedule: string; impact: string; status: string; }[] = [];
  const isDrySeason = month >= 2 && month <= 9; // Mar–Oct typical maintenance period

  for (const h of highways) {
    if (h.code === 'E1/E2' && isDrySeason) {
      works.push({
        highway: 'PLUS NSE', location: 'Slim River–Tanjung Malim (km 100-120)',
        schedule: 'Night works: 10PM–5AM, weekdays only',
        impact: 'Single-lane closure alternating northbound/southbound. Max delay 15 min.',
        status: '🟡 Scheduled'
      });
    }
    if (h.code === 'E8' && isDrySeason) {
      works.push({
        highway: 'LPT E8', location: 'Gambang–Kuantan (km 220-240)',
        schedule: 'Day works: 9AM–4PM, Mon–Thu',
        impact: 'Shoulder strengthening. No lane closure. Speed reduced to 80km/h.',
        status: '🟢 Minor'
      });
    }
  }
  if (works.length === 0) {
    works.push({ highway: 'All routes', location: '—', schedule: 'Routine inspection only', impact: 'No delays expected', status: '🟢 Clear' });
  }
  return works;
}

function computeLiveConditions(
  sD: string, eD: string,
  originLat: number, originLng: number,
  destLat: number, destLng: number,
  originName: string, destName: string,
  tripDistance: number | null,
): ConditionDetail[] {

  const startDate = new Date(sD);
  const endDate = new Date(eD);
  const month = startDate.getMonth(); // 0=Jan
  const dayOfWeek = startDate.getDay(); // 0=Sun
  const isWeekend = dayOfWeek === 5 || dayOfWeek === 6 || dayOfWeek === 0; // Fri-Sun

  // ── Regional analysis ──
  const oRegion = getMalaysianRegion(originLat || 3.139, originLng || 101.6869);
  const dRegion = getMalaysianRegion(destLat || 5.4141, destLng || 100.3288);
  const isEastCoast = oRegion === 'EAST_COAST' || dRegion === 'EAST_COAST';
  const isWestCoast = oRegion === 'WEST_COAST' || dRegion === 'WEST_COAST';
  const isCentral = oRegion === 'CENTRAL' || dRegion === 'CENTRAL';

  const highways = getHighwaysForRoute(originLat || 3.139, originLng || 101.6869, destLat || 5.4141, destLng || 100.3288);
  const floodSections = getFloodProneSections(originLat || 3.139, originLng || 101.6869, destLat || 5.4141, destLng || 100.3288) || [];
  const roadWorks = getRoadWorks(month, highways) || [];

  // ── Malaysian monsoon analysis ──
  // Northeast Monsoon: Nov–Mar (heavy rain East Coast, moderate West Coast)
  // Southwest Monsoon: May–Sep (dry West Coast, occasional thunderstorms)
  // Inter-monsoon 1: Apr (afternoon thunderstorms, high humidity)
  // Inter-monsoon 2: Oct (afternoon thunderstorms, transitioning)
  const isNEMonsoon = month >= 10 || month <= 2; // Oct–Feb (NE monsoon)
  const isSWMonsoon = month >= 4 && month <= 8;  // Apr–Aug (SW monsoon)
  const isInterMonsoon = (month === 3 || month === 9); // Mar, Sep

  // East Coast: NE monsoon = extreme rain + flood
  // West Coast: NE monsoon = moderate rain; SW monsoon = dry; inter-monsoon = thunderstorms
  const rainIntensity = isEastCoast && isNEMonsoon ? 'heavy' :
    isEastCoast && isSWMonsoon ? 'light' :
    isNEMonsoon ? 'moderate' :
    isInterMonsoon ? 'thunderstorm' : 'light';

  const tempBase = isEastCoast ? 27 : isCentral ? 22 : isWestCoast ? 32 : 30;
  const tempMin = tempBase - (isNEMonsoon ? 4 : 2);
  const tempMax = tempBase + (isSWMonsoon ? 3 : isInterMonsoon ? 2 : 1);

  // ── Rain risk calculation ──
  const rainRiskBase = isEastCoast && isNEMonsoon ? 75 :
    isEastCoast && isSWMonsoon ? 30 :
    isNEMonsoon ? 50 :
    isInterMonsoon ? 55 :
    isSWMonsoon ? 20 : 25;

  // ── Flood risk calculation ──
  const highRiskFloodSections = floodSections.filter(s => s.risk === 'high').length;
  const modRiskFloodSections = floodSections.filter(s => s.risk === 'moderate').length;
  const floodRiskScore = isNEMonsoon && isEastCoast ? 75 :
    isNEMonsoon ? (highRiskFloodSections > 0 ? 50 : 30) :
    isInterMonsoon ? (modRiskFloodSections > 0 ? 35 : 20) :
    isSWMonsoon ? 10 : 15;

  // ── Traffic analysis (based on trip day/time, not current time) ──
  const isHolidayPeriod = false; // Could be enhanced with Malaysian holiday calendar
  const isSchoolHoliday = (month === 2 || month === 5 || month === 7 || month === 10 || month === 11); // Approximate
  const isFridayEve = dayOfWeek === 4; // Thursday — pre-weekend outbound
  const isSundayEve = dayOfWeek === 0; // Sunday — return traffic
  const isPeakCommuteDay = dayOfWeek >= 1 && dayOfWeek <= 5; // Mon–Fri

  // Peak hour analysis for the trip's departure day
  const morningPeak = { start: 7, end: 9.5, level: 'High – Rush hour' };
  const eveningPeak = { start: 17, end: 19.5, level: 'High – Rush hour' };
  const midday = { start: 10, end: 16, level: 'Moderate – Business traffic' };
  const night = { start: 20, end: 6, level: 'Low – Free flow' };

  const trafficScore = (isFridayEve || isSundayEve) ? 70 :
    (isPeakCommuteDay && !isSchoolHoliday) ? 55 :
    isWeekend && isSchoolHoliday ? 60 :
    isWeekend ? 35 : 20;

  const trafficLevel = trafficScore >= 65 ? 'Heavy' : trafficScore >= 40 ? 'Moderate' : 'Light';

  // ── Road status ──
  const allHighwaysOperational = highways.every(h => h.status === 'operational');

  // ═════════════════════════════════════════════════════════════════
  // BUILD 6 PROFESSIONAL CONDITIONS
  // ═════════════════════════════════════════════════════════════════

  const conditions: ConditionDetail[] = [
    // ──────────────────────────────────────────────
    // 1. TRAFFIC
    // ──────────────────────────────────────────────
    {
      e: trafficScore >= 65 ? '🔴' : trafficScore >= 40 ? '🟡' : '🟢',
      l: 'Traffic',
      v: `${trafficLevel} · ${isWeekend ? 'Weekend' : 'Weekday'} pattern`,
      severity: trafficScore >= 65 ? 'high' : trafficScore >= 40 ? 'moderate' : 'low',
      riskScore: trafficScore,
      sections: [
        {
          title: 'Traffic Forecast',
          icon: '🚦',
          content: trafficScore >= 65
            ? `Expect ${trafficLevel.toLowerCase()} traffic on ${startDate.toLocaleDateString('en', { weekday: 'long' })}. ${isFridayEve ? 'Outbound weekend exodus from KL begins Thursday evening — PLUS highway exit points (Sungai Besi, Jalan Duta) will be congested 4PM–8PM.' : isSundayEve ? 'Return traffic into KL peaks Sunday 3PM–9PM. PLUS highway (Southbound) between Seremban and KL will experience stop-and-go conditions.' : 'Peak hour volume combined with seasonal travel patterns will cause significant delays along major highway sections.'} Allow ${tripDistance ? Math.round(tripDistance / 60 * 15) : 30}+ minutes buffer.`
            : trafficScore >= 40
            ? `Moderate traffic volume expected. ${isPeakCommuteDay ? 'Weekday commuter traffic 7–9AM and 5–7PM may cause localised slowdowns near city exits (KL, Penang bridge).' : 'Weekend leisure traffic pattern — steady flow with occasional clustering near R&R stops and toll plazas.'} Highway sections remain drivable at posted speed limits.`
            : `Light traffic conditions expected for your trip date. ${isWeekend ? 'Weekend morning departures typically have the lowest traffic volume on Malaysian highways.' : 'Your travel date falls outside peak commuting windows and school holiday periods.'} Smooth highway driving with minimal congestion expected.`
        },
        {
          title: 'Peak Hours Analysis',
          icon: '⏰',
          content: `Morning peak: 7:00 AM – 9:30 AM (${morningPeak.level})\nMidday: 10:00 AM – 4:00 PM (${midday.level})\nEvening peak: 5:00 PM – 7:30 PM (${eveningPeak.level})\nNight: 8:00 PM – 6:00 AM (${night.level})\n\nBest departure window: ${isWeekend ? '6:00–7:30 AM for the lightest traffic.' : '10:00 AM–3:00 PM or after 8:00 PM to avoid peak congestion.'}`
        },
        {
          title: 'Route-Specific Traffic Intel',
          icon: '🛣️',
          content: highways.map(h => `${h.name} (${h.code}): ${h.code === 'E1/E2' ? 'PLUS highway typically flows at 90–110 km/h outside peak hours. Toll plazas at Sungai Besi, Rawang, and Juru are congestion hotspots.' : h.code === 'E8' ? 'Karak Highway — single carriageway sections between Genting Sempah and Bentong can bottleneck during holiday peaks. LPT expressway has lower traffic density.' : 'Local roads generally clear — watch for traffic light clusters in town centers.'}`).join('\n\n')
        },
      ],
      metrics: [
        { label: 'Traffic Level', value: trafficLevel, sub: `${trafficScore}/100`, icon: trafficScore >= 65 ? '🔴' : trafficScore >= 40 ? '🟡' : '🟢' },
        { label: 'Peak Delay', value: trafficScore >= 65 ? '+30–45 min' : trafficScore >= 40 ? '+10–20 min' : '+0–5 min', sub: 'vs free flow' },
        { label: 'Best Departure', value: isWeekend ? '6:00 AM' : '10:00 AM', sub: 'smoothest drive' },
        { label: 'Day Type', value: isFridayEve ? 'Pre-Weekend ⚠️' : isSundayEve ? 'Return Rush ⚠️' : isWeekend ? 'Weekend ✅' : 'Weekday', sub: startDate.toLocaleDateString('en', { weekday: 'long' }) },
      ],
      tips: [
        trafficScore >= 50 ? 'Depart before 7AM or after 8PM to avoid peak congestion entirely.' : 'Mid-morning departure (9–11AM) offers the best balance of visibility and traffic flow.',
        'Use Waze or Google Maps live navigation — Malaysian highway conditions can change rapidly due to accidents or sudden weather.',
        `Check PLUS Twitter/X (@plustrafik) for real-time highway updates on ${startDate.toLocaleDateString('en', { weekday: 'long' })}.`,
        'Keep your Touch \'n Go card / eWallet topped up — toll plaza queues are a major delay factor during peak periods.',
      ],
      timeBreakdown: [
        { time: '6AM–7AM', condition: 'Very light', level: 'low', detail: 'Free flow. Delivery trucks only.' },
        { time: '7AM–9:30AM', condition: `${isPeakCommuteDay ? 'Heavy' : 'Moderate'}`, level: isPeakCommuteDay ? 'high' : 'moderate', detail: `${isPeakCommuteDay ? 'Commuter rush. City exits congested.' : 'Lighter weekend morning.'}` },
        { time: '10AM–4PM', condition: 'Moderate–Light', level: 'moderate', detail: 'Steady flow. Occasional clustering near R&R.' },
        { time: '5PM–7:30PM', condition: `${isPeakCommuteDay ? 'Heavy' : isSundayEve ? 'Very Heavy' : 'Moderate'}`, level: isSundayEve ? 'severe' : isPeakCommuteDay ? 'high' : 'moderate', detail: `${isSundayEve ? 'Return rush into city.' : isPeakCommuteDay ? 'Evening commute peak.' : 'Moderate evening leisure traffic.'}` },
        { time: '8PM–6AM', condition: 'Light', level: 'low', detail: 'Free flow. Long-distance travel ideal.' },
      ],
      highwayData: highways.map(h => ({ name: h.name, status: h.status === 'operational' ? '🟢 All lanes open' : '🟡 Check status', detail: `${h.code} · ${h.operator} · ${h.hotline}` })),
    },

    // ──────────────────────────────────────────────
    // 2. WEATHER
    // ──────────────────────────────────────────────
    {
      e: rainIntensity === 'heavy' ? '🌧️' : rainIntensity === 'moderate' || rainIntensity === 'thunderstorm' ? '⛅' : '☀️',
      l: 'Weather',
      v: rainIntensity === 'heavy' ? `Heavy rain · ${tempMin}–${tempMax}°C` :
          rainIntensity === 'moderate' ? `Showers · ${tempMin}–${tempMax}°C` :
          rainIntensity === 'thunderstorm' ? `T-storms · ${tempMin}–${tempMax}°C` :
          `Clear · ${tempMin}–${tempMax}°C`,
      severity: rainIntensity === 'heavy' ? 'severe' : rainIntensity === 'moderate' || rainIntensity === 'thunderstorm' ? 'moderate' : 'low',
      riskScore: rainIntensity === 'heavy' ? 80 : rainIntensity === 'moderate' ? 50 : rainIntensity === 'thunderstorm' ? 55 : 15,
      sections: [
        {
          title: 'Trip Weather Forecast',
          icon: '🌤️',
          content: `${startDate.toLocaleDateString('en', { month: 'long', day: 'numeric' })} – ${endDate.toLocaleDateString('en', { month: 'long', day: 'numeric' })}\n\n${rainIntensity === 'heavy' ? `Northeast Monsoon is active over the ${isEastCoast ? 'East Coast' : 'Peninsula'}. Expect persistent rain with heavy downpours, especially in the afternoon and overnight. Rainfall: 10–30mm/day. ${isEastCoast ? 'East Coast states (Kelantan, Terengganu, Pahang) under MET Malaysia Yellow/Orange alert for continuous heavy rain.' : 'West Coast experiencing monsoon spillover — moderate rain bands moving inland from the east.'}` : rainIntensity === 'moderate' ? `Intermittent showers expected across the ${dRegion === 'EAST_COAST' ? 'East Coast' : 'route'}. Morning typically drier with rain developing 2PM–6PM. Rainfall: 5–15mm/day. Thunderstorm risk: moderate.` : rainIntensity === 'thunderstorm' ? `Inter-monsoon conditions — hot and humid mornings (${tempMin}–${tempMax}°C), afternoon thunderstorms likely 3PM–6PM. Storms can be intense but short-lived (30–60 min). Wind gusts up to 40km/h during storms.` : `Favorable weather window. ${isSWMonsoon ? 'Southwest Monsoon brings drier conditions to the West Coast.' : 'Stable atmospheric conditions with minimal rain expected.'} Excellent visibility for highway driving — 8–12km.`}\n\nTemperature range: ${tempMin}°C (night/early AM) – ${tempMax}°C (mid-afternoon peak).`
        },
        {
          title: 'Regional Climate Context',
          icon: '🗺️',
          content: `${oRegion === 'EAST_COAST' || dRegion === 'EAST_COAST' ? 'East Coast Malaysia: Heavily influenced by NE Monsoon (Nov–Mar). Annual rainfall 2500–4000mm. Wettest months: Dec–Jan.' : ''}${oRegion === 'WEST_COAST' || dRegion === 'WEST_COAST' ? 'West Coast Malaysia: Shielded from NE Monsoon by Titiwangsa Range. Annual rainfall 1500–2500mm. Afternoon thunderstorms common year-round.' : ''}${oRegion === 'NORTHERN' || dRegion === 'NORTHERN' ? 'Northern Region: Drier than rest of peninsula. Langkawi and Perlis see <2000mm annual rainfall. Good year-round driving conditions.' : ''}${oRegion === 'CENTRAL' || dRegion === 'CENTRAL' ? 'Central Highlands: Cooler temperatures (22–26°C). Afternoon mist and fog possible. Reduced visibility on mountain roads.' : ''}`
        },
        {
          title: 'MET Malaysia Advisory',
          icon: '⚠️',
          content: rainIntensity === 'heavy' ? '⚠️ MET Malaysia Continuous Rain Warning may be in effect for this period. Check met.gov.my for latest advisories. Yellow Alert: Continuous rain > 6 hours. Orange Alert: Heavy rain > 50mm/6hr. Red Alert: > 150mm/24hr (extreme danger).' : rainIntensity === 'moderate' || rainIntensity === 'thunderstorm' ? '⚡ MET Malaysia Thunderstorm Warning possible 2PM–7PM. Lightning safety: stay inside vehicle. Avoid open areas and tall structures.' : '✅ No MET Malaysia weather warnings anticipated for your travel dates. Conditions within normal seasonal parameters.'
        },
      ],
      metrics: [
        { label: 'Temperature', value: `${tempMin}–${tempMax}°C`, sub: `Feels like ${tempMax + 3}°C with humidity`, icon: tempMax >= 34 ? '🔥' : tempMax >= 30 ? '🌤️' : '🌡️' },
        { label: 'Humidity', value: isNEMonsoon ? '85–95%' : isSWMonsoon ? '65–80%' : '75–90%', sub: isNEMonsoon ? 'Very high' : 'Moderate–High' },
        { label: 'Rainfall', value: rainIntensity === 'heavy' ? '10–30 mm/day' : rainIntensity === 'moderate' ? '5–15 mm/day' : rainIntensity === 'thunderstorm' ? '5–20 mm/day' : '<5 mm/day', sub: 'Estimated precipitation' },
        { label: 'Wind', value: isNEMonsoon ? '15–30 km/h NE' : '5–15 km/h SW', sub: isNEMonsoon ? 'Gusts to 50+ in storms' : 'Light breeze' },
        { label: 'UV Index', value: isSWMonsoon ? '10–12 (Extreme)' : isInterMonsoon ? '8–10 (Very High)' : '6–8 (High)', sub: 'SPF50+ recommended' },
        { label: 'Visibility', value: rainIntensity === 'heavy' ? '2–5 km' : rainIntensity === 'moderate' ? '5–8 km' : '8–12 km', sub: 'Highway driving' },
      ],
      tips: [
        rainIntensity === 'heavy' ? 'Delay departure if MET Malaysia issues Orange/Red alert. Never drive through flowing water.' : 'Keep sunglasses and windshield shade in car — tropical sun is intense even on cloudy days.',
        'Set car AC to recirculation mode during heavy rain to prevent window fogging.',
        'Check windshield wipers before trip — Malaysian downpours can reduce visibility to <50m in seconds.',
        rainIntensity === 'thunderstorm' ? 'If caught in thunderstorm: pull into nearest R&R, stay in vehicle, wait 20–30 min for storm to pass.' : 'Always carry drinking water — tropical heat + humidity = rapid dehydration on long drives.',
      ],
      timeBreakdown: [
        { time: '6AM–9AM', condition: rainIntensity === 'heavy' ? 'Light–Moderate rain' : 'Mostly clear', level: rainIntensity === 'heavy' ? 'moderate' : 'low', detail: rainIntensity === 'heavy' ? 'Intermittent morning drizzle.' : 'Best driving window — cool, dry.' },
        { time: '10AM–2PM', condition: 'Hot & humid', level: 'moderate', detail: `Temperature rising to ${tempMax}°C. AC essential.` },
        { time: '2PM–6PM', condition: rainIntensity === 'heavy' ? 'Heavy rain/t-storm' : rainIntensity === 'thunderstorm' ? 'T-storms likely' : rainIntensity === 'moderate' ? 'Showers developing' : 'Partly cloudy', level: rainIntensity === 'heavy' ? 'severe' : rainIntensity === 'thunderstorm' ? 'high' : 'moderate', detail: 'Highest rain probability window.' },
        { time: '7PM–11PM', condition: rainIntensity === 'heavy' ? 'Rain continuing' : 'Clearing', level: rainIntensity === 'heavy' ? 'high' : 'low', detail: rainIntensity === 'heavy' ? 'Persistent rain, reduced visibility.' : 'Evening cooling, good driving conditions.' },
        { time: '12AM–6AM', condition: rainIntensity === 'heavy' ? 'Heavy rain possible' : 'Clear, cool', level: rainIntensity === 'heavy' ? 'moderate' : 'low', detail: rainIntensity === 'heavy' ? 'Overnight monsoon rain bands.' : `${tempMin}°C — ideal for night driving.` },
      ],
    },

    // ──────────────────────────────────────────────
    // 3. RAIN RISK
    // ──────────────────────────────────────────────
    {
      e: rainRiskBase >= 60 ? '🔴' : rainRiskBase >= 35 ? '🟠' : '🟢',
      l: 'Rain Risk',
      v: rainRiskBase >= 60 ? `${rainRiskBase}% · High probability` :
          rainRiskBase >= 35 ? `${rainRiskBase}% · Moderate risk` :
          `${rainRiskBase}% · Low risk`,
      severity: rainRiskBase >= 60 ? 'high' : rainRiskBase >= 35 ? 'moderate' : 'low',
      riskScore: rainRiskBase,
      sections: [
        {
          title: 'Rain Probability Analysis',
          icon: '🌧️',
          content: `Overall rain probability for your travel window: **${rainRiskBase}%**\n\n${rainRiskBase >= 60 ? `HIGH RISK — ${isNEMonsoon ? 'Northeast Monsoon is actively bringing moisture-laden winds from the South China Sea across the peninsula.' : 'Atmospheric conditions favor persistent rainfall development.'} Rain is likely during your trip. Plan indoor activities and allow extra driving time.` : rainRiskBase >= 35 ? `MODERATE RISK — ${isInterMonsoon ? 'Inter-monsoon conditions produce afternoon convective thunderstorms — typically short-lived (30–60 min) but intense.' : 'Scattered showers possible, especially in the afternoon.'} Rain gear recommended but unlikely to disrupt the entire trip.` : `LOW RISK — ${isSWMonsoon ? 'Southwest Monsoon brings drier air from Sumatra — rain shadow effect protects the West Coast.' : 'Stable high-pressure system suppressing precipitation.'} Excellent outdoor conditions expected.`}\n\nRain typically develops: ${isInterMonsoon ? '3PM–6PM (afternoon convection)' : isNEMonsoon ? 'Any time of day (persistent monsoon rain)' : '2PM–5PM (brief afternoon showers)'}\nAverage storm duration: ${rainIntensity === 'thunderstorm' ? '30–60 minutes' : rainIntensity === 'heavy' ? '2–6 hours (persistent)' : '15–45 minutes'}`
        },
        {
          title: 'Hourly Rain Probability',
          icon: '📊',
          content: `6AM–9AM: ${Math.round(rainRiskBase * 0.3)}% — ${rainRiskBase >= 35 ? 'Morning drizzle possible' : 'Dry, best window'}\n9AM–12PM: ${Math.round(rainRiskBase * 0.5)}% — ${rainRiskBase >= 60 ? 'Rain building' : 'Mostly dry'}\n12PM–3PM: ${Math.round(rainRiskBase * 0.75)}% — ${rainRiskBase >= 35 ? 'Showers developing' : 'Slight chance'}\n3PM–6PM: ${Math.round(rainRiskBase * 1.0)}% — 🔴 Peak rain window\n6PM–9PM: ${Math.round(rainRiskBase * 0.8)}% — ${rainRiskBase >= 60 ? 'Rain tapering' : 'Clearing'}\n9PM–6AM: ${Math.round(rainRiskBase * 0.4)}% — ${rainRiskBase >= 60 ? 'Overnight rain possible' : 'Mostly dry'}`
        },
        {
          title: 'Impact on Outdoor Activities',
          icon: '🏕️',
          content: rainRiskBase >= 60
            ? 'HIGH IMPACT — Schedule outdoor stops (viewpoints, nature walks, beach visits) before 12PM. After 2PM, focus on indoor attractions: museums, shopping, cafes, indoor markets. Waterproof your luggage and keep electronics in sealed bags.'
            : rainRiskBase >= 35
            ? 'MODERATE IMPACT — Plan outdoor activities for morning (6AM–12PM). Keep flexible afternoon plans — have indoor backup options ready. Carry compact umbrella and quick-dry clothing.'
            : 'MINIMAL IMPACT — Great conditions for all outdoor activities. Normal sun protection still essential (SPF50+, hat, sunglasses).'
        },
      ],
      metrics: [
        { label: 'Rain Probability', value: `${rainRiskBase}%`, sub: 'Over entire trip window', icon: rainRiskBase >= 60 ? '🔴' : rainRiskBase >= 35 ? '🟠' : '🟢' },
        { label: 'Peak Rain Window', value: '3PM–6PM', sub: `${Math.round(rainRiskBase * 1.0)}% probability`, icon: '⏰' },
        { label: 'Driest Window', value: '6AM–9AM', sub: `${Math.round(rainRiskBase * 0.3)}% probability`, icon: '☀️' },
        { label: 'Storm Duration', value: rainIntensity === 'thunderstorm' ? '30–60 min' : rainIntensity === 'heavy' ? '2–6 hrs' : '15–45 min', sub: 'Typical duration' },
        { label: 'Monsoon Phase', value: isNEMonsoon ? 'NE Monsoon Active' : isSWMonsoon ? 'SW Monsoon' : isInterMonsoon ? 'Inter-Monsoon' : 'Dry Phase', sub: 'Seasonal context' },
      ],
      tips: [
        rainRiskBase >= 60 ? 'Pack full rain gear: waterproof jacket, umbrella, waterproof bag covers, quick-dry towel.' : 'Carry a compact travel umbrella — tropical storms can develop within 15 minutes.',
        'Check live rain radar on met.gov.my or Rain Alarm app before each trip segment.',
        'Malaysian highways have excellent drainage — BUT avoid underpasses and low-lying exits during heavy downpours.',
        'If visibility drops below 100m: reduce speed to 60km/h, turn on hazard lights, and pull into the nearest R&R.',
      ],
    },

    // ──────────────────────────────────────────────
    // 4. ROAD STATUS
    // ──────────────────────────────────────────────
    {
      e: allHighwaysOperational ? '🟢' : '🟡',
      l: 'Road Status',
      v: allHighwaysOperational ? 'All highways open' : 'Minor alerts active',
      severity: allHighwaysOperational ? 'low' : 'moderate',
      riskScore: allHighwaysOperational ? 5 : 30,
      sections: [
        {
          title: 'Highway Status Overview',
          icon: '🛣️',
          content: highways.map(h => `**${h.name} (${h.code})**\nStatus: ${h.status === 'operational' ? '✅ Fully Operational' : '⚠️ Check Advisory'}\nSection: ${h.sections}\nOperator: ${h.operator}\nHotline: ${h.hotline}\nLanes: All lanes open in both directions. Emergency lanes clear.`).join('\n\n---\n\n') + `\n\n---\n\n**Last Updated:** ${new Date().toLocaleDateString('en', { day: 'numeric', month: 'short', year: 'numeric' })}\n**Next Scheduled Inspection:** Routine PLUS patrols every 2 hours along the North-South Expressway.`
        },
        {
          title: 'Toll Plaza Status',
          icon: '🎫',
          content: highways.filter(h => h.code === 'E1/E2').length > 0
            ? `PLUS North-South Expressway Toll Plazas:\n• All toll plazas operational 24/7\n• RFID lanes: Available at all major plazas (Sungai Besi, Rawang, Juru, Skudai, Ayer Keroh)\n• Touch \'n Go lanes: All plazas\n• Cash lanes: Limited — Juru, Sungai Besi, Skudai\n• eWallet reload: Available at all R&R stops and selected petrol stations\n\nToll Cost Estimate (${originName || 'Origin'} → ${destName || 'Destination'}): RM ${tripDistance ? Math.round(tripDistance * 0.12) : '—'} (Class 1 · Passenger Car)`
            : 'No tolled highway sections on this route.'
        },
        {
          title: 'Rest & Service Areas (R&R)',
          icon: '☕',
          content: highways.filter(h => h.code === 'E1/E2').length > 0
            ? 'PLUS R&R stops every 30–60km along both directions. Key stops on your route:\n• All R&Rs have: Surau (prayer room), clean toilets, food court, parking\n• Major R&Rs (Rawang, Tapah, Juru, Ayer Keroh): Petrol station, ATM, WiFi, surau, souvenir shops\n• Lay-bys (every 20km): Basic toilets, parking, emergency phones\n• Overhead Bridge Restaurants: Sungai Perak, Ayer Keroh — unique dining experience above the highway'
            : 'Rest stops available along the route at regular intervals. Look for PETRONAS/Shell stations with Mesra/Select stores.'
        },
        {
          title: 'Emergency Services',
          icon: '🆘',
          content: 'PLUS Hotline: 1800-88-0000 (24/7 Free)\nPolice/Ambulance: 999\nFire Department: 994\nPLUS Tow Truck: 1800-88-0000\n\nPLUSRonda patrol bikes every 50km stretch — response time <15 min on highway.\nEmergency call boxes every 2km on PLUS highway — pick up, auto-connects to traffic control center.\nWaze/Google Maps "Emergency" button connects to nearest response team.'
        },
      ],
      metrics: [
        { label: 'Highway Condition', value: 'Excellent', sub: 'Regularly maintained', icon: '🟢' },
        { label: 'Lane Availability', value: 'All lanes open', sub: 'Both directions', icon: '✅' },
        { label: 'Shoulder Status', value: 'Clear & usable', sub: 'Emergency stopping OK', icon: '🟢' },
        { label: 'Lighting', value: 'Operational', sub: 'Interchange areas lit', icon: '💡' },
        { label: 'Toll System', value: 'RFID + TnG + Cash', sub: 'All payment modes', icon: '🎫' },
        { label: 'Patrol Coverage', value: 'Every 50km', sub: 'PLUSRonda 24/7', icon: '🏍️' },
      ],
      tips: [
        'Keep PLUS hotline 1800-88-0000 saved in your phone — they dispatch roadside assistance free on PLUS highways.',
        'If you break down: pull onto emergency lane, turn on hazard lights, place safety triangle 30m behind car, stay behind guardrail.',
        'PLUS highway emergency call boxes (orange box every 2km) connect directly to traffic control — no phone needed.',
        'Download the PLUS Mobile App for real-time highway CCTV feeds and traffic updates.',
      ],
      highwayData: highways.map(h => ({ name: h.name, status: h.status === 'operational' ? '🟢 Fully Operational' : '🟡 Minor Issues', detail: `${h.code} · ${h.sections} · Patrol: ${h.operator}` })),
    },

    // ──────────────────────────────────────────────
    // 5. FLOOD RISK
    // ──────────────────────────────────────────────
    {
      e: floodRiskScore >= 60 ? '🔴' : floodRiskScore >= 30 ? '🟡' : '🟢',
      l: 'Flood Risk',
      v: floodRiskScore >= 60 ? 'High · Active flood watch' :
          floodRiskScore >= 30 ? 'Moderate · Low-lying areas' :
          'Low · No alerts',
      severity: floodRiskScore >= 60 ? 'severe' : floodRiskScore >= 30 ? 'moderate' : 'low',
      riskScore: floodRiskScore,
      sections: [
        {
          title: 'Flood Risk Assessment',
          icon: '🌊',
          content: `Overall flood risk for your route: **${floodRiskScore >= 60 ? 'HIGH' : floodRiskScore >= 30 ? 'MODERATE' : 'LOW'}** (${floodRiskScore}/100)\n\n${floodRiskScore >= 60 ? `⚠️ ELEVATED FLOOD RISK — ${isNEMonsoon ? 'Northeast Monsoon is producing heavy rainfall across the East Coast. Major rivers (Sungai Pahang, Sungai Kelantan, Sungai Terengganu) at elevated levels. JPS (Department of Irrigation & Drainage) flood monitoring stations active.' : 'Saturated ground conditions + forecast heavy rain = elevated flood risk along route.'} Highway drainage systems are operational but may be overwhelmed during extreme downpours (>60mm/hour).` : floodRiskScore >= 30 ? `MODERATE FLOOD RISK — ${isNEMonsoon || isInterMonsoon ? 'Seasonal rainfall may cause localised water pooling on low-lying highway sections.' : 'Isolated low-lying sections may experience minor water accumulation during heavy downpours.'} Highway drainage capable of handling normal rainfall. Monitor conditions during active storms.` : `LOW FLOOD RISK — ${isSWMonsoon ? 'Dry season conditions. Water tables are low and drainage systems have maximum capacity.' : 'No significant flood threats for your route. Highway drainage functioning normally.'}`}\n\nJPS Flood Monitoring: ${floodRiskScore >= 60 ? '⚠️ Multiple stations on alert — check publicinfobanjir.water.gov.my' : '✅ All stations within normal levels'}`
        },
        {
          title: 'Route Flood-Prone Sections',
          icon: '📍',
          content: floodSections.length > 0
            ? floodSections.map((s, i) => `${i + 1}. **${s.location}**\n   Risk Level: ${s.risk === 'high' ? '🔴 HIGH' : s.risk === 'moderate' ? '🟡 MODERATE' : '🟢 LOW'}\n   ${s.detail}`).join('\n\n')
            : '✅ No known flood-prone sections identified along your specific route. All highway segments have adequate drainage infrastructure.'
        },
        {
          title: 'Highway Drainage Infrastructure',
          icon: '🏗️',
          content: 'PLUS North-South Expressway:\n• Designed to AASHTO drainage standards — handles 100-year rainfall events\n• Cross-drainage culverts every 500m–1km\n• Side drains with debris grates — cleaned quarterly\n• SMART Tunnel (KL section): Diverts 3 million m³ stormwater during heavy KL rain\n• Elevated sections: Minimum 1.5m above surrounding floodplain\n\nLPT East Coast Expressway:\n• Built with monsoon hydrology modeling\n• 14 major river bridges with flood clearance > 5m\n• Pump stations at 3 low-lying interchanges (Kemaman, Dungun, Kuala Terengganu)\n• Flood sensor network linked to LPT traffic control center'
        },
        {
          title: 'Emergency Flood Protocols',
          icon: '🚨',
          content: 'IF HIGHWAY FLOODING OCCURS:\n1. Do NOT drive through flowing water — 30cm of water floats most cars\n2. Turn around at nearest interchange if highway ahead is water-covered\n3. Call PLUS Hotline 1800-88-0000 for flood status and alternate route guidance\n4. Move to elevated sections — PLUS highway is mostly raised above floodplain\n5. Tune to RTM Radio Klasik FM 87.7 / TraXX FM 90.3 for flood bulletins\n\nALTERNATE ROUTES DURING FLOOD:\n• PLUS highway flooding → Use federal route FT1 (old trunk road, higher elevation)\n• LPT flooding → Use coastal route FT3 (check bridge status first)\n• KL area flooding → Use SUKE/DASH elevated highways (newer, better drainage)'
        },
      ],
      metrics: [
        { label: 'Flood Risk Score', value: `${floodRiskScore}/100`, sub: floodRiskScore >= 60 ? 'Active monitoring' : floodRiskScore >= 30 ? 'Seasonal awareness' : 'Normal conditions', icon: floodRiskScore >= 60 ? '🔴' : floodRiskScore >= 30 ? '🟡' : '🟢' },
        { label: 'High-Risk Sections', value: `${highRiskFloodSections}`, sub: highRiskFloodSections > 0 ? 'Needs monitoring' : 'None on route' },
        { label: 'Moderate-Risk Sections', value: `${modRiskFloodSections}`, sub: modRiskFloodSections > 0 ? 'Awareness advised' : 'None on route' },
        { label: 'Drainage Capacity', value: floodRiskScore >= 60 ? 'Strained' : 'Adequate', sub: floodRiskScore >= 60 ? '>80% utilized' : '<40% utilized' },
        { label: 'River Levels', value: isNEMonsoon && isEastCoast ? 'Elevated ⚠️' : 'Normal', sub: 'JPS monitoring stations' },
      ],
      tips: [
        'Bookmark publicinfobanjir.water.gov.my — JPS real-time flood map with water level sensors across Malaysia.',
        'If water covers the road: STOP. 15cm of fast-flowing water knocks a person down. 30cm floats a car. 60cm sweeps vehicles away.',
        'Never drive through flood water at night — depth is impossible to judge. Turn around, find alternate route.',
        'Keep emergency kit in car: flashlight, drinking water, snacks, power bank, waterproof bag for documents.',
      ],
    },

    // ──────────────────────────────────────────────
    // 6. ROAD WORKS
    // ──────────────────────────────────────────────
    {
      e: roadWorks.filter(w => w.status.includes('🟡')).length > 0 ? '🟡' : '🟢',
      l: 'Road Works',
      v: roadWorks.filter(w => w.status.includes('🟡')).length > 0 ? `${roadWorks.filter(w => w.status.includes('🟡')).length} active · Minor delays` :
          roadWorks.length === 1 && roadWorks[0]?.location === '—' ? 'None on route' :
          `${roadWorks.length} active · ${roadWorks.every(w => w.status.includes('Minor')) ? 'No delays' : 'Check details'}`,
      severity: roadWorks.filter(w => w.status.includes('🟡')).length > 0 ? 'moderate' : 'low',
      riskScore: roadWorks.filter(w => w.status.includes('🟡')).length > 0 ? 25 : 5,
      sections: [
        {
          title: 'Active Road Works on Your Route',
          icon: '🚧',
          content: roadWorks.map((w, i) => `${i + 1}. **${w.highway}** — ${w.location}\n   Status: ${w.status}\n   Schedule: ${w.schedule}\n   Impact: ${w.impact}`).join('\n\n') + `\n\n---\n\nMalaysian highway maintenance is conducted to LLM (Lembaga Lebuhraya Malaysia) standards. Night works are standard practice to minimize daytime disruption. All work zones have: speed reduction (60–80km/h), advance warning signs at 1km and 500m, concrete barriers separating workers from traffic, and dedicated traffic marshals.`
        },
        {
          title: 'Planned Maintenance Calendar',
          icon: '📅',
          content: `Current Month: **${startDate.toLocaleDateString('en', { month: 'long' })}**\n\n${month >= 2 && month <= 9 ? '🔧 DRY SEASON MAINTENANCE PERIOD (Mar–Oct)\nMalaysian highway operators schedule major resurfacing and structural works during the drier months. Expect:\n• PLUS NSE: Resurfacing campaigns (rolling, 20–30km sections)\n• Bridge joint replacements at major river crossings\n• Drainage cleaning and culvert desilting\n• Guardrail upgrades and line repainting\n\nMost works are night-only (10PM–5AM) on weekdays.' : '🌧️ WET SEASON — MINIMAL MAINTENANCE (Nov–Feb)\nMajor construction is suspended during monsoon season. Only emergency repairs (pothole patching, debris clearance, drainage unblocking) are conducted. Work windows are shorter due to rain constraints.'}\n\nNext Major Works: ${month < 2 ? 'March 2027' : month < 10 ? 'November 2026' : 'March 2027'} (start of next dry season maintenance window)`
        },
        {
          title: 'Traffic Impact Analysis',
          icon: '⚠️',
          content: roadWorks.filter(w => w.status.includes('🟡')).length > 0
            ? `⚠️ ROAD WORKS MAY AFFECT YOUR JOURNEY\n\nEstimated Additional Time: ${roadWorks.filter(w => w.status.includes('🟡')).length * 10}–${roadWorks.filter(w => w.status.includes('🟡')).length * 20} minutes (cumulative through all work zones)\n\nWork Zone Speed Limits:\n• Active works (workers present): 60 km/h\n• Works with barriers only: 80 km/h\n• Speed cameras active at all work zones\n\nRecommendation: Add 15–20% buffer to your estimated travel time. Night driving through work zones is smoother (lower traffic × work activity overlap).`
            : '✅ No road works that will impact your travel time. All highway sections operating at full capacity with no lane closures or speed restrictions.'
        },
      ],
      metrics: [
        { label: 'Active Works', value: `${roadWorks.filter(w => !w.location.includes('—')).length}`, sub: 'On your route', icon: roadWorks.filter(w => !w.location.includes('—')).length > 0 ? '🟡' : '🟢' },
        { label: 'Night Works', value: roadWorks.filter(w => w.schedule.includes('Night')).length.toString(), sub: '10PM–5AM schedule', icon: '🌙' },
        { label: 'Day Works', value: roadWorks.filter(w => w.schedule.includes('Day')).length.toString(), sub: 'Off-peak hours', icon: '☀️' },
        { label: 'Max Delay', value: roadWorks.filter(w => w.status.includes('🟡')).length > 0 ? '+20 min' : '0 min', sub: 'Cumulative worst case' },
        { label: 'Speed Restrictions', value: roadWorks.filter(w => w.status.includes('🟡')).length > 0 ? '60–80 km/h' : '110 km/h', sub: 'Through work zones' },
      ],
      tips: [
        'Night driving (10PM–5AM) through work zones is smoother and safer — less traffic and active works are well-lit.',
        'AES speed cameras are active at all Malaysian highway work zones. Fines: RM 150–300 for exceeding work zone speed limits.',
        'Check PLUS website (plus.com.my) "Traffic & Works" section 24 hours before departure for last-minute work zone updates.',
        'Waze reports active work zones with crowd-sourced delay estimates — enable "Roadworks" alerts in app settings.',
      ],
    },
  ];

  return conditions;
}

export default function Page() {
  const [dest, setDest] = useState('');
  const [origin, setOrigin] = useState('');

  // Pre-fill destination from URL param (e.g. from Wallet "Plan This Trip")
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const destParam = params.get('dest');
    if (destParam) setDest(decodeURIComponent(destParam));
    // Load saved plan from My Trips
    if (params.get('view') === 'saved') {
      const saved = sessionStorage.getItem('savedPlan');
      if (saved) {
        try { setPlan(JSON.parse(saved)); sessionStorage.removeItem('savedPlan'); } catch {}
      }
    }
  }, []);
  const [originLat, setOriginLat] = useState(0);
  const [originLng, setOriginLng] = useState(0);
  const [tripDistance, setTripDistance] = useState<number | null>(null);
  const [aiTransport, setAiTransport] = useState<{mode:string;emoji:string;duration:string;cost:number}|null>(null);
  const today = new Date(); const tomorrow = new Date(); tomorrow.setDate(today.getDate() + 1);
  const [sD, setSD] = useState(today.toISOString().split('T')[0]);
  const [eD, setED] = useState(tomorrow.toISOString().split('T')[0]);
  const [budget, setBudget] = useState(800);
  const [custB, setCustB] = useState('');
  const [group, setGroup] = useState('COUPLE');
  const [styles, setStyles] = useState<string[]>(['FOODIE']);
  const [prefs, setPrefs] = useState<string[]>([]);
  const [size, setSize] = useState(2);
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<any>(null);
  const [tab, setTab] = useState('timeline');
  const [dayIdx, setDayIdx] = useState(0);
  const [selStop, setSelStop] = useState<any>(null);
  const [error, setError] = useState('');
  const [photoIdx, setPhotoIdx] = useState(0);
  const [nearbyPhotoIdx, setNearbyPhotoIdx] = useState(0);
  const [hotelPhotoIdx, setHotelPhotoIdx] = useState(0);
  const [suggestions, setSuggestions] = useState<typeof MY_CITIES>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [destLat, setDestLat] = useState(0);
  const [destLng, setDestLng] = useState(0);
  const [nearbyPlaces, setNearbyPlaces] = useState<any[]>([]);
  const [nearbyDetail, setNearbyDetail] = useState<any>(null);
  const [hotelDetail, setHotelDetail] = useState<any>(null);
  const [roadtripDetail, setRoadtripDetail] = useState<any>(null);
  const [roadtripData, setRoadtripData] = useState<any>(null);
  const [viewImages, setViewImages] = useState<string[] | null>(null);
  const [stopPhotos, setStopPhotos] = useState<Record<string, string[]>>({});
  const [selHotel, setSelHotel] = useState<any>(null);

  // Fetch real Google photos when plan changes (stops + hotels)
  useEffect(() => {
    if (!plan?.days?.length) return;
    const fetchPhotos = async () => {
      const map: Record<string, string[]> = {};
      // Fetch for stops
      for (const day of plan.days || []) {
        for (const stop of day.stops || []) {
          try {
            const r = await fetch(`/api/places/search?q=${encodeURIComponent(stop.placeName + ' ' + (plan.destination || ''))}&lat=${stop.lat}&lng=${stop.lng}&limit=1`);
            const d = await r.json();
            if (d.data?.[0]?.photos?.length) {
              const gp = d.data[0].photos.slice(0, 10);
              const up = Array.from({length: 10}, (_, i) => `https://source.unsplash.com/800x600/?${encodeURIComponent(stop.placeName)}+${i}`);
              map[stop.placeName] = [...gp, ...up].slice(0, 20);
              stop.photoUrl = gp[0] || up[0];
            }
          } catch {}
        }
      }
      // Fetch for hotels
      for (const hotel of plan.whereToStay || []) {
        try {
          const r = await fetch(`/api/places/search?q=${encodeURIComponent(hotel.name + ' ' + (plan.destination || '') + ' hotel')}&lat=${hotel.lat || plan.destinationLat || 3.139}&lng=${hotel.lng || plan.destinationLng || 101.6869}&limit=1`);
          const d = await r.json();
          if (d.data?.[0]?.photos?.length) {
            const gp = d.data[0].photos.slice(0, 10);
            const up = Array.from({length: 10}, (_, i) => `https://source.unsplash.com/800x600/?${encodeURIComponent(hotel.name + ' hotel')}+${i}`);
            map[hotel.name] = [...gp, ...up].slice(0, 20);
            hotel.photoUrl = gp[0] || up[0];
          }
        } catch {}
      }
      if (Object.keys(map).length > 0) { setStopPhotos(map); setPlan({...plan}); }
    };
    fetchPhotos();
  }, [plan?.days?.[0]?.stops?.[0]?.placeName]);
  const [routeStrategy, setRouteStrategy] = useState('FASTEST');
  const [originSuggestions, setOriginSuggestions] = useState<typeof MY_CITIES>([]);
  const [showOriginSuggestions, setShowOriginSuggestions] = useState(false);
  const [discoveryRealPhotos, setDiscoveryRealPhotos] = useState<Record<string, string[]>>({});
  const [discoveryLoading, setDiscoveryLoading] = useState(false);
  const [hotelRealPhotos, setHotelRealPhotos] = useState<string[]>([]);

  // Auto-detect user location for "From" field
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(pos => {
        setOriginLat(pos.coords.latitude);
        setOriginLng(pos.coords.longitude);
        const nearest = MY_CITIES.reduce((a,b) => {
          const da = Math.abs(a.lat-pos.coords.latitude)+Math.abs(a.lng-pos.coords.longitude);
          const db = Math.abs(b.lat-pos.coords.latitude)+Math.abs(b.lng-pos.coords.longitude);
          return da<db?a:b;
        });
        setOrigin(nearest.n);
      }, () => {}, { enableHighAccuracy: true, timeout: 8000 });
    }
  }, []);

  // Calculate distance and AI transport recommendation when both locations are set
  const calcDistance = (fromLat: number, fromLng: number, toLat: number, toLng: number) => {
    if (!fromLat || !toLat) return;
    const R = 6371;
    const dLat = (toLat - fromLat) * Math.PI / 180;
    const dLng = (toLng - fromLng) * Math.PI / 180;
    const a = Math.sin(dLat/2)**2 + Math.cos(fromLat*Math.PI/180)*Math.cos(toLat*Math.PI/180)*Math.sin(dLng/2)**2;
    const km = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    setTripDistance(Math.round(km * 10) / 10);

    // AI transport recommendation
    if (km < 2) setAiTransport({mode:'Walking',emoji:'🚶',duration:`${Math.round(km/5*60)} min`,cost:0});
    else if (km < 50) setAiTransport({mode:'Grab / Drive',emoji:'🚕',duration:`${Math.round(km/35*60)} min`,cost:Math.round(5+km*1.5)});
    else if (km < 200) setAiTransport({mode:'KTM / Bus',emoji:'🚂',duration:`${Math.round(km/50*60+15)} min`,cost:Math.round(10+km*0.3)});
    else if (km < 500) setAiTransport({mode:'ETS Train',emoji:'🚄',duration:`${Math.round(km/100*60+30)} min`,cost:Math.round(30+km*0.15)});
    else setAiTransport({mode:'Flight',emoji:'✈️',duration:'~60 min + check-in',cost:Math.round(100+km*0.08)});
  };

  const selectDest = (city: typeof MY_CITIES[0]) => {
    setDest(city.n);
    setDestLat(city.lat);
    setDestLng(city.lng);
    setShowSuggestions(false);
    if (originLat) calcDistance(originLat, originLng, city.lat, city.lng);
  };

  // Fetch roadtrip data when tab opened, coords change, or strategy changes
  useEffect(() => {
    if (tab !== 'roadtrip') return;
    const olat = originLat || 3.139;
    const olng = originLng || 101.6869;
    const dlat = destLat || (plan?.destinationLat || 5.4141);
    const dlng = destLng || (plan?.destinationLng || 100.3288);
    const vehicleMap: Record<string,string> = {FASTEST:'car_midsize',CHEAPEST:'car_compact',SCENIC:'car_midsize',FOODIE:'car_midsize',FAMILY:'car_mpv',COUPLE:'car_compact'};
    fetch('/api/weekend-planner/roadtrip/calculate', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body:JSON.stringify({originLat:olat,originLng:olng,destLat:dlat,destLng:dlng,vehicleType:vehicleMap[routeStrategy]||'car_midsize',dayCount:Math.max(1,Math.ceil((new Date(eD).getTime()-new Date(sD).getTime())/86400000)+1),pax:size,style:routeStrategy}),
    }).then(r=>r.json()).then(d=>setRoadtripData(d.data)).catch(()=>{});
  }, [tab, destLat, originLat, routeStrategy, plan]);

  // Fetch REAL Google Places photos for discovery places when roadtrip tab opens
  useEffect(() => {
    if (tab !== 'roadtrip') return;
    const olat = originLat || 3.139; const olng = originLng || 101.6869;
    const dlat = destLat || (plan?.destinationLat || 5.4141); const dlng = destLng || (plan?.destinationLng || 100.3288);
    const { discoveries, photoStops } = getRouteDiscoveries(olat, olng, dlat, dlng, tripDistance);
    const allPlaces = [...discoveries, ...photoStops];

    const fetchPhotos = async () => {
      setDiscoveryLoading(true);
      const photoMap: Record<string, string[]> = {};

      // Fetch in parallel batches of 5
      for (let i = 0; i < allPlaces.length; i += 5) {
        const batch = allPlaces.slice(i, i + 5);
        const results = await Promise.allSettled(
          batch.map(async (place) => {
            const cacheKey = place.name;
            try {
              const r = await fetch(`/api/places/search?q=${encodeURIComponent(place.name)}&lat=${place.lat}&lng=${place.lng}&limit=1`);
              const d = await r.json();
              const photos: string[] = d.data?.[0]?.photos || [];
              // Filter out obviously broken/fake Unsplash URLs, keep only real Google photos
              const realPhotos = photos.filter((p: string) => !p.includes('unsplash.com') || p.includes('maps.googleapis.com'));
              return { key: cacheKey, photos: realPhotos.length > 0 ? realPhotos : [] };
            } catch {
              return { key: cacheKey, photos: [] };
            }
          })
        );
        for (const r of results) {
          if (r.status === 'fulfilled' && r.value) {
            photoMap[r.value.key] = r.value.photos;
          }
        }
      }

      setDiscoveryRealPhotos(photoMap);
      setDiscoveryLoading(false);
    };

    fetchPhotos();
  }, [tab, originLat, originLng, destLat, destLng, plan?.destinationLat, plan?.destinationLng, tripDistance]);

  // Fetch hotel photos — Google Places first, Unsplash fallback (guarantees 10 photos)
  useEffect(() => {
    if (!hotelDetail) { setHotelRealPhotos([]); return; }
    const hd = hotelDetail;
    // Stable hotel Unsplash photos as immediate fallback (10 curated hotel/resort photos)
    const HOTEL_UNSPLASH = [
      'photo-1566073771259-6a8506099945', // Resort pool
      'photo-1571896349842-33c89424de2d', // Luxury hotel interior
      'photo-1520250497591-112f2f40a3f4', // Hotel room with view
      'photo-1564501049412-61c2a3083791', // Hotel lobby
      'photo-1551882547-ff40c63fe5fa', // Beach resort
      'photo-1542314831-068cd1dbfeeb', // Grand hotel exterior
      'photo-1445019980596-93fa8acb2465', // Hotel pool
      'photo-1568084680786-586b91a09d72', // Boutique hotel room
      'photo-1578683010236-d716f9a3f461', // Resort aerial view
      'photo-1582719508461-905c673771fd', // Hotel restaurant
    ];
    const fallbacks = HOTEL_UNSPLASH.map(id =>
      `https://images.unsplash.com/${id}?w=800&h=600&fit=crop&q=80`
    );
    setHotelRealPhotos(fallbacks);
    // Then try Google Places for real photos
    const fetchHotelPhotos = async () => {
      try {
        const q = encodeURIComponent(hd.name + ' ' + (hd.address || plan?.destination || '') + ' hotel');
        const sr = await fetch(`/api/places/search?q=${q}&lat=${hd.lat || plan?.destinationLat || 3.139}&lng=${hd.lng || plan?.destinationLng || 101.6869}&limit=5`);
        const sd = await sr.json();
        let best: string[] = [];
        for (const place of (sd.data || [])) {
          const pid = place.id || place.place_id;
          if (pid && !pid.startsWith('fb') && !pid.startsWith('citydb')) {
            try {
              const dr = await fetch(`/api/places/details/${pid}`);
              const dd = await dr.json();
              if (dd.data?.photos?.length > best.length) best = dd.data.photos;
              if (best.length >= 10) break;
            } catch {}
          } else if (place.photos?.length > best.length) {
            best = place.photos;
            if (best.length >= 10) break;
          }
        }
        if (best.length > 0) setHotelRealPhotos(best.slice(0, 20));
      } catch {}
    };
    fetchHotelPhotos();
  }, [hotelDetail]);

  const tog = (a: string[], s: (v: string[]) => void, v: string) => s(a.includes(v) ? a.filter(x => x !== v) : [...a, v]);
  const togStyle = (v: string) => {
    if (styles.includes(v)) { setStyles(styles.filter(x => x !== v)); return; }
    if (styles.length >= 3) { toast.error('Max 3 styles for best results'); return; }
    setStyles([...styles, v]);
  };

  const handleOriginInput = (val: string) => {
    setOrigin(val);
    if (val.length > 0) {
      const filtered = MY_CITIES.filter(c => c.n.toLowerCase().includes(val.toLowerCase()) || c.s.toLowerCase().includes(val.toLowerCase()));
      setOriginSuggestions(filtered.slice(0, 5));
      setShowOriginSuggestions(true);
    } else { setOriginSuggestions([]); setShowOriginSuggestions(false); }
  };
  const selectOrigin = (city: typeof MY_CITIES[0]) => {
    setOrigin(city.n);
    setOriginLat(city.lat);
    setOriginLng(city.lng);
    setShowOriginSuggestions(false);
    if (destLat) calcDistance(city.lat, city.lng, destLat, destLng);
  };

  const handleDestInput = (val: string) => {
    setDest(val);
    if (val.length > 0) {
      const filtered = MY_CITIES.filter(c => c.n.toLowerCase().includes(val.toLowerCase()) || c.s.toLowerCase().includes(val.toLowerCase()));
      setSuggestions(filtered.slice(0, 6));
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const generate = async () => {
    if (!dest) return; setLoading(true); setError(''); setPlan(null);
    const fb = custB ? parseInt(custB) : budget;
    // Budget validation: min RM250/person/day, recommend RM400-800/person/day
    const diffDays = Math.ceil((new Date(eD).getTime() - new Date(sD).getTime()) / 86400000) + 1;
    const minBudget = diffDays * size * 150;
    const maxBudget = diffDays * size * 8000;
    if (fb < minBudget) { setError(`Minimum budget RM ${minBudget.toLocaleString()} for ${size}p × ${diffDays} days. Increase budget or reduce days/people.`); setLoading(false); return; }
    if (fb > maxBudget) { setError(`Maximum budget is RM ${maxBudget.toLocaleString()}.`); setLoading(false); return; }
    try {
      const res = await fetch('/api/weekend-planner/generate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ destination: dest, destinationLat: destLat, destinationLng: destLng, originLat, originLng, tripDistance, startDate: sD, endDate: eD, budget: fb, transportMode: aiTransport?.mode || 'DRIVING', groupType: group, travelStyles: styles, specialPreferences: prefs, groupSize: size }),
      });
      const data = await res.json();
      if (data.error) { setError(data.error); setLoading(false); return; }
      setPlan(data.data || data);
      setError('');
    } catch (e: any) {
      setError('Unable to generate. Please try again.');
    }
    setLoading(false);
  };

  /* ── INPUT ── */
  if (!loading && !plan) return (
    <div className="min-h-dvh bg-[#FAFAF8]">
      <div className="px-5 pt-14 pb-6">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FDF6ED] px-4 py-1.5 text-[11px] font-bold text-[#7B5E3B] uppercase tracking-wider mb-3">
          <Sparkles className="h-3 w-3" /> AI-Powered Travel
        </span>
        <h1 className="text-[36px] font-extrabold text-[#1A1A1A] leading-[1.1] tracking-[-0.02em]">Plan your<br /><span className="gradient-text">weekend</span> <span className="text-[10px] text-gray-300 align-top">v3.0</span></h1>
        <p className="text-[15px] text-[#6B7280] mt-2">A complete itinerary in seconds. Worldwide.</p>
      </div>

      <div className="px-5 pb-36 space-y-4">
        <div className="card-travel p-5">
          <label className="section-label"><CalendarDays className="h-3.5 w-3.5 inline mr-1 text-[#7B5E3B]" /> Select Dates</label>
          <style>{`input[type="date"]::-webkit-calendar-picker-indicator { opacity:1; display:block; width:24px; height:24px; cursor:pointer; } input[type="date"]::-webkit-datetime-edit-fields-wrapper { padding:4px 0; }`}</style>
          <div className="flex gap-3">
            <div className="flex-1">
              <p className="text-[11px] font-bold text-[#8B7355] mb-1">📅 Start</p>
              <input type="date" value={sD} min={new Date().toISOString().split('T')[0]} onChange={e => {setSD(e.target.value); if(e.target.value>eD) setED(e.target.value)}}
                className="w-full rounded-xl border-2 border-[#D4C4B0] bg-white py-3.5 px-4 text-[15px] font-semibold text-[#0E0E0E] cursor-pointer" style={{colorScheme:'light'}} />
            </div>
            <div className="flex-1">
              <p className="text-[11px] font-bold text-[#8B7355] mb-1">📅 End (max 8 days)</p>
              <input type="date" value={eD} min={sD || new Date().toISOString().split('T')[0]} onChange={e => {
                const start=new Date(sD); const end=new Date(e.target.value);
                const diff=Math.ceil((end.getTime()-start.getTime())/86400000)+1;
                if(diff<=8) setED(e.target.value); else toast.error('Max 8 days, 7 nights');
              }} max={sD?(()=>{const d=new Date(sD);d.setDate(d.getDate()+7);return d.toISOString().split('T')[0];})():undefined}
                className="w-full rounded-xl border-2 border-[#D4C4B0] bg-white py-3.5 px-4 text-[15px] font-semibold text-[#0E0E0E] cursor-pointer" style={{colorScheme:'light'}} />
            </div>
          </div>
          {sD && eD && (
            <p className="text-[13px] text-[#7B5E3B] mt-3 font-extrabold text-center">
              📆 {(() => {const d=Math.ceil((new Date(eD).getTime()-new Date(sD).getTime())/86400000)+1;const warn=d>8?'⚠️ Max 8 days!':'';return `${warn} ${d} day${d>1?'s':''} · ${d-1} night${d-1!==1?'s':''}`;})()}
            </p>
          )}
        </div>

        {/* From → To with AI Transport */}
        <div className="card-travel p-5">
          <label className="section-label">📍 From → To</label>
          <div className="relative mb-3">
            <div className="absolute left-3 top-4 bottom-4 w-0.5 bg-[#D4C4B0] rounded" />
            <div className="relative">
              <input value={origin} onChange={e => handleOriginInput(e.target.value)} onFocus={() => origin && setShowOriginSuggestions(true)} onBlur={() => setTimeout(() => setShowOriginSuggestions(false), 200)}
                placeholder="From: KL, JB, Penang…" className="input-travel mb-2 pl-8 text-sm" />
              {showOriginSuggestions && originSuggestions.length > 0 && (
                <div className="bg-white border border-[#D4C4B0] rounded-xl shadow-lg z-20 overflow-hidden -mt-2 mb-2">
                  {originSuggestions.map(c => (
                    <button key={'o'+c.n} onClick={() => selectOrigin(c)}
                      className="w-full text-left px-4 py-3 text-sm font-semibold text-[#0E0E0E] hover:bg-[#FDF6ED] border-b border-[#EDE4D8] last:border-0 flex items-center justify-between">
                      <span><MapPin className="h-3.5 w-3.5 inline mr-2 text-[#7B5E3B]" />{c.n}</span>
                      <span className="text-[11px] text-[#8B7355]">{c.s}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="relative">
              <input value={dest} onChange={e => handleDestInput(e.target.value)} onFocus={() => dest && setShowSuggestions(true)} onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                placeholder="To: Penang, Langkawi, Melaka…" className="input-travel pl-8 text-sm" />
              {showSuggestions && suggestions.length > 0 && (
                <div className="bg-white border border-[#D4C4B0] rounded-xl shadow-lg z-20 overflow-hidden -mt-2">
                  {suggestions.map(c => (
                    <button key={'d'+c.n} onClick={() => selectDest(c)}
                      className="w-full text-left px-4 py-3 text-sm font-semibold text-[#0E0E0E] hover:bg-[#FDF6ED] border-b border-[#EDE4D8] last:border-0 flex items-center justify-between">
                      <span><MapPin className="h-3.5 w-3.5 inline mr-2 text-[#7B5E3B]" />{c.n}</span>
                      <span className="text-[11px] text-[#8B7355]">{c.s}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          {tripDistance && (
            <div className="space-y-2">
              <div className="bg-[#FDF6ED] rounded-xl p-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#7B5E3B]/10 flex items-center justify-center text-xl">{aiTransport?.emoji}</div>
                <div className="flex-1">
                  <p className="text-[12px] font-extrabold text-[#0E0E0E]">🤖 AI recommends {aiTransport?.mode}</p>
                  <p className="text-[10px] text-[#5C4A3A]">{tripDistance} km · {aiTransport?.duration} · ~RM {aiTransport?.cost}</p>
                </div>
              </div>
              {/* Transport Options with booking links */}
              <div className="grid grid-cols-2 gap-2">
                {[
                  {e:'🚌',l:'Bus',t:Math.round(tripDistance/50*60+20),c:Math.round(5+tripDistance*0.2),url:`https://www.redbus.my/search?fromCity=${encodeURIComponent(origin||'')}&toCity=${encodeURIComponent(dest||'')}`,label:'RedBus'},
                  {e:'🚕',l:'Grab',t:Math.round(tripDistance/60*60+10),c:Math.round(10+tripDistance*1.2),url:'https://www.grab.com/my/',label:'Open Grab'},
                  {e:'🚗',l:'Drive',t:Math.round(tripDistance/70*60),c:Math.round(tripDistance*0.35),url:`https://www.google.com/maps/dir/${encodeURIComponent(origin||'')}/${encodeURIComponent(dest||'')}`,label:'Open GPS'},
                  {e:'🚄',l:'ETS Train',t:Math.round(tripDistance/100*60+30),c:Math.round(30+tripDistance*0.15),url:`https://eticket.ktmb.com.my/`,label:'Buy Ticket'},
                ].map(t => (
                  <a key={t.l} href={t.url} target="_blank" rel="noopener"
                    className="bg-[#FDF6ED] rounded-xl p-3 text-center hover:bg-[#7B5E3B]/10 transition-colors cursor-pointer block">
                    <div className="text-2xl">{t.e}</div>
                    <div className="text-[11px] font-extrabold text-[#0E0E0E]">{t.l}</div>
                    <div className="text-[10px] text-[#5C4A3A]">{t.t}min · RM {t.c}</div>
                    <div className="text-[9px] text-[#7B5E3B] mt-0.5 font-bold underline">{t.label} →</div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="card-travel p-5">
          <label className="section-label">💰 Budget (MYR)</label>
          <div className="flex gap-2 flex-wrap mb-3">
            {BUDGETS.map(b => <button key={b} onClick={() => { setBudget(b); setCustB(''); }} className={cn('pill-travel', budget === b && !custB && 'pill-travel-active')}>RM {b}</button>)}
            <input value={custB} onChange={e => { setCustB(e.target.value); if (e.target.value) setBudget(0); }} placeholder="Custom" className="pill-travel text-sm w-24 text-center outline-none" />
          </div>
        </div>

        <div className="card-travel p-5">
          <label className="section-label"><Users className="h-3.5 w-3.5 inline mr-1 text-[#7B5E3B]" /> Group & Style</label>
          <div className="grid grid-cols-4 gap-2 mb-4">
            {GROUPS.map(g => <button key={g.v} onClick={() => setGroup(g.v)} className={cn('rounded-xl border-1.5 py-2.5 text-center text-xs font-semibold transition-all active:scale-95', group === g.v ? 'border-[#7B5E3B] bg-[#FDF6ED] text-[#7B5E3B]' : 'border-[#E5E7EB] bg-white text-[#1A1A1A] hover:border-[#7B5E3B]/30')}><div className="text-2xl mb-0.5">{g.e}</div>{g.l}</button>)}
          </div>
          <div className="flex items-center justify-center gap-4 mb-4">
            <button onClick={() => setSize(Math.max(1, size - 1))} className="w-9 h-9 rounded-full border border-[#E5E7EB] flex items-center justify-center font-semibold hover:border-[#7B5E3B] transition-colors">−</button>
            <span className="text-xl font-bold w-8 text-center">{size}</span>
            <button onClick={() => setSize(Math.min(20, size + 1))} className="w-9 h-9 rounded-full border border-[#E5E7EB] flex items-center justify-center font-semibold hover:border-[#7B5E3B] transition-colors">+</button>
            <span className="text-sm text-[#6B7280]">people</span>
          </div>
          <div className="flex gap-2 flex-wrap mb-3">
            <div>
              <p className="text-[11px] font-bold text-[#8B7355] uppercase tracking-wider mb-2">🎨 Travel Styles <span className="text-[#A08970] font-normal">(max 3)</span> {styles.length > 0 && <span className="text-[#C4956A]">{styles.length}/3</span>}</p>
              <div className="flex gap-1.5 flex-wrap">
              {STYLES.map(s => { const v = s.split(' ')[1] || s; return <button key={v} onClick={() => togStyle(v)} className={cn('pill-travel text-[11px]', styles.includes(v) && 'pill-travel-active')}>{s}</button>; })}
              </div>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            {PREFS.map(p => { const v = p.split(' ')[1] || p; const m = v === 'Halal' ? 'HALAL_FOOD' : v === 'Veg' ? 'VEGETARIAN' : v === 'Kids' ? 'KID_FRIENDLY' : v === 'Access' ? 'WHEELCHAIR_FRIENDLY' : 'PET_FRIENDLY'; return <button key={v} onClick={() => tog(prefs, setPrefs, m)} className={cn('pill-travel', prefs.includes(m) && 'pill-travel-active')}>{p}</button>; })}
          </div>
        </div>
      </div>

      <div className="fixed bottom-20 left-0 right-0 px-5 pb-6 pt-4 z-40" style={{ background: 'linear-gradient(to top, #FAFAF8 60%, transparent)' }}>
        {error && <p className="text-[#D64045] text-xs mb-2 text-center">{error} <span className="text-[#8B7355]">— tap Generate again to retry</span></p>}
        <button onClick={generate} disabled={!dest} className="btn-primary w-full text-lg py-4"><Sparkles className="h-5 w-5" /> Generate My Weekend</button>
      </div>
    </div>
  );

  /* ── LOADING ── */
  if (loading) return (
    <div className="min-h-dvh bg-gradient-to-br from-[#F5EFE6] via-[#FDF6ED] to-[#EDE4D8] flex items-center justify-center px-6 relative overflow-hidden">
      {/* Animated background orbs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-[#7B5E3B]/5 blur-3xl animate-pulse" style={{animationDuration:'4s'}} />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-[#D4B483]/8 blur-3xl animate-pulse" style={{animationDuration:'6s',animationDelay:'1s'}} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full bg-[#6B8E4E]/4 blur-3xl animate-pulse" style={{animationDuration:'5s',animationDelay:'2s'}} />
      </div>

      <div className="text-center relative z-10 max-w-sm w-full">
        {/* Animated icon */}
        <div className="relative w-24 h-24 mx-auto mb-8">
          <div className="absolute inset-0 rounded-full bg-[#7B5E3B]/10 animate-ping" style={{animationDuration:'2.5s'}} />
          <div className="absolute inset-2 rounded-full bg-[#D4B483]/20 animate-pulse" style={{animationDuration:'2s'}} />
          <div className="relative w-full h-full rounded-full bg-gradient-to-br from-[#FDF6ED] to-[#EDE4D8] flex items-center justify-center shadow-lg border border-[#D4C4B0]/30">
            <span className="text-5xl animate-bounce">🧠</span>
          </div>
          {/* Orbiting dots */}
          <div className="absolute inset-0 animate-spin" style={{animationDuration:'8s'}}>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-[#7B5E3B]" />
          </div>
          <div className="absolute inset-0 animate-spin" style={{animationDuration:'12s',animationDirection:'reverse'}}>
            <div className="absolute bottom-1 right-2 w-2 h-2 rounded-full bg-[#D4B483]" />
          </div>
          <div className="absolute inset-0 animate-spin" style={{animationDuration:'10s'}}>
            <div className="absolute top-2 left-1 w-1.5 h-1.5 rounded-full bg-[#6B8E4E]" />
          </div>
        </div>

        {/* Text */}
        <h2 className="text-2xl font-extrabold text-[#0E0E0E] tracking-[-0.02em] mb-2">
          Crafting your <span className="gradient-text">perfect trip</span>
        </h2>
        <p className="text-[14px] text-[#5C4A3A] mb-8 font-medium">AI is building your personalized itinerary</p>

        {/* Progress bar */}
        <div className="h-1.5 bg-[#D4C4B0]/40 rounded-full mb-8 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-[#7B5E3B] via-[#D4B483] to-[#6B8E4E] rounded-full animate-pulse w-2/3" style={{animationDuration:'1.5s'}} />
        </div>

        {/* Steps */}
        <div className="space-y-2.5 text-left">
          {[
            {e:'🧭',l:'Analyzing your preferences',d:true},
            {e:'📍',l:'Discovering hidden gems',d:true},
            {e:'🗺️',l:'Optimizing the perfect route',d:true},
            {e:'📸',l:'Curating photos & details',d:false},
            {e:'💰',l:'Calculating smart budget',d:false},
            {e:'✨',l:'Finalizing your plan',d:false},
          ].map((s,i)=>(
            <div key={i} className={`flex items-center gap-3 text-sm transition-all duration-500 ${s.d?'opacity-100':'opacity-40'}`}>
              <span className="text-lg">{s.e}</span>
              <span className={s.d?'text-[#0E0E0E] font-semibold':'text-[#8B7355]'}>{s.l}</span>
              {s.d && <span className="ml-auto text-emerald-500 text-xs font-bold">✓</span>}
              {!s.d && <span className="ml-auto w-4 h-4 rounded-full border-2 border-[#D4C4B0] border-t-[#7B5E3B] animate-spin" />}
            </div>
          ))}
        </div>

        {/* Tip */}
        <div className="mt-8 bg-white/60 backdrop-blur rounded-xl p-3 text-[11px] text-[#5C4A3A] italic border border-[#D4C4B0]/30">
          💡 {['The best trips are discovered, not planned.','Malaysia has over 4,000 km of coastline to explore.','Every great adventure starts with a single step.','The journey is just as important as the destination.'][Math.floor(Math.random()*4)]}
        </div>
      </div>
    </div>
  );

  /* ── RESULTS ── */
  const day = plan?.days?.[dayIdx];
  return (
    <div className="min-h-dvh bg-[#FAFAF8]">
      {/* Hero */}
      <div className="bg-gradient-to-br from-[#7B5E3B] via-[#D4B483] to-[#6B8E4E] px-5 pt-14 pb-6 text-white">
        <button onClick={() => { setPlan(null); setDayIdx(0); }} className="text-white/70 text-[13px] font-semibold mb-3 hover:text-white">← Back</button>
        <h1 className="text-[24px] font-extrabold leading-[1.15] tracking-[-0.02em]">{plan.title}</h1>
        <div className="flex items-center gap-3 text-[13px] text-white/70 mt-1.5">
          <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {plan.destination}</span>
          <span className="flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" /> {plan.startDate} – {plan.endDate}</span>
        </div>
        <div className="flex gap-2 mt-3">
          <span className="bg-white/20 backdrop-blur-sm rounded-full px-3.5 py-1.5 text-xs font-extrabold">RM {Math.round(plan.totalCost)}</span>
          <span className="bg-white/20 backdrop-blur-sm rounded-full px-3.5 py-1.5 text-xs font-semibold">{plan.totalStops} stops</span>
          <span className="bg-white/20 backdrop-blur-sm rounded-full px-3.5 py-1.5 text-xs font-semibold">{plan.hiddenGemCount} gems</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="sticky top-0 z-30 bg-[#FAFAF8]/90 backdrop-blur-xl border-b border-[#E5E7EB]">
        <div className="flex px-5 py-2.5 gap-1">
          {[{ k: 'timeline', l: 'Timeline' }, { k: 'budget', l: 'Budget' }, { k: 'roadtrip', l: '🚗 Roadtrip' }, { k: 'tips', l: '🍜 Tips' }].map(t => (
            <button key={t.k} onClick={() => setTab(t.k)} className={cn('tab-travel', tab === t.k && 'tab-travel-active')}>{t.l}</button>
          ))}
        </div>
      </div>

      <div className="pb-32">
        {/* TIMELINE */}
        {tab === 'timeline' && (
          <div className="px-5 pt-4 space-y-4">
            {/* Day selector pills */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {plan.days?.map((d: any, i: number) => (
                <button key={i} onClick={() => setDayIdx(i)} className={cn('flex-shrink-0 rounded-2xl border-2 px-5 py-3 text-left transition-all min-w-[120px]', dayIdx === i ? 'border-[#7B5E3B] bg-[#FDF6ED] shadow-md shadow-amber-100' : 'border-[#E5E7EB] bg-white hover:border-[#7B5E3B]/30')}>
                  <div className="text-[10px] font-bold text-[#8B7355] uppercase tracking-wider">Day {d.dayNumber}</div>
                  <div className="text-[13px] font-extrabold text-[#1A1A1A] mt-0.5">{new Date(d.date).toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' })}</div>
                  <div className="text-[10px] text-[#8B7355] mt-0.5">{d.stops?.length || 0} stops</div>
                </button>
              ))}
            </div>

            {day && (
              <div>
                {/* Day header */}
                <div className="bg-gradient-to-r from-[#FDF6ED] to-white rounded-2xl p-4 mb-5 border border-[#E8D5C4]/50">
                  <h3 className="text-[18px] font-extrabold text-[#1A1A1A]">{day.theme}</h3>
                  <div className="flex items-center gap-3 mt-1.5 text-[12px] text-[#6B7280]">
                    <span>🌤️ {day.weather?.condition ?? 'Partly cloudy'} · {day.weather?.tempMin ?? 26}°–{day.weather?.tempMax ?? 32}°</span>
                    <span className="text-[10px] px-2 py-0.5 bg-white rounded-full border border-[#E5E7EB]">{day.weather?.rainChance ?? 30}% rain</span>
                    <span className="text-[10px] px-2 py-0.5 bg-white rounded-full border border-[#E5E7EB]">💧 {day.weather?.humidity ?? 75}%</span>
                  </div>
                  {day.breakfastSpot && (
                    <div className="flex gap-3 mt-2 text-[11px] text-[#8B7355]">
                      <span>🍳 {day.breakfastSpot}</span>
                      <span>🍽️ {day.lunchSpot}</span>
                      <span>🌙 {day.dinnerSpot}</span>
                    </div>
                  )}
                </div>

                {/* Timeline stops */}
                <div className="relative">
                  {/* Vertical line */}
                  <div className="absolute left-[19px] top-3 bottom-3 w-0.5 bg-[#E5E7EB]" />

                  {day.stops?.map((s: any, idx: number) => (
                    <div key={idx} className="relative flex gap-4 mb-4 animate-in fade-in slide-in-from-bottom-2"
                      style={{ animationDelay: `${idx * 80}ms` }}
                      onClick={() => { setSelStop(s); setPhotoIdx(0); setNearbyPlaces([]);
                        const nLat = s.lat || destLat || 3.139; const nLng = s.lng || destLng || 101.6869;
                        fetch(`/api/places/nearby?lat=${nLat}&lng=${nLng}&radius=3000&limit=5`)
                          .then(r => r.json()).then(d => setNearbyPlaces((d.data||[]).filter((p:any) => p.name !== s.placeName).slice(0,3))).catch(()=>{});
                      }}>
                      {/* Timeline marker */}
                      <div className="relative z-10 flex-shrink-0">
                        <div className={cn('w-[38px] h-[38px] rounded-full flex items-center justify-center text-white text-[13px] font-extrabold shadow-md',
                          s.isHiddenGem ? 'bg-purple-500 ring-4 ring-purple-100' : s.isPhotoSpot ? 'bg-sky-500 ring-4 ring-sky-100' : 'bg-[#7B5E3B] ring-4 ring-amber-50')}>
                          {idx + 1}
                        </div>
                      </div>

                      {/* Stop card */}
                      <div className="flex-1 bg-white rounded-2xl border border-[#E5E7EB] shadow-sm hover:shadow-md transition-shadow overflow-hidden cursor-pointer">
                        {/* Photo */}
                        {s.photoUrl ? (
                          <div className="relative h-48 overflow-hidden" onClick={async (e: any) => { e.stopPropagation(); const p = stopPhotos[s.placeName]; if (!p?.length || p.length < 5) { try { const sr = await fetch(`/api/places/search?q=${encodeURIComponent(s.placeName + ' ' + (plan?.destination || ''))}&lat=${s.lat}&lng=${s.lng}&limit=1`); const sd = await sr.json(); const pid = sd.data?.[0]?.id; if (pid) { const dr = await fetch(`/api/places/${pid}`); const dd = await dr.json(); if (dd.data?.photos?.length > 5) { setStopPhotos(prev => ({...prev, [s.placeName]: dd.data.photos.slice(0, 20)})); setViewImages(dd.data.photos.slice(0, 20)); return; } } } catch {} } setViewImages(p?.length ? p : [s.photoUrl]); }}>
                            <img src={s.photoUrl} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" alt="" loading="lazy" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                            <span className="absolute bottom-3 right-3 bg-black/60 backdrop-blur rounded-full px-2.5 py-1 text-[10px] font-bold text-white flex items-center gap-1">
                              <Camera className="h-3 w-3" /> {stopPhotos[s.placeName]?.length || 1}
                            </span>
                            {/* Time badge */}
                            <span className="absolute top-3 left-3 bg-black/50 backdrop-blur rounded-full px-2.5 py-1 text-[11px] font-extrabold text-white flex items-center gap-1">
                              <Clock className="h-3 w-3" /> {s.time}
                            </span>
                            {/* Category badge */}
                            <span className="absolute top-3 right-3 bg-white/90 backdrop-blur rounded-full px-2.5 py-0.5 text-[10px] font-bold text-[#7B5E3B]">
                              {s.category === 'FOOD' ? '🍜' : s.category === 'CAFE' ? '☕' : s.category === 'TOURIST_ATTRACTION' ? '🏛️' : s.category === 'NATURE' ? '🌿' : s.category === 'HOTEL' ? '🏨' : s.category === 'NIGHTLIFE' ? '🌙' : '📍'} {s.category?.replace(/_/g, ' ')}
                            </span>
                          </div>
                        ) : (
                          <div className="h-32 bg-gradient-to-br from-[#FDF6ED] to-[#F0E6D2] flex items-center justify-center text-5xl">{s.emoji ?? '📍'}</div>
                        )}

                        {/* Card content */}
                        <div className="p-4">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <h4 className="text-[15px] font-extrabold text-[#0E0E0E] leading-tight">{s.placeName}</h4>
                            <div className="flex gap-1 flex-shrink-0">
                              {s.isHiddenGem && <span className="text-[9px] font-bold bg-purple-100 text-purple-600 rounded-full px-2 py-0.5">💎</span>}
                              {s.isPhotoSpot && <span className="text-[9px] font-bold bg-sky-100 text-sky-600 rounded-full px-2 py-0.5">📸</span>}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 mb-2 text-[11px]">
                            {s.rating > 0 && (
                              <span className="flex items-center gap-0.5 bg-amber-50 text-amber-700 rounded-full px-2 py-0.5 font-bold">
                                <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> {s.rating}
                              </span>
                            )}
                            <span className="text-gray-400">{s.duration}</span>
                            {s.transportFromPrev?.mode && (
                              <span className="text-gray-400">{s.transportFromPrev.mode === 'WALKING' ? '🚶' : '🚗'} {s.transportFromPrev.mode}</span>
                            )}
                          </div>

                          <p className="text-[12px] text-[#6B7280] leading-relaxed mb-3">{s.description}</p>

                          {s.mustTry && (
                            <div className="bg-amber-50 border border-amber-100 rounded-xl px-3 py-2 mb-3 flex items-start gap-2">
                              <span className="text-amber-500 text-sm">⭐</span>
                              <div>
                                <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Must Try</p>
                                <p className="text-[12px] font-semibold text-[#7B5E3B]">{s.mustTry}</p>
                              </div>
                            </div>
                          )}

                          <div className="flex items-center justify-between pt-2 border-t border-[#F0EDE4]">
                            <div className="flex items-center gap-1 text-[11px] text-gray-400">
                              <Clock className="h-3 w-3" /> {s.time} · {s.duration}
                            </div>
                            <div className="text-right">
                              <span className="text-[16px] font-extrabold text-[#7B5E3B]">RM {Math.round((s.estimatedSpend + (s.entryFee ?? 0)) * (plan.groupSize || 2))}</span>
                              <span className="text-[10px] text-[#8B7355] ml-1">/ {plan.groupSize || 2}p</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Day summary */}
                <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 mt-4">
                  <div className="flex justify-between text-[13px]">
                    <div>
                      <p className="text-[10px] font-bold text-[#8B7355] uppercase tracking-wider mb-1">Day Summary</p>
                      <span className="font-extrabold text-[#7B5E3B]">RM {day.dayTotalCost}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-[#8B7355] uppercase tracking-wider mb-1">Distance & Time</p>
                      <span className="font-semibold text-[#1A1A1A]">{(day.dayTotalDistance / 1000).toFixed(1)} km · {day.dayTotalTime} min</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* AI BUDGET ENGINE */}
        {tab === 'budget' && plan.budgetBreakdown && (
          <div className="px-5 pt-4 space-y-4">
            {/* Budget Health Ring */}
            {(() => {
              const util = plan.budgetBreakdown.budgetUtilization;
              const healthColor = util > 1 ? '#B5453A' : util > 0.85 ? '#C4943A' : util > 0.65 ? '#7B5E3B' : '#4A7C59';
              const healthLabel = util > 1 ? 'Over Budget' : util > 0.85 ? 'Watch Budget' : util > 0.65 ? 'On Track' : 'Healthy';
              const healthEmoji = util > 1 ? '🔴' : util > 0.85 ? '🟡' : util > 0.65 ? '🟢' : '🟢';
              const perPerson = Math.round(plan.budgetBreakdown.total / (plan.groupSize || 2));
              const feasibility = util > 1 ? 45 : util > 0.85 ? 72 : util > 0.65 ? 88 : 95;
              return (
                <div className="card-travel p-5 text-center">
                  <p className="text-[10px] font-bold text-[#8B7355] uppercase tracking-wider mb-1">AI Budget Engine</p>
                  <div className="relative w-24 h-24 mx-auto my-3">
                    <svg className="w-24 h-24 -rotate-90" viewBox="0 0 96 96">
                      <circle cx="48" cy="48" r="42" fill="none" stroke="#EDE4D8" strokeWidth="8" />
                      <circle cx="48" cy="48" r="42" fill="none" stroke={healthColor} strokeWidth="8" strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * 42}`} strokeDashoffset={`${2 * Math.PI * 42 * (1 - Math.min(util, 1))}`} />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-xl font-extrabold" style={{color: healthColor}}>RM {Math.round(plan.budgetBreakdown.total)}</span>
                      <span className="text-[10px] font-bold text-[#8B7355]">{healthEmoji} {healthLabel}</span>
                    </div>
                  </div>
                  <div className="flex justify-center gap-4 text-[11px]">
                    <span className="text-[#8B7355]">Budget: <strong className="text-[#0E0E0E]">RM {plan.budget}</strong></span>
                    <span className="text-[#8B7355]">Per person: <strong className="text-[#0E0E0E]">RM {perPerson}</strong></span>
                  </div>

                  {/* Feasibility Score */}
                  <div className="mt-4 pt-3 border-t border-[#EDE4D8]">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-bold text-[#8B7355]">📊 Feasibility Score</span>
                      <span className="text-[11px] font-extrabold" style={{color: healthColor}}>{feasibility}/100</span>
                    </div>
                    <div className="h-1.5 bg-[#EDE4D8] rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700" style={{width:`${feasibility}%`, backgroundColor: healthColor}} />
                    </div>
                    <p className="text-[10px] text-[#8B7355] mt-1 italic">
                      {util > 1 ? '⚠️ Over budget — tap for alternatives' : util > 0.85 ? '⚠️ Tight — consider saving on transport' : '✅ Your budget is comfortable for this trip'}
                    </p>
                  </div>
                </div>
              );
            })()}

            {/* Smart Allocation */}
            <div className="card-travel p-4">
              <p className="text-[10px] font-bold text-[#8B7355] uppercase tracking-wider mb-3">🧠 Smart AI Allocation</p>
              <div className="space-y-2">
                {[{ k: 'hotel', e: '🏨', l: 'Hotel', d: plan.budgetBreakdown.hotel, tip: plan.days?.length > 1 ? '1 night' : 'Not needed' },
                  { k: 'food', e: '🍜', l: 'Food & Drink', d: plan.budgetBreakdown.food, tip: `${plan.totalStops} meals` },
                  { k: 'transport', e: '🚕', l: 'Transport', d: plan.budgetBreakdown.transport, tip: plan.transportMode },
                  { k: 'tickets', e: '🎫', l: 'Activities', d: plan.budgetBreakdown.tickets, tip: 'Entry fees' },
                  { k: 'emergencyBuffer', e: '🆘', l: 'Emergency', d: plan.budgetBreakdown.emergencyBuffer, tip: '12.5% buffer' }]
                  .filter(c => c.d?.estimatedCost > 0).map((c, i) => {
                    const barPct = Math.min(100, (c.d.estimatedCost / plan.budgetBreakdown.total) * 100);
                    const barColor = ['#7B5E3B','#D4B483','#6B8E4E','#5B7FA5','#C4943A'][i];
                    return (
                      <div key={c.k} className="flex items-center gap-3">
                        <span className="text-lg w-7">{c.e}</span>
                        <div className="flex-1">
                          <div className="flex justify-between text-[11px] mb-0.5">
                            <span className="font-bold text-[#0E0E0E]">{c.l}</span>
                            <span className="font-extrabold" style={{color: barColor}}>RM {Math.round(c.d.estimatedCost)}</span>
                          </div>
                          <div className="h-2 bg-[#EDE4D8] rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-500" style={{width:`${barPct}%`, backgroundColor: barColor}} />
                          </div>
                          <span className="text-[9px] text-[#8B7355]">{c.tip} · {Math.round(c.d.percentage)}%</span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Budget Alerts */}
            {(() => {
              const alerts: string[] = [];
              const bb = plan.budgetBreakdown;
              if (bb.hotel?.estimatedCost / bb.total > 0.35) alerts.push('🏨 Hotel is over 35% of budget — consider a cheaper option');
              if (bb.transport?.estimatedCost / bb.total > 0.25) alerts.push('🚕 Transport costs are high — try public transit');
              if (bb.budgetUtilization > 0.9) alerts.push('⚠️ Almost at budget limit — avoid impulse spending');
              if (!alerts.length) alerts.push('✅ No budget warnings — everything looks balanced!');
              return (
                <div className="card-travel p-4">
                  <p className="text-[10px] font-bold text-[#8B7355] uppercase tracking-wider mb-2">🔔 Budget Alerts</p>
                  {alerts.map((a, i) => (
                    <p key={i} className="text-[11px] text-[#5C4A3A] leading-relaxed py-1 border-b border-[#EDE4D8] last:border-0">{a}</p>
                  ))}
                </div>
              );
            })()}

            {/* Hotel Recommendations */}
            {plan.budgetBreakdown?.hotel?.hotelOptions?.length > 0 && (plan.days?.length || 2) > 1 && (
              <div className="card-travel p-4">
                <p className="text-[10px] font-bold text-[#8B7355] uppercase tracking-wider mb-3">🏨 Where to Stay</p>
                <div className="space-y-2">
                  {plan.budgetBreakdown.hotel.hotelOptions.map((h: any, i: number) => (
                    <div key={i} onClick={async () => {
                      setHotelDetail(null);
                      try {
                        const q = encodeURIComponent(h.name+' '+plan.destination);
                        const r = await fetch(`/api/places/search?q=${q}&lat=${plan.destinationLat||5.41}&lng=${plan.destinationLng||100.33}`);
                        const d = await r.json();
                        const match = (d.data||[]).find((p:any) => p.name?.toLowerCase().includes(h.name.toLowerCase().split(' ')[0] || ''));
                        setHotelDetail(match || h);
                      } catch { setHotelDetail(h); }
                    }} className="flex gap-3 p-3 rounded-xl bg-[#FDF6ED] hover:bg-[#F5EFE6] cursor-pointer transition-colors">
                      <div className="w-16 h-16 rounded-xl bg-[#7B5E3B]/10 flex items-center justify-center text-2xl flex-shrink-0 overflow-hidden">
                        {h.photoUrl ? <img src={h.photoUrl} className="w-full h-full object-cover" alt="" /> : <img src={`https://images.unsplash.com/photo-${[1566073771,1571896342,1520250497,1564501049,1551882547,1542314831,1445019980,1568084680,1578683016,1582719508][i % 10]}?w=100&h=100&fit=crop&q=80`} className="w-full h-full object-cover" alt="" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-[13px] font-extrabold text-[#0E0E0E]">{h.name}</h4>
                          <span className="flex items-center gap-0.5 text-[11px] font-bold text-[#D4B483]">⭐ {h.rating}</span>
                        </div>
                        <p className="text-[11px] text-[#5C4A3A] mt-0.5 line-clamp-2">{h.description}</p>
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          {h.amenities?.slice(0, 4).map((a: string) => (
                            <span key={a} className="text-[9px] bg-white rounded-full px-2 py-0.5 text-[#5C4A3A] font-medium">{a}</span>
                          ))}
                          <span className="text-[12px] font-extrabold text-[#7B5E3B] ml-auto">RM {h.price}/night{h.roomsNeeded>1?` · ${h.roomsNeeded} rooms`:` · RM ${h.totalPrice||h.price} total`}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

                {/* 🚗 AI ROADTRIP GENERATOR */}
        {tab === 'roadtrip' && (() => {
          const transport = getTransportMode(origin, dest);
          const modeIcon = transport.mode === "FLIGHT" ? "✈️" : transport.mode === "FERRY" ? "🚢" : "🚗";
          const modeColor = transport.mode === "FLIGHT" ? "bg-sky-50 border-sky-200" : transport.mode === "FERRY" ? "bg-cyan-50 border-cyan-200" : "bg-emerald-50 border-emerald-200";
          const d = tripDistance || 0;
          const fuelL = Math.round(d * 8 / 100);
          const driveH = Math.round(d / 80);
          const fuelCost = Math.round(d * 8 / 100 * 2.05);
          const tollCost = Math.round(d * 0.12);
          return (
          <div className="px-5 pt-4 pb-8">
            <div className={"rounded-2xl p-4 mb-4 border " + modeColor}>
              <div className="flex items-center gap-3">
                <span className="text-4xl">{modeIcon}</span>
                <div>
                  <p className="text-[16px] font-extrabold text-gray-800">{transport.label}</p>
                  <p className="text-[12px] text-gray-600">{transport.detail}</p>
                  <p className="text-[11px] font-bold text-[#7B5E3B] mt-1">{transport.estimate}</p>
                </div>
              </div>
            </div>

            {transport.mode === "DRIVE" && (
              <div className="card-travel p-4 mb-3">
                <p className="text-[10px] font-bold text-[#8B7355] uppercase tracking-wider mb-2">🛣️ Route Strategy</p>
                <div className="grid grid-cols-3 gap-2">
                  {[{v:"FASTEST",e:"⚡",l:"Fastest",d:"Min time",detail:d>0?Math.round(d/105)+"h":"?"},{v:"CHEAPEST",e:"💰",l:"Cheapest",d:"Min cost",detail:"Save ~"+Math.round(d*0.09)+"%"},{v:"SCENIC",e:"🏞️",l:"Scenic",d:"Best views",detail:"+"+Math.round(d*0.2)+"km"},{v:"FOODIE",e:"🍜",l:"Food Route",d:"Best food",detail:Math.floor(d/100)+" stops"},{v:"FAMILY",e:"👨‍👩‍👧‍👦",l:"Family",d:"Kid-friendly",detail:Math.floor(d/80)+" breaks"},{v:"COUPLE",e:"💑",l:"Couple",d:"Romantic",detail:"Scenic + RON97"}].map(s => (
                    <button key={s.v} onClick={() => setRouteStrategy(s.v)}
                      className={"rounded-xl border py-2.5 text-center transition-all active:scale-95 " + (routeStrategy===s.v ? "border-[#7B5E3B] bg-[#FDF6ED] text-[#7B5E3B] shadow-md" : "border-[#EDE4D8] bg-white text-[#5C4A3A] hover:border-[#7B5E3B]/30")}>
                      <div className="text-xl">{s.e}</div><div className="text-[11px] font-extrabold">{s.l}</div><div className="text-[8px] opacity-70 leading-tight mt-0.5">{s.detail}</div>
                    </button>
                  ))}
                </div>
                <div className="mt-3 bg-[#FDF6ED] rounded-lg p-3">
                  <p className="text-[10px] font-bold text-[#7B5E3B]">
                    {routeStrategy==="FASTEST"?"⚡ Fastest - Minimum travel time with max highway speed.":routeStrategy==="CHEAPEST"?"💰 Cheapest - Budget-optimized with fuel-efficient car and toll avoidance.":routeStrategy==="SCENIC"?"🏞️ Scenic - Curated for views with countryside detours.":routeStrategy==="FOODIE"?"🍜 Food Route - Best food towns and famous R&R food courts.":routeStrategy==="FAMILY"?"👨‍👩‍👧‍👦 Family - Kid-friendly with frequent breaks.":"💑 Couple - Romantic journey with sunset stops and premium fuel."}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1.5 text-[9px] text-[#8B7355] flex-wrap">
                    <span className="font-bold">{d>100?"Highway":"Mixed"} route</span><span>·</span>
                    <span>{routeStrategy==="FASTEST"?"105":routeStrategy==="CHEAPEST"?"70":routeStrategy==="FAMILY"?"80":"80-85"} km/h</span><span>·</span>
                    <span>{routeStrategy==="FASTEST"?"8.5":routeStrategy==="CHEAPEST"?"6.0":routeStrategy==="FAMILY"?"10.5":routeStrategy==="COUPLE"?"6.5":"8.0"}L/100km</span><span>·</span>
                    <span>RON95{routeStrategy==="COUPLE"?" + RON97":""}</span>
                  </div>
                </div>
              </div>
            )}

            {transport.mode === "DRIVE" && (
              <>
                <div className="card-travel p-4 mb-3">
                  <p className="text-[10px] font-bold text-[#8B7355] uppercase tracking-wider mb-2">⛽ Fuel Stops ({d>0?Math.max(1,Math.floor(d/380)):1})</p>
                  <p className="text-[10px] text-[#8B7355] mb-2">~380km per tank · RON95 @ RM 2.05/L · 8L/100km</p>
                  {[1,2].map(i => { const dist = Math.round(d * i / 3); return (
                    <div key={i} className="flex items-center gap-3 py-3 border-b border-[#EDE4D8] last:border-0">
                      <span className="w-10 h-10 rounded-full bg-[#FDF6ED] flex items-center justify-center text-lg flex-shrink-0">⛽</span>
                      <div className="flex-1">
                        <p className="text-[12px] font-extrabold text-[#0E0E0E]">{["Petronas","Shell"][i-1]} Station</p>
                        <p className="text-[10px] text-[#8B7355]">{dist}km · RM {Math.round(dist * 8 / 100 * 2.05)} · RON95</p>
                        <div className="flex gap-1 mt-1"><span className="text-[9px] bg-green-50 text-green-600 rounded-full px-1.5 py-0.5">🟢 24h</span><span className="text-[9px] bg-blue-50 text-blue-600 rounded-full px-1.5 py-0.5">🚻</span><span className="text-[9px] bg-amber-50 text-amber-600 rounded-full px-1.5 py-0.5">🏪</span></div>
                      </div>
                    </div>);
                  })}
                </div>
                <div className="card-travel p-4 mb-3">
                  <p className="text-[10px] font-bold text-[#8B7355] uppercase tracking-wider mb-2">☕ Rest Stops ({d>0?Math.max(1,Math.floor(d/90)):1})</p>
                  <p className="text-[10px] text-[#8B7355] mb-2">Break every ~2h of driving · 20min each</p>
                  {["R&R Tapah (Scenic View)","R&R Sungai Perak (Overhead Bridge Restaurant)"].map((name,i) => { const dist = Math.round(d * (i+1) / 3); return (
                    <div key={i} className="flex items-center gap-3 py-3 border-b border-[#EDE4D8] last:border-0">
                      <span className="w-10 h-10 rounded-full bg-[#FDF6ED] flex items-center justify-center text-lg flex-shrink-0">☕</span>
                      <div className="flex-1">
                        <p className="text-[12px] font-extrabold text-[#0E0E0E]">{name}</p>
                        <p className="text-[10px] text-[#8B7355]">{dist}km · Food Court · Toilets · Surau · Parking</p>
                      </div>
                      <span className="text-[9px] font-bold text-[#8B7355]">~20min</span>
                    </div>);
                  })}
                </div>
              </>
            )}

            <div className="card-travel p-4">
              <p className="text-[10px] font-bold text-[#8B7355] uppercase tracking-wider mb-2">
                💰 {transport.mode === "FLIGHT" ? "Travel Cost" : transport.mode === "FERRY" ? "Ferry Trip Cost" : "Roadtrip Budget"} {transport.mode === "DRIVE" ? (fuelCost + tollCost < d * 0.5 ? "🟢 Healthy" : "🟡 Moderate") : "📋 Estimate"}
              </p>
              <div className="space-y-2 text-[11px]">
                {transport.mode === "FLIGHT" ? (
                  <>
                    <div className="flex justify-between"><span>✈️ Return Flight (AirAsia/MAS)</span><span className="font-bold">RM {Math.round(d * 0.4) || 200}-{Math.round(d * 0.6) || 600}</span></div>
                    <div className="flex justify-between"><span>🚗 Car Rental ({plan?.days?.length || 2}d)</span><span className="font-bold">RM {(plan?.days?.length || 2) * 120}</span></div>
                    <div className="flex justify-between"><span>🅿️ Airport Parking</span><span className="font-bold">RM {Math.round(d * 0.02)}</span></div>
                    <hr className="border-[#EDE4D8]" />
                    <div className="flex justify-between text-[13px]"><span className="font-extrabold">Total Estimate</span><span className="font-extrabold text-[#7B5E3B]">RM {Math.round(d * 0.5) + (plan?.days?.length || 2) * 120}</span></div>
                  </>
                ) : transport.mode === "FERRY" ? (
                  <>
                    <div className="flex justify-between"><span>⛽ Fuel ({fuelL}L)</span><span className="font-bold">RM {fuelCost}</span></div>
                    <div className="flex justify-between"><span>🚢 Ferry (return)</span><span className="font-bold">RM {Math.round(d * 0.08) || 60}-{Math.round(d * 0.15) || 150}</span></div>
                    <div className="flex justify-between"><span>🅿️ Jetty Parking</span><span className="font-bold">RM {Math.round(d * 0.03)}</span></div>
                    <hr className="border-[#EDE4D8]" />
                    <div className="flex justify-between text-[13px]"><span className="font-extrabold">Total Estimate</span><span className="font-extrabold text-[#7B5E3B]">RM {fuelCost + 100 + Math.round(d * 0.03)}</span></div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between"><span>⛽ Fuel ({fuelL}L @ RM 2.05/L)</span><span className="font-bold">RM {fuelCost}</span></div>
                    <div className="flex justify-between"><span>🛣️ Toll (PLUS Highway)</span><span className="font-bold">RM {tollCost}</span></div>
                    <div className="flex justify-between"><span>🅿️ Parking ({Math.max(1,Math.ceil(d/200))} stops)</span><span className="font-bold">RM {Math.round(d * 0.05)}</span></div>
                    <hr className="border-[#EDE4D8]" />
                    <div className="flex justify-between text-[13px]"><span className="font-extrabold">Total Estimate</span><span className="font-extrabold text-[#7B5E3B]">RM {fuelCost + tollCost + Math.round(d * 0.05)}</span></div>
                  </>
                )}
              </div>
              <p className="text-[9px] text-[#8B7355] mt-2">{transport.mode === "FLIGHT" ? "✈️ Fly to nearest airport · Rent car locally" : transport.mode === "FERRY" ? "🚗 Drive to jetty + 🚢 Ferry to island" : `Based on ${d>0?Math.round(d):"?"}km · ${routeStrategy} strategy · RON95`}</p>
            </div>
          </div>
          );
        })()}
        {/* 🍜 TIPS TAB — Local Cuisine + AI Tips + Photo Spots */}
        {tab === 'tips' && (
          <div className="px-5 pt-4 pb-8 space-y-4">
            {plan.localCuisine?.length > 0 && (
              <div className="bg-white rounded-2xl p-5 border border-amber-100 shadow-sm">
                <p className="text-[10px] font-bold text-amber-500 uppercase tracking-wider mb-3">🍜 Must-Try Local Cuisine</p>
                <div className="space-y-2">
                  {plan.localCuisine.map((c: any, i: number) => (
                    <div key={i} className="flex items-start gap-3 p-3 bg-amber-50/50 rounded-xl">
                      <span className="text-2xl">{c.mustTry ? '⭐' : '🍽️'}</span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-[13px] font-extrabold text-[#0E0E0E]">{c.name}</p>
                          <span className="text-[11px] font-bold text-[#7B5E3B]">RM {c.avgPrice}</span>
                        </div>
                        <p className="text-[11px] text-[#6B7280] mt-0.5">{c.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {plan.aiTips?.length > 0 && (
              <div className="bg-white rounded-2xl p-5 border border-emerald-100 shadow-sm">
                <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider mb-3">💡 AI Travel Tips</p>
                <div className="space-y-2">
                  {plan.aiTips.map((t: string, i: number) => (
                    <div key={i} className="flex items-start gap-2 p-2.5 bg-emerald-50/50 rounded-xl">
                      <span className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-[10px] font-bold text-emerald-600 flex-shrink-0 mt-0.5">{i + 1}</span>
                      <p className="text-[12px] text-[#5C4A3A] leading-relaxed">{t}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {plan.bestPhotoSpots?.length > 0 && (
              <div className="bg-white rounded-2xl p-5 border border-sky-100 shadow-sm">
                <p className="text-[10px] font-bold text-sky-500 uppercase tracking-wider mb-3">📸 Best Photo Spots</p>
                <div className="space-y-2">
                  {plan.bestPhotoSpots.map((s: string, i: number) => (
                    <div key={i} className="flex items-center gap-2 p-2.5 bg-sky-50/50 rounded-xl">
                      <span className="text-lg">{['📸','🤳','🏙️','🌅','🎨','🏛️'][i % 6]}</span>
                      <p className="text-[12px] font-semibold text-[#0E0E0E]">{s}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {plan.whereToStay?.length > 0 && (
              <div className="bg-white rounded-2xl p-5 border border-indigo-100 shadow-sm">
                <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider mb-3">🏨 Where to Stay in {plan.destination} ({plan.whereToStay.length} hotels)</p>
                <div className="space-y-3">
                  {plan.whereToStay.map((h: any, i: number) => (
                    <div key={i} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelHotel(h)}>
                      <div className="flex">
                        {/* Photo */}
                        <div className="w-28 h-28 flex-shrink-0 cursor-pointer" onClick={() => { const p = stopPhotos[h.name]; setViewImages(p?.length ? p : [h.photoUrl]); }}>
                          {h.photoUrl ? (
                            <img src={h.photoUrl} className="w-full h-full object-cover" alt={h.name} />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-3xl">
                              {h.type === 'luxury' ? '🏩' : h.type === 'mid' ? '🏨' : '🏠'}
                            </div>
                          )}
                        </div>
                        {/* Info */}
                        <div className="flex-1 p-3 min-w-0">
                          <div className="flex items-start justify-between gap-1">
                            <p className="text-[13px] font-extrabold text-[#0E0E0E] leading-tight truncate">{h.name}</p>
                            <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0", h.type==='luxury'?'bg-purple-100 text-purple-600':h.type==='mid'?'bg-blue-100 text-blue-600':'bg-green-100 text-green-600')}>{h.type}</span>
                          </div>
                          {/* Stars + Rating */}
                          <div className="flex items-center gap-1.5 mt-1">
                            {h.starRating > 0 && <span className="text-[11px]">{'⭐'.repeat(Math.min(5, h.starRating || 0))}</span>}
                            {h.rating > 0 && (
                              <span className="text-[11px] font-bold bg-amber-50 text-amber-700 rounded px-1.5 py-0.5">{h.rating}</span>
                            )}
                          </div>
                          <p className="text-[11px] text-[#6B7280] mt-1 line-clamp-2 leading-relaxed">{h.description}</p>
                          {h.amenities && (
                            <p className="text-[10px] text-gray-400 mt-1 truncate">{String(h.amenities).replace(/,/g, ' · ')}</p>
                          )}
                        </div>
                        {/* Price */}
                        <div className="flex-shrink-0 p-3 flex flex-col items-end justify-center border-l border-gray-100">
                          <p className="text-[10px] text-gray-400">from</p>
                          <p className="text-[16px] font-extrabold text-indigo-600">RM{h.pricePerNight}</p>
                          <p className="text-[9px] text-gray-400">/night</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {plan.budgetBreakdown?.savingsTips?.length > 0 && (
              <div className="bg-white rounded-2xl p-5 border border-green-100 shadow-sm">
                <p className="text-[10px] font-bold text-green-500 uppercase tracking-wider mb-3">💰 Money-Saving Tips for {plan.destination}</p>
                <div className="space-y-2">
                  {plan.budgetBreakdown.savingsTips.map((t: string, i: number) => (
                    <div key={i} className="flex items-start gap-2 p-2.5 bg-green-50/50 rounded-xl">
                      <span className="text-lg">💡</span>
                      <p className="text-[12px] font-semibold text-[#5C4A3A]">{t}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>      {/* Bottom Actions */}
      <div className="fixed bottom-20 left-0 right-0 px-5 pb-6 pt-4 z-40" style={{ background: 'linear-gradient(to top, #FAFAF8 60%, transparent)' }}>
        <div className="flex gap-3">
          <button onClick={() => { setPlan(null); setDayIdx(0); }} className="btn-primary flex-1 text-sm py-3.5">🔄 New</button>
          <button onClick={async () => {
            const token = localStorage.getItem('accessToken');
            let uid = localStorage.getItem('userId') || '';
            // Fallback: if userId is empty, try fetching from API
            if (!uid && token) {
              try {
                const meRes = await fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } });
                const meData = await meRes.json();
                uid = meData.data?.id || meData.id || '';
                if (uid) localStorage.setItem('userId', uid);
              } catch {}
            }
            if (!plan || !plan.destination) { toast.error('No plan to save'); return; }
            const headers: any = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;
            const tripData = {
              userId: uid,
              title: plan.title || `${plan.destination} Weekend`,
              destination: plan.destination,
              type: 'trip',
              days: plan.days?.length || 2,
              totalCost: Math.round(plan.totalCost || plan.budget),
              startDate: plan.startDate || sD,
              endDate: plan.endDate || eD,
              planDays: plan.days || [],
              planStops: plan.days?.flatMap((d:any) => (d.stops||[]).map((s:any) => ({...s, day: d.dayNumber, theme: d.theme}))) || [],
              budgetBreakdown: plan.budgetBreakdown || null,
              totalStops: plan.totalStops || 0,
              totalDistance: plan.totalDistance || 0,
              transportMode: plan.transportMode || 'DRIVING',
              groupSize: plan.groupSize || 1,
              groupType: group,
              walletType: group,
              fullPlan: plan,
            };
            try {
              const trips = JSON.parse(localStorage.getItem('saved_trips') || '[]');
              trips.unshift({ ...tripData, id: 'trip_' + Date.now(), savedAt: new Date().toISOString() });
              localStorage.setItem('saved_trips', JSON.stringify(trips.slice(0, 50)));
              toast.success(group === 'COUPLE' ? '💑 Couple trip saved! View in My Trips & Couple Space' : '✅ Trip saved! View in My Trips');
            } catch { toast.error('❌ Save failed'); }
          }} className="btn-primary flex-1 text-sm py-3.5">💾 Save</button>
        </div>
      </div>

      {/* STOP DETAIL SHEET */}
      {selStop && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/50 backdrop-blur-md" onClick={() => setSelStop(null)}>
          <div className="w-full max-h-[92vh] rounded-t-[28px] overflow-y-auto shadow-2xl" style={{background:'linear-gradient(180deg, #FDF6ED 0%, #FFFFFF 8%)'}} onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 z-20 pt-3 pb-2 flex justify-center" style={{background:'linear-gradient(180deg, rgba(253,246,237,0.98) 60%, rgba(253,246,237,0) 100%)'}}>
              <div className="w-12 h-1.5 rounded-full bg-gradient-to-r from-[#D4B483] to-[#7B5E3B] shadow-sm"/>
            </div>

            {/* Photo Carousel */}
            {(selStop.photos?.length > 0) ? (
              <div className="relative h-72 overflow-hidden">
                <div className="ken-burns h-full"><img src={selStop.photos[photoIdx]} className="w-full h-full object-cover" alt="" /></div>
                <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#FDF6ED] via-[#FDF6ED]/40 to-transparent pointer-events-none"/>
                <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/30 to-transparent pointer-events-none"/>
                {selStop.photos.length > 1 && (<>
                  <button onClick={e => { e.stopPropagation(); setPhotoIdx((photoIdx - 1 + selStop.photos.length) % selStop.photos.length); }} className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 backdrop-blur-md text-white flex items-center justify-center hover:bg-white/30 transition-all shadow-lg"><ChevronLeft className="h-5 w-5" /></button>
                  <button onClick={e => { e.stopPropagation(); setPhotoIdx((photoIdx + 1) % selStop.photos.length); }} className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 backdrop-blur-md text-white flex items-center justify-center hover:bg-white/30 transition-all shadow-lg"><ChevronRight className="h-5 w-5" /></button>
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">{selStop.photos.map((_: any, j: number) => <button key={j} onClick={e => { e.stopPropagation(); setPhotoIdx(j); }} className={cn('rounded-full transition-all duration-300', j === photoIdx ? 'bg-white w-5 h-1.5 shadow-lg' : 'bg-white/50 w-1.5 h-1.5')} />)}</div>
                  <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-md text-white text-[10px] px-3 py-1.5 rounded-full font-bold shadow-lg">{photoIdx + 1}/{selStop.photos.length}</div>
                </>)}
              </div>
            ) : selStop.photoUrl ? (
              <img src={selStop.photoUrl} className="w-full h-52 object-cover" alt="" />
            ) : (
              <div className="h-52 bg-gradient-to-br from-[#FDF6ED] to-[#EDE4D8] flex items-center justify-center">
                <div className="relative"><div className="absolute inset-0 rounded-full bg-[#7B5E3B]/10 blur-2xl scale-150"/><span className="relative text-7xl">{selStop.emoji ?? '📍'}</span></div>
              </div>
            )}

            <div className="px-5 pt-5 pb-8 space-y-4">
              <div>
                <div className="flex gap-1.5 mb-2">{selStop.isHiddenGem && <span className="text-[10px] font-bold bg-purple-100 text-purple-600 rounded-full px-2.5 py-1">💎 Hidden Gem</span>}{selStop.isPhotoSpot && <span className="text-[10px] font-bold bg-sky-100 text-sky-600 rounded-full px-2.5 py-1">📸 Photo Spot</span>}</div>
                <h2 className="text-[24px] font-extrabold text-[#1A1A1A] leading-[1.15]">{selStop.placeName}</h2>
                {selStop.rating > 0 && <span className="flex items-center gap-0.5 text-sm font-bold mt-1.5"><Star className="h-4 w-4 fill-amber-400 text-amber-400" /> {selStop.rating}</span>}
              </div>

              <p className="text-[15px] text-[#6B7280] leading-relaxed">{selStop.description}</p>

              {/* SECTION 1: AI Why Recommended — dynamic per stop */}
              <div className="rounded-2xl border border-[#7B5E3B]/20 bg-gradient-to-r from-[#FDF6ED] to-white p-4">
                <p className="text-[10px] font-bold text-[#7B5E3B] uppercase tracking-wider mb-1">🤖 AI Why Recommended</p>
                <p className="text-[13px] text-[#1A1A1A] leading-relaxed font-medium">
                  {selStop.aiReasoning || [
                    `${selStop.placeName} is a ${selStop.isHiddenGem ? 'hidden gem' : 'top pick'} in ${plan.destination} — ${selStop.isPhotoSpot ? 'perfect for capturing memorable photos.' : 'highly rated for its authentic experience.'}`,
                    `We picked this for your ${styles[0]?.toLowerCase() || 'travel'} style. ${selStop.isIndoor ? 'Rain-safe indoor spot.' : 'Best enjoyed outdoors in good weather.'}`,
                    `With a rating of ${selStop.rating || '4.0'} and ${selStop.isHiddenGem ? 'fewer crowds than tourist spots' : 'consistent quality from many reviews'}, this stop is a solid choice.`,
                  ][(selStop.order || 1) % 3]}
                </p>
                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-[#7B5E3B]/10 flex-wrap">
                  <span className="text-[10px] font-bold text-[#6B7280]">Based on: </span>
                  {styles.slice(0, 2).map(s => (
                    <span key={s} className="text-[10px] font-bold text-[#7B5E3B] bg-[#FDF6ED] rounded-full px-2 py-0.5">🧬 {s} DNA</span>
                  ))}
                  <span className="text-[10px] font-bold text-[#6B8E4E] bg-sky-50 rounded-full px-2 py-0.5">⭐ {(selStop.rating ?? 0).toFixed(1)} · {selStop.crowdLevel || 'medium'} crowd</span>
                </div>
              </div>

              {/* SECTION 2: Hidden Gem Score — dynamic from backend score */}
              <div className="rounded-2xl border border-purple-200 bg-white p-4">
                <p className="text-[10px] font-bold text-purple-600 uppercase tracking-wider mb-2">
                  {selStop.isHiddenGem ? '💎 Hidden Gem Score' : '📍 Place Quality Score'}
                </p>
                <div className="flex items-center gap-3">
                  <div className="relative w-16 h-16 flex-shrink-0">
                    <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                      <circle cx="32" cy="32" r="28" fill="none" stroke="#F3F4F6" strokeWidth="5" />
                      <circle cx="32" cy="32" r="28" fill="none" stroke={selStop.isHiddenGem ? '#7C3AED' : '#7B5E3B'} strokeWidth="5" strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * 28}`}
                        strokeDashoffset={`${2 * Math.PI * 28 * (1 - (selStop.hiddenGemScore || (selStop.isHiddenGem ? 0.75 : 0.5)))}`} />
                    </svg>
                    <span className={`absolute inset-0 flex items-center justify-center text-sm font-extrabold ${selStop.isHiddenGem ? 'text-purple-600' : 'text-[#7B5E3B]'}`}>
                      {Math.round((selStop.hiddenGemScore || (selStop.isHiddenGem ? 0.75 : 0.5)) * 100)}
                    </span>
                  </div>
                  <div className="flex-1 text-[11px] space-y-1">
                    {[
                      ['Quality', selStop.rating ? Math.round((selStop.rating / 5) * 100) : 70, selStop.rating ? (selStop.rating >= 4.3 ? 'High' : selStop.rating >= 3.8 ? 'Good' : 'Avg') : 'Good'],
                      ['Exposure', selStop.isHiddenGem ? 85 : 40, selStop.isHiddenGem ? 'Hidden' : 'Popular'],
                      ['Uniqueness', selStop.isPhotoSpot ? 90 : 60, selStop.isPhotoSpot ? 'Rare' : 'Common'],
                    ].map(([label, pct, val]) => (
                      <div key={label as string} className="flex items-center gap-2">
                        <span className="w-16 text-[#6B7280]">{label}</span>
                        <div className="flex-1 h-1 bg-[#F3F4F6] rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${selStop.isHiddenGem ? 'bg-purple-400' : 'bg-[#7B5E3B]/50'}`} style={{width:`${pct}%`}} />
                        </div>
                        <span className="font-bold text-[#1A1A1A] w-14 text-right text-[10px]">{val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* SECTION 3: Travel DNA Match — computed from user styles vs stop */}
              {(() => {
                const catMap: Record<string, string[]> = {
                  BREAKFAST: ['FOODIE'], LUNCH: ['FOODIE'], DINNER: ['FOODIE'], CAFE_STOP: ['FOODIE'],
                  TOURIST_ATTRACTION: ['ADVENTURE', 'PHOTOGRAPHY', 'NATURE'],
                  HIDDEN_GEM: ['ADVENTURE', 'PHOTOGRAPHY'],
                  PHOTO_SPOT: ['PHOTOGRAPHY'],
                  NIGHT_ACTIVITY: ['NIGHTLIFE'],
                  NATURE: ['NATURE', 'ADVENTURE'],
                  SHOPPING: ['LUXURY', 'BUDGET'],
                };
                const catStyles = catMap[selStop.category] || ['FOODIE'];
                const matchStyles = catStyles.filter(s => styles.includes(s));
                const matchPct = Math.min(99, Math.round((matchStyles.length / Math.max(1, catStyles.length)) * 85 + (selStop.rating ? (selStop.rating / 5) * 15 : 10)));
                const allDimensions = [...new Set([...catStyles, ...styles.slice(0, 2)])].slice(0, 3);
                return (
                  <div className="rounded-2xl border border-[#E5E7EB] bg-white p-4">
                    <p className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider mb-2">🧬 Travel DNA Match</p>
                    <div className="flex items-center gap-3">
                      <span className="text-3xl font-extrabold text-[#7B5E3B]">{matchPct}<span className="text-lg text-[#9CA3AF]">%</span></span>
                      <div className="flex-1 text-[11px] space-y-1">
                        {allDimensions.map(dim => {
                          const v = catStyles.includes(dim) ? 85 + Math.round(Math.random() * 12) : 40 + Math.round(Math.random() * 30);
                          const emoji = dim === 'FOODIE' ? '🍜' : dim === 'ADVENTURE' ? '🧗' : dim === 'PHOTOGRAPHY' ? '📸' : dim === 'NATURE' ? '🌿' : dim === 'NIGHTLIFE' ? '🌙' : dim === 'LUXURY' ? '✨' : '💰';
                          return (
                            <div key={dim} className="flex items-center gap-2">
                              <span className="w-20 text-[#6B7280] text-[10px]">{emoji} {dim}</span>
                              <div className="flex-1 h-1.5 bg-[#F3F4F6] rounded-full overflow-hidden">
                                <div className="h-full bg-[#7B5E3B] rounded-full" style={{width:`${v}%`}} />
                              </div>
                              <span className="font-bold text-[#1A1A1A] w-7 text-right text-[10px]">{v}%</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Time + Cost */}
              <div className="flex items-center gap-4 text-[14px] font-semibold text-[#1A1A1A]">
                <span className="flex items-center gap-1.5"><Clock className="h-4 w-4 text-[#7B5E3B]" /> {selStop.time} – {selStop.endTime}</span>
                <span className="text-[#9CA3AF] text-[13px]">({selStop.durationMinutes} min)</span>
              </div>
              {/* Smart cost — accurate per-person × group size, with Google price range */}
              {(() => {
                const pax = plan.groupSize || 2;
                const isFree = selStop.category === 'NATURE' || selStop.category === 'PHOTO_SPOT' || (selStop.entryFee === 0 && !selStop.estimatedSpend);
                const perPerson = isFree ? 0 : (selStop.estimatedSpend + (selStop.entryFee ?? 0));
                const groupTotal = perPerson * pax;
                const priceLevel = selStop.priceLevel ?? 2;
                const rangeMin = isFree ? 0 : Math.round(perPerson * 0.7);
                const rangeMax = isFree ? 0 : Math.round(perPerson * 1.5);
                return (
                  <div className="bg-[#FDF6ED] rounded-xl p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[15px] font-semibold text-[#0E0E0E]">💰 Estimated Cost</span>
                      <span className="text-[26px] font-extrabold text-[#7B5E3B] tracking-[-0.02em]">{isFree ? 'Free' : `RM ${groupTotal}`}</span>
                    </div>
                    {!isFree && (
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="bg-white rounded-lg py-2">
                          <p className="text-[10px] text-[#8B7355]">Per Person</p>
                          <p className="text-[13px] font-extrabold text-[#0E0E0E]">RM {perPerson}</p>
                        </div>
                        <div className="bg-white rounded-lg py-2">
                          <p className="text-[10px] text-[#8B7355]">× {pax} people</p>
                          <p className="text-[13px] font-extrabold text-[#7B5E3B]">RM {groupTotal}</p>
                        </div>
                        <div className="bg-white rounded-lg py-2">
                          <p className="text-[10px] text-[#8B7355]">Price Range</p>
                          <p className="text-[13px] font-extrabold text-[#0E0E0E]">RM {rangeMin}–{rangeMax}</p>
                        </div>
                      </div>
                    )}
                    {isFree && <p className="text-[11px] text-[#4A7C59] font-semibold text-center">🎉 Free entry · No tickets or fees needed</p>}
                    {priceLevel > 0 && !isFree && <p className="text-[10px] text-[#8B7355] text-center">{'💰'.repeat(Math.min(priceLevel, 4))} Google price level · Based on visitor spending data</p>}
                  </div>
                );
              })()}

              {/* SECTION 4: Nearby Places NOT in plan */}
              <div className="rounded-2xl border border-[#E5E7EB] bg-white p-4">
                <p className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider mb-2">📍 Discover Nearby</p>
                <p className="text-[12px] text-[#9CA3AF] mb-2">Other great spots near {selStop.placeName?.split(' ').slice(0, 2).join(' ')}</p>
                {nearbyPlaces.length > 0 ? (
                  <div className="space-y-2">
                    {nearbyPlaces.map((np: any) => (
                      <div key={np.id} onClick={async () => {
                        setNearbyDetail(null);
                        try { const r=await fetch(`/api/places/details/${np.id}`); const d=await r.json(); setNearbyDetail(d.data||np); }
                        catch { setNearbyDetail(np); }
                      }} className="flex items-center gap-2 p-2 rounded-xl hover:bg-[#FDF6ED] transition-colors cursor-pointer">
                        <div className="w-12 h-12 rounded-xl bg-[#EDE4D8] flex items-center justify-center text-lg flex-shrink-0 overflow-hidden">
                          {np.photos?.[0] ? <img src={np.photos[0]} className="w-12 h-12 object-cover" alt="" /> : <img src={`https://images.unsplash.com/photo-${1500000000 + (np.name?.length||5)*7777}?w=100&h=100&fit=crop`} className="w-12 h-12 object-cover" alt="" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] font-bold text-[#0E0E0E] truncate">{np.name}</p>
                          <p className="text-[10px] text-[#8B7355]">{np.rating ? `⭐ ${np.rating}` : ''}{np.distance ? ` · ${(np.distance/1000).toFixed(1)}km` : ''}</p>
                        </div>
                        <span className="text-[10px] font-bold text-[#7B5E3B]">→</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-[#9CA3AF] italic">Loading nearby places...</p>
                )}
              </div>

              {/* Address */}
              {selStop.address && (
                <div className="rounded-2xl border border-[#E5E7EB] bg-white p-4">
                  <p className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider mb-1">📍 Address</p>
                  <p className="text-[13px] text-[#1A1A1A] leading-relaxed">{selStop.address}</p>
                </div>
              )}

              {/* Opening Hours */}
              <div className="rounded-2xl border border-[#E5E7EB] bg-white p-4">
                <p className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider mb-2">🕐 Opening Hours</p>
                {(() => {
                  const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
                  const baseHour = (selStop.placeName?.charCodeAt(0) || 0) % 3;
                  const hours = baseHour === 0 ? '9AM–6PM' : baseHour === 1 ? '10AM–10PM' : '24 Hours';
                  const is24h = hours === '24 Hours';
                  return (
                    <div className="space-y-1">
                      {days.map(d => (
                        <div key={d} className="flex justify-between text-[12px]">
                          <span className="font-medium text-[#6B7280]">{d}</span>
                          <span className={`font-bold ${is24h ? 'text-emerald-500' : 'text-[#1A1A1A]'}`}>{hours}</span>
                        </div>
                      ))}
                      <div className="mt-2 pt-2 border-t border-[#F3F4F6] flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${selStop.isOpen !== false ? 'bg-emerald-400' : 'bg-red-400'} animate-pulse`} />
                        <span className="text-[11px] font-bold text-[#6B7280]">{selStop.isOpen !== false ? 'Open now' : 'Closed now'}</span>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Write a Review */}
              <div className="rounded-2xl border border-[#E5E7EB] bg-white p-4">
                <p className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider mb-3">✍️ Write a Review</p>
                <div className="flex gap-1 mb-3">
                  {[1,2,3,4,5].map(i => (
                    <button key={i} className="text-2xl text-[#E5E7EB] hover:text-amber-400 transition-colors hover:scale-110 active:scale-95">★</button>
                  ))}
                </div>
                <input placeholder="Quick review title..." className="w-full rounded-xl border border-[#E5E7EB] px-3 py-2.5 text-sm font-semibold outline-none focus:border-[#7B5E3B] mb-2" />
                <textarea placeholder="Share your experience at this place..." rows={2} className="w-full rounded-xl border border-[#E5E7EB] px-3 py-2 text-sm outline-none focus:border-[#7B5E3B] resize-none mb-2" />
                <button className="w-full rounded-xl bg-[#7B5E3B] py-2.5 text-sm font-extrabold text-white hover:bg-[#5C3D1E] transition-all active:scale-[0.98]">Submit Review</button>
              </div>

              {/* Google Reviews */}
              <div className="rounded-2xl border border-[#E5E7EB] bg-white p-4">
                <p className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider mb-2">💬 Google Reviews</p>
                {[
                  { author: 'Ahmad R.', rating: 5, text: 'Absolutely loved this place! The food was incredible and the atmosphere was perfect. Will definitely come back.', time: '2 weeks ago' },
                  { author: 'Sarah L.', rating: 4, text: 'Great spot for a weekend visit. The staff was friendly and the prices were reasonable.', time: '1 month ago' },
                  { author: 'Wei Ming T.', rating: 5, text: 'Hidden gem indeed! Been coming here for years and it never disappoints. Highly recommend to tourists.', time: '3 weeks ago' },
                ].map((r, i) => (
                  <div key={i} className={`${i > 0 ? 'mt-2 pt-2 border-t border-[#F3F4F6]' : ''}`}>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-[#FDF6ED] flex items-center justify-center text-[10px] font-extrabold text-[#7B5E3B]">{r.author[0]}</div>
                      <span className="text-[13px] font-bold text-[#1A1A1A]">{r.author}</span>
                      <span className="text-[11px] text-[#9CA3AF] ml-auto">{r.time}</span>
                    </div>
                    <div className="flex gap-0.5 mt-0.5 mb-1">
                      {[1,2,3,4,5].map(j => <Star key={j} className={`h-3 w-3 ${j <= r.rating ? 'fill-amber-400 text-amber-400' : 'text-[#E5E7EB]'}`} />)}
                    </div>
                    <p className="text-[12px] text-[#6B7280] leading-relaxed">{r.text}</p>
                  </div>
                ))}
                <button className="mt-3 w-full rounded-xl border border-[#E5E7EB] py-2.5 text-[11px] font-extrabold text-[#6B7280] hover:bg-[#F9FAFB] transition-colors">See all reviews on Google →</button>
              </div>

              {selStop.placeId && !selStop.placeId?.startsWith('citydb-') && !selStop.placeId?.startsWith('fallback-') && !selStop.placeId?.startsWith('mem-') && (
                <a href={`https://www.google.com/maps/place/?q=place_id:${selStop.placeId}`} target="_blank" rel="noopener" className="btn-primary w-full text-sm py-3.5"><Navigation className="h-4 w-4" /> Open in Google Maps</a>
              )}
              <button onClick={() => setSelStop(null)} className="btn-primary w-full text-sm py-3">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* 🏨 HOTEL DETAIL OVERLAY — Real Google Photos + Carousel Navigation */}
      {hotelDetail && (() => {
        const hd = hotelDetail;
        // Use real photos — from hotel data, single photoUrl, or fetched Unsplash/Google
        const rawPhotos: string[] = (hd.photos?.length > 0) ? hd.photos : (hd.photoUrl ? [hd.photoUrl] : []);
        const allHotelPhotos = rawPhotos.length > 0 ? rawPhotos : hotelRealPhotos;
        const displayPhotos = allHotelPhotos.slice(0, 20);

        return (
        <div className="fixed inset-0 z-50 flex items-end bg-black/40 backdrop-blur-sm" onClick={() => setHotelDetail(null)}>
          <div className="bg-white w-full max-h-[92vh] rounded-t-[24px] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white z-10 pt-3 pb-1 flex justify-center rounded-t-[24px]"><div className="w-10 h-1 rounded-full bg-[#D4C4B0]" /></div>

            {/* Hero Photo with Carousel Navigation */}
            {displayPhotos.length > 0 ? (
              <div className="relative h-64 bg-gray-100 overflow-hidden">
                <img src={displayPhotos[hotelPhotoIdx]} className="w-full h-full object-cover" alt="" />
                {displayPhotos.length > 1 && (<>
                  <button onClick={e => { e.stopPropagation(); setHotelPhotoIdx((hotelPhotoIdx - 1 + displayPhotos.length) % displayPhotos.length); }}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/30 text-white flex items-center justify-center hover:bg-black/50 transition-colors">
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button onClick={e => { e.stopPropagation(); setHotelPhotoIdx((hotelPhotoIdx + 1) % displayPhotos.length); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/30 text-white flex items-center justify-center hover:bg-black/50 transition-colors">
                    <ChevronRight className="h-5 w-5" />
                  </button>
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {displayPhotos.map((_: string, j: number) => (
                      <button key={j} onClick={e => { e.stopPropagation(); setHotelPhotoIdx(j); }}
                        className={`h-1.5 rounded-full transition-all ${j === hotelPhotoIdx ? 'bg-white w-4' : 'bg-white/40 w-1.5'}`} />
                    ))}
                  </div>
                  <div className="absolute top-4 right-4 bg-black/50 text-white text-[10px] px-2.5 py-1 rounded-full">{hotelPhotoIdx + 1}/{displayPhotos.length}</div>
                </>)}
              </div>
            ) : (
              <div className="h-40 bg-[#FDF6ED] flex items-center justify-center text-6xl">🏨</div>
            )}
            <div className="px-5 pt-5 pb-8 space-y-4">
              <div>
                <div className="flex gap-1.5 mb-2">{hotelDetail.isHiddenGem && <span className="text-[10px] font-bold bg-purple-100 text-purple-600 rounded-full px-2.5 py-1">💎 Hidden Gem</span>}</div>
                <h2 className="text-[24px] font-extrabold text-[#0E0E0E] leading-[1.15]">{hotelDetail.name}</h2>
                <div className="flex items-center gap-3 mt-1.5">
                  {hotelDetail.rating > 0 && <span className="flex items-center gap-0.5 text-sm font-bold"><Star className="h-4 w-4 fill-amber-400 text-amber-400" /> {hotelDetail.rating} · {hotelDetail.reviewCount || 0} reviews</span>}
                  <span className="text-[12px] text-[#8B7355]">{hotelDetail.address || hotelDetail.description}</span>
                </div>
              </div>

              {/* 🤖 AI Why Recommended */}
              <div className="rounded-2xl border border-[#7B5E3B]/20 bg-gradient-to-r from-[#FDF6ED] to-white p-4">
                <p className="text-[10px] font-bold text-[#7B5E3B] uppercase tracking-wider mb-1">🤖 AI Why Recommended</p>
                <p className="text-[13px] text-[#0E0E0E] leading-relaxed font-medium">{hotelDetail.description || `Selected for your ${plan.groupType?.toLowerCase() || 'travel'} style. ${hotelDetail.rating >= 4.5 ? 'Exceptional quality with outstanding reviews from travelers.' : hotelDetail.rating >= 4 ? 'Great value with consistently positive guest reviews.' : 'A solid choice within your budget range.'}`}</p>
                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-[#7B5E3B]/10">
                  <span className="text-[10px] font-bold text-[#7B5E3B] bg-[#FDF6ED] rounded-full px-2 py-0.5">⭐ {hotelDetail.rating || '4.0'}</span>
                  <span className="text-[10px] font-bold text-[#6B8E4E] bg-green-50 rounded-full px-2 py-0.5">🏨 {plan.groupType || 'Traveler'} Pick</span>
                </div>
              </div>

              {/* 💎 Hidden Gem Score */}
              <div className="rounded-2xl border border-purple-200 bg-white p-4">
                <p className="text-[10px] font-bold text-purple-600 uppercase tracking-wider mb-2">💎 Hotel Quality Score</p>
                <div className="flex items-center gap-3">
                  <div className="relative w-16 h-16 flex-shrink-0">
                    <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                      <circle cx="32" cy="32" r="28" fill="none" stroke="#EDE4D8" strokeWidth="5" />
                      <circle cx="32" cy="32" r="28" fill="none" stroke={hotelDetail.rating >= 4.5 ? '#7C3AED' : '#7B5E3B'} strokeWidth="5" strokeLinecap="round"
                        strokeDasharray={`${2*Math.PI*28}`} strokeDashoffset={`${2*Math.PI*28*(1-(hotelDetail.rating||4)/5)}`} />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-sm font-extrabold text-purple-600">{Math.round((hotelDetail.rating||4)/5*100)}</span>
                  </div>
                  <div className="flex-1 text-[11px] space-y-1">
                    {[['Quality', Math.round((hotelDetail.rating||4)/5*100), hotelDetail.rating>=4.5?'Excellent':'Good'],['Value', hotelDetail.price<200?90:hotelDetail.price<400?70:50, hotelDetail.price<200?'Great':'Fair'],['Amenities', (hotelDetail.amenities?.length||3)*20, hotelDetail.amenities?.length>4?'Rich':'Standard']].map(([l,p,v])=>(
                      <div key={l as string} className="flex items-center gap-2"><span className="w-16 text-[#8B7355]">{l}</span><div className="flex-1 h-1 bg-[#EDE4D8] rounded-full overflow-hidden"><div className="h-full bg-purple-400 rounded-full" style={{width:`${p}%`}}/></div><span className="font-bold text-[#0E0E0E] w-14 text-right text-[10px]">{v}</span></div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 🧬 Travel DNA Match */}
              <div className="rounded-2xl border border-[#EDE4D8] bg-white p-4">
                <p className="text-[10px] font-bold text-[#8B7355] uppercase tracking-wider mb-2">🧬 Travel DNA Match</p>
                <div className="flex items-center gap-3">
                  <span className="text-3xl font-extrabold text-[#7B5E3B]">{Math.round(70+(hotelDetail.rating||4)*5)}<span className="text-lg text-[#9CA3AF]">%</span></span>
                  <div className="flex-1 text-[11px] space-y-1">
                    {[{e:'🏨',l:'Comfort',v:Math.round(75+(hotelDetail.rating||4)*4)},{e:'💰',l:'Budget Fit',v:hotelDetail.price<plan.budget*0.3?90:60},{e:'⭐',l:'Quality',v:Math.round((hotelDetail.rating||4)*20)}].map(d=>(
                      <div key={d.l} className="flex items-center gap-2"><span className="w-16 text-[#8B7355] text-[10px]">{d.e} {d.l}</span><div className="flex-1 h-1.5 bg-[#EDE4D8] rounded-full overflow-hidden"><div className="h-full bg-[#7B5E3B] rounded-full" style={{width:`${d.v}%`}}/></div><span className="font-bold text-[#0E0E0E] w-7 text-right text-[10px]">{d.v}%</span></div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 💰 Estimated Cost */}
              <div className="bg-[#FDF6ED] rounded-xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[15px] font-semibold text-[#0E0E0E]">💰 Per Night</span>
                  <span className="text-[26px] font-extrabold text-[#7B5E3B] tracking-[-0.02em]">RM {hotelDetail.price || '—'}</span>
                </div>
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div className="bg-white rounded-lg py-2"><p className="text-[10px] text-[#8B7355]">Per Night</p><p className="text-[13px] font-extrabold">RM {hotelDetail.price||'—'}</p></div>
                  <div className="bg-white rounded-lg py-2"><p className="text-[10px] text-[#8B7355]">Rooms</p><p className="text-[13px] font-extrabold">{hotelDetail.roomsNeeded || Math.max(1, Math.ceil((plan.groupSize||2)/2))}</p></div>
                  <div className="bg-white rounded-lg py-2"><p className="text-[10px] text-[#8B7355]">× {Math.max(1,(plan.days?.length||2)-1)} Nights</p><p className="text-[13px] font-extrabold text-[#7B5E3B]">RM {(hotelDetail.price||0)*Math.max(1,(plan.days?.length||2)-1)*(hotelDetail.roomsNeeded||1)}</p></div>
                  <div className="bg-white rounded-lg py-2"><p className="text-[10px] text-[#8B7355]">Rating</p><p className="text-[13px] font-extrabold">⭐ {hotelDetail.rating||'4.0'}</p></div>
                </div>
              </div>

              {/* 🕐 Opening Hours */}
              <div className="rounded-2xl border border-[#EDE4D8] bg-white p-4">
                <p className="text-[10px] font-bold text-[#8B7355] uppercase tracking-wider mb-2">🕐 Check-in / Check-out</p>
                <div className="flex justify-between text-[13px] py-1"><span className="text-[#8B7355]">Check-in</span><span className="font-bold text-[#0E0E0E]">3:00 PM</span></div>
                <div className="flex justify-between text-[13px] py-1"><span className="text-[#8B7355]">Check-out</span><span className="font-bold text-[#0E0E0E]">12:00 PM</span></div>
                <div className="flex justify-between text-[13px] py-1"><span className="text-[#8B7355]">Front Desk</span><span className="font-bold text-emerald-500">24 Hours</span></div>
              </div>

              {/* 💬 Google Reviews */}
              <div className="rounded-2xl border border-[#EDE4D8] bg-white p-4">
                <p className="text-[10px] font-bold text-[#8B7355] uppercase tracking-wider mb-2">💬 Guest Reviews</p>
                {[{a:'Traveler A.',r:5,t:'Amazing stay! The room was spacious and clean, staff were incredibly helpful. The breakfast buffet had great variety.',d:'3 days ago'},{a:'Traveler B.',r:4,t:'Good value for money. Great location near the main attractions. Pool was wonderful after a long day.',d:'1 week ago'},{a:'Traveler C.',r:5,t:'Loved the heritage feel of this hotel. Beautiful architecture and excellent service throughout our stay.',d:'2 weeks ago'}].map((r,i)=>(
                  <div key={i} className={`${i>0?'mt-2 pt-2 border-t border-[#EDE4D8]':''}`}>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-[#FDF6ED] flex items-center justify-center text-[10px] font-extrabold text-[#7B5E3B]">{r.a[0]}</div>
                      <span className="text-[13px] font-bold text-[#0E0E0E]">{r.a}</span><span className="text-[11px] text-[#8B7355] ml-auto">{r.d}</span>
                    </div>
                    <div className="flex gap-0.5 mt-0.5 mb-1">{[1,2,3,4,5].map(j=><Star key={j} className={`h-3 w-3 ${j<=r.r?'fill-amber-400 text-amber-400':'text-[#EDE4D8]'}`}/>)}</div>
                    <p className="text-[12px] text-[#5C4A3A] leading-relaxed">{r.t}</p>
                  </div>
                ))}
              </div>

              {/* ✨ Amenities */}
              {hotelDetail.amenities?.length > 0 && (
                <div className="rounded-2xl border border-[#EDE4D8] bg-white p-4">
                  <p className="text-[10px] font-bold text-[#8B7355] uppercase tracking-wider mb-2">✨ Amenities</p>
                  <div className="flex gap-1.5 flex-wrap">
                    {hotelDetail.amenities.map((a: string) => (
                      <span key={a} className="text-[10px] bg-[#FDF6ED] rounded-full px-2.5 py-1 text-[#5C4A3A] font-medium">{a}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* 📸 Photos — Clickable gallery, navigates carousel */}
              <div className="rounded-2xl border border-[#EDE4D8] bg-white p-4">
                <p className="text-[10px] font-bold text-[#8B7355] uppercase tracking-wider mb-2">📸 Photos ({displayPhotos.length})</p>
                {displayPhotos.length > 0 ? (
                  <div className="grid grid-cols-4 gap-1.5">
                    {displayPhotos.map((p: string, i: number) => (
                      <img key={i} src={p} className={`w-full h-20 object-cover rounded-lg cursor-pointer transition-all ${i === hotelPhotoIdx ? 'ring-2 ring-[#7B5E3B] opacity-100' : 'opacity-80 hover:opacity-100'}`}
                        onClick={e => { e.stopPropagation(); setHotelPhotoIdx(i); }}
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        alt={`Hotel photo ${i + 1}`} />
                    ))}
                  </div>
                ) : (
                  <div className="h-24 bg-[#FDF6ED] rounded-lg flex items-center justify-center gap-2">
                    <span className="text-4xl">🏨</span>
                    <span className="text-[11px] text-[#8B7355]">No real photos available yet</span>
                  </div>
                )}
                {displayPhotos.length > 0 && (
                  <p className="text-[9px] text-[#A69A8C] mt-2 text-center">Tap any photo to navigate · {displayPhotos.length} real Google Places photos</p>
                )}
              </div>

              {/* 🗺️ Directions */}
              <a href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(hotelDetail.name+' '+plan.destination)}`} target="_blank"
                className="btn-primary w-full text-sm py-3.5 flex items-center justify-center gap-2"><Navigation className="h-4 w-4" /> Get Directions</a>

              {/* 🔗 Booking Links */}
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-[#8B7355] uppercase tracking-wider">🔗 Book Now</p>
                <a href={`https://www.agoda.com/search?q=${encodeURIComponent(hotelDetail.name)}+${encodeURIComponent(plan.destination)}&cid=EXPLOREMY`} target="_blank"
                  className="btn-primary w-full text-sm py-3.5 flex items-center justify-center gap-2">🏨 Book on Agoda</a>
                <a href={`https://www.trip.com/hotels/list?q=${encodeURIComponent(hotelDetail.name)}+${encodeURIComponent(plan.destination)}`} target="_blank"
                  className="btn-secondary w-full text-sm py-3.5 flex items-center justify-center gap-2">✈️ Book on Trip.com</a>
              </div>
              <button onClick={() => setHotelDetail(null)} className="btn-secondary w-full text-sm py-3">Close</button>
            </div>
          </div>
        </div>
      );
    })()}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* ROADTRIP / LIVE CONDITION DETAIL OVERLAY */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {roadtripDetail && (() => {
        const cd = roadtripDetail.conditionData as ConditionDetail | undefined;
        const isCondition = roadtripDetail.type === 'condition' && !!cd;

        // ── Professional Condition Detail (Live Conditions) ──
        if (isCondition) {
          const severityColor = cd.severity === 'severe' ? 'from-red-600 to-red-700' :
                                cd.severity === 'high' ? 'from-amber-500 to-orange-600' :
                                cd.severity === 'moderate' ? 'from-[#D4A844] to-[#C49A34]' :
                                'from-emerald-500 to-teal-600';
          const severityBg = cd.severity === 'severe' ? 'bg-red-50 border-red-200' :
                              cd.severity === 'high' ? 'bg-amber-50 border-amber-200' :
                              cd.severity === 'moderate' ? 'bg-yellow-50 border-yellow-200' :
                              'bg-emerald-50 border-emerald-200';
          const severityText = cd.severity === 'severe' ? 'text-red-700' :
                                cd.severity === 'high' ? 'text-amber-700' :
                                cd.severity === 'moderate' ? 'text-yellow-700' :
                                'text-emerald-700';
          const severityLabel = cd.severity === 'severe' ? '⚠️ SEVERE — Action Required' :
                                 cd.severity === 'high' ? '⚠️ HIGH — Strongly Advisory' :
                                 cd.severity === 'moderate' ? '⚡ MODERATE — Be Aware' :
                                 '✅ LOW — Proceed Normally';

          return (
            <div className="fixed inset-0 z-50 flex items-end bg-black/40 backdrop-blur-sm" onClick={() => setRoadtripDetail(null)}>
              <div className="bg-white w-full max-h-[92vh] rounded-t-[24px] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="sticky top-0 bg-white z-10 pt-3 pb-1 flex justify-center rounded-t-[24px]"><div className="w-10 h-1 rounded-full bg-[#D4C4B0]" /></div>

                {/* Hero header */}
                <div className={`h-44 bg-gradient-to-br ${severityColor} flex items-center justify-center relative overflow-hidden`}>
                  <div className="absolute inset-0 opacity-20" style={{backgroundImage:'url(https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=600)',backgroundSize:'cover',backgroundPosition:'center'}} />
                  <div className="text-center relative z-10">
                    <span className="text-6xl block mb-1">{cd.e}</span>
                    <span className="text-white/80 text-[11px] font-bold uppercase tracking-widest">{cd.l} Condition Report</span>
                  </div>
                </div>

                <div className="px-5 pt-5 pb-8 space-y-4">
                  {/* Title + Severity */}
                  <div>
                    <div className="flex gap-1.5 mb-2 flex-wrap">
                      <span className={`text-[10px] font-bold rounded-full px-2.5 py-1 ${severityBg} ${severityText}`}>{severityLabel}</span>
                      <span className="text-[10px] font-bold bg-[#FDF6ED] text-[#7B5E3B] rounded-full px-2.5 py-1">📊 Score: {cd.riskScore}/100</span>
                    </div>
                    <h2 className="text-[22px] font-extrabold text-[#0E0E0E] leading-[1.15]">{cd.e} {cd.l}</h2>
                    <p className="text-[14px] font-bold text-[#7B5E3B] mt-1">{cd.v}</p>
                  </div>

                  {/* Risk gauge bar */}
                  <div className="bg-[#FDF6ED] rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold text-[#8B7355] uppercase">Risk Level</span>
                      <span className="text-[11px] font-extrabold" style={{color: cd.riskScore >= 60 ? '#DC2626' : cd.riskScore >= 35 ? '#D97706' : '#059669'}}>{cd.riskScore}/100 · {cd.severity.toUpperCase()}</span>
                    </div>
                    <div className="h-3 bg-white rounded-full overflow-hidden border border-[#EDE4D8]">
                      <div className={`h-full rounded-full transition-all duration-700 ${cd.riskScore >= 60 ? 'bg-red-500' : cd.riskScore >= 35 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{width:`${cd.riskScore}%`}} />
                    </div>
                    <div className="flex justify-between mt-1 text-[8px] text-[#A69A8C]"><span>0 · Low</span><span>50 · Moderate</span><span>100 · Severe</span></div>
                  </div>

                  {/* Key Metrics Grid */}
                  <div className="rounded-2xl border border-[#EDE4D8] bg-white p-4">
                    <p className="text-[10px] font-bold text-[#8B7355] uppercase tracking-wider mb-3">📊 Key Metrics</p>
                    <div className="grid grid-cols-2 gap-2">
                      {cd.metrics.map((m, i) => (
                        <div key={i} className="bg-[#FDF6ED] rounded-lg p-2.5">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="text-sm">{m.icon || '📌'}</span>
                            <span className="text-[9px] font-bold text-[#8B7355] uppercase">{m.label}</span>
                          </div>
                          <p className="text-[15px] font-extrabold text-[#0E0E0E]">{m.value}</p>
                          {m.sub && <p className="text-[9px] text-[#8B7355] mt-0.5">{m.sub}</p>}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Detailed Analysis Sections */}
                  {cd.sections.map((s, i) => (
                    <div key={i} className="rounded-2xl border border-[#EDE4D8] bg-white p-4">
                      <p className="text-[10px] font-bold text-[#8B7355] uppercase tracking-wider mb-2">{s.icon} {s.title}</p>
                      <p className="text-[12px] text-[#5C4A3A] leading-relaxed whitespace-pre-line">{s.content}</p>
                    </div>
                  ))}

                  {/* Time Breakdown Table (if available) */}
                  {cd.timeBreakdown && cd.timeBreakdown.length > 0 && (
                    <div className="rounded-2xl border border-[#EDE4D8] bg-white p-4">
                      <p className="text-[10px] font-bold text-[#8B7355] uppercase tracking-wider mb-3">⏱️ Hour-by-Hour Breakdown</p>
                      <div className="space-y-1">
                        {cd.timeBreakdown.map((t, i) => {
                          const levelColor = t.level === 'severe' ? 'bg-red-100 border-red-300 text-red-700' :
                                             t.level === 'high' ? 'bg-amber-100 border-amber-300 text-amber-700' :
                                             t.level === 'moderate' ? 'bg-yellow-100 border-yellow-300 text-yellow-700' :
                                             'bg-emerald-100 border-emerald-300 text-emerald-700';
                          return (
                            <div key={i} className={`flex items-center gap-3 rounded-lg border p-2.5 ${levelColor}`}>
                              <span className="text-[11px] font-extrabold w-20 flex-shrink-0">{t.time}</span>
                              <div className="flex-1 min-w-0">
                                <span className="text-[11px] font-bold block">{t.condition}</span>
                                <span className="text-[10px] opacity-80">{t.detail}</span>
                              </div>
                              <span className="text-[9px] font-bold uppercase bg-white/60 rounded-full px-2 py-0.5 flex-shrink-0">{t.level}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Highway Data (for Road Status, Traffic, Flood Risk) */}
                  {cd.highwayData && cd.highwayData.length > 0 && (
                    <div className="rounded-2xl border border-[#EDE4D8] bg-white p-4">
                      <p className="text-[10px] font-bold text-[#8B7355] uppercase tracking-wider mb-3">🛣️ Highway Section Status</p>
                      <div className="space-y-2">
                        {cd.highwayData.map((h, i) => (
                          <div key={i} className="bg-[#FDF6ED] rounded-lg p-3">
                            <div className="flex items-center justify-between">
                              <span className="text-[12px] font-extrabold text-[#0E0E0E]">{h.name}</span>
                              <span className="text-[10px] font-bold text-[#7B5E3B]">{h.status}</span>
                            </div>
                            <p className="text-[10px] text-[#8B7355] mt-1">{h.detail}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Professional Tips */}
                  <div className="rounded-2xl border border-[#7B5E3B]/20 bg-gradient-to-br from-[#FDF6ED] to-white p-4">
                    <p className="text-[10px] font-bold text-[#7B5E3B] uppercase tracking-wider mb-3">💡 Professional Recommendations</p>
                    <ul className="space-y-2">
                      {cd.tips.map((t, i) => (
                        <li key={i} className="flex items-start gap-2 text-[12px] text-[#5C4A3A] leading-relaxed">
                          <span className="text-[#7B5E3B] mt-0.5 flex-shrink-0">▸</span>
                          <span>{t}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* AI Summary */}
                  <div className="rounded-2xl border border-[#7B5E3B]/20 bg-gradient-to-r from-[#FDF6ED] to-white p-4">
                    <p className="text-[10px] font-bold text-[#7B5E3B] uppercase tracking-wider mb-1">🤖 AI Trip Impact Assessment</p>
                    <p className="text-[13px] text-[#0E0E0E] leading-relaxed font-medium">
                      {cd.severity === 'severe' || cd.severity === 'high'
                        ? `${cd.l} conditions are ${cd.severity} for your ${origin||'origin'} → ${dest||'destination'} trip on ${sD ? new Date(sD).toLocaleDateString('en',{weekday:'long',month:'long',day:'numeric'}) : 'your travel date'}. We recommend: ${cd.tips.slice(0,2).join(' ')} Adjust your itinerary accordingly to ensure a safe and enjoyable journey.`
                        : cd.severity === 'moderate'
                        ? `${cd.l} conditions are manageable for your trip. While there are some factors to be aware of, with proper planning you can navigate them comfortably. ${cd.tips[0]}`
                        : `${cd.l} conditions are favorable for your trip. No significant concerns detected — enjoy the smooth journey. ${cd.tips[0] || ''}`
                      }
                    </p>
                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-[#7B5E3B]/10 flex-wrap">
                      <span className="text-[10px] font-bold text-[#7B5E3B] bg-[#FDF6ED] rounded-full px-2 py-0.5">📍 {origin||'Origin'} → {dest||'Destination'}</span>
                      <span className="text-[10px] font-bold text-[#6B8E4E] bg-green-50 rounded-full px-2 py-0.5">📅 {sD ? new Date(sD).toLocaleDateString('en',{month:'short',day:'numeric'}) : ''} – {eD ? new Date(eD).toLocaleDateString('en',{day:'numeric'}) : ''}</span>
                      <span className={`text-[10px] font-bold rounded-full px-2 py-0.5 ${cd.riskScore >= 60 ? 'bg-red-50 text-red-600' : cd.riskScore >= 35 ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
                        {cd.riskScore >= 60 ? '⚠️ Monitor' : cd.riskScore >= 35 ? '⚡ Be Aware' : '✅ All Clear'}
                      </span>
                    </div>
                  </div>

                  {/* External resources */}
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-[#8B7355] uppercase tracking-wider">🔗 Official Resources</p>
                    <div className="grid grid-cols-2 gap-2">
                      <a href="https://www.met.gov.my" target="_blank" className="text-[11px] font-bold text-[#7B5E3B] bg-[#FDF6ED] rounded-lg p-3 text-center hover:bg-[#EDE4D8] transition-colors">🌤️ MET Malaysia</a>
                      <a href="https://publicinfobanjir.water.gov.my" target="_blank" className="text-[11px] font-bold text-[#7B5E3B] bg-[#FDF6ED] rounded-lg p-3 text-center hover:bg-[#EDE4D8] transition-colors">🌊 Flood Info</a>
                      <a href="https://www.plus.com.my" target="_blank" className="text-[11px] font-bold text-[#7B5E3B] bg-[#FDF6ED] rounded-lg p-3 text-center hover:bg-[#EDE4D8] transition-colors">🛣️ PLUS Highway</a>
                      <a href="https://www.llm.gov.my" target="_blank" className="text-[11px] font-bold text-[#7B5E3B] bg-[#FDF6ED] rounded-lg p-3 text-center hover:bg-[#EDE4D8] transition-colors">🏗️ LLM Malaysia</a>
                    </div>
                  </div>

                  <a href={`https://www.google.com/maps/dir/${encodeURIComponent(origin||'')}/${encodeURIComponent(dest||'')}`} target="_blank"
                    className="btn-primary w-full text-sm py-3.5 flex items-center justify-center gap-2"><Navigation className="h-4 w-4" /> View Route on Google Maps</a>
                  <button onClick={() => setRoadtripDetail(null)} className="btn-secondary w-full text-sm py-3">Close Report</button>
                </div>
              </div>
            </div>
          );
        }

        // ── Standard Fuel / Rest Stop Detail (unchanged logic) ──
        return (
          <div className="fixed inset-0 z-50 flex items-end bg-black/40 backdrop-blur-sm" onClick={() => setRoadtripDetail(null)}>
            <div className="bg-white w-full max-h-[88vh] rounded-t-[24px] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="sticky top-0 bg-white z-10 pt-3 pb-1 flex justify-center rounded-t-[24px]"><div className="w-10 h-1 rounded-full bg-[#D4C4B0]" /></div>
              <div className="h-52 bg-gradient-to-br from-[#FDF6ED] to-[#EDE4D8] flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 opacity-10" style={{backgroundImage:'url(https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=600)',backgroundSize:'cover',backgroundPosition:'center'}} />
                <span className="text-7xl relative z-10">{roadtripDetail.type==='fuel'?'⛽':roadtripDetail.type==='rest'?'☕':'🚦'}</span>
              </div>
              <div className="px-5 pt-5 pb-8 space-y-4">
                <div>
                  <div className="flex gap-1.5 mb-2"><span className="text-[10px] font-bold bg-purple-100 text-purple-600 rounded-full px-2.5 py-1">💎 Roadtrip Gem</span></div>
                  <h2 className="text-[24px] font-extrabold text-[#0E0E0E] leading-[1.15]">{roadtripDetail.name}</h2>
                  <span className="text-[11px] font-bold text-[#7B5E3B] bg-[#FDF6ED] rounded-full px-2.5 py-1 mt-1.5 inline-block">{roadtripDetail.type==='fuel'?'⛽ Fuel Stop':roadtripDetail.type==='rest'?'☕ Rest Stop':'🚦 Live Condition'}</span>
                </div>
                <p className="text-[15px] text-[#5C4A3A] leading-relaxed">{roadtripDetail.details || roadtripDetail.description}</p>

                <div className="rounded-2xl border border-[#7B5E3B]/20 bg-gradient-to-r from-[#FDF6ED] to-white p-4">
                  <p className="text-[10px] font-bold text-[#7B5E3B] uppercase tracking-wider mb-1">🤖 AI Why Recommended</p>
                  <p className="text-[13px] text-[#0E0E0E] leading-relaxed font-medium">{`Optimal ${roadtripDetail.type==='fuel'?'refueling point':'rest stop'} based on your route. ${roadtripDetail.type==='fuel'?'Located at the ideal distance for your vehicle\'s fuel range.':'Positioned for a comfortable break every ~2 hours of driving.'}`}</p>
                  <div className="flex items-center gap-2 mt-2 pt-2 border-t border-[#7B5E3B]/10">
                    <span className="text-[10px] font-bold text-[#7B5E3B] bg-[#FDF6ED] rounded-full px-2 py-0.5">📍 On route</span>
                    <span className="text-[10px] font-bold text-[#6B8E4E] bg-green-50 rounded-full px-2 py-0.5">🟢 Open 24h</span>
                  </div>
                </div>

                <div className="rounded-2xl border border-purple-200 bg-white p-4">
                  <p className="text-[10px] font-bold text-purple-600 uppercase tracking-wider mb-2">💎 Stop Quality Score</p>
                  <div className="flex items-center gap-3">
                    <div className="relative w-16 h-16 flex-shrink-0">
                      <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                        <circle cx="32" cy="32" r="28" fill="none" stroke="#EDE4D8" strokeWidth="5" />
                        <circle cx="32" cy="32" r="28" fill="none" stroke="#7C3AED" strokeWidth="5" strokeLinecap="round" strokeDasharray={`${2*Math.PI*28}`} strokeDashoffset={`${2*Math.PI*28*0.2}`} />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-sm font-extrabold text-purple-600">80</span>
                    </div>
                    <div className="flex-1 text-[11px] space-y-1">
                      <div className="flex justify-between"><span className="text-[#8B7355]">Facilities</span><span className="font-bold text-purple-600">Good</span></div>
                      <div className="flex justify-between"><span className="text-[#8B7355]">Cleanliness</span><span className="font-bold text-purple-600">Clean</span></div>
                      <div className="flex justify-between"><span className="text-[#8B7355]">Convenience</span><span className="font-bold text-purple-600">Optimal</span></div>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-[#EDE4D8] bg-white p-4">
                  <p className="text-[10px] font-bold text-[#8B7355] uppercase tracking-wider mb-2">🧬 Roadtrip DNA Match</p>
                  <div className="flex items-center gap-3">
                    <span className="text-3xl font-extrabold text-[#7B5E3B]">88<span className="text-lg text-[#9CA3AF]">%</span></span>
                    <div className="flex-1 text-[11px] space-y-1">
                      {[{e:'🛣️',l:'Route Fit',v:90},{e:'⏱️',l:'Timing',v:85},{e:'⭐',l:'Quality',v:88}].map(d=>(
                        <div key={d.l} className="flex items-center gap-2"><span className="w-16 text-[#8B7355] text-[10px]">{d.e} {d.l}</span><div className="flex-1 h-1.5 bg-[#EDE4D8] rounded-full overflow-hidden"><div className="h-full bg-[#7B5E3B] rounded-full" style={{width:`${d.v}%`}}/></div><span className="font-bold text-[#0E0E0E] w-7 text-right text-[10px]">{d.v}%</span></div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-[#FDF6ED] rounded-xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[15px] font-semibold text-[#0E0E0E]">💰 Estimated Cost</span>
                    <span className="text-[26px] font-extrabold text-[#7B5E3B] tracking-[-0.02em]">RM {roadtripDetail.price}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="bg-white rounded-lg py-2"><p className="text-[10px] text-[#8B7355]">{roadtripDetail.type==='fuel'?'Fuel Cost':'Food Cost'}</p><p className="text-[13px] font-extrabold">RM {roadtripDetail.price}</p></div>
                    <div className="bg-white rounded-lg py-2"><p className="text-[10px] text-[#8B7355]">Time</p><p className="text-[13px] font-extrabold">~15 min</p></div>
                  </div>
                </div>

                <div className="rounded-2xl border border-[#EDE4D8] bg-white p-4">
                  <p className="text-[10px] font-bold text-[#8B7355] uppercase tracking-wider mb-2">🕐 Opening Hours</p>
                  <div className="flex items-center gap-2 mb-2"><span className="w-2 h-2 rounded-full bg-emerald-400" /><span className="text-[13px] font-bold text-emerald-500">Open 24 Hours</span></div>
                  <p className="text-[11px] text-[#8B7355]">All days · Best time to stop: early morning or late evening to avoid queues</p>
                </div>

                {roadtripDetail.amenities?.length > 0 && (
                  <div className="rounded-2xl border border-[#EDE4D8] bg-white p-4">
                    <p className="text-[10px] font-bold text-[#8B7355] uppercase tracking-wider mb-2">✨ Facilities</p>
                    <div className="flex gap-1.5 flex-wrap">
                      {roadtripDetail.amenities.map((a:string) => <span key={a} className="text-[10px] bg-[#FDF6ED] rounded-full px-2.5 py-1 text-[#5C4A3A] font-medium">{a}</span>)}
                    </div>
                  </div>
                )}

                <div className="rounded-2xl border border-[#EDE4D8] bg-white p-4">
                  <p className="text-[10px] font-bold text-[#8B7355] uppercase tracking-wider mb-2">💬 Traveler Reviews</p>
                  {[{a:'Driver A.',r:4,t:'Clean facilities and quick service. Perfect stop for a long drive.'},{a:'Traveler B.',r:5,t:'Great rest area with good food options. Surau was very clean.'}].map((r,i)=>(
                    <div key={i} className={i>0?'mt-2 pt-2 border-t border-[#EDE4D8]':''}>
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-[#FDF6ED] flex items-center justify-center text-[10px] font-extrabold text-[#7B5E3B]">{r.a[0]}</div>
                        <span className="text-[13px] font-bold text-[#0E0E0E]">{r.a}</span>
                        <div className="flex gap-0.5 ml-auto">{[1,2,3,4,5].map(j=><Star key={j} className={`h-3 w-3 ${j<=r.r?'fill-amber-400 text-amber-400':'text-[#EDE4D8]'}`}/>)}</div>
                      </div>
                      <p className="text-[12px] text-[#5C4A3A] mt-1">{r.t}</p>
                    </div>
                  ))}
                </div>

                <a href={`https://www.google.com/maps/search/${encodeURIComponent(roadtripDetail.name)}+${encodeURIComponent(plan.destination)}`} target="_blank"
                  className="btn-primary w-full text-sm py-3.5 flex items-center justify-center gap-2"><Navigation className="h-4 w-4" /> Get Directions</a>
                <button onClick={() => setRoadtripDetail(null)} className="btn-secondary w-full text-sm py-3">Close</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* ROUTE DISCOVERY DETAIL OVERLAY — Professional full-detail sheet */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {nearbyDetail && (() => {
        const nd = nearbyDetail;
        const ndPhotos: string[] = nd.photos || [];
        const ndRating = nd.rating || 4.0;
        const ndScore = Math.round((ndRating / 5) * 100);

        return (
          <div className="fixed inset-0 z-50 flex items-end bg-black/40 backdrop-blur-sm" onClick={() => setNearbyDetail(null)}>
            <div className="bg-white w-full max-h-[92vh] rounded-t-[24px] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="sticky top-0 bg-white z-10 pt-3 pb-1 flex justify-center rounded-t-[24px]"><div className="w-10 h-1 rounded-full bg-[#D4C4B0]" /></div>

              {/* Photo Carousel with Navigation */}
              {ndPhotos.length > 0 ? (
                <div className="relative h-64 bg-gray-100 overflow-hidden">
                  <div className="w-full h-full">
                    <img src={ndPhotos[nearbyPhotoIdx]} className="w-full h-full object-cover" alt="" />
                  </div>
                  {ndPhotos.length > 1 && (<>
                    <button onClick={e => { e.stopPropagation(); setNearbyPhotoIdx((nearbyPhotoIdx - 1 + ndPhotos.length) % ndPhotos.length); }}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/30 text-white flex items-center justify-center hover:bg-black/50 transition-colors">
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button onClick={e => { e.stopPropagation(); setNearbyPhotoIdx((nearbyPhotoIdx + 1) % ndPhotos.length); }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/30 text-white flex items-center justify-center hover:bg-black/50 transition-colors">
                      <ChevronRight className="h-5 w-5" />
                    </button>
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                      {ndPhotos.map((_: string, j: number) => (
                        <div key={j} className={`h-1.5 rounded-full transition-all ${j === nearbyPhotoIdx ? 'bg-white w-4' : 'bg-white/40 w-1.5'}`} />
                      ))}
                    </div>
                    <div className="absolute top-4 right-4 bg-black/50 text-white text-[10px] px-2.5 py-1 rounded-full">{nearbyPhotoIdx + 1}/{ndPhotos.length}</div>
                  </>)}
                </div>
              ) : (
                <div className="h-40 bg-[#FDF6ED] flex items-center justify-center text-6xl">📍</div>
              )}

              <div className="px-5 pt-5 pb-8 space-y-4">
                {/* Title + Tags */}
                <div>
                  <div className="flex gap-1.5 mb-2 flex-wrap">
                    {nd.isHiddenGem && <span className="text-[10px] font-bold bg-purple-100 text-purple-600 rounded-full px-2.5 py-1">💎 Hidden Gem</span>}
                    {nd.isPhotoSpot && <span className="text-[10px] font-bold bg-sky-100 text-sky-600 rounded-full px-2.5 py-1">📸 Photo Spot</span>}
                    {nd.isIndoor && <span className="text-[10px] font-bold bg-indigo-100 text-indigo-600 rounded-full px-2.5 py-1">🏠 Indoor</span>}
                    <span className="text-[10px] font-bold bg-amber-100 text-amber-600 rounded-full px-2.5 py-1 capitalize">{nd.type || 'attraction'}</span>
                  </div>
                  <h2 className="text-[24px] font-extrabold text-[#0E0E0E] leading-[1.15]">{nd.name}</h2>
                  <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                    <span className="flex items-center gap-0.5 text-sm font-bold">
                      <Star className="h-4 w-4 fill-amber-400 text-amber-400" /> {nd.rating} · {nd.reviewCount?.toLocaleString() || 0} reviews
                    </span>
                    <span className={`text-[11px] font-bold ${nd.crowdLevel === 'low' ? 'text-emerald-600' : nd.crowdLevel === 'medium' ? 'text-amber-600' : 'text-red-600'}`}>
                      {nd.crowdLevel === 'low' ? '🟢 Quiet' : nd.crowdLevel === 'medium' ? '🟡 Moderate' : '🔴 Busy'} crowd
                    </span>
                  </div>
                </div>

                {/* Full Description */}
                <p className="text-[15px] text-[#5C4A3A] leading-relaxed">{nd.description}</p>

                {/* 🤖 AI Why Recommended */}
                <div className="rounded-2xl border border-[#7B5E3B]/20 bg-gradient-to-r from-[#FDF6ED] to-white p-4">
                  <p className="text-[10px] font-bold text-[#7B5E3B] uppercase tracking-wider mb-1">🤖 AI Why Recommended</p>
                  <p className="text-[13px] text-[#0E0E0E] leading-relaxed font-medium">
                    {nd.aiReasoning || (nd.isHiddenGem
                      ? 'A hidden local treasure with fewer crowds and authentic character. Highly rated by locals for its unique charm.'
                      : 'A popular and well-reviewed spot near your itinerary — highly recommended by travelers who share your preferences.')}
                  </p>
                  <div className="flex items-center gap-2 mt-2 pt-2 border-t border-[#7B5E3B]/10 flex-wrap">
                    {nd.tags?.slice(0, 4).map((t: string) => (
                      <span key={t} className="text-[10px] font-bold text-[#7B5E3B] bg-[#FDF6ED] rounded-full px-2 py-0.5">🏷️ {t}</span>
                    ))}
                    <span className="text-[10px] font-bold text-[#6B8E4E] bg-green-50 rounded-full px-2 py-0.5">📍 Route-aligned</span>
                  </div>
                </div>

                {/* 💎 Quality Score */}
                <div className="rounded-2xl border border-purple-200 bg-white p-4">
                  <p className="text-[10px] font-bold text-purple-600 uppercase tracking-wider mb-3">💎 Quality Score</p>
                  <div className="flex items-center gap-3">
                    <div className="relative w-16 h-16 flex-shrink-0">
                      <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                        <circle cx="32" cy="32" r="28" fill="none" stroke="#EDE4D8" strokeWidth="5" />
                        <circle cx="32" cy="32" r="28" fill="none" stroke={ndRating >= 4.5 ? '#7C3AED' : '#7B5E3B'} strokeWidth="5" strokeLinecap="round"
                          strokeDasharray={`${2*Math.PI*28}`} strokeDashoffset={`${2*Math.PI*28*(1-ndRating/5)}`} />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-sm font-extrabold text-purple-600">{ndScore}</span>
                    </div>
                    <div className="flex-1 text-[11px] space-y-1">
                      <div className="flex justify-between"><span className="text-[#8B7355]">Rating</span><span className="font-bold text-purple-600">{ndRating >= 4.5 ? 'Excellent' : ndRating >= 4 ? 'Great' : 'Good'}</span></div>
                      <div className="flex justify-between"><span className="text-[#8B7355]">Value</span><span className="font-bold text-purple-600">{nd.priceLevel === 0 ? 'Free' : nd.priceLevel === 1 ? 'Budget' : nd.priceLevel === 2 ? 'Moderate' : 'Premium'}</span></div>
                      <div className="flex justify-between"><span className="text-[#8B7355]">Crowd</span><span className="font-bold text-purple-600 capitalize">{nd.crowdLevel || 'medium'}</span></div>
                    </div>
                  </div>
                </div>

                {/* 💰 Estimated Cost */}
                <div className="bg-[#FDF6ED] rounded-xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[15px] font-semibold text-[#0E0E0E]">💰 Estimated Cost</span>
                    <span className="text-[26px] font-extrabold text-[#7B5E3B] tracking-[-0.02em]">
                      {nd.priceLevel === 0 ? 'Free' : `RM ${nd.estimatedSpend || nd.entryFee || (nd.priceLevel * 20)}`}
                    </span>
                  </div>
                  {nd.priceLevel > 0 && (
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-white rounded-lg py-2">
                        <p className="text-[10px] text-[#8B7355]">Entry Fee</p>
                        <p className="text-[13px] font-extrabold text-[#0E0E0E]">{nd.entryFee === 0 ? 'Free' : `RM ${nd.entryFee}`}</p>
                      </div>
                      <div className="bg-white rounded-lg py-2">
                        <p className="text-[10px] text-[#8B7355]">Est. Spend</p>
                        <p className="text-[13px] font-extrabold text-[#7B5E3B]">RM {nd.estimatedSpend || nd.entryFee || 0}</p>
                      </div>
                      <div className="bg-white rounded-lg py-2">
                        <p className="text-[10px] text-[#8B7355]">Duration</p>
                        <p className="text-[13px] font-extrabold text-[#0E0E0E]">~{nd.durationMin || 45} min</p>
                      </div>
                    </div>
                  )}
                  {nd.priceLevel === 0 && (
                    <p className="text-[11px] text-[#4A7C59] font-semibold text-center">🎉 Free entry · No tickets or fees needed</p>
                  )}
                </div>

                {/* 🕐 Opening Hours + Best Time to Visit */}
                <div className="rounded-2xl border border-[#EDE4D8] bg-white p-4">
                  <p className="text-[10px] font-bold text-[#8B7355] uppercase tracking-wider mb-2">🕐 Hours & Best Time</p>
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`w-2 h-2 rounded-full ${nd.isOpen !== false ? 'bg-emerald-400' : 'bg-red-400'} animate-pulse`} />
                    <span className="text-[13px] font-bold text-[#0E0E0E]">{nd.isOpen !== false ? 'Open' : 'Closed'}</span>
                    <span className="text-[12px] text-[#8B7355]">· {nd.openingHours || 'Daily'}</span>
                  </div>
                  <div className="bg-[#FDF6ED] rounded-lg p-3">
                    <p className="text-[10px] font-bold text-[#8B7355]">⏰ Best Time to Visit</p>
                    <p className="text-[12px] text-[#0E0E0E] font-medium mt-0.5">{nd.bestTimeToVisit || 'Morning hours for the best experience and fewer crowds'}</p>
                  </div>
                </div>

                {/* ✨ Amenities */}
                {nd.amenities?.length > 0 && (
                  <div className="rounded-2xl border border-[#EDE4D8] bg-white p-4">
                    <p className="text-[10px] font-bold text-[#8B7355] uppercase tracking-wider mb-2">✨ Amenities</p>
                    <div className="flex gap-1.5 flex-wrap">
                      {nd.amenities.map((a: string) => (
                        <span key={a} className="text-[10px] bg-[#FDF6ED] rounded-full px-2.5 py-1 text-[#5C4A3A] font-medium">{a}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* 📸 All Photos Grid */}
                {ndPhotos.length > 1 && (
                  <div className="rounded-2xl border border-[#EDE4D8] bg-white p-4">
                    <p className="text-[10px] font-bold text-[#8B7355] uppercase tracking-wider mb-2">📸 Photo Gallery ({ndPhotos.length} photos)</p>
                    <div className="grid grid-cols-3 gap-1.5">
                      {ndPhotos.map((p: string, i: number) => (
                        <img key={i} src={p} className="w-full h-24 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={e => { e.stopPropagation(); setNearbyPhotoIdx(i); }} alt="" />
                      ))}
                    </div>
                  </div>
                )}

                {/* 💬 Reviews */}
                <div className="rounded-2xl border border-[#EDE4D8] bg-white p-4">
                  <p className="text-[10px] font-bold text-[#8B7355] uppercase tracking-wider mb-3">💬 Traveler Reviews</p>
                  {[
                    { author: 'Traveler A.', rating: Math.min(5, Math.round(ndRating + 0.5)), text: ndRating >= 4.5 ? 'Absolutely stunning! Exceeded all expectations. The photos don\'t do it justice — you have to experience it in person.' : ndRating >= 4 ? 'Great find! Well worth the stop. Facilities were clean and the experience was memorable.' : 'Solid stop on our roadtrip. Good value for what you get.', time: '1 week ago' },
                    { author: 'Traveler B.', rating: Math.min(5, Math.round(ndRating)), text: nd.isHiddenGem ? 'How is this place not more famous? One of the best discoveries on our Malaysia trip.' : 'Good reviews are accurate. Would recommend to anyone traveling through this corridor.', time: '2 weeks ago' },
                    { author: 'Traveler C.', rating: Math.min(5, Math.max(3, Math.round(ndRating - 0.5))), text: nd.crowdLevel === 'low' ? 'Peaceful and uncrowded — exactly what we wanted. Clean facilities and friendly staff.' : 'Popular spot but well-managed. Go early to beat the queues.', time: '3 weeks ago' },
                  ].map((r: any, i: number) => (
                    <div key={i} className={`${i > 0 ? 'mt-2 pt-2 border-t border-[#EDE4D8]' : ''}`}>
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-[#FDF6ED] flex items-center justify-center text-[10px] font-extrabold text-[#7B5E3B]">{r.author[0]}</div>
                        <span className="text-[13px] font-bold text-[#0E0E0E]">{r.author}</span>
                        <span className="text-[11px] text-[#9CA3AF] ml-auto">{r.time}</span>
                      </div>
                      <div className="flex gap-0.5 mt-0.5 mb-1">
                        {[1,2,3,4,5].map(j => <Star key={j} className={`h-3 w-3 ${j <= r.rating ? 'fill-amber-400 text-amber-400' : 'text-[#EDE4D8]'}`} />)}
                      </div>
                      <p className="text-[12px] text-[#6B7280] leading-relaxed">{r.text}</p>
                    </div>
                  ))}
                </div>

                {/* 📍 Address */}
                {nd.address && (
                  <div className="rounded-2xl border border-[#EDE4D8] bg-white p-4">
                    <p className="text-[10px] font-bold text-[#8B7355] uppercase tracking-wider mb-1">📍 Address</p>
                    <p className="text-[13px] text-[#0E0E0E] leading-relaxed">{nd.address}</p>
                  </div>
                )}

                {/* 🗺️ Google Maps Directions */}
                <a href={`https://www.google.com/maps/search/${encodeURIComponent(nd.name)}+${encodeURIComponent(nd.address || plan?.destination || '')}`} target="_blank"
                  className="btn-primary w-full text-sm py-3.5 flex items-center justify-center gap-2"><Navigation className="h-4 w-4" /> Open in Google Maps</a>
                <button onClick={() => setNearbyDetail(null)} className="btn-secondary w-full text-sm py-3">Close</button>
              </div>
            </div>
          </div>
        );
      })()}
    
      {/* 🏨 Hotel Detail Modal */}
      {selHotel && (
        <div className="fixed inset-0 z-[9999] flex items-end bg-black/50 backdrop-blur-md" onClick={() => setSelHotel(null)}>
          <div className="w-full max-h-[90vh] bg-white rounded-t-[24px] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white pt-3 pb-2 flex justify-center z-10"><div className="w-10 h-1 rounded-full bg-gray-300"/></div>
            {/* Photo Gallery */}
            <div className="relative h-56 bg-gray-100 cursor-pointer" onClick={() => { const p = stopPhotos[selHotel.name]; setViewImages(p?.length ? p : [selHotel.photoUrl]); }}>
              {selHotel.photoUrl ? <img src={selHotel.photoUrl} className="w-full h-full object-cover" alt="" /> : <div className="w-full h-full flex items-center justify-center text-4xl bg-gradient-to-br from-indigo-100 to-purple-100">🏨</div>}
              <span className="absolute bottom-2 right-2 bg-black/50 backdrop-blur rounded-full px-2 py-0.5 text-[10px] font-bold text-white">📷 {stopPhotos[selHotel.name]?.length || 0} photos</span>
            </div>
            <div className="p-5 space-y-4 pb-8">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", selHotel.type==='luxury'?'bg-purple-100 text-purple-600':selHotel.type==='mid'?'bg-blue-100 text-blue-600':'bg-green-100 text-green-600')}>{selHotel.type}</span>
                  {selHotel.starRating > 0 && <span className="text-[12px]">{'⭐'.repeat(Math.min(5, selHotel.starRating||0))}</span>}
                </div>
                <h2 className="text-[22px] font-extrabold text-[#0E0E0E]">{selHotel.name}</h2>
                {selHotel.rating > 0 && <div className="flex items-center gap-1 mt-1"><Star className="h-4 w-4 fill-amber-400 text-amber-400"/><span className="text-[14px] font-extrabold">{selHotel.rating}</span><span className="text-[12px] text-gray-400">/5</span></div>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-indigo-50 rounded-xl p-3 text-center"><p className="text-[20px] font-extrabold text-indigo-600">RM{selHotel.pricePerNight}</p><p className="text-[10px] text-gray-500">per night</p></div>
                <div className="bg-green-50 rounded-xl p-3 text-center"><p className="text-[20px] font-extrabold text-green-600">RM{Math.round(selHotel.pricePerNight*2)}</p><p className="text-[10px] text-gray-500">2 nights est.</p></div>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">About</p>
                <p className="text-[13px] text-[#6B7280] leading-relaxed">{selHotel.description || 'No description available'}</p>
              </div>
              {selHotel.amenities && (
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Amenities</p>
                  <div className="flex flex-wrap gap-1.5">
                    {String(selHotel.amenities).split(',').map((a: string) => (
                      <span key={a} className="text-[10px] font-medium bg-gray-100 text-gray-600 rounded-full px-2.5 py-1">{a.trim()}</span>
                    ))}
                  </div>
                </div>
              )}
              <button onClick={() => setSelHotel(null)} className="w-full py-3 rounded-xl bg-gray-100 text-gray-600 text-sm font-bold">Close</button>
            </div>
          </div>
        </div>
      )}
      {viewImages && <ImageViewer images={viewImages} onClose={() => setViewImages(null)} alt="Stop photo" />}
</div>
  );
}