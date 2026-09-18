import { z } from 'zod';

export const createOwnerSchema = z.object({
  userId: z.string({ required_error: 'User ID is required' }).uuid('Invalid User ID'),
  taxId: z.string().trim().optional(),
  bankAccountNumber: z.string().trim().optional(),
  bankName: z.string().trim().optional(),
  emergencyContact: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

export const updateOwnerSchema = z.object({
  taxId: z.string().trim().optional(),
  bankAccountNumber: z.string().trim().optional(),
  bankName: z.string().trim().optional(),
  emergencyContact: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

export const assignUnitSchema = z.object({
  unitId: z.string({ required_error: 'Unit ID is required' }).uuid('Invalid Unit ID'),
  ownershipPercentage: z.number().min(1).max(100).optional().default(100),
});

