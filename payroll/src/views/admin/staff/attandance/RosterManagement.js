import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { Row, Col, Card, Button, Form, Spinner, Dropdown, Badge, InputGroup, Modal, Table } from 'react-bootstrap';
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import { toast } from 'react-toastify';
import axios from 'axios';


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

  // Dynamic Shifts State
  const [shifts, setShifts] = useState([
    { id: 'off', label: 'Weekly Off', short: 'Off', className: 'shift-off' }
  ]);

  // We don't save shifts to localStorage anymore, it comes from backend

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

  // Helper to format date as DD/MM/YYYY
  const formatDateDDMMYYYY = (dateObj) => {
    const d = String(dateObj.getDate()).padStart(2, '0');
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const y = dateObj.getFullYear();
    return `${d}/${m}/${y}`;
  };

  const fetchStaffAndRoster = async () => {
    setLoading(true);
    try {
      // 1. Fetch all shifts
      const shiftsRes = await axios.get(`${process.env.REACT_APP_API}/shift/all`, authHeader());
      let loadedShifts = [{ id: 'off', label: 'Weekly Off', short: 'Off', className: 'shift-off' }];
      if (shiftsRes.data && shiftsRes.data.success) {
        const dbShifts = shiftsRes.data.data.map((s, index) => ({
          id: s._id,
          label: `${s.name} (${s.start_time} - ${s.end_time})`,
          short: s.name,
          className: `shift-morning` // We can assign colors dynamically if needed
        }));
        loadedShifts = [...loadedShifts, ...dbShifts];
      }
      setShifts(loadedShifts);

      // 2. Fetch staff list (using attendance/today just to get active staff list)
      const res = await axios.get(`${process.env.REACT_APP_API}/attendance/today`, authHeader());
      if (res.data && res.data.data) {
        const staffs = res.data.data.map(d => d.staff || d).filter(Boolean);
        setStaffList(staffs);

        // 3. Fetch saved roster for the week
        const formattedDates = weekDays.map(d => formatDateDDMMYYYY(d));
        const rosterRes = await axios.post(`${process.env.REACT_APP_API}/roster/week`, { dates: formattedDates }, authHeader());
        const dbRoster = rosterRes.data?.data || {};

        const initialRoster = { ...dbRoster };
        const defaultShiftId = loadedShifts.length > 1 ? loadedShifts[1].id : 'off';

        staffs.forEach(staffObj => {
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
            // Use DD/MM/YYYY for keys in UI rosterData to match DB response
            const dateStr = formatDateDDMMYYYY(day);
            const dayName = day.toLocaleDateString('en-US', { weekday: 'long' });

            if (!initialRoster[staffObj._id][dateStr]) {
              if (isWeeklyOff(staffObj, dayName, day)) {
                initialRoster[staffObj._id][dateStr] = 'off';
              } else {
                const staffShiftId = staffObj.shift_id?._id || staffObj.shift_id;
                const isValidShift = staffShiftId ? loadedShifts.some(s => s.id === staffShiftId) : false;
                initialRoster[staffObj._id][dateStr] = isValidShift ? staffShiftId : defaultShiftId;
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
      setBulkDay(formatDateDDMMYYYY(weekDays[0]));
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
    try {
      const res = await axios.post(`${process.env.REACT_APP_API}/roster/bulk-save`, { rosterData }, authHeader());
      if (res.data.success) {
        toast.success('Shifts saved successfully!');
      } else {
        toast.error(res.data.message || 'Failed to save roster');
      }
    } catch (err) {
      console.error("Error saving roster:", err);
      toast.error('Failed to save roster');
    }
  };

  const handleAddShift = async () => {
    if (!newShift.short) {
      toast.error('Please enter a shift name.');
      return;
    }
    
    try {
      const payload = {
        name: newShift.short,
        start_time: newShift.start,
        end_time: newShift.end
      };
      const res = await axios.post(`${process.env.REACT_APP_API}/shift/create`, payload, authHeader());
      if (res.data.success) {
        toast.success('Shift added successfully!');
        setNewShift({ short: '', start: '09:00', end: '18:00', className: 'shift-morning' });
        // Refresh the list to get the new shift with its real MongoDB _id
        fetchStaffAndRoster();
      } else {
        toast.error(res.data.message || 'Failed to add shift.');
      }
    } catch (err) {
      console.error('Error adding shift:', err);
      if (err.response?.data?.message) {
        toast.error(err.response.data.message);
      } else {
        toast.error('Failed to add shift.');
      }
    }
  };

  const handleRemoveShift = async (id) => {
    if (id === 'off') {
      toast.error('Cannot remove the Weekly Off default shift.');
      return;
    }
    
    try {
      const res = await axios.delete(`${process.env.REACT_APP_API}/shift/delete/${id}`, authHeader());
      if (res.data.success) {
        toast.success('Shift deleted successfully!');
        // Remove locally from UI
        setShifts(prev => prev.filter(s => s.id !== id));
      } else {
        toast.error(res.data.message || 'Failed to delete shift.');
      }
    } catch (err) {
      console.error('Error deleting shift:', err);
      toast.error('Failed to delete shift.');
    }
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
      <HtmlHead title={title} description={description} />

      <div className="page-title-container mb-4 mt-3 mt-lg-0">
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
        <Card className="glass-card border-0 shadow-sm p-3 mb-4 position-relative" style={{ background: '#f8fafc', zIndex: 10 }}>
          <div className="fw-bold text-muted small text-uppercase mb-3">Bulk Assign Shift</div>
          <Row className="g-3">
            <Col xs={12} md={4}>
              <Dropdown className="w-100 shadow-sm">
                <Dropdown.Toggle variant="white" className="w-100 text-start d-flex justify-content-between align-items-center py-2 border rounded-3 bg-white">
                  {bulkDay ? (() => {
                    const found = weekDays.find(d => formatDateDDMMYYYY(d) === bulkDay);
                    return found ? found.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : 'Select Day...';
                  })() : 'Select Day...'}
                </Dropdown.Toggle>
                <Dropdown.Menu className="w-100 shadow-sm border-0" style={{ borderRadius: '10px', maxHeight: '250px', overflowY: 'auto' }}>
                  {weekDays.map(day => {
                    const dateStr = formatDateDDMMYYYY(day);
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
              <div className="table-responsive d-none d-lg-block" style={{ paddingBottom: '200px' }}>
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
                        const dateStr = formatDateDDMMYYYY(day);
                        const isToday = day.toISOString().split('T')[0] === new Date().toISOString().split('T')[0];
                        const currentShift = staff?._id ? (rosterData[staff._id]?.[dateStr] || 'off') : 'off';
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
                            const dateStr = formatDateDDMMYYYY(day);
                            const currentShift = staff?._id ? (rosterData[staff._id]?.[dateStr] || 'off') : 'off';
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
