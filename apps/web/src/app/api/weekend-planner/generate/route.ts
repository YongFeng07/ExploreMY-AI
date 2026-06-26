import { NextResponse } from 'next/server';

const KEY = process.env.DEEPSEEK_API_KEY || '';

function extractJSON(text: string): any {
  let raw = text.trim();

  // Remove everything before first { and after last }
  const first = raw.indexOf('{');
  const last = raw.lastIndexOf('}');
  if (first >= 0 && last > first) raw = raw.substring(first, last + 1);

  // Remove markdown fences
  raw = raw.replace(/```(?:json)?\s*/gi, '').replace(/```\s*/g, '');

  // Try direct parse
  try { return JSON.parse(raw); } catch {}

  // Fix: trailing commas before } or ]
  try { return JSON.parse(raw.replace(/,(\s*[}\]])/g, '$1')); } catch {}

  // Fix: unquoted property names (simple cases)
  try { return JSON.parse(raw.replace(/([{,]\s*)(\w+)(\s*:)/g, '$1"$2"$3')); } catch {}

  // Fix: single quotes instead of double
  try { return JSON.parse(raw.replace(/'/g, '"')); } catch {}

  // Fix: NaN/Infinity values
  try { return JSON.parse(raw.replace(/:\s*NaN/g, ':0').replace(/:\s*Infinity/g, ':0')); } catch {}

  // Fix: unclosed strings — close the last string, then close braces
  let fixed = raw;
  let depth = 0, inStr = false, esc = false;
  for (let i = 0; i < fixed.length; i++) {
    const c = fixed[i];
    if (esc) { esc = false; continue; }
    if (c === '\\') { esc = true; continue; }
    if (c === '"') { inStr = !inStr; continue; }
    if (inStr) continue;
    if (c === '{' || c === '[') depth++;
    if (c === '}' || c === ']') depth--;
  }
  if (inStr) fixed += '"';
  while (depth > 0) {
    if (fixed.lastIndexOf('{') > fixed.lastIndexOf('[')) fixed += '}';
    else fixed += ']';
    depth--;
  }
  // Ensure outermost is }
  if (!fixed.trimEnd().endsWith('}')) fixed += '}';

  try { return JSON.parse(fixed); } catch {}

  // Last resort: extract key fields with regex
  const title = (text.match(/"title"\s*:\s*"([^"]+)"/) || [])[1] || 'Trip Plan';
  const dest = (text.match(/"destination"\s*:\s*"([^"]+)"/) || [])[1] || '';

  // Extract stops info
  const stops: any[] = [];
  const placeRegex = /"placeName"\s*:\s*"([^"]+)"/g;
  let match;
  while ((match = placeRegex.exec(text)) !== null) stops.push({ placeName: match[1] });

  if (stops.length > 0) {
    const dateList = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(startDate); d.setDate(d.getDate() + i);
      dateList.push(d.toISOString().split('T')[0]);
    }
    return {
      title, destination: destination, startDate, endDate, totalCost: budget, totalStops: stops.length, hiddenGemCount: 1, groupSize,
      days: dateList.map((date, di) => ({
        dayNumber: di + 1, date, theme: `Day ${di + 1}`,
        weather: { condition: 'Sunny', tempMin: 25, tempMax: 33 },
        stops: stops.slice(di * 4, (di + 1) * 4).map((s: any, i: number) => ({
          placeName: s.placeName, time: `${String(8 + i * 3).padStart(2, '0')}:00`, duration: '1.5h',
          description: `Explore ${s.placeName}`, lat: destinationLat, lng: destinationLng,
          category: 'FOOD', rating: 4, photoUrl: `https://source.unsplash.com/600x400/?${encodeURIComponent(s.placeName)}`,
          emoji: '📍', estimatedSpend: Math.round(budget / stops.length / days), entryFee: 0,
          isHiddenGem: i === 0, isPhotoSpot: i % 2 === 0, mustTry: '',
          transportFromPrev: i > 0 ? { mode: transportMode, distance: 3000, time: 10, cost: 5 } : null,
        })),
        dayTotalCost: Math.round(budget / days), dayTotalDistance: 5000, dayTotalTime: 240,
      })),
      budgetBreakdown: { accommodation: Math.round(budget * 0.3), food: Math.round(budget * 0.3), transport: Math.round(budget * 0.2), activities: Math.round(budget * 0.15), shopping: Math.round(budget * 0.05), misc: 0, total: budget, budgetUtilization: 1, perPersonPerDay: Math.round(budget / days / groupSize), savingsTips: ['Try local street food for better value'] },
      roadtrip: { totalDistance: 10000, totalDrivingTime: 60, fuelCost: 30, tollCost: 10, stops: [] },
      bestPhotoSpots: stops.slice(0, 3).map((s: any) => `${s.placeName} - Best photo spot`),
      aiTips: ['Start early to avoid crowds', 'Carry cash for street food stalls', 'Check weather before heading out'],
      localCuisine: stops.slice(0, 3).map((s: any) => ({ name: s.placeName, description: `Local favorite`, avgPrice: 15, mustTry: true })),
    };
  }
  return null;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { destination, destinationLat, destinationLng, startDate, endDate, budget = 500, transportMode = 'DRIVING', groupType = 'COUPLE', travelStyles = [], groupSize = 2 } = body;
    if (!KEY) return NextResponse.json({ error: 'AI not configured' }, { status: 500 });

    const days = Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000) + 1;
    const seed = Date.now() % 9999;

    const uniquenessHints = [
      'explore the less touristy neighborhoods and suburbs',
      'focus on places locals love but tourists rarely find',
      'mix luxury experiences with authentic street food',
      'include early morning spots for the best experience',
      'find the most Instagram-worthy hidden corners',
      'prioritize family-run businesses over chains',
      'seek out places with historical significance',
      'find spots with the best views and photo opportunities',
      'include places featured in Malaysian films and media',
      'discover underground and alternative venues',
      'find places where you can interact with locals',
      'include eco-friendly and sustainable venues',
      'seek out award-winning and critically acclaimed spots',
      'find the best value-for-money experiences',
      'include spiritual and wellness-focused locations',
    ];
    const hint = uniquenessHints[seed % uniquenessHints.length];

    const prompt = `Create a ${days}-day trip in ${destination}, Malaysia. Budget RM${budget}. ${groupType} ${groupSize}p, ${transportMode}. Styles: ${travelStyles.join(',')||'general'}. Seed:${seed}. ${hint}.

Return ONLY valid JSON (no markdown): {"title":"Trip Title","destination":"${destination}","startDate":"${startDate}","endDate":"${endDate}","totalCost":400,"totalStops":8,"hiddenGemCount":2,"groupSize":${groupSize},"days":[{"dayNumber":1,"date":"${startDate}","theme":"Theme","weather":{"condition":"Sunny","tempMin":25,"tempMax":33},"stops":[{"placeName":"Real ${destination} place","time":"09:00","duration":"1.5h","description":"What to do","lat":0,"lng":0,"category":"FOOD","rating":4,"photoUrl":"https://images.unsplash.com/photo-ID?w=800","emoji":"📍","estimatedSpend":25,"entryFee":0,"isHiddenGem":false,"isPhotoSpot":false,"mustTry":""}],"dayTotalCost":200,"dayTotalDistance":5000,"dayTotalTime":240}],"budgetBreakdown":{"accommodation":0,"food":0,"transport":0,"activities":0,"shopping":0,"misc":0,"total":0,"savingsTips":[]},"aiTips":[],"localCuisine":[],"whereToStay":[{"name":"","type":"mid","pricePerNight":80,"description":""}]}

Use REAL ${destination} places. Budget <= ${budget}.`;

    const res = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${KEY}` },
      body: JSON.stringify({ model: 'deepseek-chat', messages: [{ role: 'system', content: 'Output only valid JSON, no markdown.' }, { role: 'user', content: prompt }], temperature: 0.7, max_tokens: 3500 }),
      signal: AbortSignal.timeout(35000),
    });

    if (!res.ok) return NextResponse.json({ error: 'AI service temporarily unavailable. Please try again.' }, { status: 502 });

    const json = await res.json();
    const content = json.choices?.[0]?.message?.content || '';

    const plan = extractJSON(content);
    if (plan) return NextResponse.json({ data: plan });

    console.error('All parse attempts failed. Content length:', content.length);
    return NextResponse.json({ error: 'Failed to parse AI response. Please try again.' }, { status: 500 });
  } catch (e: any) {
    console.error('WP fatal:', e.message);
    return NextResponse.json({ error: 'Unable to generate. Please try again.' }, { status: 500 });
  }
}
