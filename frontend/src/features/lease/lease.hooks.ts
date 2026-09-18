import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leaseApi } from './lease.api';
import {
  CreateLeaseInput,
  UpdateLeaseInput,
  TerminateLeaseInput,
  RenewLeaseInput,
  LeaseQueryParams,
} from './lease.types';
import { unitKeys } from '../unit/unit.hooks';
import { propertyKeys } from '../property/property.hooks';

export const leaseKeys = {
  all: ['leases'] as const,
  lists: () => [...leaseKeys.all, 'list'] as const,
  list: (params?: LeaseQueryParams) => [...leaseKeys.lists(), params] as const,
  details: () => [...leaseKeys.all, 'detail'] as const,
  detail: (id: string) => [...leaseKeys.details(), id] as const,
};

export const useLeases = (params?: LeaseQueryParams) => {
  return useQuery({
    queryKey: leaseKeys.list(params),
    queryFn: () => leaseApi.getLeases(params),
  });
};

export const useLease = (id?: string) => {
  return useQuery({
    queryKey: leaseKeys.detail(id!),
    queryFn: () => leaseApi.getLeaseById(id!),
    enabled: Boolean(id),
  });
};

export const useCreateLease = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateLeaseInput) => leaseApi.createLease(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leaseKeys.lists() });
      queryClient.invalidateQueries({ queryKey: unitKeys.all });
      queryClient.invalidateQueries({ queryKey: propertyKeys.all });
    },
  });
};

export const useUpdateLease = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateLeaseInput }) =>
      leaseApi.updateLease(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: leaseKeys.lists() });
      queryClient.invalidateQueries({ queryKey: leaseKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: unitKeys.all });
    },
  });
};

export const useTerminateLease = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: TerminateLeaseInput }) =>
      leaseApi.terminateLease(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: leaseKeys.lists() });
      queryClient.invalidateQueries({ queryKey: leaseKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: unitKeys.all });
      queryClient.invalidateQueries({ queryKey: propertyKeys.all });
    },
  });
};

export const useRenewLease = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: RenewLeaseInput }) =>
      leaseApi.renewLease(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: leaseKeys.lists() });
      queryClient.invalidateQueries({ queryKey: leaseKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: unitKeys.all });
      queryClient.invalidateQueries({ queryKey: propertyKeys.all });
    },
  });
};

