import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Badge, Form, Modal, Alert, Spinner } from 'react-bootstrap';
import axios from 'axios';
import { toast } from 'react-toastify';
import CsLineIcons from 'cs-line-icons/CsLineIcons';

const API = process.env.REACT_APP_API;
const auth = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` });
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const PRESET_ICONS = {
    Breakfast: { bg: '#fef3c7', text: '#92400e' },
    Brunch: { bg: '#ecfccb', text: '#365314' },
    Lunch: { bg: '#cffafe', text: '#164e63' },
    Afternoon: { bg: '#ede9fe', text: '#4c1d95' },
    Dinner: { bg: '#fee2e2', text: '#7f1d1d' },
    'Late Night': { bg: '#1e293b', text: '#f1f5f9' },
};

const customStyles = `
  .slot-config-custom-btn-outline {
    border: 1px solid #23b3f4 !important;
    color: #23b3f4 !important;
    background-color: #fff !important;
    transition: all 0.2s ease-in-out !important;
    border-radius: 50px !important;
    font-weight: 600 !important;
  }
  .slot-config-custom-btn-outline:hover {
    background-color: #23b3f4 !important;
    color: #fff !important;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(35, 179, 244, 0.25) !important;
  }
  .slot-config-custom-btn-outline:hover svg {
    stroke: #fff !important;
  }
  .slot-config-custom-btn-solid {
    background-color: #23b3f4 !important;
    border: 1px solid #23b3f4 !important;
    color: #fff !important;
    transition: all 0.2s ease-in-out !important;
    border-radius: 50px !important;
    font-weight: 600 !important;
  }
  .slot-config-custom-btn-solid:hover {
    background-color: #179edb !important;
    color: #fff !important;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(35, 179, 244, 0.3) !important;
  }
  .slot-config-glass-card {
    background: #ffffff !important;
    border: 1px solid #f0f0f0 !important;
    border-radius: 1.25rem !important;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03) !important;
    transition: all 0.3s ease;
  }
  .slot-config-glass-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.06) !important;
  }
  .slot-config-pill-input {
    border-radius: 12px !important;
    padding: 0.7rem 1.2rem !important;
    border: 1px solid #e5e7eb !important;
    background: #ffffff !important;
    transition: all 0.2s ease !important;
    font-size: 1rem !important;
    font-weight: 600 !important;
    color: #334155 !important;
  }
  .slot-config-pill-input:focus {
    border-color: #23b3f4 !important;
    box-shadow: 0 0 0 4px rgba(35, 179, 244, 0.1) !important;
    outline: none !important;
  }
  .slot-config-day-pill {
    border-radius: 50px !important;
    padding: 8px 18px !important;
    font-weight: 700 !important;
    font-size: 0.85rem !important;
    transition: all 0.2s ease !important;
    min-width: 60px !important;
  }
  .slot-config-day-pill.btn-outline-secondary {
    background-color: transparent !important;
    border-color: #cbd5e1 !important;
    color: #475569 !important;
  }
  .slot-config-day-pill.active {
    background-color: #23b3f4 !important;
    border-color: #23b3f4 !important;
    color: #fff !important;
  }
  .slot-config-day-pill:not(.active):hover {
    opacity: 0 !important;
    pointer-events: none !important;
  }
  .hover-elevate {
    transition: transform 0.2s ease, box-shadow 0.2s ease !important;
  }
  .hover-elevate:hover {
    transform: translateY(-5px);
    box-shadow: 0 15px 30px rgba(0, 0, 0, 0.1) !important;
  }
  .modal-footer {
    display: flex !important;
    flex-direction: column !important;
    gap: 0.75rem !important;
    border-top: none !important;
    padding: 1.5rem !important;
  }
  .modal-footer .btn {
    width: 100% !important;
    margin: 0 !important;
  }
  @media (min-width: 576px) {
    .modal-footer {
      flex-direction: row !important;
      justify-content: flex-end !important;
    }
    .modal-footer .btn {
      width: auto !important;
    }
  }
  @media (max-width: 575px) {
    .modal-dialog {
      margin: 0.5rem !important;
    }
    .modal-body {
      padding: 1rem !important;
    }
    .modal-header {
      padding: 1rem 1rem 0 1rem !important;
    }
  }
  .slot-config-preset-pill {
    cursor: pointer;
    padding: 6px 12px;
    border-radius: 50px;
    border: 1px solid #e5e7eb;
    transition: all 0.2s ease;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-weight: 600;
    font-size: 0.85rem;
    color: #475569;
    background: #ffffff;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    user-select: none;
  }
  .slot-config-preset-pill:hover {
    background: #f9fafb;
    border-color: #cbd5e1;
  }
  .slot-config-preset-pill .preset-time {
    font-size: 0.72rem;
    opacity: 0.6;
    font-weight: 500;
    letter-spacing: 0;
    text-transform: none;
  }
