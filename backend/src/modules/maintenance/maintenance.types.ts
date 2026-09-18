import { MaintenancePriority, MaintenanceStatus } from '@prisma/client';
import { PaginationQuery } from '../../utils/pagination';

export interface CreateMaintenanceTicketDTO {
  unitId: string;
  title: string;
  description: string;
  priority?: MaintenancePriority;
  estimatedCompletion?: string;
}

export interface UpdateMaintenanceTicketDTO {
  title?: string;
  description?: string;
  priority?: MaintenancePriority;
  status?: MaintenanceStatus;
  estimatedCompletion?: string;
}

export interface AssignTicketDTO {
  assignedToId: string;
}

export interface AddCommentDTO {
  comment: string;
}

export interface MaintenanceFilterQuery extends PaginationQuery {
  unitId?: string;
  propertyId?: string;
  priority?: MaintenancePriority;
  status?: MaintenanceStatus;
  assignedToId?: string;
  createdById?: string;
}

