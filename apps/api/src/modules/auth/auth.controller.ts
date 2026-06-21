import {
  Controller, Post, Get, Patch, Query, Delete, Body, Req, Param,
  UseInterceptors, UploadedFile, UsePipes, ValidationPipe, HttpCode, HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from './decorators/public.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import {
  RegisterDto, LoginDto, ChangePasswordDto, ForgotPasswordDto,
  ResetPasswordDto, VerifyEmailDto, ResendVerificationDto,
} from './dto/auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /** Helper: get userId from JWT, body, or query */
  private uid(req: any): string {
    return (req as any)?.user?.userId || (req as any)?.body?.userId || (req as any)?.query?.userId || '';
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // AUTHENTICATION
  // ═══════════════════════════════════════════════════════════════════════════

  @Public()
  @Post('register')
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  register(@Body() body: RegisterDto) { return this.authService.register(body); }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  login(@Body() body: LoginDto) { return this.authService.login(body); }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(@Body() body: { refreshToken: string }) { return this.authService.refreshToken(body.refreshToken); }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(@Body() body: { refreshToken: string }) { return this.authService.logout(body.refreshToken); }

  // ═══════════════════════════════════════════════════════════════════════════
  // EMAIL VERIFICATION
  // ═══════════════════════════════════════════════════════════════════════════

  @Public()
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  verifyEmail(@Body() body: VerifyEmailDto) { return this.authService.verifyEmail(body.token); }

  @Public()
  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  resendVerification(@Body() body: ResendVerificationDto) { return this.authService.resendVerification(body.email); }

  // ═══════════════════════════════════════════════════════════════════════════
  // PASSWORD RESET
  // ═══════════════════════════════════════════════════════════════════════════

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  forgotPassword(@Body() body: ForgotPasswordDto) { return this.authService.forgotPassword(body.email); }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  resetPassword(@Body() body: ResetPasswordDto) { return this.authService.resetPassword(body.token, body.newPassword); }

  // ═══════════════════════════════════════════════════════════════════════════
  // PROFILE
  // ═══════════════════════════════════════════════════════════════════════════

  @Get('me')
  async getProfile(@Req() req: any) {
    return { data: await this.authService.getProfile(this.uid(req)) };
  }

  @Patch('me')
  updateProfile(@Req() req: any, @Body() body: any) {
    return { data: this.authService.updateProfile(this.uid(req), body) };
  }

  @Patch('me/password')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  changePassword(@Req() req: any, @Body() body: ChangePasswordDto) {
    return this.authService.changePassword(this.uid(req), body);
  }

  @Delete('me')
  @HttpCode(HttpStatus.OK)
  deleteAccount(@Req() req: any, @Body() body: any) {
    return this.authService.deleteAccount(this.uid(req));
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SESSIONS
  // ═══════════════════════════════════════════════════════════════════════════

  @Get('me/sessions')
  getSessions(@Req() req: any) {
    return { data: this.authService.getAllSessions(this.uid(req)) };
  }

  @Delete('me/sessions/:tokenPrefix')
  revokeSession(@Req() req: any, @Param('tokenPrefix') tokenPrefix: string) {
    return this.authService.revokeSession(this.uid(req), tokenPrefix);
  }

  @Delete('me/sessions')
  revokeAllSessions(@Req() req: any) {
    return this.authService.revokeAllSessions(this.uid(req));
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // FILE UPLOADS — userId from body (FormData), query, or JWT
  // ═══════════════════════════════════════════════════════════════════════════

  @Post('me/avatar')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads/avatars',
      filename: (_, file, cb) => cb(null, `${Date.now()}${extname(file.originalname)}`),
    }),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (_, file, cb) => {
      const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      cb(allowed.includes(file.mimetype) ? null : new Error('Only JPEG, PNG, WebP, GIF'), allowed.includes(file.mimetype));
    },
  }))
  async uploadAvatar(@Req() req: any, @UploadedFile() file: Express.Multer.File) {
    if (!file) return { error: 'No file uploaded' };
    const url = `/uploads/avatars/${file.filename}`;
    return { data: await this.authService.updateProfile(this.uid(req), { avatarUrl: url }) };
  }

  @Post('me/cover')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads/covers',
      filename: (_, file, cb) => cb(null, `${Date.now()}${extname(file.originalname)}`),
    }),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (_, file, cb) => {
      const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      cb(allowed.includes(file.mimetype) ? null : new Error('Only JPEG, PNG, WebP, GIF'), allowed.includes(file.mimetype));
    },
  }))
  async uploadCover(@Req() req: any, @UploadedFile() file: Express.Multer.File) {
    if (!file) return { error: 'No file uploaded' };
    const url = `/uploads/covers/${file.filename}`;
    return { data: await this.authService.updateProfile(this.uid(req), { coverUrl: url }) };
  }

  @Post('me/photos/upload')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads/photos',
      filename: (_, file, cb) => cb(null, `${Date.now()}${extname(file.originalname)}`),
    }),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (_, file, cb) => {
      const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      cb(allowed.includes(file.mimetype) ? null : new Error('Only JPEG, PNG, WebP, GIF'), allowed.includes(file.mimetype));
    },
  }))
  async uploadPhoto(@Req() req: any, @UploadedFile() file: Express.Multer.File, @Body() body: any) {
    if (!file) return { error: 'No file uploaded' };
    const url = `/uploads/photos/${file.filename}`;
    const caption = body?.caption || '';
    const place = body?.place || '';
    return { data: await this.authService.addMyPhoto(this.uid(req), { url, caption, place }) };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // COUPLE
  // ═══════════════════════════════════════════════════════════════════════════

  @Post('me/couple/link')
  linkCouple(@Req() req: any, @Body() body: { partnerEmail: string; userId?: string }) {
    return { data: this.authService.linkCouple(this.uid(req), body.partnerEmail) };
  }

  @Post('me/couple/unlink')
  unlinkCouple(@Req() req: any, @Body() body?: { userId?: string }) {
    return { data: this.authService.unlinkCouple(this.uid(req)) };
  }

  @Get('me/couple')
  getCouplePartner(@Req() req: any) {
    return { data: this.authService.getCouplePartner(this.uid(req)) };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PRIVACY
  // ═══════════════════════════════════════════════════════════════════════════

  @Get('me/privacy')
  getPrivacy(@Req() req: any) {
    return { data: this.authService.getPrivacySettings(this.uid(req)) };
  }

  @Patch('me/privacy')
  updatePrivacy(@Req() req: any, @Body() body: any) {
    return { data: this.authService.updatePrivacySettings(this.uid(req), body) };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // TRAVEL HISTORY
  // ═══════════════════════════════════════════════════════════════════════════

  @Get('me/travel-history')
  getTravelHistory(@Req() req: any) {
    return { data: this.authService.getTravelHistory(this.uid(req)) };
  }

  @Post('me/travel-history')
  addTravelHistory(@Req() req: any, @Body() body: any) {
    return { data: this.authService.addTravelHistory(this.uid(req), body) };
  }

  @Delete('me/travel-history/:entryId')
  removeTravelHistory(@Req() req: any, @Param('entryId') entryId: string) {
    return { data: this.authService.removeTravelHistory(this.uid(req), entryId) };
  }

  @Get('me/visited-cities')
  getMyVisitedCities(@Req() req: any) {
    return { data: this.authService.getVisitedCitiesForUser(this.uid(req)) };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // JOURNALS
  // ═══════════════════════════════════════════════════════════════════════════

  @Get('me/journals')
  getJournals(@Req() req: any) {
    return { data: this.authService.getJournals(this.uid(req)) };
  }

  @Post('me/journals')
  addJournal(@Req() req: any, @Body() b: any) {
    return { data: this.authService.addJournal(this.uid(req), b) };
  }

  @Patch('me/journals/:id')
  updateJournal(@Req() req: any, @Param('id') id: string, @Body() b: any) {
    return { data: this.authService.updateJournal(this.uid(req), id, b) };
  }

  @Delete('me/journals/:id')
  deleteJournal(@Req() req: any, @Param('id') id: string) {
    return { data: this.authService.deleteJournal(this.uid(req), id) };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ALBUMS
  // ═══════════════════════════════════════════════════════════════════════════

  @Get('me/albums')
  getAlbums(@Req() req: any) {
    return { data: this.authService.getAlbums(this.uid(req)) };
  }

  @Post('me/albums')
  addAlbum(@Req() req: any, @Body() b: any) {
    return { data: this.authService.addAlbum(this.uid(req), b) };
  }

  @Delete('me/albums/:id')
  deleteAlbum(@Req() req: any, @Param('id') id: string) {
    return { data: this.authService.deleteAlbum(this.uid(req), id) };
  }

  @Post('me/albums/:id/photos')
  addPhotoToAlbum(@Req() req: any, @Param('id') id: string, @Body() b: { photoUrl: string; userId?: string }) {
    return { data: this.authService.addPhotoToAlbum(this.uid(req), id, b.photoUrl) };
  }

  @Delete('me/albums/:id/photos/:photoIndex')
  removePhotoFromAlbum(@Req() req: any, @Param('id') id: string, @Param('photoIndex') photoIndex: string) {
    return { data: this.authService.removePhotoFromAlbum(this.uid(req), id, parseInt(photoIndex)) };
  }

  @Patch('me/albums/:id/cover')
  setAlbumCover(@Req() req: any, @Param('id') id: string, @Body() b: { photoUrl: string; userId?: string }) {
    return { data: this.authService.setAlbumCover(this.uid(req), id, b.photoUrl) };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PHOTOS
  // ═══════════════════════════════════════════════════════════════════════════

  @Get('me/photos')
  getMyPhotos(@Req() req: any) {
    return { data: this.authService.getMyPhotos(this.uid(req)) };
  }

  @Post('me/photos')
  addMyPhoto(@Req() req: any, @Body() b: any) {
    return { data: this.authService.addMyPhoto(this.uid(req), b) };
  }

  @Delete('me/photos/:id')
  deleteMyPhoto(@Req() req: any, @Param('id') id: string) {
    return { data: this.authService.deleteMyPhoto(this.uid(req), id) };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // WISHLIST
  // ═══════════════════════════════════════════════════════════════════════════

  @Get('me/wishlist')
  getWishlist(@Req() req: any) {
    return { data: this.authService.getWishlist(this.uid(req)) };
  }

  @Post('me/wishlist')
  addWishlist(@Req() req: any, @Body() b: any) {
    return { data: this.authService.addWishlist(this.uid(req), b) };
  }

  @Delete('me/wishlist/:id')
  deleteWishlist(@Req() req: any, @Param('id') id: string) {
    return { data: this.authService.deleteWishlist(this.uid(req), id) };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // REVIEWS
  // ═══════════════════════════════════════════════════════════════════════════

  @Get('me/stats')
  getMyStats(@Req() req: any) {
    const u = this.authService.getUserById(this.uid(req));
    return { data: u ? {
      trips: (u.travelHistory || []).length,
      cities: (u.visitedCities || []).length,
      photos: (u.myPhotos || []).length,
      reviews: (u.reviews || []).length,
    } : null };
  }

  @Get('me/reviews')
  getMyReviews(@Req() req: any) {
    return { data: this.authService.getReviews(this.uid(req)) };
  }

  @Post('me/reviews')
  addMyReview(@Req() req: any, @Body() b: any) {
    return { data: this.authService.addReview(this.uid(req), b) };
  }

  @Delete('me/reviews/:reviewId')
  deleteMyReview(@Req() req: any, @Param('reviewId') rid: string) {
    return { data: this.authService.deleteReview(this.uid(req), rid) };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // FAVORITES
  // ═══════════════════════════════════════════════════════════════════════════

  @Get('me/favorites')
  getUserFavorites(@Req() req: any) {
    return { data: this.authService.getUserFavorites(this.uid(req)) };
  }

  @Post('me/favorites')
  addUserFavorite(@Req() req: any, @Body() b: any) {
    return { data: this.authService.addUserFavorite(this.uid(req), b) };
  }

  @Delete('me/favorites/:favId')
  removeUserFavorite(@Req() req: any, @Param('favId') fid: string) {
    return { data: this.authService.removeUserFavorite(this.uid(req), fid) };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // FOLLOWS
  // ═══════════════════════════════════════════════════════════════════════════

  @Post('follow/:targetId')
  follow(@Req() req: any, @Param('targetId') tid: string, @Body() body?: { userId?: string }) {
    return { data: this.authService.followUser(this.uid(req), tid) };
  }

  @Delete('follow/:targetId')
  unfollow(@Req() req: any, @Param('targetId') tid: string, @Body() body?: { userId?: string }) {
    return { data: this.authService.unfollowUser(this.uid(req), tid) };
  }

  @Get('user/:userId/followers')
  getFollowers(@Param('userId') uid: string) { return { data: this.authService.getFollowers(uid) }; }

  @Get('user/:userId/following')
  getFollowing(@Param('userId') uid: string) { return { data: this.authService.getFollowing(uid) }; }

  @Get('user/:userId/profile')
  getPublicProfile(@Param('userId') uid: string) { return { data: this.authService.getPublicProfile(uid) }; }

  // ═══════════════════════════════════════════════════════════════════════════
  // NOTIFICATIONS
  // ═══════════════════════════════════════════════════════════════════════════

  @Get('me/notifications')
  getMyNotifications(@Req() req: any) {
    return { data: this.authService.getUserNotifications(this.uid(req)) };
  }

  @Patch('me/notifications/:id/read')
  markNotificationRead(@Req() req: any, @Param('id') id: string) {
    return { data: this.authService.markNotificationRead(this.uid(req), id) };
  }

  // SOCIAL FEED
  @Get('social/feed')
  getSocialFeed(@Query('page') page?: string) {
    return { data: this.authService.getGlobalSocialFeed(parseInt(page || '0'), 30) };
  }

  @Post('social/feed/:id/like')
  likeActivity(@Req() req: any, @Param('id') id: string, @Body() body?: { userId?: string }) {
    return { data: this.authService.likeActivity(id, this.uid(req)) };
  }

  // ACHIEVEMENTS
  @Get('me/real-achievements')
  getRealAchievements(@Req() req: any) {
    return { data: this.authService.getRealAchievements(this.uid(req)) };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // COUPLE SHARED
  // ═══════════════════════════════════════════════════════════════════════════

  @Get('me/couple/journals')
  getCoupleJournals(@Req() req: any) {
    return { data: this.authService.getCoupleJournals(this.uid(req)) };
  }

  @Get('me/couple/gallery')
  getCoupleGallery(@Req() req: any) {
    return { data: this.authService.getCoupleGallery(this.uid(req)) };
  }

  @Get('me/couple/timeline')
  getCoupleTimeline(@Req() req: any) {
    return { data: this.authService.getCoupleTimeline(this.uid(req)) };
  }

  @Get('me/couple/compatibility')
  getCoupleCompatibility(@Req() req: any) {
    return { data: this.authService.getCoupleCompatibility(this.uid(req)) };
  }

  @Get('me/couple/anniversary')
  getCoupleAnniversary(@Req() req: any) {
    return { data: this.authService.getCoupleAnniversary(this.uid(req)) };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SAVED TRIPS
  // ═══════════════════════════════════════════════════════════════════════════

  @Get('me/trips')
  getSavedTrips(@Req() req: any) {
    return { data: this.authService.getSavedTrips(this.uid(req)) };
  }

  @Post('me/trips')
  saveTrip(@Req() req: any, @Body() b: any) {
    return { data: this.authService.saveTrip(this.uid(req), b) };
  }

  @Patch('me/trips/:id/complete')
  markTripCompleted(@Req() req: any, @Param('id') id: string, @Body() b: { completed: boolean; userId?: string }) {
    return { data: this.authService.markTripCompleted(this.uid(req), id, b.completed) };
  }

  @Delete('me/trips/:id')
  deleteTrip(@Req() req: any, @Param('id') id: string) {
    return { data: this.authService.deleteTrip(this.uid(req), id) };
  }
}
