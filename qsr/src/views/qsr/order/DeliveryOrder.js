import React, { useState, useEffect, useRef } from 'react';
import { useHistory, useLocation, Prompt } from 'react-router-dom';
import { Button, Row, Col, Card, Form, Badge, Table, Modal } from 'react-bootstrap';
import axios from 'axios';
import HtmlHead from 'components/html-head/HtmlHead';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import { useSocket } from 'contexts/SocketContext';

const DeliveryOrder = () => {
  const history = useHistory();
  const location = useLocation();
  const { socket } = useSocket();

  // Parse URL parameters
  const urlParams = new URLSearchParams(location.search);
  const orderId = urlParams.get('orderId');
  const mode = urlParams.get('mode'); // 'new' or 'edit'
  const [showCategories, setShowCategories] = useState(false);

  const title = `${mode === 'new' ? 'New' : 'Edit'} Delivery Order`;
  const description = 'Manage delivery orders';

  // State
  const [isDirty, setIsDirty] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [nextLocation, setNextLocation] = useState(null);

  // 🔥 NEW: Store initial state to compare against
  const initialStateRef = useRef({
    orderItems: [],
    customerInfo: {
      name: '',
      total_persons: '',
      waiter: '',
      comment: '',
    }
  });
  const [orderItems, setOrderItems] = useState([]);
  const [menuData, setMenuData] = useState([]);
  const [orderStatus, setOrderStatus] = useState('Save');
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    total_persons: '',
    waiter: '',
    comment: '',
  });
  const allowNavigationRef = useRef(false);

  // Token info
  const [tokenNumber, setTokenNumber] = useState(null);

  // Menu filtering states
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showSpecial, setShowSpecial] = useState(false);
  const [showParcelCharge, setShowParcelCharge] = useState(false);
  const [categories, setCategories] = useState([]);
  const [containerCharges, setContainerCharges] = useState([]);
  const [showCancelModal, setShowCancelModal] = useState(false);

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

  // 🔥 NEW: Function to check if there are actual changes
  const hasUnsavedChanges = () => {
    const initial = initialStateRef.current;

    // Compare order items (only check items that are not completed)
    const currentEditableItems = orderItems.filter(item => item.status !== 'Completed');
    const initialEditableItems = initial.orderItems.filter(item => item.status !== 'Completed');

    const itemsChanged = JSON.stringify(currentEditableItems) !== JSON.stringify(initialEditableItems);

    // Compare customer info
    const customerInfoChanged = JSON.stringify(customerInfo) !== JSON.stringify(initial.customerInfo);

    return itemsChanged || customerInfoChanged;
  };

  // 🔥 NEW: Update isDirty only when there are actual changes
  useEffect(() => {
    setIsDirty(hasUnsavedChanges());
  }, [orderItems, customerInfo]);

  const fetchOrderDetails = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API}/order/get/${orderId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const order = response.data.data;
      const items = order.order_items || [];
      const custInfo = {
        name: order.customer_details.name || '',
        phone: order.customer_details.phone || '',
        address: order.customer_details.address || '',
        comment: order.comment || '',
      };
      setOrderItems(order.order_items || []);
      setOrderStatus(order.order_status);
      setTokenNumber(order.token);
      setCustomerInfo(custInfo);
      initialStateRef.current = {
        orderItems: JSON.parse(JSON.stringify(items)),
        customerInfo: JSON.parse(JSON.stringify(custInfo))
      };
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
        vatPercent: taxInfo.vat || 0,
      }));
      setTaxRates({
        cgst: taxInfo.cgst || 0,
        sgst: taxInfo.sgst || 0,
        vat: taxInfo.vat || 0,
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

  useEffect(() => {
    if (!socket) {
      return undefined;
    }

    const handleDishStatusUpdate = ({ orderId: updatedOrderId, status }) => {
      console.log("Dish status updated:", updatedOrderId, status);

      // Refresh only if this order is currently open
      if (updatedOrderId === orderId) {
        fetchOrderDetails();
      }
    };

    socket.on("dish_status_updated", handleDishStatusUpdate);

    return () => {
      socket.off("dish_status_updated", handleDishStatusUpdate);
    };
  }, [socket, orderId]);

  // Calculate totals when order items change
  useEffect(() => {
    const subTotal = orderItems.reduce((sum, item) => sum + item.dish_price * item.quantity, 0);

    // Calculate tax amounts based on subtotal
    const cgstAmount = (subTotal * paymentData.cgstPercent) / 100;
    const sgstAmount = (subTotal * paymentData.sgstPercent) / 100;
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

  // 🔥 Protect against browser refresh/close
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (!isDirty) return;
      e.preventDefault();
      e.returnValue = ''; // Chrome requires returnValue to be set
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  // 🔥 Protect against browser back/forward buttons
  useEffect(() => {
    const unblock = history.block((loc) => {
      // ✅ Allow navigation if explicitly permitted
      if (allowNavigationRef.current) {
        allowNavigationRef.current = false;
        return true;
      }

      if (isDirty && loc.pathname !== window.location.pathname) {
        setNextLocation(loc.pathname);
        setShowLeaveModal(true);
        return false;
      }

      return true;
    });

    return unblock;
  }, [isDirty, history]);

  const handleNavigation = (path) => {
    if (isDirty) {
      setNextLocation(path);
      setShowLeaveModal(true);
    } else {
      history.push(path);
    }
  };

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
      // ONLY merge with non-completed items
      const existingItemIndex = prevItems.findIndex(
        (orderItem) =>
          orderItem.dish_name === item.dish_name &&
          (orderItem.status === 'Pending' || orderItem.status === 'Preparing')
      );

      if (existingItemIndex > -1) {
        return prevItems.map((orderItem, index) =>
          index === existingItemIndex
            ? { ...orderItem, quantity: orderItem.quantity + 1 }
            : orderItem
        );
      }

      // ✅ Always add NEW item if completed already
      return [
        ...prevItems,
        {
          ...item,
          quantity: 1,
          status: 'Pending',
        },
      ];
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

    if (customerInfo.name === '') {
      alert('Please enter customer name');
      return;
    }

    if (customerInfo.phone === '') {
      alert('Please enter customer phone number');
      return;
    }

    if (customerInfo.address === '') {
      alert('Please enter customer address');
      return;
    }

    setIsLoading(true);
    try {
      const orderData = {
        order_type: 'Delivery',
        order_items: orderItems.map((item) => ({
          dish_name: item.dish_name,
          quantity: item.quantity,
          dish_price: item.dish_price,
          special_notes: item.special_notes || '',
          status:
            status === 'KOT'
              ? item.status === 'Pending'
                ? 'Preparing'
                : item.status // keep Completed as-is
              : status === 'Save'
                ? item.status || 'Pending'
                : item.status,
        })),
        order_status: status,
        customer_name: customerInfo.name,
        total_persons: customerInfo.total_persons,
        comment: customerInfo.comment,
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
        order_source: 'QSR',
      };

      const payload = {
        orderInfo: { ...orderData, order_id: orderId },
        customerInfo: {
          name: customerInfo.name,
          phone: customerInfo.phone,
          address: customerInfo.address,
        },
      };

      const response = await axios.post(`${process.env.REACT_APP_API}/order/delivery`, payload, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });

      if (response.data.status === 'success') {
        allowNavigationRef.current = true;
        // 🔥 NEW: Update initial state after successful save
        initialStateRef.current = {
          orderItems: JSON.parse(JSON.stringify(orderItems)),
          customerInfo: JSON.parse(JSON.stringify(customerInfo))
        };
        setIsDirty(false);
        history.push('/dashboard');
        // if (status === 'Paid') {
        //   fetchOrderDetails();
        //   setShowPaymentModal(false);
        // } else {
        //   history.push('/dashboard');
        // }
      }
    } catch (error) {
      console.error('Error saving order:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!orderId) {
      alert('No order to cancel');
      return;
    }

    try {
      setIsLoading(true);

      const payload = {
        orderInfo: {
          order_id: orderId,
          order_status: 'Cancelled',
          order_items: orderItems.map((item) => ({
            ...item,
            status: 'Cancelled',
          })),
        },
      };

      const response = await axios.post(`${process.env.REACT_APP_API}/order/dine-in`, payload, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });

      if (response.data.status === 'success') {
        allowNavigationRef.current = true;
        setIsDirty(false);
        setShowCancelModal(false);
        
        history.push('/dashboard');
      }
    } catch (error) {
      console.error('Error cancelling order:', error);
      alert('Error cancelling order. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePayment = async () => {
    // Validate paid amount
    if (paymentData.paidAmount <= 0) {
      alert('Please enter a valid paid amount');
      return;
    }

    await handleSaveOrder('Paid');
  };

  // Initialize payment modal when opened
  const handleOpenPaymentModal = () => {
    setPaymentData((prev) => ({
      ...prev,
      paidAmount: parseFloat(prev.total),
      waveoffAmount: 0,
    }));
    setShowPaymentModal(true);
  };

  return (
    <>
      <HtmlHead title={title} description={description} />

      <Row className="g-1">
        {/* Menu Section - Now taking 8 columns */}
        <Col lg="8" className="px-1">
          <Card className="h-100 position-relative overflow-hidden">
            {/* HEADER */}
            <Card.Header>
              <Row className="align-items-center">
                <Col className="d-flex align-items-center gap-2">
                  <h5 className="mb-0">Menu Items</h5>
                </Col>

                <Col className="d-flex justify-content-end">
                  <Button variant="outline-secondary" size="sm" onClick={() => history.push('/dashboard')}>
                    <CsLineIcons icon="arrow-left" /> Back
                  </Button>
                </Col>
              </Row>
            </Card.Header>

            {/* BODY */}
            <Card.Body className="p-0 d-flex h-100">
              {/* SIDEBAR */}
              <div
                className={`bg-light border-end position-absolute h-100 ${showCategories ? 'start-0' : ''}`}
                style={{
                  width: '220px',
                  transform: showCategories ? 'translateX(0)' : 'translateX(-100%)',
                  transition: 'transform 0.3s ease',
                  zIndex: 10,
                  overflowY: 'auto',
                }}
              >
                <div className="p-2">
                  <div
                    onClick={() => {
                      setSelectedCategory('');
                      setShowCategories(false);
                    }}
                    className={`py-2 px-2 mb-1 rounded ${selectedCategory === '' ? 'bg-primary text-white' : 'bg-white'}`}
                    style={{ cursor: 'pointer', fontSize: '13px' }}
                  >
                    All
                  </div>

                  {categories.map((category) => (
                    <div
                      key={category}
                      onClick={() => {
                        setSelectedCategory(category);
                        setShowCategories(false);
                      }}
                      className={`py-2 px-2 mb-1 rounded ${selectedCategory === category ? 'bg-primary text-white' : 'bg-white'}`}
                      style={{ cursor: 'pointer', fontSize: '13px' }}
                    >
                      {category}
                    </div>
                  ))}
                </div>
              </div>

              {/* MAIN CONTENT */}
              <div className="flex-grow-1 p-2" style={{ marginLeft: showCategories ? '220px' : '0', transition: 'margin 0.3s ease' }}>
                {/* FILTERS */}
                <Row className="mb-2 g-1">
                  <Col md="1">
                    <Button variant="outline-primary" size="sm" onClick={() => setShowCategories((prev) => !prev)}>
                      {showCategories ? <i className="bi bi-x" /> : <i className="bi bi-list" />}
                    </Button>
                  </Col>
                  <Col md="6">
                    <Form.Control size="sm" placeholder="Search items..." value={searchText} onChange={(e) => setSearchText(e.target.value)} />
                  </Col>
                  <Col md="5" className="d-flex gap-3 align-items-center">
                    <Form.Check
                      type="checkbox"
                      label="Special"
                      checked={showSpecial}
                      onChange={(e) => setShowSpecial(e.target.checked)}
                      disabled={showParcelCharge}
                    />
                    <Form.Check type="checkbox" label="Parcel Charges" checked={showParcelCharge} onChange={(e) => setShowParcelCharge(e.target.checked)} />
                  </Col>
                </Row>

                {/* MENU ITEMS */}
                <div style={{ maxHeight: '65vh', overflowY: 'auto', overflowX: 'hidden' }}>
                  {!showParcelCharge ? (
                    // Regular Menu Items
                    filteredMenuData.map((category) => (
                      <div key={category._id} className="mb-4">
                        <h6 className="text-muted mb-3">{category.category}</h6>
                        <Row className="g-2">
                          {category.dishes.map((dish) => (
                            <Col xs="4" sm="3" md={showCategories ? 3 : 2} key={dish._id}>
                              <Card className="sh-14 hover-border-primary mb-2" onClick={() => addItemToOrder(dish)}>
                                <Card.Body className="p-4 text-center align-items-center d-flex flex-column justify-content-between">
                                  <p className="cta-8 mb-2 lh-1">{dish.dish_name}</p>
                                  <p className="mb-0" style={{ fontWeight: 'bold' }}>
                                    ₹{dish.dish_price}
                                  </p>
                                </Card.Body>
                                <Badge
                                  variant="outline"
                                  className={`text-white mb-2 ${category.meal_type === 'veg' ? 'bg-success' : category.meal_type === 'egg' ? 'bg-warning' : 'bg-danger'
                                    }`}
                                  style={{ position: 'absolute', top: '3px', right: '5px' }}
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
                    <Row className="g-2">
                      {containerCharges.map((charge) => (
                        <Col xs="4" sm="3" md={showCategories ? 3 : 2} key={charge._id}>
                          <Card className="sh-14 hover-border-primary mb-2" onClick={() => addParcelCharge(charge)}>
                            <Card.Body className="p-4 text-center align-items-center d-flex flex-column justify-content-between">
                              <p className="cta-8 mb-2 lh-1">
                                {charge.name} - {charge.size}
                              </p>
                              <p className="mb-0" style={{ fontWeight: 'bold' }}>
                                ₹{charge.price}
                              </p>
                            </Card.Body>
                          </Card>
                        </Col>
                      ))}
                    </Row>
                  )}
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Order Details Section - Now taking 4 columns */}
        <Col lg="4" className="pe-0">
          <Card className="h-100">
            <Card.Header>
              <Row>
                <Col md="7">
                  <h5 className="mb-0">
                    Delivery Order Details
                    {orderStatus && (
                      <Badge bg="secondary" className="ms-2">
                        {orderStatus}
                      </Badge>
                    )}
                  </h5>
                </Col>
                <Col md="5" className="d-flex align-items-start justify-content-end">
                  <h5>Delivery</h5>
                  {tokenNumber && (
                    <Badge bg="primary" className="ms-2">
                      Token #{tokenNumber}
                    </Badge>
                  )}
                </Col>
              </Row>
            </Card.Header>
            <Row className="mt-1">
              <Col md="12">
                <div className="d-flex justify-content-center align-items-center">
                  <div className="mx-1">Date: </div>
                  <div className="fw-bold">{new Date().toLocaleDateString('en-IN')}</div>
                </div>
              </Col>
            </Row>
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
                <Col md="12">
                  <Form.Group>
                    <Form.Label>Address</Form.Label>
                    <Form.Control
                      type="text"
                      value={customerInfo.address}
                      onChange={(e) => setCustomerInfo((prev) => ({ ...prev, address: e.target.value }))}
                      placeholder="Enter delivery address"
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
                              <Button variant="outline-secondary" size="sm" onClick={() => updateItemQuantity(index, -1)} disabled={item.quantity <= 1 || item.status === 'Completed'}>
                                -
                              </Button>
                              <span className="mx-2">{item.quantity}</span>
                              <Button variant="outline-secondary" size="sm" onClick={() => updateItemQuantity(index, 1)} disabled={item.status === 'Completed'}>
                                +
                              </Button>
                            </div>
                          )}
                        </td>
                        <td className="text-center">₹{item.dish_price}</td>
                        <td className="text-center">₹{item.dish_price * item.quantity}</td>
                        <td className="text-center">
                          {item.status === 'Completed' ? (
                            <Badge bg="success">Completed</Badge>
                          ) : (
                            <Button variant="outline-danger" size="sm" onClick={() => removeItem(index)}>
                              <CsLineIcons icon="bin" />
                            </Button>
                          )}
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
                  {orderItems.length > 0 && isDirty && (
                    <>
                      {orderStatus === 'Save' && (
                        <Button variant="secondary" className="me-2" onClick={() => handleSaveOrder('Save')} disabled={isLoading}>
                          Save Order
                        </Button>
                      )}
                      {orderStatus !== 'Paid' && (
                        <Button variant="primary" onClick={() => handleSaveOrder('KOT')} disabled={isLoading}>
                          Send to Kitchen
                        </Button>
                      )}
                    </>
                  )}
                </div>
                <div>
                  {/* 🔥 NEW: Cancel Order button - show only if order exists and not paid */}
                  {orderId && orderStatus !== 'Paid' && (
                    <Button variant="danger" className='mx-2' onClick={() => setShowCancelModal(true)} disabled={isLoading}>
                      Cancel Order
                    </Button>
                  )}

                  {/* Show Dashboard button if order is paid */}
                  {orderStatus === 'Paid' ? (
                    <Button variant="primary" onClick={() => history.push('/dashboard')}>
                      Go to Dashboard
                    </Button>
                  ) : (
                    orderStatus === 'KOT' &&
                    /* Show Payment button only if no items are 'Preparing' */
                    !orderItems.some((item) => item.status === 'Preparing') && (
                      <Button variant="success" onClick={handleOpenPaymentModal}>
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
                    color: parseFloat(paymentData.waveoffAmount) > 0 ? '#856404' : parseFloat(paymentData.waveoffAmount) < 0 ? '#721c24' : '#000',
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
      {/* 🔥 IMPROVED: Leave Confirmation Modal */}
      <Modal
        show={showLeaveModal}
        onHide={() => {
          setShowLeaveModal(false);
          setNextLocation(null);
        }}
        centered
        backdrop="static" // Prevent closing by clicking outside
        keyboard={false} // Prevent closing with ESC key
      >
        <Modal.Header closeButton>
          <Modal.Title>Unsaved Changes</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>You have unsaved changes in this order.</p>
          <p>Please {orderStatus === 'Save' && (<><strong>Save</strong> or</>)} <strong>Send to Kitchen</strong> before leaving.</p>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="danger"
            onClick={() => {
              // Clear dirty flag and close modal
              allowNavigationRef.current = true;
              setIsDirty(false);
              setShowLeaveModal(false);

              // Navigate to next location if set
              if (nextLocation) {
                setTimeout(() => {
                  history.push(nextLocation);
                }, 0);
              }
            }}
          >
            Discard & Leave
          </Button>
          {orderStatus === 'Save' && (
            <Button
              variant="secondary"
              onClick={async () => {
                allowNavigationRef.current = true;
                await handleSaveOrder('Save');
                setShowLeaveModal(false);

                // Navigate after save
                if (nextLocation) {
                  setTimeout(() => {
                    history.push(nextLocation);
                  }, 0);
                }
              }}
              disabled={isLoading}
            >
              Save Order
            </Button>
          )}

          <Button
            variant="primary"
            onClick={async () => {
              allowNavigationRef.current = true;
              await handleSaveOrder('KOT');
              setShowLeaveModal(false);

              // Navigate after KOT
              if (nextLocation) {
                setTimeout(() => {
                  history.push(nextLocation);
                }, 0);
              }
            }}
            disabled={isLoading}
          >
            Send to Kitchen
          </Button>
        </Modal.Footer>
      </Modal>

      {/* 🔥 NEW: Cancel Order Confirmation Modal */}
      <Modal
        show={showCancelModal}
        onHide={() => setShowCancelModal(false)}
        centered
        backdrop="static"
        keyboard={false}
      >
        <Modal.Header closeButton>
          <Modal.Title>Cancel Order</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Are you sure you want to cancel this order?</p>
          <p className="text-danger mb-0">
            <strong>Warning:</strong> This action cannot be undone.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCancelModal(false)} disabled={isLoading}>
            Keep
          </Button>
          <Button variant="danger" onClick={handleCancelOrder} disabled={isLoading}>
            {isLoading ? 'Cancelling...' : 'Cancel'}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default DeliveryOrder;
