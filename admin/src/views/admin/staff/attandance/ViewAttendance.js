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
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'react-toastify';
import { format } from 'date-fns';

const ViewAttendance = () => {
  const { id } = useParams();
  const history = useHistory();

  const main_title = 'View Attendance';
  const description = 'View staff attendance history and calendar';

  const [staffData, setStaffData] = useState(null);
  const [attendanceEvents, setAttendanceEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Export states
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportType, setExportType] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Export options modal
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportOptions, setExportOptions] = useState({
    includeSummary: true,
    includeCalendar: true,
    includeDetailedTable: true,
    includeStatistics: true,
    includeCharts: false,
  });

  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedAttendance, setSelectedAttendance] = useState(null);

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

  // Calculate working hours with support for overnight shifts
  const calculateWorkingHours = (inTime, outTime) => {
    if (!inTime || !outTime) return null;

    const [inHour, inMin] = inTime.split(':').map(Number);
    const [outHour, outMin] = outTime.split(':').map(Number);

    let totalMinutes = outHour * 60 + outMin - (inHour * 60 + inMin);

    // Handle overnight shifts (negative duration means next day checkout)
    if (totalMinutes < 0) {
      totalMinutes += 24 * 60; // Add 24 hours
    }

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    return { hours, minutes, total: totalMinutes / 60 };
  };

  // Check if shift is overnight (likely spans two days)
  const isOvernightShift = (inTime, outTime) => {
    if (!inTime || !outTime) return false;

    const [inHour] = inTime.split(':').map(Number);
    const [outHour] = outTime.split(':').map(Number);

    // If check-in is after 6 PM (18:00) and check-out is before noon (12:00), it's likely overnight
    return inHour >= 18 && outHour < 12;
  };

  // Get the actual checkout date for overnight shifts
  const getCheckoutDisplayDate = (checkInDate, inTime, outTime) => {
    if (!isOvernightShift(inTime, outTime)) return null;

    // Add one day to check-in date for display
    const date = new Date(checkInDate);
    date.setDate(date.getDate() + 1);
    return date.toISOString().split('T')[0];
  };

  // Format date for display
  const formatDateDisplay = (dateString) => {
    const [year, month, day] = dateString.split('-');
    return `${day}-${month}-${year}`;
  };

  // Filter attendance records
  const filteredAttendance =
    staffData?.attandance?.filter((att) => {
      // Date filter
      if (startDate && endDate) {
        const date = new Date(att.date);
        if (date < new Date(startDate) || date > new Date(endDate)) {
          return false;
        }
      }

      // Status filter
      if (statusFilter !== 'all' && att.status !== statusFilter) {
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
      const present = staffData.attandance.filter((a) => a.status === 'present').length;
      const absent = staffData.attandance.filter((a) => a.status === 'absent').length;
      const total = staffData.attandance.length;

      let totalHours = 0;
      let validShifts = 0;

      staffData.attandance.forEach((att) => {
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
        avgHoursWorked: validShifts > 0 ? (totalHours / validShifts).toFixed(1) : 0,
      });
    }
  }, [staffData]);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${process.env.REACT_APP_API}/staff/get/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });

      const staff = response.data.data;
      setStaffData(staff);

      // Create calendar events
      const events = staff.attandance.map((att) => {
        let title = '';
        let backgroundColor = '';
        let borderColor = '';

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
          borderColor = backgroundColor;
        } else if (att.status === 'absent') {
          title = '✗ Absent';
          backgroundColor = '#dc3545';
          borderColor = '#dc3545';
        }

        return {
          title,
          date: att.date,
          backgroundColor,
          borderColor,
          textColor: '#ffffff',
          extendedProps: {
            attendance: att,
          },
        };
      });

      setAttendanceEvents(events);
    } catch (err) {
      console.error('Error fetching attendance:', err);
      setError('Failed to load attendance data. Please try again.');
      toast.error('Failed to load attendance data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEventClick = (clickInfo) => {
    setSelectedAttendance(clickInfo.event.extendedProps.attendance);
    setShowDetailModal(true);
  };

  // Show toast notification
  const showSuccessToast = (message) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  // Enhanced Excel Export with formatting
  const exportToExcel = async () => {
    if (!staffData) return;

    setExporting(true);
    setExportProgress(10);
    setExportType('Excel');

    try {
      const wb = XLSX.utils.book_new();

      // Dashboard Sheet
      if (exportOptions.includeSummary) {
        setExportProgress(20);
        const dashboardData = [
          ['ATTENDANCE REPORT DASHBOARD'],
          [],
          ['Staff Information:'],
          ['Staff ID:', staffData.staff_id],
          ['Full Name:', `${staffData.f_name} ${staffData.l_name}`],
          ['Position:', staffData.position],
          ['Total Records:', staffData.attandance?.length || 0],
          [],
          ['ATTENDANCE STATISTICS'],
          ['Metric', 'Value'],
          ['Total Days', stats.totalDays],
          ['Present Days', stats.totalPresent],
          ['Absent Days', stats.totalAbsent],
          ['Attendance Rate', `${stats.attendanceRate}%`],
          ['Avg. Working Hours', `${stats.avgHoursWorked}h`],
          [],
          ['PERFORMANCE SUMMARY'],
          ['Best Period', 'Based on attendance rate and working hours'],
        ];

        const dashboardSheet = XLSX.utils.aoa_to_sheet(dashboardData);
        dashboardSheet['!cols'] = [{ wch: 25 }, { wch: 30 }];

        // Apply styles
        const range = XLSX.utils.decode_range(dashboardSheet['!ref']);
        for (let R = range.s.r; R <= range.e.r; R += 1) {
          for (let C = range.s.c; C <= range.e.c; C += 1) {
            const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
            if (dashboardSheet[cellAddress]) {
              // Header rows (bold)
              if (R === 0 || R === 8 || R === 15) {
                if (!dashboardSheet[cellAddress].s) dashboardSheet[cellAddress].s = {};
                dashboardSheet[cellAddress].s = {
                  font: { bold: true, sz: 14 },
                  fill: { fgColor: { rgb: '4472C4' } },
                  alignment: { horizontal: 'center' },
                };
              }

              // Metric labels (bold)
              if (R >= 9 && R <= 13 && C === 0) {
                if (!dashboardSheet[cellAddress].s) dashboardSheet[cellAddress].s = {};
                dashboardSheet[cellAddress].s = { font: { bold: true } };
              }
            }
          }
        }

        XLSX.utils.book_append_sheet(wb, dashboardSheet, 'Dashboard');
      }

      // Detailed Attendance Sheet
      if (exportOptions.includeDetailedTable) {
        setExportProgress(45);
        const exportData = filteredAttendance.map((att) => {
          const hours = calculateWorkingHours(att.in_time, att.out_time);
          const overnight = isOvernightShift(att.in_time, att.out_time);
          const checkoutDate = overnight ? getCheckoutDisplayDate(att.date, att.in_time, att.out_time) : null;

          return {
            'Check-In Date': formatDateDisplay(att.date),
            Day: new Date(att.date).toLocaleDateString('en-IN', { weekday: 'short' }),
            Status: att.status.toUpperCase(),
            'Check-In Time': att.in_time || '-',
            'Check-Out Time': att.out_time || '-',
            'Check-Out Date': checkoutDate ? formatDateDisplay(checkoutDate) : '-',
            'Working Hours': hours ? `${hours.hours}h ${hours.minutes}m` : '-',
            'Shift Type': overnight ? 'Night Shift' : 'Day Shift',
            'Total Hours': hours ? hours.total.toFixed(2) : '0.00',
          };
        });

        const detailedData = [
          ['DETAILED ATTENDANCE RECORDS'],
          [],
          ['Check-In Date', 'Day', 'Status', 'Check-In Time', 'Check-Out Time', 'Check-Out Date', 'Working Hours', 'Shift Type', 'Total Hours'],
        ];

        exportData.forEach((att) => {
          detailedData.push([
            att['Check-In Date'],
            att['Day'],
            att['Status'],
            att['Check-In Time'],
            att['Check-Out Time'],
            att['Check-Out Date'],
            att['Working Hours'],
            att['Shift Type'],
            att['Total Hours'],
          ]);
        });

        const detailedSheet = XLSX.utils.aoa_to_sheet(detailedData);
        detailedSheet['!cols'] = [{ wch: 15 }, { wch: 10 }, { wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 12 }];

        // Enable auto-filter
        const range = XLSX.utils.decode_range(detailedSheet['!ref']);
        detailedSheet['!autofilter'] = { ref: `A3:I${range.e.r + 1}` };

        XLSX.utils.book_append_sheet(wb, detailedSheet, 'Attendance Details');
      }

      // Summary Statistics Sheet
      if (exportOptions.includeStatistics) {
        setExportProgress(70);
        const summaryData = [
          ['ATTENDANCE SUMMARY REPORT'],
          [],
          ['Staff Information'],
          ['Staff ID', staffData.staff_id],
          ['Full Name', `${staffData.f_name} ${staffData.l_name}`],
          ['Position', staffData.position],
          [
            'Report Period',
            `${format(new Date(startDate || staffData.attandance[0]?.date), 'dd MMM yyyy')} to ${format(new Date(endDate || new Date()), 'dd MMM yyyy')}`,
          ],
          ['Generated On', format(new Date(), 'dd MMM yyyy HH:mm')],
          [],
          ['Attendance Statistics'],
          ['Total Days', stats.totalDays],
          ['Present', stats.totalPresent],
          ['Absent', stats.totalAbsent],
          ['Attendance Rate', `${stats.attendanceRate}%`],
          ['Avg Working Hours/Day', `${stats.avgHoursWorked}h`],
          [],
          ['Shift Analysis'],
          ['Day Shifts', filteredAttendance.filter((a) => !isOvernightShift(a.in_time, a.out_time)).length],
          ['Night Shifts', filteredAttendance.filter((a) => isOvernightShift(a.in_time, a.out_time)).length],
          ['Incomplete Shifts', filteredAttendance.filter((a) => a.in_time && !a.out_time).length],
        ];

        const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
        summarySheet['!cols'] = [{ wch: 25 }, { wch: 25 }];

        XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');
      }

      setExportProgress(90);

      // Write file
      const fileName = `${staffData.staff_id}_${staffData.f_name}_Attendance_${format(new Date(), 'yyyyMMdd_HHmm')}.xlsx`;
      XLSX.writeFile(wb, fileName);

      setExportProgress(100);
      showSuccessToast('Excel report exported successfully!');
    } catch (err) {
      console.error('Error exporting to Excel:', err);
      showSuccessToast('Error exporting Excel file');
    } finally {
      setTimeout(() => {
        setExporting(false);
        setExportProgress(0);
        setExportType('');
      }, 500);
    }
  };

  // Enhanced PDF Export
  const exportToPDF = async () => {
    if (!staffData) return;

    setExporting(true);
    setExportProgress(10);
    setExportType('PDF');

    try {
      const doc = new jsPDF();
      let yPosition = 20;

      // Cover Page with Summary
      if (exportOptions.includeSummary) {
        setExportProgress(20);

        // Header with branding
        doc.setFillColor(68, 114, 196);
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

        // Staff Information
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text('Staff Information:', 20, yPosition);
        yPosition += 8;

        doc.setFont(undefined, 'normal');
        doc.text(`Staff ID: ${staffData.staff_id}`, 20, yPosition);
        yPosition += 8;
        doc.text(`Position: ${staffData.position}`, 20, yPosition);
        yPosition += 8;
        doc.text(`Total Records: ${staffData.attandance?.length || 0}`, 20, yPosition);
        yPosition += 15;

        // Key Metrics Boxes
        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.text('Attendance Summary', 20, yPosition);
        yPosition += 12;

        const metrics = [
          { label: 'Total Days', value: stats.totalDays.toString(), color: [33, 150, 243] },
          { label: 'Present', value: stats.totalPresent.toString(), color: [76, 175, 80] },
          { label: 'Absent', value: stats.totalAbsent.toString(), color: [255, 87, 34] },
          { label: 'Attendance Rate', value: `${stats.attendanceRate}%`, color: [156, 39, 176] },
        ];

        metrics.forEach((metric, idx) => {
          const xPos = 20 + idx * 45;

          // Draw colored box
          doc.setFillColor(...metric.color);
          doc.roundedRect(xPos, yPosition, 40, 25, 3, 3, 'F');

          // Label
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(8);
          doc.setFont(undefined, 'normal');
          doc.text(metric.label, xPos + 20, yPosition + 8, { align: 'center' });

          // Value
          doc.setFontSize(11);
          doc.setFont(undefined, 'bold');
          doc.text(metric.value, xPos + 20, yPosition + 18, { align: 'center' });
        });

        yPosition += 40;

        // Add new page for detailed data
        doc.addPage();
        yPosition = 20;
      }

      // Detailed Attendance Table
      if (exportOptions.includeDetailedTable) {
        setExportProgress(50);

        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('Attendance Records', 20, yPosition);
        yPosition += 10;

        const tableData = filteredAttendance.map((att) => {
          const hours = calculateWorkingHours(att.in_time, att.out_time);
          const overnight = isOvernightShift(att.in_time, att.out_time);
          const checkoutDate = overnight ? getCheckoutDisplayDate(att.date, att.in_time, att.out_time) : null;

          return [
            formatDateDisplay(att.date),
            att.status.toUpperCase(),
            att.in_time || '-',
            att.out_time || '-',
            checkoutDate ? formatDateDisplay(checkoutDate) : '-',
            hours ? `${hours.hours}h ${hours.minutes}m` : '-',
            overnight ? 'Night' : 'Day',
          ];
        });

        autoTable(doc, {
          startY: yPosition,
          head: [['Date', 'Status', 'In Time', 'Out Time', 'Out Date', 'Hours', 'Type']],
          body: tableData,
          theme: 'grid',
          headStyles: {
            fillColor: [68, 114, 196],
            fontSize: 10,
            fontStyle: 'bold',
          },
          styles: { fontSize: 9 },
          columnStyles: {
            0: { cellWidth: 25 },
            1: { cellWidth: 15, halign: 'center' },
            2: { cellWidth: 20, halign: 'center' },
            3: { cellWidth: 20, halign: 'center' },
            4: { cellWidth: 25, halign: 'center' },
            5: { cellWidth: 20, halign: 'center' },
            6: { cellWidth: 15, halign: 'center' },
          },
          didParseCell: function (data) {
            if (data.section === 'body' && data.column.index === 1) {
              if (data.cell.text[0] === 'PRESENT') {
                data.cell.styles.textColor = [76, 175, 80];
              } else if (data.cell.text[0] === 'ABSENT') {
                data.cell.styles.textColor = [255, 87, 34];
              }
            }
          },
        });

        yPosition = doc.lastAutoTable.finalY + 15;
      }

      // Statistics Summary
      if (exportOptions.includeStatistics) {
        setExportProgress(80);

        if (yPosition > 200) {
          doc.addPage();
          yPosition = 20;
        }

        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('Performance Analysis', 20, yPosition);
        yPosition += 8;

        const analysisData = [
          ['Metric', 'Value'],
          ['Total Days Analyzed', stats.totalDays.toString()],
          ['Present Days', stats.totalPresent.toString()],
          ['Absent Days', stats.totalAbsent.toString()],
          ['Attendance Rate', `${stats.attendanceRate}%`],
          ['Average Working Hours', `${stats.avgHoursWorked}h`],
          ['Best Attendance Streak', 'Calculate from data'],
          ['Most Common Check-in Time', 'Calculate from data'],
        ];

        autoTable(doc, {
          startY: yPosition,
          body: analysisData,
          theme: 'striped',
          styles: { fontSize: 10 },
          columnStyles: {
            0: { fontStyle: 'bold', cellWidth: 60 },
            1: { cellWidth: 40 },
          },
        });
      }

      // Footer on each page
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(128, 128, 128);
        doc.text(`${staffData.f_name} ${staffData.l_name} | Attendance Report | Page ${i} of ${pageCount}`, 105, 290, { align: 'center' });
        doc.text(`Generated: ${format(new Date(), 'dd MMM yyyy HH:mm')}`, 105, 294, { align: 'center' });
      }

      setExportProgress(95);

      const fileName = `${staffData.staff_id}_Attendance_${format(new Date(), 'yyyyMMdd')}.pdf`;
      doc.save(fileName);

      setExportProgress(100);
      showSuccessToast('PDF report exported successfully!');
    } catch (err) {
      console.error('Error exporting to PDF:', err);
      showSuccessToast('Error exporting PDF file');
    } finally {
      setTimeout(() => {
        setExporting(false);
        setExportProgress(0);
        setExportType('');
      }, 500);
    }
  };

  // Export with options
  const handleExportClick = (type) => {
    setShowExportModal(true);
    setExportType(type);
  };

  const handleExportConfirm = () => {
    setShowExportModal(false);
    if (exportType === 'Excel') {
      exportToExcel();
    } else if (exportType === 'PDF') {
      exportToPDF();
    }
  };

  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
    setStatusFilter('all');
    setSearchQuery('');
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

      <div className="page-title-container mb-3">
        <Row>
          <Col>
            <h1 className="mb-0 pb-0 display-4">{main_title}</h1>
            <BreadcrumbList items={breadcrumbs} />
          </Col>
        </Row>
      </div>

      {/* Filters Card - Matching Sales Report Style */}
      <Card className="mb-4">
        <Card.Body>
          <Row className="g-3 align-items-start">
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
            <Col md={2}>
              <Form.Label>Search</Form.Label>
              <Form.Control type="text" placeholder="Search records..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </Col>
            <Col md={1} className="h-100">
              <Form.Label>&nbsp;</Form.Label>
              <Button variant="primary" className="w-100" onClick={() => fetchAttendance()} disabled={loading}>
                <CsLineIcons icon="sync" className="me-2" />
                {loading ? 'Loading...' : 'Apply'}
              </Button>
            </Col>
            <Col md={1} className="h-100">
              <Form.Label>&nbsp;</Form.Label>
              <Button variant="outline-secondary" className="w-100" onClick={clearFilters}>
                <CsLineIcons icon="close" />
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {error && (
        <Alert variant="danger" className="mb-3">
          {error}
        </Alert>
      )}

      {staffData && (
        <>
          {/* Export Buttons Card - Matching Sales Report Style */}
          <Card className="mb-4">
            <Card.Body>
              <div className="d-flex gap-2 align-items-center">
                <Button variant="success" onClick={() => handleExportClick('Excel')} disabled={exporting}>
                  <CsLineIcons icon="file-text" className="me-2" />
                  Excel
                </Button>
                <Button variant="danger" onClick={() => handleExportClick('PDF')} disabled={exporting}>
                  <CsLineIcons icon="file-text" className="me-2" />
                  PDF
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

          {/* Staff Information Card */}
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
                  <div className="fw-bold">
                    {staffData.f_name} {staffData.l_name}
                  </div>
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

          {/* Rest of your existing components (Calendar, Attendance Records Table) remain the same */}
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
                    right: 'dayGridMonth,dayGridWeek',
                  }}
                  buttonText={{
                    today: 'Today',
                    month: 'Month',
                    week: 'Week',
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
                  <small>Day Shift</small>
                </div>
                <div className="d-flex align-items-center">
                  <div className="rounded me-2" style={{ width: '15px', height: '15px', backgroundColor: '#6f42c1' }} />
                  <small>Night Shift</small>
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
                  Click on any event to view details. 🌙 = Night shift
                </small>
              </div>
            </Card.Footer>
          </Card>

          {/* Export Options Modal */}
          <Modal show={showExportModal} onHide={() => setShowExportModal(false)} size="lg">
            <Modal.Header closeButton>
              <Modal.Title>Export Options - {exportType}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <p className="text-muted mb-4">Select which sections to include in your {exportType} export</p>

              <Form>
                <Form.Check
                  type="checkbox"
                  id="includeSummary"
                  label="Summary Dashboard"
                  checked={exportOptions.includeSummary}
                  onChange={(e) =>
                    setExportOptions({
                      ...exportOptions,
                      includeSummary: e.target.checked,
                    })
                  }
                  className="mb-3"
                />

                <Form.Check
                  type="checkbox"
                  id="includeDetailedTable"
                  label="Detailed Attendance Records"
                  checked={exportOptions.includeDetailedTable}
                  onChange={(e) =>
                    setExportOptions({
                      ...exportOptions,
                      includeDetailedTable: e.target.checked,
                    })
                  }
                  className="mb-3"
                />

                <Form.Check
                  type="checkbox"
                  id="includeStatistics"
                  label="Statistics and Analysis"
                  checked={exportOptions.includeStatistics}
                  onChange={(e) =>
                    setExportOptions({
                      ...exportOptions,
                      includeStatistics: e.target.checked,
                    })
                  }
                  className="mb-3"
                />

                <Alert variant="info" className="mt-4">
                  <CsLineIcons icon="info-circle" className="me-2" />
                  <strong>Note:</strong> The exported report will include staff information and filtered data based on your current filters.
                </Alert>
              </Form>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="dark" onClick={() => setShowExportModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleExportConfirm}>
                <CsLineIcons icon="download" className="me-2" />
                Export {exportType}
              </Button>
            </Modal.Footer>
          </Modal>

          {/* Success Toast */}
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
      )}

      {/* Rest of your existing components remain the same */}
      {/* The existing Attendance Records Table and Detail Modal remain unchanged */}
    </>
  );
};

export default ViewAttendance;
