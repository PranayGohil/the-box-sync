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
  const description = 'Detailed view of a specific order including customer, billing, and ordered items.';

  const breadcrumbs = [
    { to: '', text: 'Home' },
    { to: 'orders', title: 'Orders' },
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
    try {
      setPrinting(true)
      const userResponse = await axios.get(
        `${process.env.REACT_APP_API}/user/get`,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );

      const userData = userResponse.data;

      const printDiv = document.createElement("div");
      printDiv.id = "printable-invoice";
      printDiv.style.display = "none";
      document.body.appendChild(printDiv);

      printDiv.innerHTML = `
           <div style="font-family: Arial, sans-serif; max-width: 400px; margin: 0 auto; border: 1px solid #ccc; padding: 10px;">
             <div style="text-align: center; margin-bottom: 10px;">
               <h3 style="margin: 10px;">${userData.name}</h3>
               <p style="margin: 0; font-size: 12px;">${userData.address}</p>
               <p style="margin: 0; font-size: 12px;">
                 ${userData.city}, ${userData.state} - ${userData.pincode}
               </p>
               <p style="margin: 10px; font-size: 12px;"><strong>Ph.: </strong> ${userData.mobile
        }</p>
        ${userData.fssai_no && userData.fssai_no !== 'null' ? `<p style="margin: 10px; font-size: 12px;"><strong>FSSAI No:</strong> ${userData.fssai_no}</p>` : ''}
           <p style="margin: 10px; font-size: 12px;"><strong>FSSAI Lic No:</strong> 11224333001459</p>
               <p style="margin: 10px; font-size: 12px;"><strong>GST No:</strong> 
               ${userData.gst_no}
               </p>
             </div>
             <hr style="border: 0.5px dashed #ccc;" />
             <p>
           </p>
              <table style="width: 100%; font-size: 12px; margin-bottom: 10px;">
               <tr>
               <td style="width: 50%; height: 30px;">
                 <strong> Name: </strong> ${order?.customer_name || "(M: 1234567890)"} 
                   </td>
                    <td style="text-align: right;">
                  <strong>${order.order_type}</strong>
               </td>
                   </tr><tr>
               <td style="width: 50%; height: 30px;">
                 <strong>Date:</strong> ${new Date(
          order.order_date
        ).toLocaleString()}</td>
                   <td style="text-align: right;">
                   ${order.table_no ? ` <strong>Table No: </strong> <span style="margin-left: 5px; font-size: 16px;"> ${order.table_no} </span>` : order.token ? ` <strong>Token No: </strong> <span style="margin-left: 5px; font-size: 16px;"> ${order.token} </span>` : ''} </span>
               </td>
               </tr>
               <tr>
               <td colspan="2"><strong>Bill No:</strong> ${order.order_no || order._id}</td>
               
               </tr>
             </table>
             <hr style="border: 0.5px dashed #ccc;" />
             <table style="width: 100%; font-size: 12px; margin-bottom: 10px;">
               <thead>
                 <tr>
                   <th style="text-align: left; border-bottom: 1px dashed #ccc">Item</th>
                   <th style="text-align: center; border-bottom: 1px dashed #ccc">Qty</th>
                   <th style="text-align: center; border-bottom: 1px dashed #ccc">Price</th>
                   <th style="text-align: right; border-bottom: 1px dashed #ccc">Amount</th>
                 </tr>
               </thead>
               <tbody>
                 ${order.order_items
          .map(
            (item) => `
                     <tr>
                       <td>${item.dish_name}</td>
                       <td style="text-align: center;">${item.quantity}</td>
                       <td style="text-align: center;">${item.dish_price}</td>
                       <td style="text-align: right;">₹ ${item.dish_price * item.quantity
              }</td>
                     </tr>
                   `
          )
          .join("")}
                 <tr>
                   <td colspan="3" style="text-align: right; border-top: 1px dashed #ccc"><strong>Sub Total: </strong></td>
                   <td style="text-align: right; border-top: 1px dashed #ccc">₹ ${order.sub_total
        }</td>
                 </tr>
                 ${order.cgst_amount > 0 ?
          `<tr>
                     <td colspan="3" style="text-align: right;"><strong>CGST (${order.cgst_percent || 0} %):</strong>
                     </td>
                     <td style="text-align: right;">₹ ${order.cgst_amount || 0}</td> 
                   </tr>` : ""
        }
                 ${order.sgst_amount > 0 ?
          `<tr>
                   <td colspan="3" style="text-align: right;"><strong>SGST (${order.sgst_percent || 0
          } %):</strong></td>
                   <td style="text-align: right;">₹ ${order.sgst_amount || 0}</td>
                 </tr>`  : ""
        }
           ${order.vat_amount > 0 ?
          `<tr>
                     <td colspan="3" style="text-align: right;"><strong>VAT (${order.vat_percent || 0} %):</strong>
                     </td>
                     <td style="text-align: right;">₹ ${order.vat_amount || 0}</td>
                   </tr>`  : ""
        }
               ${order.discount_amount > 0 ?
          `<tr>
                   <td colspan="3" style="text-align: right;"><strong>Discount: </strong></td>
                   <td style="text-align: right;">- ₹ ${order.discount_amount || 0
          }</td>
                 </tr>`  : ""
        }
                 <tr>
                   <td colspan="3" style="text-align: right;"><strong>Total: </strong></td>
                   <td style="text-align: right;">₹ ${order.total_amount}</td>
                 </tr>
                 <tr>
                   <td colspan="3" style="text-align: right; border-top: 1px dashed #ccc"><strong>Paid Amount: </strong></td>
                   <td style="text-align: right; border-top: 1px dashed #ccc">
                     ₹ ${order.paid_amount || order.bill_amount || 0}
                   </td>
                 </tr>
                 ${order.waveoff_amount !== null && order.waveoff_amount !== undefined && order.waveoff_amount !== 0 ?
          `<tr>
                   <td colspan="3" style="text-align: right;"><strong>Waveoff Amount: </strong></td>
                   <td style="text-align: right;"> ₹ ${order.waveoff_amount || 0
          }</td>
                   
                 </tr>`  : ""}
                 
               </tbody>
             </table>
             <div style="text-align: center; font-size: 12px;">
               <p style="margin: 10px; font-size: 12px;"><strong>Thanks, Visit Again</strong></p>
             </div>
           </div>
         `;

      const printWindow = window.open("", "_blank");
      printWindow.document.write(printDiv.innerHTML);
      printWindow.document.close();
      printWindow.print();
      printWindow.close();

      document.body.removeChild(printDiv);
    } catch (err) {
      console.error("Error fetching order or user data:", err);
    } finally {
      setPrinting(false);
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
    <>
      <HtmlHead title={title} description={description} />
      <div className="page-title-container">
        <Row className="align-items-center">
          <Col xs="12" md="8">
            <h1 className="mb-0 pb-0 display-4">{title}</h1>
            <BreadcrumbList items={breadcrumbs} />
          </Col>
          <Col xs="12" md="4" className="text-end">
            <Button
              variant="secondary"
              onClick={() => history.push('/operations/order-history')}
              className="me-2"
            >
              <CsLineIcons icon="arrow-left" className="me-2" />
              Back
            </Button>
            <Button
              variant="primary"
              onClick={handlePrint}
              disabled={printing}
            >
              {printing ? (
                <>
                  <Spinner
                    as="span"
                    animation="border"
                    size="sm"
                    role="status"
                    aria-hidden="true"
                    className="me-2"
                  />
                  Printing...
                </>
              ) : (
                <>
                  <CsLineIcons icon="print" className="me-2" />
                  Print Invoice
                </>
              )}
            </Button>
          </Col>
        </Row>
      </div>

      <Card className="mb-4">
        <Card.Header>
          <h4 className="mb-0">
            <CsLineIcons icon="user" className="me-2" />
            Customer & Order Information
          </h4>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={6}>
              {order.customer_name && (
                <p>
                  <strong>Customer:</strong> {order.customer_name}
                </p>
              )}
              <p>
                <strong>Order Number:</strong> {order.order_no || order.id || '-'}
              </p>
              <p>
                <strong>Order Type:</strong> {' '}
                <Badge bg={
                  order.order_type === 'Dine In' ? 'primary' :
                    order.order_type === 'Takeaway' ? 'warning' :
                      order.order_type === 'Delivery' ? 'success' : 'secondary'
                }>
                  {order.order_type || '-'}
                </Badge>
              </p>
              {order.order_type === 'Dine In' && order.table_area && order.table_no && (
                <p>
                  <strong>Table:</strong> {order.table_area || '-'} ({order.table_no || '-'})
                </p>
              )}
              {order.order_type === 'Takeaway' && (
                <p>
                  <strong>Token:</strong> {order.token || '-'}
                </p>
              )}
              <p>
                <strong>Order Date:</strong> {order.order_date ? new Date(order.order_date).toLocaleString() : '-'}
              </p>
            </Col>
            <Col md={6}>
              <p>
                <strong>Status:</strong> {' '}
                <Badge bg={
                  order.order_status === 'Completed' ? 'success' :
                    order.order_status === 'Pending' ? 'warning' :
                      order.order_status === 'Cancelled' ? 'danger' : 'secondary'
                }>
                  {order.order_status || '-'}
                </Badge>
              </p>
              {order.waiter && (
                <p>
                  <strong>Waiter:</strong> {order.waiter || '-'}
                </p>
              )}
              {order.total_persons && (
                <p>
                  <strong>Total Persons:</strong> {order.total_persons || '-'}
                </p>
              )}
              <p>
                <strong>Payment Type:</strong> {order.payment_type || 'Not specified'}
              </p>
              <p>
                <strong>Order Source:</strong> {order.order_source || '-'}
              </p>
            </Col>
          </Row>
          <p className="mt-3">
            <strong>Comment:</strong> {order.comment || 'No comments'}
          </p>
        </Card.Body>
      </Card>

      <Card className="mb-4">
        <Card.Header>
          <h4 className="mb-0">
            <CsLineIcons icon="restaurant" className="me-2" />
            Ordered Items
          </h4>
        </Card.Header>
        <Card.Body>
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>#</th>
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
                  <td>{index + 1}</td>
                  <td>{item.dish_name}</td>
                  <td>{item.quantity}</td>
                  <td>₹ {parseFloat(item.dish_price).toFixed(2)}</td>
                  <td>₹ {(parseFloat(item.dish_price) * parseFloat(item.quantity)).toFixed(2)}</td>
                  <td>
                    <Badge bg={
                      item.status === 'Served' ? 'success' :
                        item.status === 'Preparing' ? 'warning' :
                          item.status === 'Pending' ? 'secondary' : 'info'
                    }>
                      {item.status || 'Pending'}
                    </Badge>
                  </td>
                  <td>{item.special_notes || '-'}</td>
                </tr>
              ))}
              <tr className="table-active">
                <td colSpan={4} className="text-end">
                  <strong>Sub Total</strong>
                </td>
                <td colSpan={3}>₹ {parseFloat(order.sub_total || 0).toFixed(2)}</td>
              </tr>
              {order.cgst_amount > 0 && (
                <tr>
                  <td colSpan={4} className="text-end">
                    <strong>CGST ({order.cgst_percent || 0}%)</strong>
                  </td>
                  <td colSpan={3}>₹ {parseFloat(order.cgst_amount || 0).toFixed(2)}</td>
                </tr>
              )}
              {order.sgst_amount > 0 && (
                <tr>
                  <td colSpan={4} className="text-end">
                    <strong>SGST ({order.sgst_percent || 0}%)</strong>
                  </td>
                  <td colSpan={3}>₹ {parseFloat(order.sgst_amount || 0).toFixed(2)}</td>
                </tr>
              )}
              {order.vat_amount > 0 && (
                <tr>
                  <td colSpan={4} className="text-end">
                    <strong>VAT ({order.vat_percent || 0}%)</strong>
                  </td>
                  <td colSpan={3}>₹ {parseFloat(order.vat_amount || 0).toFixed(2)}</td>
                </tr>
              )}
              {order.discount_amount > 0 && (
                <tr className="table-danger">
                  <td colSpan={4} className="text-end">
                    <strong>Discount</strong>
                  </td>
                  <td colSpan={3}>- ₹ {parseFloat(order.discount_amount || 0).toFixed(2)}</td>
                </tr>
              )}
              <tr className="table-success">
                <td colSpan={4} className="text-end">
                  <strong>Total Amount</strong>
                </td>
                <td colSpan={3}>
                  <strong>₹ {parseFloat(order.total_amount || order.bill_amount || 0).toFixed(2)}</strong>
                </td>
              </tr>
              <tr className="table-info">
                <td colSpan={4} className="text-end">
                  <strong>Paid Amount</strong>
                </td>
                <td colSpan={3}>₹ {parseFloat(order.paid_amount || order.bill_amount || 0).toFixed(2)}</td>
              </tr>
              {order.waveoff_amount > 0 && (
                <tr className="table-warning">
                  <td colSpan={4} className="text-end">
                    <strong>Waveoff Amount</strong>
                  </td>
                  <td colSpan={3}>₹ {parseFloat(order.waveoff_amount || 0).toFixed(2)}</td>
                </tr>
              )}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </>
  );
};

export default OrderDetails;