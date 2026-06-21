import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './database/prisma.module';
import { PlacesModule } from './modules/places/places.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { FavoritesModule } from './modules/favorites/favorites.module';
import { TripsModule } from './modules/trips/trips.module';
import { DatingPlannerModule } from './modules/dating-planner/dating-planner.module';
import { TravelWalletModule } from './modules/travel-wallet/travel-wallet.module';
import { ProfileModule } from './modules/profile/profile.module';
import { AuthModule } from './modules/auth/auth.module';
import { AdminModule } from './modules/admin/admin.module';
import { AiModule } from './modules/ai/ai.module';
import { RoutesModule } from './modules/routes/routes.module';
import { WeekendPlannerModule } from './modules/weekend-planner/weekend-planner.module';
import { UsersModule } from './modules/users/users.module';
import { SearchModule } from './modules/search/search.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { SocialModule } from './modules/social/social.module';
import { AchievementsModule } from './modules/achievements/achievements.module';
import { EventsModule } from './modules/events/events.module';
import { PhotosModule } from './modules/photos/photos.module';
import { TransportModule } from './modules/transport/transport.module';
import { HealthModule } from './health/health.module';
import { appConfig, googleMapsConfig, aiConfig } from './config/app.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, googleMapsConfig, aiConfig],
    }),
    PrismaModule,
    HealthModule,
    PlacesModule,
    ReviewsModule,
    FavoritesModule,
    TripsModule,
    AiModule,
    RoutesModule,
    WeekendPlannerModule,
    UsersModule,
    SearchModule,
    NotificationsModule,
    SocialModule,
    AchievementsModule,
    EventsModule,
    PhotosModule,
    TransportModule,
    AuthModule,
    AdminModule,
    DatingPlannerModule,
    TravelWalletModule,
    ProfileModule,
  ],
})
export class AppModule {}
