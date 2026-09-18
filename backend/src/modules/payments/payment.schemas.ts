import { z } from 'zod';
import { PaymentMethod } from '@prisma/client';

export const recordPaymentSchema = z.object({
  invoiceId: z.string({ required_error: 'Invoice ID is required' }).uuid('Invalid Invoice ID'),
  amount: z.number({ required_error: 'Amount is required' }).positive('Payment amount must be greater than 0'),
  paymentMethod: z.nativeEnum(PaymentMethod, { required_error: 'Valid payment method is required' }),
  transactionId: z.string().trim().optional(),
  paymentDate: z.string().optional(),
  notes: z.string().trim().optional(),
});

