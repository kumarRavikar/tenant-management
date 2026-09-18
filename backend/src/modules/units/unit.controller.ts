import { Request, Response, NextFunction } from 'express';
import { UnitService } from './unit.service';
import { sendSuccess } from '../../utils/response';

export class UnitController {
  public static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await UnitService.list(req.user!, req.query);
      sendSuccess(res, 'Units retrieved successfully', result.units, 200, result.meta);
    } catch (error) {
      next(error);
    }
  }

  public static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const unit = await UnitService.create(req.user!, req.body);
      sendSuccess(res, 'Unit created successfully', unit, 201);
    } catch (error) {
      next(error);
    }
  }

  public static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const unit = await UnitService.getById(req.user!, id);
      sendSuccess(res, 'Unit details retrieved successfully', unit);
    } catch (error) {
      next(error);
    }
  }

  public static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const unit = await UnitService.update(req.user!, id, req.body);
      sendSuccess(res, 'Unit updated successfully', unit);
    } catch (error) {
      next(error);
    }
  }
}

