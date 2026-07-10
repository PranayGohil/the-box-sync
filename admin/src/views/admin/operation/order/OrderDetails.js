import React, { useContext, useEffect, useState } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import axios from 'axios';
import { Row, Col, Card, Button, Spinner, Table, Alert, Badge } from 'react-bootstrap';
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import { toast } from 'react-toastify';
import { openPrintWindow } from 'utils/printUtils';
import { AuthContext } from 'contexts/AuthContext';

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
  const { currentUser, activePlans } = useContext(AuthContext);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [printing, setPrinting] = useState(false);
  const [sharing, setSharing] = useState(false);

  const canUseWhatsApp = ['QSR', 'Café', 'Fine Dine', 'Cloud', 'Chain'].includes(currentUser?.purchasedPlan) || activePlans?.includes('Whatsapp-Invoice');

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
    // Trigger compilation reload
    await openPrintWindow(id, setPrinting);
  };

  const handleWhatsAppShare = async () => {
    if (!order) return;
    setSharing(true);

    try {
      // Fetch restaurant profile
      let restaurantName = 'Restaurant';
      let restaurantMobile = '';
      try {
        const userRes = await axios.get(`${process.env.REACT_APP_API}/user/get`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        if (userRes.data) {
          restaurantName = userRes.data.name || 'Restaurant';
          restaurantMobile = userRes.data.mobile || '';
        }
      } catch (fetchErr) {
        console.error("Failed to fetch restaurant info:", fetchErr);
      }

      let message = `*${restaurantName}*\n\n`;
      message += `*Bill No:* ${order.order_no || order.id}\n`;
      message += `*Date:* ${new Date(order.order_date).toLocaleString()}\n`;
      if (order.customer_name) {
        message += `*Customer:* ${order.customer_name}\n`;
      }
      message += `\n*Items:*\n`;
      order.order_items.forEach(item => {
        message += `- ${item.quantity} x ${item.dish_name} - ₹${(item.dish_price * item.quantity).toFixed(2)}\n`;
      });
      message += `\n*Sub Total:* ₹${parseFloat(order.sub_total || 0).toFixed(2)}\n`;
      if (order.cgst_amount > 0) message += `CGST: ₹${parseFloat(order.cgst_amount).toFixed(2)}\n`;
      if (order.sgst_amount > 0) message += `SGST: ₹${parseFloat(order.sgst_amount).toFixed(2)}\n`;
      if (order.vat_amount > 0) message += `VAT: ₹${parseFloat(order.vat_amount).toFixed(2)}\n`;
      if (order.discount_amount > 0) message += `*Discount:* -₹${parseFloat(order.discount_amount).toFixed(2)}\n`;
      if (order.waveoff_amount > 0) message += `*Waveoff:* -₹${parseFloat(order.waveoff_amount).toFixed(2)}\n`;
      message += `*Total Amount:* ₹${parseFloat(order.total_amount || 0).toFixed(2)}\n\n`;
      message += `Thank you for your visit!`;

      const encodedMessage = encodeURIComponent(message);

      let customerPhone = '';
      if (order.customer_details && order.customer_details.phone) {
        customerPhone = order.customer_details.phone;
      } else if (order.customer_phone) {
        customerPhone = order.customer_phone;
      }

      let phoneNumber = customerPhone ? String(customerPhone).replace(/\D/g, '') : '';
      if (!phoneNumber && restaurantMobile) {
        phoneNumber = String(restaurantMobile).replace(/\D/g, '');
      }

      if (phoneNumber && phoneNumber.length === 10) {
        phoneNumber = `91${phoneNumber}`;
      }

      const whatsappUrl = phoneNumber ? `https://wa.me/${phoneNumber}?text=${encodedMessage}` : `https://wa.me/?text=${encodedMessage}`;

      window.open(whatsappUrl, '_blank');
    } catch (err) {
      console.error("Share error:", err);
      toast.error("Failed to generate WhatsApp link");
    } finally {
      setSharing(false);
    }
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
            <h5>Loading Order Details...</h5>
            <p className="text-muted">Please wait while we fetch order information</p>
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
    <>
      <HtmlHead title={title} description={description} />
      <Row>
        <Col>
          <section className="scroll-section" id="title">
            <div className="page-title-container mt-5 pt-1 mt-md-0 pt-md-0 mb-4">
              <Row className="align-items-center gy-3">
                <Col xs="12" md="6">
                  <h1 className="mb-0 pb-0 display-4 fw-bold" style={{ color: '#23b3f4' }}>{title}</h1>
                  <BreadcrumbList items={breadcrumbs} />
                </Col>
                <Col xs="12" md="6" className="text-md-end mt-0 d-flex gap-2 justify-content-md-end flex-wrap flex-md-nowrap">
                  <Button
                    variant="outline-primary"
                    onClick={() => history.push('/operations/order-history')}
                    className="rounded-pill px-4 btn-icon btn-icon-start border-2 fw-bold d-flex align-items-center justify-content-center flex-grow-1 flex-md-grow-0"
                    style={{ minWidth: '100px', borderColor: '#23b3f4', color: '#23b3f4' }}
                  >
                    <CsLineIcons icon="arrow-left" className="me-2" size="15" /> <span>Back</span>
                  </Button>
                  {canUseWhatsApp && (
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
                  )}
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
          </section>

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
                      <strong>{order.customer_name || 'Guest'}</strong>
                      {order.customer_phone && <span className="ms-2 text-muted">({order.customer_phone})</span>}
                    </div>
                  </div>

                  <Row className="g-3 mb-4">
                    <Col xs={6}>
                      <div className="text-small text-muted mb-1">ORDER NUMBER</div>
                      <div className="h6 mb-0">{order.order_no || order.id || '-'}</div>
                    </Col>
                    <Col xs={6}>
                      <div className="text-small text-muted mb-1">ORDER DATE</div>
                      <div className="h6 mb-0">{order.order_date ? new Date(order.order_date).toLocaleString() : '-'}</div>
                    </Col>
                    <Col xs={6}>
                      <div className="text-small text-muted mb-1">ORDER TYPE</div>
                      <div className="h6 mb-0">
                        <Badge bg={
                          order.order_type === 'Dine In' ? 'primary' :
                            order.order_type === 'Takeaway' ? 'warning' :
                              order.order_type === 'Delivery' ? 'success' : 'secondary'
                        } className="rounded-pill px-3">
                          {order.order_type || '-'}
                        </Badge>
                      </div>
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
                    {order.order_type === 'Dine In' && order.table_area && (
                      <Col xs={6}>
                        <div className="text-small text-muted mb-1">TABLE DETAILS</div>
                        <div>
                          <CsLineIcons icon="shop" size={16} className="me-2 text-muted" />
                          {order.table_area} - T{order.table_no || '-'}
                        </div>
                      </Col>
                    )}
                    {order.order_type === 'Takeaway' && (
                      <Col xs={6}>
                        <div className="text-small text-muted mb-1">TOKEN</div>
                        <div className="h6 mb-0">{order.token || '-'}</div>
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
                    <Col xs={6}>
                      <div className="text-small text-muted mb-1">ORDER SOURCE</div>
                      <div>{order.order_source || '-'}</div>
                    </Col>
                  </Row>

                  {order.comment && (
                    <div>
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
        </Col>
      </Row>
    </>
  );
};

export default OrderDetails;