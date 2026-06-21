import { Controller, Get, Post, Param, Body, Query, Headers } from '@nestjs/common';
import { SocialService } from './social.service';

@Controller('social')
export class SocialController {
  constructor(private readonly socialService: SocialService) {}

  @Get('feed')
  getFeed(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.socialService.getFeed(page ? parseInt(page) : 1, limit ? parseInt(limit) : 10);
  }

  @Post('posts')
  createPost(@Headers('x-user-id') userId: string, @Body() body: any) {
    return this.socialService.createPost(userId || 'demo', body);
  }

  @Get('users/:userId/posts')
  getUserPosts(@Param('userId') userId: string) {
    return this.socialService.getUserPosts(userId);
  }

  @Post('posts/:postId/like')
  toggleLike(@Param('postId') postId: string, @Headers('x-user-id') userId?: string) {
    return this.socialService.toggleLike(postId, userId || 'demo');
  }
}
