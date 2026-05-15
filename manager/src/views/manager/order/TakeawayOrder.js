import React, { useState, useEffect, useRef } from 'react';
import { useHistory, useLocation, Prompt } from 'react-router-dom';
import { Button, Row, Col, Card, Form, Badge } from 'react-bootstrap';
import { getOrderById, getUserTaxInfo, createOrUpdateTakeawayOrder, createOrUpdateDineInOrder } from 'api/orderService';
import HtmlHead from 'components/html-head/HtmlHead';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import { useSocket } from 'contexts/SocketContext';
import { toast } from 'react-toastify';

import MenuGrid from './components/MenuGrid';
import OrderCartTable from './components/OrderCartTable';
import CustomerInfoForm from './components/CustomerInfoForm';
import PaymentSummaryBox from './components/PaymentSummaryBox';
import PaymentModal from './components/PaymentModal';
import BottomCartSheet from './components/BottomCartSheet';
import { LeaveConfirmationModal, CancelOrderModal } from './components/ConfirmationModals';

import useOrderCart from './hooks/useOrderCart';
import useOrderCalculations from './hooks/useOrderCalculations';
import useMenuFetcher from './hooks/useMenuFetcher';

import { printCounterBill, printFullBill, openPrintWindow } from '../../../utils/printUtils';

