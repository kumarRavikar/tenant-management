import { Request, Response, NextFunction } from 'express';
import { PaymentService } from './payment.service';
import { sendSuccess } from '../../utils/response';

export class PaymentController {
  public static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await PaymentService.list(req.user!, req.query);
      sendSuccess(res, 'Payments retrieved successfully', result.payments, 200, result.meta);
    } catch (error) {
      next(error);
    }
  }

  public static async recordPayment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const payment = await PaymentService.recordPayment(req.body, req.user!);
      sendSuccess(res, 'Payment recorded successfully', payment, 201);
    } catch (error) {
      next(error);
    }
  }

  public static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const payment = await PaymentService.getById(id, req.user!);
      sendSuccess(res, 'Payment details retrieved successfully', payment);
    } catch (error) {
      next(error);
    }
  }

  public static async getPaymentsByInvoiceId(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const payments = await PaymentService.getPaymentsByInvoiceId(id, req.user!);
      sendSuccess(res, 'Invoice payments retrieved successfully', payments);
    } catch (error) {
      next(error);
    }
  }

  public static async getReceipt(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const receipt = await PaymentService.getReceipt(id, req.user!);
      sendSuccess(res, 'Payment receipt generated successfully', receipt);
    } catch (error) {
      next(error);
    }
  }
}

