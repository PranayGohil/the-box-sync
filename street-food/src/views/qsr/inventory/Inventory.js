import React, { useState, useEffect, useCallback } from 'react';
import { useHistory } from 'react-router-dom';
import { Row, Col, Card, Button, Form, Spinner, Badge, Table, Modal, Alert } from 'react-bootstrap';
import axios from 'axios';
import { Formik, FieldArray } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import HtmlHead from 'components/html-head/HtmlHead';
import CreatableSelect from 'react-select/creatable';

const addValidationSchema = Yup.object().shape({
  bill_date: Yup.date().required('Date is required'),
  bill_number: Yup.string().required('Bill number is required'),
  vendor_name: Yup.string().required('Vendor name is required'),
  category: Yup.string().required('Category is required'),
  paid_amount: Yup.number().min(0, 'Paid amount cannot be negative').required('Paid amount is required'),
  tax: Yup.number().min(0).default(0),
  discount: Yup.number().min(0).default(0),
  items: Yup.array().of(
    Yup.object().shape({
      item_name: Yup.string().required('Item name required'),
      item_quantity: Yup.number().positive('Must be positive').required('Qty required'),
      unit: Yup.string().required('Unit required'),
      item_price: Yup.number().min(0, 'Cannot be negative').required('Price required'),
    })
  ).min(1, 'At least one item is required'),
});

const useValidationSchema = Yup.object().shape({
  item_name: Yup.string().required('Please select an item'),
  quantity_used: Yup.number().positive('Quantity must be greater than zero').required('Quantity is required'),
  comment: Yup.string().max(200, 'Comment must be under 200 characters'),
});

const DEFAULT_UNITS = [
  'kg',
  'g',
  'L',
  'ml',
  'pcs',
  'box',
  'pkt',
  'doz',
  'bottle',
  'can',
  'bag',
  'tin',
  'bunch',
  'tray',
  'roll'
];

