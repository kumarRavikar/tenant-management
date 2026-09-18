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
        findUnique: jest.fn(),
      },
      property: {
        findMany: jest.fn(),
        count: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      building: {
        count: jest.fn(),
      },
      lease: {
        count: jest.fn(),
      },
      $transaction: jest.fn((cb) => (typeof cb === 'function' ? cb(prisma) : Promise.all(cb))),
    },
    connectDatabase: jest.fn().mockResolvedValue(true),
    disconnectDatabase: jest.fn().mockResolvedValue(undefined),
  };
});

describe('Property Management Module', () => {
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

  describe('GET /api/properties', () => {
    it('should list properties for super admin with pagination', async () => {
      (prisma.property.count as jest.Mock).mockResolvedValue(1);
      (prisma.property.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'prop-1',
          name: 'Grand Horizon Heights',
          address: '100 Sunset Blvd',
          city: 'Los Angeles',
          state: 'CA',
          postalCode: '90001',
          country: 'USA',
          description: 'Luxury residences',
          createdAt: new Date(),
          updatedAt: new Date(),
          _count: { buildings: 2 },
        },
      ]);

      const res = await request(app)
        .get('/api/properties?page=1&limit=10')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.meta.total).toBe(1);
      expect(res.body.data[0].name).toBe('Grand Horizon Heights');
    });

    it('should return 401 when no token is provided', async () => {
      const res = await request(app).get('/api/properties');
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/properties', () => {
    it('should create property successfully by SUPER_ADMIN', async () => {
      const newProperty = {
        name: 'Skyline Towers',
        address: '500 Market St',
        city: 'San Francisco',
        state: 'CA',
        postalCode: '94105',
        country: 'USA',
        description: 'Modern urban units',
      };

      (prisma.property.create as jest.Mock).mockResolvedValue({
        id: 'prop-2',
        ...newProperty,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const res = await request(app)
        .post('/api/properties')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send(newProperty);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Skyline Towers');
    });

    it('should fail with 400 when required fields are missing', async () => {
      const res = await request(app)
        .post('/api/properties')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ name: 'Incomplete' });

      expect(res.status).toBe(400);
    });

    it('should fail with 403 when user is TENANT', async () => {
      const res = await request(app)
        .post('/api/properties')
        .set('Authorization', `Bearer ${tenantToken}`)
        .send({
          name: 'Forbidden Property',
          address: '123 St',
          city: 'City',
        });

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/properties/:id', () => {
    it('should retrieve property details with full hierarchy', async () => {
      (prisma.property.findFirst as jest.Mock).mockResolvedValue({
        id: 'prop-1',
        name: 'Grand Horizon Heights',
        address: '100 Sunset Blvd',
        city: 'Los Angeles',
        state: 'CA',
        postalCode: '90001',
        country: 'USA',
        description: 'Luxury residences',
        buildings: [
          {
            id: 'bldg-1',
            name: 'Tower A',
            floors: [
              {
                id: 'floor-1',
                floorNumber: 1,
                units: [{ id: 'unit-1', unitNumber: '101', status: 'VACANT' }],
              },
            ],
          },
        ],
      });

      const res = await request(app)
        .get('/api/properties/prop-1')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.buildings).toHaveLength(1);
      expect(res.body.data.buildings[0].name).toBe('Tower A');
    });

    it('should return 404 for non-existent property', async () => {
      (prisma.property.findFirst as jest.Mock).mockResolvedValue(null);

      const res = await request(app)
        .get('/api/properties/non-existent')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/properties/:id', () => {
    it('should prevent deletion if property contains active leases', async () => {
      (prisma.lease.count as jest.Mock).mockResolvedValue(2);

      const res = await request(app)
        .delete('/api/properties/prop-1')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Cannot delete property containing active leases');
    });

    it('should allow deletion if property has no active leases', async () => {
      (prisma.lease.count as jest.Mock).mockResolvedValue(0);
      (prisma.property.delete as jest.Mock).mockResolvedValue({ id: 'prop-1' });

      const res = await request(app)
        .delete('/api/properties/prop-1')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
