import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../../../app';
import { prisma } from '../../../config/database';
import { env } from '../../../config/env';
import { UserRole } from '../../auth/auth.types';
import { InvoiceStatus } from '@prisma/client';

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
        findUnique: jest.fn(),
      },
      lease: {
        findUnique: jest.fn(),
      },
      rentInvoice: {
        findMany: jest.fn(),
        count: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      $transaction: jest.fn(async (cb) => {
        if (typeof cb === 'function') {
          return cb(prisma);
        }
        return Promise.all(cb);
      }),
    },
    connectDatabase: jest.fn().mockResolvedValue(true),
    disconnectDatabase: jest.fn().mockResolvedValue(undefined),
  };
});

describe('Rent & Invoices Module', () => {
  let superAdminToken: string;
  let tenantToken: string;
  let otherTenantToken: string;

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
    otherTenantToken = jwt.sign(
      { userId: 'tenant-2', email: 'tenant2@test.com', role: UserRole.TENANT, sessionId: 'sess-tenant-2' },
      env.JWT_ACCESS_SECRET,
      { expiresIn: '15m' }
    );
  });

  beforeEach(() => {
    jest.clearAllMocks();

    (prisma.session.findUnique as jest.Mock).mockImplementation(({ where }) => {
      if (where.id === 'sess-admin') {
        return Promise.resolve({
          id: 'sess-admin',
          isValid: true,
          expiresAt: new Date(Date.now() + 100000),
          user: { id: 'admin-1', email: 'admin@test.com', role: UserRole.SUPER_ADMIN, isActive: true },
        });
      }
      if (where.id === 'sess-tenant') {
        return Promise.resolve({
          id: 'sess-tenant',
          isValid: true,
          expiresAt: new Date(Date.now() + 100000),
          user: { id: 'tenant-1', email: 'tenant@test.com', role: UserRole.TENANT, isActive: true },
        });
      }
      if (where.id === 'sess-tenant-2') {
        return Promise.resolve({
          id: 'sess-tenant-2',
          isValid: true,
          expiresAt: new Date(Date.now() + 100000),
          user: { id: 'tenant-2', email: 'tenant2@test.com', role: UserRole.TENANT, isActive: true },
        });
      }
      return Promise.resolve(null);
    });
  });

  describe('POST /api/invoices', () => {
    const validInvoiceDTO = {
      leaseId: '00000000-0000-0000-0000-000000000001',
      billingMonth: '2026-03',
      dueDate: '2026-03-05T00:00:00.000Z',
      rentAmount: 2000,
      maintenanceAmount: 150,
      lateFee: 50,
      discount: 100,
    };

    it('should successfully create invoice and calculate totalAmount = rent + maintenance + lateFee - discount', async () => {
      (prisma.lease.findUnique as jest.Mock).mockResolvedValue({
        id: validInvoiceDTO.leaseId,
        unit: {
          floor: {
            building: { propertyId: 'prop-1' },
          },
        },
      });
      (prisma.rentInvoice.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.rentInvoice.create as jest.Mock).mockImplementation(({ data }) =>
        Promise.resolve({
          id: 'inv-1',
          ...data,
          totalAmount: data.rentAmount + data.maintenanceAmount + data.lateFee - data.discount,
        })
      );

      const res = await request(app)
        .post('/api/invoices')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send(validInvoiceDTO);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(prisma.rentInvoice.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            totalAmount: 2100, // 2000 + 150 + 50 - 100 = 2100
            rentAmount: 2000,
            status: InvoiceStatus.PENDING,
          }),
        })
      );
    });

    it('should reject invoice if discount exceeds sum (negative total)', async () => {
      const invalidDTO = {
        ...validInvoiceDTO,
        discount: 3000, // exceeds 2000 + 150 + 50
      };

      const res = await request(app)
        .post('/api/invoices')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send(invalidDTO);

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Total invoice amount cannot be negative');
    });

    it('should return 409 Conflict if invoice for billing month already exists for lease', async () => {
      (prisma.lease.findUnique as jest.Mock).mockResolvedValue({
        id: validInvoiceDTO.leaseId,
        unit: { floor: { building: { propertyId: 'prop-1' } } },
      });
      (prisma.rentInvoice.findFirst as jest.Mock).mockResolvedValue({
        id: 'existing-inv',
        billingMonth: '2026-03',
      });

      const res = await request(app)
        .post('/api/invoices')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send(validInvoiceDTO);

      expect(res.status).toBe(409);
      expect(res.body.message).toContain('already exists');
    });

    it('should return 403 Forbidden when TENANT attempts to create invoice', async () => {
      const res = await request(app)
        .post('/api/invoices')
        .set('Authorization', `Bearer ${tenantToken}`)
        .send(validInvoiceDTO);

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/invoices/:id', () => {
    it('should return invoice details to tenant if invoice belongs to their lease', async () => {
      (prisma.rentInvoice.findUnique as jest.Mock).mockResolvedValue({
        id: 'inv-1',
        totalAmount: 2000,
        paidAmount: 0,
        status: InvoiceStatus.PENDING,
        lease: {
          tenant: { userId: 'tenant-1' },
          unit: {
            floor: { building: { property: { name: 'Sunset Palms' } } },
            owners: [],
          },
        },
        payments: [],
      });

      const res = await request(app)
        .get('/api/invoices/inv-1')
        .set('Authorization', `Bearer ${tenantToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe('inv-1');
    });

    it('should reject with 403 when another tenant tries to access the invoice', async () => {
      (prisma.rentInvoice.findUnique as jest.Mock).mockResolvedValue({
        id: 'inv-1',
        totalAmount: 2000,
        paidAmount: 0,
        status: InvoiceStatus.PENDING,
        lease: {
          tenant: { userId: 'tenant-1' }, // belongs to tenant-1
          unit: {
            floor: { building: { property: { name: 'Sunset Palms' } } },
            owners: [],
          },
        },
        payments: [],
      });

      const res = await request(app)
        .get('/api/invoices/inv-1')
        .set('Authorization', `Bearer ${otherTenantToken}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('only view invoices for your own lease');
    });
  });
});

