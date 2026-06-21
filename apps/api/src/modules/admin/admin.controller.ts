import { Controller, Get, Post, Delete, Body, Param, Query, Req, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AuthService } from '../auth/auth.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly authService: AuthService,
  ) {}

  /** Get all notifications (filtered by user) */
  @Get('notifications')
  getNotifications(@Req() req: any, @Query('userId') userId?: string, @Query('email') email?: string) {
    return { data: this.adminService.getNotifications(userId, email) };
  }

  /** Admin: send notification to all or specific user */
  @Post('notifications')
  @UseGuards(JwtAuthGuard)
  addNotification(@Req() req: any, @Body() body: any) {
    if (!this.adminService.isAdminByRole(req.user?.role) && !this.adminService.isAdmin(req.user?.email)) {
      return { error: 'Admin access required' };
    }
    return { data: this.adminService.addNotification(body) };
  }

  /** Admin: delete notification */
  @Delete('notifications/:id')
  @UseGuards(JwtAuthGuard)
  deleteNotification(@Req() req: any, @Param('id') id: string) {
    if (!this.adminService.isAdminByRole(req.user?.role) && !this.adminService.isAdmin(req.user?.email)) {
      return { error: 'Admin access required' };
    }
    return { data: this.adminService.deleteNotification(id) };
  }

  /** Search users */
  @Get('users')
  @UseGuards(JwtAuthGuard)
  searchUsers(@Query('q') q: string) {
    return { data: this.adminService.searchUsers(q || '') };
  }

  /** Get all users */
  @Get('users/all')
  @UseGuards(JwtAuthGuard)
  getAllUsers() {
    return { data: this.adminService.getAllUsers() };
  }

  /** Admin: delete a user */
  @Delete('users/:userId')
  @UseGuards(JwtAuthGuard)
  deleteUser(@Req() req: any, @Param('userId') userId: string) {
    if (!this.adminService.isAdminByRole(req.user?.role) && !this.adminService.isAdmin(req.user?.email)) {
      return { error: 'Admin access required' };
    }
    return { data: this.authService.adminDeleteUser(userId, req.user.userId) };
  }
}
