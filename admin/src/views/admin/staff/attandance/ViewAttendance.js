import React, { useEffect, useState } from "react";
import { useParams, useHistory } from "react-router-dom";
import axios from "axios";
import { Row, Col, Card, Button, Alert, Spinner } from "react-bootstrap";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import CsLineIcons from 'cs-line-icons/CsLineIcons';

const ViewAttendance = () => {
  const { id } = useParams(); // staff_id from URL
  const history = useHistory();

  const main_title = 'View Attendance';
  const description = 'View staff attendance history and calendar';
  
  const [staffData, setStaffData] = useState(null);
  const [attendanceEvents, setAttendanceEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const breadcrumbs = [
    { to: '', text: 'Home' },
    { to: 'attendance', text: 'Attendance Management' },
    { to: `attendance/view/${id}`, main_title: 'View Attendance' },
  ];

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(
        `${process.env.REACT_APP_API}/staff/get/${id}`,
        { 
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );

      const staff = response.data;
      setStaffData(staff);

      const events = staff.attandance.map((att) => {
        let title = "";

        if (att.status === "present") {
          title = `Present\nIn: ${att.in_time || "N/A"}\nOut: ${
            att.out_time || "N/A"
          }`;
        } else if (att.status === "absent") {
          title = "Absent";
        }

        return {
          title,
          date: att.date,
          backgroundColor: att.status === "present" ? "#28a745" : "#dc3545",
          borderColor: att.status === "present" ? "#28a745" : "#dc3545",
          textColor: "#ffffff",
        };
      });

      setAttendanceEvents(events);
    } catch (err) {
      console.error("Error fetching attendance:", err);
      setError("Failed to load attendance data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [id]);

  if (loading) {
    return (
      <>
        <HtmlHead title={main_title} description={description} />
        <Row>
          <Col>
            <div className="page-title-container">
              <h1 className="mb-0 pb-0 display-4">{main_title}</h1>
              <BreadcrumbList items={breadcrumbs} />
            </div>
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2 text-muted">Loading attendance data...</p>
            </div>
          </Col>
        </Row>
      </>
    );
  }

  return (
    <>
      <HtmlHead title={main_title} description={description} />
      
      <Row>
        <Col>
          <div className="page-title-container">
            <Row className="align-items-center">
              <Col>
                <h1 className="mb-0 pb-0 display-4">
                  {staffData ? `${staffData.f_name} ${staffData.l_name}'s Attendance` : main_title}
                </h1>
                <BreadcrumbList items={breadcrumbs} />
              </Col>
              <Col xs="auto">
                <Button
                  variant="outline-secondary"
                  onClick={() => history.goBack(-1)}
                >
                  <CsLineIcons icon="arrow-left" className="me-2" />
                  Back
                </Button>
              </Col>
            </Row>
          </div>

          {error && (
            <Alert variant="danger" className="mb-4">
              <CsLineIcons icon="error" className="me-2" />
              {error}
            </Alert>
          )}

          {staffData && (
            <Card className="mb-4">
              <Card.Header>
                <Card.Title className="mb-0">Staff Information</Card.Title>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={3}>
                    <strong>Staff ID:</strong> {staffData.staff_id}
                  </Col>
                  <Col md={3}>
                    <strong>Name:</strong> {staffData.f_name} {staffData.l_name}
                  </Col>
                  <Col md={3}>
                    <strong>Position:</strong> {staffData.position}
                  </Col>
                  <Col md={3}>
                    <strong>Total Records:</strong> {staffData.attandance?.length || 0}
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          )}

          <Card className="mb-5">
            <Card.Header>
              <Card.Title className="mb-0">Attendance Calendar</Card.Title>
            </Card.Header>
            <Card.Body>
              <div className="calendar-container">
                <FullCalendar
                  plugins={[dayGridPlugin]}
                  initialView="dayGridMonth"
                  events={attendanceEvents}
                  eventContent={(arg) => {
                    const { event } = arg;
                    const [statusLine, ...timeLines] = event.title.split("\n");
                    return (
                      <div className="fc-event-custom-content text-center p-1">
                        <div style={{ fontWeight: "bold", fontSize: "0.8rem" }}>{statusLine}</div>
                        {timeLines.map((line, index) => (
                          <div key={index} style={{ fontSize: "0.7rem" }}>
                            {line}
                          </div>
                        ))}
                      </div>
                    );
                  }}
                  height="auto"
                  headerToolbar={{
                    left: 'prev,next today',
                    center: 'title',
                    right: 'dayGridMonth,dayGridWeek'
                  }}
                  buttonText={{
                    today: 'Today',
                    month: 'Month',
                    week: 'Week'
                  }}
                  dayMaxEvents
                />
              </div>
            </Card.Body>
            <Card.Footer className="bg-transparent">
              <div className="d-flex align-items-center">
                <div className="d-flex align-items-center me-4">
                  <div className="bg-success rounded me-2" style={{ width: '15px', height: '15px' }} />
                  <small>Present</small>
                </div>
                <div className="d-flex align-items-center">
                  <div className="bg-danger rounded me-2" style={{ width: '15px', height: '15px' }} />
                  <small>Absent</small>
                </div>
              </div>
            </Card.Footer>
          </Card>

          {staffData?.attandance && staffData.attandance.length > 0 && (
            <Card>
              <Card.Header>
                <Card.Title className="mb-0">Attendance Summary</Card.Title>
              </Card.Header>
              <Card.Body>
                <div className="table-responsive">
                  <table className="table table-striped">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Status</th>
                        <th>Check-In Time</th>
                        <th>Check-Out Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {staffData.attandance.map((att, index) => (
                        <tr key={index}>
                          <td>{att.date}</td>
                          <td>
                            <span className={`badge bg-${att.status === 'present' ? 'success' : 'danger'}`}>
                              {att.status}
                            </span>
                          </td>
                          <td>{att.in_time || '-'}</td>
                          <td>{att.out_time || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card.Body>
            </Card>
          )}
        </Col>
      </Row>
    </>
  );
};

export default ViewAttendance;