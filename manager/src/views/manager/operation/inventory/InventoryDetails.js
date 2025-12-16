import React, { useEffect, useState } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import axios from 'axios';
import { Card, Table, Row, Col, Spinner, Button, Alert, Badge } from 'react-bootstrap';
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
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

    const [loading, setLoading] = useState(true);
    const [inventory, setInventory] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchInventory = async () => {
            try {
                setLoading(true);
                setError('');
                const res = await axios.get(
                    `${process.env.REACT_APP_API}/inventory/get/${id}`,
                    {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem('token')}`,
                        }
                    }
                );
                setInventory(res.data);
            } catch (err) {
                console.error('Error fetching inventory:', err);
                setError('Failed to load inventory details. Please try again.');
                toast.error('Failed to load inventory details.');
            } finally {
                setLoading(false);
            }
        };
        fetchInventory();
    }, [id]);

    if (loading) {
        return (
            <>
                <HtmlHead title={title} description={description} />
                <Row>
                    <Col>
                        <div className="page-title-container">
                            <h1 className="mb-0 pb-0 display-4">{title}</h1>
                            <BreadcrumbList items={breadcrumbs} />
                        </div>
                        <div className="text-center py-5">
                            <Spinner animation="border" variant="primary" className="mb-3" />
                            <h5>Loading Inventory Details...</h5>
                            <p className="text-muted">Please wait while we fetch inventory information</p>
                        </div>
                    </Col>
                </Row>
            </>
        );
    }

    if (error) {
        return (
            <>
                <HtmlHead title={title} description={description} />
                <Row>
                    <Col>
                        <div className="page-title-container">
                            <h1 className="mb-0 pb-0 display-4">{title}</h1>
                            <BreadcrumbList items={breadcrumbs} />
                        </div>
                        <Alert variant="danger" className="my-4">
                            <CsLineIcons icon="error" className="me-2" />
                            {error}
                            <div className="mt-3">
                                <Button variant="outline-primary" onClick={() => history.push('/operations/inventory-history')}>
                                    <CsLineIcons icon="arrow-left" className="me-2" />
                                    Back to Inventory
                                </Button>
                            </div>
                        </Alert>
                    </Col>
                </Row>
            </>
        );
    }

    if (!inventory) {
        return (
            <>
                <HtmlHead title={title} description={description} />
                <Row>
                    <Col>
                        <div className="page-title-container">
                            <h1 className="mb-0 pb-0 display-4">{title}</h1>
                            <BreadcrumbList items={breadcrumbs} />
                        </div>
                        <Alert variant="warning" className="my-4">
                            <CsLineIcons icon="inbox" className="me-2" />
                            Inventory not found or may have been deleted.
                            <div className="mt-3">
                                <Button variant="outline-primary" onClick={() => history.push('/operations/inventory-history')}>
                                    <CsLineIcons icon="arrow-left" className="me-2" />
                                    Back to Inventory
                                </Button>
                            </div>
                        </Alert>
                    </Col>
                </Row>
            </>
        );
    }

    const statusVariant = {
        'Completed': 'success',
        'Requested': 'warning',
        'Rejected': 'danger'
    }[inventory.status] || 'secondary';

    return (
        <>
            <HtmlHead title={title} description={description} />
            <div className="page-title-container">
                <h1 className="mb-0 pb-0 display-4">{title}</h1>
                <BreadcrumbList items={breadcrumbs} />
            </div>

            <Card className="mb-4">
                <Card.Body>
                    <Row className="align-items-center">
                        {inventory.bill_date && (
                            <Col md={3}>
                                <div className="d-flex align-items-center">
                                    <CsLineIcons icon="calendar" className="text-primary me-2" />
                                    <div>
                                        <small className="text-muted d-block">Bill Date</small>
                                        <strong>{new Date(inventory.bill_date).toLocaleDateString("en-IN")}</strong>
                                    </div>
                                </div>
                            </Col>
                        )}
                        <Col md={3}>
                            <div className="d-flex align-items-center">
                                <CsLineIcons icon="info-circle" className="text-primary me-2" />
                                <div>
                                    <small className="text-muted d-block">Status</small>
                                    <Badge bg={statusVariant} className="px-3 py-1">{inventory.status}</Badge>
                                </div>
                            </div>
                        </Col>
                        {inventory.request_date && (
                            <>
                                <Col md={3}>
                                    <div className="d-flex align-items-center">
                                        <CsLineIcons icon="clock" className="text-primary me-2" />
                                        <div>
                                            <small className="text-muted d-block">Requested Date</small>
                                            <strong>{new Date(inventory.request_date).toLocaleDateString("en-IN")}</strong>
                                        </div>
                                    </div>
                                </Col>
                                <Col md={3}>
                                    <div className="d-flex align-items-center">
                                        <CsLineIcons icon="clock" className="text-primary me-2" />
                                        <div>
                                            <small className="text-muted d-block">Requested Time</small>
                                            <strong>{new Date(inventory.request_date).toLocaleTimeString("en-IN")}</strong>
                                        </div>
                                    </div>
                                </Col>
                            </>
                        )}
                    </Row>
                </Card.Body>
            </Card>

            {(inventory.bill_number || inventory.category || inventory.vendor_name || inventory.paid_amount || inventory.total_amount || inventory.unpaid_amount) && (
                <Card className="mb-4">
                    <Card.Header>
                        <h5 className="mb-0">
                            <CsLineIcons icon="receipt" className="me-2" />
                            Purchase Details
                        </h5>
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
                                    <td>{inventory.bill_number || 'N/A'}</td>
                                    <td>{inventory.category || 'N/A'}</td>
                                    <td>{inventory.vendor_name || 'N/A'}</td>
                                    <td className="text-success fw-bold">₹ {inventory.paid_amount || '0.00'}</td>
                                    <td className="fw-bold">₹ {inventory.total_amount || '0.00'}</td>
                                    <td className={inventory.unpaid_amount > 0 ? 'text-danger fw-bold' : 'text-success fw-bold'}>
                                        ₹ {inventory.unpaid_amount || '0.00'}
                                    </td>
                                </tr>
                            </tbody>
                        </Table>
                    </Card.Body>
                </Card>
            )}

            <Card className="mb-4">
                <Card.Header>
                    <h5 className="mb-0">
                        <CsLineIcons icon="package" className="me-2" />
                        Inventory Items
                    </h5>
                </Card.Header>
                <Card.Body>
                    <Table bordered responsive>
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Product</th>
                                <th>Quantity</th>
                                <th>Price</th>
                            </tr>
                        </thead>
                        <tbody>
                            {inventory.items.map((item, index) => (
                                <tr key={item._id}>
                                    <td>{index + 1}</td>
                                    <td>{item.item_name}</td>
                                    <td>
                                        <Badge bg="info" className="px-3 py-1">
                                            {item.item_quantity} {item.unit}
                                        </Badge>
                                    </td>
                                    <td className="fw-bold">₹ {item.item_price || 'N/A'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </Card.Body>
            </Card>

            {inventory.bill_files && inventory.bill_files.length > 0 && (
                <Card className="mb-4">
                    <Card.Header>
                        <h5 className="mb-0">
                            <CsLineIcons icon="attachment" className="me-2" />
                            Attached Files ({inventory.bill_files.length})
                        </h5>
                    </Card.Header>
                    <Card.Body>
                        <Row>
                            {inventory.bill_files.map((file, idx) => {
                                const fileUrl = `${process.env.REACT_APP_UPLOAD_DIR}${file}`;
                                const isPdf = file.endsWith('.pdf');
                                return (
                                    <Col key={idx} xs={12} md={4} lg={3} className="mb-3">
                                        <Card className="h-100">
                                            <Card.Body className="text-center p-3">
                                                {isPdf ? (
                                                    <div className="d-flex align-items-center justify-content-center mb-2">
                                                        <CsLineIcons icon="file-text" size="48" className="text-danger" />
                                                    </div>
                                                ) : (
                                                    <img
                                                        src={fileUrl}
                                                        alt={`Bill ${idx + 1}`}
                                                        className="img-fluid rounded mb-2"
                                                        style={{ maxHeight: '150px', objectFit: 'cover' }}
                                                        onError={(e) => {
                                                            e.target.onerror = null;
                                                            e.target.style.display = 'none';
                                                            e.target.parentElement.innerHTML = `
                                                                <div class="d-flex align-items-center justify-content-center mb-2" style="height: 150px;">
                                                                    <CsLineIcons icon="image" size="48" class="text-muted" />
                                                                </div>
                                                            `;
                                                        }}
                                                    />
                                                )}
                                                <div className="d-flex justify-content-center gap-2">
                                                    <a href={fileUrl} target="_blank" rel="noreferrer" className="text-decoration-none">
                                                        <Button variant="outline-primary" size="sm">
                                                            <CsLineIcons icon="eye" className="me-1" />
                                                            View
                                                        </Button>
                                                    </a>
                                                    <a href={fileUrl} download className="text-decoration-none">
                                                        <Button variant="outline-success" size="sm">
                                                            <CsLineIcons icon="download" className="me-1" />
                                                            Download
                                                        </Button>
                                                    </a>
                                                </div>
                                            </Card.Body>
                                        </Card>
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
                        <CsLineIcons icon="arrow-left" className="me-2" />
                        Back to Inventory
                    </Button>
                    {inventory.status === "Requested" && (
                        <Button variant="primary" onClick={() => history.push(`/operations/edit-inventory/${id}`)}>
                            <CsLineIcons icon="edit" className="me-2" />
                            Edit Inventory
                        </Button>
                    )}
                </Col>
            </Row>
        </>
    );
};

export default InventoryDetails;