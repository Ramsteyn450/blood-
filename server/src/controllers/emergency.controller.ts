import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import User from '../models/User.model';
import Notification from '../models/Notification.model';

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// POST /api/emergency/alert
export const sendEmergencyAlert = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { lat, lng, bloodType, hospital, radiusKm = 5 } = req.body;
    if (!lat || !lng || !bloodType || !hospital) {
      res.status(400).json({ message: 'lat, lng, bloodType and hospital are required' }); return;
    }
    const radius = Math.min(Math.max(parseInt(radiusKm), 1), 10);

    // Find matching donors within radius using MongoDB geo query
    const donors = await User.find({
      bloodType,
      role: 'user',
      eligible: true,
      isBanned: false,
      visibleOnMap: true,
      availabilityStatus: 'available',
      _id: { $ne: req.user?._id },
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
          $maxDistance: radius * 1000,
        }
      }
    }).select('_id name bloodType').limit(50);

    const requester = await User.findById(req.user?._id).select('name district state');
    const locationLabel = requester?.district || requester?.state || 'nearby';

    // Create emergency notifications for all matching donors
    const notifications = donors.map(d => ({
      userId: d._id,
      type: 'emergency_alert' as const,
      title: `🚨 Emergency Blood Needed`,
      body: `A patient urgently needs ${bloodType} blood near ${locationLabel}. Hospital: ${hospital}`,
      data: {
        requesterId: req.user?._id,
        requesterName: req.user?.name,
        bloodType,
        hospital,
        lat,
        lng,
        radiusKm: radius,
      },
      actionUrl: `/emergency`,
    }));

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }

    res.json({
      success: true,
      donorsAlerted: donors.length,
      message: `Emergency alert sent to ${donors.length} matching donors within ${radius} KM`,
    });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Error sending emergency alert' }); }
};
