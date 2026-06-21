import { Module } from '@nestjs/common';
import { WeekendPlannerController } from './weekend-planner.controller';
import { WeekendPlannerService } from './weekend-planner.service';
import { PlanGeneratorService } from './services/plan-generator.service';
import { FallbackPlannerService } from './services/fallback-planner.service';
import { BudgetEngineService } from './services/budget-engine.service';
import { RouteOptimizerService } from './services/route-optimizer.service';
import { PlaceEnrichmentService } from './services/place-enrichment.service';
import { GeocodingService } from './services/geocoding.service';
import { TravelDNAService } from './services/travel-dna.service';
import { HiddenGemService } from './services/hidden-gem.service';
import { PhotoCuratorService } from './services/photo-curator.service';
import { MonetizationService } from './services/monetization.service';
import { ShareService } from './services/share.service';
import { RoadtripEngineService } from './services/roadtrip-engine.service';

@Module({
  controllers: [WeekendPlannerController],
  providers: [
    WeekendPlannerService,
    PlanGeneratorService,
    FallbackPlannerService,
    BudgetEngineService,
    RouteOptimizerService,
    PlaceEnrichmentService,
    GeocodingService,
    TravelDNAService,
    HiddenGemService,
    PhotoCuratorService,
    MonetizationService,
    ShareService,
    RoadtripEngineService,
  ],
  exports: [WeekendPlannerService],
})
export class WeekendPlannerModule {}
