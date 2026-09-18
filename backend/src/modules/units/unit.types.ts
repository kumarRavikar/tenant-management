import { UnitStatus } from '@prisma/client';

export { UnitStatus };

export interface CreateUnitDTO {
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

export interface UpdateUnitDTO {
  unitNumber?: string;
  unitType?: string;
  bedrooms?: number;
  bathrooms?: number;
  area?: number;
  baseRent?: number;
  maintenanceCharge?: number;
  status?: UnitStatus;
}

export interface UnitFilterQuery {
  page?: string;
  limit?: string;
  search?: string;
  floorId?: string;
  buildingId?: string;
  propertyId?: string;
  status?: UnitStatus;
  minBedrooms?: string;
  maxRent?: string;
  isAvailable?: string; // 'true' filters for status=VACANT
}

