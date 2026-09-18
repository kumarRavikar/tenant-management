import apiClient from '@/services/api';
import { ApiResponse } from '@/types';
import { ReportType, ReportOutput, ReportQueryParams } from './types';

export const reportApi = {
  async getReport(type: ReportType, params?: ReportQueryParams): Promise<ReportOutput> {
    const res = await apiClient.get<ApiResponse<ReportOutput>>(`/reports/${type}`, {
      params: { ...params, format: 'json' },
    });
    return res.data.data!;
  },

  async downloadExport(type: ReportType, format: 'csv' | 'pdf', params?: ReportQueryParams): Promise<void> {
    const res = await apiClient.get(`/reports/${type}`, {
      params: { ...params, format },
      responseType: 'blob',
    });

    const blob = new Blob([res.data], {
      type: format === 'pdf' ? 'application/pdf' : 'text/csv;charset=utf-8;',
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${type}_report_${Date.now()}.${format}`);
    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);
    window.URL.revokeObjectURL(url);
  },
};

