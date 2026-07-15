import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import DonationSlot from '../models/DonationSlot.model';
import Appointment from '../models/Appointment.model';
import User from '../models/User.model';
import Notification from '../models/Notification.model';
import { differenceInDays } from '../utils/dateUtils';
import { format } from 'date-fns';

// ─── ORGANIZATION: Create a slot ──────────────────────────────────────────────
export const createSlot = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { date, timeSlot, capacity, location, notes } = req.body;
    if (!date || !timeSlot || !capacity) {
      res.status(400).json({ message: 'date, timeSlot and capacity are required' }); return;
    }
    const existing = await DonationSlot.findOne({ organizationId: req.user?._id, date, timeSlot });
    if (existing) { res.status(409).json({ message: 'Slot already exists for this time' }); return; }
    const slot = new DonationSlot({ organizationId: req.user?._id, date, timeSlot, capacity, location, notes });
    await slot.save();
    res.status(201).json({ success: true, slot });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Error creating slot' }); }
};

// ─── ORGANIZATION: Get all slots ──────────────────────────────────────────────
export const getOrgSlots = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { date, from, to } = req.query;
    const filter: Record<string, unknown> = { organizationId: req.user?._id };
    if (date) filter.date = date;
    if (from && to) filter.date = { $gte: from, $lte: to };
    const slots = await DonationSlot.find(filter).sort({ date: 1, timeSlot: 1 });
    res.json({ success: true, slots });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Error fetching slots' }); }
};

// ─── ORGANIZATION: Update a slot ──────────────────────────────────────────────
export const updateSlot = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const slot = await DonationSlot.findOne({ _id: req.params.id, organizationId: req.user?._id });
    if (!slot) { res.status(404).json({ message: 'Slot not found' }); return; }
    const { capacity, isOpen, location, notes } = req.body;
    if (capacity !== undefined) slot.capacity = capacity;
    if (isOpen !== undefined) slot.isOpen = isOpen;
    if (location !== undefined) slot.location = location;
    if (notes !== undefined) slot.notes = notes;
    await slot.save();
    res.json({ success: true, slot });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Error updating slot' }); }
};

// ─── ORGANIZATION: Delete a slot ──────────────────────────────────────────────
export const deleteSlot = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const slot = await DonationSlot.findOne({ _id: req.params.id, organizationId: req.user?._id });
    if (!slot) { res.status(404).json({ message: 'Slot not found' }); return; }
    if (slot.booked > 0) { res.status(400).json({ message: 'Cannot delete slot with bookings. Close it instead.' }); return; }
    await slot.deleteOne();
    res.json({ success: true });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Error deleting slot' }); }
};

// ─── PUBLIC: Get available slots for a date (for booking) ─────────────────────
export const getAvailableSlots = async (req: Request, res: Response): Promise<void> => {
  try {
    const { date } = req.query;
    const filter: Record<string, unknown> = { isOpen: true };
    if (date) filter.date = date;
    const slots = await DonationSlot.find(filter)
      .populate('organizationId', 'name organizationName state district')
      .sort({ date: 1, timeSlot: 1 })
      .lean();
    const slotsWithRemaining = slots.map(s => ({
      ...s,
      remaining: (s.capacity as number) - (s.booked as number),
      isFull: (s.booked as number) >= (s.capacity as number),
    }));
    res.json({ success: true, slots: slotsWithRemaining });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Error fetching slots' }); }
};

// ─── ORGANIZATION: Get appointments for their slots ───────────────────────────
export const getOrgAppointments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { date, status } = req.query;
    const filter: Record<string, unknown> = { organizationId: req.user?._id };
    if (date) filter.date = date;
    if (status) filter.status = status;
    const appointments = await Appointment.find(filter)
      .populate('userId', 'name bloodType phone email state district')
      .populate('donorId', 'name bloodType phone email')
      .populate('slotId', 'timeSlot date capacity booked')
      .sort({ date: 1, createdAt: -1 });
    res.json({ success: true, appointments });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Error fetching appointments' }); }
};

// ─── ORGANIZATION: Mark appointment as completed + award badge ─────────────────
export const completeAppointment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const appt = await Appointment.findOne({ _id: req.params.id, organizationId: req.user?._id });
    if (!appt) { res.status(404).json({ message: 'Appointment not found' }); return; }
    if (appt.status === 'completed') { res.status(400).json({ message: 'Already completed' }); return; }
    appt.status = 'completed';
    appt.completedAt = new Date();
    appt.badgeAwarded = true;
    await appt.save();
    // Award badge + update donor's lastDonationDate
    const donor = await User.findByIdAndUpdate(appt.donorId, {
      $inc: { badges: 1 },
      lastDonationDate: new Date(),
      nextEligibleDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    }, { new: true });
    // Notify donor
    if (donor) {
      await Notification.create({
        userId: appt.donorId,
        type: 'badge_awarded',
        title: '🏅 Donation Complete!',
        body: `Thank you for donating blood! You've earned a badge. You're eligible to donate again after 90 days.`,
        data: { appointmentId: appt._id },
        actionUrl: '/appointments',
      });

      // 📱 SIMULATED SMS GATEWAY BROADCAST
      console.log(`\n================================================================================`);
      console.log(`📱 [SMS GATEWAY] Sent to ${donor.phone || '9003410101'}:`);
      console.log(`"Hello ${donor.name}, thank you for your blood donation! You have been awarded 1 milestone badge. Next eligible date: ${format(new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), 'MMM d, yyyy')}. Thank you!"`);
      console.log(`================================================================================\n`);
    }
    res.json({ success: true, appointment: appt });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Error completing appointment' }); }
};

