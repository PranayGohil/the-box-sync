import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchAPI } from '../services/api';
import { useModal } from '../context/ModalContext';
import LoadingGlass from '../components/LoadingGlass';
import PageHeader from '../components/common/PageHeader';
import PrismButton from '../components/common/PrismButton';
import { FolderPlus, FileText, ArrowLeft, UserCheck, Building2, Sparkles } from 'lucide-react';

/* ── Inline Helpers ───────────────────────────────── */
const inpStyle = {
  width: '100%',
  height: '38px',
  background: '#f8fafc',
  border: '1.5px solid #e2e8f0',
  borderRadius: '8px',
  padding: '0 12px',
  fontSize: '0.855rem',
  color: '#0f172a',
  fontFamily: 'var(--font-main)',
  outline: 'none',
  transition: 'all 0.18s ease',
};

const onF = (e) => {
  e.target.style.borderColor = 'var(--accent-primary)';
  e.target.style.boxShadow = '0 0 0 3px rgba(79,110,247,0.12)';
  e.target.style.background = '#fff';
};

const onB = (e) => {
  e.target.style.borderColor = '#e2e8f0';
  e.target.style.boxShadow = 'none';
  e.target.style.background = '#f8fafc';
};

const FormSection = ({ title, icon: Icon, iconColor = 'var(--accent-primary)', children }) => (
  <div
    style={{
      background: '#fff',
      border: '1px solid #e2e8f0',
      borderRadius: '16px',
      padding: '1.5rem',
      marginBottom: '1.5rem',
      boxShadow: '0 2px 12px rgba(15,23,42,0.05)',
    }}
  >
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.65rem',
        marginBottom: '1.25rem',
        paddingBottom: '0.75rem',
        borderBottom: '1px solid #f1f5f9',
      }}
    >
      <div
        style={{
          width: 34,
          height: 34,
          borderRadius: '9px',
          background: '#eff1fe',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon size={18} color={iconColor} />
      </div>
      <h2 style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)', margin: 0 }}>
        {title}
      </h2>
    </div>
    {children}
  </div>
);

