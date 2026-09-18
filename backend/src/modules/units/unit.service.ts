import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database';
import { AppError } from '../../middleware/error.middleware';
import { getPagination, createPaginationMeta, PaginationMeta } from '../../utils/pagination';
import { CreateUnitDTO, UpdateUnitDTO, UnitFilterQuery } from './unit.types';
import { FloorService } from '../floors/floor.service';
import { UserRole } from '../auth/auth.types';

export class UnitService {
  public static async list(
    user: { id: string; role: UserRole },
    query: UnitFilterQuery
  ): Promise<{ units: unknown[]; meta: PaginationMeta }> {
    const { page, limit, skip } = getPagination(query);

    const where: Prisma.UnitWhereInput = {};

    // Floor / Building / Property Filter
    if (query.floorId) {
      where.floorId = query.floorId;
    } else if (query.buildingId) {
      where.floor = { buildingId: query.buildingId };
    } else if (query.propertyId) {
      where.floor = { building: { propertyId: query.propertyId } };
    }

    // Role-based scope
    if (user.role === UserRole.PROPERTY_ADMIN || user.role === UserRole.MANAGER) {
      const assignments = await prisma.userProperty.findMany({
        where: { userId: user.id },
        select: { propertyId: true },
      });
      const allowedProperties = assignments.map((a) => a.propertyId);
      where.floor = {
        building: {
          propertyId: { in: allowedProperties },
        },
      };
    } else if (user.role === UserRole.OWNER) {
      where.owners = {
        some: {
          ownerProfile: { userId: user.id },
        },
      };
    } else if (user.role === UserRole.TENANT) {
      where.leases = {
        some: {
          tenant: { userId: user.id },
        },
      };
    }

    // Search filter
    if (query.search) {
      where.OR = [
        { unitNumber: { contains: query.search, mode: 'insensitive' } },
        { unitType: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    // Availability filter
    if (query.isAvailable === 'true') {
      where.status = 'VACANT';
    } else if (query.status) {
      where.status = query.status;
    }

    if (query.minBedrooms) {
      where.bedrooms = { gte: parseInt(query.minBedrooms, 10) };
    }

    if (query.maxRent) {
      where.baseRent = { lte: parseFloat(query.maxRent) };
    }

    const [total, units] = await Promise.all([
      prisma.unit.count({ where }),
      prisma.unit.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ floor: { building: { name: 'asc' } } }, { unitNumber: 'asc' }],
        include: {
          floor: {
            include: {
              building: {
                include: {
                  property: { select: { id: true, name: true } },
                },
              },
            },
          },
          owners: {
            include: {
              ownerProfile: {
                include: {
                  user: { select: { id: true, firstName: true, lastName: true, email: true } },
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
                  user: { select: { id: true, firstName: true, lastName: true, email: true } },
                },
              },
            },
          },
        },
      }),
    ]);

    return {
      units,
      meta: createPaginationMeta(total, page, limit),
    };
  }

  public static async create(
    user: { id: string; role: UserRole },
    dto: CreateUnitDTO
  ): Promise<unknown> {
    await FloorService.getById(user, dto.floorId);

    const existing = await prisma.unit.findUnique({
      where: {
        floorId_unitNumber: {
          floorId: dto.floorId,
          unitNumber: dto.unitNumber,
        },
      },
    });

    if (existing) {
      throw new AppError(
        `Unit number '${dto.unitNumber}' already exists on this floor.`,
        409,
        'UNIT_EXISTS'
      );
    }

    return prisma.unit.create({
      data: {
        floorId: dto.floorId,
        unitNumber: dto.unitNumber,
        unitType: dto.unitType || 'Standard',
        bedrooms: dto.bedrooms ?? 1,
        bathrooms: dto.bathrooms ?? 1,
        area: dto.area || null,
        baseRent: dto.baseRent,
        maintenanceCharge: dto.maintenanceCharge ?? 0,
        status: dto.status || 'VACANT',
      },
    });
  }

  public static async getById(
    user: { id: string; role: UserRole },
    unitId: string
  ): Promise<unknown> {
    const unit = await prisma.unit.findUnique({
      where: { id: unitId },
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
                user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
              },
            },
          },
        },
        leases: {
          orderBy: { startDate: 'desc' },
          include: {
            tenant: {
              include: {
                user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
              },
            },
          },
        },
      },
    });

    if (!unit) {
      throw new AppError('Unit not found', 404, 'UNIT_NOT_FOUND');
    }

    // Verify parent building/property access
    await FloorService.getById(user, unit.floorId);

    return unit;
  }

  public static async update(
    user: { id: string; role: UserRole },
    unitId: string,
    dto: UpdateUnitDTO
  ): Promise<unknown> {
    await this.getById(user, unitId);

    return prisma.unit.update({
      where: { id: unitId },
      data: dto,
    });
  }
}

