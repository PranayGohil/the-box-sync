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

// ─── GroupedSlotPicker ─────────────────────────────────────────────────────
const GroupedSlotPicker = ({ groups, selectedGroupId, selectedSlots, onGroupSelect, onSlotToggle }) => {
    if (!groups.length) return <Alert variant="info">No time slots available for this date.</Alert>;

    const activeGroup = groups.find((g) => g.group_id === selectedGroupId);

    return (
        <div>
            {/* Period tabs */}
            <div className="d-flex flex-wrap gap-2 mb-3">
                {groups.map((g) => {
                    const bookableCount = g.slots.filter((s) => s.bookable).length;
                    return (
                        <Button
                            key={g.group_id}
                            size="sm"
                            variant={selectedGroupId === g.group_id ? 'primary' : 'outline-secondary'}
                            onClick={() => onGroupSelect(g.group_id)}
                            style={selectedGroupId === g.group_id ? { background: g.color, borderColor: g.color } : {}}
                            className="d-flex align-items-center gap-1"
                        >
                            <span style={{ width: 8, height: 8, borderRadius: '50%', background: selectedGroupId === g.group_id ? '#fff' : g.color, display: 'inline-block', flexShrink: 0 }} />
                            {g.name}
                            <Badge bg="light" text="dark" style={{ fontSize: 9 }}>{bookableCount}</Badge>
                        </Button>
                    );
                })}
            </div>

            {/* Slots for selected group */}
            {activeGroup && (
                <>
                    <Alert variant="light" className="border py-2 mb-3">
                        <small className="text-muted">
                            Select up to <strong>{activeGroup.max_slots_per_booking}</strong> consecutive slots
                            ({activeGroup.max_slots_per_booking * activeGroup.slot_duration} min max).
                            Tap a slot to select, tap adjacent slots to extend.
                        </small>
                    </Alert>

                    <div className="d-flex flex-wrap gap-2">
                        {activeGroup.slots.map((s) => {
                            const isSelected = selectedSlots.includes(s.slot_start);
                            const disabled = !s.bookable && !isSelected;

                            // Allow extending only at the edges of current selection
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
                                    variant={isSelected ? 'primary' : disabled ? 'outline-secondary' : 'outline-primary'}
                                    disabled={disabled || (!isSelected && !canAdd && selectedSlots.length > 0)}
                                    onClick={() => onSlotToggle(s.slot_start, activeGroup)}
                                    style={{
                                        minWidth: 90,
                                        opacity: disabled ? 0.4 : 1,
                                        ...(isSelected ? { background: activeGroup.color, borderColor: activeGroup.color } : {}),
                                    }}
                                    className="d-flex flex-column align-items-center"
                                >
                                    <span className="fw-semibold" style={{ fontSize: 13 }}>{s.slot_start}</span>
                                    <span style={{ fontSize: 10, opacity: 0.8 }}>–{s.slot_end}</span>
                                    {label && <Badge bg="secondary" pill style={{ fontSize: 8, marginTop: 2 }}>{label}</Badge>}
                                </Button>
                            );
                        })}
                    </div>

                    {selectedSlots.length > 0 && (
                        <Alert className="mt-3 mb-0 py-2 d-flex align-items-center gap-2" style={{ background: `${activeGroup.color}18`, borderColor: activeGroup.color, color: 'inherit' }}>
                            <CsLineIcons icon="clock" size={15} />
                            <span>
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
                            <Button variant="link" size="sm" className="ms-auto p-0 text-muted" onClick={() => onSlotToggle(null, activeGroup)}>
                                Clear
                            </Button>
                        </Alert>
                    )}
                </>
            )}
        </div>
    );
};

