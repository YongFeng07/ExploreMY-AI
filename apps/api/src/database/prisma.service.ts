import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import type { PrismaClient as PrismaClientType } from '@prisma/client';

/**
 * Production-grade Prisma service with lazy initialization.
 *
 * In development without PostgreSQL, the API starts without a database.
 * Services using JSON file storage (auth, admin, travel-wallet) still work.
 * Database-dependent operations will receive clear errors at runtime.
 *
 * To enable database: start Docker and run migrations.
 *   docker compose -f docker/docker-compose.dev.yml up -d
 *   pnpm --filter @exploremy/database db:migrate
 */
@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private _client: PrismaClientType | null = null;
  private _connected = false;

  get isConnected(): boolean {
    return this._connected;
  }

  /**
   * Access the Prisma client. Returns null if not connected.
   * Services should check `prisma.isConnected` before using `prisma.db`.
   */
  get db(): PrismaClientType | null {
    return this._client;
  }

  async onModuleInit(): Promise<void> {
    try {
      // Dynamic import to avoid crashing if @prisma/client is not installed
      const { PrismaClient } = await import('@prisma/client');
      this._client = new PrismaClient({
        log:
          process.env.NODE_ENV === 'development'
            ? ['warn', 'error']
            : ['error'],
      });
      await this._client.$connect();
      this._connected = true;
      this.logger.log('✅ Connected to PostgreSQL via Prisma');
    } catch (error) {
      this._connected = false;
      this._client = null;
      this.logger.warn(
        '⚠️ PostgreSQL not available — running without database persistence',
      );
      this.logger.warn(
        '   Start Docker: docker compose -f docker/docker-compose.dev.yml up -d',
      );
      this.logger.warn(
        '   Run migration: pnpm --filter @exploremy/database db:migrate',
      );
      if (process.env.NODE_ENV !== 'production') {
        this.logger.debug(
          `   Error details: ${(error as Error)?.message || 'unknown'}`,
        );
      }
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this._connected && this._client) {
      await this._client.$disconnect();
      this.logger.log('Disconnected from PostgreSQL');
    }
  }
}
