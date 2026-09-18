import apiClient from '@/services/api';
import { ApiResponse, PaginationMeta } from '@/types';
import { Visitor, CreateVisitorInput, VisitorFilterParams } from './types';

export const visitorApi = {
  async list(params?: VisitorFilterParams): Promise<{ visitors: Visitor[]; meta: PaginationMeta }> {
    const res = await apiClient.get<ApiResponse<Visitor[]>>('/visitors', { params });
    return {
      visitors: res.data.data || [],
      meta: res.data.meta!,
    };
  },

  async create(input: CreateVisitorInput): Promise<Visitor> {
    const res = await apiClient.post<ApiResponse<Visitor>>('/visitors', input);
    return res.data.data!;
  },

  async getById(id: string): Promise<Visitor> {
    const res = await apiClient.get<ApiResponse<Visitor>>(`/visitors/${id}`);
    return res.data.data!;
  },

  async checkIn(id: string): Promise<Visitor> {
    const res = await apiClient.post<ApiResponse<Visitor>>(`/visitors/${id}/check-in`);
    return res.data.data!;
  },

  async checkOut(id: string): Promise<Visitor> {
    const res = await apiClient.post<ApiResponse<Visitor>>(`/visitors/${id}/check-out`);
    return res.data.data!;
  },
};

