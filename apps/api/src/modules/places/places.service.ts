import { Injectable } from '@nestjs/common';

export interface PlaceResult {
  id: string; slug: string; name: string; category: string;
  rating: number; reviewCount: number; distance?: number;
  priceLevel: number | null; photos: string[]; address: string;
  city: string; lat: number; lng: number; openingHours: string;
  isOpen: boolean; isHiddenGem: boolean; isTrending: boolean;
  transportOptions: TransportOption[]; description?: string;
  phone?: string | null; website?: string | null; amenities?: string[];
}

export interface TransportOption { mode: string; icon: string; duration: number; distance: number; cost: string; }

const API_KEY = process.env.GOOGLE_MAPS_API_KEY || 'AIzaSyCyohvWiwbAd2UbDpOW-9Os0_eIo8JQ_D8';

// Map Google Places types to our categories
function mapType(types: string[], name: string): string {
  const t = types.join(' ').toLowerCase();
  const n = name.toLowerCase();
  // Check cafe/coffee first since many cafes are also tagged as restaurants
  if (/cafe|coffee|bakery|kopi|latte|espresso|brunch|patisserie/.test(t) || /cafe|coffee|bakery|kopi|brew|bean|roast/.test(n)) return 'CAFE';
  if (/restaurant|meal_takeaway|food|eatery|kitchen|dining|nasi|makan|grill|steakhouse|bbq|buffet/.test(t) || /restaurant|nasi|makan|kitchen|eatery|food/.test(n)) return 'FOOD';
  if (/shopping_mall|department_store|plaza/.test(t) || /mall|plaza|shopping/.test(n)) return 'SHOPPING_MALL';
  if (/tourist_attraction|museum|park|amusement|zoo|aquarium|church|hindu_temple|mosque|place_of_worship|art_gallery/.test(t) || /museum|temple|mosque|church|park|gallery/.test(n)) return 'ATTRACTION';
  if (/lodging|hotel/.test(t) || /hotel|resort|hostel/.test(n)) return 'HOTEL';
  return 'OTHER';
}

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

@Injectable()
export class PlacesService {
  private haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6_371_000; const dLat = ((lat2 - lat1) * Math.PI) / 180; const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  private calcTransport(distMeters: number): TransportOption[] {
    const distKm = distMeters / 1000;
    if (distMeters <= 500) return [{ mode: 'WALKING', icon: '🚶', duration: Math.round(distMeters / 83), distance: distMeters, cost: 'Free' }];
    if (distMeters <= 3000) return [
      { mode: 'WALKING', icon: '🚶', duration: Math.round(distMeters / 83), distance: distMeters, cost: 'Free' },
      { mode: 'GRAB', icon: '🚕', duration: Math.round(distMeters / 333 + 180), distance: distMeters, cost: `RM ${Math.round(5 + distKm * 1.5)}` },
    ];
    if (distMeters <= 15000) return [
      { mode: 'DRIVING', icon: '🚗', duration: Math.round(distMeters / 500), distance: distMeters, cost: `~RM ${Math.round(distKm * 0.4)} fuel` },
      { mode: 'GRAB', icon: '🚕', duration: Math.round(distMeters / 400 + 180), distance: distMeters, cost: `RM ${Math.round(5 + distKm * 1.5)}` },
    ];
    return [
      { mode: 'DRIVING', icon: '🚗', duration: Math.round(distMeters / 667), distance: distMeters, cost: `~RM ${Math.round(distKm * 0.4)} fuel + toll` },
      { mode: 'GRAB', icon: '🚕', duration: Math.round(distMeters / 500 + 240), distance: distMeters, cost: `RM ${Math.round(5 + distKm * 1.5)}` },
    ];
  }

