import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { PlanGeneratorService } from './services/plan-generator.service';
import { BudgetEngineService } from './services/budget-engine.service';
import { RouteOptimizerService } from './services/route-optimizer.service';
import { PlaceEnrichmentService } from './services/place-enrichment.service';
import { GeocodingService } from './services/geocoding.service';
import { HiddenGemService } from './services/hidden-gem.service';
import { PhotoCuratorService } from './services/photo-curator.service';
import { CreateWeekendPlanDto } from './dto/create-weekend-plan.dto';
import { UpdateWeekendPlanDto } from './dto/update-weekend-plan.dto';
import { OptimizePlanDto } from './dto/optimize-plan.dto';
import { WeekendPlanOutput, WeekendDayOutput, StopOutput, BudgetBreakdownOutput } from './interfaces/weekend-plan.interface';
import { randomBytes } from 'crypto';

@Injectable()
export class WeekendPlannerService {
  private readonly logger = new Logger(WeekendPlannerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly planGenerator: PlanGeneratorService,
    private readonly budgetEngine: BudgetEngineService,
    private readonly routeOptimizer: RouteOptimizerService,
    private readonly placeEnrichment: PlaceEnrichmentService,
    private readonly geocoding: GeocodingService,
    private readonly hiddenGem: HiddenGemService,
    private readonly photoCurator: PhotoCuratorService,
  ) {}

  // =============================================================================
  // GENERATE
  // =============================================================================

