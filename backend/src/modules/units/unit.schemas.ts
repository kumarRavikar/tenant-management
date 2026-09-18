import { z } from 'zod';
import { UnitStatus } from '@prisma/client';

export const createUnitSchema = z.object({
  floorId: z.string({ required_error: 'Floor ID is required' }).uuid('Invalid Floor ID'),
  unitNumber: z.string({ required_error: 'Unit number is required' }).trim().min(1),
  unitType: z.string().trim().optional(),
  bedrooms: z.number().int().min(0).optional().default(1),
  bathrooms: z.number().min(0).optional().default(1),
  area: z.number().positive().optional(),
  baseRent: z.number({ required_error: 'Base rent is required' }).positive(),
  maintenanceCharge: z.number().min(0).optional().default(0),
  status: z.nativeEnum(UnitStatus).optional().default(UnitStatus.VACANT),
});

export const updateUnitSchema = z.object({
  unitNumber: z.string().trim().min(1).optional(),
  unitType: z.string().trim().optional(),
  bedrooms: z.number().int().min(0).optional(),
  bathrooms: z.number().min(0).optional(),
  area: z.number().positive().optional(),
  baseRent: z.number().positive().optional(),
  maintenanceCharge: z.number().min(0).optional(),
  status: z.nativeEnum(UnitStatus).optional(),
});

