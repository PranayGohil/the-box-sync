import React, { useState } from 'react';
import { Row, Col, Card, Button, Form, Spinner, Table } from 'react-bootstrap';
import HtmlHead from 'components/html-head/HtmlHead';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import { toast } from 'react-toastify';
import CreatableSelect from 'react-select/creatable';
import axios from 'axios';

import { useHistory } from 'react-router-dom';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';

export default function ESSExpensePanel() {
  const history = useHistory();
  const title = 'Add Expense & Purchase';
  const description = 'Submit receipts for company purchases and reimbursement';
  const breadcrumbs = [
    { to: '', text: 'Home' },
    { to: 'expenses', text: 'Expenses' },
    { to: 'expenses/manage', text: 'Manage' },
    { to: 'expenses/ess', text: 'Add' },
  ];

  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ 
    category: '', 
    amount: '', 
    date: '', 
    notes: '', 
    receipt: null,
    merchant: '',
    invoice_no: '',
    gst_no: '',
    payment_mode: 'cash',
    expense_type: 'reimbursement',
    items: []
  });
  const [expenseCategories, setExpenseCategories] = useState(['Travel', 'Food & Dining', 'Office Supplies', 'Company Purchase', 'Other']);

  const handleAddItem = () => {
    const newItems = [...form.items, { name: '', qty: 1, price: 0, total: 0 }];
    setForm({ ...form, items: newItems });
  };

  const handleRemoveItem = (index) => {
    const newItems = form.items.filter((_, i) => i !== index);
    const sum = newItems.reduce((acc, curr) => acc + curr.total, 0);
    setForm({ ...form, items: newItems, amount: sum > 0 ? sum.toString() : form.amount });
  };

  const handleItemChange = (index, field, val) => {
    const newItems = [...form.items];
    newItems[index][field] = val;
    if (field === 'qty' || field === 'price') {
      const q = Number(newItems[index].qty) || 0;
      const p = Number(newItems[index].price) || 0;
      newItems[index].total = q * p;
    }
    const sum = newItems.reduce((acc, curr) => acc + curr.total, 0);
    setForm({ ...form, items: newItems, amount: sum > 0 ? sum.toString() : form.amount });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.category || !form.amount || !form.date) {
      toast.error("Please fill in category, amount, and date.");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('category', form.category);
      formData.append('amount', form.amount);
      formData.append('date', form.date);
      formData.append('description', form.notes);
      formData.append('merchant', form.merchant);
      formData.append('invoice_no', form.invoice_no);
      formData.append('gst_no', form.gst_no);
      formData.append('payment_mode', form.payment_mode);
      formData.append('expense_type', form.expense_type);
      formData.append('items', JSON.stringify(form.items));
      
      if (form.receipt) {
        formData.append('receipt', form.receipt);
      }

      const res = await axios.post(`${process.env.REACT_APP_API}/expenses/requests`, formData, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (res.data.success) {
        toast.success('Expense claim submitted successfully!');
        setForm({ 
          category: '', 
          amount: '', 
          date: '', 
          notes: '', 
          receipt: null,
          merchant: '',
          invoice_no: '',
          gst_no: '',
          payment_mode: 'cash',
          expense_type: 'reimbursement',
          items: []
        });
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || 'Failed to submit expense claim');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid px-lg-4 px-xl-5 pb-5 pt-2">
      <HtmlHead title={title} description={description} />
      
      {/* Page Header with Title, Breadcrumbs & Back Button */}
      <div className="page-title-container mb-3 mt-2 mt-lg-0">
        <Row className="g-3 align-items-center">
          <Col xs="12" md="6">
            <h1 className="mb-0 pb-0 display-4 fw-bold" style={{ color: '#1ea8e7' }}>{title}</h1>
            <BreadcrumbList items={breadcrumbs} />
          </Col>
          <Col xs="12" md="6" className="d-flex justify-content-md-end">
            <Button 
              variant="outline-primary" 
              className="rounded-pill px-4 shadow-sm btn-icon btn-icon-start" 
              onClick={() => history.push('/finance/expenses')}
            >
              <CsLineIcons icon="arrow-left" size="18" /> <span>Back to Expenses</span>
            </Button>
          </Col>
        </Row>
      </div>
      
      <Row className="justify-content-center">
        <Col xs={12} md={10} lg={8}>
          <Card className="border-0 shadow-sm" style={{ borderRadius: '1.5rem' }}>
            <Card.Body className="p-4 p-md-5">
              <h3 className="fw-bold mb-2">New Purchase or Reimbursement Claim</h3>
              <p className="text-muted mb-4 small">Track and submit company purchases or reimbursable employee expenses.</p>
              
              <Form onSubmit={handleSubmit}>
                {/* Expense Type Selector */}
                <Form.Group className="mb-4">
                  <Form.Label className="fw-bold text-muted small text-uppercase mb-2">Expense Type</Form.Label>
                  <div className="d-flex gap-2">
                    <Button 
                      type="button"
                      variant={form.expense_type === 'reimbursement' ? 'primary' : 'outline-secondary'}
                      className="rounded-pill px-4 fw-bold flex-fill py-2"
                      onClick={() => setForm({...form, expense_type: 'reimbursement'})}
                    >
                      Employee Reimbursement
                    </Button>
                    <Button 
                      type="button"
                      variant={form.expense_type === 'company_purchase' ? 'primary' : 'outline-secondary'}
                      className="rounded-pill px-4 fw-bold flex-fill py-2"
                      onClick={() => setForm({...form, expense_type: 'company_purchase', category: 'Company Purchase'})}
                    >
                      Company Purchase
                    </Button>
                  </div>
                </Form.Group>

                <Row className="g-3 mb-3">
                  <Col xs={12} md={6}>
                    <Form.Group>
                      <Form.Label className="fw-bold text-muted small text-uppercase">Expense Category</Form.Label>
                      <CreatableSelect
                        isClearable
                        options={expenseCategories.map(cat => ({ label: cat, value: cat }))}
                        value={form.category ? { label: form.category, value: form.category } : null}
                        onChange={(selected) => setForm({...form, category: selected ? selected.value : ''})}
                        onCreateOption={(inputValue) => {
                          setExpenseCategories((prev) => [...prev, inputValue]);
                          setForm({...form, category: inputValue});
                        }}
                        placeholder="Select or type category..."
                      />
                    </Form.Group>
                  </Col>
                  <Col xs={12} md={6}>
                    <Form.Group>
                      <Form.Label className="fw-bold text-muted small text-uppercase">Payment Mode</Form.Label>
                      <Form.Select value={form.payment_mode} onChange={e => setForm({...form, payment_mode: e.target.value})}>
                        <option value="cash">Cash</option>
                        <option value="upi">UPI / QR Code</option>
                        <option value="personal_card">Personal Credit/Debit Card</option>
                        <option value="company_card">Company Credit Card</option>
                        <option value="bank_transfer">Bank Transfer</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>
                
                <Row className="g-3 mb-3">
                  <Col xs={6}>
                    <Form.Group>
                      <Form.Label className="fw-bold text-muted small text-uppercase">Amount (₹)</Form.Label>
                      <Form.Control type="number" required value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} placeholder="e.g. 1500" />
                    </Form.Group>
                  </Col>
                  <Col xs={6}>
                    <Form.Group>
                      <Form.Label className="fw-bold text-muted small text-uppercase">Date of Transaction</Form.Label>
                      <Form.Control type="date" required value={form.date} onChange={e => setForm({...form, date: e.target.value})} />
                    </Form.Group>
                  </Col>
                </Row>

                <hr className="my-4" style={{ opacity: 0.1 }} />
                <h6 className="fw-bold mb-3 text-primary">Vendor & Billing Details</h6>

                <Row className="g-3 mb-3">
                  <Col xs={12} md={4}>
                    <Form.Group>
                      <Form.Label className="fw-bold text-muted small text-uppercase">Merchant / Vendor</Form.Label>
                      <Form.Control type="text" value={form.merchant} onChange={e => setForm({...form, merchant: e.target.value})} placeholder="e.g. Amazon, Local Store" />
                    </Form.Group>
                  </Col>
                  <Col xs={6} md={4}>
                    <Form.Group>
                      <Form.Label className="fw-bold text-muted small text-uppercase">Invoice / Bill No.</Form.Label>
                      <Form.Control type="text" value={form.invoice_no} onChange={e => setForm({...form, invoice_no: e.target.value})} placeholder="e.g. INV-2026-99" />
                    </Form.Group>
                  </Col>
                  <Col xs={6} md={4}>
                    <Form.Group>
                      <Form.Label className="fw-bold text-muted small text-uppercase">GSTIN (Optional)</Form.Label>
                      <Form.Control type="text" value={form.gst_no} onChange={e => setForm({...form, gst_no: e.target.value})} placeholder="e.g. 29GGGGG1314R1Z8" />
                    </Form.Group>
                  </Col>
                </Row>

                {/* Purchased Products / Items Section */}
                <hr className="my-4" style={{ opacity: 0.1 }} />
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6 className="fw-bold mb-0 text-primary">Purchased Products / Items Details</h6>
                  <Button type="button" variant="outline-primary" size="sm" className="rounded-pill px-3" onClick={handleAddItem}>
                    + Add Item
                  </Button>
                </div>

                {form.items.length > 0 ? (
                  <div className="table-responsive mb-4 bg-light p-3 rounded-3" style={{ border: '1px solid #edf2f7' }}>
                    <Table hover size="sm" className="mb-0">
                      <thead>
                        <tr>
                          <th>Product / Item Name</th>
                          <th style={{ width: '80px' }} className="text-center">Qty</th>
                          <th style={{ width: '130px' }} className="text-end">Price / Unit (₹)</th>
                          <th style={{ width: '120px' }} className="text-end">Total (₹)</th>
                          <th style={{ width: '50px' }} className="text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {form.items.map((item, idx) => (
                          <tr key={idx} className="align-middle">
                            <td>
                              <Form.Control 
                                size="sm" 
                                type="text" 
                                placeholder="Item name..." 
                                value={item.name} 
                                required 
                                onChange={e => handleItemChange(idx, 'name', e.target.value)} 
                              />
                            </td>
                            <td>
                              <Form.Control 
                                size="sm" 
                                type="number" 
                                className="text-center"
                                value={item.qty} 
                                min="1"
                                required 
                                onChange={e => handleItemChange(idx, 'qty', e.target.value)} 
                              />
                            </td>
                            <td>
                              <Form.Control 
                                size="sm" 
                                type="number" 
                                className="text-end"
                                value={item.price} 
                                min="0"
                                required 
                                onChange={e => handleItemChange(idx, 'price', e.target.value)} 
                              />
                            </td>
                            <td className="text-end fw-bold text-dark small">
                              ₹{(item.total || 0).toLocaleString('en-IN')}
                            </td>
                            <td className="text-center">
                              <Button variant="none" className="p-0 text-danger border-0" onClick={() => handleRemoveItem(idx)}>
                                <span style={{ fontSize: '1.1rem' }}>🗑</span>
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-3 bg-light rounded-3 text-muted mb-4 small">
                    No products added yet. Click "+ Add Item" to specify purchased products.
                  </div>
                )}

                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold text-muted small text-uppercase">Notes / Purpose of Purchase</Form.Label>
                  <Form.Control as="textarea" rows={3} value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} placeholder="Describe what was purchased and why..." />
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label className="fw-bold text-muted small text-uppercase">Upload Receipt / Bill Image</Form.Label>
                  <Form.Control type="file" accept="image/*" onChange={(e) => setForm({...form, receipt: e.target.files[0]})} />
                </Form.Group>

                <Button type="submit" variant="primary" className="w-100 rounded-pill py-2.5 fw-bold mt-2" disabled={loading}>
                  {loading ? <Spinner size="sm" /> : 'Submit Claim'}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
