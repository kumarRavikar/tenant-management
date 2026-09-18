import { Router } from 'express';
import { FloorController } from './floor.controller';
import { requireAuth, requireRole } from '../../middleware/auth.middleware';
import { validateBody } from '../../middleware/validation.middleware';
import { createFloorSchema, updateFloorSchema } from './floor.schemas';
import { UserRole } from '../auth/auth.types';

const router = Router();

router.use(requireAuth);

router.get('/', FloorController.list);
router.post(
  '/',
  requireRole(UserRole.SUPER_ADMIN, UserRole.PROPERTY_ADMIN),
  validateBody(createFloorSchema),
  FloorController.create
);
router.get('/:id', FloorController.getById);
router.patch(
  '/:id',
  requireRole(UserRole.SUPER_ADMIN, UserRole.PROPERTY_ADMIN),
  validateBody(updateFloorSchema),
  FloorController.update
);
router.delete(
  '/:id',
  requireRole(UserRole.SUPER_ADMIN, UserRole.PROPERTY_ADMIN),
  FloorController.delete
);

export default router;

