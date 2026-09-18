import request from 'supertest';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import app from '../../../app';
import { prisma } from '../../../config/database';
import { env } from '../../../config/env';
import { UserRole } from '../auth.types';

// Mock Prisma client methods
jest.mock('../../../config/database', () => {
  return {
    prisma: {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      session: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      passwordResetToken: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      userProperty: {
        findUnique: jest.fn(),
      },
      $transaction: jest.fn((promises) => Promise.all(promises)),
    },
    connectDatabase: jest.fn().mockResolvedValue(true),
    disconnectDatabase: jest.fn().mockResolvedValue(undefined),
  };
});

describe('Authentication & RBAC Module', () => {
  const mockPassword = 'Password123!';
  let mockHashedPassword: string;

  beforeAll(async () => {
    mockHashedPassword = await bcrypt.hash(mockPassword, 10);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    const validRegistration = {
      email: 'test@example.com',
      password: 'Password123!',
      firstName: 'John',
      lastName: 'Doe',
      phone: '1234567890',
      role: UserRole.TENANT,
    };

    it('should successfully register a new user and never return passwordHash', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.user.create as jest.Mock).mockResolvedValue({
        id: 'user-uuid-1',
        email: validRegistration.email,
        passwordHash: 'secret-hash',
        firstName: validRegistration.firstName,
        lastName: validRegistration.lastName,
        phone: validRegistration.phone,
        role: UserRole.TENANT,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send(validRegistration);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(validRegistration.email);
      expect(response.body.data.user.passwordHash).toBeUndefined();
    });

    it('should return 409 Conflict if email already exists', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'existing-id' });

      const response = await request(app)
        .post('/api/auth/register')
        .send(validRegistration);

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('EMAIL_EXISTS');
    });

    it('should return 400 Validation Error for weak password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          ...validRegistration,
          password: 'weak',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should successfully log in, return access token and set HTTP-only cookies', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'tenant@example.com',
        passwordHash: mockHashedPassword,
        firstName: 'Jane',
        lastName: 'Doe',
        phone: null,
        role: UserRole.TENANT,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        assignedProperties: [],
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.session.create as jest.Mock).mockResolvedValue({
        id: 'session-123',
        userId: mockUser.id,
        refreshToken: 'refresh-token-xyz',
        isValid: true,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'tenant@example.com', password: mockPassword });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.user.passwordHash).toBeUndefined();

      // Check HTTP-only cookies
      const rawCookies = response.headers['set-cookie'];
      expect(rawCookies).toBeDefined();
      const cookieList = Array.isArray(rawCookies) ? rawCookies : [rawCookies as string];
      expect(cookieList.some((c: string) => c.includes('accessToken='))).toBe(true);
      expect(cookieList.some((c: string) => c.includes('refreshToken='))).toBe(true);
    });

    it('should return 401 on wrong password', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-123',
        email: 'tenant@example.com',
        passwordHash: mockHashedPassword,
        isActive: true,
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'tenant@example.com', password: 'WrongPassword123!' });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('should return 401 for non-existent email', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nonexistent@example.com', password: 'Password123!' });

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should successfully rotate tokens with valid refresh token', async () => {
      const mockSession = {
        id: 'session-123',
        userId: 'user-123',
        refreshToken: 'valid-refresh-token',
        isValid: true,
        expiresAt: new Date(Date.now() + 100000),
        user: {
          id: 'user-123',
          email: 'user@example.com',
          role: UserRole.TENANT,
          isActive: true,
          firstName: 'John',
          lastName: 'Doe',
          phone: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          assignedProperties: [],
        },
      };

      (prisma.session.findUnique as jest.Mock).mockResolvedValue(mockSession);
      (prisma.session.update as jest.Mock).mockResolvedValue({ ...mockSession, refreshToken: 'new-token' });

      const response = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', ['refreshToken=valid-refresh-token'])
        .send();

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.accessToken).toBeDefined();
    });

    it('should return 401 when refresh token is invalid or expired', async () => {
      (prisma.session.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', ['refreshToken=invalid-token'])
        .send();

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('INVALID_REFRESH_TOKEN');
    });
  });

  describe('Protected API & RBAC Authorization', () => {
    let tenantToken: string;
    let superAdminToken: string;

    beforeAll(() => {
      tenantToken = jwt.sign(
        { userId: 'user-tenant', email: 'tenant@test.com', role: UserRole.TENANT, sessionId: 'sess-tenant' },
        env.JWT_ACCESS_SECRET,
        { expiresIn: '15m' }
      );
      superAdminToken = jwt.sign(
        { userId: 'user-admin', email: 'admin@test.com', role: UserRole.SUPER_ADMIN, sessionId: 'sess-admin' },
        env.JWT_ACCESS_SECRET,
        { expiresIn: '15m' }
      );
    });

    it('GET /api/auth/me should return 401 when no token is provided', async () => {
      const response = await request(app).get('/api/auth/me');
      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('GET /api/auth/me should succeed when valid token and session provided', async () => {
      (prisma.session.findUnique as jest.Mock).mockResolvedValue({
        id: 'sess-tenant',
        isValid: true,
        expiresAt: new Date(Date.now() + 100000),
        user: {
          id: 'user-tenant',
          email: 'tenant@test.com',
          role: UserRole.TENANT,
          isActive: true,
        },
      });

      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-tenant',
        email: 'tenant@test.com',
        firstName: 'Tenant',
        lastName: 'User',
        phone: null,
        role: UserRole.TENANT,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        assignedProperties: [],
      });

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${tenantToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.user.email).toBe('tenant@test.com');
    });

    it('GET /api/auth/admin-only should return 403 Forbidden for TENANT role', async () => {
      (prisma.session.findUnique as jest.Mock).mockResolvedValue({
        id: 'sess-tenant',
        isValid: true,
        expiresAt: new Date(Date.now() + 100000),
        user: {
          id: 'user-tenant',
          email: 'tenant@test.com',
          role: UserRole.TENANT,
          isActive: true,
        },
      });

      const response = await request(app)
        .get('/api/auth/admin-only')
        .set('Authorization', `Bearer ${tenantToken}`);

      expect(response.status).toBe(403);
      expect(response.body.error.code).toBe('FORBIDDEN');
    });

    it('GET /api/auth/admin-only should return 200 OK for SUPER_ADMIN role', async () => {
      (prisma.session.findUnique as jest.Mock).mockResolvedValue({
        id: 'sess-admin',
        isValid: true,
        expiresAt: new Date(Date.now() + 100000),
        user: {
          id: 'user-admin',
          email: 'admin@test.com',
          role: UserRole.SUPER_ADMIN,
          isActive: true,
        },
      });

      const response = await request(app)
        .get('/api/auth/admin-only')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.userRole).toBe(UserRole.SUPER_ADMIN);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should invalidate the current session and clear cookies', async () => {
      const validToken = jwt.sign(
        { userId: 'u1', email: 'u1@test.com', role: UserRole.TENANT, sessionId: 's1' },
        env.JWT_ACCESS_SECRET,
        { expiresIn: '15m' }
      );

      (prisma.session.findUnique as jest.Mock).mockResolvedValue({
        id: 's1',
        isValid: true,
        expiresAt: new Date(Date.now() + 100000),
        user: { id: 'u1', email: 'u1@test.com', role: UserRole.TENANT, isActive: true },
      });
      (prisma.session.updateMany as jest.Mock).mockResolvedValue({ count: 1 });

      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(prisma.session.updateMany).toHaveBeenCalledWith({
        where: { id: 's1' },
        data: { isValid: false },
      });
    });
  });

  describe('Password Reset Flow', () => {
    it('POST /api/auth/forgot-password creates a reset token', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'u-forgot',
        email: 'forgot@example.com',
      });
      (prisma.passwordResetToken.create as jest.Mock).mockResolvedValue({
        id: 'prt-1',
        token: 'test-token',
      });

      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'forgot@example.com' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(prisma.passwordResetToken.create).toHaveBeenCalled();
    });

    it('POST /api/auth/reset-password updates password and invalidates sessions', async () => {
      (prisma.passwordResetToken.findUnique as jest.Mock).mockResolvedValue({
        id: 'prt-1',
        userId: 'u-forgot',
        token: 'valid-reset-token',
        isUsed: false,
        expiresAt: new Date(Date.now() + 100000),
      });

      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: 'valid-reset-token',
          newPassword: 'NewPassword123!',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(prisma.$transaction).toHaveBeenCalled();
    });
  });

  describe('Session Management', () => {
    it('GET /api/auth/sessions returns active sessions', async () => {
      const validToken = jwt.sign(
        { userId: 'u1', email: 'u1@test.com', role: UserRole.TENANT, sessionId: 's1' },
        env.JWT_ACCESS_SECRET,
        { expiresIn: '15m' }
      );

      (prisma.session.findUnique as jest.Mock).mockResolvedValue({
        id: 's1',
        isValid: true,
        expiresAt: new Date(Date.now() + 100000),
        user: { id: 'u1', email: 'u1@test.com', role: UserRole.TENANT, isActive: true },
      });

      (prisma.session.findMany as jest.Mock).mockResolvedValue([
        {
          id: 's1',
          userAgent: 'Chrome',
          ipAddress: '127.0.0.1',
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 100000),
        },
      ]);

      const response = await request(app)
        .get('/api/auth/sessions')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.sessions).toHaveLength(1);
      expect(response.body.data.sessions[0].isCurrent).toBe(true);
    });

    it('DELETE /api/auth/sessions/:id invalidates specified session', async () => {
      const validToken = jwt.sign(
        { userId: 'u1', email: 'u1@test.com', role: UserRole.TENANT, sessionId: 's1' },
        env.JWT_ACCESS_SECRET,
        { expiresIn: '15m' }
      );

      (prisma.session.findUnique as jest.Mock).mockResolvedValue({
        id: 's1',
        isValid: true,
        expiresAt: new Date(Date.now() + 100000),
        user: { id: 'u1', email: 'u1@test.com', role: UserRole.TENANT, isActive: true },
      });

      (prisma.session.findFirst as jest.Mock).mockResolvedValue({
        id: 's2',
        userId: 'u1',
      });
      (prisma.session.update as jest.Mock).mockResolvedValue({ id: 's2', isValid: false });

      const response = await request(app)
        .delete('/api/auth/sessions/s2')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(prisma.session.update).toHaveBeenCalledWith({
        where: { id: 's2' },
        data: { isValid: false },
      });
    });
  });
});
