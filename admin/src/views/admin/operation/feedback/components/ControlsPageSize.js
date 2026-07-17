import React from 'react';
import { Dropdown, OverlayTrigger, Tooltip } from 'react-bootstrap';

const ControlsPageSize = ({ tableInstance, pageSize: propPageSize, onPageSizeChange: propOnPageSizeChange }) => {
  const options = [5, 10, 20, 50, 100];

  const pageSize = tableInstance ? tableInstance.state.pageSize : propPageSize;
  const setPageSize = tableInstance ? tableInstance.setPageSize : propOnPageSizeChange;

  return (
    <OverlayTrigger placement="top" delay={{ show: 1000, hide: 0 }} overlay={<Tooltip>Item Count</Tooltip>}>
      {({ ref, ...triggerHandler }) => (
        <Dropdown className="d-inline-block" align="end">
          <Dropdown.Toggle
            ref={ref}
            {...triggerHandler}
            variant="outline-primary"
            className="rounded-pill px-3 py-1 fw-bold border-2 small feedback-page-size-toggle"
            style={{ display: 'flex', alignItems: 'center' }}
          >
            {pageSize} Items
          </Dropdown.Toggle>
          <Dropdown.Menu
            className="shadow dropdown-menu-end"
            popperConfig={{
              modifiers: [
                {
                  name: 'computeStyles',
                  options: {
                    gpuAcceleration: false,
                  },
                },
              ],
            }}
          >
            {options.map((pSize) => (
              <Dropdown.Item key={`pageSize.${pSize}`} active={pSize === pageSize} onClick={() => setPageSize(pSize)}>
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
