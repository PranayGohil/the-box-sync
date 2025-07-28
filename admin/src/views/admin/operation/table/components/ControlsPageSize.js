import React from 'react';
import { ButtonGroup, Dropdown } from 'react-bootstrap';

const ControlsPageSize = ({ tableInstance }) => {
    const {
        setPageSize,
        gotoPage,
        state: { pageSize },
    } = tableInstance;
    const options = [5, 10, 20];

    const onSelectPageSize = (size) => {
        setPageSize(size);
        gotoPage(0);
    };
    return (
        <Dropdown size="sm" as={ButtonGroup} className="d-inline-block" align="end">
            <Dropdown.Toggle variant="outline-muted">{pageSize} Items</Dropdown.Toggle>
            <Dropdown.Menu className="dropdown-menu-sm dropdown-menu-end">
                {options.map((pSize) => (
                    <Dropdown.Item key={`pageSize.${pSize}`} active={pSize === pageSize} onClick={() => onSelectPageSize(pSize)}>
                        {pSize} Items
                    </Dropdown.Item>
                ))}
            </Dropdown.Menu>
        </Dropdown>
    );
};

export default ControlsPageSize;