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
                            <h5>Loading...</h5>
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
      flex-wrap: wrap;
      gap: 1.5rem;
    }
    @media (max-width: 768px) {
      .overview-bar {
        flex-direction: column;
        align-items: flex-start;
      }
      .overview-bar > div {
        width: 100%;
      }
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
    .mobile-label {
      display: none;
    }
    .section-card {
      background: #ffffff !important;
      border-radius: 2rem !important;
      border: 1px solid rgba(0,0,0,0.05) !important;
      padding: 2.5rem !important;
      box-shadow: 0 10px 40px rgba(0,0,0,0.02) !important;
      margin-bottom: 2.5rem;
    }
    @media (max-width: 768px) {
      .section-card {
        padding: 1.5rem !important;
      }
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
    @media (max-width: 991px) {
      .item-row-card {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.75rem;
      }
      .item-row-card > div {
        width: 100% !important;
        text-align: left !important;
      }
      .item-row-card .mobile-label {
        display: block !important;
        font-size: 0.65rem;
        color: #94a3b8;
        font-weight: 800;
        text-transform: uppercase;
        margin-bottom: 0.15rem;
      }
    }
    @media (min-width: 992px) {
      .item-row-card .mobile-label {
        display: none !important;
      }
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
    @media (max-width: 768px) {
      .summary-hub {
        padding: 1.5rem;
      }
    }
    .total-display {
      background: #ffffff;
      border-radius: 1rem;
      padding: 1.5rem;
      border: 1.5px solid #23b3f4;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1.5rem;
    }
    @media (max-width: 768px) {
      .total-display {
        flex-direction: column;
        align-items: flex-start;
      }
      .total-display > div {
        width: 100% !important;
        text-align: left !important;
      }
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

    return (
        <div className="details-container">
            <style>{customStyles}</style>
            <HtmlHead title={title} description={description} />
            <div className="container-fluid px-3 px-lg-5">
                <div className="page-title-container mb-4 pt-4">
                    <Row className="g-3 align-items-center">
                        <Col xs={12} lg={7}>
                            <h1 className="mb-0 pb-0 display-4 fw-bold" style={{ color: '#23b3f4' }}>{title}</h1>
                            <BreadcrumbList items={breadcrumbs} />
                        </Col>
                        <Col xs={12} lg={5} className="d-flex flex-wrap justify-content-start justify-content-lg-end gap-2 mt-3 mt-lg-0">
                            <Button variant="outline-secondary" onClick={() => history.push('/operations/inventory-history')} className="btn-action rounded-pill px-4 fw-bold border-2">
                                <CsLineIcons icon="arrow-left" size="14" className="me-2" /> Back
                            </Button>
                            {inventory.status === "Requested" && (
                                <Button variant="outline-primary" onClick={() => history.push(`/operations/edit-inventory/${id}`)} className="btn-action rounded-pill px-4 fw-bold border-2">
                                    <CsLineIcons icon="edit" size="14" className="me-2" /> Edit Request
                                </Button>
                            )}
                        </Col>
                    </Row>
                </div>

                <div className="overview-bar">
                    <div className="d-flex flex-wrap gap-5">
                        {inventory.bill_date && (
                            <div>
                                <div className="info-label">Bill Date</div>
                                <div className="info-val">{new Date(inventory.bill_date).toLocaleDateString('en-IN')}</div>
                            </div>
                        )}
                        {inventory.request_date && (
                            <div>
                                <div className="info-label">Requested On</div>
                                <div className="info-val">
                                    {new Date(inventory.request_date).toLocaleDateString('en-IN')} at{' '}
                                    {new Date(inventory.request_date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>
                        )}
                    </div>
                    <Badge bg={statusVariant} className="status-badge shadow-sm">
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

                {(inventory.bill_number || inventory.category || inventory.vendor_name) && (
                    <Card className="section-card border-0">
                        <div className="section-label">
                            <CsLineIcons icon="receipt" size="18" /> Purchase Information
                        </div>
                        <Row className="g-4">
                            <Col xs={12} md={4}>
                                <div>
                                    <div className="info-label">Bill Number</div>
                                    <div className="h5 fw-bold mb-0">{inventory.bill_number || 'N/A'}</div>
                                </div>
                            </Col>
                            <Col xs={6} md={4}>
                                <div>
                                    <div className="info-label">Category</div>
                                    <div className="h5 fw-bold mb-0">{inventory.category || 'N/A'}</div>
                                </div>
                            </Col>
                            <Col xs={6} md={4}>
                                <div>
                                    <div className="info-label">Vendor Name</div>
                                    <div className="h5 fw-bold mb-0">{inventory.vendor_name || 'N/A'}</div>
                                </div>
                            </Col>
                        </Row>
                    </Card>
                )}

                <Card className="section-card border-0">
                    <div className="section-label">
                        <CsLineIcons icon="package" size="18" /> Inventory Items
                    </div>
                    {/* Desktop View */}
                    <div className="d-none d-lg-block">
                        <div className="item-header-row">
                            <div style={{ width: '60px' }}>#</div>
                            <div style={{ flex: 4 }}>Description</div>
                            <div style={{ flex: 2 }}>Quantity</div>
                            <div style={{ flex: 2 }} className="text-end">Price</div>
                        </div>
                        {inventory.items.map((item, index) => (
                            <div key={index} className="item-row-card">
                                <div style={{ width: '60px' }} className="fw-bold text-muted">
                                    {index + 1}
                                </div>
                                <div style={{ flex: 4 }} className="fw-bold text-dark">
                                    {item.item_name}
                                </div>
                                <div style={{ flex: 2 }} className="fw-bold text-primary">
                                    {item.item_quantity} {item.unit}
                                </div>
                                <div style={{ flex: 2 }} className="text-end fw-bold">
                                    ₹ {item.item_price || 'N/A'}
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
                                            <div className="text-muted small fw-bold" style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Price</div>
                                            <div className="fw-bold text-dark mt-0.5">₹ {item.item_price || 'N/A'}</div>
                                        </div>
                                    </Col>
                                </Row>
                            </div>
                        ))}
                    </div>

                    {(inventory.paid_amount || inventory.total_amount || inventory.unpaid_amount) && (
                        <div className="summary-hub mt-5">
                            <Row className="g-4">
                                <Col md={12}>
                                    <div className="total-display shadow-sm">
                                        <div>
                                            <div className="info-label mb-1">Total Grand Amount</div>
                                            <div className="total-val">₹ {Number(inventory.total_amount || 0).toFixed(2)}</div>
                                        </div>
                                        <div className="text-md-end">
                                            <div>
                                                <div className="info-label">Amount Paid</div>
                                                <div className="h3 fw-bold text-success mb-0">₹ {Number(inventory.paid_amount || 0).toFixed(2)}</div>
                                            </div>
                                        </div>
                                    </div>
                                </Col>
                                <Col md={12} className="text-md-end pt-3 d-flex flex-column flex-md-row justify-content-between align-items-center gap-3">
                                    <div className="d-flex align-items-center gap-2">
                                        <div className={`sw-2 sh-2 rounded-circle bg-${Number(inventory.unpaid_amount || 0) > 0 ? 'warning' : 'success'}`} />
                                        <span className="fw-bold text-muted">
                                            Balance {Number(inventory.unpaid_amount || 0) > 0 ? 'Due' : 'Cleared'}: ₹ {Number(inventory.unpaid_amount || 0).toFixed(2)}
                                        </span>
                                    </div>
                                </Col>
                            </Row>
                        </div>
                    )}
                </Card>

                {inventory.bill_files && inventory.bill_files.length > 0 && (
                    <Card className="section-card border-0">
                        <div className="section-label">
                            <CsLineIcons icon="attachment" size="18" /> Supporting Documents ({inventory.bill_files.length})
                        </div>
                        <Row className="g-3">
                            {inventory.bill_files.map((file, idx) => {
                                const fileUrl = `${process.env.REACT_APP_UPLOAD_DIR}${file}`;
                                const isPdf = file.toLowerCase().endsWith('.pdf');
                                return (
                                    <Col key={idx} xs={12} md={4} lg={3}>
                                        <div className="file-card h-100">
                                            <div className="mb-3 d-flex justify-content-center align-items-center" style={{ height: '150px', background: '#f8fafc', borderRadius: '12px' }}>
                                                {isPdf ? (
                                                    <CsLineIcons icon="file-text" size="48" className="text-danger" />
                                                ) : (
                                                    <img src={fileUrl} alt={`Bill ${idx + 1}`} className="img-fluid rounded h-100" style={{ objectFit: 'cover' }} />
                                                )}
                                            </div>
                                            <div className="d-flex justify-content-center gap-2">
                                                <a href={fileUrl} target="_blank" rel="noreferrer" className="text-decoration-none flex-grow-1">
                                                    <Button variant="outline-primary" size="sm" className="rounded-pill w-100 border-2 fw-bold">
                                                        <CsLineIcons icon="eye" size="12" className="me-1" /> View
                                                    </Button>
                                                </a>
                                                <a href={fileUrl} download className="text-decoration-none flex-grow-1">
                                                    <Button variant="outline-success" size="sm" className="rounded-pill w-100 border-2 fw-bold">
                                                        <CsLineIcons icon="download" size="12" className="me-1" /> Get
                                                    </Button>
                                                </a>
                                            </div>
                                        </div>
                                    </Col>
                                );
                            })}
                        </Row>
                    </Card>
                )}
            </div>
        </div>
    );
};

export default InventoryDetails;