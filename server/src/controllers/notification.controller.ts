import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import Notification from '../models/Notification.model';

export const getNotifications = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 30;
    const skip = (page - 1) * limit;
    const notifications = await Notification.find({ userId: req.user?._id })
      .sort({ createdAt: -1 }).skip(skip).limit(limit);
    const unreadCount = await Notification.countDocuments({ userId: req.user?._id, read: false });
    res.json({ success: true, notifications, unreadCount, page });
  } catch { res.status(500).json({ message: 'Error fetching notifications' }); }
};

export const markAllRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await Notification.updateMany({ userId: req.user?._id, read: false }, { read: true });
    res.json({ success: true });
  } catch { res.status(500).json({ message: 'Error marking notifications read' }); }
};

export const markOneRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await Notification.findOneAndUpdate({ _id: req.params.id, userId: req.user?._id }, { read: true });
    res.json({ success: true });
  } catch { res.status(500).json({ message: 'Error marking notification read' }); }
};

export const deleteNotification = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await Notification.findOneAndDelete({ _id: req.params.id, userId: req.user?._id });
    res.json({ success: true });
  } catch { res.status(500).json({ message: 'Error deleting notification' }); }
};

export const getUnreadCount = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const count = await Notification.countDocuments({ userId: req.user?._id, read: false });
    res.json({ success: true, count });
  } catch { res.status(500).json({ message: 'Error fetching count' }); }
};
