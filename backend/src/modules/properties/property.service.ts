import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database';
import { AppError } from '../../middleware/error.middleware';
import { getPagination, createPaginationMeta, PaginationMeta } from '../../utils/pagination';
import { CreatePropertyDTO, UpdatePropertyDTO, PropertyFilterQuery } from './property.types';
import { UserRole } from '../auth/auth.types';

export class PropertyService {
  /**
   * Builds property query filters based on user role and property assignment scope.
   */
  private static async getScopeWhereClause(user: { id: string; role: UserRole }): Promise<Prisma.PropertyWhereInput> {
    if (user.role === UserRole.SUPER_ADMIN) {
      return {};
    }

    if (user.role === UserRole.PROPERTY_ADMIN || user.role === UserRole.MANAGER) {
      const assignments = await prisma.userProperty.findMany({
        where: { userId: user.id },
        select: { propertyId: true },
      });
      const assignedIds = assignments.map((a) => a.propertyId);
      return { id: { in: assignedIds } };
    }

    if (user.role === UserRole.OWNER) {
      // Properties containing units owned by this owner
      return {
        buildings: {
          some: {
            floors: {
              some: {
                units: {
                  some: {
                    owners: {
                      some: {
                        ownerProfile: { userId: user.id },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      };
    }

    if (user.role === UserRole.TENANT) {
      // Properties containing units leased by this tenant
      return {
        buildings: {
          some: {
            floors: {
              some: {
                units: {
                  some: {
                    leases: {
                      some: {
                        tenant: { userId: user.id },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      };
    }

    return { id: 'no-access' };
  }

  public static async list(
    user: { id: string; role: UserRole },
    query: PropertyFilterQuery
  ): Promise<{ properties: unknown[]; meta: PaginationMeta }> {
    const { page, limit, skip } = getPagination(query);
    const scopeWhere = await this.getScopeWhereClause(user);

    const where: Prisma.PropertyWhereInput = {
      ...scopeWhere,
      ...(query.city && { city: { contains: query.city, mode: 'insensitive' } }),
      ...(query.state && { state: { contains: query.state, mode: 'insensitive' } }),
      ...(query.search && {
        OR: [
          { name: { contains: query.search, mode: 'insensitive' } },
          { address: { contains: query.search, mode: 'insensitive' } },
          { city: { contains: query.search, mode: 'insensitive' } },
        ],
      }),
    };

    const [total, properties] = await Promise.all([
      prisma.property.count({ where }),
      prisma.property.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              buildings: true,
            },
          },
        },
      }),
    ]);

    return {
      properties,
      meta: createPaginationMeta(total, page, limit),
    };
  }

  public static async create(
    user: { id: string; role: UserRole },
    dto: CreatePropertyDTO
  ): Promise<unknown> {
    const property = await prisma.property.create({
      data: {
        name: dto.name,
        address: dto.address,
        city: dto.city,
        state: dto.state || null,
        postalCode: dto.postalCode || null,
        country: dto.country || 'USA',
        description: dto.description || null,
      },
    });

    // If created by a Property Admin, automatically assign them
    if (user.role === UserRole.PROPERTY_ADMIN) {
      await prisma.userProperty.create({
        data: {
          userId: user.id,
          propertyId: property.id,
        },
      });
    }

    return property;
  }

  public static async getById(
    user: { id: string; role: UserRole },
    propertyId: string
  ): Promise<unknown> {
    const scopeWhere = await this.getScopeWhereClause(user);

    const property = await prisma.property.findFirst({
      where: {
        id: propertyId,
        ...scopeWhere,
      },
      include: {
        buildings: {
          include: {
            _count: {
              select: { floors: true },
            },
          },
        },
        assignments: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
              },
            },
          },
        },
        _count: {
          select: {
            buildings: true,
          },
        },
      },
    });

    if (!property) {
      throw new AppError('Property not found or unauthorized', 404, 'PROPERTY_NOT_FOUND');
    }

    return property;
  }

  public static async update(
    user: { id: string; role: UserRole },
    propertyId: string,
    dto: UpdatePropertyDTO
  ): Promise<unknown> {
    // Verify access
    await this.getById(user, propertyId);

    return prisma.property.update({
      where: { id: propertyId },
      data: dto,
    });
  }

  public static async delete(
    user: { id: string; role: UserRole },
    propertyId: string
  ): Promise<void> {
    // Only SUPER_ADMIN can delete properties
    if (user.role !== UserRole.SUPER_ADMIN) {
      throw new AppError('Forbidden: Only Super Admin can delete properties', 403, 'FORBIDDEN');
    }

    // Safety check: ensure no active leases exist in any unit belonging to this property
    const activeLeaseCount = await prisma.lease.count({
      where: {
        status: 'ACTIVE',
        unit: {
          floor: {
            building: {
              propertyId,
            },
          },
        },
      },
    });

    if (activeLeaseCount > 0) {
      throw new AppError(
        'Cannot delete property containing active leases. Terminate all leases first.',
        400,
        'ACTIVE_LEASES_EXIST'
      );
    }

    await prisma.property.delete({
      where: { id: propertyId },
    });
  }
}

