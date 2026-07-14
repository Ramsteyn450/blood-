import { Response } from 'express';
import DonationRequest from '../models/DonationRequest.model';
import User from '../models/User.model';
import { AuthRequest } from '../middleware/auth.middleware';

export const createRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { donorId, bloodType, hospital, reason, urgencyLevel, requiredUnits, contactNote } = req.body;
    if (!donorId || !bloodType || !hospital || !reason) { res.status(400).json({ message: 'Required fields missing' }); return; }
    const donor = await User.findById(donorId);
    if (!donor || !donor.eligible || donor.isBanned) { res.status(400).json({ message: 'Donor not eligible' }); return; }
    const active = await DonationRequest.findOne({ requesterId: req.user?._id, donorId, status: { $in: ['pending','accepted'] } });
    if (active) { res.status(409).json({ message: `You already have a ${active.status} request with this donor`, status: active.status, requestId: active._id }); return; }
    const dr = new DonationRequest({ requesterId: req.user?._id, donorId, bloodType, hospital, reason, urgencyLevel: urgencyLevel||'normal', requiredUnits: requiredUnits||1, contactNote: contactNote||'' });
    await dr.save();
    await dr.populate(['requesterId','donorId']);
    res.status(201).json({ success: true, request: dr });
  } catch { res.status(500).json({ message: 'Error creating request' }); }
};

export const getMyRequests = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const requests = await DonationRequest.find({ $or: [{ requesterId: req.user?._id }, { donorId: req.user?._id }] })
      .populate('requesterId', 'name email bloodType avatar state district')
      .populate('donorId', 'name email bloodType avatar state district')
      .sort({ createdAt: -1 });
    res.json({ success: true, requests });
  } catch { res.status(500).json({ message: 'Error fetching requests' }); }
};

export const getBulkRequestStatuses = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { donorIds } = req.body;
    if (!Array.isArray(donorIds)) { res.status(400).json({ message: 'donorIds must be array' }); return; }
    const requests = await DonationRequest.find({ requesterId: req.user?._id, donorId: { $in: donorIds }, status: { $in: ['pending','accepted','completed'] } }).sort({ createdAt: -1 });
    const statusMap: Record<string, { status: string; requestId: string }> = {};
    for (const r of requests) { const k = String(r.donorId); if (!statusMap[k]) statusMap[k] = { status: r.status, requestId: String(r._id) }; }
    res.json({ success: true, statusMap });
  } catch { res.status(500).json({ message: 'Error fetching statuses' }); }
};

export const updateRequestStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!['accepted','rejected','completed'].includes(status)) { res.status(400).json({ message: 'Invalid status' }); return; }
    const dr = await DonationRequest.findById(id);
    if (!dr) { res.status(404).json({ message: 'Request not found' }); return; }
    const uid = String(req.user?._id);
    const isDonor = String(dr.donorId) === uid;
    if (!isDonor && String(dr.requesterId) !== uid) { res.status(403).json({ message: 'Not authorized' }); return; }
    if (['accepted','rejected'].includes(status) && !isDonor) { res.status(403).json({ message: 'Only donor can accept/reject' }); return; }
    dr.status = status;
    if (status === 'accepted') dr.acceptedAt = new Date();
    if (status === 'rejected') dr.rejectedAt = new Date();
    if (status === 'completed') {
      dr.completedAt = new Date();
      const next = new Date(); next.setDate(next.getDate() + 90);
      await User.findByIdAndUpdate(dr.donorId, { lastDonationDate: new Date(), nextEligibleDate: next, eligible: false, $inc: { badges: 1 } });
    }
    await dr.save();
    await dr.populate(['requesterId','donorId']);
    res.json({ success: true, request: dr });
  } catch { res.status(500).json({ message: 'Error updating status' }); }
};
