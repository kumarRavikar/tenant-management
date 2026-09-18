export interface CreateFloorDTO {
  buildingId: string;
  floorNumber: number;
  name?: string;
}

export interface UpdateFloorDTO {
  floorNumber?: number;
  name?: string;
}

export interface FloorFilterQuery {
  page?: string;
  limit?: string;
  buildingId?: string;
}

