import React, { useState, useEffect, useRef, useContext } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { Button, Row, Col, Card, Form, Badge } from 'react-bootstrap';
import axios from 'axios';
import {
  getOrderById, getUserTaxInfo, getTableById,
  createOrUpdateDineInOrder,
} from 'api/orderService';
import HtmlHead from 'components/html-head/HtmlHead';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import { useSocket } from 'contexts/SocketContext';
import { AuthContext } from 'contexts/AuthContext';
import { toast } from 'react-toastify';
import { openPrintWindow, printKOTSlip } from 'utils/printUtils';
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

// ── Helpers ────────────────────────────────────────────────────────────────────
const ORDER_TYPES = ['Dine In'];

const DEFAULT_CUSTOMER_INFO = {
  'Dine In': { name: '', total_persons: '', waiter: '', table_no: '', comment: '' },
};

const VISIBLE_FIELDS = {
  'Dine In': { name: true, phone: false, address: false, total_persons: true, waiter: true },
};

const REQUIRED_FIELDS = {
  'Dine In': { name: false, total_persons: false, waiter: false },
};

const API_MAP = {
  'Dine In': createOrUpdateDineInOrder,
};

const DEFAULT_PAYMENT_DATA = {
  subTotal: 0, cgstPercent: 0, sgstPercent: 0, vatPercent: 0,
  cgstAmount: 0, sgstAmount: 0, vatAmount: 0,
  discountType: 'amount', discountValue: 0, discountAmount: 0,
  total: 0, paidAmount: 0, waveoffAmount: 0, paymentType: 'Cash',
};