const TakeawayOrder = () => {
  const history = useHistory();
  const location = useLocation();
  const { socket } = useSocket();

  // Parse URL parameters
  const urlParams = new URLSearchParams(location.search);
  const orderId = urlParams.get('orderId');
  const mode = urlParams.get('mode'); // 'new' or 'edit'
  const [showCategories, setShowCategories] = useState(true);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [printing, setPrinting] = useState(false);

  const title = `${mode === 'new' ? 'New' : 'Edit'} Takeaway Order`;
  const description = 'Manage takeaway orders';

  // State
  const [isDirty, setIsDirty] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [nextLocation, setNextLocation] = useState(null);

  // 🔥 NEW: Store initial state to compare against
  const initialStateRef = useRef({
    orderItems: [],
    customerInfo: {
      name: '',
      phone: '',
      comment: '',
    },
  });
  const allowNavigationRef = useRef(false);

  const [orderItems, setOrderItems] = useState([]);
  const [orderStatus, setOrderStatus] = useState('Save');
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    phone: '',
    comment: '',
  });

  const [showCartSheet, setShowCartSheet] = useState(false);

  // Token info
  const [tokenNumber, setTokenNumber] = useState(null);

  // Takeaway specific states
  const [showParcelCharge, setShowParcelCharge] = useState(false);
  const [containerCharges, setContainerCharges] = useState([]);

  // Hooks
  const {
    categories,
    filteredMenuData,
    searchText,
    setSearchText,
    selectedCategory,
    setSelectedCategory,
    showSpecial,
    setShowSpecial,
  } = useMenuFetcher();

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
    discountType: 'amount',
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
    const currentEditableItems = orderItems.filter((item) => item.status !== 'Completed');
    const initialEditableItems = initial.orderItems.filter((item) => item.status !== 'Completed');

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
      const token = localStorage.getItem('token');
      const response = await getOrderById(orderId, token);
      const order = response.data.data;
      const items = order.order_items || [];
      const custInfo = {
        name: order.customer_name || '',
        phone: order.customer_phone || '',
        comment: order.comment || '',
      };
      setOrderItems(order.order_items || []);
      setOrderStatus(order.order_status);
      setTokenNumber(order.token);
      setCustomerInfo(custInfo);
      initialStateRef.current = {
        orderItems: JSON.parse(JSON.stringify(items)),
        customerInfo: JSON.parse(JSON.stringify(custInfo)),
      };
    } catch (error) {
      console.error('Error fetching order details:', error);
    }
  };



  const fetchTaxRatesAndContainerCharges = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await getUserTaxInfo(token);
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
    fetchTaxRatesAndContainerCharges();
  }, [orderId]);

  // Manage order items and socket events
  const { addItemToOrder, updateItemQuantity, removeItem } = useOrderCart({
    setOrderItems,
    socket,
    orderId,
    fetchOrderDetails,
  });

  // Use custom hook for order calculations
  const {
    handleDiscountTypeChange,
    handleDiscountValueChange,
    handlePaidAmountChange,
  } = useOrderCalculations({
    orderItems,
    taxRates,
    paymentData,
    setPaymentData,
  });

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



  const handlePrint = async (order_id) => {
    try {
      setPrinting({ [order_id]: true });

      const token = localStorage.getItem('token');
      const userRes = await getUserTaxInfo(token);
      const orderRes = await getOrderById(order_id, token);

      const order = orderRes.data.data;

      const userData = userRes.data;

      const groupedByCounter = {};
      order.order_items.forEach(item => {
        const counterName = item.counter || "Default";
        if (!groupedByCounter[counterName]) groupedByCounter[counterName] = [];
        groupedByCounter[counterName].push(item);
      });

      const printWindow = window.open("", "_blank");

      if (!printWindow) {
        toast.error("Popup blocked! Please allow popups.");
        return;
      }

      let allBillsHTML = "";

      allBillsHTML += printFullBill(order, userData, order.order_items, order.sub_total);

      Object.entries(groupedByCounter).forEach(([counterName, items]) => {
        const subTotal = items.reduce(
          (sum, i) => sum + (i.dish_price * i.quantity),
          0
        );

        allBillsHTML += printCounterBill(order, userData, counterName, items);
      });

      printWindow.document.write(`
            <html>
            <head>
            <title>Print Bills</title>
    
            <script>
            window.onload = function() {
              window.focus();
              window.print();
    
              // close window after print dialog
              setTimeout(function() {
                window.close();
              }, 100);
            };
            </script>
    
            </head>
    
            <body>
            ${allBillsHTML}
            </body>
            </html>
            `
      );
      printWindow.document.close();

      printWindow.focus();

    } catch (err) {
      console.error("Print error:", err);
      toast.error("Failed to print bills");
    } finally {
      setPrinting(false);
    }
  };

  const handleNavigation = (path) => {
    if (isDirty) {
      setNextLocation(path);
      setShowLeaveModal(true);
    } else {
      history.push(path);
    }
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

      const token = localStorage.getItem('token');
      const response = await createOrUpdateTakeawayOrder(payload, token);

      if (response.data.status === 'success') {
        allowNavigationRef.current = true;
        // 🔥 NEW: Update initial state after successful save
        initialStateRef.current = {
          orderItems: JSON.parse(JSON.stringify(orderItems)),
          customerInfo: JSON.parse(JSON.stringify(customerInfo)),
        };
        setIsDirty(false);
        setShowPaymentModal(false);
        if (orderData.order_status !== 'Paid') {
          history.push('/dashboard');
        } else {
          fetchOrderDetails();
          toast.success('Order saved and marked as Paid!');
        }
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

      const token = localStorage.getItem('token');
      const response = await createOrUpdateDineInOrder(payload, token);

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
    setPaymentData({
      ...paymentData,
      paidAmount: parseFloat(paymentData.total),
    });

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
      
      <style>{`
        @media (max-width: 767px) {
          .mobile-transparent-card { background: transparent !important; border: none !important; box-shadow: none !important; }
        }
      `}</style>

      {/* Mobile Top Info Header */}
      <div className="d-flex d-md-none justify-content-between align-items-center mb-2 px-2 mt-2">
        <div className="d-flex align-items-center gap-2">
          <h5 className="mb-0 fw-bold">Takeaway</h5>
          {orderStatus && <Badge bg="secondary">{orderStatus}</Badge>}
        </div>
        <div className="d-flex flex-column align-items-end text-muted small">
          {tokenNumber && <span className="fw-bold text-primary">Token #{tokenNumber}</span>}
          <span>{new Date().toLocaleDateString('en-IN')}</span>
        </div>
      </div>

      <Row className="g-1">
        {/* Menu Section - Now taking 8 columns */}
        <Col lg="8" md="8" sm="12" xs="12" className="px-1 mb-3 mb-md-0">
          <Card className="h-100 position-relative overflow-hidden">
            {/* HEADER */}
            <Card.Header>
              <Row className="align-items-center">
                <Col className="d-flex align-items-center gap-2">
                  <h5 className="mb-0">Menu Items</h5>
                </Col>

                <Col className="d-flex justify-content-end">
                  <Button variant="outline-secondary" size="sm" onClick={() => handleNavigation('/dashboard')}>
                    <CsLineIcons icon="arrow-left" className='pb-1' /> Back
                  </Button>
                </Col>
              </Row>
            </Card.Header>

            {/* BODY */}
            <Card.Body className="p-0 d-flex h-100">
              <MenuGrid
                filteredMenuData={filteredMenuData}
                categories={categories}
                selectedCategory={selectedCategory}
                setSelectedCategory={setSelectedCategory}
                searchText={searchText}
                setSearchText={setSearchText}
                showSpecial={showSpecial}
                setShowSpecial={setShowSpecial}
                showCategories={showCategories}
                setShowCategories={setShowCategories}
                addItemToOrder={addItemToOrder}
                showParcelCharge={showParcelCharge}
                setShowParcelCharge={setShowParcelCharge}
                containerCharges={containerCharges}
                addParcelCharge={addParcelCharge}
              />
            </Card.Body>
          </Card>
        </Col>

        {/* Order Details Section - Now taking 4 columns */}
        <Col lg="4" md="4" sm="12" xs="12" className="pe-md-0 px-1 px-md-0">
          <Card className="h-100 mobile-transparent-card">
            <Card.Header className="d-none d-md-block">
              <Row>
                <Col md="7">
                  <h5 className="mb-0">
                    Takeaway Order Details
                    {orderStatus && (
                      <Badge bg="secondary" className="ms-2">
                        {orderStatus}
                      </Badge>
                    )}
                  </h5>
                </Col>
                <Col md="5" className="d-flex align-items-end justify-content-start flex-column">
                  <div className="d-flex align-items-center">
                    <h5>Takeaway</h5>
                    {tokenNumber && (
                      <Badge bg="primary" className="ms-2">
                        Token #{tokenNumber}
                      </Badge>
                    )}
                  </div>
                  <div className="d-flex justify-content-center align-items-center">
                    <div className="mx-1">Date: </div>
                    <div className="fw-bold">{new Date().toLocaleDateString('en-IN')}</div>
                  </div>
                </Col>
              </Row>
            </Card.Header>
            <Card.Body className="p-0 p-md-3">
              {/* Customer Info, Items & Comments (Hidden on Mobile) */}
              <div className="d-none d-md-block">
                <CustomerInfoForm
                  customerInfo={customerInfo}
                  setCustomerInfo={setCustomerInfo}
                  visibleFields={{ name: true, phone: true, total_persons: false, waiter: false }}
                  orderStatus={orderStatus}
                />

                <OrderCartTable orderItems={orderItems} updateItemQuantity={updateItemQuantity} removeItem={removeItem} />

                <Form.Group className="mb-3 mt-3">
                  <Form.Label>Special Instructions</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    value={customerInfo.comment}
                    onChange={(e) => setCustomerInfo((prev) => ({ ...prev, comment: e.target.value }))}
                    placeholder="Any special instructions..."
                  />
                </Form.Group>
              </div>

              {/* Action Buttons & Total */}
              <PaymentSummaryBox
                orderItems={orderItems}
                isDirty={isDirty}
                orderStatus={orderStatus}
                isLoading={isLoading}
                printing={printing}
                paymentData={paymentData}
                orderId={orderId}
                handleSaveOrder={handleSaveOrder}
                handleOpenPaymentModal={handleOpenPaymentModal}
                handleCancelOrder={() => setShowCancelModal(true)}
                handlePrint={handlePrint}
                history={history}
                setShowCartSheet={setShowCartSheet}
              />
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <PaymentModal
        showPaymentModal={showPaymentModal}
        setShowPaymentModal={setShowPaymentModal}
        paymentData={paymentData}
        setPaymentData={setPaymentData}
        handleDiscountTypeChange={handleDiscountTypeChange}
        handleDiscountValueChange={handleDiscountValueChange}
        handlePaidAmountChange={handlePaidAmountChange}
        handlePayment={handlePayment}
        isLoading={isLoading}
      />

      <LeaveConfirmationModal
        showLeaveModal={showLeaveModal}
        setShowLeaveModal={setShowLeaveModal}
        allowNavigationRef={allowNavigationRef}
        setIsDirty={setIsDirty}
        nextLocation={nextLocation}
        history={history}
        handleSaveOrder={handleSaveOrder}
        isLoading={isLoading}
      />

      <CancelOrderModal
        showCancelModal={showCancelModal}
        setShowCancelModal={setShowCancelModal}
        handleCancelOrder={handleCancelOrder}
        isLoading={isLoading}
      />

      <BottomCartSheet
        showCartSheet={showCartSheet}
        setShowCartSheet={setShowCartSheet}
        orderItems={orderItems}
        updateItemQuantity={updateItemQuantity}
        removeItem={removeItem}
        isDirty={isDirty}
        orderStatus={orderStatus}
        isLoading={isLoading}
        printing={printing}
        paymentData={paymentData}
        orderId={orderId}
        handleSaveOrder={handleSaveOrder}
        handleOpenPaymentModal={handleOpenPaymentModal}
        setShowCancelModal={setShowCancelModal}
        handlePrint={handlePrint}
        history={history}
      >
        <h6 className="mb-3 fw-bold text-muted border-bottom pb-2">Customer Details</h6>
        <CustomerInfoForm
          customerInfo={customerInfo}
          setCustomerInfo={setCustomerInfo}
          visibleFields={{ name: true, phone: true, total_persons: false, waiter: false }}
          orderStatus={orderStatus}
        />
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
      </BottomCartSheet>
    </>
  );
};

export default TakeawayOrder;
