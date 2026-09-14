import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useModal } from '../context/ModalContext';
import { fetchAPI } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import LoadingGlass from '../components/LoadingGlass';
import PrismButton from '../components/common/PrismButton';
import {
  Building2,
  CheckCircle2,
  Lock,
  LogOut,
  FileCheck,
  MapPin,
  UserCheck,
  Clock,
  Sparkles,
  ChevronRight,
} from 'lucide-react';

const PIPELINE_STEPS = [
  { key: 'submitted', label: 'Submitted' },
  { key: 'under_scrutiny', label: 'Under Scrutiny' },
  { key: 'query_raised', label: 'Query Raised' },
  { key: 'approved', label: 'Approved' },
  { key: 'rajachitthi_issued', label: 'Rajachitthi Issued' },
];

const ClientDashboardPage = () => {
  const { user, logout } = useAuth();
  const { showConfirm } = useModal();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const handleLogout = async () => {
    const confirmed = await showConfirm({
      title: 'Confirm Sign Out',
      message: 'Are you sure you want to exit the Client Status Portal?',
      type: 'warning',
      confirmText: 'Sign Out',
      cancelText: 'Stay',
    });
    if (confirmed) {
      logout();
    }
  };

  useEffect(() => {
    fetchAPI('/projects')
      .then((res) => {
        if (res.success) setProjects(res.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingGlass message="Loading Client Portal Dashboard..." />;

  return (
    <div
      style={{
        maxWidth: '960px',
        margin: '0 auto',
        padding: 'clamp(1rem, 4vw, 2rem) clamp(0.75rem, 3vw, 1.25rem)',
      }}
    >
      {/* ── Client Portal Header ── */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '16px',
          padding: 'clamp(1rem, 4vw, 1.5rem)',
          marginBottom: '1.5rem',
          boxShadow: '0 4px 20px rgba(15,23,42,0.04)',
          display: 'flex',
          flexDirection: 'row',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
        }}
      >
        <div style={{ flex: '1 1 260px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: '10px',
                background: 'var(--prism-gradient)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: '0 4px 12px rgba(79,110,247,0.3)',
              }}
            >
              <Building2 size={18} color="#fff" />
            </div>
            <span
              style={{
                fontSize: '0.68rem',
                fontWeight: 800,
                color: 'var(--accent-primary)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                background: '#eff1fe',
                padding: '3px 8px',
                borderRadius: '6px',
                border: '1px solid #c7d2fe',
              }}
            >
              Client Status Portal
            </span>
          </div>

          <h1
            style={{
              fontWeight: 900,
              fontSize: 'clamp(1.1rem, 4vw, 1.45rem)',
              color: 'var(--text-primary)',
              margin: '0 0 4px',
              lineHeight: 1.25,
            }}
          >
            Welcome, {user?.name || 'Client'}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: 0, fontWeight: 500 }}>
            Real-time read-only municipal project status & approval pipeline tracking
          </p>
        </div>

        <div>
          <PrismButton variant="danger" icon={LogOut} onClick={handleLogout} style={{ height: '40px', fontSize: '0.82rem' }}>
            Sign Out
          </PrismButton>
        </div>
      </div>

      {/* ── Projects List for Client ── */}
      {projects.length === 0 ? (
        <div
          style={{
            background: '#fff',
            border: '1px solid #e2e8f0',
            borderRadius: '16px',
            padding: '3.5rem 1.5rem',
            textAlign: 'center',
            boxShadow: '0 2px 12px rgba(15,23,42,0.04)',
          }}
        >
          <div
            style={{
              width: 54,
              height: 54,
              borderRadius: '50%',
              background: '#fffbeb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem',
              border: '1px solid #fde68a',
            }}
          >
            <Lock size={24} color="#d97706" />
          </div>
          <h2 style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-primary)', margin: '0 0 0.4rem' }}>
            No Linked Cases Found
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem', margin: 0, maxWidth: '420px', marginLeft: 'auto', marginRight: 'auto' }}>
            Contact your architectural firm to link your building permission case to this client portal account.
          </p>
        </div>
      ) : (
        projects.map((proj) => {
          const currentStepIdx = PIPELINE_STEPS.findIndex((s) => s.key === proj.status);

          return (
            <div
              key={proj._id}
              style={{
                background: '#fff',
                border: '1px solid #e2e8f0',
                borderRadius: '18px',
                padding: 'clamp(1rem, 4vw, 1.5rem)',
                marginBottom: '1.5rem',
                boxShadow: '0 4px 16px rgba(15,23,42,0.05)',
              }}
            >
              {/* Project Header */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: '0.75rem',
                  paddingBottom: '1rem',
                  borderBottom: '1px solid #f1f5f9',
                  marginBottom: '1.15rem',
                }}
              >
                <div style={{ flex: '1 1 200px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                    <span
                      style={{
                        background: '#eff1fe',
                        border: '1px solid #c7d2fe',
                        color: 'var(--accent-primary)',
                        borderRadius: '6px',
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        padding: '2px 8px',
                        display: 'inline-block',
                      }}
                    >
                      CASE #{proj.caseNo}
                    </span>
                  </div>
                  <h2
                    style={{
                      fontWeight: 800,
                      fontSize: 'clamp(1.05rem, 3.5vw, 1.3rem)',
                      color: 'var(--text-primary)',
                      lineHeight: 1.3,
                      margin: 0,
                    }}
                  >
                    {proj.projectName}
                  </h2>
                </div>

                <div style={{ flexShrink: 0 }}>
                  <StatusBadge status={proj.status} />
                </div>
              </div>

              {/* Metadata Cards Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                  gap: '0.85rem',
                  marginBottom: '1.35rem',
                }}
              >
                <div
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #f1f5f9',
                    borderRadius: '10px',
                    padding: '0.75rem 0.85rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '4px' }}>
                    <FileCheck size={13} color="#64748b" />
                    <span
                      style={{
                        fontSize: '0.66rem',
                        fontWeight: 700,
                        color: '#64748b',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}
                    >
                      Rajachitthi Permit
                    </span>
                  </div>
                  <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-primary)', wordBreak: 'break-word' }}>
                    {proj.rajachitthiNo || 'Under Municipal Process'}
                  </div>
                </div>

                <div
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #f1f5f9',
                    borderRadius: '10px',
                    padding: '0.75rem 0.85rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '4px' }}>
                    <MapPin size={13} color="#64748b" />
                    <span
                      style={{
                        fontSize: '0.66rem',
                        fontWeight: 700,
                        color: '#64748b',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}
                    >
                      Municipal Zone
                    </span>
                  </div>
                  <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {proj.zone} ({proj.ward})
                  </div>
                </div>

                <div
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #f1f5f9',
                    borderRadius: '10px',
                    padding: '0.75rem 0.85rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '4px' }}>
                    <UserCheck size={13} color="#64748b" />
                    <span
                      style={{
                        fontSize: '0.66rem',
                        fontWeight: 700,
                        color: '#64748b',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}
                    >
                      Chief Architect
                    </span>
                  </div>
                  <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--accent-primary)' }}>
                    {proj.architectId?.name || 'Assigned'}
                  </div>
                </div>
              </div>

              {/* ── Approval Pipeline Progress Section ── */}
              <div
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginBottom: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Sparkles size={14} color="var(--accent-primary)" />
                <span>Approval Pipeline Progress</span>
              </div>

              {/* Desktop Pipeline (Horizontal Stepper) */}
              <div
                className="d-none d-sm-block"
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '1.25rem 1rem',
                  overflowX: 'auto',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', minWidth: 'max-content', gap: 0, padding: '0 0.5rem' }}>
                  {PIPELINE_STEPS.map((step, idx) => {
                    const isPast = currentStepIdx > idx;
                    const isCurrent = currentStepIdx === idx;
                    return (
                      <React.Fragment key={step.key}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                          <div
                            style={{
                              width: 34,
                              height: 34,
                              borderRadius: '50%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 800,
                              fontSize: '0.8rem',
                              background: isCurrent ? 'var(--accent-primary)' : isPast ? '#ecfdf5' : '#ffffff',
                              color: isCurrent ? '#fff' : isPast ? '#10b981' : '#94a3b8',
                              border: `2px solid ${isCurrent ? 'var(--accent-primary)' : isPast ? '#a7f3d0' : '#e2e8f0'}`,
                              boxShadow: isCurrent ? '0 4px 14px rgba(79,110,247,0.35)' : 'none',
                            }}
                          >
                            {isPast ? <CheckCircle2 size={18} /> : idx + 1}
                          </div>
                          <span
                            style={{
                              fontSize: '0.73rem',
                              fontWeight: isCurrent ? 800 : 600,
                              color: isCurrent ? 'var(--accent-primary)' : isPast ? '#10b981' : '#94a3b8',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {step.label}
                          </span>
                        </div>
                        {idx < PIPELINE_STEPS.length - 1 && (
                          <div
                            style={{
                              flex: 1,
                              minWidth: 44,
                              height: 2,
                              background: isPast ? '#a7f3d0' : '#e2e8f0',
                              margin: '0 10px 18px',
                            }}
                          />
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>

              {/* Mobile Pipeline (Vertical Milestone Stepper Card) */}
              <div
                className="d-block d-sm-none"
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '14px',
                  padding: '1rem',
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {PIPELINE_STEPS.map((step, idx) => {
                    const isPast = currentStepIdx > idx;
                    const isCurrent = currentStepIdx === idx;

                    return (
                      <div
                        key={step.key}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          background: isCurrent ? '#ffffff' : 'transparent',
                          border: isCurrent ? '1.5px solid #c7d2fe' : '1px solid transparent',
                          borderRadius: '10px',
                          padding: isCurrent ? '8px 10px' : '4px 6px',
                          boxShadow: isCurrent ? '0 4px 12px rgba(79,110,247,0.1)' : 'none',
                        }}
                      >
                        <div
                          style={{
                            width: 30,
                            height: 30,
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                            fontSize: '0.75rem',
                            background: isCurrent ? 'var(--accent-primary)' : isPast ? '#ecfdf5' : '#ffffff',
                            color: isCurrent ? '#fff' : isPast ? '#10b981' : '#94a3b8',
                            border: `2px solid ${isCurrent ? 'var(--accent-primary)' : isPast ? '#a7f3d0' : '#e2e8f0'}`,
                            flexShrink: 0,
                          }}
                        >
                          {isPast ? <CheckCircle2 size={16} /> : idx + 1}
                        </div>

                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span
                            style={{
                              fontSize: '0.82rem',
                              fontWeight: isCurrent ? 800 : isPast ? 700 : 500,
                              color: isCurrent ? 'var(--accent-primary)' : isPast ? '#065f46' : '#64748b',
                            }}
                          >
                            {step.label}
                          </span>

                          {isCurrent && (
                            <span
                              style={{
                                background: '#eff1fe',
                                color: 'var(--accent-primary)',
                                fontSize: '0.62rem',
                                fontWeight: 800,
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                border: '1px solid #c7d2fe',
                              }}
                            >
                              Current Stage
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

export default ClientDashboardPage;
