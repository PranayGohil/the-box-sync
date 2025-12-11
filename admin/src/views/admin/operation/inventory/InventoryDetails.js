import React, { useEffect, useState } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import axios from 'axios';
import { Card, Table, Row, Col, Spinner, Button, Alert } from 'react-bootstrap';
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import { toast } from 'react-toastify';

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

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${process.env.REACT_APP_API}/inventory/get/${id}`, { headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          } });
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

  if (loading) return <Spinner animation="border" className="m-5" />;
  if (error)
    return (
      <Alert variant="danger" className="m-5">
        {error}
      </Alert>
    );

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
              <strong>Status:</strong> {inventory.status}
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {(inventory.bill_number || inventory.category || inventory.vendor_name || inventory.paid_amount || inventory.total_amount || inventory.unpaid_amount) && (
        <Card className="mb-4">
          <Card.Header>
            <h5>Purchase Details</h5>
          </Card.Header>
          <Card.Body>
            <Table bordered>
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
          <Table bordered>
            <thead>
              <tr>
                <th>Product</th>
                <th>Quantity</th>
                <th>Price</th>
              </tr>
            </thead>
            <tbody>
              {inventory.items.map((item) => (
                <tr key={item._id}>
                  {' '}
                  {/* eslint-disable-line no-underscore-dangle */}
                  <td>{item.item_name}</td>
                  <td>
                    {item.item_quantity} {item.unit}
                  </td>
                  <td>₹ {item.item_price || 'N/A'}</td>
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
            {inventory.bill_files && inventory.bill_files.length > 0 ? (
              <Row>
                {inventory.bill_files.map((file, idx) => {
                  const fileUrl = `${process.env.REACT_APP_UPLOAD_DIR}${file}`;
                  const isPdf = file.endsWith('.pdf');
                  return (
                    <Col key={idx} xs={12} md={3} className="text-center mb-3">
                      {isPdf ? (
                        <iframe src={fileUrl} style={{ width: '100%', height: '150px' }} title={`PDF ${idx + 1}`} />
                      ) : (
                        <img src={fileUrl} alt={`Bill ${idx + 1}`} style={{ width: '100%', height: '150px', objectFit: 'cover' }} />
                      )}
                      <a href={fileUrl} target="_blank" rel="noreferrer">
                        <Button variant="outline-primary" size="sm" className="mt-2">
                          View
                        </Button>
                      </a>
                    </Col>
                  );
                })}
              </Row>
            ) : (
              <p>No files attached.</p>
            )}
          </Card.Body>
        </Card>
      )}

      <Row>
        <Col className="text-end">
          <Button variant="secondary" onClick={() => history.push('/operations/inventory-history')}>
            Back to Inventory
          </Button>{' '}
          <Button variant="dark" onClick={() => history.push(`/operations/edit-inventory/${id}`)}>
            Edit Inventory
          </Button>
        </Col>
      </Row>
    </>
  );
};

export default InventoryDetails;
