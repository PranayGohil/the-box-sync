import React, { useEffect, useState } from "react";
import axios from "axios";
import { Row, Col, Card, Spinner, Form, Table, Badge, Button, Modal } from "react-bootstrap";
import { useHistory } from "react-router-dom";
/* eslint-disable import/no-extraneous-dependencies */
import { jwtDecode } from "jwt-decode";
/* eslint-enable import/no-extraneous-dependencies */
import HtmlHead from "components/html-head/HtmlHead";
import BreadcrumbList from "components/breadcrumb-list/BreadcrumbList";
import CsLineIcons from "cs-line-icons/CsLineIcons";
import { toast } from "react-toastify";
import { DEFAULT_PATHS } from "config.js";

const AdminManagement = () => {
  const title = "Admin Management";
  const description = "Manage your super admin team and their roles.";
  const breadcrumbs = [
    { to: "", text: "Home" },
    { to: "admins", text: "Admin Management" },
  ];

  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({ username: "", email: "", password: "", role: "Staff" });
  const [currentUser, setCurrentUser] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const history = useHistory();

  const appRoot = DEFAULT_PATHS.APP.endsWith("/") ? DEFAULT_PATHS.APP.slice(1, DEFAULT_PATHS.APP.length) : DEFAULT_PATHS.APP;

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/superadmin/list`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      setAdmins(res.data.data || []);
    } catch (err) {
      console.error("Failed to fetch admins", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setCurrentUser(decoded);
      } catch (err) {
        console.error("Invalid token");
      }
    }
    fetchAdmins();
  }, []);

  const handleAddAdmin = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      await axios.post(`${process.env.REACT_APP_API_URL}/api/superadmin/create`, formData, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      setShowAddModal(false);
      setFormData({ username: "", email: "", password: "", role: "Staff" });
      fetchAdmins();
      toast.success("Admin created successfully!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create admin");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAdmin = async (id) => {
    if (!window.confirm("Are you sure you want to remove this admin?")) return;
    try {
      await axios.delete(`${process.env.REACT_APP_API_URL}/api/superadmin/delete/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      fetchAdmins();
      toast.success("Admin deleted successfully");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete admin");
    }
  };

  if (currentUser?.adminRole !== "Owner") {
    return (
      <div className="d-flex flex-column justify-content-center align-items-center" style={{ height: "60vh" }}>
        <CsLineIcons icon="shield-off" size="48" className="text-danger mb-3" />
        <h3 className="text-danger fw-bold">Access Denied</h3>
        <p className="text-muted">Only the platform Owner can manage other admins.</p>
      </div>
    );
  }

  const uniformBadgeStyle = { width: "100px", height: "32px", display: "flex", justifyContent: "center", alignItems: "center", margin: 0, borderRadius: "50rem" };

  return (
    <>
      <HtmlHead title={title} description={description} />
      <div className="container-fluid ps-lg-4 pe-lg-5">
        <div className="page-title-container mb-4 mt-5 mt-lg-0">
          <Row className="g-0 align-items-center">
            <Col xs="auto" className="me-auto">
              <h1 className="mb-0 pb-0 display-4 fw-bold" style={{ color: "#23b3f4" }}>{title}</h1>
              <BreadcrumbList items={breadcrumbs} />
            </Col>
            <Col xs="auto">
              <Button variant="primary" className="btn-icon btn-icon-start rounded-pill shadow-sm" onClick={() => setShowAddModal(true)}>
                <CsLineIcons icon="plus" size="18" /> <span>Invite New Admin</span>
              </Button>
            </Col>
          </Row>
        </div>

        <Card className="mb-5 shadow-sm border-0">
          <Card.Body className="p-4">
            {loading && admins.length === 0 ? (
              <div className="text-center py-5">
                <Spinner animation="border" style={{ color: "#23b3f4" }} />
              </div>
            ) : (
              <Table responsive className="react-table align-middle">
                <thead>
                  <tr>
                    <th>Admin User</th>
                    <th>Email Address</th>
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
                          <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center shadow-sm" style={{ width: "40px", height: "40px" }}>
                            {admin.username ? admin.username.charAt(0).toUpperCase() : "A"}
                          </div>
                          <span className="fw-bold text-dark">{admin.username}</span>
                        </div>
                      </td>
                      <td>
                        <div className="text-muted fw-bold">{admin.email}</div>
                      </td>
                      <td>
                        <Badge 
                          bg={admin.role === "Owner" ? "primary" : "info"} 
                          className="fw-bold text-uppercase shadow-sm" 
                          style={uniformBadgeStyle}
                        >
                          {admin.role}
                        </Badge>
                      </td>
                      <td>
                        <div className="text-muted small fw-bold">
                          {new Date(admin.createdAt).toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                      </td>
                      <td>
                        <div className="d-flex gap-3 align-items-center">
                          <Button variant="link" className="p-0 text-primary" title="View Full Timeline" onClick={() => history.push(`${appRoot}/admins/${admin._id}/timeline`)}>
                            <CsLineIcons icon="clock" size="20" />
                          </Button>
                          {admin._id !== currentUser._id && (
                            <Button variant="link" className="p-0 text-danger" title="Delete Admin" onClick={() => handleDeleteAdmin(admin._id)}>
                              <CsLineIcons icon="trash" size="20" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Card.Body>
        </Card>

        {/* Add Admin Modal */}
        <Modal show={showAddModal} onHide={() => setShowAddModal(false)} centered>
          <Modal.Header closeButton className="border-bottom-0 pb-0">
            <Modal.Title className="fw-bold fs-4" style={{ color: "#23b3f4" }}>Invite New Admin</Modal.Title>
          </Modal.Header>
          <Modal.Body className="pt-3">
            <p className="text-muted small mb-4">Fill out the details below to create a new administrative account.</p>
            <Form onSubmit={handleAddAdmin}>
              <Form.Group className="mb-4">
                <Form.Label className="fw-bold text-muted small">Username</Form.Label>
                <Form.Control 
                  type="text" 
                  placeholder="e.g. john_admin" 
                  required 
                  className="py-2"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })} 
                />
              </Form.Group>
              <Form.Group className="mb-4">
                <Form.Label className="fw-bold text-muted small">Email Address</Form.Label>
                <Form.Control 
                  type="email" 
                  placeholder="admin@example.com" 
                  required 
                  className="py-2"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })} 
                />
              </Form.Group>
              <Form.Group className="mb-4">
                <Form.Label className="fw-bold text-muted small">Initial Password</Form.Label>
                <Form.Control 
                  type="password" 
                  placeholder="••••••••" 
                  required 
                  className="py-2"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })} 
                />
              </Form.Group>
              <Form.Group className="mb-5">
                <Form.Label className="fw-bold text-muted small">Admin Role</Form.Label>
                <Form.Select 
                  className="py-2 cursor-pointer"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                >
                  <option value="Staff">Staff Admin (Restricted Access)</option>
                  <option value="Owner">Owner (Full Control)</option>
                </Form.Select>
              </Form.Group>
              <Button 
                variant="primary" 
                type="submit" 
                className="w-100 rounded-pill py-2 fw-bold d-flex justify-content-center align-items-center gap-2 shadow-sm"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Spinner animation="border" size="sm" />
                ) : (
                  <>
                    <CsLineIcons icon="check" size="16" />
                    <span>Create Admin Account</span>
                  </>
                )}
              </Button>
            </Form>
          </Modal.Body>
        </Modal>
      </div>
    </>
  );
};

export default AdminManagement;
