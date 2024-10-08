import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/userModel';

interface CustomRequest extends Request {
  user?: {
    userId: string;
    role: 'user' | 'seller';
  };
}

// Middleware to authenticate the seller
export const authenticateSeller = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
) => {
  const token = req.headers['authorization']?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
      userId: string;
      role: 'user' | 'seller';
    };

    req.user = {
      userId: decoded.userId,
      role: decoded.role,
    };

    // Fetch the user
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    // Check if the user is blocked
    if (user.isBlocked) {
      return res.status(403).json({ message: 'You are blocked.' });
    }

    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// Middleware to authorize the seller
export const authorizeSeller = (
  req: CustomRequest,
  res: Response,
  next: NextFunction
) => {
  if (req.user?.role !== 'seller') {
    console.error('[Auth Middleware] Access denied: User is not a seller');
    return res.status(403).json({ message: 'Access denied' });
  }

  next();
};
