import React, { useEffect, useState } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import axios from 'axios';
import { Card, Table, Row, Col, Spinner, Button, Alert, Modal } from 'react-bootstrap';
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import { toast } from 'react-toastify';
import CsLineIcons from 'cs-line-icons/CsLineIcons';

const InventoryDetails = () => {
  const title = 'Inventory Details';
  const description = 'Detailed view of an inventory purchase, including billing, status, items and attachments.';
  const breadcrumbs = [
    { to: '', text: 'Home' },
    { to: 'inventory', title: 'Inventory' },
    { to: '', title: 'Inventory Details' },
  ];

  const { id } = useParams();
  const history = useHistory();

  const [inventory, setInventory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${process.env.REACT_APP_API}/inventory/get/${id}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        setInventory(res.data);
      } catch (err) {
        setError('Failed to load inventory details.');
        toast.error('Failed to load inventory details. Please try again.');
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
      console.error('Error deleting inventory:', err);
      toast.error('Failed to delete inventory. Please try again.');
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  if (loading) {
    return (
      <Row className="justify-content-center align-items-center min-vh-100">
        <Col xs={12} className="text-center">
          <Spinner animation="border" variant="primary" className="mb-3" />
          <h5>Loading...</h5>
        </Col>
      </Row>
    );
  }

  if (error) {
    return (
      <Row className="justify-content-center align-items-center min-vh-100">
        <Col xs={12} md={6}>
          <Alert variant="danger" className="text-center">
            <CsLineIcons icon="error" className="me-2" size={24} />
            {error}
            <div className="mt-3">
              <Button variant="secondary" onClick={() => history.push('/operations/inventory-history')}>
                Back to Inventory
              </Button>
            </div>
          </Alert>
        </Col>
      </Row>
    );
  }

  return (
    <>
      <HtmlHead title={title} description={description} />
      <div className="page-title-container">
        <h1 className="mb-0 pb-0 display-4">{title}</h1>
        <BreadcrumbList items={breadcrumbs} />
      </div>

      <Card className="mb-4">
        <Card.Body>
          <Row>
            {inventory.bill_date && (
              <Col md={3}>
                <strong>Bill Date:</strong> {new Date(inventory.bill_date).toLocaleDateString('en-IN')}
              </Col>
            )}

            {inventory.request_date && (
              <>
                <Col md={3}>
                  <strong>Requested Date:</strong> {new Date(inventory.request_date).toLocaleDateString('en-IN')}
                </Col>
                <Col md={3}>
                  <strong>Requested Time:</strong> {new Date(inventory.request_date).toLocaleTimeString('en-IN')}
                </Col>
              </>
            )}
            <Col md={3}>
              <strong>Status:</strong>{' '}
              <span className={`badge bg-${inventory.status === 'Completed' ? 'success' : inventory.status === 'Rejected' ? 'danger' : 'warning'}`}>
                {inventory.status}
              </span>
            </Col>
          </Row>
          {inventory?.reject_reason && (
            <Row className="mt-3">
              <Col md={12}>
                <strong>Reason for Rejected:</strong> {inventory?.reject_reason}
              </Col>
            </Row>
          )}
        </Card.Body>
      </Card>

      {(inventory.bill_number || inventory.category || inventory.vendor_name) && (
        <Card className="mb-4">
          <Card.Header>
            <h5>Purchase Details</h5>
          </Card.Header>
          <Card.Body>
            <Table bordered responsive>
              <thead>
                <tr>
                  <th>Bill Number</th>
                  <th>Category</th>
                  <th>Vendor Name</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{inventory.bill_number || 'N/A'}</td>
                  <td>{inventory.category || 'N/A'}</td>
                  <td>{inventory.vendor_name || 'N/A'}</td>
                </tr>
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      )}

      <Card className="mb-4">
        <Card.Header>
          <h5>Inventory Items</h5>
        </Card.Header>
        <Card.Body>
          <Table bordered responsive>
            <thead>
              <tr>
                <th>#</th>
                <th>Product</th>
                <th>Quantity</th>
                <th>Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {inventory.items.map((item, index) => (
                <tr key={item._id}>
                  <td>{index + 1}</td>
                  <td>{item.item_name}</td>
                  <td>
                    {item.item_quantity} {item.unit}
                  </td>
                  <td>₹ {item.item_price || 'N/A'}</td>
                  <td>₹ {(item.item_quantity * item.item_price).toFixed(2) || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      {/* 🔥 NEW: Financial Summary Card */}
      {(inventory.sub_total || inventory.tax || inventory.discount || inventory.total_amount || inventory.paid_amount || inventory.unpaid_amount) && (
        <Card className="mb-4">
          <Card.Header>
            <h5>Financial Summary</h5>
          </Card.Header>
          <Card.Body>
            <Table bordered responsive>
              <tbody>
                <tr>
                  <td className="fw-bold" style={{ width: '30%' }}>
                    Sub Total
                  </td>
                  <td>₹ {Number(inventory.sub_total || 0).toFixed(2)}</td>
                </tr>
                <tr>
                  <td className="fw-bold">Tax</td>
                  <td>₹ {Number(inventory.tax || 0).toFixed(2)}</td>
                </tr>
                <tr>
                  <td className="fw-bold">Discount</td>
                  <td className="text-success">- ₹ {Number(inventory.discount || 0).toFixed(2)}</td>
                </tr>
                <tr className="table-primary">
                  <td className="fw-bold">Total Amount</td>
                  <td className="fw-bold">₹ {Number(inventory.total_amount || 0).toFixed(2)}</td>
                </tr>
                <tr>
                  <td className="fw-bold">Paid Amount</td>
                  <td className="text-success">₹ {Number(inventory.paid_amount || 0).toFixed(2)}</td>
                </tr>
                <tr className={Number(inventory.unpaid_amount || 0) > 0 ? 'table-warning' : ''}>
                  <td className="fw-bold">Unpaid Amount</td>
                  <td className={Number(inventory.unpaid_amount || 0) > 0 ? 'text-danger fw-bold' : ''}>₹ {Number(inventory.unpaid_amount || 0).toFixed(2)}</td>
                </tr>
              </tbody>
            </Table>
            <div className="mt-2">
              <small className="text-muted">
                <strong>Calculation:</strong> Total Amount = Sub Total + Tax - Discount
              </small>
            </div>
          </Card.Body>
        </Card>
      )}

      {inventory.bill_files && inventory.bill_files.length > 0 && (
        <Card className="mb-4">
          <Card.Header>
            <h5>Attached Files</h5>
          </Card.Header>
          <Card.Body>
            <Row>
              {inventory.bill_files.map((file, idx) => {
                const fileUrl = `${process.env.REACT_APP_UPLOAD_DIR}${file}`;
                const isPdf = file.endsWith('.pdf');
                return (
                  <Col key={idx} xs={12} md={3} className="text-center mb-3">
                    <div className="border rounded p-2 bg-light">
                      {isPdf ? (
                        <div className="pdf-preview d-flex justify-content-center align-items-center" style={{ height: '150px' }}>
                          <CsLineIcons icon="file-text" size={48} className="text-danger" />
                        </div>
                      ) : (
                        <img src={fileUrl} alt={`Bill ${idx + 1}`} style={{ width: '100%', height: '150px', objectFit: 'cover' }} />
                      )}
                      <div className="mt-2">
                        <small className="text-muted d-block text-truncate">{file}</small>
                        <a href={fileUrl} target="_blank" rel="noreferrer">
                          <Button variant="outline-primary" size="sm" title="View" className="btn-icon btn-icon-only">
                            <CsLineIcons icon="download" />
                          </Button>
                        </a>
                      </div>
                    </div>
                  </Col>
                );
              })}
            </Row>
          </Card.Body>
        </Card>
      )}

      <Row>
        <Col className="text-end">
          <Button variant="secondary" onClick={() => history.push('/operations/inventory-history')} className="me-2">
            <CsLineIcons icon="arrow-left" className="me-1" />
            Back
          </Button>
          <Button variant="warning" onClick={() => history.push(`/operations/edit-inventory/${id}`)} className="me-2">
            <CsLineIcons icon="edit" className="me-1" />
            Edit
          </Button>
          <Button variant="danger" onClick={() => setShowDeleteModal(true)} disabled={deleting}>
            {deleting ? <Spinner animation="border" size="sm" className="me-1" /> : <CsLineIcons icon="bin" className="me-1" />}
            Delete
          </Button>
        </Col>
      </Row>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            Delete Inventory?
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <p>Delete this inventory item permanently</p>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="dark" onClick={() => setShowDeleteModal(false)} disabled={deleting}>
            Cancel
          </Button>

          <Button variant="danger" onClick={handleDelete} disabled={deleting}>
            {deleting ? (
              <>
                <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                Deleting...
              </>
            ) : (
              'Delete'
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default InventoryDetails;
