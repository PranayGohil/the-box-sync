import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { ExtraChargesSection, computeExtraCharges } from '../../components/ExtraChargesSection';
import { ShippingAddressSection } from '../../components/ShippingAddressSection';

export const InvoiceCreate = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const { activeBusiness } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const salesOrderId = searchParams.get('salesOrderId') || searchParams.get('orderId');
  const quotationId = searchParams.get('quotationId');
  const challanId = searchParams.get('challanId');

  const [sourceDocInfo, setSourceDocInfo] = useState(null);
  const [sourceLoading, setSourceLoading] = useState(Boolean(salesOrderId || quotationId || challanId));

  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [currency, setCurrency] = useState(activeBusiness?.currency || 'INR');
  const [currencySymbol, setCurrencySymbol] = useState(activeBusiness?.currencySymbol || (activeBusiness?.currency === 'USD' ? '$' : '₹'));
  const [isWithoutGst, setIsWithoutGst] = useState(false);
  const [isTaxInclusive, setIsTaxInclusive] = useState(false);
  const [paidAmount, setPaidAmount] = useState(0);
  const [paymentMode, setPaymentMode] = useState('cash');
  const [notes, setNotes] = useState('');
  const [terms, setTerms] = useState(activeBusiness?.settings?.termsAndConditions || '');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEdit);

  const [shippingAddress, setShippingAddress] = useState({
    street: '',
    city: '',
    state: '',
    stateCode: '',
    pincode: '',
    country: 'India'
  });
  const [sameAsBilling, setSameAsBilling] = useState(true);

  const [items, setItems] = useState([
    { productId: '', name: '', hsnSacCode: '', quantity: 1, rate: 0, taxRate: 18, unit: 'PCS', discountPercent: 0, total: 0 }
  ]);

  const [extraCharges, setExtraCharges] = useState([]);

  useEffect(() => {
    fetchFormData();
    if (isEdit) {
      fetchInvoiceDetails(id);
    }
  }, [id, isEdit]);

  useEffect(() => {
    if (!isEdit) {
      if (salesOrderId) {
        fetchSalesOrder(salesOrderId);
      } else if (quotationId) {
        fetchQuotation(quotationId);
      } else if (challanId) {
        fetchDeliveryChallan(challanId);
      }
    }
  }, [salesOrderId, quotationId, challanId, isEdit]);

  const fetchInvoiceDetails = async (invId) => {
    try {
      setInitialLoading(true);
      const res = await api.get(`/sales/invoices/${invId}`);
      if (res.data.success) {
        const inv = res.data.data?.invoice || res.data.data;
        const custId = inv.customerId?._id || inv.customerId;
        setSelectedCustomerId(custId || '');
        setSelectedCustomer(inv.customerId || null);

        if (inv.currency) {
          setCurrency(inv.currency);
          setCurrencySymbol(inv.currencySymbol || (inv.currency === 'USD' ? '$' : '₹'));
        }
        setIsWithoutGst(Boolean(inv.isWithoutGst));
        if (inv.invoiceDate) setInvoiceDate(new Date(inv.invoiceDate).toISOString().split('T')[0]);
        if (inv.dueDate) setDueDate(new Date(inv.dueDate).toISOString().split('T')[0]);
        setIsTaxInclusive(Boolean(inv.isTaxInclusive));
        setPaidAmount(inv.paidAmount || 0);
        setPaymentMode(inv.paymentMode || 'cash');
        setTerms(inv.terms || '');
        setNotes(inv.notes || '');

        if (inv.shippingAddressSnapshot) {
          setShippingAddress({
            street: inv.shippingAddressSnapshot.street || '',
            city: inv.shippingAddressSnapshot.city || '',
            state: inv.shippingAddressSnapshot.state || '',
            stateCode: inv.shippingAddressSnapshot.stateCode || '',
            pincode: inv.shippingAddressSnapshot.pincode || '',
            country: inv.shippingAddressSnapshot.country || 'India'
          });
          const b = inv.billingAddressSnapshot || inv.customerId?.billingAddress;
          const s = inv.shippingAddressSnapshot;
          if (b && s && b.street === s.street && b.city === s.city && b.state === s.state) {
            setSameAsBilling(true);
          } else {
            setSameAsBilling(false);
          }
        }

        if (inv.items && inv.items.length > 0) {
          setItems(
            inv.items.map((item) => ({
              productId: item.productId?._id || item.productId || '',
              name: item.name || '',
              hsnSacCode: item.hsnSacCode || '',
              quantity: item.quantity || 1,
              rate: item.rate || 0,
              taxRate: item.taxRate || 18,
              unit: item.unit || 'PCS',
              discountPercent: item.discountPercent || 0,
              total: item.total || 0
            }))
          );
        }

        if (inv.extraCharges && inv.extraCharges.length > 0) {
          setExtraCharges(
            inv.extraCharges.map((ch) => ({
              name: ch.name || '',
              rate: ch.rate || 0,
              type: ch.type || 'amount',
              isDeduction: Boolean(ch.isDeduction)
            }))
          );
        }
      }
    } catch (err) {
      console.error(err);
      addToast(err.response?.data?.message || 'Failed to load invoice details', 'error');
      navigate('/sales/invoices');
    } finally {
      setInitialLoading(false);
    }
  };

  const fetchFormData = async () => {
    try {
      const [custRes, prodRes] = await Promise.all([
        api.get('/customers?limit=200'),
        api.get('/products?limit=200')
      ]);
      if (custRes.data.success) setCustomers(custRes.data.data);
      if (prodRes.data.success) setProducts(prodRes.data.data);
    } catch (err) {
      console.error(err);
      addToast('Failed to load customers and products', 'error');
    }
  };

  const fetchSalesOrder = async (orderId) => {
    try {
      setSourceLoading(true);
      const res = await api.get(`/sales/orders/${orderId}`);
      if (res.data.success) {
        const so = res.data.data;
        setSourceDocInfo({ type: 'sales_order', id: so._id, number: so.orderNo });
        const custId = so.customerId?._id || so.customerId;
        setSelectedCustomerId(custId || '');
        setSelectedCustomer(so.customerId || null);

        if (so.customerId?.creditDays) {
          const d = new Date();
          d.setDate(d.getDate() + so.customerId.creditDays);
          setDueDate(d.toISOString().split('T')[0]);
        }

        if (so.currency) {
          setCurrency(so.currency);
          setCurrencySymbol(so.currencySymbol || (so.currency === 'USD' ? '$' : '₹'));
        }
        if (so.isWithoutGst !== undefined) {
          setIsWithoutGst(Boolean(so.isWithoutGst));
        }

        setIsTaxInclusive(Boolean(so.isTaxInclusive));
        if (so.terms) setTerms(so.terms);
        setNotes(so.notes ? `Order Ref: #${so.orderNo} - ${so.notes}` : `Order Ref: #${so.orderNo}`);

        if (so.shippingAddressSnapshot) {
          setShippingAddress({
            street: so.shippingAddressSnapshot.street || '',
            city: so.shippingAddressSnapshot.city || '',
            state: so.shippingAddressSnapshot.state || '',
            stateCode: so.shippingAddressSnapshot.stateCode || '',
            pincode: so.shippingAddressSnapshot.pincode || '',
            country: so.shippingAddressSnapshot.country || 'India'
          });
          const b = so.billingAddressSnapshot || so.customerId?.billingAddress;
          const s = so.shippingAddressSnapshot;
          if (b && s && b.street === s.street && b.city === s.city && b.state === s.state) {
            setSameAsBilling(true);
          } else {
            setSameAsBilling(false);
          }
        }

        if (so.items && so.items.length > 0) {
          setItems(
            so.items.map((item) => ({
              productId: item.productId?._id || item.productId || '',
              name: item.name || '',
              hsnSacCode: item.hsnSacCode || '',
              quantity: item.quantity || 1,
              rate: item.rate || 0,
              taxRate: item.taxRate || 18,
              unit: item.unit || 'PCS',
              discountPercent: item.discountPercent || 0,
              total: item.total || 0
            }))
          );
        }

        if (so.extraCharges && so.extraCharges.length > 0) {
          setExtraCharges(
            so.extraCharges.map((ch) => ({
              name: ch.name || '',
              rate: ch.rate || 0,
              type: ch.type || 'amount',
              isDeduction: Boolean(ch.isDeduction)
            }))
          );
        }

        addToast(`Loaded line items and details from Sales Order #${so.orderNo}`, 'success');
      }
    } catch (err) {
      console.error(err);
      addToast('Failed to load Sales Order data', 'error');
    } finally {
      setSourceLoading(false);
    }
  };

  const fetchQuotation = async (quoteId) => {
    try {
      setSourceLoading(true);
      const res = await api.get(`/sales/quotations/${quoteId}`);
      if (res.data.success) {
        const q = res.data.data;
        setSourceDocInfo({ type: 'quotation', id: q._id, number: q.quotationNo });
        const custId = q.customerId?._id || q.customerId;
        setSelectedCustomerId(custId || '');
        setSelectedCustomer(q.customerId || null);

        if (q.customerId?.creditDays) {
          const d = new Date();
          d.setDate(d.getDate() + q.customerId.creditDays);
          setDueDate(d.toISOString().split('T')[0]);
        }

        if (q.currency) {
          setCurrency(q.currency);
          setCurrencySymbol(q.currencySymbol || (q.currency === 'USD' ? '$' : '₹'));
        }
        if (q.isWithoutGst !== undefined) {
          setIsWithoutGst(Boolean(q.isWithoutGst));
        }

        setIsTaxInclusive(Boolean(q.isTaxInclusive));
        if (q.terms) setTerms(q.terms);
        setNotes(q.notes ? `Quotation Ref: #${q.quotationNo} - ${q.notes}` : `Quotation Ref: #${q.quotationNo}`);

        if (q.items && q.items.length > 0) {
          setItems(
            q.items.map((item) => ({
              productId: item.productId?._id || item.productId || '',
              name: item.name || '',
              hsnSacCode: item.hsnSacCode || '',
              quantity: item.quantity || 1,
              rate: item.rate || 0,
              taxRate: item.taxRate || 18,
              unit: item.unit || 'PCS',
              discountPercent: item.discountPercent || 0,
              total: item.total || 0
            }))
          );
        }

        if (q.extraCharges && q.extraCharges.length > 0) {
          setExtraCharges(
            q.extraCharges.map((ch) => ({
              name: ch.name || '',
              rate: ch.rate || 0,
              type: ch.type || 'amount',
              isDeduction: Boolean(ch.isDeduction)
            }))
          );
        }

        addToast(`Loaded line items and details from Quotation #${q.quotationNo}`, 'success');
      }
    } catch (err) {
      console.error(err);
      addToast('Failed to load Quotation data', 'error');
    } finally {
      setSourceLoading(false);
    }
  };

  const fetchDeliveryChallan = async (cId) => {
    try {
      setSourceLoading(true);
      const res = await api.get(`/sales/challans/${cId}`);
      if (res.data.success) {
        const dc = res.data.data;
        setSourceDocInfo({ type: 'delivery_challan', id: dc._id, number: dc.challanNo });
        const custId = dc.customerId?._id || dc.customerId;
        setSelectedCustomerId(custId || '');
        setSelectedCustomer(dc.customerId || null);

        setNotes(dc.notes ? `Challan Ref: #${dc.challanNo} - ${dc.notes}` : `Challan Ref: #${dc.challanNo}`);

        if (dc.items && dc.items.length > 0) {
          setItems(
            dc.items.map((item) => ({
              productId: item.productId?._id || item.productId || '',
              name: item.name || '',
              hsnSacCode: item.hsnSacCode || '',
              quantity: item.quantity || 1,
              rate: item.rate || 0,
              taxRate: item.taxRate || 18,
              unit: item.unit || 'PCS',
              discountPercent: item.discountPercent || 0,
              total: item.total || 0
            }))
          );
        }

        addToast(`Loaded items from Delivery Challan #${dc.challanNo}`, 'success');
      }
    } catch (err) {
      console.error(err);
      addToast('Failed to load Delivery Challan data', 'error');
    } finally {
      setSourceLoading(false);
    }
  };

  const handleCustomerChange = (e) => {
    const custId = e.target.value;
    setSelectedCustomerId(custId);
    const found = customers.find((c) => c._id === custId);
    setSelectedCustomer(found || null);

    if (found?.creditDays) {
      const d = new Date();
      d.setDate(d.getDate() + found.creditDays);
      setDueDate(d.toISOString().split('T')[0]);
    }

    if (found?.shippingAddress && (found.shippingAddress.street || found.shippingAddress.city)) {
      setShippingAddress({
        street: found.shippingAddress.street || '',
        city: found.shippingAddress.city || '',
        state: found.shippingAddress.state || found.billingAddress?.state || '',
        stateCode: found.shippingAddress.stateCode || found.billingAddress?.stateCode || '',
        pincode: found.shippingAddress.pincode || '',
        country: found.shippingAddress.country || 'India'
      });
      setSameAsBilling(false);
    } else if (found?.billingAddress) {
      setShippingAddress({
        street: found.billingAddress.street || '',
        city: found.billingAddress.city || '',
        state: found.billingAddress.state || '',
        stateCode: found.billingAddress.stateCode || '',
        pincode: found.billingAddress.pincode || '',
        country: found.billingAddress.country || 'India'
      });
      setSameAsBilling(true);
    }
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...items];
    const current = { ...updated[index], [field]: value };

    if (field === 'productId') {
      const prod = products.find((p) => p._id === value);
      if (prod) {
        current.name = prod.name;
        current.hsnSacCode = prod.hsnSacCode || '';
        current.rate = prod.sellingPrice || 0;
        current.taxRate = prod.taxRate || 18;
        current.unit = prod.unitId?.symbol || 'PCS';
      }
    }

    const qty = Number(current.quantity) || 0;
    const rate = Number(current.rate) || 0;
    const disc = Number(current.discountPercent) || 0;
    const baseAmt = qty * rate;
    const discountAmt = (baseAmt * disc) / 100;
    current.total = baseAmt - discountAmt;

    updated[index] = current;
    setItems(updated);
  };

  const addItemRow = () => {
    setItems([
      ...items,
      { productId: '', name: '', hsnSacCode: '', quantity: 1, rate: 0, taxRate: 18, unit: 'PCS', discountPercent: 0, total: 0 }
    ]);
  };

  const removeItemRow = (index) => {
    if (items.length === 1) return;
    setItems(items.filter((_, idx) => idx !== index));
  };

  const addExtraCharge = () => {
    setExtraCharges([
      ...extraCharges,
      { name: '', rate: 0, type: 'amount', isDeduction: false }
    ]);
  };

  const removeExtraCharge = (index) => {
    setExtraCharges(extraCharges.filter((_, idx) => idx !== index));
  };

  const handleExtraChargeChange = (index, field, value) => {
    const updated = [...extraCharges];
    const current = { ...updated[index], [field]: value };
    if (field === 'name' && updated[index].isDeduction === undefined) {
      current.isDeduction = /tds|discount|less|deduct/i.test(value);
    }
    updated[index] = current;
    setExtraCharges(updated);
  };

  const sym = currencySymbol || (currency === 'USD' ? '$' : '₹');
  const locale = currency === 'USD' ? 'en-US' : 'en-IN';
  const fmt = (val) => Number(val || 0).toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const withoutGstFlag = Boolean(isWithoutGst);

  // Calculations
  const subtotal = items.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
  const totalTax = withoutGstFlag ? 0 : items.reduce((sum, item) => {
    const amt = Number(item.total) || 0;
    const rate = Number(item.taxRate) || 0;
    if (isTaxInclusive) {
      const taxable = amt / (1 + rate / 100);
      return sum + (amt - taxable);
    } else {
      return sum + (amt * rate) / 100;
    }
  }, 0);

  const baseAmount = isTaxInclusive || withoutGstFlag ? subtotal : subtotal + totalTax;

  const {
    calculatedExtraCharges,
    totalExtraAdditions,
    totalExtraDeductions,
    validExtraCharges
  } = computeExtraCharges(extraCharges, subtotal);

  // GST Determination & Breakdown
  const supplierStateCode = activeBusiness?.stateCode || '27';
  const placeOfSupplyStateCode = (sameAsBilling ? selectedCustomer?.billingAddress?.stateCode : shippingAddress?.stateCode) || selectedCustomer?.billingAddress?.stateCode || supplierStateCode;
  const isInterState = String(supplierStateCode).trim() !== String(placeOfSupplyStateCode).trim();
  const cgstAmount = withoutGstFlag ? 0 : (isInterState ? 0 : totalTax / 2);
  const sgstAmount = withoutGstFlag ? 0 : (isInterState ? 0 : totalTax / 2);
  const igstAmount = withoutGstFlag ? 0 : (isInterState ? totalTax : 0);

  const rawGrandTotal = baseAmount + totalExtraAdditions - totalExtraDeductions;
  const grandTotal = Math.max(0, Math.round(rawGrandTotal));
  const roundOff = Number((grandTotal - rawGrandTotal).toFixed(2));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCustomerId) {
      addToast('Please select a customer', 'warning');
      return;
    }

    const validItems = items.filter((i) => i.name && i.quantity > 0 && i.rate >= 0);
    if (validItems.length === 0) {
      addToast('Please add at least one valid line item', 'warning');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        customerId: selectedCustomerId,
        invoiceDate,
        dueDate: dueDate || null,
        items: validItems,
        extraCharges: validExtraCharges,
        isTaxInclusive,
        isWithoutGst: withoutGstFlag,
        currency,
        currencySymbol: sym,
        paidAmount: Number(paidAmount) || 0,
        paymentMode,
        terms,
        notes,
        shippingAddress: sameAsBilling ? (selectedCustomer?.billingAddress || shippingAddress) : shippingAddress,
        sourceDocumentType: sourceDocInfo?.type || 'direct',
        sourceDocumentId: sourceDocInfo?.id || null
      };

      if (isEdit) {
        const res = await api.put(`/sales/invoices/${id}`, payload);
        if (res.data.success) {
          addToast('GST Invoice updated successfully!', 'success');
          navigate('/sales/invoices');
        }
      } else {
        const res = await api.post('/sales/invoices', payload);
        if (res.data.success) {
          addToast('GST Invoice created and finalized!', 'success');
          navigate('/sales/invoices');
        }
      }
    } catch (err) {
      console.error(err);
      addToast(err.response?.data?.message || `Failed to ${isEdit ? 'update' : 'create'} invoice`, 'error');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="card-zenith p-5 text-center my-4">
        <div className="spinner-border text-primary" role="status"></div>
        <div className="mt-2 text-muted small">Loading invoice details...</div>
      </div>
    );
  }

  return (
    <div className="card-zenith p-3 p-sm-4 mb-4">
      {/* 1. Page Header */}
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-2 mb-4 pb-2 border-bottom">
        <div>
          <h4 className="fw-bold mb-1">{isEdit ? 'Edit GST Tax Invoice' : 'Create GST Tax Invoice'}</h4>
          <p className="text-muted small mb-0">Direct B2B/B2C billing with inventory stock sync & double-entry posting</p>
        </div>
        <button type="button" className="btn btn-outline-secondary btn-sm align-self-stretch align-self-sm-auto text-nowrap" onClick={() => navigate('/sales/invoices')}>
          <i className="bi bi-arrow-left me-1"></i> Back to Invoices
        </button>
      </div>

      {sourceDocInfo && (
        <div className="alert alert-info py-2 px-3 d-flex align-items-center justify-content-between mb-4 border-info">
          <div className="d-flex align-items-center">
            <i className="bi bi-link-45deg fs-4 text-info me-2"></i>
            <div>
              <strong className="text-dark">
                Converting from {sourceDocInfo.type === 'sales_order' ? 'Sales Order' : sourceDocInfo.type === 'quotation' ? 'Quotation' : 'Delivery Challan'} #{sourceDocInfo.number}
              </strong>
              <div className="small text-muted">Customer, line items, rates, and extra charges have been automatically fetched.</div>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary"
            onClick={() => {
              setSourceDocInfo(null);
              navigate('/sales/invoices/new', { replace: true });
            }}
            title="Clear source link"
          >
            <i className="bi bi-x me-1"></i> Clear Link
          </button>
        </div>
      )}

      {sourceLoading && (
        <div className="alert alert-light py-2 px-3 d-flex align-items-center mb-3">
          <div className="spinner-border spinner-border-sm text-primary me-2" role="status"></div>
          <span className="small text-muted">Fetching document line items and details...</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Document Configuration Bar: Currency & Tax Application */}
        <div className="card p-3 mb-3 border bg-white rounded-3 shadow-sm">
          <div className="row g-2 align-items-center">
            <div className="col-12 col-sm-6 col-md-4">
              <label className="form-label small fw-bold mb-1 text-primary d-flex align-items-center gap-1">
                <i className="bi bi-currency-exchange"></i> Invoice Currency
              </label>
              <select
                className="form-select form-select-sm fw-bold border-primary"
                value={currency}
                onChange={(e) => {
                  const curr = e.target.value;
                  setCurrency(curr);
                  setCurrencySymbol(curr === 'USD' ? '$' : '₹');
                }}
              >
                <option value="INR">₹ INR - Indian Rupee (₹)</option>
                <option value="USD">$ USD - US Dollar ($)</option>
              </select>
            </div>

            <div className="col-12 col-sm-6 col-md-5">
              <label className="form-label small fw-bold mb-1 text-secondary d-flex align-items-center gap-1">
                <i className="bi bi-receipt-cutoff"></i> Tax Application (GST / Export / Non-GST)
              </label>
              <div className="btn-group w-100" role="group">
                <button
                  type="button"
                  className={`btn btn-sm ${!isWithoutGst ? 'btn-primary' : 'btn-outline-secondary'} fw-semibold`}
                  onClick={() => setIsWithoutGst(false)}
                >
                  <i className="bi bi-check2-circle me-1"></i> Apply GST
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${isWithoutGst ? 'btn-warning' : 'btn-outline-secondary'} fw-semibold`}
                  onClick={() => setIsWithoutGst(true)}
                >
                  <i className="bi bi-slash-circle me-1"></i> Without GST {currency === 'USD' ? '(Export / 0%)' : '(Non-GST)'}
                </button>
              </div>
            </div>

            <div className="col-12 col-md-3">
              <label className="form-label small fw-bold mb-1 d-none d-md-block text-secondary">Price Calculation</label>
              <button
                type="button"
                className={`btn btn-sm w-100 fw-bold d-flex align-items-center justify-content-center ${
                  isTaxInclusive ? 'btn-success' : 'btn-outline-secondary'
                }`}
                style={{ height: '31px' }}
                onClick={() => setIsTaxInclusive(!isTaxInclusive)}
                disabled={isWithoutGst}
                title={isWithoutGst ? 'Tax mode not applicable for 0% tax documents' : 'Toggle Tax Inclusive / Exclusive'}
              >
                {isWithoutGst ? '0% Tax Mode' : isTaxInclusive ? '✓ Tax Inclusive' : 'Tax Exclusive'}
              </button>
            </div>
          </div>
          {isWithoutGst && (
            <div className="mt-2 small text-warning-emphasis bg-warning-subtle p-2 rounded border border-warning-subtle d-flex align-items-center gap-2" style={{ fontSize: '0.78rem' }}>
              <i className="bi bi-info-circle-fill fs-6"></i>
              <span>
                <strong>Without GST Mode Active:</strong> All items on this invoice will be generated with <strong>0% Tax</strong> (ideal for exports, dollar transactions, SEZ, or non-taxable supplies).
              </span>
            </div>
          )}
        </div>

        {/* Customer & Invoice Date Info */}
        <div className="row g-2 g-sm-3 mb-3">
          <div className="col-12 col-lg-6">
            <label className="form-label small fw-bold mb-1">Select Customer*</label>
            <select
              className="form-select fw-bold"
              value={selectedCustomerId}
              onChange={handleCustomerChange}
              required
            >
              <option value="">-- Choose Customer --</option>
              {customers.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name} {c.gstin ? `[GSTIN: ${c.gstin}]` : ''} - {c.billingAddress?.city ? `${c.billingAddress.city}, ` : ''}{c.billingAddress?.state || 'Maharashtra'}
                </option>
              ))}
            </select>
            {selectedCustomer && (
              <div className="small text-muted mt-1 text-truncate" style={{ fontSize: '0.75rem' }}>
                Location: <strong>{selectedCustomer.billingAddress?.city ? `${selectedCustomer.billingAddress.city}, ` : ''}{selectedCustomer.billingAddress?.state}</strong> | Type: <strong>{selectedCustomer.customerType}</strong> | Bal: <strong>{sym}{selectedCustomer.currentBalance?.toFixed(2)}</strong>
              </div>
            )}
          </div>

          <div className="col-12 col-sm-6 col-lg-3">
            <label className="form-label small fw-bold mb-1">Invoice Date*</label>
            <input
              type="date"
              className="form-control form-control-sm"
              value={invoiceDate}
              onChange={(e) => setInvoiceDate(e.target.value)}
              required
            />
          </div>

          <div className="col-12 col-sm-6 col-lg-3">
            <label className="form-label small fw-bold mb-1">Due Date</label>
            <input
              type="date"
              className="form-control form-control-sm"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
        </div>

        {/* Shipping Address Section */}
        {selectedCustomer && (
          <ShippingAddressSection
            billingAddress={selectedCustomer.billingAddress}
            shippingAddress={shippingAddress}
            onChange={setShippingAddress}
            sameAsBilling={sameAsBilling}
            setSameAsBilling={setSameAsBilling}
          />
        )}

        {/* 2. Line Items Desktop Table (>= 768px) */}
        <div className="table-responsive mb-3 border rounded d-none d-md-block">
          <table className="table table-bordered align-middle mb-0">
            <thead className="bg-light">
              <tr style={{ fontSize: '0.8rem', textTransform: 'uppercase' }}>
                <th style={{ width: '35%' }}>Product / Item</th>
                <th style={{ width: '12%' }}>HSN/SAC</th>
                <th style={{ width: '10%' }}>Qty</th>
                <th style={{ width: '15%' }}>Rate ({sym})</th>
                <th style={{ width: '12%' }}>{withoutGstFlag ? 'Tax' : 'GST %'}</th>
                <th style={{ width: '13%' }}>Amount ({sym})</th>
                <th style={{ width: '3%' }}></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={idx}>
                  <td>
                    <select
                      className="form-select form-select-sm mb-1 fw-bold"
                      value={item.productId}
                      onChange={(e) => handleItemChange(idx, 'productId', e.target.value)}
                    >
                      <option value="">-- Select or type custom item --</option>
                      {products.map((p) => (
                        <option key={p._id} value={p._id}>
                          {p.name} (Stock: {p.currentStock} {p.unitId?.symbol || 'PCS'})
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="Item Description"
                      value={item.name}
                      onChange={(e) => handleItemChange(idx, 'name', e.target.value)}
                      required
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      className="form-control form-control-sm font-mono"
                      placeholder="HSN"
                      value={item.hsnSacCode}
                      onChange={(e) => handleItemChange(idx, 'hsnSacCode', e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      className="form-control form-control-sm font-mono text-center fw-bold"
                      value={item.quantity}
                      min="1"
                      onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                      required
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      step="0.01"
                      className="form-control form-control-sm font-mono text-end fw-bold"
                      value={item.rate}
                      onChange={(e) => handleItemChange(idx, 'rate', e.target.value)}
                      required
                    />
                  </td>
                  <td>
                    {withoutGstFlag ? (
                      <input
                        type="text"
                        className="form-control form-control-sm bg-light text-center font-mono text-muted"
                        value="0% (Non-GST)"
                        disabled
                        readOnly
                      />
                    ) : (
                      <select
                        className="form-select form-select-sm"
                        value={item.taxRate}
                        onChange={(e) => handleItemChange(idx, 'taxRate', Number(e.target.value))}
                      >
                        <option value="0">0%</option>
                        <option value="5">5%</option>
                        <option value="12">12%</option>
                        <option value="18">18%</option>
                        <option value="28">28%</option>
                      </select>
                    )}
                  </td>
                  <td className="text-end fw-bold font-mono">
                    {sym}{item.total?.toFixed(2)}
                  </td>
                  <td className="text-center">
                    <button
                      type="button"
                      className="btn btn-sm btn-link text-danger p-0"
                      onClick={() => removeItemRow(idx)}
                      disabled={items.length === 1}
                    >
                      <i className="bi bi-trash"></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 3. Mobile Line Items Card List (< 768px) */}
        <div className="d-md-none mb-3">
          {items.map((item, idx) => (
            <div key={idx} className="card p-3 mb-2 bg-light border rounded">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="badge bg-primary text-white font-mono">Item #{idx + 1}</span>
                <div className="d-flex align-items-center gap-2">
                  <span className="fw-bold font-mono text-dark fs-6">{sym}{Number(item.total || 0).toFixed(2)}</span>
                  {items.length > 1 && (
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-danger py-0 px-2"
                      onClick={() => removeItemRow(idx)}
                      title="Remove Item"
                    >
                      <i className="bi bi-trash"></i>
                    </button>
                  )}
                </div>
              </div>

              {/* Product Select / Name */}
              <div className="mb-2">
                <label className="form-label small mb-1 fw-semibold">Product / Description*</label>
                <select
                  className="form-select form-select-sm mb-1 fw-bold"
                  value={item.productId}
                  onChange={(e) => handleItemChange(idx, 'productId', e.target.value)}
                >
                  <option value="">-- Select or type custom item --</option>
                  {products.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name} (Stock: {p.currentStock} {p.unitId?.symbol || 'PCS'})
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  placeholder="Item Description"
                  value={item.name}
                  onChange={(e) => handleItemChange(idx, 'name', e.target.value)}
                  required
                />
              </div>

              {/* Qty, Rate, GST %, HSN in 2x2 grid */}
              <div className="row g-2">
                <div className="col-6">
                  <label className="form-label small mb-1">Quantity*</label>
                  <input
                    type="number"
                    className="form-control form-control-sm font-mono text-center fw-bold"
                    value={item.quantity}
                    min="1"
                    onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                    required
                  />
                </div>
                <div className="col-6">
                  <label className="form-label small mb-1">Rate (₹)*</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control form-control-sm font-mono text-end fw-bold"
                    value={item.rate}
                    onChange={(e) => handleItemChange(idx, 'rate', e.target.value)}
                    required
                  />
                </div>
                <div className="col-6">
                  <label className="form-label small mb-1">GST Rate</label>
                  <select
                    className="form-select form-select-sm"
                    value={item.taxRate}
                    onChange={(e) => handleItemChange(idx, 'taxRate', Number(e.target.value))}
                  >
                    <option value="0">0%</option>
                    <option value="5">5%</option>
                    <option value="12">12%</option>
                    <option value="18">18%</option>
                    <option value="28">28%</option>
                  </select>
                </div>
                <div className="col-6">
                  <label className="form-label small mb-1">HSN/SAC</label>
                  <input
                    type="text"
                    className="form-control form-control-sm font-mono"
                    placeholder="HSN"
                    value={item.hsnSacCode}
                    onChange={(e) => handleItemChange(idx, 'hsnSacCode', e.target.value)}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="d-flex flex-wrap gap-2 mb-4">
          <button type="button" className="btn btn-outline-primary btn-sm" onClick={addItemRow}>
            <i className="bi bi-plus-circle me-1"></i> Add Another Item
          </button>
          <button type="button" className="btn btn-outline-secondary btn-sm" onClick={addExtraCharge}>
            <i className="bi bi-plus-slash-minus me-1"></i> Add Extra Field / Charge (TDS, Courier, etc.)
          </button>
        </div>

        <ExtraChargesSection
          extraCharges={extraCharges}
          calculatedExtraCharges={calculatedExtraCharges}
          onAdd={addExtraCharge}
          onRemove={removeExtraCharge}
          onChange={handleExtraChargeChange}
        />

        {/* Bottom Section: Notes, Payment & Summary Breakdown */}
        <div className="row g-4">
          <div className="col-12 col-md-6">
            <div className="mb-3">
              <label className="form-label">Terms & Conditions</label>
              <textarea
                className="form-control"
                rows="5"
                style={{ minHeight: '130px' }}
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
              ></textarea>
            </div>
            <div className="mb-3">
              <label className="form-label">Internal Notes / Transport Remarks</label>
              <textarea
                className="form-control"
                rows="2"
                placeholder="Optional delivery details, vehicle number, etc."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              ></textarea>
            </div>
            {/* Immediate Payment Option */}
            <div className="p-3 bg-light border rounded">
              <h6 className="fw-bold small mb-2">Record Immediate Payment Receipt (Optional)</h6>
              <div className="row g-2">
                <div className="col-6">
                  <label className="small text-muted">Paid Amount ({sym})</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control form-control-sm font-mono fw-bold"
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(e.target.value)}
                  />
                </div>
                <div className="col-6">
                  <label className="small text-muted">Payment Mode</label>
                  <select
                    className="form-select form-select-sm"
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value)}
                  >
                    <option value="cash">Cash</option>
                    <option value="upi">UPI</option>
                    <option value="bank">Bank Transfer</option>
                    <option value="card">Card</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Right Calculations Totals */}
          <div className="col-12 col-md-6">
            <div className="card p-3 bg-light border">
              <div className="d-flex justify-content-between py-1">
                <span className="text-muted">Taxable Subtotal:</span>
                <span className="fw-bold font-mono">{sym}{fmt(subtotal)}</span>
              </div>

              {/* GST Breakdown */}
              {withoutGstFlag ? (
                <div className="d-flex justify-content-between py-1">
                  <span className="text-muted d-flex align-items-center gap-1">
                    <span>Tax / GST:</span>
                    <span className="badge bg-secondary-subtle text-secondary" style={{ fontSize: '0.65rem' }}>Non-GST / Export (0%)</span>
                  </span>
                  <span className="fw-bold font-mono text-muted">{sym}0.00</span>
                </div>
              ) : isInterState ? (
                <div className="d-flex justify-content-between py-1">
                  <span className="text-muted d-flex align-items-center gap-1">
                    <span>IGST (Integrated Tax):</span>
                    <span className="badge bg-primary-subtle text-primary border border-primary-subtle" style={{ fontSize: '0.65rem' }}>Inter-State</span>
                  </span>
                  <span className="fw-bold font-mono text-primary">+{sym}{fmt(igstAmount)}</span>
                </div>
              ) : (
                <>
                  <div className="d-flex justify-content-between py-1">
                    <span className="text-muted d-flex align-items-center gap-1">
                      <span>CGST (Central Tax):</span>
                      <span className="badge bg-secondary-subtle text-secondary" style={{ fontSize: '0.65rem' }}>Intra-State</span>
                    </span>
                    <span className="fw-bold font-mono text-primary">+{sym}{fmt(cgstAmount)}</span>
                  </div>
                  <div className="d-flex justify-content-between py-1">
                    <span className="text-muted">SGST (State Tax):</span>
                    <span className="fw-bold font-mono text-primary">+{sym}{fmt(sgstAmount)}</span>
                  </div>
                </>
              )}

              {/* Extra Charges / Deductions List */}
              {calculatedExtraCharges.filter((c) => c.name?.trim()).map((c, i) => (
                <div key={i} className="d-flex justify-content-between py-1">
                  <span className="text-muted">{c.name} {c.type === 'percentage' ? `(${c.rate}%)` : ''}:</span>
                  <span className={`fw-bold font-mono ${c.isDeduction ? 'text-danger' : 'text-success'}`}>
                    {c.isDeduction ? '-' : '+'}{sym}{fmt(c.amount)}
                  </span>
                </div>
              ))}

              {roundOff !== 0 && (
                <div className="d-flex justify-content-between py-1">
                  <span className="text-muted">Round Off:</span>
                  <span className="font-mono">{roundOff > 0 ? `+${sym}${fmt(roundOff)}` : `-${sym}${fmt(Math.abs(roundOff))}`}</span>
                </div>
              )}
              <div className="d-flex justify-content-between py-2 border-top border-bottom my-2">
                <span className="fw-extrabold fs-5">GRAND TOTAL:</span>
                <span className="fw-extrabold fs-5 text-primary font-mono">{sym}{fmt(grandTotal)}</span>
              </div>
              {paidAmount > 0 && (
                <div className="d-flex justify-content-between py-1 text-danger fw-bold">
                  <span>Balance Due:</span>
                  <span className="font-mono">{sym}{fmt(Math.max(0, grandTotal - paidAmount))}</span>
                </div>
              )}

              <button
                type="submit"
                className="btn btn-primary-zenith py-2 mt-3 w-100 justify-content-center fw-bold fs-6"
                disabled={loading}
              >
                {loading
                  ? isEdit
                    ? 'Updating Invoice...'
                    : 'Creating & Finalizing Invoice...'
                  : isEdit
                  ? (withoutGstFlag ? 'Update Invoice' : 'Update GST Invoice')
                  : (withoutGstFlag ? 'Save & Finalize Invoice' : 'Save & Finalize GST Invoice')}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
