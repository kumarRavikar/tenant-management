import { LeaseStatus } from '@prisma/client';
import { PaginationQuery } from '../../utils/pagination';

export interface CreateLeaseDTO {
  unitId: string;
  tenantProfileId: string;
  startDate: string;
  endDate: string;
  monthlyRent: number;
  securityDeposit: number;
  status?: LeaseStatus;
  moveInDate?: string;
  terms?: string;
}

export interface UpdateLeaseDTO {
  startDate?: string;
  endDate?: string;
  monthlyRent?: number;
  securityDeposit?: number;
  status?: LeaseStatus;
  moveInDate?: string;
  moveOutDate?: string;
  terms?: string;
}

export interface TerminateLeaseDTO {
  moveOutDate?: string;
  terms?: string;
}

export interface RenewLeaseDTO {
  startDate: string;
  endDate: string;
  monthlyRent: number;
  securityDeposit?: number;
  terms?: string;
}

export interface LeaseFilterQuery extends PaginationQuery {
  propertyId?: string;
  unitId?: string;
  tenantProfileId?: string;
  status?: LeaseStatus;
  startDate?: string;
  endDate?: string;
}

