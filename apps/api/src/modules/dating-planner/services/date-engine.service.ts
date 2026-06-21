import { Injectable } from '@nestjs/common';

// =============================================================================
// REAL MALAYSIAN DATING VENUE DATABASE
// =============================================================================

export interface DatingVenue {
  name: string; type: string; category: string; city: string;
  lat: number; lng: number; rating: number; priceLevel: number;
  estimatedSpend: number; durationMin: number;
  description: string; bestTime: string; isIndoor: boolean;
  isPhotoSpot: boolean; romanceScore: number; conversationScore: number;
  tags: string[];
}

const MALAYSIAN_DATING_VENUES: Record<string, DatingVenue[]> = {
  'Kuala Lumpur': [
    {name:'Marini\'s on 57',type:'ROMANTIC',category:'Fine Dining',city:'Kuala Lumpur',lat:3.1578,lng:101.7130,rating:4.5,priceLevel:4,estimatedSpend:300,durationMin:120,description:'KL\'s most iconic rooftop bar on the 57th floor — panoramic Twin Towers views, Italian fine dining, and the most romantic sunset spot in the city. The whisky bar has 1000+ labels.',bestTime:'6PM–late; sunset at 7:15PM',isIndoor:true,isPhotoSpot:true,romanceScore:98,conversationScore:85,tags:['Rooftop','Fine Dining','Sunset','Luxury','Twin Towers View']},
    {name:'Heli Lounge Bar',type:'ROMANTIC',category:'Rooftop Bar',city:'Kuala Lumpur',lat:3.1495,lng:101.7079,rating:4.4,priceLevel:2,estimatedSpend:120,durationMin:90,description:'An actual helicopter pad turned into a bar at sunset — 360° open-air views of KL skyline. No railings, no windows, just the city at your feet. The most unique date spot in KL.',bestTime:'5:30PM–8PM for sunset; helipad opens 6PM',isIndoor:false,isPhotoSpot:true,romanceScore:95,conversationScore:75,tags:['Helipad','Sunset','360° View','Unique','Casual Drinks']},
    {name:'Tamaru KL',type:'ROMANTIC',category:'Steakhouse',city:'Kuala Lumpur',lat:3.1620,lng:101.7140,rating:4.7,priceLevel:4,estimatedSpend:400,durationMin:120,description:'Malaysia\'s best steakhouse — dry-aged Japanese wagyu in an intimate, dimly-lit setting with impeccable service. The 7-course tasting menu is designed for special occasions.',bestTime:'7PM–10PM',isIndoor:true,isPhotoSpot:false,romanceScore:96,conversationScore:90,tags:['Fine Dining','Wagyu','Intimate','Special Occasion','Tasting Menu']},
    {name:'Botanica + Co',type:'CAFE',category:'Cafe',city:'Kuala Lumpur',lat:3.1535,lng:101.7185,rating:4.3,priceLevel:2,estimatedSpend:80,durationMin:75,description:'A lush greenhouse-style cafe in Bangsar South — surrounded by floor-to-ceiling plants, natural light, and the aroma of specialty coffee. Perfect for a relaxed afternoon date.',bestTime:'11AM–3PM for brunch',isIndoor:true,isPhotoSpot:true,romanceScore:70,conversationScore:88,tags:['Cafe','Greenhouse','Brunch','Plant-filled','Relaxed']},
    {name:'Perdana Botanical Garden',type:'NATURE',category:'Park',city:'Kuala Lumpur',lat:3.1430,lng:101.6850,rating:4.4,priceLevel:0,estimatedSpend:10,durationMin:120,description:'KL\'s largest and most beautiful park — 91 hectares of manicured gardens, lakes, and walking paths. The hibiscus garden, deer park, and boating lake are perfect date activities. Free entry.',bestTime:'7AM–10AM or 4PM–6PM',isIndoor:false,isPhotoSpot:true,romanceScore:78,conversationScore:80,tags:['Park','Nature','Free','Walking','Photography','Lake']},
    {name:'TREC Kuala Lumpur',type:'NIGHTLIFE',category:'Entertainment District',city:'Kuala Lumpur',lat:3.1440,lng:101.7120,rating:4.3,priceLevel:2,estimatedSpend:150,durationMin:180,description:'KL\'s largest entertainment district — 20+ bars, clubs, and live music venues in one walkable compound. From cocktail speakeasies to EDM clubs, every vibe is covered.',bestTime:'8PM–late',isIndoor:true,isPhotoSpot:false,romanceScore:55,conversationScore:60,tags:['Nightlife','Bars','Clubs','Live Music','District']},
    {name:'Aquaria KLCC',type:'ADVENTURE',category:'Aquarium',city:'Kuala Lumpur',lat:3.1535,lng:101.7135,rating:4.4,priceLevel:2,estimatedSpend:100,durationMin:90,description:'Walk through a 90-meter underwater tunnel surrounded by sharks, rays, and 5000+ marine creatures. The oceanarium is mesmerizing and conversation-sparking — great for early dates.',bestTime:'10AM–12PM weekdays',isIndoor:true,isPhotoSpot:true,romanceScore:68,conversationScore:85,tags:['Aquarium','Indoor','Tunnel','Interactive','Photo-worthy']},
    {name:'Jalan Alor Night Market',type:'FOOD_HUNT',category:'Street Food',city:'Kuala Lumpur',lat:3.1466,lng:101.7084,rating:4.5,priceLevel:1,estimatedSpend:50,durationMin:90,description:'KL\'s most famous food street — sizzling woks, charcoal-grilled satay, fresh seafood on ice. The energy is electric, the food is authentic, and sharing dishes is inherently romantic.',bestTime:'6PM–11PM',isIndoor:false,isPhotoSpot:true,romanceScore:65,conversationScore:75,tags:['Street Food','Night Market','Authentic','Lively','Food Hunt']},
    {name:'Vertigo @ Banyan Tree',type:'ROMANTIC',category:'Rooftop Bar',city:'Kuala Lumpur',lat:3.1485,lng:101.7135,rating:4.7,priceLevel:4,estimatedSpend:250,durationMin:120,description:'Highest rooftop in KL on 59th floor with 360 skyline views. Sophisticated cocktails and glamorous atmosphere.',bestTime:'5PM-late',isIndoor:false,isPhotoSpot:true,romanceScore:97,conversationScore:82,tags:['Rooftop','Luxury','360 View']},
    {name:'SkyBar @ Traders',type:'ROMANTIC',category:'Rooftop Bar',city:'Kuala Lumpur',lat:3.1570,lng:101.7135,rating:4.5,priceLevel:3,estimatedSpend:180,durationMin:90,description:'Iconic poolside bar with direct Twin Towers view. Swim-up bar and DJ sets.',bestTime:'5PM-10PM',isIndoor:false,isPhotoSpot:true,romanceScore:93,conversationScore:78,tags:['Rooftop','Pool','Twin Towers']},
    {name:'Fuego @ Troika',type:'ROMANTIC',category:'Restaurant',city:'Kuala Lumpur',lat:3.1605,lng:101.7160,rating:4.6,priceLevel:3,estimatedSpend:200,durationMin:120,description:'South American grill with flamingo sunsets. Shareable plates and lively Latin atmosphere.',bestTime:'6PM-9PM',isIndoor:false,isPhotoSpot:true,romanceScore:91,conversationScore:80,tags:['Rooftop','Latin','Sunset']},
    {name:'Bijan Bar & Restaurant',type:'ROMANTIC',category:'Restaurant',city:'Kuala Lumpur',lat:3.1490,lng:101.7100,rating:4.5,priceLevel:2,estimatedSpend:120,durationMin:90,description:'Award-winning modern Malay fine dining in a lush garden setting. Candlelit tables.',bestTime:'7PM-10PM',isIndoor:true,isPhotoSpot:false,romanceScore:94,conversationScore:88,tags:['Fine Dining','Malay','Garden']},
    {name:'Tamarind Springs',type:'ROMANTIC',category:'Restaurant',city:'Kuala Lumpur',lat:3.1600,lng:101.7500,rating:4.6,priceLevel:3,estimatedSpend:220,durationMin:120,description:'Hidden jungle restaurant with Indochinese cuisine, waterfalls, and candlelight. Ultimate hidden gem.',bestTime:'6PM-9PM',isIndoor:false,isPhotoSpot:true,romanceScore:98,conversationScore:85,tags:['Hidden','Jungle','Fine Dining']},
    {name:'Mantra Rooftop',type:'ROMANTIC',category:'Rooftop Bar',city:'Kuala Lumpur',lat:3.1510,lng:101.7080,rating:4.4,priceLevel:3,estimatedSpend:150,durationMin:90,description:'Intimate rooftop with 270 views and creative cocktails. Less touristy.',bestTime:'6PM-11PM',isIndoor:false,isPhotoSpot:true,romanceScore:88,conversationScore:82,tags:['Rooftop','Hidden','Intimate']},
    {name:'Joloko',type:'ROMANTIC',category:'Restaurant',city:'Kuala Lumpur',lat:3.1520,lng:101.7040,rating:4.7,priceLevel:2,estimatedSpend:100,durationMin:90,description:'Afro-Caribbean with tropical vibes and vibrant murals. Unique and fun for adventurous couples.',bestTime:'7PM-10PM',isIndoor:true,isPhotoSpot:true,romanceScore:82,conversationScore:85,tags:['Unique','Tropical','Fun']},
    {name:'Pahit',type:'NIGHTLIFE',category:'Speakeasy',city:'Kuala Lumpur',lat:3.1470,lng:101.7060,rating:4.5,priceLevel:2,estimatedSpend:80,durationMin:60,description:'Hidden gin bar behind an unmarked door. Intimate, dimly lit, best gin selection in KL.',bestTime:'8PM-12AM',isIndoor:true,isPhotoSpot:false,romanceScore:85,conversationScore:90,tags:['Speakeasy','Hidden','Gin']},
    {name:'Three X Co',type:'NIGHTLIFE',category:'Speakeasy',city:'Kuala Lumpur',lat:3.1475,lng:101.7065,rating:4.6,priceLevel:2,estimatedSpend:90,durationMin:60,description:'Award-winning speakeasy with impeccable classic cocktails. Dark wood, jazz, pure sophistication.',bestTime:'8PM-12AM',isIndoor:true,isPhotoSpot:false,romanceScore:87,conversationScore:92,tags:['Speakeasy','Cocktails','Jazz']},
    {name:'VCR Coffee',type:'CAFE',category:'Cafe',city:'Kuala Lumpur',lat:3.1478,lng:101.7095,rating:4.4,priceLevel:1,estimatedSpend:50,durationMin:60,description:'Heritage shophouse with industrial-chic vibes. Excellent brunch and rooftop garden.',bestTime:'10AM-3PM',isIndoor:true,isPhotoSpot:true,romanceScore:72,conversationScore:85,tags:['Cafe','Brunch','Heritage']},
    {name:'Piu Piu Piu',type:'CAFE',category:'Cafe',city:'Kuala Lumpur',lat:3.1450,lng:101.7030,rating:4.3,priceLevel:1,estimatedSpend:40,durationMin:45,description:'Hole-in-the-wall specialty coffee with a cult following. Tiny, charming, perfect low-key date.',bestTime:'9AM-5PM',isIndoor:true,isPhotoSpot:false,romanceScore:65,conversationScore:88,tags:['Cafe','Hidden','Coffee']},
    {name:'Feeka Coffee Roasters',type:'CAFE',category:'Cafe',city:'Kuala Lumpur',lat:3.1485,lng:101.7080,rating:4.3,priceLevel:1,estimatedSpend:45,durationMin:60,description:'Charming courtyard cafe with dappled sunlight. Perfect for lazy afternoon dates.',bestTime:'11AM-3PM',isIndoor:false,isPhotoSpot:true,romanceScore:70,conversationScore:83,tags:['Cafe','Courtyard','Garden']},
    {name:'KLCC Park',type:'NATURE',category:'Park',city:'Kuala Lumpur',lat:3.1575,lng:101.7130,rating:4.7,priceLevel:0,estimatedSpend:0,durationMin:60,description:'50-acre urban oasis with fountain shows and the best skyline views. Free and romantic at sunset.',bestTime:'5PM-7PM',isIndoor:false,isPhotoSpot:true,romanceScore:85,conversationScore:75,tags:['Park','Free','Sunset']},
    {name:'Titiwangsa Lake Gardens',type:'NATURE',category:'Park',city:'Kuala Lumpur',lat:3.1760,lng:101.7040,rating:4.4,priceLevel:0,estimatedSpend:10,durationMin:90,description:'Scenic lake with paddle boats and stunning Twin Towers reflections. Less crowded — a true gem.',bestTime:'4PM-7PM',isIndoor:false,isPhotoSpot:true,romanceScore:82,conversationScore:78,tags:['Park','Lake','Paddle Boats']},
    {name:'Taman Tugu',type:'NATURE',category:'Forest',city:'Kuala Lumpur',lat:3.1510,lng:101.6980,rating:4.5,priceLevel:0,estimatedSpend:0,durationMin:90,description:'66-acre urban forest with hiking trails and canopy walks. 4000 indigenous trees.',bestTime:'7AM-10AM',isIndoor:false,isPhotoSpot:true,romanceScore:78,conversationScore:80,tags:['Forest','Hiking','Free']},
    {name:'Good Times Board Game Cafe',type:'ADVENTURE',category:'Activity',city:'Kuala Lumpur',lat:3.1430,lng:101.6980,rating:4.4,priceLevel:1,estimatedSpend:30,durationMin:90,description:'Board game cafe with 300+ games and great coffee. Playful and perfect for ice-breaking.',bestTime:'2PM-10PM',isIndoor:true,isPhotoSpot:false,romanceScore:60,conversationScore:95,tags:['Activity','Fun','Interactive']},
    {name:'Jadi Batek',type:'ADVENTURE',category:'Workshop',city:'Kuala Lumpur',lat:3.1450,lng:101.7120,rating:4.3,priceLevel:2,estimatedSpend:80,durationMin:120,description:'Hands-on batik painting workshop — create matching pieces. Uniquely Malaysian creative date.',bestTime:'10AM-4PM',isIndoor:true,isPhotoSpot:true,romanceScore:75,conversationScore:82,tags:['Workshop','Creative','Art']},
    {name:'Coley Cocktail Bar',type:'NIGHTLIFE',category:'Bar',city:'Kuala Lumpur',lat:3.1455,lng:101.7050,rating:4.6,priceLevel:2,estimatedSpend:100,durationMin:75,description:'Sophisticated cocktail bar ranked in Asia 50 Best. Creative drinks and warm service.',bestTime:'7PM-12AM',isIndoor:true,isPhotoSpot:false,romanceScore:83,conversationScore:88,tags:['Cocktails','Award','Intimate']},
    {name:'Entier French Dining',type:'LUXURY',category:'Fine Dining',city:'Kuala Lumpur',lat:3.1520,lng:101.7135,rating:4.6,priceLevel:4,estimatedSpend:300,durationMin:120,description:'Nose-to-tail French by Chef Masashi. Elegant, innovative, ultimate celebration restaurant.',bestTime:'7PM-10PM',isIndoor:true,isPhotoSpot:true,romanceScore:95,conversationScore:90,tags:['Fine Dining','French','Luxury']},
    {name:'Dewakan',type:'LUXURY',category:'Fine Dining',city:'Kuala Lumpur',lat:3.1450,lng:101.7000,rating:4.8,priceLevel:4,estimatedSpend:350,durationMin:150,description:'Michelin-starred modern Malaysian. Foraged ingredients and stunning tasting menu.',bestTime:'7PM-9PM',isIndoor:true,isPhotoSpot:true,romanceScore:96,conversationScore:92,tags:['Michelin','Fine Dining','Malaysian']},
    {name:'PS150',type:'NIGHTLIFE',category:'Speakeasy',city:'Kuala Lumpur',lat:3.1455,lng:101.6970,rating:4.4,priceLevel:2,estimatedSpend:70,durationMin:60,description:'Hidden Chinatown bar behind a toy shop facade. Whimsical, creative cocktails, truly secret.',bestTime:'8PM-1AM',isIndoor:true,isPhotoSpot:true,romanceScore:80,conversationScore:86,tags:['Speakeasy','Hidden','Chinatown']},
    {name:'Transparent Coffee',type:'CAFE',category:'Cafe',city:'Kuala Lumpur',lat:3.1460,lng:101.7050,rating:4.5,priceLevel:1,estimatedSpend:35,durationMin:45,description:'Minimalist specialty coffee bar. Single origin pour-overs and the best flat white in town.',bestTime:'9AM-5PM',isIndoor:true,isPhotoSpot:true,romanceScore:68,conversationScore:84,tags:['Cafe','Coffee','Minimalist']},
    {name:'Batu Caves exploring',type:'ADVENTURE',category:'Landmark',city:'Kuala Lumpur',lat:3.2374,lng:101.6839,rating:4.6,priceLevel:0,estimatedSpend:5,durationMin:120,description:'272 rainbow steps to ancient limestone caves. Epic photos, cheeky monkeys, and breathtaking views.',bestTime:'7AM-10AM',isIndoor:false,isPhotoSpot:true,romanceScore:72,conversationScore:70,tags:['Landmark','Free','Photo','Adventure']},
    {name:'Shuang Xi',type:'NIGHTLIFE',category:'Bar',city:'Kuala Lumpur',lat:3.1440,lng:101.6970,rating:4.3,priceLevel:1,estimatedSpend:50,durationMin:60,description:'Dive bar with cheap beer, neon lights, and a grungy cool vibe. Perfect for unfiltered fun dates.',bestTime:'8PM-2AM',isIndoor:true,isPhotoSpot:true,romanceScore:55,conversationScore:75,tags:['Bar','Dive','Cheap','Fun']},
    {name:'Troika Sky Dining',type:'LUXURY',category:'Fine Dining',city:'Kuala Lumpur',lat:3.1605,lng:101.7160,rating:4.5,priceLevel:4,estimatedSpend:280,durationMin:120,description:'Three restaurants on the 23rd floor with unmatched KL skyline. Cantaloupe, Strato, and Fuego.',bestTime:'7PM-10PM',isIndoor:true,isPhotoSpot:true,romanceScore:94,conversationScore:88,tags:['Fine Dining','Luxury','Skyline','Multi-restaurant']},
  ],
  'Penang': [
    {name:'Penang Hill Sunset',type:'ROMANTIC',category:'Viewpoint',city:'Penang',lat:5.4243,lng:100.2725,rating:4.6,priceLevel:1,estimatedSpend:60,durationMin:150,description:'Take the funicular train up 833m for the most romantic sunset in Penang. The skywalk offers 360° views of George Town and the mainland. David Brown\'s Restaurant at the summit is the ultimate dinner-with-a-view spot.',bestTime:'4:30PM–7:30PM for sunset',isIndoor:false,isPhotoSpot:true,romanceScore:97,conversationScore:82,tags:['Sunset','Viewpoint','Funicular','Fine Dining','Photography']},
    {name:'ChinaHouse',type:'CAFE',category:'Cafe',city:'Penang',lat:5.4160,lng:100.3350,rating:4.5,priceLevel:2,estimatedSpend:70,durationMin:90,description:'A sprawling compound of 3 heritage shophouses connected by courtyards — 50+ cakes daily, live music on weekends, and an art gallery. The most charming date cafe in Penang.',bestTime:'2PM–6PM for cake + coffee',isIndoor:true,isPhotoSpot:true,romanceScore:82,conversationScore:88,tags:['Cafe','Cakes','Heritage','Art Gallery','Live Music']},
    {name:'Tropical Spice Garden',type:'NATURE',category:'Garden',city:'Penang',lat:5.4667,lng:100.2500,rating:4.4,priceLevel:1,estimatedSpend:60,durationMin:120,description:'8 acres of lush tropical gardens cascading down a hillside to the sea. Over 500 plant species, cooking classes, and the Tree Monkey restaurant perched among the canopy. Sensory and romantic.',bestTime:'9AM–11AM',isIndoor:false,isPhotoSpot:true,romanceScore:85,conversationScore:78,tags:['Garden','Nature','Cooking Class','Canopy','Photography']},
    {name:'Batu Ferringhi Night Market',type:'NIGHTLIFE',category:'Night Market',city:'Penang',lat:5.4722,lng:100.2500,rating:4.2,priceLevel:1,estimatedSpend:60,durationMin:90,description:'A 2km stretch of night market stalls along Penang\'s most famous beach. Shop for crafts, eat street food, then walk on the moonlit beach. Casual, fun, and effortlessly romantic.',bestTime:'6:30PM–10PM',isIndoor:false,isPhotoSpot:false,romanceScore:72,conversationScore:70,tags:['Night Market','Beach','Shopping','Street Food','Casual']},
  ],
  'Melaka': [
    {name:'The Daily Fix Cafe',type:'CAFE',category:'Cafe',city:'Melaka',lat:2.1975,lng:102.2478,rating:4.5,priceLevel:1,estimatedSpend:40,durationMin:60,description:'A hidden courtyard cafe on Jonker Street with the best pandan pancakes in Melaka. The vintage decor, dappled sunlight, and secret garden vibe make it the most Instagrammable cafe date.',bestTime:'10AM–12PM',isIndoor:false,isPhotoSpot:true,romanceScore:75,conversationScore:85,tags:['Cafe','Hidden Gem','Courtyard','Brunch','Vintage']},
    {name:'Melaka River Cruise',type:'ROMANTIC',category:'Boat Ride',city:'Melaka',lat:2.1950,lng:102.2500,rating:4.3,priceLevel:1,estimatedSpend:60,durationMin:45,description:'A 45-minute cruise along the Melaka River at dusk — colonial buildings, street art murals, and fairy lights reflecting on the water. The evening cruise with the city lit up is pure magic.',bestTime:'5:30PM–7:30PM',isIndoor:false,isPhotoSpot:true,romanceScore:90,conversationScore:72,tags:['River Cruise','Sunset','Romantic','Photography','Relaxed']},
  ],
  'Langkawi': [
    {name:'Pantai Cenang Sunset',type:'BEACH',category:'Beach',city:'Langkawi',lat:6.2967,lng:99.7233,rating:4.5,priceLevel:0,estimatedSpend:20,durationMin:120,description:'Langkawi\'s iconic sunset beach — powdery sand, turquoise water, and the sun dipping into the Andaman Sea. Beach bars serve cocktails with your toes in the sand. Fire shows after dark.',bestTime:'5PM–8PM',isIndoor:false,isPhotoSpot:true,romanceScore:92,conversationScore:75,tags:['Beach','Sunset','Cocktails','Fire Show','Swimming']},
    {name:'Langkawi Cable Car',type:'ADVENTURE',category:'Cable Car',city:'Langkawi',lat:6.3500,lng:99.8000,rating:4.7,priceLevel:2,estimatedSpend:120,durationMin:150,description:'The steepest cable car in the world rising 708m to the Sky Bridge — a curved steel walkway suspended between two peaks. The views of the Andaman Sea and Thai islands are extraordinary.',bestTime:'9:30AM opening or 4PM',isIndoor:false,isPhotoSpot:true,romanceScore:85,conversationScore:80,tags:['Cable Car','Sky Bridge','Adventure','Views','Iconic']},
  ],
};

