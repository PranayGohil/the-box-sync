import React, { useState, useEffect, useRef, useContext } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { Button, Row, Col, Card, Form, Badge } from 'react-bootstrap';
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
import { openPrintWindow, printKOTSlip, printModalBill } from 'utils/printUtils';
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
const ORDER_TYPES = ['Takeaway', 'Delivery'];

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
  discountValue: '',
  discountAmount: 0,
  total: 0,
  paidAmount: '',
  waveoffAmount: 0,
  paymentType: 'Cash',
};

const getLocalDateTimeString = (date = new Date()) => {
  const tzoffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - tzoffset).toISOString().slice(0, 16);
};

// ── Component ──────────────────────────────────────────────────────────────────
const UnifiedOrder = () => {
  const history = useHistory();
  const location = useLocation();
  const { socket } = useSocket();

  const backPath = location.pathname.includes('qsr-pos') ? '/dashboard/qsr' : '/dashboard/manager';

  const urlParams = new URLSearchParams(location.search);
  const orderId = urlParams.get('orderId');
  const tableId = urlParams.get('tableId');
  const mode = urlParams.get('mode'); // 'new' | 'edit'

  const { activePlans, kotUserExists } = useContext(AuthContext);
  const canKOT = activePlans ? activePlans.includes('KOT Panel') && kotUserExists : false;

  // Default type from URL path
  const defaultType = location.pathname.includes('dine-in') ? 'Dine In' : location.pathname.includes('delivery') ? 'Delivery' : 'Takeaway';

  // ── Order Type ────────────────────────────────────────────────────────────
  const [orderType, setOrderType] = useState(defaultType);
  const [orderDate, setOrderDate] = useState(getLocalDateTimeString());
  const isEditMode = mode === 'edit';

  const title = `${isEditMode ? 'Edit' : 'New'} ${orderType} Order`;
  const description = 'Manage orders';

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

  // ── Order Type Switch (new mode only) ─────────────────────────────────────
  const handleOrderTypeChange = (newType) => {
    if (isEditMode) return; // Locked in edit mode
    setOrderType(newType);
    setOrderItems([]);
    const freshCustomerInfo = { ...DEFAULT_CUSTOMER_INFO[newType] };
    setCustomerInfo({ name: '', phone: '', address: '', total_persons: '', waiter: '', table_no: tableInfo.table_no || '', comment: '', ...freshCustomerInfo });
    setPaymentData((prev) => ({ ...DEFAULT_PAYMENT_DATA, cgstPercent: prev.cgstPercent, sgstPercent: prev.sgstPercent, vatPercent: prev.vatPercent }));
    setIsDirty(false);
    // Reset dirty tracking baseline for new type
    initialStateRef.current = { orderItems: [], customerInfo: { ...freshCustomerInfo, table_no: tableInfo.table_no || '' } };
  };

  // ── Data Fetchers ─────────────────────────────────────────────────────────
  async function fetchTableInfo() {
    try {
      const token = localStorage.getItem('token');
      const response = await getTableById(tableId, token);
      setTableInfo(response.data.data);
      if (orderType === 'Dine In' && !isEditMode) {
        const tableNo = response.data.data.table_no;
        setCustomerInfo((prev) => ({ ...prev, table_no: tableNo }));
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

  async function fetchOrderDetails(targetId) {
    try {
      const activeId = targetId || orderId;
      if (!activeId) return;
      const token = localStorage.getItem('token');
      const res = await getOrderById(activeId, token);
      const order = res.data.data;
      const items = order.order_items || [];

      // Auto-detect order type from fetched order
      const detectedType = order.order_type || 'Takeaway'; // 'Dine In' | 'Takeaway' | 'Delivery'
      setOrderType(detectedType);

      // Build customerInfo based on detected type
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
        // Takeaway
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
      if (order.order_date) {
        setOrderDate(getLocalDateTimeString(new Date(order.order_date)));
      }
      initialStateRef.current = {
        orderItems: JSON.parse(JSON.stringify(items)),
        customerInfo: JSON.parse(JSON.stringify(custInfo)),
        paid_amount: order.paid_amount || 0,
      };
      setIsInitialized(true);
      kotSnapshotRef.current = JSON.parse(JSON.stringify(items));
      // Load KOT and Payment history from localStorage
      try {
        const savedKot = localStorage.getItem(`kot_history_${activeId}`);
        if (savedKot) setKotHistory(JSON.parse(savedKot));
        const savedPayment = localStorage.getItem(`payment_history_${activeId}`);
        if (savedPayment) setPaymentHistory(JSON.parse(savedPayment));
      } catch (e) {
        console.error(e);
      }

      // Check if we need to auto-print after full reload
      const searchParams = new URLSearchParams(window.location.search);
      if (searchParams.get('print') === 'true') {
        const newUrl = window.location.pathname + window.location.search.replace(/[&?]print=true/, '');
        window.history.replaceState({}, '', newUrl);
        openPrintWindow(activeId, setPrinting);
      } else if (searchParams.get('printKOT') === 'true') {
        const newUrl = window.location.pathname + window.location.search.replace(/[&?]printKOT=true/, '');
        window.history.replaceState({}, '', newUrl);
        const savedKotStr = localStorage.getItem(`kot_history_${activeId}`);
        if (savedKotStr) {
          const savedKotList = JSON.parse(savedKotStr);
          const latestRecord = savedKotList[savedKotList.length - 1];
          if (latestRecord) {
            printKOTSlip(
              {
                orderNo: order.order_no || '',
                orderType: detectedType,
                tokenNumber: order.token || null,
                tableNo: custInfo.table_no || '',
                items: latestRecord.items,
                kotNo: latestRecord.kotNo,
                timestamp: latestRecord.timestamp,
              },
              userData,
              setKotPrinting
            );
          }
        }
      }
    } catch (err) {
      console.error('Error fetching order details:', err);
    }
  }

  // ── Hooks ─────────────────────────────────────────────────────────────────
  const { categories, filteredMenuData, searchText, setSearchText, selectedCategory, setSelectedCategory, showSpecial, setShowSpecial } = useMenuFetcher();

  const { addItemToOrder, updateItemQuantity, removeItem } = useOrderCart({ setOrderItems, socket, orderId, fetchOrderDetails });

  const { handleDiscountTypeChange, handleDiscountValueChange, handlePaidAmountChange } = useOrderCalculations({
    orderItems,
    taxRates,
    paymentData,
    setPaymentData,
  });

  // ── Parcel Charge helper ───────────────────────────────────────────────────
  const addParcelCharge = (charge) => {
    addItemToOrder({
      dish_name: `${charge.name} ${charge.size}`,
      dish_price: charge.price,
      special_notes: 'Parcel Charge',
      status: 'Container Charge',
      quantity: 1,
    });
  };

  // ── Dirty Check ───────────────────────────────────────────────────────────
  const hasUnsavedChanges = () => {
    const initial = initialStateRef.current;
    const currentEditable = orderItems
      .filter((i) => i.status !== 'Completed')
      .map((i) => ({
        dish_name: i.dish_name,
        quantity: i.quantity,
        special_notes: i.special_notes || '',
        dish_price: i.dish_price,
        status: i.status || 'Pending',
        selected_variant: i.selected_variant ? { name: i.selected_variant.name, price: i.selected_variant.price } : null,
        selected_addons: (i.selected_addons || []).map((a) => ({ name: a.name, price: a.price })),
      }));
    const initialEditable = initial.orderItems
      .filter((i) => i.status !== 'Completed')
      .map((i) => ({
        dish_name: i.dish_name,
        quantity: i.quantity,
        special_notes: i.special_notes || '',
        dish_price: i.dish_price,
        status: i.status || 'Pending',
        selected_variant: i.selected_variant ? { name: i.selected_variant.name, price: i.selected_variant.price } : null,
        selected_addons: (i.selected_addons || []).map((a) => ({ name: a.name, price: a.price })),
      }));

    const currentCust = {
      name: customerInfo.name || '',
      phone: customerInfo.phone || '',
      address: customerInfo.address || '',
      total_persons: customerInfo.total_persons || '',
      waiter: customerInfo.waiter || '',
      table_no: customerInfo.table_no || '',
      comment: customerInfo.comment || '',
    };
    const initialCust = {
      name: initial.customerInfo.name || '',
      phone: initial.customerInfo.phone || '',
      address: initial.customerInfo.address || '',
      total_persons: initial.customerInfo.total_persons || '',
      waiter: initial.customerInfo.waiter || '',
      table_no: initial.customerInfo.table_no || '',
      comment: initial.customerInfo.comment || '',
    };

    return JSON.stringify(currentEditable) !== JSON.stringify(initialEditable) || JSON.stringify(currentCust) !== JSON.stringify(initialCust);
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
      // New order — start dirty tracking immediately
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

  // ── Navigation Guard ──────────────────────────────────────────────────────
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

  // ── KOT Delta ─────────────────────────────────────────────────────────────
  const computeKOTDelta = (currentItems, snapshotItems) => {
    const delta = [];
    for (const item of currentItems) {
      if (!['Completed', 'Cancelled', 'Container Charge'].includes(item.status)) {
        // If the item has a 'Pending' status, it has never been printed or sent to the kitchen
        if (item.status === 'Pending') {
          delta.push({ ...item });
        } else {
          const prev = snapshotItems.find((s) => s.dish_name === item.dish_name && s.special_notes === item.special_notes);

          if (!prev) {
            delta.push({ ...item });
          } else if (item.quantity > prev.quantity) {
            delta.push({ ...item, quantity: item.quantity - prev.quantity });
          }
        }
      }
    }
    return delta;
  };

  // ── Validation ────────────────────────────────────────────────────────────
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

  // ── Payload Builder ───────────────────────────────────────────────────────
  const buildPayload = (status, completeAll = false) => {
    const orderData = {
      order_type: orderType,
      order_date: orderDate ? new Date(orderDate) : new Date(),
      order_items: orderItems.map((item) => {
        let itemStatus = item.status || 'Pending';
        if (completeAll) {
          itemStatus = canKOT ? 'Preparing' : 'Completed';
        } else if (status === 'Paid') {
          if (canKOT) {
            if (itemStatus === 'Pending') {
              itemStatus = 'Preparing';
            }
          } else if (itemStatus !== 'Cancelled') {
            itemStatus = 'Completed';
          }
        } else if (status === 'KOT') {
          if (itemStatus === 'Pending') {
            itemStatus = canKOT ? 'Preparing' : 'Completed';
          }
        } else if (status === 'Save') {
          itemStatus = itemStatus || 'Pending';
        }

        return {
          dish_name: item.dish_name,
          quantity: item.quantity,
          dish_price: item.dish_price,
          special_notes: item.special_notes || '',
          status: itemStatus,
          selected_variant: item.selected_variant,
          selected_addons: item.selected_addons,
        };
      }),
      order_status: status,
      customer_name: customerInfo.name,
      customer_phone: customerInfo.phone || '',
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

    // DineIn-specific fields
    if (orderType === 'Dine In') {
      orderData.total_persons = customerInfo.total_persons;
      orderData.waiter = customerInfo.waiter;
      orderData.table_no = customerInfo.table_no || tableInfo.table_no;
      if (tableInfo.area) orderData.table_area = tableInfo.area;
    }

    const custPayload = { name: customerInfo.name };
    if (customerInfo.phone) custPayload.phone = customerInfo.phone;
    if (orderType === 'Delivery') custPayload.address = customerInfo.address;

    return {
      orderInfo: { ...orderData, order_id: orderId },
      customerInfo: custPayload,
      tableId: orderType === 'Dine In' ? tableId : undefined,
    };
  };

  // ── Print ─────────────────────────────────────────────────────────────────
  const handlePrint = async (order_id) => {
    const activeId = order_id || orderId;
    if (!activeId || isDirty) {
      if (!validateOrder()) return;
      setPrinting(true);
      try {
        const status = orderStatus || 'Save';
        const payload = buildPayload(status);
        const token = localStorage.getItem('token');
        const response = await API_MAP[orderType](payload, token);
        if (response.data.status === 'success') {
          const savedId = response.data.orderId || response.data.order?._id;

          allowNavigationRef.current = true;
          setIsDirty(false);
          setOrderStatus(status);

          if (savedId) {
            // Close any open sheets/modals so they don't block the screen
            setShowPaymentModal(false);
            setShowCartSheet(false);

            if (!orderId) {
              allowNavigationRef.current = true;
              if (orderType === 'Dine In' && tableId) {
                window.location.href = `/order/dine-in?tableId=${tableId}&orderId=${savedId}&mode=edit&print=true`;
              } else {
                window.location.href = `/order/qsr-pos?orderId=${savedId}&mode=edit&print=true`;
              }
            } else {
              await fetchOrderDetails(savedId);
              openPrintWindow(savedId, setPrinting);
            }
          }
        }
      } catch (err) {
        console.error('Error saving order before print:', err);
        alert('Error saving order. Please try again.');
        setPrinting(false);
      }
    } else {
      openPrintWindow(activeId, setPrinting);
    }
  };

  // ── KOT & Print ───────────────────────────────────────────────────────────
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

        toast.success(`KOT #${kotNo} sent to kitchen!`);

        // For new orders, update URL so subsequent saves work correctly
        if (!orderId && savedId) {
          allowNavigationRef.current = true;
          if (orderType === 'Dine In' && tableId) {
            window.location.href = `/order/dine-in?tableId=${tableId}&orderId=${savedId}&mode=edit&printKOT=true`;
          } else {
            window.location.href = `/order/qsr-pos?orderId=${savedId}&mode=edit&printKOT=true`;
          }
        } else {
          printKOTSlip(
            { orderNo, orderType, tokenNumber, tableNo: customerInfo.table_no || tableInfo.table_no, items: delta, kotNo, timestamp },
            userData,
            setKotPrinting
          );
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

  // ── Save / Cancel / Pay ───────────────────────────────────────────────────
  const handleSaveOrder = async (status = 'Save') => {
    if (!validateOrder()) return false;
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
          // Update payment history
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
          history.push(backPath);
        } else {
          fetchOrderDetails();
          toast.success('Order saved and marked as Paid!');
          history.push(backPath);
        }
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error saving order:', err);
      alert('Error saving order. Please try again.');
      return false;
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
        orderInfo: {
          order_id: orderId,
          order_status: 'Cancelled',
          order_items: orderItems.map((item) => ({ ...item, status: 'Cancelled' })),
        },
        tableId: orderType === 'Dine In' ? tableId : undefined,
      };
      const token = localStorage.getItem('token');
      const response = await API_MAP[orderType](payload, token);
      if (response.data.status === 'success') {
        allowNavigationRef.current = true;
        setIsDirty(false);
        setShowCancelModal(false);
        history.push(backPath);
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
    const alreadyPaid = parseFloat(initialStateRef.current.paid_amount) || 0;
    const dueAmount = Math.max(0, totalAmount - alreadyPaid);

    setPaymentData((prev) => ({
      ...prev,
      paidAmount: totalAmount, // This is the total cumulative amount
      waveoffAmount: 0,
    }));
    setShowPaymentModal(true);
  };

  // ── Derived display helpers ───────────────────────────────────────────────
  const showParcelUI = orderType !== 'Dine In';
  const visibleFields = VISIBLE_FIELDS[orderType];
  const requiredFields = REQUIRED_FIELDS[orderType];

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <HtmlHead title={title} description={description} />

      {/* POS Wrapper */}
      <div className="pos-wrapper">
        {/* Top Bar */}
        <div className="pos-topbar d-flex align-items-center justify-content-between flex-nowrap gap-2">
          <div className="d-flex align-items-center gap-2 overflow-hidden flex-grow-1 order-1 order-md-2">
            <div className="pos-title text-truncate">
              {title}
              {orderType === 'Dine In' && (tableInfo.table_no || customerInfo.table_no) && (
                <span className="ms-2 fw-normal text-muted" style={{ fontSize: '14px' }}>
                  — Table {tableInfo.table_no || customerInfo.table_no}
                </span>
              )}
            </div>
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
          </div>
          <Button
            className="custom-btn-outline order-2 order-md-1 pos-back-btn"
            style={{ padding: '0.35rem 1rem', flexShrink: 0 }}
            onClick={() => handleNavigation(backPath)}
          >
            <CsLineIcons icon="arrow-left" size="13" className="me-md-1" />
            <span className="d-none d-md-inline">Back</span>
          </Button>
          <Form.Select
            size="sm"
            className="d-none d-md-inline-block order-md-3"
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
          <div className="d-none d-md-flex align-items-center gap-1 order-md-4" style={{ flexShrink: 0 }}>
            <span className="text-muted small fw-semibold">Date:</span>
            <Form.Control
              type="datetime-local"
              size="sm"
              value={orderDate}
              onChange={(e) => setOrderDate(e.target.value)}
              style={{
                borderRadius: '50px',
                borderColor: 'rgba(35,179,244,0.35)',
                color: '#23b3f4',
                fontWeight: 700,
                fontSize: '12px',
                padding: '0.15rem 0.5rem',
                maxWidth: '185px',
              }}
            />
          </div>
        </div>

        {/* POS Body */}
        <div className="pos-body">
          {/* Menu Panel */}
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

          {/* Order Panel */}
          <div className="pos-order-panel d-none d-xl-flex">
            <div className="pos-order-header">
              <div className="d-flex justify-content-between align-items-center">
                <div className="fw-bold" style={{ color: '#23b3f4', fontSize: '13px' }}>
                  {orderType === 'Dine In' && (tableInfo.table_no || customerInfo.table_no) ? `T-${tableInfo.table_no || customerInfo.table_no}` : 'Order'} (
                  {orderItems.length})
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
              {/* Special Instructions - Moved here to save space for cart */}
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
                orderType={orderType}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
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
        handlePrint={handlePrint}
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
        canKOT={canKOT}
      />
      <CancelOrderModal showCancelModal={showCancelModal} setShowCancelModal={setShowCancelModal} handleCancelOrder={handleCancelOrder} isLoading={isLoading} />

      {/* Mobile Bottom Sheet */}
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
        orderType={orderType}
      >
        <h6 className="mb-2 fw-bold text-muted border-bottom pb-2">Customer Details</h6>

        {/* Row 1: Order Type + Order Date */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
          <div style={{ flex: 1 }}>
            <label
              style={{
                fontSize: '10px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                color: '#94a3b8',
                marginBottom: '3px',
                display: 'block',
              }}
            >
              Order Type
            </label>
            <Form.Select
              size="sm"
              value={orderType}
              onChange={(e) => handleOrderTypeChange(e.target.value)}
              disabled={isEditMode || !!tableId}
              style={{
                width: '100%',
                height: '30px',
                padding: '0 8px',
                fontSize: '12px',
                fontWeight: 600,
                color: '#1e293b',
                border: '1.5px solid rgba(226,232,240,0.9)',
                borderRadius: '6px',
                outline: 'none',
                background: '#f8fafc',
                transition: 'all 0.18s',
                boxSizing: 'border-box',
              }}
            >
              {ORDER_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Form.Select>
          </div>
          <div style={{ flex: 1.5 }} className="d-md-none">
            <label
              style={{
                fontSize: '10px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                color: '#94a3b8',
                marginBottom: '3px',
                display: 'block',
              }}
            >
              Order Date
            </label>
            <Form.Control
              type="datetime-local"
              size="sm"
              value={orderDate}
              onChange={(e) => setOrderDate(e.target.value)}
              style={{
                width: '100%',
                height: '30px',
                padding: '0 8px',
                fontSize: '12px',
                fontWeight: 600,
                color: '#1e293b',
                border: '1.5px solid rgba(226,232,240,0.9)',
                borderRadius: '6px',
                outline: 'none',
                background: '#f8fafc',
                transition: 'all 0.18s',
                boxSizing: 'border-box',
              }}
            />
          </div>
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
        <div style={{ marginTop: '8px', marginBottom: '8px' }}>
          <label
            style={{
              fontSize: '10px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              color: '#94a3b8',
              marginBottom: '3px',
              display: 'block',
            }}
          >
            Special Instructions
          </label>
          <Form.Control
            as="textarea"
            rows={2}
            value={customerInfo.comment}
            onChange={(e) => setCustomerInfo((prev) => ({ ...prev, comment: e.target.value }))}
            placeholder="Any special instructions..."
            style={{
              width: '100%',
              padding: '6px 8px',
              fontSize: '12px',
              fontWeight: 600,
              color: '#1e293b',
              border: '1.5px solid rgba(226,232,240,0.9)',
              borderRadius: '6px',
              outline: 'none',
              background: '#f8fafc',
              transition: 'all 0.18s',
              boxSizing: 'border-box',
            }}
          />
        </div>
      </BottomCartSheet>
      <MobileCartBar orderItems={orderItems} paymentData={paymentData} setShowCartSheet={setShowCartSheet} />
    </>
  );
};

export default UnifiedOrder;
