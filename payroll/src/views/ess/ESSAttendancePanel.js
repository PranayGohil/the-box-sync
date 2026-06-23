import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Spinner, Alert, Badge, Table, Modal, Form } from 'react-bootstrap';
import HtmlHead from 'components/html-head/HtmlHead';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import { toast } from 'react-toastify';
import CreatableSelect from 'react-select/creatable';
import axios from 'axios';

const customStyles = `
  .glass-card {
    background: #ffffff !important;
    border: 1px solid #f0f0f0 !important;
    border-radius: 1.5rem !important;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.04) !important;
    transition: all 0.3s ease;
  }
  .punch-btn {
    width: 200px;
    height: 200px;
    border-radius: 50%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
    font-weight: bold;
    border: 8px solid rgba(255, 255, 255, 0.2);
    box-shadow: 0 15px 35px rgba(0,0,0,0.1);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .punch-btn:active {
    transform: scale(0.95);
  }
  .punch-in {
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    color: white;
  }
  .punch-in:hover {
    box-shadow: 0 20px 40px rgba(16, 185, 129, 0.3);
  }
  .punch-out {
    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
    color: white;
  }
  .punch-out:hover {
    box-shadow: 0 20px 40px rgba(239, 68, 68, 0.3);
  }
  }
  .pulse-animation {
    animation: pulse 2s infinite;
  }
  @keyframes pulse {
    0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
    70% { box-shadow: 0 0 0 20px rgba(16, 185, 129, 0); }
    100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
  }
  .map-container {
    height: 150px;
    border-radius: 1rem;
    background: #f8fafc;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px dashed #cbd5e1;
  }
  .stat-card {
    background: #f8fafc;
    border-radius: 1rem;
    padding: 1.5rem;
    text-align: center;
    border: 1px solid #e2e8f0;
    transition: all 0.2s;
  }
  .stat-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);
    border-color: #cbd5e1;
  }
  .table-custom {
    border-collapse: separate;
    border-spacing: 0;
  }
  .table-custom th {
    background: #f8fafc;
    color: #475569;
    font-size: 0.8rem;
    text-transform: uppercase;
    border-bottom: 2px solid #e2e8f0;
    padding: 1rem;
  }
  .table-custom td {
    padding: 1rem;
    vertical-align: middle;
    border-bottom: 1px solid #f1f5f9;
  }
`;

