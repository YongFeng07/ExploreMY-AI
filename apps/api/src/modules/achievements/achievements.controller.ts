import { Controller, Get, Req, Query } from '@nestjs/common';
import { AchievementsService } from './achievements.service';
import { AuthService } from '../auth/auth.service';
import { Public } from '../auth/decorators/public.decorator';

@Controller('achievements')
@Public()
export class AchievementsController {
  constructor(
    private readonly achievementsService: AchievementsService,
    private readonly authService: AuthService,
  ) {}

  /**
   * Get achievements for a user. Works with or without auth.
   * If userId query param is provided, use it. Otherwise try JWT.
   */
  @Get()
  getForUser(@Req() req: any, @Query('userId') queryUserId?: string) {
    const uid = queryUserId || req.user?.userId;
    const user = uid ? this.authService.getUserById(uid) : null;
    const stats = this.achievementsService.getStats(user);
    return { data: stats };
  }

  /**
   * Get all achievement definitions (goals that can be earned).
   */
  @Get('all')
  getAll() {
    return { data: this.achievementsService.getAllAvailable() };
  }
}
