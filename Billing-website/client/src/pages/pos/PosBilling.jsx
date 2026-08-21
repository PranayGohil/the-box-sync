import React, { useState, useEffect, useRef } from 'react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { InvoiceModal } from '../../components/InvoiceModal';
import confetti from 'canvas-confetti';

export const PosBilling = () => {
  const { activeBusiness } = useAuth();
  const { addToast } = useToast();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [paymentMode, setPaymentMode] = useState('cash');
  const [isTaxInclusive, setIsTaxInclusive] = useState(false);
  const [cashTendered, setCashTendered] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  // Mobile Segmented Tab State ('catalog' or 'cart')
  const [activeMobileTab, setActiveMobileTab] = useState('catalog');

  // Invoice Modal state after checkout
  const [completedInvoice, setCompletedInvoice] = useState(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  const barcodeInputRef = useRef(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [prodRes, custRes, optRes] = await Promise.all([
        api.get('/products?limit=150'),
        api.get('/customers?limit=150'),
        api.get('/products/masters/options')
      ]);

      if (prodRes.data.success) setProducts(prodRes.data.data);
      if (custRes.data.success) setCustomers(custRes.data.data);
      if (optRes.data.success) setCategories(optRes.data.data.categories || []);
    } catch (err) {
      console.error('[POS Load Error]:', err);
      addToast('Failed to load catalog data', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Add Product to Cart or increment quantity if already present
  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.productId === product._id);
      if (existing) {
        return prev.map((item) =>
          item.productId === product._id
            ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.rate }
            : item
        );
      } else {
        const rate = product.sellingPrice || 0;
        return [
          ...prev,
          {
            productId: product._id,
            name: product.name,
            sku: product.sku,
            rate,
            quantity: 1,
            taxRate: product.taxRate || 18,
            hsnSacCode: product.hsnSacCode || '',
            unit: product.unitId?.symbol || 'PCS',
            discountPercent: 0,
            total: rate
          }
        ];
      }
    });
  };

  const updateQuantity = (index, newQty) => {
    if (newQty <= 0) {
      removeFromCart(index);
      return;
    }
    setCart((prev) =>
      prev.map((item, idx) =>
        idx === index ? { ...item, quantity: newQty, total: newQty * item.rate } : item
      )
    );
  };

  const removeFromCart = (index) => {
    setCart((prev) => prev.filter((_, idx) => idx !== index));
  };

  const clearCart = () => {
    setCart([]);
    setCashTendered('');
  };

  // Handle barcode scanning input
  const handleBarcodeScan = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const code = searchQuery.trim();
      if (!code) return;

      const found = products.find(
        (p) =>
          p.barcode === code ||
          p.sku?.toLowerCase() === code.toLowerCase() ||
          p.name?.toLowerCase() === code.toLowerCase()
      );

      if (found) {
        addToCart(found);
        setSearchQuery('');
        addToast(`Added: ${found.name}`, 'info', 1500);
      } else {
        addToast(`Barcode/SKU "${code}" not found`, 'warning');
      }
    }
  };

  // Calculations
  const totalCartUnits = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce((sum, item) => sum + item.quantity * item.rate, 0);

  const totalTax = cart.reduce((sum, item) => {
    const itemAmount = item.quantity * item.rate;
    if (isTaxInclusive) {
      const taxable = itemAmount / (1 + item.taxRate / 100);
      return sum + (itemAmount - taxable);
    } else {
      return sum + (itemAmount * item.taxRate) / 100;
    }
  }, 0);

  const rawGrandTotal = isTaxInclusive ? subtotal : subtotal + totalTax;
  const grandTotal = Math.round(rawGrandTotal);
  const roundOff = Number((grandTotal - rawGrandTotal).toFixed(2));

  const tenderedVal = Number(cashTendered) || 0;
  const changeDue = tenderedVal > grandTotal ? tenderedVal - grandTotal : 0;
  const isTenderSufficient = tenderedVal >= grandTotal;

  // Selected customer object
  const selectedCustomerObj = customers.find((c) => c._id === selectedCustomerId);

  // Format INR currency
  const fmtCurrency = (val) => {
    return Number(val || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Checkout Execution
  const handleCheckout = async () => {
    if (cart.length === 0) {
      addToast('Please add items to cart before checkout', 'warning');
      return;
    }

    setCheckoutLoading(true);
    try {
      const res = await api.post('/sales/invoices/pos-checkout', {
        customerId: selectedCustomerId || null,
        items: cart,
        isTaxInclusive,
        paymentMode,
        paidAmount: grandTotal,
        customerName: selectedCustomerObj?.name || 'Walk-in Customer'
      });

      if (res.data.success) {
        // Confetti celebration
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });

        addToast('Invoice generated & payment settled!', 'success');
        setCompletedInvoice(res.data.data);
        setShowInvoiceModal(true);
        clearCart();
        setActiveMobileTab('catalog');
      }
    } catch (err) {
      console.error('[Checkout Error]:', err);
      addToast(err.response?.data?.message || 'Checkout failed', 'error');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesCat =
      selectedCategory === 'all' ||
      p.categoryId?._id === selectedCategory ||
      p.categoryId === selectedCategory;
    const matchesSearch =
      !searchQuery ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.barcode?.includes(searchQuery) ||
      p.sku?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="pos-wrapper">
      {/* Mobile Segmented Navigation Tabs (<992px) */}
      <div className="d-lg-none bg-white p-2 border-bottom sticky-top shadow-sm" style={{ zIndex: 1025 }}>
        <div className="btn-group w-100 p-1 bg-light rounded-pill border">
          <button
            type="button"
            className={`btn btn-sm rounded-pill fw-bold ${
              activeMobileTab === 'catalog' ? 'btn-primary-zenith' : 'btn-link text-muted text-decoration-none'
            }`}
            onClick={() => setActiveMobileTab('catalog')}
          >
            <i className="bi bi-grid-fill me-1"></i> Catalog ({products.length})
          </button>
          <button
            type="button"
            className={`btn btn-sm rounded-pill fw-bold position-relative ${
              activeMobileTab === 'cart' ? 'btn-primary-zenith' : 'btn-link text-muted text-decoration-none'
            }`}
            onClick={() => setActiveMobileTab('cart')}
          >
            <i className="bi bi-cart3 me-1"></i> Current Cart
            {cart.length > 0 && (
              <span className="badge bg-danger rounded-pill ms-1 font-mono">
                {totalCartUnits}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="pos-container">
        {/* Left: Product Catalog & Fast Search */}
        <div
          className={`pos-catalog ${
            activeMobileTab === 'catalog' ? 'd-block' : 'd-none d-lg-block'
          }`}
        >
          {/* Top Search & Barcode Scan Bar */}
          <div className="row g-2 mb-3 align-items-center">
            <div className="col-12 col-sm-8 col-md-9">
              <div className="position-relative">
                <i
                  className="bi bi-upc-scan position-absolute text-muted"
                  style={{ left: '12px', top: '10px', fontSize: '1.1rem' }}
                ></i>
                <input
                  ref={barcodeInputRef}
                  type="text"
                  className="form-control form-control-sm ps-5 py-2 fw-bold"
                  placeholder="Scan Barcode or Search Products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleBarcodeScan}
                  autoFocus
                />
                {searchQuery && (
                  <button
                    className="btn btn-sm btn-link text-muted position-absolute end-0 top-0 p-2"
                    onClick={() => setSearchQuery('')}
                  >
                    <i className="bi bi-x-circle-fill"></i>
                  </button>
                )}
              </div>
            </div>

            <div className="col-12 col-sm-4 col-md-3 d-flex justify-content-between justify-content-sm-end align-items-center gap-2">
              <span className="small text-muted fw-bold">
                {filteredProducts.length} Item{filteredProducts.length !== 1 ? 's' : ''}
              </span>
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1"
                onClick={fetchInitialData}
                title="Refresh Catalog"
              >
                <i className="bi bi-arrow-clockwise"></i>
              </button>
            </div>
          </div>

          {/* Category Filter Horizontal Scrollable Pills */}
          <div className="category-scroll-pills mb-3">
            <button
              type="button"
              className={`btn btn-sm rounded-pill px-3 text-nowrap ${
                selectedCategory === 'all' ? 'btn-primary-zenith' : 'btn-outline-secondary bg-white'
              }`}
              onClick={() => setSelectedCategory('all')}
            >
              All Items ({products.length})
            </button>
            {categories.map((cat) => (
              <button
                key={cat._id}
                type="button"
                className={`btn btn-sm rounded-pill px-3 text-nowrap ${
                  selectedCategory === cat._id ? 'btn-primary-zenith' : 'btn-outline-secondary bg-white'
                }`}
                onClick={() => setSelectedCategory(cat._id)}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Products Grid */}
          <div className="row g-2 g-sm-3">
            {filteredProducts.length === 0 ? (
              <div className="col-12 text-center py-5 text-muted">
                <i className="bi bi-search fs-1 d-block mb-2 text-secondary opacity-50"></i>
                <div className="fw-bold">No Products Found</div>
                <div className="small">Try searching with a different keyword or barcode.</div>
              </div>
            ) : (
              filteredProducts.map((product) => {
                const inCartItem = cart.find((i) => i.productId === product._id);
                return (
                  <div key={product._id} className="col-6 col-sm-6 col-md-4 col-xl-3">
                    <div
                      className={`pos-product-card ${
                        inCartItem ? 'border-primary shadow-sm bg-white' : ''
                      }`}
                      onClick={() => addToCart(product)}
                    >
                      <div>
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <span
                            className="badge bg-light text-muted border font-mono text-truncate"
                            style={{ fontSize: '0.65rem', maxWidth: '75px' }}
                          >
                            {product.sku || 'ITEM'}
                          </span>
                          <span
                            className="badge bg-primary-subtle text-primary fw-bold"
                            style={{ fontSize: '0.65rem' }}
                          >
                            GST {product.taxRate}%
                          </span>
                        </div>

                        <h6
                          className="fw-bold mb-1 text-truncate"
                          title={product.name}
                          style={{ fontSize: '0.86rem', color: 'var(--text-main)' }}
                        >
                          {product.name}
                        </h6>

                        <div className="d-flex justify-content-between align-items-center">
                          <span
                            className="text-muted small"
                            style={{ fontSize: '0.72rem' }}
                          >
                            Stock: {product.currentStock || 0}
                          </span>
                          {inCartItem && (
                            <span
                              className="badge bg-primary text-white font-mono"
                              style={{ fontSize: '0.68rem' }}
                            >
                              In Cart: {inCartItem.quantity}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="d-flex justify-content-between align-items-center mt-2 pt-2 border-top">
                        <div
                          className="fw-extrabold text-primary font-mono"
                          style={{ fontSize: '1.02rem' }}
                        >
                          ₹{product.sellingPrice?.toLocaleString('en-IN')}
                        </div>
                        <button
                          type="button"
                          className="btn btn-sm btn-primary-zenith p-0 d-flex align-items-center justify-content-center rounded-circle"
                          style={{ width: '28px', height: '28px' }}
                          title="Add to Cart"
                          onClick={(e) => {
                            e.stopPropagation();
                            addToCart(product);
                          }}
                        >
                          <i className="bi bi-plus-lg" style={{ fontSize: '0.85rem' }}></i>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Perfected Current Cart & Sticky Checkout Panel */}
        <div
          className={`pos-cart ${
            activeMobileTab === 'cart' ? 'd-flex' : 'd-none d-lg-flex'
          }`}
        >
          {/* 1. Cart Header: Customer Selection & Tax Mode */}
          <div className="pos-cart-header">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <div className="d-flex align-items-center gap-2">
                <span className="fw-bold text-dark fs-6">
                  <i className="bi bi-cart3 text-primary me-1"></i> Current Cart
                </span>
                <span className="badge bg-primary-subtle text-primary border border-primary-subtle rounded-pill font-mono" style={{ fontSize: '0.72rem' }}>
                  {cart.length} Item{cart.length !== 1 ? 's' : ''} ({totalCartUnits} Units)
                </span>
              </div>
              {cart.length > 0 && (
                <button
                  type="button"
                  className="btn btn-sm btn-link text-danger p-0 text-decoration-none fw-bold small d-flex align-items-center gap-1"
                  onClick={clearCart}
                >
                  <i className="bi bi-trash3"></i> Clear
                </button>
              )}
            </div>

            {/* Customer Picker with Tax Toggle Switch */}
            <div className="d-flex gap-2 align-items-center">
              <div className="flex-grow-1">
                <div className="input-group input-group-sm">
                  <span className="input-group-text bg-light text-muted">
                    <i className="bi bi-person-fill"></i>
                  </span>
                  <select
                    className="form-select form-select-sm fw-semibold"
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                  >
                    <option value="">Walk-in Customer (Retail)</option>
                    {customers.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name} {c.customerType === 'B2B' ? `[GST: ${c.gstin || 'B2B'}]` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="button"
                className={`btn btn-sm fw-bold d-flex align-items-center justify-content-center text-nowrap ${
                  isTaxInclusive ? 'btn-success' : 'btn-outline-secondary bg-white'
                }`}
                style={{ fontSize: '0.72rem', height: '31px', padding: '0 0.6rem' }}
                onClick={() => setIsTaxInclusive(!isTaxInclusive)}
                title="Toggle Tax Inclusive / Exclusive Calculation"
              >
                {isTaxInclusive ? '✓ Tax Incl.' : 'Tax Excl.'}
              </button>
            </div>
          </div>

          {/* 2. Scrollable Cart Items List */}
          <div className="pos-cart-items">
            {cart.length === 0 ? (
              <div className="text-center py-5 text-muted my-auto">
                <div
                  className="d-inline-flex align-items-center justify-content-center bg-white rounded-circle shadow-sm mb-3 border"
                  style={{ width: '56px', height: '56px' }}
                >
                  <i className="bi bi-cart-x text-muted" style={{ fontSize: '1.6rem' }}></i>
                </div>
                <h6 className="fw-bold text-dark mb-1">Your cart is empty</h6>
                <p className="small text-muted mb-3" style={{ fontSize: '0.78rem' }}>
                  Scan barcode or tap products from the catalog to build this order.
                </p>
                <button
                  type="button"
                  className="btn btn-outline-primary btn-sm rounded-pill px-3 d-lg-none"
                  onClick={() => setActiveMobileTab('catalog')}
                >
                  <i className="bi bi-grid me-1"></i> Browse Catalog
                </button>
              </div>
            ) : (
              cart.map((item, idx) => (
                <div key={idx} className="cart-item-card">
                  {/* Line 1: Item Name (Bold) + Unit Price on right + Trash Icon */}
                  <div className="d-flex justify-content-between align-items-start mb-1">
                    <div className="fw-bold text-dark text-truncate pe-2" title={item.name} style={{ fontSize: '0.86rem', flex: 1 }}>
                      {item.name}
                    </div>
                    <button
                      type="button"
                      className="btn btn-sm btn-link text-muted hover-danger p-0 ms-1 flex-shrink-0"
                      onClick={() => removeFromCart(idx)}
                      title="Remove item"
                    >
                      <i className="bi bi-trash text-danger" style={{ fontSize: '0.88rem' }}></i>
                    </button>
                  </div>

                  {/* Line 2: Stepper + GST tag on left; Unit Rate & Line Subtotal on right */}
                  <div className="d-flex justify-content-between align-items-center pt-1">
                    <div className="d-flex align-items-center gap-2">
                      <div className="cart-stepper">
                        <button
                          type="button"
                          className="cart-stepper-btn"
                          onClick={() => updateQuantity(idx, item.quantity - 1)}
                          title="Decrease"
                        >
                          <i className="bi bi-dash"></i>
                        </button>
                        <input
                          type="number"
                          className="cart-stepper-input"
                          value={item.quantity}
                          onChange={(e) => updateQuantity(idx, Number(e.target.value))}
                          min="1"
                        />
                        <button
                          type="button"
                          className="cart-stepper-btn"
                          onClick={() => updateQuantity(idx, item.quantity + 1)}
                          title="Increase"
                        >
                          <i className="bi bi-plus"></i>
                        </button>
                      </div>

                      <span className="badge bg-light text-muted border font-mono" style={{ fontSize: '0.65rem' }}>
                        {item.taxRate}% GST
                      </span>
                    </div>

                    <div className="text-end">
                      <div className="fw-extrabold font-mono text-dark" style={{ fontSize: '0.98rem' }}>
                        ₹{fmtCurrency(item.quantity * item.rate)}
                      </div>
                      <div className="text-muted font-mono" style={{ fontSize: '0.7rem' }}>
                        @ ₹{fmtCurrency(item.rate)} / {item.unit || 'unit'}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* 3. Sticky Cart Footer & Checkout Panel */}
          {cart.length > 0 && (
            <div className="pos-cart-footer">
              {/* Financial Calculation Summary (Compact 2-Line) */}
              <div className="small mb-1">
                <div className="d-flex justify-content-between py-1 text-muted" style={{ fontSize: '0.8rem' }}>
                  <span>Taxable Subtotal ({totalCartUnits} units):</span>
                  <span className="fw-bold font-mono text-dark">₹{fmtCurrency(subtotal)}</span>
                </div>
                <div className="d-flex justify-content-between py-1 text-muted" style={{ fontSize: '0.8rem' }}>
                  <span>Total GST Tax {isTaxInclusive ? '(Included)' : ''}:</span>
                  <span className="fw-bold font-mono text-primary">+₹{fmtCurrency(totalTax)}</span>
                </div>
                {roundOff !== 0 && (
                  <div className="d-flex justify-content-between py-1 text-muted" style={{ fontSize: '0.75rem' }}>
                    <span>Round Off:</span>
                    <span className="font-mono text-dark">₹{fmtCurrency(roundOff)}</span>
                  </div>
                )}
              </div>

              {/* Total Payable Banner */}
              <div className="cart-payable-banner">
                <div>
                  <div className="small text-uppercase fw-bold opacity-75" style={{ fontSize: '0.68rem', letterSpacing: '0.05em' }}>
                    TOTAL PAYABLE
                  </div>
                  <div className="small opacity-75" style={{ fontSize: '0.72rem' }}>
                    {isTaxInclusive ? 'Inclusive of all taxes' : '+ Tax calculated above'}
                  </div>
                </div>
                <div className="cart-payable-amount">
                  ₹{grandTotal.toLocaleString('en-IN')}
                </div>
              </div>

              {/* Payment Mode Selector Tabs */}
              <div className="payment-mode-pill-group mb-2">
                {[
                  { mode: 'cash', label: '💵 Cash' },
                  { mode: 'upi', label: '📱 UPI QR' },
                  { mode: 'card', label: '💳 Card' }
                ].map((pm) => (
                  <button
                    key={pm.mode}
                    type="button"
                    className={`payment-mode-pill ${paymentMode === pm.mode ? 'active' : ''}`}
                    onClick={() => setPaymentMode(pm.mode)}
                  >
                    {pm.label}
                  </button>
                ))}
              </div>

              {/* Cash Denominations & Change Due Calculator (Compact) */}
              {paymentMode === 'cash' && (
                <div className="p-2 mb-2 bg-light rounded border">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <span className="small text-muted fw-bold" style={{ fontSize: '0.72rem' }}>
                      Cash Received (₹):
                    </span>
                    {tenderedVal > 0 && (
                      <span
                        className={`small fw-bold font-mono ${
                          isTenderSufficient ? 'text-success' : 'text-danger'
                        }`}
                        style={{ fontSize: '0.72rem' }}
                      >
                        {isTenderSufficient
                          ? `✓ Change Due: ₹${fmtCurrency(changeDue)}`
                          : `⚠ Short: ₹${fmtCurrency(grandTotal - tenderedVal)}`}
                      </span>
                    )}
                  </div>

                  <div className="d-flex gap-1 mb-1">
                    <input
                      type="number"
                      className="form-control form-control-sm font-mono fw-bold text-dark"
                      placeholder="Amount Tendered"
                      value={cashTendered}
                      onChange={(e) => setCashTendered(e.target.value)}
                    />
                    <button
                      type="button"
                      className="btn btn-outline-secondary btn-sm text-nowrap fw-bold"
                      style={{ fontSize: '0.75rem' }}
                      onClick={() => setCashTendered(grandTotal)}
                    >
                      Exact (₹{grandTotal.toLocaleString('en-IN')})
                    </button>
                  </div>

                  {/* Fast Note Quick Buttons */}
                  <div className="d-flex gap-1 overflow-auto">
                    {[100, 200, 500, 2000].map((note) => (
                      <button
                        key={note}
                        type="button"
                        className="denomination-pill flex-fill text-center"
                        onClick={() =>
                          setCashTendered(
                            Math.ceil(grandTotal / note) * note || note
                          )
                        }
                      >
                        +₹{note}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* High-Impact Checkout & Print Button */}
              <button
                type="button"
                className="btn-checkout-zenith"
                disabled={checkoutLoading}
                onClick={handleCheckout}
              >
                {checkoutLoading ? (
                  <span>
                    <span className="spinner-border spinner-border-sm me-2"></span>Finalizing Sale...
                  </span>
                ) : (
                  <span>
                    <i className="bi bi-printer-fill me-1"></i> COLLECT & GENERATE INVOICE (₹
                    {grandTotal.toLocaleString('en-IN')})
                  </span>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Floating Bottom Cart Bar on Mobile when browsing catalog */}
      {cart.length > 0 && activeMobileTab === 'catalog' && (
        <div className="pos-floating-bar d-lg-none">
          <div>
            <div className="fw-bold font-mono fs-6 text-white">
              ₹{grandTotal.toLocaleString('en-IN')}
            </div>
            <div className="small opacity-75" style={{ fontSize: '0.72rem' }}>
              {totalCartUnits} unit{totalCartUnits !== 1 ? 's' : ''} • {cart.length} item{cart.length !== 1 ? 's' : ''}
            </div>
          </div>
          <button
            type="button"
            className="btn btn-success btn-sm fw-bold d-flex align-items-center gap-1 px-3 py-2 shadow"
            onClick={() => setActiveMobileTab('cart')}
          >
            <span>Proceed to Cart</span> <i className="bi bi-arrow-right"></i>
          </button>
        </div>
      )}

      {/* Invoice Print & PDF Modal */}
      {showInvoiceModal && completedInvoice && (
        <InvoiceModal
          isOpen={showInvoiceModal}
          onClose={() => setShowInvoiceModal(false)}
          invoice={completedInvoice}
          business={activeBusiness}
        />
      )}
    </div>
  );
};
