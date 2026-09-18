import apiClient from '@/services/api';
import { ApiResponse, PaginationMeta } from '@/types';
import {
  Lease,
  CreateLeaseInput,
  UpdateLeaseInput,
  TerminateLeaseInput,
  RenewLeaseInput,
  LeaseQueryParams,
} from './lease.types';

export const leaseApi = {
  async getLeases(
    params?: LeaseQueryParams
  ): Promise<{ leases: Lease[]; meta?: PaginationMeta }> {
    const res = await apiClient.get<ApiResponse<Lease[]>>('/leases', { params });
    return {
      leases: res.data.data || [],
      meta: res.data.meta,
    };
  },

  async getLeaseById(id: string): Promise<Lease> {
    const res = await apiClient.get<ApiResponse<Lease>>(`/leases/${id}`);
    return res.data.data!;
  },

  async createLease(input: CreateLeaseInput): Promise<Lease> {
    const res = await apiClient.post<ApiResponse<Lease>>('/leases', input);
    return res.data.data!;
  },

  async updateLease(id: string, input: UpdateLeaseInput): Promise<Lease> {
    const res = await apiClient.patch<ApiResponse<Lease>>(`/leases/${id}`, input);
    return res.data.data!;
  },

  async terminateLease(id: string, input: TerminateLeaseInput): Promise<Lease> {
    const res = await apiClient.post<ApiResponse<Lease>>(`/leases/${id}/terminate`, input);
    return res.data.data!;
  },

  async renewLease(id: string, input: RenewLeaseInput): Promise<Lease> {
    const res = await apiClient.post<ApiResponse<Lease>>(`/leases/${id}/renew`, input);
    return res.data.data!;
  },
};

