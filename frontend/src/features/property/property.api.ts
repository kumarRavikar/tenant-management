import apiClient from '@/services/api';
import { ApiResponse, PaginationMeta } from '@/types';
import {
  Property,
  CreatePropertyInput,
  UpdatePropertyInput,
  PropertyQueryParams,
} from './property.types';

export const propertyApi = {
  async getProperties(
    params?: PropertyQueryParams
  ): Promise<{ properties: Property[]; meta?: PaginationMeta }> {
    const res = await apiClient.get<ApiResponse<Property[]>>('/properties', { params });
    return {
      properties: res.data.data || [],
      meta: res.data.meta,
    };
  },

  async getPropertyById(id: string): Promise<Property> {
    const res = await apiClient.get<ApiResponse<Property>>(`/properties/${id}`);
    return res.data.data!;
  },

  async createProperty(input: CreatePropertyInput): Promise<Property> {
    const res = await apiClient.post<ApiResponse<Property>>('/properties', input);
    return res.data.data!;
  },

  async updateProperty(id: string, input: UpdatePropertyInput): Promise<Property> {
    const res = await apiClient.patch<ApiResponse<Property>>(`/properties/${id}`, input);
    return res.data.data!;
  },

  async deleteProperty(id: string): Promise<void> {
    await apiClient.delete<ApiResponse<void>>(`/properties/${id}`);
  },
};

