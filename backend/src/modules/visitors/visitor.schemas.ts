import { z } from 'zod';
import { VisitorStatus } from '@prisma/client';

export const createVisitorSchema = z.object({
  propertyId: z.string({ required_error: 'Property ID is required' }).uuid('Invalid Property ID'),
  unitId: z.string({ required_error: 'Unit ID is required' }).uuid('Invalid Unit ID'),
  visitorName: z.string({ required_error: 'Visitor name is required' }).trim().min(2, 'Name must be at least 2 characters'),
  phone: z.string({ required_error: 'Phone number is required' }).trim().min(5, 'Invalid phone number'),
  purpose: z.string({ required_error: 'Purpose is required' }).trim().min(2, 'Purpose must be at least 2 characters'),
  visitDate: z.string({ required_error: 'Visit date is required' }),
  isDelivery: z.boolean().optional().default(false),
  deliveryCompany: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

export const updateVisitorSchema = z.object({
  visitorName: z.string().trim().min(2).optional(),
  phone: z.string().trim().min(5).optional(),
  purpose: z.string().trim().min(2).optional(),
  visitDate: z.string().optional(),
  status: z.nativeEnum(VisitorStatus).optional(),
  notes: z.string().trim().optional(),
});

