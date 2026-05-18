import React, { useState, useEffect } from 'react';
import { useAsyncDebounce } from 'react-table';
import CsLineIcons from 'cs-line-icons/CsLineIcons';

const ControlsSearch = ({ tableInstance, onSearch, initialValue = '' }) => {
  const isReactTable = !!tableInstance;
  const { setGlobalFilter, state } = tableInstance || {};
  const globalFilterValue = state?.globalFilter || '';

  const [value, setValue] = useState(isReactTable ? globalFilterValue : initialValue);

  // Synchronize state with table global filter if changed externally
  useEffect(() => {
    if (isReactTable) {
      setValue(globalFilterValue);
    }
  }, [globalFilterValue, isReactTable]);

  // Synchronize state with initial value if not using tableInstance
  useEffect(() => {
    if (!isReactTable) {
      setValue(initialValue);
    }
  }, [initialValue, isReactTable]);

  const onSearchDebounced = useAsyncDebounce((val) => {
    if (isReactTable) {
      setGlobalFilter(val || undefined);
    } else if (onSearch) {
      onSearch(val);
    }
  }, 300);

  const handleClear = () => {
    setValue('');
    if (isReactTable) {
      setGlobalFilter(undefined);
    } else if (onSearch) {
      onSearch('');
    }
  };

  return (
    <div className="position-relative w-100 h-100 d-flex align-items-center">
      <div
        className="position-absolute d-flex align-items-center justify-content-center"
        style={{
          left: '12px',
          top: '50%',
          transform: 'translateY(-50%)',
          color: '#23b3f4',
          zIndex: 5,
        }}
      >
        <CsLineIcons icon="search" size="16" />
      </div>
      <input
        className="form-control datatable-search border-0 bg-transparent w-100"
        style={{
          height: '100%',
          fontSize: '14px',
          paddingLeft: '40px',
          paddingRight: '40px',
          outline: 'none',
          boxShadow: 'none',
          color: '#333',
        }}
        value={value || ''}
        onChange={(e) => {
          setValue(e.target.value);
          onSearchDebounced(e.target.value);
        }}
        placeholder="Search reviews..."
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
            color: '#23b3f4',
            zIndex: 5,
          }}
        >
          <CsLineIcons icon="close" size="14" />
        </span>
      )}
    </div>
  );
};

export default ControlsSearch;
