import React, { useState, useEffect, useRef } from 'react';
import { useHistory } from 'react-router-dom';
import axios from 'axios';
import * as faceapi from 'face-api.js';
import Webcam from 'react-webcam';
import { Row, Col, Card, Button, Modal, Alert, Badge, Image } from 'react-bootstrap';
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import CsLineIcons from 'cs-line-icons/CsLineIcons';

const customStyles = `
  .kiosk-wrapper {
    min-height: calc(100vh - 120px);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
    background-color: transparent;
  }

  .kiosk-card {
    background: #ffffff;
    border-radius: 2rem !important;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15) !important;
    border: 1px solid rgba(255,255,255,0.6) !important;
    overflow: hidden;
    width: 100%;
    max-width: 850px;
    margin: 0 auto;
    position: relative;
    transition: all 0.4s ease;
  }

  .kiosk-header-banner {
    background: linear-gradient(135deg, #23b3f4 0%, #0d6efd 100%);
    padding: 3rem 2rem;
    position: relative;
    overflow: hidden;
    text-align: center;
    color: white;
  }

  .kiosk-header-banner::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 70%);
    animation: rotateSlow 20s linear infinite;
  }

  @keyframes rotateSlow {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .company-logo-wrapper {
    width: 120px;
    height: 120px;
    border-radius: 50%;
    background: white;
    padding: 8px;
    margin: 0 auto 1.5rem auto;
    box-shadow: 0 10px 25px rgba(0,0,0,0.2);
    position: relative;
    z-index: 2;
  }

  .company-logo {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 50%;
  }

  .kiosk-action-area {
    padding: 4rem 2rem;
    text-align: center;
    background: #f8fafc;
  }

  .scan-btn-container {
    position: relative;
    display: inline-block;
  }

  .scan-btn {
    background: #23b3f4 !important;
    border: none !important;
    border-radius: 50px !important;
    padding: 1rem 3rem !important;
    font-size: 1.25rem !important;
    font-weight: 700 !important;
    box-shadow: 0 10px 30px rgba(35, 179, 244, 0.4) !important;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
    color: white !important;
    display: flex;
    align-items: center;
    gap: 1rem;
    position: relative;
    z-index: 2;
  }

  .scan-btn:hover:not(:disabled) {
    transform: translateY(-5px) scale(1.02);
    box-shadow: 0 15px 35px rgba(35, 179, 244, 0.5) !important;
    background: #1ca3e2 !important;
  }

  .scan-btn:disabled {
    background: #cbd5e1 !important;
    box-shadow: none !important;
    cursor: not-allowed;
    transform: none;
  }

  .pulse-ring {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 100%;
    height: 100%;
    border-radius: 50px;
    border: 2px solid #23b3f4;
    animation: pulseAnim 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    z-index: 1;
    pointer-events: none;
  }

  @keyframes pulseAnim {
    0% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
    100% { transform: translate(-50%, -50%) scale(1.4); opacity: 0; }
  }

  .staff-match-card {
    background: white;
    border-radius: 1.5rem;
    padding: 2.5rem 2rem;
    box-shadow: 0 10px 40px rgba(0,0,0,0.06);
    border: 1px solid rgba(0,0,0,0.04);
    animation: slideUpFade 0.5s ease;
    max-width: 600px;
    margin: 0 auto;
  }

  @keyframes slideUpFade {
    0% { transform: translateY(30px); opacity: 0; }
    100% { transform: translateY(0); opacity: 1; }
  }

  .match-avatar-placeholder {
    width: 90px;
    height: 90px;
    border-radius: 50%;
    background: rgba(16, 185, 129, 0.1);
    color: #10b981;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 1.5rem;
  }

  .action-btn {
    border-radius: 50px !important;
    padding: 0.8rem 2.5rem !important;
    font-weight: 700 !important;
    font-size: 1.1rem !important;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    transition: all 0.3s ease !important;
    width: 100%;
    max-width: 250px;
    margin: 0 auto;
  }

  .btn-check-in {
    background: #10b981 !important;
    border: none !important;
    box-shadow: 0 8px 25px rgba(16, 185, 129, 0.3) !important;
  }
  
  .btn-check-in:hover {
    background: #059669 !important;
    transform: translateY(-2px);
    box-shadow: 0 12px 30px rgba(16, 185, 129, 0.4) !important;
  }

  .btn-check-out {
    background: #f43f5e !important;
    border: none !important;
    box-shadow: 0 8px 25px rgba(244, 63, 94, 0.3) !important;
  }

  .btn-check-out:hover {
    background: #e11d48 !important;
    transform: translateY(-2px);
    box-shadow: 0 12px 30px rgba(244, 63, 94, 0.4) !important;
  }

  /* Scanner Modal Customization */
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
`;

