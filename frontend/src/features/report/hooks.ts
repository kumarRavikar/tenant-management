import { useQuery } from '@tanstack/react-query';
import { reportApi } from './api';
import { ReportType, ReportQueryParams } from './types';

export const REPORT_QUERY_KEY = ['reports'];

export const useReport = (type: ReportType, params?: ReportQueryParams) => {
  return useQuery({
    queryKey: [...REPORT_QUERY_KEY, type, params],
    queryFn: () => reportApi.getReport(type, params),
  });
};

