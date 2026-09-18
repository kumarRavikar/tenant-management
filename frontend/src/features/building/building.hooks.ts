import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { buildingApi } from './building.api';
import { CreateBuildingInput, UpdateBuildingInput } from './building.types';
import { propertyKeys } from '../property/property.hooks';

export const buildingKeys = {
  all: ['buildings'] as const,
  lists: () => [...buildingKeys.all, 'list'] as const,
  list: (propertyId?: string) => [...buildingKeys.lists(), { propertyId }] as const,
  details: () => [...buildingKeys.all, 'detail'] as const,
  detail: (id: string) => [...buildingKeys.details(), id] as const,
};

export const useBuildings = (propertyId?: string) => {
  return useQuery({
    queryKey: buildingKeys.list(propertyId),
    queryFn: () => buildingApi.getBuildings(propertyId),
  });
};

export const useBuilding = (id?: string) => {
  return useQuery({
    queryKey: buildingKeys.detail(id!),
    queryFn: () => buildingApi.getBuildingById(id!),
    enabled: Boolean(id),
  });
};

export const useCreateBuilding = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateBuildingInput) => buildingApi.createBuilding(input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: buildingKeys.lists() });
      queryClient.invalidateQueries({ queryKey: propertyKeys.detail(variables.propertyId) });
    },
  });
};

export const useUpdateBuilding = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateBuildingInput }) =>
      buildingApi.updateBuilding(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: buildingKeys.lists() });
      queryClient.invalidateQueries({ queryKey: buildingKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: propertyKeys.all });
    },
  });
};

export const useDeleteBuilding = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => buildingApi.deleteBuilding(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: buildingKeys.lists() });
      queryClient.invalidateQueries({ queryKey: propertyKeys.all });
    },
  });
};

