import React, { useState, useEffect } from 'react';
import { useHistory, useParams, Link } from 'react-router-dom';
import axios from 'axios';
import {
    Row, Col, Card, Button, Badge, Alert, Modal,
    Form, Spinner, Table, InputGroup,
} from 'react-bootstrap';
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import { toast } from 'react-toastify';

const MONTH_NAMES = [
    '', 'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
];

const currentDate = new Date();

export default function ManagePayroll() {
    const title = 'Manage Payroll';
    const description = 'View and manage monthly payroll for all staff';
    const { month: paramMonth, year: paramYear } = useParams();
    const breadcrumbs = [
        { to: '', text: 'Home' },
        { to: 'payroll', text: 'Payroll' },
    ];

    const history = useHistory();

    // ── Filters ──────────────────────────────────────────────────────────────────
    const [month, setMonth] = useState(Number(paramMonth) || currentDate.getMonth() + 1);
    const [year, setYear] = useState(Number(paramYear) || currentDate.getFullYear());

    // ── Data ─────────────────────────────────────────────────────────────────────
    const [summary, setSummary] = useState([]);
    const [totals, setTotals] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // ── Selection ────────────────────────────────────────────────────────────────
    const [selectedIds, setSelectedIds] = useState(new Set());

    // ── Edit Modal ───────────────────────────────────────────────────────────────
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingPayroll, setEditingPayroll] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [isSavingEdit, setIsSavingEdit] = useState(false);

    // ── Delete Modal ─────────────────────────────────────────────────────────────
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletingPayroll, setDeletingPayroll] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // ── Mark Paid/Unpaid ─────────────────────────────────────────────────────────
    const [isMarkingPaid, setIsMarkingPaid] = useState(false);

    const authHeader = () => ({
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    });

    // ── Fetch Summary ────────────────────────────────────────────────────────────
    const fetchSummary = async () => {
        setLoading(true);
        setError('');
        setSelectedIds(new Set());
        try {
            const res = await axios.get(
                `${process.env.REACT_APP_API}/payroll/summary/${month}/${year}`,
                authHeader()
            );
            setSummary(res.data.data || []);
            setTotals(res.data.totals || {});
        } catch (err) {
            setError('Failed to load payroll data.');
            toast.error('Failed to load payroll data.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchSummary(); }, [month, year]);

    // ── Selection Helpers ────────────────────────────────────────────────────────
    const toggleSelect = (id) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const toggleSelectAll = () => {
        const payrollIds = summary.filter((s) => s.payroll).map((s) => s.payroll._id);
        if (selectedIds.size === payrollIds.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(payrollIds));
        }
    };

    // ── Mark Paid ────────────────────────────────────────────────────────────────
    const handleMarkPaid = async (ids) => {
        setIsMarkingPaid(true);
        try {
            const res = await axios.put(
                `${process.env.REACT_APP_API}/payroll/mark-paid`,
                { ids: Array.from(ids) },
                authHeader()
            );
            toast.success(res.data.message);
            setSelectedIds(new Set());
            fetchSummary();
        } catch {
            toast.error('Failed to mark as paid.');
        } finally {
            setIsMarkingPaid(false);
        }
    };

    // ── Mark Unpaid ──────────────────────────────────────────────────────────────
    const handleMarkUnpaid = async (ids) => {
        setIsMarkingPaid(true);
        try {
            const res = await axios.put(
                `${process.env.REACT_APP_API}/payroll/mark-unpaid`,
                { ids: Array.from(ids) },
                authHeader()
            );
            toast.success(res.data.message);
            setSelectedIds(new Set());
            fetchSummary();
        } catch {
            toast.error('Failed to mark as unpaid.');
        } finally {
            setIsMarkingPaid(false);
        }
    };

    // ── Open Edit Modal ───────────────────────────────────────────────────────────
    const openEditModal = (payroll, staff) => {
        setEditingPayroll({ ...payroll, staff });
        setEditForm({
            overtime_hours: payroll.overtime_hours,
            bonus: payroll.bonus,
            deductions: payroll.deductions,
            deduction_reason: payroll.deduction_reason || '',
            notes: payroll.notes || '',
            working_days_in_month: payroll.working_days_in_month,
        });
        setShowEditModal(true);
    };

    // Recalculate net preview in edit modal
    const editNetPreview = () => {
        if (!editingPayroll) return 0;
        const safeDays = (Number(editForm.working_days_in_month) || 1);
        const base = editingPayroll.staff?.salary || editingPayroll.base_salary || 0;
        const earned = editingPayroll.earned_breakdown?.total_gross || ((base / safeDays) * editingPayroll.present_days);
        const ot_pay = (parseFloat(editForm.overtime_hours) || 0) * (editingPayroll.overtime_rate || 0);
        const net = earned + ot_pay + (parseFloat(editForm.bonus) || 0) - (parseFloat(editForm.deductions) || 0);
        return parseFloat(net.toFixed(2));
    };

    // ── Save Edit ────────────────────────────────────────────────────────────────
    const handleSaveEdit = async () => {
        setIsSavingEdit(true);
        try {
            await axios.put(
                `${process.env.REACT_APP_API}/payroll/update/${editingPayroll._id}`,
                editForm,
                authHeader()
            );
            toast.success('Payroll updated successfully.');
            setShowEditModal(false);
            fetchSummary();
        } catch {
            toast.error('Failed to update payroll.');
        } finally {
            setIsSavingEdit(false);
        }
    };

    // ── Delete ───────────────────────────────────────────────────────────────────
    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            await axios.delete(
                `${process.env.REACT_APP_API}/payroll/delete/${deletingPayroll._id}`,
                authHeader()
            );
            toast.success('Payroll record deleted.');
            setShowDeleteModal(false);
            fetchSummary();
        } catch {
            toast.error('Failed to delete payroll.');
        } finally {
            setIsDeleting(false);
        }
    };

    // ── Year options ─────────────────────────────────────────────────────────────
    const yearOptions = [];
    for (let y = currentDate.getFullYear(); y >= currentDate.getFullYear() - 5; y--) yearOptions.push(y);

    const payrollRows = summary.filter((s) => s.payroll);
    const allSelected = payrollRows.length > 0 && selectedIds.size === payrollRows.length;

    return (
        <>
            <HtmlHead title={title} description={description} />

            <Row>
                <Col>
                    {/* ── Header ── */}
                    <div className="page-title-container">
                        <Row className="align-items-center">
                            <Col xs="12" md="7">
                                <h1 className="mb-0 pb-0 display-4">{title}</h1>
                                <BreadcrumbList items={breadcrumbs} />
                            </Col>
                            <Col xs="12" md="5" className="d-flex justify-content-end gap-2">
                                <Button variant="primary" as={Link} to="/staff/payroll/generate" className="btn-icon btn-icon-start w-100 w-md-auto">
                                    <CsLineIcons icon="plus" className="me-2" />
                                    Generate Payroll
                                </Button>
                                <Button variant="primary" as={Link} to="/staff/payroll/settings" className="btn-icon btn-icon-start w-100 w-md-auto">
                                    <CsLineIcons icon="gear" className="me-2" />
                                    Settings
                                </Button>
                            </Col>
                        </Row>
                    </div>

                    {/* ── Month / Year Selector ── */}
                    <Card className="mb-4">
                        <Card.Body>
                            <Row className="g-3 align-items-end">
                                <Col xs={12} md={3}>
                                    <Form.Label>Month</Form.Label>
                                    <Form.Select value={month} onChange={(e) => setMonth(Number(e.target.value))}>
                                        {MONTH_NAMES.slice(1).map((m, i) => (
                                            <option key={i + 1} value={i + 1}>{m}</option>
                                        ))}
                                    </Form.Select>
                                </Col>
                                <Col xs={12} md={2}>
                                    <Form.Label>Year</Form.Label>
                                    <Form.Select value={year} onChange={(e) => setYear(Number(e.target.value))}>
                                        {yearOptions.map((y) => <option key={y} value={y}>{y}</option>)}
                                    </Form.Select>
                                </Col>
                            </Row>
                        </Card.Body>
                    </Card>

                    {/* ── Stats Cards ── */}
                    {!loading && (
                        <Row className="g-3 mb-4">
                            {[
                                { label: 'Total Net Payroll', value: `₹${(totals.total_net_salary || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, icon: 'dollar', color: 'text-primary' },
                                { label: 'Paid', value: `₹${(totals.total_paid || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, icon: 'check-circle', color: 'text-success' },
                                { label: 'Unpaid', value: `₹${(totals.total_unpaid || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, icon: 'clock', color: 'text-warning' },
                                { label: 'Not Generated', value: totals.count_not_generated || 0, icon: 'info-hexagon', color: 'text-danger' },
                            ].map((s) => (
                                <Col xs={6} md={3} key={s.label}>
                                    <Card className="h-100">
                                        <Card.Body className="text-center">
                                            <CsLineIcons icon={s.icon} size="24" className={`${s.color} mb-2`} />
                                            <div className="text-muted small">{s.label}</div>
                                            <h5 className={`mb-0 ${s.color}`}>{s.value}</h5>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            ))}
                        </Row>
                    )}

                    {error && (
                        <Alert variant="danger" className="mb-4">
                            <CsLineIcons icon="error" className="me-2" />{error}
                        </Alert>
                    )}

                    {/* ── Bulk Action Bar ── */}
                    {selectedIds.size > 0 && (
                        <div className="d-flex align-items-center gap-2 mb-3 p-3 bg-light rounded">
                            <CsLineIcons icon="check-circle" className="text-primary" />
                            <span>{selectedIds.size} selected</span>
                            <Button
                                variant="success"
                                size="sm"
                                className='btn-icon'
                                onClick={() => handleMarkPaid(selectedIds)}
                                disabled={isMarkingPaid}
                            >
                                {isMarkingPaid
                                    ? <Spinner as="span" animation="border" size="sm" />
                                    : <><CsLineIcons icon="check" className="me-1" />Mark Paid</>}
                            </Button>
                            <Button
                                variant="warning"
                                size="sm"
                                className='btn-icon'
                                onClick={() => handleMarkUnpaid(selectedIds)}
                                disabled={isMarkingPaid}
                            >
                                <CsLineIcons icon="rotate-left" className="me-1" />Mark Unpaid
                            </Button>
                            <Button
                                variant="outline-secondary"
                                size="sm"
                                className='btn-icon'
                                onClick={() => setSelectedIds(new Set())}
                            >
                                Clear
                            </Button>
                        </div>
                    )}

                    {/* ── Main Table ── */}
                    <Card>
                        <Card.Header>
                            <Card.Title className="mb-0">
                                <CsLineIcons icon="layout" className="me-2" />
                                {MONTH_NAMES[month]} {year} — Payroll
                            </Card.Title>
                        </Card.Header>

                        <Card.Body className="p-0">
                            {loading ? (
                                <div className="text-center py-5">
                                    <Spinner animation="border" variant="primary" className="mb-3" />
                                    <p className="text-muted">Loading payroll data...</p>
                                </div>
                            ) : summary.length === 0 ? (
                                <div className="text-center py-5">
                                    <CsLineIcons icon="inbox" size="48" className="text-muted mb-3" />
                                    <h5>No Staff Found</h5>
                                    <p className="text-muted">Add staff members to generate payroll.</p>
                                </div>
                            ) : (
                                <div className="table-responsive">
                                    <Table hover className="mb-0">
                                        <thead className="table-light">
                                            <tr>
                                                <th style={{ width: '40px' }}>
                                                    <Form.Check
                                                        type="checkbox"
                                                        checked={allSelected}
                                                        onChange={toggleSelectAll}
                                                        disabled={payrollRows.length === 0}
                                                    />
                                                </th>
                                                <th>Staff</th>
                                                <th className="text-center">Present</th>
                                                <th className="text-center">Absent</th>
                                                <th className="text-end">Base Salary</th>
                                                <th className="text-end">Earned</th>
                                                <th className="text-end">OT Pay</th>
                                                <th className="text-end">Bonus</th>
                                                <th className="text-end">Deductions</th>
                                                <th className="text-end fw-bold">Net Salary</th>
                                                <th className="text-center">Status</th>
                                                <th className="text-center">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {summary.map(({ staff, payroll }) => (
                                                <tr key={staff._id} className={selectedIds.has(payroll?._id) ? 'table-primary' : ''}>
                                                    {/* Checkbox */}
                                                    <td>
                                                        {payroll ? (
                                                            <Form.Check
                                                                type="checkbox"
                                                                checked={selectedIds.has(payroll._id)}
                                                                onChange={() => toggleSelect(payroll._id)}
                                                            />
                                                        ) : (
                                                            <span className="text-muted">—</span>
                                                        )}
                                                    </td>

                                                    {/* Staff */}
                                                    <td>
                                                        <div className="fw-medium">{staff.f_name} {staff.l_name}</div>
                                                        <small className="text-muted">{staff.position} · {staff.staff_id}</small>
                                                    </td>

                                                    {payroll ? (
                                                        <>
                                                            <td className="text-center"><Badge bg="success">{payroll.present_days}</Badge></td>
                                                            <td className="text-center">
                                                                <Badge bg={payroll.absent_days > 0 ? 'danger' : 'light'} text={payroll.absent_days > 0 ? undefined : 'dark'}>
                                                                    {payroll.absent_days}
                                                                </Badge>
                                                            </td>
                                                            <td className="text-end">₹{(staff.salary || payroll.base_salary || 0).toLocaleString('en-IN')}</td>
                                                            <td className="text-end text-success">₹{(payroll.earned_breakdown?.total_gross || payroll.earned_salary || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                                            <td className="text-end text-primary">₹{(payroll.overtime_pay || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                                            <td className="text-end">₹{(payroll.bonus || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                                            <td className="text-end text-danger">₹{((payroll.deduction_breakdown?.total_statutory || 0) + (payroll.deductions || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                                            <td className="text-end fw-bold">₹{payroll.net_salary.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                                            <td className="text-center">
                                                                {payroll.status === 'paid' ? (
                                                                    <Badge bg="success">
                                                                        <CsLineIcons icon="check" size={12} className="me-1" />Paid
                                                                    </Badge>
                                                                ) : (
                                                                    <Badge bg="warning">
                                                                        <CsLineIcons icon="clock" size={12} className="me-1" />Unpaid
                                                                    </Badge>
                                                                )}
                                                            </td>
                                                            <td className="text-center">
                                                                <div className="d-flex justify-content-center gap-1">
                                                                    {/* Mark paid / unpaid quick toggle */}
                                                                    {payroll.status === 'unpaid' ? (
                                                                        <Button
                                                                            variant="outline-success"
                                                                            size="sm"
                                                                            className="btn-icon btn-icon-only"
                                                                            title="Mark Paid"
                                                                            onClick={() => handleMarkPaid(new Set([payroll._id]))}
                                                                            disabled={isMarkingPaid}
                                                                        >
                                                                            <CsLineIcons icon="check" />
                                                                        </Button>
                                                                    ) : (
                                                                        <Button
                                                                            variant="outline-warning"
                                                                            size="sm"
                                                                            className="btn-icon btn-icon-only"
                                                                            title="Mark Unpaid"
                                                                            onClick={() => handleMarkUnpaid(new Set([payroll._id]))}
                                                                            disabled={isMarkingPaid}
                                                                        >
                                                                            <CsLineIcons icon="close" />
                                                                        </Button>
                                                                    )}
                                                                    {/* Edit */}
                                                                    <Button
                                                                        variant="outline-primary"
                                                                        size="sm"
                                                                        className="btn-icon btn-icon-only"
                                                                        title="Edit"
                                                                        onClick={() => openEditModal(payroll, staff)}
                                                                    >
                                                                        <CsLineIcons icon="edit" />
                                                                    </Button>
                                                                    {/* View history */}
                                                                    <Button
                                                                        variant="outline-dark"
                                                                        size="sm"
                                                                        className="btn-icon btn-icon-only"
                                                                        title="View Payroll History"
                                                                        onClick={() => history.push(`/staff/payroll/view/${staff._id}`)}
                                                                    >
                                                                        <CsLineIcons icon="eye" />
                                                                    </Button>
                                                                    {/* Delete */}
                                                                    <Button
                                                                        variant="outline-danger"
                                                                        size="sm"
                                                                        className="btn-icon btn-icon-only"
                                                                        title="Delete"
                                                                        onClick={() => { setDeletingPayroll(payroll); setShowDeleteModal(true); }}
                                                                    >
                                                                        <CsLineIcons icon="bin" />
                                                                    </Button>
                                                                </div>
                                                            </td>
                                                        </>
                                                    ) : (
                                                        // No payroll generated yet
                                                        <>
                                                            <td colSpan={9} className="text-center text-muted">
                                                                <small>Payroll not generated for this month</small>
                                                            </td>
                                                            <td className="text-center">
                                                                <Button
                                                                    variant="outline-primary"
                                                                    size="sm"
                                                                    className='btn-icon'
                                                                    onClick={() =>
                                                                        history.push(`/staff/payroll/generate?staff_id=${staff._id}&month=${month}&year=${year}`)
                                                                    }
                                                                >
                                                                    <CsLineIcons icon="plus" className="me-1" />Generate
                                                                </Button>
                                                            </td>
                                                        </>
                                                    )}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </Table>
                                </div>
                            )}
                        </Card.Body>

                        {!loading && summary.length > 0 && (
                            <Card.Footer className="bg-transparent">
                                <div className="d-flex flex-wrap gap-3 align-items-center">
                                    <div className="d-flex align-items-center">
                                        <Badge bg="success" className="me-2 px-2 py-1"><CsLineIcons icon="check" size={12} /></Badge>
                                        <small>Paid: {totals.count_paid || 0}</small>
                                    </div>
                                    <div className="d-flex align-items-center">
                                        <Badge bg="warning" className="me-2 px-2 py-1"><CsLineIcons icon="clock" size={12} /></Badge>
                                        <small>Unpaid: {totals.count_unpaid || 0}</small>
                                    </div>
                                    <div className="d-flex align-items-center">
                                        <Badge bg="danger" className="me-2 px-2 py-1"><CsLineIcons icon="info-hexagon" size={12} /></Badge>
                                        <small>Not Generated: {totals.count_not_generated || 0}</small>
                                    </div>
                                    <div className="ms-auto">
                                        <strong>Total Payroll: ₹{(totals.total_net_salary || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
                                    </div>
                                </div>
                            </Card.Footer>
                        )}
                    </Card>
                </Col>
            </Row>

            {/* ── Edit Modal ── */}
            <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>
                        <CsLineIcons icon="edit" className="me-2" />
                        Edit Payroll — {editingPayroll?.staff?.f_name} {editingPayroll?.staff?.l_name}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {editingPayroll && (
                        <>
                            {/* Summary */}
                            <div className="bg-light rounded p-3 mb-4">
                                <Row>
                                    <Col xs={4} className="text-center">
                                        <div className="text-muted small">Base Salary</div>
                                        <div className="fw-bold">₹{(editingPayroll.staff?.salary || editingPayroll.base_salary || 0).toLocaleString('en-IN')}</div>
                                    </Col>
                                    <Col xs={4} className="text-center">
                                        <div className="text-muted small">Present Days</div>
                                        <div className="fw-bold text-success">{editingPayroll.present_days}</div>
                                    </Col>
                                    <Col xs={4} className="text-center">
                                        <div className="text-muted small">OT Rate/hr</div>
                                        <div className="fw-bold">₹{editingPayroll.overtime_rate}</div>
                                    </Col>
                                </Row>
                            </div>

                            <Row className="g-3">
                                <Col xs={12} md={6}>
                                    <Form.Label>Working Days in Month</Form.Label>
                                    <Form.Control
                                        type="number" min={1} max={31}
                                        value={editForm.working_days_in_month}
                                        onChange={(e) => setEditForm({ ...editForm, working_days_in_month: e.target.value })}
                                    />
                                </Col>
                                <Col xs={12} md={6}>
                                    <Form.Label>Overtime Hours</Form.Label>
                                    <Form.Control
                                        type="number" min={0} step={0.5}
                                        value={editForm.overtime_hours}
                                        onChange={(e) => setEditForm({ ...editForm, overtime_hours: e.target.value })}
                                    />
                                </Col>
                                <Col xs={12} md={6}>
                                    <Form.Label>Bonus (₹)</Form.Label>
                                    <Form.Control
                                        type="number" min={0}
                                        value={editForm.bonus}
                                        onChange={(e) => setEditForm({ ...editForm, bonus: e.target.value })}
                                    />
                                </Col>
                                <Col xs={12} md={6}>
                                    <Form.Label>Deductions (₹)</Form.Label>
                                    <Form.Control
                                        type="number" min={0}
                                        value={editForm.deductions}
                                        onChange={(e) => setEditForm({ ...editForm, deductions: e.target.value })}
                                    />
                                </Col>
                                <Col xs={12}>
                                    <Form.Label>Deduction Reason</Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="e.g. Late fine, advance recovery..."
                                        value={editForm.deduction_reason}
                                        onChange={(e) => setEditForm({ ...editForm, deduction_reason: e.target.value })}
                                    />
                                </Col>
                                <Col xs={12}>
                                    <Form.Label>Notes</Form.Label>
                                    <Form.Control
                                        as="textarea" rows={2}
                                        value={editForm.notes}
                                        onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                                    />
                                </Col>
                            </Row>

                            {/* Live net preview */}
                            <div className="mt-4 p-3 rounded" style={{ background: '#f0f4ff', border: '1px solid #c7d7ff' }}>
                                <div className="d-flex justify-content-between align-items-center">
                                    <span className="text-muted">Recalculated Net Salary:</span>
                                    <h4 className="mb-0 text-primary">
                                        ₹{editNetPreview().toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                    </h4>
                                </div>
                            </div>
                        </>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowEditModal(false)} className='btn-icon'>Cancel</Button>
                    <Button variant="primary" onClick={handleSaveEdit} disabled={isSavingEdit} className='btn-icon'>
                        {isSavingEdit
                            ? <><Spinner as="span" animation="border" size="sm" className="me-2" />Saving...</>
                            : <><CsLineIcons icon="save" className="me-2" />Save Changes</>}
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* ── Delete Confirm Modal ── */}
            <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>
                        <CsLineIcons icon="bin" className="me-2" />Delete Payroll Record
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>Are you sure you want to delete this payroll record? This action cannot be undone.</p>
                    {deletingPayroll && (
                        <Alert variant="warning">
                            <strong>Net Salary: ₹{deletingPayroll.net_salary?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
                            <br />
                            <small>Status: {deletingPayroll.status}</small>
                        </Alert>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowDeleteModal(false)} className='btn-icon'>Cancel</Button>
                    <Button variant="danger" onClick={handleDelete} disabled={isDeleting} className='btn-icon'>
                        {isDeleting
                            ? <><Spinner as="span" animation="border" size="sm" className="me-2" />Deleting...</>
                            : <><CsLineIcons icon="bin" className="me-2" />Delete</>}
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
}