export default function Dashboard() {
  const history = useHistory();
  const webcamRef = useRef(null);

  const title = 'Attendance Dashboard';
  const description = 'Manage staff attendance with facial recognition';
  const breadcrumbs = [
    { to: '', text: 'Home' },
    { to: 'attendance-dashboard', text: 'Attendance Dashboard' },
  ];

  const [userData, setUserData] = useState('');
  const [staffList, setStaffList] = useState([]);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [detectedStaff, setDetectedStaff] = useState(null);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const getTodayDate = () => {
    const today = new Date();
    const options = {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    };
    const [day, month, year] = today.toLocaleDateString('en-IN', options).split('/');
    return `${year}-${month}-${day}`;
  };

  const getCurrentTime = () => {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Load user data
  const fetchUserData = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API}/kiosk/me`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      if (response.data) setUserData(response.data);
      else history.push('/login');
    } catch (err) {
      console.log('Error fetching kiosk user data:', err);
    }
  };

  // Load face-api models
  const loadModels = async () => {
    try {
      await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
      await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
      await faceapi.nets.faceRecognitionNet.loadFromUri('/models');
      setModelsLoaded(true);
    } catch (err) {
      console.error('Error loading models:', err);
      setError('Failed to load face detection models');
    }
  };

  // Fetch all staff face encodings
  const fetchStaffEncodings = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API}/staff/face-data`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setStaffList(res.data.data);
    } catch (err) {
      console.error('Error fetching staff face data:', err);
      setError('Failed to load staff data');
    }
  };

  useEffect(() => {
    fetchUserData();
    loadModels();
    fetchStaffEncodings();
  }, []);

  const handleFaceDetection = async () => {
    try {
      setDetecting(true);
      setError('');
      const screenshot = webcamRef.current.getScreenshot();
      const image = await faceapi.fetchImage(screenshot);

      const detection = await faceapi.detectSingleFace(image, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceDescriptor();

      if (!detection) {
        setError('No face detected. Please try again.');
        return;
      }

      const queryDescriptor = detection.descriptor;

      const labeledDescriptors = staffList.map((staff) => {
        const floatDesc = new Float32Array(staff.face_encoding);
        return new faceapi.LabeledFaceDescriptors(`${staff._id}|${staff.f_name} ${staff.l_name}`, [floatDesc]);
      });

      const faceMatcher = new faceapi.FaceMatcher(labeledDescriptors, 0.5);
      const match = faceMatcher.findBestMatch(queryDescriptor);

      if (match.label === 'unknown') {
        setDetectedStaff(null);
        setError('No matching staff found. Please try again.');
      } else {
        const [id] = match.label.split('|');
        const matchedStaff = staffList.find((s) => s._id === id);
        setDetectedStaff(matchedStaff);
        setError('');
      }
      setShowCameraModal(false);
    } catch (err) {
      console.error(err);
      setError('Face detection failed. Please try again.');
    } finally {
      setDetecting(false);
    }
  };

  const isCheckedInToday = (staff) => {
    return !!staff?.todayAttendance?.in_time && !staff?.todayAttendance?.out_time;
  };

  const handleCheckIn = async (staffId) => {
    try {
      await axios.post(
        `${process.env.REACT_APP_API}/attendance/check-in`,
        {
          staff_id: staffId,
          date: getTodayDate(),
          in_time: getCurrentTime(),
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }
      );
      setSuccessMsg(`✅ Check-in successful at ${getCurrentTime()}`);
      setError('');
      await fetchStaffEncodings();
      setDetectedStaff(null);
    } catch (err) {
      console.error('Check-in failed:', err);
      setError('Check-in failed. Please try again.');
    }
  };

  const handleCheckOut = async (staffId) => {
    try {
      await axios.post(
        `${process.env.REACT_APP_API}/attendance/check-out`,
        {
          staff_id: staffId,
          date: getTodayDate(),
          out_time: getCurrentTime(),
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }
      );
      setSuccessMsg(`✅ Check-out successful at ${getCurrentTime()}`);
      setError('');
      await fetchStaffEncodings();
      setDetectedStaff(null);
    } catch (err) {
      console.error('Check-out failed:', err);
      setError('Check-out failed. Please try again.');
    }
  };

  return (
    <>
      <HtmlHead title={title} description={description} />

      <style>{customStyles}</style>
      <div className="kiosk-wrapper">
        <Card className="kiosk-card">
          
          <div className="kiosk-header-banner">
            <div className="company-logo-wrapper">
              <Image
                src={userData.logo ? `${process.env.REACT_APP_UPLOAD_DIR}${userData.logo}` : '/images/logo.png'}
                className="company-logo"
              />
            </div>
            <h1 className="fw-bolder mb-1 position-relative z-index-2">{userData.name || 'Company Name'}</h1>
            <p className="text-white-50 fw-bold mb-0 position-relative z-index-2 letter-spacing-1">ATTENDANCE TERMINAL</p>
          </div>

          <div className="kiosk-action-area">
            {successMsg && (
            <Alert variant="success" className="mb-4 text-center rounded-3 fw-bold border-0" style={{ maxWidth: '600px', margin: '0 auto', background: '#f0fdf4', color: '#15803d' }} onClose={() => setSuccessMsg('')} dismissible>
              {successMsg}
            </Alert>
          )}

          {error && (
              <Alert variant="danger" className="mb-4 text-center rounded-3 fw-bold border-0" style={{ maxWidth: '600px', margin: '0 auto', background: '#fff1f2', color: '#e11d48' }}>
                <CsLineIcons icon="error-hexagon" className="me-2" />
                {error}
              </Alert>
            )}

            {!detectedStaff ? (
              <div className="py-3">
                <div className="mb-5 text-muted">
                  <CsLineIcons icon="scan" size={54} className="text-primary opacity-50 mb-4" />
                  <h4 className="fw-bold text-dark mb-2">Facial Recognition System</h4>
                  <p className="mb-0 mx-auto" style={{ maxWidth: '350px' }}>Please align your face in front of the camera to automatically identify and clock in.</p>
                </div>

                <div className="scan-btn-container">
                  {!modelsLoaded && <div className="pulse-ring" />}
                  <Button 
                    className="scan-btn" 
                    onClick={() => setShowCameraModal(true)} 
                    disabled={!modelsLoaded}
                  >
                    <CsLineIcons icon="camera" size={24} />
                    <span>{modelsLoaded ? 'Initialize Scanner' : 'Loading AI Models...'}</span>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="staff-match-card">
                <div className="match-avatar-placeholder">
                  {detectedStaff.photo ? (
                    <img
                      src={`${process.env.REACT_APP_UPLOAD_DIR}${detectedStaff.photo}`}
                      alt={detectedStaff.f_name}
                      style={{ width: '90px', height: '90px', borderRadius: '50%', objectFit: 'cover' }}
                    />
                  ) : (
                    <CsLineIcons icon="user" size={42} />
                  )}
                </div>
                <h3 className="fw-bolder text-dark mb-1">{detectedStaff.f_name} {detectedStaff.l_name}</h3>
                <p className="text-muted fw-bold mb-4">ID: {detectedStaff.staff_id}</p>
                
                <div className="d-flex justify-content-center mb-5">
                  <Badge 
                    bg={isCheckedInToday(detectedStaff) ? 'warning' : 'light'} 
                    className={isCheckedInToday(detectedStaff) ? 'text-dark px-4 py-2 rounded-pill shadow-sm' : 'text-muted px-4 py-2 rounded-pill border'}
                    style={{ fontSize: '0.9rem' }}
                  >
                    <CsLineIcons icon={isCheckedInToday(detectedStaff) ? 'clock' : 'close'} size={14} className="me-2" />
                    {isCheckedInToday(detectedStaff) ? 'Currently Checked In' : 'Not Checked In Today'}
                  </Badge>
                </div>

                <div className="d-flex justify-content-center gap-3 flex-wrap">
                  {isCheckedInToday(detectedStaff) ? (
                    <Button className="action-btn btn-check-out" onClick={() => handleCheckOut(detectedStaff._id)}>
                      <CsLineIcons icon="log-out" size={20} />
                      Confirm Check-Out
                    </Button>
                  ) : (
                    <Button className="action-btn btn-check-in" onClick={() => handleCheckIn(detectedStaff._id)}>
                      <CsLineIcons icon="log-in" size={20} />
                      Confirm Check-In
                    </Button>
                  )}
                  <Button 
                    variant="light" 
                    className="action-btn border text-muted" 
                    onClick={() => setDetectedStaff(null)}
                    style={{ maxWidth: '180px', boxShadow: 'none' }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
          
          <div className="bg-light p-3 text-center border-top">
            <small className="text-muted fw-bold" style={{ fontSize: '0.75rem', letterSpacing: '0.05em' }}>
              <CsLineIcons icon="shield" size={14} className="me-1 text-primary" /> 
              SECURE AI VERIFICATION
            </small>
          </div>
        </Card>
      </div>

      {/* Camera Modal */}
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
          <div className="webcam-container" style={{ width: '100%', maxWidth: '640px' }}>
            <Webcam
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              videoConstraints={{ facingMode: 'user' }}
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
                <div className="scanner-line" />
                <div className="camera-status-text">
                  {detecting ? 'ANALYZING BIOMETRICS...' : 'POSITION FACE IN FRAME'}
                </div>
              </>
            )}
          </div>

          <Button 
            variant={detecting ? "secondary" : "primary"} 
            size="lg" 
            className="mt-5 rounded-pill fw-bold px-5 py-3 shadow" 
            disabled={detecting} 
            onClick={handleFaceDetection}
            style={{ minWidth: '250px' }}
          >
            {detecting ? (
              <>
                <span className="spinner-border spinner-border-sm me-3" />
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
    </>
  );
}
