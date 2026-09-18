export type VisitorStatus =
  | 'PRE_APPROVED'
  | 'PENDING_APPROVAL'
  | 'CHECKED_IN'
  | 'CHECKED_OUT'
  | 'REJECTED'
  | 'CANCELLED';

export interface Visitor {
  id: string;
  propertyId: string;
  unitId: string;
  visitorName: string;
  phone: string;
  purpose: string;
  visitDate: string;
  entryTime?: string | null;
  exitTime?: string | null;
  status: VisitorStatus;
  gatePassCode: string;
  isDelivery: boolean;
  deliveryCompany?: string | null;
  notes?: string | null;
  hostUserId?: string | null;
  property?: { id: string; name: string; address?: string };
  unit?: { id: string; unitNumber: string };
  hostUser?: { id: string; firstName: string; lastName: string; email?: string };
  createdAt: string;
}

export interface CreateVisitorInput {
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

export interface VisitorFilterParams {
  propertyId?: string;
  unitId?: string;
  status?: VisitorStatus;
  date?: string;
  search?: string;
  page?: number;
  limit?: number;
}

