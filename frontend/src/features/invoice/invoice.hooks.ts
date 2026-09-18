import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { invoiceApi } from './invoice.api';
import { CreateInvoiceInput, InvoiceQueryParams } from './invoice.types';

export const invoiceKeys = {
  all: ['invoices'] as const,
  lists: () => [...invoiceKeys.all, 'list'] as const,
  list: (params?: InvoiceQueryParams) => [...invoiceKeys.lists(), params] as const,
  details: () => [...invoiceKeys.all, 'detail'] as const,
  detail: (id: string) => [...invoiceKeys.details(), id] as const,
  payments: (id: string) => [...invoiceKeys.detail(id), 'payments'] as const,
};

export const useInvoices = (params?: InvoiceQueryParams) => {
  return useQuery({
    queryKey: invoiceKeys.list(params),
    queryFn: () => invoiceApi.getInvoices(params),
  });
};

export const useInvoice = (id?: string) => {
  return useQuery({
    queryKey: invoiceKeys.detail(id!),
    queryFn: () => invoiceApi.getInvoiceById(id!),
    enabled: Boolean(id),
  });
};

export const useCreateInvoice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateInvoiceInput) => invoiceApi.createInvoice(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
    },
  });
};

export const useInvoicePayments = (invoiceId?: string) => {
  return useQuery({
    queryKey: invoiceKeys.payments(invoiceId!),
    queryFn: () => invoiceApi.getInvoicePayments(invoiceId!),
    enabled: Boolean(invoiceId),
  });
};
