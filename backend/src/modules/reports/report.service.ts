import PDFDocument from 'pdfkit';
import { prisma } from '../../config/database';
import { AppError } from '../../middleware/error.middleware';
import { UserRole } from '../auth/auth.types';
import {
  OccupancyReportQuery,
  RentCollectionReportQuery,
  PaymentTransactionReportQuery,
  MaintenanceReportQuery,
  LeaseExpirationReportQuery,
  ReportOutput,
} from './report.types';
import { PaymentMethod, PaymentStatus, MaintenancePriority, MaintenanceStatus } from '@prisma/client';

export class ReportService {
  private static async getScopedPropertyIds(
    user: { id: string; role: UserRole },
    requestedPropertyId?: string
  ): Promise<string[] | undefined> {
    if (user.role === UserRole.SUPER_ADMIN) {
      return requestedPropertyId ? [requestedPropertyId] : undefined;
    }

    if (user.role === UserRole.PROPERTY_ADMIN || user.role === UserRole.MANAGER) {
      const assignments = await prisma.userProperty.findMany({
        where: { userId: user.id },
        select: { propertyId: true },
      });
      const allowed = assignments.map((a) => a.propertyId);
      if (requestedPropertyId) {
        if (!allowed.includes(requestedPropertyId)) {
          throw new AppError('Forbidden: You do not have access to this property', 403);
        }
        return [requestedPropertyId];
      }
      return allowed;
    }

    if (user.role === UserRole.OWNER) {
      const ownedUnits = await prisma.ownerUnit.findMany({
        where: { ownerProfile: { userId: user.id } },
        select: { unit: { select: { floor: { select: { building: { select: { propertyId: true } } } } } } },
      });
      const allowed = Array.from(new Set(ownedUnits.map((u: any) => u.unit.floor.building.propertyId)));
      if (requestedPropertyId) {
        if (!allowed.includes(requestedPropertyId)) {
          throw new AppError('Forbidden: You do not have access to this property', 403);
        }
        return [requestedPropertyId];
      }
      return allowed;
    }

    throw new AppError('Forbidden: Insufficient permissions for reports', 403);
  }

  public static async getOccupancyReport(
    user: { id: string; role: UserRole },
    query: OccupancyReportQuery
  ): Promise<ReportOutput> {
    const propertyIds = await this.getScopedPropertyIds(user, query.propertyId);

    const properties = await prisma.property.findMany({
      where: {
        ...(propertyIds ? { id: { in: propertyIds } } : {}),
      },
      include: {
        buildings: {
          include: {
            floors: {
              include: {
                units: true,
              },
            },
          },
        },
      },
    });

    const rows: (string | number)[][] = [];
    let totalAllUnits = 0;
    let totalAllOccupied = 0;

    for (const prop of properties) {
      for (const building of prop.buildings) {
        const units = building.floors.flatMap((f: any) => f.units);
        const total = units.length;
        const occupied = units.filter((u: any) => u.status === 'OCCUPIED').length;
        const vacant = units.filter((u: any) => u.status === 'VACANT').length;
        const maintenance = units.filter((u: any) => u.status === 'MAINTENANCE').length;
        const rate = total > 0 ? Number(((occupied / total) * 100).toFixed(1)) : 0;

        totalAllUnits += total;
        totalAllOccupied += occupied;

        rows.push([
          prop.name,
          building.name,
          total,
          occupied,
          vacant,
          maintenance,
          `${rate}%`,
        ]);
      }
    }

    const overallRate = totalAllUnits > 0 ? Number(((totalAllOccupied / totalAllUnits) * 100).toFixed(1)) : 0;

    return {
      title: 'Occupancy Report',
      headers: ['Property', 'Building', 'Total Units', 'Occupied', 'Vacant', 'Maintenance', 'Occupancy %'],
      rows,
      summary: {
        totalProperties: properties.length,
        totalUnits: totalAllUnits,
        totalOccupied: totalAllOccupied,
        overallOccupancyRate: `${overallRate}%`,
      },
      rawData: properties,
    };
  }

  public static async getRentCollectionReport(
    user: { id: string; role: UserRole },
    query: RentCollectionReportQuery
  ): Promise<ReportOutput> {
    const propertyIds = await this.getScopedPropertyIds(user, query.propertyId);

    const where: any = {};
    if (propertyIds) {
      where.lease = {
        unit: {
          floor: {
            building: {
              propertyId: { in: propertyIds },
            },
          },
        },
      };
    }
    if (query.startDate || query.endDate) {
      where.dueDate = {};
      if (query.startDate) where.dueDate.gte = new Date(query.startDate);
      if (query.endDate) where.dueDate.lte = new Date(query.endDate);
    }

    const invoices = await prisma.rentInvoice.findMany({
      where,
      orderBy: { dueDate: 'desc' },
      include: {
        lease: {
          include: {
            tenant: {
              include: { user: true },
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
              },
            },
          },
        },
      },
    });

