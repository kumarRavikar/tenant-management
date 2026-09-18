import apiClient from '@/services/api';
import { ApiResponse } from '@/types';
import { Building, CreateBuildingInput, UpdateBuildingInput } from './building.types';

export const buildingApi = {
  async getBuildings(propertyId?: string): Promise<Building[]> {
    const res = await apiClient.get<ApiResponse<Building[]>>('/buildings', {
      params: propertyId ? { propertyId } : undefined,
    });
    return res.data.data || [];
  },

  async getBuildingById(id: string): Promise<Building> {
    const res = await apiClient.get<ApiResponse<Building>>(`/buildings/${id}`);
    return res.data.data!;
  },

  async createBuilding(input: CreateBuildingInput): Promise<Building> {
    const res = await apiClient.post<ApiResponse<Building>>('/buildings', input);
    return res.data.data!;
  },

  async updateBuilding(id: string, input: UpdateBuildingInput): Promise<Building> {
    const res = await apiClient.patch<ApiResponse<Building>>(`/buildings/${id}`, input);
    return res.data.data!;
  },

  async deleteBuilding(id: string): Promise<void> {
    await apiClient.delete<ApiResponse<void>>(`/buildings/${id}`);
  },
};

