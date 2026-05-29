import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Spinner, Alert, Badge, Table } from 'react-bootstrap';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';
import { toast } from 'react-toastify';
import CsLineIcons from 'cs-line-icons/CsLineIcons';

const AUTH_HEADER = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

// ─── Inner Form: Add / Edit a single cashier ────────────────────────────────
function CashierForm({ editing, onSave, onCancel }) {
  const isEdit = !!editing;

  const validationSchema = Yup.object({
    username: Yup.string().required('Username is required'),
    cashier_type: Yup.string().required(),
    adminPassword: Yup.string().required('Admin password is required'),
    password: isEdit
      ? Yup.string().min(6, 'Min 6 characters')
      : Yup.string().min(6, 'Min 6 characters').required('Password is required'),
    confirmPassword: Yup.string().oneOf([Yup.ref('password'), null], 'Passwords must match'),
  });

  const formik = useFormik({
    initialValues: {
      username: editing?.username || '',
      cashier_type: editing?.cashier_type || 'qsr',
      adminPassword: '',
      password: '',
      confirmPassword: '',
    },
    enableReinitialize: true,
    validationSchema,
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      try {
        const payload = {
          username: values.username,
          cashier_type: values.cashier_type,
          adminPassword: values.adminPassword,
        };
        if (values.password) {
          payload.password = values.password;
        }
        if (isEdit) {
          payload.accountId = editing._id;
        }

        await axios.post(
          `${process.env.REACT_APP_API}/panel-user/Create Cashier`,
          payload,
          { headers: AUTH_HEADER() }
        );

        toast.success(isEdit ? 'Cashier updated!' : 'Cashier created!');
        resetForm();
        onSave();
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to save cashier');
      } finally {
        setSubmitting(false);
      }
    },
  });

  return (
    <Form onSubmit={formik.handleSubmit} className="border rounded p-3 mb-3 bg-light">
      <h6 className="mb-3 fw-semibold">{isEdit ? '✏️ Edit Cashier' : '➕ New Cashier'}</h6>
      <div className="row g-2">
        {/* Username */}
        <div className="col-md-6">
          <Form.Group>
            <Form.Label className="text-small">Username</Form.Label>
            <Form.Control
              size="sm"
              name="username"
              value={formik.values.username}
              onChange={formik.handleChange}
              isInvalid={!!(formik.touched.username && formik.errors.username)}
            />
            <Form.Control.Feedback type="invalid">{formik.errors.username}</Form.Control.Feedback>
          </Form.Group>
        </div>

        {/* Cashier Type */}
        <div className="col-md-6">
          <Form.Group>
            <Form.Label className="text-small">Cashier Type</Form.Label>
            <div className="d-flex gap-3 mt-1">
              <Form.Check
                type="radio"
                label="QSR"
                name="cashier_type"
                value="qsr"
                checked={formik.values.cashier_type === 'qsr'}
                onChange={formik.handleChange}
                id={`ctype-qsr-${editing?._id || 'new'}`}
              />
              <Form.Check
                type="radio"
                label="Dine-In"
                name="cashier_type"
                value="dine-in"
                checked={formik.values.cashier_type === 'dine-in'}
                onChange={formik.handleChange}
                id={`ctype-dine-${editing?._id || 'new'}`}
              />
            </div>
          </Form.Group>
        </div>

        {/* Password */}
        <div className="col-md-6">
          <Form.Group>
            <Form.Label className="text-small">{isEdit ? 'New Password (optional)' : 'Password'}</Form.Label>
            <Form.Control
              size="sm"
              type="password"
              name="password"
              value={formik.values.password}
              onChange={formik.handleChange}
              isInvalid={!!(formik.touched.password && formik.errors.password)}
            />
            <Form.Control.Feedback type="invalid">{formik.errors.password}</Form.Control.Feedback>
          </Form.Group>
        </div>

        {/* Confirm Password */}
        <div className="col-md-6">
          <Form.Group>
            <Form.Label className="text-small">Confirm Password</Form.Label>
            <Form.Control
              size="sm"
              type="password"
              name="confirmPassword"
              value={formik.values.confirmPassword}
              onChange={formik.handleChange}
              isInvalid={!!(formik.touched.confirmPassword && formik.errors.confirmPassword)}
            />
            <Form.Control.Feedback type="invalid">{formik.errors.confirmPassword}</Form.Control.Feedback>
          </Form.Group>
        </div>

        {/* Admin Password */}
        <div className="col-md-12">
          <Form.Group>
            <Form.Label className="text-small">Your Admin Password (verification)</Form.Label>
            <Form.Control
              size="sm"
              type="password"
              name="adminPassword"
              value={formik.values.adminPassword}
              onChange={formik.handleChange}
              isInvalid={!!(formik.touched.adminPassword && formik.errors.adminPassword)}
            />
            <Form.Control.Feedback type="invalid">{formik.errors.adminPassword}</Form.Control.Feedback>
          </Form.Group>
        </div>
      </div>

      <div className="d-flex gap-2 mt-3">
        <Button size="sm" variant="primary" type="submit" disabled={formik.isSubmitting}>
          {formik.isSubmitting ? <Spinner size="sm" animation="border" /> : (isEdit ? 'Save Changes' : 'Create Cashier')}
        </Button>
        <Button size="sm" variant="secondary" type="button" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </Form>
  );
}

