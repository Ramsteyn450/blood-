import { Response } from 'express';
import Camp from '../models/Camp.model';
import { AuthRequest } from '../middleware/auth.middleware';

export const createCamp = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, description, date, time, locationName, lat, lng, place, hospital, doctors, campType, poster } = req.body;
    if (!title || !description || !date || !time || !locationName) {
      res.status(400).json({ message: 'All required fields must be filled' });
      return;
    }

    // ONLY Admin can host camps as requested
    if (req.user?.role !== 'admin') {
      res.status(403).json({ message: 'Access Denied: Only Admins can organize medical camps' });
      return;
    }

    const latitude = Number(lat) || 20.5937;
    const longitude = Number(lng) || 78.9629;

    const camp = new Camp({
      title,
      description,
      date: new Date(date),
      time,
      place: place || '',
      hospital: hospital || '',
      doctors: doctors || '',
      campType: campType || 'Blood Donation',
      poster: poster || '',
      locationName,
      location: {
        type: 'Point',
        coordinates: [longitude, latitude],
      },
      organizerId: req.user?._id,
      rsvps: [],
    });

    await camp.save();
    await camp.populate('organizerId', 'name organizationName email district state');

    res.status(201).json({ success: true, camp });
  } catch (error) {
    res.status(500).json({ message: 'Error creating donation camp' });
  }
};

export const getCamps = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const camps = await Camp.find()
      .populate('organizerId', 'name organizationName email district state')
      .populate('rsvps', 'name bloodType state district')
      .sort({ date: 1 });
    res.json({ success: true, camps });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching donation camps' });
  }
};

export const rsvpCamp = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const camp = await Camp.findById(id);
    if (!camp) {
      res.status(404).json({ message: 'Camp not found' });
      return;
    }

    const userId = req.user?._id;
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const index = (camp.rsvps as any).indexOf(userId);

    if (index > -1) {
      (camp.rsvps as any).splice(index, 1);
    } else {
      camp.rsvps.push(userId);
    }

    await camp.save();
    await camp.populate([
      { path: 'organizerId', select: 'name organizationName email district state' },
      { path: 'rsvps', select: 'name bloodType state district' }
    ]);

    res.json({ success: true, camp, rsvped: index === -1 });
  } catch (error) {
    res.status(500).json({ message: 'Error updating RSVP' });
  }
};

export const deleteCamp = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user?.role !== 'admin') {
      res.status(403).json({ message: 'Access Denied: Only Admins can delete medical camps' });
      return;
    }
    const camp = await Camp.findByIdAndDelete(req.params.id);
    if (!camp) {
      res.status(404).json({ message: 'Camp not found' });
      return;
    }
    res.json({ success: true, message: 'Camp successfully deleted' });
  } catch {
    res.status(500).json({ message: 'Error deleting camp' });
  }
};
