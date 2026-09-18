import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database';
import { AppError } from '../../middleware/error.middleware';
import { getPagination, createPaginationMeta, PaginationMeta } from '../../utils/pagination';
import { CreateTenantDTO, UpdateTenantDTO, TenantFilterQuery } from './tenant.types';
import { UserRole } from '../auth/auth.types';

export class TenantService {
  public static async list(
    user: { id: string; role: UserRole },
    query: TenantFilterQuery
  ): Promise<{ tenants: unknown[]; meta: PaginationMeta }> {
    const { page, limit, skip } = getPagination(query);

    const where: Prisma.TenantProfileWhereInput = {};

    // Tenant can only see their own profile
    if (user.role === UserRole.TENANT) {
      where.userId = user.id;
    } else if (user.role === UserRole.PROPERTY_ADMIN || user.role === UserRole.MANAGER) {
      // Tenants with leases in assigned properties
      const assignments = await prisma.userProperty.findMany({
        where: { userId: user.id },
        select: { propertyId: true },
      });
      const allowedProperties = assignments.map((a) => a.propertyId);
      where.leases = {
        some: {
          unit: {
            floor: {
              building: {
                propertyId: { in: allowedProperties },
              },
            },
          },
        },
      };
    }

    if (query.onboardingStatus) {
      where.onboardingStatus = query.onboardingStatus;
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

    const [total, tenants] = await Promise.all([
      prisma.tenantProfile.count({ where }),
      prisma.tenantProfile.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true, email: true, phone: true, isActive: true },
          },
          _count: {
            select: { leases: true },
          },
        },
      }),
    ]);

    return {
      tenants,
      meta: createPaginationMeta(total, page, limit),
    };
  }

  public static async create(
    user: { id: string; role: UserRole },
    dto: CreateTenantDTO
  ): Promise<unknown> {
    const targetUser = await prisma.user.findUnique({
      where: { id: dto.userId },
    });

    if (!targetUser) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    const existingProfile = await prisma.tenantProfile.findUnique({
      where: { userId: dto.userId },
    });

    if (existingProfile) {
      throw new AppError('Tenant profile already exists for this user', 409, 'PROFILE_EXISTS');
    }

    return prisma.tenantProfile.create({
      data: {
        userId: dto.userId,
        emergencyContactName: dto.emergencyContactName || null,
        emergencyContactPhone: dto.emergencyContactPhone || null,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : null,
        employmentStatus: dto.employmentStatus || null,
        employerName: dto.employerName || null,
        annualIncome: dto.annualIncome || null,
        documents: (dto.documents || []) as unknown as Prisma.InputJsonValue,
        onboardingStatus: dto.onboardingStatus || 'PENDING',
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
    tenantId: string
  ): Promise<unknown> {
    const tenant = await prisma.tenantProfile.findUnique({
      where: { id: tenantId },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true, phone: true, createdAt: true },
        },
        leases: {
          orderBy: { startDate: 'desc' },
          include: {
            unit: {
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
              },
            },
          },
        },
      },
    });

    if (!tenant) {
      throw new AppError('Tenant profile not found', 404, 'TENANT_NOT_FOUND');
    }

    // Role check: Tenant can only view their own profile
    if (user.role === UserRole.TENANT && tenant.userId !== user.id) {
      throw new AppError('Forbidden: You can only view your own tenant profile', 403, 'FORBIDDEN');
    }

    return tenant;
  }

  public static async update(
    user: { id: string; role: UserRole },
    tenantId: string,
    dto: UpdateTenantDTO
  ): Promise<unknown> {
    await this.getById(user, tenantId);

    return prisma.tenantProfile.update({
      where: { id: tenantId },
      data: {
        ...(dto.emergencyContactName !== undefined && { emergencyContactName: dto.emergencyContactName }),
        ...(dto.emergencyContactPhone !== undefined && { emergencyContactPhone: dto.emergencyContactPhone }),
        ...(dto.dateOfBirth !== undefined && {
          dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : null,
        }),
        ...(dto.employmentStatus !== undefined && { employmentStatus: dto.employmentStatus }),
        ...(dto.employerName !== undefined && { employerName: dto.employerName }),
        ...(dto.annualIncome !== undefined && { annualIncome: dto.annualIncome }),
        ...(dto.documents !== undefined && { documents: dto.documents as unknown as Prisma.InputJsonValue }),
        ...(dto.onboardingStatus !== undefined && { onboardingStatus: dto.onboardingStatus }),
      },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });
  }
}
