import { Router } from 'express';
import { createCamp, getCamps, rsvpCamp, deleteCamp } from '../controllers/camp.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/', authenticate, getCamps);
router.post('/', authenticate, createCamp);
router.post('/:id/rsvp', authenticate, rsvpCamp);
router.delete('/:id', authenticate, deleteCamp);

export default router;
