import React from 'react';
import CsLineIcons from 'cs-line-icons/CsLineIcons';

const statusConfig = {
  Completed: { label: 'Done', bg: '#dcfce7', color: '#16a34a' },
  Preparing: { label: 'Prep', bg: '#dbeafe', color: '#2563eb' },
  Pending:   { label: 'Pend',  bg: '#fef9c3', color: '#ca8a04' },
};

const OrderCartTable = ({ orderItems, updateItemQuantity, removeItem }) => {
  if (orderItems.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 16px', color: '#94a3b8' }}>
        <div style={{ fontSize: '32px', marginBottom: '8px', opacity: 0.5 }}><span role="img" aria-label="cart">🛒</span></div>
        <p style={{ fontWeight: 700, color: '#64748b', margin: 0, fontSize: '13px' }}>Cart is empty</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {orderItems.map((item, index) => {
        const st = statusConfig[item.status] || null;
        const isLocked = item.status === 'Completed';
        return (
          <div
            key={index}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '3px 10px',
              borderBottom: '1px solid rgba(226,232,240,0.6)',
              background: index % 2 === 0 ? '#ffffff' : '#f8fafc',
              transition: 'background 0.15s',
            }}
          >
            {/* Name + Status Pill */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ 
                fontSize: '11px', 
                fontWeight: 700, 
                color: '#1e293b', 
                lineHeight: 1.1, 
                overflow: 'hidden', 
                textOverflow: 'ellipsis', 
                whiteSpace: 'nowrap' 
              }}>
                {item.dish_name}
              </div>
              {st && (
                <span style={{ 
                  display: 'inline-block', 
                  fontSize: '9px', 
                  fontWeight: 800, 
                  padding: '0px 6px', 
                  borderRadius: '4px', 
                  background: st.bg, 
                  color: st.color,
                  textTransform: 'uppercase'
                }}>
                  {st.label}
                </span>
              )}
            </div>

            {/* Price & Qty Stepper */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                <button
                  type="button"
                  onClick={() => updateItemQuantity(index, -1)}
                  disabled={item.quantity <= 1 || isLocked}
                  style={{
                    width: '20px', height: '20px', borderRadius: '5px',
                    border: '1px solid rgba(226,232,240,0.9)',
                    background: '#fff', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '12px', fontWeight: 700, color: '#475569',
                    padding: 0,
                  }}
                >−</button>

                <span style={{ minWidth: '14px', textAlign: 'center', fontWeight: 800, fontSize: '12px', color: '#1e293b' }}>
                  {item.quantity}
                </span>

                <button
                  type="button"
                  onClick={() => updateItemQuantity(index, 1)}
                  disabled={isLocked}
                  style={{
                    width: '20px', height: '20px', borderRadius: '5px',
                    border: '1px solid rgba(35,179,244,0.3)',
                    background: 'rgba(35,179,244,0.05)', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '12px', fontWeight: 700, color: '#23b3f4',
                    padding: 0,
                  }}
                >+</button>
              </div>

              <div style={{ minWidth: '35px', textAlign: 'right', fontWeight: 800, fontSize: '11.5px', color: '#23b3f4' }}>
                ₹{(item.dish_price * item.quantity).toFixed(0)}
              </div>

              <button
                type="button"
                onClick={() => removeItem(index)}
                style={{
                  width: '20px', height: '20px', borderRadius: '5px',
                  border: 'none', background: 'transparent',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#ef4444', padding: 0, opacity: 0.6
                }}
              >
                <CsLineIcons icon="bin" size="11" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default OrderCartTable;