// =============================================================================
// CITY DATABASE — default venues when city not in curated list
// =============================================================================

const DEFAULT_VENUES: DatingVenue[] = [
  {name:'Rooftop Sunset Bar',type:'ROMANTIC',category:'Rooftop Bar',city:'_default',lat:0,lng:0,rating:4.3,priceLevel:2,estimatedSpend:120,durationMin:90,description:'A rooftop bar with panoramic city views — the perfect setting for sunset cocktails and conversation.',bestTime:'5PM–8PM',isIndoor:false,isPhotoSpot:true,romanceScore:85,conversationScore:80,tags:['Rooftop','Sunset','Cocktails','Views']},
  {name:'Botanical Garden',type:'NATURE',category:'Park',city:'_default',lat:0,lng:0,rating:4.3,priceLevel:0,estimatedSpend:10,durationMin:90,description:'The city\'s most beautiful park — manicured gardens, quiet paths, and plenty of private benches for conversation.',bestTime:'8AM–10AM or 4PM–6PM',isIndoor:false,isPhotoSpot:true,romanceScore:72,conversationScore:85,tags:['Park','Nature','Free','Walking','Photography']},
  {name:'Specialty Coffee Cafe',type:'CAFE',category:'Cafe',city:'_default',lat:0,lng:0,rating:4.3,priceLevel:1,estimatedSpend:50,durationMin:60,description:'A cozy specialty coffee cafe with excellent pour-overs, pastries, and a quiet atmosphere perfect for getting to know each other.',bestTime:'10AM–12PM or 2PM–4PM',isIndoor:true,isPhotoSpot:true,romanceScore:65,conversationScore:90,tags:['Cafe','Coffee','Pastries','Cozy','Conversation']},
];

