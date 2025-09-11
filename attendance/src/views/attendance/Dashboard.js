import React, { useState, useEffect, useRef } from 'react';
import { useHistory } from 'react-router-dom';
import axios from 'axios';
import * as faceapi from 'face-api.js';
import Webcam from 'react-webcam';
import { Row, Col, Card, Button, Modal, Alert, Badge } from 'react-bootstrap';
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import CsLineIcons from 'cs-line-icons/CsLineIcons';

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
      const response = await axios.get(`${process.env.REACT_APP_API}/user/userdata`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      if (response.data === 'Null') history.push('/login');
      else setUserData(response.data);
    } catch (err) {
      console.log('Error fetching user data:', err);
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
      setStaffList(res.data);
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

  const isCheckedInToday = (attendanceList) => {
    const today = getTodayDate();
    return attendanceList?.some((a) => a.date === today && a.in_time && !a.out_time);
  };

  const handleCheckIn = async (staffId) => {
    try {
      await axios.post(
        `${process.env.REACT_APP_API}/staff/check-in`,
        {
          staff_id: staffId,
          date: getTodayDate(),
          in_time: getCurrentTime(),
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }
      );
      setDetectedStaff(null);
      fetchStaffEncodings();
      alert('Check-in successful');
    } catch (err) {
      console.error('Check-in failed:', err);
      setError('Check-in failed. Please try again.');
    }
  };

  const handleCheckOut = async (staffId) => {
    try {
      await axios.post(
        `${process.env.REACT_APP_API}/staff/check-out`,
        {
          staff_id: staffId,
          date: getTodayDate(),
          out_time: getCurrentTime(),
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }
      );
      setDetectedStaff(null);
      fetchStaffEncodings();
      alert('Check-out successful');
    } catch (err) {
      console.error('Check-out failed:', err);
      setError('Check-out failed. Please try again.');
    }
  };

  return (
    <>
      <HtmlHead title={title} description={description} />

      <Row>
        <Col>
          <div className="page-title-container">
            <Row className="align-items-center">
              <Col>
                <h1 className="mb-0 pb-0 display-4">{title}</h1>
                <BreadcrumbList items={breadcrumbs} />
              </Col>
            </Row>
          </div>

          {error && (
            <Alert variant="danger" className="mb-4">
              <CsLineIcons icon="error" className="me-2" />
              {error}
            </Alert>
          )}

          <Card className="mb-5">
            <Card.Header>
              <Card.Title className="mb-0">Face Recognition Attendance</Card.Title>
            </Card.Header>
            <Card.Body className="text-center">
              <CsLineIcons icon="camera" size={48} className="text-primary mb-3" />
              <h5 className="mb-4">Facial Recognition System</h5>

              <Button variant="primary" size="lg" onClick={() => setShowCameraModal(true)} disabled={!modelsLoaded} className="mb-4">
                <CsLineIcons icon="camera" className="me-2" />
                {modelsLoaded ? 'Open Camera' : 'Loading Models...'}
              </Button>

              {detectedStaff && (
                <Card className="bg-light border-0 mt-4">
                  <Card.Body>
                    <CsLineIcons icon="user" size={32} className="text-success mb-3" />
                    <h5 className="text-success mb-3">Staff Identified</h5>

                    <div className="text-center">
                      <div className="mb-3">
                        <strong>Staff ID:</strong> {detectedStaff.staff_id}
                      </div>
                       <div className="mb-3">
                        <strong>Name:</strong> {detectedStaff.f_name} {detectedStaff.l_name}
                      </div>
                      <div className="mb-3">
                        <strong>Position:</strong> {detectedStaff.position}
                      </div>
                      <div className="mb-3">
                        <strong>Email:</strong> {detectedStaff.email}
                      </div>
                      <div className="mb-2">
                        <strong>Status:</strong>
                        <Badge bg={isCheckedInToday(detectedStaff.attandance) ? 'warning' : 'secondary'} className="ms-2">
                          {isCheckedInToday(detectedStaff.attandance) ? 'Checked In' : 'Not Checked In'}
                        </Badge>
                      </div>
                    </div>

                    <div className="mt-4">
                      {isCheckedInToday(detectedStaff.attandance) ? (
                        <Button variant="danger" size="lg" onClick={() => handleCheckOut(detectedStaff._id)}>
                          <CsLineIcons icon="log-out" className="me-2" />
                          Check Out
                        </Button>
                      ) : (
                        <Button variant="success" size="lg" onClick={() => handleCheckIn(detectedStaff._id)}>
                          <CsLineIcons icon="log-in" className="me-2" />
                          Check In
                        </Button>
                      )}
                    </div>
                  </Card.Body>
                </Card>
              )}
            </Card.Body>
            <Card.Footer className="bg-transparent">
              <small className="text-muted">
                <CsLineIcons icon="info" className="me-1" />
                Ensure good lighting and face the camera directly for best results
              </small>
            </Card.Footer>
          </Card>
        </Col>
      </Row>

      {/* Camera Modal */}
      <Modal
        show={showCameraModal}
        onHide={() => {
          setShowCameraModal(false);
          setError('');
        }}
        centered
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <CsLineIcons icon="camera" className="me-2" />
            Face Recognition
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="d-flex flex-column align-items-center">
          <div className="position-relative" style={{ width: '100%', maxWidth: '640px' }}>
            <Webcam
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              videoConstraints={{ facingMode: 'user' }}
              className="rounded border"
              style={{
                width: '100%',
                height: 'auto',
                objectFit: 'cover',
                aspectRatio: '4/3',
              }}
            />
          </div>

          <Button variant="primary" size="lg" className="mt-4" disabled={detecting} onClick={handleFaceDetection}>
            {detecting ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" />
                Detecting Face...
              </>
            ) : (
              <>
                <CsLineIcons icon="scan" className="me-2" />
                Detect Face
              </>
            )}
          </Button>
        </Modal.Body>
        <Modal.Footer>
          <small className="text-muted">Position your face in the center of the frame and ensure good lighting</small>
        </Modal.Footer>
      </Modal>
    </>
  );
}
