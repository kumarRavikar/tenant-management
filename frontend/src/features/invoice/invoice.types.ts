import { Lease } from '../lease/lease.types';
import { Payment } from '../payment/payment.types';

export type InvoiceStatus = 'PENDING' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE' | 'CANCELLED';

export interface RentInvoice {
  id: string;
  leaseId: string;
  invoiceNumber: string;
  billingMonth: string;
  dueDate: string;
  rentAmount: number;
  maintenanceAmount: number;
  lateFee: number;
  discount: number;
  totalAmount: number;
  paidAmount: number;
  status: InvoiceStatus;
  createdAt: string;
  updatedAt: string;
  lease?: Lease;
  payments?: Payment[];
}

export interface CreateInvoiceInput {
  leaseId: string;
  billingMonth: string;
  dueDate: string;
  rentAmount: number;
  maintenanceAmount?: number;
  lateFee?: number;
  discount?: number;
}

export interface InvoiceQueryParams {
  leaseId?: string;
  status?: InvoiceStatus;
  billingMonth?: string;
  search?: string;
  page?: number;
  limit?: number;
}

