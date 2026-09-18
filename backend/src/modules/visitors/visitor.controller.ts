import { Request, Response, NextFunction } from 'express';
import { VisitorService } from './visitor.service';
import { sendSuccess } from '../../utils/response';

export class VisitorController {
  public static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await VisitorService.list(req.user!, req.query);
      sendSuccess(res, 'Visitors retrieved successfully', result.visitors, 200, result.meta);
    } catch (error) {
      next(error);
    }
  }

  public static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const visitor = await VisitorService.create(req.user!, req.body);
      sendSuccess(res, 'Visitor pre-approved successfully', visitor, 201);
    } catch (error) {
      next(error);
    }
  }

  public static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const visitor = await VisitorService.getById(id, req.user!);
      sendSuccess(res, 'Visitor details retrieved successfully', visitor);
    } catch (error) {
      next(error);
    }
  }

  public static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const visitor = await VisitorService.update(id, req.user!, req.body);
      sendSuccess(res, 'Visitor updated successfully', visitor);
    } catch (error) {
      next(error);
    }
  }

  public static async checkIn(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const visitor = await VisitorService.checkIn(id, req.user!);
      sendSuccess(res, 'Visitor checked in successfully', visitor);
    } catch (error) {
      next(error);
    }
  }

  public static async checkOut(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const visitor = await VisitorService.checkOut(id, req.user!);
      sendSuccess(res, 'Visitor checked out successfully', visitor);
    } catch (error) {
      next(error);
    }
  }
}

