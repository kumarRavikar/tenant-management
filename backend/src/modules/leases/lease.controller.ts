import { Request, Response, NextFunction } from 'express';
import { LeaseService } from './lease.service';
import { sendSuccess } from '../../utils/response';

export class LeaseController {
  public static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await LeaseService.list(req.user!, req.query);
      sendSuccess(res, 'Leases retrieved successfully', result.leases, 200, result.meta);
    } catch (error) {
      next(error);
    }
  }

  public static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const lease = await LeaseService.getById(id, req.user!);
      sendSuccess(res, 'Lease details retrieved successfully', lease);
    } catch (error) {
      next(error);
    }
  }

  public static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const lease = await LeaseService.create(req.body, req.user!);
      sendSuccess(res, 'Lease created successfully', lease, 201);
    } catch (error) {
      next(error);
    }
  }

  public static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const lease = await LeaseService.update(id, req.body, req.user!);
      sendSuccess(res, 'Lease updated successfully', lease);
    } catch (error) {
      next(error);
    }
  }

  public static async terminate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const lease = await LeaseService.terminate(id, req.body, req.user!);
      sendSuccess(res, 'Lease terminated successfully', lease);
    } catch (error) {
      next(error);
    }
  }

  public static async renew(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const lease = await LeaseService.renew(id, req.body, req.user!);
      sendSuccess(res, 'Lease renewed successfully', lease, 201);
    } catch (error) {
      next(error);
    }
  }
}

