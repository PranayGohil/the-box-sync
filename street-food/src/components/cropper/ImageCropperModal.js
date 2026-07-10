import React, { useState, useRef, useEffect } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import Cropper from 'react-cropper';
import 'cropperjs/dist/cropper.css';
import CsLineIcons from 'cs-line-icons/CsLineIcons';

const ASPECT_RATIOS = [
  { label: 'Free', value: undefined },
  { label: '1:1', value: 1 },
  { label: '4:3', value: 4 / 3 },
  { label: '16:9', value: 16 / 9 },
  { label: '3:2', value: 3 / 2 },
  { label: '5:3', value: 5 / 3 },
  { label: '5:4', value: 5 / 4 },
  { label: '7:5', value: 7 / 5 },
];

const ImageCropperModal = ({ show, onHide, imageSrc, onCropComplete, initialAspect = undefined }) => {
  const cropperRef = useRef(null);
  const [rotation, setRotation] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const defaultAspect = ASPECT_RATIOS.find((r) => r.value === initialAspect) || ASPECT_RATIOS[0];
  const [selectedAspect, setSelectedAspect] = useState(defaultAspect);

  useEffect(() => {
    if (show) {
      setRotation(0);
      setSelectedAspect(defaultAspect);
    }
  }, [show, defaultAspect]);

  useEffect(() => {
    const cropper = cropperRef.current?.cropper;
    if (cropper) {
      const ratioValue = selectedAspect.value === undefined ? NaN : selectedAspect.value;
      cropper.setAspectRatio(ratioValue);
    }
  }, [selectedAspect]);

  const handleRotationChange = (e) => {
    const val = Number(e.target.value);
    setRotation(val);
    const cropper = cropperRef.current?.cropper;
    if (cropper) {
      cropper.rotateTo(val);
    }
  };

  const handleSave = () => {
    const cropper = cropperRef.current?.cropper;
    if (cropper) {
      setIsProcessing(true);
      try {
        cropper.getCroppedCanvas({ imageSmoothingQuality: 'high' }).toBlob((blob) => {
          if (blob) {
            const file = new File([blob], 'cropped-image.jpg', { type: 'image/jpeg' });
            onCropComplete(file);
            onHide();
          }
          setIsProcessing(false);
        }, 'image/jpeg');
      } catch (e) {
        console.error('Error generating cropped canvas:', e);
        setIsProcessing(false);
      }
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="md" centered backdrop="static" keyboard={false} className="cropper-modal-premium">
      <style>{`
        .cropper-modal-premium .modal-content {
          border-radius: 1rem;
          border: none;
          overflow: hidden;
          background: #1e1e24;
          color: #f8fafc;
          max-height: 95vh;
          display: flex;
          flex-direction: column;
        }
        .cropper-modal-premium .modal-header {
          border-bottom: 1px solid #2d2d34;
          background: #1e1e24;
          color: #f8fafc;
          padding: 0.75rem 1.25rem;
          flex-shrink: 0;
        }
        .cropper-modal-premium .modal-title {
          font-weight: 700;
          font-size: 1rem;
        }
        .cropper-modal-premium .btn-close {
          filter: invert(1) grayscale(1) brightness(2);
        }
        .cropper-modal-premium .modal-body {
          background: #121214;
          padding: 0.85rem 1rem;
          overflow: hidden;
          flex: 1 1 auto;
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
        }
        .cropper-modal-premium .modal-footer {
          border-top: 1px solid #2d2d34;
          background: #1e1e24;
          padding: 0.65rem 1rem;
          flex-shrink: 0;
        }
        .cropper-wrapper {
          position: relative;
          width: 100%;
          flex: 1 1 auto;
          min-height: 0;
          background-color: #09090b;
          border-radius: 0.6rem;
          overflow: hidden;
        }
        .aspect-ratio-scroll {
          display: flex;
          gap: 0.4rem;
          overflow-x: auto;
          padding-bottom: 2px;
          scrollbar-width: thin;
          scrollbar-color: #38bdf8 #2d2d34;
        }
        .aspect-ratio-scroll::-webkit-scrollbar { height: 4px; }
        .aspect-ratio-scroll::-webkit-scrollbar-track { background: #2d2d34; border-radius: 2px; }
        .aspect-ratio-scroll::-webkit-scrollbar-thumb { background-color: #38bdf8; border-radius: 2px; }
        .aspect-pill {
          background: #222227;
          border: 1px solid #2d2d34;
          color: #cbd5e1;
          border-radius: 50px;
          padding: 0.25rem 0.75rem;
          font-size: 0.75rem;
          font-weight: 600;
          white-space: nowrap;
          transition: all 0.18s ease;
          cursor: pointer;
          line-height: 1.4;
        }
        .aspect-pill:hover { background: #2d2d34; color: #fff; border-color: #38bdf8; }
        .aspect-pill.active {
          background: #38bdf8;
          color: #121214;
          border-color: #38bdf8;
          box-shadow: 0 0 10px rgba(56, 189, 248, 0.4);
        }
        .cropper-section-label {
          font-size: 0.68rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #64748b;
          margin-bottom: 0.35rem;
          display: block;
        }
        .cropper-view-box { outline: 2px solid #38bdf8 !important; outline-color: #38bdf8 !important; }
        .cropper-point { background-color: #38bdf8 !important; }
        .cropper-line { background-color: #38bdf8 !important; }
      `}</style>
      <Modal.Header closeButton>
        <Modal.Title>Crop Image</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="cropper-wrapper" style={{ height: '280px' }}>
          {imageSrc && (
            <Cropper
              ref={cropperRef}
              src={imageSrc}
              style={{ height: '100%', width: '100%' }}
              viewMode={1}
              dragMode="move"
              guides={true}
              scalable={true}
              cropBoxMovable={true}
              cropBoxResizable={true}
              toggleDragModeOnDblclick={false}
              background={false}
              responsive={true}
              checkOrientation={false}
            />
          )}
        </div>

        <div>
          <span className="cropper-section-label">Aspect Ratio</span>
          <div className="aspect-ratio-scroll">
            {ASPECT_RATIOS.map((ratio) => {
              const isActive = selectedAspect.label === ratio.label;
              return (
                <button key={ratio.label} type="button" className={`aspect-pill ${isActive ? 'active' : ''}`} onClick={() => setSelectedAspect(ratio)}>
                  {ratio.label === 'Free' ? (
                    <span className="d-flex align-items-center gap-1">
                      <CsLineIcons icon="crop" size="11" /> Free
                    </span>
                  ) : (
                    ratio.label
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="d-flex align-items-center gap-2">
          <span className="cropper-section-label mb-0" style={{ minWidth: '48px' }}>
            Rotate
          </span>
          <Form.Range value={rotation} min={0} max={360} step={1} onChange={handleRotationChange} style={{ accentColor: '#38bdf8' }} />
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-light" onClick={onHide} disabled={isProcessing} className="rounded-pill px-3" size="sm">
          Cancel
        </Button>
        <Button
          variant="info"
          onClick={handleSave}
          disabled={isProcessing}
          className="rounded-pill px-4 text-dark fw-bold"
          size="sm"
          style={{ backgroundColor: '#38bdf8', borderColor: '#38bdf8' }}
        >
          {isProcessing ? 'Processing...' : 'Crop & Save'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ImageCropperModal;
