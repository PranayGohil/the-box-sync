import React, { useEffect, useState } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import axios from 'axios';
import { Row, Col, Card, Button, Spinner, Table, Alert, Badge } from 'react-bootstrap';
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import { toast } from 'react-toastify';

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

  const printCounterBill = (ord, userData, counterName, items) => {
    return `
      <div style="page-break-after: always; font-family: Arial, sans-serif; max-width: 400px; margin: 0 auto; padding: 10px; border: 1px solid #ccc;">
        <!-- Restaurant Header -->
        <div style="text-align: center; margin-bottom: 10px;">
          <h3 style="margin: 5px;">${userData.name}</h3>
        </div>

        <hr style="border: 0.5px dashed #ccc;" />

        <!-- Counter Badge -->
        <div style="text-align: center; margin: 8px 0;">
          <span style="background: #000; color: #fff; padding: 4px 16px; border-radius: 4px; font-size: 14px; font-weight: bold;">
            ${counterName} Counter
          </span>
        </div>

        <hr style="border: 0.5px dashed #ccc;" />

        <!-- Order Info -->
        <table style="width: 100%; font-size: 12px; margin-bottom: 8px;">
          <tr>
            <td><strong>Bill No:</strong> ${ord.order_no || ord._id}</td>
            <td style="text-align: right;"><strong>${ord.order_type}</strong></td>
          </tr>
          <tr>
            <td><strong>Date:</strong> ${new Date(ord.order_date).toLocaleString()}</td>
            <td style="text-align: right;">
              ${ord.table_no
        ? `<strong>Table:</strong> ${ord.table_no}`
        : ord.token
          ? `<strong>Token:</strong> ${ord.token}`
          : ''}
            </td>
          </tr>
          ${ord.customer_name
        ? `<tr><td colspan="2"><strong>Customer:</strong> ${ord.customer_name}</td></tr>`
        : ''}
        </table>

        <!-- Items Table -->
        <table style="width: 100%; font-size: 12px; margin-bottom: 10px;">
          <thead>
            <tr>
              <th style="text-align: left; border-bottom: 1px solid #ccc;">Item</th>
              <th style="text-align: center; border-bottom: 1px solid #ccc;">Qty</th>
            </tr>
          </thead>
          <tbody>
            ${items.map(item => `
              <tr>
                <td>${item.dish_name}</td>
                <td style="text-align: center;">${item.quantity}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

      </div>
    `;
  };

  const printFullBill = (ord, userData, items, subTotal) => {
    return `
      <div style="page-break-after: always; font-family: Arial, sans-serif; max-width: 400px; margin: 0 auto; padding: 10px; border: 1px solid #ccc;">
        <!-- Restaurant Header -->
        <div style="text-align: center; margin-bottom: 10px;">
          <h2 style="margin: 5px;">${userData.name}</h2>
          <p style="margin: 0; font-size: 14px;">${userData.address}</p>
          <p style="margin: 0; font-size: 14px;">${userData.city}, ${userData.state} - ${userData.pincode}</p>
          <p style="margin: 5px; font-size: 14px;"><strong>Ph:</strong> ${userData.mobile}</p>
          ${userData.gst_no ? `<p style="font-size: 14px;"><strong>GST:</strong> ${userData.gst_no}</p>` : ''}
        </div>

        <hr style="border: 0.5px dashed #ccc;" />

        <!-- Order Info -->
        <table style="width: 100%; font-size: 14px; margin-bottom: 20px;">
          <tr>
            <td><strong>Bill No:</strong> ${ord.order_no || ord._id}</td>
            <td style="text-align: right;"><strong>${ord.order_type}</strong></td>
          </tr>
          <tr>
            <td><strong>Date:</strong> ${new Date(ord.order_date).toLocaleString()}</td>
            <td style="text-align: right;">
              ${ord.table_no
        ? `<strong>Table:</strong> ${ord.table_no}`
        : ord.token
          ? `<strong>Token:</strong> ${ord.token}`
          : ''}
            </td>
          </tr>
          ${ord.customer_name
        ? `<tr><td colspan="2"><strong>Customer:</strong> ${ord.customer_name}</td></tr>`
        : ''}
        </table>

        <!-- Items Table -->
        <table style="width: 100%; font-size: 14px; margin-bottom: 20px;">
          <thead>
            <tr>
              <th style="text-align: left; border-bottom: 1px solid #ccc;">Item</th>
              <th style="text-align: center; border-bottom: 1px solid #ccc;">Qty</th>
              <th style="text-align: center; border-bottom: 1px solid #ccc;">Price</th>
              <th style="text-align: right; border-bottom: 1px solid #ccc;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${items.map(item => `
              <tr>
                <td>${item.dish_name}</td>
                <td style="text-align: center;">${item.quantity}</td>
                <td style="text-align: center;">₹${item.dish_price}</td>
                <td style="text-align: right;">₹${(item.dish_price * item.quantity).toFixed(2)}</td>
              </tr>
            `).join('')}

            <tr>
              <td colspan="3" style="text-align: right; border-top: 1px solid #ccc; padding-top: 10px;">
                <strong>Sub Total:</strong>
              </td>
              <td style="text-align: right; border-top: 1px solid #ccc; padding-top: 10px;">
                <strong>₹${subTotal.toFixed(2)}</strong>
              </td>
            </tr>

            ${ord.cgst_amount > 0 ? `
              <tr>
                <td colspan="3" style="text-align: right;">
                  <strong>CGST (${ord.cgst_percent || 0}%):</strong>
                </td>
                <td style="text-align: right;">
                  ₹${parseFloat(ord.cgst_amount).toFixed(2)}
                </td>
              </tr>
            ` : ''}

            ${ord.sgst_amount > 0 ? `
              <tr>
                <td colspan="3" style="text-align: right;">
                  <strong>SGST (${ord.sgst_percent || 0}%):</strong>
                </td>
                <td style="text-align: right;">
                  ₹${parseFloat(ord.sgst_amount).toFixed(2)}
                </td>
              </tr>
            ` : ''}

            ${ord.vat_amount > 0 ? `
              <tr>
                <td colspan="3" style="text-align: right;">
                  <strong>VAT (${ord.vat_percent || 0}%):</strong>
                </td>
                <td style="text-align: right;">
                  ₹${parseFloat(ord.vat_amount).toFixed(2)}
                </>
              </tr>
            ` : ''}

            ${ord.discount_amount > 0 ? `
              <tr>
                <td colspan="3" style="text-align: right;">
                  <strong>Discount:</strong>
                </td>
                <td style="text-align: right;">
                  ₹${parseFloat(ord.discount_amount).toFixed(2)}
                </td>
              </tr>
            ` : ''}

            <tr>
              <td colspan="3" style="text-align: right; border-top: 1px solid #ccc; padding-top: 10px;">
                <strong>Total Amount:</strong>
              </td>
              <td style="text-align: right; border-top: 1px solid #ccc; padding-top: 10px;">
                <strong>₹${parseFloat(ord.total_amount).toFixed(2)}</strong>
              </td>
            </tr>
          </tbody>
        </table>

        <hr style="border: 0.5px dashed #ccc;" />
        <p style="text-align: center; font-size: 12px;"><strong>Thanks, Visit Again</strong></p>

      </div>
    `;
  };

  const handlePrint = async () => {
    try {
      setPrinting(true);

      const userRes = await axios.get(`${process.env.REACT_APP_API}/user/get`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      const userData = userRes.data;

      const groupedByCounter = {};
      order.order_items.forEach(item => {
        const counterName = item.counter || "Default";
        if (!groupedByCounter[counterName]) groupedByCounter[counterName] = [];
        groupedByCounter[counterName].push(item);
      });

      let allBillsHTML = "";
      allBillsHTML += printFullBill(order, userData, order.order_items, order.sub_total);
      Object.entries(groupedByCounter).forEach(([counterName, items]) => {
        allBillsHTML += printCounterBill(order, userData, counterName, items);
      });

      // Create a hidden iframe for print
      let iframe = document.getElementById("print-iframe");
      if (!iframe) {
        iframe = document.createElement("iframe");
        iframe.id = "print-iframe";
        iframe.style.position = "absolute";
        iframe.style.width = "0px";
        iframe.style.height = "0px";
        iframe.style.border = "none";
        document.body.appendChild(iframe);
      }

      const doc = iframe.contentWindow.document || iframe.contentDocument;
      doc.open();
      doc.write(`
        <html>
        <head>
          <title>Print Bills</title>
          <style>
            @media print {
              body { margin: 0; }
            }
          </style>
        </head>
        <body>
          ${allBillsHTML}
          <script>
            window.onload = function() {
              window.focus();
              window.print();
            };
          </script>
        </body>
        </html>
      `);
      doc.close();

      setTimeout(() => {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      }, 500);

    } catch (err) {
      console.error("Print error:", err);
      toast.error("Failed to print bills");
    } finally {
      setPrinting(false);
    }
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
        <div className="page-title-container">
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
        <div className="page-title-container">
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
        <div className="page-title-container">
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
    <div className="container-fluid pb-5">
      <HtmlHead title={title} description={description} />
      <section className="scroll-section" id="title">
        <div className="page-title-container mb-4 mt-5 mt-lg-0">
          <Row className="g-0 align-items-center gy-3">
            <Col xs="auto" className="me-auto">
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
                    <td className="fw-medium">{item.dish_name}</td>
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
</div>
  );
};

export default OrderDetails;