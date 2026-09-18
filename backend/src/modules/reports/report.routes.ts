import { Router } from 'express';
import { ReportController } from './report.controller';
import { requireAuth, requireRole } from '../../middleware/auth.middleware';
import { UserRole } from '../auth/auth.types';

const router = Router();

router.use(requireAuth);
router.use(
  requireRole(
    UserRole.SUPER_ADMIN,
    UserRole.PROPERTY_ADMIN,
    UserRole.MANAGER,
    UserRole.OWNER
  )
);

router.get('/occupancy', ReportController.getOccupancyReport);
router.get('/rent-collection', ReportController.getRentCollectionReport);
router.get('/payments', ReportController.getPaymentTransactionReport);
router.get('/maintenance', ReportController.getMaintenanceReport);
router.get('/lease-expiration', ReportController.getLeaseExpirationReport);

export default router;