  async findNearby(lat: number, lng: number, radius = 5000, category?: string): Promise<PlaceResult[]> {
    let results: PlaceResult[] = [];

    if (API_KEY) {
      try {
        // For specific categories, use keyword search which is broader than type filter
        const keywords: Record<string, string> = {
          FOOD: 'restaurant|food|cafe|hawker|nasi|makan',
          CAFE: 'cafe|coffee|bakery|kopi|latte',
          SHOPPING_MALL: 'mall|shopping|plaza',
          TOURIST_ATTRACTION: 'tourist+attraction|museum|landmark|temple|mosque|heritage',
          ATTRACTION: 'tourist+attraction|museum|landmark|temple|mosque|heritage',
          NATURE: 'park|garden|beach|waterfall|hiking|nature|forest|lake|hill',
          NIGHTLIFE: 'bar|pub|night+club|live+music|rooftop+bar|cocktail',
          HOTEL: 'hotel|resort|hostel|stay|lodging',
        };

        if (category && keywords[category]) {
          // Use Text Search for broader results, plus Nearby Search for coverage
          const allCatResults: any[] = [];
          const seen = new Set<string>();
          // Text search — broader, more results
          const tUrl = new URL('https://maps.googleapis.com/maps/api/place/textsearch/json');
          tUrl.searchParams.set('query', keywords[category]);
          tUrl.searchParams.set('location', `${lat},${lng}`);
          tUrl.searchParams.set('radius', String(radius));
          tUrl.searchParams.set('key', API_KEY);
          try {
            const tRes = await fetch(tUrl.toString());
            const tData = await tRes.json();
            for (const item of (tData.results ?? [])) {
              if (!seen.has(item.place_id)) { seen.add(item.place_id); allCatResults.push(item); }
            }
          } catch {}
          // Also do a nearby search for additional coverage
          const nUrl = new URL('https://maps.googleapis.com/maps/api/place/nearbysearch/json');
          nUrl.searchParams.set('location', `${lat},${lng}`);
          nUrl.searchParams.set('radius', String(radius));
          nUrl.searchParams.set('keyword', keywords[category]);
          nUrl.searchParams.set('key', API_KEY);
          try {
            const nRes = await fetch(nUrl.toString());
            const nData = await nRes.json();
            for (const item of (nData.results ?? [])) {
              if (!seen.has(item.place_id)) { seen.add(item.place_id); allCatResults.push(item); }
            }
          } catch {}
          results = this.transformResults(allCatResults, lat, lng, radius);
        } else {
          // "All" — search with multiple keywords, merge results
          const allResults: any[] = [];
          const seen = new Set<string>();
          for (const kw of ['restaurant', 'cafe', 'shopping mall', 'attraction']) {
            const url = new URL('https://maps.googleapis.com/maps/api/place/nearbysearch/json');
            url.searchParams.set('location', `${lat},${lng}`);
            url.searchParams.set('radius', String(Math.min(radius, 5000)));
            url.searchParams.set('keyword', kw);
            url.searchParams.set('key', API_KEY);
            try {
              const res = await fetch(url.toString());
              const d = await res.json();
              for (const r of (d.results ?? [])) {
                if (!seen.has(r.place_id)) { seen.add(r.place_id); allResults.push(r); }
              }
            } catch {}
            if (allResults.length >= 30) break;
          }
          results = this.transformResults(allResults, lat, lng, radius);
        }
      } catch (e) {
        console.error('Google Places API error:', e);
      }
    }

    // Always merge local data when Google returns insufficient results
    const allFallback = this.getFallbackPlaces(lat, lng, Math.max(radius, 200000), undefined);
    const seen = new Set(results.map(r => r.id));
    for (const f of allFallback) {
      if (!seen.has(f.id)) { results.push(f); seen.add(f.id); }
    }

    if (category) results = results.filter(p => p.category === category);
    return results.sort((a, b) => a.distance! - b.distance!).slice(0, 60);
  }

  private transformResults(places: any[], lat: number, lng: number, radius: number): PlaceResult[] {
    return places.map((p: any) => {
      const dist = Math.round(this.haversine(lat, lng, p.geometry.location.lat, p.geometry.location.lng));
      if (dist > radius) return null;
      return {
        id: p.place_id, slug: slugify(p.name), name: p.name, category: mapType(p.types ?? [], p.name ?? ''),
        rating: p.rating ?? 0, reviewCount: p.user_ratings_total ?? 0, distance: dist,
        priceLevel: p.price_level ?? null,
        photos: p.photos ? [`https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${p.photos[0].photo_reference}&key=${API_KEY}`] : [],
        address: p.vicinity ?? '', city: '', lat: p.geometry.location.lat, lng: p.geometry.location.lng,
        openingHours: p.opening_hours?.open_now ? 'Open now' : 'Check hours',
        isOpen: !!p.opening_hours?.open_now, isHiddenGem: false, isTrending: (p.user_ratings_total ?? 0) > 1000,
        transportOptions: this.calcTransport(dist),
      };
    }).filter(Boolean) as PlaceResult[];
  }

