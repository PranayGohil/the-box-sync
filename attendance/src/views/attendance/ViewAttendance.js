import React, { useEffect, useState, useMemo } from 'react';
import { useHistory } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';
import {
  Row, Col, Card, Button, Alert, Spinner, Form, Badge,
  Modal, ProgressBar, Toast, ToastContainer,
} from 'react-bootstrap';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import Select from 'react-select';

const customStyles = `
  .glass-card {
    background: #ffffff !important;
    border: 1px solid #f0f0f0 !important;
    border-radius: 1.5rem !important;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.04) !important;
    transition: all 0.3s ease;
  }
  .glass-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 15px 45px rgba(0, 0, 0, 0.06) !important;
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
  .custom-btn-success-outline {
    border: 1px solid #10b981 !important;
    color: #10b981 !important;
    background-color: #fff !important;
    transition: all 0.2s ease-in-out !important;
    border-radius: 50px !important;
    font-weight: 600 !important;
    font-size: 0.85rem !important;
  }
  .custom-btn-success-outline:hover {
    background-color: #10b981 !important;
    color: #fff !important;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.25) !important;
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
    box-shadow: 0 4px 12px rgba(239, 68, 68, 0.25) !important;
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
    box-shadow: 0 4px 12px rgba(14, 165, 233, 0.25) !important;
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
  .stat-card {
    position: relative;
    overflow: hidden;
  }
  .stat-card::after {
    content: '';
    position: absolute;
    top: -50%;
    right: -50%;
    width: 100px;
    height: 100px;
    background: rgba(30, 168, 231, 0.05);
    border-radius: 50%;
    z-index: 0;
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
  .fc .fc-button-primary {
    background-color: #1ea8e7 !important;
    border-color: #1ea8e7 !important;
    border-radius: 50px !important;
    font-weight: 600 !important;
    padding: 0.5rem 1.25rem !important;
  }
  .fc .fc-toolbar-title {
    font-weight: 700 !important;
    color: #1ea8e7 !important;
  }
  .fc .fc-daygrid-day-number {
    font-weight: 600 !important;
    color: #64748b !important;
  }
  
  table.react-table.rows {
    border-collapse: separate !important;
    border-spacing: 0 12px !important;
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
  
  .calendar-container {
    padding: 1rem !important;
    border-radius: 1.5rem !important;
  }
  .fc {
    font-family: inherit !important;
  }
  .fc .fc-toolbar {
    margin-bottom: 1.5rem !important;
  }
  .fc .fc-button {
    background: #ffffff !important;
    border: 1.5px solid #edf2f7 !important;
    color: #475569 !important;
    border-radius: 50px !important;
    font-weight: 600 !important;
    padding: 0.4rem 1rem !important;
    font-size: 0.85rem !important;
    transition: all 0.2s ease !important;
    box-shadow: 0 2px 5px rgba(0,0,0,0.02) !important;
  }
  .fc .fc-button:hover {
    background: #edf2f7 !important;
    border-color: #cbd5e1 !important;
    color: #1e293b !important;
  }
  .fc .fc-button-active {
    background: #1ea8e7 !important;
    border-color: #1ea8e7 !important;
    color: #ffffff !important;
    box-shadow: 0 4px 10px rgba(30, 168, 231, 0.2) !important;
  }
  .fc .fc-button-primary:not(:disabled).fc-button-active, 
  .fc .fc-button-primary:not(:disabled):active {
    background: #1ea8e7 !important;
    border-color: #1ea8e7 !important;
    color: #ffffff !important;
  }
  .fc .fc-col-header-cell {
    background: #f8fafc !important;
    padding: 0.75rem 0 !important;
    font-weight: 700 !important;
    text-transform: uppercase !important;
    font-size: 0.75rem !important;
    letter-spacing: 0.05em !important;
    color: #64748b !important;
    border: 1px solid #e2e8f0 !important;
  }
  .fc td, .fc th {
    border-color: #edf2f7 !important;
  }
  .fc .fc-daygrid-day:hover {
    background-color: rgba(30, 168, 231, 0.02) !important;
  }
  .fc .fc-daygrid-day.fc-day-today {
    background-color: rgba(30, 168, 231, 0.05) !important;
  }
  .fc-event {
    border-radius: 8px !important;
    border: none !important;
    padding: 0.2rem 0.4rem !important;
    font-size: 0.75rem !important;
    font-weight: 700 !important;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05) !important;
  }
  
  .filter-pill-input {
    border-radius: 50px !important;
    padding: 0.6rem 1.25rem !important;
    border: 1.5px solid #edf2f7 !important;
    background-color: #f8fafc !important;
    color: #475569 !important;
    font-size: 0.85rem !important;
    font-weight: 600 !important;
    height: 44px !important;
    transition: all 0.25s ease-in-out !important;
    box-shadow: none !important;
  }
  .filter-pill-input:focus {
    border-color: #1ea8e7 !important;
    background-color: #ffffff !important;
    box-shadow: 0 0 0 3px rgba(30, 168, 231, 0.15) !important;
    outline: none !important;
  }
  .filter-pill-input.form-select {
    cursor: pointer !important;
    background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='none' stroke='%231ea8e7' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M2 5l6 6 6-6'/%3e%3c/svg%3e") !important;
    background-size: 12px 12px !important;
  }
  .filter-pill-input::-webkit-calendar-picker-indicator {
    cursor: pointer !important;
    filter: invert(53%) sepia(82%) saturate(1987%) hue-rotate(176deg) brightness(97%) contrast(93%);
    opacity: 0.8;
    transition: opacity 0.2s ease;
  }
  .filter-pill-input::-webkit-calendar-picker-indicator:hover {
    opacity: 1;
  }

  /* react-select custom styling overrides */
  .react-select__control {
    border-radius: 50px !important;
    border: 1.5px solid #edf2f7 !important;
    background-color: #f8fafc !important;
    height: 44px !important;
    min-height: 44px !important;
    box-shadow: none !important;
    transition: all 0.25s ease-in-out !important;
    cursor: pointer !important;
  }
  .react-select__control:hover {
    border-color: #cbd5e1 !important;
  }
  .react-select__control--is-focused {
    border-color: #1ea8e7 !important;
    background-color: #ffffff !important;
    box-shadow: 0 0 0 3px rgba(30, 168, 231, 0.15) !important;
  }
  .react-select__value-container {
    padding-left: 1.25rem !important;
    background-color: transparent !important;
  }
  .react-select__indicators-container {
    padding-right: 0.5rem !important;
    background-color: transparent !important;
  }
  .react-select__indicator {
    color: #1ea8e7 !important;
    padding: 4px !important;
  }
  .react-select__indicator:hover {
    color: #1ea8e7 !important;
  }
  .react-select__indicator-separator {
    display: none !important;
  }
  .react-select__single-value {
    color: #475569 !important;
    font-weight: 600 !important;
    font-size: 0.85rem !important;
  }
  .react-select__placeholder {
    color: #94a3b8 !important;
    font-weight: 600 !important;
    font-size: 0.85rem !important;
  }
  .react-select__menu {
    border-radius: 12px !important;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.08) !important;
    border: 1px solid #e2e8f0 !important;
    overflow: hidden !important;
    z-index: 9999 !important;
    margin-top: 4px !important;
  }
  .react-select__option {
    cursor: pointer !important;
    font-size: 0.85rem !important;
    font-weight: 600 !important;
    padding: 0.6rem 1.25rem !important;
    color: #475569 !important;
  }
  .react-select__option--is-focused {
    background-color: rgba(30, 168, 231, 0.08) !important;
    color: #475569 !important;
  }
  .react-select__option--is-selected {
    background-color: #1ea8e7 !important;
    color: #ffffff !important;
  }

  @media (max-width: 767.98px) {
    .page-title-container {
      margin-top: 2rem !important;
    }
    .filter-pill-input {
      font-size: 0.8rem !important;
      padding: 0.5rem 1rem !important;
      height: 38px !important;
      border-radius: 20px !important;
    }
    .react-select__control {
      height: 38px !important;
      min-height: 38px !important;
      border-radius: 20px !important;
    }
    .react-select__value-container {
      padding-left: 1rem !important;
    }
    .react-select__single-value,
    .react-select__placeholder {
      font-size: 0.8rem !important;
    }
    .fc .fc-toolbar {
      flex-direction: column !important;
      gap: 0.75rem !important;
      align-items: center !important;
    }
    .fc .fc-toolbar-chunk {
      display: flex !important;
      justify-content: center !important;
      width: 100% !important;
      flex-wrap: wrap !important;
      gap: 0.25rem !important;
    }
    .fc .fc-toolbar-title {
      font-size: 1.1rem !important;
      text-align: center !important;
      margin: 0.25rem 0 !important;
    }
    .fc .fc-button {
      padding: 0.35rem 0.65rem !important;
      font-size: 0.7rem !important;
      min-height: 28px !important;
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
    }
    .calendar-container {
      padding: 0.25rem !important;
    }
    .fc .fc-col-header-cell {
      padding: 0.35rem 0 !important;
      font-size: 0.65rem !important;
    }
    .fc .fc-daygrid-day-number {
      font-size: 0.7rem !important;
      padding: 2px 4px !important;
    }
    .fc-event {
      font-size: 0.65rem !important;
      padding: 1px 3px !important;
      border-radius: 4px !important;
    }
  }
`;

