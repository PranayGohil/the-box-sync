import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Modal, Form, Spinner, Badge } from 'react-bootstrap';
import { toast } from 'react-toastify';
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

    const handleDelete = async (ids) => {
        if (!window.confirm("Are you sure you want to delete this holiday?")) return;
        try {
            const promises = ids.map(id => deleteHoliday(id));
            await Promise.all(promises);
            toast.success('Holiday deleted successfully');
            fetchHolidays();
        } catch (err) {
            toast.error('Failed to delete holiday');
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

    const customStyles = `
      .holiday-glass-card {
        background: #ffffff !important;
        border: 1px solid #edf2f7 !important;
        border-radius: 1.5rem !important;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.02) !important;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
        overflow: hidden;
        position: relative !important;
        padding-left: 6px !important;
      }
      .holiday-glass-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 15px 40px rgba(30, 168, 231, 0.08) !important;
        border-color: rgba(30, 168, 231, 0.2) !important;
      }

      /* Premium left accent color bar */
      .holiday-card-accent {
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        width: 6px;
        border-radius: 1.5rem 0 0 1.5rem;
      }

      /* Beautiful digital tear-off calendar block */
      .holiday-calendar-block {
        width: 62px !important;
        height: 68px !important;
        border-radius: 12px !important;
        background: #f8fafc !important;
        border: 1.5px solid #edf2f7 !important;
        display: flex !important;
        flex-direction: column !important;
        overflow: hidden !important;
        text-align: center !important;
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.02) !important;
      }
      .holiday-calendar-header {
        font-size: 0.65rem !important;
        font-weight: 900 !important;
        text-transform: uppercase !important;
        color: #ffffff !important;
        padding: 3px 0 !important;
        letter-spacing: 0.07em !important;
      }
      .holiday-calendar-day {
        font-size: 1.35rem !important;
        font-weight: 800 !important;
        color: #1e293b !important;
        line-height: 1.1 !important;
        margin-top: 4px !important;
      }
      .holiday-calendar-year {
        font-size: 0.58rem !important;
        font-weight: 700 !important;
        color: #64748b !important;
        margin-top: 1px !important;
      }

      /* Consistent button styles with Leave Policy */
      .holiday-custom-btn-outline {
        border: 1px solid #1ea8e7 !important;
        color: #1ea8e7 !important;
        background-color: #fff !important;
        transition: all 0.2s ease-in-out !important;
        font-weight: 600 !important;
        cursor: pointer !important;
      }
      .holiday-custom-btn-outline:hover {
        background-color: #1ea8e7 !important;
        color: #fff !important;
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(30, 168, 231, 0.25) !important;
      }
      .holiday-custom-btn-outline:hover svg {
        stroke: #ffffff !important;
        color: #ffffff !important;
      }

      .holiday-year-select-container {
        width: 130px !important;
      }

      .holiday-card-icon-btn {
        width: 36px !important;
        height: 36px !important;
        border-radius: 50% !important;
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        transition: all 0.2s ease !important;
        padding: 0 !important;
        border: 1.5px solid transparent !important;
        background: transparent !important;
        cursor: pointer !important;
      }
      .holiday-card-icon-btn.edit-btn {
        border-color: rgba(30, 168, 231, 0.15) !important;
        color: #1ea8e7 !important;
      }
      .holiday-card-icon-btn.edit-btn:hover {
        background-color: #1ea8e7 !important;
        color: #ffffff !important;
        transform: scale(1.08);
      }
      .holiday-card-icon-btn.delete-btn {
        border-color: rgba(239, 68, 68, 0.15) !important;
        color: #ef4444 !important;
      }
      .holiday-card-icon-btn.delete-btn:hover {
        background-color: #ef4444 !important;
        color: #ffffff !important;
        transform: scale(1.08);
      }

      /* Clean grid detail row dividers */
      .holiday-data-row {
        display: flex !important;
        justify-content: space-between !important;
        align-items: center !important;
        padding: 0.75rem 0 !important;
        border-bottom: 1px dashed rgba(226, 232, 240, 0.8) !important;
      }
      .holiday-data-row:last-child {
        border-bottom: none !important;
        padding-bottom: 0 !important;
      }

      /* Form & Modal premium elements */
      .holiday-modal .modal-content {
        border-radius: 1.5rem !important;
        border: none !important;
        box-shadow: 0 20px 50px rgba(0,0,0,0.1) !important;
        overflow: hidden;
      }
      .holiday-modal .modal-header {
        border-bottom: 1px solid #edf2f7 !important;
        padding: 1.5rem 2rem !important;
      }
      .holiday-modal .modal-title {
        font-weight: 800 !important;
        color: #1ea8e7 !important;
        letter-spacing: -0.02em !important;
      }
      .holiday-modal .modal-body {
        padding: 2rem !important;
      }
      .holiday-modal .modal-footer {
        border-top: 1px solid #edf2f7 !important;
        padding: 1.25rem 2rem !important;
      }
      .holiday-input {
        border-radius: 12px !important;
        padding: 0.65rem 1.25rem !important;
        border: 1.5px solid #edf2f7 !important;
        background-color: #f8fafc !important;
        font-weight: 600 !important;
        color: #334155 !important;
        transition: all 0.25s ease-in-out !important;
      }
      .holiday-input:focus {
        border-color: #1ea8e7 !important;
        background-color: #ffffff !important;
        box-shadow: 0 0 0 3px rgba(30, 168, 231, 0.15) !important;
        outline: none !important;
      }

      /* React Select same design as Job Position from screenshot */
      .react-select-premium {
        font-weight: 600 !important;
      }
      .react-select-premium .react-select__control {
        border-radius: 12px !important;
        border: 1.5px solid #edf2f7 !important;
        background-color: #f8fafc !important;
        height: 44px !important;
        min-height: 44px !important;
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
        background-color: #ffffff !important;
        box-shadow: 0 0 0 3px rgba(30, 168, 231, 0.15) !important;
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

      @media (max-width: 767.98px) {
        .page-title-container {
          margin-top: 0rem !important;
        }
      }
    `;

    return (
        <div className="container-fluid pb-5">
            <style>{customStyles}</style>
            <HtmlHead title={title} description={description} />
            
            <div className="page-title-container mb-4">
                <Row className="g-3 align-items-center">
                    <Col xs="12" md="7">
                        <h1 className="mb-0 pb-0 display-4 fw-bold" style={{ color: '#1ea8e7' }}>
                            {title}
                        </h1>
                        <BreadcrumbList items={breadcrumbs} />
                    </Col>
                    <Col xs="12" md="5" className="d-flex justify-content-md-end align-items-center gap-2">
                        <Select 
                            options={yearOptionsList}
                            value={yearOptionsList.find(opt => opt.value === year)}
                            onChange={selected => setYear(selected ? Number(selected.value) : currentYear)}
                            isSearchable={false}
                            classNamePrefix="react-select"
                            className="holiday-year-select-container react-select-premium shadow-sm"
                        />
                        <Button 
                            variant="none" 
                            onClick={() => handleShowModal()} 
                            className="px-4 py-2 rounded-pill d-flex align-items-center holiday-custom-btn-outline shadow-sm"
                        >
                            <CsLineIcons icon="plus" className="me-2" size="18" stroke="currentColor" />
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
                            dateSubtitle = `${format(startDate, 'dd MMM')} - ${format(endDate, 'dd MMM yyyy')} (${g.dates.length} Days)`;
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
                                            <div className="d-flex align-items-center">
                                                <Button variant="none" className="holiday-card-icon-btn edit-btn me-1.5" onClick={() => handleShowModal(g)} title="Edit">
                                                    <CsLineIcons icon="edit" size="15" />
                                                </Button>
                                                <Button variant="none" className="holiday-card-icon-btn delete-btn" onClick={() => handleDelete(g.ids)} title="Delete">
                                                    <CsLineIcons icon="bin" size="15" />
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
                        <Button variant="none" className="holiday-custom-btn-outline" onClick={() => setShowModal(false)} disabled={submitting}>Cancel</Button>
                        <Button variant="none" className="holiday-custom-btn-outline" type="submit" disabled={submitting}>
                            {submitting ? <Spinner size="sm" animation="border" /> : 'Save Holiday'}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </div>
    );
};

export default Holidays;
