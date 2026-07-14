import React, { useEffect, useState } from "react";
import axios from "axios";
import { 
  FaSignInAlt, 
  FaUserSecret, 
  FaBan, 
  FaUnlock, 
  FaExpandArrowsAlt, 
  FaUserPlus, 
  FaTrashAlt,
  FaRedo
} from "react-icons/fa";

const ActivityTimeline = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${import.meta.env.VITE_APP_API_URL}/api/superadmin/audit-logs`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      setLogs(res.data.data);
    } catch (err) {
      console.error("Failed to fetch logs", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const getActionIcon = (action) => {
    switch (action) {
      case "LOGIN": return <FaSignInAlt className="text-primary" />;
      case "IMPERSONATE": return <FaUserSecret className="text-info" />;
      case "BLOCK_SUBSCRIPTIONS": return <FaBan className="text-danger" />;
      case "UNBLOCK_SUBSCRIPTION": return <FaUnlock className="text-success" />;
      case "EXPAND_SUBSCRIPTIONS": return <FaExpandArrowsAlt className="text-warning" />;
      case "RENEW_SUBSCRIPTION": return <FaRedo className="text-primary" />;
      case "CREATE_ADMIN": return <FaUserPlus className="text-success" />;
      case "DELETE_ADMIN": return <FaTrashAlt className="text-danger" />;
      default: return <FaHistory className="text-secondary" />;
    }
  };

  if (loading) return (
    <div className="d-flex justify-content-center align-items-center" style={{ height: "60vh" }}>
      <div className="spinner-border text-primary" role="status"></div>
    </div>
  );

  return (
    <div>
      <div className="mb-4 d-flex justify-content-between align-items-center">
        <div>
          <h2 className="fw-bold text-primary">Activity Timeline</h2>
          <p className="text-muted">Real-time audit logs of all administrative actions.</p>
        </div>
        <button className="btn btn-outline-primary btn-sm rounded-pill px-3" onClick={fetchLogs}>
          <FaRedo className="me-2" /> Refresh
        </button>
      </div>

      <div className="glass-card p-4">
        {logs.length === 0 ? (
          <div className="text-center py-5 text-muted">No activity recorded yet.</div>
        ) : (
          <div className="timeline-container" style={{ position: "relative", paddingLeft: "40px" }}>
            {/* The vertical line */}
            <div style={{
              position: "absolute",
              left: "19px",
              top: "0",
              bottom: "0",
              width: "2px",
              background: "var(--border)",
              zIndex: 1
            }}></div>

            {logs.map((log, index) => (
              <div key={log._id} className="timeline-item mb-5" style={{ position: "relative" }}>
                {/* Icon Circle */}
                <div style={{
                  position: "absolute",
                  left: "-40px",
                  top: "0",
                  width: "40px",
                  height: "40px",
                  background: "white",
                  border: "2px solid var(--border)",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 2,
                  boxShadow: "0 2px 4px rgba(0,0,0,0.05)"
                }}>
                  {getActionIcon(log.action)}
                </div>

                <div className="timeline-content ms-2">
                  <div className="d-flex justify-content-between align-items-start mb-1">
                    <h6 className="fw-bold mb-0">
                      {log.adminName} <span className="text-muted fw-normal mx-2">performed</span> 
                      <span className="text-dark">{log.action.replace("_", " ")}</span>
                    </h6>
                    <small className="text-muted fw-500">
                      {new Date(log.timestamp).toLocaleString('en-IN', { 
                        dateStyle: 'medium', 
                        timeStyle: 'short' 
                      })}
                    </small>
                  </div>

                  <div className="p-3 bg-light rounded-3 small" style={{ border: "1px solid var(--border)" }}>
                    {log.targetId && (
                      <div className="mb-1">
                        <strong className="text-muted">Target ID:</strong> <code>{log.targetId}</code>
                      </div>
                    )}
                    {Object.keys(log.details || {}).length > 0 && (
                      <div>
                        <strong className="text-muted">Details:</strong>
                        <ul className="mb-0 mt-1 list-unstyled">
                          {Object.entries(log.details).map(([key, val]) => (
                            <li key={key} className="text-capitalize">
                              <span className="opacity-75">{key.replace("_", " ")}:</span> <span className="fw-600">{val}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityTimeline;
