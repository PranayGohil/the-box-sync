import React, { useState, useCallback } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import Cropper from 'react-easy-crop';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import getCroppedImg from './cropImage';

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
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Initialize selected aspect ratio based on initialAspect prop
  const defaultAspect = ASPECT_RATIOS.find((r) => r.value === initialAspect) || ASPECT_RATIOS[0];
  const [selectedAspect, setSelectedAspect] = useState(defaultAspect);

  const onCropCompleteHandler = useCallback((croppedArea, croppedAreaPixelsObj) => {
    setCroppedAreaPixels(croppedAreaPixelsObj);
  }, []);

  const handleSave = async () => {
    try {
      setIsProcessing(true);
      const croppedImageBlob = await getCroppedImg(imageSrc, croppedAreaPixels, rotation);
      // convert blob to file
      const file = new File([croppedImageBlob], 'cropped-image.jpg', { type: 'image/jpeg' });
      onCropComplete(file);
      onHide();
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered backdrop="static" keyboard={false} className="cropper-modal-premium">
      <style>{`
        .cropper-modal-premium .modal-content {
          border-radius: 1.25rem;
          border: none;
          overflow: hidden;
          background: #1e1e24;
          color: #f8fafc;
        }
        .cropper-modal-premium .modal-header {
          border-bottom: 1px solid #2d2d34;
          background: #1e1e24;
          color: #f8fafc;
        }
        .cropper-modal-premium .modal-title {
          font-weight: 700;
        }
        .cropper-modal-premium .btn-close {
          filter: invert(1) grayscale(1) brightness(2);
        }
        .cropper-modal-premium .modal-body {
          background: #121214;
          padding: 1.5rem;
        }
        .cropper-modal-premium .modal-footer {
          border-top: 1px solid #2d2d34;
          background: #1e1e24;
        }
        .aspect-ratio-scroll {
          display: flex;
          gap: 0.5rem;
          overflow-x: auto;
          padding-bottom: 0.75rem;
          scrollbar-width: thin;
          scrollbar-color: #38bdf8 #2d2d34;
        }
        .aspect-ratio-scroll::-webkit-scrollbar {
          height: 6px;
        }
        .aspect-ratio-scroll::-webkit-scrollbar-track {
          background: #2d2d34;
          border-radius: 3px;
        }
        .aspect-ratio-scroll::-webkit-scrollbar-thumb {
          background-color: #38bdf8;
          border-radius: 3px;
        }
        .aspect-pill {
          background: #222227;
          border: 1px solid #2d2d34;
          color: #cbd5e1;
          border-radius: 50px;
          padding: 0.35rem 1rem;
          font-size: 0.8rem;
          font-weight: 600;
          white-space: nowrap;
          transition: all 0.2s ease;
          cursor: pointer;
        }
        .aspect-pill:hover {
          background: #2d2d34;
          color: #fff;
          border-color: #38bdf8;
        }
        .aspect-pill.active {
          background: #38bdf8;
          color: #121214;
          border-color: #38bdf8;
          box-shadow: 0 0 12px rgba(56, 189, 248, 0.4);
        }
      `}</style>
      <Modal.Header closeButton>
        <Modal.Title>Crop Image</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div style={{ position: 'relative', width: '100%', height: '400px', backgroundColor: '#09090b', borderRadius: '0.75rem', overflow: 'hidden' }}>
          {imageSrc && (
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              rotation={rotation}
              aspect={selectedAspect.value}
              onCropChange={setCrop}
              onCropComplete={onCropCompleteHandler}
              onZoomChange={setZoom}
              onRotationChange={setRotation}
            />
          )}
        </div>

        <div className="mt-4">
          <Form.Group className="mb-4">
            <Form.Label className="small fw-bold text-uppercase text-muted letter-spacing-1 mb-2 d-block">Aspect Ratio</Form.Label>
            <div className="aspect-ratio-scroll">
              {ASPECT_RATIOS.map((ratio) => {
                const isActive = selectedAspect.label === ratio.label;
                return (
                  <button key={ratio.label} type="button" className={`aspect-pill ${isActive ? 'active' : ''}`} onClick={() => setSelectedAspect(ratio)}>
                    {ratio.label === 'Free' ? (
                      <span className="d-flex align-items-center gap-1">
                        <CsLineIcons icon="crop" size="13" /> Free Crop
                      </span>
                    ) : (
                      ratio.label
                    )}
                  </button>
                );
              })}
            </div>
          </Form.Group>

          <Form.Group className="mb-3 d-flex align-items-center gap-3">
            <Form.Label className="mb-0 fw-bold text-muted small" style={{ minWidth: '60px' }}>
              Zoom
            </Form.Label>
            <Form.Range value={zoom} min={1} max={3} step={0.1} onChange={(e) => setZoom(Number(e.target.value))} style={{ accentColor: '#38bdf8' }} />
          </Form.Group>

          <Form.Group className="d-flex align-items-center gap-3">
            <Form.Label className="mb-0 fw-bold text-muted small" style={{ minWidth: '60px' }}>
              Rotate
            </Form.Label>
            <Form.Range value={rotation} min={0} max={360} step={1} onChange={(e) => setRotation(Number(e.target.value))} style={{ accentColor: '#38bdf8' }} />
          </Form.Group>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-light" onClick={onHide} disabled={isProcessing} className="rounded-pill px-4">
          Cancel
        </Button>
        <Button
          variant="info"
          onClick={handleSave}
          disabled={isProcessing}
          className="rounded-pill px-4 text-dark fw-bold"
          style={{ backgroundColor: '#38bdf8', borderColor: '#38bdf8' }}
        >
          {isProcessing ? 'Processing...' : 'Crop & Save'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ImageCropperModal;
