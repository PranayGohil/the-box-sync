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
  handlePrint,
}) => {
  const [printing, setPrinting] = useState(false);
  const handlePrintBill = () => {
    if (handlePrint) {
      handlePrint(orderId);
    } else {
      printModalBill({ paymentData, orderItems, customerInfo, orderType, orderId, orderNo }, setPrinting);
    }
  };

  const labelStyle = { fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', color: '#94a3b8', marginBottom: '5px' };

  return (
    <Modal show={showPaymentModal} onHide={() => setShowPaymentModal(false)} centered size="lg" className="modal-custom-payment" scrollable>
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
        .payment-cancel-btn {
          border: 1.5px solid rgba(239, 68, 68, 0.2) !important;
          background: transparent !important;
          color: #ef4444 !important;
          border-radius: 12px !important;
          padding: 10px 20px !important;
          font-weight: 700 !important;
          transition: all 0.2s ease !important;
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          gap: 6px !important;
          box-shadow: none !important;
          text-decoration: none !important;
        }
        .payment-cancel-btn:hover {
          background: rgba(239, 68, 68, 0.05) !important;
          border-color: #ef4444 !important;
          color: #ef4444 !important;
          transform: translateY(-1px);
        }
        .payment-cancel-btn:active {
          transform: translateY(0);
        }
        .payment-print-btn {
          border-radius: 12px !important;
          padding: 10px 20px !important;
          font-weight: 700 !important;
          border: 1.5px solid #e2e8f0 !important;
          background: transparent !important;
          color: #64748b !important;
          transition: all 0.2s ease !important;
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          gap: 6px !important;
          text-decoration: none !important;
        }
        .payment-print-btn:hover:not(:disabled) {
          background: rgba(100, 116, 139, 0.05) !important;
          border-color: #94a3b8 !important;
          color: #475569 !important;
        }
        .payment-submit-btn {
          border-radius: 12px !important;
          padding: 10px 30px !important;
          font-weight: 800 !important;
          background: #23b3f4 !important;
          border: none !important;
          color: #ffffff !important;
          box-shadow: 0 10px 20px -5px rgba(35, 179, 244, 0.4) !important;
          transition: all 0.2s ease !important;
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          gap: 6px !important;
          text-decoration: none !important;
        }
        .payment-submit-btn:hover:not(:disabled) {
          background: #0ea5e9 !important;
          box-shadow: 0 10px 20px -5px rgba(14, 165, 233, 0.6) !important;
          transform: translateY(-1px);
          color: #ffffff !important;
        }
        .payment-submit-btn:active:not(:disabled) {
          transform: translateY(0);
        }
        .payment-paid-input {
          border-radius: 10px !important;
          border: 1.5px solid #e2e8f0 !important;
          padding-left: 30px !important;
          font-weight: 700 !important;
          font-size: 20px !important;
          height: 52px !important;
          color: #23b3f4 !important;
        }
        .payment-balance-box {
          border-radius: 10px !important;
          border: 1.5px solid #e2e8f0 !important;
          height: 52px !important;
          display: flex !important;
          align-items: center !important;
          padding-left: 15px !important;
          font-weight: 700 !important;
        }
        .payment-balance-text {
          font-size: 20px !important;
          font-weight: 700 !important;
        }
        .payment-action-container {
          display: flex !important;
          flex-direction: column !important;
          gap: 20px !important;
        }
        @media (max-width: 576px) {
          .modal-custom-payment .modal-content {
            border-radius: 16px !important;
          }
          .modal-custom-payment .modal-header {
            padding: 12px 16px !important;
          }
          .modal-custom-payment .modal-body {
            padding: 12px 16px !important;
          }
          .summary-card {
            padding: 10px 14px !important;
            border-radius: 12px !important;
          }
          .payment-method-btn {
            padding: 6px 4px !important;
            font-size: 12px !important;
            border-radius: 8px !important;
            border-width: 1.5px !important;
          }
          .payment-paid-input {
            font-size: 16px !important;
            height: 40px !important;
            padding-left: 24px !important;
          }
          .payment-balance-box {
            height: 40px !important;
            padding-left: 10px !important;
          }
          .payment-balance-text {
            font-size: 16px !important;
          }
          .payment-action-container {
            gap: 10px !important;
          }
          .payment-modal-footer {
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            grid-template-areas: 
              "submit submit"
              "cancel print" !important;
            gap: 6px !important;
            padding: 10px 12px !important;
          }
          .payment-cancel-btn {
            grid-area: cancel !important;
            margin-right: 0 !important;
            width: 100% !important;
            padding: 8px 12px !important;
            font-size: 13px !important;
            border-radius: 8px !important;
          }
          .payment-print-btn {
            grid-area: print !important;
            width: 100% !important;
            padding: 8px 12px !important;
            font-size: 13px !important;
            border-radius: 8px !important;
          }
          .payment-submit-btn {
            grid-area: submit !important;
            width: 100% !important;
            padding: 8px 12px !important;
            font-size: 14px !important;
            border-radius: 8px !important;
          }
        }
      `}</style>

      <Modal.Header closeButton>
        <Modal.Title>
          <div
            style={{
              background: '#23b3f4',
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
            }}
          >
            <CsLineIcons icon="credit-card" size="20" />
          </div>
          Process Payment
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <Row className="g-3 g-lg-4">
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
              <div className="pt-2 mt-2 border-top d-flex justify-content-between align-items-center gap-2">
                <div style={{ ...labelStyle, marginBottom: 0 }}>Discount</div>
                <InputGroup style={{ maxWidth: '160px' }}>
                  <Form.Select
                    value={paymentData.discountType}
                    onChange={(e) => handleDiscountTypeChange(e.target.value)}
                    style={{ maxWidth: '65px', borderRight: 'none', borderTopLeftRadius: '10px', borderBottomLeftRadius: '10px', padding: '6px 8px', fontSize: '13px' }}
                  >
                    <option value="amount">₹</option>
                    <option value="percentage">%</option>
                  </Form.Select>
                  <Form.Control
                    type="number"
                    value={paymentData.discountValue || ''}
                    onChange={(e) => handleDiscountValueChange(e.target.value)}
                    placeholder="0"
                    style={{ borderTopRightRadius: '10px', borderBottomRightRadius: '10px', padding: '6px 10px', fontSize: '13px' }}
                  />
                </InputGroup>
              </div>
              {parseFloat(paymentData.discountAmount) > 0 && (
                <div className="d-flex justify-content-between text-danger small fw-bold mt-1">
                  <span>Discount Amount</span>
                  <span>- ₹{paymentData.discountAmount}</span>
                </div>
              )}

              <div className="pt-3 mt-3 border-top d-flex justify-content-between align-items-center">
                <span className="fw-bold h5 mb-0" style={{ color: '#1e293b' }}>
                  Grand Total
                </span>
                <span className="fw-bold h4 mb-0 text-primary">₹{paymentData.total}</span>
              </div>
            </div>
          </Col>

          {/* Right Column: Action */}
          <Col lg={7}>
            <div className="h-100 payment-action-container">
              {/* Paid Amount and Balance Row */}
              <Row className="g-2">
                <Col xs={6}>
                  <label style={labelStyle}>Paid Amount</label>
                  <div className="position-relative">
                    <span className="position-absolute translate-middle-y top-50 start-0 ps-3 fw-bold text-muted" style={{ zIndex: 10 }}>
                      ₹
                    </span>
                    <Form.Control
                      type="number"
                      value={paymentData.paidAmount || ''}
                      onChange={(e) => handlePaidAmountChange(e.target.value)}
                      placeholder="0"
                      className="payment-paid-input"
                      autoFocus
                    />
                  </div>
                </Col>
                <Col xs={6}>
                  <label style={labelStyle}>
                    {parseFloat(paymentData.waveoffAmount) > 0 ? 'Balance Due' : parseFloat(paymentData.waveoffAmount) < 0 ? 'Change' : 'Balance'}
                  </label>
                  <div
                    className="payment-balance-box"
                    style={{
                      background: parseFloat(paymentData.waveoffAmount) > 0 ? '#fef2f2' : parseFloat(paymentData.waveoffAmount) < 0 ? '#f0fdf4' : '#f8fafc',
                      borderColor: parseFloat(paymentData.waveoffAmount) > 0 ? '#fee2e2' : parseFloat(paymentData.waveoffAmount) < 0 ? '#dcfce7' : '#e2e8f0',
                    }}
                  >
                    <div
                      className="payment-balance-text"
                      style={{
                        color: parseFloat(paymentData.waveoffAmount) > 0 ? '#ef4444' : parseFloat(paymentData.waveoffAmount) < 0 ? '#22c55e' : '#1e293b',
                      }}
                    >
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

      <Modal.Footer className="payment-modal-footer d-flex gap-2">
        <Button variant="none" className="payment-cancel-btn me-auto" onClick={() => setShowPaymentModal(false)}>
          <CsLineIcons icon="close" size="14" />
          Cancel
        </Button>
        <Button variant="none" className="payment-print-btn" onClick={handlePrintBill} disabled={printing || isLoading}>
          {printing ? 'Printing...' : 'Print Bill'}
        </Button>
        <Button variant="none" className="payment-submit-btn" onClick={handlePayment} disabled={isLoading}>
          {isLoading ? 'Processing...' : 'Complete Payment'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default PaymentModal;
