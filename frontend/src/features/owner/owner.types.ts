export interface OwnerProfile {
  id: string;
  userId: string;
  taxId?: string | null;
  bankAccountNumber?: string | null;
  bankName?: string | null;
  emergencyContact?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string | null;
  };
  ownedUnits?: Array<{
    id: string;
    unitId: string;
    ownershipPercentage: number;
    acquiredDate: string;
    unit: {
      id: string;
      unitNumber: string;
      status: string;
      baseRent: number | string;
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
  _count?: {
    ownedUnits: number;
  };
}

export interface CreateOwnerProfileInput {
  userId: string;
  taxId?: string;
  bankAccountNumber?: string;
  bankName?: string;
  emergencyContact?: string;
  notes?: string;
}

export interface AssignUnitInput {
  unitId: string;
  ownershipPercentage?: number;
}

export interface OwnerQueryParams {
  page?: number;
  limit?: number;
  search?: string;
}

