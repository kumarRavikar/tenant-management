import apiClient from '@/services/api';
import { ApiResponse, PaginationMeta } from '@/types';
import {
  Payment,
  RecordPaymentInput,
  PaymentReceipt,
  PaymentQueryParams,
} from './payment.types';

export const paymentApi = {
  async getPayments(
    params?: PaymentQueryParams
  ): Promise<{ payments: Payment[]; meta?: PaginationMeta }> {
    const res = await apiClient.get<ApiResponse<Payment[]>>('/payments', { params });
    return {
      payments: res.data.data || [],
      meta: res.data.meta,
    };
  },

  async getPaymentById(id: string): Promise<Payment> {
    const res = await apiClient.get<ApiResponse<Payment>>(`/payments/${id}`);
    return res.data.data!;
  },

  async recordPayment(input: RecordPaymentInput): Promise<Payment> {
    const res = await apiClient.post<ApiResponse<Payment>>('/payments', input);
    return res.data.data!;
  },

  async getReceipt(id: string): Promise<PaymentReceipt> {
    const res = await apiClient.get<ApiResponse<PaymentReceipt>>(`/payments/${id}/receipt`);
    return res.data.data!;
  },
};

