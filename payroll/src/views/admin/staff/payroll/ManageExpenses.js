import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Form, Spinner, Badge, Table, Modal } from 'react-bootstrap';
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import { toast } from 'react-toastify';
import axios from 'axios';
import { useHistory } from 'react-router-dom';

const customStyles = `
  .glass-card {
    background: #ffffff !important;
    border: 1px solid #f0f0f0 !important;
    border-radius: 1.5rem !important;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.04) !important;
  }
  .react-table-modern th {
    background: #f8fafc !important;
    color: #475569 !important;
    font-weight: 600 !important;
    text-transform: uppercase !important;
    font-size: 0.8rem !important;
    padding: 1rem 1.25rem !important;
    border-bottom: 2px solid #e2e8f0 !important;
  }
  .react-table-modern td {
    padding: 1rem 1.25rem !important;
    vertical-align: middle !important;
    border-bottom: 1px solid #edf2f7 !important;
  }
  .status-badge {
    padding: 0.4rem 0.85rem !important;
    border-radius: 50px !important;
    font-weight: 700 !important;
    font-size: 0.75rem !important;
    text-transform: uppercase !important;
  }
  .filter-bar-bg {
    background: #f8fafc;
    border-radius: 1rem;
    border: 1px solid #f1f5f9;
  }
  .filter-input-premium {
    height: 40px !important;
    border-radius: 0.75rem !important;
    border: 1px solid #cbd5e1 !important;
    font-size: 0.85rem !important;
    padding: 0.375rem 0.75rem !important;
    background-color: #fff !important;
  }
  .filter-input-premium:focus {
    border-color: #1ea8e7 !important;
    box-shadow: 0 0 0 2px rgba(30, 168, 231, 0.15) !important;
  }
  .filter-btn-premium {
    height: 40px !important;
    border-radius: 0.75rem !important;
    font-size: 0.85rem !important;
    font-weight: 600 !important;
    padding: 0.375rem 1.25rem !important;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
  .mobile-expense-card {
    background: #fff;
    border-radius: 1.25rem;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.02);
    border: 1px solid #f1f5f9;
    padding: 1.25rem;
    margin-bottom: 1rem;
  }
  .mobile-card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border: 1px solid #e2e8f0;
    border-radius: 0.5rem;
    padding: 0.75rem 1rem;
    margin-bottom: 1rem;
  }
  .mobile-card-name {
    font-size: 0.95rem;
    font-weight: 700;
    color: #1e293b;
    margin-bottom: 0.15rem;
  }
  .mobile-card-date {
    font-size: 0.75rem;
    color: #94a3b8;
  }
  .mobile-card-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
    margin-bottom: 1rem;
    font-size: 0.85rem;
  }
  .mobile-card-label {
    color: #94a3b8;
  }
  .mobile-card-value {
    color: #334155;
    font-weight: 600;
  }
  .mobile-card-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 0.75rem;
    border-top: 1px dashed #e2e8f0;
  }
`;

