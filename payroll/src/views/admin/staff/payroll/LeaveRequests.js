import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Badge, Modal, Form, Spinner, Pagination } from 'react-bootstrap';
import { toast } from 'react-toastify';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import { getLeaveRequests, updateLeaveStatus, getLeaveBalances } from 'api/leave';
import { getLeavePolicy } from 'api/payrollConfig';
import { format } from 'date-fns';
import Select from 'react-select';

const LeaveRequests = () => {
    const title = 'Leave Management';
    const description = 'Manage staff leave requests and track real-time leave balances.';
    const breadcrumbs = [
        { to: '', text: 'Home' },
        { to: 'staff/view', text: 'Staff' },
        { to: 'staff/leave-requests', text: 'Leave Management' }
    ];

    const currentYear = new Date().getFullYear();
    const statusOptions = [
        { value: 'all', label: 'All Statuses' },
        { value: 'pending', label: 'Pending' },
        { value: 'approved', label: 'Approved' },
        { value: 'rejected', label: 'Rejected' }
    ];
    const monthOptions = [
        { value: 'all', label: 'All Months' },
        { value: '0', label: 'January' },
        { value: '1', label: 'February' },
        { value: '2', label: 'March' },
        { value: '3', label: 'April' },
        { value: '4', label: 'May' },
        { value: '5', label: 'June' },
        { value: '6', label: 'July' },
        { value: '7', label: 'August' },
        { value: '8', label: 'September' },
        { value: '9', label: 'October' },
        { value: '10', label: 'November' },
        { value: '11', label: 'December' }
    ];
    const [activeTab, setActiveTab] = useState('requests'); // 'requests' or 'balances'
    const [requests, setRequests] = useState([]);
    const [balances, setBalances] = useState([]);
    const [leavePolicy, setLeavePolicy] = useState({});
    const [loading, setLoading] = useState(true);

    const [statusFilter, setStatusFilter] = useState('all');
    const [monthFilter, setMonthFilter] = useState(new Date().getMonth().toString());
    const [searchQuery, setSearchQuery] = useState('');
    
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    useEffect(() => {
        setCurrentPage(1);
    }, [activeTab, statusFilter, monthFilter, searchQuery]);

    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectingId, setRejectingId] = useState(null);
    const [rejectReason, setRejectReason] = useState('');

    const [showApproveModal, setShowApproveModal] = useState(false);
    const [approvingId, setApprovingId] = useState(null);

    // History Modal
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [historyStaff, setHistoryStaff] = useState(null);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [reqRes, balRes, polRes] = await Promise.all([
                getLeaveRequests('all'), // Load all to support instant history queries
                getLeaveBalances(currentYear),
                getLeavePolicy()
            ]);

            if (reqRes.success) setRequests(reqRes.data || []);
            if (balRes.success) setBalances(balRes.data || []);

            if (polRes.success && polRes.data) {
                const map = {};
                polRes.data.leave_types.forEach(lt => {
                    map[lt.leave_type_id] = lt;
                });
                setLeavePolicy(map);
            }
        } catch (err) {
            toast.error("Failed to load leave data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line
    }, []);

    const handleShowApprove = (id) => {
        setApprovingId(id);
        setShowApproveModal(true);
    };

    const submitApprove = async () => {
        try {
            const res = await updateLeaveStatus(approvingId, 'approved');
            if (res.success) {
                toast.success('Leave approved successfully.');
                setShowApproveModal(false);
                fetchData();
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Approval failed');
        }
    };

    const handleShowReject = (id) => {
        setRejectingId(id);
        setRejectReason('');
        setShowRejectModal(true);
    };

    const submitReject = async () => {
        if (!rejectReason.trim()) { toast.warning("Rejection reason is required"); return; }
        try {
            const res = await updateLeaveStatus(rejectingId, 'rejected', rejectReason);
            if (res.success) {
                toast.success('Leave rejected successfully');
                setShowRejectModal(false);
                fetchData();
            }
        } catch (err) {
            toast.error('Rejection failed');
        }
    };

    const handleShowHistory = (staff) => {
        setHistoryStaff(staff);
        setShowHistoryModal(true);
    };

    const getStatusTheme = (status) => {
        switch (status) {
            case 'approved':
                return { color: '#10b981', bg: 'rgba(16, 185, 129, 0.08)', border: 'rgba(16, 185, 129, 0.15)', label: 'Approved' };
            case 'rejected':
                return { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.08)', border: 'rgba(239, 68, 68, 0.15)', label: 'Rejected' };
            case 'cancelled':
                return { color: '#64748b', bg: 'rgba(100, 116, 139, 0.08)', border: 'rgba(100, 116, 139, 0.15)', label: 'Cancelled' };
            case 'pending':
            default:
                return { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.08)', border: 'rgba(245, 158, 11, 0.15)', label: 'Pending' };
        }
    };

    // Filters
    const filteredRequests = requests.filter(req => {
        const matchesStatus = statusFilter === 'all' || req.status === statusFilter;
        const staffName = `${req.staff_id?.f_name || ''} ${req.staff_id?.l_name || ''}`.toLowerCase();
        const matchesSearch = staffName.includes(searchQuery.toLowerCase()) ||
            (req.staff_id?.position || '').toLowerCase().includes(searchQuery.toLowerCase());

        let matchesMonth = true;
        if (monthFilter !== 'all') {
            const reqDate = new Date(req.from_date);
            matchesMonth = reqDate.getMonth().toString() === monthFilter && reqDate.getFullYear() === currentYear;
        }

        return matchesStatus && matchesSearch && matchesMonth;
    });

    const filteredBalances = balances.filter(b => {
        const staffName = `${b.staff_id?.f_name || ''} ${b.staff_id?.l_name || ''}`.toLowerCase();
        return staffName.includes(searchQuery.toLowerCase()) ||
            (b.staff_id?.position || '').toLowerCase().includes(searchQuery.toLowerCase());
    });

    const pageCountReq = Math.ceil(filteredRequests.length / pageSize);
    const indexOfLastReq = currentPage * pageSize;
    const indexOfFirstReq = indexOfLastReq - pageSize;
    const currentRequests = filteredRequests.slice(indexOfFirstReq, indexOfLastReq);

    const pageCountBal = Math.ceil(filteredBalances.length / pageSize);
    const indexOfLastBal = currentPage * pageSize;
    const indexOfFirstBal = indexOfLastBal - pageSize;
    const currentBalances = filteredBalances.slice(indexOfFirstBal, indexOfLastBal);

    // Staff History Filter
    const staffHistoryRequests = historyStaff ? requests.filter(req => req.staff_id?._id === historyStaff.staff_id?._id) : [];

    return (
        <div className="container-fluid px-lg-4 px-xl-5 pb-5">
            <HtmlHead title={title} description={description} />

            <div className="page-title-container mb-4 mt-3 mt-lg-0">
                <Row className="g-3 align-items-center">
                    <Col xs="12" md="5">
                        <h1 className="mb-0 pb-0 display-4 fw-bold" style={{ color: '#1ea8e7' }}>
                            {title}
                        </h1>
                        <BreadcrumbList items={breadcrumbs} />
                    </Col>

                    <Col xs="12" md="7" className="d-flex flex-wrap justify-content-md-end align-items-center gap-3">
                        <Form.Control
                            type="text"
                            placeholder="Search staff..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="leave-search-input shadow-sm"
                        />
                        {activeTab === 'requests' && (
                            <>
                                <Select
                                    classNamePrefix="react-select"
                                    className="leave-filter-select-container shadow-sm"
                                    options={monthOptions}
                                    value={monthOptions.find(opt => opt.value === monthFilter)}
                                    onChange={(selected) => setMonthFilter(selected ? selected.value : 'all')}
                                    placeholder="Select Month"
                                    isSearchable={false}
                                />
                                <Select
                                    classNamePrefix="react-select"
                                    className="leave-filter-select-container shadow-sm"
                                    options={statusOptions}
                                    value={statusOptions.find(opt => opt.value === statusFilter)}
                                    onChange={(selected) => setStatusFilter(selected ? selected.value : 'all')}
                                    placeholder="Select Status"
                                    isSearchable={false}
                                />
                            </>
                        )}
                    </Col>
                </Row>
            </div>

            {/* Sub-navigation Tabs */}
            <div className="d-flex justify-content-start mb-4">
                <div className="leave-tab-container shadow-sm">
                    <Button
                        className={`leave-tab-button ${activeTab === 'requests' ? 'active' : ''}`}
                        onClick={() => setActiveTab('requests')}
                    >
                        Requests
                    </Button>
                    <Button
                        className={`leave-tab-button ${activeTab === 'balances' ? 'active' : ''}`}
                        onClick={() => setActiveTab('balances')}
                    >
                        Balances
                    </Button>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-5">
                    <Spinner animation="border" style={{ color: '#1ea8e7' }} />
                </div>
            ) : activeTab === 'requests' ? (
                <>
                    {filteredRequests.length === 0 ? (
                        <Card className="leave-card text-center py-5 border-0 shadow-sm">
                            <Card.Body className="text-muted py-5">
                                <CsLineIcons icon="notepads" size="48" className="text-muted opacity-50 mb-3" />
                                <h5 className="fw-bold mt-2">No Leave Requests Found</h5>
                                <p className="small mb-0">Use filters or check another category.</p>
                            </Card.Body>
                        </Card>
                    ) : (
                        <>
                            {/* Table View for Desktop / Tablet */}
                            <div className="d-none d-md-block">
                                <Card className="border-0 shadow-sm" style={{ borderRadius: '1.5rem', overflow: 'hidden' }}>
                                    <Card.Body className="p-0">
                                        <div className="table-responsive">
                                            <table className="table table-hover align-middle mb-0 leave-table">
                                                <thead className="table-light text-uppercase fw-bold text-muted border-bottom" style={{ fontSize: '0.82rem', letterSpacing: '0.05em' }}>
                                                    <tr>
                                                        <th className="ps-4 py-3.5">Staff Member</th>
                                                        <th className="py-3.5">Leave Type</th>
                                                        <th className="py-3.5">Duration</th>
                                                        <th className="py-3.5">Dates</th>
                                                        <th className="py-3.5">Reason</th>
                                                        <th className="py-3.5">Status</th>
                                                        <th className="pe-4 py-3.5 text-end">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {currentRequests.map((req, idx) => {
                                                        const statusTheme = getStatusTheme(req.status);
                                                        const policyItem = leavePolicy[req.leave_type_id];
 
                                                        return (
                                                            <tr key={req._id || idx}>
                                                                <td className="ps-4 py-3.5">
                                                                    <div className="d-flex align-items-center">
                                                                        <div className="avatar-char bg-soft-primary text-primary rounded-circle d-flex align-items-center justify-content-center fw-bold me-3" style={{ width: '42px', height: '42px', backgroundColor: '#e0f2fe', fontSize: '1rem' }}>
                                                                            {(req.staff_id?.f_name?.[0] || '').toUpperCase()}
                                                                        </div>
                                                                        <div>
                                                                            <span className="fw-bold text-dark d-block" style={{ fontSize: '0.95rem' }}>{req.staff_id?.f_name} {req.staff_id?.l_name}</span>
                                                                            <span className="text-muted d-block" style={{ fontSize: '0.8rem' }}>{req.staff_id?.position || 'Staff Member'}</span>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td className="py-3.5">
                                                                    <Badge
                                                                        bg="none"
                                                                        style={{
                                                                            backgroundColor: `${policyItem?.color || '#23b3f4'}15`,
                                                                            color: policyItem?.color || '#23b3f4',
                                                                            border: `1px solid ${policyItem?.color || '#23b3f4'}30`,
                                                                            borderRadius: '50px',
                                                                            padding: '0.4rem 0.8rem',
                                                                            fontWeight: '700',
                                                                            fontSize: '0.8rem'
                                                                        }}
                                                                    >
                                                                        {policyItem?.name || req.leave_type_id}
                                                                    </Badge>
                                                                    {req.is_half_day && <Badge bg="secondary" className="ms-2 rounded-pill" style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}>Half Day</Badge>}
                                                                </td>
                                                                <td className="py-3.5 fw-bold text-dark" style={{ fontSize: '0.95rem' }}>
                                                                    {req.days} {req.days === 1 ? 'Day' : 'Days'}
                                                                </td>
                                                                <td className="py-3.5 text-muted fw-semibold" style={{ fontSize: '0.9rem' }}>
                                                                    {format(new Date(req.from_date), 'dd/MM/yyyy')}
                                                                    {req.from_date !== req.to_date && ` - ${format(new Date(req.to_date), 'dd/MM/yyyy')}`}
                                                                </td>
                                                                <td className="py-3.5 text-muted" style={{ maxWidth: '240px', fontSize: '0.9rem' }} title={req.reason}>
                                                                    <span className="d-block text-truncate" style={{ maxWidth: '220px' }}>{req.reason}</span>
                                                                    {req.status === 'rejected' && req.rejection_reason && (
                                                                        <div className="text-danger mt-1 text-truncate" style={{ maxWidth: '220px', fontSize: '0.8rem' }} title={req.rejection_reason}>
                                                                            <strong>Reason:</strong> {req.rejection_reason}
                                                                        </div>
                                                                    )}
                                                                </td>
                                                                <td className="py-3.5">
                                                                    <Badge
                                                                        bg="none"
                                                                        style={{
                                                                            backgroundColor: statusTheme.bg,
                                                                            color: statusTheme.color,
                                                                            border: `1px solid ${statusTheme.border}`,
                                                                            borderRadius: '50px',
                                                                            padding: '0.4rem 0.8rem',
                                                                            fontWeight: '700',
                                                                            fontSize: '0.82rem'
                                                                        }}
                                                                    >
                                                                        {statusTheme.label}
                                                                    </Badge>
                                                                </td>
                                                                <td className="pe-4 py-3.5 text-end">
                                                                    {req.status === 'pending' ? (
                                                                        <div className="d-inline-flex gap-2">
                                                                            <Button
                                                                                variant="none"
                                                                                className="leave-btn-outline btn-approve px-3 py-1.5"
                                                                                onClick={() => handleShowApprove(req._id)}
                                                                            >
                                                                                <CsLineIcons icon="check" size="14" /> Approve
                                                                            </Button>
                                                                            <Button
                                                                                variant="none"
                                                                                className="leave-btn-outline btn-reject px-3 py-1.5"
                                                                                onClick={() => handleShowReject(req._id)}
                                                                            >
                                                                                <CsLineIcons icon="close" size="14" /> Reject
                                                                            </Button>
                                                                        </div>
                                                                    ) : (
                                                                        <span className="text-muted fw-medium" style={{ fontSize: '0.85rem' }}>Processed</span>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </Card.Body>
                                </Card>
                            </div>

                            {/* Card View for Mobile */}
                            <div className="d-md-none">
                                <Row className="g-4">
                                    {currentRequests.map((req, idx) => {
                                        const fromDateObj = new Date(req.from_date);
                                        const day = format(fromDateObj, 'dd');
                                        const month = format(fromDateObj, 'MMM');
                                        const yearStr = format(fromDateObj, 'yyyy');
                                        const statusTheme = getStatusTheme(req.status);
                                        const policyItem = leavePolicy[req.leave_type_id];

                                        return (
                                            <Col xs="12" key={req._id || idx}>
                                                <Card className="leave-card border-0 shadow-sm">
                                                    <div className="leave-card-accent" style={{ backgroundColor: statusTheme.color }} />
                                                    <Card.Body className="p-4">
                                                        <div className="d-flex justify-content-between align-items-start mb-4">
                                                            <div className="d-flex align-items-center">
                                                                <div className="leave-calendar-block me-4">
                                                                    <div className="leave-calendar-header" style={{ backgroundColor: statusTheme.color }}>
                                                                        {month}
                                                                    </div>
                                                                    <span className="leave-calendar-day">{day}</span>
                                                                    <span className="leave-calendar-year">{yearStr}</span>
                                                                </div>
                                                                <div>
                                                                    <span className="fw-bold text-dark fs-5 d-block leading-tight">
                                                                        {req.staff_id?.f_name} {req.staff_id?.l_name}
                                                                    </span>
                                                                    <span className="text-muted small fw-medium mt-1 d-block">
                                                                        {req.staff_id?.position || 'Staff Member'}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="leave-data-row">
                                                            <span className="text-muted fw-bold small">Leave Type:</span>
                                                            <span>
                                                                <Badge
                                                                    bg="none"
                                                                    style={{
                                                                        backgroundColor: `${policyItem?.color || '#23b3f4'}15`,
                                                                        color: policyItem?.color || '#23b3f4',
                                                                        border: `1px solid ${policyItem?.color || '#23b3f4'}30`,
                                                                        borderRadius: '50px',
                                                                        padding: '0.35rem 0.75rem',
                                                                        fontWeight: '700'
                                                                    }}
                                                                >
                                                                    {policyItem?.name || req.leave_type_id}
                                                                </Badge>
                                                                {req.is_half_day && <Badge bg="secondary" className="ms-2 rounded-pill">Half Day</Badge>}
                                                            </span>
                                                        </div>

                                                        <div className="leave-data-row">
                                                            <span className="text-muted fw-bold small">Duration:</span>
                                                            <span className="fw-bold text-dark">{req.days} {req.days === 1 ? 'Day' : 'Days'}</span>
                                                        </div>

                                                        <div className="leave-data-row">
                                                            <span className="text-muted fw-bold small">Dates:</span>
                                                            <span className="fw-semibold text-muted small">
                                                                {format(new Date(req.from_date), 'dd/MM/yyyy')}
                                                                {req.from_date !== req.to_date && ` - ${format(new Date(req.to_date), 'dd/MM/yyyy')}`}
                                                            </span>
                                                        </div>

                                                        <div className="leave-data-row">
                                                            <span className="text-muted fw-bold small">Status:</span>
                                                            <Badge
                                                                bg="none"
                                                                style={{
                                                                    backgroundColor: statusTheme.bg,
                                                                    color: statusTheme.color,
                                                                    border: `1px solid ${statusTheme.border}`,
                                                                    borderRadius: '50px',
                                                                    padding: '0.35rem 0.75rem',
                                                                    fontWeight: '700'
                                                                }}
                                                            >
                                                                {statusTheme.label}
                                                            </Badge>
                                                        </div>

                                                        <div className="leave-data-row flex-column align-items-start mt-2 border-0 pb-0">
                                                            <span className="text-muted fw-bold small mb-1">Reason:</span>
                                                            <p className="text-muted small mb-0 fw-medium bg-light p-2.5 w-100 rounded-lg" style={{ borderRadius: '6px' }}>
                                                                {req.reason}
                                                            </p>
                                                        </div>

                                                        {req.status === 'rejected' && req.rejection_reason && (
                                                            <div className="leave-data-row flex-column align-items-start mt-2 border-0 pb-0">
                                                                <span className="text-danger fw-bold small mb-1">Rejection Reason:</span>
                                                                <p className="text-danger small mb-0 fw-medium bg-light p-2.5 w-100 rounded-lg border-start border-3" style={{ borderLeftColor: '#ef4444', borderRadius: '6px' }}>
                                                                    {req.rejection_reason}
                                                                </p>
                                                            </div>
                                                        )}

                                                        {req.status === 'pending' && (
                                                            <div className="d-flex gap-2 mt-4 pt-2 border-top border-faint">
                                                                <Button
                                                                    variant="none"
                                                                    className="leave-btn-outline btn-approve flex-grow-1"
                                                                    onClick={() => handleShowApprove(req._id)}
                                                                >
                                                                    <CsLineIcons icon="check" size="14" /> Approve
                                                                </Button>
                                                                <Button
                                                                    variant="none"
                                                                    className="leave-btn-outline btn-reject flex-grow-1"
                                                                    onClick={() => handleShowReject(req._id)}
                                                                >
                                                                    <CsLineIcons icon="close" size="14" /> Reject
                                                                </Button>
                                                            </div>
                                                        )}
                                                    </Card.Body>
                                                </Card>
                                            </Col>
                                        );
                                    })}
                                </Row>
                            </div>

                            {/* Requests Pagination Controls */}
                            <div className="d-flex flex-column flex-md-row justify-content-between align-items-center mt-4 gap-3 bg-white p-4 rounded shadow-sm">
                                <div className="d-flex align-items-center gap-2">
                                    <span className="text-muted small">Items per page:</span>
                                    <Form.Select
                                        size="sm"
                                        className="w-auto rounded-pill border-light-subtle"
                                        value={pageSize}
                                        onChange={(e) => {
                                            setPageSize(Number(e.target.value));
                                            setCurrentPage(1);
                                        }}
                                        style={{ height: '32px', minWidth: '70px' }}
                                    >
                                        {[5, 10, 20, 50, 100].map(size => (
                                            <option key={size} value={size}>{size}</option>
                                        ))}
                                    </Form.Select>
                                    <span className="text-muted small ms-2">
                                        Showing {filteredRequests.length > 0 ? indexOfFirstReq + 1 : 0} to {Math.min(indexOfLastReq, filteredRequests.length)} of {filteredRequests.length} requests
                                    </span>
                                </div>
                                {pageCountReq > 1 && (
                                    <Pagination className="mb-0">
                                        <Pagination.Prev disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} />
                                        {Array.from({ length: pageCountReq }, (_, i) => i + 1).map(pageNo => (
                                            <Pagination.Item key={pageNo} active={pageNo === currentPage} onClick={() => setCurrentPage(pageNo)}>
                                                {pageNo}
                                            </Pagination.Item>
                                        ))}
                                        <Pagination.Next disabled={currentPage === pageCountReq} onClick={() => setCurrentPage(p => Math.min(p + 1, pageCountReq))} />
                                    </Pagination>
                                )}
                            </div>
                        </>
                    )}
                </>
            ) : (
                <>
                    {filteredBalances.length === 0 ? (
                        <Card className="leave-card text-center py-5 border-0 shadow-sm">
                            <Card.Body className="text-muted py-5">
                                <CsLineIcons icon="user" size="48" className="text-muted opacity-50 mb-3" />
                                <h5 className="fw-bold mt-2">No Staff Records Found</h5>
                                <p className="small mb-0">Try searching with a different name.</p>
                            </Card.Body>
                        </Card>
                    ) : (
                        <>
                            {/* Table View for Desktop / Tablet - Compact & Clean */}
                            <div className="d-none d-md-block">
                                <Card className="border-0 shadow-sm" style={{ borderRadius: '1.5rem', overflow: 'hidden' }}>
                                    <Card.Body className="p-0">
                                        <div className="table-responsive">
                                            <table className="table table-hover align-middle mb-0 leave-table">
                                                <thead className="table-light text-uppercase fw-bold text-muted border-bottom" style={{ fontSize: '0.82rem', letterSpacing: '0.05em' }}>
                                                    <tr>
                                                        <th className="ps-4 py-3">Staff Member</th>
                                                        <th className="py-3">Entitled</th>
                                                        <th className="py-3">Taken</th>
                                                        <th className="py-3">Pending</th>
                                                        <th className="py-3">Remaining</th>
                                                        <th className="py-3">Breakdown</th>
                                                        <th className="pe-4 py-3 text-end">History</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {currentBalances.map((b, idx) => {
                                                        const totalEntitled = b.balances.reduce((acc, curr) => acc + curr.entitled + curr.carried_forward, 0);
                                                        const totalTaken = b.balances.reduce((acc, curr) => acc + curr.taken, 0);
                                                        const totalPending = b.balances.reduce((acc, curr) => acc + curr.pending, 0);
                                                        const totalRemaining = totalEntitled - totalTaken - totalPending;

                                                        return (
                                                            <tr key={b._id || idx}>
                                                                <td className="ps-4 py-3">
                                                                    <div className="d-flex align-items-center">
                                                                        <div className="avatar-char bg-soft-primary text-primary rounded-circle d-flex align-items-center justify-content-center fw-bold me-2.5" style={{ width: '36px', height: '36px', backgroundColor: '#e0f2fe', fontSize: '0.9rem' }}>
                                                                            {(b.staff_id?.f_name?.[0] || '').toUpperCase()}
                                                                        </div>
                                                                        <div>
                                                                            <span className="fw-bold text-dark d-block" style={{ fontSize: '0.95rem' }}>{b.staff_id?.f_name} {b.staff_id?.l_name}</span>
                                                                            <span className="text-muted d-block" style={{ fontSize: '0.8rem' }}>{b.staff_id?.position || 'Staff Member'}</span>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td className="py-3 fw-semibold text-primary" style={{ fontSize: '0.95rem' }}>{totalEntitled}d</td>
                                                                <td className="py-3 fw-semibold text-success" style={{ fontSize: '0.95rem' }}>{totalTaken}d</td>
                                                                <td className="py-3 fw-semibold text-warning" style={{ fontSize: '0.95rem' }}>{totalPending}d</td>
                                                                <td className="py-3 fw-bold text-dark" style={{ fontSize: '0.95rem' }}>{totalRemaining}d</td>
                                                                <td className="py-3">
                                                                    <div className="d-flex flex-wrap gap-1">
                                                                        {b.balances.map((lt, ltIdx) => {
                                                                            const policyItem = leavePolicy[lt.leave_type_id];
                                                                            const entitled = lt.entitled + lt.carried_forward;
                                                                            const remaining = entitled - lt.taken - lt.pending;
                                                                            const color = policyItem?.color || '#1ea8e7';
                                                                            const typeName = policyItem?.name || lt.leave_type_id;
                                                                            const initials = typeName.split(' ').map(w => w[0]).join('').toUpperCase().substring(0, 3);

                                                                            return (
                                                                                <Badge
                                                                                    key={ltIdx}
                                                                                    bg="none"
                                                                                    style={{
                                                                                        backgroundColor: `${color}10`,
                                                                                        color,
                                                                                        border: `1px solid ${color}20`,
                                                                                        borderRadius: '6px',
                                                                                        padding: '0.25rem 0.5rem',
                                                                                        fontWeight: '700',
                                                                                        fontSize: '0.78rem'
                                                                                    }}
                                                                                    title={`${typeName}: ${remaining} remaining of ${entitled} days`}
                                                                                >
                                                                                    {initials}: {remaining}/{entitled}d
                                                                                </Badge>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                </td>
                                                                <td className="pe-4 py-2 text-end">
                                                                    <Button
                                                                        variant="none"
                                                                        className="leave-card-icon-btn"
                                                                        onClick={() => handleShowHistory(b)}
                                                                        title="View History"
                                                                    >
                                                                        <CsLineIcons icon="clock" size="14" />
                                                                    </Button>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </Card.Body>
                                </Card>
                            </div>

                            {/* Card View for Mobile */}
                            <div className="d-md-none">
                                <Row className="g-4">
                                    {currentBalances.map((b, idx) => {
                                        const totalEntitled = b.balances.reduce((acc, curr) => acc + curr.entitled + curr.carried_forward, 0);
                                        const totalTaken = b.balances.reduce((acc, curr) => acc + curr.taken, 0);
                                        const totalPending = b.balances.reduce((acc, curr) => acc + curr.pending, 0);
                                        const totalRemaining = totalEntitled - totalTaken - totalPending;

                                        return (
                                            <Col xs="12" key={b._id || idx}>
                                                <Card className="leave-card border-0 shadow-sm">
                                                    <Card.Body className="p-4">
                                                        <div className="d-flex justify-content-between align-items-start mb-4">
                                                            <div>
                                                                <h5 className="fw-bold text-dark mb-1">
                                                                    {b.staff_id?.f_name} {b.staff_id?.l_name}
                                                                </h5>
                                                                <span className="text-muted small fw-bold text-uppercase letter-spacing-1">
                                                                    {b.staff_id?.position || 'Staff Member'}
                                                                </span>
                                                            </div>
                                                            <Button
                                                                variant="none"
                                                                className="leave-btn-outline btn-history"
                                                                onClick={() => handleShowHistory(b)}
                                                            >
                                                                <CsLineIcons icon="clock" size="14" /> View History
                                                            </Button>
                                                        </div>

                                                        <div className="bg-light p-3 rounded-lg d-flex justify-content-around text-center mb-4 border border-faint">
                                                            <div>
                                                                <span className="d-block text-muted small fw-bold">Entitled</span>
                                                                <span className="fs-4 fw-bold text-primary">{totalEntitled}d</span>
                                                            </div>
                                                            <div className="border-end border-light" />
                                                            <div>
                                                                <span className="d-block text-muted small fw-bold">Taken</span>
                                                                <span className="fs-4 fw-bold text-success">{totalTaken}d</span>
                                                            </div>
                                                            <div className="border-end border-light" />
                                                            <div>
                                                                <span className="d-block text-muted small fw-bold">Pending</span>
                                                                <span className="fs-4 fw-bold text-warning">{totalPending}d</span>
                                                            </div>
                                                            <div className="border-end border-light" />
                                                            <div>
                                                                <span className="d-block text-muted small fw-bold">Remaining</span>
                                                                <span className="fs-4 fw-bold text-dark">{totalRemaining}d</span>
                                                            </div>
                                                        </div>

                                                        <h6 className="fw-bold text-dark mb-3 small text-uppercase letter-spacing-1">Leave Types Breakdown</h6>
                                                        <Row className="g-3">
                                                            {b.balances.map((lt, ltIdx) => {
                                                                const policyItem = leavePolicy[lt.leave_type_id];
                                                                const entitled = lt.entitled + lt.carried_forward;
                                                                const remaining = entitled - lt.taken - lt.pending;
                                                                const percentTaken = entitled > 0 ? (lt.taken / entitled) * 100 : 0;
                                                                const color = policyItem?.color || '#1ea8e7';

                                                                return (
                                                                    <Col md="12" key={ltIdx} className="mb-2">
                                                                        <div className="d-flex justify-content-between align-items-center mb-1">
                                                                            <div className="d-flex align-items-center">
                                                                                <span
                                                                                    className="d-inline-block rounded-circle me-2"
                                                                                    style={{ width: '8px', height: '8px', backgroundColor: color }}
                                                                                />
                                                                                <span className="fw-bold text-muted small">{policyItem?.name || lt.leave_type_id}</span>
                                                                            </div>
                                                                            <span className="small fw-bold text-dark">
                                                                                {remaining} / {entitled} Days Remaining
                                                                            </span>
                                                                        </div>
                                                                        <div className="leave-progress mb-1">
                                                                            <div
                                                                                className="leave-progress-bar"
                                                                                style={{ width: `${percentTaken}%`, backgroundColor: color }}
                                                                            />
                                                                        </div>
                                                                        <div className="d-flex justify-content-between text-muted" style={{ fontSize: '0.72rem' }}>
                                                                            <span>Taken: {lt.taken}d</span>
                                                                            <span>Pending: {lt.pending}d</span>
                                                                        </div>
                                                                    </Col>
                                                                );
                                                            })}
                                                        </Row>
                                                    </Card.Body>
                                                </Card>
                                            </Col>
                                        );
                                    })}
                                </Row>
                            </div>

                            {/* Balances Pagination Controls */}
                            <div className="d-flex flex-column flex-md-row justify-content-between align-items-center mt-4 gap-3 bg-white p-4 rounded shadow-sm">
                                <div className="d-flex align-items-center gap-2">
                                    <span className="text-muted small">Items per page:</span>
                                    <Form.Select
                                        size="sm"
                                        className="w-auto rounded-pill border-light-subtle"
                                        value={pageSize}
                                        onChange={(e) => {
                                            setPageSize(Number(e.target.value));
                                            setCurrentPage(1);
                                        }}
                                        style={{ height: '32px', minWidth: '70px' }}
                                    >
                                        {[5, 10, 20, 50, 100].map(size => (
                                            <option key={size} value={size}>{size}</option>
                                        ))}
                                    </Form.Select>
                                    <span className="text-muted small ms-2">
                                        Showing {filteredBalances.length > 0 ? indexOfFirstBal + 1 : 0} to {Math.min(indexOfLastBal, filteredBalances.length)} of {filteredBalances.length} staff
                                    </span>
                                </div>
                                {pageCountBal > 1 && (
                                    <Pagination className="mb-0">
                                        <Pagination.Prev disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} />
                                        {Array.from({ length: pageCountBal }, (_, i) => i + 1).map(pageNo => (
                                            <Pagination.Item key={pageNo} active={pageNo === currentPage} onClick={() => setCurrentPage(pageNo)}>
                                                {pageNo}
                                            </Pagination.Item>
                                        ))}
                                        <Pagination.Next disabled={currentPage === pageCountBal} onClick={() => setCurrentPage(p => Math.min(p + 1, pageCountBal))} />
                                    </Pagination>
                                )}
                            </div>
                        </>
                    )}
                </>
            )}

            {/* Rejection Reason Modal */}
            <Modal show={showRejectModal} onHide={() => setShowRejectModal(false)} centered className="leave-modal">
                <Modal.Header closeButton>
                    <Modal.Title className="text-danger fw-bold">
                        Reject Leave Request
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className="text-center mb-3">
                        <div className="d-inline-flex align-items-center justify-content-center bg-light-danger rounded-circle mb-3" style={{ width: '60px', height: '60px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
                            <CsLineIcons icon="close" size="26" />
                        </div>
                        <h5 className="fw-bold text-dark">Confirm Leave Rejection</h5>
                        <p className="text-muted small mb-0 px-2 mt-2">
                            Please provide a valid reason for rejecting this leave request. The staff member will be notified of the decision.
                        </p>
                    </div>
                    <Form.Group className="mt-3">
                        <Form.Label className="small fw-bold text-muted text-uppercase mb-2">Reason for Rejection <span className="text-danger">*</span></Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={3}
                            placeholder="Enter rejection reason for staff..."
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            className="leave-input"
                        />
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer className="border-top-0 pt-0" style={{ display: 'flex', justifyContent: 'center' }}>
                    <Button variant="none" className="leave-btn-outline btn-reject px-4" onClick={submitReject}>Reject Leave</Button>
                </Modal.Footer>
            </Modal>

            {/* Approval Confirmation Modal */}
            <Modal show={showApproveModal} onHide={() => setShowApproveModal(false)} centered className="leave-modal">
                <Modal.Header closeButton>
                    <Modal.Title className="text-success fw-bold">
                        Approve Leave Request
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className="text-center py-2 mb-3">
                        <div className="d-inline-flex align-items-center justify-content-center bg-light-success rounded-circle mb-3" style={{ width: '60px', height: '60px', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                            <CsLineIcons icon="check" size="30" />
                        </div>
                        <h5 className="fw-bold text-dark">Confirm Leave Approval</h5>
                        <p className="text-muted small mb-0 px-2 mt-2">
                            Are you sure you want to approve this leave request? The employee's leave balance will be automatically deducted based on the requested duration.
                        </p>
                    </div>
                </Modal.Body>
                <Modal.Footer className="border-top-0 pt-0" style={{ display: 'flex', justifyContent: 'center' }}>
                    <Button variant="none" className="leave-btn-outline btn-approve px-4" onClick={submitApprove}>Approve Leave</Button>
                </Modal.Footer>
            </Modal>

            {/* Staff History & Taken Leaves Details Modal */}
            <Modal show={showHistoryModal} onHide={() => setShowHistoryModal(false)} centered size="lg" className="leave-modal">
                <Modal.Header closeButton>
                    <Modal.Title className="fw-bold">
                        Leave History & Details
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {historyStaff && (
                        <>
                            <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom border-faint">
                                <div>
                                    <h4 className="fw-bold text-dark mb-0">
                                        {historyStaff.staff_id?.f_name} {historyStaff.staff_id?.l_name}
                                    </h4>
                                    <span className="text-muted small fw-bold text-uppercase">{historyStaff.staff_id?.position}</span>
                                </div>
                                <div className="text-end">
                                    <span className="d-block text-muted small fw-bold text-uppercase">Year</span>
                                    <span className="fs-4 fw-bold text-primary">{currentYear}</span>
                                </div>
                            </div>

                            <h5 className="fw-bold text-dark mb-3">Timeline of Leaves taken</h5>
                            {staffHistoryRequests.length === 0 ? (
                                <div className="text-center py-4 text-muted bg-light rounded-lg">
                                    <CsLineIcons icon="calendar" className="mb-2 opacity-50" size="24" />
                                    <p className="small mb-0">No leave application history found for this staff member.</p>
                                </div>
                            ) : (
                                <div className="timeline-container ps-1">
                                    {staffHistoryRequests.map((req, hIdx) => {
                                        const theme = getStatusTheme(req.status);
                                        const policyItem = leavePolicy[req.leave_type_id];

                                        return (
                                            <div className="timeline-item" key={req._id || hIdx}>
                                                <div className="timeline-marker" style={{ borderColor: theme.color }} />
                                                <div className="bg-light p-3 rounded-lg border border-faint shadow-sm">
                                                    <div className="d-flex justify-content-between align-items-start mb-2">
                                                        <div>
                                                            <Badge
                                                                bg="none"
                                                                style={{
                                                                    backgroundColor: `${policyItem?.color || '#23b3f4'}15`,
                                                                    color: policyItem?.color || '#23b3f4',
                                                                    border: `1px solid ${policyItem?.color || '#23b3f4'}30`,
                                                                    borderRadius: '50px',
                                                                    padding: '0.3rem 0.6rem',
                                                                    fontWeight: '700'
                                                                }}
                                                            >
                                                                {policyItem?.name || req.leave_type_id}
                                                            </Badge>
                                                            <span className="ms-2 fw-bold text-dark small">{req.days} {req.days === 1 ? 'Day' : 'Days'}</span>
                                                        </div>
                                                        <Badge
                                                            bg="none"
                                                            style={{
                                                                backgroundColor: theme.bg,
                                                                color: theme.color,
                                                                border: `1px solid ${theme.border}`,
                                                                borderRadius: '50px',
                                                                padding: '0.3rem 0.6rem',
                                                                fontWeight: '700'
                                                            }}
                                                        >
                                                            {theme.label}
                                                        </Badge>
                                                    </div>
                                                    <div className="text-muted small fw-semibold mb-2">
                                                        <CsLineIcons icon="calendar" size="12" className="me-1" />
                                                        {format(new Date(req.from_date), 'dd/MM/yyyy')}
                                                        {req.from_date !== req.to_date && ` - ${format(new Date(req.to_date), 'dd/MM/yyyy')}`}
                                                    </div>
                                                    <p className="text-muted small mb-0 fw-medium">
                                                        <strong>Reason:</strong> {req.reason}
                                                    </p>
                                                    {req.status === 'rejected' && req.rejection_reason && (
                                                        <p className="text-danger small mb-0 mt-2 fw-medium bg-white p-2 rounded border-start border-3 border-danger">
                                                            <strong>Rejection Reason:</strong> {req.rejection_reason}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="none" className="leave-btn-outline" onClick={() => setShowHistoryModal(false)}>Close Details</Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default LeaveRequests;
