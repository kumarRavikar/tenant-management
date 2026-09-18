import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../../../app';
import { prisma } from '../../../config/database';
import { env } from '../../../config/env';
import { UserRole } from '../../auth/auth.types';

jest.mock('../../../config/database', () => {
  return {
    prisma: {
      session: {
        findUnique: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
      },
      userProperty: {
        findMany: jest.fn(),
      },
      property: {
        count: jest.fn(),
      },
      unit: {
        count: jest.fn(),
      },
      payment: {
        aggregate: jest.fn(),
        findMany: jest.fn(),
      },
      maintenanceTicket: {
        count: jest.fn(),
      },
      rentInvoice: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
      },
      ownerUnit: {
        findMany: jest.fn(),
      },
      lease: {
        findFirst: jest.fn(),
      },
      visitor: {
        count: jest.fn(),
      },
    },
    connectDatabase: jest.fn().mockResolvedValue(true),
    disconnectDatabase: jest.fn().mockResolvedValue(undefined),
  };
});

describe('Dashboard Module', () => {
  let superAdminToken: string;
  let tenantToken: string;

  beforeAll(() => {
    superAdminToken = jwt.sign(
      { userId: 'admin-1', email: 'admin@test.com', role: UserRole.SUPER_ADMIN, sessionId: 'sess-admin' },
      env.JWT_ACCESS_SECRET,
      { expiresIn: '15m' }
    );
    tenantToken = jwt.sign(
      { userId: 'tenant-1', email: 'tenant@test.com', role: UserRole.TENANT, sessionId: 'sess-tenant' },
      env.JWT_ACCESS_SECRET,
      { expiresIn: '15m' }
    );
  });

  beforeEach(() => {
    jest.clearAllMocks();

    (prisma.session.findUnique as jest.Mock).mockImplementation(({ where }: { where: { id: string } }) => {
      const users: Record<string, any> = {
        'sess-admin': { id: 'admin-1', email: 'admin@test.com', role: UserRole.SUPER_ADMIN, isActive: true },
        'sess-tenant': { id: 'tenant-1', email: 'tenant@test.com', role: UserRole.TENANT, isActive: true },
      };
      const user = users[where.id];
      if (!user) return null;
      return {
        id: where.id,
        isValid: true,
        expiresAt: new Date(Date.now() + 3600000),
        user,
      };
    });
  });

  describe('GET /api/dashboard/stats', () => {
    it('should aggregate and return stats for SUPER_ADMIN', async () => {
      (prisma.property.count as jest.Mock).mockResolvedValue(10);
      (prisma.unit.count as jest.Mock)
        .mockResolvedValueOnce(50) // totalUnits
        .mockResolvedValueOnce(40); // occupiedUnits

      (prisma.payment.aggregate as jest.Mock).mockResolvedValue({
        _sum: { amount: 150000 },
      });

      (prisma.maintenanceTicket.count as jest.Mock).mockResolvedValue(8);
      (prisma.rentInvoice.findMany as jest.Mock).mockResolvedValue([
        { totalAmount: 1200, paidAmount: 200 },
      ]);

      const res = await request(app)
        .get('/api/dashboard/stats')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.role).toBe(UserRole.SUPER_ADMIN);
      expect(res.body.data.stats.totalProperties).toBe(10);
      expect(res.body.data.stats.totalUnits).toBe(50);
      expect(res.body.data.stats.occupiedUnits).toBe(40);
      expect(res.body.data.stats.occupancyRate).toBe(80.0);
      expect(res.body.data.stats.totalRevenue).toBe(150000);
      expect(res.body.data.stats.pendingMaintenance).toBe(8);
      expect(res.body.data.stats.overdueRent).toBe(1000);
    });

    it('should aggregate and return stats for TENANT', async () => {
      (prisma.lease.findFirst as jest.Mock).mockResolvedValue({
        id: 'lease-1',
        monthlyRent: 1500,
        status: 'ACTIVE',
      });
      (prisma.rentInvoice.findFirst as jest.Mock).mockResolvedValue({
        id: 'inv-1',
        totalAmount: 1500,
        status: 'PENDING',
      });
      (prisma.payment.findMany as jest.Mock).mockResolvedValue([
        { amount: 1500 },
        { amount: 1500 },
      ]);
      (prisma.maintenanceTicket.count as jest.Mock).mockResolvedValue(1);
      (prisma.visitor.count as jest.Mock).mockResolvedValue(2);

      const res = await request(app)
        .get('/api/dashboard/stats')
        .set('Authorization', `Bearer ${tenantToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.role).toBe(UserRole.TENANT);
      expect(res.body.data.stats.totalPaidAmount).toBe(3000);
      expect(res.body.data.stats.openTicketsCount).toBe(1);
      expect(res.body.data.stats.preApprovedVisitorsCount).toBe(2);
    });
  });
});

