import { Injectable } from '@nestjs/common';

// Production-grade in-memory store (ready for Prisma migration)
const users: Record<string, any> = {
  demo: {
    id:'demo',name:'Explorer',email:'explorer@exploremy.ai',avatar:null,
    coverPhoto:'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
    joinDate:'2025-03-15',level:7,xp:1850,nextLevelXp:2500,
    stats:{trips:8,countries:3,cities:12,places:48,photos:156,reviews:24,km:4520,daysAbroad:42},
    dna:[
      {e:'🍜',l:'Foodie',v:92,color:'#F97316'},{e:'🧗',l:'Adventure',v:78,color:'#EF4444'},
      {e:'🌿',l:'Nature',v:70,color:'#22C55E'},{e:'📸',l:'Photography',v:85,color:'#3B82F6'},
      {e:'✨',l:'Luxury',v:35,color:'#A855F7'},{e:'💰',l:'Budget',v:60,color:'#EAB308'},
      {e:'🌙',l:'Nightlife',v:45,color:'#6366F1'},{e:'☕',l:'Cafe',v:82,color:'#EC4899'},
    ],
    visitedCities:['Kuala Lumpur','Penang','Melaka','Johor Bahru','Langkawi','Ipoh','Cameron Highlands','Kuantan','Kota Kinabalu','Kuching','Port Dickson','Genting Highlands'],
  },
};

// Favorites store
const favorites: any[] = [
  {id:'f1',userId:'demo',placeId:'p1',placeName:'Jalan Alor Food Street',category:'FOOD',city:'Kuala Lumpur',rating:4.5,photo:'https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?w=200',savedAt:'2025-11-15'},
  {id:'f2',userId:'demo',placeId:'p2',placeName:'Penang Hill',category:'ATTRACTION',city:'Penang',rating:4.6,photo:'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=200',savedAt:'2025-10-20'},
  {id:'f3',userId:'demo',placeId:'p3',placeName:'VCR Coffee & Cafe',category:'CAFE',city:'Kuala Lumpur',rating:4.4,photo:'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=200',savedAt:'2025-09-08'},
  {id:'f4',userId:'demo',placeId:'p4',placeName:'Pantai Cenang',category:'BEACH',city:'Langkawi',rating:4.5,photo:'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=200',savedAt:'2025-08-15'},
];

// Reviews store
const reviews: any[] = [
  {id:'r1',userId:'demo',placeName:'Jalan Alor Food Street',city:'Kuala Lumpur',rating:5,text:'Absolute food paradise! The variety is incredible and the atmosphere at night is electric.',date:'2025-11-15'},
  {id:'r2',userId:'demo',placeName:'Penang Hill',city:'Penang',rating:5,text:'The funicular ride up is an experience itself. Sunset views are breathtaking.',date:'2025-10-20'},
  {id:'r3',userId:'demo',placeName:'VCR Coffee',city:'Kuala Lumpur',rating:4,text:'Great specialty coffee in a beautiful heritage building. Pastries are excellent.',date:'2025-09-08'},
  {id:'r4',userId:'demo',placeName:'Pantai Cenang',city:'Langkawi',rating:5,text:'Perfect beach for sunset. Water sports are fun and reasonably priced.',date:'2025-08-15'},
];

// Journal entries
const journals: any[] = [
  {id:'j1',userId:'demo',title:'Penang Food Paradise',destination:'Penang',date:'2025-10-20',mood:'😍',content:'Three days of the best food in Malaysia. From char kway teow to cendol, every meal was an adventure.',photos:['https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=400','https://images.unsplash.com/photo-1577862920658-2b0b8a9a1e1e?w=400']},
  {id:'j2',userId:'demo',title:'Langkawi Island Escape',destination:'Langkawi',date:'2025-08-15',mood:'🏖️',content:'Island hopping, cable car rides, and the most beautiful beaches. The Sky Bridge was a highlight.',photos:['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400']},
];

