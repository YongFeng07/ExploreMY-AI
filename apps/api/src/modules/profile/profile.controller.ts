import { Controller, Get, Post, Delete, Patch, Body, Param } from '@nestjs/common';
import { ProfileService } from './profile.service';

@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get(':userId/stats') getStats(@Param('userId') userId: string) { return { data: this.profileService.getStats(userId) }; }
  @Get(':userId/dna') getDNA(@Param('userId') userId: string) { return { data: this.profileService.getDNA(userId) }; }
  @Get(':userId/achievements') getAchievements(@Param('userId') userId: string) { return { data: this.profileService.getAchievements(userId) }; }
  @Get(':userId/wishlist') getWishlist(@Param('userId') userId: string) { return { data: this.profileService.getWishlist(userId) }; }
  @Get(':userId/visited-cities') getVisitedCities(@Param('userId') userId: string) { return { data: this.profileService.getVisitedCities(userId) }; }
  @Get(':userId/favorites') getFavorites(@Param('userId') userId: string) { return { data: this.profileService.getFavorites(userId) }; }
  @Post(':userId/favorites') addFavorite(@Param('userId') userId: string, @Body() body: any) { return { data: this.profileService.addFavorite(userId, body) }; }
  @Delete(':userId/favorites/:favId') removeFavorite(@Param('userId') userId: string, @Param('favId') favId: string) { return { data: this.profileService.removeFavorite(userId, favId) }; }
  @Get(':userId/reviews') getReviews(@Param('userId') userId: string) { return { data: this.profileService.getReviews(userId) }; }
  @Post(':userId/reviews') addReview(@Param('userId') userId: string, @Body() body: any) { return { data: this.profileService.addReview(userId, body) }; }
  @Delete(':userId/reviews/:reviewId') deleteReview(@Param('userId') userId: string, @Param('reviewId') reviewId: string) { return { data: this.profileService.deleteReview(userId, reviewId) }; }
  @Get(':userId/journals') getJournals(@Param('userId') userId: string) { return { data: this.profileService.getJournals(userId) }; }
  @Post(':userId/journals') addJournal(@Param('userId') userId: string, @Body() body: any) { return { data: this.profileService.addJournal(userId, body) }; }
  @Delete(':userId/journals/:journalId') deleteJournal(@Param('userId') userId: string, @Param('journalId') journalId: string) { return { data: this.profileService.deleteJournal(userId, journalId) }; }
  @Patch(':userId/journals/:journalId') updateJournal(@Param('userId') userId: string, @Param('journalId') journalId: string, @Body() body: any) { return { data: this.profileService.updateJournal(userId, journalId, body) }; }
  @Get(':userId/albums') getAlbums(@Param('userId') userId: string) { return { data: this.profileService.getAlbums(userId) }; }
  @Post(':userId/albums') addAlbum(@Param('userId') userId: string, @Body() body: any) { return { data: this.profileService.addAlbum(userId, body) }; }
  @Delete(':userId/albums/:albumId') deleteAlbum(@Param('userId') userId: string, @Param('albumId') albumId: string) { return { data: this.profileService.deleteAlbum(userId, albumId) }; }
  @Get(':userId/photos') getPhotos(@Param('userId') userId: string) { return { data: this.profileService.getPhotos(userId) }; }
  @Get(':userId/notifications') getNotifications(@Param('userId') userId: string) { return { data: this.profileService.getNotifications(userId) }; }
  @Get(':userId/privacy') getPrivacy(@Param('userId') userId: string) { return { data: this.profileService.getPrivacySettings(userId) }; }
  @Patch(':userId/privacy') updatePrivacy(@Param('userId') userId: string, @Body() body: any) { return { data: this.profileService.updatePrivacySettings(userId, body) }; }
  @Get(':userId') getUser(@Param('userId') userId: string) { return { data: this.profileService.getUser(userId) }; }
  @Patch(':userId') updateProfile(@Param('userId') userId: string, @Body() body: any) { return { data: this.profileService.updateProfile(userId, body) }; }
}
