import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tenantApi } from './tenant.api';
import { CreateTenantProfileInput, UpdateTenantProfileInput, TenantQueryParams } from './tenant.types';

export const tenantKeys = {
  all: ['tenants'] as const,
  lists: () => [...tenantKeys.all, 'list'] as const,
  list: (params?: TenantQueryParams) => [...tenantKeys.lists(), params] as const,
  details: () => [...tenantKeys.all, 'detail'] as const,
  detail: (id: string) => [...tenantKeys.details(), id] as const,
};

export const useTenants = (params?: TenantQueryParams) => {
  return useQuery({
    queryKey: tenantKeys.list(params),
    queryFn: () => tenantApi.getTenants(params),
  });
};

export const useTenant = (id?: string) => {
  return useQuery({
    queryKey: tenantKeys.detail(id!),
    queryFn: () => tenantApi.getTenantById(id!),
    enabled: Boolean(id),
  });
};

export const useCreateTenant = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTenantProfileInput) => tenantApi.createTenant(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tenantKeys.lists() });
    },
  });
};

export const useUpdateTenant = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTenantProfileInput }) =>
      tenantApi.updateTenant(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: tenantKeys.lists() });
      queryClient.invalidateQueries({ queryKey: tenantKeys.detail(variables.id) });
    },
  });
};

