import { Prisma, MaintenanceStatus, ActivityType } from '@prisma/client';
import { prisma } from '../../config/database';
import { AppError } from '../../middleware/error.middleware';
import { getPagination, createPaginationMeta, PaginationMeta } from '../../utils/pagination';
import {
  CreateMaintenanceTicketDTO,
  UpdateMaintenanceTicketDTO,
  AssignTicketDTO,
  AddCommentDTO,
  MaintenanceFilterQuery,
} from './maintenance.types';
import { storageService } from '../../services/storage/storage.service';
import { UserRole } from '../auth/auth.types';
import { socketEmitter } from '../../socket';

export class MaintenanceService {
  private static async verifyPropertyScope(propertyId: string, user: { id: string; role: UserRole }): Promise<void> {
    if (user.role === UserRole.SUPER_ADMIN) return;

    if (user.role === UserRole.PROPERTY_ADMIN || user.role === UserRole.MANAGER) {
      const assignment = await prisma.userProperty.findUnique({
        where: {
          userId_propertyId: {
            userId: user.id,
            propertyId,
          },
        },
      });
      if (!assignment) {
        throw new AppError('Forbidden: You do not have access to this property', 403);
      }
      return;
    }

    throw new AppError('Forbidden: Insufficient permissions', 403);
  }

