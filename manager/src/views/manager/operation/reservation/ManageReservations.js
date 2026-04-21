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
  reserved: '#0dcaf0',
  seated: '#0d6efd',
};

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
    <Modal show={show} onHide={onClose} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>
          <CsLineIcons icon="check-circle" className="me-2 text-success" />
          Approve — {reservation.customer_name}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Alert variant="light" className="border py-2 mb-3">
          <Row className="g-1 small">
            <Col xs={6} className="text-muted"><CsLineIcons icon="calendar" className="me-1" />{fmtDate(reservation.reservation_date)}</Col>
            <Col xs={6} className="text-muted"><CsLineIcons icon="clock" className="me-1" />{slotLabel || `${reservation.slot_start}–${reservation.slot_end}`}</Col>
            <Col xs={6} className="text-muted"><CsLineIcons icon="user" className="me-1" />{reservation.num_persons} guest{reservation.num_persons > 1 ? 's' : ''}</Col>
            {reservation.notes && <Col xs={12} className="text-muted"><CsLineIcons icon="message" className="me-1" />{reservation.notes}</Col>}
          </Row>
        </Alert>

        <h6 className="fw-semibold mb-2">Assign Table(s) — free for this slot</h6>
        {fetching ? (
          <div className="text-center py-3"><Spinner size="sm" /> Loading…</div>
        ) : areas.length === 0 ? (
          <Alert variant="warning">No tables available for this slot.</Alert>
        ) : (
          areas.map((area) => (
            <div key={area.area_id} className="mb-3">
              <p className="text-uppercase text-muted mb-2" style={{ fontSize: 10, letterSpacing: 1 }}>{area.area_name}</p>
              <div className="d-flex flex-wrap gap-2">
                {area.tables.map((tbl) => (
                  <Button key={tbl.table_id} size="sm"
                    variant={isSelected(tbl) ? 'primary' : 'outline-secondary'}
                    onClick={() => toggle(area, tbl)}
                    className='btn-icon'
                  >
                    <CsLineIcons icon="grid-1" className="me-1" />
                    Table {tbl.table_no}
                    <span className="ms-1 small opacity-75">({tbl.max_person}p)</span>
                  </Button>
                ))}
              </div>
            </div>
          ))
        )}

        {selectedTables.length > 0 && (
          <Alert variant="success" className="py-2 mt-2">
            <small>
              Selected: {selectedTables.map((t) => `T${t.table_no}`).join(', ')}
              &nbsp;·&nbsp; Capacity: <strong>{capacity}p</strong>
              {capacity < reservation.num_persons && <span className="text-danger ms-2">⚠ Below required {reservation.num_persons}</span>}
            </small>
          </Alert>
        )}

        <Form.Group className="mt-3">
          <Form.Label className="small fw-semibold">Note to Customer (optional)</Form.Label>
          <Form.Control as="textarea" rows={2} placeholder="e.g. Please arrive 10 min early." value={managerNotes} onChange={(e) => setNotes(e.target.value)} />
        </Form.Group>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={onClose}>Cancel</Button>
        <Button variant="success" onClick={handleApprove} disabled={loading || !selectedTables.length}>
          {loading ? 'Approving…' : <><CsLineIcons icon="check" className="me-1" />Approve</>}
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
    <Modal show={show} onHide={onClose} centered>
      <Modal.Header closeButton><Modal.Title className="text-danger">Reject Reservation</Modal.Title></Modal.Header>
      <Modal.Body>
        <p className="text-muted">Rejecting for <strong>{reservation.customer_name}</strong> on {fmtDate(reservation.reservation_date)}, {reservation.slot_start}–{reservation.slot_end}.</p>
        <Form.Group>
          <Form.Label className="small fw-semibold">Reason (optional)</Form.Label>
          <Form.Control as="textarea" rows={3} placeholder="e.g. Fully booked for that slot." value={note} onChange={(e) => setNote(e.target.value)} />
        </Form.Group>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={onClose}>Cancel</Button>
        <Button variant="danger" onClick={handleReject} disabled={loading}>{loading ? 'Rejecting…' : 'Reject'}</Button>
      </Modal.Footer>
    </Modal>
  );
};

