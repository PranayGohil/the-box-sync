import React, { useState, useEffect } from 'react';
import { useHistory, Link } from 'react-router-dom';
import axios from 'axios';
import { Row, Col, Card, Button, Badge, Alert, Modal, Spinner, Form } from 'react-bootstrap';
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
  .custom-btn-outline {
    border: 1px solid #1ea8e7 !important;
    color: #1ea8e7 !important;
    background-color: #fff !important;
    transition: all 0.2s ease-in-out !important;
    border-radius: 50px !important;
    font-weight: 600 !important;
    font-size: 0.85rem !important;
  }
  .custom-btn-outline:hover {
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
    padding: 0.5rem 1rem;
    border-radius: 50px;
    font-weight: 700;
    font-size: 0.75rem;
    letter-spacing: 0.02em;
    text-transform: uppercase;
  }
  .react-table th {
    background: #f8fafc !important;
    color: #64748b !important;
    font-weight: 700 !important;
    text-transform: uppercase !important;
    font-size: 0.75rem !important;
    letter-spacing: 0.05em !important;
    padding: 1.25rem !important;
    border: none !important;
  }
  .react-table td {
    padding: 1.25rem !important;
    vertical-align: middle !important;
    border-bottom: 1px solid #f1f5f9 !important;
  }
