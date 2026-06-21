import { Injectable } from '@nestjs/common';

export interface PlanStop { time: string; placeName: string; placeId?: string; category: string; description: string; cost: number; currency: string; transport: string; rating?: number; photos?: string[]; }
export interface PlanDay { day: number; theme: string; stops: PlanStop[]; dayTotalCost: number; }
export interface TripPlan { title: string; destination: string; totalBudget: number; totalCost: number; currency: string; days: PlanDay[]; tips: string[]; }

const OPENAI_KEY = process.env.OPENAI_API_KEY || '';
const GOOGLE_KEY = process.env.GOOGLE_MAPS_API_KEY || 'AIzaSyCyohvWiwbAd2UbDpOW-9Os0_eIo8JQ_D8';

const CITY_DB: Record<string, { name: string; cat: string; desc: string; cost: number; time: string }[]> = {
  'penang': [
    { name: 'Transfer Road Roti Canai', cat: '🍜 Breakfast', desc: 'Flaky roti canai since 1950s', cost: 5, time: 'morning' },
    { name: 'Toh Soon Cafe', cat: '☕ Breakfast', desc: 'Charcoal-toasted bread with kaya since 1959', cost: 6, time: 'morning' },
    { name: 'Penang Road Famous Cendol', cat: '🍧 Dessert', desc: 'Iconic shaved ice with coconut milk', cost: 4, time: 'afternoon' },
    { name: 'Nasi Kandar Line Clear', cat: '🍛 Lunch', desc: 'Legendary 24h nasi kandar', cost: 12, time: 'afternoon' },
    { name: 'Gurney Drive Hawker Centre', cat: '🍜 Dinner', desc: 'Seaside hawker centre, char kway teow', cost: 25, time: 'evening' },
    { name: 'Kek Lok Si Temple', cat: '🏛️ Attraction', desc: 'SE Asia largest Buddhist temple', cost: 8, time: 'morning' },
    { name: 'Pinang Peranakan Mansion', cat: '🏛️ Culture', desc: 'Straits Chinese heritage museum', cost: 20, time: 'afternoon' },
    { name: 'Penang Hill Funicular', cat: '🏔️ Nature', desc: 'Cool mountain air, 360° views', cost: 30, time: 'afternoon' },
    { name: 'Chew Jetty', cat: '🏛️ Heritage', desc: 'Historic waterfront settlements', cost: 0, time: 'morning' },
    { name: 'Chulia Street Night Hawkers', cat: '🍜 Dinner', desc: 'Wanton mee, curry mee, lok-lok', cost: 20, time: 'night' },
    { name: 'Air Itam Morning Market', cat: '🛍️ Market', desc: 'Bustling wet market, local breakfast', cost: 10, time: 'morning' },
    { name: 'Batu Ferringhi Beach', cat: '🏖️ Beach', desc: 'Sandy shores, water sports', cost: 0, time: 'afternoon' },
    { name: 'Penang National Park', cat: '🥾 Nature', desc: 'Coastal hike to turtle beach', cost: 0, time: 'morning' },
    { name: 'Hin Bus Depot', cat: '🎨 Art', desc: 'Contemporary art space', cost: 0, time: 'afternoon' },
    { name: 'Batu Ferringhi Night Market', cat: '🛍️ Market', desc: 'Beachside pasar malam', cost: 15, time: 'night' },
    { name: 'Eastern & Oriental Hotel', cat: '🏨 Hotel', desc: 'Historic 5-star heritage hotel by the sea', cost: 250, time: 'evening' },
    { name: 'Cheong Fatt Tze Blue Mansion', cat: '🏨 Hotel', desc: 'UNESCO award-winning boutique heritage hotel', cost: 180, time: 'evening' },
    { name: 'JEN Penang Georgetown', cat: '🏨 Hotel', desc: 'Modern hotel in the heart of Georgetown', cost: 120, time: 'evening' },
  ],
  'kl': [
    { name: 'Nasi Lemak Tanglin', cat: '🍜 Breakfast', desc: 'Legendary nasi lemak since 1948', cost: 8, time: 'morning' },
    { name: 'VCR Coffee & Cafe', cat: '☕ Breakfast', desc: 'Specialty coffee in restored building', cost: 30, time: 'morning' },
    { name: 'Petronas Twin Towers', cat: '🏛️ Attraction', desc: '452m iconic towers, sky bridge', cost: 80, time: 'morning' },
    { name: 'Jalan Alor Food Street', cat: '🍜 Dinner', desc: 'KL most famous food street', cost: 25, time: 'evening' },
    { name: 'Batu Caves', cat: '🏛️ Temple', desc: '272 rainbow steps to cave temple', cost: 0, time: 'morning' },
    { name: 'Lot 10 Hutong Food Court', cat: '🍜 Lunch', desc: 'Curated heritage hawker stalls', cost: 15, time: 'afternoon' },
    { name: 'Islamic Arts Museum', cat: '🏛️ Museum', desc: 'World-class Islamic art collection', cost: 14, time: 'afternoon' },
    { name: 'Perdana Botanical Gardens', cat: '🌳 Nature', desc: '91-hectare tranquil gardens', cost: 0, time: 'afternoon' },
    { name: 'Heli Lounge Bar', cat: '🍸 Nightlife', desc: 'Rooftop bar on helipad', cost: 40, time: 'night' },
    { name: 'Thean Hou Temple', cat: '🏛️ Temple', desc: '6-tier Chinese temple, city views', cost: 0, time: 'afternoon' },
    { name: 'Pavilion KL', cat: '🛍️ Shopping', desc: '700+ stores, luxury to affordable', cost: 0, time: 'afternoon' },
    { name: 'Kwai Chai Hong', cat: '🎨 Art', desc: 'Instagram-famous hidden murals', cost: 0, time: 'afternoon' },
    { name: 'Kampung Baru', cat: '🍜 Dinner', desc: 'Traditional Malay village street food', cost: 20, time: 'evening' },
    { name: 'KLCC Park', cat: '🌳 Nature', desc: 'Beautiful park at Twin Towers', cost: 0, time: 'afternoon' },
    { name: 'Central Market', cat: '🛍️ Market', desc: 'Art deco heritage market', cost: 0, time: 'afternoon' },
    { name: 'Mandarin Oriental KL', cat: '🏨 Hotel', desc: '5-star luxury at the foot of Petronas Towers', cost: 350, time: 'evening' },
    { name: 'Traders Hotel KL', cat: '🏨 Hotel', desc: 'Stunning Twin Towers view from rooftop pool', cost: 200, time: 'evening' },
    { name: 'Aloft KL Sentral', cat: '🏨 Hotel', desc: 'Modern design hotel connected to KL Sentral', cost: 150, time: 'evening' },
  ],
  'langkawi': [
    { name: 'Pantai Cenang', cat: '🏖️ Beach', desc: 'Popular beach with bars and sports', cost: 0, time: 'afternoon' },
    { name: 'Langkawi Sky Bridge', cat: '🏔️ Attraction', desc: 'Curved bridge 700m above sea', cost: 30, time: 'morning' },
    { name: 'Kilim Geoforest Park', cat: '🥾 Nature', desc: 'Mangrove tour, eagles, limestone', cost: 80, time: 'morning' },
    { name: 'Night Market Langkawi', cat: '🍜 Dinner', desc: 'Rotating night market, seafood', cost: 20, time: 'evening' },
    { name: 'Tanjung Rhu Beach', cat: '🏖️ Beach', desc: 'Secluded crystal-clear waters', cost: 0, time: 'afternoon' },
    { name: 'Cable Car Machinchang', cat: '🏔️ Attraction', desc: 'Steepest cable car, panoramic views', cost: 55, time: 'morning' },
    { name: 'Dataran Lang Eagle Square', cat: '🏛️ Landmark', desc: 'Iconic 12m eagle statue', cost: 0, time: 'afternoon' },
    { name: 'Seven Wells Waterfall', cat: '🥾 Nature', desc: 'Natural rock pools in jungle', cost: 0, time: 'morning' },
  ],
  'melaka': [
    { name: 'Jonker Street Night Market', cat: '🛍️ Market', desc: 'Weekend night market', cost: 15, time: 'evening' },
    { name: 'Nancy Kitchen', cat: '🍜 Lunch', desc: 'Authentic Peranakan Nyonya cuisine', cost: 25, time: 'afternoon' },
    { name: 'A Famosa & St Paul Hill', cat: '🏛️ Heritage', desc: '16th-century Portuguese fortress', cost: 0, time: 'morning' },
    { name: 'The Daily Fix Cafe', cat: '☕ Breakfast', desc: 'Heritage cafe, pandan pancakes', cost: 20, time: 'morning' },
    { name: 'Melaka River Cruise', cat: '🏛️ Attraction', desc: 'Scenic boat ride along river', cost: 20, time: 'afternoon' },
    { name: 'Christ Church Dutch Square', cat: '🏛️ Heritage', desc: 'Iconic red Dutch colonial buildings', cost: 0, time: 'morning' },
    { name: 'Banana Leaf Restaurant', cat: '🍜 Lunch', desc: 'Authentic banana leaf rice', cost: 12, time: 'afternoon' },
    { name: 'Encore Melaka Theatre', cat: '🎭 Show', desc: 'Immersive 360° theatre', cost: 80, time: 'evening' },
  ],
};

