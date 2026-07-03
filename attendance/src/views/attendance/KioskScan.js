import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  const [recentMatchedList, setRecentMatchedList] = useState([]);

  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const recentScansRef = useRef({});

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

  const fetchFaces = useCallback(async () => {
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
  }, [company_id]);

  // --- Core API Submit ---
  const submitScan = useCallback(async (staff) => {
    setLoading(true);
    setError('');
    setMessage(null);

    try {
      const currentTime = getCurrentTime();
      const res = await axios.post(`${process.env.REACT_APP_API}/attendance/kiosk-scan`, {
        company_id,
        scanned_id: staff.staff_id,
        date: getTodayDate(),
        time: currentTime,
      });

      if (res.data && res.data.success) {
        const todayAtt = staff.todayAttendance;
        let isCheckOut = false;
        if (todayAtt) {
          const sessions = todayAtt.sessions || [];
          if (sessions.length > 0) {
            isCheckOut = sessions[sessions.length - 1].out_time === null;
          } else if (todayAtt.in_time && !todayAtt.out_time) {
            isCheckOut = true;
          }
        }
        const actionLabel = isCheckOut ? 'Checked-Out' : 'Checked-In';
        
        const orgRules = companyConfig?.org_rules;
        let statusBadgeText = '';
        let statusBadgeType = 'success';
        
        if (isCheckOut) {
          const { overtimeMins } = calculateCompletedAndOvertime(todayAtt, orgRules, currentTime);
          if (overtimeMins > 0) {
            const otHours = Math.floor(overtimeMins / 60);
            const otMins = overtimeMins % 60;
            statusBadgeText = `Overtime: ${otHours > 0 ? `${otHours}h ` : ''}${otMins}m`;
            statusBadgeType = 'warning';
          } else {
            statusBadgeText = 'Working Hours Completed';
            statusBadgeType = 'success';
          }
        } else {
          const lateMins = getLateMinutes(currentTime, orgRules);
          if (lateMins > 0) {
            statusBadgeText = `Late: ${lateMins}m`;
            statusBadgeType = 'danger';
          } else {
            statusBadgeText = 'On Time';
            statusBadgeType = 'success';
          }
        }

        const newMatch = {
          ...staff,
          action: actionLabel,
          time: currentTime,
          statusBadgeText,
          statusBadgeType,
          id: Date.now(),
        };

        // Add to recentMatchedList and keep top 3
        setRecentMatchedList((prev) => [
          newMatch,
          ...prev.filter((item) => item.staff_id !== staff.staff_id)
        ].slice(0, 3));

        // Auto-remove after 7 seconds
        setTimeout(() => {
          setRecentMatchedList((prev) => prev.filter((item) => item.id !== newMatch.id));
        }, 7000);

        setMessage({ type: 'success', text: `${staff.f_name}: ${res.data.message || `${actionLabel} successful!`}` });
        fetchFaces(); // Refresh face scan records immediately!
      } else {
        setMessage({ type: 'error', text: `${staff.f_name}: ${res.data.message || 'Scan failed.'}` });
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Error processing scan.';
      setError(errMsg);
      setMessage({ type: 'error', text: errMsg });
    } finally {
      setLoading(false);
      // Clear status message after 3 seconds
      setTimeout(() => {
        setMessage(null);
      }, 3000);
    }
  }, [company_id, companyConfig, fetchFaces]);

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

      if (modelsLoaded && faceDataLoaded && webcam && canvas) {
        try {
          const screenshot = webcam.getScreenshot();
          if (screenshot && active) {
            const image = await faceapi.fetchImage(screenshot);
            const detections = await faceapi
              .detectAllFaces(image, new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.55 }))
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

              // Check and trigger scans for all matched staff who are not in individual cooldown
              const eligibleStaffList = currentMatchedStaff.filter((staff) => {
                const lastScanTime = recentScansRef.current[staff.staff_id] || 0;
                return (now - lastScanTime) > 8000; // 8 seconds per-staff cooldown
              });

              eligibleStaffList.forEach((staff) => {
                recentScansRef.current[staff.staff_id] = now; // Mark scanned immediately!
                submitScan(staff);
              });
            }
          }
        } catch (err) {
          console.error('Error in continuous multi-face detection loop:', err);
        }
      }

      if (active) {
        timeoutId = setTimeout(detectAllFacesLoop, 150);
      }
    };

    if (modelsLoaded && faceDataLoaded) {
      detectAllFacesLoop();
    }

    return () => {
      active = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [modelsLoaded, faceDataLoaded, staffList, submitScan]);


  const title = 'Attendance Terminal';
  const description = 'Face recognition attendance terminal - position yourself before the camera to scan.';

  return (
    <>
      <HtmlHead title={title} description={description} />

      <div className="kiosk-page-wrapper">
        <Card className="shadow-lg border-0 kiosk-card animate__animated animate__fadeIn">
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
                style={{ maxWidth: '580px', background: '#fff1f2', color: '#e11d48' }}
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
                  style={{ width: '100%', maxWidth: '580px', border: '3px solid #e2e8f0', background: '#0f172a' }}
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
                        STAND IN FRONT OF CAMERA
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
                  style={{ maxWidth: '580px' }}
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

            {/* DIRECT SCAN RESULT DISPLAY */}
            {recentMatchedList.length > 0 && (
              <div className="w-100 mt-2 d-flex flex-column gap-3 animate__animated animate__fadeIn" style={{ maxWidth: '580px' }}>
                {recentMatchedList.map((matchedStaff, index) => {
                  const isPrimary = index === 0;
                  return (
                    <Card
                      key={matchedStaff.id}
                      className="border-0 shadow-sm transition-all"
                      style={{
                        background: isPrimary ? '#f8fafc' : '#ffffff',
                        borderLeft: matchedStaff.action === 'Checked-In' ? '5px solid #3b82f6' : '5px solid #eab308',
                        borderRadius: '16px',
                        opacity: isPrimary ? 1 : 0.85,
                        transform: isPrimary ? 'scale(1)' : 'scale(0.96)',
                        border: isPrimary ? '1px solid rgba(59, 130, 246, 0.15)' : '1px solid rgba(226, 232, 240, 0.6)'
                      }}
                    >
                      <Card.Body className="p-3">
                        <div className="d-flex align-items-center justify-content-between">
                          <div className="d-flex align-items-center">
                            {matchedStaff.photo ? (
                              <img
                                src={`${process.env.REACT_APP_UPLOAD_DIR}${matchedStaff.photo}`}
                                alt={matchedStaff.f_name}
                                style={{ width: isPrimary ? '55px' : '45px', height: isPrimary ? '55px' : '45px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #fff', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                              />
                            ) : (
                              <div
                                style={{ width: isPrimary ? '55px' : '45px', height: isPrimary ? '55px' : '45px', borderRadius: '50%', background: 'rgba(35, 179, 244, 0.1)', color: '#23b3f4', border: '2px solid #fff', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                                className="d-flex align-items-center justify-content-center"
                              >
                                <CsLineIcons icon="user" size={isPrimary ? 24 : 20} />
                              </div>
                            )}
                            <div className="ms-3 text-start">
                              <div className="fw-bold text-dark" style={{ fontSize: isPrimary ? '1.05rem' : '0.95rem', lineHeight: '1.2' }}>
                                {matchedStaff.f_name} {matchedStaff.l_name}
                              </div>
                              <div className="text-muted small">
                                ID: {matchedStaff.staff_id}
                              </div>
                            </div>
                          </div>
                          <div className="text-end">
                            <div className="fw-bold text-primary" style={{ fontSize: isPrimary ? '0.95rem' : '0.85rem' }}>
                              {matchedStaff.time}
                            </div>
                            <div className="text-muted small" style={{ fontSize: '0.72rem' }}>Scan Time</div>
                          </div>
                        </div>

                        <div className="p-2 bg-white border rounded-3 d-flex align-items-center justify-content-between mt-3" style={{ fontSize: '0.85rem' }}>
                          <span className="fw-bold text-muted d-flex align-items-center" style={{ fontSize: '0.78rem' }}>
                            <CsLineIcons icon="clock" size={14} className="me-1" />
                            Status
                          </span>
                          <div className="d-flex gap-2 align-items-center">
                            <span
                              className={`badge ${
                                matchedStaff.action === 'Checked-In'
                                  ? 'bg-soft-primary text-primary'
                                  : 'bg-soft-warning text-warning'
                              }`}
                              style={{ textTransform: 'uppercase', fontWeight: '800', letterSpacing: '0.05em', fontSize: '0.72rem' }}
                            >
                              {matchedStaff.action}
                            </span>
                            {matchedStaff.statusBadgeText && (
                              <span
                                className={`badge bg-soft-${matchedStaff.statusBadgeType} text-${matchedStaff.statusBadgeType} fw-bold px-2 py-1 rounded-pill`}
                                style={{
                                  background: matchedStaff.statusBadgeType === 'danger' ? 'rgba(239, 68, 68, 0.1)' : matchedStaff.statusBadgeType === 'warning' ? 'rgba(124, 58, 237, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                                  color: matchedStaff.statusBadgeType === 'danger' ? '#dc2626' : matchedStaff.statusBadgeType === 'warning' ? '#7c3aed' : '#10b981',
                                  border: `1px solid ${matchedStaff.statusBadgeType === 'danger' ? 'rgba(239, 68, 68, 0.2)' : matchedStaff.statusBadgeType === 'warning' ? 'rgba(124, 58, 237, 0.2)' : 'rgba(16, 185, 129, 0.2)'}`,
                                  fontSize: '0.72rem'
                                }}
                              >
                                {matchedStaff.statusBadgeText}
                              </span>
                            )}
                          </div>
                        </div>
                      </Card.Body>
                    </Card>
                  );
                })}
              </div>
            )}

            <div className="w-100 border-top mt-4 pt-3 text-center" style={{ borderColor: 'rgba(226, 232, 240, 0.6)' }}>
              <span className="text-muted" style={{ fontSize: '0.72rem', letterSpacing: '0.05em', textTransform: 'uppercase', opacity: 0.7 }}>
                Powered by <strong style={{ color: '#0f172a' }}>TheBoxSync</strong>
              </span>
            </div>
          </Card.Body>
        </Card>
      </div>

      <style>{`
        .kiosk-page-wrapper {
          min-height: 100vh;
          background: radial-gradient(circle at 50% 50%, #f8fafc 0%, #e2e8f0 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        .kiosk-card {
          width: 100%;
          max-width: 650px;
          border-radius: 2.25rem;
          background: #ffffff;
          box-shadow: 0 20px 40px -15px rgba(15, 23, 42, 0.08) !important;
          border: 1px solid rgba(226, 232, 240, 0.8) !important;
          transition: all 0.3s ease;
        }

        .kiosk-card-body {
          padding: 2.5rem 2rem !important;
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

        @media (max-width: 576px) {
          .kiosk-page-wrapper {
            padding: 0px !important;
            align-items: flex-start !important;
          }
          .kiosk-card {
            border-radius: 0 !important;
            max-width: 100% !important;
            min-height: 100vh;
            border: none !important;
            box-shadow: none !important;
          }
          .kiosk-card-body {
            padding: 2rem 1rem !important;
          }
          .webcam-container {
            border-radius: 1rem !important;
            box-shadow: 0 0 0 3px rgba(35, 179, 244, 0.15) !important;
          }
          .login-login-form-title {
            font-size: 1.6rem !important;
          }
          .login-login-form-subtitle {
            font-size: 0.8rem !important;
            padding: 0 5px !important;
          }
        }
      `}</style>
    </>
  );
};

export default KioskScan;
