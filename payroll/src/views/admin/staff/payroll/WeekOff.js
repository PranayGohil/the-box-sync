import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { Row, Col, Card, Button, Form, Spinner, Badge, Modal } from 'react-bootstrap';
import { toast } from 'react-toastify';
import axios from 'axios';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import Select from 'react-select';
import { getPayrollConfig, updatePayrollConfig } from 'api/payrollConfig';

const WEEK_DAYS = [
    { value: 0, label: 'Sunday' },
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
    { value: 6, label: 'Saturday' },
];

const dayNameToVal = {
    Sunday: 0,
    Monday: 1,
    Tuesday: 2,
    Wednesday: 3,
    Thursday: 4,
    Friday: 5,
    Saturday: 6,
};

export default function WeekOff({ hideHeader = false }) {
    const title = 'Week Off';
    const description = 'Configure weekly off rules for organization branches.';
    const breadcrumbs = [
        { to: '', text: 'Home' },
        { to: 'staff/view', text: 'Staff' },
        { to: 'staff/week-off', text: 'Week Off' }
    ];

    const history = useHistory();
    const [loading, setLoading] = useState(true);

    const [branches, setBranches] = useState([]);
    const [selectedBranch, setSelectedBranch] = useState(null);
    const [allConfigs, setAllConfigs] = useState([]);
    const [savingRules, setSavingRules] = useState(false);
    const [fullConfig, setFullConfig] = useState(null);
    const [orgRules, setOrgRules] = useState({
        leave_year_start: 'january',
        weekly_off_days: [0]
    });
    const [globalWeeklyOffs, setGlobalWeeklyOffs] = useState([
        { day: 'Sunday', type: 'all_weeks', weeks: [] }
    ]);

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [configToDelete, setConfigToDelete] = useState(null);
    const [deletingConfig, setDeletingConfig] = useState(false);

    const authHeader = () => ({
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });

    const fetchBranches = async () => {
        try {
            const res = await axios.get(`${process.env.REACT_APP_API}/branch/all`, authHeader());
            if (res.data && res.data.success) {
                setBranches(res.data.data || []);
            }
        } catch (err) {
            console.error('Failed to fetch branches', err);
        }
    };

    const fetchAllConfigs = async () => {
        try {
            const res = await axios.get(`${process.env.REACT_APP_API}/payroll-config?all=true`, authHeader());
            if (res.data && res.data.success) {
                setAllConfigs(res.data.data || []);
            }
        } catch (err) {
            console.error('Failed to fetch all branch configs', err);
        }
    };

    const fetchPayrollConfig = async (branchId = null) => {
        setLoading(true);
        try {
            const res = await getPayrollConfig(branchId);
            const configObj = res?.data || res;
            if (configObj) {
                if (Array.isArray(configObj.global_weekly_offs)) {
                    setGlobalWeeklyOffs(configObj.global_weekly_offs);
                } else if (Array.isArray(configObj.org_rules?.weekly_off_days)) {
                    const mapped = configObj.org_rules.weekly_off_days.map(d => {
                        const dayObj = WEEK_DAYS.find(wd => wd.value === d);
                        return { day: dayObj ? dayObj.label : 'Sunday', type: 'all_weeks', weeks: [] };
                    });
                    setGlobalWeeklyOffs(mapped);
                } else {
                    setGlobalWeeklyOffs([]);
                }
                if (configObj.org_rules) {
                    setOrgRules(configObj.org_rules);
                }
                setFullConfig(configObj);
            }
        } catch (err) {
            console.error('Failed to load payroll rules', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBranches();
        fetchAllConfigs();
        fetchPayrollConfig();
    }, []);

    const handleAddCustomWeeklyOff = () => {
        setGlobalWeeklyOffs(prev => [...prev, { day: 'Sunday', type: 'all_weeks', weeks: [] }]);
    };

    const handleRemoveCustomWeeklyOff = (idx) => {
        setGlobalWeeklyOffs(prev => prev.filter((_, i) => i !== idx));
    };

    const handleUpdateCustomWeeklyOff = (idx, field, val) => {
        setGlobalWeeklyOffs(prev => {
            const updated = [...prev];
            updated[idx] = { ...updated[idx], [field]: val };
            return updated;
        });
    };

    const toggleSpecificCustomWeek = (idx, weekNum) => {
        setGlobalWeeklyOffs(prev => {
            const updated = [...prev];
            const currentWeeks = updated[idx].weeks ? [...updated[idx].weeks] : [];
            let newWeeks = [];
            if (currentWeeks.includes(weekNum)) {
                newWeeks = currentWeeks.filter(w => w !== weekNum);
            } else {
                newWeeks = [...currentWeeks, weekNum];
            }
            updated[idx] = { ...updated[idx], weeks: newWeeks };
            return updated;
        });
    };

    const handleSaveRules = async () => {
        setSavingRules(true);
        try {
            const branchId = selectedBranch?.value || null;
            const calculatedDays = Array.from(
                new Set(globalWeeklyOffs.map(woff => dayNameToVal[woff.day]).filter(v => v !== undefined))
            );

            const updatedConfig = {
                ...(fullConfig || {}),
                global_weekly_offs: globalWeeklyOffs,
                org_rules: {
                    ...(orgRules || {}),
                    weekly_off_days: calculatedDays
                }
            };
            const res = await updatePayrollConfig(updatedConfig, branchId);
            if (res && (res.success || res.data)) {
                toast.success('Weekly off rules saved successfully');
                await fetchAllConfigs();
                await fetchPayrollConfig(branchId);
            } else {
                toast.success('Weekly off rules saved');
                await fetchAllConfigs();
                await fetchPayrollConfig(branchId);
            }
        } catch (err) {
            console.error('Failed to save rules', err);
            toast.error('Failed to save rules');
        } finally {
            setSavingRules(false);
        }
    };

    const promptDeleteConfig = (config, e) => {
        if (e) e.stopPropagation();
        setConfigToDelete(config);
        setShowDeleteModal(true);
    };

    const handleConfirmDeleteConfig = async () => {
        if (!configToDelete) return;
        setDeletingConfig(true);
        try {
            const rawBranchId = configToDelete.branch_id;
            const branchId = typeof rawBranchId === 'object' && rawBranchId ? rawBranchId._id : (rawBranchId || null);
            
            const updatedConfig = {
                ...(configToDelete || {}),
                global_weekly_offs: [],
                org_rules: {
                    ...(configToDelete.org_rules || {}),
                    weekly_off_days: []
                }
            };
            const res = await updatePayrollConfig(updatedConfig, branchId);
            if (res && (res.success || res.data)) {
                toast.success('Weekly off configuration deleted successfully');
                const currentBranchId = selectedBranch?.value || null;
                if (currentBranchId === branchId) {
                    setGlobalWeeklyOffs([]);
                }
                await fetchAllConfigs();
                await fetchPayrollConfig(currentBranchId);
            }
        } catch (err) {
            console.error('Failed to delete weekly off config', err);
            toast.error('Failed to delete weekly off config');
        } finally {
            setDeletingConfig(false);
            setShowDeleteModal(false);
            setConfigToDelete(null);
        }
    };

    return (
        <div className={hideHeader ? "w-100" : "container-fluid px-lg-4 px-xl-5 pb-5"}>
            {!hideHeader && <HtmlHead title={title} description={description} />}
            
            {!hideHeader && (
                <div className="page-title-container mb-4">
                    <Row className="g-3 align-items-center">
                        <Col xs="12" lg="4" xl="4">
                            <h1 className="mb-0 pb-0 display-4 fw-bold" style={{ color: '#1ea8e7', whiteSpace: 'nowrap' }}>
                                {title}
                            </h1>
                            <BreadcrumbList items={breadcrumbs} />
                        </Col>
                        <Col xs="12" lg="8" xl="8" className="d-flex flex-wrap flex-lg-nowrap justify-content-lg-end align-items-center gap-2">
                            <Button
                                variant="outline-primary"
                                onClick={() => history.push('/staff/leave-policy')}
                                className="px-3 py-2 rounded-pill fw-bold d-flex align-items-center justify-content-center gap-2 shadow-sm flex-grow-1 flex-sm-grow-0 flex-shrink-0"
                                style={{ height: '38px', fontSize: '0.875rem', whiteSpace: 'nowrap' }}
                            >
                                <CsLineIcons icon="book-open" size="16" />
                                <span>Leave Policy</span>
                            </Button>
                            <Button
                                variant="outline-primary"
                                onClick={() => history.push('/staff/holidays')}
                                className="px-3 py-2 rounded-pill fw-bold d-flex align-items-center justify-content-center gap-2 shadow-sm flex-grow-1 flex-sm-grow-0 flex-shrink-0"
                                style={{ height: '38px', fontSize: '0.875rem', whiteSpace: 'nowrap' }}
                            >
                                <CsLineIcons icon="calendar" size="16" />
                                <span>Holidays</span>
                            </Button>
                            <Button 
                                variant="outline-primary"
                                onClick={handleSaveRules}
                                disabled={savingRules}
                                className="px-3 py-2 rounded-pill fw-bold d-flex align-items-center justify-content-center gap-2 shadow-sm flex-grow-1 flex-sm-grow-0 flex-shrink-0"
                                style={{ height: '38px', fontSize: '0.875rem', whiteSpace: 'nowrap' }}
                            >
                                {savingRules ? <Spinner size="sm" animation="border" /> : <CsLineIcons icon="save" size="16" />}
                                <span>Save Rules</span>
                            </Button>
                        </Col>
                    </Row>
                </div>
            )}

            <Card className="glass-card border-0 mb-4 shadow-sm">
                <Card.Header className="bg-transparent border-0 p-4 pb-0">
                    <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
                        <Card.Title className="fw-bold mb-0 d-flex align-items-center gap-2" style={{ color: '#1ea8e7' }}>
                            <CsLineIcons icon="clock" size="20" />
                            Custom Weekly Offs Configuration
                        </Card.Title>
                        <div className="d-flex align-items-center gap-2 flex-wrap ms-auto">
                            {branches.length > 0 && (
                                <div style={{ minWidth: '220px' }}>
                                    <Select
                                        classNamePrefix="react-select"
                                        options={[
                                            { value: null, label: 'Global / All Branches' },
                                            ...branches.map(b => ({ value: b._id, label: `${b.name} Branch` }))
                                        ]}
                                        value={selectedBranch || { value: null, label: 'Global / All Branches' }}
                                        onChange={(selected) => {
                                            setSelectedBranch(selected);
                                            fetchPayrollConfig(selected ? selected.value : null);
                                        }}
                                        placeholder="Select Branch"
                                        className="react-select-premium shadow-sm"
                                        menuPortalTarget={document.body}
                                        styles={{
                                            control: (base) => ({ ...base, borderRadius: '20px', minHeight: '38px' }),
                                            menuPortal: (base) => ({ ...base, zIndex: 9999 })
                                        }}
                                    />
                                </div>
                            )}
                            <Button
                                variant="primary"
                                onClick={handleAddCustomWeeklyOff}
                                className="px-3 py-2 rounded-pill fw-bold d-flex align-items-center justify-content-center gap-1 shadow-sm"
                                style={{ height: '38px', fontSize: '0.875rem', whiteSpace: 'nowrap' }}
                            >
                                <CsLineIcons icon="plus" size="16" />
                                <span>Add Day</span>
                            </Button>
                            {globalWeeklyOffs.length > 0 && (
                                <Button
                                    variant="outline-danger"
                                    onClick={() => promptDeleteConfig(fullConfig || { branch_id: selectedBranch?.value || null })}
                                    className="px-3 py-2 rounded-pill fw-bold d-flex align-items-center justify-content-center gap-1 shadow-sm"
                                    style={{ height: '38px', fontSize: '0.875rem', whiteSpace: 'nowrap' }}
                                >
                                    <CsLineIcons icon="bin" size="16" />
                                    <span>Delete All</span>
                                </Button>
                            )}
                        </div>
                    </div>
                </Card.Header>
                <Card.Body className="p-4">
                    {loading ? (
                        <div className="text-center py-5">
                            <Spinner animation="border" style={{ color: '#1ea8e7' }} />
                        </div>
                    ) : (
                        <Row className="g-4">
                            <Col xs="12">
                                <Row className="g-3">
                                    {globalWeeklyOffs.map((woff, idx) => (
                                        <Col xs="12" md="6" key={idx}>
                                            <div className="p-3 border rounded-3 bg-white shadow-sm position-relative">
                                                <Button
                                                    variant="outline-danger"
                                                    size="sm"
                                                    className="btn-icon btn-icon-only rounded-circle position-absolute top-0 end-0 m-2 border-0 p-1 d-flex align-items-center justify-content-center"
                                                    style={{ zIndex: 10, width: '28px', height: '28px' }}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleRemoveCustomWeeklyOff(idx);
                                                    }}
                                                    title="Delete weekly off day"
                                                >
                                                    <CsLineIcons icon="bin" size="14" />
                                                </Button>
                                                <Row className="g-2">
                                                    <Col xs="12" sm="6">
                                                        <Form.Label className="small text-muted mb-1">Day of Week</Form.Label>
                                                        <Select
                                                            classNamePrefix="react-select"
                                                            menuPortalTarget={document.body}
                                                            styles={{
                                                                control: base => ({ ...base, borderRadius: '20px', minHeight: '38px' }),
                                                                menuPortal: base => ({ ...base, zIndex: 9999 })
                                                            }}
                                                            options={[
                                                                { value: 'Sunday', label: 'Sunday' },
                                                                { value: 'Monday', label: 'Monday' },
                                                                { value: 'Tuesday', label: 'Tuesday' },
                                                                { value: 'Wednesday', label: 'Wednesday' },
                                                                { value: 'Thursday', label: 'Thursday' },
                                                                { value: 'Friday', label: 'Friday' },
                                                                { value: 'Saturday', label: 'Saturday' }
                                                            ]}
                                                            value={woff.day ? { value: woff.day, label: woff.day } : null}
                                                            onChange={(selected) => handleUpdateCustomWeeklyOff(idx, 'day', selected.value)}
                                                        />
                                                    </Col>
                                                    <Col xs="12" sm="6">
                                                        <Form.Label className="small text-muted mb-1">Frequency</Form.Label>
                                                        <Select
                                                            classNamePrefix="react-select"
                                                            menuPortalTarget={document.body}
                                                            styles={{
                                                                control: base => ({ ...base, borderRadius: '20px', minHeight: '38px' }),
                                                                menuPortal: base => ({ ...base, zIndex: 9999 })
                                                            }}
                                                            options={[
                                                                { value: 'all_weeks', label: 'Every Week' },
                                                                { value: 'specific_weeks', label: 'Specific Weeks' }
                                                            ]}
                                                            value={woff.type ? { value: woff.type, label: woff.type === 'all_weeks' ? 'Every Week' : 'Specific Weeks' } : null}
                                                            onChange={(selected) => handleUpdateCustomWeeklyOff(idx, 'type', selected.value)}
                                                        />
                                                    </Col>
                                                </Row>

                                                {woff.type === 'specific_weeks' && (
                                                    <div className="mt-3">
                                                        <div className="small text-muted mb-1.5 fw-bold">Select Weeks:</div>
                                                        <div className="d-flex flex-wrap gap-2">
                                                            {[1, 2, 3, 4, 5].map(w => (
                                                                <Badge
                                                                    key={w}
                                                                    bg={(woff.weeks || []).includes(w) ? 'primary' : 'light'}
                                                                    text={(woff.weeks || []).includes(w) ? 'white' : 'dark'}
                                                                    className="border cursor-pointer px-3 py-1.5 rounded-pill shadow-sm"
                                                                    onClick={() => toggleSpecificCustomWeek(idx, w)}
                                                                >
                                                                    {w}{w === 1 ? 'st' : w === 2 ? 'nd' : w === 3 ? 'rd' : 'th'} Week
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </Col>
                                    ))}
                                    {globalWeeklyOffs.length === 0 && (
                                        <Col xs="12">
                                            <div className="p-4 border rounded-3 bg-light text-center">
                                                <CsLineIcons icon="calendar" size="36" className="text-muted opacity-50 mb-2" />
                                                <h6 className="fw-bold mb-1">No Weekly Offs Configured</h6>
                                                <p className="text-muted small mb-3">All days will be treated as working days for this branch until configured.</p>
                                                <Button variant="outline-primary" size="sm" className="rounded-pill px-3" onClick={handleAddCustomWeeklyOff}>
                                                    <CsLineIcons icon="plus" className="me-1" size="14" /> Add Weekly Off Day
                                                </Button>
                                            </div>
                                        </Col>
                                    )}
                                </Row>
                            </Col>

                            {(() => {
                                const normalizeBranchKey = (raw) => {
                                    if (!raw || raw === 'null' || raw === 'undefined' || raw === '') return 'global';
                                    if (typeof raw === 'object') {
                                        if (raw._id && raw._id !== 'null' && raw._id !== 'undefined') return String(raw._id);
                                        return 'global';
                                    }
                                    return String(raw);
                                };

                                const targetBranches = [
                                    { id: null, key: 'global', name: 'Global / All Branches' },
                                    ...branches.map(b => ({ id: b._id, key: String(b._id), name: `${b.name} Branch` }))
                                ];

                                const currentSelectedKey = normalizeBranchKey(selectedBranch?.value);

                                return (
                                    <Col xs="12" className="mt-4">
                                        <hr className="my-4 opacity-25" />
                                        <div className="d-flex justify-content-between align-items-center mb-3">
                                            <h5 className="fw-bold mb-0" style={{ color: '#1ea8e7' }}>
                                                <CsLineIcons icon="calendar" className="me-2" size="18" />
                                                All Branch Weekly Offs Overview
                                            </h5>
                                            <span className="text-muted small fw-medium">Click any branch to load & edit</span>
                                        </div>
                                        <Row className="g-3">
                                            {targetBranches.map(target => {
                                                const matchingConfig = allConfigs.find(c => normalizeBranchKey(c.branch_id) === target.key);
                                                const c = matchingConfig || (target.key === 'global' && fullConfig ? fullConfig : { branch_id: target.id, global_weekly_offs: [] });
                                                
                                                const branchId = target.id;
                                                const branchName = target.name;
                                                const isSelected = currentSelectedKey === target.key;
                                                
                                                let weekOffRules = [];
                                                if (isSelected) {
                                                    weekOffRules = globalWeeklyOffs;
                                                } else if (Array.isArray(c.global_weekly_offs)) {
                                                    weekOffRules = c.global_weekly_offs;
                                                } else if (Array.isArray(c.org_rules?.weekly_off_days) && c.org_rules.weekly_off_days.length > 0) {
                                                    weekOffRules = c.org_rules.weekly_off_days.map(d => ({
                                                        day: WEEK_DAYS.find(wd => wd.value === d)?.label || 'Sunday',
                                                        type: 'all_weeks',
                                                        weeks: []
                                                    }));
                                                }

                                                return (
                                                    <Col key={target.key} xs="12" md="6" lg="4">
                                                        <Card 
                                                            className={`border cursor-pointer h-100 shadow-sm ${isSelected ? 'border-primary bg-light' : 'bg-white'}`}
                                                            style={{ borderRadius: '14px', transition: 'all 0.2s ease-in-out' }}
                                                            onClick={() => {
                                                                const foundOption = target.id 
                                                                    ? { value: target.id, label: target.name }
                                                                    : { value: null, label: 'Global / All Branches' };
                                                                setSelectedBranch(foundOption);
                                                                fetchPayrollConfig(branchId);
                                                            }}
                                                        >
                                                            <Card.Body className="p-3.5">
                                                                <div className="d-flex justify-content-between align-items-center mb-2">
                                                                    <span className="fw-bold text-dark d-flex align-items-center gap-2 small">
                                                                        <CsLineIcons icon="building" size="16" className="text-primary" />
                                                                        {branchName}
                                                                    </span>
                                                                    <div className="d-flex align-items-center gap-1">
                                                                        {isSelected && (
                                                                            <Badge bg="primary" className="rounded-pill px-2 py-1">Editing</Badge>
                                                                        )}
                                                                        <Button
                                                                            variant="light"
                                                                            size="sm"
                                                                            className="btn-icon btn-icon-only rounded-circle border-0 text-danger ms-1 p-1"
                                                                            onClick={(e) => promptDeleteConfig(c, e)}
                                                                            title="Delete Weekly Off for this branch"
                                                                        >
                                                                            <CsLineIcons icon="bin" size="15" />
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                                <div className="d-flex flex-wrap gap-1.5 mt-2">
                                                                    {weekOffRules.length > 0 ? (
                                                                        weekOffRules.map((wo, idx) => (
                                                                            <Badge 
                                                                                key={idx} 
                                                                                bg="info" 
                                                                                className="py-1.5 px-2.5 rounded-pill text-white fw-bold d-inline-flex align-items-center gap-1"
                                                                                style={{ fontSize: '0.75rem' }}
                                                                            >
                                                                                <span>{wo.day}</span>
                                                                                {wo.type === 'specific_weeks' && wo.weeks?.length > 0 ? (
                                                                                    <span className="opacity-90">({wo.weeks.join(', ')} Wk)</span>
                                                                                ) : (
                                                                                    <span className="opacity-75">(Every Wk)</span>
                                                                                )}
                                                                            </Badge>
                                                                        ))
                                                                    ) : (
                                                                        <span className="text-muted small fst-italic">No weekly off set</span>
                                                                    )}
                                                                </div>
                                                            </Card.Body>
                                                        </Card>
                                                    </Col>
                                                );
                                            })}
                                        </Row>
                                    </Col>
                                );
                            })()}
                        </Row>
                    )}
                </Card.Body>
            </Card>

            {/* Delete Confirmation Modal */}
            <Modal show={showDeleteModal} onHide={() => !deletingConfig && setShowDeleteModal(false)} centered size="sm">
                <Modal.Body className="p-4 text-center">
                    <div 
                        className="rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                        style={{ width: '56px', height: '56px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}
                    >
                        <CsLineIcons icon="bin" size="24" />
                    </div>
                    <h5 className="fw-bold mb-2">Delete Weekly Off?</h5>
                    <p className="text-muted small mb-4">
                        Are you sure you want to delete weekly off rules for <strong className="text-dark">{configToDelete?.branch_id ? `${branches.find(b => b._id === configToDelete.branch_id)?.name} Branch` : 'Global / All Branches'}</strong>?
                    </p>
                    <div className="d-flex justify-content-center gap-2">
                        <Button 
                            variant="light" 
                            className="rounded-pill px-4 fw-bold border" 
                            onClick={() => setShowDeleteModal(false)} 
                            disabled={deletingConfig}
                        >
                            Cancel
                        </Button>
                        <Button 
                            variant="danger" 
                            className="rounded-pill px-4 fw-bold shadow-sm" 
                            onClick={handleConfirmDeleteConfig} 
                            disabled={deletingConfig}
                        >
                            {deletingConfig ? <Spinner size="sm" animation="border" /> : 'Delete'}
                        </Button>
                    </div>
                </Modal.Body>
            </Modal>
        </div>
    );
}
