import React, { useEffect, useState } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import axios from 'axios';
import { Row, Col, Card, Button, Alert, Spinner, Form, Badge, Modal, ProgressBar, Toast, ToastContainer } from 'react-bootstrap';
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
import { Document, Packer, Paragraph, Table as DocTable, TableCell, TableRow, TextRun, AlignmentType, WidthType } from 'docx';
import { format } from 'date-fns';

const ViewAttendance = () => {
  const { id } = useParams();
  const history = useHistory();

  const main_title = 'View Attendance';
  const description = 'View staff attendance history and calendar';

  const [staffData, setStaffData] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [attendanceEvents, setAttendanceEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedAttendance, setSelectedAttendance] = useState(null);

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
    let totalMinutes = outParsed.hours * 60 + outParsed.minutes - (inParsed.hours * 60 + inParsed.minutes);
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

  const filteredAttendance = attendance.filter((att) => {
    if (startDate && endDate) {
      const date = new Date(att.date);
      if (date < new Date(startDate) || date > new Date(endDate)) return false;
    }
    if (statusFilter !== 'all' && att.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return att.date.includes(q) || att.status?.toLowerCase().includes(q) || att.in_time?.toLowerCase().includes(q) || att.out_time?.toLowerCase().includes(q);
    }
    return true;
  });

  useEffect(() => {
    if (attendance.length === 0) return;

    const present = attendance.filter((a) => a.status === 'present').length;
    const absent = attendance.filter((a) => a.status === 'absent').length;
    const total = attendance.length;

    let totalHours = 0;
    let validShifts = 0;
    attendance.forEach((att) => {
      const hours = calculateWorkingHours(att.in_time, att.out_time);
      if (hours) {
        totalHours += hours.total;
        validShifts++;
      }
    });

    setStats({
      totalPresent: present,
      totalAbsent: absent,
      totalDays: total,
      attendanceRate: total > 0 ? ((present / total) * 100).toFixed(1) : 0,
      avgHoursWorked: validShifts > 0 ? (totalHours / validShifts).toFixed(1) : 0,
    });
  }, [attendance]);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${process.env.REACT_APP_API}/attendance/get/${id}`, authHeader());

      const { attendance: records, ...staff } = response.data.data;

      setStaffData(staff);
      setAttendance(records || []);

      const events = (records || []).map((att) => {
        let title = '';
        let backgroundColor = '';

        if (att.status === 'present') {
          const hours = calculateWorkingHours(att.in_time, att.out_time);
          const overnight = isOvernightShift(att.in_time, att.out_time);
          if (att.in_time && att.out_time && hours) {
            title = `${overnight ? '🌙 ' : ''}${hours.hours}h ${hours.minutes}m`;
            backgroundColor = overnight ? '#6366f1' : '#10b981';
          } else if (att.in_time && !att.out_time) {
            title = '⏳ In Progress';
            backgroundColor = '#f59e0b';
          } else {
            title = '✓ Present';
            backgroundColor = '#10b981';
          }
        } else if (att.status === 'absent') {
          title = '✗ Absent';
          backgroundColor = '#ef4444';
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

  const exportToExcel = async () => {
    if (!staffData) return;
    setExporting(true);
    setExportProgress(10);
    setExportType('Excel');
    try {
      const wb = XLSX.utils.book_new();

      if (exportOptions.includeStatistics) {
        setExportProgress(20);
        const dashboardData = [
          ['ATTENDANCE REPORT DASHBOARD'],
          [],
          ['Staff Information'],
          ['Staff ID:', staffData.staff_id],
          ['Name:', `${staffData.f_name} ${staffData.l_name}`],
          ['Position:', staffData.position],
          ['Report Generated:', format(new Date(), 'dd MMM yyyy hh:mm a')],
          [],
          ['KEY METRICS'],
          ['Metric', 'Value'],
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
        const records = exportOptions.recordsLimit === 'all' ? filteredAttendance : filteredAttendance.slice(0, parseInt(exportOptions.recordsLimit, 10));

        const data = [
          ['ATTENDANCE RECORDS'],
          [],
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
      setTimeout(() => {
        setExporting(false);
        setExportProgress(0);
        setExportType('');
      }, 500);
    }
  };

  const exportToPDF = async () => {
    if (!staffData) return;
    setExporting(true);
    setExportProgress(10);
    setExportType('PDF');
    try {
      const doc = new jsPDF();
      let yPosition = 20;

      if (exportOptions.includeStaffInfo) {
        setExportProgress(20);
        doc.setFillColor(30, 168, 231);
        doc.rect(0, 0, 210, 40, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(24);
        doc.setFont(undefined, 'bold');
        doc.text('ATTENDANCE REPORT', 105, 20, { align: 'center' });
        doc.setFontSize(14);
        doc.setFont(undefined, 'normal');
        doc.text(`${staffData.f_name} ${staffData.l_name}`, 105, 30, { align: 'center' });
        yPosition = 50;
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(11);
        doc.text(`Staff ID: ${staffData.staff_id}`, 20, yPosition);
        yPosition += 6;
        doc.text(`Position: ${staffData.position}`, 20, yPosition);
        yPosition += 6;
        doc.text(`Report Generated: ${format(new Date(), 'dd MMM yyyy hh:mm a')}`, 20, yPosition);
        yPosition += 15;
      }

      if (exportOptions.includeStatistics) {
        setExportProgress(35);
        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.text('Performance Summary', 20, yPosition);
        yPosition += 12;
        const metrics = [
          { label: 'Total Days', value: stats.totalDays.toString(), color: [30, 168, 231] },
          { label: 'Present', value: stats.totalPresent.toString(), color: [16, 185, 129] },
          { label: 'Absent', value: stats.totalAbsent.toString(), color: [239, 68, 110] },
        ];
        metrics.forEach((m, idx) => {
          const xPos = 20 + idx * 60;
          doc.setFillColor(...m.color);
          doc.roundedRect(xPos, yPosition, 55, 30, 3, 3, 'F');
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(9);
          doc.setFont(undefined, 'normal');
          doc.text(m.label, xPos + 27.5, yPosition + 10, { align: 'center' });
          doc.setFontSize(14);
          doc.setFont(undefined, 'bold');
          doc.text(m.value, xPos + 27.5, yPosition + 22, { align: 'center' });
        });
        yPosition += 45;
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.text(`Attendance Rate: ${stats.attendanceRate}%`, 20, yPosition);
        yPosition += 6;
        doc.text(`Average Working Hours: ${stats.avgHoursWorked} hours/day`, 20, yPosition);
        yPosition += 15;
      }

      if (exportOptions.includeDetailedRecords) {
        setExportProgress(60);
        if (yPosition > 200) {
          doc.addPage();
          yPosition = 20;
        }
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('Attendance Records', 20, yPosition);
        yPosition += 8;

        const records = exportOptions.recordsLimit === 'all' ? filteredAttendance : filteredAttendance.slice(0, parseInt(exportOptions.recordsLimit, 10));

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
          headStyles: { fillColor: [30, 168, 231], fontSize: 9, fontStyle: 'bold' },
          styles: { fontSize: 8 },
        });
      }

      setExportProgress(90);
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(128, 128, 128);
        doc.text(`${staffData.staff_id} - Attendance Report | Page ${i} of ${pageCount}`, 105, 290, { align: 'center' });
      }
      doc.save(`${staffData.staff_id}_Attendance_Report.pdf`);
      setExportProgress(100);
      showSuccessToast('PDF report exported successfully!');
    } catch (err) {
      console.error(err);
      showSuccessToast('Error exporting PDF file');
    } finally {
      setTimeout(() => {
        setExporting(false);
        setExportProgress(0);
        setExportType('');
      }, 500);
    }
  };

  const exportToWord = async () => {
    if (!staffData) return;
    setExporting(true);
    setExportProgress(10);
    setExportType('Word');
    try {
      setExportProgress(30);
      const records = exportOptions.recordsLimit === 'all' ? filteredAttendance : filteredAttendance.slice(0, parseInt(exportOptions.recordsLimit, 10));

      const rows = [
        new TableRow({
          children: ['Check-In Date', 'Status', 'In Time', 'Out Time', 'Out Date', 'Hours'].map(
            (heading) =>
              new TableCell({
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
        sections: [
          {
            properties: {},
            children: [
              new Paragraph({ text: 'Attendance Report', heading: 'Heading1', alignment: AlignmentType.CENTER }),
              new Paragraph({ text: `${staffData.f_name} ${staffData.l_name} (${staffData.staff_id})`, alignment: AlignmentType.CENTER }),
              new Paragraph({ text: `Position: ${staffData.position}`, alignment: AlignmentType.CENTER }),
              new Paragraph({ text: '' }),
              new Paragraph({
                text: `Total Days: ${stats.totalDays} | Present: ${stats.totalPresent} | Absent: ${stats.totalAbsent} | Rate: ${stats.attendanceRate}%`,
              }),
              new Paragraph({ text: '' }),
              new DocTable({ rows }),
            ],
          },
        ],
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
      setTimeout(() => {
        setExporting(false);
        setExportProgress(0);
        setExportType('');
      }, 500);
    }
  };

  const handleExportClick = (type) => {
    setShowExportModal(true);
    setExportType(type);
  };
  const handleExportConfirm = () => {
    setShowExportModal(false);
    if (exportType === 'Excel') exportToExcel();
    else if (exportType === 'PDF') exportToPDF();
    else if (exportType === 'Word') exportToWord();
  };

  if (loading && !staffData) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center py-5 mt-5">
        <Spinner animation="border" style={{ color: '#1ea8e7' }} className="mb-3" />
        <h5 className="fw-bold">Loading Attendance History...</h5>
      </div>
    );
  }

  return (
    <div className="container-fluid qsr-page-container">
      <HtmlHead title={main_title} description={description} />

      <div className="qsr-page-title-container">
        <Row className="g-3 align-items-center">
          <Col md={7}>
            <h1 className="qsr-page-title">{staffData ? `${staffData.f_name} ${staffData.l_name}'s Record` : main_title}</h1>
            <BreadcrumbList items={breadcrumbs} />
          </Col>
          <Col md={5} className="d-flex justify-content-md-end">
            <Button className="view-attendance-custom-btn-outline px-4 py-2 d-flex align-items-center gap-2" onClick={() => history.push('/attendance')}>
              <CsLineIcons icon="arrow-left" size="18" /> Back to Dashboard
            </Button>
          </Col>
        </Row>
      </div>

      {error && (
        <Alert variant="danger" className="view-attendance-glass-card border-0 mb-4 p-4 shadow-sm d-flex align-items-center gap-3 text-danger fw-bold">
          <CsLineIcons icon="error" size="24" />
          <span>{error}</span>
        </Alert>
      )}

      {staffData && (
        <Card className="view-attendance-glass-card border-0 mb-4 overflow-hidden">
          <Card.Body className="p-4">
            <Row className="align-items-center g-4">
              <Col md={4} className="border-end d-flex align-items-center gap-4">
                <div className="sw-10 sh-10 rounded-circle bg-soft-primary d-flex align-items-center justify-content-center text-primary fw-bold display-6 shadow-sm">
                  {staffData.f_name?.[0]}
                  {staffData.l_name?.[0]}
                </div>
                <div>
                  <h4 className="fw-bold text-dark mb-1">
                    {staffData.f_name} {staffData.l_name}
                  </h4>
                  <div className="text-muted fw-medium d-flex align-items-center gap-2">
                    <Badge bg="soft-primary" className="text-primary px-3 py-2 rounded-pill">
                      #{staffData.staff_id}
                    </Badge>
                    <span>•</span>
                    <span>{staffData.position}</span>
                  </div>
                </div>
              </Col>
              <Col md={8}>
                <Row className="text-center g-3">
                  {[
                    { label: 'Total Logs', value: stats.totalDays, icon: 'calendar', color: 'primary' },
                    { label: 'Present', value: stats.totalPresent, icon: 'check-circle', color: 'success' },
                    { label: 'Absent', value: stats.totalAbsent, icon: 'close-circle', color: 'danger' },
                    { label: 'Success Rate', value: `${stats.attendanceRate}%`, icon: 'trending-up', color: 'info' },
                  ].map((s) => (
                    <Col xs={6} md={3} key={s.label}>
                      <div className="p-3">
                        <CsLineIcons icon={s.icon} size="20" className={`text-${s.color} mb-2`} />
                        <div className="text-muted small fw-bold text-uppercase letter-spacing-1">{s.label}</div>
                        <h4 className={`mb-0 fw-bold text-${s.color}`}>{s.value}</h4>
                      </div>
                    </Col>
                  ))}
                </Row>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      )}

      <Card className="view-attendance-glass-card border-0 mb-4">
        <Card.Body className="p-4">
          <Row className="g-3 align-items-end">
            <Col md={3}>
              <Form.Label className="small fw-bold text-muted text-uppercase">Start Date</Form.Label>
              <Form.Control className="rounded-3 border-0 shadow-sm py-2" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </Col>
            <Col md={3}>
              <Form.Label className="small fw-bold text-muted text-uppercase">End Date</Form.Label>
              <Form.Control className="rounded-3 border-0 shadow-sm py-2" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </Col>
            <Col md={2}>
              <Form.Label className="small fw-bold text-muted text-uppercase">Status</Form.Label>
              <Form.Select className="rounded-3 border-0 shadow-sm py-2" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="all">All Records</option>
                <option value="present">Present</option>
                <option value="absent">Absent</option>
              </Form.Select>
            </Col>
            <Col md={3}>
              <Form.Label className="small fw-bold text-muted text-uppercase">Search</Form.Label>
              <Form.Control
                className="rounded-3 border-0 shadow-sm py-2"
                type="text"
                placeholder="Filter by date or time..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </Col>
            <Col md={1}>
              <Button
                className="view-attendance-custom-btn-outline w-100 sh-5 p-0 d-flex align-items-center justify-content-center"
                onClick={clearFilters}
                title="Reset Filters"
              >
                <CsLineIcons icon="rotate-left" size="18" />
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Row className="g-4">
        <Col lg={4}>
          <Card className="view-attendance-glass-card border-0 mb-4 h-100">
            <Card.Header className="bg-transparent border-0 p-4 pb-0">
              <h5 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
                <CsLineIcons icon="download" size="20" className="text-primary" />
                Export Reports
              </h5>
            </Card.Header>
            <Card.Body className="p-4">
              <p className="text-muted small mb-4">Generate detailed attendance reports in various formats for payroll or compliance.</p>
              <div className="d-grid gap-3">
                <Button
                  className="view-attendance-custom-btn-solid bg-success border-success py-3 d-flex align-items-center justify-content-center gap-2"
                  onClick={() => handleExportClick('Excel')}
                  disabled={exporting}
                >
                  <CsLineIcons icon="file-text" size="18" /> Excel Document
                </Button>
                <Button
                  className="view-attendance-custom-btn-solid bg-danger border-danger py-3 d-flex align-items-center justify-content-center gap-2"
                  onClick={() => handleExportClick('PDF')}
                  disabled={exporting}
                >
                  <CsLineIcons icon="file-text" size="18" /> PDF Report
                </Button>
                <Button
                  className="view-attendance-custom-btn-solid bg-info border-info py-3 d-flex align-items-center justify-content-center gap-2"
                  onClick={() => handleExportClick('Word')}
                  disabled={exporting}
                >
                  <CsLineIcons icon="file-text" size="18" /> Word Document
                </Button>
              </div>

              {exporting && (
                <div className="mt-4 p-3 bg-light rounded-3 border">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <div className="fw-bold small text-primary d-flex align-items-center gap-2">
                      <Spinner animation="border" size="sm" />
                      Exporting {exportType}...
                    </div>
                    <span className="small text-muted">{exportProgress}%</span>
                  </div>
                  <ProgressBar now={exportProgress} className="sh-1 rounded-pill" variant="primary" />
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col lg={8}>
          <Card className="view-attendance-glass-card border-0 mb-4">
            <Card.Header className="bg-transparent border-0 p-4 pb-0 d-flex justify-content-between align-items-center">
              <h5 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
                <CsLineIcons icon="calendar" size="20" className="text-primary" />
                Attendance Calendar
              </h5>
              <div className="d-flex gap-2">
                <Badge bg="soft-success" className="text-success px-2 py-1 small rounded-pill fw-bold">
                  Present
                </Badge>
                <Badge bg="soft-danger" className="text-danger px-2 py-1 small rounded-pill fw-bold">
                  Absent
                </Badge>
              </div>
            </Card.Header>
            <Card.Body className="p-4 pt-2">
              <div className="calendar-container">
                <FullCalendar
                  plugins={[dayGridPlugin, interactionPlugin]}
                  initialView="dayGridMonth"
                  events={attendanceEvents}
                  eventClick={handleEventClick}
                  height="auto"
                  headerToolbar={{ left: 'prev,next today', center: 'title', right: 'dayGridMonth,dayGridWeek' }}
                  dayMaxEvents
                  eventDisplay="block"
                />
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Card className="view-attendance-glass-card border-0 mt-4 overflow-hidden">
        <Card.Header className="bg-light border-0 p-4">
          <h5 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
            <CsLineIcons icon="layout" size="20" className="text-primary" />
            Detailed Logs
          </h5>
        </Card.Header>
        <Card.Body className="p-0">
          <div className="table-responsive">
            <table className="table table-hover view-attendance-react-table-modern mb-0">
              <thead>
                <tr>
                  <th>Date & Weekday</th>
                  <th>Status</th>
                  <th>Check-In</th>
                  <th>Check-Out</th>
                  <th>Total Hours</th>
                  <th>Shift Type</th>
                  <th className="text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredAttendance.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-5">
                      <div className="py-4">
                        <CsLineIcons icon="info-hexagon" size="48" className="text-muted mb-3" />
                        <h5 className="text-muted">No records found matching filters</h5>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredAttendance
                    .sort((a, b) => new Date(b.date) - new Date(a.date))
                    .map((att, index) => {
                      const hours = calculateWorkingHours(att.in_time, att.out_time);
                      const overnight = isOvernightShift(att.in_time, att.out_time);
                      const checkoutDate = overnight ? getCheckoutDisplayDate(att.date, att.in_time, att.out_time) : null;

                      return (
                        <tr key={att._id || index}>
                          <td>
                            <div className="fw-bold text-dark">{formatDateDisplay(att.date)}</div>
                            <small className="text-muted fw-medium">{new Date(att.date).toLocaleDateString('en-IN', { weekday: 'long' })}</small>
                          </td>
                          <td>
                            <Badge
                              bg={att.status === 'present' ? 'success' : 'danger'}
                              className="view-attendance-status-badge d-inline-flex align-items-center gap-1"
                            >
                              <CsLineIcons icon={att.status === 'present' ? 'check' : 'close-circle'} size="12" />
                              {att.status}
                            </Badge>
                          </td>
                          <td>
                            <div className="d-flex align-items-center gap-2 text-dark fw-medium">
                              {att.in_time ? (
                                <>
                                  <CsLineIcons icon="login" size="14" className="text-success" />
                                  {att.in_time}
                                </>
                              ) : (
                                '—'
                              )}
                            </div>
                          </td>
                          <td>
                            <div className="d-flex align-items-center gap-2 text-dark fw-medium">
                              {att.out_time ? (
                                <>
                                  <CsLineIcons icon="logout" size="14" className="text-danger" />
                                  {att.out_time}
                                </>
                              ) : att.in_time ? (
                                <Badge bg="soft-warning" className="text-warning small px-2 py-1 rounded-pill fw-bold">
                                  Active
                                </Badge>
                              ) : (
                                '—'
                              )}
                            </div>
                            {checkoutDate && <div className="small text-muted mt-1">🌙 Out: {formatDateDisplay(checkoutDate)}</div>}
                          </td>
                          <td>
                            <div className="fw-bold text-primary">{hours ? `${hours.hours}h ${hours.minutes}m` : '—'}</div>
                          </td>
                          <td>
                            {att.in_time && att.out_time ? (
                              <Badge
                                bg={overnight ? 'soft-purple' : 'soft-info'}
                                className={`text-${overnight ? 'purple' : 'info'} px-3 py-2 rounded-pill fw-bold`}
                              >
                                {overnight ? '🌙 Night' : '☀️ Day'}
                              </Badge>
                            ) : (
                              '—'
                            )}
                          </td>
                          <td className="text-center">
                            <Button
                              className="view-attendance-custom-btn-outline p-0 sw-5 sh-5 d-flex align-items-center justify-content-center mx-auto"
                              onClick={() => {
                                setSelectedAttendance(att);
                                setShowDetailModal(true);
                              }}
                            >
                              <CsLineIcons icon="eye" size="16" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })
                )}
              </tbody>
            </table>
          </div>
        </Card.Body>
      </Card>

      <Modal show={showDetailModal} onHide={() => setShowDetailModal(false)} centered className="rounded-4">
        <Modal.Header closeButton className="border-0">
          <Modal.Title className="fw-bold">Record Details</Modal.Title>
        </Modal.Header>
        <Modal.Body className="py-4">
          {selectedAttendance && (
            <div className="text-center">
              <div className={`bg-soft-${selectedAttendance.status === 'present' ? 'success' : 'danger'} d-inline-flex p-4 rounded-circle mb-3`}>
                <CsLineIcons
                  icon={selectedAttendance.status === 'present' ? 'check-circle' : 'close-circle'}
                  size="48"
                  className={`text-${selectedAttendance.status === 'present' ? 'success' : 'danger'}`}
                />
              </div>
              <h4 className="fw-bold mb-1">{formatDateDisplay(selectedAttendance.date)}</h4>
              <p className="text-muted fw-medium">{new Date(selectedAttendance.date).toLocaleDateString('en-IN', { weekday: 'long' })}</p>

              <div className="view-attendance-glass-card bg-light border-0 p-4 mt-4 text-start">
                <Row className="g-4">
                  <Col xs={6}>
                    <div className="small fw-bold text-muted text-uppercase mb-1">Check-In</div>
                    <div className="fw-bold text-dark h5 mb-0 d-flex align-items-center gap-2">
                      <CsLineIcons icon="login" size="18" className="text-success" />
                      {selectedAttendance.in_time || '—'}
                    </div>
                  </Col>
                  <Col xs={6}>
                    <div className="small fw-bold text-muted text-uppercase mb-1">Check-Out</div>
                    <div className="fw-bold text-dark h5 mb-0 d-flex align-items-center gap-2">
                      <CsLineIcons icon="logout" size="18" className="text-danger" />
                      {selectedAttendance.out_time || '—'}
                    </div>
                  </Col>
                  <Col xs={12}>
                    <div className="small fw-bold text-muted text-uppercase mb-1">Total Duration</div>
                    <div className="fw-bold text-primary h4 mb-0 d-flex align-items-center gap-2">
                      <CsLineIcons icon="clock" size="24" />
                      {(() => {
                        const h = calculateWorkingHours(selectedAttendance.in_time, selectedAttendance.out_time);
                        return h ? `${h.hours} Hours ${h.minutes} Minutes` : '—';
                      })()}
                    </div>
                  </Col>
                </Row>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0">
          <Button className="view-attendance-custom-btn-solid w-100 py-3" onClick={() => setShowDetailModal(false)}>
            Close Detail
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showExportModal} onHide={() => setShowExportModal(false)} centered className="rounded-4">
        <Modal.Header closeButton className="border-0">
          <Modal.Title className="fw-bold d-flex align-items-center gap-2">
            <CsLineIcons icon="download" size="24" className="text-primary" />
            Export Settings — {exportType}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="py-4">
          <div className="bg-soft-primary p-3 rounded-3 mb-4 d-flex align-items-center gap-3 border border-primary">
            <CsLineIcons icon="info-hexagon" size="24" className="text-primary" />
            <div className="small text-dark fw-medium">Customize your report content before generating the file.</div>
          </div>

          <Form>
            <h6 className="fw-bold text-muted text-uppercase letter-spacing-1 mb-3">Include Sections</h6>
            <div className="view-attendance-glass-card p-4 border-0 shadow-none bg-light mb-4">
              <Form.Check
                className="mb-3 fw-bold"
                type="switch"
                label="Staff Personal Details"
                checked={exportOptions.includeStaffInfo}
                onChange={(e) => setExportOptions({ ...exportOptions, includeStaffInfo: e.target.checked })}
              />
              <Form.Check
                className="mb-3 fw-bold"
                type="switch"
                label="Performance Statistics"
                checked={exportOptions.includeStatistics}
                onChange={(e) => setExportOptions({ ...exportOptions, includeStatistics: e.target.checked })}
              />
              <Form.Check
                className="mb-0 fw-bold"
                type="switch"
                label="Detailed Daily Logs"
                checked={exportOptions.includeDetailedRecords}
                onChange={(e) => setExportOptions({ ...exportOptions, includeDetailedRecords: e.target.checked })}
              />
            </div>

            <h6 className="fw-bold text-muted text-uppercase letter-spacing-1 mb-3">Records Limit</h6>
            <Form.Select
              className="rounded-3 border-0 shadow-sm py-2 px-3 fw-bold text-dark"
              value={exportOptions.recordsLimit}
              onChange={(e) => setExportOptions({ ...exportOptions, recordsLimit: e.target.value })}
            >
              <option value="all">Full History (All Records)</option>
              <option value="30">Recent 30 Days</option>
              <option value="90">Recent 90 Days</option>
              <option value="180">Recent 180 Days</option>
            </Form.Select>
          </Form>
          <Button variant="primary" onClick={handleExportConfirm}>
            <CsLineIcons icon="download" className="me-2" />
            Export {exportType}
          </Button>
        </Modal.Body>
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
    </div>
  );
};

export default ViewAttendance;