  private getFallbackPlaces(lat: number, lng: number, radius: number, _category?: string): PlaceResult[] {
    // Comprehensive Malaysian places — used when Google API is unavailable
    const demos: PlaceResult[] = [
      // KL (6)
      { id:'fb1',slug:'jalan-alor',name:'Jalan Alor Food Street',category:'FOOD',rating:4.5,reviewCount:8950,priceLevel:1,lat:3.1466,lng:101.7084,city:'Kuala Lumpur',address:'Jalan Alor, Bukit Bintang',openingHours:'5PM-2AM',photos:['https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?w=800'],isOpen:true,isHiddenGem:false,isTrending:true,transportOptions:[],description:'KL most famous food street'},
      { id:'fb2',slug:'klcc-park',name:'KLCC Park',category:'NATURE',rating:4.7,reviewCount:12500,priceLevel:0,lat:3.1575,lng:101.7130,city:'Kuala Lumpur',address:'Jalan Ampang',openingHours:'7AM-10PM',photos:['https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=800'],isOpen:true,isHiddenGem:false,isTrending:true,transportOptions:[],description:'Iconic park with Petronas Twin Towers view'},
      { id:'fb3',slug:'pavilion-kl',name:'Pavilion KL',category:'SHOPPING_MALL',rating:4.5,reviewCount:15200,priceLevel:3,lat:3.1490,lng:101.7135,city:'Kuala Lumpur',address:'168 Jalan Bukit Bintang',openingHours:'10AM-10PM',photos:['https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=800'],isOpen:true,isHiddenGem:false,isTrending:true,transportOptions:[],description:'Premium shopping in Bukit Bintang'},
      { id:'fb4',slug:'batu-caves',name:'Batu Caves',category:'TOURIST_ATTRACTION',rating:4.6,reviewCount:35000,priceLevel:0,lat:3.2374,lng:101.6839,city:'Kuala Lumpur',address:'Gombak',openingHours:'7AM-9PM',photos:['https://images.unsplash.com/photo-1582719478255-451a5d90abf1?w=800'],isOpen:true,isHiddenGem:false,isTrending:true,transportOptions:[],description:'Iconic limestone cave temple'},
      { id:'fb5',slug:'petaling-street',name:'Petaling Street Market',category:'SHOPPING_MALL',rating:4.2,reviewCount:8500,priceLevel:1,lat:3.1447,lng:101.6975,city:'Kuala Lumpur',address:'Jalan Petaling',openingHours:'10AM-10PM',photos:['https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=800'],isOpen:true,isHiddenGem:true,isTrending:true,transportOptions:[],description:'Historic Chinatown market'},
      { id:'fb6',slug:'thean-hou-temple',name:'Thean Hou Temple',category:'TOURIST_ATTRACTION',rating:4.7,reviewCount:6800,priceLevel:0,lat:3.1219,lng:101.6883,city:'Kuala Lumpur',address:'65 Persiaran Endah',openingHours:'8AM-10PM',photos:['https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=800'],isOpen:true,isHiddenGem:false,isTrending:false,transportOptions:[],description:'Beautiful Chinese temple with city views'},
      // Penang (4)
      { id:'fb7',slug:'penang-hill',name:'Penang Hill',category:'NATURE',rating:4.7,reviewCount:22000,priceLevel:2,lat:5.4243,lng:100.2725,city:'George Town',address:'Jalan Stesen Bukit Bendera',openingHours:'6:30AM-11PM',photos:['https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=800'],isOpen:true,isHiddenGem:false,isTrending:true,transportOptions:[],description:'Panoramic hilltop views of Penang'},
      { id:'fb8',slug:'georgetown-heritage',name:'George Town UNESCO Heritage',category:'TOURIST_ATTRACTION',rating:4.8,reviewCount:28000,priceLevel:0,lat:5.4141,lng:100.3288,city:'George Town',address:'Georgetown',openingHours:'24h',photos:['https://images.unsplash.com/photo-1548013146-72479768bada?w=800'],isOpen:true,isHiddenGem:false,isTrending:true,transportOptions:[],description:'UNESCO World Heritage colonial district'},
      { id:'fb9',slug:'gurney-drive',name:'Gurney Drive Hawker Centre',category:'FOOD',rating:4.4,reviewCount:12000,priceLevel:1,lat:5.4376,lng:100.3103,city:'George Town',address:'Persiaran Gurney',openingHours:'5PM-12AM',photos:['https://images.unsplash.com/photo-1537996194471-e657f9e339cd?w=800'],isOpen:true,isHiddenGem:false,isTrending:true,transportOptions:[],description:'Famous Penang hawker food by the sea'},
      { id:'fb10',slug:'kek-lok-si',name:'Kek Lok Si Temple',category:'TOURIST_ATTRACTION',rating:4.6,reviewCount:15000,priceLevel:0,lat:5.3997,lng:100.2733,city:'George Town',address:'Jalan Balik Pulau',openingHours:'8:30AM-5:30PM',photos:['https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=800'],isOpen:true,isHiddenGem:false,isTrending:false,transportOptions:[],description:'Southeast Asia largest Buddhist temple'},
      // Johor (3)
      { id:'fb11',slug:'legoland-malaysia',name:'Legoland Malaysia',category:'TOURIST_ATTRACTION',rating:4.4,reviewCount:18000,priceLevel:3,lat:1.4270,lng:103.6298,city:'Johor Bahru',address:'7 Jalan Legoland',openingHours:'10AM-6PM',photos:['https://images.unsplash.com/photo-1566438480900-0609be27a4be?w=800'],isOpen:true,isHiddenGem:false,isTrending:true,transportOptions:[],description:'Theme park with 70+ rides'},
      { id:'fb12',slug:'johor-premium',name:'Johor Premium Outlets',category:'SHOPPING_MALL',rating:4.3,reviewCount:9500,priceLevel:2,lat:1.6188,lng:103.5950,city:'Johor',address:'Jalan Premium Outlets',openingHours:'10AM-10PM',photos:['https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=800'],isOpen:true,isHiddenGem:false,isTrending:true,transportOptions:[],description:'Designer outlet shopping'},
      { id:'fb13',slug:'danga-bay',name:'Danga Bay',category:'NATURE',rating:4.1,reviewCount:4200,priceLevel:1,lat:1.4802,lng:103.7201,city:'Johor Bahru',address:'Jalan Skudai',openingHours:'24h',photos:['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800'],isOpen:true,isHiddenGem:true,isTrending:false,transportOptions:[],description:'Waterfront recreation park'},
      // Melaka (3)
      { id:'fb14',slug:'jonker-street',name:'Jonker Street Night Market',category:'FOOD',rating:4.6,reviewCount:16000,priceLevel:1,lat:2.1975,lng:102.2478,city:'Melaka',address:'Jalan Hang Jebat',openingHours:'Fri-Sun 6PM-12AM',photos:['https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=800'],isOpen:true,isHiddenGem:false,isTrending:true,transportOptions:[],description:'Famous Melaka night market and street food'},
      { id:'fb15',slug:'a-famosa',name:'A Famosa Fort',category:'TOURIST_ATTRACTION',rating:4.3,reviewCount:11000,priceLevel:0,lat:2.1917,lng:102.2504,city:'Melaka',address:'Jalan Parameswara',openingHours:'24h',photos:['https://images.unsplash.com/photo-1548013146-72479768bada?w=800'],isOpen:true,isHiddenGem:false,isTrending:false,transportOptions:[],description:'16th century Portuguese fortress'},
      { id:'fb16',slug:'melaka-river',name:'Melaka River Cruise',category:'TOURIST_ATTRACTION',rating:4.4,reviewCount:7200,priceLevel:2,lat:2.1990,lng:102.2490,city:'Melaka',address:'Jalan Graha Maju Aras 1',openingHours:'9AM-11:30PM',photos:['https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800'],isOpen:true,isHiddenGem:false,isTrending:true,transportOptions:[],description:'Scenic river cruise through historic Melaka'},
      // KK / Sabah (3)
      { id:'fb17',slug:'kk-waterfront',name:'KK Waterfront',category:'FOOD',rating:4.4,reviewCount:5800,priceLevel:2,lat:5.9850,lng:116.0760,city:'Kota Kinabalu',address:'Jalan Tun Fuad Stephens',openingHours:'5PM-1AM',photos:['https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=800'],isOpen:true,isHiddenGem:false,isTrending:true,transportOptions:[],description:'Seafood restaurants along the waterfront'},
      { id:'fb18',slug:'sapi-island',name:'Sapi Island',category:'NATURE',rating:4.7,reviewCount:8900,priceLevel:2,lat:6.0100,lng:116.0000,city:'Kota Kinabalu',address:'TAR Marine Park',openingHours:'8AM-5PM',photos:['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800'],isOpen:true,isHiddenGem:true,isTrending:true,transportOptions:[],description:'Crystal clear waters for snorkeling'},
      { id:'fb19',slug:'kk-city-mosque',name:'KK City Mosque',category:'TOURIST_ATTRACTION',rating:4.6,reviewCount:4600,priceLevel:0,lat:5.9945,lng:116.1076,city:'Kota Kinabalu',address:'Jalan Pasir',openingHours:'5AM-10PM',photos:['https://images.unsplash.com/photo-1548013146-72479768bada?w=800'],isOpen:true,isHiddenGem:false,isTrending:false,transportOptions:[],description:'Floating mosque surrounded by lagoon'},
      // Langkawi (2)
      { id:'fb20',slug:'langkawi-cable-car',name:'Langkawi Cable Car',category:'TOURIST_ATTRACTION',rating:4.7,reviewCount:25000,priceLevel:3,lat:6.3700,lng:99.6717,city:'Langkawi',address:'Jalan Telaga Tujuh',openingHours:'9:30AM-7PM',photos:['https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800'],isOpen:true,isHiddenGem:false,isTrending:true,transportOptions:[],description:'Steepest cable car in the world'},
      { id:'fb21',slug:'cenang-beach',name:'Pantai Cenang',category:'NATURE',rating:4.5,reviewCount:18000,priceLevel:0,lat:6.2935,lng:99.7238,city:'Langkawi',address:'Jalan Pantai Cenang',openingHours:'24h',photos:['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800'],isOpen:true,isHiddenGem:false,isTrending:true,transportOptions:[],description:'Most popular beach in Langkawi'},
      // Cameron Highlands (2)
      { id:'fb22',slug:'boh-tea',name:'BOH Tea Plantation',category:'NATURE',rating:4.6,reviewCount:14000,priceLevel:0,lat:4.5200,lng:101.4100,city:'Cameron Highlands',address:'Brinchang',openingHours:'8:30AM-4:30PM',photos:['https://images.unsplash.com/photo-1566438480900-0609be27a4be?w=800'],isOpen:true,isHiddenGem:false,isTrending:true,transportOptions:[],description:'Iconic tea plantation with valley views'},
      { id:'fb23',slug:'cameron-market',name:'Cameron Highlands Market',category:'SHOPPING_MALL',rating:4.3,reviewCount:6200,priceLevel:1,lat:4.4955,lng:101.3885,city:'Cameron Highlands',address:'Kea Farm',openingHours:'7AM-7PM',photos:['https://images.unsplash.com/photo-1566438480900-0609be27a4be?w=800'],isOpen:true,isHiddenGem:true,isTrending:false,transportOptions:[],description:'Fresh produce and strawberry farms'},
      // Ipoh (2)
      { id:'fb24',slug:'ipoh-old-town',name:'Ipoh Old Town',category:'TOURIST_ATTRACTION',rating:4.5,reviewCount:8500,priceLevel:0,lat:4.5975,lng:101.0901,city:'Ipoh',address:'Jalan Panglima',openingHours:'24h',photos:['https://images.unsplash.com/photo-1548013146-72479768bada?w=800'],isOpen:true,isHiddenGem:false,isTrending:true,transportOptions:[],description:'Colonial architecture and street art'},
      { id:'fb25',slug:'ipoh-nasi-ganja',name:'Nasi Ganja Ipoh',category:'FOOD',rating:4.5,reviewCount:3200,priceLevel:1,lat:4.5958,lng:101.0803,city:'Ipoh',address:'Jalan Yang Kalsom',openingHours:'10AM-5PM',photos:['https://images.unsplash.com/photo-1537996194471-e657f9e339cd?w=800'],isOpen:true,isHiddenGem:true,isTrending:true,transportOptions:[],description:'Legendary Ipoh nasi kandar'},
      // Kuching (2)
      { id:'fb26',slug:'kuching-waterfront',name:'Kuching Waterfront',category:'NATURE',rating:4.5,reviewCount:7500,priceLevel:0,lat:1.5578,lng:110.3477,city:'Kuching',address:'Jalan Gambier',openingHours:'24h',photos:['https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800'],isOpen:true,isHiddenGem:false,isTrending:true,transportOptions:[],description:'Scenic Sarawak River esplanade'},
      { id:'fb27',slug:'semenggoh',name:'Semenggoh Wildlife Centre',category:'NATURE',rating:4.6,reviewCount:5800,priceLevel:1,lat:1.3987,lng:110.3174,city:'Kuching',address:'Jalan Puncak Borneo',openingHours:'8AM-5PM',photos:['https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?w=800'],isOpen:true,isHiddenGem:true,isTrending:false,transportOptions:[],description:'Orangutan rehabilitation center'},
      // More NATURE places (5)
      { id:'fb28',slug:'kl-forest-eco',name:'KL Forest Eco Park',category:'NATURE',rating:4.4,reviewCount:4200,priceLevel:0,lat:3.1530,lng:101.6990,city:'Kuala Lumpur',address:'Jalan Raja Chulan',openingHours:'7AM-6PM',photos:['https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800'],isOpen:true,isHiddenGem:true,isTrending:false,transportOptions:[],description:'Canopy walk in ancient rainforest in the city center'},
      { id:'fb29',slug:'bukit-nanas',name:'Bukit Nanas Forest Reserve',category:'NATURE',rating:4.3,reviewCount:2800,priceLevel:0,lat:3.1532,lng:101.7036,city:'Kuala Lumpur',address:'Jalan Ampang',openingHours:'7AM-6PM',photos:['https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?w=800'],isOpen:true,isHiddenGem:true,isTrending:false,transportOptions:[],description:'Oldest forest reserve in Malaysia'},
      { id:'fb30',slug:'perdana-botanical',name:'Perdana Botanical Garden',category:'NATURE',rating:4.5,reviewCount:6800,priceLevel:0,lat:3.1430,lng:101.6850,city:'Kuala Lumpur',address:'Jalan Kebun Bunga',openingHours:'7AM-8PM',photos:['https://images.unsplash.com/photo-1566438480900-0609be27a4be?w=800'],isOpen:true,isHiddenGem:false,isTrending:true,transportOptions:[],description:'91-hectare gardens with lake and deer park'},
      { id:'fb31',slug:'broga-hill',name:'Broga Hill',category:'NATURE',rating:4.6,reviewCount:3500,priceLevel:0,lat:2.9400,lng:101.9000,city:'Semenyih',address:'Jalan Broga',openingHours:'5AM-5PM',photos:['https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=800'],isOpen:true,isHiddenGem:true,isTrending:true,transportOptions:[],description:'Popular sunrise hiking spot with panoramic views'},
      { id:'fb32',slug:'frim-forest',name:'FRIM Forest Reserve',category:'NATURE',rating:4.7,reviewCount:5200,priceLevel:1,lat:3.2333,lng:101.6333,city:'Kepong',address:'Jalan Frim',openingHours:'7AM-5PM',photos:['https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800'],isOpen:true,isHiddenGem:true,isTrending:true,transportOptions:[],description:'World-class forest research with canopy walkway'},
      // NIGHTLIFE places (5)
      { id:'fb33',slug:'changkat-bukit',name:'Changkat Bukit Bintang',category:'NIGHTLIFE',rating:4.3,reviewCount:7500,priceLevel:2,lat:3.1478,lng:101.7073,city:'Kuala Lumpur',address:'Changkat Bukit Bintang',openingHours:'5PM-3AM',photos:['https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=800'],isOpen:true,isHiddenGem:false,isTrending:true,transportOptions:[],description:'KL most famous nightlife street with bars and clubs'},
      { id:'fb34',slug:'helipad-bar',name:'Heli Lounge Bar',category:'NIGHTLIFE',rating:4.5,reviewCount:3800,priceLevel:3,lat:3.1495,lng:101.7079,city:'Kuala Lumpur',address:'Jalan Sultan Ismail',openingHours:'6PM-2AM',photos:['https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800'],isOpen:true,isHiddenGem:true,isTrending:true,transportOptions:[],description:'Rooftop bar on an actual helicopter pad with 360° KL views'},
      { id:'fb35',slug:'marinis-57',name:'Marini\'s on 57',category:'NIGHTLIFE',rating:4.6,reviewCount:4200,priceLevel:4,lat:3.1578,lng:101.7130,city:'Kuala Lumpur',address:'Jalan Pinang',openingHours:'5PM-2AM',photos:['https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800'],isOpen:true,isHiddenGem:false,isTrending:true,transportOptions:[],description:'Premium rooftop bar with Twin Towers view'},
      { id:'fb36',slug:'zouk-kl',name:'Zouk KL',category:'NIGHTLIFE',rating:4.2,reviewCount:6200,priceLevel:3,lat:3.1440,lng:101.7120,city:'Kuala Lumpur',address:'Jalan Tun Razak',openingHours:'10PM-4AM',photos:['https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=800'],isOpen:true,isHiddenGem:false,isTrending:true,transportOptions:[],description:'Iconic superclub with multiple rooms and international DJs'},
      { id:'fb37',slug:'ps150',name:'PS150',category:'NIGHTLIFE',rating:4.4,reviewCount:1800,priceLevel:2,lat:3.1455,lng:101.6970,city:'Kuala Lumpur',address:'Jalan Petaling',openingHours:'6PM-1AM',photos:['https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800'],isOpen:true,isHiddenGem:true,isTrending:true,transportOptions:[],description:'Hidden speakeasy cocktail bar in Chinatown'},
      // HOTEL places (5)
      { id:'fb38',slug:'mandarin-oriental-kl',name:'Mandarin Oriental KL',category:'HOTEL',rating:4.7,reviewCount:8500,priceLevel:4,lat:3.1560,lng:101.7125,city:'Kuala Lumpur',address:'Jalan Pinang',openingHours:'24h',photos:['https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800'],isOpen:true,isHiddenGem:false,isTrending:false,transportOptions:[],description:'Luxury hotel adjacent to Petronas Towers'},
      { id:'fb39',slug:'traders-hotel-kl',name:'Traders Hotel KL',category:'HOTEL',rating:4.3,reviewCount:5500,priceLevel:3,lat:3.1570,lng:101.7135,city:'Kuala Lumpur',address:'Jalan Pinang',openingHours:'24h',photos:['https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800'],isOpen:true,isHiddenGem:false,isTrending:false,transportOptions:[],description:'Famous rooftop pool with direct Twin Towers view'},
      { id:'fb40',slug:'moeslem-friendly-hotel',name:'KLCC Suites',category:'HOTEL',rating:4.2,reviewCount:3200,priceLevel:2,lat:3.1580,lng:101.7110,city:'Kuala Lumpur',address:'Jalan Ampang',openingHours:'24h',photos:['https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800'],isOpen:true,isHiddenGem:true,isTrending:false,transportOptions:[],description:'Serviced apartments with stunning city views'},
      { id:'fb41',slug:'boutique-hotel-kl',name:'KLoe Hotel',category:'HOTEL',rating:4.4,reviewCount:1800,priceLevel:2,lat:3.1480,lng:101.7090,city:'Kuala Lumpur',address:'Jalan Tun Razak',openingHours:'24h',photos:['https://images.unsplash.com/photo-1568084680786-586b91a09d72?w=800'],isOpen:true,isHiddenGem:true,isTrending:true,transportOptions:[],description:'Creative boutique hotel with courtyard pool and record store'},
      { id:'fb42',slug:'five-star-kl',name:'Shangri-La KL',category:'HOTEL',rating:4.6,reviewCount:7200,priceLevel:4,lat:3.1545,lng:101.7105,city:'Kuala Lumpur',address:'Jalan Sultan Ismail',openingHours:'24h',photos:['https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800'],isOpen:true,isHiddenGem:false,isTrending:false,transportOptions:[],description:'Classic 5-star luxury in the heart of KL'},
    ];
    return demos.map(p => ({ ...p, distance: Math.round(this.haversine(lat, lng, p.lat, p.lng)), transportOptions: this.calcTransport(Math.round(this.haversine(lat, lng, p.lat, p.lng))) })).filter(p => p.distance! <= radius);
  }

