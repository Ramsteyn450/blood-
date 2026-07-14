import { Response } from 'express';
import User from '../models/User.model';
import { AuthRequest } from '../middleware/auth.middleware';

export const getDonors = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { bloodType, lat, lng, maxDistance = 50000, gender, state, district, emergencyAvailable, minBadges, profession } = req.query;
    const today = new Date();
    const filter: Record<string, unknown> = {
      eligible: true, isBanned: false, visibleOnMap: true, role: 'user',
      _id: { $ne: req.user?._id },
      $or: [{ nextEligibleDate: null }, { nextEligibleDate: { $lte: today } }],
    };
    if (bloodType) filter.bloodType = bloodType;
    if (gender) filter.gender = gender;
    if (state) filter.state = { $regex: state as string, $options: 'i' };
    if (district) filter.district = { $regex: district as string, $options: 'i' };
    if (emergencyAvailable === 'true') filter.emergencyAvailable = true;
    if (minBadges) filter.badges = { $gte: parseInt(minBadges as string) };
    if (profession) filter.profession = { $regex: profession as string, $options: 'i' };

    const donors = lat && lng
      ? await User.find({ ...filter, location: { $near: { $geometry: { type: 'Point', coordinates: [parseFloat(lng as string), parseFloat(lat as string)] }, $maxDistance: parseInt(maxDistance as string) } } }).select('-password -email -phone').limit(100)
      : await User.find(filter).select('-password -email -phone').limit(100);

    res.json({ success: true, donors });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Error fetching donors' }); }
};

export const getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const isOwn = !req.params.id || String(req.params.id) === String(req.user?._id);
    const user = await User.findById(req.params.id || req.user?._id).select('-password');
    if (!user) { res.status(404).json({ message: 'User not found' }); return; }
    if (!isOwn) {
      return res.json({ success: true, user: { _id: user._id, name: user.name, bloodType: user.bloodType, profession: user.profession, state: user.state, district: user.district, badges: user.badges, publicNote: user.publicNote, emergencyAvailable: user.emergencyAvailable, eligible: user.eligible, isBanned: user.isBanned, avatar: user.avatar, gender: user.gender, weight: user.weight, takesTablets: user.takesTablets, lastDonationDate: user.lastDonationDate, nextEligibleDate: user.nextEligibleDate, visibleOnMap: user.visibleOnMap, createdAt: user.createdAt } }) as unknown as void;
    }
    res.json({ success: true, user });
  } catch { res.status(500).json({ message: 'Error fetching profile' }); }
};

export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const allowed = ['name','phone','profession','avatar','visibleOnMap','state','district','bio','publicNote','emergencyAvailable','weight','takesTablets','gender','bloodType'];
    const updates: Record<string, unknown> = {};
    for (const f of allowed) { if (req.body[f] !== undefined) updates[f] = req.body[f]; }
    const cur = await User.findById(req.user?._id);
    if (!cur) { res.status(404).json({ message: 'User not found' }); return; }
    const w = updates.weight !== undefined ? Number(updates.weight) : cur.weight;
    const t = updates.takesTablets !== undefined ? (updates.takesTablets === true || updates.takesTablets === 'yes') : cur.takesTablets;
    updates.takesTablets = t;
    updates.eligible = !(w < 50 || t) && (!cur.nextEligibleDate || cur.nextEligibleDate <= new Date());
    updates.profileCompleted = true;
    const user = await User.findByIdAndUpdate(req.user?._id, updates, { new: true }).select('-password');
    res.json({ success: true, user });
  } catch { res.status(500).json({ message: 'Error updating profile' }); }
};

export const updateLocation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { lat, lng } = req.body;
    if (lat === undefined || lng === undefined) { res.status(400).json({ message: 'lat and lng required' }); return; }
    const user = await User.findByIdAndUpdate(req.user?._id, { location: { type: 'Point', coordinates: [lng, lat] }, lastActiveAt: new Date() }, { new: true }).select('-password');
    res.json({ success: true, user });
  } catch { res.status(500).json({ message: 'Error updating location' }); }
};
