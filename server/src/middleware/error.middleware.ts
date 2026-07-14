import { Request, Response, NextFunction } from 'express';
export interface AppError extends Error { statusCode?: number; }
export const errorHandler = (err: AppError, _req: Request, res: Response, _next: NextFunction): void => {
  res.status(err.statusCode || 500).json({ success: false, message: err.message || 'Server Error' });
};
