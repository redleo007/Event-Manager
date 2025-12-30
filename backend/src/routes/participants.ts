import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { successResponse } from '../utils/response';
import * as participantService from '../services/participantService';
import { validateParticipantData } from '../utils/validation';

const router = Router();

router.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    validateParticipantData(req.body);
    const participant = await participantService.createParticipant({
      ...req.body,
      is_blocklisted: false,
    });
    res.status(201).json(successResponse(participant));
  })
);

router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const includeBlocklisted = req.query.includeBlocklisted === 'true';
    const participants = await participantService.getParticipants(includeBlocklisted);
    res.json(successResponse(participants));
  })
);

router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const participant = await participantService.getParticipantById(req.params.id);
    res.json(successResponse(participant));
  })
);

router.put(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const participant = await participantService.updateParticipant(req.params.id, req.body);
    res.json(successResponse(participant));
  })
);

router.get(
  '/stats/active',
  asyncHandler(async (_req: Request, res: Response) => {
    const count = await participantService.getActiveParticipantsCount();
    res.json(successResponse({ count }));
  })
);

router.get(
  '/stats/blocklisted',
  asyncHandler(async (_req: Request, res: Response) => {
    const count = await participantService.getBlocklistedParticipantsCount();
    res.json(successResponse({ count }));
  })
);

export default router;
