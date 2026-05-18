import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Form, Button, Alert, Badge, Spinner } from 'react-bootstrap';
import axios from 'axios';
import { toast } from 'react-toastify';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import HtmlHead from 'components/html-head/HtmlHead';

const API = process.env.REACT_APP_API;

const STATUS_META = {
    pending: { label: 'Pending Review', variant: 'warning' },
    approved: { label: 'Approved', variant: 'success' },
    rejected: { label: 'Rejected', variant: 'danger' },
    reserved: { label: 'Reserved', variant: 'info' },
    seated: { label: 'Seated', variant: 'primary' },
    completed: { label: 'Completed', variant: 'secondary' },
    cancelled: { label: 'Cancelled', variant: 'dark' },
    no_show: { label: 'No-Show', variant: 'danger' },
};

const todayStr = () => new Date().toISOString().slice(0, 10);
const addDays = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
const fmtDate = (str) => new Date(`${str}T00:00:00`).toLocaleDateString('en-IN', { dateStyle: 'long' });

const customStyles = `
  .reservation-form-custom-btn-outline {
    border: 1px solid #23b3f4 !important;
    color: #23b3f4 !important;
    background-color: #fff !important;
    transition: all 0.2s ease-in-out !important;
    border-radius: 50px !important;
    font-weight: 600 !important;
  }
  .reservation-form-custom-btn-outline:hover {
    background-color: #23b3f4 !important;
    color: #fff !important;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(35, 179, 244, 0.25) !important;
  }
  .reservation-form-custom-btn-outline:hover svg {
    stroke: #fff !important;
  }
  .reservation-form-custom-btn-solid {
    background-color: #23b3f4 !important;
    border: 1px solid #23b3f4 !important;
    color: #fff !important;
    transition: all 0.2s ease-in-out !important;
    border-radius: 50px !important;
    font-weight: 600 !important;
  }
  .reservation-form-custom-btn-solid:hover {
    background-color: #179edb !important;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(35, 179, 244, 0.3) !important;
  }
  .reservation-form-glass-card {
    background: #ffffff !important;
    border: 1px solid #f0f0f0 !important;
    border-radius: 1.5rem !important;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.04) !important;
    transition: all 0.3s ease;
  }
  .reservation-form-pill-input {
    border-radius: 12px !important;
    padding: 0.7rem 1.2rem !important;
    border: 1px solid #e5e7eb !important;
    background: #ffffff !important;
    transition: all 0.2s ease !important;
    font-size: 1rem !important;
    font-weight: 600 !important;
    color: #334155 !important;
  }
  .reservation-form-pill-input:focus {
    border-color: #23b3f4 !important;
    box-shadow: 0 0 0 4px rgba(35, 179, 244, 0.1) !important;
    outline: none !important;
  }
`;

