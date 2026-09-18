import Redis from 'ioredis';
import { env } from '../config/env';
import { logger } from '../utils/logger';

let redisClient: Redis | null = null;
let isRedisAvailable = false;

export const getRedisClient = (): Redis => {
  if (!redisClient) {
    redisClient = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      retryStrategy(times) {
        if (times > 3) {
          logger.warn('Redis is unavailable. Background queues will run in offline mode.');
          return null; // Stop retrying to prevent crashing or log spam
        }
        return Math.min(times * 200, 1000);
      },
    });

    redisClient.on('connect', () => {
      isRedisAvailable = true;
      logger.info('Connected to Redis successfully.');
    });

    redisClient.on('error', (err) => {
      isRedisAvailable = false;
      logger.debug('Redis connection event:', err.message);
    });
  }

  return redisClient;
};

export const checkRedisAvailable = (): boolean => isRedisAvailable;

