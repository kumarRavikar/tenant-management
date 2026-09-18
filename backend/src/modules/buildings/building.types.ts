export interface CreateBuildingDTO {
  propertyId: string;
  name: string;
  totalFloors?: number;
}

export interface UpdateBuildingDTO {
  name?: string;
  totalFloors?: number;
}

export interface BuildingFilterQuery {
  page?: string;
  limit?: string;
  propertyId?: string;
  search?: string;
}

