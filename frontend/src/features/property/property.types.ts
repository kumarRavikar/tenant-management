export interface Property {
  id: string;
  name: string;
  address: string;
  city: string;
  state?: string | null;
  postalCode?: string | null;
  country?: string | null;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    buildings: number;
  };
  buildings?: Array<{
    id: string;
    name: string;
    totalFloors?: number | null;
    floors?: Array<{
      id: string;
      floorNumber: number;
      name?: string | null;
      units?: Array<{
        id: string;
        unitNumber: string;
        unitType?: string | null;
        bedrooms: number;
        bathrooms: number;
        baseRent: number | string;
        status: string;
      }>;
    }>;
  }>;
  assignments?: Array<{
    user: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      role: string;
    };
  }>;
}

export interface CreatePropertyInput {
  name: string;
  address: string;
  city: string;
  state?: string;
  postalCode?: string;
  country?: string;
  description?: string;
}

export interface UpdatePropertyInput {
  name?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  description?: string;
}

export interface PropertyQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  city?: string;
  state?: string;
}

