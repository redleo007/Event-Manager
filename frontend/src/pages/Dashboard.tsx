import { useEffect, useState } from "react";
import { Calendar, Users, AlertCircle, Ban, RefreshCcw } from "lucide-react";
import { dashboardAPI } from "../api/client";
import "./Dashboard.css";

interface DashboardStats {
  totalEvents?: number;
  activeParticipants?: number;
  blocklistedParticipants?: number;
  noShows?: number;
  events?: number;
  participants?: number;
  blocklisted?: number;
}

export function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Dashboard - TechNexus Community";
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await dashboardAPI.getStats();
      console.log('Dashboard data:', response);
      
      // Handle both axios response and raw data
      let data = response;
      if (response && typeof response === 'object' && 'data' in response) {
        data = response.data;
      }
      
      if (data && typeof data === 'object') {
        setStats(data as DashboardStats);
      } else {
        // Set default empty stats if data is not valid
        setStats({
          totalEvents: 0,
          activeParticipants: 0,
          blocklistedParticipants: 0,
          noShows: 0,
        });
        setError('API returned invalid data format');
      }
    } catch (err) {
      console.error("Failed to load dashboard:", err);
      setError("Failed to load dashboard data. Using default values.");
      // Set default stats on error to still show the dashboard
      setStats({
        totalEvents: 0,
        activeParticipants: 0,
        blocklistedParticipants: 0,
        noShows: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard loading-container">
        <div className="spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  // Even if there's an error, show the dashboard with whatever data we have
  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div><h1>Dashboard</h1><p>Real-time system overview</p></div>
        <button className="btn btn-secondary btn-sm" onClick={loadDashboardData}>
          <RefreshCcw size={16} /> Refresh
        </button>
      </div>

      {error && (
        <div className="alert alert-warning" style={{ marginBottom: '20px' }}>
          {error}
        </div>
      )}

      {stats && (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon"><Calendar size={24} /></div>
              <div className="stat-content"><h3>Events</h3><p className="stat-value">{stats.totalEvents || stats.events || 0}</p></div>
            </div>
            <div className="stat-card">
              <div className="stat-icon"><Users size={24} /></div>
              <div className="stat-content"><h3>Participants</h3><p className="stat-value">{stats.activeParticipants || stats.participants || 0}</p></div>
            </div>
            <div className="stat-card">
              <div className="stat-icon"><AlertCircle size={24} /></div>
              <div className="stat-content"><h3>No-Shows</h3><p className="stat-value">{stats.noShows || 0}</p></div>
            </div>
            <div className="stat-card">
              <div className="stat-icon"><Ban size={24} /></div>
              <div className="stat-content"><h3>Blocklisted</h3><p className="stat-value">{stats.blocklistedParticipants || stats.blocklisted || 0}</p></div>
            </div>
          </div>

          <div className="quick-actions">
            <h2>Quick Access</h2>
            <div className="actions-grid">
              <a href="/events" className="action-card"><Calendar size={24} /><h4>Events</h4></a>
              <a href="/participants" className="action-card"><Users size={24} /><h4>Participants</h4></a>
              <a href="/no-shows" className="action-card"><AlertCircle size={24} /><h4>No-Shows</h4></a>
              <a href="/blocklist" className="action-card"><Ban size={24} /><h4>Blocklist</h4></a>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Dashboard;
