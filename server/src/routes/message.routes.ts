import { Router } from 'express';
import { getChatPartners, getMessages, sendMessage } from '../controllers/message.controller';
import { authenticate } from '../middleware/auth.middleware';
const router = Router();
router.get('/partners', authenticate, getChatPartners);
router.get('/:partnerId', authenticate, getMessages);
router.post('/', authenticate, sendMessage);
export default router;