// =============================================================================
// RELATIONSHIP STAGE PROFILES
// =============================================================================

export interface StageProfile {
  label: string;
  description: string;
  idealDurationHours: number;
  preferredTypes: string[];
  avoidTypes: string[];
  conversationPriority: number;
  romancePriority: number;
  budgetMultiplier: number;
  privacyPreference: number;
  activityCount: number;
}

const STAGE_PROFILES: Record<string, StageProfile> = {
  FIRST_DATE: {
    label:'First Date',description:'Keep it light, public, and flexible. Focus on conversation and chemistry.',
    idealDurationHours:2,preferredTypes:['CAFE','NATURE','FOOD_HUNT'],avoidTypes:['LUXURY','NIGHTLIFE'],
    conversationPriority:95,romancePriority:30,budgetMultiplier:0.5,privacyPreference:20,activityCount:2,
  },
  SECOND_DATE: {
    label:'Second Date',description:'Slightly longer, more personal. Add an activity to share an experience.',
    idealDurationHours:4,preferredTypes:['ROMANTIC','ADVENTURE','FOOD_HUNT','CAFE'],avoidTypes:['LUXURY'],
    conversationPriority:80,romancePriority:50,budgetMultiplier:0.8,privacyPreference:40,activityCount:3,
  },
  NEW_COUPLE: {
    label:'New Couple',description:'Now it\'s about creating shared memories. Mix romance with adventure.',
    idealDurationHours:5,preferredTypes:['ROMANTIC','ADVENTURE','BEACH','NATURE','NIGHTLIFE'],avoidTypes:[],
    conversationPriority:65,romancePriority:75,budgetMultiplier:1.0,privacyPreference:60,activityCount:4,
  },
  LONG_TERM_COUPLE: {
    label:'Long-Term Couple',description:'Deepen connection with meaningful shared experiences. Quality over quantity.',
    idealDurationHours:6,preferredTypes:['ROMANTIC','LUXURY','ADVENTURE','NATURE','BEACH'],avoidTypes:[],
    conversationPriority:55,romancePriority:85,budgetMultiplier:1.2,privacyPreference:70,activityCount:4,
  },
  MARRIED_COUPLE: {
    label:'Married Couple',description:'Reignite the spark. Premium experiences, nostalgic elements, and genuine quality time.',
    idealDurationHours:6,preferredTypes:['ROMANTIC','LUXURY','NATURE','BEACH','FOOD_HUNT'],avoidTypes:[],
    conversationPriority:50,romancePriority:90,budgetMultiplier:1.5,privacyPreference:75,activityCount:5,
  },
};