const GroupedSlotPicker = ({ groups, selectedGroupId, selectedSlots, onGroupSelect, onSlotToggle }) => {
    if (!groups.length) return <Alert variant="info" className="rounded-3 fw-bold">No time slots available for this date.</Alert>;

    const activeGroup = groups.find((g) => g.group_id === selectedGroupId);

    return (
        <div>
            <div className="d-flex flex-wrap gap-2 mb-4">
                {groups.map((g) => {
                    const bookableCount = g.slots.filter((s) => s.bookable).length;
                    const isActive = selectedGroupId === g.group_id;
                    return (
                        <Button
                            key={g.group_id}
                            size="sm"
                            onClick={() => onGroupSelect(g.group_id)}
                            style={{
                                borderRadius: '50px',
                                padding: '8px 18px',
                                fontWeight: 700,
                                fontSize: '0.85rem',
                                transition: 'all 0.2s ease',
                                backgroundColor: isActive ? g.color : 'transparent',
                                borderColor: isActive ? g.color : '#e2e8f0',
                                color: isActive ? '#fff' : '#475569',
                                boxShadow: isActive ? `0 4px 12px ${g.color}33` : 'none'
                            }}
                            className="d-flex align-items-center gap-2"
                        >
                            <span style={{ width: 8, height: 8, borderRadius: '50%', background: isActive ? '#fff' : g.color, display: 'inline-block', flexShrink: 0 }} />
                            {g.name}
                            <Badge bg={isActive ? 'light' : 'secondary'} text={isActive ? 'dark' : 'white'} style={{ fontSize: 9, borderRadius: '50px' }}>{bookableCount}</Badge>
                        </Button>
                    );
                })}
            </div>

            {activeGroup && (
                <>
                    <Alert variant="light" className="border py-2 mb-3 bg-light rounded-3 small">
                        <small className="text-muted fw-bold">
                            Select up to <strong>{activeGroup.max_slots_per_booking}</strong> consecutive slots
                            ({activeGroup.max_slots_per_booking * activeGroup.slot_duration} min max).
                            Tap a slot to select, tap adjacent slots to extend.
                        </small>
                    </Alert>

                    <div className="d-flex flex-wrap gap-2">
                        {activeGroup.slots.map((s) => {
                            const isSelected = selectedSlots.includes(s.slot_start);
                            const disabled = !s.bookable && !isSelected;

                            const canAdd = (() => {
                                if (selectedSlots.length === 0) return s.bookable;
                                if (selectedSlots.length >= activeGroup.max_slots_per_booking) return false;
                                const allStarts = activeGroup.slots.map((sl) => sl.slot_start);
                                const selIdx = selectedSlots.map((ss) => allStarts.indexOf(ss));
                                const thisIdx = allStarts.indexOf(s.slot_start);
                                return (thisIdx === Math.min(...selIdx) - 1 || thisIdx === Math.max(...selIdx) + 1) && s.bookable;
                            })();

                            const label = s.is_past ? 'Past' : s.is_blocked ? 'Blocked' : !s.bookable ? 'Full' : null;

                            return (
                                <Button
                                    key={s.slot_start}
                                    size="sm"
                                    disabled={disabled || (!isSelected && !canAdd && selectedSlots.length > 0)}
                                    onClick={() => onSlotToggle(s.slot_start, activeGroup)}
                                    style={{
                                        minWidth: 90,
                                        opacity: disabled ? 0.4 : 1,
                                        borderRadius: '12px',
                                        padding: '10px 14px',
                                        fontWeight: 700,
                                        transition: 'all 0.2s ease',
                                        backgroundColor: isSelected ? activeGroup.color : 'transparent',
                                        borderColor: isSelected ? activeGroup.color : disabled ? '#cbd5e1' : '#23b3f4',
                                        color: isSelected ? '#fff' : disabled ? '#94a3b8' : '#23b3f4',
                                        boxShadow: isSelected ? `0 4px 12px ${activeGroup.color}33` : 'none'
                                    }}
                                    className="d-flex flex-column align-items-center justify-content-center"
                                >
                                    <span className="fw-semibold" style={{ fontSize: 13 }}>{s.slot_start}</span>
                                    <span style={{ fontSize: 10, opacity: 0.8 }}>–{s.slot_end}</span>
                                    {label && <Badge bg="secondary" pill style={{ fontSize: 8, marginTop: 4 }}>{label}</Badge>}
                                </Button>
                            );
                        })}
                    </div>

                    {selectedSlots.length > 0 && (
                        <Alert className="mt-4 mb-0 py-3 d-flex align-items-center gap-2 rounded-3 border-0" style={{ background: `${activeGroup.color}14`, color: activeGroup.color }}>
                            <CsLineIcons icon="clock" size={15} style={{ stroke: activeGroup.color }} />
                            <span className="fw-bold">
                                <strong>
                                    {selectedSlots[0]} –&nbsp;
                                    {(() => {
                                        const last = selectedSlots[selectedSlots.length - 1];
                                        const lastSlot = activeGroup.slots.find((s) => s.slot_start === last);
                                        return lastSlot?.slot_end || '';
                                    })()}
                                </strong>
                                &nbsp;· {selectedSlots.length * activeGroup.slot_duration} minutes · {activeGroup.name}
                            </span>
                            <Button variant="link" size="sm" className="btn-icon ms-auto p-0 fw-bold" style={{ color: activeGroup.color }} onClick={() => onSlotToggle(null, activeGroup)}>
                                Clear
                            </Button>
                        </Alert>
                    )}
                </>
            )}
        </div>
    );
};

