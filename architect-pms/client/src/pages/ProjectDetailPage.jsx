import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchAPI } from '../services/api';
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
} from 'lucide-react';
import { Modal } from 'react-bootstrap';

/* ── Reusable Info Cell ─────────────────────────────── */
const InfoCell = ({ label, value, accent = false }) => (
  <div>
    <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '3px' }}>
      {label}
    </div>
    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: accent ? 'var(--accent-primary)' : 'var(--text-primary)' }}>
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
};
const onF = e => { e.target.style.borderColor = '#4f6ef7'; e.target.style.boxShadow = '0 0 0 3px rgba(79,110,247,0.12)'; e.target.style.background = '#fff'; };
const onB = e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; e.target.style.background = '#f8fafc'; };

/* ── Modal Wrapper ─────────────────────────────────── */
const AppModal = ({ show, onHide, title, children, footer }) => (
  <Modal show={show} onHide={onHide} centered>
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '18px', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
      <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h5 style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)', margin: 0 }}>{title}</h5>
        <button onClick={onHide} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px', fontSize: '1.2rem', lineHeight: 1 }}>×</button>
      </div>
      <div style={{ padding: '1.25rem 1.5rem' }}>{children}</div>
      {footer && <div className="form-footer">{footer}</div>}
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
  { key: 'submitted',          label: 'Submitted',          step: 1 },
  { key: 'under_scrutiny',     label: 'Under Scrutiny',     step: 2 },
  { key: 'query_raised',       label: 'Query Raised',       step: 3 },
  { key: 'approved',           label: 'Approved',           step: 4 },
  { key: 'rajachitthi_issued', label: 'Rajachitthi Issued', step: 5 },
];

