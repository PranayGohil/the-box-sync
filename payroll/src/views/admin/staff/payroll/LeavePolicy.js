import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Modal, Form, Spinner, Badge } from 'react-bootstrap';
import { toast } from 'react-toastify';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import { getLeavePolicy, updateLeavePolicy } from 'api/payrollConfig';

const LeavePolicy = () => {
    const title = 'Leave Policy Configuration';
    const description = 'Define leave types, accrual rules, and carry-forward logic for your organization.';
    const breadcrumbs = [
        { to: '', text: 'Home' },
        { to: 'staff/view', text: 'Staff' },
        { to: 'staff/leave-policy', title: 'Leave Policy' }
    ];

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [leaveTypes, setLeaveTypes] = useState([]);

    const [showModal, setShowModal] = useState(false);
    const [editingIndex, setEditingIndex] = useState(null);

    const [form, setForm] = useState({
        leave_type_id: '',
        name: '',
        short_code: '',
        days_per_year: 0,
        is_paid: true,
        accrual_type: 'monthly',
        carry_forward: false,
        max_carry_forward: 0,
        color: '#007bff'
    });

    const fetchPolicy = async () => {
        try {
            setLoading(true);
            const res = await getLeavePolicy();
            if (res.success && res.data) {
                setLeaveTypes(res.data.leave_types || []);
            }
        } catch (err) {
            toast.error("Failed to fetch leave policy");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPolicy();
    }, []);

    const handleShowModal = (index = null) => {
        if (index !== null) {
            setEditingIndex(index);
            setForm({ ...leaveTypes[index] });
        } else {
            setEditingIndex(null);
            setForm({
                leave_type_id: `lt_${Date.now()}`,
                name: '',
                short_code: '',
                days_per_year: 12,
                is_paid: true,
                accrual_type: 'monthly',
                carry_forward: false,
                max_carry_forward: 0,
                color: '#007bff'
            });
        }
        setShowModal(true);
    };

    const handleModalSubmit = (e) => {
        e.preventDefault();
        const updatedTypes = [...leaveTypes];
        if (editingIndex !== null) {
            updatedTypes[editingIndex] = form;
        } else {
            updatedTypes.push(form);
        }
        setLeaveTypes(updatedTypes);
        setShowModal(false);
    };

    const handleDelete = (index) => {
        if (!window.confirm("Delete this leave type? Active leave requests may be affected.")) return;
        const updated = [...leaveTypes];
        updated.splice(index, 1);
        setLeaveTypes(updated);
    };

    const saveToServer = async () => {
        try {
            setSaving(true);
            const res = await updateLeavePolicy({ leave_types: leaveTypes });
            if (res.success) {
                toast.success("Leave policy saved successfully");
                setLeaveTypes(res.data.leave_types || []);
            }
        } catch (err) {
            toast.error("Failed to save leave policy");
        } finally {
            setSaving(false);
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
                        <Button variant="outline-primary" onClick={() => handleShowModal()} className="btn-icon btn-icon-start">
                            <CsLineIcons icon="plus" /> <span>Add Leave Type</span>
                        </Button>
                        <Button variant="primary" onClick={saveToServer} disabled={saving} className="btn-icon btn-icon-start">
                            {saving ? <Spinner size="sm" animation="border" /> : <CsLineIcons icon="save" />} <span>Save Policy</span>
                        </Button>
                    </Col>
                </Row>
            </div>

            {loading ? (
                <div className="text-center py-5"><Spinner animation="border" /></div>
            ) : (
                <Row className="g-4">
                    {leaveTypes.map((lt, idx) => (
                        <Col lg="4" md="6" key={lt.leave_type_id || idx}>
                            <Card className="h-100">
                                <Card.Body>
                                    <div className="d-flex justify-content-between align-items-start mb-3">
                                        <div>
                                            <Badge bg="light" text="dark" className="me-2 px-2 py-1 border" style={{ borderColor: lt.color }}>
                                                {lt.short_code}
                                            </Badge>
                                            <span className="fw-bold fs-5">{lt.name}</span>
                                        </div>
                                        <div className="d-flex gap-1">
                                            <Button variant="link" size="sm" className="p-0 text-primary" onClick={() => handleShowModal(idx)}>
                                                <CsLineIcons icon="edit" size="15" />
                                            </Button>
                                            <Button variant="link" size="sm" className="p-0 text-danger" onClick={() => handleDelete(idx)}>
                                                <CsLineIcons icon="bin" size="15" />
                                            </Button>
                                        </div>
                                    </div>
                                    
                                    <div className="d-flex justify-content-between mb-2">
                                        <span className="text-muted">Total Days / Year:</span>
                                        <span className="fw-bold">{lt.days_per_year}</span>
                                    </div>
                                    <div className="d-flex justify-content-between mb-2">
                                        <span className="text-muted">Type:</span>
                                        <span>{lt.is_paid ? <Badge bg="success">Paid Leave</Badge> : <Badge bg="warning" text="dark">Unpaid</Badge>}</span>
                                    </div>
                                    <div className="d-flex justify-content-between mb-2">
                                        <span className="text-muted">Accrual:</span>
                                        <span className="text-capitalize">{lt.accrual_type}</span>
                                    </div>
                                    <div className="d-flex justify-content-between mb-2">
                                        <span className="text-muted">Carry Forward:</span>
                                        <span>{lt.carry_forward ? `Yes (Max: ${lt.max_carry_forward})` : 'No'}</span>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    ))}
                    {leaveTypes.length === 0 && (
                        <Col xs="12">
                            <Card className="text-center py-5">
                                <Card.Body className="text-muted">
                                    No leave types configured. Click 'Add Leave Type' to get started.
                                </Card.Body>
                            </Card>
                        </Col>
                    )}
                </Row>
            )}

            <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg">
                <Form onSubmit={handleModalSubmit}>
                    <Modal.Header closeButton>
                        <Modal.Title>{editingIndex !== null ? 'Edit Leave Type' : 'Add Leave Type'}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Row className="g-3">
                            <Col md="6">
                                <Form.Group>
                                    <Form.Label>Leave Name <span className="text-danger">*</span></Form.Label>
                                    <Form.Control required value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. Casual Leave" />
                                </Form.Group>
                            </Col>
                            <Col md="6">
                                <Form.Group>
                                    <Form.Label>Short Code <span className="text-danger">*</span></Form.Label>
                                    <Form.Control required value={form.short_code} onChange={e => setForm({...form, short_code: e.target.value})} placeholder="e.g. CL" maxLength={4} className="text-uppercase" />
                                </Form.Group>
                            </Col>
                            <Col md="6">
                                <Form.Group>
                                    <Form.Label>Total Days Per Year <span className="text-danger">*</span></Form.Label>
                                    <Form.Control type="number" required min="0" value={form.days_per_year} onChange={e => setForm({...form, days_per_year: Number(e.target.value)})} />
                                </Form.Group>
                            </Col>
                            <Col md="6">
                                <Form.Group>
                                    <Form.Label>Pay Type</Form.Label>
                                    <Form.Select value={form.is_paid ? "true" : "false"} onChange={e => setForm({...form, is_paid: e.target.value === "true"})}>
                                        <option value="true">Paid Leave</option>
                                        <option value="false">Unpaid Leave (LWP)</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md="6">
                                <Form.Group>
                                    <Form.Label>Accrual Method</Form.Label>
                                    <Form.Select value={form.accrual_type} onChange={e => setForm({...form, accrual_type: e.target.value})}>
                                        <option value="upfront">Upfront (All days credited at year start)</option>
                                        <option value="monthly">Monthly (Pro-rated per month)</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md="6">
                                <Form.Group>
                                    <Form.Label>Color Code (UI)</Form.Label>
                                    <Form.Control type="color" value={form.color} onChange={e => setForm({...form, color: e.target.value})} title="Choose your color" />
                                </Form.Group>
                            </Col>
                            <Col xs="12">
                                <Form.Group className="mb-2">
                                    <Form.Check 
                                        type="switch" 
                                        label="Allow Carry Forward to Next Year" 
                                        checked={form.carry_forward} 
                                        onChange={e => setForm({...form, carry_forward: e.target.checked})} 
                                    />
                                </Form.Group>
                                {form.carry_forward && (
                                    <Form.Group className="ms-4">
                                        <Form.Label className="text-muted small">Max Days to Carry Forward</Form.Label>
                                        <Form.Control type="number" min="1" value={form.max_carry_forward} onChange={e => setForm({...form, max_carry_forward: Number(e.target.value)})} style={{ width: '150px' }} />
                                    </Form.Group>
                                )}
                            </Col>
                        </Row>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
                        <Button variant="primary" type="submit">Update List</Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </>
    );
};

export default LeavePolicy;
