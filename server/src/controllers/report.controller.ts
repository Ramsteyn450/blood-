import { Response } from 'express';
import Report from '../models/Report.model';
import { AuthRequest } from '../middleware/auth.middleware';

export const createReport = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { reportedUserId, reason } = req.body;
    if (!reportedUserId || !reason) { res.status(400).json({ message: 'reportedUserId and reason required' }); return; }
    const report = new Report({ reportedUserId, reportedBy: req.user?._id, reason });
    await report.save();
    res.status(201).json({ success: true, report });
  } catch { res.status(500).json({ message: 'Error creating report' }); }
};
