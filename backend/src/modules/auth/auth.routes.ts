import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { AuthController } from './auth.controller';
import { validateBody } from '../../middleware/validation.middleware';
import { requireAuth, requireRole } from '../../middleware/auth.middleware';
import { UserRole } from './auth.types';
import {
  registerSchema,
  loginSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  refreshTokenSchema,
} from './auth.schemas';
import { sendSuccess } from '../../utils/response';

const router = Router();

// Rate limiter for sensitive public authentication actions
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'test' ? 1000 : 30, // Relaxed limit for testing
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again after 15 minutes.',
    error: { code: 'RATE_LIMIT_EXCEEDED' },
  },
});

// Public Authentication Routes
router.post('/register', authLimiter, validateBody(registerSchema), AuthController.register);
router.post('/login', authLimiter, validateBody(loginSchema), AuthController.login);
router.post('/refresh', validateBody(refreshTokenSchema), AuthController.refresh);
router.post('/forgot-password', authLimiter, validateBody(forgotPasswordSchema), AuthController.forgotPassword);
router.post('/reset-password', authLimiter, validateBody(resetPasswordSchema), AuthController.resetPassword);

// Protected Authentication & Session Routes
router.get('/me', requireAuth, AuthController.getCurrentUser);
router.post('/logout', requireAuth, AuthController.logout);
router.post(
  '/change-password',
  requireAuth,
  validateBody(changePasswordSchema),
  AuthController.changePassword
);
router.get('/sessions', requireAuth, AuthController.getSessions);
router.delete('/sessions/:id', requireAuth, AuthController.revokeSession);

// RBAC Demonstration & Verification Route
router.get(
  '/admin-only',
  requireAuth,
  requireRole(UserRole.SUPER_ADMIN, UserRole.PROPERTY_ADMIN),
  (req, res) => {
    sendSuccess(res, 'Access granted to administrative portal', {
      userRole: req.user!.role,
      userEmail: req.user!.email,
    });
  }
);

export default router;

