import React, { useState, useEffect } from 'react';
import { Button, Row, Col, Card, Table, Form, Spinner, Alert, Badge, ProgressBar } from 'react-bootstrap';
import axios from 'axios';
import { format } from 'date-fns';
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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

    const [startDate, setStartDate] = useState(format(new Date().setMonth(new Date().getMonth() - 1), 'yyyy-MM-dd'));
    const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));

    const API_BASE = process.env.REACT_APP_API;
    const getHeaders = () => ({
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount || 0);
    };

    const fetchFinancialReport = async () => {
        setLoading(true);
        setError(null);

        try {
            const params = {
                period: 'custom',
                start_date: startDate,
                end_date: endDate
            };

            const response = await axios.get(`${API_BASE}/statistics/financial`, {
                ...getHeaders(),
                params
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

    const exportToExcel = () => {
        if (!reportData) return;

        const wb = XLSX.utils.book_new();

        // Summary Sheet
        const summaryData = [
            ['Financial Report'],
            ['Period', `${startDate} to ${endDate}`],
            ['Generated', format(new Date(), 'PPpp')],
            [],
            ['Financial Metric', 'Amount (₹)'],
            ['Gross Revenue', reportData.summary.grossRevenue],
            ['Net Revenue', reportData.summary.netRevenue],
            ['Total Discount', reportData.summary.totalDiscount],
            ['Total Wave Off', reportData.summary.totalWaveOff],
            ['Total Tax (CGST + SGST + VAT)', reportData.summary.totalTax],
            ['CGST', reportData.summary.cgstAmount],
            ['SGST', reportData.summary.sgstAmount],
            ['VAT', reportData.summary.vatAmount],
            ['Total Paid', reportData.summary.totalPaid],
            ['Total Orders', reportData.summary.totalOrders],
            [],
            ['Key Percentages'],
            ['Discount %', (reportData.summary.discountPercentage)],
            ['Tax %', reportData.summary.taxPercentage],
        ];
        const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');

        // Daily Financials
        const dailyData = [
            ['Date', 'Gross Revenue', 'Net Revenue', 'Discount', 'Wave Off', 'Tax', 'Orders'],
            ...reportData.dailyFinancials.map(day => [
                `${day.date.year}-${String(day.date.month).padStart(2, '0')}-${String(day.date.day).padStart(2, '0')}`,
                day.grossRevenue,
                day.netRevenue,
                day.discount,
                day.waveOff,
                day.tax,
                day.orders
            ])
        ];
        const dailySheet = XLSX.utils.aoa_to_sheet(dailyData);
        XLSX.utils.book_append_sheet(wb, dailySheet, 'Daily Breakdown');

        // Payment Methods
        const paymentData = [
            ['Payment Method', 'Total Amount', 'Paid Amount', 'Order Count'],
            ...reportData.paymentMethodFinancials.map(payment => [
                payment.paymentMethod,
                payment.totalAmount,
                payment.paidAmount,
                payment.orderCount
            ])
        ];
        const paymentSheet = XLSX.utils.aoa_to_sheet(paymentData);
        XLSX.utils.book_append_sheet(wb, paymentSheet, 'Payment Methods');

        XLSX.writeFile(wb, `Financial_Report_${startDate}_to_${endDate}.xlsx`);
    };

    const exportToPDF = () => {
        if (!reportData) return;

        const doc = new jsPDF();
        let yPosition = 20;

        doc.setFontSize(20);
        doc.text('Financial Report', 14, yPosition);
        yPosition += 10;

        doc.setFontSize(10);
        doc.text(`Period: ${startDate} to ${endDate}`, 14, yPosition);
        yPosition += 6;
        doc.text(`Generated: ${format(new Date(), 'PPpp')}`, 14, yPosition);
        yPosition += 15;

        // Financial Summary
        doc.setFontSize(14);
        doc.text('Financial Summary', 14, yPosition);
        yPosition += 8;

        autoTable({
            startY: yPosition,
            head: [['Metric', 'Amount']],
            body: [
                ['Gross Revenue', formatCurrency(reportData.summary.grossRevenue)],
                ['Net Revenue', formatCurrency(reportData.summary.netRevenue)],
                ['Total Discount', formatCurrency(reportData.summary.totalDiscount)],
                ['Total Wave Off', formatCurrency(reportData.summary.totalWaveOff)],
                ['Total Tax', formatCurrency(reportData.summary.totalTax)],
                ['Total Orders', reportData.summary.totalOrders],
            ],
            theme: 'grid',
            headStyles: { fillColor: [41, 128, 185] }
        });

        yPosition = doc.lastAutoTable.finalY + 15;

        // Tax Breakdown
        if (yPosition > 240) {
            doc.addPage();
            yPosition = 20;
        }

        doc.setFontSize(14);
        doc.text('Tax Breakdown', 14, yPosition);
        yPosition += 8;

        autoTable({
            startY: yPosition,
            head: [['Tax Type', 'Amount']],
            body: [
                ['CGST', formatCurrency(reportData.summary.cgstAmount)],
                ['SGST', formatCurrency(reportData.summary.sgstAmount)],
                ['VAT', formatCurrency(reportData.summary.vatAmount)],
            ],
            theme: 'striped',
            headStyles: { fillColor: [41, 128, 185] }
        });

        yPosition = doc.lastAutoTable.finalY + 15;

        // Payment Methods
        if (yPosition > 240) {
            doc.addPage();
            yPosition = 20;
        }

        doc.setFontSize(14);
        doc.text('Payment Methods', 14, yPosition);
        yPosition += 8;

        autoTable({
            startY: yPosition,
            head: [['Method', 'Amount', 'Orders']],
            body: reportData.paymentMethodFinancials.map(payment => [
                payment.paymentMethod,
                formatCurrency(payment.totalAmount),
                payment.orderCount
            ]),
            theme: 'striped',
            headStyles: { fillColor: [41, 128, 185] }
        });

        doc.save(`Financial_Report_${startDate}_to_${endDate}.pdf`);
    };

    const sortedDailyFinancials = reportData
        ? [...reportData.dailyFinancials].sort((a, b) => {
            const dateA = new Date(a.date.year, a.date.month - 1, a.date.day);
            const dateB = new Date(b.date.year, b.date.month - 1, b.date.day);
            return dateB - dateA; // latest first
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
                            <Form.Control
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                        </Col>
                        <Col md={4}>
                            <Form.Label>End Date</Form.Label>
                            <Form.Control
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                        </Col>
                        <Col md={4}>
                            <Button variant="primary" className="w-100" onClick={fetchFinancialReport}>
                                <CsLineIcons icon="sync" className="me-2" />
                                Generate Report
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
                            <div className="d-flex gap-2">
                                <Button variant="success" onClick={exportToExcel}>
                                    <CsLineIcons icon="file-text" className="me-2" />
                                    Export to Excel
                                </Button>
                                <Button variant="danger" onClick={exportToPDF}>
                                    <CsLineIcons icon="file-pdf" className="me-2" />
                                    Export to PDF
                                </Button>
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
                                            <div className="text-muted text-small mb-1">Gross Revenue</div>
                                            <div className="text-primary h4 mb-0">{formatCurrency(reportData.summary.grossRevenue)}</div>
                                            <div className="text-small text-muted mt-1">Before deductions</div>
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
                                            <div className="text-muted text-small mb-1">Net Revenue</div>
                                            <div className="text-success h4 mb-0">{formatCurrency(reportData.summary.netRevenue)}</div>
                                            <div className="text-small text-muted mt-1">After deductions</div>
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
                                            <div className="text-muted text-small mb-1">Total Deductions</div>
                                            <div className="text-danger h4 mb-0">
                                                {formatCurrency(reportData.summary.totalDiscount + reportData.summary.totalWaveOff)}
                                            </div>
                                            <div className="text-small text-muted mt-1">
                                                {reportData.summary.discountPercentage}% of gross
                                            </div>
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
                                            <div className="text-muted text-small mb-1">Total Tax</div>
                                            <div className="text-warning h4 mb-0">{formatCurrency(reportData.summary.totalTax)}</div>
                                            <div className="text-small text-muted mt-1">
                                                {reportData.summary.taxPercentage}% of net revenue
                                            </div>
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
                            <h5 className="mb-3">Revenue Flow Analysis</h5>
                            <Row>
                                <Col md={6}>
                                    <div className="mb-3">
                                        <div className="d-flex justify-content-between mb-2">
                                            <span className="font-weight-bold">Gross Revenue</span>
                                            <span className="font-weight-bold text-primary">
                                                {formatCurrency(reportData.summary.grossRevenue)}
                                            </span>
                                        </div>
                                        <ProgressBar now={100} variant="primary" />
                                    </div>

                                    <div className="mb-3 ms-3">
                                        <div className="d-flex justify-content-between mb-2">
                                            <span className="text-danger">- Discount</span>
                                            <span className="text-danger">{formatCurrency(reportData.summary.totalDiscount)}</span>
                                        </div>
                                        <ProgressBar
                                            now={(reportData.summary.totalDiscount / reportData.summary.grossRevenue) * 100}
                                            variant="danger"
                                        />
                                    </div>

                                    <div className="mb-3 ms-3">
                                        <div className="d-flex justify-content-between mb-2">
                                            <span className="text-danger">- Wave Off</span>
                                            <span className="text-danger">{formatCurrency(reportData.summary.totalWaveOff)}</span>
                                        </div>
                                        <ProgressBar
                                            now={(reportData.summary.totalWaveOff / reportData.summary.grossRevenue) * 100}
                                            variant="danger"
                                        />
                                    </div>

                                    <div className="mb-3">
                                        <div className="d-flex justify-content-between mb-2">
                                            <span className="font-weight-bold">Net Revenue</span>
                                            <span className="font-weight-bold text-success">
                                                {formatCurrency(reportData.summary.netRevenue)}
                                            </span>
                                        </div>
                                        <ProgressBar
                                            now={(reportData.summary.netRevenue / reportData.summary.grossRevenue) * 100}
                                            variant="success"
                                        />
                                    </div>
                                </Col>

                                <Col md={6}>
                                    <Card className="border">
                                        <Card.Body>
                                            <h6 className="mb-3">Financial Health Indicators</h6>

                                            <div className="mb-3">
                                                <div className="d-flex justify-content-between text-small mb-1">
                                                    <span>Discount Ratio</span>
                                                    <Badge bg={reportData.summary.discountPercentage > 15 ? 'danger' : reportData.summary.discountPercentage > 10 ? 'warning' : 'success'}>
                                                        {reportData.summary.discountPercentage}%
                                                    </Badge>
                                                </div>
                                                <ProgressBar
                                                    now={reportData.summary.discountPercentage}
                                                    max={20}
                                                    variant={reportData.summary.discountPercentage > 15 ? 'danger' : reportData.summary.discountPercentage > 10 ? 'warning' : 'success'}
                                                />
                                                <small className="text-muted">Ideal: Under 10%</small>
                                            </div>

                                            <div className="mb-3">
                                                <div className="d-flex justify-content-between text-small mb-1">
                                                    <span>Tax Efficiency</span>
                                                    <Badge bg="info">{reportData.summary.taxPercentage}%</Badge>
                                                </div>
                                                <ProgressBar now={reportData.summary.taxPercentage} max={20} variant="info" />
                                                <small className="text-muted">Of net revenue</small>
                                            </div>

                                            <div>
                                                <div className="d-flex justify-content-between text-small mb-1">
                                                    <span>Collection Rate</span>
                                                    <Badge bg="success">
                                                        {((reportData.summary.totalPaid / reportData.summary.netRevenue) * 100).toFixed(1)}%
                                                    </Badge>
                                                </div>
                                                <ProgressBar
                                                    now={(reportData.summary.totalPaid / reportData.summary.netRevenue) * 100}
                                                    variant="success"
                                                />
                                                <small className="text-muted">Payment collected</small>
                                            </div>
                                        </Card.Body>
                                    </Card>
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
                                    <ProgressBar
                                        now={(reportData.summary.cgstAmount / reportData.summary.totalTax) * 100}
                                        variant="primary"
                                        className="mb-2"
                                    />
                                    <div className="text-small text-muted">
                                        {((reportData.summary.cgstAmount / reportData.summary.totalTax) * 100).toFixed(1)}% of total tax
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>

                        <Col lg={4} md={6} className="mb-3">
                            <Card className="h-100">
                                <Card.Body>
                                    <h6 className="mb-3">SGST (State GST)</h6>
                                    <div className="text-success h3 mb-2">{formatCurrency(reportData.summary.sgstAmount)}</div>
                                    <ProgressBar
                                        now={(reportData.summary.sgstAmount / reportData.summary.totalTax) * 100}
                                        variant="success"
                                        className="mb-2"
                                    />
                                    <div className="text-small text-muted">
                                        {((reportData.summary.sgstAmount / reportData.summary.totalTax) * 100).toFixed(1)}% of total tax
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>

                        <Col lg={4} md={6} className="mb-3">
                            <Card className="h-100">
                                <Card.Body>
                                    <h6 className="mb-3">VAT (Value Added Tax)</h6>
                                    <div className="text-info h3 mb-2">{formatCurrency(reportData.summary.vatAmount)}</div>
                                    <ProgressBar
                                        now={(reportData.summary.vatAmount / reportData.summary.totalTax) * 100}
                                        variant="info"
                                        className="mb-2"
                                    />
                                    <div className="text-small text-muted">
                                        {((reportData.summary.vatAmount / reportData.summary.totalTax) * 100).toFixed(1)}% of total tax
                                    </div>
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
                                                        <div className="text-muted text-small">{payment.orderCount} orders</div>
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
                                                    <div className="d-flex justify-content-between text-small mb-1">
                                                        <span>Total Amount</span>
                                                        <span className="font-weight-bold text-primary">
                                                            {formatCurrency(payment.totalAmount)}
                                                        </span>
                                                    </div>
                                                    <ProgressBar
                                                        now={(payment.totalAmount / reportData.summary.netRevenue) * 100}
                                                        variant="primary"
                                                    />
                                                </div>

                                                <div className="d-flex justify-content-between text-small">
                                                    <span>Paid Amount:</span>
                                                    <span className="font-weight-bold text-success">{formatCurrency(payment.paidAmount)}</span>
                                                </div>
                                                <div className="d-flex justify-content-between text-small">
                                                    <span>% of Total:</span>
                                                    <span className="font-weight-bold">
                                                        {((payment.totalAmount / reportData.summary.netRevenue) * 100).toFixed(1)}%
                                                    </span>
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
                                                    <td className="font-weight-bold">
                                                        {format(
                                                            new Date(day.date.year, day.date.month - 1, day.date.day),
                                                            'dd-MM-yyyy'
                                                        )}
                                                    </td>
                                                    <td className="text-end">{formatCurrency(day.grossRevenue)}</td>
                                                    <td className="text-end text-danger">{formatCurrency(day.discount)}</td>
                                                    <td className="text-end text-danger">{formatCurrency(day.waveOff)}</td>
                                                    <td className="text-end font-weight-bold text-success">
                                                        {formatCurrency(day.netRevenue)}
                                                    </td>
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
                                            <td className="text-end">
                                                {formatCurrency(reportData.summary.netRevenue / reportData.summary.totalOrders)}
                                            </td>
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
                                        <p className="mb-0 text-small">
                                            Your discount rate is {reportData.summary.discountPercentage}%.
                                            {reportData.summary.discountPercentage > 15 && ' This is high and may impact profitability. Consider reviewing discount policies.'}
                                            {reportData.summary.discountPercentage > 10 && reportData.summary.discountPercentage <= 15 && ' This is moderate. Monitor to ensure profitability.'}
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
                                        <p className="mb-0 text-small">
                                            Total tax collected: {formatCurrency(reportData.summary.totalTax)} ({reportData.summary.taxPercentage}% of net revenue).
                                            Ensure timely filing and remittance of CGST ({formatCurrency(reportData.summary.cgstAmount)}),
                                            SGST ({formatCurrency(reportData.summary.sgstAmount)}), and VAT ({formatCurrency(reportData.summary.vatAmount)}).
                                        </p>
                                    </Alert>
                                </Col>

                                <Col md={6}>
                                    <Alert variant="success">
                                        <Alert.Heading className="h6">
                                            <CsLineIcons icon="trend-up" className="me-2" />
                                            Revenue Health
                                        </Alert.Heading>
                                        <p className="mb-0 text-small">
                                            Net revenue of {formatCurrency(reportData.summary.netRevenue)} from {reportData.summary.totalOrders} orders.
                                            Average order value: {formatCurrency(reportData.summary.netRevenue / reportData.summary.totalOrders)}.
                                            Collection rate: {((reportData.summary.totalPaid / reportData.summary.netRevenue) * 100).toFixed(1)}%.
                                        </p>
                                    </Alert>
                                </Col>

                                <Col md={6}>
                                    <Alert variant="warning">
                                        <Alert.Heading className="h6">
                                            <CsLineIcons icon="shield" className="me-2" />
                                            Payment Methods
                                        </Alert.Heading>
                                        <p className="mb-0 text-small">
                                            {reportData.paymentMethodFinancials.length} payment methods in use.
                                            Most used: {reportData.paymentMethodFinancials[0]?.paymentMethod}
                                            ({((reportData.paymentMethodFinancials[0]?.totalAmount / reportData.summary.netRevenue) * 100).toFixed(1)}% of revenue).
                                            Diversify payment options for customer convenience.
                                        </p>
                                    </Alert>
                                </Col>
                            </Row>
                        </Card.Body>
                    </Card>
                </>
            )}
        </>
    );
};

export default FinancialReport;