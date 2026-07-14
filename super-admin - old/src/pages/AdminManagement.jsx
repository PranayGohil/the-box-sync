import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Modal, Button, Form } from "react-bootstrap";
import { 
  FaUserPlus, 
  FaTrash, 
  FaUserShield, 
  FaUserTie, 
  FaHistory
} from "react-icons/fa";
import { jwtDecode } from "jwt-decode";

const AdminManagement = () => {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({ username: "", email: "", password: "", role: "Staff" });
  const [currentUser, setCurrentUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const decoded = jwtDecode(token);
      setCurrentUser(decoded);
    }
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${import.meta.env.VITE_APP_API_URL}/api/superadmin/list`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      setAdmins(res.data.data);
    } catch (err) {
      console.error("Failed to fetch admins", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAdmin = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${import.meta.env.VITE_APP_API_URL}/api/superadmin/create`, formData, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      setShowAddModal(false);
      setFormData({ username: "", email: "", password: "", role: "Staff" });
      fetchAdmins();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to create admin");
    }
  };

  const handleDeleteAdmin = async (id) => {
    if (!window.confirm("Are you sure you want to remove this admin?")) return;
    try {
      await axios.delete(`${import.meta.env.VITE_APP_API_URL}/api/superadmin/delete/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      fetchAdmins();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete admin");
    }
  };

  if (currentUser?.adminRole !== "Owner") {
    return (
      <div className="text-center py-5">
        <h3 className="text-danger">Access Denied</h3>
        <p>Only the platform Owner can manage other admins.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 d-flex justify-content-between align-items-center">
        <div>
          <h2 className="fw-bold text-primary">Admin Management</h2>
          <p className="text-muted">Manage your super admin team and their roles.</p>
        </div>
        <button className="btn-modern btn-modern-primary" onClick={() => setShowAddModal(true)}>
          <FaUserPlus /> Invite New Admin
        </button>
      </div>

      <div className="glass-card p-4">
        <div className="table-responsive">
          <table className="table-modern">
            <thead>
              <tr>
                <th>Admin User</th>
                <th>Email</th>
                <th>Role</th>
                <th>Joined Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {admins.map((admin) => (
                <tr key={admin._id}>
                  <td>
                    <div className="d-flex align-items-center gap-3">
                      <div className="bg-primary bg-opacity-10 text-primary p-2 rounded">
                        {admin.role === "Owner" ? <FaUserShield /> : <FaUserTie />}
                      </div>
                      <span className="fw-bold">{admin.username}</span>
                    </div>
                  </td>
                  <td>{admin.email}</td>
                  <td>
                    <span className={`badge-modern ${admin.role === "Owner" ? "badge-active" : "badge-expired"}`}>
                      {admin.role}
                    </span>
                  </td>
                  <td>{new Date(admin.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div className="d-flex gap-3 align-items-center">
                      <button 
                        className="btn btn-link text-primary p-0" 
                        title="View Full Timeline"
                        onClick={() => navigate(`/admins/${admin._id}/timeline`)}
                      >
                        <FaHistory />
                      </button>
                      {admin._id !== currentUser._id && (
                        <button 
                          className="btn btn-link text-danger p-0" 
                          title="Delete Admin"
                          onClick={() => handleDeleteAdmin(admin._id)}
                        >
                          <FaTrash />
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

      <Modal show={showAddModal} onHide={() => setShowAddModal(false)} centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold">Invite New Admin</Modal.Title>
        </Modal.Header>
        <Modal.Body className="py-4">
          <Form onSubmit={handleAddAdmin}>
            <Form.Group className="mb-3">
              <Form.Label className="small fw-600">Username</Form.Label>
              <Form.Control 
                type="text" 
                placeholder="e.g. jdoe_admin" 
                required 
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="small fw-600">Email Address</Form.Label>
              <Form.Control 
                type="email" 
                placeholder="admin@example.com" 
                required 
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="small fw-600">Initial Password</Form.Label>
              <Form.Control 
                type="password" 
                placeholder="••••••••" 
                required 
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </Form.Group>
            <Form.Group className="mb-4">
              <Form.Label className="small fw-600">Role</Form.Label>
              <Form.Select onChange={(e) => setFormData({ ...formData, role: e.target.value })}>
                <option value="Staff">Staff Admin (Restricted)</option>
                <option value="Owner">Owner (Full Control)</option>
              </Form.Select>
            </Form.Group>
            <Button variant="primary" type="submit" className="w-100 py-2 fw-bold">Create Admin Account</Button>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default AdminManagement;
