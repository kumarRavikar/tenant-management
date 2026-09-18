import { z } from 'zod';
import { LeaseStatus } from '@prisma/client';

export const createLeaseSchema = z
  .object({
    unitId: z.string({ required_error: 'Unit ID is required' }).uuid('Invalid Unit ID'),
    tenantProfileId: z.string({ required_error: 'Tenant Profile ID is required' }).uuid('Invalid Tenant Profile ID'),
    startDate: z.string({ required_error: 'Start date is required' }),
    endDate: z.string({ required_error: 'End date is required' }),
    monthlyRent: z.number({ required_error: 'Monthly rent is required' }).positive('Monthly rent must be positive'),
    securityDeposit: z.number({ required_error: 'Security deposit is required' }).min(0, 'Security deposit cannot be negative'),
    status: z.nativeEnum(LeaseStatus).optional().default(LeaseStatus.DRAFT),
    moveInDate: z.string().optional(),
    terms: z.string().optional(),
  })
  .refine((data) => new Date(data.endDate) > new Date(data.startDate), {
    message: 'End date must be after start date',
    path: ['endDate'],
  });

export const updateLeaseSchema = z
  .object({
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    monthlyRent: z.number().positive('Monthly rent must be positive').optional(),
    securityDeposit: z.number().min(0, 'Security deposit cannot be negative').optional(),
    status: z.nativeEnum(LeaseStatus).optional(),
    moveInDate: z.string().optional(),
    moveOutDate: z.string().optional(),
    terms: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return new Date(data.endDate) > new Date(data.startDate);
      }
      return true;
    },
    {
      message: 'End date must be after start date',
      path: ['endDate'],
    }
  );

export const terminateLeaseSchema = z.object({
  moveOutDate: z.string().optional(),
  terms: z.string().optional(),
});

export const renewLeaseSchema = z
  .object({
    startDate: z.string({ required_error: 'Renewal start date is required' }),
    endDate: z.string({ required_error: 'Renewal end date is required' }),
    monthlyRent: z.number({ required_error: 'Monthly rent is required' }).positive('Monthly rent must be positive'),
    securityDeposit: z.number().min(0, 'Security deposit cannot be negative').optional(),
    terms: z.string().optional(),
  })
  .refine((data) => new Date(data.endDate) > new Date(data.startDate), {
    message: 'End date must be after start date',
    path: ['endDate'],
  });

