import { useState, useEffect } from "react";
import Icon from "../components/Icon";
import { blocklistAPI } from "../api/client";
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

  useEffect(() => {
    document.title = "Blocklist - TechNexus Community";
    loadBlocklist();
  }, []);

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
    const filtered = blocklistData.filter((entry) =>
      entry.participants?.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredData(filtered);
  }, [searchTerm, blocklistData]);

  const handleRemove = async (participantId: string) => {
    if (!confirm("Remove from blocklist?")) return;
    try {
      await fetch(`/api/blocklist/${participantId}`, { method: "DELETE" });
      setMessage({ type: "success", text: "Removed from blocklist" });
      await loadBlocklist();
    } catch (error) {
      console.error("Failed to remove:", error);
      setMessage({ type: "error", text: "Failed to remove from blocklist" });
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
          <input
            type="text"
            className="search-input"
            placeholder="Search by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button className="btn btn-secondary btn-sm" onClick={() => setShowAddForm(!showAddForm)}>
            <Icon name="add" alt="Add" size="sm" /> Add
          </button>
        </div>

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
                        onClick={() => handleRemove(entry.participant_id)}
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
    </div>
  );
}

export default Blocklist;
