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
  const { company_id, device_mode } = useParams();

  const isCheckInOnly = device_mode === 'in';
  const isCheckOutOnly = device_mode === 'out';
  const badgeText = isCheckInOnly ? 'Check-In Terminal' : isCheckOutOnly ? 'Check-Out Terminal' : 'Attendance Terminal';
  const badgeClass = isCheckInOnly ? 'bg-soft-success text-success' : isCheckOutOnly ? 'bg-soft-warning text-warning' : 'bg-soft-primary text-primary';
  const headerTitle = isCheckInOnly ? 'Scan to Check-In' : isCheckOutOnly ? 'Scan to Check-Out' : 'Scan to Check-In/Out';

  // States
  const [loading, setLoading] = useState(false);
  const [scanningStaff, setScanningStaff] = useState(null);
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
  const matchCountsRef = useRef({});
  const lastSeenRef = useRef({});

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

  const submitScan = useCallback(async (staff) => {
    setScanningStaff(staff);
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
        device_mode,
      });

      if (res.data && res.data.success) {
        const todayAtt = staff.todayAttendance;
        let isCheckOut = false;
        let isAlreadyDone = false;

        if (device_mode === 'in') {
          isCheckOut = false;
          if (todayAtt) {
            const sessions = todayAtt.sessions || [];
            if (sessions.length > 0) {
              isAlreadyDone = sessions[sessions.length - 1].out_time === null;
            } else if (todayAtt.in_time && !todayAtt.out_time) {
              isAlreadyDone = true;
            }
          }
        } else if (device_mode === 'out') {
          isCheckOut = true;
          if (todayAtt) {
            const sessions = todayAtt.sessions || [];
            if (sessions.length > 0) {
              isAlreadyDone = sessions[sessions.length - 1].out_time !== null;
            } else if (todayAtt.in_time && todayAtt.out_time) {
              isAlreadyDone = true;
            }
          } else {
            isAlreadyDone = true;
          }
        } else if (todayAtt) {
          const sessions = todayAtt.sessions || [];
          if (sessions.length > 0) {
            isCheckOut = sessions[sessions.length - 1].out_time === null;
          } else if (todayAtt.in_time && !todayAtt.out_time) {
            isCheckOut = true;
          }
        }
        
        let actionLabel = isCheckOut ? 'Checked-Out' : 'Checked-In';
        if (isAlreadyDone) {
          actionLabel = isCheckOut ? 'Already Checked-Out' : 'Already Checked-In';
        }
        
        const orgRules = companyConfig?.org_rules;
        let statusBadgeText = '';
        let statusBadgeType = 'success';
        
        if (isCheckOut) {
          const { completedMins, overtimeMins } = calculateCompletedAndOvertime(todayAtt, orgRules, currentTime);
          const startMins = parseTimeToMinutes(orgRules?.shift_start_time || '09:00 AM');
          const endMins = parseTimeToMinutes(orgRules?.shift_end_time || '06:00 PM');
          const standardMins = endMins - startMins;

          if (overtimeMins > 0) {
            const otHours = Math.floor(overtimeMins / 60);
            const otMins = overtimeMins % 60;
            statusBadgeText = `Overtime: ${otHours > 0 ? `${otHours}h ` : ''}${otMins}m`;
            statusBadgeType = 'warning';
          } else if (completedMins < standardMins) {
            statusBadgeText = 'Early Check-Out';
            statusBadgeType = 'warning';
          } else {
            statusBadgeText = 'Working Hours Completed';
            statusBadgeType = 'success';
          }
        } else {
          const hasAlreadyCheckedInToday = todayAtt && (todayAtt.in_time || (todayAtt.sessions && todayAtt.sessions.length > 0));
          const lateMins = hasAlreadyCheckedInToday ? 0 : getLateMinutes(currentTime, orgRules);
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

        // Auto-remove after 10 seconds
        setTimeout(() => {
          setRecentMatchedList((prev) => prev.filter((item) => item.id !== newMatch.id));
        }, 10000);

        setMessage({ type: 'success', text: `${staff.f_name}: ${res.data.message || `${actionLabel} successful!`}` });
        fetchFaces(); // Refresh face scan records immediately!
      } else {
        setMessage({ type: 'error', text: `${staff.f_name}: ${res.data.message || 'Scan failed.'}` });
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Error processing scan.';
      setError(errMsg);
      setMessage({ type: 'error', text: errMsg });
      
      const currentTime = getCurrentTime();
      let actionLabel = 'Scan Failed';
      let statusText = 'Error';
      if (errMsg.toLowerCase().includes('already')) {
        actionLabel = device_mode === 'out' ? 'Already Checked-Out' : 'Already Checked-In';
        statusText = '';
      }
      
      const newMatch = {
        ...staff,
        action: actionLabel,
        time: currentTime,
        statusBadgeText: statusText,
        statusBadgeType: 'danger',
        id: Date.now(),
      };
      
      setRecentMatchedList((prev) => [
        newMatch,
        ...prev.filter((item) => item.staff_id !== staff.staff_id)
      ].slice(0, 3));

      // Auto-remove after 10 seconds
      setTimeout(() => {
        setRecentMatchedList((prev) => prev.filter((item) => item.id !== newMatch.id));
      }, 10000);
      
    } finally {
      setLoading(false);
      setScanningStaff(null);
      // Clear status message after 3 seconds
      setTimeout(() => {
        setMessage(null);
      }, 3000);
    }
  }, [company_id, device_mode, companyConfig, fetchFaces]);

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
              .detectAllFaces(image, new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.75 }))
              .withFaceLandmarks()
              .withFaceDescriptors();

            const { video } = webcam;
            if (video && canvas && active) {
              const displaySize = { width: video.videoWidth, height: video.videoHeight };
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
              const currentMatchedIds = [];

              if (labeledDescriptors.length > 0) {
                const faceMatcher = new faceapi.FaceMatcher(labeledDescriptors, 0.42); // Stricter match threshold to prevent false matches (0.42)

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
                      currentMatchedIds.push(staff.staff_id);
                    }
                  }

                  // Draw bounding box
                  ctx.lineWidth = 3;
                  ctx.strokeStyle = isMatched ? '#23b3f4' : '#ef4444';
                  ctx.strokeRect(x, y, width, height);

                  // Draw tag background and label text (canceling mirroring for text readability)
                  ctx.font = 'bold 12px Inter, sans-serif';
                  const textWidth = ctx.measureText(labelText).width;
                  
                  ctx.save();
                  // Translate to center of text tag and flip horizontally to make it readable
                  ctx.translate(x + (textWidth + 16) / 2, y - 15);
                  ctx.scale(-1, 1);
                  
                  ctx.fillStyle = isMatched ? 'rgba(35, 179, 244, 0.85)' : 'rgba(239, 68, 68, 0.85)';
                  ctx.fillRect(-(textWidth + 16) / 2, -10, textWidth + 16, 20);
                  
                  ctx.fillStyle = '#ffffff';
                  ctx.fillText(labelText, -textWidth / 2, 4);
                  ctx.restore();
                });
              }

              // Update match counts for matched staff
              currentMatchedIds.forEach((id) => {
                matchCountsRef.current[id] = (matchCountsRef.current[id] || 0) + 1;
                lastSeenRef.current[id] = now;
              });

              // Clean up non-matched staff seen over 1.5 seconds ago
              Object.keys(matchCountsRef.current).forEach((id) => {
                if (!currentMatchedIds.includes(id)) {
                  if (now - (lastSeenRef.current[id] || 0) > 1500) {
                    delete matchCountsRef.current[id];
                    delete lastSeenRef.current[id];
                  }
                }
              });

              // Check and trigger scans for matched staff who reached stability threshold (3 frames)
              const stableStaffList = currentMatchedStaff.filter((staff) => {
                const count = matchCountsRef.current[staff.staff_id] || 0;
                return count >= 3;
              });

              // Filter stable staff list by their individual cooldown
              const eligibleStaffList = stableStaffList.filter((staff) => {
                const lastScanTime = recentScansRef.current[staff.staff_id] || 0;
                return (now - lastScanTime) > 8000; // 8 seconds per-staff cooldown
              });

              eligibleStaffList.forEach((staff) => {
                recentScansRef.current[staff.staff_id] = now; // Mark scanned immediately!
                matchCountsRef.current[staff.staff_id] = 0; // Reset count so it won't instantly retrigger
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

      <div className={`kiosk-page-wrapper ${isCheckInOnly ? 'kiosk-in-mode' : isCheckOutOnly ? 'kiosk-out-mode' : ''}`}>
        <Card className="shadow-lg border-0 kiosk-card animate__animated animate__fadeIn">
          <Card.Body className="kiosk-card-body p-4 w-100">


            <div className="row justify-content-center w-100 m-0">
              {/* Center layout for desktop & full-screen for mobile */}
              <div className="col-12 p-0 d-flex flex-column align-items-center justify-content-center">
                {/* Desktop-only Header (Top side) */}
                <div className="d-none d-md-block w-100 text-center mb-3">
                  <span
                    className={`badge ${badgeClass} px-3 py-1.5 rounded-pill fw-bold text-uppercase animate__animated animate__fadeInDown`}
                    style={{ letterSpacing: '0.05em', fontSize: '0.8rem' }}
                  >
                    {badgeText}
                  </span>
                </div>

                {!modelsLoaded || !faceDataLoaded ? (
                  <div className="d-flex flex-column align-items-center justify-content-center py-5">
                    <Spinner animation="border" variant="primary" className="mb-3" />
                    <span className="text-muted fw-semibold">{!modelsLoaded ? 'Loading AI models...' : 'Fetching staff face data...'}</span>
                  </div>
                ) : (
                  <div
                    className="webcam-container position-relative overflow-hidden rounded-3 shadow w-100"
                    style={{ border: '3px solid #e2e8f0', background: '#0f172a' }}
                  >
                    {/* Top Bar with Logo */}
                    <div className="position-absolute w-100 d-flex justify-content-center align-items-center" style={{ top: 0, left: 0, zIndex: 10, background: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(6px)', padding: '15px 0', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                      {companyInfo?.logo ? (
                        <img
                          src={process.env.REACT_APP_UPLOAD_DIR + companyInfo.logo}
                          alt={companyInfo?.name || 'Company Logo'}
                          style={{ maxHeight: '40px', objectFit: 'contain' }}
                        />
                      ) : (
                        <div className="kiosk-brand-logo-overlay" style={{ fontSize: '1.2rem', fontWeight: 900, color: '#fff', letterSpacing: '0.05em' }}>
                          THE <span style={{ color: '#23b3f4' }}>BOX</span>
                        </div>
                      )}
                    </div>
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
                          videoConstraints={{ 
                            facingMode: 'user', 
                            aspectRatio: window.innerWidth < 768 ? window.innerWidth / window.innerHeight : 4 / 3 
                          }}
                          onUserMediaError={() => setCameraError(true)}
                          style={{
                            width: '100%',
                            height: 'auto',
                            objectFit: 'cover',
                            display: 'block',
                            transform: 'scaleX(-1)',
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
                            transform: 'scaleX(-1)',
                          }}
                        />
                        <div className="scanner-overlay" />
                        <div
                          className="camera-status-text position-absolute w-100 text-center fw-bold d-none d-md-block"
                          style={{ bottom: '15px', color: '#fff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', zIndex: 10 }}
                        >
                          STAND IN FRONT OF CAMERA
                        </div>
                        
                        {/* Mobile Overlay for Loading & Latest Scan */}
                        {(loading && scanningStaff) || recentMatchedList.length > 0 ? (
                          <div className="d-md-none position-absolute w-100 p-3" style={{ bottom: '15px', zIndex: 20 }}>
                            {loading && scanningStaff ? (
                              <div className="p-3 shadow-lg d-flex justify-content-between align-items-center animate__animated animate__fadeInUp" style={{ background: '#23b3f4', color: '#fff', borderRadius: '12px' }}>
                                <div className="text-start">
                                  <div className="fw-bold" style={{ fontSize: '0.95rem', letterSpacing: '0.5px' }}>EMPLOYEE : {scanningStaff.f_name.toUpperCase()}</div>
                                  <div className="fw-bold mt-1 mb-2" style={{ fontSize: '0.95rem', letterSpacing: '0.5px' }}>TIME : {getCurrentTime()}</div>
                                  <div className="d-flex align-items-center" style={{ fontSize: '0.9rem' }}>
                                    <Spinner animation="border" size="sm" className="me-2" />
                                    <span>Marking attendance...</span>
                                  </div>
                                </div>
                                {scanningStaff.photo ? (
                                  <img
                                    src={`${process.env.REACT_APP_UPLOAD_DIR}${scanningStaff.photo}`}
                                    alt={scanningStaff.f_name}
                                    style={{ width: '65px', height: '65px', borderRadius: '8px', objectFit: 'cover', border: '2px solid #fff' }}
                                  />
                                ) : (
                                  <div
                                    style={{ width: '65px', height: '65px', borderRadius: '8px', background: 'rgba(255,255,255,0.2)', border: '2px solid #fff' }}
                                    className="d-flex align-items-center justify-content-center"
                                  >
                                    <CsLineIcons icon="user" size={24} />
                                  </div>
                                )}
                              </div>
                            ) : recentMatchedList.length > 0 ? (
                              <div className="p-3 shadow-lg d-flex justify-content-between align-items-center animate__animated animate__fadeInUp" style={{ background: (recentMatchedList[0].action.includes('Already') || recentMatchedList[0].statusBadgeType === 'danger') ? '#ef4444' : '#23b3f4', color: '#fff', borderRadius: '12px' }}>
                                <div className="text-start">
                                  <div className="fw-bold" style={{ fontSize: '0.95rem', letterSpacing: '0.5px' }}>EMPLOYEE : {recentMatchedList[0].f_name.toUpperCase()}</div>
                                  <div className="fw-bold mt-1 mb-2" style={{ fontSize: '0.95rem', letterSpacing: '0.5px' }}>TIME : {recentMatchedList[0].time}</div>
                                  <div className="d-flex align-items-center" style={{ fontSize: '0.9rem' }}>
                                    <CsLineIcons icon={(recentMatchedList[0].action.includes('Already') || recentMatchedList[0].statusBadgeType === 'danger') ? 'close-circle' : 'check-circle'} size="18" className="me-2" />
                                    <span>{recentMatchedList[0].action}</span>
                                  </div>
                                </div>
                                {recentMatchedList[0].photo ? (
                                  <img
                                    src={`${process.env.REACT_APP_UPLOAD_DIR}${recentMatchedList[0].photo}`}
                                    alt={recentMatchedList[0].f_name}
                                    style={{ width: '65px', height: '65px', borderRadius: '8px', objectFit: 'cover', border: '2px solid #fff' }}
                                  />
                                ) : (
                                  <div
                                    style={{ width: '65px', height: '65px', borderRadius: '8px', background: 'rgba(255,255,255,0.2)', border: '2px solid #fff' }}
                                    className="d-flex align-items-center justify-content-center"
                                  >
                                    <CsLineIcons icon="user" size={24} />
                                  </div>
                                )}
                              </div>
                            ) : null}
                          </div>
                        ) : null}
                      </>
                    )}
                  </div>
                )}
                
                {/* STATUS MESSAGE AREA */}
                {loading && (
                  <div className="d-none d-md-flex w-100 align-items-center justify-content-center mt-3 mb-2">
                    <div className="d-flex align-items-center text-primary">
                      <Spinner animation="border" size="sm" className="me-2" />
                      <span className="fw-semibold">Processing attendance...</span>
                    </div>
                  </div>
                )}

                {/* DIRECT SCAN RESULT DISPLAY */}
                <div className="w-100 d-none d-md-block mt-4">
                  {recentMatchedList.length > 0 ? (
                    <div className="w-100 d-flex flex-column gap-2 animate__animated animate__fadeIn">
                      <h6 className="text-start fw-bold text-muted text-uppercase mb-1 ps-2" style={{ fontSize: '0.75rem', letterSpacing: '0.08em' }}>Recent Scans</h6>
                    {recentMatchedList.map((matchedStaff, index) => {
                      const isPrimary = index === 0;
                      return (
                        <Card
                          key={matchedStaff.id}
                          className="border-0 shadow-sm transition-all w-100"
                          style={{
                            background: isPrimary ? '#f8fafc' : '#ffffff',
                            borderLeft: matchedStaff.action === 'Checked-In' ? '4px solid #3b82f6' : '4px solid #eab308',
                            borderRadius: '12px',
                            opacity: isPrimary ? 1 : 0.8,
                            transform: isPrimary ? 'scale(1)' : 'scale(0.96)',
                            border: isPrimary ? '1px solid rgba(59, 130, 246, 0.12)' : '1px solid rgba(226, 232, 240, 0.5)'
                          }}
                        >
                          <Card.Body className="p-2.5">
                            <div className="d-flex align-items-center justify-content-between">
                              <div className="d-flex align-items-center">
                                {matchedStaff.photo ? (
                                  <img
                                    src={`${process.env.REACT_APP_UPLOAD_DIR}${matchedStaff.photo}`}
                                    alt={matchedStaff.f_name}
                                    style={{ width: isPrimary ? '42px' : '34px', height: isPrimary ? '42px' : '34px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #fff', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
                                  />
                                ) : (
                                  <div
                                    style={{ width: isPrimary ? '42px' : '34px', height: isPrimary ? '42px' : '34px', borderRadius: '50%', background: 'rgba(35, 179, 244, 0.1)', color: '#23b3f4', border: '2px solid #fff', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
                                    className="d-flex align-items-center justify-content-center"
                                  >
                                    <CsLineIcons icon="user" size={isPrimary ? 18 : 14} />
                                  </div>
                                )}
                                <div className="text-start ms-2">
                                  <div className="fw-bold text-dark text-truncate" style={{ maxWidth: '120px', fontSize: isPrimary ? '0.82rem' : '0.76rem' }}>
                                    {matchedStaff.f_name} {matchedStaff.l_name}
                                  </div>
                                  <div className="text-muted text-truncate" style={{ fontSize: '0.68rem' }}>
                                    {matchedStaff.position || 'Staff'}
                                  </div>
                                </div>
                              </div>
                              <div className="text-end">
                                <span className={`badge ${matchedStaff.action === 'Checked-In' ? 'bg-soft-primary text-primary' : (matchedStaff.action.includes('Already') || matchedStaff.action === 'Scan Failed') ? 'bg-soft-danger text-danger' : 'bg-soft-warning text-warning'} px-2 py-0.5 rounded fw-bold mb-1 d-inline-block`} style={{ fontSize: '0.65rem' }}>
                                  {matchedStaff.action}
                                </span>
                                {matchedStaff.statusBadgeText && (
                                  <div
                                    className={`badge bg-soft-${matchedStaff.statusBadgeType} text-${matchedStaff.statusBadgeType} fw-bold px-1.5 py-0.5 rounded-pill d-block mt-0.5`}
                                    style={{
                                      background: matchedStaff.statusBadgeType === 'danger' ? 'rgba(239, 68, 68, 0.1)' : matchedStaff.statusBadgeType === 'warning' ? 'rgba(234, 179, 8, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                                      color: matchedStaff.statusBadgeType === 'danger' ? '#dc2626' : matchedStaff.statusBadgeType === 'warning' ? '#ca8a04' : '#10b981',
                                      border: `1px solid ${matchedStaff.statusBadgeType === 'danger' ? 'rgba(239, 68, 68, 0.15)' : matchedStaff.statusBadgeType === 'warning' ? 'rgba(234, 179, 8, 0.15)' : 'rgba(16, 185, 129, 0.15)'}`,
                                      fontSize: '0.6rem'
                                    }}
                                  >
                                    {matchedStaff.statusBadgeText}
                                  </div>
                                )}
                                <div className="text-muted fw-semibold mt-1" style={{ fontSize: '0.65rem' }}>
                                  {matchedStaff.time}
                                </div>
                              </div>
                            </div>
                          </Card.Body>
                        </Card>
                      );
                    })}
                  </div>
                  ) : (
                    <div className="w-100 d-flex flex-column align-items-center justify-content-center py-4 border rounded-3 border-dashed" style={{ borderColor: '#e2e8f0', borderStyle: 'dashed' }}>
                      <CsLineIcons icon="scan" className="text-muted mb-2 animate-pulse" size="24" />
                      <span className="text-muted small fw-semibold">Scan results will display here</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="w-100 border-top mt-4 pt-3 text-center d-none d-md-block" style={{ borderColor: 'rgba(226, 232, 240, 0.6)' }}>
              <span className="text-muted" style={{ fontSize: '0.7rem', letterSpacing: '0.05em', textTransform: 'uppercase', opacity: 0.7 }}>
                Powered by <strong style={{ color: '#0f172a' }}><a href="https://theboxsync.com" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'none' }}>TheBoxSync</a></strong>
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
          max-width: 600px;
          border-radius: 2.25rem;
          background: #ffffff;
          box-shadow: 0 20px 40px -15px rgba(15, 23, 42, 0.08) !important;
          border: 1px solid rgba(226, 232, 240, 0.8) !important;
          transition: all 0.3s ease;
        }

        .kiosk-card-body {
          padding: 1.75rem 1.75rem !important;
        }

        .kiosk-brand-logo {
          font-size: 1.4rem;
          font-weight: 900;
          color: #0f172a;
          letter-spacing: 0.15em;
          text-align: center;
        }

        .kiosk-brand-logo span {
          color: #23b3f4;
        }

        .login-login-form-title {
          font-size: 1.6rem;
          font-weight: 850;
          color: #0f172a;
          line-height: 1.25;
          letter-spacing: -0.02em;
        }

        .login-login-form-subtitle {
          font-size: 0.82rem;
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
        .kiosk-in-mode .webcam-container {
          box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.2) !important;
        }
        .kiosk-in-mode .scanner-overlay {
          background: linear-gradient(to bottom, rgba(16,185,129,0.15) 0%, rgba(16,185,129,0) 10%, rgba(16,185,129,0) 90%, rgba(16,185,129,0.15) 100%) !important;
        }
        .kiosk-out-mode .webcam-container {
          box-shadow: 0 0 0 4px rgba(245, 158, 11, 0.2) !important;
        }
        .kiosk-out-mode .scanner-overlay {
          background: linear-gradient(to bottom, rgba(245,158,11,0.15) 0%, rgba(245,158,11,0) 10%, rgba(245,158,11,0) 90%, rgba(245,158,11,0.15) 100%) !important;
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

        @media (min-width: 768px) {
          .kiosk-details-panel {
            border-left: 1px solid rgba(226, 232, 240, 0.7);
          }
        }

        @media (max-width: 992px) {
          .kiosk-card-body {
            padding: 1.5rem 1.5rem !important;
          }
        }

        @media (max-width: 576px) {
          .kiosk-page-wrapper {
            padding: 0px !important;
            align-items: flex-start !important;
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            z-index: 99999 !important;
          }
          .kiosk-card {
            border-radius: 0 !important;
            max-width: 100% !important;
            min-height: 100vh;
            border: none !important;
            box-shadow: none !important;
            background: #000;
          }
          .kiosk-card-body {
            padding: 0 !important;
            display: flex;
            flex-direction: column;
            height: 100vh;
          }
          .row {
            margin: 0 !important;
            height: 100vh;
            --bs-gutter-x: 0 !important;
            --bs-gutter-y: 0 !important;
          }
          .col-md-7, .col-12 {
            padding: 0 !important;
            margin: 0 !important;
            height: 100vh;
          }
          .webcam-container {
            border-radius: 0 !important;
            box-shadow: none !important;
            border: none !important;
            height: 100vh;
            display: flex;
            flex-direction: column;
            justify-content: center;
          }
          .webcam-container video,
          .webcam-container canvas {
            height: 100vh !important;
            object-fit: cover !important;
            aspect-ratio: auto !important;
          }
          .login-login-form-title {
            font-size: 1.4rem !important;
          }
          .login-login-form-subtitle {
            font-size: 0.78rem !important;
            padding: 0 5px !important;
          }
        }
      `}</style>
    </>
  );
};

export default KioskScan;
