import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Spinner, Button, Alert, Modal, Card } from 'react-bootstrap';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import Webcam from 'react-webcam';
import * as faceapi from 'face-api.js';
import HtmlHead from 'components/html-head/HtmlHead';

const parseTimeToMinutes = (timeStr) => {
  if (!timeStr) return 0;
  const [time, period] = timeStr.split(" ");
  if (!time || !period) return 0;
  let [hours, minutes] = time.split(":").map(Number);
  if (period === "PM" && hours !== 12) hours += 12;
  else if (period === "AM" && hours === 12) hours = 0;
  return hours * 60 + minutes;
};

const getLateMinutes = (currentTimeStr, orgRules) => {
  if (!orgRules) return 0;
  const shiftStartStr = orgRules.shift_start_time || "09:00 AM";
  const threshold = Number(orgRules.late_threshold_minutes) || 0;
  const currentMins = parseTimeToMinutes(currentTimeStr);
  const shiftStartMins = parseTimeToMinutes(shiftStartStr);
  if (currentMins > shiftStartMins + threshold) {
    return currentMins - shiftStartMins;
  }
  return 0;
};

const getOvertimeMinutes = (currentTimeStr, orgRules) => {
  if (!orgRules) return 0;
  const shiftEndStr = orgRules.shift_end_time || "06:00 PM";
  const shiftEndMins = parseTimeToMinutes(shiftEndStr);
  const currentMins = parseTimeToMinutes(currentTimeStr);
  const diff = currentMins - shiftEndMins;
  return diff > 0 ? diff : 0;
};

