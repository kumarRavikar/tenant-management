import { Request, Response } from 'express';
import { sendSuccess } from '../../utils/response';
import { prisma } from '../../config/database';

export class HealthController {
  public static async getHealth(_req: Request, res: Response): Promise<void> {
    let dbStatus = 'unknown';
    try {
      // Quick ping to check if database connection is alive
      await prisma.$queryRaw`SELECT 1`;
      dbStatus = 'connected';
    } catch {
      dbStatus = 'disconnected';
    }

    sendSuccess(
      res,
      'API is running',
      {
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        database: dbStatus,
      },
      200
    );
  }
}

