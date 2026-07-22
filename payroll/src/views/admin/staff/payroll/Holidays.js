import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Modal, Form, Spinner, Badge } from 'react-bootstrap';
import { toast } from 'react-toastify';
import axios from 'axios';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import Select from 'react-select';
import { getHolidays, addHoliday, updateHoliday, deleteHoliday } from 'api/payrollConfig';
import { format } from 'date-fns';

const Holidays = () => {
    const title = 'Holiday Calendar';
    const description = 'Manage public and company holidays for payroll calculation.';
    const breadcrumbs = [
        { to: '', text: 'Home' },
        { to: 'staff/view', text: 'Staff' },
        { to: 'staff/holidays', text: 'Holidays' }
    ];

    const currentYear = new Date().getFullYear();
    const [year, setYear] = useState(currentYear);
    const [holidays, setHolidays] = useState([]);
    const [loading, setLoading] = useState(true);

    const [showModal, setShowModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [editingGroupIds, setEditingGroupIds] = useState([]);

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [holidayToDelete, setHolidayToDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [syncingDefaults, setSyncingDefaults] = useState(false);

    const payTypeOptions = [
        { value: 'true', label: 'Paid Holiday' },
        { value: 'false', label: 'Unpaid Holiday' }
    ];

    const holidayTypeOptions = [
        { value: 'national', label: 'National Holiday' },
        { value: 'public', label: 'Public / Regional Holiday' },
        { value: 'company', label: 'Company Specific Holiday' }
    ];

    const [form, setForm] = useState({
        name: '',
        date: '',
        end_date: '', // Support multi-day vacations
        holiday_type: 'public',
        is_paid: true,
        notes: ''
    });

    const fetchHolidays = async () => {
        try {
            setLoading(true);
            const res = await getHolidays(year);
            if (res.success) {
                setHolidays(res.data || []);
            }
        } catch (err) {
            toast.error("Failed to fetch holidays");
        } finally {
            setLoading(false);
        }
    };

    const handleSyncDefaults = async () => {
        setSyncingDefaults(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(`${process.env.REACT_APP_API}/holidays/sync-defaults`, { year }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                toast.success(res.data.message || 'Synced default holidays successfully!');
                fetchHolidays();
            }
        } catch (err) {
            toast.error('Failed to sync default holidays');
        } finally {
            setSyncingDefaults(false);
        }
    };

    useEffect(() => {
        fetchHolidays();
        // eslint-disable-next-line
    }, [year]);

    const getDatesInRange = (startDateStr, endDateStr) => {
        const dates = [];
        let currentDate = new Date(startDateStr);
        const endDate = new Date(endDateStr);
        
        currentDate.setHours(12, 0, 0, 0);
        endDate.setHours(12, 0, 0, 0);

        while (currentDate <= endDate) {
            dates.push(new Date(currentDate).toISOString().split('T')[0]);
            currentDate.setDate(currentDate.getDate() + 1);
        }
        return dates;
    };

    const groupHolidays = (holidayList) => {
        if (!holidayList || holidayList.length === 0) return [];
        
        // Sort by date ascending
        const sorted = [...holidayList].sort((a, b) => new Date(a.date) - new Date(b.date));
        
        const groups = [];
        
        sorted.forEach((item) => {
            const itemDate = new Date(item.date);
            itemDate.setHours(12, 0, 0, 0);
            
            let foundGroup = null;
            for (let g of groups) {
                if (g.name === item.name &&
                    g.holiday_type === item.holiday_type &&
                    g.is_paid === item.is_paid &&
                    (g.notes || '') === (item.notes || '')) {
                    
                    const lastDateStr = g.dates[g.dates.length - 1];
                    const lastDateObj = new Date(lastDateStr);
                    lastDateObj.setHours(12, 0, 0, 0);
                    
                    const diffTime = Math.abs(itemDate - lastDateObj);
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    
                    if (diffDays === 1) {
                        foundGroup = g;
                        break;
                    }
                }
            }
            
            if (foundGroup) {
                foundGroup.dates.push(item.date);
                foundGroup.ids.push(item._id);
                foundGroup.items.push(item);
            } else {
                groups.push({
                    name: item.name,
                    holiday_type: item.holiday_type,
                    is_paid: item.is_paid,
                    notes: item.notes,
                    dates: [item.date],
                    ids: [item._id],
                    items: [item]
                });
            }
        });
        
        return groups;
    };

    const handleShowModal = (group = null) => {
        if (group) {
            setEditingId(group.ids[0]);
            setEditingGroupIds(group.ids);
            
            const startDateStr = group.dates[0];
            const endDateStr = group.dates.length > 1 ? group.dates[group.dates.length - 1] : '';
            
            setForm({
                name: group.name,
                date: new Date(startDateStr).toISOString().split('T')[0],
                end_date: endDateStr ? new Date(endDateStr).toISOString().split('T')[0] : '',
                holiday_type: group.holiday_type,
                is_paid: group.is_paid,
                notes: group.notes || ''
            });
        } else {
            setEditingId(null);
            setEditingGroupIds([]);
            setForm({
                name: '',
                date: '',
                end_date: '',
                holiday_type: 'public',
                is_paid: true,
                notes: ''
            });
        }
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            let dates = [form.date];
            if (form.end_date && new Date(form.end_date) > new Date(form.date)) {
                dates = getDatesInRange(form.date, form.end_date);
            }

            if (editingId) {
                // Delete all previous documents in the edited group
                const deletePromises = editingGroupIds.map(id => deleteHoliday(id));
                await Promise.all(deletePromises);

                // Create new ones for the updated range
                const promises = dates.map(d => addHoliday({
                    name: form.name,
                    date: d,
                    holiday_type: form.holiday_type,
                    is_paid: form.is_paid,
                    notes: form.notes
                }));
                await Promise.all(promises);
                toast.success('Holiday updated successfully');
            } else {
                // Create multiple days in database
                const promises = dates.map(d => addHoliday({
                    name: form.name,
                    date: d,
                    holiday_type: form.holiday_type,
                    is_paid: form.is_paid,
                    notes: form.notes
                }));
                await Promise.all(promises);
                toast.success(dates.length > 1 ? `Added ${dates.length} holidays for range successfully!` : 'Holiday added successfully');
            }
            setShowModal(false);
            fetchHolidays();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to save holiday');
        } finally {
            setSubmitting(false);
        }
    };

    const confirmDeleteHoliday = (group) => {
        setHolidayToDelete(group);
        setShowDeleteModal(true);
    };

    const handleConfirmDelete = async () => {
        if (!holidayToDelete || !holidayToDelete.ids) return;
        setDeleting(true);
        try {
            const promises = holidayToDelete.ids.map(id => deleteHoliday(id));
            await Promise.all(promises);
            toast.success('Holiday deleted successfully');
            setShowDeleteModal(false);
            setHolidayToDelete(null);
            fetchHolidays();
        } catch (err) {
            toast.error('Failed to delete holiday');
        } finally {
            setDeleting(false);
        }
    };

    const yearOptions = [];
    for (let i = currentYear - 2; i <= currentYear + 2; i++) yearOptions.push(i);
    const yearOptionsList = yearOptions.map(y => ({ value: y, label: String(y) }));

    const getHolidayTypeTheme = (type) => {
        switch (type) {
            case 'national':
                return { color: '#1ea8e7', bg: 'rgba(30, 168, 231, 0.08)', border: 'rgba(30, 168, 231, 0.15)' };
            case 'public':
                return { color: '#10b981', bg: 'rgba(16, 185, 129, 0.08)', border: 'rgba(16, 185, 129, 0.15)' };
            case 'company':
            default:
                return { color: '#7c3aed', bg: 'rgba(124, 58, 237, 0.08)', border: 'rgba(124, 58, 237, 0.15)' };
        }
    };
    return (
        <div className="container-fluid px-lg-4 px-xl-5 pb-5">
            <HtmlHead title={title} description={description} />
            
            <div className="page-title-container mb-4 mt-3 mt-lg-0">
                <Row className="g-3 align-items-center">
                    <Col xs="12" md="7">
                        <h1 className="mb-0 pb-0 display-4 fw-bold" style={{ color: '#1ea8e7' }}>
                            {title}
                        </h1>
                        <BreadcrumbList items={breadcrumbs} />
                    </Col>
                    <Col xs="12" md="5" className="d-flex justify-content-md-end align-items-center gap-2">
                        <div style={{ minWidth: '110px' }}>
                            <Select 
                                options={yearOptionsList}
                                value={yearOptionsList.find(opt => opt.value === year)}
                                onChange={selected => setYear(selected ? Number(selected.value) : currentYear)}
                                isSearchable={false}
                                classNamePrefix="react-select"
                                className="react-select-premium shadow-sm"
                                menuPortalTarget={document.body}
                                styles={{
                                    container: (base) => ({ ...base, minWidth: '110px' }),
                                    control: (base) => ({ ...base, borderRadius: '20px', minHeight: '38px' }),
                                    menuPortal: (base) => ({ ...base, zIndex: 9999 })
                                }}
                            />
                        </div>
                        <Button 
                            variant="outline-primary" 
                            onClick={handleSyncDefaults} 
                            disabled={syncingDefaults}
                            className="px-3 py-2 rounded-pill d-flex align-items-center shadow-sm ms-2"
                            title="Sync Makar Sankranti & missing default holidays for this year"
                        >
                            {syncingDefaults ? <Spinner size="sm" animation="border" className="me-2" /> : <CsLineIcons icon="refresh-horizontal" className="me-2" size="18" />}
                            <span>Sync Default Holidays</span>
                        </Button>
                        <Button 
                            variant="primary" 
                            onClick={() => handleShowModal()} 
                            className="px-4 py-2 rounded-pill d-flex align-items-center shadow-sm ms-1"
                        >
                            <CsLineIcons icon="plus" className="me-2" size="18" />
                            <span>Add Holiday</span>
                        </Button>
                    </Col>
                </Row>
            </div>

            {loading ? (
                <div className="text-center py-5">
                    <Spinner animation="border" style={{ color: '#1ea8e7' }} />
                </div>
            ) : (
                <Row className="g-4">
                    {groupHolidays(holidays).map((g, idx) => {
                        const startDate = new Date(g.dates[0]);
                        const endDate = new Date(g.dates[g.dates.length - 1]);
                        const day = format(startDate, 'dd');
                        const month = format(startDate, 'MMM');
                        const yearStr = format(startDate, 'yyyy');
                        
                        let dateSubtitle = format(startDate, 'EEEE');
                        if (g.dates.length > 1) {
                            dateSubtitle = `${format(startDate, 'dd/MM/yyyy')} - ${format(endDate, 'dd/MM/yyyy')} (${g.dates.length} Days)`;
                        }
                        
                        const theme = getHolidayTypeTheme(g.holiday_type);

                        return (
                            <Col lg="4" md="6" key={g.ids[0] || idx}>
                                <Card className="holiday-glass-card border-0 h-100 shadow-sm">
                                    <Card.Body className="p-4">
                                        <div className="d-flex justify-content-between align-items-start mb-4">
                                            <div className="d-flex align-items-center">
                                                {/* Tear-off calendar block */}
                                                <div className="holiday-calendar-block me-4">
                                                    <div className="holiday-calendar-header" style={{ backgroundColor: theme.color }}>
                                                        {month}
                                                    </div>
                                                    <span className="holiday-calendar-day">{day}</span>
                                                    <span className="holiday-calendar-year">{yearStr}</span>
                                                </div>
                                                <div>
                                                    <span className="fw-bold text-dark fs-5 d-block leading-tight">{g.name}</span>
                                                    <span className="text-muted small fw-medium mt-1 d-block">{dateSubtitle}</span>
                                                </div>
                                            </div>
                                            <div className="d-flex align-items-center gap-1">
                                                <Button 
                                                    variant="outline-primary" 
                                                    size="sm" 
                                                    className="btn-icon btn-icon-only rounded-circle shadow-sm me-1" 
                                                    onClick={() => handleShowModal(g)} 
                                                    title="Edit Holiday"
                                                >
                                                    <CsLineIcons icon="edit" size="14" />
                                                </Button>
                                                <Button 
                                                    variant="outline-danger" 
                                                    size="sm" 
                                                    className="btn-icon btn-icon-only rounded-circle shadow-sm" 
                                                    onClick={() => confirmDeleteHoliday(g)} 
                                                    title="Delete Holiday"
                                                >
                                                    <CsLineIcons icon="bin" size="14" />
                                                </Button>
                                            </div>
                                        </div>
                                        
                                        <div className="holiday-data-row align-items-center">
                                            <span className="text-muted fw-bold small">Holiday Type:</span>
                                            <span>
                                                <Badge 
                                                    bg="none" 
                                                    style={{ 
                                                        backgroundColor: theme.bg, 
                                                        color: theme.color, 
                                                        border: `1px solid ${theme.border}`,
                                                        borderRadius: '50px', 
                                                        padding: '0.35rem 0.75rem', 
                                                        fontWeight: '700' 
                                                    }}
                                                    className="text-capitalize"
                                                >
                                                    {g.holiday_type}
                                                </Badge>
                                            </span>
                                        </div>
                                        
                                        <div className="holiday-data-row align-items-center">
                                            <span className="text-muted fw-bold small">Paid Status:</span>
                                            <span>
                                                {g.is_paid ? (
                                                    <Badge bg="none" style={{ backgroundColor: 'rgba(16, 185, 129, 0.08)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.15)', borderRadius: '50px', padding: '0.35rem 0.75rem', fontWeight: '700' }}>Paid Holiday</Badge>
                                                ) : (
                                                    <Badge bg="none" style={{ backgroundColor: 'rgba(245, 158, 11, 0.08)', color: '#d97706', border: '1px solid rgba(245, 158, 11, 0.15)', borderRadius: '50px', padding: '0.35rem 0.75rem', fontWeight: '700' }}>Unpaid</Badge>
                                                )}
                                            </span>
                                        </div>
                                        
                                        {g.notes && (
                                            <div className="holiday-data-row flex-column align-items-start mt-2 border-0 pb-0">
                                                <span className="text-muted fw-bold small mb-1">Notes:</span>
                                                <p className="text-muted small mb-0 fw-medium bg-light p-2.5 w-100 rounded-3">
                                                    {g.notes}
                                                </p>
                                            </div>
                                        )}
                                    </Card.Body>
                                </Card>
                            </Col>
                        );
                    })}
                    {holidays.length === 0 && (
                        <Col xs="12">
                            <Card className="holiday-glass-card text-center py-5 border-0 shadow-sm">
                                <Card.Body className="text-muted py-5">
                                    <CsLineIcons icon="calendar" size="48" className="text-muted opacity-50 mb-3" />
                                    <h5 className="fw-bold mt-2">No Holidays Configured</h5>
                                    <p className="small mb-0">Select another year or click 'Add Holiday' to define holiday schedules.</p>
                                </Card.Body>
                            </Card>
                        </Col>
                    )}
                </Row>
            )}

            <Modal show={showModal} onHide={() => !submitting && setShowModal(false)} centered size="lg" className="holiday-modal">
                <Form onSubmit={handleSubmit}>
                    <Modal.Header closeButton>
                        <Modal.Title>{editingId ? 'Edit Holiday' : 'Add New Holiday'}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Row className="g-3.5">
                            <Col md="6" className="mb-3">
                                <Form.Group>
                                    <Form.Label className="small fw-bold text-muted text-uppercase ms-1 mb-2">Holiday Name <span className="text-danger">*</span></Form.Label>
                                    <Form.Control required value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. Diwali" className="holiday-input" />
                                </Form.Group>
                            </Col>
                            <Col md="6" className="mb-3">
                                <Form.Group>
                                    <Form.Label className="small fw-bold text-muted text-uppercase ms-1 mb-2">Start Date <span className="text-danger">*</span></Form.Label>
                                    <Form.Control type="date" required value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="holiday-input" style={{ cursor: 'pointer' }} />
                                </Form.Group>
                            </Col>
                            <Col md="6" className="mb-3">
                                <Form.Group>
                                    <Form.Label className="small fw-bold text-muted text-uppercase ms-1 mb-2">End Date (Optional - for vacations)</Form.Label>
                                    <Form.Control type="date" value={form.end_date} onChange={e => setForm({...form, end_date: e.target.value})} className="holiday-input" style={{ cursor: 'pointer' }} min={form.date} />
                                </Form.Group>
                            </Col>
                            <Col md="6" className="mb-3">
                                <Form.Group>
                                    <Form.Label className="small fw-bold text-muted text-uppercase ms-1 mb-2">Holiday Type</Form.Label>
                                    <Select 
                                        options={holidayTypeOptions} 
                                        value={holidayTypeOptions.find(opt => opt.value === form.holiday_type)}
                                        onChange={selected => setForm({...form, holiday_type: selected ? selected.value : 'public'})}
                                        isSearchable={false}
                                        classNamePrefix="react-select"
                                        className="react-select-premium shadow-sm"
                                        menuPortalTarget={document.body}
                                        styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md="6" className="mb-3">
                                <Form.Group>
                                    <Form.Label className="small fw-bold text-muted text-uppercase ms-1 mb-2">Pay Type</Form.Label>
                                    <Select 
                                        options={payTypeOptions} 
                                        value={payTypeOptions.find(opt => opt.value === (form.is_paid ? 'true' : 'false'))}
                                        onChange={selected => setForm({...form, is_paid: selected ? (selected.value === 'true') : true})}
                                        isSearchable={false}
                                        classNamePrefix="react-select"
                                        className="react-select-premium shadow-sm"
                                        menuPortalTarget={document.body}
                                        styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                                    />
                                </Form.Group>
                            </Col>
                            <Col xs="12">
                                <Form.Group>
                                    <Form.Label className="small fw-bold text-muted text-uppercase ms-1 mb-2">Notes (Optional)</Form.Label>
                                    <Form.Control as="textarea" rows={3} value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} placeholder="Add additional context about this holiday..." className="holiday-input" />
                                </Form.Group>
                            </Col>
                        </Row>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="outline-secondary" className="rounded-pill px-4" onClick={() => setShowModal(false)} disabled={submitting}>Cancel</Button>
                        <Button variant="primary" className="rounded-pill px-4" type="submit" disabled={submitting}>
                            {submitting ? <Spinner size="sm" animation="border" /> : 'Save Holiday'}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal show={showDeleteModal} onHide={() => !deleting && setShowDeleteModal(false)} centered size="sm">
                <Modal.Body className="p-4 text-center">
                    <div 
                        className="rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                        style={{ width: '56px', height: '56px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}
                    >
                        <CsLineIcons icon="bin" size="24" />
                    </div>
                    <h5 className="fw-bold mb-2">Delete Holiday?</h5>
                    <p className="text-muted small mb-4">
                        Are you sure you want to delete <strong className="text-dark">{holidayToDelete?.name}</strong>? This action cannot be undone.
                    </p>
                    <div className="d-flex justify-content-center gap-2">
                        <Button 
                            variant="light" 
                            className="rounded-pill px-4 fw-bold border" 
                            onClick={() => setShowDeleteModal(false)} 
                            disabled={deleting}
                        >
                            Cancel
                        </Button>
                        <Button 
                            variant="danger" 
                            className="rounded-pill px-4 fw-bold shadow-sm" 
                            onClick={handleConfirmDelete} 
                            disabled={deleting}
                        >
                            {deleting ? <Spinner size="sm" animation="border" /> : 'Delete'}
                        </Button>
                    </div>
                </Modal.Body>
            </Modal>
        </div>
    );
};

export default Holidays;
