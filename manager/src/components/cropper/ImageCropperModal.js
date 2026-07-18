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
        cropper
          .getCroppedCanvas({ imageSmoothingQuality: 'high' })
          .toBlob((blob) => {
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
          background: #ffffff;
          color: #1e293b;
          max-height: 95vh;
          display: flex;
          flex-direction: column;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        }
        .cropper-modal-premium .modal-header {
          border-bottom: 1px solid #e2e8f0;
          background: #ffffff;
          color: #1e293b;
          padding: 0.75rem 1.25rem;
          flex-shrink: 0;
        }
        .cropper-modal-premium .modal-title {
          font-weight: 700;
          font-size: 1rem;
        }
        .cropper-modal-premium .modal-body {
          background: #f8fafc;
          padding: 0.85rem 1rem;
          overflow: hidden;
          flex: 1 1 auto;
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
        }
        .cropper-modal-premium .modal-footer {
          border-top: 1px solid #e2e8f0;
          background: #ffffff;
          padding: 0.65rem 1rem;
          flex-shrink: 0;
        }
        .cropper-wrapper {
          position: relative;
          width: 100%;
          flex: 1 1 auto;
          min-height: 0;
          background-color: #f1f5f9;
          border-radius: 0.6rem;
          overflow: hidden;
          border: 1px solid #e2e8f0;
        }
        .aspect-ratio-scroll {
          display: flex;
          gap: 0.4rem;
          overflow-x: auto;
          padding-bottom: 2px;
          scrollbar-width: thin;
          scrollbar-color: #1ea8e7 #e2e8f0;
        }
        .aspect-ratio-scroll::-webkit-scrollbar { height: 4px; }
        .aspect-ratio-scroll::-webkit-scrollbar-track { background: #e2e8f0; border-radius: 2px; }
        .aspect-ratio-scroll::-webkit-scrollbar-thumb { background-color: #1ea8e7; border-radius: 2px; }
        .aspect-pill {
          background: #ffffff;
          border: 1px solid #cbd5e1;
          color: #475569;
          border-radius: 50px;
          padding: 0.25rem 0.75rem;
          font-size: 0.75rem;
          font-weight: 600;
          white-space: nowrap;
          transition: all 0.18s ease;
          cursor: pointer;
          line-height: 1.4;
        }
        .aspect-pill:hover { background: #f1f5f9; color: #0f172a; border-color: #1ea8e7; }
        .aspect-pill.active {
          background: #1ea8e7;
          color: #ffffff;
          border-color: #1ea8e7;
          box-shadow: 0 0 10px rgba(30, 168, 231, 0.3);
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
        .cropper-view-box { outline: 2px solid #1ea8e7 !important; outline-color: #1ea8e7 !important; }
        .cropper-point { background-color: #1ea8e7 !important; }
        .cropper-line { background-color: #1ea8e7 !important; }
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
              aspectRatio={selectedAspect.value === undefined ? NaN : selectedAspect.value}
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
          <span className="cropper-section-label mb-0" style={{ minWidth: '48px' }}>Rotate</span>
          <Form.Range value={rotation} min={0} max={360} step={1} onChange={handleRotationChange} style={{ accentColor: '#1ea8e7' }} />
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={onHide} disabled={isProcessing} className="rounded-pill px-3" size="sm">
          Cancel
        </Button>
        <Button
          variant="info"
          onClick={handleSave}
          disabled={isProcessing}
          className="rounded-pill px-4 text-white fw-bold"
          size="sm"
          style={{ backgroundColor: '#1ea8e7', borderColor: '#1ea8e7' }}
        >
          {isProcessing ? 'Processing...' : 'Crop & Save'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ImageCropperModal;
