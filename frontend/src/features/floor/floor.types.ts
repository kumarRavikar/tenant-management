export interface Floor {
  id: string;
  buildingId: string;
  floorNumber: number;
  name?: string | null;
  createdAt: string;
  updatedAt: string;
  building?: {
    id: string;
    name: string;
    property?: {
      id: string;
      name: string;
    };
  };
  units?: Array<{
    id: string;
    unitNumber: string;
    unitType?: string | null;
    bedrooms: number;
    bathrooms: number;
    baseRent: number | string;
    status: string;
  }>;
  _count?: {
    units: number;
  };
}

export interface CreateFloorInput {
  buildingId: string;
  floorNumber: number;
  name?: string;
}

export interface UpdateFloorInput {
  floorNumber?: number;
  name?: string;
}

