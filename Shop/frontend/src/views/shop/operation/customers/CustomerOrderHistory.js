import React, { useState, useEffect, useContext } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import { Row, Col, Card, Button, Spinner, Badge, Table } from 'react-bootstrap';
import { format } from 'date-fns';
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import { toast } from 'react-toastify';
import { AuthContext } from 'contexts/AuthContext';
import { getCustomerOrders } from 'api/customerService';
import { openPrintWindow } from 'utils/printUtils';

/* ─── Inline Styles ─────────────────────────────────────────────────────────── */
const styles = `
  .customer-hero-card {
    border-radius: 1.25rem;
    border: none;
    background: linear-gradient(135deg, #0ea5e9 0%, #23b3f4 60%, #38bdf8 100%);
    color: #fff;
    box-shadow: 0 8px 32px rgba(35,179,244,0.28);
    position: relative;
    overflow: hidden;
  }
  .customer-hero-card::before {
    content: '';
    position: absolute;
    top: -40px; right: -40px;
    width: 180px; height: 180px;
    border-radius: 50%;
    background: rgba(255,255,255,0.07);
    pointer-events: none;
  }
  .customer-hero-card::after {
    content: '';
    position: absolute;
    bottom: -60px; left: -30px;
    width: 220px; height: 220px;
    border-radius: 50%;
    background: rgba(255,255,255,0.05);
    pointer-events: none;
  }
  .hero-avatar {
    width: 64px; height: 64px;
    border-radius: 50%;
    background: rgba(255,255,255,0.2);
    display: flex; align-items: center; justify-content: center;
    font-size: 1.5rem; font-weight: 800; color: #fff;
    border: 3px solid rgba(255,255,255,0.35);
    flex-shrink: 0;
  }
  .hero-stat {
    background: rgba(255,255,255,0.15);
    border-radius: 12px;
    padding: 0.65rem 1.1rem;
    text-align: center;
    backdrop-filter: blur(4px);
  }
  .hero-stat-value { font-size: 1.2rem; font-weight: 800; line-height: 1.1; }
  .hero-stat-label { font-size: 0.7rem; opacity: 0.8; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 2px; }

  .order-history-card {
    border-radius: 1.1rem;
    border: 1px solid #e2e8f0;
    box-shadow: 0 2px 12px rgba(35,179,244,0.06);
    overflow: hidden;
    transition: box-shadow 0.2s, transform 0.2s;
    margin-bottom: 1.1rem;
  }
  .order-history-card:hover {
    box-shadow: 0 6px 24px rgba(35,179,244,0.13);
    transform: translateY(-2px);
  }
  .order-card-header {
    background: #f8fafc;
    padding: 0.85rem 1.2rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 0.5rem;
    border-bottom: 1px solid #e2e8f0;
  }
  .token-circle {
    width: 40px; height: 40px;
    border-radius: 50%;
    background: linear-gradient(135deg,#23b3f4,#0ea5e9);
    display: flex; align-items: center; justify-content: center;
    color: #fff; font-weight: 800; font-size: 1rem;
    box-shadow: 0 4px 12px rgba(35,179,244,0.3);
    flex-shrink: 0;
  }
  .order-meta-label { font-size: 0.7rem; color: #94a3b8; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; }
  .order-meta-value { font-size: 0.88rem; color: #334155; font-weight: 600; }
  .item-table { font-size: 0.82rem; margin-bottom: 0; }
  .item-table thead th { font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.05em; color: #94a3b8; font-weight: 700; border: none; padding: 0.6rem 0.85rem; background: #f8fafc; }
  .item-table tbody td { border: none; border-bottom: 1px solid #f1f5f9; padding: 0.6rem 0.85rem; color: #334155; vertical-align: middle; }
  .item-table tbody tr:last-child td { border-bottom: none; }
  .item-name-main { font-weight: 600; color: #1e293b; }
  .item-sub { font-size: 0.72rem; color: #94a3b8; margin-top: 1px; }
  .totals-row { background: #f0f9ff; }
  .totals-row td { font-size: 0.8rem; padding: 0.5rem 0.85rem; border: none; color: #475569; }
  .grand-total-row td { background: linear-gradient(135deg, #f0f9ff, #e0f2fe); font-weight: 800; color: #0284c7; font-size: 0.95rem; padding: 0.65rem 0.85rem; }
  .status-badge { border-radius: 20px; padding: 3px 10px; font-size: 0.72rem; font-weight: 700; display: inline-block; }
  .status-badge.completed { background: rgba(34,197,94,0.12); color: #15803d; }
  .status-badge.cancelled { background: rgba(239,68,68,0.12); color: #dc2626; }
  .status-badge.pending   { background: rgba(234,179,8,0.12); color: #a16207; }
  .order-type-badge-sm { border-radius: 20px; padding: 3px 10px; font-size: 0.72rem; font-weight: 700; display: inline-block; }
  .order-type-badge-sm.dine-in  { background: rgba(168,85,247,0.12); color: #7c3aed; }
  .order-type-badge-sm.takeaway { background: rgba(234,179,8,0.12);  color: #a16207; }
  .order-type-badge-sm.delivery { background: rgba(34,197,94,0.12);  color: #15803d; }
  .payment-pill { border-radius: 20px; background: rgba(100,116,139,0.08); color: #475569; font-size: 0.72rem; font-weight: 700; padding: 3px 10px; display: inline-flex; align-items: center; gap: 4px; }
  .print-bill-btn { border: 1.5px solid #e2e8f0; background: #fff; color: #64748b; border-radius: 50px; font-size: 0.75rem; font-weight: 700; padding: 4px 13px; display: inline-flex; align-items: center; gap: 5px; transition: all 0.2s; cursor: pointer; }
  .print-bill-btn:hover { border-color: #23b3f4; color: #23b3f4; background: rgba(35,179,244,0.05); }
  .empty-orders { text-align: center; padding: 3.5rem 1rem; color: #94a3b8; }
  .back-btn { border: 1.5px solid #e2e8f0; background: #fff; color: #64748b; border-radius: 50px; font-size: 0.82rem; font-weight: 700; padding: 6px 16px; display: inline-flex; align-items: center; gap: 6px; transition: all 0.2s; }
  .back-btn:hover { border-color: #23b3f4; color: #23b3f4; text-decoration: none; }
`;

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
const getInitials = (name) => {
  if (!name || name === 'Walk-in') return 'W';
  const parts = name.trim().split(' ');
  return parts.length >= 2 ? `${parts[0][0]}${parts[1][0]}`.toUpperCase() : parts[0][0].toUpperCase();
};

