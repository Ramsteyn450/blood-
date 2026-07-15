import { Response } from 'express';
import User from '../models/User.model';
import DonationRequest from '../models/DonationRequest.model';
import Report from '../models/Report.model';
import CommunityMessage from '../models/Community.model';
import { AuthRequest } from '../middleware/auth.middleware';

export const getStats = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const today = new Date();
    const [totalUsers, activeDonors, ineligibleUsers, pendingRequests, acceptedRequests, totalDonations, totalReports, communityMessages, organizations] = await Promise.all([
      User.countDocuments({ role: { $in: ['user','organization'] } }),
      User.countDocuments({ role: 'user', eligible: true, isBanned: false, visibleOnMap: true, $or: [{ nextEligibleDate: null }, { nextEligibleDate: { $lte: today } }] }),
      User.countDocuments({ role: 'user', $or: [{ eligible: false }, { isBanned: true }] }),
      DonationRequest.countDocuments({ status: 'pending' }),
      DonationRequest.countDocuments({ status: 'accepted' }),
      DonationRequest.countDocuments({ status: 'completed' }),
      Report.countDocuments({ reviewed: false }),
      CommunityMessage.countDocuments(),
      User.countDocuments({ role: 'organization' }),
    ]);
    // Blood type distribution
    const bloodTypeDist = await User.aggregate([
      { $match: { role: 'user' } },
      { $group: { _id: '$bloodType', count: { $sum: 1 } } },
    ]);
    const bloodTypeMap: Record<string, number> = {};
    for (const b of bloodTypeDist) { bloodTypeMap[b._id] = b.count; }
    res.json({ success: true, stats: { totalUsers, activeDonors, ineligibleUsers, pendingRequests, acceptedRequests, totalDonations, totalReports, communityMessages, organizations }, bloodTypeDist: bloodTypeMap });
  } catch { res.status(500).json({ message: 'Error fetching stats' }); }
};

export const getAllUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const search = req.query.search as string;
    const role = req.query.role as string;
    const filter: Record<string, unknown> = {};
    if (role && role !== 'all') { filter.role = role; } else { filter.role = { $in: ['user', 'organization'] }; }
    if (search) filter.$or = [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }];
    const users = await User.find(filter).select('-password').sort({ createdAt: -1 }).limit(200);
    res.json({ success: true, users });
  } catch { res.status(500).json({ message: 'Error fetching users' }); }
};

export const banUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { isBanned: req.body.banned !== false }, { new: true }).select('-password');
    if (!user) { res.status(404).json({ message: 'User not found' }); return; }
    res.json({ success: true, user });
  } catch { res.status(500).json({ message: 'Error banning user' }); }
};

export const getAllDonations = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const donations = await DonationRequest.find()
      .populate('requesterId', 'name email bloodType')
      .populate('donorId', 'name email bloodType')
      .sort({ createdAt: -1 }).limit(100);
    res.json({ success: true, donations });
  } catch { res.status(500).json({ message: 'Error fetching donations' }); }
};

export const getReports = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const reports = await Report.find()
      .populate('reportedUserId', 'name email bloodType')
      .populate('reportedBy', 'name email')
      .sort({ createdAt: -1 });
    res.json({ success: true, reports });
  } catch { res.status(500).json({ message: 'Error fetching reports' }); }
};

export const markReportReviewed = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const report = await Report.findByIdAndUpdate(req.params.id, { reviewed: true }, { new: true });
    res.json({ success: true, report });
  } catch { res.status(500).json({ message: 'Error reviewing report' }); }
};

export const updateUserRole = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { role } = req.body;
    if (!['user','organization','admin'].includes(role)) { res.status(400).json({ message: 'Invalid role' }); return; }
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-password');
    if (!user) { res.status(404).json({ message: 'User not found' }); return; }
    res.json({ success: true, user });
  } catch { res.status(500).json({ message: 'Error updating role' }); }
};
