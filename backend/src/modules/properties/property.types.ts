export interface CreatePropertyDTO {
  name: string;
  address: string;
  city: string;
  state?: string;
  postalCode?: string;
  country?: string;
  description?: string;
}

export interface UpdatePropertyDTO {
  name?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  description?: string;
}

export interface PropertyFilterQuery {
  page?: string;
  limit?: string;
  search?: string;
  city?: string;
  state?: string;
}

