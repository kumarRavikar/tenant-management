import { Router } from 'express';
import { HealthController } from './health.controller';

const router = Router();

// GET /api/health
router.get('/', HealthController.getHealth);

export default router;

