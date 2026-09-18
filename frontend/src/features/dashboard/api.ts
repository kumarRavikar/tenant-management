import apiClient from '@/services/api';
import { ApiResponse } from '@/types';
import { DashboardData } from './types';

export const dashboardApi = {
  async getStats(): Promise<DashboardData> {
    const res = await apiClient.get<ApiResponse<DashboardData>>('/dashboard/stats');
    return res.data.data!;
  },
};