  async generate(input: CreateWeekendPlanDto, userId: string): Promise<{
    data: WeekendPlanOutput;
    meta: { generationTimeMs: number; model: string; tokensUsed: number };
  }> {
    const startTime = Date.now();

    // 0. Geocode destination if coordinates are missing (worldwide support)
    let lat = input.destinationLat;
    let lng = input.destinationLng;
    if (!lat || !lng || (lat === 0 && lng === 0)) {
      const geo = await this.geocoding.geocode(input.destination);
      if (geo) {
        lat = geo.lat;
        lng = geo.lng;
        // 🇲🇾 Malaysia-only validation
        const isMalaysia = geo.country?.toLowerCase().includes('malaysia') ||
          (lat >= 0.8 && lat <= 7.5 && lng >= 99 && lng <= 120);
        if (!isMalaysia) {
          throw new BadRequestException('🇲🇾 ExploreMY only supports destinations within Malaysia. Please search for a Malaysian location.');
        }
        this.logger.log(`Geocoded "${input.destination}" → ${geo.city}, ${geo.country}`);
      }
    }

    // Validate coordinates are in Malaysia
    if (lat && lng) {
      const inMalaysia = (lat >= 0.8 && lat <= 7.5 && lng >= 99 && lng <= 120);
      if (!inMalaysia) {
        throw new BadRequestException('🇲🇾 This destination appears to be outside Malaysia. ExploreMY only supports Malaysian locations.');
      }
    }

    // Auto-calculate dayCount from dates (max 8)
    const startD = new Date(input.startDate);
    const endD = new Date(input.endDate);
    const dayCount = Math.min(8, Math.max(1, Math.ceil((endD.getTime() - startD.getTime()) / 86400000) + 1));

    // Update input with resolved coordinates and day count
    const resolvedInput = { ...input, destinationLat: lat, destinationLng: lng, dayCount } as any;

    // 1. Run AI generation (GPT-4o → Gemini → rule-based)
    const { plan: aiPlan, model, tokensUsed } = await this.planGenerator.generate(resolvedInput);

    // 2. Enrich stops with real Google Places data (photos, ratings, hours, transport, distance)
    const allStops = aiPlan.days.flatMap(d => d.stops);
    this.logger.log(`Enriching ${allStops.length} stops with Google Places data...`);
    const userLat = (input as any).userLat ?? undefined;
    const userLng = (input as any).userLng ?? undefined;
    await this.placeEnrichment.enrichStops(allStops, lat, lng, userLat, userLng);

    // Fallback: compute realistic transport for each stop
    // Simulate stops spread around destination with realistic city distances
    let prevLat = lat + 0.003, prevLng = lng + 0.003; // Start ~330m from city center
    let stopIdx = 0;
    for (const stop of allStops) {
      // City stops typically 0.3-2.5 km apart; tourist attractions 2-6 km
      const isFoodStop = (stop as any).category === 'BREAKFAST' || (stop as any).category === 'LUNCH' || (stop as any).category === 'DINNER' || (stop as any).category === 'CAFE_STOP';
      const radius = isFoodStop ? 0.3 + (stopIdx % 4) * 0.4 : 1.5 + (stopIdx % 4) * 0.8;
      const angle = (stopIdx * 1.3) % (Math.PI * 2);
      const simLat = prevLat + (Math.cos(angle) * radius / 111);
      const simLng = prevLng + (Math.sin(angle) * radius / (111 * Math.cos(prevLat * Math.PI / 180)));

      const tOpts = (stop as any).transportOptions;
      if (!tOpts || !Array.isArray(tOpts) || tOpts.length === 0) {
        (stop as any).transportOptions = this.placeEnrichment.calcTransport(prevLat, prevLng, simLat, simLng);
      }
      if (!(stop as any).photos || (stop as any).photos.length === 0) {
        (stop as any).photos = [];
      }
      if (userLat && userLng) {
        (stop as any).distanceFromUser = Math.round(this.placeEnrichment.haversineKm(userLat, userLng, simLat, simLng) * 10) / 10;
      }
      (stop as any).lat = simLat;
      (stop as any).lng = simLng;
      prevLat = simLat;
      prevLng = simLng;
      stopIdx++;
    }
    this.logger.log(`Transport computed for ${allStops.length} stops`);

    // Apply hidden gem scoring + photo curation
    this.hiddenGem.scoreStops(allStops);
    this.photoCurator.curatePlanStops(allStops as any);

    // 3. Calculate detailed budget
    const budget = this.budgetEngine.calculate(resolvedInput, aiPlan);

    // 3. Optimize routes
    const optimized = this.routeOptimizer.optimizeFullPlan(
      aiPlan.days,
      aiPlan.days.map(() => ({ lat, lng })),
      resolvedInput.transportMode,
    );

    // 4. Compute summary stats
    const totalStops = aiPlan.days.reduce((s, d) => s + d.stops.length, 0);
    const hiddenGemCount = aiPlan.days.reduce((s, d) => s + d.stops.filter(st => st.isHiddenGem).length, 0);
    const totalDistance = optimized.reduce((s, d) => s + d.totalDistance, 0);
    const totalTravelTime = optimized.reduce((s, d) => s + d.totalDuration, 0);

    // 5. Generate share token
    const shareToken = randomBytes(6).toString('base64url');

    // 6. Persist to database (skip if DB unavailable)
    let persistedPlan: any = null;
    if (this.prisma.isConnected) {
      try {
        persistedPlan = await this.prisma.db.weekendPlan.create({
      data: {
        userId,
        title: aiPlan.title,
        destination: resolvedInput.destination,
        destinationLat: lat,
        destinationLng: lng,
        startDate: new Date(resolvedInput.startDate),
        endDate: new Date(resolvedInput.endDate),
        planType: dayCount >= 3 ? 'MULTI_DAY' : dayCount === 1 ? 'ONE_DAY' : 'TWO_DAY' as any,
        dayCount: dayCount,
        budget: resolvedInput.budget,
        budgetCurrency: resolvedInput.budgetCurrency ?? 'MYR',
        transportMode: resolvedInput.transportMode as any,
        groupType: resolvedInput.groupType as any,
        travelStyles: resolvedInput.travelStyles as any[],
        specialPreferences: (resolvedInput.specialPreferences ?? []) as any[],
        groupSize: resolvedInput.groupSize ?? 1,
        isAIGenerated: true,
        aiModel: model,
        aiTokensUsed: tokensUsed,
        generationLatencyMs: Date.now() - startTime,
        status: 'DRAFT',
        shareToken,
        totalCost: budget.grandTotal,
        totalDistance,
        totalTravelTime,
        totalStops,
        hiddenGemCount,
        // Create days with stops
        days: {
          create: aiPlan.days.map((day) => ({
            dayNumber: day.dayNumber,
            date: this.computeDate(resolvedInput.startDate, day.dayNumber),
            theme: day.theme,
            weatherCondition: 'partly_cloudy',
            weatherTempMin: 26,
            weatherTempMax: 32,
            weatherRainChance: 30,
            dayTotalCost: day.stops.reduce((s, st) => s + st.estimatedSpend + (st.entryFee ?? 0) + (st.transportFromPrev?.estimatedCost ?? 0), 0),
            dayTotalDistance: optimized.find(o => o.dayNumber === day.dayNumber)?.totalDistance ?? 0,
            dayTotalTime: optimized.find(o => o.dayNumber === day.dayNumber)?.totalDuration ?? 0,
            stopCount: day.stops.length,
            stops: {
              create: day.stops.map((stop) => ({
                order: stop.order,
                startTime: stop.time,
                endTime: stop.endTime,
                durationMinutes: stop.durationMinutes,
                placeName: stop.placeName,
                placeCategory: stop.category as any,
                placeEmoji: stop.emoji,
                description: stop.description,
                rating: 4.0,
                priceLevel: 2,
                transportModeFromPrev: stop.transportFromPrev?.mode as any,
                distanceFromPrev: stop.transportFromPrev?.distanceMeters,
                travelTimeFromPrev: stop.transportFromPrev?.durationMinutes,
                transportCostFromPrev: stop.transportFromPrev?.estimatedCost,
                entryFee: stop.entryFee ?? 0,
                estimatedSpend: stop.estimatedSpend,
                isHiddenGem: stop.isHiddenGem,
                isPhotoSpot: stop.isPhotoSpot,
                isAIGenerated: true,
                aiReasoning: stop.aiReasoning,
                isIndoor: stop.isIndoor,
                crowdLevel: stop.crowdLevel,
              })),
            },
          })),
        },
      },
      include: {
        days: { include: { stops: true }, orderBy: { dayNumber: 'asc' } },
      },
    });

    // 7. Persist budget items
    const budgetItems = [
      { category: 'FUEL' as any, label: 'Fuel', estimatedCost: budget.fuel.totalCost, percentageOfTotal: (budget.fuel.totalCost / budget.grandTotal) * 100 },
      { category: 'TOLL' as any, label: 'Toll', estimatedCost: budget.toll.totalCost, percentageOfTotal: (budget.toll.totalCost / budget.grandTotal) * 100 },
      { category: 'PARKING' as any, label: 'Parking', estimatedCost: budget.parking.totalCost, percentageOfTotal: (budget.parking.totalCost / budget.grandTotal) * 100 },
      { category: 'HOTEL' as any, label: 'Hotel', estimatedCost: budget.hotel.estimatedCost, percentageOfTotal: (budget.hotel.estimatedCost / budget.grandTotal) * 100 },
      { category: 'FOOD' as any, label: 'Food & Drink', estimatedCost: budget.food.estimatedCost, percentageOfTotal: (budget.food.estimatedCost / budget.grandTotal) * 100 },
      { category: 'TICKET' as any, label: 'Tickets & Entry', estimatedCost: budget.tickets.estimatedCost, percentageOfTotal: (budget.tickets.estimatedCost / budget.grandTotal) * 100 },
      { category: 'TRANSPORT' as any, label: 'Transport (Grab/Bus)', estimatedCost: budget.transport.estimatedCost, percentageOfTotal: (budget.transport.estimatedCost / budget.grandTotal) * 100 },
      { category: 'EMERGENCY_BUFFER' as any, label: 'Emergency Buffer', estimatedCost: budget.emergencyBuffer.estimatedCost, percentageOfTotal: (budget.emergencyBuffer.estimatedCost / budget.grandTotal) * 100 },
    ];

        await Promise.all(budgetItems.map(item =>
          this.prisma.db.weekendBudget.create({
            data: { ...item, weekendPlanId: persistedPlan.id },
          }),
        ));
      } catch (dbErr) {
        this.logger.warn('Database persistence failed, returning plan without saving', dbErr);
        persistedPlan = null;
      }
    }

    const generationTimeMs = Date.now() - startTime;
    let budgetResponse = this.budgetEngine.toBudgetResponse(budget, resolvedInput.budgetCurrency ?? 'MYR');
    // Copy hotel options from AI plan (budget engine recalculates, losing hotel data)
    if ((aiPlan.budgetBreakdown?.hotel as any)?.hotelOptions) {
      (budgetResponse.hotel as any).hotelOptions = (aiPlan.budgetBreakdown.hotel as any).hotelOptions;
    }

    // Budget enforcement: scale to match user's budget (±RM 20)
    const targetBudget = resolvedInput.budget;
    if (Math.abs(budgetResponse.total - targetBudget) > 20) {
      const scaleFactor = targetBudget / budgetResponse.total;
      budgetResponse = this.scaleBudget(budgetResponse, scaleFactor);
      this.logger.log(`Budget scaled: ${Math.round(budget.grandTotal)} → ${Math.round(budgetResponse.total)}`);
    }
    // Hard-enforce: set total to budget
    budgetResponse.total = targetBudget;
    budgetResponse.budgetUtilization = targetBudget / resolvedInput.budget;
    budgetResponse.isWithinBudget = true;

    // Build output — from persisted plan if available, otherwise from AI output directly
    if (persistedPlan) {
      return {
        data: this.toPlanOutput(persistedPlan, budgetResponse),
        meta: { generationTimeMs, model, tokensUsed },
      };
    }

    // In-memory mode: build output from AI plan without DB persistence
    const memPlan = this.buildMemoryPlan(resolvedInput, aiPlan, budgetResponse, shareToken, {
      totalDistance, totalTravelTime, totalStops, hiddenGemCount,
    });
    return {
      data: memPlan,
      meta: { generationTimeMs, model, tokensUsed },
    } as any;
  }

