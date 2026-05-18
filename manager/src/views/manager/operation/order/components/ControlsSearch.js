import React, { useState, useEffect, useRef } from 'react';
import CsLineIcons from 'cs-line-icons/CsLineIcons';

const ControlsSearch = ({ onSearch, initialValue = '' }) => {
  const [value, setValue] = useState(initialValue);
  const debounceTimerRef = useRef(null);
  const isInitialMount = useRef(true);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return () => { };
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      onSearch(value);
    }, 500);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [value, onSearch]);


  const handleClear = () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    setValue('');
    onSearch('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      onSearch(value);
    }
  };

  const handleSearchClick = () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    onSearch(value);
  };

  return (
    <div className="position-relative w-100 h-100 d-flex align-items-center">
      <div 
        className="position-absolute d-flex align-items-center justify-content-center"
        onClick={handleSearchClick}
        style={{
          left: '12px',
          top: '50%',
          transform: 'translateY(-50%)',
          color: '#1ea8e7',
          zIndex: 5,
          cursor: 'pointer'
        }}
      >
        <CsLineIcons icon="search" size="16" />
      </div>
      <input
        className="form-control datatable-search border-0 bg-white w-100"
        style={{ 
          height: '100%', 
          fontSize: '14px', 
          paddingLeft: '40px',
          paddingRight: '40px',
          outline: 'none',
          boxShadow: 'none'
        }}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Search orders..."
      />
      {value && value.length > 0 && (
        <span
          className="search-delete-icon"
          onClick={handleClear}
          style={{
            cursor: 'pointer',
            position: 'absolute',
            right: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#1ea8e7',
            zIndex: 5
          }}
        >
          <CsLineIcons icon="close" size="14" />
        </span>
      )}
    </div>
  );
};

export default ControlsSearch;