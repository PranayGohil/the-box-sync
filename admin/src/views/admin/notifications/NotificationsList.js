import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Col, Row, Card, Button, Badge, Spinner, Alert, Modal } from 'react-bootstrap';
import { NavLink } from 'react-router-dom';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import { toast } from 'react-toastify';
import {
  fetchNotifications,
  markNotificationsRead,
  markSingleNotificationRead,
  deleteSingleNotification,
  clearAllNotifications,
} from 'layout/nav/notifications/notificationSlice';

const customStyles = `
  .border-dashed, .alert-light.border-dashed {
    border: 1.5px dashed #cbd5e1 !important;
    background-color: #fafafa !important;
    background: #fafafa !important;
    color: #64748b !important;
    font-weight: 600 !important;
    border-radius: 1rem !important;
  }
  .inventory-history-interactive-card {
    background: #ffffff !important;
    border-radius: 1.5rem !important;
    border: 1px solid rgba(0, 0, 0, 0.05) !important;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.03) !important;
    overflow: hidden;
    margin-bottom: 3rem;
  }
  .inventory-history-section-title-wrapper {
    display: flex;
    align-items: center;
    gap: 1.25rem;
    margin-bottom: 2rem;
  }
  .inventory-history-table-header-row {
    display: flex;
    padding: 0 1.5rem;
    margin-bottom: 1rem;
    background: #f8fafc;
    border-radius: 10px;
    padding: 1rem 1.5rem;
  }
  .inventory-history-table-header-col {
    color: #64748b;
    font-size: 0.7rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    user-select: none;
  }
  .inventory-history-inventory-row-card {
    background: #ffffff !important;
    border-radius: 1rem !important;
    border: 1px solid #f1f5f9 !important;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03) !important;
    margin-bottom: 1rem;
    transition: all 0.25s ease;
    display: flex;
    align-items: center;
    padding: 1.25rem 1.5rem !important;
  }
  .inventory-history-inventory-row-card:hover {
    transform: translateX(5px);
    border-color: #23b3f4 !important;
    box-shadow: 0 8px 20px rgba(35, 179, 244, 0.08) !important;
  }
  .inventory-history-col-val {
    font-weight: 600;
    color: #334155;
    font-size: 0.875rem;
  }
  .feedback-custom-btn-outline {
    border: 1.5px solid #23b3f4 !important;
    color: #23b3f4 !important;
    background-color: #fff !important;
    transition: all 0.2s ease-in-out !important;
    border-radius: 50px !important;
    font-weight: 600 !important;
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center;
  }
  .feedback-custom-btn-outline:hover {
    background-color: #23b3f4 !important;
    color: #fff !important;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(35, 179, 244, 0.25) !important;
  }
  .feedback-custom-btn-solid {
    background-color: #23b3f4 !important;
    border: 1px solid #23b3f4 !important;
    color: #fff !important;
    transition: all 0.2s ease-in-out !important;
    border-radius: 50px !important;
    font-weight: 600 !important;
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center;
  }
  .feedback-custom-btn-solid:hover {
    background-color: #179edb !important;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(35, 179, 244, 0.3) !important;
  }
  .feedback-custom-btn-danger-outline {
    border: 1.5px solid #cf2637 !important;
    color: #cf2637 !important;
    background-color: #fff !important;
    transition: all 0.2s ease-in-out !important;
    border-radius: 50px !important;
    font-weight: 600 !important;
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center;
  }
  .feedback-custom-btn-danger-outline:hover {
    background-color: #cf2637 !important;
    color: #fff !important;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(207, 38, 55, 0.25) !important;
  }
  .feedback-action-btn-circle {
    width: 36px !important;
    height: 36px !important;
    padding: 0 !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    border-radius: 50% !important;
    transition: all 0.3s ease !important;
    background: #fff !important;
    border: 1.5px solid #e2e8f0 !important;
    color: #64748b !important;
  }
  .feedback-action-btn-circle:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.08) !important;
  }
  .feedback-btn-reply-active {
    border-color: #23b3f4 !important;
    color: #23b3f4 !important;
  }
  .feedback-btn-reply-active:hover {
    background: #23b3f4 !important;
    color: #fff !important;
  }
  .feedback-btn-reply-active:hover svg {
    stroke: #fff !important;
  }
  .feedback-btn-delete-active {
    border-color: #cf2637 !important;
    color: #cf2637 !important;
  }
  .feedback-btn-delete-active:hover {
    background: #cf2637 !important;
    color: #fff !important;
  }
  .feedback-btn-delete-active:hover svg {
    stroke: #fff !important;
  }
  @media (max-width: 991px) {
    .inventory-history-table-header-row { display: none !important; }
    .inventory-history-inventory-row-card { flex-direction: column; align-items: flex-start; gap: 0.75rem; }
    .inventory-history-inventory-row-card > div { width: 100% !important; margin-bottom: 0.25rem; }
    .inventory-history-inventory-row-card .inventory-history-mobile-label { display: block !important; font-size: 0.65rem; color: #94a3b8; font-weight: 800; text-transform: uppercase; margin-bottom: 0.15rem; }
  }
  @media (min-width: 992px) {
    .inventory-history-inventory-row-card .inventory-history-mobile-label { display: none !important; }
  }
`;

