import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma } from '../../config/database';
import { env } from '../../config/env';
import { AppError } from '../../middleware/error.middleware';
import {
  RegisterDTO,
  LoginDTO,
  ChangePasswordDTO,
  ForgotPasswordDTO,
  ResetPasswordDTO,
  AuthResponseData,
  SanitizedUser,
  JwtPayload,
  SessionInfo,
  UserRole,
} from './auth.types';

export class AuthService {
  private static readonly SALT_ROUNDS = 12;

  /**
   * Strips passwordHash and returns a clean SanitizedUser object.
   */
  public static sanitizeUser(user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone: string | null;
    role: UserRole;
    isActive: boolean;
    assignedProperties?: {
      propertyId: string;
      property?: { name: string };
    }[];
    createdAt: Date;
    updatedAt: Date;
  }): SanitizedUser {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      role: user.role,
      isActive: user.isActive,
      assignedProperties: user.assignedProperties?.map((ap) => ({
        propertyId: ap.propertyId,
        propertyName: ap.property?.name,
      })),
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  /**
   * Generates JWT access token (short-lived)
   */
  private static generateAccessToken(payload: JwtPayload): string {
    return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
      expiresIn: env.JWT_ACCESS_EXPIRATION as jwt.SignOptions['expiresIn'],
    });
  }

  /**
   * Generates cryptographically secure refresh token
   */
  private static generateRefreshToken(): string {
    return crypto.randomBytes(40).toString('hex');
  }

  /**
   * Calculates refresh token expiration date (default 7 days)
   */
  private static getRefreshTokenExpiresAt(): Date {
    return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  }

  /**
   * Registers a new user with hashed password.
   */
  public static async register(dto: RegisterDTO): Promise<SanitizedUser> {
    const existingUser = await prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new AppError('Email is already registered', 409, 'EMAIL_EXISTS');
    }

    const passwordHash = await bcrypt.hash(dto.password, this.SALT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone || null,
        role: dto.role || UserRole.TENANT,
        isActive: true,
      },
    });

    return this.sanitizeUser(user);
  }

  /**
   * Authenticates user and issues access + refresh tokens.
   */
  public static async login(
    dto: LoginDTO,
    meta: { userAgent?: string; ipAddress?: string }
  ): Promise<AuthResponseData> {
    const user = await prisma.user.findUnique({
      where: { email: dto.email },
      include: {
        assignedProperties: {
          include: {
            property: true,
          },
        },
      },
    });

    if (!user) {
      throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    if (!user.isActive) {
      throw new AppError('Your account has been deactivated. Please contact support.', 403, 'ACCOUNT_DEACTIVATED');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    const rawRefreshToken = this.generateRefreshToken();
    const expiresAt = this.getRefreshTokenExpiresAt();

    // Create session in database
    const session = await prisma.session.create({
      data: {
        userId: user.id,
        refreshToken: rawRefreshToken,
        userAgent: meta.userAgent || null,
        ipAddress: meta.ipAddress || null,
        isValid: true,
        expiresAt,
      },
    });

    const accessToken = this.generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      sessionId: session.id,
    });

    return {
      user: this.sanitizeUser(user),
      tokens: {
        accessToken,
        refreshToken: rawRefreshToken,
      },
    };
  }

  /**
   * Refreshes access token and rotates refresh token.
   */
  public static async refreshToken(
    oldRefreshToken: string,
    meta: { userAgent?: string; ipAddress?: string }
  ): Promise<AuthResponseData> {
    if (!oldRefreshToken) {
      throw new AppError('Refresh token is required', 400, 'MISSING_REFRESH_TOKEN');
    }

    const session = await prisma.session.findUnique({
      where: { refreshToken: oldRefreshToken },
      include: {
        user: {
          include: {
            assignedProperties: {
              include: {
                property: true,
              },
            },
          },
        },
      },
    });

    if (!session || !session.isValid || session.expiresAt < new Date()) {
      throw new AppError('Invalid or expired refresh token', 401, 'INVALID_REFRESH_TOKEN');
    }

    if (!session.user || !session.user.isActive) {
      throw new AppError('User account is deactivated', 403, 'ACCOUNT_DEACTIVATED');
    }

    // Refresh Token Rotation: generate a new refresh token and update the existing session
    const newRefreshToken = this.generateRefreshToken();
    const newExpiresAt = this.getRefreshTokenExpiresAt();

    await prisma.session.update({
      where: { id: session.id },
      data: {
        refreshToken: newRefreshToken,
        expiresAt: newExpiresAt,
        userAgent: meta.userAgent || session.userAgent,
        ipAddress: meta.ipAddress || session.ipAddress,
      },
    });

    const newAccessToken = this.generateAccessToken({
      userId: session.user.id,
      email: session.user.email,
      role: session.user.role,
      sessionId: session.id,
    });

    return {
      user: this.sanitizeUser(session.user),
      tokens: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      },
    };
  }

  /**
   * Invalidate the current session upon logout.
   */
  public static async logout(sessionId: string): Promise<void> {
    if (!sessionId) return;

    await prisma.session.updateMany({
      where: { id: sessionId },
      data: { isValid: false },
    });
  }

  /**
   * Retrieves the current authenticated user profile.
   */
  public static async getCurrentUser(userId: string): Promise<SanitizedUser> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        assignedProperties: {
          include: {
            property: true,
          },
        },
      },
    });

    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    return this.sanitizeUser(user);
  }

  /**
   * Changes password and revokes all existing sessions.
   */
  public static async changePassword(userId: string, dto: ChangePasswordDTO): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    const isMatch = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!isMatch) {
      throw new AppError('Current password does not match', 400, 'INVALID_CURRENT_PASSWORD');
    }

    const newPasswordHash = await bcrypt.hash(dto.newPassword, this.SALT_ROUNDS);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { passwordHash: newPasswordHash },
      }),
      // Invalidate all active sessions for security
      prisma.session.updateMany({
        where: { userId },
        data: { isValid: false },
      }),
    ]);
  }

  /**
   * Creates a password reset token.
   */
  public static async forgotPassword(
    dto: ForgotPasswordDTO
  ): Promise<{ message: string; resetToken?: string }> {
    const user = await prisma.user.findUnique({
      where: { email: dto.email },
    });

    // For security reasons, don't leak whether the email exists
    if (!user) {
      return { message: 'If an account exists with this email, password reset instructions have been generated.' };
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
        isUsed: false,
      },
    });

    return {
      message: 'Password reset token generated successfully.',
      // In development, return token for testing convenience
      ...(process.env.NODE_ENV !== 'production' && { resetToken: token }),
    };
  }

  /**
   * Resets password using valid token and invalidates all sessions.
   */
  public static async resetPassword(dto: ResetPasswordDTO): Promise<void> {
    const resetRecord = await prisma.passwordResetToken.findUnique({
      where: { token: dto.token },
    });

    if (!resetRecord || resetRecord.isUsed || resetRecord.expiresAt < new Date()) {
      throw new AppError('Invalid or expired password reset token', 400, 'INVALID_RESET_TOKEN');
    }

    const newPasswordHash = await bcrypt.hash(dto.newPassword, this.SALT_ROUNDS);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetRecord.userId },
        data: { passwordHash: newPasswordHash },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetRecord.id },
        data: { isUsed: true },
      }),
      // Revoke all existing sessions
      prisma.session.updateMany({
        where: { userId: resetRecord.userId },
        data: { isValid: false },
      }),
    ]);
  }

  /**
   * Retrieves all active sessions for a user.
   */
  public static async getUserSessions(userId: string, currentSessionId: string): Promise<SessionInfo[]> {
    const sessions = await prisma.session.findMany({
      where: {
        userId,
        isValid: true,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    return sessions.map((s) => ({
      id: s.id,
      userAgent: s.userAgent,
      ipAddress: s.ipAddress,
      isCurrent: s.id === currentSessionId,
      createdAt: s.createdAt,
      expiresAt: s.expiresAt,
    }));
  }

  /**
   * Revokes a specific session belonging to the user.
   */
  public static async revokeSession(userId: string, sessionId: string): Promise<void> {
    const session = await prisma.session.findFirst({
      where: { id: sessionId, userId },
    });

    if (!session) {
      throw new AppError('Session not found', 404, 'SESSION_NOT_FOUND');
    }

    await prisma.session.update({
      where: { id: sessionId },
      data: { isValid: false },
    });
  }
}

