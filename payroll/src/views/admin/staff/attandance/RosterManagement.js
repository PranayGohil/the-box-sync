import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { Row, Col, Card, Button, Form, Spinner, Dropdown, Badge, InputGroup, Modal, Table } from 'react-bootstrap';
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import { toast } from 'react-toastify';
import axios from 'axios';

const customStyles = `
  .glass-card {
    background: #ffffff !important;
    border: 1px solid #f0f0f0 !important;
    border-radius: 1.5rem !important;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.04) !important;
    transition: all 0.3s ease;
  }
  .custom-btn-solid {
    background-color: #1ea8e7 !important;
    border: 1px solid #1ea8e7 !important;
    color: #fff !important;
    transition: all 0.2s ease-in-out !important;
    border-radius: 50px !important;
    font-weight: 600 !important;
    font-size: 0.85rem !important;
  }
  .custom-btn-solid:hover {
    background-color: #158dc4 !important;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(30, 168, 231, 0.3) !important;
  }
  .roster-table {
    border-collapse: separate !important;
    border-spacing: 0 !important;
    width: 100%;
  }
  .roster-table th {
    background: #f8fafc !important;
    color: #475569 !important;
    font-weight: 600 !important;
    text-transform: uppercase !important;
    font-size: 0.8rem !important;
    padding: 1rem !important;
    border-bottom: 2px solid #e2e8f0 !important;
    border-top: none !important;
    text-align: center;
  }
  .roster-table td {
    padding: 0.75rem !important;
    vertical-align: middle !important;
    border-bottom: 1px solid #f1f5f9 !important;
    text-align: center;
    background-color: #ffffff !important;
  }
  .roster-cell {
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 0.5rem;
    cursor: pointer;
    transition: all 0.2s;
    font-weight: 500;
    font-size: 0.85rem;
  }
  .roster-cell:hover {
    border-color: #1ea8e7;
    background-color: #f0f9ff;
  }
  .shift-morning { background-color: #e0f2fe; color: #0369a1; border-color: #bae6fd; }
  .shift-evening { background-color: #ffedd5; color: #c2410c; border-color: #fed7aa; }
  .shift-night { background-color: #ede9fe; color: #6d28d9; border-color: #ddd6fe; }
  .shift-off { background-color: #f1f5f9; color: #64748b; border-color: #e2e8f0; }
  
  .avatar-circle {
    background: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%) !important;
    color: #0369a1 !important;
    font-weight: 700 !important;
    border: 2px solid #f0f9ff !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    width: 40px !important;
    height: 40px !important;
    border-radius: 50% !important;
    font-size: 0.9rem !important;
  }
`;

