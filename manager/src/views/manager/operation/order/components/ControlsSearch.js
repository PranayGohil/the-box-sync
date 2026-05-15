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
    <div className="custom-search-container shadow-sm d-flex align-items-center px-2 bg-white" style={{ borderRadius: '10px', height: '40px', border: '1px solid #eee' }}>
      <CsLineIcons icon="search" size="18" className="text-primary opacity-75 ms-1" />
      <input
        className="border-0 bg-transparent shadow-none flex-grow-1 px-2"
        style={{ height: '38px', fontSize: '14px', outline: 'none' }}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search orders..."
      />
      {value && value.length > 0 && (
        <span
          className="cursor-pointer text-muted px-1"
          onClick={handleClear}
        >
          <CsLineIcons icon="close" size="14" />
        </span>
      )}
    </div>
  );
};

export default ControlsSearch;