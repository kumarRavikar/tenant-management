import http from 'http';
import app from './app';
import { env } from './config/env';
import { connectDatabase, disconnectDatabase } from './config/database';
import { initSocket } from './socket';
import { initJobWorkers } from './jobs/schedulers';
import { logger } from './utils/logger';

const startServer = async (): Promise<void> => {
  // Attempt to connect to PostgreSQL via Prisma
  await connectDatabase();

  // Create HTTP server wrapping Express
  const server = http.createServer(app);

  // Initialize Socket.IO
  initSocket(server);

  // Initialize background BullMQ workers
  initJobWorkers();

  server.listen(env.PORT, () => {
    logger.info(`Server started successfully on port ${env.PORT} in ${env.NODE_ENV} mode.`);
    logger.info(`Health check available at http://localhost:${env.PORT}/api/health`);
    logger.info(`Swagger docs available at http://localhost:${env.PORT}/api/docs`);
  });

  const gracefulShutdown = async (signal: string): Promise<void> => {
    logger.info(`Received ${signal}. Gracefully shutting down server...`);
    server.close(async () => {
      logger.info('HTTP server closed.');
      await disconnectDatabase();
      process.exit(0);
    });

    // Force shutdown after 10 seconds if lingering
    setTimeout(() => {
      logger.error('Could not close connections in time, forcefully shutting down.');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
};

startServer().catch((error) => {
  logger.error('Fatal error during server startup:', error);
  process.exit(1);
});