`;

const colorDot = (color) => (
    <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: color || '#6b7280', marginRight: 6, flexShrink: 0 }} />
);

const calcSlotCount = (open_time, close_time, slot_duration) => {
    try {
        const toM = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
        let close = toM(close_time);
        const open = toM(open_time);
        if (close <= open) close += 24 * 60;
        return Math.floor((close - open) / slot_duration);
    } catch { return 0; }
};

const GroupFormModal = ({ show, onClose, onSaved, initial, isEdit }) => {
    const blank = { name: '', open_time: '12:00', close_time: '15:00', slot_duration: 30, max_slots_per_booking: 1, color: '#23b3f4', is_active: true };
    const [form, setForm] = useState(blank);
    const [saving, setSaving] = useState(false);
    const [presets, setPresets] = useState([]);
    const [presetsLoading, setPresetsLoading] = useState(false);

    useEffect(() => {
        if (show) {
            setForm(initial ? { ...blank, ...initial } : blank);
        }
    }, [show, initial]);

    useEffect(() => {
        if (!show || presets.length > 0) return;
        setPresetsLoading(true);
        axios.get(`${API}/reservation/config`, { headers: auth() })
            .then((r) => setPresets(r.data.presets || []))
            .catch(() => { })
            .finally(() => setPresetsLoading(false));
    }, [show]);

    const applyPreset = (p) => setForm((f) => ({ ...f, name: p.name, open_time: p.open_time, close_time: p.close_time, slot_duration: p.slot_duration, color: p.color }));
    const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
    const previewCount = calcSlotCount(form.open_time, form.close_time, form.slot_duration);
    const isOvernightPreview = (() => {
        try { const toM = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; }; return toM(form.close_time) <= toM(form.open_time); } catch { return false; }
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
        <Modal show={show} onHide={onClose} centered size="lg" backdrop="static">
            <style>{customStyles}</style>
            <Modal.Header closeButton className="border-0 pb-0">
                <Modal.Title className="fw-bold" style={{ color: '#23b3f4' }}>
                    <CsLineIcons icon={isEdit ? 'edit' : 'plus'} className="me-2" style={{ stroke: '#23b3f4' }} />
                    {isEdit ? 'Edit Slot Group' : 'Add Slot Group'}
                </Modal.Title>
            </Modal.Header>
            <Modal.Body className="py-4">
                {!isEdit && (
                    <div className="mb-4">
                        <p className="small fw-semibold text-muted text-uppercase mb-2" style={{ letterSpacing: 1, fontSize: 10 }}>
                            Quick Suggestions
                        </p>
                        {presetsLoading ? (
                            <Spinner size="sm" style={{ color: '#23b3f4' }} />
                        ) : presets.length > 0 ? (
                            <div className="d-flex flex-wrap gap-2">
                                {presets.map((p) => (
                                    <div
                                        key={p.name}
                                        className="slot-config-preset-pill"
                                        onClick={() => applyPreset(p)}
                                    >
                                        <span style={{
                                            display: 'inline-block',
                                            width: 10,
                                            height: 10,
                                            borderRadius: '50%',
                                            background: p.color || '#6b7280',
                                            flexShrink: 0
                                        }} />
                                        {p.name}
                                        <span className="preset-time">{p.open_time}–{p.close_time}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-muted small mb-0">Fill in the details below.</p>
                        )}
                    </div>
                )}

                <Form.Group className="mb-3">
                    <Form.Label className="small fw-bold text-muted text-uppercase mb-2">Period Name *</Form.Label>
                    <Form.Control 
                        placeholder="e.g. Lunch, Dinner, Brunch…" 
                        value={form.name} 
                        onChange={(e) => set('name', e.target.value)} 
                        className="slot-config-pill-input shadow-sm bg-white"
                        style={{ height: '48px' }}
                    />
                </Form.Group>

                <Row className="g-3 mb-3">
                    <Col>
                        <Form.Group>
                            <Form.Label className="small fw-bold text-muted text-uppercase mb-2">Opening Time</Form.Label>
                            <Form.Control 
                                type="time" 
                                value={form.open_time} 
                                onChange={(e) => set('open_time', e.target.value)} 
                                className="slot-config-pill-input shadow-sm bg-white"
                                style={{ height: '48px' }}
                            />
                        </Form.Group>
                    </Col>
                    <Col>
                        <Form.Group>
                            <Form.Label className="small fw-bold text-muted text-uppercase mb-2">Closing Time</Form.Label>
                            <Form.Control 
                                type="time" 
                                value={form.close_time} 
                                onChange={(e) => set('close_time', e.target.value)} 
                                className="slot-config-pill-input shadow-sm bg-white"
                                style={{ height: '48px' }}
                            />
                        </Form.Group>
                    </Col>
                </Row>

                <Row className="g-3 mb-3">
                    <Col>
                        <Form.Group>
                            <Form.Label className="small fw-bold text-muted text-uppercase mb-2">Slot Duration</Form.Label>
                            <Form.Select 
                                value={form.slot_duration} 
                                onChange={(e) => set('slot_duration', Number(e.target.value))}
                                className="slot-config-pill-input shadow-sm bg-white"
                                style={{ height: '48px' }}
                            >
                                <option value={15}>15 minutes</option>
                                <option value={30}>30 minutes</option>
                                <option value={60}>60 minutes</option>
                            </Form.Select>
                        </Form.Group>
                    </Col>
                </Row>

                <Row className="g-3 mb-3">
                    <Col xs="auto">
                        <Form.Group>
                            <Form.Label className="small fw-bold text-muted text-uppercase mb-2">Label Colour</Form.Label>
                            <div className="d-flex align-items-center gap-2">
                                <Form.Control 
                                    type="color" 
                                    value={form.color || '#23b3f4'}
                                    onChange={(e) => set('color', e.target.value)}
                                    style={{ width: 44, height: 38, padding: 2, borderRadius: '8px' }} 
                                />
                                <span className="small text-muted fw-bold">{form.color}</span>
                            </div>
                        </Form.Group>
                    </Col>
                    <Col>
                        <Form.Group>
                            <Form.Label className="small fw-bold text-muted text-uppercase mb-2">Status</Form.Label>
                            <div className="d-flex align-items-center gap-2 mt-2">
                                <Form.Check 
                                    type="switch" 
                                    id="is_active_switch"
                                    checked={form.is_active}
                                    onChange={(e) => set('is_active', e.target.checked)} 
                                />
                                <span className="small fw-bold text-alternate">{form.is_active ? 'Active' : 'Inactive'}</span>
                            </div>
                        </Form.Group>
                    </Col>
                </Row>

                {previewCount > 0 && (
                    <Alert variant="light" className="border py-2 mb-0 rounded-3 bg-light">
                        <small className="text-muted fw-bold">
                            <CsLineIcons icon="clock" className="me-1" size="14" />
                            Generates <strong>{previewCount} slots</strong> of {form.slot_duration} min each
                            &nbsp;({form.open_time} – {form.close_time})
                            {isOvernightPreview && <Badge bg="warning" text="dark" className="ms-2">Overnight</Badge>}
                        </small>
                    </Alert>
                )}
            </Modal.Body>
            <Modal.Footer className="border-0">
                <Button 
                    className="rounded-pill px-4 fw-bold slot-config-custom-btn-outline btn btn-outline-primary"
                    variant="outline-light" 
                    onClick={onClose}
                >
                    Cancel
                </Button>
                <Button 
                    className="px-5 py-2 slot-config-custom-btn-outline d-flex align-items-center gap-2"
                    variant="outline-light"
                    onClick={handleSave} 
                    disabled={saving}
                >
                    {saving ? (
                        <>
                            <Spinner as="span" animation="border" size="sm" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <CsLineIcons icon="save" size="18" />
                            {isEdit ? 'Update' : 'Add Period'}
                        </>
                    )}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

const SlotConfigPanel = ({ onSaved, active }) => {
    const [config, setConfig] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [openDays, setOpenDays] = useState([0, 1, 2, 3, 4, 5, 6]);
    const [savingDays, setSavingDays] = useState(false);
    const [hasFetched, setHasFetched] = useState(false);

    const [showModal, setShowModal] = useState(false);
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

    useEffect(() => {
        if (active && !hasFetched) {
            fetchConfig();
        }
    }, [active]);

    const toggleDay = (d) => setOpenDays((prev) => prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort());

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

    if (loading) {
        return (
            <div className="text-center py-5">
                <Spinner animation="border" style={{ color: '#23b3f4' }} className="mb-2" />
                <p className="text-muted fw-bold">Loading configuration…</p>
            </div>
        );
    }

    if (error) {
        return (
            <Alert variant="danger" className="d-flex align-items-center gap-2">
                <CsLineIcons icon="warning-hexagon" />
                {error}
                <Button size="sm" variant="outline-danger" className="btn-icon ms-auto" onClick={fetchConfig}>
                    Retry
                </Button>
            </Alert>
        );
    }

    if (!hasFetched) return null;

    const groups = config?.slot_groups || [];

    return (
        <div className="py-2 text-start">
            <style>{customStyles}</style>
            
            <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-3 mb-4">
                <div>
                    <h5 className="fw-bold mb-1 text-dark">Service Periods</h5>
                    <p className="text-muted small mb-0">
                        Define your Lunch, Dinner, Brunch sessions. Each session generates bookable time slots.
                    </p>
                </div>
                <Button 
                    className='px-4 py-2 slot-config-custom-btn-outline d-flex align-items-center gap-2'
                    variant="outline-light"
                    onClick={() => { setEditTarget(null); setShowModal(true); }}
                >
                    <CsLineIcons icon="plus" size="18" /> Add Period
                </Button>
            </div>

            {groups.length === 0 ? (
                <Card className="border-0 shadow-sm text-center py-5 rounded-4 mb-5">
                    <Card.Body>
                        <div className="mb-3">
                            <CsLineIcons icon="clock" size="48" className="text-muted opacity-50" />
                        </div>
                        <h5 className="text-muted fw-bold">No service periods configured yet</h5>
                        <p className="text-muted small mb-4">Add Lunch, Dinner or custom periods to start accepting reservations.</p>
                        <Button 
                            className='px-4 py-2 slot-config-custom-btn-outline d-inline-flex align-items-center gap-2'
                            variant="outline-light"
                            onClick={() => { setEditTarget(null); setShowModal(true); }}
                        >
                            <CsLineIcons icon="plus" size="18" /> Add Your First Period
                        </Button>
                    </Card.Body>
                </Card>
            ) : (
                <Row className="g-4 mb-5">
                    {groups.map((group) => {
                        const slotCount = calcSlotCount(group.open_time, group.close_time, group.slot_duration);
                        const toM = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
                        const isON = toM(group.close_time) < toM(group.open_time);

                        return (
                            <Col md={6} xl={4} key={group._id}>
                                <Card
                                    className={`hover-elevate border-0 h-100 ${!group.is_active ? 'opacity-50' : ''}`}
                                    style={{ borderRadius: '15px', overflow: 'hidden' }}
                                >
                                    <Card.Body className="p-3 d-flex flex-column justify-content-between">
                                        <div>
                                            <div className="d-flex justify-content-between align-items-start mb-3">
                                                <div
                                                    className="d-flex align-items-center justify-content-center bg-light rounded-lg"
                                                    style={{ width: '45px', height: '45px', backgroundColor: '#f3f4f6' }}
                                                >
                                                    <CsLineIcons icon="clock" size="24" style={{ stroke: '#23b3f4' }} />
                                                </div>
                                                <div className="d-flex align-items-center gap-1">
                                                    <Form.Check
                                                        type="switch"
                                                        id={`switch-${group._id}`}
                                                        checked={group.is_active}
                                                        onChange={() => handleToggleActive(group)}
                                                        title={group.is_active ? 'Active — click to deactivate' : 'Inactive — click to activate'}
                                                        className="me-2 mt-1"
                                                    />
                                                    <Button
                                                        variant="link"
                                                        size="sm"
                                                        className="p-1 text-muted"
                                                        onClick={() => { setEditTarget(group); setShowModal(true); }}
                                                    >
                                                        <CsLineIcons icon="edit" size="16" />
                                                    </Button>
                                                    <Button
                                                        variant="link"
                                                        size="sm"
                                                        className="p-1 text-danger"
                                                        onClick={() => handleDelete(group._id, group.name)}
                                                    >
                                                        <CsLineIcons icon="bin" size="16" />
                                                    </Button>
                                                </div>
                                            </div>

                                            <div className="mb-2 text-start">
                                                <span className="text-muted small text-uppercase fw-bold" style={{ letterSpacing: '0.5px' }}>Period Name</span>
                                                <h4 className="fw-bold mb-0 d-flex align-items-center gap-2">
                                                    {colorDot(group.color)}
                                                    {group.name}
                                                </h4>
                                            </div>
                                        </div>

                                        <div className="d-flex flex-column gap-2 mt-3 pt-3 border-top text-start">
                                            <div className="d-flex align-items-center gap-2">
                                                <CsLineIcons icon="clock" size="14" className="text-muted" />
                                                <span className="text-muted small">Hours:</span>
                                                <span className="fw-bold small">{group.open_time} – {group.close_time}</span>
                                                {isON && <Badge bg="warning" text="dark" style={{ fontSize: 9 }} className="ms-auto">Overnight</Badge>}
                                            </div>
                                            <div className="d-flex align-items-center gap-2">
                                                <CsLineIcons icon="grid-1" size="14" className="text-muted" />
                                                <span className="text-muted small">Slots:</span>
                                                <span className="fw-bold small">{slotCount} slots ({group.slot_duration} min)</span>
                                            </div>
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>
                        );
                    })}
                </Row>
            )}

            <Card className="slot-config-glass-card border-0 p-4 mb-4">
                <Card.Body className="p-0">
                    <h5 className="fw-bold mb-1 text-dark">Open Days</h5>
                    <p className="text-muted small mb-4">
                        Select which days the restaurant accepts reservations.
                    </p>
                    <div className="d-flex flex-wrap gap-2 mb-4">
                        {DAYS.map((day, i) => (
                            <Button 
                                key={i} 
                                className={`slot-config-day-pill ${openDays.includes(i) ? 'active btn-primary' : 'btn-outline-secondary'}`}
                                onClick={() => toggleDay(i)}
                            >
                                {day}
                            </Button>
                        ))}
                    </div>
                    <Button 
                        className='px-4 py-2 slot-config-custom-btn-solid d-inline-flex align-items-center gap-2'
                        onClick={handleSaveDays} 
                        disabled={savingDays}
                    >
                        {savingDays ? (
                            <>
                                <Spinner animation="border" size="sm" />
                                Saving…
                            </>
                        ) : (
                            <>
                                <CsLineIcons icon="save" size="18" />
                                Save Open Days
                            </>
                        )}
                    </Button>
                </Card.Body>
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