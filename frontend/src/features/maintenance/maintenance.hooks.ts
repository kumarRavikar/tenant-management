import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { maintenanceApi } from './maintenance.api';
import {
  CreateTicketInput,
  UpdateTicketInput,
  AssignTicketInput,
  TicketQueryParams,
} from './maintenance.types';

export const maintenanceKeys = {
  all: ['maintenance'] as const,
  lists: () => [...maintenanceKeys.all, 'list'] as const,
  list: (params?: TicketQueryParams) => [...maintenanceKeys.lists(), params] as const,
  details: () => [...maintenanceKeys.all, 'detail'] as const,
  detail: (id: string) => [...maintenanceKeys.details(), id] as const,
  activities: (id: string) => [...maintenanceKeys.detail(id), 'activity'] as const,
};

export const useMaintenanceTickets = (params?: TicketQueryParams) => {
  return useQuery({
    queryKey: maintenanceKeys.list(params),
    queryFn: () => maintenanceApi.getTickets(params),
  });
};

export const useMaintenanceTicket = (id?: string) => {
  return useQuery({
    queryKey: maintenanceKeys.detail(id!),
    queryFn: () => maintenanceApi.getTicketById(id!),
    enabled: Boolean(id),
  });
};

export const useTicketActivity = (id?: string) => {
  return useQuery({
    queryKey: maintenanceKeys.activities(id!),
    queryFn: () => maintenanceApi.getActivity(id!),
    enabled: Boolean(id),
  });
};

export const useCreateTicket = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTicketInput) => maintenanceApi.createTicket(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: maintenanceKeys.lists() });
    },
  });
};

export const useUpdateTicket = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTicketInput }) =>
      maintenanceApi.updateTicket(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: maintenanceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: maintenanceKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: maintenanceKeys.activities(variables.id) });
    },
  });
};

export const useAssignTicket = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: AssignTicketInput }) =>
      maintenanceApi.assignTicket(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: maintenanceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: maintenanceKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: maintenanceKeys.activities(variables.id) });
    },
  });
};

export const useAddComment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, comment }: { id: string; comment: string }) =>
      maintenanceApi.addComment(id, comment),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: maintenanceKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: maintenanceKeys.activities(variables.id) });
    },
  });
};

export const useUploadAttachment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) =>
      maintenanceApi.uploadAttachment(id, file),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: maintenanceKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: maintenanceKeys.activities(variables.id) });
    },
  });
};