const NotificationsList = () => {
  const title = 'Alert Notifications';
  const description = 'View and manage administrative notifications and alerts';

  const breadcrumbs = [
    { to: '', text: 'Home' },
    { to: 'notifications', title: 'Notifications' },
  ];

  const dispatch = useDispatch();
  const { items, status } = useSelector((state) => state.notification);

  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    dispatch(fetchNotifications());
  }, [dispatch]);

  const handleMarkAllRead = () => {
    dispatch(markNotificationsRead());
    toast.success('All notifications marked as read');
  };

  const handleDeleteAll = async () => {
    setClearing(true);
    try {
      await dispatch(clearAllNotifications());
      toast.success('All notifications deleted successfully');
      setShowDeleteAllModal(false);
    } catch (e) {
      toast.error('Failed to delete notifications');
    } finally {
      setClearing(false);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'new_inventory_request':
        return 'boxes';
      case 'web_order_recieved':
        return 'shopping-cart';
      default:
        return 'bell';
    }
  };

  const getNotificationLink = (item) => {
    if (item.type === 'new_inventory_request') {
      return '/operations/requested-inventory';
    }
    if (item.type === 'web_order_recieved') {
      return '/operations/order-history';
    }
    return '#/';
  };

  const getNotificationText = (item) => {
    if (item.type === 'new_inventory_request') {
      const itemsList = item.data?.items ? ` (${item.data.items})` : '';
      return `New inventory request from Manager${itemsList}!`;
    }
    if (item.type === 'web_order_recieved') {
      return `New web order received! Total: ₹${item.data?.total_amount || 0}`;
    }
    return `${item.sender || 'System'}: New ${item.type?.replace(/_/g, ' ') || 'alert'}`;
  };

  const formatNotificationTime = (dateStr) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (e) {
      return dateStr;
    }
  };

  const unreadCount = (items || []).filter((item) => !item.read).length;

  const columns = [
    { Header: 'Alert Type', flex: 0.8 },
    { Header: 'Notification Details', flex: 4.5 },
    { Header: 'Date & Time', flex: 2 },
    { Header: 'Status', flex: 1 },
    { Header: 'Actions', flex: 1.2, className: 'text-center' },
  ];

  return (
    <div className="inventory-container">
      <style>{customStyles}</style>
      <HtmlHead title={title} description={description} />
      <div className="container-fluid qsr-page-container">
        {/* Page Header */}
        <div className="qsr-page-title-container">
          <Row className="g-3 align-items-center">
            <Col xs="12" md="6">
              <h1 className="qsr-page-title">{title}</h1>
              <BreadcrumbList items={breadcrumbs} />
            </Col>
            <Col xs="12" md="6" className="d-flex justify-content-md-end gap-2 mt-3 mt-md-0">
              <Button
                onClick={handleMarkAllRead}
                disabled={unreadCount === 0 || status === 'loading'}
                className="feedback-custom-btn-outline px-4 py-2 border-2"
              >
                <CsLineIcons icon="check" size="18" className="me-2" /> Mark All Read
              </Button>
              <Button
                onClick={() => setShowDeleteAllModal(true)}
                disabled={(items || []).length === 0 || status === 'loading'}
                className="feedback-custom-btn-danger-outline px-4 py-2 border-2"
              >
                <CsLineIcons icon="bin" size="18" className="me-2" /> Delete All
              </Button>
            </Col>
          </Row>
        </div>

        {/* Card List Wrapper */}
        <Card className="inventory-history-interactive-card border-0">
          <Card.Body className="p-4 p-lg-5">
            {/* Title Section */}
            <div className="inventory-history-section-title-wrapper mb-4">
              <div
                className="sw-6 sh-6 rounded-xl d-flex align-items-center justify-content-center shadow-sm"
                style={{ background: 'rgba(35, 179, 244, 0.12)', borderRadius: '1rem', width: '48px', height: '48px' }}
              >
                <CsLineIcons icon="bell" size="24" style={{ color: '#23b3f4' }} />
              </div>
              <div>
                <h2 className="h4 mb-0 fw-bold">Alert Feed</h2>
                <p className="text-muted small mb-0">Manage system notifications and administrative logs</p>
              </div>
            </div>

            {status === 'loading' && items.length === 0 ? (
              <div className="text-center py-5">
                <Spinner animation="border" style={{ color: '#23b3f4' }} />
                <p className="mt-3 text-muted">Retrieving alerts...</p>
              </div>
            ) : items && items.length > 0 ? (
              <div className="inventory-list-wrapper">
                {/* Table Header Row (Desktop only) */}
                <div className="inventory-history-table-header-row">
                  {columns.map((column, idx) => (
                    <div
                      key={idx}
                      className={`inventory-history-table-header-col ${column.className || ''}`}
                      style={{
                        flex: column.flex || 1,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: column.className?.includes('text-center') ? 'center' : 'flex-start',
                      }}
                    >
                      {column.Header}
                    </div>
                  ))}
                </div>

                {/* Card Rows */}
                {items.map((item, idx) => {
                  const icon = getNotificationIcon(item.type);
                  const link = getNotificationLink(item);
                  const text = getNotificationText(item);
                  const time = formatNotificationTime(item.createdAt);

                  return (
                    <div
                      key={item._id || idx}
                      className="inventory-history-inventory-row-card shadow-sm"
                      style={{
                        backgroundColor: !item.read ? 'rgba(35, 179, 244, 0.05)' : '#ffffff',
                      }}
                    >
                      {/* Column 1: Type Icon */}
                      <div style={{ flex: 0.8 }}>
                        <span className="inventory-history-mobile-label">Alert Type</span>
                        <div
                          className={`sw-5 sh-5 d-flex align-items-center justify-content-center rounded-circle flex-shrink-0 ${
                            !item.read ? 'bg-primary text-white' : 'bg-separator-light text-primary'
                          }`}
                          style={{ width: '38px', height: '38px' }}
                        >
                          <CsLineIcons icon={icon} size="18" />
                        </div>
                      </div>

                      {/* Column 2: Notification text */}
                      <div style={{ flex: 4.5 }}>
                        <span className="inventory-history-mobile-label">Notification Details</span>
                        <div className="inventory-history-col-val pe-3">
                          <NavLink
                            to={link}
                            className={`d-block ${!item.read ? 'text-primary fw-bold' : 'text-alternate'}`}
                            style={{ textDecoration: 'none', fontSize: '0.925rem' }}
                          >
                            {text}
                          </NavLink>
                        </div>
                      </div>

                      {/* Column 3: Date & Time */}
                      <div style={{ flex: 2 }}>
                        <span className="inventory-history-mobile-label">Date & Time</span>
                        <div className="inventory-history-col-val text-muted small">{time}</div>
                      </div>

                      {/* Column 4: Status badge */}
                      <div style={{ flex: 1 }}>
                        <span className="inventory-history-mobile-label">Status</span>
                        <div className="inventory-history-col-val">
                          {item.read ? (
                            <Badge bg="outline-secondary" className="border-secondary text-secondary rounded-xl px-2">
                              Read
                            </Badge>
                          ) : (
                            <Badge bg="primary" className="rounded-xl px-2">
                              New
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Column 5: Actions */}
                      <div style={{ flex: 1.2 }} className="text-lg-center">
                        <span className="inventory-history-mobile-label">Actions</span>
                        <div className="d-flex justify-content-lg-center gap-2">
                          {!item.read && (
                            <Button
                              className="feedback-action-btn-circle feedback-btn-reply-active shadow-sm"
                              onClick={() => dispatch(markSingleNotificationRead(item._id))}
                              title="Mark as Read"
                            >
                              <CsLineIcons icon="check" size="15" stroke="currentColor" />
                            </Button>
                          )}
                          <Button
                            className="feedback-action-btn-circle feedback-btn-delete-active shadow-sm"
                            onClick={() => dispatch(deleteSingleNotification(item._id))}
                            title="Delete"
                          >
                            <CsLineIcons icon="bin" size="15" stroke="currentColor" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <Alert variant="light" className="text-center py-5 border-dashed rounded-4">
                <div className="me-auto ms-auto sw-8 sh-8 d-flex align-items-center justify-content-center bg-separator-light text-primary rounded-circle mb-3">
                  <CsLineIcons icon="like" size="32" />
                </div>
                <h3 className="h5 mb-1">All caught up!</h3>
                <p className="text-muted mb-0 small">You have no active administrative notifications.</p>
              </Alert>
            )}
          </Card.Body>
        </Card>
      </div>

      {/* Delete All Modal */}
      <Modal
        show={showDeleteAllModal}
        onHide={() => setShowDeleteAllModal(false)}
        centered
        backdrop="static"
        style={{ backdropFilter: 'blur(5px)' }}
        contentClassName="border-0 shadow-lg rounded-4"
      >
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold text-danger">Delete All Notifications</Modal.Title>
        </Modal.Header>
        <Modal.Body className="py-4">
          <p className="mb-0 text-muted">Are you sure you want to delete all alert notifications? This action is permanent and cannot be undone.</p>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0 d-flex gap-3">
          <Button className="px-4 py-2 feedback-custom-btn-outline flex-grow-1 border-2" onClick={() => setShowDeleteAllModal(false)} disabled={clearing}>
            Cancel
          </Button>
          <Button
            variant="danger"
            className="px-4 py-2 feedback-custom-btn-solid bg-danger border-danger flex-grow-1"
            onClick={handleDeleteAll}
            disabled={clearing}
          >
            {clearing ? <Spinner animation="border" size="sm" /> : 'Yes, Delete All'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default NotificationsList;
