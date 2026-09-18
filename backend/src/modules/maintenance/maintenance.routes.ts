import { Router } from 'express';
import multer from 'multer';
import { MaintenanceController } from './maintenance.controller';
import { requireAuth } from '../../middleware/auth.middleware';
import { validateBody } from '../../middleware/validation.middleware';
import {
  createMaintenanceTicketSchema,
  updateMaintenanceTicketSchema,
  assignTicketSchema,
  addCommentSchema,
} from './maintenance.schemas';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

router.use(requireAuth);

router.get('/', MaintenanceController.list);
router.post('/', validateBody(createMaintenanceTicketSchema), MaintenanceController.create);
router.get('/:id', MaintenanceController.getById);
router.patch('/:id', validateBody(updateMaintenanceTicketSchema), MaintenanceController.update);

router.post('/:id/assign', validateBody(assignTicketSchema), MaintenanceController.assign);
router.post('/:id/comments', validateBody(addCommentSchema), MaintenanceController.addComment);
router.post('/:id/attachments', upload.single('file'), MaintenanceController.addAttachment);
router.get('/:id/activity', MaintenanceController.getActivity);

export default router;

