import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { Row, Col, Card, Form, Button, Spinner } from 'react-bootstrap';
import { toast } from 'react-toastify';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import { getPayrollConfig, updatePayrollConfig } from 'api/payrollConfig';

const EARNING_OPTIONS = [
    { id: 'basic', label: 'Basic Salary' },
    { id: 'hra', label: 'HRA' },
    { id: 'conveyance', label: 'Conveyance' },
    { id: 'medical', label: 'Medical Allowance' },
    { id: 'special', label: 'Special Allowance' },
    { id: 'other', label: 'Other Allowance' }
];

const PayrollSettings = () => {
    const history = useHistory();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [config, setConfig] = useState({
        active_earnings: ['basic', 'hra', 'conveyance'],
        statutory_deductions: {
            pf_percentage: 12,
            esi_percentage: 0.75,
            pt_amount: 200
        }
    });


    const fetchConfig = async () => {
        try {
            setLoading(true);
            const res = await getPayrollConfig();
            if (res.success && res.data) {
                setConfig(res.data);
            }
        } catch (err) {
            console.error("Error fetching payroll config", err);
            toast.error("Failed to load payroll configuration");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchConfig();
    }, []);

    const handleSave = async () => {
        try {
            setSaving(true);
            const res = await updatePayrollConfig(config);
            if (res.success) {
                toast.success('Payroll settings updated successfully');
                setConfig(res.data);
                history.push('/staff/payroll');
            } else {
                toast.error(res.message || 'Failed to update settings');
            }
        } catch (err) {
            console.error(err);
            toast.error('Server error updating settings');
        } finally {
            setSaving(false);
        }
    };

    const toggleEarning = (id) => {
        const current = [...(config.active_earnings || [])];
        const idx = current.indexOf(id);
        if (idx >= 0) {
            current.splice(idx, 1);
        } else {
            current.push(id);
        }
        setConfig({ ...config, active_earnings: current });
    };

    const updateDeduction = (key, value) => {
        setConfig({
            ...config,
            statutory_deductions: {
                ...config.statutory_deductions,
                [key]: parseFloat(value) || 0
            }
        });
    };

    if (loading) {
        return <div className="text-center my-5"><Spinner animation="border" /></div>;
    }

    return (
        <>
            <div className="page-title-container">
                <Row>
                    <Col xs="12" md="7">
                        <h1 className="mb-0 pb-0 display-4">Payroll Global Settings</h1>
                        <nav className="breadcrumb-container d-inline-block" aria-label="breadcrumb">
                            <ul className="breadcrumb pt-0">
                                <li className="breadcrumb-item"><a href="/">Home</a></li>
                                <li className="breadcrumb-item"><a href="/staff/view">Staff</a></li>
                                <li className="breadcrumb-item"><a href="/staff/payroll">Payroll</a></li>
                            </ul>
                        </nav>
                    </Col>
                    <Col xs="12" md="5" className="d-flex align-items-start justify-content-end gap-2">
                        <Button variant="primary" onClick={() => history.go(-1)} className="btn-icon btn-icon-start w-100 w-md-auto">
                            <CsLineIcons icon="arrow-left" className="me-2" />
                            <span>Back</span>
                        </Button>
                        <Button variant="primary" onClick={handleSave} disabled={saving} className="btn-icon btn-icon-start w-100 w-md-auto">
                            {saving ? <Spinner size="sm" className="me-2" /> : <CsLineIcons icon="save" className="me-2" />}
                            <span>Save Settings</span>
                        </Button>
                    </Col>
                </Row>
            </div>

            <Row>
                <Col xl="6" className="mb-5">
                    <h2 className="small-title">Active Earnings Modules</h2>
                    <Card>
                        <Card.Body>
                            <p className="text-muted mb-4">
                                Select which earning components are actively used. Unchecking these will hide them from Staff creation forms.
                            </p>
                            <Form>
                                {EARNING_OPTIONS.map((opt) => (
                                    <div key={opt.id} className="mb-3">
                                        <Form.Check
                                            type="switch"
                                            id={`switch-${opt.id}`}
                                            label={<span className="fw-bold">{opt.label}</span>}
                                            checked={(config.active_earnings || []).includes(opt.id)}
                                            onChange={() => toggleEarning(opt.id)}
                                        />
                                    </div>
                                ))}
                            </Form>
                        </Card.Body>
                    </Card>
                </Col>

                <Col xl="6" className="mb-5">
                    <h2 className="small-title">Global Statutory Deductions</h2>
                    <Card>
                        <Card.Body>
                            <p className="text-muted mb-4">
                                Set the global fallback percentages and amounts. Staff can still have individual overrides in their profiles.
                            </p>
                            <Form>
                                <div className="mb-3 filled">
                                    <Form.Label>Provident Fund (PF) % on Basic Salary</Form.Label>
                                    <Form.Control
                                        type="number"
                                        min="0"
                                        max="100"
                                        step="0.01"
                                        value={config.statutory_deductions?.pf_percentage ?? 12}
                                        onChange={(e) => updateDeduction('pf_percentage', e.target.value)}
                                    />
                                </div>
                                <div className="mb-3 filled">
                                    <Form.Label>ESI % on Gross Salary</Form.Label>
                                    <Form.Control
                                        type="number"
                                        min="0"
                                        max="100"
                                        step="0.01"
                                        value={config.statutory_deductions?.esi_percentage ?? 0.75}
                                        onChange={(e) => updateDeduction('esi_percentage', e.target.value)}
                                    />
                                </div>
                                <div className="mb-3 filled">
                                    <Form.Label>Professional Tax (PT) Default Amount</Form.Label>
                                    <Form.Control
                                        type="number"
                                        min="0"
                                        value={config.statutory_deductions?.pt_amount ?? 200}
                                        onChange={(e) => updateDeduction('pt_amount', e.target.value)}
                                    />
                                </div>
                            </Form>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </>
    );
};

export default PayrollSettings;
