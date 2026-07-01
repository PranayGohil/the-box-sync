import React from 'react';
import { Modal, Row, Col, Badge, Card } from 'react-bootstrap';
import CsLineIcons from 'cs-line-icons/CsLineIcons';

const WfhLogsModal = ({ show, onHide, attendance }) => {
  if (!attendance || !attendance.wfh_tracking) return null;

  const wfh = attendance.wfh_tracking;
  const screens = wfh.screenshots || [];
  const webcams = wfh.webcam_snapshots || [];

  // Combine and sort by timestamp
  const combinedLogs = [
    ...screens.map(s => ({ ...s, type: 'Screen' })),
    ...webcams.map(w => ({ ...w, type: 'Webcam' }))
  ].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  const formatTime = (ts) => {
    return new Date(ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Modal show={show} onHide={onHide} size="xl" centered>
      <Modal.Header closeButton className="border-0 pb-0">
        <Modal.Title className="fw-bold d-flex align-items-center gap-2">
          <CsLineIcons icon="laptop" size={20} className="text-primary" />
          Work From Home Logs
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="pt-2">
        <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom">
          <div>
            <h6 className="mb-0 fw-bold text-dark">{new Date(attendance.date).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h6>
            <span className="text-muted small">Timeline of automated random screenshots and webcam captures.</span>
          </div>
          <div className="text-end">
            <Badge bg={wfh.total_idle_minutes > 15 ? 'soft-danger' : 'soft-success'} className={`text-${wfh.total_idle_minutes > 15 ? 'danger' : 'success'} px-3 py-2 rounded-pill fw-bold`}>
              <CsLineIcons icon="clock" size={14} className="me-1" />
              Idle Time: {wfh.total_idle_minutes || 0} mins
            </Badge>
          </div>
        </div>

        {combinedLogs.length === 0 ? (
          <div className="text-center py-5">
            <CsLineIcons icon="camera" size={48} className="text-muted mb-3 opacity-50" />
            <h5 className="text-muted">No captures recorded for this day.</h5>
            <p className="small text-muted">The employee might have worked entirely offline or their browser blocked captures.</p>
          </div>
        ) : (
          <Row className="g-4">
            {combinedLogs.map((log, index) => (
              <Col xs={12} md={6} lg={4} key={index}>
                <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '1rem', overflow: 'hidden' }}>
                  <div style={{ position: 'relative', width: '100%', paddingBottom: '56.25%', backgroundColor: '#f8fafc' }}>
                    <img
                      src={`${process.env.REACT_APP_API_URL || 'http://localhost:3002'}${log.url}`}
                      alt={log.type}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: log.type === 'Webcam' ? 'cover' : 'contain',
                        backgroundColor: '#000'
                      }}
                      onError={(e) => { e.target.src = '/img/placeholder.png'; }}
                    />
                    <Badge
                      bg={log.type === 'Screen' ? 'primary' : 'info'}
                      className="position-absolute"
                      style={{ top: '10px', right: '10px', padding: '0.4rem 0.6rem', fontWeight: 'bold' }}
                    >
                      {log.type}
                    </Badge>
                  </div>
                  <Card.Body className="p-3 d-flex justify-content-between align-items-center">
                    <span className="fw-bold text-dark">{formatTime(log.timestamp)}</span>
                    <CsLineIcons icon={log.type === 'Screen' ? 'monitor' : 'user'} size={16} className="text-muted" />
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </Modal.Body>
      <Modal.Footer className="border-0">
        <button type="button" className="btn custom-btn-primary-outline" onClick={onHide}>Close</button>
      </Modal.Footer>
    </Modal>
  );
};

export default WfhLogsModal;
