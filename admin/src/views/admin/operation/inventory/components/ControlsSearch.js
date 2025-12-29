import React, { useState, useEffect, useRef } from 'react';
import CsLineIcons from 'cs-line-icons/CsLineIcons';

const ControlsSearch = ({ onSearch, initialValue = '' }) => {
  const [value, setValue] = useState(initialValue);
  const debounceTimerRef = useRef(null);
  const isInitialMount = useRef(true);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return () => { }; // ✅ always return something
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

  return (
    <div className="position-relative">
      <input
        className="form-control datatable-search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search"
      />
      {value && value.length > 0 ? (
        <span
          className="search-delete-icon"
          onClick={handleClear}
          style={{
            cursor: 'pointer',
            position: 'absolute',
            right: '10px',
            top: '50%',
            transform: 'translateY(-50%)'
          }}
        >
          <CsLineIcons icon="close" />
        </span>
      ) : (
        <span
          className="search-magnifier-icon pe-none"
          style={{
            position: 'absolute',
            right: '10px',
            top: '50%',
            transform: 'translateY(-50%)'
          }}
        >
          <CsLineIcons icon="search" />
        </span>
      )}
    </div>
  );
};

export default ControlsSearch;