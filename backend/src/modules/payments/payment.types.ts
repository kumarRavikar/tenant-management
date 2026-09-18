import { PaymentMethod, PaymentStatus } from '@prisma/client';
import { PaginationQuery } from '../../utils/pagination';

export interface RecordPaymentDTO {
  invoiceId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  transactionId?: string;
  paymentDate?: string;
  notes?: string;
}

export interface PaymentFilterQuery extends PaginationQuery {
  invoiceId?: string;
  paymentMethod?: PaymentMethod;
  status?: PaymentStatus;
  propertyId?: string;
}

export interface ReceiptData {
  receiptNumber: string;
  paymentId: string;
  paymentDate: Date;
  amount: number;
  paymentMethod: PaymentMethod;
  transactionId?: string | null;
  notes?: string | null;
  invoice: {
    id: string;
    invoiceNumber: string;
    billingMonth: string;
    totalAmount: number;
    paidAmount: number;
    status: string;
  };
  tenant: {
    name: string;
    email: string;
    phone?: string | null;
  };
  property: {
    name: string;
    address: string;
    unitNumber: string;
  };
}

