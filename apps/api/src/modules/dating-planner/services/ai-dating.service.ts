import { Injectable, Logger } from '@nestjs/common';
import { DateEngineService } from './date-engine.service';

@Injectable()
export class AiDatingService {
  private readonly logger = new Logger(AiDatingService.name);

  constructor(private readonly dateEngine: DateEngineService) {}

  async generatePlan(params: {
    city: string; budget: number; durationHours: number;
    transportMode: string; relationshipStage: string; dateType: string;
    preferredTime?: string;
  }): Promise<{ plan: any; model: string; fallback: boolean }> {
    const start = Date.now();
    const DEEPSEEK_KEY = process.env.DEEPSEEK_API_KEY || '';
    const OPENAI_KEY = process.env.OPENAI_API_KEY || '';
    const GEMINI_KEY = process.env.GEMINI_API_KEY || '';

    // Tier 1: GPT-4o
    if (OPENAI_KEY) {
      try {
        const result = await this.callGPT4o(params, OPENAI_KEY);
        if (result) {
          this.logger.log(`GPT-4o dating plan generated in ${Date.now() - start}ms`);
          return { plan: result, model: 'gpt-4o', fallback: false };
        }
      } catch (e) { this.logger.warn('GPT-4o dating plan failed', e); }
    }

    // Tier 2: DeepSeek
    if (DEEPSEEK_KEY) {
      try {
        const result = await this.callDeepSeek(params, DEEPSEEK_KEY);
        if (result) {
          this.logger.log(`DeepSeek dating plan generated in ${Date.now() - start}ms`);
          return { plan: result, model: 'deepseek-chat', fallback: false };
        }
      } catch (e) { this.logger.warn('DeepSeek dating plan failed', e); }
    }

    // Tier 3: Gemini
    if (GEMINI_KEY) {
      try {
        const result = await this.callGemini(params, GEMINI_KEY);
        if (result) {
          this.logger.log(`Gemini dating plan generated in ${Date.now() - start}ms`);
          return { plan: result, model: 'gemini-2.5-flash', fallback: false };
        }
      } catch (e) { this.logger.warn('Gemini dating plan failed', e); }
    }

    return { plan: null, model: 'none', fallback: true };
  }

  // ═══════════════════════════════════════════════════════════════════
  // GPT-4o
  // ═══════════════════════════════════════════════════════════════════

