import { Module } from '@nestjs/common';
import { DatingPlannerController } from './dating-planner.controller';
import { DatingPlannerService } from './dating-planner.service';
import { DateEngineService } from './services/date-engine.service';
import { AiDatingService } from './services/ai-dating.service';

@Module({
  controllers: [DatingPlannerController],
  providers: [DatingPlannerService, DateEngineService, AiDatingService],
  exports: [DatingPlannerService, DateEngineService],
})
export class DatingPlannerModule {}
