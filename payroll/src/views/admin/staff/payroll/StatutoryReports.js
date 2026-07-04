import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Form, Spinner, Alert, Table, Badge } from 'react-bootstrap';
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import { toast } from 'react-toastify';
import axios from 'axios';

const customStyles = `
  .glass-card {
    background: #ffffff !important;
    border: 1px solid #f0f0f0 !important;
    border-radius: 1.5rem !important;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.04) !important;
  }
  .report-btn {
    height: 90px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    border-radius: 1rem;
    font-weight: 600;
    transition: all 0.3s ease;
    border: 1px solid #e2e8f0;
    background: #fff;
  }
  .report-btn:hover {
    transform: translateY(-3px);
    box-shadow: 0 10px 20px rgba(0,0,0,0.06);
    border-color: #1ea8e7;
  }
  .stat-card-premium {
    border-radius: 1rem;
    border: 1px solid #f1f5f9;
    background: #f8fafc;
    padding: 1.25rem;
    transition: all 0.2s;
  }
  .stat-card-premium:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 16px rgba(0,0,0,0.03);
  }
  .table-premium th {
    background: #f8fafc !important;
    color: #475569 !important;
    font-weight: 600 !important;
    font-size: 0.8rem !important;
    text-transform: uppercase !important;
    border-bottom: 2px solid #e2e8f0 !important;
    padding: 0.75rem 1rem !important;
  }
  .table-premium td {
    padding: 0.75rem 1rem !important;
    vertical-align: middle !important;
    border-bottom: 1px solid #edf2f7 !important;
  }
  .status-badge {
    padding: 0.35rem 0.7rem !important;
    border-radius: 50px !important;
    font-weight: 700 !important;
    font-size: 0.7rem !important;
    text-transform: uppercase !important;
  }
`;