const formatDateTime = (dateStr) => {
  if (!dateStr) return '—';
  try { return format(new Date(dateStr), 'dd MMM yyyy, hh:mm a'); } catch { return '—'; }
};

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  try { return format(new Date(dateStr), 'dd MMM yyyy'); } catch { return '—'; }
};

const statusBadge = (status) => {
  const map = { Completed: 'completed', Cancelled: 'cancelled', Pending: 'pending', Preparing: 'pending' };
  return <span className={`status-badge ${map[status] || 'pending'}`}>{status || 'Unknown'}</span>;
};

const orderTypeBadge = (type) => {
  const map = { 'Dine In': 'dine-in', Takeaway: 'takeaway', Delivery: 'delivery' };
  return <span className={`order-type-badge-sm ${map[type] || 'takeaway'}`}>{type || '—'}</span>;
};

/* ─── Order Card ─────────────────────────────────────────────────────────── */
const OrderCard = ({ order, onPrint }) => {
  const items = order.items || order.order_items || [];
  const subTotal = Number(order.sub_total || order.subTotal || 0);
  const cgstAmount = Number(order.cgst_amount || order.cgstAmount || 0);
  const sgstAmount = Number(order.sgst_amount || order.sgstAmount || 0);
  const vatAmount = Number(order.vat_amount || order.vatAmount || 0);
  const taxTotal = cgstAmount + sgstAmount + vatAmount;
  const discountAmount = Number(order.discount_amount || order.discountAmount || 0);
  const grandTotal = Number(order.total || 0);

  return (
    <div className="order-history-card">
      {/* Card Header */}
      <div className="order-card-header">
        <div className="d-flex align-items-center gap-3">
          <div className="token-circle">{order.token || '#'}</div>
          <div>
            <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.92rem' }}>
              Order #{order.order_number || order._id?.slice(-6)?.toUpperCase() || '—'}
            </div>
            <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>
              <CsLineIcons icon="clock" size="11" className="me-1" />
              {formatDateTime(order.created_at || order.createdAt)}
            </div>
          </div>
        </div>

        <div className="d-flex align-items-center gap-2 flex-wrap">
          {orderTypeBadge(order.order_type || order.orderType)}
          {statusBadge(order.status)}
          <span className="payment-pill">
            <CsLineIcons icon="wallet" size="11" />
            {order.payment_type || order.paymentType || 'Cash'}
          </span>
          <button type="button" className="print-bill-btn" onClick={() => onPrint(order)}>
            <CsLineIcons icon="print" size="12" />
            Print Bill
          </button>
        </div>
      </div>

      {/* Item Table */}
      <div style={{ padding: '0' }}>
        <Table className="item-table" responsive>
          <thead>
            <tr>
              <th style={{ width: '40%' }}>Item</th>
              <th>Variant / Addons</th>
              <th style={{ textAlign: 'center' }}>Qty</th>
              <th style={{ textAlign: 'right' }}>Price</th>
              <th style={{ textAlign: 'right' }}>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', color: '#94a3b8', padding: '1.2rem' }}>
                  No items found for this order.
                </td>
              </tr>
            ) : (
              items.map((item, idx) => {
                const unitPrice = Number(item.item_price || item.price || 0);
                const qty = Number(item.quantity || 1);
                const itemSubtotal = unitPrice * qty;
                const variant = item.selected_variant;
                const addons = item.selected_addons || [];
                return (
                  // eslint-disable-next-line react/no-array-index-key
                  <tr key={idx}>
                    <td>
                      <div className="item-name-main">{item.item_name || item.name || '—'}</div>
                      {item.status && item.status !== 'Completed' && (
                        <div className="item-sub">Status: {item.status}</div>
                      )}
                    </td>
                    <td>
                      {variant && (variant.size_name || variant.extra) ? (
                        <div className="item-sub">
                          {variant.size_name ? <span>Size: {variant.size_name}</span> : null}
                          {variant.extra ? <span className="ms-2">({variant.extra})</span> : null}
                        </div>
                      ) : null}
                      {addons.length > 0 && (
                        <div className="item-sub">
                          +{addons.map((a) => a.addon_name).join(', ')}
                        </div>
                      )}
                      {!variant && addons.length === 0 && <span style={{ color: '#cbd5e1' }}>—</span>}
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: 700 }}>{qty}</td>
                    <td style={{ textAlign: 'right' }}>₹{unitPrice.toFixed(2)}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>₹{itemSubtotal.toFixed(2)}</td>
                  </tr>
                );
              })
            )}

            {/* Totals */}
            {items.length > 0 && (
              <>
                <tr className="totals-row">
                  <td colSpan={4} style={{ textAlign: 'right' }}>Subtotal</td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>₹{subTotal.toFixed(2)}</td>
                </tr>
                {taxTotal > 0 && (
                  <tr className="totals-row">
                    <td colSpan={4} style={{ textAlign: 'right' }}>
                      Tax
                      {cgstAmount > 0 && <span className="ms-2" style={{ fontSize: '0.72rem', color: '#94a3b8' }}>(CGST ₹{cgstAmount.toFixed(2)} + SGST ₹{sgstAmount.toFixed(2)})</span>}
                      {vatAmount > 0 && <span className="ms-2" style={{ fontSize: '0.72rem', color: '#94a3b8' }}>(VAT ₹{vatAmount.toFixed(2)})</span>}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>₹{taxTotal.toFixed(2)}</td>
                  </tr>
                )}
                {discountAmount > 0 && (
                  <tr className="totals-row">
                    <td colSpan={4} style={{ textAlign: 'right', color: '#16a34a' }}>Discount</td>
                    <td style={{ textAlign: 'right', fontWeight: 600, color: '#16a34a' }}>− ₹{discountAmount.toFixed(2)}</td>
                  </tr>
                )}
                <tr className="grand-total-row">
                  <td colSpan={4} style={{ textAlign: 'right' }}>Grand Total</td>
                  <td style={{ textAlign: 'right' }}>₹{grandTotal.toFixed(2)}</td>
                </tr>
              </>
            )}
          </tbody>
        </Table>
      </div>
    </div>
  );
};

