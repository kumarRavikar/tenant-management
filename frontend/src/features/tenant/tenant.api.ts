import apiClient from '@/services/api';
import { ApiResponse, PaginationMeta } from '@/types';
import {
  TenantProfile,
  CreateTenantProfileInput,
  UpdateTenantProfileInput,
  TenantQueryParams,
} from './tenant.types';

export const tenantApi = {
  async getTenants(
    params?: TenantQueryParams
  ): Promise<{ tenants: TenantProfile[]; meta?: PaginationMeta }> {
    const res = await apiClient.get<ApiResponse<TenantProfile[]>>('/tenants', { params });
    return {
      tenants: res.data.data || [],
      meta: res.data.meta,
    };
  },

  async getTenantById(id: string): Promise<TenantProfile> {
    const res = await apiClient.get<ApiResponse<TenantProfile>>(`/tenants/${id}`);
    return res.data.data!;
  },

  async createTenant(input: CreateTenantProfileInput): Promise<TenantProfile> {
    const res = await apiClient.post<ApiResponse<TenantProfile>>('/tenants', input);
    return res.data.data!;
  },

  async updateTenant(id: string, input: UpdateTenantProfileInput): Promise<TenantProfile> {
    const res = await apiClient.patch<ApiResponse<TenantProfile>>(`/tenants/${id}`, input);
    return res.data.data!;
  },
};

