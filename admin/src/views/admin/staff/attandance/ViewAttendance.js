import React, { useEffect, useState } from "react";
import { useParams, useHistory } from "react-router-dom";
import axios from "axios";
import { Row, Col, Card, Button, Alert, Spinner, Form, Badge, Modal } from "react-bootstrap";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import CsLineIcons from 'cs-line-icons/CsLineIcons';

import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Document, Packer, Paragraph, Table, TableCell, TableRow, TextRun, AlignmentType, WidthType } from "docx";

const ViewAttendance = () => {
  const { id } = useParams();
  const history = useHistory();

  const main_title = 'View Attendance';
  const description = 'View staff attendance history and calendar';

  const [staffData, setStaffData] = useState(null);
  const [attendanceEvents, setAttendanceEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedAttendance, setSelectedAttendance] = useState(null);

  const [stats, setStats] = useState({
    totalPresent: 0,
    totalAbsent: 0,
    totalDays: 0,
    attendanceRate: 0,
    avgHoursWorked: 0
  });

  const breadcrumbs = [
    { to: '', text: 'Home' },
    { to: 'attendance', text: 'Attendance Management' },
    { to: `attendance/view/${id}`, text: 'View Attendance' },
  ];

  // Calculate working hours
  const calculateWorkingHours = (inTime, outTime) => {
    if (!inTime || !outTime) return null;
    
    const [inHour, inMin] = inTime.split(':').map(Number);
    const [outHour, outMin] = outTime.split(':').map(Number);
    
    let totalMinutes = (outHour * 60 + outMin) - (inHour * 60 + inMin);
    
    // Handle overnight shifts
    if (totalMinutes < 0) {
      totalMinutes += 24 * 60;
    }
    
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    return { hours, minutes, total: totalMinutes / 60 };
  };

  // Format date for display
  const formatDateDisplay = (dateString) => {
    const [year, month, day] = dateString.split('-');
    return `${day}-${month}-${year}`;
  };

  // Filter attendance records
  const filteredAttendance = staffData?.attandance?.filter(att => {
    // Date filter
    if (startDate && endDate) {
      const date = new Date(att.date);
      if (date < new Date(startDate) || date > new Date(endDate)) {
        return false;
      }
    }

    // Status filter
    if (statusFilter !== "all" && att.status !== statusFilter) {
      return false;
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        att.date.includes(query) ||
        att.status.toLowerCase().includes(query) ||
        att.in_time?.toLowerCase().includes(query) ||
        att.out_time?.toLowerCase().includes(query)
      );
    }

    return true;
  }) || [];

  // Calculate statistics
  useEffect(() => {
    if (staffData?.attandance) {
      const present = staffData.attandance.filter(a => a.status === 'present').length;
      const absent = staffData.attandance.filter(a => a.status === 'absent').length;
      const total = staffData.attandance.length;
      
      let totalHours = 0;
      let validShifts = 0;
      
      staffData.attandance.forEach(att => {
        if (att.in_time && att.out_time) {
          const hours = calculateWorkingHours(att.in_time, att.out_time);
          if (hours) {
            totalHours += hours.total;
            validShifts++;
          }
        }
      });

      setStats({
        totalPresent: present,
        totalAbsent: absent,
        totalDays: total,
        attendanceRate: total > 0 ? ((present / total) * 100).toFixed(1) : 0,
        avgHoursWorked: validShifts > 0 ? (totalHours / validShifts).toFixed(1) : 0
      });
    }
  }, [staffData]);

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

      // Create calendar events
      const events = staff.attandance.map((att) => {
        let title = "";
        let backgroundColor = "";
        let borderColor = "";

        if (att.status === "present") {
          const hours = calculateWorkingHours(att.in_time, att.out_time);
          if (att.in_time && att.out_time && hours) {
            title = `✓ ${hours.hours}h ${hours.minutes}m`;
            backgroundColor = "#28a745";
          } else if (att.in_time && !att.out_time) {
            title = "⏳ In Progress";
            backgroundColor = "#ffc107";
          } else {
            title = "✓ Present";
            backgroundColor = "#28a745";
          }
          borderColor = backgroundColor;
        } else if (att.status === "absent") {
          title = "✗ Absent";
          backgroundColor = "#dc3545";
          borderColor = "#dc3545";
        }

        return {
          title,
          date: att.date,
          backgroundColor,
          borderColor,
          textColor: "#ffffff",
          extendedProps: {
            attendance: att
          }
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

  const handleEventClick = (clickInfo) => {
    setSelectedAttendance(clickInfo.event.extendedProps.attendance);
    setShowDetailModal(true);
  };

  const handleExport = (type) => {
    if (filteredAttendance.length === 0) {
      alert("No attendance records found for the selected filters.");
      return;
    }

    const exportData = filteredAttendance.map(att => {
      const hours = calculateWorkingHours(att.in_time, att.out_time);
      return {
        date: formatDateDisplay(att.date),
        status: att.status.toUpperCase(),
        in_time: att.in_time || "-",
        out_time: att.out_time || "-",
        working_hours: hours ? `${hours.hours}h ${hours.minutes}m` : "-"
      };
    });

    if (type === "pdf") {
      const doc = new jsPDF();
      
      // Add header
      doc.setFontSize(18);
      doc.text(`Attendance Report`, 14, 15);
      doc.setFontSize(11);
      doc.text(`${staffData.f_name} ${staffData.l_name} (${staffData.staff_id})`, 14, 22);
      doc.text(`Position: ${staffData.position}`, 14, 28);
      doc.setFontSize(9);
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 34);
      
      // Add statistics
      doc.text(`Total Days: ${stats.totalDays} | Present: ${stats.totalPresent} | Absent: ${stats.totalAbsent} | Rate: ${stats.attendanceRate}%`, 14, 40);

      // Add table
      autoTable(doc, {
        head: [["Date", "Status", "Check-In", "Check-Out", "Hours Worked"]],
        body: exportData.map(att => [
          att.date,
          att.status,
          att.in_time,
          att.out_time,
          att.working_hours
        ]),
        startY: 45,
        styles: { fontSize: 9 },
        headStyles: { fillColor: [41, 128, 185] }
      });

      doc.save(`${staffData.staff_id}_attendance_report.pdf`);
    }

    if (type === "excel") {
      const worksheet = XLSX.utils.json_to_sheet(
        exportData.map(att => ({
          Date: att.date,
          Status: att.status,
          "Check-In": att.in_time,
          "Check-Out": att.out_time,
          "Working Hours": att.working_hours
        }))
      );

      // Add summary at the top
      const summary = [
        [`Attendance Report - ${staffData.f_name} ${staffData.l_name}`],
        [`Staff ID: ${staffData.staff_id}`],
        [`Position: ${staffData.position}`],
        [`Total Days: ${stats.totalDays}`],
        [`Present: ${stats.totalPresent}`],
        [`Absent: ${stats.totalAbsent}`],
        [`Attendance Rate: ${stats.attendanceRate}%`],
        [`Average Hours: ${stats.avgHoursWorked}h`],
        [],
      ];

      XLSX.utils.sheet_add_aoa(worksheet, summary, { origin: "A1" });
      XLSX.utils.sheet_add_json(worksheet, exportData.map(att => ({
        Date: att.date,
        Status: att.status,
        "Check-In": att.in_time,
        "Check-Out": att.out_time,
        "Working Hours": att.working_hours
      })), { origin: -1, skipHeader: false });

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance");
      const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
      saveAs(
        new Blob([excelBuffer], { type: "application/octet-stream" }),
        `${staffData.staff_id}_attendance_report.xlsx`
      );
    }

    if (type === "word") {
      const rows = [
        new TableRow({
          children: ["Date", "Status", "Check-In", "Check-Out", "Hours Worked"].map(
            heading =>
              new TableCell({
                children: [
                  new Paragraph({
                    children: [new TextRun({ text: heading, bold: true })],
                    alignment: AlignmentType.CENTER
                  })
                ],
                width: { size: 20, type: WidthType.PERCENTAGE }
              })
          ),
        }),
        ...exportData.map(
          att =>
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph(att.date)] }),
                new TableCell({ children: [new Paragraph(att.status)] }),
                new TableCell({ children: [new Paragraph(att.in_time)] }),
                new TableCell({ children: [new Paragraph(att.out_time)] }),
                new TableCell({ children: [new Paragraph(att.working_hours)] }),
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
                text: "Attendance Report",
                heading: "Heading1",
                alignment: AlignmentType.CENTER
              }),
              new Paragraph({
                text: `${staffData.f_name} ${staffData.l_name} (${staffData.staff_id})`,
                alignment: AlignmentType.CENTER
              }),
              new Paragraph({
                text: `Position: ${staffData.position}`,
                alignment: AlignmentType.CENTER
              }),
              new Paragraph({ text: "" }),
              new Paragraph({
                text: `Statistics: Total Days: ${stats.totalDays} | Present: ${stats.totalPresent} | Absent: ${stats.totalAbsent} | Rate: ${stats.attendanceRate}%`
              }),
              new Paragraph({ text: "" }),
              new Table({ rows }),
            ],
          },
        ],
      });

      Packer.toBlob(doc).then((blob) => {
        saveAs(blob, `${staffData.staff_id}_attendance_report.docx`);
      });
    }
  };

  const clearFilters = () => {
    setStartDate("");
    setEndDate("");
    setStatusFilter("all");
    setSearchQuery("");
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
                  onClick={() => history.push('/attendance')}
                >
                  <CsLineIcons icon="arrow-left" className="me-2" />
                  Back to Attendance
                </Button>
              </Col>
            </Row>
          </div>

          {error && (
            <Alert variant="danger" className="mb-4">
              <CsLineIcons icon="warning-hexagon" className="me-2" />
              {error}
            </Alert>
          )}

          {/* Staff Information Card */}
          {staffData && (
            <Card className="mb-4">
              <Card.Header>
                <Card.Title className="mb-0">
                  <CsLineIcons icon="user" className="me-2" />
                  Staff Information
                </Card.Title>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={3} className="mb-3 mb-md-0">
                    <div className="text-muted small">Staff ID</div>
                    <div className="fw-bold">{staffData.staff_id}</div>
                  </Col>
                  <Col md={3} className="mb-3 mb-md-0">
                    <div className="text-muted small">Full Name</div>
                    <div className="fw-bold">{staffData.f_name} {staffData.l_name}</div>
                  </Col>
                  <Col md={3} className="mb-3 mb-md-0">
                    <div className="text-muted small">Position</div>
                    <div className="fw-bold">{staffData.position}</div>
                  </Col>
                  <Col md={3}>
                    <div className="text-muted small">Total Records</div>
                    <div className="fw-bold">{staffData.attandance?.length || 0}</div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          )}

          {/* Statistics Cards */}
          <Row className="g-3 mb-4">
            <Col xs={6} md={3}>
              <Card className="h-100">
                <Card.Body className="text-center">
                  <CsLineIcons icon="calendar" size="24" className="text-primary mb-2" />
                  <div className="text-muted small">Total Days</div>
                  <h3 className="mb-0">{stats.totalDays}</h3>
                </Card.Body>
              </Card>
            </Col>
            <Col xs={6} md={3}>
              <Card className="h-100">
                <Card.Body className="text-center">
                  <CsLineIcons icon="check-circle" size="24" className="text-success mb-2" />
                  <div className="text-muted small">Present</div>
                  <h3 className="mb-0 text-success">{stats.totalPresent}</h3>
                </Card.Body>
              </Card>
            </Col>
            <Col xs={6} md={3}>
              <Card className="h-100">
                <Card.Body className="text-center">
                  <CsLineIcons icon="close-circle" size="24" className="text-danger mb-2" />
                  <div className="text-muted small">Absent</div>
                  <h3 className="mb-0 text-danger">{stats.totalAbsent}</h3>
                </Card.Body>
              </Card>
            </Col>
            <Col xs={6} md={3}>
              <Card className="h-100">
                <Card.Body className="text-center">
                  <CsLineIcons icon="trending-up" size="24" className="text-info mb-2" />
                  <div className="text-muted small">Attendance Rate</div>
                  <h3 className="mb-0 text-info">{stats.attendanceRate}%</h3>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Calendar View */}
          <Card className="mb-4">
            <Card.Header>
              <Card.Title className="mb-0">
                <CsLineIcons icon="calendar" className="me-2" />
                Calendar View
              </Card.Title>
            </Card.Header>
            <Card.Body>
              <div className="calendar-container">
                <FullCalendar
                  plugins={[dayGridPlugin, interactionPlugin]}
                  initialView="dayGridMonth"
                  events={attendanceEvents}
                  eventClick={handleEventClick}
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
                  dayMaxEvents={true}
                  eventDisplay="block"
                />
              </div>
            </Card.Body>
            <Card.Footer className="bg-transparent">
              <div className="d-flex align-items-center flex-wrap gap-3">
                <div className="d-flex align-items-center">
                  <div className="bg-success rounded me-2" style={{ width: '15px', height: '15px' }} />
                  <small>Present</small>
                </div>
                <div className="d-flex align-items-center">
                  <div className="bg-danger rounded me-2" style={{ width: '15px', height: '15px' }} />
                  <small>Absent</small>
                </div>
                <div className="d-flex align-items-center">
                  <div className="bg-warning rounded me-2" style={{ width: '15px', height: '15px' }} />
                  <small>In Progress</small>
                </div>
                <small className="text-muted ms-auto">
                  <CsLineIcons icon="info-hexagon" className="me-1" />
                  Click on any event to view details
                </small>
              </div>
            </Card.Footer>
          </Card>

          {/* Attendance Records Table */}
          {staffData?.attandance && staffData.attandance.length > 0 && (
            <Card>
              <Card.Header>
                <Row className="align-items-center g-2">
                  <Col xs={12} md={6}>
                    <Card.Title className="mb-0">
                      <CsLineIcons icon="layout" className="me-2" />
                      Attendance Records
                    </Card.Title>
                  </Col>
                  <Col xs={12} md={6} className="text-md-end">
                    <Button variant="danger" size="sm" onClick={() => handleExport("pdf")} className="me-2">
                      <CsLineIcons icon="file-text" className="me-1" />
                      PDF
                    </Button>
                    <Button variant="success" size="sm" onClick={() => handleExport("excel")} className="me-2">
                      <CsLineIcons icon="file-empty" className="me-1" />
                      Excel
                    </Button>
                    <Button variant="info" size="sm" onClick={() => handleExport("word")}>
                      <CsLineIcons icon="file-text" className="me-1" />
                      Word
                    </Button>
                  </Col>
                </Row>
              </Card.Header>
              <Card.Body>
                {/* Filters */}
                <Row className="g-2 mb-3">
                  <Col xs={12} md={3}>
                    <Form.Group>
                      <Form.Label className="small">Start Date</Form.Label>
                      <Form.Control
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        size="sm"
                      />
                    </Form.Group>
                  </Col>
                  <Col xs={12} md={3}>
                    <Form.Group>
                      <Form.Label className="small">End Date</Form.Label>
                      <Form.Control
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        size="sm"
                      />
                    </Form.Group>
                  </Col>
                  <Col xs={12} md={2}>
                    <Form.Group>
                      <Form.Label className="small">Status</Form.Label>
                      <Form.Select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        size="sm"
                      >
                        <option value="all">All</option>
                        <option value="present">Present</option>
                        <option value="absent">Absent</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col xs={12} md={3}>
                    <Form.Group>
                      <Form.Label className="small">Search</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Search..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        size="sm"
                      />
                    </Form.Group>
                  </Col>
                  <Col xs={12} md={1} className="d-flex align-items-end">
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      onClick={clearFilters}
                      className="w-100"
                      title="Clear Filters"
                    >
                      <CsLineIcons icon="close" />
                    </Button>
                  </Col>
                </Row>

                {filteredAttendance.length === 0 ? (
                  <Alert variant="info" className="text-center mb-0">
                    <CsLineIcons icon="info-hexagon" className="me-2" />
                    No attendance records found matching the filters.
                  </Alert>
                ) : (
                  <>
                    <div className="text-muted small mb-2">
                      Showing {filteredAttendance.length} of {staffData.attandance.length} records
                    </div>
                    <div className="table-responsive">
                      <table className="table table-hover">
                        <thead className="table-light">
                          <tr>
                            <th>Date</th>
                            <th>Status</th>
                            <th>Check-In Time</th>
                            <th>Check-Out Time</th>
                            <th>Working Hours</th>
                            <th className="text-center">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredAttendance.sort((a, b) => new Date(b.date) - new Date(a.date)).map((att, index) => {
                            const hours = calculateWorkingHours(att.in_time, att.out_time);
                            return (
                              <tr key={index}>
                                <td>
                                  <div className="fw-medium">{formatDateDisplay(att.date)}</div>
                                  <small className="text-muted">{new Date(att.date).toLocaleDateString('en-US', { weekday: 'short' })}</small>
                                </td>
                                <td>
                                  {att.status === 'present' ? (
                                    <Badge bg="success" className="d-inline-flex align-items-center">
                                      <CsLineIcons icon="check" className="me-1" size={12} />
                                      Present
                                    </Badge>
                                  ) : (
                                    <Badge bg="danger" className="d-inline-flex align-items-center">
                                      <CsLineIcons icon="close" className="me-1" size={12} />
                                      Absent
                                    </Badge>
                                  )}
                                </td>
                                <td>
                                  {att.in_time ? (
                                    <div>
                                      <CsLineIcons icon="login" className="me-1 text-success" size={14} />
                                      {att.in_time}
                                    </div>
                                  ) : (
                                    <span className="text-muted">-</span>
                                  )}
                                </td>
                                <td>
                                  {att.out_time ? (
                                    <div>
                                      <CsLineIcons icon="logout" className="me-1 text-danger" size={14} />
                                      {att.out_time}
                                    </div>
                                  ) : att.in_time ? (
                                    <Badge bg="warning" text="dark">In Progress</Badge>
                                  ) : (
                                    <span className="text-muted">-</span>
                                  )}
                                </td>
                                <td>
                                  {hours ? (
                                    <div>
                                      <CsLineIcons icon="clock" className="me-1 text-primary" size={14} />
                                      <span className="fw-medium">{hours.hours}h {hours.minutes}m</span>
                                    </div>
                                  ) : (
                                    <span className="text-muted">-</span>
                                  )}
                                </td>
                                <td className="text-center">
                                  <Button
                                    variant="outline-primary"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedAttendance(att);
                                      setShowDetailModal(true);
                                    }}
                                  >
                                    <CsLineIcons icon="eye" />
                                  </Button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </Card.Body>
              <Card.Footer className="bg-transparent">
                <small className="text-muted">
                  <CsLineIcons icon="info-hexagon" className="me-1" />
                  Average working hours: {stats.avgHoursWorked} hours per day
                </small>
              </Card.Footer>
            </Card>
          )}
        </Col>
      </Row>

      {/* Attendance Detail Modal */}
      <Modal show={showDetailModal} onHide={() => setShowDetailModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            <CsLineIcons icon="calendar" className="me-2" />
            Attendance Details
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedAttendance && (
            <div>
              <Row className="mb-3">
                <Col xs={6}>
                  <div className="text-muted small">Date</div>
                  <div className="fw-bold">{formatDateDisplay(selectedAttendance.date)}</div>
                  <div className="text-muted small">{new Date(selectedAttendance.date).toLocaleDateString('en-US', { weekday: 'long' })}</div>
                </Col>
                <Col xs={6} className="text-end">
                  <div className="text-muted small">Status</div>
                  {selectedAttendance.status === 'present' ? (
                    <Badge bg="success" className="px-3 py-2">
                      <CsLineIcons icon="check" className="me-1" />
                      Present
                    </Badge>
                  ) : (
                    <Badge bg="danger" className="px-3 py-2">
                      <CsLineIcons icon="close" className="me-1" />
                      Absent
                    </Badge>
                  )}
                </Col>
              </Row>

              <hr />

              {selectedAttendance.status === 'present' && (
                <Row>
                  <Col xs={12} className="mb-3">
                    <div className="d-flex align-items-center p-3 bg-light rounded">
                      <CsLineIcons icon="login" className="text-success me-3" size={24} />
                      <div className="flex-grow-1">
                        <div className="text-muted small">Check-In Time</div>
                        <div className="fw-bold fs-5">{selectedAttendance.in_time || 'Not recorded'}</div>
                      </div>
                    </div>
                  </Col>
                  <Col xs={12} className="mb-3">
                    <div className="d-flex align-items-center p-3 bg-light rounded">
                      <CsLineIcons icon="logout" className="text-danger me-3" size={24} />
                      <div className="flex-grow-1">
                        <div className="text-muted small">Check-Out Time</div>
                        {selectedAttendance.out_time ? (
                          <div className="fw-bold fs-5">{selectedAttendance.out_time}</div>
                        ) : (
                          <Badge bg="warning" text="dark">In Progress</Badge>
                        )}
                      </div>
                    </div>
                  </Col>
                  {selectedAttendance.in_time && selectedAttendance.out_time && (
                    <Col xs={12}>
                      <div className="d-flex align-items-center p-3 bg-primary bg-opacity-10 rounded">
                        <CsLineIcons icon="clock" className="text-primary me-3" size={24} />
                        <div className="flex-grow-1">
                          <div className="text-muted small">Total Working Hours</div>
                          <div className="fw-bold fs-5 text-primary">
                            {(() => {
                              const hours = calculateWorkingHours(selectedAttendance.in_time, selectedAttendance.out_time);
                              return hours ? `${hours.hours} hours ${hours.minutes} minutes` : 'N/A';
                            })()}
                          </div>
                        </div>
                      </div>
                    </Col>
                  )}
                </Row>
              )}

              {selectedAttendance.status === 'absent' && (
                <Alert variant="danger" className="mb-0">
                  <CsLineIcons icon="info-hexagon" className="me-2" />
                  Staff was marked absent on this day.
                </Alert>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDetailModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default ViewAttendance;