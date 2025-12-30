import { Request, Response, NextFunction } from 'express';
import { errorResponse } from '../utils/response';

export const errorHandler = (err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Error:', err);

  if (err.name === 'ValidationError') {
    return res.status(400).json(errorResponse(`Validation Error: ${err.message}`));
  }

  if (err.message.includes('not found') || err.message.includes('no rows')) {
    return res.status(404).json(errorResponse('Resource not found'));
  }

  res.status(500).json(errorResponse(err.message || 'Internal server error'));
};

export const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
