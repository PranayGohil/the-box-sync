
import React from 'react';
import { ButtonGroup, Dropdown } from 'react-bootstrap';

const ControlsPageSize = ({ tableInstance }) => {
    const {
        setPageSize,
        gotoPage,
        state: { pageSize },
    } = tableInstance;
    const options = [2, 5, 10];
    return (
        <Dropdown size="sm" as={ButtonGroup} className="d-inline-block" align="end">
            <Dropdown.Toggle variant="outline-muted">{pageSize} Items</Dropdown.Toggle>
            <Dropdown.Menu>
                {options.map((size) => (
                    <Dropdown.Item
                        key={size}
                        active={pageSize === size}
                        onClick={() => {
                            setPageSize(size);
                            gotoPage(0);
                        }}
                    >
                        {size} Items
                    </Dropdown.Item>
                ))}
            </Dropdown.Menu>
        </Dropdown>
    );
};

export default ControlsPageSize;