/* ─── Main Component ─────────────────────────────────────────────────────── */
const CustomerOrderHistory = () => {
  const title = 'Customer Orders';
  const description = 'Complete order history for this customer.';

  const { phone } = useParams();
  const history = useHistory();
  const { currentUser } = useContext(AuthContext);

  const [loading, setLoading] = useState(true);
  const [customerInfo, setCustomerInfo] = useState(null);
  const [summary, setSummary] = useState(null);
  const [orders, setOrders] = useState([]);
  const [printing, setPrinting] = useState({});

  const decodedPhone = decodeURIComponent(phone);

  const breadcrumbs = [
    { to: '', text: 'Home' },
    { to: 'operations', text: 'Operations' },
    { to: 'operations/customers', text: 'Manage Customers' },
    { to: '', text: 'Customer Orders' },
  ];

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await getCustomerOrders(decodedPhone);
        if (res.data?.success) {
          setCustomerInfo(res.data.customer || { phone: decodedPhone });
          setSummary(res.data.summary || {});
          setOrders(res.data.orders || []);
        } else {
          toast.error(res.data?.message || 'Could not load customer orders.');
        }
      } catch (err) {
        toast.error('Error loading customer orders.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [decodedPhone]);

  const handlePrint = async (order) => {
    setPrinting((prev) => ({ ...prev, [order._id]: true }));
    try {
      await openPrintWindow(order, null);
    } catch {
      toast.error('Print failed.');
    } finally {
      setPrinting((prev) => ({ ...prev, [order._id]: false }));
    }
  };

  const customerName = customerInfo?.name || 'Walk-in';

  return (
    <>
      <style>{styles}</style>
      <HtmlHead title={title} description={description} />

      {/* Breadcrumb + Back */}
      <div className="page-title-container mb-3">
        <Row className="align-items-center g-2">
          <Col>
            <h1 className="mb-0 pb-0 display-6 fw-bold" style={{ color: '#1e293b', fontSize: '1.5rem' }}>
              {title}
            </h1>
            <BreadcrumbList items={breadcrumbs} />
          </Col>
          <Col xs="auto">
            <button type="button" className="back-btn" onClick={() => history.push('/operations/customers')}>
              <CsLineIcons icon="arrow-left" size="14" />
              Back to Customers
            </button>
          </Col>
        </Row>
      </div>

      {loading ? (
        <div className="d-flex justify-content-center align-items-center py-5">
          <Spinner animation="border" style={{ color: '#23b3f4', width: '2.5rem', height: '2.5rem' }} />
          <span className="ms-3 text-muted fw-semibold">Loading customer orders...</span>
        </div>
      ) : (
        <>
          {/* Customer Hero Card */}
          <Card className="customer-hero-card mb-4 p-4">
            <div className="d-flex align-items-center gap-3 mb-3 position-relative" style={{ zIndex: 1 }}>
              <div className="hero-avatar">{getInitials(customerName)}</div>
              <div>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, lineHeight: 1.1 }}>{customerName}</div>
                <div style={{ opacity: 0.85, marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CsLineIcons icon="phone" size="13" />
                  <span style={{ fontSize: '0.88rem' }}>{decodedPhone}</span>
                </div>
              </div>
            </div>

            <Row className="g-2 position-relative" style={{ zIndex: 1 }}>
              {[
                { label: 'Total Orders', value: summary?.total_orders ?? orders.length },
                {
                  label: 'Total Spent',
                  value: `₹${Number(summary?.total_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
                },
                { label: 'First Order', value: formatDate(summary?.first_order) },
                { label: 'Last Order', value: formatDate(summary?.last_order) },
              ].map((stat) => (
                <Col xs={6} sm={3} key={stat.label}>
                  <div className="hero-stat">
                    <div className="hero-stat-value">{stat.value}</div>
                    <div className="hero-stat-label">{stat.label}</div>
                  </div>
                </Col>
              ))}
            </Row>
          </Card>

          {/* Orders */}
          <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '1rem', marginBottom: '0.85rem' }}>
            <CsLineIcons icon="cart" size="16" className="me-2" style={{ color: '#23b3f4' }} />
            Order History
            <span className="ms-2" style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>
              ({orders.length} {orders.length === 1 ? 'order' : 'orders'})
            </span>
          </div>

          {orders.length === 0 ? (
            <div className="empty-orders">
              <CsLineIcons icon="cart" size="48" />
              <div className="fw-bold fs-5 mt-2">No sales found</div>
              <div className="text-muted small mt-1">This customer hasn't made any sales yet.</div>
            </div>
          ) : (
            orders.map((order) => (
              <OrderCard
                key={order._id || order.id}
                order={order}
                onPrint={handlePrint}
              />
            ))
          )}
        </>
      )}
    </>
  );
};

export default CustomerOrderHistory;
