import { Router } from 'express';
import { OwnerController } from './owner.controller';
import { requireAuth, requireRole } from '../../middleware/auth.middleware';
import { validateBody } from '../../middleware/validation.middleware';
import { createOwnerSchema, updateOwnerSchema, assignUnitSchema } from './owner.schemas';
import { UserRole } from '../auth/auth.types';

const router = Router();

router.use(requireAuth);

router.get('/', OwnerController.list);
router.post(
  '/',
  requireRole(UserRole.SUPER_ADMIN, UserRole.PROPERTY_ADMIN),
  validateBody(createOwnerSchema),
  OwnerController.create
);
router.get('/:id', OwnerController.getById);
router.patch(
  '/:id',
  requireRole(UserRole.SUPER_ADMIN, UserRole.PROPERTY_ADMIN, UserRole.OWNER),
  validateBody(updateOwnerSchema),
  OwnerController.update
);
router.post(
  '/:id/units',
  requireRole(UserRole.SUPER_ADMIN, UserRole.PROPERTY_ADMIN),
  validateBody(assignUnitSchema),
  OwnerController.assignUnit
);
router.delete(
  '/:id/units/:unitId',
  requireRole(UserRole.SUPER_ADMIN, UserRole.PROPERTY_ADMIN),
  OwnerController.unassignUnit
);
router.get('/:id/dashboard', OwnerController.getDashboard);

export default router;

