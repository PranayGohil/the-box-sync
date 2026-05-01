import React, { useState, useEffect, useRef } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { Button, Row, Col, Card, Form, Badge } from 'react-bootstrap';
import { getOrderById, getUserTaxInfo, createOrUpdateDeliveryOrder } from 'api/orderService';
import HtmlHead from 'components/html-head/HtmlHead';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import { useSocket } from 'contexts/SocketContext';
import { toast } from 'react-toastify';
import { openPrintWindow } from 'utils/printUtils';
import MenuGrid from './components/MenuGrid';
import OrderCartTable from './components/OrderCartTable';
import CustomerInfoForm from './components/CustomerInfoForm';
import PaymentSummaryBox from './components/PaymentSummaryBox';
import PaymentModal from './components/PaymentModal';
import BottomCartSheet from './components/BottomCartSheet';
import { LeaveConfirmationModal, CancelOrderModal } from './components/ConfirmationModals';
import useMenuFetcher from './hooks/useMenuFetcher';
import useOrderCart from './hooks/useOrderCart';
import useOrderCalculations from './hooks/useOrderCalculations';

const DeliveryOrder = () => {
  const history = useHistory();
  const location = useLocation();
  const { socket } = useSocket();

  const urlParams = new URLSearchParams(location.search);
  const orderId = urlParams.get('orderId');
  const mode = urlParams.get('mode');

  const title = `${mode === 'new' ? 'New' : 'Edit'} Delivery Order`;
  const description = 'Manage delivery orders';

  // ── UI State ─────────────────────────────────────────────────────────────
  const [showCategories, setShowCategories] = useState(false);
  const [showCartSheet, setShowCartSheet] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showParcelCharge, setShowParcelCharge] = useState(false);
  const [nextLocation, setNextLocation] = useState(null);
  const [printing, setPrinting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // ── Order State ───────────────────────────────────────────────────────────
  const [orderItems, setOrderItems] = useState([]);
  const [orderStatus, setOrderStatus] = useState('Save');
  const [tokenNumber, setTokenNumber] = useState(null);
  const [containerCharges, setContainerCharges] = useState([]);
  const [customerInfo, setCustomerInfo] = useState({ name: '', phone: '', address: '', comment: '' });
  const [taxRates, setTaxRates] = useState({ cgst: 0, sgst: 0, vat: 0 });
  const [paymentData, setPaymentData] = useState({
    subTotal: 0, cgstPercent: 0, sgstPercent: 0, vatPercent: 0,
    cgstAmount: 0, sgstAmount: 0, vatAmount: 0,
    discountType: 'amount', discountValue: 0, discountAmount: 0,
    total: 0, paidAmount: 0, waveoffAmount: 0, paymentType: 'Cash',
  });
  const [orderNo, setOrderNo] = useState("");
  const [isInitialized, setIsInitialized] = useState(false);

  const initialStateRef = useRef({ orderItems: [], customerInfo: { name: '', phone: '', address: '', comment: '' } });
  const allowNavigationRef = useRef(false);

  // ── Data Fetchers ─────────────────────────────────────────────────────────
  async function fetchOrderDetails() {
    try {
      const token = localStorage.getItem('token');
      const res = await getOrderById(orderId, token);
      const order = res.data.data;
      const items = order.order_items || [];
      const custInfo = {
        name: order.customer_details?.name || '',
        phone: order.customer_details?.phone || '',
        address: order.customer_details?.address || '',
        comment: order.comment || '',
      };
      setOrderItems(items);
      setOrderStatus(order.order_status);
      setTokenNumber(order.token);
      setCustomerInfo(custInfo);
      setOrderNo(order.order_no);
      initialStateRef.current = { orderItems: JSON.parse(JSON.stringify(items)), customerInfo: JSON.parse(JSON.stringify(custInfo)) };
      setIsInitialized(true);
    } catch (err) { console.error('Error fetching order details:', err); }
  }

  // ── Hooks ─────────────────────────────────────────────────────────────────
  const { categories, filteredMenuData, searchText, setSearchText, selectedCategory, setSelectedCategory, showSpecial, setShowSpecial } = useMenuFetcher();

  const { addItemToOrder, updateItemQuantity, removeItem } = useOrderCart({ setOrderItems, socket, orderId, fetchOrderDetails });

  const { handleDiscountTypeChange, handleDiscountValueChange, handlePaidAmountChange } = useOrderCalculations({ orderItems, taxRates, paymentData, setPaymentData });

  // ── Parcel Charge helper ───────────────────────────────────────────────────
  const addParcelCharge = (charge) => {
    addItemToOrder({ dish_name: `${charge.name} ${charge.size}`, dish_price: charge.price, special_notes: 'Parcel Charge', status: 'Container Charge', quantity: 1 });
  };

  // ── Dirty Check ───────────────────────────────────────────────────────────
  const hasUnsavedChanges = () => {
    const initial = initialStateRef.current;
    const currentEditable = orderItems.filter((i) => i.status !== 'Completed');
    const initialEditable = initial.orderItems.filter((i) => i.status !== 'Completed');
    return JSON.stringify(currentEditable) !== JSON.stringify(initialEditable) ||
      JSON.stringify(customerInfo) !== JSON.stringify(initial.customerInfo);
  };
  // Guard: only run after initial data is loaded
  useEffect(() => { if (!isInitialized) return; setIsDirty(hasUnsavedChanges()); }, [orderItems, customerInfo, isInitialized]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (orderId) fetchOrderDetails();
    getUserTaxInfo(token).then((r) => {
      const taxInfo = r.data.taxInfo || {};
      setPaymentData((prev) => ({ ...prev, cgstPercent: taxInfo.cgst || 0, sgstPercent: taxInfo.sgst || 0, vatPercent: taxInfo.vat || 0 }));
      setTaxRates({ cgst: taxInfo.cgst || 0, sgst: taxInfo.sgst || 0, vat: taxInfo.vat || 0 });
      setContainerCharges(r.data.containerCharges || []);
    }).catch(console.error);
  }, [orderId]);

  // ── Navigation Guard ──────────────────────────────────────────────────────
  useEffect(() => {
    const handleBeforeUnload = (e) => { if (!isDirty) return; e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  useEffect(() => {
    const unblock = history.block((loc) => {
      if (allowNavigationRef.current) { allowNavigationRef.current = false; return true; }
      if (isDirty && loc.pathname !== window.location.pathname) { setNextLocation(loc.pathname); setShowLeaveModal(true); return false; }
      return true;
    });
    return unblock;
  }, [isDirty, history]);

  const handleNavigation = (path) => { if (isDirty) { setNextLocation(path); setShowLeaveModal(true); } else { history.push(path); } };

  // ── Print ─────────────────────────────────────────────────────────────────
  const handlePrint = (order_id) => openPrintWindow(order_id, setPrinting);

  // ── Save / Cancel / Pay ───────────────────────────────────────────────────
  const handleSaveOrder = async (status = 'Save') => {
    if (orderItems.length === 0) { alert('Please add items to the order'); return; }
    if (!customerInfo.name) { alert('Please enter customer name'); return; }
    if (!customerInfo.phone) { alert('Please enter customer phone number'); return; }
    if (!customerInfo.address) { alert('Please enter customer address'); return; }
    setIsLoading(true);
    try {
      const orderData = {
        order_type: 'Delivery',
        order_items: orderItems.map((item) => ({
          dish_name: item.dish_name, quantity: item.quantity, dish_price: item.dish_price,
          special_notes: item.special_notes || '',
          status: status === 'KOT' ? (item.status === 'Pending' ? 'Preparing' : item.status) : (status === 'Save' ? (item.status || 'Pending') : item.status),
        })),
        order_status: status,
        customer_name: customerInfo.name, comment: customerInfo.comment,
        bill_amount: parseFloat(paymentData.total), sub_total: parseFloat(paymentData.subTotal),
        cgst_percent: parseFloat(paymentData.cgstPercent), sgst_percent: parseFloat(paymentData.sgstPercent), vat_percent: parseFloat(paymentData.vatPercent),
        cgst_amount: parseFloat(paymentData.cgstAmount), sgst_amount: parseFloat(paymentData.sgstAmount), vat_amount: parseFloat(paymentData.vatAmount),
        discount_amount: parseFloat(paymentData.discountAmount), waveoff_amount: parseFloat(paymentData.waveoffAmount),
        total_amount: parseFloat(paymentData.total), paid_amount: parseFloat(paymentData.paidAmount),
        payment_type: paymentData.paymentType, order_source: 'QSR',
      };
      const payload = {
        orderInfo: { ...orderData, order_id: orderId },
        customerInfo: { name: customerInfo.name, phone: customerInfo.phone, address: customerInfo.address },
      };
      const token = localStorage.getItem('token');
      const response = await createOrUpdateDeliveryOrder(payload, token);
      if (response.data.status === 'success') {
        allowNavigationRef.current = true;
        initialStateRef.current = { orderItems: JSON.parse(JSON.stringify(orderItems)), customerInfo: JSON.parse(JSON.stringify(customerInfo)) };
        setIsDirty(false); setShowPaymentModal(false);
        if (orderData.order_status !== 'Paid') { history.push('/dashboard'); } else { fetchOrderDetails(); toast.success('Order saved and marked as Paid!'); }
      }
    } catch (err) { console.error('Error saving order:', err); alert('Error saving order. Please try again.'); }
    finally { setIsLoading(false); }
  };

  const handleCancelOrder = async () => {
    if (!orderId) { alert('No order to cancel'); return; }
    setIsLoading(true);
    try {
      const payload = { orderInfo: { order_id: orderId, order_status: 'Cancelled', order_items: orderItems.map((item) => ({ ...item, status: 'Cancelled' })) } };
      const token = localStorage.getItem('token');
      const response = await createOrUpdateDeliveryOrder(payload, token);
      if (response.data.status === 'success') { allowNavigationRef.current = true; setIsDirty(false); setShowCancelModal(false); history.push('/dashboard'); }
    } catch (err) { console.error('Error cancelling order:', err); alert('Error cancelling order. Please try again.'); }
    finally { setIsLoading(false); }
  };

  const handlePayment = async () => {
    if (paymentData.paidAmount <= 0) { alert('Please enter a valid paid amount'); return; }
    await handleSaveOrder('Paid');
  };

  const handleOpenPaymentModal = () => {
    setPaymentData((prev) => ({ ...prev, paidAmount: parseFloat(prev.total), waveoffAmount: 0 }));
    setShowPaymentModal(true);
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <HtmlHead title={title} description={description} />
      <style>{`@media (max-width: 991px) { .mobile-transparent-card { background: transparent !important; border: none !important; box-shadow: none !important; } }`}</style>

      {/* Mobile Top Info */}
      <div className="d-flex d-lg-none justify-content-between align-items-center mb-2 px-2 mt-2">
        <div className="d-flex align-items-center gap-2">
          <h5 className="mb-0 fw-bold">Delivery</h5>
          {orderStatus && <Badge bg="secondary">{orderStatus}</Badge>}
        </div>
        <div className="d-flex flex-column align-items-end text-muted small">
          {tokenNumber && <span className="fw-bold text-primary">Token #{tokenNumber}</span>}
          <span>{new Date().toLocaleDateString('en-IN')}</span>
        </div>
      </div>

      <Row className="g-1">
        {/* Menu Section */}
        <Col lg="8" xs="12" className="px-1 mb-3 mb-lg-0">
          <Card className="h-100 position-relative overflow-hidden">
            <Card.Header>
              <Row className="align-items-center">
                <Col className="d-flex align-items-center gap-2"><h5 className="mb-0">Menu Items</h5></Col>
                <Col className="d-flex justify-content-end">
                  <Button variant="outline-secondary" size="sm" onClick={() => handleNavigation('/dashboard')}>
                    <CsLineIcons icon="arrow-left" className="pb-1" /> Back
                  </Button>
                </Col>
              </Row>
            </Card.Header>
            <Card.Body className="p-0 d-flex h-100">
              <MenuGrid
                filteredMenuData={filteredMenuData} categories={categories}
                selectedCategory={selectedCategory} setSelectedCategory={setSelectedCategory}
                searchText={searchText} setSearchText={setSearchText}
                showSpecial={showSpecial} setShowSpecial={setShowSpecial}
                showCategories={showCategories} setShowCategories={setShowCategories}
                addItemToOrder={addItemToOrder}
                showParcelCharge={showParcelCharge} setShowParcelCharge={setShowParcelCharge}
                containerCharges={containerCharges} addParcelCharge={addParcelCharge}
              />
            </Card.Body>
          </Card>
        </Col>

        {/* Order Details Section */}
        <Col lg="4" xs="12" className="pe-lg-0 px-1 px-lg-0">
          <Card className="h-100 mobile-transparent-card">
            <Card.Header className="d-none d-lg-block">
              <Row>
                <Col md="7">
                  <h5 className="mb-0">
                    Delivery Order Details
                    {orderStatus && <Badge bg="secondary" className="ms-2">{orderStatus}</Badge>}
                  </h5>
                </Col>
                <Col md="5" className="d-flex flex-column align-items-end justify-content-start">
                  <div className="d-flex align-items-center">
                    <h5>Delivery</h5>
                    {tokenNumber && <Badge bg="primary" className="ms-2">Token #{tokenNumber}</Badge>}
                  </div>
                  <div className="d-flex align-items-center">
                    <div className="mx-1">Date:</div>
                    <div className="fw-bold">{new Date().toLocaleDateString('en-IN')}</div>
                  </div>
                </Col>
              </Row>
            </Card.Header>
            <Card.Body className="p-0 p-lg-3">
              <div className="d-none d-lg-block">
                <CustomerInfoForm
                  customerInfo={customerInfo} setCustomerInfo={setCustomerInfo} orderStatus={orderStatus}
                  requiredFields={{ name: true, phone: true, address: true }}
                  visibleFields={{ name: true, phone: true, address: true, total_persons: false, waiter: false }}
                />
                <OrderCartTable orderItems={orderItems} updateItemQuantity={updateItemQuantity} removeItem={removeItem} />
                <Form.Group className="mb-3 mt-3">
                  <Form.Label>Special Instructions</Form.Label>
                  <Form.Control as="textarea" rows={2} value={customerInfo.comment}
                    onChange={(e) => setCustomerInfo((prev) => ({ ...prev, comment: e.target.value }))}
                    placeholder="Any special instructions..." />
                </Form.Group>
              </div>
              <PaymentSummaryBox
                orderItems={orderItems} isDirty={isDirty} orderStatus={orderStatus}
                isLoading={isLoading} printing={printing} paymentData={paymentData} orderId={orderId}
                handleSaveOrder={handleSaveOrder} handleOpenPaymentModal={handleOpenPaymentModal}
                setShowCancelModal={setShowCancelModal} handlePrint={handlePrint}
                history={history} setShowCartSheet={setShowCartSheet}
              />
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <PaymentModal
        showPaymentModal={showPaymentModal} setShowPaymentModal={setShowPaymentModal}
        paymentData={paymentData} setPaymentData={setPaymentData} isLoading={isLoading}
        handleDiscountTypeChange={handleDiscountTypeChange} handleDiscountValueChange={handleDiscountValueChange}
        handlePaidAmountChange={handlePaidAmountChange} handlePayment={handlePayment}
        orderItems={orderItems} customerInfo={customerInfo} orderType="Delivery" orderId={orderId} orderNo={orderNo}
      />
      <LeaveConfirmationModal
        showLeaveModal={showLeaveModal} setShowLeaveModal={setShowLeaveModal}
        setNextLocation={setNextLocation} orderStatus={orderStatus} allowNavigationRef={allowNavigationRef}
        setIsDirty={setIsDirty} nextLocation={nextLocation} history={history}
        handleSaveOrder={handleSaveOrder} isLoading={isLoading}
      />
      <CancelOrderModal showCancelModal={showCancelModal} setShowCancelModal={setShowCancelModal} handleCancelOrder={handleCancelOrder} isLoading={isLoading} />

      <BottomCartSheet
        showCartSheet={showCartSheet} setShowCartSheet={setShowCartSheet}
        orderItems={orderItems} updateItemQuantity={updateItemQuantity} removeItem={removeItem}
        isDirty={isDirty} orderStatus={orderStatus} isLoading={isLoading} printing={printing}
        paymentData={paymentData} orderId={orderId} handleSaveOrder={handleSaveOrder}
        handleOpenPaymentModal={handleOpenPaymentModal} setShowCancelModal={setShowCancelModal}
        handlePrint={handlePrint} history={history}
      >
        <h6 className="mb-3 fw-bold text-muted border-bottom pb-2">Customer Details</h6>
        <CustomerInfoForm
          customerInfo={customerInfo} setCustomerInfo={setCustomerInfo} orderStatus={orderStatus}
          requiredFields={{ name: true, phone: true, address: true }}
          visibleFields={{ name: true, phone: true, address: true, total_persons: false, waiter: false }}
        />
        <Form.Group className="mb-3">
          <Form.Label>Special Instructions</Form.Label>
          <Form.Control as="textarea" rows={2} value={customerInfo.comment}
            onChange={(e) => setCustomerInfo((prev) => ({ ...prev, comment: e.target.value }))}
            placeholder="Any special instructions..." />
        </Form.Group>
      </BottomCartSheet>
    </>
  );
};

export default DeliveryOrder;
