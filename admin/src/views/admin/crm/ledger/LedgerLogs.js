import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Form, Button } from 'react-bootstrap';
import axios from 'axios';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import HtmlHead from 'components/html-head/HtmlHead';

const formatDate = (isoString) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}`;
};

const LedgerLogs = () => {
  const token = localStorage.getItem('token');
  const [history, setHistory] = useState([]);

  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(firstDay);
  const [endDate, setEndDate] = useState(lastDay);
  const [auditType, setAuditType] = useState('ALL');

  const fetchTransactions = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API}/loyalty/transactions`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { startDate, endDate, auditType }
      });
      if (res.data.success) {
        setHistory(res.data.data);
      }
    } catch (err) {
      console.error('Error loading transactions:', err);
    }
  };

  useEffect(() => {
    if (token) {
      fetchTransactions();
    }
  }, [token, startDate, endDate, auditType]);

  return (
    <>
      <HtmlHead title="Ledger Logs" description="Loyalty Transaction Audit Ledger" />
      <style>{`
        /* Premium Adaptive Glass Cards */
        .crm-glass-card {
          background: var(--card-bg, rgba(255, 255, 255, 0.85)) !important;
          backdrop-filter: blur(12px) !important;
          -webkit-backdrop-filter: blur(12px) !important;
          border: 1px solid var(--border-color, rgba(226, 232, 240, 0.4)) !important;
          border-radius: 20px !important;
          box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.05) !important;
        }
        .crm-text-heading { color: var(--heading-color, #1e293b); }
        .crm-text-body { color: var(--body-color, #475569); }
        .crm-text-muted { color: var(--muted-color, #94a3b8); }
        .crm-text-primary { color: var(--primary-color, #1ea8e7); }
        .crm-table {
          --bs-table-bg: transparent;
          --bs-table-striped-bg: rgba(241, 245, 249, 0.5);
          border-collapse: separate;
          border-spacing: 0 8px;
        }
        .crm-table tbody tr {
          background: var(--card-bg, #ffffff);
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.02);
          border-radius: 12px;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .crm-table tbody tr:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
        }
        .crm-table td {
          border: none;
          padding: 1rem 1.25rem;
          vertical-align: middle;
        }
        .crm-table td:first-child { border-top-left-radius: 12px; border-bottom-left-radius: 12px; }
        .crm-table td:last-child { border-top-right-radius: 12px; border-bottom-right-radius: 12px; }
        .crm-table th {
          border: none;
          color: var(--muted-color, #64748b);
          font-weight: 600;
          text-transform: uppercase;
          font-size: 0.75rem;
          letter-spacing: 0.5px;
          padding: 0.75rem 1.25rem;
        }
      `}</style>

      <div className="page-title-container mb-3">
        <Row>
          <Col className="mb-2">
            <h1 className="mb-2 pb-0 display-4" id="title">Ledger Logs</h1>
          </Col>
        </Row>
      </div>

      <Card className="crm-glass-card p-4 border-0 mb-4 shadow-sm">
        <div className="sales-report-card-title-container d-flex justify-content-between align-items-center mb-4">
          <h5 className="mb-0 fw-bold" style={{ color: '#1ea8e7' }}>
            Report Filters
          </h5>
          <CsLineIcons icon="filter" size="18" style={{ color: '#1ea8e7' }} />
        </div>
        <Row className="g-3 align-items-end">
          <Col xs={12} md={3}>
            <Form.Group>
              <Form.Label className="mb-2 text-muted" style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.5px' }}>START DATE</Form.Label>
              <Form.Control type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
            </Form.Group>
          </Col>
          <Col xs={12} md={3}>
            <Form.Group>
              <Form.Label className="mb-2 text-muted" style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.5px' }}>END DATE</Form.Label>
              <Form.Control type="date" value={endDate} min={startDate} onChange={e => setEndDate(e.target.value)} />
            </Form.Group>
          </Col>
          <Col xs={12} md={3}>
            <Form.Group>
              <Form.Label className="mb-2 text-muted" style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.5px' }}>AUDIT TYPE</Form.Label>
              <Form.Select value={auditType} onChange={e => setAuditType(e.target.value)}>
                <option value="ALL">All Types</option>
                <option value="EARN">Earn</option>
                <option value="REDEEM">Redeem</option>
                <option value="BONUS">Bonus / Campaign</option>
              </Form.Select>
            </Form.Group>
          </Col>
        </Row>
      </Card>

      <Card className="crm-glass-card p-4 border-0">
        <div className="crm-section-header mb-4">
          <h4 className="fw-bold crm-text-heading m-0 d-flex align-items-center gap-2">
            <CsLineIcons icon="list" className="crm-text-primary" size="20" />
            Loyalty Transaction Audit Ledger
          </h4>
        </div>

        {history.length === 0 ? (
          <div className="text-center py-5 crm-text-body fw-medium">No points transaction audits recorded yet.</div>
        ) : (
          <Table responsive hover className="crm-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Customer Profile</th>
                <th>Mobile</th>
                <th>Audit Type</th>
                <th>Points Change</th>
                <th>Bill Subtotal</th>
                <th>Audit Context</th>
              </tr>
            </thead>
            <tbody>
              {history.map((log) => (
                <tr key={log._id}>
                  <td className="crm-text-muted">{formatDate(log.createdAt)}</td>
                  <td className="fw-medium crm-text-heading">{log.customer_id?.name || 'Walk-In Patron'}</td>
                  <td className="crm-text-body">{log.customer_id?.phone}</td>
                  <td>
                    <span
                      className={`badge rounded-pill px-3 py-2 ${log.type === 'EARN' ? 'bg-success text-white' : log.type === 'REDEEM' ? 'bg-danger text-white' : 'bg-info text-white'}`}
                    >
                      {log.type}
                    </span>
                  </td>
                  <td className={`fw-bold ${log.type === 'EARN' || log.type === 'BONUS' ? 'text-success' : 'text-danger'}`}>
                    {log.type === 'EARN' || log.type === 'BONUS' ? '+' : '-'}
                    {log.points} pts
                  </td>
                  <td className="crm-text-body">₹{log.amount}</td>
                  <td className="crm-text-body">{log.description}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </>
  );
};

export default LedgerLogs;