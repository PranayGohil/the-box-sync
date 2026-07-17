import React, { useEffect, useState } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import axios from 'axios';
import { Card, Row, Col, Spinner, Button, Alert, Modal, Badge } from 'react-bootstrap';
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import { toast } from 'react-toastify';
import CsLineIcons from 'cs-line-icons/CsLineIcons';



const InventoryDetails = () => {
  const { id } = useParams();
  const history = useHistory();
  const brandColor = '#23b3f4';
  const [inventory, setInventory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${process.env.REACT_APP_API}/inventory/get/${id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        setInventory(res.data);
      } catch (err) {
        toast.error('Failed to load details.');
      } finally {
        setLoading(false);
      }
    };
    fetchInventory();
  }, [id]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await axios.delete(`${process.env.REACT_APP_API}/inventory/delete/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      toast.success('Inventory deleted successfully!');
      history.push('/inventory');
    } catch (err) {
      toast.error('Failed to delete inventory.');
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  if (!inventory)
    return (
      <Alert variant="danger" className="m-5">
        Data not found.
      </Alert>
    );

  const customStyles = `
    .inventory-details-details-container .btn {
      transition: all 0.2s ease-in-out !important;
    }
    .inventory-details-details-container .btn:hover {
      transform: translateY(-2px) !important;
    }
    .inventory-details-details-container .btn:not(.btn-sm),
    .inventory-delete-modal-content .btn {
      border-radius: 50px !important;
      font-weight: 600 !important;
      padding: 6px 20px !important;
      height: 38px !important;
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      gap: 6px !important;
      font-size: 0.88rem !important;
    }
    .inventory-details-details-container .btn.btn-sm {
      border-radius: 50px !important;
      font-weight: 600 !important;
      padding: 6px 16px !important;
      height: 34px !important;
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      gap: 6px !important;
      font-size: 0.85rem !important;
    }
    .inventory-details-details-container .btn-primary {
      background-color: #23b3f4 !important;
      border-color: #23b3f4 !important;
      box-shadow: 0 4px 10px rgba(35, 179, 244, 0.15) !important;
    }
    .inventory-details-details-container .btn-primary:hover {
      background-color: #179edb !important;
      border-color: #179edb !important;
      box-shadow: 0 6px 15px rgba(35, 179, 244, 0.25) !important;
    }
    .inventory-details-details-container .btn-outline-primary {
      border: 1px solid #23b3f4 !important;
      color: #23b3f4 !important;
      background-color: #ffffff !important;
    }
    .inventory-details-details-container .btn-outline-primary:hover {
      background-color: #23b3f4 !important;
      color: #ffffff !important;
      box-shadow: 0 4px 12px rgba(35, 179, 244, 0.25) !important;
    }
    .inventory-details-details-container .btn-outline-primary:hover svg {
      stroke: #ffffff !important;
    }
    .inventory-details-details-container .btn-outline-danger,
    .inventory-delete-modal-content .btn-outline-danger {
      border: 1px solid #ef4444 !important;
      color: #ef4444 !important;
      background-color: #ffffff !important;
    }
    .inventory-details-details-container .btn-outline-danger:hover,
    .inventory-delete-modal-content .btn-outline-danger:hover {
      background-color: #ef4444 !important;
      color: #ffffff !important;
      box-shadow: 0 4px 12px rgba(239, 68, 68, 0.25) !important;
    }
    .inventory-details-details-container .btn-outline-danger:hover svg,
    .inventory-delete-modal-content .btn-outline-danger:hover svg {
      stroke: #ffffff !important;
    }
    .inventory-details-details-container .btn-outline-warning {
      border: 1px solid #f59e0b !important;
      color: #f59e0b !important;
      background-color: #ffffff !important;
    }
    .inventory-details-details-container .btn-outline-warning:hover {
      background-color: #f59e0b !important;
      color: #ffffff !important;
      box-shadow: 0 4px 12px rgba(245, 158, 11, 0.25) !important;
    }
    .inventory-details-details-container .btn-outline-warning:hover svg {
      stroke: #ffffff !important;
    }
    .inventory-details-details-container .btn-outline-secondary,
    .inventory-delete-modal-content .btn-outline-secondary {
      border: 1px solid #64748b !important;
      color: #64748b !important;
      background-color: #ffffff !important;
    }
    .inventory-details-details-container .btn-outline-secondary:hover,
    .inventory-delete-modal-content .btn-outline-secondary:hover {
      background-color: #64748b !important;
      color: #ffffff !important;
      box-shadow: 0 4px 12px rgba(100, 116, 139, 0.25) !important;
    }
    .inventory-details-details-container .btn-outline-secondary:hover svg,
    .inventory-delete-modal-content .btn-outline-secondary:hover svg {
      stroke: #ffffff !important;
    }

    .modal-content {
      border-radius: 1.5rem !important;
      overflow: hidden !important;
    }
  `;

  return (
    <div className="container-fluid qsr-page-container inventory-details-details-container">
      <style>{customStyles}</style>
      <HtmlHead title="Inventory Details" />
      <div className="qsr-page-title-container">
          <Row className="g-3 align-items-center">
            <Col xs={12} md={7}>
              <h1 className="qsr-page-title">Inventory Details</h1>
              <BreadcrumbList items={[{ to: '', text: 'Home' }, { to: 'inventory', text: 'Inventory Management' }, { to: '', title: 'Details' }]} />
            </Col>
            <Col xs={12} md={5} className="d-flex flex-wrap justify-content-start justify-content-md-end gap-2 mt-3 mt-md-0">
              <Button variant="outline-secondary" onClick={() => history.push('/inventory')} className="rounded-pill px-4 fw-bold border-2">
                <CsLineIcons icon="arrow-left" size="14" className="me-2" /> Back
              </Button>
              <Button variant="outline-warning" onClick={() => history.push(`/inventory/edit/${id}`)} className="rounded-pill px-4 fw-bold border-2">
                <CsLineIcons icon="edit" size="14" className="me-2" /> Edit
              </Button>
              <Button variant="outline-danger" onClick={() => setShowDeleteModal(true)} className="rounded-pill px-4 fw-bold border-2">
                <CsLineIcons icon="bin" size="14" className="me-2" /> Delete
              </Button>
            </Col>
          </Row>
        </div>

        <div className="inventory-details-overview-bar">
          <div className="d-flex flex-wrap gap-3 gap-md-5">
            <div>
              <div className="inventory-details-info-label">Bill Date</div>
              <div className="inventory-details-info-val">{new Date(inventory.bill_date).toLocaleDateString('en-IN')}</div>
            </div>
            <div>
              <div className="inventory-details-info-label">Requested On</div>
              <div className="inventory-details-info-val">
                {new Date(inventory.request_date).toLocaleDateString('en-IN')} at{' '}
                {new Date(inventory.request_date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
          <Badge bg={inventory.status === 'Completed' ? 'success' : inventory.status === 'Rejected' ? 'danger' : 'warning'} className="inventory-details-status-badge shadow-sm">
            {inventory.status}
          </Badge>
        </div>

        {inventory.reject_reason && (
          <Alert variant="danger" className="rounded-4 p-4 border-0 shadow-sm mb-4">
            <div className="fw-bold mb-1">
              <CsLineIcons icon="error" size="18" className="me-2" /> Rejection Reason
            </div>
            <div className="text-dark">{inventory.reject_reason}</div>
          </Alert>
        )}

        <Card className="inventory-details-section-card border-0">
          <div className="section-label">
            <CsLineIcons icon="file-text" size="18" /> Purchase Information
          </div>
          <Row className="g-4">
            <Col xs={12} md={4}>
              <div>
                <div className="inventory-details-info-label">Bill Number</div>
                <div className="h5 fw-bold mb-0">{inventory.bill_number || 'N/A'}</div>
              </div>
            </Col>
            <Col xs={6} md={4}>
              <div>
                <div className="inventory-details-info-label">Category</div>
                <div className="h5 fw-bold mb-0">{inventory.category || 'N/A'}</div>
              </div>
            </Col>
            <Col xs={6} md={4}>
              <div>
                <div className="inventory-details-info-label">Vendor Name</div>
                <div className="h5 fw-bold mb-0">{inventory.vendor_name || 'N/A'}</div>
              </div>
            </Col>
          </Row>
        </Card>

        <Card className="inventory-details-section-card border-0">
          <div className="section-label">
            <CsLineIcons icon="shopping-basket" size="18" /> Item Manifest
          </div>
          {/* Desktop View */}
          <div className="d-none d-lg-block">
            <div className="inventory-details-item-header-row">
              <div style={{ width: '60px' }}>#</div>
              <div style={{ flex: 2 }}>Description</div>
              <div style={{ flex: 1 }}>Quantity</div>
              <div style={{ flex: 1 }}>Unit Price</div>
              <div style={{ flex: 1 }} className="text-end">
                Subtotal
              </div>
            </div>
            {inventory.items.map((item, index) => (
              <div key={index} className="inventory-details-item-row-card">
                <div style={{ width: '60px' }} className="fw-bold text-muted">
                  {index + 1}
                </div>
                <div style={{ flex: 2 }} className="fw-bold text-dark">
                  {item.item_name}
                </div>
                <div style={{ flex: 1 }} className="fw-bold">
                  {item.item_quantity} {item.unit}
                </div>
                <div style={{ flex: 1 }} className="text-muted">
                  ₹ {item.item_price || '0.00'}
                </div>
                <div style={{ flex: 1 }} className="text-end fw-bold text-primary">
                  ₹ {(item.item_quantity * (item.item_price || 0)).toFixed(2)}
                </div>
              </div>
            ))}
          </div>

          {/* Mobile View */}
          <div className="d-block d-lg-none">
            {inventory.items.map((item, index) => (
              <div key={index} className="mb-3 p-3 bg-white border rounded-4 shadow-sm">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div className="d-flex align-items-center gap-2">
                    <span className="badge rounded-pill px-2.5 py-1 fw-bold" style={{ fontSize: '0.75rem', backgroundColor: '#e0f2fe', color: '#0369a1' }}>
                      #{index + 1}
                    </span>
                    <h6 className="fw-bold text-dark mb-0">{item.item_name}</h6>
                  </div>
                </div>
                <Row className="g-2 text-center">
                  <Col xs={6}>
                    <div className="p-2 rounded-3 bg-light" style={{ border: '1px solid #f1f5f9' }}>
                      <div className="text-muted small fw-bold" style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Quantity</div>
                      <div className="fw-bold text-dark mt-0.5">{item.item_quantity} {item.unit}</div>
                    </div>
                  </Col>
                  <Col xs={6}>
                    <div className="p-2 rounded-3 bg-light" style={{ border: '1px solid #f1f5f9' }}>
                      <div className="text-muted small fw-bold" style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Unit Price</div>
                      <div className="fw-bold text-dark mt-0.5">₹ {item.item_price || '0.00'}</div>
                    </div>
                  </Col>
                  <Col xs={12}>
                    <div className="p-2 rounded-3 d-flex justify-content-between align-items-center mt-1" style={{ backgroundColor: '#e0f2fe', border: '1px solid #bae6fd' }}>
                      <span className="fw-bold text-primary small text-uppercase" style={{ fontSize: '0.65rem', letterSpacing: '0.05em' }}>Item Subtotal</span>
                      <span className="fw-bold text-primary">₹ {(item.item_quantity * (item.item_price || 0)).toFixed(2)}</span>
                    </div>
                  </Col>
                </Row>
              </div>
            ))}
          </div>

          <div className="inventory-details-summary-hub mt-5">
            <Row className="g-4">
              <Col xs={12} md={4}>
                <div>
                  <div className="inventory-details-info-label">Net Subtotal</div>
                  <div className="h5 fw-bold text-muted">₹ {Number(inventory.sub_total || 0).toFixed(2)}</div>
                </div>
              </Col>
              <Col xs={6} md={4}>
                <div>
                  <div className="inventory-details-info-label">Tax (GST/VAT)</div>
                  <div className="h5 fw-bold text-muted">₹ {Number(inventory.tax || 0).toFixed(2)}</div>
                </div>
              </Col>
              <Col xs={6} md={4}>
                <div>
                  <div className="inventory-details-info-label">Discount Applied</div>
                  <div className="h5 fw-bold text-success">- ₹ {Number(inventory.discount || 0).toFixed(2)}</div>
                </div>
              </Col>

              <Col md={12}>
                <div className="inventory-details-total-display shadow-sm">
                  <div>
                    <div className="inventory-details-info-label mb-1">Total Grand Amount</div>
                    <div className="inventory-details-total-val">₹ {Number(inventory.total_amount || 0).toFixed(2)}</div>
                  </div>
                  <div className="text-md-end">
                    <div>
                      <div className="inventory-details-info-label">Amount Paid</div>
                      <div className="h3 fw-bold text-success mb-0">₹ {Number(inventory.paid_amount || 0).toFixed(2)}</div>
                    </div>
                  </div>
                </div>
              </Col>

              <Col md={12} className="text-end pt-3 d-flex flex-column flex-md-row justify-content-between align-items-center gap-3">
                {(() => {
                  const totalAmt = Number(inventory.total_amount || 0);
                  const paidAmt = Number(inventory.paid_amount || 0);
                  const dueAmt = inventory.unpaid_amount !== undefined ? Number(inventory.unpaid_amount) : Math.max(0, totalAmt - paidAmt);
                  return (
                    <div className="d-flex align-items-center gap-2">
                      <div className={`sw-2 sh-2 rounded-circle bg-${dueAmt > 0 ? 'warning' : 'success'}`} />{' '}
                      <span className="fw-bold text-muted">
                        Balance {dueAmt > 0 ? 'Due' : 'Cleared'}: ₹ {dueAmt.toFixed(2)}
                      </span>
                    </div>
                  );
                })()}
              </Col>
            </Row>
          </div>
        </Card>

        {inventory.bill_files?.length > 0 && (
          <Card className="inventory-details-section-card border-0">
            <div className="section-label">
              <CsLineIcons icon="file-text" size="18" /> Supporting Documents
            </div>
            <Row className="g-3">
              {inventory.bill_files.map((file, idx) => {
                const fileUrl = `${process.env.REACT_APP_UPLOAD_DIR}${file}`;
                const isPdf = file.toLowerCase().endsWith('.pdf');
                return (
                  <Col key={idx} xs={12} md={3}>
                    <div className="inventory-details-file-card">
                      <div
                        className="mb-3 d-flex justify-content-center align-items-center"
                        style={{ height: '100px', background: '#f8fafc', borderRadius: '12px' }}
                      >
                        {isPdf ? (
                          <CsLineIcons icon="file-text" size="48" className="text-danger" />
                        ) : (
                          <img src={fileUrl} alt="Bill" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '12px' }} />
                        )}
                      </div>
                      <div className="text-truncate small fw-bold text-muted mb-2">{file}</div>
                      <a href={fileUrl} target="_blank" rel="noreferrer" className="text-decoration-none">
                        <Button variant="outline-primary" size="sm" className="rounded-pill px-3 fw-bold border-2">
                          <CsLineIcons icon="download" size="12" className="me-1" /> View
                        </Button>
                      </a>
                    </div>
                  </Col>
                );
              })}
            </Row>
          </Card>
        )}

      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered backdrop="static" contentClassName="inventory-delete-modal-content">
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold" style={{ color: '#cf2637' }}>
            Confirm Deletion
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="py-4">
          <div className="d-flex align-items-center mb-3">
            <div className="p-3 rounded-circle me-3" style={{ backgroundColor: 'rgba(207, 38, 55, 0.1)' }}>
              <CsLineIcons icon="bin" size="24" style={{ color: '#cf2637' }} />
            </div>
            <div>
              <p className="mb-1 fw-bold text-dark">Permanently delete this record?</p>
              <p className="mb-0 text-muted small">This log will be cleared from your history without affecting your physical stock quantities.</p>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <Button 
            variant="outline-secondary" 
            onClick={() => setShowDeleteModal(false)} 
            disabled={deleting}
            className="rounded-pill px-4 fw-bold border-2"
          >
            Cancel
          </Button>
          <Button 
            variant="outline-danger" 
            onClick={handleDelete} 
            disabled={deleting}
            className="rounded-pill px-4 fw-bold border-2"
          >
            {deleting ? (
              <>
                <Spinner as="span" animation="border" size="sm" className="me-2" />
                Deleting...
              </>
            ) : (
              <div className="d-flex align-items-center">
                <CsLineIcons icon="bin" size="14" className="me-2" />
                Delete
              </div>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default InventoryDetails;