// =============================================================================
// DATE TYPE PROFILES
// =============================================================================

interface DateTypeProfile {
  label: string; emoji: string;
  vibeDescription: string;
  idealStartTime: string;
  indoorBackupType: string;
  rainSensitivity: number; // 0-100
}

const DATE_TYPE_PROFILES: Record<string, DateTypeProfile> = {
  ROMANTIC:   {label:'Romantic',emoji:'💕',vibeDescription:'Intimate settings, soft lighting, meaningful moments.',idealStartTime:'5:00 PM',indoorBackupType:'Fine Dining',rainSensitivity:70},
  ADVENTURE:  {label:'Adventure',emoji:'🧗',vibeDescription:'Adrenaline, exploration, and shared challenges.',idealStartTime:'9:00 AM',indoorBackupType:'Indoor Climbing',rainSensitivity:80},
  CAFE:       {label:'Cafe',emoji:'☕',vibeDescription:'Cozy, relaxed, conversation-first with great coffee.',idealStartTime:'10:00 AM',indoorBackupType:'Board Game Cafe',rainSensitivity:20},
  LUXURY:     {label:'Luxury',emoji:'✨',vibeDescription:'Premium everything — fine dining, exclusive venues, VIP treatment.',idealStartTime:'6:00 PM',indoorBackupType:'Private Dining',rainSensitivity:40},
  FOOD_HUNT:  {label:'Food Hunt',emoji:'🍜',vibeDescription:'Street food crawls, hidden eateries, shared plates.',idealStartTime:'11:00 AM',indoorBackupType:'Hawker Center',rainSensitivity:50},
  NATURE:     {label:'Nature',emoji:'🌿',vibeDescription:'Parks, gardens, hikes — green spaces and fresh air.',idealStartTime:'7:30 AM',indoorBackupType:'Botanical Garden Conservatory',rainSensitivity:90},
  BEACH:      {label:'Beach',emoji:'🏖️',vibeDescription:'Sand, sea, sunsets, and barefoot walks.',idealStartTime:'4:00 PM',indoorBackupType:'Beachfront Restaurant',rainSensitivity:85},
  NIGHTLIFE:  {label:'Nightlife',emoji:'🌙',vibeDescription:'Bars, live music, dancing — the city after dark.',idealStartTime:'8:00 PM',indoorBackupType:'Speakeasy Bar',rainSensitivity:10},
};

