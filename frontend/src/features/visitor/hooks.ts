import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { visitorApi } from './api';
import { VisitorFilterParams, CreateVisitorInput, Visitor } from './types';

export const VISITORS_QUERY_KEY = ['visitors'];

export const useVisitors = (params?: VisitorFilterParams) => {
  return useQuery({
    queryKey: [...VISITORS_QUERY_KEY, params],
    queryFn: () => visitorApi.list(params),
  });
};

export const useCreateVisitor = () => {
  const queryClient = useQueryClient();

  return useMutation<Visitor, Error, CreateVisitorInput>({
    mutationFn: (data) => visitorApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: VISITORS_QUERY_KEY });
    },
  });
};

export const useCheckInVisitor = () => {
  const queryClient = useQueryClient();

  return useMutation<Visitor, Error, string>({
    mutationFn: (id) => visitorApi.checkIn(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: VISITORS_QUERY_KEY });
    },
  });
};

export const useCheckOutVisitor = () => {
  const queryClient = useQueryClient();

  return useMutation<Visitor, Error, string>({
    mutationFn: (id) => visitorApi.checkOut(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: VISITORS_QUERY_KEY });
    },
  });
};

