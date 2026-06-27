import { NextResponse } from 'next/server';

const KEY = process.env.DEEPSEEK_API_KEY || '';

// Track recently used places to avoid repeats across generations
const recentPlaces: string[] = [];

export async function POST(request: Request) {
  const body = await request.json();
  const { destination, destinationLat, destinationLng, startDate, endDate, budget = 500, transportMode = 'DRIVING', groupType = 'COUPLE', travelStyles = [], groupSize = 2 } = body;

  if (!KEY) return NextResponse.json({ error: 'AI key missing' }, { status: 500 });

  const days = Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000) + 1;
  const seed = Date.now() % 99999;
  const stopsPerDay = travelStyles.includes('NIGHT') ? 8 : 7;
  const endTime = travelStyles.includes('NIGHT') ? '11PM' : '8:30PM';

  // ─── Style-specific PROFESSIONAL instructions ───
  const styleMap: Record<string, string> = {
    FOODIE: 'MUST build the ENTIRE itinerary around food discovery. Every stop must be a food/drink venue: hawker stalls, kopitiams, seafood restaurants, night markets, hipster cafes, fine dining, local breakfast spots. 70% of stops must be food-related. Include specific dish names (e.g. "Penang Char Kuey Teow", "Ikan Bakar", "Nasi Kandar").',
    ADVENTURE: 'MUST focus on adrenaline & outdoor activities: hiking trails, waterfall treks, cave exploration, zip-lining, ATV rides, white water rafting, rock climbing, paragliding, scuba diving, jungle trekking. Prioritize physically active experiences.',
    CULTURAL: 'MUST focus on heritage & arts: UNESCO sites, museums, temples, mosques, churches, historical landmarks, batik workshops, cultural performances, art galleries, traditional villages, street art tours.',
    NATURE: 'MUST focus on natural wonders: waterfalls, beaches, mountains, rainforest walks, sunrise/sunset viewpoints, national parks, bird watching, hot springs, lakes, island hopping, mangroves.',
    PHOTO: 'MUST prioritize Instagram-worthy locations: iconic viewpoints, colorful street art, unique architecture, infinity pools, sunset spots, neon-lit streets, heritage buildings, flower parks, sky bars with city views.',
    LUXURY: 'MUST focus on premium experiences: fine dining, rooftop bars, 5-star hotel restaurants, private tours, yacht cruises, spa treatments, high tea, designer shopping, golf courses, wine tasting.',
    BUDGET: 'MUST focus on affordable experiences: street food, free attractions, public parks, budget-friendly local eats, walking tours, night markets, free museums, cheap hawker centers.',
    NIGHT: 'MUST include vibrant nightlife: rooftop bars, speakeasies, night markets, live music venues, clubs, midnight supper spots, night street food, evening cruises,夜市.',
  };
  const styleInstr = travelStyles.map((s: string) => styleMap[s] || '').filter(Boolean).join('\n');

  // ─── Build "avoid" list for uniqueness ───
  const avoidList = recentPlaces.length > 0
    ? `\n🚫 FORBIDDEN PLACES (DO NOT use any of these — they were used in recent generations):\n${recentPlaces.slice(-60).map(p => `- ${p}`).join('\n')}\nYou MUST generate COMPLETELY DIFFERENT places not on this list.`
    : '';

  // ─── Professional prompt ───
  const prompt = `You are a professional travel curator for a luxury travel platform (like Agoda/Trip.com). Create a meticulously detailed ${days}-day itinerary for ${destination}, Malaysia.

📊 TRIP PARAMETERS:
- Duration: ${days} day${days > 1 ? 's' : ''}, ${days - 1} night${days - 1 !== 1 ? 's' : ''}
- Budget: RM ${budget} total (for ${groupSize} ${groupType.toLowerCase()} traveler${groupSize > 1 ? 's' : ''})
- Transport: ${transportMode}
- Travel Styles: ${travelStyles.join(', ')}
- Daily schedule: ${stopsPerDay} stops from 8:00 AM to ${endTime}
- Random seed: ${seed} (guarantees this itinerary is unique)

🎯 TRAVEL STYLE REQUIREMENTS (follow ALL simultaneously):
${styleInstr}

📋 CRITICAL RULES — FOLLOW EXACTLY:
1. Generate EXACTLY ${stopsPerDay} UNIQUE stops per day. Every stop must be a DIFFERENT real place.
2. EVERY place name MUST be a real, verifiable venue in ${destination} that exists on Google Maps. No made-up names.
3. Time slots: 8AM(Breakfast) → 10AM(Morning Activity) → 12PM(Lunch) → 2PM(Afternoon Attraction) → 4PM(Snack/Rest/Cafe) → 6PM(Dinner) → 8PM(Dessert/Drinks/Sunset)${travelStyles.includes('NIGHT') ? ' → 10PM(Nightlife/Bar/Club/Supper)' : ''}
4. EVERY stop MUST have a UNIQUE estimatedSpend (RM5 minimum, no two stops same price). Use realistic 2026 Malaysian prices.
5. At least ${Math.max(3, Math.floor(days * 2))} stops MUST be "hidden gems" (high-rated but <100 Google reviews, off the tourist trail, local secrets).
6. At least ${Math.max(3, days)} stops per day must be photo-worthy (isPhotoSpot: true) with great lighting/scenery.
7. Total daily spend MUST stay within RM ${Math.round(budget / days)} per day.
8. ALL coordinates must be accurate to 4 decimal places (use real Google Maps coordinates for each venue).
9. Generate places that have NEVER been used in previous generations — be creative and diverse.${avoidList}

🏨 WHERE TO STAY — Generate EXACTLY 8 REAL hotels (2 budget, 3 mid-range, 3 luxury). Each hotel MUST have:
- "name": Real hotel name in ${destination} (e.g. "Eastern & Oriental Hotel", "Shangri-La Rasa Sayang")
- "type": "budget", "mid", or "luxury"
- "pricePerNight": Realistic MYR price (budget: RM50-180, mid: RM180-400, luxury: RM400-800+)
- "description": 4-5 sentence professional description covering: location convenience, signature amenities, room highlights, why couples/families/solo travelers love it, nearby attractions. Write like a Trip.com/Agoda editor.
- "lat"/"lng": Accurate to 4 decimal places
- "rating": Realistic Google rating (3.5-4.9)
- "starRating": Actual star rating (2-5 stars) matching the hotel's real category
- "amenities": Array of real amenities, e.g. ["Pool", "Free WiFi", "Spa", "Gym", "Beach Access", "Restaurant", "Room Service", "Parking"]
- "address": Full address string
- "reviewCount": Realistic review count (budget: 50-500, mid: 200-2000, luxury: 500-5000)
- "photoUrl": Empty string (we fill this client-side)

🍜 LOCAL CUISINE — Include 5-8 MUST-TRY dishes with:
- "name": Local dish name
- "description": 2-sentence description of what it is and why it's special
- "avgPrice": Realistic MYR price range (RM5-50)
- "mustTry": true for the top 3, false for others

💡 AI TIPS — Include 4-6 practical travel tips specific to ${destination} (best time to visit attractions, local customs, transport hacks, money-saving tips, safety notes).

📸 BEST PHOTO SPOTS — Include 4-6 specific photo locations in ${destination} with descriptions.

🗺️ ROADTRIP — If ${transportMode} is DRIVING, include:
- "totalDistance": reasonable round-trip estimate in meters
- "totalDrivingTime": in minutes
- "fuelCost": realistic MYR fuel cost (RM2.05/L)
- "tollCost": highway toll estimate
- "stops": 1-3 recommended rest stops with name, lat, lng, reason

📤 OUTPUT FORMAT: Return ONLY valid JSON (no markdown, no explanation). Structure:
{
  "title": "Catchy trip title",
  "destination": "${destination}",
  "startDate": "${startDate}",
  "endDate": "${endDate}",
  "totalCost": ${budget},
  "totalStops": number,
  "hiddenGemCount": number,
  "groupSize": ${groupSize},
  "days": [{ "dayNumber": 1, "date": "YYYY-MM-DD", "theme": "Day theme", "weather": {"condition": "Sunny/Rainy/Cloudy", "tempMin": 24, "tempMax": 33, "rainChance": 30, "humidity": 75}, "stops": [{ "placeName": "...", "time": "08:00", "duration": "1.5h", "description": "2-3 sentence professional description", "lat": 0.0, "lng": 0.0, "category": "FOOD/TOURIST_ATTRACTION/NATURE/CAFE/NIGHTLIFE/SHOPPING", "rating": 4.3, "photoUrl": "", "emoji": "🍜", "estimatedSpend": 25, "entryFee": 0, "isHiddenGem": false, "isPhotoSpot": true, "mustTry": "signature dish name", "transportFromPrev": {"mode": "DRIVING", "distance": 3000, "time": 10, "cost": 5} }], "dayTotalCost": number, "dayTotalDistance": 5000, "dayTotalTime": 240, "breakfastSpot": "cafe name", "lunchSpot": "restaurant name", "dinnerSpot": "restaurant name" }],
  "budgetBreakdown": { "accommodation": number, "food": number, "transport": number, "activities": number, "shopping": number, "misc": number, "total": number, "savingsTips": ["tip1", "tip2"] },
  "roadtrip": { "totalDistance": number, "totalDrivingTime": number, "fuelCost": number, "tollCost": number, "stops": [{"name":"...","lat":0,"lng":0,"reason":"..."}] },
  "bestPhotoSpots": [{"name":"...","description":"...","bestTime":"golden hour 6PM-7PM"}],
  "aiTips": ["...", "..."],
  "localCuisine": [{"name":"...","description":"...","avgPrice":15,"mustTry":true}],
  "whereToStay": [{"name":"...","type":"budget","pricePerNight":120,"description":"4-5 sentences...","lat":0,"lng":0,"rating":4.2,"starRating":3,"amenities":["Pool","WiFi"],"address":"123 Jalan Example","reviewCount":850,"photoUrl":""}]
}`;

  // Try up to 2 times
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${KEY}` },
        body: JSON.stringify({ model: 'deepseek-chat', messages: [{ role: 'system', content: 'You are a professional travel curator for Agoda/Trip.com. Output ONLY valid JSON, no markdown, no explanation. Every place must be REAL and VERIFIABLE on Google Maps. Generate UNIQUE places that have never been suggested before. Be creative, thorough, and professional.' }, { role: 'user', content: prompt }], temperature: 0.95, max_tokens: 6000 }),
      });

      if (!res.ok) {
        if (attempt < 1) continue;
        return NextResponse.json({ error: `AI service error ${res.status}` }, { status: 502 });
      }

      const json = await res.json();
      const content = json.choices?.[0]?.message?.content || '';
      const start = content.indexOf('{');
      const end = content.lastIndexOf('}');
      if (start < 0 || end <= start) {
        if (attempt < 1) continue;
        return NextResponse.json({ error: 'AI returned no JSON' }, { status: 500 });
      }

      // Aggressive JSON cleaning
      let clean = content.substring(start, end + 1)
        .replace(/\s+/g, ' ')
        .replace(/}\s*{/g, '},{')
        .replace(/]\s*\[/g, '],[')
        .replace(/}\s*\[/g, '},[')
        .replace(/]\s*{/g, '],{')
        .replace(/"\s*,\s*}/g, '"}')
        .replace(/"\s*,\s*]/g, '"]')
        .replace(/,,/g, ',');

      try {
        const raw = JSON.parse(clean);
        const plan: any = {
          title: raw.title || raw.tripName || `${days}-Day ${destination} Trip`,
          destination: raw.destination || destination,
          startDate: raw.startDate || startDate,
          endDate: raw.endDate || endDate,
          totalCost: raw.totalCost || budget,
          totalStops: raw.totalStops || (raw.days?.reduce((s: number, d: any) => s + (d.stops?.length || 0), 0) || 0),
          hiddenGemCount: raw.hiddenGemCount || raw.hidden_gem_count || 2,
          groupSize: raw.groupSize || groupSize,
          days: (raw.days || []).map((d: any) => ({
            dayNumber: d.dayNumber || d.day_number || d.day || 1,
            date: d.date || startDate,
            theme: d.theme || `Day ${d.dayNumber || 1}`,
            weather: d.weather || { condition: 'Sunny', tempMin: 25, tempMax: 33 },
            stops: (d.stops || []).map((s: any, i: number) => ({
              placeName: s.placeName || s.place_name || s.name || 'Place',
              time: s.time || `${String(8 + i * 2).padStart(2, '0')}:00`,
              duration: s.duration || '1.5h',
              description: s.description || `Visit ${s.placeName || 'this place'}`,
              lat: s.lat || destinationLat, lng: s.lng || destinationLng,
              category: s.category || 'FOOD',
              rating: s.rating || 4,
              photoUrl: s.photoUrl || s.photo_url || '',
              emoji: s.emoji || '📍',
              estimatedSpend: s.estimatedSpend || s.estimated_spend || s.cost || 25,
              entryFee: s.entryFee || s.entry_fee || 0,
              isHiddenGem: s.isHiddenGem || s.is_hidden_gem || false,
              isPhotoSpot: s.isPhotoSpot || s.is_photo_spot || false,
              mustTry: s.mustTry || s.must_try || '',
              transportFromPrev: s.transportFromPrev || s.transport_from_prev || (i > 0 ? { mode: transportMode, distance: 3000, time: 10, cost: 5 } : null),
            })),
            dayTotalCost: d.dayTotalCost || d.day_total_cost || d.stops?.reduce((s: number, st: any) => s + (st.estimatedSpend || st.cost || 0), 0) || Math.round(budget / days),
            dayTotalDistance: d.dayTotalDistance || d.day_total_distance || 5000,
            dayTotalTime: d.dayTotalTime || d.day_total_time || 240,
            breakfastSpot: d.breakfastSpot || d.breakfast_spot || '',
            lunchSpot: d.lunchSpot || d.lunch_spot || '',
            dinnerSpot: d.dinnerSpot || d.dinner_spot || '',
          })),
          budgetBreakdown: raw.budgetBreakdown || raw.budget_breakdown || {
            accommodation: Math.round(budget * 0.3), food: Math.round(budget * 0.3), transport: Math.round(budget * 0.2),
            activities: Math.round(budget * 0.15), shopping: Math.round(budget * 0.05), misc: 0, total: budget, savingsTips: [],
          },
          roadtrip: raw.roadtrip || { totalDistance: 10000, totalDrivingTime: 60, fuelCost: 30, tollCost: 10, stops: [] },
          bestPhotoSpots: raw.bestPhotoSpots || raw.best_photo_spots || [],
          aiTips: raw.aiTips || raw.ai_tips || [],
          localCuisine: (raw.localCuisine || raw.local_cuisine || []).map((c: any) => ({
            name: c.name || '', description: c.description || '', avgPrice: c.avgPrice || c.avg_price || 15, mustTry: c.mustTry || c.must_try || false,
          })),
          whereToStay: (raw.whereToStay || raw.where_to_stay || []).map((h: any) => ({
            name: h.name || '', type: h.type || 'mid', pricePerNight: h.pricePerNight || h.price_per_night || 150,
            description: h.description || '', lat: h.lat || destinationLat, lng: h.lng || destinationLng,
            rating: h.rating || 4.0, starRating: h.starRating || h.star_rating || 3,
            amenities: h.amenities || 'WiFi', address: h.address || '', reviewCount: h.reviewCount || h.review_count || 100,
            photoUrl: h.photoUrl || h.photo_url || '',
          })),
        };

        // Track recently used places to avoid repeats
        for (const day of plan.days || []) {
          for (const stop of day.stops || []) {
            if (stop.placeName) recentPlaces.push(stop.placeName);
          }
        }
        // Keep only last 200
        if (recentPlaces.length > 200) recentPlaces.splice(0, recentPlaces.length - 200);

        // Enforce unique pricing
        const usedPrices = new Set<number>();
        for (const day of plan.days || []) {
          for (const stop of day.stops || []) {
            let price = stop.estimatedSpend || 5;
            if (price < 5) price = 5 + Math.floor(Math.random() * 30);
            while (usedPrices.has(price)) price += Math.floor(Math.random() * 10) + 1;
            usedPrices.add(price);
            stop.estimatedSpend = price;
          }
        }
        return NextResponse.json({ data: plan });
      } catch {
        // JSON failed — regex fallback
        const text = content.substring(start, end + 1);
        const title = (text.match(/"title"\s*:\s*"([^"]+)"/) || [])[1] || `${days}-Day ${destination} Trip`;
        const places: string[] = [];
        const placeRegex = /"placeName"\s*:\s*"([^"]+)"/g;
        let m;
        while ((m = placeRegex.exec(text)) !== null) places.push(m[1]);

        if (places.length > 0) {
          const spd = Math.ceil(places.length / days);
          const plan = {
            title, destination, startDate, endDate,
            totalCost: budget, totalStops: places.length, hiddenGemCount: 1, groupSize,
            days: Array.from({ length: days }, (_, di) => ({
              dayNumber: di + 1,
              date: (() => { const d = new Date(startDate); d.setDate(d.getDate() + di); return d.toISOString().split('T')[0]; })(),
              theme: `Day ${di + 1}`,
              weather: { condition: 'Sunny', tempMin: 25, tempMax: 33 },
              stops: places.slice(di * spd, (di + 1) * spd).map((name, i) => ({
                placeName: name, time: `${String(8 + i * 2).padStart(2, '0')}:00`, duration: '1.5h',
                description: `Visit ${name}`, lat: destinationLat, lng: destinationLng,
                category: 'FOOD', rating: 4, photoUrl: '', emoji: '📍',
                estimatedSpend: 5 + Math.floor(Math.random() * 30) + (i * 7 % 25), entryFee: 0,
                isHiddenGem: i === 0, isPhotoSpot: i % 3 === 0, mustTry: '',
                transportFromPrev: i > 0 ? { mode: transportMode, distance: 3000, time: 10, cost: 5 } : null,
              })),
              dayTotalCost: Math.round(budget / days), dayTotalDistance: 5000, dayTotalTime: 240,
            })),
            budgetBreakdown: { accommodation: Math.round(budget * 0.3), food: Math.round(budget * 0.3), transport: Math.round(budget * 0.2), activities: Math.round(budget * 0.15), shopping: Math.round(budget * 0.05), misc: 0, total: budget, savingsTips: ['Try local street food'] },
            aiTips: ['Start early to avoid crowds', 'Carry cash for small vendors'],
            localCuisine: places.slice(0, 3).map(name => ({ name, description: 'Local favorite', avgPrice: 15, mustTry: true })),
            whereToStay: [
              { name: `${destination} Budget Inn`, type: 'budget', pricePerNight: 70, description: 'Clean and affordable accommodation in the heart of the city. Walking distance to major attractions and public transport. Features comfortable rooms with air conditioning and free WiFi.', lat: destinationLat, lng: destinationLng, rating: 3.8, starRating: 2, amenities: ['WiFi', 'AC'], address: '', reviewCount: 120, photoUrl: '' },
              { name: `${destination} Backpackers Hostel`, type: 'budget', pricePerNight: 50, description: 'Popular among solo travelers and backpackers. Social atmosphere with common areas perfect for meeting fellow travelers. Basic but clean facilities with 24-hour reception.', lat: destinationLat + 0.005, lng: destinationLng + 0.005, rating: 4.1, starRating: 2, amenities: ['WiFi', 'Common Area'], address: '', reviewCount: 250, photoUrl: '' },
              { name: `${destination} Midtown Hotel`, type: 'mid', pricePerNight: 180, description: 'Comfortable mid-range hotel in the city center. Modern rooms with premium bedding and city views. Features an outdoor pool, fitness center, and an excellent breakfast buffet.', lat: destinationLat + 0.01, lng: destinationLng - 0.005, rating: 4.2, starRating: 3, amenities: ['Pool', 'WiFi', 'Gym'], address: '', reviewCount: 450, photoUrl: '' },
              { name: `${destination} Business Hotel`, type: 'mid', pricePerNight: 220, description: 'Perfect for business and leisure travelers. Located near the commercial district with easy highway access. Spacious rooms with work desks, excellent room service, and conference facilities.', lat: destinationLat - 0.005, lng: destinationLng + 0.01, rating: 4.1, starRating: 3, amenities: ['WiFi', 'Parking', 'Restaurant'], address: '', reviewCount: 380, photoUrl: '' },
              { name: `${destination} Heritage Inn`, type: 'mid', pricePerNight: 250, description: 'Charming boutique hotel in a restored colonial building. Each room is uniquely decorated with local art and antiques. Renowned for its personalized service and garden courtyard breakfast.', lat: destinationLat + 0.008, lng: destinationLng - 0.01, rating: 4.4, starRating: 4, amenities: ['Spa', 'WiFi', 'Breakfast'], address: '', reviewCount: 620, photoUrl: '' },
              { name: `${destination} Grand Hotel`, type: 'luxury', pricePerNight: 450, description: 'Iconic 5-star luxury hotel with stunning architecture and panoramic views. World-class spa, infinity pool, and three award-winning restaurants. Impeccable butler service and concierge can arrange exclusive local experiences.', lat: destinationLat - 0.01, lng: destinationLng - 0.005, rating: 4.6, starRating: 5, amenities: ['Pool', 'Spa', 'Gym', 'Fine Dining', 'Butler Service'], address: '', reviewCount: 1800, photoUrl: '' },
              { name: `${destination} Resort & Spa`, type: 'luxury', pricePerNight: 550, description: 'Beachfront luxury resort offering the ultimate relaxation experience. Private beach access, overwater spa treatments, and sunset infinity pool. Each villa has a private plunge pool and outdoor shower.', lat: destinationLat + 0.015, lng: destinationLng - 0.015, rating: 4.7, starRating: 5, amenities: ['Beach', 'Spa', 'Pool', 'Restaurant', 'Villa'], address: '', reviewCount: 2200, photoUrl: '' },
              { name: `${destination} Premium Suites`, type: 'luxury', pricePerNight: 650, description: 'The pinnacle of luxury in ${destination}. Penthouse suites with 360° city views, private butler, and chauffeur service. Michelin-starred restaurant on the top floor. The ultimate romantic getaway or celebration destination.', lat: destinationLat - 0.012, lng: destinationLng + 0.012, rating: 4.8, starRating: 5, amenities: ['Butler', 'Pool', 'Spa', 'Restaurant', 'Chauffeur'], address: '', reviewCount: 3500, photoUrl: '' },
            ],
          };
          // Track places
          for (const place of places) recentPlaces.push(place);
          if (recentPlaces.length > 200) recentPlaces.splice(0, recentPlaces.length - 200);
          // Unique prices
          const usedP = new Set<number>();
          for (const day of plan.days || []) {
            for (const stop of day.stops || []) {
              let p = stop.estimatedSpend || 5;
              while (usedP.has(p)) p += Math.floor(Math.random() * 10) + 1;
              usedP.add(p);
              stop.estimatedSpend = p;
            }
          }
          return NextResponse.json({ data: plan });
        }
        if (attempt === 0) continue;
        return NextResponse.json({ error: 'AI generated invalid format. Try again.' }, { status: 500 });
      }
    } catch (e: any) {
      if (attempt < 1) { await new Promise(r => setTimeout(r, 1000)); continue; }
      return NextResponse.json({ error: e.message || 'Generation failed' }, { status: 500 });
    }
  }
  return NextResponse.json({ error: 'Generation failed. Try again.' }, { status: 500 });
}
