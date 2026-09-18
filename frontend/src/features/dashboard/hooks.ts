import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from './api';
import { DashboardData } from './types';

export const DASHBOARD_STATS_QUERY_KEY = ['dashboard', 'stats'];

export const useDashboardStats = () => {
  return useQuery<DashboardData, Error>({
    queryKey: DASHBOARD_STATS_QUERY_KEY,
    queryFn: () => dashboardApi.getStats(),
  });
};

