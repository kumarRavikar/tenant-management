import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { floorApi } from './floor.api';
import { CreateFloorInput, UpdateFloorInput } from './floor.types';
import { buildingKeys } from '../building/building.hooks';
import { propertyKeys } from '../property/property.hooks';

export const floorKeys = {
  all: ['floors'] as const,
  lists: () => [...floorKeys.all, 'list'] as const,
  list: (buildingId?: string) => [...floorKeys.lists(), { buildingId }] as const,
  details: () => [...floorKeys.all, 'detail'] as const,
  detail: (id: string) => [...floorKeys.details(), id] as const,
};

export const useFloors = (buildingId?: string) => {
  return useQuery({
    queryKey: floorKeys.list(buildingId),
    queryFn: () => floorApi.getFloors(buildingId),
  });
};

export const useFloor = (id?: string) => {
  return useQuery({
    queryKey: floorKeys.detail(id!),
    queryFn: () => floorApi.getFloorById(id!),
    enabled: Boolean(id),
  });
};

export const useCreateFloor = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateFloorInput) => floorApi.createFloor(input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: floorKeys.lists() });
      queryClient.invalidateQueries({ queryKey: buildingKeys.detail(variables.buildingId) });
      queryClient.invalidateQueries({ queryKey: propertyKeys.all });
    },
  });
};

export const useUpdateFloor = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateFloorInput }) =>
      floorApi.updateFloor(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: floorKeys.lists() });
      queryClient.invalidateQueries({ queryKey: floorKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: buildingKeys.all });
      queryClient.invalidateQueries({ queryKey: propertyKeys.all });
    },
  });
};

export const useDeleteFloor = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => floorApi.deleteFloor(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: floorKeys.lists() });
      queryClient.invalidateQueries({ queryKey: buildingKeys.all });
      queryClient.invalidateQueries({ queryKey: propertyKeys.all });
    },
  });
};