  public static async list(
    user: { id: string; role: UserRole },
    query: MaintenanceFilterQuery
  ): Promise<{ tickets: unknown[]; meta: PaginationMeta }> {
    const { page, limit, skip } = getPagination(query);

    const where: Prisma.MaintenanceTicketWhereInput = {};

    if (query.unitId) {
      where.unitId = query.unitId;
    }
    if (query.priority) {
      where.priority = query.priority;
    }
    if (query.status) {
      where.status = query.status;
    }
    if (query.assignedToId) {
      where.assignedToId = query.assignedToId;
    }
    if (query.createdById) {
      where.createdById = query.createdById;
    }
    if (query.propertyId) {
      where.unit = {
        floor: {
          building: {
            propertyId: query.propertyId,
          },
        },
      };
    }

    // Role-based scoping
    if (user.role === UserRole.PROPERTY_ADMIN || user.role === UserRole.MANAGER) {
      const assignments = await prisma.userProperty.findMany({
        where: { userId: user.id },
        select: { propertyId: true },
      });
      const allowedProperties = assignments.map((a) => a.propertyId);
      where.unit = {
        ...(where.unit as Prisma.UnitWhereInput || {}),
        floor: {
          building: {
            propertyId: { in: allowedProperties },
          },
        },
      };
    } else if (user.role === UserRole.OWNER) {
      where.unit = {
        ...(where.unit as Prisma.UnitWhereInput || {}),
        owners: {
          some: {
            ownerProfile: { userId: user.id },
          },
        },
      };
    } else if (user.role === UserRole.TENANT) {
      where.OR = [
        { createdById: user.id },
        {
          unit: {
            leases: {
              some: {
                tenant: { userId: user.id },
              },
            },
          },
        },
      ];
    }

    const [total, tickets] = await Promise.all([
      prisma.maintenanceTicket.count({ where }),
      prisma.maintenanceTicket.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          unit: {
            select: {
              id: true,
              unitNumber: true,
              floor: {
                select: {
                  floorNumber: true,
                  building: {
                    select: {
                      id: true,
                      name: true,
                      property: {
                        select: { id: true, name: true, city: true },
                      },
                    },
                  },
                },
              },
            },
          },
          createdBy: {
            select: { id: true, firstName: true, lastName: true, email: true, role: true },
          },
          assignedTo: {
            select: { id: true, firstName: true, lastName: true, email: true, role: true },
          },
          _count: {
            select: { comments: true, attachments: true },
          },
        },
      }),
    ]);

    return {
      tickets,
      meta: createPaginationMeta(page, limit, total),
    };
  }

  public static async getById(id: string, user: { id: string; role: UserRole }): Promise<unknown> {
    const ticket = await prisma.maintenanceTicket.findUnique({
      where: { id },
      include: {
        unit: {
          include: {
            floor: {
              include: {
                building: {
                  include: {
                    property: true,
                  },
                },
              },
            },
            owners: {
              include: {
                ownerProfile: true,
              },
            },
            leases: {
              include: {
                tenant: true,
              },
            },
          },
        },
        createdBy: {
          select: { id: true, firstName: true, lastName: true, email: true, role: true },
        },
        assignedTo: {
          select: { id: true, firstName: true, lastName: true, email: true, role: true },
        },
        comments: {
          orderBy: { createdAt: 'asc' },
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true, email: true, role: true },
            },
          },
        },
        attachments: {
          orderBy: { createdAt: 'desc' },
          include: {
            uploadedBy: {
              select: { id: true, firstName: true, lastName: true, email: true },
            },
          },
        },
        activities: {
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true, role: true },
            },
          },
        },
      },
    });

    if (!ticket) {
      throw new AppError('Maintenance ticket not found', 404);
    }

    // Role-based scope verification
    if (user.role === UserRole.PROPERTY_ADMIN || user.role === UserRole.MANAGER) {
      await this.verifyPropertyScope(ticket.unit.floor.building.propertyId, user);
    } else if (user.role === UserRole.OWNER) {
      const owns = ticket.unit.owners.some((o) => o.ownerProfile.userId === user.id);
      if (!owns) {
        throw new AppError('Forbidden: You do not own the unit associated with this ticket', 403);
      }
    } else if (user.role === UserRole.TENANT) {
      const isCreator = ticket.createdById === user.id;
      const isLeasing = ticket.unit.leases.some((l) => l.tenant.userId === user.id);
      if (!isCreator && !isLeasing) {
        throw new AppError('Forbidden: You do not have access to this maintenance ticket', 403);
      }
    }

    return ticket;
  }

  public static async create(
    dto: CreateMaintenanceTicketDTO,
    user: { id: string; role: UserRole }
  ): Promise<unknown> {
    const unit = await prisma.unit.findUnique({
      where: { id: dto.unitId },
      include: {
        floor: {
          include: {
            building: true,
          },
        },
        leases: {
          include: {
            tenant: true,
          },
        },
        owners: {
          include: {
            ownerProfile: true,
          },
        },
      },
    });

    if (!unit) {
      throw new AppError('Unit not found', 404);
    }

    // Role verification
    if (user.role === UserRole.TENANT) {
      const isLeasing = unit.leases.some((l) => l.tenant.userId === user.id);
      if (!isLeasing) {
        throw new AppError('Forbidden: You can only submit maintenance requests for your leased unit', 403);
      }
    } else if (user.role === UserRole.OWNER) {
      const owns = unit.owners.some((o) => o.ownerProfile.userId === user.id);
      if (!owns) {
        throw new AppError('Forbidden: You do not own this unit', 403);
      }
    } else if (user.role === UserRole.PROPERTY_ADMIN || user.role === UserRole.MANAGER) {
      await this.verifyPropertyScope(unit.floor.building.propertyId, user);
    }

    const createdTicket = await prisma.$transaction(async (tx) => {
      const ticket = await tx.maintenanceTicket.create({
        data: {
          unitId: dto.unitId,
          createdById: user.id,
          title: dto.title,
          description: dto.description,
          priority: dto.priority || 'MEDIUM',
          status: MaintenanceStatus.OPEN,
          estimatedCompletion: dto.estimatedCompletion ? new Date(dto.estimatedCompletion) : undefined,
        },
        include: {
          unit: true,
          createdBy: {
            select: { id: true, firstName: true, lastName: true, email: true, role: true },
          },
        },
      });

      // Log activity
      await tx.ticketActivity.create({
        data: {
          ticketId: ticket.id,
          userId: user.id,
          activityType: ActivityType.CREATED,
          description: 'Ticket created',
        },
      });

      return ticket;
    });

    socketEmitter.emitTicketCreated(unit!.floor.building.propertyId, createdTicket);
    return createdTicket;
  }

  public static async update(
    id: string,
    dto: UpdateMaintenanceTicketDTO,
    user: { id: string; role: UserRole }
  ): Promise<unknown> {
    const existing = (await this.getById(id, user)) as any;

    const canChangeStatus =
      user.role === UserRole.SUPER_ADMIN ||
      user.role === UserRole.PROPERTY_ADMIN ||
      user.role === UserRole.MANAGER ||
      existing.assignedToId === user.id;

    if (dto.status && dto.status !== existing.status && !canChangeStatus) {
      throw new AppError('Forbidden: You are not authorized to update ticket status', 403);
    }

    if (dto.priority && dto.priority !== existing.priority && !canChangeStatus) {
      throw new AppError('Forbidden: You are not authorized to update ticket priority', 403);
    }

    const updated = await prisma.$transaction(async (tx) => {
      // Record status change activity if changed
      if (dto.status && dto.status !== existing.status) {
        let activityType: ActivityType = ActivityType.STATUS_CHANGED;
        if (dto.status === MaintenanceStatus.RESOLVED) activityType = ActivityType.RESOLVED;
        if (dto.status === MaintenanceStatus.CLOSED) activityType = ActivityType.CLOSED;
        if (dto.status === MaintenanceStatus.CANCELLED) activityType = ActivityType.CANCELLED;

        await tx.ticketActivity.create({
          data: {
            ticketId: id,
            userId: user.id,
            activityType,
            description: `Status changed from ${existing.status} to ${dto.status}`,
          },
        });
      }

      // Record priority change activity if changed
      if (dto.priority && dto.priority !== existing.priority) {
        await tx.ticketActivity.create({
          data: {
            ticketId: id,
            userId: user.id,
            activityType: ActivityType.PRIORITY_CHANGED,
            description: `Priority changed from ${existing.priority} to ${dto.priority}`,
          },
        });
      }

      const updated = await tx.maintenanceTicket.update({
        where: { id },
        data: {
          title: dto.title,
          description: dto.description,
          priority: dto.priority,
          status: dto.status,
          estimatedCompletion: dto.estimatedCompletion ? new Date(dto.estimatedCompletion) : undefined,
        },
        include: {
          unit: true,
          createdBy: { select: { id: true, firstName: true, lastName: true, role: true } },
          assignedTo: { select: { id: true, firstName: true, lastName: true, role: true } },
        },
      });

      return updated;
    });

    socketEmitter.emitTicketStatusChanged(existing.unit.floor.building.propertyId, updated);
    return updated;
  }

  public static async assign(
    id: string,
    dto: AssignTicketDTO,
    user: { id: string; role: UserRole }
  ): Promise<unknown> {
    if (
      user.role !== UserRole.SUPER_ADMIN &&
      user.role !== UserRole.PROPERTY_ADMIN &&
      user.role !== UserRole.MANAGER
    ) {
      throw new AppError('Forbidden: Only administrators or managers can assign staff', 403);
    }

    const ticket = (await this.getById(id, user)) as any;

    const assignee = await prisma.user.findUnique({
      where: { id: dto.assignedToId },
      select: { id: true, firstName: true, lastName: true, email: true, role: true },
    });

    if (!assignee) {
      throw new AppError('Assignee user not found', 404);
    }

    const assigned = await prisma.$transaction(async (tx) => {
      const newStatus =
        ticket.status === MaintenanceStatus.OPEN ? MaintenanceStatus.ASSIGNED : ticket.status;

      const updated = await tx.maintenanceTicket.update({
        where: { id },
        data: {
          assignedToId: dto.assignedToId,
          status: newStatus,
        },
        include: {
          assignedTo: { select: { id: true, firstName: true, lastName: true, email: true, role: true } },
        },
      });

      await tx.ticketActivity.create({
        data: {
          ticketId: id,
          userId: user.id,
          activityType: ActivityType.ASSIGNED,
          description: `Assigned to ${assignee.firstName} ${assignee.lastName}`,
        },
      });

      return updated;
    });

    socketEmitter.emitTicketAssigned(dto.assignedToId, assigned);
    return assigned;
  }

  public static async addComment(
    id: string,
    dto: AddCommentDTO,
    user: { id: string; role: UserRole }
  ): Promise<unknown> {
    await this.getById(id, user);

    const comment = await prisma.$transaction(async (tx) => {
      const newComment = await tx.ticketComment.create({
        data: {
          ticketId: id,
          userId: user.id,
          comment: dto.comment,
        },
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true, email: true, role: true },
          },
        },
      });

      await tx.ticketActivity.create({
        data: {
          ticketId: id,
          userId: user.id,
          activityType: ActivityType.COMMENT_ADDED,
          description: 'Comment added',
        },
      });

      return newComment;
    });

    socketEmitter.emitTicketCommentAdded(id, comment);
    return comment;
  }

  public static async addAttachment(
    id: string,
    file: Express.Multer.File,
    user: { id: string; role: UserRole }
  ): Promise<unknown> {
    await this.getById(id, user);

    const uploadMeta = await storageService.upload(file, 'maintenance');

    return prisma.$transaction(async (tx) => {
      const attachment = await tx.ticketAttachment.create({
        data: {
          ticketId: id,
          fileUrl: uploadMeta.url,
          fileName: uploadMeta.fileName,
          fileType: uploadMeta.fileType,
          fileSize: uploadMeta.fileSize,
          attachmentType: uploadMeta.attachmentType,
          uploadedById: user.id,
        },
        include: {
          uploadedBy: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
      });

      await tx.ticketActivity.create({
        data: {
          ticketId: id,
          userId: user.id,
          activityType: ActivityType.ATTACHMENT_ADDED,
          description: `Attachment uploaded: ${uploadMeta.fileName}`,
        },
      });

      return attachment;
    });
  }

  public static async getActivity(id: string, user: { id: string; role: UserRole }): Promise<unknown[]> {
    await this.getById(id, user);

    return prisma.ticketActivity.findMany({
      where: { ticketId: id },
      orderBy: { createdAt: 'asc' },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, role: true },
        },
      },
    });
  }
}
