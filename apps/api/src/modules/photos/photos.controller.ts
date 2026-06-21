import { Controller, Get, Post, Param, Body, Headers, Query } from '@nestjs/common';
import { PhotosService } from './photos.service';
import { Public } from '../auth/decorators/public.decorator';

@Controller('photos')
@Public()
export class PhotosController {
  constructor(private readonly photosService: PhotosService) {}
  @Get('place/:placeId') getForPlace(@Param('placeId') placeId: string) { return this.photosService.getForPlace(placeId); }
  @Get('user/:userId') getForUser(@Param('userId') userId: string) { return this.photosService.getForUser(userId); }
  @Post() upload(@Headers('x-user-id') userId: string, @Body() body: { placeId: string; url: string }) { return this.photosService.upload(userId || 'demo', body.placeId, body.url); }
}
