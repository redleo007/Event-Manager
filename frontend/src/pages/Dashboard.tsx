import { useEffect } from 'react';
import { dashboardAPI } from '../api/client';
import { useAsync } from '../utils/hooks';
import { formatDateTime } from '../utils/formatters';
import './Dashboard.css';

interface DashboardStats {
  totalEvents: number;
  activeParticipants: number;
  blocklistedParticipants: number;
  noShows: number;
  recentActivities: any[];
}

export function Dashboard() {
  const { data: stats, loading, error, refetch } = useAsync<DashboardStats>(
    () => dashboardAPI.getStats().then((res) => res.data),
    true
  );

  useEffect(() => {
    const interval = setInterval(refetch, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [refetch]);

  if (loading) {
    return (
      <div className="dashboard loading-container">
        <div className="spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard error-container">
        <div className="alert alert-error">
          <strong>Error:</strong> {error}
        </div>
        <button className="btn btn-primary" onClick={refetch}>
          Retry
        </button>
      </div>
    );
  }

  const getActivityIcon = (type: string): string => {
    switch (type) {
      case 'event_created':
        return '📅';
      case 'event_updated':
        return '✏️';
      case 'attendance_marked':
        return '✅';
      case 'participant_auto_blocked':
        return '🚫';
      case 'participant_unblocked':
        return '🔓';
      default:
        return '📝';
    }
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <p>Real-time event and attendance overview</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card stat-card-cyan">
          <div className="stat-icon">📅</div>
          <div className="stat-content">
            <h3>Total Events</h3>
            <p className="stat-value">{stats?.totalEvents || 0}</p>
          </div>
        </div>

        <div className="stat-card stat-card-lime">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>Active Participants</h3>
            <p className="stat-value">{stats?.activeParticipants || 0}</p>
          </div>
        </div>

        <div className="stat-card stat-card-magenta">
          <div className="stat-icon">❌</div>
          <div className="stat-content">
            <h3>Total No-Shows</h3>
            <p className="stat-value">{stats?.noShows || 0}</p>
          </div>
        </div>

        <div className="stat-card stat-card-purple">
          <div className="stat-icon">🚫</div>
          <div className="stat-content">
            <h3>Blocklisted</h3>
            <p className="stat-value">{stats?.blocklistedParticipants || 0}</p>
          </div>
        </div>
      </div>

      <div className="activities-section">
        <div className="section-header">
          <h2>Recent Activity</h2>
          <button className="btn btn-secondary btn-sm" onClick={refetch}>
            🔄 Refresh
          </button>
        </div>

        {stats?.recentActivities && stats.recentActivities.length > 0 ? (
          <div className="activity-feed">
            {stats.recentActivities.map((activity, index) => (
              <div key={index} className="activity-item">
                <div className="activity-icon">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="activity-content">
                  <h4>{formatActivityType(activity.type)}</h4>
                  <p>{activity.details}</p>
                  <time>{formatDateTime(activity.created_at)}</time>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>No recent activities</p>
          </div>
        )}
      </div>
    </div>
  );
}

function formatActivityType(type: string): string {
  const types: { [key: string]: string } = {
    event_created: 'Event Created',
    event_updated: 'Event Updated',
    attendance_marked: 'Attendance Marked',
    participant_auto_blocked: 'Participant Auto-Blocked',
    participant_unblocked: 'Participant Unblocked',
  };
  return types[type] || 'Activity';
}
