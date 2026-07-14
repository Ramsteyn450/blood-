import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/User.model';

export interface AuthRequest extends Request { user?: IUser; }
interface JwtPayload { id: string; role: string; }

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) { res.status(401).json({ message: 'No token' }); return; }
    const decoded = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET || 'secret') as JwtPayload;
    const user = await User.findById(decoded.id).select('-password');
    if (!user) { res.status(401).json({ message: 'User not found' }); return; }
    if (user.isBanned) { res.status(403).json({ message: 'Account banned' }); return; }
    req.user = user;
    next();
  } catch { res.status(401).json({ message: 'Invalid token' }); }
};

export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (req.user?.role !== 'admin') { res.status(403).json({ message: 'Admin only' }); return; }
  next();
};
