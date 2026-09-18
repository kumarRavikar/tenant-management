import { z } from 'zod';
import { TenantOnboardingStatus } from '@prisma/client';

export const documentMetadataSchema = z.object({
  id: z.string().default(() => Math.random().toString(36).substring(2, 9)),
  name: z.string().trim().min(1),
  type: z.string().trim().min(1),
  url: z.string().optional(),
  uploadedAt: z.string().default(() => new Date().toISOString()),
  size: z.number().optional(),
});

export const createTenantSchema = z.object({
  userId: z.string({ required_error: 'User ID is required' }).uuid('Invalid User ID'),
  emergencyContactName: z.string().trim().optional(),
  emergencyContactPhone: z.string().trim().optional(),
  dateOfBirth: z.string().optional(),
  employmentStatus: z.string().trim().optional(),
  employerName: z.string().trim().optional(),
  annualIncome: z.number().nonnegative().optional(),
  documents: z.array(documentMetadataSchema).optional().default([]),
  onboardingStatus: z.nativeEnum(TenantOnboardingStatus).optional().default(TenantOnboardingStatus.PENDING),
});

export const updateTenantSchema = z.object({
  emergencyContactName: z.string().trim().optional(),
  emergencyContactPhone: z.string().trim().optional(),
  dateOfBirth: z.string().optional(),
  employmentStatus: z.string().trim().optional(),
  employerName: z.string().trim().optional(),
  annualIncome: z.number().nonnegative().optional(),
  documents: z.array(documentMetadataSchema).optional(),
  onboardingStatus: z.nativeEnum(TenantOnboardingStatus).optional(),
});

