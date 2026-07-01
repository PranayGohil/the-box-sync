import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Card, Spinner, Button, ButtonGroup, Alert, Modal, Badge } from 'react-bootstrap';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import Webcam from 'react-webcam';
import * as faceapi from 'face-api.js';

const KioskScan = () => {
  const { company_id } = useParams();

  // Modes: 'card' or 'face'
  const [scanMode, setScanMode] = useState('card');

  // States
  const [scanValue, setScanValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  // Face scan states
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [faceDataLoaded, setFaceDataLoaded] = useState(false);
  const [staffList, setStaffList] = useState([]);
  const [cameraError, setCameraError] = useState(null);

  // Liveness States
  const [detecting, setDetecting] = useState(false);
  const [error, setError] = useState('');
  const [livenessProgress, setLivenessProgress] = useState(0);
  const [livenessStatus, setLivenessStatus] = useState('');
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [matchedStaff, setMatchedStaff] = useState(null);

  const inputRef = useRef(null);
  const webcamRef = useRef(null);

  const getCurrentTime = () => {
    const now = new Date();
    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
  };

  const getTodayDate = () => {
    const options = { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" };
    return new Intl.DateTimeFormat("en-CA", options).format(new Date());
  };

  // --- Theme Initialization (to fix missing CSS) ---
  useEffect(() => {
    const htmlTag = document.documentElement;
    setTimeout(() => {
      htmlTag.setAttribute('data-show', 'true');
    }, 30);
    htmlTag.setAttribute('data-color', 'light-blue');
    htmlTag.setAttribute('data-layout', 'fluid');
    htmlTag.setAttribute('data-radius', 'rounded');
    htmlTag.setAttribute('data-navcolor', 'default');
    htmlTag.setAttribute('data-placement', 'vertical');
    htmlTag.setAttribute('data-dimension', 'default');
    htmlTag.setAttribute('data-behaviour', 'unpinned');
    document.body.classList.add('h-100');

    return () => {
      document.body.classList.remove('h-100');
    };
  }, []);

  // --- Core API Submit ---
  const submitScan = async (idToScan) => {
    setLoading(true);
    setScanValue('');
    setMessage(null);

    try {
      const res = await axios.post(`${process.env.REACT_APP_API}/attendance/kiosk-scan`, {
        company_id,
        scanned_id: idToScan,
        date: getTodayDate(),
        time: getCurrentTime()
      });

      if (res.data && res.data.success) {
        setMessage({ type: 'success', text: res.data.message || 'Scan successful!' });
      } else {
        setMessage({ type: 'error', text: res.data.message || 'Scan failed.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Error processing scan.' });
    } finally {
      setLoading(false);
      // Cooldown before next scan
      setTimeout(() => {
        setMessage(null);
        if (scanMode === 'card' && inputRef.current) {
          inputRef.current.focus();
        }
      }, 4000);
    }
  };

  // --- Card Mode Handling ---
  useEffect(() => {
    let cleanup = () => { };
    if (scanMode === 'card') {
      const focusInput = () => {
        if (inputRef.current) inputRef.current.focus();
      };
      focusInput();
      window.addEventListener('click', focusInput);
      cleanup = () => window.removeEventListener('click', focusInput);
    }
    return cleanup;
  }, [scanMode]);

  const handleCardSubmit = (e) => {
    e.preventDefault();
    const idToScan = scanValue.trim();
    if (!idToScan) return;
    submitScan(idToScan);
  };

  // --- Face Scan Initialization ---
  useEffect(() => {
    const loadModels = async () => {
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
          faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
          faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
        ]);
        setModelsLoaded(true);
      } catch (err) {
        console.error("Error loading face-api models:", err);
      }
    };

    const fetchFaces = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API}/attendance/kiosk-faces/${company_id}`);
        if (res.data.success && res.data.data) {
          setStaffList(res.data.data);
          setFaceDataLoaded(true);
        }
      } catch (err) {
        console.error("Error fetching face encodings:", err);
      }
    };

    if (scanMode === 'face') {
      if (!modelsLoaded) loadModels();
      if (!faceDataLoaded) fetchFaces();
    }
  }, [scanMode, company_id, modelsLoaded, faceDataLoaded]);

  const calculateEAR = (landmarks) => {
    const leftEye = landmarks.getLeftEye();
    const rightEye = landmarks.getRightEye();

    const getDistance = (p1, p2) => Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);

    const eyeEAR = (eye) => {
      const vertical1 = getDistance(eye[1], eye[5]);
      const vertical2 = getDistance(eye[2], eye[4]);
      const horizontal = getDistance(eye[0], eye[3]);
      return (vertical1 + vertical2) / (2.0 * horizontal);
    };

    return (eyeEAR(leftEye) + eyeEAR(rightEye)) / 2.0;
  };

  const handleFaceDetection = async () => {
    if (!modelsLoaded || !faceDataLoaded || staffList.length === 0) {
      setError('Models or staff face data not loaded.');
      return;
    }

    try {
      setDetecting(true);
      setError('');
      setLivenessProgress(0);
      setLivenessStatus('Positioning face...');

      const framesToCapture = 30;
      const intervalMs = 100;
      const screenshots = [];

      /* eslint-disable no-await-in-loop, no-continue */
      for (let i = 0; i < framesToCapture; i++) {
        setLivenessStatus('Please BLINK your eyes...');
        setLivenessProgress(Math.round(((i + 1) / framesToCapture) * 50));

        await new Promise((resolve) => setTimeout(resolve, intervalMs));

        if (!webcamRef.current) continue;
        const screenshot = webcamRef.current.getScreenshot();
        if (screenshot) {
          screenshots.push(screenshot);
        }
      }

      if (screenshots.length === 0) {
        setError('No frames captured. Please ensure webcam is accessible.');
        return;
      }

      const earHistory = [];
      let lastSuccessfulImage = null;

      for (let i = 0; i < screenshots.length; i++) {
        setLivenessStatus('Verifying liveness...');
        setLivenessProgress(50 + Math.round(((i + 1) / screenshots.length) * 50));

        const image = await faceapi.fetchImage(screenshots[i]);
        // Compute ONLY landmarks to calculate EAR quickly
        const detection = await faceapi.detectSingleFace(image, new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.25 }))
          .withFaceLandmarks();

        if (detection) {
          const ear = calculateEAR(detection.landmarks);
          earHistory.push(ear);
          lastSuccessfulImage = image;
        }
      }
      /* eslint-enable no-await-in-loop, no-continue */

      if (earHistory.length < 8) {
        setError('Face was not stable. Please hold still during scanning.');
        return;
      }

      let minIndex = -1;
      let minEAR = 999;
      for (let k = 0; k < earHistory.length; k++) {
        if (earHistory[k] < minEAR) {
          minEAR = earHistory[k];
          minIndex = k;
        }
      }

      let maxBefore = 0;
      for (let k = 0; k < minIndex; k++) {
        if (earHistory[k] > maxBefore) {
          maxBefore = earHistory[k];
        }
      }

      let maxAfter = 0;
      for (let k = minIndex + 1; k < earHistory.length; k++) {
        if (earHistory[k] > maxAfter) {
          maxAfter = earHistory[k];
        }
      }

      // Verify physical liveness by checking for a distinct eye blink valley
      const hasValleyBefore = minIndex > 0 && (maxBefore - minEAR >= 0.015) && (minEAR / maxBefore < 0.92);
      const hasValleyAfter = minIndex < earHistory.length - 1 && (maxAfter - minEAR >= 0.015) && (minEAR / maxAfter < 0.92);
      const isLivenessVerified = hasValleyBefore && hasValleyAfter;

      if (!isLivenessVerified) {
        setError('Liveness check failed! You must physically blink your eyes during scanning. Photo/mobile spoofing detected.');
        return;
      }

      if (!lastSuccessfulImage) {
        setError('Failed to capture a clear face. Please try again.');
        return;
      }

      setLivenessStatus('Matching face...');
      setLivenessProgress(100);

      // Extract face descriptor ONCE on the last successful image
      const finalDetection = await faceapi.detectSingleFace(lastSuccessfulImage, new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.25 }))
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!finalDetection) {
        setError('Failed to capture a clear face descriptor. Please try again.');
        return;
      }
      const matchedDescriptor = finalDetection.descriptor;

      const labeledDescriptors = staffList
        .filter(staff => staff.face_encoding)
        .map((staff) => {
          const floatDesc = new Float32Array(Object.values(staff.face_encoding));
          return new faceapi.LabeledFaceDescriptors(staff.staff_id, [floatDesc]);
        });

      if (labeledDescriptors.length === 0) {
        setError('No staff face data found in the system.');
        return;
      }

      const faceMatcher = new faceapi.FaceMatcher(labeledDescriptors, 0.55);
      const match = faceMatcher.findBestMatch(matchedDescriptor);

      if (match.label === 'unknown') {
        setError('No matching staff found. Please try again.');
      } else {
        setError('');
        // Found a match!
        const matchedObj = staffList.find((s) => s.staff_id === match.label);
        if (matchedObj) {
          setMatchedStaff(matchedObj);
          setShowMatchModal(true);
        } else {
          submitScan(match.label);
        }
      }

    } catch (err) {
      console.error(err);
      setError('Face detection failed. Please try again.');
    } finally {
      setDetecting(false);
      setLivenessProgress(0);
      setLivenessStatus('');
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8f9fa', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>

      {/* Inline styles for the overlay elements */}
      <style>{`
        .scanner-overlay {
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          border: 2px solid rgba(0, 255, 0, 0.5);
          box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.5);
          border-radius: 50%;
          width: 250px;
          height: 350px;
          margin: auto;
          pointer-events: none;
          z-index: 10;
        }
        .scanner-line {
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 2px;
          background: rgba(0, 255, 0, 0.8);
          box-shadow: 0 0 10px rgba(0, 255, 0, 0.8);
          animation: scan 2s linear infinite;
          z-index: 11;
        }
        @keyframes scan {
          0% { top: 0%; }
          50% { top: 100%; }
          100% { top: 0%; }
        }
        .camera-status-text {
          position: absolute;
          bottom: 20px;
          left: 0;
          right: 0;
          text-align: center;
          color: #00ff00;
          font-weight: bold;
          font-size: 1.2rem;
          text-shadow: 1px 1px 2px #000;
          z-index: 12;
        }
      `}</style>

      <Card className="shadow-lg border-0" style={{ width: '100%', maxWidth: '650px', borderRadius: '20px' }}>
        <Card.Body className="p-5 text-center">

          <div className="mb-4">
            <h2 className="fw-bold text-dark mb-1">Employee Check-in/out</h2>
            <p className="text-muted">Select your preferred check-in method.</p>
          </div>

          <ButtonGroup className="mb-4 w-100 shadow-sm rounded-pill overflow-hidden">
            <Button
              variant={scanMode === 'card' ? 'primary' : 'light'}
              className="fw-bold px-4 py-2"
              onClick={() => setScanMode('card')}
            >
              <CsLineIcons icon="barcode" size="18" className="me-2" /> ID Card Scan
            </Button>
            <Button
              variant={scanMode === 'face' ? 'primary' : 'light'}
              className="fw-bold px-4 py-2"
              onClick={() => setScanMode('face')}
            >
              <CsLineIcons icon="camera" size="18" className="me-2" /> Face Scan
            </Button>
          </ButtonGroup>

          {/* CARD MODE */}
          {scanMode === 'card' && (
            <div className="py-3">
              <div
                className="bg-light text-primary d-inline-flex align-items-center justify-content-center rounded-circle mb-3 border border-primary"
                style={{ width: '80px', height: '80px' }}
              >
                <CsLineIcons icon="print" size="35" />
              </div>
              <p className="text-muted mb-4">Please scan your ID card using the barcode/RFID scanner.</p>

              <form onSubmit={handleCardSubmit} style={{ opacity: 0, position: 'absolute', zIndex: -1 }}>
                <input
                  ref={inputRef}
                  type="text"
                  value={scanValue}
                  onChange={(e) => setScanValue(e.target.value)}
                  onBlur={() => {
                    if (scanMode === 'card') {
                      setTimeout(() => { if (inputRef.current) inputRef.current.focus(); }, 10);
                    }
                  }}
                  autoFocus
                />
              </form>
            </div>
          )}

          {/* FACE MODE */}
          {scanMode === 'face' && (
            <div className="py-3 d-flex flex-column align-items-center">
              {(!modelsLoaded || !faceDataLoaded) ? (
                <div className="d-flex flex-column align-items-center justify-content-center py-5">
                  <Spinner animation="border" variant="primary" className="mb-3" />
                  <span className="text-muted fw-semibold">
                    {!modelsLoaded ? "Loading AI models..." : "Fetching staff face data..."}
                  </span>
                </div>
              ) : cameraError ? (
                <div className="text-danger fw-bold py-4">
                  <CsLineIcons icon="warning-hexagon" size="30" className="mb-2 d-block mx-auto" />
                  Camera access denied or not available.
                </div>
              ) : (
                <div className="d-flex flex-column align-items-center w-100">
                  {error && (
                    <Alert variant="danger" className="w-100 mb-4 text-center rounded-3 fw-bold border-0">
                      <CsLineIcons icon="error-hexagon" className="me-2" />
                      {error}
                    </Alert>
                  )}

                  <div className="position-relative overflow-hidden bg-dark rounded" style={{ width: '100%', maxWidth: '400px', aspectRatio: '4/3' }}>
                    <Webcam
                      ref={webcamRef}
                      audio={false}
                      screenshotFormat="image/jpeg"
                      videoConstraints={{ facingMode: "user" }}
                      onUserMediaError={() => setCameraError(true)}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />

                    <div className="scanner-overlay" />
                    {detecting && <div className="scanner-line" />}
                    <div className="camera-status-text">
                      {detecting ? `${livenessStatus} (${livenessProgress}%)` : 'POSITION FACE IN FRAME'}
                    </div>
                  </div>

                  <Button
                    variant={detecting ? "secondary" : "primary"}
                    size="lg"
                    className="mt-4 rounded-pill fw-bold px-5 py-3 shadow"
                    disabled={detecting}
                    onClick={handleFaceDetection}
                    style={{ minWidth: '250px' }}
                  >
                    {detecting ? (
                      <>
                        <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CsLineIcons icon="fingerprint" className="me-2" size={20} />
                        Initiate Scan
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* STATUS MESSAGE AREA */}
          <div style={{ minHeight: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '15px' }}>
            {loading ? (
              <div className="d-flex align-items-center text-primary">
                <Spinner animation="border" size="sm" className="me-2" />
                <span className="fw-semibold">Processing attendance...</span>
              </div>
            ) : message ? (
              <div className={`p-3 rounded-3 fw-bold w-100 ${message.type === 'success' ? 'bg-soft-success text-success' : 'bg-soft-danger text-danger'}`}>
                {message.type === 'success' ? (
                  <CsLineIcons icon="check-circle" size="20" className="me-2" />
                ) : (
                  <CsLineIcons icon="close-circle" size="20" className="me-2" />
                )}
                {message.text}
              </div>
            ) : null}
          </div>

        </Card.Body>
      </Card>

      {/* Match Confirmation Modal */}
      <Modal show={showMatchModal} onHide={() => { setShowMatchModal(false); setMatchedStaff(null); }} centered backdrop="static">
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold">Confirm Attendance</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4 text-center">
          {matchedStaff && (
            <>
              <div className="mb-3 d-flex justify-content-center">
                {matchedStaff.photo ? (
                  <img
                    src={`${process.env.REACT_APP_UPLOAD_DIR}${matchedStaff.photo}`}
                    alt={matchedStaff.f_name}
                    style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover' }}
                  />
                ) : (
                  <div
                    style={{ width: '100px', height: '100px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}
                    className="d-flex align-items-center justify-content-center"
                  >
                    <CsLineIcons icon="user" size={42} />
                  </div>
                )}
              </div>
              <h3 className="fw-bolder text-dark mb-1">{matchedStaff.f_name} {matchedStaff.l_name}</h3>
              <p className="text-muted fw-bold mb-4">ID: {matchedStaff.staff_id}</p>

              <Button
                variant="primary"
                size="lg"
                className="rounded-pill w-100 fw-bold shadow-sm"
                onClick={() => {
                  setShowMatchModal(false);
                  submitScan(matchedStaff.staff_id);
                }}
              >
                <CsLineIcons icon="check-circle" className="me-2" size={20} />
                Confirm & Submit Attendance
              </Button>
            </>
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default KioskScan;
