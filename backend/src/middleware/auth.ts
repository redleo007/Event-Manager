import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { errorResponse } from '../utils/response';

export type UserRole = 'admin' | 'user';
export type UserStatus = 'pending' | 'approved';

export interface AuthClaims {
  sub: string; // user id
  email: string;
  name?: string;
  role: UserRole;
  status: UserStatus;
  approved_at?: string | null;
  approved_by?: string | null;
}

declare global {
  namespace Express {
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    interface Request {
      user?: AuthClaims;
    }
  }
}

const READ_METHODS = ['GET', 'HEAD', 'OPTIONS'];

const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not set. Add it to your environment configuration.');
  }
  return secret;
};

const extractToken = (req: Request): string | null => {
  const header = req.headers.authorization;
  if (!header) return null;
  const [scheme, token] = header.split(' ');
  if (scheme?.toLowerCase() !== 'bearer' || !token) return null;
  return token;
};

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = extractToken(req);
    if (!token) {
      return res.status(401).json(errorResponse('Missing or invalid authorization token'));
    }

    const payload = jwt.verify(token, getJwtSecret()) as AuthClaims;

    if (!payload || !payload.sub) {
      return res.status(401).json(errorResponse('Invalid token payload'));
    }

    if (payload.status !== 'approved') {
      return res.status(403).json(errorResponse('Account is pending approval'));
    }

    req.user = payload;
    next();
  } catch (err: any) {
    const message = err?.message?.toLowerCase() ?? '';
    const isExpired = message.includes('jwt expired');
    const isBadSignature = message.includes('invalid signature') || message.includes('jwt malformed');

    const friendlyMessage = isExpired
      ? 'Session expired. Please log in again.'
      : isBadSignature
        ? 'Invalid token provided'
        : 'Authentication failed';

    res.status(401).json(errorResponse(friendlyMessage));
  }
};

export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json(errorResponse('Authentication required'));
  }
  if (req.user.role !== 'admin') {
    return res.status(403).json(errorResponse('Admin access required'));
  }
  next();
};

export const restrictWritesToAdmins = (req: Request, res: Response, next: NextFunction) => {
  const method = req.method.toUpperCase();
  if (READ_METHODS.includes(method)) {
    return next();
  }

  if (!req.user) {
    return res.status(401).json(errorResponse('Authentication required'));
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json(errorResponse('Write operations require admin access'));
  }

  next();
};

export const requireApprovedStatus = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json(errorResponse('Authentication required'));
  }
  if (req.user.status !== 'approved') {
    return res.status(403).json(errorResponse('Account is pending approval'));
  }
  next();
};