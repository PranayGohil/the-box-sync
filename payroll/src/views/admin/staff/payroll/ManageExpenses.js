import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Form, Spinner, Badge, Table, Modal } from 'react-bootstrap';
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
  .react-table-modern th {
    background: #f8fafc !important;
    color: #475569 !important;
    font-weight: 600 !important;
    text-transform: uppercase !important;
    font-size: 0.8rem !important;
    padding: 1rem 1.5rem !important;
    border-bottom: 2px solid #e2e8f0 !important;
  }
  .react-table-modern td {
    padding: 1.25rem 1.5rem !important;
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
`;

export default function ManageExpenses() {
  const title = 'Manage Expenses';
  const description = 'Approve or reject staff expense claims';
  const breadcrumbs = [
    { to: '', text: 'Home' },
    { to: 'expenses', text: 'Expenses' },
    { to: 'expenses/manage', text: 'Manage' },
  ];

  const [loading, setLoading] = useState(false);
  const [expenses, setExpenses] = useState([]);

  useEffect(() => {
    // Fetch expenses from API here
    // setExpenses(data);
  }, []);

  const handleStatusChange = (id, newStatus) => {
    setExpenses(prev => prev.map(exp => exp.id === id ? { ...exp, status: newStatus } : exp));
    toast.success(`Expense ${newStatus} successfully!`);
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
        </Row>
      </div>

      <Card className="glass-card border-0">
        <Card.Body className="p-0">
          {/* Desktop Table View */}
          <div className="table-responsive d-none d-lg-block">
            <Table hover className="react-table-modern mb-0">
              <thead>
                <tr>
                  <th>Staff Member</th>
                  <th>Category</th>
                  <th>Date</th>
                  <th className="text-end">Amount</th>
                  <th className="text-center">Receipt</th>
                  <th className="text-center">Status</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map(exp => (
                  <tr key={exp.id}>
                    <td className="fw-bold">{exp.staffName}</td>
                    <td>{exp.category}</td>
                    <td>{exp.date}</td>
                    <td className="text-end fw-bold text-dark">₹{exp.amount}</td>
                    <td className="text-center">
                      {exp.receipt ? (
                        <Button variant="link" size="sm" className="p-0"><CsLineIcons icon="image" size="18" /></Button>
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
                          <Button variant="outline-success" size="sm" onClick={() => handleStatusChange(exp.id, 'approved')}>
                            <CsLineIcons icon="check" size="14" />
                          </Button>
                          <Button variant="outline-danger" size="sm" onClick={() => handleStatusChange(exp.id, 'rejected')}>
                            <CsLineIcons icon="close" size="14" />
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>

          {/* Mobile Card View */}
          <div className="d-lg-none p-3 bg-light">
            {expenses.length === 0 ? (
              <div className="text-center py-4 text-muted">No expenses found.</div>
            ) : (
              expenses.map(exp => (
                <Card key={exp.id} className="border-0 shadow-sm mb-3" style={{ borderRadius: '1rem' }}>
                  <Card.Body className="p-3">
                    <div className="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom border-light">
                      <div className="fw-bold text-dark">{exp.staffName}</div>
                      <Badge bg={exp.status === 'approved' ? 'success' : exp.status === 'rejected' ? 'danger' : 'warning'} className="status-badge">
                        {exp.status}
                      </Badge>
                    </div>
                    <div className="mb-2">
                      <span className="text-muted small">Category: </span>
                      <span className="fw-medium">{exp.category}</span>
                    </div>
                    <div className="mb-2">
                      <span className="text-muted small">Date: </span>
                      <span className="fw-medium">{exp.date}</span>
                    </div>
                    <div className="mb-3 d-flex justify-content-between align-items-center">
                      <div>
                        <span className="text-muted small">Amount: </span>
                        <span className="fw-bold text-dark">₹{exp.amount}</span>
                      </div>
                      {exp.receipt && (
                        <Button variant="link" size="sm" className="p-0 text-primary">
                          <CsLineIcons icon="image" size="18" className="me-1" /> Receipt
                        </Button>
                      )}
                    </div>
                    {exp.status === 'pending' && (
                      <div className="d-flex gap-2 pt-2 border-top border-light">
                        <Button variant="outline-success" className="w-100 rounded-pill" size="sm" onClick={() => handleStatusChange(exp.id, 'approved')}>
                          <CsLineIcons icon="check" size="14" className="me-1" /> Approve
                        </Button>
                        <Button variant="outline-danger" className="w-100 rounded-pill" size="sm" onClick={() => handleStatusChange(exp.id, 'rejected')}>
                          <CsLineIcons icon="close" size="14" className="me-1" /> Reject
                        </Button>
                      </div>
                    )}
                  </Card.Body>
                </Card>
              ))
            )}
          </div>
        </Card.Body>
      </Card>
    </div>
  );
}
