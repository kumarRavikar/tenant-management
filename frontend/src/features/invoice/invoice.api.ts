import apiClient from '@/services/api';
import { ApiResponse, PaginationMeta } from '@/types';
import { RentInvoice, CreateInvoiceInput, InvoiceQueryParams } from './invoice.types';
import { Payment } from '../payment/payment.types';

export const invoiceApi = {
  async getInvoices(
    params?: InvoiceQueryParams
  ): Promise<{ invoices: RentInvoice[]; meta?: PaginationMeta }> {
    const res = await apiClient.get<ApiResponse<RentInvoice[]>>('/invoices', { params });
    return {
      invoices: res.data.data || [],
      meta: res.data.meta,
    };
  },

  async getInvoiceById(id: string): Promise<RentInvoice> {
    const res = await apiClient.get<ApiResponse<RentInvoice>>(`/invoices/${id}`);
    return res.data.data!;
  },

  async createInvoice(input: CreateInvoiceInput): Promise<RentInvoice> {
    const res = await apiClient.post<ApiResponse<RentInvoice>>('/invoices', input);
    return res.data.data!;
  },

  async getInvoicePayments(id: string): Promise<Payment[]> {
    const res = await apiClient.get<ApiResponse<Payment[]>>(`/invoices/${id}/payments`);
    return res.data.data || [];
  },
};

