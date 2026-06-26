import { NextResponse } from 'next/server';

const DEEPSEEK_KEY = process.env.DEEPSEEK_API_KEY || '';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      city = 'Kuala Lumpur', budget = 150, durationHours = 4,
      transportMode = 'DRIVING', relationshipStage = 'DATING',
      dateType = 'ROMANTIC', preferredTime = 'EVENING', dateSelected,
    } = body;

    if (!DEEPSEEK_KEY) return NextResponse.json({ error: 'AI not configured' }, { status: 500 });

    // Validate budget: min RM30/person/hour
    const minBudget = durationHours * 30;
    if (budget < minBudget) return NextResponse.json({ error: `Minimum budget is RM${minBudget} for ${durationHours}h date` }, { status: 400 });

    const startHr = preferredTime === 'MORNING' ? 9 : preferredTime === 'AFTERNOON' ? 14 : preferredTime === 'EVENING' ? 18 : 12;
    const endHr = (startHr + durationHours) % 24;

    // Randomization for unique results
    const seed = Date.now() % 9999;
    const vibes = ['cozy hidden gem', 'trendy hotspot', 'quiet secret spot', 'local favorite', 'upscale classic', 'artsy newcomer', 'romantic hideaway', 'scenic viewpoint'];
    const randomVibe = vibes[Math.floor(Math.random() * vibes.length)];

    // Strict date type matching rules
    const dateTypeRules: Record<string, string> = {
      ROMANTIC: 'ONLY romantic venues: candlelit restaurants, rooftop bars, sunset viewpoints, intimate cafes, romantic walks. NO loud clubs, NO crowded food courts, NO family restaurants.',
      ADVENTURE: 'ONLY adventure activities: outdoor sports, hiking trails, water activities, escape rooms, rock climbing, ziplining. NO sit-down restaurants, NO shopping malls, NO quiet cafes.',
      CASUAL: 'ONLY casual hangout spots: laid-back cafes, street food markets, casual dining, parks, board game cafes. NO fine dining, NO formal venues.',
      FOODIE: 'ONLY food experiences: hawker stalls, food courts, specialty restaurants, dessert cafes, food tours. Every stop must involve eating/drinking.',
      BEACH: 'ONLY beach/waterfront venues: beachside cafes, seaside restaurants, waterfront walks, sunset spots by the water, water activities. NO inland places. NO malls.',
      CULTURAL: 'ONLY cultural venues: museums, art galleries, temples, heritage sites, cultural performances, traditional crafts. NO generic malls or chain restaurants.',
      OUTDOOR: 'ONLY outdoor locations: parks, gardens, nature trails, open-air markets, hiking spots, botanical gardens. NO indoor malls, NO air-conditioned restaurants.',
      LUXURY: 'ONLY premium venues: fine dining, 5-star hotels, rooftop bars, private dining, spa experiences. NO hawker stalls, NO budget eateries.',
      RELAXED: 'ONLY relaxing places: spas, quiet cafes, parks, libraries, slow-paced activities. NO loud venues, NO crowded spots.',
      FUN: 'ONLY entertainment venues: karaoke, bowling, arcades, amusement parks, comedy clubs, live music. NO quiet cafes, NO museums.',
    };
    const strictRule = dateTypeRules[dateType] || dateTypeRules.ROMANTIC;

    // Relationship stage guidance
    const stageGuide: Record<string, string> = {
      DATING: 'Focus on getting to know each other. Places with good conversation atmosphere. Not too intimate.',
      RELATIONSHIP: 'Focus on shared experiences. Romantic but comfortable. Mix of activities.',
      MARRIED: 'Focus on rekindling romance. Intimate settings. Meaningful experiences over trendy spots.',
      FIRST_DATE: 'Focus on low-pressure environments. Easy exit options. Casual but impressive. Short activities.',
    };

    const prompt = `You are Malaysia's top dating concierge. Plan a ${durationHours}-hour ${dateType} date in ${city}, Malaysia.

🎯 DATE TYPE: ${dateType}
⚠️ STRICT RULE: ${strictRule}
💑 STAGE: ${relationshipStage} — ${stageGuide[relationshipStage] || ''}
💰 BUDGET: RM${budget} total (for 2 people, ~RM${Math.round(budget/durationHours)}/hour)
🚗 TRANSPORT: ${transportMode}
🕐 TIME: ${preferredTime} (${String(startHr).padStart(2,'0')}:00–${String(endHr).padStart(2,'0')}:00)
🔄 SEED: ${seed} — generate completely DIFFERENT venues than usual. Focus on: ${randomVibe}.
📍 LOCATION: Explore ALL areas of ${city}, not just center. Include suburbs and nearby neighborhoods.

Return ONLY valid JSON (no markdown, no code fences):

{
  "title": "creative, unique date title",
  "overview": "One captivating sentence",
  "city": "${city}",
  "startTime": "${String(startHr).padStart(2,'0')}:00",
  "endTime": "${String(endHr).padStart(2,'0')}:00",
  "durationHours": ${durationHours},
  "transportMode": "${transportMode}",
  "totalCost": number (must be <= ${budget}),
  "budget": ${budget},
  "budgetRemaining": number,
  "travelCost": number, "foodCost": number, "activityCost": number, "parkingCost": number, "giftCost": number,
  "overallScore": number, "romanceScore": number, "conversationScore": number, "budgetScore": number, "photoOppScore": number, "privacyScore": number,
  "activities": [{
    "placeName": "REAL venue matching ${dateType} theme in ${city}",
    "time": "HH:MM",
    "duration": "1.5h",
    "description": "Detailed: atmosphere, what makes it special, what to order/do",
    "lat": number, "lng": number,
    "category": "DINING|ACTIVITY|RELAX|SIGHTSEEING|DESSERT|DRINKS|ENTERTAINMENT",
    "cost": number,
    "emoji": "emoji",
    "tip": "Specific dating tip for this exact venue",
    "photoUrl": "https://images.unsplash.com/photo-ID?w=800",
    "isHighlight": boolean,
    "dressCode": "casual|smart casual|formal",
    "reservationNeeded": boolean,
    "scoreBreakdown": {"romance": 85, "conversation": 75, "budget": 70, "photoOpp": 80, "privacy": 65}
  }],
  "giftSuggestions": [{"name":"gift","cost":number,"emoji":"🎁","reason":"why"}],
  "bestPhotoSpots": ["3 spots"],
  "goldenHourTiming": "sunset time",
  "weatherConditions": "realistic",
  "backupPlans": ["2 rain alternatives"],
  "conversationStarters": ["3 questions for ${relationshipStage}"],
  "vibe": "3-4 words",
  "dressCode": "outfit advice",
  "romanticMoment": "unforgettable moment description"
}

QUALITY CHECKLIST:
✓ EVERY venue matches ${dateType} date type exactly (e.g. BEACH = waterfront only, no inland)
✓ All places are REAL, verifiable venues in ${city}, Malaysia
✓ Accurate coordinates
✓ At least 3 activities: dining/drinks + activity + dessert/drinks
✓ Budget adds up correctly
✓ Venues are DIFFERENT from typical tourist recommendations`;

    const res = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${DEEPSEEK_KEY}` },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: 'Malaysia dating concierge. Knows every romantic spot, hidden cafe, scenic viewpoint, and perfect date venue in every Malaysian city. Output ONLY valid JSON. Never markdown. Every venue must be REAL and match the EXACT date type requested.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.9, max_tokens: 4000,
      }),
      signal: AbortSignal.timeout(50000),
    });

    if (!res.ok) return NextResponse.json({ error: 'AI unavailable' }, { status: 502 });

    const json = await res.json();
    let content = json.choices?.[0]?.message?.content || '';
    if (content.startsWith('```')) content = content.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();

    const plan = JSON.parse(content);
    return NextResponse.json({ data: plan });
  } catch {
    return NextResponse.json({ error: 'Please try again.' }, { status: 500 });
  }
}
