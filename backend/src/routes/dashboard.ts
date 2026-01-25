import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { successResponse } from '../utils/response';
import { getBlocklistCount } from '../services/blocklistService';
import { getEvents } from '../services/eventService';
import { getActiveParticipantsCount } from '../services/participantService';
import { getNoShowTotal } from '../services/attendanceService';
import { getSupabaseClient } from '../utils/supabase';

const router = Router();

router.get(
  '/stats',
  asyncHandler(async (_req: Request, res: Response) => {
    const events = await getEvents();
    const activeParticipants = await getActiveParticipantsCount();
    const blocklistedParticipants = await getBlocklistCount();
    const noShows = await getNoShowTotal();

    // Disable caching so dashboard stays real-time
    res.set('Cache-Control', 'no-store');

    res.json(successResponse({
      totalEvents: events.length,
      activeParticipants,
      blocklistedParticipants,
      noShows,
      recentActivities: [],
      lastUpdated: new Date().toISOString(),
    }));
  })
);

// Aggregated counts pulled directly for lightweight dashboards
router.get(
  '/summary',
  asyncHandler(async (_req: Request, res: Response) => {
    const supabase = getSupabaseClient();

    const [
      { count: eventCount },
      { count: participantCount },
      { count: noShowCount }
    ] = await Promise.all([
      supabase.from('events').select('*', { count: 'exact' }),
      supabase.from('participants').select('*', { count: 'exact' }),
      supabase
        .from('attendance')
        .select('*', { count: 'exact' })
        .eq('status', 'not_attended'),
    ]);

    const blocklistedCount = await getBlocklistCount();

    // Disable caching so dashboard stays real-time
    res.set('Cache-Control', 'no-store');

    res.json(successResponse({
      events: eventCount || 0,
      participants: participantCount || 0,
      noShows: noShowCount || 0,
      blocklisted: blocklistedCount,
      lastUpdated: new Date().toISOString(),
    }));
  })
);

// Overview with recent activities and latest event stats
router.get(
  '/overview',
  asyncHandler(async (_req: Request, res: Response) => {
    const supabase = getSupabaseClient();

    const [
      { count: eventCount },
      { count: participantCount },
      { data: recentAttendance }
    ] = await Promise.all([
      supabase.from('events').select('*', { count: 'exact' }),
      supabase.from('participants').select('*', { count: 'exact' }),
      supabase
        .from('attendance')
        .select(`
          id,
          status,
          marked_at,
          created_at,
          participant_id,
          event_id,
          participants (id, name, email, is_blocklisted),
          events (id, name, date)
        `)
        .order('marked_at', { ascending: false })
        .limit(25),
    ]);

    // Latest event by date then creation
    const { data: latestEvent } = await supabase
      .from('events')
      .select('id, name, date, created_at')
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    let lastEventStats = null as null | {
      id: string;
      name: string;
      date: string | null;
      attendanceCount: number;
      noShowCount: number;
      participantCount: number;
      blocklistedInEvent: number;
    };

    if (latestEvent?.id) {
      const [attendanceCountRes, noShowCountRes, attendanceRows] = await Promise.all([
        supabase
          .from('attendance')
          .select('*', { count: 'exact' })
          .eq('event_id', latestEvent.id),
        supabase
          .from('attendance')
          .select('*', { count: 'exact' })
          .eq('event_id', latestEvent.id)
          .eq('status', 'not_attended'),
        supabase
          .from('attendance')
          .select('participant_id, participants(is_blocklisted)')
          .eq('event_id', latestEvent.id),
      ]);

      const attendeeRows = attendanceRows.data || [];
      const uniqueParticipants = new Set(attendeeRows.map((r: any) => r.participant_id));
      const blocklistedInEvent = attendeeRows.filter((r: any) => r.participants?.is_blocklisted).length;

      lastEventStats = {
        id: latestEvent.id,
        name: latestEvent.name,
        date: latestEvent.date || null,
        attendanceCount: attendanceCountRes.count || 0,
        noShowCount: noShowCountRes.count || 0,
        participantCount: uniqueParticipants.size,
        blocklistedInEvent,
      };
    }

    const noShowCount = await getNoShowTotal();
    const blocklistedCount = await getBlocklistCount();

    // Disable caching so dashboard stays real-time
    res.set('Cache-Control', 'no-store');

    res.json(successResponse({
      summary: {
        events: eventCount || 0,
        participants: participantCount || 0,
        noShows: noShowCount,
        blocklisted: blocklistedCount,
      },
      recentActivities: recentAttendance || [],
      lastEvent: lastEventStats,
      lastUpdated: new Date().toISOString(),
    }));
  })
);

export default router;
