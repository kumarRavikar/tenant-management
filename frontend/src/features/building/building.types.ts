export interface Building {
  id: string;
  propertyId: string;
  name: string;
  totalFloors?: number | null;
  createdAt: string;
  updatedAt: string;
  property?: {
    id: string;
    name: string;
    city: string;
  };
  floors?: Array<{
    id: string;
    floorNumber: number;
    name?: string | null;
    _count?: {
      units: number;
    };
  }>;
  _count?: {
    floors: number;
  };
}

export interface CreateBuildingInput {
  propertyId: string;
  name: string;
  totalFloors?: number;
}

export interface UpdateBuildingInput {
  name?: string;
  totalFloors?: number;
}

