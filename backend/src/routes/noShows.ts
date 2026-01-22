/**
 * NO-SHOWS API - OPTIMIZED FOR PERFORMANCE
 * Endpoints: list, add, delete, export CSV
 * All operations use aggregated queries - NO N+1
 * 
 * ROUTE ORDER: Specific routes must come BEFORE generic ones!
 * Order: /export/csv, /count, /participant/:id, /, POST /, DELETE /:id
 */

import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { successResponse } from '../utils/response';
import {
  getNoShowTotal,
  getAllNoShows,
  getNoShowsByParticipant,
  markAttendance,
  deleteAttendance
} from '../services/attendanceService';
import { syncAutoBlocklist } from '../services/blocklistService';

const router = Router();

/**
 * GET /api/no-shows/export/csv
 * Export all no-shows as CSV file
 * MUST be before /:id route
 */
router.get(
  '/export/csv',
  asyncHandler(async (_req: Request, res: Response) => {
    const records = await getAllNoShows();

    // Build CSV manually (no external dependency)
    const headers = ['Participant ID', 'Participant Name', 'Event ID', 'Event Name', 'Status', 'Marked At', 'Created At'];
    const rows = records.map((record: any) => [
      record.participant_id,
      record.participants?.name || 'Unknown',
      record.event_id,
      record.events?.name || 'Unknown',
      record.status || 'not_attended',
      record.marked_at || '',
      record.created_at || ''
    ]);

    // Create CSV content
    const csvContent = [
      headers.map(h => `"${h}"`).join(','),
      ...rows.map(row => row.map((cell: any) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    // Send as file download
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="no-shows.csv"');
    res.send(csvContent);
  })
);

/**
 * GET /api/no-shows/count
 * Returns: { success, data: { total, uniqueParticipants }, timestamp }
 * Lightweight endpoint for dashboard/frontend
 * MUST be before / route
 */
router.get(
  '/count',
  asyncHandler(async (_req: Request, res: Response) => {
    const total = await getNoShowTotal();
    const noShowsByParticipant = await getNoShowsByParticipant();
    const uniqueParticipants = Object.keys(noShowsByParticipant).length;

    res.json(successResponse({
      total,
      uniqueParticipants
    }));
  })
);

/**
 * GET /api/no-shows/participant/:id
 * Get all no-shows for a specific participant
 * MUST be before /:id route
 */
router.get(
  '/participant/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    
    const records = await getAllNoShows();
    const participantNoShows = records.filter(r => r.participant_id === id);

    res.json(successResponse({
      total: participantNoShows.length,
      data: participantNoShows
    }));
  })
);

/**
 * GET /api/no-shows
 * Returns: { success, data: { records, total, count, uniqueParticipants }, timestamp }
 * Generic GET - after specific routes
 */
router.get(
  '/',
  asyncHandler(async (_req: Request, res: Response) => {
    // Get all no-show records (single aggregated query)
    const records = await getAllNoShows();

    // Get count by participant
    const noShowsByParticipant = await getNoShowsByParticipant();
    const uniqueParticipants = Object.keys(noShowsByParticipant).length;

    res.json(successResponse({
      data: records,
      total: records.length,
      uniqueParticipants,
      count: records.length
    }));
  })
);

/**
 * POST /api/no-shows
 * Manually mark participant as no-show
 * Body: { participant_id, event_id }
 */
router.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const { participant_id, event_id } = req.body;

    if (!participant_id || !event_id) {
      return res.status(400).json({
        error: 'participant_id and event_id are required'
      });
    }

    // Mark as not_attended
    const attendance = await markAttendance(event_id, participant_id, 'not_attended');

    // Sync auto-blocklist (participant might need to be auto-blocked now)
    await syncAutoBlocklist();

    res.json(successResponse(attendance));
  })
);

/**
 * DELETE /api/no-shows/:id
 * Remove/undo a no-show record
 */
router.delete(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        error: 'id is required'
      });
    }

    await deleteAttendance(id);

    // Sync auto-blocklist (participant might need to be removed if now <2 no-shows)
    await syncAutoBlocklist();

    res.json(successResponse({ message: 'No-show record deleted' }));
  })
);

export default router;