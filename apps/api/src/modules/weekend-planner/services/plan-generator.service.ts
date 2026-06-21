import { Injectable, Logger } from '@nestjs/common';
import { WeekendPlanInput, AIWeekendPlanOutput, aiWeekendPlanSchema } from '../interfaces/weekend-plan.interface';
import { FallbackPlannerService } from './fallback-planner.service';
import { TravelDNAService } from './travel-dna.service';

function normalizeAIOutput(raw: any): any {
  const catMap: Record<string, string> = {
    'ATTRACTION': 'TOURIST_ATTRACTION', 'CAFE': 'CAFE_STOP',
    'RESTAURANT': 'DINNER', 'FOOD': 'DINNER', 'NIGHTLIFE': 'NIGHT_ACTIVITY',
    'HIDDEN': 'HIDDEN_GEM', 'PHOTO': 'PHOTO_SPOT', 'SHOPPING': 'SHOPPING',
    'NATURE': 'NATURE', 'TRANSIT': 'TRANSIT',
    'BREAKFAST': 'BREAKFAST', 'LUNCH': 'LUNCH', 'TOURIST_ATTRACTION': 'TOURIST_ATTRACTION',
    'CAFE_STOP': 'CAFE_STOP', 'PHOTO_SPOT': 'PHOTO_SPOT', 'HIDDEN_GEM': 'HIDDEN_GEM',
  };

  // Ensure days array
  if (!raw.days || !Array.isArray(raw.days)) raw.days = [{ dayNumber: 1, theme: 'Day 1', stops: [] }];

  for (let i = 0; i < raw.days.length; i++) {
    const day = raw.days[i];
    // Ensure day fields
    if (!day.dayNumber) day.dayNumber = i + 1;
    if (!day.theme) day.theme = `Day ${i + 1}`;
    if (!day.weatherNote) day.weatherNote = 'Partly cloudy, 26-32C';
    if (!day.stops || !Array.isArray(day.stops)) day.stops = [];

    for (const stop of day.stops) {
      // Normalize category
      if (stop.category && catMap[stop.category]) stop.category = catMap[stop.category];
      if (!stop.category) stop.category = 'TOURIST_ATTRACTION';
      // Ensure required stop fields
      if (!stop.time) stop.time = '10:00';
      if (!stop.placeName) stop.placeName = 'Local Spot';
      if (!stop.description) stop.description = 'A great place to visit';
      if (stop.cost === undefined) stop.cost = 0;
      if (!stop.currency) stop.currency = 'MYR';
      if (!stop.transport) stop.transport = 'Drive';
      if (stop.durationMinutes === undefined) stop.durationMinutes = 60;
      if (stop.order === undefined) stop.order = 0;
      // Map flat cost to estimatedSpend
      if (stop.estimatedSpend === undefined) stop.estimatedSpend = stop.cost || 0;
    }
  }

  // Ensure budgetBreakdown
  if (!raw.budgetBreakdown) raw.budgetBreakdown = {};
  const bb = raw.budgetBreakdown;
  if (!bb.hotel) bb.hotel = { estimatedCost: 180, suggestion: 'Recommended hotel', suggestionRating: 4.0 };
  if (!bb.food) bb.food = { estimatedCost: 100, mealCount: 4 };
  if (!bb.transport) bb.transport = { estimatedCost: 50, primaryMode: 'Drive' };
  if (!bb.tickets) bb.tickets = { estimatedCost: 30, attractions: [] };
  if (!bb.fuel) bb.fuel = { estimatedCost: 80, totalDistanceKm: 350 };
  if (!bb.toll) bb.toll = { estimatedCost: 40, tollRoutes: ['PLUS Highway'] };
  if (!bb.parking) bb.parking = { estimatedCost: 20, parkingSpots: 4 };
  if (!bb.emergencyBuffer) bb.emergencyBuffer = { estimatedCost: 50, percentage: 12 };
  if (!bb.total) bb.total = (bb.hotel?.estimatedCost||0) + (bb.food?.estimatedCost||0) + (bb.transport?.estimatedCost||0) + (bb.tickets?.estimatedCost||0) + (bb.fuel?.estimatedCost||0) + (bb.toll?.estimatedCost||0) + (bb.parking?.estimatedCost||0) + (bb.emergencyBuffer?.estimatedCost||0) || 500;

  // Normalize budget attractions
  if (bb.tickets?.attractions && Array.isArray(bb.tickets.attractions)) {
    bb.tickets.attractions = bb.tickets.attractions.map((a: any) => typeof a === 'string' ? { name: a, price: 0 } : a);
  }

  // Ensure tips
  if (!raw.tips || !Array.isArray(raw.tips)) raw.tips = ['Book ahead', 'Bring an umbrella', 'Carry cash'];
  if (!raw.title) raw.title = 'AI-Generated Trip Plan';

  return raw;
}

