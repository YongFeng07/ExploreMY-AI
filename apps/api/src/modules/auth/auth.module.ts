import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { MulterModule } from '@nestjs/platform-express';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy, OptionalJwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard, OptionalJwtGuard } from './guards/jwt-auth.guard';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { existsSync, mkdirSync } from 'fs';

import { ConfigService } from '@nestjs/config';

// Ensure upload directories exist
['./uploads/avatars','./uploads/covers'].forEach(dir => { if (!existsSync(dir)) mkdirSync(dir, { recursive: true }); });

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('jwt.secret') || process.env.JWT_SECRET || 'exploremy-dev-jwt-secret-change-in-production',
        signOptions: {
          expiresIn: config.get<string>('jwt.expiresIn') || process.env.JWT_SECRET_EXPIRES_IN || '15m',
        },
      }),
    }),
    MulterModule.register({
      storage: diskStorage({ destination: './uploads', filename: (_, file, cb) => cb(null, `${Date.now()}${extname(file.originalname)}`) }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, OptionalJwtStrategy, JwtAuthGuard, OptionalJwtGuard],
  exports: [AuthService, JwtAuthGuard, OptionalJwtGuard, JwtModule],
})
export class AuthModule {}