// =============================================================================
// ENGINE
// =============================================================================

@Injectable()
export class DateEngineService {
  getVenues(city: string, dateType?: string, relationshipStage?: string) {
    const cityVenues = MALAYSIAN_DATING_VENUES[city] ||
      Object.values(MALAYSIAN_DATING_VENUES).flat().filter(v => v.city.toLowerCase().includes(city.toLowerCase()));
    const venues = cityVenues.length > 0 ? cityVenues : DEFAULT_VENUES.map(v => ({...v, city}));

    // Filter by relationship stage preferences
    const stage = STAGE_PROFILES[relationshipStage || 'NEW_COUPLE'];
    let filtered = venues;
    if (stage && stage.preferredTypes.length > 0) {
      const preferred = venues.filter(v => stage.preferredTypes.includes(v.type));
      filtered = preferred.length >= 3 ? preferred : venues;
    }
    if (stage?.avoidTypes?.length > 0) {
      filtered = filtered.filter(v => !stage.avoidTypes.includes(v.type));
    }

    // Prioritize matching date type but don't limit — include all for variety
    if (dateType && DATE_TYPE_PROFILES[dateType]) {
      const matching = filtered.filter(v => v.type === dateType);
      const others = filtered.filter(v => v.type !== dateType);
      // Put matching first, but keep others for budget/duration flexibility
      filtered = [...matching, ...others];
    }

    return filtered;
  }

