import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { ApiResponse } from '@/types';
const rawApiUrl = import.meta.env.VITE_API_URL || 'https://tenant-management-2.onrender.com';
const API_URL = rawApiUrl.endsWith('/api') ? rawApiUrl : `${rawApiUrl.replace(/\/$/, '')}/api`;

/**
 * Centralized Axios instance for the entire application.
 * All HTTP requests must go through this single client.
 */
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Request Interceptor: inject Bearer auth token if present
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken');
      if (token && config.headers && !config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: centralized error extraction & token cleanup
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: AxiosError<ApiResponse>) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
    }

    // Extract standardized message from API error response or fallback to Axios error message
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      'An unexpected network error occurred';

    return Promise.reject(new Error(errorMessage));
  }
);

export default apiClient;