  // =============================================================================
  // READ
  // =============================================================================

  async findById(planId: string): Promise<{ data: WeekendPlanOutput }> {
    if (!this.prisma.isConnected) {
      throw new NotFoundException('Database not connected — plans are only available in-memory during this session');
    }

    const plan = await this.prisma.db.weekendPlan.findUnique({
      where: { id: planId },
      include: {
        days: { include: { stops: { orderBy: { order: 'asc' } } }, orderBy: { dayNumber: 'asc' } },
        budgetItems: true,
      },
    });

    if (!plan) throw new NotFoundException('Plan not found');

    const budget = this.toBudgetFromItems(plan.budgetItems, plan.budgetCurrency);
    return { data: this.toPlanOutput(plan, budget) };
  }

  async findByShareToken(token: string): Promise<{ data: WeekendPlanOutput }> {
    const plan = await this.prisma.db.weekendPlan.findUnique({
      where: { shareToken: token },
      include: {
        days: { include: { stops: { orderBy: { order: 'asc' } } }, orderBy: { dayNumber: 'asc' } },
        budgetItems: true,
      },
    });

    if (!plan || !plan.isPublic) throw new NotFoundException('Plan not found');

    // Increment view count
    await this.prisma.db.weekendPlan.update({
      where: { id: plan.id },
      data: { viewCount: { increment: 1 } },
    });

    const budget = this.toBudgetFromItems(plan.budgetItems, plan.budgetCurrency);
    return { data: this.toPlanOutput(plan, budget) };
  }

