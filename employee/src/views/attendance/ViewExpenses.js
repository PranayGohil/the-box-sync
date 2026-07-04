import React, { useState } from 'react';
import { Row, Col, Card, Button, Spinner, Badge, Table, Modal, Form } from 'react-bootstrap';
import HtmlHead from 'components/html-head/HtmlHead';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import { toast } from 'react-toastify';
import CreatableSelect from 'react-select/creatable';
import axios from 'axios';

const customStyles = `
  .glass-card {
    background: #ffffff !important;
    border: 1px solid #f0f0f0 !important;
    border-radius: 1.5rem !important;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.04) !important;
    transition: all 0.3s ease;
  }
  .stat-card {
    background: #f8fafc;
    border-radius: 1rem;
    padding: 1.5rem;
    text-align: center;
    border: 1px solid #e2e8f0;
    transition: all 0.2s;
  }
  .stat-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);
    border-color: #cbd5e1;
  }
  .table-custom {
    border-collapse: separate;
    border-spacing: 0;
  }
  .table-custom th {
    background: #f8fafc;
    color: #475569;
    font-size: 0.8rem;
    text-transform: uppercase;
    border-bottom: 2px solid #e2e8f0;
    padding: 1rem;
  }
  .table-custom td {
    padding: 1rem;
    vertical-align: middle;
    border-bottom: 1px solid #f1f5f9;
  }
`;

