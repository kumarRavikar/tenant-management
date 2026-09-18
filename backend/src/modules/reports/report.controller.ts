import { Request, Response, NextFunction } from 'express';
import { ReportService } from './report.service';
import { sendSuccess } from '../../utils/response';
import { ReportOutput } from './report.types';

export class ReportController {
  private static async sendReportResponse(
    res: Response,
    report: ReportOutput,
    filename: string,
    format?: string
  ): Promise<void> {
    if (format === 'csv') {
      const csv = ReportService.toCSV(report);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
      res.status(200).send(csv);
      return;
    }

    if (format === 'pdf') {
      const pdfBuffer = await ReportService.toPDF(report);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.pdf"`);
      res.status(200).send(pdfBuffer);
      return;
    }

    sendSuccess(res, `${report.title} retrieved successfully`, report);
  }

  public static async getOccupancyReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const report = await ReportService.getOccupancyReport(req.user!, req.query);
      await ReportController.sendReportResponse(
        res,
        report,
        `occupancy_report_${Date.now()}`,
        req.query.format as string
      );
    } catch (error) {
      next(error);
    }
  }

  public static async getRentCollectionReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const report = await ReportService.getRentCollectionReport(req.user!, req.query);
      await ReportController.sendReportResponse(
        res,
        report,
        `rent_collection_${Date.now()}`,
        req.query.format as string
      );
    } catch (error) {
      next(error);
    }
  }

  public static async getPaymentTransactionReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const report = await ReportService.getPaymentTransactionReport(req.user!, req.query);
      await ReportController.sendReportResponse(
        res,
        report,
        `payment_transactions_${Date.now()}`,
        req.query.format as string
      );
    } catch (error) {
      next(error);
    }
  }

  public static async getMaintenanceReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const report = await ReportService.getMaintenanceReport(req.user!, req.query);
      await ReportController.sendReportResponse(
        res,
        report,
        `maintenance_report_${Date.now()}`,
        req.query.format as string
      );
    } catch (error) {
      next(error);
    }
  }

  public static async getLeaseExpirationReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const report = await ReportService.getLeaseExpirationReport(req.user!, req.query);
      await ReportController.sendReportResponse(
        res,
        report,
        `lease_expirations_${Date.now()}`,
        req.query.format as string
      );
    } catch (error) {
      next(error);
    }
  }
}

