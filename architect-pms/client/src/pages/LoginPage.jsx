import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useModal } from '../context/ModalContext';
import {
  Building2,
  ShieldCheck,
  Lock,
  Mail,
  Eye,
  EyeOff,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Layers,
  CalendarCheck,
  FileSpreadsheet,
} from 'lucide-react';

const DEMO_ACCOUNTS = [
  { label: 'Admin',         email: 'admin@architectpms.com',     role: 'Partner',       color: '#4f6ef7', bg: '#eff1fe', border: '#c7d2fe' },
  { label: 'Architect',     email: 'architect@architectpms.com', role: 'Chief Ar.',     color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
  { label: 'Staff',         email: 'staff@architectpms.com',     role: 'Operations',    color: '#0284c7', bg: '#f0f9ff', border: '#bae6fd' },
  { label: 'Site Engineer', email: 'engineer@architectpms.com',  role: 'Inspections',   color: '#059669', bg: '#ecfdf5', border: '#a7f3d0' },
  { label: 'Client Portal', email: 'client@skyline.com',         role: 'Owner/Client',  color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
];

const LoginPage = () => {
  const { login } = useAuth();
  const { showAlert } = useModal();
  const navigate = useNavigate();

  const [email, setEmail] = useState('admin@architectpms.com');
  const [password, setPassword] = useState('Password@123');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password);
      navigate(user.role === 'client' ? '/client-portal/dashboard' : '/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed. Please verify your email and password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        background: '#f8fafc',
        fontFamily: 'var(--font-main)',
        position: 'relative',
        overflowY: 'auto',
      }}
    >
      {/* ── Left Branding Panel (Desktop) ── */}
      <div
        className="d-none d-lg-flex flex-column justify-content-between"
        style={{
          flex: '0 0 45%',
          background: 'linear-gradient(145deg, #0f172a 0%, #1e1b4b 60%, #312e81 100%)',
          padding: '4.5rem 4rem',
          position: 'relative',
          overflow: 'hidden',
          color: '#ffffff',
        }}
      >
        {/* Glow Spheres */}
        <div
          style={{
            position: 'absolute',
            top: '-15%',
            left: '-15%',
            width: '500px',
            height: '500px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(99,102,241,0.25) 0%, transparent 70%)',
            filter: 'blur(60px)',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-10%',
            right: '-10%',
            width: '450px',
            height: '450px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(236,72,153,0.18) 0%, transparent 70%)',
            filter: 'blur(70px)',
            pointerEvents: 'none',
          }}
        />

        {/* Top Brand Logo */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '2.5rem' }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: '14px',
                background: 'var(--prism-gradient)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 24px rgba(79,110,247,0.45)',
                flexShrink: 0,
              }}
            >
              <Building2 size={26} color="#fff" />
            </div>
            <div>
              <div
                style={{
                  fontSize: '1.25rem',
                  fontWeight: 900,
                  letterSpacing: '0.04em',
                  color: '#ffffff',
                  lineHeight: 1.15,
                }}
              >
                ARCHITECT <span style={{ color: '#93c5fd' }}>PMS</span>
              </div>
              <div
                style={{
                  fontSize: '0.68rem',
                  color: 'rgba(255,255,255,0.6)',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  fontWeight: 600,
                }}
              >
                Municipal Permissions & ERP
              </div>
            </div>
          </div>

          <h1
            style={{
              fontWeight: 900,
              fontSize: '2.25rem',
              color: '#ffffff',
              lineHeight: 1.25,
              marginBottom: '1rem',
            }}
          >
            End-to-End Building Permission & Project Workspace
          </h1>
          <p
            style={{
              color: 'rgba(255,255,255,0.75)',
              fontSize: '0.96rem',
              lineHeight: 1.65,
              maxWidth: '440px',
              margin: 0,
            }}
          >
            Streamline municipal case submissions, scrutiny stage pipelines, professional master registers, site visits, and automated validity reminders.
          </p>
        </div>

        {/* Features list */}
        <div style={{ position: 'relative', zIndex: 1, margin: '2.5rem 0' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[
              { icon: Layers, text: '5-Stage Municipal Approval Pipeline Tracker' },
              { icon: CalendarCheck, text: 'Real-time Site Visit & Inspection Schedule' },
              { icon: FileSpreadsheet, text: 'Professional Master Database (COW, STR, SOR)' },
              { icon: Sparkles, text: 'Site Signage & Banner Auto-Generator' },
            ].map((f, i) => {
              const Icon = f.icon;
              return (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.85rem',
                    color: 'rgba(255,255,255,0.9)',
                    fontSize: '0.885rem',
                    fontWeight: 500,
                  }}
                >
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: '8px',
                      background: 'rgba(255,255,255,0.1)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={15} color="#93c5fd" />
                  </div>
                  <span>{f.text}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom footer */}
        <div
          style={{
            position: 'relative',
            zIndex: 1,
            fontSize: '0.78rem',
            color: 'rgba(255,255,255,0.45)',
          }}
        >
          Secure Municipal Architecture Management Platform © {new Date().getFullYear()}
        </div>
      </div>

      {/* ── Right Login Form Panel ── */}
      <div
        style={{
          flex: '1',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2.5rem 1.5rem',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div style={{ width: '100%', maxWidth: '440px' }}>
          {/* Mobile Header */}
          <div className="d-lg-none text-center" style={{ marginBottom: '2rem' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 52,
                height: 52,
                borderRadius: '14px',
                background: 'var(--prism-gradient)',
                boxShadow: '0 6px 20px rgba(79,110,247,0.35)',
                marginBottom: '0.75rem',
              }}
            >
              <Building2 size={26} color="#fff" />
            </div>
            <h2 style={{ fontWeight: 800, fontSize: '1.4rem', color: 'var(--text-primary)', margin: 0 }}>
              Architect PMS
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: '4px 0 0' }}>
              Municipal Building Permissions
            </p>
          </div>

          {/* Login Card */}
          <div
            style={{
              background: '#ffffff',
              border: '1.5px solid #e2e8f0',
              borderRadius: '20px',
              padding: '2.5rem 2.25rem',
              boxShadow: '0 20px 50px rgba(15,23,42,0.08)',
            }}
          >
            <div style={{ marginBottom: '1.75rem' }}>
              <h2
                style={{
                  fontWeight: 800,
                  fontSize: '1.45rem',
                  color: 'var(--text-primary)',
                  margin: '0 0 0.4rem',
                  lineHeight: 1.2,
                }}
              >
                Sign in to your account
              </h2>
              <p style={{ fontSize: '0.865rem', color: 'var(--text-muted)', margin: 0 }}>
                Enter your credentials to access the workspace
              </p>
            </div>

            {error && (
              <div
                style={{
                  background: '#fef2f2',
                  border: '1.5px solid #fecaca',
                  borderRadius: '10px',
                  padding: '0.75rem 1rem',
                  color: '#dc2626',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  marginBottom: '1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#dc2626', flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* Email Address */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.76rem',
                    fontWeight: 700,
                    color: 'var(--text-secondary)',
                    marginBottom: '0.4rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  Email Address
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail
                    size={16}
                    style={{
                      position: 'absolute',
                      left: '13px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#94a3b8',
                      pointerEvents: 'none',
                      zIndex: 1,
                    }}
                  />
                  <input
                    type="email"
                    placeholder="name@firm.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      height: '42px',
                      background: '#f8fafc',
                      border: '1.5px solid #e2e8f0',
                      borderRadius: '10px',
                      paddingLeft: '40px',
                      paddingRight: '14px',
                      fontSize: '0.885rem',
                      color: '#0f172a',
                      fontFamily: 'var(--font-main)',
                      outline: 'none',
                      transition: 'all 0.18s ease',
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = 'var(--accent-primary)';
                      e.target.style.boxShadow = '0 0 0 3px rgba(79,110,247,0.12)';
                      e.target.style.background = '#ffffff';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e2e8f0';
                      e.target.style.boxShadow = 'none';
                      e.target.style.background = '#f8fafc';
                    }}
                  />
                </div>
              </div>

              {/* Password */}
              <div style={{ marginBottom: '1.5rem' }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '0.4rem',
                  }}
                >
                  <label
                    style={{
                      margin: 0,
                      fontSize: '0.76rem',
                      fontWeight: 700,
                      color: 'var(--text-secondary)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      showAlert({
                        title: 'Password Assistance',
                        message:
                          'Please contact your system administrator to reset or retrieve your account credentials.',
                        type: 'info',
                      })
                    }
                    style={{
                      background: 'none',
                      border: 'none',
                      fontSize: '0.78rem',
                      color: 'var(--accent-primary)',
                      fontWeight: 600,
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  >
                    Forgot password?
                  </button>
                </div>
                <div style={{ position: 'relative' }}>
                  <Lock
                    size={16}
                    style={{
                      position: 'absolute',
                      left: '13px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#94a3b8',
                      pointerEvents: 'none',
                      zIndex: 1,
                    }}
                  />
                  <input
                    type={showPass ? 'text' : 'password'}
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      height: '42px',
                      background: '#f8fafc',
                      border: '1.5px solid #e2e8f0',
                      borderRadius: '10px',
                      paddingLeft: '40px',
                      paddingRight: '42px',
                      fontSize: '0.885rem',
                      color: '#0f172a',
                      fontFamily: 'var(--font-main)',
                      outline: 'none',
                      transition: 'all 0.18s ease',
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = 'var(--accent-primary)';
                      e.target.style.boxShadow = '0 0 0 3px rgba(79,110,247,0.12)';
                      e.target.style.background = '#ffffff';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e2e8f0';
                      e.target.style.boxShadow = 'none';
                      e.target.style.background = '#f8fafc';
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#94a3b8',
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="prism-btn-primary"
                style={{
                  width: '100%',
                  height: '44px',
                  fontSize: '0.92rem',
                  borderRadius: '10px',
                  justifyContent: 'center',
                  fontWeight: 700,
                  boxShadow: '0 4px 14px rgba(79,110,247,0.35)',
                }}
              >
                <ShieldCheck size={18} />
                <span>{loading ? 'Verifying Credentials...' : 'Sign In to Workspace'}</span>
              </button>
            </form>

            {/* Quick Demo Autofill Section */}
            <div
              style={{
                marginTop: '1.75rem',
                borderTop: '1px solid #f1f5f9',
                paddingTop: '1.25rem',
              }}
            >
              <div
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.07em',
                  textAlign: 'center',
                  marginBottom: '0.75rem',
                }}
              >
                ⚡ Quick Demo Accounts (Click to Fill)
              </div>
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '0.45rem',
                  justifyContent: 'center',
                }}
              >
                {DEMO_ACCOUNTS.map((a) => (
                  <button
                    key={a.email}
                    type="button"
                    onClick={() => {
                      setEmail(a.email);
                      setPassword('Password@123');
                    }}
                    style={{
                      background: a.bg,
                      border: `1.5px solid ${a.border}`,
                      borderRadius: '8px',
                      color: a.color,
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      padding: '5px 11px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-1px)';
                      e.currentTarget.style.boxShadow = '0 3px 8px rgba(0,0,0,0.06)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'none';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div
            style={{
              textAlign: 'center',
              fontSize: '0.74rem',
              color: '#94a3b8',
              marginTop: '1.5rem',
            }}
          >
            Architect PMS · Enterprise Municipal Permissions Platform
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
