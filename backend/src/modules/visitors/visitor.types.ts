import { VisitorStatus } from '@prisma/client';

export interface CreateVisitorDTO {
  propertyId: string;
  unitId: string;
  visitorName: string;
  phone: string;
  purpose: string;
  visitDate: string;
  isDelivery?: boolean;
  deliveryCompany?: string;
  notes?: string;
}

export interface UpdateVisitorDTO {
  visitorName?: string;
  phone?: string;
  purpose?: string;
  visitDate?: string;
  status?: VisitorStatus;
  notes?: string;
}

export interface VisitorFilterQuery {
  propertyId?: string;
  unitId?: string;
  status?: VisitorStatus;
  date?: string;
  search?: string;
  page?: number | string;
  limit?: number | string;
}

