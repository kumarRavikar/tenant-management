import { LeaseStatus } from '@/types';

export interface Lease {
  id: string;
  unitId: string;
  tenantProfileId: string;
  startDate: string;
  endDate: string;
  monthlyRent: number | string;
  securityDeposit: number | string;
  status: LeaseStatus;
  moveInDate?: string | null;
  moveOutDate?: string | null;
  terms?: string | null;
  createdAt: string;
  updatedAt: string;
  unit?: {
    id: string;
    unitNumber: string;
    unitType?: string | null;
    status: string;
    floor?: {
      id: string;
      floorNumber: number;
      building?: {
        id: string;
        name: string;
        property?: {
          id: string;
          name: string;
          city?: string | null;
        };
      };
    };
  };
  tenant?: {
    id: string;
    onboardingStatus: string;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      phone?: string | null;
    };
  };
}

export interface CreateLeaseInput {
  unitId: string;
  tenantProfileId: string;
  startDate: string;
  endDate: string;
  monthlyRent: number;
  securityDeposit: number;
  status?: LeaseStatus;
  moveInDate?: string;
  terms?: string;
}

export interface UpdateLeaseInput {
  startDate?: string;
  endDate?: string;
  monthlyRent?: number;
  securityDeposit?: number;
  status?: LeaseStatus;
  moveInDate?: string;
  moveOutDate?: string;
  terms?: string;
}

export interface TerminateLeaseInput {
  moveOutDate?: string;
  terms?: string;
}

export interface RenewLeaseInput {
  startDate: string;
  endDate: string;
  monthlyRent: number;
  securityDeposit?: number;
  terms?: string;
}

export interface LeaseQueryParams {
  page?: number;
  limit?: number;
  propertyId?: string;
  unitId?: string;
  tenantProfileId?: string;
  status?: LeaseStatus;
  startDate?: string;
  endDate?: string;
}

