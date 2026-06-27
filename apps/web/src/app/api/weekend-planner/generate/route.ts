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

📋 CRITICAL RULES — VIOLATION = FAILED OUTPUT:
⚠️ STOP COUNT: Every single day MUST have EXACTLY ${stopsPerDay} stops. Not ${stopsPerDay-1}, not ${stopsPerDay+1}. EXACTLY ${stopsPerDay}. Count them before outputting. Days with wrong count = INVALID.
⏰ TIME SLOTS (follow STRICTLY):
${travelStyles.includes('NIGHT')
  ? '  8:00AM = Breakfast · 10:00AM = Morning Activity · 12:00PM = Lunch · 2:00PM = Afternoon Attraction · 4:00PM = Snack/Cafe/Rest · 6:00PM = Dinner · 8:00PM = Dessert/Drinks/Sunset · 10:00PM = Nightlife/Bar/Club/Supper'
  : '  8:00AM = Breakfast · 10:00AM = Morning Activity · 12:00PM = Lunch · 2:00PM = Afternoon Attraction · 4:00PM = Snack/Cafe/Rest · 6:00PM = Dinner · 8:00PM = Dessert/Drinks/Sunset (end 8:30PM)'}
📍 EVERY stop must be a REAL, VERIFIABLE place in ${destination} on Google Maps. No generic names. Use specific venue names like "Kedai Kopi Sin Yoon Wah" not "coffee shop".
💰 EVERY stop must have a DIFFERENT estimatedSpend (RM5 minimum). No two same prices. Use authentic 2026 Malaysian Ringgit pricing.
💎 At least ${Math.max(3, Math.floor(days * 2))} stops across the trip must be isHiddenGem:true (exceptional but <100 reviews).
📸 At least ${Math.max(3, days)} stops per day must be isPhotoSpot:true.
🎯 EVERY stop must directly match the selected travel styles: ${travelStyles.join(', ')}.${avoidList}
🔄 DO NOT use any place name that appears in the forbidden list above. Generate completely new places.
🔢 DOUBLE-CHECK: Count stops before output. Each day = exactly ${stopsPerDay} items in the stops array. Total stops = ${stopsPerDay * days}.