  private async callGPT4o(params: any, apiKey: string): Promise<any> {
    if (!apiKey) return null;
    const prompt = this.buildDatingPrompt(params);
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 15000);
    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({ model: 'gpt-4o', messages: [{ role: 'system', content: this.getSystemPrompt() }, { role: 'user', content: prompt }], temperature: 1.5, max_tokens: 4000 }),
        signal: ctrl.signal,
      });
      if (!res.ok) return null;
      const data = await res.json();
      const content = data.choices?.[0]?.message?.content;
      if (!content) return null;
      return this.hydratePlan(JSON.parse(content), params);
    } catch { return null; }
    finally { clearTimeout(t); }
  }

  // ═══════════════════════════════════════════════════════════════════
  // DeepSeek
  // ═══════════════════════════════════════════════════════════════════

  private async callDeepSeek(params: any, apiKey: string): Promise<any> {
    if (!apiKey) return null;
    const prompt = this.buildDatingPrompt(params);
    const { tlsFetch } = await import('../../../common/tls-fetch');
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 15000);
    try {
      const res = await tlsFetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({ model: 'deepseek-chat', messages: [{ role: 'system', content: this.getSystemPrompt() }, { role: 'user', content: prompt }], temperature: 1.5, max_tokens: 4000 }),
        signal: ctrl.signal,
      });
      if (!res.ok) return null;
      const data = await res.json();
      const content = data.choices?.[0]?.message?.content;
      if (!content) return null;
      return this.hydratePlan(JSON.parse(content), params);
    } catch { return null; }
    finally { clearTimeout(t); }
  }

  // ═══════════════════════════════════════════════════════════════════
  // Gemini
  // ═══════════════════════════════════════════════════════════════════

  private async callGemini(params: any, apiKey: string): Promise<any> {
    if (!apiKey) return null;
    const prompt = this.buildDatingPrompt(params) + '\n\nRespond with JSON only.';
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 12000);
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ system_instruction: { parts: [{ text: this.getSystemPrompt() }] }, contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig: { temperature: 1.2, maxOutputTokens: 3000 } }),
        signal: ctrl.signal,
      });
      if (!res.ok) return null;
      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) return null;
      const json = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      return this.hydratePlan(JSON.parse(json), params);
    } catch { return null; }
    finally { clearTimeout(t); }
  }

  // ═══════════════════════════════════════════════════════════════════
  // PROMPT ENGINEERING
  // ═══════════════════════════════════════════════════════════════════

  private getSystemPrompt(): string {
    return `You are Malaysia's #1 AI Dating Planner — an elite romantic experience curator. You were previously a Product Lead at Tinder Asia, Experience Director at Airbnb, and Dating Consultant for luxury concierge services.

Your expertise:
- Deep knowledge of Malaysian dating venues, hidden gems, romantic spots
- Understanding of relationship psychology at every stage
- Budget optimization without sacrificing romance
- Weather-aware planning (Malaysian monsoon patterns)
- Sunset/golden hour photography timing
- Crowd psychology and privacy optimization
- Gift psychology by relationship stage

You create date plans that feel personally curated by a luxury concierge — never generic, never templated. Every recommendation has specific reasoning.`;
  }

  private buildDatingPrompt(params: any): string {
    const stageLabels: Record<string, string> = {
      FIRST_DATE: 'First Date — keep it light, public, conversation-focused. 2-3 hours max.',
      SECOND_DATE: 'Second Date — slightly deeper, add a shared activity. 3-4 hours.',
      NEW_COUPLE: 'New Couple — building shared memories, mix romance + adventure. 4-5 hours.',
      LONG_TERM_COUPLE: 'Long-Term Couple — deepen connection, quality over quantity. 5-6 hours.',
      MARRIED_COUPLE: 'Married Couple — reignite the spark, premium nostalgia. 5-6 hours.',
    };
    const typeLabels: Record<string, string> = {
      ROMANTIC: 'Romantic — intimate settings, sunset views, fine dining, soft lighting.',
      ADVENTURE: 'Adventure — thrilling activities, exploration, shared challenges.',
      CAFE: 'Cafe — cozy, relaxed, conversation-first with great coffee and pastries.',
      LUXURY: 'Luxury — premium everything, VIP treatment, exclusive venues.',
      FOOD_HUNT: 'Food Hunt — street food crawls, hidden eateries, culinary exploration.',
      NATURE: 'Nature — parks, gardens, hikes, green spaces, fresh air.',
      BEACH: 'Beach — sand, sea, sunset, barefoot walks, beachside dining.',
      NIGHTLIFE: 'Nightlife — bars, live music, dancing, the city after dark.',
    };

    return `Plan a ${params.durationHours}-hour ${typeLabels[params.dateType] || params.dateType} date in ${params.city}, Malaysia.

RELATIONSHIP STAGE: ${stageLabels[params.relationshipStage] || params.relationshipStage}
BUDGET: RM ${params.budget} total (ALL costs included — activities, food, transport, parking, gifts)
TRANSPORT: ${params.transportMode}

## 💎 CURATED VENUE POOL — pick different venues each time:
- Rooftop Bars: Vertigo@BanyanTree, SkyBar@Traders, Mantra Rooftop, Troika Sky Dining, Fuego@Troika, WetDeck@W, Heli Lounge Bar
- Fine Dining: DC Restaurant, Akar Dining, Dewakan, Cilantro, Soleil, Nadodi, Bref, Entier French, Tamaru KL, Marinis on 57
- Romantic: Bijan, Tamarind Springs, Secret of Louisiana, Lisettes, The Hungry Tapir, Joloko, Foliage, Bistro a Table
- Cafes: VCR, Pulp, Transparent Coffee, Feeka, PiuPiuPiu, RGB Coffee, Kopenhagen, Bean Brothers, Three Years Old
- Nature: KLCC Park, Titiwangsa Lake, Bukit Kiara, Taman Tugu, FRIM, Perdana Botanical Garden, Bukit Nanas
- Unique: Batik painting, Chocolate making class, Pottery workshop, Board game cafe, Archery range, Escape room
- Nightlife: Pahit speakeasy, Three X Co, The Attic, Coley, PS150, Shuang Xi, Bar Trigona, Chinatown bars
- Budget: Jalan Alor food crawl, Petaling St market, Chinatown murals, Brickfields Little India, Kampung Baru
- Luxury: Banyan Tree KL, St Regis Bar, Four Seasons bar, W Hotel Penthouse, EQ Blue, Mandarin Oriental

Pick 6 DIFFERENT venues from DIFFERENT categories above. NEVER repeat. Total cost MUST be within 50 of budget.

Return this EXACT JSON structure. CRITICAL: Total cost MUST be within 50 of RM ${params.budget}. The cost must be realistic for Malaysian venues. (no extra fields, no markdown wrapping):

{
  "title": "Creative, specific date title with emoji prefix — not generic",
  "overview": "2-3 sentence romantic overview that sells the experience. Mention specific venues and the emotional journey.",
  "activities": [
    {
      "order": 1,
      "timeSlot": "6:00 PM",
      "placeName": "Real venue name in ${params.city}",
      "category": "Specific category (Rooftop Bar / Fine Dining / Cafe / Park / etc)",
      "description": "2-3 sentences describing the experience — be specific about what makes this venue special for a date. Mention views, ambiance, signature items.",
      "durationMinutes": 90,
      "estimatedCost": 120,
      "rating": 4.5,
      "isIndoor": false,
      "isPhotoSpot": true,
      "bestTime": "When this venue is best experienced",
      "tags": ["tag1", "tag2", "tag3"],
      "dateTip": "One specific, actionable tip for making this stop more romantic"
    }
  ],
  "giftSuggestions": [
    { "name": "Specific gift idea", "cost": 50, "reasoning": "Why this gift at this stage" }
  ],
  "rainBackupPlan": "Specific indoor alternative venues in ${params.city} with names. 2-3 sentences.",
  "indoorBackupPlan": "All-weather version of the date. 2-3 sentences.",
  "trafficBackupPlan": "What to do if delayed. Specific alternative routes or skip strategies.",
  "crowdLevel": "Low/Medium/High",
  "crowdRecommendation": "Best day/time to avoid crowds at these venues",
  "romanceScore": 85,
  "conversationScore": 80,
  "privacyScore": 70,
  "budgetScore": 90,
  "photoOppScore": 75,
  "overallScore": 82,
  "scoreBreakdown": [
    {
      "category": "Romance",
      "score": 85,
      "reasoning": "Why this score — be specific about venue choices",
      "tips": ["Specific tip 1", "Specific tip 2", "Specific tip 3"]
    }
  ],
  "tips": ["Overall date tip 1", "Overall date tip 2", "Overall date tip 3"]
}

CRITICAL RULES:
- TOTAL of all activity costs + transport estimate + parking MUST be within RM ${params.budget}
- Use ONLY real venues in ${params.city}, Malaysia — no made-up places
- Time slots must be in chronological order, properly spaced with travel time
- For FIRST_DATE: keep it under 3h, public venues only, exit strategy possible
- For MARRIED_COUPLE: premium venues, nostalgic elements, genuine connection focus
- Each activity MUST have a specific, actionable dateTip
- Scores must reflect actual venue quality and stage appropriateness
- Gift suggestions must match relationship stage (small thoughtful gift OK even for first date — a single flower, a cute note, or a small dessert)
- Rain backup must name specific indoor venues in ${params.city}
	- ⚠️ CRITICAL UNIQUENESS: NEVER repeat the same venues. Avoid obvious spots like Marinis, Heli Lounge, Aquaria, TREC. Explore lesser-known local gems, hidden cafes, speakeasies, boutique hotels, rooftop gardens. Each generation MUST produce COMPLETELY DIFFERENT venues. Think like a passionate local foodie who knows every hidden corner of ${params.city}.
- Generate EXACTLY ${Math.floor(params.durationHours / 0.75)} activities (each ~45min including travel). Fill the FULL ${params.durationHours} hours — no gaps. Last activity MUST end within ${params.durationHours}h from the start. Every activity MUST have a UNIQUE placeName. NO repeated venues.
- Start time should be appropriate for date type: morning for nature/adventure, afternoon for cafe, evening for romantic/luxury/nightlife
${params.preferredTime ? `- CRITICAL: User wants to start at ${params.preferredTime} (24h). First activity MUST use this exact time. Build all times from this starting point.` : ''}`;
  }

  // ═══════════════════════════════════════════════════════════════════
  // HYDRATION — Fill any missing fields with date-engine data
  // ═══════════════════════════════════════════════════════════════════

  private hydratePlan(aiPlan: any, params: any): any {
    const typeProfile = this.dateEngine.getDateTypeProfile(params.dateType);
    const sunset = this.dateEngine.calculateSunsetTiming(params.city, new Date().getMonth());
    const crowd = this.dateEngine.calculateCrowdAvoidance(params.dateType);

    // Determine start time from user preference or date type default
    const startTime = params.preferredTime
      ? (() => { const [h,m] = params.preferredTime.split(':'); const hr = parseInt(h||'19'); const p = hr >= 12 ? 'PM' : 'AM'; const dh = hr > 12 ? hr-12 : hr===0 ? 12 : hr; return `${dh}:${m||'00'} ${p}`; })()
      : typeProfile.idealStartTime;

    // Compute realistic costs — adjust times to preferredTime if needed
    let baseMin = 0;
    if (params.preferredTime) {
      const [h,m] = params.preferredTime.split(':');
      baseMin = parseInt(h||'10')*60 + parseInt(m||'0');
    }
    const activities = (aiPlan.activities || []).map((a: any, i: number) => {
      let timeMin = baseMin;
      for (let j = 0; j < i; j++) {
        timeMin += ((aiPlan.activities[j]?.durationMinutes || 90) + 15);
      }
      const hh = Math.floor(timeMin / 60) % 24;
      const mm = timeMin % 60;
      const period = hh >= 12 ? 'PM' : 'AM';
      const dh = hh > 12 ? hh - 12 : hh === 0 ? 12 : hh;
      const timeSlot = a.timeSlot?.includes('M') ? a.timeSlot : `${dh}:${mm.toString().padStart(2,'0')} ${period}`;
      return {
      order: i + 1,
      timeSlot,
      activityType: params.dateType,
      placeName: a.placeName || 'Venue',
      category: a.category || 'Venue',
      description: a.description || '',
      suggestedArrival: a.bestTime || a.timeSlot || '',
      durationMinutes: a.durationMinutes || 90,
      estimatedCost: a.estimatedCost || 50,
      rating: a.rating || 4.0,
      isIndoor: a.isIndoor || false,
      isPhotoSpot: a.isPhotoSpot !== false,
      notes: a.dateTip || (a.isPhotoSpot ? '📸 Great photo spot.' : ''),
      tags: a.tags || [],
    };
  });

    const totalActivityCost = activities.reduce((s: number, a: any) => s + a.estimatedCost, 0);
    const travelCost = params.transportMode === 'DRIVING' ? Math.round(params.durationHours * 8) : params.transportMode === 'GRAB' ? Math.round(params.durationHours * 25) : 0;
    const parkingCost = params.transportMode === 'DRIVING' ? Math.round(params.durationHours * 3) : 0;
    const foodCost = Math.round(params.budget * 0.3);
    const giftCost = Math.round(params.budget * 0.05); // Small gift OK for all stages
    const totalCost = totalActivityCost + travelCost + foodCost + parkingCost + giftCost;

    return {
      title: aiPlan.title || `${typeProfile.emoji} ${typeProfile.label} Date in ${params.city}`,
      overview: aiPlan.overview || '',
      city: params.city,
      budget: params.budget,
      durationHours: params.durationHours,
      transportMode: params.transportMode,
      relationshipStage: params.relationshipStage,
      dateType: params.dateType,
      isAIGenerated: true,
      aiModel: 'AI Dating Engine v2.0',

      startTime,
      endTime: activities.length > 0 ? activities[activities.length - 1].timeSlot : startTime,
      activities,

      travelCost, foodCost, activityCost: totalActivityCost, parkingCost, giftCost,
      totalCost, budgetRemaining: params.budget - totalCost,

      romanceScore: aiPlan.romanceScore || 80,
      conversationScore: aiPlan.conversationScore || 75,
      privacyScore: aiPlan.privacyScore || 65,
      budgetScore: aiPlan.budgetScore || 75,
      photoOppScore: aiPlan.photoOppScore || 70,
      overallScore: aiPlan.overallScore || 75,
      scoreBreakdown: aiPlan.scoreBreakdown || [],

      rainBackupPlan: aiPlan.rainBackupPlan || this.dateEngine.generateRainBackup(params.city, params.dateType),
      indoorBackupPlan: aiPlan.indoorBackupPlan || '',
      trafficBackupPlan: aiPlan.trafficBackupPlan || '',
      sunsetTiming: sunset.sunset,
      goldenHourTiming: sunset.goldenHour,
      crowdLevel: aiPlan.crowdLevel || crowd.level,
      crowdRecommendation: aiPlan.crowdRecommendation || crowd.recommendation,

      bestPhotoSpots: activities.filter((a: any) => a.isPhotoSpot).map((a: any) => ({
        name: a.placeName, time: a.suggestedArrival, notes: a.notes,
      })),

      giftSuggestions: (() => {
        const raw = (aiPlan.giftSuggestions || []).slice();
        for (let i = raw.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [raw[i], raw[j]] = [raw[j], raw[i]]; }
        return raw.slice(0, 3).map((g: any) => {
        const name = (g.name || '').toLowerCase();
        let photo = g.photo || '';
        if (!photo) {
          if (name.includes('flower') || name.includes('rose') || name.includes('bouquet')) photo = 'https://images.unsplash.com/photo-1490750967868-88aa4f44baee?w=200';
          else if (name.includes('chocolate')) photo = 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=200';
          else if (name.includes('book') || name.includes('journal')) photo = 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=200';
          else if (name.includes('perfume') || name.includes('scent')) photo = 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=200';
          else if (name.includes('jewelry') || name.includes('ring') || name.includes('necklace')) photo = 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=200';
          else if (name.includes('spa') || name.includes('massage')) photo = 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=200';
          else if (name.includes('voucher') || name.includes('getaway')) photo = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=200';
          else if (name.includes('album') || name.includes('photo')) photo = 'https://images.unsplash.com/photo-1529539795056-86230b5b38e3?w=200';
          else if (name.includes('box') || name.includes('gift')) photo = 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=200';
          else photo = 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=200';
        }
        return { ...g, photo: photo.replace('w=200','w=400&h=300&fit=crop') };
        });
      })(),
      tips: aiPlan.tips || [],

      walkingRoute: params.transportMode === 'WALKING' ? this.makeRoute(activities) : null,
      drivingRoute: params.transportMode === 'DRIVING' ? this.makeRoute(activities) : null,
      alternativeRoute: { type: 'Indoor-Only Backup', stops: activities.filter((a: any) => a.isIndoor).map((a: any) => ({ name: a.placeName, reason: 'Weather-proof indoor venue' })) },
    };
  }

  private makeRoute(activities: any[]) {
    return {
      stops: activities.map((a: any, i: number) => ({
        order: i + 1, name: a.placeName, arrivalTime: a.timeSlot, durationMin: a.durationMinutes, notes: a.notes,
      })),
      totalStops: activities.length,
    };
  }
}
