import { Router } from 'express';
import { getMessages, sendMessage, getPinnedMessages, pinMessage } from '../controllers/community.controller';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';
const router = Router();
router.get('/pinned', authenticate, getPinnedMessages);
router.get('/', authenticate, getMessages);
router.post('/', authenticate, sendMessage);
router.patch('/:id/pin', authenticate, requireAdmin, pinMessage);
export default router;
