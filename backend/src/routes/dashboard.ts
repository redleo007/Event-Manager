import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { successResponse } from '../utils/response';
import { getBlocklistCount } from '../services/blocklistService';
import { getEvents } from '../services/eventService';
import { getActiveParticipantsCount } from '../services/participantService';
import { getNoShowTotal } from '../services/attendanceService';

const router = Router();

router.get(
  '/stats',
  asyncHandler(async (_req: Request, res: Response) => {
    const events = await getEvents();
    const activeParticipants = await getActiveParticipantsCount();
    const blocklistedParticipants = await getBlocklistCount();
    const noShows = await getNoShowTotal();

    res.json(successResponse({
      totalEvents: events.length,
      activeParticipants,
      blocklistedParticipants,
      noShows,
      recentActivities: [],
    }));
  })
);

export default router;
