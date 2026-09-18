import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { unitApi } from './unit.api';
import { CreateUnitInput, UpdateUnitInput, UnitQueryParams } from './unit.types';
import { floorKeys } from '../floor/floor.hooks';
import { propertyKeys } from '../property/property.hooks';

export const unitKeys = {
  all: ['units'] as const,
  lists: () => [...unitKeys.all, 'list'] as const,
  list: (params?: UnitQueryParams) => [...unitKeys.lists(), params] as const,
  details: () => [...unitKeys.all, 'detail'] as const,
  detail: (id: string) => [...unitKeys.details(), id] as const,
};

export const useUnits = (params?: UnitQueryParams) => {
  return useQuery({
    queryKey: unitKeys.list(params),
    queryFn: () => unitApi.getUnits(params),
  });
};

export const useUnit = (id?: string) => {
  return useQuery({
    queryKey: unitKeys.detail(id!),
    queryFn: () => unitApi.getUnitById(id!),
    enabled: Boolean(id),
  });
};

export const useCreateUnit = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateUnitInput) => unitApi.createUnit(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: unitKeys.lists() });
      queryClient.invalidateQueries({ queryKey: floorKeys.all });
      queryClient.invalidateQueries({ queryKey: propertyKeys.all });
    },
  });
};

export const useUpdateUnit = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUnitInput }) =>
      unitApi.updateUnit(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: unitKeys.lists() });
      queryClient.invalidateQueries({ queryKey: unitKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: floorKeys.all });
      queryClient.invalidateQueries({ queryKey: propertyKeys.all });
    },
  });
};

