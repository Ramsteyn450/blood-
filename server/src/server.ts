import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import { connectDB } from './config/database';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import requestRoutes from './routes/request.routes';
import messageRoutes from './routes/message.routes';
import adminRoutes from './routes/admin.routes';
import reportRoutes from './routes/report.routes';
import communityRoutes from './routes/community.routes';
import { errorHandler } from './middleware/error.middleware';

dotenv.config();
const app = express();
connectDB();

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/community', communityRoutes);
app.get('/api/health', (_req, res) => res.json({ status: 'ok', message: 'LifeFlow API running 🩸' }));

// Serve client static assets in production
if (process.env.NODE_ENV === 'production') {
  const clientDistPath = path.join(__dirname, '../../client/dist');
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

app.use(errorHandler);

app.listen(process.env.PORT || 5000, () => console.log(`🩸 LifeFlow Server on port ${process.env.PORT || 5000}`));
export default app;
