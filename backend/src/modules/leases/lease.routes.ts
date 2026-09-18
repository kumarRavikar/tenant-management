import { Router } from 'express';
import { LeaseController } from './lease.controller';
import { requireAuth, requireRole } from '../../middleware/auth.middleware';
import { validateBody } from '../../middleware/validation.middleware';
import {
  createLeaseSchema,
  updateLeaseSchema,
  terminateLeaseSchema,
  renewLeaseSchema,
} from './lease.schemas';
import { UserRole } from '../auth/auth.types';

const router = Router();

router.use(requireAuth);

router.get('/', LeaseController.list);

router.post(
  '/',
  requireRole(UserRole.SUPER_ADMIN, UserRole.PROPERTY_ADMIN, UserRole.MANAGER),
  validateBody(createLeaseSchema),
  LeaseController.create
);

router.get('/:id', LeaseController.getById);

router.patch(
  '/:id',
  requireRole(UserRole.SUPER_ADMIN, UserRole.PROPERTY_ADMIN, UserRole.MANAGER),
  validateBody(updateLeaseSchema),
  LeaseController.update
);

router.post(
  '/:id/terminate',
  requireRole(UserRole.SUPER_ADMIN, UserRole.PROPERTY_ADMIN, UserRole.MANAGER),
  validateBody(terminateLeaseSchema),
  LeaseController.terminate
);

router.post(
  '/:id/renew',
  requireRole(UserRole.SUPER_ADMIN, UserRole.PROPERTY_ADMIN, UserRole.MANAGER),
  validateBody(renewLeaseSchema),
  LeaseController.renew
);

export default router;

