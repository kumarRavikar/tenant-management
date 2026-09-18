import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database';
import { AppError } from '../../middleware/error.middleware';
import { getPagination, createPaginationMeta, PaginationMeta } from '../../utils/pagination';
import { CreateBuildingDTO, UpdateBuildingDTO, BuildingFilterQuery } from './building.types';
import { PropertyService } from '../properties/property.service';
import { UserRole } from '../auth/auth.types';

export class BuildingService {
  public static async list(
    user: { id: string; role: UserRole },
    query: BuildingFilterQuery
  ): Promise<{ buildings: unknown[]; meta: PaginationMeta }> {
    const { page, limit, skip } = getPagination(query);

    // If propertyId is provided, verify user has access to it
    if (query.propertyId) {
      await PropertyService.getById(user, query.propertyId);
    }

    // Role-based building filtering
    let where: Prisma.BuildingWhereInput = {};
    if (user.role === UserRole.SUPER_ADMIN) {
      where = query.propertyId ? { propertyId: query.propertyId } : {};
    } else if (user.role === UserRole.PROPERTY_ADMIN || user.role === UserRole.MANAGER) {
      const assignments = await prisma.userProperty.findMany({
        where: { userId: user.id },
        select: { propertyId: true },
      });
      const allowedPropertyIds = assignments.map((a) => a.propertyId);
      if (query.propertyId && !allowedPropertyIds.includes(query.propertyId)) {
        throw new AppError('Forbidden: Access to this property is denied', 403, 'FORBIDDEN');
      }
      where = {
        propertyId: query.propertyId || { in: allowedPropertyIds },
      };
    } else {
      // Owner or Tenant scope
      where = {
        property: {
          assignments: {
            some: { userId: user.id },
          },
        },
      };
    }

    if (query.search) {
      where.name = { contains: query.search, mode: 'insensitive' };
    }

    const [total, buildings] = await Promise.all([
      prisma.building.count({ where }),
      prisma.building.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          property: {
            select: { id: true, name: true, city: true },
          },
          _count: {
            select: { floors: true },
          },
        },
      }),
    ]);

    return {
      buildings,
      meta: createPaginationMeta(total, page, limit),
    };
  }

  public static async create(
    user: { id: string; role: UserRole },
    dto: CreateBuildingDTO
  ): Promise<unknown> {
    // Verify access to parent property
    await PropertyService.getById(user, dto.propertyId);

    return prisma.building.create({
      data: {
        propertyId: dto.propertyId,
        name: dto.name,
        totalFloors: dto.totalFloors || null,
      },
    });
  }

  public static async getById(
    user: { id: string; role: UserRole },
    buildingId: string
  ): Promise<unknown> {
    const building = await prisma.building.findUnique({
      where: { id: buildingId },
      include: {
        property: true,
        floors: {
          orderBy: { floorNumber: 'asc' },
          include: {
            _count: { select: { units: true } },
          },
        },
      },
    });

    if (!building) {
      throw new AppError('Building not found', 404, 'BUILDING_NOT_FOUND');
    }

    // Verify access to parent property
    await PropertyService.getById(user, building.propertyId);

    return building;
  }

  public static async update(
    user: { id: string; role: UserRole },
    buildingId: string,
    dto: UpdateBuildingDTO
  ): Promise<unknown> {
    await this.getById(user, buildingId);

    return prisma.building.update({
      where: { id: buildingId },
      data: dto,
    });
  }

  public static async delete(
    user: { id: string; role: UserRole },
    buildingId: string
  ): Promise<void> {
    const building = (await this.getById(user, buildingId)) as { id: string; propertyId: string };

    // Check if any unit in building has active lease
    const activeLeaseCount = await prisma.lease.count({
      where: {
        status: 'ACTIVE',
        unit: {
          floor: {
            buildingId: building.id,
          },
        },
      },
    });

    if (activeLeaseCount > 0) {
      throw new AppError(
        'Cannot delete building containing active leases.',
        400,
        'ACTIVE_LEASES_EXIST'
      );
    }

    await prisma.building.delete({
      where: { id: buildingId },
    });
  }
}

