import React, { useState, useEffect, useMemo } from 'react';
import { Modal, Button, Form, Spinner, Row, Col, Alert } from 'react-bootstrap';
import axios from 'axios';
import { toast } from 'react-toastify';
import CsLineIcons from 'cs-line-icons/CsLineIcons';

const API = process.env.REACT_APP_API;
const auth = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` });
const fmtDate = (str) => new Date(`${str}T00:00:00`).toLocaleDateString('en-IN', { dateStyle: 'medium' });

const customStyles = `
  .pill-input {
    border-radius: 12px !important;
    padding: 0.7rem 1.2rem !important;
    border: 1px solid #e5e7eb !important;
    background: #ffffff !important;
    transition: all 0.2s ease !important;
  }
  .pill-input:focus {
    border-color: #23b3f4 !important;
    box-shadow: 0 0 0 4px rgba(35, 179, 244, 0.1) !important;
    outline: none !important;
  }
  .custom-btn-outline {
    border: 1px solid #23b3f4 !important;
    color: #23b3f4 !important;
    background-color: #fff !important;
    transition: all 0.2s ease-in-out !important;
    border-radius: 50px !important;
    font-weight: 600 !important;
  }
  .custom-btn-outline:hover {
    background-color: #23b3f4 !important;
    color: #fff !important;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(35, 179, 244, 0.25) !important;
  }
  .custom-btn-outline:hover svg {
    stroke: #fff !important;
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

  /* Table capsules */
  .table-capsule-btn {
    border-radius: 50px !important;
    padding: 8px 18px !important;
    font-weight: 700 !important;
    font-size: 0.85rem !important;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
    border: 1px solid #e2e8f0 !important;
    color: #475569 !important;
    background: transparent !important;
  }
  .table-capsule-btn:hover {
    background: #f8fafc !important;
    border-color: #cbd5e1 !important;
    transform: translateY(-1px) !important;
  }
  .table-capsule-btn.active {
    background: #23b3f4 !important;
    border-color: #23b3f4 !important;
    color: #ffffff !important;
    box-shadow: 0 4px 12px rgba(35, 179, 244, 0.2) !important;
  }
`;

const ApproveModal = ({ show, reservation, onClose, onSuccess }) => {
  const [areas, setAreas] = useState([]);
  const [selectedTables, setSelected] = useState([]);
  const [fetching, setFetching] = useState(false);
  const [loading, setLoading] = useState(false);
  const [managerNotes, setNotes] = useState('');
  const [slotLabel, setSlotLabel] = useState('');

  const slotLabelMemo = useMemo(() => {
    if (!reservation) return '';
    return `${reservation.slot_start}–${reservation.slot_end}`;
  }, [reservation]);

  useEffect(() => {
    if (!show) {
      setSelected([]);
      setNotes('');
      setAreas([]);
      setSlotLabel('');
    }
  }, [show]);

  useEffect(() => {
    if (!show || !reservation) return;
    setFetching(true);
    axios.get(`${API}/reservation/available-tables/${reservation._id}`, {
      headers: auth()
    })
      .then((res) => {
        setAreas(res.data.data);
        setSlotLabel(res.data.slot_label || '');
      })
      .catch(() => toast.error('Could not load available tables.'))
      .finally(() => setFetching(false));
  }, [show, reservation]);

  const toggle = (area, tbl) => {
    setSelected((prev) => {
      const exists = prev.find((t) => t.table_id === tbl.table_id.toString());
      if (exists) return prev.filter((t) => t.table_id !== tbl.table_id.toString());
      return [...prev, { 
        area_id: area.area_id.toString(), 
        area_name: area.area_name, 
        table_id: tbl.table_id.toString(), 
        table_no: tbl.table_no, 
        max_person: tbl.max_person 
      }];
    });
  };

  const isSelected = (tbl) => !!selectedTables.find((t) => t.table_id === tbl.table_id.toString());
  const capacity = selectedTables.reduce((s, t) => s + t.max_person, 0);

  const handleApprove = async () => {
    if (!selectedTables.length) { toast.warning('Select at least one table.'); return; }
    setLoading(true);
    try {
      await axios.patch(`${API}/reservation/approve/${reservation._id}`, { 
        assigned_tables: selectedTables, 
        manager_notes: managerNotes 
      }, { headers: auth() });
      toast.success('Approved!'); 
      onSuccess(); 
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve reservation.');
    } finally {
      setLoading(false);
    }
  };

  // Only render active areas that have at least 1 free table
  const activeAreas = useMemo(() => {
    return areas.filter((area) => area.tables && area.tables.length > 0);
  }, [areas]);

  if (!reservation) return null;

  return (
    <Modal show={show} onHide={onClose} size="lg" centered backdrop="static">
      <style>{customStyles}</style>
      <Modal.Header closeButton className="border-0 pb-0">
        <Modal.Title className="fw-bold" style={{ color: '#23b3f4' }}>
          <CsLineIcons icon="check-circle" className="me-2" style={{ stroke: '#23b3f4' }} />
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
              {slotLabel || slotLabelMemo}
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
        ) : activeAreas.length === 0 ? (
          <Alert variant="warning" className="rounded-3 fw-bold">No tables available for this slot.</Alert>
        ) : (
          activeAreas.map((area) => (
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
                      className={`table-capsule-btn d-flex align-items-center gap-1 ${active ? 'active' : ''}`}
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
            className="pill-input w-100 shadow-sm bg-white"
            style={{ resize: 'none', borderRadius: '12px' }}
          />
        </Form.Group>
      </Modal.Body>
      <Modal.Footer className="border-0">
        <Button 
          variant="outline-light" 
          onClick={onClose} 
          disabled={loading} 
          className="rounded-pill px-4 fw-bold custom-btn-outline btn btn-outline-primary"
        >
          Cancel
        </Button>
        <Button 
          disabled={loading || !selectedTables.length} 
          onClick={handleApprove} 
          className="px-5 py-2 custom-btn-outline d-flex align-items-center gap-2"
        >
          {loading ? (
            <>
              <Spinner as="span" animation="border" size="sm" />
              Approving...
            </>
          ) : (
            <>
              <CsLineIcons icon="check" size="18" />
              Approve
            </>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ApproveModal;
