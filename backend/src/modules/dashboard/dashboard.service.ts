import { prisma } from '../../config/database';
import { UserRole } from '../auth/auth.types';
import {
  DashboardStatsResponse,
  SuperAdminDashboardStats,
  ManagerDashboardStats,
  OwnerDashboardStats,
  TenantDashboardStats,
} from './dashboard.types';

export class DashboardService {
  public static async getStats(user: { id: string; role: UserRole }): Promise<DashboardStatsResponse> {
    switch (user.role) {
      case UserRole.SUPER_ADMIN: {
        const stats = await this.getSuperAdminStats();
        return { role: user.role, stats };
      }
      case UserRole.PROPERTY_ADMIN:
      case UserRole.MANAGER: {
        const stats = await this.getManagerStats(user.id);
        return { role: user.role, stats };
      }
      case UserRole.OWNER: {
        const stats = await this.getOwnerStats(user.id);
        return { role: user.role, stats };
      }
      case UserRole.TENANT: {
        const stats = await this.getTenantStats(user.id);
        return { role: user.role, stats };
      }
      default: {
        const stats = await this.getSuperAdminStats();
        return { role: user.role, stats };
      }
    }
  }

  private static async getSuperAdminStats(): Promise<SuperAdminDashboardStats> {
    const [
      totalProperties,
      totalUnits,
      occupiedUnits,
      revenueAgg,
      pendingMaintenance,
      overdueInvoices,
    ] = await Promise.all([
      prisma.property.count(),
      prisma.unit.count(),
      prisma.unit.count({ where: { status: 'OCCUPIED' } }),
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: { status: 'COMPLETED' },
      }),
      prisma.maintenanceTicket.count({
        where: { status: { in: ['OPEN', 'IN_PROGRESS'] } },
      }),
      prisma.rentInvoice.findMany({
        where: { status: 'OVERDUE' },
        select: { totalAmount: true, paidAmount: true },
      }),
    ]);

    const totalRevenue = Number(revenueAgg._sum.amount || 0);
    const overdueRent = overdueInvoices.reduce(
      (sum, inv) => sum + (Number(inv.totalAmount) - Number(inv.paidAmount)),
      0
    );
    const occupancyRate = totalUnits > 0 ? Number(((occupiedUnits / totalUnits) * 100).toFixed(1)) : 0;

    return {
      totalProperties,
      totalUnits,
      occupiedUnits,
      occupancyRate,
      totalRevenue,
      pendingMaintenance,
      overdueRent,
    };
  }

  private static async getManagerStats(userId: string): Promise<ManagerDashboardStats> {
    const assignments = await prisma.userProperty.findMany({
      where: { userId },
      select: { propertyId: true },
    });
    const propIds = assignments.map((a) => a.propertyId);

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalUnits,
      occupiedUnits,
      invoices,
      openTickets,
      recentVisitorsCount,
    ] = await Promise.all([
      prisma.unit.count({
        where: { floor: { building: { propertyId: { in: propIds } } } },
      }),
      prisma.unit.count({
        where: {
          status: 'OCCUPIED',
          floor: { building: { propertyId: { in: propIds } } },
        },
      }),
      prisma.rentInvoice.findMany({
        where: {
          lease: {
            unit: {
              floor: {
                building: {
                  propertyId: { in: propIds },
                },
              },
            },
          },
        },
        select: { totalAmount: true, paidAmount: true },
      }),
      prisma.maintenanceTicket.count({
        where: {
          status: { in: ['OPEN', 'IN_PROGRESS'] },
          unit: {
            floor: {
              building: {
                propertyId: { in: propIds },
              },
            },
          },
        },
      }),
      prisma.visitor.count({
        where: {
          propertyId: { in: propIds },
          visitDate: { gte: sevenDaysAgo },
        },
      }),
    ]);

    const totalRentBilled = invoices.reduce((sum, inv) => sum + Number(inv.totalAmount), 0);
    const totalRentCollected = invoices.reduce((sum, inv) => sum + Number(inv.paidAmount), 0);
    const collectionRate = totalRentBilled > 0 ? Number(((totalRentCollected / totalRentBilled) * 100).toFixed(1)) : 0;
    const occupancyRate = totalUnits > 0 ? Number(((occupiedUnits / totalUnits) * 100).toFixed(1)) : 0;

    return {
      assignedProperties: propIds.length,
      totalUnits,
      occupiedUnits,
      occupancyRate,
      totalRentCollected,
      totalRentBilled,
      collectionRate,
      openTickets,
      recentVisitorsCount,
    };
  }

  private static async getOwnerStats(userId: string): Promise<OwnerDashboardStats> {
    const ownedUnits = await prisma.ownerUnit.findMany({
      where: { ownerProfile: { userId } },
      select: {
        unitId: true,
        unit: { select: { status: true } },
      },
    });

    const unitIds = ownedUnits.map((u: { unitId: string; unit: { status: string } }) => u.unitId);
    const ownedUnitsCount = unitIds.length;
    const occupiedUnitsCount = ownedUnits.filter(
      (u: { unitId: string; unit: { status: string } }) => u.unit.status === 'OCCUPIED'
    ).length;
    const occupancyRate = ownedUnitsCount > 0 ? Number(((occupiedUnitsCount / ownedUnitsCount) * 100).toFixed(1)) : 0;

    const [invoices, activeMaintenanceTickets] = await Promise.all([
      prisma.rentInvoice.findMany({
        where: { lease: { unitId: { in: unitIds } } },
        select: { totalAmount: true, paidAmount: true },
      }),
      prisma.maintenanceTicket.count({
        where: {
          unitId: { in: unitIds },
          status: { in: ['OPEN', 'IN_PROGRESS'] },
        },
      }),
    ]);

    const totalRentalIncome = invoices.reduce((sum, inv) => sum + Number(inv.paidAmount), 0);
    const pendingDues = invoices.reduce(
      (sum, inv) => sum + (Number(inv.totalAmount) - Number(inv.paidAmount)),
      0
    );

    return {
      ownedUnitsCount,
      occupiedUnitsCount,
      occupancyRate,
      totalRentalIncome,
      pendingDues,
      activeMaintenanceTickets,
    };
  }

  private static async getTenantStats(userId: string): Promise<TenantDashboardStats> {
    const activeLease = await prisma.lease.findFirst({
      where: {
        tenant: { userId },
        status: 'ACTIVE',
      },
      include: {
        unit: {
          include: {
            floor: {
              include: {
                building: {
                  include: {
                    property: {
                      select: { id: true, name: true, address: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { startDate: 'desc' },
    });

    const [upcomingRentInvoice, completedPayments, openTicketsCount, preApprovedVisitorsCount] =
      await Promise.all([
        activeLease
          ? prisma.rentInvoice.findFirst({
              where: {
                leaseId: activeLease.id,
                status: { in: ['PENDING', 'PARTIALLY_PAID', 'OVERDUE'] },
              },
              orderBy: { dueDate: 'asc' },
            })
          : null,
        prisma.payment.findMany({
          where: {
            invoice: {
              lease: {
                tenant: { userId },
              },
            },
            status: 'COMPLETED',
          },
          select: { amount: true },
        }),
        prisma.maintenanceTicket.count({
          where: {
            createdById: userId,
            status: { in: ['OPEN', 'IN_PROGRESS'] },
          },
        }),
        prisma.visitor.count({
          where: {
            hostUserId: userId,
            status: { in: ['PRE_APPROVED', 'PENDING_APPROVAL'] },
          },
        }),
      ]);

    const totalPaidAmount = completedPayments.reduce((sum, p) => sum + Number(p.amount), 0);

    return {
      activeLease,
      upcomingRentInvoice,
      totalPaidAmount,
      openTicketsCount,
      preApprovedVisitorsCount,
    };
  }
}
