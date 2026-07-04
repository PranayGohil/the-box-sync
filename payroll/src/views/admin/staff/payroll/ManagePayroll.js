import React, { useState, useEffect } from 'react';
import { useHistory, useParams, Link } from 'react-router-dom';
import axios from 'axios';
import {
    Row, Col, Card, Button, Badge, Alert, Modal,
    Form, Spinner, Table, InputGroup,
} from 'react-bootstrap';
import Select from 'react-select';
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import { toast } from 'react-toastify';

const MONTH_NAMES = [
    '', 'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
];

const currentDate = new Date();

const customStyles = `
  .glass-card {
    background: #ffffff !important;
    border: 1px solid #f0f0f0 !important;
    border-radius: 1.5rem !important;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.04) !important;
    transition: all 0.3s ease;
  }
  .glass-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 15px 45px rgba(0, 0, 0, 0.06) !important;
  }
  .custom-btn-primary-outline {
    border: 1px solid #1ea8e7 !important;
    color: #1ea8e7 !important;
    background-color: #fff !important;
    transition: all 0.2s ease-in-out !important;
    border-radius: 50px !important;
    font-weight: 600 !important;
    font-size: 0.85rem !important;
    height: 40px !important;
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
    gap: 6px !important;
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
  .react-table-modern {
    border-collapse: collapse !important;
    border-spacing: 0 !important;
    width: 100% !important;
  }
  .react-table-modern thead th {
    border-bottom: 2px solid #edf2f7 !important;
    background: transparent !important;
    font-size: 0.85rem !important;
    color: #64748b !important;
    letter-spacing: 0.05em;
    padding: 1rem 1.5rem;
    font-weight: 700 !important;
  }
  .react-table-modern tbody tr {
    background: transparent !important;
    transition: all 0.2s ease;
  }
  .react-table-modern tbody tr:hover {
    background: #f8fafc !important;
  }
  .react-table-modern tbody td {
    border-top: none !important;
    border-bottom: 1px solid #edf2f7 !important;
    padding: 1.25rem 1.5rem !important;
    vertical-align: middle !important;
    background: transparent !important;
    font-size: 0.95rem !important;
  }
  .react-table-modern tbody td:first-child {
    border-left: none !important;
    border-top-left-radius: 0 !important;
    border-bottom-left-radius: 0 !important;
  }
  .react-table-modern tbody td:last-child {
    border-right: none !important;
    border-top-right-radius: 0 !important;
    border-bottom-right-radius: 0 !important;
  }
  @media (min-width: 1200px) {
    .hide-on-desktop {
      display: none !important;
    }
  }
  @media (max-width: 1199px) {
    .hide-on-mobile {
      display: none !important;
    }
  }
  .bulk-bar {
    background: #1ea8e7 !important;
    color: #fff !important;
    border-radius: 1rem !important;
    padding: 1rem 1.5rem !important;
    margin-bottom: 1.5rem !important;
    animation: slideDown 0.3s ease-out;
  }
  @keyframes slideDown {
    from { transform: translateY(-20px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
`;

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
    const [branches, setBranches] = useState([]);
    const [selectedBranch, setSelectedBranch] = useState('all');
    const [totals, setTotals] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [payrollConfig, setPayrollConfig] = useState(null);

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
            const [res, branchRes] = await Promise.all([
                axios.get(
                    `${process.env.REACT_APP_API}/payroll/summary/${month}/${year}`,
                    authHeader()
                ),
                axios.get(`${process.env.REACT_APP_API}/branch/all`, authHeader())
            ]);
            setSummary(res.data.data || []);
            setTotals(res.data.totals || {});
            if (branchRes.data?.success) {
                setBranches(branchRes.data.data);
            }
        } catch (err) {
            setError('Failed to load payroll data.');
            toast.error('Failed to load payroll data.');
        } finally {
            setLoading(false);
        }
    };

    const fetchConfig = async () => {
        try {
            const res = await axios.get(
                `${process.env.REACT_APP_API}/payroll-config`,
                authHeader()
            );
            if (res.data.success) {
                setPayrollConfig(res.data.data);
            }
        } catch (err) {
            console.error("Error fetching payroll config:", err);
        }
    };

    useEffect(() => {
        fetchSummary();
    }, [month, year]);

    useEffect(() => {
        fetchConfig();
    }, []);

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

    const COMPONENT_LABELS = {
        basic: 'Basic Salary',
        hra: 'HRA',
        conveyance: 'Conveyance',
        medical: 'Medical Allowance',
        special: 'Special Allowance',
        other: 'Other Allowance',
        pf: 'Provident Fund (PF)',
        esi: 'Employee State Insurance (ESI)',
        pt: 'Professional Tax (PT)',
        advance_deduction: 'Salary Advance',
        tds: 'Income Tax (TDS)',
        deductions: 'Extra Deductions'
    };

    const getComponentLabel = (key) => {
        const customEarning = payrollConfig?.custom_earnings?.find(e => e.id === key);
        if (customEarning) return customEarning.label;
        const customDeduction = payrollConfig?.custom_deductions?.find(d => d.id === key);
        if (customDeduction) return customDeduction.label;
        return COMPONENT_LABELS[key] || key;
    };

    const openEditModal = (payroll, staff) => {
        setEditingPayroll({ ...payroll, staff });
        
        const activeE = ['basic', 'hra', 'conveyance', 'medical', 'special', 'other'].filter(
            key => (payroll.earned_breakdown?.[key] || 0) > 0
        );
        if (activeE.length === 0) activeE.push('basic');

        const activeD = ['pf', 'esi', 'pt', 'advance_deduction', 'tds', 'deductions'].filter(
            key => {
                if (key === 'pf' || key === 'esi' || key === 'pt') {
                    return (payroll.deduction_breakdown?.[key] || 0) > 0;
                }
                return (payroll[key] || 0) > 0;
            }
        );

        const baseSalary = staff?.salary || payroll.base_salary || 0;
        const workingDays = payroll.working_days_in_month || 26;
        const defaultOtRate = Math.round((baseSalary / workingDays) / 8 * 2);
        
        // If the DB has an explicit overtime_rate of 0, and we want to fallback to Indian OT rate,
        // we can just use the calculated defaultOtRate if the existing one is falsy (0).
        const finalOtRate = payroll.overtime_rate || staff?.overtime_rate || defaultOtRate || 0;

        setEditForm({
            overtime_hours: payroll.overtime_hours || 0,
            overtime_rate: finalOtRate,
            bonus: payroll.bonus || 0,
            deductions: payroll.deductions || 0,
            deduction_reason: payroll.deduction_reason || '',
            notes: payroll.notes || '',
            working_days_in_month: payroll.working_days_in_month || 26,
            earned_breakdown: {
                basic: payroll.earned_breakdown?.basic || 0,
                hra: payroll.earned_breakdown?.hra || 0,
                conveyance: payroll.earned_breakdown?.conveyance || 0,
                medical: payroll.earned_breakdown?.medical || 0,
                special: payroll.earned_breakdown?.special || 0,
                other: payroll.earned_breakdown?.other || 0,
            },
            deduction_breakdown: {
                pf: payroll.deduction_breakdown?.pf || 0,
                esi: payroll.deduction_breakdown?.esi || 0,
                pt: payroll.deduction_breakdown?.pt || 0,
            },
            advance_deduction: payroll.advance_deduction || 0,
            tds: payroll.tds || 0,
            visibleEarnings: activeE,
            visibleDeductions: activeD,
        });
        setShowEditModal(true);
    };

    const editNetPreview = () => {
        if (!editingPayroll) return 0;
        
        const earningsTotal = Object.keys(editForm.earned_breakdown || {}).reduce((sum, key) => {
            if (!editForm.visibleEarnings?.includes(key)) return sum;
            return sum + (parseFloat(editForm.earned_breakdown[key]) || 0);
        }, 0);
        
        const statutoryTotal = Object.keys(editForm.deduction_breakdown || {}).reduce((sum, key) => {
            if (!editForm.visibleDeductions?.includes(key)) return sum;
            return sum + (parseFloat(editForm.deduction_breakdown[key]) || 0);
        }, 0);
        
        const otherDeductionsTotal = 
            (editForm.visibleDeductions?.includes('advance_deduction') ? (parseFloat(editForm.advance_deduction) || 0) : 0) + 
            (editForm.visibleDeductions?.includes('tds') ? (parseFloat(editForm.tds) || 0) : 0) + 
            (editForm.visibleDeductions?.includes('deductions') ? (parseFloat(editForm.deductions) || 0) : 0);
        
        const ot_pay = (parseFloat(editForm.overtime_hours) || 0) * (parseFloat(editForm.overtime_rate) || 0);
        const lwp_ded = editingPayroll.lwp_deduction || 0;
        const expenses = editingPayroll.expense_claims || 0;
        
        const net = earningsTotal + ot_pay + (parseFloat(editForm.bonus) || 0) + expenses - statutoryTotal - otherDeductionsTotal - lwp_ded;
        return parseFloat(net.toFixed(2));
    };

    const removeEarning = (key) => {
        setEditForm(prev => ({
            ...prev,
            visibleEarnings: prev.visibleEarnings.filter(k => k !== key),
            earned_breakdown: {
                ...prev.earned_breakdown,
                [key]: 0
            }
        }));
    };

    const addEarning = (key) => {
        if (!key) return;
        setEditForm(prev => ({
            ...prev,
            visibleEarnings: [...prev.visibleEarnings, key],
            earned_breakdown: {
                ...prev.earned_breakdown,
                [key]: 0
            }
        }));
    };

    const removeDeduction = (key) => {
        setEditForm(prev => {
            const updated = {
                ...prev,
                visibleDeductions: prev.visibleDeductions.filter(k => k !== key)
            };
            if (key === 'pf' || key === 'esi' || key === 'pt') {
                updated.deduction_breakdown = {
                    ...prev.deduction_breakdown,
                    [key]: 0
                };
            } else {
                updated[key] = 0;
            }
            return updated;
        });
    };

    const addDeduction = (key) => {
        if (!key) return;
        setEditForm(prev => {
            const updated = {
                ...prev,
                visibleDeductions: [...prev.visibleDeductions, key]
            };
            if (key === 'pf' || key === 'esi' || key === 'pt') {
                updated.deduction_breakdown = {
                    ...prev.deduction_breakdown,
                    [key]: 0
                };
            } else {
                updated[key] = 0;
            }
            return updated;
        });
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

    const filteredSummary = selectedBranch === 'all' ? summary : summary.filter(s => s.staff?.branch_id === selectedBranch);
    const payrollRows = filteredSummary.filter((s) => s.payroll);
    const allSelected = payrollRows.length > 0 && selectedIds.size === payrollRows.length;

    // Recalculate totals based on filter
    const filteredTotals = selectedBranch === 'all' ? totals : {
        total_net_salary: payrollRows.reduce((sum, p) => sum + (p.payroll.net_salary || 0), 0),
        total_paid: payrollRows.filter(p => p.payroll.status === "paid").reduce((sum, p) => sum + (p.payroll.net_salary || 0), 0),
        total_unpaid: payrollRows.filter(p => p.payroll.status === "unpaid").reduce((sum, p) => sum + (p.payroll.net_salary || 0), 0),
        count_not_generated: filteredSummary.length - payrollRows.length
    };

    return (
        <div className="container-fluid px-lg-4 px-xl-5 pb-5">
            <style>{customStyles}</style>
            <HtmlHead title={title} description={description} />

            <div className="page-title-container mb-4 mb-lg-5 mt-5 mt-lg-0">
                <Row className="g-3 align-items-center">
                    <Col xs="12" md="6">
                        <h1 className="mb-0 pb-0 display-4 fw-bold" style={{ color: '#1ea8e7' }}>{title}</h1>
                        <BreadcrumbList items={breadcrumbs} />
                    </Col>
                    <Col xs="12" md="6" className="d-flex flex-wrap justify-content-md-end align-items-center gap-3">
                        <Button className="custom-btn-primary-outline px-4 rounded-pill shadow-sm d-flex align-items-center" style={{ height: '40px' }} onClick={() => history.push('/dashboard')}>
                            <CsLineIcons icon="arrow-left" className="me-2" size="18" />
                            <span>Back</span>
                        </Button>
                        <Button className="custom-btn-primary-outline px-4 rounded-pill shadow-sm d-flex align-items-center" style={{ height: '40px' }} as={Link} to="/staff/payroll/generate">
                            <CsLineIcons icon="plus" className="me-2" size="18" />
                            <span>Generate New</span>
                        </Button>
                        <Button className="custom-btn-primary-outline px-4 rounded-pill shadow-sm d-flex align-items-center" style={{ height: '40px' }} as={Link} to="/payroll/settings">
                            <CsLineIcons icon="gear" className="me-2" size="18" />
                            <span>Settings</span>
                        </Button>
                    </Col>
                </Row>
            </div>

            <Card className="glass-card border-0 mb-4">
                <Card.Body className="p-4">
                    <Row className="g-3 align-items-end">
                        <Col xs={12} md={4}>
                            <Form.Label className="small fw-bold text-muted text-uppercase">Financial Month</Form.Label>
                            <Select 
                                classNamePrefix="react-select"
                                className="react-select-premium shadow-sm"
                                options={MONTH_NAMES.slice(1).map((m, i) => ({ value: i + 1, label: m }))}
                                value={{ value: month, label: MONTH_NAMES[month] }}
                                onChange={(opt) => setMonth(opt.value)}
                                menuPortalTarget={document.body}
                                styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                            />
                        </Col>
                        <Col xs={12} md={3}>
                            <Form.Label className="small fw-bold text-muted text-uppercase">Financial Year</Form.Label>
                            <Select 
                                classNamePrefix="react-select"
                                className="react-select-premium shadow-sm"
                                options={yearOptions.map(y => ({ value: y, label: y }))}
                                value={{ value: year, label: year }}
                                onChange={(opt) => setYear(opt.value)}
                                menuPortalTarget={document.body}
                                styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                            />
                        </Col>
                        <Col xs={12} md={3}>
                            <Form.Label className="small fw-bold text-muted text-uppercase">Branch</Form.Label>
                            <Select 
                                classNamePrefix="react-select"
                                className="react-select-premium shadow-sm"
                                options={[{ value: 'all', label: 'All Branches' }, ...branches.map(b => ({ value: b._id, label: b.name }))]}
                                value={{ value: selectedBranch, label: selectedBranch === 'all' ? 'All Branches' : branches.find(b => b._id === selectedBranch)?.name || '' }}
                                onChange={(opt) => setSelectedBranch(opt.value)}
                                menuPortalTarget={document.body}
                                styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                            />
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {!loading && (
                <Row className="g-4 mb-5">
                    {[
                        { label: 'Total Net Payroll', value: `₹${(filteredTotals.total_net_salary || 0).toLocaleString('en-IN', { minimumFractionDigits: 0 })}`, icon: 'dollar', color: 'primary' },
                        { label: 'Total Paid', value: `₹${(filteredTotals.total_paid || 0).toLocaleString('en-IN', { minimumFractionDigits: 0 })}`, icon: 'check-circle', color: 'success' },
                        { label: 'Pending Payment', value: `₹${(filteredTotals.total_unpaid || 0).toLocaleString('en-IN', { minimumFractionDigits: 0 })}`, icon: 'clock', color: 'warning' },
                        { label: 'Pending Generation', value: filteredTotals.count_not_generated || 0, icon: 'info-hexagon', color: 'danger' },
                    ].map((s) => (
                        <Col xs={6} md={3} key={s.label}>
                            <Card className="glass-card border-0 h-100 stat-card">
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
                <Alert variant="danger" className="glass-card border-0 mb-4 p-4 d-flex align-items-center gap-3">
                    <CsLineIcons icon="error" size="24" className="text-danger" />
                    <span className="fw-bold">{error}</span>
                </Alert>
            )}

            {selectedIds.size > 0 && (
                <div className="bulk-bar d-flex align-items-center justify-content-between shadow-lg">
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

            <Card className="glass-card border-0 overflow-hidden shadow-sm">
                <Card.Header className="bg-light border-0 p-4">
                    <div className="d-flex justify-content-between align-items-center">
                        <h5 className="fw-bold mb-0 d-flex align-items-center gap-2" style={{ color: '#1ea8e7' }}>
                            <CsLineIcons icon="layout" size="20" />
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
                                <Button className="custom-btn-solid" as={Link} to="/staff/add">Add First Staff Member</Button>
                            </div>
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <Table hover className="react-table-modern mb-0">
                                <thead className="d-none d-lg-table-header-group">
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
                                    {filteredSummary.map(({ staff, payroll }) => (
                                        <React.Fragment key={staff._id}>
                                        <tr className={`d-none d-lg-table-row ${selectedIds.has(payroll?._id) ? 'bg-soft-primary' : ''}`}>
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
                                                            <Badge bg="soft-success" className="text-success px-2 py-1 rounded-pill fs-6 fw-bold">{payroll.present_days}P</Badge>
                                                            <Badge bg={payroll.absent_days > 0 ? 'soft-danger' : 'soft-light'} className={`${payroll.absent_days > 0 ? 'text-danger' : 'text-muted'} px-2 py-1 rounded-pill fs-6 fw-bold`}>{payroll.absent_days}A</Badge>
                                                        </div>
                                                    </td>
                                                    <td className="text-end fw-medium text-dark">₹{(staff.salary || payroll.base_salary || 0).toLocaleString('en-IN')}</td>
                                                    <td className="text-end text-success fw-bold">₹{(payroll.earned_breakdown?.total_gross || payroll.earned_salary || 0).toLocaleString('en-IN', { minimumFractionDigits: 0 })}</td>
                                                    <td className="text-end">
                                                        <div className="d-flex flex-column align-items-end" style={{ whiteSpace: 'nowrap' }}>
                                                            <div className="small fw-bold">
                                                                <span className="text-primary me-2" title={`OT: ${payroll.overtime_hours||0}h @ ₹${payroll.overtime_rate || staff.overtime_rate || Math.round(((staff.salary || payroll.base_salary || 0) / 30 / 8) * 2)}/h`}>OT: +₹{(payroll.overtime_pay || 0).toLocaleString('en-IN')} <span className="text-muted fw-medium" style={{ fontSize: '0.85rem' }}>({payroll.overtime_hours||0}h)</span></span>
                                                                <span className="text-danger">Ded: -₹{((payroll.deduction_breakdown?.total_statutory || 0) + (payroll.deductions || 0)).toLocaleString('en-IN')}</span>
                                                            </div>
                                                            {(payroll.bonus > 0 || payroll.expense_claims > 0) && (
                                                                <div className="small fw-bold mt-1">
                                                                    {payroll.bonus > 0 && <span className="text-success me-2">Bon: +₹{payroll.bonus.toLocaleString('en-IN')}</span>}
                                                                    {payroll.expense_claims > 0 && <span className="text-success">Exp: +₹{payroll.expense_claims.toLocaleString('en-IN')}</span>}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="text-end fw-bold text-primary h5 mb-0">₹{payroll.net_salary.toLocaleString('en-IN', { minimumFractionDigits: 0 })}</td>
                                                    <td className="text-center">
                                                        <Badge bg={payroll.status === 'paid' ? 'success' : 'warning'} className="status-badge">
                                                            <CsLineIcons icon={payroll.status === 'paid' ? 'check' : 'clock'} size="12" className="me-1" />
                                                            {payroll.status}
                                                        </Badge>
                                                    </td>
                                                    <td className="text-center">
                                                        <div className="d-flex justify-content-center gap-2">
                                                            {payroll.status === 'unpaid' ? (
                                                                <Button variant="outline-success" className="btn-icon btn-icon-only rounded-circle" style={{ width: '38px', height: '38px' }} onClick={() => handleMarkPaid(new Set([payroll._id]))} disabled={isMarkingPaid}>
                                                                    <CsLineIcons icon="check" size="18" />
                                                                </Button>
                                                            ) : (
                                                                <Button variant="outline-warning" className="btn-icon btn-icon-only rounded-circle" style={{ width: '38px', height: '38px' }} onClick={() => handleMarkUnpaid(new Set([payroll._id]))} disabled={isMarkingPaid}>
                                                                    <CsLineIcons icon="close" size="18" />
                                                                </Button>
                                                            )}
                                                            <Button variant="outline-primary" className="btn-icon btn-icon-only rounded-circle" style={{ width: '38px', height: '38px' }} onClick={() => openEditModal(payroll, staff)}>
                                                                <CsLineIcons icon="edit" size="18" />
                                                            </Button>
                                                            <Button variant="outline-dark" className="btn-icon btn-icon-only rounded-circle" style={{ width: '38px', height: '38px' }} onClick={() => history.push(`/staff/payroll/view/${staff._id}`)}>
                                                                <CsLineIcons icon="eye" size="18" />
                                                            </Button>
                                                            <Button variant="outline-danger" className="btn-icon btn-icon-only rounded-circle" style={{ width: '38px', height: '38px' }} onClick={() => { setDeletingPayroll(payroll); setShowDeleteModal(true); }}>
                                                                <CsLineIcons icon="bin" size="18" />
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
                                                        <Button className="custom-btn-solid rounded-pill shadow-sm px-4" style={{ height: '40px' }} onClick={() => history.push(`/staff/payroll/generate?staff_id=${staff._id}&month=${month}&year=${year}`)}>
                                                            <CsLineIcons icon="plus" size="18" className="me-2" /> Generate
                                                        </Button>
                                                    </td>
                                                </>
                                            )}
                                        </tr>
                                        {/* Mobile View */}
                                        <tr className="d-lg-none">
                                            <td colSpan="9" className="p-0 border-0">
                                                <div className="p-3 border-bottom">
                                                    <div className="d-flex justify-content-between align-items-start mb-3">
                                                        <div className="d-flex align-items-center gap-3">
                                                            {payroll && (
                                                                <Form.Check
                                                                    className="custom-check"
                                                                    type="checkbox"
                                                                    checked={selectedIds.has(payroll._id)}
                                                                    onChange={() => toggleSelect(payroll._id)}
                                                                />
                                                            )}
                                                            <div className="sw-5 sh-5 rounded-circle bg-soft-primary d-flex align-items-center justify-content-center text-primary fw-bold">
                                                                {staff.f_name?.[0]}{staff.l_name?.[0]}
                                                            </div>
                                                            <div>
                                                                <div className="fw-bold text-dark">{staff.f_name} {staff.l_name}</div>
                                                                <small className="text-muted fw-medium">{staff.position} • #{staff.staff_id}</small>
                                                            </div>
                                                        </div>
                                                        <div>
                                                            {payroll ? (
                                                                <Badge bg={payroll.status === 'paid' ? 'success' : 'warning'} className="status-badge py-1 px-2" style={{ fontSize: '0.65rem' }}>
                                                                    <CsLineIcons icon={payroll.status === 'paid' ? 'check' : 'clock'} size="10" className="me-1" />
                                                                    {payroll.status}
                                                                </Badge>
                                                            ) : (
                                                                <Badge bg="soft-secondary" className="text-muted status-badge py-1 px-2" style={{ fontSize: '0.65rem' }}>UNGENERATED</Badge>
                                                            )}
                                                        </div>
                                                    </div>
                                                    
                                                    {payroll ? (
                                                        <>
                                                            <Row className="g-3 mb-3">
                                                                <Col xs={6}>
                                                                    <div className="text-muted small fw-bold text-uppercase mb-1">Days (P/A)</div>
                                                                    <div className="d-flex align-items-center gap-2">
                                                                        <Badge bg="soft-success" className="text-success px-2 py-1 rounded-pill fw-bold" style={{ fontSize: '0.95rem' }}>{payroll.present_days}P</Badge>
                                                                        <Badge bg={payroll.absent_days > 0 ? 'soft-danger' : 'soft-light'} className={`${payroll.absent_days > 0 ? 'text-danger' : 'text-muted'} px-2 py-1 rounded-pill fw-bold`} style={{ fontSize: '0.95rem' }}>{payroll.absent_days}A</Badge>
                                                                    </div>
                                                                </Col>
                                                                <Col xs={6} className="text-end">
                                                                    <div className="text-muted small fw-bold text-uppercase mb-1">Base Salary</div>
                                                                    <div className="fw-bold text-dark fs-6">₹{(staff.salary || payroll.base_salary || 0).toLocaleString('en-IN')}</div>
                                                                </Col>
                                                            </Row>

                                                            <div className="p-3 bg-light rounded-3 mt-2 mb-4 border border-light shadow-sm">
                                                                <div className="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom" style={{ borderColor: 'rgba(0,0,0,0.05) !important' }}>
                                                                    <div className="small fw-medium text-muted">Gross Earned</div>
                                                                    <div className="text-success fw-bold">₹{(payroll.earned_breakdown?.total_gross || payroll.earned_salary || 0).toLocaleString('en-IN', { minimumFractionDigits: 0 })}</div>
                                                                </div>
                                                                <div className="d-flex flex-column mb-3">
                                                                    <div className="d-flex justify-content-between align-items-center mb-1">
                                                                        <div className="small fw-medium text-muted">
                                                                            OT <span className="fw-medium" style={{fontSize: '0.85rem', opacity: 0.8}}>({payroll.overtime_hours || 0}h @ ₹{payroll.overtime_rate || staff.overtime_rate || Math.round(((staff.salary || payroll.base_salary || 0) / 30 / 8) * 2)}/h)</span>
                                                                        </div>
                                                                        <div className="fw-bold text-primary">
                                                                            +₹{(payroll.overtime_pay || 0).toLocaleString('en-IN')}
                                                                        </div>
                                                                    </div>
                                                                    <div className="d-flex justify-content-between align-items-center mb-1">
                                                                        <div className="small fw-medium text-muted">Deductions</div>
                                                                        <div className="fw-bold text-danger">
                                                                            -₹{((payroll.deduction_breakdown?.total_statutory || 0) + (payroll.deductions || 0)).toLocaleString('en-IN')}
                                                                        </div>
                                                                    </div>
                                                                    {(payroll.bonus > 0 || payroll.expense_claims > 0) && (
                                                                        <div className="d-flex justify-content-between align-items-center">
                                                                            <div className="small fw-medium text-muted">Bonus / Expenses</div>
                                                                            <div className="fw-bold">
                                                                                <span className="text-success">+₹{((payroll.bonus || 0) + (payroll.expense_claims || 0)).toLocaleString('en-IN')}</span>
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div className="d-flex justify-content-between align-items-center pt-2">
                                                                    <div className="small fw-bold text-uppercase text-muted" style={{ letterSpacing: '0.05em' }}>Net Payable</div>
                                                                    <div className="h4 mb-0 fw-bold text-primary">₹{payroll.net_salary.toLocaleString('en-IN', { minimumFractionDigits: 0 })}</div>
                                                                </div>
                                                            </div>
                                                            
                                                            <div className="d-flex justify-content-end gap-2">
                                                                {payroll.status === 'unpaid' ? (
                                                                    <Button variant="outline-success" className="btn-icon btn-icon-only rounded-circle" style={{ width: '38px', height: '38px' }} onClick={() => handleMarkPaid(new Set([payroll._id]))} disabled={isMarkingPaid}>
                                                                        <CsLineIcons icon="check" size="18" />
                                                                    </Button>
                                                                ) : (
                                                                    <Button variant="outline-warning" className="btn-icon btn-icon-only rounded-circle" style={{ width: '38px', height: '38px' }} onClick={() => handleMarkUnpaid(new Set([payroll._id]))} disabled={isMarkingPaid}>
                                                                        <CsLineIcons icon="close" size="18" />
                                                                    </Button>
                                                                )}
                                                                <Button variant="outline-primary" className="btn-icon btn-icon-only rounded-circle" style={{ width: '38px', height: '38px' }} onClick={() => openEditModal(payroll, staff)}>
                                                                    <CsLineIcons icon="edit" size="18" />
                                                                </Button>
                                                                <Button variant="outline-dark" className="btn-icon btn-icon-only rounded-circle" style={{ width: '38px', height: '38px' }} onClick={() => history.push(`/staff/payroll/view/${staff._id}`)}>
                                                                    <CsLineIcons icon="eye" size="18" />
                                                                </Button>
                                                                <Button variant="outline-danger" className="btn-icon btn-icon-only rounded-circle" style={{ width: '38px', height: '38px' }} onClick={() => { setDeletingPayroll(payroll); setShowDeleteModal(true); }}>
                                                                    <CsLineIcons icon="bin" size="18" />
                                                                </Button>
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <div className="text-center p-3 bg-light rounded-3">
                                                            <Button className="custom-btn-solid rounded-pill shadow-sm px-4" style={{ height: '40px' }} onClick={() => history.push(`/staff/payroll/generate?staff_id=${staff._id}&month=${month}&year=${year}`)}>
                                                                <CsLineIcons icon="plus" size="18" className="me-2" /> Generate Payroll
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                        </React.Fragment>
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
                            <div className="glass-card bg-light border-0 p-4 mb-4">
                                <Row className="text-center g-3">
                                    <Col xs={6}>
                                        <div className="text-muted small fw-bold text-uppercase mb-1">Contract Base</div>
                                        <div className="fw-bold h5 mb-0 text-dark">₹{(editingPayroll.staff?.salary || editingPayroll.base_salary || 0).toLocaleString('en-IN')}</div>
                                    </Col>
                                    <Col xs={6}>
                                        <div className="text-muted small fw-bold text-uppercase mb-1">Attendance</div>
                                        <div className="fw-bold h5 mb-0 text-success">{editingPayroll.present_days} Days</div>
                                    </Col>
                                </Row>
                            </div>

                            <Row className="g-4">
                                <Col xs={12} md={4}>
                                    <Form.Label className="small fw-bold text-muted text-uppercase">Working Days</Form.Label>
                                    <Form.Control className="rounded-3 border-0 bg-light py-2 px-3" type="number" value={editForm.working_days_in_month} onChange={(e) => setEditForm({ ...editForm, working_days_in_month: e.target.value })} />
                                </Col>
                                <Col xs={12} md={4}>
                                    <Form.Label className="small fw-bold text-muted text-uppercase">Overtime Hours</Form.Label>
                                    <Form.Control className="rounded-3 border-0 bg-light py-2 px-3" type="number" value={editForm.overtime_hours} onChange={(e) => setEditForm({ ...editForm, overtime_hours: e.target.value })} />
                                </Col>
                                <Col xs={12} md={4}>
                                    <Form.Label className="small fw-bold text-muted text-uppercase">Overtime Rate (₹/hr)</Form.Label>
                                    <Form.Control className="rounded-3 border-0 bg-light py-2 px-3 text-primary fw-bold" type="number" value={editForm.overtime_rate} onChange={(e) => setEditForm({ ...editForm, overtime_rate: e.target.value })} />
                                </Col>
                                <Col xs={12} md={4}>
                                    <Form.Label className="small fw-bold text-muted text-uppercase">Bonus Amount (₹)</Form.Label>
                                    <Form.Control className="rounded-3 border-0 bg-light py-2 px-3 text-success fw-bold" type="number" value={editForm.bonus} onChange={(e) => setEditForm({ ...editForm, bonus: e.target.value })} />
                                </Col>
                                <Col xs={12} md={4}>
                                    <Form.Label className="small fw-bold text-muted text-uppercase">Expense Claims (₹)</Form.Label>
                                    <div className="rounded-3 border-0 bg-light py-2 px-3 text-success fw-bold">
                                        ₹{(editingPayroll.expense_claims || 0).toLocaleString('en-IN')}
                                    </div>
                                </Col>
                                <Col xs={12} md={4}>
                                    <Form.Label className="small fw-bold text-muted text-uppercase">Adjustment Reason</Form.Label>
                                    <Form.Control className="rounded-3 border-0 bg-light py-2 px-3" type="text" placeholder="e.g. Fine" value={editForm.deduction_reason} onChange={(e) => setEditForm({ ...editForm, deduction_reason: e.target.value })} />
                                </Col>
                                <Col xs={12}>
                                    <Form.Label className="small fw-bold text-muted text-uppercase">Internal Notes</Form.Label>
                                    <Form.Control className="rounded-3 border-0 bg-light py-2 px-3" as="textarea" rows={2} value={editForm.notes} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} />
                                </Col>
                                <Col xs={12}>
                                    <hr className="my-2 opacity-50" />
                                </Col>
                                <Col xs={12}>
                                    <div className="mb-4">
                                        <h6 className="fw-bold mb-3 text-primary d-flex align-items-center gap-2">
                                            <CsLineIcons icon="trend-up" size="18" />
                                            Earnings Components
                                        </h6>
                                        <div className="p-3 rounded-3 bg-light border border-light">
                                            <Row className="g-3">
                                                {editForm.visibleEarnings?.map(key => (
                                                    <Col xs={12} md={6} key={key}>
                                                        <div>
                                                            <Form.Label className="small fw-semibold text-muted text-uppercase mb-1">{getComponentLabel(key)}</Form.Label>
                                                            <InputGroup size="sm" className="shadow-sm rounded-3 overflow-hidden">
                                                                <InputGroup.Text className="bg-white border-0">₹</InputGroup.Text>
                                                                <Form.Control 
                                                                    type="number" 
                                                                    className="border-0 px-2"
                                                                    value={editForm.earned_breakdown?.[key] ?? 0} 
                                                                    onChange={(e) => {
                                                                        const val = parseFloat(e.target.value) || 0;
                                                                        setEditForm(prev => ({
                                                                            ...prev,
                                                                            earned_breakdown: {
                                                                                ...prev.earned_breakdown,
                                                                                [key]: val
                                                                            }
                                                                        }));
                                                                    }}
                                                                />
                                                                <Button 
                                                                    variant="outline-danger" 
                                                                    className="border-0 bg-white text-danger px-2 d-flex align-items-center"
                                                                    onClick={() => removeEarning(key)}
                                                                >
                                                                    <CsLineIcons icon="bin" size="14" />
                                                                </Button>
                                                            </InputGroup>
                                                        </div>
                                                    </Col>
                                                ))}
                                            </Row>
                                            {(() => {
                                                const availableEarnings = ['basic', 'hra', 'conveyance', 'medical', 'special', 'other'].filter(
                                                    key => !editForm.visibleEarnings?.includes(key)
                                                );
                                                return availableEarnings.length > 0 && (
                                                    <div className="mt-3 pt-2 border-top border-separator-light" style={{ width: '240px' }}>
                                                        <Select 
                                                            classNamePrefix="react-select"
                                                            menuPortalTarget={document.body}
                                                            styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                                                            options={availableEarnings.map(key => ({ value: key, label: getComponentLabel(key) }))}
                                                            value={null}
                                                            onChange={(selected) => {
                                                                if (selected) addEarning(selected.value);
                                                            }}
                                                            placeholder="+ Add Earning Component"
                                                        />
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    </div>
                                </Col>
                                <Col xs={12}>
                                    <div className="mb-4">
                                        <h6 className="fw-bold mb-3 text-danger d-flex align-items-center gap-2">
                                            <CsLineIcons icon="trend-down" size="18" />
                                            Deductions Components
                                        </h6>
                                        <div className="p-3 rounded-3 bg-light border border-light">
                                            <Row className="g-3">
                                                {editForm.visibleDeductions?.map(key => (
                                                    <Col xs={12} md={6} key={key}>
                                                        <div>
                                                            <Form.Label className="small fw-semibold text-muted text-uppercase mb-1">{getComponentLabel(key)}</Form.Label>
                                                            <InputGroup size="sm" className="shadow-sm rounded-3 overflow-hidden">
                                                                <InputGroup.Text className="bg-white border-0">₹</InputGroup.Text>
                                                                <Form.Control 
                                                                    type="number" 
                                                                    className="border-0 px-2"
                                                                    value={
                                                                        (key === 'pf' || key === 'esi' || key === 'pt') 
                                                                            ? (editForm.deduction_breakdown?.[key] ?? 0)
                                                                            : (editForm[key] ?? 0)
                                                                    } 
                                                                    onChange={(e) => {
                                                                        const val = parseFloat(e.target.value) || 0;
                                                                        setEditForm(prev => {
                                                                            if (key === 'pf' || key === 'esi' || key === 'pt') {
                                                                                return {
                                                                                    ...prev,
                                                                                    deduction_breakdown: {
                                                                                        ...prev.deduction_breakdown,
                                                                                        [key]: val
                                                                                    }
                                                                                };
                                                                            }
                                                                            return {
                                                                                ...prev,
                                                                                [key]: val
                                                                            };
                                                                        });
                                                                    }}
                                                                />
                                                                <Button 
                                                                    variant="outline-danger" 
                                                                    className="border-0 bg-white text-danger px-2 d-flex align-items-center"
                                                                    onClick={() => removeDeduction(key)}
                                                                >
                                                                    <CsLineIcons icon="bin" size="14" />
                                                                </Button>
                                                            </InputGroup>
                                                        </div>
                                                    </Col>
                                                ))}
                                            </Row>
                                            {(() => {
                                                const availableDeductions = ['pf', 'esi', 'pt', 'advance_deduction', 'tds', 'deductions'].filter(
                                                    key => !editForm.visibleDeductions?.includes(key)
                                                );
                                                return availableDeductions.length > 0 && (
                                                    <div className="mt-3 pt-2 border-top border-separator-light" style={{ width: '240px' }}>
                                                        <Select 
                                                            classNamePrefix="react-select"
                                                            menuPortalTarget={document.body}
                                                            styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                                                            options={availableDeductions.map(key => ({ value: key, label: getComponentLabel(key) }))}
                                                            value={null}
                                                            onChange={(selected) => {
                                                                if (selected) addDeduction(selected.value);
                                                            }}
                                                            placeholder="+ Add Deduction Component"
                                                        />
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    </div>
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
                    <Button className="custom-btn-primary-outline rounded-pill shadow-sm flex-grow-1" style={{ height: '40px' }} onClick={() => setShowEditModal(false)}>Discard Changes</Button>
                    <Button className="custom-btn-primary-outline rounded-pill shadow-sm flex-grow-1" style={{ height: '40px' }} onClick={handleSaveEdit} disabled={isSavingEdit}>
                        {isSavingEdit ? <Spinner size="sm" /> : <><CsLineIcons icon="save" className="me-2" size="18" /> Commit Updates</>}
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
                        <div className="glass-card bg-light border-0 p-3 mt-3">
                            <div className="fw-bold text-danger">₹{deletingPayroll.net_salary?.toLocaleString('en-IN')}</div>
                            <small className="text-muted">Status: {deletingPayroll.status.toUpperCase()}</small>
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer className="border-0 p-4 pt-0 d-flex gap-3">
                    <Button className="custom-btn-primary-outline rounded-pill shadow-sm flex-grow-1" style={{ height: '40px' }} onClick={() => setShowDeleteModal(false)}>Keep Record</Button>
                    <Button variant="outline-danger" className="rounded-pill shadow-sm flex-grow-1 d-flex align-items-center justify-content-center gap-2" style={{ height: '40px', fontWeight: '600' }} onClick={handleDelete} disabled={isDeleting}>
                        {isDeleting ? <Spinner size="sm" /> : <><CsLineIcons icon="bin" size="18" /> Confirm Delete</>}
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
}