import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchAPI, getFileUrl } from '../services/api';
import { useModal } from '../context/ModalContext';
import StatusBadge from '../components/StatusBadge';
import LoadingGlass from '../components/LoadingGlass';
import PageHeader from '../components/common/PageHeader';
import PrismButton from '../components/common/PrismButton';
import { formatDate } from '../utils/dateUtils';
import {
  FileText, CheckCircle2, Clock, Upload, CalendarCheck, BadgeCheck,
  CreditCard, Image, ArrowLeft, Paperclip, Plus, Lock, ChevronRight,
  UserCheck, Building2, MapPin, Hash, ExternalLink,
  Layers, AlertCircle, Edit3, RefreshCw, Calendar, ChevronDown,
} from 'lucide-react';
import { Modal } from 'react-bootstrap';

/* ── Reusable Info Cell ─────────────────────────────── */
const InfoCell = ({ label, value, accent = false }) => (
  <div style={{ minWidth: 0 }}>
    <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '3px' }}>
      {label}
    </div>
    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: accent ? 'var(--accent-primary)' : 'var(--text-primary)', wordBreak: 'break-word' }}>
      {value || <span style={{ color: '#cbd5e1', fontWeight: 400 }}>—</span>}
    </div>
  </div>
);

/* ── Input helpers ─────────────────────────────────── */
const inp = {
  width: '100%', background: '#f8fafc', border: '1.5px solid #e2e8f0',
  borderRadius: '8px', padding: '0.55rem 0.9rem',
  fontSize: '0.875rem', color: '#0f172a', fontFamily: 'var(--font-main)',
  outline: 'none', transition: 'border-color 0.18s, box-shadow 0.18s',
  boxSizing: 'border-box',
};
const onF = e => { e.target.style.borderColor = '#4f6ef7'; e.target.style.boxShadow = '0 0 0 3px rgba(79,110,247,0.12)'; e.target.style.background = '#fff'; };
const onB = e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; e.target.style.background = '#f8fafc'; };

/* ── Modal Wrapper ─────────────────────────────────── */
const AppModal = ({ show, onHide, title, children }) => (
  <Modal show={show} onHide={onHide} centered>
    <div className="project-detail-modal-box">
      <div className="project-detail-modal-header">
        <h5 style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)', margin: 0 }}>{title}</h5>
        <button type="button" onClick={onHide} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px', fontSize: '1.2rem', lineHeight: 1 }}>×</button>
      </div>
      {children}
    </div>
  </Modal>
);

const LabeledField = ({ label, children }) => (
  <div style={{ marginBottom: '1rem' }}>
    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
      {label}
    </label>
    {children}
  </div>
);

/* ── Pipeline Steps ─────────────────────────────────── */
const PIPELINE = [
  { key: 'submitted',          label: 'Submitted',          shortLabel: 'Submitted',   step: 1 },
  { key: 'under_scrutiny',     label: 'Under Scrutiny',     shortLabel: 'Scrutiny',    step: 2 },
  { key: 'query_raised',       label: 'Query Raised',       shortLabel: 'Query',       step: 3 },
  { key: 'approved',           label: 'Approved',           shortLabel: 'Approved',    step: 4 },
  { key: 'rajachitthi_issued', label: 'Rajachitthi Issued', shortLabel: 'Rajachitthi', step: 5 },
];

const TABS = [
  { key: 'overview',   label: 'Overview',         shortLabel: 'Overview',    icon: Building2 },
  { key: 'documents',  label: 'Documents',        shortLabel: 'Documents',   icon: Paperclip },
  { key: 'progress',   label: 'Progress',         shortLabel: 'Progress',    icon: CheckCircle2 },
  { key: 'visits',     label: 'Site Visits',      shortLabel: 'Visits',      icon: CalendarCheck },
  { key: 'bu',         label: 'B.U. Permission',  shortLabel: 'B.U. Permit', icon: BadgeCheck },
  { key: 'payments',   label: 'Payments',         shortLabel: 'Payments',    icon: CreditCard },
];

/* ── EMI Helper: Generate default installments ──────── */
const generateInstallments = (totalAmount, count, frequency = 'monthly') => {
  const numCount = Math.max(1, parseInt(count, 10) || 3);
  const total = Math.max(0, parseInt(totalAmount, 10) || 0);
  const equalPart = Math.floor(total / numCount);
  const remainder = total - (equalPart * numCount);

  const defaultNamesByFrequency = {
    monthly: (i) => `Month ${i + 1} Installment`,
    quarterly: (i) => `Quarter ${i + 1} Installment`,
    milestone: (i) => {
      const milestoneNames = [
        'Booking / Advance',
        'Submission & Municipal Drawings',
        'Scrutiny & Query Resolution',
        'Approval & Rajachitthi',
        'Plinth Level Verification',
        'Middle Story Slab',
        'Top Slab / BU Application',
        'Final Handover & BU Clearance'
      ];
      return milestoneNames[i] || `Milestone Stage ${i + 1}`;
    },
    custom: (i) => `Stage / Installment ${i + 1}`
  };

  const nameGen = defaultNamesByFrequency[frequency] || defaultNamesByFrequency.monthly;
  const list = [];
  const now = new Date();

  for (let i = 0; i < numCount; i++) {
    const due = new Date(now);
    if (frequency === 'monthly') {
      due.setMonth(now.getMonth() + i);
    } else if (frequency === 'quarterly') {
      due.setMonth(now.getMonth() + (i * 3));
    } else {
      due.setMonth(now.getMonth() + i);
    }
    const yyyy = due.getFullYear();
    const mm = String(due.getMonth() + 1).padStart(2, '0');
    const dd = String(due.getDate()).padStart(2, '0');
    const dueDateStr = `${yyyy}-${mm}-${dd}`;

    list.push({
      installmentNo: i + 1,
      name: nameGen(i),
      amount: i === numCount - 1 ? equalPart + remainder : equalPart,
      dueDate: dueDateStr,
      paidAmount: 0,
      status: 'pending',
    });
  }
  return list;
};

