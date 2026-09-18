import { UserRole } from '@/types';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  role: UserRole;
  isActive: boolean;
  assignedProperties?: {
    propertyId: string;
    propertyName?: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role?: UserRole;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

export interface ForgotPasswordInput {
  email: string;
}

export interface ResetPasswordInput {
  token: string;
  newPassword: string;
}

export interface SessionItem {
  id: string;
  userAgent: string | null;
  ipAddress: string | null;
  isCurrent: boolean;
  createdAt: string;
  expiresAt: string;
}