@Injectable()
export class PlanGeneratorService {
  private readonly logger = new Logger(PlanGeneratorService.name);

  constructor(
    private readonly fallbackPlanner: FallbackPlannerService,
    private readonly travelDNA: TravelDNAService,
  ) {}

  async generate(input: WeekendPlanInput, userId?: string): Promise<{
    plan: AIWeekendPlanOutput;
    model: string;
    tokensUsed: number;
  }> {
    const startTime = Date.now();

    const DEEPSEEK_KEY = process.env.DEEPSEEK_API_KEY || '';
    const OPENAI_KEY = process.env.OPENAI_API_KEY || '';
    const GEMINI_KEY = process.env.GEMINI_API_KEY || '';

    if (DEEPSEEK_KEY) {
      this.logger.log('Attempting DeepSeek API...');
      try {
        const result = await this.callDeepSeek(input, DEEPSEEK_KEY, userId);
        if (result) {
          this.logger.log(`DeepSeek generated plan in ${Date.now() - startTime}ms`);
          return { plan: result, model: 'deepseek-chat', tokensUsed: result._tokens ?? 0 };
        }
      } catch (err) {
        this.logger.warn('DeepSeek generation failed', err);
      }
    }

    // Tier 2: GPT-4o
    if (OPENAI_KEY) {
      try {
        const result = await this.callGPT4o(input, OPENAI_KEY, userId);
        if (result) {
          this.logger.log(`GPT-4o generated plan in ${Date.now() - startTime}ms`);
          return { plan: result, model: 'gpt-4o', tokensUsed: result._tokens ?? 0 };
        }
      } catch (err) {
        this.logger.warn('GPT-4o generation failed', err);
      }
    }

    // Tier 3: Gemini 2.5 Flash
    if (GEMINI_KEY) {
      try {
        const result = await this.callGemini(input, GEMINI_KEY, userId);
        if (result) {
          this.logger.log(`Gemini generated plan in ${Date.now() - startTime}ms`);
          return { plan: result, model: 'gemini-2.5-flash', tokensUsed: result._tokens ?? 0 };
        }
      } catch (err) {
        this.logger.warn('Gemini generation failed', err);
      }
    }

    // Tier 4: Rule-based fallback (100% guarantee)
    this.logger.log('Falling back to rule-based planner');
    const plan = this.fallbackPlanner.generate(input);
    return { plan, model: 'rule-based', tokensUsed: 0 };
  }

  // =============================================================================
  // DeepSeek (OpenAI-compatible, much cheaper than GPT-4o)
  // =============================================================================

  private async callDeepSeek(input: WeekendPlanInput, apiKey: string, userId?: string): Promise<(AIWeekendPlanOutput & { _tokens?: number }) | null> {
    const prompt = this.buildPrompt(input, userId) + '\n\nRespond ONLY with valid JSON. No markdown, no explanation.';

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000); // 20s timeout

