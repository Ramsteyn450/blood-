import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { sendEmergencyAlert } from '../controllers/emergency.controller';

const router = Router();
router.post('/alert', authenticate, sendEmergencyAlert);
export default router;