// Albums
const albums: any[] = [
  {id:'a1',userId:'demo',title:'Penang 2025',coverPhoto:'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=400',count:24,date:'2025-10-20',destination:'Penang'},
  {id:'a2',userId:'demo',title:'Langkawi Getaway',coverPhoto:'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400',count:18,date:'2025-08-15',destination:'Langkawi'},
  {id:'a3',userId:'demo',title:'KL Weekend',coverPhoto:'https://images.unsplash.com/photo-1596662956597-8ec3bb4c6e4e?w=400',count:12,date:'2025-05-20',destination:'Kuala Lumpur'},
];

const achievements: any[] = [
  {id:'first_trip',e:'🌍',n:'First Adventure',d:'Plan your first trip',unlocked:true,date:'2025-04-10'},
  {id:'food_hunter',e:'🍜',n:'Food Hunter',d:'Save 5 food spots',unlocked:true,date:'2025-05-20'},
  {id:'explorer',e:'🧭',n:'Explorer',d:'Visit 3 cities',unlocked:true,date:'2025-07-15'},
  {id:'photo_pro',e:'📸',n:'Photo Pro',d:'Upload 100 photos',unlocked:true,date:'2025-09-01'},
  {id:'gem_finder',e:'💎',n:'Gem Finder',d:'Discover 3 hidden gems',unlocked:true,date:'2025-10-12'},
  {id:'weekender',e:'🏕️',n:'Weekender',d:'Complete 5 weekend trips',unlocked:true,date:'2025-11-20'},
  {id:'cafe_master',e:'☕',n:'Cafe Master',d:'Visit 10 cafes',unlocked:false},
  {id:'kilometer',e:'🏃',n:'Globe Trotter',d:'Travel 10,000km',unlocked:false},
  {id:'night_owl',e:'🌙',n:'Night Owl',d:'Visit 5 nightlife spots',unlocked:false},
  {id:'saver',e:'💰',n:'Smart Saver',d:'Reach RM 2000 savings',unlocked:false},
  {id:'couple_planner',e:'💑',n:'Love Journey',d:'Plan 3 couple dates',unlocked:false},
  {id:'reviewer',e:'⭐',n:'Top Reviewer',d:'Write 50 reviews',unlocked:false},
];

const badges: any[] = [
  {e:'🏆',n:'Pioneer',category:'travel',unlocked:true},
  {e:'🎖️',n:'Gold Explorer',category:'travel',unlocked:true},
  {e:'📸',n:'Memory Keeper',category:'photos',unlocked:true},
  {e:'🌟',n:'Rising Star',category:'social',unlocked:true},
  {e:'💎',n:'Gem Collector',category:'discovery',unlocked:true},
  {e:'🔥',n:'Hot Streak',category:'travel',unlocked:false},
  {e:'👑',n:'Elite Traveler',category:'travel',unlocked:false},
  {e:'🎯',n:'Goal Crusher',category:'savings',unlocked:false},
];

const wishlist: any[] = [
  {destination:'Tokyo, Japan',e:'🗼',estimatedCost:5000,priority:'high'},
  {destination:'Bali, Indonesia',e:'🏝️',estimatedCost:3000,priority:'high'},
  {destination:'Seoul, South Korea',e:'🇰🇷',estimatedCost:4000,priority:'medium'},
  {destination:'Switzerland',e:'🏔️',estimatedCost:12000,priority:'low'},
];

@Injectable()
export class ProfileService {
  getUser(userId: string) {
    const user = users[userId] || users['demo']!;
    const unlockedAch = achievements.filter(a=>a.unlocked).length;
    return { ...user, achievementsUnlocked: unlockedAch, totalAchievements: achievements.length, badges, wishlist };
  }

  getStats(userId: string) {
    return users[userId]?.stats || users['demo']!.stats;
  }

  getDNA(userId: string) {
    return users[userId]?.dna || users['demo']!.dna;
  }

  getAchievements(userId: string) {
    return { achievements, badges, unlocked: achievements.filter(a=>a.unlocked).length, total: achievements.length };
  }

  getFavorites(userId: string) {
    return favorites.filter(f=>f.userId===userId||f.userId==='demo');
  }

  getReviews(userId: string) {
    return reviews.filter(r=>r.userId===userId||r.userId==='demo');
  }

