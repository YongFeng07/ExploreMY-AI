import { Controller, Get, Query } from '@nestjs/common';
import { TransportService } from './transport.service';
import { Public } from '../auth/decorators/public.decorator';

@Controller('transport')
@Public()
export class TransportController {
  constructor(private readonly transportService: TransportService) {}
  @Get('options') getOptions(@Query('originLat') olat: string, @Query('originLng') olng: string, @Query('destLat') dlat: string, @Query('destLng') dlng: string) {
    return this.transportService.getOptions(parseFloat(olat), parseFloat(olng), parseFloat(dlat), parseFloat(dlng));
  }
}