// ─── Main ──────────────────────────────────────────────────────────────────
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

    // Fetch grouped slots when date changes
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

    // ── Success screen ──────────────────────────────────────────────────────
    if (submitted) {
        return (
            <>
                <HtmlHead title="Reservation Submitted" />
                <div className="d-flex justify-content-center py-5 px-3">
                    <Card className="shadow" style={{ maxWidth: 520, width: '100%' }}>
                        <Card.Body className="p-4 text-center">
                            <div className="text-success mb-3" style={{ fontSize: 58 }}><CsLineIcons icon="check-circle" /></div>
                            <h4 className="mb-1">Request Submitted!</h4>
                            <p className="text-muted mb-3">
                                <strong>{fmtDate(date)}</strong> · <strong>{activeGroup?.name}</strong>
                                {selectedSlots.length > 0 && <> · <strong>{selectedSlots[0]}–{activeGroup?.slots.find((s) => s.slot_start === selectedSlots[selectedSlots.length - 1])?.slot_end}</strong></>}
                            </p>
                            <p className="small text-muted mb-1">Your Reservation ID</p>
                            <Alert variant="light" className="border font-monospace text-break mb-3">{reservationId}</Alert>
                            <Button variant="outline-primary" size="sm" onClick={() => { navigator.clipboard.writeText(reservationId); toast.info('Copied!'); }}>
                                <CsLineIcons icon="copy" className="me-1" /> Copy ID
                            </Button>
                            <hr className="my-4" />
                            <Form onSubmit={handleLookup}>
                                <Row className="g-2">
                                    <Col><Form.Control size="sm" placeholder="Paste Reservation ID" value={lookupId} onChange={(e) => setLookupId(e.target.value)} /></Col>
                                    <Col xs="auto"><Button size="sm" type="submit" disabled={lookupLoading}>{lookupLoading ? '…' : 'Check Status'}</Button></Col>
                                </Row>
                            </Form>
                            {lookupError && <Alert variant="danger" className="mt-2 mb-0 py-2"><small>{lookupError}</small></Alert>}
                            {statusData && (
                                <Alert variant="light" className="border mt-2 mb-0 text-start">
                                    <div className="d-flex justify-content-between">
                                        <span className="fw-semibold small">{statusData.customer_name}</span>
                                        <Badge bg={STATUS_META[statusData.status]?.variant || 'secondary'}>{STATUS_META[statusData.status]?.label}</Badge>
                                    </div>
                                    <small className="text-muted d-block mt-1">
                                        {fmtDate(statusData.reservation_date)} · {statusData.group_name} · {statusData.slot_start}–{statusData.slot_end} · {statusData.num_persons} guest{statusData.num_persons > 1 ? 's' : ''}
                                    </small>
                                    {statusData.manager_notes && <small className="text-muted d-block">Note: {statusData.manager_notes}</small>}
                                </Alert>
                            )}
                            <Button variant="link" size="sm" className="mt-4" onClick={() => { setSubmitted(false); setStep(1); setSelectedSlots([]); setForm({ customer_name: '', customer_phone: '', customer_email: '', notes: '' }); }}>
                                Make another reservation
                            </Button>
                        </Card.Body>
                    </Card>
                </div>
            </>
        );
    }

    // ── Multi-step form ─────────────────────────────────────────────────────
    return (
        <>
            <HtmlHead title={title} />
            <div className="d-flex justify-content-center py-5 px-3">
                <div style={{ maxWidth: 620, width: '100%' }}>

                    {/* Progress steps */}
                    <div className="d-flex align-items-center gap-2 mb-4">
                        {[1, 2, 3].map((n) => (
                            <React.Fragment key={n}>
                                <div className="d-flex align-items-center justify-content-center rounded-circle fw-bold"
                                    style={{
                                        width: 32, height: 32, fontSize: 13, flexShrink: 0,
                                        background: step >= n ? 'var(--bs-primary)' : 'var(--bs-secondary-bg)',
                                        color: step >= n ? '#fff' : 'var(--bs-secondary-color)',
                                        border: step === n ? '2px solid var(--bs-primary)' : '2px solid transparent',
                                    }}>
                                    {step > n ? <CsLineIcons icon="check" size={14} /> : n}
                                </div>
                                <span className={`small ${step >= n ? 'fw-semibold' : 'text-muted'}`}>
                                    {n === 1 ? 'Date & Guests' : n === 2 ? 'Select Period & Time' : 'Your Details'}
                                </span>
                                {n < 3 && <div className="flex-grow-1 border-top" />}
                            </React.Fragment>
                        ))}
                    </div>

                    <Card className="shadow-sm">
                        <Card.Header className="bg-primary text-white py-3 px-4">
                            <div className="d-flex align-items-center gap-2">
                                <CsLineIcons icon="calendar-check" size={20} />
                                <span className="fw-semibold mb-0">
                                    {step === 1 ? 'Choose Date & Party Size' : step === 2 ? 'Pick Your Time' : 'Contact Details'}
                                </span>
                            </div>
                        </Card.Header>

                        <Card.Body className="p-4">

                            {/* STEP 1 */}
                            {step === 1 && (
                                <>
                                    <Row className="g-3 mb-4">
                                        <Col md={7}>
                                            <Form.Group>
                                                <Form.Label className="fw-semibold">Reservation Date <span className="text-danger">*</span></Form.Label>
                                                <Form.Control type="date" value={date} min={todayStr()} max={addDays(60)} onChange={(e) => setDate(e.target.value)} />
                                            </Form.Group>
                                        </Col>
                                        <Col md={5}>
                                            <Form.Group>
                                                <Form.Label className="fw-semibold">Number of Guests <span className="text-danger">*</span></Form.Label>
                                                <Form.Control type="number" min={1} max={50} placeholder="e.g. 4" value={numPersons} onChange={(e) => setNumPersons(e.target.value)} />
                                            </Form.Group>
                                        </Col>
                                    </Row>
                                    {date && (
                                        <Alert variant="light" className="border py-2 mb-3">
                                            <small className="text-muted">
                                                <CsLineIcons icon="calendar" className="me-1" />{fmtDate(date)}
                                                {slotsLoading && <Spinner size="sm" className="ms-2" />}
                                                {!slotsLoading && groups.length > 0 && <> · <strong>{groups.length}</strong> period{groups.length > 1 ? 's' : ''} available</>}
                                                {!slotsLoading && slotsMessage && <> · {slotsMessage}</>}
                                            </small>
                                        </Alert>
                                    )}
                                    <Button variant="primary" className="w-100" disabled={!date || !numPersons || slotsLoading} onClick={() => setStep(2)}>
                                        Choose Time <CsLineIcons icon="chevron-right" className="ms-1" />
                                    </Button>
                                </>
                            )}

                            {/* STEP 2 */}
                            {step === 2 && (
                                <>
                                    <div className="mb-3 d-flex justify-content-between align-items-center">
                                        <span className="fw-semibold">{fmtDate(date)} · {numPersons} guest{numPersons > 1 ? 's' : ''}</span>
                                        <Button variant="link" size="sm" className="p-0" onClick={() => setStep(1)}><CsLineIcons icon="edit" size={14} className="me-1" />Edit</Button>
                                    </div>
                                    {slotsLoading ? (
                                        <div className="text-center py-4"><Spinner /> Loading slots…</div>
                                    ) : groups.length === 0 ? (
                                        <Alert variant="warning">{slotsMessage || 'No slots available for this date.'}</Alert>
                                    ) : (
                                        <GroupedSlotPicker
                                            groups={groups}
                                            selectedGroupId={selectedGroupId}
                                            selectedSlots={selectedSlots}
                                            onGroupSelect={handleGroupSelect}
                                            onSlotToggle={handleSlotToggle}
                                        />
                                    )}
                                    <div className="d-flex gap-2 mt-4">
                                        <Button variant="outline-secondary" onClick={() => setStep(1)}><CsLineIcons icon="chevron-left" className="me-1" />Back</Button>
                                        <Button variant="primary" className="flex-grow-1" disabled={selectedSlots.length === 0} onClick={() => setStep(3)}>
                                            Continue <CsLineIcons icon="chevron-right" className="ms-1" />
                                        </Button>
                                    </div>
                                </>
                            )}

                            {/* STEP 3 */}
                            {step === 3 && (
                                <>
                                    <div className="mb-3 d-flex justify-content-between align-items-center">
                                        <div>
                                            <span className="fw-semibold">{fmtDate(date)}</span>
                                            <span className="text-muted ms-2 small">
                                                · {activeGroup?.name} · {selectedSlots[0]}–{activeGroup?.slots.find((s) => s.slot_start === selectedSlots[selectedSlots.length - 1])?.slot_end}
                                                · {numPersons} guest{numPersons > 1 ? 's' : ''}
                                            </span>
                                        </div>
                                        <Button variant="link" size="sm" className="p-0" onClick={() => setStep(2)}><CsLineIcons icon="edit" size={14} className="me-1" />Edit</Button>
                                    </div>

                                    <Form onSubmit={handleSubmit} noValidate>
                                        <Row className="g-3 mb-3">
                                            <Col md={6}>
                                                <Form.Group>
                                                    <Form.Label>Full Name <span className="text-danger">*</span></Form.Label>
                                                    <Form.Control placeholder="Rahul Sharma" value={form.customer_name}
                                                        onChange={(e) => { setForm((f) => ({ ...f, customer_name: e.target.value })); setErrors((err) => ({ ...err, customer_name: undefined })); }}
                                                        isInvalid={!!errors.customer_name} />
                                                    <Form.Control.Feedback type="invalid">{errors.customer_name}</Form.Control.Feedback>
                                                </Form.Group>
                                            </Col>
                                            <Col md={6}>
                                                <Form.Group>
                                                    <Form.Label>Phone <span className="text-danger">*</span></Form.Label>
                                                    <Form.Control placeholder="+91 98765 43210" value={form.customer_phone}
                                                        onChange={(e) => { setForm((f) => ({ ...f, customer_phone: e.target.value })); setErrors((err) => ({ ...err, customer_phone: undefined })); }}
                                                        isInvalid={!!errors.customer_phone} />
                                                    <Form.Control.Feedback type="invalid">{errors.customer_phone}</Form.Control.Feedback>
                                                </Form.Group>
                                            </Col>
                                        </Row>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Email <span className="text-muted">(optional)</span></Form.Label>
                                            <Form.Control type="email" placeholder="rahul@example.com" value={form.customer_email}
                                                onChange={(e) => { setForm((f) => ({ ...f, customer_email: e.target.value })); setErrors((err) => ({ ...err, customer_email: undefined })); }}
                                                isInvalid={!!errors.customer_email} />
                                            <Form.Control.Feedback type="invalid">{errors.customer_email}</Form.Control.Feedback>
                                        </Form.Group>
                                        <Form.Group className="mb-4">
                                            <Form.Label>Special Requests <span className="text-muted">(optional)</span></Form.Label>
                                            <Form.Control as="textarea" rows={3} placeholder="Dietary needs, occasion, high chair…"
                                                value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
                                        </Form.Group>
                                        <div className="d-flex gap-2">
                                            <Button variant="outline-secondary" type="button" onClick={() => setStep(2)}><CsLineIcons icon="chevron-left" className="me-1" />Back</Button>
                                            <Button variant="primary" type="submit" className="flex-grow-1" disabled={submitting}>
                                                {submitting ? 'Submitting…' : <><CsLineIcons icon="send" className="me-2" />Request Reservation</>}
                                            </Button>
                                        </div>
                                    </Form>
                                </>
                            )}
                        </Card.Body>
                    </Card>

                    {/* Status lookup */}
                    <Card className="shadow-sm mt-3">
                        <Card.Body className="p-3">
                            <p className="fw-semibold small mb-2"><CsLineIcons icon="search" className="me-1 text-primary" />Check an existing reservation</p>
                            <Form onSubmit={handleLookup}>
                                <Row className="g-2">
                                    <Col><Form.Control size="sm" placeholder="Paste your Reservation ID" value={lookupId} onChange={(e) => setLookupId(e.target.value)} /></Col>
                                    <Col xs="auto"><Button size="sm" type="submit" variant="outline-primary" disabled={lookupLoading}>{lookupLoading ? '…' : 'Check'}</Button></Col>
                                </Row>
                            </Form>
                            {lookupError && <Alert variant="danger" className="mt-2 mb-0 py-2"><small>{lookupError}</small></Alert>}
                            {statusData && (
                                <Alert variant="light" className="border mt-2 mb-0 text-start">
                                    <div className="d-flex justify-content-between">
                                        <span className="fw-semibold small">{statusData.customer_name}</span>
                                        <Badge bg={STATUS_META[statusData.status]?.variant || 'secondary'}>{STATUS_META[statusData.status]?.label}</Badge>
                                    </div>
                                    <small className="text-muted d-block mt-1">
                                        {fmtDate(statusData.reservation_date)} · {statusData.group_name} · {statusData.slot_start}–{statusData.slot_end} · {statusData.num_persons} guest{statusData.num_persons > 1 ? 's' : ''}
                                    </small>
                                    {statusData.manager_notes && <small className="text-muted d-block">Note: {statusData.manager_notes}</small>}
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