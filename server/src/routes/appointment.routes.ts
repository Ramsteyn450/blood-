import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { createSlot, getOrgSlots, updateSlot, deleteSlot, getAvailableSlots, getOrgAppointments, completeAppointment, bookAppointment, getMyAppointments, cancelAppointment } from '../controllers/appointment.controller';

const router = Router();

// Public: get open slots (for booking)
router.get('/slots', authenticate, getAvailableSlots);

// User: book / view / cancel appointments
router.post('/book', authenticate, bookAppointment);
router.get('/my', authenticate, getMyAppointments);
router.patch('/:id/cancel', authenticate, cancelAppointment);

// Organization: manage slots
router.post('/slots', authenticate, createSlot);
router.get('/org/slots', authenticate, getOrgSlots);
router.patch('/slots/:id', authenticate, updateSlot);
router.delete('/slots/:id', authenticate, deleteSlot);

// Organization: view & manage bookings
router.get('/org/bookings', authenticate, getOrgAppointments);
router.patch('/:id/complete', authenticate, completeAppointment);

export default router;
