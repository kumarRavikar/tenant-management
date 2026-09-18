import crypto from 'crypto';
import { Prisma, VisitorStatus } from '@prisma/client';
import { prisma } from '../../config/database';
import { AppError } from '../../middleware/error.middleware';
import { getPagination, createPaginationMeta, PaginationMeta } from '../../utils/pagination';
import { CreateVisitorDTO, UpdateVisitorDTO, VisitorFilterQuery } from './visitor.types';
import { UserRole } from '../auth/auth.types';
import { NotificationService } from '../notifications/notification.service';

export class VisitorService {
  private static generatePassCode(): string {
    const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase();
    return `PASS-${randomHex}`;
  }

  private static async verifyUnitAndPropertyScope(
    propertyId: string,
    unitId: string,
    user: { id: string; role: UserRole }
  ): Promise<void> {
    const unit = await prisma.unit.findUnique({
      where: { id: unitId },
      include: {
        floor: {
          include: {
            building: true,
          },
        },
      },
    });

    if (!unit) {
      throw new AppError('Unit not found', 404);
    }

    if (unit.floor.building.propertyId !== propertyId) {
      throw new AppError('Unit does not belong to the specified property', 400);
    }

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

    if (user.role === UserRole.OWNER) {
      const ownerUnit = await prisma.ownerUnit.findFirst({
        where: {
          unitId,
          ownerProfile: {
            userId: user.id,
          },
        },
      });
      if (!ownerUnit) {
        throw new AppError('Forbidden: You do not own this unit', 403);
      }
      return;
    }

    if (user.role === UserRole.TENANT) {
      const activeLease = await prisma.lease.findFirst({
        where: {
          unitId,
          status: 'ACTIVE',
          tenant: {
            userId: user.id,
          },
        },
      });
      if (!activeLease) {
        throw new AppError('Forbidden: You do not have an active lease for this unit', 403);
      }
      return;
    }

    throw new AppError('Forbidden: Insufficient permissions', 403);
  }

