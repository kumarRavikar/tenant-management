export interface CreateOwnerDTO {
  userId: string;
  taxId?: string;
  bankAccountNumber?: string;
  bankName?: string;
  emergencyContact?: string;
  notes?: string;
}

export interface UpdateOwnerDTO {
  taxId?: string;
  bankAccountNumber?: string;
  bankName?: string;
  emergencyContact?: string;
  notes?: string;
}

export interface AssignUnitDTO {
  unitId: string;
  ownershipPercentage?: number;
}

export interface OwnerFilterQuery {
  page?: string;
  limit?: string;
  search?: string;
}

