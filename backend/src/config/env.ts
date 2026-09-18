import dotenv from 'dotenv';
import path from 'path';

// Load .env file from backend root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export interface AppConfig {
  PORT: number;
  NODE_ENV: 'development' | 'production' | 'test';
  DATABASE_URL: string;
  CLIENT_URL: string;
  JWT_ACCESS_SECRET: string;
  JWT_REFRESH_SECRET: string;
  JWT_ACCESS_EXPIRATION: string;
  JWT_REFRESH_EXPIRATION: string;
  REDIS_URL: string;
}

export const env: AppConfig = {
  PORT: parseInt(process.env.PORT || '5000', 10),
  NODE_ENV: (process.env.NODE_ENV as AppConfig['NODE_ENV']) || 'development',
  DATABASE_URL: process.env.DATABASE_URL || '',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  JWT_ACCESS_SECRET:
    process.env.JWT_ACCESS_SECRET || 'dev_jwt_access_secret_fallback_key_32_characters_minimum!',
  JWT_REFRESH_SECRET:
    process.env.JWT_REFRESH_SECRET || 'dev_jwt_refresh_secret_fallback_key_32_characters_minimum!',
  JWT_ACCESS_EXPIRATION: process.env.JWT_ACCESS_EXPIRATION || '15m',
  JWT_REFRESH_EXPIRATION: process.env.JWT_REFRESH_EXPIRATION || '7d',
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
};
