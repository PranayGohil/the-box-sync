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
        <div className="search-input-container w-100 border border-separator bg-foreground search-sm">
            <input
                className="form-control form-control-sm datatable-search"
                value={value || ''}
                onChange={(e) => {
                    setValue(e.target.value);
                    onChange(e.target.value);
                }}
                placeholder="Search"
            />
            {value ? (
                <span
                    className="search-delete-icon"
                    onClick={() => {
                        setValue('');
                        onChange('');
                    }}
                >
                    <CsLineIcons icon="close" />
                </span>
            ) : (
                <span className="search-magnifier-icon pe-none">
                    <CsLineIcons icon="search" />
                </span>
            )}
        </div>
    );
};

export default ControlsSearch;