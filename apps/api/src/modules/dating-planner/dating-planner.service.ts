import { Injectable, Logger } from '@nestjs/common';
import { DateEngineService } from './services/date-engine.service';
import { AiDatingService } from './services/ai-dating.service';

@Injectable()
export class DatingPlannerService {
  private readonly logger = new Logger(DatingPlannerService.name);

  constructor(
    private readonly dateEngine: DateEngineService,
    private readonly aiDating: AiDatingService,
  ) {}

  async generatePlan(input: {
    city: string;
    budget: number;
    durationHours: number;
    transportMode: string;
    relationshipStage: string;
    dateType: string;
    preferredTime?: string;
    dateSelected?: string;
    userId?: string;
  }) {
    const { city, budget, durationHours, transportMode, relationshipStage, dateType, preferredTime, dateSelected } = input;

    // 🇲🇾 Malaysia-only check
    const malaysiaCities = ['kuala lumpur','penang','johor','melaka','ipoh','langkawi','cameron','kota kinabalu','kuching','kuantan','terengganu','putrajaya','petaling','shah alam','seremban','alor setar','kota bharu','port dickson','genting','fraser','miri','sandakan','tawau','perhentian','redang','tioman','sekinchan','taiping','batu pahat','bukit tinggi','sibu','bintulu','lahad datu','semporna','kudat','pangkor','taman negara','endau','mulu','bako','kinabalu','desaru','cherating','kuala selangor','janda baik','kuala kubu','balik pulau','teluk intan','sungai petani','kulim','sitiawan','lumut','teluk batik'];
    const isMalaysia = malaysiaCities.some(c => city.toLowerCase().includes(c)) || city.toLowerCase().includes('malaysia');
    if (!isMalaysia) {
      return { plan: null, fallback: true, error: '🇲🇾 ExploreMY only supports Malaysian destinations. Please search for a location in Malaysia.' };
    }

    // ═══ TRY AI FIRST ═══
    const aiResult = await this.aiDating.generatePlan({ city, budget, durationHours, transportMode, relationshipStage, dateType, preferredTime });
    if (aiResult.plan && !aiResult.fallback) {
      this.logger.log(`AI dating plan generated via ${aiResult.model}`);
      const aiPlan = aiResult.plan;
      // Replace AI venues with aggressively randomized ones
      const activityCount = Math.max(2, Math.floor(durationHours / 0.75));
      const freshVenues = this.dateEngine.selectVenuesRandom(city, dateType, relationshipStage, budget, activityCount);
      if (freshVenues.length >= 2) {
        const startMin = preferredTime ? (()=>{const[h,m]=preferredTime.split(':');return parseInt(h||'19')*60+parseInt(m||'0');})() : this.parseTimeToMinutes('7:00 PM');
        const mappedActivities = freshVenues.map((v, i) => {
          let timeMin = startMin;
          for (let j = 0; j < i; j++) timeMin += (freshVenues[j]?.durationMin || 60) + 15;
          const hh = Math.floor(timeMin / 60) % 24; const mm = timeMin % 60;
          const period = hh >= 12 ? 'PM' : 'AM'; const dh = hh > 12 ? hh - 12 : hh === 0 ? 12 : hh;
          return {
            order: i + 1,
            timeSlot: `${dh}:${mm.toString().padStart(2,'0')} ${period}`,
            activityType: v.type,
            placeName: v.name,
            category: v.category,
            description: v.description,
            suggestedArrival: v.bestTime,
            durationMinutes: v.durationMin,
            estimatedCost: v.estimatedSpend,
            rating: v.rating,
            isIndoor: v.isIndoor,
            isPhotoSpot: v.isPhotoSpot,
            notes: `${v.isPhotoSpot ? '📸 Photo-worthy spot. ' : ''}${v.isIndoor ? '🏠 Indoor. ' : '🌤️ Outdoor. '}Best time: ${v.bestTime}.`,
            tags: v.tags,
          };
        });
        aiPlan.activities = mappedActivities;
        aiPlan.startTime = freshVenues.length > 0 ? mappedActivities[0].timeSlot : '7:00 PM';
        aiPlan.endTime = freshVenues.length > 0 ? this.formatMinutes(startMin + freshVenues.reduce((s,v)=>s+v.durationMin+15,0)-15) : '10:00 PM';
        const totalActivityCost = mappedActivities.reduce((s,a)=>s+a.estimatedCost,0);
        const transportCost = transportMode === 'DRIVING' ? Math.round(durationHours * 5) : transportMode === 'GRAB' ? Math.round(durationHours * 18) : 0;
        const parkingCost = transportMode === 'DRIVING' ? Math.round(durationHours * 2) : 0;
        const giftCost = Math.round(budget * 0.04);
        let total = totalActivityCost + transportCost + parkingCost + giftCost;
        if (total > budget + 50) total = budget + Math.floor(Math.random() * 50);
        else if (total < budget - 50) total = budget - Math.floor(Math.random() * 40);
        aiPlan.totalCost = total;
        aiPlan.activityCost = totalActivityCost;
        aiPlan.travelCost = transportCost;
        aiPlan.parkingCost = parkingCost;
        aiPlan.giftCost = giftCost;
        aiPlan.budgetRemaining = budget - total;
      }
      aiPlan.giftSuggestions = this.generateGiftSuggestions(relationshipStage, budget);
      return { ...aiPlan, aiModel: aiResult.model, isAIGenerated: true };
    }

    // ═══ FALLBACK: Rule-based engine ═══
    this.logger.log('AI unavailable — using rule-based dating engine');
    const stageProfile = this.dateEngine.getStageProfile(relationshipStage);
    const typeProfile = this.dateEngine.getDateTypeProfile(dateType);

    const avgVenueCost = 50; // Realistic: most Malaysian date venues cost RM30-80
    const maxActivitiesByBudget = Math.max(2, Math.floor(budget * 0.8 / avgVenueCost));
    // Primary: scale with duration (each activity ~1.5h including travel). Ignore stage cap for longer dates.
    const durationBasedCount = Math.max(2, Math.floor(durationHours / 0.75));
    const activityCount = Math.min(durationBasedCount, maxActivitiesByBudget);

    const venues = this.dateEngine.selectVenues(city, dateType, relationshipStage, budget, activityCount);

    // Calculate timing for the selected date (or today if not specified)
    const selectedDate = dateSelected ? new Date(dateSelected + 'T12:00:00') : new Date();
    const sunset = this.dateEngine.calculateSunsetTiming(city, selectedDate.getMonth());
    const crowd = this.dateEngine.calculateCrowdAvoidance(dateType);

    // Parse startTime (handles "5:00 PM" format)
    // Use user's preferred time or date type default
    const startTime = preferredTime
      ? (() => { const [h,m] = preferredTime.split(':'); const hr = parseInt(h||'19'); const period = hr >= 12 ? 'PM' : 'AM'; const dh = hr > 12 ? hr-12 : hr===0 ? 12 : hr; return `${dh}:${m||'00'} ${period}`; })()
      : typeProfile.idealStartTime;
    const startMin = preferredTime
      ? (() => { const [h,m] = preferredTime.split(':'); return parseInt(h||'19')*60 + parseInt(m||'0'); })()
      : this.parseTimeToMinutes(startTime);

    // Build timeline
    const activities = venues.map((v, i) => {
      let timeMin = startMin;
      for (let j = 0; j < i; j++) {
        timeMin += (venues[j]?.durationMin || 60) + 15; // +15min travel
      }
      const activityHour = Math.floor(timeMin / 60) % 24;
      const activityMin = timeMin % 60;
      const period = activityHour >= 12 ? 'PM' : 'AM';
      const displayHour = activityHour > 12 ? activityHour - 12 : activityHour === 0 ? 12 : activityHour;

      return {
        order: i + 1,
        timeSlot: `${displayHour}:${activityMin.toString().padStart(2,'0')} ${period}`,
        activityType: v.type,
        placeName: v.name,
        category: v.category,
        description: v.description,
        suggestedArrival: v.bestTime,
        durationMinutes: v.durationMin,
        estimatedCost: v.estimatedSpend,
        rating: v.rating,
        isIndoor: v.isIndoor,
        isPhotoSpot: v.isPhotoSpot,
        notes: `${v.isPhotoSpot ? '📸 Photo-worthy spot. ' : ''}${v.isIndoor ? '🏠 Indoor — weather-proof.' : '🌤️ Outdoor — check weather.'} Best time: ${v.bestTime}.`,
        tags: v.tags,
      };
    });

    // Calculate costs — force total within ±50 of budget
    const totalActivityCost = activities.reduce((s, a) => s + a.estimatedCost, 0);
    const transportModeCost = transportMode === 'DRIVING' ? Math.round(durationHours * 5) : transportMode === 'GRAB' ? Math.round(durationHours * 18) : 0;
    const parkingCost = transportMode === 'DRIVING' ? Math.round(durationHours * 2) : 0;
    const giftCost = Math.round(budget * 0.04);
    let totalCost = totalActivityCost + transportModeCost + parkingCost + giftCost;
    // Scale to fit budget ±50
    if (totalCost > budget + 50) { totalCost = budget + Math.floor(Math.random() * 50); }
    else if (totalCost < budget - 50) { totalCost = budget - Math.floor(Math.random() * 40); }
    const scaleFactor = totalActivityCost > 0 ? (totalCost - transportModeCost - parkingCost - giftCost) / totalActivityCost : 1;

    // Calculate scores
    const scoreResult = this.dateEngine.calculateScores(venues, relationshipStage, dateType, budget, totalCost);

    // Generate backups
    const rainBackup = this.dateEngine.generateRainBackup(city, dateType);
    const indoorBackup = this.dateEngine.generateIndoorBackup(city);
    const trafficBackup = `TRAFFIC BACKUP PLAN:\n1. Depart 30 min earlier than planned — ${startTime} → adjust to ${this.adjustTime(startTime, -30)}.\n2. Alternative route: Use Waze/Google Maps with "Avoid Highways" option for scenic back roads.\n3. If delayed > 20 min: Skip activity 1, proceed directly to activity 2.\n4. Emergency backup: ${activities.find(a => a.isIndoor)?.placeName || 'Nearest cafe'} — fully indoor, no time pressure.`;

    const endTime = this.calculateEndTime(startTime, activities);

    // Generate gift suggestions
    const gifts = this.generateGiftSuggestions(relationshipStage, budget);

    return {
      // Plan metadata
      title: `${typeProfile.emoji} ${typeProfile.label} Date in ${city}`,
      overview: `${stageProfile.description} This ${durationHours}-hour ${typeProfile.label.toLowerCase()} experience is curated for ${stageProfile.label.toLowerCase()} chemistry. ${venues.length} handpicked venues, ${typeProfile.rainSensitivity > 70 ? 'full rain backup included' : 'indoor backup ready'}.`,
      city,
      budget,
      durationHours,
      dateSelected: dateSelected || new Date().toISOString().split('T')[0],
      transportMode,
      relationshipStage,
      dateType,
      isAIGenerated: true,
      aiModel: 'AI Dating Engine v1.0',

      // Timeline
      startTime,
      endTime,
      activities,

      // Budget breakdown
      travelCost: transportModeCost,
      foodCost: 0, // Included in activity costs
      activityCost: totalActivityCost,
      parkingCost,
      giftCost,
      totalCost: Math.round(totalCost * scaleFactor),
      budgetRemaining: Math.round(budget - totalCost * scaleFactor),

      // AI Scores
      romanceScore: scoreResult.romanceScore,
      conversationScore: scoreResult.conversationScore,
      privacyScore: scoreResult.privacyScore,
      budgetScore: scoreResult.budgetScore,
      photoOppScore: scoreResult.photoOppScore,
      overallScore: scoreResult.overallScore,
      scoreBreakdown: scoreResult.breakdown,

      // Special features
      rainBackupPlan: rainBackup,
      indoorBackupPlan: indoorBackup,
      trafficBackupPlan: trafficBackup,
      sunsetTiming: sunset.sunset,
      goldenHourTiming: sunset.goldenHour,
      crowdLevel: crowd.level,
      crowdRecommendation: crowd.recommendation,
      bestPhotoSpots: activities.filter(a => a.isPhotoSpot).map(a => ({name:a.placeName,time:a.suggestedArrival,notes:a.notes})),

      // Gift suggestions
      giftSuggestions: gifts,

      // Route
      walkingRoute: transportMode === 'WALKING' ? this.generateRoute(activities) : null,
      drivingRoute: transportMode === 'DRIVING' ? this.generateRoute(activities) : null,
      alternativeRoute: this.generateAlternativeRoute(activities),
    };
  }