// ── Component ──────────────────────────────────────────────────────────────────
const UnifiedOrder = () => {
  const history = useHistory();
  const location = useLocation();
  const { socket } = useSocket();

  const urlParams = new URLSearchParams(location.search);
  const orderId = urlParams.get('orderId');
  const tableId = urlParams.get('tableId');
  const mode = urlParams.get('mode'); // 'new' | 'edit'

  const { activePlans } = useContext(AuthContext);
  const canKOT = activePlans ? activePlans.includes('KOT Panel') : false;

  const orderType = 'Dine In';
  const isEditMode = mode === 'edit';

  const title = `${isEditMode ? 'Edit' : 'New'} ${orderType} Order`;
  const description = 'Manage orders';

  // ── UI State ──────────────────────────────────────────────────────────────
  const [showCategories, setShowCategories] = useState(false);
  const [showCartSheet, setShowCartSheet] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [nextLocation, setNextLocation] = useState(null);
  const [printing, setPrinting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [kotPrinting, setKotPrinting] = useState(false);
  const [kotHistory, setKotHistory] = useState([]);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [userData, setUserData] = useState({});

  // ── Order State ───────────────────────────────────────────────────────────
  const [orderItems, setOrderItems] = useState([]);
  const [orderStatus, setOrderStatus] = useState('Save');
  const [tokenNumber, setTokenNumber] = useState(null);
  const [customerInfo, setCustomerInfo] = useState({ name: '', phone: '', address: '', total_persons: '', waiter: '', table_no: '', comment: '' });
  const [taxRates, setTaxRates] = useState({ cgst: 0, sgst: 0, vat: 0 });
  const [paymentData, setPaymentData] = useState(DEFAULT_PAYMENT_DATA);
  const [orderNo, setOrderNo] = useState('');
  const [tableInfo, setTableInfo] = useState({});
  const [waiters, setWaiters] = useState([]);

  const initialStateRef = useRef({ orderItems: [], customerInfo: { name: '', phone: '', address: '', total_persons: '', waiter: '', table_no: '', comment: '' } });
  const allowNavigationRef = useRef(false);
  const kotSnapshotRef = useRef([]);

  const waiterOptions = (waiters || []).map((w) => ({ value: w.full_name, label: w.full_name }));

  // ── Data Fetchers ─────────────────────────────────────────────────────────
  async function fetchTableInfo() {
    try {
      const token = localStorage.getItem('token');
      const response = await getTableById(tableId, token);
      setTableInfo(response.data.data);
      if (!isEditMode) {
        const tableNo = response.data.data.table_no;
        setCustomerInfo(prev => ({ ...prev, table_no: tableNo }));
        initialStateRef.current.customerInfo.table_no = tableNo;
      }
    } catch (error) {
      console.error('Error fetching table info:', error);
    }
  }

  async function fetchWaiters() {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API}/waiter/get`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setWaiters(response.data.data);
    } catch (err) {
      console.error('Error fetching waiters:', err);
    }
  }

  async function fetchOrderDetails() {
    try {
      const token = localStorage.getItem('token');
      const res = await getOrderById(orderId, token);
      const order = res.data.data;
      const items = order.order_items || [];

      const custInfo = {
        name: order.customer_name || '',
        total_persons: order.total_persons || '',
        waiter: order.waiter || '',
        table_no: order.table_no || '',
        phone: '',
        address: '',
        comment: order.comment || '',
      };

      setOrderItems(items);
      setOrderStatus(order.order_status);
      setTokenNumber(order.token || null);
      setCustomerInfo(custInfo);
      setOrderNo(order.order_no || '');
      initialStateRef.current = {
        orderItems: JSON.parse(JSON.stringify(items)),
        customerInfo: JSON.parse(JSON.stringify(custInfo)),
        paid_amount: order.paid_amount || 0,
      };
      setIsInitialized(true);
      kotSnapshotRef.current = JSON.parse(JSON.stringify(items));
      // Load KOT and Payment history from localStorage
      try {
        const savedKot = localStorage.getItem(`kot_history_${orderId}`);
        if (savedKot) setKotHistory(JSON.parse(savedKot));
        const savedPayment = localStorage.getItem(`payment_history_${orderId}`);
        if (savedPayment) setPaymentHistory(JSON.parse(savedPayment));
      } catch (e) {
        console.error(e);
      }
    } catch (err) {
      console.error('Error fetching order details:', err);
    }
  }

  // ── Hooks ─────────────────────────────────────────────────────────────────
  const { categories, filteredMenuData, searchText, setSearchText, selectedCategory, setSelectedCategory, showSpecial, setShowSpecial } = useMenuFetcher();

  const { addItemToOrder, updateItemQuantity, removeItem } = useOrderCart({ setOrderItems, socket, orderId, fetchOrderDetails });

  const { handleDiscountTypeChange, handleDiscountValueChange, handlePaidAmountChange } = useOrderCalculations({ orderItems, taxRates, paymentData, setPaymentData });

  // ── Dirty Check ───────────────────────────────────────────────────────────
  const hasUnsavedChanges = () => {
    const initial = initialStateRef.current;
    const currentEditable = orderItems.filter((i) => i.status !== 'Completed');
    const initialEditable = initial.orderItems.filter((i) => i.status !== 'Completed');
    return JSON.stringify(currentEditable) !== JSON.stringify(initialEditable) ||
      JSON.stringify(customerInfo) !== JSON.stringify(initial.customerInfo);
  };

  // Guard: only run after initial data is loaded
  useEffect(() => {
    if (!isInitialized) return;
    setIsDirty(hasUnsavedChanges());
  }, [orderItems, customerInfo, isInitialized]);

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  useEffect(() => {
    fetchWaiters();
    if (tableId) fetchTableInfo();

    const token = localStorage.getItem('token');
    if (orderId) {
      fetchOrderDetails();
    } else {
      setIsInitialized(true);
    }
    getUserTaxInfo(token).then((r) => {
      const taxInfo = r.data.taxInfo || {};
      setPaymentData((prev) => ({ ...prev, cgstPercent: taxInfo.cgst || 0, sgstPercent: taxInfo.sgst || 0, vatPercent: taxInfo.vat || 0 }));
      setTaxRates({ cgst: taxInfo.cgst || 0, sgst: taxInfo.sgst || 0, vat: taxInfo.vat || 0 });
      setUserData(r.data);
    }).catch(console.error);
  }, [orderId, tableId]);

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

  // ── KOT Delta ─────────────────────────────────────────────────────────────
  const computeKOTDelta = (currentItems, snapshotItems) => {
    const delta = [];
    for (const item of currentItems) {
      if (!['Completed', 'Cancelled', 'Container Charge'].includes(item.status)) {
        const prev = snapshotItems.find(
          s => s.dish_name === item.dish_name && s.special_notes === item.special_notes
        );

        if (!prev) {
          delta.push({ ...item });
        } else if (item.quantity > prev.quantity) {
          delta.push({ ...item, quantity: item.quantity - prev.quantity });
        }
      }
    }
    return delta;
  };

  // ── Validation ────────────────────────────────────────────────────────────
  const validateOrder = () => {
    if (orderItems.length === 0) { toast.error('Please add items to the order'); return false; }
    return true;
  };

  // ── Payload Builder ───────────────────────────────────────────────────────
  const buildPayload = (status, completeAll = false) => {
    const orderData = {
      order_type: orderType,
      order_items: orderItems.map((item) => ({
        dish_name: item.dish_name, quantity: item.quantity, dish_price: item.dish_price,
        special_notes: item.special_notes || '',
        status: completeAll
          ? 'Completed'
          : (status === 'KOT' || status === 'Paid')
            ? (item.status === 'Pending' ? 'Preparing' : item.status)
            : (status === 'Save' ? (item.status || 'Pending') : item.status),
      })),
      order_status: status,
      customer_name: customerInfo.name,
      comment: customerInfo.comment,
      bill_amount: parseFloat(paymentData.total), sub_total: parseFloat(paymentData.subTotal),
      cgst_percent: parseFloat(paymentData.cgstPercent), sgst_percent: parseFloat(paymentData.sgstPercent), vat_percent: parseFloat(paymentData.vatPercent),
      cgst_amount: parseFloat(paymentData.cgstAmount), sgst_amount: parseFloat(paymentData.sgstAmount), vat_amount: parseFloat(paymentData.vatAmount),
      discount_amount: parseFloat(paymentData.discountAmount), waveoff_amount: parseFloat(paymentData.waveoffAmount),
      total_amount: parseFloat(paymentData.total), paid_amount: parseFloat(paymentData.paidAmount),
      payment_type: paymentData.paymentType, order_source: 'Captain',
    };

    orderData.total_persons = customerInfo.total_persons;
    orderData.waiter = customerInfo.waiter;
    orderData.table_no = customerInfo.table_no || tableInfo.table_no;
    if (tableInfo.area) orderData.table_area = tableInfo.area;

    return {
      orderInfo: { ...orderData, order_id: orderId },
      customerInfo: { name: customerInfo.name },
      tableId,
    };
  };

  // ── KOT & Print ───────────────────────────────────────────────────────────
  const handleKotAndPrint = async () => {
    if (!validateOrder()) return;
    const delta = computeKOTDelta(orderItems, kotSnapshotRef.current);
    if (delta.length === 0) { toast.info('No new items to send to kitchen'); return; }

    setIsLoading(true);
    try {
      const payload = buildPayload('KOT', true); // completeAll = true as requested
      const token = localStorage.getItem('token');
      const response = await API_MAP[orderType](payload, token);
      if (response.data.status === 'success') {
        const savedId = response.data.orderId || response.data.order?._id || orderId;

        initialStateRef.current = {
          orderItems: JSON.parse(JSON.stringify(orderItems)),
          customerInfo: JSON.parse(JSON.stringify(customerInfo)),
        };
        kotSnapshotRef.current = JSON.parse(JSON.stringify(orderItems));
        setIsDirty(false);
        setOrderStatus('KOT');

        const kotNo = kotHistory.length + 1;
        const timestamp = new Date().toISOString();
        const record = { id: Date.now(), timestamp, items: delta, kotNo };
        const newHistory = [...kotHistory, record];
        setKotHistory(newHistory);
        if (savedId) localStorage.setItem(`kot_history_${savedId}`, JSON.stringify(newHistory));

        printKOTSlip(
          { orderNo, orderType, tokenNumber, tableNo: customerInfo.table_no || tableInfo.table_no, items: delta, kotNo, timestamp },
          userData, setKotPrinting
        );
        toast.success(`KOT #${kotNo} sent to kitchen!`);

        if (!orderId && savedId) {
          allowNavigationRef.current = true;
          window.location.href = `/order/dine-in?tableId=${tableId}&orderId=${savedId}&mode=edit`;
        } else {
          fetchOrderDetails();
        }
      }
    } catch (err) {
      console.error('Error saving KOT:', err);
      toast.error('Error saving KOT. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReprintKOT = (record) => {
    printKOTSlip(
      { orderNo, orderType, tokenNumber, tableNo: customerInfo.table_no || tableInfo.table_no, items: record.items, kotNo: record.kotNo, timestamp: record.timestamp },
      userData, setKotPrinting
    );
  };

  // ── Save / Cancel / Pay ───────────────────────────────────────────────────
  const handleSaveOrder = async (status = 'Save') => {
    if (!validateOrder()) return;
    setIsLoading(true);
    try {
      const payload = buildPayload(status);
      const token = localStorage.getItem('token');
      const response = await API_MAP[orderType](payload, token);
      if (response.data.status === 'success') {
        const savedId = response.data.orderId || response.data.order?._id || orderId;
        allowNavigationRef.current = true;
        initialStateRef.current = {
          orderItems: JSON.parse(JSON.stringify(orderItems)),
          customerInfo: JSON.parse(JSON.stringify(customerInfo)),
          paid_amount: (response.data.order?.paid_amount || initialStateRef.current.paid_amount || 0),
        };
        setOrderStatus(status);

        if (status === 'Paid') {
          const amountPaidThisTime = parseFloat(paymentData.paidAmount) - (parseFloat(initialStateRef.current.paid_amount) || 0);
          if (amountPaidThisTime > 0) {
            const payRecord = {
              id: Date.now(),
              amount: amountPaidThisTime,
              type: paymentData.paymentType,
              timestamp: new Date().toISOString(),
            };
            const newPayHistory = [...paymentHistory, payRecord];
            setPaymentHistory(newPayHistory);
            if (savedId) localStorage.setItem(`payment_history_${savedId}`, JSON.stringify(newPayHistory));
          }
        }

        if (status !== 'Paid' && status !== 'KOT') {
          history.push('/dashboard');
        } else {
          fetchOrderDetails();
          toast.success('Order saved successfully!');
          history.push('/dashboard');
        }
      }
    } catch (err) {
      console.error('Error saving order:', err);
      toast.error('Error saving order. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!orderId) { alert('No order to cancel'); return; }
    setIsLoading(true);
    try {
      const payload = {
        orderInfo: {
          order_id: orderId,
          order_status: 'Cancelled',
          order_items: orderItems.map((item) => ({ ...item, status: 'Cancelled' })),
        },
        tableId,
      };
      const token = localStorage.getItem('token');
      const response = await API_MAP[orderType](payload, token);
      if (response.data.status === 'success') {
        allowNavigationRef.current = true;
        setIsDirty(false);
        setShowCancelModal(false);
        history.push('/dashboard');
      }
    } catch (err) {
      console.error('Error cancelling order:', err);
      toast.error('Error cancelling order. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePayment = async () => {
    if (paymentData.paidAmount <= 0) { toast.error('Please enter a valid paid amount'); return; }
    await handleSaveOrder('Paid');
  };

  const handleOpenPaymentModal = () => {
    const totalAmount = parseFloat(paymentData.total);
    setPaymentData((prev) => ({
      ...prev,
      paidAmount: totalAmount,
      waveoffAmount: 0
    }));
    setShowPaymentModal(true);
  };

  const visibleFields = VISIBLE_FIELDS[orderType];
  const requiredFields = REQUIRED_FIELDS[orderType];

  return (
    <>
      <HtmlHead title={title} description={description} />
      <style>{`@media (max-width: 991px) { .mobile-transparent-card { background: transparent !important; border: none !important; box-shadow: none !important; } }`}</style>

      {/* Mobile Top Info */}
      <div className="d-flex d-lg-none justify-content-between align-items-center mb-2 px-2 mt-2">
        <div className="d-flex align-items-center gap-2">
          <h5 className="mb-0 fw-bold">
            {orderType}
            {(tableInfo.table_no || customerInfo.table_no)
              ? ` — Table ${tableInfo.table_no || customerInfo.table_no}`
              : ''}
          </h5>
          {orderStatus && <Badge bg="secondary">{orderStatus}</Badge>}
        </div>
        <div className="d-flex flex-column align-items-end text-muted small">
          {tokenNumber && <span className="fw-bold text-primary">Token #{tokenNumber}</span>}
          <span>{new Date().toLocaleDateString('en-IN')}</span>
        </div>
      </div>

      <Row className="g-1">
        <Col lg="8" xs="12" className="px-1 mb-3 mb-lg-0">
          <Card className="h-100 position-relative overflow-hidden">
            <Card.Header>
              <Row className="align-items-center">
                <Col className="d-flex align-items-center gap-2"><h5 className="mb-0">Menu Items</h5></Col>
                <Col className="d-flex justify-content-end">
                  <Button variant="outline-secondary" size="sm" onClick={() => handleNavigation('/dashboard')}>
                    <CsLineIcons icon="arrow-left" className='pb-1' /> Back
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
              />
            </Card.Body>
          </Card>
        </Col>

        <Col lg="4" xs="12" className="pe-lg-0 px-1 px-lg-0">
          <Card className="h-100 mobile-transparent-card">
            <Card.Header className="d-none d-lg-block">
              <Row>
                <Col md="7">
                  {tokenNumber && <Badge bg="primary" className="mb-1">Token #{tokenNumber}</Badge>}
                  <h5 className="mb-0">
                    {tableInfo.table_no || customerInfo.table_no
                      ? `Table ${tableInfo.table_no || customerInfo.table_no}`
                      : orderType}
                  </h5>
                </Col>
                <Col md="5" className="d-flex flex-column align-items-end justify-content-start">
                  {orderStatus && <Badge bg="secondary" className="ms-2 mb-1">{orderStatus}</Badge>}
                  <div className="d-flex justify-content-center align-items-center small">
                    <div className="mx-1">Date: </div>
                    <div className="fw-bold">{new Date().toLocaleDateString('en-IN')}</div>
                  </div>
                </Col>
              </Row>
            </Card.Header>
            <Card.Body className="p-0 p-lg-3">
              <div className="d-none d-lg-block">
                <CustomerInfoForm
                  customerInfo={customerInfo} setCustomerInfo={setCustomerInfo}
                  tableInfo={tableInfo} waiterOptions={waiterOptions}
                  orderStatus={orderStatus}
                  visibleFields={visibleFields}
                  requiredFields={requiredFields}
                />
                <hr className="my-3" />
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
                onKotAndPrint={handleKotAndPrint} kotPrinting={kotPrinting}
                kotHistory={kotHistory} onReprintKOT={handleReprintKOT}
                paymentHistory={paymentHistory}
                alreadyPaid={parseFloat(initialStateRef.current?.paid_amount) || 0}
                canKOT={canKOT}
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
        orderItems={orderItems} customerInfo={customerInfo} orderType={orderType}
        orderId={orderId} orderNo={orderNo}
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
        alreadyPaid={parseFloat(initialStateRef.current?.paid_amount) || 0}
        canKOT={canKOT}
        onKotAndPrint={handleKotAndPrint} kotPrinting={kotPrinting}
        kotHistory={kotHistory} onReprintKOT={handleReprintKOT}
        paymentHistory={paymentHistory}
      >
        <h6 className="mb-3 fw-bold text-muted border-bottom pb-2">Customer Details</h6>
        <CustomerInfoForm
          customerInfo={customerInfo} setCustomerInfo={setCustomerInfo}
          tableInfo={tableInfo} waiterOptions={waiterOptions}
          orderStatus={orderStatus}
          visibleFields={visibleFields}
          requiredFields={requiredFields}
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

export default UnifiedOrder;