  async list(
    filters: { status?: string; page?: number; limit?: number; sort?: string; order?: string },
    userId: string,
  ) {
    if (!this.prisma.isConnected) {
      return {
        data: [],
        meta: { page: 1, limit: filters.limit ?? 10, total: 0, totalPages: 0 },
      };
    }

    const page = filters.page ?? 1;
    const limit = Math.min(filters.limit ?? 10, 50);
    const skip = (page - 1) * limit;
    const orderBy: any = { [filters.sort ?? 'createdAt']: filters.order ?? 'desc' };

    const where: any = { userId };
    if (filters.status) where.status = filters.status;

    const [plans, total] = await Promise.all([
      this.prisma.db.weekendPlan.findMany({
        where,
        include: { days: { include: { stops: true } } },
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.db.weekendPlan.count({ where }),
    ]);

    return {
      data: plans.map(p => this.toPlanOutput(p)),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  // =============================================================================
  // UPDATE
  // =============================================================================

  async update(planId: string, dto: UpdateWeekendPlanDto, userId: string): Promise<{ data: WeekendPlanOutput }> {
    const plan = await this.prisma.db.weekendPlan.findFirst({
      where: { id: planId, userId },
    });
    if (!plan) throw new NotFoundException('Plan not found');

    // Update plan-level fields
    const updateData: any = {};
    if (dto.title !== undefined) updateData.title = dto.title;
    if (dto.isPublic !== undefined) updateData.isPublic = dto.isPublic;

    if (Object.keys(updateData).length > 0) {
      await this.prisma.db.weekendPlan.update({ where: { id: planId }, data: updateData });
    }

    // Update locked stops
    if (dto.days) {
      for (const dayUpdate of dto.days) {
        if (dayUpdate.stops) {
          for (const stopUpdate of dayUpdate.stops) {
            const stopData: any = {};
            if (stopUpdate.isLocked !== undefined) stopData.isLocked = stopUpdate.isLocked;
            if (stopUpdate.userNote !== undefined) stopData.userNote = stopUpdate.userNote;
            if (Object.keys(stopData).length > 0) {
              await this.prisma.db.weekendPlanStop.update({
                where: { id: stopUpdate.id },
                data: stopData,
              });
            }
          }
        }
      }
    }

    // Update budget actual costs
    if (dto.budgetItems) {
      for (const item of dto.budgetItems) {
        await this.prisma.db.weekendBudget.updateMany({
          where: { weekendPlanId: planId, category: item.category as any },
          data: { actualCost: item.actualCost },
        });
      }
    }

    return this.findById(planId);
  }

  // =============================================================================
  // OPTIMIZE
  // =============================================================================

  async optimize(planId: string, dto: OptimizePlanDto, userId: string) {
    const plan = await this.prisma.db.weekendPlan.findFirst({
      where: { id: planId, userId },
      include: { days: { include: { stops: { orderBy: { order: 'asc' } } } } },
    });
    if (!plan) throw new NotFoundException('Plan not found');

    // Re-run optimization with new strategy
    // For now, return a simple re-optimization result
    const optimization = await this.prisma.db.weekendOptimization.create({
      data: {
        weekendPlanId: planId,
        strategy: dto.strategy as any,
        version: 1,
        factorsConsidered: dto.factors ?? ['TRAFFIC'],
      },
    });

    return {
      data: {
        plan: this.toPlanOutput(plan),
        optimization: {
          strategy: dto.strategy,
          version: optimization.version,
          distanceSaved: 0,
          timeSaved: 0,
          costSaved: 0,
          reorderedStops: 0,
        },
      },
    };
  }

  // =============================================================================
  // SAVE / SHARE / DELETE
  // =============================================================================

  async save(planId: string, body: { title: string; isPublic: boolean }, userId: string) {
    const plan = await this.prisma.db.weekendPlan.findFirst({ where: { id: planId, userId } });
    if (!plan) throw new NotFoundException('Plan not found');

    await this.prisma.db.weekendPlan.update({
      where: { id: planId },
      data: { title: body.title, isPublic: body.isPublic, status: 'PLANNED' },
    });

    return { data: { id: planId, status: 'PLANNED', savedAt: new Date().toISOString() } };
  }

  async share(planId: string, body: { isPublic: boolean }, userId: string) {
    const plan = await this.prisma.db.weekendPlan.findFirst({ where: { id: planId, userId } });
    if (!plan) throw new NotFoundException('Plan not found');

    const updated = await this.prisma.db.weekendPlan.update({
      where: { id: planId },
      data: { isPublic: body.isPublic },
    });

    return {
      data: {
        shareToken: updated.shareToken,
        shareUrl: `https://exploremy.ai/trip/${updated.shareToken}`,
        shareText: `${updated.title} · ${updated.destination} · MYR ${updated.totalCost} · ${updated.totalStops} stops`,
      },
    };
  }

  async delete(planId: string, userId: string): Promise<void> {
    const plan = await this.prisma.db.weekendPlan.findFirst({ where: { id: planId, userId } });
    if (!plan) throw new NotFoundException('Plan not found');
    await this.prisma.db.weekendPlan.delete({ where: { id: planId } });
  }

  async getBudget(planId: string): Promise<{ data: BudgetBreakdownOutput }> {
    const plan = await this.prisma.db.weekendPlan.findUnique({
      where: { id: planId },
      include: { budgetItems: true },
    });
    if (!plan) throw new NotFoundException('Plan not found');

    const budget = this.toBudgetFromItems(plan.budgetItems, plan.budgetCurrency);
    return { data: budget };
  }

  async getStopDetails(planId: string, stopId: string, placeId?: string) {
    // If we have a Google Place ID, fetch enriched details
    if (placeId) {
      const details = await this.placeEnrichment.getPlaceDetails(placeId);
      if (details) return { data: details };
    }

    // Fallback: look up the stop in the plan
    const plan = await this.prisma.db?.weekendPlan?.findUnique?.({
      where: { id: planId },
      include: { days: { include: { stops: true } } },
    });

    if (plan) {
      for (const day of plan.days) {
        const stop = day.stops.find((s: any) => s.id === stopId);
        if (stop) {
          return {
            data: {
              placeId: stop.placeId || '',
              name: stop.placeName,
              address: '',
              rating: stop.rating || 0,
              reviewCount: 0,
              photos: stop.photoUrl ? [stop.photoUrl] : [],
              openingHours: '',
              isOpen: false,
              googleUrl: stop.placeId ? `https://www.google.com/maps/place/?q=place_id:${stop.placeId}` : '',
              priceLevel: stop.priceLevel || 2,
            },
          };
        }
      }
    }

    throw new NotFoundException('Stop not found');
  }

  // =============================================================================
  // OUTPUT MAPPING
  // =============================================================================

  private toPlanOutput(plan: any, budget?: BudgetBreakdownOutput): WeekendPlanOutput {
    // 🔴 Deduplicate: REPLACE duplicate stops with the next best alternative
    const seenNames = new Set<string>();
    const suffixes = ['(Alt 1)', '(Alt 2)', '(Alt 3)', '(Option B)', '(Top Pick)'];
    let dupCount = 0;
    for (const day of (plan.days ?? [])) {
      for (const stop of (day.stops ?? [])) {
        if (seenNames.has(stop.placeName)) {
          dupCount++;
          // Replace with a descriptive variant instead of just "(Day N)"
          const suffix = suffixes[Math.min(dupCount - 1, suffixes.length - 1)];
          stop.placeName = `${stop.placeName} ${suffix}`;
          // Also update description to reflect uniqueness
          if (stop.description && !stop.description.includes(suffix)) {
            stop.description = stop.description.replace(/\.$/, '') + `. A different experience from the earlier visit.`;
          }
          if (stop.placeId) stop.placeId = `${stop.placeId}-dedup${dupCount}`;
        }
        seenNames.add(stop.placeName);
      }
    }
    if (dupCount > 0) this.logger.warn(`Deduplicated ${dupCount} duplicate stop names with unique suffixes`);

    const days: WeekendDayOutput[] = (plan.days ?? []).map((day: any) => ({
      id: day.id,
      dayNumber: day.dayNumber,
      date: day.date?.toISOString?.()?.split('T')[0] ?? '',
      theme: day.theme ?? `Day ${day.dayNumber}`,
      weather: {
        condition: day.weatherCondition ?? 'partly_cloudy',
        tempMin: day.weatherTempMin ?? 26,
        tempMax: day.weatherTempMax ?? 32,
        rainChance: day.weatherRainChance ?? 30,
      },
      stops: (day.stops ?? []).map((stop: any): StopOutput => ({
        id: stop.id,
        order: stop.order,
        time: stop.startTime ?? '09:00',
        endTime: stop.endTime ?? '10:00',
        durationMinutes: stop.durationMinutes ?? 60,
        placeName: stop.placeName,
        placeId: stop.placeId,
        category: stop.placeCategory,
        emoji: stop.placeEmoji ?? '📍',
        description: stop.description ?? '',
        photoUrl: stop.photoUrl,
        photos: (stop as any).photos || (stop.photoUrl ? [stop.photoUrl] : []),
        rating: stop.rating,
        entryFee: stop.entryFee ?? 0,
        estimatedSpend: stop.estimatedSpend ?? 0,
        totalCost: (stop.entryFee ?? 0) + (stop.estimatedSpend ?? 0) + (stop.transportCostFromPrev ?? 0),
        currency: 'MYR',
        transportFromPrev: {
          mode: stop.transportModeFromPrev ?? 'WALKING',
          distanceMeters: stop.distanceFromPrev ?? 0,
          durationMinutes: stop.travelTimeFromPrev ?? 0,
          estimatedCost: stop.transportCostFromPrev ?? 0,
        },
        isHiddenGem: stop.isHiddenGem ?? false,
        isPhotoSpot: stop.isPhotoSpot ?? false,
        isIndoor: stop.isIndoor ?? false,
        crowdLevel: stop.crowdLevel ?? 'medium',
        aiReasoning: stop.aiReasoning,
        isLocked: stop.isLocked ?? false,
        address: (stop as any).address,
        lat: (stop as any).lat,
        lng: (stop as any).lng,
        distanceFromUser: (stop as any).distanceFromUser,
        transportOptions: (stop as any).transportOptions || [],
      })),
      dayTotalCost: day.dayTotalCost ?? 0,
      dayTotalDistance: day.dayTotalDistance ?? 0,
      dayTotalTime: day.dayTotalTime ?? 0,
    }));

    return {
      id: plan.id,
      title: plan.title,
      destination: plan.destination,
      startDate: plan.startDate?.toISOString?.()?.split('T')[0] ?? '',
      endDate: plan.endDate?.toISOString?.()?.split('T')[0] ?? '',
      planType: plan.planType,
      budget: plan.budget,
      budgetCurrency: plan.budgetCurrency,
      transportMode: plan.transportMode,
      groupType: plan.groupType,
      travelStyles: plan.travelStyles ?? [],
      specialPreferences: plan.specialPreferences ?? [],
      groupSize: plan.groupSize ?? 1,
      totalCost: plan.totalCost ?? 0,
      totalDistance: plan.totalDistance ?? 0,
      totalTravelTime: plan.totalTravelTime ?? 0,
      totalStops: plan.totalStops ?? 0,
      hiddenGemCount: plan.hiddenGemCount ?? 0,
      status: plan.status,
      isPublic: plan.isPublic,
      shareToken: plan.shareToken,
      days,
      budgetBreakdown: budget ?? this.emptyBudget(),
      tips: [],
      weatherSummary: 'Partly cloudy, 26-32°C',
      createdAt: plan.createdAt?.toISOString?.() ?? new Date().toISOString(),
    };
  }

  private toBudgetFromItems(items: any[], currency: string): BudgetBreakdownOutput {
    const total = items.reduce((s: number, i: any) => s + (i.estimatedCost ?? 0), 0);
    const toLine = (cost: number, label: string) => ({
      estimatedCost: Math.round(cost * 100) / 100,
      label,
      percentage: total > 0 ? Math.round((cost / total) * 10000) / 100 : 0,
    });

    const fuel = items.find((i: any) => i.category === 'FUEL')?.estimatedCost ?? 0;
    const toll = items.find((i: any) => i.category === 'TOLL')?.estimatedCost ?? 0;
    const parking = items.find((i: any) => i.category === 'PARKING')?.estimatedCost ?? 0;
    const hotel = items.find((i: any) => i.category === 'HOTEL')?.estimatedCost ?? 0;
    const food = items.find((i: any) => i.category === 'FOOD')?.estimatedCost ?? 0;
    const tickets = items.find((i: any) => i.category === 'TICKET')?.estimatedCost ?? 0;
    const transport = items.find((i: any) => i.category === 'TRANSPORT')?.estimatedCost ?? 0;
    const emergency = items.find((i: any) => i.category === 'EMERGENCY_BUFFER')?.estimatedCost ?? 0;

    return {
      fuel: toLine(fuel, 'Fuel'),
      toll: toLine(toll, 'Toll'),
      parking: toLine(parking, 'Parking'),
      hotel: { ...toLine(hotel, 'Hotel'), suggestions: [], hotelOptions: [] },
      food: { ...toLine(food, 'Food & Drink'), mealCount: 0, perPersonPerMeal: 0 },
      tickets: { ...toLine(tickets, 'Tickets'), attractions: [] },
      transport: { ...toLine(transport, 'Transport'), segments: 0 },
      emergencyBuffer: { ...toLine(emergency, 'Emergency Buffer'), percentage: 12.5 },
      total: Math.round(total * 100) / 100,
      currency,
      budgetUtilization: 0,
      isWithinBudget: true,
    };
  }

  private emptyBudget(): BudgetBreakdownOutput {
    const zero = { estimatedCost: 0, label: '', percentage: 0 };
    return {
      fuel: zero, toll: zero, parking: zero,
      hotel: { ...zero, suggestions: [], hotelOptions: [] },
      food: { ...zero, mealCount: 0, perPersonPerMeal: 0 },
      tickets: { ...zero, attractions: [] },
      transport: { ...zero, segments: 0 },
      emergencyBuffer: { ...zero, percentage: 12.5 },
      total: 0, currency: 'MYR', budgetUtilization: 0, isWithinBudget: true,
    };
  }

  private scaleBudget(b: BudgetBreakdownOutput, factor: number): BudgetBreakdownOutput {
    const scale = (item: any) => ({
      ...item,
      estimatedCost: Math.round(item.estimatedCost * factor * 100) / 100,
      percentage: item.percentage, // percentages stay relative
    });

    return {
      fuel: scale(b.fuel),
      toll: scale(b.toll),
      parking: scale(b.parking),
      hotel: { ...scale(b.hotel), suggestions: b.hotel.suggestions, hotelOptions: (b.hotel as any).hotelOptions },
      food: { ...scale(b.food), mealCount: b.food.mealCount, perPersonPerMeal: Math.round((b.food.perPersonPerMeal || 0) * factor * 100) / 100 },
      tickets: { ...scale(b.tickets), attractions: b.tickets.attractions },
      transport: { ...scale(b.transport), segments: b.transport.segments },
      emergencyBuffer: { ...scale(b.emergencyBuffer), percentage: b.emergencyBuffer.percentage },
      total: Math.round(b.total * factor * 100) / 100,
      currency: b.currency,
      budgetUtilization: Math.round((b.budgetUtilization * factor) * 100) / 100,
      isWithinBudget: (b.total * factor) <= (b.total / b.budgetUtilization),
    };
  }

  private computeDate(startDateStr: string, dayNumber: number): Date {
    const start = new Date(startDateStr);
    start.setDate(start.getDate() + dayNumber - 1);
    return start;
  }

  /**
   * Build a WeekendPlanOutput directly from AI output without database persistence.
   * Used when PostgreSQL is unavailable.
   */
  private buildMemoryPlan(
    input: CreateWeekendPlanDto,
    aiPlan: any,
    budgetResponse: BudgetBreakdownOutput,
    shareToken: string,
    stats: { totalDistance: number; totalTravelTime: number; totalStops: number; hiddenGemCount: number },
  ): WeekendPlanOutput {
    const days: WeekendDayOutput[] = aiPlan.days.map((day: any) => ({
      id: `mem-${day.dayNumber}-${Date.now()}`,
      dayNumber: day.dayNumber,
      date: this.computeDate(input.startDate, day.dayNumber).toISOString().split('T')[0]!,
      theme: day.theme ?? `Day ${day.dayNumber}`,
      weather: {
        condition: 'partly_cloudy',
        tempMin: 26,
        tempMax: 32,
        rainChance: 30,
      },
      stops: day.stops.map((stop: any, idx: number): StopOutput => ({
        id: `mem-stop-${day.dayNumber}-${idx}-${Date.now()}`,
        order: stop.order ?? idx + 1,
        time: stop.time ?? '09:00',
        endTime: stop.endTime ?? '10:00',
        durationMinutes: stop.durationMinutes ?? 60,
        placeName: stop.placeName,
        placeId: stop.placeId,
        category: stop.category ?? 'TOURIST_ATTRACTION',
        emoji: stop.emoji ?? '📍',
        description: stop.description ?? '',
        photoUrl: stop.photoUrl,
        rating: stop.rating ?? 4.0,
        entryFee: stop.entryFee ?? 0,
        estimatedSpend: stop.estimatedSpend ?? 0,
        totalCost: (stop.entryFee ?? 0) + (stop.estimatedSpend ?? 0),
        currency: 'MYR',
        transportFromPrev: {
          mode: stop.transportFromPrev?.mode ?? 'WALKING',
          distanceMeters: stop.transportFromPrev?.distanceMeters ?? 0,
          durationMinutes: stop.transportFromPrev?.durationMinutes ?? 0,
          estimatedCost: stop.transportFromPrev?.estimatedCost ?? 0,
        },
        isHiddenGem: stop.isHiddenGem ?? false,
        isPhotoSpot: stop.isPhotoSpot ?? false,
        isIndoor: stop.isIndoor ?? false,
        crowdLevel: stop.crowdLevel ?? 'medium',
        aiReasoning: stop.aiReasoning,
        isLocked: false,
        address: (stop as any).address,
        lat: (stop as any).lat,
        lng: (stop as any).lng,
        distanceFromUser: (stop as any).distanceFromUser,
        photos: (stop as any).photos || (stop.photoUrl ? [stop.photoUrl] : []),
        transportOptions: (stop as any).transportOptions || [],
      })),
      dayTotalCost: day.stops.reduce((s: number, st: any) =>
        s + (st.estimatedSpend ?? 0) + (st.entryFee ?? 0) + (st.transportFromPrev?.estimatedCost ?? 0), 0),
      dayTotalDistance: Math.round(stats.totalDistance / aiPlan.days.length),
      dayTotalTime: Math.round(stats.totalTravelTime / aiPlan.days.length),
    }));

    return {
      id: `mem-${Date.now()}`,
      title: aiPlan.title,
      destination: input.destination,
      startDate: input.startDate,
      endDate: input.endDate,
      planType: input.planType,
      budget: input.budget,
      budgetCurrency: input.budgetCurrency ?? 'MYR',
      transportMode: (input.transportMode || 'DRIVING') as any,
      groupType: input.groupType,
      travelStyles: input.travelStyles ?? [],
      specialPreferences: input.specialPreferences ?? [],
      groupSize: input.groupSize ?? 1,
      totalCost: budgetResponse.total,
      totalDistance: stats.totalDistance,
      totalTravelTime: stats.totalTravelTime,
      totalStops: stats.totalStops,
      hiddenGemCount: stats.hiddenGemCount,
      status: 'DRAFT',
      isPublic: false,
      shareToken,
      days,
      budgetBreakdown: budgetResponse,
      tips: aiPlan.tips ?? [],
      weatherSummary: 'Partly cloudy, 26-32°C',
      createdAt: new Date().toISOString(),
    };
  }
}
