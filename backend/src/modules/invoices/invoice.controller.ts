import { Request, Response, NextFunction } from 'express';
import { InvoiceService } from './invoice.service';
import { sendSuccess } from '../../utils/response';

export class InvoiceController {
  public static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await InvoiceService.list(req.user!, req.query);
      sendSuccess(res, 'Invoices retrieved successfully', result.invoices, 200, result.meta);
    } catch (error) {
      next(error);
    }
  }

  public static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const invoice = await InvoiceService.getById(id, req.user!);
      sendSuccess(res, 'Invoice details retrieved successfully', invoice);
    } catch (error) {
      next(error);
    }
  }

  public static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const invoice = await InvoiceService.create(req.body, req.user!);
      sendSuccess(res, 'Invoice created successfully', invoice, 201);
    } catch (error) {
      next(error);
    }
  }
}

