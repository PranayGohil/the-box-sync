import React, { useState, useEffect } from 'react';
import { useHistory, Link } from 'react-router-dom';
import axios from 'axios';
import { Row, Col, Card, Button, Badge, Alert, Modal, Spinner, Form, Dropdown, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { useTable, useGlobalFilter, useSortBy, usePagination, useRowSelect } from 'react-table';
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import ControlsPageSize from 'components/table/ControlsPageSize';
import ControlsSearch from 'components/table/ControlsSearch';
import Table from 'components/table/Table';
import TablePagination from 'components/table/TablePagination';
import { toast } from 'react-toastify';
import { getLeavePolicy } from 'api/payrollConfig';

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
        <Dropdown className="d-inline-block" align="end">
          <Dropdown.Toggle
            ref={ref}
            {...triggerHandler}
            variant="outline-primary"
            className="rounded-pill shadow-sm px-3 fw-bold border-2 d-flex align-items-center justify-content-center"
            style={{ height: '40px', color: '#1ea8e7', borderColor: '#1ea8e7' }}
          >
            <span className="me-2">{pageSize} Items</span>
          </Dropdown.Toggle>
          <Dropdown.Menu
            className="shadow-lg border-0"
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

  const [showActionModal, setShowActionModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [actionType, setActionType] = useState('');
  const [error, setError] = useState('');

  const authHeader = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
  });

  const getTodayDate = () => {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
  };

  const getCurrentTime = () => {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDateDisplay = (dateString) => {
    const [year, month, day] = dateString.split('-');
    return `${day}-${month}-${year}`;
  };

  const fetchTodayAttendance = async () => {
    try {
      setLoading((prev) => ({ ...prev, initial: true }));
      setError('');
      const [attRes, polRes] = await Promise.all([axios.get(`${process.env.REACT_APP_API}/attendance/today`, authHeader()), getLeavePolicy()]);
      setStaffList(attRes.data.data);
      if (polRes.success && polRes.data) {
        setLeaveTypes(polRes.data.leave_types || []);
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
    fetchTodayAttendance();
  }, []);

  const handleCheckIn = async (staffId, staffName) => {
    setLoading((prev) => ({ ...prev, actions: { ...prev.actions, checkin: true } }));
    try {
      await axios.post(
        `${process.env.REACT_APP_API}/attendance/check-in`,
        { staff_id: staffId, date: getTodayDate(), in_time: getCurrentTime() },
        authHeader()
      );
      toast.success(`${staffName} checked in successfully!`);
      fetchTodayAttendance();
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
        { staff_id: staffId, date: getTodayDate(), out_time: getCurrentTime() },
        authHeader()
      );
      toast.success(`${staffName} checked out successfully!`);
      fetchTodayAttendance();
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
      await axios.post(`${process.env.REACT_APP_API}/attendance/mark-absent`, { staff_id: staffId, date: getTodayDate() }, authHeader());
      toast.success(`${staffName} marked as absent!`);
      fetchTodayAttendance();
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
        { staff_id: staffId, date: getTodayDate(), leave_type_id: selectedLeaveType, is_half_day: isHalfDay },
        authHeader()
      );
      toast.success(`${staffName} marked on leave!`);
      fetchTodayAttendance();
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
            } else if (todayAttendance.in_time && todayAttendance.out_time) {
              statusBg = 'primary';
              statusLabel = 'Completed';
            } else if (todayAttendance.in_time && !todayAttendance.out_time) {
              statusBg = 'success';
              statusLabel = 'Checked In';
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
          const time = row.original.todayAttendance?.in_time;
          if (!time) return <span className="text-muted fw-medium">—</span>;
          return (
            <span className="time-badge time-badge-in">
              <CsLineIcons icon="clock" size="12" className="me-1 text-success" /> {time}
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
          const time = row.original.todayAttendance?.out_time;
          if (!time) return <span className="text-muted fw-medium">—</span>;
          return (
            <span className="time-badge time-badge-out">
              <CsLineIcons icon="clock" size="12" className="me-1 text-danger" /> {time}
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
              ) : todayAttendance.in_time && !todayAttendance.out_time ? (
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
    [loading]
  );

  const tableInstance = useTable(
    { columns, data: staffList, initialState: { pageIndex: 0, pageSize: 10 } },
    useGlobalFilter,
    useSortBy,
    usePagination,
    useRowSelect
  );

  const { page, prepareRow, setGlobalFilter, state: tableState } = tableInstance;
  const { pageIndex, pageSize } = tableState;
  const totalFiltered = tableInstance.rows.length;

  // Debounced search wiring
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

      <div className="page-title-container mb-5">
        <Row className="g-3 align-items-center">
          <Col md={12}>
            <h1 className="mb-0 pb-0 display-4 fw-bold" style={{ color: '#1ea8e7' }}>
              {title}
            </h1>
            <BreadcrumbList items={breadcrumbs} />
          </Col>
        </Row>
      </div>

      {error && (
        <Alert variant="danger" className="glass-card border-0 mb-4 d-flex align-items-center justify-content-between p-4 shadow-sm">
          <div className="d-flex align-items-center gap-2 text-danger fw-bold">
            <CsLineIcons icon="error" size="24" />
            <span>{error}</span>
          </div>
          <Button variant="none" className="custom-btn-danger-outline px-4" onClick={fetchTodayAttendance}>
            Retry
          </Button>
        </Alert>
      )}

      {/* Search and Controls */}
      <div>
        <Row className="mb-3 g-2 align-items-center">
          <Col xs="12" md="6" lg="8" className="flex-grow-1">
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
          <Col xs="12" md="auto" className="d-flex align-items-center justify-content-between justify-content-md-end gap-3 ms-md-auto">
            <div className="text-muted small fw-bold">
              Showing {totalFiltered > 0 ? pageIndex * pageSize + 1 : 0}&ndash;{Math.min((pageIndex + 1) * pageSize, totalFiltered)} of {totalFiltered}
            </div>
            <div>
              <LocalControlsPageSize tableInstance={tableInstance} />
            </div>
          </Col>
        </Row>

        {/* Desktop View (Table Layout) */}
        <Row className="d-none d-lg-flex">
          <Col xs="12" style={{ overflow: 'auto' }}>
            <Table className="react-table rows" tableInstance={tableInstance} />
          </Col>
        </Row>

        {/* Mobile & Tablet View (Premium Space-Saving Card Grid) */}
        <Row className="d-lg-none g-3">
          {page.map((row) => {
            prepareRow(row);
            const staff = row.original;
            const { todayAttendance } = staff;

            // Extract status values
            let status = 'Pending';
            let statusVariant = 'warning';
            let statusIcon = 'clock';
            if (todayAttendance) {
              if (todayAttendance.status === 'absent') {
                status = 'Absent';
                statusVariant = 'danger';
                statusIcon = 'close-circle';
              } else if (todayAttendance.status === 'leave') {
                status = 'On Leave';
                statusVariant = 'info';
                statusIcon = 'calendar';
              } else if (todayAttendance.status === 'half_day') {
                status = 'Half Day';
                statusVariant = 'warning';
                statusIcon = 'clock';
              } else if (todayAttendance.in_time && todayAttendance.out_time) {
                status = 'Completed';
                statusVariant = 'primary';
                statusIcon = 'check';
              } else if (todayAttendance.in_time && !todayAttendance.out_time) {
                status = 'Checked In';
                statusVariant = 'success';
                statusIcon = 'log-in';
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
                      {/* Top Row: Avatar + Name + ID + Status */}
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
                          </div>
                        </div>
                        <Badge bg={statusVariant} className="rounded-pill px-3 py-1">{status}</Badge>
                      </div>

                      {/* Middle Row: Check-In and Check-Out times */}
                      <Row className="mb-3 g-0 border-top pt-2" style={{ borderColor: '#f3f4f6' }}>
                        <Col xs="6">
                          <div className="text-muted small">CHECK-IN</div>
                          <div className="fw-bold small">{todayAttendance?.in_time || '—'}</div>
                        </Col>
                        <Col xs="6" className="text-end">
                          <div className="text-muted small">CHECK-OUT</div>
                          <div className="fw-bold small">{todayAttendance?.out_time || '—'}</div>
                        </Col>
                      </Row>
                    </div>

                    {/* Bottom Row: Actions */}
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
                      ) : todayAttendance.in_time && !todayAttendance.out_time ? (
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
                this staff member for today?
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
    </div>
  );
}
