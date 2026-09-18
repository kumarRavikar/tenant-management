import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ownerApi } from './owner.api';
import { CreateOwnerProfileInput, AssignUnitInput, OwnerQueryParams } from './owner.types';

export const ownerKeys = {
  all: ['owners'] as const,
  lists: () => [...ownerKeys.all, 'list'] as const,
  list: (params?: OwnerQueryParams) => [...ownerKeys.lists(), params] as const,
  details: () => [...ownerKeys.all, 'detail'] as const,
  detail: (id: string) => [...ownerKeys.details(), id] as const,
};

export const useOwners = (params?: OwnerQueryParams) => {
  return useQuery({
    queryKey: ownerKeys.list(params),
    queryFn: () => ownerApi.getOwners(params),
  });
};

export const useOwner = (id?: string) => {
  return useQuery({
    queryKey: ownerKeys.detail(id!),
    queryFn: () => ownerApi.getOwnerById(id!),
    enabled: Boolean(id),
  });
};

export const useCreateOwner = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateOwnerProfileInput) => ownerApi.createOwner(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ownerKeys.lists() });
    },
  });
};

export const useAssignUnitToOwner = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ownerId, data }: { ownerId: string; data: AssignUnitInput }) =>
      ownerApi.assignUnit(ownerId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ownerKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ownerKeys.detail(variables.ownerId) });
    },
  });
};

