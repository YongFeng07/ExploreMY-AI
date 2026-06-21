import { Controller, Get, Param, Query } from '@nestjs/common';
import { PlacesService } from './places.service';
import { Public } from '../auth/decorators/public.decorator';

@Controller('places')
@Public()
export class PlacesController {
  constructor(private readonly placesService: PlacesService) {}

  @Get('nearby')
  async nearby(@Query('lat') lat: string, @Query('lng') lng: string, @Query('radius') radius: string, @Query('category') category?: string) {
    const data = await this.placesService.findNearby(parseFloat(lat ?? '3.139'), parseFloat(lng ?? '101.6869'), parseInt(radius ?? '5000'), category);
    return { data, meta: { total: data.length } };
  }

  @Get('ai-recommendations')
  aiRecommendations(@Query('lat') lat: string, @Query('lng') lng: string) {
    return { data: this.placesService.getAIRecommendations(parseFloat(lat ?? '3.139'), parseFloat(lng ?? '101.6869')) };
  }

  @Get('daily-plan')
  dailyPlan(@Query('lat') lat: string, @Query('lng') lng: string) {
    return { data: this.placesService.generateDailyPlan(parseFloat(lat ?? '3.139'), parseFloat(lng ?? '101.6869')) };
  }

  @Get('categories') categories() { return { data: [{ value:'FOOD',label:'Food & Restaurant',icon:'🍜' },{ value:'CAFE',label:'Cafe & Coffee',icon:'☕' },{ value:'ATTRACTION',label:'Attractions',icon:'🏛️' },{ value:'SHOPPING_MALL',label:'Shopping Malls',icon:'🛍️' }]}; }

  @Get('search')
  async search(@Query('q') q: string, @Query('lat') lat: string, @Query('lng') lng: string, @Query('limit') limit: string) {
    const data = await this.placesService.textSearchWithFallback(q || '', parseFloat(lat || '3.139'), parseFloat(lng || '101.6869'), parseInt(limit || '30'));
    return { data, meta: { total: data.length } };
  }

  @Get('details/:placeId')
  async getDetails(@Param('placeId') placeId: string) {
    const place = await this.placesService.getPlaceDetails(placeId);
    if (!place) return { error: 'Place not found' };
    return { data: place };
  }

  @Get(':slug')
  async getBySlug(@Param('slug') slug: string) {
    const place = await this.placesService.findBySlug(slug);
    if (!place) return { error: 'Place not found' };
    return { data: place };
  }
}
