import React, { useState } from 'react';
import { useAsyncDebounce } from 'react-table';
import CsLineIcons from 'cs-line-icons/CsLineIcons';

const ControlsSearch = ({ tableInstance }) => {
    const {
        setGlobalFilter,
        state: { globalFilter },
    } = tableInstance;
    const [value, setValue] = useState(globalFilter);
    const onChange = useAsyncDebounce((val) => setGlobalFilter(val || undefined), 200);
    return (
        <div className="manage-menu-search-container shadow-sm d-flex align-items-center" style={{ height: '44px' }}>
            <div className="manage-menu-search-icon-wrapper">
                <CsLineIcons icon="search" size="16" />
            </div>
            <input
                className="form-control border-0 bg-transparent shadow-none flex-grow-1 manage-menu-pill-input"
                value={value || ''}
                onChange={(e) => {
                    setValue(e.target.value);
                    onChange(e.target.value);
                }}
                placeholder="Search category..."
            />
            {value && (
                <span
                    className="position-absolute"
                    style={{ right: '1rem', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: '#6b7280', zIndex: 10 }}
                    onClick={() => {
                        setValue('');
                        onChange('');
                    }}
                >
                    <CsLineIcons icon="close" size="14" />
                </span>
            )}
        </div>
    );
};

export default ControlsSearch;