const ViewAttendance = () => {
  const { currentUser } = useSelector((state) => state.auth);
  const id = currentUser?._id;
  const history = useHistory();

  const main_title = 'My Attendance History';
  const description = 'Track your logged check-in and check-out logs.';

  const [staffData, setStaffData] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [attendanceEvents, setAttendanceEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [leaveTypes, setLeaveTypes] = useState([]);

  const statusOptions = [
    { value: 'all', label: 'All Records' },
    { value: 'present', label: 'Present' },
    { value: 'absent', label: 'Absent' },
  ];

  const selectStyles = {
    control: (provided, state) => ({
      ...provided,
      borderRadius: window.innerWidth <= 767.98 ? '20px' : '50px',
      border: state.isFocused ? '1.5px solid #1ea8e7' : '1.5px solid #edf2f7',
      backgroundColor: '#f8fafc',
      color: '#475569',
      fontSize: window.innerWidth <= 767.98 ? '0.8rem' : '0.85rem',
      fontWeight: '600',
      height: window.innerWidth <= 767.98 ? '38px' : '44px',
      minHeight: window.innerWidth <= 767.98 ? '38px' : '44px',
      paddingLeft: '0.5rem',
      paddingRight: '0.5rem',
      boxShadow: state.isFocused ? '0 0 0 3px rgba(30, 168, 231, 0.15)' : 'none',
      transition: 'all 0.25s ease-in-out',
      cursor: 'pointer',
      '&:hover': {
        borderColor: state.isFocused ? '#1ea8e7' : '#cbd5e1',
      },
    }),
    valueContainer: (provided) => ({
      ...provided,
      backgroundColor: '#f8fafc',
      borderRadius: window.innerWidth <= 767.98 ? '20px' : '50px',
      paddingLeft: '4px',
    }),
    indicatorsContainer: (provided) => ({
      ...provided,
      backgroundColor: '#f8fafc',
      borderRadius: window.innerWidth <= 767.98 ? '20px' : '50px',
    }),
    singleValue: (provided) => ({
      ...provided,
      color: '#475569',
      fontWeight: '600',
    }),
    placeholder: (provided) => ({
      ...provided,
      color: '#94a3b8',
      fontWeight: '600',
    }),
    dropdownIndicator: (provided) => ({
      ...provided,
      color: '#1ea8e7',
      padding: '4px',
      '&:hover': {
        color: '#1ea8e7',
      }
    }),
    indicatorSeparator: () => ({
      display: 'none',
    }),
    menu: (provided) => ({
      ...provided,
      borderRadius: '12px',
      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.08)',
      border: '1px solid #e2e8f0',
      overflow: 'hidden',
      zIndex: 9999,
      marginTop: '4px',
    }),
    menuPortal: (provided) => ({
      ...provided,
      zIndex: 9999,
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected 
        ? '#1ea8e7' 
        : state.isFocused 
        ? 'rgba(30, 168, 231, 0.08)' 
        : '#ffffff',
      color: state.isSelected ? '#ffffff' : '#475569',
      cursor: 'pointer',
      fontSize: '0.85rem',
      fontWeight: '600',
      padding: '0.6rem 1.25rem',
      '&:active': {
        backgroundColor: '#1ea8e7',
        color: '#ffffff',
      }
    }),
  };

  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedAttendance, setSelectedAttendance] = useState(null);

  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportType, setExportType] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportOptions, setExportOptions] = useState({
    includeStaffInfo: true,
    includeStatistics: true,
    includeDetailedRecords: true,
    includeCharts: true,
    recordsLimit: 'all',
  });

  // Regularization State
  const [showRegModal, setShowRegModal] = useState(false);
  const [regForm, setRegForm] = useState({ date: '', in_time: '', out_time: '', reason: '' });
  const [regLoading, setRegLoading] = useState(false);

  const handleRegSubmit = (e) => {
    e.preventDefault();
    setRegLoading(true);
    setTimeout(() => {
      const existing = JSON.parse(localStorage.getItem('regularization_requests') || '[]');
      existing.push({
        id: Date.now(),
        staff_id: staffData?.staff_id || currentUser?._id,
        f_name: staffData?.f_name || currentUser?.f_name,
        l_name: staffData?.l_name || currentUser?.l_name,
        ...regForm,
        status: 'Pending',
        submittedAt: new Date().toISOString()
      });
      localStorage.setItem('regularization_requests', JSON.stringify(existing));
      
      setRegLoading(false);
      setShowRegModal(false);
      setToastMessage('Regularization request submitted successfully!');
      setShowToast(true);
      setRegForm({ date: '', in_time: '', out_time: '', reason: '' });
    }, 1000);
  };

  const breadcrumbs = [
    { to: '', text: 'Home' },
    { to: 'dashboard', text: 'Dashboard' },
    { to: 'attendance', text: 'My Attendance' },
  ];

  const authHeader = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
  });

  const calculateWorkingHours = (inTime, outTime) => {
    if (!inTime || !outTime) return null;
    const parseTime = (timeStr) => {
      const [time, period] = timeStr.split(' ');
      let [hours, minutes] = time.split(':').map(Number);
      if (period === 'PM' && hours !== 12) hours += 12;
      else if (period === 'AM' && hours === 12) hours = 0;
      return { hours, minutes };
    };
    const inParsed = parseTime(inTime);
    const outParsed = parseTime(outTime);
    let totalMinutes =
      outParsed.hours * 60 + outParsed.minutes -
      (inParsed.hours * 60 + inParsed.minutes);
    if (totalMinutes < 0) totalMinutes += 24 * 60;
    return { hours: Math.floor(totalMinutes / 60), minutes: totalMinutes % 60, total: totalMinutes / 60 };
  };

  const isOvernightShift = (inTime, outTime) => {
    if (!inTime || !outTime) return false;
    const [inHour] = inTime.split(':').map(Number);
    const [outHour] = outTime.split(':').map(Number);
    return inHour >= 18 && outHour < 12;
  };

  const getCheckoutDisplayDate = (checkInDate, inTime, outTime) => {
    if (!isOvernightShift(inTime, outTime)) return null;
    const date = new Date(checkInDate);
    date.setDate(date.getDate() + 1);
    return date.toISOString().split('T')[0];
  };

  const formatDateDisplay = (dateString) => {
    const [year, month, day] = dateString.split('-');
    return `${day}-${month}-${year}`;
  };

  const showSuccessToast = (message) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const filteredAttendance = attendance.filter((att) => {
    if (startDate || endDate) {
      const date = new Date(att.date);
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        if (date < start) return false;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (date > end) return false;
      }
    } else {
      const recordDate = new Date(att.date);
      const today = new Date();
      if (recordDate.getMonth() !== today.getMonth() || recordDate.getFullYear() !== today.getFullYear()) {
        return false;
      }
    }
    if (statusFilter !== 'all' && att.status !== statusFilter) return false;
    return true;
  });

  const stats = useMemo(() => {
    const present = filteredAttendance.filter((a) => a.status === 'present').length;
    const absent = filteredAttendance.filter((a) => a.status === 'absent').length;
    const total = filteredAttendance.length;

    let totalHours = 0;
    let validShifts = 0;
    filteredAttendance.forEach((att) => {
      const hours = calculateWorkingHours(att.in_time, att.out_time);
      if (hours) { totalHours += hours.total; validShifts++; }
    });

    return {
      totalPresent: present,
      totalAbsent: absent,
      totalDays: total,
      attendanceRate: total > 0 ? ((present / total) * 100).toFixed(1) : '0',
      avgHoursWorked: validShifts > 0 ? (totalHours / validShifts).toFixed(1) : '0',
    };
  }, [filteredAttendance]);

  const fetchAttendance = async () => {
    try {
      if (!id) return;
      setLoading(true);
      setError(null);
      const [response, polRes] = await Promise.all([
        axios.get(`${process.env.REACT_APP_API}/attendance/get/${id}`, authHeader()),
        axios.get(`${process.env.REACT_APP_API}/leave-policy`, authHeader())
      ]);

      const { attendance: records, ...staff } = response.data.data;
      const types = (polRes.data?.success && polRes.data?.data?.leave_types) ? polRes.data.data.leave_types : [];

      setStaffData(staff);
      setAttendance(records || []);
      setLeaveTypes(types);

      const events = (records || []).map((att) => {
        let title = '';
        let backgroundColor = '';

        if (att.status === 'present') {
          const hours = calculateWorkingHours(att.in_time, att.out_time);
          const overnight = isOvernightShift(att.in_time, att.out_time);
          if (att.in_time && att.out_time && hours) {
            title = `${overnight ? '🌙 ' : ''}${hours.hours}h ${hours.minutes}m`;
            backgroundColor = overnight ? '#6366f1' : '#10b981';
          } else if (att.in_time && !att.out_time) {
            title = '⏳ In Progress';
            backgroundColor = '#f59e0b';
          } else {
            title = '✓ Present';
            backgroundColor = '#10b981';
          }
        } else if (att.status === 'absent') {
          title = '✗ Absent';
          backgroundColor = '#ef4444';
        } else if (att.status === 'leave') {
          const leaveType = types.find((lt) => lt.leave_type_id === att.leave_type_id);
          title = leaveType ? `🍃 ${leaveType.name}` : '🍃 On Leave';
          backgroundColor = '#0ea5e9';
        } else if (att.status === 'half_day') {
          const leaveType = types.find((lt) => lt.leave_type_id === att.leave_type_id);
          title = leaveType ? `🌓 Half Day: ${leaveType.name}` : '🌓 Half Day';
          backgroundColor = '#f59e0b';
        } else if (att.status === 'week_off') {
          title = '🏖 Week Off';
          backgroundColor = '#94a3b8';
        } else if (att.status === 'holiday') {
          title = '🎉 Holiday';
          backgroundColor = '#ec4899';
        }

        return {
          title,
          date: att.date,
          backgroundColor,
          borderColor: backgroundColor,
          textColor: '#ffffff',
          extendedProps: { attendance: att },
        };
      });

      setAttendanceEvents(events);
    } catch (err) {
      console.error('Error fetching attendance:', err);
      setError('Failed to load attendance data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [id]);

  const handleEventClick = (clickInfo) => {
    setSelectedAttendance(clickInfo.event.extendedProps.attendance);
    setShowDetailModal(true);
  };

  const exportToExcel = async () => {
    if (!staffData) return;
    setExporting(true); setExportProgress(10); setExportType('Excel');
    try {
      const wb = XLSX.utils.book_new();

      if (exportOptions.includeStatistics) {
        setExportProgress(20);
        const dashboardData = [
          ['ATTENDANCE REPORT DASHBOARD'], [],
          ['Staff Information'],
          ['Staff ID:', staffData.staff_id],
          ['Name:', `${staffData.f_name} ${staffData.l_name}`],
          ['Position:', staffData.position],
          ['Report Generated:', format(new Date(), 'dd MMM yyyy HH:mm')],
          [], ['KEY METRICS'], ['Metric', 'Value'],
          ['Total Days', stats.totalDays],
          ['Total Present', stats.totalPresent],
          ['Total Absent', stats.totalAbsent],
          ['Attendance Rate', `${stats.attendanceRate}%`],
          ['Avg Hours/Day', `${stats.avgHoursWorked} hours`],
        ];
        const dashboardSheet = XLSX.utils.aoa_to_sheet(dashboardData);
        dashboardSheet['!cols'] = [{ wch: 25 }, { wch: 30 }];
        XLSX.utils.book_append_sheet(wb, dashboardSheet, 'Dashboard');
      }

      if (exportOptions.includeDetailedRecords) {
        setExportProgress(50);
        const records = exportOptions.recordsLimit === 'all'
          ? filteredAttendance
          : filteredAttendance.slice(0, parseInt(exportOptions.recordsLimit, 10));

        const data = [
          ['ATTENDANCE RECORDS'], [],
          ['Check-In Date', 'Status', 'Check-In Time', 'Check-Out Time', 'Check-Out Date', 'Working Hours', 'Shift Type'],
        ];
        records.forEach((att) => {
          const hours = calculateWorkingHours(att.in_time, att.out_time);
          const overnight = isOvernightShift(att.in_time, att.out_time);
          const checkoutDate = overnight ? getCheckoutDisplayDate(att.date, att.in_time, att.out_time) : null;
          data.push([
            formatDateDisplay(att.date),
            att.status.toUpperCase(),
            att.in_time || '-',
            att.out_time || '-',
            checkoutDate ? formatDateDisplay(checkoutDate) : 'Same Day',
            hours ? `${hours.hours}h ${hours.minutes}m` : '-',
            overnight ? 'Night Shift' : 'Day Shift',
          ]);
        });

        const sheet = XLSX.utils.aoa_to_sheet(data);
        sheet['!cols'] = [{ wch: 18 }, { wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 18 }, { wch: 15 }, { wch: 15 }];
        XLSX.utils.book_append_sheet(wb, sheet, 'Attendance Records');
      }

      setExportProgress(90);
      XLSX.writeFile(wb, `${staffData.staff_id}_Attendance_Report.xlsx`);
      setExportProgress(100);
      showSuccessToast('Excel report exported successfully!');
    } catch (err) {
      console.error(err);
      showSuccessToast('Error exporting Excel file');
    } finally {
      setTimeout(() => { setExporting(false); setExportProgress(0); setExportType(''); }, 500);
    }
  };

  const exportToPDF = async () => {
    if (!staffData) return;
    setExporting(true); setExportProgress(10); setExportType('PDF');
    try {
      const doc = new jsPDF();
      let yPosition = 20;

      if (exportOptions.includeStaffInfo) {
        setExportProgress(20);
        doc.setFillColor(30, 168, 231);
        doc.rect(0, 0, 210, 40, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(24); doc.setFont(undefined, 'bold');
        doc.text('ATTENDANCE REPORT', 105, 20, { align: 'center' });
        doc.setFontSize(14); doc.setFont(undefined, 'normal');
        doc.text(`${staffData.f_name} ${staffData.l_name}`, 105, 30, { align: 'center' });
        yPosition = 50;
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(11);
        doc.text(`Staff ID: ${staffData.staff_id}`, 20, yPosition); yPosition += 6;
        doc.text(`Position: ${staffData.position}`, 20, yPosition); yPosition += 6;
        doc.text(`Report Generated: ${format(new Date(), 'dd MMM yyyy HH:mm')}`, 20, yPosition); yPosition += 15;
      }

      if (exportOptions.includeStatistics) {
        setExportProgress(35);
        doc.setFontSize(16); doc.setFont(undefined, 'bold');
        doc.text('Performance Summary', 20, yPosition); yPosition += 12;
        const metrics = [
          { label: 'Total Days', value: stats.totalDays.toString(), color: [30, 168, 231] },
          { label: 'Present', value: stats.totalPresent.toString(), color: [16, 185, 129] },
          { label: 'Absent', value: stats.totalAbsent.toString(), color: [239, 68, 110] },
        ];
        metrics.forEach((m, idx) => {
          const xPos = 20 + idx * 60;
          doc.setFillColor(...m.color);
          doc.roundedRect(xPos, yPosition, 55, 30, 3, 3, 'F');
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(9); doc.setFont(undefined, 'normal');
          doc.text(m.label, xPos + 27.5, yPosition + 10, { align: 'center' });
          doc.setFontSize(14); doc.setFont(undefined, 'bold');
          doc.text(m.value, xPos + 27.5, yPosition + 22, { align: 'center' });
        });
        yPosition += 45;
        doc.setTextColor(0, 0, 0); doc.setFontSize(10); doc.setFont(undefined, 'normal');
        doc.text(`Attendance Rate: ${stats.attendanceRate}%`, 20, yPosition); yPosition += 6;
        doc.text(`Average Working Hours: ${stats.avgHoursWorked} hours/day`, 20, yPosition); yPosition += 15;
      }

      if (exportOptions.includeDetailedRecords) {
        setExportProgress(60);
        if (yPosition > 200) { doc.addPage(); yPosition = 20; }
        doc.setFontSize(14); doc.setFont(undefined, 'bold');
        doc.text('Attendance Records', 20, yPosition); yPosition += 8;

        const records = exportOptions.recordsLimit === 'all'
          ? filteredAttendance
          : filteredAttendance.slice(0, parseInt(exportOptions.recordsLimit, 10));

        const tableData = records.map((att) => {
          const hours = calculateWorkingHours(att.in_time, att.out_time);
          const overnight = isOvernightShift(att.in_time, att.out_time);
          const checkoutDate = overnight ? getCheckoutDisplayDate(att.date, att.in_time, att.out_time) : null;
          return [
            formatDateDisplay(att.date),
            att.status.toUpperCase(),
            att.in_time || '-',
            att.out_time || '-',
            checkoutDate ? formatDateDisplay(checkoutDate) : 'Same',
            hours ? `${hours.hours}h ${hours.minutes}m` : '-',
          ];
        });

        autoTable(doc, {
          startY: yPosition,
          head: [['Check-In', 'Status', 'In Time', 'Out Time', 'Out Date', 'Hours']],
          body: tableData,
          theme: 'striped',
          headStyles: { fillColor: [30, 168, 231], fontSize: 9, fontStyle: 'bold' },
          styles: { fontSize: 8 },
        });
      }

      setExportProgress(90);
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8); doc.setTextColor(128, 128, 128);
        doc.text(`${staffData.staff_id} - Attendance Report | Page ${i} of ${pageCount}`, 105, 290, { align: 'center' });
      }
      doc.save(`${staffData.staff_id}_Attendance_Report.pdf`);
      setExportProgress(100);
      showSuccessToast('PDF report exported successfully!');
    } catch (err) {
      console.error(err);
      showSuccessToast('Error exporting PDF file');
    } finally {
      setTimeout(() => { setExporting(false); setExportProgress(0); setExportType(''); }, 500);
    }
  };

  const handleExportClick = (type) => { setShowExportModal(true); setExportType(type); };
  const handleExportConfirm = () => {
    setShowExportModal(false);
    if (exportType === 'Excel') exportToExcel();
    else if (exportType === 'PDF') exportToPDF();
  };

  if (loading && !staffData) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center py-5 mt-5">
        <Spinner animation="border" style={{ color: '#1ea8e7' }} className="mb-3" />
        <h5 className="fw-bold">Loading Attendance History...</h5>
      </div>
    );
  }

  return (
    <div className="container-fluid pb-5">
      <style>{customStyles}</style>
      <HtmlHead title={main_title} description={description} />

      <div className="page-title-container mb-5">
        <Row className="g-3 align-items-center">
          <Col md={7}>
            <h1 className="mb-0 pb-0 display-4 fw-bold" style={{ color: '#1ea8e7' }}>
              {main_title}
            </h1>
            <BreadcrumbList items={breadcrumbs} />
          </Col>
          <Col md={5} className="d-flex justify-content-md-end gap-2 flex-wrap">
            <Button variant="none" className="custom-btn-info-outline px-4 py-2 d-flex align-items-center gap-2 mb-2 mb-md-0" onClick={() => setShowRegModal(true)}>
              <CsLineIcons icon="edit" size="18" /> Request Regularization
            </Button>
            <Button variant="none" className="custom-btn-primary-outline px-4 py-2 d-flex align-items-center gap-2 mb-2 mb-md-0" onClick={() => history.push('/dashboard')}>
              <CsLineIcons icon="arrow-left" size="18" /> Back to Dashboard
            </Button>
          </Col>
        </Row>
      </div>

      {error && (
        <Alert variant="danger" className="glass-card border-0 mb-4 p-4 shadow-sm d-flex align-items-center gap-3 text-danger fw-bold">
          <CsLineIcons icon="error" size="24" />
          <span>{error}</span>
        </Alert>
      )}

      {staffData && (
        <Card className="glass-card border-0 mb-4 overflow-hidden">
          <Card.Body className="p-4">
            <Row className="align-items-center g-4">
              <Col md={4} className="border-end d-flex align-items-center gap-4">
                <div className="sw-10 sh-10 rounded-circle bg-soft-primary d-flex align-items-center justify-content-center text-primary fw-bold display-6 shadow-sm">
                  {staffData.f_name?.[0]}{staffData.l_name?.[0]}
                </div>
                <div>
                  <h4 className="fw-bold text-dark mb-1">{staffData.f_name} {staffData.l_name}</h4>
                  <div className="text-muted fw-medium d-flex align-items-center gap-2">
                    <Badge bg="soft-primary" className="text-primary px-3 py-2 rounded-pill">#{staffData.staff_id}</Badge>
                    <span>•</span>
                    <span>{staffData.position}</span>
                  </div>
                </div>
              </Col>
              <Col md={8}>
                <Row className="text-center g-3">
                  {[
                    { label: 'Total Logs', value: stats.totalDays, icon: 'calendar', color: 'primary' },
                    { label: 'Present', value: stats.totalPresent, icon: 'check-circle', color: 'success' },
                    { label: 'Absent', value: stats.totalAbsent, icon: 'close-circle', color: 'danger' },
                    { label: 'Success Rate', value: `${stats.attendanceRate}%`, icon: 'trending-up', color: 'info' },
                  ].map((s) => (
                    <Col xs={6} md={3} key={s.label}>
                      <div className="p-3">
                        <CsLineIcons icon={s.icon} size="20" className={`text-${s.color} mb-2`} />
                        <div className="text-muted small fw-bold text-uppercase letter-spacing-1">{s.label}</div>
                        <h4 className={`mb-0 fw-bold text-${s.color}`}>{s.value}</h4>
                      </div>
                    </Col>
                  ))}
                </Row>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      )}

      <Card className="glass-card border-0 mb-4">
        <Card.Body className="p-4">
          <Row className="g-3 align-items-center">
            <Col md={4}>
              <Form.Label className="small fw-bold text-muted text-uppercase ms-3 mb-2">Start Date</Form.Label>
              <Form.Control
                className="filter-pill-input shadow-sm"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </Col>
            <Col md={4}>
              <Form.Label className="small fw-bold text-muted text-uppercase ms-3 mb-2">End Date</Form.Label>
              <Form.Control
                className="filter-pill-input shadow-sm"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </Col>
            <Col md={4}>
              <Form.Label className="small fw-bold text-muted text-uppercase ms-3 mb-2">Status</Form.Label>
              <Select
                classNamePrefix="react-select"
                styles={selectStyles}
                options={statusOptions}
                value={statusOptions.find((opt) => opt.value === statusFilter)}
                onChange={(selected) => setStatusFilter(selected ? selected.value : 'all')}
                placeholder="Select Status"
                isSearchable={false}
                menuPortalTarget={document.body}
                menuPlacement="bottom"
              />
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Row className="g-4">
        <Col lg={4}>
          <Card className="glass-card border-0 mb-4 h-100">
            <Card.Header className="bg-transparent border-0 p-4 pb-0">
              <h5 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
                <CsLineIcons icon="download" size="20" className="text-primary" />
                Export Reports
              </h5>
            </Card.Header>
            <Card.Body className="p-4">
              <p className="text-muted small mb-4">Generate detailed attendance reports in various formats for payroll or compliance.</p>
              <div className="d-grid gap-3">
                <Button
                  variant="none"
                  className="custom-btn-success-outline py-3 d-flex align-items-center justify-content-center gap-2"
                  onClick={() => handleExportClick('Excel')}
                  disabled={exporting}
                >
                  <CsLineIcons icon="file-text" size="18" /> Excel Document
                </Button>
                <Button
                  variant="none"
                  className="custom-btn-danger-outline py-3 d-flex align-items-center justify-content-center gap-2"
                  onClick={() => handleExportClick('PDF')}
                  disabled={exporting}
                >
                  <CsLineIcons icon="file-text" size="18" /> PDF Report
                </Button>
              </div>
              
              {exporting && (
                <div className="mt-4 p-3 bg-light rounded-3 border">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <div className="fw-bold small text-primary d-flex align-items-center gap-2">
                      <Spinner animation="border" size="sm" />
                      Exporting {exportType}...
                    </div>
                    <span className="small text-muted">{exportProgress}%</span>
                  </div>
                  <ProgressBar now={exportProgress} className="sh-1 rounded-pill" variant="primary" />
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col lg={8}>
          <Card className="glass-card border-0 mb-4">
            <Card.Header className="bg-transparent border-0 p-4 pb-0 d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-2">
              <h5 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
                <CsLineIcons icon="calendar" size="20" className="text-primary" />
                Attendance Calendar
              </h5>
              <div className="d-flex gap-2">
                <Badge bg="soft-success" className="text-success px-2 py-1 small rounded-pill fw-bold">Present</Badge>
                <Badge bg="soft-danger" className="text-danger px-2 py-1 small rounded-pill fw-bold">Absent</Badge>
              </div>
            </Card.Header>
            <Card.Body className="p-4 pt-2">
              <div className="calendar-container">
                <FullCalendar
                  plugins={[dayGridPlugin, interactionPlugin]}
                  initialView="dayGridMonth"
                  events={attendanceEvents}
                  eventClick={handleEventClick}
                  height="auto"
                  headerToolbar={{ left: 'prev,next today', center: 'title', right: 'dayGridMonth,dayGridWeek' }}
                  dayMaxEvents
                  eventDisplay="block"
                />
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Card className="glass-card border-0 mt-4 overflow-hidden">
        <Card.Header className="bg-transparent border-0 p-4 pb-0">
          <h5 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
            <CsLineIcons icon="layout" size="20" className="text-primary" />
            Detailed Logs
          </h5>
        </Card.Header>
        <Card.Body className="p-4 pt-0">
          {/* Desktop View (Table Layout) */}
          <div className="table-responsive d-none d-md-block" style={{ overflow: 'auto' }}>
            <table className="react-table rows mb-0">
              <thead>
                <tr>
                  <th>Date & Weekday</th>
                  <th>Status</th>
                  <th>Check-In</th>
                  <th>Check-Out</th>
                  <th>Total Hours</th>
                  <th>Shift Type</th>
                  <th className="text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredAttendance.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-5">
                      <div className="py-4">
                        <CsLineIcons icon="info-hexagon" size="48" className="text-muted mb-3" />
                        <h5 className="text-muted">No records found matching filters</h5>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredAttendance
                    .sort((a, b) => new Date(b.date) - new Date(a.date))
                    .map((att, index) => {
                      const hours = calculateWorkingHours(att.in_time, att.out_time);
                      const overnight = isOvernightShift(att.in_time, att.out_time);
                      const checkoutDate = overnight ? getCheckoutDisplayDate(att.date, att.in_time, att.out_time) : null;

                      return (
                        <tr key={att._id || index}>
                          <td>
                            <div className="fw-bold text-dark">{formatDateDisplay(att.date)}</div>
                            <small className="text-muted fw-medium">{new Date(att.date).toLocaleDateString('en-IN', { weekday: 'long' })}</small>
                          </td>
                          <td>
                            {(() => {
                              let bg = 'danger';
                              let icon = 'close-circle';
                              let label = att.status;
                              if (att.status === 'present') {
                                bg = 'success';
                                icon = 'check';
                                label = 'Present';
                              } else if (att.status === 'leave') {
                                bg = 'info';
                                icon = 'calendar';
                                const leaveType = leaveTypes.find((lt) => lt.leave_type_id === att.leave_type_id);
                                label = leaveType ? `On Leave (${leaveType.short_code || leaveType.name})` : 'On Leave';
                              } else if (att.status === 'half_day') {
                                bg = 'warning';
                                icon = 'clock';
                                const leaveType = leaveTypes.find((lt) => lt.leave_type_id === att.leave_type_id);
                                label = leaveType ? `Half Day (${leaveType.short_code || leaveType.name})` : 'Half Day';
                              } else if (att.status === 'week_off') {
                                bg = 'secondary';
                                icon = 'sun';
                                label = 'Week Off';
                              } else if (att.status === 'holiday') {
                                bg = 'pink';
                                icon = 'gift';
                                label = 'Holiday';
                              }
                              return (
                                <Badge bg={bg} className="status-badge d-inline-flex align-items-center gap-1 text-capitalize">
                                  <CsLineIcons icon={icon} size="12" />
                                  {label}
                                </Badge>
                              );
                            })()}
                          </td>
                          <td>
                            <div className="d-flex align-items-center gap-2 text-dark fw-medium">
                              {att.in_time ? <><CsLineIcons icon="login" size="14" className="text-success" />{att.in_time}</> : '—'}
                            </div>
                          </td>
                          <td>
                            <div className="d-flex align-items-center gap-2 text-dark fw-medium">
                              {att.out_time ? <><CsLineIcons icon="logout" size="14" className="text-danger" />{att.out_time}</> : 
                                att.in_time ? <Badge bg="soft-warning" className="text-warning small px-2 py-1 rounded-pill fw-bold">Active</Badge> : '—'}
                            </div>
                            {checkoutDate && <div className="small text-muted mt-1">🌙 Out: {formatDateDisplay(checkoutDate)}</div>}
                          </td>
                          <td>
                            <div className="fw-bold text-primary">
                              {hours ? `${hours.hours}h ${hours.minutes}m` : '—'}
                            </div>
                          </td>
                          <td>
                            {att.in_time && att.out_time ? (
                              <Badge bg={overnight ? 'soft-purple' : 'soft-info'} className={`text-${overnight ? 'purple' : 'info'} px-3 py-2 rounded-pill fw-bold`}>
                                {overnight ? '🌙 Night' : '☀️ Day'}
                              </Badge>
                            ) : '—'}
                          </td>
                          <td className="text-center">
                            <Button
                              variant="none"
                              size="sm"
                              className="btn-icon btn-icon-only rounded-circle custom-btn-primary-outline mx-auto"
                              onClick={() => { setSelectedAttendance(att); setShowDetailModal(true); }}
                              title="View Detail"
                              style={{ width: '36px', height: '36px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                              <CsLineIcons icon="eye" size="14" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile View (Premium Space-Saving Card Grid) */}
          <div className="d-md-none d-flex flex-column gap-3 mt-2">
            {filteredAttendance.length === 0 ? (
              <div className="text-center py-5">
                <CsLineIcons icon="info-hexagon" size="48" className="text-muted mb-3" />
                <h5 className="text-muted">No records found matching filters</h5>
              </div>
            ) : (
              filteredAttendance
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .map((att, index) => {
                  const hours = calculateWorkingHours(att.in_time, att.out_time);
                  const overnight = isOvernightShift(att.in_time, att.out_time);
                  const checkoutDate = overnight ? getCheckoutDisplayDate(att.date, att.in_time, att.out_time) : null;

                  return (
                    <Card key={att._id || index} className="border-0 shadow-sm" style={{ borderRadius: '1.25rem', background: '#f8fafc', border: '1px solid #edf2f7' }}>
                      <Card.Body className="p-3">
                        {/* Top: Date & Status */}
                        <div className="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2">
                          <div>
                            <div className="fw-bold text-dark">{formatDateDisplay(att.date)}</div>
                            <small className="text-muted fw-medium">
                              {new Date(att.date).toLocaleDateString('en-IN', { weekday: 'long' })}
                            </small>
                          </div>
                          {(() => {
                            let bg = 'danger';
                            let icon = 'close-circle';
                            let label = att.status;
                            if (att.status === 'present') {
                              bg = 'success';
                              icon = 'check';
                              label = 'Present';
                            } else if (att.status === 'leave') {
                              bg = 'info';
                              icon = 'calendar';
                              const leaveType = leaveTypes.find((lt) => lt.leave_type_id === att.leave_type_id);
                              label = leaveType ? `On Leave (${leaveType.short_code || leaveType.name})` : 'On Leave';
                            } else if (att.status === 'half_day') {
                              bg = 'warning';
                              icon = 'clock';
                              const leaveType = leaveTypes.find((lt) => lt.leave_type_id === att.leave_type_id);
                              label = leaveType ? `Half Day (${leaveType.short_code || leaveType.name})` : 'Half Day';
                            } else if (att.status === 'week_off') {
                              bg = 'secondary';
                              icon = 'sun';
                              label = 'Week Off';
                            } else if (att.status === 'holiday') {
                              bg = 'pink';
                              icon = 'gift';
                              label = 'Holiday';
                            }
                            return (
                              <Badge bg={bg} className="status-badge d-inline-flex align-items-center gap-1 text-capitalize">
                                <CsLineIcons icon={icon} size="12" />
                                {label}
                              </Badge>
                            );
                          })()}
                        </div>

                        {/* Middle: Shift & Times */}
                        <Row className="g-3 mb-3 text-start">
                          <Col xs={6}>
                            <div className="small text-muted text-uppercase fw-bold" style={{ fontSize: '10px', letterSpacing: '0.05em' }}>Check-In</div>
                            <div className="d-flex align-items-center gap-1 text-dark fw-bold mt-1" style={{ fontSize: '13px' }}>
                              <CsLineIcons icon="login" size="14" className="text-success" />
                              {att.in_time || '—'}
                            </div>
                          </Col>
                          <Col xs={6}>
                            <div className="small text-muted text-uppercase fw-bold" style={{ fontSize: '10px', letterSpacing: '0.05em' }}>Check-Out</div>
                            <div className="d-flex align-items-center gap-1 text-dark fw-bold mt-1" style={{ fontSize: '13px' }}>
                              <CsLineIcons icon="logout" size="14" className="text-danger" />
                              {att.out_time ? att.out_time : att.in_time ? 'Active' : '—'}
                            </div>
                            {checkoutDate && <div className="small text-muted mt-1" style={{ fontSize: '10px' }}>🌙 Out: {formatDateDisplay(checkoutDate)}</div>}
                          </Col>
                          <Col xs={6}>
                            <div className="small text-muted text-uppercase fw-bold" style={{ fontSize: '10px', letterSpacing: '0.05em' }}>Total Hours</div>
                            <div className="fw-bold text-primary mt-1" style={{ fontSize: '13px' }}>
                              {hours ? `${hours.hours}h ${hours.minutes}m` : '—'}
                            </div>
                          </Col>
                          <Col xs={6}>
                            <div className="small text-muted text-uppercase fw-bold" style={{ fontSize: '10px', letterSpacing: '0.05em' }}>Shift Type</div>
                            <div className="mt-1">
                              {att.in_time && att.out_time ? (
                                <Badge bg={overnight ? 'soft-purple' : 'soft-info'} className={`text-${overnight ? 'purple' : 'info'} px-2 py-1 rounded-pill fw-bold`} style={{ fontSize: '10px' }}>
                                  {overnight ? '🌙 Night' : '☀️ Day'}
                                </Badge>
                              ) : '—'}
                            </div>
                          </Col>
                        </Row>

                        {/* Bottom Action */}
                        <div className="d-grid mt-2">
                          <Button
                            variant="none"
                            className="custom-btn-primary-outline w-100 py-2 d-flex align-items-center justify-content-center gap-2"
                            onClick={() => { setSelectedAttendance(att); setShowDetailModal(true); }}
                            style={{ fontSize: '12px' }}
                          >
                            <CsLineIcons icon="eye" size="14" /> View Details
                          </Button>
                        </div>
                      </Card.Body>
                    </Card>
                  );
                })
            )}
          </div>
        </Card.Body>
      </Card>

      <Modal show={showDetailModal} onHide={() => setShowDetailModal(false)} centered className="rounded-4">
        <Modal.Header closeButton className="border-0">
          <Modal.Title className="fw-bold">Record Details</Modal.Title>
        </Modal.Header>
        <Modal.Body className="py-4">
          {selectedAttendance && (
            <div className="text-center">
              <div className={`bg-soft-${selectedAttendance.status === 'present' ? 'success' : 'danger'} d-inline-flex p-4 rounded-circle mb-3`}>
                <CsLineIcons icon={selectedAttendance.status === 'present' ? 'check-circle' : 'close-circle'} size="48" className={`text-${selectedAttendance.status === 'present' ? 'success' : 'danger'}`} />
              </div>
              <h4 className="fw-bold mb-1">{formatDateDisplay(selectedAttendance.date)}</h4>
              <p className="text-muted fw-medium">{new Date(selectedAttendance.date).toLocaleDateString('en-IN', { weekday: 'long' })}</p>
              
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
                  <Col xs={12}>
                    <div className="small fw-bold text-muted text-uppercase mb-1">Total Duration</div>
                    <div className="fw-bold text-primary h4 mb-0 d-flex align-items-center gap-2">
                      <CsLineIcons icon="clock" size="24" />
                      {(() => {
                        const h = calculateWorkingHours(selectedAttendance.in_time, selectedAttendance.out_time);
                        return h ? `${h.hours} Hours ${h.minutes} Minutes` : '—';
                      })()}
                    </div>
                  </Col>
                </Row>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0">
          <Button className="custom-btn-solid rounded-pill w-100 py-3" onClick={() => setShowDetailModal(false)}>Close Detail</Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showExportModal} onHide={() => setShowExportModal(false)} centered className="rounded-4">
        <Modal.Header closeButton className="border-0">
          <Modal.Title className="fw-bold d-flex align-items-center gap-2">
            <CsLineIcons icon="download" size="24" className="text-primary" />
            Export Settings — {exportType}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="py-4">
          <div className="bg-soft-primary p-3 rounded-3 mb-4 d-flex align-items-center gap-3 border border-primary">
            <CsLineIcons icon="info-hexagon" size="24" className="text-primary" />
            <div className="small text-dark fw-medium">Customize your report content before generating the file.</div>
          </div>
          
          <Form>
            <h6 className="fw-bold text-muted text-uppercase letter-spacing-1 mb-3">Include Sections</h6>
            <div className="glass-card p-4 border-0 shadow-none bg-light mb-4">
              <Form.Check className="mb-3 fw-bold" type="switch" label="Staff Personal Details" checked={exportOptions.includeStaffInfo} onChange={(e) => setExportOptions({ ...exportOptions, includeStaffInfo: e.target.checked })} />
              <Form.Check className="mb-3 fw-bold" type="switch" label="Performance Statistics" checked={exportOptions.includeStatistics} onChange={(e) => setExportOptions({ ...exportOptions, includeStatistics: e.target.checked })} />
              <Form.Check className="mb-0 fw-bold" type="switch" label="Detailed Daily Logs" checked={exportOptions.includeDetailedRecords} onChange={(e) => setExportOptions({ ...exportOptions, includeDetailedRecords: e.target.checked })} />
            </div>

            <h6 className="fw-bold text-muted text-uppercase letter-spacing-1 mb-3">Records Limit</h6>
            <Form.Select className="rounded-3 border-0 shadow-sm py-2 px-3 fw-bold text-dark" value={exportOptions.recordsLimit} onChange={(e) => setExportOptions({ ...exportOptions, recordsLimit: e.target.value })}>
              <option value="all">Full History (All Records)</option>
              <option value="30">Recent 30 Days</option>
              <option value="90">Recent 90 Days</option>
              <option value="180">Recent 180 Days</option>
            </Form.Select>
          </Form>
        </Modal.Body>
        <Modal.Footer className="border-0 d-flex gap-3 pt-0">
          <Button
            variant="none"
            className="custom-btn-primary-outline flex-grow-1 py-3"
            onClick={() => setShowExportModal(false)}
          >
            Cancel
          </Button>
          <Button
            className="custom-btn-solid flex-grow-1 py-3 d-flex align-items-center justify-content-center gap-2"
            onClick={handleExportConfirm}
          >
            <CsLineIcons icon="download" size="18" /> Export {exportType}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Regularization Modal */}
      <Modal show={showRegModal} onHide={() => setShowRegModal(false)} centered className="rounded-4">
        <Form onSubmit={handleRegSubmit}>
          <Modal.Header closeButton className="border-0">
            <Modal.Title className="fw-bold d-flex align-items-center gap-2">
              <CsLineIcons icon="edit" size="24" className="text-primary" />
              Request Regularization
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="py-4">
            <div className="bg-soft-primary p-3 rounded-3 mb-4 d-flex align-items-center gap-3 border border-primary">
              <CsLineIcons icon="info-hexagon" size="24" className="text-primary" />
              <div className="small text-dark fw-medium">Submit a request to fix missing or incorrect punches. Admins will review this request.</div>
            </div>
            
            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold text-muted text-uppercase">Date of Missed Punch</Form.Label>
              <Form.Control type="date" required className="rounded-3 shadow-sm py-2" value={regForm.date} onChange={e => setRegForm({...regForm, date: e.target.value})} />
            </Form.Group>
            
            <Row className="g-3 mb-3">
              <Col xs={6}>
                <Form.Group>
                  <Form.Label className="small fw-bold text-muted text-uppercase">Correct In Time</Form.Label>
                  <Form.Control type="time" className="rounded-3 shadow-sm py-2" value={regForm.in_time} onChange={e => setRegForm({...regForm, in_time: e.target.value})} />
                </Form.Group>
              </Col>
              <Col xs={6}>
                <Form.Group>
                  <Form.Label className="small fw-bold text-muted text-uppercase">Correct Out Time</Form.Label>
                  <Form.Control type="time" className="rounded-3 shadow-sm py-2" value={regForm.out_time} onChange={e => setRegForm({...regForm, out_time: e.target.value})} />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold text-muted text-uppercase">Reason</Form.Label>
              <Form.Control as="textarea" rows={3} required placeholder="Explain why the punch was missed or needs correction..." className="rounded-3 shadow-sm py-2" value={regForm.reason} onChange={e => setRegForm({...regForm, reason: e.target.value})} />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer className="border-0">
            <Button variant="secondary" className="rounded-pill px-4" onClick={() => setShowRegModal(false)}>Cancel</Button>
            <Button type="submit" className="custom-btn-solid rounded-pill px-4" disabled={regLoading}>
              {regLoading ? <Spinner animation="border" size="sm" /> : 'Submit Request'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Toast */}
      <ToastContainer position="top-end" className="p-3">
        <Toast show={showToast} onClose={() => setShowToast(false)} delay={3000} autohide bg="success">
          <Toast.Header>
            <CsLineIcons icon="check-circle" className="me-2" />
            <strong className="me-auto">Success</strong>
          </Toast.Header>
          <Toast.Body className="text-white">{toastMessage}</Toast.Body>
        </Toast>
      </ToastContainer>
    </div>
  );
};

export default ViewAttendance;
