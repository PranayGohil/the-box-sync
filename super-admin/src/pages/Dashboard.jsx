import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaUsers, FaCheckCircle, FaExclamationCircle, FaSearch } from "react-icons/fa";

const Dashboard = () => {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${import.meta.env.VITE_APP_API_URL}/api/subscription/get-all-subs`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          }
        }
      );
      setUsers(response.data.data || []);
    } catch (error) {
      if (error.response?.status === 401) {
        navigate("/login");
      }
      console.error("Failed to fetch users", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredUsers = users.filter(user => 
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.restaurant_code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalActive = users.reduce((acc, user) => 
    acc + user.subscriptions.filter(s => s.status === "active").length, 0
  );
  
  const totalExpired = users.reduce((acc, user) => 
    acc + user.subscriptions.filter(s => s.status === "expired").length, 0
  );

  if (loading)
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: "60vh" }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );

  return (
    <div>
      <div className="mb-4">
        <h2 className="fw-bold text-primary">Overview</h2>
        <p className="text-muted">Monitor system performance and user subscriptions.</p>
      </div>

      <div className="dashboard-grid">
        <div className="stat-card glass-card">
          <div className="d-flex justify-content-between align-items-start">
            <div>
              <div className="label">Total Restaurants</div>
              <div className="value">{users.length}</div>
            </div>
            <div className="icon" style={{ color: "var(--accent)", background: "rgba(59, 130, 246, 0.1)", padding: "12px", borderRadius: "12px" }}>
              <FaUsers size={24} />
            </div>
          </div>
        </div>
        <div className="stat-card glass-card">
          <div className="d-flex justify-content-between align-items-start">
            <div>
              <div className="label">Active Subscriptions</div>
              <div className="value" style={{ color: "var(--success)" }}>{totalActive}</div>
            </div>
            <div className="icon" style={{ color: "var(--success)", background: "rgba(16, 185, 129, 0.1)", padding: "12px", borderRadius: "12px" }}>
              <FaCheckCircle size={24} />
            </div>
          </div>
        </div>
        <div className="stat-card glass-card">
          <div className="d-flex justify-content-between align-items-start">
            <div>
              <div className="label">Expired Plans</div>
              <div className="value" style={{ color: "var(--danger)" }}>{totalExpired}</div>
            </div>
            <div className="icon" style={{ color: "var(--danger)", background: "rgba(239, 68, 68, 0.1)", padding: "12px", borderRadius: "12px" }}>
              <FaExclamationCircle size={24} />
            </div>
          </div>
        </div>
      </div>

      <div className="glass-card p-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h4 className="fw-bold mb-0">Restaurant Directory</h4>
          <div className="position-relative">
            <FaSearch className="position-absolute" style={{ left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
            <input 
              type="text" 
              className="form-control" 
              placeholder="Search by name, email or code..." 
              style={{ paddingLeft: "36px", width: "300px", borderRadius: "10px", border: "1px solid var(--border)" }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="table-responsive">
          <table className="table-modern">
            <thead>
              <tr>
                <th>Restaurant Details</th>
                <th>Code</th>
                <th>Contact</th>
                <th>Subscriptions</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => {
                const active = user.subscriptions.filter(sub => sub.status === "active").length;
                const expired = user.subscriptions.filter(sub => sub.status === "expired").length;

                return (
                  <tr key={user._id}>
                    <td>
                      <div className="fw-bold">{user.name}</div>
                      <div className="text-muted small">{user.email}</div>
                    </td>
                    <td><code className="text-primary fw-bold">{user.restaurant_code}</code></td>
                    <td>{user.mobile}</td>
                    <td>
                      <span className="badge bg-light text-dark border">{user.subscriptions.length} Total</span>
                    </td>
                    <td>
                      <div className="d-flex gap-2">
                        {active > 0 && <span className="badge-modern badge-active">{active} Active</span>}
                        {expired > 0 && <span className="badge-modern badge-expired">{expired} Expired</span>}
                        {active === 0 && expired === 0 && <span className="text-muted small">No Plans</span>}
                      </div>
                    </td>
                    <td>
                      <button
                        className="btn-modern btn-modern-primary btn-sm"
                        onClick={() => navigate(`/userdetails/${user._id}`)}
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredUsers.length === 0 && (
            <div className="text-center py-5">
              <p className="text-muted">No restaurants matching your search.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