const Inventory = () => {
  const history = useHistory();
  const [stock, setStock] = useState([]);
  const [inventoryList, setInventoryList] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingStock, setLoadingStock] = useState(true);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showUseModal, setShowUseModal] = useState(false);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchStock = useCallback(async () => {
    try {
      setLoadingStock(true);
      const res = await axios.get(`${process.env.REACT_APP_API}/inventory/stock`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      if (res.data?.success) {
        setStock(res.data.data || []);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load current stock');
    } finally {
      setLoadingStock(false);
    }
  }, []);

  const fetchInventory = useCallback(async () => {
    try {
      setLoadingList(true);
      // Fetch only Completed purchases to represent stock additions
      const res = await axios.get(`${process.env.REACT_APP_API}/inventory/get-by-status/Completed`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      if (res.data?.success) {
        setInventoryList(res.data.data || []);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load inventory logs');
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    fetchStock();
    fetchInventory();
  }, [fetchStock, fetchInventory]);

  const confirmDelete = (id) => {
    setDeleteTargetId(id);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!deleteTargetId) return;
    setDeleting(true);
    try {
      const res = await axios.delete(`${process.env.REACT_APP_API}/inventory/delete/${deleteTargetId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      if (res.data?.success || res.status === 200) {
        toast.success('Inventory entry deleted successfully');
        fetchInventory();
        fetchStock();
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete inventory entry');
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
      setDeleteTargetId(null);
    }
  };

  return (
    <div className="container-fluid py-4">
      <HtmlHead title="Inventory Management" description="Simple inventory management" />
      <style>{`
        .inventory-card-low-stock {
          background: rgba(239, 68, 68, 0.05) !important;
          border: 1.5px solid rgba(239, 68, 68, 0.25) !important;
          transition: all 0.2s ease-in-out;
        }
        .inventory-card-normal-stock {
          background: rgba(35, 179, 244, 0.04) !important;
          border: 1.5px solid rgba(35, 179, 244, 0.12) !important;
          transition: all 0.2s ease-in-out;
        }
        .inventory-card-low-stock:hover {
          background: rgba(239, 68, 68, 0.08) !important;
          box-shadow: 0 4px 12px rgba(239, 68, 68, 0.08);
        }
        .inventory-card-normal-stock:hover {
          background: rgba(35, 179, 244, 0.08) !important;
          box-shadow: 0 4px 12px rgba(35, 179, 244, 0.08);
        }
        .mobile-log-card {
          border-radius: 12px;
          border: 1px solid rgba(226, 232, 240, 0.9);
          background: #ffffff;
          margin-bottom: 12px;
          padding: 16px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.02);
          transition: all 0.2s;
        }
        .mobile-log-card:active, .mobile-log-card:hover {
          border-color: #23b3f4;
          box-shadow: 0 4px 12px rgba(35,179,244,0.05);
        }
        .inventory-delete-modal-content .btn {
          border-radius: 50px !important;
          font-weight: 600 !important;
          padding: 6px 20px !important;
          height: 38px !important;
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          gap: 6px !important;
          font-size: 0.88rem !important;
        }
        .inventory-delete-modal-content .btn-outline-secondary {
          border: 1px solid #64748b !important;
          color: #64748b !important;
          background-color: #ffffff !important;
        }
        .inventory-delete-modal-content .btn-outline-secondary:hover {
          background-color: #64748b !important;
          color: #ffffff !important;
          box-shadow: 0 4px 12px rgba(100, 116, 139, 0.25) !important;
        }
        .inventory-delete-modal-content .btn-outline-danger {
          border: 1px solid #ef4444 !important;
          color: #ef4444 !important;
          background-color: #ffffff !important;
        }
        .inventory-delete-modal-content .btn-outline-danger:hover {
          background-color: #ef4444 !important;
          color: #ffffff !important;
          box-shadow: 0 4px 12px rgba(239, 68, 68, 0.25) !important;
        }
        .inventory-delete-modal-content .btn-outline-danger:hover svg {
          stroke: #ffffff !important;
        }
      `}</style>
      
      <div className="d-flex flex-column flex-md-row justify-content-md-between align-items-start align-items-md-center gap-3 mb-4">
        <div>
          <h2 className="fw-bold text-primary mb-1">Inventory Management</h2>
          <p className="text-muted mb-0">Record raw materials, update stock quantities, and log usage.</p>
        </div>
        <div className="d-flex flex-column flex-sm-row gap-2 w-100 w-md-auto">
          <Button variant="outline-primary" className="rounded-pill px-4 shadow-sm w-100 w-sm-auto" onClick={() => setShowUseModal(true)}>
            <CsLineIcons icon="bin" className="me-2" /> Log Usage (Use Stock)
          </Button>
          <Button variant="primary" className="rounded-pill px-4 shadow-sm w-100 w-sm-auto" onClick={() => setShowAddModal(true)}>
            <CsLineIcons icon="plus" className="me-2" /> Add Purchase (Add Stock)
          </Button>
        </div>
      </div>

      {/* Stock Summary Strip */}
      <Card className="border-0 shadow-sm mb-4">
        <Card.Body className="p-4">
          <h5 className="fw-bold mb-3 d-flex align-items-center text-secondary">
            <CsLineIcons icon="activity" className="me-2 text-primary" size="20" />
            Current Stock Levels
          </h5>
          {loadingStock ? (
            <div className="text-center py-3"><Spinner animation="border" variant="primary" /></div>
          ) : stock.length === 0 ? (
            <Alert variant="light" className="text-center py-3 mb-0 border-dashed">No stock registered yet. Add a purchase to record stock.</Alert>
          ) : (
            <Row className="g-3">
              {stock.map((item) => {
                const isLow = item.totalStock <= (item.low_stock_threshold || 0);
                return (
                  <Col key={item._id} xs={6} sm={6} md={4} lg={3}>
                    <div 
                      className={`p-3 rounded-3 h-100 d-flex flex-column justify-content-between ${
                        isLow ? 'inventory-card-low-stock' : 'inventory-card-normal-stock'
                      }`}
                    >
                      <div>
                        <div className="fw-bold text-dark mb-1" style={{ fontSize: '13.5px', wordBreak: 'break-word' }}>
                          {item._id}
                        </div>
                        <h3 className={`fw-extrabold mb-0 ${isLow ? 'text-danger' : 'text-primary'}`} style={{ fontSize: '20px' }}>
                          {item.totalStock} <span className="fs-6 fw-normal text-muted">{item.unit}</span>
                        </h3>
                      </div>
                      {isLow && (
                        <div className="text-danger small mt-2 fw-semibold" style={{ fontSize: '10.5px' }}>
                          ⚠️ Low stock (min: {item.low_stock_threshold})
                        </div>
                      )}
                    </div>
                  </Col>
                );
              })}
            </Row>
          )}
        </Card.Body>
      </Card>

      {/* Main Inventory Log Table */}
      <style>{`
        .inventory-workstation-card {
          background: #ffffff !important;
          border-radius: 1.5rem !important;
          border: 1px solid rgba(0, 0, 0, 0.05) !important;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.01) !important;
          overflow: hidden;
        }
        .table-reconcile thead th {
          background: #f8fafc;
          color: #475569;
          font-size: 0.7rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: 1rem 1.25rem;
          border-bottom: 2px solid #e2e8f0;
        }
        .table-reconcile tbody td {
          padding: 1rem 1.25rem;
          font-size: 0.875rem;
          color: #334155;
          border-bottom: 1px solid #f1f5f9;
        }
      `}</style>
      <Card className="inventory-workstation-card border-0 mb-4 shadow-sm">
        <Card.Body className="p-4">
          <h5 className="fw-bold mb-3" style={{ color: '#23b3f4' }}>Purchase Logs</h5>
          {loadingList ? (
            <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>
          ) : inventoryList.length === 0 ? (
            <div className="text-center py-5">
              <CsLineIcons icon="warning-hexagon" size="45" className="text-muted mb-3" />
              <h5 className="text-muted fw-bold">No purchase logs found</h5>
              <p className="text-muted small mb-0">Record a new purchase to see it logged here.</p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="table-responsive d-none d-md-block">
                <Table hover className="align-middle table-reconcile mb-0">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Bill #</th>
                      <th>Vendor</th>
                      <th>Total Amount</th>
                      <th>Paid Amount</th>
                      <th>Due Amount</th>
                      <th className="text-end">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inventoryList.map((item) => {
                      const totalAmt = Number(item.total_amount || 0);
                      const paidAmt = Number(item.paid_amount || 0);
                      const dueAmt = item.unpaid_amount !== undefined && item.unpaid_amount !== null && item.unpaid_amount !== ''
                        ? Number(item.unpaid_amount)
                        : Math.max(0, totalAmt - paidAmt);

                      return (
                        <tr key={item._id}>
                          <td>
                            {item.bill_date ? new Date(item.bill_date).toLocaleDateString('en-IN') : new Date(item.request_date).toLocaleDateString('en-IN')}
                          </td>
                          <td className="fw-bold text-dark">{item.bill_number || '—'}</td>
                          <td>{item.vendor_name || '—'}</td>
                          <td className="fw-bold text-primary" style={{ color: '#23b3f4' }}>₹{totalAmt.toFixed(2)}</td>
                          <td className="fw-bold text-success">₹{paidAmt.toFixed(2)}</td>
                          <td>
                            <span className={`fw-bold ${dueAmt > 0 ? 'text-danger' : 'text-success'}`}>
                              ₹{dueAmt.toFixed(2)}
                            </span>
                          </td>
                          <td className="text-end">
                            <div className="d-flex justify-content-end gap-1">
                              <Button variant="outline-primary" size="sm" onClick={() => history.push(`/operations/inventory-details/${item._id}`)}>
                                View
                              </Button>
                              <Button variant="outline-warning" size="sm" onClick={() => history.push(`/operations/edit-inventory/${item._id}`)}>
                                Edit
                              </Button>
                              <Button variant="outline-danger" size="sm" onClick={() => confirmDelete(item._id)}>
                                Delete
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
              </div>

              {/* Mobile Card List View */}
              <div className="d-block d-md-none">
                {inventoryList.map((item) => {
                  const totalAmt = Number(item.total_amount || 0);
                  const paidAmt = Number(item.paid_amount || 0);
                  const dueAmt = item.unpaid_amount !== undefined && item.unpaid_amount !== null && item.unpaid_amount !== ''
                    ? Number(item.unpaid_amount)
                    : Math.max(0, totalAmt - paidAmt);

                  return (
                    <div key={item._id} className="mobile-log-card border rounded-4 p-3 mb-3 bg-white shadow-sm">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <div>
                          <span className="text-muted small fw-semibold">
                            {item.bill_date ? new Date(item.bill_date).toLocaleDateString('en-IN') : new Date(item.request_date).toLocaleDateString('en-IN')}
                          </span>
                          <div className="fw-bold text-dark mt-1" style={{ fontSize: '14px' }}>
                            Bill: {item.bill_number || '—'}
                          </div>
                        </div>
                        <div className="d-flex justify-content-end gap-1">
                          <Button variant="outline-primary" size="sm" onClick={() => history.push(`/operations/inventory-details/${item._id}`)}>
                            View
                          </Button>
                          <Button variant="outline-warning" size="sm" onClick={() => history.push(`/operations/edit-inventory/${item._id}`)}>
                            Edit
                          </Button>
                          <Button variant="outline-danger" size="sm" onClick={() => confirmDelete(item._id)}>
                            Delete
                          </Button>
                        </div>
                      </div>

                      <div className="text-muted small mb-3 border-bottom pb-2">
                        <span className="fw-semibold text-secondary">Vendor:</span> {item.vendor_name || '—'}
                      </div>

                      <Row className="g-2 text-center bg-light rounded-3 p-2">
                        <Col xs={4} className="border-end">
                          <div className="small text-muted fw-bold" style={{ fontSize: '11px' }}>TOTAL</div>
                          <div className="fw-bold text-primary" style={{ color: '#23b3f4', fontSize: '13px' }}>₹{totalAmt.toFixed(2)}</div>
                        </Col>
                        <Col xs={4} className="border-end">
                          <div className="small text-muted fw-bold" style={{ fontSize: '11px' }}>PAID</div>
                          <div className="fw-bold text-success" style={{ fontSize: '13px' }}>₹{paidAmt.toFixed(2)}</div>
                        </Col>
                        <Col xs={4}>
                          <div className="small text-muted fw-bold" style={{ fontSize: '11px' }}>DUE</div>
                          <div className={`fw-bold ${dueAmt > 0 ? 'text-danger' : 'text-success'}`} style={{ fontSize: '13px' }}>
                            ₹{dueAmt.toFixed(2)}
                          </div>
                        </Col>
                      </Row>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </Card.Body>
      </Card>

      {/* Add Purchase (Add Stock) Modal */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold text-primary">Add Purchase (Stock In)</Modal.Title>
        </Modal.Header>
        <Formik
          initialValues={{
            bill_date: new Date().toISOString().split('T')[0],
            bill_number: '',
            vendor_name: '',
            category: '',
            tax: 0,
            discount: 0,
            paid_amount: 0,
            status: 'Completed',
            items: [{ item_name: '', item_quantity: '', unit: '', item_price: '' }],
          }}
          validationSchema={addValidationSchema}
          onSubmit={async (values) => {
            setIsSubmitting(true);
            try {
              const subTotal = values.items.reduce((acc, curr) => acc + (Number(curr.item_quantity) || 0) * (Number(curr.item_price) || 0), 0);
              const totalAmount = subTotal + (Number(values.tax) || 0) - (Number(values.discount) || 0);
              const unpaidAmount = totalAmount - (Number(values.paid_amount) || 0);

              const payload = {
                ...values,
                sub_total: subTotal,
                total_amount: totalAmount,
                unpaid_amount: unpaidAmount,
              };

              await axios.post(`${process.env.REACT_APP_API}/inventory/add`, payload, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
              });

              toast.success('Inventory purchase recorded successfully!');
              setShowAddModal(false);
              fetchInventory();
              fetchStock();
            } catch (err) {
              console.error(err);
              toast.error(err.response?.data?.message || 'Failed to add inventory entry');
            } finally {
              setIsSubmitting(false);
            }
          }}
        >
          {({ values, errors, touched, handleChange, handleSubmit }) => {
            const subTotal = values.items.reduce((acc, curr) => acc + (Number(curr.item_quantity) || 0) * (Number(curr.item_price) || 0), 0);
            const totalAmount = subTotal + (Number(values.tax) || 0) - (Number(values.discount) || 0);
            const unpaidAmount = totalAmount - (Number(values.paid_amount) || 0);
            
            const availableUnits = Array.from(new Set([
              ...DEFAULT_UNITS,
              ...stock.map(s => s.unit?.trim()).filter(Boolean),
              ...inventoryList.flatMap(inv => inv.items?.map(it => it.unit?.trim()) || []).filter(Boolean),
              ...values.items.map(it => it.unit?.trim()).filter(Boolean)
            ]));

            return (
              <Form onSubmit={handleSubmit}>
                <Modal.Body className="px-4 py-3">
                  <Row className="g-3 mb-3">
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="small fw-bold">Date *</Form.Label>
                        <Form.Control 
                          type="date" 
                          name="bill_date" 
                          value={values.bill_date} 
                          onChange={handleChange}
                          isInvalid={touched.bill_date && errors.bill_date}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="small fw-bold">Bill Number *</Form.Label>
                        <Form.Control 
                          type="text" 
                          name="bill_number" 
                          placeholder="e.g. BILL-101" 
                          value={values.bill_number} 
                          onChange={handleChange}
                          isInvalid={touched.bill_number && errors.bill_number}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="small fw-bold">Vendor Name *</Form.Label>
                        <Form.Control 
                          type="text" 
                          name="vendor_name" 
                          placeholder="Vendor Name" 
                          value={values.vendor_name} 
                          onChange={handleChange}
                          isInvalid={touched.vendor_name && errors.vendor_name}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="small fw-bold">Category *</Form.Label>
                        <Form.Control 
                          type="text" 
                          name="category" 
                          placeholder="e.g. Vegetables, Dairy" 
                          value={values.category} 
                          onChange={handleChange}
                          isInvalid={touched.category && errors.category}
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <h6 className="fw-bold text-secondary border-bottom pb-2 mb-3">Purchase Items</h6>
                  
                  <FieldArray name="items">
                    {({ push, remove }) => (
                      <div>
                        {values.items.map((item, index) => (
                          <Row key={index} className="g-2 align-items-center mb-3 p-2 rounded border border-light" style={{ background: '#f8fafc' }}>
                            <Col xs={12} sm={4}>
                              <Form.Group>
                                <Form.Label className="small fw-bold d-block d-sm-none">Item Name</Form.Label>
                                <Form.Control
                                  type="text"
                                  name={`items[${index}].item_name`}
                                  placeholder="Item name"
                                  value={item.item_name}
                                  onChange={handleChange}
                                  isInvalid={touched.items?.[index]?.item_name && errors.items?.[index]?.item_name}
                                />
                              </Form.Group>
                            </Col>
                            <Col xs={4} sm={2}>
                              <Form.Group>
                                <Form.Label className="small fw-bold d-block d-sm-none">Qty</Form.Label>
                                <Form.Control
                                  type="number"
                                  name={`items[${index}].item_quantity`}
                                  placeholder="Qty"
                                  value={item.item_quantity}
                                  onChange={handleChange}
                                  isInvalid={touched.items?.[index]?.item_quantity && errors.items?.[index]?.item_quantity}
                                />
                              </Form.Group>
                            </Col>
                            <Col xs={4} sm={2}>
                              <Form.Group>
                                <Form.Label className="small fw-bold d-block d-sm-none">Unit</Form.Label>
                                <CreatableSelect
                                  isClearable
                                  menuPlacement="auto"
                                  menuPortalTarget={document.body}
                                  options={availableUnits.map((u) => ({ label: u, value: u }))}
                                  value={item.unit ? { label: item.unit, value: item.unit } : null}
                                  onChange={(selected) => {
                                    handleChange({
                                      target: {
                                        name: `items[${index}].unit`,
                                        value: selected ? selected.value : '',
                                      },
                                    });
                                  }}
                                  placeholder="Unit"
                                  classNamePrefix="react-select"
                                  styles={{
                                    control: (base) => ({
                                      ...base,
                                      borderColor: touched.items?.[index]?.unit && errors.items?.[index]?.unit ? '#dc3545' : base.borderColor,
                                      minHeight: '38px',
                                      height: '38px',
                                    }),
                                    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                                    menu: (base) => ({ ...base, zIndex: 9999 }),
                                  }}
                                  formatCreateLabel={(inputValue) => `Add "${inputValue}"`}
                                />
                              </Form.Group>
                            </Col>
                            <Col xs={4} sm={3}>
                              <Form.Group>
                                <Form.Label className="small fw-bold d-block d-sm-none">Price</Form.Label>
                                <Form.Control
                                  type="number"
                                  name={`items[${index}].item_price`}
                                  placeholder="Price"
                                  value={item.item_price}
                                  onChange={handleChange}
                                  isInvalid={touched.items?.[index]?.item_price && errors.items?.[index]?.item_price}
                                />
                              </Form.Group>
                            </Col>
                            <Col xs={12} sm={1} className="text-end text-sm-center">
                              {values.items.length > 1 && (
                                <Button 
                                  variant="outline-danger" 
                                  size="sm" 
                                  className="border-0 w-100 w-sm-auto mt-2 mt-sm-0" 
                                  onClick={() => remove(index)}
                                >
                                  <CsLineIcons icon="bin" size="16" />
                                  <span className="d-inline d-sm-none ms-1">Remove Item</span>
                                </Button>
                              )}
                            </Col>
                          </Row>
                        ))}
                        <Button variant="outline-primary" size="sm" className="mt-2 rounded-pill" onClick={() => push({ item_name: '', item_quantity: '', unit: '', item_price: '' })}>
                          + Add Item
                        </Button>
                      </div>
                    )}
                  </FieldArray>

                  <div className="add-inventory-summary-hub mt-4">
                    <Row className="g-4">
                      <Col md={4}>
                        <div className="add-inventory-input-group-label">Sub Total</div>
                        <div className="h4 fw-bold text-muted">₹ {subTotal.toFixed(2)}</div>
                      </Col>
                      <Col md={4}>
                        <div className="add-inventory-input-group-label">Tax Amount</div>
                        <Form.Control type="number" className="add-inventory-modern-input" name="tax" value={values.tax} onChange={handleChange} />
                      </Col>
                      <Col md={4}>
                        <div className="add-inventory-input-group-label">Discount</div>
                        <Form.Control type="number" className="add-inventory-modern-input" name="discount" value={values.discount} onChange={handleChange} />
                      </Col>

                      <Col xs={12} md={12}>
                        <div className="add-inventory-total-display shadow-sm flex-column flex-md-row align-items-stretch align-items-md-center gap-3">
                          <div>
                            <div className="add-inventory-input-group-label mb-1">Updated Payable</div>
                            <div className="add-inventory-total-val">₹ {totalAmount.toFixed(2)}</div>
                          </div>
                          <div className="text-start text-md-end" style={{ minWidth: '200px' }}>
                            <div className="add-inventory-input-group-label">Revised Paid Amount</div>
                            <Form.Control
                              type="number"
                              className="add-inventory-modern-input text-md-center fw-bold text-primary"
                              style={{ fontSize: '1.25rem' }}
                              name="paid_amount"
                              value={values.paid_amount}
                              onChange={handleChange}
                              isInvalid={touched.paid_amount && errors.paid_amount}
                              placeholder="0.00"
                            />
                            {touched.paid_amount && errors.paid_amount && <div className="text-danger small mt-1">{errors.paid_amount}</div>}
                          </div>
                        </div>
                      </Col>

                      <Col xs={12} md={12} className="text-end pt-3 d-flex flex-column flex-md-row justify-content-between align-items-center gap-3">
                        <div className="d-flex align-items-center gap-2 w-100 justify-content-center justify-content-md-start">
                          <div className="sw-2 sh-2 rounded-circle bg-warning flex-shrink-0" />
                          <span className="fw-bold text-muted">Pending Balance: ₹ {unpaidAmount.toFixed(2)}</span>
                        </div>
                        <div className="d-flex align-items-center gap-3 w-100 justify-content-center justify-content-md-end">
                          <Button 
                            variant="light" 
                            className="px-4 py-3 fw-bold rounded-pill shadow-sm" 
                            onClick={() => setShowAddModal(false)} 
                            disabled={isSubmitting}
                          >
                            Cancel
                          </Button>
                          <Button 
                            type="submit" 
                            variant="primary" 
                            className="manage-menu-custom-btn-outline border-primary text-primary shadow-sm px-5 py-3 fw-bold d-flex align-items-center justify-content-center" 
                            style={{ borderRadius: '50px', border: '2px solid #23b3f4', color: '#23b3f4' }}
                            disabled={isSubmitting}
                          >
                            {isSubmitting ? <Spinner animation="border" size="sm" className="me-2" /> : <CsLineIcons icon="save" className="me-2" />} Update & Finalize Changes
                          </Button>
                        </div>
                      </Col>
                    </Row>
                  </div>
                </Modal.Body>
              </Form>
            );
          }}
        </Formik>
      </Modal>

      {/* Log Usage (Use Stock) Modal */}
      <Modal show={showUseModal} onHide={() => setShowUseModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold text-primary">Log Usage (Stock Out)</Modal.Title>
        </Modal.Header>
        <Formik
          initialValues={{
            item_name: '',
            quantity_used: '',
            comment: '',
          }}
          validationSchema={useValidationSchema}
          onSubmit={async (values) => {
            setIsSubmitting(true);
            try {
              await axios.post(`${process.env.REACT_APP_API}/inventory/use`, values, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
              });

              toast.success('Stock usage logged successfully!');
              setShowUseModal(false);
              fetchStock();
              fetchInventory();
            } catch (err) {
              console.error(err);
              toast.error(err.response?.data?.message || 'Failed to log stock usage. Check available quantity.');
            } finally {
              setIsSubmitting(false);
            }
          }}
        >
          {({ values, errors, touched, handleChange, handleSubmit }) => (
            <Form onSubmit={handleSubmit}>
              <Modal.Body className="px-4 py-3">
                <Form.Group className="mb-3">
                  <Form.Label className="small fw-bold">Select Item *</Form.Label>
                  <Form.Select 
                    name="item_name" 
                    value={values.item_name} 
                    onChange={handleChange}
                    isInvalid={touched.item_name && errors.item_name}
                  >
                    <option value="">-- Select Item in Stock --</option>
                    {stock.map((item) => (
                      <option key={item._id} value={item._id}>
                        {item._id} (Available: {item.totalStock} {item.unit})
                      </option>
                    ))}
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">{errors.item_name}</Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="small fw-bold">Quantity to Use *</Form.Label>
                  <Form.Control 
                    type="number" 
                    name="quantity_used" 
                    placeholder="e.g. 5" 
                    value={values.quantity_used} 
                    onChange={handleChange}
                    isInvalid={touched.quantity_used && errors.quantity_used}
                  />
                  <Form.Control.Feedback type="invalid">{errors.quantity_used}</Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="small fw-bold">Notes / Comment</Form.Label>
                  <Form.Control 
                    as="textarea"
                    rows={3}
                    name="comment" 
                    placeholder="e.g. Used for evening shift curry preparation" 
                    value={values.comment} 
                    onChange={handleChange}
                    isInvalid={touched.comment && errors.comment}
                  />
                  <Form.Control.Feedback type="invalid">{errors.comment}</Form.Control.Feedback>
                </Form.Group>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="light" className="rounded-pill px-4" onClick={() => setShowUseModal(false)} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" className="rounded-pill px-4 shadow-sm" disabled={isSubmitting}>
                  {isSubmitting ? <Spinner animation="border" size="sm" /> : 'Log Usage'}
                </Button>
              </Modal.Footer>
            </Form>
          )}
        </Formik>
      </Modal>

      <Modal show={showDeleteModal} onHide={() => !deleting && setShowDeleteModal(false)} centered backdrop="static" contentClassName="inventory-delete-modal-content">
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold" style={{ color: '#cf2637' }}>
            Confirm Deletion
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="py-4">
          <div className="d-flex align-items-center mb-3">
            <div className="p-3 rounded-circle me-3" style={{ backgroundColor: 'rgba(207, 38, 55, 0.1)' }}>
              <CsLineIcons icon="bin" size="24" style={{ color: '#cf2637' }} />
            </div>
            <div>
              <p className="mb-1 fw-bold text-dark">Permanently delete this record?</p>
              <p className="mb-0 text-muted small">This log will be cleared from your history and any stock added by this purchase will be reversed.</p>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <Button 
            variant="outline-secondary" 
            onClick={() => setShowDeleteModal(false)} 
            disabled={deleting}
            className="rounded-pill px-4 fw-bold border-2"
          >
            Cancel
          </Button>
          <Button 
            variant="outline-danger" 
            onClick={handleDelete} 
            disabled={deleting}
            className="rounded-pill px-4 fw-bold border-2"
          >
            {deleting ? (
              <>
                <Spinner as="span" animation="border" size="sm" className="me-2" />
                Deleting...
              </>
            ) : (
              <div className="d-flex align-items-center">
                <CsLineIcons icon="bin" size="14" className="me-2" />
                Delete
              </div>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Inventory;
