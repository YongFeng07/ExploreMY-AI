import { Controller, Get, Query } from '@nestjs/common';
import { RoutesService } from './routes.service';
import { Public } from '../auth/decorators/public.decorator';

@Controller('routes')
@Public()
export class RoutesController {
  constructor(private readonly routesService: RoutesService) {}

  @Get('directions')
  getDirections(
    @Query('originLat') originLat: string,
    @Query('originLng') originLng: string,
    @Query('destLat') destLat: string,
    @Query('destLng') destLng: string,
    @Query('mode') mode: string,
  ) {
    return {
      data: this.routesService.getDirections(
        parseFloat(originLat), parseFloat(originLng),
        parseFloat(destLat), parseFloat(destLng),
        mode ?? 'DRIVING',
      ),
    };
  }
}
