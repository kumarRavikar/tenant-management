import { z } from 'zod';
import { MaintenancePriority, MaintenanceStatus } from '@prisma/client';

export const createMaintenanceTicketSchema = z.object({
  unitId: z.string({ required_error: 'Unit ID is required' }).uuid('Invalid Unit ID'),
  title: z.string({ required_error: 'Title is required' }).trim().min(3, 'Title must be at least 3 characters'),
  description: z.string({ required_error: 'Description is required' }).trim().min(5, 'Description must be at least 5 characters'),
  priority: z.nativeEnum(MaintenancePriority).optional().default(MaintenancePriority.MEDIUM),
  estimatedCompletion: z.string().optional(),
});

export const updateMaintenanceTicketSchema = z.object({
  title: z.string().trim().min(3).optional(),
  description: z.string().trim().min(5).optional(),
  priority: z.nativeEnum(MaintenancePriority).optional(),
  status: z.nativeEnum(MaintenanceStatus).optional(),
  estimatedCompletion: z.string().optional(),
});

export const assignTicketSchema = z.object({
  assignedToId: z.string({ required_error: 'Assignee User ID is required' }).uuid('Invalid User ID'),
});

export const addCommentSchema = z.object({
  comment: z.string({ required_error: 'Comment cannot be empty' }).trim().min(1, 'Comment cannot be empty'),
});

