import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Badge, Form, Modal, Alert, Spinner } from 'react-bootstrap';
import axios from 'axios';
import { toast } from 'react-toastify';
import CsLineIcons from 'cs-line-icons/CsLineIcons';

const API  = process.env.REACT_APP_API;
const auth = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` });
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const PRESET_ICONS = {
    Breakfast:    { bg: '#fef3c7', text: '#92400e' },
    Brunch:       { bg: '#ecfccb', text: '#365314' },
    Lunch:        { bg: '#cffafe', text: '#164e63' },
    Afternoon:    { bg: '#ede9fe', text: '#4c1d95' },
    Dinner:       { bg: '#fee2e2', text: '#7f1d1d' },
    'Late Night': { bg: '#1e293b', text: '#f1f5f9' },
};

const colorDot = (color) => (
    <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: color || '#6b7280', marginRight: 6, flexShrink: 0 }} />
);

// ─── Slot count helper ──────────────────────────────────────────────────────
const calcSlotCount = (open_time, close_time, slot_duration) => {
    try {
        const toM = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
        let close = toM(close_time);
        const open = toM(open_time);
        if (close <= open) close += 24 * 60;
        return Math.floor((close - open) / slot_duration);
    } catch { return 0; }
};

// ─── GroupFormModal ─────────────────────────────────────────────────────────
const GroupFormModal = ({ show, onClose, onSaved, initial, isEdit }) => {
    const blank = { name: '', open_time: '12:00', close_time: '15:00', slot_duration: 30, max_slots_per_booking: 4, color: '#06b6d4', is_active: true };
    const [form, setForm]       = useState(blank);
    const [saving, setSaving]   = useState(false);
    const [presets, setPresets] = useState([]);
    const [presetsLoading, setPresetsLoading] = useState(false);

    // Reset form when modal opens
    useEffect(() => {
        if (show) {
            setForm(initial ? { ...blank, ...initial } : blank);
        }
    }, [show, initial]); // eslint-disable-line

    // Fetch presets when modal first opens
    useEffect(() => {
        if (!show || presets.length > 0) return;
        setPresetsLoading(true);
        axios.get(`${API}/reservation/config`, { headers: auth() })
            .then((r) => setPresets(r.data.presets || []))
            .catch(() => {}) // presets are optional, don't block
            .finally(() => setPresetsLoading(false));
    }, [show]); // eslint-disable-line

    const applyPreset = (p) => setForm((f) => ({ ...f, name: p.name, open_time: p.open_time, close_time: p.close_time, slot_duration: p.slot_duration, color: p.color }));
    const set         = (k, v) => setForm((f) => ({ ...f, [k]: v }));
    const previewCount = calcSlotCount(form.open_time, form.close_time, form.slot_duration);
    const isOvernightPreview = (() => {
        try { const toM = (t) => { const [h,m] = t.split(':').map(Number); return h*60+m; }; return toM(form.close_time) <= toM(form.open_time); } catch { return false; }
    })();

    const handleSave = async () => {
        if (!form.name.trim()) { toast.warning('Period name is required.'); return; }
        setSaving(true);
        try {
            if (isEdit) {
                await axios.put(`${API}/reservation/config/group/${initial._id}`, form, { headers: auth() });
                toast.success('Slot group updated!');
            } else {
                await axios.post(`${API}/reservation/config/group`, form, { headers: auth() });
                toast.success('Slot group added!');
            }
            onSaved();
            onClose();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Save failed.');
        } finally { setSaving(false); }
    };

    return (
        <Modal show={show} onHide={onClose} centered size="md">
            <Modal.Header closeButton>
                <Modal.Title>
                    <CsLineIcons icon={isEdit ? 'edit' : 'plus'} className="me-2 text-primary" />
                    {isEdit ? 'Edit Slot Group' : 'Add Slot Group'}
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {/* Quick preset suggestions */}
                {!isEdit && (
                    <div className="mb-4">
                        <p className="small fw-semibold text-muted text-uppercase mb-2" style={{ letterSpacing: 1, fontSize: 10 }}>
                            Quick Suggestions
                        </p>
                        {presetsLoading ? (
                            <Spinner size="sm" />
                        ) : presets.length > 0 ? (
                            <>
                                <div className="d-flex flex-wrap gap-2">
                                    {presets.map((p) => {
                                        const meta = PRESET_ICONS[p.name] || { bg: '#f1f5f9', text: '#334155' };
                                        return (
                                            <Button key={p.name} size="sm"
                                                style={{ background: meta.bg, color: meta.text, border: 'none', fontWeight: 500 }}
                                                onClick={() => applyPreset(p)}
                                            >
                                                {colorDot(p.color)}
                                                {p.name}
                                                <span className="ms-1 opacity-75" style={{ fontSize: 10 }}>{p.open_time}–{p.close_time}</span>
                                            </Button>
                                        );
                                    })}
                                </div>
                                <p className="text-muted mt-2 mb-0" style={{ fontSize: 11 }}>
                                    Click a suggestion to prefill, then customise below.
                                </p>
                            </>
                        ) : (
                            <p className="text-muted small mb-0">Fill in the details below.</p>
                        )}
                    </div>
                )}

                <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold small">Period Name <span className="text-danger">*</span></Form.Label>
                    <Form.Control placeholder="e.g. Lunch, Dinner, Brunch…" value={form.name} onChange={(e) => set('name', e.target.value)} />
                </Form.Group>

                <Row className="g-3 mb-3">
                    <Col>
                        <Form.Group>
                            <Form.Label className="fw-semibold small">Opening Time</Form.Label>
                            <Form.Control type="time" value={form.open_time} onChange={(e) => set('open_time', e.target.value)} />
                        </Form.Group>
                    </Col>
                    <Col>
                        <Form.Group>
                            <Form.Label className="fw-semibold small">Closing Time</Form.Label>
                            <Form.Control type="time" value={form.close_time} onChange={(e) => set('close_time', e.target.value)} />
                        </Form.Group>
                    </Col>
                </Row>

                <Row className="g-3 mb-3">
                    <Col>
                        <Form.Group>
                            <Form.Label className="fw-semibold small">Slot Duration</Form.Label>
                            <Form.Select value={form.slot_duration} onChange={(e) => set('slot_duration', Number(e.target.value))}>
                                <option value={15}>15 minutes</option>
                                <option value={30}>30 minutes</option>
                                <option value={60}>60 minutes</option>
                            </Form.Select>
                        </Form.Group>
                    </Col>
                    <Col>
                        <Form.Group>
                            <Form.Label className="fw-semibold small">Max Slots / Booking</Form.Label>
                            <Form.Control type="number" min={1} max={12} value={form.max_slots_per_booking}
                                onChange={(e) => set('max_slots_per_booking', Number(e.target.value))} />
                            <Form.Text className="text-muted">= max {form.max_slots_per_booking * form.slot_duration} min</Form.Text>
                        </Form.Group>
                    </Col>
                </Row>

                <Row className="g-3 mb-3">
                    <Col xs="auto">
                        <Form.Group>
                            <Form.Label className="fw-semibold small">Label Colour</Form.Label>
                            <div className="d-flex align-items-center gap-2">
                                <Form.Control type="color" value={form.color || '#06b6d4'}
                                    onChange={(e) => set('color', e.target.value)}
                                    style={{ width: 44, height: 38, padding: 2 }} />
                                <span className="small text-muted">{form.color}</span>
                            </div>
                        </Form.Group>
                    </Col>
                    <Col>
                        <Form.Group>
                            <Form.Label className="fw-semibold small">Status</Form.Label>
                            <div className="d-flex align-items-center gap-2 mt-2">
                                <Form.Check type="switch" id="is_active_switch"
                                    checked={form.is_active}
                                    onChange={(e) => set('is_active', e.target.checked)} />
                                <span className="small">{form.is_active ? 'Active' : 'Inactive'}</span>
                            </div>
                        </Form.Group>
                    </Col>
                </Row>

                {previewCount > 0 && (
                    <Alert variant="light" className="border py-2 mb-0">
                        <small className="text-muted">
                            <CsLineIcons icon="clock" className="me-1" />
                            Generates <strong>{previewCount} slots</strong> of {form.slot_duration} min each
                            &nbsp;({form.open_time} – {form.close_time})
                            {isOvernightPreview && <Badge bg="warning" text="dark" className="ms-2">Overnight</Badge>}
                        </small>
                    </Alert>
                )}
            </Modal.Body>
            <Modal.Footer>
                <Button variant="outline-secondary" onClick={onClose}>Cancel</Button>
                <Button variant="primary" onClick={handleSave} disabled={saving}>
                    {saving ? 'Saving…' : <><CsLineIcons icon="save" className="me-1" />{isEdit ? 'Update' : 'Add Group'}</>}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

// ─── Main SlotConfigPanel ───────────────────────────────────────────────────
// FIX: accepts `active` prop from parent — only fetches when tab becomes active
// This solves the blank tab issue caused by React-Bootstrap not mounting
// Tab.Pane content until first click, combined with useEffect firing on mount.
const SlotConfigPanel = ({ onSaved, active }) => {
    const [config, setConfig]     = useState(null);
    const [loading, setLoading]   = useState(false);
    const [error, setError]       = useState(null);
    const [openDays, setOpenDays] = useState([0, 1, 2, 3, 4, 5, 6]);
    const [savingDays, setSavingDays] = useState(false);
    const [hasFetched, setHasFetched] = useState(false);

    const [showModal, setShowModal]   = useState(false);
    const [editTarget, setEditTarget] = useState(null);

    const fetchConfig = () => {
        setLoading(true);
        setError(null);
        axios.get(`${API}/reservation/config`, { headers: auth() })
            .then((r) => {
                setConfig(r.data.data);
                setOpenDays(r.data.data.open_days || [0, 1, 2, 3, 4, 5, 6]);
                setHasFetched(true);
            })
            .catch((err) => {
                const msg = err.response?.data?.message || 'Failed to load configuration.';
                setError(msg);
                toast.error(msg);
            })
            .finally(() => setLoading(false));
    };

    // KEY FIX: only fetch when the tab is actually active (or on first render if already active)
    useEffect(() => {
        if (active && !hasFetched) {
            fetchConfig();
        }
    }, [active]); // eslint-disable-line

    const toggleDay   = (d) => setOpenDays((prev) => prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort());

    const handleSaveDays = async () => {
        setSavingDays(true);
        try {
            await axios.put(`${API}/reservation/config`, { open_days: openDays }, { headers: auth() });
            toast.success('Open days saved!');
            onSaved?.();
        } catch { toast.error('Failed to save open days.'); }
        finally { setSavingDays(false); }
    };

    const handleDelete = async (groupId, name) => {
        if (!window.confirm(`Delete "${name}"? Existing reservations are not affected.`)) return;
        try {
            await axios.delete(`${API}/reservation/config/group/${groupId}`, { headers: auth() });
            toast.success(`"${name}" deleted.`);
            fetchConfig();
            onSaved?.();
        } catch { toast.error('Delete failed.'); }
    };

    const handleToggleActive = async (group) => {
        try {
            await axios.put(`${API}/reservation/config/group/${group._id}`,
                { is_active: !group.is_active }, { headers: auth() });
            fetchConfig();
        } catch { toast.error('Failed to update.'); }
    };

    // ── Render states ──────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="text-center py-5">
                <Spinner size="sm" className="me-2" />
                Loading configuration…
            </div>
        );
    }

    if (error) {
        return (
            <Alert variant="danger" className="d-flex align-items-center gap-2">
                <CsLineIcons icon="warning" />
                {error}
                <Button size="sm" variant="outline-danger" className="ms-auto" onClick={fetchConfig}>
                    Retry
                </Button>
            </Alert>
        );
    }

    // Not yet fetched (tab hasn't been clicked yet) — show nothing
    if (!hasFetched) return null;

    const groups = config?.slot_groups || [];

    return (
        <div>
            {/* ── Service Periods ── */}
            <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                    <h6 className="fw-bold mb-0">Service Periods</h6>
                    <small className="text-muted">
                        Define your Lunch, Dinner, Brunch sessions. Each generates its own bookable time slots.
                    </small>
                </div>
                <Button variant="primary" size="sm" onClick={() => { setEditTarget(null); setShowModal(true); }}>
                    <CsLineIcons icon="plus" className="me-1" /> Add Period
                </Button>
            </div>

            {groups.length === 0 ? (
                <Alert variant="light" className="border text-center py-4 mb-4">
                    <CsLineIcons icon="clock" size={28} className="text-muted d-block mx-auto mb-2" />
                    <p className="mb-2 fw-semibold">No service periods configured yet.</p>
                    <p className="text-muted small mb-3">
                        Add Lunch, Dinner or any custom period to start accepting reservations.
                    </p>
                    <Button variant="primary" size="sm" onClick={() => { setEditTarget(null); setShowModal(true); }}>
                        <CsLineIcons icon="plus" className="me-1" /> Add Your First Period
                    </Button>
                </Alert>
            ) : (
                <Row className="g-3 mb-4">
                    {groups.map((group) => {
                        const slotCount = calcSlotCount(group.open_time, group.close_time, group.slot_duration);
                        const toM = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
                        const isON = toM(group.close_time) < toM(group.open_time);

                        return (
                            <Col md={6} xl={4} key={group._id}>
                                <Card
                                    className={`h-100 ${!group.is_active ? 'opacity-50' : ''}`}
                                    style={{ borderLeft: `4px solid ${group.color || '#6b7280'}` }}
                                >
                                    <Card.Body className="p-3">
                                        <div className="d-flex justify-content-between align-items-start mb-2">
                                            <div className="d-flex align-items-center gap-2">
                                                {colorDot(group.color)}
                                                <span className="fw-bold">{group.name}</span>
                                                {isON && <Badge bg="warning" text="dark" style={{ fontSize: 9 }}>Overnight</Badge>}
                                            </div>
                                            <Form.Check
                                                type="switch"
                                                checked={group.is_active}
                                                onChange={() => handleToggleActive(group)}
                                                title={group.is_active ? 'Active — click to deactivate' : 'Inactive — click to activate'}
                                            />
                                        </div>

                                        <div className="d-flex flex-column gap-1 mb-3">
                                            <small className="text-muted">
                                                <CsLineIcons icon="clock" size={12} className="me-1" />
                                                {group.open_time} – {group.close_time}
                                            </small>
                                            <small className="text-muted">
                                                <CsLineIcons icon="grid-1" size={12} className="me-1" />
                                                {slotCount} slots · {group.slot_duration} min each
                                            </small>
                                            <small className="text-muted">
                                                <CsLineIcons icon="layers" size={12} className="me-1" />
                                                Max {group.max_slots_per_booking} slots / booking ({group.max_slots_per_booking * group.slot_duration} min)
                                            </small>
                                        </div>

                                        <div className="d-flex gap-2">
                                            <Button size="sm" variant="outline-primary" className="flex-grow-1"
                                                onClick={() => { setEditTarget(group); setShowModal(true); }}>
                                                <CsLineIcons icon="edit" size={13} className="me-1" /> Edit
                                            </Button>
                                            <Button size="sm" variant="outline-danger"
                                                onClick={() => handleDelete(group._id, group.name)}>
                                                <CsLineIcons icon="bin" size={13} />
                                            </Button>
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>
                        );
                    })}
                </Row>
            )}

            {/* ── Open Days ── */}
            <Card body className="mb-0">
                <h6 className="fw-bold mb-1">Open Days</h6>
                <small className="text-muted d-block mb-3">
                    Select which days the restaurant accepts reservations.
                </small>
                <div className="d-flex flex-wrap gap-2 mb-3">
                    {DAYS.map((day, i) => (
                        <Button key={i} size="sm"
                            variant={openDays.includes(i) ? 'primary' : 'outline-secondary'}
                            onClick={() => toggleDay(i)}
                            style={{ minWidth: 52 }}
                        >
                            {day}
                        </Button>
                    ))}
                </div>
                <Button variant="primary" size="sm" onClick={handleSaveDays} disabled={savingDays}>
                    {savingDays ? 'Saving…' : <><CsLineIcons icon="save" className="me-1" />Save Open Days</>}
                </Button>
            </Card>

            <GroupFormModal
                show={showModal}
                onClose={() => { setShowModal(false); setEditTarget(null); }}
                onSaved={() => { fetchConfig(); onSaved?.(); }}
                initial={editTarget}
                isEdit={!!editTarget}
            />
        </div>
    );
};

export default SlotConfigPanel;