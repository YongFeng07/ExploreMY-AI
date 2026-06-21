import { Controller, Post, Get, Body, Param, Query } from '@nestjs/common';
import { DatingPlannerService } from './dating-planner.service';
import { DateEngineService } from './services/date-engine.service';
import { Public } from '../auth/decorators/public.decorator';

@Controller('dating-planner')
@Public()
export class DatingPlannerController {
  constructor(
    private readonly datingPlanner: DatingPlannerService,
    private readonly dateEngine: DateEngineService,
  ) {}

  /** Generate a complete AI date plan */
  @Post('generate')
  async generate(@Body() body: {
    city: string;
    budget: number;
    durationHours?: number;
    transportMode?: string;
    relationshipStage?: string;
    dateType?: string;
    preferredTime?: string;
    userId?: string;
  }) {
    const plan = await this.datingPlanner.generatePlan({
      city: body.city || 'Kuala Lumpur',
      budget: body.budget || 200,
      durationHours: body.durationHours || 4,
      transportMode: body.transportMode || 'DRIVING',
      relationshipStage: body.relationshipStage || 'NEW_COUPLE',
      dateType: body.dateType || 'ROMANTIC',
      preferredTime: body.preferredTime,
      userId: body.userId,
    });
    return { data: plan, meta: { generated: new Date().toISOString() } };
  }

  /** Get all relationship stages with profiles */
  @Get('stages')
  getStages() {
    return { data: this.dateEngine.getAllStages() };
  }

  /** Get all date types with profiles */
  @Get('date-types')
  getDateTypes() {
    return { data: this.dateEngine.getAllDateTypes() };
  }

  /** Get dating venues for a city */
  @Get('venues')
  getVenues(@Query('city') city: string, @Query('dateType') dateType?: string, @Query('stage') stage?: string) {
    const venues = this.dateEngine.getVenues(city || 'Kuala Lumpur', dateType, stage);
    return { data: venues, meta: { total: venues.length } };
  }

  /** Get stage-specific recommendations */
  @Get('recommendations/:stage')
  getRecommendations(@Param('stage') stage: string) {
    const profile = this.dateEngine.getStageProfile(stage);
    const tips: Record<string, string[]> = {
      FIRST_DATE: [
        'Keep it under 2 hours — leave them wanting more.',
        'Choose a public, neutral venue — safety and comfort first.',
        'Cafe dates are ideal: low pressure, easy exit, conversation-focused.',
        'Have 3 open-ended questions ready (not "what do you do?").',
        'Offer to pay but don\'t insist — read the room.',
      ],
      SECOND_DATE: [
        'Add a shared activity — food tour, museum, mini-golf.',
        'Reference something from the first date — shows you paid attention.',
        'Slightly more personal venue, but still public.',
        'Physical activity builds rapport faster than sitting across a table.',
      ],
      NEW_COUPLE: [
        'Create a "first" together — first sunset, first hike, first concert.',
        'Mix romance with adventure — dinner + activity combo works best.',
        'Start building inside jokes and shared references.',
        'Photos matter now — pick photogenic venues.',
      ],
      LONG_TERM_COUPLE: [
        'Avoid routine — surprise them with something completely new.',
        'Revisit your first date spot for nostalgia points.',
        'Quality > quantity: one premium experience beats three average ones.',
        'Plan WITHOUT asking them — the surprise is the gift.',
      ],
      MARRIED_COUPLE: [
        'Reignite the spark: pretend it\'s a first date at a new venue.',
        'No phones, no kids, no logistics talk — pure presence.',
        'Relive your best memories: recreate your proposal or honeymoon dinner.',
        'Write a letter — words matter more than gifts at this stage.',
      ],
    };
    return { data: { profile, dateTips: tips[stage] || tips['NEW_COUPLE']! } };
  }
}
