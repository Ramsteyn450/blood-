import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { getNotifications, markAllRead, markOneRead, deleteNotification, getUnreadCount } from '../controllers/notification.controller';

const router = Router();
router.get('/', authenticate, getNotifications);
router.get('/unread-count', authenticate, getUnreadCount);
router.patch('/read-all', authenticate, markAllRead);
router.patch('/:id/read', authenticate, markOneRead);
router.delete('/:id', authenticate, deleteNotification);
export default router;
