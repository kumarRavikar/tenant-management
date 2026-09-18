import { z } from 'zod';

export const createBuildingSchema = z.object({
  propertyId: z.string({ required_error: 'Property ID is required' }).uuid('Invalid Property ID'),
  name: z.string({ required_error: 'Building name is required' }).trim().min(2),
  totalFloors: z.number().int().positive().optional(),
});

export const updateBuildingSchema = z.object({
  name: z.string().trim().min(2).optional(),
  totalFloors: z.number().int().positive().optional(),
});

