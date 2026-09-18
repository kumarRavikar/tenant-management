import { Request, Response, NextFunction } from 'express';
import { OwnerService } from './owner.service';
import { sendSuccess } from '../../utils/response';

export class OwnerController {
  public static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await OwnerService.list(req.user!, req.query);
      sendSuccess(res, 'Owners retrieved successfully', result.owners, 200, result.meta);
    } catch (error) {
      next(error);
    }
  }

  public static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const owner = await OwnerService.create(req.user!, req.body);
      sendSuccess(res, 'Owner profile created successfully', owner, 201);
    } catch (error) {
      next(error);
    }
  }

  public static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const owner = await OwnerService.getById(req.user!, id);
      sendSuccess(res, 'Owner details retrieved successfully', owner);
    } catch (error) {
      next(error);
    }
  }

  public static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const owner = await OwnerService.update(req.user!, id, req.body);
      sendSuccess(res, 'Owner updated successfully', owner);
    } catch (error) {
      next(error);
    }
  }

  public static async assignUnit(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const assignment = await OwnerService.assignUnit(req.user!, id, req.body);
      sendSuccess(res, 'Unit assigned to owner successfully', assignment, 201);
    } catch (error) {
      next(error);
    }
  }

  public static async unassignUnit(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const unitId = req.params.unitId as string;
      await OwnerService.unassignUnit(req.user!, id, unitId);
      sendSuccess(res, 'Unit unassigned from owner successfully');
    } catch (error) {
      next(error);
    }
  }

  public static async getDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const dashboard = await OwnerService.getDashboard(req.user!, id);
      sendSuccess(res, 'Owner dashboard metrics retrieved successfully', dashboard);
    } catch (error) {
      next(error);
    }
  }
}

