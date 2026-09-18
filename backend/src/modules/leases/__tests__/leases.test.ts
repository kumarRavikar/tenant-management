import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../../../app';
import { prisma } from '../../../config/database';
import { env } from '../../../config/env';
import { UserRole } from '../../auth/auth.types';
import { LeaseStatus, UnitStatus } from '@prisma/client';

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
      unit: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      tenantProfile: {
        findUnique: jest.fn(),
      },
      lease: {
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

describe('Lease Management Module', () => {
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
      return Promise.resolve(null);
    });
  });

  describe('GET /api/leases', () => {
    it('should list leases with pagination', async () => {
      (prisma.lease.count as jest.Mock).mockResolvedValue(1);
      (prisma.lease.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'lease-1',
          unitId: 'unit-1',
          tenantProfileId: 'tp-1',
          startDate: new Date('2026-01-01'),
          endDate: new Date('2026-12-31'),
          monthlyRent: 2400,
          securityDeposit: 2400,
          status: LeaseStatus.ACTIVE,
          unit: {
            id: 'unit-1',
            unitNumber: '101',
            floor: { building: { property: { id: 'p-1', name: 'Tower A' } } },
          },
          tenant: {
            id: 'tp-1',
            user: { firstName: 'Alice', lastName: 'Tenant', email: 'alice@test.com' },
          },
        },
      ]);

      const res = await request(app)
        .get('/api/leases?page=1&limit=10')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.meta.total).toBe(1);
    });
  });

  describe('POST /api/leases', () => {
    const validLeaseDTO = {
      unitId: '00000000-0000-0000-0000-000000000001',
      tenantProfileId: '00000000-0000-0000-0000-000000000002',
      startDate: '2026-01-01T00:00:00.000Z',
      endDate: '2026-12-31T00:00:00.000Z',
      monthlyRent: 2500,
      securityDeposit: 2500,
      status: LeaseStatus.ACTIVE,
    };

    it('should prevent conflicting active lease on the same unit', async () => {
      (prisma.unit.findUnique as jest.Mock).mockResolvedValue({
        id: validLeaseDTO.unitId,
        floor: { building: { propertyId: 'prop-1' } },
      });
      (prisma.tenantProfile.findUnique as jest.Mock).mockResolvedValue({
        id: validLeaseDTO.tenantProfileId,
      });
      // Mock conflicting lease exists
      (prisma.lease.findFirst as jest.Mock).mockResolvedValue({
        id: 'existing-active-lease',
        unitId: validLeaseDTO.unitId,
        status: LeaseStatus.ACTIVE,
      });

      const res = await request(app)
        .post('/api/leases')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send(validLeaseDTO);

      expect(res.status).toBe(409);
      expect(res.body.message).toContain('active lease already exists');
    });

    it('should successfully create lease and update unit to OCCUPIED inside transaction', async () => {
      (prisma.unit.findUnique as jest.Mock).mockResolvedValue({
        id: validLeaseDTO.unitId,
        floor: { building: { propertyId: 'prop-1' } },
      });
      (prisma.tenantProfile.findUnique as jest.Mock).mockResolvedValue({
        id: validLeaseDTO.tenantProfileId,
      });
      (prisma.lease.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.lease.create as jest.Mock).mockResolvedValue({
        id: 'lease-new',
        ...validLeaseDTO,
      });
      (prisma.unit.update as jest.Mock).mockResolvedValue({
        id: validLeaseDTO.unitId,
        status: UnitStatus.OCCUPIED,
      });

      const res = await request(app)
        .post('/api/leases')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send(validLeaseDTO);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(prisma.unit.update).toHaveBeenCalledWith({
        where: { id: validLeaseDTO.unitId },
        data: { status: UnitStatus.OCCUPIED },
      });
    });
  });

  describe('POST /api/leases/:id/terminate', () => {
    it('should fail if lease is already terminated', async () => {
      (prisma.lease.findUnique as jest.Mock).mockResolvedValue({
        id: 'lease-1',
        status: LeaseStatus.TERMINATED,
        unitId: 'unit-1',
        unit: { floor: { building: { propertyId: 'prop-1' } } },
      });

      const res = await request(app)
        .post('/api/leases/lease-1/terminate')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('already terminated');
    });

    it('should terminate lease and update unit to VACANT if no other active leases', async () => {
      (prisma.lease.findUnique as jest.Mock).mockResolvedValue({
        id: 'lease-1',
        status: LeaseStatus.ACTIVE,
        unitId: 'unit-1',
        unit: { floor: { building: { propertyId: 'prop-1' } } },
      });
      (prisma.lease.update as jest.Mock).mockResolvedValue({
        id: 'lease-1',
        status: LeaseStatus.TERMINATED,
      });
      (prisma.lease.findFirst as jest.Mock).mockResolvedValue(null); // No other active lease
      (prisma.unit.update as jest.Mock).mockResolvedValue({
        id: 'unit-1',
        status: UnitStatus.VACANT,
      });

      const res = await request(app)
        .post('/api/leases/lease-1/terminate')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ terms: 'Early termination agreed' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(prisma.unit.update).toHaveBeenCalledWith({
        where: { id: 'unit-1' },
        data: { status: UnitStatus.VACANT },
      });
    });
  });

  describe('POST /api/leases/:id/renew', () => {
    it('should renew lease sequential to existing lease', async () => {
      (prisma.lease.findUnique as jest.Mock).mockResolvedValue({
        id: 'lease-1',
        unitId: 'unit-1',
        tenantProfileId: 'tp-1',
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31'),
        monthlyRent: 2000,
        securityDeposit: 2000,
        unit: { floor: { building: { propertyId: 'prop-1' } } },
      });
      (prisma.lease.findFirst as jest.Mock).mockResolvedValue(null); // No conflict
      (prisma.lease.create as jest.Mock).mockResolvedValue({
        id: 'lease-2',
        unitId: 'unit-1',
        tenantProfileId: 'tp-1',
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-12-31'),
        monthlyRent: 2200,
        status: LeaseStatus.ACTIVE,
      });
      (prisma.unit.update as jest.Mock).mockResolvedValue({
        id: 'unit-1',
        status: UnitStatus.OCCUPIED,
      });

      const res = await request(app)
        .post('/api/leases/lease-1/renew')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          startDate: '2026-01-01T00:00:00.000Z',
          endDate: '2026-12-31T00:00:00.000Z',
          monthlyRent: 2200,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });
  });
});
