import React, { useState, useEffect, useContext } from 'react';
import { Button, Row, Col, Card, Table, Form, Spinner, Alert, Badge, ProgressBar, Modal, Toast, ToastContainer } from 'react-bootstrap';
import axios from 'axios';
import { format, isToday, isYesterday } from 'date-fns';
import { enIN } from 'date-fns/locale';
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AuthContext } from 'contexts/AuthContext';

const CustomerInsightsReport = () => {
  const title = 'Customer Insights Report';
  const description = 'Detailed Customer Analysis and Behavior Patterns';

  const breadcrumbs = [
    { to: '', text: 'Home' },
    { to: 'dashboards', text: 'Dashboards' },
    { to: 'statistics', text: 'Statistics' },
    { to: 'reports/customers', text: 'Customer Insights' },
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
    includeTopCustomers: true,
    topCustomersLimit: 50,
    includeSegmentation: true,
    includeLoyaltyAnalysis: true,
    includeLifetimeValue: true,
    includeAcquisitionTrend: true,
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

  const formatCustomerDate = (date) => {
    if (!date) return '—';

    const d = new Date(date);

    if (isToday(d)) return 'Today';
    if (isYesterday(d)) return 'Yesterday';

    return format(d, 'dd-MM-yyyy', { locale: enIN });
  };

  const fetchCustomerReport = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = {
        period: 'custom',
        start_date: startDate,
        end_date: endDate,
      };

      const response = await axios.get(`${API_BASE}/statistics/customers/insights`, {
        ...getHeaders(),
        params,
      });
      setReportData(response.data);
    } catch (err) {
      console.error('Error fetching customer report:', err);
      setError(err.response?.data?.error || 'Failed to load customer report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomerReport();
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

      const repeatCustomerData = reportData?.repeatCustomerAnalysis || [];
      const oneTimeCustomers = repeatCustomerData.find((item) => item._id === 'one-time')?.count || 0;
      const repeatCustomers = repeatCustomerData.find((item) => item._id === 'repeat')?.count || 0;
      const totalCustomers = oneTimeCustomers + repeatCustomers;
      const repeatRate = totalCustomers > 0 ? ((repeatCustomers / totalCustomers) * 100).toFixed(1) : 0;

      // Dashboard Sheet
      if (exportOptions.includeLoyaltyAnalysis) {
        setExportProgress(20);
        const dashboardData = [
          ['CUSTOMER INSIGHTS DASHBOARD'],
          [],
          ['Company:', COMPANY_NAME],
          ['Report Period:', `${format(new Date(startDate), 'dd MMM yyyy')} to ${format(new Date(endDate), 'dd MMM yyyy')}`],
          ['Generated On:', format(new Date(), 'dd MMM yyyy HH:mm')],
          [],
          ['KEY METRICS'],
          ['Metric', 'Value', 'Percentage'],
          ['Total Customers', totalCustomers, '100%'],
          ['Repeat Customers', repeatCustomers, `${repeatRate}%`],
          ['One-Time Customers', oneTimeCustomers, `${(totalCustomers > 0 ? (oneTimeCustomers / totalCustomers) * 100 : 0).toFixed(1)}%`],
          ['New Customers', reportData.acquisitionTrend?.reduce((sum, item) => sum + item.newCustomers, 0) || 0, ''],
          [],
          ['CUSTOMER LOYALTY INSIGHTS'],
          ['Metric', 'Value'],
          ['Repeat Rate', `${repeatRate}%`],
          ['Loyalty Status', repeatRate > 40 ? 'Excellent' : repeatRate > 25 ? 'Good' : 'Moderate'],
        ];

        const dashboardSheet = XLSX.utils.aoa_to_sheet(dashboardData);

        // Set column widths
        dashboardSheet['!cols'] = [{ wch: 25 }, { wch: 25 }, { wch: 20 }];

        XLSX.utils.book_append_sheet(wb, dashboardSheet, 'Dashboard');
      }

      // Top Customers Sheet
      if (exportOptions.includeTopCustomers) {
        setExportProgress(35);
        const customersLimit = exportOptions.topCustomersLimit || 50;
        const customersData = [
          ['TOP CUSTOMERS ANALYSIS'],
          [],
          ['Rank', 'Customer Name', 'Total Orders', 'Total Spent', 'Avg Order Value', 'Total Discount', 'Last Order Date', 'Days Since Last Order', 'Status'],
        ];

        reportData.topCustomers.slice(0, customersLimit).forEach((customer, idx) => {
          const daysSinceLastOrder = Math.floor((new Date() - new Date(customer.lastOrderDate)) / (1000 * 60 * 60 * 24));
          const status = daysSinceLastOrder < 7 ? 'Active' : daysSinceLastOrder < 30 ? 'Recent' : 'Inactive';

          customersData.push([
            idx + 1,
            customer.customerName || 'Guest Customer',
            customer.totalOrders,
            customer.totalSpent,
            customer.avgOrderValue,
            customer.totalDiscount,
            format(new Date(customer.lastOrderDate), 'dd-MM-yyyy'),
            daysSinceLastOrder,
            status,
          ]);
        });

        const customersSheet = XLSX.utils.aoa_to_sheet(customersData);

        // Set column widths
        customersSheet['!cols'] = [{ wch: 8 }, { wch: 25 }, { wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 12 }];

        // Apply currency formatting
        const range = XLSX.utils.decode_range(customersSheet['!ref']);
        for (let R = 3; R <= range.e.r; R += 1) {
          const spentCell = XLSX.utils.encode_cell({ r: R, c: 3 });
          const avgCell = XLSX.utils.encode_cell({ r: R, c: 4 });
          const discountCell = XLSX.utils.encode_cell({ r: R, c: 5 });

          if (customersSheet[spentCell]) {
            customersSheet[spentCell].z = '"Rs. "#,##0';
          }
          if (customersSheet[avgCell]) {
            customersSheet[avgCell].z = '"Rs. "#,##0';
          }
          if (customersSheet[discountCell]) {
            customersSheet[discountCell].z = '"Rs. "#,##0';
          }
        }

        // Enable auto-filter
        customersSheet['!autofilter'] = { ref: `A3:I${range.e.r + 1}` };

        XLSX.utils.book_append_sheet(wb, customersSheet, 'Top Customers');
      }

      // Customer Segmentation Sheet
      if (exportOptions.includeSegmentation) {
        setExportProgress(50);
        const segmentLabels = ['1 order', '2-4 orders', '5-9 orders', '10-19 orders', '20+ orders'];
        const segmentData = [
          ['CUSTOMER SEGMENTATION BY ORDER FREQUENCY'],
          [],
          ['Segment', 'Customer Count', 'Total Revenue', 'Avg Orders per Customer', 'Revenue per Customer', '% of Total Customers'],
        ];

        reportData.customerSegmentation.forEach((segment, idx) => {
          const revenuePerCustomer = segment.customerCount > 0 ? segment.totalRevenue / segment.customerCount : 0;
          const percentOfTotal = totalCustomers > 0 ? ((segment.customerCount / totalCustomers) * 100).toFixed(2) : 0;

          segmentData.push([
            segmentLabels[segment._id - 1] || 'Other',
            segment.customerCount,
            segment.totalRevenue,
            segment.avgOrdersPerCustomer.toFixed(2),
            revenuePerCustomer,
            `${percentOfTotal}%`,
          ]);
        });

        const segmentSheet = XLSX.utils.aoa_to_sheet(segmentData);

        // Set column widths
        segmentSheet['!cols'] = [{ wch: 20 }, { wch: 18 }, { wch: 18 }, { wch: 25 }, { wch: 22 }, { wch: 22 }];

        // Apply currency formatting
        const range = XLSX.utils.decode_range(segmentSheet['!ref']);
        for (let R = 3; R <= range.e.r; R += 1) {
          const revenueCell = XLSX.utils.encode_cell({ r: R, c: 2 });
          const revPerCustomerCell = XLSX.utils.encode_cell({ r: R, c: 4 });

          if (segmentSheet[revenueCell]) {
            segmentSheet[revenueCell].z = '"Rs. "#,##0';
          }
          if (segmentSheet[revPerCustomerCell]) {
            segmentSheet[revPerCustomerCell].z = '"Rs. "#,##0';
          }
        }

        XLSX.utils.book_append_sheet(wb, segmentSheet, 'Segmentation');
      }

      // Lifetime Value Distribution Sheet
      if (exportOptions.includeLifetimeValue && reportData.lifetimeValueDistribution && reportData.lifetimeValueDistribution.length > 0) {
        setExportProgress(65);
        const ranges = ['₹0 - ₹1,000', '₹1,000 - ₹5,000', '₹5,000 - ₹10,000', '₹10,000 - ₹25,000', '₹25,000 - ₹50,000', '₹50,000 - ₹1,00,000'];
        const lifetimeData = [
          ['CUSTOMER LIFETIME VALUE DISTRIBUTION'],
          [],
          ['Value Range', 'Customer Count', 'Total Value', 'Avg per Customer', '% of Total Customers'],
        ];

        reportData.lifetimeValueDistribution.forEach((item) => {
          const avgPerCustomer = item.customerCount > 0 ? item.totalValue / item.customerCount : 0;
          const percentOfTotal = totalCustomers > 0 ? ((item.customerCount / totalCustomers) * 100).toFixed(2) : 0;

          lifetimeData.push([ranges[item._id] || '₹1,00,000+', item.customerCount, item.totalValue, avgPerCustomer, `${percentOfTotal}%`]);
        });

        const lifetimeSheet = XLSX.utils.aoa_to_sheet(lifetimeData);

        // Set column widths
        lifetimeSheet['!cols'] = [{ wch: 25 }, { wch: 18 }, { wch: 18 }, { wch: 20 }, { wch: 22 }];

        // Apply currency formatting
        const range = XLSX.utils.decode_range(lifetimeSheet['!ref']);
        for (let R = 3; R <= range.e.r; R += 1) {
          const valueCell = XLSX.utils.encode_cell({ r: R, c: 2 });
          const avgCell = XLSX.utils.encode_cell({ r: R, c: 3 });

          if (lifetimeSheet[valueCell]) {
            lifetimeSheet[valueCell].z = '"Rs. "#,##0';
          }
          if (lifetimeSheet[avgCell]) {
            lifetimeSheet[avgCell].z = '"Rs. "#,##0';
          }
        }

        XLSX.utils.book_append_sheet(wb, lifetimeSheet, 'Lifetime Value');
      }

      // Acquisition Trend Sheet
      if (exportOptions.includeAcquisitionTrend && reportData.acquisitionTrend && reportData.acquisitionTrend.length > 0) {
        setExportProgress(80);
        const acquisitionData = [['NEW CUSTOMER ACQUISITION TREND'], [], ['Date', 'New Customers', 'Cumulative Total']];

        let cumulativeTotal = 0;
        reportData.acquisitionTrend.forEach((item) => {
          cumulativeTotal += item.newCustomers;
          acquisitionData.push([
            `${String(item._id.day).padStart(2, '0')}-${String(item._id.month).padStart(2, '0')}-${item._id.year}`,
            item.newCustomers,
            cumulativeTotal,
          ]);
        });

        const acquisitionSheet = XLSX.utils.aoa_to_sheet(acquisitionData);

        // Set column widths
        acquisitionSheet['!cols'] = [{ wch: 15 }, { wch: 18 }, { wch: 18 }];

        XLSX.utils.book_append_sheet(wb, acquisitionSheet, 'Acquisition Trend');
      }

      setExportProgress(95);

      // Write file
      XLSX.writeFile(wb, `Customer_Insights_Report_${startDate}_to_${endDate}.xlsx`);

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

      const repeatCustomerData = reportData?.repeatCustomerAnalysis || [];
      const oneTimeCustomers = repeatCustomerData.find((item) => item._id === 'one-time')?.count || 0;
      const repeatCustomers = repeatCustomerData.find((item) => item._id === 'repeat')?.count || 0;
      const totalCustomers = oneTimeCustomers + repeatCustomers;
      const repeatRate = totalCustomers > 0 ? ((repeatCustomers / totalCustomers) * 100).toFixed(1) : 0;

      // Executive Summary Page (Cover Page)
      setExportProgress(20);

      // Header with company branding
      doc.setFillColor(68, 114, 196);
      doc.rect(0, 0, 210, 40, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont(undefined, 'bold');
      doc.text('CUSTOMER INSIGHTS REPORT', 105, 20, { align: 'center' });

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
      if (exportOptions.includeLoyaltyAnalysis) {
        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.text('Executive Summary', 20, yPosition);
        yPosition += 12;

        // Create summary boxes
        const metrics = [
          { label: 'Total Customers', value: totalCustomers.toString(), color: [68, 114, 196] },
          { label: 'Repeat Customers', value: `${repeatCustomers} (${repeatRate}%)`, color: [76, 175, 80] },
          { label: 'One-Time Customers', value: oneTimeCustomers.toString(), color: [255, 152, 0] },
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
        if (exportOptions.includeCharts) {
          doc.setFontSize(12);
          doc.setFont(undefined, 'bold');
          doc.text('Key Insights:', 20, yPosition);
          yPosition += 8;

          doc.setFontSize(10);
          doc.setFont(undefined, 'normal');

          const topCustomer = reportData.topCustomers[0];
          const insights = [
            `• Customer repeat rate: ${repeatRate}% (${repeatRate > 40 ? 'Excellent' : repeatRate > 25 ? 'Good' : 'Moderate'} loyalty)`,
            `• Top customer: ${topCustomer?.customerName || 'Guest'} with ${formatCurrencyPDF(topCustomer?.totalSpent || 0)} spent`,
            `• New customer acquisition: ${reportData.acquisitionTrend?.reduce((sum, item) => sum + item.newCustomers, 0) || 0} customers`,
            `• Focus on converting ${oneTimeCustomers} one-time customers into repeat visitors`,
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

      // Top Customers Table
      if (exportOptions.includeTopCustomers) {
        setExportProgress(40);

        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text(`Top ${Math.min(exportOptions.topCustomersLimit, 20)} Customers by Spending`, 20, yPosition);
        yPosition += 8;

        const customersLimit = Math.min(exportOptions.topCustomersLimit || 20, 20);

        autoTable(doc, {
          startY: yPosition,
          head: [['Rank', 'Customer', 'Orders', 'Total Spent', 'Avg Value', 'Status']],
          body: reportData.topCustomers.slice(0, customersLimit).map((customer, idx) => {
            const daysSinceLastOrder = Math.floor((new Date() - new Date(customer.lastOrderDate)) / (1000 * 60 * 60 * 24));
            const status = daysSinceLastOrder < 7 ? 'Active' : daysSinceLastOrder < 30 ? 'Recent' : 'Inactive';

            return [
              (idx + 1).toString(),
              customer.customerName || 'Guest',
              customer.totalOrders.toString(),
              formatCurrencyPDF(customer.totalSpent),
              formatCurrencyPDF(customer.avgOrderValue),
              status,
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
            1: { cellWidth: 50 },
            2: { halign: 'center' },
            3: { halign: 'right' },
            4: { halign: 'right' },
            5: { halign: 'center', cellWidth: 20 },
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

      // Customer Segmentation
      if (exportOptions.includeSegmentation) {
        setExportProgress(60);

        if (yPosition > 200) {
          doc.addPage();
          yPosition = 20;
        }

        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('Customer Segmentation by Order Frequency', 20, yPosition);
        yPosition += 8;

        const segmentLabels = ['1 order', '2-4 orders', '5-9 orders', '10-19 orders', '20+ orders'];

        autoTable(doc, {
          startY: yPosition,
          head: [['Segment', 'Customers', 'Total Revenue', 'Avg Orders', 'Rev/Customer']],
          body: reportData.customerSegmentation.map((segment) => {
            const revenuePerCustomer = segment.customerCount > 0 ? segment.totalRevenue / segment.customerCount : 0;

            return [
              segmentLabels[segment._id - 1] || 'Other',
              segment.customerCount.toString(),
              formatCurrencyPDF(segment.totalRevenue),
              segment.avgOrdersPerCustomer.toFixed(2),
              formatCurrencyPDF(revenuePerCustomer),
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
            1: { halign: 'center' },
            2: { halign: 'right' },
            3: { halign: 'center' },
            4: { halign: 'right' },
          },
        });

        yPosition = doc.lastAutoTable.finalY + 15;
      }

      // Lifetime Value Distribution
      if (exportOptions.includeLifetimeValue && reportData.lifetimeValueDistribution && reportData.lifetimeValueDistribution.length > 0) {
        setExportProgress(75);

        if (yPosition > 200) {
          doc.addPage();
          yPosition = 20;
        }

        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('Customer Lifetime Value Distribution', 20, yPosition);
        yPosition += 8;

        const ranges = ['₹0 - ₹1K', '₹1K - ₹5K', '₹5K - ₹10K', '₹10K - ₹25K', '₹25K - ₹50K', '₹50K - ₹1L'];

        autoTable(doc, {
          startY: yPosition,
          head: [['Value Range', 'Customers', 'Total Value', 'Avg/Customer']],
          body: reportData.lifetimeValueDistribution.map((item) => {
            const avgPerCustomer = item.customerCount > 0 ? item.totalValue / item.customerCount : 0;

            return [ranges[item._id] || '₹1L+', item.customerCount.toString(), formatCurrencyPDF(item.totalValue), formatCurrencyPDF(avgPerCustomer)];
          }),
          theme: 'striped',
          headStyles: {
            fillColor: [68, 114, 196],
            fontSize: 10,
            fontStyle: 'bold',
          },
          styles: { fontSize: 9 },
          columnStyles: {
            0: { cellWidth: 40 },
            1: { halign: 'center' },
            2: { halign: 'right' },
            3: { halign: 'right' },
          },
        });

        yPosition = doc.lastAutoTable.finalY + 15;
      }

      // Customer Loyalty Analysis
      if (exportOptions.includeLoyaltyAnalysis) {
        setExportProgress(85);

        if (yPosition > 220) {
          doc.addPage();
          yPosition = 20;
        }

        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('Customer Loyalty Analysis', 20, yPosition);
        yPosition += 8;

        autoTable(doc, {
          startY: yPosition,
          head: [['Customer Type', 'Count', 'Percentage']],
          body: [
            ['Repeat Customers', repeatCustomers.toString(), `${repeatRate}%`],
            ['One-Time Customers', oneTimeCustomers.toString(), `${(totalCustomers > 0 ? (oneTimeCustomers / totalCustomers) * 100 : 0).toFixed(1)}%`],
            ['Total Customers', totalCustomers.toString(), '100%'],
          ],
          theme: 'grid',
          headStyles: {
            fillColor: [68, 114, 196],
            fontSize: 10,
            fontStyle: 'bold',
          },
          styles: { fontSize: 10 },
          columnStyles: {
            1: { halign: 'center' },
            2: { halign: 'center' },
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
        doc.text(`${COMPANY_NAME} | Customer Insights Report | Page ${i} of ${pageCount}`, 105, 290, { align: 'center' });
        doc.text(`Generated: ${format(new Date(), 'dd MMM yyyy HH:mm')}`, 105, 294, { align: 'center' });
      }

      setExportProgress(95);

      doc.save(`Customer_Insights_Report_${startDate}_to_${endDate}.pdf`);

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

  const repeatCustomerData = reportData?.repeatCustomerAnalysis || [];
  const oneTimeCustomers = repeatCustomerData.find((item) => item._id === 'one-time')?.count || 0;
  const repeatCustomers = repeatCustomerData.find((item) => item._id === 'repeat')?.count || 0;
  const totalCustomers = oneTimeCustomers + repeatCustomers;
  const repeatRate = totalCustomers > 0 ? ((repeatCustomers / totalCustomers) * 100).toFixed(1) : 0;

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
              <Button variant="primary" className="w-100" onClick={fetchCustomerReport} disabled={loading}>
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

          {/* Summary Cards */}
          <Row className="mb-4">
            <Col lg={3} md={6} className="mb-3">
              <Card>
                <Card.Body>
                  <div className="text-muted text-small mb-1">Total Customers</div>
                  <div className="text-primary h3 mb-0">{totalCustomers}</div>
                  <div className="text-small text-muted mt-1">In selected period</div>
                </Card.Body>
              </Card>
            </Col>
            <Col lg={3} md={6} className="mb-3">
              <Card>
                <Card.Body>
                  <div className="text-muted text-small mb-1">Repeat Customers</div>
                  <div className="text-success h3 mb-0">{repeatCustomers}</div>
                  <div className="text-small text-muted mt-1">{repeatRate}% repeat rate</div>
                </Card.Body>
              </Card>
            </Col>
            <Col lg={3} md={6} className="mb-3">
              <Card>
                <Card.Body>
                  <div className="text-muted text-small mb-1">One-Time Customers</div>
                  <div className="text-warning h3 mb-0">{oneTimeCustomers}</div>
                  <div className="text-small text-muted mt-1">{totalCustomers > 0 ? ((oneTimeCustomers / totalCustomers) * 100).toFixed(1) : 0}% of total</div>
                </Card.Body>
              </Card>
            </Col>
            <Col lg={3} md={6} className="mb-3">
              <Card>
                <Card.Body>
                  <div className="text-muted text-small mb-1">New Customers</div>
                  <div className="text-info h3 mb-0">{reportData.acquisitionTrend?.reduce((sum, item) => sum + item.newCustomers, 0) || 0}</div>
                  <div className="text-small text-muted mt-1">First-time visitors</div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Customer Loyalty Analysis */}
          <Card className="mb-4">
            <Card.Body>
              <h5 className="mb-3">Customer Loyalty Analysis</h5>
              <Row>
                <Col md={6}>
                  <div className="mb-3">
                    <div className="d-flex justify-content-between mb-2">
                      <span>Repeat Customers</span>
                      <span className="font-weight-bold">
                        {repeatCustomers} ({repeatRate}%)
                      </span>
                    </div>
                    <ProgressBar now={repeatRate} variant="success" />
                  </div>
                  <div className="mb-3">
                    <div className="d-flex justify-content-between mb-2">
                      <span>One-Time Customers</span>
                      <span className="font-weight-bold">
                        {oneTimeCustomers} ({totalCustomers > 0 ? ((oneTimeCustomers / totalCustomers) * 100).toFixed(1) : 0}%)
                      </span>
                    </div>
                    <ProgressBar now={totalCustomers > 0 ? (oneTimeCustomers / totalCustomers) * 100 : 0} variant="warning" />
                  </div>
                </Col>
                <Col md={6}>
                  <div className="border rounded p-3">
                    <h6 className="mb-3">Customer Retention Insights</h6>
                    <div className="text-small">
                      <p className="mb-2">
                        <strong>{repeatRate}%</strong> of customers made repeat purchases, showing{' '}
                        {repeatRate > 40 ? 'excellent' : repeatRate > 25 ? 'good' : 'moderate'} customer loyalty.
                      </p>
                      <p className="mb-0">
                        Focus on converting {oneTimeCustomers} one-time customers into repeat visitors through loyalty programs and personalized offers.
                      </p>
                    </div>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* Customer Segmentation */}
          <Card className="mb-4">
            <Card.Body>
              <h5 className="mb-3">Customer Segmentation by Order Frequency</h5>
              <div className="table-responsive">
                <Table striped hover>
                  <thead>
                    <tr>
                      <th>Segment</th>
                      <th className="text-end">Customer Count</th>
                      <th className="text-end">Total Revenue</th>
                      <th className="text-end">Avg Orders</th>
                      <th className="text-end">Revenue per Customer</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.customerSegmentation.map((segment, idx) => {
                      const segmentLabels = ['1 order', '2-4 orders', '5-9 orders', '10-19 orders', '20+ orders'];
                      const revenuePerCustomer = segment.customerCount > 0 ? segment.totalRevenue / segment.customerCount : 0;

                      return (
                        <tr key={idx}>
                          <td className="font-weight-bold">{segmentLabels[segment._id - 1] || 'Other'}</td>
                          <td className="text-end">{segment.customerCount}</td>
                          <td className="text-end font-weight-bold text-primary">{formatCurrency(segment.totalRevenue)}</td>
                          <td className="text-end">{segment.avgOrdersPerCustomer.toFixed(2)}</td>
                          <td className="text-end">{formatCurrency(revenuePerCustomer)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>

          {/* Top Customers */}
          <Card className="mb-4">
            <Card.Body>
              <h5 className="mb-3">Top 50 Customers by Spending</h5>
              <div className="table-responsive">
                <Table striped hover>
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>Customer Name</th>
                      <th className="text-end">Total Orders</th>
                      <th className="text-end">Total Spent</th>
                      <th className="text-end">Avg Order Value</th>
                      <th className="text-end">Total Discount</th>
                      <th>Last Order</th>
                      <th className="text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.topCustomers.map((customer, idx) => {
                      const daysSinceLastOrder = Math.floor((new Date() - new Date(customer.lastOrderDate)) / (1000 * 60 * 60 * 24));

                      return (
                        <tr key={idx}>
                          <td>
                            <Badge bg={idx < 3 ? 'primary' : idx < 10 ? 'info' : 'secondary'}>{idx + 1}</Badge>
                          </td>
                          <td className="font-weight-bold">{customer.customerName || 'Guest Customer'}</td>
                          <td className="text-end">{customer.totalOrders}</td>
                          <td className="text-end font-weight-bold text-primary">{formatCurrency(customer.totalSpent)}</td>
                          <td className="text-end">{formatCurrency(customer.avgOrderValue)}</td>
                          <td className="text-end text-danger">{formatCurrency(customer.totalDiscount)}</td>
                          <td>{formatCustomerDate(customer.lastOrderDate)}</td>
                          <td className="text-center">
                            <Badge bg={daysSinceLastOrder < 7 ? 'success' : daysSinceLastOrder < 30 ? 'warning' : 'danger'}>
                              {daysSinceLastOrder < 7 ? 'Active' : daysSinceLastOrder < 30 ? 'Recent' : 'Inactive'}
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

          {/* Lifetime Value Distribution */}
          {reportData.lifetimeValueDistribution && reportData.lifetimeValueDistribution.length > 0 && (
            <Card className="mb-4">
              <Card.Body>
                <h5 className="mb-3">Customer Lifetime Value Distribution</h5>
                <div className="table-responsive">
                  <Table striped hover>
                    <thead>
                      <tr>
                        <th>Value Range</th>
                        <th className="text-end">Customer Count</th>
                        <th className="text-end">Total Value</th>
                        <th className="text-end">Avg per Customer</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.lifetimeValueDistribution.map((item, idx) => {
                        const ranges = ['₹0 - ₹1,000', '₹1,000 - ₹5,000', '₹5,000 - ₹10,000', '₹10,000 - ₹25,000', '₹25,000 - ₹50,000', '₹50,000 - ₹1,00,000'];
                        const avgPerCustomer = item.customerCount > 0 ? item.totalValue / item.customerCount : 0;

                        return (
                          <tr key={idx}>
                            <td className="font-weight-bold">{ranges[item._id] || '₹1,00,000+'}</td>
                            <td className="text-end">{item.customerCount}</td>
                            <td className="text-end font-weight-bold text-primary">{formatCurrency(item.totalValue)}</td>
                            <td className="text-end">{formatCurrency(avgPerCustomer)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </Table>
                </div>
              </Card.Body>
            </Card>
          )}

          {/* Customer Acquisition Trend */}
          {reportData.acquisitionTrend && reportData.acquisitionTrend.length > 0 && (
            <Card className="mb-4">
              <Card.Body>
                <h5 className="mb-3">New Customer Acquisition Trend</h5>
                <div className="table-responsive">
                  <Table striped hover>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th className="text-end">New Customers</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.acquisitionTrend.map((item, idx) => (
                        <tr key={idx}>
                          <td>{`${String(item._id.day).padStart(2, '0')}-${String(item._id.month).padStart(2, '0')}-${item._id.year}`}</td>
                          <td className="text-end font-weight-bold">{item.newCustomers}</td>
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
              id="includeLoyaltyAnalysis"
              label="Customer Loyalty Analysis & Dashboard"
              checked={exportOptions.includeLoyaltyAnalysis}
              onChange={(e) =>
                setExportOptions({
                  ...exportOptions,
                  includeLoyaltyAnalysis: e.target.checked,
                })
              }
              className="mb-3"
            />

            <div className="mb-3">
              <Form.Check
                type="checkbox"
                id="includeTopCustomers"
                label="Top Customers"
                checked={exportOptions.includeTopCustomers}
                onChange={(e) =>
                  setExportOptions({
                    ...exportOptions,
                    includeTopCustomers: e.target.checked,
                  })
                }
              />
              {exportOptions.includeTopCustomers && (
                <Form.Group className="mt-2 ms-4">
                  <Form.Label>Number of customers to include:</Form.Label>
                  <Form.Select
                    value={exportOptions.topCustomersLimit}
                    onChange={(e) =>
                      setExportOptions({
                        ...exportOptions,
                        topCustomersLimit: parseInt(e.target.value, 10),
                      })
                    }
                  >
                    <option value={20}>Top 20</option>
                    <option value={50}>Top 50</option>
                    <option value={100}>Top 100</option>
                    <option value={999}>All Customers</option>
                  </Form.Select>
                </Form.Group>
              )}
            </div>

            <Form.Check
              type="checkbox"
              id="includeSegmentation"
              label="Customer Segmentation"
              checked={exportOptions.includeSegmentation}
              onChange={(e) =>
                setExportOptions({
                  ...exportOptions,
                  includeSegmentation: e.target.checked,
                })
              }
              className="mb-3"
            />

            <Form.Check
              type="checkbox"
              id="includeLifetimeValue"
              label="Lifetime Value Distribution"
              checked={exportOptions.includeLifetimeValue}
              onChange={(e) =>
                setExportOptions({
                  ...exportOptions,
                  includeLifetimeValue: e.target.checked,
                })
              }
              className="mb-3"
            />

            <Form.Check
              type="checkbox"
              id="includeAcquisitionTrend"
              label="Acquisition Trend"
              checked={exportOptions.includeAcquisitionTrend}
              onChange={(e) =>
                setExportOptions({
                  ...exportOptions,
                  includeAcquisitionTrend: e.target.checked,
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
            <strong>Tip:</strong> Including charts and insights will make your {exportType} file more comprehensive and easier to understand for stakeholders.
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

export default CustomerInsightsReport;
