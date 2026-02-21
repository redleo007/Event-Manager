import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { successResponse, errorResponse } from '../utils/response';
import { validateEmail } from '../utils/validation';
import * as authService from '../services/authService';

const router = Router();

router.post(
  '/signup',
  asyncHandler(async (req: Request, res: Response) => {
    const { name, email, password, confirmPassword, role } = req.body as {
      name?: string;
      email?: string;
      password?: string;
      confirmPassword?: string;
      role?: 'admin' | 'user';
    };

    if (!name || !email || !password || !confirmPassword) {
      return res.status(400).json(errorResponse('Name, email, password, and confirmPassword are required'));
    }

    if (!validateEmail(email)) {
      return res.status(400).json(errorResponse('Please enter a valid email address'));
    }

    if (password.length < 8) {
      return res.status(400).json(errorResponse('Password must be at least 8 characters long'));
    }

    if (password !== confirmPassword) {
      return res.status(400).json(errorResponse('Passwords do not match'));
    }

    const user = await authService.createUser({ name, email, password, role });

    if (user.role === 'admin' && user.status === 'pending') {
      return res.status(201).json(
        successResponse({
          status: 'pending',
          message: 'Admin account created and pending approval by an existing admin.',
        })
      );
    }

    const token = authService.generateToken(user);
    res.status(201).json(successResponse({ token, user: authService.toSafeUser(user) }));
  })
);

router.post(
  '/login',
  asyncHandler(async (req: Request, res: Response) => {
    const { email, password, mode } = req.body as { email?: string; password?: string; mode?: 'admin' | 'user' };

    if (!email || !password) {
      return res.status(400).json(errorResponse('Email and password are required'));
    }

    const user = await authService.verifyCredentials(email, password);

    if (mode && user.role !== mode) {
      return res.status(403).json(errorResponse(`Please use the ${user.role} login tab for this account`));
    }

    if (user.status !== 'approved') {
      return res.status(403).json(errorResponse('Account is pending approval'));
    }

    const token = authService.generateToken(user);
    res.json(successResponse({ token, user: authService.toSafeUser(user) }));
  })
);

router.get(
  '/me',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    // Ensure we always return the latest data from the database
    const freshUser = await authService.getUserById(req.user?.sub || '');
    if (!freshUser) {
      return res.status(404).json(errorResponse('User not found'));
    }

    res.json(successResponse({ user: authService.toSafeUser(freshUser) }));
  })
);

router.post(
  '/admin/approve',
  authenticateToken,
  requireAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const { user_id } = req.body as { user_id?: string };

    if (!user_id) {
      return res.status(400).json(errorResponse('user_id is required'));
    }

    const approved = await authService.approveAdmin(user_id, req.user!.sub);
    res.json(successResponse({ user: authService.toSafeUser(approved) }));
  })
);

export default router;