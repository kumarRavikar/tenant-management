import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationApi } from './api';
import { NotificationFilterParams, Notification } from './types';

export const NOTIFICATIONS_QUERY_KEY = ['notifications'];

export const useNotifications = (
  params?: NotificationFilterParams,
  options?: { enabled?: boolean }
) => {
  const hasToken = typeof window !== 'undefined' ? !!localStorage.getItem('accessToken') : false;
  const isEnabled = options?.enabled !== undefined ? options.enabled : hasToken;

  return useQuery({
    queryKey: [...NOTIFICATIONS_QUERY_KEY, params],
    queryFn: () => notificationApi.list(params),
    enabled: isEnabled,
    refetchInterval: isEnabled ? 30000 : false,
    retry: (failureCount, error: any) => {
      if (error?.message?.includes('401') || error?.message?.includes('Authentication required')) {
        return false;
      }
      return failureCount < 2;
    },
  });
};

export const useMarkNotificationAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation<Notification, Error, string>({
    mutationFn: (id) => notificationApi.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
    },
  });
};

export const useMarkAllNotificationsAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation<{ count: number }, Error>({
    mutationFn: () => notificationApi.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
    },
  });
};

