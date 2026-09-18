import { z } from 'zod';

export const createInvoiceSchema = z
  .object({
    leaseId: z.string({ required_error: 'Lease ID is required' }).uuid('Invalid Lease ID'),
    billingMonth: z
      .string({ required_error: 'Billing month is required' })
      .trim()
      .regex(/^\d{4}-\d{2}$/, 'Billing month must be in YYYY-MM format'),
    dueDate: z.string({ required_error: 'Due date is required' }),
    rentAmount: z.number({ required_error: 'Rent amount is required' }).min(0, 'Rent amount cannot be negative'),
    maintenanceAmount: z.number().min(0, 'Maintenance amount cannot be negative').optional().default(0),
    lateFee: z.number().min(0, 'Late fee cannot be negative').optional().default(0),
    discount: z.number().min(0, 'Discount cannot be negative').optional().default(0),
  })
  .refine(
    (data) => {
      const total = data.rentAmount + (data.maintenanceAmount || 0) + (data.lateFee || 0) - (data.discount || 0);
      return total >= 0;
    },
    {
      message: 'Total invoice amount cannot be negative',
      path: ['discount'],
    }
  );

