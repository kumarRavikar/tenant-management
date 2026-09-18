import { Router } from 'express';
import { TenantController } from './tenant.controller';
import { requireAuth, requireRole } from '../../middleware/auth.middleware';
import { validateBody } from '../../middleware/validation.middleware';
import { createTenantSchema, updateTenantSchema } from './tenant.schemas';
import { UserRole } from '../auth/auth.types';

const router = Router();

router.use(requireAuth);

router.get('/', TenantController.list);
router.post(
  '/',
  requireRole(UserRole.SUPER_ADMIN, UserRole.PROPERTY_ADMIN, UserRole.MANAGER),
  validateBody(createTenantSchema),
  TenantController.create
);
router.get('/:id', TenantController.getById);
router.patch(
  '/:id',
  requireRole(UserRole.SUPER_ADMIN, UserRole.PROPERTY_ADMIN, UserRole.MANAGER, UserRole.TENANT),
  validateBody(updateTenantSchema),
  TenantController.update
);

export default router;

