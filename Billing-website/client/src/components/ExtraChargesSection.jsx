import React from 'react';

/**
 * Helper to compute extra charges amounts, deductions, and additions
 * @param {Array} extraCharges - List of extra charge objects { name, rate, type, isDeduction }
 * @param {number} subtotal - The base/taxable subtotal to compute percentage against
 */
export const computeExtraCharges = (extraCharges = [], subtotal = 0) => {
  const calculatedExtraCharges = extraCharges.map((charge) => {
    const rate = Number(charge.rate) || 0;
    let computedAmt = 0;
    if (charge.type === 'percentage') {
      computedAmt = (Number(subtotal || 0) * rate) / 100;
    } else {
      computedAmt = rate;
    }

    const isDeduction =
      charge.isDeduction !== undefined
        ? Boolean(charge.isDeduction)
        : /tds|discount|less|deduct/i.test(charge.name || '');

    return {
      ...charge,
      amount: Number(computedAmt.toFixed(2)),
      isDeduction
    };
  });

  const totalExtraAdditions = calculatedExtraCharges
    .filter((c) => !c.isDeduction && c.name?.trim())
    .reduce((sum, c) => sum + c.amount, 0);

  const totalExtraDeductions = calculatedExtraCharges
    .filter((c) => c.isDeduction && c.name?.trim())
    .reduce((sum, c) => sum + c.amount, 0);

  const validExtraCharges = calculatedExtraCharges.filter(
    (c) => c.name && String(c.name).trim() !== ''
  );

  return {
    calculatedExtraCharges,
    totalExtraAdditions,
    totalExtraDeductions,
    validExtraCharges
  };
};

/**
 * Reusable Extra Charges UI component matching GST Invoice style
 */
export const ExtraChargesSection = ({
  extraCharges = [],
  calculatedExtraCharges = [],
  onAdd,
  onRemove,
  onChange,
  title = 'Extra Fields & Charges (TDS, Courier, Freight, etc.)',
  subtitle = 'Add custom charges or deductions specifying category name, amount/rate, and percentage/amount type'
}) => {
  if (!extraCharges || extraCharges.length === 0) return null;

  return (
    <div className="card-zenith p-3 p-sm-4 mb-4 bg-white border">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h6 className="fw-bold mb-0 text-dark d-flex align-items-center">
            <i className="bi bi-tag-fill text-primary me-2"></i>
            {title}
          </h6>
          {subtitle && <div className="small text-muted">{subtitle}</div>}
        </div>
        <button
          type="button"
          className="btn btn-outline-primary btn-sm"
          onClick={onAdd}
        >
          <i className="bi bi-plus-circle me-1"></i> Add More
        </button>
      </div>

      <div className="d-flex flex-column gap-2">
        {extraCharges.map((charge, idx) => {
          const computed = calculatedExtraCharges[idx] || {
            amount: 0,
            isDeduction: false
          };

          return (
            <div
              key={idx}
              className="row g-2 align-items-center bg-light p-2 rounded border"
            >
              {/* Category Name */}
              <div className="col-10 col-md-4">
                <input
                  type="text"
                  className="form-control form-control-sm fw-semibold"
                  placeholder="Category Name (e.g. TDS, Courier, Freight)"
                  value={charge.name || ''}
                  onChange={(e) => onChange(idx, 'name', e.target.value)}
                  required
                />
              </div>

              {/* Remove Button (Mobile right aligned) */}
              <div className="col-2 d-md-none text-end">
                <button
                  type="button"
                  className="btn btn-outline-danger btn-sm p-1"
                  onClick={() => onRemove(idx)}
                  title="Remove Charge"
                >
                  <i className="bi bi-trash"></i>
                </button>
              </div>

              {/* Amount / Rate */}
              <div className="col-4 col-md-3">
                <input
                  type="number"
                  step="0.01"
                  className="form-control form-control-sm font-mono fw-bold text-end"
                  placeholder="Amount / %"
                  value={charge.rate ?? ''}
                  onChange={(e) => onChange(idx, 'rate', e.target.value)}
                  required
                />
              </div>

              {/* Type: Amount vs Percentage */}
              <div className="col-4 col-md-2">
                <select
                  className="form-select form-select-sm"
                  value={charge.type || 'amount'}
                  onChange={(e) => onChange(idx, 'type', e.target.value)}
                >
                  <option value="amount">Amount (₹)</option>
                  <option value="percentage">Percentage (%)</option>
                </select>
              </div>

              {/* Effect Toggle & Computed Preview */}
              <div className="col-4 col-md-2 text-end font-mono fw-bold d-flex align-items-center justify-content-end gap-1">
                <button
                  type="button"
                  className={`btn btn-sm py-0 px-1.5 ${
                    computed.isDeduction ? 'btn-outline-danger' : 'btn-outline-success'
                  }`}
                  style={{ fontSize: '0.72rem', height: '26px' }}
                  onClick={() =>
                    onChange(idx, 'isDeduction', !computed.isDeduction)
                  }
                  title="Click to toggle Addition (+) or Deduction (-)"
                >
                  {computed.isDeduction ? '- Deduct' : '+ Add'}
                </button>
                <span
                  className={computed.isDeduction ? 'text-danger' : 'text-success'}
                  style={{ fontSize: '0.82rem' }}
                >
                  {computed.isDeduction ? '-' : '+'}₹
                  {Number(computed.amount || 0).toFixed(2)}
                </span>
              </div>

              {/* Remove Button (Desktop) */}
              <div className="d-none d-md-block col-md-1 text-end">
                <button
                  type="button"
                  className="btn btn-outline-danger btn-sm p-1"
                  onClick={() => onRemove(idx)}
                  title="Remove Charge"
                >
                  <i className="bi bi-trash"></i>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ExtraChargesSection;
