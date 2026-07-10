import React, { useState } from 'react';
import { Offcanvas, Button, Badge, Modal } from 'react-bootstrap';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import OrderCartTable from './OrderCartTable';

const BottomCartSheet = ({
  showCartSheet, setShowCartSheet, orderItems, updateItemQuantity, removeItem,
  isDirty, orderStatus, isLoading, printing, paymentData, orderId,
  handleSaveOrder, handleOpenPaymentModal, setShowCancelModal, handlePrint, history, children,
  alreadyPaid = 0, canKOT = false,
  onKotAndPrint, kotPrinting, kotHistory = [], onReprintKOT,
  paymentHistory = [],
}) => {
  const [showKotHistory, setShowKotHistory] = useState(false);
  const [showPaymentHistory, setShowPaymentHistory] = useState(false);

  const isPaid = orderStatus === 'Paid';
  const showKOTButtons = (orderStatus === 'Save' || (orderStatus !== 'Paid' && isDirty) || (isPaid && isDirty)) && orderItems.length > 0;
  const totalAmount = parseFloat(paymentData.total);
  const totalPaid = paymentHistory.reduce((sum, p) => sum + parseFloat(p.amount), 0) || alreadyPaid;
  const dueAmount = Math.max(0, totalAmount - totalPaid);

  return (
    <>
      <Offcanvas
        show={showCartSheet}
        onHide={() => setShowCartSheet(false)}
        placement="bottom"
        style={{ height: '90vh', borderTopLeftRadius: '1.5rem', borderTopRightRadius: '1.5rem' }}
      >
        <Offcanvas.Header closeButton className="border-bottom">
          <Offcanvas.Title className="fw-bold">Your Cart ({orderItems.reduce((sum, item) => sum + item.quantity, 0)})</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body className="p-0">
          <div className="p-3 h-100 overflow-auto bg-white">
            {children && <div className="mb-3">{children}</div>}
            <h6 className="mb-3 fw-bold text-muted border-bottom pb-2">Cart Items</h6>
            <OrderCartTable orderItems={orderItems} updateItemQuantity={updateItemQuantity} removeItem={removeItem} />

            {/* History buttons - compact row */}
            {(kotHistory.length > 0 || paymentHistory.length > 0) && (
              <div className="d-flex gap-2 mt-3 flex-wrap">
                {kotHistory.length > 0 && (
                  <Button variant="outline-secondary" size="sm" onClick={() => setShowKotHistory(true)}>
                    Order Print History ({kotHistory.length})
                  </Button>
                )}
                {paymentHistory.length > 0 && (
                  <Button variant="outline-info" size="sm" onClick={() => setShowPaymentHistory(true)}>
                    Payments ({paymentHistory.length})
                  </Button>
                )}
              </div>
            )}
          </div>
        </Offcanvas.Body>

        {/* Footer Actions */}
        <div className="p-3 border-top bg-light" style={{ zIndex: 10 }}>
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(35,179,244,0.06), rgba(35,179,244,0.02))',
              borderRadius: '10px',
              border: '1px solid rgba(35,179,244,0.15)',
              padding: '10px 12px',
              marginBottom: '12px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <div className="d-flex align-items-baseline gap-2">
              <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#94a3b8' }}>
                Total:
              </span>
              <span style={{ fontSize: '20px', fontWeight: 900, color: '#1e293b' }}>
                ₹{totalAmount.toFixed(2)}
              </span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>{orderItems.reduce((sum, item) => sum + item.quantity, 0)} items</div>
              {dueAmount > 0.01 && totalPaid > 0 && (
                <div style={{ fontSize: '11px', fontWeight: 800, color: '#ef4444' }}>
                  Due: ₹{dueAmount.toFixed(0)}
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {/* Save Changes */}
            {orderItems.length > 0 && isDirty && (
              <button
                type="button"
                style={{ width: '100%', padding: '0.6rem', borderRadius: '10px', fontSize: '13px', fontWeight: 700, border: '1.5px solid rgba(226,232,240,0.9)', background: '#f1f5f9', color: '#475569', cursor: 'pointer' }}
                onClick={() => handleSaveOrder('Save')}
                disabled={isLoading}
              >
                Save
              </button>
            )}
            {/* Send to Kitchen */}
            {canKOT && showKOTButtons && (
              <button
                type="button"
                style={{ width: '100%', padding: '0.6rem', borderRadius: '10px', fontSize: '13px', fontWeight: 700, background: 'rgba(35,179,244,0.08)', color: '#23b3f4', border: '1.5px solid rgba(35,179,244,0.3)', cursor: 'pointer' }}
                onClick={() => handleSaveOrder('KOT')}
                disabled={isLoading}
              >
                Kitchen
              </button>
            )}
            {/* Order Print */}
            {showKOTButtons && (
              <button
                type="button"
                style={{ width: '100%', padding: '0.6rem', borderRadius: '10px', fontSize: '13px', fontWeight: 700, background: 'rgba(245,158,11,0.08)', color: '#d97706', border: '1.5px solid rgba(245,158,11,0.3)', cursor: 'pointer' }}
                onClick={() => {
                  setShowCartSheet(false);
                  if (onKotAndPrint) {
                    onKotAndPrint();
                  }
                }}
                disabled={isLoading || kotPrinting}
              >
                {kotPrinting ? '...' : 'Order Print'}
              </button>
            )}
            {/* Cancel Order */}
            {orderId && orderStatus !== 'Paid' && (
              <button
                type="button"
                style={{ width: '100%', padding: '0.6rem', borderRadius: '10px', fontSize: '13px', fontWeight: 700, background: 'transparent', color: '#ef4444', border: '1.5px solid rgba(239,68,68,0.25)', cursor: 'pointer' }}
                onClick={() => setShowCancelModal(true)}
                disabled={isLoading}
              >
                Cancel
              </button>
            )}
            {/* Paid state: Go to Dashboard + Print Bill */}
            {isPaid && !isDirty && dueAmount <= 0.01 ? (
              <>
                <button
                  type="button"
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '10px', fontSize: '13px', fontWeight: 700, background: '#23b3f4', color: '#fff', border: 'none', cursor: 'pointer' }}
                  onClick={() => history.push('/dashboard')}
                >
                  Dashboard
                </button>
                {orderId && (
                  <button
                    type="button"
                    style={{ width: '100%', padding: '0.6rem', borderRadius: '10px', fontSize: '13px', fontWeight: 700, background: '#f1f5f9', color: '#475569', border: '1.5px solid rgba(226,232,240,0.9)', cursor: 'pointer' }}
                    onClick={() => handlePrint(orderId)}
                    disabled={printing}
                  >
                    {printing ? '...' : 'Print Bill'}
                  </button>
                )}
              </>
            ) : (
              (orderStatus === 'KOT' || (orderStatus === 'Save' && orderItems.length > 0) || (isPaid && dueAmount > 0.01)) && (
                <button
                  type="button"
                  style={{ 
                    width: '100%', padding: '0.6rem', borderRadius: '10px', fontSize: '13px', fontWeight: 700, 
                    background: '#23b3f4', color: '#fff', border: 'none', boxShadow: '0 4px 12px rgba(35,179,244,0.3)', 
                    cursor: 'pointer',
                    gridColumn: (isDirty || showKOTButtons) ? 'span 1' : 'span 2'
                  }}
                  onClick={() => { setShowCartSheet(false); handleOpenPaymentModal(); }}
                >
                  {dueAmount > 0.01 && totalPaid > 0 ? 'Pay' : 'Payment'}
                </button>
              )
            )}
          </div>
        </div>
      </Offcanvas>

      {/* Order Print History Modal */}
      <Modal 
        show={showKotHistory} 
        onHide={() => setShowKotHistory(false)} 
        centered 
        className="modal-custom-confirm"
        size="md"
      >
        <style>{`
          .modal-custom-confirm .modal-content { border-radius: 20px; border: none; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15); overflow: hidden; }
          .modal-custom-confirm .modal-header { background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border-bottom: 1px solid #e2e8f0; padding: 20px 24px; }
          .modal-custom-confirm .modal-title { font-weight: 800; color: #1e293b; display: flex; align-items: center; gap: 10px; }
          .modal-custom-confirm .modal-body { padding: 20px; background: #fff; }
          .modal-custom-confirm .modal-footer { background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 15px 24px; }
          .history-card { border: 1.5px solid #f1f5f9; border-radius: 12px; padding: 15px; margin-bottom: 12px; transition: all 0.2s ease; background: #fff; }
          .history-card:hover { border-color: #23b3f4; background: rgba(35,179,244,0.02); }
        `}</style>
        <Modal.Header closeButton>
          <Modal.Title>
            <div style={{ background: '#23b3f4', width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
              <CsLineIcons icon="print" size="20" />
            </div>
            Order Print History
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ maxHeight: '65vh', overflowY: 'auto' }}>
          {kotHistory.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <CsLineIcons icon="info-circle" size="40" className="mb-3 opacity-20" />
              <p className="fw-bold mb-0">No order prints found</p>
            </div>
          ) : (
            [...kotHistory].reverse().map((record) => (
              <div key={record.id} className="history-card">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div className="d-flex align-items-center gap-2">
                    <span style={{ background: '#1e293b', color: '#fff', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 800 }}>
                      PRINT #{record.kotNo}
                    </span>
                    <span className="text-muted small fw-semibold">
                      {new Date(record.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                    </span>
                  </div>
                  <button 
                    type="button"
                    className="btn-qsr-blue py-1 px-3"
                    style={{ fontSize: '12px' }}
                    onClick={() => onReprintKOT && onReprintKOT(record)}
                    disabled={kotPrinting}
                  >
                    Reprint
                  </button>
                </div>
                <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '10px' }}>
                  <ul className="mb-0 ps-0 list-unstyled">
                    {record.items.map((item, i) => (
                      <li key={i} className="d-flex justify-content-between align-items-baseline mb-1 border-bottom border-white pb-1">
                        <div style={{ fontSize: '13px', color: '#334155', fontWeight: 600 }}>
                          {item.dish_name}
                          {item.special_notes && <div className="text-muted" style={{ fontSize: '10px', fontWeight: 400 }}>Note: {item.special_notes}</div>}
                        </div>
                        <div className="fw-bold ms-2" style={{ color: '#23b3f4', fontSize: '13px' }}>×{item.quantity}</div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))
          )}
        </Modal.Body>
        <Modal.Footer>
          <button type="button" className="btn-qsr-secondary w-100" onClick={() => setShowKotHistory(false)}>Close History</button>
        </Modal.Footer>
      </Modal>

      {/* Payment History Modal */}
      <Modal 
        show={showPaymentHistory} 
        onHide={() => setShowPaymentHistory(false)} 
        centered
        className="modal-custom-confirm"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <div style={{ background: '#10b981', width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
              <CsLineIcons icon="credit-card" size="20" />
            </div>
            Payment History
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ maxHeight: '65vh', overflowY: 'auto' }}>
          <div className="mb-4 p-3 rounded-4 text-center" style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(16,185,129,0.02))', border: '1.5px solid rgba(16,185,129,0.2)' }}>
            <div className="text-muted small fw-bold text-uppercase mb-1">Total Bill Amount</div>
            <div className="h3 mb-0 fw-bold text-success">₹{totalAmount.toFixed(2)}</div>
          </div>
          
          {paymentHistory.length === 0 ? (
            <div className="text-center py-4 text-muted">
              <p className="fw-bold mb-0">No payments recorded yet</p>
            </div>
          ) : (
            [...paymentHistory].reverse().map((record) => (
              <div key={record.id} className="history-card d-flex justify-content-between align-items-center">
                <div>
                  <div className="fw-bold h5 mb-0 text-success">₹{parseFloat(record.amount).toFixed(2)}</div>
                  <div className="text-muted" style={{ fontSize: '11px', fontWeight: 600 }}>
                    {record.type} • {new Date(record.timestamp).toLocaleString('en-IN')}
                  </div>
                </div>
                <div style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', padding: '4px 10px', borderRadius: '50px', fontSize: '11px', fontWeight: 800 }}>
                  SUCCESS
                </div>
              </div>
            ))
          )}

          <div className="mt-4 pt-3 border-top">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="fw-bold text-muted small">Total Paid:</span>
              <span className="fw-bold text-success h5 mb-0">₹{totalPaid.toFixed(2)}</span>
            </div>
            {dueAmount > 0.01 && (
              <div className="d-flex justify-content-between align-items-center p-3 rounded-3 mt-2" style={{ background: '#fef2f2', border: '1px solid #fee2e2' }}>
                <span className="fw-bold text-danger">Remaining Due:</span>
                <span className="fw-bold text-danger h5 mb-0">₹{dueAmount.toFixed(2)}</span>
              </div>
            )}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <button type="button" className="btn-qsr-secondary w-100" onClick={() => setShowPaymentHistory(false)}>Close History</button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default BottomCartSheet;
