import React, { useState, useCallback } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import Cropper from 'react-easy-crop';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import getCroppedImg from './cropImage';

const ImageCropperModal = ({ show, onHide, imageSrc, onCropComplete, aspect = 1 }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onCropCompleteHandler = useCallback((croppedArea, croppedAreaPixelsObj) => {
    setCroppedAreaPixels(croppedAreaPixelsObj);
  }, []);

  const handleSave = async () => {
    try {
      setIsProcessing(true);
      const croppedImageBlob = await getCroppedImg(imageSrc, croppedAreaPixels, rotation);
      // convert blob to file
      const file = new File([croppedImageBlob], "cropped-image.jpg", { type: "image/jpeg" });
      onCropComplete(file);
      onHide();
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered backdrop="static" keyboard={false}>
      <Modal.Header closeButton>
        <Modal.Title>Crop Image</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div style={{ position: 'relative', width: '100%', height: '400px', backgroundColor: '#333' }}>
          {imageSrc && (
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              rotation={rotation}
              aspect={aspect}
              onCropChange={setCrop}
              onCropComplete={onCropCompleteHandler}
              onZoomChange={setZoom}
              onRotationChange={setRotation}
            />
          )}
        </div>
        <div className="mt-4">
          <Form.Group className="mb-3 d-flex align-items-center gap-3">
            <Form.Label className="mb-0 fw-bold" style={{ minWidth: '60px' }}>Zoom</Form.Label>
            <Form.Range
              value={zoom}
              min={1}
              max={3}
              step={0.1}
              onChange={(e) => setZoom(Number(e.target.value))}
            />
          </Form.Group>
          <Form.Group className="d-flex align-items-center gap-3">
            <Form.Label className="mb-0 fw-bold" style={{ minWidth: '60px' }}>Rotate</Form.Label>
            <Form.Range
              value={rotation}
              min={0}
              max={360}
              step={1}
              onChange={(e) => setRotation(Number(e.target.value))}
            />
          </Form.Group>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={onHide} disabled={isProcessing}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleSave} disabled={isProcessing}>
          {isProcessing ? 'Processing...' : 'Crop & Save'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ImageCropperModal;
