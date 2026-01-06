import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { successResponse } from '../utils/response';
import * as importHistoryService from '../services/importHistoryService';

const router = Router();

// Get import sessions for an event (last 30 days by default)
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const { event_id, days = '30' } = req.query;

    if (!event_id || typeof event_id !== 'string') {
      return res.status(400).json({ error: 'event_id is required' });
    }

    const daysBack = Math.max(1, Math.min(365, parseInt(days as string) || 30));
    const sessions = await importHistoryService.getImportSessions(event_id, daysBack);
    res.json(successResponse(sessions));
  })
);

// Get a specific import session with audit logs
router.get(
  '/:import_session_id',
  asyncHandler(async (req: Request, res: Response) => {
    const { import_session_id } = req.params;

    const session = await importHistoryService.getImportSession(import_session_id);
    
    if (!session) {
      return res.status(404).json({ error: 'Import session not found' });
    }

    const auditLogs = await importHistoryService.getAuditLogs(import_session_id);

    res.json(successResponse({
      session,
      auditLogs,
    }));
  })
);

// Delete/rollback an import session
router.delete(
  '/:import_session_id',
  asyncHandler(async (req: Request, res: Response) => {
    const { import_session_id } = req.params;

    try {
      // Get the session to determine type
      const session = await importHistoryService.getImportSession(import_session_id);

      if (!session) {
        return res.status(404).json({ error: 'Import session not found' });
      }

      // Delete based on type
      if (session.import_type === 'participants') {
        await importHistoryService.deleteParticipantImport(import_session_id);
      } else if (session.import_type === 'attendance') {
        await importHistoryService.revertAttendanceImport(import_session_id);
      } else {
        return res.status(400).json({ error: 'Invalid import type' });
      }

      res.json(successResponse({
        message: `${session.import_type === 'participants' ? 'Deleted' : 'Reverted'} import successfully`,
        import_session_id,
        import_type: session.import_type,
        records_affected: session.record_count,
      }));
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);

      // Handle specific validation errors
      if (errorMsg.includes('30 days')) {
        return res.status(403).json({
          error: 'Import history is only available for the last 30 days. This import cannot be deleted.'
        });
      } else if (errorMsg.includes('not found')) {
        return res.status(404).json({
          error: 'Import session not found or has already been deleted'
        });
      }

      return res.status(500).json({
        error: `Failed to delete import: ${errorMsg}`
      });
    }
  })
);

export default router;
