import { Router } from 'express';
import { createRequest, getMyRequests, getBulkRequestStatuses, updateRequestStatus } from '../controllers/request.controller';
import { authenticate } from '../middleware/auth.middleware';
const router = Router();
router.post('/', authenticate, createRequest);
router.get('/my', authenticate, getMyRequests);
router.post('/bulk-status', authenticate, getBulkRequestStatuses);
router.patch('/:id/status', authenticate, updateRequestStatus);
export default router;
