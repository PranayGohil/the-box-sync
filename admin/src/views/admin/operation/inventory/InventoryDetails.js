import React, { useEffect, useState } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import axios from 'axios';
import { Card, Table, Row, Col, Spinner, Button, Alert } from 'react-bootstrap';
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
          }
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
          <h5>Loading inventory details...</h5>
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
              <strong>Status:</strong> <span className={`badge bg-${inventory.status === 'Completed' ? 'success' : inventory.status === 'Rejected' ? 'danger' : 'warning'}`}>
                {inventory.status}
              </span>
            </Col>
          </Row>
          {inventory?.reject_reason &&
            <Row className='mt-3'>
              <Col md={12}>
                <strong>Reason for Rejected:</strong> {inventory?.reject_reason}
              </Col>
            </Row>
          }

        </Card.Body>
      </Card>

      {(inventory.bill_number || inventory.category || inventory.vendor_name || inventory.paid_amount || inventory.total_amount || inventory.unpaid_amount) && (
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
                  <th>Paid Amount</th>
                  <th>Total Amount</th>
                  <th>Unpaid Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{inventory.bill_number}</td>
                  <td>{inventory.category}</td>
                  <td>{inventory.vendor_name}</td>
                  <td>₹ {inventory.paid_amount}</td>
                  <td>₹ {inventory.total_amount}</td>
                  <td>₹ {inventory.unpaid_amount}</td>
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
                          <Button variant="outline-primary" size="sm" className="mt-1">
                            <CsLineIcons icon="download" className="me-1" />
                            Download
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
            Back to Inventory
          </Button>
          <Button variant="warning" onClick={() => history.push(`/operations/edit-inventory/${id}`)} className="me-2">
            <CsLineIcons icon="edit" className="me-1" />
            Edit Inventory
          </Button>
          <Button
            variant="danger"
            onClick={() => setShowDeleteModal(true)}
            disabled={deleting}
          >
            {deleting ? (
              <Spinner animation="border" size="sm" className="me-1" />
            ) : (
              <CsLineIcons icon="bin" className="me-1" />
            )}
            Delete Inventory
          </Button>
        </Col>
      </Row>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div
          className="position-fixed top-0 left-0 w-100 h-100 d-flex justify-content-center align-items-center"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 9999,
          }}
        >
          <Card className="shadow-lg" style={{ maxWidth: '400px' }}>
            <Card.Header className="bg-danger text-white">
              <h5 className="mb-0">
                <CsLineIcons icon="warning" className="me-2" />
                Delete Inventory
              </h5>
            </Card.Header>
            <Card.Body>
              <p>Are you sure you want to delete this inventory?</p>
              <p><strong>Bill Number: {inventory.bill_number}</strong></p>
              <p className="text-muted">This action cannot be undone.</p>
            </Card.Body>
            <Card.Footer>
              <Button variant="secondary" onClick={() => setShowDeleteModal(false)} disabled={deleting}>
                Cancel
              </Button>
              <Button variant="danger" onClick={handleDelete} disabled={deleting} className="ms-2">
                {deleting ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Deleting...
                  </>
                ) : 'Delete'}
              </Button>
            </Card.Footer>
          </Card>
        </div>
      )}
    </>
  );
};

export default InventoryDetails;