import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database';
import { AppError } from '../../middleware/error.middleware';
import { getPagination, createPaginationMeta, PaginationMeta } from '../../utils/pagination';
import { CreateOwnerDTO, UpdateOwnerDTO, AssignUnitDTO, OwnerFilterQuery } from './owner.types';
import { UserRole } from '../auth/auth.types';

export class OwnerService {
  public static async list(
    user: { id: string; role: UserRole },
    query: OwnerFilterQuery
  ): Promise<{ owners: unknown[]; meta: PaginationMeta }> {
    const { page, limit, skip } = getPagination(query);

    // If caller is OWNER, they can only view their own profile
    const where: Prisma.OwnerProfileWhereInput = {};
    if (user.role === UserRole.OWNER) {
      where.userId = user.id;
    }

    if (query.search) {
      where.user = {
        OR: [
          { firstName: { contains: query.search, mode: 'insensitive' } },
          { lastName: { contains: query.search, mode: 'insensitive' } },
          { email: { contains: query.search, mode: 'insensitive' } },
        ],
      };
    }

    const [total, owners] = await Promise.all([
      prisma.ownerProfile.count({ where }),
      prisma.ownerProfile.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              phone: true,
              isActive: true,
            },
          },
          _count: {
            select: { ownedUnits: true },
          },
        },
      }),
    ]);

    return {
      owners,
      meta: createPaginationMeta(total, page, limit),
    };
  }

  public static async create(
    user: { id: string; role: UserRole },
    dto: CreateOwnerDTO
  ): Promise<unknown> {
    if (user.role !== UserRole.SUPER_ADMIN && user.role !== UserRole.PROPERTY_ADMIN) {
      throw new AppError('Forbidden: Only Administrators can create owner profiles', 403, 'FORBIDDEN');
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: dto.userId },
    });

    if (!targetUser) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    const existingProfile = await prisma.ownerProfile.findUnique({
      where: { userId: dto.userId },
    });

    if (existingProfile) {
      throw new AppError('Owner profile already exists for this user', 409, 'PROFILE_EXISTS');
    }

    // Ensure user role is updated to OWNER if not already
    if (targetUser.role !== UserRole.OWNER && targetUser.role !== UserRole.SUPER_ADMIN) {
      await prisma.user.update({
        where: { id: dto.userId },
        data: { role: UserRole.OWNER },
      });
    }

    return prisma.ownerProfile.create({
      data: {
        userId: dto.userId,
        taxId: dto.taxId || null,
        bankAccountNumber: dto.bankAccountNumber || null,
        bankName: dto.bankName || null,
        emergencyContact: dto.emergencyContact || null,
        notes: dto.notes || null,
      },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true, phone: true },
        },
      },
    });
  }

  public static async getById(
    user: { id: string; role: UserRole },
    ownerId: string
  ): Promise<unknown> {
    const owner = await prisma.ownerProfile.findUnique({
      where: { id: ownerId },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true, phone: true, createdAt: true },
        },
        ownedUnits: {
          include: {
            unit: {
              include: {
                floor: {
                  include: {
                    building: {
                      include: {
                        property: { select: { id: true, name: true, city: true } },
                      },
                    },
                  },
                },
                leases: {
                  where: { status: 'ACTIVE' },
                  take: 1,
                  include: {
                    tenant: {
                      include: {
                        user: { select: { firstName: true, lastName: true, email: true } },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!owner) {
      throw new AppError('Owner profile not found', 404, 'OWNER_NOT_FOUND');
    }

    // Access check: Owner can only view their own profile
    if (user.role === UserRole.OWNER && owner.userId !== user.id) {
      throw new AppError('Forbidden: You can only view your own owner profile', 403, 'FORBIDDEN');
    }

    return owner;
  }

  public static async update(
    user: { id: string; role: UserRole },
    ownerId: string,
    dto: UpdateOwnerDTO
  ): Promise<unknown> {
    await this.getById(user, ownerId);

    return prisma.ownerProfile.update({
      where: { id: ownerId },
      data: dto,
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });
  }

  public static async assignUnit(
    user: { id: string; role: UserRole },
    ownerProfileId: string,
    dto: AssignUnitDTO
  ): Promise<unknown> {
    if (user.role !== UserRole.SUPER_ADMIN && user.role !== UserRole.PROPERTY_ADMIN) {
      throw new AppError('Forbidden: Only Administrators can assign units to owners', 403, 'FORBIDDEN');
    }

    const [owner, unit] = await Promise.all([
      prisma.ownerProfile.findUnique({ where: { id: ownerProfileId } }),
      prisma.unit.findUnique({ where: { id: dto.unitId } }),
    ]);

    if (!owner) throw new AppError('Owner profile not found', 404, 'OWNER_NOT_FOUND');
    if (!unit) throw new AppError('Unit not found', 404, 'UNIT_NOT_FOUND');

    return prisma.ownerUnit.upsert({
      where: {
        ownerProfileId_unitId: {
          ownerProfileId,
          unitId: dto.unitId,
        },
      },
      update: {
        ownershipPercentage: dto.ownershipPercentage || 100.0,
      },
      create: {
        ownerProfileId,
        unitId: dto.unitId,
        ownershipPercentage: dto.ownershipPercentage || 100.0,
      },
      include: {
        unit: true,
      },
    });
  }

  public static async unassignUnit(
    user: { id: string; role: UserRole },
    ownerProfileId: string,
    unitId: string
  ): Promise<void> {
    if (user.role !== UserRole.SUPER_ADMIN && user.role !== UserRole.PROPERTY_ADMIN) {
      throw new AppError('Forbidden: Only Administrators can unassign units', 403, 'FORBIDDEN');
    }

    await prisma.ownerUnit.deleteMany({
      where: {
        ownerProfileId,
        unitId,
      },
    });
  }

  public static async getDashboard(
    user: { id: string; role: UserRole },
    ownerProfileId: string
  ): Promise<unknown> {
    const owner = (await this.getById(user, ownerProfileId)) as {
      id: string;
      ownedUnits: {
        ownershipPercentage: number;
        unit: {
          id: string;
          status: string;
          baseRent: Prisma.Decimal;
          maintenanceCharge: Prisma.Decimal;
          leases: { id: string; monthlyRent: Prisma.Decimal }[];
        };
      }[];
    };

    const totalUnits = owner.ownedUnits.length;
    let occupiedUnits = 0;
    let vacantUnits = 0;
    let monthlyRentTotal = 0;

    for (const item of owner.ownedUnits) {
      const { unit, ownershipPercentage } = item;
      const shareMultiplier = (ownershipPercentage || 100) / 100;

      if (unit.status === 'OCCUPIED') {
        occupiedUnits++;
        const activeRent = unit.leases?.[0]?.monthlyRent || unit.baseRent;
        monthlyRentTotal += Number(activeRent) * shareMultiplier;
      } else if (unit.status === 'VACANT') {
        vacantUnits++;
      }
    }

    const occupancyRate = totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0;

    return {
      totalUnits,
      occupiedUnits,
      vacantUnits,
      otherUnits: totalUnits - occupiedUnits - vacantUnits,
      occupancyRate: Math.round(occupancyRate * 10) / 10,
      monthlyRentTotal: Math.round(monthlyRentTotal * 100) / 100,
    };
  }
}

