import { useQuery } from '@tanstack/react-query';
import apiClient from '@/services/api';
import { HealthResponse } from '@/types';

const fetchHealth = async (): Promise<HealthResponse> => {
  const response = await apiClient.get<HealthResponse>('/health');
  return response.data;
};

export const useHealth = () => {
  return useQuery<HealthResponse, Error>({
    queryKey: ['backend-health'],
    queryFn: fetchHealth,
    refetchInterval: 15000, // Periodically poll health every 15s
    retry: 1,
  });
};