const ReservationForm = ({ restaurantUserId }) => {
    const title = 'Reserve a Table';

    const [step, setStep] = useState(1);
    const [submitted, setSubmitted] = useState(false);
    const [reservationId, setReservationId] = useState(null);

    const [date, setDate] = useState(todayStr());
    const [numPersons, setNumPersons] = useState('');
    const [groups, setGroups] = useState([]);
    const [selectedGroupId, setSelectedGroupId] = useState(null);
    const [selectedSlots, setSelectedSlots] = useState([]);
    const [slotsLoading, setSlotsLoading] = useState(false);
    const [slotsMessage, setSlotsMessage] = useState('');

    const [form, setForm] = useState({ customer_name: '', customer_phone: '', customer_email: '', notes: '' });
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);

    const [lookupId, setLookupId] = useState('');
    const [statusData, setStatusData] = useState(null);
    const [lookupLoading, setLookupLoading] = useState(false);
    const [lookupError, setLookupError] = useState(null);

    useEffect(() => {
        if (!date || !restaurantUserId) return;
        setSlotsLoading(true);
        setSelectedGroupId(null);
        setSelectedSlots([]);
        setSlotsMessage('');
        axios.get(`${API}/reservation/slots`, { params: { user_id: restaurantUserId, date } })
            .then((r) => {
                setGroups(r.data.data || []);
                setSlotsMessage(r.data.message || '');
                if (r.data.data?.length) setSelectedGroupId(r.data.data[0].group_id);
            })
            .catch(() => toast.error('Could not load time slots.'))
            .finally(() => setSlotsLoading(false));
    }, [date, restaurantUserId]);

    const handleGroupSelect = (groupId) => {
        setSelectedGroupId(groupId);
        setSelectedSlots([]);
    };

    const handleSlotToggle = (slotStart, group) => {
        if (slotStart === null) { setSelectedSlots([]); return; }
        setSelectedSlots((prev) => {
            if (prev.includes(slotStart)) {
                if (slotStart === prev[0] || slotStart === prev[prev.length - 1])
                    return prev.filter((s) => s !== slotStart);
                return prev;
            }
            return [...prev, slotStart].sort();
        });
    };

    const activeGroup = groups.find((g) => g.group_id === selectedGroupId);

    const validateForm = () => {
        const e = {};
        if (!form.customer_name.trim()) e.customer_name = 'Name is required.';
        if (!/^\d{7,15}$/.test(form.customer_phone.replace(/[\s\-+]/g, '')))
            e.customer_phone = 'Enter a valid phone number.';
        if (form.customer_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.customer_email))
            e.customer_email = 'Enter a valid email.';
        return e;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const v = validateForm();
        if (Object.keys(v).length) { setErrors(v); return; }
        setSubmitting(true);
        try {
            const res = await axios.post(`${API}/reservation/create`, {
                ...form,
                reservation_date: date,
                group_id: selectedGroupId,
                slots: selectedSlots,
                num_persons: Number(numPersons),
                user_id: restaurantUserId,
            });
            setReservationId(res.data.data._id);
            setSubmitted(true);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Submission failed.');
        } finally { setSubmitting(false); }
    };

    const handleLookup = async (e) => {
        e.preventDefault();
        if (!lookupId.trim()) return;
        setLookupLoading(true); setStatusData(null); setLookupError(null);
        try {
            const res = await axios.get(`${API}/reservation/status/${lookupId.trim()}`);
            setStatusData(res.data.data);
        } catch { setLookupError('Reservation not found.'); }
        finally { setLookupLoading(false); }
    };

    if (submitted) {
        return (
            <>
                <HtmlHead title="Reservation Submitted" />
                <div className="d-flex justify-content-center py-5 px-3 bg-light min-vh-100 align-items-center">
                    <style>{customStyles}</style>
                    <Card className="reservation-form-glass-card border-0 overflow-hidden text-center" style={{ maxWidth: 520, width: '100%' }}>
                        <Card.Body className="p-5">
                            <div className="text-success mb-4" style={{ fontSize: 58 }}>
                                <CsLineIcons icon="check-circle" size="64" style={{ stroke: '#198754' }} />
                            </div>
                            <h3 className="fw-bold mb-2 text-dark">Request Submitted!</h3>
                            <p className="text-muted mb-4 fw-medium">
                                <strong>{fmtDate(date)}</strong> · <strong>{activeGroup?.name}</strong>
                                {selectedSlots.length > 0 && <> · <strong>{selectedSlots[0]}–{activeGroup?.slots.find((s) => s.slot_start === selectedSlots[selectedSlots.length - 1])?.slot_end}</strong></>}
                            </p>
                            
                            <p className="small text-muted mb-2 fw-bold text-uppercase" style={{ letterSpacing: '0.05em' }}>Your Reservation ID</p>
                            <Alert variant="light" className="border font-monospace text-break mb-4 rounded-3 bg-light fw-bold text-dark py-3">{reservationId}</Alert>
                            
                            <Button 
                                className='reservation-form-custom-btn-outline px-4 py-2 d-inline-flex align-items-center gap-2 mb-5'
                                onClick={() => { navigator.clipboard.writeText(reservationId); toast.success('Copied to clipboard!'); }}
                            >
                                <CsLineIcons icon="copy" size="18" /> Copy ID
                            </Button>
                            
                            <hr className="my-4" />
                            
                            <Form onSubmit={handleLookup} className="text-start">
                                <Form.Label className="small fw-bold text-muted text-uppercase mb-2">Check booking status</Form.Label>
                                <Row className="g-2">
                                    <Col>
                                        <Form.Control 
                                            placeholder="Paste Reservation ID" 
                                            value={lookupId} 
                                            onChange={(e) => setLookupId(e.target.value)} 
                                            className="reservation-form-pill-input shadow-sm bg-white"
                                            style={{ height: '44px' }}
                                        />
                                    </Col>
                                    <Col xs="auto">
                                        <Button 
                                            type="submit" 
                                            className='reservation-form-custom-btn-solid h-100 px-4'
                                            disabled={lookupLoading}
                                        >
                                            {lookupLoading ? '…' : 'Check'}
                                        </Button>
                                    </Col>
                                </Row>
                            </Form>
                            
                            {lookupError && <Alert variant="danger" className="mt-3 mb-0 py-2 rounded-3"><small className="fw-bold">{lookupError}</small></Alert>}
                            {statusData && (
                                <Alert variant="light" className="border mt-3 mb-0 text-start rounded-3 bg-white p-3">
                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                        <span className="fw-bold text-dark">{statusData.customer_name}</span>
                                        <Badge bg={STATUS_META[statusData.status]?.variant || 'secondary'} style={{ borderRadius: '50px', padding: '6px 14px' }}>
                                            {STATUS_META[statusData.status]?.label}
                                        </Badge>
                                    </div>
                                    <small className="text-muted d-block fw-medium">
                                        {fmtDate(statusData.reservation_date)} · {statusData.group_name} · {statusData.slot_start}–{statusData.slot_end} · {statusData.num_persons} guest{statusData.num_persons > 1 ? 's' : ''}
                                    </small>
                                    {statusData.manager_notes && <small className="text-muted d-block mt-1 italic">Note: {statusData.manager_notes}</small>}
                                </Alert>
                            )}
                            
                            <Button 
                                variant="link" 
                                className="mt-4 fw-bold text-decoration-none" 
                                style={{ color: '#23b3f4' }}
                                onClick={() => { setSubmitted(false); setStep(1); setSelectedSlots([]); setForm({ customer_name: '', customer_phone: '', customer_email: '', notes: '' }); }}
                            >
                                Make another reservation
                            </Button>
                        </Card.Body>
                    </Card>
                </div>
            </>
        );
    }

    return (
        <>
            <HtmlHead title={title} />
            <div className="d-flex justify-content-center py-5 px-3 bg-light min-vh-100 align-items-center">
                <style>{customStyles}</style>
                <div style={{ maxWidth: 620, width: '100%' }}>

                    {/* Progress steps */}
                    <div className="d-flex align-items-center gap-2 mb-4 px-2">
                        {[1, 2, 3].map((n) => (
                            <React.Fragment key={n}>
                                <div className="d-flex align-items-center justify-content-center rounded-circle fw-bold shadow-sm"
                                    style={{
                                        width: 32, height: 32, fontSize: 13, flexShrink: 0,
                                        background: step >= n ? '#23b3f4' : '#e2e8f0',
                                        color: step >= n ? '#fff' : '#64748b',
                                        border: step === n ? '2px solid #23b3f4' : '2px solid transparent',
                                        transition: 'all 0.3s ease'
                                    }}>
                                    {step > n ? <CsLineIcons icon="check" size={14} /> : n}
                                </div>
                                <span className={`small ${step >= n ? 'fw-bold text-dark' : 'text-muted'}`}>
                                    {n === 1 ? 'Guests' : n === 2 ? 'Time' : 'Details'}
                                </span>
                                {n < 3 && <div className="flex-grow-1 border-top" style={{ borderColor: step > n ? '#23b3f4' : '#e2e8f0', transition: 'all 0.3s ease' }} />}
                            </React.Fragment>
                        ))}
                    </div>

                    <Card className="reservation-form-glass-card border-0 overflow-hidden">
                        <Card.Header className="py-4 px-4 border-0 bg-transparent text-start pb-0">
                            <div className="d-flex align-items-center gap-2">
                                <CsLineIcons icon="calendar-check" size="24" style={{ color: '#23b3f4' }} />
                                <h4 className="fw-bold text-dark mb-0">
                                    {step === 1 ? 'Choose Date & Party Size' : step === 2 ? 'Pick Your Time' : 'Contact Details'}
                                </h4>
                            </div>
                        </Card.Header>

                        <Card.Body className="p-4 text-start">

                            {/* STEP 1 */}
                            {step === 1 && (
                                <>
                                    <Row className="g-3 mb-4">
                                        <Col md={7}>
                                            <Form.Group>
                                                <Form.Label className="small fw-bold text-muted text-uppercase mb-2">Reservation Date *</Form.Label>
                                                <Form.Control 
                                                    type="date" 
                                                    value={date} 
                                                    min={todayStr()} 
                                                    max={addDays(60)} 
                                                    onChange={(e) => setDate(e.target.value)} 
                                                    className="reservation-form-pill-input shadow-sm bg-white"
                                                    style={{ height: '48px' }}
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={5}>
                                            <Form.Group>
                                                <Form.Label className="small fw-bold text-muted text-uppercase mb-2">Guests Count *</Form.Label>
                                                <Form.Control 
                                                    type="number" 
                                                    min={1} 
                                                    max={50} 
                                                    placeholder="e.g. 4" 
                                                    value={numPersons} 
                                                    onChange={(e) => setNumPersons(e.target.value)} 
                                                    className="reservation-form-pill-input shadow-sm bg-white"
                                                    style={{ height: '48px' }}
                                                />
                                            </Form.Group>
                                        </Col>
                                    </Row>
                                    
                                    {date && (
                                        <Alert variant="light" className="border py-2 mb-4 rounded-3 bg-light small fw-bold">
                                            <small className="text-muted d-flex align-items-center gap-1">
                                                <CsLineIcons icon="calendar" size="14" />
                                                {fmtDate(date)}
                                                {slotsLoading && <Spinner size="sm" className="ms-2" style={{ color: '#23b3f4' }} />}
                                                {!slotsLoading && groups.length > 0 && <> · <strong>{groups.length}</strong> period{groups.length > 1 ? 's' : ''} available</>}
                                                {!slotsLoading && slotsMessage && <> · {slotsMessage}</>}
                                            </small>
                                        </Alert>
                                    )}
                                    <Button 
                                        className="reservation-form-custom-btn-solid w-100 py-3 d-flex align-items-center justify-content-center gap-2"
                                        disabled={!date || !numPersons || slotsLoading} 
                                        onClick={() => setStep(2)}
                                    >
                                        Choose Time <CsLineIcons icon="chevron-right" size="18" />
                                    </Button>
                                </>
                            )}

                            {/* STEP 2 */}
                            {step === 2 && (
                                <>
                                    <div className="mb-4 d-flex justify-content-between align-items-center p-3 rounded-3 bg-light">
                                        <span className="fw-bold text-dark">{fmtDate(date)} · {numPersons} guest{numPersons > 1 ? 's' : ''}</span>
                                        <Button variant="link" className="p-0 fw-bold text-decoration-none" style={{ color: '#23b3f4' }} onClick={() => setStep(1)}><CsLineIcons icon="edit" size={14} className="me-1" />Edit</Button>
                                    </div>
                                    {slotsLoading ? (
                                        <div className="text-center py-4"><Spinner style={{ color: '#23b3f4' }} className="mb-2" /> <p className="text-muted fw-bold">Loading slots…</p></div>
                                    ) : groups.length === 0 ? (
                                        <Alert variant="warning" className="rounded-3 fw-bold">{slotsMessage || 'No slots available for this date.'}</Alert>
                                    ) : (
                                        <GroupedSlotPicker
                                            groups={groups}
                                            selectedGroupId={selectedGroupId}
                                            selectedSlots={selectedSlots}
                                            onGroupSelect={handleGroupSelect}
                                            onSlotToggle={handleSlotToggle}
                                        />
                                    )}
                                    <div className="d-flex gap-3 mt-5">
                                        <Button 
                                            className='reservation-form-custom-btn-outline px-4 py-2'
                                            onClick={() => setStep(1)}
                                        >
                                            <CsLineIcons icon="chevron-left" size="18" /> Back
                                        </Button>
                                        <Button 
                                            className="reservation-form-custom-btn-solid flex-grow-1 py-2 d-flex align-items-center justify-content-center gap-2"
                                            disabled={selectedSlots.length === 0} 
                                            onClick={() => setStep(3)}
                                        >
                                            Continue <CsLineIcons icon="chevron-right" size="18" />
                                        </Button>
                                    </div>
                                </>
                            )}

                            {/* STEP 3 */}
                            {step === 3 && (
                                <>
                                    <div className="mb-4 d-flex justify-content-between align-items-center p-3 rounded-3 bg-light">
                                        <div>
                                            <span className="fw-bold text-dark">{fmtDate(date)}</span>
                                            <span className="text-muted ms-2 small fw-medium">
                                                · {activeGroup?.name} · {selectedSlots[0]}–{activeGroup?.slots.find((s) => s.slot_start === selectedSlots[selectedSlots.length - 1])?.slot_end}
                                                · {numPersons} guest{numPersons > 1 ? 's' : ''}
                                            </span>
                                        </div>
                                        <Button variant="link" className="p-0 fw-bold text-decoration-none" style={{ color: '#23b3f4' }} onClick={() => setStep(2)}><CsLineIcons icon="edit" size={14} className="me-1" />Edit</Button>
                                    </div>

                                    <Form onSubmit={handleSubmit} noValidate>
                                        <Row className="g-3 mb-3">
                                            <Col md={6}>
                                                <Form.Group>
                                                    <Form.Label className="small fw-bold text-muted text-uppercase mb-2">Full Name *</Form.Label>
                                                    <Form.Control 
                                                        placeholder="Rahul Sharma" 
                                                        value={form.customer_name}
                                                        onChange={(e) => { setForm((f) => ({ ...f, customer_name: e.target.value })); setErrors((err) => ({ ...err, customer_name: undefined })); }}
                                                        isInvalid={!!errors.customer_name} 
                                                        className="reservation-form-pill-input shadow-sm bg-white"
                                                        style={{ height: '48px' }}
                                                    />
                                                    <Form.Control.Feedback type="invalid" className="fw-bold small">{errors.customer_name}</Form.Control.Feedback>
                                                </Form.Group>
                                            </Col>
                                            <Col md={6}>
                                                <Form.Group>
                                                    <Form.Label className="small fw-bold text-muted text-uppercase mb-2">Phone *</Form.Label>
                                                    <Form.Control 
                                                        placeholder="+91 98765 43210" 
                                                        value={form.customer_phone}
                                                        onChange={(e) => { setForm((f) => ({ ...f, customer_phone: e.target.value })); setErrors((err) => ({ ...err, customer_phone: undefined })); }}
                                                        isInvalid={!!errors.customer_phone} 
                                                        className="reservation-form-pill-input shadow-sm bg-white"
                                                        style={{ height: '48px' }}
                                                    />
                                                    <Form.Control.Feedback type="invalid" className="fw-bold small">{errors.customer_phone}</Form.Control.Feedback>
                                                </Form.Group>
                                            </Col>
                                        </Row>
                                        
                                        <Form.Group className="mb-3">
                                            <Form.Label className="small fw-bold text-muted text-uppercase mb-2">Email <span className="text-muted">(optional)</span></Form.Label>
                                            <Form.Control 
                                                type="email" 
                                                placeholder="rahul@example.com" 
                                                value={form.customer_email}
                                                onChange={(e) => { setForm((f) => ({ ...f, customer_email: e.target.value })); setErrors((err) => ({ ...err, customer_email: undefined })); }}
                                                isInvalid={!!errors.customer_email} 
                                                className="reservation-form-pill-input shadow-sm bg-white"
                                                style={{ height: '48px' }}
                                            />
                                            <Form.Control.Feedback type="invalid" className="fw-bold small">{errors.customer_email}</Form.Control.Feedback>
                                        </Form.Group>
                                        
                                        <Form.Group className="mb-4">
                                            <Form.Label className="small fw-bold text-muted text-uppercase mb-2">Special Requests <span className="text-muted">(optional)</span></Form.Label>
                                            <Form.Control 
                                                as="textarea" 
                                                rows={3} 
                                                placeholder="Dietary needs, occasion, high chair…"
                                                value={form.notes} 
                                                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} 
                                                className="reservation-form-pill-input shadow-sm bg-white"
                                                style={{ resize: 'none', padding: '1rem', borderRadius: '12px' }}
                                            />
                                        </Form.Group>
                                        
                                        <div className="d-flex gap-3">
                                            <Button 
                                                className='reservation-form-custom-btn-outline px-4 py-2' 
                                                type="button" 
                                                onClick={() => setStep(2)}
                                            >
                                                <CsLineIcons icon="chevron-left" size="18" /> Back
                                            </Button>
                                            <Button 
                                                className='reservation-form-custom-btn-solid flex-grow-1 py-2 d-flex align-items-center justify-content-center gap-2' 
                                                type="submit" 
                                                disabled={submitting}
                                            >
                                                {submitting ? (
                                                    <>
                                                        <Spinner as="span" animation="border" size="sm" />
                                                        Submitting…
                                                    </>
                                                ) : (
                                                    <>
                                                        <CsLineIcons icon="send" size="18" />
                                                        Request Reservation
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    </Form>
                                </>
                            )}
                        </Card.Body>
                    </Card>

                    {/* Status lookup */}
                    <Card className="reservation-form-glass-card border-0 mt-4 p-4 text-start">
                        <Card.Body className="p-0">
                            <p className="fw-bold small mb-3 text-dark d-flex align-items-center gap-2">
                                <CsLineIcons icon="search" size="16" style={{ color: '#23b3f4' }} /> Check an existing reservation
                            </p>
                            <Form onSubmit={handleLookup}>
                                <Row className="g-2">
                                    <Col>
                                        <Form.Control 
                                            placeholder="Paste Reservation ID" 
                                            value={lookupId} 
                                            onChange={(e) => setLookupId(e.target.value)} 
                                            className="reservation-form-pill-input shadow-sm bg-white"
                                            style={{ height: '44px' }}
                                        />
                                    </Col>
                                    <Col xs="auto">
                                        <Button 
                                            type="submit" 
                                            className='reservation-form-custom-btn-outline h-100 px-4'
                                            disabled={lookupLoading}
                                        >
                                            {lookupLoading ? '…' : 'Check'}
                                        </Button>
                                    </Col>
                                </Row>
                            </Form>
                            
                            {lookupError && <Alert variant="danger" className="mt-3 mb-0 py-2 rounded-3"><small className="fw-bold">{lookupError}</small></Alert>}
                            {statusData && (
                                <Alert variant="light" className="border mt-3 mb-0 text-start rounded-3 bg-white p-3">
                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                        <span className="fw-bold text-dark">{statusData.customer_name}</span>
                                        <Badge bg={STATUS_META[statusData.status]?.variant || 'secondary'} style={{ borderRadius: '50px', padding: '6px 14px' }}>
                                            {STATUS_META[statusData.status]?.label}
                                        </Badge>
                                    </div>
                                    <small className="text-muted d-block fw-medium">
                                        {fmtDate(statusData.reservation_date)} · {statusData.group_name} · {statusData.slot_start}–{statusData.slot_end} · {statusData.num_persons} guest{statusData.num_persons > 1 ? 's' : ''}
                                    </small>
                                    {statusData.manager_notes && <small className="text-muted d-block mt-1 italic">Note: {statusData.manager_notes}</small>}
                                </Alert>
                            )}
                        </Card.Body>
                    </Card>

                </div>
            </div>
        </>
    );
};

export default ReservationForm;