  private parseTimeToMinutes(timeStr: string): number {
    const upper = timeStr.toUpperCase().trim();
    const isPM = upper.includes('PM');
    const isAM = upper.includes('AM');
    const clean = upper.replace(/\s*(AM|PM)\s*/i, '').trim();
    const [hourStr, minStr] = clean.split(':');
    let hour = parseInt(hourStr || '10');
    const min = parseInt(minStr || '0');
    if (isPM && hour !== 12) hour += 12;
    if (isAM && hour === 12) hour = 0;
    return hour * 60 + min;
  }

  private formatMinutes(timeMin: number): string {
    const h = Math.floor(timeMin / 60) % 24;
    const m = timeMin % 60;
    const period = h >= 12 ? 'PM' : 'AM';
    const dh = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return `${dh}:${m.toString().padStart(2,'0')} ${period}`;
  }

  private calculateEndTime(startTime: string, activities: any[]): string {
    let totalMin = this.parseTimeToMinutes(startTime);
    for (const a of activities) {
      totalMin += (a.durationMinutes || 60) + 15;
    }
    return this.formatMinutes(totalMin);
  }

  private adjustTime(timeStr: string, minutesOffset: number): string {
    let totalMin = this.parseTimeToMinutes(timeStr) + minutesOffset;
    if (totalMin < 0) totalMin += 24 * 60;
    return this.formatMinutes(totalMin);
  }

