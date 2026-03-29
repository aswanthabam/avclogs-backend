import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Session } from '../models/Session';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    sessionId: string;
  };
}

export const requireAuth = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: No token provided' });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    // Verify JWT signature and expiry
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;

    // Validate that an active session exists for this token
    const session = await Session.findOne({ token, userId: decoded.id });
    if (!session) {
      res.status(401).json({ error: 'Unauthorized: No active session. Please log in again.' });
      return;
    }

    req.user = { id: decoded.id, sessionId: session._id.toString() };
    next();
  } catch (err) {
    res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
  }
};