const TABS = [
  { key: 'overview',   label: 'Overview',         icon: Building2 },
  { key: 'documents',  label: 'Documents',         icon: Paperclip },
  { key: 'progress',   label: 'Progress',          icon: CheckCircle2 },
  { key: 'visits',     label: 'Site Visits',       icon: CalendarCheck },
  { key: 'bu',         label: 'B.U. Permission',   icon: BadgeCheck },
  { key: 'payments',   label: 'Payments',          icon: CreditCard },
];

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
  const [paymentData,       setPaymentData]       = useState({ type: 'architect_fee', amountDue: 100000 });

  const [showPayRecordModal,setShowPayRecordModal]= useState(false);
  const [payRecordData,     setPayRecordData]     = useState({ paymentId: '', amount: 25000, method: 'neft', remark: '' });

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
  const handleSetFee = async e => {
    e.preventDefault();
    try {
      await fetchAPI(`/projects/${id}/payments`, { method: 'POST', body: JSON.stringify(paymentData) });
      setShowPaymentModal(false);
      showAlert({ title: 'Fee Configured', message: 'Fee structure created successfully.', type: 'success' });
      load();
    } catch (err) {
      showAlert({ title: 'Error', message: err.message, type: 'error' });
    }
  };
  const handlePayRecord = async e => {
    e.preventDefault();
    try {
      await fetchAPI(`/projects/${id}/payments/${payRecordData.paymentId}/history`, { method: 'POST', body: JSON.stringify(payRecordData) });
      setShowPayRecordModal(false);
      showAlert({ title: 'Payment Logged', message: `Payment installment of ₹${Number(payRecordData.amount).toLocaleString()} recorded.`, type: 'success' });
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
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '1.25rem 1.75rem', marginBottom: '1.25rem', boxShadow: '0 2px 12px rgba(15,23,42,0.06)', overflowX: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', minWidth: 'max-content', gap: 0 }}>
          {PIPELINE.map((step, idx) => {
            const isPast    = currentStepIdx > idx;
            const isCurrent = currentStepIdx === idx;
            return (
              <React.Fragment key={step.key}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  {/* Circle */}
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 800, fontSize: '0.82rem',
                    background: isCurrent ? 'var(--accent-primary)' : isPast ? '#ecfdf5' : '#f8fafc',
                    color: isCurrent ? '#fff' : isPast ? '#10b981' : '#94a3b8',
                    border: `2px solid ${isCurrent ? 'var(--accent-primary)' : isPast ? '#a7f3d0' : '#e2e8f0'}`,
                    boxShadow: isCurrent ? '0 4px 14px rgba(79,110,247,0.35)' : 'none',
                    transition: 'all 0.2s',
                    flexShrink: 0,
                  }}>
                    {isPast ? <CheckCircle2 size={18} /> : step.step}
                  </div>
                  {/* Label */}
                  <span style={{
                    fontSize: '0.73rem', fontWeight: isCurrent ? 800 : 600,
                    color: isCurrent ? 'var(--accent-primary)' : isPast ? '#10b981' : '#94a3b8',
                    whiteSpace: 'nowrap',
                  }}>
                    {step.label}
                  </span>
                </div>
                {idx < PIPELINE.length - 1 && (
                  <div style={{ flex: 1, minWidth: 40, height: 2, background: isPast ? '#a7f3d0' : '#e2e8f0', margin: '0 8px 22px' }} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* ══ TABS ════════════════════════════════════ */}
      <div className="scroll-tabs-bar">
        {TABS.map(t => {
          const Icon = t.icon;
          const isActive = activeTab === t.key;
          const count = t.key === 'documents' ? project.documents?.length : t.key === 'visits' ? siteVisits.length : null;
          return (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '0.5rem 1rem', borderRadius: '9px', border: 'none',
                background: isActive ? 'var(--accent-primary)' : 'transparent',
                color: isActive ? '#fff' : 'var(--text-muted)',
                fontWeight: isActive ? 700 : 500, fontSize: '0.84rem',
                cursor: 'pointer', transition: 'all 0.18s', whiteSpace: 'nowrap',
              }}
            >
              <Icon size={15} />
              {t.label}
              {count != null && (
                <span style={{
                  background: isActive ? 'rgba(255,255,255,0.25)' : '#e2e8f0',
                  color: isActive ? '#fff' : '#64748b',
                  borderRadius: '99px', fontSize: '0.65rem', fontWeight: 800,
                  padding: '1px 6px', lineHeight: 1.6,
                }}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ══ TAB: OVERVIEW ═══════════════════════════ */}
      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '1.25rem', alignItems: 'start' }}>
          {/* Left: Case Spec + Team */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Plot Details */}
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '1.4rem 1.5rem', boxShadow: '0 2px 8px rgba(15,23,42,0.05)' }}>
              <h3 style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', margin: '0 0 1.1rem', display: 'flex', alignItems: 'center', gap: '7px' }}>
                <Building2 size={17} color="var(--accent-primary)" /> Plot & Case Specifications
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem 1.5rem' }}>
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
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '1.4rem 1.5rem', boxShadow: '0 2px 8px rgba(15,23,42,0.05)' }}>
              <h3 style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', margin: '0 0 1.1rem', display: 'flex', alignItems: 'center', gap: '7px' }}>
                <UserCheck size={17} color="#f59e0b" /> Appointed Professional Team
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem 1.5rem' }}>
                {[
                  { role: 'Architect',       data: project.architectId },
                  { role: 'Engineer',        data: project.engineerId },
                  { role: 'Contractor',      data: project.contractorId },
                  { role: 'Structural Eng',  data: project.structuralEngineerId },
                  { role: 'SOR Officer',     data: project.sorId },
                  { role: 'Developer',       data: project.developerId },
                ].map(({ role, data }) => (
                  <div key={role}>
                    <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '3px' }}>{role}</div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>{data?.name || <span style={{ color: '#cbd5e1', fontWeight: 400 }}>Unassigned</span>}</div>
                    {data?.licenseNo && <div style={{ fontSize: '0.72rem', color: 'var(--accent-primary)', marginTop: '1px' }}>{data.licenseNo}</div>}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Status History */}
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '1.4rem 1.5rem', boxShadow: '0 2px 8px rgba(15,23,42,0.05)' }}>
            <h3 style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', margin: '0 0 1rem' }}>Status History</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {(project.statusHistory || []).map((h, i) => (
                <div key={i} style={{ display: 'flex', gap: '0.85rem', paddingBottom: '0.9rem', marginBottom: '0.9rem', borderBottom: i < (project.statusHistory.length - 1) ? '1px solid #f1f5f9' : 'none' }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--accent-primary)', flexShrink: 0, marginTop: 5, border: '2px solid #c7d2fe' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <StatusBadge status={h.status} />
                      <span style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>{formatDate(h.date)}</span>
                    </div>
                    {h.remark && <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '2px' }}>{h.remark}</div>}
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>By {h.updatedBy}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Responsive style */}
          <style>{`@media(max-width:900px){.overview-grid{grid-template-columns:1fr!important}}`}</style>
        </div>
      )}

      {/* ══ TAB: DOCUMENTS ══════════════════════════ */}
      {activeTab === 'documents' && (
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '1.4rem 1.5rem', boxShadow: '0 2px 8px rgba(15,23,42,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
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
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
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
                      <a href={doc.fileUrl} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '4px 10px', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', textDecoration: 'none' }}>
                        <ExternalLink size={12} /> Open
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ══ TAB: PROGRESS ════════════════════════════ */}
      {activeTab === 'progress' && (
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '1.4rem 1.5rem', boxShadow: '0 2px 8px rgba(15,23,42,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <div>
              <h3 style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', margin: '0 0 2px' }}>Construction Progress Tracker</h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>Foundation → Plinth → Middle Story → Top Slab</p>
            </div>
            <button onClick={() => setShowProgressModal(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#eff1fe', border: '1.5px solid #c7d2fe', borderRadius: '8px', padding: '0.45rem 1rem', fontSize: '0.845rem', fontWeight: 600, color: 'var(--accent-primary)', cursor: 'pointer' }}>
              <Plus size={15} /> Record Stage
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
            {['foundation', 'plinth', 'middle_story', 'top_slab'].map(stg => {
              const sd = progressStages.find(s => s.stage === stg);
              return (
                <div key={stg} style={{ borderRadius: '12px', padding: '1.1rem 1.25rem', border: `1.5px solid ${sd ? '#a7f3d0' : '#e2e8f0'}`, background: sd ? '#f0fdf4' : '#f8fafc' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)', textTransform: 'capitalize' }}>
                      {stg.replace('_', ' ')}
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', borderRadius: '99px', padding: '3px 10px', fontSize: '0.68rem', fontWeight: 800, background: sd ? '#dcfce7' : '#f1f5f9', color: sd ? '#16a34a' : '#94a3b8', border: `1px solid ${sd ? '#a7f3d0' : '#e2e8f0'}` }}>
                      {sd ? <><CheckCircle2 size={12} /> Completed</> : 'Pending'}
                    </span>
                  </div>
                  {sd ? (
                    <>
                      <p style={{ fontSize: '0.845rem', color: 'var(--text-secondary)', margin: '0 0 4px' }}>{sd.remarks || 'Stage verified.'}</p>
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
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '1.4rem 1.5rem', boxShadow: '0 2px 8px rgba(15,23,42,0.05)' }}>
          <h3 style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', margin: '0 0 1.25rem' }}>Scheduled Site Visits</h3>
          {!siteVisits.length ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
              <CalendarCheck size={36} style={{ marginBottom: '0.75rem', opacity: 0.4 }} />
              <p style={{ margin: 0 }}>No site visits scheduled.</p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
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
          )}
        </div>
      )}

      {/* ══ TAB: B.U. PERMISSION ════════════════════ */}
      {activeTab === 'bu' && (
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '1.4rem 1.5rem', boxShadow: '0 2px 8px rgba(15,23,42,0.05)' }}>
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
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {[
                    { label: 'Submit App', status: 'application_submitted', color: 'var(--accent-primary)', bg: '#eff1fe', border: '#c7d2fe' },
                    { label: 'Under Review', status: 'under_review', color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
                    { label: 'Approve B.U.', status: 'approved', color: '#16a34a', bg: '#dcfce7', border: '#a7f3d0' },
                  ].map(b => (
                    <button key={b.status} onClick={() => handleBUStatus(b.status)}
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
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '1.4rem 1.5rem', boxShadow: '0 2px 8px rgba(15,23,42,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <h3 style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', margin: 0 }}>Fee & Payment Tracking</h3>
            <button onClick={() => setShowPaymentModal(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#eff1fe', border: '1.5px solid #c7d2fe', borderRadius: '8px', padding: '0.45rem 1rem', fontSize: '0.845rem', fontWeight: 600, color: 'var(--accent-primary)', cursor: 'pointer' }}>
              <Plus size={15} /> Add Fee
            </button>
          </div>
          {!payments.length ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
              <CreditCard size={36} style={{ marginBottom: '0.75rem', opacity: 0.4 }} />
              <p style={{ margin: 0 }}>No fee records configured yet.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
              {payments.map(p => {
                const balance = Math.max(0, p.amountDue - p.amountPaid);
                const pct = Math.min(100, (p.amountPaid / p.amountDue) * 100);
                return (
                  <div key={p._id} style={{ border: '1.5px solid #e2e8f0', borderRadius: '12px', padding: '1.1rem 1.25rem', background: '#f8fafc' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                      <span style={{ fontWeight: 800, fontSize: '0.875rem', color: 'var(--text-primary)', textTransform: 'uppercase' }}>
                        {p.type.replace('_', ' ')}
                      </span>
                      <button onClick={() => { setPayRecordData({ paymentId: p._id, amount: 25000, method: 'neft', remark: '' }); setShowPayRecordModal(true); }}
                        style={{ background: '#dcfce7', border: '1px solid #a7f3d0', borderRadius: '7px', color: '#16a34a', fontWeight: 700, fontSize: '0.78rem', padding: '4px 12px', cursor: 'pointer' }}>
                        + Log Payment
                      </button>
                    </div>
                    {/* Progress bar */}
                    <div style={{ height: 6, background: '#e2e8f0', borderRadius: '99px', marginBottom: '0.9rem', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg, #10b981, #34d399)', borderRadius: '99px', transition: 'width 0.5s' }} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginBottom: '0.85rem' }}>
                      {[
                        { label: 'Total Due', val: `₹${p.amountDue.toLocaleString()}`, color: 'var(--text-primary)' },
                        { label: 'Received', val: `₹${p.amountPaid.toLocaleString()}`, color: '#10b981' },
                        { label: 'Balance', val: `₹${balance.toLocaleString()}`, color: balance > 0 ? '#f59e0b' : '#10b981' },
                      ].map(x => (
                        <div key={x.label} style={{ textAlign: 'center', background: '#fff', borderRadius: '8px', padding: '0.5rem', border: '1px solid #f1f5f9' }}>
                          <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '2px' }}>{x.label}</div>
                          <div style={{ fontSize: '0.875rem', fontWeight: 800, color: x.color }}>{x.val}</div>
                        </div>
                      ))}
                    </div>
                    {p.paymentHistory?.length > 0 && (
                      <>
                        <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.4rem' }}>Payment Log</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '90px', overflowY: 'auto' }}>
                          {p.paymentHistory.map((h, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', background: '#fff', borderRadius: '6px', padding: '4px 10px', fontSize: '0.78rem', border: '1px solid #f1f5f9' }}>
                              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>₹{h.amount.toLocaleString()} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>via {h.method}</span></span>
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
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem', marginTop: '0.5rem' }}>
            <CancelBtn onClick={() => setShowStatusModal(false)} />
            <SaveBtn label="Save Transition" />
          </div>
        </form>
      </AppModal>

      {/* Document Upload */}
      <AppModal show={showDocModal} onHide={() => setShowDocModal(false)} title="Attach Case File / Drawing">
        <form onSubmit={handleUploadDocument}>
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
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem', marginTop: '0.5rem' }}>
            <CancelBtn onClick={() => setShowDocModal(false)} />
            <SaveBtn label="Upload File" />
          </div>
        </form>
      </AppModal>

      {/* Progress Stage */}
      <AppModal show={showProgressModal} onHide={() => setShowProgressModal(false)} title="Record Construction Stage">
        <form onSubmit={handleSaveProgress}>
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
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem', marginTop: '0.5rem' }}>
            <CancelBtn onClick={() => setShowProgressModal(false)} />
            <SaveBtn label="Save Stage" />
          </div>
        </form>
      </AppModal>

      {/* Set Fee */}
      <AppModal show={showPaymentModal} onHide={() => setShowPaymentModal(false)} title="Set Fee Structure">
        <form onSubmit={handleSetFee}>
          <LabeledField label="Fee Type">
            <select value={paymentData.type} onChange={e => setPaymentData({ ...paymentData, type: e.target.value })} style={{ ...inp, height: 38, cursor: 'pointer' }} onFocus={onF} onBlur={onB}>
              <option value="architect_fee">Architect Consultancy Fee</option>
              <option value="govt_fee">Government Scrutiny Chalan Fee</option>
            </select>
          </LabeledField>
          <LabeledField label="Total Amount Due (₹)">
            <input type="number" value={paymentData.amountDue} onChange={e => setPaymentData({ ...paymentData, amountDue: e.target.value })} required style={inp} onFocus={onF} onBlur={onB} />
          </LabeledField>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem', marginTop: '0.5rem' }}>
            <CancelBtn onClick={() => setShowPaymentModal(false)} />
            <SaveBtn label="Save Fee" />
          </div>
        </form>
      </AppModal>

      {/* Log Payment */}
      <AppModal show={showPayRecordModal} onHide={() => setShowPayRecordModal(false)} title="Log Payment Received">
        <form onSubmit={handlePayRecord}>
          <LabeledField label="Amount Received (₹)">
            <input type="number" value={payRecordData.amount} onChange={e => setPayRecordData({ ...payRecordData, amount: e.target.value })} required style={inp} onFocus={onF} onBlur={onB} />
          </LabeledField>
          <LabeledField label="Payment Method">
            <select value={payRecordData.method} onChange={e => setPayRecordData({ ...payRecordData, method: e.target.value })} style={{ ...inp, height: 38, cursor: 'pointer' }} onFocus={onF} onBlur={onB}>
              <option value="bank_transfer">Bank Transfer / NEFT / RTGS</option>
              <option value="cheque">Cheque</option>
              <option value="online_chalan">Online Govt Chalan</option>
              <option value="cash">Cash</option>
            </select>
          </LabeledField>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem', marginTop: '0.5rem' }}>
            <CancelBtn onClick={() => setShowPayRecordModal(false)} />
            <SaveBtn label="Record Payment" />
          </div>
        </form>
      </AppModal>
    </div>
  );
};

export default ProjectDetailPage;
