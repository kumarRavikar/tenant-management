import { Request, Response, NextFunction } from 'express';
import { TenantService } from './tenant.service';
import { sendSuccess } from '../../utils/response';

export class TenantController {
  public static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await TenantService.list(req.user!, req.query);
      sendSuccess(res, 'Tenants retrieved successfully', result.tenants, 200, result.meta);
    } catch (error) {
      next(error);
    }
  }

  public static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenant = await TenantService.create(req.user!, req.body);
      sendSuccess(res, 'Tenant onboarded successfully', tenant, 201);
    } catch (error) {
      next(error);
    }
  }

  public static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const tenant = await TenantService.getById(req.user!, id);
      sendSuccess(res, 'Tenant details retrieved successfully', tenant);
    } catch (error) {
      next(error);
    }
  }

  public static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const tenant = await TenantService.update(req.user!, id, req.body);
      sendSuccess(res, 'Tenant updated successfully', tenant);
    } catch (error) {
      next(error);
    }
  }
}