  getJournals(userId: string) {
    return journals.filter(j=>j.userId===userId||j.userId==='demo');
  }

  getAlbums(userId: string) {
    return albums.filter(a=>a.userId===userId||a.userId==='demo');
  }

  getWishlist(userId: string) {
    return wishlist;
  }

  getVisitedCities(userId: string) {
    return users[userId]?.visitedCities || users['demo']!.visitedCities;
  }

  updateProfile(userId: string, data: any) {
    const user = users[userId] || users['demo'];
    Object.assign(user, data);
    return user;
  }

  addFavorite(userId: string, data: any) {
    const fav = { id:`f${Date.now()}`,userId,placeId:data.placeId||'',placeName:data.placeName,category:data.category||'PLACE',city:data.city||'',rating:data.rating||4.0,photo:data.photo||'',savedAt:new Date().toISOString().split('T')[0]};
    favorites.unshift(fav);
    return fav;
  }

  removeFavorite(userId: string, favId: string) {
    const idx = favorites.findIndex(f=>f.id===favId);
    if (idx>=0) favorites.splice(idx,1);
    return { removed: idx>=0 };
  }

  addReview(userId: string, data: any) {
    const review = { id:`r${Date.now()}`,userId,placeName:data.placeName,city:data.city||'',rating:data.rating||5,text:data.text||'',date:new Date().toISOString().split('T')[0]};
    reviews.unshift(review);
    return review;
  }

  addJournal(userId: string, data: any) {
    const entry = { id:`j${Date.now()}`,userId,title:data.title,destination:data.destination||'',date:new Date().toISOString().split('T')[0],mood:data.mood||'😊',content:data.content||'',photos:data.photos||[]};
    journals.unshift(entry); return entry;
  }

  deleteJournal(userId: string, journalId: string) { const idx = journals.findIndex(j=>j.id===journalId); if(idx>=0) journals.splice(idx,1); return { removed: idx>=0 }; }

  updateJournal(userId: string, journalId: string, data: any) { const j = journals.find(j=>j.id===journalId); if(j) Object.assign(j, data); return j||null; }

  deleteReview(userId: string, reviewId: string) { const idx = reviews.findIndex(r=>r.id===reviewId); if(idx>=0) reviews.splice(idx,1); return { removed: idx>=0 }; }

  addAlbum(userId: string, data: any) { const a = { id:`a${Date.now()}`,userId,title:data.title,coverPhoto:data.coverPhoto||'',count:data.count||0,date:new Date().toISOString().split('T')[0],destination:data.destination||''}; albums.unshift(a); return a; }

  deleteAlbum(userId: string, albumId: string) { const idx = albums.findIndex(a=>a.id===albumId); if(idx>=0) albums.splice(idx,1); return { removed: idx>=0 }; }

  addPhoto(userId: string, data: any) { const p = { id:`p${Date.now()}`,userId,url:data.url,albumId:data.albumId||'',caption:data.caption||'',date:new Date().toISOString().split('T')[0]}; return p; }

  getPhotos(userId: string) { return ['https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=400','https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400','https://images.unsplash.com/photo-1580137189272-c9379f1e7f6c?w=400','https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400','https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400','https://images.unsplash.com/photo-1528127269322-539801943592?w=400','https://images.unsplash.com/photo-1583417319070-4a0db8101493?w=400','https://images.unsplash.com/photo-1630918144732-fb84c82c0009?w=400']; }

  getNotifications(userId: string) { return [{e:'🎉',t:'Milestone Unlocked!',d:'You reached 50% of your Bali savings goal',time:'2h ago',read:false},{e:'❤️',t:'New Like',d:'Your Penang review received 5 likes',time:'1d ago',read:false},{e:'📸',t:'Photo Featured',d:'Your Langkawi photo was featured',time:'3d ago',read:true},{e:'💰',t:'Savings Update',d:'You saved RM 200 this month',time:'1w ago',read:true}]; }

  getPrivacySettings(userId: string) { return { profileVisibility:'public',locationSharing:true,travelHistory:true }; }

  updatePrivacySettings(userId: string, data: any) { return data; }
}
