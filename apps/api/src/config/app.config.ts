import { registerAs } from '@nestjs/config';

export const appConfig = registerAs('app', () => ({
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  globalPrefix: 'api/v1',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  host: process.env.HOST || '0.0.0.0',
  apiInternalKey: process.env.API_INTERNAL_KEY || '',
  logLevel: process.env.LOG_LEVEL || 'debug',
}));

export const jwtConfig = registerAs('jwt', () => ({
  secret: process.env.JWT_SECRET || '',
  expiresIn: process.env.JWT_EXPIRES_IN || '15m',
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
}));

export const googleMapsConfig = registerAs('googleMaps', () => ({
  apiKey: process.env.GOOGLE_MAPS_API_KEY || '',
}));

export const aiConfig = registerAs('ai', () => ({
  openaiKey: process.env.OPENAI_API_KEY || '',
  geminiKey: process.env.GEMINI_API_KEY || '',
  deepseekKey: process.env.DEEPSEEK_API_KEY || '',
  anthropicKey: process.env.ANTHROPIC_API_KEY || '',
  defaultModel: process.env.AI_DEFAULT_MODEL || 'deepseek-chat',
  maxTokens: parseInt(process.env.AI_MAX_TOKENS || '4096', 10),
  temperature: parseFloat(process.env.AI_TEMPERATURE || '0.7'),
}));

export const redisConfig = registerAs('redis', () => ({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  password: process.env.REDIS_PASSWORD || '',
  db: parseInt(process.env.REDIS_DB || '0', 10),
}));

export const supabaseConfig = registerAs('supabase', () => ({
  url: process.env.SUPABASE_URL || '',
  anonKey: process.env.SUPABASE_ANON_KEY || '',
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  storageBucket: process.env.SUPABASE_STORAGE_BUCKET || 'exploremy-media',
}));

export const emailConfig = registerAs('email', () => ({
  resendApiKey: process.env.RESEND_API_KEY || '',
  fromAddress: process.env.EMAIL_FROM || 'noreply@exploremy.ai',
  fromName: process.env.EMAIL_FROM_NAME || 'ExploreMY',
}));
