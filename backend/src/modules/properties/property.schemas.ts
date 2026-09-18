import { z } from 'zod';

export const createPropertySchema = z.object({
  name: z.string({ required_error: 'Property name is required' }).trim().min(2),
  address: z.string({ required_error: 'Address is required' }).trim().min(3),
  city: z.string({ required_error: 'City is required' }).trim().min(2),
  state: z.string().trim().optional(),
  postalCode: z.string().trim().optional(),
  country: z.string().trim().optional().default('USA'),
  description: z.string().trim().optional(),
});

export const updatePropertySchema = z.object({
  name: z.string().trim().min(2).optional(),
  address: z.string().trim().min(3).optional(),
  city: z.string().trim().min(2).optional(),
  state: z.string().trim().optional(),
  postalCode: z.string().trim().optional(),
  country: z.string().trim().optional(),
  description: z.string().trim().optional(),
});

