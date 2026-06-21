import { Module } from '@nestjs/common';
import { TransportController } from './transport.controller';
import { TransportService } from './transport.service';
@Module({ controllers: [TransportController], providers: [TransportService], exports: [TransportService] })
export class TransportModule {}
