import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Form, Spinner, Badge, Table, Modal } from 'react-bootstrap';
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import { toast } from 'react-toastify';
import axios from 'axios';
import { format } from 'date-fns';
import { enIN } from 'date-fns/locale';

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
  .mobile-card {
    background: #fff;
    border-radius: 1.25rem;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.02);
    border: 1px solid #f1f5f9;
    padding: 1.25rem;
    margin-bottom: 1rem;
  }
`;

export default function FeedbacksAndComplaints() {
  const title = 'Feedback & Complaints';
  const description = 'Review suggestions, reports, or complaints submitted by staff';
  const breadcrumbs = [
    { to: '', text: 'Home' },
    { to: 'feedbacks', text: 'Feedback & Complaints' },
  ];

  const [loading, setLoading] = useState(false);
  const [list, setList] = useState([]);
  const [filteredList, setFilteredList] = useState([]);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [activeItem, setActiveItem] = useState(null);

  // HR Reply panel state
  const [replyText, setReplyText] = useState('');
  const [statusVal, setStatusVal] = useState('resolved');
  const [submitLoading, setSubmitLoading] = useState(false);

  // Filters state
  const [filters, setFilters] = useState({
    type: 'All',
    status: 'All',
    search: '',
  });

  const fetchFeedbacks = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${process.env.REACT_APP_API}/feedback/all`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.data.success) {
        setList(res.data.data);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to fetch feedbacks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  // Filter application logic
  useEffect(() => {
    let result = [...list];

    if (filters.type !== 'All') {
      result = result.filter(item => item.type === filters.type);
    }
    if (filters.status !== 'All') {
      result = result.filter(item => item.status === filters.status);
    }
    if (filters.search.trim()) {
      const q = filters.search.toLowerCase();
      result = result.filter(item => {
        const staffName = item.staff_id ? `${item.staff_id.f_name} ${item.staff_id.l_name}`.toLowerCase() : '';
        const titleText = item.title ? item.title.toLowerCase() : '';
        const descText = item.description ? item.description.toLowerCase() : '';
        return staffName.includes(q) || titleText.includes(q) || descText.includes(q);
      });
    }

    setFilteredList(result);
  }, [list, filters]);

  const handleResetFilters = () => {
    setFilters({
      type: 'All',
      status: 'All',
      search: '',
    });
  };

  const handleReplySubmit = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) {
      toast.error('Please enter a response.');
      return;
    }

    try {
      setSubmitLoading(true);
      const res = await axios.post(`${process.env.REACT_APP_API}/feedback/${activeItem._id}/reply`, {
        hr_reply: replyText,
        status: statusVal
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      if (res.data.success) {
        toast.success('Response submitted successfully!');
        // Update local items array
        setList(prev => prev.map(item => item._id === activeItem._id ? res.data.data : item));
        // Reset inputs & close modal
        setReplyText('');
        setShowDetailModal(false);
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to submit response.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    const d = new Date(dateString);
    return format(d, 'dd MMMM, yyyy', { locale: enIN });
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'resolved': return 'success';
      case 'reviewed': return 'info';
      default: return 'warning';
    }
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
                  placeholder="Employee name, title, description..." 
                  value={filters.search} 
                  onChange={e => setFilters({...filters, search: e.target.value})}
                />
              </Form.Group>
            </Col>
            <Col xs={6} md={4} lg>
              <Form.Group>
                <Form.Label className="small text-muted fw-bold text-uppercase mb-1">Type</Form.Label>
                <Form.Select className="filter-input-premium text-capitalize" value={filters.type} onChange={e => setFilters({...filters, type: e.target.value})}>
                  {['All', ...new Set(list.map(item => item.type))].map(t => (
                    <option key={t} value={t}>
                      {t === 'All' ? 'All Types' : t === 'feedback' ? 'Feedback / Suggestion' : t === 'complaint' ? 'Complaint' : t}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col xs={6} md={4} lg>
              <Form.Group>
                <Form.Label className="small text-muted fw-bold text-uppercase mb-1">Status</Form.Label>
                <Form.Select className="filter-input-premium" value={filters.status} onChange={e => setFilters({...filters, status: e.target.value})}>
                  <option value="All">All Status</option>
                  <option value="open">Open</option>
                  <option value="reviewed">Reviewed</option>
                  <option value="resolved">Resolved</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col xs={12} lg="auto" className="d-flex gap-2 justify-content-lg-end ms-lg-auto mt-3 mt-lg-0">
              <Button variant="outline-secondary" className="filter-btn-premium w-100 text-nowrap" onClick={handleResetFilters}>
                Clear Filters
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Card className="glass-card border-0">
        <Card.Body className="p-0">
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2 text-muted small">Loading feedback submissions...</p>
            </div>
          ) : (
            <>
              {/* Desktop & Tablet Table View */}
              <div className="table-responsive d-none d-md-block">
                <Table hover className="react-table-modern mb-0">
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Type</th>
                      <th>Subject / Title</th>
                      <th>Submission Date</th>
                      <th className="text-center">Status</th>
                      <th className="text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredList.map(item => (
                      <tr key={item._id}>
                        <td className="fw-bold">
                          <div className="d-flex align-items-center gap-2">
                            <span>
                              {item.is_anonymous ? 'Anonymous Employee' : `${item.staff_id?.f_name} ${item.staff_id?.l_name}`}
                            </span>
                            {item.is_anonymous && (
                              <Badge bg="secondary" style={{ fontSize: '0.65rem' }}>Anon</Badge>
                            )}
                          </div>
                        </td>
                        <td>
                          <Badge bg={item.type === 'complaint' ? 'danger' : 'info'} className="text-white text-uppercase" style={{ fontSize: '0.65rem' }}>
                            {item.type}
                          </Badge>
                        </td>
                        <td>{item.title}</td>
                        <td>{formatDate(item.createdAt)}</td>
                        <td className="text-center">
                          <Badge bg={getStatusBadgeColor(item.status)} className="status-badge text-white">
                            {item.status}
                          </Badge>
                        </td>
                        <td className="text-center">
                          <Button 
                            variant="outline-primary" 
                            size="sm" 
                            className="rounded-pill px-3"
                            onClick={() => {
                              setActiveItem(item);
                              setReplyText(item.hr_reply || '');
                              setStatusVal(item.status === 'open' ? 'reviewed' : item.status);
                              setShowDetailModal(true);
                            }}
                          >
                            <CsLineIcons icon="message" size="14" className="me-1" /> View & Reply
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {filteredList.length === 0 && (
                      <tr>
                        <td colSpan="6" className="text-center py-5 text-muted">
                          No feedbacks or complaints found matching the selected filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </div>

              {/* Mobile List Card View */}
              <div className="d-md-none p-3 bg-light" style={{ borderRadius: '0 0 1.5rem 1.5rem' }}>
                {filteredList.length === 0 ? (
                  <div className="text-center py-5 text-muted">No entries found.</div>
                ) : (
                  filteredList.map(item => (
                    <div key={item._id} className="mobile-card">
                      <div className="d-flex justify-content-between align-items-start mb-2 pb-2 border-bottom border-light">
                        <div>
                          <div className="fw-bold text-dark d-flex align-items-center gap-1">
                            <span>
                              {item.is_anonymous ? 'Anonymous Employee' : `${item.staff_id?.f_name} ${item.staff_id?.l_name}`}
                            </span>
                            {item.is_anonymous && (
                              <Badge bg="secondary" style={{ fontSize: '0.6rem' }}>Anon</Badge>
                            )}
                          </div>
                          <span className="text-muted small">{formatDate(item.createdAt)}</span>
                        </div>
                        <Badge bg={getStatusBadgeColor(item.status)} className="status-badge text-white">
                          {item.status}
                        </Badge>
                      </div>

                      <div className="small text-dark mb-2">
                        <span className="text-muted">Type: </span>
                        <Badge bg={item.type === 'complaint' ? 'danger' : 'info'} className="text-white text-uppercase" style={{ fontSize: '0.65rem' }}>
                          {item.type}
                        </Badge>
                      </div>

                      <div className="small text-dark mb-3">
                        <span className="text-muted">Subject: </span>
                        <span className="fw-bold">{item.title}</span>
                      </div>

                      <div className="text-center">
                        <Button 
                          variant="outline-primary" 
                          size="sm" 
                          className="w-100 rounded-pill"
                          onClick={() => {
                            setActiveItem(item);
                            setReplyText(item.hr_reply || '');
                            setStatusVal(item.status === 'open' ? 'reviewed' : item.status);
                            setShowDetailModal(true);
                          }}
                        >
                          <CsLineIcons icon="message" size="14" className="me-1" /> View & Respond
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </Card.Body>
      </Card>

      {/* View & Reply Details Modal */}
      <Modal show={showDetailModal} onHide={() => setShowDetailModal(false)} centered size="md">
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold text-primary">Feedback & Complaint Response</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          {activeItem ? (
            <div>
              {/* Employee profile details */}
              <div className="d-flex align-items-center justify-content-between mb-4 pb-3 border-bottom">
                <div>
                  <h6 className="fw-bold text-dark mb-0">
                    {activeItem.is_anonymous ? 'Anonymous Employee' : `${activeItem.staff_id?.f_name} ${activeItem.staff_id?.l_name}`}
                  </h6>
                  <span className="text-muted small">
                    {activeItem.is_anonymous ? `Position: ${activeItem.staff_id?.position || 'Staff'}` : activeItem.staff_id?.email}
                  </span>
                </div>
                <div className="text-end">
                  <Badge bg={activeItem.type === 'complaint' ? 'danger' : 'info'} className="text-white text-uppercase px-3 py-1">
                    {activeItem.type}
                  </Badge>
                  <div className="text-muted small mt-1" style={{ fontSize: '0.75rem' }}>{formatDate(activeItem.createdAt)}</div>
                </div>
              </div>

              {/* Title & Description */}
              <div className="mb-4">
                <div className="small text-muted text-uppercase fw-bold mb-1">Subject / Title</div>
                <div className="fw-bold text-dark">{activeItem.title}</div>
              </div>

              <div className="mb-4">
                <div className="small text-muted text-uppercase fw-bold mb-1">Detailed Explanation</div>
                <div className="bg-light p-3 rounded-3 text-dark small" style={{ whiteSpace: 'pre-wrap', lineHeight: '1.4' }}>
                  {activeItem.description}
                </div>
              </div>

              {/* Reply Form */}
              <Form onSubmit={handleReplySubmit} className="border-top pt-4">
                <h6 className="fw-bold text-dark mb-3">Submit HR Department Response</h6>
                
                <Form.Group className="mb-3">
                  <Form.Label className="small text-muted fw-bold text-uppercase">Response Text</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={4}
                    required
                    placeholder="Type the official HR response or action plan here..."
                    style={{ borderRadius: '8px', fontSize: '0.9rem' }}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                  />
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label className="small text-muted fw-bold text-uppercase">Resolution Status</Form.Label>
                  <Form.Select 
                    value={statusVal} 
                    style={{ height: '40px', borderRadius: '8px' }}
                    onChange={(e) => setStatusVal(e.target.value)}
                  >
                    <option value="reviewed">Reviewed (Action Pending)</option>
                    <option value="resolved">Resolved (Complete)</option>
                  </Form.Select>
                </Form.Group>

                <div className="d-flex justify-content-end gap-2">
                  <Button variant="light" className="rounded-pill px-4" onClick={() => setShowDetailModal(false)}>Cancel</Button>
                  <Button variant="primary" type="submit" className="rounded-pill px-4 shadow-sm" disabled={submitLoading}>
                    {submitLoading ? 'Saving response...' : 'Submit Response'}
                  </Button>
                </div>
              </Form>
            </div>
          ) : (
            <div className="text-center py-4 text-muted">No details loaded</div>
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
}
