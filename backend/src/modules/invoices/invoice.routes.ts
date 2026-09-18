import { Router } from 'express';
import { InvoiceController } from './invoice.controller';
import { PaymentController } from '../payments/payment.controller';
import { requireAuth, requireRole } from '../../middleware/auth.middleware';
import { validateBody } from '../../middleware/validation.middleware';
import { createInvoiceSchema } from './invoice.schemas';
import { UserRole } from '../auth/auth.types';

const router = Router();

router.use(requireAuth);

router.get('/', InvoiceController.list);

router.post(
  '/',
  requireRole(UserRole.SUPER_ADMIN, UserRole.PROPERTY_ADMIN, UserRole.MANAGER),
  validateBody(createInvoiceSchema),
  InvoiceController.create
);

router.get('/:id', InvoiceController.getById);
router.get('/:id/payments', PaymentController.getPaymentsByInvoiceId);

export default router;
