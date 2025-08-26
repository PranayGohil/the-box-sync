import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Row, Col, Card, Button, Spinner, Table } from 'react-bootstrap';
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';

const OrderDetails = () => {
  const title = 'Order Details';
  const description = 'Detailed view of a specific order including customer, billing, and ordered items.';

  const breadcrumbs = [
    { to: '', text: 'Home' },
    { to: 'orders', title: 'Orders' },
    { to: '', title: 'Order Details' },
  ];

  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        const orderRes = await axios.get(`${process.env.REACT_APP_API}/order/get/${id}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });

        console.log('response : ', orderRes.data);
        if (orderRes.data.success) {
          // Fixed: Handle single order object instead of array
          const orderData = orderRes.data.data;
          const transformedOrder = {
            ...orderData,
            id: orderData._id,
          };
          console.log('Fetched Order:', transformedOrder);
          setOrder(transformedOrder);
        } else {
          console.log(orderRes.data.message);
          setError(orderRes.data.message);
        }
      } catch (err) {
        console.log('Error fetching order:', err);
        setError('Unable to fetch order');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id]);

  if (loading) return <Spinner animation="border" className="m-5" />;
  if (error) return <div className="alert alert-danger m-5">{error}</div>;
  if (!order) return <div className="alert alert-warning m-5">Order not found</div>;

  return (
    <>
      <HtmlHead title={title} description={description} />
      <div className="page-title-container">
        <h1 className="mb-0 pb-0 display-4">{title}</h1>
        <BreadcrumbList items={breadcrumbs} />
      </div>

      <Card className="mb-4">
        <Card.Body>
          <h4 className="mb-3">Customer & Order Info</h4>
          {/* Enhanced: Show customer details if available */}
          {order.customer_details ? (
            <>
              <p>
                <strong>Customer:</strong> {order.customer_details.name || order.customer_name || '-'}
              </p>
              <p>
                <strong>Email:</strong> {order.customer_details.email || '-'}
              </p>
              <p>
                <strong>Phone:</strong> {order.customer_details.phone || '-'}
              </p>
              <p>
                <strong>Address:</strong> {order.customer_details.address || '-'}
              </p>
            </>
          ) : (
            <p>
              <strong>Customer:</strong> {order.customer_name || '-'}
            </p>
          )}
          <p>
            <strong>Order ID:</strong> {order.id || '-'}
          </p>
          <p>
            <strong>Order Type:</strong> {order.order_type || '-'}
          </p>
          {order.order_type === 'Dine In' && (
            <p>
              <strong>Table:</strong> {order.table_area || '-'} ( {order.table_no || '-'} )
            </p>
          )}
          {order.order_type === 'Takeaway' && (
            <p>
              <strong>Token:</strong> {order.token || '-'}
            </p>
          )}
          <p>
            <strong>Waiter:</strong> {order.waiter || '-'}
          </p>
          <p>
            <strong>Total Persons:</strong> {order.total_persons || '-'}
          </p>
          <p>
            <strong>Comment:</strong> {order.comment || '-'}
          </p>
          <p>
            <strong>Order Status:</strong> {order.order_status || '-'}
          </p>
          <p>
            <strong>Order Date:</strong> {order.order_date ? new Date(order.order_date).toLocaleString() : '-'}
          </p>
        </Card.Body>
      </Card>

      <Card className="mb-4">
        <Card.Body>
          <h4 className="mb-3">Ordered Items</h4>
          <Table striped bordered hover>
            <thead>
              <tr>
                <th>Dish</th>
                <th>Quantity</th>
                <th>Price</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {order.order_items?.map((item, index) => (
                <tr key={`${item.dish_name}-${index}`}>
                  <td>{item.dish_name}</td>
                  <td>{item.quantity}</td>
                  <td>₹ {item.dish_price}</td>
                  <td>₹ {item.dish_price * item.quantity}</td>
                  <td>{item.status}</td>
                  <td>{item.special_notes || '-'}</td>
                </tr>
              ))}
              <tr>
                <td colSpan={5} className="text-end">
                  <strong>Sub Total</strong>
                </td>
                <td>₹ {order.sub_total}</td>
              </tr>
              <tr>
                <td colSpan={5} className="text-end">
                  <strong>CGST</strong>
                </td>
                <td>₹ {order.cgst_amount || 0}</td>
              </tr>
              <tr>
                <td colSpan={5} className="text-end">
                  <strong>SGST</strong>
                </td>
                <td>₹ {order.sgst_amount || 0}</td>
              </tr>
              <tr>
                <td colSpan={5} className="text-end">
                  <strong>Discount</strong>
                </td>
                <td>- ₹ {order.discount_amount || 0}</td>
              </tr>
              <tr>
                <td colSpan={5} className="text-end">
                  <strong>Total Amount</strong>
                </td>
                <td>₹ {order.total_amount || order.bill_amount}</td>
              </tr>
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      {/* Enhanced: Show payment information */}
      <Card className="mb-4">
        <Card.Body>
          <h4 className="mb-3">Payment Information</h4>
          <p>
            <strong>Payment Type:</strong> {order.payment_type || 'Not specified'}
          </p>
          <p>
            <strong>Order Source:</strong> {order.order_source || '-'}
          </p>
        </Card.Body>
      </Card>

      <Row>
        <Col className="text-end">
          <Button variant="primary" onClick={() => window.print()}>
            Print Invoice
          </Button>
        </Col>
      </Row>
    </>
  );
};

export default OrderDetails;
