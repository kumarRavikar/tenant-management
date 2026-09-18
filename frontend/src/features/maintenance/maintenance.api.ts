import apiClient from '@/services/api';
import { ApiResponse, PaginationMeta } from '@/types';
import {
  MaintenanceTicket,
  TicketComment,
  TicketAttachment,
  TicketActivity,
  CreateTicketInput,
  UpdateTicketInput,
  AssignTicketInput,
  TicketQueryParams,
} from './maintenance.types';

export const maintenanceApi = {
  async getTickets(
    params?: TicketQueryParams
  ): Promise<{ tickets: MaintenanceTicket[]; meta?: PaginationMeta }> {
    const res = await apiClient.get<ApiResponse<MaintenanceTicket[]>>('/maintenance', { params });
    return {
      tickets: res.data.data || [],
      meta: res.data.meta,
    };
  },

  async getTicketById(id: string): Promise<MaintenanceTicket> {
    const res = await apiClient.get<ApiResponse<MaintenanceTicket>>(`/maintenance/${id}`);
    return res.data.data!;
  },

  async createTicket(input: CreateTicketInput): Promise<MaintenanceTicket> {
    const res = await apiClient.post<ApiResponse<MaintenanceTicket>>('/maintenance', input);
    return res.data.data!;
  },

  async updateTicket(id: string, input: UpdateTicketInput): Promise<MaintenanceTicket> {
    const res = await apiClient.patch<ApiResponse<MaintenanceTicket>>(`/maintenance/${id}`, input);
    return res.data.data!;
  },

  async assignTicket(id: string, input: AssignTicketInput): Promise<MaintenanceTicket> {
    const res = await apiClient.post<ApiResponse<MaintenanceTicket>>(`/maintenance/${id}/assign`, input);
    return res.data.data!;
  },

  async addComment(id: string, comment: string): Promise<TicketComment> {
    const res = await apiClient.post<ApiResponse<TicketComment>>(`/maintenance/${id}/comments`, { comment });
    return res.data.data!;
  },

  async uploadAttachment(id: string, file: File): Promise<TicketAttachment> {
    const formData = new FormData();
    formData.append('file', file);

    const res = await apiClient.post<ApiResponse<TicketAttachment>>(
      `/maintenance/${id}/attachments`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return res.data.data!;
  },

  async getActivity(id: string): Promise<TicketActivity[]> {
    const res = await apiClient.get<ApiResponse<TicketActivity[]>>(`/maintenance/${id}/activity`);
    return res.data.data || [];
  },
};

