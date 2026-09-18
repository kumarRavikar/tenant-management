import { Router } from 'express';
import { VisitorController } from './visitor.controller';
import { requireAuth, requireRole } from '../../middleware/auth.middleware';
import { validateBody } from '../../middleware/validation.middleware';
import { createVisitorSchema, updateVisitorSchema } from './visitor.schemas';
import { UserRole } from '../auth/auth.types';

const router = Router();

router.use(requireAuth);

router.get('/', VisitorController.list);
router.post('/', validateBody(createVisitorSchema), VisitorController.create);
router.get('/:id', VisitorController.getById);
router.patch('/:id', validateBody(updateVisitorSchema), VisitorController.update);

router.post(
  '/:id/check-in',
  requireRole(UserRole.SUPER_ADMIN, UserRole.PROPERTY_ADMIN, UserRole.MANAGER),
  VisitorController.checkIn
);

router.post(
  '/:id/check-out',
  requireRole(UserRole.SUPER_ADMIN, UserRole.PROPERTY_ADMIN, UserRole.MANAGER),
  VisitorController.checkOut
);

export default router;

