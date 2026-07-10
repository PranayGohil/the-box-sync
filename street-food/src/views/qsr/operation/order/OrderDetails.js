import React, { useEffect, useState } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import axios from 'axios';
import { Row, Col, Card, Button, Spinner, Table, Alert, Badge, Form, Modal } from 'react-bootstrap';
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import { toast } from 'react-toastify';
import { openPrintWindow } from 'utils/printUtils';

const OrderDetails = () => {
  const title = 'Order Details';
  const description = 'Detailed view of a specific order including customer, billing, and order items.';

  const breadcrumbs = [
    { to: '', text: 'Home' },
    { to: 'operations', text: 'Operations' },
    { to: 'operations/order-history', text: 'Order History' },
    { to: '', title: 'Order Details' },
  ];

  const { id } = useParams();
  const history = useHistory();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [printing, setPrinting] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [inputPhoneNumber, setInputPhoneNumber] = useState('');
  const [inputCustomerName, setInputCustomerName] = useState('');
  const [restaurantInfo, setRestaurantInfo] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch order data
        const orderRes = await axios.get(`${process.env.REACT_APP_API}/order/get/${id}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });

        console.log('Order Response:', orderRes.data);

        if (orderRes.data.success) {
          const orderData = orderRes.data.data;
          const transformedOrder = {
            ...orderData,
            id: orderData._id,
          };
          console.log('Fetched Order:', transformedOrder);
          setOrder(transformedOrder);
        } else {
          setError(orderRes.data.message);
          toast.error(orderRes.data.message);
        }
        // Fetch restaurant profile info
        try {
          const userRes = await axios.get(`${process.env.REACT_APP_API}/user/get`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          });
          if (userRes.data) {
            setRestaurantInfo(userRes.data);
          }
        } catch (fetchErr) {
          console.error("Failed to fetch restaurant info:", fetchErr);
        }
      } catch (err) {
        console.log('Error fetching order:', err);
        setError(err.response?.data?.message || 'Unable to fetch order');
        toast.error('Unable to fetch order');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handlePrint = async () => {
    if (!order) return;
    await openPrintWindow(order.id, setPrinting);
  };

  const sendWhatsAppMessage = async (phoneVal) => {
    setSharing(true);
    try {
      const restaurantName = restaurantInfo?.name || 'Restaurant';

      let message = `*${restaurantName}*\n`;
      message += `*Order Summary*\n\n`;
      if (restaurantInfo?.gst_no) {
        message += `*GSTIN:* ${restaurantInfo.gst_no}\n`;
      }
      if (restaurantInfo?.fssai_no) {
        message += `*FSSAI No:* ${restaurantInfo.fssai_no}\n`;
      }


      message += `*Customer Name :* ${order.customer_name || 'Guest'}\n`;
      const contactNum = order.customer_phone || order.customer_details?.phone || '';
      message += `*Customer Contact :* ${contactNum}\n`;
      message += `*Bill No:* ${order.order_no || order.id}\n`;
      message += `*Date:* ${new Date(order.order_date).toLocaleString('en-IN', { year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true })}\n\n`;

      message += `*Items:*\n`;
      order.order_items.forEach(item => {
        message += `- ${item.quantity} x ${item.dish_name} - ₹${(item.dish_price * item.quantity).toFixed(2)}\n`;
      });
      message += `\n*Sub Total:* ₹${parseFloat(order.sub_total || 0).toFixed(2)}\n`;
      if (order.cgst_amount > 0) message += `*CGST:* ₹${parseFloat(order.cgst_amount).toFixed(2)}\n`;
      if (order.sgst_amount > 0) message += `*SGST:* ₹${parseFloat(order.sgst_amount).toFixed(2)}\n`;
      if (order.vat_amount > 0) message += `*VAT:* ₹${parseFloat(order.vat_amount).toFixed(2)}\n`;
      if (order.discount_amount > 0) message += `*Discount:* -₹${parseFloat(order.discount_amount).toFixed(2)}\n`;
      if (order.waveoff_amount > 0) message += `*Waveoff:* -₹${parseFloat(order.waveoff_amount).toFixed(2)}\n`;
      message += `*Total Amount:* ₹${parseFloat(order.total_amount || 0).toFixed(2)}\n\n`;
      message += `Thank you for your visit!`;

      const encodedMessage = encodeURIComponent(message);
      let phoneNumber = phoneVal ? String(phoneVal).replace(/\D/g, '') : '';
      
      if (phoneNumber && phoneNumber.length === 10) {
        phoneNumber = `91${phoneNumber}`;
      }
      
      const whatsappUrl = phoneNumber ? `https://wa.me/${phoneNumber}?text=${encodedMessage}` : `https://wa.me/?text=${encodedMessage}`;
      window.open(whatsappUrl, '_blank');
    } catch (err) {
      console.error("WhatsApp share error:", err);
      toast.error("Failed to generate WhatsApp link");
    } finally {
      setSharing(false);
    }
  };

  const saveCustomerDetailsAndSend = async () => {
    if (inputPhoneNumber.length !== 10) {
      alert('Please enter a valid 10-digit mobile number');
      return;
    }
    setSharing(true);
    setShowWhatsAppModal(false);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.put(`${process.env.REACT_APP_API}/order/update-status/${order.id}`, {
        customer_name: inputCustomerName,
        customer_phone: inputPhoneNumber
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setOrder((prev) => ({
          ...prev,
          customer_name: inputCustomerName,
          customer_phone: inputPhoneNumber,
          customer_details: {
            ...prev?.customer_details,
            phone: inputPhoneNumber
          }
        }));
        toast.success("Customer details updated successfully");
      }
    } catch (err) {
      console.error("Failed to save customer details:", err);
      toast.error("Failed to update customer details on server");
    }
    await sendWhatsAppMessage(inputPhoneNumber);
  };

  const handleWhatsAppShare = async () => {
    if (!order) return;

    let customerPhone = '';
    if (order.customer_details && order.customer_details.phone) {
      customerPhone = order.customer_details.phone;
    } else if (order.customer_phone) {
      customerPhone = order.customer_phone;
    }

    if (!customerPhone) {
      setInputPhoneNumber('');
      setInputCustomerName(order.customer_name || '');
      setShowWhatsAppModal(true);
      return;
    }

    await sendWhatsAppMessage(customerPhone);
  };

  if (loading) {
    return (
      <>
        <HtmlHead title={title} description={description} />
        <div className="page-title-container mt-5 pt-1 mt-md-0 pt-md-0 mb-4">
          <h1 className="mb-0 pb-0 display-4">{title}</h1>
          <BreadcrumbList items={breadcrumbs} />
        </div>
        <Row className="justify-content-center py-5">
          <Col xs={12} className="text-center">
            <Spinner animation="border" variant="primary" className="mb-3" />
            <h5>Loading...</h5>
          </Col>
        </Row>
      </>
    );
  }

  if (error) {
    return (
      <>
        <HtmlHead title={title} description={description} />
        <div className="page-title-container mt-5 pt-1 mt-md-0 pt-md-0 mb-4">
          <h1 className="mb-0 pb-0 display-4">{title}</h1>
          <BreadcrumbList items={breadcrumbs} />
        </div>
        <Row className="justify-content-center py-5">
          <Col xs={12} md={8}>
            <Alert variant="danger" className="text-center">
              <CsLineIcons icon="error" size={32} className="mb-3" />
              <h4>Error Loading Order</h4>
              <p>{error}</p>
              <Button variant="secondary" onClick={() => history.push('/operations/order-history')}>
                Back to Order History
              </Button>
            </Alert>
          </Col>
        </Row>
      </>
    );
  }

  if (!order) {
    return (
      <>
        <HtmlHead title={title} description={description} />
        <div className="page-title-container mt-5 pt-1 mt-md-0 pt-md-0 mb-4">
          <h1 className="mb-0 pb-0 display-4">{title}</h1>
          <BreadcrumbList items={breadcrumbs} />
        </div>
        <Row className="justify-content-center py-5">
          <Col xs={12} md={8}>
            <Alert variant="warning" className="text-center">
              <CsLineIcons icon="search" size={32} className="mb-3" />
              <h4>Order Not Found</h4>
              <p>The requested order could not be found or has been deleted.</p>
              <Button variant="secondary" onClick={() => history.push('/operations/order-history')}>
                Back to Order History
              </Button>
            </Alert>
          </Col>
        </Row>
      </>
    );
  }

  return (
    <div className="container-fluid qsr-page-container">
      <HtmlHead title={title} description={description} />
      <div className="qsr-page-title-container mt-5 pt-1 mt-md-0 pt-md-0 mb-4">
        <Row className="g-0 align-items-center">
          <Col xs="auto" className="me-auto">
            <h1 className="qsr-page-title">{title}</h1>
            <BreadcrumbList items={breadcrumbs} />
          </Col>
        </Row>
        <Row className="g-0 mt-3">
          <Col xs="12" className="d-flex gap-2 flex-wrap justify-content-start">
            <Button
              variant="outline-primary"
              onClick={() => history.push('/operations/order-history')}
              className="rounded-pill px-4 btn-icon btn-icon-start border-2 fw-bold d-flex align-items-center justify-content-center flex-grow-1 flex-md-grow-0"
              style={{ minWidth: '100px', borderColor: '#23b3f4', color: '#23b3f4' }}
            >
              <CsLineIcons icon="arrow-left" className="me-2" size="15" /> <span>Back</span>
            </Button>
            <Button
              variant="outline-primary"
              onClick={handleWhatsAppShare}
              disabled={sharing || !order}
              className="rounded-pill px-4 btn-icon btn-icon-start border-2 fw-bold d-flex align-items-center justify-content-center flex-grow-1 flex-md-grow-0"
              style={{ minWidth: '130px', borderColor: '#23b3f4', color: '#23b3f4' }}
            >
              {sharing ? (
                <>
                  <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                  <span className="ms-2">Opening...</span>
                </>
              ) : (
                <>
                  <CsLineIcons icon="whatsapp" className="me-2" size="15" /> <span>WhatsApp</span>
                </>
              )}
            </Button>
            <Button
              variant="outline-primary"
              onClick={handlePrint}
              disabled={printing}
              className="rounded-pill px-4 btn-icon btn-icon-start border-2 fw-bold d-flex align-items-center justify-content-center flex-grow-1 flex-md-grow-0"
              style={{ minWidth: '130px', borderColor: '#23b3f4', color: '#23b3f4' }}
            >
              {printing ? (
                <>
                  <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                  <span className="ms-2">Printing...</span>
                </>
              ) : (
                <>
                  <CsLineIcons icon="print" className="me-2" size="15" /> <span>Print Invoice</span>
                </>
              )}
            </Button>
          </Col>
        </Row>
      </div>

      <Row className="mb-n4">
        <Col xl="5" className="mb-4">
          <Card className="h-100 border-0 shadow-sm" style={{ borderRadius: '1.25rem' }}>
            <Card.Header className="border-0 bg-transparent pt-4 px-4">
              <h4 className="mb-0 fw-bold d-flex align-items-center" style={{ color: '#23b3f4' }}>
                <CsLineIcons icon="info-hexagon" className="me-2" size="20" />
                Order Information
              </h4>
            </Card.Header>
            <Card.Body>
              <div className="mb-4">
                <div className="text-small text-muted mb-1">CUSTOMER INFO</div>
                <div className="mb-2">
                  <CsLineIcons icon="user" size={16} className="me-2 text-muted" />
                  <strong>Name: </strong>
                  <span>{order.customer_name || 'Guest'}</span>
                </div>
                <div>
                  <CsLineIcons icon="phone" size={16} className="me-2 text-muted" />
                  <strong>Contact: </strong>
                  <span>{order.customer_phone || order.customer_details?.phone || 'N/A'}</span>
                </div>
              </div>

              <Row className="g-3 mb-4">
                <Col xs={6}>
                  <div className="text-small text-muted mb-1">ORDER NUMBER</div>
                  <div className="h6 mb-0">{order.order_no || order.id || '-'}</div>
                </Col>
                <Col xs={6}>
                  <div className="text-small text-muted mb-1">ORDER DATE</div>
                  <div className="h6 mb-0">{order.order_date ? new Date(order.order_date).toLocaleString('en-IN', { year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true }) : '-'}</div>
                </Col>
                <Col xs={6}>
                  <div className="text-small text-muted mb-1">STATUS</div>
                  <div className="h6 mb-0">
                    <Badge bg={
                      order.order_status === 'Paid' || order.order_status === 'Completed' || order.order_status === 'Save' ? 'success' :
                        order.order_status === 'KOT' ? 'warning' :
                          order.order_status === 'Cancelled' ? 'danger' : 'secondary'
                    } className="rounded-pill px-3">
                      {order.order_status || '-'}
                    </Badge>
                  </div>
                </Col>
              </Row>

              <Row className="g-3 mb-4">
                {order.table_area && (
                  <Col xs={6}>
                    <div className="text-small text-muted mb-1">TABLE DETAILS</div>
                    <div>
                      <CsLineIcons icon="shop" size={16} className="me-2 text-muted" />
                      {order.table_area} - T{order.table_no || '-'}
                    </div>
                  </Col>
                )}
                {order.token && (
                  <Col xs={6}>
                    <div className="text-small text-muted mb-1">TOKEN</div>
                    <div className="h6 mb-0">{order.token}</div>
                  </Col>
                )}
                <Col xs={6}>
                  <div className="text-small text-muted mb-1">PAYMENT TYPE</div>
                  <div>
                    <CsLineIcons icon="credit-card" size={16} className="me-2 text-muted" />
                    {order.payment_type || 'Not specified'}
                  </div>
                </Col>
                {order.waiter && (
                  <Col xs={6}>
                    <div className="text-small text-muted mb-1">WAITER</div>
                    <div>{order.waiter}</div>
                  </Col>
                )}
                {order.total_persons && (
                  <Col xs={6}>
                    <div className="text-small text-muted mb-1">TOTAL PERSONS</div>
                    <div>
                      <CsLineIcons icon="user" size={16} className="me-2 text-muted" />
                      {order.total_persons}
                    </div>
                  </Col>
                )}
              </Row>

              {order.comment && (
                <div className="mb-4">
                  <div className="text-small text-muted mb-1">COMMENT</div>
                  <div className="bg-light p-2 rounded">{order.comment}</div>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col xl="7" className="mb-4">
          <Card className="h-100 border-0 shadow-sm" style={{ borderRadius: '1.25rem' }}>
            <Card.Header className="border-0 bg-transparent pt-4 px-4">
              <h4 className="mb-0 fw-bold d-flex align-items-center" style={{ color: '#23b3f4' }}>
                <CsLineIcons icon="restaurant" className="me-2" size="20" />
                Order Items
              </h4>
            </Card.Header>
        <Card.Body>
          <div className="table-responsive d-none d-md-block">
            <Table className="align-middle" hover>
              <thead className="table-light">
                <tr>
                  <th scope="col" className="text-muted text-small text-uppercase">No.</th>
                  <th scope="col" className="text-muted text-small text-uppercase">Dish</th>
                  <th scope="col" className="text-muted text-small text-uppercase text-center">Quantity</th>
                  <th scope="col" className="text-muted text-small text-uppercase text-end">Price</th>
                  <th scope="col" className="text-muted text-small text-uppercase text-end">Amount</th>
                  <th scope="col" className="text-muted text-small text-uppercase text-center">Status</th>
                  <th scope="col" className="text-muted text-small text-uppercase">Note</th>
                </tr>
              </thead>
              <tbody>
                {order.order_items?.map((item, index) => (
                  <tr key={`${item.dish_name}-${index}`}>
                    <td className="text-muted">{index + 1}</td>
                    <td className="fw-medium">
                      {item.dish_name}
                      {((item.selected_variant && (item.selected_variant.size_name || item.selected_variant.extra)) || (Array.isArray(item.selected_addons) && item.selected_addons.filter(a => a && a.addon_name).length > 0)) && (
                        <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', marginTop: '2px', lineHeight: 1.2 }}>
                          {item.selected_variant && (item.selected_variant.size_name || item.selected_variant.extra) && (
                            <>
                              {item.selected_variant.size_name ? `Size: ${item.selected_variant.size_name}` : ''}
                              {item.selected_variant.extra && ` (${item.selected_variant.extra})`}
                            </>
                          )}
                          {item.selected_variant && item.selected_variant.size_name && Array.isArray(item.selected_addons) && item.selected_addons.filter(a => a && a.addon_name).length > 0 && ' • '}
                          {Array.isArray(item.selected_addons) && item.selected_addons.filter(a => a && a.addon_name).map(addon => `${addon.addon_name} (+₹${addon.price})`).join(' • ')}
                        </div>
                      )}
                    </td>
                    <td className="text-center">{item.quantity}</td>
                    <td className="text-end">₹ {parseFloat(item.dish_price).toFixed(2)}</td>
                    <td className="text-end fw-medium text-primary">₹ {(parseFloat(item.dish_price) * parseFloat(item.quantity)).toFixed(2)}</td>
                    <td className="text-center">
                      <Badge bg={
                        item.status === 'Served' || item.status === 'Completed' || item.status === 'Paid' ? 'success' :
                          item.status === 'Preparing' || item.status === 'KOT' ? 'warning' :
                            item.status === 'Cancelled' ? 'danger' : 'secondary'
                      } className="rounded-pill px-3">
                        {item.status || 'Pending'}
                      </Badge>
                    </td>
                    <td className="text-muted text-small">{item.special_notes || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>

          {/* Mobile View Items */}
          <div className="d-md-none">
            {order.order_items?.map((item, index) => (
              <div key={`${item.dish_name}-${index}`} className="border-bottom py-3 last-child-border-0">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <div className="d-flex align-items-center">
                    <div className="bg-light-primary text-primary sw-4 sh-4 rounded-circle d-flex align-items-center justify-content-center me-3 fw-bold small">
                      {index + 1}
                    </div>
                    <div>
                      <div className="fw-bold text-dark">{item.dish_name}</div>
                      {((item.selected_variant && (item.selected_variant.size_name || item.selected_variant.extra)) || (Array.isArray(item.selected_addons) && item.selected_addons.filter(a => a && a.addon_name).length > 0)) && (
                        <div className="text-muted xsmall" style={{ fontWeight: 600, color: '#64748b', marginTop: '2px', lineHeight: 1.2 }}>
                          {item.selected_variant && (item.selected_variant.size_name || item.selected_variant.extra) && (
                            <>
                              {item.selected_variant.size_name ? `Size: ${item.selected_variant.size_name}` : ''}
                              {item.selected_variant.extra && ` (${item.selected_variant.extra})`}
                            </>
                          )}
                          {item.selected_variant && item.selected_variant.size_name && Array.isArray(item.selected_addons) && item.selected_addons.filter(a => a && a.addon_name).length > 0 && ' • '}
                          {Array.isArray(item.selected_addons) && item.selected_addons.filter(a => a && a.addon_name).map(addon => `${addon.addon_name} (+₹${addon.price})`).join(' • ')}
                        </div>
                      )}
                      <div className="text-muted xsmall">Qty: {item.quantity} × ₹{parseFloat(item.dish_price).toFixed(2)}</div>
                    </div>
                  </div>
                  <Badge bg={
                    item.status === 'Served' || item.status === 'Completed' || item.status === 'Paid' ? 'success' :
                      item.status === 'Preparing' || item.status === 'KOT' ? 'warning' :
                        item.status === 'Cancelled' ? 'danger' : 'secondary'
                  } className="rounded-pill px-2">
                    {item.status || 'Pending'}
                  </Badge>
                </div>
                <div className="d-flex justify-content-between align-items-center ps-7">
                  <div className="text-muted xsmall italic">{item.special_notes ? `Note: ${item.special_notes}` : ''}</div>
                  <div className="fw-bold text-primary">₹ {(parseFloat(item.dish_price) * parseFloat(item.quantity)).toFixed(2)}</div>
                </div>
              </div>
            ))}
          </div>
          
          <Row className="mt-4 border-top pt-4">
            <Col xs={12} md={6} className="d-none d-md-block" />
            <Col xs={12} md={6}>
              <div className="d-flex justify-content-between mb-2">
                <span className="text-muted">Sub Total</span>
                <span className="fw-medium">₹ {parseFloat(order.sub_total || 0).toFixed(2)}</span>
              </div>
              {order.cgst_amount > 0 && (
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">CGST ({order.cgst_percent || 0}%)</span>
                  <span>₹ {parseFloat(order.cgst_amount || 0).toFixed(2)}</span>
                </div>
              )}
              {order.sgst_amount > 0 && (
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">SGST ({order.sgst_percent || 0}%)</span>
                  <span>₹ {parseFloat(order.sgst_amount || 0).toFixed(2)}</span>
                </div>
              )}
              {order.vat_amount > 0 && (
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">VAT ({order.vat_percent || 0}%)</span>
                  <span>₹ {parseFloat(order.vat_amount || 0).toFixed(2)}</span>
                </div>
              )}
              {order.discount_amount > 0 && (
                <div className="d-flex justify-content-between mb-2 text-danger">
                  <span>Discount</span>
                  <span>- ₹ {parseFloat(order.discount_amount || 0).toFixed(2)}</span>
                </div>
              )}
              {order.waveoff_amount > 0 && (
                <div className="d-flex justify-content-between mb-2 text-warning">
                  <span>Waveoff Amount</span>
                  <span>- ₹ {parseFloat(order.waveoff_amount || 0).toFixed(2)}</span>
                </div>
              )}
              <hr className="my-2" />
              <div className="d-flex justify-content-between mb-2 h5 fw-bold">
                <span className="text-primary">Total Amount</span>
                <span className="text-primary">₹ {parseFloat(order.total_amount || order.bill_amount || 0).toFixed(2)}</span>
              </div>
              <div className="d-flex justify-content-between mb-0 h6 fw-bold">
                <span className="text-success">Paid Amount</span>
                <span className="text-success">₹ {parseFloat(order.paid_amount || order.bill_amount || 0).toFixed(2)}</span>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>
    </Col>
  </Row>
      <Modal show={showWhatsAppModal} onHide={() => setShowWhatsAppModal(false)} centered className="modal-custom-whatsapp">
        <style>{`
          .modal-custom-whatsapp .modal-content {
            border-radius: 16px;
            border: none;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15);
            overflow: hidden;
          }
          .modal-custom-whatsapp .modal-header {
            background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
            border-bottom: 1px solid #bbf7d0;
            padding: 20px 24px;
          }
          .modal-custom-whatsapp .modal-title {
            font-weight: 800;
            color: #166534;
            display: flex;
            align-items: center;
            gap: 12px;
          }
          .modal-custom-whatsapp .modal-body {
            padding: 24px;
            background: #fff;
          }
          .modal-custom-whatsapp .modal-footer {
            background: #f8fafc;
            border-top: 1px solid #e2e8f0;
            padding: 16px 24px;
          }
          .whatsapp-input {
            border-radius: 10px !important;
            border: 2px solid #e2e8f0 !important;
            padding: 10px 15px !important;
            font-size: 14px !important;
            font-weight: 600 !important;
            transition: all 0.2s ease-in-out !important;
          }
          .whatsapp-input:focus {
            border-color: #22c55e !important;
            box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.15) !important;
            outline: none !important;
          }
          .whatsapp-btn-send {
            background: #22c55e !important;
            border: none !important;
            border-radius: 50px !important;
            padding: 10px 24px !important;
            font-weight: 700 !important;
            color: #fff !important;
            box-shadow: 0 4px 12px rgba(34, 197, 94, 0.25) !important;
            transition: all 0.2s ease-in-out !important;
          }
          .whatsapp-btn-send:hover {
            background: #15803d !important;
            box-shadow: 0 6px 16px rgba(34, 197, 94, 0.35) !important;
          }
          .whatsapp-btn-cancel {
            background: #e2e8f0 !important;
            border: none !important;
            border-radius: 50px !important;
            padding: 10px 24px !important;
            font-weight: 700 !important;
            color: #475569 !important;
            transition: all 0.2s ease-in-out !important;
          }
          .whatsapp-btn-cancel:hover {
            background: #cbd5e1 !important;
          }
        `}</style>
        <Modal.Header closeButton>
          <Modal.Title>
            <div style={{ background: '#22c55e', color: '#fff', width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '10px' }}>
              <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.414 0 .018 5.393 0 12.03c0 2.12.554 4.189 1.602 6.006L0 24l6.117-1.604a11.803 11.803 0 005.925 1.585h.005c6.634 0 12.032-5.391 12.036-12.028a11.8 11.8 0 00-3.417-8.467z" />
              </svg>
            </div>
            Send WhatsApp Bill
          </Modal.Title>
        </Modal.Header>
         <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label className="small fw-bold text-secondary">Customer Name</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter customer name (optional)"
              className="whatsapp-input mb-3"
              value={inputCustomerName}
              onChange={(e) => setInputCustomerName(e.target.value)}
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label className="small fw-bold text-secondary">Customer Contact Number *</Form.Label>
            <Form.Control
              type="text"
              pattern="[0-9]*"
              maxLength="10"
              placeholder="Enter 10-digit mobile number"
              className="whatsapp-input"
              value={inputPhoneNumber}
              onChange={(e) => setInputPhoneNumber(e.target.value.replace(/\D/g, ''))}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button className="whatsapp-btn-cancel" onClick={() => setShowWhatsAppModal(false)}>
            Cancel
          </Button>
          <Button
            className="whatsapp-btn-send"
            onClick={saveCustomerDetailsAndSend}
          >
            Send WhatsApp
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default OrderDetails;