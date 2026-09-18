export type ReportType =
  | 'occupancy'
  | 'rent-collection'
  | 'payments'
  | 'maintenance'
  | 'lease-expiration';

export interface ReportOutput {
  title: string;
  headers: string[];
  rows: (string | number)[][];
  summary?: Record<string, unknown>;
  rawData?: unknown[];
}

export interface ReportQueryParams {
  format?: 'json' | 'csv' | 'pdf';
  propertyId?: string;
  startDate?: string;
  endDate?: string;
  method?: string;
  status?: string;
  priority?: string;
  days?: number | string;
}

