import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { successResponse } from '../utils/response';
import * as blocklistService from '../services/blocklistService';

const router = Router();

router.get(
  '/',
  asyncHandler(async (_req: Request, res: Response) => {
    const settings = await blocklistService.getSettings();
    res.json(successResponse(settings));
  })
);

router.put(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const settings = await blocklistService.updateSettings(req.body);
    res.json(successResponse(settings));
  })
);

export default router;
