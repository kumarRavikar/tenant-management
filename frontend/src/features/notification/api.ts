import apiClient from '@/services/api';
import { ApiResponse, PaginationMeta } from '@/types';
import { Notification, NotificationFilterParams } from './types';

export const notificationApi = {
  async list(
    params?: NotificationFilterParams
  ): Promise<{ notifications: Notification[]; unreadCount: number; meta: PaginationMeta }> {
    const res = await apiClient.get<ApiResponse<{ notifications: Notification[]; unreadCount: number }>>(
      '/notifications',
      { params }
    );
    const data = res.data.data;
    return {
      notifications: data?.notifications || [],
      unreadCount: data?.unreadCount || 0,
      meta: res.data.meta!,
    };
  },

  async markAsRead(id: string): Promise<Notification> {
    const res = await apiClient.patch<ApiResponse<Notification>>(`/notifications/${id}/read`);
    return res.data.data!;
  },

  async markAllAsRead(): Promise<{ count: number }> {
    const res = await apiClient.patch<ApiResponse<{ count: number }>>('/notifications/read-all');
    return res.data.data!;
  },
};
