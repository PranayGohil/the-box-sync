import React, { useState, useEffect, useContext } from 'react';
import { Button, Row, Col, Card, Table, Form, Spinner, Alert, Badge, Modal, ProgressBar, Toast, ToastContainer } from 'react-bootstrap';
import axios from 'axios';
import { format } from 'date-fns';
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AuthContext } from 'contexts/AuthContext';

const OperationalReport = () => {
  const title = 'Operational Performance Report';
  const description = 'Staff, Table, and Time-based Performance Analysis';

  const breadcrumbs = [
    { to: '', text: 'Home' },
    { to: 'dashboards', text: 'Dashboards' },
    { to: 'statistics', text: 'Statistics' },
    { to: 'reports/operational', text: 'Operational Report' },
  ];

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [reportData, setReportData] = useState(null);

  const { currentUser } = useContext(AuthContext);

  // Export states
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportType, setExportType] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Export options modal
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportOptions, setExportOptions] = useState({
    includeWaiterPerformance: true,
    includeTablePerformance: true,
    includePeakHours: true,
    includeDayOfWeek: true,
    includeAreaPerformance: true,
    includeInsights: true,
  });

  const [startDate, setStartDate] = useState(format(new Date().setDate(new Date().getDate() - 7), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const API_BASE = process.env.REACT_APP_API;
  const COMPANY_NAME = `${currentUser?.name || 'TheBox'}`;

  const getHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
  });

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const formatCurrencyPDF = (amount) => {
    const value = new Intl.NumberFormat('en-IN', {
      maximumFractionDigits: 0,
    }).format(amount || 0);
    return `Rs. ${value}`;
  };

  const fetchOperationalReport = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = {
        period: 'custom',
        start_date: startDate,
        end_date: endDate,
      };

      const response = await axios.get(`${API_BASE}/statistics/operational`, {
        ...getHeaders(),
        params,
      });

      setReportData(response.data);
    } catch (err) {
      console.error('Error fetching operational report:', err);
      setError(err.response?.data?.error || 'Failed to load operational report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOperationalReport();
  }, []);

  // Show toast notification
  const showSuccessToast = (message) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const getBusiestHour = () => {
    if (!reportData?.peakHours || reportData.peakHours.length === 0) return null;
    return reportData.peakHours.reduce((max, hour) => (hour.orderCount > max.orderCount ? hour : max), reportData.peakHours[0]);
  };

  const getBusiestDay = () => {
    if (!reportData?.dayOfWeekAnalysis || reportData.dayOfWeekAnalysis.length === 0) return null;
    return reportData.dayOfWeekAnalysis.reduce((max, day) => (day.orderCount > max.orderCount ? day : max), reportData.dayOfWeekAnalysis[0]);
  };

  // Enhanced Excel Export
  const exportToExcel = async () => {
    if (!reportData) return;

    setExporting(true);
    setExportProgress(10);
    setExportType('Excel');

    try {
      const wb = XLSX.utils.book_new();

      const busiestHour = getBusiestHour();
      const busiestDay = getBusiestDay();

      // Dashboard Sheet
      if (exportOptions.includeInsights) {
        setExportProgress(15);
        const dashboardData = [
          ['OPERATIONAL PERFORMANCE DASHBOARD'],
          [],
          ['Company:', COMPANY_NAME],
          ['Report Period:', `${format(new Date(startDate), 'dd MMM yyyy')} to ${format(new Date(endDate), 'dd MMM yyyy')}`],
          ['Generated On:', format(new Date(), 'dd MMM yyyy HH:mm')],
          [],
          ['KEY OPERATIONAL METRICS'],
          ['Metric', 'Value'],
          ['Total Active Staff', reportData.waiterPerformance?.length || 0],
          ['Active Tables', reportData.tablePerformance?.length || 0],
          ['Busiest Hour', busiestHour ? `${busiestHour.hour}:00` : 'N/A'],
          ['Peak Hour Orders', busiestHour ? busiestHour.orderCount : 0],
          ['Busiest Day', busiestDay ? busiestDay.dayName : 'N/A'],
          ['Peak Day Orders', busiestDay ? busiestDay.orderCount : 0],
          [],
          ['TOP PERFORMERS'],
          ['Category', 'Name', 'Performance'],
        ];

        // Add top waiter
        if (reportData.waiterPerformance && reportData.waiterPerformance.length > 0) {
          const topWaiter = reportData.waiterPerformance[0];
          dashboardData.push(['Top Waiter', topWaiter.waiter, `${topWaiter.totalOrders} orders`]);
        }

        // Add top table
        if (reportData.tablePerformance && reportData.tablePerformance.length > 0) {
          const topTable = reportData.tablePerformance[0];
          dashboardData.push(['Top Table', topTable.tableNo, `${topTable.orderCount} orders`]);
        }

        const dashboardSheet = XLSX.utils.aoa_to_sheet(dashboardData);

        // Set column widths
        dashboardSheet['!cols'] = [{ wch: 25 }, { wch: 30 }, { wch: 20 }];

        XLSX.utils.book_append_sheet(wb, dashboardSheet, 'Dashboard');
      }

      // Waiter Performance Sheet
      if (exportOptions.includeWaiterPerformance) {
        setExportProgress(30);
        const waiterData = [
          ['WAITER PERFORMANCE ANALYSIS'],
          [],
          ['Rank', 'Waiter', 'Total Orders', 'Revenue', 'Avg Order Value', 'Tables Served', 'Total Discount', 'Revenue/Order', 'Performance Rating'],
        ];

        const avgRevenue = reportData.waiterPerformance.reduce((sum, w) => sum + w.totalRevenue, 0) / reportData.waiterPerformance.length;

        reportData.waiterPerformance.forEach((waiter, idx) => {
          const performance = waiter.totalRevenue >= avgRevenue * 1.2 ? 'Excellent' : waiter.totalRevenue >= avgRevenue * 0.8 ? 'Good' : 'Needs Improvement';

          waiterData.push([
            idx + 1,
            waiter.waiter,
            waiter.totalOrders,
            waiter.totalRevenue,
            waiter.avgOrderValue,
            waiter.tablesServed,
            waiter.totalDiscount,
            waiter.revenuePerOrder,
            performance,
          ]);
        });

        const waiterSheet = XLSX.utils.aoa_to_sheet(waiterData);

        // Set column widths
        waiterSheet['!cols'] = [{ wch: 8 }, { wch: 20 }, { wch: 14 }, { wch: 15 }, { wch: 16 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 18 }];

        // Apply currency formatting
        const range = XLSX.utils.decode_range(waiterSheet['!ref']);
        for (let R = 3; R <= range.e.r; R += 1) {
          const revenueCell = XLSX.utils.encode_cell({ r: R, c: 3 });
          const avgCell = XLSX.utils.encode_cell({ r: R, c: 4 });
          const discountCell = XLSX.utils.encode_cell({ r: R, c: 6 });
          const revPerOrderCell = XLSX.utils.encode_cell({ r: R, c: 7 });

          if (waiterSheet[revenueCell]) waiterSheet[revenueCell].z = '"Rs. "#,##0';
          if (waiterSheet[avgCell]) waiterSheet[avgCell].z = '"Rs. "#,##0';
          if (waiterSheet[discountCell]) waiterSheet[discountCell].z = '"Rs. "#,##0';
          if (waiterSheet[revPerOrderCell]) waiterSheet[revPerOrderCell].z = '"Rs. "#,##0';
        }

        // Enable auto-filter
        waiterSheet['!autofilter'] = { ref: `A3:I${range.e.r + 1}` };

        XLSX.utils.book_append_sheet(wb, waiterSheet, 'Waiter Performance');
      }

      // Table Performance Sheet
      if (exportOptions.includeTablePerformance) {
        setExportProgress(45);
        const tableData = [
          ['TABLE PERFORMANCE ANALYSIS'],
          [],
          ['Rank', 'Table No', 'Area', 'Orders', 'Revenue', 'Avg Order', 'Total Persons', 'Avg Persons', 'Revenue/Person'],
        ];

        reportData.tablePerformance.forEach((table, idx) => {
          tableData.push([
            idx + 1,
            table.tableNo,
            table.tableArea || 'N/A',
            table.orderCount,
            table.totalRevenue,
            table.avgOrderValue,
            table.totalPersons,
            table.avgPersonsPerOrder,
            table.revenuePerPerson,
          ]);
        });

        const tableSheet = XLSX.utils.aoa_to_sheet(tableData);

        // Set column widths
        tableSheet['!cols'] = [{ wch: 8 }, { wch: 12 }, { wch: 15 }, { wch: 10 }, { wch: 15 }, { wch: 12 }, { wch: 14 }, { wch: 12 }, { wch: 16 }];

        // Apply currency formatting
        const range = XLSX.utils.decode_range(tableSheet['!ref']);
        for (let R = 3; R <= range.e.r; R += 1) {
          const revenueCell = XLSX.utils.encode_cell({ r: R, c: 4 });
          const avgCell = XLSX.utils.encode_cell({ r: R, c: 5 });
          const revPerPersonCell = XLSX.utils.encode_cell({ r: R, c: 8 });

          if (tableSheet[revenueCell]) tableSheet[revenueCell].z = '"Rs. "#,##0';
          if (tableSheet[avgCell]) tableSheet[avgCell].z = '"Rs. "#,##0';
          if (tableSheet[revPerPersonCell]) tableSheet[revPerPersonCell].z = '"Rs. "#,##0';
        }

        // Enable auto-filter
        tableSheet['!autofilter'] = { ref: `A3:I${range.e.r + 1}` };

        XLSX.utils.book_append_sheet(wb, tableSheet, 'Table Performance');
      }

      // Peak Hours Sheet
      if (exportOptions.includePeakHours) {
        setExportProgress(60);
        const hoursData = [['HOURLY PERFORMANCE ANALYSIS'], [], ['Hour', 'Time Range', 'Orders', 'Revenue', 'Avg Order Value', 'Activity Level']];

        const maxOrders = Math.max(...reportData.peakHours.map((h) => h.orderCount));

        reportData.peakHours.forEach((hour) => {
          const activityPercent = (hour.orderCount / maxOrders) * 100;
          const activityLevel = activityPercent >= 80 ? 'Peak' : activityPercent >= 50 ? 'Busy' : activityPercent >= 25 ? 'Moderate' : 'Slow';

          hoursData.push([hour.hour, `${hour.hour}:00 - ${hour.hour + 1}:00`, hour.orderCount, hour.totalRevenue, hour.avgOrderValue, activityLevel]);
        });

        const hoursSheet = XLSX.utils.aoa_to_sheet(hoursData);

        // Set column widths
        hoursSheet['!cols'] = [{ wch: 8 }, { wch: 18 }, { wch: 10 }, { wch: 15 }, { wch: 16 }, { wch: 15 }];

        // Apply currency formatting
        const range = XLSX.utils.decode_range(hoursSheet['!ref']);
        for (let R = 3; R <= range.e.r; R += 1) {
          const revenueCell = XLSX.utils.encode_cell({ r: R, c: 3 });
          const avgCell = XLSX.utils.encode_cell({ r: R, c: 4 });

          if (hoursSheet[revenueCell]) hoursSheet[revenueCell].z = '"Rs. "#,##0';
          if (hoursSheet[avgCell]) hoursSheet[avgCell].z = '"Rs. "#,##0';
        }

        XLSX.utils.book_append_sheet(wb, hoursSheet, 'Peak Hours');
      }

      // Day of Week Sheet
      if (exportOptions.includeDayOfWeek) {
        setExportProgress(75);
        const dayData = [['DAY OF WEEK ANALYSIS'], [], ['Day', 'Orders', 'Revenue', 'Avg Order Value', 'Performance Rating']];

        const avgRevenue = reportData.dayOfWeekAnalysis.reduce((sum, d) => sum + d.totalRevenue, 0) / reportData.dayOfWeekAnalysis.length;

        reportData.dayOfWeekAnalysis.forEach((day) => {
          const performance = day.totalRevenue >= avgRevenue * 1.2 ? 'Best Day' : day.totalRevenue >= avgRevenue * 0.8 ? 'Average' : 'Below Average';

          dayData.push([day.dayName, day.orderCount, day.totalRevenue, day.avgOrderValue, performance]);
        });

        const daySheet = XLSX.utils.aoa_to_sheet(dayData);

        // Set column widths
        daySheet['!cols'] = [{ wch: 15 }, { wch: 10 }, { wch: 15 }, { wch: 16 }, { wch: 18 }];

        // Apply currency formatting
        const range = XLSX.utils.decode_range(daySheet['!ref']);
        for (let R = 3; R <= range.e.r; R += 1) {
          const revenueCell = XLSX.utils.encode_cell({ r: R, c: 2 });
          const avgCell = XLSX.utils.encode_cell({ r: R, c: 3 });

          if (daySheet[revenueCell]) daySheet[revenueCell].z = '"Rs. "#,##0';
          if (daySheet[avgCell]) daySheet[avgCell].z = '"Rs. "#,##0';
        }

        XLSX.utils.book_append_sheet(wb, daySheet, 'Day of Week');
      }

      // Area Performance Sheet
      if (exportOptions.includeAreaPerformance && reportData.areaPerformance && reportData.areaPerformance.length > 0) {
        setExportProgress(85);
        const areaData = [['TABLE AREA PERFORMANCE'], [], ['Area', 'Orders', 'Revenue', 'Avg Order', 'Tables', 'Revenue/Table']];

        reportData.areaPerformance.forEach((area) => {
          areaData.push([area.area, area.orderCount, area.totalRevenue, area.avgOrderValue, area.tableCount, area.revenuePerTable]);
        });

        const areaSheet = XLSX.utils.aoa_to_sheet(areaData);

        // Set column widths
        areaSheet['!cols'] = [{ wch: 20 }, { wch: 10 }, { wch: 15 }, { wch: 12 }, { wch: 10 }, { wch: 15 }];

        // Apply currency formatting
        const range = XLSX.utils.decode_range(areaSheet['!ref']);
        for (let R = 3; R <= range.e.r; R += 1) {
          const revenueCell = XLSX.utils.encode_cell({ r: R, c: 2 });
          const avgCell = XLSX.utils.encode_cell({ r: R, c: 3 });
          const revPerTableCell = XLSX.utils.encode_cell({ r: R, c: 5 });

          if (areaSheet[revenueCell]) areaSheet[revenueCell].z = '"Rs. "#,##0';
          if (areaSheet[avgCell]) areaSheet[avgCell].z = '"Rs. "#,##0';
          if (areaSheet[revPerTableCell]) areaSheet[revPerTableCell].z = '"Rs. "#,##0';
        }

        XLSX.utils.book_append_sheet(wb, areaSheet, 'Area Performance');
      }

      setExportProgress(95);

      // Write file
      XLSX.writeFile(wb, `Operational_Report_${startDate}_to_${endDate}.xlsx`);

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
    if (!reportData) return;

    setExporting(true);
    setExportProgress(10);
    setExportType('PDF');

    try {
      const doc = new jsPDF('landscape');
      let yPosition = 20;

      const busiestHour = getBusiestHour();
      const busiestDay = getBusiestDay();

      // Executive Summary Page (Cover Page)
      setExportProgress(15);

      // Header with company branding
      doc.setFillColor(68, 114, 196);
      doc.rect(0, 0, 297, 40, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont(undefined, 'bold');
      doc.text('OPERATIONAL PERFORMANCE REPORT', 148.5, 20, { align: 'center' });

      doc.setFontSize(14);
      doc.setFont(undefined, 'normal');
      doc.text(COMPANY_NAME, 148.5, 30, { align: 'center' });

      yPosition = 50;
      doc.setTextColor(0, 0, 0);

      // Report Information
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text('Report Period:', 20, yPosition);
      doc.setFont(undefined, 'normal');
      doc.text(`${format(new Date(startDate), 'dd MMM yyyy')} to ${format(new Date(endDate), 'dd MMM yyyy')}`, 70, yPosition);

      yPosition += 8;
      doc.setFont(undefined, 'bold');
      doc.text('Generated:', 20, yPosition);
      doc.setFont(undefined, 'normal');
      doc.text(format(new Date(), 'dd MMM yyyy HH:mm'), 70, yPosition);

      yPosition += 15;

      // Key Metrics Summary
      if (exportOptions.includeInsights) {
        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.text('Executive Summary', 20, yPosition);
        yPosition += 12;

        // Create summary boxes
        const metrics = [
          { label: 'Active Staff', value: (reportData.waiterPerformance?.length || 0).toString(), color: [68, 114, 196] },
          { label: 'Active Tables', value: (reportData.tablePerformance?.length || 0).toString(), color: [76, 175, 80] },
          { label: 'Busiest Hour', value: busiestHour ? `${busiestHour.hour}:00` : 'N/A', color: [255, 152, 0] },
          { label: 'Busiest Day', value: busiestDay ? busiestDay.dayName : 'N/A', color: [156, 39, 176] },
        ];

        metrics.forEach((metric, idx) => {
          const xPos = 20 + idx * 65;

          // Draw colored box
          doc.setFillColor(...metric.color);
          doc.roundedRect(xPos, yPosition, 60, 25, 3, 3, 'F');

          // Label
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(9);
          doc.setFont(undefined, 'normal');
          doc.text(metric.label, xPos + 30, yPosition + 9, { align: 'center' });

          // Value
          doc.setFontSize(14);
          doc.setFont(undefined, 'bold');
          doc.text(metric.value, xPos + 30, yPosition + 19, { align: 'center' });
        });

        yPosition += 40;
        doc.setTextColor(0, 0, 0);

        // Key Insights
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text('Key Operational Insights:', 20, yPosition);
        yPosition += 8;

        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');

        const topWaiter = reportData.waiterPerformance?.[0];
        const topTable = reportData.tablePerformance?.[0];

        const insights = [
          `• Top performing waiter: ${topWaiter?.waiter || 'N/A'} (${topWaiter?.totalOrders || 0} orders, ${formatCurrencyPDF(topWaiter?.totalRevenue || 0)})`,
          `• Most productive table: ${topTable?.tableNo || 'N/A'} in ${topTable?.tableArea || 'N/A'} (${topTable?.orderCount || 0} orders)`,
          `• Peak business hours: ${busiestHour ? `${busiestHour.hour}:00-${busiestHour.hour + 1}:00` : 'N/A'} with ${busiestHour?.orderCount || 0} orders`,
          `• Busiest day of week: ${busiestDay?.dayName || 'N/A'} with ${formatCurrencyPDF(busiestDay?.totalRevenue || 0)} revenue`,
        ];

        insights.forEach((insight) => {
          doc.text(insight, 20, yPosition);
          yPosition += 7;
        });

        // Add new page for detailed data
        doc.addPage();
        yPosition = 20;
      }

      // Waiter Performance
      if (exportOptions.includeWaiterPerformance) {
        setExportProgress(35);

        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('Waiter Performance Analysis', 20, yPosition);
        yPosition += 8;

        const avgRevenue = reportData.waiterPerformance.reduce((sum, w) => sum + w.totalRevenue, 0) / reportData.waiterPerformance.length;

        autoTable(doc, {
          startY: yPosition,
          head: [['Rank', 'Waiter', 'Orders', 'Revenue', 'Avg Order', 'Tables', 'Performance']],
          body: reportData.waiterPerformance.map((waiter, idx) => {
            const performance = waiter.totalRevenue >= avgRevenue * 1.2 ? '⭐ Excellent' : waiter.totalRevenue >= avgRevenue * 0.8 ? '👍 Good' : '📈 Improving';

            return [
              (idx + 1).toString(),
              waiter.waiter,
              waiter.totalOrders.toString(),
              formatCurrencyPDF(waiter.totalRevenue),
              formatCurrencyPDF(waiter.avgOrderValue),
              waiter.tablesServed.toString(),
              performance,
            ];
          }),
          theme: 'grid',
          headStyles: {
            fillColor: [68, 114, 196],
            fontSize: 10,
            fontStyle: 'bold',
          },
          styles: { fontSize: 9 },
          columnStyles: {
            0: { halign: 'center', cellWidth: 15 },
            2: { halign: 'center' },
            3: { halign: 'right' },
            4: { halign: 'right' },
            5: { halign: 'center' },
            6: { halign: 'center' },
          },
          // Highlight top 3
          didParseCell(data) {
            if (data.row.index < 3 && data.section === 'body') {
              data.cell.styles.fillColor = [255, 243, 205];
            }
          },
        });

        yPosition = doc.lastAutoTable.finalY + 15;
      }

      // Table Performance
      if (exportOptions.includeTablePerformance) {
        setExportProgress(50);

        if (yPosition > 150) {
          doc.addPage();
          yPosition = 20;
        }

        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('Top 15 Tables by Revenue', 20, yPosition);
        yPosition += 8;

        autoTable(doc, {
          startY: yPosition,
          head: [['Rank', 'Table', 'Area', 'Orders', 'Revenue', 'Avg Order', 'Rev/Person']],
          body: reportData.tablePerformance
            .slice(0, 15)
            .map((table, idx) => [
              (idx + 1).toString(),
              table.tableNo,
              table.tableArea || 'N/A',
              table.orderCount.toString(),
              formatCurrencyPDF(table.totalRevenue),
              formatCurrencyPDF(table.avgOrderValue),
              formatCurrencyPDF(table.revenuePerPerson),
            ]),
          theme: 'striped',
          headStyles: {
            fillColor: [68, 114, 196],
            fontSize: 10,
            fontStyle: 'bold',
          },
          styles: { fontSize: 9 },
          columnStyles: {
            0: { halign: 'center', cellWidth: 15 },
            3: { halign: 'center' },
            4: { halign: 'right' },
            5: { halign: 'right' },
            6: { halign: 'right' },
          },
        });

        yPosition = doc.lastAutoTable.finalY + 15;
      }

      // Peak Hours Analysis
      if (exportOptions.includePeakHours) {
        setExportProgress(65);

        if (yPosition > 150) {
          doc.addPage();
          yPosition = 20;
        }

        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('Hourly Performance Analysis', 20, yPosition);
        yPosition += 8;

        const maxOrders = Math.max(...reportData.peakHours.map((h) => h.orderCount));

        autoTable(doc, {
          startY: yPosition,
          head: [['Time Range', 'Orders', 'Revenue', 'Avg Order', 'Activity']],
          body: reportData.peakHours.map((hour) => {
            const activityPercent = (hour.orderCount / maxOrders) * 100;
            const activityLevel = activityPercent >= 80 ? '🔥 Peak' : activityPercent >= 50 ? '📈 Busy' : activityPercent >= 25 ? '➡️ Moderate' : '😴 Slow';

            return [
              `${hour.hour}:00 - ${hour.hour + 1}:00`,
              hour.orderCount.toString(),
              formatCurrencyPDF(hour.totalRevenue),
              formatCurrencyPDF(hour.avgOrderValue),
              activityLevel,
            ];
          }),
          theme: 'striped',
          headStyles: {
            fillColor: [68, 114, 196],
            fontSize: 10,
            fontStyle: 'bold',
          },
          styles: { fontSize: 9 },
          columnStyles: {
            0: { cellWidth: 45 },
            1: { halign: 'center' },
            2: { halign: 'right' },
            3: { halign: 'right' },
            4: { halign: 'center' },
          },
        });

        yPosition = doc.lastAutoTable.finalY + 15;
      }

      // Day of Week Analysis
      if (exportOptions.includeDayOfWeek) {
        setExportProgress(80);

        if (yPosition > 150) {
          doc.addPage();
          yPosition = 20;
        }

        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('Day of Week Performance', 20, yPosition);
        yPosition += 8;

        const avgRevenue = reportData.dayOfWeekAnalysis.reduce((sum, d) => sum + d.totalRevenue, 0) / reportData.dayOfWeekAnalysis.length;

        autoTable(doc, {
          startY: yPosition,
          head: [['Day', 'Orders', 'Revenue', 'Avg Order', 'Performance']],
          body: reportData.dayOfWeekAnalysis.map((day) => {
            const performance = day.totalRevenue >= avgRevenue * 1.2 ? '⭐ Best' : day.totalRevenue >= avgRevenue * 0.8 ? '📊 Average' : '📉 Below';

            return [day.dayName, day.orderCount.toString(), formatCurrencyPDF(day.totalRevenue), formatCurrencyPDF(day.avgOrderValue), performance];
          }),
          theme: 'grid',
          headStyles: {
            fillColor: [68, 114, 196],
            fontSize: 10,
            fontStyle: 'bold',
          },
          styles: { fontSize: 9 },
          columnStyles: {
            1: { halign: 'center' },
            2: { halign: 'right' },
            3: { halign: 'right' },
            4: { halign: 'center' },
          },
        });

        yPosition = doc.lastAutoTable.finalY + 15;
      }

      // Area Performance
      if (exportOptions.includeAreaPerformance && reportData.areaPerformance && reportData.areaPerformance.length > 0) {
        setExportProgress(90);

        if (yPosition > 150) {
          doc.addPage();
          yPosition = 20;
        }

        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('Table Area Performance', 20, yPosition);
        yPosition += 8;

        autoTable(doc, {
          startY: yPosition,
          head: [['Area', 'Orders', 'Revenue', 'Avg Order', 'Tables', 'Rev/Table']],
          body: reportData.areaPerformance.map((area) => [
            area.area,
            area.orderCount.toString(),
            formatCurrencyPDF(area.totalRevenue),
            formatCurrencyPDF(area.avgOrderValue),
            area.tableCount.toString(),
            formatCurrencyPDF(area.revenuePerTable),
          ]),
          theme: 'striped',
          headStyles: {
            fillColor: [68, 114, 196],
            fontSize: 10,
            fontStyle: 'bold',
          },
          styles: { fontSize: 9 },
          columnStyles: {
            1: { halign: 'center' },
            2: { halign: 'right' },
            3: { halign: 'right' },
            4: { halign: 'center' },
            5: { halign: 'right' },
          },
        });

        yPosition = doc.lastAutoTable.finalY;
      }

      // Footer on each page
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i += 1) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(128, 128, 128);
        doc.text(`${COMPANY_NAME} | Operational Report | Page ${i} of ${pageCount}`, 148.5, 200, { align: 'center' });
        doc.text(`Generated: ${format(new Date(), 'dd MMM yyyy HH:mm')}`, 148.5, 204, { align: 'center' });
      }

      setExportProgress(95);

      doc.save(`Operational_Report_${startDate}_to_${endDate}.pdf`);

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

  if (loading && !reportData) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  const busiestHour = getBusiestHour();
  const busiestDay = getBusiestDay();

  return (
    <>
      <HtmlHead title={title} description={description} />

      <div className="page-title-container mb-3">
        <Row>
          <Col>
            <h1 className="mb-0 pb-0 display-4">{title}</h1>
            <BreadcrumbList items={breadcrumbs} />
          </Col>
        </Row>
      </div>

      {/* Filters */}
      <Card className="mb-4">
        <Card.Body>
          <Row className="g-3 align-items-end">
            <Col md={4}>
              <Form.Label>Start Date</Form.Label>
              <Form.Control type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </Col>
            <Col md={4}>
              <Form.Label>End Date</Form.Label>
              <Form.Control type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </Col>
            <Col md={4}>
              <Button variant="primary" className="w-100" onClick={fetchOperationalReport} disabled={loading}>
                <CsLineIcons icon="sync" className="me-2" />
                {loading ? 'Loading...' : 'Generate Report'}
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

      {reportData && (
        <>
          {/* Export Buttons */}
          <Card className="mb-4">
            <Card.Body>
              <div className="d-flex gap-2 align-items-center">
                <Button variant="success" onClick={() => handleExportClick('Excel')} disabled={exporting}>
                  <CsLineIcons icon="file-text" className="me-2" />
                  Export to Excel
                </Button>
                <Button variant="danger" onClick={() => handleExportClick('PDF')} disabled={exporting}>
                  <CsLineIcons icon="file-pdf" className="me-2" />
                  Export to PDF
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

          {/* Key Insights */}
          <Row className="mb-4">
            <Col lg={3} md={6} className="mb-3">
              <Card>
                <Card.Body>
                  <div className="text-muted text-small mb-1">Total Staff</div>
                  <div className="text-primary h3 mb-0">{reportData.waiterPerformance?.length || 0}</div>
                  <div className="text-small text-muted">Active waiters</div>
                </Card.Body>
              </Card>
            </Col>
            <Col lg={3} md={6} className="mb-3">
              <Card>
                <Card.Body>
                  <div className="text-muted text-small mb-1">Busiest Hour</div>
                  <div className="text-primary h3 mb-0">{busiestHour ? `${busiestHour.hour}:00` : 'N/A'}</div>
                  <div className="text-small text-muted">{busiestHour ? `${busiestHour.orderCount} orders` : ''}</div>
                </Card.Body>
              </Card>
            </Col>
            <Col lg={3} md={6} className="mb-3">
              <Card>
                <Card.Body>
                  <div className="text-muted text-small mb-1">Busiest Day</div>
                  <div className="text-primary h3 mb-0">{busiestDay ? busiestDay.dayName : 'N/A'}</div>
                  <div className="text-small text-muted">{busiestDay ? `${busiestDay.orderCount} orders` : ''}</div>
                </Card.Body>
              </Card>
            </Col>
            <Col lg={3} md={6} className="mb-3">
              <Card>
                <Card.Body>
                  <div className="text-muted text-small mb-1">Active Tables</div>
                  <div className="text-primary h3 mb-0">{reportData.tablePerformance?.length || 0}</div>
                  <div className="text-small text-muted">Tables used</div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Waiter Performance */}
          <Card className="mb-4">
            <Card.Body>
              <h5 className="mb-3">Waiter Performance</h5>
              <div className="table-responsive">
                <Table striped hover>
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>Waiter</th>
                      <th className="text-end">Total Orders</th>
                      <th className="text-end">Revenue</th>
                      <th className="text-end">Avg Order Value</th>
                      <th className="text-end">Tables Served</th>
                      <th className="text-end">Total Discount</th>
                      <th className="text-end">Revenue/Order</th>
                      <th className="text-center">Performance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.waiterPerformance.map((waiter, idx) => {
                      const avgRevenue = reportData.waiterPerformance.reduce((sum, w) => sum + w.totalRevenue, 0) / reportData.waiterPerformance.length;
                      const performance =
                        waiter.totalRevenue >= avgRevenue * 1.2 ? 'excellent' : waiter.totalRevenue >= avgRevenue * 0.8 ? 'good' : 'needs-improvement';

                      return (
                        <tr key={idx}>
                          <td>
                            <Badge bg={idx < 3 ? 'primary' : 'secondary'}>{idx + 1}</Badge>
                          </td>
                          <td className="font-weight-bold">{waiter.waiter}</td>
                          <td className="text-end">{waiter.totalOrders}</td>
                          <td className="text-end font-weight-bold text-primary">{formatCurrency(waiter.totalRevenue)}</td>
                          <td className="text-end">{formatCurrency(waiter.avgOrderValue)}</td>
                          <td className="text-end">{waiter.tablesServed}</td>
                          <td className="text-end text-danger">{formatCurrency(waiter.totalDiscount)}</td>
                          <td className="text-end">{formatCurrency(waiter.revenuePerOrder)}</td>
                          <td className="text-center">
                            <Badge bg={performance === 'excellent' ? 'success' : performance === 'good' ? 'info' : 'warning'}>
                              {performance === 'excellent' ? '⭐ Excellent' : performance === 'good' ? '👍 Good' : '📈 Improving'}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>

          {/* Table Performance */}
          <Card className="mb-4">
            <Card.Body>
              <h5 className="mb-3">Table Performance</h5>
              <div className="table-responsive">
                <Table striped hover>
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>Table No</th>
                      <th>Area</th>
                      <th className="text-end">Orders</th>
                      <th className="text-end">Revenue</th>
                      <th className="text-end">Avg Order</th>
                      <th className="text-end">Total Persons</th>
                      <th className="text-end">Avg Persons</th>
                      <th className="text-end">Revenue/Person</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.tablePerformance.map((table, idx) => (
                      <tr key={idx}>
                        <td>
                          <Badge bg={idx < 5 ? 'primary' : 'secondary'}>{idx + 1}</Badge>
                        </td>
                        <td className="font-weight-bold">{table.tableNo}</td>
                        <td>{table.tableArea || 'N/A'}</td>
                        <td className="text-end">{table.orderCount}</td>
                        <td className="text-end font-weight-bold text-primary">{formatCurrency(table.totalRevenue)}</td>
                        <td className="text-end">{formatCurrency(table.avgOrderValue)}</td>
                        <td className="text-end">{table.totalPersons}</td>
                        <td className="text-end">{table.avgPersonsPerOrder}</td>
                        <td className="text-end">{formatCurrency(table.revenuePerPerson)}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>

          {/* Peak Hours Analysis */}
          <Card className="mb-4">
            <Card.Body>
              <h5 className="mb-3">Hourly Performance Analysis</h5>
              <div className="table-responsive">
                <Table striped hover>
                  <thead>
                    <tr>
                      <th>Hour</th>
                      <th className="text-end">Orders</th>
                      <th className="text-end">Revenue</th>
                      <th className="text-end">Avg Order Value</th>
                      <th className="text-center">Activity Level</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.peakHours.map((hour, idx) => {
                      const maxOrders = Math.max(...reportData.peakHours.map((h) => h.orderCount));
                      const activityPercent = (hour.orderCount / maxOrders) * 100;
                      const activityLevel = activityPercent >= 80 ? 'peak' : activityPercent >= 50 ? 'busy' : activityPercent >= 25 ? 'moderate' : 'slow';

                      return (
                        <tr key={idx}>
                          <td className="font-weight-bold">
                            {hour.hour}:00 - {hour.hour + 1}:00
                          </td>
                          <td className="text-end">{hour.orderCount}</td>
                          <td className="text-end font-weight-bold text-primary">{formatCurrency(hour.totalRevenue)}</td>
                          <td className="text-end">{formatCurrency(hour.avgOrderValue)}</td>
                          <td className="text-center">
                            <Badge
                              bg={
                                activityLevel === 'peak' ? 'danger' : activityLevel === 'busy' ? 'warning' : activityLevel === 'moderate' ? 'info' : 'secondary'
                              }
                            >
                              {activityLevel === 'peak'
                                ? '🔥 Peak'
                                : activityLevel === 'busy'
                                ? '📈 Busy'
                                : activityLevel === 'moderate'
                                ? '➡️ Moderate'
                                : '😴 Slow'}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>

          {/* Day of Week Analysis */}
          <Card className="mb-4">
            <Card.Body>
              <h5 className="mb-3">Day of Week Performance</h5>
              <div className="table-responsive">
                <Table striped hover>
                  <thead>
                    <tr>
                      <th>Day</th>
                      <th className="text-end">Orders</th>
                      <th className="text-end">Revenue</th>
                      <th className="text-end">Avg Order Value</th>
                      <th className="text-center">Performance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.dayOfWeekAnalysis.map((day, idx) => {
                      const avgRevenue = reportData.dayOfWeekAnalysis.reduce((sum, d) => sum + d.totalRevenue, 0) / reportData.dayOfWeekAnalysis.length;
                      const performance = day.totalRevenue >= avgRevenue * 1.2 ? 'best' : day.totalRevenue >= avgRevenue * 0.8 ? 'average' : 'below';

                      return (
                        <tr key={idx}>
                          <td className="font-weight-bold">{day.dayName}</td>
                          <td className="text-end">{day.orderCount}</td>
                          <td className="text-end font-weight-bold text-primary">{formatCurrency(day.totalRevenue)}</td>
                          <td className="text-end">{formatCurrency(day.avgOrderValue)}</td>
                          <td className="text-center">
                            <Badge bg={performance === 'best' ? 'success' : performance === 'average' ? 'info' : 'warning'}>
                              {performance === 'best' ? '⭐ Best Day' : performance === 'average' ? '📊 Average' : '📉 Below Avg'}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>

          {/* Area Performance */}
          {reportData.areaPerformance && reportData.areaPerformance.length > 0 && (
            <Card className="mb-4">
              <Card.Body>
                <h5 className="mb-3">Table Area Performance</h5>
                <div className="table-responsive">
                  <Table striped hover>
                    <thead>
                      <tr>
                        <th>Area</th>
                        <th className="text-end">Orders</th>
                        <th className="text-end">Revenue</th>
                        <th className="text-end">Avg Order</th>
                        <th className="text-end">Tables</th>
                        <th className="text-end">Revenue/Table</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.areaPerformance.map((area, idx) => (
                        <tr key={idx}>
                          <td className="font-weight-bold">{area.area}</td>
                          <td className="text-end">{area.orderCount}</td>
                          <td className="text-end font-weight-bold text-primary">{formatCurrency(area.totalRevenue)}</td>
                          <td className="text-end">{formatCurrency(area.avgOrderValue)}</td>
                          <td className="text-end">{area.tableCount}</td>
                          <td className="text-end">{formatCurrency(area.revenuePerTable)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              </Card.Body>
            </Card>
          )}
        </>
      )}

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
              id="includeInsights"
              label="Dashboard & Key Insights"
              checked={exportOptions.includeInsights}
              onChange={(e) =>
                setExportOptions({
                  ...exportOptions,
                  includeInsights: e.target.checked,
                })
              }
              className="mb-3"
            />

            <Form.Check
              type="checkbox"
              id="includeWaiterPerformance"
              label="Waiter Performance Analysis"
              checked={exportOptions.includeWaiterPerformance}
              onChange={(e) =>
                setExportOptions({
                  ...exportOptions,
                  includeWaiterPerformance: e.target.checked,
                })
              }
              className="mb-3"
            />

            <Form.Check
              type="checkbox"
              id="includeTablePerformance"
              label="Table Performance Analysis"
              checked={exportOptions.includeTablePerformance}
              onChange={(e) =>
                setExportOptions({
                  ...exportOptions,
                  includeTablePerformance: e.target.checked,
                })
              }
              className="mb-3"
            />

            <Form.Check
              type="checkbox"
              id="includePeakHours"
              label="Hourly Performance (Peak Hours)"
              checked={exportOptions.includePeakHours}
              onChange={(e) =>
                setExportOptions({
                  ...exportOptions,
                  includePeakHours: e.target.checked,
                })
              }
              className="mb-3"
            />

            <Form.Check
              type="checkbox"
              id="includeDayOfWeek"
              label="Day of Week Analysis"
              checked={exportOptions.includeDayOfWeek}
              onChange={(e) =>
                setExportOptions({
                  ...exportOptions,
                  includeDayOfWeek: e.target.checked,
                })
              }
              className="mb-3"
            />

            <Form.Check
              type="checkbox"
              id="includeAreaPerformance"
              label="Table Area Performance"
              checked={exportOptions.includeAreaPerformance}
              onChange={(e) =>
                setExportOptions({
                  ...exportOptions,
                  includeAreaPerformance: e.target.checked,
                })
              }
              className="mb-3"
            />
          </Form>

          <Alert variant="info" className="mt-4">
            <CsLineIcons icon="info-circle" className="me-2" />
            <strong>Tip:</strong> Include all sections for a comprehensive operational analysis that helps identify top performers and optimization
            opportunities.
          </Alert>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowExportModal(false)}>
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
  );
};

export default OperationalReport;
