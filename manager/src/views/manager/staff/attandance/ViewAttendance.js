import React, { useEffect, useState } from "react";
import { useParams, useHistory } from "react-router-dom";
import axios from "axios";
import { Row, Col, Card, Button, Alert, Spinner, Form } from "react-bootstrap";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import CsLineIcons from 'cs-line-icons/CsLineIcons';

import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Document, Packer, Paragraph, Table, TableCell, TableRow, TextRun } from "docx";

const ViewAttendance = () => {
  const { id } = useParams(); // staff_id from URL
  const history = useHistory();

  const main_title = 'View Attendance';
  const description = 'View staff attendance history and calendar';

  const [staffData, setStaffData] = useState(null);
  const [attendanceEvents, setAttendanceEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const filteredAttendance = staffData?.attandance?.filter(att => {
    if (!startDate || !endDate) return true;
    const date = new Date(att.date);
    return date >= new Date(startDate) && date <= new Date(endDate);
  }) || [];

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
          title = `Present\nIn: ${att.in_time || "N/A"}\nOut: ${att.out_time || "N/A"
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

  const handleExport = (type) => {
    if (filteredAttendance.length === 0) {
      alert("No attendance records found for selected dates.");
      return;
    }

    if (type === "pdf") {
      // eslint-disable-next-line new-cap
      const doc = new jsPDF();
      doc.text(`${staffData.f_name} ${staffData.l_name} - Attendance Report`, 14, 10);

      // Use autoTable function directly
      autoTable(doc, {
        head: [["Date", "Status", "Check-In", "Check-Out"]],
        body: filteredAttendance.map(att => [
          att.date,
          att.status,
          att.in_time || "-",
          att.out_time || "-"
        ]),
      });
      doc.save("attendance_report.pdf");
    }

    if (type === "excel") {
      const worksheet = XLSX.utils.json_to_sheet(
        filteredAttendance.map(att => ({
          Date: att.date,
          Status: att.status,
          "Check-In": att.in_time || "-",
          "Check-Out": att.out_time || "-"
        }))
      );
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance");
      const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
      saveAs(new Blob([excelBuffer], { type: "application/octet-stream" }), "attendance_report.xlsx");
    }

    if (type === "word") {
      const rows = [
        new TableRow({
          children: ["Date", "Status", "Check-In", "Check-Out"].map(
            heading =>
              new TableCell({
                children: [new Paragraph({ children: [new TextRun({ text: heading, bold: true })] })],
              })
          ),
        }),
        ...filteredAttendance.map(
          att =>
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph(att.date)] }),
                new TableCell({ children: [new Paragraph(att.status)] }),
                new TableCell({ children: [new Paragraph(att.in_time || "-")] }),
                new TableCell({ children: [new Paragraph(att.out_time || "-")] }),
              ],
            })
        ),
      ];

      const doc = new Document({
        sections: [
          {
            properties: {},
            children: [
              new Paragraph({ text: `${staffData.f_name} ${staffData.l_name} - Attendance Report`, bold: true }),
              new Table({ rows }),
            ],
          },
        ],
      });

      Packer.toBlob(doc).then((blob) => {
        saveAs(blob, "attendance_report.docx");
      });
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
            <Card.Header className="d-flex justify-content-between align-items-center">
              <Card.Title className="mb-0">Attendance Summary</Card.Title>
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
              <Card.Header className="d-flex justify-content-between align-items-center">
                <Card.Title className="mb-0">Attendance Summary</Card.Title>
                <div className="d-flex align-items-center">
                  <Form.Control
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="me-2"
                  />
                  <Form.Control
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="me-2"
                  />
                  <Button variant="primary" onClick={() => handleExport("pdf")} className="me-2">
                    PDF
                  </Button>
                  <Button variant="success" onClick={() => handleExport("excel")} className="me-2">
                    Excel
                  </Button>
                  <Button variant="info" onClick={() => handleExport("word")}>
                    Word
                  </Button>
                </div>
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
                      {filteredAttendance.map((att, index) => (
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