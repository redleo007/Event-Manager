import { useEffect, useState } from "react";
import { dashboardAPI } from "../api/client";
import { Icon } from "../components/Icon";
import "./Dashboard.css";

/**
 * SAFE DASHBOARD MODEL - PRIMITIVES ONLY
 * All fields are guaranteed to be primitive types
 * NEVER contains objects that would trigger React error #31
 */
interface DashboardStats {
  totalEvents: number;
  totalParticipants: number;
  totalNoShows: number;
  totalBlocklisted: number;
}

/**
 * DEFAULT DASHBOARD STATE
 * Ensures dashboard renders safely even if API fails
 * All values are primitives - safe for JSX rendering
 */
const DEFAULT_STATS: DashboardStats = {
  totalEvents: 0,
  totalParticipants: 0,
  totalNoShows: 0,
  totalBlocklisted: 0,
};

type RecentEvent = {
  title: string;
  date?: string | null;
  lastActivity?: string | null;
  stats?: {
    participants: number;
    attendance: number;
    noShows: number;
    blocklisted: number;
  };
};

/**
 * SAFE NUMBER EXTRACTION
 * Handles:
 * - Direct numbers: 42
 * - Nested objects: { total: 42, uniqueParticipants: 5, byParticipant: [...] }
 * - Invalid/missing values: returns fallback
 * 
 * CRITICAL: Never returns objects - always primitives
 */
const safeNumber = (value: any, fallback: number = 0): number => {
  // Already a valid number
  if (typeof value === 'number' && Number.isInteger(value) && value >= 0) {
    return value;
  }

  // Object with .total property (e.g., { total, uniqueParticipants, byParticipant })
  if (value && typeof value === 'object' && 'total' in value) {
    const total = value.total;
    if (typeof total === 'number' && Number.isInteger(total) && total >= 0) {
      return total;
    }
  }

  return fallback;
};

/**
 * MAP BACKEND RESPONSE TO SAFE DASHBOARD MODEL
 * Extracts ONLY what we need, stripping unused fields
 * Result: Pure primitive values, safe for React JSX
 */
const mapBackendToDashboard = (response: any): DashboardStats => {
  try {
    // Guard: response is an object
    if (!response || typeof response !== 'object') {
      console.warn('[Dashboard] Invalid response type:', typeof response);
      return DEFAULT_STATS;
    }

    // Extract data from axios response wrapper or direct response
    const data = response?.data ?? response;

    // Guard: data is an object
    if (typeof data !== 'object' || data === null) {
      console.warn('[Dashboard] Invalid data object');
      return DEFAULT_STATS;
    }

    // Support both /dashboard/stats and /dashboard/overview shapes
    const stats: DashboardStats = {
      totalEvents: safeNumber(data.totalEvents ?? data.events, 0),
      totalParticipants: safeNumber(
        data.activeParticipants ?? data.totalParticipants ?? data.participants,
        0
      ),
      totalNoShows: safeNumber(data.noShows ?? data.noShowTotal ?? data.totalNoShows, 0),
      totalBlocklisted: safeNumber(
        data.blocklistedParticipants ?? data.blocklisted ?? data.totalBlocklisted,
        0
      ),
    };

    return stats;
  } catch (error) {
    console.error('[Dashboard] Error mapping response:', error);
    return DEFAULT_STATS;
  }
};

