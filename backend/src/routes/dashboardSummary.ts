/**
 * DASHBOARD SUMMARY API - SINGLE AGGREGATED ENDPOINT
 * Returns all dashboard statistics in ONE query (no N+1)
 * Performance: Should respond in <50ms
 */

import { Router, Request, Response } from 'express';
import { getSupabaseClient } from '../utils/supabase';

const router = Router();

/**
 * GET /api/dashboard/summary
 * Returns: { events, participants, noShows, blocklisted, lastUpdated }
 * 
 * Performance: ALL queries run in parallel with head:true for count-only
 * Target: ~30-50ms response time
 */
router.get('/summary', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseClient();

    // ALL count queries in parallel - head:true skips row fetching
    const [eventRes, participantRes, noShowRes, blocklistRes] = await Promise.all([
      supabase.from('events').select('*', { count: 'exact', head: true }),
      supabase.from('participants').select('*', { count: 'exact', head: true }).eq('is_blocklisted', false),
      supabase.from('attendance').select('*', { count: 'exact', head: true }).eq('status', 'not_attended'),
      supabase.from('blocklist').select('*', { count: 'exact', head: true }),
    ]);

    if (eventRes.error || participantRes.error || noShowRes.error || blocklistRes.error) {
      console.error('Dashboard errors:', { eventRes, participantRes, noShowRes, blocklistRes });
      throw new Error('Failed to fetch summary statistics');
    }

    const response = {
      events: eventRes.count || 0,
      participants: participantRes.count || 0,
      noShows: noShowRes.count || 0,
      blocklisted: blocklistRes.count || 0,
      lastUpdated: new Date().toISOString()
    };

    // Short cache for rapid navigation
    res.set('Cache-Control', 'private, max-age=5');
    return res.json(response);
  } catch (error) {
    console.error('❌ Dashboard summary error:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

/**
 * GET /api/dashboard/stats
 * Detailed statistics - optimized for speed
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseClient();

    // All counts in parallel with head:true
    const [totalRes, attendedRes, noShowRes] = await Promise.all([
      supabase.from('attendance').select('*', { count: 'exact', head: true }),
      supabase.from('attendance').select('*', { count: 'exact', head: true }).eq('status', 'attended'),
      supabase.from('attendance').select('*', { count: 'exact', head: true }).eq('status', 'not_attended'),
    ]);

    if (totalRes.error || attendedRes.error || noShowRes.error) {
      throw new Error('Failed to fetch attendance statistics');
    }

    res.set('Cache-Control', 'private, max-age=5');
    return res.json({
      total: totalRes.count || 0,
      attended: attendedRes.count || 0,
      noShows: { total: noShowRes.count || 0 }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

/**
 * GET /api/dashboard/overview
 * Complete dashboard overview - optimized with parallel queries
 */
router.get('/overview', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseClient();

    // All queries in parallel
    const [eventRes, participantRes, noShowRes, blocklistRes, recentRes] = await Promise.all([
      supabase.from('events').select('*', { count: 'exact', head: true }),
      supabase.from('participants').select('*', { count: 'exact', head: true }).eq('is_blocklisted', false),
      supabase.from('attendance').select('*', { count: 'exact', head: true }).eq('status', 'not_attended'),
      supabase.from('blocklist').select('*', { count: 'exact', head: true }),
      supabase.from('attendance').select('id, status, marked_at, participant_id, event_id').order('marked_at', { ascending: false }).limit(10),
    ]);

    res.set('Cache-Control', 'private, max-age=5');
    return res.json({
      summary: {
        events: eventRes.count || 0,
        participants: participantRes.count || 0,
        noShows: noShowRes.count || 0,
        blocklisted: blocklistRes.count || 0
      },
      recentActivities: recentRes.data || [],
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Dashboard overview error:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

export default router;
