import React from 'react';
import { Dropdown, OverlayTrigger, Tooltip } from 'react-bootstrap';

const ControlsPageSize = ({ pageSize, onPageSizeChange }) => {
  const options = [5, 10, 20, 50, 100];

  return (
    <OverlayTrigger placement="top" delay={{ show: 1000, hide: 0 }} overlay={<Tooltip>Item Count</Tooltip>}>
      {({ ref, ...triggerHandler }) => (
        <Dropdown className="d-inline-block" align="end">
          <Dropdown.Toggle 
            ref={ref} 
            {...triggerHandler} 
            variant="outline-primary" 
            className="rounded-pill shadow-sm px-3 fw-bold border-2 d-flex align-items-center justify-content-center"
            style={{ height: '40px', color: '#1ea8e7', borderColor: '#1ea8e7' }}
          >
            <span className="me-2">{pageSize} Items</span>
          </Dropdown.Toggle>
          <Dropdown.Menu
            className="shadow-lg border-0"
            style={{ borderRadius: '15px', overflow: 'hidden' }}
          >
            {options.map((pSize) => (
              <Dropdown.Item
                key={`pageSize.${pSize}`}
                active={pSize === pageSize}
                onClick={() => onPageSizeChange(pSize)}
                className="px-4 py-2"
              >
                {pSize} Items
              </Dropdown.Item>
            ))}
          </Dropdown.Menu>
        </Dropdown>
      )}
    </OverlayTrigger>
  );
};

export default ControlsPageSize;