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
  const brandColor = '#23b3f4';
  const brandBg = 'rgba(35, 179, 244, 0.08)';
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

  const { currentUser, activePlans } = useContext(AuthContext);

  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportType, setExportType] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const [showExportModal, setShowExportModal] = useState(false);
  const [exportOptions, setExportOptions] = useState({
    includeSummary: true,
    includeDailyBreakdown: true,
    includeWeeklyBreakdown: true,
    includeTaxBreakdown: true,
    includePaymentMethods: true,
    includeFinancialInsights: true,
    includeInventoryPurchases: true,
    includeExpensesWastage: true,
  });

  const [startDate, setStartDate] = useState(format(new Date().setMonth(new Date().getMonth() - 1), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [viewMode, setViewMode] = useState('daily');
  const [datePreset, setDatePreset] = useState('last_30_days');

  const weeklyFinancials = useMemo(() => {
    if (!reportData?.dailyFinancials) return [];
    const weeklyMap = {};
    reportData.dailyFinancials.forEach((day) => {
      const d = new Date(day.date.year, day.date.month - 1, day.date.day);
      const dayOfWeek = d.getDay();
      const diff = d.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
      const monday = new Date(d.setDate(diff));
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);

      const weekKey = format(monday, 'yyyy-MM-dd');
      const weekLabel = `${format(monday, 'dd MMM')} - ${format(sunday, 'dd MMM yyyy')}`;

      if (!weeklyMap[weekKey]) {
        weeklyMap[weekKey] = {
          label: weekLabel,
          keyDate: monday,
          grossRevenue: 0,
          discount: 0,
          waveOff: 0,
          netRevenue: 0,
          tax: 0,
          orders: 0,
        };
      }
      weeklyMap[weekKey].grossRevenue += day.grossRevenue || 0;
      weeklyMap[weekKey].discount += day.discount || 0;
      weeklyMap[weekKey].waveOff += day.waveOff || 0;
      weeklyMap[weekKey].netRevenue += day.netRevenue || 0;
      weeklyMap[weekKey].tax += day.tax || 0;
      weeklyMap[weekKey].orders += day.orders || 0;
    });

    return Object.values(weeklyMap).sort((a, b) => b.keyDate - a.keyDate);
  }, [reportData?.dailyFinancials]);

  const handlePeriodChange = (preset) => {
    const today = new Date();
    let start = new Date();
    let end = new Date();

    switch (preset) {
      case 'this_week': {
        const day = today.getDay();
        const diff = today.getDate() - day + (day === 0 ? -6 : 1);
        start = new Date(today.setDate(diff));
        end = new Date();
        break;
      }
      case 'last_week': {
        const today2 = new Date();
        const day2 = today2.getDay();
        const diffToMonday = today2.getDate() - day2 + (day2 === 0 ? -6 : 1);
        const lastMonday = new Date(today2.setDate(diffToMonday - 7));
        const lastSunday = new Date(lastMonday);
        lastSunday.setDate(lastMonday.getDate() + 6);
        start = lastMonday;
        end = lastSunday;
        break;
      }
      case 'this_month':
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        end = new Date();
        break;
      case 'last_month':
        start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        end = new Date(today.getFullYear(), today.getMonth(), 0);
        break;
      case 'last_30_days':
        start = new Date(today.setDate(today.getDate() - 30));
        end = new Date();
        break;
      case 'last_90_days':
        start = new Date(today.setDate(today.getDate() - 90));
        end = new Date();
        break;
      case 'last_180_days':
        start = new Date(today.setDate(today.getDate() - 180));
        end = new Date();
        break;
      case 'last_365_days':
        start = new Date(today.setDate(today.getDate() - 365));
        end = new Date();
        break;
      default:
        return;
    }

    const formattedStart = format(start, 'yyyy-MM-dd');
    const formattedEnd = format(end, 'yyyy-MM-dd');
    setStartDate(formattedStart);
    setEndDate(formattedEnd);

    setLoading(true);
    setError(null);
    axios.get(`${API_BASE}/statistics/financial`, {
      ...getHeaders(),
      params: { period: 'custom', start_date: formattedStart, end_date: formattedEnd }
    }).then(res => {
      setReportData(res.data);
    }).catch(err => {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to load financial report');
    }).finally(() => {
      setLoading(false);
    });
  };

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

  const showSuccessToast = (message) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const fetchFinancialReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { period: 'custom', start_date: startDate, end_date: endDate };
      const response = await axios.get(`${API_BASE}/statistics/financial`, { ...getHeaders(), params });
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

  const sortedDailyFinancials = reportData
    ? [...reportData.dailyFinancials].sort((a, b) => {
      const dateA = new Date(a.date.year, a.date.month - 1, a.date.day);
      const dateB = new Date(b.date.year, b.date.month - 1, b.date.day);
      return dateB - dateA;
    })
    : [];

  const exportToExcel = async () => {
    if (!reportData) return;
    setExporting(true);
    setExportProgress(10);
    setExportType('Excel');
    try {
      const wb = XLSX.utils.book_new();
      const allData = [];

      allData.push(['FINANCIAL AUDIT REPORT']);
      allData.push(['Company:', COMPANY_NAME]);
      allData.push(['Period:', `${format(new Date(startDate), 'dd MMM yyyy')} to ${format(new Date(endDate), 'dd MMM yyyy')}`]);
      allData.push(['Generated:', format(new Date(), 'dd MMM yyyy hh:mm a')]);
      allData.push([]);

      if (exportOptions.includeSummary) {
        setExportProgress(20);
        allData.push(['FINANCIAL SUMMARY']);
        allData.push(['Metric', 'Value', 'Note']);
        allData.push(['Gross Sales', reportData.summary.grossRevenue, 'Total before discounts']);
        allData.push(['Net Sales', reportData.summary.netRevenue, 'Total after discounts']);
        allData.push(['Total Discounts', reportData.summary.totalDiscount + reportData.summary.totalWaveOff, `${reportData.summary.discountPercentage}% of gross sales`]);
        allData.push(['Total Taxes', reportData.summary.totalTax, `${reportData.summary.taxPercentage}% effective rate`]);
        const collectionRateNum = reportData.summary.netRevenue > 0 ? ((reportData.summary.totalPaid / reportData.summary.netRevenue) * 100).toFixed(1) : '0.0';
        allData.push(['Total Income Collected', reportData.summary.totalPaid, `Collected Rate: ${collectionRateNum}%`]);
        allData.push(['Inventory Purchases (COGS)', reportData.summary.inventoryCost || 0, 'Total material cost']);
        allData.push(['Net Operating Profit', reportData.summary.grossProfit || 0, `Margin: ${reportData.summary.grossProfitMargin || 0}%`]);
        allData.push([]);
        allData.push([]);
      }

      if (exportOptions.includeDailyBreakdown && sortedDailyFinancials?.length > 0) {
        setExportProgress(40);
        allData.push(['DAILY SALES BREAKDOWN']);
        allData.push(['Date', 'Gross Sales', 'Discounts', 'Net Sales', 'Total Taxes', 'Orders']);
        sortedDailyFinancials.forEach(day => {
          allData.push([`${day.date.day}-${day.date.month}-${day.date.year}`, day.grossRevenue, day.discount + day.waveOff, day.netRevenue, day.tax, day.orders]);
        });
        allData.push(['Total', reportData.summary.grossRevenue, reportData.summary.totalDiscount + reportData.summary.totalWaveOff, reportData.summary.netRevenue, reportData.summary.totalTax, reportData.summary.totalOrders]);
        allData.push([]);
        allData.push([]);
      }

      if (exportOptions.includeWeeklyBreakdown && sortedDailyFinancials?.length > 0) {
        setExportProgress(45);
        allData.push(['WEEKLY SALES BREAKDOWN']);
        allData.push(['Week Period', 'Gross Sales', 'Discounts', 'Net Sales', 'Total Taxes', 'Orders']);
        weeklyFinancials.forEach(week => {
          allData.push([week.label, week.grossRevenue, week.discount + week.waveOff, week.netRevenue, week.tax, week.orders]);
        });
        allData.push(['Total', reportData.summary.grossRevenue, reportData.summary.totalDiscount + reportData.summary.totalWaveOff, reportData.summary.netRevenue, reportData.summary.totalTax, reportData.summary.totalOrders]);
        allData.push([]);
        allData.push([]);
      }

      if (exportOptions.includeInventoryPurchases && reportData.inventoryPurchases?.length > 0) {
        setExportProgress(50);
        allData.push(['INVENTORY PURCHASES BREAKDOWN']);
        allData.push(['Date', 'Bill Number', 'Vendor', 'Category', 'Total Amount', 'Status']);
        reportData.inventoryPurchases.forEach(inv => {
          allData.push([inv.bill_date ? format(new Date(inv.bill_date), 'dd-MM-yyyy') : format(new Date(inv.request_date), 'dd-MM-yyyy'), inv.bill_number || '—', inv.vendor_name || '—', inv.category || '—', inv.total_amount || 0, inv.status || 'Completed']);
        });
        allData.push([]);
        allData.push([]);
      }

      if (exportOptions.includeExpensesWastage && reportData.wastageLogs?.length > 0) {
        setExportProgress(60);
        allData.push(['WASTAGE & EXPENSES BREAKDOWN']);
        allData.push(['Date', 'Item Name', 'Wastage Type', 'Quantity', 'Reason']);
        reportData.wastageLogs.forEach(w => {
          allData.push([format(new Date(w.date), 'dd-MM-yyyy'), w.item_name || '—', w.wastage_type || '—', `${w.quantity || 0} ${w.unit || ''}`, w.reason || '—']);
        });
        allData.push([]);
        allData.push([]);
      }

      if (exportOptions.includeTaxBreakdown) {
        setExportProgress(70);
        allData.push(['TAX BREAKDOWN']);
        allData.push(['Tax Type', 'Amount']);
        allData.push(['CGST / SGST', reportData.summary.cgstAmount + reportData.summary.sgstAmount]);
        allData.push(['VAT', reportData.summary.vatAmount]);
        allData.push(['Total Taxes', reportData.summary.totalTax]);
        allData.push([]);
        allData.push([]);
      }

      if (exportOptions.includePaymentMethods && reportData.paymentMethodFinancials?.length > 0) {
        setExportProgress(80);
        allData.push(['PAYMENT METHOD BREAKDOWN']);
        allData.push(['Payment Method', 'Orders', 'Net Sales', 'Collected Amount']);
        reportData.paymentMethodFinancials.forEach(payment => {
          allData.push([payment.paymentMethod, payment.orderCount, payment.totalAmount, payment.paidAmount]);
        });
        allData.push([]);
        allData.push([]);
      }

      if (exportOptions.includeFinancialInsights) {
        setExportProgress(90);
        allData.push(['KEY BUSINESS ALERTS']);
        allData.push(['Alert', 'Detail']);
        allData.push(['Discount Policy', `Rate: ${reportData.summary.discountPercentage}%. ${reportData.summary.discountPercentage > 15 ? 'Alert: High discount rate.' : 'Healthy discount rate.'}`]);
        allData.push(['Taxes Collected', `Total: ${reportData.summary.totalTax}. Ready for tax filing.`]);
        allData.push(['Sales Performance', `Net Sales: ${reportData.summary.netRevenue}. Avg Order: ${reportData.summary.totalOrders > 0 ? (reportData.summary.netRevenue / reportData.summary.totalOrders).toFixed(2) : '0.00'}.`]);
        allData.push(['Collection Rate', `${reportData.summary.netRevenue > 0 ? ((reportData.summary.totalPaid / reportData.summary.netRevenue) * 100).toFixed(1) : '0.0'}%`]);
        allData.push([]);
        allData.push([]);
      }

      const ws = XLSX.utils.aoa_to_sheet(allData);
      ws['!cols'] = [{ wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];
      XLSX.utils.book_append_sheet(wb, ws, 'Financial Report');

      XLSX.writeFile(wb, `Financial_Report_${startDate}_to_${endDate}.xlsx`);
      showSuccessToast('Excel report exported successfully!');
    } catch (err) {
      console.error(err);
      showSuccessToast('Error exporting Excel report');
    } finally {
      setExporting(false);
      setExportProgress(0);
      setExportType('');
    }
  };

  const exportToPDF = async () => {
    if (!reportData) return;
    setExporting(true);
    setExportProgress(10);
    setExportType('PDF');
    try {
      const doc = new jsPDF();

      doc.setFontSize(16);
      doc.text('Financial Audit Report', 105, 15, { align: 'center' });
      doc.setFontSize(10);
      doc.text(COMPANY_NAME, 105, 22, { align: 'center' });
      doc.text(`Period: ${format(new Date(startDate), 'dd MMM yyyy')} to ${format(new Date(endDate), 'dd MMM yyyy')}`, 105, 28, { align: 'center' });

      let currentY = 35;

      if (exportOptions.includeSummary) {
        setExportProgress(20);
        doc.setFontSize(12);
        doc.text('Financial Summary', 14, currentY);
        autoTable(doc, {
          startY: currentY + 5,
          head: [['Metric', 'Value', 'Note']],
          body: [
            ['Gross Sales', formatCurrencyPDF(reportData.summary.grossRevenue), 'Total before discounts'],
            ['Net Sales', formatCurrencyPDF(reportData.summary.netRevenue), 'Total after discounts'],
            ['Total Discounts', formatCurrencyPDF(reportData.summary.totalDiscount + reportData.summary.totalWaveOff), `${reportData.summary.discountPercentage}% of gross sales`],
            ['Total Taxes', formatCurrencyPDF(reportData.summary.totalTax), `${reportData.summary.taxPercentage}% effective rate`],
            ['Total Income Collected', formatCurrencyPDF(reportData.summary.totalPaid), `Collected Rate: ${reportData.summary.netRevenue > 0 ? ((reportData.summary.totalPaid / reportData.summary.netRevenue) * 100).toFixed(1) : '0.0'}%`],
            ['Inventory Purchases (COGS)', formatCurrencyPDF(reportData.summary.inventoryCost || 0), 'Total material cost'],
            ['Net Operating Profit', formatCurrencyPDF(reportData.summary.grossProfit || 0), `Margin: ${reportData.summary.grossProfitMargin || 0}%`]
          ],
          theme: 'grid',
          headStyles: { fillColor: [35, 179, 244] },
          margin: { bottom: 15 }
        });
        currentY = doc.lastAutoTable.finalY + 15;
      }

      if (exportOptions.includeTaxBreakdown) {
        setExportProgress(35);
        if (currentY > 250) { doc.addPage(); currentY = 20; }
        doc.setFontSize(12);
        doc.text('Tax Breakdown', 14, currentY);
        autoTable(doc, {
          startY: currentY + 5,
          head: [['Tax Type', 'Amount']],
          body: [
            ['CGST / SGST', formatCurrencyPDF(reportData.summary.cgstAmount + reportData.summary.sgstAmount)],
            ['VAT', formatCurrencyPDF(reportData.summary.vatAmount)],
            ['Total Taxes', formatCurrencyPDF(reportData.summary.totalTax)]
          ],
          theme: 'grid',
          headStyles: { fillColor: [35, 179, 244] },
          margin: { bottom: 15 }
        });
        currentY = doc.lastAutoTable.finalY + 15;
      }

      if (exportOptions.includePaymentMethods && reportData.paymentMethodFinancials?.length > 0) {
        setExportProgress(50);
        if (currentY > 250) { doc.addPage(); currentY = 20; }
        doc.setFontSize(12);
        doc.text('Payment Method Breakdown', 14, currentY);
        autoTable(doc, {
          startY: currentY + 5,
          head: [['Payment Method', 'Orders', 'Net Sales', 'Collected Amount']],
          body: reportData.paymentMethodFinancials.map(payment => [
            payment.paymentMethod,
            payment.orderCount.toString(),
            formatCurrencyPDF(payment.totalAmount),
            formatCurrencyPDF(payment.paidAmount)
          ]),
          theme: 'grid',
          headStyles: { fillColor: [35, 179, 244] },
          margin: { bottom: 15 }
        });
        currentY = doc.lastAutoTable.finalY + 15;
      }

      if (exportOptions.includeInventoryPurchases && reportData.inventoryPurchases?.length > 0) {
        setExportProgress(60);
        if (currentY > 250) { doc.addPage(); currentY = 20; }
        doc.setFontSize(12);
        doc.text('Inventory Purchases Breakdown', 14, currentY);
        autoTable(doc, {
          startY: currentY + 5,
          head: [['Date', 'Bill Number', 'Vendor', 'Category', 'Total Amount', 'Status']],
          body: reportData.inventoryPurchases.map(inv => [
            inv.bill_date ? format(new Date(inv.bill_date), 'dd-MM-yyyy') : format(new Date(inv.request_date), 'dd-MM-yyyy'),
            inv.bill_number || '—',
            inv.vendor_name || '—',
            inv.category || '—',
            formatCurrencyPDF(inv.total_amount || 0),
            inv.status || 'Completed'
          ]),
          theme: 'grid',
          headStyles: { fillColor: [35, 179, 244] },
          margin: { bottom: 15 }
        });
        currentY = doc.lastAutoTable.finalY + 15;
      }

      if (exportOptions.includeExpensesWastage && reportData.wastageLogs?.length > 0) {
        setExportProgress(65);
        if (currentY > 250) { doc.addPage(); currentY = 20; }
        doc.setFontSize(12);
        doc.text('Wastage & Expenses Breakdown', 14, currentY);
        autoTable(doc, {
          startY: currentY + 5,
          head: [['Date', 'Item Name', 'Wastage Type', 'Quantity', 'Reason']],
          body: reportData.wastageLogs.map(w => [
            format(new Date(w.date), 'dd-MM-yyyy'),
            w.item_name || '—',
            w.wastage_type || '—',
            `${w.quantity || 0} ${w.unit || ''}`,
            w.reason || '—'
          ]),
          theme: 'grid',
          headStyles: { fillColor: [35, 179, 244] },
          margin: { bottom: 15 }
        });
        currentY = doc.lastAutoTable.finalY + 15;
      }

      if (exportOptions.includeDailyBreakdown && sortedDailyFinancials?.length > 0) {
        setExportProgress(70);
        if (currentY > 250) { doc.addPage(); currentY = 20; }
        doc.setFontSize(12);
        doc.text('Daily Sales Breakdown', 14, currentY);

        const dailyBody = sortedDailyFinancials.map(day => [
          `${day.date.day}-${day.date.month}-${day.date.year}`,
          formatCurrencyPDF(day.grossRevenue),
          formatCurrencyPDF(day.discount + day.waveOff),
          formatCurrencyPDF(day.netRevenue),
          formatCurrencyPDF(day.tax),
          day.orders.toString()
        ]);

        dailyBody.push([
          'Total',
          formatCurrencyPDF(reportData.summary.grossRevenue),
          formatCurrencyPDF(reportData.summary.totalDiscount + reportData.summary.totalWaveOff),
          formatCurrencyPDF(reportData.summary.netRevenue),
          formatCurrencyPDF(reportData.summary.totalTax),
          reportData.summary.totalOrders.toString()
        ]);

        autoTable(doc, {
          startY: currentY + 5,
          head: [['Date', 'Gross Sales', 'Discounts', 'Net Sales', 'Total Taxes', 'Orders']],
          body: dailyBody,
          theme: 'grid',
          headStyles: { fillColor: [35, 179, 244] },
          margin: { bottom: 15 },
          didParseCell(data) {
            if (data.row.index === dailyBody.length - 1) {
              data.cell.styles.fontStyle = 'bold';
              data.cell.styles.fillColor = [240, 240, 240];
            }
          }
        });
        currentY = doc.lastAutoTable.finalY + 15;
      }

      if (exportOptions.includeWeeklyBreakdown && sortedDailyFinancials?.length > 0) {
        setExportProgress(75);
        if (currentY > 250) { doc.addPage(); currentY = 20; }
        doc.setFontSize(12);
        doc.text('Weekly Sales Breakdown', 14, currentY);

        const weeklyBody = weeklyFinancials.map(week => [
          week.label,
          formatCurrencyPDF(week.grossRevenue),
          formatCurrencyPDF(week.discount + week.waveOff),
          formatCurrencyPDF(week.netRevenue),
          formatCurrencyPDF(week.tax),
          week.orders.toString()
        ]);

        weeklyBody.push([
          'Total',
          formatCurrencyPDF(reportData.summary.grossRevenue),
          formatCurrencyPDF(reportData.summary.totalDiscount + reportData.summary.totalWaveOff),
          formatCurrencyPDF(reportData.summary.netRevenue),
          formatCurrencyPDF(reportData.summary.totalTax),
          reportData.summary.totalOrders.toString()
        ]);

        autoTable(doc, {
          startY: currentY + 5,
          head: [['Week Period', 'Gross Sales', 'Discounts', 'Net Sales', 'Total Taxes', 'Orders']],
          body: weeklyBody,
          theme: 'grid',
          headStyles: { fillColor: [35, 179, 244] },
          margin: { bottom: 15 },
          didParseCell(data) {
            if (data.row.index === weeklyBody.length - 1) {
              data.cell.styles.fontStyle = 'bold';
              data.cell.styles.fillColor = [240, 240, 240];
            }
          }
        });
        currentY = doc.lastAutoTable.finalY + 15;
      }

      if (exportOptions.includeFinancialInsights) {
        setExportProgress(90);
        if (currentY > 250) { doc.addPage(); currentY = 20; }
        doc.setFontSize(12);
        doc.text('Key Business Alerts', 14, currentY);
        autoTable(doc, {
          startY: currentY + 5,
          head: [['Alert', 'Detail']],
          body: [
            ['Discount Policy', `Rate: ${reportData.summary.discountPercentage}%. ${reportData.summary.discountPercentage > 15 ? 'Alert: High discount rate.' : 'Healthy discount rate.'}`],
            ['Taxes Collected', `Total: ${formatCurrencyPDF(reportData.summary.totalTax)}. Ready for tax filing.`],
            ['Sales Performance', `Net Sales: ${formatCurrencyPDF(reportData.summary.netRevenue)}. Avg Order: ${formatCurrencyPDF(reportData.summary.netRevenue / reportData.summary.totalOrders)}.`],
            ['Collection Rate', `${((reportData.summary.totalPaid / reportData.summary.netRevenue) * 100).toFixed(1)}%`]
          ],
          theme: 'grid',
          headStyles: { fillColor: [35, 179, 244] },
          margin: { bottom: 15 }
        });
      }

      doc.save(`Financial_Report_${startDate}_to_${endDate}.pdf`);
      showSuccessToast('PDF report exported successfully!');
    } catch (err) {
      console.error(err);
      showSuccessToast('Error exporting PDF report');
    } finally {
      setExporting(false);
      setExportProgress(0);
      setExportType('');
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
      <div className="container-fluid qsr-page-container">
        <div className="qsr-page-title-container no-print">
          <Row className="g-0 align-items-center">
            <Col xs="auto" className="me-auto">
              <h1 className="qsr-page-title">{title}</h1>
              <BreadcrumbList items={breadcrumbs} />
            </Col>
          </Row>
        </div>

        {/* Audit Filters */}
        {['QSR', 'Café', 'Fine Dine', 'Cloud', 'Chain'].includes(currentUser?.purchasedPlan) && (
          <Card className="financial-report-interactive-card financial-report-filter-card border-0 mb-4 no-print shadow-sm">
            <Card.Body className="p-4">
              <div className="financial-report-card-title-container">
                <h2 className="small-title mb-0" style={{ color: brandColor, fontWeight: '800' }}>Report Date Filters</h2>
                <CsLineIcons icon="filter" size="18" style={{ color: brandColor }} />
              </div>
              <Row className="g-3 align-items-end mt-1">
                <Col xs={12} md={3}>
                  <Form.Label className="financial-report-stat-label mb-2">Preset Period</Form.Label>
                  <Form.Select 
                    value={datePreset} 
                    onChange={(e) => {
                      setDatePreset(e.target.value);
                      handlePeriodChange(e.target.value);
                    }}
                  >
                    <option value="this_week">This Week</option>
                    <option value="last_week">Last Week</option>
                    <option value="this_month">This Month</option>
                    <option value="last_month">Last Month</option>
                    <option value="last_30_days">Last 30 Days</option>
                    <option value="last_90_days">Last 90 Days</option>
                    <option value="last_180_days">Last 180 Days</option>
                    <option value="last_365_days">Last 365 Days (1 Year)</option>
                    <option value="custom">Custom Range</option>
                  </Form.Select>
                </Col>
                <Col xs={12} md={3}>
                  <Form.Label className="financial-report-stat-label mb-2">Start Date</Form.Label>
                  <Form.Control type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); setDatePreset('custom'); }} />
                </Col>
                <Col xs={12} md={3}>
                  <Form.Label className="financial-report-stat-label mb-2">End Date</Form.Label>
                  <Form.Control type="date" value={endDate} onChange={(e) => { setEndDate(e.target.value); setDatePreset('custom'); }} />
                </Col>
                <Col xs={12} md={3}>
                  <Button className="financial-report-custom-btn-outline w-100" onClick={fetchFinancialReport} disabled={loading}>
                    <CsLineIcons icon="sync" className={`me-2 ${loading ? 'spin' : ''}`} size="15" />
                    {loading ? 'Processing...' : 'Generate'}
                  </Button>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        )}

        {/* Action Bar */}
        <Card className="financial-report-interactive-card border-0 mb-4 no-print shadow-sm">
          <Card.Body className="p-4 d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
            <div className="d-flex gap-3 align-items-center">
              <Button variant="outline-success" className="financial-report-custom-btn-outline border-success text-success px-4" onClick={() => handleExportClick('Excel')} disabled={exporting}>
                <CsLineIcons icon="file-text" className="me-2" size="15" /> Excel
              </Button>
              <Button variant="outline-danger" className="financial-report-custom-btn-outline border-danger text-danger px-4" onClick={() => handleExportClick('PDF')} disabled={exporting}>
                <CsLineIcons icon="file-text" className="me-2" size="15" /> PDF
              </Button>
            </div>
            {exporting && (
              <div className="flex-grow-1 ms-md-4 mt-3 mt-md-0">
                <div className="d-flex align-items-center mb-2">
                  <Spinner animation="border" size="sm" className="me-2" style={{ color: brandColor }} />
                  <span className="smaller fw-bold text-muted">Generating {exportType}... {exportProgress}%</span>
                </div>
                <ProgressBar now={exportProgress} className="progress-sm" variant="info" style={{ height: '6px' }} />
              </div>
            )}
          </Card.Body>
        </Card>

        {error && <Alert variant="danger" className="mb-4 financial-report-interactive-card border-0">{error}</Alert>}

        {reportData && (
          <>
            {/* Key Financial Metrics */}
            <Row className="g-3 mb-4">
              {[
                { label: 'Gross Sales', value: reportData.summary.grossRevenue, note: 'Total before discounts', icon: 'wallet', color: brandColor, bg: brandBg, border: brandColor },
                { label: 'Net Sales', value: reportData.summary.netRevenue, note: 'Total after discounts', icon: 'money', color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)', border: '#10b981' },
                { label: 'Total Discounts', value: reportData.summary.totalDiscount + reportData.summary.totalWaveOff, note: `${reportData.summary.discountPercentage}% of gross sales`, icon: 'tag', color: '#f43f5e', bg: 'rgba(244, 63, 94, 0.1)', border: '#f43f5e' },
                { label: 'Total Taxes', value: reportData.summary.totalTax, note: `${reportData.summary.taxPercentage}% effective rate`, icon: 'dollar', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)', border: '#f59e0b' }
              ].map((stat, idx) => (
                <Col xl="3" md="6" key={idx}>
                  <Card className="financial-report-interactive-card border-0 h-100 shadow-sm" style={{ borderTop: `4px solid ${stat.border}` }}>
                    <Card.Body className="p-4 financial-report-stat-card-inner">
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <div className="financial-report-stat-label mb-2">{stat.label}</div>
                          <div className="financial-report-stat-value" style={{ color: stat.color }}>{formatCurrency(stat.value)}</div>
                          <div className="smaller text-muted fw-bold mt-1">{stat.note}</div>
                        </div>
                        <div className="sw-6 sh-6 rounded-circle d-flex justify-content-center align-items-center" style={{ backgroundColor: stat.bg }}>
                          <CsLineIcons icon={stat.icon} size="24" style={{ color: stat.color }} />
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>

            {/* Inventory & Expense Summary Metrics */}
            <Row className="g-3 mb-4">
              {[
                { label: 'Inventory Purchases (COGS)', value: reportData.summary.inventoryCost || 0, note: 'Total raw material bills', icon: 'box', color: '#f97316', bg: 'rgba(249, 115, 22, 0.1)', border: '#f97316' },
                { label: 'Wastage & Expense Logs', value: reportData.summary.totalWastageCount || 0, isCount: true, note: 'Recorded loss & expense entries', icon: 'bin', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)', border: '#ef4444' },
                { label: 'Net Operating Profit', value: reportData.summary.grossProfit || 0, note: `Margin: ${reportData.summary.grossProfitMargin || 0}% after inventory`, icon: 'trend-up', color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)', border: '#10b981' }
              ].map((stat, idx) => (
                <Col xl="4" md="6" key={idx}>
                  <Card className="financial-report-interactive-card border-0 h-100 shadow-sm" style={{ borderTop: `4px solid ${stat.border}` }}>
                    <Card.Body className="p-4 financial-report-stat-card-inner">
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <div className="financial-report-stat-label mb-2">{stat.label}</div>
                          <div className="financial-report-stat-value" style={{ color: stat.color }}>{stat.isCount ? stat.value : formatCurrency(stat.value)}</div>
                          <div className="smaller text-muted fw-bold mt-1">{stat.note}</div>
                        </div>
                        <div className="sw-6 sh-6 rounded-circle d-flex justify-content-center align-items-center" style={{ backgroundColor: stat.bg }}>
                          <CsLineIcons icon={stat.icon} size="24" style={{ color: stat.color }} />
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>

            {/* Revenue Flow & Health Indicators */}
            <Row className="g-3 mb-4">
              <Col lg={7}>
                <Card className="financial-report-interactive-card border-0 shadow-sm h-100">
                  <Card.Body className="p-4">
                    <div className="financial-report-card-title-container">
                      <h2 className="small-title mb-0" style={{ color: brandColor, fontWeight: '800' }}>Sales Breakdown</h2>
                      <CsLineIcons icon="activity" size="18" style={{ color: brandColor }} />
                    </div>
                    <div className="mb-4 mt-3">
                      <div className="d-flex justify-content-between mb-2 smaller fw-bold">
                        <span className="text-muted">Gross Sales</span>
                        <span className="text-primary">{formatCurrency(reportData.summary.grossRevenue)}</span>
                      </div>
                      <ProgressBar now={100} variant="primary" className="progress-pill" style={{ height: '8px' }} />
                    </div>
                    <div className="mb-4 ms-4">
                      <div className="d-flex justify-content-between mb-2 smaller text-danger fw-bold">
                        <span>- Discounts & Offers</span>
                        <span>{formatCurrency(reportData.summary.totalDiscount + reportData.summary.totalWaveOff)}</span>
                      </div>
                      <ProgressBar now={((reportData.summary.totalDiscount + reportData.summary.totalWaveOff) / reportData.summary.grossRevenue) * 100} variant="danger" className="progress-pill" style={{ height: '6px' }} />
                    </div>
                    <div className="mb-4">
                      <div className="d-flex justify-content-between mb-2 fw-bold">
                        <span className="text-muted">Net Sales (After Discounts)</span>
                        <span className="text-success">{formatCurrency(reportData.summary.netRevenue)}</span>
                      </div>
                      <ProgressBar now={(reportData.summary.netRevenue / reportData.summary.grossRevenue) * 100} variant="success" className="progress-pill" style={{ height: '8px' }} />
                    </div>
                    <div className="p-4 rounded-3 mt-4" style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.1)' }}>
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <div className="financial-report-stat-label mb-1 text-success">Total Income Collected</div>
                          <div className="financial-report-stat-value text-success h3 mb-0" style={{ fontSize: '1.6rem' }}>{formatCurrency(reportData.summary.totalPaid)}</div>
                        </div>
                        <Badge bg="success" className="rounded-pill px-3 py-2 fw-bold" style={{ fontSize: '0.65rem' }}>
                          COLLECTED: {reportData.summary.netRevenue > 0 ? ((reportData.summary.totalPaid / reportData.summary.netRevenue) * 100).toFixed(1) : '0.0'}%
                        </Badge>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
              <Col lg={5}>
                <Card className="financial-report-interactive-card border-0 shadow-sm h-100">
                  <Card.Body className="p-4">
                    <div className="financial-report-card-title-container">
                      <h2 className="small-title mb-0" style={{ color: brandColor, fontWeight: '800' }}>Business Health Indicators</h2>
                      <CsLineIcons icon="heart" size="18" style={{ color: brandColor }} />
                    </div>
                    <div className="mb-4 mt-3">
                      <div className="d-flex justify-content-between mb-2 align-items-center">
                        <span className="financial-report-stat-label">Collection Rate</span>
                        <Badge bg="success" className="rounded-pill px-3 py-2">{reportData.summary.netRevenue > 0 ? ((reportData.summary.totalPaid / reportData.summary.netRevenue) * 100).toFixed(1) : '0.0'}%</Badge>
                      </div>
                      <ProgressBar now={reportData.summary.netRevenue > 0 ? (reportData.summary.totalPaid / reportData.summary.netRevenue) * 100 : 0} variant="success" className="progress-pill" style={{ height: '8px' }} />
                      <small className="text-muted smaller d-block mt-2 fw-bold">Actual payments collected vs net sales</small>
                    </div>
                    <div className="mb-4">
                      <div className="d-flex justify-content-between mb-2 align-items-center">
                        <span className="financial-report-stat-label">Discount Rate</span>
                        <Badge bg={reportData.summary.discountPercentage > 15 ? 'danger' : 'success'} className="rounded-pill px-3 py-2">{reportData.summary.discountPercentage}%</Badge>
                      </div>
                      <ProgressBar now={reportData.summary.discountPercentage} max={20} variant={reportData.summary.discountPercentage > 15 ? 'danger' : 'success'} className="progress-pill" style={{ height: '8px' }} />
                      <small className="text-muted smaller d-block mt-2 fw-bold">Ideal: Under 10% of gross sales</small>
                    </div>
                    <div className="p-4 rounded-3" style={{ background: 'rgba(0,0,0,0.02)', border: '1px solid rgba(0,0,0,0.05)' }}>
                      <div className="financial-report-stat-label mb-3">Tax Breakdown</div>
                      <div className="d-flex justify-content-between mb-2 smaller fw-bold">
                        <span className="text-muted">CGST / SGST</span>
                        <span className="text-dark">{formatCurrency(reportData.summary.cgstAmount + reportData.summary.sgstAmount)}</span>
                      </div>
                      <div className="d-flex justify-content-between smaller fw-bold">
                        <span className="text-muted">VAT</span>
                        <span className="text-dark">{formatCurrency(reportData.summary.vatAmount)}</span>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            {/* Payment Method Breakdown */}
            <Card className="financial-report-interactive-card border-0 shadow-sm mb-4">
              <Card.Body className="p-4">
                <div className="financial-report-card-title-container">
                  <h2 className="small-title mb-0" style={{ color: brandColor, fontWeight: '800' }}>Payment Method Distribution</h2>
                  <CsLineIcons icon="pie-chart" size="18" style={{ color: brandColor }} />
                </div>
                <Row className="g-3 mt-1">
                  {reportData.paymentMethodFinancials.map((payment, idx) => (
                    <Col lg="4" key={idx}>
                      <Card className="financial-report-interactive-card border-0 p-3 h-100" style={{ background: 'rgba(0,0,0,0.01) !important', border: '1px solid rgba(0,0,0,0.05) !important' }}>
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <div className="fw-bold text-dark mb-0 text-truncate">{payment.paymentMethod}</div>
                          <Badge bg="primary" className="rounded-pill px-2 flex-shrink-0 ms-2" style={{ fontSize: '0.65rem', backgroundColor: brandColor }}>{payment.orderCount} orders</Badge>
                        </div>
                        <div className="d-flex justify-content-between mb-1 smaller">
                          <span className="text-muted fw-bold">Net Sales:</span>
                          <span className="text-primary fw-bold">{formatCurrency(payment.totalAmount)}</span>
                        </div>
                        <ProgressBar now={(payment.totalAmount / reportData.summary.netRevenue) * 100} variant="info" className="progress-sm mb-2" style={{ height: '3px' }} />
                        <div className="d-flex justify-content-between smaller">
                          <span className="text-muted">Collected:</span>
                          <span className="fw-bold text-success">{formatCurrency(payment.paidAmount)}</span>
                        </div>
                      </Card>
                    </Col>
                  ))}
                </Row>
              </Card.Body>
            </Card>

            {/* Sales Breakdown Table */}
            <Card className="financial-report-interactive-card border-0 shadow-sm mb-4">
              <Card.Body className="p-4">
                <div className="financial-report-card-title-container d-flex justify-content-between align-items-center">
                  <h2 className="small-title mb-0" style={{ color: brandColor, fontWeight: '800' }}>
                    {viewMode === 'daily' ? 'Daily Sales Breakdown' : 'Weekly Sales Breakdown'}
                  </h2>
                  <div className="d-flex align-items-center gap-2">
                    <Form.Select 
                      size="sm" 
                      value={viewMode} 
                      onChange={(e) => setViewMode(e.target.value)} 
                      style={{ width: '130px', borderRadius: '50px', fontWeight: '600' }}
                    >
                      <option value="daily">Daily View</option>
                      <option value="weekly">Weekly View</option>
                    </Form.Select>
                    <CsLineIcons icon="list" size="18" style={{ color: brandColor }} />
                  </div>
                </div>
                <div className="d-none d-md-block table-responsive mt-3">
                  <Table borderless hover className="align-middle mb-0">
                    <thead className="financial-report-stat-label">
                      <tr style={{ borderBottom: '1.5px solid rgba(0,0,0,0.05)' }}>
                        <th className="py-3">{viewMode === 'daily' ? 'Date' : 'Week Period'}</th>
                        <th className="py-3 text-end">Gross Sales</th>
                        <th className="py-3 text-end">Discounts</th>
                        <th className="py-3 text-end">Net Sales</th>
                        <th className="py-3 text-end">Total Taxes</th>
                        <th className="py-3 text-center">Volume</th>
                      </tr>
                    </thead>
                    <tbody>
                      {viewMode === 'daily' ? (
                        sortedDailyFinancials.map((day, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid rgba(0,0,0,0.02)' }}>
                            <td className="py-3 fw-bold text-dark">{`${day.date.day}-${day.date.month}-${day.date.year}`}</td>
                            <td className="py-3 text-end fw-bold text-muted smaller">{formatCurrency(day.grossRevenue)}</td>
                            <td className="py-3 text-end fw-bold text-danger smaller">{formatCurrency(day.discount + day.waveOff)}</td>
                            <td className="py-3 text-end fw-bold text-primary">{formatCurrency(day.netRevenue)}</td>
                            <td className="py-3 text-end fw-bold text-warning smaller">{formatCurrency(day.tax)}</td>
                            <td className="py-3 text-center">
                              <Badge bg="light" className="text-dark rounded-pill px-3 py-2 fw-bold" style={{ fontSize: '0.65rem' }}>
                                {day.orders} ORDERS
                              </Badge>
                            </td>
                          </tr>
                        ))
                      ) : (
                        weeklyFinancials.map((week, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid rgba(0,0,0,0.02)' }}>
                            <td className="py-3 fw-bold text-dark">{week.label}</td>
                            <td className="py-3 text-end fw-bold text-muted smaller">{formatCurrency(week.grossRevenue)}</td>
                            <td className="py-3 text-end fw-bold text-danger smaller">{formatCurrency(week.discount + week.waveOff)}</td>
                            <td className="py-3 text-end fw-bold text-primary">{formatCurrency(week.netRevenue)}</td>
                            <td className="py-3 text-end fw-bold text-warning smaller">{formatCurrency(week.tax)}</td>
                            <td className="py-3 text-center">
                              <Badge bg="light" className="text-dark rounded-pill px-3 py-2 fw-bold" style={{ fontSize: '0.65rem' }}>
                                {week.orders} ORDERS
                              </Badge>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                    <tfoot className="fw-bold" style={{ background: 'rgba(0,0,0,0.02)' }}>
                      <tr>
                        <td className="py-4 financial-report-stat-label">Total</td>
                        <td className="py-4 text-end text-primary">{formatCurrency(reportData.summary.grossRevenue)}</td>
                        <td className="py-4 text-end text-danger">{formatCurrency(reportData.summary.totalDiscount + reportData.summary.totalWaveOff)}</td>
                        <td className="py-4 text-end text-success">{formatCurrency(reportData.summary.netRevenue)}</td>
                        <td className="py-4 text-end text-warning">{formatCurrency(reportData.summary.totalTax)}</td>
                        <td className="py-4 text-center"><Badge bg="primary" className="rounded-pill px-3 py-2" style={{ backgroundColor: brandColor }}>{reportData.summary.totalOrders} TOTAL</Badge></td>
                      </tr>
                    </tfoot>
                  </Table>
                </div>

                <div className="d-md-none d-flex flex-column gap-3 mt-3">
                  {viewMode === 'daily' ? (
                    sortedDailyFinancials.map((day, idx) => (
                      <div key={idx} className="p-3 rounded" style={{ backgroundColor: 'rgba(0,0,0,0.02)', border: '1px solid rgba(0,0,0,0.05)' }}>
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <span className="fw-bold text-dark fs-6">{`${day.date.day}-${day.date.month}-${day.date.year}`}</span>
                          <Badge bg="light" className="text-dark rounded-pill px-2 py-1 fw-bold" style={{ fontSize: '0.65rem' }}>
                            {day.orders} ORDERS
                          </Badge>
                        </div>
                        <div className="d-flex justify-content-between align-items-center mb-2 smaller">
                          <span className="text-muted fw-bold">Gross Sales:</span>
                          <span className="fw-bold text-muted">{formatCurrency(day.grossRevenue)}</span>
                        </div>
                        <div className="d-flex justify-content-between align-items-center mb-2 smaller">
                          <span className="text-muted fw-bold">Discounts:</span>
                          <span className="fw-bold text-danger">{formatCurrency(day.discount + day.waveOff)}</span>
                        </div>
                        <div className="d-flex justify-content-between align-items-center mb-2 smaller">
                          <span className="text-muted fw-bold">Total Taxes:</span>
                          <span className="fw-bold text-warning">{formatCurrency(day.tax)}</span>
                        </div>
                        <div className="d-flex justify-content-between align-items-center smaller">
                          <span className="text-muted fw-bold">Net Sales:</span>
                          <span className="fw-bold text-primary">{formatCurrency(day.netRevenue)}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    weeklyFinancials.map((week, idx) => (
                      <div key={idx} className="p-3 rounded" style={{ backgroundColor: 'rgba(0,0,0,0.02)', border: '1px solid rgba(0,0,0,0.05)' }}>
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <span className="fw-bold text-dark fs-6">{week.label}</span>
                          <Badge bg="light" className="text-dark rounded-pill px-2 py-1 fw-bold" style={{ fontSize: '0.65rem' }}>
                            {week.orders} ORDERS
                          </Badge>
                        </div>
                        <div className="d-flex justify-content-between align-items-center mb-2 smaller">
                          <span className="text-muted fw-bold">Gross Sales:</span>
                          <span className="fw-bold text-muted">{formatCurrency(week.grossRevenue)}</span>
                        </div>
                        <div className="d-flex justify-content-between align-items-center mb-2 smaller">
                          <span className="text-muted fw-bold">Discounts:</span>
                          <span className="fw-bold text-danger">{formatCurrency(week.discount + week.waveOff)}</span>
                        </div>
                        <div className="d-flex justify-content-between align-items-center mb-2 smaller">
                          <span className="text-muted fw-bold">Total Taxes:</span>
                          <span className="fw-bold text-warning">{formatCurrency(week.tax)}</span>
                        </div>
                        <div className="d-flex justify-content-between align-items-center smaller">
                          <span className="text-muted fw-bold">Net Sales:</span>
                          <span className="fw-bold text-primary">{formatCurrency(week.netRevenue)}</span>
                        </div>
                      </div>
                    ))
                  )}

                  <div className="p-3 rounded mt-2 border border-primary" style={{ backgroundColor: 'rgba(35, 179, 244, 0.05)' }}>
                    <div className="financial-report-stat-label mb-3 text-primary text-center">Total</div>
                    <div className="d-flex justify-content-between align-items-center mb-2 smaller">
                      <span className="text-muted fw-bold">Gross Sales:</span>
                      <span className="fw-bold text-primary">{formatCurrency(reportData.summary.grossRevenue)}</span>
                    </div>
                    <div className="d-flex justify-content-between align-items-center mb-2 smaller">
                      <span className="text-muted fw-bold">Discounts:</span>
                      <span className="fw-bold text-danger">{formatCurrency(reportData.summary.totalDiscount + reportData.summary.totalWaveOff)}</span>
                    </div>
                    <div className="d-flex justify-content-between align-items-center mb-2 smaller">
                      <span className="text-muted fw-bold">Total Taxes:</span>
                      <span className="fw-bold text-warning">{formatCurrency(reportData.summary.totalTax)}</span>
                    </div>
                    <div className="d-flex justify-content-between align-items-center mb-2 smaller">
                      <span className="text-muted fw-bold">Net Sales:</span>
                      <span className="fw-bold text-success">{formatCurrency(reportData.summary.netRevenue)}</span>
                    </div>
                    <div className="d-flex justify-content-between align-items-center smaller">
                      <span className="text-muted fw-bold">Total Volume:</span>
                      <span className="fw-bold text-dark">{reportData.summary.totalOrders} ORDERS</span>
                    </div>
                  </div>
                </div>
              </Card.Body>
            </Card>

            {/* Inventory Purchases Table */}
            {reportData.inventoryPurchases?.length > 0 && (
              <Card className="financial-report-interactive-card border-0 shadow-sm mb-4">
                <Card.Body className="p-4">
                  <div className="financial-report-card-title-container">
                    <h2 className="small-title mb-0" style={{ color: '#f97316', fontWeight: '800' }}>Inventory Purchases & Bills (COGS)</h2>
                    <CsLineIcons icon="box" size="18" style={{ color: '#f97316' }} />
                  </div>
                  {/* Desktop Table View */}
                  <div className="table-responsive mt-3 d-none d-md-block">
                    <Table borderless hover className="align-middle mb-0">
                      <thead className="financial-report-stat-label">
                        <tr style={{ borderBottom: '1.5px solid rgba(0,0,0,0.05)' }}>
                          <th className="py-3">Date</th>
                          <th className="py-3">Bill Number</th>
                          <th className="py-3">Vendor</th>
                          <th className="py-3">Category</th>
                          <th className="py-3 text-end">Total Amount</th>
                          <th className="py-3 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportData.inventoryPurchases.map((inv, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid rgba(0,0,0,0.02)' }}>
                            <td className="py-3 fw-bold text-dark">
                              {inv.bill_date ? format(new Date(inv.bill_date), 'dd-MM-yyyy') : format(new Date(inv.request_date), 'dd-MM-yyyy')}
                            </td>
                            <td className="py-3 fw-bold text-muted smaller">{inv.bill_number || '—'}</td>
                            <td className="py-3 fw-bold text-dark">{inv.vendor_name || '—'}</td>
                            <td className="py-3 text-muted smaller">{inv.category || '—'}</td>
                            <td className="py-3 text-end fw-bold" style={{ color: '#f97316' }}>{formatCurrency(inv.total_amount || 0)}</td>
                            <td className="py-3 text-center">
                              <Badge bg={inv.status === 'Completed' ? 'success' : inv.status === 'Pending' ? 'warning' : 'secondary'} className="rounded-pill px-3 py-1">
                                {inv.status || 'Completed'}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>

                  {/* Mobile Card List View */}
                  <div className="d-block d-md-none mt-3">
                    {reportData.inventoryPurchases.map((inv, idx) => {
                      const totalAmt = inv.total_amount || 0;
                      const dateStr = inv.bill_date 
                        ? format(new Date(inv.bill_date), 'dd-MM-yyyy') 
                        : format(new Date(inv.request_date), 'dd-MM-yyyy');

                      return (
                        <div 
                          key={idx} 
                          className="p-3 mb-3 border-0 shadow-sm"
                          style={{ 
                            borderRadius: '1.25rem', 
                            borderLeft: '5px solid #f97316',
                            background: '#f8fafc'
                          }}
                        >
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <span className="text-muted fw-bold small" style={{ fontSize: '11px', letterSpacing: '0.03em' }}>
                              {dateStr}
                            </span>
                            <Badge bg={inv.status === 'Completed' ? 'success' : inv.status === 'Pending' ? 'warning' : 'secondary'} className="rounded-pill px-2.5 py-1" style={{ fontSize: '10px', fontWeight: '800' }}>
                              {inv.status || 'Completed'}
                            </Badge>
                          </div>

                          <div className="mb-2">
                            <div className="fw-extrabold text-dark d-flex align-items-center" style={{ fontSize: '14px', letterSpacing: '-0.01em' }}>
                              <CsLineIcons icon="file-text" size="14" className="text-muted me-1.5" />
                              <span>Bill: {inv.bill_number || '—'}</span>
                            </div>
                            <div className="text-muted mt-1 d-flex align-items-center" style={{ fontSize: '12px' }}>
                              <CsLineIcons icon="user" size="12" className="text-muted me-1.5" />
                              <span>Vendor: <span className="fw-semibold text-dark">{inv.vendor_name || '—'}</span></span>
                            </div>
                            <div className="text-muted mt-1 d-flex align-items-center" style={{ fontSize: '12px' }}>
                              <CsLineIcons icon="tag" size="12" className="text-muted me-1.5" />
                              <span>Category: <span className="fw-semibold text-dark">{inv.category || '—'}</span></span>
                            </div>
                          </div>

                          <div className="d-flex justify-content-between align-items-center border-top pt-2 mt-2" style={{ borderColor: 'rgba(0,0,0,0.03)' }}>
                            <span className="text-muted fw-bold small" style={{ fontSize: '11px', letterSpacing: '0.05em' }}>TOTAL AMOUNT</span>
                            <span className="fw-extrabold" style={{ fontSize: '14px', color: '#f97316' }}>{formatCurrency(totalAmt)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card.Body>
              </Card>
            )}

            {/* Wastage & Operational Expenses Table */}
            {reportData.wastageLogs?.length > 0 && (
              <Card className="financial-report-interactive-card border-0 shadow-sm mb-4">
                <Card.Body className="p-4">
                  <div className="financial-report-card-title-container">
                    <h2 className="small-title mb-0" style={{ color: '#ef4444', fontWeight: '800' }}>Wastage & Operational Expense Logs</h2>
                    <CsLineIcons icon="bin" size="18" style={{ color: '#ef4444' }} />
                  </div>
                  <div className="table-responsive mt-3">
                    <Table borderless hover className="align-middle mb-0">
                      <thead className="financial-report-stat-label">
                        <tr style={{ borderBottom: '1.5px solid rgba(0,0,0,0.05)' }}>
                          <th className="py-3">Date</th>
                          <th className="py-3">Item Name</th>
                          <th className="py-3">Wastage Type</th>
                          <th className="py-3 text-end">Quantity</th>
                          <th className="py-3">Reason / Notes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportData.wastageLogs.map((w, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid rgba(0,0,0,0.02)' }}>
                            <td className="py-3 fw-bold text-dark">{format(new Date(w.date), 'dd-MM-yyyy')}</td>
                            <td className="py-3 fw-bold text-dark">{w.item_name || '—'}</td>
                            <td className="py-3 text-capitalize text-danger fw-bold smaller">{w.wastage_type || '—'}</td>
                            <td className="py-3 text-end fw-bold text-dark">{`${w.quantity || 0} ${w.unit || ''}`}</td>
                            <td className="py-3 text-muted smaller">{w.reason || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                </Card.Body>
              </Card>
            )}

            {/* Key Business Alerts */}
            <Card className="financial-report-interactive-card border-0 shadow-sm mb-4">
              <Card.Body className="p-4">
                <div className="financial-report-card-title-container">
                  <h2 className="small-title mb-0" style={{ color: brandColor, fontWeight: '800' }}>Key Business Alerts</h2>
                  <CsLineIcons icon="star" size="18" style={{ color: brandColor }} />
                </div>
                <Row className="g-3 mt-1">
                  {[
                    { title: 'Discount Policy', text: `Rate: ${reportData.summary.discountPercentage}%. ${reportData.summary.discountPercentage > 15 ? 'Alert: High discount rate detected.' : 'Healthy discount rate.'}`, variant: reportData.summary.discountPercentage > 15 ? 'danger' : 'success', icon: 'tag' },
                    { title: 'Taxes Collected', text: `Total: ${formatCurrency(reportData.summary.totalTax)}. Total taxes ready for filing.`, variant: 'info', icon: 'dollar' },
                    { title: 'Sales Performance', text: `Net Sales: ${formatCurrency(reportData.summary.netRevenue)}. Avg Order: ${reportData.summary.totalOrders > 0 ? formatCurrency(reportData.summary.netRevenue / reportData.summary.totalOrders) : formatCurrency(0)}.`, variant: 'primary', icon: 'trend-up' }
                  ].map((insight, i) => (
                    <Col md={4} key={i}>
                      <Alert variant={insight.variant} className="financial-report-interactive-card border-0 h-100 p-4 mb-0 shadow-none" style={{ background: `rgba(var(--bs-${insight.variant}-rgb), 0.05)` }}>
                        <div className="d-flex align-items-center mb-3">
                          <CsLineIcons icon={insight.icon} size="20" className={`text-${insight.variant} me-3`} />
                          <div className="fw-bold text-dark text-uppercase smaller">{insight.title}</div>
                        </div>
                        <div className="smaller text-muted fw-bold">{insight.text}</div>
                      </Alert>
                    </Col>
                  ))}
                </Row>
              </Card.Body>
            </Card>
          </>
        )}
      </div>

      {/* Export Options Modal (Styled like Menu Report) */}
      <Modal show={showExportModal} onHide={() => setShowExportModal(false)} centered contentClassName="interactive-card border-0 shadow-lg">
        <Modal.Header className="border-0 p-4 pb-0" closeButton>
          <Modal.Title className="fw-bold" style={{ color: brandColor }}>Export Financial Report</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          <p className="text-muted smaller fw-bold mb-4">Choose what information to include in your export report.</p>
          <Form className="d-flex flex-column gap-3">
            {[
              { label: 'Financial Summary', key: 'includeSummary' },
              { label: 'Daily Sales Breakdown', key: 'includeDailyBreakdown' },
              { label: 'Weekly Sales Breakdown', key: 'includeWeeklyBreakdown' },
              { label: 'Inventory Purchases Breakdown', key: 'includeInventoryPurchases' },
              { label: 'Wastage & Expense Logs', key: 'includeExpensesWastage' },
              { label: 'Tax Breakdown', key: 'includeTaxBreakdown' },
              { label: 'Payment Method Breakdown', key: 'includePaymentMethods' },
              { label: 'Key Business Alerts', key: 'includeFinancialInsights' }
            ].map(option => (
              <Form.Check
                key={option.key}
                type="switch"
                id={option.key}
                label={<span className="fw-bold smaller text-dark ms-2">{option.label}</span>}
                checked={exportOptions[option.key]}
                onChange={(e) => setExportOptions({ ...exportOptions, [option.key]: e.target.checked })}
              />
            ))}
          </Form>
        </Modal.Body>
        <Modal.Footer className="border-0 p-4 pt-0">
          <Button variant="light" className="financial-report-custom-btn-outline border-0 text-muted" onClick={() => setShowExportModal(false)}>Cancel</Button>
          <Button className="financial-report-custom-btn-outline px-4" onClick={handleExportConfirm}>Download Report</Button>
        </Modal.Footer>
      </Modal>

      <ToastContainer position="top-end" className="p-3">
        <Toast show={showToast} onClose={() => setShowToast(false)} delay={3000} autohide bg="white" className="financial-report-interactive-card border-0">
          <Toast.Body className="p-3 d-flex align-items-center">
            <CsLineIcons icon="check-circle" className="text-success me-2" size="20" />
            <span className="fw-bold smaller text-dark">{toastMessage}</span>
          </Toast.Body>
        </Toast>
      </ToastContainer>
    </>
  );
};

export default FinancialReport;
