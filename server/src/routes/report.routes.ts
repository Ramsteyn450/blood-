import { Router } from 'express';
import { createReport } from '../controllers/report.controller';
import { authenticate } from '../middleware/auth.middleware';
const router = Router();
router.post('/', authenticate, createReport);
export default router;
