import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../../../app';
import { prisma } from '../../../config/database';
import { env } from '../../../config/env';
import { UserRole } from '../../auth/auth.types';
import { VisitorStatus } from '@prisma/client';

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
      },
      ownerUnit: {
        findFirst: jest.fn(),
      },
      lease: {
        findFirst: jest.fn(),
      },
      visitor: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      notification: {
        create: jest.fn(),
      },
    },
    connectDatabase: jest.fn().mockResolvedValue(true),
    disconnectDatabase: jest.fn().mockResolvedValue(undefined),
  };
});

describe('Visitor Management Module', () => {
  let superAdminToken: string;
  let tenantToken: string;
  let managerToken: string;

  beforeAll(() => {
    superAdminToken = jwt.sign(
      { userId: 'admin-1', email: 'admin@test.com', role: UserRole.SUPER_ADMIN, sessionId: 'sess-admin' },
      env.JWT_ACCESS_SECRET,
      { expiresIn: '15m' }
    );
    managerToken = jwt.sign(
      { userId: 'mgr-1', email: 'manager@test.com', role: UserRole.MANAGER, sessionId: 'sess-mgr' },
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
        'sess-mgr': { id: 'mgr-1', email: 'manager@test.com', role: UserRole.MANAGER, isActive: true },
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

  describe('POST /api/visitors', () => {
    const validPayload = {
      propertyId: '11111111-1111-1111-1111-111111111111',
      unitId: '22222222-2222-2222-2222-222222222222',
      visitorName: 'Alice Johnson',
      phone: '+15551234567',
      purpose: 'Friend visiting',
      visitDate: '2026-03-25T10:00:00Z',
      isDelivery: false,
    };

    it('should successfully pre-approve visitor with gate pass code', async () => {
      (prisma.unit.findUnique as jest.Mock).mockResolvedValue({
        id: validPayload.unitId,
        unitNumber: '101',
        floor: {
          building: {
            propertyId: validPayload.propertyId,
          },
        },
      });

      (prisma.visitor.findUnique as jest.Mock).mockResolvedValue(null); // uniqueness check
      (prisma.visitor.create as jest.Mock).mockResolvedValue({
        id: 'visitor-1',
        ...validPayload,
        status: VisitorStatus.PRE_APPROVED,
        gatePassCode: 'PASS-ABC123',
        property: { id: validPayload.propertyId, name: 'Sunset Palms' },
        unit: { id: validPayload.unitId, unitNumber: '101' },
      });

      const res = await request(app)
        .post('/api/visitors')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send(validPayload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.gatePassCode).toBe('PASS-ABC123');
      expect(res.body.data.status).toBe(VisitorStatus.PRE_APPROVED);
    });

    it('should reject if unit does not belong to specified property', async () => {
      (prisma.unit.findUnique as jest.Mock).mockResolvedValue({
        id: validPayload.unitId,
        unitNumber: '101',
        floor: {
          building: {
            propertyId: 'different-property-id',
          },
        },
      });

      const res = await request(app)
        .post('/api/visitors')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send(validPayload);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Unit does not belong to the specified property');
    });
  });

  describe('GET /api/visitors', () => {
    it('should return paginated list of visitors', async () => {
      (prisma.visitor.count as jest.Mock).mockResolvedValue(1);
      (prisma.visitor.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'visitor-1',
          visitorName: 'Alice Johnson',
          gatePassCode: 'PASS-ABC123',
          status: VisitorStatus.PRE_APPROVED,
          property: { id: 'prop-1', name: 'Sunset Palms' },
          unit: { id: 'unit-1', unitNumber: '101' },
        },
      ]);

      const res = await request(app)
        .get('/api/visitors')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.meta.total).toBe(1);
    });
  });

  describe('POST /api/visitors/:id/check-in', () => {
    it('should check in visitor and set entryTime', async () => {
      (prisma.visitor.findUnique as jest.Mock).mockResolvedValue({
        id: 'visitor-1',
        propertyId: 'prop-1',
        unitId: 'unit-1',
        visitorName: 'Alice Johnson',
        status: VisitorStatus.PRE_APPROVED,
        hostUserId: 'tenant-1',
        unit: { unitNumber: '101' },
      });

      (prisma.visitor.update as jest.Mock).mockResolvedValue({
        id: 'visitor-1',
        status: VisitorStatus.CHECKED_IN,
        entryTime: new Date(),
        visitorName: 'Alice Johnson',
        hostUserId: 'tenant-1',
        property: { id: 'prop-1', name: 'Sunset Palms' },
        unit: { id: 'unit-1', unitNumber: '101' },
      });

      (prisma.notification.create as jest.Mock).mockResolvedValue({});

      const res = await request(app)
        .post('/api/visitors/visitor-1/check-in')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe(VisitorStatus.CHECKED_IN);
    });

    it('should reject check-in if visitor is already checked in', async () => {
      (prisma.visitor.findUnique as jest.Mock).mockResolvedValue({
        id: 'visitor-1',
        propertyId: 'prop-1',
        unitId: 'unit-1',
        visitorName: 'Alice Johnson',
        status: VisitorStatus.CHECKED_IN,
        unit: { unitNumber: '101' },
      });

      const res = await request(app)
        .post('/api/visitors/visitor-1/check-in')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('already checked in');
    });
  });

  describe('POST /api/visitors/:id/check-out', () => {
    it('should check out visitor and set exitTime', async () => {
      (prisma.visitor.findUnique as jest.Mock).mockResolvedValue({
        id: 'visitor-1',
        propertyId: 'prop-1',
        unitId: 'unit-1',
        visitorName: 'Alice Johnson',
        status: VisitorStatus.CHECKED_IN,
        hostUserId: 'tenant-1',
        unit: { unitNumber: '101' },
      });

      (prisma.visitor.update as jest.Mock).mockResolvedValue({
        id: 'visitor-1',
        status: VisitorStatus.CHECKED_OUT,
        exitTime: new Date(),
        visitorName: 'Alice Johnson',
        hostUserId: 'tenant-1',
        property: { id: 'prop-1', name: 'Sunset Palms' },
        unit: { id: 'unit-1', unitNumber: '101' },
      });

      (prisma.notification.create as jest.Mock).mockResolvedValue({});

      const res = await request(app)
        .post('/api/visitors/visitor-1/check-out')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe(VisitorStatus.CHECKED_OUT);
    });

    it('should reject check-out if visitor is not checked in', async () => {
      (prisma.visitor.findUnique as jest.Mock).mockResolvedValue({
        id: 'visitor-1',
        propertyId: 'prop-1',
        unitId: 'unit-1',
        visitorName: 'Alice Johnson',
        status: VisitorStatus.PRE_APPROVED,
        unit: { unitNumber: '101' },
      });

      const res = await request(app)
        .post('/api/visitors/visitor-1/check-out')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Cannot check out a visitor who is not currently checked in');
    });
  });
});