// ─── USER: Book an appointment slot ───────────────────────────────────────────
export const bookAppointment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { slotId, notes } = req.body;
    const slot = await DonationSlot.findById(slotId);
    if (!slot) { res.status(404).json({ message: 'Slot not found' }); return; }
    if (!slot.isOpen) { res.status(400).json({ message: 'This slot is closed' }); return; }
    if (slot.booked >= slot.capacity) { res.status(400).json({ message: 'This slot is full' }); return; }

    // 3-month eligibility check
    const donor = await User.findById(req.user?._id);
    if (!donor) { res.status(404).json({ message: 'User not found' }); return; }
    if (donor.lastDonationDate) {
      const daysSinceDonation = differenceInDays(new Date(), donor.lastDonationDate);
      if (daysSinceDonation < 90) {
        const daysLeft = 90 - daysSinceDonation;
        res.status(400).json({ 
          message: `You are not eligible to donate yet. ${daysLeft} days remaining until you can donate again.`,
          daysLeft,
          eligibleDate: donor.nextEligibleDate 
        }); 
        return;
      }
    }

    // Check if already booked same slot
    const alreadyBooked = await Appointment.findOne({ userId: req.user?._id, slotId, status: { $in: ['pending','confirmed'] } });
    if (alreadyBooked) { res.status(409).json({ message: 'You already have a booking for this slot' }); return; }

    const appt = new Appointment({
      userId: req.user?._id,
      donorId: req.user?._id,
      slotId,
      organizationId: slot.organizationId,
      date: slot.date,
      timeSlot: slot.timeSlot,
      status: 'confirmed',
      notes: notes || '',
      eligibilityCheckPassed: true,
    });
    await appt.save();
    slot.booked += 1;
    if (slot.booked >= slot.capacity) slot.isOpen = false;
    await slot.save();

    // Notify org
    await Notification.create({
      userId: slot.organizationId,
      type: 'appointment_booked',
      title: '📅 New Appointment Booked',
      body: `${donor.name} booked the ${slot.timeSlot} slot on ${slot.date}`,
      data: { appointmentId: appt._id, donorName: donor.name },
      actionUrl: '/org-dashboard',
    });
    // Notify donor confirmation
    await Notification.create({
      userId: req.user?._id,
      type: 'appointment_confirmed',
      title: '✅ Appointment Confirmed',
      body: `Your donation appointment on ${slot.date} at ${slot.timeSlot} is confirmed!`,
      data: { appointmentId: appt._id },
      actionUrl: '/appointments',
    });

    // 📱 SIMULATED SMS GATEWAY BROADCAST
    console.log(`\n================================================================================`);
    console.log(`📱 [SMS GATEWAY] Sent to ${donor.phone || '9003410101'}:`);
    console.log(`"Hello ${donor.name}, your LifeFlow Blood Donation appointment is CONFIRMED at ${slot.timeSlot} on ${slot.date}. Please bring your Digital Donor ID Card. Thank you!"`);
    console.log(`================================================================================\n`);

    res.status(201).json({ success: true, appointment: appt });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Error booking appointment' }); }
};

// ─── USER: Get my appointments ─────────────────────────────────────────────────
export const getMyAppointments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const appointments = await Appointment.find({ userId: req.user?._id })
      .populate('slotId', 'timeSlot date capacity booked location')
      .populate('organizationId', 'name organizationName state district')
      .sort({ date: -1, createdAt: -1 });
    res.json({ success: true, appointments });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Error fetching appointments' }); }
};

// ─── USER: Cancel an appointment ──────────────────────────────────────────────
export const cancelAppointment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const appt = await Appointment.findOne({ _id: req.params.id, userId: req.user?._id });
    if (!appt) { res.status(404).json({ message: 'Appointment not found' }); return; }
    if (appt.status === 'completed') { res.status(400).json({ message: 'Cannot cancel a completed appointment' }); return; }
    appt.status = 'cancelled';
    appt.cancelledAt = new Date();
    await appt.save();
    // Free up the slot
    await DonationSlot.findByIdAndUpdate(appt.slotId, {
      $inc: { booked: -1 },
      isOpen: true,
    });
    res.json({ success: true });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Error cancelling appointment' }); }
};
