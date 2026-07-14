import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.model';
import { AuthRequest } from '../middleware/auth.middleware';

const makeToken = (id: string, role: string) =>
  jwt.sign({ id, role }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' } as jwt.SignOptions);

export const signup = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, phone, bloodType, gender, profession, weight, takesTablets, state, district, bio } = req.body;
    if (!name || !email || !password || !phone || !bloodType || !gender || !profession || weight === undefined) {
      res.status(400).json({ message: 'All required fields must be filled' }); return;
    }
    if (await User.findOne({ email })) { res.status(409).json({ message: 'Email already registered' }); return; }

    const user = new User({
      name, email, password, phone, bloodType, gender, profession,
      weight: parseFloat(weight),
      takesTablets: takesTablets === true || takesTablets === 'yes',
      state: state || '', district: district || '', bio: bio || '',
    });
    await user.save();
    res.status(201).json({ success: true, token: makeToken(String(user._id), user.role), user });
  } catch (err: unknown) {
    const e = err as { code?: number };
    if (e.code === 11000) { res.status(409).json({ message: 'Email already registered' }); return; }
    res.status(500).json({ message: 'Signup error' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    if (!email || !password) { res.status(400).json({ message: 'Email and password required' }); return; }
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) { res.status(401).json({ message: 'Invalid credentials' }); return; }
    if (user.isBanned) { res.status(403).json({ message: 'Account is banned' }); return; }
    res.json({ success: true, token: makeToken(String(user._id), user.role), user: user.toJSON() });
  } catch { res.status(500).json({ message: 'Login error' }); }
};

export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  res.json({ success: true, user: req.user });
};
