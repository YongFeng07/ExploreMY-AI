import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { Public } from '../auth/decorators/public.decorator';

@Controller('reviews')
@Public()
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get('place/:placeId')
  getByPlace(@Param('placeId') placeId: string) {
    return { data: this.reviewsService.getByPlace(placeId) };
  }

  @Get('place/:placeId/stats')
  getStats(@Param('placeId') placeId: string) {
    return { data: this.reviewsService.getStats(placeId) };
  }

  @Post()
  create(@Body() body: { userId: string; userName: string; placeId: string; rating: number; title?: string; content: string; tags?: string[] }) {
    const review = this.reviewsService.create({
      userId: body.userId,
      userName: body.userName,
      placeId: body.placeId,
      rating: body.rating,
      title: body.title ?? null,
      content: body.content,
      tags: body.tags ?? [],
    });
    return { data: review };
  }
}
