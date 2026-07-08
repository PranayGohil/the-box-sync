import React, { useState, useEffect, useCallback } from 'react';
import { Row, Col, Card, Button, Form, Spinner, Badge, Table, Modal, Alert } from 'react-bootstrap';
import axios from 'axios';
import { Formik, FieldArray } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import HtmlHead from 'components/html-head/HtmlHead';

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

const Inventory = () => {
  const [stock, setStock] = useState([]);
  const [inventoryList, setInventoryList] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingStock, setLoadingStock] = useState(true);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showUseModal, setShowUseModal] = useState(false);
  
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this inventory entry? This will reverse any stock added.')) return;
    try {
      const res = await axios.delete(`${process.env.REACT_APP_API}/inventory/delete/${id}`, {
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
      <Card className="border-0 shadow-sm">
        <Card.Body className="p-4">
          <h5 className="fw-bold text-secondary mb-3">Purchase Logs</h5>
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
                <Table hover align="middle" className="mb-0">
                  <thead className="bg-light text-secondary small fw-bold text-uppercase">
                    <tr>
                      <th className="ps-4">Date</th>
                      <th>Bill #</th>
                      <th>Vendor</th>
                      <th>Category</th>
                      <th>Items Purchased</th>
                      <th>Total Amount</th>
                      <th className="pe-4 text-end">Action</th>
                    </tr>
                  </thead>
                  <tbody className="small">
                    {inventoryList.map((item) => (
                      <tr key={item._id}>
                        <td className="ps-4 fw-semibold text-dark">
                          {item.bill_date ? new Date(item.bill_date).toLocaleDateString('en-IN') : new Date(item.request_date).toLocaleDateString('en-IN')}
                        </td>
                        <td className="fw-bold">{item.bill_number || '—'}</td>
                        <td>{item.vendor_name || '—'}</td>
                        <td><Badge bg="light" text="dark" className="border">{item.category}</Badge></td>
                        <td>
                          {item.items?.map((it, idx) => (
                            <div key={idx} className="small text-muted">
                              • {it.item_name} <span className="fw-bold text-primary">({it.item_quantity} {it.unit})</span>
                            </div>
                          ))}
                        </td>
                        <td className="fw-bold text-primary">₹{item.total_amount || 0}</td>
                        <td className="pe-4 text-end">
                          <Button variant="outline-danger" size="sm" className="rounded-circle p-1.5" onClick={() => handleDelete(item._id)}>
                            <CsLineIcons icon="bin" size="15" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>

              {/* Mobile Card List View */}
              <div className="d-block d-md-none">
                {inventoryList.map((item) => (
                  <div key={item._id} className="mobile-log-card">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <div>
                        <span className="text-muted small fw-semibold">
                          {item.bill_date ? new Date(item.bill_date).toLocaleDateString('en-IN') : new Date(item.request_date).toLocaleDateString('en-IN')}
                        </span>
                        <div className="fw-bold text-dark mt-1" style={{ fontSize: '13.5px' }}>
                          Bill: {item.bill_number || '—'}
                        </div>
                      </div>
                      <Badge bg="light" text="dark" className="border">
                        {item.category}
                      </Badge>
                    </div>

                    <div className="text-muted small mb-2">
                      <span className="fw-semibold text-secondary">Vendor:</span> {item.vendor_name || '—'}
                    </div>

                    <div className="py-2 px-3 bg-light rounded-3 mb-3">
                      <div className="small fw-bold text-secondary mb-1">Purchased Items:</div>
                      {item.items?.map((it, idx) => (
                        <div key={idx} className="small text-muted mb-1 d-flex justify-content-between">
                          <span>• {it.item_name}</span>
                          <span className="fw-bold text-primary">{it.item_quantity} {it.unit}</span>
                        </div>
                      ))}
                    </div>

                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <div className="small text-muted fw-bold">Total Amount</div>
                        <div className="fw-extrabold text-primary h5 mb-0">₹{item.total_amount || 0}</div>
                      </div>
                      <Button 
                        variant="outline-danger" 
                        size="sm" 
                        className="rounded-circle p-2" 
                        onClick={() => handleDelete(item._id)}
                      >
                        <CsLineIcons icon="bin" size="14" />
                      </Button>
                    </div>
                  </div>
                ))}
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
                                <Form.Control
                                  type="text"
                                  name={`items[${index}].unit`}
                                  placeholder="Unit"
                                  value={item.unit}
                                  onChange={handleChange}
                                  isInvalid={touched.items?.[index]?.unit && errors.items?.[index]?.unit}
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

                  <h6 className="fw-bold text-secondary border-bottom pb-2 mt-4 mb-3">Billing Totals</h6>
                  
                  <Row className="g-3">
                    <Col md={4}>
                      <Form.Group>
                        <Form.Label className="small fw-bold">Tax Amount</Form.Label>
                        <Form.Control 
                          type="number" 
                          name="tax" 
                          value={values.tax} 
                          onChange={handleChange}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group>
                        <Form.Label className="small fw-bold">Discount Amount</Form.Label>
                        <Form.Control 
                          type="number" 
                          name="discount" 
                          value={values.discount} 
                          onChange={handleChange}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group>
                        <Form.Label className="small fw-bold">Paid Amount *</Form.Label>
                        <Form.Control 
                          type="number" 
                          name="paid_amount" 
                          value={values.paid_amount} 
                          onChange={handleChange}
                          isInvalid={touched.paid_amount && errors.paid_amount}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={12} className="d-flex flex-column justify-content-end align-items-end text-end mt-4">
                      <div className="small fw-bold text-muted">Sub Total: ₹{subTotal.toFixed(2)}</div>
                      <h4 className="fw-extrabold text-primary mb-0 mt-1">Total: ₹{totalAmount.toFixed(2)}</h4>
                    </Col>
                  </Row>
                </Modal.Body>
                <Modal.Footer>
                  <Button variant="light" className="rounded-pill px-4" onClick={() => setShowAddModal(false)} disabled={isSubmitting}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" className="rounded-pill px-4 shadow-sm" disabled={isSubmitting}>
                    {isSubmitting ? <Spinner animation="border" size="sm" /> : 'Record Purchase'}
                  </Button>
                </Modal.Footer>
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
    </div>
  );
};

export default Inventory;
