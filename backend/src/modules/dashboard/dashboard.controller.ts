import { Request, Response, NextFunction } from 'express';
import { DashboardService } from './dashboard.service';
import { sendSuccess } from '../../utils/response';

export class DashboardController {
  public static async getStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await DashboardService.getStats(req.user!);
      sendSuccess(res, 'Dashboard statistics retrieved successfully', stats);
    } catch (error) {
      next(error);
    }
  }
}