  async getPlaceDetails(placeId: string): Promise<any | null> {
    if (!API_KEY) return null;
    try {
      const url = new URL('https://maps.googleapis.com/maps/api/place/details/json');
      url.searchParams.set('place_id', placeId);
      url.searchParams.set('fields', 'name,formatted_address,formatted_phone_number,website,rating,user_ratings_total,photos,opening_hours,price_level,types,geometry,reviews,url');
      url.searchParams.set('key', API_KEY);
      url.searchParams.set('language', 'en');
      const res = await fetch(url.toString());
      const data = await res.json();
      if (data.status !== 'OK' || !data.result) return null;
      const r = data.result;
      return {
        id: placeId,
        name: r.name,
        address: r.formatted_address || r.vicinity,
        phone: r.formatted_phone_number || null,
        website: r.website || null,
        rating: r.rating || 0,
        reviewCount: r.user_ratings_total || 0,
        priceLevel: r.price_level || null,
        photos: (r.photos || []).slice(0, 10).map((p: any) =>
          `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${p.photo_reference}&key=${API_KEY}`
        ),
        openingHours: r.opening_hours?.weekday_text?.join(' | ') || (r.opening_hours?.open_now ? 'Open now' : 'Check hours'),
        isOpen: !!r.opening_hours?.open_now,
        googleUrl: r.url || `https://maps.google.com/?q=${r.geometry?.location?.lat},${r.geometry?.location?.lng}`,
        reviews: (r.reviews || []).slice(0, 5).map((rv: any) => ({
          author: rv.author_name,
          rating: rv.rating,
          text: rv.text,
          time: rv.relative_time_description,
        })),
        types: r.types || [],
        lat: r.geometry?.location?.lat,
        lng: r.geometry?.location?.lng,
      };
    } catch (e) { console.error('Place details error:', e); return null; }
  }

