import React, { useEffect, useState } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import axios from 'axios';
import {
  Row, Col, Card, Button, Alert, Spinner, Form, Badge,
  Modal, ProgressBar, Toast, ToastContainer,
} from 'react-bootstrap';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Document, Packer, Paragraph, Table, TableCell, TableRow, TextRun, AlignmentType, WidthType } from 'docx';
import { format } from 'date-fns';

const ViewAttendance = () => {
  const { id } = useParams();
  const history = useHistory();

  const main_title = 'View Attendance';
  const description = 'View staff attendance history and calendar';

  const [staffData, setStaffData] = useState(null);       // staff info only
  const [attendance, setAttendance] = useState([]);        // attendance records array
  const [attendanceEvents, setAttendanceEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedAttendance, setSelectedAttendance] = useState(null);

  // Export states
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportType, setExportType] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportOptions, setExportOptions] = useState({
    includeStaffInfo: true,
    includeStatistics: true,
    includeDetailedRecords: true,
    includeCharts: true,
    recordsLimit: 'all',
  });

  const [stats, setStats] = useState({
    totalPresent: 0,
    totalAbsent: 0,
    totalDays: 0,
    attendanceRate: 0,
    avgHoursWorked: 0,
  });

  const breadcrumbs = [
    { to: '', text: 'Home' },
    { to: 'attendance', text: 'Attendance Management' },
    { to: `attendance/view/${id}`, text: 'View Attendance' },
  ];

  // ── Helpers ─────────────────────────────────────────────────────────────────

  const authHeader = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
  });

  const calculateWorkingHours = (inTime, outTime) => {
    if (!inTime || !outTime) return null;
    const parseTime = (timeStr) => {
      const [time, period] = timeStr.split(' ');
      let [hours, minutes] = time.split(':').map(Number);
      if (period === 'PM' && hours !== 12) hours += 12;
      else if (period === 'AM' && hours === 12) hours = 0;
      return { hours, minutes };
    };
    const inParsed = parseTime(inTime);
    const outParsed = parseTime(outTime);
    let totalMinutes =
      outParsed.hours * 60 + outParsed.minutes -
      (inParsed.hours * 60 + inParsed.minutes);
    if (totalMinutes < 0) totalMinutes += 24 * 60;
    return { hours: Math.floor(totalMinutes / 60), minutes: totalMinutes % 60, total: totalMinutes / 60 };
  };

  const isOvernightShift = (inTime, outTime) => {
    if (!inTime || !outTime) return false;
    const [inHour] = inTime.split(':').map(Number);
    const [outHour] = outTime.split(':').map(Number);
    return inHour >= 18 && outHour < 12;
  };

  const getCheckoutDisplayDate = (checkInDate, inTime, outTime) => {
    if (!isOvernightShift(inTime, outTime)) return null;
    const date = new Date(checkInDate);
    date.setDate(date.getDate() + 1);
    return date.toISOString().split('T')[0];
  };

  const formatDateDisplay = (dateString) => {
    const [year, month, day] = dateString.split('-');
    return `${day}-${month}-${year}`;
  };

  const showSuccessToast = (message) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  // ── Filter attendance records ────────────────────────────────────────────────
  const filteredAttendance = attendance.filter((att) => {
    if (startDate && endDate) {
      const date = new Date(att.date);
      if (date < new Date(startDate) || date > new Date(endDate)) return false;
    }
    if (statusFilter !== 'all' && att.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        att.date.includes(q) ||
        att.status?.toLowerCase().includes(q) ||
        att.in_time?.toLowerCase().includes(q) ||
        att.out_time?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // ── Calculate stats ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (attendance.length === 0) return;

    const present = attendance.filter((a) => a.status === 'present').length;
    const absent = attendance.filter((a) => a.status === 'absent').length;
    const total = attendance.length;

    let totalHours = 0;
    let validShifts = 0;
    attendance.forEach((att) => {
      const hours = calculateWorkingHours(att.in_time, att.out_time);
      if (hours) { totalHours += hours.total; validShifts++; }
    });

    setStats({
      totalPresent: present,
      totalAbsent: absent,
      totalDays: total,
      attendanceRate: total > 0 ? ((present / total) * 100).toFixed(1) : 0,
      avgHoursWorked: validShifts > 0 ? (totalHours / validShifts).toFixed(1) : 0,
    });
  }, [attendance]);

  // ── Fetch data ───────────────────────────────────────────────────────────────
  // New endpoint: GET /attendance/get/:staffId
  // Returns { data: { ...staffInfo, attendance: [...] } }
  const fetchAttendance = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching attendance data for staff ID:', id);
      const response = await axios.get(
        `${process.env.REACT_APP_API}/attendance/get/${id}`,
        authHeader()
      );

      const { attendance: records, ...staff } = response.data.data;

      setStaffData(staff);
      setAttendance(records || []);

      // Build calendar events from records array
      const events = (records || []).map((att) => {
        let title = '';
        let backgroundColor = '';

        if (att.status === 'present') {
          const hours = calculateWorkingHours(att.in_time, att.out_time);
          const overnight = isOvernightShift(att.in_time, att.out_time);
          if (att.in_time && att.out_time && hours) {
            title = `${overnight ? '🌙 ' : ''}${hours.hours}h ${hours.minutes}m`;
            backgroundColor = overnight ? '#6f42c1' : '#28a745';
          } else if (att.in_time && !att.out_time) {
            title = '⏳ In Progress';
            backgroundColor = '#ffc107';
          } else {
            title = '✓ Present';
            backgroundColor = '#28a745';
          }
        } else if (att.status === 'absent') {
          title = '✗ Absent';
          backgroundColor = '#dc3545';
        }

        return {
          title,
          date: att.date,
          backgroundColor,
          borderColor: backgroundColor,
          textColor: '#ffffff',
          extendedProps: { attendance: att },
        };
      });

      setAttendanceEvents(events);
    } catch (err) {
      console.error('Error fetching attendance:', err);
      setError('Failed to load attendance data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [id]);

  const handleEventClick = (clickInfo) => {
    setSelectedAttendance(clickInfo.event.extendedProps.attendance);
    setShowDetailModal(true);
  };

  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
    setStatusFilter('all');
    setSearchQuery('');
  };

  // ── Export: Excel ────────────────────────────────────────────────────────────
  const exportToExcel = async () => {
    if (!staffData) return;
    setExporting(true); setExportProgress(10); setExportType('Excel');
    try {
      const wb = XLSX.utils.book_new();

      if (exportOptions.includeStatistics) {
        setExportProgress(20);
        const dashboardData = [
          ['ATTENDANCE REPORT DASHBOARD'], [],
          ['Staff Information'],
          ['Staff ID:', staffData.staff_id],
          ['Name:', `${staffData.f_name} ${staffData.l_name}`],
          ['Position:', staffData.position],
          ['Report Generated:', format(new Date(), 'dd MMM yyyy HH:mm')],
          [], ['KEY METRICS'], ['Metric', 'Value'],
          ['Total Days', stats.totalDays],
          ['Total Present', stats.totalPresent],
          ['Total Absent', stats.totalAbsent],
          ['Attendance Rate', `${stats.attendanceRate}%`],
          ['Avg Hours/Day', `${stats.avgHoursWorked} hours`],
        ];
        const dashboardSheet = XLSX.utils.aoa_to_sheet(dashboardData);
        dashboardSheet['!cols'] = [{ wch: 25 }, { wch: 30 }];
        XLSX.utils.book_append_sheet(wb, dashboardSheet, 'Dashboard');
      }

      if (exportOptions.includeDetailedRecords) {
        setExportProgress(50);
        const records = exportOptions.recordsLimit === 'all'
          ? filteredAttendance
          : filteredAttendance.slice(0, parseInt(exportOptions.recordsLimit, 10));

        const data = [
          ['ATTENDANCE RECORDS'], [],
          ['Check-In Date', 'Status', 'Check-In Time', 'Check-Out Time', 'Check-Out Date', 'Working Hours', 'Shift Type'],
        ];
        records.forEach((att) => {
          const hours = calculateWorkingHours(att.in_time, att.out_time);
          const overnight = isOvernightShift(att.in_time, att.out_time);
          const checkoutDate = overnight ? getCheckoutDisplayDate(att.date, att.in_time, att.out_time) : null;
          data.push([
            formatDateDisplay(att.date),
            att.status.toUpperCase(),
            att.in_time || '-',
            att.out_time || '-',
            checkoutDate ? formatDateDisplay(checkoutDate) : 'Same Day',
            hours ? `${hours.hours}h ${hours.minutes}m` : '-',
            overnight ? 'Night Shift' : 'Day Shift',
          ]);
        });

        const sheet = XLSX.utils.aoa_to_sheet(data);
        sheet['!cols'] = [{ wch: 18 }, { wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 18 }, { wch: 15 }, { wch: 15 }];
        XLSX.utils.book_append_sheet(wb, sheet, 'Attendance Records');
      }

      setExportProgress(90);
      XLSX.writeFile(wb, `${staffData.staff_id}_Attendance_Report.xlsx`);
      setExportProgress(100);
      showSuccessToast('Excel report exported successfully!');
    } catch (err) {
      console.error(err);
      showSuccessToast('Error exporting Excel file');
    } finally {
      setTimeout(() => { setExporting(false); setExportProgress(0); setExportType(''); }, 500);
    }
  };

  // ── Export: PDF ──────────────────────────────────────────────────────────────
  const exportToPDF = async () => {
    if (!staffData) return;
    setExporting(true); setExportProgress(10); setExportType('PDF');
    try {
      const doc = new jsPDF();
      let yPosition = 20;

      if (exportOptions.includeStaffInfo) {
        setExportProgress(20);
        doc.setFillColor(68, 114, 196);
        doc.rect(0, 0, 210, 40, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(24); doc.setFont(undefined, 'bold');
        doc.text('ATTENDANCE REPORT', 105, 20, { align: 'center' });
        doc.setFontSize(14); doc.setFont(undefined, 'normal');
        doc.text(`${staffData.f_name} ${staffData.l_name}`, 105, 30, { align: 'center' });
        yPosition = 50;
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(11);
        doc.text(`Staff ID: ${staffData.staff_id}`, 20, yPosition); yPosition += 6;
        doc.text(`Position: ${staffData.position}`, 20, yPosition); yPosition += 6;
        doc.text(`Report Generated: ${format(new Date(), 'dd MMM yyyy HH:mm')}`, 20, yPosition); yPosition += 15;
      }

      if (exportOptions.includeStatistics) {
        setExportProgress(35);
        doc.setFontSize(16); doc.setFont(undefined, 'bold');
        doc.text('Performance Summary', 20, yPosition); yPosition += 12;
        const metrics = [
          { label: 'Total Days', value: stats.totalDays.toString(), color: [68, 114, 196] },
          { label: 'Present', value: stats.totalPresent.toString(), color: [76, 175, 80] },
          { label: 'Absent', value: stats.totalAbsent.toString(), color: [244, 67, 54] },
        ];
        metrics.forEach((m, idx) => {
          const xPos = 20 + idx * 60;
          doc.setFillColor(...m.color);
          doc.roundedRect(xPos, yPosition, 55, 30, 3, 3, 'F');
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(9); doc.setFont(undefined, 'normal');
          doc.text(m.label, xPos + 27.5, yPosition + 10, { align: 'center' });
          doc.setFontSize(14); doc.setFont(undefined, 'bold');
          doc.text(m.value, xPos + 27.5, yPosition + 22, { align: 'center' });
        });
        yPosition += 45;
        doc.setTextColor(0, 0, 0); doc.setFontSize(10); doc.setFont(undefined, 'normal');
        doc.text(`Attendance Rate: ${stats.attendanceRate}%`, 20, yPosition); yPosition += 6;
        doc.text(`Average Working Hours: ${stats.avgHoursWorked} hours/day`, 20, yPosition); yPosition += 15;
      }

      if (exportOptions.includeDetailedRecords) {
        setExportProgress(60);
        if (yPosition > 200) { doc.addPage(); yPosition = 20; }
        doc.setFontSize(14); doc.setFont(undefined, 'bold');
        doc.text('Attendance Records', 20, yPosition); yPosition += 8;

        const records = exportOptions.recordsLimit === 'all'
          ? filteredAttendance
          : filteredAttendance.slice(0, parseInt(exportOptions.recordsLimit, 10));

        const tableData = records.map((att) => {
          const hours = calculateWorkingHours(att.in_time, att.out_time);
          const overnight = isOvernightShift(att.in_time, att.out_time);
          const checkoutDate = overnight ? getCheckoutDisplayDate(att.date, att.in_time, att.out_time) : null;
          return [
            formatDateDisplay(att.date),
            att.status.toUpperCase(),
            att.in_time || '-',
            att.out_time || '-',
            checkoutDate ? formatDateDisplay(checkoutDate) : 'Same',
            hours ? `${hours.hours}h ${hours.minutes}m` : '-',
          ];
        });

        autoTable(doc, {
          startY: yPosition,
          head: [['Check-In', 'Status', 'In Time', 'Out Time', 'Out Date', 'Hours']],
          body: tableData,
          theme: 'striped',
          headStyles: { fillColor: [68, 114, 196], fontSize: 9, fontStyle: 'bold' },
          styles: { fontSize: 8 },
        });
      }

      setExportProgress(90);
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8); doc.setTextColor(128, 128, 128);
        doc.text(`${staffData.staff_id} - Attendance Report | Page ${i} of ${pageCount}`, 105, 290, { align: 'center' });
      }
      doc.save(`${staffData.staff_id}_Attendance_Report.pdf`);
      setExportProgress(100);
      showSuccessToast('PDF report exported successfully!');
    } catch (err) {
      console.error(err);
      showSuccessToast('Error exporting PDF file');
    } finally {
      setTimeout(() => { setExporting(false); setExportProgress(0); setExportType(''); }, 500);
    }
  };

  // ── Export: Word ─────────────────────────────────────────────────────────────
  const exportToWord = async () => {
    if (!staffData) return;
    setExporting(true); setExportProgress(10); setExportType('Word');
    try {
      setExportProgress(30);
      const records = exportOptions.recordsLimit === 'all'
        ? filteredAttendance
        : filteredAttendance.slice(0, parseInt(exportOptions.recordsLimit, 10));

      const rows = [
        new TableRow({
          children: ['Check-In Date', 'Status', 'In Time', 'Out Time', 'Out Date', 'Hours'].map(
            (heading) => new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: heading, bold: true })], alignment: AlignmentType.CENTER })],
              width: { size: 14, type: WidthType.PERCENTAGE },
            })
          ),
        }),
        ...records.map((att) => {
          const hours = calculateWorkingHours(att.in_time, att.out_time);
          const overnight = isOvernightShift(att.in_time, att.out_time);
          const checkoutDate = overnight ? getCheckoutDisplayDate(att.date, att.in_time, att.out_time) : null;
          return new TableRow({
            children: [
              new TableCell({ children: [new Paragraph(formatDateDisplay(att.date))] }),
              new TableCell({ children: [new Paragraph(att.status.toUpperCase())] }),
              new TableCell({ children: [new Paragraph(att.in_time || '-')] }),
              new TableCell({ children: [new Paragraph(att.out_time || '-')] }),
              new TableCell({ children: [new Paragraph(checkoutDate ? formatDateDisplay(checkoutDate) : 'Same Day')] }),
              new TableCell({ children: [new Paragraph(hours ? `${hours.hours}h ${hours.minutes}m` : '-')] }),
            ],
          });
        }),
      ];

      setExportProgress(60);
      const doc = new Document({
        sections: [{
          properties: {},
          children: [
            new Paragraph({ text: 'Attendance Report', heading: 'Heading1', alignment: AlignmentType.CENTER }),
            new Paragraph({ text: `${staffData.f_name} ${staffData.l_name} (${staffData.staff_id})`, alignment: AlignmentType.CENTER }),
            new Paragraph({ text: `Position: ${staffData.position}`, alignment: AlignmentType.CENTER }),
            new Paragraph({ text: '' }),
            new Paragraph({ text: `Total Days: ${stats.totalDays} | Present: ${stats.totalPresent} | Absent: ${stats.totalAbsent} | Rate: ${stats.attendanceRate}%` }),
            new Paragraph({ text: '' }),
            new Table({ rows }),
          ],
        }],
      });

      setExportProgress(90);
      Packer.toBlob(doc).then((blob) => {
        saveAs(blob, `${staffData.staff_id}_Attendance_Report.docx`);
        setExportProgress(100);
        showSuccessToast('Word report exported successfully!');
      });
    } catch (err) {
      console.error(err);
      showSuccessToast('Error exporting Word file');
    } finally {
      setTimeout(() => { setExporting(false); setExportProgress(0); setExportType(''); }, 500);
    }
  };

  const handleExportClick = (type) => { setShowExportModal(true); setExportType(type); };
  const handleExportConfirm = () => {
    setShowExportModal(false);
    if (exportType === 'Excel') exportToExcel();
    else if (exportType === 'PDF') exportToPDF();
    else if (exportType === 'Word') exportToWord();
  };

  // ── Loading state ────────────────────────────────────────────────────────────
  if (loading && !staffData) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <>
      <HtmlHead title={main_title} description={description} />

      <div className="page-title-container mb-3">
        <Row className="align-items-center">
          <Col>
            <h1 className="mb-0 pb-0 display-4">
              {staffData ? `${staffData.f_name} ${staffData.l_name}'s Attendance` : main_title}
            </h1>
            <BreadcrumbList items={breadcrumbs} />
          </Col>
          <Col xs="auto">
            <Button variant="outline-secondary" onClick={() => history.push('/attendance')}>
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

      {/* Staff Information */}
      {staffData && (
        <Card className="mb-4">
          <Card.Header>
            <Card.Title className="mb-0">
              <CsLineIcons icon="user" className="me-2" />Staff Information
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
                <div className="fw-bold">{attendance.length}</div>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      )}

      {/* Stats Cards */}
      <Row className="g-3 mb-4">
        {[
          { icon: 'calendar', label: 'Total Days', value: stats.totalDays, color: 'text-primary' },
          { icon: 'check-circle', label: 'Present', value: stats.totalPresent, color: 'text-success' },
          { icon: 'close-circle', label: 'Absent', value: stats.totalAbsent, color: 'text-danger' },
          { icon: 'trending-up', label: 'Attendance Rate', value: `${stats.attendanceRate}%`, color: 'text-info' },
        ].map((s) => (
          <Col xs={6} md={3} key={s.label}>
            <Card className="h-100">
              <Card.Body className="text-center">
                <CsLineIcons icon={s.icon} size="24" className={`${s.color} mb-2`} />
                <div className="text-muted small">{s.label}</div>
                <h3 className={`mb-0 ${s.color}`}>{s.value}</h3>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Filters */}
      <Card className="mb-4">
        <Card.Body>
          <Row className="g-3 align-items-end">
            <Col md={3}>
              <Form.Label>Start Date</Form.Label>
              <Form.Control type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </Col>
            <Col md={3}>
              <Form.Label>End Date</Form.Label>
              <Form.Control type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </Col>
            <Col md={2}>
              <Form.Label>Status</Form.Label>
              <Form.Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="all">All Status</option>
                <option value="present">Present</option>
                <option value="absent">Absent</option>
              </Form.Select>
            </Col>
            <Col md={3}>
              <Form.Label>Search</Form.Label>
              <Form.Control
                type="text"
                placeholder="Search records..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </Col>
            <Col md={1}>
              <Button variant="outline-secondary" className="w-100" onClick={clearFilters} title="Clear Filters">
                <CsLineIcons icon="close" />
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Export Buttons */}
      {staffData && (
        <Card className="mb-4">
          <Card.Body>
            <div className="d-flex gap-2 align-items-center">
              <Button variant="success" onClick={() => handleExportClick('Excel')} disabled={exporting}>
                <CsLineIcons icon="file-text" className="me-2" />Excel
              </Button>
              <Button variant="danger" onClick={() => handleExportClick('PDF')} disabled={exporting}>
                <CsLineIcons icon="file-text" className="me-2" />PDF
              </Button>
              <Button variant="info" onClick={() => handleExportClick('Word')} disabled={exporting}>
                <CsLineIcons icon="file-text" className="me-2" />Word
              </Button>
              {exporting && (
                <div className="flex-grow-1 ms-3">
                  <div className="d-flex align-items-center">
                    <Spinner animation="border" size="sm" className="me-2" />
                    <span className="me-2">Generating {exportType}...</span>
                  </div>
                  <ProgressBar now={exportProgress} label={`${exportProgress}%`} className="mt-2" style={{ height: '20px' }} />
                </div>
              )}
            </div>
          </Card.Body>
        </Card>
      )}

      {/* Calendar */}
      <Card className="mb-4">
        <Card.Header>
          <Card.Title className="mb-0">
            <CsLineIcons icon="calendar" className="me-2" />Calendar View
          </Card.Title>
        </Card.Header>
        <Card.Body>
          <FullCalendar
            plugins={[dayGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            events={attendanceEvents}
            eventClick={handleEventClick}
            height="auto"
            headerToolbar={{ left: 'prev,next today', center: 'title', right: 'dayGridMonth,dayGridWeek' }}
            buttonText={{ today: 'Today', month: 'Month', week: 'Week' }}
            dayMaxEvents
            eventDisplay="block"
          />
        </Card.Body>
        <Card.Footer className="bg-transparent">
          <div className="d-flex align-items-center flex-wrap gap-3">
            {[
              { color: '#28a745', label: 'Day Shift' },
              { color: '#6f42c1', label: 'Night Shift' },
              { color: '#dc3545', label: 'Absent' },
              { color: '#ffc107', label: 'In Progress' },
            ].map((l) => (
              <div key={l.label} className="d-flex align-items-center">
                <div className="rounded me-2" style={{ width: '15px', height: '15px', backgroundColor: l.color }} />
                <small>{l.label}</small>
              </div>
            ))}
          </div>
        </Card.Footer>
      </Card>

      {/* Attendance Records Table */}
      {attendance.length > 0 && (
        <Card>
          <Card.Header>
            <Card.Title className="mb-0">
              <CsLineIcons icon="layout" className="me-2" />Attendance Records
            </Card.Title>
          </Card.Header>
          <Card.Body>
            {filteredAttendance.length === 0 ? (
              <Alert variant="info" className="text-center mb-0">
                <CsLineIcons icon="info-hexagon" className="me-2" />
                No records found matching the filters.
              </Alert>
            ) : (
              <>
                <div className="text-muted small mb-2">
                  Showing {filteredAttendance.length} of {attendance.length} records
                </div>
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead className="table-light">
                      <tr>
                        <th>Check-In Date</th>
                        <th>Status</th>
                        <th>Check-In Time</th>
                        <th>Check-Out Time</th>
                        <th>Check-Out Date</th>
                        <th>Working Hours</th>
                        <th>Shift Type</th>
                        <th className="text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAttendance
                        .sort((a, b) => new Date(b.date) - new Date(a.date))
                        .map((att, index) => {
                          const hours = calculateWorkingHours(att.in_time, att.out_time);
                          const overnight = isOvernightShift(att.in_time, att.out_time);
                          const checkoutDate = overnight
                            ? getCheckoutDisplayDate(att.date, att.in_time, att.out_time)
                            : null;

                          return (
                            <tr key={att._id || index}>
                              <td>
                                <div className="fw-medium">{formatDateDisplay(att.date)}</div>
                                <small className="text-muted">
                                  {new Date(att.date).toLocaleDateString('en-IN', { weekday: 'short' })}
                                </small>
                              </td>
                              <td>
                                {att.status === 'present' ? (
                                  <Badge bg="success" className="d-inline-flex align-items-center">
                                    <CsLineIcons icon="check" className="me-1" size={12} />Present
                                  </Badge>
                                ) : (
                                  <Badge bg="danger" className="d-inline-flex align-items-center">
                                    <CsLineIcons icon="close" className="me-1" size={12} />Absent
                                  </Badge>
                                )}
                              </td>
                              <td>
                                {att.in_time
                                  ? <div><CsLineIcons icon="login" className="me-1 text-success" size={14} />{att.in_time}</div>
                                  : <span className="text-muted">-</span>}
                              </td>
                              <td>
                                {att.out_time
                                  ? <div><CsLineIcons icon="logout" className="me-1 text-danger" size={14} />{att.out_time}</div>
                                  : att.in_time
                                    ? <Badge bg="warning" text="dark">In Progress</Badge>
                                    : <span className="text-muted">-</span>}
                              </td>
                              <td>
                                {checkoutDate
                                  ? <Badge bg="purple">🌙 {formatDateDisplay(checkoutDate)}</Badge>
                                  : <span className="text-muted">Same Day</span>}
                              </td>
                              <td>
                                {hours
                                  ? <div><CsLineIcons icon="clock" className="me-1 text-primary" size={14} /><span className="fw-medium">{hours.hours}h {hours.minutes}m</span></div>
                                  : <span className="text-muted">-</span>}
                              </td>
                              <td>
                                {att.in_time && att.out_time
                                  ? overnight
                                    ? <Badge bg="purple">🌙 Night Shift</Badge>
                                    : <Badge bg="primary">☀️ Day Shift</Badge>
                                  : <span className="text-muted">-</span>}
                              </td>
                              <td className="text-center">
                                <Button
                                  variant="outline-primary"
                                  size="sm"
                                  onClick={() => { setSelectedAttendance(att); setShowDetailModal(true); }}
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
              Avg working hours: {stats.avgHoursWorked} hrs/day | Night shifts (🌙) span two calendar dates
            </small>
          </Card.Footer>
        </Card>
      )}

      {/* Export Options Modal */}
      <Modal show={showExportModal} onHide={() => setShowExportModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Export Options — {exportType}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="text-muted mb-4">Select which sections to include in your {exportType} export</p>
          <Form>
            <Form.Check type="checkbox" id="includeStaffInfo" label="Staff Information" checked={exportOptions.includeStaffInfo}
              onChange={(e) => setExportOptions({ ...exportOptions, includeStaffInfo: e.target.checked })} className="mb-3" />
            <Form.Check type="checkbox" id="includeStatistics" label="Statistics Summary" checked={exportOptions.includeStatistics}
              onChange={(e) => setExportOptions({ ...exportOptions, includeStatistics: e.target.checked })} className="mb-3" />
            <div className="mb-3">
              <Form.Check type="checkbox" id="includeDetailedRecords" label="Detailed Attendance Records"
                checked={exportOptions.includeDetailedRecords}
                onChange={(e) => setExportOptions({ ...exportOptions, includeDetailedRecords: e.target.checked })} />
              {exportOptions.includeDetailedRecords && (
                <Form.Group className="mt-2 ms-4">
                  <Form.Label>Number of records:</Form.Label>
                  <Form.Select value={exportOptions.recordsLimit}
                    onChange={(e) => setExportOptions({ ...exportOptions, recordsLimit: e.target.value })}>
                    <option value="30">Last 30</option>
                    <option value="60">Last 60</option>
                    <option value="90">Last 90</option>
                    <option value="all">All Records</option>
                  </Form.Select>
                </Form.Group>
              )}
            </div>
          </Form>
          <Alert variant="info" className="mt-4">
            <CsLineIcons icon="info-circle" className="me-2" />
            Export will include <strong>{filteredAttendance.length}</strong> records based on current filters.
          </Alert>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowExportModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleExportConfirm}>
            <CsLineIcons icon="download" className="me-2" />Export {exportType}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Detail Modal */}
      <Modal show={showDetailModal} onHide={() => setShowDetailModal(false)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Attendance Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedAttendance && (
            <div>
              <Row className="mb-3">
                <Col xs={6}>
                  <div className="text-muted small">Check-In Date</div>
                  <div className="fw-bold">{formatDateDisplay(selectedAttendance.date)}</div>
                  <div className="text-muted small">
                    {new Date(selectedAttendance.date).toLocaleDateString('en-IN', { weekday: 'long' })}
                  </div>
                </Col>
                <Col xs={6} className="text-end">
                  <div className="text-muted small">Status</div>
                  {selectedAttendance.status === 'present'
                    ? <Badge bg="success" className="px-3 py-2"><CsLineIcons icon="check" className="me-1" />Present</Badge>
                    : <Badge bg="danger" className="px-3 py-2"><CsLineIcons icon="close" className="me-1" />Absent</Badge>}
                </Col>
              </Row>
              <hr />
              {selectedAttendance.status === 'present' && (
                <Row>
                  <Col xs={12} className="mb-3">
                    <div className="d-flex align-items-center p-3 bg-light rounded">
                      <CsLineIcons icon="login" className="text-success me-3" size={24} />
                      <div>
                        <div className="text-muted small">Check-In Time</div>
                        <div className="fw-bold fs-5">{selectedAttendance.in_time || 'Not recorded'}</div>
                        <small className="text-muted">{formatDateDisplay(selectedAttendance.date)}</small>
                      </div>
                    </div>
                  </Col>
                  <Col xs={12} className="mb-3">
                    <div className="d-flex align-items-center p-3 bg-light rounded">
                      <CsLineIcons icon="logout" className="text-danger me-3" size={24} />
                      <div className="flex-grow-1">
                        <div className="text-muted small">Check-Out Time</div>
                        {selectedAttendance.out_time ? (
                          <>
                            <div className="fw-bold fs-5">{selectedAttendance.out_time}</div>
                            {(() => {
                              const overnight = isOvernightShift(selectedAttendance.in_time, selectedAttendance.out_time);
                              const checkoutDate = overnight
                                ? getCheckoutDisplayDate(selectedAttendance.date, selectedAttendance.in_time, selectedAttendance.out_time)
                                : null;
                              return checkoutDate
                                ? <Badge bg="purple" className="mt-1">🌙 {formatDateDisplay(checkoutDate)} (Next Day)</Badge>
                                : <small className="text-muted">Same Day</small>;
                            })()}
                          </>
                        ) : (
                          <Badge bg="warning" text="dark">In Progress</Badge>
                        )}
                      </div>
                    </div>
                  </Col>
                  {selectedAttendance.in_time && selectedAttendance.out_time && (
                    <Col xs={12} className="mb-3">
                      <div className="d-flex align-items-center p-3 bg-primary bg-opacity-10 rounded">
                        <CsLineIcons icon="clock" className="text-primary me-3" size={24} />
                        <div>
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
          <Button variant="secondary" onClick={() => setShowDetailModal(false)}>Close</Button>
        </Modal.Footer>
      </Modal>

      {/* Toast */}
      <ToastContainer position="top-end" className="p-3">
        <Toast show={showToast} onClose={() => setShowToast(false)} delay={3000} autohide bg="success">
          <Toast.Header>
            <CsLineIcons icon="check-circle" className="me-2" />
            <strong className="me-auto">Success</strong>
          </Toast.Header>
          <Toast.Body className="text-white">{toastMessage}</Toast.Body>
        </Toast>
      </ToastContainer>
    </>
  );
};

export default ViewAttendance;