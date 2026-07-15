import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import User from '../models/User.model';
import DonationRequest from '../models/DonationRequest.model';
import Appointment from '../models/Appointment.model';

// GET /api/dashboard/stats
export const getDashboardStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Today's received requests
    const todayRequests = await DonationRequest.countDocuments({
      donorId: userId,
      createdAt: { $gte: today, $lt: tomorrow }
    });

    // Total completed donations
    const completedDonations = await DonationRequest.countDocuments({
      donorId: userId, status: 'completed'
    });

    // Appointment completions
    const appointmentCompletions = await Appointment.countDocuments({
      userId, status: 'completed'
    });

    // Pending requests
    const pendingRequests = await DonationRequest.countDocuments({
      donorId: userId, status: 'pending'
    });

    // Monthly trend – last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const monthlyData = await DonationRequest.aggregate([
      { $match: { donorId: userId, status: 'completed', completedAt: { $gte: sixMonthsAgo } } },
      { $group: {
        _id: { year: { $year: '$completedAt' }, month: { $month: '$completedAt' } },
        count: { $sum: 1 }
      }},
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Nearby active donors count (if user has location)
    const userDoc = await User.findById(userId).select('location');
    let nearbyDonors = 0;
    if (userDoc?.location?.coordinates && (userDoc.location.coordinates[0] !== 0 || userDoc.location.coordinates[1] !== 0)) {
      nearbyDonors = await User.countDocuments({
        _id: { $ne: userId },
        eligible: true,
        availabilityStatus: 'available',
        location: {
          $near: {
            $geometry: { type: 'Point', coordinates: userDoc.location.coordinates },
            $maxDistance: 10000
          }
        }
      });
    }

    res.json({
      success: true,
      stats: {
        todayRequests,
        completedDonations: completedDonations + appointmentCompletions,
        pendingRequests,
        nearbyDonors,
        badges: req.user?.badges || 0,
      },
      monthlyTrend: monthlyData,
    });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Error fetching dashboard stats' }); }
};
