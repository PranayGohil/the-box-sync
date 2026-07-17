import React, { useRef } from 'react';
import { Modal, Button } from 'react-bootstrap';
// eslint-disable-next-line import/no-extraneous-dependencies
import Barcode from 'react-barcode';
import { useReactToPrint } from 'react-to-print';
import CsLineIcons from 'cs-line-icons/CsLineIcons';

const PrintBarcodeModal = ({ show, onHide, barcodeValue, itemName, variantName }) => {
  const printRef = useRef();

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: `Barcode-${barcodeValue}`,
  });

  if (!barcodeValue) return null;

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title className="fw-bold">Print Barcode</Modal.Title>
      </Modal.Header>
      <Modal.Body className="d-flex flex-column align-items-center p-5 bg-light">
        <div 
          ref={printRef} 
          className="d-flex flex-column align-items-center bg-white p-4 rounded shadow-sm"
          style={{ minWidth: '300px' }}
        >
          <div className="fw-bold text-center mb-1" style={{ fontSize: '1.1rem' }}>
            {itemName}
          </div>
          {variantName && (
            <div className="text-muted text-center small mb-3" style={{ fontSize: '0.9rem' }}>
              {variantName}
            </div>
          )}
          <Barcode value={barcodeValue} width={2} height={80} displayValue={true} />
        </div>
      </Modal.Body>
      <Modal.Footer className="border-0">
        <Button variant="outline-secondary" onClick={onHide} className="rounded-pill px-4">
          Cancel
        </Button>
        <Button variant="primary" onClick={handlePrint} className="rounded-pill px-4 d-flex align-items-center gap-2">
          <CsLineIcons icon="print" size="16" />
          Print Label
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default PrintBarcodeModal;