export function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>(DEFAULT_STATS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recentEvent, setRecentEvent] = useState<RecentEvent | null>(null);

  useEffect(() => {
    document.title = "Dashboard - TechNexus Community";
    loadDashboardData();

    // Auto-refresh every 15s to keep overview real-time
    const timer = setInterval(() => {
      loadDashboardData(false);
    }, 15000);

    return () => {
      if (timer) clearInterval(timer);
    };
  }, []);

  /**
   * LOAD DASHBOARD DATA - Single API Call
   * Fetches complete overview with one request
   * Fails gracefully with default data if API is down
   */
  const loadDashboardData = async (showLoader: boolean = true) => {
    if (showLoader) setLoading(true);
    setError(null);
    
    try {
      // Fetch stats and overview concurrently
      const [statsRes, overviewRes] = await Promise.allSettled([
        dashboardAPI.getStats(),
        dashboardAPI.getOverview(),
      ]);

      let nextStats: DashboardStats | null = null;

      if (overviewRes.status === 'fulfilled') {
        const overviewRaw = overviewRes.value as any;
        const overview = overviewRaw?.data ?? overviewRaw; // axios interceptor may unwrap to payload already

        const activitiesRaw = Array.isArray(overview?.recentActivities)
          ? overview.recentActivities
          : [];

        // De-duplicate activities by id to avoid double renders if API returns overlaps
        const seenIds = new Set<string>();
        const activities = activitiesRaw.filter((item: any) => {
          const id = String(item?.id ?? '');
          if (!id) return false;
          if (seenIds.has(id)) return false;
          seenIds.add(id);
          return true;
        });

        const lastEvent = overview?.lastEvent;

        if (overview?.summary) {
          nextStats = {
            totalEvents: overview.summary.events ?? 0,
            totalParticipants: overview.summary.participants ?? 0,
            totalNoShows: overview.summary.noShows ?? 0,
            totalBlocklisted: overview.summary.blocklisted ?? 0,
          };
        }

        if (lastEvent) {
          setRecentEvent({
            title: lastEvent.name,
            date: lastEvent.date,
            lastActivity: overview?.lastUpdated,
            stats: {
              participants: lastEvent.participantCount ?? 0,
              attendance: lastEvent.attendanceCount ?? 0,
              noShows: lastEvent.noShowCount ?? 0,
              blocklisted: lastEvent.blocklistedInEvent ?? 0,
            },
          });
        } else if (activities.length > 0) {
          const latest = activities[0];
          setRecentEvent({
            title: latest?.events?.name,
            date: latest?.events?.date || null,
            lastActivity: latest?.marked_at || latest?.created_at || overview?.lastUpdated || null,
          });
        } else {
          setRecentEvent(null);
        }
      } else {
        console.warn('[Dashboard] Overview not available:', overviewRes.reason);
      }

      // If overview didn't provide stats, fall back to /stats endpoint
      if (!nextStats) {
        if (statsRes.status === 'fulfilled') {
          nextStats = mapBackendToDashboard(statsRes.value);
        } else {
          throw statsRes.reason ?? new Error('Dashboard API request failed');
        }
      }

      setStats(nextStats);
      setError(null);
    } catch (err) {
      // Log error for debugging
      console.error("[Dashboard] Failed to load data:", {
        message: err instanceof Error ? err.message : String(err),
        timestamp: new Date().toISOString(),
      });

      // Show user-friendly error
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'Failed to load dashboard. Please refresh to try again.';
      setError(errorMessage);

      // CRITICAL: Still show dashboard with defaults
      // This prevents white screen even when API fails
      setStats(DEFAULT_STATS);
      setRecentEvent(null);
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  // LOADING STATE
  if (loading) {
    return (
      <div className="dashboard loading-container">
        <div className="spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  // RENDER DASHBOARD
  return (
    <div className="dashboard">
      {/* HEADER */}
      <div className="dashboard-header">
        <div>
          <h1>Dashboard</h1>
          <p>Real-time system overview</p>
        </div>
        <button 
          className="btn btn-secondary btn-sm" 
          onClick={() => loadDashboardData(true)}
          disabled={loading}
          title={loading ? "Loading..." : "Refresh dashboard data"}
        >
          <Icon alt="Refresh" name="refresh" /> Refresh
        </button>
      </div>

      {/* ERROR ALERT */}
      {error && (
        <div className="alert alert-warning" style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Icon alt="Warning" name="warning" sizePx={18} />
          <div>
            <strong>Dashboard Notice:</strong> {error}
          </div>
        </div>
      )}

      {/* MAIN STATS GRID - All values are primitives (numbers/strings only) */}
      <div className="stats-grid">
        {/* Total Events */}
        <div className="stat-card">
          <div className="stat-icon"><Icon alt="Events" name="events" /></div>
          <div className="stat-content">
            <h3>Events</h3>
            <p className="stat-value">{stats?.totalEvents ?? 0}</p>
          </div>
        </div>

        {/* Total Participants */}
        <div className="stat-card">
          <div className="stat-icon"><Icon alt="Participants" name="participants" /></div>
          <div className="stat-content">
            <h3>Participants</h3>
            <p className="stat-value">{stats?.totalParticipants ?? 0}</p>
          </div>
        </div>

        {/* Total No-Shows */}
        <div className="stat-card">
          <div className="stat-icon"><Icon alt="No-Shows" name="noShows" /></div>
          <div className="stat-content">
            <h3>No-Shows</h3>
            <p className="stat-value">{stats?.totalNoShows ?? 0}</p>
          </div>
        </div>

        {/* Total Blocklisted */}
        <div className="stat-card">
          <div className="stat-icon"><Icon alt="Blocklisted" name="blocklist" /></div>
          <div className="stat-content">
            <h3>Blocklisted</h3>
            <p className="stat-value">{stats?.totalBlocklisted ?? 0}</p>
          </div>
        </div>
      </div>

      {/* Recent Event Overview */}
      <div className="recent-event-card">
        <div className="recent-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Icon alt="Recent" name="clock" />
            <h2 style={{ margin: 0 }}>Recent Event</h2>
          </div>
          <span className="recent-updated">
            {recentEvent?.lastActivity ? new Date(recentEvent.lastActivity).toLocaleString() : 'No activity yet'}
          </span>
        </div>
        {recentEvent ? (
          <div className="recent-body">
            <div>
              <p className="recent-title">{recentEvent.title}</p>
              <p className="recent-date">{recentEvent.date ? new Date(recentEvent.date).toLocaleDateString() : '—'}</p>
            </div>
            <div className="recent-stats">
              <div className="recent-stat">
                <span className="label">Participants</span>
                <span className="value">{recentEvent.stats?.participants ?? 0}</span>
              </div>
              <div className="recent-stat">
                <span className="label">Attendance</span>
                <span className="value">{recentEvent.stats?.attendance ?? 0}</span>
              </div>
              <div className="recent-stat">
                <span className="label">No-Shows</span>
                <span className="value">{recentEvent.stats?.noShows ?? 0}</span>
              </div>
              <div className="recent-stat">
                <span className="label">Blocklisted</span>
                <span className="value">{recentEvent.stats?.blocklisted ?? 0}</span>
              </div>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => loadDashboardData(true)} disabled={loading}>
              <Icon alt="Refresh" name="refresh" /> Refresh
            </button>
          </div>
        ) : (
          <div className="recent-body" style={{ justifyContent: 'space-between' }}>
            <p className="recent-title">No recent activity</p>
            <button className="btn btn-secondary btn-sm" onClick={() => loadDashboardData(true)} disabled={loading}>
              <Icon alt="Refresh" name="refresh" /> Refresh
            </button>
          </div>
        )}
      </div>

      {/* Status Info - Show when error */}
      {error && (
        <div className="dashboard-status" style={{ marginTop: '30px', padding: '16px', borderRadius: '8px', backgroundColor: 'rgba(0, 217, 255, 0.05)', border: '1px solid rgba(0, 217, 255, 0.2)', fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.7)' }}>
          <p style={{ margin: '0 0 8px 0' }}>
            <strong>Tip:</strong> Click "Refresh" to reload dashboard data from the server.
          </p>
          <p style={{ margin: 0 }}>
            If problems persist, check your network connection and ensure the backend server is running.
          </p>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
