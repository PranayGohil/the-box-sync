import React, { useState, useEffect, useContext } from 'react';
import { Button, Row, Col, Card, Table, Form, Spinner, Alert, Badge, Modal, ProgressBar, Toast, ToastContainer } from 'react-bootstrap';
import axios from 'axios';
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format, isToday, isYesterday } from 'date-fns';
import { enIN } from 'date-fns/locale';
import { AuthContext } from 'contexts/AuthContext';

const SalesReport = () => {
  const title = 'Sales Report';
  const description = 'Detailed Sales Analysis and Reports';

  const breadcrumbs = [
    { to: '', text: 'Home' },
    { to: 'dashboards', text: 'Dashboards' },
    { to: 'statistics', text: 'Statistics' },
    { to: 'reports/sales', text: 'Sales Report' },
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
    includeSummary: true,
    includeRevenueTrends: true,
    includeTopDishes: true,
    topDishesLimit: 20,
    includeOrderTypes: true,
    includeCharts: true,
  });

  // Filters
  const [startDate, setStartDate] = useState(format(new Date().setDate(new Date().getDate() - 7), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [groupBy, setGroupBy] = useState('day');
  const [orderType, setOrderType] = useState('all');

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

  const getAllowedGroupBy = () => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);

    if (diffDays <= 2) return ['hour', 'day'];
    if (diffDays <= 60) return ['day'];
    return ['month'];
  };

  useEffect(() => {
    const allowed = getAllowedGroupBy();
    if (!allowed.includes(groupBy)) {
      setGroupBy(allowed[0]);
    }
  }, [startDate, endDate]);

  const formatTrendDate = (item) => {
    const { _id } = item;
    const date = new Date(_id.year, (_id.month || 1) - 1, _id.day || 1);

    if (groupBy === 'hour') {
      if (_id.hour === undefined) return '—';
      date.setHours(_id.hour, 0, 0, 0);
      if (isToday(date)) return `Today ${format(date, 'HH:mm')}`;
      if (isYesterday(date)) return `Yesterday ${format(date, 'HH:mm')}`;
      return format(date, 'dd-MM-yyyy HH:mm', { locale: enIN });
    }

    if (groupBy === 'day') {
      if (isToday(date)) return 'Today';
      if (isYesterday(date)) return 'Yesterday';
      return format(date, 'dd-MM-yyyy', { locale: enIN });
    }

    if (groupBy === 'month') {
      return format(date, 'MMMM yyyy', { locale: enIN });
    }

    return '';
  };

  const getItemDate = (item) => {
    const { _id } = item;
    const date = new Date(_id.year, (_id.month || 1) - 1, _id.day || 1);

    if (groupBy === 'hour' && _id.hour !== undefined) {
      date.setHours(_id.hour, 0, 0, 0);
    }

    return date;
  };

  const fetchSalesReport = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = {
        period: 'custom',
        start_date: startDate,
        end_date: endDate,
        group_by: groupBy,
      };

      const [revenueRes, orderRes, dishesRes] = await Promise.all([
        axios.get(`${API_BASE}/statistics/revenue`, { ...getHeaders(), params }),
        axios.get(`${API_BASE}/statistics/orders`, {
          ...getHeaders(),
          params: { ...params, group_by: orderType === 'all' ? 'type' : 'status' },
        }),
        axios.get(`${API_BASE}/statistics/dishes/top`, {
          ...getHeaders(),
          params: { ...params, limit: 20 },
        }),
      ]);

      setReportData({
        revenue: revenueRes.data,
        orders: orderRes.data,
        dishes: dishesRes.data,
      });
    } catch (err) {
      console.error('Error fetching sales report:', err);
      setError(err.response?.data?.error || 'Failed to load sales report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalesReport();
  }, []);

  useEffect(() => {
    fetchSalesReport();
  }, [groupBy, startDate, endDate]);

  // Show toast notification
  const showSuccessToast = (message) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const sortedRevenueData = reportData ? [...reportData.revenue.data].sort((a, b) => getItemDate(b) - getItemDate(a)) : [];

  // Generate chart data for Excel
  const generateRevenueChartData = () => {
    if (!reportData) return null;

    const sortedData = [...reportData.revenue.data].sort((a, b) => getItemDate(a) - getItemDate(b));

    return sortedData.map((item) => ({
      date: formatTrendDate(item),
      revenue: item.value,
      orders: item.orderCount,
    }));
  };

  // Enhanced Excel Export with formatting and charts
  const exportToExcel = async () => {
    if (!reportData) return;

    setExporting(true);
    setExportProgress(10);
    setExportType('Excel');

    try {
      const wb = XLSX.utils.book_new();

      // Dashboard Sheet with key metrics and sparklines
      if (exportOptions.includeSummary) {
        setExportProgress(20);
        const dashboardData = [
          ['SALES REPORT DASHBOARD'],
          [],
          ['Company:', COMPANY_NAME],
          ['Report Period:', `${format(new Date(startDate), 'dd MMM yyyy')} to ${format(new Date(endDate), 'dd MMM yyyy')}`],
          ['Generated On:', format(new Date(), 'dd MMM yyyy HH:mm')],
          ['Generated By:', 'Sales Report System'],
          [],
          ['KEY METRICS'],
          ['Metric', 'Value', 'Performance'],
          ['Total Revenue', reportData.revenue.summary.totalRevenue, ''],
          ['Total Orders', reportData.revenue.summary.totalOrders, ''],
          ['Average Order Value', reportData.revenue.summary.averageOrderValue, ''],
          [
            'Peak Revenue Day',
            sortedRevenueData.length > 0 ? formatTrendDate(sortedRevenueData[0]) : 'N/A',
            sortedRevenueData.length > 0 ? sortedRevenueData[0].value : 0,
          ],
          [],
          ['TOP PERFORMERS'],
          ['Category', 'Value'],
        ];

        // Add top 3 dishes
        if (reportData.dishes.data.length > 0) {
          reportData.dishes.data.slice(0, 3).forEach((dish, idx) => {
            dashboardData.push([`Top Dish #${idx + 1}`, dish.dishName]);
          });
        }

        const dashboardSheet = XLSX.utils.aoa_to_sheet(dashboardData);

        // Set column widths
        dashboardSheet['!cols'] = [{ wch: 25 }, { wch: 30 }, { wch: 20 }];

        // Apply styles through cell formats
        const range = XLSX.utils.decode_range(dashboardSheet['!ref']);
        for (let R = range.s.r; R <= range.e.r; R += 1) {
          for (let C = range.s.c; C <= range.e.c; C += 1) {
            const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
            if (dashboardSheet[cellAddress]) {
              // Header rows (bold)
              if (R === 0 || R === 7 || R === 14) {
                if (!dashboardSheet[cellAddress].s) dashboardSheet[cellAddress].s = {};
                dashboardSheet[cellAddress].s = {
                  font: { bold: true, sz: 14 },
                  fill: { fgColor: { rgb: '4472C4' } },
                  alignment: { horizontal: 'center' },
                };
              }

              // Metric labels (bold)
              if (R >= 9 && R <= 12 && C === 0) {
                if (!dashboardSheet[cellAddress].s) dashboardSheet[cellAddress].s = {};
                dashboardSheet[cellAddress].s = { font: { bold: true } };
              }

              // Currency formatting for values
              if ((R === 9 || R === 11 || R === 12) && C === 1) {
                dashboardSheet[cellAddress].z = '"Rs. "#,##0';
              }
            }
          }
        }

        XLSX.utils.book_append_sheet(wb, dashboardSheet, 'Dashboard');
      }

      // Summary Sheet
      if (exportOptions.includeSummary) {
        setExportProgress(30);
        const summaryData = [
          ['SALES REPORT SUMMARY'],
          [],
          ['Report Information'],
          ['Period', `${startDate} to ${endDate}`],
          ['Generated', format(new Date(), 'PPpp')],
          ['Grouping', groupBy.charAt(0).toUpperCase() + groupBy.slice(1)],
          [],
          ['Financial Metrics'],
          ['Metric', 'Value'],
          ['Total Revenue', reportData.revenue.summary.totalRevenue],
          ['Total Orders', reportData.revenue.summary.totalOrders],
          ['Average Order Value', reportData.revenue.summary.averageOrderValue],
        ];

        const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);

        // Set column widths
        summarySheet['!cols'] = [{ wch: 25 }, { wch: 25 }];

        // Apply currency formatting
        summarySheet.B10.z = '"Rs. "#,##0';
        summarySheet.B12.z = '"Rs. "#,##0';

        XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');
      }

      // Revenue Details with conditional formatting indicators
      if (exportOptions.includeRevenueTrends) {
        setExportProgress(45);
        const sortedData = [...reportData.revenue.data].sort((a, b) => getItemDate(a) - getItemDate(b));

        const revenueData = [['REVENUE TREND ANALYSIS'], [], ['Date', 'Revenue', 'Orders', 'Avg Order Value', 'Performance']];

        sortedData.forEach((item, idx) => {
          const avgOrderValue = item.orderCount > 0 ? item.value / item.orderCount : 0;
          const trend =
            idx > 0 && sortedData[idx - 1].value ? `${(((item.value - sortedData[idx - 1].value) / sortedData[idx - 1].value) * 100).toFixed(1)}%` : 'N/A';

          revenueData.push([formatTrendDate(item), item.value, item.orderCount, avgOrderValue, trend]);
        });

        const revenueSheet = XLSX.utils.aoa_to_sheet(revenueData);

        // Set column widths
        revenueSheet['!cols'] = [{ wch: 20 }, { wch: 15 }, { wch: 12 }, { wch: 18 }, { wch: 15 }];

        // Apply currency formatting and filters
        const range = XLSX.utils.decode_range(revenueSheet['!ref']);
        for (let R = 3; R <= range.e.r; ++R) {
          const revenueCell = XLSX.utils.encode_cell({ r: R, c: 1 });
          const avgCell = XLSX.utils.encode_cell({ r: R, c: 3 });

          if (revenueSheet[revenueCell]) {
            revenueSheet[revenueCell].z = '"Rs. "#,##0';
          }
          if (revenueSheet[avgCell]) {
            revenueSheet[avgCell].z = '"Rs. "#,##0';
          }
        }

        // Enable auto-filter
        revenueSheet['!autofilter'] = { ref: `A3:E${range.e.r + 1}` };

        XLSX.utils.book_append_sheet(wb, revenueSheet, 'Revenue Details');
      }

      // Top Dishes with rankings
      if (exportOptions.includeTopDishes) {
        setExportProgress(60);
        const dishesLimit = exportOptions.topDishesLimit || 20;
        const dishesData = [
          ['TOP SELLING DISHES ANALYSIS'],
          [],
          ['Rank', 'Dish Name', 'Category', 'Quantity Sold', 'Revenue', 'Orders', 'Avg Revenue/Order', 'Special'],
        ];

        reportData.dishes.data.slice(0, dishesLimit).forEach((dish, idx) => {
          dishesData.push([
            idx + 1,
            dish.dishName,
            dish.category || 'N/A',
            dish.totalQuantity,
            dish.totalRevenue,
            dish.orderCount,
            dish.orderCount > 0 ? dish.totalRevenue / dish.orderCount : 0,
            dish.isSpecial ? 'Yes' : 'No',
          ]);
        });

        const dishesSheet = XLSX.utils.aoa_to_sheet(dishesData);

        // Set column widths
        dishesSheet['!cols'] = [{ wch: 8 }, { wch: 30 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 10 }, { wch: 18 }, { wch: 10 }];

        // Apply currency formatting
        const range = XLSX.utils.decode_range(dishesSheet['!ref']);
        for (let R = 3; R <= range.e.r; ++R) {
          const revenueCell = XLSX.utils.encode_cell({ r: R, c: 4 });
          const avgCell = XLSX.utils.encode_cell({ r: R, c: 6 });

          if (dishesSheet[revenueCell]) {
            dishesSheet[revenueCell].z = '"Rs. "#,##0';
          }
          if (dishesSheet[avgCell]) {
            dishesSheet[avgCell].z = '"Rs. "#,##0';
          }
        }

        // Enable auto-filter
        dishesSheet['!autofilter'] = { ref: `A3:H${range.e.r + 1}` };

        XLSX.utils.book_append_sheet(wb, dishesSheet, 'Top Dishes');
      }

      // Order Type Breakdown
      if (exportOptions.includeOrderTypes) {
        setExportProgress(75);
        const orderTypeData = [['ORDER TYPE BREAKDOWN'], [], ['Order Type', 'Count', 'Revenue', 'Avg Order Value', '% of Total Revenue', '% of Total Orders']];

        const { totalRevenue } = reportData.revenue.summary;
        const { totalOrders } = reportData.revenue.summary;

        reportData.orders.data.forEach((order) => {
          const { category, count, totalRevenue: orderRevenue, avgOrderValue } = order;
          orderTypeData.push([
            category,
            count,
            orderRevenue,
            avgOrderValue,
            `${((orderRevenue / totalRevenue) * 100).toFixed(2)}%`,
            `${((count / totalOrders) * 100).toFixed(2)}%`,
          ]);
        });

        const orderTypeSheet = XLSX.utils.aoa_to_sheet(orderTypeData);

        // Set column widths
        orderTypeSheet['!cols'] = [{ wch: 15 }, { wch: 12 }, { wch: 15 }, { wch: 18 }, { wch: 20 }, { wch: 20 }];

        // Apply currency formatting
        const range = XLSX.utils.decode_range(orderTypeSheet['!ref']);
        for (let R = 3; R <= range.e.r; ++R) {
          const revenueCell = XLSX.utils.encode_cell({ r: R, c: 2 });
          const avgCell = XLSX.utils.encode_cell({ r: R, c: 3 });

          if (orderTypeSheet[revenueCell]) {
            orderTypeSheet[revenueCell].z = '"Rs. "#,##0';
          }
          if (orderTypeSheet[avgCell]) {
            orderTypeSheet[avgCell].z = '"Rs. "#,##0';
          }
        }

        XLSX.utils.book_append_sheet(wb, orderTypeSheet, 'Order Types');
      }

      setExportProgress(90);

      // Write file
      XLSX.writeFile(wb, `Sales_Report_${startDate}_to_${endDate}.xlsx`);

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

  // Enhanced PDF Export with charts and better formatting
  const exportToPDF = async () => {
    if (!reportData) return;

    setExporting(true);
    setExportProgress(10);
    setExportType('PDF');

    try {
      const doc = new jsPDF();
      let yPosition = 20;

      // Executive Summary Page (Cover Page)
      if (exportOptions.includeSummary) {
        setExportProgress(20);

        // Header with company branding
        doc.setFillColor(68, 114, 196); // Blue color
        doc.rect(0, 0, 210, 40, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(24);
        doc.setFont(undefined, 'bold');
        doc.text('SALES REPORT', 105, 20, { align: 'center' });

        doc.setFontSize(14);
        doc.setFont(undefined, 'normal');
        doc.text(COMPANY_NAME, 105, 30, { align: 'center' });

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

        // Key Metrics Summary with visual indicators
        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.text('Executive Summary', 20, yPosition);
        yPosition += 12;

        // Create summary boxes
        const metrics = [
          { label: 'Total Revenue', value: formatCurrencyPDF(reportData.revenue.summary.totalRevenue), color: [76, 175, 80] },
          { label: 'Total Orders', value: reportData.revenue.summary.totalOrders.toString(), color: [33, 150, 243] },
          { label: 'Avg Order Value', value: formatCurrencyPDF(reportData.revenue.summary.averageOrderValue), color: [255, 152, 0] },
        ];

        metrics.forEach((metric, idx) => {
          const xPos = 20 + idx * 60;

          // Draw colored box
          doc.setFillColor(...metric.color);
          doc.roundedRect(xPos, yPosition, 55, 30, 3, 3, 'F');

          // Label
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(9);
          doc.setFont(undefined, 'normal');
          doc.text(metric.label, xPos + 27.5, yPosition + 10, { align: 'center' });

          // Value
          doc.setFontSize(14);
          doc.setFont(undefined, 'bold');
          doc.text(metric.value, xPos + 27.5, yPosition + 22, { align: 'center' });
        });

        yPosition += 45;
        doc.setTextColor(0, 0, 0);

        // Insights section
        if (exportOptions.includeCharts && sortedRevenueData.length > 0) {
          doc.setFontSize(12);
          doc.setFont(undefined, 'bold');
          doc.text('Key Insights:', 20, yPosition);
          yPosition += 8;

          doc.setFontSize(10);
          doc.setFont(undefined, 'normal');

          // Calculate insights
          const avgRevenue = reportData.revenue.summary.totalRevenue / sortedRevenueData.length;
          const peakDay = sortedRevenueData[0];
          const topDish = reportData.dishes.data[0];

          const insights = [
            `• Peak revenue day: ${formatTrendDate(peakDay)} with ${formatCurrencyPDF(peakDay.value)}`,
            `• Average daily revenue: ${formatCurrencyPDF(avgRevenue)}`,
            `• Top selling item: ${topDish.dishName} (${topDish.totalQuantity} units sold)`,
            `• Most popular order type: ${reportData.orders.data[0].category} (${(
              (reportData.orders.data[0].totalRevenue / reportData.revenue.summary.totalRevenue) *
              100
            ).toFixed(1)}% of revenue)`,
          ];

          insights.forEach((insight) => {
            doc.text(insight, 20, yPosition);
            yPosition += 7;
          });
        }

        // Add new page for detailed data
        doc.addPage();
        yPosition = 20;
      }

      // Revenue Trend Chart (Simple visualization)
      if (exportOptions.includeRevenueTrends && exportOptions.includeCharts) {
        setExportProgress(40);

        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('Revenue Trend Analysis', 20, yPosition);
        yPosition += 10;

        // Simple line chart representation using autoTable
        const chartData = sortedRevenueData.slice(0, 10).map((item, idx) => {
          const prevValue = idx > 0 ? sortedRevenueData[idx - 1].value : item.value;
          const change = (((item.value - prevValue) / prevValue) * 100).toFixed(1);
          const indicator = idx > 0 ? (item.value > prevValue ? '↑' : item.value < prevValue ? '↓' : '→') : '—';

          return [
            formatTrendDate(item),
            formatCurrencyPDF(item.value),
            item.orderCount.toString(),
            formatCurrencyPDF(item.orderCount > 0 ? item.value / item.orderCount : 0),
            idx > 0 ? `${indicator} ${change}%` : '—',
          ];
        });

        autoTable(doc, {
          startY: yPosition,
          head: [['Date', 'Revenue', 'Orders', 'Avg Order', 'Change']],
          body: chartData,
          theme: 'striped',
          headStyles: {
            fillColor: [68, 114, 196],
            fontSize: 10,
            fontStyle: 'bold',
          },
          styles: { fontSize: 9 },
          columnStyles: {
            1: { halign: 'right' },
            2: { halign: 'center' },
            3: { halign: 'right' },
            4: { halign: 'center', textColor: [76, 175, 80] },
          },
        });

        yPosition = doc.lastAutoTable.finalY + 15;
      }

      // Top Dishes
      if (exportOptions.includeTopDishes) {
        setExportProgress(60);

        if (yPosition > 200) {
          doc.addPage();
          yPosition = 20;
        }

        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text(`Top ${exportOptions.topDishesLimit || 10} Dishes`, 20, yPosition);
        yPosition += 8;

        const dishesLimit = exportOptions.topDishesLimit || 10;

        autoTable(doc, {
          startY: yPosition,
          head: [['Rank', 'Dish', 'Category', 'Qty', 'Revenue', 'Special']],
          body: reportData.dishes.data
            .slice(0, dishesLimit)
            .map((dish, idx) => [
              (idx + 1).toString(),
              dish.dishName,
              dish.category || 'N/A',
              dish.totalQuantity.toString(),
              formatCurrencyPDF(dish.totalRevenue),
              dish.isSpecial ? '★' : '—',
            ]),
          theme: 'grid',
          headStyles: {
            fillColor: [68, 114, 196],
            fontSize: 10,
            fontStyle: 'bold',
          },
          styles: { fontSize: 9 },
          columnStyles: {
            0: { halign: 'center', cellWidth: 15 },
            1: { cellWidth: 60 },
            3: { halign: 'center' },
            4: { halign: 'right' },
            5: { halign: 'center' },
          },
          // Highlight top 3
          didParseCell(data) {
            if (data.row.index < 3 && data.section === 'body') {
              data.cell.styles.fillColor = [255, 243, 205]; // Light yellow
            }
          },
        });

        yPosition = doc.lastAutoTable.finalY + 15;
      }

      // Order Type Breakdown with chart
      if (exportOptions.includeOrderTypes) {
        setExportProgress(80);

        if (yPosition > 200) {
          doc.addPage();
          yPosition = 20;
        }

        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('Order Type Breakdown', 20, yPosition);
        yPosition += 8;

        // Create pie chart representation
        if (exportOptions.includeCharts) {
          const { totalRevenue } = reportData.revenue.summary;
          let currentAngle = 0;
          const centerX = 105;
          const centerY = yPosition + 30;
          const radius = 25;

          const colors = [
            [76, 175, 80], // Green
            [33, 150, 243], // Blue
            [255, 152, 0], // Orange
            [156, 39, 176], // Purple
          ];

          reportData.orders.data.forEach((order, idx) => {
            const { totalRevenue: orderRevenue } = order;
            const percentage = orderRevenue / totalRevenue;
            const angle = percentage * 2 * Math.PI;

            // Draw pie slice
            doc.setFillColor(...colors[idx % colors.length]);

            // This is a simplified representation - actual pie chart would need more complex drawing
            const x1 = centerX + radius * Math.cos(currentAngle);
            const y1 = centerY + radius * Math.sin(currentAngle);
            const x2 = centerX + radius * Math.cos(currentAngle + angle);
            const y2 = centerY + radius * Math.sin(currentAngle + angle);

            doc.triangle(centerX, centerY, x1, y1, x2, y2, 'F');

            currentAngle += angle;
          });

          yPosition += 65;
        }

        autoTable(doc, {
          startY: yPosition,
          head: [['Type', 'Count', 'Revenue', 'Avg Value', '% Revenue']],
          body: reportData.orders.data.map((order) => [
            order.category,
            order.count.toString(),
            formatCurrencyPDF(order.totalRevenue),
            formatCurrencyPDF(order.avgOrderValue),
            `${((order.totalRevenue / reportData.revenue.summary.totalRevenue) * 100).toFixed(1)}%`,
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
          },
        });

        yPosition = doc.lastAutoTable.finalY;
      }

      // Footer on each page
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(128, 128, 128);
        doc.text(`${COMPANY_NAME} | Sales Report | Page ${i} of ${pageCount}`, 105, 290, { align: 'center' });
        doc.text(`Generated: ${format(new Date(), 'dd MMM yyyy HH:mm')}`, 105, 294, { align: 'center' });
      }

      setExportProgress(95);

      doc.save(`Sales_Report_${startDate}_to_${endDate}.pdf`);

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

  return (
    <>
      <HtmlHead title={title} description={description} />

      {/* Print-specific styles */}
      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }
          
          .card {
            page-break-inside: avoid;
            break-inside: avoid;
            box-shadow: none !important;
            border: 1px solid #dee2e6 !important;
          }
          
          .table {
            page-break-inside: auto;
          }
          
          .table tr {
            page-break-inside: avoid;
            break-inside: avoid;
          }
          
          .table thead {
            display: table-header-group;
          }
          
          @page {
            margin: 1.5cm;
            size: A4;
          }
          
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          
          .print-header {
            display: block !important;
            text-align: center;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 2px solid #4472C4;
          }
          
          .print-header h1 {
            font-size: 24px;
            margin: 0;
            color: #4472C4;
          }
          
          .print-header .company-name {
            font-size: 18px;
            color: #666;
            margin-top: 5px;
          }
          
          .print-header .report-info {
            font-size: 12px;
            color: #888;
            margin-top: 5px;
          }
        }
        
        .print-header {
          display: none;
        }
      `}</style>

      {/* Print Header (only visible when printing) */}
      <div className="print-header">
        <h1>Sales Report</h1>
        <div className="company-name">{COMPANY_NAME}</div>
        <div className="report-info">
          Period: {format(new Date(startDate), 'dd MMM yyyy')} to {format(new Date(endDate), 'dd MMM yyyy')} | Generated:{' '}
          {format(new Date(), 'dd MMM yyyy HH:mm')}
        </div>
      </div>

      <div className="page-title-container mb-3 no-print">
        <Row>
          <Col>
            <h1 className="mb-0 pb-0 display-4">{title}</h1>
            <BreadcrumbList items={breadcrumbs} />
          </Col>
        </Row>
      </div>

      {/* Filters */}
      <Card className="mb-4 no-print">
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
              <Form.Label>Group By</Form.Label>
              <Form.Select value={groupBy} onChange={(e) => setGroupBy(e.target.value)}>
                {['hour', 'day', 'month'].map((option) => (
                  <option key={option} value={option} disabled={!getAllowedGroupBy().includes(option)}>
                    {option.charAt(0).toUpperCase() + option.slice(1)}
                    {!getAllowedGroupBy().includes(option) ? ' (Not available)' : ''}
                  </option>
                ))}
              </Form.Select>
              <Form.Text className="text-muted">
                {groupBy === 'hour' && 'Best for 1-2 day analysis'}
                {groupBy === 'day' && 'Best for daily trends'}
                {groupBy === 'month' && 'Best for long-term growth'}
              </Form.Text>
            </Col>
            <Col md={2}>
              <Form.Label>Order Type</Form.Label>
              <Form.Select value={orderType} onChange={(e) => setOrderType(e.target.value)}>
                <option value="all">All Types</option>
                <option value="dine-in">Dine In</option>
                <option value="takeaway">Takeaway</option>
                <option value="delivery">Delivery</option>
              </Form.Select>
            </Col>
            <Col md={1} className="h-100" style={{ minHeight: '-webkit-fill-available' }}>
              <Form.Label> &nbsp; </Form.Label>
              <Button variant="primary" className="w-100" onClick={fetchSalesReport} disabled={loading}>
                <CsLineIcons icon="sync" className="me-2" />
                {loading ? 'Loading...' : 'Generate'}
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
          <Card className="mb-4 no-print">
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

          {/* Summary Cards */}
          <Row className="mb-4">
            <Col lg={3} md={6} className="mb-3">
              <Card className="sh-13">
                <Card.Body>
                  <div className="text-muted mb-1">Total Revenue</div>
                  <div className="text-primary h3 mb-0">{formatCurrency(reportData.revenue.summary.totalRevenue)}</div>
                </Card.Body>
              </Card>
            </Col>
            <Col lg={3} md={6} className="mb-3">
              <Card className="sh-13">
                <Card.Body>
                  <div className="text-muted mb-1">Total Orders</div>
                  <div className="text-primary h3 mb-0">{reportData.revenue.summary.totalOrders}</div>
                </Card.Body>
              </Card>
            </Col>
            <Col lg={3} md={6} className="mb-3">
              <Card className="sh-13">
                <Card.Body>
                  <div className="text-muted mb-1">Average Order Value</div>
                  <div className="text-primary h3 mb-0">{formatCurrency(reportData.revenue.summary.averageOrderValue)}</div>
                </Card.Body>
              </Card>
            </Col>
            <Col lg={3} md={6} className="mb-3">
              <Card className="sh-13">
                <Card.Body>
                  <div className="text-muted mb-1">Report Period</div>
                  <div className="text-primary h5 mb-0">
                    {format(new Date(startDate), 'MMM dd')} - {format(new Date(endDate), 'MMM dd')}
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Revenue Trend Table */}
          <Card className="mb-4">
            <Card.Body>
              <h5 className="mb-3">Revenue Trend</h5>
              <div className="table-responsive">
                <Table striped hover>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th className="text-end">Revenue</th>
                      <th className="text-end">Orders</th>
                      <th className="text-end">Avg Order Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedRevenueData.map((item, idx) => (
                      <tr key={idx}>
                        <td>{formatTrendDate(item)}</td>
                        <td className="text-end font-weight-bold">{formatCurrency(item.value)}</td>
                        <td className="text-end">{item.orderCount}</td>
                        <td className="text-end">{formatCurrency(item.orderCount > 0 ? item.value / item.orderCount : 0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>

          {/* Top Dishes Table */}
          <Card className="mb-4">
            <Card.Body>
              <h5 className="mb-3">Top Selling Dishes</h5>
              <div className="table-responsive">
                <Table striped hover>
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>Dish Name</th>
                      <th>Category</th>
                      <th className="text-end">Quantity</th>
                      <th className="text-end">Revenue</th>
                      <th className="text-end">Orders</th>
                      <th className="text-center">Special</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.dishes.data.map((dish, idx) => (
                      <tr key={idx}>
                        <td>
                          <Badge bg={idx < 3 ? 'primary' : 'secondary'}>{idx + 1}</Badge>
                        </td>
                        <td className="font-weight-bold">{dish.dishName}</td>
                        <td>{dish.category || 'N/A'}</td>
                        <td className="text-end">{dish.totalQuantity}</td>
                        <td className="text-end font-weight-bold text-primary">{formatCurrency(dish.totalRevenue)}</td>
                        <td className="text-end">{dish.orderCount}</td>
                        <td className="text-center">{dish.isSpecial ? <Badge bg="warning">★</Badge> : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>

          {/* Order Type Breakdown */}
          <Card className="mb-4">
            <Card.Body>
              <h5 className="mb-3">Order Type Breakdown</h5>
              <div className="table-responsive">
                <Table striped hover>
                  <thead>
                    <tr>
                      <th>Order Type</th>
                      <th className="text-end">Count</th>
                      <th className="text-end">Revenue</th>
                      <th className="text-end">Avg Order Value</th>
                      <th className="text-end">% of Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.orders.data.map((order, idx) => (
                      <tr key={idx}>
                        <td className="font-weight-bold">{order.category}</td>
                        <td className="text-end">{order.count}</td>
                        <td className="text-end font-weight-bold text-primary">{formatCurrency(order.totalRevenue)}</td>
                        <td className="text-end">{formatCurrency(order.avgOrderValue)}</td>
                        <td className="text-end">{((order.totalRevenue / reportData.revenue.summary.totalRevenue) * 100).toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>
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
              id="includeSummary"
              label="Summary Metrics"
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
              id="includeRevenueTrends"
              label="Revenue Trends"
              checked={exportOptions.includeRevenueTrends}
              onChange={(e) =>
                setExportOptions({
                  ...exportOptions,
                  includeRevenueTrends: e.target.checked,
                })
              }
              className="mb-3"
            />

            <div className="mb-3">
              <Form.Check
                type="checkbox"
                id="includeTopDishes"
                label="Top Dishes"
                checked={exportOptions.includeTopDishes}
                onChange={(e) =>
                  setExportOptions({
                    ...exportOptions,
                    includeTopDishes: e.target.checked,
                  })
                }
              />
              {exportOptions.includeTopDishes && (
                <Form.Group className="mt-2 ms-4">
                  <Form.Label>Number of dishes to include:</Form.Label>
                  <Form.Select
                    value={exportOptions.topDishesLimit}
                    onChange={(e) =>
                      setExportOptions({
                        ...exportOptions,
                        topDishesLimit: parseInt(e.target.value, 10),
                      })
                    }
                  >
                    <option value={10}>Top 10</option>
                    <option value={20}>Top 20</option>
                    <option value={50}>Top 50</option>
                    <option value={999}>All Dishes</option>
                  </Form.Select>
                </Form.Group>
              )}
            </div>

            <Form.Check
              type="checkbox"
              id="includeOrderTypes"
              label="Order Type Breakdown"
              checked={exportOptions.includeOrderTypes}
              onChange={(e) =>
                setExportOptions({
                  ...exportOptions,
                  includeOrderTypes: e.target.checked,
                })
              }
              className="mb-3"
            />

            <Form.Check
              type="checkbox"
              id="includeCharts"
              label="Include Charts & Visualizations"
              checked={exportOptions.includeCharts}
              onChange={(e) =>
                setExportOptions({
                  ...exportOptions,
                  includeCharts: e.target.checked,
                })
              }
              className="mb-3"
            />
          </Form>

          <Alert variant="info" className="mt-4">
            <CsLineIcons icon="info-circle" className="me-2" />
            <strong>Tip:</strong> Including charts will make your {exportType} file larger but more visually appealing and easier to understand.
          </Alert>
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
  );
};

export default SalesReport;
