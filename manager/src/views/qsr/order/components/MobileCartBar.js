import React from 'react';
import CsLineIcons from 'cs-line-icons/CsLineIcons';

const MobileCartBar = ({ orderItems, paymentData, setShowCartSheet }) => {
  if (orderItems.length === 0) return null;

  const totalQty = orderItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = parseFloat(paymentData.total) || 0;

  return (
    <>
      <style>{`
        @media (max-width: 1199px) {
          .mobile-cart-bar {
            position: fixed; 
            bottom: 0; 
            left: 0; 
            right: 0;
            background: #ffffff; 
            padding: 12px 16px;
            z-index: 1040; 
            cursor: pointer;
            box-shadow: 0 -4px 20px rgba(0,0,0,0.1);
            border-top: 1px solid rgba(226,232,240,0.9);
            display: flex !important;
            justify-content: space-between;
            align-items: center;
            animation: slideUp 0.3s ease;
          }
          @keyframes slideUp {
            from { transform: translateY(100%); }
            to { transform: translateY(0); }
          }
          .mobile-sticky-spacer { height: 72px; }
        }
        @media (min-width: 1200px) {
          .mobile-cart-bar, .mobile-sticky-spacer { display: none !important; }
        }
      `}</style>

      <div className="mobile-sticky-spacer" />
      <div
        role="button"
        tabIndex={0}
        className="mobile-cart-bar"
        onClick={() => setShowCartSheet(true)}
        onKeyDown={(e) => e.key === 'Enter' && setShowCartSheet(true)}
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
            <div style={{ fontWeight: 800, fontSize: '16px', color: '#1e293b', lineHeight: 1 }}>₹{totalAmount.toFixed(2)}</div>
            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>View details</div>
          </div>
        </div>
        <div style={{ fontWeight: 700, color: '#23b3f4', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
          View Cart <CsLineIcons icon="chevron-right" size="14" />
        </div>
      </div>
    </>
  );
};

export default MobileCartBar;
