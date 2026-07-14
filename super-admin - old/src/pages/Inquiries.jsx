import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaInbox, FaFilter } from "react-icons/fa";

const Inquiries = () => {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("All");

  const fetchInquiries = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${import.meta.env.VITE_APP_API_URL}/api/inquiry/get-all`,
        { headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          } }
      );
      setInquiries(response.data || []);
    } catch (error) {
      console.error("Failed to fetch inquiries:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, newStatus) => {
    try {
      await axios.put(
        `${import.meta.env.VITE_APP_API_URL}/api/inquiry/update-status/${id}`,
        { status: newStatus },
        { headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          } }
      );
      fetchInquiries();
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  };

  useEffect(() => {
    fetchInquiries();
  }, []);

  const filteredInquiries = inquiries.filter(inq => 
    filterStatus === "All" ? true : inq.status === filterStatus
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
      <div className="mb-4 d-flex justify-content-between align-items-end">
        <div>
          <h2 className="fw-bold text-primary">Inquiries</h2>
          <p className="text-muted">Manage contact requests and business inquiries.</p>
        </div>
        <div className="d-flex gap-3 align-items-center glass-card px-3 py-2">
          <FaFilter style={{ color: "var(--text-muted)" }} />
          <select 
            className="form-select border-0 bg-transparent fw-600" 
            style={{ width: "150px", cursor: "pointer" }}
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="All">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Resolved">Resolved</option>
            <option value="Closed">Closed</option>
          </select>
        </div>
      </div>

      <div className="glass-card p-4">
        <div className="table-responsive">
          <table className="table-modern">
            <thead>
              <tr>
                <th>Sender</th>
                <th>Restaurant / City</th>
                <th>Inquiry Details</th>
                <th>Date</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredInquiries.map((inq) => (
                <tr key={inq._id}>
                  <td>
                    <div className="fw-bold">{inq.name}</div>
                    <div className="text-muted small">{inq.email}</div>
                    <div className="text-muted small">{inq.phone}</div>
                  </td>
                  <td>
                    <div className="fw-bold">{inq.restaurant_name}</div>
                    <div className="text-muted small">{inq.city}</div>
                  </td>
                  <td>
                    <div className="badge bg-light text-primary mb-1">{inq.purpose}</div>
                    <div className="small text-wrap" style={{ maxWidth: "300px" }}>{inq.message}</div>
                  </td>
                  <td>{new Date(inq.date).toLocaleDateString('en-IN')}</td>
                  <td>
                    <span className={`badge-modern ${
                      inq.status === "Pending" ? "badge-blocked" : 
                      inq.status === "Resolved" ? "badge-active" : "badge-expired"
                    }`}>
                      {inq.status}
                    </span>
                  </td>
                  <td>
                    <select
                      className="form-select form-select-sm"
                      style={{ borderRadius: "8px" }}
                      value={inq.status}
                      onChange={(e) => updateStatus(inq._id, e.target.value)}
                    >
                      <option value="Pending">Pending</option>
                      <option value="Resolved">Resolved</option>
                      <option value="Closed">Closed</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredInquiries.length === 0 && (
            <div className="text-center py-5">
              <FaInbox size={48} className="text-muted mb-3" style={{ opacity: 0.3 }} />
              <p className="text-muted">No inquiries found for this status.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Inquiries;