export default function ViewExpenses() {
  const title = 'My Expenses';
  const description = 'Manage and submit your expense claims';

  const [loading, setLoading] = useState(false);
  
  // Expense Claim state
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    category: '',
    amount: '',
    description: '',
    receipt: null,
    merchant: '',
    invoice_no: '',
    gst_no: '',
    payment_mode: 'cash',
    expense_type: 'reimbursement',
    date: new Date().toISOString().split('T')[0],
    items: []
  });
  const [expenseLoading, setExpenseLoading] = useState(false);
  const [expenseCategories, setExpenseCategories] = useState(['Travel', 'Food & Dining', 'Office Supplies', 'Company Purchase', 'Other']);

  const handleAddItem = () => {
    const newItems = [...expenseForm.items, { name: '', qty: 1, price: 0, total: 0 }];
    setExpenseForm({ ...expenseForm, items: newItems });
  };

  const handleRemoveItem = (index) => {
    const newItems = expenseForm.items.filter((_, i) => i !== index);
    const sum = newItems.reduce((acc, curr) => acc + curr.total, 0);
    setExpenseForm({ ...expenseForm, items: newItems, amount: sum > 0 ? sum.toString() : expenseForm.amount });
  };

  const handleItemChange = (index, field, val) => {
    const newItems = [...expenseForm.items];
    newItems[index][field] = val;
    if (field === 'qty' || field === 'price') {
      const q = Number(newItems[index].qty) || 0;
      const p = Number(newItems[index].price) || 0;
      newItems[index].total = q * p;
    }
    const sum = newItems.reduce((acc, curr) => acc + curr.total, 0);
    setExpenseForm({ ...expenseForm, items: newItems, amount: sum > 0 ? sum.toString() : expenseForm.amount });
  };

  // Expenses History
  const [history, setHistory] = useState([]);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${process.env.REACT_APP_API}/expenses/staff`, {
        headers: { Authorization: `Bearer ${sessionStorage.getItem('token')}` }
      });
      if (res.data.success) {
        setHistory(res.data.data);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to fetch expenses');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchExpenses();
  }, []);

  const handleExpenseSubmit = async (e) => {
    e.preventDefault();
    
    if (!expenseForm.category || !expenseForm.amount || !expenseForm.date) {
      toast.error("Please fill in category, amount, and date.");
      return;
    }

    setExpenseLoading(true);
    try {
      const formData = new FormData();
      formData.append('category', expenseForm.category);
      formData.append('amount', expenseForm.amount);
      formData.append('description', expenseForm.description);
      formData.append('date', expenseForm.date);
      formData.append('merchant', expenseForm.merchant);
      formData.append('invoice_no', expenseForm.invoice_no);
      formData.append('gst_no', expenseForm.gst_no);
      formData.append('payment_mode', expenseForm.payment_mode);
      formData.append('expense_type', expenseForm.expense_type);
      formData.append('items', JSON.stringify(expenseForm.items));
      
      if (expenseForm.receipt) {
        formData.append('receipt', expenseForm.receipt);
      }

      const res = await axios.post(`${process.env.REACT_APP_API}/expenses/requests`, formData, {
        headers: { Authorization: `Bearer ${sessionStorage.getItem('token')}` }
      });
      
      if (res.data.success) {
        toast.success('Expense claim submitted successfully!');
        setExpenseForm({
          category: '',
          amount: '',
          description: '',
          receipt: null,
          merchant: '',
          invoice_no: '',
          gst_no: '',
          payment_mode: 'cash',
          expense_type: 'reimbursement',
          date: new Date().toISOString().split('T')[0]
        });
        setShowExpenseModal(false);
        fetchExpenses(); // Refresh the list
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || 'Failed to submit expense claim');
    } finally {
      setExpenseLoading(false);
    }
  };

  const pendingAmount = history.filter(h => h.status === 'pending').reduce((acc, curr) => acc + Number(curr.amount), 0);
  const approvedAmount = history.filter(h => h.status === 'approved').reduce((acc, curr) => acc + Number(curr.amount), 0);
  const rejectedAmount = history.filter(h => h.status === 'rejected').reduce((acc, curr) => acc + Number(curr.amount), 0);

  return (
    <div className="container-fluid px-lg-4 px-xl-5 pb-5 pt-4">
      <style>{customStyles}</style>
      <HtmlHead title={title} description={description} />

      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-4">
        <div>
          <h1 className="mb-0 pb-0 display-4 fw-bold" style={{ color: '#1ea8e7' }}>{title}</h1>
          <p className="text-muted mb-0">{description}</p>
        </div>
        <Button variant="primary" className="btn-icon btn-icon-start px-4 py-2 rounded-pill shadow-sm" onClick={() => setShowExpenseModal(true)}>
          <CsLineIcons icon="plus" size="18" /> <span>Submit New Claim</span>
        </Button>
      </div>

      <Row className="g-4 mb-4">
        <Col xs={12} md={4}>
          <div className="stat-card h-100 d-flex flex-column justify-content-center">
            <div className="fs-3 fw-bold text-warning mb-1">₹{pendingAmount}</div>
            <div className="small text-muted text-uppercase fw-bold">Pending Approval</div>
          </div>
        </Col>
        <Col xs={12} md={4}>
          <div className="stat-card h-100 d-flex flex-column justify-content-center">
            <div className="fs-3 fw-bold text-success mb-1">₹{approvedAmount}</div>
            <div className="small text-muted text-uppercase fw-bold">Approved This Month</div>
          </div>
        </Col>
        <Col xs={12} md={4}>
          <div className="stat-card h-100 d-flex flex-column justify-content-center">
            <div className="fs-3 fw-bold text-danger mb-1">₹{rejectedAmount}</div>
            <div className="small text-muted text-uppercase fw-bold">Rejected This Month</div>
          </div>
        </Col>
      </Row>

      <Card className="glass-card border-0">
        <Card.Body className="p-4">
          <h5 className="fw-bold mb-4">Recent Claims</h5>
          {/* Desktop Table View */}
          <div className="table-responsive d-none d-lg-block">
            <Table className="table-custom" hover>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Category</th>
                  <th className="text-end">Amount</th>
                  <th className="text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {history.map(record => (
                  <tr key={record._id}>
                    <td className="fw-medium text-muted">{record.date}</td>
                    <td className="fw-bold">{record.category}</td>
                    <td className="text-end fw-bold text-dark">₹{record.amount}</td>
                    <td className="text-center">
                      <Badge bg={
                        record.status === 'approved' ? 'success' : 
                        record.status === 'pending' ? 'warning' : 'danger'
                      } className="px-3 py-2 rounded-pill text-white text-uppercase" style={{ fontSize: '0.7rem' }}>
                        {record.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
                {history.length === 0 && (
                  <tr>
                    <td colSpan="4" className="text-center py-4 text-muted">No expense claims found.</td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>

          {/* Mobile Card View */}
          <div className="d-lg-none mt-3">
            {history.length === 0 ? (
              <div className="text-center py-4 text-muted rounded bg-light border-0">No expenses found.</div>
            ) : (
              history.map(record => (
                <Card key={record._id} className="border-0 shadow-sm mb-3 bg-light" style={{ borderRadius: '1rem' }}>
                  <Card.Body className="p-3">
                    <div className="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom border-white">
                      <div className="fw-bold">{record.category}</div>
                      <Badge bg={
                        record.status === 'approved' ? 'success' : 
                        record.status === 'pending' ? 'warning' : 'danger'
                      } className="px-3 py-1 rounded-pill text-white shadow-sm text-uppercase" style={{ fontSize: '0.65rem' }}>
                        {record.status}
                      </Badge>
                    </div>
                    <div className="d-flex justify-content-between align-items-center pt-1">
                      <span className="text-muted small"><CsLineIcons icon="calendar" size="14" className="me-1" />{record.date}</span>
                      <span className="fw-bold text-dark fs-5">₹{record.amount}</span>
                    </div>
                  </Card.Body>
                </Card>
              ))
            )}
          </div>
        </Card.Body>
      </Card>

      {/* Submit Expense Claim Modal */}
      <Modal show={showExpenseModal} onHide={() => setShowExpenseModal(false)} centered size="lg">
        <Form onSubmit={handleExpenseSubmit}>
          <Modal.Header closeButton>
            <Modal.Title className="fw-bold">Submit Expense Claim</Modal.Title>
          </Modal.Header>
          <Modal.Body className="px-4 py-3">
            {/* Expense Type Selector */}
            <Form.Group className="mb-4">
              <Form.Label className="fw-bold text-muted small text-uppercase mb-2">Expense Type</Form.Label>
              <div className="d-flex gap-2">
                <Button 
                  type="button"
                  variant={expenseForm.expense_type === 'reimbursement' ? 'primary' : 'outline-secondary'}
                  className="rounded-pill px-4 fw-bold flex-fill py-2"
                  onClick={() => setExpenseForm({...expenseForm, expense_type: 'reimbursement'})}
                >
                  Employee Reimbursement
                </Button>
                <Button 
                  type="button"
                  variant={expenseForm.expense_type === 'company_purchase' ? 'primary' : 'outline-secondary'}
                  className="rounded-pill px-4 fw-bold flex-fill py-2"
                  onClick={() => setExpenseForm({...expenseForm, expense_type: 'company_purchase', category: 'Company Purchase'})}
                >
                  Company Purchase
                </Button>
              </div>
            </Form.Group>

            <Row className="g-3 mb-3">
              <Col xs={12} md={6}>
                <Form.Group>
                  <Form.Label className="fw-bold text-muted small text-uppercase">Category</Form.Label>
                  <CreatableSelect
                    isClearable
                    options={expenseCategories.map(cat => ({ label: cat, value: cat }))}
                    value={expenseForm.category ? { label: expenseForm.category, value: expenseForm.category } : null}
                    onChange={(selected) => setExpenseForm({...expenseForm, category: selected ? selected.value : ''})}
                    onCreateOption={(inputValue) => {
                      setExpenseCategories((prev) => [...prev, inputValue]);
                      setExpenseForm({...expenseForm, category: inputValue});
                    }}
                    placeholder="Select or type category..."
                  />
                </Form.Group>
              </Col>
              <Col xs={12} md={6}>
                <Form.Group>
                  <Form.Label className="fw-bold text-muted small text-uppercase">Payment Mode</Form.Label>
                  <Form.Select value={expenseForm.payment_mode} onChange={e => setExpenseForm({...expenseForm, payment_mode: e.target.value})}>
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
                  <Form.Control 
                    type="number" 
                    required 
                    placeholder="e.g. 500" 
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm({...expenseForm, amount: e.target.value})}
                  />
                </Form.Group>
              </Col>
              <Col xs={6}>
                <Form.Group>
                  <Form.Label className="fw-bold text-muted small text-uppercase">Transaction Date</Form.Label>
                  <Form.Control 
                    type="date" 
                    required 
                    value={expenseForm.date}
                    onChange={(e) => setExpenseForm({...expenseForm, date: e.target.value})}
                  />
                </Form.Group>
              </Col>
            </Row>

            <hr className="my-4" style={{ opacity: 0.1 }} />
            <h6 className="fw-bold mb-3 text-primary">Vendor & Billing Details</h6>

            <Row className="g-3 mb-3">
              <Col xs={12} md={4}>
                <Form.Group>
                  <Form.Label className="fw-bold text-muted small text-uppercase">Merchant / Vendor</Form.Label>
                  <Form.Control 
                    type="text" 
                    value={expenseForm.merchant} 
                    onChange={e => setExpenseForm({...expenseForm, merchant: e.target.value})} 
                    placeholder="e.g. Amazon, Local Store" 
                  />
                </Form.Group>
              </Col>
              <Col xs={6} md={4}>
                <Form.Group>
                  <Form.Label className="fw-bold text-muted small text-uppercase">Invoice / Bill No.</Form.Label>
                  <Form.Control 
                    type="text" 
                    value={expenseForm.invoice_no} 
                    onChange={e => setExpenseForm({...expenseForm, invoice_no: e.target.value})} 
                    placeholder="e.g. INV-2026-99" 
                  />
                </Form.Group>
              </Col>
              <Col xs={6} md={4}>
                <Form.Group>
                  <Form.Label className="fw-bold text-muted small text-uppercase">GSTIN (Optional)</Form.Label>
                  <Form.Control 
                    type="text" 
                    value={expenseForm.gst_no} 
                    onChange={e => setExpenseForm({...expenseForm, gst_no: e.target.value})} 
                    placeholder="e.g. 29GGGGG1314R1Z8" 
                  />
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

            {expenseForm.items.length > 0 ? (
              <div className="table-responsive mb-4 bg-light p-3 rounded-3" style={{ border: '1px solid #edf2f7' }}>
                <Table hover size="sm" className="mb-0">
                  <thead>
                    <tr>
                      <th>Product / Item Name</th>
                      <th style={{ width: '80px' }} className="text-center">Qty</th>
                      <th style={{ width: '120px' }} className="text-end">Price / Unit (₹)</th>
                      <th style={{ width: '110px' }} className="text-end">Total (₹)</th>
                      <th style={{ width: '50px' }} className="text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenseForm.items.map((item, idx) => (
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
              <Form.Label className="fw-bold text-muted small text-uppercase">Description / Purpose</Form.Label>
              <Form.Control 
                as="textarea" 
                rows={2} 
                placeholder="Briefly describe the expense..."
                value={expenseForm.description}
                onChange={(e) => setExpenseForm({...expenseForm, description: e.target.value})}
              />
            </Form.Group>

            <Form.Group className="mb-2">
              <Form.Label className="fw-bold text-muted small text-uppercase">Upload Receipt / Bill Image</Form.Label>
              <Form.Control type="file" accept="image/*" onChange={(e) => setExpenseForm({...expenseForm, receipt: e.target.files[0]})} />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" className="rounded-pill px-4" onClick={() => setShowExpenseModal(false)}>Cancel</Button>
            <Button variant="primary" className="rounded-pill px-4 fw-bold" type="submit" disabled={expenseLoading}>
              {expenseLoading ? <Spinner animation="border" size="sm" /> : 'Submit Claim'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

    </div>
  );
}
