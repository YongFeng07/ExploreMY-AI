import { NextResponse } from 'next/server';

const KEY = process.env.DEEPSEEK_API_KEY || '';

// Track recently used places to avoid repeats
const recentPlaces: string[] = [];

export async function POST(request: Request) {
  const body = await request.json();
  const { destination, destinationLat, destinationLng, startDate, endDate, budget = 500, transportMode = 'DRIVING', groupType = 'COUPLE', travelStyles = [], groupSize = 2 } = body;

  if (!KEY) return NextResponse.json({ error: 'AI key missing' }, { status: 500 });

  const days = Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000) + 1;
  const seed = Date.now() % 99999;
  const stopsPerDay = travelStyles.includes('NIGHT') ? 8 : 7;
  const endTime = travelStyles.includes('NIGHT') ? '11PM' : '8:30PM';

  // Style-specific instructions
  const styleMap: Record<string, string> = {
    FOODIE: 'Focus on food: hawker stalls, kopitiams, restaurants, night markets, cafes. Include dish names.',
    ADVENTURE: 'Focus on outdoors: hiking, water sports, caves, zip-lines, ATV, rock climbing.',
    CULTURAL: 'Focus on heritage: museums, temples, historical sites, cultural performances, art galleries.',
    NATURE: 'Focus on nature: waterfalls, beaches, mountains, rainforest walks, national parks.',
    PHOTO: 'Focus on Instagram spots: street art, viewpoints, colorful buildings, sunset spots.',
    LUXURY: 'Focus on premium: fine dining, rooftop bars, spas, high-end experiences.',
    BUDGET: 'Focus on affordable: street food, free attractions, budget stays, cheap eats.',
    NIGHT: 'Focus on nightlife: bars, clubs, night markets, evening entertainment, supper spots.',
  };
  const styleInstr = travelStyles.map((s: string) => styleMap[s] || '').filter(Boolean).join(' ');

  // Budget tier
  const perDay = Math.round(budget / days);
  const budgetTier = budget < 500
    ? 'ECONOMY: Budget venues only — hawker stalls (RM5-15), local eats (RM10-25), free attractions. Hotels RM50-120/night. Daily max RM' + perDay + '.'
    : budget < 1500
    ? 'MID-RANGE: Popular restaurants (RM20-40), paid attractions (RM10-50), good dining (RM30-80). Hotels RM150-400/night. Daily max RM' + perDay + '.'
    : 'PREMIUM: Fine dining (RM50-200), private tours, luxury. Hotels RM350-900+/night. Daily max RM' + perDay + '.';

  // Avoid list
  const avoidList = recentPlaces.length > 0
    ? '\n🚫 DO NOT use: ' + recentPlaces.slice(-40).join(', ')
    : '';

  // Build prompt
  let prompt = `Create a ${days}-day trip in ${destination}, Malaysia. Budget RM${budget}, ${groupType} ${groupSize}p, ${transportMode}. Seed:${seed}.

🎯 STYLES: ${travelStyles.join(', ')}
${styleInstr}
Style balance: ${travelStyles.length === 1 ? '~60% ' + travelStyles[0] + ', ~40% variety (culture, nature, photo)' : 'Distribute evenly across ' + travelStyles.join(', ') + ' with variety'}

💰 BUDGET: ${budgetTier}

📋 CRITICAL — OUTPUT EXACTLY ${stopsPerDay} STOPS PER DAY, NO FEWER:
⚠️ THE STOPS ARRAY MUST CONTAIN EXACTLY ${stopsPerDay} OBJECTS. NOT ${stopsPerDay - 1}, NOT ${stopsPerDay - 2}. EXACTLY ${stopsPerDay}. DO NOT TRUNCATE.
Time slots (each stop's "time" field MUST use these exact values):
${travelStyles.includes('NIGHT')
  ? '   Stop 1: time="08:00" · Stop 2: time="10:00" · Stop 3: time="12:00" · Stop 4: time="14:00" · Stop 5: time="16:00" · Stop 6: time="18:00" · Stop 7: time="20:00" · Stop 8: time="22:00"'
  : '   Stop 1: time="08:00" · Stop 2: time="10:00" · Stop 3: time="12:00" · Stop 4: time="14:00" · Stop 5: time="16:00" · Stop 6: time="18:00" · Stop 7: time="20:00"'}

RULES:
- Every placeName = real venue in ${destination} on Google Maps. No generic names.
- All coordinates accurate to 4 decimals. Real 2026 MYR pricing.
- At least 3 hidden gems. At least 3 photo spots per day.
- Stay within RM${budget} total. Unique estimatedSpend per stop.${avoidList}

🏨 Include EXACTLY 12 hotels in whereToStay (3 budget, 4 mid, 5 luxury). Each: real name, type, pricePerNight, 3-sentence description, lat/lng, rating, starRating, amenities, address, reviewCount.

Return ONLY valid JSON with FULL stops array — DO NOT truncate.`;

  // Try up to 2 times
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${KEY}` },
        body: JSON.stringify({ model: 'deepseek-chat', messages: [{ role: 'system', content: 'Output valid JSON only with EXACTLY the requested number of stops. Never truncate.' }, { role: 'user', content: prompt }], temperature: 0.9, max_tokens: 8000 }),
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

      // JSON cleaning
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

        // VALIDATE STOP COUNT — retry with stronger prompt if wrong
        const rawStopsPerDay = raw.days?.[0]?.stops?.length || 0;
        if (rawStopsPerDay !== stopsPerDay && attempt < 1) {
          // Add stronger stop count instruction for retry
          prompt = prompt.replace('Return ONLY valid JSON', 'PREVIOUS ATTEMPT HAD ' + rawStopsPerDay + ' STOPS INSTEAD OF ' + stopsPerDay + '. OUTPUT EXACTLY ' + stopsPerDay + ' STOPS. I WILL COUNT THEM. DO NOT OUTPUT ' + rawStopsPerDay + ' STOPS.\n\nReturn ONLY valid JSON');
          continue;
        }

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
          })),
        };

        // Track recent places
        for (const day of plan.days || []) {
          for (const stop of day.stops || []) {
            if (stop.placeName) recentPlaces.push(stop.placeName);
          }
        }
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
        // Regex fallback
        const text = content.substring(start, end + 1);
        const title = (text.match(/"title"\s*:\s*"([^"]+)"/) || [])[1] || `${days}-Day ${destination} Trip`;
        const places: string[] = [];
        const placeRegex = /"placeName"\s*:\s*"([^"]+)"/g;
        let m;
        while ((m = placeRegex.exec(text)) !== null) places.push(m[1]);

        if (places.length > 0) {
          const spd = Math.ceil(places.length / days);
          const plan = {
            title, destination, startDate, endDate, totalCost: budget, totalStops: places.length, hiddenGemCount: 1, groupSize,
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
            whereToStay: Array.from({ length: 12 }, (_, i) => ({
              name: `${destination} ${['Budget Inn','Backpackers Hostel','Cozy Guesthouse','Midtown Hotel','Business Hotel','Heritage Boutique Inn','Family Hotel','Boutique Hotel','Grand Luxury Hotel','Resort & Spa','Skyline Premium Suites','The Presidential'][i]}`,
              type: i < 3 ? 'budget' : i < 7 ? 'mid' : 'luxury',
              pricePerNight: [70, 50, 90, 180, 220, 260, 200, 280, 450, 550, 680, 850][i],
              description: 'Comfortable stay in ' + destination,
              lat: destinationLat + (i - 6) * 0.004, lng: destinationLng + (i - 6) * 0.004,
              rating: 3.5 + i * 0.12, starRating: i < 3 ? 2 : i < 7 ? 3 : 5,
              amenities: ['WiFi', 'AC', 'Parking'], address: '', reviewCount: 100 + i * 250, photoUrl: '',
              distanceFromCenter: i * 0.4, checkIn: '3:00 PM', checkOut: '12:00 PM',
              roomTypes: ['Standard', 'Deluxe', 'Suite'], hotelFacilities: ['Front Desk', 'WiFi', 'Room Service'],
            })),
          };
          // Track places + unique prices
          for (const place of places) recentPlaces.push(place);
          if (recentPlaces.length > 200) recentPlaces.splice(0, recentPlaces.length - 200);
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
