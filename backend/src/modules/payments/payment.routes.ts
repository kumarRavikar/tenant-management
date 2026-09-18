import { Router } from 'express';
import { PaymentController } from './payment.controller';
import { requireAuth } from '../../middleware/auth.middleware';
import { validateBody } from '../../middleware/validation.middleware';
import { recordPaymentSchema } from './payment.schemas';

const router = Router();

router.use(requireAuth);

router.get('/', PaymentController.list);
router.post('/', validateBody(recordPaymentSchema), PaymentController.recordPayment);
router.get('/:id', PaymentController.getById);
router.get('/:id/receipt', PaymentController.getReceipt);

export default router;

