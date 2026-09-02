import React, { useState } from 'react';
import { StateCitySelect } from './StateCitySelect';

export const formatAddress = (addr) => {
  if (!addr) return 'Not specified';
  const parts = [
    addr.street || addr.addressLine1,
    addr.city,
    addr.state ? `${addr.state}${addr.pincode ? ` - ${addr.pincode}` : ''}` : addr.pincode,
    addr.country || 'India'
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : 'Not specified';
};

export const ShippingAddressSection = ({
  billingAddress,
  shippingAddress,
  onChange,
  sameAsBilling,
  setSameAsBilling,
  title = 'Shipping / Delivery Address'
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleFieldChange = (field, value) => {
    onChange({
      ...shippingAddress,
      [field]: value
    });
  };

  const handleCopyBilling = () => {
    if (billingAddress) {
      onChange({
        street: billingAddress.street || billingAddress.addressLine1 || '',
        city: billingAddress.city || '',
        state: billingAddress.state || '',
        stateCode: billingAddress.stateCode || '',
        pincode: billingAddress.pincode || '',
        country: billingAddress.country || 'India'
      });
    }
  };

  return (
    <div className="card border mb-4 shadow-sm" style={{ borderRadius: '10px', overflow: 'hidden' }}>
      <div className="card-header bg-light py-2 px-3 d-flex flex-wrap justify-content-between align-items-center gap-2">
        <div className="d-flex align-items-center">
          <i className="bi bi-truck text-primary fs-5 me-2"></i>
          <span className="fw-bold text-dark">{title}</span>
        </div>

        <div className="form-check form-switch mb-0 d-flex align-items-center">
          <input
            className="form-check-input me-2 cursor-pointer"
            type="checkbox"
            role="switch"
            id="sameAsBillingSwitch"
            checked={sameAsBilling}
            onChange={(e) => {
              const checked = e.target.checked;
              setSameAsBilling(checked);
              if (!checked && (!shippingAddress?.street && !shippingAddress?.city)) {
                handleCopyBilling();
              }
            }}
          />
          <label className="form-check-label small fw-semibold cursor-pointer" htmlFor="sameAsBillingSwitch">
            Same as Billing Address
          </label>
        </div>
      </div>

      <div className="card-body p-3">
        {sameAsBilling ? (
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 p-2 bg-light rounded border">
            <div className="small">
              <span className="text-muted me-1">Delivery Address:</span>
              <strong className="text-dark">{formatAddress(billingAddress)}</strong>
            </div>
            <button
              type="button"
              className="btn btn-outline-primary btn-sm py-0 px-2 fw-semibold"
              style={{ fontSize: '0.78rem' }}
              onClick={() => {
                setSameAsBilling(false);
                if (!shippingAddress?.street && !shippingAddress?.city) {
                  handleCopyBilling();
                }
              }}
            >
              <i className="bi bi-pencil me-1"></i> Edit / Different Shipping Address
            </button>
          </div>
        ) : (
          <div>
            <div className="d-flex justify-content-between align-items-center mb-2 pb-1 border-bottom">
              <span className="small text-muted fw-semibold">Enter specific destination or warehouse delivery address:</span>
              <button
                type="button"
                className="btn btn-link btn-sm p-0 text-decoration-none small"
                onClick={handleCopyBilling}
              >
                <i className="bi bi-copy me-1"></i> Copy from Billing
              </button>
            </div>

            <div className="row g-2">
              <div className="col-12 col-md-6">
                <label className="form-label small mb-1">Street Address / Building / Area</label>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  placeholder="e.g. Plot 42, GIDC Industrial Estate"
                  value={shippingAddress?.street || ''}
                  onChange={(e) => handleFieldChange('street', e.target.value)}
                />
              </div>

              <div className="col-12 col-md-6">
                <StateCitySelect
                  stateValue={shippingAddress?.state || ''}
                  cityValue={shippingAddress?.city || ''}
                  onStateChange={(stateName, stateCode) => {
                    onChange({
                      ...shippingAddress,
                      state: stateName,
                      stateCode: stateCode || ''
                    });
                  }}
                  onCityChange={(cityName) => handleFieldChange('city', cityName)}
                  size="sm"
                  stateColClass="col-6"
                  cityColClass="col-6"
                  rowClass="row g-2"
                />
              </div>

              <div className="col-6 col-md-3">
                <label className="form-label small mb-1">Pincode</label>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  placeholder="6 digits PIN"
                  maxLength={6}
                  value={shippingAddress?.pincode || ''}
                  onChange={(e) => handleFieldChange('pincode', e.target.value)}
                />
              </div>

              <div className="col-6 col-md-3">
                <label className="form-label small mb-1">Country</label>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  value={shippingAddress?.country || 'India'}
                  onChange={(e) => handleFieldChange('country', e.target.value)}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
