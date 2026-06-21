import { Controller, Get, Query } from '@nestjs/common';
import { EventsService } from './events.service';
import { Public } from '../auth/decorators/public.decorator';

@Controller('events')
@Public()
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}
  @Get('upcoming') upcoming() { return this.eventsService.getUpcoming(); }
  @Get('nearby') nearby(@Query('lat') lat: string, @Query('lng') lng: string, @Query('radius') radius?: string) { return this.eventsService.getNearby(parseFloat(lat), parseFloat(lng), radius ? parseInt(radius) : 25000); }
}
