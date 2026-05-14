import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Table, Badge, Modal, Form, Spinner, Tabs, Tab } from 'react-bootstrap';
import { toast } from 'react-toastify';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import { getLeaveRequests, updateLeaveStatus, getLeaveBalances } from 'api/leave';
import { getLeavePolicy } from 'api/payrollConfig';
import { format } from 'date-fns';

const LeaveRequests = () => {
    const title = 'Leave Management';
    const description = 'Manage staff leave requests and track leave balances.';
    const breadcrumbs = [
        { to: '', text: 'Home' },
        { to: 'staff/view', text: 'Staff' },
        { to: 'staff/leave-requests', title: 'Leave Requests' }
    ];

    const currentYear = new Date().getFullYear();
    const [activeTab, setActiveTab] = useState('requests');
    const [requests, setRequests] = useState([]);
    const [balances, setBalances] = useState([]);
    const [leavePolicy, setLeavePolicy] = useState({});
    const [loading, setLoading] = useState(true);

    const [statusFilter, setStatusFilter] = useState('pending');

    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectingId, setRejectingId] = useState(null);
    const [rejectReason, setRejectReason] = useState('');

    const fetchData = async () => {
        try {
            setLoading(true);
            const [reqRes, balRes, polRes] = await Promise.all([
                getLeaveRequests(statusFilter),
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
    }, [statusFilter]);

    const handleApprove = async (id) => {
        if (!window.confirm("Approve this leave request? Leave balance will be deducted automatically.")) return;
        try {
            const res = await updateLeaveStatus(id, 'approved');
            if (res.success) {
                toast.success('Leave approved');
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
                toast.success('Leave rejected');
                setShowRejectModal(false);
                fetchData();
            }
        } catch (err) {
            toast.error('Rejection failed');
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'approved': return <Badge bg="success">Approved</Badge>;
            case 'rejected': return <Badge bg="danger">Rejected</Badge>;
            case 'cancelled': return <Badge bg="secondary">Cancelled</Badge>;
            default: return <Badge bg="warning" text="dark">Pending</Badge>;
        }
    };

    return (
        <>
            <HtmlHead title={title} description={description} />
            <div className="page-title-container">
                <Row className="g-0">
                    <Col className="col-auto mb-3 mb-sm-0 me-auto">
                        <h1 className="mb-0 pb-0 display-4">{title}</h1>
                        <BreadcrumbList items={breadcrumbs} />
                    </Col>
                </Row>
            </div>

            <Card className="mb-5">
                <Card.Body>
                    <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="mb-4">
                        <Tab eventKey="requests" title="Leave Requests">
                            <div className="d-flex justify-content-between mb-3">
                                <h5>All Leave Requests</h5>
                                <Form.Select 
                                    style={{ width: '200px' }} 
                                    value={statusFilter} 
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                >
                                    <option value="all">All Statuses</option>
                                    <option value="pending">Pending Only</option>
                                    <option value="approved">Approved Only</option>
                                    <option value="rejected">Rejected Only</option>
                                </Form.Select>
                            </div>

                            {loading ? <div className="text-center py-5"><Spinner animation="border" /></div> :
                            requests.length === 0 ? <div className="text-center py-5 text-muted">No requests found.</div> :
                            <Table responsive hover>
                                <thead className="table-light">
                                    <tr>
                                        <th>Staff Name</th>
                                        <th>Leave Type</th>
                                        <th>Dates</th>
                                        <th>Days</th>
                                        <th>Reason</th>
                                        <th>Status</th>
                                        <th className="text-end">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {requests.map(req => (
                                        <tr key={req._id}>
                                            <td className="align-middle fw-bold">
                                                {req.staff_id?.f_name} {req.staff_id?.l_name}
                                                <div className="text-muted small">{req.staff_id?.position}</div>
                                            </td>
                                            <td className="align-middle">
                                                <Badge bg="light" text="dark" className="border border-secondary">
                                                    {leavePolicy[req.leave_type_id]?.short_code || req.leave_type_id}
                                                </Badge>
                                                {req.is_half_day && <span className="ms-2 small text-muted">(Half Day)</span>}
                                            </td>
                                            <td className="align-middle">
                                                {format(new Date(req.from_date), 'dd MMM yyyy')}
                                                {req.from_date !== req.to_date && ` - ${format(new Date(req.to_date), 'dd MMM yyyy')}`}
                                            </td>
                                            <td className="align-middle fw-bold">{req.days}</td>
                                            <td className="align-middle">{req.reason}</td>
                                            <td className="align-middle">{getStatusBadge(req.status)}</td>
                                            <td className="text-end align-middle">
                                                {req.status === 'pending' && (
                                                    <>
                                                        <Button variant="outline-success" size="sm" className="me-2" onClick={() => handleApprove(req._id)}>
                                                            <CsLineIcons icon="check" size="14" /> Approve
                                                        </Button>
                                                        <Button variant="outline-danger" size="sm" onClick={() => handleShowReject(req._id)}>
                                                            <CsLineIcons icon="close" size="14" /> Reject
                                                        </Button>
                                                    </>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                            }
                        </Tab>

                        <Tab eventKey="balances" title="Staff Leave Balances">
                            <h5 className="mb-3">Leave Balances ({currentYear})</h5>
                            {loading ? <div className="text-center py-5"><Spinner animation="border" /></div> :
                            balances.length === 0 ? <div className="text-center py-5 text-muted">No balance records found. Initialize balances when adding staff.</div> :
                            <Table responsive bordered hover size="sm">
                                <thead className="table-light">
                                    <tr>
                                        <th>Staff Name</th>
                                        <th>Leave Type</th>
                                        <th className="text-center text-primary">Entitled</th>
                                        <th className="text-center text-success">Taken</th>
                                        <th className="text-center text-warning">Pending</th>
                                        <th className="text-center text-dark">Remaining</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {balances.map(b => (
                                        b.balances.map((lt, idx) => (
                                            <tr key={`${b._id}-${idx}`}>
                                                {idx === 0 && (
                                                    <td rowSpan={b.balances.length} className="align-middle fw-bold bg-light">
                                                        {b.staff_id?.f_name} {b.staff_id?.l_name}
                                                    </td>
                                                )}
                                                <td className="align-middle">
                                                    {leavePolicy[lt.leave_type_id]?.name || lt.leave_type_id}
                                                </td>
                                                <td className="text-center align-middle text-primary fw-bold">{lt.entitled + lt.carried_forward}</td>
                                                <td className="text-center align-middle text-success fw-bold">{lt.taken}</td>
                                                <td className="text-center align-middle text-warning fw-bold">{lt.pending}</td>
                                                <td className="text-center align-middle text-dark fw-bold">
                                                    {(lt.entitled + lt.carried_forward) - lt.taken - lt.pending}
                                                </td>
                                            </tr>
                                        ))
                                    ))}
                                </tbody>
                            </Table>
                            }
                        </Tab>
                    </Tabs>
                </Card.Body>
            </Card>

            <Modal show={showRejectModal} onHide={() => setShowRejectModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title className="text-danger">Reject Leave Request</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form.Group>
                        <Form.Label>Reason for Rejection <span className="text-danger">*</span></Form.Label>
                        <Form.Control 
                            as="textarea" 
                            rows={3} 
                            placeholder="Enter reason for staff..." 
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                        />
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowRejectModal(false)}>Cancel</Button>
                    <Button variant="danger" onClick={submitReject}>Reject Leave</Button>
                </Modal.Footer>
            </Modal>
        </>
    );
};

export default LeaveRequests;
