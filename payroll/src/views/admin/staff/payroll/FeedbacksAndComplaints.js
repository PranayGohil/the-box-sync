import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Form, Spinner, Badge, Table, Modal } from 'react-bootstrap';
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import { toast } from 'react-toastify';
import axios from 'axios';
import { format } from 'date-fns';
import { enIN } from 'date-fns/locale';
import useCustomLayout from 'hooks/useCustomLayout';
import { LAYOUT } from 'constants.js';

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
  useCustomLayout({ layout: LAYOUT.Boxed });
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
        // Update activeItem state
        setActiveItem(res.data.data);
        // Reset input
        setReplyText('');
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
    return format(d, 'dd/MM/yyyy', { locale: enIN });
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

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2 text-muted small">Loading feedback submissions...</p>
        </div>
      ) : (
        <Row className="g-3">
          {/* LEFT COLUMN: Feedbacks List / Chats List (3/12 width) */}
          <Col xs={12} md={4} lg={3}>
            <Card className="glass-card border-0 h-100 d-flex flex-column" style={{ maxHeight: '78vh', minHeight: '500px' }}>
              {/* Sidebar Header & Search */}
              <div className="p-3 border-bottom bg-light" style={{ borderTopLeftRadius: '1.5rem', borderTopRightRadius: '1.5rem' }}>
                <Form.Group className="mb-2">
                  <Form.Control
                    type="text"
                    placeholder="Search chats..."
                    style={{ borderRadius: '20px', fontSize: '0.85rem' }}
                    value={filters.search}
                    onChange={e => setFilters({ ...filters, search: e.target.value })}
                  />
                </Form.Group>

                {/* Simple quick filters */}
                <div className="d-flex gap-1 overflow-auto pb-1 mt-2">
                  <Badge
                    bg={filters.status === 'All' ? 'primary' : 'light'}
                    className={`text-${filters.status === 'All' ? 'white' : 'dark'} rounded-pill px-2.5 py-1.5 cursor-pointer`}
                    style={{ fontSize: '0.68rem', cursor: 'pointer' }}
                    onClick={() => setFilters({ ...filters, status: 'All' })}
                  >
                    All
                  </Badge>
                  <Badge
                    bg={filters.status === 'open' ? 'warning' : 'light'}
                    className={`text-${filters.status === 'open' ? 'white' : 'dark'} rounded-pill px-2.5 py-1.5 cursor-pointer`}
                    style={{ fontSize: '0.68rem', cursor: 'pointer' }}
                    onClick={() => setFilters({ ...filters, status: 'open' })}
                  >
                    Open
                  </Badge>
                  <Badge
                    bg={filters.status === 'reviewed' ? 'info' : 'light'}
                    className={`text-${filters.status === 'reviewed' ? 'white' : 'dark'} rounded-pill px-2.5 py-1.5 cursor-pointer`}
                    style={{ fontSize: '0.68rem', cursor: 'pointer' }}
                    onClick={() => setFilters({ ...filters, status: 'reviewed' })}
                  >
                    Reviewed
                  </Badge>
                  <Badge
                    bg={filters.status === 'resolved' ? 'success' : 'light'}
                    className={`text-${filters.status === 'resolved' ? 'white' : 'dark'} rounded-pill px-2.5 py-1.5 cursor-pointer`}
                    style={{ fontSize: '0.68rem', cursor: 'pointer' }}
                    onClick={() => setFilters({ ...filters, status: 'resolved' })}
                  >
                    Resolved
                  </Badge>
                </div>
              </div>

              {/* Sidebar Scrollable Chats List */}
              <div className="flex-grow-1 overflow-auto p-2" style={{ maxHeight: 'calc(78vh - 110px)' }}>
                {filteredList.map(item => {
                  const isActive = activeItem && activeItem._id === item._id;
                  const displayName = item.is_anonymous ? 'Anonymous Employee' : `${item.staff_id?.f_name} ${item.staff_id?.l_name}`;
                  const shortMsg = item.title;

                  return (
                    <div
                      key={item._id}
                      className={`d-flex align-items-center p-3 mb-2 rounded-3 cursor-pointer transition-all ${isActive ? 'bg-soft-primary border-primary' : 'bg-light hover-bg'}`}
                      style={{
                        cursor: 'pointer',
                        borderLeft: `4px solid ${isActive ? '#1ea8e7' : item.type === 'complaint' ? '#ef4444' : '#1ea8e7'}`,
                        backgroundColor: isActive ? '#f0f9ff' : ''
                      }}
                      onClick={() => {
                        setActiveItem(item);
                        setReplyText(item.hr_reply || '');
                        setStatusVal(item.status === 'open' ? 'reviewed' : item.status);
                      }}
                    >
                      {/* Avatar */}
                      <div
                        className="rounded-circle d-flex align-items-center justify-content-center me-3 text-white fw-bold"
                        style={{
                          width: '40px',
                          height: '40px',
                          minWidth: '40px',
                          backgroundColor: item.type === 'complaint' ? '#ef4444' : '#1ea8e7',
                          fontSize: '1rem'
                        }}
                      >
                        {displayName.charAt(0)}
                      </div>

                      {/* Details preview */}
                      <div className="flex-grow-1 min-w-0">
                        <div className="d-flex justify-content-between align-items-baseline">
                          <h6 className="fw-bold text-dark mb-0 text-truncate" style={{ fontSize: '0.85rem' }}>{displayName}</h6>
                          <span className="text-muted" style={{ fontSize: '0.62rem' }}>
                            {formatDate(item.createdAt)}
                          </span>
                        </div>
                        <p className="text-muted mb-0 text-truncate small" style={{ fontSize: '0.78rem' }}>{shortMsg}</p>
                        <div className="d-flex align-items-center justify-content-between mt-1">
                          <Badge bg={item.type === 'complaint' ? 'danger' : 'info'} className="text-white text-uppercase" style={{ fontSize: '0.55rem' }}>
                            {item.type}
                          </Badge>
                          <Badge bg={getStatusBadgeColor(item.status)} style={{ fontSize: '0.62rem' }} className="text-white">
                            {item.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {filteredList.length === 0 && (
                  <div className="text-center py-4 text-muted small">No conversations found.</div>
                )}
              </div>
            </Card>
          </Col>

          {/* MIDDLE COLUMN: Chat Window (6/12 width) */}
          <Col xs={12} md={8} lg={6}>
            {activeItem ? (
              <Card className="glass-card border-0 h-100 d-flex flex-column" style={{ maxHeight: '78vh', minHeight: '500px' }}>
                {/* Active Chat Header */}
                <div className="p-3 border-bottom d-flex align-items-center justify-content-between bg-white" style={{ borderTopLeftRadius: '1.5rem', borderTopRightRadius: '1.5rem' }}>
                  <div className="d-flex align-items-center">
                    <div
                      className="rounded-circle d-flex align-items-center justify-content-center me-3 text-white fw-bold"
                      style={{
                        width: '40px',
                        height: '40px',
                        backgroundColor: activeItem.type === 'complaint' ? '#ef4444' : '#1ea8e7',
                        fontSize: '1.1rem'
                      }}
                    >
                      {activeItem.is_anonymous ? 'A' : activeItem.staff_id?.f_name?.charAt(0)}
                    </div>
                    <div>
                      <h6 className="fw-bold text-dark mb-0">
                        {activeItem.is_anonymous ? 'Anonymous Employee' : `${activeItem.staff_id?.f_name} ${activeItem.staff_id?.l_name}`}
                      </h6>
                      <span className="text-muted" style={{ fontSize: '0.72rem' }}>
                        Subject: {activeItem.title}
                      </span>
                    </div>
                  </div>
                  <Badge bg={activeItem.type === 'complaint' ? 'danger' : 'info'} className="text-white text-uppercase px-3 py-1.5" style={{ fontSize: '0.7rem' }}>
                    {activeItem.type}
                  </Badge>
                </div>

                {/* Chat Body */}
                <div
                  className="p-3 d-flex flex-column gap-3 overflow-auto flex-grow-1"
                  style={{
                    backgroundColor: '#efeae2',
                    backgroundImage: 'radial-gradient(rgba(0,0,0,0.03) 1px, transparent 0)',
                    backgroundSize: '16px 16px',
                    maxHeight: 'calc(78vh - 145px)',
                    overflowY: 'auto'
                  }}
                >
                  <div className="align-self-center my-1 bg-white shadow-sm rounded px-3 py-1 text-muted" style={{ fontSize: '0.7rem', fontWeight: '500' }}>
                    {formatDate(activeItem.createdAt)}
                  </div>

                  {(() => {
                    const messages = [
                      {
                        sender: 'employee',
                        message: activeItem.description,
                        timestamp: activeItem.createdAt,
                        sender_name: activeItem.is_anonymous ? 'Anonymous Employee' : `${activeItem.staff_id?.f_name} ${activeItem.staff_id?.l_name}`
                      }
                    ];

                    if (activeItem.hr_reply) {
                      messages.push({
                        sender: 'hr',
                        message: activeItem.hr_reply,
                        timestamp: activeItem.replied_at || activeItem.createdAt,
                        sender_name: `HR (${activeItem.replied_by || 'HR Manager'})`
                      });
                    }

                    if (activeItem.conversations && activeItem.conversations.length > 0) {
                      activeItem.conversations.forEach(c => {
                        messages.push({
                          sender: c.sender,
                          message: c.message,
                          timestamp: c.timestamp,
                          sender_name: c.sender === 'employee'
                            ? (activeItem.is_anonymous ? 'Anonymous Employee' : `${activeItem.staff_id?.f_name} ${activeItem.staff_id?.l_name}`)
                            : `HR (${c.sender_name || 'HR Reply'})`
                        });
                      });
                    }

                    messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

                    return messages.map((msg, msgIdx) => {
                      const isOutgoing = msg.sender === 'hr';
                      return (
                        <div
                          key={msgIdx}
                          className={`shadow-sm position-relative d-flex flex-column ${isOutgoing ? 'align-self-end' : 'align-self-start'}`}
                          style={{
                            maxWidth: '85%',
                            minWidth: '140px',
                            width: 'fit-content',
                            backgroundColor: isOutgoing ? '#d9fdd3' : '#ffffff',
                            borderRadius: isOutgoing ? '12px 12px 0 12px' : '12px 12px 12px 0',
                            color: '#111b21',
                            fontSize: '0.85rem',
                            padding: '8px 12px 6px 12px',
                            boxShadow: '0 1px 0.5px rgba(11,20,26,0.13)'
                          }}
                        >
                          <div className="fw-bold mb-1" style={{ fontSize: '0.72rem', color: isOutgoing ? '#0b3c1b' : '#0275d8' }}>
                            {isOutgoing ? 'Me (HR)' : msg.sender_name}
                          </div>
                          <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.4', wordBreak: 'break-word' }}>{msg.message}</div>
                          <div
                            className="d-flex align-items-center justify-content-end text-muted mt-1 align-self-end"
                            style={{ fontSize: '0.68rem', gap: '3px' }}
                          >
                            <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            {isOutgoing && (
                              <>
                                {activeItem.status === 'reviewed' && (
                                  <span style={{ fontSize: '0.9rem', lineHeight: 1, color: '#8696a0', fontWeight: 'bold' }}>✓✓</span>
                                )}
                                {activeItem.status === 'resolved' && (
                                  <span style={{ fontSize: '0.9rem', lineHeight: 1, color: '#53bdeb', fontWeight: 'bold' }}>✓✓</span>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>

                {/* Reply Footer Form */}
                <div className="p-3 border-top bg-light" style={{ borderBottomLeftRadius: '1.5rem', borderBottomRightRadius: '1.5rem' }}>
                  <Form onSubmit={handleReplySubmit}>
                    <Row className="g-2 align-items-center">
                      <Col xs={12} sm>
                        <Form.Control
                          type="text"
                          placeholder="Type an official HR response..."
                          style={{ borderRadius: '24px', fontSize: '0.85rem' }}
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                        />
                      </Col>
                      <Col xs="auto" style={{ width: '130px' }}>
                        <Form.Select
                          value={statusVal}
                          style={{ borderRadius: '20px', fontSize: '0.8rem', height: '36px' }}
                          onChange={(e) => setStatusVal(e.target.value)}
                        >
                          <option value="reviewed">Reviewed</option>
                          <option value="resolved">Resolved</option>
                        </Form.Select>
                      </Col>
                      <Col xs="auto">
                        <Button
                          variant="primary"
                          type="submit"
                          disabled={submitLoading}
                          className="d-flex align-items-center justify-content-center p-0 rounded-circle"
                          style={{ width: '36px', height: '36px', minWidth: '36px' }}
                        >
                          <CsLineIcons icon="chevron-right" size="18" className="text-white" />
                        </Button>
                      </Col>
                    </Row>
                  </Form>
                </div>
              </Card>
            ) : (
              <Card className="glass-card border-0 h-100 d-flex flex-column align-items-center justify-content-center text-center p-5" style={{ maxHeight: '78vh', minHeight: '500px' }}>
                <div
                  className="rounded-circle bg-light d-flex align-items-center justify-content-center mb-4"
                  style={{ width: '80px', height: '80px' }}
                >
                  <CsLineIcons icon="message" size="36" className="text-primary" />
                </div>
                <h5 className="fw-bold text-dark">Support Center</h5>
                <p className="text-muted small px-lg-5">
                  Select a feedback or complaint thread from the list on the left to start viewing conversation logs and reply directly to staff members.
                </p>
              </Card>
            )}
          </Col>

          {/* RIGHT COLUMN: Employee Profile Details (3/12 width) */}
          <Col xs={12} md={12} lg={3} className="d-none d-lg-block">
            <Card className="glass-card border-0 h-100 d-flex flex-column p-4" style={{ maxHeight: '78vh', minHeight: '500px' }}>
              {activeItem ? (
                <div className="text-center">
                  <h6 className="small text-muted text-uppercase fw-bold mb-4 text-start">Employee Profile</h6>

                  {/* Photo / Initial */}
                  <div className="d-flex justify-content-center mb-3">
                    {activeItem.is_anonymous ? (
                      <div
                        className="rounded-circle d-flex align-items-center justify-content-center bg-secondary text-white fw-bold"
                        style={{ width: '80px', height: '80px', fontSize: '2rem' }}
                      >
                        ?
                      </div>
                    ) : (
                      activeItem.staff_id?.photo ? (
                        <img
                          src={`${process.env.REACT_APP_API}/uploads/${activeItem.staff_id.photo}`}
                          alt="Profile"
                          className="rounded-circle object-cover border"
                          style={{ width: '80px', height: '80px', objectFit: 'cover' }}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = '';
                            e.target.className = 'd-none';
                          }}
                        />
                      ) : (
                        <div
                          className="rounded-circle d-flex align-items-center justify-content-center bg-primary text-white fw-bold"
                          style={{ width: '80px', height: '80px', fontSize: '2rem' }}
                        >
                          {activeItem.staff_id?.f_name?.charAt(0)}
                        </div>
                      )
                    )}
                  </div>

                  <h5 className="fw-bold text-dark mb-1">
                    {activeItem.is_anonymous ? 'Anonymous Employee' : `${activeItem.staff_id?.f_name} ${activeItem.staff_id?.l_name}`}
                  </h5>
                  <p className="text-muted small mb-4">{activeItem.is_anonymous ? 'Position Hidden' : activeItem.staff_id?.position || 'Staff member'}</p>

                  <hr className="my-3" />

                  <div className="text-start space-y-3">
                    <div className="mb-3">
                      <span className="text-muted d-block small" style={{ fontSize: '0.72rem' }}>EMAIL ADDRESS</span>
                      <span className="text-dark small fw-semibold">{activeItem.is_anonymous ? 'Hidden for privacy' : activeItem.staff_id?.email || '—'}</span>
                    </div>

                    <div className="mb-3">
                      <span className="text-muted d-block small" style={{ fontSize: '0.72rem' }}>STAFF PORTAL ID</span>
                      <span className="text-dark small fw-semibold">{activeItem.is_anonymous ? 'ANON' : activeItem.staff_id?.staff_id || '—'}</span>
                    </div>

                    <div className="mb-3">
                      <span className="text-muted d-block small" style={{ fontSize: '0.72rem' }}>SUBMISSION DATE</span>
                      <span className="text-dark small fw-semibold">{formatDate(activeItem.createdAt)}</span>
                    </div>

                    <div>
                      <span className="text-muted d-block small" style={{ fontSize: '0.72rem' }}>THREAD STATUS</span>
                      <Badge bg={getStatusBadgeColor(activeItem.status)} className="mt-1 text-white">
                        {activeItem.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-100 d-flex align-items-center justify-content-center text-center text-muted small">
                  No employee selected
                </div>
              )}
            </Card>
          </Col>
        </Row>
      )}
    </div>
  );
}
