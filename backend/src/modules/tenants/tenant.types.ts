import { TenantOnboardingStatus } from '@prisma/client';

export { TenantOnboardingStatus };

export interface DocumentMetadata {
  id: string;
  name: string;
  type: string;
  url?: string;
  uploadedAt: string;
  size?: number;
}

export interface CreateTenantDTO {
  userId: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  dateOfBirth?: string;
  employmentStatus?: string;
  employerName?: string;
  annualIncome?: number;
  documents?: DocumentMetadata[];
  onboardingStatus?: TenantOnboardingStatus;
}

export interface UpdateTenantDTO {
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  dateOfBirth?: string;
  employmentStatus?: string;
  employerName?: string;
  annualIncome?: number;
  documents?: DocumentMetadata[];
  onboardingStatus?: TenantOnboardingStatus;
}

export interface TenantFilterQuery {
  page?: string;
  limit?: string;
  search?: string;
  onboardingStatus?: TenantOnboardingStatus;
}

