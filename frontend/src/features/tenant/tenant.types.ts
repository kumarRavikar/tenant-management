import { TenantOnboardingStatus } from '@/types';

export interface DocumentMetadata {
  id: string;
  name: string;
  type: string;
  url: string;
  uploadedAt: string;
}

export interface TenantProfile {
  id: string;
  userId: string;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  dateOfBirth?: string | null;
  employmentStatus?: string | null;
  employerName?: string | null;
  annualIncome?: number | string | null;
  documents?: DocumentMetadata[] | null;
  onboardingStatus: TenantOnboardingStatus;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string | null;
  };
  leases?: Array<{
    id: string;
    startDate: string;
    endDate: string;
    monthlyRent: number | string;
    status: string;
    unit?: {
      id: string;
      unitNumber: string;
      floor?: {
        floorNumber: number;
        building?: {
          name: string;
          property?: {
            id: string;
            name: string;
          };
        };
      };
    };
  }>;
}

export interface CreateTenantProfileInput {
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

export interface UpdateTenantProfileInput {
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  dateOfBirth?: string;
  employmentStatus?: string;
  employerName?: string;
  annualIncome?: number;
  documents?: DocumentMetadata[];
  onboardingStatus?: TenantOnboardingStatus;
}

export interface TenantQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  onboardingStatus?: TenantOnboardingStatus;
}

