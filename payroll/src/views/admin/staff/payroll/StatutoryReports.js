import React, { useState } from 'react';
import { Row, Col, Card, Button, Form, Spinner, Alert } from 'react-bootstrap';
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import { toast } from 'react-toastify';

const customStyles = `
  .glass-card {
    background: #ffffff !important;
    border: 1px solid #f0f0f0 !important;
    border-radius: 1.5rem !important;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.04) !important;
  }
  .report-btn {
    height: 100px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    border-radius: 1rem;
    font-weight: 600;
    transition: all 0.3s ease;
  }
  .report-btn:hover {
    transform: translateY(-3px);
    box-shadow: 0 10px 20px rgba(0,0,0,0.08);
  }
`;

export default function StatutoryReports() {
  const title = 'Statutory Reports';
  const description = 'Generate and download PF, ESI, PT, and TDS compliance reports';
  const breadcrumbs = [
    { to: '', text: 'Home' },
    { to: 'expenses', text: 'Expenses' },
    { to: 'expenses/reports', text: 'Statutory Reports' },
  ];

  const currentDate = new Date();
  const [month, setMonth] = useState(currentDate.getMonth() + 1);
  const [year, setYear] = useState(currentDate.getFullYear());
  const [loading, setLoading] = useState(false);

  const handleDownload = (reportType) => {
    setLoading(true);
    // Simulate API call to generate CSV
    setTimeout(() => {
      toast.success(`${reportType} downloaded successfully!`);
      setLoading(false);
    }, 1500);
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

      <Card className="glass-card border-0 mb-4 p-4">
        <Card.Body>
          <Row className="g-3 align-items-end mb-5">
            <Col xs={12} md={4}>
              <Form.Group>
                <Form.Label className="fw-bold">Financial Month</Form.Label>
                <Form.Select value={month} onChange={e => setMonth(e.target.value)}>
                  {MONTH_NAMES.slice(1).map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col xs={12} md={4}>
              <Form.Group>
                <Form.Label className="fw-bold">Financial Year</Form.Label>
                <Form.Select value={year} onChange={e => setYear(e.target.value)}>
                  {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          <Row className="g-4">
            <Col xs={6} md={3}>
              <Button variant="outline-primary" className="w-100 report-btn" onClick={() => handleDownload('PF ECR Report')} disabled={loading}>
                <CsLineIcons icon="file-text" size="24" className="mb-2" />
                PF ECR (CSV)
              </Button>
            </Col>
            <Col xs={6} md={3}>
              <Button variant="outline-info" className="w-100 report-btn" onClick={() => handleDownload('ESI Return Report')} disabled={loading}>
                <CsLineIcons icon="file-data" size="24" className="mb-2" />
                ESI Return (Excel)
              </Button>
            </Col>
            <Col xs={6} md={3}>
              <Button variant="outline-success" className="w-100 report-btn" onClick={() => handleDownload('PT Report')} disabled={loading}>
                <CsLineIcons icon="file-chart" size="24" className="mb-2" />
                PT Report (CSV)
              </Button>
            </Col>
            <Col xs={6} md={3}>
              <Button variant="outline-warning" className="w-100 report-btn" onClick={() => handleDownload('TDS Summary')} disabled={loading}>
                <CsLineIcons icon="file-empty" size="24" className="mb-2" />
                TDS Summary
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>
      
      <Alert variant="info" className="rounded-3 shadow-sm border-0">
        <CsLineIcons icon="info-hexagon" size="18" className="me-2" />
        These reports are formatted according to standard government filing portals. Please ensure all employee KYC (UAN, ESIC Number, PAN) is updated before generating.
      </Alert>
    </div>
  );
}
