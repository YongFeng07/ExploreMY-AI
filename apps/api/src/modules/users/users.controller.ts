import { Controller, Get, Patch, Param, Body, Headers } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(':userId')
  getProfile(@Param('userId') userId: string) {
    return { data: this.usersService.getProfile(userId) };
  }

  @Get(':userId/stats')
  getStats(@Param('userId') userId: string) {
    return { data: this.usersService.getStats(userId) };
  }

  @Patch(':userId')
  updateProfile(@Param('userId') userId: string, @Body() body: any) {
    return { data: this.usersService.updateProfile(userId, body) };
  }
}
