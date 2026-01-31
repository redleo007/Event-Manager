import { Request, Response, NextFunction } from 'express';
import { errorResponse } from '../utils/response';

export const errorHandler = (err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Error:', err);

  if (err.name === 'ValidationError') {
    return res.status(400).json(errorResponse(`Validation Error: ${err.message}`));
  }

  // Only treat as 404 if error starts with specific resource-not-found patterns
  // Avoid matching errors like "participants not found for emails" which are validation errors
  const msg = (err.message || '').toLowerCase();
  const is404 = 
    msg.startsWith('resource not found') ||
    msg.startsWith('not found') ||
    msg === 'no rows' ||
    /^(event|participant|attendance|blocklist|setting)\s+(not found|does not exist)/i.test(err.message);

  if (is404) {
    return res.status(404).json(errorResponse('Resource not found'));
  }

  // Return the actual error message for validation/business logic errors
  res.status(400).json(errorResponse(err.message || 'Internal server error'));
};

export const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
