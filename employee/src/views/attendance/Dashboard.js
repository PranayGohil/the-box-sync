import React, { useState, useEffect, useRef } from 'react';
import { useHistory } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';
import * as faceapi from 'face-api.js';
import Webcam from 'react-webcam';
import { Row, Col, Card, Button, Modal, Alert, Badge, Image, Tab, Form, Table, Spinner, Nav } from 'react-bootstrap';
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import { format } from 'date-fns';
import { enIN } from 'date-fns/locale';
import CreatableSelect from 'react-select/creatable';
import WfhTracker from './WfhTracker';

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
    overflow: hidden;
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
    color: white !important;
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
    color: white !important;
  }

  .btn-check-out:hover {
    background: #e11d48 !important;
    transform: translateY(-2px);
    box-shadow: 0 12px 30px rgba(244, 63, 94, 0.4) !important;
  }

  .scanner-modal .modal-content {
    border-radius: 1.5rem;
    border: none;
    overflow: hidden;
    background: #ffffff;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  }
  
  .scanner-modal .modal-header {
    border-bottom: 1px solid #f1f5f9;
    background: #ffffff;
    color: #0f172a;
  }
  
  .scanner-modal .btn-close {
    filter: none;
  }

  .webcam-container {
    position: relative;
    border-radius: 1rem;
    overflow: hidden;
    border: 3px solid #e2e8f0;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);
  }

  .bg-soft-primary {
    background-color: rgba(35, 179, 244, 0.1) !important;
    color: #23b3f4 !important;
  }

  .bg-soft-secondary {
    background-color: #f1f5f9 !important;
    color: #64748b !important;
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

  /* Staff Portal Dashboard CSS */
  .staff-portal-wrapper {
    min-height: 80vh;
    padding: 1.5rem 0;
  }

  .portal-welcome-banner {
    background: linear-gradient(135deg, #1ea8e7 0%, #0d6efd 100%);
    border-radius: 1.5rem;
    padding: 2.5rem;
    color: white;
    margin-bottom: 2rem;
    position: relative;
    overflow: hidden;
    box-shadow: 0 10px 30px rgba(30,168,231,0.15);
  }

  .portal-welcome-banner::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 70%);
    pointer-events: none;
  }

  .glass-card {
    background: rgba(255, 255, 255, 0.95) !important;
    backdrop-filter: blur(20px) !important;
    border: 1px solid rgba(255, 255, 255, 0.4) !important;
    border-radius: 1.5rem !important;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.03) !important;
    transition: all 0.3s ease;
  }

  .nav-pills-portal .nav-link {
    border-radius: 12px !important;
    padding: 0.8rem 1.25rem !important;
    color: #64748b !important;
    font-weight: 600 !important;
    margin-bottom: 0.5rem !important;
    transition: all 0.2s ease !important;
    border: 1px solid transparent !important;
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .nav-pills-portal .nav-link.active {
    background: #e0f2fe !important;
    color: #0284c7 !important;
    border: 1px solid #bae6fd !important;
  }

  .balance-card {
    border-radius: 1rem;
    padding: 1.25rem;
    border: 1px solid rgba(0, 0, 0, 0.05);
    background: #f8fafc;
    transition: all 0.2s ease;
  }

  .balance-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.04);
  }

  .text-label {
    font-size: 0.75rem;
    text-transform: uppercase;
    font-weight: 800;
    color: #94a3b8;
    letter-spacing: 0.05em;
    margin-bottom: 0.25rem;
  }

  .text-value {
    font-size: 1.15rem;
    font-weight: 600;
    color: #1e293b;
  }

  .btn-portal-primary {
    background: #1ea8e7 !important;
    border: none !important;
    border-radius: 50px !important;
    padding: 0.6rem 1.5rem !important;
    font-weight: 600 !important;
    box-shadow: 0 4px 12px rgba(30, 168, 231, 0.2) !important;
    color: white !important;
    transition: all 0.2s ease !important;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
  }

  .btn-portal-primary:hover {
    background: #1594ce !important;
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(30, 168, 231, 0.3) !important;
  }

  .badge-portal {
    padding: 0.4rem 0.8rem;
    border-radius: 50px;
    font-weight: 700;
    font-size: 0.75rem;
    letter-spacing: 0.02em;
    text-transform: uppercase;
  }

  .bg-soft-primary { background-color: rgba(30, 168, 231, 0.08) !important; }
  .bg-soft-success { background-color: rgba(16, 185, 129, 0.08) !important; }
  .bg-soft-danger { background-color: rgba(239, 68, 68, 0.08) !important; }
  .bg-soft-warning { background-color: rgba(245, 158, 11, 0.08) !important; }
  .bg-soft-secondary { background-color: rgba(100, 116, 139, 0.08) !important; }

  .profile-photo-wrapper {
    width: 140px;
    height: 140px;
    border-radius: 50%;
    padding: 5px;
    background: linear-gradient(135deg, #1ea8e7 0%, #0d6efd 100%);
    margin-bottom: 1.5rem;
    box-shadow: 0 10px 25px rgba(30, 168, 231, 0.25);
  }

  .profile-photo-inner {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background: #fff;
    padding: 3px;
    overflow: hidden;
  }

  .profile-photo-inner img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 50%;
  }

  /* Tablet and Mobile Responsiveness */
  @media (max-width: 767.98px) {
    .kiosk-wrapper {
      min-height: calc(100vh - 80px);
      padding: 0.75rem;
    }
    .kiosk-card {
      border-radius: 1.5rem !important;
    }
    .kiosk-header-banner {
      padding: 2rem 1rem;
    }
    .company-logo-wrapper {
      width: 90px;
      height: 90px;
      margin-bottom: 1rem;
      padding: 6px;
    }
    .kiosk-action-area {
      padding: 2.5rem 1rem;
    }
    .scan-btn {
      padding: 0.8rem 2rem !important;
      font-size: 1.1rem !important;
    }
    .staff-match-card {
      padding: 1.75rem 1rem;
      border-radius: 1.25rem;
    }
    .action-btn {
      padding: 0.75rem 1.75rem !important;
      font-size: 1rem !important;
    }
  }

  @media (max-width: 575.98px) {
    .kiosk-header-banner h1 {
      font-size: 1.5rem !important;
    }
    .scan-btn {
      width: 100%;
      justify-content: center;
    }
    .webcam-container video,
    .webcam-container canvas {
      aspect-ratio: 4/3 !important; /* Increase vertical height/length of camera scan on mobile only */
    }
  }
