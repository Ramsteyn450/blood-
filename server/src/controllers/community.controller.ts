import { Response } from 'express';
import CommunityMessage from '../models/Community.model';
import { AuthRequest } from '../middleware/auth.middleware';

export const getMessages = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const msgs = await CommunityMessage.find()
      .populate('senderId', 'name avatar bloodType badges emergencyAvailable')
      .sort({ createdAt: -1 }).skip((page-1)*50).limit(50);
    res.json({ success: true, messages: msgs.reverse() });
  } catch { res.status(500).json({ message: 'Error fetching messages' }); }
};

export const sendMessage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { text, isUrgent } = req.body;
    if (!text?.trim()) { res.status(400).json({ message: 'Text required' }); return; }
    const msg = new CommunityMessage({ senderId: req.user?._id, text: text.trim(), isUrgent: isUrgent||false });
    await msg.save();
    await msg.populate('senderId', 'name avatar bloodType badges emergencyAvailable');
    res.status(201).json({ success: true, message: msg });
  } catch { res.status(500).json({ message: 'Error sending message' }); }
};

export const getPinnedMessages = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const msgs = await CommunityMessage.find({ pinned: true }).populate('senderId', 'name avatar bloodType').sort({ createdAt: -1 }).limit(5);
    res.json({ success: true, messages: msgs });
  } catch { res.status(500).json({ message: 'Error fetching pinned' }); }
};

export const pinMessage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const msg = await CommunityMessage.findByIdAndUpdate(req.params.id, { pinned: true }, { new: true });
    res.json({ success: true, message: msg });
  } catch { res.status(500).json({ message: 'Error pinning' }); }
};
