import { InvoiceStatus } from '@prisma/client';
import { PaginationQuery } from '../../utils/pagination';

export interface CreateInvoiceDTO {
  leaseId: string;
  billingMonth: string;
  dueDate: string;
  rentAmount: number;
  maintenanceAmount?: number;
  lateFee?: number;
  discount?: number;
}

export interface InvoiceFilterQuery extends PaginationQuery {
  leaseId?: string;
  status?: InvoiceStatus;
  billingMonth?: string;
  propertyId?: string;
  unitId?: string;
}

