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
      notification: {
        count: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
    },
    connectDatabase: jest.fn().mockResolvedValue(true),
    disconnectDatabase: jest.fn().mockResolvedValue(undefined),
  };
});

describe('Notifications Module', () => {
  let userToken: string;
  let otherUserToken: string;

  beforeAll(() => {
    userToken = jwt.sign(
      { userId: 'user-1', email: 'user1@test.com', role: UserRole.TENANT, sessionId: 'sess-user1' },
      env.JWT_ACCESS_SECRET,
      { expiresIn: '15m' }
    );
    otherUserToken = jwt.sign(
      { userId: 'user-2', email: 'user2@test.com', role: UserRole.TENANT, sessionId: 'sess-user2' },
      env.JWT_ACCESS_SECRET,
      { expiresIn: '15m' }
    );
  });

  beforeEach(() => {
    jest.clearAllMocks();

    (prisma.session.findUnique as jest.Mock).mockImplementation(({ where }: { where: { id: string } }) => {
      const users: Record<string, any> = {
        'sess-user1': { id: 'user-1', email: 'user1@test.com', role: UserRole.TENANT, isActive: true },
        'sess-user2': { id: 'user-2', email: 'user2@test.com', role: UserRole.TENANT, isActive: true },
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

  describe('GET /api/notifications', () => {
    it('should retrieve list of notifications and unreadCount', async () => {
      (prisma.notification.count as jest.Mock)
        .mockResolvedValueOnce(5) // total
        .mockResolvedValueOnce(2); // unreadCount

      (prisma.notification.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'notif-1',
          userId: 'user-1',
          title: 'Rent Due Soon',
          message: 'Your invoice is due in 3 days',
          isRead: false,
          createdAt: new Date(),
        },
      ]);

      const res = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.notifications).toHaveLength(1);
      expect(res.body.data.unreadCount).toBe(2);
    });
  });

  describe('PATCH /api/notifications/:id/read', () => {
    it('should mark single notification as read', async () => {
      (prisma.notification.findUnique as jest.Mock).mockResolvedValue({
        id: 'notif-1',
        userId: 'user-1',
        isRead: false,
      });

      (prisma.notification.update as jest.Mock).mockResolvedValue({
        id: 'notif-1',
        userId: 'user-1',
        isRead: true,
        readAt: new Date(),
      });

      const res = await request(app)
        .patch('/api/notifications/notif-1/read')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isRead).toBe(true);
    });

    it('should prevent marking another user notification as read', async () => {
      (prisma.notification.findUnique as jest.Mock).mockResolvedValue({
        id: 'notif-1',
        userId: 'user-1',
        isRead: false,
      });

      const res = await request(app)
        .patch('/api/notifications/notif-1/read')
        .set('Authorization', `Bearer ${otherUserToken}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Forbidden');
    });
  });

  describe('PATCH /api/notifications/read-all', () => {
    it('should mark all unread notifications as read', async () => {
      (prisma.notification.updateMany as jest.Mock).mockResolvedValue({ count: 4 });

      const res = await request(app)
        .patch('/api/notifications/read-all')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.count).toBe(4);
    });
  });
});

