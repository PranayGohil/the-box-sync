import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Table, Modal, Form, Spinner, Badge } from 'react-bootstrap';
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
        { to: 'staff/holidays', title: 'Holidays' }
    ];

    const currentYear = new Date().getFullYear();
    const [year, setYear] = useState(currentYear);
    const [holidays, setHolidays] = useState([]);
    const [loading, setLoading] = useState(true);

    const [showModal, setShowModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [editingId, setEditingId] = useState(null);

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

    const handleShowModal = (holiday = null) => {
        if (holiday) {
            setEditingId(holiday._id);
            setForm({
                name: holiday.name,
                date: new Date(holiday.date).toISOString().split('T')[0],
                holiday_type: holiday.holiday_type,
                is_paid: holiday.is_paid,
                notes: holiday.notes || ''
            });
        } else {
            setEditingId(null);
            setForm({
                name: '',
                date: '',
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
            if (editingId) {
                await updateHoliday(editingId, form);
                toast.success('Holiday updated');
            } else {
                await addHoliday(form);
                toast.success('Holiday added');
            }
            setShowModal(false);
            fetchHolidays();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to save holiday');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this holiday?")) return;
        try {
            await deleteHoliday(id);
            toast.success('Holiday deleted');
            fetchHolidays();
        } catch (err) {
            toast.error('Failed to delete holiday');
        }
    };

    const yearOptions = [];
    for (let i = currentYear - 2; i <= currentYear + 2; i++) yearOptions.push(i);
    const yearOptionsList = yearOptions.map(y => ({ value: y, label: String(y) }));

    const customStyles = `
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
    `;

    return (
        <>
            <style>{customStyles}</style>
            <HtmlHead title={title} description={description} />
            
            <div className="page-title-container">
                <Row className="g-0">
                    <Col className="col-auto mb-3 mb-sm-0 me-auto">
                        <h1 className="mb-0 pb-0 display-4">{title}</h1>
                        <BreadcrumbList items={breadcrumbs} />
                    </Col>
                    <Col xs="auto" className="d-flex align-items-end gap-2 mb-2">
                        <Select 
                            options={yearOptionsList}
                            value={yearOptionsList.find(opt => opt.value === year)}
                            onChange={selected => setYear(selected ? Number(selected.value) : currentYear)}
                            isSearchable={false}
                            classNamePrefix="react-select"
                            className="holiday-year-select-container react-select-premium shadow-sm"
                        />
                        <Button variant="primary" onClick={() => handleShowModal()} className="btn-icon btn-icon-start">
                            <CsLineIcons icon="plus" /> <span>Add Holiday</span>
                        </Button>
                    </Col>
                </Row>
            </div>

            <Card>
                <Card.Body className="p-0">
                    {loading ? (
                        <div className="text-center py-5"><Spinner animation="border" /></div>
                    ) : holidays.length === 0 ? (
                        <div className="text-center py-5 text-muted">No holidays configured for {year}.</div>
                    ) : (
                        <Table responsive hover className="mb-0">
                            <thead className="table-light">
                                <tr>
                                    <th className="ps-4">Date</th>
                                    <th>Holiday Name</th>
                                    <th>Type</th>
                                    <th>Paid Status</th>
                                    <th className="text-end pe-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {holidays.map(h => (
                                    <tr key={h._id}>
                                        <td className="ps-4 align-middle fw-semibold">
                                            {format(new Date(h.date), 'dd MMM yyyy, EEEE')}
                                        </td>
                                        <td className="align-middle">{h.name}</td>
                                        <td className="align-middle">
                                            <Badge bg={
                                                h.holiday_type === 'national' ? 'primary' :
                                                h.holiday_type === 'public' ? 'info' : 'secondary'
                                            } className="text-capitalize">
                                                {h.holiday_type}
                                            </Badge>
                                        </td>
                                        <td className="align-middle">
                                            {h.is_paid ? <Badge bg="success">Paid</Badge> : <Badge bg="warning" text="dark">Unpaid</Badge>}
                                        </td>
                                        <td className="text-end pe-4 align-middle">
                                            <Button variant="outline-primary" size="sm" className="me-2" onClick={() => handleShowModal(h)}>
                                                <CsLineIcons icon="edit" size="14" />
                                            </Button>
                                            <Button variant="outline-danger" size="sm" onClick={() => handleDelete(h._id)}>
                                                <CsLineIcons icon="bin" size="14" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    )}
                </Card.Body>
            </Card>

            <Modal show={showModal} onHide={() => !submitting && setShowModal(false)} centered>
                <Form onSubmit={handleSubmit}>
                    <Modal.Header closeButton>
                        <Modal.Title>{editingId ? 'Edit Holiday' : 'Add New Holiday'}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Form.Group className="mb-3">
                            <Form.Label>Holiday Name</Form.Label>
                            <Form.Control required value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. Diwali" />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Date</Form.Label>
                            <Form.Control type="date" required value={form.date} onChange={e => setForm({...form, date: e.target.value})} />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Type</Form.Label>
                            <Select 
                                options={holidayTypeOptions} 
                                value={holidayTypeOptions.find(opt => opt.value === form.holiday_type)}
                                onChange={selected => setForm({...form, holiday_type: selected ? selected.value : 'public'})}
                                isSearchable={false}
                                classNamePrefix="react-select"
                                className="react-select-premium shadow-sm"
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Pay Type</Form.Label>
                            <Select 
                                options={payTypeOptions} 
                                value={payTypeOptions.find(opt => opt.value === (form.is_paid ? 'true' : 'false'))}
                                onChange={selected => setForm({...form, is_paid: selected ? (selected.value === 'true') : true})}
                                isSearchable={false}
                                classNamePrefix="react-select"
                                className="react-select-premium shadow-sm"
                            />
                        </Form.Group>
                        <Form.Group>
                            <Form.Label>Notes (Optional)</Form.Label>
                            <Form.Control as="textarea" rows={2} value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowModal(false)} disabled={submitting}>Cancel</Button>
                        <Button variant="primary" type="submit" disabled={submitting}>
                            {submitting ? <Spinner size="sm" animation="border" /> : 'Save Holiday'}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </>
    );
};

export default Holidays;
