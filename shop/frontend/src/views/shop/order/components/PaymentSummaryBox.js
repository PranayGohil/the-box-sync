import React from 'react';
import CsLineIcons from 'cs-line-icons/CsLineIcons';

const PaymentSummaryBox = ({
  orderItems = [],
  isDirty = false,
  orderStatus = 'Save',
  isLoading = false,
  printing = false,
  paymentData = {},
  orderId = null,
  handleSaveOrder,
  handleOpenPaymentModal,
  handlePrint,
  paymentHistory = [],
  alreadyPaid = 0,
}) => {
  const isPaid = orderStatus === 'Paid';
  const totalAmount = parseFloat(paymentData.total) || 0;
  const totalPaid = paymentHistory.reduce((sum, p) => sum + parseFloat(p.amount), 0) || alreadyPaid;
  const dueAmount = Math.max(0, totalAmount - totalPaid);
  const totalQty = orderItems.reduce((sum, item) => sum + item.quantity, 0);

  const btnBase = {
    width: '100%',
    padding: '0.6rem',
    borderRadius: '8px',
    fontSize: '12.5px',
    fontWeight: 700,
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '5px',
    transition: 'all 0.18s ease',
  };

  return (
    <div>
      {/* Total display */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(35,179,244,0.06), rgba(35,179,244,0.02))',
          borderRadius: '10px',
          border: '1px solid rgba(35,179,244,0.15)',
          padding: '10px 12px',
          marginBottom: '8px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="d-flex align-items-baseline gap-2">
            <span style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#94a3b8' }}>
              Total:
            </span>
            <span style={{ fontSize: '18px', fontWeight: 900, color: '#1e293b' }}>
              ₹{totalAmount.toFixed(0)}
            </span>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 700 }}>{totalQty} items</div>
            {dueAmount > 0.01 && totalPaid > 0 && (
              <div style={{ fontSize: '10px', fontWeight: 800, color: '#ef4444' }}>
                Due: ₹{dueAmount.toFixed(0)}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons: Just Save & Payment */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
        {isPaid && !isDirty && dueAmount <= 0.01 ? (
          <div style={{ display: 'flex', gap: '8px', gridColumn: 'span 2' }}>
            <button
              type="button"
              style={{ ...btnBase, flex: 1, background: '#23b3f4', color: '#fff', boxShadow: '0 4px 14px rgba(35,179,244,0.3)' }}
              onClick={() => {
                window.location.href = '/order/new';
              }}
            >
              <CsLineIcons icon="plus" size="14" stroke="#fff" />
              New Order
            </button>
            {orderId && (
              <button
                type="button"
                style={{ ...btnBase, flex: 1, background: '#f1f5f9', color: '#475569', border: '1.5px solid rgba(226,232,240,0.9)' }}
                onClick={() => {
                  if (handlePrint) handlePrint(orderId);
                }}
                disabled={printing}
              >
                <CsLineIcons icon="print" size="14" />
                {printing ? 'Printing...' : 'Print Bill'}
              </button>
            )}
          </div>
        ) : (
          <>
            <button
              type="button"
              style={{
                ...btnBase,
                background: 'transparent',
                color: '#23b3f4',
                border: '1.5px solid #23b3f4',
                gridColumn: 'span 1',
              }}
              onClick={() => {
                if (handleSaveOrder) handleSaveOrder('Save');
              }}
              disabled={isLoading || orderItems.length === 0}
            >
              {isLoading ? (
                <CsLineIcons icon="spinner" size="14" className="spin" />
              ) : (
                <CsLineIcons icon="save" size="14" />
              )}
              Save
            </button>
            <button
              type="button"
              style={{
                ...btnBase,
                background: '#23b3f4',
                color: '#ffffff',
                boxShadow: '0 4px 12px rgba(35, 179, 244, 0.3)',
                gridColumn: 'span 1',
              }}
              onClick={handleOpenPaymentModal}
              disabled={orderItems.length === 0}
            >
              <CsLineIcons icon="credit-card" size="13" stroke="#fff" />
              {dueAmount > 0.01 && totalPaid > 0 ? 'Pay' : 'Payment'}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentSummaryBox;