export default function RosterManagement() {
  const history = useHistory();
  const title = 'Shift Management';
  const description = 'Assign shifts and weekly offs to staff members';
  const breadcrumbs = [
    { to: '', text: 'Home' },
    { to: 'payroll/settings', text: 'Settings' },
    { to: 'payroll/roster', text: 'Shifts' },
  ];

  // Helper to get Monday of the current week
  function getStartOfWeek(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    return d.toISOString().split('T')[0];
  }

  const [loading, setLoading] = useState(false);
  const [staffList, setStaffList] = useState([]);
  const [weekStartDate, setWeekStartDate] = useState(getStartOfWeek(new Date()));
  const [rosterData, setRosterData] = useState({});

  const navigateWeek = (direction) => {
    const d = new Date(weekStartDate);
    d.setDate(d.getDate() + (direction * 7));
    setWeekStartDate(d.toISOString().split('T')[0]);
  };

  // Dynamic Shifts State with LocalStorage Persistence
  const [shifts, setShifts] = useState(() => {
    const saved = localStorage.getItem('roster_shifts');
    if (saved) return JSON.parse(saved);
    return [
      { id: 'morning', label: 'Morning (09:00 - 18:00)', short: 'Morning', className: 'shift-morning' },
      { id: 'evening', label: 'Evening (14:00 - 23:00)', short: 'Evening', className: 'shift-evening' },
      { id: 'night', label: 'Night (22:00 - 07:00)', short: 'Night', className: 'shift-night' },
      { id: 'off', label: 'Weekly Off', short: 'Off', className: 'shift-off' },
    ];
  });

  useEffect(() => {
    localStorage.setItem('roster_shifts', JSON.stringify(shifts));
  }, [shifts]);

  const [showShiftModal, setShowShiftModal] = useState(false);
  const [newShift, setNewShift] = useState({ short: '', start: '09:00', end: '18:00', className: 'shift-morning' });

  // Generate 7 days for the selected week
  const weekDays = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(weekStartDate);
    d.setDate(d.getDate() + i);
    return d;
  });

  const authHeader = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
  });

  const fetchStaffAndRoster = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${process.env.REACT_APP_API}/attendance/today`, authHeader());
      if (res.data && res.data.data) {
        setStaffList(res.data.data.map(d => d.staff || d).filter(Boolean));

        // Load saved roster from localStorage to simulate DB persistence
        const savedRosterStr = localStorage.getItem('roster_data');
        const existingRoster = savedRosterStr ? JSON.parse(savedRosterStr) : {};

        const initialRoster = { ...existingRoster };
        res.data.data.forEach(d => {
          const staffObj = d.staff || d;
          if (!staffObj || !staffObj._id) return;
          if (!initialRoster[staffObj._id]) initialRoster[staffObj._id] = {};

          const isWeeklyOff = (staff, dayName, dateObj) => {
            let isOff = false;

            if (staff.weekly_off_policy === 'custom' && Array.isArray(staff.custom_weekly_offs)) {
              const customMatch = staff.custom_weekly_offs.find(wo => wo.day && wo.day.toLowerCase() === dayName.toLowerCase());
              if (customMatch) {
                if (customMatch.type === 'specific_weeks' && Array.isArray(customMatch.weeks)) {
                  const dateNum = dateObj.getDate();
                  const weekOfMonth = Math.ceil(dateNum / 7);
                  if (customMatch.weeks.includes(weekOfMonth)) {
                    isOff = true;
                  }
                } else {
                  isOff = true;
                }
              }
              // Implicit Sunday off if not overridden in custom settings
              if (!customMatch && dayName.toLowerCase() === 'sunday') {
                const hasSundayConfig = staff.custom_weekly_offs.some(wo => wo.day && wo.day.toLowerCase() === 'sunday');
                if (!hasSundayConfig) isOff = true;
              }
            } else if (dayName.toLowerCase() === 'sunday') {
              isOff = true;
            }

            if (!isOff) {
              const strOff = staff.weekly_off || staff.week_off || staff.weekoff;
              if (typeof strOff === 'string' && strOff.toLowerCase() === dayName.toLowerCase()) isOff = true;
              if (Array.isArray(strOff)) {
                if (strOff.some(w => typeof w === 'string' && w.toLowerCase() === dayName.toLowerCase())) isOff = true;
              }
            }

            return isOff;
          };

          weekDays.forEach(day => {
            const dateStr = day.toISOString().split('T')[0];
            const dayName = day.toLocaleDateString('en-US', { weekday: 'long' });

            if (!initialRoster[staffObj._id][dateStr]) {
              if (isWeeklyOff(staffObj, dayName, day)) {
                initialRoster[staffObj._id][dateStr] = 'off';
              } else {
                initialRoster[staffObj._id][dateStr] = 'morning'; // Default shift
              }
            }
          });
        });
        setRosterData(initialRoster);
      }
    } catch (err) {
      console.error('Error fetching staff for roster:', err);
      toast.error('Failed to load roster data.');
    } finally {
      setLoading(false);
    }
  };

  const [selectedStaff, setSelectedStaff] = useState([]);
  const [bulkDay, setBulkDay] = useState('');
  const [bulkShift, setBulkShift] = useState('morning');

  useEffect(() => {
    fetchStaffAndRoster();
    setSelectedStaff([]); // Reset selection when week changes
    if (weekDays.length > 0) {
      setBulkDay(weekDays[0].toISOString().split('T')[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekStartDate]);

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedStaff(staffList.map(s => s?._id).filter(Boolean));
    } else {
      setSelectedStaff([]);
    }
  };

  const handleSelectStaff = (id) => {
    setSelectedStaff(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const handleBulkApply = () => {
    if (selectedStaff.length === 0) {
      toast.warning('Please select at least one staff member.');
      return;
    }
    if (!bulkDay) {
      toast.warning('Please select a day to apply the shift.');
      return;
    }
    setRosterData(prev => {
      const newData = { ...prev };
      selectedStaff.forEach(id => {
        if (newData[id]) {
          newData[id] = { ...newData[id], [bulkDay]: bulkShift };
        }
      });
      return newData;
    });
    toast.success('Bulk shift assigned successfully!');
  };

  const handleShiftChange = (staffId, dateStr, shiftId) => {
    setRosterData(prev => ({
      ...prev,
      [staffId]: {
        ...prev[staffId],
        [dateStr]: shiftId
      }
    }));
  };

  const handleSaveRoster = async () => {
    // Save to localStorage to persist across week navigation
    localStorage.setItem('roster_data', JSON.stringify(rosterData));
    toast.success('Shifts saved successfully!');
  };

  const handleAddShift = () => {
    if (!newShift.short) {
      toast.error('Please enter a shift name.');
      return;
    }
    const id = newShift.short.toLowerCase().replace(/\s+/g, '-');
    const label = `${newShift.short} (${newShift.start} - ${newShift.end})`;
    setShifts(prev => [...prev, { id, label, short: newShift.short, className: newShift.className }]);
    setNewShift({ short: '', start: '09:00', end: '18:00', className: 'shift-morning' });
    toast.success('Shift added successfully!');
  };

  const handleRemoveShift = (id) => {
    setShifts(prev => prev.filter(s => s.id !== id));
  };

  const shiftDropdown = (staffId, dateStr, currentShift) => {
    const shiftInfo = shifts.find(s => s.id === currentShift) || shifts[0] || { short: 'N/A', className: 'shift-off' };

    return (
      <Dropdown>
        <Dropdown.Toggle as="div" className={`roster-cell ${shiftInfo.className}`}>
          {shiftInfo.short}
        </Dropdown.Toggle>
        <Dropdown.Menu className="shadow-sm border-0" style={{ borderRadius: '10px' }}>
          {shifts.map(shift => (
            <Dropdown.Item
              key={shift.id}
              onClick={() => handleShiftChange(staffId, dateStr, shift.id)}
              active={currentShift === shift.id}
            >
              <Badge bg="transparent" className={`w-100 text-start p-2 ${shift.className}`} style={{ borderRadius: '6px' }}>
                {shift.label}
              </Badge>
            </Dropdown.Item>
          ))}
        </Dropdown.Menu>
      </Dropdown>
    );
  };

  return (
    <div className="container-fluid px-lg-4 px-xl-5 pb-5">
      <style>{customStyles}</style>
      <HtmlHead title={title} description={description} />

      <div className="page-title-container mb-4 mt-5 mt-lg-0">
        <Row className="g-3 align-items-center mb-4">
          <Col xs="12" md="4">
            <h1 className="mb-0 pb-0 display-4 fw-bold" style={{ color: '#1ea8e7' }}>{title}</h1>
            <BreadcrumbList items={breadcrumbs} />
          </Col>
          <Col xs="12" md="8" className="d-flex flex-wrap justify-content-md-end align-items-center gap-3">
            <Button variant="outline-primary" className="rounded-pill px-4 shadow-sm d-flex align-items-center" onClick={() => history.push('/payroll/settings')}>
              <CsLineIcons icon="arrow-left" className="me-2" size="18" />
              <span>Back</span>
            </Button>

            <Button variant="outline-primary" className="rounded-pill px-4 shadow-sm d-flex align-items-center" onClick={() => setShowShiftModal(true)}>
              <CsLineIcons icon="gear" className="me-2" size="18" />
              <span>Manage Shifts</span>
            </Button>

            <div className="d-flex align-items-center bg-white rounded-pill shadow-sm px-2 py-1">
              <Button variant="link" className="p-1 text-muted" onClick={() => navigateWeek(-1)}>
                <CsLineIcons icon="chevron-left" size="18" />
              </Button>
              <Form.Control
                type="date"
                value={weekStartDate}
                onChange={e => setWeekStartDate(getStartOfWeek(e.target.value))}
                style={{ width: 'auto', border: 'none', background: 'transparent' }}
                className="px-2 fw-bold text-center"
              />
              <Button variant="link" className="p-1 text-muted" onClick={() => navigateWeek(1)}>
                <CsLineIcons icon="chevron-right" size="18" />
              </Button>
            </div>

            <Button variant="outline-primary" className="rounded-pill px-4 shadow-sm d-flex align-items-center" onClick={handleSaveRoster}>
              <CsLineIcons icon="save" className="me-2" size="18" />
              <span>Save Changes</span>
            </Button>
          </Col>
        </Row>

        {/* Bulk Action Bar */}
        <Card className="glass-card border-0 shadow-sm p-3 mb-4" style={{ background: '#f8fafc' }}>
          <div className="fw-bold text-muted small text-uppercase mb-3">Bulk Assign Shift</div>
          <Row className="g-3">
            <Col xs={12} md={4}>
              <Dropdown className="w-100 shadow-sm">
                <Dropdown.Toggle variant="white" className="w-100 text-start d-flex justify-content-between align-items-center py-2 border rounded-3 bg-white">
                  {bulkDay ? (() => {
                    const found = weekDays.find(d => d.toISOString().split('T')[0] === bulkDay);
                    return found ? found.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : 'Select Day...';
                  })() : 'Select Day...'}
                </Dropdown.Toggle>
                <Dropdown.Menu className="w-100 shadow-sm border-0" style={{ borderRadius: '10px', maxHeight: '250px', overflowY: 'auto' }}>
                  {weekDays.map(day => {
                    const dateStr = day.toISOString().split('T')[0];
                    return (
                      <Dropdown.Item key={dateStr} onClick={() => setBulkDay(dateStr)} active={bulkDay === dateStr} className="py-2">
                        {day.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </Dropdown.Item>
                    );
                  })}
                </Dropdown.Menu>
              </Dropdown>
            </Col>
            <Col xs={12} md={4}>
              <Dropdown className="w-100 shadow-sm">
                <Dropdown.Toggle variant="white" className="w-100 text-start d-flex justify-content-between align-items-center py-2 border rounded-3 bg-white">
                  {shifts.find(s => s.id === bulkShift)?.short || 'Select Shift...'}
                </Dropdown.Toggle>
                <Dropdown.Menu className="w-100 shadow-sm border-0" style={{ borderRadius: '10px', maxHeight: '250px', overflowY: 'auto' }}>
                  {shifts.map(s => (
                    <Dropdown.Item key={s.id} onClick={() => setBulkShift(s.id)} active={bulkShift === s.id} className="py-2">
                      <Badge bg="transparent" className={`p-2 w-100 text-start ${s.className}`} style={{ borderRadius: '6px' }}>{s.short}</Badge>
                    </Dropdown.Item>
                  ))}
                </Dropdown.Menu>
              </Dropdown>
            </Col>
            <Col xs={12} md={4}>
              <Button variant="outline-primary" className="rounded-pill px-4 shadow-sm w-100 py-2 h-100" onClick={handleBulkApply}>
                Apply to {selectedStaff.length} Selected
              </Button>
            </Col>
          </Row>
        </Card>
      </div>

      <Card className="glass-card border-0 shadow-sm">
        <Card.Body className="p-0">
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" style={{ color: '#1ea8e7' }} />
              <p className="mt-3 text-muted">Loading roster data...</p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="table-responsive d-none d-lg-block">
                <table className="roster-table">
                  <thead>
                    <tr>
                      <th style={{ width: '40px' }}>
                        <Form.Check
                          type="checkbox"
                          onChange={handleSelectAll}
                          checked={staffList.length > 0 && selectedStaff.length === staffList.length}
                        />
                      </th>
                      <th style={{ textAlign: 'left', minWidth: '200px' }}>Staff Member</th>
                      {weekDays.map(day => (
                        <th key={day.toISOString()}>
                          <div className="fw-bold">{day.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                          <div className="text-muted small">{day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {staffList.map((staff, idx) => (
                      <tr key={staff?._id || idx}>
                        <td className="align-middle">
                          {staff?._id && (
                            <Form.Check
                              type="checkbox"
                              checked={selectedStaff.includes(staff._id)}
                              onChange={() => handleSelectStaff(staff._id)}
                            />
                          )}
                        </td>
                        <td style={{ textAlign: 'left' }}>
                          <div className="d-flex align-items-center gap-3">
                            <div className="avatar-circle">
                              {staff?.f_name?.charAt(0)}{staff?.l_name?.charAt(0)}
                            </div>
                            <div>
                              <div className="fw-bold text-dark">{staff?.f_name} {staff?.l_name}</div>
                              <div className="small text-muted">{staff?.position || 'Staff Member'}</div>
                            </div>
                          </div>
                        </td>
                        {weekDays.map(day => {
                          const dateStr = day.toISOString().split('T')[0];
                          const currentShift = staff?._id ? (rosterData[staff._id]?.[dateStr] || 'morning') : 'morning';
                          return (
                            <td key={dateStr}>
                              {shiftDropdown(staff?._id, dateStr, currentShift)}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                    {staffList.length === 0 && (
                      <tr>
                        <td colSpan={8} className="text-center py-5 text-muted">No staff members found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="d-lg-none p-3 bg-light">
                {staffList.length === 0 ? (
                  <div className="text-center py-4 text-muted">No staff members found.</div>
                ) : (
                  staffList.map((staff, idx) => (
                    <Card key={staff?._id || idx} className="border-0 shadow-sm mb-3" style={{ borderRadius: '1rem' }}>
                      <Card.Body className="p-3">
                        <div className="d-flex align-items-center gap-3 mb-3">
                          <div className="avatar-circle flex-shrink-0">
                            {staff?.f_name?.charAt(0)}{staff?.l_name?.charAt(0)}
                          </div>
                          <div>
                            <div className="fw-bold text-dark">{staff?.f_name} {staff?.l_name}</div>
                            <div className="small text-muted">{staff?.position || 'Staff Member'}</div>
                          </div>
                          {staff?._id && (
                            <div className="ms-auto">
                              <Form.Check
                                type="checkbox"
                                checked={selectedStaff.includes(staff._id)}
                                onChange={() => handleSelectStaff(staff._id)}
                              />
                            </div>
                          )}
                        </div>
                        <div className="row g-2">
                          {weekDays.map(day => {
                            const dateStr = day.toISOString().split('T')[0];
                            const currentShift = staff?._id ? (rosterData[staff._id]?.[dateStr] || 'morning') : 'morning';
                            return (
                              <div className="col-12" key={dateStr}>
                                <div className="d-flex align-items-center justify-content-between p-2 rounded bg-white border border-light">
                                  <div className="d-flex flex-column">
                                    <span className="fw-bold text-dark" style={{ fontSize: '0.85rem' }}>{day.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                                    <span className="text-muted" style={{ fontSize: '0.75rem' }}>{day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                                  </div>
                                  <div style={{ minWidth: '130px' }}>
                                    {shiftDropdown(staff?._id, dateStr, currentShift)}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </Card.Body>
                    </Card>
                  ))
                )}
              </div>
            </>
          )}
        </Card.Body>
      </Card>

      {/* Manage Shifts Modal */}
      <Modal show={showShiftModal} onHide={() => setShowShiftModal(false)} size="lg" centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold" style={{ color: '#1ea8e7' }}>Manage Shifts</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="mb-4">
            <h6 className="fw-bold mb-3">Current Shifts</h6>
            <Table hover borderless className="shadow-sm rounded-3 overflow-hidden" style={{ background: '#f8fafc' }}>
              <thead className="bg-light">
                <tr>
                  <th className="text-muted small text-uppercase py-3 ps-4">Shift Name</th>
                  <th className="text-muted small text-uppercase py-3">Timing Label</th>
                  <th className="text-muted small text-uppercase py-3 text-end pe-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {shifts.map(s => (
                  <tr key={s.id}>
                    <td className="ps-4 align-middle">
                      <Badge bg="transparent" className={`p-2 ${s.className}`} style={{ borderRadius: '6px' }}>{s.short}</Badge>
                    </td>
                    <td className="align-middle text-dark fw-medium">{s.label}</td>
                    <td className="text-end pe-4 align-middle">
                      <Button type="button" variant="link" className="text-danger p-0" onClick={() => handleRemoveShift(s.id)}>
                        <CsLineIcons icon="bin" size="16" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>

          <div className="bg-light p-4 rounded-3 border">
            <h6 className="fw-bold mb-3">Add New Shift</h6>
            <Row className="g-3 align-items-end">
              <Col xs={12} md={3}>
                <Form.Group>
                  <Form.Label className="small fw-bold text-muted">Shift Name</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="e.g. Split Shift"
                    value={newShift.short}
                    onChange={e => setNewShift({ ...newShift, short: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col xs={6} md={3}>
                <Form.Group>
                  <Form.Label className="small fw-bold text-muted">Start Time</Form.Label>
                  <Form.Control
                    type="time"
                    value={newShift.start}
                    onChange={e => setNewShift({ ...newShift, start: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col xs={6} md={3}>
                <Form.Group>
                  <Form.Label className="small fw-bold text-muted">End Time</Form.Label>
                  <Form.Control
                    type="time"
                    value={newShift.end}
                    onChange={e => setNewShift({ ...newShift, end: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col xs={12} md={3}>
                <Button type="button" variant="outline-primary" className="rounded-pill shadow-sm w-100" onClick={handleAddShift}>
                  + Add Shift
                </Button>
              </Col>
            </Row>
          </div>
        </Modal.Body>
      </Modal>

    </div>
  );
}
