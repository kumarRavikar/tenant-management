import { UnitStatus } from '@/types';

export interface Unit {
  id: string;
  floorId: string;
  unitNumber: string;
  unitType?: string | null;
  bedrooms: number;
  bathrooms: number;
  area?: number | null;
  baseRent: number | string;
  maintenanceCharge: number | string;
  status: UnitStatus;
  createdAt: string;
  updatedAt: string;
  floor?: {
    id: string;
    floorNumber: number;
    building?: {
      id: string;
      name: string;
      property?: {
        id: string;
        name: string;
        city: string;
      };
    };
  };
  owners?: Array<{
    id: string;
    ownershipPercentage: number;
    ownerProfile: {
      id: string;
      user: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        phone?: string | null;
      };
    };
  }>;
  leases?: Array<{
    id: string;
    startDate: string;
    endDate: string;
    status: string;
    monthlyRent: number | string;
    tenant: {
      id: string;
      user: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
      };
    };
  }>;
}

export interface CreateUnitInput {
  floorId: string;
  unitNumber: string;
  unitType?: string;
  bedrooms?: number;
  bathrooms?: number;
  area?: number;
  baseRent: number;
  maintenanceCharge?: number;
  status?: UnitStatus;
}

export interface UpdateUnitInput {
  unitNumber?: string;
  unitType?: string;
  bedrooms?: number;
  bathrooms?: number;
  area?: number;
  baseRent?: number;
  maintenanceCharge?: number;
  status?: UnitStatus;
}

export interface UnitQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  propertyId?: string;
  buildingId?: string;
  floorId?: string;
  status?: UnitStatus;
  isAvailable?: boolean;
  minBedrooms?: number;
  maxRent?: number;
}

