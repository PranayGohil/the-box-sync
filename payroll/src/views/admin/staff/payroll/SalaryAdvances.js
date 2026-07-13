import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Table, Badge, Modal, Form, Spinner, Pagination } from 'react-bootstrap';
import { toast } from 'react-toastify';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import Select from 'react-select';
import { getSalaryAdvances, addSalaryAdvance, updateSalaryAdvance } from 'api/salaryAdvance';
import { getStaffList } from 'api/staff';
import { format } from 'date-fns';

const SalaryAdvances = () => {
    const title = 'Salary Advances & Loans';
    const description = 'Track staff advances and configure automated payroll recoveries.';
    const breadcrumbs = [
        { to: '', text: 'Home' },
        { to: 'finance/expenses', text: 'Finance' },
        { to: 'finance/advances', text: 'Salary Advances' }
    ];

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [advances, setAdvances] = useState([]);
    const [staffList, setStaffList] = useState([]);
    const [statusFilter, setStatusFilter] = useState('all');

    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    useEffect(() => {
        setCurrentPage(1);
    }, [statusFilter, advances]);

    const [showModal, setShowModal] = useState(false);
    
    const [form, setForm] = useState({
        staff_id: null,
        amount: '',
        given_date: new Date().toISOString().split('T')[0],
        reason: '',
        recovery_mode: 'single',
        installments: 1,
        notes: ''
    });

    const statusOptions = [
        { value: 'all', label: 'All Statuses' },
        { value: 'active', label: 'Active (Recovering)' },
        { value: 'fully_recovered', label: 'Fully Recovered' }
    ];

    const recoveryModeOptions = [
        { value: 'single', label: 'Single Deduction (Next Payroll)' },
        { value: 'installments', label: 'Monthly Installments (EMI)' }
    ];

    const fetchData = async () => {
        try {
            setLoading(true);
            const [advRes, staffRes] = await Promise.all([
                getSalaryAdvances(statusFilter),
                getStaffList()
            ]);
            
            if (advRes.success) setAdvances(advRes.data || []);
            if (staffRes.success) setStaffList(staffRes.data || []);
        } catch (err) {
            toast.error("Failed to load data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line
    }, [statusFilter]);

    const pageCount = Math.ceil(advances.length / pageSize);
    const indexOfLastItem = currentPage * pageSize;
    const indexOfFirstItem = indexOfLastItem - pageSize;
    const currentAdvances = advances.slice(indexOfFirstItem, indexOfLastItem);

    const handleShowModal = () => {
        setForm({
            staff_id: null,
            amount: '',
            given_date: new Date().toISOString().split('T')[0],
            reason: '',
            recovery_mode: 'single',
            installments: 1,
            notes: ''
        });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.staff_id) { toast.warning("Please select a staff member"); return; }
        if (form.amount <= 0) { toast.warning("Amount must be greater than zero"); return; }

        setSubmitting(true);
        try {
            const payload = { ...form, staff_id: form.staff_id.value };
            const res = await addSalaryAdvance(payload);
            if (res.success) {
                toast.success('Advance recorded successfully');
                setShowModal(false);
                fetchData();
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to save advance');
        } finally {
            setSubmitting(false);
        }
    };

    const handleCancelAdvance = async (id) => {
        if (!window.confirm("Are you sure you want to cancel this advance? Payroll deductions will stop.")) return;
        try {
            const res = await updateSalaryAdvance(id, { status: 'cancelled' });
            if (res.success) {
                toast.success("Advance cancelled");
                fetchData();
            }
        } catch (err) {
            toast.error("Failed to cancel advance");
        }
    };

    const staffOptions = staffList.map(s => ({
        value: s._id,
        label: `${s.f_name} ${s.l_name} (${s.staff_id}) - ${s.position}`
    }));

    const getStatusBadge = (status) => {
        switch (status) {
            case 'active': 
                return <Badge bg="none" className="status-badge" style={{ backgroundColor: 'rgba(30, 168, 231, 0.08)', color: '#1ea8e7', border: '1px solid rgba(30, 168, 231, 0.15)' }}>Active</Badge>;
            case 'fully_recovered': 
                return <Badge bg="none" className="status-badge" style={{ backgroundColor: 'rgba(16, 185, 129, 0.08)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.15)' }}>Fully Recovered</Badge>;
            case 'cancelled': 
                return <Badge bg="none" className="status-badge" style={{ backgroundColor: 'rgba(100, 116, 139, 0.08)', color: '#64748b', border: '1px solid rgba(100, 116, 139, 0.15)' }}>Cancelled</Badge>;
            default: 
                return <Badge bg="light" text="dark" className="status-badge">{status}</Badge>;
        }
    };

    const customStyles = `
      .glass-card {
        background: #ffffff !important;
        border: 1px solid #f0f0f0 !important;
        border-radius: 1.5rem !important;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.04) !important;
        transition: all 0.3s ease;
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
      .custom-btn-primary-outline:hover svg {
        color: #ffffff !important;
      }
      .custom-btn-solid {
        background-color: #1ea8e7 !important;
        border: 1px solid #1ea8e7 !important;
        color: #fff !important;
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
        font-size: 0.82rem !important;
        padding: 0.4rem 1.2rem !important;
      }
      .custom-btn-danger-outline:hover {
        background-color: #ef4444 !important;
        color: #fff !important;
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2) !important;
      }

      .advance-filter-select-container {
        width: 220px !important;
      }

      /* React Select same design as Job Position from screenshot */
      .react-select-premium {
        font-weight: 600 !important;
      }
      .react-select-premium .react-select__control {
        border-radius: 10px !important;
        border: 1px solid #dee2e6 !important;
        background-color: #ffffff !important;
        height: 40px !important;
        min-height: 40px !important;
        cursor: pointer !important;
        transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out !important;
        box-shadow: none !important;
      }
      .react-select-premium .react-select__control:hover {
        border-color: #cbd5e1 !important;
      }
      .react-select-premium .react-select__control--is-focused,
      .react-select-premium .react-select__control--menu-is-open {
        border-color: #1ea8e7 !important;
        box-shadow: 0 0 0 4px rgba(30, 168, 231, 0.1) !important;
      }
      .react-select-premium .react-select__single-value {
        color: #334155 !important;
        font-size: 0.9rem !important;
        padding-left: 0.25rem !important;
      }
      .react-select-premium .react-select__placeholder {
        color: #94a3b8 !important;
        font-size: 0.9rem !important;
        padding-left: 0.25rem !important;
      }
      .react-select-premium .react-select__indicator-separator {
        display: none !important;
      }
      .react-select-premium .react-select__dropdown-indicator {
        color: #94a3b8 !important;
        padding-right: 0.75rem !important;
        transition: color 0.15s ease !important;
      }
      .react-select-premium .react-select__dropdown-indicator:hover {
        color: #64748b !important;
      }
      .react-select-premium .react-select__menu {
        border-radius: 10px !important;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08) !important;
        border: 1px solid #1ea8e7 !important;
        overflow: hidden !important;
        z-index: 9999 !important;
        margin-top: 5px !important;
        background-color: #ffffff !important;
      }
      .react-select-premium .react-select__menu-list {
        padding: 4px !important;
      }
      .react-select-premium .react-select__option {
        font-size: 0.9rem !important;
        font-weight: 600 !important;
        color: #475569 !important;
        padding: 0.5rem 0.75rem !important;
        border-radius: 6px !important;
        cursor: pointer !important;
        transition: all 0.15s ease !important;
        background-color: transparent !important;
      }
      .react-select-premium .react-select__option--is-focused {
        background-color: #f1f5f9 !important;
        color: #1ea8e7 !important;
      }
      .react-select-premium .react-select__option--is-selected {
        background-color: #f1f5f9 !important;
        color: #1ea8e7 !important;
      }

      .status-badge {
        padding: 0.4rem 0.85rem !important;
        border-radius: 50px !important;
        font-weight: 700 !important;
        font-size: 0.75rem !important;
        letter-spacing: 0.04em !important;
        text-transform: uppercase !important;
        display: inline-flex !important;
        align-items: center !}
      
      /* Premium Tables */
      table.react-table.rows {
        border-collapse: separate !important;
        border-spacing: 0 12px !important;
        width: 100% !important;
        background-color: transparent !important;
      }
      .react-table th {
        background: transparent !important;
        color: #64748b !important;
        font-weight: 700 !important;
        text-transform: uppercase !important;
        font-size: 0.72rem !important;
        letter-spacing: 0.08em !important;
        padding: 0.9rem 1.5rem !important;
        border: none !important;
      }
      .react-table tbody tr {
        transition: all 0.2s ease-in-out !important;
        background-color: transparent !important;
      }
      .react-table tbody tr:hover td {
        background-color: rgba(30, 168, 231, 0.015) !important;
      }
      .react-table td {
        padding: 1.1rem 1.5rem !important;
        vertical-align: middle !important;
        border-top: 1px solid #edf2f7 !important;
        border-bottom: 1px solid #edf2f7 !important;
        background-color: #ffffff !important;
      }
      .react-table td:first-child {
        border-top-left-radius: 15px !important;
        border-bottom-left-radius: 15px !important;
        border-left: 1px solid #edf2f7 !important;
      }
      .react-table td:last-child {
        border-top-right-radius: 15px !important;
        border-bottom-right-radius: 15px !important;
        border-right: 1px solid #edf2f7 !important;
      }

      .avatar-circle {
        background: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%) !important;
        color: #0369a1 !important;
        font-weight: 700 !important;
        border: 2px solid #f0f9ff !important;
        box-shadow: 0 4px 10px rgba(14, 165, 233, 0.08) !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        width: 42px !important;
        height: 42px !important;
        border-radius: 50% !important;
        font-size: 0.9rem !important;
        transition: all 0.2s ease-in-out !important;
      }

      /* Premium Mobile Roster Cards styling to minimize vertical scroll and look gorgeous */
      .mobile-advance-card {
        background: #ffffff !important;
        border: 1px solid #f1f5f9 !important;
        border-radius: 1.25rem !important;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.02) !important;
        transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1) !important;
      }
      .mobile-advance-card:hover {
        border-color: rgba(30, 168, 231, 0.2) !important;
        box-shadow: 0 8px 30px rgba(30, 168, 231, 0.08) !important;
      }
      .mobile-avatar {
        width: 2.5rem !important;
        height: 2.5rem !important;
        font-size: 0.95rem;
        font-weight: 800;
        background: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%) !important;
        color: #0369a1 !important;
        border: 2px solid #f0f9ff !important;
        box-shadow: 0 3px 8px rgba(14, 165, 233, 0.08) !important;
      }
      
      .mobile-advance-grid {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        gap: 0.4rem;
        background: #f8fafc;
        padding: 0.6rem 0.8rem;
        border-radius: 0.75rem;
      }
      .grid-box {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
      }
      .grid-label {
        font-size: 0.6rem;
        font-weight: 700;
        color: #94a3b8;
        letter-spacing: 0.05em;
        margin-bottom: 0.15rem;
        text-transform: uppercase;
      }
      .grid-val {
        font-size: 0.8rem;
        font-weight: 700;
      }

      /* Premium Modal Controls styling */
      .advance-modal .modal-content {
        border-radius: 1.5rem !important;
        border: none !important;
        box-shadow: 0 20px 50px rgba(0, 0, 0, 0.1) !important;
        overflow: hidden;
      }
      .advance-modal .modal-header {
        border-bottom: 1px solid #edf2f7 !important;
        padding: 1.5rem 2rem !important;
      }
      .advance-modal .modal-title {
        font-weight: 800 !important;
        color: #1ea8e7 !important;
        letter-spacing: -0.02em !important;
      }
      .advance-modal .modal-body {
        padding: 2rem !important;
      }
      .advance-modal .modal-footer {
        border-top: 1px solid #edf2f7 !important;
        padding: 1.25rem 2rem !important;
      }
      .advance-input {
        border-radius: 12px !important;
        padding: 0.65rem 1.25rem !important;
        border: 1.5px solid #edf2f7 !important;
        background-color: #f8fafc !important;
        font-weight: 600 !important;
        color: #334155 !important;
        transition: all 0.25s ease-in-out !important;
      }
      .advance-input:focus {
        border-color: #1ea8e7 !important;
        background-color: #ffffff !important;
        box-shadow: 0 0 0 3px rgba(30, 168, 231, 0.15) !important;
        outline: none !important;
      }

      @media (max-width: 767.98px) {
        .page-title-container {
          margin-top: 1rem !important;
        }
        .advance-filter-select-container {
          width: 100% !important;
        }
      }
    `;

    return (
        <div className="container-fluid pb-5">
            <style>{customStyles}</style>
            <HtmlHead title={title} description={description} />
            
            {/* Header Title & Controls aligned beautifully in one row */}
            <div className="page-title-container mb-4">
                <Row className="g-3 align-items-center">
                    <Col xs="12" md="6">
                        <h1 className="mb-0 pb-0 display-4 fw-bold" style={{ color: '#1ea8e7' }}>
                            {title}
                        </h1>
                        <BreadcrumbList items={breadcrumbs} />
                    </Col>
                    
                    <Col xs="12" md="6" className="d-flex flex-wrap justify-content-md-end align-items-center gap-3">
                        <Select
                            classNamePrefix="react-select"
                            className="advance-filter-select-container react-select-premium shadow-sm"
                            options={statusOptions}
                            value={statusOptions.find(opt => opt.value === statusFilter)}
                            onChange={(selected) => setStatusFilter(selected ? selected.value : 'all')}
                            placeholder="All Statuses"
                            isSearchable={false}
                        />
                        <Button 
                            onClick={handleShowModal} 
                            className="px-4 rounded-pill d-flex align-items-center custom-btn-primary-outline shadow-sm"
                            style={{ height: '40px' }}
                        >
                            <CsLineIcons icon="plus" className="me-2" size="18" stroke="currentColor" />
                            <span>Give Advance</span>
                        </Button>
                    </Col>
                </Row>
            </div>

            {loading ? (
                <div className="text-center py-5">
                    <Spinner animation="border" style={{ color: '#1ea8e7' }} />
                </div>
            ) : advances.length === 0 ? (
                <Card className="glass-card text-center py-5 border-0 shadow-sm">
                    <Card.Body className="text-muted py-5">
                        <CsLineIcons icon="tag" size="48" className="text-muted opacity-50 mb-3" />
                        <h5 className="fw-bold mt-2">No Salary Advances Found</h5>
                        <p className="small mb-0">Click 'Give Advance' to issue salary advance or loan record for team members.</p>
                    </Card.Body>
                </Card>
            ) : (
                <>
                    {/* Desktop View (Table layout) */}
                    <div className="d-none d-md-block">
                        <Table hover className="react-table rows mb-0" style={{ backgroundColor: 'transparent' }}>
                            <thead>
                                <tr>
                                    <th className="ps-4">Staff Name</th>
                                    <th>Given Date</th>
                                    <th>Total Amount</th>
                                    <th>Recovery Mode</th>
                                    <th>Recovered So Far</th>
                                    <th>Status</th>
                                    <th className="text-end pe-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentAdvances.map(adv => (
                                    <tr key={adv._id}>
                                        <td className="ps-4 align-middle">
                                            <div className="d-flex align-items-center gap-3">
                                                <div className="avatar-circle">
                                                    {adv.staff_id?.f_name?.[0]}
                                                    {adv.staff_id?.l_name?.[0]}
                                                </div>
                                                <div>
                                                    <div className="fw-bold text-dark">{adv.staff_id?.f_name} {adv.staff_id?.l_name}</div>
                                                    <div className="text-muted small">{adv.staff_id?.position}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="align-middle fw-medium">
                                            {adv.given_date ? format(new Date(adv.given_date), 'dd/MM/yyyy') : '—'}
                                        </td>
                                        <td className="align-middle fw-bold text-danger">
                                            ₹{adv.amount}
                                        </td>
                                        <td className="align-middle">
                                            <div className="text-capitalize fw-bold text-dark">{adv.recovery_mode}</div>
                                            {adv.recovery_mode === 'installments' && (
                                                <div className="small text-muted fw-medium">{adv.installments} EMIs of ₹{adv.installment_amount?.toFixed(2)}</div>
                                            )}
                                        </td>
                                        <td className="align-middle">
                                            <span className="text-success fw-bold">₹{adv.recovered_amount}</span>
                                            <div className="small text-muted fw-medium">Bal: ₹{adv.amount - adv.recovered_amount}</div>
                                        </td>
                                        <td className="align-middle">
                                            {getStatusBadge(adv.status)}
                                        </td>
                                        <td className="text-end pe-4 align-middle">
                                            {adv.status === 'active' && (
                                                <Button 
                                                    variant="none"
                                                    className="custom-btn-danger-outline" 
                                                    onClick={() => handleCancelAdvance(adv._id)}
                                                >
                                                    Cancel Deds
                                                </Button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </div>

                    {/* Mobile View (Premium Space-Saving Card Grid) */}
                    <div className="d-md-none">
                        <Row className="g-3">
                            {currentAdvances.map(adv => (
                                <Col key={adv._id} xs="12">
                                    <Card className="mobile-advance-card border-0 shadow-sm">
                                        <Card.Body className="p-3">
                                            {/* Top Section: Avatar, Name, Given Date, Status */}
                                            <div className="d-flex align-items-center justify-content-between mb-3">
                                                <div className="d-flex align-items-center gap-2">
                                                    <div className="mobile-avatar rounded-circle d-flex align-items-center justify-content-center text-primary fw-bold bg-soft-primary">
                                                        {adv.staff_id?.f_name?.[0]}{adv.staff_id?.l_name?.[0]}
                                                    </div>
                                                    <div>
                                                        <div className="fw-bold text-dark text-truncate" style={{ maxWidth: '140px' }}>
                                                            {adv.staff_id?.f_name} {adv.staff_id?.l_name}
                                                        </div>
                                                        <div className="small text-muted" style={{ fontSize: '0.7rem' }}>
                                                            {adv.given_date ? format(new Date(adv.given_date), 'dd/MM/yyyy') : '—'}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div>
                                                    {getStatusBadge(adv.status)}
                                                </div>
                                            </div>

                                            {/* Compact 3-Column Stats Grid */}
                                            <div className="mobile-advance-grid mb-3">
                                                <div className="grid-box border-end" style={{ borderColor: '#f1f5f9' }}>
                                                    <span className="grid-label">Total</span>
                                                    <span className="grid-val text-danger">₹{adv.amount}</span>
                                                </div>
                                                <div className="grid-box border-end" style={{ borderColor: '#f1f5f9' }}>
                                                    <span className="grid-label">Recovery</span>
                                                    <span className="grid-val text-dark text-truncate text-capitalize" style={{ maxWidth: '80px', fontSize: '0.75rem' }}>
                                                        {adv.recovery_mode}
                                                        {adv.recovery_mode === 'installments' && ` (${adv.installments} EMIs)`}
                                                    </span>
                                                </div>
                                                <div className="grid-box">
                                                    <span className="grid-label">Recovered</span>
                                                    <span className="grid-val text-success">₹{adv.recovered_amount}</span>
                                                    <span className="text-muted" style={{ fontSize: '0.6rem' }}>Bal: ₹{adv.amount - adv.recovered_amount}</span>
                                                </div>
                                            </div>

                                            {/* Actions Footer inside Card */}
                                            {adv.status === 'active' && (
                                                <div className="d-flex justify-content-end pt-1">
                                                    <Button 
                                                        variant="none"
                                                        className="custom-btn-danger-outline py-1 px-3" 
                                                        style={{ fontSize: '0.75rem', borderRadius: '50px' }}
                                                        onClick={() => handleCancelAdvance(adv._id)}
                                                    >
                                                        Cancel Deds
                                                    </Button>
                                                </div>
                                            )}
                                        </Card.Body>
                                    </Card>
                                </Col>
                            ))}
                        </Row>
                    </div>

                    {/* Advances Pagination Controls */}
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
                                Showing {advances.length > 0 ? indexOfFirstItem + 1 : 0} to {Math.min(indexOfLastItem, advances.length)} of {advances.length} advances
                            </span>
                        </div>
                        {pageCount > 1 && (
                            <Pagination className="mb-0">
                                <Pagination.Prev disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} />
                                {Array.from({ length: pageCount }, (_, i) => i + 1).map(pageNo => (
                                    <Pagination.Item key={pageNo} active={pageNo === currentPage} onClick={() => setCurrentPage(pageNo)}>
                                        {pageNo}
                                    </Pagination.Item>
                                ))}
                                <Pagination.Next disabled={currentPage === pageCount} onClick={() => setCurrentPage(p => Math.min(p + 1, pageCount))} />
                            </Pagination>
                        )}
                    </div>
                </>
            )}

            {/* Give Salary Advance Modal */}
            <Modal 
                show={showModal} 
                onHide={() => !submitting && setShowModal(false)} 
                centered 
                size="lg" 
                className="advance-modal"
            >
                <Form onSubmit={handleSubmit}>
                    <Modal.Header closeButton>
                        <Modal.Title>Give Salary Advance</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Row className="g-3">
                            <Col md="12" className="mb-2">
                                <Form.Group>
                                    <Form.Label className="small fw-bold text-muted text-uppercase ms-1 mb-2">Select Staff Member <span className="text-danger">*</span></Form.Label>
                                    <Select 
                                        options={staffOptions} 
                                        value={form.staff_id}
                                        onChange={v => setForm({...form, staff_id: v})}
                                        placeholder="Search by name or ID..."
                                        isSearchable
                                        classNamePrefix="react-select"
                                        className="react-select-premium shadow-sm"
                                    />
                                </Form.Group>
                            </Col>
                            <Col md="6" className="mb-2">
                                <Form.Group>
                                    <Form.Label className="small fw-bold text-muted text-uppercase ms-1 mb-2">Advance Amount (₹) <span className="text-danger">*</span></Form.Label>
                                    <Form.Control 
                                        type="number" 
                                        required 
                                        min="1" 
                                        value={form.amount} 
                                        onChange={e => setForm({...form, amount: e.target.value})} 
                                        className="advance-input"
                                        placeholder="e.g. 5000"
                                    />
                                </Form.Group>
                            </Col>
                            <Col md="6" className="mb-2">
                                <Form.Group>
                                    <Form.Label className="small fw-bold text-muted text-uppercase ms-1 mb-2">Date Given <span className="text-danger">*</span></Form.Label>
                                    <Form.Control 
                                        type="date" 
                                        required 
                                        value={form.given_date} 
                                        onChange={e => setForm({...form, given_date: e.target.value})} 
                                        className="advance-input"
                                    />
                                </Form.Group>
                            </Col>
                            <Col md="12" className="mb-2">
                                <Form.Group>
                                    <Form.Label className="small fw-bold text-muted text-uppercase ms-1 mb-2">Reason</Form.Label>
                                    <Form.Control 
                                        placeholder="e.g. Medical emergency, Festival advance" 
                                        value={form.reason} 
                                        onChange={e => setForm({...form, reason: e.target.value})} 
                                        className="advance-input"
                                    />
                                </Form.Group>
                            </Col>

                            <Col md="12" className="my-2"><hr className="opacity-25" /></Col>

                            <Col md="6" className="mb-2">
                                <Form.Group>
                                    <Form.Label className="small fw-bold text-muted text-uppercase ms-1 mb-2">Payroll Recovery Mode</Form.Label>
                                    <Select 
                                        options={recoveryModeOptions} 
                                        value={recoveryModeOptions.find(opt => opt.value === form.recovery_mode)}
                                        onChange={selected => setForm({...form, recovery_mode: selected ? selected.value : 'single'})}
                                        placeholder="Select recovery mode..."
                                        isSearchable={false}
                                        classNamePrefix="react-select"
                                        className="react-select-premium shadow-sm"
                                    />
                                </Form.Group>
                            </Col>
                            
                            {form.recovery_mode === 'installments' && (
                                <Col md="6" className="mb-2">
                                    <Form.Group>
                                        <Form.Label className="small fw-bold text-muted text-uppercase ms-1 mb-2">Number of Installments (Months)</Form.Label>
                                        <Form.Control 
                                            type="number" 
                                            required 
                                            min="2" 
                                            value={form.installments} 
                                            onChange={e => setForm({...form, installments: e.target.value})} 
                                            className="advance-input text-dark"
                                        />
                                        {form.amount && form.installments > 0 && (
                                            <div className="mt-2 text-success fw-bold small ms-1">
                                                Estimated EMI: ₹{(form.amount / form.installments).toFixed(2)} / month
                                            </div>
                                        )}
                                    </Form.Group>
                                </Col>
                            )}
                        </Row>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button 
                            variant="none"
                            className="custom-btn-primary-outline border-0 px-4 me-2 text-muted" 
                            onClick={() => setShowModal(false)} 
                            disabled={submitting}
                        >
                            Cancel
                        </Button>
                        <Button 
                            variant="none"
                            className="custom-btn-primary-outline px-4" 
                            type="submit" 
                            disabled={submitting}
                        >
                            {submitting ? <Spinner size="sm" animation="border" /> : 'Confirm Advance'}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </div>
    );
};

export default SalaryAdvances;
