import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { prisma } from '../config/database';
import { sendError } from '../utils/response';
import { JwtPayload, UserRole } from '../modules/auth/auth.types';

// Augment Express Request interface with authenticated user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: UserRole;
        sessionId: string;
      };
    }
  }
}

/**
 * Validates JWT access token from Authorization header or cookie.
 * Ensures the session is still active in database.
 */
export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token: string | undefined;

    // 1. Check Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    // 2. Fallback to HTTP-only cookie
    if (!token && req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      sendError(res, 'Authentication required. Please sign in.', 401, 'UNAUTHORIZED');
      return;
    }

    // Verify token
    let decoded: JwtPayload;
    try {
      decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload;
    } catch {
      sendError(res, 'Invalid or expired access token', 401, 'INVALID_TOKEN');
      return;
    }

    // Verify session validity in database
    const session = await prisma.session.findUnique({
      where: { id: decoded.sessionId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            isActive: true,
          },
        },
      },
    });

    if (!session || !session.isValid || session.expiresAt < new Date()) {
      sendError(res, 'Session has expired or been revoked', 401, 'SESSION_INVALID');
      return;
    }

    if (!session.user || !session.user.isActive) {
      sendError(res, 'User account is deactivated', 403, 'ACCOUNT_DEACTIVATED');
      return;
    }

    req.user = {
      id: session.user.id,
      email: session.user.email,
      role: session.user.role,
      sessionId: session.id,
    };

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Reusable RBAC middleware checking user roles against allowed roles.
 */
export const requireRole = (...allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 'Authentication required', 401, 'UNAUTHORIZED');
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      sendError(
        res,
        `Forbidden: Role '${req.user.role}' lacks permission for this resource.`,
        403,
        'FORBIDDEN'
      );
      return;
    }

    next();
  };
};

/**
 * Property-scoped authorization middleware.
 * SUPER_ADMIN has global access.
 * PROPERTY_ADMIN and MANAGER are restricted to properties assigned in user_properties.
 */
export const requirePropertyScope = (
  propertyIdExtractor: (req: Request) => string | undefined = (req) =>
    (req.params.propertyId || req.body.propertyId || req.query.propertyId) as string | undefined
) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        sendError(res, 'Authentication required', 401, 'UNAUTHORIZED');
        return;
      }

      // SUPER_ADMIN has platform-wide global scope
      if (req.user.role === UserRole.SUPER_ADMIN) {
        return next();
      }

      const propertyId = propertyIdExtractor(req);
      if (!propertyId) {
        sendError(res, 'Target property identifier is required', 400, 'PROPERTY_ID_REQUIRED');
        return;
      }

      // Check assignment in user_properties
      const assignment = await prisma.userProperty.findUnique({
        where: {
          userId_propertyId: {
            userId: req.user.id,
            propertyId,
          },
        },
      });

      if (!assignment) {
        sendError(
          res,
          'Forbidden: You do not have management permissions for this property.',
          403,
          'PROPERTY_ACCESS_DENIED'
        );
        return;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

