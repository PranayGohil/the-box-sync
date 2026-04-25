import React, { useState, useEffect } from 'react';
import { useHistory, useLocation, Link } from 'react-router-dom';
import axios from 'axios';
import {
    Row, Col, Card, Button, Badge, Alert, Modal,
    Form, Spinner, Table,
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

export default function GeneratePayroll() {
    const title = 'Generate Payroll';
    const description = 'Generate monthly payroll for staff';
    const breadcrumbs = [
        { to: '', text: 'Home' },
        { to: 'payroll', text: 'Payroll' },
        { to: 'payroll/generate', text: 'Generate Payroll' },
    ];

    const history = useHistory();
    const location = useLocation();

    // ── Parse URL query params ───────────────────────────────────────────────────
    const queryParams = new URLSearchParams(location.search);
    const urlStaffId = queryParams.get('staff_id') || '';
    const urlMonth = Number(queryParams.get('month')) || currentDate.getMonth() + 1;
    const urlYear = Number(queryParams.get('year')) || currentDate.getFullYear();

    // ── Form State — initialized from URL params ─────────────────────────────────
    const [month, setMonth] = useState(urlMonth);
    const [year, setYear] = useState(urlYear);
    const [workingDays, setWorkingDays] = useState(26);
    const [generateMode, setGenerateMode] = useState(urlStaffId ? 'single' : 'all');
    const [selectedStaffId, setSelectedStaffId] = useState(urlStaffId);

    // ── Preview State ────────────────────────────────────────────────────────────
    const [previews, setPreviews] = useState([]);
    const [adjustments, setAdjustments] = useState({});
    const [isPreviewing, setIsPreviewing] = useState(false);
    const [previewFetched, setPreviewFetched] = useState(false);

    // ── Staff list for single mode ───────────────────────────────────────────────
    const [staffList, setStaffList] = useState([]);
    const [staffLoading, setStaffLoading] = useState(false);

    // ── Generate State ───────────────────────────────────────────────────────────
    const [isGenerating, setIsGenerating] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [generateResult, setGenerateResult] = useState(null);

    const authHeader = () => ({
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    });

    // Separate non-guard version for mount (avoids stale closure on staffList)
    const fetchStaffListOnMount = async () => {
        setStaffLoading(true);
        try {
            const res = await axios.get(`${process.env.REACT_APP_API}/staff/get-all`, authHeader());
            setStaffList(res.data.data || []);
        } catch {
            toast.error('Failed to load staff list.');
        } finally {
            setStaffLoading(false);
        }
    };

    // ── On mount: if staff_id came from URL, load staff list so dropdown renders ──
    useEffect(() => {
        if (urlStaffId) {
            fetchStaffListOnMount();
        }
    }, []);


    // Fetch staff list for single mode dropdown (guarded — skips if already loaded)
    const fetchStaffList = async () => {
        if (staffList.length > 0) return;
        setStaffLoading(true);
        try {
            const res = await axios.get(`${process.env.REACT_APP_API}/staff/get-all`, authHeader());
            setStaffList(res.data.data || []);
        } catch {
            toast.error('Failed to load staff list.');
        } finally {
            setStaffLoading(false);
        }
    };

    const handleModeChange = (mode) => {
        setGenerateMode(mode);
        setPreviewFetched(false);
        setPreviews([]);
        setAdjustments({});
        if (mode === 'single') fetchStaffList();
    };

    // ── Recalculate net salary for a row based on current adjustments ────────────
    const recalculate = (preview, adj) => {
        const safeDays = preview.working_days_in_month > 0 ? preview.working_days_in_month : 1;
        const earned = parseFloat(((preview.base_salary / safeDays) * preview.present_days).toFixed(2));
        const ot_pay = parseFloat(((adj.overtime_hours || 0) * preview.overtime_rate).toFixed(2));
        const net = parseFloat((earned + ot_pay + (adj.bonus || 0) - (adj.deductions || 0)).toFixed(2));
        return { earned, ot_pay, net };
    };

    // ── Update adjustment for one staff ─────────────────────────────────────────
    const updateAdjustment = (staffId, field, value) => {
        setAdjustments((prev) => {
            const current = prev[staffId] || {};
            const updated = { ...current, [field]: parseFloat(value) || value };
            return { ...prev, [staffId]: updated };
        });
    };

    // ── Fetch Preview ────────────────────────────────────────────────────────────
    const handlePreview = async () => {
        if (generateMode === 'single' && !selectedStaffId) {
            toast.warning('Please select a staff member.');
            return;
        }

        setIsPreviewing(true);
        setPreviewFetched(false);
        setPreviews([]);

        try {
            const params = new URLSearchParams({
                month,
                year,
                working_days_in_month: workingDays,
                ...(generateMode === 'single' && selectedStaffId ? { staff_id: selectedStaffId } : {}),
            });

            const res = await axios.get(
                `${process.env.REACT_APP_API}/payroll/preview?${params}`,
                authHeader()
            );

            const data = res.data.data || [];
            setPreviews(data);

            // Initialize adjustments with zeros
            const initAdj = {};
            data.forEach((p) => {
                initAdj[p.staff_id] = {
                    overtime_hours: 0,
                    bonus: 0,
                    deductions: 0,
                    deduction_reason: '',
                    notes: '',
                };
            });
            setAdjustments(initAdj);
            setPreviewFetched(true);
        } catch (err) {
            toast.error('Failed to load payroll preview.');
        } finally {
            setIsPreviewing(false);
        }
    };

    // ── Confirm & Generate ───────────────────────────────────────────────────────
    const handleGenerate = async () => {
        setShowConfirmModal(false);
        setIsGenerating(true);

        try {
            let body;

            if (generateMode === 'single') {
                const adj = adjustments[selectedStaffId] || {};
                body = {
                    month,
                    year,
                    working_days_in_month: workingDays,
                    staff_id: selectedStaffId,
                    overtime_hours: adj.overtime_hours || 0,
                    bonus: adj.bonus || 0,
                    deductions: adj.deductions || 0,
                    deduction_reason: adj.deduction_reason || '',
                    notes: adj.notes || '',
                };
            } else {
                // Build maps for bulk generation
                const overtime_hours_map = {};
                const bonus_map = {};
                const deductions_map = {};
                const deduction_reason_map = {};
                const notes_map = {};

                previews.forEach((p) => {
                    const adj = adjustments[p.staff_id] || {};
                    overtime_hours_map[p.staff_id] = adj.overtime_hours || 0;
                    bonus_map[p.staff_id] = adj.bonus || 0;
                    deductions_map[p.staff_id] = adj.deductions || 0;
                    deduction_reason_map[p.staff_id] = adj.deduction_reason || '';
                    notes_map[p.staff_id] = adj.notes || '';
                });

                body = {
                    month,
                    year,
                    working_days_in_month: workingDays,
                    overtime_hours_map,
                    bonus_map,
                    deductions_map,
                    deduction_reason_map,
                    notes_map,
                };
            }

            const res = await axios.post(
                `${process.env.REACT_APP_API}/payroll/generate`,
                body,
                authHeader()
            );

            setGenerateResult(res.data);
            toast.success(res.data.message);
            setPreviewFetched(false);
            setPreviews([]);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to generate payroll.');
        } finally {
            setIsGenerating(false);
        }
    };

    // ── Year options ─────────────────────────────────────────────────────────────
    const yearOptions = [];
    for (let y = currentDate.getFullYear(); y >= currentDate.getFullYear() - 5; y--) {
        yearOptions.push(y);
    }

    // ── Computed totals for preview ──────────────────────────────────────────────
    const previewTotals = previews.reduce(
        (acc, p) => {
            const adj = adjustments[p.staff_id] || {};
            const { net } = recalculate(p, adj);
            acc.total_net += net;
            acc.total_present += p.present_days;
            acc.total_absent += p.absent_days;
            return acc;
        },
        { total_net: 0, total_present: 0, total_absent: 0 }
    );

    return (
        <>
            <HtmlHead title={title} description={description} />

            <Row>
                <Col>
                    {/* ── Page Header ── */}
                    <div className="page-title-container">
                        <Row className="align-items-center">
                            <Col xs="12" md="7">
                                <h1 className="mb-0 pb-0 display-4">{title}</h1>
                                <BreadcrumbList items={breadcrumbs} />
                            </Col>
                            <Col xs="12" md="5" className="d-flex justify-content-end gap-2">
                                <Button variant="outline-primary" as={Link} to="/staff/payroll" className='btn-icon'>
                                    <CsLineIcons icon="wallet" className="me-2" />
                                    Manage Payroll
                                </Button>
                            </Col>
                        </Row>
                    </div>

                    {/* ── Configuration Card ── */}
                    <Card className="mb-4">
                        <Card.Header>
                            <Card.Title className="mb-0">
                                <CsLineIcons icon="settings" className="me-2" />
                                Payroll Configuration
                            </Card.Title>
                        </Card.Header>
                        <Card.Body>
                            <Row className="g-3 align-items-end">
                                {/* Month */}
                                <Col xs={12} md={3}>
                                    <Form.Label>Month</Form.Label>
                                    <Form.Select value={month} onChange={(e) => { setMonth(Number(e.target.value)); setPreviewFetched(false); }}>
                                        {MONTH_NAMES.slice(1).map((m, i) => (
                                            <option key={i + 1} value={i + 1}>{m}</option>
                                        ))}
                                    </Form.Select>
                                </Col>

                                {/* Year */}
                                <Col xs={12} md={2}>
                                    <Form.Label>Year</Form.Label>
                                    <Form.Select value={year} onChange={(e) => { setYear(Number(e.target.value)); setPreviewFetched(false); }}>
                                        {yearOptions.map((y) => <option key={y} value={y}>{y}</option>)}
                                    </Form.Select>
                                </Col>

                                {/* Working Days */}
                                <Col xs={12} md={2}>
                                    <Form.Label>Working Days in Month</Form.Label>
                                    <Form.Control
                                        type="number"
                                        min={1}
                                        max={31}
                                        value={workingDays}
                                        onChange={(e) => { setWorkingDays(Number(e.target.value) || 26); setPreviewFetched(false); }}
                                    />
                                </Col>

                                {/* Mode */}
                                <Col xs={12} md={2}>
                                    <Form.Label>Generate For</Form.Label>
                                    <Form.Select value={generateMode} onChange={(e) => handleModeChange(e.target.value)}>
                                        <option value="all">All Staff</option>
                                        <option value="single">Single Staff</option>
                                    </Form.Select>
                                </Col>

                                {/* Single staff picker */}
                                {generateMode === 'single' && (
                                    <Col xs={12} md={3}>
                                        <Form.Label>Select Staff</Form.Label>
                                        {staffLoading ? (
                                            <div className="d-flex align-items-center">
                                                <Spinner size="sm" animation="border" className="me-2" />
                                                <span>Loading...</span>
                                            </div>
                                        ) : (
                                            <Form.Select
                                                value={selectedStaffId}
                                                onChange={(e) => { setSelectedStaffId(e.target.value); setPreviewFetched(false); }}
                                            >
                                                <option value="">— Select Staff —</option>
                                                {staffList.map((s) => (
                                                    <option key={s._id} value={s._id}>
                                                        {s.f_name} {s.l_name} ({s.staff_id})
                                                    </option>
                                                ))}
                                            </Form.Select>
                                        )}
                                    </Col>
                                )}

                                {/* Preview Button */}
                                <Col xs={12} md={generateMode === 'single' ? 12 : 3} className="d-flex align-items-end">
                                    <Button
                                        variant="primary"
                                        onClick={handlePreview}
                                        disabled={isPreviewing || (generateMode === 'single' && !selectedStaffId)}
                                        className="w-100 btn-icon"
                                    >
                                        {isPreviewing ? (
                                            <><Spinner as="span" animation="border" size="sm" className="me-2" />Calculating...</>
                                        ) : (
                                            <><CsLineIcons icon="eye" className="me-2" />Preview Payroll</>
                                        )}
                                    </Button>
                                </Col>
                            </Row>
                        </Card.Body>
                    </Card>

                    {/* ── Generate Result ── */}
                    {generateResult && (
                        <Alert
                            variant="success"
                            className="mb-4"
                            dismissible
                            onClose={() => setGenerateResult(null)}
                        >
                            <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
                                <div>
                                    <CsLineIcons icon="check-circle" className="me-2" />
                                    <strong>{generateResult.message}</strong>
                                    {generateResult.data?.errors?.length > 0 && (
                                        <div className="mt-1 text-danger small">
                                            {generateResult.data.errors.length} error(s) — check console for details.
                                        </div>
                                    )}
                                </div>
                                <Button
                                    variant="success"
                                    size="sm"
                                    className='btn-icon'
                                    onClick={() => history.push(`/staff/payroll/${month}/${year}`)}
                                >
                                    <CsLineIcons icon="eye" className="me-2" />
                                    View Payroll
                                </Button>
                            </div>
                        </Alert>
                    )}

                    {/* ── Preview Table ── */}
                    {previewFetched && previews.length === 0 && (
                        <Alert variant="info">
                            <CsLineIcons icon="info-hexagon" className="me-2" />
                            No staff found to generate payroll for.
                        </Alert>
                    )}

                    {previewFetched && previews.length > 0 && (
                        <Card className="mb-4">
                            <Card.Header className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                                <div>
                                    <Card.Title className="mb-0">
                                        <CsLineIcons icon="file-text" className="me-2" />
                                        Payroll Preview — {MONTH_NAMES[month]} {year}
                                    </Card.Title>
                                    <small className="text-muted">
                                        Review and adjust overtime, bonus, deductions before generating
                                    </small>
                                </div>
                                <div className="d-flex gap-2">
                                    <Badge bg="light" text="dark" className="p-2">
                                        <CsLineIcons icon="users" className="me-1" />
                                        {previews.length} staff
                                    </Badge>
                                    <Badge bg="primary" className="p-2">
                                        Total Net: ₹{previewTotals.total_net.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                    </Badge>
                                </div>
                            </Card.Header>

                            <Card.Body className="p-0">
                                <div className="table-responsive">
                                    <Table className="mb-0" hover>
                                        <thead className="table-light">
                                            <tr>
                                                <th>Staff</th>
                                                <th className="text-center">Present</th>
                                                <th className="text-center">Absent</th>
                                                <th className="text-end">Base (Ref)</th>
                                                <th className="text-end">Gross Earned</th>
                                                <th style={{ minWidth: '80px' }}>OT Hrs</th>
                                                <th className="text-end">OT Rate</th>
                                                <th className="text-end">OT Pay</th>
                                                <th style={{ minWidth: '90px' }}>Bonus</th>
                                                <th style={{ minWidth: '100px' }}>Stat + Man Ded.</th>
                                                <th className="text-end fw-bold">Net Salary</th>
                                                <th className="text-center">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {previews.map((p) => {
                                                const adj = adjustments[p.staff_id] || {};
                                                const { earned, ot_pay, net } = recalculate(p, adj);

                                                return (
                                                    <tr key={p.staff_id}>
                                                        {/* Staff */}
                                                        <td>
                                                            <div className="fw-medium">
                                                                {p.f_name} {p.l_name}
                                                            </div>
                                                            <small className="text-muted">{p.position} · {p.staff_ref_id}</small>
                                                        </td>

                                                        {/* Present */}
                                                        <td className="text-center">
                                                            <Badge bg="success">{p.present_days}</Badge>
                                                        </td>

                                                        {/* Absent */}
                                                        <td className="text-center">
                                                            <Badge bg={p.absent_days > 0 ? 'danger' : 'light'} text={p.absent_days > 0 ? undefined : 'dark'}>
                                                                {p.absent_days}
                                                            </Badge>
                                                        </td>

                                                        {/* Base Salary */}
                                                        <td className="text-end">₹{(p.staff?.salary || p.base_salary || 0).toLocaleString('en-IN')}</td>

                                                        {/* Earned */}
                                                        <td className="text-end text-success fw-medium">
                                                            ₹{(p.earned_breakdown?.total_gross || earned || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                        </td>

                                                        {/* OT Hours input */}
                                                        <td>
                                                            <Form.Control
                                                                type="number"
                                                                size="sm"
                                                                min={0}
                                                                step={0.5}
                                                                value={adj.overtime_hours ?? 0}
                                                                onChange={(e) => updateAdjustment(p.staff_id, 'overtime_hours', e.target.value)}
                                                                style={{ width: '90px' }}
                                                            />
                                                        </td>

                                                        {/* OT Rate */}
                                                        <td className="text-end text-muted">
                                                            ₹{p.overtime_rate.toLocaleString('en-IN')}
                                                        </td>

                                                        {/* OT Pay */}
                                                        <td className="text-end text-primary">
                                                            ₹{ot_pay.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                        </td>

                                                        {/* Bonus input */}
                                                        <td>
                                                            <Form.Control
                                                                type="number"
                                                                size="sm"
                                                                min={0}
                                                                value={adj.bonus ?? 0}
                                                                onChange={(e) => updateAdjustment(p.staff_id, 'bonus', e.target.value)}
                                                                style={{ width: '100px' }}
                                                            />
                                                        </td>

                                                        {/* Deductions input (Shows existing stat deductions + manual) */}
                                                        <td>
                                                            <div className="text-danger small mb-1">
                                                                Stat: ₹{(p.deduction_breakdown?.total_statutory || 0).toLocaleString('en-IN')}
                                                            </div>
                                                            <Form.Control
                                                                type="number"
                                                                size="sm"
                                                                min={0}
                                                                placeholder="+ Manual"
                                                                title="Manual Deductions"
                                                                value={adj.deductions ?? 0}
                                                                onChange={(e) => updateAdjustment(p.staff_id, 'deductions', e.target.value)}
                                                                style={{ width: '90px' }}
                                                            />
                                                        </td>

                                                        {/* Net Salary */}
                                                        <td className="text-end fw-bold fs-6">
                                                            <span className={net < 0 ? 'text-danger' : 'text-dark'}>
                                                                ₹{net.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                            </span>
                                                        </td>

                                                        {/* Already exists badge */}
                                                        <td className="text-center">
                                                            {p.already_exists ? (
                                                                <Badge bg={p.existing_status === 'paid' ? 'success' : 'warning'}>
                                                                    {p.existing_status === 'paid' ? 'Paid' : 'Will Update'}
                                                                </Badge>
                                                            ) : (
                                                                <Badge bg="secondary">New</Badge>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                        <tfoot className="table-light fw-bold">
                                            <tr>
                                                <td>Total ({previews.length} staff)</td>
                                                <td className="text-center text-success">{previewTotals.total_present}</td>
                                                <td className="text-center text-danger">{previewTotals.total_absent}</td>
                                                <td colSpan={7} />
                                                <td className="text-end fs-6">
                                                    ₹{previewTotals.total_net.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                </td>
                                                <td />
                                            </tr>
                                        </tfoot>
                                    </Table>
                                </div>
                            </Card.Body>

                            <Card.Footer className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                                <small className="text-muted">
                                    <CsLineIcons icon="info-hexagon" className="me-1" />
                                    OT pay = overtime hours × staff's overtime rate. Adjust values above before confirming.
                                </small>
                                <Button
                                    variant="success"
                                    size="lg"
                                    className='btn-icon'
                                    onClick={() => setShowConfirmModal(true)}
                                    disabled={isGenerating}
                                >
                                    {isGenerating ? (
                                        <><Spinner as="span" animation="border" size="sm" className="me-2" />Generating...</>
                                    ) : (
                                        <><CsLineIcons icon="check" className="me-2" />Generate Payroll</>
                                    )}
                                </Button>
                            </Card.Footer>
                        </Card>
                    )}
                </Col>
            </Row>

            {/* ── Confirm Modal ── */}
            <Modal show={showConfirmModal} onHide={() => setShowConfirmModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>
                        <CsLineIcons icon="check-circle" className="me-2" />
                        Confirm Payroll Generation
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>
                        You are about to generate payroll for{' '}
                        <strong>{MONTH_NAMES[month]} {year}</strong> for{' '}
                        <strong>{previews.length} staff member{previews.length !== 1 ? 's' : ''}</strong>.
                    </p>
                    <div className="bg-light rounded p-3">
                        <div className="d-flex justify-content-between mb-1">
                            <span className="text-muted">Total Net Salary:</span>
                            <strong>₹{previewTotals.total_net.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
                        </div>
                        <div className="d-flex justify-content-between mb-1">
                            <span className="text-muted">Working Days:</span>
                            <strong>{workingDays}</strong>
                        </div>
                    </div>
                    {previews.some((p) => p.already_exists && p.existing_status === 'paid') && (
                        <Alert variant="warning" className="mt-3 mb-0">
                            <CsLineIcons icon="alert" className="me-2" />
                            Some staff already have a <strong>paid</strong> payroll this month. Their payment status will be preserved.
                        </Alert>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowConfirmModal(false)} className='btn-icon'>Cancel</Button>
                    <Button variant="success" onClick={handleGenerate} className='btn-icon'>
                        <CsLineIcons icon="check" className="me-2" />
                        Confirm & Generate
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
}