const KioskScan = () => {
  const { company_id } = useParams();

  // States
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  // Face scan states
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [faceDataLoaded, setFaceDataLoaded] = useState(false);
  const [staffList, setStaffList] = useState([]);
  const [cameraError, setCameraError] = useState(null);
  const [companyInfo, setCompanyInfo] = useState(null);
  const [companyConfig, setCompanyConfig] = useState(null);

  // Liveness & Scan States
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [error, setError] = useState('');
  const [livenessProgress, setLivenessProgress] = useState(0);
  const [livenessStatus, setLivenessStatus] = useState('');
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [matchedStaff, setMatchedStaff] = useState(null);

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
      }, 4000);
    }
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
        if (res.data.success) {
          if (res.data.data) {
            setStaffList(res.data.data);
            setFaceDataLoaded(true);
          }
          if (res.data.company) {
            setCompanyInfo(res.data.company);
          }
          if (res.data.config) {
            setCompanyConfig(res.data.config);
          }
        }
      } catch (err) {
        console.error("Error fetching face encodings:", err);
      }
    };

    if (!modelsLoaded) loadModels();
    if (!faceDataLoaded) fetchFaces();
  }, [company_id, modelsLoaded, faceDataLoaded]);

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
        setShowCameraModal(false);
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

  const title = 'Attendance Terminal';
  const description = 'Face recognition attendance terminal - position yourself before the camera to scan.';

  return (
    <>
      <HtmlHead title={title} description={description} />

      <div style={{ minHeight: '100vh', background: 'radial-gradient(circle at 50% 50%, #f8fafc 0%, #e2e8f0 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <Card className="shadow-lg border-0 kiosk-card">
          <Card.Body className="kiosk-card-body text-center d-flex flex-column align-items-center">
            {/* Company Logo / Branding at top center */}
            <div className="d-flex justify-content-center mb-5 w-100">
              {companyInfo?.logo ? (
                <img 
                  src={process.env.REACT_APP_UPLOAD_DIR + companyInfo.logo}
                  alt={companyInfo?.name || "Company Logo"} 
                  style={{ maxHeight: '60px', objectFit: 'contain' }}
                />
              ) : (
                <div className="kiosk-brand-logo">THE <span>BOX</span></div>
              )}
            </div>

            <div className="login-login-form-header mb-4 text-center">
              <span className="badge bg-soft-primary text-primary px-3 py-2 rounded-pill fw-bold text-uppercase mb-3 animate__animated animate__fadeIn" style={{ letterSpacing: '0.05em', fontSize: '0.75rem' }}>
                Attendance Terminal
              </span>
              <h2 className="login-login-form-title mt-2">Scan to Check-In/Out</h2>
              <p className="login-login-form-subtitle mt-2 px-3">Position yourself before the camera to record your attendance</p>
            </div>

            <div className="d-flex flex-column align-items-center justify-content-center my-4 w-100">
              {(!modelsLoaded || !faceDataLoaded) ? (
                <div className="d-flex flex-column align-items-center justify-content-center py-4">
                  <Spinner animation="border" variant="primary" className="mb-3" />
                  <span className="text-muted fw-semibold">
                    {!modelsLoaded ? "Loading AI models..." : "Fetching staff face data..."}
                  </span>
                </div>
              ) : (
                <div className="scan-btn-container">
                  <div className="pulse-ring" />
                  <Button 
                    className="scan-btn" 
                    onClick={() => {
                      setCameraError(null);
                      setShowCameraModal(true);
                    }} 
                    disabled={!modelsLoaded || !faceDataLoaded}
                  >
                    <CsLineIcons icon="camera" size={24} />
                    <span>Initialize Scanner</span>
                  </Button>
                </div>
              )}
            </div>

            {/* STATUS MESSAGE AREA */}
            <div style={{ minHeight: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '10px' }} className="w-100">
              {loading ? (
                <div className="d-flex align-items-center text-primary">
                  <Spinner animation="border" size="sm" className="me-2" />
                  <span className="fw-semibold">Processing attendance...</span>
                </div>
              ) : message ? (
                <div className={`p-3 rounded-3 fw-bold w-100 text-center ${message.type === 'success' ? 'bg-soft-success text-success' : 'bg-soft-danger text-danger'}`}>
                  {message.type === 'success' ? (
                    <CsLineIcons icon="check-circle" size="20" className="me-2" />
                  ) : (
                    <CsLineIcons icon="close-circle" size="20" className="me-2" />
                  )}
                  {message.text}
                </div>
              ) : null}
            </div>

            <div className="w-100 border-top mt-5 pt-4 text-center" style={{ borderColor: 'rgba(226, 232, 240, 0.6)' }}>
              <span className="text-muted" style={{ fontSize: '0.75rem', letterSpacing: '0.05em', textTransform: 'uppercase', opacity: 0.7 }}>
                Powered by <strong style={{ color: '#0f172a' }}>TheBoxSync</strong>
              </span>
            </div>
          </Card.Body>
        </Card>
      </div>

      {/* Face Scanner Modal */}
      <Modal
        show={showCameraModal}
        onHide={() => {
          setShowCameraModal(false);
          setError('');
        }}
        centered
        size="lg"
        dialogClassName="scanner-modal"
        backdrop="static"
      >
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold">
            <CsLineIcons icon="scan" className="me-2 text-primary" />
            AI Face Scanner
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4 d-flex flex-column align-items-center" style={{ background: '#0f172a' }}>
          {error && (
            <Alert variant="danger" className="w-100 mb-4 text-center rounded-3 fw-bold border-0" style={{ maxWidth: '640px', background: '#fff1f2', color: '#e11d48' }} onClose={() => setError('')} dismissible>
              <CsLineIcons icon="error-hexagon" className="me-2" />
              {error}
            </Alert>
          )}

          {cameraError ? (
            <div className="text-danger fw-bold py-5 text-center">
              <CsLineIcons icon="warning-hexagon" size="30" className="mb-2 d-block mx-auto" />
              Camera access denied or not available.
            </div>
          ) : (
            <div className="webcam-container" style={{ width: '100%', maxWidth: '640px' }}>
              <Webcam
                ref={webcamRef}
                audio={false}
                screenshotFormat="image/jpeg"
                videoConstraints={{ facingMode: "user" }}
                onUserMediaError={() => setCameraError(true)}
                style={{
                  width: '100%',
                  height: 'auto',
                  objectFit: 'cover',
                  aspectRatio: '4/3',
                  display: 'block'
                }}
              />
              {showCameraModal && (
                <>
                  <div className="scanner-overlay" />
                  {detecting && <div className="scanner-line" />}
                  <div className="camera-status-text">
                    {detecting ? `${livenessStatus} (${livenessProgress}%)` : 'POSITION FACE IN FRAME'}
                  </div>
                </>
              )}
            </div>
          )}

          <Button
            variant={detecting ? "secondary" : "primary"}
            size="lg"
            className="mt-5 rounded-pill fw-bold px-5 py-3 shadow"
            disabled={detecting || cameraError}
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
        </Modal.Body>
      </Modal>

      {/* Match Confirmation Modal */}
      <Modal show={showMatchModal} onHide={() => { setShowMatchModal(false); setMatchedStaff(null); }} centered backdrop="static">
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold">Confirm Attendance</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4 text-center">
          {matchedStaff && (() => {
            const isCheckOut = matchedStaff.todayAttendance && 
                               matchedStaff.todayAttendance.sessions && 
                               matchedStaff.todayAttendance.sessions.length > 0 && 
                               matchedStaff.todayAttendance.sessions[matchedStaff.todayAttendance.sessions.length - 1].out_time === null;
            
            const currentTime = getCurrentTime();
            const orgRules = companyConfig?.org_rules;
            
            let actionLabel = "Check-In";
            let statusBadge = null;
            
            if (isCheckOut) {
              actionLabel = "Check-Out";
              const otMins = getOvertimeMinutes(currentTime, orgRules);
              if (otMins > 0) {
                const hours = Math.floor(otMins / 60);
                const mins = otMins % 60;
                const otStr = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
                statusBadge = (
                  <span className="badge bg-soft-purple text-purple fw-bold px-3 py-2 rounded-pill mt-2" style={{ background: 'rgba(124, 58, 237, 0.1)', color: '#7c3aed', border: '1px solid rgba(124, 58, 237, 0.2)' }}>
                    ⚡ Overtime: {otStr}
                  </span>
                );
              } else {
                statusBadge = (
                  <span className="badge bg-soft-primary text-primary fw-bold px-3 py-2 rounded-pill mt-2" style={{ background: 'rgba(35, 179, 244, 0.1)', color: '#23b3f4', border: '1px solid rgba(35, 179, 244, 0.2)' }}>
                    Standard Shift hours
                  </span>
                );
              }
            } else {
              const lateMins = getLateMinutes(currentTime, orgRules);
              if (lateMins > 0) {
                statusBadge = (
                  <span className="badge bg-soft-danger text-danger fw-bold px-3 py-2 rounded-pill mt-2" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#dc2626', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                    🔴 Late check-in by {lateMins}m
                  </span>
                );
              } else {
                statusBadge = (
                  <span className="badge bg-soft-success text-success fw-bold px-3 py-2 rounded-pill mt-2" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                    On Time
                  </span>
                );
              }
            }

            return (
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
                <p className="text-muted fw-bold mb-3">ID: {matchedStaff.staff_id}</p>

                <div className="mb-4 p-3 bg-light rounded-3 d-flex flex-column align-items-center justify-content-center">
                  <span className="text-muted fw-bold text-uppercase mb-1" style={{ fontSize: '0.75rem', letterSpacing: '0.05em' }}>Action: {actionLabel}</span>
                  <h4 className="fw-bold text-dark mb-1">Time: {currentTime}</h4>
                  {statusBadge}
                </div>

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
            );
          })()}
        </Modal.Body>
      </Modal>

      <style>{`
        .kiosk-card {
          width: 100%;
          max-width: 550px;
          border-radius: 2.25rem;
          background: #ffffff;
          box-shadow: 0 20px 40px -15px rgba(15, 23, 42, 0.08) !important;
          border: 1px solid rgba(226, 232, 240, 0.8) !important;
          transition: all 0.3s ease;
        }

        .kiosk-card-body {
          padding: 4rem 3.5rem !important;
        }

        .kiosk-brand-logo {
          font-size: 1.8rem;
          font-weight: 900;
          color: #0f172a;
          letter-spacing: 0.15em;
          text-align: center;
        }

        .kiosk-brand-logo span {
          color: #23b3f4;
        }

        .login-login-form-eyebrow {
          font-size: 0.85rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #23b3f4;
          font-weight: 700;
        }

        .login-login-form-title {
          font-size: 2.25rem;
          font-weight: 850;
          color: #0f172a;
          line-height: 1.25;
          letter-spacing: -0.02em;
        }

        .login-login-form-subtitle {
          font-size: 0.95rem;
          color: #64748b;
          line-height: 1.5;
          font-weight: 500;
        }

        .scanner-modal .modal-content {
          border-radius: 2rem;
          border: none;
          overflow: hidden;
          background: #0f172a;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        }
        
        .scanner-modal .modal-header {
          border-bottom: 1px solid rgba(255,255,255,0.1);
          background: rgba(15, 23, 42, 0.95);
          color: white;
        }
        
        .scanner-modal .btn-close {
          filter: invert(1) grayscale(100%) brightness(200%);
        }

        .webcam-container {
          position: relative;
          border-radius: 1.5rem;
          overflow: hidden;
          box-shadow: 0 0 0 4px rgba(35, 179, 244, 0.2);
        }

        .scanner-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(to bottom, rgba(35,179,244,0.3) 0%, rgba(35,179,244,0) 10%, rgba(35,179,244,0) 90%, rgba(35,179,244,0.3) 100%);
          pointer-events: none;
          z-index: 10;
        }
        
        .scanner-line {
          position: absolute;
          width: 100%;
          height: 3px;
          background: #23b3f4;
          box-shadow: 0 0 15px 2px #23b3f4;
          top: 0;
          left: 0;
          z-index: 11;
          animation: scan 2.5s infinite linear;
        }

        @keyframes scan {
          0% { top: 0; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }

        .camera-status-text {
          position: absolute;
          bottom: 1rem;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(0,0,0,0.6);
          backdrop-filter: blur(5px);
          color: white;
          padding: 0.5rem 1.5rem;
          border-radius: 50px;
          font-weight: 600;
          font-size: 0.85rem;
          letter-spacing: 0.05em;
          z-index: 12;
        }

        .scan-btn-container {
          position: relative;
          display: inline-block;
          padding: 10px;
        }

        .scan-btn {
          background: linear-gradient(135deg, #23b3f4 0%, #0284c7 100%) !important;
          border: none !important;
          border-radius: 50px !important;
          padding: 1.1rem 3.5rem !important;
          font-size: 1.2rem !important;
          font-weight: 700 !important;
          box-shadow: 0 10px 25px rgba(35, 179, 244, 0.3) !important;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
          color: white !important;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          position: relative;
          z-index: 2;
        }

        .scan-btn:hover:not(:disabled) {
          transform: translateY(-3px);
          box-shadow: 0 15px 30px rgba(35, 179, 244, 0.45) !important;
        }

        .scan-btn:disabled {
          background: #cbd5e1 !important;
          box-shadow: none !important;
          cursor: not-allowed;
          transform: none;
        }

        .pulse-ring {
          position: absolute;
          top: 10px;
          left: 10px;
          right: 10px;
          bottom: 10px;
          border-radius: 50px;
          box-shadow: 0 0 0 0 rgba(35, 179, 244, 0.6);
          animation: pulseGlow 2s infinite;
          z-index: 1;
          pointer-events: none;
        }

        @keyframes pulseGlow {
          0% {
            box-shadow: 0 0 0 0 rgba(35, 179, 244, 0.6);
          }
          70% {
            box-shadow: 0 0 0 15px rgba(35, 179, 244, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(35, 179, 244, 0);
          }
        }

        .bg-soft-success {
          background-color: rgba(25, 135, 84, 0.1) !important;
        }
        .bg-soft-danger {
          background-color: rgba(220, 53, 69, 0.1) !important;
        }
        .bg-soft-purple {
          background-color: rgba(124, 58, 237, 0.1) !important;
        }
        .text-purple {
          color: #7c3aed !important;
        }
        .bg-soft-primary {
          background-color: rgba(35, 179, 244, 0.1) !important;
        }
        .text-primary {
          color: #23b3f4 !important;
        }

        /* ── RESPONSIVE MEDIA QUERIES ── */
        @media (max-width: 768px) {
          .kiosk-card {
            max-width: 460px;
            border-radius: 1.75rem;
          }
          .kiosk-card-body {
            padding: 3rem 2rem !important;
          }
          .login-login-form-title {
            font-size: 1.85rem !important;
          }
          .scan-btn {
            padding: 0.95rem 2.75rem !important;
            font-size: 1.1rem !important;
          }
        }

        @media (max-width: 480px) {
          .kiosk-card {
            max-width: 100%;
            border-radius: 1.5rem;
          }
          .kiosk-card-body {
            padding: 2.5rem 1.5rem !important;
          }
          .login-login-form-title {
            font-size: 1.5rem !important;
          }
          .scan-btn {
            padding: 0.85rem 2.25rem !important;
            font-size: 1.05rem !important;
          }
          .scanner-modal .modal-content {
            border-radius: 1.5rem !important;
          }
          .webcam-container {
            border-radius: 1rem !important;
          }
        }
      `}</style>
    </>
  );
};

export default KioskScan;