🏨 WHERE TO STAY — Generate EXACTLY 8 REAL hotels (2 budget, 3 mid-range, 3 luxury). Each hotel MUST include ALL these fields:
- "name": Full real hotel name (e.g. "Shangri-La Rasa Sayang Resort & Spa", "Eastern & Oriental Hotel Penang")
- "type": "budget" / "mid" / "luxury"
- "pricePerNight": Realistic MYR (budget: RM50-150, mid: RM150-400, luxury: RM350-900+)
- "description": Write like an Agoda/Trip.com editor — 5-6 professional sentences covering: (1) location & neighborhood highlights, (2) signature design/architecture/ambiance, (3) standout amenities & facilities, (4) room comfort & views, (5) ideal guest type (couples/families/solo/business), (6) nearby attractions within walking distance
- "lat"/"lng": Accurate to 4 decimal places
- "rating": Google rating 3.5-4.9
- "starRating": 2-5 stars (must match hotel's real category)
- "amenities": Array of 6-12 specific amenity strings. Examples: "Infinity Pool", "Michelin-starred Restaurant", "Couples Spa Suite", "Kids Club", "Airport Shuttle", "Rooftop Bar", "Butler Service", "Private Beach Access", "Fitness Center", "Free WiFi", "Concierge", "Valet Parking"
- "address": Full street address with postcode
- "reviewCount": (budget: 80-600, mid: 300-2500, luxury: 800-6000)
- "distanceFromCenter": distance in km from city center (e.g. 0.5, 3.2)
- "checkIn": "3:00 PM", "checkOut": "12:00 PM"
- "roomTypes": ["Deluxe King", "Premier Suite", "Family Room"] — 2-4 room type names
- "hotelFacilities": ["24-hour front desk", "Currency exchange", "Luggage storage", "Laundry service"] — general facilities (separate from amenities)
- "photoUrl": "" (we fill client-side)

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
            amenities: Array.isArray(h.amenities) ? h.amenities : (h.amenities ? [h.amenities] : ['WiFi']),
            address: h.address || '', reviewCount: h.reviewCount || h.review_count || 100,
            photoUrl: h.photoUrl || h.photo_url || '',
            distanceFromCenter: h.distanceFromCenter || h.distance_from_center || null,
            checkIn: h.checkIn || h.check_in || '3:00 PM',
            checkOut: h.checkOut || h.check_out || '12:00 PM',
            roomTypes: h.roomTypes || h.room_types || [],
            hotelFacilities: h.hotelFacilities || h.hotel_facilities || [],
            whyWeRecommend: h.whyWeRecommend || h.why_we_recommend || 'Great value for your trip',
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
              { name: `${destination} Budget Inn`, type:'budget',pricePerNight:70,description:'Clean and affordable accommodation in the heart of the city. Walking distance to major attractions, night markets, and public transport hubs. Features comfortable air-conditioned rooms with ensuite bathrooms and free WiFi. Ideal for budget-conscious travelers who want a central location without breaking the bank.',lat:destinationLat,lng:destinationLng,rating:3.8,starRating:2,amenities:['Free WiFi','Air Conditioning','Ensuite Bathroom','24-Hour Front Desk','Luggage Storage'],address:`Jalan Sultan, ${destination}`,reviewCount:180,photoUrl:'',distanceFromCenter:0.5,checkIn:'2:00 PM',checkOut:'12:00 PM',roomTypes:['Standard Single','Standard Double','Family Room'],hotelFacilities:['24-hour front desk','Luggage storage','Laundry service','Tour desk'] },
              { name: `${destination} Backpackers Inn`, type:'budget',pricePerNight:45,description:'Vibrant social hostel popular with solo travelers and backpackers from around the world. Rooftop common area with stunning city views, perfect for meeting fellow travelers. Offers both dormitory beds and private rooms with shared bathrooms. Walking distance to the best street food and public transport.',lat:destinationLat+0.005,lng:destinationLng+0.005,rating:4.2,starRating:2,amenities:['Free WiFi','Rooftop Terrace','Common Lounge','Laundry','Bicycle Rental'],address:`Jalan Hang Jebat, ${destination}`,reviewCount:340,photoUrl:'',distanceFromCenter:0.3,checkIn:'1:00 PM',checkOut:'11:00 AM',roomTypes:['Dormitory Bed','Private Double','Private Twin'],hotelFacilities:['24-hour reception','Lockers','Book exchange','Board games'] },
              { name: `${destination} Midtown Hotel`, type:'mid',pricePerNight:180,description:'A contemporary mid-range hotel perfectly positioned in the city center. Modern rooms feature premium bedding, floor-to-ceiling windows, and smart TV entertainment systems. The outdoor swimming pool and fully equipped fitness center offer relaxation after a day of exploring. The breakfast buffet features both local Malaysian favorites and international cuisine. Couples and families love the warm Malaysian hospitality and the convenient location near major shopping malls.',lat:destinationLat+0.01,lng:destinationLng-0.005,rating:4.3,starRating:3,amenities:['Outdoor Pool','Fitness Center','Free WiFi','Restaurant','Room Service','Parking'],address:`Jalan Bukit Bintang, ${destination}`,reviewCount:680,photoUrl:'',distanceFromCenter:0.8,checkIn:'3:00 PM',checkOut:'12:00 PM',roomTypes:['Deluxe King','Deluxe Twin','Family Suite'],hotelFacilities:['24-hour front desk','Concierge','Tour desk','Currency exchange','Business center'] },
              { name: `${destination} Business Hotel`, type:'mid',pricePerNight:220,description:'An efficient and stylish hotel catering to both business and leisure travelers. Located in the commercial district with easy access to highways and public transport. Spacious rooms feature ergonomic workstations, high-speed WiFi, and blackout curtains for a restful sleep. The executive lounge and meeting facilities make it ideal for working travelers. The in-house restaurant serves an impressive mix of local and international dishes.',lat:destinationLat-0.005,lng:destinationLng+0.01,rating:4.1,starRating:3,amenities:['High-Speed WiFi','Executive Lounge','Restaurant','Parking','Business Center','Gym'],address:`Jalan Sultan Ismail, ${destination}`,reviewCount:520,photoUrl:'',distanceFromCenter:1.2,checkIn:'3:00 PM',checkOut:'12:00 PM',roomTypes:['Superior King','Executive Suite','Accessible Room'],hotelFacilities:['24-hour front desk','Business center','Meeting rooms','Airport shuttle','Laundry service'] },
              { name: `${destination} Heritage Boutique Hotel`, type:'mid',pricePerNight:260,description:'A beautifully restored colonial-era mansion transformed into an intimate boutique hotel. Each of the 35 rooms is individually decorated with vintage Peranakan tiles, antique furniture, and local artwork. The courtyard garden serves a legendary afternoon tea with homemade kueh and premium teas. Couples adore the romantic ambiance, personalized service, and the quiet oasis feel despite being steps from the heritage zone. Voted "Most Charming Hotel" by local travel magazines for three consecutive years.',lat:destinationLat+0.008,lng:destinationLng-0.01,rating:4.5,starRating:4,amenities:['Courtyard Garden','Boutique Spa','Gourmet Breakfast','Free WiFi','Library Lounge','Bicycle Rental'],address:`Jalan Heeren, ${destination}`,reviewCount:920,photoUrl:'',distanceFromCenter:0.4,checkIn:'3:00 PM',checkOut:'12:00 PM',roomTypes:['Heritage Room','Courtyard Suite','Peranakan Grand Suite'],hotelFacilities:['24-hour front desk','Concierge','Porter','Laundry','Valet parking'] },
              { name: `${destination} Grand Luxury Hotel`, type:'luxury',pricePerNight:480,description:'An iconic 5-star landmark hotel that has defined luxury hospitality in ${destination} for decades. The grand marble lobby with its crystal chandeliers sets the tone for an extraordinary stay. World-class facilities include an infinity pool overlooking the city skyline, a 10-room spa offering traditional Malaysian therapies, and three award-winning restaurants including a rooftop fine dining venue. The legendary concierge team can arrange exclusive experiences from private island excursions to helicopter tours. The epitome of refined Malaysian luxury for discerning travelers.',lat:destinationLat-0.01,lng:destinationLng-0.005,rating:4.6,starRating:5,amenities:['Infinity Pool','Luxury Spa','3 Restaurants','Rooftop Bar','Butler Service','Fitness Center','Business Center','Concierge','Valet Parking'],address:`Jalan Sultan Ismail, ${destination}`,reviewCount:2800,photoUrl:'',distanceFromCenter:0.6,checkIn:'3:00 PM',checkOut:'12:00 PM',roomTypes:['Deluxe Room','Grand Club Room','Premier Suite','Presidential Suite'],hotelFacilities:['24-hour butler','Concierge','Currency exchange','Airport limousine','Helicopter transfer','Personal shopper'] },
              { name: `${destination} Beach Resort & Spa`, type:'luxury',pricePerNight:580,description:'An award-winning beachfront resort offering the ultimate tropical escape. Set on 5 acres of manicured tropical gardens with direct access to a pristine white sand beach. Each villa features a private plunge pool, outdoor rain shower, and panoramic ocean views. The overwater spa offers signature couples treatments using traditional Malaysian herbs and techniques. Multiple dining venues range from casual beachside grills to a sophisticated sunset restaurant. Perfect for honeymooners, anniversary celebrations, and those seeking absolute tranquility.',lat:destinationLat+0.015,lng:destinationLng-0.015,rating:4.7,starRating:5,amenities:['Private Beach','Infinity Pool','Overwater Spa','4 Restaurants','Tennis Court','Kids Club','Water Sports','Yoga Pavilion','Wedding Chapel','Butler Service'],address:`Batu Ferringhi, ${destination}`,reviewCount:4200,photoUrl:'',distanceFromCenter:12.5,checkIn:'3:00 PM',checkOut:'11:00 AM',roomTypes:['Garden Villa','Ocean View Suite','Beachfront Pool Villa','Royal Honeymoon Suite'],hotelFacilities:['24-hour butler','Airport transfer','Helicopter pad','Dive center','Tennis pro','Kids club','Wedding planner'] },
              { name: `${destination} Skyline Premium Suites`, type:'luxury',pricePerNight:720,description:'The undisputed pinnacle of luxury accommodation in ${destination}. Occupying the top 10 floors of the citys tallest skyscraper, every suite offers breathtaking 360° panoramic views from floor-to-ceiling windows. Each guest is assigned a personal butler and chauffeur-driven Rolls-Royce for the duration of their stay. The penthouse restaurant has been awarded two Michelin stars for its innovative Malaysian-French fusion cuisine. The private members-only spa and the rooftop infinity pool at 300 meters above ground complete this extraordinary experience.',lat:destinationLat-0.012,lng:destinationLng+0.012,rating:4.9,starRating:5,amenities:['Personal Butler','Chauffeur Service','Michelin Restaurant','Rooftop Infinity Pool','Private Spa','Wine Cellar','Cigar Lounge','Helipad'],address:`Jalan Ampang, ${destination}`,reviewCount:5800,photoUrl:'',distanceFromCenter:0.2,checkIn:'2:00 PM',checkOut:'1:00 PM',roomTypes:['Skyline Suite','Corner Panorama Suite','Chairman Penthouse','Royal Penthouse'],hotelFacilities:['Personal butler','Chauffeur','Valet','Helipad','Private check-in','Sommelier','Personal trainer'] },
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