const TIPS = [
  'Most hawker stalls are cash-only — carry RM 50-100 in small notes',
  'Grab is affordable (RM 5-15 per ride)',
  'Check opening hours — some places close on Mondays',
  'Go early for popular spots to beat the crowds and heat',
  'Bring an umbrella — afternoon showers are common',
  'Wear comfortable walking shoes',
  'Download offline maps for areas with poor reception',
  'Try local drinks — teh tarik, cendol, nutmeg juice',
  'Dress modestly at religious sites',
  'Use MRT/LRT for city travel — cheap and avoids traffic',
  'Book popular attractions online to skip queues',
  'Street food is where you find Malaysia best flavors',
];

@Injectable()
export class AiService {
  async planTrip(destination: string, duration: number, budget: number, interests: string[]): Promise<TripPlan> {
    if (OPENAI_KEY) {
      try {
        const prompt = this.buildPrompt(destination, duration, budget, interests);
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_KEY}` },
          body: JSON.stringify({ model: 'gpt-4o', messages: [{ role: 'user', content: prompt }], temperature: 0.8, max_tokens: 2000, response_format: { type: 'json_object' } }),
        });
        if (res.ok) {
          const data = await res.json();
          const parsed = JSON.parse(data.choices?.[0]?.message?.content || '{}');
          if (parsed.days) return { ...parsed, totalBudget: budget };
        }
      } catch (e) { console.error('OpenAI error:', e); }
    }
    return this.generateSmart(destination, duration, budget, interests);
  }

  private buildPrompt(dest: string, dur: number, budget: number, interests: string[]): string {
    return `Create a ${dur}-day trip plan for ${dest}. Budget: ${budget} (local currency). Interests: ${interests.join(', ')}.
Return valid JSON:
{ "title": "Creative trip title", "destination": "${dest}", "days": [
  { "day": 1, "theme": "Day theme", "stops": [
    { "time": "8:00 AM", "placeName": "Real place name", "category": "emoji category", "description": "1 sentence", "cost": number, "transport": "Walk/Grab/Drive" }
  ], "dayTotalCost": number }
], "tips": ["tip1", "tip2"], "totalCost": number }
Rules: Total cost MUST be within budget ${budget}. Use real place names. Each day 3-5 stops. Make it unique.`;
  }

  // Use our own Places API (already works with Google) to get nearby places for any destination
  private async fetchNearbyViaAPI(dest: string): Promise<{ name: string; placeId?: string; cat: string; desc: string; cost: number; time: string; rating?: number; photos?: string[] }[]> {
    try {
      const geoUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(dest)}&key=${GOOGLE_KEY}`;
      const geoRes = await fetch(geoUrl); const geoData = await geoRes.json();
      if (!geoData.results?.[0]) return [];
      const loc = geoData.results[0].geometry.location;
      const nearbyUrl = `http://127.0.0.1:3001/api/v1/places/nearby?lat=${loc.lat}&lng=${loc.lng}&radius=15000&limit=50`;
      const nearbyRes = await fetch(nearbyUrl); const nearbyData = await nearbyRes.json();
      return (nearbyData.data || []).map((p: any) => ({
        name: p.name, placeId: p.id,
        cat: p.category === 'CAFE' ? '☕ Cafe' : p.category === 'FOOD' ? '🍜 Food' : p.category === 'SHOPPING_MALL' ? '🛍️ Shopping' : p.category === 'HOTEL' ? '🏨 Hotel' : '🏛️ Attraction',
        desc: p.address || dest, cost: (p.priceLevel || 1) * 25 || 20,
        time: p.category === 'CAFE' ? 'morning' : p.category === 'FOOD' ? 'evening' : 'afternoon',
        rating: p.rating, photos: p.photos || [],
      }));
    } catch { return []; }
  }

