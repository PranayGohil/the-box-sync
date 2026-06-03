import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { Row, Col, Card, Alert, Spinner, Table, Badge, Button, Modal } from 'react-bootstrap';
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import CsLineIcons from 'cs-line-icons/CsLineIcons';

const MONTH_NAMES = [
  '', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const customStyles = `
  .glass-card {
    background: rgba(255, 255, 255, 0.85) !important;
    backdrop-filter: blur(20px) !important;
    border: 1px solid rgba(255, 255, 255, 0.4) !important;
    border-radius: 1.5rem !important;
    box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.04) !important;
    transition: all 0.3s ease;
  }
  .glass-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 40px rgba(31, 38, 135, 0.06) !important;
  }
  .stat-card-accent {
    height: 100%;
    position: relative;
    overflow: hidden;
  }
  .stat-card-accent::after {
    content: '';
    position: absolute;
    bottom: -20px;
    right: -20px;
    width: 100px;
    height: 100px;
    background: radial-gradient(circle, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 70%);
    border-radius: 50%;
  }
  .stat-icon-circle {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 1rem;
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.05);
  }
  .status-badge {
    padding: 0.5rem 1rem;
    border-radius: 50px;
    font-weight: 700;
    font-size: 0.75rem;
    letter-spacing: 0.02em;
    text-transform: uppercase;
  }
  .react-table-modern th {
    background: #f8fafc !important;
    color: #64748b !important;
    font-weight: 700 !important;
    text-transform: uppercase !important;
    font-size: 0.75rem !important;
    letter-spacing: 0.05em !important;
    padding: 1.25rem !important;
    border: none !important;
  }
  .react-table-modern td {
    padding: 1.25rem !important;
    vertical-align: middle !important;
    border-bottom: 1px solid #f1f5f9 !important;
  }
  .custom-btn-outline {
    border: 1.5px solid #1ea8e7 !important;
    color: #1ea8e7 !important;
    background-color: transparent !important;
    transition: all 0.2s ease-in-out !important;
    border-radius: 50px !important;
    font-weight: 600 !important;
    font-size: 0.8rem !important;
  }
  .custom-btn-outline:hover {
    background-color: #1ea8e7 !important;
    color: #fff !important;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(30, 168, 231, 0.15) !important;
  }
  .bg-soft-primary { background-color: rgba(30, 168, 231, 0.1) !important; }
  .bg-soft-success { background-color: rgba(16, 185, 129, 0.1) !important; }
  .bg-soft-danger { background-color: rgba(239, 68, 68, 0.1) !important; }
  .bg-soft-warning { background-color: rgba(245, 158, 11, 0.1) !important; }
  .payslip-details-table th {
    background: #f8fafc;
    font-weight: 600;
  }
`;

const ViewStaffPayroll = () => {
  const { currentUser } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [payrollHistory, setPayrollHistory] = useState([]);
  const [careerStats, setCareerStats] = useState(null);
  const [selectedPayroll, setSelectedPayroll] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const title = 'My Payroll & Payslips';
  const description = 'View your monthly payslips and career statistics.';
  const breadcrumbs = [
    { to: '', text: 'Home' },
    { to: 'payroll', text: 'My Payroll' },
  ];

  const fetchPayroll = async () => {
    try {
      if (!currentUser?._id) return;
      setLoading(true);
      setError('');
      const headers = { Authorization: `Bearer ${localStorage.getItem('token')}` };
      const res = await axios.get(`${process.env.REACT_APP_API}/payroll/get/${currentUser._id}`, { headers });
      setPayrollHistory(res.data.data.payroll || []);
      setCareerStats(res.data.data.career_stats);
    } catch (err) {
      console.error('Error fetching payroll history:', err);
      setError('Failed to fetch payroll history. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayroll();
  }, [currentUser]);

  const getStatusBadge = (status) => {
    const s = (status || 'unpaid').toLowerCase();
    if (s === 'paid') {
      return <Badge className="status-badge bg-soft-success text-success">Paid</Badge>;
    }
    return <Badge className="status-badge bg-soft-danger text-danger">Unpaid</Badge>;
  };

  const handleOpenPayslip = (payrollItem) => {
    setSelectedPayroll(payrollItem);
    setShowModal(true);
  };

  const handlePrintPayslip = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="d-flex align-items-center justify-content-center py-5 mt-5">
        <Spinner animation="border" style={{ color: '#1ea8e7' }} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-fluid py-5 text-center">
        <Alert variant="danger" className="glass-card border-0 p-5 shadow-sm mx-auto" style={{ maxWidth: '600px' }}>
          <CsLineIcons icon="error" className="text-danger mb-3" size="48" />
          <h4 className="fw-bold mb-3">{error}</h4>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container-fluid pb-5">
      <style>{customStyles}</style>
      <HtmlHead title={title} description={description} />

      <div className="page-title-container mb-5">
        <Row className="g-3 align-items-center">
          <Col md={12}>
            <h1 className="mb-0 pb-0 display-4 fw-bold" style={{ color: '#1ea8e7' }}>
              My Payroll
            </h1>
            <BreadcrumbList items={breadcrumbs} />
          </Col>
        </Row>
      </div>

      {/* Career Stats KPI Cards */}
      {careerStats && (
        <Row className="g-4 mb-5">
          <Col lg={3} sm={6}>
            <Card className="glass-card stat-card-accent border-0 shadow-sm">
              <Card.Body className="p-4">
                <div className="stat-icon-circle bg-soft-primary">
                  <CsLineIcons icon="calendar" className="text-primary" size="24" />
                </div>
                <h6 className="text-muted mb-1 fw-bold">Total Months</h6>
                <h2 className="fw-bolder text-dark mb-0">{careerStats.total_months}</h2>
              </Card.Body>
            </Card>
          </Col>
          <Col lg={3} sm={6}>
            <Card className="glass-card stat-card-accent border-0 shadow-sm">
              <Card.Body className="p-4">
                <div className="stat-icon-circle bg-soft-success">
                  <CsLineIcons icon="wallet" className="text-success" size="24" />
                </div>
                <h6 className="text-muted mb-1 fw-bold">Total Net Salary</h6>
                <h2 className="fw-bolder text-success mb-0">₹{careerStats.total_earned?.toLocaleString('en-IN')}</h2>
              </Card.Body>
            </Card>
          </Col>
          <Col lg={3} sm={6}>
            <Card className="glass-card stat-card-accent border-0 shadow-sm">
              <Card.Body className="p-4">
                <div className="stat-icon-circle bg-soft-success">
                  <CsLineIcons icon="check" className="text-success" size="24" />
                </div>
                <h6 className="text-muted mb-1 fw-bold">Total Paid</h6>
                <h2 className="fw-bolder text-success mb-0">₹{careerStats.total_paid?.toLocaleString('en-IN')}</h2>
              </Card.Body>
            </Card>
          </Col>
          <Col lg={3} sm={6}>
            <Card className="glass-card stat-card-accent border-0 shadow-sm">
              <Card.Body className="p-4">
                <div className="stat-icon-circle bg-soft-danger">
                  <CsLineIcons icon="clock" className="text-danger" size="24" />
                </div>
                <h6 className="text-muted mb-1 fw-bold">Unpaid Dues</h6>
                <h2 className="fw-bolder text-danger mb-0">₹{careerStats.total_unpaid?.toLocaleString('en-IN')}</h2>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Payroll Logs */}
      <Card className="glass-card border-0 shadow-sm">
        <Card.Body className="p-4">
          <h5 className="fw-bold mb-4 text-dark">Monthly Payslips</h5>
          <div className="table-responsive">
            <Table className="react-table-modern align-middle mb-0">
              <thead>
                <tr>
                  <th>Period</th>
                  <th>Basic Salary</th>
                  <th>Allowances</th>
                  <th>Deductions</th>
                  <th>Net Payout</th>
                  <th>Status</th>
                  <th className="text-end">Action</th>
                </tr>
              </thead>
              <tbody>
                {payrollHistory.length > 0 ? (
                  payrollHistory.map((item) => (
                    <tr key={item._id}>
                      <td className="fw-bold text-dark">{MONTH_NAMES[item.month]} {item.year}</td>
                      <td>₹{item.basic_salary?.toLocaleString('en-IN')}</td>
                      <td>₹{(item.allowance || 0).toLocaleString('en-IN')}</td>
                      <td>₹{(item.deductions || 0).toLocaleString('en-IN')}</td>
                      <td className="fw-bold text-primary">₹{item.net_salary?.toLocaleString('en-IN')}</td>
                      <td>{getStatusBadge(item.status)}</td>
                      <td className="text-end">
                        <Button 
                          className="custom-btn-outline px-3 py-1 d-inline-flex align-items-center gap-1"
                          onClick={() => handleOpenPayslip(item)}
                        >
                          <CsLineIcons icon="file-text" size="14" />
                          <span>View Payslip</span>
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="text-center py-5 text-muted">
                      No payroll records available.
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>

      {/* Payslip Details Modal */}
      {selectedPayroll && (
        <Modal 
          show={showModal} 
          onHide={() => setShowModal(false)}
          centered 
          size="lg"
          className="print-modal"
        >
          <Modal.Header closeButton className="border-0">
            <Modal.Title className="fw-bold text-primary">
              Monthly Payslip Details
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="p-4">
            <div id="payslip-print-section" className="bg-white p-3 border rounded-4">
              <div className="d-flex align-items-center justify-content-between mb-4 pb-3 border-bottom">
                <div>
                  <h3 className="fw-bold text-dark mb-1">{currentUser?.restaurant_name || 'Restaurant Name'}</h3>
                  <p className="text-muted mb-0 small">MONTHLY SALARY SLIP</p>
                </div>
                <div className="text-end">
                  <h5 className="fw-bold mb-1">{MONTH_NAMES[selectedPayroll.month]} {selectedPayroll.year}</h5>
                  <Badge bg={selectedPayroll.status === 'paid' ? 'success' : 'danger'}>
                    {selectedPayroll.status === 'paid' ? 'PAID' : 'UNPAID'}
                  </Badge>
                </div>
              </div>

              <Row className="g-3 mb-4">
                <Col sm={6}>
                  <div className="text-muted small">Employee Name:</div>
                  <div className="fw-bold text-dark">{currentUser?.name}</div>
                </Col>
                <Col sm={6} className="text-sm-end">
                  <div className="text-muted small">Designation:</div>
                  <div className="fw-bold text-dark">{currentUser?.position || 'Employee'}</div>
                </Col>
                <Col sm={6}>
                  <div className="text-muted small">Payment Date:</div>
                  <div className="fw-bold text-dark">
                    {selectedPayroll.paid_date ? new Date(selectedPayroll.paid_date).toLocaleDateString('en-IN') : '—'}
                  </div>
                </Col>
                <Col sm={6} className="text-sm-end">
                  <div className="text-muted small">Payment Method:</div>
                  <div className="fw-bold text-dark">{selectedPayroll.payment_method || 'Bank Transfer'}</div>
                </Col>
              </Row>

              <Table bordered hover responsive className="payslip-details-table mb-4">
                <thead>
                  <tr>
                    <th>Earnings Description</th>
                    <th className="text-end">Amount</th>
                    <th>Deductions Description</th>
                    <th className="text-end">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Basic Salary</td>
                    <td className="text-end">₹{selectedPayroll.basic_salary?.toLocaleString('en-IN')}</td>
                    <td>Professional Tax (PT)</td>
                    <td className="text-end">₹{(selectedPayroll.pt || 0).toLocaleString('en-IN')}</td>
                  </tr>
                  <tr>
                    <td>Allowances</td>
                    <td className="text-end">₹{(selectedPayroll.allowance || 0).toLocaleString('en-IN')}</td>
                    <td>Provident Fund (PF)</td>
                    <td className="text-end">₹{(selectedPayroll.pf || 0).toLocaleString('en-IN')}</td>
                  </tr>
                  <tr>
                    <td>Overtime Pay</td>
                    <td className="text-end">₹{(selectedPayroll.overtime_pay || 0).toLocaleString('en-IN')}</td>
                    <td>ESI Contribution</td>
                    <td className="text-end">₹{(selectedPayroll.esi || 0).toLocaleString('en-IN')}</td>
                  </tr>
                  <tr>
                    <td>Bonus / Incentives</td>
                    <td className="text-end">₹{(selectedPayroll.bonus || 0).toLocaleString('en-IN')}</td>
                    <td>Unpaid Leave Deductions</td>
                    <td className="text-end">₹{(selectedPayroll.unpaid_leaves_amount || 0).toLocaleString('en-IN')}</td>
                  </tr>
                  <tr className="fw-bold bg-light">
                    <td>Total Earnings</td>
                    <td className="text-end text-success">
                      ₹{(selectedPayroll.basic_salary + (selectedPayroll.allowance || 0) + (selectedPayroll.overtime_pay || 0) + (selectedPayroll.bonus || 0)).toLocaleString('en-IN')}
                    </td>
                    <td>Total Deductions</td>
                    <td className="text-end text-danger">
                      ₹{(selectedPayroll.deductions || 0).toLocaleString('en-IN')}
                    </td>
                  </tr>
                </tbody>
              </Table>

              <div className="d-flex align-items-center justify-content-between p-3 bg-light border rounded-3">
                <span className="fw-bold text-dark" style={{ fontSize: '1.1rem' }}>Net Payout Amount:</span>
                <span className="fw-bolder text-primary" style={{ fontSize: '1.3rem' }}>
                  ₹{selectedPayroll.net_salary?.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <div className="d-flex justify-content-end gap-2 mt-4 no-print">
              <Button variant="light" className="rounded-pill px-4" onClick={() => setShowModal(false)}>
                Close
              </Button>
              <Button variant="primary" className="rounded-pill px-4 d-inline-flex align-items-center gap-1" onClick={handlePrintPayslip}>
                <CsLineIcons icon="print" size="14" />
                <span>Print Payslip</span>
              </Button>
            </div>
          </Modal.Body>
        </Modal>
      )}
    </div>
  );
};

export default ViewStaffPayroll;
