import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Form, Row, Col, Badge, Spinner } from 'react-bootstrap';
import { toast } from 'react-toastify';
import axios from 'axios';
import CsLineIcons from 'cs-line-icons/CsLineIcons';

export default function PayingEntitiesSettings() {
  const [entities, setEntities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState(null);

  const [formData, setFormData] = useState({
    company_name: '',
    bank_name: '',
    account_number: '',
    ifsc_code: '',
    branch_name: '',
    address: '',
    is_default: false
  });

  const authHeader = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  });

  const fetchEntities = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${process.env.REACT_APP_API}/paying-entity/all`, authHeader());
      if (res.data?.success) {
        setEntities(res.data.data || []);
      }
    } catch (err) {
      console.error("Error fetching paying entities:", err);
      toast.error("Failed to load paying company accounts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntities();
  }, []);

  const handleOpenAdd = () => {
    setEditId(null);
    setFormData({
      company_name: '',
      bank_name: '',
      account_number: '',
      ifsc_code: '',
      branch_name: '',
      address: '',
      is_default: entities.length === 0
    });
    setShowModal(true);
  };

  const handleOpenEdit = (item) => {
    setEditId(item._id);
    setFormData({
      company_name: item.company_name || '',
      bank_name: item.bank_name || '',
      account_number: item.account_number || '',
      ifsc_code: item.ifsc_code || '',
      branch_name: item.branch_name || '',
      address: item.address || '',
      is_default: !!item.is_default
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.company_name.trim()) {
      toast.error("Company name is required");
      return;
    }
    setSaving(true);
    try {
      if (editId) {
        const res = await axios.put(`${process.env.REACT_APP_API}/paying-entity/update/${editId}`, formData, authHeader());
        if (res.data?.success) {
          toast.success("Paying company updated successfully");
        }
      } else {
        const res = await axios.post(`${process.env.REACT_APP_API}/paying-entity/create`, formData, authHeader());
        if (res.data?.success) {
          toast.success("Paying company added successfully");
        }
      }
      setShowModal(false);
      fetchEntities();
    } catch (err) {
      console.error("Error saving paying entity:", err);
      toast.error(err.response?.data?.message || "Failed to save paying company");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this paying entity? Staff assigned to this entity will revert to unassigned.")) {
      return;
    }
    try {
      const res = await axios.delete(`${process.env.REACT_APP_API}/paying-entity/delete/${id}`, authHeader());
      if (res.data?.success) {
        toast.success("Paying company deleted");
        fetchEntities();
      }
    } catch (err) {
      console.error("Error deleting paying entity:", err);
      toast.error(err.response?.data?.message || "Failed to delete");
    }
  };

  return (
    <Card className="glass-card mb-4">
      <Card.Body className="p-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h5 className="fw-bold text-primary mb-1">Disbursing Companies & Paying Accounts</h5>
            <p className="text-muted small mb-0">
              Manage different company accounts used to credit employee salaries.
            </p>
          </div>
          <Button variant="outline-primary" className="rounded-pill shadow-sm" onClick={handleOpenAdd}>
            <CsLineIcons icon="plus" size="16" className="me-1" /> Add Paying Account
          </Button>
        </div>

        {loading ? (
          <div className="text-center my-4"><Spinner animation="border" size="sm" /></div>
        ) : entities.length === 0 ? (
          <div className="text-center text-muted my-4">
            No paying entities added yet. Add company accounts to disburse salaries from multiple entities.
          </div>
        ) : (
          <Table responsive hover className="align-middle">
            <thead>
              <tr>
                <th>Company Name</th>
                <th>Bank & Account Number</th>
                <th>IFSC / Branch</th>
                <th>Default</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {entities.map(item => (
                <tr key={item._id}>
                  <td className="fw-bold">{item.company_name}</td>
                  <td>
                    {item.bank_name ? (
                      <div>
                        <div>{item.bank_name}</div>
                        <small className="text-muted">A/C: {item.account_number || '-'}</small>
                      </div>
                    ) : (
                      <span className="text-muted">-</span>
                    )}
                  </td>
                  <td>
                    {item.ifsc_code || item.branch_name ? (
                      <div>
                        <div>{item.ifsc_code}</div>
                        <small className="text-muted">{item.branch_name}</small>
                      </div>
                    ) : (
                      <span className="text-muted">-</span>
                    )}
                  </td>
                  <td>
                    {item.is_default ? (
                      <Badge bg="success" className="rounded-pill">Default</Badge>
                    ) : (
                      <Badge bg="secondary" className="rounded-pill">Secondary</Badge>
                    )}
                  </td>
                  <td className="text-end">
                    <Button variant="outline-info" size="sm" className="me-2 rounded-circle btn-icon btn-icon-only" onClick={() => handleOpenEdit(item)}>
                      <CsLineIcons icon="edit" size="15" />
                    </Button>
                    <Button variant="outline-danger" size="sm" className="rounded-circle btn-icon btn-icon-only" onClick={() => handleDelete(item._id)}>
                      <CsLineIcons icon="bin" size="15" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card.Body>

      {/* Modal for Add / Edit */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Form onSubmit={handleSave}>
          <Modal.Header closeButton>
            <Modal.Title>{editId ? 'Edit Paying Company Account' : 'Add Paying Company Account'}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">Company Name <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="text"
                placeholder="e.g. ABC Pvt Ltd / XYZ Enterprises"
                value={formData.company_name}
                onChange={e => setFormData({ ...formData, company_name: e.target.value })}
                required
              />
            </Form.Group>

            <Row className="g-3 mb-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-bold">Bank Name</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="e.g. HDFC Bank"
                    value={formData.bank_name}
                    onChange={e => setFormData({ ...formData, bank_name: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-bold">Account Number</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Bank Account No."
                    value={formData.account_number}
                    onChange={e => setFormData({ ...formData, account_number: e.target.value })}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row className="g-3 mb-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-bold">IFSC Code</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="IFSC Code"
                    value={formData.ifsc_code}
                    onChange={e => setFormData({ ...formData, ifsc_code: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-bold">Bank Branch Name</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Branch location"
                    value={formData.branch_name}
                    onChange={e => setFormData({ ...formData, branch_name: e.target.value })}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">Registered Address</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                placeholder="Company registered address for salary slip header"
                value={formData.address}
                onChange={e => setFormData({ ...formData, address: e.target.value })}
              />
            </Form.Group>

            <Form.Check
              type="checkbox"
              id="is_default_check"
              label="Set as default paying account for new staff"
              checked={formData.is_default}
              onChange={e => setFormData({ ...formData, is_default: e.target.checked })}
            />
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={saving}>
              {saving ? <Spinner size="sm" animation="border" /> : 'Save Paying Account'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Card>
  );
}
