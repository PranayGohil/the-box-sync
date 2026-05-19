import React from 'react';
import CreatableSelect from 'react-select/creatable';

/* Compact POS-style input */
const inputStyle = {
  width: '100%',
  height: '30px',
  padding: '0 8px',
  fontSize: '12px',
  fontWeight: 600,
  color: '#1e293b',
  border: '1.5px solid rgba(226,232,240,0.9)',
  borderRadius: '6px',
  outline: 'none',
  background: '#f8fafc',
  transition: 'all 0.18s',
  boxSizing: 'border-box',
};

const labelStyle = {
  fontSize: '10px',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  color: '#94a3b8',
  marginBottom: '3px',
  display: 'block',
};

const selectStyles = {
  control: (base, state) => ({
    ...base,
    minHeight: '30px',
    height: '30px',
    fontSize: '12px',
    fontWeight: 600,
    color: '#1e293b',
    borderColor: state.isFocused ? 'rgba(35,179,244,0.5)' : 'rgba(226,232,240,0.9)',
    borderRadius: '6px',
    background: '#f8fafc',
    boxShadow: state.isFocused ? '0 0 0 3px rgba(35,179,244,0.1)' : 'none',
    transition: 'all 0.18s',
    cursor: 'text',
    '&:hover': { borderColor: 'rgba(35,179,244,0.4)' },
  }),
  valueContainer: (base) => ({ ...base, padding: '0 8px', height: '32px' }),
  input: (base) => ({ ...base, margin: 0, padding: 0, fontSize: '12.5px' }),
  singleValue: (base) => ({ ...base, fontSize: '12.5px', fontWeight: 600, color: '#1e293b' }),
  placeholder: (base) => ({ ...base, fontSize: '12.5px', color: '#94a3b8', fontWeight: 500 }),
  indicatorsContainer: (base) => ({ ...base, height: '32px' }),
  dropdownIndicator: (base) => ({ ...base, padding: '4px 6px' }),
  clearIndicator: (base) => ({ ...base, padding: '4px 4px' }),
  menu: (base) => ({ ...base, borderRadius: '10px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', border: '1px solid rgba(226,232,240,0.9)', zIndex: 9999 }),
  option: (base, state) => ({
    ...base,
    fontSize: '12.5px',
    fontWeight: state.isSelected ? 700 : 500,
    background: state.isSelected ? '#23b3f4' : state.isFocused ? 'rgba(35,179,244,0.08)' : '#fff',
    color: state.isSelected ? '#fff' : '#1e293b',
    padding: '8px 12px',
  }),
};

const CustomerInfoForm = ({
  customerInfo,
  setCustomerInfo,
  requiredFields = {},
  visibleFields = { name: true, phone: false, address: false, total_persons: true, waiter: true },
  tableInfo = {},
  waiterOptions = [],
  orderStatus,
}) => {
  const isDisabled = orderStatus === 'Paid';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>

      {/* Row 1: Name + Phone/Persons */}
      <div style={{ display: 'flex', gap: '8px' }}>
        {visibleFields.name && (
          <div style={{ flex: visibleFields.phone || visibleFields.total_persons ? 1.5 : 1 }}>
            <label style={labelStyle}>
              Name {requiredFields.name && <span style={{ color: '#ef4444' }}>*</span>}
            </label>
            <input
              type="text"
              style={inputStyle}
              value={customerInfo.name || ''}
              onChange={(e) => setCustomerInfo((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Customer name"
              disabled={isDisabled}
              onFocus={(e) => { e.target.style.borderColor = 'rgba(35,179,244,0.5)'; e.target.style.background = '#fff'; }}
              onBlur={(e) => { e.target.style.borderColor = 'rgba(226,232,240,0.9)'; e.target.style.background = '#f8fafc'; }}
            />
          </div>
        )}
        {visibleFields.phone && (
          <div style={{ flex: 1.2 }}>
            <label style={labelStyle}>
              Phone {requiredFields.phone && <span style={{ color: '#ef4444' }}>*</span>}
            </label>
            <input
              type="tel"
              style={inputStyle}
              value={customerInfo.phone || ''}
              onChange={(e) => setCustomerInfo((prev) => ({ ...prev, phone: e.target.value }))}
              placeholder="Phone"
              disabled={isDisabled}
              onFocus={(e) => { e.target.style.borderColor = 'rgba(35,179,244,0.5)'; e.target.style.background = '#fff'; }}
              onBlur={(e) => { e.target.style.borderColor = 'rgba(226,232,240,0.9)'; e.target.style.background = '#f8fafc'; }}
            />
          </div>
        )}
        {visibleFields.total_persons && (
          <div style={{ flex: 0.8 }}>
            <label style={labelStyle}>
              Pax {requiredFields.total_persons && <span style={{ color: '#ef4444' }}>*</span>}
            </label>
            <input
              type="number"
              style={{ ...inputStyle, textAlign: 'center' }}
              value={customerInfo.total_persons || ''}
              onChange={(e) => setCustomerInfo((prev) => ({ ...prev, total_persons: e.target.value }))}
              placeholder="0"
              max={tableInfo.max_person}
              disabled={isDisabled}
              onFocus={(e) => { e.target.style.borderColor = 'rgba(35,179,244,0.5)'; e.target.style.background = '#fff'; }}
              onBlur={(e) => { e.target.style.borderColor = 'rgba(226,232,240,0.9)'; e.target.style.background = '#f8fafc'; }}
            />
          </div>
        )}
      </div>

      {/* Row 3: Address */}
      {visibleFields.address && (
        <div>
          <label style={labelStyle}>
            Address {requiredFields.address && <span style={{ color: '#ef4444' }}>*</span>}
          </label>
          <textarea
            style={{ ...inputStyle, height: '56px', padding: '6px 10px', resize: 'none', lineHeight: 1.4 }}
            value={customerInfo.address || ''}
            onChange={(e) => setCustomerInfo((prev) => ({ ...prev, address: e.target.value }))}
            placeholder="Delivery address"
            disabled={isDisabled}
            onFocus={(e) => { e.target.style.borderColor = 'rgba(35,179,244,0.5)'; e.target.style.background = '#fff'; }}
            onBlur={(e) => { e.target.style.borderColor = 'rgba(226,232,240,0.9)'; e.target.style.background = '#f8fafc'; }}
          />
        </div>
      )}

      {/* Row 4: Waiter */}
      {visibleFields.waiter && (
        <div>
          <label style={labelStyle}>
            Waiter {requiredFields.waiter && <span style={{ color: '#ef4444' }}>*</span>}
          </label>
          <CreatableSelect
            isClearable
            isDisabled={isDisabled}
            options={waiterOptions}
            value={customerInfo.waiter ? { label: customerInfo.waiter, value: customerInfo.waiter } : null}
            onChange={(selected) => setCustomerInfo((prev) => ({ ...prev, waiter: selected ? selected.value : '' }))}
            placeholder="Select or type waiter name"
            classNamePrefix="react-select"
            styles={selectStyles}
            menuPortalTarget={document.body}
            menuPosition="fixed"
          />
        </div>
      )}
    </div>
  );
};

export default CustomerInfoForm;
