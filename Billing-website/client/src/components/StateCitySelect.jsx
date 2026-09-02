import React, { useState, useEffect } from 'react';
import { INDIAN_STATES, getCitiesForState, getStateCode } from '../data/indiaStatesAndCities';

/**
 * Standalone State Dropdown
 */
export const StateSelect = ({
  value,
  onChange,
  label = 'State',
  required = false,
  size = 'normal',
  disabled = false,
  className = '',
  id,
  showLabel = true,
  placeholder = '-- Select State --'
}) => {
  const selectSizeClass = size === 'sm' ? 'form-select-sm' : '';

  const handleStateChange = (e) => {
    const stateName = e.target.value;
    const code = getStateCode(stateName);
    onChange(stateName, code);
  };

  return (
    <div className={className}>
      {showLabel && label && (
        <label htmlFor={id} className="form-label mb-1">
          {label}{required && <span className="text-danger">*</span>}
        </label>
      )}
      <select
        id={id}
        className={`form-select ${selectSizeClass}`}
        value={value || ''}
        onChange={handleStateChange}
        required={required}
        disabled={disabled}
      >
        <option value="">{placeholder}</option>
        {INDIAN_STATES.map((s) => (
          <option key={s.code} value={s.name}>
            {s.name} ({s.code})
          </option>
        ))}
      </select>
    </div>
  );
};

/**
 * Standalone City Dropdown with Custom Entry Fallback
 */
export const CitySelect = ({
  stateName,
  value,
  onChange,
  label = 'City',
  required = false,
  size = 'normal',
  disabled = false,
  className = '',
  id,
  showLabel = true,
  placeholder = '-- Select City --'
}) => {
  const cities = getCitiesForState(stateName);
  const isValueInCities = cities.includes(value);
  const [isCustomMode, setIsCustomMode] = useState(Boolean(value && !isValueInCities));

  useEffect(() => {
    // If current value is not in new state's cities and value is not empty, allow custom or keep it
    if (value && !cities.includes(value)) {
      setIsCustomMode(true);
    } else {
      setIsCustomMode(false);
    }
  }, [stateName]);

  const selectSizeClass = size === 'sm' ? 'form-select-sm' : '';
  const inputSizeClass = size === 'sm' ? 'form-control-sm' : '';
  const btnSizeClass = size === 'sm' ? 'btn-sm py-0 px-2' : '';

  const handleSelectChange = (e) => {
    const val = e.target.value;
    if (val === '__custom__') {
      setIsCustomMode(true);
      onChange('');
    } else {
      onChange(val);
    }
  };

  return (
    <div className={className}>
      {showLabel && label && (
        <div className="d-flex justify-content-between align-items-center mb-1">
          <label htmlFor={id} className="form-label mb-0">
            {label}{required && <span className="text-danger">*</span>}
          </label>
          {isCustomMode ? (
            <button
              type="button"
              className={`btn btn-link text-primary text-decoration-none p-0 ${size === 'sm' ? 'small' : ''}`}
              style={{ fontSize: '0.75rem' }}
              onClick={() => setIsCustomMode(false)}
            >
              <i className="bi bi-list-ul me-1"></i>Choose from list
            </button>
          ) : (
            <button
              type="button"
              className={`btn btn-link text-muted text-decoration-none p-0 ${size === 'sm' ? 'small' : ''}`}
              style={{ fontSize: '0.75rem' }}
              onClick={() => setIsCustomMode(true)}
            >
              <i className="bi bi-pencil me-1"></i>Type other
            </button>
          )}
        </div>
      )}

      {isCustomMode ? (
        <div className="input-group">
          <input
            id={id}
            type="text"
            className={`form-control ${inputSizeClass}`}
            placeholder="Type city/town name"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            required={required}
            disabled={disabled}
          />
          <button
            type="button"
            className={`btn btn-outline-secondary ${btnSizeClass}`}
            onClick={() => setIsCustomMode(false)}
            title="Switch to dropdown list"
          >
            <i className="bi bi-chevron-down"></i>
          </button>
        </div>
      ) : (
        <select
          id={id}
          className={`form-select ${selectSizeClass}`}
          value={value || ''}
          onChange={handleSelectChange}
          required={required}
          disabled={disabled || !stateName}
        >
          <option value="">{!stateName ? '-- Select State First --' : placeholder}</option>
          {cities.map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
          {/* If the current value is custom, show it as an option */}
          {value && !isValueInCities && (
            <option value={value}>
              {value} (Custom)
            </option>
          )}
          <option value="__custom__">+ Other / Type Custom City...</option>
        </select>
      )}
    </div>
  );
};

/**
 * Combined State & City Dropdowns Component
 */
export const StateCitySelect = ({
  stateValue,
  cityValue,
  onStateChange,
  onCityChange,
  stateLabel = 'State',
  cityLabel = 'City',
  stateRequired = false,
  cityRequired = false,
  stateColClass = 'col-sm-6',
  cityColClass = 'col-sm-6',
  size = 'normal',
  disabled = false,
  isRow = true,
  rowClass = 'row g-2'
}) => {
  const content = (
    <>
      <div className={stateColClass}>
        <StateSelect
          value={stateValue}
          onChange={onStateChange}
          label={stateLabel}
          required={stateRequired}
          size={size}
          disabled={disabled}
        />
      </div>
      <div className={cityColClass}>
        <CitySelect
          stateName={stateValue}
          value={cityValue}
          onChange={onCityChange}
          label={cityLabel}
          required={cityRequired}
          size={size}
          disabled={disabled}
        />
      </div>
    </>
  );

  return isRow ? <div className={rowClass}>{content}</div> : content;
};

export default StateCitySelect;