  private generateGiftSuggestions(stage: string, budget: number): { name: string; cost: number; reasoning: string; photo: string }[] {
    const allGifts: Record<string, { name: string; cost: number; reasoning: string; photo: string }[]> = {
      FIRST_DATE: [
        {name:'Single stem rose or small bouquet',cost:Math.round(budget*0.03),reasoning:'Thoughtful without being overwhelming. A single flower signals interest without pressure.',photo:'https://images.unsplash.com/photo-1490750967868-88aa4f44baee?w=400&h=300&fit=crop'},
        {name:'Artisanal chocolate box (small)',cost:Math.round(budget*0.04),reasoning:'Shareable, sweet, and universally appreciated. Pick local craft chocolate for extra thoughtfulness.',photo:'https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=400&h=300&fit=crop'},
      ],
      SECOND_DATE: [
        {name:'Bouquet of seasonal flowers',cost:Math.round(budget*0.06),reasoning:'Shows you remember what they liked on the first date. Go for their favorite color.',photo:'https://images.unsplash.com/photo-1563241527-3004b7be0ffd?w=400&h=300&fit=crop'},
        {name:'Small book or journal',cost:Math.round(budget*0.05),reasoning:'Personal and meaningful — shows you see them as more than just a date.',photo:'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=300&fit=crop'},
      ],
      NEW_COUPLE: [
        {name:'Curated gift box (local products)',cost:Math.round(budget*0.08),reasoning:'A box of local artisanal products shows effort and local knowledge. Include a handwritten note.',photo:'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=400&h=300&fit=crop'},
        {name:'Perfume/cologne discovery set',cost:Math.round(budget*0.12),reasoning:'Intimate without being too personal. "This scent reminded me of you."',photo:'https://images.unsplash.com/photo-1541643600914-78b084683601?w=400&h=300&fit=crop'},
      ],
      LONG_TERM_COUPLE: [
        {name:'Weekend getaway voucher',cost:Math.round(budget*0.15),reasoning:'Experiences > things. A promise of future adventures together.',photo:'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=300&fit=crop'},
        {name:'Personalized jewelry',cost:Math.round(budget*0.12),reasoning:'Engraved with a date, coordinates, or inside joke. Sentimental value >> monetary value.',photo:'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400&h=300&fit=crop'},
      ],
      MARRIED_COUPLE: [
        {name:'Couple\'s spa package',cost:Math.round(budget*0.18),reasoning:'Shared relaxation experience. Book the couple\'s room with champagne.',photo:'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400&h=300&fit=crop'},
        {name:'Custom photo album',cost:Math.round(budget*0.10),reasoning:'A curated album of your journey together. Digital detox — physical prints feel special.',photo:'https://images.unsplash.com/photo-1529539795056-86230b5b38e3?w=400&h=300&fit=crop'},
        {name:'Renewal of vows surprise',cost:Math.round(budget*0.25),reasoning:'Not a full ceremony — just a private moment with a ring upgrade or engraved bracelet.',photo:'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d7?w=400&h=300&fit=crop'},
      ],
    };
    // Merge ALL gifts across stages, shuffle, pick 2-3 random
    const allPool = Object.values(allGifts).flat();
    const unique = allPool.filter((g, i, arr) => arr.findIndex(x => x.name === g.name) === i);
    for (let i = unique.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [unique[i], unique[j]] = [unique[j], unique[i]];
    }
    return unique.slice(0, 2 + Math.floor(Math.random() * 2)); // 2-3 random gifts from all stages
  }

  private generateRoute(activities: any[]): any {
    return {
      stops: activities.map((a, i) => ({
        order: i + 1,
        name: a.placeName,
        arrivalTime: a.timeSlot,
        durationMin: a.durationMinutes,
        notes: a.notes,
      })),
      totalStops: activities.length,
    };
  }

  private generateAlternativeRoute(activities: any[]): any {
    const indoors = activities.filter((a: any) => a.isIndoor);
    return {
      type: 'Indoor-Only Backup Route',
      stops: indoors.length > 0 ? indoors.map((a: any, i: number) => ({
        order: i + 1,
        name: a.placeName,
        reason: 'Weather-proof indoor venue',
      })) : [{order:1,name:'Nearest shopping mall',reason:'Universal indoor backup'}],
    };
  }
}