  getStageProfile(stage: string): StageProfile {
    return STAGE_PROFILES[stage] || STAGE_PROFILES['NEW_COUPLE']!;
  }

  getDateTypeProfile(type: string): DateTypeProfile {
    return DATE_TYPE_PROFILES[type] || DATE_TYPE_PROFILES['ROMANTIC']!;
  }

  getAllStages() { return Object.entries(STAGE_PROFILES).map(([k,v]) => ({key:k,...v})); }
  getAllDateTypes() { return Object.entries(DATE_TYPE_PROFILES).map(([k,v]) => ({key:k,...v})); }

  /** Select optimal venues for a date plan */
  selectVenues(city: string, dateType: string, relationshipStage: string, budget: number, count: number): DatingVenue[] {
    const venues = this.getVenues(city, dateType, relationshipStage);
    const stageProfile = this.getStageProfile(relationshipStage);
    const maxBudgetPerVenue = budget * 0.45; // Max 45% of budget per venue

    // Score each venue — prioritize budget-fit hard
    const scored = venues.map(v => {
      let score = 0;
      score += v.rating * 12;
      score += (v.conversationScore * (stageProfile.conversationPriority / 100)) * 0.4;
      score += (v.romanceScore * (stageProfile.romancePriority / 100)) * 0.4;
      // Heavily reward venues that fit budget
      if (v.estimatedSpend <= maxBudgetPerVenue) score += 40;
      else if (v.estimatedSpend <= budget * 0.7) score += 15;
      else score -= 30; // Penalize expensive venues
      if (v.isPhotoSpot) score += 8;
      if (v.isIndoor) score += 5;
      return { venue: v, score };
    });

    scored.sort((a, b) => b.score - a.score);

    // Shuffle top scorers so each generation is different
    const topTier = scored.slice(0, Math.min(8, scored.length));
    const rest = scored.slice(Math.min(8, scored.length));
    for (let i = topTier.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [topTier[i], topTier[j]] = [topTier[j], topTier[i]];
    }
    const shuffled = [...topTier, ...rest];

    // Ensure total fits within budget
    const selected: DatingVenue[] = [];
    let runningTotal = 0;
    for (const s of shuffled) {
      if (selected.length >= count) break;
      if (runningTotal + s.venue.estimatedSpend <= budget * 0.9) {
        selected.push(s.venue);
        runningTotal += s.venue.estimatedSpend;
      }
    }

    // Fallback: if not enough venues, pick cheapest that still fits budget
    if (selected.length < count) {
      const remaining = scored.filter(s => !selected.includes(s.venue))
        .sort((a, b) => a.venue.estimatedSpend - b.venue.estimatedSpend);
      for (const s of remaining) {
        if (selected.length >= count) break;
        // Hard budget cap: don't exceed 80% of budget on activities
        const newTotal = runningTotal + s.venue.estimatedSpend;
        if (newTotal <= budget * 0.80) {
          selected.push(s.venue);
          runningTotal = newTotal;
        }
      }
    }

    // If still empty (very tight budget), pick the single cheapest venue
    if (selected.length === 0) {
      const cheapest = scored.sort((a, b) => a.venue.estimatedSpend - b.venue.estimatedSpend)[0];
      if (cheapest) selected.push(cheapest.venue);
    }

    return selected.slice(0, count);
  }



