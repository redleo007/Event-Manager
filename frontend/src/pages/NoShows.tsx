import { useState, useEffect } from 'react';
import { attendanceAPI, participantsAPI, eventsAPI } from '../api/client';
import { useAsync } from '../utils/hooks';
import { formatDate } from '../utils/formatters';
import './NoShows.css';

interface NoShowRecord {
  id: string;
  event_id: string;
  participant_id: string;
  participant_name: string;
  event_name: string;
  date: string;
  marked_at: string;
}

interface Participant {
  id: string;
  name: string;
  email: string;
}

interface Event {
  id: string;
  name: string;
  date?: string;
}

export function NoShows() {
  const [noShowRecords, setNoShowRecords] = useState<NoShowRecord[]>([]);
  const [selectedParticipant, setSelectedParticipant] = useState<string>('');
  const [noShowCounts, setNoShowCounts] = useState<{ [key: string]: number }>({});
  const [loading, setLoading] = useState(true);

  const { data: events } = useAsync<Event[]>(
    () => eventsAPI.getAll().then((res) => res.data),
    true
  );

  const { data: participants } = useAsync<Participant[]>(
    () => participantsAPI.getAll(true).then((res) => res.data),
    true
  );

  useEffect(() => {
    const loadNoShows = async () => {
      setLoading(true);
      try {
        if (!events || !participants) return;

        let records: NoShowRecord[] = [];
        const counts: { [key: string]: number } = {};

        // Get all attendance records
        for (const event of events) {
          const attendance = await attendanceAPI.getByEvent(event.id);
          for (const record of attendance.data || []) {
            if (record.status === 'no_show') {
              const participant = participants.find(
                (p) => p.id === record.participant_id
              );
              if (participant) {
                records.push({
                  id: record.id,
                  event_id: event.id,
                  participant_id: record.participant_id,
                  participant_name: participant.name,
                  event_name: event.name,
                  date: event.date || '',
                  marked_at: record.marked_at,
                });

                counts[record.participant_id] =
                  (counts[record.participant_id] || 0) + 1;
              }
            }
          }
        }

        setNoShowRecords(records.sort((a, b) => new Date(b.marked_at).getTime() - new Date(a.marked_at).getTime()));
        setNoShowCounts(counts);
      } catch (error) {
        console.error('Failed to load no-shows:', error);
      } finally {
        setLoading(false);
      }
    };

    if (events && participants) {
      loadNoShows();
    }
  }, [events, participants]);

  const filteredRecords = selectedParticipant
    ? noShowRecords.filter((r) => r.participant_id === selectedParticipant)
    : noShowRecords;

  const participantStats = participants?.map((p) => ({
    ...p,
    noShowCount: noShowCounts[p.id] || 0,
  })) || [];

  const criticalParticipants = participantStats.filter((p) => p.noShowCount >= 2);

  if (loading) {
    return (
      <div className="no-shows loading-container">
        <div className="spinner"></div>
        <p>Loading no-show data...</p>
      </div>
    );
  }

  return (
    <div className="no-shows">
      <div className="page-header">
        <h1>No-Show Management</h1>
        <p>Track and manage participant no-shows</p>
      </div>

      <div className="stats-section">
        <div className="stat-card stat-card-warning">
          <div className="stat-icon">⚠️</div>
          <div className="stat-content">
            <h3>Total No-Shows</h3>
            <p className="stat-value">{noShowRecords.length}</p>
          </div>
        </div>

        <div className="stat-card stat-card-danger">
          <div className="stat-icon">🚨</div>
          <div className="stat-content">
            <h3>Critical (2+)</h3>
            <p className="stat-value">{criticalParticipants.length}</p>
          </div>
        </div>
      </div>

      <div className="content-grid">
        <div className="card">
          <h2>Participant No-Show Summary</h2>
          <div className="participant-list">
            {participantStats.length === 0 ? (
              <p className="empty-text">No participants found</p>
            ) : (
              participantStats
                .filter((p) => p.noShowCount > 0)
                .sort((a, b) => b.noShowCount - a.noShowCount)
                .map((p) => (
                  <div
                    key={p.id}
                    className={`participant-item ${
                      selectedParticipant === p.id ? 'active' : ''
                    } ${p.noShowCount >= 2 ? 'critical' : ''}`}
                    onClick={() =>
                      setSelectedParticipant(
                        selectedParticipant === p.id ? '' : p.id
                      )
                    }
                  >
                    <div className="participant-info">
                      <h4>{p.name}</h4>
                      <p>{p.email}</p>
                    </div>
                    <div className="no-show-badge">
                      <span className={`badge badge-${p.noShowCount >= 2 ? 'danger' : 'warning'}`}>
                        {p.noShowCount} no-show{p.noShowCount > 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>

        <div className="card">
          <h2>
            {selectedParticipant
              ? 'No-Show History'
              : 'All No-Show Records'}
          </h2>
          <div className="records-list">
            {filteredRecords.length === 0 ? (
              <p className="empty-text">
                {selectedParticipant
                  ? 'No records for this participant'
                  : 'No no-show records found'}
              </p>
            ) : (
              <div className="table-wrapper">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Participant</th>
                      <th>Event</th>
                      <th>Date</th>
                      <th>Marked</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecords.map((record) => (
                      <tr key={record.id}>
                        <td>
                          <strong>{record.participant_name}</strong>
                        </td>
                        <td>{record.event_name}</td>
                        <td>{formatDate(record.date)}</td>
                        <td>{formatDate(record.marked_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {criticalParticipants.length > 0 && (
        <div className="alert alert-warning" style={{ marginTop: '30px' }}>
          <strong>⚠️ Auto-Block Alert:</strong> {criticalParticipants.length} participant(s)
          have 2 or more no-shows and have been automatically added to the blocklist.
        </div>
      )}
    </div>
  );
}
