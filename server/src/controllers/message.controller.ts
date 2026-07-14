import { Response } from 'express';
import Message from '../models/Message.model';
import DonationRequest from '../models/DonationRequest.model';
import User from '../models/User.model';
import { AuthRequest } from '../middleware/auth.middleware';

export const getChatPartners = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const uid = req.user?._id;
    const completedOrAccepted = await DonationRequest.find({ $or: [{ requesterId: uid }, { donorId: uid }], status: { $in: ['accepted','completed'] } });
    const partnerIds = new Set<string>();
    for (const r of completedOrAccepted) {
      const pid = String(r.requesterId) === String(uid) ? String(r.donorId) : String(r.requesterId);
      partnerIds.add(pid);
    }
    const partners = await User.find({ _id: { $in: Array.from(partnerIds) } }).select('name bloodType avatar emergencyAvailable state district');
    res.json({ success: true, partners });
  } catch { res.status(500).json({ message: 'Error fetching partners' }); }
};

export const getMessages = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const uid = req.user?._id;
    const { partnerId } = req.params;
    const allowed = await DonationRequest.findOne({ $or: [{ requesterId: uid, donorId: partnerId }, { requesterId: partnerId, donorId: uid }], status: { $in: ['accepted','completed'] } });
    if (!allowed) { res.status(403).json({ message: 'Chat not unlocked yet. Request must be accepted first.' }); return; }
    const messages = await Message.find({ $or: [{ senderId: uid, receiverId: partnerId }, { senderId: partnerId, receiverId: uid }] })
      .populate('senderId', 'name avatar bloodType')
      .sort({ createdAt: 1 });
    await Message.updateMany({ senderId: partnerId, receiverId: uid, read: false }, { read: true });
    res.json({ success: true, messages });
  } catch { res.status(500).json({ message: 'Error fetching messages' }); }
};

export const sendMessage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const uid = req.user?._id;
    const { receiverId, content } = req.body;
    if (!receiverId || !content?.trim()) { res.status(400).json({ message: 'receiverId and content required' }); return; }
    const allowed = await DonationRequest.findOne({ $or: [{ requesterId: uid, donorId: receiverId }, { requesterId: receiverId, donorId: uid }], status: { $in: ['accepted','completed'] } });
    if (!allowed) { res.status(403).json({ message: 'Chat not unlocked' }); return; }
    const message = new Message({ senderId: uid, receiverId, content: content.trim() });
    await message.save();
    await message.populate('senderId', 'name avatar bloodType');
    res.status(201).json({ success: true, message });
  } catch { res.status(500).json({ message: 'Error sending message' }); }
};