  public static async create(
    user: { id: string; role: UserRole },
    dto: CreateVisitorDTO
  ): Promise<unknown> {
    await this.verifyUnitAndPropertyScope(dto.propertyId, dto.unitId, user);

    let gatePassCode = this.generatePassCode();
    // Ensure uniqueness
    let attempts = 0;
    while (attempts < 5) {
      const existing = await prisma.visitor.findUnique({ where: { gatePassCode } });
      if (!existing) break;
      gatePassCode = this.generatePassCode();
      attempts++;
    }

    const hostUserId = (user.role === UserRole.TENANT || user.role === UserRole.OWNER)
      ? user.id
      : undefined;

    const approvedById = (user.role === UserRole.SUPER_ADMIN || user.role === UserRole.PROPERTY_ADMIN || user.role === UserRole.MANAGER)
      ? user.id
      : undefined;

    const visitor = await prisma.visitor.create({
      data: {
        propertyId: dto.propertyId,
        unitId: dto.unitId,
        visitorName: dto.visitorName,
        phone: dto.phone,
        purpose: dto.purpose,
        visitDate: new Date(dto.visitDate),
        status: VisitorStatus.PRE_APPROVED,
        gatePassCode,
        isDelivery: dto.isDelivery || false,
        deliveryCompany: dto.deliveryCompany,
        notes: dto.notes,
        hostUserId,
        approvedById,
      },
      include: {
        property: {
          select: { id: true, name: true, address: true },
        },
        unit: {
          select: { id: true, unitNumber: true },
        },
        hostUser: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    return visitor;
  }

  public static async list(
    user: { id: string; role: UserRole },
    query: VisitorFilterQuery
  ): Promise<{ visitors: unknown[]; meta: PaginationMeta }> {
    const { page, limit, skip } = getPagination(query);
    const where: Prisma.VisitorWhereInput = {};

    if (query.propertyId) {
      where.propertyId = query.propertyId;
    }
    if (query.unitId) {
      where.unitId = query.unitId;
    }
    if (query.status) {
      where.status = query.status;
    }
    if (query.date) {
      const searchDate = new Date(query.date);
      const startOfDay = new Date(searchDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(searchDate.setHours(23, 59, 59, 999));
      where.visitDate = {
        gte: startOfDay,
        lte: endOfDay,
      };
    }
    if (query.search) {
      where.OR = [
        { visitorName: { contains: query.search, mode: 'insensitive' } },
        { phone: { contains: query.search, mode: 'insensitive' } },
        { gatePassCode: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    // Role-based scoping
    if (user.role === UserRole.PROPERTY_ADMIN || user.role === UserRole.MANAGER) {
      const assignments = await prisma.userProperty.findMany({
        where: { userId: user.id },
        select: { propertyId: true },
      });
      const allowedProperties = assignments.map((a) => a.propertyId);
      where.propertyId = { in: allowedProperties };
    } else if (user.role === UserRole.OWNER) {
      where.unit = {
        owners: {
          some: {
            ownerProfile: { userId: user.id },
          },
        },
      };
    } else if (user.role === UserRole.TENANT) {
      where.OR = [
        { hostUserId: user.id },
        {
          unit: {
            leases: {
              some: {
                tenant: { userId: user.id },
                status: 'ACTIVE',
              },
            },
          },
        },
      ];
    }

    const [total, visitors] = await Promise.all([
      prisma.visitor.count({ where }),
      prisma.visitor.findMany({
        where,
        skip,
        take: limit,
        orderBy: { visitDate: 'desc' },
        include: {
          property: {
            select: { id: true, name: true },
          },
          unit: {
            select: { id: true, unitNumber: true },
          },
          hostUser: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
      }),
    ]);

    return {
      visitors,
      meta: createPaginationMeta(page, limit, total),
    };
  }

  public static async getById(
    id: string,
    user: { id: string; role: UserRole }
  ): Promise<unknown> {
    const visitor = await prisma.visitor.findUnique({
      where: { id },
      include: {
        property: {
          select: { id: true, name: true, address: true },
        },
        unit: {
          select: { id: true, unitNumber: true },
        },
        hostUser: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        approvedBy: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    if (!visitor) {
      throw new AppError('Visitor not found', 404);
    }

    // Role check
    if (user.role === UserRole.SUPER_ADMIN) return visitor;

    if (user.role === UserRole.PROPERTY_ADMIN || user.role === UserRole.MANAGER) {
      const assignment = await prisma.userProperty.findUnique({
        where: {
          userId_propertyId: {
            userId: user.id,
            propertyId: visitor.propertyId,
          },
        },
      });
      if (!assignment) {
        throw new AppError('Forbidden: You do not have access to this visitor', 403);
      }
      return visitor;
    }

    if (user.role === UserRole.OWNER) {
      const ownerUnit = await prisma.ownerUnit.findFirst({
        where: {
          unitId: visitor.unitId,
          ownerProfile: { userId: user.id },
        },
      });
      if (!ownerUnit && visitor.hostUserId !== user.id) {
        throw new AppError('Forbidden: You do not have access to this visitor', 403);
      }
      return visitor;
    }

    if (user.role === UserRole.TENANT) {
      if (visitor.hostUserId !== user.id) {
        throw new AppError('Forbidden: You do not have access to this visitor', 403);
      }
      return visitor;
    }

    throw new AppError('Forbidden: Insufficient permissions', 403);
  }

  public static async update(
    id: string,
    user: { id: string; role: UserRole },
    dto: UpdateVisitorDTO
  ): Promise<unknown> {
    const visitor = await prisma.visitor.findUnique({ where: { id } });
    if (!visitor) {
      throw new AppError('Visitor not found', 404);
    }

    // Check permissions
    if (user.role === UserRole.TENANT || user.role === UserRole.OWNER) {
      if (visitor.hostUserId !== user.id) {
        throw new AppError('Forbidden: You can only edit your own visitors', 403);
      }
      if (visitor.status !== VisitorStatus.PRE_APPROVED && visitor.status !== VisitorStatus.PENDING_APPROVAL) {
        throw new AppError('Cannot update visitor details once checked in or cancelled', 400);
      }
      // Tenants/owners cannot change status directly to CHECKED_IN/OUT
      if (dto.status && dto.status !== VisitorStatus.CANCELLED) {
        delete dto.status;
      }
    } else if (user.role === UserRole.PROPERTY_ADMIN || user.role === UserRole.MANAGER) {
      const assignment = await prisma.userProperty.findUnique({
        where: {
          userId_propertyId: {
            userId: user.id,
            propertyId: visitor.propertyId,
          },
        },
      });
      if (!assignment) {
        throw new AppError('Forbidden: You do not have access to this property', 403);
      }
    }

    const updated = await prisma.visitor.update({
      where: { id },
      data: {
        visitorName: dto.visitorName,
        phone: dto.phone,
        purpose: dto.purpose,
        visitDate: dto.visitDate ? new Date(dto.visitDate) : undefined,
        status: dto.status,
        notes: dto.notes,
      },
      include: {
        property: { select: { id: true, name: true } },
        unit: { select: { id: true, unitNumber: true } },
        hostUser: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    return updated;
  }

  public static async checkIn(
    id: string,
    user: { id: string; role: UserRole }
  ): Promise<unknown> {
    const visitor = await prisma.visitor.findUnique({
      where: { id },
      include: { unit: true },
    });

    if (!visitor) {
      throw new AppError('Visitor not found', 404);
    }

    if (user.role === UserRole.TENANT || user.role === UserRole.OWNER) {
      throw new AppError('Forbidden: Check-in must be processed by property staff or admin', 403);
    }

    if (user.role === UserRole.PROPERTY_ADMIN || user.role === UserRole.MANAGER) {
      const assignment = await prisma.userProperty.findUnique({
        where: {
          userId_propertyId: {
            userId: user.id,
            propertyId: visitor.propertyId,
          },
        },
      });
      if (!assignment) {
        throw new AppError('Forbidden: You do not have access to this property', 403);
      }
    }

    if (visitor.status === VisitorStatus.CHECKED_IN) {
      throw new AppError('Visitor is already checked in', 400);
    }

    if (visitor.status === VisitorStatus.CHECKED_OUT) {
      throw new AppError('Visitor has already checked out', 400);
    }

    if (visitor.status === VisitorStatus.CANCELLED || visitor.status === VisitorStatus.REJECTED) {
      throw new AppError(`Cannot check in visitor with status: ${visitor.status}`, 400);
    }

    const checkedInVisitor = await prisma.visitor.update({
      where: { id },
      data: {
        status: VisitorStatus.CHECKED_IN,
        entryTime: new Date(),
        approvedById: user.id,
      },
      include: {
        property: { select: { id: true, name: true } },
        unit: { select: { id: true, unitNumber: true } },
        hostUser: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    // Notify host if present
    if (checkedInVisitor.hostUserId) {
      await NotificationService.create({
        userId: checkedInVisitor.hostUserId,
        title: 'Visitor Checked In',
        message: `${checkedInVisitor.visitorName} has entered the premises for Unit ${checkedInVisitor.unit.unitNumber}.`,
        metadata: {
          visitorId: checkedInVisitor.id,
          unitId: checkedInVisitor.unitId,
          entryTime: checkedInVisitor.entryTime,
        },
      }).catch((err) => console.error('Failed to notify host of visitor check-in:', err));
    }

    return checkedInVisitor;
  }

  public static async checkOut(
    id: string,
    user: { id: string; role: UserRole }
  ): Promise<unknown> {
    const visitor = await prisma.visitor.findUnique({
      where: { id },
      include: { unit: true },
    });

    if (!visitor) {
      throw new AppError('Visitor not found', 404);
    }

    if (user.role === UserRole.TENANT || user.role === UserRole.OWNER) {
      throw new AppError('Forbidden: Check-out must be processed by property staff or admin', 403);
    }

    if (user.role === UserRole.PROPERTY_ADMIN || user.role === UserRole.MANAGER) {
      const assignment = await prisma.userProperty.findUnique({
        where: {
          userId_propertyId: {
            userId: user.id,
            propertyId: visitor.propertyId,
          },
        },
      });
      if (!assignment) {
        throw new AppError('Forbidden: You do not have access to this property', 403);
      }
    }

    if (visitor.status !== VisitorStatus.CHECKED_IN) {
      throw new AppError('Cannot check out a visitor who is not currently checked in', 400);
    }

    const checkedOutVisitor = await prisma.visitor.update({
      where: { id },
      data: {
        status: VisitorStatus.CHECKED_OUT,
        exitTime: new Date(),
      },
      include: {
        property: { select: { id: true, name: true } },
        unit: { select: { id: true, unitNumber: true } },
        hostUser: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    // Notify host if present
    if (checkedOutVisitor.hostUserId) {
      await NotificationService.create({
        userId: checkedOutVisitor.hostUserId,
        title: 'Visitor Checked Out',
        message: `${checkedOutVisitor.visitorName} has departed from Unit ${checkedOutVisitor.unit.unitNumber}.`,
        metadata: {
          visitorId: checkedOutVisitor.id,
          unitId: checkedOutVisitor.unitId,
          exitTime: checkedOutVisitor.exitTime,
        },
      }).catch((err) => console.error('Failed to notify host of visitor check-out:', err));
    }

    return checkedOutVisitor;
  }
}
