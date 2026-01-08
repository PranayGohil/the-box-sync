import React, { useState, useEffect } from 'react';
import { Button, Row, Col, Card, Table, Form, Spinner, Alert, Badge, ProgressBar, Modal, Toast, ToastContainer } from 'react-bootstrap';
import axios from 'axios';
import { format } from 'date-fns';
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const InventoryReport = () => {
    const title = 'Inventory Report';
    const description = 'Comprehensive Inventory and Purchase Analysis';

    const breadcrumbs = [
        { to: '', text: 'Home' },
        { to: 'dashboards', text: 'Dashboards' },
        { to: 'statistics', text: 'Statistics' },
        { to: 'reports/inventory', text: 'Inventory Report' },
    ];

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [reportData, setReportData] = useState(null);

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
        includeVendorPerformance: true,
        includeCategoryPerformance: true,
        includeTopItems: true,
        includeDailyTrend: true,
        includePaymentAnalysis: true,
        itemsLimit: 'all',
    });

    const [startDate, setStartDate] = useState(format(new Date().setMonth(new Date().getMonth() - 1), 'yyyy-MM-dd'));
    const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [selectedCategory, setSelectedCategory] = useState('all');

    const API_BASE = process.env.REACT_APP_API;
    const COMPANY_NAME = 'Your Restaurant Name';

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

    const fetchInventoryReport = async () => {
        setLoading(true);
        setError(null);

        try {
            const params = {
                period: 'custom',
                start_date: startDate,
                end_date: endDate,
            };

            if (selectedStatus !== 'all') {
                params.status = selectedStatus;
            }
            if (selectedCategory !== 'all') {
                params.category = selectedCategory;
            }

            const response = await axios.get(`${API_BASE}/statistics/inventory`, {
                ...getHeaders(),
                params,
            });

            setReportData(response.data);
        } catch (err) {
            console.error('Error fetching inventory report:', err);
            setError(err.response?.data?.error || 'Failed to load inventory report');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInventoryReport();
    }, []);

    // Show toast notification
    const showSuccessToast = (message) => {
        setToastMessage(message);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
    };

    // Get unique categories and statuses for filters
    const categories = reportData ? ['all', ...new Set(reportData.categoryPerformance.map((c) => c.category).filter(Boolean))] : ['all'];
    const statuses = reportData ? ['all', ...new Set(reportData.statusBreakdown.map((s) => s.status).filter(Boolean))] : ['all'];

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

                const dashboardData = [
                    ['INVENTORY MANAGEMENT DASHBOARD'],
                    [],
                    ['Company:', COMPANY_NAME],
                    ['Report Period:', `${format(new Date(startDate), 'dd MMM yyyy')} to ${format(new Date(endDate), 'dd MMM yyyy')}`],
                    ['Generated On:', format(new Date(), 'dd MMM yyyy HH:mm')],
                    [],
                    ['INVENTORY SUMMARY'],
                    ['Metric', 'Value', 'Details'],
                    ['Total Purchases', reportData.summary.totalPurchases, 'Count'],
                    ['Total Amount', reportData.summary.totalAmount, 'Purchase value'],
                    ['Total Paid', reportData.summary.totalPaid, 'Amount paid'],
                    ['Total Unpaid', reportData.summary.totalUnpaid, 'Outstanding amount'],
                    ['Avg Purchase Value', reportData.summary.avgPurchaseValue, 'Per purchase'],
                    ['Payment Rate', `${reportData.summary.paymentRate}%`, 'Collection efficiency'],
                    [],
                    ['PAYMENT STATUS'],
                    ['Status', 'Count'],
                    ['Fully Paid', reportData.summary.fullyPaidCount],
                    ['Partially Paid', reportData.summary.partiallyPaidCount],
                    ['Unpaid', reportData.summary.unpaidCount],
                ];

                const dashboardSheet = XLSX.utils.aoa_to_sheet(dashboardData);

                // Set column widths
                dashboardSheet['!cols'] = [
                    { wch: 25 },
                    { wch: 25 },
                    { wch: 25 }
                ];

                // Apply currency formatting
                dashboardSheet.B10.z = '"Rs. "#,##0';
                dashboardSheet.B11.z = '"Rs. "#,##0';
                dashboardSheet.B12.z = '"Rs. "#,##0';
                dashboardSheet.B13.z = '"Rs. "#,##0';

                XLSX.utils.book_append_sheet(wb, dashboardSheet, 'Dashboard');
            }

            // Vendor Performance Sheet
            if (exportOptions.includeVendorPerformance) {
                setExportProgress(30);

                const vendorData = [
                    ['VENDOR PERFORMANCE ANALYSIS'],
                    [],
                    ['Vendor Name', 'Purchases', 'Total Amount', 'Paid Amount', 'Unpaid Amount', 'Avg Purchase', 'Payment Rate %'],
                ];

                reportData.vendorPerformance.forEach(vendor => {
                    vendorData.push([
                        vendor.vendorName,
                        vendor.purchaseCount,
                        vendor.totalAmount,
                        vendor.paidAmount,
                        vendor.unpaidAmount,
                        vendor.avgPurchaseValue,
                        vendor.paymentRate
                    ]);
                });

                const vendorSheet = XLSX.utils.aoa_to_sheet(vendorData);

                // Set column widths
                vendorSheet['!cols'] = [
                    { wch: 25 },
                    { wch: 12 },
                    { wch: 16 },
                    { wch: 16 },
                    { wch: 16 },
                    { wch: 16 },
                    { wch: 16 }
                ];

                // Apply currency formatting
                const range = XLSX.utils.decode_range(vendorSheet['!ref']);
                for (let R = 3; R <= range.e.r; R += 1) {
                    for (let C = 2; C <= 5; C += 1) {
                        const cell = XLSX.utils.encode_cell({ r: R, c: C });
                        if (vendorSheet[cell]) vendorSheet[cell].z = '"Rs. "#,##0';
                    }
                }

                // Enable auto-filter
                vendorSheet['!autofilter'] = { ref: `A3:G${range.e.r + 1}` };

                XLSX.utils.book_append_sheet(wb, vendorSheet, 'Vendor Performance');
            }

            // Category Performance Sheet
            if (exportOptions.includeCategoryPerformance) {
                setExportProgress(45);

                const categoryData = [
                    ['CATEGORY PERFORMANCE'],
                    [],
                    ['Category', 'Purchases', 'Total Amount', 'Paid Amount', 'Unpaid Amount', 'Avg Purchase'],
                ];

                reportData.categoryPerformance.forEach(category => {
                    categoryData.push([
                        category.category,
                        category.purchaseCount,
                        category.totalAmount,
                        category.paidAmount,
                        category.unpaidAmount,
                        category.avgPurchaseValue
                    ]);
                });

                const categorySheet = XLSX.utils.aoa_to_sheet(categoryData);

                // Set column widths
                categorySheet['!cols'] = [
                    { wch: 25 },
                    { wch: 12 },
                    { wch: 16 },
                    { wch: 16 },
                    { wch: 16 },
                    { wch: 16 }
                ];

                // Apply currency formatting
                const range = XLSX.utils.decode_range(categorySheet['!ref']);
                for (let R = 3; R <= range.e.r; R += 1) {
                    for (let C = 2; C <= 5; C += 1) {
                        const cell = XLSX.utils.encode_cell({ r: R, c: C });
                        if (categorySheet[cell]) categorySheet[cell].z = '"Rs. "#,##0';
                    }
                }

                XLSX.utils.book_append_sheet(wb, categorySheet, 'Category Performance');
            }

            // Top Items Sheet
            if (exportOptions.includeTopItems) {
                setExportProgress(60);

                const itemLimit = exportOptions.itemsLimit === 'all' ? reportData.topItemsByQuantity.length :
                    exportOptions.itemsLimit === '50' ? 50 : 20;

                const itemData = [
                    ['TOP ITEMS BY QUANTITY'],
                    [],
                    ['Rank', 'Item Name', 'Unit', 'Total Quantity', 'Total Value', 'Purchases', 'Avg Price'],
                ];

                reportData.topItemsByQuantity.slice(0, itemLimit).forEach((item, idx) => {
                    itemData.push([
                        idx + 1,
                        item.itemName,
                        item.unit || 'N/A',
                        item.totalQuantity,
                        item.totalValue,
                        item.purchaseCount,
                        item.avgPrice
                    ]);
                });

                const itemSheet = XLSX.utils.aoa_to_sheet(itemData);

                // Set column widths
                itemSheet['!cols'] = [
                    { wch: 8 },
                    { wch: 30 },
                    { wch: 10 },
                    { wch: 16 },
                    { wch: 16 },
                    { wch: 12 },
                    { wch: 14 }
                ];

                // Apply currency formatting
                const range = XLSX.utils.decode_range(itemSheet['!ref']);
                for (let R = 3; R <= range.e.r; R += 1) {
                    const valueCell = XLSX.utils.encode_cell({ r: R, c: 4 });
                    const priceCell = XLSX.utils.encode_cell({ r: R, c: 6 });

                    if (itemSheet[valueCell]) itemSheet[valueCell].z = '"Rs. "#,##0';
                    if (itemSheet[priceCell]) itemSheet[priceCell].z = '"Rs. "#,##0';
                }

                XLSX.utils.book_append_sheet(wb, itemSheet, 'Top Items');
            }

            // Daily Trend Sheet
            if (exportOptions.includeDailyTrend) {
                setExportProgress(75);

                const dailyData = [
                    ['DAILY PURCHASE TREND'],
                    [],
                    ['Date', 'Purchases', 'Total Amount', 'Paid Amount', 'Unpaid Amount'],
                ];

                reportData.dailyTrend.forEach(day => {
                    const dateStr = `${String(day.date.day).padStart(2, '0')}-${String(day.date.month).padStart(2, '0')}-${day.date.year}`;
                    dailyData.push([
                        dateStr,
                        day.purchaseCount,
                        day.totalAmount,
                        day.paidAmount,
                        day.unpaidAmount
                    ]);
                });

                const dailySheet = XLSX.utils.aoa_to_sheet(dailyData);

                // Set column widths
                dailySheet['!cols'] = [
                    { wch: 12 },
                    { wch: 12 },
                    { wch: 16 },
                    { wch: 16 },
                    { wch: 16 }
                ];

                // Apply currency formatting
                const range = XLSX.utils.decode_range(dailySheet['!ref']);
                for (let R = 3; R <= range.e.r; R += 1) {
                    for (let C = 2; C <= 4; C += 1) {
                        const cell = XLSX.utils.encode_cell({ r: R, c: C });
                        if (dailySheet[cell]) dailySheet[cell].z = '"Rs. "#,##0';
                    }
                }

                XLSX.utils.book_append_sheet(wb, dailySheet, 'Daily Trend');
            }

            // Status Breakdown Sheet
            if (exportOptions.includePaymentAnalysis) {
                setExportProgress(85);

                const statusData = [
                    ['STATUS BREAKDOWN'],
                    [],
                    ['Status', 'Count', 'Total Amount', 'Paid Amount', 'Unpaid Amount'],
                ];

                reportData.statusBreakdown.forEach(status => {
                    statusData.push([
                        status.status,
                        status.count,
                        status.totalAmount,
                        status.paidAmount,
                        status.unpaidAmount
                    ]);
                });

                const statusSheet = XLSX.utils.aoa_to_sheet(statusData);

                // Set column widths
                statusSheet['!cols'] = [
                    { wch: 20 },
                    { wch: 12 },
                    { wch: 16 },
                    { wch: 16 },
                    { wch: 16 }
                ];

                // Apply currency formatting
                const range = XLSX.utils.decode_range(statusSheet['!ref']);
                for (let R = 3; R <= range.e.r; R += 1) {
                    for (let C = 2; C <= 4; C += 1) {
                        const cell = XLSX.utils.encode_cell({ r: R, c: C });
                        if (statusSheet[cell]) statusSheet[cell].z = '"Rs. "#,##0';
                    }
                }

                XLSX.utils.book_append_sheet(wb, statusSheet, 'Status Breakdown');
            }

            setExportProgress(95);

            // Write file
            XLSX.writeFile(wb, `Inventory_Report_${startDate}_to_${endDate}.xlsx`);

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

            // Executive Summary Page (Cover Page)
            setExportProgress(15);

            // Header with company branding
            doc.setFillColor(68, 114, 196);
            doc.rect(0, 0, 297, 40, 'F');

            doc.setTextColor(255, 255, 255);
            doc.setFontSize(24);
            doc.setFont(undefined, 'bold');
            doc.text('INVENTORY MANAGEMENT REPORT', 148.5, 20, { align: 'center' });

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
            if (exportOptions.includeSummary) {
                doc.setFontSize(16);
                doc.setFont(undefined, 'bold');
                doc.text('Executive Summary', 20, yPosition);
                yPosition += 12;

                // Create summary boxes
                const metrics = [
                    { label: 'Total Purchases', value: reportData.summary.totalPurchases.toString(), color: [68, 114, 196] },
                    { label: 'Total Amount', value: formatCurrencyPDF(reportData.summary.totalAmount), color: [76, 175, 80] },
                    { label: 'Unpaid Amount', value: formatCurrencyPDF(reportData.summary.totalUnpaid), color: [244, 67, 54] },
                    { label: 'Payment Rate', value: `${reportData.summary.paymentRate}%`, color: [255, 152, 0] },
                ];

                metrics.forEach((metric, idx) => {
                    const xPos = 20 + (idx * 65);

                    // Draw colored box
                    doc.setFillColor(...metric.color);
                    doc.roundedRect(xPos, yPosition, 60, 25, 3, 3, 'F');

                    // Label
                    doc.setTextColor(255, 255, 255);
                    doc.setFontSize(9);
                    doc.setFont(undefined, 'normal');
                    doc.text(metric.label, xPos + 30, yPosition + 9, { align: 'center' });

                    // Value
                    doc.setFontSize(12);
                    doc.setFont(undefined, 'bold');
                    doc.text(metric.value, xPos + 30, yPosition + 19, { align: 'center' });
                });

                yPosition += 40;
                doc.setTextColor(0, 0, 0);

                // Key Insights
                doc.setFontSize(12);
                doc.setFont(undefined, 'bold');
                doc.text('Key Inventory Insights:', 20, yPosition);
                yPosition += 8;

                doc.setFontSize(10);
                doc.setFont(undefined, 'normal');

                const topVendor = reportData.vendorPerformance?.[0];
                const topCategory = reportData.categoryPerformance?.[0];

                const insights = [
                    `• Total Purchases: ${reportData.summary.totalPurchases} purchases worth ${formatCurrencyPDF(reportData.summary.totalAmount)}`,
                    `• Payment Efficiency: ${reportData.summary.paymentRate}% paid (${reportData.summary.fullyPaidCount} fully paid, ${reportData.summary.unpaidCount} unpaid)`,
                    `• Top Vendor: ${topVendor?.vendorName || 'N/A'} (${formatCurrencyPDF(topVendor?.totalAmount || 0)})`,
                    `• Top Category: ${topCategory?.category || 'N/A'} (${topCategory?.purchaseCount || 0} purchases)`,
                    `• Outstanding Amount: ${formatCurrencyPDF(reportData.summary.totalUnpaid)} pending payment`,
                ];

                insights.forEach(insight => {
                    doc.text(insight, 20, yPosition);
                    yPosition += 7;
                });

                // Add new page for detailed data
                doc.addPage();
                yPosition = 20;
            }

            // Vendor Performance Table
            if (exportOptions.includeVendorPerformance) {
                setExportProgress(40);

                doc.setFontSize(14);
                doc.setFont(undefined, 'bold');
                doc.text('Top Vendors by Purchase Value', 20, yPosition);
                yPosition += 8;

                autoTable(doc, {
                    startY: yPosition,
                    head: [['Vendor', 'Purchases', 'Total Amount', 'Paid', 'Unpaid', 'Payment %']],
                    body: reportData.vendorPerformance.slice(0, 15).map(vendor => [
                        vendor.vendorName,
                        vendor.purchaseCount.toString(),
                        formatCurrencyPDF(vendor.totalAmount),
                        formatCurrencyPDF(vendor.paidAmount),
                        formatCurrencyPDF(vendor.unpaidAmount),
                        `${vendor.paymentRate}%`
                    ]),
                    theme: 'grid',
                    headStyles: {
                        fillColor: [68, 114, 196],
                        fontSize: 10,
                        fontStyle: 'bold'
                    },
                    styles: { fontSize: 9 },
                    columnStyles: {
                        1: { halign: 'center' },
                        2: { halign: 'right', fontStyle: 'bold' },
                        3: { halign: 'right' },
                        4: { halign: 'right' },
                        5: { halign: 'center' }
                    },
                    // Highlight top 3
                    didParseCell(data) {
                        if (data.row.index < 3 && data.section === 'body') {
                            data.cell.styles.fillColor = [255, 243, 205];
                        }
                    }
                });

                yPosition = doc.lastAutoTable.finalY + 15;
            }

            // Category Performance
            if (exportOptions.includeCategoryPerformance) {
                setExportProgress(55);

                if (yPosition > 150) {
                    doc.addPage();
                    yPosition = 20;
                }

                doc.setFontSize(14);
                doc.setFont(undefined, 'bold');
                doc.text('Category Performance', 20, yPosition);
                yPosition += 8;

                autoTable(doc, {
                    startY: yPosition,
                    head: [['Category', 'Purchases', 'Total Amount', 'Avg Purchase']],
                    body: reportData.categoryPerformance.map(category => [
                        category.category,
                        category.purchaseCount.toString(),
                        formatCurrencyPDF(category.totalAmount),
                        formatCurrencyPDF(category.avgPurchaseValue)
                    ]),
                    theme: 'striped',
                    headStyles: {
                        fillColor: [68, 114, 196],
                        fontSize: 10,
                        fontStyle: 'bold'
                    },
                    styles: { fontSize: 9 },
                    columnStyles: {
                        1: { halign: 'center' },
                        2: { halign: 'right', fontStyle: 'bold' },
                        3: { halign: 'right' }
                    }
                });

                yPosition = doc.lastAutoTable.finalY + 15;
            }

            // Top Items
            if (exportOptions.includeTopItems) {
                setExportProgress(70);

                if (yPosition > 150) {
                    doc.addPage();
                    yPosition = 20;
                }

                const itemLimit = exportOptions.itemsLimit === 'all' ? 20 : // Max 20 for PDF
                    exportOptions.itemsLimit === '50' ? 20 : 20;

                doc.setFontSize(14);
                doc.setFont(undefined, 'bold');
                doc.text(`Top ${itemLimit} Items by Quantity`, 20, yPosition);
                yPosition += 8;

                autoTable(doc, {
                    startY: yPosition,
                    head: [['Rank', 'Item Name', 'Unit', 'Quantity', 'Total Value', 'Purchases']],
                    body: reportData.topItemsByQuantity.slice(0, itemLimit).map((item, idx) => [
                        (idx + 1).toString(),
                        item.itemName.substring(0, 35),
                        item.unit || 'N/A',
                        item.totalQuantity.toString(),
                        formatCurrencyPDF(item.totalValue),
                        item.purchaseCount.toString()
                    ]),
                    theme: 'grid',
                    headStyles: {
                        fillColor: [68, 114, 196],
                        fontSize: 9,
                        fontStyle: 'bold'
                    },
                    styles: { fontSize: 8 },
                    columnStyles: {
                        0: { halign: 'center', cellWidth: 15 },
                        1: { cellWidth: 80 },
                        2: { halign: 'center', cellWidth: 20 },
                        3: { halign: 'right' },
                        4: { halign: 'right' },
                        5: { halign: 'center' }
                    }
                });

                yPosition = doc.lastAutoTable.finalY + 15;
            }

            // Status Breakdown
            if (exportOptions.includePaymentAnalysis) {
                setExportProgress(85);

                if (yPosition > 150) {
                    doc.addPage();
                    yPosition = 20;
                }

                doc.setFontSize(14);
                doc.setFont(undefined, 'bold');
                doc.text('Status & Payment Analysis', 20, yPosition);
                yPosition += 8;

                autoTable(doc, {
                    startY: yPosition,
                    head: [['Status', 'Count', 'Total Amount', 'Paid', 'Unpaid']],
                    body: reportData.statusBreakdown.map(status => [
                        status.status,
                        status.count.toString(),
                        formatCurrencyPDF(status.totalAmount),
                        formatCurrencyPDF(status.paidAmount),
                        formatCurrencyPDF(status.unpaidAmount)
                    ]),
                    theme: 'striped',
                    headStyles: {
                        fillColor: [68, 114, 196],
                        fontSize: 10,
                        fontStyle: 'bold'
                    },
                    styles: { fontSize: 9 },
                    columnStyles: {
                        1: { halign: 'center' },
                        2: { halign: 'right' },
                        3: { halign: 'right' },
                        4: { halign: 'right' }
                    }
                });

                yPosition = doc.lastAutoTable.finalY;
            }

            // Footer on each page
            const pageCount = doc.internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i += 1) {
                doc.setPage(i);
                doc.setFontSize(8);
                doc.setTextColor(128, 128, 128);
                doc.text(
                    `${COMPANY_NAME} | Inventory Report | Page ${i} of ${pageCount}`,
                    148.5,
                    200,
                    { align: 'center' }
                );
                doc.text(
                    `Generated: ${format(new Date(), 'dd MMM yyyy HH:mm')}`,
                    148.5,
                    204,
                    { align: 'center' }
                );
            }

            setExportProgress(95);

            doc.save(`Inventory_Report_${startDate}_to_${endDate}.pdf`);

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
                            <Form.Select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
                                {statuses.map((status) => (
                                    <option key={status} value={status}>
                                        {status === 'all' ? 'All Status' : status}
                                    </option>
                                ))}
                            </Form.Select>
                        </Col>
                        <Col md={2}>
                            <Form.Label>Category</Form.Label>
                            <Form.Select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
                                {categories.map((cat) => (
                                    <option key={cat} value={cat}>
                                        {cat === 'all' ? 'All Categories' : cat}
                                    </option>
                                ))}
                            </Form.Select>
                        </Col>
                        <Col md={2}>
                            <Button variant="primary" className="w-100" style={{maxWidth: '150px'}} onClick={fetchInventoryReport} disabled={loading}>
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
                                <Button
                                    variant="success"
                                    onClick={() => handleExportClick('Excel')}
                                    disabled={exporting}
                                >
                                    <CsLineIcons icon="file-text" className="me-2" />
                                    Excel
                                </Button>
                                <Button
                                    variant="danger"
                                    onClick={() => handleExportClick('PDF')}
                                    disabled={exporting}
                                >
                                    <CsLineIcons icon="file-text" className="me-2" />
                                    PDF
                                </Button>

                                {exporting && (
                                    <div className="flex-grow-1 ms-3">
                                        <div className="d-flex align-items-center">
                                            <Spinner animation="border" size="sm" className="me-2" />
                                            <span className="me-2">Generating {exportType}...</span>
                                        </div>
                                        <ProgressBar
                                            now={exportProgress}
                                            label={`${exportProgress}%`}
                                            className="mt-2"
                                            style={{ height: '20px' }}
                                        />
                                    </div>
                                )}
                            </div>
                        </Card.Body>
                    </Card>

                    {/* Summary Cards */}
                    <Row className="mb-4">
                        <Col lg={3} md={6} className="mb-3">
                            <Card className="border-primary">
                                <Card.Body>
                                    <div className="d-flex justify-content-between align-items-start">
                                        <div>
                                            <div className="text-muted mb-1">Total Purchases</div>
                                            <div className="text-primary h3 mb-0">{reportData.summary.totalPurchases}</div>
                                            <div className="text-muted mt-1" style={{fontSize: '12px'}}>Purchase orders</div>
                                        </div>
                                        <div className="sh-5 sw-5 bg-primary rounded-xl d-flex justify-content-center align-items-center">
                                            <CsLineIcons icon="shopping-bag" className="text-white" />
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
                                            <div className="text-muted mb-1">Total Amount</div>
                                            <div className="text-success h3 mb-0">{formatCurrency(reportData.summary.totalAmount)}</div>
                                            <div className="text-muted mt-1" style={{fontSize: '12px'}}>Purchase value</div>
                                        </div>
                                        <div className="sh-5 sw-5 bg-success rounded-xl d-flex justify-content-center align-items-center">
                                            <CsLineIcons icon="wallet" className="text-white" />
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
                                            <div className="text-muted mb-1">Unpaid Amount</div>
                                            <div className="text-danger h3 mb-0">{formatCurrency(reportData.summary.totalUnpaid)}</div>
                                            <div className="text-muted mt-1" style={{fontSize: '12px'}}>Outstanding</div>
                                        </div>
                                        <div className="sh-5 sw-5 bg-danger rounded-xl d-flex justify-content-center align-items-center">
                                            <CsLineIcons icon="credit-card" className="text-white" />
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
                                            <div className="text-muted mb-1">Payment Rate</div>
                                            <div className="text-warning h3 mb-0">{reportData.summary.paymentRate}%</div>
                                            <div className="text-muted mt-1" style={{fontSize: '12px'}}>Collection efficiency</div>
                                        </div>
                                        <div className="sh-5 sw-5 bg-warning rounded-xl d-flex justify-content-center align-items-center">
                                            <CsLineIcons icon="check-circle" className="text-white" />
                                        </div>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>

                    {/* Payment Status Overview */}
                    <Card className="mb-4">
                        <Card.Body>
                            <h5 className="mb-3">Payment Status Overview</h5>
                            <Row>
                                <Col md={4}>
                                    <Card className="border-success">
                                        <Card.Body>
                                            <div className="d-flex align-items-center">
                                                <div className="sh-5 sw-5 bg-success rounded-xl d-flex justify-content-center align-items-center me-3">
                                                    <CsLineIcons icon="check" className="text-white" size="20" />
                                                </div>
                                                <div>
                                                    <div className="text-muted">Fully Paid</div>
                                                    <div className="h4 mb-0">{reportData.summary.fullyPaidCount}</div>
                                                </div>
                                            </div>
                                        </Card.Body>
                                    </Card>
                                </Col>
                                <Col md={4}>
                                    <Card className="border-warning">
                                        <Card.Body>
                                            <div className="d-flex align-items-center">
                                                <div className="sh-5 sw-5 bg-warning rounded-xl d-flex justify-content-center align-items-center me-3">
                                                    <CsLineIcons icon="clock" className="text-white" size="20" />
                                                </div>
                                                <div>
                                                    <div className="text-muted">Partially Paid</div>
                                                    <div className="h4 mb-0">{reportData.summary.partiallyPaidCount}</div>
                                                </div>
                                            </div>
                                        </Card.Body>
                                    </Card>
                                </Col>
                                <Col md={4}>
                                    <Card className="border-danger">
                                        <Card.Body>
                                            <div className="d-flex align-items-center">
                                                <div className="sh-5 sw-5 bg-danger rounded-xl d-flex justify-content-center align-items-center me-3">
                                                    <CsLineIcons icon="close" className="text-white" size="20" />
                                                </div>
                                                <div>
                                                    <div className="text-muted">Unpaid</div>
                                                    <div className="h4 mb-0">{reportData.summary.unpaidCount}</div>
                                                </div>
                                            </div>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            </Row>
                        </Card.Body>
                    </Card>

                    {/* Vendor Performance */}
                    <Card className="mb-4">
                        <Card.Body>
                            <h5 className="mb-3">Vendor Performance</h5>
                            <div className="table-responsive">
                                <Table striped hover>
                                    <thead>
                                        <tr>
                                            <th>Rank</th>
                                            <th>Vendor Name</th>
                                            <th className="text-end">Purchases</th>
                                            <th className="text-end">Total Amount</th>
                                            <th className="text-end">Paid Amount</th>
                                            <th className="text-end">Unpaid Amount</th>
                                            <th className="text-end">Avg Purchase</th>
                                            <th className="text-center">Payment Rate</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {reportData.vendorPerformance.map((vendor, idx) => (
                                            <tr key={idx}>
                                                <td>
                                                    <Badge bg={idx < 3 ? 'primary' : 'secondary'}>{idx + 1}</Badge>
                                                </td>
                                                <td className="font-weight-bold">{vendor.vendorName}</td>
                                                <td className="text-end">{vendor.purchaseCount}</td>
                                                <td className="text-end font-weight-bold text-primary">{formatCurrency(vendor.totalAmount)}</td>
                                                <td className="text-end text-success">{formatCurrency(vendor.paidAmount)}</td>
                                                <td className="text-end text-danger">{formatCurrency(vendor.unpaidAmount)}</td>
                                                <td className="text-end">{formatCurrency(vendor.avgPurchaseValue)}</td>
                                                <td className="text-center">
                                                    <Badge bg={vendor.paymentRate >= 90 ? 'success' : vendor.paymentRate >= 70 ? 'warning' : 'danger'}>
                                                        {vendor.paymentRate}%
                                                    </Badge>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            </div>
                        </Card.Body>
                    </Card>

                    {/* Category Performance */}
                    <Card className="mb-4">
                        <Card.Body>
                            <h5 className="mb-3">Category Performance</h5>
                            <Row>
                                {reportData.categoryPerformance.map((category, idx) => (
                                    <Col lg={4} md={6} key={idx} className="mb-3">
                                        <Card className="border">
                                            <Card.Body>
                                                <div className="d-flex justify-content-between align-items-start mb-2">
                                                    <div>
                                                        <h6 className="mb-1">{category.category}</h6>
                                                        <div className="text-muted" style={{fontSize: '12px'}}>{category.purchaseCount} purchases</div>
                                                    </div>
                                                    <Badge bg="primary">{formatCurrency(category.totalAmount)}</Badge>
                                                </div>

                                                <div className="mb-2">
                                                    <div className="d-flex justify-content-between mb-1" style={{fontSize: '12px'}}>
                                                        <span>Paid</span>
                                                        <span className="font-weight-bold text-success">{formatCurrency(category.paidAmount)}</span>
                                                    </div>
                                                    <ProgressBar
                                                        now={(category.paidAmount / category.totalAmount) * 100}
                                                        variant="success"
                                                    />
                                                </div>

                                                <div className="d-flex justify-content-between" style={{fontSize: '12px'}}>
                                                    <span>Unpaid:</span>
                                                    <span className="font-weight-bold text-danger">{formatCurrency(category.unpaidAmount)}</span>
                                                </div>
                                                <div className="d-flex justify-content-between" style={{fontSize: '12px'}}>
                                                    <span>Avg Purchase:</span>
                                                    <span className="font-weight-bold">{formatCurrency(category.avgPurchaseValue)}</span>
                                                </div>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                ))}
                            </Row>
                        </Card.Body>
                    </Card>

                    {/* Top Items by Quantity */}
                    <Card className="mb-4">
                        <Card.Body>
                            <h5 className="mb-3">Top Items by Quantity</h5>
                            <div className="table-responsive">
                                <Table striped hover>
                                    <thead>
                                        <tr>
                                            <th>Rank</th>
                                            <th>Item Name</th>
                                            <th>Unit</th>
                                            <th className="text-end">Total Quantity</th>
                                            <th className="text-end">Total Value</th>
                                            <th className="text-end">Purchases</th>
                                            <th className="text-end">Avg Price</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {reportData.topItemsByQuantity.slice(0, 20).map((item, idx) => (
                                            <tr key={idx}>
                                                <td>
                                                    <Badge bg={idx < 10 ? 'primary' : 'secondary'}>{idx + 1}</Badge>
                                                </td>
                                                <td className="font-weight-bold">{item.itemName}</td>
                                                <td>{item.unit || 'N/A'}</td>
                                                <td className="text-end font-weight-bold text-primary">{item.totalQuantity}</td>
                                                <td className="text-end">{formatCurrency(item.totalValue)}</td>
                                                <td className="text-end">{item.purchaseCount}</td>
                                                <td className="text-end">{formatCurrency(item.avgPrice)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            </div>
                        </Card.Body>
                    </Card>

                    {/* Status Breakdown */}
                    <Card className="mb-4">
                        <Card.Body>
                            <h5 className="mb-3">Status Breakdown</h5>
                            <div className="table-responsive">
                                <Table striped hover>
                                    <thead>
                                        <tr>
                                            <th>Status</th>
                                            <th className="text-end">Count</th>
                                            <th className="text-end">Total Amount</th>
                                            <th className="text-end">Paid Amount</th>
                                            <th className="text-end">Unpaid Amount</th>
                                            <th className="text-end">% of Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {reportData.statusBreakdown.map((status, idx) => (
                                            <tr key={idx}>
                                                <td className="font-weight-bold">
                                                    <Badge
                                                        bg={status.status === 'Completed' ? 'success' :
                                                            status.status === 'Pending' ? 'warning' : 'secondary'}
                                                    >
                                                        {status.status}
                                                    </Badge>
                                                </td>
                                                <td className="text-end">{status.count}</td>
                                                <td className="text-end font-weight-bold text-primary">{formatCurrency(status.totalAmount)}</td>
                                                <td className="text-end text-success">{formatCurrency(status.paidAmount)}</td>
                                                <td className="text-end text-danger">{formatCurrency(status.unpaidAmount)}</td>
                                                <td className="text-end">{((status.totalAmount / reportData.summary.totalAmount) * 100).toFixed(1)}%</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            </div>
                        </Card.Body>
                    </Card>

                    {/* Inventory Insights */}
                    <Card className="mb-4">
                        <Card.Body>
                            <h5 className="mb-3">Inventory Management Insights</h5>
                            <Row>
                                <Col md={6}>
                                    <Alert variant="info">
                                        <Alert.Heading className="h6">
                                            <CsLineIcons icon="shield" className="me-2" />
                                            Vendor Management
                                        </Alert.Heading>
                                        <p className="mb-0" style={{fontSize: '12px'}}>
                                            Working with {reportData.vendorPerformance.length} vendors.
                                            Top vendor contributes {reportData.vendorPerformance.length > 0 ?
                                                ((reportData.vendorPerformance[0].totalAmount / reportData.summary.totalAmount) * 100).toFixed(1) : 0}%
                                            of total purchases. Consider diversifying suppliers for better pricing.
                                        </p>
                                    </Alert>
                                </Col>

                                <Col md={6}>
                                    <Alert variant="warning">
                                        <Alert.Heading className="h6">
                                            <CsLineIcons icon="credit-card" className="me-2" />
                                            Payment Management
                                        </Alert.Heading>
                                        <p className="mb-0" style={{fontSize: '12px'}}>
                                            Payment rate: {reportData.summary.paymentRate}%.
                                            {reportData.summary.unpaidCount > 0 &&
                                                ` ${reportData.summary.unpaidCount} purchases pending payment worth ${formatCurrency(reportData.summary.totalUnpaid)}.`}
                                            {reportData.summary.paymentRate < 80 && ' Consider improving payment collection.'}
                                        </p>
                                    </Alert>
                                </Col>

                                <Col md={6}>
                                    <Alert variant="success">
                                        <Alert.Heading className="h6">
                                            <CsLineIcons icon="trend-up" className="me-2" />
                                            Purchase Analysis
                                        </Alert.Heading>
                                        <p className="mb-0" style={{fontSize: '12px'}}>
                                            Average purchase value: {formatCurrency(reportData.summary.avgPurchaseValue)}.
                                            Total of {reportData.summary.totalPurchases} purchases across {reportData.categoryPerformance.length} categories.
                                            Most active category: {reportData.categoryPerformance[0]?.category || 'N/A'}.
                                        </p>
                                    </Alert>
                                </Col>

                                <Col md={6}>
                                    <Alert variant="primary">
                                        <Alert.Heading className="h6">
                                            <CsLineIcons icon="tag" className="me-2" />
                                            Top Items
                                        </Alert.Heading>
                                        <p className="mb-0" style={{fontSize: '12px'}}>
                                            Most purchased item: {reportData.topItemsByQuantity[0]?.itemName || 'N/A'}
                                            ({reportData.topItemsByQuantity[0]?.totalQuantity || 0} units).
                                            Monitor stock levels and optimize reorder points for frequently purchased items.
                                        </p>
                                    </Alert>
                                </Col>
                            </Row>
                        </Card.Body>
                    </Card>
                </>
            )}

            {/* Export Options Modal */}
            <Modal
                show={showExportModal}
                onHide={() => setShowExportModal(false)}
                size="lg"
            >
                <Modal.Header closeButton>
                    <Modal.Title>Export Options - {exportType}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p className="text-muted mb-4">
                        Select which sections to include in your {exportType} export
                    </p>

                    <Form>
                        <Form.Check
                            type="checkbox"
                            id="includeSummary"
                            label="Inventory Summary & Key Metrics"
                            checked={exportOptions.includeSummary}
                            onChange={(e) => setExportOptions({
                                ...exportOptions,
                                includeSummary: e.target.checked
                            })}
                            className="mb-3"
                        />

                        <Form.Check
                            type="checkbox"
                            id="includeVendorPerformance"
                            label="Vendor Performance Analysis"
                            checked={exportOptions.includeVendorPerformance}
                            onChange={(e) => setExportOptions({
                                ...exportOptions,
                                includeVendorPerformance: e.target.checked
                            })}
                            className="mb-3"
                        />

                        <Form.Check
                            type="checkbox"
                            id="includeCategoryPerformance"
                            label="Category Performance"
                            checked={exportOptions.includeCategoryPerformance}
                            onChange={(e) => setExportOptions({
                                ...exportOptions,
                                includeCategoryPerformance: e.target.checked
                            })}
                            className="mb-3"
                        />

                        <div className="mb-3">
                            <Form.Check
                                type="checkbox"
                                id="includeTopItems"
                                label="Top Items Analysis"
                                checked={exportOptions.includeTopItems}
                                onChange={(e) => setExportOptions({
                                    ...exportOptions,
                                    includeTopItems: e.target.checked
                                })}
                            />
                            {exportOptions.includeTopItems && (
                                <Form.Group className="mt-2 ms-4">
                                    <Form.Label>Number of items to include:</Form.Label>
                                    <Form.Select
                                        value={exportOptions.itemsLimit}
                                        onChange={(e) => setExportOptions({
                                            ...exportOptions,
                                            itemsLimit: e.target.value
                                        })}
                                    >
                                        <option value="20">Top 20</option>
                                        <option value="50">Top 50</option>
                                        <option value="all">All Items</option>
                                    </Form.Select>
                                </Form.Group>
                            )}
                        </div>

                        <Form.Check
                            type="checkbox"
                            id="includeDailyTrend"
                            label="Daily Purchase Trend"
                            checked={exportOptions.includeDailyTrend}
                            onChange={(e) => setExportOptions({
                                ...exportOptions,
                                includeDailyTrend: e.target.checked
                            })}
                            className="mb-3"
                        />

                        <Form.Check
                            type="checkbox"
                            id="includePaymentAnalysis"
                            label="Status & Payment Analysis"
                            checked={exportOptions.includePaymentAnalysis}
                            onChange={(e) => setExportOptions({
                                ...exportOptions,
                                includePaymentAnalysis: e.target.checked
                            })}
                            className="mb-3"
                        />
                    </Form>

                    <Alert variant="info" className="mt-4">
                        <CsLineIcons icon="info-circle" className="me-2" />
                        <strong>Tip:</strong> Include all sections for comprehensive inventory tracking and
                        vendor management. Payment analysis helps identify outstanding amounts and collection efficiency.
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
                <Toast
                    show={showToast}
                    onClose={() => setShowToast(false)}
                    delay={3000}
                    autohide
                    bg="success"
                >
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

export default InventoryReport;