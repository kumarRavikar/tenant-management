import { Request, Response, NextFunction } from 'express';
import { BuildingService } from './building.service';
import { sendSuccess } from '../../utils/response';

export class BuildingController {
  public static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await BuildingService.list(req.user!, req.query);
      sendSuccess(res, 'Buildings retrieved successfully', result.buildings, 200, result.meta);
    } catch (error) {
      next(error);
    }
  }

  public static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const building = await BuildingService.create(req.user!, req.body);
      sendSuccess(res, 'Building created successfully', building, 201);
    } catch (error) {
      next(error);
    }
  }

  public static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const building = await BuildingService.getById(req.user!, id);
      sendSuccess(res, 'Building details retrieved successfully', building);
    } catch (error) {
      next(error);
    }
  }

  public static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const building = await BuildingService.update(req.user!, id, req.body);
      sendSuccess(res, 'Building updated successfully', building);
    } catch (error) {
      next(error);
    }
  }

  public static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      await BuildingService.delete(req.user!, id);
      sendSuccess(res, 'Building deleted successfully');
    } catch (error) {
      next(error);
    }
  }
}

