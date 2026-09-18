import { Prisma, LeaseStatus, UnitStatus } from '@prisma/client';
import { prisma } from '../../config/database';
import { AppError } from '../../middleware/error.middleware';
import { getPagination, createPaginationMeta, PaginationMeta } from '../../utils/pagination';
import { CreateLeaseDTO, UpdateLeaseDTO, TerminateLeaseDTO, RenewLeaseDTO, LeaseFilterQuery } from './lease.types';
import { UserRole } from '../auth/auth.types';

export class LeaseService {
  /**
   * Helper to verify user permissions on a given property ID
   */
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

  /**
   * Helper to check for overlapping active leases on a unit
   */
  private static async checkActiveConflict(
    unitId: string,
    startDate: Date,
    endDate: Date,
    excludeLeaseId?: string
  ): Promise<void> {
    const conflicting = await prisma.lease.findFirst({
      where: {
        unitId,
        status: LeaseStatus.ACTIVE,
        id: excludeLeaseId ? { not: excludeLeaseId } : undefined,
        AND: [
          { startDate: { lte: endDate } },
          { endDate: { gte: startDate } },
        ],
      },
    });

    if (conflicting) {
      throw new AppError(
        'An active lease already exists for this unit during the specified date range',
        409
      );
    }
  }

  public static async list(
    user: { id: string; role: UserRole },
    query: LeaseFilterQuery
  ): Promise<{ leases: unknown[]; meta: PaginationMeta }> {
    const { page, limit, skip } = getPagination(query);

    const where: Prisma.LeaseWhereInput = {};

    // Direct filters
    if (query.unitId) {
      where.unitId = query.unitId;
    }
    if (query.tenantProfileId) {
      where.tenantProfileId = query.tenantProfileId;
    }
    if (query.status) {
      where.status = query.status;
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
    if (query.startDate) {
      where.startDate = { gte: new Date(query.startDate) };
    }
    if (query.endDate) {
      where.endDate = { lte: new Date(query.endDate) };
    }

    // Role-based scope enforcement
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
      where.tenant = {
        userId: user.id,
      };
    }

    const [total, leases] = await Promise.all([
      prisma.lease.count({ where }),
      prisma.lease.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          unit: {
            select: {
              id: true,
              unitNumber: true,
              unitType: true,
              status: true,
              floor: {
                select: {
                  id: true,
                  floorNumber: true,
                  building: {
                    select: {
                      id: true,
                      name: true,
                      property: {
                        select: {
                          id: true,
                          name: true,
                          city: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          tenant: {
            select: {
              id: true,
              onboardingStatus: true,
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  phone: true,
                },
              },
            },
          },
        },
      }),
    ]);

    return {
      leases,
      meta: createPaginationMeta(page, limit, total),
    };
  }

  public static async getById(id: string, user: { id: string; role: UserRole }): Promise<unknown> {
    const lease = await prisma.lease.findUnique({
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
                ownerProfile: {
                  include: {
                    user: {
                      select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        tenant: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
              },
            },
          },
        },
      },
    });

    if (!lease) {
      throw new AppError('Lease not found', 404);
    }

    // Role-based scope verification
    if (user.role === UserRole.PROPERTY_ADMIN || user.role === UserRole.MANAGER) {
      await this.verifyPropertyScope(lease.unit.floor.building.propertyId, user);
    } else if (user.role === UserRole.OWNER) {
      const isOwner = lease.unit.owners.some((o) => o.ownerProfile.userId === user.id);
      if (!isOwner) {
        throw new AppError('Forbidden: You do not own this unit', 403);
      }
    } else if (user.role === UserRole.TENANT) {
      if (lease.tenant.userId !== user.id) {
        throw new AppError('Forbidden: This is not your lease', 403);
      }
    }

    return lease;
  }

  public static async create(
    dto: CreateLeaseDTO,
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
      },
    });

    if (!unit) {
      throw new AppError('Unit not found', 404);
    }

    await this.verifyPropertyScope(unit.floor.building.propertyId, user);

    const tenant = await prisma.tenantProfile.findUnique({
      where: { id: dto.tenantProfileId },
    });

    if (!tenant) {
      throw new AppError('Tenant profile not found', 404);
    }

    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);
    const status = dto.status || LeaseStatus.DRAFT;

    if (status === LeaseStatus.ACTIVE) {
      await this.checkActiveConflict(dto.unitId, startDate, endDate);
    }

    return prisma.$transaction(async (tx) => {
      const lease = await tx.lease.create({
        data: {
          unitId: dto.unitId,
          tenantProfileId: dto.tenantProfileId,
          startDate,
          endDate,
          monthlyRent: dto.monthlyRent,
          securityDeposit: dto.securityDeposit,
          status,
          moveInDate: dto.moveInDate ? new Date(dto.moveInDate) : undefined,
          terms: dto.terms,
        },
        include: {
          unit: true,
          tenant: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
          },
        },
      });

      if (status === LeaseStatus.ACTIVE) {
        await tx.unit.update({
          where: { id: dto.unitId },
          data: { status: UnitStatus.OCCUPIED },
        });
      }

      return lease;
    });
  }

  public static async update(
    id: string,
    dto: UpdateLeaseDTO,
    user: { id: string; role: UserRole }
  ): Promise<unknown> {
    const existing = await prisma.lease.findUnique({
      where: { id },
      include: {
        unit: {
          include: {
            floor: {
              include: {
                building: true,
              },
            },
          },
        },
      },
    });

    if (!existing) {
      throw new AppError('Lease not found', 404);
    }

    await this.verifyPropertyScope(existing.unit.floor.building.propertyId, user);

    const targetStatus = dto.status ?? existing.status;
    const targetStartDate = dto.startDate ? new Date(dto.startDate) : existing.startDate;
    const targetEndDate = dto.endDate ? new Date(dto.endDate) : existing.endDate;

    if (targetStatus === LeaseStatus.ACTIVE) {
      await this.checkActiveConflict(existing.unitId, targetStartDate, targetEndDate, existing.id);
    }

    return prisma.$transaction(async (tx) => {
      const updated = await tx.lease.update({
        where: { id },
        data: {
          startDate: dto.startDate ? new Date(dto.startDate) : undefined,
          endDate: dto.endDate ? new Date(dto.endDate) : undefined,
          monthlyRent: dto.monthlyRent,
          securityDeposit: dto.securityDeposit,
          status: dto.status,
          moveInDate: dto.moveInDate ? new Date(dto.moveInDate) : undefined,
          moveOutDate: dto.moveOutDate ? new Date(dto.moveOutDate) : undefined,
          terms: dto.terms,
        },
        include: {
          unit: true,
          tenant: true,
        },
      });

      // Update unit status if lease status changed
      if (existing.status !== targetStatus) {
        if (targetStatus === LeaseStatus.ACTIVE) {
          await tx.unit.update({
            where: { id: existing.unitId },
            data: { status: UnitStatus.OCCUPIED },
          });
        } else if (existing.status === LeaseStatus.ACTIVE) {
          // Check if any other active lease remains on this unit
          const otherActive = await tx.lease.findFirst({
            where: {
              unitId: existing.unitId,
              status: LeaseStatus.ACTIVE,
              id: { not: existing.id },
            },
          });
          if (!otherActive) {
            await tx.unit.update({
              where: { id: existing.unitId },
              data: { status: UnitStatus.VACANT },
            });
          }
        }
      }

      return updated;
    });
  }

  public static async terminate(
    id: string,
    dto: TerminateLeaseDTO,
    user: { id: string; role: UserRole }
  ): Promise<unknown> {
    const existing = await prisma.lease.findUnique({
      where: { id },
      include: {
        unit: {
          include: {
            floor: {
              include: {
                building: true,
              },
            },
          },
        },
      },
    });

    if (!existing) {
      throw new AppError('Lease not found', 404);
    }

    await this.verifyPropertyScope(existing.unit.floor.building.propertyId, user);

    if (existing.status === LeaseStatus.TERMINATED) {
      throw new AppError('Lease is already terminated', 400);
    }

    const moveOutDate = dto.moveOutDate ? new Date(dto.moveOutDate) : new Date();

    return prisma.$transaction(async (tx) => {
      const updated = await tx.lease.update({
        where: { id },
        data: {
          status: LeaseStatus.TERMINATED,
          moveOutDate,
          terms: dto.terms ? `${existing.terms || ''}\nTermination Notes: ${dto.terms}`.trim() : undefined,
        },
      });

      // If unit has no other active leases, set status to VACANT
      const otherActive = await tx.lease.findFirst({
        where: {
          unitId: existing.unitId,
          status: LeaseStatus.ACTIVE,
          id: { not: existing.id },
        },
      });

      if (!otherActive) {
        await tx.unit.update({
          where: { id: existing.unitId },
          data: { status: UnitStatus.VACANT },
        });
      }

      return updated;
    });
  }

  public static async renew(
    id: string,
    dto: RenewLeaseDTO,
    user: { id: string; role: UserRole }
  ): Promise<unknown> {
    const existing = await prisma.lease.findUnique({
      where: { id },
      include: {
        unit: {
          include: {
            floor: {
              include: {
                building: true,
              },
            },
          },
        },
      },
    });

    if (!existing) {
      throw new AppError('Lease not found', 404);
    }

    await this.verifyPropertyScope(existing.unit.floor.building.propertyId, user);

    const renewalStart = new Date(dto.startDate);
    const renewalEnd = new Date(dto.endDate);

    // Ensure renewal start date is >= existing end date
    if (renewalStart < existing.endDate) {
      throw new AppError('Renewal start date cannot be earlier than current lease end date', 400);
    }

    // Check conflict for new renewal window
    await this.checkActiveConflict(existing.unitId, renewalStart, renewalEnd);

    return prisma.$transaction(async (tx) => {
      // Create new sequential lease
      const newLease = await tx.lease.create({
        data: {
          unitId: existing.unitId,
          tenantProfileId: existing.tenantProfileId,
          startDate: renewalStart,
          endDate: renewalEnd,
          monthlyRent: dto.monthlyRent,
          securityDeposit: dto.securityDeposit ?? existing.securityDeposit,
          status: LeaseStatus.ACTIVE,
          terms: dto.terms ?? `Renewed from lease ${existing.id}`,
        },
        include: {
          unit: true,
          tenant: true,
        },
      });

      // Ensure unit status is OCCUPIED
      await tx.unit.update({
        where: { id: existing.unitId },
        data: { status: UnitStatus.OCCUPIED },
      });

      return newLease;
    });
  }
}

