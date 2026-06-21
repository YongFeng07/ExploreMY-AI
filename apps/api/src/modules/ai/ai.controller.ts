import { Controller, Post, Body } from '@nestjs/common';
import { AiService } from './ai.service';
import { Public } from '../auth/decorators/public.decorator';

@Controller('ai')
@Public()
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('plan-trip')
  async planTrip(@Body() body: { destination: string; duration: number; budget: number; interests: string[] }) {
    const plan = await this.aiService.planTrip(body.destination, body.duration, body.budget, body.interests);
    return { data: plan };
  }
}
