import { useEffect, useState, forwardRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { Modal, Button, Form } from "react-bootstrap";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { 
  FaArrowLeft, 
  FaUser, 
  FaMapMarkerAlt, 
  FaCalendarAlt, 
  FaLock, 
  FaUnlock, 
  FaExpandArrowsAlt,
  FaCheckCircle,
  FaClock,
  FaEnvelope
} from "react-icons/fa";

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
      const response = await axios.get(
        `${import.meta.env.VITE_APP_API_URL}/api/subscription/get/${id}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );

      setUser(response.data.user);
      setSubscriptions(response.data.subscriptions);

      const queriesRes = await axios.get(
        `${import.meta.env.VITE_APP_API_URL}/api/customerquery/query-user-id/${id}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      setQueries(queriesRes.data || []);
    } catch (error) {
      if (error.response?.status === 401) navigate("/login");
      console.error("Failed to fetch user details:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, [id]);

  const toggleSelectSub = (subId) => {
    setSelectedSubs((prev) =>
      prev.includes(subId) ? prev.filter((id) => id !== subId) : [...prev, subId]
    );
  };

  const confirmBlockPlans = async () => {
    try {
      await axios.post(
        `${import.meta.env.VITE_APP_API_URL}/api/subscription/block`,
        { subscriptionIds: selectedSubs },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      setShowBlockModal(false);
      setSelectedSubs([]);
      fetchUserData();
    } catch (error) {
      console.error("Error blocking plans:", error);
    }
  };

  const confirmUnblockPlans = async () => {
    try {
      await axios.post(
        `${import.meta.env.VITE_APP_API_URL}/api/subscription/unblock`,
        { subscriptionId: selectedSub4unblock },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      setShowUnblockModal(false);
      setselectedSub4unblock(null);
      fetchUserData();
    } catch (error) {
      console.error("Error unblocking plans:", error);
    }
  };

  const confirmExpandPlans = async () => {
    try {
      await axios.post(
        `${import.meta.env.VITE_APP_API_URL}/api/subscription/expand`,
        {
          subscriptionIds: selectedSubs,
          newEndDate: newEndDate?.toISOString().split("T")[0],
        },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      setShowExpandModal(false);
      setSelectedSubs([]);
      setNewEndDate(null);
      fetchUserData();
    } catch (error) {
      console.error("Error expanding plans:", error);
    }
  };

  const handleImpersonate = async () => {
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_APP_API_URL}/api/superadmin/impersonate/${id}`,
        {},
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );

      if (response.data.token) {
        // Construct the Manager URL with the token
        // In production, this would be your manager domain.
        // Assuming Manager runs on port 3000 locally.
        const managerUrl = `${import.meta.env.VITE_APP_ADMIN_URL}/login?impersonate_token=${response.data.token}`;
        window.open(managerUrl, "_blank");
      }
    } catch (error) {
      console.error("Impersonation failed:", error);
      alert("Failed to impersonate user.");
    }
  };

  const handleCompleteQuery = async (queryId) => {
    try {
      await axios.post(
        `${import.meta.env.VITE_APP_API_URL}/api/customerquery/complete-query`,
        { queryId },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      fetchUserData();
    } catch (err) {
      alert("Failed to mark as completed.");
    }
  };

  const CustomDateInput = forwardRef(({ value, onClick }, ref) => (
    <div className="input-group" onClick={onClick} ref={ref} style={{ cursor: "pointer" }}>
      <input type="text" className="form-control" value={value} readOnly placeholder="Select a date" style={{ cursor: "pointer" }} />
      <span className="input-group-text"><FaCalendarAlt /></span>
    </div>
  ));

  if (loading) return (
    <div className="d-flex justify-content-center align-items-center" style={{ height: "60vh" }}>
      <div className="spinner-border text-primary" role="status"></div>
    </div>
  );

  return (
    <div className="pb-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <button className="btn btn-link text-muted p-0 text-decoration-none mb-2 d-flex align-items-center gap-2" onClick={() => navigate(-1)}>
            <FaArrowLeft size={12} /> Back to Directory
          </button>
          <h2 className="fw-bold mb-0">Restaurant Profile</h2>
        </div>
        <div className="d-flex gap-2">
          <button className="btn-modern btn-modern-primary" onClick={handleImpersonate}>
            <FaUser size={14} /> Login as Restaurant
          </button>
        </div>
      </div>

      <div className="row g-4">
        {/* User Info Card */}
        <div className="col-lg-4">
          <div className="glass-card p-4 h-100">
            <div className="text-center mb-4">
              <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center mx-auto mb-3" style={{ width: "80px", height: "80px", fontSize: "32px", fontWeight: 700 }}>
                {user?.name?.[0]}
              </div>
              <h4 className="fw-bold mb-1">{user?.name}</h4>
              <code className="text-primary fw-600 bg-primary bg-opacity-10 px-2 py-1 rounded">{user?.restaurant_code}</code>
            </div>

            <hr className="opacity-10" />

            <div className="d-flex flex-column gap-3 mt-4">
              <div className="d-flex align-items-center gap-3">
                <div className="text-muted"><FaEnvelope /></div>
                <div>
                  <div className="small text-muted">Email Address</div>
                  <div className="fw-500">{user?.email}</div>
                </div>
              </div>
              <div className="d-flex align-items-center gap-3">
                <div className="text-muted"><FaUser /></div>
                <div>
                  <div className="small text-muted">Mobile Number</div>
                  <div className="fw-500">{user?.mobile}</div>
                </div>
              </div>
              <div className="d-flex align-items-center gap-3">
                <div className="text-muted"><FaMapMarkerAlt /></div>
                <div>
                  <div className="small text-muted">Location</div>
                  <div className="fw-500">{user?.city}, {user?.state}</div>
                </div>
              </div>
              <div className="d-flex align-items-center gap-3">
                <div className="text-muted"><FaCalendarAlt /></div>
                <div>
                  <div className="small text-muted">Registered Since</div>
                  <div className="fw-500">{new Date(user?.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric', day: 'numeric' })}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Subscriptions Card */}
        <div className="col-lg-8">
          <div className="glass-card p-4 h-100">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h5 className="fw-bold mb-0">Active Subscriptions</h5>
              <div className="d-flex gap-2">
                <button className="btn btn-outline-warning btn-sm fw-600 rounded-pill" disabled={!selectedSubs.length} onClick={() => setShowBlockModal(true)}>
                  <FaLock size={12} className="me-1" /> Block Selected
                </button>
                <button className="btn btn-outline-info btn-sm fw-600 rounded-pill" disabled={!selectedSubs.length} onClick={() => setShowExpandModal(true)}>
                  <FaExpandArrowsAlt size={12} className="me-1" /> Extend
                </button>
              </div>
            </div>

            <div className="table-responsive">
              <table className="table-modern">
                <thead>
                  <tr>
                    <th>
                      <input type="checkbox" className="form-check-input" onChange={(e) => setSelectedSubs(e.target.checked ? subscriptions.map(s => s._id) : [])} checked={selectedSubs.length === subscriptions.length && subscriptions.length > 0} />
                    </th>
                    <th>Plan Name</th>
                    <th>Price</th>
                    <th>Valid Until</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {subscriptions?.map((sub) => (
                    <tr key={sub._id}>
                      <td>
                        <input type="checkbox" className="form-check-input" checked={selectedSubs.includes(sub._id)} onChange={() => toggleSelectSub(sub._id)} />
                      </td>
                      <td className="fw-bold">{sub.plan_name}</td>
                      <td>₹{sub.plan_price}</td>
                      <td>{new Date(sub.end_date).toLocaleDateString('en-IN')}</td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <span className={`badge-modern ${sub.status === "active" ? "badge-active" : sub.status === "blocked" ? "badge-expired" : "badge-blocked"}`}>
                            {sub.status}
                          </span>
                          {sub.status === "blocked" && (
                            <button className="btn btn-link btn-sm p-0 text-primary" onClick={() => { setselectedSub4unblock(sub._id); setselectedSubName4unblock(sub.plan_name); setShowUnblockModal(true); }}>
                              <FaUnlock size={12} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Customer Queries Card */}
        <div className="col-12">
          <div className="glass-card p-4">
            <h5 className="fw-bold mb-4">Support Inquiries</h5>
            {queries.length === 0 ? (
              <div className="text-center py-4 text-muted">No support queries found for this user.</div>
            ) : (
              <div className="table-responsive">
                <table className="table-modern">
                  <thead>
                    <tr>
                      <th>Inquiry Message</th>
                      <th>Category</th>
                      <th>Timestamp</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {queries.map((q) => (
                      <tr key={q._id}>
                        <td style={{ maxWidth: "400px" }}>{q.message}</td>
                        <td><span className="badge bg-light text-dark border">{q.purpose}</span></td>
                        <td className="small text-muted">{new Date(q.created_at).toLocaleString()}</td>
                        <td>
                          {q.completed_at ? (
                            <span className="badge-modern badge-active"><FaCheckCircle className="me-1" /> Resolved</span>
                          ) : (
                            <span className="badge-modern badge-blocked"><FaClock className="me-1" /> Pending</span>
                          )}
                        </td>
                        <td>
                          {!q.completed_at && (
                            <button className="btn btn-sm btn-outline-success rounded-pill fw-600" onClick={() => handleCompleteQuery(q._id)}>
                              Mark Resolved
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals remain functionally the same but with cleaner styling */}
      <Modal show={showBlockModal} onHide={() => setShowBlockModal(false)} centered>
        <Modal.Header closeButton className="border-0 pb-0"><Modal.Title className="fw-bold">Block Subscriptions</Modal.Title></Modal.Header>
        <Modal.Body className="py-4">Are you sure you want to block <strong>{selectedSubs.length}</strong> plan(s)? This will instantly restrict access for the restaurant.</Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <Button variant="light" className="fw-600" onClick={() => setShowBlockModal(false)}>Cancel</Button>
          <Button variant="danger" className="fw-600 px-4" onClick={confirmBlockPlans}>Block Now</Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showUnblockModal} onHide={() => setShowUnblockModal(false)} centered>
        <Modal.Header closeButton className="border-0 pb-0"><Modal.Title className="fw-bold">Restore Access</Modal.Title></Modal.Header>
        <Modal.Body className="py-4">Confirm unblocking <strong>{selectedSubName4unblock}</strong>? Access will be restored immediately.</Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <Button variant="light" className="fw-600" onClick={() => setShowUnblockModal(false)}>Cancel</Button>
          <Button variant="success" className="fw-600 px-4" onClick={confirmUnblockPlans}>Confirm Unblock</Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showExpandModal} onHide={() => setShowExpandModal(false)} centered>
        <Modal.Header closeButton className="border-0 pb-0"><Modal.Title className="fw-bold">Extend Plans</Modal.Title></Modal.Header>
        <Modal.Body className="py-4">
          <Form.Group className="mb-4">
            <Form.Label className="fw-600 small text-muted">Select New Expiry Date</Form.Label>
            <DatePicker selected={newEndDate} onChange={(date) => setNewEndDate(date)} minDate={new Date()} dateFormat="yyyy-MM-dd" customInput={<CustomDateInput />} />
          </Form.Group>
          <div className="d-flex gap-2 justify-content-center">
            <Button variant="outline-secondary" size="sm" className="rounded-pill px-3" onClick={() => setNewEndDate(new Date(Date.now() + 86400000))}>+1 Day</Button>
            <Button variant="outline-secondary" size="sm" className="rounded-pill px-3" onClick={() => setNewEndDate(new Date(Date.now() + 7 * 86400000))}>+1 Week</Button>
            <Button variant="outline-secondary" size="sm" className="rounded-pill px-3" onClick={() => { let d = new Date(); d.setMonth(d.getMonth() + 1); setNewEndDate(d); }}>+1 Month</Button>
          </div>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <Button variant="light" className="fw-600" onClick={() => setShowExpandModal(false)}>Cancel</Button>
          <Button variant="info" className="fw-600 px-4 text-white" onClick={confirmExpandPlans} disabled={!newEndDate}>Apply Extension</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default UserDetails;
