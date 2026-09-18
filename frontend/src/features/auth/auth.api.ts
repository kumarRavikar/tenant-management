import apiClient from '@/services/api';
import { ApiResponse } from '@/types';
import {
  User,
  RegisterInput,
  LoginInput,
  ChangePasswordInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  SessionItem,
} from './auth.types';

export const authApi = {
  async register(input: RegisterInput): Promise<User> {
    const res = await apiClient.post<ApiResponse<{ user: User }>>('/auth/register', input);
    return res.data.data!.user;
  },

  async login(input: LoginInput): Promise<User> {
    const res = await apiClient.post<ApiResponse<{ user: User; accessToken: string }>>(
      '/auth/login',
      input
    );
    if (res.data.data?.accessToken) {
      localStorage.setItem('accessToken', res.data.data.accessToken);
    }
    return res.data.data!.user;
  },

  async logout(): Promise<void> {
    localStorage.removeItem('accessToken');
    await apiClient.post<ApiResponse<void>>('/auth/logout');
  },

  async getCurrentUser(): Promise<User> {
    const res = await apiClient.get<ApiResponse<{ user: User }>>('/auth/me');
    return res.data.data!.user;
  },

  async refresh(): Promise<User> {
    const res = await apiClient.post<ApiResponse<{ user: User; accessToken: string }>>(
      '/auth/refresh'
    );
    if (res.data.data?.accessToken) {
      localStorage.setItem('accessToken', res.data.data.accessToken);
    }
    return res.data.data!.user;
  },

  async changePassword(input: ChangePasswordInput): Promise<string> {
    const res = await apiClient.post<ApiResponse<void>>('/auth/change-password', input);
    return res.data.message;
  },

  async forgotPassword(input: ForgotPasswordInput): Promise<{ message: string; resetToken?: string }> {
    const res = await apiClient.post<ApiResponse<{ message: string; resetToken?: string }>>(
      '/auth/forgot-password',
      input
    );
    return res.data.data || { message: res.data.message };
  },

  async resetPassword(input: ResetPasswordInput): Promise<string> {
    const res = await apiClient.post<ApiResponse<void>>('/auth/reset-password', input);
    return res.data.message;
  },

  async getSessions(): Promise<SessionItem[]> {
    const res = await apiClient.get<ApiResponse<{ sessions: SessionItem[] }>>('/auth/sessions');
    return res.data.data!.sessions;
  },

  async revokeSession(sessionId: string): Promise<void> {
    await apiClient.delete<ApiResponse<void>>(`/auth/sessions/${sessionId}`);
  },
};

