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


  const handlePrint = async () => {
    try {

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
                 <p style="margin: 10px; font-size: 12px;"><strong>Phone: </strong> ${userData.mobile
        }</p>
             <p style="margin: 10px; font-size: 12px;"><strong>FSSAI Lic No:</strong> 11224333001459</p>
                 <p style="margin: 10px; font-size: 12px;"><strong>GST No:</strong> 
                 ${userData.gst_no}
                 </p>
               </div>
               <hr style="border: 0.5px dashed #ccc;" />
               <p>
             </p>
               <table style="font-size: 12px; margin-bottom: 10px;">
                 <tr>
                 <td style="width: 50%; height: 30px;">
                   <strong> Name: </strong> ${order?.customer_name || "(M: 1234567890)"} 
                     </td>
                     </tr><tr>
                 <td style="width: 50%; height: 30px;">
                   <strong>Date:</strong> ${new Date(
          order.order_date
        ).toLocaleString()}</td>
                     <td style="text-align: right;"><strong>${order.order_type
        }</strong>
                     </td>
                 </tr>
                 <tr>
                 <td colspan="2"><strong>Bill No:</strong> ${order._id}</td>
                 
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
    }
  };

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
          <Button variant="primary" onClick={() => handlePrint()}>
            Print Invoice
          </Button>
        </Col>
      </Row>
    </>
  );
};

export default OrderDetails;
