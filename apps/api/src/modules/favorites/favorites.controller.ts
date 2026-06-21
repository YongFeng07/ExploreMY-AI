import { Controller, Get, Post, Delete, Param, Body } from '@nestjs/common';
import { FavoritesService } from './favorites.service';

@Controller('favorites')
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Get(':userId')
  getUserFavorites(@Param('userId') userId: string) {
    return { data: this.favoritesService.getUserFavorites(userId) };
  }

  @Post()
  addFavorite(
    @Body() body: { userId: string; placeId: string; placeName: string; placeSlug: string; category: string; rating: number; photoUrl?: string; notes?: string },
  ) {
    const fav = this.favoritesService.addFavorite(body.userId, {
      placeId: body.placeId,
      placeName: body.placeName,
      placeSlug: body.placeSlug,
      category: body.category,
      rating: body.rating,
      photoUrl: body.photoUrl ?? null,
      notes: body.notes ?? null,
    });
    return { data: fav };
  }

  @Delete(':userId/:placeId')
  removeFavorite(@Param('userId') userId: string, @Param('placeId') placeId: string) {
    const removed = this.favoritesService.removeFavorite(userId, placeId);
    return { data: { removed } };
  }

  @Get(':userId/check/:placeId')
  checkFavorite(@Param('userId') userId: string, @Param('placeId') placeId: string) {
    return { data: { favorited: this.favoritesService.isFavorited(userId, placeId) } };
  }
}
