import { NextResponse, type NextRequest } from 'next/server';

interface TripStop {
  time: string;
  placeName: string;
  category: string;
  description: string;
  cost: number;
  duration: number;
  lat: number;
  lng: number;
}

interface TripDay {
  day: number;
  theme: string;
  stops: TripStop[];
  dayTotalCost: number;
  transportNotes: string;
}

interface TripPlan {
  title: string;
  destination: string;
  totalBudget: number;
  totalCost: number;
  days: TripDay[];
  tips: string[];
  bestTimeToVisit: string;
  weatherNote: string;
}

function generateTripPlan(
  destination: string,
  budget: number,
  durationDays: number,
  interests: string[],
): TripPlan {
  const isFood = interests.some((i) => i.toLowerCase().includes('food') || i.toLowerCase().includes('culinary'));
  const isCulture = interests.some((i) => i.toLowerCase().includes('cultur') || i.toLowerCase().includes('heritage') || i.toLowerCase().includes('history'));
  const isNature = interests.some((i) => i.toLowerCase().includes('nature') || i.toLowerCase().includes('hiking') || i.toLowerCase().includes('outdoor') || i.toLowerCase().includes('beach'));
  const isAdventure = interests.some((i) => i.toLowerCase().includes('adventure') || i.toLowerCase().includes('thrill'));

  // ── Penang plan ────────────────────────────────────────────────────────
  if (destination.toLowerCase().includes('penang') || destination.toLowerCase().includes('george town')) {
    const days: TripDay[] = [];

    if (durationDays >= 1) {
      days.push({
        day: 1, theme: 'George Town Heritage & Street Food',
        stops: [
          { time: '8:00 AM', placeName: 'Transfer Road Roti Canai', category: 'FOOD', description: 'Flaky roti canai with dhal — institution since 1950s', cost: 5, duration: 45, lat: 5.4185, lng: 100.3240 },
          { time: '10:00 AM', placeName: 'Chew Jetty & Clan Jetties', category: 'ATTRACTION', description: 'Historic waterfront settlements on stilts with street art and photo spots', cost: 0, duration: 90, lat: 5.4120, lng: 100.3390 },
          { time: '12:30 PM', placeName: 'Penang Road Famous Cendol', category: 'FOOD', description: 'Iconic shaved ice dessert with coconut milk and gula melaka', cost: 4, duration: 20, lat: 5.4170, lng: 100.3320 },
          { time: '1:30 PM', placeName: 'Pinang Peranakan Mansion', category: 'ATTRACTION', description: 'Straits Chinese heritage museum with antiques and ornate architecture', cost: 20, duration: 90, lat: 5.4180, lng: 100.3360 },
          { time: '7:00 PM', placeName: 'Gurney Drive Hawker Centre', category: 'FOOD', description: 'Seaside hawker centre — char kway teow, assam laksa, satay, fresh seafood', cost: 25, duration: 90, lat: 5.4370, lng: 100.3100 },
        ],
        dayTotalCost: 54, transportNotes: 'Walking + Grab (~RM 15)',
      });
    }

    if (durationDays >= 2) {
      days.push({
        day: 2, theme: 'Temples, Hills & Night Markets',
        stops: [
          { time: '8:00 AM', placeName: 'Toh Soon Cafe', category: 'CAFE', description: 'Charcoal-toasted bread with kaya, half-boiled eggs, alley-side since 1959', cost: 6, duration: 40, lat: 5.4160, lng: 100.3380 },
          { time: '10:00 AM', placeName: 'Kek Lok Si Temple', category: 'ATTRACTION', description: "Southeast Asia's largest Buddhist temple — pagoda views, gardens, 10,000 Buddha statues", cost: 8, duration: 120, lat: 5.3990, lng: 100.2730 },
          { time: '1:00 PM', placeName: 'Nasi Kandar Line Clear', category: 'FOOD', description: 'Legendary 24-hour nasi kandar — choose your curries, a Penang rite of passage', cost: 12, duration: 45, lat: 5.4165, lng: 100.3305 },
          { time: '3:00 PM', placeName: 'Penang Hill (via Funicular)', category: 'ATTRACTION', description: 'Cool mountain air, 360° island views, The Habitat canopy walk', cost: 30, duration: 150, lat: 5.4240, lng: 100.2690 },
          { time: '8:00 PM', placeName: 'Chulia Street Night Hawkers', category: 'FOOD', description: 'Wanton mee, curry mee, lok-lok skewers, roasted pork — buzzing evening atmosphere', cost: 20, duration: 90, lat: 5.4185, lng: 100.3350 },
        ],
        dayTotalCost: 76, transportNotes: 'Grab between sites (~RM 40)',
      });
    }

    if (durationDays >= 3) {
      days.push({
        day: 3, theme: 'Nature, Beaches & Local Life',
        stops: [
          { time: '8:00 AM', placeName: 'Air Itam Morning Market', category: 'FOOD', description: 'Bustling local wet market — fresh fruits, apam balik, kuih, local breakfast', cost: 10, duration: 60, lat: 5.4010, lng: 100.2770 },
          { time: '10:30 AM', placeName: 'Penang National Park (Pantai Kerachut)', category: 'ATTRACTION', description: 'Scenic coastal hike to a pristine turtle-nesting beach. Moderate trail ~1.5hrs each way', cost: 0, duration: 180, lat: 5.4560, lng: 100.1990 },
          { time: '2:00 PM', placeName: 'Batu Ferringhi Beach', category: 'ATTRACTION', description: 'Relax on sandy shores, water sports, parasailing available', cost: 0, duration: 120, lat: 5.4730, lng: 100.2520 },
          { time: '5:00 PM', placeName: 'Batu Ferringhi Night Market', category: 'FOOD', description: 'Beachside pasar malam — souvenirs, street snacks, fresh coconut water', cost: 15, duration: 90, lat: 5.4740, lng: 100.2500 },
          { time: '8:00 PM', placeName: 'Tsunami Village Seafood', category: 'FOOD', description: 'Fresh catch dinner on a Malay-style floating platform — butter prawns, steamed fish', cost: 40, duration: 90, lat: 5.4700, lng: 100.2450 },
        ],
        dayTotalCost: 65, transportNotes: 'Grab + walking (~RM 50)',
      });
    }

    return {
      title: `${durationDays}-Day Penang ${isFood ? 'Food' : ''} ${isCulture ? 'Heritage' : ''} ${isNature ? 'Nature' : ''} Adventure`,
      destination: 'George Town, Penang',
      totalBudget: budget,
      totalCost: days.reduce((sum, d) => sum + d.dayTotalCost, 0) + 105,
      days,
      tips: [
        'Most hawker stalls are cash-only — carry RM 50–100 in small notes',
        'Grab is RM 5–15 per ride within George Town; use for mid-day heat',
        'Street art alleys best photographed before 9 AM (no crowds, soft light)',
        'Penang Hill clear mornings only — check weather forecast before going up',
        'Try the nutmeg juice — a uniquely Penang drink you will not find elsewhere',
      ],
      bestTimeToVisit: 'November–February (cooler, less rain)',
      weatherNote: 'Expect 30–33°C with afternoon showers possible. Bring umbrella + water bottle.',
    };
  }

  // ── KL plan ────────────────────────────────────────────────────────────
  if (destination.toLowerCase().includes('kl') || destination.toLowerCase().includes('kuala lumpur')) {
    const days: TripDay[] = [];
    if (durationDays >= 1) {
      days.push({
        day: 1, theme: 'KL Icons & Street Food',
        stops: [
          { time: '8:00 AM', placeName: 'Nasi Lemak Tanglin', category: 'FOOD', description: 'Legendary nasi lemak since 1948 — perfect sambal, fragrant rice', cost: 8, duration: 45, lat: 3.1412, lng: 101.6885 },
          { time: '10:00 AM', placeName: 'Petronas Twin Towers', category: 'ATTRACTION', description: 'Iconic 452m towers — sky bridge at 170m, observation deck at 370m', cost: 80, duration: 120, lat: 3.1578, lng: 101.7117 },
          { time: '1:00 PM', placeName: 'Lot 10 Hutong Food Court', category: 'FOOD', description: 'Curated heritage hawker stalls — best of KL under one roof, air-conditioned', cost: 15, duration: 60, lat: 3.1466, lng: 101.7120 },
          { time: '3:00 PM', placeName: 'Batu Caves', category: 'ATTRACTION', description: '272 rainbow steps, 42m golden Murugan statue, limestone cave temple', cost: 0, duration: 150, lat: 3.2374, lng: 101.6839 },
          { time: '7:00 PM', placeName: 'Jalan Alor Food Street', category: 'FOOD', description: 'Vibrant open-air food street — grilled stingray, satay, oyster omelette', cost: 25, duration: 90, lat: 3.1466, lng: 101.7084 },
        ],
        dayTotalCost: 128, transportNotes: 'Grab + MRT (~RM 30)',
      });
    }
    if (durationDays >= 2) {
      days.push({
        day: 2, theme: 'Culture, Parks & Rooftop Views',
        stops: [
          { time: '9:00 AM', placeName: 'VCR Coffee & Cafe', category: 'CAFE', description: 'Specialty coffee + brunch in restored pre-war building', cost: 30, duration: 60, lat: 3.1478, lng: 101.7095 },
          { time: '11:00 AM', placeName: 'Islamic Arts Museum', category: 'ATTRACTION', description: 'World-class collection of Islamic art, architecture models, textiles', cost: 14, duration: 120, lat: 3.1420, lng: 101.6880 },
          { time: '1:30 PM', placeName: "Devi's Corner Banana Leaf Rice", category: 'FOOD', description: 'Authentic South Indian banana leaf — fish curry, fried bitter gourd', cost: 15, duration: 45, lat: 3.1300, lng: 101.6720 },
          { time: '3:00 PM', placeName: 'Perdana Botanical Gardens', category: 'ATTRACTION', description: 'Tranquil 91-hectare gardens — orchid garden, deer park, boating lake', cost: 0, duration: 120, lat: 3.1430, lng: 101.6850 },
          { time: '6:00 PM', placeName: 'Heli Lounge Bar', category: 'ATTRACTION', description: 'Rooftop bar on a working helipad — 360° KL skyline at sunset', cost: 40, duration: 120, lat: 3.1500, lng: 101.7060 },
        ],
        dayTotalCost: 99, transportNotes: 'Grab + walking (~RM 25)',
      });
    }
    return {
      title: `${durationDays}-Day KL ${isFood ? 'Food' : ''} Explorer`,
      destination: 'Kuala Lumpur',
      totalBudget: budget,
      totalCost: days.reduce((sum, d) => sum + d.dayTotalCost, 0) + 55,
      days,
      tips: [
        'MRT and LRT are cheap (RM 1.20–3.50) and avoid KL traffic jams (4–7 PM worst)',
        'KLCC area is walkable — Petronas Towers, KLCC Park, Suria Mall all connected',
        'Dress modestly for Batu Caves and religious sites — covered shoulders and knees',
        'Hawker food is best value — incredible meals for RM 5–15 per person',
      ],
      bestTimeToVisit: 'May–July (dry season) or December (festive decorations)',
      weatherNote: 'Kuala Lumpur is hot and humid year-round (28–34°C). Afternoon thunderstorms common.',
    };
  }

  // ── Generic Malaysia plan ───────────────────────────────────────────────
  const days: TripDay[] = [];
  for (let d = 1; d <= durationDays; d++) {
    days.push({
      day: d,
      theme: d === 1 ? 'City Discovery & Local Flavors' : d === 2 ? 'Culture & Hidden Gems' : `Day ${d} Adventure`,
      stops: [
        { time: '8:30 AM', placeName: 'Local breakfast spot', category: 'FOOD', description: 'Traditional Malaysian breakfast — nasi lemak, roti canai, kopi', cost: 10, duration: 45, lat: 3.139 + d * 0.01, lng: 101.6869 + d * 0.01 },
        { time: '10:30 AM', placeName: `${destination} Landmark`, category: 'ATTRACTION', description: 'Must-see attraction in the area', cost: 20, duration: 90, lat: 3.139 + d * 0.015, lng: 101.6869 + d * 0.015 },
        { time: '1:00 PM', placeName: 'Local food court', category: 'FOOD', description: 'Authentic local lunch with variety of Malaysian dishes', cost: 15, duration: 60, lat: 3.139 + d * 0.008, lng: 101.6869 + d * 0.012 },
        { time: '4:00 PM', placeName: `${destination} Nature Spot`, category: 'ATTRACTION', description: 'Scenic viewpoint or park for afternoon relaxation', cost: 5, duration: 90, lat: 3.14 + d * 0.012, lng: 101.687 + d * 0.008 },
        { time: '7:00 PM', placeName: 'Evening night market', category: 'FOOD', description: 'Local pasar malam — street food, snacks, souvenir shopping', cost: 20, duration: 120, lat: 3.139 + d * 0.01, lng: 101.687 + d * 0.01 },
      ],
      dayTotalCost: 70, transportNotes: 'Grab + walking (~RM 30)',
    });
  }

  return {
    title: `${durationDays}-Day ${destination} Explorer`,
    destination,
    totalBudget: budget,
    totalCost: days.reduce((sum, d) => sum + d.dayTotalCost, 0) + 30 * durationDays,
    days,
    tips: ['Book Grab rides to save time between distant spots', 'Carry cash — many hawker stalls do not accept cards', 'Check opening hours before visiting — some places close on Mondays'],
    bestTimeToVisit: 'Year-round (tropical climate)',
    weatherNote: 'Expect 28–34°C with possible afternoon rain. Bring sunscreen and water.',
  };
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { destination, budget, duration, interests } = body as {
    destination: string; budget: number; duration: number; interests: string[];
  };

  if (!destination || !duration) {
    return NextResponse.json({ error: 'destination and duration are required' }, { status: 400 });
  }

  const apiKey = process.env.OPENAI_API_KEY;

  // Try OpenAI for intelligent personalization
  if (apiKey) {
    try {
      const prompt = `You are a Malaysian travel expert AI. Create a ${duration}-day trip plan for ${destination}, Malaysia.
Budget: RM ${budget}. Interests: ${interests.join(', ')}.

Return valid JSON only (no markdown, no extra text):
{
  "title": "Trip title",
  "destination": "City, State",
  "totalCost": number,
  "days": [
    {
      "day": 1,
      "theme": "Day theme",
      "stops": [
        { "time": "8:00 AM", "placeName": "Real place name", "category": "FOOD|CAFE|ATTRACTION", "description": "1 sentence", "cost": number, "duration": number, "lat": number, "lng": number }
      ],
      "dayTotalCost": number,
      "transportNotes": "How to get around"
    }
  ],
  "tips": ["tip1", "tip2"],
  "bestTimeToVisit": "best season",
  "weatherNote": "weather advice"
}

Rules:
- Use REAL Malaysian place names (restaurants, landmarks, parks)
- lat/lng must be accurate for each place
- Cost in MYR, realistic prices
- Stops ordered by time
- Budget-conscious: keep totalCost within RM ${budget}`;

      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
          max_tokens: 2500,
          response_format: { type: 'json_object' },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const content = data.choices?.[0]?.message?.content;
        if (content) {
          const parsed = JSON.parse(content);
          return NextResponse.json({
            data: { ...parsed, totalBudget: budget, model: 'gpt-4o' },
          });
        }
      }
    } catch (err) {
      console.error('OpenAI planning error:', err);
    }
  }

  // Fallback: rule-based trip plan with real Malaysian places
  const plan = generateTripPlan(destination, budget, duration, interests);

  return NextResponse.json({
    data: { ...plan, model: 'rule-based (OpenAI key not configured)' },
  });
}