  /** Aggressively random venue selection */
  selectVenuesRandom(city: string, dateType: string, relationshipStage: string, budget: number, count: number): DatingVenue[] {
    const allVenues = this.getVenues(city, '', '');
    const stageProfile = this.getStageProfile(relationshipStage);
    const preferred = allVenues.filter(v => (stageProfile.preferredTypes || []).includes(v.type));
    const others = allVenues.filter(v => !(stageProfile.preferredTypes || []).includes(v.type));
    const shuffle = (arr: any[]) => { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; };
    const pool = [...shuffle(preferred), ...shuffle(others)];
    const selected: any[] = [];
    let runningTotal = 0;
    for (const v of pool) {
      if (selected.length >= count) break;
      if (runningTotal + v.estimatedSpend <= budget * 0.95) { selected.push(v); runningTotal += v.estimatedSpend; }
    }
    if (selected.length < count) {
      const remaining = pool.filter(v => !selected.includes(v)).sort((a,b) => a.estimatedSpend - b.estimatedSpend);
      for (const v of remaining) { if (selected.length >= count) break; selected.push(v); }
    }
    return selected;
  }


  /** Generate rain backup plan */
  generateRainBackup(city: string, dateType: string): string {
    const indoorVenues = this.getVenues(city).filter(v => v.isIndoor);
    if (indoorVenues.length === 0) return 'No indoor backup venues found. Pack umbrellas and waterproof clothing.';

    const top3 = indoorVenues.sort((a,b) => b.rating - a.rating).slice(0, 3);
    return `RAIN BACKUP PLAN:\n${top3.map((v,i) => `${i+1}. ${v.name} (${v.category}) — Rating ${v.rating} ⭐ · ~RM ${v.estimatedSpend}/person · ${v.isPhotoSpot?'📸 Photo-worthy':'🏠 Fully indoor'}`).join('\n')}\n\nAll venues are fully indoor and weather-proof. Estimated backup budget: RM ${top3.reduce((s,v) => s+v.estimatedSpend, 0)} total.`;
  }

  /** Generate indoor backup plan */
  generateIndoorBackup(city: string): string {
    const indoor = this.getVenues(city).filter(v => v.isIndoor && v.rating >= 4.3);
    const top3 = indoor.sort((a,b) => b.rating - a.rating).slice(0, 3);
    return `INDOOR BACKUP PLAN:\n${top3.map((v,i) => `${i+1}. ${v.name} (${v.category}) — ${v.description.slice(0,80)}...`).join('\n')}`;
  }

  /** Calculate sunset timing (approximate for Malaysian cities) */
  calculateSunsetTiming(city: string, month: number): { sunset: string; goldenHour: string } {
    // Malaysia is near the equator — sunset is consistently 7:00-7:30 PM year-round
    const baseSunset = 19 + (month >= 4 && month <= 8 ? 15 : month >= 11 || month <= 1 ? 0 : 10); // minutes past 7PM
    const sunsetMin = baseSunset % 60;
    const sunsetHour = 19 + Math.floor(baseSunset / 60);
    const sunsetStr = `${sunsetHour}:${sunsetMin.toString().padStart(2,'0')} PM`;
    const goldenStart = sunsetHour - 1;
    const goldenStr = `${goldenStart}:${sunsetMin.toString().padStart(2,'0')} PM – ${sunsetStr}`;
    return { sunset: sunsetStr, goldenHour: goldenStr };
  }

