import React from 'react';
import { Button, Col, Form, Row } from 'react-bootstrap';

const LayoutsFormRow = () => {
  return (
    <Form>
      <Row className="g-3">
        <Col md="6">
          <Form.Label>Dining Type</Form.Label>
          <Form.Control type="text" />
        </Col>
      </Row>
      <Row>
        <Col md="6">
          <Form.Label>Table No.</Form.Label>
          <Form.Control type="text" />
        </Col>
        <Col md="4">
          <Form.Label>Max Person</Form.Label>
          <Form.Control type="text" />
        </Col>
        <Col md="2" className="d-flex align-items-end">
          <Button variant="primary">Delete</Button>
        </Col>
        <Col xs="12" className="mt-3">
          <Button variant="primary" className='me-3'>Add More</Button>
          <Button variant="primary">Submit</Button>
        </Col>
      </Row>
    </Form>
  );
};

export default LayoutsFormRow;
