import { Module } from '@nestjs/common';
import { RoutesController } from './routes.controller';
import { RoutesService } from './routes.service';

@Module({ controllers: [RoutesController], providers: [RoutesService], exports: [RoutesService] })
export class RoutesModule {}