  /** Calculate crowd avoidance recommendations */
  calculateCrowdAvoidance(dateType: string): { level: string; recommendation: string } {
    const profiles: Record<string, {level:string;recommendation:string}> = {
      ROMANTIC: {level:'Medium',recommendation:'Avoid Friday/Saturday nights. Reserve tables 3+ days ahead. Best: Tue–Thu evenings.'},
      ADVENTURE: {level:'Medium',recommendation:'Weekday mornings are emptiest. Avoid public holiday weekends. Book activities online.'},
      CAFE: {level:'High',recommendation:'Avoid weekend brunch rush (10AM–1PM). Best: weekday 10AM or 3PM. Most cafes take reservations.'},
      LUXURY: {level:'Low',recommendation:'Premium venues manage capacity well. Always reserve ahead. Private rooms available.'},
      FOOD_HUNT: {level:'High',recommendation:'Avoid peak meal times (12–2PM, 6:30–8:30PM). Best: 11AM or 3PM for street food.'},
      NATURE: {level:'Medium',recommendation:'Avoid weekend mornings. Best: weekday 7–9AM or 4–6PM. Parks are quieter after rain.'},
      BEACH: {level:'High',recommendation:'Avoid weekends and public holidays. Best: weekday late afternoons. Sunset is universally busy.'},
      NIGHTLIFE: {level:'High',recommendation:'Friday/Saturday busiest. Best: Thursday for premium venues, Wednesday for casual spots.'},
    };
    return profiles[dateType] || {level:'Medium',recommendation:'Avoid peak weekend hours. Weekday dates are generally quieter.'};
  }

  /** Calculate all AI dating scores */
  calculateScores(venues: DatingVenue[], stage: string, dateType: string, budget: number, totalCost: number): {
    romanceScore: number; conversationScore: number; privacyScore: number;
    budgetScore: number; photoOppScore: number; overallScore: number;
    breakdown: { category: string; score: number; maxScore: number; reasoning: string; tips: string[] }[];
  } {
    const stageProfile = this.getStageProfile(stage);
    const typeProfile = this.getDateTypeProfile(dateType);

    // Romance Score
    const avgRomance = venues.reduce((s,v) => s+v.romanceScore, 0) / Math.max(1, venues.length);
    const romanceScore = Math.round((avgRomance * 0.6) + (stageProfile.romancePriority * 0.4));

    // Conversation Score
    const avgConversation = venues.reduce((s,v) => s+v.conversationScore, 0) / Math.max(1, venues.length);
    const conversationScore = Math.round((avgConversation * 0.5) + (stageProfile.conversationPriority * 0.5));

    // Privacy Score
    const indoorRatio = venues.filter(v => v.isIndoor).length / Math.max(1, venues.length);
    const privacyScore = Math.round((indoorRatio * 40) + (stageProfile.privacyPreference * 0.6));

    // Budget Score
    const budgetScore = totalCost <= budget ? Math.round(80 + (1 - totalCost/budget) * 20) : Math.round(Math.max(20, 100 - ((totalCost - budget) / budget) * 100));

    // Photo Opportunity Score
    const photoRatio = venues.filter(v => v.isPhotoSpot).length / Math.max(1, venues.length);
    const photoOppScore = Math.round((photoRatio * 60) + (typeProfile.rainSensitivity < 50 ? 20 : 10) + (venues.length > 2 ? 20 : 10));

    const overallScore = Math.round((romanceScore * 0.3) + (conversationScore * 0.2) + (privacyScore * 0.1) + (budgetScore * 0.15) + (photoOppScore * 0.15) + (Math.min(100, venues.length * 5)));

    const breakdown = [
      {category:'Romance',score:romanceScore,maxScore:100,reasoning:`Average venue romance score ${Math.round(avgRomance)}/100 × stage multiplier ${stageProfile.romancePriority}%`,tips:['Choose a sunset-facing venue','Add a surprise element (flowers, note)','Book a table with the best view']},
      {category:'Conversation',score:conversationScore,maxScore:100,reasoning:`Average venue conversation score ${Math.round(avgConversation)}/100 × stage priority ${stageProfile.conversationPriority}%`,tips:['Pick quiet venues (no live music during dinner)','Prepare 3 open-ended questions','Put phones away — create a phone stack']},
      {category:'Privacy',score:privacyScore,maxScore:100,reasoning:`${Math.round(indoorRatio*100)}% indoor venues × stage privacy preference ${stageProfile.privacyPreference}%`,tips:['Request corner/booth seating','Avoid peak hours for more privacy','Consider private room options']},
      {category:'Budget',score:budgetScore,maxScore:100,reasoning:`Total RM ${totalCost} vs budget RM ${budget} (${Math.round(totalCost/budget*100)}%)`,tips:['Pre-book online for discounts','Share dishes to sample more','Happy hour = 50% savings on drinks']},
      {category:'Photo Opportunity',score:photoOppScore,maxScore:100,reasoning:`${Math.round(photoRatio*100)}% venues are photo-worthy × ${venues.length} activity spots`,tips:['Golden hour: ' + this.calculateSunsetTiming('KL', new Date().getMonth()).goldenHour,'Natural light beats flash — sit near windows','Candid photos > posed photos for dating']},
    ];

    return { romanceScore, conversationScore, privacyScore, budgetScore, photoOppScore, overallScore, breakdown };
  }
}