const FormField = ({ label, required = false, children, col = 'col-12 col-md-6' }) => (
  <div className={col} style={{ marginBottom: '0.85rem' }}>
    <label
      style={{
        display: 'block',
        fontSize: '0.76rem',
        fontWeight: 700,
        color: 'var(--text-secondary)',
        marginBottom: '0.35rem',
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
      }}
    >
      {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
    </label>
    {children}
  </div>
);

const ZONES = ['West Zone', 'East Zone', 'North Zone', 'South Zone', 'Central Zone'];

const CreateProjectPage = () => {
  const navigate = useNavigate();
  const { showAlert } = useModal();
  const [loadingMasters, setLoadingMasters] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [professionals, setProfessionals] = useState({
    architect: [],
    engineer: [],
    contractor: [],
    structural_engineer: [],
    sor: [],
    developer: [],
  });

  const [formData, setFormData] = useState({
    caseNo: `BP/2026/${Math.floor(1000 + Math.random() * 9000)}`,
    rajachitthiNo: '',
    rajachitthiDate: '',
    ownerName: '',
    projectName: '',
    blockNo: '',
    tpsNo: '',
    rsNo: '',
    fpNo: '',
    csNo: '',
    spNo: '',
    zone: 'West Zone',
    ward: 'Ward 1',
    architectId: '',
    engineerId: '',
    contractorId: '',
    structuralEngineerId: '',
    sorId: '',
    developerId: '',
  });

  useEffect(() => {
    const loadMasters = async () => {
      try {
        const res = await fetchAPI('/professionals?status=active');
        if (res.success) {
          const grouped = {
            architect: [],
            engineer: [],
            contractor: [],
            structural_engineer: [],
            sor: [],
            developer: [],
          };
          res.data.forEach((p) => {
            if (grouped[p.type]) grouped[p.type].push(p);
          });
          setProfessionals(grouped);
        }
      } catch (err) {
        console.error('Failed to load professional master dropdowns:', err);
      } finally {
        setLoadingMasters(false);
      }
    };

    loadMasters();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetchAPI('/projects', {
        method: 'POST',
        body: JSON.stringify(formData),
      });

      if (res.success) {
        await showAlert({
          title: 'Case Registered',
          message: `Project Case ${res.data.caseNo} registered successfully!`,
          type: 'success',
        });
        navigate(`/projects/${res.data._id}`);
      }
    } catch (err) {
      showAlert({ title: 'Registration Failed', message: err.message || 'Failed to register project case.', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingMasters) return <LoadingGlass message="Loading Master Data..." />;

  return (
    <div>
      {/* Header */}
      <PageHeader
        title="New Case Registration"
        subtitle="Register a municipal permission case and assign professionals"
        icon={FolderPlus}
        showBack
        backLabel="Back"
      />

      <form onSubmit={handleSubmit}>
        {/* Section 1: Identification */}
        <FormSection title="1. Case & Plot Identification" icon={FileText} iconColor="#4f6ef7">
          <div className="row g-2">
            <FormField label="Case Number (Unique)" required col="col-12 col-md-4">
              <input
                type="text"
                value={formData.caseNo}
                onChange={(e) => setFormData({ ...formData, caseNo: e.target.value })}
                required
                style={{ ...inpStyle, fontWeight: 700, color: 'var(--accent-primary)' }}
                onFocus={onF}
                onBlur={onB}
              />
            </FormField>

            <FormField label="Rajachitthi Permit No." col="col-12 col-md-4">
              <input
                type="text"
                placeholder="e.g. RC-9941/2026"
                value={formData.rajachitthiNo}
                onChange={(e) => setFormData({ ...formData, rajachitthiNo: e.target.value })}
                style={inpStyle}
                onFocus={onF}
                onBlur={onB}
              />
            </FormField>

            <FormField label="Rajachitthi Sanction Date" col="col-12 col-md-4">
              <input
                type="date"
                value={formData.rajachitthiDate}
                onChange={(e) => setFormData({ ...formData, rajachitthiDate: e.target.value })}
                style={inpStyle}
                onFocus={onF}
                onBlur={onB}
              />
            </FormField>

            <FormField label="Project / Building Name" required col="col-12 col-md-6">
              <input
                type="text"
                placeholder="e.g. Skyline Heights Commercial Complex"
                value={formData.projectName}
                onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                required
                style={inpStyle}
                onFocus={onF}
                onBlur={onB}
              />
            </FormField>

            <FormField label="Owner's Full Name" required col="col-12 col-md-6">
              <input
                type="text"
                placeholder="e.g. Mr. Ramesh Shah"
                value={formData.ownerName}
                onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                required
                style={inpStyle}
                onFocus={onF}
                onBlur={onB}
              />
            </FormField>

            {/* Plot Numbers Grid */}
            <div className="col-12">
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '0.85rem 1rem',
                  margin: '0.35rem 0 0.85rem',
                }}
              >
                <div
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: '0.6rem',
                  }}
                >
                  Plot Sub-division & Revenue Identifiers
                </div>
                <div className="row g-2">
                  {[
                    { label: 'Block No.', key: 'blockNo' },
                    { label: 'T.P.S. No.', key: 'tpsNo' },
                    { label: 'R.S. No.', key: 'rsNo' },
                    { label: 'F.P. No.', key: 'fpNo' },
                    { label: 'C.S. No.', key: 'csNo' },
                    { label: 'S.P. No.', key: 'spNo' },
                  ].map((f) => (
                    <div key={f.key} className="col-6 col-md-2">
                      <label
                        style={{
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          color: '#94a3b8',
                          marginBottom: '2px',
                          display: 'block',
                        }}
                      >
                        {f.label}
                      </label>
                      <input
                        type="text"
                        value={formData[f.key]}
                        onChange={(e) => setFormData({ ...formData, [f.key]: e.target.value })}
                        style={{ ...inpStyle, height: '34px', fontSize: '0.82rem' }}
                        onFocus={onF}
                        onBlur={onB}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <FormField label="Municipal Zone" required col="col-12 col-md-6">
              <select
                value={formData.zone}
                onChange={(e) => setFormData({ ...formData, zone: e.target.value })}
                required
                style={{ ...inpStyle, cursor: 'pointer' }}
                onFocus={onF}
                onBlur={onB}
              >
                {ZONES.map((z) => (
                  <option key={z} value={z}>
                    {z}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Ward / Area" required col="col-12 col-md-6">
              <input
                type="text"
                placeholder="e.g. Ward 5 - Navrangpura"
                value={formData.ward}
                onChange={(e) => setFormData({ ...formData, ward: e.target.value })}
                required
                style={inpStyle}
                onFocus={onF}
                onBlur={onB}
              />
            </FormField>
          </div>
        </FormSection>

        {/* Section 2: Appointed Team */}
        <FormSection
          title="2. Appointed Professional Team (Master References)"
          icon={UserCheck}
          iconColor="#f59e0b"
        >
          <div className="row g-2">
            {[
              { label: 'Appointed Architect', key: 'architectId', list: professionals.architect },
              { label: 'Appointed Engineer', key: 'engineerId', list: professionals.engineer },
              { label: 'Contractor (COW)', key: 'contractorId', list: professionals.contractor },
              {
                label: 'Structural Engineer (STR)',
                key: 'structuralEngineerId',
                list: professionals.structural_engineer,
              },
              { label: 'SOR Board Officer', key: 'sorId', list: professionals.sor },
              { label: 'Developer / Builder', key: 'developerId', list: professionals.developer },
            ].map((field) => (
              <FormField key={field.key} label={field.label} col="col-12 col-md-6">
                <select
                  value={formData[field.key]}
                  onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                  style={{ ...inpStyle, cursor: 'pointer' }}
                  onFocus={onF}
                  onBlur={onB}
                >
                  <option value="">-- Unassigned --</option>
                  {field.list.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name} {p.licenseNo ? `(Lic: ${p.licenseNo})` : ''}
                    </option>
                  ))}
                </select>
              </FormField>
            ))}
          </div>
        </FormSection>

        {/* Submit Actions */}
        <div className="form-footer form-footer-page">
          <PrismButton
            variant="secondary"
            onClick={() => navigate('/projects')}
          >
            Cancel
          </PrismButton>
          <PrismButton
            type="submit"
            variant="primary"
            disabled={submitting}
            icon={Sparkles}
          >
            {submitting ? 'Registering Case...' : 'Submit & Register Case'}
          </PrismButton>
        </div>
      </form>
    </div>
  );
};

export default CreateProjectPage;
