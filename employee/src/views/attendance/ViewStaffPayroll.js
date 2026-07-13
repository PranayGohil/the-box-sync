import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { Row, Col, Card, Alert, Spinner, Table, Badge, Button, Modal, Form } from 'react-bootstrap';
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

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

const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

const numberToWords = (num) => {
  if (!num || num === 0) return 'Zero';
  num = Math.floor(num);
  const toWords = (n) => {
    if (n === 0) return '';
    if (n < 20) return `${ones[n]} `;
    if (n < 100) return `${tens[Math.floor(n / 10)]}${n % 10 ? ` ${ones[n % 10]}` : ''} `;
    if (n < 1000) return `${ones[Math.floor(n / 100)]} Hundred ${toWords(n % 100)}`;
    if (n < 100000) return `${toWords(Math.floor(n / 1000))}Thousand ${toWords(n % 1000)}`;
    if (n < 10000000) return `${toWords(Math.floor(n / 100000))}Lakh ${toWords(n % 100000)}`;
    return `${toWords(Math.floor(n / 10000000))}Crore ${toWords(n % 10000000)}`;
  };
  return toWords(num).trim();
};

const ViewStaffPayroll = () => {
  const { currentUser } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [payrollHistory, setPayrollHistory] = useState([]);
  const [careerStats, setCareerStats] = useState(null);
  const [selectedPayroll, setSelectedPayroll] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [staffProfile, setStaffProfile] = useState(null);

  const [monthFilter, setMonthFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState('all');

  const availableYears = React.useMemo(() => {
    const yrSet = new Set(payrollHistory.map(item => item.year ? item.year.toString() : null).filter(Boolean));
    yrSet.add(new Date().getFullYear().toString());
    return ['all', ...Array.from(yrSet)].sort((a, b) => b.localeCompare(a));
  }, [payrollHistory]);

  const filteredHistory = React.useMemo(() => {
    return payrollHistory.filter(item => {
      const matchesMonth = monthFilter === 'all' || Number(item.month) === Number(monthFilter);
      const matchesYear = yearFilter === 'all' || item.year?.toString() === yearFilter;
      return matchesMonth && matchesYear;
    });
  }, [payrollHistory, monthFilter, yearFilter]);

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
      const headers = { Authorization: `Bearer ${sessionStorage.getItem('token')}` };
      const res = await axios.get(`${process.env.REACT_APP_API}/payroll/get/${currentUser._id}`, { headers });
      setPayrollHistory(res.data.data.payroll || []);
      setCareerStats(res.data.data.career_stats);
      setStaffProfile(res.data.data.staff);
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
    if (!selectedPayroll || !staffProfile) return;
    try {
      const doc = new jsPDF();
      // Company Header – white background, black text
      let headerY = 10;
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text((currentUser?.name || 'COMPANY NAME').toUpperCase(), 105, headerY, { align: 'center' });
      headerY += 6;
      const addrParts = [currentUser?.address, currentUser?.city, currentUser?.state, currentUser?.pincode].filter(Boolean);
      if (addrParts.length > 0) {
          doc.setFontSize(8);
          doc.setFont(undefined, 'normal');
          doc.text(addrParts.join(', '), 105, headerY, { align: 'center' });
          headerY += 5;
      }
      doc.setDrawColor(0);
      doc.line(14, headerY, 196, headerY);
      headerY += 5;
      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      doc.text(`SALARY SLIP  |  ${MONTH_NAMES[selectedPayroll.month].toUpperCase()} ${selectedPayroll.year}`, 105, headerY, { align: 'center' });
      headerY += 4;
      doc.line(14, headerY, 196, headerY);
      headerY += 5;
      
      doc.rect(14, headerY, 182, 26);
      doc.setFont(undefined, 'bold');
      doc.setFontSize(10);
      doc.text('Employee Name:', 18, headerY + 8);
      doc.setFont(undefined, 'normal');
      doc.text(`${staffProfile.f_name} ${staffProfile.l_name}`, 55, headerY + 8);
      doc.setFont(undefined, 'bold');
      doc.text('Employee ID:', 110, headerY + 8);
      doc.setFont(undefined, 'normal');
      doc.text(`${staffProfile.staff_id || '-'}`, 145, headerY + 8);
      
      doc.setFont(undefined, 'bold');
      doc.text('Designation:', 18, headerY + 15);
      doc.setFont(undefined, 'normal');
      doc.text(`${staffProfile.position || 'Employee'}`, 55, headerY + 15);
      doc.setFont(undefined, 'bold');
      doc.text('Date of Joining:', 110, headerY + 15);
      doc.setFont(undefined, 'normal');
      doc.text(`${staffProfile.joining_date ? format(new Date(staffProfile.joining_date), 'dd-MMM-yyyy') : '-'}`, 145, headerY + 15);
      
      doc.setFont(undefined, 'bold');
      doc.text('UAN Number:', 18, headerY + 22);
      doc.setFont(undefined, 'normal');
      doc.text(`${staffProfile.uan_number || '-'}`, 55, headerY + 22);
      doc.setFont(undefined, 'bold');
      doc.text('Bank A/C No:', 110, headerY + 22);
      doc.setFont(undefined, 'normal');
      doc.text(`${staffProfile.bank_account?.account_number || '-'}`, 145, headerY + 22);
      
      headerY += 32;
      doc.rect(14, headerY, 182, 12);
      doc.setFontSize(9);
      doc.text(`Total Days: ${selectedPayroll.working_days_in_month}   |   Paid Days: ${selectedPayroll.leave_summary?.total_paid_days || selectedPayroll.present_days}   |   LWP: ${selectedPayroll.leave_summary?.lwp_days || selectedPayroll.absent_days}`, 105, headerY + 8, { align: 'center' });

      const totalEarnings = (selectedPayroll.earned_breakdown?.total_gross || selectedPayroll.earned_salary || 0) + (selectedPayroll.overtime_pay || 0) + (selectedPayroll.bonus || 0) + (selectedPayroll.expense_claims || 0);
      const statDed = selectedPayroll.deduction_breakdown?.total_statutory || 0;
      const manDed = selectedPayroll.deductions || 0;
      const advDed = selectedPayroll.advance_deduction || 0;
      const lwpDed = selectedPayroll.lwp_deduction || 0;
      const totalDeductions = statDed + manDed + advDed + lwpDed + (selectedPayroll.tds || 0);

      autoTable(doc, {
          startY: headerY + 16,
          head: [['Earnings', 'Amount (Rs.)', 'Deductions', 'Amount (Rs.)']],
          body: [
              ['Basic', (selectedPayroll.earned_breakdown?.basic || 0).toFixed(2), 'Provident Fund (PF)', (selectedPayroll.deduction_breakdown?.pf || 0).toFixed(2)],
              ['HRA', (selectedPayroll.earned_breakdown?.hra || 0).toFixed(2), 'ESI', (selectedPayroll.deduction_breakdown?.esi || 0).toFixed(2)],
              ['Conveyance', (selectedPayroll.earned_breakdown?.conveyance || 0).toFixed(2), 'Professional Tax (PT)', (selectedPayroll.deduction_breakdown?.pt || 0).toFixed(2)],
              ['Medical Allowance', (selectedPayroll.earned_breakdown?.medical || 0).toFixed(2), 'LWP Deduction', lwpDed.toFixed(2)],
              ['Special Allowance', (selectedPayroll.earned_breakdown?.special || 0).toFixed(2), 'Advance / Loan EMI', advDed.toFixed(2)],
              ['Overtime Pay', (selectedPayroll.overtime_pay || 0).toFixed(2), 'TDS', (selectedPayroll.tds || 0).toFixed(2)],
              ['Bonus', (selectedPayroll.bonus || 0).toFixed(2), 'Other Deductions', manDed.toFixed(2)],
              ['Expenses', (selectedPayroll.expense_claims || 0).toFixed(2), '', ''],
              ['Other Earnings', (selectedPayroll.earned_breakdown?.other || 0).toFixed(2), '', '']
          ],
          theme: 'grid',
          headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], lineColor: [0, 0, 0], lineWidth: 0.1 },
          columnStyles: {
              0: { cellWidth: 50 },
              1: { cellWidth: 41, halign: 'right' },
              2: { cellWidth: 50 },
              3: { cellWidth: 41, halign: 'right' }
          }
      });

      const { finalY } = doc.lastAutoTable;
      doc.setFillColor(255, 255, 255);
      doc.rect(14, finalY, 182, 10, 'F');
      doc.rect(14, finalY, 182, 10, 'S');
      doc.setFont(undefined, 'bold');
      doc.text('Gross Earnings', 18, finalY + 6.5);
      doc.text(`${totalEarnings.toFixed(2)}`, 95, finalY + 6.5, { align: 'right' });
      doc.text('Total Deductions', 109, finalY + 6.5);
      doc.text(`${totalDeductions.toFixed(2)}`, 186, finalY + 6.5, { align: 'right' });
      doc.rect(14, finalY + 14, 182, 12, 'S');
      doc.setFontSize(12);
      doc.text('Net Payable:', 18, finalY + 22);
      doc.text(`Rs. ${(selectedPayroll.net_salary || 0).toFixed(2)}`, 186, finalY + 22, { align: 'right' });
      doc.setFontSize(9);
      doc.setFont(undefined, 'normal');
      doc.text('** This is a computer-generated document and does not require a signature.', 105, finalY + 40, { align: 'center' });
      
      const fileName = `${staffProfile.staff_id || 'Staff'}_SalarySlip_${MONTH_NAMES[selectedPayroll.month]}_${selectedPayroll.year}.pdf`;
      doc.save(fileName);
    } catch (e) {
      console.error('Error generating PDF:', e);
    }
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
          <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between mb-4 gap-3">
            <h5 className="fw-bold mb-0 text-dark">Monthly Payslips</h5>
            <div className="d-flex align-items-center gap-2">
              <span className="small text-muted me-1 fw-bold text-uppercase" style={{ fontSize: '0.7rem' }}>Filter:</span>
              <Form.Select 
                size="sm" 
                style={{ width: '140px', borderRadius: '10px', fontSize: '0.8rem', padding: '0.35rem 1.5rem 0.35rem 0.75rem' }} 
                value={monthFilter} 
                onChange={e => setMonthFilter(e.target.value)}
              >
                <option value="all">All Months</option>
                <option value="1">January</option>
                <option value="2">February</option>
                <option value="3">March</option>
                <option value="4">April</option>
                <option value="5">May</option>
                <option value="6">June</option>
                <option value="7">July</option>
                <option value="8">August</option>
                <option value="9">September</option>
                <option value="10">October</option>
                <option value="11">November</option>
                <option value="12">December</option>
              </Form.Select>
              <Form.Select 
                size="sm" 
                style={{ width: '120px', borderRadius: '10px', fontSize: '0.8rem', padding: '0.35rem 1.5rem 0.35rem 0.75rem' }} 
                value={yearFilter} 
                onChange={e => setYearFilter(e.target.value)}
              >
                <option value="all">All Years</option>
                {availableYears.filter(y => y !== 'all').map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </Form.Select>
            </div>
          </div>
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
                {filteredHistory.length > 0 ? (
                  filteredHistory.map((item) => (
                    <tr key={item._id}>
                      <td className="fw-bold text-dark">{MONTH_NAMES[item.month]} {item.year}</td>
                      <td>₹{(item.earned_breakdown?.basic || 0).toLocaleString('en-IN')}</td>
                      <td>₹{((item.earned_breakdown?.total_gross || 0) - (item.earned_breakdown?.basic || 0) + (item.bonus || 0) + (item.overtime_pay || 0) + (item.expense_claims || 0)).toLocaleString('en-IN')}</td>
                      <td>₹{((item.deduction_breakdown?.total_statutory || 0) + (item.deductions || 0) + (item.advance_deduction || 0) + (item.tds || 0) + (item.lwp_deduction || 0)).toLocaleString('en-IN')}</td>
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
          <Modal.Body className="p-0">
            <div id="payslip-print-section" style={{ background: '#fff', padding: '24px', fontFamily: 'Arial, sans-serif', fontSize: '12px', color: '#000' }}>

              {/* Company Header */}
              <div style={{ textAlign: 'center', borderBottom: '1px solid #000', paddingBottom: '8px', marginBottom: '0' }}>
                <div style={{ fontWeight: 'bold', fontSize: '15px', letterSpacing: '1px', textTransform: 'uppercase', color: '#000' }}>
                  {currentUser?.name || 'COMPANY NAME'}
                </div>
                {(currentUser?.address || currentUser?.city) && (
                  <div style={{ fontSize: '10px', marginTop: '2px', color: '#000' }}>
                    {[currentUser?.address, currentUser?.city, currentUser?.state, currentUser?.pincode ? `- ${currentUser.pincode}` : ''].filter(Boolean).join(', ')}
                  </div>
                )}
              </div>
              <div style={{ textAlign: 'center', borderBottom: '1px solid #000', padding: '6px 12px', marginBottom: '0' }}>
                <div style={{ fontWeight: 'bold', fontSize: '12px', letterSpacing: '1px', textTransform: 'uppercase', color: '#000' }}>
                  SALARY SLIP &nbsp;|&nbsp; {MONTH_NAMES[selectedPayroll.month].toUpperCase()} {selectedPayroll.year}
                </div>
              </div>

              {/* Employee Info Grid */}
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '0', border: '1px solid #000', borderTop: 'none' }}>
                <tbody>
                  <tr>
                    <td style={{ padding: '6px 12px', width: '50%', borderRight: '1px solid #000', verticalAlign: 'top' }}>
                      <table style={{ width: '100%', fontSize: '11.5px' }}>
                        <tbody>
                          <tr>
                            <td style={{ paddingBottom: '6px', width: '110px', fontWeight: 'bold' }}>Employee Name:</td>
                            <td style={{ paddingBottom: '6px', color: '#000' }}>{staffProfile.f_name} {staffProfile.l_name}</td>
                          </tr>
                          <tr>
                            <td style={{ paddingBottom: '6px', fontWeight: 'bold' }}>Designation:</td>
                            <td style={{ paddingBottom: '6px', color: '#000' }}>{staffProfile.position || 'Employee'}</td>
                          </tr>
                          <tr>
                            <td style={{ fontWeight: 'bold' }}>UAN Number:</td>
                            <td style={{ color: '#000' }}>{staffProfile.uan_number || '-'}</td>
                          </tr>
                        </tbody>
                      </table>
                    </td>
                    <td style={{ padding: '6px 12px', width: '50%', verticalAlign: 'top' }}>
                      <table style={{ width: '100%', fontSize: '11.5px' }}>
                        <tbody>
                          <tr>
                            <td style={{ paddingBottom: '6px', width: '110px', fontWeight: 'bold' }}>Employee ID:</td>
                            <td style={{ paddingBottom: '6px', color: '#000' }}>{staffProfile.staff_id || '-'}</td>
                          </tr>
                          <tr>
                            <td style={{ paddingBottom: '6px', fontWeight: 'bold' }}>Date of Joining:</td>
                            <td style={{ paddingBottom: '6px', color: '#000' }}>{staffProfile.joining_date ? format(new Date(staffProfile.joining_date), 'dd-MMM-yyyy') : '-'}</td>
                          </tr>
                          <tr>
                            <td style={{ fontWeight: 'bold' }}>Bank A/C No:</td>
                            <td style={{ color: '#000' }}>{staffProfile.bank_account?.account_number || '-'}</td>
                          </tr>
                        </tbody>
                      </table>
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Working Details */}
              <div style={{ border: '1px solid #000', borderTop: 'none', padding: '8px', textAlign: 'center', fontSize: '11px', fontWeight: 'bold' }}>
                Total Days: {selectedPayroll.working_days_in_month} &nbsp; | &nbsp; Paid Days: {selectedPayroll.leave_summary?.total_paid_days || selectedPayroll.present_days} &nbsp; | &nbsp; LWP: {selectedPayroll.leave_summary?.lwp_days || selectedPayroll.absent_days}
              </div>

              {/* Earnings & Deductions Header */}
              <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000', borderTop: 'none' }}>
                <thead>
                  <tr style={{ background: '#fff' }}>
                    <th style={{ padding: '6px 8px', border: '1px solid #000', fontWeight: 'bold', fontSize: '11px', width: '38%' }}>Earnings</th>
                    <th style={{ padding: '6px 8px', border: '1px solid #000', textAlign: 'right', fontWeight: 'bold', fontSize: '11px', width: '12%' }}>Amount (Rs.)</th>
                    <th style={{ padding: '6px 8px', border: '1px solid #000', fontWeight: 'bold', fontSize: '11px', width: '38%' }}>Deductions</th>
                    <th style={{ padding: '6px 8px', border: '1px solid #000', textAlign: 'right', fontWeight: 'bold', fontSize: '11px', width: '12%' }}>Amount (Rs.)</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const p = selectedPayroll;
                    const lwpDed = p.lwp_deduction || 0;
                    const advDed = p.advance_deduction || 0;
                    const manDed = p.deductions || 0;
                    
                    const rowsData = [
                      { eLabel: 'Basic', eVal: (p.earned_breakdown?.basic || 0), dLabel: 'Provident Fund (PF)', dVal: (p.deduction_breakdown?.pf || 0) },
                      { eLabel: 'HRA', eVal: (p.earned_breakdown?.hra || 0), dLabel: 'ESI', dVal: (p.deduction_breakdown?.esi || 0) },
                      { eLabel: 'Conveyance', eVal: (p.earned_breakdown?.conveyance || 0), dLabel: 'Professional Tax (PT)', dVal: (p.deduction_breakdown?.pt || 0) },
                      { eLabel: 'Medical Allowance', eVal: (p.earned_breakdown?.medical || 0), dLabel: 'LWP Deduction', dVal: lwpDed },
                      { eLabel: 'Special Allowance', eVal: (p.earned_breakdown?.special || 0), dLabel: 'Advance / Loan EMI', dVal: advDed },
                      { eLabel: 'Overtime Pay', eVal: (p.overtime_pay || 0), dLabel: 'TDS', dVal: (p.tds || 0) },
                      { eLabel: 'Bonus', eVal: (p.bonus || 0), dLabel: 'Other Deductions', dVal: manDed },
                      { eLabel: 'Expenses', eVal: (p.expense_claims || 0), dLabel: '', dVal: null },
                      { eLabel: 'Other Earnings', eVal: (p.earned_breakdown?.other || 0), dLabel: '', dVal: null }
                    ];

                    return rowsData.map((row, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #e0e0e0' }}>
                        <td style={{ padding: '4px 8px', border: '1px solid #e0e0e0', fontSize: '11px' }}>{row.eLabel}</td>
                        <td style={{ padding: '4px 8px', border: '1px solid #e0e0e0', textAlign: 'right', fontSize: '11px' }}>{row.eVal.toFixed(2)}</td>
                        <td style={{ padding: '4px 8px', border: '1px solid #e0e0e0', fontSize: '11px' }}>{row.dLabel}</td>
                        <td style={{ padding: '4px 8px', border: '1px solid #e0e0e0', textAlign: 'right', fontSize: '11px' }}>{row.dVal !== null ? row.dVal.toFixed(2) : ''}</td>
                      </tr>
                    ));
                  })()}

                  {/* Totals Row */}
                  <tr style={{ fontWeight: 'bold', background: '#fff', borderTop: '2px solid #000' }}>
                    <td style={{ padding: '6px 8px', border: '1px solid #000', fontSize: '11px', fontWeight: 'bold' }}>Gross Earnings</td>
                    <td style={{ padding: '6px 8px', border: '1px solid #000', textAlign: 'right', fontSize: '11px' }}>
                      {((selectedPayroll.earned_breakdown?.total_gross || selectedPayroll.earned_salary || 0) + (selectedPayroll.overtime_pay || 0) + (selectedPayroll.bonus || 0) + (selectedPayroll.expense_claims || 0)).toFixed(2)}
                    </td>
                    <td style={{ padding: '6px 8px', border: '1px solid #000', fontSize: '11px', fontWeight: 'bold' }}>Total Deductions</td>
                    <td style={{ padding: '6px 8px', border: '1px solid #000', textAlign: 'right', fontSize: '11px' }}>
                      {((selectedPayroll.deduction_breakdown?.total_statutory || 0) + (selectedPayroll.deductions || 0) + (selectedPayroll.advance_deduction || 0) + (selectedPayroll.lwp_deduction || 0) + (selectedPayroll.tds || 0)).toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Net Payable Row */}
              <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000', borderTop: 'none' }}>
                <tbody>
                  <tr>
                    <td style={{ padding: '8px 12px', fontSize: '12px', fontWeight: 'bold', width: '50%' }}>
                      Net Payable:
                    </td>
                    <td style={{ padding: '8px 12px', fontSize: '12px', fontWeight: 'bold', width: '50%', textAlign: 'right' }}>
                      Rs. {selectedPayroll.net_salary?.toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Footer */}
              <table style={{ width: '100%', borderCollapse: 'collapse', border: 'none', marginTop: '15px' }}>
                <tbody>
                  <tr>
                    <td style={{ padding: '6px 8px', textAlign: 'center', fontSize: '9px', color: '#666' }}>
                      ** This is a computer-generated document and does not require a signature.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="d-flex justify-content-end gap-2 p-3 no-print">
              <Button variant="light" className="rounded-pill px-4" onClick={() => setShowModal(false)}>
                Close
              </Button>
              <Button variant="primary" className="rounded-pill px-4 d-inline-flex align-items-center gap-1" onClick={handlePrintPayslip}>
                <CsLineIcons icon="download" size="14" />
                <span>Download PDF</span>
              </Button>
            </div>
          </Modal.Body>
        </Modal>
      )}
    </div>
  );
};

export default ViewStaffPayroll;
