import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { successResponse } from '../utils/response';
import * as blocklistService from '../services/blocklistService';

const router = Router();

router.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const { participant_id, reason } = req.body;
    
    if (!participant_id || !reason) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const entry = await blocklistService.addToBlocklist(participant_id, reason);
    res.status(201).json(successResponse(entry));
  })
);

router.get(
  '/',
  asyncHandler(async (_req: Request, res: Response) => {
    const blocklist = await blocklistService.getBlocklist();
    res.json(successResponse(blocklist));
  })
);

router.delete(
  '/:participantId',
  asyncHandler(async (req: Request, res: Response) => {
    await blocklistService.removeFromBlocklist(req.params.participantId);
    res.json(successResponse({ message: 'Participant removed from blocklist' }));
  })
);

export default router;
