import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AppContext';
import { useRestaurant } from '../context/RestaurantContext';
import { ArrowLeft, Printer, MessageSquare, ShieldAlert, CheckCircle2, ShoppingBag } from 'lucide-react';
import toast from 'react-hot-toast';

export default function OrderDetail() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { restaurantCode, settings } = useRestaurant();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!orderId) return;
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('ember-token');
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
        const res = await fetch(`${API_URL}/web-customer/get-order/${orderId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setOrder(data.data);
        } else {
          setError(data.message || 'Failed to fetch order details');
        }
      } catch (err) {
        console.error('Failed to load order details', err);
        setError('Error fetching order details');
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [orderId]);

  const handlePrint = () => {
    if (!order || !settings) return;

    const itemsHTML = order.order_items.map(item => `
      <tr>
        <td style="padding: 6px 0; font-size: 14px; color: #333;">
          ${item.dish_name}
          ${((item.selected_variant && (item.selected_variant.size_name || item.selected_variant.extra)) || (Array.isArray(item.selected_addons) && item.selected_addons.filter(a => a && a.addon_name).length > 0)) ? `
            <div style="font-size: 11px; color: #666; margin-top: 2px;">
              ${item.selected_variant && item.selected_variant.size_name ? `Size: ${item.selected_variant.size_name}` : ''}${item.selected_variant && item.selected_variant.extra ? ` (${item.selected_variant.extra})` : ''}
              ${item.selected_variant && (item.selected_variant.size_name || item.selected_variant.extra) && Array.isArray(item.selected_addons) && item.selected_addons.filter(a => a && a.addon_name).length > 0 ? ' • ' : ''}
              ${Array.isArray(item.selected_addons) ? item.selected_addons.filter(a => a && a.addon_name).map(addon => `${addon.addon_name} (+₹${addon.price})`).join(' • ') : ''}
            </div>
          ` : ''}
        </td>
        <td style="padding: 6px 0; text-align: center; font-size: 14px; color: #333;">${item.quantity}</td>
        <td style="padding: 6px 0; text-align: right; font-size: 14px; color: #333;">₹${item.dish_price.toFixed(2)}</td>
        <td style="padding: 6px 0; text-align: right; font-size: 14px; color: #333; font-weight: bold;">₹${(item.dish_price * item.quantity).toFixed(2)}</td>
      </tr>
    `).join('');

    const invoiceHTML = `
      <html>
      <head>
        <title>Receipt - Order #${order.order_no || order._id}</title>
        <style>
          @media print {
            body { margin: 0; padding: 10px; }
          }
        </style>
      </head>
      <body style="font-family: 'Courier New', Courier, monospace; max-width: 400px; margin: 0 auto; padding: 20px; color: #000;">
        <div style="text-align: center; margin-bottom: 15px;">
          <h2 style="margin: 0 0 5px 0; font-size: 20px; font-weight: bold; text-transform: uppercase;">${settings.restaurant_name}</h2>
          <p style="margin: 0 0 5px 0; font-size: 12px; line-height: 1.4;">${settings.address || ''}</p>
          <p style="margin: 0 0 5px 0; font-size: 12px;">${settings.city || ''} ${settings.pincode || ''}</p>
          ${settings.contact_phone ? `<p style="margin: 0 0 5px 0; font-size: 12px;">Phone: ${settings.contact_phone}</p>` : ''}
          ${settings.contact_email ? `<p style="margin: 0; font-size: 12px;">Email: ${settings.contact_email}</p>` : ''}
        </div>

        <div style="border-top: 1px dashed #000; margin: 10px 0;"></div>

        <table style="width: 100%; font-size: 13px; margin-bottom: 15px; border-collapse: collapse;">
          <tr>
            <td style="padding: 3px 0;"><strong>Bill No:</strong> ${order.order_no || order._id}</td>
            <td style="padding: 3px 0; text-align: right;"><strong>Type:</strong> ${order.order_type || 'Dine In'}</td>
          </tr>
          <tr>
            <td style="padding: 3px 0;"><strong>Date:</strong> ${new Date(order.order_date || order.createdAt).toLocaleString('en-IN')}</td>
            <td style="padding: 3px 0; text-align: right;">
              ${order.table_no ? `<strong>Table:</strong> ${order.table_no}` : order.token ? `<strong>Token:</strong> ${order.token}` : ''}
            </td>
          </tr>
          ${order.customer_name ? `
            <tr>
              <td colspan="2" style="padding: 3px 0;"><strong>Customer:</strong> ${order.customer_name}</td>
            </tr>
          ` : ''}
        </table>

        <div style="border-top: 1px dashed #000; margin: 10px 0;"></div>

        <table style="width: 100%; font-size: 13px; border-collapse: collapse; margin-bottom: 15px;">
          <thead>
            <tr>
              <th style="text-align: left; padding: 5px 0; border-bottom: 1px dashed #000;">Item</th>
              <th style="text-align: center; padding: 5px 0; border-bottom: 1px dashed #000; width: 40px;">Qty</th>
              <th style="text-align: right; padding: 5px 0; border-bottom: 1px dashed #000; width: 70px;">Price</th>
              <th style="text-align: right; padding: 5px 0; border-bottom: 1px dashed #000; width: 80px;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHTML}
          </tbody>
        </table>

        <div style="border-top: 1px dashed #000; margin: 10px 0;"></div>

        <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
          <tr>
            <td style="padding: 4px 0;">Sub Total</td>
            <td style="padding: 4px 0; text-align: right;">₹${parseFloat(order.sub_total || 0).toFixed(2)}</td>
          </tr>
          ${order.cgst_amount > 0 ? `
            <tr>
              <td style="padding: 4px 0;">CGST (${order.cgst_percent || 0}%)</td>
              <td style="padding: 4px 0; text-align: right;">₹${parseFloat(order.cgst_amount).toFixed(2)}</td>
            </tr>
          ` : ''}
          ${order.sgst_amount > 0 ? `
            <tr>
              <td style="padding: 4px 0;">SGST (${order.sgst_percent || 0}%)</td>
              <td style="padding: 4px 0; text-align: right;">₹${parseFloat(order.sgst_amount).toFixed(2)}</td>
            </tr>
          ` : ''}
          ${order.vat_amount > 0 ? `
            <tr>
              <td style="padding: 4px 0;">VAT (${order.vat_percent || 0}%)</td>
              <td style="padding: 4px 0; text-align: right;">₹${parseFloat(order.vat_amount).toFixed(2)}</td>
            </tr>
          ` : ''}
          ${order.discount_amount > 0 ? `
            <tr>
              <td style="padding: 4px 0; color: #d32f2f;">Discount</td>
              <td style="padding: 4px 0; text-align: right; color: #d32f2f;">-₹${parseFloat(order.discount_amount).toFixed(2)}</td>
            </tr>
          ` : ''}
          ${order.waveoff_amount > 0 ? `
            <tr>
              <td style="padding: 4px 0; color: #d32f2f;">Waveoff</td>
              <td style="padding: 4px 0; text-align: right; color: #d32f2f;">-₹${parseFloat(order.waveoff_amount).toFixed(2)}</td>
            </tr>
          ` : ''}
          <tr>
            <td style="padding: 8px 0; font-size: 15px; border-top: 1px dashed #000; border-bottom: 1px dashed #000;"><strong>GRAND TOTAL</strong></td>
            <td style="padding: 8px 0; font-size: 15px; text-align: right; border-top: 1px dashed #000; border-bottom: 1px dashed #000;"><strong>₹${parseFloat(order.total_amount || order.bill_amount || 0).toFixed(2)}</strong></td>
          </tr>
        </table>

        <div style="text-align: center; margin-top: 25px;">
          <p style="margin: 0; font-size: 13px; font-weight: bold; text-transform: uppercase;">Thank you for dining with us!</p>
          <p style="margin: 5px 0 0 0; font-size: 11px; color: #555;">Powered by TheBox</p>
        </div>
      </body>
      </html>
    `;

    // Create a hidden iframe for print compatibility with mobile devices
    let printFrame = document.getElementById('print-frame');
    if (!printFrame) {
      printFrame = document.createElement('iframe');
      printFrame.id = 'print-frame';
      printFrame.style.position = 'absolute';
      printFrame.style.width = '0px';
      printFrame.style.height = '0px';
      printFrame.style.border = '0px';
      printFrame.style.top = '0px';
      printFrame.style.left = '0px';
      document.body.appendChild(printFrame);
    }

    const doc = printFrame.contentDocument || printFrame.contentWindow.document;
    doc.open();
    doc.write(invoiceHTML);
    doc.close();

    // Trigger printing from the iframe
    setTimeout(() => {
      printFrame.contentWindow.focus();
      printFrame.contentWindow.print();
    }, 500);
  };

  const handleFeedbackRedirect = () => {
    if (!settings?.restaurant_token) {
      toast.error('Feedback token is not configured for this restaurant.');
      return;
    }
    let feedbackBaseUrl = import.meta.env.VITE_FEEDBACK_URL || 'https://www.theboxsync.com/feedback.html';
    
    // Normalize local filesystem paths to avoid browser "Not allowed to load local resource" errors
    if (feedbackBaseUrl.includes(':\\') || feedbackBaseUrl.includes(':/') || feedbackBaseUrl.startsWith('file:')) {
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
      const origin = apiBase.endsWith('/api') ? apiBase.slice(0, -4) : apiBase;
      feedbackBaseUrl = `${origin}/feedback.html`;
    }

    const params = new URLSearchParams({
      token: settings.restaurant_token,
      order_id: order._id,
      name: user?.name || '',
      email: user?.email || '',
    });
    console.log(`${feedbackBaseUrl}?${params.toString()}`);
    window.open(`${feedbackBaseUrl}?${params.toString()}`, '_blank');
  };

  if (loading) {
    return (
      <main className="min-vh-100 d-flex align-items-center justify-content-center" style={{ paddingTop: '8rem', paddingBottom: '8rem' }}>
        <div className="text-center">
          <div className="spinner-border text-brand-400" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-white-60 mt-3">Loading order details...</p>
        </div>
      </main>
    );
  }

  if (error || !order) {
    return (
      <main className="min-vh-100 d-flex align-items-center justify-content-center px-3" style={{ paddingTop: '8rem', paddingBottom: '8rem' }}>
        <div className="text-center glass p-5 rounded-4" style={{ maxWidth: '450px' }}>
          <div className="rounded-circle d-flex align-items-center justify-content-center mx-auto mb-4 border border-danger-50 bg-danger-10" style={{ width: '64px', height: '64px' }}>
            <ShieldAlert size={32} className="text-danger" />
          </div>
          <h2 className="text-white fw-bold mb-3">Error Loading Order</h2>
          <p className="text-white-60 mb-4">{error || 'Order not found'}</p>
          <button onClick={() => navigate(`/${restaurantCode}/profile`)} className="btn-primary w-100 justify-content-center py-2.5">
            Back to Profile
          </button>
        </div>
      </main>
    );
  }

  const orderDate = new Date(order.order_date || order.createdAt);
  const formattedDate = isNaN(orderDate.getTime()) ? 'N/A' : orderDate.toLocaleString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <main className="min-vh-100" style={{ paddingTop: '8rem', paddingBottom: '8rem' }}>
      <div className="container-lg" style={{ maxWidth: '900px' }}>

        {/* Back Button */}
        <button
          onClick={() => navigate(`/${restaurantCode}/profile`)}
          className="btn-ghost d-flex align-items-center gap-2 mb-4 text-white-60 hover:text-white transition-colors border-0 bg-transparent"
        >
          <ArrowLeft size={18} /> Back to Orders
        </button>

        {/* Action Header */}
        <div className="glass rounded-4 p-4 d-flex flex-column sm:flex-row justify-content-between align-items-center gap-3 mb-4">
          <div className="text-center text-sm-start">
            <h2 className="font-display fw-bold text-white mb-1">Order Details</h2>
            <p className="text-white-60 small mb-0">Order ID: <span className="font-monospace text-brand-400 fw-semibold">#{order._id}</span></p>
          </div>
          <div className="d-flex gap-2 flex-wrap">
            <button onClick={handlePrint} className="btn-ghost py-2 px-4 small d-flex align-items-center gap-2">
              <Printer size={16} /> Print Bill
            </button>
            <button onClick={handleFeedbackRedirect} className="btn-primary py-2.5 px-4 small d-flex align-items-center gap-2">
              <MessageSquare size={16} /> Give Feedback
            </button>
          </div>
        </div>

        <div className="row g-4">
          {/* Order Metadata */}
          <div className="col-12 col-md-5">
            <div className="glass rounded-4 p-4 h-100 d-flex flex-column gap-4">
              <div>
                <h5 className="text-white fw-bold mb-3 d-flex align-items-center gap-2">
                  <ShoppingBag size={18} className="text-brand-400" /> General Info
                </h5>
                <div className="d-flex flex-column gap-2 text-white-60 small">
                  <div className="d-flex justify-content-between">
                    <span>Order No:</span>
                    <span className="text-white fw-semibold">{order.order_no || '-'}</span>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span>Order Date:</span>
                    <span className="text-white fw-semibold">{formattedDate}</span>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span>Order Type:</span>
                    <span className="text-white fw-semibold">{order.order_type || '-'}</span>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span>Order Status:</span>
                    <span className="text-white fw-semibold">{order.order_status || '-'}</span>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span>Payment Type:</span>
                    <span className="text-white fw-semibold">{order.payment_type || 'Not Specified'}</span>
                  </div>
                </div>
              </div>

              {/* Table details or customer info */}
              <div className="border-top border-white-10 pt-3">
                <h5 className="text-white fw-bold mb-3">Service Details</h5>
                <div className="d-flex flex-column gap-2 text-white-60 small">
                  {order.order_type === 'Dine In' && order.table_area && (
                    <div className="d-flex justify-content-between">
                      <span>Table Area:</span>
                      <span className="text-white fw-semibold">{order.table_area} (T{order.table_no})</span>
                    </div>
                  )}
                  {order.order_type === 'Takeaway' && order.token && (
                    <div className="d-flex justify-content-between">
                      <span>Token Number:</span>
                      <span className="text-white fw-semibold">{order.token}</span>
                    </div>
                  )}
                  {order.waiter && (
                    <div className="d-flex justify-content-between">
                      <span>Waiter:</span>
                      <span className="text-white fw-semibold">{order.waiter}</span>
                    </div>
                  )}
                  <div className="d-flex justify-content-between">
                    <span>Customer Name:</span>
                    <span className="text-white fw-semibold">{order.customer_name || 'Guest'}</span>
                  </div>
                  {order.customer_phone && (
                    <div className="d-flex justify-content-between">
                      <span>Customer Phone:</span>
                      <span className="text-white fw-semibold">{order.customer_phone}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Items & Receipt Table */}
          <div className="col-12 col-md-7">
            <div className="glass rounded-4 p-4">
              <h5 className="text-white fw-bold mb-3 d-flex align-items-center gap-2">
                <CheckCircle2 size={18} className="text-brand-400" /> Order Items
              </h5>

              <div className="table-responsive mb-4">
                <table className="table table-dark table-borderless align-middle mb-0" style={{ background: 'transparent' }}>
                  <thead>
                    <tr className="border-bottom border-white-10 text-white-60 small">
                      <th className="py-2 fw-semibold">Item</th>
                      <th className="py-2 fw-semibold text-center" style={{ width: '60px' }}>Qty</th>
                      <th className="py-2 fw-semibold text-end" style={{ width: '80px' }}>Price</th>
                      <th className="py-2 fw-semibold text-end" style={{ width: '100px' }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.order_items.map((item, idx) => (
                      <tr key={idx} className="border-bottom border-white-5">
                        <td className="py-3 text-white small">
                          <div>{item.dish_name}</div>
                          {((item.selected_variant && (item.selected_variant.size_name || item.selected_variant.extra)) || (Array.isArray(item.selected_addons) && item.selected_addons.filter(a => a && a.addon_name).length > 0)) && (
                            <div className="text-white-60 mt-1" style={{ fontSize: '11px' }}>
                              {item.selected_variant && (item.selected_variant.size_name || item.selected_variant.extra) && (
                                <span>
                                  {item.selected_variant.size_name ? `Size: ${item.selected_variant.size_name}` : ''}
                                  {item.selected_variant.extra && ` (${item.selected_variant.extra})`}
                                </span>
                              )}
                              {item.selected_variant && (item.selected_variant.size_name || item.selected_variant.extra) && Array.isArray(item.selected_addons) && item.selected_addons.filter(a => a && a.addon_name).length > 0 && ' • '}
                              {Array.isArray(item.selected_addons) && item.selected_addons.filter(a => a && a.addon_name).map(addon => `${addon.addon_name} (+₹${addon.price})`).join(' • ')}
                            </div>
                          )}
                        </td>
                        <td className="py-3 text-center text-white-60 small">{item.quantity}</td>
                        <td className="py-3 text-end text-white-60 small">₹{item.dish_price.toFixed(2)}</td>
                        <td className="py-3 text-end text-brand-400 fw-semibold small">₹{(item.dish_price * item.quantity).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Invoice Totals */}
              <div className="d-flex flex-column gap-2 text-white-60 small pt-3 border-top border-white-10">
                <div className="d-flex justify-content-between">
                  <span>Subtotal:</span>
                  <span className="text-white fw-semibold">₹{parseFloat(order.sub_total || 0).toFixed(2)}</span>
                </div>
                {order.cgst_amount > 0 && (
                  <div className="d-flex justify-content-between">
                    <span>CGST ({order.cgst_percent || 0}%):</span>
                    <span className="text-white fw-semibold">₹{parseFloat(order.cgst_amount).toFixed(2)}</span>
                  </div>
                )}
                {order.sgst_amount > 0 && (
                  <div className="d-flex justify-content-between">
                    <span>SGST ({order.sgst_percent || 0}%):</span>
                    <span className="text-white fw-semibold">₹{parseFloat(order.sgst_amount).toFixed(2)}</span>
                  </div>
                )}
                {order.vat_amount > 0 && (
                  <div className="d-flex justify-content-between">
                    <span>VAT ({order.vat_percent || 0}%):</span>
                    <span className="text-white fw-semibold">₹{parseFloat(order.vat_amount).toFixed(2)}</span>
                  </div>
                )}
                {order.discount_amount > 0 && (
                  <div className="d-flex justify-content-between text-danger">
                    <span>Discount:</span>
                    <span className="fw-semibold">-₹{parseFloat(order.discount_amount).toFixed(2)}</span>
                  </div>
                )}
                {order.waveoff_amount > 0 && (
                  <div className="d-flex justify-content-between text-danger">
                    <span>Waveoff:</span>
                    <span className="fw-semibold">-₹{parseFloat(order.waveoff_amount).toFixed(2)}</span>
                  </div>
                )}
                <div className="d-flex justify-content-between pt-3 border-top border-white-10 fs-5">
                  <span className="text-white fw-bold">Grand Total:</span>
                  <span className="text-brand-400 fw-bold">₹{parseFloat(order.total_amount || order.bill_amount || 0).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
