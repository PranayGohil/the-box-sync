import React, { useState, useEffect, useCallback } from 'react';
import {
  Row, Col, Card, Button, Badge, Alert, Form,
  Modal, Table, Spinner, Nav, Tab, OverlayTrigger, Tooltip,
} from 'react-bootstrap';
import axios from 'axios';
import { toast } from 'react-toastify';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import SlotConfigPanel from './SlotConfigPanel';

const API = process.env.REACT_APP_API;
const auth = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` });
const fmtDate = (str) => new Date(`${str}T00:00:00`).toLocaleDateString('en-IN', { dateStyle: 'medium' });
const todayStr = () => new Date().toISOString().slice(0, 10);

const STATUS_META = {
  pending: { label: 'Pending', variant: 'warning', icon: 'clock' },
  approved: { label: 'Approved', variant: 'success', icon: 'check-circle' },
  rejected: { label: 'Rejected', variant: 'danger', icon: 'close-circle' },
  reserved: { label: 'Reserved', variant: 'info', icon: 'bookmark' },
  seated: { label: 'Seated', variant: 'primary', icon: 'user-check' },
  completed: { label: 'Completed', variant: 'secondary', icon: 'check-square' },
  cancelled: { label: 'Cancelled', variant: 'dark', icon: 'ban' },
  no_show: { label: 'No-Show', variant: 'danger', icon: 'user-x' },
};

const STATUS_COLORS = {
  pending: '#ffc107',
  approved: '#198754',
  reserved: '#23b3f4',
  seated: '#0d6efd',
};

const customStyles = `
  /* Navigation Tabs */
  .reservations-tabs.nav-tabs {
    border-bottom: 2px solid #f1f5f9 !important;
    gap: 0.5rem;
    margin-bottom: 2rem !important;
  }
  .reservations-tabs .nav-link {
    border: none !important;
    background: transparent !important;
    color: #64748b !important;
    font-weight: 700 !important;
    font-size: 0.95rem !important;
    padding: 0.75rem 1.25rem !important;
    border-radius: 50px !important;
    transition: all 0.2s ease-in-out !important;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .reservations-tabs .nav-link:hover {
    color: #23b3f4 !important;
    background: #f0f9ff !important;
  }
  .reservations-tabs .nav-link.active {
    color: #ffffff !important;
    background: #23b3f4 !important;
    box-shadow: 0 4px 12px rgba(35, 179, 244, 0.25) !important;
  }
  .reservations-tabs .nav-link svg {
    stroke: currentColor;
    transition: stroke 0.2s ease;
  }
  .reservations-tabs .nav-link:hover svg {
    stroke: #23b3f4;
  }
  .reservations-tabs .nav-link.active svg {
    stroke: #ffffff;
  }

  /* Filters Panel */
  .reservations-filter-card {
    background: #ffffff !important;
    border: 1px solid #f0f0f0 !important;
    border-radius: 1.25rem !important;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.02) !important;
    margin-bottom: 1.5rem !important;
  }
  .reservations-status-pill {
    border-radius: 50px !important;
    font-weight: 700 !important;
    font-size: 0.8rem !important;
    padding: 8px 16px !important;
    transition: all 0.2s ease !important;
    border: 1px solid #e2e8f0 !important;
    color: #475569 !important;
    background: #ffffff !important;
  }
  .reservations-status-pill:hover {
    border-color: #23b3f4 !important;
    color: #23b3f4 !important;
    background: #f0f9ff !important;
  }
  .reservations-status-pill.active {
    background: #23b3f4 !important;
    border-color: #23b3f4 !important;
    color: #ffffff !important;
    box-shadow: 0 4px 10px rgba(35, 179, 244, 0.2) !important;
  }

  /* Separate row cards styling */
  .reservations-table-container {
    background: transparent !important;
    border: none !important;
  }
  .reservations-table {
    border-collapse: separate !important;
    border-spacing: 0 10px !important;
  }
  .reservations-table thead th {
    border: none !important;
    background: transparent !important;
    color: #64748b !important;
    font-weight: 700 !important;
    font-size: 0.85rem !important;
    text-transform: uppercase !important;
    letter-spacing: 0.05em !important;
    padding: 0.75rem 1.5rem !important;
  }
  .reservations-row-card {
    transition: all 0.2s ease-in-out !important;
  }
  .reservations-row-card:hover {
    transform: translateY(-2px);
  }
  .reservations-row-card td {
    background: #ffffff !important;
    border-top: 1px solid #f1f5f9 !important;
    border-bottom: 1px solid #f1f5f9 !important;
    padding: 1.25rem 1.5rem !important;
    vertical-align: middle !important;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.01) !important;
  }
  .reservations-row-card td:first-child {
    border-left: 1px solid #f1f5f9 !important;
    border-top-left-radius: 1rem !important;
    border-bottom-left-radius: 1rem !important;
  }
  .reservations-row-card td:last-child {
    border-right: 1px solid #f1f5f9 !important;
    border-top-right-radius: 1rem !important;
    border-bottom-right-radius: 1rem !important;
  }

  /* Modals */
  .reservations-modal-btn-outline {
    border: 1px solid #23b3f4 !important;
    color: #23b3f4 !important;
    background-color: #fff !important;
    transition: all 0.2s ease-in-out !important;
    border-radius: 50px !important;
    font-weight: 600 !important;
  }
  .reservations-modal-btn-outline:hover {
    background-color: #23b3f4 !important;
    color: #fff !important;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(35, 179, 244, 0.25) !important;
  }
  .reservations-modal-btn-solid {
    background-color: #23b3f4 !important;
    border: 1px solid #23b3f4 !important;
    color: #fff !important;
    transition: all 0.2s ease-in-out !important;
    border-radius: 50px !important;
    font-weight: 600 !important;
  }
  .reservations-modal-btn-solid:hover {
    background-color: #179edb !important;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(35, 179, 244, 0.3) !important;
  }
  .reservations-modal-btn-success {
    background-color: #198754 !important;
    border: 1px solid #198754 !important;
    color: #fff !important;
    transition: all 0.2s ease-in-out !important;
    border-radius: 50px !important;
    font-weight: 600 !important;
  }
  .reservations-modal-btn-success:hover {
    background-color: #146c43 !important;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(25, 135, 84, 0.3) !important;
  }
  .reservations-modal-btn-danger {
    background-color: #cf2637 !important;
    border: 1px solid #cf2637 !important;
    color: #fff !important;
    transition: all 0.2s ease-in-out !important;
    border-radius: 50px !important;
    font-weight: 600 !important;
  }
  .reservations-modal-btn-danger:hover {
    background-color: #a91f2d !important;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(207, 38, 55, 0.3) !important;
  }

  .reservations-pill-input {
    border-radius: 12px !important;
    padding: 0.6rem 1.2rem !important;
    border: 1px solid #e5e7eb !important;
    background: #ffffff !important;
    transition: all 0.2s ease !important;
    font-size: 0.95rem !important;
    font-weight: 600 !important;
    color: #334155 !important;
  }
  .reservations-pill-input:focus {
    border-color: #23b3f4 !important;
    box-shadow: 0 0 0 4px rgba(35, 179, 244, 0.1) !important;
    outline: none !important;
  }

  .reservations-action-btn {
    border-radius: 50px !important;
    padding: 8px !important;
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
    transition: all 0.2s ease !important;
  }
  .reservations-action-btn:hover {
    transform: translateY(-2px);
  }
  
  /* Timeline custom scrollbar */
  .timeline-grid-wrapper::-webkit-scrollbar {
    height: 8px;
  }
  .timeline-grid-wrapper::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 10px;
  }
  .timeline-grid-wrapper::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 10px;
  }
  .timeline-grid-wrapper::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
  }
