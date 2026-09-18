import { Prisma, PaymentStatus, InvoiceStatus } from '@prisma/client';
import { prisma } from '../../config/database';
import { AppError } from '../../middleware/error.middleware';
import { getPagination, createPaginationMeta, PaginationMeta } from '../../utils/pagination';
import { RecordPaymentDTO, PaymentFilterQuery, ReceiptData } from './payment.types';
import { UserRole } from '../auth/auth.types';

export class PaymentService {
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

  public static async recordPayment(
    dto: RecordPaymentDTO,
    user: { id: string; role: UserRole }
  ): Promise<unknown> {
    return prisma.$transaction(async (tx) => {
      const invoice = await tx.rentInvoice.findUnique({
        where: { id: dto.invoiceId },
        include: {
          lease: {
            include: {
              tenant: true,
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
          },
        },
      });

      if (!invoice) {
        throw new AppError('Invoice not found', 404);
      }

      // Role authorization check
      if (user.role === UserRole.TENANT) {
        if (invoice.lease.tenant.userId !== user.id) {
          throw new AppError('Forbidden: You can only pay invoices for your own lease', 403);
        }
      } else if (user.role === UserRole.PROPERTY_ADMIN || user.role === UserRole.MANAGER) {
        await this.verifyPropertyScope(invoice.lease.unit.floor.building.propertyId, user);
      } else if (user.role === UserRole.OWNER) {
        throw new AppError('Forbidden: Owners cannot record payments directly', 403);
      }

      if (invoice.status === InvoiceStatus.CANCELLED) {
        throw new AppError('Cannot record payment for a cancelled invoice', 400);
      }

      if (invoice.status === InvoiceStatus.PAID) {
        throw new AppError('This invoice is already fully paid', 400);
      }

      const totalAmount = Number(invoice.totalAmount);
      const currentPaid = Number(invoice.paidAmount);
      const remainingBalance = totalAmount - currentPaid;

      if (dto.amount > remainingBalance) {
        throw new AppError(
          `Payment amount ($${dto.amount.toFixed(2)}) exceeds remaining balance ($${remainingBalance.toFixed(2)})`,
          400
        );
      }

      const receiptNumber = `REC-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;

      const payment = await tx.payment.create({
        data: {
          invoiceId: dto.invoiceId,
          amount: dto.amount,
          paymentMethod: dto.paymentMethod,
          transactionId: dto.transactionId,
          paymentDate: dto.paymentDate ? new Date(dto.paymentDate) : new Date(),
          status: PaymentStatus.COMPLETED,
          notes: dto.notes,
          receiptNumber,
          recordedById: user.id,
        },
        include: {
          invoice: true,
        },
      });

      const newPaidAmount = currentPaid + dto.amount;
      const newStatus =
        newPaidAmount >= totalAmount ? InvoiceStatus.PAID : InvoiceStatus.PARTIALLY_PAID;

      await tx.rentInvoice.update({
        where: { id: dto.invoiceId },
        data: {
          paidAmount: newPaidAmount,
          status: newStatus,
        },
      });

      return payment;
    });
  }

  public static async list(
    user: { id: string; role: UserRole },
    query: PaymentFilterQuery
  ): Promise<{ payments: unknown[]; meta: PaginationMeta }> {
    const { page, limit, skip } = getPagination(query);

    const where: Prisma.PaymentWhereInput = {};

    if (query.invoiceId) {
      where.invoiceId = query.invoiceId;
    }
    if (query.paymentMethod) {
      where.paymentMethod = query.paymentMethod;
    }
    if (query.status) {
      where.status = query.status;
    }

    // Role-based scope enforcement
    if (user.role === UserRole.PROPERTY_ADMIN || user.role === UserRole.MANAGER) {
      const assignments = await prisma.userProperty.findMany({
        where: { userId: user.id },
        select: { propertyId: true },
      });
      const allowedProperties = assignments.map((a) => a.propertyId);
      where.invoice = {
        lease: {
          unit: {
            floor: {
              building: {
                propertyId: { in: allowedProperties },
              },
            },
          },
        },
      };
    } else if (user.role === UserRole.OWNER) {
      where.invoice = {
        lease: {
          unit: {
            owners: {
              some: {
                ownerProfile: { userId: user.id },
              },
            },
          },
        },
      };
    } else if (user.role === UserRole.TENANT) {
      where.invoice = {
        lease: {
          tenant: {
            userId: user.id,
          },
        },
      };
    }

    const [total, payments] = await Promise.all([
      prisma.payment.count({ where }),
      prisma.payment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { paymentDate: 'desc' },
        include: {
          invoice: {
            select: {
              id: true,
              invoiceNumber: true,
              billingMonth: true,
              totalAmount: true,
              status: true,
              lease: {
                select: {
                  id: true,
                  unit: {
                    select: {
                      id: true,
                      unitNumber: true,
                      floor: {
                        select: {
                          building: {
                            select: {
                              name: true,
                              property: {
                                select: { name: true },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                  tenant: {
                    select: {
                      user: {
                        select: { firstName: true, lastName: true, email: true },
                      },
                    },
                  },
                },
              },
            },
          },
          recordedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      }),
    ]);

    return {
      payments,
      meta: createPaginationMeta(page, limit, total),
    };
  }

  public static async getById(id: string, user: { id: string; role: UserRole }): Promise<unknown> {
    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        invoice: {
          include: {
            lease: {
              include: {
                tenant: {
                  include: {
                    user: {
                      select: { firstName: true, lastName: true, email: true, phone: true },
                    },
                  },
                },
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
              },
            },
          },
        },
        recordedBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    if (!payment) {
      throw new AppError('Payment not found', 404);
    }

    // Role-based scope verification
    if (user.role === UserRole.PROPERTY_ADMIN || user.role === UserRole.MANAGER) {
      await this.verifyPropertyScope(payment.invoice.lease.unit.floor.building.propertyId, user);
    } else if (user.role === UserRole.OWNER) {
      const owns = payment.invoice.lease.unit.owners.some((o) => o.ownerProfile.userId === user.id);
      if (!owns) {
        throw new AppError('Forbidden: You do not own the unit associated with this payment', 403);
      }
    } else if (user.role === UserRole.TENANT) {
      if (payment.invoice.lease.tenant.userId !== user.id) {
        throw new AppError('Forbidden: You can only view payments for your own lease', 403);
      }
    }

    return payment;
  }

  public static async getPaymentsByInvoiceId(
    invoiceId: string,
    user: { id: string; role: UserRole }
  ): Promise<unknown[]> {
    const invoice = await prisma.rentInvoice.findUnique({
      where: { id: invoiceId },
      include: {
        lease: {
          include: {
            tenant: true,
            unit: {
              include: {
                floor: {
                  include: {
                    building: true,
                  },
                },
                owners: {
                  include: {
                    ownerProfile: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!invoice) {
      throw new AppError('Invoice not found', 404);
    }

    // Scoping
    if (user.role === UserRole.PROPERTY_ADMIN || user.role === UserRole.MANAGER) {
      await this.verifyPropertyScope(invoice.lease.unit.floor.building.propertyId, user);
    } else if (user.role === UserRole.OWNER) {
      const owns = invoice.lease.unit.owners.some((o) => o.ownerProfile.userId === user.id);
      if (!owns) {
        throw new AppError('Forbidden: Access denied', 403);
      }
    } else if (user.role === UserRole.TENANT) {
      if (invoice.lease.tenant.userId !== user.id) {
        throw new AppError('Forbidden: Access denied', 403);
      }
    }

    return prisma.payment.findMany({
      where: { invoiceId },
      orderBy: { paymentDate: 'desc' },
      include: {
        recordedBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });
  }

  public static async getReceipt(
    paymentId: string,
    user: { id: string; role: UserRole }
  ): Promise<ReceiptData> {
    const payment = (await this.getById(paymentId, user)) as any;

    const tenantUser = payment.invoice.lease.tenant.user;
    const unit = payment.invoice.lease.unit;
    const property = unit.floor.building.property;

    return {
      receiptNumber: payment.receiptNumber,
      paymentId: payment.id,
      paymentDate: payment.paymentDate,
      amount: Number(payment.amount),
      paymentMethod: payment.paymentMethod,
      transactionId: payment.transactionId,
      notes: payment.notes,
      invoice: {
        id: payment.invoice.id,
        invoiceNumber: payment.invoice.invoiceNumber,
        billingMonth: payment.invoice.billingMonth,
        totalAmount: Number(payment.invoice.totalAmount),
        paidAmount: Number(payment.invoice.paidAmount),
        status: payment.invoice.status,
      },
      tenant: {
        name: `${tenantUser.firstName} ${tenantUser.lastName}`,
        email: tenantUser.email,
        phone: tenantUser.phone,
      },
      property: {
        name: property.name,
        address: `${property.address}, ${property.city}`,
        unitNumber: unit.unitNumber,
      },
    };
  }
}

