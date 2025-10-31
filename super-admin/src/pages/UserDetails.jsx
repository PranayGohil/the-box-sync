import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { Modal, Button, Form } from "react-bootstrap";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import { forwardRef } from "react";
import { FaRegCalendarAlt } from "react-icons/fa";

const UserDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  const [user, setUser] = useState(null);
  const [subscriptions, setSubscriptions] = useState([]);
  const [selectedSubs, setSelectedSubs] = useState([]);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [selectedSub4unblock, setselectedSub4unblock] = useState(null);
  const [selectedSubName4unblock, setselectedSubName4unblock] = useState(null);
  const [showUnblockModal, setShowUnblockModal] = useState(false);
  const [showExpandModal, setShowExpandModal] = useState(false);
  const [newEndDate, setNewEndDate] = useState(null);

  const [queries, setQueries] = useState([]);

  const fetchUserData = async () => {
    try {
      setLoading(true);

      // Fetch user and subscriptions
      const response = await axios.get(
        `${
          import.meta.env.VITE_APP_API_URL
        }/api/subscription/get/${id}`,
        { withCredentials: true }
      );

      if (response.data === "Null") {
        navigate("/login");
        return;
      }

      setUser(response.data.user);
      setSubscriptions(response.data.subscriptions);

      // Fetch customer queries
      const queriesRes = await axios.get(
        `${
          import.meta.env.VITE_APP_API_URL
        }/api/customerquery/query-user-id/${id}`,
        { withCredentials: true }
      );
      setQueries(queriesRes.data);
      console.log("Aueries : ", queriesRes.data);
    } catch (error) {
      console.error("Failed to fetch user details or queries:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, [id]);

  const toggleSelectSub = (subId) => {
    setSelectedSubs((prev) =>
      prev.includes(subId)
        ? prev.filter((id) => id !== subId)
        : [...prev, subId]
    );
  };

  const confirmBlockPlans = async () => {
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_APP_API_URL}/api/subscription/block`,
        { subscriptionIds: selectedSubs },
        { withCredentials: true }
      );
      if (response.data === "Null") {
        navigate("/login");
      }
      setShowBlockModal(false);
      setSelectedSubs([]);
      fetchUserData();
    } catch (error) {
      console.error("Error pausing plans:", error);
    }
  };

  const confirmUnblockPlans = async () => {
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_APP_API_URL}/api/subscription/unblock`,
        { subscriptionId: selectedSub4unblock },
        { withCredentials: true }
      );
      if (response.data === "Null") {
        navigate("/login");
      }
      setShowUnblockModal(false);
      setselectedSub4unblock(null);
      setselectedSubName4unblock(null);
      fetchUserData();
    } catch (error) {
      console.error("Error resuming plans:", error);
    }
  };

  const confirmExpandPlans = async () => {
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_APP_API_URL}/api/subscription/expand`,
        {
          subscriptionIds: selectedSubs,
          newEndDate: newEndDate?.toISOString().split("T")[0], // format: YYYY-MM-DD
        },
        { withCredentials: true }
      );
      if (response.data === "Null") {
        navigate("/login");
      }
      setShowExpandModal(false);
      setSelectedSubs([]);
      setNewEndDate("");
      fetchUserData();
    } catch (error) {
      console.error("Error expanding plans:", error);
    }
  };

  const CustomDateInput = forwardRef(({ value, onClick }, ref) => (
    <div className="input-group">
      <input
        type="text"
        className="form-control"
        value={value}
        onClick={onClick}
        ref={ref}
        readOnly
        placeholder="Select a date"
      />
      <span
        className="input-group-text"
        onClick={onClick}
        style={{ cursor: "pointer" }}
      >
        <FaRegCalendarAlt />
      </span>
    </div>
  ));

  const handleCompleteQuery = async (queryId) => {
    try {
      await axios.post(
        `${import.meta.env.VITE_APP_API_URL}/api/customerquery/complete-query`,
        { queryId },
        { withCredentials: true }
      );
      alert("Marked as completed.");
      fetchUserData(); // refresh queries
    } catch (err) {
      alert("Failed to mark as completed.");
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="d-flex justify-content-center align-items-center min-vh-100 min-vw-100">
      <div className="container">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="mb-0">User Details</h2>
          <button
            className="btn btn-outline-secondary"
            onClick={() => navigate(-1)}
          >
            ← Back
          </button>
        </div>

        {/* User Card */}
        <div className="card shadow-sm mb-5">
          <div className="card-header bg-primary text-white">
            <h5 className="mb-0">{user?.name}</h5>
          </div>
          <div className="card-body">
            <p>
              <strong>Email:</strong> {user?.email}
            </p>
            <p>
              <strong>Mobile:</strong> {user?.mobile}
            </p>
            <p>
              <strong>Restaurant Code:</strong> {user?.restaurant_code}
            </p>
            <p>
              <strong>Location:</strong> {user?.city}, {user?.state},{" "}
              {user?.country}
            </p>
            <p>
              <strong>Address:</strong> {user?.address}
            </p>
            <p>
              <strong>Pincode:</strong> {user?.pincode}
            </p>
            <p>
              <strong>Registered On:</strong>{" "}
              {new Date(user?.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Subscriptions Table */}
        <div className="card">
          <div className="card-header d-flex justify-content-between align-items-center">
            <h5 className="mb-0">Subscriptions</h5>
            <div>
              <button
                className="btn btn-warning btn-sm me-2"
                disabled={!selectedSubs.length}
                onClick={() => setShowBlockModal(true)}
              >
                Block Plans
              </button>
              <button
                className="btn btn-info btn-sm"
                disabled={!selectedSubs.length}
                onClick={() => setShowExpandModal(true)}
              >
                Expand Plans
              </button>
            </div>
          </div>
          <div className="table-responsive">
            <table className="table table-bordered table-hover">
              <thead className="table-light">
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedSubs(subscriptions.map((s) => s._id));
                        } else {
                          setSelectedSubs([]);
                        }
                      }}
                      checked={selectedSubs?.length === subscriptions?.length}
                    />
                  </th>
                  <th>Plan</th>
                  <th>Price</th>
                  <th>Start</th>
                  <th>End</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {subscriptions?.map((sub) => (
                  <tr key={sub._id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedSubs.includes(sub._id)}
                        onChange={() => toggleSelectSub(sub._id)}
                      />
                    </td>
                    <td>{sub.plan_name}</td>
                    <td>{sub.plan_price}</td>
                    <td>{new Date(sub.start_date).toLocaleDateString()}</td>
                    <td>{new Date(sub.end_date).toLocaleDateString()}</td>
                    <td>
                      {sub.status === "active" && (
                        <span className="badge bg-success">Active</span>
                      )}
                      {sub.status === "inactive" && (
                        <span className="badge bg-warning">Inactive</span>
                      )}
                      {sub.status === "blocked" && (
                        <>
                          <span className="badge bg-danger">Blocked</span>
                          <button
                            className="btn btn-primary btn-sm ms-2"
                            onClick={() => {
                              setselectedSub4unblock(sub._id);
                              setselectedSubName4unblock(sub.plan_name);
                              setShowUnblockModal(true);
                            }}
                          >
                            Unblock
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Customer Queries Section */}
        <div className="card mt-4">
          <div className="card-header">
            <h5 className="mb-0">Customer Queries</h5>
          </div>
          <div className="card-body">
            {queries.length === 0 ? (
              <p>No queries found.</p>
            ) : (
              <table className="table table-bordered">
                <thead>
                  <tr>
                    <th>Message</th>
                    <th>Purpose</th>
                    <th>Created</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {queries.map((q) => (
                    <tr key={q._id}>
                      <td>{q.message}</td>
                      <td>{q.purpose}</td>
                      <td>{new Date(q.created_at).toLocaleString()}</td>
                      <td>
                        {q.completed_at ? (
                          <span className="badge bg-success">Completed</span>
                        ) : (
                          <span className="badge bg-warning">Pending</span>
                        )}
                      </td>
                      <td>
                        {/* <button
                          className="btn btn-sm btn-outline-primary me-2"
                          onClick={() => handleSendEmail(q._id)}
                        >
                          Send Email
                        </button> */}
                        {!q.completed_at && (
                          <button
                            className="btn btn-sm btn-outline-success"
                            onClick={() => handleCompleteQuery(q._id)}
                          >
                            Mark Completed
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Block Modal */}
        <Modal show={showBlockModal} onHide={() => setShowBlockModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Block Subscriptions</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            Are you sure you want to block {selectedSubs.length} plan(s)?
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() => setShowBlockModal(false)}
            >
              Cancel
            </Button>
            <Button variant="warning" onClick={confirmBlockPlans}>
              Confirm Block
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Unblock Modal */}
        <Modal
          show={showUnblockModal}
          onHide={() => setShowUnblockModal(false)}
        >
          <Modal.Header closeButton>
            <Modal.Title>Unblock Subscriptions</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            Are you sure you want to unblock {selectedSubName4unblock} plan(s)?
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() => setShowUnblockModal(false)}
            >
              Cancel
            </Button>
            <Button variant="info" onClick={confirmUnblockPlans}>
              Confirm Unblock
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Expand Modal */}
        <Modal show={showExpandModal} onHide={() => setShowExpandModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Expand Subscriptions</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form.Group>
              <Form.Label style={{ marginRight: "10px" }}>
                Select New End Date :{" "}
              </Form.Label>
              <DatePicker
                selected={newEndDate}
                onChange={(date) => setNewEndDate(date)}
                minDate={new Date()}
                dateFormat="yyyy-MM-dd"
                showMonthDropdown
                showYearDropdown
                dropdownMode="select"
                customInput={<CustomDateInput />}
              />
            </Form.Group>

            <div className="mt-3">
              <span className="me-2 fw-bold">Quick Add:</span>
              <Button
                variant="outline-secondary"
                size="sm"
                className="me-2"
                onClick={
                  () => setNewEndDate(new Date(Date.now() + 86400000)) // +1 day
                }
              >
                +1 Day
              </Button>
              <Button
                variant="outline-secondary"
                size="sm"
                className="me-2"
                onClick={
                  () => setNewEndDate(new Date(Date.now() + 7 * 86400000)) // +1 week
                }
              >
                +1 Week
              </Button>
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={() => {
                  const today = new Date();
                  const nextMonth = new Date(
                    today.setMonth(today.getMonth() + 1)
                  );
                  setNewEndDate(nextMonth);
                }}
              >
                +1 Month
              </Button>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() => setShowExpandModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="info"
              onClick={confirmExpandPlans}
              disabled={!newEndDate}
            >
              Confirm Expand
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    </div>
  );
};

export default UserDetails;
