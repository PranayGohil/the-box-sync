import React, { useState } from 'react';
import { Modal, Row, Col, Form, Button, InputGroup } from 'react-bootstrap';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import { printModalBill } from '../../../../utils/printUtils';

const PaymentModal = ({
  showPaymentModal,
  setShowPaymentModal,
  paymentData,
  setPaymentData,
  isLoading,
  handleDiscountTypeChange,
  handleDiscountValueChange,
  handlePaidAmountChange,
  handlePayment,
  orderItems,
  customerInfo,
  orderType,
  orderId,
  orderNo,
}) => {
  const [printing, setPrinting] = useState(false);
  const handlePrintBill = () => {
    printModalBill({ paymentData, orderItems, customerInfo, orderType, orderId, orderNo }, setPrinting);
  };

  const labelStyle = { fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', color: '#94a3b8', marginBottom: '5px' };
  const valueBoxStyle = { background: '#f8fafc', borderRadius: '10px', border: '1.5px solid #e2e8f0', padding: '10px 15px', fontWeight: 600, color: '#1e293b' };
  const inputStyle = { borderRadius: '10px', border: '1.5px solid #e2e8f0', padding: '10px 15px', fontWeight: 600, fontSize: '15px' };

  return (
    <Modal show={showPaymentModal} onHide={() => setShowPaymentModal(false)} centered size="lg" className="modal-custom-payment">
      <style>{`
        .modal-custom-payment .modal-content {
          border-radius: 20px;
          border: none;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15);
          overflow: hidden;
        }
        .modal-custom-payment .modal-header {
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          border-bottom: 1px solid #e2e8f0;
          padding: 20px 24px;
        }
        .modal-custom-payment .modal-title {
          font-weight: 800;
          color: #1e293b;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .modal-custom-payment .modal-body {
          padding: 24px;
          background: #fff;
        }
        .modal-custom-payment .modal-footer {
          background: #f8fafc;
          border-top: 1px solid #e2e8f0;
          padding: 16px 24px;
        }
        .summary-card {
          background: #f8fafc;
          border-radius: 16px;
          padding: 20px;
          border: 1px solid #e2e8f0;
        }
        .payment-method-btn {
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          padding: 12px;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s;
          background: #fff;
          font-weight: 700;
          color: #64748b;
        }
        .payment-method-btn.active {
          border-color: #23b3f4;
          background: rgba(35, 179, 244, 0.05);
          color: #23b3f4;
        }
      `}</style>

      <Modal.Header closeButton>
        <Modal.Title>
          <div style={{ background: '#23b3f4', width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
            <CsLineIcons icon="credit-card" size="20" />
          </div>
          Process Payment
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <Row className="g-4">
          {/* Left Column: Summary */}
          <Col lg={5}>
            <div className="summary-card">
              <h6 className="fw-bold mb-3 d-flex align-items-center gap-2" style={{ color: '#1e293b' }}>
                <CsLineIcons icon="content" size="16" /> Order Summary
              </h6>
              
              <div className="d-flex justify-content-between mb-2">
                <span className="text-muted small fw-semibold">Sub Total</span>
                <span className="fw-bold">₹{paymentData.subTotal}</span>
              </div>

              {(parseFloat(paymentData.cgstAmount) > 0 || parseFloat(paymentData.sgstAmount) > 0 || parseFloat(paymentData.vatAmount) > 0) && (
                <div className="pt-2 mt-2 border-top">
                  {parseFloat(paymentData.cgstAmount) > 0 && (
                    <div className="d-flex justify-content-between mb-1">
                      <span className="text-muted small">CGST ({paymentData.cgstPercent}%)</span>
                      <span className="fw-semibold">₹{paymentData.cgstAmount}</span>
                    </div>
                  )}
                  {parseFloat(paymentData.sgstAmount) > 0 && (
                    <div className="d-flex justify-content-between mb-1">
                      <span className="text-muted small">SGST ({paymentData.sgstPercent}%)</span>
                      <span className="fw-semibold">₹{paymentData.sgstAmount}</span>
                    </div>
                  )}
                  {parseFloat(paymentData.vatAmount) > 0 && (
                    <div className="d-flex justify-content-between mb-1">
                      <span className="text-muted small">VAT ({paymentData.vatPercent}%)</span>
                      <span className="fw-semibold">₹{paymentData.vatAmount}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Discount Section */}
              <div className="pt-2 mt-2 border-top">
                <div style={labelStyle}>Discount</div>
                <InputGroup className="mb-2">
                  <Form.Select 
                    value={paymentData.discountType} 
                    onChange={(e) => handleDiscountTypeChange(e.target.value)}
                    style={{ maxWidth: '90px', borderRight: 'none', borderTopLeftRadius: '10px', borderBottomLeftRadius: '10px' }}
                  >
                    <option value="amount">₹</option>
                    <option value="percentage">%</option>
                  </Form.Select>
                  <Form.Control
                    type="number"
                    value={paymentData.discountValue || ''}
                    onChange={(e) => handleDiscountValueChange(e.target.value)}
                    placeholder="0"
                    style={{ borderTopRightRadius: '10px', borderBottomRightRadius: '10px' }}
                  />
                </InputGroup>
                {parseFloat(paymentData.discountAmount) > 0 && (
                  <div className="d-flex justify-content-between text-danger small fw-bold">
                    <span>Discount Amount</span>
                    <span>- ₹{paymentData.discountAmount}</span>
                  </div>
                )}
              </div>

              <div className="pt-3 mt-3 border-top d-flex justify-content-between align-items-center">
                <span className="fw-bold h5 mb-0" style={{ color: '#1e293b' }}>Grand Total</span>
                <span className="fw-bold h4 mb-0 text-primary">₹{paymentData.total}</span>
              </div>
            </div>
          </Col>

          {/* Right Column: Action */}
          <Col lg={7}>
            <div className="h-100 d-flex flex-column gap-4">
              {/* Paid Amount */}
              <div>
                <label style={labelStyle}>Paid Amount</label>
                <div className="position-relative">
                  <span className="position-absolute translate-middle-y top-50 start-0 ps-3 fw-bold text-muted" style={{ zIndex: 10 }}>₹</span>
                  <Form.Control
                    type="number"
                    value={paymentData.paidAmount || ''}
                    onChange={(e) => handlePaidAmountChange(e.target.value)}
                    placeholder="Enter amount"
                    style={{ ...inputStyle, paddingLeft: '30px', fontSize: '24px', height: '60px', color: '#23b3f4' }}
                    autoFocus
                  />
                </div>
              </div>

              {/* Wave-off / Change */}
              <Row>
                <Col sm={12}>
                  <div style={{ ...valueBoxStyle, background: parseFloat(paymentData.waveoffAmount) > 0 ? '#fef2f2' : parseFloat(paymentData.waveoffAmount) < 0 ? '#f0fdf4' : '#f8fafc', borderColor: parseFloat(paymentData.waveoffAmount) > 0 ? '#fee2e2' : parseFloat(paymentData.waveoffAmount) < 0 ? '#dcfce7' : '#e2e8f0' }}>
                    <div style={{ ...labelStyle, marginBottom: '2px', color: parseFloat(paymentData.waveoffAmount) !== 0 ? 'inherit' : '#94a3b8' }}>
                      {parseFloat(paymentData.waveoffAmount) > 0 ? 'Balance Due' : parseFloat(paymentData.waveoffAmount) < 0 ? 'Change to Return' : 'Balance'}
                    </div>
                    <div className="h5 mb-0 fw-bold" style={{ color: parseFloat(paymentData.waveoffAmount) > 0 ? '#ef4444' : parseFloat(paymentData.waveoffAmount) < 0 ? '#22c55e' : '#1e293b' }}>
                      ₹{Math.abs(parseFloat(paymentData.waveoffAmount)).toFixed(2)}
                    </div>
                  </div>
                </Col>
              </Row>

              {/* Payment Method */}
              <div>
                <label style={labelStyle}>Payment Method</label>
                <div className="d-flex gap-2">
                  {['Cash', 'Card', 'UPI'].map((method) => (
                    <div
                      key={method}
                      className={`payment-method-btn flex-grow-1 ${paymentData.paymentType === method ? 'active' : ''}`}
                      onClick={() => setPaymentData((prev) => ({ ...prev, paymentType: method }))}
                    >
                      {method}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Col>
        </Row>
      </Modal.Body>

      <Modal.Footer className="justify-content-between">
        <Button variant="link" className="text-muted fw-bold text-decoration-none" onClick={() => setShowPaymentModal(false)}>
          Cancel
        </Button>
        <div className="d-flex gap-2">
          <Button 
            variant="outline-secondary" 
            style={{ borderRadius: '12px', padding: '10px 20px', fontWeight: 700 }}
            onClick={handlePrintBill} 
            disabled={printing || isLoading}
          >
            {printing ? 'Printing...' : 'Print Bill'}
          </Button>
          <Button 
            variant="primary" 
            style={{ borderRadius: '12px', padding: '10px 30px', fontWeight: 800, background: '#23b3f4', border: 'none', boxShadow: '0 10px 20px -5px rgba(35, 179, 244, 0.4)' }}
            onClick={handlePayment} 
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : 'Complete Payment'}
          </Button>
        </div>
      </Modal.Footer>
    </Modal>
  );
};

export default PaymentModal;
