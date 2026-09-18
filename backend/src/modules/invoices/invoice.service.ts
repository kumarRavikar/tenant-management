import { Prisma, InvoiceStatus } from '@prisma/client';
import { prisma } from '../../config/database';
import { AppError } from '../../middleware/error.middleware';
import { getPagination, createPaginationMeta, PaginationMeta } from '../../utils/pagination';
import { CreateInvoiceDTO, InvoiceFilterQuery } from './invoice.types';
import { UserRole } from '../auth/auth.types';

export class InvoiceService {
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
    query: InvoiceFilterQuery
  ): Promise<{ invoices: unknown[]; meta: PaginationMeta }> {
    const { page, limit, skip } = getPagination(query);

    const where: Prisma.RentInvoiceWhereInput = {};

    if (query.leaseId) {
      where.leaseId = query.leaseId;
    }
    if (query.status) {
      where.status = query.status;
    }
    if (query.billingMonth) {
      where.billingMonth = query.billingMonth;
    }
    if (query.unitId) {
      where.lease = { unitId: query.unitId };
    }
    if (query.propertyId) {
      where.lease = {
        ...(where.lease as Prisma.LeaseWhereInput || {}),
        unit: {
          floor: {
            building: {
              propertyId: query.propertyId,
            },
          },
        },
      };
    }

    // Role-based scope enforcement
    if (user.role === UserRole.PROPERTY_ADMIN || user.role === UserRole.MANAGER) {
      const assignments = await prisma.userProperty.findMany({
        where: { userId: user.id },
        select: { propertyId: true },
      });
      const allowedProperties = assignments.map((a) => a.propertyId);
      where.lease = {
        ...(where.lease as Prisma.LeaseWhereInput || {}),
        unit: {
          floor: {
            building: {
              propertyId: { in: allowedProperties },
            },
          },
        },
      };
    } else if (user.role === UserRole.OWNER) {
      where.lease = {
        ...(where.lease as Prisma.LeaseWhereInput || {}),
        unit: {
          owners: {
            some: {
              ownerProfile: { userId: user.id },
            },
          },
        },
      };
    } else if (user.role === UserRole.TENANT) {
      where.lease = {
        ...(where.lease as Prisma.LeaseWhereInput || {}),
        tenant: {
          userId: user.id,
        },
      };
    }

    const [total, invoices] = await Promise.all([
      prisma.rentInvoice.count({ where }),
      prisma.rentInvoice.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ billingMonth: 'desc' }, { createdAt: 'desc' }],
        include: {
          lease: {
            select: {
              id: true,
              startDate: true,
              endDate: true,
              unit: {
                select: {
                  id: true,
                  unitNumber: true,
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
          },
          payments: {
            select: {
              id: true,
              amount: true,
              paymentMethod: true,
              paymentDate: true,
              status: true,
              receiptNumber: true,
            },
          },
        },
      }),
    ]);

    return {
      invoices,
      meta: createPaginationMeta(page, limit, total),
    };
  }

  public static async getById(id: string, user: { id: string; role: UserRole }): Promise<unknown> {
    const invoice = await prisma.rentInvoice.findUnique({
      where: { id },
      include: {
        lease: {
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
        },
        payments: {
          orderBy: { paymentDate: 'desc' },
          include: {
            recordedBy: {
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

    if (!invoice) {
      throw new AppError('Invoice not found', 404);
    }

    // Role-based scope checks
    if (user.role === UserRole.PROPERTY_ADMIN || user.role === UserRole.MANAGER) {
      await this.verifyPropertyScope(invoice.lease.unit.floor.building.propertyId, user);
    } else if (user.role === UserRole.OWNER) {
      const ownsUnit = invoice.lease.unit.owners.some((o) => o.ownerProfile.userId === user.id);
      if (!ownsUnit) {
        throw new AppError('Forbidden: You do not own the unit associated with this invoice', 403);
      }
    } else if (user.role === UserRole.TENANT) {
      if (invoice.lease.tenant.userId !== user.id) {
        throw new AppError('Forbidden: You can only view invoices for your own lease', 403);
      }
    }

    return invoice;
  }

  public static async create(
    dto: CreateInvoiceDTO,
    user: { id: string; role: UserRole }
  ): Promise<unknown> {
    const lease = await prisma.lease.findUnique({
      where: { id: dto.leaseId },
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

    if (!lease) {
      throw new AppError('Lease not found', 404);
    }

    await this.verifyPropertyScope(lease.unit.floor.building.propertyId, user);

    // Calculate total amount
    const rentAmount = dto.rentAmount;
    const maintenanceAmount = dto.maintenanceAmount || 0;
    const lateFee = dto.lateFee || 0;
    const discount = dto.discount || 0;
    const totalAmount = rentAmount + maintenanceAmount + lateFee - discount;

    if (totalAmount < 0) {
      throw new AppError('Total invoice amount cannot be negative', 400);
    }

    // Check if an invoice already exists for this lease and billing month
    const existing = await prisma.rentInvoice.findFirst({
      where: {
        leaseId: dto.leaseId,
        billingMonth: dto.billingMonth,
      },
    });

    if (existing) {
      throw new AppError(
        `An invoice for billing month ${dto.billingMonth} already exists for this lease`,
        409
      );
    }

    const randNum = Math.floor(1000 + Math.random() * 9000);
    const invoiceNumber = `INV-${dto.billingMonth.replace('-', '')}-${randNum}`;

    const invoice = await prisma.rentInvoice.create({
      data: {
        leaseId: dto.leaseId,
        invoiceNumber,
        billingMonth: dto.billingMonth,
        dueDate: new Date(dto.dueDate),
        rentAmount,
        maintenanceAmount,
        lateFee,
        discount,
        totalAmount,
        paidAmount: 0,
        status: InvoiceStatus.PENDING,
      },
      include: {
        lease: {
          include: {
            unit: true,
            tenant: {
              include: {
                user: {
                  select: { id: true, firstName: true, lastName: true, email: true },
                },
              },
            },
          },
        },
      },
    });

    return invoice;
  }
}