// ─── Delete Confirmation Modal ───────────────────────────────────────────────
function ConfirmDeleteModal({ show, cashier, onConfirm, onCancel }) {
  const [adminPassword, setAdminPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!adminPassword) {
      toast.error('Admin password is required');
      return;
    }
    setLoading(true);
    try {
      await axios.delete(
        `${process.env.REACT_APP_API}/panel-user/cashier/${cashier._id}`,
        {
          data: { adminPassword },
          headers: AUTH_HEADER(),
        }
      );
      toast.success('Cashier deleted');
      setAdminPassword('');
      onConfirm();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onCancel} centered size="sm">
      <Modal.Header closeButton>
        <Modal.Title className="fs-6">Delete Cashier</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>Are you sure you want to delete <strong>{cashier?.username}</strong>? This cannot be undone.</p>
        <Form.Control
          type="password"
          placeholder="Enter your admin password"
          value={adminPassword}
          onChange={(e) => setAdminPassword(e.target.value)}
          size="sm"
        />
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" size="sm" onClick={onCancel}>Cancel</Button>
        <Button variant="danger" size="sm" onClick={handleDelete} disabled={loading}>
          {loading ? <Spinner size="sm" animation="border" /> : 'Delete'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function ModalManageCashiers({ show, handleClose }) {
  const [cashiers, setCashiers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingCashier, setEditingCashier] = useState(null);
  const [deletingCashier, setDeletingCashier] = useState(null);

  const fetchCashiers = async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        `${process.env.REACT_APP_API}/panel-user/Create Cashier`,
        { headers: AUTH_HEADER() }
      );
      setCashiers(Array.isArray(res.data.data) ? res.data.data : []);
    } catch (err) {
      console.error('Failed to fetch cashiers', err);
      setCashiers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (show) {
      fetchCashiers();
      setShowForm(false);
      setEditingCashier(null);
    }
  }, [show]);

  const handleSaved = () => {
    setShowForm(false);
    setEditingCashier(null);
    fetchCashiers();
  };

  const handleEdit = (cashier) => {
    setEditingCashier(cashier);
    setShowForm(true);
  };

  const handleAddNew = () => {
    setEditingCashier(null);
    setShowForm(true);
  };

  return (
    <>
      <Modal show={show} onHide={handleClose} centered size="lg">
        <Modal.Header closeButton className="border-bottom">
          <Modal.Title>
            <CsLineIcons icon="user" className="me-2" size="18" />
            Manage Cashiers
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {/* Add/Edit Form */}
          {showForm && (
            <CashierForm
              editing={editingCashier}
              onSave={handleSaved}
              onCancel={() => { setShowForm(false); setEditingCashier(null); }}
            />
          )}

          {/* Cashier Table */}
          {loading ? (
            <div className="text-center py-4">
              <Spinner animation="border" size="sm" /> Loading cashiers...
            </div>
          ) : cashiers.length === 0 ? (
            <Alert variant="info" className="mb-0">
              No cashier accounts yet. Click <strong>"Add Cashier"</strong> to create one.
            </Alert>
          ) : (
            <Table hover responsive size="sm" className="mb-0">
              <thead className="bg-light">
                <tr>
                  <th>Username</th>
                  <th>Type</th>
                  <th>Created</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {cashiers.map((c) => (
                  <tr key={c._id}>
                    <td className="fw-semibold">{c.username}</td>
                    <td>
                      <Badge bg={c.cashier_type === 'dine-in' ? 'primary' : 'success'} className="text-capitalize">
                        {c.cashier_type === 'dine-in' ? 'Dine-In' : 'QSR'}
                      </Badge>
                    </td>
                    <td className="text-muted" style={{ fontSize: '0.8rem' }}>
                      {c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-IN') : '—'}
                    </td>
                    <td className="text-end">
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        className="me-1"
                        style={{ width: '28px', height: '28px', padding: 0 }}
                        title="Edit"
                        onClick={() => handleEdit(c)}
                      >
                        <CsLineIcons icon="edit" size="13" />
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        style={{ width: '28px', height: '28px', padding: 0 }}
                        title="Delete"
                        onClick={() => setDeletingCashier(c)}
                      >
                        <CsLineIcons icon="bin" size="13" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Modal.Body>

        <Modal.Footer className="justify-content-between">
          <Button variant="primary" size="sm" onClick={handleAddNew} disabled={showForm}>
            <CsLineIcons icon="plus" size="14" className="me-1" />
            Add Cashier
          </Button>
          <Button variant="secondary" size="sm" onClick={handleClose}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete confirm sub-modal */}
      {deletingCashier && (
        <ConfirmDeleteModal
          show={!!deletingCashier}
          cashier={deletingCashier}
          onConfirm={() => { setDeletingCashier(null); fetchCashiers(); }}
          onCancel={() => setDeletingCashier(null)}
        />
      )}
    </>
  );
}
