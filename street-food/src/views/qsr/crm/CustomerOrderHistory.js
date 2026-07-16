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
    box-shadow: 0 10px 30px rgba(35,179,244,0.25);
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
    background: rgba(255, 255, 255, 0.12);
    border: 1px solid rgba(255, 255, 255, 0.18);
    border-radius: 14px;
    padding: 0.8rem 1.1rem;
    text-align: left;
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    transition: transform 0.2s, background 0.2s;
  }
  .hero-stat:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: translateY(-2px);
  }
  .hero-stat-value { font-size: 1.15rem; font-weight: 800; line-height: 1.1; }
  .hero-stat-label { font-size: 0.65rem; opacity: 0.8; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 2px; }

  .order-history-card {
    border-radius: 1.1rem;
    border: 1px solid #e2e8f0;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
    overflow: hidden;
    transition: box-shadow 0.2s, transform 0.2s;
    margin-bottom: 1.25rem;
    background: #fff;
  }
  .order-history-card:hover {
    box-shadow: 0 6px 24px rgba(35,179,244,0.08);
    transform: translateY(-2px);
  }
  .order-card-header {
    background: #fff;
    padding: 1.1rem 1.3rem 0.8rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 0.5rem;
    border-bottom: 1px solid #f1f5f9;
  }
  .token-circle {
    width: 38px; height: 38px;
    border-radius: 10px;
    background: rgba(35,179,244,0.1);
    display: flex; align-items: center; justify-content: center;
    color: #23b3f4; font-weight: 800; font-size: 0.95rem;
    flex-shrink: 0;
  }
  .order-meta-label { font-size: 0.7rem; color: #94a3b8; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; }
  .order-meta-value { font-size: 0.88rem; color: #334155; font-weight: 600; }
  .dish-table { font-size: 0.82rem; margin-bottom: 0; }
  .dish-table thead th { font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.05em; color: #94a3b8; font-weight: 700; border: none; padding: 0.75rem 1.1rem; background: #f8fafc; }
  .dish-table tbody td { border: none; border-bottom: 1px solid #f1f5f9; padding: 0.75rem 1.1rem; color: #334155; vertical-align: middle; }
  .dish-table tbody tr:last-child td { border-bottom: none; }
  .dish-name-main { font-weight: 600; color: #1e293b; }
  .dish-sub { font-size: 0.72rem; color: #94a3b8; margin-top: 1px; }
  .totals-row { background: #f8fafc; }
  .totals-row td { font-size: 0.8rem; padding: 0.5rem 1.1rem; border: none; color: #475569; }
  .grand-total-row td { background: rgba(35,179,244,0.05); font-weight: 800; color: #0ea5e9; font-size: 0.95rem; padding: 0.65rem 1.1rem; }

  .payment-pill { border-radius: 20px; background: rgba(100,116,139,0.08); color: #475569; font-size: 0.72rem; font-weight: 700; padding: 4px 12px; display: inline-flex; align-items: center; gap: 4px; }
  .print-bill-btn { border: 1.5px solid #e2e8f0; background: #fff; color: #64748b; border-radius: 50px; font-size: 0.75rem; font-weight: 700; padding: 5px 14px; display: inline-flex; align-items: center; gap: 5px; transition: all 0.2s; cursor: pointer; }
  .print-bill-btn:hover { border-color: #23b3f4; color: #23b3f4; background: rgba(35,179,244,0.05); }
  .empty-orders { text-align: center; padding: 3.5rem 1rem; color: #94a3b8; }
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
  const bgMap = {
    Completed: 'success',
    Paid: 'success',
    Cancelled: 'danger',
    Pending: 'warning',
    Preparing: 'warning',
    KOT: 'info',
  };
  const label = status === 'KOT' ? 'Bill Printed' : status || 'Unknown';
  return (
    <Badge bg={bgMap[status] || 'secondary'} className="rounded-pill px-3 py-1" style={{ fontSize: '0.72rem', fontWeight: 700 }}>
      {label}
    </Badge>
  );
};

/* ─── Order Card ─────────────────────────────────────────────────────────── */
const OrderCard = ({ order, onPrint, printing = {} }) => {
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
          {statusBadge(order.status)}
          <span className="payment-pill">
            <CsLineIcons icon="wallet" size="11" />
            {order.payment_type || order.paymentType || 'Cash'}
          </span>
          <button
            type="button"
            className="print-bill-btn"
            onClick={() => onPrint(order._id || order.id)}
            disabled={printing[order._id || order.id]}
          >
            {printing[order._id || order.id] ? (
              <Spinner animation="border" size="sm" style={{ width: '12px', height: '12px' }} />
            ) : (
              <CsLineIcons icon="print" size="12" />
            )}
            Print Bill
          </button>
        </div>
      </div>

      {/* Dish Table - Desktop */}
      <div className="d-none d-md-block" style={{ padding: '0' }}>
        <Table className="dish-table" responsive>
          <thead>
            <tr>
              <th style={{ width: '50%', textAlign: 'right' }}>Dish</th>
              <th style={{ width: '10%', textAlign: 'right' }}>Qty</th>
              <th style={{ width: '20%', textAlign: 'right' }}>Price</th>
              <th style={{ width: '20%', textAlign: 'right' }}>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', color: '#94a3b8', padding: '1.2rem' }}>
                  No items found for this order.
                </td>
              </tr>
            ) : (
              items.map((item, idx) => {
                const unitPrice = Number(item.dish_price || item.price || 0);
                const qty = Number(item.quantity || 1);
                const itemSubtotal = unitPrice * qty;
                const variant = item.selected_variant;
                const addons = item.selected_addons || [];
                return (
                  // eslint-disable-next-line react/no-array-index-key
                  <tr key={idx}>
                    <td style={{ width: '50%', textAlign: 'right' }}>
                      <div className="dish-name-main">{item.dish_name || item.name || '—'}</div>
                      {((variant && (variant.size_name || variant.extra)) || addons.length > 0) && (
                        <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', marginTop: '2px', lineHeight: 1.2 }}>
                          {variant && (variant.size_name || variant.extra) && (
                            <>
                              {variant.size_name ? `Size: ${variant.size_name}` : ''}
                              {variant.extra && ` (${variant.extra})`}
                            </>
                          )}
                          {variant && variant.size_name && addons.length > 0 && ' • '}
                          {addons.length > 0 && addons.map((a) => `${a.addon_name} (+₹${a.price})`).join(' • ')}
                        </div>
                      )}
                      {item.status && item.status !== 'Completed' && (
                        <div className="dish-sub" style={{ marginTop: '2px' }}>Status: {item.status}</div>
                      )}
                    </td>
                    <td style={{ width: '10%', textAlign: 'right', fontWeight: 700 }}>{qty}</td>
                    <td style={{ width: '20%', textAlign: 'right' }}>₹{unitPrice.toFixed(2)}</td>
                    <td style={{ width: '20%', textAlign: 'right', fontWeight: 600 }}>₹{itemSubtotal.toFixed(2)}</td>
                  </tr>
                );
              })
            )}

            {/* Totals */}
            {items.length > 0 && (
              <>
                <tr className="totals-row">
                  <td colSpan={3} style={{ textAlign: 'right' }}>Subtotal</td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>₹{subTotal.toFixed(2)}</td>
                </tr>
                {taxTotal > 0 && (
                  <tr className="totals-row">
                    <td colSpan={3} style={{ textAlign: 'right' }}>
                      Tax
                      {cgstAmount > 0 && <span className="ms-2" style={{ fontSize: '0.72rem', color: '#94a3b8' }}>(CGST ₹{cgstAmount.toFixed(2)} + SGST ₹{sgstAmount.toFixed(2)})</span>}
                      {vatAmount > 0 && <span className="ms-2" style={{ fontSize: '0.72rem', color: '#94a3b8' }}>(VAT ₹{vatAmount.toFixed(2)})</span>}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>₹{taxTotal.toFixed(2)}</td>
                  </tr>
                )}
                {discountAmount > 0 && (
                  <tr className="totals-row">
                    <td colSpan={3} style={{ textAlign: 'right' }}>Discount</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>-₹{discountAmount.toFixed(2)}</td>
                  </tr>
                )}
                <tr className="grand-total-row">
                  <td colSpan={3} style={{ textAlign: 'right' }}>Grand Total</td>
                  <td style={{ textAlign: 'right' }}>₹{grandTotal.toFixed(2)}</td>
                </tr>
              </>
            )}
          </tbody>
        </Table>
      </div>

      {/* Dish Items - Mobile */}
      <div className="d-md-none p-3" style={{ borderTop: '1px solid #f1f5f9' }}>
        {items.length === 0 ? (
          <div className="text-center text-muted py-3 small">No items found for this order.</div>
        ) : (
          items.map((item, idx) => {
            const unitPrice = Number(item.dish_price || item.price || 0);
            const qty = Number(item.quantity || 1);
            const itemSubtotal = unitPrice * qty;
            const variant = item.selected_variant;
            const addons = item.selected_addons || [];
            return (
              <div
                key={idx}
                className="py-2 mb-2"
                style={{
                  borderBottom: idx === items.length - 1 ? 'none' : '1px solid #f8fafc'
                }}
              >
                <div className="d-flex justify-content-between align-items-start">
                  <div style={{ flex: 1, minWidth: 0, paddingRight: '8px' }}>
                    <div className="fw-bold text-dark" style={{ fontSize: '0.82rem', wordBreak: 'break-word' }}>
                      {item.dish_name || item.name || '—'}
                    </div>
                    {((variant && (variant.size_name || variant.extra)) || addons.length > 0) && (
                      <div className="text-muted xsmall" style={{ fontWeight: 600, color: '#64748b', marginTop: '2px', lineHeight: 1.2, fontSize: '0.7rem' }}>
                        {variant && (variant.size_name || variant.extra) && (
                          <>
                            {variant.size_name ? `Size: ${variant.size_name}` : ''}
                            {variant.extra && ` (${variant.extra})`}
                          </>
                        )}
                        {variant && variant.size_name && addons.length > 0 && ' • '}
                        {addons.length > 0 && addons.map((a) => `${a.addon_name} (+₹${a.price})`).join(' • ')}
                      </div>
                    )}
                    <div className="text-muted small" style={{ fontSize: '0.72rem', marginTop: '2px' }}>
                      Qty: {qty} × ₹{unitPrice.toFixed(2)}
                    </div>
                    {item.status && item.status !== 'Completed' && (
                      <div style={{ fontSize: '0.7rem', color: '#f59e0b', marginTop: '2px', fontWeight: 600 }}>
                        Status: {item.status}
                      </div>
                    )}
                  </div>
                  <div className="fw-bold text-primary text-end" style={{ fontSize: '0.82rem', flexShrink: 0 }}>
                    ₹{itemSubtotal.toFixed(2)}
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* Mobile Totals */}
        {items.length > 0 && (
          <div className="mt-2 pt-2" style={{ borderTop: '1px solid #f1f5f9' }}>
            <div className="d-flex justify-content-between mb-1" style={{ fontSize: '0.78rem' }}>
              <span className="text-muted">Subtotal</span>
              <span className="fw-medium text-dark">₹{subTotal.toFixed(2)}</span>
            </div>
            {taxTotal > 0 && (
              <div className="d-flex justify-content-between mb-1" style={{ fontSize: '0.78rem' }}>
                <span className="text-muted">Tax</span>
                <span className="fw-medium text-dark">₹{taxTotal.toFixed(2)}</span>
              </div>
            )}
            {discountAmount > 0 && (
              <div className="d-flex justify-content-between mb-1 text-danger" style={{ fontSize: '0.78rem' }}>
                <span>Discount</span>
                <span>-₹{discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="d-flex justify-content-between mt-2 pt-2 fw-bold" style={{ borderTop: '1px dotted #e2e8f0', fontSize: '0.88rem' }}>
              <span className="text-primary">Grand Total</span>
              <span className="text-primary">₹{grandTotal.toFixed(2)}</span>
            </div>
          </div>
        )}
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
    { to: 'crm', text: 'CRM' },
    { to: 'crm/whatsapp', text: 'WhatsApp Campaign' },
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

  const handlePrint = async (orderId) => {
    await openPrintWindow(orderId, setPrinting);
  };

  const customerName = customerInfo?.name || 'Walk-in';

  return (
    <>
      <style>{styles}</style>
      <HtmlHead title={title} description={description} />

      {/* Breadcrumb + Back */}
      <div className="qsr-page-title-container text-start">
        <Row className="g-0 align-items-center">
          <Col xs="auto" className="me-auto text-start">
            <h1 className="qsr-page-title">{title}</h1>
            <BreadcrumbList items={breadcrumbs} />
          </Col>
          <Col xs="12" md="auto" className="d-flex flex-wrap justify-content-md-end gap-2 mt-3 mt-md-0 ms-md-auto">
            <Button
              onClick={() => history.push('/crm/whatsapp')}
              className="manage-menu-custom-btn-outline shadow-sm border-0 px-4 py-2 d-flex align-items-center"
            >
              <CsLineIcons icon="arrow-left" className="me-2" size="18" />
              Back to WhatsApp Campaign
            </Button>
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
                <div style={{ opacity: 0.85, marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CsLineIcons icon="phone" size="13" />
                  <span style={{ fontSize: '0.88rem' }}>{decodedPhone}</span>
                </div>
              </div>
            </div>

            <Row className="g-2 position-relative" style={{ zIndex: 1 }}>
              {[
                { label: 'Total Orders', value: summary?.total_orders ?? orders.length, icon: 'cart' },
                {
                  label: 'Total Spent',
                  value: `₹${Number(summary?.total_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
                  icon: 'wallet'
                },
                { label: 'First Order', value: formatDate(summary?.first_order), icon: 'calendar' },
                { label: 'Last Order', value: formatDate(summary?.last_order), icon: 'clock' },
              ].map((stat) => (
                <Col xs={12} sm={6} md={3} key={stat.label}>
                  <div className="hero-stat d-flex align-items-center gap-3">
                    <div style={{
                      width: '38px', height: '38px',
                      borderRadius: '10px',
                      background: 'rgba(255, 255, 255, 0.2)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <CsLineIcons icon={stat.icon} size="16" style={{ color: '#fff' }} />
                    </div>
                    <div>
                      <div className="hero-stat-value">{stat.value}</div>
                      <div className="hero-stat-label">{stat.label}</div>
                    </div>
                  </div>
                </Col>
              ))}
            </Row>
          </Card>

          {/* Orders */}
          {orders.length === 0 ? (
            <div className="empty-orders">
              <CsLineIcons icon="cart" size="48" />
              <div className="fw-bold fs-5 mt-2">No orders found</div>
              <div className="small mt-1">This customer has no recorded orders.</div>
            </div>
          ) : (
            orders.map((order) => (
              <OrderCard
                key={order._id || order.id}
                order={order}
                onPrint={handlePrint}
                printing={printing}
              />
            ))
          )}
        </>
      )}
    </>
  );
};

export default CustomerOrderHistory;
