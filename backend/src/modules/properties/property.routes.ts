import { Router } from 'express';
import { PropertyController } from './property.controller';
import { requireAuth, requireRole } from '../../middleware/auth.middleware';
import { validateBody } from '../../middleware/validation.middleware';
import { createPropertySchema, updatePropertySchema } from './property.schemas';
import { UserRole } from '../auth/auth.types';

const router = Router();

router.use(requireAuth);

router.get('/', PropertyController.list);
router.post(
  '/',
  requireRole(UserRole.SUPER_ADMIN, UserRole.PROPERTY_ADMIN),
  validateBody(createPropertySchema),
  PropertyController.create
);
router.get('/:id', PropertyController.getById);
router.patch(
  '/:id',
  requireRole(UserRole.SUPER_ADMIN, UserRole.PROPERTY_ADMIN),
  validateBody(updatePropertySchema),
  PropertyController.update
);
router.delete(
  '/:id',
  requireRole(UserRole.SUPER_ADMIN),
  PropertyController.delete
);

export default router;

