import React, { useEffect, useState } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import axios from 'axios';
import {
    Row, Col, Card, Button, Alert, Spinner, Badge,
    Modal, Form, ProgressBar, Table,
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
import { toast } from 'react-toastify';

const MONTH_NAMES = [
    '', 'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
];

const customStyles = `
  .glass-card {
    background: #ffffff !important;
    border: 1px solid #f0f0f0 !important;
    border-radius: 1.5rem !important;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.04) !important;
    transition: all 0.3s ease;
  }
  .glass-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 15px 45px rgba(0, 0, 0, 0.06) !important;
  }
  .custom-btn-outline {
    border: 1.5px solid #1ea8e7 !important;
    color: #1ea8e7 !important;
    background-color: transparent !important;
    transition: all 0.2s ease-in-out !important;
    border-radius: 50px !important;
    font-weight: 600 !important;
    font-size: 0.85rem !important;
  }
  .custom-btn-outline:hover {
    background-color: #1ea8e7 !important;
    color: #fff !important;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(30, 168, 231, 0.15) !important;
  }
  .custom-btn-solid {
    background-color: #1ea8e7 !important;
    border: 1px solid #1ea8e7 !important;
    color: #fff !important;
    transition: all 0.2s ease-in-out !important;
    border-radius: 50px !important;
    font-weight: 600 !important;
    font-size: 0.85rem !important;
  }
  .custom-btn-solid:hover {
    background-color: #158dc4 !important;
    border-color: #158dc4 !important;
    color: #fff !important;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(30, 168, 231, 0.2) !important;
  }
  .status-badge {
    padding: 0.5rem 1rem;
    border-radius: 50px;
    font-weight: 700;
    font-size: 0.75rem;
    letter-spacing: 0.02em;
    text-transform: uppercase;
  }
  .react-table-modern th {
    background: #f8fafc !important;
    color: #64748b !important;
    font-weight: 700 !important;
    text-transform: uppercase !important;
    font-size: 0.75rem !important;
    letter-spacing: 0.05em !important;
    padding: 1.25rem !important;
    border: none !important;
  }
  .react-table-modern td {
    padding: 1.25rem !important;
    vertical-align: middle !important;
    border-bottom: 1px solid #f1f5f9 !important;
  }
  .stat-icon-circle {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 1rem;
  }
  .bg-soft-primary { background-color: rgba(30, 168, 231, 0.1) !important; }
  .bg-soft-success { background-color: rgba(40, 199, 111, 0.1) !important; }
  .bg-soft-info { background-color: rgba(0, 207, 221, 0.1) !important; }
  .bg-soft-danger { background-color: rgba(234, 84, 85, 0.1) !important; }
  .bg-soft-warning { background-color: rgba(255, 159, 67, 0.1) !important; }
  .text-primary { color: #1ea8e7 !important; }
  .text-success { color: #28c76f !important; }
  .text-info { color: #00cfdd !important; }
  .text-danger { color: #ea5455 !important; }
  .text-warning { color: #ff9f43 !important; }
`;

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

    const [yearFilter, setYearFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');

    const [exporting, setExporting] = useState(false);
    const [exportProgress, setExportProgress] = useState(0);
    const [exportType, setExportType] = useState('');
    const [showExportModal, setShowExportModal] = useState(false);

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

    const filteredPayroll = payroll.filter((p) => {
        if (yearFilter !== 'all' && p.year !== Number(yearFilter)) return false;
        if (statusFilter !== 'all' && p.status !== statusFilter) return false;
        return true;
    });

    const years = [...new Set(payroll.map((p) => p.year))].sort((a, b) => b - a);

    const filteredStats = {
        total_net: filteredPayroll.reduce((s, p) => s + (p.net_salary || 0), 0),
        total_paid: filteredPayroll.filter((p) => p.status === 'paid').reduce((s, p) => s + (p.net_salary || 0), 0),
        total_unpaid: filteredPayroll.filter((p) => p.status === 'unpaid').reduce((s, p) => s + (p.net_salary || 0), 0),
        total_bonus: filteredPayroll.reduce((s, p) => s + (p.bonus || 0), 0),
        total_deductions: filteredPayroll.reduce((s, p) => s + (p.deductions || 0), 0),
        total_overtime: filteredPayroll.reduce((s, p) => s + (p.overtime_pay || 0), 0),
    };

    const exportToExcel = async () => {
        if (!staffData) return;
        setExporting(true); setExportProgress(10); setExportType('Excel');
        try {
            const wb = XLSX.utils.book_new();
            setExportProgress(20);
            const dashData = [
                ['PAYROLL REPORT'], [],
                ['Staff ID:', staffData.staff_id],
                ['Name:', `${staffData.f_name} ${staffData.l_name}`],
                ['Position:', staffData.position],
                ['Base Salary:', `₹${staffData.salary}`],
                ['OT Rate/hr:', `₹${staffData.overtime_rate}`],
                ['Generated:', format(new Date(), 'dd MMM yyyy hh:mm a')],
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
            toast.success('Excel report exported!');
        } catch (err) {
            toast.error('Error exporting Excel.');
        } finally {
            setTimeout(() => { setExporting(false); setExportProgress(0); setExportType(''); }, 500);
        }
    };

    const exportToPDF = async () => {
        if (!staffData) return;
        setExporting(true); setExportProgress(10); setExportType('PDF');
        try {
            const doc = new jsPDF();
            let y = 20;
            doc.setFillColor(30, 168, 231);
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
            doc.text(`Generated: ${format(new Date(), 'dd MMM yyyy hh:mm a')}`, 20, y);
            y += 14;

            setExportProgress(30);
            const boxes = [
                { label: 'Total Months', value: careerStats.total_months?.toString(), color: [30, 168, 231] },
                { label: 'Total Earned', value: `₹${(careerStats.total_earned || 0).toLocaleString('en-IN')}`, color: [40, 199, 111] },
                { label: 'Total Paid', value: `₹${(careerStats.total_paid || 0).toLocaleString('en-IN')}`, color: [0, 207, 221] },
                { label: 'Unpaid', value: `₹${(careerStats.total_unpaid || 0).toLocaleString('en-IN')}`, color: [234, 84, 85] },
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
            autoTable(doc, {
                startY: y,
                head: [['Month/Year', 'Present', 'Absent', 'Earned', 'OT Pay', 'Bonus', 'Deductions', 'Net Salary', 'Status']],
                body: filteredPayroll.map((p) => [
                    `${MONTH_NAMES[p.month]} ${p.year}`,
                    p.present_days,
                    p.absent_days,
                    `₹${(p.earned_breakdown?.total_gross || p.earned_salary || 0).toLocaleString('en-IN', { minimumFractionDigits: 0 })}`,
                    `₹${(p.overtime_pay || 0).toLocaleString('en-IN', { minimumFractionDigits: 0 })}`,
                    `₹${(p.bonus || 0).toLocaleString('en-IN', { minimumFractionDigits: 0 })}`,
                    `₹${((p.deduction_breakdown?.total_statutory || 0) + (p.deductions || 0)).toLocaleString('en-IN', { minimumFractionDigits: 0 })}`,
                    `₹${(p.net_salary || 0).toLocaleString('en-IN', { minimumFractionDigits: 0 })}`,
                    p.status.toUpperCase(),
                ]),
                theme: 'striped',
                headStyles: { fillColor: [30, 168, 231], fontSize: 8, fontStyle: 'bold' },
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
            toast.success('PDF report exported!');
        } catch (err) {
            toast.error('Error exporting PDF.');
        } finally {
            setTimeout(() => { setExporting(false); setExportProgress(0); setExportType(''); }, 500);
        }
    };

    const downloadSalarySlip = (p) => {
        try {
            const doc = new jsPDF();
            doc.setFontSize(16);
            doc.setFont(undefined, 'bold');
            doc.text('SALARY SLIP', 105, 20, { align: 'center' });
            doc.setFontSize(10);
            doc.setFont(undefined, 'normal');
            doc.text(`For the month of ${MONTH_NAMES[p.month]} ${p.year}`, 105, 26, { align: 'center' });
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
            doc.rect(14, 66, 182, 12);
            doc.setFontSize(9);
            doc.text(`Total Days: ${p.working_days_in_month}   |   Paid Days: ${p.leave_summary?.total_paid_days || p.present_days}   |   LWP: ${p.leave_summary?.lwp_days || p.absent_days}`, 105, 74, { align: 'center' });

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
                headStyles: { fillColor: [30, 168, 231], textColor: 255 },
                columnStyles: {
                    0: { cellWidth: 50 },
                    1: { cellWidth: 41, halign: 'right' },
                    2: { cellWidth: 50 },
                    3: { cellWidth: 41, halign: 'right' }
                }
            });

            const { finalY } = doc.lastAutoTable;
            doc.setFillColor(240, 240, 240);
            doc.rect(14, finalY, 182, 10, 'F');
            doc.rect(14, finalY, 182, 10, 'S');
            doc.setFont(undefined, 'bold');
            doc.text('Gross Earnings', 18, finalY + 6.5);
            doc.text(`${totalEarnings.toFixed(2)}`, 95, finalY + 6.5, { align: 'right' });
            doc.text('Total Deductions', 109, finalY + 6.5);
            doc.text(`${totalDeductions.toFixed(2)}`, 186, finalY + 6.5, { align: 'right' });
            doc.rect(14, finalY + 14, 182, 12, 'S');
            doc.setFontSize(12);
            doc.text('Net Payable:', 18, finalY + 22);
            doc.text(`Rs. ${p.net_salary.toFixed(2)}`, 186, finalY + 22, { align: 'right' });
            doc.setFontSize(9);
            doc.setFont(undefined, 'normal');
            doc.text('** This is a computer-generated document and does not require a signature.', 105, finalY + 40, { align: 'center' });
            doc.save(`${staffData.staff_id}_SalarySlip_${MONTH_NAMES[p.month]}_${p.year}.pdf`);
            toast.success('Salary Slip Downloaded!');
        } catch (e) {
            console.error(e);
            toast.error('Error generating Salary Slip.');
        }
    };

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
                toast.success('Word report exported!');
                setExportProgress(100);
            });
        } catch (err) {
            toast.error('Error exporting Word.');
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
        <div className="container-fluid px-lg-4 px-xl-5 pb-5">
            <style>{customStyles}</style>
            <HtmlHead title={main_title} description={description} />

            <div className="page-title-container mb-4 mb-lg-5 mt-5 mt-lg-0">
                <Row className="g-3 align-items-center">
                    <Col md={7}>
                        <h1 className="mb-0 pb-0 display-4 fw-bold" style={{ color: '#1ea8e7' }}>
                            {staffData ? `${staffData.f_name} ${staffData.l_name}'s Ledger` : main_title}
                        </h1>
                        <BreadcrumbList items={breadcrumbs} />
                    </Col>
                    <Col md={5} className="d-flex justify-content-md-end align-items-center gap-3">
                        <Button className="custom-btn-outline px-4 rounded-pill shadow-sm d-flex align-items-center" style={{ height: '40px' }} onClick={() => history.push('/staff/payroll')}>
                            <CsLineIcons icon="arrow-left" className="me-2" size="18" />
                            <span>Back to Payroll</span>
                        </Button>
                    </Col>
                </Row>
            </div>

            {error && <Alert variant="danger" className="glass-card border-0 mb-4 shadow-sm">{error}</Alert>}

            {staffData && (
                <Card className="glass-card border-0 mb-5 overflow-hidden">
                    <Card.Body className="p-4">
                        <Row className="align-items-center">
                            <Col md="auto" className="mb-3 mb-md-0">
                                <div className="sw-13 sh-13 rounded-circle bg-soft-primary d-flex align-items-center justify-content-center text-primary fw-bold h3 shadow-sm border border-white border-4 mb-0">
                                    {staffData.f_name?.[0]}{staffData.l_name?.[0]}
                                </div>
                            </Col>
                            <Col className="ms-md-4">
                                <h3 className="fw-bold text-dark mb-1">{staffData.f_name} {staffData.l_name}</h3>
                                <div className="d-flex align-items-center gap-3 flex-wrap">
                                    <span className="badge bg-soft-primary text-primary px-3 py-2 rounded-pill fw-bold">#{staffData.staff_id}</span>
                                    <span className="text-muted fw-medium fs-6 d-flex align-items-center gap-1">
                                        <CsLineIcons icon="diploma" size="16" /> {staffData.position}
                                    </span>
                                    <span className="text-muted fw-medium fs-6 d-flex align-items-center gap-1">
                                        <CsLineIcons icon="calendar" size="16" /> Joined: {staffData.joining_date ? format(new Date(staffData.joining_date), 'dd MMM yyyy') : '-'}
                                    </span>
                                </div>
                            </Col>
                            <Col md="auto" className="mt-3 mt-md-0 border-start ps-md-5">
                                <div className="text-muted small fw-bold text-uppercase mb-1">Standard Base Pay</div>
                                <h2 className="fw-bold text-primary mb-0">₹{(staffData.salary || 0).toLocaleString('en-IN')}</h2>
                                <div className="text-muted small fw-medium mt-1">OT Rate: ₹{staffData.overtime_rate}/hr</div>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>
            )}

            <Row className="g-4 mb-5">
                {[
                    { label: 'Fiscal Months', value: careerStats.total_months || 0, icon: 'calendar', bg: 'soft-primary', color: 'primary' },
                    { label: 'Total Earnings', value: `₹${(careerStats.total_earned || 0).toLocaleString('en-IN')}`, icon: 'dollar', bg: 'soft-success', color: 'success' },
                    { label: 'Paid Amount', value: `₹${(careerStats.total_paid || 0).toLocaleString('en-IN')}`, icon: 'check-circle', bg: 'soft-info', color: 'info' },
                    { label: 'Pending Payout', value: `₹${(careerStats.total_unpaid || 0).toLocaleString('en-IN')}`, icon: 'clock', bg: 'soft-danger', color: 'danger' },
                ].map((s) => (
                    <Col xs={6} md={3} key={s.label}>
                        <Card className="glass-card border-0 h-100">
                            <Card.Body className="p-4 text-center">
                                <div className={`stat-icon-circle bg-${s.bg} text-${s.color} mx-auto shadow-sm`}>
                                    <CsLineIcons icon={s.icon} size="24" />
                                </div>
                                <div className="text-muted small fw-bold text-uppercase mb-1">{s.label}</div>
                                <h4 className="mb-0 fw-bold text-dark">{s.value}</h4>
                            </Card.Body>
                        </Card>
                    </Col>
                ))}
            </Row>

            <Card className="glass-card border-0 mb-5 overflow-hidden">
                <Card.Body className="p-4">
                    <Row className="g-4 align-items-end">
                        <Col md={3}>
                            <Form.Label className="small fw-bold text-muted text-uppercase">Fiscal Year</Form.Label>
                            <Form.Select className="rounded-3 border-0 shadow-sm py-2" value={yearFilter} onChange={(e) => setYearFilter(e.target.value)}>
                                <option value="all">All Available Years</option>
                                {years.map((y) => <option key={y} value={y}>{y}</option>)}
                            </Form.Select>
                        </Col>
                        <Col md={3}>
                            <Form.Label className="small fw-bold text-muted text-uppercase">Disbursement Status</Form.Label>
                            <Form.Select className="rounded-3 border-0 shadow-sm py-2" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                                <option value="all">Any Status</option>
                                <option value="paid">Paid (Settled)</option>
                                <option value="unpaid">Unpaid (Pending)</option>
                            </Form.Select>
                        </Col>
                        <Col md={2}>
                            <Button className="custom-btn-outline w-100 py-2" onClick={() => { setYearFilter('all'); setStatusFilter('all'); }}>
                                Reset Filters
                            </Button>
                        </Col>
                        <Col md={4}>
                            <div className="d-flex gap-2 justify-content-md-end flex-wrap">
                                <Button className="custom-btn-solid bg-soft-success text-success border-0 px-3" onClick={() => handleExportClick('Excel')} disabled={exporting}>
                                    <CsLineIcons icon="file-text" size="18" className="me-2" /> Excel
                                </Button>
                                <Button className="custom-btn-solid bg-soft-danger text-danger border-0 px-3" onClick={() => handleExportClick('PDF')} disabled={exporting}>
                                    <CsLineIcons icon="file-text" size="18" className="me-2" /> PDF
                                </Button>
                                <Button className="custom-btn-solid bg-soft-info text-info border-0 px-3" onClick={() => handleExportClick('Word')} disabled={exporting}>
                                    <CsLineIcons icon="file-text" size="18" className="me-2" /> Word
                                </Button>
                            </div>
                        </Col>
                    </Row>
                    {exporting && (
                        <div className="mt-4 p-3 bg-light rounded-3">
                            <div className="d-flex align-items-center mb-2 justify-content-between">
                                <div className="d-flex align-items-center gap-2">
                                    <Spinner animation="border" size="sm" className="text-primary" />
                                    <span className="fw-bold small text-primary uppercase">Generating {exportType} Asset...</span>
                                </div>
                                <span className="fw-bold text-primary">{exportProgress}%</span>
                            </div>
                            <ProgressBar now={exportProgress} className="sh-2 rounded-pill shadow-sm" />
                        </div>
                    )}
                </Card.Body>
            </Card>

            <Card className="glass-card border-0 overflow-hidden shadow-sm mb-5">
                <Card.Header className="bg-light border-0 p-4">
                    <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                        <div>
                            <h5 className="fw-bold text-dark mb-1 d-flex align-items-center gap-2">
                                <CsLineIcons icon="layout" size="20" className="text-primary" />
                                Payroll Audit Log
                            </h5>
                            <small className="text-muted fw-medium text-uppercase">Showing {filteredPayroll.length} filtered periods</small>
                        </div>
                        <Badge bg="primary" className="status-badge sh-5 d-flex align-items-center px-4">
                            Filtered Total: ₹{filteredStats.total_net.toLocaleString('en-IN')}
                        </Badge>
                    </div>
                </Card.Header>
                <Card.Body className="p-0">
                    {filteredPayroll.length === 0 ? (
                        <div className="text-center py-5">
                            <CsLineIcons icon="inbox" size="64" className="text-muted opacity-25 mb-4" />
                            <h4 className="fw-bold text-muted">No Ledger Found</h4>
                            <p className="text-muted">No payroll entries match your current filter criteria.</p>
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <Table hover className="react-table-modern mb-0">
                                <thead>
                                    <tr>
                                        <th>Payroll Period</th>
                                        <th className="text-center">Work Days</th>
                                        <th className="text-center">Att. (P/A)</th>
                                        <th className="text-end">Base Rate</th>
                                        <th className="text-end">Earned Gross</th>
                                        <th className="text-end">Adjustments</th>
                                        <th className="text-end fw-bold text-primary">Net Payable</th>
                                        <th className="text-center">Payment Status</th>
                                        <th className="text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredPayroll.map((p) => (
                                        <tr key={p._id}>
                                            <td>
                                                <div className="fw-bold text-dark">{MONTH_NAMES[p.month]} {p.year}</div>
                                                {p.paid_date && <small className="text-success fw-bold">Paid: {format(new Date(p.paid_date), 'dd MMM yy')}</small>}
                                            </td>
                                            <td className="text-center fw-medium">{p.working_days_in_month} Days</td>
                                            <td className="text-center">
                                                <div className="d-flex align-items-center justify-content-center gap-2">
                                                    <Badge bg="soft-success" className="text-success px-2 py-1 rounded-pill">{p.present_days}P</Badge>
                                                    <Badge bg={p.absent_days > 0 ? 'soft-danger' : 'soft-light'} className={`${p.absent_days > 0 ? 'text-danger' : 'text-muted'} px-2 py-1 rounded-pill`}>{p.absent_days}A</Badge>
                                                </div>
                                            </td>
                                            <td className="text-end text-muted fw-medium">₹{(staffData?.salary || p.base_salary || 0).toLocaleString('en-IN')}</td>
                                            <td className="text-end text-success fw-bold">₹{(p.earned_breakdown?.total_gross || p.earned_salary || 0).toLocaleString('en-IN')}</td>
                                            <td className="text-end">
                                                <div className="small fw-bold text-primary">OT: +₹{(p.overtime_pay || 0).toLocaleString('en-IN')}</div>
                                                <div className="small fw-bold text-danger">Ded: -₹{((p.deduction_breakdown?.total_statutory || 0) + (p.deductions || 0)).toLocaleString('en-IN')}</div>
                                            </td>
                                            <td className="text-end">
                                                <div className="h5 mb-0 fw-bold text-primary">₹{p.net_salary.toLocaleString('en-IN')}</div>
                                            </td>
                                            <td className="text-center">
                                                <Badge bg={p.status === 'paid' ? 'success' : 'warning'} className="status-badge px-3 py-1">
                                                    {p.status === 'paid' ? 'Settled' : 'Pending'}
                                                </Badge>
                                            </td>
                                            <td className="text-center">
                                                <div className="d-flex justify-content-center gap-2">
                                                    <Button variant="outline-primary" className="btn-icon btn-icon-only rounded-circle d-flex align-items-center justify-content-center" style={{ width: '38px', height: '38px' }} onClick={() => { setSelectedPayroll(p); setShowDetailModal(true); }}>
                                                        <CsLineIcons icon="eye" size="18" />
                                                    </Button>
                                                    {p.status === 'paid' && (
                                                        <Button variant="outline-success" className="btn-icon btn-icon-only rounded-circle d-flex align-items-center justify-content-center" style={{ width: '38px', height: '38px' }} onClick={() => downloadSalarySlip(p)}>
                                                            <CsLineIcons icon="download" size="18" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </div>
                    )}
                </Card.Body>
            </Card>

            <Modal show={showExportModal} onHide={() => setShowExportModal(false)} centered className="rounded-4">
                <Modal.Header closeButton className="border-0 p-4 pb-0">
                    <Modal.Title className="fw-bold">Export Audit Report</Modal.Title>
                </Modal.Header>
                <Modal.Body className="p-4">
                    <div className="glass-card bg-light border-0 p-4 mb-3 text-center">
                        <CsLineIcons icon="download" size="48" className="text-primary opacity-25 mb-3" />
                        <h5 className="fw-bold mb-1">Confirm {exportType} Generation</h5>
                        <p className="text-muted mb-0">Generating report for <strong>{filteredPayroll.length}</strong> payroll records based on active filters.</p>
                    </div>
                    <div className="d-flex align-items-center gap-3 p-3 bg-soft-info rounded-3 text-info">
                        <CsLineIcons icon="info-circle" size="20" />
                        <small className="fw-bold">Report will include Career Statistics and Earned/Deduction breakups.</small>
                    </div>
                </Modal.Body>
                <Modal.Footer className="border-0 p-4 pt-0 d-flex gap-3">
                    <Button className="custom-btn-outline rounded-pill shadow-sm flex-grow-1" style={{ height: '40px' }} onClick={() => setShowExportModal(false)}>Cancel</Button>
                    <Button className="custom-btn-solid rounded-pill shadow-sm flex-grow-1" style={{ height: '40px' }} onClick={handleExportConfirm}>Generate Asset</Button>
                </Modal.Footer>
            </Modal>

            <Modal show={showDetailModal} onHide={() => setShowDetailModal(false)} centered size="lg" className="rounded-4">
                <Modal.Header closeButton className="border-0 p-4 pb-0">
                    <Modal.Title className="fw-bold d-flex align-items-center gap-2">
                        <CsLineIcons icon="file-text" size="24" className="text-primary" />
                        Payroll Insight: {selectedPayroll ? `${MONTH_NAMES[selectedPayroll.month]} ${selectedPayroll.year}` : ''}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="p-4">
                    {selectedPayroll && (
                        <Row className="g-4">
                            <Col md={12}>
                                <div className="glass-card border-0 bg-light p-4 shadow-sm">
                                    <Row className="text-center g-3">
                                        <Col xs={6} md={3} className="border-end">
                                            <div className="text-muted small fw-bold text-uppercase mb-1">Fiscal Cycle</div>
                                            <div className="fw-bold text-dark fs-5">{MONTH_NAMES[selectedPayroll.month]} {selectedPayroll.year}</div>
                                        </Col>
                                        <Col xs={6} md={3} className="border-end">
                                            <div className="text-muted small fw-bold text-uppercase mb-1">Billable Days</div>
                                            <div className="fw-bold text-dark fs-5">{selectedPayroll.working_days_in_month} Days</div>
                                        </Col>
                                        <Col xs={6} md={3} className="border-end">
                                            <div className="text-muted small fw-bold text-uppercase mb-1">Attendance</div>
                                            <div className="fw-bold text-success fs-5">{selectedPayroll.present_days}P / <span className="text-danger">{selectedPayroll.absent_days}A</span></div>
                                        </Col>
                                        <Col xs={6} md={3}>
                                            <div className="text-muted small fw-bold text-uppercase mb-1">Status</div>
                                            <Badge bg={selectedPayroll.status === 'paid' ? 'success' : 'warning'} className="status-badge px-3 py-1">
                                                {selectedPayroll.status === 'paid' ? 'SETTLED' : 'PENDING'}
                                            </Badge>
                                        </Col>
                                    </Row>
                                </div>
                            </Col>

                            <Col md={6}>
                                <div className="glass-card border-0 p-4 h-100 bg-white shadow-sm border border-soft-success">
                                    <div className="d-flex align-items-center gap-2 mb-4">
                                        <div className="sw-4 sh-4 rounded-circle bg-soft-success text-success d-flex align-items-center justify-content-center">
                                            <CsLineIcons icon="trending-up" size="16" />
                                        </div>
                                        <h6 className="fw-bold text-success mb-0 uppercase letter-spacing-1">Earnings & Benefits</h6>
                                    </div>
                                    <div className="d-flex justify-content-between mb-3 pb-2 border-bottom">
                                        <span className="text-muted fw-bold small">Base Component</span>
                                        <span className="fw-bold">₹{(staffData?.salary || selectedPayroll.base_salary || 0).toLocaleString('en-IN')}</span>
                                    </div>
                                    <div className="vstack gap-2">
                                        {selectedPayroll.earned_breakdown ? (
                                            <>
                                                {['basic', 'hra', 'conveyance', 'medical', 'special', 'other'].map(key => (
                                                    selectedPayroll.earned_breakdown[key] > 0 && (
                                                        <div key={key} className="d-flex justify-content-between small text-muted">
                                                            <span className="text-capitalize">{key}</span>
                                                            <span className="fw-bold text-dark">₹{selectedPayroll.earned_breakdown[key].toLocaleString('en-IN')}</span>
                                                        </div>
                                                    )
                                                ))}
                                            </>
                                        ) : (
                                            <div className="d-flex justify-content-between small">
                                                <span>Standard Earned</span>
                                                <span className="fw-bold text-dark">₹{(selectedPayroll.earned_salary || 0).toLocaleString('en-IN')}</span>
                                            </div>
                                        )}
                                        {selectedPayroll.overtime_pay > 0 && (
                                            <div className="d-flex justify-content-between small pt-2 border-top">
                                                <span>Overtime ({selectedPayroll.overtime_hours}h)</span>
                                                <span className="fw-bold text-primary">₹{selectedPayroll.overtime_pay.toLocaleString('en-IN')}</span>
                                            </div>
                                        )}
                                        {selectedPayroll.bonus > 0 && (
                                            <div className="d-flex justify-content-between small">
                                                <span>Incentives / Bonus</span>
                                                <span className="fw-bold text-success">₹{selectedPayroll.bonus.toLocaleString('en-IN')}</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="mt-4 pt-3 border-top d-flex justify-content-between align-items-center">
                                        <span className="h6 mb-0 fw-bold text-success">Total Gross</span>
                                        <span className="h5 mb-0 fw-bold text-success">₹{(
                                            (selectedPayroll.earned_breakdown?.total_gross || selectedPayroll.earned_salary || 0) +
                                            (selectedPayroll.overtime_pay || 0) +
                                            (selectedPayroll.bonus || 0)
                                        ).toLocaleString('en-IN')}</span>
                                    </div>
                                </div>
                            </Col>

                            <Col md={6}>
                                <div className="glass-card border-0 p-4 h-100 bg-white shadow-sm border border-soft-danger">
                                    <div className="d-flex align-items-center gap-2 mb-4">
                                        <div className="sw-4 sh-4 rounded-circle bg-soft-danger text-danger d-flex align-items-center justify-content-center">
                                            <CsLineIcons icon="trending-down" size="16" />
                                        </div>
                                        <h6 className="fw-bold text-danger mb-0 uppercase letter-spacing-1">Reductions & Taxes</h6>
                                    </div>
                                    <div className="vstack gap-2">
                                        {selectedPayroll.deduction_breakdown ? (
                                            <>
                                                {['pf', 'esi', 'pt', 'tds', 'other'].map(key => (
                                                    selectedPayroll.deduction_breakdown[key] > 0 && (
                                                        <div key={key} className="d-flex justify-content-between small text-muted">
                                                            <span className="text-uppercase">{key} Contribution</span>
                                                            <span className="fw-bold text-dark">₹{selectedPayroll.deduction_breakdown[key].toLocaleString('en-IN')}</span>
                                                        </div>
                                                    )
                                                ))}
                                            </>
                                        ) : (
                                            <div className="d-flex justify-content-between small">
                                                <span>Statutory Pool</span>
                                                <span className="fw-bold text-dark">₹{(selectedPayroll.deduction_breakdown?.total_statutory || 0).toLocaleString('en-IN')}</span>
                                            </div>
                                        )}
                                        {selectedPayroll.deductions > 0 && (
                                            <div className="d-flex justify-content-between small pt-2 border-top">
                                                <span>Manual Reductions</span>
                                                <span className="fw-bold text-danger">₹{selectedPayroll.deductions.toLocaleString('en-IN')}</span>
                                            </div>
                                        )}
                                        {selectedPayroll.advance_deduction > 0 && (
                                            <div className="d-flex justify-content-between small">
                                                <span>Advance Recovery</span>
                                                <span className="fw-bold text-danger">₹{selectedPayroll.advance_deduction.toLocaleString('en-IN')}</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="mt-auto pt-3 border-top d-flex justify-content-between align-items-center" style={{ marginTop: 'auto' }}>
                                        <span className="h6 mb-0 fw-bold text-danger">Total Reductions</span>
                                        <span className="h5 mb-0 fw-bold text-danger">₹{((selectedPayroll.deduction_breakdown?.total_statutory || 0) + (selectedPayroll.deductions || 0) + (selectedPayroll.advance_deduction || 0)).toLocaleString('en-IN')}</span>
                                    </div>
                                </div>
                            </Col>

                            <Col md={12}>
                                <div className="glass-card border-0 bg-primary p-4 shadow-lg text-white d-flex justify-content-between align-items-center">
                                    <div>
                                        <div className="small fw-bold text-uppercase opacity-75 mb-1">Net Disposable Income</div>
                                        <h2 className="fw-bold mb-0">₹{selectedPayroll.net_salary.toLocaleString('en-IN')}</h2>
                                    </div>
                                    <div className="text-end">
                                        {selectedPayroll.status === 'paid' ? (
                                            <Badge bg="white" className="text-primary status-badge px-4 py-2">DISBURSED</Badge>
                                        ) : (
                                            <Badge bg="white" className="text-warning status-badge px-4 py-2">AUTHORIZED</Badge>
                                        )}
                                    </div>
                                </div>
                            </Col>
                        </Row>
                    )}
                </Modal.Body>
                <Modal.Footer className="border-0 p-4 pt-0">
                    <Button className="custom-btn-outline rounded-pill shadow-sm w-100" style={{ height: '40px' }} onClick={() => setShowDetailModal(false)}>Close View</Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
}