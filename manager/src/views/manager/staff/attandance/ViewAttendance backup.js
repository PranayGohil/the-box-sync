import React, { useEffect, useState } from "react";
import { useParams, useHistory } from "react-router-dom";
import axios from "axios";
import { Row, Col, Card, Button, Alert, Spinner, Form, Badge } from "react-bootstrap";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import { toast } from "react-toastify";

import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import JsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Document, Packer, Paragraph, Table, TableCell, TableRow, TextRun } from "docx";

const ViewAttendance = () => {
  const { id } = useParams();
  const history = useHistory();

  const main_title = 'View Attendance';
  const description = 'View staff attendance history and calendar';

  const [loading, setLoading] = useState({
    initial: true,
    exporting: {
      pdf: false,
      excel: false,
      word: false
    }
  });
  const [staffData, setStaffData] = useState(null);
  const [attendanceEvents, setAttendanceEvents] = useState([]);
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

  const formatDateDisplay = (dateString) => {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    return `${day}-${month}-${year}`;
  };

  const fetchAttendance = async () => {
    try {
      setLoading(prev => ({ ...prev, initial: true }));
      setError(null);
      const response = await axios.get(
        `${process.env.REACT_APP_API}/staff/get/${id}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );

      const staff = response.data.data;
      setStaffData(staff);

      const events = staff.attandance.map((att) => {
        let title = "";

        if (att.status === "present") {
          title = `Present\nIn: ${att.in_time || "N/A"}\nOut: ${att.out_time || "N/A"}`;
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
      toast.success('Attendance data loaded successfully!');
    } catch (err) {
      console.error("Error fetching attendance:", err);
      setError("Failed to load attendance data. Please try again.");
      toast.error('Failed to load attendance data.');
    } finally {
      setLoading(prev => ({ ...prev, initial: false }));
    }
  };

  const handleExport = async (type) => {
    if (filteredAttendance.length === 0) {
      toast.error("No attendance records found for selected dates.");
      return;
    }

    setLoading(prev => ({ ...prev, exporting: { ...prev.exporting, [type]: true } }));

    try {
      if (type === "pdf") {
        const doc = new JsPDF();
        doc.text(`${staffData.f_name} ${staffData.l_name} - Attendance Report`, 14, 10);
        doc.setFontSize(11);
        doc.text(`Generated: ${new Date().toLocaleDateString('en-IN')}`, 14, 20);

        autoTable(doc, {
          head: [["Date", "Status", "Check-In", "Check-Out"]],
          body: filteredAttendance.map(att => [
            att.date,
            att.status,
            att.in_time || "-",
            att.out_time || "-"
          ]),
          startY: 30,
          theme: 'grid',
          headStyles: { fillColor: [41, 128, 185], textColor: 255 },
          alternateRowStyles: { fillColor: [245, 245, 245] }
        });

        doc.save(`attendance_report_${staffData.staff_id}.pdf`);
        toast.success('PDF exported successfully!');
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
        saveAs(new Blob([excelBuffer], { type: "application/octet-stream" }), `attendance_report_${staffData.staff_id}.xlsx`);
        toast.success('Excel exported successfully!');
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
                new Paragraph({
                  text: `${staffData.f_name} ${staffData.l_name} - Attendance Report`,
                  bold: true
                }),
                new Paragraph({
                  text: `Generated on: ${new Date().toLocaleDateString('en-IN')}`,
                }),
                new Table({ rows }),
              ],
            },
          ],
        });

        const blob = await Packer.toBlob(doc);
        saveAs(blob, `attendance_report_${staffData.staff_id}.docx`);
        toast.success('Word document exported successfully!');
      }
    } catch (err) {
      console.error(`Error exporting ${type}:`, err);
      toast.error(`Failed to export ${type.toUpperCase()} file.`);
    } finally {
      setLoading(prev => ({ ...prev, exporting: { ...prev.exporting, [type]: false } }));
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [id]);

  const handleRefresh = () => {
    fetchAttendance();
  };

  if (loading.initial) {
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
              <Spinner animation="border" variant="primary" className="mb-3" />
              <h5>Loading Attendance Data...</h5>
              <p className="text-muted">Please wait while we fetch attendance history</p>
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
              <Col xs="auto" className="d-flex gap-2">
                <Button
                  variant="outline-primary"
                  onClick={handleRefresh}
                  disabled={loading.initial}
                >
                  <CsLineIcons icon="refresh" className="me-2" />
                  Refresh
                </Button>
                <Button
                  variant="outline-secondary"
                  onClick={() => history.goBack()}
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
              <Button
                variant="outline-danger"
                size="sm"
                className="ms-3"
                onClick={fetchAttendance}
                disabled={loading.initial}
              >
                Retry
              </Button>
            </Alert>
          )}

          {!staffData ? (
            <Alert variant="warning" className="my-4">
              <CsLineIcons icon="warning" className="me-2" />
              Staff data not found. This staff member may have been deleted.
              <div className="mt-3">
                <Button variant="outline-primary" onClick={() => history.push('/staff/attendance')}>
                  <CsLineIcons icon="arrow-left" className="me-2" />
                  Back to Attendance
                </Button>
              </div>
            </Alert>
          ) : (
            <>
              <Card className="mb-4">
                <Card.Header>
                  <Card.Title className="mb-0">
                    <CsLineIcons icon="user" className="me-2" />
                    Staff Information
                  </Card.Title>
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col md={3}>
                      <div className="mb-3">
                        <small className="text-muted d-block">Staff ID</small>
                        <strong>{staffData.staff_id}</strong>
                      </div>
                    </Col>
                    <Col md={3}>
                      <div className="mb-3">
                        <small className="text-muted d-block">Name</small>
                        <strong>{staffData.f_name} {staffData.l_name}</strong>
                      </div>
                    </Col>
                    <Col md={3}>
                      <div className="mb-3">
                        <small className="text-muted d-block">Position</small>
                        <strong>{staffData.position}</strong>
                      </div>
                    </Col>
                    <Col md={3}>
                      <div className="mb-3">
                        <small className="text-muted d-block">Total Records</small>
                        <Badge bg="primary" className="px-3 py-2">
                          {staffData.attandance?.length || 0}
                        </Badge>
                      </div>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>

              <Card className="mb-5">
                <Card.Header className="d-flex justify-content-between align-items-center">
                  <Card.Title className="mb-0">
                    <CsLineIcons icon="calendar" className="me-2" />
                    Attendance Calendar
                  </Card.Title>
                  <Badge bg="light" text="dark" className="p-2">
                    <CsLineIcons icon="calendar" className="me-1" />
                    {staffData.attandance?.length || 0} days recorded
                  </Badge>
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
                      dayMaxEvents={2}
                    />
                  </div>
                </Card.Body>
                <Card.Footer className="bg-transparent">
                  <div className="d-flex flex-wrap gap-3">
                    <div className="d-flex align-items-center">
                      <div className="bg-success rounded me-2" style={{ width: '15px', height: '15px' }} />
                      <small>Present</small>
                    </div>
                    <div className="d-flex align-items-center">
                      <div className="bg-danger rounded me-2" style={{ width: '15px', height: '15px' }} />
                      <small>Absent</small>
                    </div>
                    <div className="d-flex align-items-center">
                      <div className="bg-secondary rounded me-2" style={{ width: '15px', height: '15px' }} />
                      <small>No Data</small>
                    </div>
                  </div>
                </Card.Footer>
              </Card>

              {staffData?.attandance && staffData.attandance.length > 0 && (
                <Card>
                  <Card.Header className="d-flex justify-content-between align-items-center">
                    <Card.Title className="mb-0">
                      <CsLineIcons icon="list" className="me-2" />
                      Attendance Summary
                      {startDate && endDate && (
                        <small className="text-muted ms-2">
                          (Filtered: {formatDateDisplay(startDate)} to {formatDateDisplay(endDate)})
                        </small>
                      )}
                    </Card.Title>
                    <div className="d-flex align-items-center">
                      <div className="d-flex align-items-center me-3">
                        <Form.Control
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="me-2"
                          size="sm"
                          disabled={loading.exporting.pdf || loading.exporting.excel || loading.exporting.word}
                        />
                        <Form.Control
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className="me-2"
                          size="sm"
                          disabled={loading.exporting.pdf || loading.exporting.excel || loading.exporting.word}
                        />
                      </div>
                      <div className="d-flex gap-2">
                        <Button
                          variant="primary"
                          onClick={() => handleExport("pdf")}
                          disabled={loading.exporting.pdf || loading.exporting.excel || loading.exporting.word}
                          size="sm"
                        >
                          {loading.exporting.pdf ? (
                            <Spinner animation="border" size="sm" className="me-2" />
                          ) : (
                            <CsLineIcons icon="file-pdf" className="me-2" />
                          )}
                          PDF
                        </Button>
                        <Button
                          variant="success"
                          onClick={() => handleExport("excel")}
                          disabled={loading.exporting.pdf || loading.exporting.excel || loading.exporting.word}
                          size="sm"
                        >
                          {loading.exporting.excel ? (
                            <Spinner animation="border" size="sm" className="me-2" />
                          ) : (
                            <CsLineIcons icon="file-excel" className="me-2" />
                          )}
                          Excel
                        </Button>
                        <Button
                          variant="info"
                          onClick={() => handleExport("word")}
                          disabled={loading.exporting.pdf || loading.exporting.excel || loading.exporting.word}
                          size="sm"
                        >
                          {loading.exporting.word ? (
                            <Spinner animation="border" size="sm" className="me-2" />
                          ) : (
                            <CsLineIcons icon="file-word" className="me-2" />
                          )}
                          Word
                        </Button>
                      </div>
                    </div>
                  </Card.Header>
                  <Card.Body>
                    <div className="table-responsive">
                      <table className="table table-striped table-hover">
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
                                <Badge bg={att.status === 'present' ? 'success' : 'danger'}>
                                  {att.status}
                                </Badge>
                              </td>
                              <td>{att.in_time || '-'}</td>
                              <td>{att.out_time || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {filteredAttendance.length === 0 && (
                        <Alert variant="info" className="text-center my-4">
                          <CsLineIcons icon="inbox" className="me-2" />
                          No attendance records found for the selected date range.
                        </Alert>
                      )}
                    </div>
                  </Card.Body>
                </Card>
              )}
            </>
          )}
        </Col>
      </Row>

      {/* Exporting overlay */}
      {(loading.exporting.pdf || loading.exporting.excel || loading.exporting.word) && (
        <div
          className="position-fixed top-0 left-0 w-100 h-100 d-flex justify-content-center align-items-center"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.7)',
            zIndex: 9999,
            backdropFilter: 'blur(2px)'
          }}
        >
          <Card className="shadow-lg border-0" style={{ minWidth: '200px' }}>
            <Card.Body className="text-center p-4">
              <Spinner
                animation="border"
                variant="primary"
                className="mb-3"
                style={{ width: '3rem', height: '3rem' }}
              />
              <h5 className="mb-0">
                {loading.exporting.pdf && 'Generating PDF...'}
                {loading.exporting.excel && 'Generating Excel...'}
                {loading.exporting.word && 'Generating Word Document...'}
              </h5>
              <small className="text-muted">Please wait a moment</small>
            </Card.Body>
          </Card>
        </div>
      )}
    </>
  );
};

export default ViewAttendance;