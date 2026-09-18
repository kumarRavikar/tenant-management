import apiClient from '@/services/api';
import { ApiResponse, PaginationMeta } from '@/types';
import { Unit, CreateUnitInput, UpdateUnitInput, UnitQueryParams } from './unit.types';

export const unitApi = {
  async getUnits(params?: UnitQueryParams): Promise<{ units: Unit[]; meta?: PaginationMeta }> {
    const res = await apiClient.get<ApiResponse<Unit[]>>('/units', { params });
    return {
      units: res.data.data || [],
      meta: res.data.meta,
    };
  },

  async getUnitById(id: string): Promise<Unit> {
    const res = await apiClient.get<ApiResponse<Unit>>(`/units/${id}`);
    return res.data.data!;
  },

  async createUnit(input: CreateUnitInput): Promise<Unit> {
    const res = await apiClient.post<ApiResponse<Unit>>('/units', input);
    return res.data.data!;
  },

  async updateUnit(id: string, input: UpdateUnitInput): Promise<Unit> {
    const res = await apiClient.patch<ApiResponse<Unit>>(`/units/${id}`, input);
    return res.data.data!;
  },
};

