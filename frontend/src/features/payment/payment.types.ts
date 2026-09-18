export type PaymentMethod =
  | 'ONLINE'
  | 'CASH'
  | 'BANK_TRANSFER'
  | 'UPI'
  | 'CARD'
  | 'OTHER';

export type PaymentStatus = 'SUCCESS' | 'PENDING' | 'FAILED' | 'REFUNDED';

export interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentDate: string;
  transactionReference?: string | null;
  receiptNumber: string;
  notes?: string | null;
  status: PaymentStatus;
  createdAt: string;
  updatedAt: string;
  invoice?: {
    id: string;
    invoiceNumber: string;
    billingMonth: string;
    totalAmount: number;
    paidAmount: number;
    status: string;
    lease?: {
      id: string;
      leaseNumber: string;
      tenant?: {
        id: string;
        user: {
          id: string;
          firstName: string;
          lastName: string;
          email: string;
        };
      };
      unit?: {
        id: string;
        unitNumber: string;
        floor?: {
          building?: {
            name: string;
            property?: {
              name: string;
            };
          };
        };
      };
    };
  };
}

export interface RecordPaymentInput {
  invoiceId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentDate?: string;
  transactionReference?: string;
  notes?: string;
}

export interface PaymentReceipt {
  receiptNumber: string;
  paymentDate: string;
  amount: number;
  paymentMethod: PaymentMethod;
  transactionReference?: string | null;
  invoice: {
    id: string;
    invoiceNumber: string;
    billingMonth: string;
    totalAmount: number;
    paidAmount: number;
    status: string;
    dueDate: string;
  };
  tenant: {
    name: string;
    email: string;
  };
  property: {
    name: string;
    unitNumber: string;
    buildingName: string;
  };
  issuedAt: string;
}

export interface PaymentQueryParams {
  invoiceId?: string;
  paymentMethod?: PaymentMethod;
  status?: PaymentStatus;
  search?: string;
  page?: number;
  limit?: number;
}

