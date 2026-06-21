import {
  Controller, Get, Post, Patch, Delete, Param, Query, Body, HttpCode, HttpStatus, Headers,
} from '@nestjs/common';
import { WeekendPlannerService } from './weekend-planner.service';
import { TravelDNAService } from './services/travel-dna.service';
import { MonetizationService } from './services/monetization.service';
import { ShareService } from './services/share.service';
import { RoadtripEngineService } from './services/roadtrip-engine.service';
import { Public } from '../auth/decorators/public.decorator';
import { CreateWeekendPlanDto } from './dto/create-weekend-plan.dto';
import { UpdateWeekendPlanDto } from './dto/update-weekend-plan.dto';
import { OptimizePlanDto } from './dto/optimize-plan.dto';

@Controller('weekend-planner')
@Public()
export class WeekendPlannerController {
  constructor(
    private readonly weekendPlannerService: WeekendPlannerService,
    private readonly travelDNA: TravelDNAService,
    private readonly monetization: MonetizationService,
    private readonly shareService: ShareService,
    private readonly roadtripEngine: RoadtripEngineService,
  ) {}

  // ── Generate ──
  @Post('generate')
  async generate(
    @Body() body: CreateWeekendPlanDto,
    @Headers('x-user-id') userId?: string,
  ) {
    const uid = userId ?? 'demo-user-001';
    return this.weekendPlannerService.generate(body, uid);
  }

  // ── List plans ──
  @Get()
  async listPlans(
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sort') sort?: string,
    @Query('order') order?: string,
    @Headers('x-user-id') userId?: string,
  ) {
    const uid = userId ?? 'demo-user-001';
    return this.weekendPlannerService.list(
      {
        status,
        page: page ? parseInt(page) : undefined,
        limit: limit ? parseInt(limit) : undefined,
        sort,
        order,
      },
      uid,
    );
  }

  // ── Shared plan (no auth) ──
  @Get('shared/:shareToken')
  async getSharedPlan(@Param('shareToken') shareToken: string) {
    return this.weekendPlannerService.findByShareToken(shareToken);
  }

  // ── Get single plan ──
  @Get(':planId')
  async getPlan(
    @Param('planId') planId: string,
    @Headers('x-user-id') userId?: string,
  ) {
    return this.weekendPlannerService.findById(planId);
  }

  // ── Update ──
  @Patch(':planId')
  async update(
    @Param('planId') planId: string,
    @Body() body: UpdateWeekendPlanDto,
    @Headers('x-user-id') userId?: string,
  ) {
    const uid = userId ?? 'demo-user-001';
    return this.weekendPlannerService.update(planId, body, uid);
  }

  // ── Optimize ──
  @Post(':planId/optimize')
  async optimize(
    @Param('planId') planId: string,
    @Body() body: OptimizePlanDto,
    @Headers('x-user-id') userId?: string,
  ) {
    const uid = userId ?? 'demo-user-001';
    return this.weekendPlannerService.optimize(planId, body, uid);
  }

  // ── Save ──
  @Post(':planId/save')
  async save(
    @Param('planId') planId: string,
    @Body() body: { title: string; isPublic: boolean },
    @Headers('x-user-id') userId?: string,
  ) {
    const uid = userId ?? 'demo-user-001';
    return this.weekendPlannerService.save(planId, body, uid);
  }

  // ── Share ──
  @Post(':planId/share')
  async share(
    @Param('planId') planId: string,
    @Body() body: { isPublic: boolean; platforms?: string[] },
    @Headers('x-user-id') userId?: string,
  ) {
    const uid = userId ?? 'demo-user-001';
    return this.weekendPlannerService.share(planId, body, uid);
  }

  // ── Delete ──
  @Delete(':planId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(
    @Param('planId') planId: string,
    @Headers('x-user-id') userId?: string,
  ) {
    const uid = userId ?? 'demo-user-001';
    await this.weekendPlannerService.delete(planId, uid);
  }

  // ── Budget breakdown ──
  @Get(':planId/budget')
  async getBudget(
    @Param('planId') planId: string,
    @Headers('x-user-id') userId?: string,
  ) {
    return this.weekendPlannerService.getBudget(planId);
  }

  // ── Travel DNA ──
  @Get('dna/:userId')
  getDNA(@Param('userId') userId: string) {
    return { data: this.travelDNA.exportDNA(userId) };
  }

  @Post('dna/:userId/feedback')
  submitFeedback(
    @Param('userId') userId: string,
    @Body() body: { stopCategories: string[]; liked: boolean },
  ) {
    this.travelDNA.learnFromFeedback(userId, body.stopCategories, body.liked);
    return { data: { acknowledged: true } };
  }

  // ── Monetization ──
  @Get('pricing')
  getPricing() {
    return {
      data: {
        FREE: this.monetization.getPricing('FREE'),
        PRO: this.monetization.getPricing('PRO'),
        FAMILY: this.monetization.getPricing('FAMILY'),
        BUSINESS: this.monetization.getPricing('BUSINESS'),
      },
    };
  }

  @Post(':planId/booking-links')
  getBookingLinks(@Param('planId') planId: string, @Body() body: { stopName: string; category: string }) {
    const links = this.monetization.generateBookingLinks(body.stopName, planId, body.category);
    return { data: links };
  }

  // ── Conversational AI Refinement ──
  // ── Roadtrip Engine ──
  @Post('roadtrip/calculate')
  calculateRoadtrip(@Body() body: {
    originLat: number; originLng: number;
    destLat: number; destLng: number;
    vehicleType?: string; dayCount?: number; pax?: number; style?: string;
  }) {
    const route = this.roadtripEngine.calculateRoute(
      body.originLat, body.originLng, body.destLat, body.destLng,
      (body.vehicleType as any) || 'car_midsize', body.dayCount || 2,
    );
    const budget = this.roadtripEngine.calculateBudget(
      route, body.vehicleType || 'car_midsize', body.dayCount || 2,
      body.pax || 2, body.style || 'midRange',
    );
    const emergency = this.roadtripEngine.getEmergencyInfo(body.destLat, body.destLng);
    return { data: { route, budget, emergency } };
  }

  // ── Share + Viral ──
  @Post(':planId/share-card')
  getShareCard(@Param('planId') planId: string, @Body() body: { title: string; destination: string; totalCost: number; totalStops: number; days?: any[]; shareToken?: string }) {
    const card = this.shareService.generateShareCard(body);
    return { data: card };
  }

  @Post(':planId/refine')
  async refinePlan(
    @Param('planId') planId: string,
    @Body() body: { message: string; lockedStopIds?: string[] },
    @Headers('x-user-id') userId?: string,
  ) {
    // For now, provide refinement instructions back
    return {
      data: {
        acknowledged: true,
        message: `Refinement request received: "${body.message}". ` +
          `Locked stops: ${(body.lockedStopIds || []).length}. ` +
          `This will regenerate the plan with your changes applied.`,
        // In production: call AI with conversation context
        estimatedTimeMs: 5000,
      },
    };
  }

  // ── Stop details (enriched with Google Places) ──
  @Get(':planId/stops/:stopId/details')
  async getStopDetails(
    @Param('planId') planId: string,
    @Param('stopId') stopId: string,
    @Query('placeId') placeId?: string,
  ) {
    return this.weekendPlannerService.getStopDetails(planId, stopId, placeId);
  }
}