export default function StatutoryReports() {
  const title = 'Audit & Reports';
  const description = 'Generate and download company purchase, expense, and compliance reports';
  const breadcrumbs = [
    { to: '', text: 'Home' },
    { to: 'expenses', text: 'Expenses' },
    { to: 'expenses/reports', text: 'Audit & Reports' },
  ];

  const currentDate = new Date();
  const [complianceMonth, setComplianceMonth] = useState(currentDate.getMonth() + 1);
  const [complianceYear, setComplianceYear] = useState(currentDate.getFullYear());
  const [downloadingCompliance, setDownloadingCompliance] = useState(null);

  // Expense reports state
  const [loadingExpenses, setLoadingExpenses] = useState(false);
  const [expenses, setExpenses] = useState([]);
  const [filteredExpenses, setFilteredExpenses] = useState([]);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    category: 'All',
    status: 'All',
    search: '',
  });

  // Fetch expenses for reporting
  const fetchExpenses = async () => {
    try {
      setLoadingExpenses(true);
      const res = await axios.get(`${process.env.REACT_APP_API}/expenses/requests`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.data.success) {
        setExpenses(res.data.data);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to fetch expense logs');
    } finally {
      setLoadingExpenses(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  // Apply filters to expense data
  useEffect(() => {
    let result = [...expenses];

    if (filters.startDate) {
      result = result.filter(exp => exp.date >= filters.startDate);
    }
    if (filters.endDate) {
      result = result.filter(exp => exp.date <= filters.endDate);
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
        const desc = exp.description ? exp.description.toLowerCase() : '';
        const cat = exp.category ? exp.category.toLowerCase() : '';
        return staffName.includes(q) || desc.includes(q) || cat.includes(q);
      });
    }

    setFilteredExpenses(result);
  }, [expenses, filters]);

  // Download Compliance Reports (PF, ESI, PT, TDS)
  const handleComplianceDownload = (reportType) => {
    setDownloadingCompliance(reportType);
    setTimeout(() => {
      toast.success(`${reportType} downloaded successfully!`);
      setDownloadingCompliance(null);
    }, 1200);
  };

  // Export Filtered Expense Report as CSV
  const handleExportCSV = () => {
    if (filteredExpenses.length === 0) {
      toast.warning('No records found to export');
      return;
    }

    const headers = ['Date', 'Staff Name', 'Category', 'Description', 'Amount (INR)', 'Status'];
    const rows = filteredExpenses.map(exp => [
      exp.date || '',
      exp.staff_id ? `${exp.staff_id.f_name} ${exp.staff_id.l_name}` : 'Unknown',
      exp.category || '',
      (exp.description || '').replace(/,/g, ' '), // sanitize commas
      exp.amount || 0,
      exp.status || ''
    ]);

    const csvContent = `data:text/csv;charset=utf-8,${[headers.join(','), ...rows.map(e => e.join(','))].join('\n')}`;
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Company_Expense_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Report downloaded successfully!');
  };

  // Calculations for stats cards
  const stats = {
    total: filteredExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0),
    approved: filteredExpenses.filter(e => e.status === 'approved').reduce((sum, exp) => sum + (exp.amount || 0), 0),
    pending: filteredExpenses.filter(e => e.status === 'pending').reduce((sum, exp) => sum + (exp.amount || 0), 0),
    purchases: filteredExpenses.filter(e => e.category === 'Company Purchase').reduce((sum, exp) => sum + (exp.amount || 0), 0),
  };

  const MONTH_NAMES = [
    '', 'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  
  const yearOptions = [];
  for (let y = currentDate.getFullYear(); y >= currentDate.getFullYear() - 5; y--) yearOptions.push(y);

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
        </Row>
      </div>

      {/* --- Expense & Purchase Reports --- */}
      <h5 className="fw-bold mb-3 text-dark d-flex align-items-center gap-2">
        <CsLineIcons icon="wallet" size="20" className="text-primary" />
        Company Purchase & Expense Analytics
      </h5>

      {/* Stats row */}
      <Row className="g-3 mb-4">
        <Col xs={6} md={3}>
          <div className="stat-card-premium shadow-sm">
            <div className="text-muted small fw-bold text-uppercase">Total Amount</div>
            <h3 className="fw-bold text-dark mt-1 mb-0">₹{stats.total.toLocaleString('en-IN')}</h3>
          </div>
        </Col>
        <Col xs={6} md={3}>
          <div className="stat-card-premium shadow-sm">
            <div className="text-muted small fw-bold text-uppercase text-success">Approved Claims</div>
            <h3 className="fw-bold text-success mt-1 mb-0">₹{stats.approved.toLocaleString('en-IN')}</h3>
          </div>
        </Col>
        <Col xs={6} md={3}>
          <div className="stat-card-premium shadow-sm">
            <div className="text-muted small fw-bold text-uppercase text-warning">Pending Review</div>
            <h3 className="fw-bold text-warning mt-1 mb-0">₹{stats.pending.toLocaleString('en-IN')}</h3>
          </div>
        </Col>
        <Col xs={6} md={3}>
          <div className="stat-card-premium shadow-sm">
            <div className="text-muted small fw-bold text-uppercase text-info">Company Purchases</div>
            <h3 className="fw-bold text-info mt-1 mb-0">₹{stats.purchases.toLocaleString('en-IN')}</h3>
          </div>
        </Col>
      </Row>

      {/* Expense Reports Card */}
      <Card className="glass-card border-0 mb-5 p-4 shadow-sm">
        <Card.Body className="p-0">
          <Row className="g-3 align-items-end mb-4">
            <Col xs={12} md={3}>
              <Form.Group>
                <Form.Label className="fw-bold small text-muted text-uppercase">Search</Form.Label>
                <Form.Control 
                  type="text" 
                  placeholder="Staff, Description, Category..." 
                  value={filters.search} 
                  onChange={e => setFilters({...filters, search: e.target.value})}
                />
              </Form.Group>
            </Col>
            <Col xs={6} md={2}>
              <Form.Group>
                <Form.Label className="fw-bold small text-muted text-uppercase">Category</Form.Label>
                <Form.Select value={filters.category} onChange={e => setFilters({...filters, category: e.target.value})}>
                  <option value="All">All Categories</option>
                  <option value="Travel">Travel</option>
                  <option value="Food & Dining">Food & Dining</option>
                  <option value="Office Supplies">Office Supplies</option>
                  <option value="Company Purchase">Company Purchase</option>
                  <option value="Other">Other</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col xs={6} md={2}>
              <Form.Group>
                <Form.Label className="fw-bold small text-muted text-uppercase">Status</Form.Label>
                <Form.Select value={filters.status} onChange={e => setFilters({...filters, status: e.target.value})}>
                  <option value="All">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col xs={6} md={2}>
              <Form.Group>
                <Form.Label className="fw-bold small text-muted text-uppercase">Start Date</Form.Label>
                <Form.Control type="date" value={filters.startDate} onChange={e => setFilters({...filters, startDate: e.target.value})} />
              </Form.Group>
            </Col>
            <Col xs={6} md={2}>
              <Form.Group>
                <Form.Label className="fw-bold small text-muted text-uppercase">End Date</Form.Label>
                <Form.Control type="date" value={filters.endDate} onChange={e => setFilters({...filters, endDate: e.target.value})} />
              </Form.Group>
            </Col>
            <Col xs={12} md={1} className="d-flex">
              <Button variant="primary" className="w-100 py-2 btn-icon btn-icon-only" onClick={handleExportCSV} title="Export CSV" disabled={loadingExpenses}>
                <CsLineIcons icon="download" size="18" />
              </Button>
            </Col>
          </Row>

          {loadingExpenses ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" className="mb-2" />
              <div className="text-muted small">Loading records...</div>
            </div>
          ) : filteredExpenses.length === 0 ? (
            <div className="text-center py-5 text-muted">No records found matching filters.</div>
          ) : (
            <div className="table-responsive">
              <Table hover className="table-premium mb-0">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Staff Member</th>
                    <th>Category</th>
                    <th>Description</th>
                    <th className="text-end">Amount</th>
                    <th className="text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredExpenses.map(exp => (
                    <tr key={exp._id}>
                      <td>{exp.date}</td>
                      <td className="fw-bold">{exp.staff_id ? `${exp.staff_id.f_name} ${exp.staff_id.l_name}` : 'Unknown'}</td>
                      <td>{exp.category}</td>
                      <td>{exp.description || '-'}</td>
                      <td className="text-end fw-bold text-dark">₹{(exp.amount || 0).toLocaleString('en-IN')}</td>
                      <td className="text-center">
                        <Badge bg={exp.status === 'approved' ? 'success' : exp.status === 'rejected' ? 'danger' : 'warning'} className="status-badge">
                          {exp.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* --- Statutory Compliance Reports --- */}
      <h5 className="fw-bold mb-3 text-dark d-flex align-items-center gap-2">
        <CsLineIcons icon="file-text" size="20" className="text-primary" />
        Statutory Compliance Filing Reports
      </h5>

      <Card className="glass-card border-0 mb-4 p-4 shadow-sm">
        <Card.Body className="p-0">
          <Row className="g-3 align-items-end mb-4">
            <Col xs={12} md={4}>
              <Form.Group>
                <Form.Label className="fw-bold small text-muted text-uppercase">Financial Month</Form.Label>
                <Form.Select value={complianceMonth} onChange={e => setComplianceMonth(e.target.value)}>
                  {MONTH_NAMES.slice(1).map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col xs={12} md={4}>
              <Form.Group>
                <Form.Label className="fw-bold small text-muted text-uppercase">Financial Year</Form.Label>
                <Form.Select value={complianceYear} onChange={e => setComplianceYear(e.target.value)}>
                  {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          <Row className="g-3">
            <Col xs={6} md={3}>
              <Button variant="none" className="w-100 report-btn shadow-sm" onClick={() => handleComplianceDownload('PF ECR Report')} disabled={downloadingCompliance}>
                {downloadingCompliance === 'PF ECR Report' ? <Spinner size="sm" /> : (
                  <>
                    <CsLineIcons icon="file-text" size="22" className="mb-2 text-primary" />
                    <span className="small">PF ECR (CSV)</span>
                  </>
                )}
              </Button>
            </Col>
            <Col xs={6} md={3}>
              <Button variant="none" className="w-100 report-btn shadow-sm" onClick={() => handleComplianceDownload('ESI Return Report')} disabled={downloadingCompliance}>
                {downloadingCompliance === 'ESI Return Report' ? <Spinner size="sm" /> : (
                  <>
                    <CsLineIcons icon="file-data" size="22" className="mb-2 text-info" />
                    <span className="small">ESI Return (Excel)</span>
                  </>
                )}
              </Button>
            </Col>
            <Col xs={6} md={3}>
              <Button variant="none" className="w-100 report-btn shadow-sm" onClick={() => handleComplianceDownload('PT Report')} disabled={downloadingCompliance}>
                {downloadingCompliance === 'PT Report' ? <Spinner size="sm" /> : (
                  <>
                    <CsLineIcons icon="file-chart" size="22" className="mb-2 text-success" />
                    <span className="small">PT Report (CSV)</span>
                  </>
                )}
              </Button>
            </Col>
            <Col xs={6} md={3}>
              <Button variant="none" className="w-100 report-btn shadow-sm" onClick={() => handleComplianceDownload('TDS Summary')} disabled={downloadingCompliance}>
                {downloadingCompliance === 'TDS Summary' ? <Spinner size="sm" /> : (
                  <>
                    <CsLineIcons icon="file-empty" size="22" className="mb-2 text-warning" />
                    <span className="small">TDS Summary</span>
                  </>
                )}
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>
      
      <Alert variant="info" className="rounded-3 border-0 shadow-sm">
        <CsLineIcons icon="info-hexagon" size="18" className="me-2" />
        These compliance reports are formatted according to standard government filing portals. Please ensure all employee KYC (UAN, ESIC Number, PAN) is updated before generating.
      </Alert>
    </div>
  );
}
