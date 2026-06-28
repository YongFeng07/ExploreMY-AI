import { NextResponse } from 'next/server';

const DEEPSEEK_KEY = process.env.DEEPSEEK_API_KEY || '';

// Comprehensive Malaysia location database for search coverage
const MALAYSIA_LOCATIONS = [
  // KL / Selangor
  'Kuala Lumpur','Bukit Bintang','KLCC','Bangsar','Damansara Heights','Mont Kiara','Cheras','Ampang','Setapak','Wangsa Maju','Sri Petaling','Kuchai Lama','Puchong','Subang Jaya','Petaling Jaya','Sunway','Shah Alam','Klang','Kajang','Cyberjaya','Putrajaya','Sentul','Batu Caves','Gombak','Rawang','Sepang','Semenyih','Dengkil',
  // Penang
  'George Town','Batu Ferringhi','Tanjung Bungah','Tanjung Tokong','Gurney Drive','Butterworth','Bukit Mertajam','Bayan Lepas','Balik Pulau','Nibong Tebal','Seberang Jaya','Kepala Batas',
  // Johor
  'Johor Bahru','Iskandar Puteri','Nusajaya','Skudai','Tebrau','Mount Austin','Permas Jaya','Kulai','Senai','Pontian','Batu Pahat','Muar','Kluang','Segamat','Mersing','Kota Tinggi','Desaru',
  // Melaka
  'Melaka','Jonker Street','Klebang','Ayer Keroh','Alor Gajah','Masjid Tanah',
  // Perak
  'Ipoh','Taiping','Teluk Intan','Sitiawan','Lumut','Pangkor Island','Kuala Kangsar','Tambun',
  // Kedah / Perlis
  'Alor Setar','Langkawi','Kuah','Pantai Cenang','Sungai Petani','Kulim','Jitra','Kangar',
  // Kelantan
  'Kota Bharu','Pengkalan Chepa','Tumpat','Pasir Mas','Bachok','Kuala Krai',
  // Terengganu
  'Kuala Terengganu','Kuala Nerus','Marang','Dungun','Kemaman','Chukai','Pulau Redang','Pulau Perhentian','Kerteh',
  // Pahang
  'Kuantan','Genting Highlands','Bukit Tinggi','Bentong','Raub','Temerloh','Jerantut','Pekan','Cameron Highlands','Tanah Rata','Brinchang','Fraser\'s Hill',
  // Negeri Sembilan
  'Seremban','Port Dickson','Nilai','Jempol','Kuala Pilah','Rembau',
  // Sabah
  'Kota Kinabalu','Sandakan','Tawau','Lahad Datu','Semporna','Keningau','Ranau','Kundasang','Papar','Beaufort',
  // Sarawak
  'Kuching','Miri','Sibu','Bintulu','Mukah','Sarikei','Sri Aman','Kapit','Limbang','Lawas',
];

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      city = 'Kuala Lumpur', budget = 150, durationHours = 4,
      transportMode = 'DRIVING', relationshipStage = 'DATING',
      dateType = 'ROMANTIC', preferredTime = 'EVENING', dateSelected,
    } = body;

    if (!DEEPSEEK_KEY) return NextResponse.json({ error: 'AI not configured' }, { status: 500 });

    const minBudget = durationHours * 30;
    if (budget < minBudget) return NextResponse.json({ error: `Minimum budget is RM${minBudget} for ${durationHours}h date` }, { status: 400 });

    const startHr = preferredTime?.includes(':') ? parseInt(preferredTime.split(':')[0]) || 18 : preferredTime === 'MORNING' ? 9 : preferredTime === 'AFTERNOON' ? 14 : preferredTime === 'EVENING' ? 18 : 18;
    const endHr = (startHr + durationHours) % 24;

    const seed = Date.now() % 99999;
    const vibes = ['cozy hidden gem', 'trendy hotspot', 'quiet secret spot', 'local favorite', 'upscale classic', 'artsy newcomer', 'romantic hideaway', 'scenic viewpoint', 'underground gem', 'waterfront beauty', 'rooftop escape', 'garden paradise'];
    const randomVibe = vibes[Math.floor(Math.random() * vibes.length)];

    // Find matching Malaysia locations for better AI context
    const cityLower = city.toLowerCase();
    const matchLocations = MALAYSIA_LOCATIONS.filter(l => l.toLowerCase().includes(cityLower) || cityLower.includes(l.toLowerCase()));
    const locationContext = matchLocations.length > 0
      ? `\n📍 VALID ${city.toUpperCase()} LOCATIONS — You MUST pick venues ONLY from these areas:\n${matchLocations.slice(0, 15).join(' · ')}${matchLocations.length > 15 ? ` · and ${matchLocations.length - 15} more areas` : ''}`
      : `\n📍 LOCATION: ${city}, Malaysia. Search ALL neighborhoods, suburbs, and nearby areas. Include at least 3 different neighborhoods.`;

    // Date type rules
    const dateTypeRules: Record<string, string> = {
      ROMANTIC: 'Focus on romantic venues: candlelit restaurants, rooftop bars, sunset viewpoints, intimate cafes, romantic walks, fine dining. Avoid loud clubs, crowded food courts, family restaurants.',
      ADVENTURE: 'Focus on adventure: outdoor sports, hiking trails, water sports, escape rooms, rock climbing, ziplining, ATV rides. Balance with a nice dinner spot.',
      CASUAL: 'Focus on casual hangouts: laid-back cafes, street food, casual dining, parks, board game cafes, dessert shops. Avoid overly formal venues.',
      FOODIE: 'Focus on food experiences: hawker stalls, specialty restaurants, dessert cafes, food tours, night markets, kopitiams. Include specific dish recommendations. Balance with a non-food activity.',
      BEACH: 'Focus on beach/waterfront: beachside cafes, seaside restaurants, waterfront walks, sunset spots by water, water activities. Mix with some inland stops for variety.',
      CULTURAL: 'Focus on culture: museums, art galleries, temples, mosques, heritage sites, cultural performances, batik workshops. Balance with a nice dining experience.',
      OUTDOOR: 'Focus on outdoors: parks, gardens, nature trails, open-air markets, hiking spots, botanical gardens, waterfalls. Mix with indoor stops for comfort.',
      LUXURY: 'Focus on premium: fine dining, 5-star hotels, rooftop bars, private dining, spa experiences, wine bars. All venues should feel elevated but keep within budget.',
      RELAXED: 'Focus on relaxing: spas, quiet cafes, parks, libraries, slow-paced activities, tea houses. Avoid loud or crowded venues.',
      FUN: 'Focus on entertainment: karaoke, bowling, arcades, amusement parks, comedy clubs, live music. Balance with quieter moments for conversation.',
    };
    const strictRule = dateTypeRules[dateType] || dateTypeRules.ROMANTIC;

    // Relationship stage
    const stageGuide: Record<string, string> = {
      DATING: 'Focus on getting to know each other. Good conversation atmosphere. Not too intimate. Fun, light-hearted energy.',
      RELATIONSHIP: 'Focus on shared experiences and creating memories. Romantic but comfortable. Mix of activities that show thoughtfulness.',
      MARRIED: 'Focus on rekindling romance and breaking routine. Intimate meaningful experiences. Quality time over quantity.',
      FIRST_DATE: 'Focus on low-pressure environments with easy exit options. Casual but impressive. Public places. Short activities with flexibility.',
    };

    const prompt = `You are Malaysia's #1 dating concierge, featured in Tatler and TimeOut KL. Design an unforgettable ${durationHours}-hour ${dateType} date in ${city}, Malaysia.

📋 PARAMETERS:
- Date Type: ${dateType}
- Strict Rules: ${strictRule}
- Relationship: ${relationshipStage} — ${stageGuide[relationshipStage] || ''}
- Budget: RM${budget} total for 2 people (≈RM${Math.round(budget/durationHours)}/hour)
- Transport: ${transportMode}
- Time: ${preferredTime} (${String(startHr).padStart(2,'0')}:00–${String(endHr).padStart(2,'0')}:00)
- Seed: #${seed} (generate COMPLETELY unique venues)
- Vibe: ${randomVibe}
${locationContext}

🚫 CRITICAL LOCATION RULE: Every venue MUST be inside or within 5km of ${city}. If you suggest a venue in another city (e.g. suggesting Penang places for a KL date), the entire plan is INVALID. ALL coordinates must resolve to ${city} area on Google Maps. Verify each venue's city before outputting.

💰 BUDGET-TIER (match venues to budget exactly): ${budget < 150 ? 'ECONOMY: Hawker stalls, street food (RM5-20), free activities (RM0-10), mamak dessert (RM5-15). Per activity RM10-30.' : budget < 400 ? 'MID-RANGE: Popular restaurants (RM15-40), paid attractions (RM10-40), nice cafes (RM15-30). Per activity RM20-60.' : 'PREMIUM: Fine dining (RM40-150+), private tours (RM30-200), cocktail bars (RM25-80). Per activity RM40-120.'}

🎨 STYLE BALANCE: Your date type is ${dateType}. About 60% of activities should match ${dateType}, 40% should be complementary (romantic ambiance, photo-worthy, cultural, or nature elements). Do NOT make every activity the same type — variety makes dates memorable.

📐 ACTIVITY REQUIREMENTS:
- Generate 4-6 activities (minimum 4) covering: dining + activity + dessert/drinks + bonus
- Each venue must be REAL with accurate Google Maps coordinates (4 decimal places)
- Vary locations across ${city} — avoid clustering all activities in one area
- Include at least 1 hidden gem (not typical tourist spot, <500 Google reviews)
- Include at least 2 photo-worthy spots (romantic lighting, scenic views, Instagram-worthy)
- Budget breakdown: ≈40% dining, ≈25% activity, ≈15% dessert/drinks, ≈20% transport/misc
- Each activity's cost MUST match the budget tier above — no luxury venues on economy budget, no hawker stalls on premium budget

Return ONLY valid JSON (no markdown, no \`\`\` fences):
{
  "title":"unique creative date title (include city name)",
  "overview":"one captivating sentence describing the date experience",
  "city":"${city}",
  "startTime":"${String(startHr).padStart(2,'0')}:00",
  "endTime":"${String(endHr).padStart(2,'0')}:00",
  "durationHours":${durationHours},
  "transportMode":"${transportMode}",
  "totalCost":number (must be ≤${budget}),
  "budget":${budget},
  "budgetRemaining":number,
  "travelCost":number,"foodCost":number,"activityCost":number,"parkingCost":number,"giftCost":number,
  "overallScore":number (0-100),
  "romanceScore":number,"conversationScore":number,"budgetScore":number,"photoOppScore":number,"privacyScore":number,
  "activities":[
    {"placeName":"REAL verified venue in ${city}","time":"HH:MM","duration":"1.5h","description":"2-3 sentence professional description covering atmosphere, what makes it special, what to order/do","lat":number,"lng":number,"category":"DINING|ACTIVITY|RELAX|SIGHTSEEING|DESSERT|DRINKS|ENTERTAINMENT","cost":number,"emoji":"emoji","tip":"specific insider dating tip for this exact venue","photoUrl":"https://images.unsplash.com/photo-ID?w=800","isHighlight":boolean,"dressCode":"casual|smart casual|formal","reservationNeeded":boolean,"scoreBreakdown":{"romance":85,"conversation":75,"budget":70,"photoOpp":80,"privacy":65}}
  ],
  "giftSuggestions":[{"name":"thoughtful gift under RM50","cost":number,"emoji":"🎁","reason":"why this gift is perfect for this date"}],
  "bestPhotoSpots":["3-4 specific photo locations in ${city} with best photo time"],
  "goldenHourTiming":"sunset time in ${city} (check actual Malaysia sunset times: 7:00-7:30PM year round)",
  "weatherConditions":"realistic weather for ${city} this time of year",
  "sunsetTiming":"actual sunset time for ${city}",
  "backupPlans":["rain backup plan for ${city}","indoor backup plan","traffic contingency"],
  "rainBackupPlan":"specific indoor alternative venues in ${city}",
  "indoorBackupPlan":"all-indoor version of the date",
  "trafficBackupPlan":"alternative routes or timing advice for ${city} traffic",
  "crowdLevel":"low|moderate|busy|peak — realistic for ${city} at this day/time",
  "crowdRecommendation":"specific advice about crowds at chosen venues and best arrival timing",
  "conversationStarters":["3 engaging questions for ${relationshipStage} at ${city}"],
  "vibe":"3-4 descriptive words capturing the experience",
  "dressCode":"specific outfit advice for ${city} weather and venues",
  "romanticMoment":"unforgettable moment description specific to ${city}",
  "scoreBreakdown":[{"category":"Ambiance","score":85,"reasoning":"why","tips":["improvement tip"]}],
  "trafficTips":["best routes to avoid ${city} traffic","best departure time"]
}

✅ QUALITY CHECK (verify before output):
1. Every placeName exists on Google Maps in ${city}, Malaysia — NOT another city
2. All coordinates are accurate (4 decimals) and within ${city} area
3. Budget breakdown adds up to ≤RM${budget}
4. Activities follow strict ${dateType} rules exactly
5. Venues are spread across different ${city} neighborhoods
6. At least one hidden gem (high rated but <500 reviews)
7. At least 2 photo-worthy spots with good lighting`;

    const res = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${DEEPSEEK_KEY}` },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: 'You are Malaysia\'s #1 dating concierge, featured in Tatler and TimeOut KL. You know every romantic spot, hidden cafe, scenic viewpoint, and perfect date venue in EVERY Malaysian city — from Perlis to Sabah. Output ONLY valid JSON. No markdown, no explanations. Every venue must be REAL and verifiable on Google Maps in the EXACT city specified. If you don\'t know a venue in that city, do NOT substitute one from another city.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.95, max_tokens: 6000,
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
