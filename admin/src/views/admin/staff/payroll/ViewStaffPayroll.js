import React, { useEffect, useState } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import axios from 'axios';
import {
    Row, Col, Card, Button, Alert, Spinner, Badge,
    Modal, Form, ProgressBar, Toast, ToastContainer, Table,
} from 'react-bootstrap';
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Document, Packer, Paragraph, Table as DocxTable, TableCell, TableRow, TextRun, AlignmentType, WidthType } from 'docx';
import { format } from 'date-fns';

const MONTH_NAMES = [
    '', 'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
];

export default function ViewStaffPayroll() {
    const { staffId } = useParams();
    const history = useHistory();

    const main_title = 'Staff Payroll History';
    const description = 'View complete payroll history for a staff member';

    const [staffData, setStaffData] = useState(null);
    const [payroll, setPayroll] = useState([]);
    const [careerStats, setCareerStats] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Filters
    const [yearFilter, setYearFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');

    // Export
    const [exporting, setExporting] = useState(false);
    const [exportProgress, setExportProgress] = useState(0);
    const [exportType, setExportType] = useState('');
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [showExportModal, setShowExportModal] = useState(false);

    // Detail modal
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedPayroll, setSelectedPayroll] = useState(null);

    const breadcrumbs = [
        { to: '', text: 'Home' },
        { to: 'payroll', text: 'Payroll' },
        { to: `payroll/view/${staffId}`, text: 'Staff Payroll' },
    ];

    const authHeader = () => ({
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    });

    const showSuccessToast = (msg) => {
        setToastMessage(msg);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
    };

    // ── Fetch ────────────────────────────────────────────────────────────────────
    const fetchPayroll = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await axios.get(
                `${process.env.REACT_APP_API}/payroll/get/${staffId}`,
                authHeader()
            );
            setStaffData(res.data.data.staff);
            setPayroll(res.data.data.payroll || []);
            setCareerStats(res.data.data.career_stats || {});
        } catch (err) {
            setError('Failed to load payroll data.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchPayroll(); }, [staffId]);

    // ── Filtered records ─────────────────────────────────────────────────────────
    const filteredPayroll = payroll.filter((p) => {
        if (yearFilter !== 'all' && p.year !== Number(yearFilter)) return false;
        if (statusFilter !== 'all' && p.status !== statusFilter) return false;
        return true;
    });

    // Unique years in payroll
    const years = [...new Set(payroll.map((p) => p.year))].sort((a, b) => b - a);

    // ── Filtered stats ───────────────────────────────────────────────────────────
    const filteredStats = {
        total_net: filteredPayroll.reduce((s, p) => s + (p.net_salary || 0), 0),
        total_paid: filteredPayroll.filter((p) => p.status === 'paid').reduce((s, p) => s + (p.net_salary || 0), 0),
        total_unpaid: filteredPayroll.filter((p) => p.status === 'unpaid').reduce((s, p) => s + (p.net_salary || 0), 0),
        total_bonus: filteredPayroll.reduce((s, p) => s + (p.bonus || 0), 0),
        total_deductions: filteredPayroll.reduce((s, p) => s + (p.deductions || 0), 0),
        total_overtime: filteredPayroll.reduce((s, p) => s + (p.overtime_pay || 0), 0),
    };

    // ── Export: Excel ────────────────────────────────────────────────────────────
    const exportToExcel = async () => {
        if (!staffData) return;
        setExporting(true); setExportProgress(10); setExportType('Excel');
        try {
            const wb = XLSX.utils.book_new();

            // Dashboard
            setExportProgress(20);
            const dashData = [
                ['PAYROLL REPORT'], [],
                ['Staff ID:', staffData.staff_id],
                ['Name:', `${staffData.f_name} ${staffData.l_name}`],
                ['Position:', staffData.position],
                ['Base Salary:', `₹${staffData.salary}`],
                ['OT Rate/hr:', `₹${staffData.overtime_rate}`],
                ['Generated:', format(new Date(), 'dd MMM yyyy HH:mm')],
                [],
                ['CAREER SUMMARY'],
                ['Metric', 'Value'],
                ['Total Months', careerStats.total_months],
                ['Total Earned', `₹${careerStats.total_earned}`],
                ['Total Paid', `₹${careerStats.total_paid}`],
                ['Total Unpaid', `₹${careerStats.total_unpaid}`],
            ];
            const dashSheet = XLSX.utils.aoa_to_sheet(dashData);
            dashSheet['!cols'] = [{ wch: 20 }, { wch: 25 }];
            XLSX.utils.book_append_sheet(wb, dashSheet, 'Summary');

            // Records
            setExportProgress(50);
            const recordsData = [
                ['PAYROLL RECORDS'], [],
                ['Month', 'Year', 'Working Days', 'Present', 'Absent', 'Base Salary', 'Earned', 'OT Hours', 'OT Pay', 'Bonus', 'Deductions', 'Net Salary', 'Status', 'Paid Date'],
            ];
            filteredPayroll.forEach((p) => {
                recordsData.push([
                    MONTH_NAMES[p.month], p.year,
                    p.working_days_in_month, p.present_days, p.absent_days,
                    (staffData.salary || p.base_salary || 0), (p.earned_breakdown?.total_gross || p.earned_salary || 0),
                    p.overtime_hours, p.overtime_pay,
                    p.bonus, ((p.deduction_breakdown?.total_statutory || 0) + (p.deductions || 0)), p.net_salary,
                    p.status.toUpperCase(),
                    p.paid_date || '-',
                ]);
            });
            const recordsSheet = XLSX.utils.aoa_to_sheet(recordsData);
            recordsSheet['!cols'] = Array(14).fill({ wch: 14 });
            XLSX.utils.book_append_sheet(wb, recordsSheet, 'Payroll Records');

            setExportProgress(90);
            XLSX.writeFile(wb, `${staffData.staff_id}_Payroll_Report.xlsx`);
            setExportProgress(100);
            showSuccessToast('Excel report exported!');
        } catch (err) {
            showSuccessToast('Error exporting Excel.');
        } finally {
            setTimeout(() => { setExporting(false); setExportProgress(0); setExportType(''); }, 500);
        }
    };

    // ── Export: PDF (Report) ─────────────────────────────────────────────────────
    const exportToPDF = async () => {
        if (!staffData) return;
        setExporting(true); setExportProgress(10); setExportType('PDF');
        try {
            const doc = new jsPDF();
            let y = 20;

            // Header
            doc.setFillColor(68, 114, 196);
            doc.rect(0, 0, 210, 40, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(22); doc.setFont(undefined, 'bold');
            doc.text('PAYROLL REPORT', 105, 18, { align: 'center' });
            doc.setFontSize(13); doc.setFont(undefined, 'normal');
            doc.text(`${staffData.f_name} ${staffData.l_name}`, 105, 30, { align: 'center' });
            y = 50;
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(10);
            doc.text(`Staff ID: ${staffData.staff_id}  |  Position: ${staffData.position}  |  Base Salary: ₹${staffData.salary}  |  OT Rate: ₹${staffData.overtime_rate}/hr`, 20, y);
            y += 6;
            doc.text(`Generated: ${format(new Date(), 'dd MMM yyyy HH:mm')}`, 20, y);
            y += 14;

            setExportProgress(30);

            // Career stats boxes
            const boxes = [
                { label: 'Total Months', value: careerStats.total_months?.toString(), color: [68, 114, 196] },
                { label: 'Total Earned', value: `₹${(careerStats.total_earned || 0).toLocaleString('en-IN')}`, color: [76, 175, 80] },
                { label: 'Total Paid', value: `₹${(careerStats.total_paid || 0).toLocaleString('en-IN')}`, color: [33, 150, 243] },
                { label: 'Unpaid', value: `₹${(careerStats.total_unpaid || 0).toLocaleString('en-IN')}`, color: [244, 67, 54] },
            ];
            boxes.forEach((b, i) => {
                const x = 15 + i * 46;
                doc.setFillColor(...b.color);
                doc.roundedRect(x, y, 42, 22, 2, 2, 'F');
                doc.setTextColor(255, 255, 255);
                doc.setFontSize(7); doc.setFont(undefined, 'normal');
                doc.text(b.label, x + 21, y + 8, { align: 'center' });
                doc.setFontSize(9); doc.setFont(undefined, 'bold');
                doc.text(b.value, x + 21, y + 17, { align: 'center' });
            });
            y += 32;
            doc.setTextColor(0, 0, 0);

            setExportProgress(55);

            // Records table
            autoTable(doc, {
                startY: y,
                head: [['Month/Year', 'Present', 'Absent', 'Earned', 'OT Pay', 'Bonus', 'Deductions', 'Net Salary', 'Status']],
                body: filteredPayroll.map((p) => [
                    `${MONTH_NAMES[p.month]} ${p.year}`,
                    p.present_days,
                    p.absent_days,
                    `₹${(p.earned_breakdown?.total_gross || p.earned_salary || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
                    `₹${(p.overtime_pay || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
                    `₹${(p.bonus || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
                    `₹${((p.deduction_breakdown?.total_statutory || 0) + (p.deductions || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
                    `₹${(p.net_salary || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
                    p.status.toUpperCase(),
                ]),
                theme: 'striped',
                headStyles: { fillColor: [68, 114, 196], fontSize: 8, fontStyle: 'bold' },
                styles: { fontSize: 7.5 },
                columnStyles: { 8: { halign: 'center' } },
            });

            setExportProgress(90);
            const pages = doc.internal.getNumberOfPages();
            for (let i = 1; i <= pages; i++) {
                doc.setPage(i);
                doc.setFontSize(7); doc.setTextColor(128, 128, 128);
                doc.text(`${staffData.staff_id} — Payroll Report | Page ${i} of ${pages}`, 105, 292, { align: 'center' });
            }
            doc.save(`${staffData.staff_id}_Payroll_Report.pdf`);
            setExportProgress(100);
            showSuccessToast('PDF exported!');
        } catch (err) {
            showSuccessToast('Error exporting PDF.');
        } finally {
            setTimeout(() => { setExporting(false); setExportProgress(0); setExportType(''); }, 500);
        }
    };

    // ── Generate Salary Slip PDF ─────────────────────────────────────────────────
    const downloadSalarySlip = (p) => {
        try {
            const doc = new jsPDF();
            
            // Header
            doc.setFontSize(16);
            doc.setFont(undefined, 'bold');
            doc.text('SALARY SLIP', 105, 20, { align: 'center' });
            
            doc.setFontSize(10);
            doc.setFont(undefined, 'normal');
            doc.text(`For the month of ${MONTH_NAMES[p.month]} ${p.year}`, 105, 26, { align: 'center' });

            // Employee Details Box
            doc.rect(14, 32, 182, 30);
            
            doc.setFont(undefined, 'bold');
            doc.text('Employee Name:', 18, 40);
            doc.setFont(undefined, 'normal');
            doc.text(`${staffData.f_name} ${staffData.l_name}`, 55, 40);

            doc.setFont(undefined, 'bold');
            doc.text('Employee ID:', 110, 40);
            doc.setFont(undefined, 'normal');
            doc.text(`${staffData.staff_id}`, 145, 40);

            doc.setFont(undefined, 'bold');
            doc.text('Designation:', 18, 48);
            doc.setFont(undefined, 'normal');
            doc.text(`${staffData.position}`, 55, 48);

            doc.setFont(undefined, 'bold');
            doc.text('Date of Joining:', 110, 48);
            doc.setFont(undefined, 'normal');
            doc.text(`${staffData.joining_date ? format(new Date(staffData.joining_date), 'dd-MMM-yyyy') : '-'}`, 145, 48);

            doc.setFont(undefined, 'bold');
            doc.text('UAN Number:', 18, 56);
            doc.setFont(undefined, 'normal');
            doc.text(`${staffData.uan_number || '-'}`, 55, 56);

            doc.setFont(undefined, 'bold');
            doc.text('Bank A/C No:', 110, 56);
            doc.setFont(undefined, 'normal');
            doc.text(`${staffData.bank_account?.account_number || '-'}`, 145, 56);

            // Attendance summary
            doc.rect(14, 66, 182, 12);
            doc.setFontSize(9);
            doc.text(`Total Days: ${p.working_days_in_month}   |   Paid Days: ${p.leave_summary?.total_paid_days || p.present_days}   |   LWP: ${p.leave_summary?.lwp_days || p.absent_days}`, 105, 74, { align: 'center' });

            // Earnings & Deductions Tables side by side
            const totalEarnings = (p.earned_breakdown?.total_gross || p.earned_salary || 0) + (p.overtime_pay || 0) + (p.bonus || 0);
            const statDed = p.deduction_breakdown?.total_statutory || 0;
            const manDed = p.deductions || 0;
            const advDed = p.advance_deduction || 0;
            const lwpDed = p.lwp_deduction || 0;
            const totalDeductions = statDed + manDed + advDed + lwpDed;

            autoTable(doc, {
                startY: 85,
                head: [['Earnings', 'Amount (Rs.)', 'Deductions', 'Amount (Rs.)']],
                body: [
                    ['Basic', (p.earned_breakdown?.basic || 0).toFixed(2), 'Provident Fund (PF)', (p.deduction_breakdown?.pf || 0).toFixed(2)],
                    ['HRA', (p.earned_breakdown?.hra || 0).toFixed(2), 'ESI', (p.deduction_breakdown?.esi || 0).toFixed(2)],
                    ['Conveyance', (p.earned_breakdown?.conveyance || 0).toFixed(2), 'Professional Tax (PT)', (p.deduction_breakdown?.pt || 0).toFixed(2)],
                    ['Medical Allowance', (p.earned_breakdown?.medical || 0).toFixed(2), 'LWP Deduction', lwpDed.toFixed(2)],
                    ['Special Allowance', (p.earned_breakdown?.special || 0).toFixed(2), 'Advance / Loan EMI', advDed.toFixed(2)],
                    ['Overtime Pay', (p.overtime_pay || 0).toFixed(2), 'Other Deductions', manDed.toFixed(2)],
                    ['Bonus', (p.bonus || 0).toFixed(2), '', ''],
                    ['Other Earnings', (p.earned_breakdown?.other || 0).toFixed(2), '', '']
                ],
                theme: 'grid',
                headStyles: { fillColor: [68, 114, 196], textColor: 255 },
                columnStyles: {
                    0: { cellWidth: 50 },
                    1: { cellWidth: 41, halign: 'right' },
                    2: { cellWidth: 50 },
                    3: { cellWidth: 41, halign: 'right' }
                }
            });

            // Totals Row
            const finalY = doc.lastAutoTable.finalY;
            doc.setFillColor(240, 240, 240);
            doc.rect(14, finalY, 182, 10, 'F');
            doc.rect(14, finalY, 182, 10, 'S'); // border
            doc.setFont(undefined, 'bold');
            doc.text('Gross Earnings', 18, finalY + 6.5);
            doc.text(`${totalEarnings.toFixed(2)}`, 95, finalY + 6.5, { align: 'right' });
            
            doc.text('Total Deductions', 109, finalY + 6.5);
            doc.text(`${totalDeductions.toFixed(2)}`, 186, finalY + 6.5, { align: 'right' });

            // Net Pay Box
            doc.rect(14, finalY + 14, 182, 12, 'S');
            doc.setFontSize(12);
            doc.text('Net Payable:', 18, finalY + 22);
            doc.text(`Rs. ${p.net_salary.toFixed(2)}`, 186, finalY + 22, { align: 'right' });

            doc.setFontSize(9);
            doc.setFont(undefined, 'normal');
            doc.text('** This is a computer-generated document and does not require a signature.', 105, finalY + 40, { align: 'center' });

            doc.save(`${staffData.staff_id}_SalarySlip_${MONTH_NAMES[p.month]}_${p.year}.pdf`);
            showSuccessToast('Salary Slip Downloaded!');
        } catch(e) {
            console.error(e);
            showSuccessToast('Error generating Salary Slip.');
        }
    };

    // ── Export: Word ─────────────────────────────────────────────────────────────
    const exportToWord = async () => {
        if (!staffData) return;
        setExporting(true); setExportProgress(10); setExportType('Word');
        try {
            setExportProgress(40);
            const rows = [
                new TableRow({
                    children: ['Month/Year', 'Present', 'Absent', 'Earned', 'OT Pay', 'Bonus', 'Deductions', 'Net Salary', 'Status'].map(
                        (h) => new TableCell({
                            children: [new Paragraph({ children: [new TextRun({ text: h, bold: true })], alignment: AlignmentType.CENTER })],
                            width: { size: 11, type: WidthType.PERCENTAGE },
                        })
                    ),
                }),
                ...filteredPayroll.map((p) =>
                    new TableRow({
                        children: [
                            `${MONTH_NAMES[p.month]} ${p.year}`,
                            `${p.present_days}`,
                            `${p.absent_days}`,
                            `₹${p.earned_breakdown?.total_gross || p.earned_salary || 0}`,
                            `₹${p.overtime_pay}`,
                            `₹${p.bonus}`,
                            `₹${(p.deduction_breakdown?.total_statutory || 0) + (p.deductions || 0)}`,
                            `₹${p.net_salary}`,
                            p.status.toUpperCase(),
                        ].map((text) => new TableCell({ children: [new Paragraph(text)] })),
                    })
                ),
            ];

            setExportProgress(70);
            const wordDoc = new Document({
                sections: [{
                    children: [
                        new Paragraph({ text: 'Payroll Report', heading: 'Heading1', alignment: AlignmentType.CENTER }),
                        new Paragraph({ text: `${staffData.f_name} ${staffData.l_name} (${staffData.staff_id})`, alignment: AlignmentType.CENTER }),
                        new Paragraph({ text: `Position: ${staffData.position} | Base Salary: ₹${staffData.salary} | OT Rate: ₹${staffData.overtime_rate}/hr` }),
                        new Paragraph({ text: '' }),
                        new Paragraph({ text: `Total Months: ${careerStats.total_months} | Total Earned: ₹${careerStats.total_earned} | Total Paid: ₹${careerStats.total_paid} | Unpaid: ₹${careerStats.total_unpaid}` }),
                        new Paragraph({ text: '' }),
                        new DocxTable({ rows }),
                    ],
                }],
            });

            setExportProgress(90);
            Packer.toBlob(wordDoc).then((blob) => {
                saveAs(blob, `${staffData.staff_id}_Payroll_Report.docx`);
                showSuccessToast('Word exported!');
                setExportProgress(100);
            });
        } catch (err) {
            showSuccessToast('Error exporting Word.');
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

    if (loading && !staffData) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
                <Spinner animation="border" variant="primary" />
            </div>
        );
    }

    return (
        <>
            <HtmlHead title={main_title} description={description} />

            {/* ── Header ── */}
            <div className="page-title-container mb-3">
                <Row className="align-items-center">
                    <Col>
                        <h1 className="mb-0 pb-0 display-4">
                            {staffData ? `${staffData.f_name} ${staffData.l_name}'s Payroll` : main_title}
                        </h1>
                        <BreadcrumbList items={breadcrumbs} />
                    </Col>
                    <Col xs="auto">
                        <Button variant="outline-secondary" onClick={() => history.push('/staff/payroll')} className='btn-icon'>
                            <CsLineIcons icon="arrow-left" className="me-2" />Back to Payroll
                        </Button>
                    </Col>
                </Row>
            </div>

            {error && (
                <Alert variant="danger" className="mb-4">
                    <CsLineIcons icon="warning-hexagon" className="me-2" />{error}
                </Alert>
            )}

            {/* ── Staff Info ── */}
            {staffData && (
                <Card className="mb-4">
                    <Card.Header>
                        <Card.Title className="mb-0">
                            <CsLineIcons icon="user" className="me-2" />Staff Information
                        </Card.Title>
                    </Card.Header>
                    <Card.Body>
                        <Row>
                            {[
                                { label: 'Staff ID', value: staffData.staff_id },
                                { label: 'Full Name', value: `${staffData.f_name} ${staffData.l_name}` },
                                { label: 'Position', value: staffData.position },
                                { label: 'Base Salary', value: `₹${(staffData.salary || 0).toLocaleString('en-IN')}` },
                                { label: 'OT Rate/hr', value: `₹${(staffData.overtime_rate || 0).toLocaleString('en-IN')}` },
                                { label: 'Total Records', value: payroll.length },
                            ].map((item) => (
                                <Col md={2} xs={6} key={item.label} className="mb-3 mb-md-0">
                                    <div className="text-muted small">{item.label}</div>
                                    <div className="fw-bold">{item.value}</div>
                                </Col>
                            ))}
                        </Row>
                    </Card.Body>
                </Card>
            )}

            {/* ── Career Stats ── */}
            <Row className="g-3 mb-4">
                {[
                    { label: 'Total Months', value: careerStats.total_months || 0, icon: 'calendar', color: 'text-primary' },
                    { label: 'Total Earned', value: `₹${(careerStats.total_earned || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, icon: 'dollar', color: 'text-dark' },
                    { label: 'Total Paid', value: `₹${(careerStats.total_paid || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, icon: 'check-circle', color: 'text-success' },
                    { label: 'Total Unpaid', value: `₹${(careerStats.total_unpaid || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, icon: 'clock', color: 'text-warning' },
                ].map((s) => (
                    <Col xs={6} md={3} key={s.label}>
                        <Card className="h-100">
                            <Card.Body className="text-center">
                                <CsLineIcons icon={s.icon} size="24" className={`${s.color} mb-2`} />
                                <div className="text-muted small">{s.label}</div>
                                <h5 className={`mb-0 ${s.color}`}>{s.value}</h5>
                            </Card.Body>
                        </Card>
                    </Col>
                ))}
            </Row>

            {/* ── Filters ── */}
            <Card className="mb-4">
                <Card.Body>
                    <Row className="g-3 align-items-end">
                        <Col md={3}>
                            <Form.Label>Year</Form.Label>
                            <Form.Select value={yearFilter} onChange={(e) => setYearFilter(e.target.value)}>
                                <option value="all">All Years</option>
                                {years.map((y) => <option key={y} value={y}>{y}</option>)}
                            </Form.Select>
                        </Col>
                        <Col md={3}>
                            <Form.Label>Status</Form.Label>
                            <Form.Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                                <option value="all">All</option>
                                <option value="paid">Paid</option>
                                <option value="unpaid">Unpaid</option>
                            </Form.Select>
                        </Col>
                        <Col md={2}>
                            <Button variant="outline-secondary" className="w-100 btn-icon" onClick={() => { setYearFilter('all'); setStatusFilter('all'); }}>
                                Clear
                            </Button>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {/* ── Export Buttons ── */}
            {staffData && (
                <Card className="mb-4">
                    <Card.Body>
                        <div className="d-flex gap-2 align-items-center">
                            <Button variant="success" onClick={() => handleExportClick('Excel')} className='btn-icon' disabled={exporting}>
                                <CsLineIcons icon="file-text" className="me-2" />Excel
                            </Button>
                            <Button variant="danger" onClick={() => handleExportClick('PDF')} className='btn-icon' disabled={exporting}>
                                <CsLineIcons icon="file-text" className="me-2" />PDF
                            </Button>
                            <Button variant="info" onClick={() => handleExportClick('Word')} className='btn-icon' disabled={exporting}>
                                <CsLineIcons icon="file-text" className="me-2" />Word
                            </Button>
                            {exporting && (
                                <div className="flex-grow-1 ms-3">
                                    <div className="d-flex align-items-center">
                                        <Spinner animation="border" size="sm" className="me-2" />
                                        <span>Generating {exportType}...</span>
                                    </div>
                                    <ProgressBar now={exportProgress} label={`${exportProgress}%`} className="mt-2" style={{ height: '20px' }} />
                                </div>
                            )}
                        </div>
                    </Card.Body>
                </Card>
            )}

            {/* ── Payroll Records Table ── */}
            <Card>
                <Card.Header>
                    <Card.Title className="mb-0">
                        <CsLineIcons icon="layout" className="me-2" />Payroll Records
                    </Card.Title>
                </Card.Header>
                <Card.Body className="p-0">
                    {filteredPayroll.length === 0 ? (
                        <div className="text-center py-5">
                            <CsLineIcons icon="inbox" size="48" className="text-muted mb-3" />
                            <h5>No Payroll Records Found</h5>
                            <p className="text-muted">Generate payroll for this staff member first.</p>
                        </div>
                    ) : (
                        <>
                            <div className="px-3 pt-3">
                                <small className="text-muted">Showing {filteredPayroll.length} of {payroll.length} records</small>
                            </div>
                            <div className="table-responsive">
                                <Table hover className="mb-0">
                                    <thead className="table-light">
                                        <tr>
                                            <th>Month / Year</th>
                                            <th className="text-center">Working Days</th>
                                            <th className="text-center">Present</th>
                                            <th className="text-center">Absent</th>
                                            <th className="text-end">Base Salary</th>
                                            <th className="text-end">Earned</th>
                                            <th className="text-end">OT Pay</th>
                                            <th className="text-end">Bonus</th>
                                            <th className="text-end">Deductions</th>
                                            <th className="text-end fw-bold">Net Salary</th>
                                            <th className="text-center">Status</th>
                                            <th className="text-center">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredPayroll.map((p) => (
                                            <tr key={p._id}>
                                                <td>
                                                    <div className="fw-medium">{MONTH_NAMES[p.month]} {p.year}</div>
                                                    {p.paid_date && (
                                                        <small className="text-muted">Paid: {p.paid_date}</small>
                                                    )}
                                                </td>
                                                <td className="text-center">{p.working_days_in_month}</td>
                                                <td className="text-center"><Badge bg="success">{p.present_days}</Badge></td>
                                                <td className="text-center">
                                                    <Badge bg={p.absent_days > 0 ? 'danger' : 'light'} text={p.absent_days > 0 ? undefined : 'dark'}>
                                                        {p.absent_days}
                                                    </Badge>
                                                </td>
                                                <td className="text-end">₹{(staffData?.salary || p.base_salary || 0).toLocaleString('en-IN')}</td>
                                                <td className="text-end text-success">₹{(p.earned_breakdown?.total_gross || p.earned_salary || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                                <td className="text-end text-primary">
                                                    {p.overtime_pay > 0
                                                        ? `₹${(p.overtime_pay || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
                                                        : <span className="text-muted">—</span>}
                                                </td>
                                                <td className="text-end">
                                                    {p.bonus > 0
                                                        ? <span className="text-success">₹${(p.bonus || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                                        : <span className="text-muted">—</span>}
                                                </td>
                                                <td className="text-end">
                                                    {((p.deduction_breakdown?.total_statutory || 0) + (p.deductions || 0)) > 0
                                                        ? <span className="text-danger">₹{((p.deduction_breakdown?.total_statutory || 0) + (p.deductions || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                                        : <span className="text-muted">—</span>}
                                                </td>
                                                <td className="text-end fw-bold">
                                                    ₹{p.net_salary.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                </td>
                                                <td className="text-center">
                                                    {p.status === 'paid'
                                                        ? <Badge bg="success"><CsLineIcons icon="check" size={12} className="me-1" />Paid</Badge>
                                                        : <Badge bg="warning"><CsLineIcons icon="clock" size={12} className="me-1" />Unpaid</Badge>}
                                                </td>
                                                <td className="text-center">
                                                    <div className="d-flex justify-content-center gap-1">
                                                        <Button
                                                            variant="outline-primary"
                                                            size="sm"
                                                            className='btn-icon'
                                                            onClick={() => { setSelectedPayroll(p); setShowDetailModal(true); }}
                                                            title="View Details"
                                                        >
                                                            <CsLineIcons icon="eye" />
                                                        </Button>
                                                        {p.status === 'paid' && (
                                                            <Button
                                                                variant="outline-success"
                                                                size="sm"
                                                                className='btn-icon'
                                                                onClick={() => downloadSalarySlip(p)}
                                                                title="Download Salary Slip"
                                                            >
                                                                <CsLineIcons icon="download" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    {/* Filtered totals footer */}
                                    <tfoot className="table-light fw-bold">
                                        <tr>
                                            <td>Total ({filteredPayroll.length})</td>
                                            <td colSpan={7} />
                                            <td className="text-end text-danger">
                                                ₹{filteredStats.total_deductions.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="text-end">
                                                ₹{filteredStats.total_net.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                            </td>
                                            <td colSpan={2} />
                                        </tr>
                                    </tfoot>
                                </Table>
                            </div>
                        </>
                    )}
                </Card.Body>
            </Card>

            {/* ── Export Options Modal ── */}
            <Modal show={showExportModal} onHide={() => setShowExportModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Export Options — {exportType}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p className="text-muted">
                        This will export <strong>{filteredPayroll.length}</strong> payroll record(s) based on current filters.
                    </p>
                    <Alert variant="info">
                        <CsLineIcons icon="info-circle" className="me-2" />
                        The export includes staff information, career stats, and all filtered payroll records.
                    </Alert>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowExportModal(false)} className='btn-icon'>Cancel</Button>
                    <Button variant="primary" onClick={handleExportConfirm} className='btn-icon'>
                        <CsLineIcons icon="download" className="me-2" />Export {exportType}
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* ── Payroll Detail Modal ── */}
            <Modal show={showDetailModal} onHide={() => setShowDetailModal(false)} centered size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>
                        Payroll Details — {selectedPayroll ? `${MONTH_NAMES[selectedPayroll.month]} ${selectedPayroll.year}` : ''}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedPayroll && (
                        <Row className="g-3">
                            <Col md={12}>
                                <Row className="g-3">
                                    <Col xs={6} md={3}>
                                        <div className="text-muted small">Month / Year</div>
                                        <div className="fw-bold">{MONTH_NAMES[selectedPayroll.month]} {selectedPayroll.year}</div>
                                    </Col>
                                    <Col xs={6} md={3}>
                                        <div className="text-muted small">Working Days</div>
                                        <div className="fw-bold">{selectedPayroll.working_days_in_month}</div>
                                    </Col>
                                    <Col xs={6} md={3}>
                                        <div className="text-muted small">Present Days</div>
                                        <div className="fw-bold text-success">{selectedPayroll.present_days}</div>
                                    </Col>
                                    <Col xs={6} md={3}>
                                        <div className="text-muted small">Absent Days</div>
                                        <div className={`fw-bold ${selectedPayroll.absent_days > 0 ? 'text-danger' : ''}`}>{selectedPayroll.absent_days}</div>
                                    </Col>
                                </Row>
                            </Col>

                            <Col md={6}>
                                <div className="border rounded p-3 bg-light h-100">
                                    <h6 className="text-primary mb-3">Earnings Breakdown</h6>

                                    <div className="d-flex justify-content-between mb-1">
                                        <span className="text-muted">Base Salary (Ref)</span>
                                        <span>₹{(staffData?.salary || selectedPayroll.base_salary || 0).toLocaleString('en-IN')}</span>
                                    </div>
                                    <hr className="my-2" />

                                    {selectedPayroll.earned_breakdown && (
                                        <>
                                            {selectedPayroll.earned_breakdown.basic > 0 && <div className="d-flex justify-content-between mb-1"><span>Basic</span><span>₹{selectedPayroll.earned_breakdown.basic.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>}
                                            {selectedPayroll.earned_breakdown.hra > 0 && <div className="d-flex justify-content-between mb-1"><span>HRA</span><span>₹{selectedPayroll.earned_breakdown.hra.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>}
                                            {selectedPayroll.earned_breakdown.conveyance > 0 && <div className="d-flex justify-content-between mb-1"><span>Conveyance</span><span>₹{selectedPayroll.earned_breakdown.conveyance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>}
                                            {selectedPayroll.earned_breakdown.medical > 0 && <div className="d-flex justify-content-between mb-1"><span>Medical</span><span>₹{selectedPayroll.earned_breakdown.medical.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>}
                                            {selectedPayroll.earned_breakdown.special > 0 && <div className="d-flex justify-content-between mb-1"><span>Special</span><span>₹{selectedPayroll.earned_breakdown.special.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>}
                                            {selectedPayroll.earned_breakdown.other > 0 && <div className="d-flex justify-content-between mb-1"><span>Other</span><span>₹{selectedPayroll.earned_breakdown.other.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>}
                                        </>
                                    )}
                                    {!selectedPayroll.earned_breakdown && (
                                        <div className="d-flex justify-content-between mb-1"><span>Base Earned</span><span>₹{(selectedPayroll.earned_salary || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>
                                    )}

                                    {selectedPayroll.overtime_pay > 0 && <div className="d-flex justify-content-between mb-1 mt-2"><span>Overtime Pay ({selectedPayroll.overtime_hours}h @ ₹{selectedPayroll.overtime_rate}/h)</span><span className="text-primary">₹{(selectedPayroll.overtime_pay || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>}
                                    {selectedPayroll.bonus > 0 && <div className="d-flex justify-content-between mb-1"><span>Bonus</span><span className="text-success">₹{(selectedPayroll.bonus || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>}

                                    <hr className="my-2" />
                                    <div className="d-flex justify-content-between fw-bold text-success">
                                        <span>Total Gross Earned</span>
                                        <span>₹{(
                                            (selectedPayroll.earned_breakdown?.total_gross || selectedPayroll.earned_salary || 0) +
                                            (selectedPayroll.overtime_pay || 0) +
                                            (selectedPayroll.bonus || 0)
                                        ).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                    </div>
                                </div>
                            </Col>

                            <Col md={6}>
                                <div className="border rounded p-3 bg-light h-100">
                                    <h6 className="text-danger mb-3">Deductions Breakdown</h6>
                                    {selectedPayroll.deduction_breakdown && (
                                        <>
                                            {selectedPayroll.deduction_breakdown.pf > 0 && <div className="d-flex justify-content-between mb-1"><span>Provident Fund (PF)</span><span>₹{selectedPayroll.deduction_breakdown.pf.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>}
                                            {selectedPayroll.deduction_breakdown.esi > 0 && <div className="d-flex justify-content-between mb-1"><span>ESI</span><span>₹{selectedPayroll.deduction_breakdown.esi.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>}
                                            {selectedPayroll.deduction_breakdown.pt > 0 && <div className="d-flex justify-content-between mb-1"><span>Professional Tax (PT)</span><span>₹{selectedPayroll.deduction_breakdown.pt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>}

                                            {((selectedPayroll.deduction_breakdown?.total_statutory || 0) > 0) && <hr className="my-2" />}
                                        </>
                                    )}
                                    {selectedPayroll.deductions > 0 && (
                                        <div className="d-flex justify-content-between mb-1 mt-2">
                                            <div>
                                                <span>Manual Deduction</span>
                                                {selectedPayroll.deduction_reason && <span className="small text-muted d-block">{selectedPayroll.deduction_reason}</span>}
                                            </div>
                                            <span>₹{(selectedPayroll.deductions || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                        </div>
                                    )}
                                    {((selectedPayroll.deduction_breakdown?.total_statutory || 0) + (selectedPayroll.deductions || 0)) === 0 && (
                                        <div className="text-muted small">No deductions for this payroll period.</div>
                                    )}

                                    <hr className="my-2" />
                                    <div className="d-flex justify-content-between fw-bold text-danger">
                                        <span>Total Deductions</span>
                                        <span>₹{((selectedPayroll.deduction_breakdown?.total_statutory || 0) + (selectedPayroll.deductions || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                    </div>
                                </div>
                            </Col>

                            {/* Net Salary highlight */}
                            <Col xs={12}>
                                <div className="mt-2 p-3 rounded d-flex justify-content-between align-items-center"
                                    style={{ background: '#f0f4ff', border: '1px solid #c7d7ff' }}>
                                    <span className="fw-bold">Net Salary</span>
                                    <h4 className="mb-0 text-primary">
                                        ₹{selectedPayroll.net_salary.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                    </h4>
                                </div>
                            </Col>

                            {/* Status */}
                            <Col xs={12}>
                                <div className="d-flex align-items-center gap-3">
                                    <div>
                                        <div className="text-muted small">Payment Status</div>
                                        {selectedPayroll.status === 'paid'
                                            ? <Badge bg="success" className="px-2 py-2"><CsLineIcons icon="check" size="15" className="me-1" />Paid</Badge>
                                            : <Badge bg="warning" className="px-2 py-2"><CsLineIcons icon="clock" size="15" className="me-1" />Unpaid</Badge>}
                                    </div>
                                    {selectedPayroll.paid_date && (
                                        <div>
                                            <div className="text-muted small">Paid On</div>
                                            <div className="fw-bold">{selectedPayroll.paid_date}</div>
                                        </div>
                                    )}
                                </div>
                            </Col>

                            {selectedPayroll.notes && (
                                <Col xs={12}>
                                    <div className="text-muted small">Notes</div>
                                    <div>{selectedPayroll.notes}</div>
                                </Col>
                            )}
                        </Row>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowDetailModal(false)} className='btn-icon'>Close</Button>
                </Modal.Footer>
            </Modal>

            {/* ── Toast ── */}
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
}