import { Request, Response, NextFunction } from 'express';
import { FloorService } from './floor.service';
import { sendSuccess } from '../../utils/response';

export class FloorController {
  public static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await FloorService.list(req.user!, req.query);
      sendSuccess(res, 'Floors retrieved successfully', result.floors, 200, result.meta);
    } catch (error) {
      next(error);
    }
  }

  public static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const floor = await FloorService.create(req.user!, req.body);
      sendSuccess(res, 'Floor created successfully', floor, 201);
    } catch (error) {
      next(error);
    }
  }

  public static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const floor = await FloorService.getById(req.user!, id);
      sendSuccess(res, 'Floor details retrieved successfully', floor);
    } catch (error) {
      next(error);
    }
  }

  public static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const floor = await FloorService.update(req.user!, id, req.body);
      sendSuccess(res, 'Floor updated successfully', floor);
    } catch (error) {
      next(error);
    }
  }

  public static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      await FloorService.delete(req.user!, id);
      sendSuccess(res, 'Floor deleted successfully');
    } catch (error) {
      next(error);
    }
  }
}

