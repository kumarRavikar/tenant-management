export type NotificationType = 'IN_APP' | 'EMAIL' | 'PUSH';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  readAt?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
}

export interface NotificationFilterParams {
  isRead?: boolean;
  page?: number;
  limit?: number;
}