`;

export default function Dashboard() {
  const history = useHistory();
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);

  const title = 'Employee Panel';
  const description = 'Manage staff details and attendance';
  const breadcrumbs = [
    { to: '', text: 'Home' },
    { to: 'attendance-dashboard', text: 'Employee Panel' },
  ];

  const [userData, setUserData] = useState('');
  const { currentUser } = useSelector((state) => state.auth);
  const [staffList, setStaffList] = useState([]);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [detectedStaff, setDetectedStaff] = useState(null);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [kioskActionType, setKioskActionType] = useState('check-in');
  const [showWfhNavModal, setShowWfhNavModal] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Portal State variables
  const [profileData, setProfileData] = useState(null);
  const [assignedAssets, setAssignedAssets] = useState([]);
  const [assetRequests, setAssetRequests] = useState([]);
  const [leaveBalances, setLeaveBalances] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [leavePolicy, setLeavePolicy] = useState(null);
  const [loadingPortal, setLoadingPortal] = useState(false);

  // Modals state
  const [showAssetRequestModal, setShowAssetRequestModal] = useState(false);
  const [showLeaveRequestModal, setShowLeaveRequestModal] = useState(false);
  const [showResignationModal, setShowResignationModal] = useState(false);

  const [assetReqForm, setAssetReqForm] = useState({ asset_name: '', asset_type: 'Laptop / PC', reason: '' });
  const [leaveReqForm, setLeaveReqForm] = useState({ leave_type_id: '', from_date: '', to_date: '', days: 1, is_half_day: false, half_day_session: 'first_half', reason: '' });
  const [resignationReason, setResignationReason] = useState('');
  const [resignationCategory, setResignationCategory] = useState('Career Growth & Better Opportunity');
  const [resignationAck1, setResignationAck1] = useState(false);
  const [resignationAck2, setResignationAck2] = useState(false);
  const [resignationSignature, setResignationSignature] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [feedbacksList, setFeedbacksList] = useState([]);
  const [feedbackForm, setFeedbackForm] = useState({ type: 'feedback', title: '', description: '', is_anonymous: false });
  const [resignationCategories, setResignationCategories] = useState([
    { label: 'Career Growth & Better Opportunity', value: 'Career Growth & Better Opportunity' },
    { label: 'Higher Education / Studies', value: 'Higher Education' },
    { label: 'Personal & Family Reasons', value: 'Personal & Family Reasons' },
    { label: 'Health & Well-being', value: 'Health & Well-being' },
    { label: 'Career Change & Pivot', value: 'Career Change & Pivot' },
    { label: 'Relocation & Travel', value: 'Relocation & Travel' }
  ]);
  const [feedbackTypes, setFeedbackTypes] = useState([
    { label: 'General Feedback / Suggestion', value: 'feedback' },
    { label: 'Formal Complaint', value: 'complaint' }
  ]);
  const [livenessStatus, setLivenessStatus] = useState('');
  const [livenessProgress, setLivenessProgress] = useState(0);
  const [lateMinutes, setLateMinutes] = useState(0);
  const [overtimeHours, setOvertimeHours] = useState(0);
  const [isRestrictedNetwork, setIsRestrictedNetwork] = useState(false);
  const [isWfh, setIsWfh] = useState(false);
  const [regularizationRequests, setRegularizationRequests] = useState([]);

  useEffect(() => {
    if (currentUser?.role === 'admin') {
      const stored = JSON.parse(localStorage.getItem('regularization_requests') || '[]');
      setRegularizationRequests(stored);
    }
  }, [currentUser]);

  const handleApproveReg = (id) => {
    const stored = JSON.parse(localStorage.getItem('regularization_requests') || '[]');
    const updated = stored.map(req => req.id === id ? { ...req, status: 'Approved' } : req);
    localStorage.setItem('regularization_requests', JSON.stringify(updated));
    setRegularizationRequests(updated);
    setSuccessMsg('Regularization Request Approved');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleRejectReg = (id) => {
    const stored = JSON.parse(localStorage.getItem('regularization_requests') || '[]');
    const updated = stored.map(req => req.id === id ? { ...req, status: 'Rejected' } : req);
    localStorage.setItem('regularization_requests', JSON.stringify(updated));
    setRegularizationRequests(updated);
    setSuccessMsg('Regularization Request Rejected');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

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
    return now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const calculateLeaveDays = (from, to, isHalfDay) => {
    if (isHalfDay) return 0.5;
    if (!from || !to) return 1;
    const start = new Date(from);
    const end = new Date(to);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 1;
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  // Load user data
  const fetchUserData = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API}/kiosk/me`, {
        headers: { Authorization: `Bearer ${sessionStorage.getItem('token')}` },
      });
      if (response.data) {
        setUserData(response.data);
        setIsRestrictedNetwork(response.data.is_restricted || false);
        if (response.data.is_restricted) {
          setIsWfh(true);
        }
      } else {
        history.push('/login');
      }
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
        headers: { Authorization: `Bearer ${sessionStorage.getItem('token')}` },
      });
      setStaffList(res.data.data);
    } catch (err) {
      console.error('Error fetching staff face data:', err);
      setError('Failed to load staff data');
    }
  };

  // Fetch all portal details for staff member
  const fetchPortalData = async () => {
    if (!currentUser || currentUser.role !== 'staff') return;
    try {
      setLoadingPortal(true);
      const token = sessionStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      // Profile details
      const profileRes = await axios.get(`${process.env.REACT_APP_API}/staff/get/${currentUser._id}`, { headers });
      if (profileRes.data && profileRes.data.success) {
        setProfileData(profileRes.data.data);
      }

      // Assets
      const assetsRes = await axios.get(`${process.env.REACT_APP_API}/assets`, { headers });
      if (assetsRes.data && assetsRes.data.success) {
        setAssignedAssets(assetsRes.data.data);
      }

      // Asset Requests
      const assetReqRes = await axios.get(`${process.env.REACT_APP_API}/assets/requests`, { headers });
      if (assetReqRes.data && assetReqRes.data.success) {
        setAssetRequests(assetReqRes.data.data);
      }

      // Leave Balances
      const leaveBalRes = await axios.get(`${process.env.REACT_APP_API}/leave/balances`, { headers });
      if (leaveBalRes.data && leaveBalRes.data.success) {
        const matchingBal = leaveBalRes.data.data.find(b => b.staff_id?._id === currentUser._id || b.staff_id === currentUser._id);
        setLeaveBalances(matchingBal ? matchingBal.balances : []);
      }

      // Leave Requests
      const leaveRequestsRes = await axios.get(`${process.env.REACT_APP_API}/leave/requests`, { headers });
      if (leaveRequestsRes.data && leaveRequestsRes.data.success) {
        setLeaveRequests(leaveRequestsRes.data.data);
      }

      // Leave Policy
      const leavePolicyRes = await axios.get(`${process.env.REACT_APP_API}/leave-policy`, { headers });
      if (leavePolicyRes.data && leavePolicyRes.data.success) {
        let policyData = leavePolicyRes.data.data;
        if (profileRes.data && profileRes.data.data && profileRes.data.data.leave_policy_configuration) {
          const config = profileRes.data.data.leave_policy_configuration;
          policyData.leave_types = policyData.leave_types.filter(lt => {
            const cfg = config.find(c => c.leave_type_id === lt.leave_type_id);
            return !(cfg && cfg.is_active === false);
          });
        }
        setLeavePolicy(policyData);
        if (policyData.leave_types?.length > 0) {
          setLeaveReqForm(f => ({ ...f, leave_type_id: policyData.leave_types[0].leave_type_id }));
        }
      }

      // Feedbacks & Complaints
      const feedbacksRes = await axios.get(`${process.env.REACT_APP_API}/feedback/my`, { headers });
      if (feedbacksRes.data && feedbacksRes.data.success) {
        setFeedbacksList(feedbacksRes.data.data);
      }
    } catch (err) {
      console.error('Error fetching staff portal data:', err);
    } finally {
      setLoadingPortal(false);
    }
  };

  useEffect(() => {
    fetchUserData();
    loadModels();
    fetchStaffEncodings();
  }, []);

  useEffect(() => {
    if (currentUser && currentUser.role === 'staff') {
      fetchPortalData();
    }
  }, [currentUser]);

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

  const isCheckedInToday = (staff) => {
    return !!staff?.todayAttendance?.in_time && !staff?.todayAttendance?.out_time;
  };

  const handleCheckIn = async (staffId) => {
    try {
      const res = await axios.post(
        `${process.env.REACT_APP_API}/attendance/check-in`,
        {
          staff_id: staffId,
          date: getTodayDate(),
          in_time: getCurrentTime(),
          is_wfh: isWfh,
        },
        {
          headers: { Authorization: `Bearer ${sessionStorage.getItem('token')}` },
        }
      );
      const lateMin = res.data?.data?.late_by_minutes || 0;
      setLateMinutes(lateMin);
      setOvertimeHours(0);
      const latePart = lateMin > 0 ? ` 🔴 LATE by ${lateMin} min` : '';
      setSuccessMsg(`✅ Check-in successful at ${getCurrentTime()}${latePart}`);
      setError('');
      await fetchStaffEncodings();
      if (currentUser?.role === 'staff') {
        fetchPortalData();
      }
      setDetectedStaff(null);
    } catch (err) {
      console.error('Check-in failed:', err);
      setError('Check-in failed. Please try again.');
    }
  };

  const handleCheckOut = async (staffId) => {
    try {
      const res = await axios.post(
        `${process.env.REACT_APP_API}/attendance/check-out`,
        {
          staff_id: staffId,
          date: getTodayDate(),
          out_time: getCurrentTime(),
        },
        {
          headers: { Authorization: `Bearer ${sessionStorage.getItem('token')}` },
        }
      );
      const otHours = res.data?.data?.overtime_hours || 0;
      setOvertimeHours(otHours);
      setLateMinutes(0);
      const otPart = otHours > 0 ? ` ⚡ OVERTIME ${otHours}h` : '';
      setSuccessMsg(`✅ Check-out successful at ${getCurrentTime()}${otPart}`);
      setError('');
      await fetchStaffEncodings();
      if (currentUser?.role === 'staff') {
        fetchPortalData();
      }
      setDetectedStaff(null);
    } catch (err) {
      console.error('Check-out failed:', err);
      setError('Check-out failed. Please try again.');
    }
  };

  const handleFaceDetection = async () => {
    try {
      setDetecting(true);
      setError('');
      setLivenessProgress(20);
      setLivenessStatus('Aligning face...');

      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }

      // Try capturing/detecting for up to 5 seconds
      const maxAttempts = 15;
      let matchedStaff = null;

      /* eslint-disable no-await-in-loop, no-continue */
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        if (!webcamRef.current) {
          await new Promise((resolve) => setTimeout(resolve, 300));
          continue;
        }

        const screenshot = webcamRef.current.getScreenshot();
        if (!screenshot) {
          await new Promise((resolve) => setTimeout(resolve, 300));
          continue;
        }

        const image = await faceapi.fetchImage(screenshot);
        const detection = await faceapi.detectSingleFace(image, new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.3 }))
          .withFaceLandmarks()
          .withFaceDescriptor();

        if (detection) {
          // Draw bounding box
          const webcam = webcamRef.current;
          if (webcam && canvas) {
            const { video } = webcam;
            if (video) {
              const displaySize = { width: video.clientWidth, height: video.clientHeight };
              faceapi.matchDimensions(canvas, displaySize);
              const resizedDetection = faceapi.resizeResults(detection, displaySize);
              const ctx = canvas.getContext('2d');
              ctx.clearRect(0, 0, displaySize.width, displaySize.height);

              const { x, y, width, height } = resizedDetection.detection.box;
              ctx.lineWidth = 3;
              ctx.strokeStyle = '#23b3f4';
              ctx.strokeRect(x, y, width, height);

              // Draw tag background and label text (canceling mirroring for text readability)
              ctx.font = 'bold 12px Inter, sans-serif';
              const labelText = 'Scanning...';
              const textWidth = ctx.measureText(labelText).width;

              ctx.save();
              // Translate to center of text tag and flip horizontally to make it readable
              ctx.translate(x + (textWidth + 16) / 2, y - 15);
              ctx.scale(-1, 1);

              ctx.fillStyle = 'rgba(35, 179, 244, 0.85)';
              ctx.fillRect(-(textWidth + 16) / 2, -10, textWidth + 16, 20);

              ctx.fillStyle = '#ffffff';
              ctx.fillText(labelText, -textWidth / 2, 4);
              ctx.restore();
            }
          }

          // Face found! Let's match it
          const matchedDescriptor = detection.descriptor;
          const labeledDescriptors = staffList.map((staff) => {
            const floatDesc = new Float32Array(staff.face_encoding);
            return new faceapi.LabeledFaceDescriptors(`${staff._id}|${staff.f_name} ${staff.l_name}`, [floatDesc]);
          });

          const faceMatcher = new faceapi.FaceMatcher(labeledDescriptors, 0.5);
          const match = faceMatcher.findBestMatch(matchedDescriptor);

          if (match.label !== 'unknown') {
            const [id] = match.label.split('|');
            matchedStaff = staffList.find((s) => s._id === id);
            break;
          }
        }

        await new Promise((resolve) => setTimeout(resolve, 200));
        setLivenessProgress(20 + Math.round((attempt / maxAttempts) * 60));
      }
      /* eslint-enable no-await-in-loop, no-continue */

      if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }

      if (!matchedStaff) {
        setError('No matching staff found. Please ensure you are standing in front of the camera.');
        return;
      }

      if (currentUser?.role === 'staff' && matchedStaff._id !== currentUser?._id) {
        setError('Verification failed: Face does not match the logged-in employee.');
        return;
      }

      setLivenessStatus('Verifying...');
      setLivenessProgress(95);

      if (kioskActionType === 'check-out') {
        await handleCheckOut(matchedStaff._id);
      } else {
        await handleCheckIn(matchedStaff._id);
      }
      setShowCameraModal(false);

    } catch (err) {
      console.error(err);
      setError('Face detection failed. Please try again.');
    } finally {
      setDetecting(false);
      setLivenessProgress(0);
      setLivenessStatus('');
    }
  };

  useEffect(() => {
    let timer = null;
    if (showCameraModal && modelsLoaded && !detecting) {
      timer = setTimeout(() => {
        handleFaceDetection();
      }, 1000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [showCameraModal, modelsLoaded]);

  const handleAssetRequestSubmit = async (e) => {
    e.preventDefault();
    if (!assetReqForm.asset_name.trim()) {
      setError('Asset name is required');
      return;
    }
    try {
      setSubmitLoading(true);
      setError('');
      const token = sessionStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.post(`${process.env.REACT_APP_API}/assets/requests`, assetReqForm, { headers });
      if (res.data && res.data.success) {
        setSuccessMsg('✅ Asset request submitted successfully!');
        setShowAssetRequestModal(false);
        setAssetReqForm({ asset_name: '', asset_type: 'Laptop / PC', reason: '' });
        fetchPortalData();
      } else {
        setError(res.data.message || 'Failed to submit request');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Error submitting asset request.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleLeaveRequestSubmit = async (e) => {
    e.preventDefault();
    if (!leaveReqForm.leave_type_id) {
      setError('Please select a leave type');
      return;
    }
    if (!leaveReqForm.from_date || !leaveReqForm.to_date) {
      setError('From and To dates are required');
      return;
    }
    try {
      setSubmitLoading(true);
      setError('');
      const token = sessionStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const computedDays = calculateLeaveDays(leaveReqForm.from_date, leaveReqForm.to_date, leaveReqForm.is_half_day);
      const payload = {
        ...leaveReqForm,
        days: computedDays,
      };
      const res = await axios.post(`${process.env.REACT_APP_API}/leave/requests`, payload, { headers });
      if (res.data && res.data.success) {
        setSuccessMsg('✅ Leave applied successfully!');
        setShowLeaveRequestModal(false);
        setLeaveReqForm({
          leave_type_id: leavePolicy?.leave_types?.[0]?.leave_type_id || '',
          from_date: '',
          to_date: '',
          days: 1,
          is_half_day: false,
          half_day_session: 'first_half',
          reason: ''
        });
        fetchPortalData();
      } else {
        setError(res.data.message || 'Failed to apply leave');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Error applying leave.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleResignationSubmit = async (e) => {
    e.preventDefault();
    const employeeFullName = `${profileData?.f_name || ''} ${profileData?.l_name || ''}`.trim();
    
    if (resignationReason.trim().length < 150) {
      setError('❌ Resignation explanation must be at least 150 characters long.');
      return;
    }
    
    if (!resignationAck1 || !resignationAck2) {
      setError('❌ You must acknowledge both terms and notice period to proceed.');
      return;
    }

    if (resignationSignature.trim().toLowerCase() !== employeeFullName.toLowerCase()) {
      setError(`❌ Signature mismatch. Please type your exact name: "${employeeFullName}"`);
      return;
    }

    try {
      setSubmitLoading(true);
      setError('');
      const token = sessionStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      const formattedReason = `[Category: ${resignationCategory}] ${resignationReason}`;
      
      const res = await axios.post(`${process.env.REACT_APP_API}/staff/resign/${currentUser._id}`, { reason: formattedReason }, { headers });
      if (res.data && res.data.success) {
        setSuccessMsg('✅ Resignation submitted successfully!');
        setShowResignationModal(false);
        // Reset states
        setResignationReason('');
        setResignationSignature('');
        setResignationAck1(false);
        setResignationAck2(false);
        fetchPortalData(); // Refresh profileData
      } else {
        setError(res.data.message || 'Failed to submit resignation');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Error submitting resignation.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    if (!feedbackForm.title.trim() || !feedbackForm.description.trim()) {
      setError('❌ Title and description are required.');
      return;
    }
    try {
      setSubmitLoading(true);
      setError('');
      const token = sessionStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.post(`${process.env.REACT_APP_API}/feedback/submit`, feedbackForm, { headers });
      if (res.data && res.data.success) {
        setSuccessMsg('✅ Feedback/complaint submitted successfully!');
        setFeedbackForm({ type: 'feedback', title: '', description: '', is_anonymous: false });
        // Refresh feedback list
        const feedbacksRes = await axios.get(`${process.env.REACT_APP_API}/feedback/my`, { headers });
        if (feedbacksRes.data && feedbacksRes.data.success) {
          setFeedbacksList(feedbacksRes.data.data);
        }
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Error submitting feedback.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    const d = new Date(dateString);
    return format(d, 'dd MMMM, yyyy', { locale: enIN });
  };

  const getLeaveTypeLabel = (id) => {
    if (!id) return '';
    const type = leavePolicy?.leave_types?.find(t => t.leave_type_id === id);
    if (type) return type.name;
    return id
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const getCarryForwardText = (id) => {
    const type = leavePolicy?.leave_types?.find(t => t.leave_type_id === id);
    if (!type) return 'Carry Forward: No';
    return type.carry_forward 
      ? `Carry Forward: Yes (Max ${type.max_carry_forward || 0} Days)` 
      : 'Carry Forward: No';
  };

  const getPortalStatusBadge = (status) => {
    const s = (status || 'pending').toLowerCase();
    switch (s) {
      case 'approved':
      case 'available':
        return <Badge className="badge-portal bg-soft-success text-success">Approved</Badge>;
      case 'rejected':
      case 'lost':
        return <Badge className="badge-portal bg-soft-danger text-danger">Rejected</Badge>;
      case 'pending':
        return <Badge className="badge-portal bg-soft-warning text-warning">Pending</Badge>;
      case 'assigned':
        return <Badge className="badge-portal bg-soft-primary text-primary">Assigned</Badge>;
      default:
        return <Badge className="badge-portal bg-soft-secondary text-secondary">{status}</Badge>;
    }
  };

  // Staff record in face list containing check-in status
  const myStaffRecord = staffList.find(s => s._id === currentUser?._id) || staffList[0];

  const isWfhActive = isCheckedInToday(myStaffRecord) && myStaffRecord?.todayAttendance?.wfh_tracking?.is_wfh;

  // Intercept React Router navigation when WFH is active
  useEffect(() => {
    if (isWfhActive) {
      const unblock = history.block((location) => {
        setShowWfhNavModal(true);
        return false; // Prevent internal navigation
      });
      return () => {
        unblock();
      };
    }
    return undefined;
  }, [history, isWfhActive]);

  const renderStaffPortal = () => {
    if (loadingPortal || !profileData) {
      return (
        <div className="d-flex align-items-center justify-content-center py-5" style={{ minHeight: '60vh' }}>
          <Spinner animation="border" style={{ color: '#1ea8e7' }} />
        </div>
      );
    }

    return (
      <div className="staff-portal-wrapper">
        <div className="portal-welcome-banner">
          <Row className="align-items-center">
            <Col md={8}>
              <h1 className="fw-bolder mb-2 text-white">Hello, {profileData.f_name}!</h1>
              <p className="mb-0 text-white-50 fw-bold letter-spacing-1">
                Welcome to your Staff Portal. Easily manage check-ins, assets, and leave requests.
              </p>
            </Col>
            <Col md={4} className="text-md-end mt-3 mt-md-0">
              <div className="d-inline-flex flex-column align-items-md-end gap-2">
                <Badge 
                  bg={isCheckedInToday(myStaffRecord) ? (myStaffRecord?.todayAttendance?.wfh_tracking?.is_wfh ? 'info' : 'warning') : 'light'} 
                  className={isCheckedInToday(myStaffRecord) 
                    ? (myStaffRecord?.todayAttendance?.wfh_tracking?.is_wfh ? 'text-white px-3 py-2 rounded-pill shadow-sm mb-2' : 'text-dark px-3 py-2 rounded-pill shadow-sm mb-2') 
                    : 'text-muted px-3 py-2 rounded-pill border mb-2'}
                  style={{ fontSize: '0.85rem', fontWeight: 'bold' }}
                >
                  <CsLineIcons icon={isCheckedInToday(myStaffRecord) ? (myStaffRecord?.todayAttendance?.wfh_tracking?.is_wfh ? 'home' : 'clock') : 'close'} size={14} className="me-2" />
                  {isCheckedInToday(myStaffRecord) 
                    ? (myStaffRecord?.todayAttendance?.wfh_tracking?.is_wfh ? 'WFH Active' : 'Checked In') 
                    : 'Not Checked In Today'}
                </Badge>
                
                <div className="d-flex justify-content-end mb-3">
                  <div className="d-inline-flex rounded-pill p-1 shadow-sm" style={{ background: 'rgba(255,255,255,0.2)' }}>
                    <div 
                      className={`px-3 py-1 rounded-pill fw-bold ${!isWfh ? 'bg-white text-primary shadow-sm' : 'text-white'}`}
                      style={{ cursor: isRestrictedNetwork || isCheckedInToday(myStaffRecord) ? 'not-allowed' : 'pointer', opacity: isRestrictedNetwork ? 0.5 : 1, transition: 'all 0.2s' }}
                      onClick={() => { if (!isRestrictedNetwork && !isCheckedInToday(myStaffRecord)) setIsWfh(false); }}
                      title={isRestrictedNetwork ? "Not connected to Office Wi-Fi" : ""}
                    >
                      <CsLineIcons icon="building" size="14" className="me-1" /> Office
                    </div>
                    
                    <div 
                      className={`px-3 py-1 rounded-pill fw-bold ${isWfh ? 'bg-white text-primary shadow-sm' : 'text-white'}`}
                      style={{ cursor: isCheckedInToday(myStaffRecord) ? 'not-allowed' : 'pointer', transition: 'all 0.2s' }}
                      onClick={() => {
                        if (isCheckedInToday(myStaffRecord)) return;

                        // Check WFH Policy or permanent WFH
                        const isPermanentWFH = profileData?.attendance_method === 'wfh';
                        if (!isPermanentWFH) {
                          const todayStr = getTodayDate();
                          const todayTime = new Date(`${todayStr}T00:00:00`).getTime();
                          
                          const approvedRequest = leaveRequests.find(req => {
                            const isWfhType = req.leave_type_id === 'wfh' || req.leave_type_id === 'work_from_home' || req.leave_type_id?.toLowerCase() === 'wfh';
                            if (!isWfhType || req.status !== 'approved') return false;
                            
                            const fromTime = new Date(`${new Date(req.from_date).toISOString().split('T')[0]}T00:00:00`).getTime();
                            const toTime = new Date(`${new Date(req.to_date).toISOString().split('T')[0]}T00:00:00`).getTime();
                            
                            return todayTime >= fromTime && todayTime <= toTime;
                          });

                          if (!approvedRequest) {
                            setError("Access Denied: You do not have an approved Work From Home request for today. Please apply in the Leaves section first.");
                            setTimeout(() => setError(""), 6000);
                            return;
                          }
                        }

                        setIsWfh(true);
                      }}
                    >
                      <CsLineIcons icon="home" size="14" className="me-1" /> Home
                    </div>
                  </div>
                </div>

                <Button 
                  className={`btn-portal-primary border-0 text-white ${isCheckedInToday(myStaffRecord) ? 'bg-danger' : 'bg-success'}`}
                  onClick={() => {
                    const checkingIn = !isCheckedInToday(myStaffRecord);
                    if (checkingIn && isWfh) {
                      // Check WFH Policy or permanent WFH
                      const isPermanentWFH = profileData?.attendance_method === 'wfh';
                      if (!isPermanentWFH) {
                        const todayStr = getTodayDate();
                        const todayTime = new Date(`${todayStr}T00:00:00`).getTime();
                        
                        const approvedRequest = leaveRequests.find(req => {
                          const isWfhType = req.leave_type_id === 'wfh' || req.leave_type_id === 'work_from_home' || req.leave_type_id?.toLowerCase() === 'wfh';
                          if (!isWfhType || req.status !== 'approved') return false;
                          
                          const fromTime = new Date(`${new Date(req.from_date).toISOString().split('T')[0]}T00:00:00`).getTime();
                          const toTime = new Date(`${new Date(req.to_date).toISOString().split('T')[0]}T00:00:00`).getTime();
                          
                          return todayTime >= fromTime && todayTime <= toTime;
                        });

                        if (!approvedRequest) {
                          setError("Access Denied: You do not have an approved Work From Home request for today. Please apply in the Leaves section first.");
                          setTimeout(() => setError(""), 6000);
                          return;
                        }
                      }
                    }

                    setKioskActionType(checkingIn ? 'check-in' : 'check-out');
                    setShowCameraModal(true);
                  }}
                  disabled={!modelsLoaded}
                  style={{ borderRadius: '50px', fontWeight: 'bold', padding: '0.75rem 2rem' }}
                >
                  <CsLineIcons icon={isCheckedInToday(myStaffRecord) ? 'log-out' : 'log-in'} size={18} className="me-2" />
                  <span>
                    {isCheckedInToday(myStaffRecord)
                      ? "Check Out"
                      : (isWfh ? "Check In (WFH)" : "Check In (Office)")}
                  </span>
                </Button>
              </div>
            </Col>
          </Row>
        </div>
        
        {/* Render WFH Tracker conditionally */}
        {isCheckedInToday(myStaffRecord) && myStaffRecord?.todayAttendance?.wfh_tracking?.is_wfh && (
          <WfhTracker staffId={myStaffRecord._id} date={getTodayDate()} wfhConfig={userData?.wfh_config} />
        )}

        {successMsg && (
          <Alert variant={lateMinutes > 0 ? 'warning' : overtimeHours > 0 ? 'info' : 'success'} className="mb-4 rounded-3 border-0 shadow-sm" style={{ background: lateMinutes > 0 ? '#fff7ed' : overtimeHours > 0 ? '#f5f3ff' : '#f0fdf4', color: lateMinutes > 0 ? '#92400e' : overtimeHours > 0 ? '#4c1d95' : '#15803d' }} onClose={() => { setSuccessMsg(''); setLateMinutes(0); setOvertimeHours(0); }} dismissible>
            <div className="d-flex align-items-center flex-wrap gap-2">
              <span>{successMsg.split('🔴')[0].split('⚡')[0]}</span>
              {lateMinutes > 0 && (
                <span style={{ display: 'inline-flex', alignItems: 'center', padding: '0.25rem 0.75rem', borderRadius: '50px', fontSize: '0.8rem', fontWeight: 700, background: 'rgba(239,68,68,0.12)', color: '#dc2626', border: '1px solid rgba(239,68,68,0.25)' }}>
                  🔴 LATE by {lateMinutes} min
                </span>
              )}
              {overtimeHours > 0 && (
                <span style={{ display: 'inline-flex', alignItems: 'center', padding: '0.25rem 0.75rem', borderRadius: '50px', fontSize: '0.8rem', fontWeight: 700, background: 'rgba(109,40,217,0.12)', color: '#7c3aed', border: '1px solid rgba(109,40,217,0.25)' }}>
                  ⚡ OVERTIME {overtimeHours}h
                </span>
              )}
            </div>
          </Alert>
        )}

        <Tab.Container id="staffPortalTabs" defaultActiveKey="profile">
          <Row className="g-4">
            <Col xl={3}>
              <Card className="glass-card border-0 shadow-sm">
                <Card.Body className="p-4">
                  <div className="d-flex flex-column align-items-center text-center">
                    <div className="profile-photo-wrapper">
                      <div className="profile-photo-inner">
                        {!profileData.photo ? (
                          <div className="w-100 h-100 d-flex align-items-center justify-content-center bg-light text-muted">
                            <CsLineIcons icon="user" size="48" />
                          </div>
                        ) : (
                          <img
                            src={`${process.env.REACT_APP_UPLOAD_DIR}${profileData.photo}`}
                            alt="profile"
                          />
                        )}
                      </div>
                    </div>
                    <h4 className="fw-bold mb-1 text-dark">{profileData.f_name} {profileData.l_name}</h4>
                    <div className="badge bg-soft-primary text-primary px-3 py-2 rounded-pill mb-3" style={{ fontSize: '0.8rem', fontWeight: '700' }}>
                      {profileData.position}
                    </div>
                    <div className="text-muted small d-flex align-items-center gap-1 mb-4">
                      <CsLineIcons icon="pin" size={14} />
                      <span>{profileData.city}, {profileData.state}</span>
                    </div>
                  </div>

                  <Nav variant="pills" className="flex-column nav-pills-portal">
                    <Nav.Item>
                      <Nav.Link eventKey="profile">
                        <CsLineIcons icon="user" size="18" /> Personal Details
                      </Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                      <Nav.Link eventKey="assets">
                        <CsLineIcons icon="boxes" size="18" /> My Assets & Requests
                      </Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                      <Nav.Link eventKey="leaves">
                        <CsLineIcons icon="calendar" size="18" /> Leave Balances & Requests
                      </Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                      <Nav.Link eventKey="feedbacks">
                        <CsLineIcons icon="message" size="18" /> Feedback & Complaints
                      </Nav.Link>
                    </Nav.Item>
                  </Nav>
                </Card.Body>
              </Card>
            </Col>

            <Col xl={9}>
              <Tab.Content>
                {/* Profile Details Tab */}
                <Tab.Pane eventKey="profile">
                  <Card className="glass-card border-0 shadow-sm">
                    <Card.Body className="p-4">
                      <div className="d-flex align-items-center gap-2 mb-4 pb-2 border-bottom">
                        <div className="bg-soft-primary p-2 rounded-3">
                          <CsLineIcons icon="user" className="text-primary" size="20" />
                        </div>
                        <h5 className="fw-bold mb-0">Employment & Personal Information</h5>
                      </div>
                      
                      <Row className="g-4 mb-4">
                        <Col md={4}>
                          <div className="text-label">Staff ID</div>
                          <div className="text-value">#{profileData.staff_id}</div>
                        </Col>
                        <Col md={4}>
                          <div className="text-label">Position</div>
                          <div className="text-value">{profileData.position}</div>
                        </Col>
                        <Col md={4}>
                          <div className="text-label">Current Salary</div>
                          <div className="text-value text-primary">₹{profileData.salary?.toLocaleString('en-IN')}</div>
                        </Col>
                      </Row>

                      <Row className="g-4 mb-4">
                        <Col md={4}>
                          <div className="text-label">Joining Date</div>
                          <div className="text-value">{formatDate(profileData.joining_date)}</div>
                        </Col>
                        <Col md={4}>
                          <div className="text-label">Birth Date</div>
                          <div className="text-value">{formatDate(profileData.birth_date)}</div>
                        </Col>
                        <Col md={4}>
                          <div className="text-label">Phone Number</div>
                          <div className="text-value">{profileData.phone_no}</div>
                        </Col>
                      </Row>

                      <Row className="g-4 mb-4">
                        <Col md={4}>
                          <div className="text-label">Email Address</div>
                          <div className="text-value">{profileData.email}</div>
                        </Col>
                        <Col md={8}>
                          <div className="text-label">Residential Address</div>
                          <div className="text-value">{profileData.address}, {profileData.city}, {profileData.state}, {profileData.country} - {profileData.pincode}</div>
                        </Col>
                      </Row>

                      <Row className="g-4">
                        <Col md={4}>
                          <div className="text-label">Identity Document</div>
                          <div className="text-value">{profileData.document_type || '—'}</div>
                        </Col>
                        <Col md={8}>
                          <div className="text-label">Document Number</div>
                          <div className="text-value">{profileData.id_number || '—'}</div>
                        </Col>
                      </Row>

                      {/* Bank Details Block */}
                      <div className="mt-4 pt-4 border-top">
                        <div className="d-flex align-items-center gap-2 mb-4">
                          <div className="bg-soft-primary p-2 rounded-3">
                            <CsLineIcons icon="wallet" className="text-primary" size="20" />
                          </div>
                          <h5 className="fw-bold mb-0">Bank & Compliance Details</h5>
                        </div>
                        <Row className="g-4 mb-4">
                          <Col md={4}>
                            <div className="text-label">Account Number</div>
                            <div className="text-value">{profileData.bank_account_no || '—'}</div>
                          </Col>
                          <Col md={4}>
                            <div className="text-label">Bank Name</div>
                            <div className="text-value">{profileData.bank_name || '—'}</div>
                          </Col>
                          <Col md={4}>
                            <div className="text-label">Branch & IFSC</div>
                            <div className="text-value">
                              {profileData.bank_branch || '—'} {profileData.bank_ifsc ? `(${profileData.bank_ifsc})` : ''}
                            </div>
                          </Col>
                        </Row>
                        <Row className="g-4">
                          <Col md={4}>
                            <div className="text-label">PAN Card Number</div>
                            <div className="text-value">{profileData.pan_number || '—'}</div>
                          </Col>
                          <Col md={4}>
                            <div className="text-label">UAN Number</div>
                            <div className="text-value">{profileData.uan_number || '—'}</div>
                          </Col>
                        </Row>
                      </div>


                    </Card.Body>
                  </Card>
                </Tab.Pane>

                {/* Assets Tab */}
                <Tab.Pane eventKey="assets">
                  <div className="d-flex flex-column gap-4">
                    {/* Assigned Assets */}
                    <Card className="glass-card border-0 shadow-sm">
                      <Card.Body className="p-4">
                        <div className="d-flex flex-column align-items-start gap-3 mb-4 pb-2 border-bottom">
                          <div className="d-flex align-items-center gap-2">
                            <div className="bg-soft-primary p-2 rounded-3">
                              <CsLineIcons icon="boxes" className="text-primary" size="20" />
                            </div>
                            <h5 className="fw-bold mb-0">Assigned Assets</h5>
                          </div>
                          <Button 
                            className="btn-portal-primary align-self-start"
                            onClick={() => setShowAssetRequestModal(true)}
                          >
                            <CsLineIcons icon="plus" size={16} />
                            Request Asset
                          </Button>
                        </div>

                        {/* Desktop table */}
                        <div className="table-responsive d-none d-md-block">
                          <Table hover className="align-middle mb-0">
                            <thead>
                              <tr className="text-muted border-bottom" style={{ fontSize: '0.8rem' }}>
                                <th>Asset Name</th>
                                <th>Type</th>
                                <th>Serial Number</th>
                                <th>Assigned Date</th>
                                <th>Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {assignedAssets.length > 0 ? (
                                assignedAssets.map((asset) => (
                                  <tr key={asset._id} style={{ fontSize: '0.85rem' }}>
                                    <td className="fw-semibold text-dark">{asset.name}</td>
                                    <td>{asset.asset_type}</td>
                                    <td><code>{asset.serial_number || 'N/A'}</code></td>
                                    <td>{formatDate(asset.assigned_date)}</td>
                                    <td>{getPortalStatusBadge(asset.status)}</td>
                                  </tr>
                                ))
                              ) : (
                                <tr>
                                  <td colSpan="5" className="text-center py-4 text-muted">
                                    No assets currently assigned to you.
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </Table>
                        </div>

                        {/* Mobile card list */}
                        <div className="d-block d-md-none">
                          {assignedAssets.length > 0 ? (
                            assignedAssets.map((asset) => (
                              <div key={asset._id} className="card p-3 mb-3 border rounded-3 shadow-sm bg-white" style={{ border: '1px solid rgba(0,0,0,0.08) !important' }}>
                                <div className="d-flex justify-content-between align-items-start mb-2">
                                  <div>
                                    <h6 className="fw-bold mb-0 text-dark" style={{ fontSize: '0.95rem' }}>{asset.name}</h6>
                                    <small className="text-muted" style={{ fontSize: '0.75rem' }}>{asset.asset_type}</small>
                                  </div>
                                  <div>{getPortalStatusBadge(asset.status)}</div>
                                </div>
                                <div className="d-flex justify-content-between align-items-center mb-1" style={{ fontSize: '0.85rem' }}>
                                  <span className="text-muted">Serial No:</span>
                                  <code className="text-dark">{asset.serial_number || 'N/A'}</code>
                                </div>
                                <div className="d-flex justify-content-between align-items-center" style={{ fontSize: '0.85rem' }}>
                                  <span className="text-muted">Assigned On:</span>
                                  <span className="fw-semibold text-dark">{formatDate(asset.assigned_date)}</span>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-4 text-muted" style={{ fontSize: '0.9rem' }}>
                              No assets currently assigned to you.
                            </div>
                          )}
                        </div>
                      </Card.Body>
                    </Card>

                    {/* Asset Requests */}
                    <Card className="glass-card border-0 shadow-sm">
                      <Card.Body className="p-4">
                        <div className="d-flex align-items-center gap-2 mb-4 pb-2 border-bottom">
                          <div className="bg-soft-primary p-2 rounded-3">
                            <CsLineIcons icon="file-text" className="text-primary" size="20" />
                          </div>
                          <h5 className="fw-bold mb-0">Asset Requests History</h5>
                        </div>

                        {/* Desktop table */}
                        <div className="table-responsive d-none d-md-block">
                          <Table hover className="align-middle mb-0">
                            <thead>
                              <tr className="text-muted border-bottom" style={{ fontSize: '0.8rem' }}>
                                <th>Asset Name</th>
                                <th>Type</th>
                                <th>Reason</th>
                                <th>Requested On</th>
                                <th>Status</th>
                                <th>Admin Notes</th>
                              </tr>
                            </thead>
                            <tbody>
                              {assetRequests.length > 0 ? (
                                assetRequests.map((req) => (
                                  <tr key={req._id} style={{ fontSize: '0.85rem' }}>
                                    <td className="fw-semibold text-dark">{req.asset_name}</td>
                                    <td>{req.asset_type}</td>
                                    <td>{req.reason || '—'}</td>
                                    <td>{formatDate(req.createdAt)}</td>
                                    <td>{getPortalStatusBadge(req.status)}</td>
                                    <td>{req.notes || '—'}</td>
                                  </tr>
                                ))
                              ) : (
                                <tr>
                                  <td colSpan="6" className="text-center py-4 text-muted">
                                    No asset request history found.
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </Table>
                        </div>

                        {/* Mobile card list */}
                        <div className="d-block d-md-none">
                          {assetRequests.length > 0 ? (
                            assetRequests.map((req) => (
                              <div key={req._id} className="card p-3 mb-3 border rounded-3 shadow-sm bg-white" style={{ border: '1px solid rgba(0,0,0,0.08) !important' }}>
                                <div className="d-flex justify-content-between align-items-start mb-2">
                                  <div>
                                    <h6 className="fw-bold mb-0 text-dark" style={{ fontSize: '0.95rem' }}>{req.asset_name}</h6>
                                    <small className="text-muted" style={{ fontSize: '0.75rem' }}>{req.asset_type}</small>
                                  </div>
                                  <div>{getPortalStatusBadge(req.status)}</div>
                                </div>
                                <div className="d-flex justify-content-between align-items-center mb-1" style={{ fontSize: '0.85rem' }}>
                                  <span className="text-muted">Requested On:</span>
                                  <span className="fw-semibold text-dark">{formatDate(req.createdAt)}</span>
                                </div>
                                {req.reason && (
                                  <div className="mb-2" style={{ fontSize: '0.85rem' }}>
                                    <span className="text-muted d-block mb-1">Reason:</span>
                                    <p className="mb-0 text-dark p-2 bg-light rounded" style={{ fontSize: '0.8rem', lineHeight: '1.4' }}>{req.reason}</p>
                                  </div>
                                )}
                                {req.notes && (
                                  <div className="border-top pt-2 mt-2" style={{ fontSize: '0.8rem' }}>
                                    <span className="text-muted d-block mb-1">Admin Notes:</span>
                                    <p className="mb-0 text-dark fw-semibold" style={{ fontSize: '0.8rem' }}>{req.notes}</p>
                                  </div>
                                )}
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-4 text-muted" style={{ fontSize: '0.9rem' }}>
                              No asset request history found.
                            </div>
                          )}
                        </div>
                      </Card.Body>
                    </Card>
                  </div>
                </Tab.Pane>

                {/* Leaves Tab */}
                <Tab.Pane eventKey="leaves">
                  <div className="d-flex flex-column gap-4">
                    {/* Leave Balances */}
                    <Card className="glass-card border-0 shadow-sm">
                      <Card.Body className="p-4">
                        <div className="d-flex flex-column align-items-start gap-3 mb-4 pb-2 border-bottom">
                          <div className="d-flex align-items-center gap-2">
                            <div className="bg-soft-primary p-2 rounded-3">
                              <CsLineIcons icon="calendar" className="text-primary" size="20" />
                            </div>
                            <h5 className="fw-bold mb-0">Leave Balances ({new Date().getFullYear()})</h5>
                          </div>
                          <Button 
                            className="btn-portal-primary align-self-start"
                            onClick={() => setShowLeaveRequestModal(true)}
                          >
                            <CsLineIcons icon="plus" size={16} />
                            Apply for Leave
                          </Button>
                        </div>

                        <Row className="g-3">
                          {leaveBalances.length > 0 ? (
                            leaveBalances.map((bal) => (
                              <Col md={4} sm={6} key={bal.leave_type_id}>
                                <div className="balance-card">
                                  <div className="text-label mb-2">{getLeaveTypeLabel(bal.leave_type_id)}</div>
                                  <Row className="g-2 mb-2">
                                    <Col xs={6} sm={3}>
                                      <div className="text-muted small" style={{ fontSize: '0.72rem' }}>Entitled</div>
                                      <div className="fw-bold text-dark" style={{ fontSize: '1.05rem' }}>{bal.entitled}</div>
                                    </Col>
                                    <Col xs={6} sm={3}>
                                      <div className="text-muted small" style={{ fontSize: '0.72rem' }}>Taken</div>
                                      <div className="fw-bold text-success" style={{ fontSize: '1.05rem' }}>{bal.taken}</div>
                                    </Col>
                                    <Col xs={6} sm={3}>
                                      <div className="text-muted small" style={{ fontSize: '0.72rem' }}>Pending</div>
                                      <div className="fw-bold text-warning" style={{ fontSize: '1.05rem' }}>{bal.pending}</div>
                                    </Col>
                                    <Col xs={6} sm={3}>
                                      <div className="text-muted small" style={{ fontSize: '0.72rem' }}>Remaining</div>
                                      <div className="fw-bold text-primary" style={{ fontSize: '1.05rem' }}>
                                        {(bal.entitled || 0) + (bal.carried_forward || 0) - (bal.taken || 0) - (bal.pending || 0)}
                                      </div>
                                    </Col>
                                  </Row>
                                  <div className="border-top pt-2 mt-2" style={{ fontSize: '0.75rem' }}>
                                    <span className="text-muted fw-semibold">
                                      {getCarryForwardText(bal.leave_type_id)}
                                    </span>
                                  </div>
                                </div>
                              </Col>
                            ))
                          ) : (
                            <Col xs={12}>
                              <div className="text-center py-3 text-muted">
                                No leave balances initialized for this year.
                              </div>
                            </Col>
                          )}
                        </Row>
                      </Card.Body>
                    </Card>
 
                    {/* Leave Requests */}
                    <Card className="glass-card border-0 shadow-sm">
                      <Card.Body className="p-4">
                        <div className="d-flex align-items-center gap-2 mb-4 pb-2 border-bottom">
                          <div className="bg-soft-primary p-2 rounded-3">
                            <CsLineIcons icon="file-text" className="text-primary" size="20" />
                          </div>
                          <h5 className="fw-bold mb-0">Leave Requests History</h5>
                        </div>
 
                        <div className="table-responsive d-none d-md-block">
                          <Table hover className="align-middle mb-0">
                            <thead>
                              <tr className="text-muted border-bottom" style={{ fontSize: '0.8rem' }}>
                                <th>Leave Type</th>
                                <th>Duration</th>
                                <th>Days</th>
                                <th>Reason</th>
                                <th>Status</th>
                                <th>Approved/Rejected By</th>
                              </tr>
                            </thead>
                            <tbody>
                              {leaveRequests.length > 0 ? (
                                leaveRequests.map((req) => (
                                  <tr key={req._id} style={{ fontSize: '0.85rem' }}>
                                    <td className="fw-semibold text-dark">{getLeaveTypeLabel(req.leave_type_id)}</td>
                                    <td>
                                      {formatDate(req.from_date)} <span className="text-muted mx-1">to</span> {formatDate(req.to_date)}
                                      {req.is_half_day && <Badge bg="light" className="text-dark ms-2">Half Day ({req.half_day_session === 'first_half' ? 'First Half' : 'Second Half'})</Badge>}
                                    </td>
                                    <td className="fw-bold">{req.days}</td>
                                    <td>{req.reason || '—'}</td>
                                    <td>{getPortalStatusBadge(req.status)}</td>
                                    <td>
                                      {req.approved_by ? (
                                        <div>
                                          <span className="fw-semibold">{req.approved_by}</span>
                                          <span className="text-muted d-block small">on {formatDate(req.approved_on)}</span>
                                        </div>
                                      ) : (
                                        <span className="text-muted">—</span>
                                      )}
                                    </td>
                                  </tr>
                                ))
                              ) : (
                                <tr>
                                  <td colSpan="6" className="text-center py-4 text-muted">
                                    No leave request history found.
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </Table>
                        </div>

                        {/* Mobile view card list */}
                        <div className="d-block d-md-none">
                          {leaveRequests.length > 0 ? (
                            leaveRequests.map((req) => (
                              <div key={req._id} className="card p-3 mb-3 border rounded-3 shadow-sm bg-white" style={{ border: '1px solid rgba(0,0,0,0.08) !important' }}>
                                <div className="d-flex justify-content-between align-items-start mb-2">
                                  <div>
                                    <h6 className="fw-bold mb-0 text-dark" style={{ fontSize: '0.95rem' }}>{getLeaveTypeLabel(req.leave_type_id)}</h6>
                                    <small className="text-muted" style={{ fontSize: '0.75rem' }}>{formatDate(req.from_date)} to {formatDate(req.to_date)}</small>
                                  </div>
                                  <div>
                                    {getPortalStatusBadge(req.status)}
                                  </div>
                                </div>
                                <div className="d-flex justify-content-between align-items-center mb-2" style={{ fontSize: '0.85rem' }}>
                                  <span className="text-muted">Duration:</span>
                                  <span className="fw-bold text-dark">{req.days} {req.days === 1 ? 'Day' : 'Days'} {req.is_half_day && '(Half Day)'}</span>
                                </div>
                                <div className="mb-2" style={{ fontSize: '0.85rem' }}>
                                  <span className="text-muted d-block mb-1">Reason:</span>
                                  <p className="mb-0 text-dark p-2 bg-light rounded" style={{ fontSize: '0.8rem', lineHeight: '1.4' }}>{req.reason || '—'}</p>
                                </div>
                                {req.approved_by && (
                                  <div className="border-top pt-2 mt-2" style={{ fontSize: '0.8rem' }}>
                                    <span className="text-muted d-block">Decision by {req.approved_by}:</span>
                                    <span className="text-dark fw-bold">on {formatDate(req.approved_on)}</span>
                                    {req.rejection_reason && (
                                      <p className="mb-0 text-danger mt-1 small">Reason: {req.rejection_reason}</p>
                                    )}
                                  </div>
                                )}
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-4 text-muted" style={{ fontSize: '0.9rem' }}>
                              No leave request history found.
                            </div>
                          )}
                        </div>
                      </Card.Body>
                    </Card>
                  </div>
                </Tab.Pane>

                {/* Feedback & Complaints Tab */}
                <Tab.Pane eventKey="feedbacks">
                  <Row className="g-4">
                    {/* Submit Section */}
                    <Col lg={4}>
                      <Card className="glass-card border-0 shadow-sm">
                        <Card.Body className="p-4">
                          <h5 className="fw-bold mb-3 text-dark d-flex align-items-center">
                            <CsLineIcons icon="message" className="text-primary me-2" size="20" />
                            <span>Submit Feedback / Complaint</span>
                          </h5>
                          <p className="text-muted small mb-4">
                            Your voice matters. Share suggestions, report issues, or register complaints directly to the HR department.
                          </p>
                          <Form onSubmit={handleFeedbackSubmit}>
                            <Form.Group className="mb-3">
                              <Form.Label className="small text-muted fw-bold text-uppercase">Type</Form.Label>
                              <CreatableSelect
                                isClearable
                                options={feedbackTypes}
                                value={feedbackForm.type ? { label: feedbackTypes.find(t => t.value === feedbackForm.type)?.label || feedbackForm.type, value: feedbackForm.type } : null}
                                onChange={(selected) => {
                                  if (selected) {
                                    setFeedbackForm({...feedbackForm, type: selected.value});
                                    if (!feedbackTypes.some(t => t.value === selected.value)) {
                                      setFeedbackTypes(prev => [...prev, { label: selected.label, value: selected.value }]);
                                    }
                                  } else {
                                    setFeedbackForm({...feedbackForm, type: ''});
                                  }
                                }}
                                placeholder="Select or type custom type..."
                              />
                            </Form.Group>

                            <Form.Group className="mb-3">
                              <Form.Label className="small text-muted fw-bold text-uppercase">Subject / Title</Form.Label>
                              <Form.Control 
                                type="text"
                                required
                                placeholder="E.g. Office AC repair, Payroll queries"
                                style={{ height: '40px', borderRadius: '8px' }}
                                value={feedbackForm.title}
                                onChange={(e) => setFeedbackForm({...feedbackForm, title: e.target.value})}
                              />
                            </Form.Group>

                            <Form.Group className="mb-3">
                              <Form.Label className="small text-muted fw-bold text-uppercase">Details & Context</Form.Label>
                              <Form.Control 
                                as="textarea"
                                rows={5}
                                required
                                placeholder="Provide comprehensive details here..."
                                style={{ borderRadius: '8px', fontSize: '0.9rem' }}
                                value={feedbackForm.description}
                                onChange={(e) => setFeedbackForm({...feedbackForm, description: e.target.value})}
                              />
                            </Form.Group>



                            <Button 
                              variant="primary" 
                              type="submit" 
                              className="w-100 rounded-pill py-2 fw-bold"
                              disabled={submitLoading}
                            >
                              {submitLoading ? 'Submitting...' : 'Submit to HR'}
                            </Button>
                          </Form>
                        </Card.Body>
                      </Card>

                      <Card className="glass-card border-0 shadow-sm mt-4">
                        <Card.Body className="p-4">
                          <div className="d-flex justify-content-between align-items-center mb-3">
                            <h5 className="fw-bold mb-0 text-danger d-flex align-items-center">
                              <CsLineIcons icon="warning-hexagon" size="18" className="me-2" /> Resignation
                            </h5>
                          </div>
                          {profileData.resignation?.status && profileData.resignation.status !== 'none' ? (
                            <div className="bg-light p-3 rounded-3 border">
                              <div className="d-flex justify-content-between align-items-center mb-3">
                                <span className="fw-semibold small text-muted">Resignation Status:</span>
                                {getPortalStatusBadge(profileData.resignation.status)}
                              </div>
                              <Row className="g-3 small text-dark">
                                <Col xs={6}>
                                  <div className="text-muted mb-1" style={{ fontSize: '0.75rem' }}>Submitted On</div>
                                  <div className="fw-bold">{formatDate(profileData.resignation.submitted_on)}</div>
                                </Col>
                                <Col xs={6}>
                                  <div className="text-muted mb-1" style={{ fontSize: '0.75rem' }}>Notice Period</div>
                                  <div className="fw-bold">{profileData.resignation.notice_period_days} Days</div>
                                </Col>
                                {profileData.resignation.status === 'approved' && profileData.resignation.last_working_day && (
                                  <Col xs={12}>
                                    <div className="text-muted mb-1" style={{ fontSize: '0.75rem' }}>Last Working Day</div>
                                    <div className="fw-bold text-danger">{formatDate(profileData.resignation.last_working_day)}</div>
                                  </Col>
                                )}
                              </Row>
                            </div>
                          ) : (
                            <div className="bg-soft-danger p-3 rounded-3 text-center border" style={{ borderColor: 'rgba(239, 68, 68, 0.2)' }}>
                              <p className="text-muted small mb-3">If you wish to resign from your position, you can submit a formal resignation request here. It will be sent to HR for approval.</p>
                              <Button variant="danger" className="w-100 rounded-pill py-2 fw-bold" onClick={() => setShowResignationModal(true)}>
                                Submit Resignation
                              </Button>
                            </div>
                          )}
                        </Card.Body>
                      </Card>
                    </Col>

                    {/* History Section */}
                    <Col lg={8}>
                      <Card className="glass-card border-0 shadow-sm">
                        <Card.Body className="p-4">
                          <h5 className="fw-bold mb-4 text-dark d-flex align-items-center">
                            <CsLineIcons icon="file-text" className="text-primary me-2" size="20" />
                            <span>My Feedback & Complaint History</span>
                          </h5>

                          {feedbacksList.length === 0 ? (
                            <div className="text-center py-5 text-muted">
                              <CsLineIcons icon="message" size="36" className="text-muted mb-2" />
                              <p className="mb-0 small">No feedbacks or complaints submitted yet.</p>
                            </div>
                          ) : (
                            <div className="feedback-scroll-container" style={{ maxHeight: '68vh', overflowY: 'auto', paddingRight: '0.5rem' }}>
                              {feedbacksList.map((item) => (
                                <div 
                                  key={item._id} 
                                  className="p-3 mb-3 border rounded-3 bg-white"
                                  style={{ borderLeft: `4px solid ${item.type === 'complaint' ? '#ef4444' : '#1ea8e7'} !important` }}
                                >
                                  <div className="d-flex justify-content-between align-items-start mb-2">
                                    <div>
                                      <span className="badge bg-light text-dark text-capitalize me-2 mb-1" style={{ fontSize: '0.7rem' }}>
                                        {item.type}
                                      </span>

                                      <h6 className="fw-bold text-dark mb-0 mt-1">{item.title}</h6>
                                    </div>
                                    <Badge 
                                      bg={item.status === 'resolved' ? 'success' : item.status === 'reviewed' ? 'info' : 'warning'}
                                      className="status-badge text-white"
                                    >
                                      {item.status}
                                    </Badge>
                                  </div>
                                  <p className="text-muted small mb-2" style={{ whiteSpace: 'pre-wrap', lineHeight: '1.4' }}>
                                    {item.description}
                                  </p>
                                  <div className="text-muted small mb-3" style={{ fontSize: '0.75rem' }}>
                                    Submitted on: {formatDate(item.createdAt)}
                                  </div>

                                  {/* HR Reply Box */}
                                  {item.hr_reply ? (
                                    <div className="bg-light p-3 rounded-3 border-start border-primary border-3 mt-2">
                                      <div className="d-flex justify-content-between align-items-center mb-1">
                                        <span className="fw-bold text-primary small">Response from HR ({item.replied_by || 'HR Department'})</span>
                                        <span className="text-muted small" style={{ fontSize: '0.7rem' }}>{formatDate(item.replied_at)}</span>
                                      </div>
                                      <p className="mb-0 text-dark small" style={{ whiteSpace: 'pre-wrap', lineHeight: '1.4' }}>
                                        {item.hr_reply}
                                      </p>
                                    </div>
                                  ) : (
                                    <div className="text-muted small bg-light p-2 rounded-3 text-center" style={{ fontSize: '0.75rem' }}>
                                      ⏳ Pending review and reply from HR department.
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>
                </Tab.Pane>
              </Tab.Content>
            </Col>
          </Row>
        </Tab.Container>

        {/* Modal: Request Asset */}
        <Modal show={showAssetRequestModal} onHide={() => setShowAssetRequestModal(false)} centered>
          <Modal.Header closeButton>
            <Modal.Title className="fw-bold">Request New Asset</Modal.Title>
          </Modal.Header>
          <Form onSubmit={handleAssetRequestSubmit}>
            <Modal.Body>
              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold">Asset Name *</Form.Label>
                <Form.Control
                  type="text"
                  required
                  placeholder="e.g. MacBook Pro, Logitech Mouse"
                  value={assetReqForm.asset_name}
                  onChange={(e) => setAssetReqForm({ ...assetReqForm, asset_name: e.target.value })}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold">Asset Type</Form.Label>
                <Form.Select
                  value={assetReqForm.asset_type}
                  onChange={(e) => setAssetReqForm({ ...assetReqForm, asset_type: e.target.value })}
                >
                  {['Laptop / PC', 'Mobile Phone', 'Keyboard', 'Mouse', 'Headset / Audio', 'Uniform', 'Access Card', 'Furniture', 'Other'].map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </Form.Select>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold">Reason for Request</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  placeholder="Brief reason for requiring this asset..."
                  value={assetReqForm.reason}
                  onChange={(e) => setAssetReqForm({ ...assetReqForm, reason: e.target.value })}
                />
              </Form.Group>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="light" onClick={() => setShowAssetRequestModal(false)} style={{ borderRadius: '50px' }}>Cancel</Button>
              <Button variant="primary" type="submit" disabled={submitLoading} style={{ borderRadius: '50px' }}>
                {submitLoading ? 'Submitting...' : 'Submit Request'}
              </Button>
            </Modal.Footer>
          </Form>
        </Modal>

        {/* Modal: Resignation */}
        <Modal show={showResignationModal} onHide={() => setShowResignationModal(false)} centered backdrop="static" size="md">
          <Modal.Header closeButton className="border-0 pb-0">
            <Modal.Title className="fw-bold text-danger d-flex align-items-center">
              <CsLineIcons icon="warning-hexagon" className="text-danger me-2" size="24" />
              <span>Initiate Formal Resignation</span>
            </Modal.Title>
          </Modal.Header>
          <Form onSubmit={handleResignationSubmit}>
            <Modal.Body className="px-4 py-3">
              <Alert variant="danger" className="mb-4 border-0 shadow-sm rounded-3 p-3" style={{ background: '#fef2f2', color: '#991b1b' }}>
                <div className="fw-bold mb-1">⚠️ CRITICAL WARNING: Permanent Employment Exit</div>
                <div className="small">
                  This action starts your formal separation from the organization. Once submitted, your notice period of <strong>{profileData?.resignation?.notice_period_days || 30} days</strong> will begin pending HR department review.
                </div>
              </Alert>

              {/* Error messages if any */}
              {error && <Alert variant="danger" className="py-2 px-3 border-0 small rounded-3 mb-3">{error}</Alert>}

              {/* Category Dropdown */}
              <Form.Group className="mb-3">
                <Form.Label className="fw-bold text-dark small text-uppercase">Resignation Category</Form.Label>
                <CreatableSelect
                  isClearable
                  options={resignationCategories}
                  value={resignationCategory ? { label: resignationCategory, value: resignationCategory } : null}
                  onChange={(selected) => {
                    if (selected) {
                      setResignationCategory(selected.value);
                      if (!resignationCategories.some(cat => cat.value === selected.value)) {
                        setResignationCategories(prev => [...prev, { label: selected.label, value: selected.value }]);
                      }
                    } else {
                      setResignationCategory('');
                    }
                  }}
                  placeholder="Select or type custom category..."
                />
              </Form.Group>

              {/* Detailed Reason Explanation */}
              <Form.Group className="mb-3">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <Form.Label className="fw-bold text-dark small text-uppercase mb-0">Formal Separation Letter / Explanation</Form.Label>
                  <span className={`small fw-bold ${resignationReason.length >= 150 ? 'text-success' : 'text-danger'}`}>
                    {resignationReason.length} / 150 min chars
                  </span>
                </div>
                <Form.Control
                  as="textarea"
                  rows={4}
                  required
                  placeholder="Please write a detailed explanation of your resignation here..."
                  style={{ borderRadius: '8px', fontSize: '0.9rem' }}
                  value={resignationReason}
                  onChange={(e) => setResignationReason(e.target.value)}
                />
              </Form.Group>

              {/* Explicit Checkboxes */}
              <Form.Group className="mb-2">
                <Form.Check 
                  type="checkbox"
                  id="ack-notice"
                  className="small text-muted fw-medium"
                  label={`I acknowledge and agree to serve my official notice period of ${profileData?.resignation?.notice_period_days || 30} days.`}
                  checked={resignationAck1}
                  onChange={(e) => setResignationAck1(e.target.checked)}
                />
              </Form.Group>
              <Form.Group className="mb-4">
                <Form.Check 
                  type="checkbox"
                  id="ack-final"
                  className="small text-muted fw-medium"
                  label="I understand that this resignation request cannot be canceled once approved by HR."
                  checked={resignationAck2}
                  onChange={(e) => setResignationAck2(e.target.checked)}
                />
              </Form.Group>

              {/* Signature Verification */}
              <Form.Group className="p-3 bg-light rounded-3 border">
                <Form.Label className="fw-bold text-dark small text-uppercase mb-1">Electronic Signature Verification</Form.Label>
                <div className="text-muted small mb-2">
                  To confirm, type your full name exactly as registered: <strong>{profileData?.f_name} {profileData?.l_name}</strong>
                </div>
                <Form.Control 
                  type="text" 
                  required
                  placeholder={`Type "${profileData?.f_name} ${profileData?.l_name}" to sign`}
                  style={{ height: '40px', borderRadius: '8px' }}
                  value={resignationSignature}
                  onChange={(e) => setResignationSignature(e.target.value)}
                />
              </Form.Group>
            </Modal.Body>
            <Modal.Footer className="justify-content-center border-top-0 pt-0 pb-4">
              <Button variant="light" className="rounded-pill px-4" onClick={() => setShowResignationModal(false)}>Cancel</Button>
              <Button 
                variant="danger" 
                type="submit" 
                className="rounded-pill px-4 shadow-sm" 
                disabled={submitLoading || resignationReason.length < 150 || !resignationAck1 || !resignationAck2 || resignationSignature !== `${profileData?.f_name} ${profileData?.l_name}`}
              >
                {submitLoading ? 'Submitting Exit Request...' : 'Submit Final Resignation'}
              </Button>
            </Modal.Footer>
          </Form>
        </Modal>

        {/* Modal: Apply for Leave */}
        <Modal show={showLeaveRequestModal} onHide={() => setShowLeaveRequestModal(false)} centered>
          <Modal.Header closeButton>
            <Modal.Title className="fw-bold">Apply for Leave</Modal.Title>
          </Modal.Header>
          <Form onSubmit={handleLeaveRequestSubmit}>
            <Modal.Body>
              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold">Leave Type *</Form.Label>
                <Form.Select
                  required
                  value={leaveReqForm.leave_type_id}
                  onChange={(e) => setLeaveReqForm({ ...leaveReqForm, leave_type_id: e.target.value })}
                >
                  <option value="">-- Select Leave Type --</option>
                  {leavePolicy?.leave_types?.map(lt => (
                    <option key={lt.leave_type_id} value={lt.leave_type_id}>{getLeaveTypeLabel(lt.leave_type_id)}</option>
                  ))}
                </Form.Select>
              </Form.Group>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold">From Date *</Form.Label>
                    <Form.Control
                      type="date"
                      required
                      value={leaveReqForm.from_date}
                      onChange={(e) => setLeaveReqForm({ ...leaveReqForm, from_date: e.target.value })}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold">To Date *</Form.Label>
                    <Form.Control
                      type="date"
                      required
                      disabled={leaveReqForm.is_half_day}
                      value={leaveReqForm.is_half_day ? leaveReqForm.from_date : leaveReqForm.to_date}
                      onChange={(e) => setLeaveReqForm({ ...leaveReqForm, to_date: e.target.value })}
                    />
                  </Form.Group>
                </Col>
              </Row>
              <Form.Group className="mb-3 d-flex align-items-center gap-2">
                <Form.Check
                  type="checkbox"
                  id="halfDayCheckbox"
                  label="Apply as Half Day"
                  checked={leaveReqForm.is_half_day}
                  onChange={(e) => {
                    const isChecked = e.target.checked;
                    setLeaveReqForm(f => ({
                      ...f,
                      is_half_day: isChecked,
                      to_date: isChecked ? f.from_date : f.to_date
                    }));
                  }}
                />
              </Form.Group>
              {leaveReqForm.is_half_day && (
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold">Half Day Session</Form.Label>
                  <Form.Select
                    value={leaveReqForm.half_day_session}
                    onChange={(e) => setLeaveReqForm({ ...leaveReqForm, half_day_session: e.target.value })}
                  >
                    <option value="first_half">First Half (Morning)</option>
                    <option value="second_half">Second Half (Afternoon)</option>
                  </Form.Select>
                </Form.Group>
              )}
              <div className="mb-3 bg-light p-3 rounded border text-center">
                <span className="text-muted small">Total Days Applied:</span>
                <span className="d-block fw-bold text-primary" style={{ fontSize: '1.25rem' }}>
                  {calculateLeaveDays(leaveReqForm.from_date, leaveReqForm.is_half_day ? leaveReqForm.from_date : leaveReqForm.to_date, leaveReqForm.is_half_day)} Days
                </span>
              </div>
              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold">Reason for Leave *</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  required
                  placeholder="Reason for requesting leave..."
                  value={leaveReqForm.reason}
                  onChange={(e) => setLeaveReqForm({ ...leaveReqForm, reason: e.target.value })}
                />
              </Form.Group>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="light" onClick={() => setShowLeaveRequestModal(false)} style={{ borderRadius: '50px' }}>Cancel</Button>
              <Button variant="primary" type="submit" disabled={submitLoading} style={{ borderRadius: '50px' }}>
                {submitLoading ? 'Applying...' : 'Apply Leave'}
              </Button>
            </Modal.Footer>
          </Form>
        </Modal>
      </div>
    );
  };

  const renderKioskPortal = () => {
    return (
      <div className="d-flex flex-column w-100">
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
            <p className="text-white-50 fw-bold mb-0 position-relative z-index-2 letter-spacing-1">EMPLOYEE PANEL</p>
          </div>

          <div className="kiosk-action-area">
            {successMsg && (
            <Alert variant="success" className="mb-4 text-center rounded-3 fw-bold border-0" style={{ maxWidth: '600px', margin: '0 auto', background: '#f0fdf4', color: '#15803d' }} onClose={() => setSuccessMsg('')} dismissible>
              {successMsg}
            </Alert>
          )}

            <div className="py-3">
              <div className="mb-5 text-muted">
                <CsLineIcons icon="scan" size={54} className="text-primary opacity-50 mb-4" />
                <h4 className="fw-bold text-dark mb-2">Facial Recognition System</h4>
                <p className="mb-0 mx-auto" style={{ maxWidth: '350px' }}>
                  Please align your face in front of the camera to automatically identify and check in/out.
                </p>
              </div>

              <div className="scan-btn-container">
                {!modelsLoaded && !isRestrictedNetwork && <div className="pulse-ring" />}
                
                {isRestrictedNetwork ? (
                  <Alert variant="danger" className="text-center rounded-3 fw-bold border-0 mb-0 shadow-sm" style={{ background: '#fef2f2', color: '#991b1b' }}>
                    <CsLineIcons icon="wifi" size={24} className="mb-2 d-block mx-auto text-danger" />
                    Network Restricted
                    <div className="fw-normal mt-1" style={{ fontSize: '0.85rem' }}>
                      You are not connected to the allowed office Wi-Fi network. Attendance actions are disabled.
                    </div>
                  </Alert>
                ) : (
                  <div className="d-flex justify-content-center gap-4">
                    <Button 
                      className="scan-btn bg-success text-white border-0 px-4 py-3" 
                      style={{ borderRadius: '50px', fontWeight: 'bold', minWidth: '160px' }}
                      onClick={() => {
                        setKioskActionType('check-in');
                        setShowCameraModal(true);
                      }} 
                      disabled={!modelsLoaded}
                    >
                      <CsLineIcons icon="log-in" size={20} className="me-2" />
                      {modelsLoaded ? 'Check In' : 'Loading...'}
                    </Button>
                    <Button 
                      className="scan-btn bg-danger text-white border-0 px-4 py-3" 
                      style={{ borderRadius: '50px', fontWeight: 'bold', minWidth: '160px' }}
                      onClick={() => {
                        setKioskActionType('check-out');
                        setShowCameraModal(true);
                      }} 
                      disabled={!modelsLoaded}
                    >
                      <CsLineIcons icon="log-out" size={20} className="me-2" />
                      {modelsLoaded ? 'Check Out' : 'Loading...'}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="bg-light p-3 text-center border-top">
            <small className="text-muted fw-bold" style={{ fontSize: '0.75rem', letterSpacing: '0.05em' }}>
              <CsLineIcons icon="shield" size={14} className="me-1 text-primary" /> 
              SECURE AI VERIFICATION
            </small>
          </div>
        </Card>
      </div>
      
      {currentUser?.role === 'admin' && (
        <div className="container pb-5">
          <Card className="kiosk-card text-start shadow-sm mx-auto mb-5" style={{ padding: '2rem', maxWidth: '850px' }}>
            <h5 className="fw-bold mb-4 d-flex align-items-center gap-2">
              <CsLineIcons icon="edit" className="text-primary" size="24" />
              Pending Regularization Requests
            </h5>
            
            {successMsg && (
              <Alert variant="success" className="py-2 px-3 mb-4 rounded-3 d-flex align-items-center gap-2" style={{ fontSize: '0.88rem' }}>
                <CsLineIcons icon="check-circle" size="18" /> {successMsg}
              </Alert>
            )}

            <div className="table-responsive">
              <table className="table table-hover align-middle border">
                <thead className="bg-light">
                  <tr>
                    <th>Staff</th>
                    <th>Date</th>
                    <th>Corrected In</th>
                    <th>Corrected Out</th>
                    <th>Reason</th>
                    <th>Status</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {regularizationRequests.length === 0 ? (
                    <tr><td colSpan="7" className="text-center py-4 text-muted">No pending regularization requests</td></tr>
                  ) : regularizationRequests.map(req => (
                    <tr key={req.id}>
                      <td>
                        <div className="fw-bold">{req.f_name} {req.l_name}</div>
                        <div className="small text-muted">#{req.staff_id}</div>
                      </td>
                      <td>{format(new Date(req.date), 'dd/MM/yyyy')}</td>
                      <td>{req.in_time || '—'}</td>
                      <td>{req.out_time || '—'}</td>
                      <td style={{ maxWidth: '200px' }} className="text-truncate" title={req.reason}>{req.reason}</td>
                      <td>
                        <Badge bg={req.status === 'Pending' ? 'warning' : req.status === 'Approved' ? 'success' : 'danger'}>
                          {req.status}
                        </Badge>
                      </td>
                      <td className="text-end">
                        {req.status === 'Pending' && (
                          <div className="d-flex justify-content-end gap-2">
                            <Button size="sm" variant="success" className="d-flex align-items-center gap-1" onClick={() => handleApproveReg(req.id)}>
                              <CsLineIcons icon="check" size="14" />
                            </Button>
                            <Button size="sm" variant="danger" className="d-flex align-items-center gap-1" onClick={() => handleRejectReg(req.id)}>
                              <CsLineIcons icon="close" size="14" />
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
      </div>
    );
  };

  return (
    <>
      <HtmlHead title={title} description={description} />
      <style>{customStyles}</style>

      {currentUser?.role === 'staff' ? renderStaffPortal() : renderKioskPortal()}

      {/* Match Confirmation Modal (Used for both flows) */}
      <Modal show={!!detectedStaff} onHide={() => { setDetectedStaff(null); setLateMinutes(0); setOvertimeHours(0); }} centered>
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold">Confirm Attendance</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          {detectedStaff && (
            <div className="text-center">
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

              <div className="d-flex justify-content-center gap-3">
                {isCheckedInToday(detectedStaff) ? (
                  <Button className="action-btn btn-check-out w-100" onClick={() => handleCheckOut(detectedStaff._id)}>
                    <CsLineIcons icon="log-out" size={20} />
                    Confirm Check-Out
                  </Button>
                ) : (
                  <Button className="action-btn btn-check-in w-100" onClick={() => handleCheckIn(detectedStaff._id)}>
                    <CsLineIcons icon="log-in" size={20} />
                    Confirm Check-In
                  </Button>
                )}
              </div>
            </div>
          )}
        </Modal.Body>
      </Modal>

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
        <Modal.Body className="p-4 d-flex flex-column align-items-center bg-white">
          <div className="mb-4 text-center">
            <span
              className="badge bg-soft-primary text-primary px-3 py-2 rounded-pill fw-bold text-uppercase mb-2"
              style={{ letterSpacing: '0.05em', fontSize: '0.75rem' }}
            >
              AI Face Scanner
            </span>
            <h4 className="fw-bold mt-1 text-dark">Scan to Check-In/Out</h4>
            <p className="text-muted small mt-1 px-3 mb-0">Position yourself in front of the camera to verify your face</p>
          </div>

          {error && (
            <Alert variant="danger" className="w-100 mb-4 text-center rounded-3 fw-bold border-0" style={{ maxWidth: '580px', background: '#fff1f2', color: '#e11d48' }} onClose={() => setError('')} dismissible>
              <CsLineIcons icon="error-hexagon" className="me-2" />
              {error}
            </Alert>
          )}
          <div className="webcam-container" style={{ width: '100%', maxWidth: '580px' }}>
            {/* Absolutely Positioned Brand Overlay inside the scanner */}
            <div className="position-absolute" style={{ top: '15px', left: '15px', zIndex: 10 }}>
              {userData?.logo ? (
                <img
                  src={process.env.REACT_APP_UPLOAD_DIR + userData.logo}
                  alt={userData?.name || 'Company Logo'}
                  style={{ maxHeight: '35px', objectFit: 'contain', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }}
                />
              ) : (
                <div className="kiosk-brand-logo-overlay" style={{ fontSize: '1rem', fontWeight: 900, color: '#fff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', letterSpacing: '0.05em' }}>
                  THE <span style={{ color: '#23b3f4' }}>BOX</span>
                </div>
              )}
            </div>
            <Webcam
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              videoConstraints={{ facingMode: 'user', aspectRatio: 16 / 9 }}
              style={{
                width: '100%',
                height: 'auto',
                objectFit: 'cover',
                aspectRatio: '16/9',
                display: 'block',
                transform: 'scaleX(-1)'
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
                transform: 'scaleX(-1)'
              }}
            />
            {showCameraModal && (
              <>
                <div className="scanner-overlay" />
                <div className="camera-status-text">
                  {detecting ? 'SCANNING FACE...' : 'STAND IN FRONT OF CAMERA'}
                </div>
              </>
            )}
          </div>

          <div style={{ minHeight: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '20px' }} className="w-100">
            {detecting ? (
              <div className="d-flex align-items-center justify-content-center gap-2 p-3 rounded-3 bg-soft-primary text-primary fw-bold w-100" style={{ maxWidth: '580px' }}>
                <Spinner animation="border" size="sm" className="text-primary" />
                <span className="text-uppercase" style={{ letterSpacing: '0.05em', fontSize: '0.85rem' }}>
                  {livenessStatus} ({livenessProgress}%)
                </span>
              </div>
            ) : (
              <div className="p-3 rounded-3 bg-soft-secondary text-muted fw-bold w-100 text-center" style={{ maxWidth: '580px', backgroundColor: '#f1f5f9', color: '#64748b' }}>
                <CsLineIcons icon="camera" className="me-2" size="18" />
                <span>Camera ready. Preparing automatic face scan...</span>
              </div>
            )}
          </div>
        </Modal.Body>
      </Modal>
      <Modal show={showWfhNavModal} onHide={() => setShowWfhNavModal(false)} centered backdrop="static" contentClassName="interactive-card border-0 shadow-lg">
        <Modal.Header className="border-0 p-4 pb-0" closeButton>
          <Modal.Title className="fw-bold text-danger">Navigation Blocked</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4 text-center">
          <div className="mb-4 text-danger">
            <CsLineIcons icon="shield-warning" size="40" />
          </div>
          <h5 className="fw-bold text-dark mb-3">WFH Tracking is Active!</h5>
          <p className="text-muted small fw-bold">
            You cannot navigate to other pages while checked in from home. Doing so will stop your background screen sharing and tracking.
          </p>
          <p className="text-muted small">
            Please <strong>minimize this window</strong> and continue with your office work. If you must browse this site, please <strong>Check-Out</strong> first.
          </p>
        </Modal.Body>
        <Modal.Footer className="border-0 p-4 pt-0 d-flex justify-content-center">
          <Button variant="primary" className="custom-btn-outline border-primary text-primary px-5" onClick={() => setShowWfhNavModal(false)}>
            I Understand, Stay Here
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
