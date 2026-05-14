import React, { useEffect, useState } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import axios from 'axios';
import { Card, Row, Col, Spinner, Button, Alert, Modal, Badge } from 'react-bootstrap';
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import { toast } from 'react-toastify';
import CsLineIcons from 'cs-line-icons/CsLineIcons';

const customStyles = `
    .details-container {
      background: #f9f9fb;
      min-height: 100vh;
      padding-bottom: 5rem;
    }
    .overview-bar {
      background: #ffffff;
      border-radius: 1.25rem;
      padding: 1.5rem 2rem;
      border: 1px solid rgba(0,0,0,0.05);
      box-shadow: 0 4px 15px rgba(0,0,0,0.02);
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
    }
    .info-label {
      font-size: 0.65rem;
      font-weight: 800;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 0.25rem;
    }
    .info-val {
      font-weight: 700;
      color: #334155;
    }
    .section-card {
      background: #ffffff !important;
      border-radius: 2rem !important;
      border: 1px solid rgba(0,0,0,0.05) !important;
      padding: 2.5rem !important;
      box-shadow: 0 10px 40px rgba(0,0,0,0.02) !important;
      margin-bottom: 2.5rem;
    }
    .item-header-row {
      display: flex;
      padding: 0 1.5rem;
      margin-bottom: 1rem;
      color: #94a3b8;
      font-size: 0.65rem;
      font-weight: 800;
      text-transform: uppercase;
    }
    .item-row-card {
      background: #ffffff !important;
      border-radius: 1.25rem !important;
      border: 1px solid #f1f5f9 !important;
      padding: 1.25rem 1.5rem !important;
      margin-bottom: 1rem;
      box-shadow: 0 4px 15px rgba(0,0,0,0.02) !important;
      display: flex;
      align-items: center;
      transition: all 0.25s ease;
    }
    .item-row-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(0,0,0,0.05) !important;
      border-color: rgba(35, 179, 244, 0.2) !important;
    }
    .summary-hub {
      background: #f8fafc;
      border-radius: 1.5rem;
      padding: 2rem;
      border: 1px solid #f1f5f9;
    }
    .total-display {
      background: #ffffff;
      border-radius: 1rem;
      padding: 1.5rem;
      border: 1.5px solid #23b3f4;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .total-val {
      font-size: 1.5rem;
      font-weight: 900;
      color: #23b3f4;
    }
    .file-card {
      background: #ffffff;
      border-radius: 1rem;
      padding: 1rem;
      border: 1px solid #f1f5f9;
      transition: all 0.2s ease;
      height: 100%;
      text-align: center;
    }
    .file-card:hover {
      border-color: #23b3f4;
      box-shadow: 0 4px 12px rgba(35, 179, 244, 0.1);
    }
    .status-badge {
      padding: 0.5rem 1.25rem;
      border-radius: 50px;
      font-weight: 800;
      font-size: 0.7rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .btn-action {
      border-radius: 50px !important;
      padding: 0.6rem 1.5rem !important;
      font-weight: 700 !important;
      border-width: 2px !important;
      transition: all 0.3s ease !important;
    }
    .btn-action:hover {
      transform: translateY(-2px);
    }
`;

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
      history.push('/operations/inventory-history');
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

  return (
    <div className="details-container">
      <style>{customStyles}</style>
      <HtmlHead title="Inventory Details" />
      <div className="container px-lg-5">
        <div className="mb-5 pt-4 d-flex justify-content-between align-items-center">
          <div>
            <h1 className="display-4 fw-bold mb-1" style={{ color: brandColor }}>
              Inventory Details
            </h1>
            <BreadcrumbList
              items={[
                { to: '', text: 'Home' },
                { to: 'operations/inventory', text: 'Inventory' },
                { to: '', title: 'Details' },
              ]}
            />
          </div>
          <div className="d-flex gap-2">
            <Button variant="outline-secondary" onClick={() => history.push('/operations/inventory-history')} className="btn-action">
              <CsLineIcons icon="arrow-left" size="14" className="me-2" /> Back
            </Button>
            <Button variant="outline-warning" onClick={() => history.push(`/operations/edit-inventory/${id}`)} className="btn-action">
              <CsLineIcons icon="edit" size="14" className="me-2" /> Edit
            </Button>
            <Button variant="outline-danger" onClick={() => setShowDeleteModal(true)} className="btn-action">
              <CsLineIcons icon="bin" size="14" className="me-2" /> Delete
            </Button>
          </div>
        </div>

        <div className="overview-bar">
          <div className="d-flex gap-5">
            <div>
              <div className="info-label">Bill Date</div>
              <div className="info-val">{new Date(inventory.bill_date).toLocaleDateString('en-IN')}</div>
            </div>
            <div>
              <div className="info-label">Requested On</div>
              <div className="info-val">
                {new Date(inventory.request_date).toLocaleDateString('en-IN')} at{' '}
                {new Date(inventory.request_date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
          <Badge bg={inventory.status === 'Completed' ? 'success' : inventory.status === 'Rejected' ? 'danger' : 'warning'} className="status-badge shadow-sm">
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

        <Card className="section-card border-0">
          <div className="section-label">
            <CsLineIcons icon="file-text" size="18" /> Purchase Information
          </div>
          <Row className="g-4">
            <Col md={4}>
              <div>
                <div className="info-label">Bill Number</div>
                <div className="h5 fw-bold mb-0">{inventory.bill_number || 'N/A'}</div>
              </div>
            </Col>
            <Col md={4}>
              <div>
                <div className="info-label">Category</div>
                <div className="h5 fw-bold mb-0">{inventory.category || 'N/A'}</div>
              </div>
            </Col>
            <Col md={4}>
              <div>
                <div className="info-label">Vendor Name</div>
                <div className="h5 fw-bold mb-0">{inventory.vendor_name || 'N/A'}</div>
              </div>
            </Col>
          </Row>
        </Card>

        <Card className="section-card border-0">
          <div className="section-label">
            <CsLineIcons icon="shopping-basket" size="18" /> Item Manifest
          </div>
          <div className="item-header-row d-none d-lg-flex">
            <div style={{ width: '60px' }}>#</div>
            <div style={{ flex: 2 }}>Description</div>
            <div style={{ flex: 1 }}>Quantity</div>
            <div style={{ flex: 1 }}>Unit Price</div>
            <div style={{ flex: 1 }} className="text-end">
              Subtotal
            </div>
          </div>
          {inventory.items.map((item, index) => (
            <div key={index} className="item-row-card">
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

          <div className="summary-hub mt-5">
            <Row className="g-4">
              <Col md={4}>
                <div>
                  <div className="info-label">Net Subtotal</div>
                  <div className="h5 fw-bold text-muted">₹ {Number(inventory.sub_total || 0).toFixed(2)}</div>
                </div>
              </Col>
              <Col md={4}>
                <div>
                  <div className="info-label">Tax (GST/VAT)</div>
                  <div className="h5 fw-bold text-muted">₹ {Number(inventory.tax || 0).toFixed(2)}</div>
                </div>
              </Col>
              <Col md={4}>
                <div>
                  <div className="info-label">Discount Applied</div>
                  <div className="h5 fw-bold text-success">- ₹ {Number(inventory.discount || 0).toFixed(2)}</div>
                </div>
              </Col>

              <Col md={12}>
                <div className="total-display shadow-sm">
                  <div>
                    <div className="info-label mb-1">Total Grand Amount</div>
                    <div className="total-val">₹ {Number(inventory.total_amount || 0).toFixed(2)}</div>
                  </div>
                  <div className="text-end">
                    <div>
                      <div className="info-label">Amount Paid</div>
                      <div className="h3 fw-bold text-success mb-0">₹ {Number(inventory.paid_amount || 0).toFixed(2)}</div>
                    </div>
                  </div>
                </div>
              </Col>

              <Col md={12} className="text-end pt-3 d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center gap-2">
                  <div className={`sw-2 sh-2 rounded-circle bg-${Number(inventory.unpaid_amount || 0) > 0 ? 'warning' : 'success'}`} />{' '}
                  <span className="fw-bold text-muted">
                    Balance {Number(inventory.unpaid_amount || 0) > 0 ? 'Due' : 'Cleared'}: ₹ {Number(inventory.unpaid_amount || 0).toFixed(2)}
                  </span>
                </div>
                <div className="text-muted small">This record is synchronized with global financial ledgers.</div>
              </Col>
            </Row>
          </div>
        </Card>

        {inventory.bill_files?.length > 0 && (
          <Card className="section-card border-0">
            <div className="section-label">
              <CsLineIcons icon="file-text" size="18" /> Supporting Documents
            </div>
            <Row className="g-3">
              {inventory.bill_files.map((file, idx) => {
                const fileUrl = `${process.env.REACT_APP_UPLOAD_DIR}${file}`;
                const isPdf = file.toLowerCase().endsWith('.pdf');
                return (
                  <Col key={idx} xs={12} md={3}>
                    <div className="file-card">
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
      </div>

      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered className="modal-premium">
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold">Delete Inventory?</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          <p className="text-muted mb-0">Are you sure you want to delete this record? This will permanently remove it from the active inventory history.</p>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <Button variant="light" className="btn-action text-muted" onClick={() => setShowDeleteModal(false)} disabled={deleting}>
            Cancel
          </Button>
          <Button variant="danger" className="btn-action" onClick={handleDelete} disabled={deleting}>
            {deleting ? <Spinner animation="border" size="sm" /> : 'Confirm Delete'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default InventoryDetails;
