import apiClient from '@/services/api';
import { ApiResponse } from '@/types';
import { Floor, CreateFloorInput, UpdateFloorInput } from './floor.types';

export const floorApi = {
  async getFloors(buildingId?: string): Promise<Floor[]> {
    const res = await apiClient.get<ApiResponse<Floor[]>>('/floors', {
      params: buildingId ? { buildingId } : undefined,
    });
    return res.data.data || [];
  },

  async getFloorById(id: string): Promise<Floor> {
    const res = await apiClient.get<ApiResponse<Floor>>(`/floors/${id}`);
    return res.data.data!;
  },

  async createFloor(input: CreateFloorInput): Promise<Floor> {
    const res = await apiClient.post<ApiResponse<Floor>>('/floors', input);
    return res.data.data!;
  },

  async updateFloor(id: string, input: UpdateFloorInput): Promise<Floor> {
    const res = await apiClient.patch<ApiResponse<Floor>>(`/floors/${id}`, input);
    return res.data.data!;
  },

  async deleteFloor(id: string): Promise<void> {
    await apiClient.delete<ApiResponse<void>>(`/floors/${id}`);
  },
};

