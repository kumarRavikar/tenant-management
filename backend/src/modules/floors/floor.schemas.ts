import { z } from 'zod';

export const createFloorSchema = z.object({
  buildingId: z.string({ required_error: 'Building ID is required' }).uuid('Invalid Building ID'),
  floorNumber: z.number({ required_error: 'Floor number is required' }).int(),
  name: z.string().trim().optional(),
});

export const updateFloorSchema = z.object({
  floorNumber: z.number().int().optional(),
  name: z.string().trim().optional(),
});

