import { Controller, Get, Query, Headers } from '@nestjs/common';
import { SearchService } from './search.service';
import { Public } from '../auth/decorators/public.decorator';

@Controller('search')
@Public()
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  async search(@Query('q') q: string, @Query('lat') lat?: string, @Query('lng') lng?: string, @Query('limit') limit?: string) {
    return this.searchService.search(q, lat ? parseFloat(lat) : undefined, lng ? parseFloat(lng) : undefined, limit ? parseInt(limit) : 20);
  }

  @Get('autocomplete')
  async autocomplete(@Query('q') q: string) {
    return this.searchService.autocomplete(q);
  }

  @Get('recent')
  async recent(@Headers('x-user-id') userId?: string) {
    return this.searchService.recentSearches(userId || 'demo');
  }
}
