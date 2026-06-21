import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { TripsService } from './trips.service';

@Controller('trips')
export class TripsController {
  constructor(private readonly tripsService: TripsService) {}

  @Get('user/:userId')
  getUserTrips(@Param('userId') userId: string) {
    return { data: this.tripsService.getUserTrips(userId) };
  }

  @Post()
  create(@Body() body: { userId: string; title: string; destinationCity: string; status: string; dayCount: number; budget?: number; isAIGenerated?: boolean; isPublic?: boolean; coverEmoji?: string }) {
    return { data: this.tripsService.create({ userId: body.userId, title: body.title, destinationCity: body.destinationCity, status: body.status, dayCount: body.dayCount, budget: body.budget ?? null, isAIGenerated: body.isAIGenerated ?? false, isPublic: body.isPublic ?? false, coverEmoji: body.coverEmoji ?? '📍' }) };
  }
}
