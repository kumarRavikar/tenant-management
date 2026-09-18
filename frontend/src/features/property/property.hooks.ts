import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { propertyApi } from './property.api';
import { CreatePropertyInput, UpdatePropertyInput, PropertyQueryParams } from './property.types';

export const propertyKeys = {
  all: ['properties'] as const,
  lists: () => [...propertyKeys.all, 'list'] as const,
  list: (params?: PropertyQueryParams) => [...propertyKeys.lists(), params] as const,
  details: () => [...propertyKeys.all, 'detail'] as const,
  detail: (id: string) => [...propertyKeys.details(), id] as const,
};

export const useProperties = (params?: PropertyQueryParams) => {
  return useQuery({
    queryKey: propertyKeys.list(params),
    queryFn: () => propertyApi.getProperties(params),
  });
};

export const useProperty = (id?: string) => {
  return useQuery({
    queryKey: propertyKeys.detail(id!),
    queryFn: () => propertyApi.getPropertyById(id!),
    enabled: Boolean(id),
  });
};

export const useCreateProperty = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreatePropertyInput) => propertyApi.createProperty(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: propertyKeys.lists() });
    },
  });
};

export const useUpdateProperty = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePropertyInput }) =>
      propertyApi.updateProperty(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: propertyKeys.lists() });
      queryClient.invalidateQueries({ queryKey: propertyKeys.detail(variables.id) });
    },
  });
};

export const useDeleteProperty = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => propertyApi.deleteProperty(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: propertyKeys.lists() });
    },
  });
};

