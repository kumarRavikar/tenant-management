export type ReportFormat = 'json' | 'csv' | 'pdf';

export interface BaseReportQuery {
  format?: ReportFormat;
  propertyId?: string;
}

export interface OccupancyReportQuery extends BaseReportQuery {}

export interface RentCollectionReportQuery extends BaseReportQuery {
  startDate?: string;
  endDate?: string;
}

export interface PaymentTransactionReportQuery extends BaseReportQuery {
  startDate?: string;
  endDate?: string;
  method?: string;
  status?: string;
}

export interface MaintenanceReportQuery extends BaseReportQuery {
  startDate?: string;
  endDate?: string;
  priority?: string;
  status?: string;
}

export interface LeaseExpirationReportQuery extends BaseReportQuery {
  days?: number | string;
}

export interface ReportOutput {
  title: string;
  headers: string[];
  rows: (string | number)[][];
  summary?: Record<string, unknown>;
  rawData?: unknown[];
}