`;

// ─── Approve Modal ─────────────────────────────────────────────────────────
const ApproveModal = ({ show, reservation, onClose, onSuccess }) => {
  const [areas, setAreas] = useState([]);
  const [selectedTables, setSelected] = useState([]);
  const [managerNotes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [slotLabel, setSlotLabel] = useState('');

  useEffect(() => {
    if (!show || !reservation) return;
    setSelected([]); setNotes(''); setFetching(true);
    axios.get(`${API}/reservation/available-tables/${reservation._id}`, { headers: auth() })
      .then((r) => { setAreas(r.data.data); setSlotLabel(r.data.slot_label || ''); })
      .catch(() => toast.error('Could not load available tables.'))
      .finally(() => setFetching(false));
  }, [show, reservation]);

  const toggle = (area, tbl) => {
    setSelected((prev) => {
      const exists = prev.find((t) => t.table_id === tbl.table_id.toString());
      if (exists) return prev.filter((t) => t.table_id !== tbl.table_id.toString());
      return [...prev, { area_id: area.area_id.toString(), area_name: area.area_name, table_id: tbl.table_id.toString(), table_no: tbl.table_no, max_person: tbl.max_person }];
    });
  };

  const isSelected = (tbl) => !!selectedTables.find((t) => t.table_id === tbl.table_id.toString());
  const capacity = selectedTables.reduce((s, t) => s + t.max_person, 0);

  const handleApprove = async () => {
    if (!selectedTables.length) { toast.warning('Select at least one table.'); return; }
    setLoading(true);
    try {
      await axios.patch(`${API}/reservation/approve/${reservation._id}`, { assigned_tables: selectedTables, manager_notes: managerNotes }, { headers: auth() });
      toast.success('Approved!'); onSuccess(); onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed.');
    } finally { setLoading(false); }
  };

  if (!reservation) return null;
  return (
    <Modal show={show} onHide={onClose} size="lg" centered className="rounded-4">
      <style>{customStyles}</style>
      <Modal.Header closeButton className="border-0 pb-0">
        <Modal.Title className="fw-bold" style={{ color: '#198754' }}>
          <CsLineIcons icon="check-circle" className="me-2" />
          Approve — {reservation.customer_name}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="py-4 text-start">
        <Alert variant="light" className="border py-3 mb-4 bg-light rounded-3">
          <Row className="g-3 small fw-bold">
            <Col xs={6} md={4} className="text-muted d-flex align-items-center gap-1">
              <CsLineIcons icon="calendar" size="14" style={{ color: '#23b3f4' }} />
              {fmtDate(reservation.reservation_date)}
            </Col>
            <Col xs={6} md={4} className="text-muted d-flex align-items-center gap-1">
              <CsLineIcons icon="clock" size="14" style={{ color: '#23b3f4' }} />
              {slotLabel || `${reservation.slot_start}–${reservation.slot_end}`}
            </Col>
            <Col xs={6} md={4} className="text-muted d-flex align-items-center gap-1">
              <CsLineIcons icon="user" size="14" style={{ color: '#23b3f4' }} />
              {reservation.num_persons} guest{reservation.num_persons > 1 ? 's' : ''}
            </Col>
            {reservation.notes && (
              <Col xs={12} className="text-muted d-flex align-items-start gap-1 mt-2">
                <CsLineIcons icon="message" size="14" style={{ color: '#23b3f4' }} className="mt-1" />
                <span className="fw-medium">{reservation.notes}</span>
              </Col>
            )}
          </Row>
        </Alert>

        <h6 className="fw-bold text-dark mb-3">Assign Table(s) — free for this slot</h6>
        {fetching ? (
          <div className="text-center py-4">
            <Spinner animation="border" style={{ color: '#23b3f4' }} className="mb-2" />
            <p className="text-muted small fw-bold">Loading available tables…</p>
          </div>
        ) : areas.length === 0 ? (
          <Alert variant="warning" className="rounded-3 fw-bold">No tables available for this slot.</Alert>
        ) : (
          areas.map((area) => (
            <div key={area.area_id} className="mb-4">
              <p className="text-uppercase text-muted fw-bold mb-2 small" style={{ letterSpacing: 1 }}>{area.area_name}</p>
              <div className="d-flex flex-wrap gap-2">
                {area.tables.map((tbl) => {
                  const active = isSelected(tbl);
                  return (
                    <Button 
                      key={tbl.table_id} 
                      size="sm"
                      onClick={() => toggle(area, tbl)}
                      style={{
                        borderRadius: '50px',
                        padding: '8px 16px',
                        fontWeight: 700,
                        fontSize: '0.8rem',
                        transition: 'all 0.2s ease',
                        backgroundColor: active ? '#23b3f4' : 'transparent',
                        borderColor: active ? '#23b3f4' : '#cbd5e1',
                        color: active ? '#fff' : '#475569',
                      }}
                      className="d-flex align-items-center gap-1"
                    >
                      <CsLineIcons icon="grid-1" size="14" />
                      Table {tbl.table_no}
                      <span className="ms-1 small opacity-75">({tbl.max_person}p)</span>
                    </Button>
                  );
                })}
              </div>
            </div>
          ))
        )}

        {selectedTables.length > 0 && (
          <Alert variant={capacity < reservation.num_persons ? 'danger' : 'success'} className="py-3 mt-3 rounded-3 border-0">
            <small className="fw-bold">
              Selected: {selectedTables.map((t) => `T${t.table_no}`).join(', ')}
              &nbsp;·&nbsp; Capacity: <strong>{capacity}p</strong>
              {capacity < reservation.num_persons && <span className="text-danger ms-2">⚠ Below required {reservation.num_persons}</span>}
            </small>
          </Alert>
        )}

        <Form.Group className="mt-4">
          <Form.Label className="small fw-bold text-muted text-uppercase mb-2">Note to Customer (optional)</Form.Label>
          <Form.Control 
            as="textarea" 
            rows={2} 
            placeholder="e.g. Please arrive 10 min early." 
            value={managerNotes} 
            onChange={(e) => setNotes(e.target.value)} 
            className="reservations-pill-input shadow-sm bg-white"
            style={{ resize: 'none', borderRadius: '12px' }}
          />
        </Form.Group>
      </Modal.Body>
      <Modal.Footer className="border-0 pt-0">
        <Button className='reservations-modal-btn-outline px-4 py-2' variant="outline-light" onClick={onClose}>Cancel</Button>
        <Button className='reservations-modal-btn-success px-5 py-2' variant="success" onClick={handleApprove} disabled={loading || !selectedTables.length}>
          {loading ? 'Approving…' : <><CsLineIcons icon="check" size="18" className="me-1" />Approve</>}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

// ─── Reject Modal ──────────────────────────────────────────────────────────
const RejectModal = ({ show, reservation, onClose, onSuccess }) => {
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReject = async () => {
    setLoading(true);
    try {
      await axios.patch(`${API}/reservation/reject/${reservation._id}`, { manager_notes: note }, { headers: auth() });
      toast.success('Rejected.'); onSuccess(); onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed.');
    } finally { setLoading(false); }
  };

  if (!reservation) return null;
  return (
    <Modal show={show} onHide={onClose} centered className="rounded-4">
      <style>{customStyles}</style>
      <Modal.Header closeButton className="border-0 pb-0">
        <Modal.Title className="fw-bold text-danger">Reject Reservation</Modal.Title>
      </Modal.Header>
      <Modal.Body className="py-4 text-start">
        <p className="text-muted fw-bold">Rejecting for <strong>{reservation.customer_name}</strong> on {fmtDate(reservation.reservation_date)}, {reservation.slot_start}–{reservation.slot_end}.</p>
        <Form.Group className="mt-3">
          <Form.Label className="small fw-bold text-muted text-uppercase mb-2">Reason (optional)</Form.Label>
          <Form.Control 
            as="textarea" 
            rows={3} 
            placeholder="e.g. Fully booked for that slot." 
            value={note} 
            onChange={(e) => setNote(e.target.value)} 
            className="reservations-pill-input shadow-sm bg-white"
            style={{ resize: 'none', borderRadius: '12px' }}
          />
        </Form.Group>
      </Modal.Body>
      <Modal.Footer className="border-0 pt-0">
        <Button className='reservations-modal-btn-outline px-4 py-2' variant="outline-light" onClick={onClose}>Cancel</Button>
        <Button className='reservations-modal-btn-danger px-5 py-2' onClick={handleReject} disabled={loading}>{loading ? 'Rejecting…' : 'Reject'}</Button>
      </Modal.Footer>
    </Modal>
  );
};

// ─── Timeline Grid ─────────────────────────────────────────────────────────
const TimelineGrid = ({ date }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeGroup, setActiveGroup] = useState(null);

  const fetchTimeline = useCallback(() => {
    if (!date) return;
    setLoading(true);
    setData(null);
    axios.get(`${API}/reservation/timeline`, { params: { date }, headers: auth() })
      .then((r) => {
        const d = r.data.data;
        setData(d);
        if (d?.groups?.length) setActiveGroup(d.groups[0].group_id);
      })
      .catch(() => toast.error('Failed to load timeline.'))
      .finally(() => setLoading(false));
  }, [date]);

  useEffect(() => { fetchTimeline(); }, [fetchTimeline]);

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" style={{ color: '#23b3f4' }} className="mb-2" />
        <p className="text-muted fw-bold">Loading timeline…</p>
      </div>
    );
  }
  if (!data) return null;

  const { groups, areas } = data;

  if (!groups || groups.length === 0) {
    return <Alert variant="info" className="rounded-3 fw-bold text-start">No service periods configured. Add periods in the Slot Settings tab.</Alert>;
  }

  const currentGroup = groups.find((g) => g.group_id === activeGroup) || groups[0];
  const periodSlots = currentGroup?.slots || [];

  return (
    <div className="text-start">
      <div className="d-flex flex-wrap gap-2 mb-4">
        {groups.map((g) => {
          const isActive = activeGroup === g.group_id;
          return (
            <Button
              key={g.group_id}
              size="sm"
              onClick={() => setActiveGroup(g.group_id)}
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
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: isActive ? '#fff' : (g.color || '#6b7280'), display: 'inline-block' }} />
              {g.name}
            </Button>
          );
        })}
      </div>

      {periodSlots.length === 0 ? (
        <Alert variant="light" className="border rounded-3 fw-bold text-center py-4">No slots in this period for the selected date.</Alert>
      ) : (
        <div className="timeline-grid-wrapper" style={{ overflowX: 'auto', borderRadius: '1rem', border: '1px solid #f1f5f9' }}>
          <Table bordered size="sm" className="mb-0" style={{ minWidth: Math.max(600, periodSlots.length * 88 + 120), borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th
                  colSpan={periodSlots.length + 1}
                  style={{ background: currentGroup.color || '#23b3f4', color: '#fff', fontSize: 13, fontWeight: 700, padding: '12px 16px', border: 'none' }}
                >
                  {currentGroup.name} &nbsp;·&nbsp; {periodSlots[0]?.slot_start || '–'} – {periodSlots[periodSlots.length - 1]?.slot_end || '–'}
                </th>
              </tr>
              <tr className="table-light" style={{ background: '#f8fafc' }}>
                <th style={{ minWidth: 110, position: 'sticky', left: 0, background: '#f8fafc', zIndex: 1, padding: '10px 14px', border: '1px solid #eef2f6', fontWeight: 700, color: '#475569', fontSize: 11, textTransform: 'uppercase' }}>Table</th>
                {periodSlots.map((s) => (
                  <th key={s.slot_start} className="text-center" style={{ minWidth: 80, fontSize: 11, padding: '10px 14px', border: '1px solid #eef2f6', fontWeight: 700, color: '#475569' }}>
                    <div>{s.slot_start}</div>
                    <div className="text-muted" style={{ fontSize: 9 }}>–{s.slot_end}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(areas || []).map((area) => (
                <React.Fragment key={area.area_id}>
                  <tr>
                    <td colSpan={periodSlots.length + 1} className="bg-light py-2 px-3" style={{ border: '1px solid #eef2f6' }}>
                      <small className="text-uppercase text-muted fw-bold" style={{ letterSpacing: 1, fontSize: 10 }}>
                        {area.area_name}
                      </small>
                    </td>
                  </tr>
                  {(area.tables || []).map((tbl) => (
                    <tr key={tbl.table_id}>
                      <td style={{ position: 'sticky', left: 0, background: '#fff', zIndex: 1, fontSize: 13, padding: '10px 14px', border: '1px solid #eef2f6' }}>
                        <div className="fw-bold text-dark">T{tbl.table_no}</div>
                        <small className="text-muted fw-medium">{tbl.max_person}p</small>
                      </td>
                      {periodSlots.map((s) => {
                        const cellKey = `${currentGroup.group_id}::${s.slot_start}`;
                        const booking = tbl.slots?.[cellKey];
                        return (
                          <td key={s.slot_start} className="p-1 text-center" style={{ verticalAlign: 'middle', border: '1px solid #eef2f6' }}>
                            {booking ? (
                              <OverlayTrigger
                                placement="top"
                                overlay={
                                  <Tooltip>
                                    {booking.customer_name} · {booking.num_persons}p
                                    <br />{STATUS_META[booking.status]?.label}
                                    {booking.group_name && <><br />{booking.group_name}</>}
                                  </Tooltip>
                                }
                              >
                                <div
                                  className="rounded text-white d-flex align-items-center justify-content-center fw-bold"
                                  style={{
                                    background: STATUS_COLORS[booking.status] || '#6c757d',
                                    height: 36, fontSize: 10, cursor: 'default',
                                    overflow: 'hidden', padding: '0 4px',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                                  }}
                                >
                                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {booking.customer_name.split(' ')[0]}
                                  </span>
                                </div>
                              </OverlayTrigger>
                            ) : (
                              <div style={{ height: 36 }} />
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </Table>
        </div>
      )}

      {/* Legend */}
      <div className="d-flex gap-4 mt-4 flex-wrap">
        {Object.entries(STATUS_COLORS).map(([status, color]) => (
          <div key={status} className="d-flex align-items-center gap-2">
            <div style={{ width: 14, height: 14, background: color, borderRadius: 4 }} />
            <small className="text-muted fw-bold" style={{ fontSize: '0.8rem' }}>{STATUS_META[status]?.label}</small>
          </div>
        ))}
      </div>
    </div>
  );
};


// ─── Main Dashboard ────────────────────────────────────────────────────────
const ManageReservations = () => {
  const title = 'Manage Reservations';
  const breadcrumbs = [
    { to: '', text: 'Home' },
    { to: 'operations', text: 'Operations' },
    { to: 'operations/manage-reservations', title: 'Manage Reservations' },
  ];

  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [dateFilter, setDateFilter] = useState(todayStr());
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [timelineDate, setTimelineDate] = useState(todayStr());

  const [approveTarget, setApproveTarget] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [activeTab, setActiveTab] = useState('list');

  const STATUS_FILTERS = ['pending', 'approved', 'reserved', 'seated', 'completed', 'rejected', 'cancelled', 'no_show', 'all'];

  const fetchReservations = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 20 });
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (dateFilter) params.set('date', dateFilter);
      const res = await axios.get(`${API}/reservation/all?${params}`, { headers: auth() });
      setReservations(res.data.data);
      setPagination(res.data.pagination);
    } catch { toast.error('Failed to load reservations.'); }
    finally { setLoading(false); }
  }, [statusFilter, dateFilter]);

  useEffect(() => { fetchReservations(1); }, [fetchReservations]);

  const quickAction = async (endpoint, id, msg) => {
    try {
      await axios.patch(`${API}/reservation/${endpoint}/${id}`, {}, { headers: auth() });
      toast.success(msg);
      fetchReservations(pagination.page);
    } catch (err) { toast.error(err.response?.data?.message || 'Action failed.'); }
  };

  const ActionButtons = ({ r }) => (
    <div className="d-flex gap-1 flex-wrap">
      {r.status === 'pending' && <>
        <Button 
          size="sm" 
          variant="success" 
          title="Approve" 
          className='reservations-action-btn btn btn-success' 
          onClick={() => setApproveTarget(r)}
        >
          <CsLineIcons icon="check" size="14" style={{ stroke: '#fff' }} />
        </Button>
        <Button 
          size="sm" 
          variant="outline-danger" 
          title="Reject" 
          className='reservations-action-btn btn btn-outline-danger' 
          style={{ border: '1px solid #cf2637', color: '#cf2637' }}
          onClick={() => setRejectTarget(r)}
        >
          <CsLineIcons icon="close" size="14" />
        </Button>
      </>}
      {r.status === 'approved' && <>
        <Button 
          size="sm" 
          variant="info" 
          title="Activate (Reserve Tables)" 
          className='reservations-action-btn btn btn-info' 
          style={{ backgroundColor: '#23b3f4', borderColor: '#23b3f4' }}
          onClick={() => quickAction('activate', r._id, 'Tables reserved!')}
        >
          <CsLineIcons icon="bookmark" size="14" style={{ stroke: '#fff' }} />
        </Button>
        <Button 
          size="sm" 
          variant="outline-danger" 
          title="Cancel" 
          className='reservations-action-btn btn btn-outline-danger' 
          style={{ border: '1px solid #cf2637', color: '#cf2637' }}
          onClick={() => quickAction('cancel', r._id, 'Cancelled.')}
        >
          <CsLineIcons icon="slash" size="14" />
        </Button>
      </>}
      {r.status === 'reserved' && <>
        <Button 
          size="sm" 
          variant="primary" 
          title="Seat" 
          className='reservations-action-btn btn btn-primary' 
          style={{ backgroundColor: '#0d6efd', borderColor: '#0d6efd' }}
          onClick={() => quickAction('seat', r._id, 'Customer seated!')}
        >
          <CsLineIcons icon="check-circle" size="14" style={{ stroke: '#fff' }} />
        </Button>
        <Button 
          size="sm" 
          variant="outline-secondary" 
          title="No-Show" 
          className='reservations-action-btn btn btn-outline-secondary' 
          style={{ border: '1px solid #64748b', color: '#64748b' }}
          onClick={() => quickAction('no-show', r._id, 'Marked no-show.')}
        >
          <CsLineIcons icon="close-circle" size="14" />
        </Button>
      </>}
      {r.status === 'seated' && (
        <Button 
          size="sm" 
          variant="secondary" 
          title="Complete" 
          className='reservations-action-btn btn btn-secondary' 
          style={{ backgroundColor: '#475569', borderColor: '#475569' }}
          onClick={() => quickAction('complete', r._id, 'Completed!')}
        >
          <CsLineIcons icon="check-square" size="14" style={{ stroke: '#fff' }} />
        </Button>
      )}
    </div>
  );

  const pendingCount = reservations.filter((r) => r.status === 'pending').length;

  return (
    <>
      <HtmlHead title={title} />
      <style>{customStyles}</style>

      <div className="container-fluid px-lg-5 pb-5 text-start">
        <div className="page-title-container mb-4 mt-5 mt-lg-0">
          <Row className="g-0 align-items-center">
            <Col xs="12" md="8">
              <h1 className="mb-0 pb-0 display-4 fw-bold" style={{ color: '#23b3f4' }}>{title}</h1>
              <BreadcrumbList items={breadcrumbs} />
            </Col>
            <Col xs="12" md="4" className="text-end mt-3 mt-md-0">
              <Button 
                className='reservations-modal-btn-outline px-4 py-2 d-inline-flex align-items-center gap-2' 
                onClick={() => fetchReservations(pagination.page)}
              >
                <CsLineIcons icon="refresh-horizontal" size="18" /> Refresh
              </Button>
            </Col>
          </Row>
        </div>

        <Tab.Container defaultActiveKey="list" onSelect={(k) => setActiveTab(k)}>
          <Nav variant="tabs" className="reservations-tabs mb-4">
            <Nav.Item>
              <Nav.Link eventKey="list">
                <CsLineIcons icon="list" size="18" /> Reservations
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="timeline">
                <CsLineIcons icon="grid-1" size="18" /> Timeline Grid
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="config">
                <CsLineIcons icon="settings-1" size="18" /> Slot Settings
              </Nav.Link>
            </Nav.Item>
          </Nav>

          <Tab.Content>
            
            {/* ── LIST TAB ── */}
            <Tab.Pane eventKey="list">
              {/* Filters */}
              <Card className="reservations-filter-card border-0 p-4">
                <Card.Body className="p-0">
                  <Row className="g-4 align-items-end">
                    <Col xs={12} lg={8}>
                      <span className="small fw-bold text-muted text-uppercase mb-2 d-block" style={{ letterSpacing: '0.05em' }}>Status Filter</span>
                      <div className="d-flex flex-wrap gap-2">
                        {STATUS_FILTERS.map((s) => {
                          const isActive = statusFilter === s;
                          return (
                            <Button 
                              key={s} 
                              className={`reservations-status-pill ${isActive ? 'active' : ''}`}
                              onClick={() => setStatusFilter(s)}
                            >
                              {s === 'all' ? 'All' : STATUS_META[s]?.label || s}
                              {s === 'pending' && pendingCount > 0 && (
                                <Badge bg="danger" pill className="ms-2" style={{ fontSize: 9 }}>{pendingCount}</Badge>
                              )}
                            </Button>
                          );
                        })}
                      </div>
                    </Col>
                    
                    <Col xs={12} sm={8} lg={3}>
                      <Form.Label className="small fw-bold text-muted text-uppercase mb-2" style={{ letterSpacing: '0.05em' }}>Date</Form.Label>
                      <Form.Control 
                        type="date" 
                        value={dateFilter} 
                        onChange={(e) => setDateFilter(e.target.value)} 
                        className="reservations-pill-input shadow-sm bg-white w-100"
                        style={{ height: '44px' }}
                      />
                    </Col>
                    
                    <Col xs={12} sm={4} lg={1}>
                      <Button 
                        className="reservations-modal-btn-outline w-100 py-2 d-flex align-items-center justify-content-center"
                        style={{ height: '44px' }}
                        onClick={() => { setDateFilter(''); setStatusFilter('pending'); }}
                      >
                        Reset
                      </Button>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>

              {/* Table */}
              <Card className="reservations-table-container border-0 bg-transparent mb-4">
                {loading ? (
                  <div className="text-center py-5">
                    <Spinner animation="border" style={{ color: '#23b3f4' }} className="mb-2" />
                    <p className="text-muted fw-bold">Loading reservations…</p>
                  </div>
                ) : reservations.length === 0 ? (
                  <Card className="border-0 shadow-sm text-center py-5 rounded-4 bg-white">
                    <Card.Body>
                      <div className="mb-3">
                        <CsLineIcons icon="inbox" size="48" className="text-muted opacity-50" />
                      </div>
                      <h5 className="text-muted fw-bold">No reservations found</h5>
                      <p className="text-muted small mb-0">Try adjusting your filters or date selection.</p>
                    </Card.Body>
                  </Card>
                ) : (
                  <div className="table-responsive">
                    <Table hover className="reservations-table mb-0">
                      <thead>
                        <tr>
                          <th>Customer</th>
                          <th>Date</th>
                          <th>Time Slot</th>
                          <th>Guests</th>
                          <th>Tables</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reservations.map((r) => (
                          <tr key={r._id} className="reservations-row-card">
                            <td>
                              <div className="fw-bold text-dark">{r.customer_name}</div>
                              <small className="text-muted fw-medium">{r.customer_phone}</small>
                            </td>
                            <td><small className="fw-bold text-alternate">{fmtDate(r.reservation_date)}</small></td>
                            <td>
                              {r.group_name && (
                                <Badge bg="light" text="dark" className="border mb-2 d-inline-flex align-items-center gap-1 fw-bold text-secondary px-2 py-1" style={{ fontSize: 10, borderRadius: '50px' }}>
                                  {r.group_name}
                                </Badge>
                              )}
                              <div>
                                <Badge bg="light" text="dark" className="border fw-bold text-alternate px-2 py-1" style={{ borderRadius: '50px' }}>
                                  <CsLineIcons icon="clock" size={11} className="me-1" style={{ stroke: '#23b3f4' }} />
                                  {r.slot_start} – {r.slot_end}
                                </Badge>
                              </div>
                              <div style={{ fontSize: 10 }} className="text-muted mt-1 fw-medium">{r.slots?.length} slot{r.slots?.length > 1 ? 's' : ''}</div>
                            </td>
                            <td>
                              <div className="d-flex align-items-center gap-1 fw-bold text-dark">
                                <CsLineIcons icon="user" size={14} style={{ color: '#23b3f4' }} />
                                {r.num_persons}
                              </div>
                            </td>
                            <td>
                              {r.assigned_tables?.length ? (
                                <div className="d-flex flex-wrap gap-1">
                                  {r.assigned_tables.map((t) => (
                                    <Badge key={t.table_id} bg="light" text="dark" className="border fw-bold text-dark px-2 py-1" style={{ borderRadius: '50px' }}>
                                      {t.area_name} · T{t.table_no}
                                    </Badge>
                                  ))}
                                </div>
                              ) : <span className="text-muted small fw-medium">—</span>}
                            </td>
                            <td>
                              <Badge bg={STATUS_META[r.status]?.variant || 'secondary'} style={{ borderRadius: '50px', padding: '6px 14px', fontSize: '0.8rem' }}>
                                {r.auto_activated && r.status === 'reserved' && '⚡ '}
                                {STATUS_META[r.status]?.label || r.status}
                              </Badge>
                            </td>
                            <td><ActionButtons r={r} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                )}
              </Card>

              {pagination.pages > 1 && (
                <div className="d-flex justify-content-center align-items-center gap-3 mb-4">
                  <Button 
                    size="sm" 
                    variant="outline-secondary" 
                    className='reservations-action-btn btn btn-outline-secondary' 
                    disabled={pagination.page === 1} 
                    onClick={() => fetchReservations(pagination.page - 1)}
                  >
                    <CsLineIcons icon="chevron-left" size="14" />
                  </Button>
                  <span className="align-self-center small text-muted fw-bold">Page {pagination.page} of {pagination.pages}</span>
                  <Button 
                    size="sm" 
                    variant="outline-secondary" 
                    className='reservations-action-btn btn btn-outline-secondary' 
                    disabled={pagination.page === pagination.pages} 
                    onClick={() => fetchReservations(pagination.page + 1)}
                  >
                    <CsLineIcons icon="chevron-right" size="14" />
                  </Button>
                </div>
              )}
            </Tab.Pane>

            {/* ── TIMELINE TAB ── */}
            <Tab.Pane eventKey="timeline">
              <Card className="reservations-filter-card border-0 p-4">
                <Card.Body className="p-0">
                  <Row className="g-3 align-items-center">
                    <Col xs="auto">
                      <Form.Group className="d-flex align-items-center gap-3">
                        <Form.Label className="small fw-bold text-muted text-uppercase mb-0" style={{ letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>Timeline Date</Form.Label>
                        <Form.Control 
                          type="date" 
                          value={timelineDate} 
                          onChange={(e) => setTimelineDate(e.target.value)} 
                          className="reservations-pill-input shadow-sm bg-white"
                          style={{ height: '40px', width: '180px' }}
                        />
                      </Form.Group>
                    </Col>
                    <Col xs="auto" className="ms-md-auto">
                      <p className="text-muted small mb-0 fw-medium">
                        Visual slot × table grid. Hover cells to see customer details.
                      </p>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
              <Card className="reservations-filter-card border-0 p-4">
                <Card.Body className="p-0">
                  <TimelineGrid date={timelineDate} />
                </Card.Body>
              </Card>
            </Tab.Pane>

            {/* ── CONFIG TAB ── */}
            <Tab.Pane eventKey="config">
              <Card className="reservations-filter-card border-0 p-4">
                <Card.Body className="p-0">
                  <SlotConfigPanel onSaved={() => fetchReservations(1)} active={activeTab === 'config'} />
                </Card.Body>
              </Card>
            </Tab.Pane>

          </Tab.Content>
        </Tab.Container>
      </div>

      <ApproveModal show={!!approveTarget} reservation={approveTarget} onClose={() => setApproveTarget(null)} onSuccess={() => fetchReservations(pagination.page)} />
      <RejectModal show={!!rejectTarget} reservation={rejectTarget} onClose={() => setRejectTarget(null)} onSuccess={() => fetchReservations(pagination.page)} />
    </>
  );
};

export default ManageReservations;