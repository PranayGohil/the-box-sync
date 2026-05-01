import React from 'react';
import { Row, Col, Form } from 'react-bootstrap';
import CreatableSelect from 'react-select/creatable';

const CustomerInfoForm = ({
  customerInfo,
  setCustomerInfo,
  requiredFields = {},
  visibleFields = { name: true, phone: false, address: false, total_persons: true, waiter: true },
  tableInfo = {},
  waiterOptions = [],
  orderStatus
}) => {
  return (
    <Row className="mb-3">
      {visibleFields.name && (
        <Col md="6" className="mb-3">
          <Form.Group>
            <Form.Label>
              Customer Name {requiredFields.name && <span className="text-danger">*</span>}
            </Form.Label>
            <Form.Control
              type="text"
              value={customerInfo.name || ''}
              onChange={(e) => setCustomerInfo((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Enter customer name"
            />
          </Form.Group>
        </Col>
      )}

      {visibleFields.phone && (
        <Col md="6" className="mb-3">
          <Form.Group>
            <Form.Label>
              Phone Number {requiredFields.phone && <span className="text-danger">*</span>}
            </Form.Label>
            <Form.Control
              type="tel"
              value={customerInfo.phone || ''}
              onChange={(e) => setCustomerInfo((prev) => ({ ...prev, phone: e.target.value }))}
              placeholder="Enter phone number"
            />
          </Form.Group>
        </Col>
      )}

      {visibleFields.address && (
        <Col md="12" className="mb-3">
          <Form.Group>
            <Form.Label>
              Delivery Address {requiredFields.address && <span className="text-danger">*</span>}
            </Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              value={customerInfo.address || ''}
              onChange={(e) => setCustomerInfo((prev) => ({ ...prev, address: e.target.value }))}
              placeholder="Enter full delivery address"
            />
          </Form.Group>
        </Col>
      )}

      {visibleFields.total_persons && (
        <Col md="6" className="mb-3">
          <Form.Group>
            <Form.Label>
              Total Persons {requiredFields.total_persons && <span className="text-danger">*</span>}
            </Form.Label>
            <Form.Control
              type="number"
              value={customerInfo.total_persons || ''}
              onChange={(e) => setCustomerInfo((prev) => ({ ...prev, total_persons: e.target.value }))}
              max={tableInfo.max_person}
            />
          </Form.Group>
        </Col>
      )}

      {visibleFields.waiter && (
        <Col md="6" className="mb-3">
          <Form.Group>
            <Form.Label>
              Waiter {requiredFields.waiter && <span className="text-danger">*</span>}
            </Form.Label>
            <CreatableSelect
              isClearable
              isDisabled={orderStatus === 'Paid'}
              options={waiterOptions}
              value={customerInfo.waiter ? { label: customerInfo.waiter, value: customerInfo.waiter } : null}
              onChange={(selected) =>
                setCustomerInfo((prev) => ({
                  ...prev,
                  waiter: selected ? selected.value : '',
                }))
              }
              placeholder="Select or add waiter"
              classNamePrefix="react-select"
            />
          </Form.Group>
        </Col>
      )}
    </Row>
  );
};

export default CustomerInfoForm;
