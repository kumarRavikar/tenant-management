export type MaintenancePriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type MaintenanceStatus =
  | 'OPEN'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'ON_HOLD'
  | 'RESOLVED'
  | 'CLOSED'
  | 'CANCELLED';

export type AttachmentType = 'PHOTO' | 'AUDIO' | 'DOCUMENT' | 'OTHER';

export type ActivityType =
  | 'CREATED'
  | 'ASSIGNED'
  | 'STATUS_CHANGED'
  | 'PRIORITY_CHANGED'
  | 'COMMENT_ADDED'
  | 'ATTACHMENT_ADDED'
  | 'RESOLVED'
  | 'CLOSED'
  | 'CANCELLED';

export interface UserSummary {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  role: string;
}

export interface TicketComment {
  id: string;
  ticketId: string;
  userId: string;
  comment: string;
  createdAt: string;
  updatedAt: string;
  user?: UserSummary;
}

export interface TicketAttachment {
  id: string;
  ticketId: string;
  fileUrl: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  attachmentType: AttachmentType;
  uploadedById: string;
  createdAt: string;
  uploadedBy?: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
  };
}

export interface TicketActivity {
  id: string;
  ticketId: string;
  userId: string;
  activityType: ActivityType;
  description: string;
  createdAt: string;
  user?: UserSummary;
}

export interface MaintenanceTicket {
  id: string;
  unitId: string;
  createdById: string;
  assignedToId?: string | null;
  title: string;
  description: string;
  priority: MaintenancePriority;
  status: MaintenanceStatus;
  estimatedCompletion?: string | null;
  createdAt: string;
  updatedAt: string;
  unit?: {
    id: string;
    unitNumber: string;
    floor?: {
      floorNumber: number;
      building?: {
        id: string;
        name: string;
        property?: {
          id: string;
          name: string;
          city?: string;
        };
      };
    };
  };
  createdBy?: UserSummary;
  assignedTo?: UserSummary | null;
  comments?: TicketComment[];
  attachments?: TicketAttachment[];
  activities?: TicketActivity[];
  _count?: {
    comments: number;
    attachments: number;
  };
}

export interface CreateTicketInput {
  unitId: string;
  title: string;
  description: string;
  priority?: MaintenancePriority;
  estimatedCompletion?: string;
}

export interface UpdateTicketInput {
  title?: string;
  description?: string;
  priority?: MaintenancePriority;
  status?: MaintenanceStatus;
  estimatedCompletion?: string;
}

export interface AssignTicketInput {
  assignedToId: string;
}

export interface TicketQueryParams {
  unitId?: string;
  propertyId?: string;
  priority?: MaintenancePriority;
  status?: MaintenanceStatus;
  assignedToId?: string;
  createdById?: string;
  search?: string;
  page?: number;
  limit?: number;
}

