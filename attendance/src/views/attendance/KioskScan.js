import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Spinner, Button, Alert, Card, Modal } from 'react-bootstrap';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import Webcam from 'react-webcam';
import * as faceapi from 'face-api.js';
import HtmlHead from 'components/html-head/HtmlHead';

const parseTimeToMinutes = (timeStr) => {
  if (!timeStr) return 0;
  const [time, period] = timeStr.split(' ');
  if (!time || !period) return 0;
  let [hours, minutes] = time.split(':').map(Number);
  if (period === 'PM' && hours !== 12) hours += 12;
  else if (period === 'AM' && hours === 12) hours = 0;
  return hours * 60 + minutes;
};

const getLateMinutes = (currentTimeStr, orgRules) => {
  if (!orgRules) return 0;
  const shiftStartStr = orgRules.shift_start_time || '09:00 AM';
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
  const shiftEndStr = orgRules.shift_end_time || '06:00 PM';
  const shiftEndMins = parseTimeToMinutes(shiftEndStr);
  const currentMins = parseTimeToMinutes(currentTimeStr);
  const diff = currentMins - shiftEndMins;
  return diff > 0 ? diff : 0;
};

const calculateCompletedAndOvertime = (todayAtt, orgRules, currentTime) => {
  if (!todayAtt) return { completedMins: 0, overtimeMins: 0, totalHoursStr: '0h' };

  const startMins = parseTimeToMinutes(orgRules?.shift_start_time || '09:00 AM');
  const endMins = parseTimeToMinutes(orgRules?.shift_end_time || '06:00 PM');
  const standardMins = endMins - startMins;

  let completedMins = 0;
  const sessions = todayAtt.sessions || [];

  if (sessions.length > 0) {
    sessions.forEach((s) => {
      if (s.in_time && s.out_time) {
        completedMins += parseTimeToMinutes(s.out_time) - parseTimeToMinutes(s.in_time);
      } else if (s.in_time && !s.out_time) {
        completedMins += parseTimeToMinutes(currentTime) - parseTimeToMinutes(s.in_time);
      }
    });
  } else if (todayAtt.in_time) {
    const outVal = todayAtt.out_time || currentTime;
    completedMins = parseTimeToMinutes(outVal) - parseTimeToMinutes(todayAtt.in_time);
  }

  const overtimeMins = completedMins > standardMins ? completedMins - standardMins : 0;
  const hours = Math.floor(completedMins / 60);
  const mins = completedMins % 60;
  const totalHoursStr = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

  return { completedMins, overtimeMins, totalHoursStr };
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

  // Scan & Detection States
  const [error, setError] = useState('');
  const [cooldownActive, setCooldownActive] = useState(false);
  const [detectedList, setDetectedList] = useState([]);
  const [showMatchModal, setShowMatchModal] = useState(false);

  const webcamRef = useRef(null);
  const canvasRef = useRef(null);

  const getCurrentTime = () => {
    const now = new Date();
    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
  };

  const getTodayDate = () => {
    const options = { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' };
    return new Intl.DateTimeFormat('en-CA', options).format(new Date());
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

  const triggerCooldown = (durationMs) => {
    setCooldownActive(true);
    setTimeout(() => {
      setCooldownActive(false);
      setError('');
    }, durationMs);
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
      console.error('Error fetching face encodings:', err);
    }
  };

  // --- Core API Submit ---
  const submitScan = async (idToScan) => {
    setLoading(true);
    setMessage(null);

    try {
      const res = await axios.post(`${process.env.REACT_APP_API}/attendance/kiosk-scan`, {
        company_id,
        scanned_id: idToScan,
        date: getTodayDate(),
        time: getCurrentTime(),
      });

      if (res.data && res.data.success) {
        setMessage({ type: 'success', text: res.data.message || 'Scan successful!' });
        fetchFaces(); // Refresh face scan records immediately!
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
        console.error('Error loading face-api models:', err);
      }
    };

    if (!modelsLoaded) loadModels();
    if (!faceDataLoaded) fetchFaces();
  }, [company_id, modelsLoaded, faceDataLoaded]);

  // --- Bounding Boxes & Multi-Face Continuous Detection Loop ---
  useEffect(() => {
    let active = true;
    let timeoutId = null;

    const detectAllFacesLoop = async () => {
      if (!active) return;

      const webcam = webcamRef.current;
      const canvas = canvasRef.current;

      if (modelsLoaded && faceDataLoaded && webcam && canvas && !loading && !cooldownActive && !showMatchModal) {
        try {
          const screenshot = webcam.getScreenshot();
          if (screenshot && active) {
            const image = await faceapi.fetchImage(screenshot);
            const detections = await faceapi
              .detectAllFaces(image, new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.35 }))
              .withFaceLandmarks()
              .withFaceDescriptors();

            const { video } = webcam;
            if (video && canvas && active) {
              const displaySize = { width: video.clientWidth, height: video.clientHeight };
              faceapi.matchDimensions(canvas, displaySize);
              const resizedDetections = faceapi.resizeResults(detections, displaySize);

              const ctx = canvas.getContext('2d');
              ctx.clearRect(0, 0, displaySize.width, displaySize.height);

              const labeledDescriptors = staffList
                .filter((staff) => staff.face_encoding)
                .map((staff) => {
                  const floatDesc = new Float32Array(Object.values(staff.face_encoding));
                  return new faceapi.LabeledFaceDescriptors(staff.staff_id, [floatDesc]);
                });

              const currentMatchedStaff = [];
              const now = Date.now();

              if (labeledDescriptors.length > 0) {
                const faceMatcher = new faceapi.FaceMatcher(labeledDescriptors, 0.55);

                resizedDetections.forEach((det) => {
                  const { x, y, width, height } = det.detection.box;
                  const match = faceMatcher.findBestMatch(det.descriptor);
                  const isMatched = match.label !== 'unknown';

                  let labelText = 'Unknown Face';
                  if (isMatched) {
                    const staff = staffList.find((s) => s.staff_id === match.label);
                    if (staff) {
                      labelText = `${staff.f_name} ${staff.l_name}`;
                      currentMatchedStaff.push(staff);
                    }
                  }

                  // Draw bounding box
                  ctx.lineWidth = 3;
                  ctx.strokeStyle = isMatched ? '#10b981' : '#ef4444';
                  ctx.strokeRect(x, y, width, height);

                  // Draw tag background
                  ctx.fillStyle = isMatched ? 'rgba(16, 185, 129, 0.85)' : 'rgba(239, 68, 68, 0.85)';
                  ctx.font = 'bold 12px Inter, sans-serif';
                  const textWidth = ctx.measureText(labelText).width;
                  ctx.fillRect(x, y - 25, textWidth + 16, 20);

                  // Draw label text
                  ctx.fillStyle = '#ffffff';
                  ctx.fillText(labelText, x + 8, y - 11);
                });
              }

              // Update detectedList with 3s persistence so they don't flicker off the list
              setDetectedList((prevList) => {
                const updatedList = [...prevList];

                currentMatchedStaff.forEach((staff) => {
                  const existingIdx = updatedList.findIndex((item) => item.staff_id === staff.staff_id);
                  if (existingIdx !== -1) {
                    updatedList[existingIdx] = { ...staff, lastSeen: now, alreadyConfirmed: updatedList[existingIdx].alreadyConfirmed };
                  } else {
                    updatedList.push({ ...staff, lastSeen: now, alreadyConfirmed: false });
                  }
                });

                return updatedList.filter((item) => now - item.lastSeen < 3000 || item.alreadyConfirmed);
              });
            }
          }
        } catch (err) {
          console.error('Error in continuous multi-face detection loop:', err);
        }
      }

      if (active) {
        timeoutId = setTimeout(detectAllFacesLoop, 400);
      }
    };

    if (modelsLoaded && faceDataLoaded) {
      detectAllFacesLoop();
    }

    return () => {
      active = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [modelsLoaded, faceDataLoaded, staffList, loading, cooldownActive]);

  // --- Auto-trigger Confirm Modal when face is detected ---
  useEffect(() => {
    if (detectedList.length > 0 && !showMatchModal && !cooldownActive) {
      setShowMatchModal(true);
    }
  }, [detectedList, showMatchModal, cooldownActive]);

  const handleCloseModal = () => {
    setShowMatchModal(false);
    setDetectedList([]);
    triggerCooldown(4000); // 4 seconds cooldown
  };

  const handleConfirm = async (staff) => {
    // 1. Mark as confirmed locally so the UI updates instantly
    setDetectedList((prev) =>
      prev.map((item) => {
        if (item.staff_id === staff.staff_id) {
          return { ...item, alreadyConfirmed: true };
        }
        return item;
      })
    );

    // 2. Submit attendance scan
    await submitScan(staff.staff_id);

    // 3. Remove them from the list after 2 seconds. If it was the last one, close the modal.
    setTimeout(() => {
      setDetectedList((prev) => {
        const remaining = prev.filter((item) => item.staff_id !== staff.staff_id);
        if (remaining.length === 0) {
          setShowMatchModal(false);
          triggerCooldown(4000);
        }
        return remaining;
      });
    }, 2000);
  };

  const title = 'Attendance Terminal';
  const description = 'Face recognition attendance terminal - position yourself before the camera to scan.';

  return (
    <>
      <HtmlHead title={title} description={description} />

      <div
        style={{
          minHeight: '100vh',
          background: 'radial-gradient(circle at 50% 50%, #f8fafc 0%, #e2e8f0 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
        }}
      >
        <Card className="shadow-lg border-0 kiosk-card">
          <Card.Body className="kiosk-card-body text-center d-flex flex-column align-items-center">
            {/* Company Logo / Branding at top center */}
            <div className="d-flex justify-content-center mb-4 w-100">
              {companyInfo?.logo ? (
                <img
                  src={process.env.REACT_APP_UPLOAD_DIR + companyInfo.logo}
                  alt={companyInfo?.name || 'Company Logo'}
                  style={{ maxHeight: '55px', objectFit: 'contain' }}
                />
              ) : (
                <div className="kiosk-brand-logo">
                  THE <span>BOX</span>
                </div>
              )}
            </div>

            <div className="login-login-form-header mb-4 text-center">
              <span
                className="badge bg-soft-primary text-primary px-3 py-2 rounded-pill fw-bold text-uppercase mb-2 animate__animated animate__fadeIn"
                style={{ letterSpacing: '0.05em', fontSize: '0.75rem' }}
              >
                Attendance Terminal
              </span>
              <h2 className="login-login-form-title mt-1">Scan to Check-In/Out</h2>
              <p className="login-login-form-subtitle mt-1 px-3">Position yourself in front of the camera to verify your face</p>
            </div>

            {error && (
              <Alert
                variant="danger"
                className="w-100 mb-3 text-center rounded-3 fw-bold border-0 small"
                style={{ maxWidth: '440px', background: '#fff1f2', color: '#e11d48' }}
              >
                <CsLineIcons icon="error-hexagon" className="me-2" size="14" />
                {error}
              </Alert>
            )}

            <div className="d-flex flex-column align-items-center justify-content-center my-3 w-100">
              {!modelsLoaded || !faceDataLoaded ? (
                <div className="d-flex flex-column align-items-center justify-content-center py-4">
                  <Spinner animation="border" variant="primary" className="mb-3" />
                  <span className="text-muted fw-semibold">{!modelsLoaded ? 'Loading AI models...' : 'Fetching staff face data...'}</span>
                </div>
              ) : (
                <div
                  className="webcam-container position-relative overflow-hidden rounded-3 shadow"
                  style={{ width: '100%', maxWidth: '440px', border: '3px solid #e2e8f0', background: '#0f172a' }}
                >
                  {cameraError ? (
                    <div className="text-danger fw-bold py-5 text-center">
                      <CsLineIcons icon="warning-hexagon" size="30" className="mb-2 d-block mx-auto" />
                      Camera access denied or not available.
                    </div>
                  ) : (
                    <>
                      <Webcam
                        ref={webcamRef}
                        audio={false}
                        screenshotFormat="image/jpeg"
                        videoConstraints={{ facingMode: 'user' }}
                        onUserMediaError={() => setCameraError(true)}
                        style={{
                          width: '100%',
                          height: 'auto',
                          objectFit: 'cover',
                          aspectRatio: '4/3',
                          display: 'block',
                        }}
                      />
                      <canvas
                        ref={canvasRef}
                        className="position-absolute"
                        style={{
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          zIndex: 5,
                          pointerEvents: 'none',
                        }}
                      />
                      <div className="scanner-overlay" />
                      <div
                        className="camera-status-text position-absolute w-100 text-center fw-bold"
                        style={{ bottom: '15px', color: '#fff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', zIndex: 10 }}
                      >
                        {cooldownActive ? 'SCAN COMPLETED. PLEASE WAIT...' : 'STAND IN FRONT OF CAMERA'}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* STATUS MESSAGE AREA */}
            <div style={{ minHeight: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '10px' }} className="w-100">
              {loading ? (
                <div className="d-flex align-items-center text-primary">
                  <Spinner animation="border" size="sm" className="me-2" />
                  <span className="fw-semibold">Processing attendance...</span>
                </div>
              ) : message ? (
                <div
                  className={`p-2.5 rounded-3 fw-bold w-100 text-center ${
                    message.type === 'success' ? 'bg-soft-success text-success' : 'bg-soft-danger text-danger'
                  }`}
                  style={{ maxWidth: '440px' }}
                >
                  {message.type === 'success' ? (
                    <CsLineIcons icon="check-circle" size="18" className="me-2" />
                  ) : (
                    <CsLineIcons icon="close-circle" size="18" className="me-2" />
                  )}
                  {message.text}
                </div>
              ) : null}
            </div>

            {/* Match Confirmation Modal */}
            <Modal show={showMatchModal} onHide={handleCloseModal} centered backdrop="static">
              <Modal.Header closeButton>
                <Modal.Title className="fw-bold">Confirm Attendance</Modal.Title>
              </Modal.Header>
              <Modal.Body className="p-4">
                <div className="detected-staff-list w-100 text-start">
                  {detectedList.map((staff) => {
                    const { todayAttendance: todayAtt, alreadyConfirmed } = staff;
                    let isCheckOut = false;
                    if (todayAtt) {
                      const sessions = todayAtt.sessions || [];
                      if (sessions.length > 0) {
                        isCheckOut = sessions[sessions.length - 1].out_time === null;
                      } else if (todayAtt.in_time && !todayAtt.out_time) {
                        isCheckOut = true;
                      }
                    }
                    const actionLabel = isCheckOut ? 'Check-Out' : 'Check-In';

                    const currentTime = getCurrentTime();
                    const orgRules = companyConfig?.org_rules;

                    let statusBadge = null;
                    if (isCheckOut) {
                      const { overtimeMins } = calculateCompletedAndOvertime(todayAtt, orgRules, currentTime);
                      if (overtimeMins > 0) {
                        const otHours = Math.floor(overtimeMins / 60);
                        const otMins = overtimeMins % 60;
                        const otStr = otHours > 0 ? `${otHours}h ${otMins}m` : `${otMins}m`;
                        statusBadge = (
                          <span
                            className="badge bg-soft-purple text-purple fw-bold px-2 py-1 rounded-pill"
                            style={{ background: 'rgba(124, 58, 237, 0.1)', color: '#7c3aed', border: '1px solid rgba(124, 58, 237, 0.2)' }}
                          >
                            ⚡ Overtime: {otStr}
                          </span>
                        );
                      } else {
                        statusBadge = (
                          <span
                            className="badge bg-soft-primary text-primary fw-bold px-2 py-1 rounded-pill"
                            style={{ background: 'rgba(35, 179, 244, 0.1)', color: '#23b3f4', border: '1px solid rgba(35, 179, 244, 0.2)' }}
                          >
                            Shift active
                          </span>
                        );
                      }
                    } else {
                      const lateMins = getLateMinutes(currentTime, orgRules);
                      if (lateMins > 0) {
                        statusBadge = (
                          <span
                            className="badge bg-soft-danger text-danger fw-bold px-2 py-1 rounded-pill"
                            style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#dc2626', border: '1px solid rgba(239, 68, 68, 0.2)' }}
                          >
                            🔴 Late: {lateMins}m
                          </span>
                        );
                      } else {
                        statusBadge = (
                          <span
                            className="badge bg-soft-success text-success fw-bold px-2 py-1 rounded-pill"
                            style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.2)' }}
                          >
                            On Time
                          </span>
                        );
                      }
                    }

                    return (
                      <Card
                        key={staff.staff_id}
                        className="mb-3 shadow-sm border-0"
                        style={{
                          background: '#f8fafc',
                          borderLeft: alreadyConfirmed ? '4px solid #10b981' : isCheckOut ? '4px solid #eab308' : '4px solid #3b82f6',
                        }}
                      >
                        <Card.Body className="p-3">
                          <div className="d-flex align-items-center justify-content-between">
                            <div className="d-flex align-items-center">
                              {staff.photo ? (
                                <img
                                  src={`${process.env.REACT_APP_UPLOAD_DIR}${staff.photo}`}
                                  alt={staff.f_name}
                                  style={{ width: '45px', height: '45px', borderRadius: '50%', objectFit: 'cover' }}
                                />
                              ) : (
                                <div
                                  style={{ width: '45px', height: '45px', borderRadius: '50%', background: 'rgba(35, 179, 244, 0.1)', color: '#23b3f4' }}
                                  className="d-flex align-items-center justify-content-center"
                                >
                                  <CsLineIcons icon="user" size={20} />
                                </div>
                              )}
                              <div className="ms-3 text-start">
                                <div className="fw-bolder text-dark" style={{ fontSize: '0.95rem' }}>
                                  {staff.f_name} {staff.l_name}
                                </div>
                                <div className="text-muted" style={{ fontSize: '0.78rem' }}>
                                  ID: {staff.staff_id}
                                </div>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant={alreadyConfirmed ? 'success' : isCheckOut ? 'warning' : 'primary'}
                              className="rounded-pill px-4 fw-bold shadow-sm animate__animated animate__fadeIn"
                              disabled={alreadyConfirmed || loading}
                              onClick={() => handleConfirm(staff)}
                              style={{ minWidth: '100px' }}
                            >
                              {alreadyConfirmed ? (
                                <>
                                  <CsLineIcons icon="check" size="14" className="me-1" />
                                  Done
                                </>
                              ) : (
                                actionLabel
                              )}
                            </Button>
                          </div>

                          <div className="p-2 bg-white border rounded-3 d-flex align-items-center justify-content-between mt-3" style={{ fontSize: '0.8rem' }}>
                            <span className="fw-semibold text-muted d-flex align-items-center">
                              <CsLineIcons icon="clock" size="14" className="me-1" />
                              Time: {currentTime}
                            </span>
                            <div className="d-flex gap-1.5 align-items-center">
                              <span
                                className={`badge ${
                                  alreadyConfirmed
                                    ? 'bg-soft-success text-success'
                                    : isCheckOut
                                    ? 'bg-soft-warning text-warning'
                                    : 'bg-soft-primary text-primary'
                                }`}
                                style={{ textTransform: 'uppercase', fontWeight: 'bold' }}
                              >
                                {alreadyConfirmed ? 'Confirmed ✓' : actionLabel}
                              </span>
                              {statusBadge}
                            </div>
                          </div>
                        </Card.Body>
                      </Card>
                    );
                  })}
                </div>
              </Modal.Body>
            </Modal>

            <div className="w-100 border-top mt-4 pt-3 text-center" style={{ borderColor: 'rgba(226, 232, 240, 0.6)' }}>
              <span className="text-muted" style={{ fontSize: '0.72rem', letterSpacing: '0.05em', textTransform: 'uppercase', opacity: 0.7 }}>
                Powered by <strong style={{ color: '#0f172a' }}>TheBoxSync</strong>
              </span>
            </div>
          </Card.Body>
        </Card>
      </div>

      <style>{`
        .kiosk-card {
          width: 100%;
          max-width: 500px;
          border-radius: 2.25rem;
          background: #ffffff;
          box-shadow: 0 20px 40px -15px rgba(15, 23, 42, 0.08) !important;
          border: 1px solid rgba(226, 232, 240, 0.8) !important;
          transition: all 0.3s ease;
        }

        .kiosk-card-body {
          padding: 3rem 2.5rem !important;
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

        .login-login-form-title {
          font-size: 2rem;
          font-weight: 850;
          color: #0f172a;
          line-height: 1.25;
          letter-spacing: -0.02em;
        }

        .login-login-form-subtitle {
          font-size: 0.9rem;
          color: #64748b;
          line-height: 1.5;
          font-weight: 500;
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
          background: linear-gradient(to bottom, rgba(35,179,244,0.15) 0%, rgba(35,179,244,0) 10%, rgba(35,179,244,0) 90%, rgba(35,179,244,0.15) 100%);
          pointer-events: none;
          z-index: 10;
        }

        .camera-status-text {
          position: absolute;
          bottom: 1rem;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(0,0,0,0.65);
          backdrop-filter: blur(5px);
          color: white;
          padding: 0.4rem 1.25rem;
          border-radius: 50px;
          font-weight: 600;
          font-size: 0.8rem;
          letter-spacing: 0.05em;
          z-index: 12;
          white-space: nowrap;
        }
        
        .bg-soft-success {
          background-color: rgba(16, 185, 129, 0.1) !important;
          color: #10b981 !important;
        }
        .bg-soft-danger {
          background-color: rgba(239, 68, 68, 0.1) !important;
          color: #ef4444 !important;
        }
        .bg-soft-warning {
          background-color: rgba(234, 179, 8, 0.1) !important;
          color: #eab308 !important;
        }
        .bg-soft-primary {
          background-color: rgba(35, 179, 244, 0.1) !important;
          color: #23b3f4 !important;
        }
        .bg-soft-purple {
          background-color: rgba(124, 58, 237, 0.1) !important;
          color: #7c3aed !important;
        }
      `}</style>
    </>
  );
};

export default KioskScan;
