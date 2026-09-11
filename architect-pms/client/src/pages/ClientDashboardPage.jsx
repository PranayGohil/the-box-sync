import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useModal } from '../context/ModalContext';
import { fetchAPI } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import LoadingGlass from '../components/LoadingGlass';
import PageHeader from '../components/common/PageHeader';
import PrismButton from '../components/common/PrismButton';
import { Building2, CheckCircle2, Lock, LogOut } from 'lucide-react';

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
    <div style={{ maxWidth: '960px', margin: '0 auto', padding: '2rem 1rem' }}>
      <PageHeader
        title={`Welcome, ${user?.name || 'Client'}`}
        subtitle="Read-only project status & progress dashboard"
        icon={Building2}
        badge={
          <span
            style={{
              fontSize: '0.7rem',
              fontWeight: 800,
              color: 'var(--accent-primary)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              background: '#eff1fe',
              padding: '0.2rem 0.6rem',
              borderRadius: '6px',
            }}
          >
            Client Status Portal
          </span>
        }
      >
        <PrismButton variant="danger" icon={LogOut} onClick={handleLogout}>
          Sign Out
        </PrismButton>
      </PageHeader>

      {/* Projects List for Client */}
      {projects.length === 0 ? (
        <div
          style={{
            background: '#fff',
            border: '1px solid #e2e8f0',
            borderRadius: '16px',
            padding: '4rem 2rem',
            textAlign: 'center',
            boxShadow: '0 2px 12px rgba(15,23,42,0.05)',
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: '#fffbeb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem',
            }}
          >
            <Lock size={26} color="#f59e0b" />
          </div>
          <h2 style={{ fontWeight: 700, fontSize: '1.15rem', color: 'var(--text-primary)', margin: '0 0 0.4rem' }}>
            No Linked Cases Found
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>
            Contact your architectural firm to link your building permission case to this portal account.
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
                borderRadius: '16px',
                padding: '1.5rem',
                marginBottom: '1.5rem',
                boxShadow: '0 2px 12px rgba(15,23,42,0.06)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '0.75rem',
                  paddingBottom: '1rem',
                  borderBottom: '1px solid #f1f5f9',
                  marginBottom: '1.25rem',
                }}
              >
                <div>
                  <span
                    style={{
                      background: '#eff1fe',
                      border: '1px solid #c7d2fe',
                      color: 'var(--accent-primary)',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      padding: '2px 8px',
                      marginRight: '8px',
                    }}
                  >
                    CASE #{proj.caseNo}
                  </span>
                  <h2
                    style={{
                      fontWeight: 800,
                      fontSize: '1.25rem',
                      color: 'var(--text-primary)',
                      display: 'inline',
                      verticalAlign: 'middle',
                    }}
                  >
                    {proj.projectName}
                  </h2>
                </div>
                <StatusBadge status={proj.status} />
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '1rem',
                  marginBottom: '1.5rem',
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      color: '#94a3b8',
                      textTransform: 'uppercase',
                      letterSpacing: '0.07em',
                      marginBottom: '3px',
                    }}
                  >
                    Rajachitthi Permit
                  </div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {proj.rajachitthiNo || 'Under Municipal Process'}
                  </div>
                </div>

                <div>
                  <div
                    style={{
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      color: '#94a3b8',
                      textTransform: 'uppercase',
                      letterSpacing: '0.07em',
                      marginBottom: '3px',
                    }}
                  >
                    Municipal Zone
                  </div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {proj.zone} ({proj.ward})
                  </div>
                </div>

                <div>
                  <div
                    style={{
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      color: '#94a3b8',
                      textTransform: 'uppercase',
                      letterSpacing: '0.07em',
                      marginBottom: '3px',
                    }}
                  >
                    Chief Architect
                  </div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--accent-primary)' }}>
                    {proj.architectId?.name || 'Assigned'}
                  </div>
                </div>
              </div>

              {/* Stepper */}
              <div
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: '0.75rem',
                }}
              >
                Approval Pipeline Progress
              </div>
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '1.25rem',
                  overflowX: 'auto',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', minWidth: 'max-content', gap: 0 }}>
                  {PIPELINE_STEPS.map((step, idx) => {
                    const isPast = currentStepIdx > idx;
                    const isCurrent = currentStepIdx === idx;
                    return (
                      <React.Fragment key={step.key}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                          <div
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: '50%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 800,
                              fontSize: '0.78rem',
                              background: isCurrent ? 'var(--accent-primary)' : isPast ? '#ecfdf5' : '#ffffff',
                              color: isCurrent ? '#fff' : isPast ? '#10b981' : '#94a3b8',
                              border: `2px solid ${isCurrent ? 'var(--accent-primary)' : isPast ? '#a7f3d0' : '#e2e8f0'}`,
                              boxShadow: isCurrent ? '0 4px 14px rgba(79,110,247,0.35)' : 'none',
                            }}
                          >
                            {isPast ? <CheckCircle2 size={16} /> : idx + 1}
                          </div>
                          <span
                            style={{
                              fontSize: '0.72rem',
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
                              minWidth: 40,
                              height: 2,
                              background: isPast ? '#a7f3d0' : '#e2e8f0',
                              margin: '0 8px 18px',
                            }}
                          />
                        )}
                      </React.Fragment>
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
