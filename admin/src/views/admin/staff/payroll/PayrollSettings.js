import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { Row, Col, Card, Form, Button, Spinner, Badge, Table } from 'react-bootstrap';
import { toast } from 'react-toastify';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import { getPayrollConfig, updatePayrollConfig } from 'api/payrollConfig';

const EARNING_OPTIONS = [
    { id: 'basic', label: 'Basic Salary' },
    { id: 'hra', label: 'HRA' },
    { id: 'conveyance', label: 'Conveyance' },
    { id: 'medical', label: 'Medical Allowance' },
    { id: 'special', label: 'Special Allowance' },
    { id: 'other', label: 'Other Allowance' }
];

const WEEK_DAYS = [
    { value: 0, label: 'Sunday' },
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
    { value: 6, label: 'Saturday' },
];

const PayrollSettings = () => {
    const title = 'Payroll Global Settings';
    const description = 'Configure statutory deductions, active earnings, and organizational rules.';
    const breadcrumbs = [
        { to: '', text: 'Home' },
        { to: 'staff/view', text: 'Staff' },
        { to: 'staff/payroll/settings', title: 'Settings' }
    ];

    const history = useHistory();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [config, setConfig] = useState({
        active_earnings: ['basic', 'hra', 'conveyance'],
        statutory_config: {
            pf: { is_mandatory: false, employee_percentage: 12, employer_percentage: 12, salary_limit: 15000, auto_calculate: true },
            esi: { is_mandatory: false, employee_percentage: 0.75, employer_percentage: 3.25, gross_limit: 21000, auto_calculate: true },
            pt: { is_applicable: false, state: '', slabs: [] }
        },
        org_rules: {
            leave_year_start: 'january',
            weekly_off_days: [0],
            half_day_hours: 4,
            full_day_hours: 8
        }
    });

    const fetchConfig = async () => {
        try {
            setLoading(true);
            const res = await getPayrollConfig();
            if (res.success && res.data) {
                // Merge with defaults to prevent undefined errors
                setConfig({
                    active_earnings: res.data.active_earnings || ['basic', 'hra', 'conveyance'],
                    statutory_config: {
                        pf: { ...config.statutory_config.pf, ...(res.data.statutory_config?.pf || {}) },
                        esi: { ...config.statutory_config.esi, ...(res.data.statutory_config?.esi || {}) },
                        pt: { ...config.statutory_config.pt, ...(res.data.statutory_config?.pt || {}) },
                    },
                    org_rules: { ...config.org_rules, ...(res.data.org_rules || {}) }
                });
            }
        } catch (err) {
            toast.error("Failed to load payroll configuration");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchConfig(); }, []);

    const handleSave = async () => {
        try {
            setSaving(true);
            const res = await updatePayrollConfig(config);
            if (res.success) {
                toast.success('Settings updated successfully');
            } else {
                toast.error(res.message || 'Failed to update settings');
            }
        } catch (err) {
            toast.error('Server error updating settings');
        } finally {
            setSaving(false);
        }
    };

    // ── Update Handlers ─────────────────────────────────────────────────────────

    const toggleEarning = (id) => {
        const current = [...config.active_earnings];
        const idx = current.indexOf(id);
        if (idx >= 0) current.splice(idx, 1);
        else current.push(id);
        setConfig({ ...config, active_earnings: current });
    };

    const toggleWeekDay = (dayValue) => {
        const current = [...config.org_rules.weekly_off_days];
        const idx = current.indexOf(dayValue);
        if (idx >= 0) current.splice(idx, 1);
        else current.push(dayValue);
        setConfig({ ...config, org_rules: { ...config.org_rules, weekly_off_days: current } });
    };

    const updatePF = (key, value) => {
        setConfig(prev => ({
            ...prev, statutory_config: {
                ...prev.statutory_config, pf: { ...prev.statutory_config.pf, [key]: value }
            }
        }));
    };

    const updateESI = (key, value) => {
        setConfig(prev => ({
            ...prev, statutory_config: {
                ...prev.statutory_config, esi: { ...prev.statutory_config.esi, [key]: value }
            }
        }));
    };

    const updatePT = (key, value) => {
        setConfig(prev => ({
            ...prev, statutory_config: {
                ...prev.statutory_config, pt: { ...prev.statutory_config.pt, [key]: value }
            }
        }));
    };

    const updateOrg = (key, value) => {
        setConfig(prev => ({
            ...prev, org_rules: { ...prev.org_rules, [key]: value }
        }));
    };

    const addPTSlab = () => {
        const slabs = [...config.statutory_config.pt.slabs, { min_salary: 0, max_salary: 0, amount: 0 }];
        updatePT('slabs', slabs);
    };

    const removePTSlab = (idx) => {
        const slabs = [...config.statutory_config.pt.slabs];
        slabs.splice(idx, 1);
        updatePT('slabs', slabs);
    };

    const updateSlab = (idx, field, val) => {
        const slabs = [...config.statutory_config.pt.slabs];
        slabs[idx][field] = Number(val) || 0;
        updatePT('slabs', slabs);
    };


    if (loading) return <div className="text-center my-5"><Spinner animation="border" /></div>;

    return (
        <>
            <HtmlHead title={title} description={description} />
            <div className="page-title-container">
                <Row className="g-0">
                    <Col className="col-auto mb-3 mb-sm-0 me-auto">
                        <h1 className="mb-0 pb-0 display-4">{title}</h1>
                        <BreadcrumbList items={breadcrumbs} />
                    </Col>
                    <Col xs="auto" className="d-flex align-items-end gap-2 mb-2">
                        <Button variant="outline-primary" onClick={() => history.go(-1)} className="btn-icon btn-icon-start">
                            <CsLineIcons icon="arrow-left" /> <span>Back</span>
                        </Button>
                        <Button variant="primary" onClick={handleSave} disabled={saving} className="btn-icon btn-icon-start">
                            {saving ? <Spinner size="sm" animation="border" /> : <CsLineIcons icon="save" />} <span>Save Settings</span>
                        </Button>
                    </Col>
                </Row>
            </div>

            <Row className="g-4 mb-5">
                {/* ── Organizational Rules ── */}
                <Col xl="6">
                    <h2 className="small-title">Organizational Rules</h2>
                    <Card className="h-100">
                        <Card.Body>
                            <Row className="g-3">
                                <Col md="6">
                                    <Form.Group>
                                        <Form.Label>Leave Cycle Start Month</Form.Label>
                                        <Form.Select 
                                            value={config.org_rules.leave_year_start} 
                                            onChange={(e) => updateOrg('leave_year_start', e.target.value)}
                                        >
                                            <option value="january">January (Jan - Dec)</option>
                                            <option value="april">April (Apr - Mar)</option>
                                        </Form.Select>
                                        <Form.Text className="text-muted">Common in India: April</Form.Text>
                                    </Form.Group>
                                </Col>
                                <Col md="6">
                                    <Form.Group>
                                        <Form.Label>Weekly Off Days</Form.Label>
                                        <div className="d-flex flex-wrap gap-2">
                                            {WEEK_DAYS.map(day => (
                                                <Badge 
                                                    key={day.value}
                                                    bg={config.org_rules.weekly_off_days.includes(day.value) ? 'primary' : 'light'}
                                                    text={config.org_rules.weekly_off_days.includes(day.value) ? 'white' : 'dark'}
                                                    className="cursor-pointer border py-2 px-3"
                                                    onClick={() => toggleWeekDay(day.value)}
                                                >
                                                    {day.label}
                                                </Badge>
                                            ))}
                                        </div>
                                    </Form.Group>
                                </Col>
                                <Col md="6">
                                    <Form.Group>
                                        <Form.Label>Full Day Hours</Form.Label>
                                        <Form.Control type="number" value={config.org_rules.full_day_hours} onChange={e => updateOrg('full_day_hours', Number(e.target.value))} />
                                    </Form.Group>
                                </Col>
                                <Col md="6">
                                    <Form.Group>
                                        <Form.Label>Half Day Hours</Form.Label>
                                        <Form.Control type="number" value={config.org_rules.half_day_hours} onChange={e => updateOrg('half_day_hours', Number(e.target.value))} />
                                    </Form.Group>
                                </Col>
                            </Row>
                        </Card.Body>
                    </Card>
                </Col>

                {/* ── Active Earnings ── */}
                <Col xl="6">
                    <h2 className="small-title">Active Earnings Components</h2>
                    <Card className="h-100">
                        <Card.Body>
                            <p className="text-muted mb-4">Select which earning components are actively used. Unchecking these will hide them from Staff creation forms.</p>
                            <Row className="g-2">
                                {EARNING_OPTIONS.map((opt) => (
                                    <Col md="6" key={opt.id}>
                                        <Form.Check
                                            type="switch"
                                            id={`switch-${opt.id}`}
                                            label={<span className="fw-bold">{opt.label}</span>}
                                            checked={config.active_earnings.includes(opt.id)}
                                            onChange={() => toggleEarning(opt.id)}
                                        />
                                    </Col>
                                ))}
                            </Row>
                        </Card.Body>
                    </Card>
                </Col>

                {/* ── EPF Configuration ── */}
                <Col xl="6">
                    <h2 className="small-title">Provident Fund (EPF)</h2>
                    <Card className="h-100">
                        <Card.Body>
                            <Form.Group className="mb-4">
                                <Form.Check 
                                    type="switch" 
                                    label={<span className="fw-bold ms-1 fs-5">Enable PF Deduction</span>} 
                                    checked={config.statutory_config.pf.is_mandatory} 
                                    onChange={e => updatePF('is_mandatory', e.target.checked)} 
                                />
                            </Form.Group>
                            
                            {config.statutory_config.pf.is_mandatory && (
                                <Row className="g-3">
                                    <Col md="6">
                                        <Form.Group>
                                            <Form.Label>Employee Contribution (%)</Form.Label>
                                            <Form.Control type="number" step="0.01" value={config.statutory_config.pf.employee_percentage} onChange={e => updatePF('employee_percentage', Number(e.target.value))} />
                                        </Form.Group>
                                    </Col>
                                    <Col md="6">
                                        <Form.Group>
                                            <Form.Label>Employer Contribution (%)</Form.Label>
                                            <Form.Control type="number" step="0.01" value={config.statutory_config.pf.employer_percentage} onChange={e => updatePF('employer_percentage', Number(e.target.value))} />
                                        </Form.Group>
                                    </Col>
                                    <Col md="12">
                                        <Form.Group>
                                            <Form.Label>Basic Salary Limit (₹)</Form.Label>
                                            <Form.Control type="number" value={config.statutory_config.pf.salary_limit} onChange={e => updatePF('salary_limit', Number(e.target.value))} />
                                            <Form.Text className="text-muted">Statutory limit is ₹15,000. Set to 0 to apply to all basic salaries without a cap.</Form.Text>
                                        </Form.Group>
                                    </Col>
                                </Row>
                            )}
                        </Card.Body>
                    </Card>
                </Col>

                {/* ── ESI Configuration ── */}
                <Col xl="6">
                    <h2 className="small-title">Employee State Insurance (ESI)</h2>
                    <Card className="h-100">
                        <Card.Body>
                            <Form.Group className="mb-4">
                                <Form.Check 
                                    type="switch" 
                                    label={<span className="fw-bold ms-1 fs-5">Enable ESI Deduction</span>} 
                                    checked={config.statutory_config.esi.is_mandatory} 
                                    onChange={e => updateESI('is_mandatory', e.target.checked)} 
                                />
                            </Form.Group>

                            {config.statutory_config.esi.is_mandatory && (
                                <Row className="g-3">
                                    <Col md="6">
                                        <Form.Group>
                                            <Form.Label>Employee Contribution (%)</Form.Label>
                                            <Form.Control type="number" step="0.01" value={config.statutory_config.esi.employee_percentage} onChange={e => updateESI('employee_percentage', Number(e.target.value))} />
                                        </Form.Group>
                                    </Col>
                                    <Col md="6">
                                        <Form.Group>
                                            <Form.Label>Employer Contribution (%)</Form.Label>
                                            <Form.Control type="number" step="0.01" value={config.statutory_config.esi.employer_percentage} onChange={e => updateESI('employer_percentage', Number(e.target.value))} />
                                        </Form.Group>
                                    </Col>
                                    <Col md="12">
                                        <Form.Group>
                                            <Form.Label>Gross Salary Limit (₹)</Form.Label>
                                            <Form.Control type="number" value={config.statutory_config.esi.gross_limit} onChange={e => updateESI('gross_limit', Number(e.target.value))} />
                                            <Form.Text className="text-muted">ESI applies only if gross salary is ≤ ₹21,000.</Form.Text>
                                        </Form.Group>
                                    </Col>
                                </Row>
                            )}
                        </Card.Body>
                    </Card>
                </Col>

                {/* ── Professional Tax (PT) ── */}
                <Col xl="12">
                    <h2 className="small-title">Professional Tax (PT) Config</h2>
                    <Card>
                        <Card.Body>
                            <Row className="align-items-center mb-4">
                                <Col>
                                    <Form.Check 
                                        type="switch" 
                                        label={<span className="fw-bold ms-1 fs-5">Enable Professional Tax</span>} 
                                        checked={config.statutory_config.pt.is_applicable} 
                                        onChange={e => updatePT('is_applicable', e.target.checked)} 
                                    />
                                </Col>
                                {config.statutory_config.pt.is_applicable && (
                                    <Col md="4">
                                        <Form.Group>
                                            <Form.Label>State</Form.Label>
                                            <Form.Control placeholder="e.g. Karnataka" value={config.statutory_config.pt.state} onChange={e => updatePT('state', e.target.value)} />
                                        </Form.Group>
                                    </Col>
                                )}
                            </Row>

                            {config.statutory_config.pt.is_applicable && (
                                <>
                                    <h6 className="mb-3">Tax Slabs (Monthly)</h6>
                                    {config.statutory_config.pt.slabs.length === 0 ? (
                                        <div className="text-muted mb-3">No slabs added. Click below to add a salary range.</div>
                                    ) : (
                                        <Table bordered hover size="sm">
                                            <thead className="table-light">
                                                <tr>
                                                    <th>Min Salary (₹)</th>
                                                    <th>Max Salary (₹)</th>
                                                    <th>PT Amount (₹/mo)</th>
                                                    <th className="text-center" style={{ width: '80px' }}>Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {config.statutory_config.pt.slabs.map((slab, idx) => (
                                                    <tr key={idx}>
                                                        <td><Form.Control type="number" size="sm" value={slab.min_salary} onChange={e => updateSlab(idx, 'min_salary', e.target.value)} /></td>
                                                        <td><Form.Control type="number" size="sm" value={slab.max_salary} onChange={e => updateSlab(idx, 'max_salary', e.target.value)} /></td>
                                                        <td><Form.Control type="number" size="sm" value={slab.amount} onChange={e => updateSlab(idx, 'amount', e.target.value)} /></td>
                                                        <td className="text-center align-middle">
                                                            <Button variant="link" size="sm" className="text-danger p-0" onClick={() => removePTSlab(idx)}>
                                                                <CsLineIcons icon="bin" size="15" />
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </Table>
                                    )}
                                    <Button variant="outline-primary" size="sm" onClick={addPTSlab}>+ Add New Slab</Button>
                                </>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </>
    );
};

export default PayrollSettings;
