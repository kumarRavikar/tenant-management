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
      ownerUnit: {
        findMany: jest.fn(),
      },
      property: {
        findMany: jest.fn(),
      },
      rentInvoice: {
        findMany: jest.fn(),
      },
      payment: {
        findMany: jest.fn(),
      },
      maintenanceTicket: {
        findMany: jest.fn(),
      },
      lease: {
        findMany: jest.fn(),
      },
    },
    connectDatabase: jest.fn().mockResolvedValue(true),
    disconnectDatabase: jest.fn().mockResolvedValue(undefined),
  };
});

describe('Reports Module', () => {
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

  describe('GET /api/reports/occupancy', () => {
    it('should generate occupancy report in JSON format', async () => {
      (prisma.property.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'prop-1',
          name: 'Grand Plaza',
          buildings: [
            {
              id: 'bldg-1',
              name: 'Tower A',
              floors: [
                {
                  id: 'fl-1',
                  units: [
                    { id: 'u-1', status: 'OCCUPIED' },
                    { id: 'u-2', status: 'VACANT' },
                  ],
                },
              ],
            },
          ],
        },
      ]);

      const res = await request(app)
        .get('/api/reports/occupancy')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Occupancy Report');
      expect(res.body.data.rows).toHaveLength(1);
      expect(res.body.data.summary.totalUnits).toBe(2);
      expect(res.body.data.summary.totalOccupied).toBe(1);
    });

    it('should export occupancy report as CSV', async () => {
      (prisma.property.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'prop-1',
          name: 'Grand Plaza',
          buildings: [
            {
              id: 'bldg-1',
              name: 'Tower A',
              floors: [
                {
                  id: 'fl-1',
                  units: [
                    { id: 'u-1', status: 'OCCUPIED' },
                  ],
                },
              ],
            },
          ],
        },
      ]);

      const res = await request(app)
        .get('/api/reports/occupancy?format=csv')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.header['content-type']).toContain('text/csv');
      expect(res.text).toContain('"Grand Plaza"');
      expect(res.text).toContain('"Tower A"');
    });

    it('should deny access to TENANT role', async () => {
      const res = await request(app)
        .get('/api/reports/occupancy')
        .set('Authorization', `Bearer ${tenantToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/reports/rent-collection', () => {
    it('should generate rent collection report', async () => {
      (prisma.rentInvoice.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'inv-1',
          invoiceNumber: 'INV-001',
          billingMonth: '2026-03',
          dueDate: new Date('2026-03-31'),
          totalAmount: 1500,
          paidAmount: 1500,
          status: 'PAID',
          lease: {
            unit: {
              unitNumber: '101',
              floor: { building: { property: { name: 'Grand Plaza' } } },
            },
          },
        },
      ]);

      const res = await request(app)
        .get('/api/reports/rent-collection')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.summary.totalBilled).toBe('1500.00');
      expect(res.body.data.summary.totalCollected).toBe('1500.00');
      expect(res.body.data.summary.collectionRate).toBe('100%');
    });
  });

  describe('GET /api/reports/lease-expiration', () => {
    it('should generate lease expiration report', async () => {
      (prisma.lease.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'lease-12345678',
          monthlyRent: 2000,
          endDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
          tenant: {
            user: { firstName: 'John', lastName: 'Doe' },
          },
          unit: {
            unitNumber: '202',
            floor: { building: { property: { name: 'Grand Plaza' } } },
          },
        },
      ]);

      const res = await request(app)
        .get('/api/reports/lease-expiration?days=30')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.summary.expiringLeasesCount).toBe(1);
    });
  });
});

