import React, { useState, useEffect, useContext } from 'react';
import { Button, Row, Col, Card, Table, Form, Spinner, Alert, Badge, ProgressBar, Modal, Toast, ToastContainer } from 'react-bootstrap';
import axios from 'axios';
import { format } from 'date-fns';
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AuthContext } from 'contexts/AuthContext';

const FinancialReport = () => {
  const title = 'Financial Report';
  const description = 'Comprehensive Financial Analysis and Summary';

  const breadcrumbs = [
    { to: '', text: 'Home' },
    { to: 'dashboards', text: 'Dashboards' },
    { to: 'statistics', text: 'Statistics' },
    { to: 'reports/financial', text: 'Financial Report' },
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
    includeDailyBreakdown: true,
    includeTaxBreakdown: true,
    includePaymentMethods: true,
    includeFinancialInsights: true,
    includeCharts: true,
  });

  const [startDate, setStartDate] = useState(format(new Date().setMonth(new Date().getMonth() - 1), 'yyyy-MM-dd'));
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

  const fetchFinancialReport = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = {
        period: 'custom',
        start_date: startDate,
        end_date: endDate,
      };

      const response = await axios.get(`${API_BASE}/statistics/financial`, {
        ...getHeaders(),
        params,
      });

      setReportData(response.data);
    } catch (err) {
      console.error('Error fetching financial report:', err);
      setError(err.response?.data?.error || 'Failed to load financial report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinancialReport();
  }, []);

  // Show toast notification
  const showSuccessToast = (message) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  // Enhanced Excel Export
  const exportToExcel = async () => {
    if (!reportData) return;

    setExporting(true);
    setExportProgress(10);
    setExportType('Excel');

    try {
      const wb = XLSX.utils.book_new();

      // Dashboard Sheet
      if (exportOptions.includeSummary) {
        setExportProgress(15);

        const totalDeductions = reportData.summary.totalDiscount + reportData.summary.totalWaveOff;
        const collectionRate = ((reportData.summary.totalPaid / reportData.summary.netRevenue) * 100).toFixed(1);

        const dashboardData = [
          ['FINANCIAL REPORT DASHBOARD'],
          [],
          ['Company:', COMPANY_NAME],
          ['Report Period:', `${format(new Date(startDate), 'dd MMM yyyy')} to ${format(new Date(endDate), 'dd MMM yyyy')}`],
          ['Generated On:', format(new Date(), 'dd MMM yyyy HH:mm')],
          [],
          ['FINANCIAL SUMMARY'],
          ['Metric', 'Amount (Rs.)', 'Percentage'],
          ['Gross Revenue', reportData.summary.grossRevenue, '100%'],
          ['Total Discount', reportData.summary.totalDiscount, `${reportData.summary.discountPercentage}%`],
          ['Total Wave Off', reportData.summary.totalWaveOff, `${((reportData.summary.totalWaveOff / reportData.summary.grossRevenue) * 100).toFixed(2)}%`],
          ['Net Revenue', reportData.summary.netRevenue, `${((reportData.summary.netRevenue / reportData.summary.grossRevenue) * 100).toFixed(2)}%`],
          ['Total Tax', reportData.summary.totalTax, `${reportData.summary.taxPercentage}%`],
          ['Total Paid', reportData.summary.totalPaid, `${collectionRate}%`],
          ['Total Orders', reportData.summary.totalOrders, ''],
          [],
          ['FINANCIAL HEALTH INDICATORS'],
          ['Indicator', 'Value', 'Status'],
          [
            'Discount Ratio',
            `${reportData.summary.discountPercentage}%`,
            reportData.summary.discountPercentage > 15 ? 'High' : reportData.summary.discountPercentage > 10 ? 'Moderate' : 'Healthy',
          ],
          ['Tax Efficiency', `${reportData.summary.taxPercentage}%`, 'Normal'],
          ['Collection Rate', `${collectionRate}%`, collectionRate > 95 ? 'Excellent' : collectionRate > 85 ? 'Good' : 'Needs Attention'],
        ];

        const dashboardSheet = XLSX.utils.aoa_to_sheet(dashboardData);

        // Set column widths
        dashboardSheet['!cols'] = [{ wch: 25 }, { wch: 25 }, { wch: 20 }];

        // Apply currency formatting
        dashboardSheet.B9.z = '"Rs. "#,##0';
        dashboardSheet.B10.z = '"Rs. "#,##0';
        dashboardSheet.B11.z = '"Rs. "#,##0';
        dashboardSheet.B12.z = '"Rs. "#,##0';
        dashboardSheet.B13.z = '"Rs. "#,##0';
        dashboardSheet.B14.z = '"Rs. "#,##0';

        XLSX.utils.book_append_sheet(wb, dashboardSheet, 'Dashboard');
      }

      // Summary Sheet with detailed breakdown
      if (exportOptions.includeSummary) {
        setExportProgress(30);

        const summaryData = [
          ['FINANCIAL SUMMARY REPORT'],
          [],
          ['Report Information'],
          ['Period', `${startDate} to ${endDate}`],
          ['Generated', format(new Date(), 'dd MMM yyyy HH:mm')],
          [],
          ['Revenue Analysis'],
          ['Financial Metric', 'Amount (Rs.)', 'Notes'],
          ['Gross Revenue', reportData.summary.grossRevenue, 'Total before deductions'],
          ['Less: Discount', reportData.summary.totalDiscount, `${reportData.summary.discountPercentage}% of gross`],
          ['Less: Wave Off', reportData.summary.totalWaveOff, 'Complimentary/written off'],
          ['Net Revenue', reportData.summary.netRevenue, 'After deductions'],
          ['Tax Collected', reportData.summary.totalTax, `${reportData.summary.taxPercentage}% of net`],
          ['Amount Collected', reportData.summary.totalPaid, 'Actual payments received'],
          [],
          ['Order Statistics'],
          ['Total Orders', reportData.summary.totalOrders, ''],
          ['Average Order Value', reportData.summary.netRevenue / reportData.summary.totalOrders, 'Net revenue per order'],
        ];

        const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);

        // Set column widths
        summarySheet['!cols'] = [{ wch: 25 }, { wch: 20 }, { wch: 35 }];

        // Apply currency formatting
        const range = XLSX.utils.decode_range(summarySheet['!ref']);
        for (let R = 8; R <= 13; R += 1) {
          const cell = XLSX.utils.encode_cell({ r: R, c: 1 });
          if (summarySheet[cell]) summarySheet[cell].z = '"Rs. "#,##0';
        }
        summarySheet.B18.z = '"Rs. "#,##0';

        XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');
      }

      // Tax Breakdown Sheet
      if (exportOptions.includeTaxBreakdown) {
        setExportProgress(45);

        const taxData = [['TAX BREAKDOWN ANALYSIS'], [], ['Tax Type', 'Amount (Rs.)', '% of Total Tax', '% of Net Revenue']];

        const taxes = [
          { name: 'CGST (Central GST)', amount: reportData.summary.cgstAmount },
          { name: 'SGST (State GST)', amount: reportData.summary.sgstAmount },
          { name: 'VAT (Value Added Tax)', amount: reportData.summary.vatAmount },
        ];

        taxes.forEach((tax) => {
          const percentOfTotalTax = ((tax.amount / reportData.summary.totalTax) * 100).toFixed(2);
          const percentOfNetRevenue = ((tax.amount / reportData.summary.netRevenue) * 100).toFixed(2);

          taxData.push([tax.name, tax.amount, `${percentOfTotalTax}%`, `${percentOfNetRevenue}%`]);
        });

        taxData.push([]);
        taxData.push(['Total Tax', reportData.summary.totalTax, '100%', `${reportData.summary.taxPercentage}%`]);

        const taxSheet = XLSX.utils.aoa_to_sheet(taxData);

        // Set column widths
        taxSheet['!cols'] = [{ wch: 25 }, { wch: 18 }, { wch: 18 }, { wch: 20 }];

        // Apply currency formatting
        const range = XLSX.utils.decode_range(taxSheet['!ref']);
        for (let R = 3; R <= range.e.r; R += 1) {
          const cell = XLSX.utils.encode_cell({ r: R, c: 1 });
          if (taxSheet[cell]) taxSheet[cell].z = '"Rs. "#,##0';
        }

        XLSX.utils.book_append_sheet(wb, taxSheet, 'Tax Breakdown');
      }

      // Payment Methods Sheet
      if (exportOptions.includePaymentMethods) {
        setExportProgress(60);

        const paymentData = [
          ['PAYMENT METHOD ANALYSIS'],
          [],
          ['Payment Method', 'Total Amount (Rs.)', 'Paid Amount (Rs.)', 'Order Count', '% of Total Revenue', 'Avg Transaction'],
        ];

        reportData.paymentMethodFinancials.forEach((payment) => {
          const percentOfRevenue = ((payment.totalAmount / reportData.summary.netRevenue) * 100).toFixed(2);
          const avgTransaction = payment.orderCount > 0 ? payment.totalAmount / payment.orderCount : 0;

          paymentData.push([payment.paymentMethod, payment.totalAmount, payment.paidAmount, payment.orderCount, `${percentOfRevenue}%`, avgTransaction]);
        });

        const paymentSheet = XLSX.utils.aoa_to_sheet(paymentData);

        // Set column widths
        paymentSheet['!cols'] = [{ wch: 20 }, { wch: 18 }, { wch: 18 }, { wch: 14 }, { wch: 18 }, { wch: 18 }];

        // Apply currency formatting
        const range = XLSX.utils.decode_range(paymentSheet['!ref']);
        for (let R = 3; R <= range.e.r; R += 1) {
          const amountCell = XLSX.utils.encode_cell({ r: R, c: 1 });
          const paidCell = XLSX.utils.encode_cell({ r: R, c: 2 });
          const avgCell = XLSX.utils.encode_cell({ r: R, c: 5 });

          if (paymentSheet[amountCell]) paymentSheet[amountCell].z = '"Rs. "#,##0';
          if (paymentSheet[paidCell]) paymentSheet[paidCell].z = '"Rs. "#,##0';
          if (paymentSheet[avgCell]) paymentSheet[avgCell].z = '"Rs. "#,##0';
        }

        // Enable auto-filter
        paymentSheet['!autofilter'] = { ref: `A3:F${range.e.r + 1}` };

        XLSX.utils.book_append_sheet(wb, paymentSheet, 'Payment Methods');
      }

      // Daily Financials Sheet
      if (exportOptions.includeDailyBreakdown) {
        setExportProgress(75);

        const dailyData = [
          ['DAILY FINANCIAL BREAKDOWN'],
          [],
          ['Date', 'Gross Revenue', 'Discount', 'Wave Off', 'Net Revenue', 'Tax', 'Orders', 'Avg Order Value'],
        ];

        reportData.dailyFinancials.forEach((day) => {
          const avgOrder = day.orders > 0 ? day.netRevenue / day.orders : 0;
          const dateStr = `${String(day.date.day).padStart(2, '0')}-${String(day.date.month).padStart(2, '0')}-${day.date.year}`;

          dailyData.push([dateStr, day.grossRevenue, day.discount, day.waveOff, day.netRevenue, day.tax, day.orders, avgOrder]);
        });

        // Add totals row
        dailyData.push([]);
        dailyData.push([
          'TOTAL',
          reportData.summary.grossRevenue,
          reportData.summary.totalDiscount,
          reportData.summary.totalWaveOff,
          reportData.summary.netRevenue,
          reportData.summary.totalTax,
          reportData.summary.totalOrders,
          reportData.summary.netRevenue / reportData.summary.totalOrders,
        ]);

        const dailySheet = XLSX.utils.aoa_to_sheet(dailyData);

        // Set column widths
        dailySheet['!cols'] = [{ wch: 12 }, { wch: 16 }, { wch: 14 }, { wch: 14 }, { wch: 16 }, { wch: 12 }, { wch: 10 }, { wch: 16 }];

        // Apply currency formatting
        const range = XLSX.utils.decode_range(dailySheet['!ref']);
        for (let R = 3; R <= range.e.r; R += 1) {
          for (let C = 1; C <= 5; C += 1) {
            const cell = XLSX.utils.encode_cell({ r: R, c: C });
            if (dailySheet[cell]) dailySheet[cell].z = '"Rs. "#,##0';
          }
          const avgCell = XLSX.utils.encode_cell({ r: R, c: 7 });
          if (dailySheet[avgCell]) dailySheet[avgCell].z = '"Rs. "#,##0';
        }

        // Enable auto-filter
        dailySheet['!autofilter'] = { ref: `A3:H${range.e.r}` };

        XLSX.utils.book_append_sheet(wb, dailySheet, 'Daily Breakdown');
      }

      setExportProgress(95);

      // Write file
      XLSX.writeFile(wb, `Financial_Report_${startDate}_to_${endDate}.xlsx`);

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
      const doc = new jsPDF();
      let yPosition = 20;

      // Executive Summary Page (Cover Page)
      setExportProgress(15);

      // Header with company branding
      doc.setFillColor(68, 114, 196);
      doc.rect(0, 0, 210, 40, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont(undefined, 'bold');
      doc.text('FINANCIAL REPORT', 105, 20, { align: 'center' });

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

      // Key Financial Metrics
      if (exportOptions.includeSummary) {
        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.text('Executive Summary', 20, yPosition);
        yPosition += 12;

        // Create summary boxes
        const metrics = [
          { label: 'Gross Revenue', value: formatCurrencyPDF(reportData.summary.grossRevenue), color: [68, 114, 196] },
          { label: 'Net Revenue', value: formatCurrencyPDF(reportData.summary.netRevenue), color: [76, 175, 80] },
          { label: 'Total Tax', value: formatCurrencyPDF(reportData.summary.totalTax), color: [255, 152, 0] },
        ];

        metrics.forEach((metric, idx) => {
          const xPos = 20 + idx * 60;

          // Draw colored box
          doc.setFillColor(...metric.color);
          doc.roundedRect(xPos, yPosition, 55, 25, 3, 3, 'F');

          // Label
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(9);
          doc.setFont(undefined, 'normal');
          doc.text(metric.label, xPos + 27.5, yPosition + 9, { align: 'center' });

          // Value
          doc.setFontSize(12);
          doc.setFont(undefined, 'bold');
          doc.text(metric.value, xPos + 27.5, yPosition + 19, { align: 'center' });
        });

        yPosition += 40;
        doc.setTextColor(0, 0, 0);

        // Financial Health Indicators
        if (exportOptions.includeCharts) {
          doc.setFontSize(12);
          doc.setFont(undefined, 'bold');
          doc.text('Financial Health Indicators:', 20, yPosition);
          yPosition += 8;

          doc.setFontSize(10);
          doc.setFont(undefined, 'normal');

          const collectionRate = ((reportData.summary.totalPaid / reportData.summary.netRevenue) * 100).toFixed(1);
          const totalDeductions = reportData.summary.totalDiscount + reportData.summary.totalWaveOff;

          const insights = [
            `• Discount Ratio: ${reportData.summary.discountPercentage}% ${reportData.summary.discountPercentage > 15 ? '(High - Review policies)' : reportData.summary.discountPercentage > 10 ? '(Moderate)' : '(Healthy)'
            }`,
            `• Total Deductions: ${formatCurrencyPDF(totalDeductions)} (${((totalDeductions / reportData.summary.grossRevenue) * 100).toFixed(
              1
            )}% of gross revenue)`,
            `• Tax Efficiency: ${reportData.summary.taxPercentage}% of net revenue`,
            `• Collection Rate: ${collectionRate}% ${collectionRate > 95 ? '(Excellent)' : collectionRate > 85 ? '(Good)' : '(Needs Attention)'}`,
            `• Average Order Value: ${formatCurrencyPDF(reportData.summary.netRevenue / reportData.summary.totalOrders)}`,
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

      // Financial Summary Table
      if (exportOptions.includeSummary) {
        setExportProgress(35);

        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('Financial Summary', 20, yPosition);
        yPosition += 8;

        autoTable(doc, {
          startY: yPosition,
          head: [['Metric', 'Amount', 'Notes']],
          body: [
            ['Gross Revenue', formatCurrencyPDF(reportData.summary.grossRevenue), 'Before deductions'],
            ['Discount', formatCurrencyPDF(reportData.summary.totalDiscount), `${reportData.summary.discountPercentage}% of gross`],
            ['Wave Off', formatCurrencyPDF(reportData.summary.totalWaveOff), 'Complimentary'],
            ['Net Revenue', formatCurrencyPDF(reportData.summary.netRevenue), 'After deductions'],
            ['Tax Collected', formatCurrencyPDF(reportData.summary.totalTax), `${reportData.summary.taxPercentage}% of net`],
            ['Amount Collected', formatCurrencyPDF(reportData.summary.totalPaid), 'Payments received'],
            ['Total Orders', reportData.summary.totalOrders.toString(), ''],
          ],
          theme: 'grid',
          headStyles: {
            fillColor: [68, 114, 196],
            fontSize: 10,
            fontStyle: 'bold',
          },
          styles: { fontSize: 9 },
          columnStyles: {
            1: { halign: 'right', fontStyle: 'bold' },
            2: { fontSize: 8, textColor: [100, 100, 100] },
          },
        });

        yPosition = doc.lastAutoTable.finalY + 15;
      }

      // Tax Breakdown
      if (exportOptions.includeTaxBreakdown) {
        setExportProgress(50);

        if (yPosition > 200) {
          doc.addPage();
          yPosition = 20;
        }

        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('Tax Breakdown', 20, yPosition);
        yPosition += 8;

        autoTable(doc, {
          startY: yPosition,
          head: [['Tax Type', 'Amount', '% of Total Tax']],
          body: [
            [
              'CGST (Central GST)',
              formatCurrencyPDF(reportData.summary.cgstAmount),
              `${((reportData.summary.cgstAmount / reportData.summary.totalTax) * 100).toFixed(1)}%`,
            ],
            [
              'SGST (State GST)',
              formatCurrencyPDF(reportData.summary.sgstAmount),
              `${((reportData.summary.sgstAmount / reportData.summary.totalTax) * 100).toFixed(1)}%`,
            ],
            [
              'VAT (Value Added Tax)',
              formatCurrencyPDF(reportData.summary.vatAmount),
              `${((reportData.summary.vatAmount / reportData.summary.totalTax) * 100).toFixed(1)}%`,
            ],
            ['Total Tax', formatCurrencyPDF(reportData.summary.totalTax), '100%'],
          ],
          theme: 'striped',
          headStyles: {
            fillColor: [68, 114, 196],
            fontSize: 10,
            fontStyle: 'bold',
          },
          styles: { fontSize: 9 },
          columnStyles: {
            1: { halign: 'right', fontStyle: 'bold' },
            2: { halign: 'center' },
          },
          // Highlight total row
          didParseCell(data) {
            if (data.row.index === 3 && data.section === 'body') {
              data.cell.styles.fillColor = [255, 243, 205];
              data.cell.styles.fontStyle = 'bold';
            }
          },
        });

        yPosition = doc.lastAutoTable.finalY + 15;
      }

      // Payment Methods
      if (exportOptions.includePaymentMethods) {
        setExportProgress(65);

        if (yPosition > 200) {
          doc.addPage();
          yPosition = 20;
        }

        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('Payment Methods Analysis', 20, yPosition);
        yPosition += 8;

        autoTable(doc, {
          startY: yPosition,
          head: [['Method', 'Amount', 'Orders', '% of Revenue']],
          body: reportData.paymentMethodFinancials.map((payment) => [
            payment.paymentMethod,
            formatCurrencyPDF(payment.totalAmount),
            payment.orderCount.toString(),
            `${((payment.totalAmount / reportData.summary.netRevenue) * 100).toFixed(1)}%`,
          ]),
          theme: 'striped',
          headStyles: {
            fillColor: [68, 114, 196],
            fontSize: 10,
            fontStyle: 'bold',
          },
          styles: { fontSize: 9 },
          columnStyles: {
            1: { halign: 'right', fontStyle: 'bold' },
            2: { halign: 'center' },
            3: { halign: 'center' },
          },
        });

        yPosition = doc.lastAutoTable.finalY + 15;
      }

      // Daily Breakdown (last 15 days)
      if (exportOptions.includeDailyBreakdown) {
        setExportProgress(80);

        if (yPosition > 200) {
          doc.addPage();
          yPosition = 20;
        }

        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('Daily Financial Breakdown (Last 15 Days)', 20, yPosition);
        yPosition += 8;

        const sortedDaily = [...reportData.dailyFinancials]
          .sort((a, b) => {
            const dateA = new Date(a.date.year, a.date.month - 1, a.date.day);
            const dateB = new Date(b.date.year, b.date.month - 1, b.date.day);
            return dateB - dateA;
          })
          .slice(0, 15);

        autoTable(doc, {
          startY: yPosition,
          head: [['Date', 'Gross Rev', 'Discount', 'Net Rev', 'Tax', 'Orders']],
          body: sortedDaily.map((day) => [
            `${String(day.date.day).padStart(2, '0')}-${String(day.date.month).padStart(2, '0')}-${day.date.year}`,
            formatCurrencyPDF(day.grossRevenue),
            formatCurrencyPDF(day.discount),
            formatCurrencyPDF(day.netRevenue),
            formatCurrencyPDF(day.tax),
            day.orders.toString(),
          ]),
          theme: 'striped',
          headStyles: {
            fillColor: [68, 114, 196],
            fontSize: 9,
            fontStyle: 'bold',
          },
          styles: { fontSize: 8 },
          columnStyles: {
            0: { cellWidth: 25 },
            1: { halign: 'right' },
            2: { halign: 'right' },
            3: { halign: 'right', fontStyle: 'bold' },
            4: { halign: 'right' },
            5: { halign: 'center' },
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
        doc.text(`${COMPANY_NAME} | Financial Report | Page ${i} of ${pageCount}`, 105, 290, { align: 'center' });
        doc.text(`Generated: ${format(new Date(), 'dd MMM yyyy HH:mm')}`, 105, 294, { align: 'center' });
      }

      setExportProgress(95);

      doc.save(`Financial_Report_${startDate}_to_${endDate}.pdf`);

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

  const sortedDailyFinancials = reportData
    ? [...reportData.dailyFinancials].sort((a, b) => {
      const dateA = new Date(a.date.year, a.date.month - 1, a.date.day);
      const dateB = new Date(b.date.year, b.date.month - 1, b.date.day);
      return dateB - dateA;
    })
    : [];

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
              <Button variant="primary" className="w-100" style={{ maxWidth: '150px' }} onClick={fetchFinancialReport} disabled={loading}>
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

          {/* Key Financial Metrics */}
          <Row className="mb-4">
            <Col lg={3} md={6} className="mb-3">
              <Card className="border-primary">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <div className="text-muted mb-1">Gross Revenue</div>
                      <div className="text-primary h4 mb-0">{formatCurrency(reportData.summary.grossRevenue)}</div>
                      <div className="text-muted mt-1" style={{fontSize: '12px'}}>Before deductions</div>
                    </div>
                    <div className="sh-5 sw-5 bg-primary rounded-xl d-flex justify-content-center align-items-center">
                      <CsLineIcons icon="wallet" className="text-white" />
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>

            <Col lg={3} md={6} className="mb-3">
              <Card className="border-success">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <div className="text-muted mb-1">Net Revenue</div>
                      <div className="text-success h4 mb-0">{formatCurrency(reportData.summary.netRevenue)}</div>
                      <div className="text-muted mt-1" style={{fontSize: '12px'}}>After deductions</div>
                    </div>
                    <div className="sh-5 sw-5 bg-success rounded-xl d-flex justify-content-center align-items-center">
                      <CsLineIcons icon="money" className="text-white" />
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>

            <Col lg={3} md={6} className="mb-3">
              <Card className="border-danger">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <div className="text-muted mb-1">Total Deductions</div>
                      <div className="text-danger h4 mb-0">{formatCurrency(reportData.summary.totalDiscount + reportData.summary.totalWaveOff)}</div>
                      <div className="text-muted mt-1" style={{fontSize: '12px'}}>{reportData.summary.discountPercentage}% of gross</div>
                    </div>
                    <div className="sh-5 sw-5 bg-danger rounded-xl d-flex justify-content-center align-items-center">
                      <CsLineIcons icon="tag" className="text-white" />
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>

            <Col lg={3} md={6} className="mb-3">
              <Card className="border-warning">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <div className="text-muted mb-1">Total Tax</div>
                      <div className="text-warning h4 mb-0">{formatCurrency(reportData.summary.totalTax)}</div>
                      <div className="text-muted mt-1" style={{fontSize: '12px'}}>{reportData.summary.taxPercentage}% of net revenue</div>
                    </div>
                    <div className="sh-5 sw-5 bg-warning rounded-xl d-flex justify-content-center align-items-center">
                      <CsLineIcons icon="dollar" className="text-white" />
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Revenue Flow Visualization */}
          <Card className="mb-4">
            <Card.Body>
              <Row>
                <Col md={6}>
                  <h5 className="mb-3">Revenue Flow Analysis</h5>
                  <div className="mb-3">
                    <div className="d-flex justify-content-between mb-2">
                      <span className="font-weight-bold">Gross Revenue</span>
                      <span className="font-weight-bold text-primary">{formatCurrency(reportData.summary.grossRevenue)}</span>
                    </div>
                    <ProgressBar now={100} variant="primary" />
                  </div>

                  <div className="mb-3 ms-3">
                    <div className="d-flex justify-content-between mb-2">
                      <span className="text-danger">- Discount</span>
                      <span className="text-danger">{formatCurrency(reportData.summary.totalDiscount)}</span>
                    </div>
                    <ProgressBar now={(reportData.summary.totalDiscount / reportData.summary.grossRevenue) * 100} variant="danger" />
                  </div>

                  <div className="mb-3 ms-3">
                    <div className="d-flex justify-content-between mb-2">
                      <span className="text-danger">- Wave Off</span>
                      <span className="text-danger">{formatCurrency(reportData.summary.totalWaveOff)}</span>
                    </div>
                    <ProgressBar now={(reportData.summary.totalWaveOff / reportData.summary.grossRevenue) * 100} variant="danger" />
                  </div>

                  <div className="mb-3">
                    <div className="d-flex justify-content-between mb-2">
                      <span className="font-weight-bold">Net Revenue</span>
                      <span className="font-weight-bold text-success">{formatCurrency(reportData.summary.netRevenue)}</span>
                    </div>
                    <ProgressBar now={(reportData.summary.netRevenue / reportData.summary.grossRevenue) * 100} variant="success" />
                  </div>

                  {/* Inventory Cost */}
                  <div className="mb-3 ms-3">
                    <div className="d-flex justify-content-between mb-2">
                      <span className="text-danger">- Inventory Cost (COGS)</span>
                      <span className="text-danger">
                        {formatCurrency(reportData.summary.inventoryCost)}
                      </span>
                    </div>
                    <ProgressBar
                      now={
                        reportData.summary.netRevenue > 0
                          ? (reportData.summary.inventoryCost / reportData.summary.netRevenue) * 100
                          : 0
                      }
                      variant="danger"
                    />
                  </div>

                  {/* Gross Profit */}
                  <div className="mb-3">
                    <div className="d-flex justify-content-between mb-2">
                      <span className="font-weight-bold">Gross Profit</span>
                      <span className="font-weight-bold text-success">
                        {formatCurrency(reportData.summary.grossProfit)}
                      </span>
                    </div>
                    <ProgressBar
                      now={
                        reportData.summary.netRevenue > 0
                          ? (reportData.summary.grossProfit / reportData.summary.netRevenue) * 100
                          : 0
                      }
                      variant="success"
                    />
                    <small className="text-muted">
                      Margin: {reportData.summary.grossProfitMargin}%
                    </small>
                  </div>

                </Col>

                <Col md={6}>
                  <div>
                    <div>
                      <h5 className="mb-3">Financial Health Indicators</h5>

                      <div className="mb-3">
                        <div className="d-flex justify-content-between mb-1">
                          <span className="font-weight-bold">Discount Ratio</span>
                          <Badge
                            bg={reportData.summary.discountPercentage > 15 ? 'danger' : reportData.summary.discountPercentage > 10 ? 'warning' : 'success'}
                          >
                            {reportData.summary.discountPercentage}%
                          </Badge>
                        </div>
                        <ProgressBar
                          now={reportData.summary.discountPercentage}
                          max={20}
                          variant={reportData.summary.discountPercentage > 15 ? 'danger' : reportData.summary.discountPercentage > 10 ? 'warning' : 'success'}
                        />
                        <small className="text-muted" style={{fontSize: '12px'}}>Ideal: Under 10%</small>
                      </div>

                      <div className="mb-3">
                        <div className="d-flex justify-content-between mb-1">
                          <span className="font-weight-bold">Tax Efficiency</span>
                          <Badge bg="info">{reportData.summary.taxPercentage}%</Badge>
                        </div>
                        <ProgressBar now={reportData.summary.taxPercentage} max={20} variant="info" />
                        <small className="text-muted" style={{fontSize: '12px'}}>Of net revenue</small>
                      </div>

                      <div>
                        <div className="d-flex justify-content-between mb-1">
                          <span className="font-weight-bold">Collection Rate</span>
                          <Badge bg="success">{((reportData.summary.totalPaid / reportData.summary.netRevenue) * 100).toFixed(1)}%</Badge>
                        </div>
                        <ProgressBar now={(reportData.summary.totalPaid / reportData.summary.netRevenue) * 100} variant="success" />
                        <small className="text-muted">Payment collected</small>
                      </div>
                    </div>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* Tax Breakdown */}
          <Row className="mb-4">
            <Col lg={4} md={6} className="mb-3">
              <Card className="h-100">
                <Card.Body>
                  <h6 className="mb-3">CGST (Central GST)</h6>
                  <div className="text-primary h3 mb-2">{formatCurrency(reportData.summary.cgstAmount)}</div>
                  <ProgressBar now={(reportData.summary.cgstAmount / reportData.summary.totalTax) * 100} variant="primary" className="mb-2" />
                  <div className="text-muted" style={{fontSize: '12px'}}>{((reportData.summary.cgstAmount / reportData.summary.totalTax) * 100).toFixed(1)}% of total tax</div>
                </Card.Body>
              </Card>
            </Col>

            <Col lg={4} md={6} className="mb-3">
              <Card className="h-100">
                <Card.Body>
                  <h6 className="mb-3">SGST (State GST)</h6>
                  <div className="text-success h3 mb-2">{formatCurrency(reportData.summary.sgstAmount)}</div>
                  <ProgressBar now={(reportData.summary.sgstAmount / reportData.summary.totalTax) * 100} variant="success" className="mb-2" />
                  <div className="text-muted" style={{fontSize: '12px'}}>{((reportData.summary.sgstAmount / reportData.summary.totalTax) * 100).toFixed(1)}% of total tax</div>
                </Card.Body>
              </Card>
            </Col>

            <Col lg={4} md={6} className="mb-3">
              <Card className="h-100">
                <Card.Body>
                  <h6 className="mb-3">VAT (Value Added Tax)</h6>
                  <div className="text-info h3 mb-2">{formatCurrency(reportData.summary.vatAmount)}</div>
                  <ProgressBar now={(reportData.summary.vatAmount / reportData.summary.totalTax) * 100} variant="info" className="mb-2" />
                  <div className="text-muted" style={{fontSize: '12px'}}>{((reportData.summary.vatAmount / reportData.summary.totalTax) * 100).toFixed(1)}% of total tax</div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Payment Method Analysis */}
          <Card className="mb-4">
            <Card.Body>
              <h5 className="mb-3">Payment Method Breakdown</h5>
              <Row>
                {reportData.paymentMethodFinancials.map((payment, idx) => (
                  <Col lg={4} md={6} key={idx} className="mb-3">
                    <Card className="border">
                      <Card.Body>
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <div>
                            <h6 className="mb-1">{payment.paymentMethod}</h6>
                            <div className="text-muted">{payment.orderCount} orders</div>
                          </div>
                          <div className="sh-4 sw-4 bg-gradient-light rounded-xl d-flex justify-content-center align-items-center">
                            <CsLineIcons
                              icon={payment.paymentMethod === 'Cash' ? 'money' : payment.paymentMethod === 'Card' ? 'credit-card' : 'mobile'}
                              className="text-white"
                              size="16"
                            />
                          </div>
                        </div>

                        <div className="mb-2">
                          <div className="d-flex justify-content-between mb-1" style={{fontSize: '12px'}}>
                            <span>Total Amount</span>
                            <span className="font-weight-bold text-primary">{formatCurrency(payment.totalAmount)}</span>
                          </div>
                          <ProgressBar now={(payment.totalAmount / reportData.summary.netRevenue) * 100} variant="primary" />
                        </div>

                        <div className="d-flex justify-content-between" style={{fontSize: '12px'}}>
                          <span>Paid Amount:</span>
                          <span className="font-weight-bold text-success">{formatCurrency(payment.paidAmount)}</span>
                        </div>
                        <div className="d-flex justify-content-between" style={{fontSize: '12px'}}>
                          <span>% of Total:</span>
                          <span className="font-weight-bold">{((payment.totalAmount / reportData.summary.netRevenue) * 100).toFixed(1)}%</span>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>
            </Card.Body>
          </Card>

          {/* Daily Financial Breakdown */}
          <Card className="mb-4">
            <Card.Body>
              <h5 className="mb-3">Daily Financial Breakdown</h5>
              <div className="table-responsive">
                <Table striped hover>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th className="text-end">Gross Revenue</th>
                      <th className="text-end">Discount</th>
                      <th className="text-end">Wave Off</th>
                      <th className="text-end">Net Revenue</th>
                      <th className="text-end">Tax</th>
                      <th className="text-end">Orders</th>
                      <th className="text-end">Avg Order</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedDailyFinancials.map((day, idx) => {
                      const avgOrder = day.orders > 0 ? day.netRevenue / day.orders : 0;

                      return (
                        <tr key={idx}>
                          <td className="font-weight-bold">{format(new Date(day.date.year, day.date.month - 1, day.date.day), 'dd-MM-yyyy')}</td>
                          <td className="text-end">{formatCurrency(day.grossRevenue)}</td>
                          <td className="text-end text-danger">{formatCurrency(day.discount)}</td>
                          <td className="text-end text-danger">{formatCurrency(day.waveOff)}</td>
                          <td className="text-end font-weight-bold text-success">{formatCurrency(day.netRevenue)}</td>
                          <td className="text-end text-warning">{formatCurrency(day.tax)}</td>
                          <td className="text-end">{day.orders}</td>
                          <td className="text-end">{formatCurrency(avgOrder)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="table-secondary">
                    <tr className="font-weight-bold">
                      <td>TOTAL</td>
                      <td className="text-end">{formatCurrency(reportData.summary.grossRevenue)}</td>
                      <td className="text-end text-danger">{formatCurrency(reportData.summary.totalDiscount)}</td>
                      <td className="text-end text-danger">{formatCurrency(reportData.summary.totalWaveOff)}</td>
                      <td className="text-end text-success">{formatCurrency(reportData.summary.netRevenue)}</td>
                      <td className="text-end text-warning">{formatCurrency(reportData.summary.totalTax)}</td>
                      <td className="text-end">{reportData.summary.totalOrders}</td>
                      <td className="text-end">{formatCurrency(reportData.summary.netRevenue / reportData.summary.totalOrders)}</td>
                    </tr>
                  </tfoot>
                </Table>
              </div>
            </Card.Body>
          </Card>

          {/* Financial Insights */}
          <Card className="mb-4">
            <Card.Body>
              <h5 className="mb-3">Financial Insights & Recommendations</h5>
              <Row>
                <Col md={6}>
                  <Alert variant={reportData.summary.discountPercentage > 15 ? 'danger' : reportData.summary.discountPercentage > 10 ? 'warning' : 'success'}>
                    <Alert.Heading className="h6">
                      <CsLineIcons icon="tag" className="me-2" />
                      Discount Analysis
                    </Alert.Heading>
                    <p className="mb-0" style={{ fontSize: '12px' }}>
                      Your discount rate is {reportData.summary.discountPercentage}%.
                      {reportData.summary.discountPercentage > 15 && ' This is high and may impact profitability. Consider reviewing discount policies.'}
                      {reportData.summary.discountPercentage > 10 &&
                        reportData.summary.discountPercentage <= 15 &&
                        ' This is moderate. Monitor to ensure profitability.'}
                      {reportData.summary.discountPercentage <= 10 && ' This is healthy and within acceptable range.'}
                    </p>
                  </Alert>
                </Col>

                <Col md={6}>
                  <Alert variant="info">
                    <Alert.Heading className="h6">
                      <CsLineIcons icon="dollar" className="me-2" />
                      Tax Compliance
                    </Alert.Heading>
                    <p className="mb-0" style={{ fontSize: '12px' }}>
                      Total tax collected: {formatCurrency(reportData.summary.totalTax)} ({reportData.summary.taxPercentage}% of net revenue). Ensure timely
                      filing and remittance of CGST ({formatCurrency(reportData.summary.cgstAmount)}), SGST ({formatCurrency(reportData.summary.sgstAmount)}),
                      and VAT ({formatCurrency(reportData.summary.vatAmount)}).
                    </p>
                  </Alert>
                </Col>

                <Col md={6}>
                  <Alert variant="success">
                    <Alert.Heading className="h6">
                      <CsLineIcons icon="trend-up" className="me-2" />
                      Revenue Health
                    </Alert.Heading>
                    <p className="mb-0" style={{ fontSize: '12px' }}>
                      Net revenue of {formatCurrency(reportData.summary.netRevenue)} from {reportData.summary.totalOrders} orders. Average order value:{' '}
                      {formatCurrency(reportData.summary.netRevenue / reportData.summary.totalOrders)}. Collection rate:{' '}
                      {((reportData.summary.totalPaid / reportData.summary.netRevenue) * 100).toFixed(1)}%.
                    </p>
                  </Alert>
                </Col>

                <Col md={6}>
                  <Alert variant="warning">
                    <Alert.Heading className="h6">
                      <CsLineIcons icon="shield" className="me-2" />
                      Payment Methods
                    </Alert.Heading>
                    <p className="mb-0" style={{ fontSize: '12px' }}>
                      {reportData.paymentMethodFinancials.length} payment methods in use. Most used: {reportData.paymentMethodFinancials[0]?.paymentMethod}(
                      {((reportData.paymentMethodFinancials[0]?.totalAmount / reportData.summary.netRevenue) * 100).toFixed(1)}% of revenue). Diversify payment
                      options for customer convenience.
                    </p>
                  </Alert>
                </Col>
              </Row>
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
              label="Financial Summary & Key Metrics"
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
              id="includeDailyBreakdown"
              label="Daily Financial Breakdown"
              checked={exportOptions.includeDailyBreakdown}
              onChange={(e) =>
                setExportOptions({
                  ...exportOptions,
                  includeDailyBreakdown: e.target.checked,
                })
              }
              className="mb-3"
            />

            <Form.Check
              type="checkbox"
              id="includeTaxBreakdown"
              label="Tax Breakdown (CGST, SGST, VAT)"
              checked={exportOptions.includeTaxBreakdown}
              onChange={(e) =>
                setExportOptions({
                  ...exportOptions,
                  includeTaxBreakdown: e.target.checked,
                })
              }
              className="mb-3"
            />

            <Form.Check
              type="checkbox"
              id="includePaymentMethods"
              label="Payment Method Analysis"
              checked={exportOptions.includePaymentMethods}
              onChange={(e) =>
                setExportOptions({
                  ...exportOptions,
                  includePaymentMethods: e.target.checked,
                })
              }
              className="mb-3"
            />

            <Form.Check
              type="checkbox"
              id="includeFinancialInsights"
              label="Financial Health Indicators & Insights"
              checked={exportOptions.includeFinancialInsights}
              onChange={(e) =>
                setExportOptions({
                  ...exportOptions,
                  includeFinancialInsights: e.target.checked,
                })
              }
              className="mb-3"
            />

            <Form.Check
              type="checkbox"
              id="includeCharts"
              label="Include Visual Charts & Indicators"
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
            <strong>Tip:</strong> Include all sections for comprehensive financial reporting that meets accounting and tax compliance requirements. Daily
            breakdown is essential for audit trails.
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

export default FinancialReport;
