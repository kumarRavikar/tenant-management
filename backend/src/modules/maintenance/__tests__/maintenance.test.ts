import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../../../app';
import { prisma } from '../../../config/database';
import { env } from '../../../config/env';
import { UserRole } from '../../auth/auth.types';
import { MaintenancePriority, MaintenanceStatus, ActivityType, AttachmentType } from '@prisma/client';

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
      maintenanceTicket: {
        findMany: jest.fn(),
        count: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      ticketComment: {
        create: jest.fn(),
      },
      ticketAttachment: {
        create: jest.fn(),
      },
      ticketActivity: {
        create: jest.fn(),
        findMany: jest.fn(),
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

describe('Maintenance Tickets Module', () => {
  let superAdminToken: string;
  let managerToken: string;
  let tenantToken: string;
  let otherTenantToken: string;

  beforeAll(() => {
    superAdminToken = jwt.sign(
      { userId: 'admin-1', email: 'admin@test.com', role: UserRole.SUPER_ADMIN, sessionId: 'sess-admin' },
      env.JWT_ACCESS_SECRET,
      { expiresIn: '15m' }
    );
    managerToken = jwt.sign(
      { userId: 'manager-1', email: 'mgr@test.com', role: UserRole.MANAGER, sessionId: 'sess-mgr' },
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
      if (where.id === 'sess-mgr') {
        return Promise.resolve({
          id: 'sess-mgr',
          isValid: true,
          expiresAt: new Date(Date.now() + 100000),
          user: { id: 'manager-1', email: 'mgr@test.com', role: UserRole.MANAGER, isActive: true },
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

  describe('POST /api/maintenance', () => {
    const validDTO = {
      unitId: '00000000-0000-0000-0000-000000000001',
      title: 'Leaking kitchen faucet',
      description: 'Water is dripping constantly under the sink',
      priority: 'HIGH',
    };

    it('should allow tenant to create ticket for their leased unit and record CREATED activity', async () => {
      (prisma.unit.findUnique as jest.Mock).mockResolvedValue({
        id: validDTO.unitId,
        floor: { building: { propertyId: 'prop-1' } },
        leases: [{ tenant: { userId: 'tenant-1' } }],
        owners: [],
      });

      (prisma.maintenanceTicket.create as jest.Mock).mockResolvedValue({
        id: 'ticket-1',
        unitId: validDTO.unitId,
        createdById: 'tenant-1',
        title: validDTO.title,
        description: validDTO.description,
        priority: MaintenancePriority.HIGH,
        status: MaintenanceStatus.OPEN,
      });

      (prisma.ticketActivity.create as jest.Mock).mockResolvedValue({
        id: 'act-1',
        ticketId: 'ticket-1',
        userId: 'tenant-1',
        activityType: ActivityType.CREATED,
        description: 'Ticket created',
      });

      const res = await request(app)
        .post('/api/maintenance')
        .set('Authorization', `Bearer ${tenantToken}`)
        .send(validDTO);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(prisma.maintenanceTicket.create).toHaveBeenCalled();
      expect(prisma.ticketActivity.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            ticketId: 'ticket-1',
            activityType: ActivityType.CREATED,
          }),
        })
      );
    });

    it('should forbid tenant from creating ticket for unit they do not lease', async () => {
      (prisma.unit.findUnique as jest.Mock).mockResolvedValue({
        id: validDTO.unitId,
        floor: { building: { propertyId: 'prop-1' } },
        leases: [{ tenant: { userId: 'someone-else' } }],
        owners: [],
      });

      const res = await request(app)
        .post('/api/maintenance')
        .set('Authorization', `Bearer ${tenantToken}`)
        .send(validDTO);

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('only submit maintenance requests for your leased unit');
    });

    it('should validate body and fail if title is missing', async () => {
      const res = await request(app)
        .post('/api/maintenance')
        .set('Authorization', `Bearer ${tenantToken}`)
        .send({ unitId: validDTO.unitId, description: 'Test' });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Title is required');
    });
  });

  describe('GET /api/maintenance', () => {
    it('should list tickets scoped to user role', async () => {
      (prisma.maintenanceTicket.count as jest.Mock).mockResolvedValue(1);
      (prisma.maintenanceTicket.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'ticket-1',
          title: 'AC repair',
          status: MaintenanceStatus.OPEN,
          priority: MaintenancePriority.MEDIUM,
          createdAt: new Date(),
        },
      ]);

      const res = await request(app)
        .get('/api/maintenance')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
    });
  });

  describe('GET /api/maintenance/:id', () => {
    const mockTicket = {
      id: 'ticket-1',
      title: 'AC repair',
      status: MaintenanceStatus.OPEN,
      priority: MaintenancePriority.MEDIUM,
      createdById: 'tenant-1',
      unit: {
        floor: { building: { propertyId: 'prop-1' } },
        owners: [],
        leases: [{ tenant: { userId: 'tenant-1' } }],
      },
      comments: [],
      attachments: [],
      activities: [],
    };

    it('should allow authorized tenant to fetch ticket details', async () => {
      (prisma.maintenanceTicket.findUnique as jest.Mock).mockResolvedValue(mockTicket);

      const res = await request(app)
        .get('/api/maintenance/ticket-1')
        .set('Authorization', `Bearer ${tenantToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe('ticket-1');
    });

    it('should return 403 if unauthorized tenant accesses someone elses ticket', async () => {
      (prisma.maintenanceTicket.findUnique as jest.Mock).mockResolvedValue(mockTicket);

      const res = await request(app)
        .get('/api/maintenance/ticket-1')
        .set('Authorization', `Bearer ${otherTenantToken}`);

      expect(res.status).toBe(403);
    });

    it('should return 404 if ticket does not exist', async () => {
      (prisma.maintenanceTicket.findUnique as jest.Mock).mockResolvedValue(null);

      const res = await request(app)
        .get('/api/maintenance/non-existent')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /api/maintenance/:id', () => {
    const mockTicket = {
      id: 'ticket-1',
      title: 'Old Title',
      status: MaintenanceStatus.OPEN,
      priority: MaintenancePriority.LOW,
      assignedToId: 'manager-1',
      unit: {
        floor: { building: { propertyId: 'prop-1' } },
        owners: [],
        leases: [],
      },
    };

    it('should update status and record STATUS_CHANGED activity', async () => {
      (prisma.maintenanceTicket.findUnique as jest.Mock).mockResolvedValue(mockTicket);
      (prisma.maintenanceTicket.update as jest.Mock).mockResolvedValue({
        ...mockTicket,
        status: MaintenanceStatus.IN_PROGRESS,
      });

      const res = await request(app)
        .patch('/api/maintenance/ticket-1')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ status: MaintenanceStatus.IN_PROGRESS });

      expect(res.status).toBe(200);
      expect(prisma.ticketActivity.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            ticketId: 'ticket-1',
            activityType: ActivityType.STATUS_CHANGED,
            description: 'Status changed from OPEN to IN_PROGRESS',
          }),
        })
      );
    });

    it('should forbid unassigned tenant from changing status', async () => {
      (prisma.maintenanceTicket.findUnique as jest.Mock).mockResolvedValue({
        ...mockTicket,
        createdById: 'tenant-1',
        assignedToId: 'manager-1',
        unit: {
          floor: { building: { propertyId: 'prop-1' } },
          owners: [],
          leases: [{ tenant: { userId: 'tenant-1' } }],
        },
      });

      const res = await request(app)
        .patch('/api/maintenance/ticket-1')
        .set('Authorization', `Bearer ${tenantToken}`)
        .send({ status: MaintenanceStatus.RESOLVED });

      expect(res.status).toBe(403);
    });
  });

  describe('POST /api/maintenance/:id/assign', () => {
    const mockTicket = {
      id: 'ticket-1',
      status: MaintenanceStatus.OPEN,
      unit: {
        floor: { building: { propertyId: 'prop-1' } },
        owners: [],
        leases: [],
      },
    };

    const staffId = '00000000-0000-0000-0000-000000000002';

    it('should allow manager to assign staff member and transition status to ASSIGNED', async () => {
      (prisma.userProperty.findUnique as jest.Mock).mockResolvedValue({
        userId: 'manager-1',
        propertyId: 'prop-1',
      });
      (prisma.maintenanceTicket.findUnique as jest.Mock).mockResolvedValue(mockTicket);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: staffId,
        firstName: 'John',
        lastName: 'Technician',
        role: UserRole.MANAGER,
      });
      (prisma.maintenanceTicket.update as jest.Mock).mockResolvedValue({
        ...mockTicket,
        assignedToId: staffId,
        status: MaintenanceStatus.ASSIGNED,
      });

      const res = await request(app)
        .post('/api/maintenance/ticket-1/assign')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ assignedToId: staffId });

      expect(res.status).toBe(200);
      expect(prisma.maintenanceTicket.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            assignedToId: staffId,
            status: MaintenanceStatus.ASSIGNED,
          }),
        })
      );
      expect(prisma.ticketActivity.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            activityType: ActivityType.ASSIGNED,
            description: 'Assigned to John Technician',
          }),
        })
      );
    });

    it('should forbid tenant from assigning staff', async () => {
      const res = await request(app)
        .post('/api/maintenance/ticket-1/assign')
        .set('Authorization', `Bearer ${tenantToken}`)
        .send({ assignedToId: staffId });

      expect(res.status).toBe(403);
    });
  });

  describe('POST /api/maintenance/:id/comments', () => {
    it('should add comment and record COMMENT_ADDED activity', async () => {
      (prisma.maintenanceTicket.findUnique as jest.Mock).mockResolvedValue({
        id: 'ticket-1',
        unit: {
          floor: { building: { propertyId: 'prop-1' } },
          owners: [],
          leases: [{ tenant: { userId: 'tenant-1' } }],
        },
      });

      (prisma.ticketComment.create as jest.Mock).mockResolvedValue({
        id: 'comment-1',
        ticketId: 'ticket-1',
        userId: 'tenant-1',
        comment: 'Please come before 2pm',
      });

      const res = await request(app)
        .post('/api/maintenance/ticket-1/comments')
        .set('Authorization', `Bearer ${tenantToken}`)
        .send({ comment: 'Please come before 2pm' });

      expect(res.status).toBe(201);
      expect(prisma.ticketComment.create).toHaveBeenCalled();
      expect(prisma.ticketActivity.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            activityType: ActivityType.COMMENT_ADDED,
          }),
        })
      );
    });
  });

  describe('POST /api/maintenance/:id/attachments', () => {
    it('should successfully upload file attachment and create ATTACHMENT_ADDED activity', async () => {
      (prisma.maintenanceTicket.findUnique as jest.Mock).mockResolvedValue({
        id: 'ticket-1',
        unit: {
          floor: { building: { propertyId: 'prop-1' } },
          owners: [],
          leases: [{ tenant: { userId: 'tenant-1' } }],
        },
      });

      (prisma.ticketAttachment.create as jest.Mock).mockResolvedValue({
        id: 'att-1',
        ticketId: 'ticket-1',
        fileName: 'broken_sink.png',
        fileUrl: '/uploads/maintenance/mock-file.png',
        attachmentType: AttachmentType.PHOTO,
      });

      const res = await request(app)
        .post('/api/maintenance/ticket-1/attachments')
        .set('Authorization', `Bearer ${tenantToken}`)
        .attach('file', Buffer.from('fake-image-bytes'), {
          filename: 'broken_sink.png',
          contentType: 'image/png',
        });

      expect(res.status).toBe(201);
      expect(prisma.ticketAttachment.create).toHaveBeenCalled();
      expect(prisma.ticketActivity.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            activityType: ActivityType.ATTACHMENT_ADDED,
          }),
        })
      );
    });
  });

  describe('GET /api/maintenance/:id/activity', () => {
    it('should return chronological ticket activity audit logs', async () => {
      (prisma.maintenanceTicket.findUnique as jest.Mock).mockResolvedValue({
        id: 'ticket-1',
        unit: {
          floor: { building: { propertyId: 'prop-1' } },
          owners: [],
          leases: [{ tenant: { userId: 'tenant-1' } }],
        },
      });

      (prisma.ticketActivity.findMany as jest.Mock).mockResolvedValue([
        { id: 'act-1', activityType: ActivityType.CREATED, description: 'Ticket created', createdAt: new Date() },
        { id: 'act-2', activityType: ActivityType.ASSIGNED, description: 'Assigned to tech', createdAt: new Date() },
      ]);

      const res = await request(app)
        .get('/api/maintenance/ticket-1/activity')
        .set('Authorization', `Bearer ${tenantToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.data[0].activityType).toBe(ActivityType.CREATED);
    });
  });
});
