import { useState, useEffect } from "react";
import Icon from "../components/Icon";
import { blocklistAPI, participantsAPI } from "../api/client";
import "./Blocklist.css";

interface BlocklistEntry {
  id: string;
  participant_id: string;
  reason: string;
  created_at: string;
  participants?: { name: string; email: string };
}

export function Blocklist() {
  const [blocklistData, setBlocklistData] = useState<BlocklistEntry[]>([]);
  const [filteredData, setFilteredData] = useState<BlocklistEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [count, setCount] = useState(0);
  const [participants, setParticipants] = useState<{ id: string; name: string; email: string }[]>([]);
  const [selectedParticipantId, setSelectedParticipantId] = useState("");
  const [reason, setReason] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name?: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    document.title = "Blocklist - Eventz";
    loadBlocklist();
    loadParticipants();
  }, []);

  const loadParticipants = async () => {
    try {
      const res = await participantsAPI.getAll(true);
      const data = Array.isArray(res) ? res : res?.data ?? [];
      setParticipants(data);
    } catch (error) {
      console.error("Failed to load participants:", error);
      setParticipants([]);
    }
  };

  const loadBlocklist = async () => {
    setLoading(true);
    try {
      const response = await blocklistAPI.getAll();
      console.log('Blocklist response:', response);
      
      // Extract data array from response (handle both axios and direct response)
      let entries: BlocklistEntry[] = [];
      
      if (Array.isArray(response)) {
        entries = response;
      } else if (response && typeof response === 'object') {
        // If response has data property, use it; otherwise skip
        entries = response.data && Array.isArray(response.data) ? response.data : [];
      }
      
      setBlocklistData(entries);
      setFilteredData(entries);
      setCount(entries.length);
    } catch (error) {
      console.error("Failed to load blocklist:", error);
      setMessage({ type: "error", text: "Failed to load blocklist" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const lower = searchTerm.toLowerCase();
    const filtered = blocklistData.filter((entry) =>
      entry.participants?.name.toLowerCase().includes(lower) ||
      entry.participants?.email?.toLowerCase().includes(lower)
    );
    setFilteredData(filtered);
  }, [searchTerm, blocklistData]);

  const confirmRemove = async () => {
    if (!deleteTarget) return;

    setDeleting(true);
    try {
      await blocklistAPI.remove(deleteTarget.id);
      setMessage({ type: "success", text: "Removed from blocklist" });
      await loadBlocklist();
    } catch (error) {
      console.error("Failed to remove:", error);
      setMessage({ type: "error", text: "Failed to remove from blocklist" });
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  const handleAdd = async () => {
    if (!selectedParticipantId || !reason.trim()) {
      setMessage({ type: "error", text: "Select a participant and enter a reason" });
      return;
    }

    try {
      await blocklistAPI.add({ participant_id: selectedParticipantId, reason: reason.trim() });
      setMessage({ type: "success", text: "Added to blocklist" });
      setShowAddForm(false);
      setSelectedParticipantId("");
      setReason("");
      await loadBlocklist();
    } catch (error) {
      console.error("Failed to add to blocklist:", error);
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Failed to add" });
    }
  };

  const handleExport = () => {
    if (!filteredData.length) {
      setMessage({ type: "error", text: "No records to export" });
      return;
    }

    const headers = ["Name", "Email", "Reason", "Added"];
    const rows = filteredData.map((entry) => [
      entry.participants?.name || "Unknown",
      entry.participants?.email || "N/A",
      entry.reason,
      new Date(entry.created_at).toLocaleDateString(),
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `blocklist-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    setMessage({ type: "success", text: `Exported ${filteredData.length} record(s)` });
  };

  if (loading) {
    return (
      <div className="blocklist loading-container">
        <div className="spinner"></div>
        <p>Loading blocklist...</p>
      </div>
    );
  }

  return (
    <div className="blocklist">
      <div className="page-header">
        <h1>Blocklist Management</h1>
        <p>Manage blocklisted participants - search, add, edit, remove</p>
      </div>

      {message && <div className={`alert alert-${message.type}`}>{message.text}</div>}

      <div className="blocklist-stat">
        <div className="stat-card">
          <div className="stat-icon"><Icon name="lock" alt="Blocklist" sizePx={40} /></div>
          <div className="stat-content">
            <h3>TOTAL BLOCKLISTED</h3>
            <p className="stat-value">{count}</p>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="list-header">
          <div className="search-container">
            <input
              type="text"
              className="search-input"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="action-buttons">
            <button className="btn btn-secondary btn-sm" onClick={() => setShowAddForm(!showAddForm)}>
              <Icon name="add" alt="Add" size="sm" /> Add
            </button>
            <button className="btn btn-primary btn-sm" onClick={handleExport}>
              <Icon name="download" alt="Export" size="sm" /> Export
            </button>
          </div>
        </div>

        {showAddForm && (
          <div className="add-form-section">
            <h3>Add to Blocklist</h3>
            <div className="add-form-grid">
              <div className="form-group">
                <label htmlFor="blocklist-participant">Participant *</label>
                <select
                  id="blocklist-participant"
                  value={selectedParticipantId}
                  onChange={(e) => setSelectedParticipantId(e.target.value)}
                >
                  <option value="">-- Choose participant --</option>
                  {participants.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="blocklist-reason">Reason *</label>
                <textarea
                  id="blocklist-reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Enter reason"
                  rows={2}
                />
              </div>

              <div className="form-actions">
                <button className="btn btn-primary" onClick={handleAdd}>
                  <Icon name="save" alt="Save" size="sm" /> Save
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowAddForm(false);
                    setSelectedParticipantId("");
                    setReason("");
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {filteredData.length > 0 ? (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Reason</th>
                  <th>Added</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((entry) => (
                  <tr key={entry.id}>
                    <td>{entry.participants?.name || "Unknown"}</td>
                    <td>{entry.participants?.email || "N/A"}</td>
                    <td><span className="badge badge-warning">{entry.reason}</span></td>
                    <td>{new Date(entry.created_at).toLocaleDateString()}</td>
                    <td>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() =>
                          setDeleteTarget({
                            id: entry.participant_id,
                            name: entry.participants?.name,
                          })
                        }
                        title="Remove from blocklist"
                      >
                        <Icon name="delete" alt="Remove" size="sm" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <p>No blocklisted participants</p>
          </div>
        )}
      </div>

      {deleteTarget && (
        <div className="confirm-modal-overlay">
          <div className="confirm-modal">
            <h3>Remove from blocklist?</h3>
            <p>
              Remove{' '}
              <strong>{deleteTarget.name ?? 'this participant'}</strong> from the
              blocklist?
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
                onClick={confirmRemove}
                disabled={deleting}
              >
                {deleting ? "Removing..." : "Remove"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Blocklist;
