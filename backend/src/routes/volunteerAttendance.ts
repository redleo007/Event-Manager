import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { successResponse } from '../utils/response';
import * as volunteerAttendanceService from '../services/volunteerAttendanceService';

const router = Router({ mergeParams: true });

/**
 * GET /api/volunteers/:volunteer_id/attendance?limit=5
 * Get recent event attendance for a volunteer
 */
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const { volunteer_id } = req.params;
    const limit = parseInt(req.query.limit as string) || 5;

    if (!volunteer_id) {
      return res.status(400).json({ error: 'volunteer_id is required' });
    }

    const attendance = await volunteerAttendanceService.getVolunteerRecentAttendance(volunteer_id, limit);
    res.json(successResponse(attendance));
  })
);

/**
 * GET /api/volunteers/:volunteer_id/attendance/history?page=1&limit=20
 * Get full attendance history with pagination
 */
router.get(
  '/history',
  asyncHandler(async (req: Request, res: Response) => {
    const { volunteer_id } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    if (!volunteer_id) {
      return res.status(400).json({ error: 'volunteer_id is required' });
    }

    const history = await volunteerAttendanceService.getVolunteerAttendanceHistory(
      volunteer_id,
      page,
      limit
    );
    res.json(successResponse(history));
  })
);

/**
 * GET /api/volunteers/:volunteer_id/attendance/stats
 * Get attendance statistics for a volunteer
 */
router.get(
  '/stats',
  asyncHandler(async (req: Request, res: Response) => {
    const { volunteer_id } = req.params;

    if (!volunteer_id) {
      return res.status(400).json({ error: 'volunteer_id is required' });
    }

    const stats = await volunteerAttendanceService.getVolunteerAttendanceStats(volunteer_id);
    res.json(successResponse(stats));
  })
);

/**
 * POST /api/volunteers/:volunteer_id/attendance
 * Record volunteer attendance for an event
 */
router.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const { volunteer_id } = req.params;
    const { event_id, attendance_status } = req.body;

    if (!volunteer_id) {
      return res.status(400).json({ error: 'volunteer_id is required' });
    }

    if (!event_id) {
      return res.status(400).json({ error: 'event_id is required' });
    }

    if (!attendance_status || !['attended', 'not_attended', 'no_show'].includes(attendance_status)) {
      return res.status(400).json({ error: 'attendance_status must be one of: attended, not_attended, no_show' });
    }

    const record = await volunteerAttendanceService.recordVolunteerAttendance(
      volunteer_id,
      event_id,
      attendance_status
    );
    res.status(201).json(successResponse(record));
  })
);

export default router;
