import { Controller, Get } from '@nestjs/common';
import { Public } from '../modules/auth/decorators/public.decorator';

@Controller('health')
@Public()
export class HealthController {
  @Get()
  check() {
    return { status: 'ok', timestamp: new Date().toISOString(), uptime: process.uptime() };
  }
}
