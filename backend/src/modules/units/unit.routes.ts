import { Router } from 'express';
import { UnitController } from './unit.controller';
import { requireAuth, requireRole } from '../../middleware/auth.middleware';
import { validateBody } from '../../middleware/validation.middleware';
import { createUnitSchema, updateUnitSchema } from './unit.schemas';
import { UserRole } from '../auth/auth.types';

const router = Router();

router.use(requireAuth);

router.get('/', UnitController.list);
router.post(
  '/',
  requireRole(UserRole.SUPER_ADMIN, UserRole.PROPERTY_ADMIN),
  validateBody(createUnitSchema),
  UnitController.create
);
router.get('/:id', UnitController.getById);
router.patch(
  '/:id',
  requireRole(UserRole.SUPER_ADMIN, UserRole.PROPERTY_ADMIN, UserRole.MANAGER),
  validateBody(updateUnitSchema),
  UnitController.update
);

export default router;

