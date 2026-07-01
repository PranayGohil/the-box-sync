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
  const [expenseForm, setExpenseForm] = useState({ category: '', amount: '', description: '', receipt: null });
  const [expenseLoading, setExpenseLoading] = useState(false);
  const [expenseCategories, setExpenseCategories] = useState(['Travel', 'Food & Dining', 'Office Supplies', 'Other']);

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
    
    if (!expenseForm.category || !expenseForm.amount) {
      toast.error("Please fill in category and amount.");
      return;
    }

    setExpenseLoading(true);
    try {
      const formData = new FormData();
      formData.append('category', expenseForm.category);
      formData.append('amount', expenseForm.amount);
      formData.append('description', expenseForm.description);
      // Auto-set current date since the UI doesn't have a date field here
      formData.append('date', new Date().toISOString().split('T')[0]);
      
      if (expenseForm.receipt) {
        formData.append('receipt', expenseForm.receipt);
      }

      const res = await axios.post(`${process.env.REACT_APP_API}/expenses/requests`, formData, {
        headers: { Authorization: `Bearer ${sessionStorage.getItem('token')}` }
      });
      
      if (res.data.success) {
        toast.success('Expense claim submitted successfully!');
        setExpenseForm({ category: '', amount: '', description: '', receipt: null });
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
      <Modal show={showExpenseModal} onHide={() => setShowExpenseModal(false)} centered>
        <Form onSubmit={handleExpenseSubmit}>
          <Modal.Header closeButton>
            <Modal.Title>Submit Expense Claim</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Category</Form.Label>
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
            <Form.Group className="mb-3">
              <Form.Label>Amount (₹)</Form.Label>
              <Form.Control 
                type="number" 
                required 
                placeholder="e.g. 500" 
                value={expenseForm.amount}
                onChange={(e) => setExpenseForm({...expenseForm, amount: e.target.value})}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Description / Reason</Form.Label>
              <Form.Control 
                as="textarea" 
                rows={3} 
                placeholder="Briefly describe the expense..."
                value={expenseForm.description}
                onChange={(e) => setExpenseForm({...expenseForm, description: e.target.value})}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Upload Receipt (Optional)</Form.Label>
              <Form.Control type="file" accept="image/*" onChange={(e) => setExpenseForm({...expenseForm, receipt: e.target.files[0]})} />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowExpenseModal(false)}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={expenseLoading}>
              {expenseLoading ? <Spinner animation="border" size="sm" /> : 'Submit Claim'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

    </div>
  );
}
