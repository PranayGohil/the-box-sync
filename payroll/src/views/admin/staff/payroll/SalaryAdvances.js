import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Table, Badge, Modal, Form, Spinner, Dropdown } from 'react-bootstrap';
import { toast } from 'react-toastify';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import Select from 'react-select';
import { getSalaryAdvances, addSalaryAdvance, updateSalaryAdvance } from 'api/salaryAdvance';
import { getStaffList } from 'api/staff'; // Assuming this exists to get staff list
import { format } from 'date-fns';

const SalaryAdvances = () => {
    const title = 'Salary Advances & Loans';
    const description = 'Track staff advances and configure automated payroll recoveries.';
    const breadcrumbs = [
        { to: '', text: 'Home' },
        { to: 'staff/view', text: 'Staff' },
        { to: 'staff/salary-advances', title: 'Salary Advances' }
    ];

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [advances, setAdvances] = useState([]);
    const [staffList, setStaffList] = useState([]);
    const [statusFilter, setStatusFilter] = useState('all');

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
            case 'active': return <Badge bg="primary">Active</Badge>;
            case 'fully_recovered': return <Badge bg="success">Fully Recovered</Badge>;
            case 'cancelled': return <Badge bg="secondary">Cancelled</Badge>;
            default: return <Badge bg="light" text="dark">{status}</Badge>;
        }
    };

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
                            style={{ width: '200px' }} 
                            value={statusFilter} 
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="all">All Statuses</option>
                            <option value="active">Active (Recovering)</option>
                            <option value="fully_recovered">Fully Recovered</option>
                        </Form.Select>
                        <Button variant="primary" onClick={handleShowModal} className="btn-icon btn-icon-start">
                            <CsLineIcons icon="plus" /> <span>Give Advance</span>
                        </Button>
                    </Col>
                </Row>
            </div>

            <Card>
                <Card.Body className="p-0">
                    {loading ? <div className="text-center py-5"><Spinner animation="border" /></div> :
                    advances.length === 0 ? <div className="text-center py-5 text-muted">No salary advances found.</div> :
                    <Table responsive hover className="mb-0">
                        <thead className="table-light">
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
                            {advances.map(adv => (
                                <tr key={adv._id}>
                                    <td className="ps-4 align-middle fw-bold">
                                        {adv.staff_id?.f_name} {adv.staff_id?.l_name}
                                        <div className="text-muted small">{adv.staff_id?.position}</div>
                                    </td>
                                    <td className="align-middle">{format(new Date(adv.given_date), 'dd MMM yyyy')}</td>
                                    <td className="align-middle fw-bold text-danger">₹{adv.amount}</td>
                                    <td className="align-middle">
                                        <div className="text-capitalize">{adv.recovery_mode}</div>
                                        {adv.recovery_mode === 'installments' && (
                                            <div className="small text-muted">{adv.installments} EMIs of ₹{adv.installment_amount.toFixed(2)}</div>
                                        )}
                                    </td>
                                    <td className="align-middle">
                                        <span className="text-success fw-bold">₹{adv.recovered_amount}</span>
                                        <div className="small text-muted">Bal: ₹{adv.amount - adv.recovered_amount}</div>
                                    </td>
                                    <td className="align-middle">{getStatusBadge(adv.status)}</td>
                                    <td className="text-end pe-4 align-middle">
                                        {adv.status === 'active' && (
                                            <Button variant="outline-danger" size="sm" onClick={() => handleCancelAdvance(adv._id)}>
                                                Cancel Deds
                                            </Button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                    }
                </Card.Body>
            </Card>

            <Modal show={showModal} onHide={() => !submitting && setShowModal(false)} centered size="lg">
                <Form onSubmit={handleSubmit}>
                    <Modal.Header closeButton>
                        <Modal.Title>Give Salary Advance</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Row className="g-3">
                            <Col md="12">
                                <Form.Group>
                                    <Form.Label>Select Staff <span className="text-danger">*</span></Form.Label>
                                    <Select 
                                        options={staffOptions} 
                                        value={form.staff_id}
                                        onChange={v => setForm({...form, staff_id: v})}
                                        placeholder="Search by name or ID..."
                                        isSearchable
                                    />
                                </Form.Group>
                            </Col>
                            <Col md="6">
                                <Form.Group>
                                    <Form.Label>Advance Amount (₹) <span className="text-danger">*</span></Form.Label>
                                    <Form.Control type="number" required min="1" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} />
                                </Form.Group>
                            </Col>
                            <Col md="6">
                                <Form.Group>
                                    <Form.Label>Date Given <span className="text-danger">*</span></Form.Label>
                                    <Form.Control type="date" required value={form.given_date} onChange={e => setForm({...form, given_date: e.target.value})} />
                                </Form.Group>
                            </Col>
                            <Col md="12">
                                <Form.Group>
                                    <Form.Label>Reason</Form.Label>
                                    <Form.Control placeholder="e.g. Medical emergency, Festival advance" value={form.reason} onChange={e => setForm({...form, reason: e.target.value})} />
                                </Form.Group>
                            </Col>

                            <Col md="12"><hr className="my-2" /></Col>

                            <Col md="6">
                                <Form.Group>
                                    <Form.Label>Payroll Recovery Mode</Form.Label>
                                    <Form.Select value={form.recovery_mode} onChange={e => setForm({...form, recovery_mode: e.target.value})}>
                                        <option value="single">Single Deduction (Next Payroll)</option>
                                        <option value="installments">Monthly Installments (EMI)</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            
                            {form.recovery_mode === 'installments' && (
                                <Col md="6">
                                    <Form.Group>
                                        <Form.Label>Number of Installments (Months)</Form.Label>
                                        <Form.Control type="number" required min="2" value={form.installments} onChange={e => setForm({...form, installments: e.target.value})} />
                                        {form.amount && form.installments > 0 && (
                                            <Form.Text className="text-muted fw-bold text-success">
                                                EMI: ₹{(form.amount / form.installments).toFixed(2)} / month
                                            </Form.Text>
                                        )}
                                    </Form.Group>
                                </Col>
                            )}
                        </Row>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowModal(false)} disabled={submitting}>Cancel</Button>
                        <Button variant="primary" type="submit" disabled={submitting}>
                            {submitting ? <Spinner size="sm" animation="border" /> : 'Confirm Advance'}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </>
    );
};

export default SalaryAdvances;
