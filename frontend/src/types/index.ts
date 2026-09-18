export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  meta?: PaginationMeta;
  error?: {
    code?: string;
    details?: unknown;
  };
}

export interface HealthCheckData {
  uptime: number;
  timestamp: string;
  database: 'connected' | 'disconnected' | 'unknown';
}

export type HealthResponse = ApiResponse<HealthCheckData>;

export type UserRole =
  | 'SUPER_ADMIN'
  | 'PROPERTY_ADMIN'
  | 'MANAGER'
  | 'OWNER'
  | 'TENANT';

export type UnitStatus =
  | 'VACANT'
  | 'OCCUPIED'
  | 'UNDER_MAINTENANCE'
  | 'RESERVED';

export type LeaseStatus =
  | 'DRAFT'
  | 'ACTIVE'
  | 'EXPIRED'
  | 'TERMINATED';

export type TenantOnboardingStatus =
  | 'PENDING'
  | 'VERIFIED'
  | 'REJECTED';
