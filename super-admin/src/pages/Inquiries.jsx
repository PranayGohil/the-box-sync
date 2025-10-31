import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaCheckCircle } from "react-icons/fa";

const Inquiries = () => {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchInquiries = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_APP_API_URL}/api/inquiry/get-all`,
        { withCredentials: true }
      );
      if (response.data === "Null") {
        navigate("/login");
      }
      setInquiries(response.data);
    } catch (error) {
      console.error("Failed to fetch inquiries:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, newStatus) => {
    try {
      const response = await axios.put(
        `${import.meta.env.VITE_APP_API_URL}/api/inquiry/update-status/${id}`,
        { status: newStatus },
        { withCredentials: true }
      );
      if (response.data === "Null") {
        navigate("/login");
      }
      fetchInquiries(); // Refresh data
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  };

  useEffect(() => {
    fetchInquiries();
  }, []);

  if (loading)
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ height: "100vh" }}
      >
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );

  return (
    <div className="d-flex justify-content-center min-vh-100 min-vw-100">
      <div className="container mt-5">
        <h2 className="text-center mb-4">Inquiries</h2>
        <div className="table-responsive">
          <table className="table table-striped table-bordered align-middle">
            <thead className="table-dark">
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>City</th>
                <th>Restaurant</th>
                <th>Purpose</th>
                <th>Message</th>
                <th>Date</th>
                <th>Status</th>
                <th>Update</th>
              </tr>
            </thead>
            <tbody>
              {inquiries.map((inq, index) => (
                <tr key={inq._id}>
                  <td>{index + 1}</td>
                  <td>{inq.name}</td>
                  <td>{inq.email}</td>
                  <td>{inq.phone}</td>
                  <td>{inq.city}</td>
                  <td>{inq.restaurant_name}</td>
                  <td>{inq.purpose}</td>
                  <td>{inq.message}</td>
                  <td>{new Date(inq.date).toLocaleDateString()}</td>
                  <td>
                    <span
                      className={`badge ${
                        inq.status === "Pending"
                          ? "bg-warning"
                          : inq.status === "Resolved"
                          ? "bg-success"
                          : "bg-secondary"
                      }`}
                    >
                      {inq.status}
                    </span>
                  </td>
                  <td>
                    <select
                      className="form-select"
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
              {inquiries.length === 0 && (
                <tr>
                  <td colSpan="10" className="text-center">
                    No inquiries found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Inquiries;
