import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Table, Modal, Form, Spinner, Badge } from 'react-bootstrap';
import { toast } from 'react-toastify';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
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
                        <Form.Select 
                            value={year} 
                            onChange={(e) => setYear(Number(e.target.value))}
                            style={{ width: '120px' }}
                        >
                            {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
                        </Form.Select>
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
                            <Form.Select value={form.holiday_type} onChange={e => setForm({...form, holiday_type: e.target.value})}>
                                <option value="national">National Holiday</option>
                                <option value="public">Public / Regional Holiday</option>
                                <option value="company">Company Specific Holiday</option>
                            </Form.Select>
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Check 
                                type="switch" 
                                id="is-paid-switch" 
                                label="Is this a Paid Holiday?" 
                                checked={form.is_paid} 
                                onChange={e => setForm({...form, is_paid: e.target.checked})} 
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