  private async fetchGooglePlaces(dest: string): Promise<{ name: string; placeId?: string; cat: string; desc: string; cost: number; time: string; rating?: number; photos?: string[] }[]> {
    if (!GOOGLE_KEY) return [];
    try {
      const geoUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(dest)}&key=${GOOGLE_KEY}`;
      const geoRes = await fetch(geoUrl); const geoData = await geoRes.json();
      if (!geoData.results?.[0]) return [];
      const loc = geoData.results[0].geometry.location;

      const types = ['restaurant', 'cafe', 'tourist+attraction', 'shopping+mall', 'lodging'];
      const allResults: any[] = [];
      for (const t of types) {
        const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${loc.lat},${loc.lng}&radius=15000&type=${t}&key=${GOOGLE_KEY}`;
        const res = await fetch(url); const data = await res.json();
        allResults.push(...(data.results || []));
      }

      const cur = this.getCurrency(dest);
      const currencyCostMap: Record<string, number[]> = {
        MYR: [0, 15, 40, 80, 200], JPY: [0, 500, 1500, 4000, 10000],
        SGD: [0, 5, 15, 30, 80], THB: [0, 100, 300, 800, 2000],
        IDR: [0, 30000, 100000, 250000, 600000], KRW: [0, 5000, 15000, 40000, 100000],
        USD: [0, 10, 25, 60, 150], EUR: [0, 10, 25, 60, 150],
        GBP: [0, 8, 20, 50, 120], AUD: [0, 15, 40, 80, 200],
      };
      // Hotels cost 5-10x more than restaurants
      const hotelCostMap: Record<string, number[]> = {
        MYR: [0, 80, 200, 500, 1200], JPY: [0, 3000, 8000, 20000, 50000],
        SGD: [0, 30, 80, 200, 500], THB: [0, 500, 1500, 4000, 10000],
        IDR: [0, 150000, 500000, 1200000, 3000000], KRW: [0, 30000, 80000, 200000, 500000],
        USD: [0, 50, 120, 300, 800], EUR: [0, 50, 120, 300, 800],
        GBP: [0, 40, 100, 250, 600], AUD: [0, 60, 150, 400, 1000],
      };
      const costs = currencyCostMap[cur] || currencyCostMap['MYR'];
      const hotelCosts = hotelCostMap[cur] || hotelCostMap['MYR'];

