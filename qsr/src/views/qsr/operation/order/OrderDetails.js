import React, { useEffect, useState } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import axios from 'axios';
import { Row, Col, Card, Button, Spinner, Table, Alert, Badge } from 'react-bootstrap';
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import { toast } from 'react-toastify';

const customStyles = `
  .glass-card {
    background: rgba(255, 255, 255, 0.95) !important;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 1.25rem !important;
    box-shadow: 0 8px 32px rgba(31, 38, 135, 0.07) !important;
  }
  .info-label {
    font-size: 0.7rem !important;
    font-weight: 800 !important;
    color: #64748b !important;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    margin-bottom: 0.25rem;
  }
  .info-value {
    font-weight: 700;
    color: #1e293b;
    font-size: 0.95rem;
  }
`;

const OrderDetails = () => {
  const title = 'Order Details';
  const description = 'Detailed view of a specific order.';

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

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const orderRes = await axios.get(`${process.env.REACT_APP_API}/order/get/${id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });

        if (orderRes.data.success) {
          setOrder({ ...orderRes.data.data, id: orderRes.data.data._id });
        } else {
          setError(orderRes.data.message);
        }
      } catch (err) {
        setError('Unable to fetch order');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handlePrint = async () => {
    try {
      setPrinting(true);
      const userRes = await axios.get(`${process.env.REACT_APP_API}/user/get`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const userData = userRes.data;
      const printWindow = window.open("", "_blank");
      if (!printWindow) { toast.error("Popup blocked!"); return; }
      
      const billHtml = `
        <div style="font-family: Arial; padding: 20px; max-width: 400px; margin: auto; border: 1px solid #eee;">
          <h2 style="text-align:center">${userData.name}</h2>
          <hr/>
          <p><strong>Order No:</strong> ${order.order_no || order.id}</p>
          <p><strong>Type:</strong> ${order.order_type}</p>
          <hr/>
          <table style="width:100%">
            ${order.order_items.map(i => `<tr><td>${i.dish_name} x ${i.quantity}</td><td style="text-align:right">₹${(i.dish_price * i.quantity).toFixed(2)}</td></tr>`).join('')}
          </table>
          <hr/>
          <p style="text-align:right"><strong>Total: ₹${parseFloat(order.total_amount).toFixed(2)}</strong></p>
        </div>
      `;
      printWindow.document.write(`<html><body>${billHtml}<script>window.print();setTimeout(()=>window.close(),100);</script></body></html>`);
      printWindow.document.close();
    } catch (err) {
      toast.error("Print failed");
    } finally {
      setPrinting(false);
    }
  };

  const brandColor = '#23b3f4';

  if (loading) {
    return (
      <div className="container-fluid py-5 text-center">
        <Spinner animation="border" style={{ color: brandColor }} />
      </div>
    );
  }

  return (
    <div className="container-fluid pb-5">
      <style>{customStyles}</style>
      <HtmlHead title={title} description={description} />
      
      <div className="page-title-container mb-4">
        <Row className="align-items-center">
          <Col xs="12" md="8">
            <h1 className="mb-0 pb-0 fw-800" style={{ color: brandColor, fontSize: '1.5rem' }}>{title}</h1>
            <BreadcrumbList items={breadcrumbs} />
          </Col>
          <Col xs="12" md="4" className="text-end">
            <Button variant="outline-primary" onClick={() => history.push('/operations/order-history')} className="me-2 rounded-pill px-4">
              <CsLineIcons icon="arrow-left" className="me-2" /> Back
            </Button>
            <Button variant="primary" onClick={handlePrint} disabled={printing} className="rounded-pill px-4">
              <CsLineIcons icon="print" className="me-2" /> Print
            </Button>
          </Col>
        </Row>
      </div>

      <Row className="g-4">
        <Col lg="4">
          <Card className="border-0 glass-card h-100">
            <Card.Body className="p-4">
              <h5 className="fw-bold mb-4 d-flex align-items-center">
                <CsLineIcons icon="info-hexagon" className="me-2 text-primary" size="20" />
                Order Info
              </h5>
              
              <div className="mb-3">
                <div className="info-label">Order Number</div>
                <div className="info-value">#{order.order_no || order.id}</div>
              </div>
              
              <div className="mb-3">
                <div className="info-label">Customer</div>
                <div className="info-value">{order.customer_name || 'Guest'}</div>
                {order.customer_phone && <div className="text-muted small">{order.customer_phone}</div>}
              </div>

              <Row className="g-3">
                <Col xs={6}>
                  <div className="info-label">Type</div>
                  <Badge bg="soft-primary" style={{ background: 'rgba(35, 179, 244, 0.1)', color: brandColor }}>{order.order_type}</Badge>
                </Col>
                <Col xs={6}>
                  <div className="info-label">Status</div>
                  <Badge bg="soft-success" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>{order.order_status}</Badge>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>

        <Col lg="8">
          <Card className="border-0 glass-card h-100">
            <Card.Body className="p-4">
              <h5 className="fw-bold mb-4 d-flex align-items-center">
                <CsLineIcons icon="restaurant" className="me-2 text-primary" size="20" />
                Items
              </h5>
              <div className="table-responsive">
                <Table borderless hover className="align-middle">
                  <thead>
                    <tr className="text-muted text-small text-uppercase border-bottom">
                      <th className="px-0">Item</th>
                      <th className="text-center">Qty</th>
                      <th className="text-end px-0">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.order_items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="px-0 fw-bold">{item.dish_name}</td>
                        <td className="text-center fw-bold text-muted">x{item.quantity}</td>
                        <td className="text-end px-0 fw-bold">₹{(item.dish_price * item.quantity).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
              
              <div className="mt-4 pt-3 border-top text-end">
                <div className="d-flex justify-content-end gap-5 mb-2">
                  <span className="text-muted fw-bold">Sub Total</span>
                  <span className="fw-bold">₹{parseFloat(order.sub_total || 0).toFixed(2)}</span>
                </div>
                <div className="d-flex justify-content-end gap-5 h4 mb-0">
                  <span className="text-primary fw-800">Total</span>
                  <span className="text-primary fw-800">₹{parseFloat(order.total_amount).toFixed(2)}</span>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default OrderDetails;