// ─── Timeline Grid ─────────────────────────────────────────────────────────
const TimelineGrid = ({ date }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeGroup, setActiveGroup] = useState(null); // selected period tab

  const fetchTimeline = useCallback(() => {
    if (!date) return;
    setLoading(true);
    setData(null);
    axios.get(`${API}/reservation/timeline`, { params: { date }, headers: auth() })
      .then((r) => {
        const d = r.data.data;
        setData(d);
        // Auto-select first group
        if (d?.groups?.length) setActiveGroup(d.groups[0].group_id);
      })
      .catch(() => toast.error('Failed to load timeline.'))
      .finally(() => setLoading(false));
  }, [date]);

  useEffect(() => { fetchTimeline(); }, [fetchTimeline]);

  if (loading) return <div className="text-center py-5"><Spinner /> Loading timeline…</div>;
  if (!data) return null;

  const { groups, areas } = data;

  // Guard: no groups configured yet
  if (!groups || groups.length === 0) {
    return <Alert variant="info">No service periods configured. Add periods in the Slot Settings tab.</Alert>;
  }

  const currentGroup = groups.find((g) => g.group_id === activeGroup) || groups[0];
  // Slots for the selected period
  const periodSlots = currentGroup?.slots || [];

  return (
    <div>
      {/* Period tabs */}
      <div className="d-flex flex-wrap gap-2 mb-3">
        {groups.map((g) => (
          <Button
            key={g.group_id}
            size="sm"
            variant={activeGroup === g.group_id ? 'primary' : 'outline-secondary'}
            onClick={() => setActiveGroup(g.group_id)}
            style={activeGroup === g.group_id ? { background: g.color, borderColor: g.color } : {}}
            className="btn-icon d-flex align-items-center gap-1"
          >
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: activeGroup === g.group_id ? '#fff' : (g.color || '#6b7280'), display: 'inline-block' }} />
            {g.name}
          </Button>
        ))}
      </div>

      {periodSlots.length === 0 ? (
        <Alert variant="light" className="border">No slots in this period for the selected date.</Alert>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <Table bordered size="sm" className="mb-0" style={{ minWidth: Math.max(600, periodSlots.length * 88 + 120) }}>
            <thead>
              {/* Period header row */}
              <tr>
                <th
                  colSpan={periodSlots.length + 1}
                  style={{ background: currentGroup.color || '#6b7280', color: '#fff', fontSize: 12, letterSpacing: 1, padding: '6px 10px' }}
                >
                  {currentGroup.name} &nbsp;·&nbsp; {periodSlots[0]?.slot_start || '–'} – {periodSlots[periodSlots.length - 1]?.slot_end || '–'}
                </th>
              </tr>
              {/* Slot time headers */}
              <tr className="table-light">
                <th style={{ minWidth: 110, position: 'sticky', left: 0, background: '#f8f9fa', zIndex: 1 }}>Table</th>
                {periodSlots.map((s) => (
                  <th key={s.slot_start} className="text-center" style={{ minWidth: 80, fontSize: 11 }}>
                    <div>{s.slot_start}</div>
                    <div className="text-muted" style={{ fontSize: 10 }}>–{s.slot_end}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(areas || []).map((area) => (
                <React.Fragment key={area.area_id}>
                  <tr>
                    <td colSpan={periodSlots.length + 1} className="bg-light py-1">
                      <small className="text-uppercase text-muted fw-semibold" style={{ letterSpacing: 1, fontSize: 10 }}>
                        {area.area_name}
                      </small>
                    </td>
                  </tr>
                  {(area.tables || []).map((tbl) => (
                    <tr key={tbl.table_id}>
                      <td style={{ position: 'sticky', left: 0, background: '#fff', zIndex: 1, fontSize: 13 }}>
                        <div className="fw-semibold">T{tbl.table_no}</div>
                        <small className="text-muted">{tbl.max_person}p</small>
                      </td>
                      {periodSlots.map((s) => {
                        // Key in grid is "groupId::slotStart"
                        const cellKey = `${currentGroup.group_id}::${s.slot_start}`;
                        const booking = tbl.slots?.[cellKey];
                        return (
                          <td key={s.slot_start} className="p-1 text-center" style={{ verticalAlign: 'middle' }}>
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
                                  className="rounded text-white d-flex align-items-center justify-content-center"
                                  style={{
                                    background: STATUS_COLORS[booking.status] || '#6c757d',
                                    height: 36, fontSize: 10, cursor: 'default',
                                    overflow: 'hidden', padding: '0 4px',
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
      <div className="d-flex gap-3 mt-3 flex-wrap">
        {Object.entries(STATUS_COLORS).map(([status, color]) => (
          <div key={status} className="d-flex align-items-center gap-1">
            <div style={{ width: 12, height: 12, background: color, borderRadius: 3 }} />
            <small className="text-muted">{STATUS_META[status]?.label}</small>
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

  // ── fetch list ─────────────────────────────────────────────────────────
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

  // ── quick action ───────────────────────────────────────────────────────
  const quickAction = async (endpoint, id, msg) => {
    try {
      await axios.patch(`${API}/reservation/${endpoint}/${id}`, {}, { headers: auth() });
      toast.success(msg);
      fetchReservations(pagination.page);
    } catch (err) { toast.error(err.response?.data?.message || 'Action failed.'); }
  };

  // ── per-row action buttons ─────────────────────────────────────────────
  const ActionButtons = ({ r }) => (
    <div className="d-flex gap-1 flex-wrap">
      {r.status === 'pending' && <>
        <Button size="sm" variant="success" title="Approve" className='btn-icon' onClick={() => setApproveTarget(r)}><CsLineIcons icon="check" /></Button>
        <Button size="sm" variant="outline-danger" title="Reject" className='btn-icon' onClick={() => setRejectTarget(r)}><CsLineIcons icon="close" /></Button>
      </>}
      {r.status === 'approved' && <>
        <Button size="sm" variant="info" title="Activate (Reserve Tables)" className='btn-icon' onClick={() => quickAction('activate', r._id, 'Tables reserved!')}><CsLineIcons icon="bookmark" /></Button>
        <Button size="sm" variant="outline-danger" title="Cancel" className='btn-icon' onClick={() => quickAction('cancel', r._id, 'Cancelled.')}><CsLineIcons icon="slash" /></Button>
      </>}
      {r.status === 'reserved' && <>
        <Button size="sm" variant="primary" title="Seat" className='btn-icon' onClick={() => quickAction('seat', r._id, 'Customer seated!')}><CsLineIcons icon="check-circle" /></Button>
        <Button size="sm" variant="outline-secondary" title="No-Show" className='btn-icon' onClick={() => quickAction('no-show', r._id, 'Marked no-show.')}><CsLineIcons icon="close-circle" /></Button>
      </>}
      {r.status === 'seated' && (
        <Button size="sm" variant="secondary" title="Complete" className='btn-icon' onClick={() => quickAction('complete', r._id, 'Completed!')}><CsLineIcons icon="check-square" /></Button>
      )}
    </div>
  );

  const pendingCount = reservations.filter((r) => r.status === 'pending').length;

  return (
    <>
      <HtmlHead title={title} />
      <Row>
        <Col>
          <div className="page-title-container mb-4">
            <Row className="align-items-center">
              <Col xs="12" md="8">
                <h1 className="mb-0 pb-0 display-4">{title}</h1>
                <BreadcrumbList items={breadcrumbs} />
              </Col>
              <Col xs="12" md="4" className="text-end">
                <Button className='btn-icon' variant="outline-primary" size="sm" onClick={() => fetchReservations(pagination.page)}>
                  <CsLineIcons icon="refresh-horizontal" className="me-1" /> Refresh
                </Button>
              </Col>
            </Row>
          </div>

          <Tab.Container defaultActiveKey="list" onSelect={(k) => setActiveTab(k)}>
            <Nav variant="tabs" className="mb-3">
              <Nav.Item><Nav.Link eventKey="list"><CsLineIcons icon="list" className="me-1" />Reservations</Nav.Link></Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="timeline">
                  <CsLineIcons icon="grid-1" className="me-1" />Timeline Grid
                </Nav.Link>
              </Nav.Item>
              <Nav.Item><Nav.Link eventKey="config"><CsLineIcons icon="settings-1" className="me-1" />Slot Settings</Nav.Link></Nav.Item>
            </Nav>

            <Tab.Content>

              {/* ── LIST TAB ── */}
              <Tab.Pane eventKey="list">
                {/* Filters */}
                <Card body className="mb-3">
                  <Row className="g-2 align-items-end">
                    <Col xs={12} md={7}>
                      <div className="text-muted text-uppercase mb-1" style={{ fontSize: 10, letterSpacing: 1 }}>Status</div>
                      <div className="d-flex flex-wrap gap-1">
                        {STATUS_FILTERS.map((s) => (
                          <Button key={s} size="sm"
                            variant={statusFilter === s ? 'primary' : 'outline-secondary'}
                            onClick={() => setStatusFilter(s)}
                            className="btn-icon position-relative"
                          >
                            {s === 'all' ? 'All' : STATUS_META[s]?.label || s}
                            {s === 'pending' && pendingCount > 0 && (
                              <Badge bg="danger" pill className="position-absolute top-0 start-100 translate-middle" style={{ fontSize: 9 }}>{pendingCount}</Badge>
                            )}
                          </Button>
                        ))}
                      </div>
                    </Col>
                    <Col xs={12} md={3}>
                      <Form.Label className="text-muted text-uppercase mb-1" style={{ fontSize: 10, letterSpacing: 1 }}>Date</Form.Label>
                      <Form.Control type="date" size="sm" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} />
                    </Col>
                    <Col xs={12} md={2}>
                      <Button size="sm" variant="outline-secondary" className="btn-icon w-100" onClick={() => { setDateFilter(''); setStatusFilter('pending'); }}>
                        Clear
                      </Button>
                    </Col>
                  </Row>
                </Card>

                {/* Table */}
                <Card className="mb-4">
                  {loading ? (
                    <div className="text-center py-5"><Spinner /> Loading…</div>
                  ) : reservations.length === 0 ? (
                    <Alert variant="info" className="m-3 text-center">
                      <CsLineIcons icon="inbox" size={24} className="me-2" /> No reservations found.
                    </Alert>
                  ) : (
                    <div className="table-responsive">
                      <Table hover className="mb-0">
                        <thead className="table-light">
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
                            <tr key={r._id}>
                              <td>
                                <div className="fw-semibold">{r.customer_name}</div>
                                <small className="text-muted">{r.customer_phone}</small>
                              </td>
                              <td><small>{fmtDate(r.reservation_date)}</small></td>
                              <td>
                                {r.group_name && (
                                  <Badge bg="light" text="dark" className="border mb-1 d-inline-flex align-items-center gap-1" style={{ fontSize: 11 }}>
                                    {r.group_name}
                                  </Badge>
                                )}
                                <div>
                                  <Badge bg="light" text="dark" className="border fw-normal">
                                    <CsLineIcons icon="clock" size={11} className="me-1" />
                                    {r.slot_start} – {r.slot_end}
                                  </Badge>
                                </div>
                                <div style={{ fontSize: 10 }} className="text-muted mt-1">{r.slots?.length} slot{r.slots?.length > 1 ? 's' : ''}</div>
                              </td>
                              <td><CsLineIcons icon="user" size={13} className="me-1 text-muted" />{r.num_persons}</td>
                              <td>
                                {r.assigned_tables?.length ? (
                                  <div className="d-flex flex-wrap gap-1">
                                    {r.assigned_tables.map((t) => (
                                      <Badge key={t.table_id} bg="light" text="dark" className="border">
                                        {t.area_name} · T{t.table_no}
                                      </Badge>
                                    ))}
                                  </div>
                                ) : <span className="text-muted small">—</span>}
                              </td>
                              <td>
                                <Badge bg={STATUS_META[r.status]?.variant || 'secondary'} style={{ width: 'fit-content' }}>
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
                  <div className="d-flex justify-content-center gap-2 mb-4">
                    <Button size="sm" variant="outline-secondary" className='btn-icon' disabled={pagination.page === 1} onClick={() => fetchReservations(pagination.page - 1)}>‹ Prev</Button>
                    <span className="align-self-center small text-muted">Page {pagination.page} of {pagination.pages}</span>
                    <Button size="sm" variant="outline-secondary" className='btn-icon' disabled={pagination.page === pagination.pages} onClick={() => fetchReservations(pagination.page + 1)}>Next ›</Button>
                  </div>
                )}
              </Tab.Pane>

              {/* ── TIMELINE TAB ── */}
              <Tab.Pane eventKey="timeline">
                <Card body className="mb-3">
                  <Row className="g-2 align-items-end">
                    <Col xs="auto">
                      <Form.Group>
                        <Form.Label className="small fw-semibold">Date</Form.Label>
                        <Form.Control type="date" size="sm" value={timelineDate} onChange={(e) => setTimelineDate(e.target.value)} />
                      </Form.Group>
                    </Col>
                    <Col xs="auto">
                      <p className="text-muted small mb-0">
                        Visual slot × table grid. Hover cells to see customer details.
                      </p>
                    </Col>
                  </Row>
                </Card>
                <Card body>
                  <TimelineGrid date={timelineDate} />
                </Card>
              </Tab.Pane>

              {/* ── CONFIG TAB ── */}
              <Tab.Pane eventKey="config">
                <Card body>
                  <h6 className="fw-semibold mb-3"><CsLineIcons icon="settings-1" className="me-2 text-primary" />Slot Configuration</h6>
                  <SlotConfigPanel onSaved={() => fetchReservations(1)} active={activeTab === 'config'} />
                </Card>
              </Tab.Pane>

            </Tab.Content>
          </Tab.Container>
        </Col>
      </Row>

      <ApproveModal show={!!approveTarget} reservation={approveTarget} onClose={() => setApproveTarget(null)} onSuccess={() => fetchReservations(pagination.page)} />
      <RejectModal show={!!rejectTarget} reservation={rejectTarget} onClose={() => setRejectTarget(null)} onSuccess={() => fetchReservations(pagination.page)} />
    </>
  );
};

export default ManageReservations;