  async textSearch(query: string, lat: number, lng: number, limit = 60): Promise<PlaceResult[]> {
    if (!API_KEY || !query.trim()) return [];
    try {
      const url = new URL('https://maps.googleapis.com/maps/api/place/textsearch/json');
      url.searchParams.set('query', query);
      url.searchParams.set('location', `${lat},${lng}`);
      url.searchParams.set('key', API_KEY);
      url.searchParams.set('language', 'en');
      const res = await fetch(url.toString());
      const data = await res.json();
      // Transform results with accurate haversine distances, sorted nearest first
      // Use 800km radius to cover all of Malaysia (Peninsular + East Malaysia)
      const transformed = this.transformResults(data.results ?? [], lat, lng, 800000);
      const sorted = transformed.sort((a, b) => a.distance! - b.distance!).slice(0, limit);
      // Try to get more results via next page token if available
      if (sorted.length < limit && (data as any).next_page_token) {
        try {
          await new Promise(r => setTimeout(r, 2000)); // Google requires delay before using page token
          const url2 = new URL('https://maps.googleapis.com/maps/api/place/textsearch/json');
          url2.searchParams.set('pagetoken', (data as any).next_page_token);
          url2.searchParams.set('key', API_KEY);
          const res2 = await fetch(url2.toString());
          const data2 = await res2.json();
          const transformed2 = this.transformResults(data2.results ?? [], lat, lng, 800000);
          const merged = [...sorted, ...transformed2].sort((a, b) => a.distance! - b.distance!);
          // Deduplicate by place ID
          const seen = new Set<string>();
          const deduped = merged.filter(p => { if (seen.has(p.id)) return false; seen.add(p.id); return true; });
          return deduped.slice(0, limit);
        } catch {}
      }
      return sorted;
    } catch (e) { console.error('Text search error:', e); }
    // Fallback: search local database
    const q = query.toLowerCase();
    const fb = this.getFallbackPlaces(lat, lng, 800000).filter(p =>
      p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q) || p.city?.toLowerCase().includes(q)
    );
    return fb.sort((a, b) => a.distance! - b.distance!).slice(0, limit);
  }

  /** Search with fallback — merges local database when Google returns too few results */
  async textSearchWithFallback(query: string, lat: number, lng: number, limit = 60): Promise<PlaceResult[]> {
    return this.textSearch(query, lat, lng, limit).then(results => {
      if (results.length < 10) {
        const q = query.toLowerCase();
        const fb = this.getFallbackPlaces(lat, lng, 800000).filter(p =>
          p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q) || p.city?.toLowerCase().includes(q)
        );
        const seen = new Set(results.map(r => r.id));
        for (const f of fb) { if (!seen.has(f.id)) { results.push(f); seen.add(f.id); } }
      }
      return results;
    });
  }

  async findBySlug(slug: string): Promise<PlaceResult | null> {
    // For now, check fallback data since Google doesn't have slug lookup
    const fb = this.getFallbackPlaces(3.147, 101.708, 50000);
    return fb.find(p => p.slug === slug) ?? null;
  }

  getAIRecommendations(lat: number, lng: number) {
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning! ☀️' : hour < 17 ? 'Good afternoon! 🌤️' : 'Good evening! 🌙';
    const reason = hour < 12 ? 'Best breakfast & coffee nearby' : hour < 17 ? 'Perfect afternoon — shop, eat, explore' : 'Evening food adventures & trending spots';
    return { greeting, forYou: this.getFallbackPlaces(lat, lng, 15000).slice(0, 6), reasonForYou: reason };
  }

  generateDailyPlan(lat: number, lng: number) {
    const nearby = this.getFallbackPlaces(lat, lng, 15000);
    const food = nearby.filter(p => p.category === 'FOOD');
    const cafes = nearby.filter(p => p.category === 'CAFE');
    const malls = nearby.filter(p => p.category === 'SHOPPING_MALL');
    const stops: Array<{ time: string; placeName: string; category: string; description: string; transport: string }> = [];
    if (cafes[0]) stops.push({ time: '9:00 AM', placeName: cafes[0].name, category: '☕ Coffee', description: 'Specialty coffee to start your day', transport: (cafes[0].distance ?? 0) < 500 ? '🚶 Walk' : '🚕 Grab' });
    if (food[0]) stops.push({ time: '12:30 PM', placeName: food[0].name, category: '🍜 Lunch', description: 'Top-rated lunch nearby', transport: (food[0].distance ?? 0) < 500 ? '🚶 Walk' : '🚕 Grab' });
    if (malls[0]) stops.push({ time: '2:30 PM', placeName: malls[0].name, category: '🛍️ Shop', description: 'Explore nearby shopping', transport: (malls[0].distance ?? 0) < 1000 ? '🚶 Walk' : '🚕 Grab' });
    if (food[1]) stops.push({ time: '7:00 PM', placeName: food[1].name, category: '🍽️ Dinner', description: 'Evening dining', transport: (food[1].distance ?? 0) < 500 ? '🚶 Walk' : '🚕 Grab' });
    return { title: 'Your Day Plan ✨', stops: stops.filter(Boolean) };
  }
}
