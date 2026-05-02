import React, { useState } from 'react';
import { Modal, Row, Col, Form, Button } from 'react-bootstrap';
import { printModalBill } from 'utils/printUtils';

const PaymentModal = ({
  showPaymentModal, setShowPaymentModal, paymentData, setPaymentData,
  isLoading, handleDiscountTypeChange, handleDiscountValueChange,
  handlePaidAmountChange, handlePayment,
  orderItems, customerInfo, orderType, orderId, orderNo, alreadyPaid
}) => {
  const [printing, setPrinting] = useState(false);
  const dueAmount = Math.max(0, parseFloat(paymentData.total) - alreadyPaid);

  const handlePrintBill = () => {
    printModalBill({ paymentData, orderItems, customerInfo, orderType, orderId, orderNo }, setPrinting);
  };
  return (
    <Modal show={showPaymentModal} onHide={() => setShowPaymentModal(false)} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Process Payment</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="bg-light p-3 rounded mb-4 border d-flex justify-content-between align-items-center">
          <div>
            <div className="text-muted small">Current Total</div>
            <div className="h4 mb-0 fw-bold">₹{parseFloat(paymentData.total).toFixed(2)}</div>
          </div>
          {alreadyPaid > 0 && (
            <div className="text-end border-start ps-3">
              <div className="text-muted small">Already Paid</div>
              <div className="h5 mb-0 text-success fw-bold">₹{alreadyPaid.toFixed(2)}</div>
            </div>
          )}
          <div className="text-end border-start ps-3">
            <div className="text-muted small">{alreadyPaid > 0 ? 'Balance Due' : 'Total Due'}</div>
            <div className="h4 mb-0 text-danger fw-bold">₹{dueAmount.toFixed(2)}</div>
          </div>
        </div>

        <Row className="mb-3">
          <Col>
            <Form.Group>
              <Form.Label>Sub Total</Form.Label>
              <Form.Control type="number" value={paymentData.subTotal} readOnly />
            </Form.Group>
          </Col>
        </Row>
        <Row className="mb-3">
          <Col md="4" className="mb-3 mb-md-0">
            <Form.Group>
              <Form.Label>CGST ({paymentData.cgstPercent}%)</Form.Label>
              <Form.Control type="number" value={paymentData.cgstAmount} readOnly />
            </Form.Group>
          </Col>
          <Col md="4" className="mb-3 mb-md-0">
            <Form.Group>
              <Form.Label>SGST ({paymentData.sgstPercent}%)</Form.Label>
              <Form.Control type="number" value={paymentData.sgstAmount} readOnly />
            </Form.Group>
          </Col>
          <Col md="4">
            <Form.Group>
              <Form.Label>VAT ({paymentData.vatPercent}%)</Form.Label>
              <Form.Control type="number" value={paymentData.vatAmount} readOnly />
            </Form.Group>
          </Col>
        </Row>
        <Row className="mb-3">
          <Col md="4" className="mb-3 mb-md-0">
            <Form.Group>
              <Form.Label>Discount Type</Form.Label>
              <Form.Select value={paymentData.discountType} onChange={(e) => handleDiscountTypeChange(e.target.value)}>
                <option value="amount">Amount (₹)</option>
                <option value="percentage">Percentage (%)</option>
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md="4" className="mb-3 mb-md-0">
            <Form.Group>
              <Form.Label>Discount {paymentData.discountType === 'percentage' ? 'Percentage' : 'Amount'}</Form.Label>
              <Form.Control
                type="number" value={paymentData.discountValue}
                onChange={(e) => handleDiscountValueChange(e.target.value)}
                placeholder={paymentData.discountType === 'percentage' ? 'Enter %' : 'Enter amount'}
                min="0" max={paymentData.discountType === 'percentage' ? '100' : paymentData.subTotal}
              />
            </Form.Group>
          </Col>
          <Col md="4">
            <Form.Group>
              <Form.Label>Discount Amount</Form.Label>
              <Form.Control type="number" value={paymentData.discountAmount} readOnly />
            </Form.Group>
          </Col>
        </Row>
        <Row className="mb-3">
          <Col>
            <Form.Group>
              <Form.Label><strong>Total Amount (Including Taxes)</strong></Form.Label>
              <Form.Control type="number" value={paymentData.total} readOnly style={{ fontWeight: 'bold', fontSize: '1.1rem' }} />
            </Form.Group>
          </Col>
        </Row>
        <Row className="mb-3">
          <Col md="6" className="mb-3 mb-md-0">
            <Form.Group>
              <Form.Label><strong>Paid Amount</strong></Form.Label>
              <Form.Control
                type="number" value={paymentData.paidAmount}
                onChange={(e) => handlePaidAmountChange(e.target.value)}
                placeholder="Enter paid amount" min="0" style={{ fontWeight: 'bold' }}
              />
            </Form.Group>
          </Col>
          <Col md="6">
            <Form.Group>
              <Form.Label><strong>Wave-off Amount</strong></Form.Label>
              <Form.Control
                type="number" value={paymentData.waveoffAmount} readOnly
                style={{
                  fontWeight: 'bold',
                  backgroundColor: parseFloat(paymentData.waveoffAmount) !== 0 ? '#fff3cd' : '#f8f9fa',
                  color: parseFloat(paymentData.waveoffAmount) > 0 ? '#856404' : parseFloat(paymentData.waveoffAmount) < 0 ? '#721c24' : '#000',
                }}
              />
              {parseFloat(paymentData.waveoffAmount) !== 0 && (
                <Form.Text className={parseFloat(paymentData.waveoffAmount) > 0 ? 'text-warning' : 'text-danger'}>
                  {parseFloat(paymentData.waveoffAmount) > 0
                    ? `Customer paid ₹${Math.abs(parseFloat(paymentData.waveoffAmount)).toFixed(2)} less`
                    : `Customer paid ₹${Math.abs(parseFloat(paymentData.waveoffAmount)).toFixed(2)} extra`}
                </Form.Text>
              )}
            </Form.Group>
          </Col>
        </Row>
        <Row className="mb-3">
          <Col>
            <Form.Group>
              <Form.Label>Payment Method</Form.Label>
              <Form.Select value={paymentData.paymentType} onChange={(e) => setPaymentData((prev) => ({ ...prev, paymentType: e.target.value }))}>
                <option value="Cash">Cash</option>
                <option value="Card">Card</option>
                <option value="UPI">UPI</option>
              </Form.Select>
            </Form.Group>
          </Col>
        </Row>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={() => setShowPaymentModal(false)}>Cancel</Button>
        <Button variant="outline-primary" onClick={handlePrintBill} disabled={printing || isLoading}>
          {printing ? 'Printing...' : 'Print Bill'}
        </Button>
        <Button variant="success" onClick={handlePayment} disabled={isLoading}>Complete Payment</Button>
      </Modal.Footer>
    </Modal>
  );
};

export default PaymentModal;
