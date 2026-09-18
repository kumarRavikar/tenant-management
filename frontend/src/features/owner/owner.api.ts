import apiClient from '@/services/api';
import { ApiResponse, PaginationMeta } from '@/types';
import {
  OwnerProfile,
  CreateOwnerProfileInput,
  AssignUnitInput,
  OwnerQueryParams,
} from './owner.types';

export const ownerApi = {
  async getOwners(
    params?: OwnerQueryParams
  ): Promise<{ owners: OwnerProfile[]; meta?: PaginationMeta }> {
    const res = await apiClient.get<ApiResponse<OwnerProfile[]>>('/owners', { params });
    return {
      owners: res.data.data || [],
      meta: res.data.meta,
    };
  },

  async getOwnerById(id: string): Promise<OwnerProfile> {
    const res = await apiClient.get<ApiResponse<OwnerProfile>>(`/owners/${id}`);
    return res.data.data!;
  },

  async createOwner(input: CreateOwnerProfileInput): Promise<OwnerProfile> {
    const res = await apiClient.post<ApiResponse<OwnerProfile>>('/owners', input);
    return res.data.data!;
  },

  async assignUnit(ownerId: string, input: AssignUnitInput): Promise<unknown> {
    const res = await apiClient.post<ApiResponse<unknown>>(`/owners/${ownerId}/units`, input);
    return res.data.data!;
  },
};

