import React, { useState, useEffect } from 'react';
import CsLineIcons from 'cs-line-icons/CsLineIcons';

const ControlsSearch = ({ onSearch }) => {
  const [value, setValue] = useState('');

  // Debounce search to avoid too many API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(value);
    }, 500); // Wait 500ms after user stops typing

    return () => clearTimeout(timer);
  }, [value, onSearch]);

  return (
    <>
      <input
        className="form-control datatable-search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search"
      />
      {value && value.length > 0 ? (
        <span
          className="search-delete-icon"
          onClick={() => setValue('')}
          style={{ cursor: 'pointer' }}
        >
          <CsLineIcons icon="close" />
        </span>
      ) : (
        <span className="search-magnifier-icon pe-none">
          <CsLineIcons icon="search" />
        </span>
      )}
    </>
  );
};

export default ControlsSearch;