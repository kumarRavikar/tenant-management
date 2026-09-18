import { Request, Response, NextFunction } from 'express';
import { PropertyService } from './property.service';
import { sendSuccess } from '../../utils/response';

export class PropertyController {
  public static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await PropertyService.list(req.user!, req.query);
      sendSuccess(res, 'Properties retrieved successfully', result.properties, 200, result.meta);
    } catch (error) {
      next(error);
    }
  }

  public static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const property = await PropertyService.create(req.user!, req.body);
      sendSuccess(res, 'Property created successfully', property, 201);
    } catch (error) {
      next(error);
    }
  }

  public static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const property = await PropertyService.getById(req.user!, id);
      sendSuccess(res, 'Property details retrieved successfully', property);
    } catch (error) {
      next(error);
    }
  }

  public static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const property = await PropertyService.update(req.user!, id, req.body);
      sendSuccess(res, 'Property updated successfully', property);
    } catch (error) {
      next(error);
    }
  }

  public static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      await PropertyService.delete(req.user!, id);
      sendSuccess(res, 'Property deleted successfully');
    } catch (error) {
      next(error);
    }
  }
}

