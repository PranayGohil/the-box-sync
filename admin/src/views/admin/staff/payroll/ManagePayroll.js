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

    const [month, setMonth] = useState(Number(paramMonth) || currentDate.getMonth() + 1);
    const [year, setYear] = useState(Number(paramYear) || currentDate.getFullYear());

    const [summary, setSummary] = useState([]);
    const [totals, setTotals] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [selectedIds, setSelectedIds] = useState(new Set());

    const [showEditModal, setShowEditModal] = useState(false);
    const [editingPayroll, setEditingPayroll] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [isSavingEdit, setIsSavingEdit] = useState(false);

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletingPayroll, setDeletingPayroll] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const [isMarkingPaid, setIsMarkingPaid] = useState(false);

    const authHeader = () => ({
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    });

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

    const editNetPreview = () => {
        if (!editingPayroll) return 0;
        const safeDays = (Number(editForm.working_days_in_month) || 1);
        const base = editingPayroll.staff?.salary || editingPayroll.base_salary || 0;
        const earned = editingPayroll.earned_breakdown?.total_gross || ((base / safeDays) * editingPayroll.present_days);
        const ot_pay = (parseFloat(editForm.overtime_hours) || 0) * (editingPayroll.overtime_rate || 0);
        const net = earned + ot_pay + (parseFloat(editForm.bonus) || 0) - (parseFloat(editForm.deductions) || 0);
        return parseFloat(net.toFixed(2));
    };

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

    const yearOptions = [];
    for (let y = currentDate.getFullYear(); y >= currentDate.getFullYear() - 5; y--) yearOptions.push(y);

    const payrollRows = summary.filter((s) => s.payroll);
    const allSelected = payrollRows.length > 0 && selectedIds.size === payrollRows.length;

    return (
        <div className="container-fluid pb-5">
            
            <HtmlHead title={title} description={description} />

            <div className="page-title-container mb-5">
                <Row className="g-3 align-items-center">
                    <Col md={7}>
                        <h1 className="mb-0 pb-0 display-4 fw-bold" style={{ color: '#1ea8e7' }}>{title}</h1>
                        <BreadcrumbList items={breadcrumbs} />
                    </Col>
                    <Col md={5} className="d-flex justify-content-md-end gap-2">
                        <Button className="manage-payroll-custom-btn-outline px-4" as={Link} to="/staff/payroll/generate">
                            <CsLineIcons icon="plus" className="me-2" />
                            Generate New
                        </Button>
                        <Button className="manage-payroll-custom-btn-outline px-4" as={Link} to="/staff/payroll/settings">
                            <CsLineIcons icon="gear" className="me-2" />
                            Settings
                        </Button>
                    </Col>
                </Row>
            </div>

            <Card className="manage-payroll-glass-card border-0 mb-4">
                <Card.Body className="p-4">
                    <Row className="g-3 align-items-end">
                        <Col xs={12} md={4}>
                            <Form.Label className="small fw-bold text-muted text-uppercase">Financial Month</Form.Label>
                            <Form.Select className="rounded-3 border-0 shadow-sm py-2" value={month} onChange={(e) => setMonth(Number(e.target.value))}>
                                {MONTH_NAMES.slice(1).map((m, i) => (
                                    <option key={i + 1} value={i + 1}>{m}</option>
                                ))}
                            </Form.Select>
                        </Col>
                        <Col xs={12} md={3}>
                            <Form.Label className="small fw-bold text-muted text-uppercase">Financial Year</Form.Label>
                            <Form.Select className="rounded-3 border-0 shadow-sm py-2" value={year} onChange={(e) => setYear(Number(e.target.value))}>
                                {yearOptions.map((y) => <option key={y} value={y}>{y}</option>)}
                            </Form.Select>
                        </Col>
                        <Col xs={12} md={5} className="d-flex justify-content-md-end">
                            <Button className="manage-payroll-custom-btn-outline sh-5 d-flex align-items-center gap-2" onClick={fetchSummary} disabled={loading}>
                                <CsLineIcons icon="refresh" size="18" /> Refresh Data
                            </Button>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {!loading && (
                <Row className="g-4 mb-5">
                    {[
                        { label: 'Total Net Payroll', value: `₹${(totals.total_net_salary || 0).toLocaleString('en-IN', { minimumFractionDigits: 0 })}`, icon: 'dollar', color: 'primary' },
                        { label: 'Total Paid', value: `₹${(totals.total_paid || 0).toLocaleString('en-IN', { minimumFractionDigits: 0 })}`, icon: 'check-circle', color: 'success' },
                        { label: 'Pending Payment', value: `₹${(totals.total_unpaid || 0).toLocaleString('en-IN', { minimumFractionDigits: 0 })}`, icon: 'clock', color: 'warning' },
                        { label: 'Pending Generation', value: totals.count_not_generated || 0, icon: 'info-hexagon', color: 'danger' },
                    ].map((s) => (
                        <Col xs={6} md={3} key={s.label}>
                            <Card className="manage-payroll-glass-card border-0 h-100 manage-payroll-stat-card">
                                <Card.Body className="p-4">
                                    <div className="d-flex align-items-center gap-3 mb-3">
                                        <div className={`sw-5 sh-5 rounded-circle bg-soft-${s.color} d-flex align-items-center justify-content-center text-${s.color}`}>
                                            <CsLineIcons icon={s.icon} size="20" />
                                        </div>
                                        <div className="text-muted small fw-bold text-uppercase letter-spacing-1">{s.label}</div>
                                    </div>
                                    <h3 className={`mb-0 fw-bold text-${s.color}`}>{s.value}</h3>
                                </Card.Body>
                            </Card>
                        </Col>
                    ))}
                </Row>
            )}

            {error && (
                <Alert variant="danger" className="manage-payroll-glass-card border-0 mb-4 p-4 d-flex align-items-center gap-3">
                    <CsLineIcons icon="error" size="24" className="text-danger" />
                    <span className="fw-bold">{error}</span>
                </Alert>
            )}

            {selectedIds.size > 0 && (
                <div className="manage-payroll-bulk-bar d-flex align-items-center justify-content-between shadow-lg">
                    <div className="d-flex align-items-center gap-3">
                        <div className="sw-5 sh-5 rounded-circle bg-white text-primary d-flex align-items-center justify-content-center fw-bold">
                            {selectedIds.size}
                        </div>
                        <div>
                            <div className="fw-bold">Staff Selected</div>
                            <small className="opacity-75">Apply bulk payment updates</small>
                        </div>
                    </div>
                    <div className="d-flex gap-2">
                        <Button variant="light" className="rounded-pill px-4 fw-bold text-success d-flex align-items-center gap-2" onClick={() => handleMarkPaid(selectedIds)} disabled={isMarkingPaid}>
                            {isMarkingPaid ? <Spinner size="sm" /> : <><CsLineIcons icon="check" size="18" /> Mark Paid</>}
                        </Button>
                        <Button variant="light" className="rounded-pill px-4 fw-bold text-warning d-flex align-items-center gap-2" onClick={() => handleMarkUnpaid(selectedIds)} disabled={isMarkingPaid}>
                            <CsLineIcons icon="rotate-left" size="18" /> Mark Unpaid
                        </Button>
                        <Button variant="transparent" className="text-white fw-bold opacity-75" onClick={() => setSelectedIds(new Set())}>
                            Cancel
                        </Button>
                    </div>
                </div>
            )}

            <Card className="manage-payroll-glass-card border-0 overflow-hidden shadow-sm">
                <Card.Header className="bg-light border-0 p-4">
                    <div className="d-flex justify-content-between align-items-center">
                        <h5 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
                            <CsLineIcons icon="layout" size="20" className="text-primary" />
                            {MONTH_NAMES[month]} {year} Payroll Summary
                        </h5>
                    </div>
                </Card.Header>

                <Card.Body className="p-0">
                    {loading ? (
                        <div className="text-center py-5">
                            <Spinner animation="border" style={{ color: '#1ea8e7' }} className="mb-3" />
                            <h5 className="text-muted">Synchronizing data...</h5>
                        </div>
                    ) : summary.length === 0 ? (
                        <div className="text-center py-5">
                            <div className="py-5">
                                <CsLineIcons icon="inbox" size="64" className="text-muted mb-4 opacity-25" />
                                <h4 className="text-muted fw-bold">No Staff Found</h4>
                                <p className="text-muted mb-4">Please add staff members to start managing payroll.</p>
                                <Button className="manage-payroll-custom-btn-solid" as={Link} to="/staff/add">Add First Staff Member</Button>
                            </div>
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <Table hover className="manage-payroll-react-table-modern mb-0">
                                <thead>
                                    <tr>
                                        <th style={{ width: '60px' }}>
                                            <Form.Check
                                                className="custom-check"
                                                type="checkbox"
                                                checked={allSelected}
                                                onChange={toggleSelectAll}
                                                disabled={payrollRows.length === 0}
                                            />
                                        </th>
                                        <th>Employee Information</th>
                                        <th className="text-center">Days (P/A)</th>
                                        <th className="text-end">Base Salary</th>
                                        <th className="text-end">Gross Earned</th>
                                        <th className="text-end">Adjustments</th>
                                        <th className="text-end fw-bold text-primary">Net Payable</th>
                                        <th className="text-center">Status</th>
                                        <th className="text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {summary.map(({ staff, payroll }) => (
                                        <tr key={staff._id} className={selectedIds.has(payroll?._id) ? 'bg-soft-primary' : ''}>
                                            <td>
                                                {payroll ? (
                                                    <Form.Check
                                                        className="custom-check"
                                                        type="checkbox"
                                                        checked={selectedIds.has(payroll._id)}
                                                        onChange={() => toggleSelect(payroll._id)}
                                                    />
                                                ) : (
                                                    <div className="text-center text-muted">—</div>
                                                )}
                                            </td>
                                            <td>
                                                <div className="d-flex align-items-center gap-3">
                                                    <div className="sw-5 sh-5 rounded-circle bg-soft-primary d-flex align-items-center justify-content-center text-primary fw-bold">
                                                        {staff.f_name?.[0]}{staff.l_name?.[0]}
                                                    </div>
                                                    <div>
                                                        <div className="fw-bold text-dark">{staff.f_name} {staff.l_name}</div>
                                                        <small className="text-muted fw-medium">{staff.position} • #{staff.staff_id}</small>
                                                    </div>
                                                </div>
                                            </td>

                                            {payroll ? (
                                                <>
                                                    <td className="text-center">
                                                        <div className="d-flex align-items-center justify-content-center gap-2">
                                                            <Badge bg="soft-success" className="text-success px-2 py-1 rounded-pill">{payroll.present_days}P</Badge>
                                                            <Badge bg={payroll.absent_days > 0 ? 'soft-danger' : 'soft-light'} className={`${payroll.absent_days > 0 ? 'text-danger' : 'text-muted'} px-2 py-1 rounded-pill`}>{payroll.absent_days}A</Badge>
                                                        </div>
                                                    </td>
                                                    <td className="text-end fw-medium text-dark">₹{(staff.salary || payroll.base_salary || 0).toLocaleString('en-IN')}</td>
                                                    <td className="text-end text-success fw-bold">₹{(payroll.earned_breakdown?.total_gross || payroll.earned_salary || 0).toLocaleString('en-IN', { minimumFractionDigits: 0 })}</td>
                                                    <td className="text-end">
                                                        <div className="small fw-bold text-primary">OT: +₹{(payroll.overtime_pay || 0).toLocaleString('en-IN')}</div>
                                                        <div className="small fw-bold text-danger">Ded: -₹{((payroll.deduction_breakdown?.total_statutory || 0) + (payroll.deductions || 0)).toLocaleString('en-IN')}</div>
                                                    </td>
                                                    <td className="text-end fw-bold text-primary h5 mb-0">₹{payroll.net_salary.toLocaleString('en-IN', { minimumFractionDigits: 0 })}</td>
                                                    <td className="text-center">
                                                        <Badge bg={payroll.status === 'paid' ? 'success' : 'warning'} className="manage-payroll-status-badge">
                                                            <CsLineIcons icon={payroll.status === 'paid' ? 'check' : 'clock'} size="12" className="me-1" />
                                                            {payroll.status}
                                                        </Badge>
                                                    </td>
                                                    <td className="text-center">
                                                        <div className="d-flex justify-content-center gap-2">
                                                            {payroll.status === 'unpaid' ? (
                                                                <Button className="manage-payroll-custom-btn-outline p-0 sw-5 sh-5 d-flex align-items-center justify-content-center" onClick={() => handleMarkPaid(new Set([payroll._id]))} disabled={isMarkingPaid}>
                                                                    <CsLineIcons icon="check" size="16" />
                                                                </Button>
                                                            ) : (
                                                                <Button className="manage-payroll-custom-btn-outline p-0 sw-5 sh-5 d-flex align-items-center justify-content-center border-warning text-warning" onClick={() => handleMarkUnpaid(new Set([payroll._id]))} disabled={isMarkingPaid}>
                                                                    <CsLineIcons icon="close" size="16" />
                                                                </Button>
                                                            )}
                                                            <Button className="manage-payroll-custom-btn-outline p-0 sw-5 sh-5 d-flex align-items-center justify-content-center" onClick={() => openEditModal(payroll, staff)}>
                                                                <CsLineIcons icon="edit" size="16" />
                                                            </Button>
                                                            <Button className="manage-payroll-custom-btn-outline p-0 sw-5 sh-5 d-flex align-items-center justify-content-center border-dark text-dark" onClick={() => history.push(`/staff/payroll/view/${staff._id}`)}>
                                                                <CsLineIcons icon="eye" size="16" />
                                                            </Button>
                                                            <Button className="manage-payroll-custom-btn-outline p-0 sw-5 sh-5 d-flex align-items-center justify-content-center border-danger text-danger" onClick={() => { setDeletingPayroll(payroll); setShowDeleteModal(true); }}>
                                                                <CsLineIcons icon="bin" size="16" />
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </>
                                            ) : (
                                                <>
                                                    <td colSpan={6} className="text-center py-4 bg-light bg-opacity-10">
                                                        <div className="text-muted fw-bold small text-uppercase letter-spacing-1">Payroll Not Generated</div>
                                                    </td>
                                                    <td className="text-center bg-light bg-opacity-10">
                                                        <Button className="manage-payroll-custom-btn-solid sh-5 px-3" onClick={() => history.push(`/staff/payroll/generate?staff_id=${staff._id}&month=${month}&year=${year}`)}>
                                                            <CsLineIcons icon="plus" size="16" className="me-1" /> Generate
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
                    <Card.Footer className="bg-light border-0 p-4">
                        <div className="d-flex flex-wrap gap-4 align-items-center justify-content-between">
                            <div className="d-flex gap-4">
                                <div className="d-flex align-items-center gap-2">
                                    <div className="sw-2 sh-2 rounded-circle bg-success" />
                                    <span className="small fw-bold text-muted text-uppercase">Paid: {totals.count_paid || 0}</span>
                                </div>
                                <div className="d-flex align-items-center gap-2">
                                    <div className="sw-2 sh-2 rounded-circle bg-warning" />
                                    <span className="small fw-bold text-muted text-uppercase">Pending: {totals.count_unpaid || 0}</span>
                                </div>
                                <div className="d-flex align-items-center gap-2">
                                    <div className="sw-2 sh-2 rounded-circle bg-danger" />
                                    <span className="small fw-bold text-muted text-uppercase">Missing: {totals.count_not_generated || 0}</span>
                                </div>
                            </div>
                            <div className="h4 mb-0 fw-bold text-dark">
                                Total Disbursement: <span className="text-primary">₹{(totals.total_net_salary || 0).toLocaleString('en-IN', { minimumFractionDigits: 0 })}</span>
                            </div>
                        </div>
                    </Card.Footer>
                )}
            </Card>

            <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered size="lg" className="rounded-4">
                <Modal.Header closeButton className="border-0 p-4 pb-0">
                    <Modal.Title className="fw-bold d-flex align-items-center gap-2">
                        <CsLineIcons icon="edit" size="24" className="text-primary" />
                        Adjust Payroll: {editingPayroll?.staff?.f_name}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="p-4">
                    {editingPayroll && (
                        <>
                            <div className="manage-payroll-glass-card bg-light border-0 p-4 mb-4">
                                <Row className="text-center g-3">
                                    <Col xs={4}>
                                        <div className="text-muted small fw-bold text-uppercase mb-1">Contract Base</div>
                                        <div className="fw-bold h5 mb-0 text-dark">₹{(editingPayroll.staff?.salary || editingPayroll.base_salary || 0).toLocaleString('en-IN')}</div>
                                    </Col>
                                    <Col xs={4}>
                                        <div className="text-muted small fw-bold text-uppercase mb-1">Attendance</div>
                                        <div className="fw-bold h5 mb-0 text-success">{editingPayroll.present_days} Days</div>
                                    </Col>
                                    <Col xs={4}>
                                        <div className="text-muted small fw-bold text-uppercase mb-1">OT Multiplier</div>
                                        <div className="fw-bold h5 mb-0 text-primary">₹{editingPayroll.overtime_rate}/hr</div>
                                    </Col>
                                </Row>
                            </div>

                            <Row className="g-4">
                                <Col xs={12} md={6}>
                                    <Form.Label className="small fw-bold text-muted text-uppercase">Working Days</Form.Label>
                                    <Form.Control className="rounded-3 border-0 shadow-sm py-2 px-3" type="number" value={editForm.working_days_in_month} onChange={(e) => setEditForm({ ...editForm, working_days_in_month: e.target.value })} />
                                </Col>
                                <Col xs={12} md={6}>
                                    <Form.Label className="small fw-bold text-muted text-uppercase">Overtime Hours</Form.Label>
                                    <Form.Control className="rounded-3 border-0 shadow-sm py-2 px-3" type="number" value={editForm.overtime_hours} onChange={(e) => setEditForm({ ...editForm, overtime_hours: e.target.value })} />
                                </Col>
                                <Col xs={12} md={6}>
                                    <Form.Label className="small fw-bold text-muted text-uppercase">Bonus Amount (₹)</Form.Label>
                                    <Form.Control className="rounded-3 border-0 shadow-sm py-2 px-3 text-success fw-bold" type="number" value={editForm.bonus} onChange={(e) => setEditForm({ ...editForm, bonus: e.target.value })} />
                                </Col>
                                <Col xs={12} md={6}>
                                    <Form.Label className="small fw-bold text-muted text-uppercase">Extra Deductions (₹)</Form.Label>
                                    <Form.Control className="rounded-3 border-0 shadow-sm py-2 px-3 text-danger fw-bold" type="number" value={editForm.deductions} onChange={(e) => setEditForm({ ...editForm, deductions: e.target.value })} />
                                </Col>
                                <Col xs={12}>
                                    <Form.Label className="small fw-bold text-muted text-uppercase">Adjustment Reason</Form.Label>
                                    <Form.Control className="rounded-3 border-0 shadow-sm py-2 px-3" type="text" placeholder="e.g. Performance bonus or late fine" value={editForm.deduction_reason} onChange={(e) => setEditForm({ ...editForm, deduction_reason: e.target.value })} />
                                </Col>
                                <Col xs={12}>
                                    <Form.Label className="small fw-bold text-muted text-uppercase">Internal Notes</Form.Label>
                                    <Form.Control className="rounded-3 border-0 shadow-sm py-2 px-3" as="textarea" rows={2} value={editForm.notes} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} />
                                </Col>
                            </Row>

                            <div className="mt-4 p-4 rounded-4 bg-primary text-white shadow-lg">
                                <div className="d-flex justify-content-between align-items-center">
                                    <div>
                                        <div className="small fw-bold text-uppercase opacity-75">Updated Net Payable</div>
                                        <h2 className="mb-0 fw-bold">₹{editNetPreview().toLocaleString('en-IN', { minimumFractionDigits: 0 })}</h2>
                                    </div>
                                    <CsLineIcons icon="dollar" size="48" className="opacity-25" />
                                </div>
                            </div>
                        </>
                    )}
                </Modal.Body>
                <Modal.Footer className="border-0 p-4 pt-0 d-flex gap-3">
                    <Button className="manage-payroll-custom-btn-outline flex-grow-1 py-3" onClick={() => setShowEditModal(false)}>Discard Changes</Button>
                    <Button className="manage-payroll-custom-btn-solid flex-grow-1 py-3" onClick={handleSaveEdit} disabled={isSavingEdit}>
                        {isSavingEdit ? <Spinner size="sm" /> : <><CsLineIcons icon="save" className="me-2" /> Commit Updates</>}
                    </Button>
                </Modal.Footer>
            </Modal>

            <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered className="rounded-4">
                <Modal.Header closeButton className="border-0">
                    <Modal.Title className="fw-bold">Remove Record</Modal.Title>
                </Modal.Header>
                <Modal.Body className="py-4 text-center">
                    <div className="bg-soft-danger d-inline-flex p-4 rounded-circle mb-4">
                        <CsLineIcons icon="bin" size="48" className="text-danger" />
                    </div>
                    <h5 className="fw-bold mb-2">Delete Payroll Entry?</h5>
                    <p className="text-muted">This will permanently remove the payroll record for this staff member. This action cannot be reversed.</p>
                    
                    {deletingPayroll && (
                        <div className="manage-payroll-glass-card bg-light border-0 p-3 mt-3">
                            <div className="fw-bold text-danger">₹{deletingPayroll.net_salary?.toLocaleString('en-IN')}</div>
                            <small className="text-muted">Status: {deletingPayroll.status.toUpperCase()}</small>
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer className="border-0 d-flex gap-3">
                    <Button className="manage-payroll-custom-btn-outline flex-grow-1" onClick={() => setShowDeleteModal(false)}>Keep Record</Button>
                    <Button className="manage-payroll-custom-btn-solid bg-danger border-danger flex-grow-1" onClick={handleDelete} disabled={isDeleting}>
                        {isDeleting ? <Spinner size="sm" /> : 'Confirm Delete'}
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
}