    try {
      const { tlsFetch } = await import('../../../common/tls-fetch');
      const res = await tlsFetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: 'You are a travel planning AI. You MUST respond with ONLY valid JSON. No markdown, no explanation, no code fences. Pure JSON object only.' },
            { role: 'user', content: prompt },
          ],
          temperature: 0.7,
          max_tokens: Math.max(8000, ((input as any).dayCount || 2) * 1500), // Scale with days: 2→8000, 8→12000
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        this.logger.warn(`DeepSeek API returned ${res.status}: ${errText.slice(0, 200)}`);
        return null;
      }

      const data = await res.json();
      const content: string = data.choices?.[0]?.message?.content || '';
      if (!content) {
        this.logger.warn('DeepSeek returned empty content');
        return null;
      }

      // Robust JSON extraction — handles markdown fences, extra text, multiple blocks
      let jsonStr = content.trim();
      // Remove markdown code fences
      jsonStr = jsonStr.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
      // Extract first complete JSON object
      const match = jsonStr.match(/\{[\s\S]*\}/);
      if (!match) { this.logger.warn('No JSON object found in DeepSeek response'); return null; }
      jsonStr = match[0];
      // Log a preview of what the AI returned
      this.logger.log(`DeepSeek JSON preview: ${jsonStr.slice(0,150)}...`);
      let parsed: any;
      try {
        parsed = normalizeAIOutput(JSON.parse(jsonStr));
      } catch (parseErr: any) {
        // Last resort: try to fix common JSON issues
        this.logger.warn(`JSON parse failed: ${parseErr.message?.slice(0,100)}. Attempting fixes...`);
        try {
          // Try removing trailing commas, fixing unicode
          const fixed = jsonStr.replace(/,\s*}/g, '}').replace(/,\s*\]/g, ']');
          parsed = normalizeAIOutput(JSON.parse(fixed));
        } catch (e2: any) {
          this.logger.warn(`JSON fix also failed: ${e2.message?.slice(0,100)}. Using empty plan.`);
          return null;
        }
      }
      let validated: any;
      try {
        validated = aiWeekendPlanSchema.parse(parsed);
      } catch (zodErr: any) {
        this.logger.warn(`Zod validation skipped — using normalized AI output`);
        validated = parsed;
      }
      return { ...validated, _tokens: data.usage?.total_tokens ?? 0 };
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        this.logger.warn('DeepSeek API timed out');
      } else {
        this.logger.warn(`DeepSeek API error: ${err?.message ?? err}`);
      }
      return null;
    } finally {
      clearTimeout(timeout);
    }
  }

  // =============================================================================
  // GPT-4o
  // =============================================================================

  private async callGPT4o(input: WeekendPlanInput, apiKey: string, userId?: string): Promise<(AIWeekendPlanOutput & { _tokens?: number }) | null> {
    const prompt = this.buildPrompt(input, userId);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
          max_tokens: Math.max(4000, ((input as any).dayCount || 2) * 1000), // Scale with days
          response_format: { type: 'json_object' },
        }),
        signal: controller.signal,
      });

      if (!res.ok) return null;

      const data = await res.json();
      const content = data.choices?.[0]?.message?.content;
      if (!content) return null;

      const parsed = JSON.parse(content);
      const validated = aiWeekendPlanSchema.parse(parsed);
      return { ...validated, _tokens: data.usage?.total_tokens ?? 0 };
    } catch (err) {
      if (err instanceof SyntaxError) {
        this.logger.warn('GPT-4o returned invalid JSON');
      }
      return null;
    } finally {
      clearTimeout(timeout);
    }
  }

  // =============================================================================
  // Gemini 2.5 Flash
  // =============================================================================

  private async callGemini(input: WeekendPlanInput, apiKey: string, userId?: string): Promise<(AIWeekendPlanOutput & { _tokens?: number }) | null> {
    const prompt = this.buildPrompt(input, userId);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.7, maxOutputTokens: Math.max(4000, ((input as any).dayCount || 2) * 1000) },
          }),
          signal: controller.signal,
        },
      );

      if (!res.ok) return null;

      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) return null;

      // Strip markdown code fences if present
      const jsonStr = text.replace(/^```json\s*/, '').replace(/```$/, '').trim();
      const parsed = normalizeAIOutput(JSON.parse(jsonStr));
      const validated = aiWeekendPlanSchema.parse(parsed);
      return { ...validated, _tokens: data.usageMetadata?.totalTokenCount ?? 0 };
    } catch (err) {
      if (err instanceof SyntaxError) {
        this.logger.warn('Gemini returned invalid JSON');
      }
      return null;
    } finally {
      clearTimeout(timeout);
    }
  }

  // =============================================================================
  // PROMPT ENGINEERING
  // =============================================================================

  private buildPrompt(input: WeekendPlanInput, userId?: string): string {
    // Cap styles to prevent AI confusion — max 3 for focused prompts
    const rawStyles = input.travelStyles || [];
    const cappedStyles = rawStyles.length > 3
      ? rawStyles.slice(0, 3).join(', ') + ' (and more)'
      : rawStyles.join(', ');
    const styles = cappedStyles || 'General explorer';
    const prefs = (input.specialPreferences ?? []).length > 0
      ? input.specialPreferences!.join(', ')
      : 'None';

    // Personalize with Travel DNA
    const dnaContext = userId ? this.travelDNA.getAIContext(userId) : '';
    // Notify DNA of this plan's style choices
    if (userId) this.travelDNA.learnFromPlan(userId, input.travelStyles, input.budget);

    return `You are ExploreMY AI, a professional travel planning expert. Generate a DETAILED, PROFESSIONAL weekend itinerary as JSON.

## USER DNA PROFILE
${dnaContext || 'New user — no history yet.'}

## USER REQUEST
- Destination: ${input.destination} (${input.destinationLat}, ${input.destinationLng})
- Dates: ${input.startDate} to ${input.endDate} (${(input as any).dayCount || 2} days)
- Budget: ${input.budget} ${input.budgetCurrency ?? 'MYR'}
- Transport: ${input.transportMode}
- Group: ${input.groupType}, ${input.groupSize} ${input.groupSize === 1 ? 'person' : 'people'}
- Style: ${styles}
- Preferences: ${prefs}

## WEATHER
Assume typical weather for this destination and season. Provide a weatherNote per day.

## DIETARY CONSTRAINTS
${(input.specialPreferences ?? []).includes('HALAL_FOOD') ? '- ALL meals MUST be halal-certified or Muslim-owned. NO pork, NO alcohol at meal stops.' : ''}
${(input.specialPreferences ?? []).includes('VEGETARIAN') ? '- ALL meals MUST be vegetarian-friendly. Prefer Indian vegetarian, Buddhist vegetarian, or vegan cafes.' : ''}

## ⚠️ BUDGET IS THE #1 RULE ⚠️
The TOTAL cost (budgetBreakdown.total) MUST equal ${input.budget} ${input.budgetCurrency ?? 'MYR'} with a tolerance of ±20.
If your plan exceeds the budget, REDUCE costs by choosing cheaper alternatives.
If your plan is under budget, UPGRADE to better restaurants/hotels.
The user will reject any plan whose total deviates by more than 20 from ${input.budget}.
Current target: EXACTLY ${input.budget}.

## CRITICAL RULES
1. 6-8 stops per day: breakfast (~7:30), morning activity (~9:00), lunch (~12:30), afternoon activity (~14:00), café (~16:00), dinner (~18:00), night activity (~20:30)
2. At least 2 hidden gems (isHiddenGem: true) per day — places with local character, few tourists, high quality
3. At least 1 photo spot (isPhotoSpot: true) per day — viewpoints, murals, architecture, scenic spots
4. EVERY DAY MUST HAVE COMPLETELY DIFFERENT PLACES. No place name can appear in more than one day.
5. No two consecutive meals of the same cuisine type
6. Transport mode must be realistic: Walk ≤ 1.5km, Grab/Drive for longer
7. Duration: meals 45-90 min, attractions 60-120 min, cafés 30-60 min, photo spots 15-30 min
8. FAMILY → kid-friendly, no late-night stops past 9 PM. COUPLE → romantic spots, nice dinners.
9. All costs in ${input.budgetCurrency ?? 'MYR'}
10. Use REAL place names — the most famous, highly-rated places in this destination
11. Include creative, specific daily themes
12. Write descriptions — for ${(input as any).dayCount <= 2 ? '3-4 sentences' : '1-2 sentences'} per stop. Include key highlights: what makes it special, what to order, ambiance. Be concise — the plan has ${(input as any).dayCount || 2} days with multiple stops each, so keep descriptions focused and short

## 🎨 STYLE PERSONALIZATION — CRITICAL
${input.travelStyles.map(s => {
  switch(s) {
    case 'FOODIE': return '- 🍜 FOODIE: Prioritize hawker centres, street food, local kopitiams, and famous Malaysian eateries. At least 50% of stops should be food-related. Include dishes like nasi lemak, char kway teow, laksa, roti canai, satay.';
    case 'ADVENTURE': return '- 🧗 ADVENTURE: Focus on outdoor activities — hiking trails, waterfalls, caves, water sports, zip-lining. Include physical activities that get the adrenaline pumping.';
    case 'NATURE': return '- 🌿 NATURE: Prioritize parks, gardens, forests, beaches, wildlife sanctuaries, botanical gardens. Maximize outdoor green spaces and scenic natural landmarks.';
    case 'PHOTOGRAPHY': return '- 📸 PHOTO: Make EVERY stop highly photogenic. Prioritize viewpoints, instagrammable cafes, street art, heritage architecture, sunset spots. Every day needs multiple isPhotoSpot stops.';
    case 'LUXURY': return '- ✨ LUXURY: Premium experiences only — fine dining, rooftop bars, 5-star hotels, private tours, spa treatments. Budget per stop should be higher. Quality over quantity.';
    case 'BUDGET': return '- 💰 BUDGET: Maximize value — free attractions, cheap eats (RM5-15), public transport, free walking tours. Keep total daily spend under budget/2. Favor hawker centres over restaurants.';
    case 'NIGHTLIFE': return '- 🌙 NIGHTLIFE: Make evening stops the highlight — bars, clubs, live music venues, night markets. Schedule the best activities after 8PM. Include at least 2 night activities per day.';
    default: return '';
  }
}).filter(Boolean).join('\n')}
Each selected style MUST significantly influence the places chosen. Two users with different styles should get completely different restaurant and activity recommendations.

## CRITICAL REQUIREMENTS
- Generate EXACTLY ${(input as any).dayCount || 2} days in the "days" array. NO more, NO less.
- ⚠️ EVERY SINGLE STOP across ALL days MUST have a COMPLETELY UNIQUE placeName. ZERO repeats. If you repeat any place name, the entire plan is REJECTED. Use different restaurants, different attractions, different cafes for each day.
- Each day MUST have a different theme from other days. No two days can share the same theme.
- For ${(input as any).dayCount || 2} days, you need at minimum ${((input as any).dayCount || 2) * 6} different real venue names. Do NOT use generic names like "Local Cafe" or "City Restaurant". Use ONLY real, specific place names.

## OUTPUT FORMAT (JSON only, no markdown):

{
  "title": "Professional, creative title for this weekend",
  "days": [{
    "dayNumber": 1,
    "theme": "Specific day theme with destination flavor",
    "weatherNote": "Detailed weather guidance for the day's activities",
    "stops": [{
      "order": 1,
      "time": "07:30",
      "endTime": "08:30",
      "durationMinutes": 60,
      "placeId": "real-place-name-id",
      "placeName": "Actual, real place name — be specific and accurate",
      "category": "BREAKFAST",
      "emoji": "🍜",
      "description": "2-3 sentences: what makes this place special, what to order, the ambiance, any local significance. Be professional and detailed.",
      "estimatedSpend": 15.00,
      "entryFee": 0,
      "isHiddenGem": false,
      "isPhotoSpot": false,
      "isIndoor": false,
      "crowdLevel": "medium",
      "aiReasoning": "Explain specifically why THIS place was chosen for THIS user's preferences, group type, and travel style",
      "transportFromPrev": {
        "mode": "WALKING",
        "distanceMeters": 400,
        "durationMinutes": 5,
        "estimatedCost": 0
      }
    }]
  }],
  "budgetBreakdown": {
    "hotel": { "estimatedCost": 0, "suggestion": "Real hotel name in this destination", "suggestionRating": 4.5, "hotelOptions": [{"name":"Hotel Name","price":0,"rating":4.5,"description":"Brief hotel description","amenities":["WiFi","Pool"]}] },
    "food": { "estimatedCost": 0, "mealCount": 0 },
    "transport": { "estimatedCost": 0, "primaryMode": "${input.transportMode}" },
    "tickets": { "estimatedCost": 0, "attractions": [{"name":"Attraction name","price":0}] },
    "fuel": { "estimatedCost": 0, "totalDistanceKm": 0 },
    "toll": { "estimatedCost": 0, "tollRoutes": [] },
    "parking": { "estimatedCost": 0, "parkingSpots": 0 },
    "emergencyBuffer": { "estimatedCost": 0, "percentage": 12.5 },
    "total": ${input.budget}
  },
  "tips": ["4-5 specific, actionable tips for THIS exact plan in THIS destination"]
}

CRITICAL: budgetBreakdown.total MUST be ${input.budget}. Adjust all cost estimates so the sum equals exactly ${input.budget}.`;
  }
}
