import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { successResponse } from '../utils/response';
import * as attendanceService from '../services/attendanceService';
import { checkAndAutoBlock } from '../services/blocklistService';

const router = Router();

router.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const { event_id, participant_id, status } = req.body;
    
    if (!event_id || !participant_id || !status) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const attendance = await attendanceService.markAttendance({
      event_id,
      participant_id,
      status,
    });

    // Check if auto-blocking should occur
    if (status === 'no_show') {
      await checkAndAutoBlock(participant_id);
    }

    res.status(201).json(successResponse(attendance));
  })
);

router.get(
  '/event/:eventId',
  asyncHandler(async (req: Request, res: Response) => {
    const attendance = await attendanceService.getAttendanceByEvent(req.params.eventId);
    res.json(successResponse(attendance));
  })
);

router.get(
  '/participant/:participantId',
  asyncHandler(async (req: Request, res: Response) => {
    const attendance = await attendanceService.getAttendanceByParticipant(req.params.participantId);
    res.json(successResponse(attendance));
  })
);

router.put(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { status } = req.body;
    const attendance = await attendanceService.updateAttendance(req.params.id, status);

    // Check if auto-blocking should occur
    if (status === 'no_show') {
      // Need to get participant_id from the attendance record
      await checkAndAutoBlock(attendance.participant_id);
    }

    res.json(successResponse(attendance));
  })
);

router.get(
  '/stats/overview',
  asyncHandler(async (_req: Request, res: Response) => {
    const stats = await attendanceService.getAttendanceStats();
    res.json(successResponse(stats));
  })
);

export default router;
