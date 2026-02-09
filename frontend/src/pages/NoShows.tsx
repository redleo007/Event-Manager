import { useState, useEffect } from 'react';
import Icon from '../components/Icon';
import { participantsAPI, eventsAPI, attendanceAPI } from '../api/client';
import { formatDateTime } from '../utils/formatters';
import './NoShows.css';

interface NoShowRecord {
  id: string;
  event_id: string;
  participant_id: string;
  status: string;
  marked_at: string;
  events?: {
    id: string;
    name: string;
    date: string;
  };
  participants?: {
    id: string;
    name: string;
    email: string;
  };
}

interface Participant {
  id: string;
  name: string;
  email: string;
  is_blocklisted: boolean;
}

interface Event {
  id: string;
  name: string;
  date: string;
}

export function NoShows() {
  const [noShowRecords, setNoShowRecords] = useState<NoShowRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<NoShowRecord[]>([]);
  // Aggregate total currently unused in UI; remove state to avoid unused warnings

  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] =
    useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedParticipantId, setSelectedParticipantId] = useState('');
  const [selectedEventId, setSelectedEventId] = useState('');

  const [participants, setParticipants] = useState<Participant[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<NoShowRecord | null>(null);
  const [deleting, setDeleting] = useState(false);

  /* ================= LOAD ON MOUNT ================= */

  /* ================= LOAD ON MOUNT ================= */

  useEffect(() => {
    document.title = 'No Shows - TechNexus Community';
    loadData();
  }, []);

  /* ================= LOAD FORM DATA ================= */

  const loadFormData = async () => {
    try {
      const [pRes, eRes] = await Promise.all([
        participantsAPI.getAll(false),
        eventsAPI.getAll(),
      ]);

      const participantsData = Array.isArray(pRes)
        ? pRes
        : pRes?.data ?? [];

      const eventsData = Array.isArray(eRes)
        ? eRes
        : eRes?.data ?? [];

      setParticipants(participantsData);
      setEvents(eventsData);
    } catch (err) {
      console.error('Failed to load form data:', err);
      setParticipants([]);
      setEvents([]);
    }
  };

  /* ================= LOAD NO-SHOW DATA ================= */

  const loadData = async () => {
    setLoading(true);
    try {
      const payload = await attendanceAPI.getNoShows();

      let records: NoShowRecord[] = [];

      // ✅ Handles both DEV + PROD responses
      if (Array.isArray(payload)) {
        records = payload;
      } else if (Array.isArray(payload?.data)) {
        records = payload.data;
      }

      setNoShowRecords(records);
      setFilteredRecords(records);
    } catch (error) {
      console.error('Failed to load no-shows:', error);
      setMessage({
        type: 'error',
        text:
          error instanceof Error
            ? error.message
            : 'Failed to load no-show records',
      });
      setNoShowRecords([]);
      setFilteredRecords([]);
    } finally {
      setLoading(false);
    }
  };

  /* ================= SEARCH FILTER ================= */

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredRecords(noShowRecords);
      return;
    }

    const lower = searchTerm.toLowerCase();
    setFilteredRecords(
      noShowRecords.filter(
        (r) =>
          r.participants?.name?.toLowerCase().includes(lower) ||
          r.participants?.email?.toLowerCase().includes(lower)
      )
    );
  }, [searchTerm, noShowRecords]);

  /* ================= NO-SHOW COUNT BY PARTICIPANT ================= */

  const noShowsByParticipant = filteredRecords.reduce<Record<string, number>>(
    (acc, record) => {
      const id = record.participant_id;
      acc[id] = (acc[id] || 0) + 1;
      return acc;
    },
    {}
  );

  // Derived counts reflect the currently visible (filtered) rows to avoid mismatches
  const visibleNoShows = filteredRecords.length;

  /* ================= EXPORT CSV ================= */

  const handleExportCSV = () => {
    if (filteredRecords.length === 0) {
      setMessage({ type: 'error', text: 'No records to export' });
      return;
    }

    const headers = [
      'Name',
      'Email',
      'Event',
      'Event Date',
      'Marked At',
    ];

    const rows = filteredRecords.map((r) => [
      r.participants?.name ?? 'Unknown',
      r.participants?.email ?? 'N/A',
      r.events?.name ?? 'Unknown Event',
      r.events?.date ?? 'N/A',
      formatDateTime(r.marked_at),
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((c) => `"${c}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `no-shows-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    URL.revokeObjectURL(url);

    setMessage({
      type: 'success',
      text: `Exported ${filteredRecords.length} records`,
    });
  };

  /* ================= ADD NO-SHOW ================= */

  const handleAddNoShow = async () => {
    if (!selectedParticipantId || !selectedEventId) {
      setMessage({
        type: 'error',
        text: 'Please select both participant and event',
      });
      return;
    }

    try {
      await attendanceAPI.mark({
        participant_id: selectedParticipantId,
        event_id: selectedEventId,
        status: 'not_attended',
      });

      setMessage({
        type: 'success',
        text: 'No-show record added successfully',
      });

      setShowAddForm(false);
      setSelectedParticipantId('');
      setSelectedEventId('');

      await loadData();
    } catch (err) {
      console.error('Failed to add no-show:', err);
      setMessage({
        type: 'error',
        text: 'Failed to add no-show record',
      });
    }
  };

  /* ================= DELETE NO-SHOW ================= */

  const handleDeleteNoShow = async () => {
    if (!deleteTarget) return;

    setDeleting(true);
    try {
      await attendanceAPI.delete(deleteTarget.id);

      setMessage({
        type: 'success',
        text: 'No-show record deleted successfully',
      });

      await loadData();
    } catch (err) {
      console.error('Failed to delete no-show:', err);
      setMessage({
        type: 'error',
        text: 'Failed to delete no-show record',
      });
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  /* ================= LOADING ================= */

  if (loading) {
    return (
      <div className="no-shows loading-container">
        <div className="spinner"></div>
        <p>Loading no-show records…</p>
      </div>
    );
  }

  /* ================= UI ================= */

  return (
    <div className="no-shows">
      <div className="page-header">
        <h1>No-Shows Management</h1>
        <p>Track and manage participants who missed events</p>
      </div>

      {message && (
        <div className={`alert alert-${message.type}`}>
          {message.text}
        </div>
      )}

      {/* ===== STATS ===== */}
      <div className="stats-section">
        <div className="stat-card total-card">
          <div className="stat-icon large">
            <Icon name="noShows" alt="No-shows" sizePx={40} />
          </div>
          <div className="stat-content centered">
            <h3>Total No-Shows</h3>
            <p className="stat-value">{visibleNoShows}</p>
          </div>
        </div>
      </div>

      {/* ===== LIST ===== */}
      <div className="card">
        <div className="list-header">
          <div className="search-container">
            <input
              className="search-input"
              placeholder="Search by name or email…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="action-buttons">
            <button
              className="btn btn-primary btn-sm"
              onClick={() => {
                const nextState = !showAddForm;
                setShowAddForm(nextState);
                if (nextState && participants.length === 0) {
                  loadFormData();
                }
              }}
            >
              <Icon name="add" alt="Add" sizePx={16} /> Add
            </button>
            <button
              className="btn btn-secondary btn-sm"
              onClick={handleExportCSV}
            >
              <Icon name="download" alt="Export" sizePx={16} /> Export
            </button>
          </div>
        </div>

        {/* ===== ADD FORM ===== */}
        {showAddForm && (
          <div className="add-form-section">
            <h3>Add No-Show</h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAddNoShow();
              }}
            >
              <div className="form-group">
                <label>Participant</label>
                <select
                  value={selectedParticipantId}
                  onChange={(e) =>
                    setSelectedParticipantId(e.target.value)
                  }
                >
                  <option value="">Select participant</option>
                  {participants
                    .filter((p) => !p.is_blocklisted)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.email})
                      </option>
                    ))}
                </select>
              </div>

              <div className="form-group">
                <label>Event</label>
                <select
                  value={selectedEventId}
                  onChange={(e) => setSelectedEventId(e.target.value)}
                >
                  <option value="">Select event</option>
                  {events.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name} – {e.date}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-actions">
                <button className="btn btn-primary">Add</button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowAddForm(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ===== TABLE ===== */}
        {filteredRecords.length > 0 ? (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Participant</th>
                  <th>Email</th>
                  <th>No-Show Count</th>
                  <th>Event</th>
                  <th>Event Date</th>
                  <th>Marked At</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((r) => (
                  <tr key={r.id}>
                    <td>{r.participants?.name ?? 'Unknown'}</td>
                    <td>{r.participants?.email ?? 'N/A'}</td>
                    <td>
                      <span
                        className={`badge ${noShowsByParticipant[r.participant_id] >= 2
                            ? 'badge-danger'
                            : 'badge-warning'
                          }`}
                      >
                        {noShowsByParticipant[r.participant_id] || 1}
                      </span>
                    </td>
                    <td>{r.events?.name ?? '—'}</td>
                    <td>{r.events?.date ?? '—'}</td>
                    <td>{formatDateTime(r.marked_at)}</td>
                    <td>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => setDeleteTarget(r)}
                      >
                        <Icon name="delete" alt="Delete" sizePx={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <p>No no-show records</p>
          </div>
        )}
      </div>

      {deleteTarget && (
        <div className="confirm-modal-overlay">
          <div className="confirm-modal">
            <h3>Delete no-show?</h3>
            <p>
              Remove the no-show record for{' '}
              <strong>{deleteTarget.participants?.name ?? 'this participant'}</strong>?
            </p>
            <div className="confirm-actions">
              <button
                className="btn btn-secondary"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={handleDeleteNoShow}
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default NoShows;
