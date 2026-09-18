import { Request, Response, NextFunction } from 'express';
import { NotificationService } from './notification.service';
import { sendSuccess } from '../../utils/response';

export class NotificationController {
  public static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await NotificationService.list(req.user!.id, req.query);
      sendSuccess(res, 'Notifications retrieved successfully', {
        notifications: result.notifications,
        unreadCount: result.unreadCount,
      }, 200, result.meta);
    } catch (error) {
      next(error);
    }
  }

  public static async markAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const notification = await NotificationService.markAsRead(id, req.user!.id);
      sendSuccess(res, 'Notification marked as read', notification);
    } catch (error) {
      next(error);
    }
  }

  public static async markAllAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await NotificationService.markAllAsRead(req.user!.id);
      sendSuccess(res, 'All notifications marked as read', result);
    } catch (error) {
      next(error);
    }
  }
}

