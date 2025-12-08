import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Dashboard = () => {
  const [users, setUsers] = useState([]);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${import.meta.env.VITE_APP_API_URL
        }/api/subscription/get-all-subs`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          }
        }
      );
      if (response.data === "Null") {
        navigate("/login");
      }
      setUsers(response.data.data);
    } catch (error) {
      console.error("Failed to fetch users", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading)
    return (
      <div
        className="d-flex justify-content-center align-items-center mt-5"
        style={{ height: "100vh" }}
      >
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );

  return (
    <div className="d-flex justify-content-center min-vh-100 min-vw-100">
      <div className="container">
        <div className="text-center mb-5">
          <h2 className="fw-bold">All User Subscriptions</h2>
          <p className="text-muted">
            Monitor subscription status for each user.
          </p>
        </div>

        <div className="card shadow-sm">
          <div className="card-body p-4">
            <div className="table-responsive">
              <table className="table table-bordered table-hover align-middle text-center">
                <thead className="table-dark">
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Restaurant Code</th>
                    <th>Mobile</th>
                    <th>Total Subscriptions</th>
                    <th className="text-success">Active</th>
                    <th className="text-danger">Expired</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => {
                    const active = user.subscriptions.filter(
                      (sub) => sub.status === "active"
                    ).length;
                    const expired = user.subscriptions.filter(
                      (sub) => sub.status === "expired"
                    ).length;

                    return (
                      <tr key={user._id}>
                        <td>{user.name}</td>
                        <td>{user.email}</td>
                        <td>{user.restaurant_code}</td>
                        <td>{user.mobile}</td>
                        <td>{user.subscriptions.length}</td>
                        <td className="fw-bold text-success">{active}</td>
                        <td className="fw-bold text-danger">{expired}</td>
                        <td>
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => navigate(`/userdetails/${user._id}`)}
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {users.length === 0 && (
                <div className="text-center p-3">
                  No user subscriptions found.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
