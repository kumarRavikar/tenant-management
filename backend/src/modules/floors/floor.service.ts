import { prisma } from '../../config/database';
import { AppError } from '../../middleware/error.middleware';
import { getPagination, createPaginationMeta, PaginationMeta } from '../../utils/pagination';
import { CreateFloorDTO, UpdateFloorDTO, FloorFilterQuery } from './floor.types';
import { BuildingService } from '../buildings/building.service';
import { UserRole } from '../auth/auth.types';

export class FloorService {
  public static async list(
    user: { id: string; role: UserRole },
    query: FloorFilterQuery
  ): Promise<{ floors: unknown[]; meta: PaginationMeta }> {
    const { page, limit, skip } = getPagination(query);

    if (query.buildingId) {
      // Verify building access
      await BuildingService.getById(user, query.buildingId);
    }

    const where = query.buildingId ? { buildingId: query.buildingId } : {};

    const [total, floors] = await Promise.all([
      prisma.floor.count({ where }),
      prisma.floor.findMany({
        where,
        skip,
        take: limit,
        orderBy: { floorNumber: 'asc' },
        include: {
          building: {
            select: {
              id: true,
              name: true,
              property: { select: { id: true, name: true } },
            },
          },
          _count: { select: { units: true } },
        },
      }),
    ]);

    return {
      floors,
      meta: createPaginationMeta(total, page, limit),
    };
  }

  public static async create(
    user: { id: string; role: UserRole },
    dto: CreateFloorDTO
  ): Promise<unknown> {
    await BuildingService.getById(user, dto.buildingId);

    const existing = await prisma.floor.findUnique({
      where: {
        buildingId_floorNumber: {
          buildingId: dto.buildingId,
          floorNumber: dto.floorNumber,
        },
      },
    });

    if (existing) {
      throw new AppError(
        `Floor number ${dto.floorNumber} already exists in this building.`,
        409,
        'FLOOR_EXISTS'
      );
    }

    return prisma.floor.create({
      data: {
        buildingId: dto.buildingId,
        floorNumber: dto.floorNumber,
        name: dto.name || `Floor ${dto.floorNumber}`,
      },
    });
  }

  public static async getById(
    user: { id: string; role: UserRole },
    floorId: string
  ): Promise<unknown> {
    const floor = await prisma.floor.findUnique({
      where: { id: floorId },
      include: {
        building: {
          include: {
            property: true,
          },
        },
        units: {
          orderBy: { unitNumber: 'asc' },
        },
      },
    });

    if (!floor) {
      throw new AppError('Floor not found', 404, 'FLOOR_NOT_FOUND');
    }

    // Verify parent building access
    await BuildingService.getById(user, floor.buildingId);

    return floor;
  }

  public static async update(
    user: { id: string; role: UserRole },
    floorId: string,
    dto: UpdateFloorDTO
  ): Promise<unknown> {
    await this.getById(user, floorId);

    return prisma.floor.update({
      where: { id: floorId },
      data: dto,
    });
  }

  public static async delete(
    user: { id: string; role: UserRole },
    floorId: string
  ): Promise<void> {
    const floor = (await this.getById(user, floorId)) as { id: string };

    const activeLeaseCount = await prisma.lease.count({
      where: {
        status: 'ACTIVE',
        unit: {
          floorId: floor.id,
        },
      },
    });

    if (activeLeaseCount > 0) {
      throw new AppError('Cannot delete floor containing active leases.', 400, 'ACTIVE_LEASES_EXIST');
    }

    await prisma.floor.delete({
      where: { id: floorId },
    });
  }
}

