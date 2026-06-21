import { Module } from '@nestjs/common';
import { TravelWalletController } from './travel-wallet.controller';
import { TravelWalletService } from './travel-wallet.service';
import { SavingsCoachService } from './services/savings-coach.service';

@Module({
  controllers: [TravelWalletController],
  providers: [TravelWalletService, SavingsCoachService],
  exports: [TravelWalletService, SavingsCoachService],
})
export class TravelWalletModule {}
