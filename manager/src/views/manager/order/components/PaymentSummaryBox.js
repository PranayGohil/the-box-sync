import React, { useState } from 'react';
import { Button, Modal, Badge } from 'react-bootstrap';
import CsLineIcons from 'cs-line-icons/CsLineIcons';

const PaymentSummaryBox = ({
  orderItems, isDirty, orderStatus, isLoading, printing,
  paymentData, orderId, handleSaveOrder, handleOpenPaymentModal,
  setShowCancelModal, handlePrint, history, setShowCartSheet,
  onKotAndPrint, kotPrinting, kotHistory = [], onReprintKOT,
  paymentHistory = [], alreadyPaid = 0, canKOT = false,
}) => {
  const [showKotHistory, setShowKotHistory] = useState(false);
  const [showPaymentHistory, setShowPaymentHistory] = useState(false);

  const isPaid = orderStatus === 'Paid';
  const showKOTButtons =
    (orderStatus === 'Save' || (orderStatus !== 'Paid' && isDirty) || (isPaid && isDirty)) &&
    orderItems.length > 0;

  const totalAmount = parseFloat(paymentData.total) || 0;
  const totalPaid = paymentHistory.reduce((sum, p) => sum + parseFloat(p.amount), 0) || alreadyPaid;
  const dueAmount = Math.max(0, totalAmount - totalPaid);
  const totalQty = orderItems.reduce((sum, item) => sum + item.quantity, 0);

  // ─── Styles ───────────────────────────────────────────────────────────────
  const btnBase = {
    width: '100%',
    padding: '0.6rem',
    borderRadius: '10px',
    fontSize: '13px',
    fontWeight: 700,
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    transition: 'all 0.18s ease',
  };

  return (
    <>
      {/* ── Mobile sticky bar ── */}
      <style>{`
        @media (max-width: 991px) {
          .mobile-cart-bar {
            position: fixed; bottom: 0; left: 0; right: 0;
            background: #fff; padding: 12px 16px;
            z-index: 1040; cursor: pointer;
            box-shadow: 0 -4px 20px rgba(0,0,0,0.1);
            border-top: 1px solid rgba(226,232,240,0.9);
          }
          .mobile-sticky-spacer { height: 72px; }
        }
      `}</style>

      <div className="mobile-sticky-spacer d-lg-none" />

      {orderItems.length > 0 && (
        <div
          role="button"
          tabIndex={0}
          className="d-lg-none mobile-cart-bar d-flex justify-content-between align-items-center"
          onClick={() => setShowCartSheet && setShowCartSheet(true)}
          onKeyDown={(e) => e.key === 'Enter' && setShowCartSheet && setShowCartSheet(true)}
        >
          <div className="d-flex align-items-center gap-3">
            <div
              style={{
                width: '40px', height: '40px', borderRadius: '12px',
                background: '#23b3f4', color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 800, fontSize: '16px',
              }}
            >
              {totalQty}
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '16px', color: '#1e293b', lineHeight: 1 }}>₹{paymentData.total}</div>
              <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                {dueAmount > 0.01 ? `Due: ₹${dueAmount.toFixed(2)}` : 'Fully Paid'}
              </div>
            </div>
          </div>
          <div style={{ fontWeight: 700, color: '#23b3f4', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            View Cart <CsLineIcons icon="chevron-right" size="14" />
          </div>
        </div>
      )}

      {/* ── Desktop panel ── */}
      <div className="d-none d-lg-block">

        {/* Total display */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(35,179,244,0.06), rgba(35,179,244,0.02))',
            borderRadius: '12px',
            border: '1px solid rgba(35,179,244,0.15)',
            padding: '12px 14px',
            marginBottom: '12px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: '#94a3b8' }}>
                Order Total
              </div>
              <div style={{ fontSize: '22px', fontWeight: 900, color: '#1e293b', lineHeight: 1.1, marginTop: '2px' }}>
                ₹{totalAmount.toFixed(2)}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>{totalQty} item{totalQty !== 1 ? 's' : ''}</div>
              {totalPaid > 0 && (
                <div style={{ fontSize: '11px', marginTop: '3px' }}>
                  Paid: <span style={{ fontWeight: 700, color: '#10b981' }}>₹{totalPaid.toFixed(2)}</span>
                </div>
              )}
              {dueAmount > 0.01 && (
                <div style={{ fontSize: '12px', fontWeight: 800, color: '#ef4444', marginTop: '2px' }}>
                  Due: ₹{dueAmount.toFixed(2)}
                </div>
              )}
              {totalPaid > 0 && dueAmount <= 0.01 && (
                <div style={{ fontSize: '12px', fontWeight: 800, color: '#10b981', marginTop: '2px' }}>✓ Fully Paid</div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>

          {/* Save Changes */}
          {orderItems.length > 0 && isDirty && (
            <button
              type="button"
              style={{ ...btnBase, background: '#f1f5f9', color: '#475569', border: '1.5px solid rgba(226,232,240,0.9)' }}
              onClick={() => handleSaveOrder('Save')}
              disabled={isLoading}
            >
              <CsLineIcons icon="save" size="14" />
              Save Changes
            </button>
          )}

          {/* Send to Kitchen (KOT) */}
          {canKOT && showKOTButtons && (
            <button
              type="button"
              style={{ ...btnBase, background: 'rgba(35,179,244,0.08)', color: '#23b3f4', border: '1.5px solid rgba(35,179,244,0.3)' }}
              onClick={() => handleSaveOrder('KOT')}
              disabled={isLoading}
            >
              <CsLineIcons icon="send" size="14" />
              Send to Kitchen
            </button>
          )}

          {/* KOT + Print */}
          {showKOTButtons && (
            <button
              type="button"
              style={{ ...btnBase, background: 'rgba(245,158,11,0.08)', color: '#d97706', border: '1.5px solid rgba(245,158,11,0.3)' }}
              onClick={onKotAndPrint}
              disabled={isLoading || kotPrinting}
            >
              <CsLineIcons icon="print" size="14" />
              {kotPrinting ? 'Printing...' : 'Order Print'}
            </button>
          )}

          {/* Process Payment — primary CTA */}
          {(orderStatus === 'KOT' || (orderStatus === 'Save' && orderItems.length > 0) || (isPaid && dueAmount > 0.01)) && (
            <button
              type="button"
              style={{ ...btnBase, background: '#23b3f4', color: '#ffffff', boxShadow: '0 4px 14px rgba(35,179,244,0.35)' }}
              onClick={handleOpenPaymentModal}
            >
              <CsLineIcons icon="credit-card" size="14" stroke="#fff" />
              {dueAmount > 0.01 && totalPaid > 0 ? 'Pay Balance' : 'Process Payment'}
            </button>
          )}

          {/* Print Bill + Go Dashboard when Paid */}
          {isPaid && !isDirty && dueAmount <= 0.01 && (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                style={{ ...btnBase, flex: 1, background: '#23b3f4', color: '#fff', boxShadow: '0 4px 14px rgba(35,179,244,0.3)' }}
                onClick={() => history.push('/dashboard')}
              >
                <CsLineIcons icon="home" size="14" stroke="#fff" />
                Dashboard
              </button>
              {orderId && (
                <button
                  type="button"
                  style={{ ...btnBase, flex: 1, background: '#f1f5f9', color: '#475569', border: '1.5px solid rgba(226,232,240,0.9)' }}
                  onClick={() => handlePrint(orderId)}
                  disabled={printing}
                >
                  <CsLineIcons icon="print" size="14" />
                  {printing ? 'Printing...' : 'Print Bill'}
                </button>
              )}
            </div>
          )}

          {/* Secondary row: History + Cancel */}
          {(kotHistory.length > 0 || paymentHistory.length > 0 || (orderId && orderStatus !== 'Paid')) && (
            <div style={{ display: 'flex', gap: '6px', marginTop: '2px' }}>
              {kotHistory.length > 0 && (
                <button
                  type="button"
                  style={{ ...btnBase, flex: 1, background: 'transparent', color: '#94a3b8', border: '1px solid rgba(226,232,240,0.9)', fontSize: '11px', padding: '0.4rem' }}
                  onClick={() => setShowKotHistory(true)}
                >
                  <CsLineIcons icon="history" size="12" />
                  Prints ({kotHistory.length})
                </button>
              )}
              {paymentHistory.length > 0 && (
                <button
                  type="button"
                  style={{ ...btnBase, flex: 1, background: 'transparent', color: '#94a3b8', border: '1px solid rgba(226,232,240,0.9)', fontSize: '11px', padding: '0.4rem' }}
                  onClick={() => setShowPaymentHistory(true)}
                >
                  <CsLineIcons icon="credit-card" size="12" />
                  Payments ({paymentHistory.length})
                </button>
              )}
              {orderId && orderStatus !== 'Paid' && (
                <button
                  type="button"
                  style={{ ...btnBase, flex: 1, background: 'transparent', color: '#ef4444', border: '1px solid rgba(239,68,68,0.25)', fontSize: '11px', padding: '0.4rem' }}
                  onClick={() => setShowCancelModal(true)}
                  disabled={isLoading}
                >
                  <CsLineIcons icon="close" size="12" />
                  Cancel
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── KOT History Modal ── */}
      <Modal show={showKotHistory} onHide={() => setShowKotHistory(false)} centered>
        <Modal.Header closeButton style={{ borderBottom: '1px solid rgba(226,232,240,0.8)' }}>
          <Modal.Title style={{ fontSize: '15px', fontWeight: 800, color: '#1e293b' }}>Order Print History</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ maxHeight: '60vh', overflowY: 'auto' }}>
          {kotHistory.length === 0 ? (
            <p className="text-muted text-center py-3">No order prints yet</p>
          ) : (
            [...kotHistory].reverse().map((record) => (
              <div key={record.id} style={{ border: '1px solid rgba(226,232,240,0.9)', borderRadius: '10px', padding: '12px', marginBottom: '8px' }}>
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <div>
                    <Badge bg="dark" className="me-2">Print #{record.kotNo}</Badge>
                    <small className="text-muted">{new Date(record.timestamp).toLocaleTimeString('en-IN')}</small>
                  </div>
                  <Button size="sm" variant="outline-primary" onClick={() => onReprintKOT && onReprintKOT(record)} disabled={kotPrinting}>
                    Reprint
                  </Button>
                </div>
                <ul className="mb-0 ps-4" style={{ fontSize: '13px' }}>
                  {record.items.map((item, i) => (
                    <li key={i}>
                      {item.dish_name} × {item.quantity}
                      {item.special_notes && <span className="text-muted ms-1">({item.special_notes})</span>}
                    </li>
                  ))}
                </ul>
              </div>
            ))
          )}
        </Modal.Body>
        <Modal.Footer style={{ borderTop: '1px solid rgba(226,232,240,0.8)' }}>
          <Button variant="secondary" onClick={() => setShowKotHistory(false)}>Close</Button>
        </Modal.Footer>
      </Modal>

      {/* ── Payment History Modal ── */}
      <Modal show={showPaymentHistory} onHide={() => setShowPaymentHistory(false)} centered>
        <Modal.Header closeButton style={{ borderBottom: '1px solid rgba(226,232,240,0.8)' }}>
          <Modal.Title style={{ fontSize: '15px', fontWeight: 800, color: '#1e293b' }}>Payment History</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ maxHeight: '60vh', overflowY: 'auto' }}>
          <div style={{ background: 'rgba(35,179,244,0.05)', borderRadius: '10px', padding: '12px', textAlign: 'center', marginBottom: '12px', border: '1px solid rgba(35,179,244,0.15)' }}>
            <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Order Total</div>
            <div style={{ fontSize: '22px', fontWeight: 900, color: '#1e293b' }}>₹{totalAmount.toFixed(2)}</div>
          </div>
          {paymentHistory.length === 0 ? (
            <p className="text-muted text-center">No payments recorded yet</p>
          ) : (
            [...paymentHistory].reverse().map((record) => (
              <div key={record.id} style={{ border: '1px solid rgba(226,232,240,0.9)', borderRadius: '10px', padding: '12px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '16px', color: '#10b981' }}>₹{parseFloat(record.amount).toFixed(2)}</div>
                  <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>{record.type} • {new Date(record.timestamp).toLocaleString('en-IN')}</div>
                </div>
                <Badge bg="success">Paid</Badge>
              </div>
            ))
          )}
          <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid rgba(226,232,240,0.8)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 700, fontSize: '13px' }}>Total Paid:</span>
            <span style={{ fontWeight: 800, color: '#10b981', fontSize: '15px' }}>₹{totalPaid.toFixed(2)}</span>
          </div>
          {dueAmount > 0.01 && (
            <div style={{ marginTop: '6px', padding: '8px 12px', background: 'rgba(239,68,68,0.05)', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.15)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 700, fontSize: '13px' }}>Remaining Due:</span>
              <span style={{ fontWeight: 800, color: '#ef4444', fontSize: '15px' }}>₹{dueAmount.toFixed(2)}</span>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer style={{ borderTop: '1px solid rgba(226,232,240,0.8)' }}>
          <Button variant="secondary" onClick={() => setShowPaymentHistory(false)}>Close</Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default PaymentSummaryBox;
