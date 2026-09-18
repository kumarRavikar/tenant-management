import { Router } from 'express';
import { BuildingController } from './building.controller';
import { requireAuth, requireRole } from '../../middleware/auth.middleware';
import { validateBody } from '../../middleware/validation.middleware';
import { createBuildingSchema, updateBuildingSchema } from './building.schemas';
import { UserRole } from '../auth/auth.types';

const router = Router();

router.use(requireAuth);

router.get('/', BuildingController.list);
router.post(
  '/',
  requireRole(UserRole.SUPER_ADMIN, UserRole.PROPERTY_ADMIN),
  validateBody(createBuildingSchema),
  BuildingController.create
);
router.get('/:id', BuildingController.getById);
router.patch(
  '/:id',
  requireRole(UserRole.SUPER_ADMIN, UserRole.PROPERTY_ADMIN),
  validateBody(updateBuildingSchema),
  BuildingController.update
);
router.delete(
  '/:id',
  requireRole(UserRole.SUPER_ADMIN, UserRole.PROPERTY_ADMIN),
  BuildingController.delete
);

export default router;