/* ══════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════ */
const ProjectDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showAlert } = useModal();

  const [project, setProject]             = useState(null);
  const [progressStages, setProgressStages] = useState([]);
  const [buPermission, setBuPermission]   = useState(null);
  const [payments, setPayments]           = useState([]);
  const [siteVisits, setSiteVisits]       = useState([]);
  const [loading, setLoading]             = useState(true);
  const [activeTab, setActiveTab]         = useState('overview');

  // Modal states
  const [showStatusModal,   setShowStatusModal]   = useState(false);
  const [newStatus,         setNewStatus]         = useState('submitted');
  const [statusRemark,      setStatusRemark]      = useState('');

  const [showDocModal,      setShowDocModal]      = useState(false);
  const [docFile,           setDocFile]           = useState(null);
  const [docType,           setDocType]           = useState('drawing');

  const [showProgressModal, setShowProgressModal] = useState(false);
  const [progressForm,      setProgressForm]      = useState({ stage: 'foundation', remarks: '', completionDate: '' });

  const [showPaymentModal,  setShowPaymentModal]  = useState(false);
  const [paymentData,       setPaymentData]       = useState({
    type: 'architect_fee',
    amountDue: 100000,
    isEmi: false,
    emiCount: 3,
    emiFrequency: 'monthly',
    installments: [],
  });

  const [showPayRecordModal,setShowPayRecordModal]= useState(false);
  const [payRecordData,     setPayRecordData]     = useState({
    paymentId: '',
    amount: 25000,
    method: 'bank_transfer',
    remark: '',
    installmentNo: '',
  });

  const [expandedEmiPlans, setExpandedEmiPlans]   = useState({});
  const toggleEmiPlan = (paymentId) => {
    setExpandedEmiPlans(prev => ({
      ...prev,
      [paymentId]: !prev[paymentId]
    }));
  };

  const load = async () => {
    setLoading(true);
    try {
      const [p, prog, bu, pay, vis] = await Promise.all([
        fetchAPI(`/projects/${id}`),
        fetchAPI(`/projects/${id}/progress`),
        fetchAPI(`/projects/${id}/bu-permission`),
        fetchAPI(`/projects/${id}/payments`),
        fetchAPI(`/site-visits?projectId=${id}`),
      ]);
      if (p.success)    setProject(p.data);
      if (prog.success) setProgressStages(prog.data);
      if (bu.success)   setBuPermission(bu);
      if (pay.success)  setPayments(pay.data);
      if (vis.success)  setSiteVisits(vis.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [id]);

  if (loading || !project) return <LoadingGlass message="Loading case files..." />;

  const currentStepIdx = PIPELINE.findIndex(s => s.key === project.status);

  /* ── Action Handlers ──────────────────────────────── */
  const handleUpdateStatus = async e => {
    e.preventDefault();
    try {
      await fetchAPI(`/projects/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status: newStatus, remark: statusRemark }) });
      setShowStatusModal(false);
      setStatusRemark('');
      showAlert({ title: 'Status Updated', message: `Case status transitioned to ${newStatus.replace('_', ' ')}.`, type: 'success' });
      load();
    } catch (err) {
      showAlert({ title: 'Status Update Failed', message: err.message, type: 'error' });
    }
  };
  const handleUploadDocument = async e => {
    e.preventDefault();
    if (!docFile) return;
    try {
      const fd = new FormData(); fd.append('file', docFile); fd.append('type', docType);
      await fetchAPI(`/projects/${id}/documents`, { method: 'POST', body: fd });
      setShowDocModal(false);
      setDocFile(null);
      showAlert({ title: 'Document Uploaded', message: 'Case document attached successfully.', type: 'success' });
      load();
    } catch (err) {
      showAlert({ title: 'Upload Failed', message: err.message, type: 'error' });
    }
  };
  const handleSaveProgress = async e => {
    e.preventDefault();
    try {
      await fetchAPI(`/projects/${id}/progress`, { method: 'POST', body: JSON.stringify(progressForm) });
      setShowProgressModal(false);
      showAlert({ title: 'Progress Recorded', message: 'Construction stage recorded successfully.', type: 'success' });
      load();
    } catch (err) {
      showAlert({ title: 'Save Failed', message: err.message, type: 'error' });
    }
  };
  const openFeeModal = (existingPayment = null, preferredType = null) => {
    let target = existingPayment;
    if (!target) {
      if (preferredType) {
        target = payments.find(p => p.type === preferredType) || null;
      } else {
        target = payments.find(p => p.type === 'architect_fee') || payments[0] || null;
      }
    }

    if (target) {
      const isEmi = Boolean(target.isEmi);
      const existingInstallments = Array.isArray(target.emiPlan?.installments) ? target.emiPlan.installments : [];
      const count = target.emiPlan?.totalEmis || (existingInstallments.length > 0 ? existingInstallments.length : 4);
      const freq = target.emiPlan?.frequency || 'monthly';
      setPaymentData({
        type: target.type,
        amountDue: target.amountDue,
        isEmi: isEmi,
        emiCount: count,
        emiFrequency: freq,
        installments: existingInstallments.length > 0
          ? existingInstallments.map(i => ({
              installmentNo: i.installmentNo,
              name: i.name || `Installment ${i.installmentNo}`,
              amount: i.amount,
              dueDate: i.dueDate ? (new Date(i.dueDate).toISOString().substring(0, 10)) : '',
              paidAmount: i.paidAmount || 0,
              status: i.status || 'pending',
              paidDate: i.paidDate || null,
            }))
          : generateInstallments(target.amountDue, count, freq),
      });
    } else {
      const chosenType = preferredType || 'architect_fee';
      const initialAmount = chosenType === 'govt_fee' ? 50000 : 100000;
      setPaymentData({
        type: chosenType,
        amountDue: initialAmount,
        isEmi: false,
        emiCount: 4,
        emiFrequency: 'monthly',
        installments: generateInstallments(initialAmount, 4, 'monthly'),
      });
    }
    setShowPaymentModal(true);
  };

  const handleFeeCategoryChange = (newType) => {
    const target = payments.find(p => p.type === newType);
    if (target) {
      const isEmi = Boolean(target.isEmi);
      const existingInstallments = Array.isArray(target.emiPlan?.installments) ? target.emiPlan.installments : [];
      const count = target.emiPlan?.totalEmis || (existingInstallments.length > 0 ? existingInstallments.length : 4);
      const freq = target.emiPlan?.frequency || 'monthly';
      setPaymentData({
        type: newType,
        amountDue: target.amountDue,
        isEmi: isEmi,
        emiCount: count,
        emiFrequency: freq,
        installments: existingInstallments.length > 0
          ? existingInstallments.map(i => ({
              installmentNo: i.installmentNo,
              name: i.name || `Installment ${i.installmentNo}`,
              amount: i.amount,
              dueDate: i.dueDate ? (new Date(i.dueDate).toISOString().substring(0, 10)) : '',
              paidAmount: i.paidAmount || 0,
              status: i.status || 'pending',
              paidDate: i.paidDate || null,
            }))
          : generateInstallments(target.amountDue, count, freq),
      });
    } else {
      const initialAmount = newType === 'govt_fee' ? 50000 : 100000;
      setPaymentData({
        type: newType,
        amountDue: initialAmount,
        isEmi: false,
        emiCount: 4,
        emiFrequency: 'monthly',
        installments: generateInstallments(initialAmount, 4, 'monthly'),
      });
    }
  };

  const openPayRecordModal = (payment, targetInstallment = null) => {
    if (targetInstallment) {
      const remainingForInst = Math.max(0, targetInstallment.amount - (targetInstallment.paidAmount || 0));
      setPayRecordData({
        paymentId: payment._id,
        amount: remainingForInst > 0 ? remainingForInst : targetInstallment.amount,
        method: 'bank_transfer',
        remark: `Payment for EMI #${targetInstallment.installmentNo} (${targetInstallment.name})`,
        installmentNo: targetInstallment.installmentNo,
      });
    } else {
      const defaultRemaining = Math.max(0, payment.amountDue - payment.amountPaid);
      let defaultAmt = 25000;
      if (payment.isEmi && payment.emiPlan?.installments?.length > 0) {
        const nextPending = payment.emiPlan.installments.find(i => i.status !== 'paid');
        if (nextPending) {
          defaultAmt = Math.max(0, nextPending.amount - (nextPending.paidAmount || 0));
        }
      } else if (defaultRemaining > 0) {
        defaultAmt = defaultRemaining;
      }
      setPayRecordData({
        paymentId: payment._id,
        amount: defaultAmt,
        method: 'bank_transfer',
        remark: '',
        installmentNo: '',
      });
    }
    setShowPayRecordModal(true);
  };

  const handleSetFee = async e => {
    e.preventDefault();
    try {
      const isEmi = Boolean(paymentData.isEmi);
      const finalCount = isEmi
        ? (paymentData.installments?.length || Number(paymentData.emiCount) || 4)
        : 1;

      const payload = {
        type: paymentData.type,
        amountDue: Number(paymentData.amountDue) || 0,
        isEmi: isEmi,
      };

      if (isEmi) {
        payload.emiPlan = {
          totalEmis: finalCount,
          frequency: paymentData.emiFrequency || 'monthly',
          installments: paymentData.installments.map((inst, index) => ({
            installmentNo: inst.installmentNo || index + 1,
            name: inst.name || `EMI #${index + 1}`,
            amount: Number(inst.amount) || 0,
            dueDate: inst.dueDate ? inst.dueDate : null,
            paidAmount: Number(inst.paidAmount) || 0,
            status: inst.status || 'pending',
            paidDate: inst.paidDate || null,
          })),
        };
      }

      await fetchAPI(`/projects/${id}/payments`, { method: 'POST', body: JSON.stringify(payload) });
      setShowPaymentModal(false);
      showAlert({
        title: 'Fee Configured',
        message: `${paymentData.type === 'architect_fee' ? 'Architect Consultancy Fee' : 'Government Scrutiny Fee'} saved successfully as ${isEmi ? `EMI Plan (${finalCount} Installments)` : 'Full Lump Sum'}.`,
        type: 'success'
      });
      load();
    } catch (err) {
      showAlert({ title: 'Error', message: err.message, type: 'error' });
    }
  };

  const handlePayRecord = async e => {
    e.preventDefault();
    try {
      const payload = {
        amount: Number(payRecordData.amount),
        method: payRecordData.method,
        remark: payRecordData.remark,
        installmentNo: payRecordData.installmentNo ? Number(payRecordData.installmentNo) : null,
      };
      await fetchAPI(`/projects/${id}/payments/${payRecordData.paymentId}/history`, { method: 'POST', body: JSON.stringify(payload) });
      setShowPayRecordModal(false);
      showAlert({
        title: 'Payment Logged',
        message: `Payment installment of ₹${Number(payRecordData.amount).toLocaleString()} recorded.`,
        type: 'success'
      });
      load();
    } catch (err) {
      showAlert({ title: 'Error', message: err.message, type: 'error' });
    }
  };
  const handleBUStatus = async status => {
    try {
      await fetchAPI(`/projects/${id}/bu-permission/status`, { method: 'PATCH', body: JSON.stringify({ status, remark: `B.U. changed to ${status}` }) });
      showAlert({ title: 'B.U. Permission Updated', message: `Building Use status updated to ${status.replace('_', ' ')}.`, type: 'success' });
      load();
    } catch (err) {
      showAlert({ title: 'Error', message: err.message, type: 'error' });
    }
  };

  /* ── Buttons reused in modals ─ */
  const CancelBtn = ({ onClick }) => (
    <button type="button" className="btn-cancel" onClick={onClick}>
      Cancel
    </button>
  );
  const SaveBtn = ({ label = 'Save' }) => (
    <button type="submit" className="prism-btn prism-btn-primary prism-btn-md">{label}</button>
  );

  return (
    <div>
      {/* ══ PAGE HEADER ══════════════════════════════ */}
      <PageHeader
        title={project.projectName}
        subtitle={`Case: ${project.caseNo} • Zone: ${project.zone} (${project.ward}) • Owner: ${project.ownerName}`}
        icon={Building2}
        badge={<StatusBadge status={project.status} />}
        showBack
        backLabel="All Cases"
        backPath="/projects"
      >
        <PrismButton
          variant="secondary"
          icon={Image}
          onClick={() => navigate(`/projects/${id}/banner`)}
        >
          Print Banner
        </PrismButton>
        <PrismButton
          variant="primary"
          icon={Clock}
          onClick={() => setShowStatusModal(true)}
        >
          Advance Status
        </PrismButton>
      </PageHeader>

      {/* ══ PIPELINE STEPPER ════════════════════════ */}
      <div className="project-stepper-container">
        <div className="project-stepper-track">
          {/* Track line background */}
          <div className="project-stepper-line-bg" />
          {/* Active progress line fill */}
          <div
            className="project-stepper-line-fill"
            style={{
              width: currentStepIdx >= 0 ? `${(Math.min(currentStepIdx, PIPELINE.length - 1) / (PIPELINE.length - 1)) * 80}%` : '0%',
            }}
          />

          {PIPELINE.map((step, idx) => {
            const isPast    = currentStepIdx > idx;
            const isCurrent = currentStepIdx === idx;
            return (
              <div key={step.key} className="project-step-node">
                {/* Circle */}
                <div
                  className={`project-step-circle ${isCurrent ? 'is-current' : isPast ? 'is-past' : 'is-pending'}`}
                >
                  {isPast ? <CheckCircle2 size={16} /> : step.step}
                </div>
                {/* Label */}
                <span
                  className={`project-step-label ${isCurrent ? 'is-current' : isPast ? 'is-past' : 'is-pending'}`}
                >
                  <span className="step-label-full">{step.label}</span>
                  <span className="step-label-short">{step.shortLabel || step.label}</span>
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ══ TABS (Change Sections) ═══════════════════ */}
      <div className="project-tabs-grid">
        {TABS.map(t => {
          const Icon = t.icon;
          const isActive = activeTab === t.key;
          const count = t.key === 'documents' ? project.documents?.length : t.key === 'visits' ? siteVisits.length : null;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setActiveTab(t.key)}
              className={`project-tab-btn ${isActive ? 'is-active' : ''}`}
            >
              <Icon size={15} className="project-tab-icon" />
              <span className="tab-label-full">{t.label}</span>
              <span className="tab-label-short">{t.shortLabel || t.label}</span>
              {count != null && (
                <span className={`project-tab-badge ${isActive ? 'is-active' : ''}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ══ TAB: OVERVIEW ═══════════════════════════ */}
      {activeTab === 'overview' && (
        <div className="project-overview-grid">
          {/* Left: Case Spec + Team */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', minWidth: 0 }}>
            {/* Plot Details */}
            <div className="project-detail-card">
              <h3 style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', margin: '0 0 1.1rem', display: 'flex', alignItems: 'center', gap: '7px' }}>
                <Building2 size={17} color="var(--accent-primary)" /> Plot & Case Specifications
              </h3>
              <div className="project-spec-grid">
                <InfoCell label="Owner Name"       value={project.ownerName} />
                <InfoCell label="Rajachitthi No"   value={project.rajachitthiNo} accent />
                <InfoCell label="Rajachitthi Date" value={formatDate(project.rajachitthiDate)} />
                <InfoCell label="Block"   value={project.blockNo} />
                <InfoCell label="TPS"     value={project.tpsNo} />
                <InfoCell label="RS"      value={project.rsNo} />
                <InfoCell label="FP"      value={project.fpNo} />
                <InfoCell label="CS"      value={project.csNo} />
                <InfoCell label="SP"      value={project.spNo} />
                <InfoCell label="Municipal Zone" value={project.zone} />
                <InfoCell label="Ward"           value={project.ward} />
              </div>
            </div>

            {/* Professional Team */}
            <div className="project-detail-card">
              <h3 style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', margin: '0 0 1.1rem', display: 'flex', alignItems: 'center', gap: '7px' }}>
                <UserCheck size={17} color="#f59e0b" /> Appointed Professional Team
              </h3>
              <div className="project-team-grid">
                {[
                  { role: 'Architect',       data: project.architectId },
                  { role: 'Engineer',        data: project.engineerId },
                  { role: 'Contractor',      data: project.contractorId },
                  { role: 'Structural Eng',  data: project.structuralEngineerId },
                  { role: 'SOR Officer',     data: project.sorId },
                  { role: 'Developer',       data: project.developerId },
                ].map(({ role, data }) => (
                  <div key={role} style={{ minWidth: 0, wordBreak: 'break-word' }}>
                    <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '3px' }}>{role}</div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', wordBreak: 'break-word' }}>{data?.name || <span style={{ color: '#cbd5e1', fontWeight: 400 }}>Unassigned</span>}</div>
                    {data?.licenseNo && <div style={{ fontSize: '0.72rem', color: 'var(--accent-primary)', marginTop: '1px', wordBreak: 'break-all' }}>{data.licenseNo}</div>}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Status History */}
          <div className="project-detail-card">
            <h3 style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', margin: '0 0 1rem' }}>Status History</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {(project.statusHistory || []).map((h, i) => (
                <div key={i} style={{ display: 'flex', gap: '0.85rem', paddingBottom: '0.9rem', marginBottom: '0.9rem', borderBottom: i < (project.statusHistory.length - 1) ? '1px solid #f1f5f9' : 'none', minWidth: 0 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--accent-primary)', flexShrink: 0, marginTop: 5, border: '2px solid #c7d2fe' }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px', flexWrap: 'wrap', gap: '4px' }}>
                      <StatusBadge status={h.status} />
                      <span style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>{formatDate(h.date)}</span>
                    </div>
                    {h.remark && <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '2px', wordBreak: 'break-word' }}>{h.remark}</div>}
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>By {h.updatedBy}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══ TAB: DOCUMENTS ══════════════════════════ */}
      {activeTab === 'documents' && (
        <div className="project-detail-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <h3 style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', margin: 0 }}>Case Files & Sanction Letters</h3>
            <button onClick={() => setShowDocModal(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#eff1fe', border: '1.5px solid #c7d2fe', borderRadius: '8px', padding: '0.45rem 1rem', fontSize: '0.845rem', fontWeight: 600, color: 'var(--accent-primary)', cursor: 'pointer' }}>
              <Upload size={15} /> Attach File
            </button>
          </div>
          {!project.documents?.length ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
              <Paperclip size={36} style={{ marginBottom: '0.75rem', opacity: 0.4 }} />
              <p style={{ margin: 0, fontSize: '0.875rem' }}>No documents attached yet.</p>
            </div>
          ) : (
            <div className="responsive-card-view">
              <div className="table-desktop" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 520 }}>
                  <thead><tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                    {['File', 'Type', 'Uploaded', 'By', ''].map(h => (
                      <th key={h} style={{ padding: '0.6rem 0.75rem', textAlign: 'left', fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#94a3b8' }}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {project.documents.map((doc, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #f8fafc' }}>
                        <td style={{ padding: '0.8rem 0.75rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                            <Paperclip size={14} color="var(--accent-primary)" />{doc.fileName}
                          </div>
                        </td>
                        <td style={{ padding: '0.8rem 0.75rem' }}>
                          <span style={{ background: '#fffbeb', border: '1px solid #fde68a', color: '#92400e', borderRadius: '5px', fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', padding: '2px 8px' }}>{doc.type}</span>
                        </td>
                        <td style={{ padding: '0.8rem 0.75rem', fontSize: '0.83rem', color: 'var(--text-muted)' }}>{formatDate(doc.uploadedAt)}</td>
                        <td style={{ padding: '0.8rem 0.75rem', fontSize: '0.83rem', color: 'var(--text-secondary)' }}>{doc.uploadedBy}</td>
                        <td style={{ padding: '0.8rem 0.75rem', textAlign: 'right' }}>
                          <a href={getFileUrl(doc.fileUrl)} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '4px 10px', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', textDecoration: 'none' }}>
                            <ExternalLink size={12} /> Open
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card List */}
              <div className="cards-mobile" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {project.documents.map((doc, i) => (
                  <div key={i} className="project-detail-mobile-card">
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', minWidth: 0 }}>
                        <Paperclip size={15} color="var(--accent-primary)" style={{ flexShrink: 0, marginTop: 3 }} />
                        <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)', wordBreak: 'break-word' }}>
                          {doc.fileName}
                        </span>
                      </div>
                      <span style={{ background: '#fffbeb', border: '1px solid #fde68a', color: '#92400e', borderRadius: '5px', fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', padding: '2px 7px', flexShrink: 0 }}>
                        {doc.type}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {formatDate(doc.uploadedAt)} · by {doc.uploadedBy}
                      </div>
                      <a href={getFileUrl(doc.fileUrl)} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '3px 9px', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', textDecoration: 'none' }}>
                        <ExternalLink size={12} /> Open
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══ TAB: PROGRESS ════════════════════════════ */}
      {activeTab === 'progress' && (
        <div className="project-detail-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h3 style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', margin: '0 0 2px' }}>Construction Progress Tracker</h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>Foundation → Plinth → Middle Story → Top Slab</p>
            </div>
            <button onClick={() => setShowProgressModal(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#eff1fe', border: '1.5px solid #c7d2fe', borderRadius: '8px', padding: '0.45rem 1rem', fontSize: '0.845rem', fontWeight: 600, color: 'var(--accent-primary)', cursor: 'pointer' }}>
              <Plus size={15} /> Record Stage
            </button>
          </div>
          <div className="project-progress-grid">
            {['foundation', 'plinth', 'middle_story', 'top_slab'].map(stg => {
              const sd = progressStages.find(s => s.stage === stg);
              return (
                <div key={stg} style={{ borderRadius: '12px', padding: '1.1rem 1.25rem', border: `1.5px solid ${sd ? '#a7f3d0' : '#e2e8f0'}`, background: sd ? '#f0fdf4' : '#f8fafc', minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem', flexWrap: 'wrap', gap: '6px' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)', textTransform: 'capitalize' }}>
                      {stg.replace('_', ' ')}
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', borderRadius: '99px', padding: '3px 10px', fontSize: '0.68rem', fontWeight: 800, background: sd ? '#dcfce7' : '#f1f5f9', color: sd ? '#16a34a' : '#94a3b8', border: `1px solid ${sd ? '#a7f3d0' : '#e2e8f0'}` }}>
                      {sd ? <><CheckCircle2 size={12} /> Completed</> : 'Pending'}
                    </span>
                  </div>
                  {sd ? (
                    <>
                      <p style={{ fontSize: '0.845rem', color: 'var(--text-secondary)', margin: '0 0 4px', wordBreak: 'break-word' }}>{sd.remarks || 'Stage verified.'}</p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                        {formatDate(sd.completionDate)} · by {sd.updatedBy}
                      </p>
                    </>
                  ) : (
                    <p style={{ fontSize: '0.845rem', color: '#94a3b8', margin: 0 }}>Not yet recorded</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ══ TAB: SITE VISITS ════════════════════════ */}
      {activeTab === 'visits' && (
        <div className="project-detail-card">
          <h3 style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', margin: '0 0 1.25rem' }}>Scheduled Site Visits</h3>
          {!siteVisits.length ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
              <CalendarCheck size={36} style={{ marginBottom: '0.75rem', opacity: 0.4 }} />
              <p style={{ margin: 0 }}>No site visits scheduled.</p>
            </div>
          ) : (
            <div className="responsive-card-view">
              <div className="table-desktop" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 550 }}>
                  <thead><tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                    {['Date', 'Purpose', 'Assigned To', 'Status', 'Notes'].map(h => (
                      <th key={h} style={{ padding: '0.6rem 0.75rem', textAlign: 'left', fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#94a3b8' }}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {siteVisits.map(v => (
                      <tr key={v._id} style={{ borderBottom: '1px solid #f8fafc' }}>
                        <td style={{ padding: '0.85rem 0.75rem', fontWeight: 700, color: 'var(--accent-primary)', fontSize: '0.855rem', whiteSpace: 'nowrap' }}>
                          {formatDate(v.scheduledDate)}
                        </td>
                        <td style={{ padding: '0.85rem 0.75rem', fontSize: '0.855rem', color: 'var(--text-primary)' }}>{v.purpose}</td>
                        <td style={{ padding: '0.85rem 0.75rem', fontSize: '0.845rem', color: 'var(--text-secondary)' }}>{v.assignedTo?.name || 'Staff'}</td>
                        <td style={{ padding: '0.85rem 0.75rem' }}><StatusBadge status={v.status} /></td>
                        <td style={{ padding: '0.85rem 0.75rem', fontSize: '0.82rem', color: 'var(--text-muted)' }}>{v.notes || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card List */}
              <div className="cards-mobile" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {siteVisits.map(v => (
                  <div key={v._id} className="project-detail-mobile-card">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700, color: 'var(--accent-primary)', fontSize: '0.855rem' }}>
                        {formatDate(v.scheduledDate)}
                      </span>
                      <StatusBadge status={v.status} />
                    </div>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)', marginBottom: '0.4rem', wordBreak: 'break-word' }}>
                      {v.purpose}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: v.notes ? '0.35rem' : 0 }}>
                      <UserCheck size={13} color="#94a3b8" /> Staff: <strong>{v.assignedTo?.name || 'Staff'}</strong>
                    </div>
                    {v.notes && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', background: '#fff', border: '1px solid #e2e8f0', padding: '4px 8px', borderRadius: '6px', marginTop: '0.35rem', wordBreak: 'break-word' }}>
                        {v.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══ TAB: B.U. PERMISSION ════════════════════ */}
      {activeTab === 'bu' && (
        <div className="project-detail-card">
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h3 style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', margin: '0 0 2px', display: 'flex', alignItems: 'center', gap: '7px' }}>
                <BadgeCheck size={17} color="#10b981" /> Building Use (B.U.) Permission
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>Gated workflow — unlocks after Top Slab stage is recorded</p>
            </div>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', borderRadius: '99px', padding: '4px 14px', fontSize: '0.75rem', fontWeight: 800, background: buPermission?.isUnlocked ? '#dcfce7' : '#fef2f2', color: buPermission?.isUnlocked ? '#16a34a' : '#b91c1c', border: `1px solid ${buPermission?.isUnlocked ? '#a7f3d0' : '#fecaca'}` }}>
              {buPermission?.isUnlocked ? <><CheckCircle2 size={13} /> Unlocked</> : <><Lock size={13} /> Locked</>}
            </span>
          </div>
          {!buPermission?.isUnlocked ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', background: '#fef2f2', borderRadius: '12px', border: '1.5px dashed #fecaca' }}>
              <Lock size={40} color="#ef4444" style={{ marginBottom: '0.75rem', opacity: 0.6 }} />
              <h4 style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>B.U. Module Locked</h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', maxWidth: '420px', margin: '0 auto' }}>
                Record the <strong>Top Slab</strong> stage in the Progress tab to unlock the B.U. Permission application workflow.
              </p>
            </div>
          ) : (
            <div>
              <div style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '12px', padding: '1.1rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '4px' }}>Current B.U. Status</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'capitalize' }}>
                    {buPermission.data?.status?.replace('_', ' ') || 'Not Started'}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', width: '100%', maxWidth: 'max-content' }}>
                  {[
                    { label: 'Submit App', status: 'application_submitted', color: 'var(--accent-primary)', bg: '#eff1fe', border: '#c7d2fe' },
                    { label: 'Under Review', status: 'under_review', color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
                    { label: 'Approve B.U.', status: 'approved', color: '#16a34a', bg: '#dcfce7', border: '#a7f3d0' },
                  ].map(b => (
                    <button key={b.status} onClick={() => handleBUStatus(b.status)} className="bu-action-btn"
                      style={{ background: b.bg, border: `1.5px solid ${b.border}`, borderRadius: '8px', color: b.color, fontWeight: 700, fontSize: '0.845rem', padding: '0.45rem 1rem', cursor: 'pointer' }}>
                      {b.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══ TAB: PAYMENTS ════════════════════════════ */}
      {activeTab === 'payments' && (
        <div className="project-detail-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h3 style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', margin: '0 0 2px' }}>Fee & Payment Tracking</h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>Manage architectural fee structures, EMI installments, and government chalan payments</p>
            </div>
            <button
              type="button"
              onClick={() => openFeeModal()}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#eff1fe', border: '1.5px solid #c7d2fe', borderRadius: '8px', padding: '0.45rem 1rem', fontSize: '0.845rem', fontWeight: 600, color: 'var(--accent-primary)', cursor: 'pointer' }}
            >
              <Plus size={15} /> Add / Configure Fee
            </button>
          </div>

          {!payments.length ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
              <CreditCard size={36} style={{ marginBottom: '0.75rem', opacity: 0.4 }} />
              <p style={{ margin: 0 }}>No fee records configured yet.</p>
              <button
                type="button"
                onClick={() => openFeeModal()}
                style={{ marginTop: '0.75rem', background: '#eff1fe', border: '1px solid #c7d2fe', borderRadius: '7px', color: 'var(--accent-primary)', padding: '6px 14px', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}
              >
                Set Initial Fee Structure
              </button>
            </div>
          ) : (
            <div className="project-payments-grid">
              {payments.map(p => {
                const balance = Math.max(0, p.amountDue - p.amountPaid);
                const pct = p.amountDue > 0 ? Math.min(100, (p.amountPaid / p.amountDue) * 100) : 0;
                const paidEmisCount = p.emiPlan?.installments?.filter(i => i.status === 'paid').length || 0;
                const totalEmisCount = p.emiPlan?.installments?.length || p.emiPlan?.totalEmis || 0;

                return (
                  <div key={p._id} style={{ border: '1.5px solid #e2e8f0', borderRadius: '12px', padding: '1.1rem 1.25rem', background: '#f8fafc', minWidth: 0 }}>
                    {/* Header */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 800, fontSize: '0.875rem', color: 'var(--text-primary)', textTransform: 'uppercase' }}>
                          {p.type.replace('_', ' ')}
                        </span>
                        {p.isEmi ? (
                          <span className="emi-badge-plan">
                            <Layers size={13} /> {totalEmisCount} EMIs ({p.emiPlan?.frequency || 'monthly'})
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.7rem', color: '#64748b', background: '#f1f5f9', padding: '3px 8px', borderRadius: '6px', fontWeight: 700, border: '1px solid #e2e8f0', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            Full Lump Sum
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <button
                          type="button"
                          onClick={() => openFeeModal(p)}
                          title="Edit Fee or EMI Plan"
                          style={{ background: '#fff', border: '1px solid #cbd5e1', borderRadius: '7px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.78rem', padding: '4px 10px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        >
                          <Edit3 size={12} /> Edit Plan
                        </button>
                        <button
                          type="button"
                          onClick={() => openPayRecordModal(p)}
                          style={{ background: '#dcfce7', border: '1px solid #a7f3d0', borderRadius: '7px', color: '#16a34a', fontWeight: 700, fontSize: '0.78rem', padding: '4px 12px', cursor: 'pointer' }}
                        >
                          + Log Payment
                        </button>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div style={{ height: 6, background: '#e2e8f0', borderRadius: '99px', marginBottom: '0.9rem', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg, #10b981, #34d399)', borderRadius: '99px', transition: 'width 0.5s' }} />
                    </div>

                    {/* 3 Metric Cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '0.5rem', marginBottom: '0.85rem' }}>
                      {[
                        { label: 'Total Due', val: `₹${p.amountDue.toLocaleString()}`, color: 'var(--text-primary)' },
                        { label: 'Received', val: `₹${p.amountPaid.toLocaleString()}`, color: '#10b981' },
                        { label: 'Balance', val: `₹${balance.toLocaleString()}`, color: balance > 0 ? '#f59e0b' : '#10b981' },
                      ].map(x => (
                        <div key={x.label} style={{ textAlign: 'center', background: '#fff', borderRadius: '8px', padding: '0.5rem 0.25rem', border: '1px solid #f1f5f9', minWidth: 0, overflow: 'hidden' }}>
                          <div style={{ fontSize: '0.62rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{x.label}</div>
                          <div style={{ fontSize: '0.82rem', fontWeight: 800, color: x.color, wordBreak: 'break-word' }}>{x.val}</div>
                        </div>
                      ))}
                    </div>

                    {/* EMI Installment Timeline / Schedule */}
                    {p.isEmi && p.emiPlan?.installments?.length > 0 && (
                      <div style={{ marginTop: '0.85rem', marginBottom: '0.85rem' }}>
                        {/* Dropdown Accordion Trigger */}
                        <button
                          type="button"
                          className={`emi-accordion-toggle ${expandedEmiPlans[p._id] ? 'active' : ''}`}
                          onClick={() => toggleEmiPlan(p._id)}
                          style={{ boxSizing: 'border-box' }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', minWidth: 0 }}>
                            <Layers size={15} color="var(--accent-primary)" style={{ flexShrink: 0 }} />
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                Installment Schedule
                              </div>
                              <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>
                                {paidEmisCount} of {totalEmisCount} Paid ({totalEmisCount > 0 ? Math.round((paidEmisCount / totalEmisCount) * 100) : 0}%)
                              </div>
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}>
                            <ChevronDown
                              size={16}
                              className={`emi-chevron-icon ${expandedEmiPlans[p._id] ? 'expanded' : ''}`}
                            />
                          </div>
                        </button>

                        {/* Collapsible EMI Installments Content */}
                        {expandedEmiPlans[p._id] && (
                          <div className="emi-installment-list" style={{ marginTop: '0.65rem' }}>
                          {p.emiPlan.installments.map((inst, idx) => {
                            const isPaid = inst.status === 'paid';
                            const isPart = inst.status === 'partially_paid';
                            const isOverdue = !isPaid && inst.dueDate && new Date(inst.dueDate) < new Date();
                            const cardClass = isPaid ? 'is-paid' : isPart ? 'is-partially-paid' : isOverdue ? 'is-overdue' : '';
                            const pendingAmount = Math.max(0, inst.amount - (inst.paidAmount || 0));

                            return (
                              <div key={idx} className={`emi-installment-card ${cardClass}`}>
                                {/* Top Row: Number, Name & Amount */}
                                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.65rem', width: '100%' }}>
                                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.55rem', flex: 1, minWidth: 0 }}>
                                    <div style={{
                                      width: 26, height: 26, borderRadius: '50%',
                                      background: isPaid ? '#dcfce7' : isPart ? '#e0f2fe' : isOverdue ? '#fee2e2' : '#f1f5f9',
                                      color: isPaid ? '#15803d' : isPart ? '#0369a1' : isOverdue ? '#b91c1c' : '#475569',
                                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                                      fontSize: '0.74rem', fontWeight: 800, flexShrink: 0, marginTop: 1
                                    }}>
                                      {inst.installmentNo}
                                    </div>

                                    <div style={{ minWidth: 0, flex: 1 }}>
                                      <div style={{ fontWeight: 700, fontSize: '0.855rem', color: 'var(--text-primary)', lineHeight: 1.3, wordBreak: 'normal', overflowWrap: 'break-word' }}>
                                        {inst.name || `Installment #${inst.installmentNo}`}
                                      </div>
                                    </div>
                                  </div>

                                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                    <div style={{ fontWeight: 800, fontSize: '0.9rem', color: isPaid ? '#15803d' : 'var(--text-primary)' }}>
                                      ₹{inst.amount.toLocaleString()}
                                    </div>
                                    {isPart && (
                                      <div style={{ fontSize: '0.68rem', color: '#0369a1', fontWeight: 600 }}>
                                        ₹{pendingAmount.toLocaleString()} pending
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Bottom Row: Due date / Paid date & Status / Action */}
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', width: '100%', marginTop: '0.35rem', paddingTop: '0.35rem', borderTop: '1px dashed #e2e8f0', flexWrap: 'wrap' }}>
                                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    {inst.dueDate ? (
                                      <span>Due: <strong style={{ color: isOverdue ? '#dc2626' : 'var(--text-secondary)' }}>{formatDate(inst.dueDate)}</strong></span>
                                    ) : (
                                      <span>No due date</span>
                                    )}
                                    {isPaid && inst.paidDate && (
                                      <span style={{ color: '#16a34a' }}>• Paid {formatDate(inst.paidDate)}</span>
                                    )}
                                  </div>

                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
                                    {isPaid ? (
                                      <span className="emi-status-pill paid">
                                        <CheckCircle2 size={12} /> Paid
                                      </span>
                                    ) : isPart ? (
                                      <span className="emi-status-pill partially_paid">
                                        <Clock size={12} /> ₹{inst.paidAmount.toLocaleString()} Paid
                                      </span>
                                    ) : isOverdue ? (
                                      <span className="emi-status-pill overdue">
                                        <AlertCircle size={12} /> Overdue
                                      </span>
                                    ) : (
                                      <span className="emi-status-pill pending">
                                        <Clock size={12} /> Due
                                      </span>
                                    )}

                                    {!isPaid && (
                                      <button
                                        type="button"
                                        onClick={() => openPayRecordModal(p, inst)}
                                        style={{
                                          background: '#eff1fe',
                                          border: '1px solid #c7d2fe',
                                          borderRadius: '6px',
                                          color: 'var(--accent-primary)',
                                          fontWeight: 700,
                                          fontSize: '0.74rem',
                                          padding: '3px 9px',
                                          cursor: 'pointer',
                                          whiteSpace: 'nowrap'
                                        }}
                                      >
                                        Pay EMI
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Payment History Log */}
                    {p.paymentHistory?.length > 0 && (
                      <>
                        <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.4rem', marginTop: p.isEmi ? '0.75rem' : 0 }}>
                          Payment Log ({p.paymentHistory.length})
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '110px', overflowY: 'auto' }}>
                          {p.paymentHistory.map((h, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', borderRadius: '6px', padding: '5px 10px', fontSize: '0.78rem', border: '1px solid #f1f5f9', flexWrap: 'wrap', gap: '4px' }}>
                              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                ₹{h.amount.toLocaleString()}{' '}
                                <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>
                                  via {h.method?.replace('_', ' ')}
                                  {h.installmentNo ? ` • EMI #${h.installmentNo}` : ''}
                                  {h.remark ? ` (${h.remark})` : ''}
                                </span>
                              </span>
                              <span style={{ color: 'var(--text-muted)' }}>{formatDate(h.date)}</span>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ══ MODALS ════════════════════════════════════ */}

      {/* Status Update */}
      <AppModal show={showStatusModal} onHide={() => setShowStatusModal(false)} title="Advance Approval Pipeline Status">
        <form id="status-form" onSubmit={handleUpdateStatus}>
          <div className="project-detail-modal-body">
            <LabeledField label="New Status">
              <select value={newStatus} onChange={e => setNewStatus(e.target.value)} style={{ ...inp, height: 38, cursor: 'pointer' }} onFocus={onF} onBlur={onB}>
                <option value="submitted">1. Submitted</option>
                <option value="under_scrutiny">2. Under Scrutiny</option>
                <option value="query_raised">3. Query Raised</option>
                <option value="approved">4. Approved</option>
                <option value="rejected">Rejected</option>
                <option value="rajachitthi_issued">5. Rajachitthi Issued</option>
              </select>
            </LabeledField>
            <LabeledField label="Official Remark / Note">
              <textarea value={statusRemark} onChange={e => setStatusRemark(e.target.value)} rows={3} required placeholder="Enter audit remarks..." style={{ ...inp, height: 'auto', resize: 'vertical' }} onFocus={onF} onBlur={onB} />
            </LabeledField>
          </div>
          <div className="form-footer">
            <CancelBtn onClick={() => setShowStatusModal(false)} />
            <SaveBtn label="Save Transition" />
          </div>
        </form>
      </AppModal>

      {/* Document Upload */}
      <AppModal show={showDocModal} onHide={() => setShowDocModal(false)} title="Attach Case File / Drawing">
        <form onSubmit={handleUploadDocument}>
          <div className="project-detail-modal-body">
            <LabeledField label="Document Type">
              <select value={docType} onChange={e => setDocType(e.target.value)} style={{ ...inp, height: 38, cursor: 'pointer' }} onFocus={onF} onBlur={onB}>
                <option value="drawing">Architectural Drawing (DWG/PDF)</option>
                <option value="rajachitthi">Rajachitthi Letter</option>
                <option value="noc">NOC (Fire/Drainage/Airport)</option>
                <option value="application">Application Copy</option>
              </select>
            </LabeledField>
            <LabeledField label="Select File">
              <input type="file" onChange={e => setDocFile(e.target.files[0])} required style={{ ...inp, height: 'auto', padding: '0.45rem 0.9rem' }} />
            </LabeledField>
          </div>
          <div className="form-footer">
            <CancelBtn onClick={() => setShowDocModal(false)} />
            <SaveBtn label="Upload File" />
          </div>
        </form>
      </AppModal>

      {/* Progress Stage */}
      <AppModal show={showProgressModal} onHide={() => setShowProgressModal(false)} title="Record Construction Stage">
        <form onSubmit={handleSaveProgress}>
          <div className="project-detail-modal-body">
            <LabeledField label="Stage">
              <select value={progressForm.stage} onChange={e => setProgressForm({ ...progressForm, stage: e.target.value })} style={{ ...inp, height: 38, cursor: 'pointer' }} onFocus={onF} onBlur={onB}>
                <option value="foundation">Foundation / Basement</option>
                <option value="plinth">Plinth Ground</option>
                <option value="middle_story">Middle Story</option>
                <option value="top_slab">Top Slab (Unlocks B.U.)</option>
              </select>
            </LabeledField>
            <LabeledField label="Remarks">
              <textarea value={progressForm.remarks} onChange={e => setProgressForm({ ...progressForm, remarks: e.target.value })} rows={2} required style={{ ...inp, height: 'auto', resize: 'vertical' }} onFocus={onF} onBlur={onB} />
            </LabeledField>
          </div>
          <div className="form-footer">
            <CancelBtn onClick={() => setShowProgressModal(false)} />
            <SaveBtn label="Save Stage" />
          </div>
        </form>
      </AppModal>

      {/* Set Fee & EMI Plan */}
      <AppModal show={showPaymentModal} onHide={() => setShowPaymentModal(false)} title="Set Fee Structure & Payment Plan">
        <form onSubmit={handleSetFee}>
          <div className="project-detail-modal-body">
            <LabeledField label="Fee Category">
              <select value={paymentData.type} onChange={e => handleFeeCategoryChange(e.target.value)} style={{ ...inp, height: 38, cursor: 'pointer' }} onFocus={onF} onBlur={onB}>
                <option value="architect_fee">Architect Consultancy Fee</option>
                <option value="govt_fee">Government Scrutiny Chalan Fee</option>
              </select>
            </LabeledField>

            <LabeledField label="Total Amount Due (₹)">
              <input
                type="number"
                value={paymentData.amountDue}
                onChange={e => {
                  const newTotal = Number(e.target.value) || 0;
                  const currentCount = paymentData.emiCount || (paymentData.installments?.length > 0 ? paymentData.installments.length : 4);
                  if (paymentData.isEmi) {
                    setPaymentData({
                      ...paymentData,
                      amountDue: newTotal,
                      emiCount: currentCount,
                      installments: generateInstallments(newTotal, currentCount, paymentData.emiFrequency || 'monthly')
                    });
                  } else {
                    setPaymentData({ ...paymentData, amountDue: newTotal });
                  }
                }}
                required
                style={inp}
                onFocus={onF}
                onBlur={onB}
              />
            </LabeledField>

            <LabeledField label="Payment Structure">
              <div className="emi-plan-toggle">
                <button
                  type="button"
                  className={`emi-plan-toggle-btn ${!paymentData.isEmi ? 'active' : ''}`}
                  onClick={() => setPaymentData({ ...paymentData, isEmi: false })}
                >
                  <CreditCard size={15} /> Standard Lump Sum
                </button>
                <button
                  type="button"
                  className={`emi-plan-toggle-btn ${paymentData.isEmi ? 'active' : ''}`}
                  onClick={() => {
                    const count = paymentData.emiCount || (paymentData.installments?.length > 0 ? paymentData.installments.length : 4);
                    const freq = paymentData.emiFrequency || 'monthly';
                    setPaymentData({
                      ...paymentData,
                      isEmi: true,
                      emiCount: count,
                      emiFrequency: freq,
                      installments: (paymentData.installments && paymentData.installments.length === count)
                        ? paymentData.installments
                        : generateInstallments(paymentData.amountDue, count, freq)
                    });
                  }}
                >
                  <Layers size={15} /> EMI / Milestone Plan
                </button>
              </div>
              <div style={{ fontSize: '0.73rem', color: '#64748b', marginTop: '6px' }}>
                Active Mode: <strong style={{ color: paymentData.isEmi ? 'var(--accent-primary)' : '#1e293b' }}>
                  {paymentData.isEmi ? `EMI Plan (${paymentData.emiCount || paymentData.installments?.length || 4} Installments • ${paymentData.emiFrequency || 'monthly'})` : 'Standard Lump Sum (Full Amount)'}
                </strong>
              </div>
            </LabeledField>

            {/* EMI Configuration Section */}
            {paymentData.isEmi && (
              <div style={{ marginTop: '0.5rem', background: '#ffffff', border: '1.5px solid #c7d2fe', borderRadius: '10px', padding: '0.9rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.65rem', marginBottom: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.25rem', textTransform: 'uppercase' }}>
                      No. of EMIs
                    </label>
                    <select
                      value={paymentData.emiCount || (paymentData.installments?.length > 0 ? paymentData.installments.length : 4)}
                      onChange={e => {
                        const newCount = parseInt(e.target.value, 10);
                        setPaymentData({
                          ...paymentData,
                          emiCount: newCount,
                          installments: generateInstallments(paymentData.amountDue, newCount, paymentData.emiFrequency || 'monthly')
                        });
                      }}
                      style={{ ...inp, height: 36, padding: '0.35rem 0.65rem', fontSize: '0.82rem' }}
                      onFocus={onF}
                      onBlur={onB}
                    >
                      {[2, 3, 4, 5, 6, 8, 10, 12].map(n => (
                        <option key={n} value={n}>{n} Installments</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.25rem', textTransform: 'uppercase' }}>
                      Frequency / Model
                    </label>
                    <select
                      value={paymentData.emiFrequency || 'monthly'}
                      onChange={e => {
                        const newFreq = e.target.value;
                        const count = paymentData.emiCount || (paymentData.installments?.length > 0 ? paymentData.installments.length : 4);
                        setPaymentData({
                          ...paymentData,
                          emiFrequency: newFreq,
                          installments: generateInstallments(paymentData.amountDue, count, newFreq)
                        });
                      }}
                      style={{ ...inp, height: 36, padding: '0.35rem 0.65rem', fontSize: '0.82rem' }}
                      onFocus={onF}
                      onBlur={onB}
                    >
                      <option value="monthly">Monthly</option>
                      <option value="quarterly">Quarterly</option>
                      <option value="milestone">Milestone Stages</option>
                      <option value="custom">Custom Schedule</option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                    <button
                      type="button"
                      onClick={() => {
                        const count = paymentData.emiCount || (paymentData.installments?.length > 0 ? paymentData.installments.length : 4);
                        setPaymentData({
                          ...paymentData,
                          installments: generateInstallments(paymentData.amountDue, count, paymentData.emiFrequency || 'monthly')
                        });
                      }}
                      style={{
                        width: '100%',
                        height: 36,
                        background: '#eff1fe',
                        border: '1.5px solid #c7d2fe',
                        borderRadius: '8px',
                        color: 'var(--accent-primary)',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '5px'
                      }}
                    >
                      <RefreshCw size={13} /> Reset Split
                    </button>
                  </div>
                </div>

                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.4rem', letterSpacing: '0.04em' }}>
                  Installment Breakdown & Due Dates
                </div>

                <div className="emi-editor-box">
                  {paymentData.installments?.map((inst, index) => (
                    <div key={index} className="emi-editor-row">
                      <div className="emi-editor-index">#{inst.installmentNo}</div>
                      <input
                        type="text"
                        className="emi-editor-name"
                        value={inst.name}
                        onChange={e => {
                          const updated = [...paymentData.installments];
                          updated[index] = { ...updated[index], name: e.target.value };
                          setPaymentData({ ...paymentData, installments: updated });
                        }}
                        placeholder={`Stage #${index + 1} Name`}
                        style={{ ...inp, height: 34, padding: '0.3rem 0.6rem', fontSize: '0.82rem' }}
                        onFocus={onF}
                        onBlur={onB}
                      />
                      <input
                        type="number"
                        value={inst.amount}
                        onChange={e => {
                          const updated = [...paymentData.installments];
                          updated[index] = { ...updated[index], amount: Number(e.target.value) || 0 };
                          setPaymentData({ ...paymentData, installments: updated });
                        }}
                        placeholder="Amount"
                        style={{ ...inp, height: 34, padding: '0.3rem 0.6rem', fontSize: '0.82rem', fontWeight: 700 }}
                        onFocus={onF}
                        onBlur={onB}
                      />
                      <input
                        type="date"
                        value={inst.dueDate || ''}
                        onChange={e => {
                          const updated = [...paymentData.installments];
                          updated[index] = { ...updated[index], dueDate: e.target.value };
                          setPaymentData({ ...paymentData, installments: updated });
                        }}
                        style={{ ...inp, height: 34, padding: '0.3rem 0.6rem', fontSize: '0.78rem' }}
                        onFocus={onF}
                        onBlur={onB}
                      />
                    </div>
                  ))}
                </div>

                {/* Validation summary */}
                {(() => {
                  const sum = paymentData.installments?.reduce((acc, cur) => acc + (Number(cur.amount) || 0), 0) || 0;
                  const target = Number(paymentData.amountDue) || 0;
                  const diff = target - sum;
                  const isMatch = Math.abs(diff) === 0;
                  return (
                    <div style={{
                      fontSize: '0.76rem',
                      fontWeight: 700,
                      padding: '7px 10px',
                      borderRadius: '8px',
                      marginTop: '0.65rem',
                      background: isMatch ? '#dcfce7' : '#fffbeb',
                      color: isMatch ? '#15803d' : '#b45309',
                      border: `1px solid ${isMatch ? '#86efac' : '#fde68a'}`,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '4px'
                    }}>
                      <span>
                        {isMatch ? '✓ Installments match total fee' : `⚠️ Split differs by ₹${Math.abs(diff).toLocaleString()}`}
                      </span>
                      <span>
                        Sum: ₹{sum.toLocaleString()} / ₹{target.toLocaleString()}
                      </span>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
          <div className="form-footer">
            <CancelBtn onClick={() => setShowPaymentModal(false)} />
            <SaveBtn label="Save Fee Plan" />
          </div>
        </form>
      </AppModal>

      {/* Log Payment */}
      <AppModal show={showPayRecordModal} onHide={() => setShowPayRecordModal(false)} title="Log Payment Received">
        <form onSubmit={handlePayRecord}>
          <div className="project-detail-modal-body">
            {/* Installment selection if EMI */}
            {(() => {
              const activePay = payments.find(p => p._id === payRecordData.paymentId);
              if (activePay?.isEmi && activePay.emiPlan?.installments?.length > 0) {
                return (
                  <LabeledField label="Apply to EMI Installment">
                    <select
                      value={payRecordData.installmentNo || ''}
                      onChange={e => {
                        const selectedNo = e.target.value ? Number(e.target.value) : '';
                        if (selectedNo) {
                          const found = activePay.emiPlan.installments.find(i => i.installmentNo === selectedNo);
                          const rem = found ? Math.max(0, found.amount - (found.paidAmount || 0)) : payRecordData.amount;
                          setPayRecordData({
                            ...payRecordData,
                            installmentNo: selectedNo,
                            amount: rem > 0 ? rem : payRecordData.amount,
                            remark: `Payment for EMI #${selectedNo}${found?.name ? ` (${found.name})` : ''}`,
                          });
                        } else {
                          setPayRecordData({
                            ...payRecordData,
                            installmentNo: '',
                            remark: '',
                          });
                        }
                      }}
                      style={{ ...inp, height: 38, cursor: 'pointer' }}
                      onFocus={onF}
                      onBlur={onB}
                    >
                      <option value="">Auto Allocate (Earliest Due Installment)</option>
                      {activePay.emiPlan.installments.map(inst => {
                        const remaining = Math.max(0, inst.amount - (inst.paidAmount || 0));
                        return (
                          <option key={inst.installmentNo} value={inst.installmentNo}>
                            EMI #{inst.installmentNo}: {inst.name} — ₹{remaining.toLocaleString()} due {inst.status === 'paid' ? '✓ (Fully Paid)' : ''}
                          </option>
                        );
                      })}
                    </select>
                  </LabeledField>
                );
              }
              return null;
            })()}

            <LabeledField label="Amount Received (₹)">
              <input
                type="number"
                value={payRecordData.amount}
                onChange={e => setPayRecordData({ ...payRecordData, amount: e.target.value })}
                required
                style={inp}
                onFocus={onF}
                onBlur={onB}
              />
            </LabeledField>

            <LabeledField label="Payment Method">
              <select value={payRecordData.method} onChange={e => setPayRecordData({ ...payRecordData, method: e.target.value })} style={{ ...inp, height: 38, cursor: 'pointer' }} onFocus={onF} onBlur={onB}>
                <option value="bank_transfer">Bank Transfer / NEFT / RTGS</option>
                <option value="cheque">Cheque</option>
                <option value="online_chalan">Online Govt Chalan</option>
                <option value="cash">Cash</option>
                <option value="upi">UPI / QR Code</option>
              </select>
            </LabeledField>

            <LabeledField label="Reference / Notes">
              <input
                type="text"
                value={payRecordData.remark || ''}
                onChange={e => setPayRecordData({ ...payRecordData, remark: e.target.value })}
                placeholder="e.g. UTR #123456 or Cheque #000123"
                style={inp}
                onFocus={onF}
                onBlur={onB}
              />
            </LabeledField>
          </div>
          <div className="form-footer">
            <CancelBtn onClick={() => setShowPayRecordModal(false)} />
            <SaveBtn label="Record Payment" />
          </div>
        </form>
      </AppModal>
    </div>
  );
};

export default ProjectDetailPage;
