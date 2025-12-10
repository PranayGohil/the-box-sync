import React, { useState, useEffect } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { Button, Row, Col, Card, Form, Badge, Table, Modal } from 'react-bootstrap';
import axios from 'axios';
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import CsLineIcons from 'cs-line-icons/CsLineIcons';

const TakeawayOrder = () => {
  const history = useHistory();
  const location = useLocation();

  // Parse URL parameters
  const urlParams = new URLSearchParams(location.search);
  const orderId = urlParams.get('orderId');
  const mode = urlParams.get('mode'); // 'new' or 'edit'

  const title = `${mode === 'new' ? 'New' : 'Edit'} Takeaway Order`;
  const description = 'Manage takeaway orders';

  const breadcrumbs = [
    { to: '', text: 'Home' },
    { to: '/dashboard', text: 'Dashboard' },
    { to: '', text: title },
  ];

  // State
  const [orderItems, setOrderItems] = useState([]);
  const [menuData, setMenuData] = useState([]);
  const [orderStatus, setOrderStatus] = useState('Save');
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    phone: '',
    comment: '',
  });

  // Token info
  const [tokenNumber, setTokenNumber] = useState(null);

  // Menu filtering states
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showSpecial, setShowSpecial] = useState(false);
  const [showParcelCharge, setShowParcelCharge] = useState(false);
  const [categories, setCategories] = useState([]);
  const [containerCharges, setContainerCharges] = useState([]);

  // Payment modal
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentData, setPaymentData] = useState({
    subTotal: 0,
    cgstPercent: 0,
    sgstPercent: 0,
    vatPercent: 0,
    cgstAmount: 0,
    sgstAmount: 0,
    vatAmount: 0,
    discountType: 'amount', // 'amount' or 'percentage'
    discountValue: 0,
    discountAmount: 0,
    total: 0,
    paidAmount: 0,
    waveoffAmount: 0,
    paymentType: 'Cash',
  });

  const [taxRates, setTaxRates] = useState({ cgst: 0, sgst: 0, vat: 0 });
  const [isLoading, setIsLoading] = useState(false);

  const fetchOrderDetails = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API}/order/get/${orderId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const order = response.data.data;
      setOrderItems(order.order_items || []);
      setOrderStatus(order.order_status);
      setTokenNumber(order.token);
      setCustomerInfo({
        name: order.customer_name || '',
        phone: order.customer_phone || '',
        comment: order.comment || '',
      });
    } catch (error) {
      console.error('Error fetching order details:', error);
    }
  };

  const fetchMenuData = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API}/menu/get`, {
        params: { searchText, category: selectedCategory },
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setMenuData(response.data.data);
    } catch (error) {
      console.error('Error fetching menu data:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API}/menu/get-categories`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setCategories(response.data.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchTaxRatesAndContainerCharges = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API}/user/get`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      const taxInfo = response.data.taxInfo || {};
      setPaymentData((prevData) => ({
        ...prevData,
        cgstPercent: taxInfo.cgst || 0,
        sgstPercent: taxInfo.sgst || 0,
        vatPercent: taxInfo.vat || 0
      }));
      setTaxRates({
        cgst: taxInfo.cgst || 0,
        sgst: taxInfo.sgst || 0,
        vat: taxInfo.vat || 0
      });
      setContainerCharges(response.data.containerCharges || []);
    } catch (error) {
      console.error('Error fetching tax rates:', error);
    }
  };

  // Fetch initial data
  useEffect(() => {
    if (orderId) fetchOrderDetails();
    fetchMenuData();
    fetchCategories();
    fetchTaxRatesAndContainerCharges();
  }, [orderId]);

  // Calculate totals when order items change
  useEffect(() => {
    const subTotal = orderItems.reduce((sum, item) => sum + item.dish_price * item.quantity, 0);

    // Calculate tax amounts based on subtotal
    const cgstAmount = (subTotal * taxRates.cgst) / 100;
    const sgstAmount = (subTotal * taxRates.sgst) / 100;
    const vatAmount = (subTotal * paymentData.vatPercent) / 100;
    const totalTax = cgstAmount + sgstAmount + vatAmount;

    setPaymentData((prev) => {
      // Calculate discount amount based on type
      let discountAmount = 0;
      if (prev.discountType === 'percentage') {
        discountAmount = (subTotal * prev.discountValue) / 100;
      } else {
        discountAmount = prev.discountValue;
      }

      const total = subTotal + totalTax - discountAmount;
      const waveoffAmount = prev.paidAmount > 0 ? total - prev.paidAmount : 0;

      return {
        ...prev,
        subTotal: subTotal.toFixed(2),
        cgstAmount: cgstAmount.toFixed(2),
        sgstAmount: sgstAmount.toFixed(2),
        vatAmount: vatAmount.toFixed(2),
        discountAmount: discountAmount.toFixed(2),
        total: total.toFixed(2),
        waveoffAmount: waveoffAmount.toFixed(2),
      };
    });
  }, [orderItems, taxRates]);

  // Filter menu data
  const filteredMenuData = menuData
    .map((category) => ({
      ...category,
      dishes: category.dishes.filter(
        (dish) =>
          dish.dish_name.toLowerCase().includes(searchText.toLowerCase()) &&
          (selectedCategory === '' || category.category === selectedCategory) &&
          (!showSpecial || dish.is_special) &&
          dish.is_available
      ),
    }))
    .filter((category) => category.dishes.length > 0);

  // Order item management
  const addItemToOrder = (item) => {
    setOrderItems((prevItems) => {
      const existingItemIndex = prevItems.findIndex((orderItem) => orderItem.dish_name === item.dish_name && orderItem.status !== 'Completed');

      if (existingItemIndex > -1) {
        return prevItems.map((orderItem, index) => (index === existingItemIndex ? { ...orderItem, quantity: orderItem.quantity + 1 } : orderItem));
      } else {
        return [...prevItems, { ...item, quantity: 1, status: 'Pending' }];
      }
    });
  };

  const addParcelCharge = (charge) => {
    const chargeItem = {
      dish_name: `${charge.name} ${charge.size}`,
      dish_price: charge.price,
      special_notes: 'Parcel Charge',
      status: 'Container Charge',
      quantity: 1,
    };
    addItemToOrder(chargeItem);
  };

  const updateItemQuantity = (itemIndex, change) => {
    setOrderItems((prevItems) => prevItems.map((item, index) => (index === itemIndex ? { ...item, quantity: Math.max(1, item.quantity + change) } : item)));
  };

  const removeItem = (itemIndex) => {
    setOrderItems((prevItems) => prevItems.filter((_, index) => index !== itemIndex));
  };

  // Handle discount type change
  const handleDiscountTypeChange = (type) => {
    setPaymentData((prev) => {
      const subTotal = parseFloat(prev.subTotal);
      const cgstAmount = parseFloat(prev.cgstAmount);
      const sgstAmount = parseFloat(prev.sgstAmount);
      const vatAmount = parseFloat(prev.vatAmount);
      let discountAmount = 0;
      let discountValue = 0;

      // Convert existing discount to new type
      if (type === 'percentage') {
        // Convert amount to percentage
        discountValue = prev.discountAmount > 0 ? ((prev.discountAmount / subTotal) * 100).toFixed(2) : 0;
        discountAmount = prev.discountAmount;
      } else {
        // Keep amount as is
        discountValue = prev.discountAmount;
        discountAmount = prev.discountAmount;
      }

      const total = subTotal + cgstAmount + sgstAmount + vatAmount - discountAmount;
      const waveoffAmount = prev.paidAmount > 0 ? total - prev.paidAmount : 0;

      return {
        ...prev,
        discountType: type,
        discountValue: parseFloat(discountValue),
        discountAmount: parseFloat(discountAmount).toFixed(2),
        total: total.toFixed(2),
        waveoffAmount: waveoffAmount.toFixed(2),
      };
    });
  };

  // Handle discount value change
  const handleDiscountValueChange = (value) => {
    const discountValue = parseFloat(value) || 0;
    const subTotal = parseFloat(paymentData.subTotal);
    const cgstAmount = parseFloat(paymentData.cgstAmount);
    const sgstAmount = parseFloat(paymentData.sgstAmount);
    const vatAmount = parseFloat(paymentData.vatAmount);

    let discountAmount = 0;
    if (paymentData.discountType === 'percentage') {
      // Limit percentage to 100%
      const limitedValue = Math.min(discountValue, 100);
      discountAmount = (subTotal * limitedValue) / 100;

      setPaymentData((prev) => {
        const total = subTotal + cgstAmount + sgstAmount + vatAmount - discountAmount;
        const waveoffAmount = prev.paidAmount > 0 ? total - prev.paidAmount : 0;

        return {
          ...prev,
          discountValue: limitedValue,
          discountAmount: discountAmount.toFixed(2),
          total: total.toFixed(2),
          waveoffAmount: waveoffAmount.toFixed(2),
        };
      });
    } else {
      // Limit amount to subtotal
      const limitedValue = Math.min(discountValue, subTotal);
      discountAmount = limitedValue;

      setPaymentData((prev) => {
        const total = subTotal + cgstAmount + sgstAmount + vatAmount - discountAmount;
        const waveoffAmount = prev.paidAmount > 0 ? total - prev.paidAmount : 0;

        return {
          ...prev,
          discountValue: limitedValue,
          discountAmount: discountAmount.toFixed(2),
          total: total.toFixed(2),
          waveoffAmount: waveoffAmount.toFixed(2),
        };
      });
    }
  };

  // Handle paid amount change
  const handlePaidAmountChange = (value) => {
    const paidAmount = parseFloat(value) || 0;
    const total = parseFloat(paymentData.total);
    const waveoffAmount = total - paidAmount;

    setPaymentData((prev) => ({
      ...prev,
      paidAmount,
      waveoffAmount: waveoffAmount.toFixed(2),
    }));
  };

  // Order actions
  const handleSaveOrder = async (status = 'Save') => {
    if (orderItems.length === 0) {
      alert('Please add items to the order');
      return;
    }

    setIsLoading(true);
    try {
      const orderData = {
        order_type: 'Takeaway',
        order_items: orderItems.map((item) => ({
          dish_name: item.dish_name,
          quantity: item.quantity,
          dish_price: item.dish_price,
          special_notes: item.special_notes || '',
          status: status === 'KOT' ? 'Preparing' : status === 'Save' ? 'Pending' : item.status,
        })),
        order_status: status,
        customer_name: customerInfo.name,
        total_persons: customerInfo.total_persons,
        comment: customerInfo.comment,
        waiter: customerInfo.waiter,
        bill_amount: parseFloat(paymentData.total),
        sub_total: parseFloat(paymentData.subTotal),
        cgst_percent: parseFloat(paymentData.cgstPercent),
        sgst_percent: parseFloat(paymentData.sgstPercent),
        vat_percent: parseFloat(paymentData.vatPercent),
        cgst_amount: parseFloat(paymentData.cgstAmount),
        sgst_amount: parseFloat(paymentData.sgstAmount),
        vat_amount: parseFloat(paymentData.vatAmount),
        discount_amount: parseFloat(paymentData.discountAmount),
        waveoff_amount: parseFloat(paymentData.waveoffAmount),
        total_amount: parseFloat(paymentData.total),
        paid_amount: parseFloat(paymentData.paidAmount),
        payment_type: paymentData.paymentType,
        order_source: 'Manager',
      };

      const payload = {
        orderInfo: { ...orderData, order_id: orderId },
        customerInfo: {
          name: customerInfo.name,
          phone: customerInfo.phone,
        },
      };

      const response = await axios.post(`${process.env.REACT_APP_API}/order/takeaway`, payload, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });

      if (response.data.status === 'success') {
        if (status === 'Paid') {
          fetchOrderDetails();
          setShowPaymentModal(false);
        } else {
          history.push('/dashboard');
        }
      }
    } catch (error) {
      console.error('Error saving order:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePayment = async () => {
    setPaymentData({
      ...paymentData,
      paidAmount: parseFloat(paymentData.total),
    });

    await handleSaveOrder('Paid');
  };

  return (
    <>
      <HtmlHead title={title} description={description} />

      {/* Header */}
      <div className="page-title-container">
        <Row>
          <Col md="7">
            <h1 className="mb-0 pb-0 display-4">{title}</h1>
            <BreadcrumbList items={breadcrumbs} />
          </Col>
          <Col md="5" className="d-flex align-items-start justify-content-end">
            <Button variant="outline-secondary" onClick={() => history.push('/dashboard')}>
              <CsLineIcons icon="arrow-left" /> Back to Dashboard
            </Button>
          </Col>
        </Row>
      </div>

      <Row>
        {/* Menu Section */}
        <Col lg="6">
          <Card className="h-100">
            <Card.Header>
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Menu Items</h5>
                <div className="d-flex gap-3">
                  <Form.Check
                    type="checkbox"
                    label="Special Dishes"
                    checked={showSpecial}
                    onChange={(e) => setShowSpecial(e.target.checked)}
                    disabled={showParcelCharge}
                  />
                  <Form.Check type="checkbox" label="Parcel Charges" checked={showParcelCharge} onChange={(e) => setShowParcelCharge(e.target.checked)} />
                </div>
              </div>
            </Card.Header>
            <Card.Body>
              {!showParcelCharge && (
                <Row className="mb-3">
                  <Col md="4">
                    <Form.Control type="text" placeholder="Search items..." value={searchText} onChange={(e) => setSearchText(e.target.value)} />
                  </Col>
                  <Col md="4">
                    <Form.Select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
                      <option value="">All Categories</option>
                      {categories.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </Form.Select>
                  </Col>
                </Row>
              )}

              {/* Menu Items or Parcel Charges */}
              <div style={{ maxHeight: '500px', overflowY: 'auto', overflowX: 'hidden' }}>
                {!showParcelCharge ? (
                  // Regular Menu Items
                  filteredMenuData.map((category) => (
                    <div key={category._id} className="mb-4">
                      <h6 className="text-muted mb-3">{category.category}</h6>
                      <Row>
                        {category.dishes.map((dish) => (
                          <Col xs="6" sm="4" md="3" key={dish._id}>
                            <Card className="sh-20 hover-border-primary mb-5" onClick={() => addItemToOrder(dish)}>
                              <Card.Body className="p-4 text-center align-items-center d-flex flex-column justify-content-between">
                                <p className="cta-4 mb-2 lh-1">{dish.dish_name}</p>
                                <p className="mb-2">₹{dish.dish_price}</p>
                                <div className="d-flex sh-3 sw-3 bg-gradient-light align-items-center justify-content-center rounded-xl">
                                  <h2 className="mb-0 lh-1 text-white">
                                    <CsLineIcons icon="plus" />
                                  </h2>
                                </div>
                              </Card.Body>
                              <Badge
                                variant="outline"
                                className={`text-white mb-2 ${category.meal_type === 'veg' ? 'bg-success' : category.meal_type === 'egg' ? 'bg-warning' : 'bg-danger'
                                  }`}
                                style={{ position: 'absolute', top: '5px', right: '5px' }}
                              >
                                {category.meal_type === 'veg' ? 'Veg' : category.meal_type === 'egg' ? 'Egg' : 'Non-Veg'}
                              </Badge>
                              {dish.is_special && (
                                <i className="bi bi-stars text-warning" style={{ fontSize: '20px', position: 'absolute', top: '0px', left: '2px' }} />
                              )}
                            </Card>
                          </Col>
                        ))}
                      </Row>
                    </div>
                  ))
                ) : (
                  // Parcel Charges
                  <Row>
                    {containerCharges.map((charge) => (
                      <Col xs="6" sm="4" md="3" key={charge._id}>
                        <Card className="sh-20 hover-border-primary mb-5" onClick={() => addParcelCharge(charge)}>
                          <Card.Body className="p-4 text-center align-items-center d-flex flex-column justify-content-between">
                            <div>
                              <p className="cta-4 mb-3 lh-1">
                                {charge.name} - {charge.size}
                              </p>
                              <p className="mb-3">₹{charge.price}</p>
                            </div>
                            <div className="d-flex sh-3 sw-3 bg-gradient-light align-items-center justify-content-center rounded-xl">
                              <h2 className="mb-0 lh-1 text-white">
                                <CsLineIcons icon="plus" />
                              </h2>
                            </div>
                          </Card.Body>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Order Details Section */}
        <Col lg="6">
          <Card className="h-100">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                Takeaway Order Details
                {orderStatus && (
                  <Badge bg="secondary" className="ms-2">
                    {orderStatus}
                  </Badge>
                )}
              </h5>
              {tokenNumber && (
                <Badge bg="primary" className="fs-6 mt-2">
                  Token #{tokenNumber}
                </Badge>
              )}
            </Card.Header>
            <Card.Body>
              {/* Customer Info */}
              <Row className="mb-3">
                <Col md="6">
                  <Form.Group>
                    <Form.Label>Customer Name</Form.Label>
                    <Form.Control
                      type="text"
                      value={customerInfo.name}
                      onChange={(e) => setCustomerInfo((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter customer name"
                    />
                  </Form.Group>
                </Col>
                <Col md="6">
                  <Form.Group>
                    <Form.Label>Phone Number</Form.Label>
                    <Form.Control
                      type="tel"
                      value={customerInfo.phone}
                      onChange={(e) => setCustomerInfo((prev) => ({ ...prev, phone: e.target.value }))}
                      placeholder="Enter phone number"
                    />
                  </Form.Group>
                </Col>
              </Row>

              {/* Order Items */}
              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                <Table striped bordered hover size="sm">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th className="text-center">Qty</th>
                      <th className="text-center">Price</th>
                      <th className="text-center">Total</th>
                      <th className="text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orderItems.map((item, index) => (
                      <tr key={index}>
                        <td>
                          {item.dish_name}
                          {item.special_notes === 'Parcel Charge' && (
                            <Badge bg="info" className="ms-1">
                              Charge
                            </Badge>
                          )}
                        </td>
                        <td className="text-center">
                          {item.special_notes === 'Parcel Charge' ? (
                            <span>{item.quantity}</span>
                          ) : (
                            <div className="d-flex align-items-center justify-content-center gap-1">
                              <Button variant="outline-secondary" size="sm" onClick={() => updateItemQuantity(index, -1)} disabled={item.quantity <= 1}>
                                -
                              </Button>
                              <span className="mx-2">{item.quantity}</span>
                              <Button variant="outline-secondary" size="sm" onClick={() => updateItemQuantity(index, 1)}>
                                +
                              </Button>
                            </div>
                          )}
                        </td>
                        <td className="text-center">₹{item.dish_price}</td>
                        <td className="text-center">₹{item.dish_price * item.quantity}</td>
                        <td className="text-center">
                          <Button variant="outline-danger" size="sm" onClick={() => removeItem(index)}>
                            <CsLineIcons icon="bin" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>

              {/* Comment */}
              <Form.Group className="mb-3">
                <Form.Label>Special Instructions</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  value={customerInfo.comment}
                  onChange={(e) => setCustomerInfo((prev) => ({ ...prev, comment: e.target.value }))}
                  placeholder="Any special instructions..."
                />
              </Form.Group>

              {/* Total */}
              <div className="text-end mb-3">
                <h4>Total: ₹{paymentData.subTotal}</h4>
              </div>

              {/* Action Buttons */}
              <div className="d-flex justify-content-between">
                <div>
                  {orderItems.length > 0 && (
                    <>
                      <Button variant="secondary" className="me-2" onClick={() => handleSaveOrder('Save')} disabled={isLoading}>
                        Save Order
                      </Button>
                      <Button variant="primary" onClick={() => handleSaveOrder('KOT')} disabled={isLoading}>
                        Send to Kitchen
                      </Button>
                    </>
                  )}
                </div>
                <div>
                  {/* Show Dashboard button if order is paid */}
                  {orderStatus === 'Paid' ? (
                    <Button variant="primary" onClick={() => history.push('/dashboard')}>
                      Go to Dashboard
                    </Button>
                  ) : (
                    orderStatus === 'KOT' &&
                    /* Show Payment button only if no items are 'Preparing' */
                    !orderItems.some((item) => item.status === 'Preparing') && (
                      <Button variant="success" onClick={() => setShowPaymentModal(true)}>
                        Process Payment
                      </Button>
                    )
                  )}
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Payment Modal */}
      <Modal show={showPaymentModal} onHide={() => setShowPaymentModal(false)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Process Payment</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row className="mb-3">
            <Col>
              <Form.Group>
                <Form.Label>Sub Total</Form.Label>
                <Form.Control type="number" value={paymentData.subTotal} readOnly />
              </Form.Group>
            </Col>
          </Row>

          <Row className="mb-3">
            <Col md="4">
              <Form.Group>
                <Form.Label>CGST ({paymentData.cgstPercent}%)</Form.Label>
                <Form.Control type="number" value={paymentData.cgstAmount} readOnly />
              </Form.Group>
            </Col>
            <Col md="4">
              <Form.Group>
                <Form.Label>SGST ({paymentData.sgstPercent}%)</Form.Label>
                <Form.Control type="number" value={paymentData.sgstAmount} readOnly />
              </Form.Group>
            </Col>
            <Col md="4">
              <Form.Group>
                <Form.Label>VAT ({paymentData.vatPercent}%)</Form.Label>
                <Form.Control type="number" value={paymentData.vatAmount} readOnly />
              </Form.Group>
            </Col>
          </Row>

          {/* Discount Section */}
          <Row className="mb-3">
            <Col md="4">
              <Form.Group>
                <Form.Label>Discount Type</Form.Label>
                <Form.Select value={paymentData.discountType} onChange={(e) => handleDiscountTypeChange(e.target.value)}>
                  <option value="amount">Amount (₹)</option>
                  <option value="percentage">Percentage (%)</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md="4">
              <Form.Group>
                <Form.Label>Discount {paymentData.discountType === 'percentage' ? 'Percentage' : 'Amount'}</Form.Label>
                <Form.Control
                  type="number"
                  value={paymentData.discountValue}
                  onChange={(e) => handleDiscountValueChange(e.target.value)}
                  placeholder={paymentData.discountType === 'percentage' ? 'Enter %' : 'Enter amount'}
                  min="0"
                  max={paymentData.discountType === 'percentage' ? '100' : paymentData.subTotal}
                />
              </Form.Group>
            </Col>
            <Col md="4">
              <Form.Group>
                <Form.Label>Discount Amount</Form.Label>
                <Form.Control type="number" value={paymentData.discountAmount} readOnly />
              </Form.Group>
            </Col>
          </Row>

          <Row className="mb-3">
            <Col>
              <Form.Group>
                <Form.Label>
                  <strong>Total Amount (Including Taxes)</strong>
                </Form.Label>
                <Form.Control type="number" value={paymentData.total} readOnly style={{ fontWeight: 'bold', fontSize: '1.1rem' }} />
              </Form.Group>
            </Col>
          </Row>

          {/* Paid Amount Section */}
          <Row className="mb-3">
            <Col md="6">
              <Form.Group>
                <Form.Label>
                  <strong>Paid Amount</strong>
                </Form.Label>
                <Form.Control
                  type="number"
                  value={paymentData.paidAmount}
                  onChange={(e) => handlePaidAmountChange(e.target.value)}
                  placeholder="Enter paid amount"
                  min="0"
                  style={{ fontWeight: 'bold' }}
                />
              </Form.Group>
            </Col>
            <Col md="6">
              <Form.Group>
                <Form.Label>
                  <strong>Wave-off Amount</strong>
                </Form.Label>
                <Form.Control
                  type="number"
                  value={paymentData.waveoffAmount}
                  readOnly
                  style={{
                    fontWeight: 'bold',
                    backgroundColor: parseFloat(paymentData.waveoffAmount) !== 0 ? '#fff3cd' : '#f8f9fa',
                    color: parseFloat(paymentData.waveoffAmount) > 0 ? '#856404' : parseFloat(paymentData.waveoffAmount) < 0 ? '#721c24' : '#000'
                  }}
                />
                {parseFloat(paymentData.waveoffAmount) !== 0 && (
                  <Form.Text className={parseFloat(paymentData.waveoffAmount) > 0 ? 'text-warning' : 'text-danger'}>
                    {parseFloat(paymentData.waveoffAmount) > 0
                      ? `Customer paid ₹${Math.abs(parseFloat(paymentData.waveoffAmount)).toFixed(2)} less`
                      : `Customer paid ₹${Math.abs(parseFloat(paymentData.waveoffAmount)).toFixed(2)} extra`}
                  </Form.Text>
                )}
              </Form.Group>
            </Col>
          </Row>

          <Row className="mb-3">
            <Col>
              <Form.Group>
                <Form.Label>Payment Method</Form.Label>
                <Form.Select value={paymentData.paymentType} onChange={(e) => setPaymentData((prev) => ({ ...prev, paymentType: e.target.value }))}>
                  <option value="Cash">Cash</option>
                  <option value="Card">Card</option>
                  <option value="UPI">UPI</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowPaymentModal(false)}>
            Cancel
          </Button>
          <Button variant="success" onClick={handlePayment} disabled={isLoading}>
            Complete Payment
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default TakeawayOrder;