export default function ESSAttendancePanel() {
  const title = 'My Attendance';
  const description = 'Punch in and out using your mobile device';

  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState('');
  const [isCheckedIn, setIsCheckedIn] = useState(false); // Mock state
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Expense Claim state
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expenseForm, setExpenseForm] = useState({ category: '', amount: '', description: '' });
  const [expenseLoading, setExpenseLoading] = useState(false);
  const [expenseCategories, setExpenseCategories] = useState(['Travel', 'Food & Dining', 'Office Supplies', 'Other']);

  // Regularization State
  const [showRegModal, setShowRegModal] = useState(false);
  const [regForm, setRegForm] = useState({ date: '', in_time: '', out_time: '', reason: '' });
  const [regLoading, setRegLoading] = useState(false);

  const handleRegSubmit = (e) => {
    e.preventDefault();
    setRegLoading(true);
    setTimeout(() => {
      const existing = JSON.parse(localStorage.getItem('regularization_requests') || '[]');
      existing.push({
        id: Date.now(),
        staff_id: 'ESS-USER', // Mocked or get from currentUser
        f_name: 'Current', 
        l_name: 'User',
        ...regForm,
        status: 'Pending',
        submittedAt: new Date().toISOString()
      });
      localStorage.setItem('regularization_requests', JSON.stringify(existing));
      
      setRegLoading(false);
      setShowRegModal(false);
      toast.success('Regularization request submitted successfully!');
      setRegForm({ date: '', in_time: '', out_time: '', reason: '' });
    }, 1000);
  };

  const handleExpenseSubmit = async (e) => {
    e.preventDefault();
    setExpenseLoading(true);
    // Mocking API call
    setTimeout(() => {
      setExpenseLoading(false);
      setShowExpenseModal(false);
      toast.success('Expense claim submitted successfully!');
      setExpenseForm({ category: '', amount: '', description: '' });
    }, 1000);
  };

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const [history, setHistory] = useState([
    { id: 1, date: '2026-06-14', in: '09:05 AM', out: '06:15 PM', status: 'Present', hours: '9h 10m' },
    { id: 2, date: '2026-06-13', in: '09:00 AM', out: '06:00 PM', status: 'Present', hours: '9h 00m' },
    { id: 3, date: '2026-06-12', in: '09:20 AM', out: '06:30 PM', status: 'Late', hours: '9h 10m' },
    { id: 4, date: '2026-06-11', in: '-', out: '-', status: 'Absent', hours: '0h 0m' },
    { id: 5, date: '2026-06-10', in: '09:00 AM', out: '06:00 PM', status: 'Present', hours: '9h 00m' }
  ]);

  const authHeader = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
  });

  const fetchLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser'));
      } else {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              accuracy: position.coords.accuracy
            });
          },
          (err) => {
            reject(err);
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
      }
    });
  };

  const handlePunch = async () => {
    setLoading(true);
    setLocationError('');
    try {
      // 1. Get Geo-Location
      toast.info('Fetching your location...');
      const coords = await fetchLocation();
      setLocation(coords);

      // 2. Prepare payload
      const payload = {
        action: isCheckedIn ? 'checkout' : 'checkin',
        latitude: coords.lat,
        longitude: coords.lng,
        accuracy: coords.accuracy
      };

      // 3. Send to API (Mocking success)
      // await axios.post(`${process.env.REACT_APP_API}/ess/attendance/punch`, payload, authHeader());
      
      toast.success(`Successfully Punched ${isCheckedIn ? 'Out' : 'In'}!`);
      setIsCheckedIn(!isCheckedIn);

    } catch (err) {
      console.error(err);
      setLocationError(err.message || 'Failed to get location. Please enable GPS.');
      toast.error('Location access is required to mark attendance.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid px-lg-4 px-xl-5 pb-5 pt-4">
      <style>{customStyles}</style>
      <HtmlHead title={title} description={description} />

      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="mb-0 pb-0 display-4 fw-bold" style={{ color: '#1ea8e7' }}>{title}</h1>
          <p className="text-muted mb-0">{description}</p>
        </div>
        <div className="d-flex flex-wrap gap-2">
          <Button variant="info" className="btn-icon btn-icon-start px-4 py-2 rounded-pill shadow-sm" onClick={() => setShowRegModal(true)}>
            <CsLineIcons icon="edit" size="18" /> <span>Request Regularization</span>
          </Button>
          <Button variant="primary" className="btn-icon btn-icon-start px-4 py-2 rounded-pill shadow-sm" onClick={() => setShowExpenseModal(true)}>
            <CsLineIcons icon="plus" size="18" /> <span>Submit Expense Claim</span>
          </Button>
        </div>
      </div>

      <Row className="g-4">
        <Col xs={12} lg={4}>
          <Card className="glass-card border-0 text-center py-4 h-100">
            <Card.Body>
              <h2 className="display-4 fw-bold mb-0" style={{ color: '#1ea8e7' }}>
                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </h2>
              <p className="text-muted mb-5">
                {currentTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>

              <div className="d-flex justify-content-center mb-5">
                <button type="button"
                  className={`btn punch-btn ${isCheckedIn ? 'punch-out' : 'punch-in pulse-animation'}`}
                  onClick={handlePunch}
                  disabled={loading}
                >
                  {loading ? (
                    <Spinner animation="border" variant="light" />
                  ) : (
                    <>
                      <CsLineIcons icon={isCheckedIn ? 'logout' : 'login'} size="40" className="mb-2" />
                      {isCheckedIn ? 'Punch Out' : 'Punch In'}
                    </>
                  )}
                </button>
              </div>

              {locationError && (
                <Alert variant="danger" className="text-start rounded-3">
                  <CsLineIcons icon="warning-hexagon" size="18" className="me-2" />
                  {locationError}
                </Alert>
              )}

              {location && !locationError && (
                <div className="text-start mt-4">
                  <h6 className="fw-bold text-muted small text-uppercase">Last Location Verified</h6>
                  <div className="map-container mt-2">
                    <div className="text-center text-muted">
                      <CsLineIcons icon="pin" size="24" className="mb-2 text-primary" /><br />
                      Lat: {location.lat.toFixed(4)}, Lng: {location.lng.toFixed(4)}<br />
                      <small>Accuracy: ~{Math.round(location.accuracy)} meters</small>
                    </div>
                  </div>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col xs={12} lg={8}>
          <Card className="glass-card border-0 h-100">
            <Card.Body className="p-4">
              <h5 className="fw-bold mb-4" style={{ color: '#1ea8e7' }}>This Month's Summary</h5>
              
              <Row className="g-3 mb-5">
                <Col xs={6} md={3}>
                  <div className="stat-card">
                    <div className="fs-3 fw-bold text-success mb-1">18</div>
                    <div className="small text-muted text-uppercase fw-bold">Present</div>
                  </div>
                </Col>
                <Col xs={6} md={3}>
                  <div className="stat-card">
                    <div className="fs-3 fw-bold text-danger mb-1">2</div>
                    <div className="small text-muted text-uppercase fw-bold">Absent</div>
                  </div>
                </Col>
                <Col xs={6} md={3}>
                  <div className="stat-card">
                    <div className="fs-3 fw-bold text-warning mb-1">3</div>
                    <div className="small text-muted text-uppercase fw-bold">Late</div>
                  </div>
                </Col>
                <Col xs={6} md={3}>
                  <div className="stat-card">
                    <div className="fs-3 fw-bold text-primary mb-1">164h</div>
                    <div className="small text-muted text-uppercase fw-bold">Total Hours</div>
                  </div>
                </Col>
              </Row>

              <h5 className="fw-bold mb-3">Recent Attendance</h5>
              <div className="table-responsive">
                <Table className="table-custom" hover>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Check In</th>
                      <th>Check Out</th>
                      <th>Status</th>
                      <th>Total Hours</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map(record => (
                      <tr key={record.id}>
                        <td className="fw-medium">{record.date}</td>
                        <td>{record.in}</td>
                        <td>{record.out}</td>
                        <td>
                          <Badge bg={
                            record.status === 'Present' ? 'success' : 
                            record.status === 'Late' ? 'warning' : 'danger'
                          } className="px-3 py-2 rounded-pill">
                            {record.status}
                          </Badge>
                        </td>
                        <td className="text-muted">{record.hours}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Submit Expense Claim Modal */}
      <Modal show={showExpenseModal} onHide={() => setShowExpenseModal(false)} centered>
        <Form onSubmit={handleExpenseSubmit}>
          <Modal.Header closeButton>
            <Modal.Title>Submit Expense Claim</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Category</Form.Label>
              <CreatableSelect
                isClearable
                options={expenseCategories.map(cat => ({ label: cat, value: cat }))}
                value={expenseForm.category ? { label: expenseForm.category, value: expenseForm.category } : null}
                onChange={(selected) => setExpenseForm({...expenseForm, category: selected ? selected.value : ''})}
                onCreateOption={(inputValue) => {
                  setExpenseCategories((prev) => [...prev, inputValue]);
                  setExpenseForm({...expenseForm, category: inputValue});
                }}
                placeholder="Select or type category..."
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Amount (₹)</Form.Label>
              <Form.Control 
                type="number" 
                required 
                placeholder="e.g. 500" 
                value={expenseForm.amount}
                onChange={(e) => setExpenseForm({...expenseForm, amount: e.target.value})}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Description / Reason</Form.Label>
              <Form.Control 
                as="textarea" 
                rows={3} 
                placeholder="Briefly describe the expense..."
                value={expenseForm.description}
                onChange={(e) => setExpenseForm({...expenseForm, description: e.target.value})}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Upload Receipt (Optional)</Form.Label>
              <Form.Control type="file" />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowExpenseModal(false)}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={expenseLoading}>
              {expenseLoading ? <Spinner animation="border" size="sm" /> : 'Submit Claim'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Regularization Modal */}
      <Modal show={showRegModal} onHide={() => setShowRegModal(false)} centered className="rounded-4">
        <Form onSubmit={handleRegSubmit}>
          <Modal.Header closeButton className="border-0">
            <Modal.Title className="fw-bold d-flex align-items-center gap-2">
              <CsLineIcons icon="edit" size="24" className="text-primary" />
              Request Regularization
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="py-4">
            <div className="bg-soft-primary p-3 rounded-3 mb-4 d-flex align-items-center gap-3 border border-primary">
              <CsLineIcons icon="info-hexagon" size="24" className="text-primary" />
              <div className="small text-dark fw-medium">Submit a request to fix missing or incorrect punches. Admins will review this request.</div>
            </div>
            
            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold text-muted text-uppercase">Date of Missed Punch</Form.Label>
              <Form.Control type="date" required className="rounded-3 shadow-sm py-2" value={regForm.date} onChange={e => setRegForm({...regForm, date: e.target.value})} />
            </Form.Group>
            
            <Row className="g-3 mb-3">
              <Col xs={6}>
                <Form.Group>
                  <Form.Label className="small fw-bold text-muted text-uppercase">Correct In Time</Form.Label>
                  <Form.Control type="time" className="rounded-3 shadow-sm py-2" value={regForm.in_time} onChange={e => setRegForm({...regForm, in_time: e.target.value})} />
                </Form.Group>
              </Col>
              <Col xs={6}>
                <Form.Group>
                  <Form.Label className="small fw-bold text-muted text-uppercase">Correct Out Time</Form.Label>
                  <Form.Control type="time" className="rounded-3 shadow-sm py-2" value={regForm.out_time} onChange={e => setRegForm({...regForm, out_time: e.target.value})} />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold text-muted text-uppercase">Reason</Form.Label>
              <Form.Control as="textarea" rows={3} required placeholder="Explain why the punch was missed or needs correction..." className="rounded-3 shadow-sm py-2" value={regForm.reason} onChange={e => setRegForm({...regForm, reason: e.target.value})} />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer className="border-0">
            <Button variant="secondary" className="rounded-pill px-4" onClick={() => setShowRegModal(false)}>Cancel</Button>
            <Button type="submit" className="custom-btn-solid rounded-pill px-4" disabled={regLoading}>
              {regLoading ? <Spinner animation="border" size="sm" /> : 'Submit Request'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

    </div>
  );
}
