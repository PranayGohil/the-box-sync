import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useHistory } from 'react-router-dom';
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
import { Document, Packer, Paragraph, Table as DocTable, TableCell, TableRow, TextRun, AlignmentType, WidthType } from 'docx';
import { format } from 'date-fns';
import { getLeavePolicy, getPayrollConfig } from 'api/payrollConfig';
import Select from 'react-select';
import WfhLogsModal from './WfhLogsModal';

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
  const { id } = useParams();
  const history = useHistory();

  const main_title = 'View Attendance';
  const description = 'View staff attendance history and calendar';

  const [staffData, setStaffData] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [payrollConfig, setPayrollConfig] = useState(null);

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
  const [calendarView, setCalendarView] = useState('month'); // 'month' | 'week' | 'year'
  const calendarRef = React.useRef(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editStatus, setEditStatus] = useState('');
  const [editInTime, setEditInTime] = useState('');
  const [editOutTime, setEditOutTime] = useState('');
  const [editLeaveType, setEditLeaveType] = useState('');
  const [editReason, setEditReason] = useState('');
  const [submittingEdit, setSubmittingEdit] = useState(false);
  
  const [showWfhModal, setShowWfhModal] = useState(false);
  const [wfhModalData, setWfhModalData] = useState(null);


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

  // Stats are dynamically computed via useMemo depending on filteredAttendance

  const breadcrumbs = [
    { to: '', text: 'Home' },
    { to: 'attendance', text: 'Attendance Management' },
    { to: `attendance/view/${id}`, text: 'View Attendance' },
  ];

  const authHeader = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
  });

  const parseTimeToMinutes = (timeStr) => {
    if (!timeStr) return 0;
    const [time, period] = timeStr.split(' ');
    if (!time || !period) return 0;
    let [hours, minutes] = time.split(':').map(Number);
    if (period === 'PM' && hours !== 12) hours += 12;
    else if (period === 'AM' && hours === 12) hours = 0;
    return hours * 60 + minutes;
  };

  const calculateWorkingHours = (inTime, outTime, record) => {
    let targetRecord = null;
    let fallbackIn = inTime;
    let fallbackOut = outTime;
    
    if (inTime && typeof inTime === 'object') {
      targetRecord = inTime;
    } else if (record && typeof record === 'object') {
      targetRecord = record;
    }
    
    const config = payrollConfig;
    
    if (targetRecord) {
      const lunchStartStr = (config && config.org_rules && config.org_rules.lunch_start_time) || "01:00 PM";
      const lunchEndStr = (config && config.org_rules && config.org_rules.lunch_end_time) || "02:00 PM";
      
      const lunchStart = parseTimeToMinutes(lunchStartStr);
      const lunchEnd = parseTimeToMinutes(lunchEndStr);
      
      let totalMins = 0;
      const hasSessions = targetRecord.sessions && targetRecord.sessions.length > 0;
      
      if (hasSessions) {
        targetRecord.sessions.forEach(session => {
          if (session.in_time && session.out_time) {
            let diff = parseTimeToMinutes(session.out_time) - parseTimeToMinutes(session.in_time);
            if (diff < 0) diff += 24 * 60;
            totalMins += diff;
          }
        });
        
        for (let i = 0; i < targetRecord.sessions.length - 1; i++) {
          const currentOut = targetRecord.sessions[i].out_time;
          const nextIn = targetRecord.sessions[i+1].in_time;
          
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
        return { hours: Math.floor(totalMins / 60), minutes: totalMins % 60, total: totalMins / 60 };
      } else {
        fallbackIn = targetRecord.in_time;
        fallbackOut = targetRecord.out_time;
      }
    }
    
    if (!fallbackIn || !fallbackOut) return null;
    let totalMinutes = parseTimeToMinutes(fallbackOut) - parseTimeToMinutes(fallbackIn);
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
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
  };

  const showSuccessToast = (message) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const filteredAttendance = attendance.filter((att) => {
    // If date filters are set, filter by those dates
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
      // DEFAULT: only show current month
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
      const hours = calculateWorkingHours(att.in_time, att.out_time, att);
      if (hours) { totalHours += hours.total; validShifts++; }
    });

    return {
      totalPresent: present,
      totalAbsent: absent,
      totalDays: total,
      attendanceRate: total > 0 ? ((present / total) * 100).toFixed(1) : '0',
      avgHoursWorked: validShifts > 0 ? (totalHours / validShifts).toFixed(1) : '0',
    };
  }, [filteredAttendance, payrollConfig]);

  const attendanceEvents = useMemo(() => {
    return (attendance || []).map((att) => {
      let title = '';
      let backgroundColor = '';

      if (att.status === 'present') {
        const hours = calculateWorkingHours(att.in_time, att.out_time, att);
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
        const leaveType = leaveTypes.find((lt) => lt.leave_type_id === att.leave_type_id);
        title = leaveType ? `🍃 ${leaveType.name}` : '🍃 On Leave';
        backgroundColor = '#0ea5e9';
      } else if (att.status === 'half_day') {
        const leaveType = leaveTypes.find((lt) => lt.leave_type_id === att.leave_type_id);
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
  }, [attendance, leaveTypes, payrollConfig]);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      setError(null);
      const [response, polRes, configRes] = await Promise.all([
        axios.get(`${process.env.REACT_APP_API}/attendance/get/${id}`, authHeader()),
        getLeavePolicy(),
        getPayrollConfig().catch(() => null)
      ]);

      const { attendance: records, ...staff } = response.data.data;
      const types = (polRes.success && polRes.data?.leave_types) ? polRes.data.leave_types : [];

      setStaffData(staff);
      setAttendance(records || []);
      setLeaveTypes(types);
      if (configRes && configRes.success) {
        setPayrollConfig(configRes.data);
      }
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

  const handleOpenDetailModal = (att) => {
    setSelectedAttendance(att);
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
        staff_id: selectedAttendance.staff_id || id,
        date: selectedAttendance.date,
        status: editStatus,
        in_time: (editStatus === 'present' || editStatus === 'half_day') ? convertTo12Hour(editInTime) : null,
        out_time: (editStatus === 'present' || editStatus === 'half_day') ? convertTo12Hour(editOutTime) : null,
        leave_type_id: (editStatus === 'leave' || editStatus === 'half_day') ? editLeaveType : null,
        manual_entry_reason: editReason || "Admin manual edit"
      };

      const response = await axios.post(`${process.env.REACT_APP_API}/attendance/update`, payload, authHeader());
      if (response.data.success) {
        setToastMessage('Attendance updated successfully!');
        setShowToast(true);
        setShowDetailModal(false);
        fetchAttendance();
      } else {
        alert(response.data.message || 'Failed to update attendance.');
      }
    } catch (err) {
      console.error('Error saving attendance edit:', err);
      alert(err.response?.data?.message || 'Failed to save changes.');
    } finally {
      setSubmittingEdit(false);
    }
  };

  const handleEventClick = (clickInfo) => {
    handleOpenDetailModal(clickInfo.event.extendedProps.attendance);
  };

  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
    setStatusFilter('all');
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
          const hours = calculateWorkingHours(att.in_time, att.out_time, att);
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
          const hours = calculateWorkingHours(att.in_time, att.out_time, att);
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
              {staffData ? `${staffData.f_name} ${staffData.l_name}'s Record` : main_title}
            </h1>
            <BreadcrumbList items={breadcrumbs} />
          </Col>
          <Col md={5} className="d-flex justify-content-md-end">
            <Button variant="none" className="custom-btn-primary-outline px-4 py-2 d-flex align-items-center gap-2" onClick={() => history.push('/staff/attendance')}>
              <CsLineIcons icon="arrow-left" size="18" /> Manage Attendance
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
              <div className="d-flex gap-1 bg-light rounded-pill p-1" style={{ border: '1.5px solid #edf2f7' }}>
                {['month', 'week', 'year'].map((view) => (
                  <button
                    type="button"
                    key={view}
                    onClick={() => {
                      setCalendarView(view);
                      if (view !== 'year' && calendarRef.current) {
                        const api = calendarRef.current.getApi();
                        api.changeView(view === 'month' ? 'dayGridMonth' : 'dayGridWeek');
                      }
                    }}
                    style={{
                      border: 'none',
                      outline: 'none',
                      borderRadius: '50px',
                      padding: '0.3rem 1rem',
                      fontSize: '0.8rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      backgroundColor: calendarView === view ? '#1ea8e7' : 'transparent',
                      color: calendarView === view ? '#fff' : '#475569',
                      boxShadow: calendarView === view ? '0 2px 8px rgba(30,168,231,0.25)' : 'none',
                    }}
                  >
                    {view.charAt(0).toUpperCase() + view.slice(1)}
                  </button>
                ))}
              </div>
            </Card.Header>
            <Card.Body className="p-4 pt-2">
              {calendarView === 'year' ? (
                /* ── Custom Yearly Grid View ── */
                <div style={{ overflowY: 'auto', maxHeight: '520px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
                    {Array.from({ length: 12 }, (_, monthIdx) => {
                      const now = new Date();
                      const year = now.getFullYear();
                      const monthDate = new Date(year, monthIdx, 1);
                      const monthName = monthDate.toLocaleString('default', { month: 'long' });
                      const daysInMonth = new Date(year, monthIdx + 1, 0).getDate();
                      const firstDayOfWeek = monthDate.getDay(); // 0=Sun

                      // Build attendance map for this month
                      const monthAttMap = {};
                      attendance.forEach(att => {
                        const d = new Date(att.date);
                        if (d.getFullYear() === year && d.getMonth() === monthIdx) {
                          monthAttMap[d.getDate()] = att.status;
                        }
                      });

                      const statusColor = (status) => {
                        if (status === 'present') return '#10b981';
                        if (status === 'absent') return '#ef4444';
                        if (status === 'leave' || status === 'half_day') return '#0ea5e9';
                        if (status === 'week_off') return '#94a3b8';
                        if (status === 'holiday') return '#ec4899';
                        return '#e2e8f0';
                      };

                      return (
                        <div key={monthIdx} style={{ background: '#f8fafc', borderRadius: '12px', padding: '0.75rem', border: '1px solid #edf2f7' }}>
                          <div style={{ fontWeight: '700', fontSize: '0.8rem', color: '#1ea8e7', marginBottom: '0.5rem', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            {monthName} {year}
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', marginBottom: '4px' }}>
                            {['S','M','T','W','T','F','S'].map((d, i) => (
                              <div key={i} style={{ fontSize: '0.6rem', color: '#94a3b8', fontWeight: '700', textAlign: 'center' }}>{d}</div>
                            ))}
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
                            {Array.from({ length: firstDayOfWeek }).map((_empty, i) => (
                              <div key={`empty-${i}`} />
                            ))}
                            {Array.from({ length: daysInMonth }, (_dayNum, i) => i + 1).map(day => {
                              const status = monthAttMap[day];
                              const isToday = new Date().getDate() === day && new Date().getMonth() === monthIdx && new Date().getFullYear() === year;
                              return (
                                <div
                                  key={day}
                                  title={status ? status.replace('_', ' ') : 'No record'}
                                  style={{
                                    width: '100%',
                                    aspectRatio: '1',
                                    borderRadius: '4px',
                                    backgroundColor: statusColor(status),
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '0.55rem',
                                    fontWeight: '700',
                                    color: status ? '#fff' : '#cbd5e1',
                                    border: isToday ? '2px solid #1ea8e7' : '1px solid transparent',
                                    cursor: status ? 'pointer' : 'default',
                                  }}
                                  onClick={() => {
                                    const dateStr = `${year}-${String(monthIdx+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
                                    const att = attendance.find(a => a.date && a.date.startsWith(dateStr));
                                    if (att) { handleOpenDetailModal(att); }
                                  }}
                                >
                                  {day}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {/* Legend */}
                  <div className="d-flex flex-wrap gap-3 mt-3 justify-content-center">
                    {[['#10b981','Present'],['#ef4444','Absent'],['#0ea5e9','Leave'],['#94a3b8','Week Off'],['#ec4899','Holiday'],['#e2e8f0','No Record']].map(([color, label]) => (
                      <div key={label} className="d-flex align-items-center gap-1">
                        <div style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: color }} />
                        <span style={{ fontSize: '0.72rem', fontWeight: '600', color: '#64748b' }}>{label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="calendar-container">
                  <FullCalendar
                    ref={calendarRef}
                    plugins={[dayGridPlugin, interactionPlugin]}
                    initialView={calendarView === 'week' ? 'dayGridWeek' : 'dayGridMonth'}
                    events={attendanceEvents}
                    eventClick={handleEventClick}
                    height="auto"
                    headerToolbar={{ left: 'prev,next today', center: 'title', right: '' }}
                    dayMaxEvents
                    eventDisplay="block"
                  />
                </div>
              )}
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
                      const hours = calculateWorkingHours(att.in_time, att.out_time, att);
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
                            {att.sessions && att.sessions.length > 0 ? (
                              <div className="d-flex flex-column gap-1">
                                {att.sessions.map((session, idx) => (
                                  <span key={idx} className="time-badge time-badge-in">
                                    <CsLineIcons icon="login" size="12" className="me-1 text-success" /> {session.in_time}
                                  </span>
                                ))}
                              </div>
                            ) : att.in_time ? (
                              <span className="time-badge time-badge-in">
                                <CsLineIcons icon="login" size="12" className="me-1 text-success" /> {att.in_time}
                              </span>
                            ) : '—'}
                          </td>
                          <td>
                            {att.sessions && att.sessions.length > 0 ? (
                              <div className="d-flex flex-column gap-1">
                                {att.sessions.map((session, idx) => (
                                  <span key={idx} className={session.out_time ? "time-badge time-badge-out" : "time-badge bg-soft-warning text-warning"}>
                                    <CsLineIcons icon="logout" size="12" className={session.out_time ? "me-1 text-danger" : "me-1 text-warning"} /> {session.out_time || 'Active'}
                                  </span>
                                ))}
                              </div>
                            ) : att.out_time ? (
                              <span className="time-badge time-badge-out">
                                <CsLineIcons icon="logout" size="12" className="me-1 text-danger" /> {att.out_time}
                              </span>
                            ) : att.in_time ? (
                              <Badge bg="soft-warning" className="text-warning small px-2 py-1 rounded-pill fw-bold">Active</Badge>
                            ) : '—'}
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
                            <div className="d-flex justify-content-center gap-2">
                              <Button
                                variant="none"
                                size="sm"
                                className="btn-icon btn-icon-only rounded-circle custom-btn-primary-outline"
                                onClick={() => handleOpenDetailModal(att)}
                                title="View Detail"
                                style={{ width: '36px', height: '36px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                              >
                                <CsLineIcons icon="eye" size="14" />
                              </Button>
                              {att.wfh_tracking?.is_wfh && (
                                <Button
                                  variant="none"
                                  size="sm"
                                  className="btn-icon btn-icon-only rounded-circle custom-btn-info-outline"
                                  onClick={() => { setWfhModalData(att); setShowWfhModal(true); }}
                                  title="View WFH Logs"
                                  style={{ width: '36px', height: '36px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                                >
                                  <CsLineIcons icon="laptop" size="14" />
                                </Button>
                              )}
                            </div>
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
                  const hours = calculateWorkingHours(att.in_time, att.out_time, att);
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
                            {att.sessions && att.sessions.length > 0 ? (
                              att.sessions.map((s, i) => (
                                <div key={i} className="d-flex align-items-center gap-1 text-dark fw-bold mt-1" style={{ fontSize: '12px' }}>
                                  <CsLineIcons icon="login" size="12" className="text-success" />
                                  {s.in_time}
                                </div>
                              ))
                            ) : (
                              <div className="d-flex align-items-center gap-1 text-dark fw-bold mt-1" style={{ fontSize: '12px' }}>
                                <CsLineIcons icon="login" size="12" className="text-success" />
                                {att.in_time || '—'}
                              </div>
                            )}
                          </Col>
                          <Col xs={6}>
                            <div className="small text-muted text-uppercase fw-bold" style={{ fontSize: '10px', letterSpacing: '0.05em' }}>Check-Out</div>
                            {att.sessions && att.sessions.length > 0 ? (
                              att.sessions.map((s, i) => (
                                <div key={i} className="d-flex align-items-center gap-1 text-dark fw-bold mt-1" style={{ fontSize: '12px' }}>
                                  <CsLineIcons icon="logout" size="12" className={s.out_time ? "text-danger" : "text-warning"} />
                                  {s.out_time || 'Active'}
                                </div>
                              ))
                            ) : (
                              <div className="d-flex align-items-center gap-1 text-dark fw-bold mt-1" style={{ fontSize: '12px' }}>
                                <CsLineIcons icon="logout" size="12" className="text-danger" />
                                {att.out_time ? att.out_time : att.in_time ? 'Active' : '—'}
                              </div>
                            )}
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

                        <div className="d-flex justify-content-between align-items-center mt-3 pt-3 border-top">
                          {att.wfh_tracking?.is_wfh && (
                            <Button
                              variant="none"
                              size="sm"
                              className="d-flex align-items-center gap-2 custom-btn-info-outline"
                              onClick={() => { setWfhModalData(att); setShowWfhModal(true); }}
                              style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}
                            >
                              <CsLineIcons icon="laptop" size="14" /> View WFH Logs
                            </Button>
                          )}
                          <Button
                            variant="none"
                            size="sm"
                            className={`d-flex align-items-center gap-2 custom-btn-primary-outline ${!att.wfh_tracking?.is_wfh ? 'ms-auto' : ''}`}
                            onClick={() => handleOpenDetailModal(att)}
                            style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}
                          >
                            <CsLineIcons icon="edit" size="14" /> Edit / View
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
          <Modal.Title className="fw-bold">{isEditing ? 'Edit Attendance' : 'Record Details'}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="py-4">
          {selectedAttendance && (
            isEditing ? (
              <Form className="text-start">
                <h4 className="fw-bold text-center mb-1">{formatDateDisplay(selectedAttendance.date)}</h4>
                <p className="text-muted text-center fw-medium mb-4">{new Date(selectedAttendance.date).toLocaleDateString('en-IN', { weekday: 'long' })}</p>
                
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
                          const h = calculateWorkingHours(selectedAttendance.in_time, selectedAttendance.out_time, selectedAttendance);
                          return h ? `${h.hours} Hours ${h.minutes} Minutes` : '—';
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

      {/* WFH Logs Modal */}
      <WfhLogsModal 
        show={showWfhModal} 
        onHide={() => setShowWfhModal(false)} 
        attendance={wfhModalData} 
      />

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