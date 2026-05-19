import React, { useState, useEffect, useRef, useContext } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { Button, Form, Badge } from 'react-bootstrap';
import axios from 'axios';
import {
  getOrderById,
  getUserTaxInfo,
  getTableById,
  createOrUpdateDineInOrder,
  createOrUpdateTakeawayOrder,
  createOrUpdateDeliveryOrder,
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
import MobileCartBar from './components/MobileCartBar';
import { LeaveConfirmationModal, CancelOrderModal } from './components/ConfirmationModals';
import useMenuFetcher from './hooks/useMenuFetcher';
import useOrderCart from './hooks/useOrderCart';
import useOrderCalculations from './hooks/useOrderCalculations';

// ── Helpers ────────────────────────────────────────────────────────────────────
const ORDER_TYPES = ['Dine In', 'Takeaway', 'Delivery'];

const DEFAULT_CUSTOMER_INFO = {
  Takeaway: { name: '', phone: '', comment: '' },
  Delivery: { name: '', phone: '', address: '', comment: '' },
  'Dine In': { name: '', total_persons: '', waiter: '', table_no: '', comment: '' },
};

const VISIBLE_FIELDS = {
  Takeaway: { name: true, phone: true, address: false, total_persons: false, waiter: false },
  Delivery: { name: true, phone: true, address: true, total_persons: false, waiter: false },
  'Dine In': { name: true, phone: false, address: false, total_persons: true, waiter: true },
};

const REQUIRED_FIELDS = {
  Takeaway: { name: false, phone: false },
  Delivery: { name: true, phone: true, address: true },
  'Dine In': { name: false, total_persons: false, waiter: false },
};

const API_MAP = {
  Takeaway: createOrUpdateTakeawayOrder,
  Delivery: createOrUpdateDeliveryOrder,
  'Dine In': createOrUpdateDineInOrder,
};

const DEFAULT_PAYMENT_DATA = {
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
};

const DeliveryOrder = () => {
  const history = useHistory();
  const location = useLocation();
  const { socket } = useSocket();

  const urlParams = new URLSearchParams(location.search);
  const orderId = urlParams.get('orderId');
  const tableId = urlParams.get('tableId');
  const mode = urlParams.get('mode');

  const { activePlans } = useContext(AuthContext);
  const canKOT = activePlans ? activePlans.includes('KOT Panel') : false;

  const [orderType, setOrderType] = useState('Delivery');
  const isEditMode = mode === 'edit';

  const title = `${isEditMode ? 'Edit' : 'New'} Delivery Order`;
  const description = 'Manage delivery orders';

  // ── UI State ──────────────────────────────────────────────────────────────
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
  const [isInitialized, setIsInitialized] = useState(false);
  const [kotPrinting, setKotPrinting] = useState(false);
  const [kotHistory, setKotHistory] = useState([]);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [userData, setUserData] = useState({});

  // ── Order State ───────────────────────────────────────────────────────────
  const [orderItems, setOrderItems] = useState([]);
  const [orderStatus, setOrderStatus] = useState('Save');
  const [tokenNumber, setTokenNumber] = useState(null);
  const [containerCharges, setContainerCharges] = useState([]);
  const [customerInfo, setCustomerInfo] = useState({ name: '', phone: '', address: '', total_persons: '', waiter: '', table_no: '', comment: '' });
  const [taxRates, setTaxRates] = useState({ cgst: 0, sgst: 0, vat: 0 });
  const [paymentData, setPaymentData] = useState(DEFAULT_PAYMENT_DATA);
  const [orderNo, setOrderNo] = useState('');
  const [tableInfo, setTableInfo] = useState({});
  const [waiters, setWaiters] = useState([]);

  const initialStateRef = useRef({
    orderItems: [],
    customerInfo: { name: '', phone: '', address: '', total_persons: '', waiter: '', table_no: '', comment: '' },
  });
  const allowNavigationRef = useRef(false);
  const kotSnapshotRef = useRef([]);

  const waiterOptions = (waiters || []).map((w) => ({ value: w.full_name, label: w.full_name }));

  const handleOrderTypeChange = (newType) => {
    if (isEditMode) return;
    setOrderType(newType);
    setOrderItems([]);
    const freshCustomerInfo = { ...DEFAULT_CUSTOMER_INFO[newType] };
    setCustomerInfo({ name: '', phone: '', address: '', total_persons: '', waiter: '', table_no: tableInfo.table_no || '', comment: '', ...freshCustomerInfo });
    setPaymentData((prev) => ({ ...DEFAULT_PAYMENT_DATA, cgstPercent: prev.cgstPercent, sgstPercent: prev.sgstPercent, vatPercent: prev.vatPercent }));
    setIsDirty(false);
    initialStateRef.current = { orderItems: [], customerInfo: { ...freshCustomerInfo, table_no: tableInfo.table_no || '' } };
  };

  async function fetchTableInfo() {
    try {
      const token = localStorage.getItem('token');
      const response = await getTableById(tableId, token);
      setTableInfo(response.data.data);
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
      const detectedType = order.order_type || 'Delivery';
      setOrderType(detectedType);

      let custInfo;
      if (detectedType === 'Dine In') {
        custInfo = {
          name: order.customer_name || '',
          total_persons: order.total_persons || '',
          waiter: order.waiter || '',
          table_no: order.table_no || '',
          phone: '',
          address: '',
          comment: order.comment || '',
        };
      } else if (detectedType === 'Delivery') {
        custInfo = {
          name: order.customer_details?.name || order.customer_name || '',
          phone: order.customer_details?.phone || order.customer_phone || '',
          address: order.customer_details?.address || '',
          total_persons: '',
          waiter: '',
          table_no: '',
          comment: order.comment || '',
        };
      } else {
        custInfo = {
          name: order.customer_name || '',
          phone: order.customer_phone || '',
          address: '',
          total_persons: '',
          waiter: '',
          table_no: '',
          comment: order.comment || '',
        };
      }

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

  const { categories, filteredMenuData, searchText, setSearchText, selectedCategory, setSelectedCategory, showSpecial, setShowSpecial } = useMenuFetcher();
  const { addItemToOrder, updateItemQuantity, removeItem } = useOrderCart({ setOrderItems, socket, orderId, fetchOrderDetails });
  const { handleDiscountTypeChange, handleDiscountValueChange, handlePaidAmountChange } = useOrderCalculations({
    orderItems,
    taxRates,
    paymentData,
    setPaymentData,
  });

  const addParcelCharge = (charge) => {
    addItemToOrder({
      dish_name: `${charge.name} ${charge.size}`,
      dish_price: charge.price,
      special_notes: 'Parcel Charge',
      status: 'Container Charge',
      quantity: 1,
    });
  };

  const hasUnsavedChanges = () => {
    const initial = initialStateRef.current;
    const currentEditable = orderItems.filter((i) => i.status !== 'Completed');
    const initialEditable = initial.orderItems.filter((i) => i.status !== 'Completed');
    return JSON.stringify(currentEditable) !== JSON.stringify(initialEditable) || JSON.stringify(customerInfo) !== JSON.stringify(initial.customerInfo);
  };

  useEffect(() => {
    if (!isInitialized) return;
    setIsDirty(hasUnsavedChanges());
  }, [orderItems, customerInfo, isInitialized]);

  useEffect(() => {
    fetchWaiters();
    if (tableId) fetchTableInfo();
    const token = localStorage.getItem('token');
    if (orderId) {
      fetchOrderDetails();
    } else {
      setIsInitialized(true);
    }
    getUserTaxInfo(token)
      .then((r) => {
        const taxInfo = r.data.taxInfo || {};
        setPaymentData((prev) => ({ ...prev, cgstPercent: taxInfo.cgst || 0, sgstPercent: taxInfo.sgst || 0, vatPercent: taxInfo.vat || 0 }));
        setTaxRates({ cgst: taxInfo.cgst || 0, sgst: taxInfo.sgst || 0, vat: taxInfo.vat || 0 });
        setContainerCharges(r.data.containerCharges || []);
        setUserData(r.data);
      })
      .catch(console.error);
  }, [orderId, tableId]);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (!isDirty) return;
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  useEffect(() => {
    const unblock = history.block((loc) => {
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
  const handlePrint = (order_id) => openPrintWindow(order_id, setPrinting);

  const computeKOTDelta = (currentItems, snapshotItems) => {
    const delta = [];
    for (const item of currentItems) {
      if (!['Completed', 'Cancelled', 'Container Charge'].includes(item.status)) {
        const prev = snapshotItems.find((s) => s.dish_name === item.dish_name && s.special_notes === item.special_notes);
        if (!prev) {
          delta.push({ ...item });
        } else if (item.quantity > prev.quantity) {
          delta.push({ ...item, quantity: item.quantity - prev.quantity });
        }
      }
    }
    return delta;
  };

  const validateOrder = () => {
    if (orderItems.length === 0) {
      alert('Please add items to the order');
      return false;
    }
    if (orderType === 'Delivery') {
      if (!customerInfo.name) {
        alert('Please enter customer name');
        return false;
      }
      if (!customerInfo.phone) {
        alert('Please enter customer phone number');
        return false;
      }
      if (!customerInfo.address) {
        alert('Please enter customer address');
        return false;
      }
    }
    return true;
  };

  const buildPayload = (status, completeAll = false) => {
    const orderData = {
      order_type: orderType,
      order_items: orderItems.map((item) => ({
        dish_name: item.dish_name,
        quantity: item.quantity,
        dish_price: item.dish_price,
        special_notes: item.special_notes || '',
        status: completeAll
          ? 'Completed'
          : status === 'KOT' || status === 'Paid'
          ? item.status === 'Pending'
            ? 'Preparing'
            : item.status
          : status === 'Save'
          ? item.status || 'Pending'
          : item.status,
        selected_variant: item.selected_variant,
        selected_addons: item.selected_addons,
      })),
      order_status: status,
      customer_name: customerInfo.name,
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
      order_source: 'Manager',
    };
    if (orderType === 'Dine In') {
      orderData.total_persons = customerInfo.total_persons;
      orderData.waiter = customerInfo.waiter;
      orderData.table_no = customerInfo.table_no || tableInfo.table_no;
      if (tableInfo.area) orderData.table_area = tableInfo.area;
    }
    const custPayload = { name: customerInfo.name };
    if (orderType !== 'Dine In') custPayload.phone = customerInfo.phone;
    if (orderType === 'Delivery') custPayload.address = customerInfo.address;
    return { orderInfo: { ...orderData, order_id: orderId }, customerInfo: custPayload, tableId: orderType === 'Dine In' ? tableId : undefined };
  };

  const handleKotAndPrint = async () => {
    if (!validateOrder()) return;
    const delta = computeKOTDelta(orderItems, kotSnapshotRef.current);
    if (delta.length === 0) {
      toast.info('No new items to send to kitchen');
      return;
    }
    setIsLoading(true);
    try {
      const payload = buildPayload('KOT', true);
      const token = localStorage.getItem('token');
      const response = await API_MAP[orderType](payload, token);
      if (response.data.status === 'success') {
        const savedId = response.data.orderId || response.data.order?._id || orderId;
        initialStateRef.current = { orderItems: JSON.parse(JSON.stringify(orderItems)), customerInfo: JSON.parse(JSON.stringify(customerInfo)) };
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
          userData,
          setKotPrinting
        );
        toast.success(`KOT #${kotNo} sent to kitchen!`);
        if (!orderId && savedId) {
          allowNavigationRef.current = true;
          if (orderType === 'Dine In' && tableId) {
            window.location.href = `/order/dine-in?tableId=${tableId}&orderId=${savedId}&mode=edit`;
          } else {
            window.location.href = `/order/new?orderId=${savedId}&mode=edit`;
          }
        } else {
          fetchOrderDetails();
        }
      }
    } catch (err) {
      console.error('Error saving KOT:', err);
      alert('Error saving KOT. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReprintKOT = (record) => {
    printKOTSlip(
      {
        orderNo,
        orderType,
        tokenNumber,
        tableNo: customerInfo.table_no || tableInfo.table_no,
        items: record.items,
        kotNo: record.kotNo,
        timestamp: record.timestamp,
      },
      userData,
      setKotPrinting
    );
  };

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
          paid_amount: response.data.order?.paid_amount || initialStateRef.current.paid_amount || 0,
        };
        setOrderStatus(status);
        if (status === 'Paid') {
          const amountPaidThisTime = parseFloat(paymentData.paidAmount) - (parseFloat(initialStateRef.current.paid_amount) || 0);
          if (amountPaidThisTime > 0) {
            const payRecord = { id: Date.now(), amount: amountPaidThisTime, type: paymentData.paymentType, timestamp: new Date().toISOString() };
            const newPayHistory = [...paymentHistory, payRecord];
            setPaymentHistory(newPayHistory);
            if (savedId) localStorage.setItem(`payment_history_${savedId}`, JSON.stringify(newPayHistory));
          }
        }
        if (status !== 'Paid' && status !== 'KOT') {
          history.push('/dashboard');
        } else {
          fetchOrderDetails();
          toast.success('Order saved and marked as Paid!');
          history.push('/dashboard');
        }
      }
    } catch (err) {
      console.error('Error saving order:', err);
      alert('Error saving order. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!orderId) {
      alert('No order to cancel');
      return;
    }
    setIsLoading(true);
    try {
      const payload = {
        orderInfo: { order_id: orderId, order_status: 'Cancelled', order_items: orderItems.map((item) => ({ ...item, status: 'Cancelled' })) },
        tableId: orderType === 'Dine In' ? tableId : undefined,
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
      alert('Error cancelling order. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePayment = async () => {
    if (paymentData.paidAmount <= 0) {
      alert('Please enter a valid paid amount');
      return;
    }
    await handleSaveOrder('Paid');
  };
  const handleOpenPaymentModal = () => {
    const totalAmount = parseFloat(paymentData.total);
    setPaymentData((prev) => ({ ...prev, paidAmount: totalAmount, waveoffAmount: 0 }));
    setShowPaymentModal(true);
  };

  const showParcelUI = orderType !== 'Dine In';
  const visibleFields = VISIBLE_FIELDS[orderType];
  const requiredFields = REQUIRED_FIELDS[orderType];

  return (
    <>
      <HtmlHead title={title} description={description} />
      <div className="pos-wrapper">
        <div className="pos-topbar">
          <Button className="custom-btn-outline" style={{ padding: '0.35rem 1rem', flexShrink: 0 }} onClick={() => handleNavigation('/dashboard')}>
            <CsLineIcons icon="arrow-left" size="13" className="me-1" />
            Back
          </Button>
          <div className="pos-title flex-grow-1">{title}</div>
          {tokenNumber && (
            <div
              style={{
                border: '1.5px solid #23b3f4',
                borderRadius: '50px',
                padding: '3px 12px',
                color: '#23b3f4',
                fontWeight: 700,
                fontSize: '12px',
                flexShrink: 0,
              }}
            >
              Token #{tokenNumber}
            </div>
          )}
          {orderStatus && (
            <div
              style={{
                border: '1.5px solid #6c757d',
                borderRadius: '50px',
                padding: '3px 12px',
                color: '#6c757d',
                fontWeight: 700,
                fontSize: '12px',
                flexShrink: 0,
              }}
            >
              {orderStatus}
            </div>
          )}
          <Form.Select
            size="sm"
            value={orderType}
            onChange={(e) => handleOrderTypeChange(e.target.value)}
            disabled={isEditMode || !!tableId}
            style={{
              maxWidth: '130px',
              borderRadius: '50px',
              borderColor: 'rgba(35,179,244,0.35)',
              color: '#23b3f4',
              fontWeight: 700,
              fontSize: '13px',
              flexShrink: 0,
            }}
          >
            {ORDER_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Form.Select>
          <div className="text-muted small fw-semibold" style={{ flexShrink: 0 }}>
            {new Date().toLocaleDateString('en-IN')}
          </div>
        </div>
        <div className="pos-body">
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
            orderItems={orderItems}
            showParcelCharge={showParcelUI ? showParcelCharge : false}
            setShowParcelCharge={showParcelUI ? setShowParcelCharge : undefined}
            containerCharges={showParcelUI ? containerCharges : []}
            addParcelCharge={showParcelUI ? addParcelCharge : undefined}
          />
          <div className="pos-order-panel">
            <div className="pos-order-header">
              <div className="d-flex justify-content-between align-items-center">
                <div className="fw-bold" style={{ color: '#23b3f4', fontSize: '13px' }}>
                  Order ({orderItems.length})
                </div>
                {tokenNumber && (
                  <div
                    style={{
                      background: 'rgba(35,179,244,0.1)',
                      borderRadius: '50px',
                      padding: '2px 10px',
                      color: '#23b3f4',
                      fontWeight: 800,
                      fontSize: '11px',
                    }}
                  >
                    #{tokenNumber}
                  </div>
                )}
              </div>
            </div>
            <div className="pos-customer-section">
              <CustomerInfoForm
                customerInfo={customerInfo}
                setCustomerInfo={setCustomerInfo}
                tableInfo={tableInfo}
                waiterOptions={waiterOptions}
                orderStatus={orderStatus}
                visibleFields={visibleFields}
                requiredFields={requiredFields}
              />
              <div className="mt-2">
                <Form.Control
                  as="textarea"
                  rows={1}
                  value={customerInfo.comment}
                  onChange={(e) => setCustomerInfo((prev) => ({ ...prev, comment: e.target.value }))}
                  placeholder="Notes..."
                  style={{
                    borderRadius: '6px',
                    border: '1.5px solid rgba(226,232,240,0.9)',
                    fontSize: '11.5px',
                    height: '28px',
                    resize: 'none',
                    color: '#333',
                    background: '#f8fafc',
                  }}
                />
              </div>
            </div>
            <div className="pos-cart-section">
              <OrderCartTable orderItems={orderItems} updateItemQuantity={updateItemQuantity} removeItem={removeItem} />
            </div>
            <div className="pos-total-section">
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
                setShowCancelModal={setShowCancelModal}
                handlePrint={handlePrint}
                history={history}
                setShowCartSheet={setShowCartSheet}
                onKotAndPrint={handleKotAndPrint}
                kotPrinting={kotPrinting}
                kotHistory={kotHistory}
                onReprintKOT={handleReprintKOT}
                paymentHistory={paymentHistory}
                alreadyPaid={parseFloat(initialStateRef.current?.paid_amount) || 0}
                canKOT={canKOT}
              />
            </div>
          </div>
        </div>
      </div>
      <PaymentModal
        showPaymentModal={showPaymentModal}
        setShowPaymentModal={setShowPaymentModal}
        paymentData={paymentData}
        setPaymentData={setPaymentData}
        isLoading={isLoading}
        handleDiscountTypeChange={handleDiscountTypeChange}
        handleDiscountValueChange={handleDiscountValueChange}
        handlePaidAmountChange={handlePaidAmountChange}
        handlePayment={handlePayment}
        orderItems={orderItems}
        customerInfo={customerInfo}
        orderType={orderType}
        orderId={orderId}
        orderNo={orderNo}
        alreadyPaid={parseFloat(initialStateRef.current.paid_amount) || 0}
      />
      <LeaveConfirmationModal
        showLeaveModal={showLeaveModal}
        setShowLeaveModal={setShowLeaveModal}
        setNextLocation={setNextLocation}
        orderStatus={orderStatus}
        allowNavigationRef={allowNavigationRef}
        setIsDirty={setIsDirty}
        nextLocation={nextLocation}
        history={history}
        handleSaveOrder={handleSaveOrder}
        isLoading={isLoading}
      />
      <CancelOrderModal showCancelModal={showCancelModal} setShowCancelModal={setShowCancelModal} handleCancelOrder={handleCancelOrder} isLoading={isLoading} />
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
        alreadyPaid={parseFloat(initialStateRef.current?.paid_amount) || 0}
        canKOT={canKOT}
        onKotAndPrint={handleKotAndPrint}
        kotPrinting={kotPrinting}
        kotHistory={kotHistory}
        onReprintKOT={handleReprintKOT}
        paymentHistory={paymentHistory}
      >
        <div className="d-flex align-items-center justify-content-between mb-3">
          <h6 className="mb-0 fw-bold text-muted border-bottom pb-2 flex-grow-1">Customer Details</h6>
          <Form.Select
            size="sm"
            value={orderType}
            onChange={(e) => handleOrderTypeChange(e.target.value)}
            disabled={isEditMode || !!tableId}
            style={{ maxWidth: '130px', borderRadius: '50px', borderColor: 'rgba(35,179,244,0.3)', color: '#23b3f4', fontWeight: 700 }}
          >
            {ORDER_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Form.Select>
        </div>
        <CustomerInfoForm
          customerInfo={customerInfo}
          setCustomerInfo={setCustomerInfo}
          tableInfo={tableInfo}
          waiterOptions={waiterOptions}
          orderStatus={orderStatus}
          visibleFields={visibleFields}
          requiredFields={requiredFields}
        />
        <Form.Group className="mb-3">
          <Form.Label className="fw-semibold small text-muted">Special Instructions</Form.Label>
          <Form.Control
            as="textarea"
            rows={2}
            value={customerInfo.comment}
            onChange={(e) => setCustomerInfo((prev) => ({ ...prev, comment: e.target.value }))}
            placeholder="Any special instructions..."
            style={{ borderRadius: '12px', border: '1px solid rgba(35,179,244,0.2)', fontSize: '13px' }}
          />
        </Form.Group>
      </BottomCartSheet>
      <MobileCartBar orderItems={orderItems} paymentData={paymentData} setShowCartSheet={setShowCartSheet} />
    </>
  );
};

export default DeliveryOrder;
