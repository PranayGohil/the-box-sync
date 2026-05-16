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

    const queryParams = new URLSearchParams(location.search);
    const urlStaffId = queryParams.get('staff_id') || '';
    const urlMonth = Number(queryParams.get('month')) || currentDate.getMonth() + 1;
    const urlYear = Number(queryParams.get('year')) || currentDate.getFullYear();

    const [month, setMonth] = useState(urlMonth);
    const [year, setYear] = useState(urlYear);
    const [workingDays, setWorkingDays] = useState(26);
    const [generateMode, setGenerateMode] = useState(urlStaffId ? 'single' : 'all');
    const [selectedStaffId, setSelectedStaffId] = useState(urlStaffId);

    const [previews, setPreviews] = useState([]);
    const [adjustments, setAdjustments] = useState({});
    const [isPreviewing, setIsPreviewing] = useState(false);
    const [previewFetched, setPreviewFetched] = useState(false);

    const [staffList, setStaffList] = useState([]);
    const [staffLoading, setStaffLoading] = useState(false);

    const [isGenerating, setIsGenerating] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [generateResult, setGenerateResult] = useState(null);

    const authHeader = () => ({
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    });

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

    useEffect(() => {
        if (urlStaffId) {
            fetchStaffListOnMount();
        }
    }, []);


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

    const recalculate = (preview, adj) => {
        const safeDays = preview.working_days_in_month > 0 ? preview.working_days_in_month : 1;
        const earned = parseFloat(((preview.base_salary / safeDays) * preview.present_days).toFixed(2));
        const ot_pay = parseFloat(((adj.overtime_hours || 0) * preview.overtime_rate).toFixed(2));
        const net = parseFloat((earned + ot_pay + (adj.bonus || 0) - (adj.deductions || 0)).toFixed(2));
        return { earned, ot_pay, net };
    };

    const updateAdjustment = (staffId, field, value) => {
        setAdjustments((prev) => {
            const current = prev[staffId] || {};
            const updated = { ...current, [field]: parseFloat(value) || value };
            return { ...prev, [staffId]: updated };
        });
    };

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

    const yearOptions = [];
    for (let y = currentDate.getFullYear(); y >= currentDate.getFullYear() - 5; y--) {
        yearOptions.push(y);
    }

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
        <div className="container-fluid pb-5">
            
            <HtmlHead title={title} description={description} />

            <div className="page-title-container mb-5">
                <Row className="g-3 align-items-center">
                    <Col md={7}>
                        <h1 className="mb-0 pb-0 display-4 fw-bold" style={{ color: '#1ea8e7' }}>{title}</h1>
                        <BreadcrumbList items={breadcrumbs} />
                    </Col>
                    <Col md={5} className="d-flex justify-content-md-end gap-2">
                        <Button className="generate-payroll-custom-btn-outline px-4" as={Link} to="/staff/payroll">
                            <CsLineIcons icon="wallet" className="me-2" />
                            Manage Payroll
                        </Button>
                    </Col>
                </Row>
            </div>

            <Card className="generate-payroll-glass-card border-0 mb-5">
                <Card.Header className="bg-transparent border-0 p-4 pb-0">
                    <Card.Title className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
                        <CsLineIcons icon="settings" size="20" className="text-primary" />
                        Payroll Configuration
                    </Card.Title>
                </Card.Header>
                <Card.Body className="p-4">
                    <Row className="g-4 align-items-end">
                        <Col xs={12} md={3}>
                            <Form.Label className="small fw-bold text-muted text-uppercase">Month</Form.Label>
                            <Form.Select className="rounded-3 border-0 shadow-sm py-2" value={month} onChange={(e) => { setMonth(Number(e.target.value)); setPreviewFetched(false); }}>
                                {MONTH_NAMES.slice(1).map((m, i) => (
                                    <option key={i + 1} value={i + 1}>{m}</option>
                                ))}
                            </Form.Select>
                        </Col>
                        <Col xs={12} md={2}>
                            <Form.Label className="small fw-bold text-muted text-uppercase">Year</Form.Label>
                            <Form.Select className="rounded-3 border-0 shadow-sm py-2" value={year} onChange={(e) => { setYear(Number(e.target.value)); setPreviewFetched(false); }}>
                                {yearOptions.map((y) => <option key={y} value={y}>{y}</option>)}
                            </Form.Select>
                        </Col>
                        <Col xs={12} md={2}>
                            <Form.Label className="small fw-bold text-muted text-uppercase">Working Days</Form.Label>
                            <Form.Control
                                className="rounded-3 border-0 shadow-sm py-2"
                                type="number" min={1} max={31}
                                value={workingDays}
                                onChange={(e) => { setWorkingDays(Number(e.target.value) || 26); setPreviewFetched(false); }}
                            />
                        </Col>
                        <Col xs={12} md={2}>
                            <Form.Label className="small fw-bold text-muted text-uppercase">Batch Mode</Form.Label>
                            <Form.Select className="rounded-3 border-0 shadow-sm py-2" value={generateMode} onChange={(e) => handleModeChange(e.target.value)}>
                                <option value="all">All Staff</option>
                                <option value="single">Single Staff</option>
                            </Form.Select>
                        </Col>
                        {generateMode === 'single' && (
                            <Col xs={12} md={3}>
                                <Form.Label className="small fw-bold text-muted text-uppercase">Employee</Form.Label>
                                {staffLoading ? (
                                    <div className="sh-5 d-flex align-items-center"><Spinner size="sm" animation="border" /></div>
                                ) : (
                                    <Form.Select className="rounded-3 border-0 shadow-sm py-2" value={selectedStaffId} onChange={(e) => { setSelectedStaffId(e.target.value); setPreviewFetched(false); }}>
                                        <option value="">— Select Staff —</option>
                                        {staffList.map((s) => <option key={s._id} value={s._id}>{s.f_name} {s.l_name} ({s.staff_id})</option>)}
                                    </Form.Select>
                                )}
                            </Col>
                        )}
                        <Col xs={12} md={generateMode === 'single' ? 12 : 3}>
                            <Button className="generate-payroll-custom-btn-solid w-100 py-2 d-flex align-items-center justify-content-center gap-2" onClick={handlePreview} disabled={isPreviewing || (generateMode === 'single' && !selectedStaffId)}>
                                {isPreviewing ? <Spinner size="sm" /> : <><CsLineIcons icon="eye" size="18" /> Fetch Preview</>}
                            </Button>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {generateResult && (
                <Alert variant="success" className="generate-payroll-glass-card border-0 mb-4 p-4 d-flex align-items-center justify-content-between flex-wrap gap-3 shadow-lg" onClose={() => setGenerateResult(null)} dismissible>
                    <div className="d-flex align-items-center gap-3">
                        <div className="sw-5 sh-5 rounded-circle bg-soft-success d-flex align-items-center justify-content-center text-success">
                            <CsLineIcons icon="check-circle" size="24" />
                        </div>
                        <div>
                            <div className="fw-bold h5 mb-0 text-success">{generateResult.message}</div>
                            {generateResult.data?.errors?.length > 0 && <small className="text-danger">Encountered {generateResult.data.errors.length} skipped records.</small>}
                        </div>
                    </div>
                    <Button className="generate-payroll-custom-btn-solid px-4" onClick={() => history.push(`/staff/payroll/${month}/${year}`)}>View Payroll Ledger</Button>
                </Alert>
            )}

            {previewFetched && previews.length === 0 && (
                <div className="text-center py-5 generate-payroll-glass-card bg-light border-0">
                    <CsLineIcons icon="info-hexagon" size="64" className="text-muted opacity-25 mb-4" />
                    <h4 className="fw-bold text-muted">No Eligible Staff Found</h4>
                    <p className="text-muted mb-0">Either no staff exists or all have payroll already generated for this period.</p>
                </div>
            )}

            {previewFetched && previews.length > 0 && (
                <Card className="generate-payroll-glass-card border-0 overflow-hidden shadow-sm">
                    <Card.Header className="bg-light border-0 p-4">
                        <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                            <div>
                                <h5 className="fw-bold text-dark mb-1 d-flex align-items-center gap-2">
                                    <CsLineIcons icon="file-text" size="20" className="text-primary" />
                                    Payroll Ledger Preview: {MONTH_NAMES[month]} {year}
                                </h5>
                                <small className="text-muted fw-medium text-uppercase letter-spacing-1">Review adjustments before finalizing disbursement</small>
                            </div>
                            <div className="d-flex gap-2">
                                <Badge bg="soft-primary" className="text-primary generate-payroll-status-badge sh-5 d-flex align-items-center gap-2">
                                    <CsLineIcons icon="users" size="14" /> {previews.length} Employees
                                </Badge>
                                <Badge bg="primary" className="generate-payroll-status-badge sh-5 d-flex align-items-center gap-2 px-3">
                                    Net Total: ₹{previewTotals.total_net.toLocaleString('en-IN', { minimumFractionDigits: 0 })}
                                </Badge>
                            </div>
                        </div>
                    </Card.Header>

                    <Card.Body className="p-0">
                        <div className="table-responsive">
                            <Table hover className="generate-payroll-react-table-modern mb-0">
                                <thead>
                                    <tr>
                                        <th>Staff Details</th>
                                        <th className="text-center">Days (P/A)</th>
                                        <th className="text-end">Base Rate</th>
                                        <th className="text-end">Gross Earned</th>
                                        <th className="text-center" style={{ width: '120px' }}>OT Hours</th>
                                        <th className="text-end">OT Pay</th>
                                        <th className="text-center" style={{ width: '130px' }}>Bonus (₹)</th>
                                        <th className="text-center" style={{ width: '140px' }}>Man. Ded (₹)</th>
                                        <th className="text-end fw-bold text-primary">Net Payable</th>
                                        <th className="text-center">Flags</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {previews.map((p) => {
                                        const adj = adjustments[p.staff_id] || {};
                                        const { earned, ot_pay, net } = recalculate(p, adj);

                                        return (
                                            <tr key={p.staff_id}>
                                                <td>
                                                    <div className="d-flex align-items-center gap-3">
                                                        <div className="sw-5 sh-5 rounded-circle bg-soft-primary d-flex align-items-center justify-content-center text-primary fw-bold">
                                                            {p.f_name?.[0]}{p.l_name?.[0]}
                                                        </div>
                                                        <div>
                                                            <div className="fw-bold text-dark">{p.f_name} {p.l_name}</div>
                                                            <small className="text-muted fw-medium">{p.position} • #{p.staff_ref_id}</small>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="text-center">
                                                    <div className="d-flex align-items-center justify-content-center gap-2">
                                                        <Badge bg="soft-success" className="text-success px-2 py-1 rounded-pill">{p.present_days}P</Badge>
                                                        <Badge bg={p.absent_days > 0 ? 'soft-danger' : 'soft-light'} className={`${p.absent_days > 0 ? 'text-danger' : 'text-muted'} px-2 py-1 rounded-pill`}>{p.absent_days}A</Badge>
                                                    </div>
                                                </td>
                                                <td className="text-end text-muted fw-medium">₹{(p.staff?.salary || p.base_salary || 0).toLocaleString('en-IN')}</td>
                                                <td className="text-end text-success fw-bold">₹{(p.earned_breakdown?.total_gross || earned || 0).toLocaleString('en-IN', { minimumFractionDigits: 0 })}</td>
                                                <td>
                                                    <Form.Control className="generate-payroll-input-adjustment mx-auto" type="number" step={0.5} value={adj.overtime_hours ?? 0} onChange={(e) => updateAdjustment(p.staff_id, 'overtime_hours', e.target.value)} />
                                                </td>
                                                <td className="text-end text-primary fw-medium">
                                                    <div className="small opacity-50 fw-bold">₹{p.overtime_rate}/hr</div>
                                                    <div>+₹{ot_pay.toLocaleString('en-IN', { minimumFractionDigits: 0 })}</div>
                                                </td>
                                                <td>
                                                    <Form.Control className="generate-payroll-input-adjustment mx-auto text-success" type="number" value={adj.bonus ?? 0} onChange={(e) => updateAdjustment(p.staff_id, 'bonus', e.target.value)} />
                                                </td>
                                                <td>
                                                    <div className="text-danger small fw-bold text-center mb-1">Stat: ₹{(p.deduction_breakdown?.total_statutory || 0).toLocaleString('en-IN')}</div>
                                                    <Form.Control className="generate-payroll-input-adjustment mx-auto text-danger" type="number" placeholder="Manual" value={adj.deductions ?? 0} onChange={(e) => updateAdjustment(p.staff_id, 'deductions', e.target.value)} />
                                                </td>
                                                <td className="text-end">
                                                    <div className={`h5 mb-0 fw-bold ${net < 0 ? 'text-danger' : 'text-primary'}`}>₹{net.toLocaleString('en-IN', { minimumFractionDigits: 0 })}</div>
                                                </td>
                                                <td className="text-center">
                                                    {p.already_exists ? (
                                                        <Badge bg={p.existing_status === 'paid' ? 'success' : 'warning'} className="generate-payroll-status-badge py-1 px-2" style={{ fontSize: '0.65rem' }}>
                                                            {p.existing_status === 'paid' ? 'LOCKED' : 'UPDATE'}
                                                        </Badge>
                                                    ) : (
                                                        <Badge bg="soft-secondary" className="text-muted generate-payroll-status-badge py-1 px-2" style={{ fontSize: '0.65rem' }}>NEW</Badge>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </Table>
                        </div>
                    </Card.Body>

                    <Card.Footer className="bg-light border-0 p-4">
                        <div className="d-flex justify-content-between align-items-center flex-wrap gap-4">
                            <div className="d-flex align-items-center gap-3">
                                <div className="sw-4 sh-4 rounded-circle bg-soft-primary d-flex align-items-center justify-content-center text-primary">
                                    <CsLineIcons icon="info-hexagon" size="16" />
                                </div>
                                <div className="text-muted small fw-medium" style={{ maxWidth: '400px' }}>
                                    Net Salary is calculated as: <strong>(Base/Days × Present) + (OT Hrs × OT Rate) + Bonus - Statutory - Manual Deductions.</strong>
                                </div>
                            </div>
                            <Button className="generate-payroll-custom-btn-solid sh-6 px-5 h5 mb-0 shadow-lg" onClick={() => setShowConfirmModal(true)} disabled={isGenerating}>
                                {isGenerating ? <Spinner size="sm" /> : <><CsLineIcons icon="check" className="me-2" /> Finalize & Generate Payroll</>}
                            </Button>
                        </div>
                    </Card.Footer>
                </Card>
            )}

            <Modal show={showConfirmModal} onHide={() => setShowConfirmModal(false)} centered className="rounded-4">
                <Modal.Header closeButton className="border-0 p-4">
                    <Modal.Title className="fw-bold d-flex align-items-center gap-2">
                        <CsLineIcons icon="check-circle" size="24" className="text-success" />
                        Confirm Payroll Run
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="p-4 pt-0">
                    <p className="text-muted">You are initiating the payroll generation for <strong>{MONTH_NAMES[month]} {year}</strong>.</p>
                    <div className="generate-payroll-glass-card bg-light border-0 p-4 mb-3">
                        <div className="d-flex justify-content-between mb-2">
                            <span className="text-muted fw-bold small text-uppercase">Total Employees</span>
                            <span className="fw-bold">{previews.length}</span>
                        </div>
                        <div className="d-flex justify-content-between mb-2">
                            <span className="text-muted fw-bold small text-uppercase">Working Days</span>
                            <span className="fw-bold">{workingDays}</span>
                        </div>
                        <hr className="my-3 opacity-10" />
                        <div className="d-flex justify-content-between align-items-center">
                            <span className="text-muted fw-bold small text-uppercase">Total Disbursement</span>
                            <h3 className="mb-0 fw-bold text-primary">₹{previewTotals.total_net.toLocaleString('en-IN', { minimumFractionDigits: 0 })}</h3>
                        </div>
                    </div>
                    {previews.some((p) => p.already_exists && p.existing_status === 'paid') && (
                        <Alert variant="warning" className="border-0 rounded-3 mb-0 d-flex align-items-center gap-3">
                            <CsLineIcons icon="alert" size="20" />
                            <small className="fw-bold">Locked records (Paid) will not be modified by this run.</small>
                        </Alert>
                    )}
                </Modal.Body>
                <Modal.Footer className="border-0 p-4 pt-0 d-flex gap-3">
                    <Button className="generate-payroll-custom-btn-outline flex-grow-1" onClick={() => setShowConfirmModal(false)}>Back to Review</Button>
                    <Button className="generate-payroll-custom-btn-solid flex-grow-1 py-2" onClick={handleGenerate}>Execute Run</Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
}