      return allResults.slice(0, 40).map((p: any) => {
        const types = (p.types || []).join(' ');
        const isHotel = types.includes('lodging') || types.includes('hotel');
        const priceLevel = p.price_level || 1;
        return {
          name: p.name, placeId: p.place_id,
          cat: isHotel ? '🏨 Hotel' : types.includes('cafe') ? '☕ Cafe' : types.includes('restaurant') ? '🍜 Food' : types.includes('mall') ? '🛍️ Shopping' : '🏛️ Attraction',
          desc: p.vicinity || dest,
          cost: isHotel ? hotelCosts[priceLevel] || hotelCosts[1] : costs[priceLevel] || costs[1],
          rating: p.rating || 0,
          photos: p.photos ? [`https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${p.photos[0].photo_reference}&key=${GOOGLE_KEY}`] : [],
          time: isHotel ? 'hotel' :
                p.name.toLowerCase().includes('night') || p.name.toLowerCase().includes('bar') || p.name.toLowerCase().includes('pub') ? 'night' :
                p.name.toLowerCase().includes('breakfast') || p.name.toLowerCase().includes('coffee') || p.name.toLowerCase().includes('roti') || p.name.toLowerCase().includes('bakery') ? 'morning' :
                p.name.toLowerCase().includes('lunch') || p.name.toLowerCase().includes('nasi') || p.name.toLowerCase().includes('restaurant') ? 'lunch' :
                p.name.toLowerCase().includes('mall') || p.name.toLowerCase().includes('museum') || p.name.toLowerCase().includes('temple') ? 'afternoon' :
                ['morning', 'afternoon', 'evening'][Math.floor(Math.random() * 3)],
        };
      });
    } catch { return []; }
  }

  private expandDest(dest: string): string {
    const d = dest.toLowerCase().trim();
    const map: Record<string, string> = {
      'jb': 'Johor Bahru', 'kl': 'Kuala Lumpur', 'klcc': 'Kuala Lumpur',
      'pg': 'Penang', 'kg': 'Kuala Lumpur', 'melaka': 'Melaka',
      'kk': 'Kota Kinabalu', 'cam': 'Cameron Highlands',
    };
    return map[d] || dest;
  }

  private getLocalPool(dest: string): { name: string; cat: string; desc: string; cost: number; time: string }[] {
    const d = dest.toLowerCase().trim();
    if (d.includes('penang') || d.includes('george town')) return [...CITY_DB['penang']];
    if (d.includes('kl') || d.includes('kuala lumpur')) return [...CITY_DB['kl']];
    if (d.includes('langkawi')) return [...CITY_DB['langkawi']];
    if (d.includes('melaka') || d.includes('malacca')) return [...CITY_DB['melaka']];
    return [];
  }

  private async generateSmart(dest: string, dur: number, budget: number, interests: string[]): Promise<TripPlan> {
    const fullDest = this.expandDest(dest);
    let localPool = this.getLocalPool(fullDest);
    // Always supplement with Google Places for more variety and budget filling
    const googlePool = await this.fetchNearbyViaAPI(fullDest);
    let pool = [...localPool, ...googlePool];

    // For non-local destinations, use the Places API endpoint (which already works)
    if (pool.length === 0) {
      try {
        // Geocode to get coordinates
        const geoUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(fullDest)}&key=${GOOGLE_KEY}`;
        const geoRes = await fetch(geoUrl); const geoData = await geoRes.json();
        if (geoData.results?.[0]) {
          const loc = geoData.results[0].geometry.location;
          // Use our own Places API to get nearby places (this already works perfectly)
          const nearbyUrl = `http://127.0.0.1:3001/api/v1/places/nearby?lat=${loc.lat}&lng=${loc.lng}&radius=15000&limit=40`;
          const nearbyRes = await fetch(nearbyUrl); const nearbyData = await nearbyRes.json();
          const googleResults = (nearbyData.data || []).map((p: any) => ({
            name: p.name, placeId: p.id,
            cat: p.category === 'CAFE' ? '☕ Cafe' : p.category === 'FOOD' ? '🍜 Food' : p.category === 'SHOPPING_MALL' ? '🛍️ Shopping' : p.category === 'HOTEL' ? '🏨 Hotel' : '🏛️ Attraction',
            desc: p.address || fullDest,
            cost: p.priceLevel === 0 ? 5 : (p.priceLevel || 1) * 25,
            time: p.category === 'CAFE' ? 'morning' : p.category === 'FOOD' ? 'evening' : 'afternoon',
            rating: p.rating,
            photos: p.photos || [],
          }));
          pool = googleResults;
        }
      } catch (e) { console.error('Places fetch error:', e); }
    }

    if (pool.length === 0) pool = [...CITY_DB['penang']];

    const shuffled = pool.sort(() => Math.random() - 0.5);
    const hotels = shuffled.filter(p => p.cat === '🏨 Hotel');
    const nonHotels = shuffled.filter(p => p.cat !== '🏨 Hotel');
    const perDayBase = Math.floor(budget / dur);
    // Reserve ~20% for accommodation per night
    const hotelBudget = Math.floor(budget * 0.2 / dur);

    const isFood = interests.some(i => /food|culinary|eat/i.test(i));
    const isCulture = interests.some(i => /cultur|heritage|history|museum/i.test(i));
    const isNature = interests.some(i => /nature|hiking|outdoor|beach|adventure/i.test(i));

    const days: PlanDay[] = [];
    const dayUsed = new Set<string>();
    let spent = 0;

    // Fixed time slots for full-day coverage
    const TIME_SLOTS: { time: string; filter: string[] }[] = [
      { time: '8:00 AM', filter: ['morning'] },
      { time: '10:30 AM', filter: ['morning', 'afternoon'] },
      { time: '1:00 PM', filter: ['lunch', 'afternoon'] },
      { time: '3:30 PM', filter: ['afternoon'] },
      { time: '6:00 PM', filter: ['evening'] },
      { time: '8:30 PM', filter: ['evening', 'night'] },
    ];

    // First pass: generate minimum stops for each day
    for (let d = 1; d <= dur; d++) {
      dayUsed.clear(); // Allow same places across different days
      const remaining = budget - spent;
      const dayBudget = Math.floor(remaining / (dur - d + 1));
      const maxStopCost = Math.floor(dayBudget / 2); // More generous
      const stops: PlanStop[] = [];
      let dayCost = 0;

      // Hotel for first day only (or every other day for longer trips)
      if (d === 1 || (dur > 3 && d % 2 === 0)) {
        const availHotels = hotels.filter(h => h.cost <= dayBudget * 0.5 && !dayUsed.has(h.name));
        if (availHotels.length > 0) {
          const hotel = availHotels[Math.floor(Math.random() * Math.min(availHotels.length, 3))]!;
          dayUsed.add(hotel.name);
          stops.push({ time: '🏨 Stay', placeName: hotel.name, placeId: (hotel as any).placeId, category: '🏨 Hotel', description: hotel.desc, cost: hotel.cost, currency: 'MYR', transport: '—', rating: (hotel as any).rating, photos: (hotel as any).photos });
          dayCost += hotel.cost;
        }
      }

      // Fill day with stops — fill up to ~85% of day budget
      for (const slot of TIME_SLOTS) {
        if (dayCost > dayBudget * 0.85) break;
        let matching = nonHotels.filter(p => slot.filter.includes(p.time) && p.cost <= maxStopCost && !dayUsed.has(p.name) && dayCost + p.cost <= dayBudget);
        if (matching.length === 0) matching = nonHotels.filter(p => p.cost <= maxStopCost && !dayUsed.has(p.name) && dayCost + p.cost <= dayBudget);
        if (matching.length === 0) continue;
        const pick = matching[Math.floor(Math.random() * Math.min(matching.length, 5))]!;
        dayUsed.add(pick.name);
        stops.push({ time: slot.time, placeName: pick.name, placeId: (pick as any).placeId, category: pick.cat, description: pick.desc, cost: pick.cost, currency: 'MYR', transport: pick.cost < 15 ? '🚶 Walk' : '🚕 Grab', rating: (pick as any).rating, photos: (pick as any).photos });
        dayCost += pick.cost;
      }

      // Ensure at least 2 stops per day
      if (stops.length < 3) {
        const extra = nonHotels.filter(p => !dayUsed.has(p.name) && dayCost + p.cost <= dayBudget).slice(0, 3 - stops.length);
        for (const p of extra) {
          dayUsed.add(p.name);
          stops.push({ time: '12:00 PM', placeName: p.name, placeId: (p as any).placeId, category: p.cat, description: p.desc, cost: p.cost, currency: 'MYR', transport: '🚕 Grab', rating: (p as any).rating, photos: (p as any).photos });
          dayCost += p.cost;
        }
      }

      const transportCost = stops.length * 5;
      const dayTotal = dayCost + transportCost;
      spent += dayTotal;

      const themePool = isFood ? ['Food Trail', 'Culinary Journey', 'Taste Adventure'] :
                        isCulture ? ['Heritage Walk', 'Culture Deep Dive', 'History Explorer'] :
                        isNature ? ['Nature Escape', 'Outdoor Adventure', 'Scenic Journey'] :
                        ['City Explorer', 'Hidden Gems', 'Local Experience'];
      const theme = themePool[d % themePool.length]!;

      days.push({ day: d, theme: `${theme} 🔹`, stops, dayTotalCost: dayTotal || 5 });
    }

    // Second pass: aggressive fill to get close to budget
    let totalCost = days.reduce((s, d) => s + d.dayTotalCost, 0);
    let fillAttempts = 0;
    while (totalCost < budget - 30 && fillAttempts < 50) {
      fillAttempts++;
      const cheapest = days.reduce((min, d) => d.dayTotalCost < min.dayTotalCost ? d : min, days[0]!);
      // Allow reusing places in fill mode
      const available = nonHotels.filter(p => p.cost + 5 <= budget - totalCost);
      if (available.length === 0) break;
      const pick = available[Math.floor(Math.random() * Math.min(available.length, 10))]!;
      cheapest.stops.push({ time: '12:00 PM', placeName: pick.name, placeId: (pick as any).placeId, category: pick.cat, description: pick.desc, cost: pick.cost, currency: 'MYR', transport: '🚕 Grab', rating: (pick as any).rating, photos: (pick as any).photos });
      cheapest.dayTotalCost += pick.cost + 5;
      totalCost += pick.cost + 5;
    }

    const titles = [
      `${dur}-Day ${dest} ${isFood ? 'Food' : ''} ${isCulture ? 'Culture' : ''} ${isNature ? 'Nature' : ''} Adventure`,
      `Discover ${dest}: A ${dur}-Day Journey`,
      `${dest} Unveiled: ${dur} Days of Wonder`,
      `The Ultimate ${dur}-Day ${dest} Experience`,
    ];

    const currency = this.getCurrency(dest);
    const finalCost = days.reduce((s, d) => s + d.dayTotalCost, 0);
    return {
      title: titles[Math.floor(Math.random() * titles.length)]!,
      destination: dest, totalBudget: budget,
      totalCost: Math.round(finalCost),
      currency,
      days: days.filter(d => d.stops.length > 0).map(d => ({
        ...d,
        stops: d.stops.map(s => ({ ...s, currency })),
      })),
      tips: [...TIPS].sort(() => Math.random() - 0.5).slice(0, 3 + Math.floor(Math.random() * 3)),
    };
  }

  private getCurrency(dest: string): string {
    const d = dest.toLowerCase();
    if (/singapore/.test(d)) return 'SGD';
    if (/thailand|bangkok|phuket/.test(d)) return 'THB';
    if (/indonesia|bali|jakarta/.test(d)) return 'IDR';
    if (/japan|tokyo|osaka/.test(d)) return 'JPY';
    if (/korea|seoul/.test(d)) return 'KRW';
    if (/vietnam|hanoi|ho chi minh/.test(d)) return 'VND';
    if (/usa|new york|los angeles|miami/.test(d)) return 'USD';
    if (/uk|london/.test(d)) return 'GBP';
    if (/euro|paris|france|germany|italy|spain/.test(d)) return 'EUR';
    if (/australia|sydney/.test(d)) return 'AUD';
    if (/dubai|uae/.test(d)) return 'AED';
    if (/hong kong/.test(d)) return 'HKD';
    if (/taiwan|taipei/.test(d)) return 'TWD';
    if (/philippines|manila/.test(d)) return 'PHP';
    if (/china|beijing|shanghai/.test(d)) return 'CNY';
    return 'MYR';
  }
}
