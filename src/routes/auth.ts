import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { User } from '../models/User';
import { Session } from '../models/Session';
import { requireAuth, AuthRequest } from '../middlewares/authMiddleware';

export const authRoutes = Router();

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const client = new OAuth2Client(GOOGLE_CLIENT_ID);
const JWT_EXPIRY_DAYS = 7;

authRoutes.post('/google', async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.body;

    if (!token) {
      res.status(400).json({ error: 'Missing token in request body' });
      return;
    }

    if (!GOOGLE_CLIENT_ID) {
      res.status(500).json({ error: 'Server configuration error: GOOGLE_CLIENT_ID is not set' });
      return;
    }

    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email || !payload.sub) {
      res.status(401).json({ error: 'Invalid Google token payload' });
      return;
    }

    let user = await User.findOne({ email: payload.email });

    if (!user) {
      user = await User.create({
        email: payload.email,
        name: payload.name || 'User',
        avatarUrl: payload.picture,
        provider: 'google',
        providerId: payload.sub,
      });
    }

    const expiresAt = new Date(Date.now() + JWT_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

    const jwtToken = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: `${JWT_EXPIRY_DAYS}d` }
    );

    // Create a session record — stateful auth
    await Session.create({ userId: user._id, token: jwtToken, expiresAt });

    res.json({ token: jwtToken, user });
  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({ error: 'Failed to authenticate Google token' });
  }
});

// Logout — deletes the session, immediately invalidating the token
authRoutes.post('/logout', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const token = req.headers.authorization!.split(' ')[1];
    await Session.findOneAndDelete({ token });
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Failed to logout' });
  }
});