    let totalBilled = 0;
    let totalCollected = 0;
    let totalBalance = 0;

    const rows: (string | number)[][] = invoices.map((inv: any) => {
      const billed = Number(inv.totalAmount);
      const paid = Number(inv.paidAmount);
      const balance = Math.max(0, billed - paid);

      totalBilled += billed;
      totalCollected += paid;
      totalBalance += balance;

      return [
        inv.invoiceNumber,
        inv.lease.unit.floor.building.property.name,
        inv.lease.unit.unitNumber,
        inv.billingMonth,
        inv.dueDate.toISOString().split('T')[0],
        billed.toFixed(2),
        paid.toFixed(2),
        balance.toFixed(2),
        inv.status,
      ];
    });

    const collectionRate = totalBilled > 0 ? Number(((totalCollected / totalBilled) * 100).toFixed(1)) : 0;

    return {
      title: 'Rent Collection Report',
      headers: ['Invoice #', 'Property', 'Unit', 'Month', 'Due Date', 'Billed ($)', 'Paid ($)', 'Balance ($)', 'Status'],
      rows,
      summary: {
        totalInvoices: invoices.length,
        totalBilled: totalBilled.toFixed(2),
        totalCollected: totalCollected.toFixed(2),
        totalBalance: totalBalance.toFixed(2),
        collectionRate: `${collectionRate}%`,
      },
      rawData: invoices,
    };
  }

  public static async getPaymentTransactionReport(
    user: { id: string; role: UserRole },
    query: PaymentTransactionReportQuery
  ): Promise<ReportOutput> {
    const propertyIds = await this.getScopedPropertyIds(user, query.propertyId);

    const where: any = {};
    if (propertyIds) {
      where.invoice = {
        lease: {
          unit: {
            floor: {
              building: {
                propertyId: { in: propertyIds },
              },
            },
          },
        },
      };
    }
    if (query.startDate || query.endDate) {
      where.paymentDate = {};
      if (query.startDate) where.paymentDate.gte = new Date(query.startDate);
      if (query.endDate) where.paymentDate.lte = new Date(query.endDate);
    }
    if (query.method) {
      where.paymentMethod = query.method as PaymentMethod;
    }
    if (query.status) {
      where.status = query.status as PaymentStatus;
    }

    const payments = await prisma.payment.findMany({
      where,
      orderBy: { paymentDate: 'desc' },
      include: {
        invoice: {
          include: {
            lease: {
              include: {
                tenant: {
                  include: { user: true },
                },
                unit: true,
              },
            },
          },
        },
      },
    });

    let totalAmount = 0;

    const rows: (string | number)[][] = payments.map((p: any) => {
      const amt = Number(p.amount);
      totalAmount += amt;

      const tenantUser = p.invoice?.lease?.tenant?.user;
      const tenantName = tenantUser ? `${tenantUser.firstName} ${tenantUser.lastName}` : 'N/A';
      const unitNumber = p.invoice?.lease?.unit?.unitNumber || 'N/A';

      return [
        p.transactionId || p.receiptNumber || p.id.substring(0, 8),
        p.paymentDate ? p.paymentDate.toISOString().split('T')[0] : 'N/A',
        tenantName,
        unitNumber,
        p.paymentMethod,
        amt.toFixed(2),
        p.status,
      ];
    });

    return {
      title: 'Payment Transaction Report',
      headers: ['Transaction / Receipt', 'Date', 'Tenant', 'Unit', 'Method', 'Amount ($)', 'Status'],
      rows,
      summary: {
        totalPayments: payments.length,
        totalAmount: totalAmount.toFixed(2),
      },
      rawData: payments,
    };
  }

  public static async getMaintenanceReport(
    user: { id: string; role: UserRole },
    query: MaintenanceReportQuery
  ): Promise<ReportOutput> {
    const propertyIds = await this.getScopedPropertyIds(user, query.propertyId);

    const where: any = {};
    if (propertyIds) {
      where.unit = {
        floor: {
          building: {
            propertyId: { in: propertyIds },
          },
        },
      };
    }
    if (query.priority) {
      where.priority = query.priority as MaintenancePriority;
    }
    if (query.status) {
      where.status = query.status as MaintenanceStatus;
    }
    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) where.createdAt.gte = new Date(query.startDate);
      if (query.endDate) where.createdAt.lte = new Date(query.endDate);
    }

    const tickets = await prisma.maintenanceTicket.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        assignedTo: { select: { firstName: true, lastName: true } },
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
          },
        },
      },
    });

    const rows: (string | number)[][] = tickets.map((t: any) => [
      t.id.substring(0, 8).toUpperCase(),
      t.title,
      t.unit.floor.building.property.name,
      t.unit.unitNumber,
      t.priority,
      t.status,
      t.createdAt.toISOString().split('T')[0],
      t.assignedTo ? `${t.assignedTo.firstName} ${t.assignedTo.lastName}` : 'Unassigned',
    ]);

    const openCount = tickets.filter((t: any) => t.status === 'OPEN' || t.status === 'IN_PROGRESS').length;
    const resolvedCount = tickets.filter((t: any) => t.status === 'RESOLVED' || t.status === 'CLOSED').length;

    return {
      title: 'Maintenance Report',
      headers: ['Ticket ID', 'Title', 'Property', 'Unit', 'Priority', 'Status', 'Created At', 'Assigned To'],
      rows,
      summary: {
        totalTickets: tickets.length,
        openTickets: openCount,
        resolvedTickets: resolvedCount,
      },
      rawData: tickets,
    };
  }

  public static async getLeaseExpirationReport(
    user: { id: string; role: UserRole },
    query: LeaseExpirationReportQuery
  ): Promise<ReportOutput> {
    const propertyIds = await this.getScopedPropertyIds(user, query.propertyId);

    const days = Number(query.days) || 30;
    const now = new Date();
    const threshold = new Date();
    threshold.setDate(threshold.getDate() + days);

    const where: any = {
      status: 'ACTIVE',
      endDate: {
        gte: now,
        lte: threshold,
      },
    };

    if (propertyIds) {
      where.unit = {
        floor: {
          building: {
            propertyId: { in: propertyIds },
          },
        },
      };
    }

    const leases = await prisma.lease.findMany({
      where,
      orderBy: { endDate: 'asc' },
      include: {
        tenant: {
          include: { user: true },
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
          },
        },
      },
    });

    const rows: (string | number)[][] = leases.map((l: any) => {
      const daysRemaining = Math.max(
        0,
        Math.ceil((l.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      );
      return [
        l.id.substring(0, 8).toUpperCase(),
        l.tenant?.user ? `${l.tenant.user.firstName} ${l.tenant.user.lastName}` : 'N/A',
        l.unit.floor.building.property.name,
        l.unit.unitNumber,
        Number(l.monthlyRent).toFixed(2),
        l.endDate.toISOString().split('T')[0],
        daysRemaining,
      ];
    });

    return {
      title: `Lease Expiration Report (Next ${days} Days)`,
      headers: ['Lease ID', 'Tenant', 'Property', 'Unit', 'Monthly Rent ($)', 'End Date', 'Days Remaining'],
      rows,
      summary: {
        expiringLeasesCount: leases.length,
        windowDays: days,
      },
      rawData: leases,
    };
  }

  public static toCSV(report: ReportOutput): string {
    const escapeCell = (val: string | number | null | undefined) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const headerLine = report.headers.map(escapeCell).join(',');
    const rowLines = report.rows.map((r) => r.map(escapeCell).join(',')).join('\n');
    return `${headerLine}\n${rowLines}`;
  }

  public static async toPDF(report: ReportOutput): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err: Error) => reject(err));

      // Header
      doc.fontSize(16).fillColor('#111827').text('Tenant & Property Management System', { align: 'center' });
      doc.moveDown(0.3);
      doc.fontSize(13).fillColor('#2563eb').text(report.title, { align: 'center' });
      doc.moveDown(0.2);
      doc.fontSize(8).fillColor('#6b7280').text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
      doc.moveDown(1.2);

      // Summary
      if (report.summary) {
        const summaryText = Object.entries(report.summary)
          .map(([key, value]) => `${key}: ${value}`)
          .join('  |  ');
        doc.fontSize(9).fillColor('#374151').text(summaryText, { align: 'center' });
        doc.moveDown(1);
      }

      // Table layout
      const colCount = report.headers.length;
      const printableWidth = doc.page.width - 80;
      const colWidth = printableWidth / colCount;

      // Table Header
      let y = doc.y;
      doc.font('Helvetica-Bold').fontSize(9).fillColor('#111827');
      report.headers.forEach((h, i) => {
        doc.text(h, 40 + i * colWidth, y, { width: colWidth - 4, align: 'left' });
      });

      doc.moveDown(0.8);
      y = doc.y;
      doc.strokeColor('#d1d5db').lineWidth(0.5).moveTo(40, y).lineTo(doc.page.width - 40, y).stroke();
      doc.moveDown(0.5);

      // Table Rows
      doc.font('Helvetica').fontSize(8).fillColor('#374151');
      report.rows.forEach((row) => {
        if (doc.y > doc.page.height - 60) {
          doc.addPage();
        }
        const currentY = doc.y;
        row.forEach((cell, i) => {
          doc.text(String(cell ?? ''), 40 + i * colWidth, currentY, { width: colWidth - 4, align: 'left' });
        });
        doc.moveDown(0.6);
      });

      doc.end();
    });
  }
}