export default function ManageExpenses() {
  const history = useHistory();
  const title = 'Manage Expenses';
  const description = 'Approve or reject staff expense claims';
  const breadcrumbs = [
    { to: '', text: 'Home' },
    { to: 'expenses', text: 'Expenses' },
    { to: 'expenses/manage', text: 'Manage' },
  ];

  // Calculate default date range for CURRENT MONTH
  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

  const [loading, setLoading] = useState(false);
  const [expenses, setExpenses] = useState([]);
  const [filteredExpenses, setFilteredExpenses] = useState([]);
  
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [activeReceiptUrl, setActiveReceiptUrl] = useState('');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [activeExpense, setActiveExpense] = useState(null);

  // Filters state
  const [filters, setFilters] = useState({
    startDate: currentMonthStart,
    endDate: currentMonthEnd,
    type: 'All',
    category: 'All',
    status: 'All',
    search: '',
  });

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${process.env.REACT_APP_API}/expenses/requests`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.data.success) {
        setExpenses(res.data.data);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to fetch expenses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  // Filter application logic
  useEffect(() => {
    let result = [...expenses];

    if (filters.startDate) {
      result = result.filter(exp => exp.date >= filters.startDate);
    }
    if (filters.endDate) {
      result = result.filter(exp => exp.date <= filters.endDate);
    }
    if (filters.type !== 'All') {
      result = result.filter(exp => exp.expense_type === filters.type);
    }
    if (filters.category !== 'All') {
      result = result.filter(exp => exp.category === filters.category);
    }
    if (filters.status !== 'All') {
      result = result.filter(exp => exp.status === filters.status);
    }
    if (filters.search.trim()) {
      const q = filters.search.toLowerCase();
      result = result.filter(exp => {
        const staffName = exp.staff_id ? `${exp.staff_id.f_name} ${exp.staff_id.l_name}`.toLowerCase() : '';
        const merchant = exp.merchant ? exp.merchant.toLowerCase() : '';
        const desc = exp.description ? exp.description.toLowerCase() : '';
        return staffName.includes(q) || merchant.includes(q) || desc.includes(q);
      });
    }

    setFilteredExpenses(result);
  }, [expenses, filters]);

  const handleStatusChange = async (id, newStatus) => {
    try {
      const res = await axios.put(`${process.env.REACT_APP_API}/expenses/${id}/status`, { status: newStatus }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.data.success) {
        setExpenses(prev => prev.map(exp => exp._id === id ? res.data.data : exp));
        toast.success(`Expense ${newStatus} successfully!`);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to update status');
    }
  };

  const handleResetFilters = () => {
    setFilters({
      startDate: currentMonthStart,
      endDate: currentMonthEnd,
      type: 'All',
      category: 'All',
      status: 'All',
      search: '',
    });
  };

  const handleShowAll = () => {
    setFilters({
      ...filters,
      startDate: '',
      endDate: '',
    });
  };

  return (
    <div className="container-fluid px-lg-4 px-xl-5 pb-5">
      <style>{customStyles}</style>
      <HtmlHead title={title} description={description} />
      
      <div className="page-title-container mb-4 mt-5 mt-lg-0">
        <Row className="g-3 align-items-center">
          <Col xs="12" md="6">
            <h1 className="mb-0 pb-0 display-4 fw-bold" style={{ color: '#1ea8e7' }}>{title}</h1>
            <BreadcrumbList items={breadcrumbs} />
          </Col>
          <Col xs="12" md="6" className="d-flex justify-content-md-end">
            <Button variant="outline-primary" className="rounded-pill px-4 shadow-sm btn-icon btn-icon-start" onClick={() => history.push('/expenses/ess')}>
              <CsLineIcons icon="plus" size="18" /> <span>Add Expense</span>
            </Button>
          </Col>
        </Row>
      </div>

      {/* Interactive Filters Bar */}
      <Card className="border-0 shadow-sm mb-4 filter-bar-bg">
        <Card.Body className="p-3">
          <Row className="g-3 align-items-end">
            <Col xs={12} md={4} lg>
              <Form.Group>
                <Form.Label className="small text-muted fw-bold text-uppercase mb-1">Search</Form.Label>
                <Form.Control 
                  type="text" 
                  className="filter-input-premium"
                  placeholder="Staff, vendor, notes..." 
                  value={filters.search} 
                  onChange={e => setFilters({...filters, search: e.target.value})}
                />
              </Form.Group>
            </Col>
            <Col xs={6} md={4} lg>
              <Form.Group>
                <Form.Label className="small text-muted fw-bold text-uppercase mb-1">Type</Form.Label>
                <Form.Select className="filter-input-premium" value={filters.type} onChange={e => setFilters({...filters, type: e.target.value})}>
                  <option value="All">All Types</option>
                  <option value="reimbursement">Reimbursement</option>
                  <option value="company_purchase">Company Purchase</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col xs={6} md={4} lg>
              <Form.Group>
                <Form.Label className="small text-muted fw-bold text-uppercase mb-1">Status</Form.Label>
                <Form.Select className="filter-input-premium" value={filters.status} onChange={e => setFilters({...filters, status: e.target.value})}>
                  <option value="All">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col xs={6} md={6} lg>
              <Form.Group>
                <Form.Label className="small text-muted fw-bold text-uppercase mb-1">From Date</Form.Label>
                <Form.Control type="date" className="filter-input-premium" value={filters.startDate} onChange={e => setFilters({...filters, startDate: e.target.value})} />
              </Form.Group>
            </Col>
            <Col xs={6} md={6} lg>
              <Form.Group>
                <Form.Label className="small text-muted fw-bold text-uppercase mb-1">To Date</Form.Label>
                <Form.Control type="date" className="filter-input-premium" value={filters.endDate} onChange={e => setFilters({...filters, endDate: e.target.value})} />
              </Form.Group>
            </Col>
            <Col xs={12} lg="auto" className="d-flex gap-2 justify-content-lg-end ms-lg-auto mt-3 mt-lg-0">
              <Button variant="outline-secondary" className="filter-btn-premium w-100 text-nowrap" onClick={handleResetFilters} title="Reset to current month">
                This Month
              </Button>
              <Button variant="outline-primary" className="filter-btn-premium w-100 text-nowrap" onClick={handleShowAll}>
                Show All
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Card className="glass-card border-0">
        <Card.Body className="p-0">
          {/* Desktop & Tablet Table View */}
          <div className="table-responsive d-none d-md-block">
            <Table hover className="react-table-modern mb-0">
              <thead>
                <tr>
                  <th>Staff Member</th>
                  <th>Type & Category</th>
                  <th>Vendor</th>
                  <th>Payment</th>
                  <th>Date</th>
                  <th className="text-end">Amount</th>
                  <th className="text-center">Receipt</th>
                  <th className="text-center">Status</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.map(exp => (
                  <tr key={exp._id}>
                    <td className="fw-bold">
                      <div className="d-flex align-items-center gap-2">
                        <span>{exp.staff_id ? `${exp.staff_id.f_name} ${exp.staff_id.l_name}` : 'Unknown'}</span>
                        <Button 
                          variant="none" 
                          className="p-0 border-0 text-muted" 
                          style={{ background: 'transparent' }}
                          onClick={() => {
                            setActiveExpense(exp);
                            setShowDetailModal(true);
                          }}
                          title="View Purchase Details"
                        >
                          <CsLineIcons icon="info-circle" size="16" className="text-primary" />
                        </Button>
                      </div>
                    </td>
                    <td>
                      <Badge bg={exp.expense_type === 'company_purchase' ? 'info' : 'secondary'} className="me-2 text-white" style={{ fontSize: '0.65rem' }}>
                        {exp.expense_type === 'company_purchase' ? 'Purchase' : 'Reimb.'}
                      </Badge>
                      <span className="align-middle">{exp.category}</span>
                    </td>
                    <td>{exp.merchant || '-'}</td>
                    <td style={{ textTransform: 'capitalize' }}>{exp.payment_mode || 'Cash'}</td>
                    <td>{exp.date}</td>
                    <td className="text-end fw-bold text-dark">₹{(exp.amount || 0).toLocaleString('en-IN')}</td>
                    <td className="text-center">
                      {exp.receipt ? (
                        <Button 
                          variant="link" 
                          size="sm" 
                          className="p-0"
                          onClick={() => {
                            setActiveReceiptUrl(`${process.env.REACT_APP_UPLOAD_DIR}${exp.receipt}`);
                            setShowReceiptModal(true);
                          }}
                        >
                          <CsLineIcons icon="image" size="18" />
                        </Button>
                      ) : '-'}
                    </td>
                    <td className="text-center">
                      <Badge bg={exp.status === 'approved' ? 'success' : exp.status === 'rejected' ? 'danger' : 'warning'} className="status-badge">
                        {exp.status}
                      </Badge>
                    </td>
                    <td className="text-center">
                      {exp.status === 'pending' && (
                        <div className="d-flex justify-content-center gap-2">
                          <Button variant="outline-success" size="sm" onClick={() => handleStatusChange(exp._id, 'approved')}>
                            <CsLineIcons icon="check" size="14" />
                          </Button>
                          <Button variant="outline-danger" size="sm" onClick={() => handleStatusChange(exp._id, 'rejected')}>
                            <CsLineIcons icon="close" size="14" />
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredExpenses.length === 0 && (
                  <tr>
                    <td colSpan="9" className="text-center py-4 text-muted">No expense claims found for the selected filters.</td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>

          {/* Mobile Card View (visible strictly below 768px) */}
          <div className="d-md-none p-3 bg-light" style={{ borderRadius: '0 0 1.5rem 1.5rem' }}>
            {filteredExpenses.length === 0 ? (
              <div className="text-center py-5 text-muted">No expenses found for the selected filters.</div>
            ) : (
              filteredExpenses.map(exp => (
                <div key={exp._id} className="mobile-expense-card">
                  {/* Bordered Header Section */}
                  <div className="mobile-card-header">
                    <div>
                      <div className="mobile-card-name d-flex align-items-center gap-1">
                        <span>{exp.staff_id ? `${exp.staff_id.f_name} ${exp.staff_id.l_name}` : 'Unknown'}</span>
                        <Button 
                          variant="none" 
                          className="p-0 border-0"
                          onClick={() => {
                            setActiveExpense(exp);
                            setShowDetailModal(true);
                          }}
                        >
                          <CsLineIcons icon="info-circle" size="14" className="text-primary" />
                        </Button>
                      </div>
                      <div className="mobile-card-date">{exp.date}</div>
                    </div>
                    <Badge bg={exp.status === 'approved' ? 'success' : exp.status === 'rejected' ? 'danger' : 'warning'} className="status-badge">
                      {exp.status}
                    </Badge>
                  </div>

                  {/* Attributes Grid */}
                  <div className="mobile-card-grid">
                    <div>
                      <span className="mobile-card-label">Type: </span>
                      <Badge bg={exp.expense_type === 'company_purchase' ? 'info' : 'secondary'} className="text-white" style={{ fontSize: '0.65rem', verticalAlign: 'middle' }}>
                        {exp.expense_type === 'company_purchase' ? 'Purchase' : 'Reimb.'}
                      </Badge>
                    </div>
                    <div>
                      <span className="mobile-card-label">Category: </span>
                      <span className="mobile-card-value">{exp.category}</span>
                    </div>
                    <div>
                      <span className="mobile-card-label">Vendor: </span>
                      <span className="mobile-card-value">{exp.merchant || '-'}</span>
                    </div>
                    <div>
                      <span className="mobile-card-label">Payment: </span>
                      <span className="mobile-card-value text-capitalize">{exp.payment_mode || 'Cash'}</span>
                    </div>
                  </div>

                  {/* Footer with Amount & Receipt */}
                  <div className="mobile-card-footer">
                    <div>
                      <span className="mobile-card-label small">Amount: </span>
                      <span className="fw-bold text-dark fs-5 align-middle">₹{(exp.amount || 0).toLocaleString('en-IN')}</span>
                    </div>
                    {exp.receipt ? (
                      <Button 
                        variant="link" 
                        size="sm" 
                        className="p-0 text-primary fw-bold"
                        onClick={() => {
                          setActiveReceiptUrl(`${process.env.REACT_APP_UPLOAD_DIR}${exp.receipt}`);
                          setShowReceiptModal(true);
                        }}
                      >
                        <CsLineIcons icon="image" size="16" className="me-1" /> Receipt
                      </Button>
                    ) : (
                      <span className="text-muted small">No Receipt</span>
                    )}
                  </div>

                  {/* Action Buttons */}
                  {exp.status === 'pending' && (
                    <div className="d-flex gap-2 pt-3 mt-3 border-top border-light">
                      <Button variant="outline-success" className="w-100 rounded-pill" size="sm" onClick={() => handleStatusChange(exp._id, 'approved')}>
                        <CsLineIcons icon="check" size="14" className="me-1" /> Approve
                      </Button>
                      <Button variant="outline-danger" className="w-100 rounded-pill" size="sm" onClick={() => handleStatusChange(exp._id, 'rejected')}>
                        <CsLineIcons icon="close" size="14" className="me-1" /> Reject
                      </Button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </Card.Body>
      </Card>

      {/* Receipt View Modal */}
      <Modal show={showReceiptModal} onHide={() => setShowReceiptModal(false)} centered size="lg">
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold text-primary">Receipt</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center p-4">
          {activeReceiptUrl ? (
            <img src={activeReceiptUrl} alt="Receipt" className="img-fluid rounded-3" style={{ maxHeight: '70vh' }} />
          ) : (
            'No image'
          )}
        </Modal.Body>
      </Modal>

      {/* Expense Detail View Modal */}
      <Modal show={showDetailModal} onHide={() => setShowDetailModal(false)} centered size="md">
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold text-primary">Expense & Purchase Details</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          {activeExpense ? (
            <div>
              <div className="d-flex align-items-center justify-content-between mb-4 pb-3 border-bottom">
                <div>
                  <h6 className="fw-bold text-dark mb-0">
                    {activeExpense.staff_id ? `${activeExpense.staff_id.f_name} ${activeExpense.staff_id.l_name}` : 'Unknown'}
                  </h6>
                  <span className="text-muted small">{activeExpense.staff_id?.position || 'Staff'}</span>
                </div>
                <div className="text-end">
                  <h4 className="fw-bold text-primary mb-0">₹{(activeExpense.amount || 0).toLocaleString('en-IN')}</h4>
                  <Badge bg={activeExpense.status === 'approved' ? 'success' : activeExpense.status === 'rejected' ? 'danger' : 'warning'} className="status-badge mt-1">
                    {activeExpense.status}
                  </Badge>
                </div>
              </div>

              <Row className="g-3 mb-3">
                <Col xs={6}>
                  <div className="small text-muted text-uppercase fw-bold">Expense Type</div>
                  <div className="fw-medium text-dark mt-1" style={{ textTransform: 'capitalize' }}>
                    {activeExpense.expense_type ? activeExpense.expense_type.replace(/_/g, ' ') : 'Employee Reimbursement'}
                  </div>
                </Col>
                <Col xs={6}>
                  <div className="small text-muted text-uppercase fw-bold">Category</div>
                  <div className="fw-medium text-dark mt-1">{activeExpense.category}</div>
                </Col>
              </Row>

              <Row className="g-3 mb-3">
                <Col xs={6}>
                  <div className="small text-muted text-uppercase fw-bold">Transaction Date</div>
                  <div className="fw-medium text-dark mt-1">{activeExpense.date}</div>
                </Col>
                <Col xs={6}>
                  <div className="small text-muted text-uppercase fw-bold">Payment Mode</div>
                  <div className="fw-medium text-dark mt-1" style={{ textTransform: 'capitalize' }}>
                    {activeExpense.payment_mode || 'Cash'}
                  </div>
                </Col>
              </Row>

              <Row className="g-3 mb-4">
                <Col xs={6}>
                  <div className="small text-muted text-uppercase fw-bold">Merchant / Vendor</div>
                  <div className="fw-medium text-dark mt-1">{activeExpense.merchant || '-'}</div>
                </Col>
                <Col xs={6}>
                  <div className="small text-muted text-uppercase fw-bold">Invoice / Bill No.</div>
                  <div className="fw-medium text-dark mt-1">{activeExpense.invoice_no || '-'}</div>
                </Col>
              </Row>

              <Row className="g-3 mb-4">
                <Col xs={12}>
                  <div className="small text-muted text-uppercase fw-bold">GSTIN</div>
                  <div className="fw-medium text-dark mt-1">{activeExpense.gst_no || '-'}</div>
                </Col>
              </Row>

              {/* Items Breakdown Table */}
              {activeExpense.items && activeExpense.items.length > 0 && (
                <div className="mb-4">
                  <div className="small text-muted text-uppercase fw-bold mb-2">Purchased Products / Items</div>
                  <div className="table-responsive bg-light p-2 rounded-3" style={{ border: '1px solid #edf2f7' }}>
                    <Table size="sm" className="mb-0 text-dark small">
                      <thead>
                        <tr>
                          <th>Item Name</th>
                          <th className="text-center" style={{ width: '60px' }}>Qty</th>
                          <th className="text-end" style={{ width: '100px' }}>Price</th>
                          <th className="text-end" style={{ width: '100px' }}>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activeExpense.items.map((it, idx) => (
                          <tr key={idx}>
                            <td>{it.name}</td>
                            <td className="text-center">{it.qty}</td>
                            <td className="text-end">₹{(it.price || 0).toLocaleString('en-IN')}</td>
                            <td className="text-end fw-bold">₹{(it.total || 0).toLocaleString('en-IN')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                </div>
              )}

              <div className="mb-4">
                <div className="small text-muted text-uppercase fw-bold">Purpose / Notes</div>
                <div className="bg-light p-3 rounded-3 text-dark mt-1 small" style={{ whiteSpace: 'pre-wrap' }}>
                  {activeExpense.description || 'No additional details provided.'}
                </div>
              </div>

              {activeExpense.receipt && (
                <div className="text-center pt-2">
                  <Button 
                    variant="outline-primary" 
                    className="w-100 rounded-pill btn-icon btn-icon-start shadow-sm"
                    onClick={() => {
                      setActiveReceiptUrl(`${process.env.REACT_APP_UPLOAD_DIR}${activeExpense.receipt}`);
                      setShowReceiptModal(true);
                    }}
                  >
                    <CsLineIcons icon="image" size="18" /> <span>View Attached Bill/Receipt</span>
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-4 text-muted">No details loaded</div>
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
}
