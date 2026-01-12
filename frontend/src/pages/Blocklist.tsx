import { useState } from 'react';
import { Ban, Unlock } from 'lucide-react';
import { blocklistAPI, participantsAPI } from '../api/client';
import { useAsync } from '../utils/hooks';
import { formatDate } from '../utils/formatters';
import './Blocklist.css';

interface BlocklistEntry {
  id: string;
  participant_id: string;
  reason: string;
  created_at: string;
  participants?: {
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

export function Blocklist() {
  const [blocklistData, setBlocklistData] = useState<BlocklistEntry[]>([]);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [loading, setLoading] = useState(true);

  const { data: participants, refetch: refetchParticipants } = useAsync<Participant[]>(
    () => participantsAPI.getAll(true).then((res) => res.data),
    true
  );

  const { refetch: refetchBlocklist } = useAsync<BlocklistEntry[]>(
    async () => {
      setLoading(true);
      try {
        const res = await blocklistAPI.getAll();
        const data = (res.data || []) as BlocklistEntry[];
        setBlocklistData(data);
        return data;
      } finally {
        setLoading(false);
      }
    },
    true
  );

  const handleRemoveFromBlocklist = async (participantId: string) => {
    if (!confirm('Remove this participant from blocklist?')) return;

    try {
      await blocklistAPI.remove(participantId);
      setMessage({ type: 'success', text: 'Participant removed from blocklist' });
      refetchBlocklist();
      refetchParticipants();
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to remove from blocklist',
      });
    }
  };

  if (loading) {
    return (
      <div className="blocklist loading-container">
        <div className="spinner"></div>
        <p>Loading blocklist...</p>
      </div>
    );
  }

  const blocklistedCount = participants?.filter((p) => p.is_blocklisted).length || 0;

  return (
    <div className="blocklist">
      <div className="page-header">
        <h1>Blocklist Management</h1>
        <p>Manage blocklisted participants</p>
      </div>

      {message && (
        <div className={`alert alert-${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="blocklist-stat">
        <div className="stat-card stat-card-danger">
          <div className="stat-icon"><Ban size={40} /></div>
          <div className="stat-content">
            <h3>Blocklisted Participants</h3>
            <p className="stat-value">{blocklistedCount}</p>
          </div>
        </div>
      </div>

      <div className="card">
        {blocklistData && blocklistData.length > 0 ? (
          <>
            <h2>Blocklist Details</h2>
            <div className="blocklist-items">
              {blocklistData.map((entry) => (
                <div key={entry.id} className="blocklist-item card">
                  <div className="item-header">
                    <div>
                      <h3>{entry.participants?.name || 'Unknown'}</h3>
                      <p className="email">{entry.participants?.email}</p>
                    </div>
                    <span className="badge badge-danger"><Ban size={16} /> Blocked</span>
                  </div>

                  <div className="item-details">
                    <p>
                      <strong>Reason:</strong> {entry.reason}
                    </p>
                    <p>
                      <strong>Added:</strong> {formatDate(entry.created_at)}
                    </p>
                  </div>

                  <div className="item-actions">
                    <button
                      className="btn btn-success btn-sm"
                      onClick={() => handleRemoveFromBlocklist(entry.participant_id)}
                    >
                      <Unlock size={16} /> Unblock
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="empty-state">
            <p>No participants in blocklist</p>
          </div>
        )}
      </div>

      <div className="info-section card">
        <h2>Blocklist Information</h2>
        <ul className="info-list">
          <li>
            <strong>Auto-Blocking:</strong> Participants with 2 or more no-shows are automatically
            added to the blocklist.
          </li>
          <li>
            <strong>Prevention:</strong> Blocklisted participants cannot be marked as attendees in new events.
          </li>
          <li>
            <strong>Removal:</strong> You can manually unblock participants using the button
            above.
          </li>
        </ul>
      </div>
    </div>
  );
}
