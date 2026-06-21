import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    cors: true,
    bodyParser: true,
    rawBody: true,
  });

  // Increase body limit for AI plan saves (16 stops = ~130KB JSON)
  const httpAdapter = app.getHttpAdapter();
  const instance = httpAdapter.getInstance();
  instance.use(require('express').json({ limit: '10mb' }));
  instance.use(require('express').urlencoded({ limit: '10mb', extended: true }));

  app.setGlobalPrefix('api/v1');

  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));

  // Static file serving for uploads
  const uploadsPath = join(process.cwd(), 'uploads');
  if (!existsSync(uploadsPath)) mkdirSync(uploadsPath, { recursive: true });
  app.useStaticAssets(uploadsPath, { prefix: '/uploads/' });

  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  console.log(`NestJS API running on http://localhost:${port}/api/v1`);
}

bootstrap();