`;

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
            const [attRes, polRes] = await Promise.all([
                axios.get(`${process.env.REACT_APP_API}/attendance/today`, authHeader()),
                getLeavePolicy()
            ]);
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
            await axios.post(
                `${process.env.REACT_APP_API}/attendance/mark-absent`,
                { staff_id: staffId, date: getTodayDate() },
                authHeader()
            );
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
                Cell: ({ value }) => <span className="fw-bold text-dark">#{value}</span>,
            },
            {
                Header: 'Staff Member',
                accessor: (row) => `${row.f_name} ${row.l_name}`,
                Cell: ({ row, value }) => (
                    <div className="d-flex align-items-center gap-3">
                        <div className="sw-5 sh-5 rounded-circle bg-soft-primary d-flex align-items-center justify-content-center text-primary fw-bold">
                            {row.original.f_name?.[0]}{row.original.l_name?.[0]}
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
                Cell: ({ row }) => {
                    const { todayAttendance } = row.original;
                    let status = 'Pending';
                    let statusVariant = 'warning';
                    let statusIcon = 'clock';

                    if (todayAttendance) {
                        if (todayAttendance.status === 'absent') {
                            status = 'Absent';
                            statusVariant = 'danger';
                            statusIcon = 'user-block';
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

                    return (
                        <Badge bg={statusVariant} className="status-badge d-inline-flex align-items-center gap-1">
                            <CsLineIcons icon={statusIcon} size="12" />
                            {status}
                        </Badge>
                    );
                },
            },
            {
                Header: 'Check-In',
                id: 'in_time',
                Cell: ({ row }) => <span className="fw-medium text-dark">{row.original.todayAttendance?.in_time || '—'}</span>,
            },
            {
                Header: 'Check-Out',
                id: 'out_time',
                Cell: ({ row }) => <span className="fw-medium text-dark">{row.original.todayAttendance?.out_time || '—'}</span>,
            },
            {
                Header: 'Actions',
                id: 'actions',
                headerClassName: 'text-center',
                Cell: ({ row }) => {
                    const { todayAttendance } = row.original;
                    const actionsDisabled = loading.actions.checkin || loading.actions.checkout || loading.actions.absent;

                    return (
                        <div className="d-flex justify-content-center gap-1">
                            {!todayAttendance ? (
                                <>
                                    <Button
                                        className="custom-btn-outline p-0 sw-5 sh-5 d-flex align-items-center justify-content-center"
                                        onClick={() => handleAction(row.original, 'checkin')}
                                        title="Check-In"
                                        disabled={actionsDisabled}
                                    >
                                        <CsLineIcons icon="login" size="16" />
                                    </Button>
                                    <Button
                                        className="custom-btn-danger-outline p-0 sw-5 sh-5 d-flex align-items-center justify-content-center"
                                        onClick={() => handleAction(row.original, 'absent')}
                                        title="Mark Absent"
                                        disabled={actionsDisabled}
                                    >
                                        <CsLineIcons icon="user-block" size="16" />
                                    </Button>
                                    <Button
                                        className="custom-btn-info-outline p-0 sw-5 sh-5 d-flex align-items-center justify-content-center"
                                        onClick={() => handleAction(row.original, 'leave')}
                                        title="Mark Leave"
                                        disabled={actionsDisabled}
                                    >
                                        <CsLineIcons icon="calendar" size="16" />
                                    </Button>
                                </>
                            ) : todayAttendance.in_time && !todayAttendance.out_time ? (
                                <Button
                                    className="custom-btn-outline p-0 sw-5 sh-5 d-flex align-items-center justify-content-center"
                                    onClick={() => handleAction(row.original, 'checkout')}
                                    title="Check-Out"
                                    disabled={actionsDisabled}
                                >
                                    <CsLineIcons icon="logout" size="16" />
                                </Button>
                            ) : (
                                <div className="sw-5 sh-5 rounded-circle bg-soft-secondary d-flex align-items-center justify-content-center text-secondary">
                                    <CsLineIcons icon="check" size="16" />
                                </div>
                            )}
                            <Button
                                className="custom-btn-outline p-0 sw-5 sh-5 d-flex align-items-center justify-content-center"
                                onClick={() => history.push(`/staff/attendance/view/${row.original._id}`)}
                                title="View History"
                            >
                                <CsLineIcons icon="eye" size="16" />
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
                    <Col md={7}>
                        <h1 className="mb-0 pb-0 display-4 fw-bold" style={{ color: '#1ea8e7' }}>{title}</h1>
                        <BreadcrumbList items={breadcrumbs} />
                    </Col>
                    <Col md={5} className="d-flex justify-content-md-end gap-2">
                        <Button className="custom-btn-outline px-4 py-2 d-flex align-items-center gap-2" onClick={fetchTodayAttendance} disabled={loading.initial}>
                            <CsLineIcons icon="refresh" size="18" /> Refresh
                        </Button>
                        <Button className="custom-btn-outline px-4 py-2 d-flex align-items-center gap-2" as={Link} to="/staff/view">
                            <CsLineIcons icon="eye" size="18" /> View Team
                        </Button>
                    </Col>
                </Row>
            </div>

            {error && (
                <Alert variant="danger" className="glass-card border-0 mb-4 d-flex align-items-center justify-content-between p-4 shadow-sm">
                    <div className="d-flex align-items-center gap-2 text-danger fw-bold">
                        <CsLineIcons icon="error" size="24" />
                        <span>{error}</span>
                    </div>
                    <Button className="custom-btn-danger-outline px-4" onClick={fetchTodayAttendance}>Retry</Button>
                </Alert>
            )}

            <Card className="glass-card border-0 shadow-sm overflow-hidden mb-5">
                <div className="p-4 border-bottom bg-light d-flex flex-wrap justify-content-between align-items-center gap-3">
                    <div>
                        <h5 className="fw-bold text-dark mb-1">
                            Daily Roster — {formatDateDisplay(getTodayDate())}
                        </h5>
                        <div className="text-muted small fw-medium">Tracking {staffList.length} staff members today</div>
                    </div>
                    <div className="d-flex flex-wrap gap-2">
                        <Badge bg="warning" className="status-badge">Pending</Badge>
                        <Badge bg="success" className="status-badge">Checked In</Badge>
                        <Badge bg="primary" className="status-badge">Completed</Badge>
                        <Badge bg="danger" className="status-badge">Absent</Badge>
                    </div>
                </div>

                <Card.Body className="p-0">
                    <div className="p-4 d-flex flex-wrap justify-content-between align-items-center gap-3 bg-white">
                        <div className="search-input-container sw-30">
                            <ControlsSearch tableInstance={tableInstance} />
                        </div>
                        <ControlsPageSize tableInstance={tableInstance} />
                    </div>
                    
                    <div className="table-responsive">
                        <Table className="react-table rows mb-0" tableInstance={tableInstance} />
                    </div>
                    
                    <div className="p-4 border-top">
                        <TablePagination tableInstance={tableInstance} />
                    </div>
                </Card.Body>
            </Card>

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
                                    icon={actionType === 'checkin' ? 'login' : actionType === 'checkout' ? 'logout' : actionType === 'leave' ? 'calendar' : 'user-block'} 
                                    size="48" 
                                    className={`text-${actionType === 'absent' ? 'danger' : 'primary'}`}
                                />
                            </div>
                            <h5 className="fw-bold mb-2">
                                {selectedStaff.f_name} {selectedStaff.l_name}
                            </h5>
                            <p className="text-muted mb-4">
                                Are you sure you want to {actionType === 'checkin' ? 'check-in' : actionType === 'checkout' ? 'check-out' : actionType === 'leave' ? 'mark on leave' : 'mark as absent'} this staff member for today?
                            </p>
                            
                            {actionType === 'leave' && (
                                <div className="text-start mt-3 glass-card p-4 border-0 shadow-none bg-light">
                                    <Form.Group className="mb-4">
                                        <Form.Label className="small fw-bold text-uppercase letter-spacing-1 text-muted">Leave Reason / Type</Form.Label>
                                        <Form.Select
                                            className="rounded-3 border-0 shadow-sm py-2"
                                            value={selectedLeaveType}
                                            onChange={(e) => setSelectedLeaveType(e.target.value)}
                                        >
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
                        className="custom-btn-outline flex-grow-1"
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
                        ) : 'Confirm Action'}
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
}