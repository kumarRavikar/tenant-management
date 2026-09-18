import { Request, Response, NextFunction } from 'express';
import { MaintenanceService } from './maintenance.service';
import { sendSuccess } from '../../utils/response';
import { AppError } from '../../middleware/error.middleware';

export class MaintenanceController {
  public static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await MaintenanceService.list(req.user!, req.query);
      sendSuccess(res, 'Maintenance tickets retrieved successfully', result.tickets, 200, result.meta);
    } catch (error) {
      next(error);
    }
  }

  public static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const ticket = await MaintenanceService.create(req.body, req.user!);
      sendSuccess(res, 'Maintenance ticket created successfully', ticket, 201);
    } catch (error) {
      next(error);
    }
  }

  public static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const ticket = await MaintenanceService.getById(id, req.user!);
      sendSuccess(res, 'Maintenance ticket details retrieved successfully', ticket);
    } catch (error) {
      next(error);
    }
  }

  public static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const ticket = await MaintenanceService.update(id, req.body, req.user!);
      sendSuccess(res, 'Maintenance ticket updated successfully', ticket);
    } catch (error) {
      next(error);
    }
  }

  public static async assign(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const ticket = await MaintenanceService.assign(id, req.body, req.user!);
      sendSuccess(res, 'Staff assigned to ticket successfully', ticket);
    } catch (error) {
      next(error);
    }
  }

  public static async addComment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const comment = await MaintenanceService.addComment(id, req.body, req.user!);
      sendSuccess(res, 'Comment added successfully', comment, 201);
    } catch (error) {
      next(error);
    }
  }

  public static async addAttachment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      if (!req.file) {
        throw new AppError('No file provided in attachment request', 400);
      }
      const attachment = await MaintenanceService.addAttachment(id, req.file, req.user!);
      sendSuccess(res, 'Attachment uploaded successfully', attachment, 201);
    } catch (error) {
      next(error);
    }
  }

  public static async getActivity(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const activity = await MaintenanceService.getActivity(id, req.user!);
      sendSuccess(res, 'Ticket activity history retrieved successfully', activity);
    } catch (error) {
      next(error);
    }
  }
}

