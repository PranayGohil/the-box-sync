import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import axios from 'axios';
import { Row, Col, Card, Button, Badge, Alert, Modal, Spinner, Form, Dropdown, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { useTable, useGlobalFilter, useSortBy, usePagination, useRowSelect } from 'react-table';
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import ControlsPageSize from 'components/table/ControlsPageSize';
import Table from 'components/table/Table';
import TablePagination from 'components/table/TablePagination';
import { toast } from 'react-toastify';
import { getLeavePolicy, getPayrollConfig } from 'api/payrollConfig';

const customStyles = `
  .glass-card {
    background: #ffffff !important;
    border: 1px solid #f0f0f0 !important;
    border-radius: 1.5rem !important;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.04) !important;
    transition: all 0.3s ease;
  }
  .custom-btn-primary-outline {
    border: 1px solid #1ea8e7 !important;
    color: #1ea8e7 !important;
    background-color: #fff !important;
    transition: all 0.2s ease-in-out !important;
    border-radius: 50px !important;
    font-weight: 600 !important;
    font-size: 0.85rem !important;
  }
  .custom-btn-primary-outline:hover {
    background-color: #1ea8e7 !important;
    color: #fff !important;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(30, 168, 231, 0.25) !important;
  }
  .custom-btn-solid {
    background-color: #1ea8e7 !important;
    border: 1px solid #1ea8e7 !important;
    color: #fff !important;
    transition: all 0.2s ease-in-out !important;
    border-radius: 50px !important;
    font-weight: 600 !important;
    font-size: 0.85rem !important;
  }
  .custom-btn-solid:hover {
    background-color: #158dc4 !important;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(30, 168, 231, 0.3) !important;
  }
  .custom-btn-danger-outline {
    border: 1px solid #ef4444 !important;
    color: #ef4444 !important;
    background-color: #fff !important;
    transition: all 0.2s ease-in-out !important;
    border-radius: 50px !important;
    font-weight: 600 !important;
    font-size: 0.85rem !important;
  }
  .custom-btn-danger-outline:hover {
    background-color: #ef4444 !important;
    color: #fff !important;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2) !important;
  }
  .custom-btn-info-outline {
    border: 1px solid #0ea5e9 !important;
    color: #0ea5e9 !important;
    background-color: #fff !important;
    transition: all 0.2s ease-in-out !important;
    border-radius: 50px !important;
    font-weight: 600 !important;
    font-size: 0.85rem !important;
  }
  .custom-btn-info-outline:hover {
    background-color: #0ea5e9 !important;
    color: #fff !important;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(14, 165, 233, 0.2) !important;
  }
  .status-badge {
    padding: 0.4rem 0.85rem !important;
    border-radius: 50px !important;
    font-weight: 700 !important;
    font-size: 0.75rem !important;
    letter-spacing: 0.04em !important;
    text-transform: uppercase !important;
    display: inline-flex !important;
    align-items: center !important;
    gap: 0.35rem !important;
  }
  .status-badge-pending {
    background-color: #f59e0b !important;
    color: #ffffff !important;
    border: none !important;
  }
  .status-badge-present {
    background-color: #10b981 !important;
    color: #ffffff !important;
    border: none !important;
  }
  .status-badge-absent {
    background-color: #e11d48 !important;
    color: #ffffff !important;
    border: none !important;
  }
  .status-badge-leave {
    background-color: #0284c7 !important;
    color: #ffffff !important;
    border: none !important;
  }
  .status-badge-completed {
    background-color: #4f46e5 !important;
    color: #ffffff !important;
    border: none !important;
  }

  table.react-table.rows {
    border-collapse: separate !important;
    border-spacing: 0 15px !important;
    width: 100% !important;
  }
  .react-table th {
    background: #f8fafc !important;
    color: #475569 !important;
    font-weight: 600 !important;
    text-transform: uppercase !important;
    font-size: 0.8rem !important;
    letter-spacing: 0.06em !important;
    padding: 1.1rem 1.5rem !important;
    border-top: none !important;
    border-bottom: 2px solid #e2e8f0 !important;
    border-left: none !important;
    border-right: none !important;
  }
  .react-table tbody tr {
    transition: all 0.2s ease-in-out !important;
    background-color: transparent !important;
  }
  .react-table tbody tr:hover td {
    background-color: rgba(30, 168, 231, 0.015) !important;
  }
  .react-table td {
    padding: 1.1rem 1.5rem !important;
    vertical-align: middle !important;
    border: none !important;
    background-color: #ffffff !important;
  }
  .react-table td:first-child {
    border-top-left-radius: 15px !important;
    border-bottom-left-radius: 15px !important;
  }
  .react-table td:last-child {
    border-top-right-radius: 15px !important;
    border-bottom-right-radius: 15px !important;
  }

  .avatar-circle {
    background: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%) !important;
    color: #0369a1 !important;
    font-weight: 700 !important;
    border: 2px solid #f0f9ff !important;
    box-shadow: 0 4px 10px rgba(14, 165, 233, 0.08) !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    width: 42px !important;
    height: 42px !important;
    border-radius: 50% !important;
    font-size: 0.9rem !important;
    transition: all 0.2s ease-in-out !important;
  }
  .avatar-circle:hover {
    transform: scale(1.05);
    box-shadow: 0 6px 14px rgba(14, 165, 233, 0.15) !important;
  }

  .time-badge {
    display: inline-flex !important;
    align-items: center !important;
    padding: 0.35rem 0.75rem !important;
    border-radius: 8px !important;
    font-size: 0.8rem !important;
    font-weight: 600 !important;
    letter-spacing: 0.01em !important;
  }
  .time-badge-in {
    background-color: rgba(16, 185, 129, 0.06) !important;
    color: #059669 !important;
    border: 1px solid rgba(16, 185, 129, 0.12) !important;
  }
  .time-badge-out {
    background-color: rgba(239, 68, 68, 0.06) !important;
    color: #dc2626 !important;
    border: 1px solid rgba(239, 68, 68, 0.12) !important;
  }

  .bg-soft-danger {
    background-color: rgba(239, 68, 68, 0.08) !important;
    color: #ef4444 !important;
    border: 1px solid rgba(239, 68, 68, 0.15) !important;
  }
  .bg-soft-success {
    background-color: rgba(16, 185, 129, 0.08) !important;
    color: #10b981 !important;
    border: 1px solid rgba(16, 185, 129, 0.15) !important;
  }
  .bg-soft-info {
    background-color: rgba(14, 165, 233, 0.08) !important;
    color: #0ea5e9 !important;
    border: 1px solid rgba(14, 165, 233, 0.15) !important;
  }
  .bg-soft-primary {
    background-color: rgba(30, 168, 231, 0.08) !important;
    color: #1ea8e7 !important;
    border: 1px solid rgba(30, 168, 231, 0.15) !important;
  }

  .table-controls-bar {
    background-color: #ffffff !important;
    border-bottom: 1px solid #f1f5f9 !important;
    padding: 1rem 1.5rem !important;
  }
  .att-icon-btn {
    width: 38px !important;
    height: 38px !important;
    border-radius: 50% !important;
    border: 1.5px solid #1ea8e7 !important;
    color: #1ea8e7 !important;
    background: #ffffff !important;
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
    padding: 0 !important;
    flex-shrink: 0 !important;
    transition: all 0.2s ease !important;
  }
  .att-icon-btn:hover {
    background: #1ea8e7 !important;
    color: #fff !important;
    box-shadow: 0 4px 12px rgba(30, 168, 231, 0.25) !important;
    transform: translateY(-1px) !important;
  }
  .att-icon-btn svg {
    stroke: currentColor !important;
    flex-shrink: 0 !important;
  }
  .att-page-size-btn {
    background: #ffffff !important;
    border: 1.5px solid #e2e8f0 !important;
    border-radius: 50px !important;
    padding: 0.35rem 1rem !important;
    font-size: 0.82rem !important;
    font-weight: 600 !important;
    color: #475569 !important;
    display: inline-flex !important;
    align-items: center !important;
    gap: 0.4rem !important;
    transition: all 0.2s ease !important;
    cursor: pointer !important;
  }
  .att-page-size-btn:hover {
    border-color: #1ea8e7 !important;
    color: #1ea8e7 !important;
  }

  /* OrderHistory-style controls — ported for payroll module */
  .order-history-custom-control-btn {
    position: relative !important;
    width: 40px !important;
    height: 40px !important;
    padding: 0 !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    border-radius: 10px !important;
    transition: all 0.2s ease !important;
    border: 1px solid #1ea8e7 !important;
    background-color: #fff !important;
    color: #1ea8e7 !important;
  }
  .order-history-custom-control-btn:hover {
    background-color: #1ea8e7 !important;
    color: #fff !important;
    transform: translateY(-2px) !important;
    box-shadow: 0 4px 8px rgba(30, 168, 231, 0.2) !important;
  }
  .order-history-custom-control-btn:hover svg {
    color: #fff !important;
    stroke: #fff !important;
  }
  .order-history-custom-search-container {
    border-radius: 10px !important;
    overflow: hidden !important;
    background-color: #fff !important;
    border: 1px solid #eee !important;
    transition: all 0.2s ease !important;
  }
  .order-history-custom-search-container:focus-within {
    border-color: #1ea8e7 !important;
    box-shadow: 0 0 0 2px rgba(30, 168, 231, 0.1) !important;
  }

  /* Robust and Clean Styling for CS Line Icons to ensure high premium visibility */
  .cs-icon,
  .custom-btn-primary-outline svg, 
  .custom-btn-danger-outline svg, 
  .custom-btn-info-outline svg {
    width: 16px !important;
    height: 16px !important;
    stroke: currentColor !important;
    stroke-width: 2px !important;
    fill: none !important;
    display: inline-block !important;
    vertical-align: middle !important;
    flex-shrink: 0 !important;
  }

  .sw-5, .sh-5, .small-btn-icon {
    flex-shrink: 0 !important;
  }

  .custom-btn-primary-outline,
  .custom-btn-danger-outline,
  .custom-btn-info-outline {
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
  }

  /* Premium Mobile Roster Cards styling to minimize vertical scroll and look gorgeous */
  .mobile-staff-card {
    background: #ffffff !important;
    border: 1px solid #f1f5f9 !important;
    border-radius: 1.25rem !important;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.02) !important;
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1) !important;
  }
  .mobile-staff-card:hover {
    border-color: rgba(30, 168, 231, 0.2) !important;
    box-shadow: 0 8px 30px rgba(30, 168, 231, 0.08) !important;
  }
  .mobile-avatar {
    width: 2.5rem !important;
    height: 2.5rem !important;
    font-size: 0.95rem;
    font-weight: 800;
    background: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%) !important;
    color: #0369a1 !important;
    border: 2px solid #f0f9ff !important;
    box-shadow: 0 3px 8px rgba(14, 165, 233, 0.08) !important;
  }
  .small-role {
    font-size: 0.75rem;
    font-weight: 500;
    color: #64748b;
  }
  .small-badge {
    font-size: 0.65rem !important;
    padding: 0.35rem 0.65rem !important;
    letter-spacing: 0.05em;
  }
  .mobile-timings-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.5rem;
    background: #f8fafc;
    padding: 0.6rem 0.8rem;
    border-radius: 0.75rem;
  }
  .timing-box {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }
  .timing-label {
    font-size: 0.6rem;
    font-weight: 700;
    color: #94a3b8;
    letter-spacing: 0.05em;
    margin-bottom: 0.15rem;
    text-transform: uppercase;
  }
  .timing-val {
    font-size: 0.8rem;
    font-weight: 700;
    color: #1e293b;
  }
  .small-btn {
    font-size: 0.75rem !important;
    padding: 0.35rem 0.7rem !important;
    border-radius: 50px !important;
    height: auto !important;
    width: auto !important;
    line-height: 1 !important;
  }
  .small-btn-icon {
    width: 2rem !important;
    height: 2rem !important;
    border-radius: 50% !important;
    padding: 0 !important;
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
  }
  .mobile-staff-card svg {
    width: 14px !important;
    height: 14px !important;
  }
  @media (max-width: 767.98px) {
    .page-title-container {
      margin-top: 2rem !important;
    }
    .w-100-mobile {
      width: 100% !important;
      display: block !important;
    }
    .w-100-mobile .dropdown-toggle {
      width: 100% !important;
    }
    .w-100-mobile .dropdown-menu {
      width: 100% !important;
    }
  }
`;

const LocalControlsPageSize = ({ tableInstance }) => {
  const {
    setPageSize,
    gotoPage,
    state: { pageSize },
  } = tableInstance;

  const options = [5, 10, 20, 50];

  const onSelectPageSize = (size) => {
    setPageSize(size);
    gotoPage(0);
  };

  return (
    <OverlayTrigger placement="top" delay={{ show: 1000, hide: 0 }} overlay={<Tooltip>Item Count</Tooltip>}>
      {({ ref, ...triggerHandler }) => (
        <Dropdown className="d-inline-block w-100-mobile" align="end">
          <Dropdown.Toggle
            ref={ref}
            {...triggerHandler}
            variant="outline-primary"
            className="rounded-pill shadow-sm px-3 fw-bold border-2 d-flex align-items-center justify-content-center w-100"
            style={{ height: '42px', color: '#1ea8e7', borderColor: '#1ea8e7' }}
          >
            <span className="me-2">{pageSize} Items</span>
          </Dropdown.Toggle>
          <Dropdown.Menu
            className="shadow-lg border-0 w-100-mobile"
            style={{ borderRadius: '15px', overflow: 'hidden' }}
          >
            {options.map((pSize) => (
              <Dropdown.Item
                key={`pageSize.${pSize}`}
                active={pSize === pageSize}
                onClick={() => onSelectPageSize(pSize)}
                className="px-4 py-2"
              >
                {pSize} Items
              </Dropdown.Item>
            ))}
          </Dropdown.Menu>
        </Dropdown>
      )}
    </OverlayTrigger>
  );
};

export default function ManageAttendance() {
  const title = 'Manage Attendance';
  const description = 'Manage staff attendance and track check-ins/check-outs';
  const breadcrumbs = [
    { to: '', text: 'Home' },
    { to: 'attendance', text: 'Attendance Management' },
  ];

  const history = useHistory();
  const [loading, setLoading] = useState({
    initial: true,
    actions: {
      checkin: false,
      checkout: false,
      absent: false,
      leave: false,
    },
  });
  const [staffList, setStaffList] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [selectedLeaveType, setSelectedLeaveType] = useState('');
  const [isHalfDay, setIsHalfDay] = useState(false);
  const [localSearchTerm, setLocalSearchTerm] = useState('');
  const [payrollConfig, setPayrollConfig] = useState(null);

  const [showActionModal, setShowActionModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [actionType, setActionType] = useState('');
  const [error, setError] = useState('');

  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedAttendance, setSelectedAttendance] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editStatus, setEditStatus] = useState('');
  const [editInTime, setEditInTime] = useState('');
  const [editOutTime, setEditOutTime] = useState('');
  const [editLeaveType, setEditLeaveType] = useState('');
  const [editReason, setEditReason] = useState('');
  const [submittingEdit, setSubmittingEdit] = useState(false);

  // Attendance Settings panel state
  const [showAttSettings, setShowAttSettings] = useState(false);
  const [attSettings, setAttSettings] = useState({ 
    shift_start_time: '09:00 AM', 
    late_threshold_minutes: 0, 
    shift_end_time: '06:00 PM',
    network_restrictions: { is_enabled: false, allowed_ips: '' },
    wfh_config: { min_interval: 3, max_interval: 15, idle_threshold: 5 }
  });
  const [savingAttSettings, setSavingAttSettings] = useState(false);
  const [attSettingsMsg, setAttSettingsMsg] = useState('');
  const [adminPublicIp, setAdminPublicIp] = useState('');

  const [showRegularizationRequests, setShowRegularizationRequests] = useState(false);
  const [regularizationRequests, setRegularizationRequests] = useState([]);

  useEffect(() => {
    if (showRegularizationRequests) {
      const stored = JSON.parse(localStorage.getItem('regularization_requests') || '[]');
      setRegularizationRequests(stored);
    }
  }, [showRegularizationRequests]);

  const handleApproveReg = (id) => {
    const stored = JSON.parse(localStorage.getItem('regularization_requests') || '[]');
    const updated = stored.map(req => req.id === id ? { ...req, status: 'Approved' } : req);
    localStorage.setItem('regularization_requests', JSON.stringify(updated));
    setRegularizationRequests(updated);
    toast.success('Regularization Request Approved');
  };

  const handleRejectReg = (id) => {
    const stored = JSON.parse(localStorage.getItem('regularization_requests') || '[]');
    const updated = stored.map(req => req.id === id ? { ...req, status: 'Rejected' } : req);
    localStorage.setItem('regularization_requests', JSON.stringify(updated));
    setRegularizationRequests(updated);
    toast.success('Regularization Request Rejected');
  };

  useEffect(() => {
    // Fetch admin's current IP as seen by our backend
    axios.get(`${process.env.REACT_APP_API}/kiosk/me`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    })
      .then(res => {
        if (res.data && res.data.client_ip) {
          setAdminPublicIp(res.data.client_ip);
        }
      })
      .catch(err => console.error('Failed to get backend IP', err));
  }, []);



  const getTodayDate = () => {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
  };

  const [targetDate, setTargetDate] = useState(getTodayDate());
  const [positionFilter, setPositionFilter] = useState('all');

  const parseTimeToMinutes = (timeStr) => {
    if (!timeStr) return 0;
    const [time, period] = timeStr.split(' ');
    if (!time || !period) return 0;
    let [hours, minutes] = time.split(':').map(Number);
    if (period === 'PM' && hours !== 12) hours += 12;
    else if (period === 'AM' && hours === 12) hours = 0;
    return hours * 60 + minutes;
  };

  const isCurrentlyCheckedIn = (attendance) => {
    if (!attendance) return false;
    if (attendance.sessions && attendance.sessions.length > 0) {
      const lastSession = attendance.sessions[attendance.sessions.length - 1];
      return lastSession && lastSession.out_time === null;
    }
    return attendance.in_time && !attendance.out_time;
  };

  const calculateTotalWorkingHours = (attendance, config) => {
    if (!attendance) return '—';
    const lunchStartStr = (config && config.org_rules && config.org_rules.lunch_start_time) || "01:00 PM";
    const lunchEndStr = (config && config.org_rules && config.org_rules.lunch_end_time) || "02:00 PM";
    
    const lunchStart = parseTimeToMinutes(lunchStartStr);
    const lunchEnd = parseTimeToMinutes(lunchEndStr);
    
    let totalMins = 0;
    
    if (attendance.sessions && attendance.sessions.length > 0) {
      attendance.sessions.forEach(session => {
        if (session.in_time && session.out_time) {
          let diff = parseTimeToMinutes(session.out_time) - parseTimeToMinutes(session.in_time);
          if (diff < 0) diff += 24 * 60;
          totalMins += diff;
        }
      });
      
      for (let i = 0; i < attendance.sessions.length - 1; i++) {
        const currentOut = attendance.sessions[i].out_time;
        const nextIn = attendance.sessions[i+1].in_time;
        
        if (currentOut && nextIn) {
          let gapStart = parseTimeToMinutes(currentOut);
          let gapEnd = parseTimeToMinutes(nextIn);
          if (gapEnd < gapStart) gapEnd += 24 * 60;
          
          const overlapStart = Math.max(gapStart, lunchStart);
          const overlapEnd = Math.min(gapEnd, lunchEnd);
          const overlap = Math.max(0, overlapEnd - overlapStart);
          totalMins += overlap;
        }
      }
    } else if (attendance.in_time && attendance.out_time) {
      let diff = parseTimeToMinutes(attendance.out_time) - parseTimeToMinutes(attendance.in_time);
      if (diff < 0) diff += 24 * 60;
      totalMins = diff;
    } else {
      return '—';
    }
    
    const h = Math.floor(totalMins / 60);
    const m = totalMins % 60;
    return `${h}h ${m}m`;
  };

  const authHeader = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
  });

  const getCurrentTime = () => {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDateDisplay = (dateString) => {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
  };

  const fetchTodayAttendance = async (date) => {
    try {
      setLoading((prev) => ({ ...prev, initial: true }));
      setError('');
      const queryDate = date || targetDate;
      const [attRes, polRes, configRes] = await Promise.all([
        axios.get(`${process.env.REACT_APP_API}/attendance/today?date=${queryDate}`, authHeader()),
        getLeavePolicy(),
        getPayrollConfig().catch(() => null)
      ]);
      setStaffList(attRes.data.data);
      if (polRes.success && polRes.data) {
        setLeaveTypes(polRes.data.leave_types || []);
      }
      if (configRes && configRes.success) {
        setPayrollConfig(configRes.data);
        // Sync attendance settings from loaded config
        if (configRes.data.org_rules) {
          const r = configRes.data.org_rules;
          setAttSettings(prev => ({
            ...prev,
            shift_start_time: r.shift_start_time || '09:00 AM',
            late_threshold_minutes: r.late_threshold_minutes ?? 0,
            shift_end_time: r.shift_end_time || '06:00 PM',
          }));
        }
        if (configRes.data.network_restrictions || configRes.data.wfh_config) {
          setAttSettings(prev => ({
            ...prev,
            network_restrictions: {
              is_enabled: configRes.data.network_restrictions?.is_enabled || false,
              allowed_ips: (configRes.data.network_restrictions?.allowed_ips || []).join(', ')
            },
            wfh_config: {
              min_interval: configRes.data.wfh_config?.min_interval || 3,
              max_interval: configRes.data.wfh_config?.max_interval || 15,
              idle_threshold: configRes.data.wfh_config?.idle_threshold || 5,
            }
          }));
        }
      }
    } catch (err) {
      console.error('Error fetching attendance:', err);
      setError('Failed to load staff attendance data. Please try again.');
      toast.error('Failed to fetch attendance data.');
    } finally {
      setLoading((prev) => ({ ...prev, initial: false }));
    }
  };

  useEffect(() => {
    fetchTodayAttendance(targetDate);
  }, [targetDate]);

  const convertTo24HourInput = (time12) => {
    // Convert '09:30 AM' -> '09:30' for <input type="time">
    if (!time12) return '';
    const parts = time12.split(' ');
    if (parts.length !== 2) return '';
    const [time, period] = parts;
    let [hours, minutes] = time.split(':').map(Number);
    if (period === 'PM' && hours !== 12) hours += 12;
    else if (period === 'AM' && hours === 12) hours = 0;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  };

  const convertFromTimeInput = (time24) => {
    // Convert '09:30' -> '09:30 AM' for storage
    if (!time24) return '';
    const [hoursStr, minutesStr] = time24.split(':');
    let hours = parseInt(hoursStr, 10);
    const minutes = minutesStr;
    const period = hours >= 12 ? 'PM' : 'AM';
    hours %= 12;
    hours = hours || 12;
    return `${String(hours).padStart(2, '0')}:${minutes} ${period}`;
  };

  const handleSaveAttSettings = async () => {
    setSavingAttSettings(true);
    setAttSettingsMsg('');
    try {
      const allowed_ips_array = attSettings.network_restrictions.allowed_ips
        .split(',')
        .map(ip => ip.trim())
        .filter(ip => ip !== '');

      const payload = {
        org_rules: {
          shift_start_time: attSettings.shift_start_time,
          late_threshold_minutes: attSettings.late_threshold_minutes,
          shift_end_time: attSettings.shift_end_time
        },
        network_restrictions: {
          is_enabled: attSettings.network_restrictions.is_enabled,
          allowed_ips: allowed_ips_array
        },
        wfh_config: {
          min_interval: Number(attSettings.wfh_config.min_interval),
          max_interval: Number(attSettings.wfh_config.max_interval),
          idle_threshold: Number(attSettings.wfh_config.idle_threshold)
        }
      };

      const res = await axios.put(
        `${process.env.REACT_APP_API}/payroll-config`,
        payload,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      if (res.data.success) {
        setAttSettingsMsg('✅ Settings saved successfully!');
        setPayrollConfig(res.data.data);
        toast.success('Settings saved!');
      } else {
        setAttSettingsMsg('❌ Failed to save settings.');
      }
    } catch (err) {
      console.error(err);
      setAttSettingsMsg('❌ Error saving settings.');
    } finally {
      setSavingAttSettings(false);
      setTimeout(() => setAttSettingsMsg(''), 3500);
    }
  };

  const convertTo24Hour = (time12) => {
    if (!time12) return '';
    const parts = time12.split(' ');
    if (parts.length !== 2) return '';
    const [time, period] = parts;
    let [hours, minutes] = time.split(':').map(Number);
    if (period === 'PM' && hours !== 12) hours += 12;
    else if (period === 'AM' && hours === 12) hours = 0;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  };

  const convertTo12Hour = (time24) => {
    if (!time24) return null;
    const [hoursStr, minutesStr] = time24.split(':');
    let hours = parseInt(hoursStr, 10);
    const minutes = minutesStr;
    const period = hours >= 12 ? 'PM' : 'AM';
    hours %= 12;
    hours = hours || 12;
    const hoursFormatted = String(hours).padStart(2, '0');
    return `${hoursFormatted}:${minutes} ${period}`;
  };

  const handleOpenDetailModal = (att, staffId) => {
    setSelectedAttendance({ ...att, staff_id: att.staff_id || staffId });
    setIsEditing(false);
    setEditStatus(att.status || 'present');
    setEditInTime(convertTo24Hour(att.in_time) || '');
    setEditOutTime(convertTo24Hour(att.out_time) || '');
    setEditLeaveType(att.leave_type_id || (leaveTypes.length > 0 ? leaveTypes[0].leave_type_id : ''));
    setEditReason(att.manual_entry_reason || '');
    setShowDetailModal(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedAttendance) return;
    setSubmittingEdit(true);
    try {
      const payload = {
        staff_id: selectedAttendance.staff_id,
        date: selectedAttendance.date || targetDate,
        status: editStatus,
        in_time: (editStatus === 'present' || editStatus === 'half_day') ? convertTo12Hour(editInTime) : null,
        out_time: (editStatus === 'present' || editStatus === 'half_day') ? convertTo12Hour(editOutTime) : null,
        leave_type_id: (editStatus === 'leave' || editStatus === 'half_day') ? editLeaveType : null,
        manual_entry_reason: editReason || "Admin manual edit"
      };

      const response = await axios.post(`${process.env.REACT_APP_API}/attendance/update`, payload, authHeader());
      if (response.data.success) {
        toast.success('Attendance updated successfully!');
        setShowDetailModal(false);
        fetchTodayAttendance(targetDate);
      } else {
        toast.error(response.data.message || 'Failed to update attendance.');
      }
    } catch (err) {
      console.error('Error saving attendance edit:', err);
      toast.error(err.response?.data?.message || 'Failed to save changes.');
    } finally {
      setSubmittingEdit(false);
    }
  };

  const handleCheckIn = async (staffId, staffName) => {
    setLoading((prev) => ({ ...prev, actions: { ...prev.actions, checkin: true } }));
    try {
      await axios.post(
        `${process.env.REACT_APP_API}/attendance/check-in`,
        { staff_id: staffId, date: targetDate, in_time: getCurrentTime() },
        authHeader()
      );
      toast.success(`${staffName} checked in successfully!`);
      fetchTodayAttendance(targetDate);
    } catch (err) {
      console.error('Error during Check-In:', err);
      toast.error(err.response?.data?.message || 'Failed to check in.');
    } finally {
      setLoading((prev) => ({ ...prev, actions: { ...prev.actions, checkin: false } }));
    }
  };

  const handleCheckOut = async (staffId, staffName) => {
    setLoading((prev) => ({ ...prev, actions: { ...prev.actions, checkout: true } }));
    try {
      await axios.post(
        `${process.env.REACT_APP_API}/attendance/check-out`,
        { staff_id: staffId, date: targetDate, out_time: getCurrentTime() },
        authHeader()
      );
      toast.success(`${staffName} checked out successfully!`);
      fetchTodayAttendance(targetDate);
    } catch (err) {
      console.error('Error during Check-Out:', err);
      toast.error(err.response?.data?.message || 'Failed to check out.');
    } finally {
      setLoading((prev) => ({ ...prev, actions: { ...prev.actions, checkout: false } }));
    }
  };

  const handleAbsent = async (staffId, staffName) => {
    setLoading((prev) => ({ ...prev, actions: { ...prev.actions, absent: true } }));
    try {
      await axios.post(`${process.env.REACT_APP_API}/attendance/mark-absent`, { staff_id: staffId, date: targetDate }, authHeader());
      toast.success(`${staffName} marked as absent!`);
      fetchTodayAttendance(targetDate);
    } catch (err) {
      console.error('Error marking Absent:', err);
      toast.error(err.response?.data?.message || 'Failed to mark as absent.');
    } finally {
      setLoading((prev) => ({ ...prev, actions: { ...prev.actions, absent: false } }));
    }
  };

  const handleLeave = async (staffId, staffName) => {
    setLoading((prev) => ({ ...prev, actions: { ...prev.actions, leave: true } }));
    try {
      await axios.post(
        `${process.env.REACT_APP_API}/attendance/mark-leave`,
        { staff_id: staffId, date: targetDate, leave_type_id: selectedLeaveType, is_half_day: isHalfDay },
        authHeader()
      );
      toast.success(`${staffName} marked on leave!`);
      fetchTodayAttendance(targetDate);
    } catch (err) {
      console.error('Error marking Leave:', err);
      toast.error(err.response?.data?.message || 'Failed to mark leave.');
    } finally {
      setLoading((prev) => ({ ...prev, actions: { ...prev.actions, leave: false } }));
    }
  };

  const handleAction = (staff, type) => {
    setSelectedStaff(staff);
    setActionType(type);
    if (type === 'leave') {
      setSelectedLeaveType(leaveTypes.length > 0 ? leaveTypes[0].leave_type_id : '');
      setIsHalfDay(false);
    }
    setShowActionModal(true);
  };

  const confirmAction = () => {
    if (!selectedStaff) return;
    const fullName = `${selectedStaff.f_name} ${selectedStaff.l_name}`;
    if (actionType === 'checkin') handleCheckIn(selectedStaff._id, fullName);
    if (actionType === 'checkout') handleCheckOut(selectedStaff._id, fullName);
    if (actionType === 'absent') handleAbsent(selectedStaff._id, fullName);
    if (actionType === 'leave') handleLeave(selectedStaff._id, fullName);
    setShowActionModal(false);
  };

  const columns = React.useMemo(
    () => [
      {
        Header: 'Staff ID',
        accessor: 'staff_id',
        headerClassName: 'text-small text-uppercase w-15',
        sortable: true,
        Cell: ({ value }) => <span className="fw-bold text-dark">#{value}</span>,
      },
      {
        Header: 'Date',
        id: 'date',
        headerClassName: 'text-small text-uppercase w-15',
        sortable: false,
        Cell: () => <span className="fw-bold text-muted">{formatDateDisplay(targetDate)}</span>,
      },
      {
        Header: 'Staff Member',
        accessor: (row) => `${row.f_name} ${row.l_name}`,
        headerClassName: 'text-small text-uppercase w-25',
        sortable: true,
        Cell: ({ row, value }) => (
          <div className="d-flex align-items-center gap-3">
            <div className="avatar-circle">
              {row.original.f_name?.[0]}
              {row.original.l_name?.[0]}
            </div>
            <div>
              <div className="fw-bold text-dark">{value}</div>
              <div className="text-muted small">{row.original.position}</div>
            </div>
          </div>
        ),
      },
      {
        Header: 'Status',
        id: 'status',
        headerClassName: 'text-small text-uppercase w-15',
        sortable: true,
        Cell: ({ row }) => {
          const { todayAttendance } = row.original;
          let statusBg = 'warning';
          let statusLabel = 'Pending';
          if (todayAttendance) {
            if (todayAttendance.status === 'absent') {
              statusBg = 'danger';
              statusLabel = 'Absent';
            } else if (todayAttendance.status === 'leave') {
              statusBg = 'info';
              statusLabel = 'On Leave';
            } else if (todayAttendance.status === 'half_day') {
              statusBg = 'warning';
              statusLabel = 'Half Day';
            } else {
              const lastSession = todayAttendance.sessions && todayAttendance.sessions.length > 0
                ? todayAttendance.sessions[todayAttendance.sessions.length - 1]
                : null;
              if (lastSession) {
                if (lastSession.out_time === null) {
                  statusBg = 'success';
                  statusLabel = 'Checked In';
                } else {
                  statusBg = 'primary';
                  statusLabel = 'Completed';
                }
              } else if (todayAttendance.in_time && !todayAttendance.out_time) {
                statusBg = 'success';
                statusLabel = 'Checked In';
              } else if (todayAttendance.in_time && todayAttendance.out_time) {
                statusBg = 'primary';
                statusLabel = 'Completed';
              }
            }
          }
          return <Badge bg={statusBg}>{statusLabel}</Badge>;
        },
      },
      {
        Header: 'Check-In',
        id: 'in_time',
        headerClassName: 'text-small text-uppercase w-15',
        sortable: true,
        Cell: ({ row }) => {
          const { todayAttendance } = row.original;
          if (!todayAttendance) return <span className="text-muted fw-medium">—</span>;
          const lateMin = todayAttendance.late_by_minutes || 0;
          const lateBadge = lateMin > 0 ? (
            <span className="ms-1" style={{ display: 'inline-flex', alignItems: 'center', padding: '0.2rem 0.55rem', borderRadius: '50px', fontSize: '0.7rem', fontWeight: 700, background: 'rgba(239,68,68,0.1)', color: '#dc2626', border: '1px solid rgba(239,68,68,0.2)' }}>
              🔴 Late {lateMin}m
            </span>
          ) : null;
          if (todayAttendance.sessions && todayAttendance.sessions.length > 0) {
            return (
              <div className="d-flex flex-column gap-1">
                {todayAttendance.sessions.map((session, idx) => (
                  <span key={idx} className="time-badge time-badge-in">
                    <CsLineIcons icon="clock" size="12" className="me-1 text-success" /> {session.in_time}
                    {idx === 0 && lateBadge}
                  </span>
                ))}
              </div>
            );
          }
          const time = todayAttendance.in_time;
          if (!time) return <span className="text-muted fw-medium">—</span>;
          return (
            <span className="time-badge time-badge-in">
              <CsLineIcons icon="clock" size="12" className="me-1 text-success" /> {time}
              {lateBadge}
            </span>
          );
        },
      },
      {
        Header: 'Check-Out',
        id: 'out_time',
        headerClassName: 'text-small text-uppercase w-15',
        sortable: true,
        Cell: ({ row }) => {
          const { todayAttendance } = row.original;
          if (!todayAttendance) return <span className="text-muted fw-medium">—</span>;
          const otHours = todayAttendance.overtime_hours || 0;
          const otBadge = otHours > 0 ? (
            <span className="ms-1" style={{ display: 'inline-flex', alignItems: 'center', padding: '0.2rem 0.55rem', borderRadius: '50px', fontSize: '0.7rem', fontWeight: 700, background: 'rgba(109,40,217,0.1)', color: '#7c3aed', border: '1px solid rgba(109,40,217,0.2)' }}>
              ⚡ OT {otHours}h
            </span>
          ) : null;
          if (todayAttendance.sessions && todayAttendance.sessions.length > 0) {
            return (
              <div className="d-flex flex-column gap-1">
                {todayAttendance.sessions.map((session, idx) => (
                  <span key={idx} className={session.out_time ? "time-badge time-badge-out" : "time-badge bg-soft-warning text-warning"}>
                    <CsLineIcons icon="clock" size="12" className={session.out_time ? "me-1 text-danger" : "me-1 text-warning"} /> {session.out_time || 'Active'}
                    {idx === todayAttendance.sessions.length - 1 && session.out_time && otBadge}
                  </span>
                ))}
              </div>
            );
          }
          const time = todayAttendance.out_time;
          if (!time) return <span className="text-muted fw-medium">—</span>;
          return (
            <span className="time-badge time-badge-out">
              <CsLineIcons icon="clock" size="12" className="me-1 text-danger" /> {time}
              {otBadge}
            </span>
          );
        },
      },
      {
        Header: 'Working Hours',
        id: 'working_hours',
        headerClassName: 'text-small text-uppercase w-15',
        sortable: false,
        Cell: ({ row }) => {
          const { todayAttendance } = row.original;
          if (!todayAttendance) return <span className="text-muted fw-medium">—</span>;
          return (
            <span className="fw-bold text-primary">
              {calculateTotalWorkingHours(todayAttendance, payrollConfig)}
            </span>
          );
        },
      },
      {
        Header: 'Actions',
        id: 'actions',
        headerClassName: 'text-small text-uppercase w-15 text-center',
        sortable: false,
        Cell: ({ row }) => {
          const { todayAttendance } = row.original;
          const actionsDisabled = loading.actions.checkin || loading.actions.checkout || loading.actions.absent;

          return (
            <div className="d-flex justify-content-center gap-1">
              {!todayAttendance ? (
                <>
                  <Button
                    variant="outline-primary"
                    size="sm"
                    className="btn-icon btn-icon-only"
                    onClick={() => handleAction(row.original, 'checkin')}
                    title="Check-In"
                    disabled={actionsDisabled}
                  >
                    <CsLineIcons icon="login" />
                  </Button>
                  <Button
                    variant="outline-danger"
                    size="sm"
                    className="btn-icon btn-icon-only"
                    onClick={() => handleAction(row.original, 'absent')}
                    title="Mark Absent"
                    disabled={actionsDisabled}
                  >
                    <CsLineIcons icon="close-circle" />
                  </Button>
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    className="btn-icon btn-icon-only"
                    onClick={() => handleAction(row.original, 'leave')}
                    title="Mark Leave"
                    disabled={actionsDisabled}
                  >
                    <CsLineIcons icon="calendar" />
                  </Button>
                </>
              ) : isCurrentlyCheckedIn(todayAttendance) ? (
                <Button
                  variant="outline-primary"
                  size="sm"
                  className="btn-icon btn-icon-only"
                  onClick={() => handleAction(row.original, 'checkout')}
                  title="Check-Out"
                  disabled={actionsDisabled}
                >
                  <CsLineIcons icon="logout" />
                </Button>
              ) : todayAttendance.status === 'present' ? (
                <Button
                  variant="outline-primary"
                  size="sm"
                  className="btn-icon btn-icon-only"
                  onClick={() => handleAction(row.original, 'checkin')}
                  title="Check-In Again"
                  disabled={actionsDisabled}
                >
                  <CsLineIcons icon="login" />
                </Button>
              ) : (
                <Button
                  variant={todayAttendance.status === 'absent' ? 'outline-danger' : todayAttendance.status === 'leave' ? 'outline-info' : 'outline-success'}
                  size="sm"
                  className="btn-icon btn-icon-only"
                  disabled
                  title={todayAttendance.status === 'absent' ? 'Absent' : todayAttendance.status === 'leave' ? 'On Leave' : 'Done'}
                >
                  <CsLineIcons icon={todayAttendance.status === 'absent' ? 'close-circle' : todayAttendance.status === 'leave' ? 'calendar' : 'check'} />
                </Button>
              )}
              {todayAttendance && (
                <Button
                  variant="outline-warning"
                  size="sm"
                  className="btn-icon btn-icon-only"
                  onClick={() => handleOpenDetailModal(todayAttendance, row.original._id)}
                  title="Edit Attendance"
                >
                  <CsLineIcons icon="edit" />
                </Button>
              )}
              <Button
                variant="outline-primary"
                size="sm"
                className="btn-icon btn-icon-only"
                onClick={() => history.push(`/staff/attendance/view/${row.original._id}`)}
                title="View History"
              >
                <CsLineIcons icon="eye" />
              </Button>
            </div>
          );
        },
      },
    ],
    [loading, targetDate, payrollConfig, history]
  );

  const uniquePositions = React.useMemo(() => {
    const positions = staffList.map((s) => s.position).filter(Boolean);
    return ['all', ...new Set(positions)];
  }, [staffList]);

  const filteredStaffList = React.useMemo(() => {
    if (positionFilter === 'all') return staffList;
    return staffList.filter((s) => s.position === positionFilter);
  }, [staffList, positionFilter]);

  const formatDateDDMMYYYY = (dateStr) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  const tableInstance = useTable(
    { columns, data: filteredStaffList, initialState: { pageIndex: 0, pageSize: 10 } },
    useGlobalFilter,
    useSortBy,
    usePagination,
    useRowSelect
  );

  const { page, prepareRow, setGlobalFilter, state: tableState } = tableInstance;
  const { pageIndex, pageSize } = tableState;
  const totalFiltered = tableInstance.rows.length;

  React.useEffect(() => {
    const timer = setTimeout(() => setGlobalFilter(localSearchTerm || undefined), 300);
    return () => clearTimeout(timer);
  }, [localSearchTerm, setGlobalFilter]);

  if (loading.initial) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center py-5 mt-5">
        <Spinner animation="border" style={{ color: '#1ea8e7' }} className="mb-3" />
        <h5 className="fw-bold">Loading Attendance...</h5>
      </div>
    );
  }

  return (
    <div className="container-fluid pb-5">
      <style>{customStyles}</style>
      <HtmlHead title={title} description={description} />

      <div className="page-title-container mb-4">
        <Row className="g-3 align-items-center">
          <Col md={6}>
            <h1 className="mb-0 pb-0 display-4 fw-bold" style={{ color: '#1ea8e7' }}>
              {title}
            </h1>
            <BreadcrumbList items={breadcrumbs} />
          </Col>
          <Col md={6} className="d-flex justify-content-md-end align-items-center mt-md-0 mt-3">
            <Badge
              bg="soft-primary"
              className="px-4 py-2 fs-6 border border-primary border-opacity-25"
              style={{
                borderRadius: '50px',
                fontSize: '0.9rem',
                fontWeight: '700',
                backgroundColor: 'rgba(30, 168, 231, 0.08)',
                color: '#1ea8e7'
              }}
            >
              📅 Date: {formatDateDDMMYYYY(targetDate)}
            </Badge>
          </Col>
        </Row>
      </div>
          {error && (
            <Alert variant="danger" className="glass-card border-0 mb-4 d-flex align-items-center justify-content-between p-4 shadow-sm">
              <div className="d-flex align-items-center gap-2 text-danger fw-bold">
                <CsLineIcons icon="error" size="24" />
                <span>{error}</span>
              </div>
              <Button variant="none" className="custom-btn-danger-outline px-4" onClick={() => fetchTodayAttendance(targetDate)}>
                Retry
              </Button>
            </Alert>
          )}

      <div className="mb-4 d-flex gap-3 flex-wrap">
        <Button
          variant="none"
          className="custom-btn-primary-outline d-flex align-items-center gap-2 px-4 py-2"
          onClick={() => { setShowAttSettings(v => !v); setShowRegularizationRequests(false); }}
        >
          <CsLineIcons icon="settings" size={16} />
          Attendance Settings
          <CsLineIcons icon={showAttSettings ? 'chevron-up' : 'chevron-down'} size={14} className="ms-1" />
        </Button>

        <Button
          variant="none"
          className="custom-btn-info-outline d-flex align-items-center gap-2 px-4 py-2"
          onClick={() => history.push('/attendance/roster')}
        >
          <CsLineIcons icon="calendar" size={16} />
          Roster Management
        </Button>

        <Button
          variant="none"
          className="custom-btn-info-outline d-flex align-items-center gap-2 px-4 py-2"
          onClick={() => { setShowRegularizationRequests(v => !v); setShowAttSettings(false); }}
        >
          <CsLineIcons icon="edit" size={16} />
          Regularization Requests
          <CsLineIcons icon={showRegularizationRequests ? 'chevron-up' : 'chevron-down'} size={14} className="ms-1" />
        </Button>
      </div>

        {showAttSettings && (
          <Card className="glass-card border-0 shadow-sm mt-3 mb-4">
            <Card.Body className="p-4">
              <h6 className="fw-bold mb-1 text-dark">Shift & Timing Rules</h6>
              <p className="text-muted small mb-4">
                Configure the official shift start/end times and the late arrival grace period. These values are used to automatically flag late check-ins and overtime check-outs.
              </p>
              {attSettingsMsg && (
                <Alert variant={attSettingsMsg.startsWith('✅') ? 'success' : 'danger'} className="py-2 px-3 mb-3 rounded-3" style={{ fontSize: '0.88rem' }}>
                  {attSettingsMsg}
                </Alert>
              )}
              <Row className="g-3 align-items-end">
                <Col xs={12} sm={6} md={3}>
                  <Form.Label className="fw-semibold text-dark small mb-1">Shift Start Time</Form.Label>
                  <Form.Control
                    type="time"
                    value={convertTo24HourInput(attSettings.shift_start_time)}
                    onChange={e => setAttSettings(s => ({ ...s, shift_start_time: convertFromTimeInput(e.target.value) }))}
                    style={{ borderRadius: '10px', height: '42px', border: '1px solid #e2e8f0', fontSize: '14px' }}
                  />
                  <Form.Text className="text-muted" style={{ fontSize: '0.75rem' }}>Official shift start (e.g. 09:00 AM)</Form.Text>
                </Col>
                <Col xs={12} sm={6} md={3}>
                  <Form.Label className="fw-semibold text-dark small mb-1">Late Grace Period (Minutes)</Form.Label>
                  <Form.Control
                    type="number"
                    min={0}
                    max={120}
                    value={attSettings.late_threshold_minutes}
                    onChange={e => setAttSettings(s => ({ ...s, late_threshold_minutes: Number(e.target.value) }))}
                    style={{ borderRadius: '10px', height: '42px', border: '1px solid #e2e8f0', fontSize: '14px' }}
                  />
                  <Form.Text className="text-muted" style={{ fontSize: '0.75rem' }}>0 = no grace, 15 = 15-min allowance</Form.Text>
                </Col>
                <Col xs={12} sm={6} md={3}>
                  <Form.Label className="fw-semibold text-dark small mb-1">Shift End Time</Form.Label>
                  <Form.Control
                    type="time"
                    value={convertTo24HourInput(attSettings.shift_end_time)}
                    onChange={e => setAttSettings(s => ({ ...s, shift_end_time: convertFromTimeInput(e.target.value) }))}
                    style={{ borderRadius: '10px', height: '42px', border: '1px solid #e2e8f0', fontSize: '14px' }}
                  />
                  <Form.Text className="text-muted" style={{ fontSize: '0.75rem' }}>Check-out after this = overtime</Form.Text>
                </Col>
              </Row>

              <div className="mt-4 pt-3 border-top d-flex flex-wrap gap-3" style={{ fontSize: '0.8rem' }}>
                <span className="text-muted">Current config:</span>
                <span className="fw-semibold text-dark">⏰ Shift: {attSettings.shift_start_time} → {attSettings.shift_end_time}</span>
                <span className="fw-semibold" style={{ color: '#dc2626' }}>🔴 Late after: {attSettings.late_threshold_minutes} min grace</span>
                <span className="fw-semibold" style={{ color: '#7c3aed' }}>⚡ OT after: {attSettings.shift_end_time}</span>
                <span className="fw-semibold text-dark">🌐 Network Restrict: {attSettings.network_restrictions.is_enabled ? 'Enabled' : 'Disabled'}</span>
              </div>

              <div className="mt-4 pt-4 border-top">
                <h6 className="fw-bold mb-1 text-dark">Network Restrictions (Office Wi-Fi)</h6>
                <p className="text-muted small mb-3">
                  Restrict check-in and check-out to specific networks by entering their public IP addresses. 
                  (Browsers cannot read Wi-Fi names, so we use Public IPs).
                </p>
                <Row className="g-3 align-items-start">
                  <Col xs={12} md={3}>
                    <Form.Check 
                      type="switch"
                      id="network-restrict-switch"
                      label={<span className="fw-semibold text-dark small ms-2">Enable IP Restrictions</span>}
                      checked={attSettings.network_restrictions.is_enabled}
                      onChange={e => setAttSettings(s => ({ 
                        ...s, 
                        network_restrictions: { ...s.network_restrictions, is_enabled: e.target.checked }
                      }))}
                      className="mt-2"
                    />
                  </Col>
                  <Col xs={12} md={6}>
                    <Form.Label className="fw-semibold text-dark small mb-1">Allowed Public IP Addresses (Comma separated)</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="e.g. 192.168.1.1, 203.0.113.5"
                      value={attSettings.network_restrictions.allowed_ips}
                      onChange={e => setAttSettings(s => ({
                        ...s,
                        network_restrictions: { ...s.network_restrictions, allowed_ips: e.target.value }
                      }))}
                      style={{ borderRadius: '10px', height: '42px', border: '1px solid #e2e8f0', fontSize: '14px' }}
                      disabled={!attSettings.network_restrictions.is_enabled}
                    />
                    {adminPublicIp && (
                      <div className="mt-2">
                        <span className="text-muted small me-2">Your current IP is: <strong>{adminPublicIp}</strong></span>
                        <Button 
                          variant="link" 
                          className="p-0 text-decoration-none small" 
                          style={{ fontSize: '0.75rem' }}
                          disabled={!attSettings.network_restrictions.is_enabled}
                          onClick={() => {
                            setAttSettings(s => {
                              const currentIps = s.network_restrictions.allowed_ips.split(',').map(i => i.trim()).filter(i => i);
                              if (!currentIps.includes(adminPublicIp)) {
                                return {
                                  ...s,
                                  network_restrictions: {
                                    ...s.network_restrictions,
                                    allowed_ips: currentIps.length > 0 ? `${currentIps.join(', ')}, ${adminPublicIp}` : adminPublicIp
                                  }
                                };
                              }
                              return s;
                            });
                          }}
                        >
                          + Add Current IP
                        </Button>
                      </div>
                    )}
                  </Col>
                </Row>
              </div>

              <div className="mt-4 pt-4 border-top">
                <h6 className="fw-bold mb-1 text-dark">Work From Home (WFH) Tracking Settings</h6>
                <p className="text-muted small mb-3">
                  Configure the random snapshot intervals and idle time threshold for employees working from home.
                </p>
                <Row className="g-3 align-items-start">
                  <Col xs={12} sm={4}>
                    <Form.Label className="fw-semibold text-dark small mb-1">Min Interval (Minutes)</Form.Label>
                    <Form.Control
                      type="number"
                      min="1"
                      value={attSettings.wfh_config?.min_interval}
                      onChange={e => setAttSettings(s => ({
                        ...s,
                        wfh_config: { ...s.wfh_config, min_interval: e.target.value }
                      }))}
                      style={{ borderRadius: '10px', height: '42px', border: '1px solid #e2e8f0', fontSize: '14px' }}
                    />
                    <Form.Text className="text-muted" style={{ fontSize: '0.75rem' }}>Minimum time between random snapshots.</Form.Text>
                  </Col>
                  <Col xs={12} sm={4}>
                    <Form.Label className="fw-semibold text-dark small mb-1">Max Interval (Minutes)</Form.Label>
                    <Form.Control
                      type="number"
                      min="1"
                      value={attSettings.wfh_config?.max_interval}
                      onChange={e => setAttSettings(s => ({
                        ...s,
                        wfh_config: { ...s.wfh_config, max_interval: e.target.value }
                      }))}
                      style={{ borderRadius: '10px', height: '42px', border: '1px solid #e2e8f0', fontSize: '14px' }}
                    />
                    <Form.Text className="text-muted" style={{ fontSize: '0.75rem' }}>Maximum time between random snapshots.</Form.Text>
                  </Col>
                  <Col xs={12} sm={4}>
                    <Form.Label className="fw-semibold text-dark small mb-1">Idle Threshold (Minutes)</Form.Label>
                    <Form.Control
                      type="number"
                      min="1"
                      value={attSettings.wfh_config?.idle_threshold}
                      onChange={e => setAttSettings(s => ({
                        ...s,
                        wfh_config: { ...s.wfh_config, idle_threshold: e.target.value }
                      }))}
                      style={{ borderRadius: '10px', height: '42px', border: '1px solid #e2e8f0', fontSize: '14px' }}
                    />
                    <Form.Text className="text-muted" style={{ fontSize: '0.75rem' }}>Time before system marks employee as idle.</Form.Text>
                  </Col>
                </Row>
              </div>

              <div className="mt-4 pt-4 border-top text-end">
                <Button
                  variant="none"
                  className="custom-btn-solid d-inline-flex align-items-center justify-content-center gap-2 px-5"
                  onClick={handleSaveAttSettings}
                  disabled={savingAttSettings}
                  style={{ height: '42px' }}
                >
                  {savingAttSettings ? <Spinner animation="border" size="sm" /> : <CsLineIcons icon="save" size={16} />}
                  {savingAttSettings ? 'Saving...' : 'Save Settings'}
                </Button>
              </div>
            </Card.Body>
          </Card>
        )}

        {showRegularizationRequests && (
          <Card className="glass-card border-0 shadow-sm mt-3 mb-4">
            <Card.Body className="p-4">
              <h6 className="fw-bold mb-1 text-dark d-flex align-items-center gap-2">
                <CsLineIcons icon="edit" size="18" className="text-primary" />
                Regularization Requests
              </h6>
              <p className="text-muted small mb-4">
                Review and approve/reject staff requests to correct missed punches.
              </p>
              
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
                        <td>{formatDateDDMMYYYY(req.date)}</td>
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
                                <CsLineIcons icon="check" size="14" /> Approve
                              </Button>
                              <Button size="sm" variant="danger" className="d-flex align-items-center gap-1" onClick={() => handleRejectReg(req.id)}>
                                <CsLineIcons icon="close" size="14" /> Reject
                              </Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card.Body>
          </Card>
        )}
      <div>
        <Row className="mb-3 g-3 align-items-center">
          <Col xs="12" md="4" lg="5">
            <div className="order-history-custom-search-container shadow-sm d-flex align-items-center px-2">
              <CsLineIcons icon="search" size="18" className="text-primary opacity-75 ms-1 me-2" />
              <Form.Control
                type="text"
                className="border-0 bg-transparent shadow-none"
                placeholder="Search staff..."
                value={localSearchTerm}
                onChange={(e) => setLocalSearchTerm(e.target.value)}
                style={{ height: '40px', fontSize: '14px' }}
              />
              {localSearchTerm && (
                <div className="cursor-pointer text-muted px-1" onClick={() => setLocalSearchTerm('')}>
                  <CsLineIcons icon="close" size="14" />
                </div>
              )}
            </div>
          </Col>

          <Col xs="6" md="3" lg="3">
            <Form.Select
              value={positionFilter}
              onChange={(e) => setPositionFilter(e.target.value)}
              className="filter-pill-input shadow-sm"
              style={{
                borderRadius: '10px',
                height: '42px',
                border: '1px solid #eee',
                fontSize: '14px',
                fontWeight: '600',
                color: '#475569',
                backgroundColor: '#fff',
                cursor: 'pointer'
              }}
            >
              <option value="all">All Positions</option>
              {uniquePositions.filter(p => p !== 'all').map((pos) => (
                <option key={pos} value={pos}>{pos}</option>
              ))}
            </Form.Select>
          </Col>

          <Col xs="6" md="3" lg="2">
            <Form.Control
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="filter-pill-input shadow-sm"
              style={{
                borderRadius: '10px',
                height: '42px',
                border: '1px solid #eee',
                fontSize: '14px',
                fontWeight: '600',
                color: '#475569',
                backgroundColor: '#fff',
                cursor: 'pointer'
              }}
            />
          </Col>

          <Col xs="12" md="2" lg="2" className="d-flex align-items-center justify-content-between justify-content-md-end gap-3 ms-md-auto w-100-mobile">
            <div className="text-muted small fw-bold d-none d-xl-block">
              Showing {totalFiltered > 0 ? pageIndex * pageSize + 1 : 0}&ndash;{Math.min((pageIndex + 1) * pageSize, totalFiltered)} of {totalFiltered}
            </div>
            <div className="w-100-mobile">
              <LocalControlsPageSize tableInstance={tableInstance} />
            </div>
          </Col>
        </Row>

        <Row className="d-none d-lg-flex">
          <Col xs="12" style={{ overflow: 'auto' }}>
            <Table className="react-table rows" tableInstance={tableInstance} />
          </Col>
        </Row>

        <Row className="d-lg-none g-3">
          {page.map((row) => {
            prepareRow(row);
            const staff = row.original;
            const { todayAttendance } = staff;

            let status = 'Pending';
            let statusVariant = 'warning';
            if (todayAttendance) {
              if (todayAttendance.status === 'absent') {
                status = 'Absent';
                statusVariant = 'danger';
              } else if (todayAttendance.status === 'leave') {
                status = 'On Leave';
                statusVariant = 'info';
              } else if (todayAttendance.status === 'half_day') {
                status = 'Half Day';
                statusVariant = 'warning';
              } else {
                const lastSession = todayAttendance.sessions && todayAttendance.sessions.length > 0
                  ? todayAttendance.sessions[todayAttendance.sessions.length - 1]
                  : null;
                if (lastSession) {
                  if (lastSession.out_time === null) {
                    status = 'Checked In';
                    statusVariant = 'success';
                  } else {
                    status = 'Completed';
                    statusVariant = 'primary';
                  }
                } else if (todayAttendance.in_time && !todayAttendance.out_time) {
                  status = 'Checked In';
                  statusVariant = 'success';
                } else if (todayAttendance.in_time && todayAttendance.out_time) {
                  status = 'Completed';
                  statusVariant = 'primary';
                }
              }
            }

            const actionsDisabled = loading.actions.checkin || loading.actions.checkout || loading.actions.absent || loading.actions.leave;

            return (
              <Col key={staff._id} xs="12" sm="6" md="6">
                <Card className="border-0 shadow-sm hover-scale-up h-100" style={{ borderRadius: '1.25rem', overflow: 'hidden' }}>
                  <Card.Body className="p-3 position-relative d-flex flex-column justify-content-between h-100">
                    <div
                      className="position-absolute"
                      style={{
                        top: '-10px',
                        right: '-10px',
                        width: '60px',
                        height: '60px',
                        borderRadius: '50%',
                        background: 'rgba(30, 168, 231, 0.1)',
                        filter: 'blur(10px)',
                      }}
                    />
                    <div>
                      <div className="d-flex align-items-center justify-content-between mb-3 position-relative">
                        <div className="d-flex align-items-center gap-2">
                          <div className="mobile-avatar rounded-circle d-flex align-items-center justify-content-center text-primary fw-bold bg-soft-primary" style={{ width: '40px', height: '40px', fontSize: '14px' }}>
                            {staff.f_name?.[0]}
                            {staff.l_name?.[0]}
                          </div>
                          <div>
                            <div className="fw-bold text-dark text-truncate" style={{ maxWidth: '140px' }}>
                              {staff.f_name} {staff.l_name}
                            </div>
                            <div className="small-role text-muted small text-truncate" style={{ maxWidth: '140px' }}>
                              {staff.position} • #{staff.staff_id}
                            </div>
                            <div className="text-primary fw-bold mt-1" style={{ fontSize: '0.7rem' }}>
                              📅 {formatDateDisplay(targetDate)}
                            </div>
                          </div>
                        </div>
                        <Badge bg={statusVariant} className="rounded-pill px-3 py-1">{status}</Badge>
                      </div>

                      <Row className="mb-3 g-0 border-top pt-2" style={{ borderColor: '#f3f4f6' }}>
                        <Col xs="4">
                          <div className="text-muted small" style={{ fontSize: '10px' }}>CHECK-IN</div>
                          {todayAttendance?.sessions && todayAttendance.sessions.length > 0 ? (
                            todayAttendance.sessions.map((s, i) => (
                              <div key={i} className="fw-bold mt-1" style={{ fontSize: '11px' }}>{s.in_time}</div>
                            ))
                          ) : (
                            <div className="fw-bold mt-1" style={{ fontSize: '11px' }}>{todayAttendance?.in_time || '—'}</div>
                          )}
                        </Col>
                        <Col xs="4" className="text-center">
                          <div className="text-muted small" style={{ fontSize: '10px' }}>CHECK-OUT</div>
                          {todayAttendance?.sessions && todayAttendance.sessions.length > 0 ? (
                            todayAttendance.sessions.map((s, i) => (
                              <div key={i} className="fw-bold mt-1" style={{ fontSize: '11px' }}>{s.out_time || 'Active'}</div>
                            ))
                          ) : (
                            <div className="fw-bold mt-1" style={{ fontSize: '11px' }}>{todayAttendance?.out_time || '—'}</div>
                          )}
                        </Col>
                        <Col xs="4" className="text-end">
                          <div className="text-muted small" style={{ fontSize: '10px' }}>HOURS</div>
                          <div className="fw-bold mt-1 text-primary" style={{ fontSize: '11px' }}>
                            {calculateTotalWorkingHours(todayAttendance, payrollConfig)}
                          </div>
                        </Col>
                      </Row>
                    </div>

                    <div className="d-flex align-items-center justify-content-end gap-2 pt-2 border-top mt-auto" style={{ borderColor: '#f3f4f6' }}>
                      {!todayAttendance ? (
                        <>
                          <Button
                            variant="none"
                            size="sm"
                            className="btn-icon btn-icon-only rounded-circle custom-btn-primary-outline"
                            onClick={() => handleAction(staff, 'checkin')}
                            disabled={actionsDisabled}
                            title="Check-In"
                          >
                            <CsLineIcons icon="login" size="14" />
                          </Button>
                          <Button
                            variant="none"
                            size="sm"
                            className="btn-icon btn-icon-only rounded-circle custom-btn-danger-outline"
                            onClick={() => handleAction(staff, 'absent')}
                            disabled={actionsDisabled}
                            title="Absent"
                          >
                            <CsLineIcons icon="close-circle" size="14" />
                          </Button>
                          <Button
                            variant="none"
                            size="sm"
                            className="btn-icon btn-icon-only rounded-circle custom-btn-info-outline"
                            onClick={() => handleAction(staff, 'leave')}
                            disabled={actionsDisabled}
                            title="Leave"
                          >
                            <CsLineIcons icon="calendar" size="14" />
                          </Button>
                        </>
                      ) : isCurrentlyCheckedIn(todayAttendance) ? (
                        <Button
                          variant="none"
                          size="sm"
                          className="btn-icon btn-icon-only rounded-circle custom-btn-primary-outline me-auto"
                          onClick={() => handleAction(staff, 'checkout')}
                          disabled={actionsDisabled}
                          title="Check-Out"
                        >
                          <CsLineIcons icon="logout" size="14" />
                        </Button>
                      ) : todayAttendance.status === 'present' ? (
                        <Button
                          variant="none"
                          size="sm"
                          className="btn-icon btn-icon-only rounded-circle custom-btn-primary-outline me-auto"
                          onClick={() => handleAction(staff, 'checkin')}
                          disabled={actionsDisabled}
                          title="Check-In Again"
                        >
                          <CsLineIcons icon="login" size="14" />
                        </Button>
                      ) : (
                        <span
                          className={`small fw-bold d-flex align-items-center gap-1 me-auto ${
                            todayAttendance.status === 'absent' ? 'text-danger' : todayAttendance.status === 'leave' ? 'text-info' : 'text-success'
                          }`}
                        >
                          <CsLineIcons
                            icon={todayAttendance.status === 'absent' ? 'close-circle' : todayAttendance.status === 'leave' ? 'calendar' : 'check'}
                            size="14"
                          />
                          {todayAttendance.status === 'absent' ? 'Absent' : todayAttendance.status === 'leave' ? 'On Leave' : 'Marked'}
                        </span>
                      )}
                      {todayAttendance && (
                        <Button
                          variant="none"
                          size="sm"
                          className="btn-icon btn-icon-only rounded-circle custom-btn-primary-outline"
                          onClick={() => handleOpenDetailModal(todayAttendance, staff._id)}
                          title="Edit Attendance"
                        >
                          <CsLineIcons icon="edit" size="14" />
                        </Button>
                      )}
                      <Button
                        variant="none"
                        size="sm"
                        className="btn-icon btn-icon-only rounded-circle custom-btn-primary-outline"
                        onClick={() => history.push(`/staff/attendance/view/${staff._id}`)}
                        title="View History"
                      >
                        <CsLineIcons icon="eye" size="14" />
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            );
          })}
          {page.length === 0 && <div className="text-center py-5 w-100 text-muted fw-bold">No staff members found matching the search.</div>}
        </Row>

        <Row className="mt-4">
          <Col xs="12">
            <TablePagination tableInstance={tableInstance} />
          </Col>
        </Row>
      </div>
      
      <Modal show={showActionModal} onHide={() => setShowActionModal(false)} centered className="rounded-4">
        <Modal.Header closeButton className="border-0">
          <Modal.Title className="fw-bold">
            {actionType === 'checkin' && 'Confirm Check-In'}
            {actionType === 'checkout' && 'Confirm Check-Out'}
            {actionType === 'absent' && 'Mark as Absent'}
            {actionType === 'leave' && 'Record Leave'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="py-4">
          {selectedStaff && (
            <div className="text-center">
              <div className={`bg-soft-${actionType === 'absent' ? 'danger' : 'primary'} d-inline-flex p-4 rounded-circle mb-3`}>
                <CsLineIcons
                  icon={actionType === 'checkin' ? 'login' : actionType === 'checkout' ? 'logout' : actionType === 'leave' ? 'calendar' : 'close-circle'}
                  size="48"
                  className={`text-${actionType === 'absent' ? 'danger' : 'primary'}`}
                />
              </div>
              <h5 className="fw-bold mb-2">
                {selectedStaff.f_name} {selectedStaff.l_name}
              </h5>
              <p className="text-muted mb-4">
                Are you sure you want to{' '}
                {actionType === 'checkin' ? 'check-in' : actionType === 'checkout' ? 'check-out' : actionType === 'leave' ? 'mark on leave' : 'mark as absent'}{' '}
                this staff member for {formatDateDisplay(targetDate)}?
              </p>

              {actionType === 'leave' && (
                <div className="text-start mt-3 glass-card p-4 border-0 shadow-none bg-light">
                  <Form.Group className="mb-4">
                    <Form.Label className="small fw-bold text-uppercase letter-spacing-1 text-muted">Leave Reason / Type</Form.Label>
                    <Form.Select className="rounded-3 border-0 shadow-sm py-2" value={selectedLeaveType} onChange={(e) => setSelectedLeaveType(e.target.value)}>
                      {leaveTypes.map((lt) => (
                        <option key={lt.leave_type_id} value={lt.leave_type_id}>
                          {lt.name} ({lt.short_code})
                        </option>
                      ))}
                      {leaveTypes.length === 0 && <option value="other">Other Leave</option>}
                    </Form.Select>
                  </Form.Group>
                  <Form.Group>
                    <Form.Check
                      type="switch"
                      id="half-day-switch"
                      label="Mark as Half Day"
                      className="fw-bold text-dark"
                      checked={isHalfDay}
                      onChange={(e) => setIsHalfDay(e.target.checked)}
                    />
                  </Form.Group>
                </div>
              )}

              {actionType !== 'absent' && actionType !== 'leave' && (
                <div className="d-flex align-items-center justify-content-center gap-2 text-primary fw-bold bg-soft-primary py-2 px-3 rounded-pill d-inline-flex">
                  <CsLineIcons icon="clock" size="18" />
                  <span>Time: {getCurrentTime()}</span>
                </div>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0 d-flex gap-3 pt-0">
          <Button
            variant="none"
            className="custom-btn-primary-outline flex-grow-1"
            onClick={() => setShowActionModal(false)}
            disabled={loading.actions.checkin || loading.actions.checkout || loading.actions.absent || loading.actions.leave}
          >
            Cancel
          </Button>
          <Button
            className={`${actionType === 'absent' ? 'custom-btn-danger-outline' : 'custom-btn-solid'} flex-grow-1`}
            onClick={confirmAction}
            disabled={loading.actions.checkin || loading.actions.checkout || loading.actions.absent || loading.actions.leave}
          >
            {loading.actions.checkin || loading.actions.checkout || loading.actions.absent || loading.actions.leave ? (
              <Spinner animation="border" size="sm" />
            ) : (
              'Confirm Action'
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showDetailModal} onHide={() => setShowDetailModal(false)} centered className="rounded-4">
        <Modal.Header closeButton className="border-0">
          <Modal.Title className="fw-bold">{isEditing ? 'Edit Attendance' : 'Record Details'}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="py-4">
          {selectedAttendance && (
            isEditing ? (
              <Form className="text-start">
                <h4 className="fw-bold text-center mb-1">{formatDateDisplay(selectedAttendance.date || targetDate)}</h4>
                <p className="text-muted text-center fw-medium mb-4">
                  {new Date(selectedAttendance.date || targetDate).toLocaleDateString('en-IN', { weekday: 'long' })}
                </p>
                
                <Form.Group className="mb-3">
                  <Form.Label className="small fw-bold text-uppercase letter-spacing-1 text-muted">Attendance Status</Form.Label>
                  <Form.Select className="rounded-3 border-0 shadow-sm py-2 px-3 fw-bold text-dark" value={editStatus} onChange={(e) => setEditStatus(e.target.value)}>
                    <option value="present">Present</option>
                    <option value="absent">Absent</option>
                    <option value="half_day">Half Day</option>
                    <option value="leave">On Leave</option>
                    <option value="week_off">Week Off</option>
                    <option value="holiday">Holiday</option>
                    <option value="comp_off">Comp Off</option>
                  </Form.Select>
                </Form.Group>

                {(editStatus === 'present' || editStatus === 'half_day') && (
                  <Row className="g-3 mb-3">
                    <Col xs={6}>
                      <Form.Group>
                        <Form.Label className="small fw-bold text-uppercase letter-spacing-1 text-muted">Check-In Time</Form.Label>
                        <Form.Control 
                          type="time" 
                          className="rounded-3 border-0 shadow-sm py-2 px-3 fw-bold text-dark"
                          value={editInTime} 
                          onChange={(e) => setEditInTime(e.target.value)} 
                        />
                      </Form.Group>
                    </Col>
                    <Col xs={6}>
                      <Form.Group>
                        <Form.Label className="small fw-bold text-uppercase letter-spacing-1 text-muted">Check-Out Time</Form.Label>
                        <Form.Control 
                          type="time" 
                          className="rounded-3 border-0 shadow-sm py-2 px-3 fw-bold text-dark"
                          value={editOutTime} 
                          onChange={(e) => setEditOutTime(e.target.value)} 
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                )}

                {(editStatus === 'leave' || editStatus === 'half_day') && (
                  <Form.Group className="mb-3">
                    <Form.Label className="small fw-bold text-uppercase letter-spacing-1 text-muted">Leave Type</Form.Label>
                    <Form.Select className="rounded-3 border-0 shadow-sm py-2 px-3 fw-bold text-dark" value={editLeaveType} onChange={(e) => setEditLeaveType(e.target.value)}>
                      {leaveTypes.map((lt) => (
                        <option key={lt.leave_type_id} value={lt.leave_type_id}>
                          {lt.name} ({lt.short_code})
                        </option>
                      ))}
                      {leaveTypes.length === 0 && <option value="other">Other Leave</option>}
                    </Form.Select>
                  </Form.Group>
                )}

                <Form.Group className="mb-3">
                  <Form.Label className="small fw-bold text-uppercase letter-spacing-1 text-muted">Reason for manual edit</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    className="rounded-3 border-0 shadow-sm py-2 px-3 fw-bold text-dark"
                    placeholder="E.g., Forgot to check out"
                    value={editReason}
                    onChange={(e) => setEditReason(e.target.value)}
                  />
                </Form.Group>
              </Form>
            ) : (
              <div className="text-center">
                <div className={`bg-soft-${selectedAttendance.status === 'present' ? 'success' : 'danger'} d-inline-flex p-4 rounded-circle mb-3`}>
                  <CsLineIcons icon={selectedAttendance.status === 'present' ? 'check-circle' : 'close-circle'} size="48" className={`text-${selectedAttendance.status === 'present' ? 'success' : 'danger'}`} />
                </div>
                <h4 className="fw-bold mb-1">{formatDateDisplay(selectedAttendance.date || targetDate)}</h4>
                <p className="text-muted fw-medium">{new Date(selectedAttendance.date || targetDate).toLocaleDateString('en-IN', { weekday: 'long' })}</p>
                
                <div className="glass-card bg-light border-0 p-4 mt-4 text-start">
                  <Row className="g-4">
                    <Col xs={6}>
                      <div className="small fw-bold text-muted text-uppercase mb-1">Check-In</div>
                      <div className="fw-bold text-dark h5 mb-0 d-flex align-items-center gap-2">
                        <CsLineIcons icon="login" size="18" className="text-success" />
                        {selectedAttendance.in_time || '—'}
                      </div>
                    </Col>
                    <Col xs={6}>
                      <div className="small fw-bold text-muted text-uppercase mb-1">Check-Out</div>
                      <div className="fw-bold text-dark h5 mb-0 d-flex align-items-center gap-2">
                        <CsLineIcons icon="logout" size="18" className="text-danger" />
                        {selectedAttendance.out_time || '—'}
                      </div>
                    </Col>
                    {selectedAttendance.status === 'leave' && (
                      <Col xs={12}>
                        <div className="small fw-bold text-muted text-uppercase mb-1">Leave Type</div>
                        <div className="fw-bold text-info h5 mb-0 d-flex align-items-center gap-2">
                          <CsLineIcons icon="calendar" size="18" className="text-info" />
                          {(() => {
                            const leaveType = leaveTypes.find((lt) => lt.leave_type_id === selectedAttendance.leave_type_id);
                            return leaveType ? `${leaveType.name} (${leaveType.short_code})` : 'On Leave';
                          })()}
                        </div>
                      </Col>
                    )}
                    {selectedAttendance.manual_entry_reason && (
                      <Col xs={12}>
                        <div className="small fw-bold text-muted text-uppercase mb-1">Edit Reason</div>
                        <div className="text-dark fw-medium" style={{ fontSize: '0.85rem' }}>
                          {selectedAttendance.manual_entry_reason}
                        </div>
                      </Col>
                    )}
                    <Col xs={12}>
                      <div className="small fw-bold text-muted text-uppercase mb-1">Total Duration</div>
                      <div className="fw-bold text-primary h4 mb-0 d-flex align-items-center gap-2">
                        <CsLineIcons icon="clock" size="24" />
                        {(() => {
                          const h = calculateTotalWorkingHours(selectedAttendance, payrollConfig);
                          return h && h !== '—' ? h : '—';
                        })()}
                      </div>
                    </Col>
                  </Row>
                </div>
              </div>
            )
          )}
        </Modal.Body>
        <Modal.Footer className="border-0">
          {isEditing ? (
            <div className="d-flex gap-3 w-100">
              <Button variant="none" className="custom-btn-primary-outline flex-grow-1 py-3" onClick={() => setIsEditing(false)} disabled={submittingEdit}>
                Cancel
              </Button>
              <Button className="custom-btn-solid flex-grow-1 py-3" onClick={handleSaveEdit} disabled={submittingEdit}>
                {submittingEdit ? <Spinner animation="border" size="sm" /> : 'Save Changes'}
              </Button>
            </div>
          ) : (
            <div className="d-flex gap-3 w-100">
              <Button variant="none" className="custom-btn-primary-outline flex-grow-1 py-3" onClick={() => setIsEditing(true)}>
                <CsLineIcons icon="edit" size="14" className="me-2" /> Edit
              </Button>
              <Button className="custom-btn-solid flex-grow-1 py-3" onClick={() => setShowDetailModal(false)}>
                Close
              </Button>
            </div>
          )}
        </Modal.Footer>
      </Modal>
    </div>
  );
}
