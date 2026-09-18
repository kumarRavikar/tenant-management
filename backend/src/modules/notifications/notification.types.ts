import { NotificationType } from '@prisma/client';

export interface NotificationFilterQuery {
  page?: number | string;
  limit?: number | string;
  isRead?: boolean | string;
}

export interface CreateNotificationDTO {
  userId: string;
  title: string;
  message: string;
  type?: NotificationType;
  metadata?: Record<string, unknown>;
}

