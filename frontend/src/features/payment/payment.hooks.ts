import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { paymentApi } from './payment.api';
import { RecordPaymentInput, PaymentQueryParams } from './payment.types';
import { invoiceKeys } from '../invoice/invoice.hooks';

export const paymentKeys = {
  all: ['payments'] as const,
  lists: () => [...paymentKeys.all, 'list'] as const,
  list: (params?: PaymentQueryParams) => [...paymentKeys.lists(), params] as const,
  details: () => [...paymentKeys.all, 'detail'] as const,
  detail: (id: string) => [...paymentKeys.details(), id] as const,
  receipt: (id: string) => [...paymentKeys.detail(id), 'receipt'] as const,
};

export const usePayments = (params?: PaymentQueryParams) => {
  return useQuery({
    queryKey: paymentKeys.list(params),
    queryFn: () => paymentApi.getPayments(params),
  });
};

export const usePayment = (id?: string) => {
  return useQuery({
    queryKey: paymentKeys.detail(id!),
    queryFn: () => paymentApi.getPaymentById(id!),
    enabled: Boolean(id),
  });
};

export const useRecordPayment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: RecordPaymentInput) => paymentApi.recordPayment(input),
    onSuccess: (newPayment) => {
      queryClient.invalidateQueries({ queryKey: paymentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
      if (newPayment.invoiceId) {
        queryClient.invalidateQueries({ queryKey: invoiceKeys.detail(newPayment.invoiceId) });
        queryClient.invalidateQueries({ queryKey: invoiceKeys.payments(newPayment.invoiceId) });
      }
    },
  });
};

export const usePaymentReceipt = (id?: string) => {
  return useQuery({
    queryKey: paymentKeys.receipt(id!),
    queryFn: () => paymentApi.getReceipt(id!),
    enabled: Boolean(id),
  });
};

