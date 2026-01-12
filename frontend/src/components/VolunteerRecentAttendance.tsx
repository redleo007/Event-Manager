import { useState, useEffect } from 'react';
import { volunteersAPI } from '../api/client';
import './VolunteerRecentAttendance.css';

interface AttendanceRecord {
  id: string;
  volunteer_id: string;
  event_id: string;
  attendance_status: 'attended' | 'not_attended' | 'no_show';
  created_at: string;
  event_name: string;
  event_date: string;
}

interface VolunteerRecentAttendanceProps {
  volunteerId: string;
  volunteerName: string;
}

export function VolunteerRecentAttendance({ volunteerId, volunteerName }: VolunteerRecentAttendanceProps) {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRecentAttendance();
  }, [volunteerId]);

  const loadRecentAttendance = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await volunteersAPI.getRecentAttendance(volunteerId, 5);
      setAttendance(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load attendance';
      setError(message);
      setAttendance([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'attended':
        return 'status-badge status-attended';
      case 'not_attended':
        return 'status-badge status-not-attended';
      case 'no_show':
        return 'status-badge status-no-show';
      default:
        return 'status-badge';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'attended':
        return 'Attended';
      case 'not_attended':
        return 'Not Attended';
      case 'no_show':
        return 'No Show';
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="volunteer-recent-attendance">
      <div className="attendance-header">
        <h3>My Recent Event Attendance</h3>
        <span className="volunteer-name">{volunteerName}</span>
      </div>

      {loading && (
        <div className="attendance-loading">
          <div className="spinner"></div>
          <p>Loading attendance records...</p>
        </div>
      )}

      {error && (
        <div className="attendance-error">
          <p>⚠️ {error}</p>
        </div>
      )}

      {!loading && !error && attendance.length === 0 && (
        <div className="attendance-empty">
          <p>No recent attendance records found</p>
        </div>
      )}

      {!loading && !error && attendance.length > 0 && (
        <div className="attendance-list">
          {attendance.map((record) => (
            <div key={record.id} className="attendance-item">
              <div className="attendance-info">
                <h4 className="event-name">{record.event_name}</h4>
                <p className="event-date">📅 {formatDate(record.event_date)}</p>
              </div>
              <div className={getStatusBadgeClass(record.attendance_status)}>
                {getStatusLabel(record.attendance_status)}
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && !error && attendance.length > 0 && (
        <div className="attendance-footer">
          <a href={`/volunteers/${volunteerId}/history`} className="view-all-link">
            View All Attendance →
          </a>
        </div>
      )}
    </div>
  );
}
