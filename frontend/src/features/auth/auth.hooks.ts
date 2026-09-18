import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from './auth.api';
import {
  User,
  LoginInput,
  RegisterInput,
  ChangePasswordInput,
  ForgotPasswordInput,
  ResetPasswordInput,
} from './auth.types';

export const AUTH_USER_QUERY_KEY = ['auth', 'currentUser'];
export const SESSIONS_QUERY_KEY = ['auth', 'sessions'];

/**
 * Hook to retrieve and cache current authenticated user.
 * Uses HTTP-only cookies managed automatically by the browser.
 */
export const useCurrentUser = () => {
  return useQuery<User | null, Error>({
    queryKey: AUTH_USER_QUERY_KEY,
    queryFn: async () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      if (!token) {
        return null;
      }

      try {
        return await authApi.getCurrentUser();
      } catch {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('accessToken');
        }
        return null;
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: false,
  });
};

export const useLogin = () => {
  const queryClient = useQueryClient();

  return useMutation<User, Error, LoginInput>({
    mutationFn: (credentials) => authApi.login(credentials),
    onSuccess: (user) => {
      queryClient.setQueryData(AUTH_USER_QUERY_KEY, user);
      queryClient.invalidateQueries({ queryKey: AUTH_USER_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: SESSIONS_QUERY_KEY });
    },
  });
};

export const useRegister = () => {
  return useMutation<User, Error, RegisterInput>({
    mutationFn: (data) => authApi.register(data),
  });
};

export const useLogout = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error>({
    mutationFn: () => authApi.logout(),
    onSuccess: () => {
      queryClient.setQueryData(AUTH_USER_QUERY_KEY, null);
      queryClient.removeQueries({ queryKey: AUTH_USER_QUERY_KEY });
      queryClient.removeQueries({ queryKey: SESSIONS_QUERY_KEY });
    },
  });
};

export const useChangePassword = () => {
  const queryClient = useQueryClient();

  return useMutation<string, Error, ChangePasswordInput>({
    mutationFn: (data) => authApi.changePassword(data),
    onSuccess: () => {
      queryClient.setQueryData(AUTH_USER_QUERY_KEY, null);
      queryClient.invalidateQueries({ queryKey: AUTH_USER_QUERY_KEY });
    },
  });
};

export const useForgotPassword = () => {
  return useMutation<{ message: string; resetToken?: string }, Error, ForgotPasswordInput>({
    mutationFn: (data) => authApi.forgotPassword(data),
  });
};

export const useResetPassword = () => {
  return useMutation<string, Error, ResetPasswordInput>({
    mutationFn: (data) => authApi.resetPassword(data),
  });
};

export const useSessions = () => {
  return useQuery({
    queryKey: SESSIONS_QUERY_KEY,
    queryFn: () => authApi.getSessions(),
  });
};

export const useRevokeSession = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (sessionId) => authApi.revokeSession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SESSIONS_QUERY_KEY });
    },
  });
};

